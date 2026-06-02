import { db, type SyncOperation } from './db';
import { httpClient } from '@/api/client';

class Synchronizer {
  private isSyncing = false;
  private readonly MAX_ATTEMPTS = 5;

  /**
   * Helper to convert Base64 string back to Blob for multipart file uploads
   */
  private base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
    const cleanBase64 = base64.includes('base64,') 
      ? base64.split('base64,')[1] 
      : base64;
      
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Triggers the background sync process. Iterates through the sync outbox,
   * replays operations, and isolates failed items exceeding retry boundaries.
   */
  public async triggerSync(): Promise<void> {
    if (this.isSyncing) return;
    if (!navigator.onLine) return;

    this.isSyncing = true;
    console.log('Background Sync: Started synchronization process...');

    try {
      // Get all operations from outbox in chronological order
      const allOps = await db.syncOutbox.orderBy('id').toArray();
      
      // Filter out operations that have exceeded the max attempts limit
      const eligibleOps = allOps.filter(op => op.attempts < this.MAX_ATTEMPTS);

      for (const op of eligibleOps) {
        if (!navigator.onLine) {
          console.warn('Background Sync: Network disconnected mid-sync. Aborting pass.');
          break;
        }

        const success = await this.processOperation(op);
        if (success) {
          await db.syncOutbox.delete(op.id!);
          console.log(`Background Sync: Operation ${op.id} (${op.action}) synced successfully and cleared.`);
        } else {
          const nextAttempts = op.attempts + 1;
          await db.syncOutbox.update(op.id!, { attempts: nextAttempts });
          
          if (nextAttempts >= this.MAX_ATTEMPTS) {
            console.error(`Background Sync: Operation ${op.id} (${op.action}) has failed ${nextAttempts} times and is flagged. Bypassing.`);
            // Bypassing failed element. Continue to the next item since this one is dead/invalid!
            continue;
          }

          // If it fails but has retries left, stop processing to prevent subsequent dependent operations from failing
          console.warn(`Background Sync: Operation ${op.id} failed. Postponing sync queue.`);
          break;
        }
      }
    } catch (error) {
      console.error('Background Sync Error:', error);
    } finally {
      this.isSyncing = false;
      console.log('Background Sync: Completed sync pass.');
    }
  }

  /**
   * Processes a single outbox operation. Handles photo uploads and resolves IDs.
   */
  private async processOperation(op: SyncOperation): Promise<boolean> {
    try {
      switch (op.action) {
        case 'CREATE_VISITOR': {
          const { localId, name, phone, id_number, photoBase64, email, company_name, id_type, address } = op.payload;
          
          // Prepare multipart/form-data
          const formData = new FormData();
          formData.append('name', name);
          formData.append('phone', phone);
          formData.append('id_number', id_number);
          if (email) formData.append('email', email);
          if (company_name) formData.append('company_name', company_name);
          if (id_type) formData.append('id_type', id_type);
          if (address) formData.append('address', address);

          if (photoBase64) {
            const photoBlob = this.base64ToBlob(photoBase64);
            formData.append('photo', photoBlob, `visitor_${localId}.jpg`);
          }

          // POST /api/visitors
          const response = await httpClient.post('/visitors', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          if (response.data.success) {
            const serverVisitor = response.data.data;
            const serverId = serverVisitor._id;

            // Update local visitor in IndexedDB
            await db.visitors.delete(localId);
            await db.visitors.put({
              ...serverVisitor,
              id: serverId,
              localOnly: 0,
            });

            // Resolve references in remaining outbox items
            await this.resolveOutboxVisitorReferences(localId, serverId);
            return true;
          }
          return false;
        }

        case 'CHECK_IN': {
          const { localId, visitor_id, host_id, office_id, purpose, notes, check_in } = op.payload;

          // Fail if visitor ID is still a local ID (should be resolved by CREATE_VISITOR first)
          if (visitor_id.startsWith('local-')) {
            console.error(`Check-in depends on unsynced visitor ID: ${visitor_id}`);
            return false;
          }

          // POST /api/visits
          const response = await httpClient.post('/visits', {
            visitor_id,
            host_id,
            office_id,
            purpose,
            notes,
            check_in,
            status: 'pending',
          });

          if (response.data.success) {
            const serverVisit = response.data.data;
            const serverId = serverVisit._id;

            // Update local visit in IndexedDB
            await db.visits.delete(localId);
            await db.visits.put({
              ...serverVisit,
              id: serverId,
              localOnly: 0,
            });

            // Resolve references in outbox
            await this.resolveOutboxVisitReferences(localId, serverId);
            return true;
          }
          return false;
        }

        case 'CHECK_OUT': {
          const { visitId, check_out } = op.payload;

          // Fail if visit ID is still a local ID
          if (visitId.startsWith('local-')) {
            console.error(`Check-out depends on unsynced visit ID: ${visitId}`);
            return false;
          }

          // PUT /api/visits/:id
          const response = await httpClient.put(`/visits/${visitId}`, {
            check_out,
            status: 'exited',
          });

          if (response.data.success) {
            const serverVisit = response.data.data;
            await db.visits.put({
              ...serverVisit,
              id: serverVisit._id,
              localOnly: 0,
            });
            return true;
          }
          return false;
        }

        default:
          console.error(`Unknown sync action: ${(op as any).action}`);
          return false;
      }
    } catch (error) {
      console.error(`Error processing sync operation ${op.id}:`, error);
      return false;
    }
  }

  /**
   * Replaces temporary local visitor IDs with server MongoDB ObjectIds in queued actions
   */
  private async resolveOutboxVisitorReferences(localId: string, serverId: string) {
    const ops = await db.syncOutbox.toArray();
    for (const op of ops) {
      if (op.action === 'CHECK_IN' && op.payload.visitor_id === localId) {
        op.payload.visitor_id = serverId;
        await db.syncOutbox.put(op);
      }
    }
  }

  /**
   * Replaces temporary local visit IDs with server MongoDB ObjectIds in queued actions (e.g. check-out)
   */
  private async resolveOutboxVisitReferences(localId: string, serverId: string) {
    const ops = await db.syncOutbox.toArray();
    for (const op of ops) {
      if (op.action === 'CHECK_OUT' && op.payload.visitId === localId) {
        op.payload.visitId = serverId;
        await db.syncOutbox.put(op);
      }
    }
  }
}

export const synchronizer = new Synchronizer();
