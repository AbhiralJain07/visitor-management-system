import { db, type LocalEmployee, type LocalOffice } from './db';
import { synchronizer } from './synchronizer';

export const offlineService = {
  /**
   * Returns cached employees (hosts) list
   */
  async getCachedEmployees(): Promise<LocalEmployee[]> {
    return db.employees.toArray();
  },

  /**
   * Returns cached office locations list
   */
  async getCachedOffices(): Promise<LocalOffice[]> {
    return db.offices.toArray();
  },

  /**
   * Returns total count of unsynced outbox actions
   */
  async getPendingQueueCount(): Promise<number> {
    return db.syncOutbox.count();
  },

  /**
   * Returns list of operations currently in the sync queue
   */
  async getPendingQueueItems() {
    return db.syncOutbox.orderBy('id').toArray();
  },

  /**
   * Manually triggers background outbox synchronization pass
   */
  async triggerManualSync(): Promise<void> {
    if (navigator.onLine) {
      await synchronizer.triggerSync();
    } else {
      throw new Error('Device is offline. Connection required to synchronize.');
    }
  },

  /**
   * Clears cached database tables (clean privacy purge on session signouts)
   */
  async clearCachedData(): Promise<void> {
    await Promise.all([
      db.visitors.clear(),
      db.visits.clear(),
      db.employees.clear(),
      db.offices.clear(),
      db.syncOutbox.clear(),
    ]);
    console.log('Local IndexedDB tables cleared successfully.');
  }
};

export default offlineService;
