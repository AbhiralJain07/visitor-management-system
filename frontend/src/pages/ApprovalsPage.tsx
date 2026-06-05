import React, { useState, useEffect } from 'react';
import { db, type LocalVisit } from '@/offline/db';
import { getVisits, updateVisit } from '@/features/visits/api';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { type Visitor } from '@/types/api.types';
import { Check, X, User, Phone, Clock, FileText, Loader2, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';

import { type LocalVisitor } from '@/offline/db';

interface ResolvedVisit extends LocalVisit {
  visitor?: LocalVisitor;
}

export const ApprovalsPage: React.FC = () => {
  const isOnline = useNetworkStatus();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [pendingQueue, setPendingQueue] = useState<ResolvedVisit[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPendingQueue();
  }, [isOnline]);

  /**
   * Loads visits from DB/API, resolves visitor details, and filters for pending host requests
   */
  const loadPendingQueue = async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        try {
          const response = await getVisits();
if (response.success) {
  const visitsArray = Array.isArray(response.data) ? response.data : response.data?.data || [];
  await db.visits.clear();
  await db.visits.bulkPut(
    visitsArray.map((v: any) => ({
      ...v,
      id: v._id,
      visitor_id: typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id._id : v.visitor_id,
      host_id: typeof v.host_id === 'object' && v.host_id !== null ? v.host_id._id : v.host_id,
      office_id: typeof v.office_id === 'object' && v.office_id !== null ? v.office_id._id : v.office_id,
      localOnly: 0,
    }))
  );
}
        } catch (apiErr) {
          console.warn('API fetch failed, reading cached approvals:', apiErr);
        }
      }

      // Read from IndexedDB
      const allLocalVisits = await db.visits.toArray();

      // Resolve visitor sub-properties from local Dexie database
      const resolvedList: ResolvedVisit[] = await Promise.all(
        allLocalVisits.map(async (v) => {
          const visitorObj = await db.visitors.where('id').equals(v.visitor_id).first() 
            || await db.visitors.where('_id').equals(v.visitor_id).first();
          return {
            ...v,
            visitor: visitorObj
          };
        })
      );

      // Filter: only show PENDING visits.
      // E.g., regular employees only see visits where they are the host. Receptionist/admin see all.
      const filtered = resolvedList.filter((v) => {
        const isPending = v.status === 'pending';
        if (user?.role === 'employee') {
          return isPending && v.host_id === user.id;
        }
        return isPending;
      });

      setPendingQueue(filtered);
    } catch (err) {
      console.error('Failed to load approvals queue:', err);
      setErrorMsg('Could not fetch the approvals queue.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Action trigger to Approve or Reject a guest. Uses optimistic updates.
   */
  const handleDecision = async (visitId: string, decision: 'approved' | 'rejected') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Find the item to store for fallback in case of errors
    const originalItem = pendingQueue.find((item) => item.id === visitId || item._id === visitId);
    if (!originalItem) return;

    // 1. OPTIMISTIC UPDATE: Remove item from UI state immediately
    setPendingQueue((prev) => prev.filter((item) => item.id !== visitId && item._id !== visitId));

    try {
      if (isOnline) {
        // ONLINE FLOW
        const response = await updateVisit(visitId, { status: decision });
        if (response.success) {
          // Update local DB cache
          const dbId = originalItem.id || originalItem._id!;
          await db.visits.update(dbId, { status: decision });
          setSuccessMsg(`Guest check-in has been ${decision} successfully. ✅`);
        } else {
          throw new Error('Failed to update visit on backend.');
        }
      } else {
        // OFFLINE FLOW (Update IndexedDB state and queue syncOutbox)
        const dbId = originalItem.id || originalItem._id!;
        await db.visits.update(dbId, { status: decision, localOnly: 1 });

        // Add PUT action to sync queue outbox
        await db.syncOutbox.put({
          timestamp: Date.now(),
          action: 'CHECK_OUT', // We can use a general PUT status update payload or reuse action structures
          payload: {
            visitId: dbId,
            check_out: decision === 'approved' ? null : new Date().toISOString(),
            status: decision,
          },
          attempts: 0,
        });

        setSuccessMsg(`Offline: Visitor status set to ${decision}. Queued for sync when online.`);
      }
    } catch (err) {
      console.error('Failed to submit decision:', err);
      setErrorMsg('Failed to process visitor decision. Reverting change.');
      
      // Rollback optimistic update
      setPendingQueue((prev) => [originalItem, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Approvals Queue</h1>
          <div className="h-4 bg-slate-100 rounded w-1/4"></div>
        </div>

        {/* Skeleton cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-64 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-100 rounded w-full"></div>
                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Approvals Queue</h1>
        <p className="text-sm text-slate-500">
          {user?.role === 'employee'
            ? 'Confirm and authorize guests waiting to meet you.'
            : 'Facility-wide approvals waiting to be processed.'}
        </p>
      </div>

      {/* Action alerts */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm animate-fadeIn">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-sm">Success</h3>
            <p className="text-xs">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm animate-fadeIn">
          <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5 animate-pulse" />
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-sm">Error</h3>
            <p className="text-xs">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Pending Grid */}
      {pendingQueue.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100">
            <User size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-md font-bold text-slate-700">Approval Queue Clean</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No pending visitor requests. We will display new notifications here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pendingQueue.map((visit) => {
            const visitorName = visit.visitor?.name || 'Unknown Visitor';
            const visitorPhone = visit.visitor?.phone || 'N/A';
            const visitorIdNo = visit.visitor?.id_number || 'N/A';
            const photoUrl = visit.visitor?.photo_url;
            const visitId = visit._id || visit.id!;

            return (
              <div
                key={visitId}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                {/* Upper Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border-b border-slate-50 pb-3">
                    {/* Visitor Photo Avatar */}
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={visitorName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                        <User size={22} />
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-sm text-slate-800 truncate leading-snug">{visitorName}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Guest Visitor</p>
                    </div>
                  </div>

                  {/* Visit details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{visitorPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <FileText size={14} className="text-slate-400 shrink-0" />
                      <span>Govt ID: {visitorIdNo}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span>Check-in: {new Date(visit.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Purpose</span>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">{visit.purpose || 'Not Specifed'}</p>
                    </div>
                  </div>
                </div>

                {/* Approve/Reject touch buttons */}
                <div className="flex gap-2 pt-5 border-t border-slate-50 mt-4">
                  <button
                    onClick={() => handleDecision(visitId, 'rejected')}
                    className="flex-1 min-h-[48px] bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 border border-red-200 transition-colors"
                  >
                    <X size={15} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleDecision(visitId, 'approved')}
                    className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-md shadow-emerald-500/25 transition-all"
                  >
                    <Check size={15} />
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
