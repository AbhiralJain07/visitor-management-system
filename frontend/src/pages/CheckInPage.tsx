import React, { useState, useEffect, useMemo } from 'react';
import {
  useVisitors,
  useVisits,
  useEmployees,
  useOffices,
  useCustomMasterData,
} from '@/features/tenant-admin/api/queryHooks';
import { CameraCapture } from '@/features/visitors/components/CameraCapture';
import { CheckInForm, type CheckInFormValues } from '@/features/visitors/components/CheckInForm';
import { VisitorProfile } from '@/features/visitors/components/VisitorProfile';
import { VisitorCard } from '@/features/visitors/components/VisitorCard';
import { ApprovalCard } from '@/features/visitors/components/ApprovalCard';
import { CheckoutDialog } from '@/features/visitors/components/CheckoutDialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useConfigStore } from '@/store/configStore';
import { offlineService } from '@/offline/offlineService';
import { db, type LocalOffice } from '@/offline/db';
import { type Visitor, type Visit } from '@/types/api.types';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Search,
  Wifi,
  WifiOff,
  Database,
  ArrowRightLeft,
  RefreshCw,
  UserX,
  History,
  Smartphone,
} from 'lucide-react';

export const CheckInPage: React.FC = () => {
  const isOnline = useNetworkStatus();
  const { selectedOffice } = useConfigStore();

  // Active Tab for Right Logs workspace: 'active' | 'pending' | 'search' | 'sync'
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'search' | 'sync'>('active');

  // Camera & Face scan workflow states
  const [step, setStep] = useState<'camera' | 'form'>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [identifiedVisitor, setIdentifiedVisitor] = useState<Visitor | null>(null);
  const [isIdentified, setIsIdentified] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'match_found' | 'no_match' | 'error'>('idle');

  // Search input state
  const [searchText, setSearchText] = useState('');

  // Dialog & Notification feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutVisit, setCheckoutVisit] = useState<Visit | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOpsCount, setPendingOpsCount] = useState(0);

  // Detail inspection modal
  const [selectedVisitorDetail, setSelectedVisitorDetail] = useState<Visitor | null>(null);

  // React Query data hooks
  const { employees: hosts, isLoading: isHostsLoading } = useEmployees({ limit: 1000 });
  const { offices, isLoading: isOfficesLoading } = useOffices();
  const { masterData, isLoading: isMasterLoading } = useCustomMasterData();

  // Polling visits every 10 seconds for real-time approvals at the reception desk
  const { visits, refetch: refetchVisits, isLoading: isVisitsLoading } = useVisits(undefined);
  const { visitors, createVisitor, isCreating: isVisitorCreating } = useVisitors();
  const { createVisit, updateVisit } = useVisits();

  // Setup auto-refresh polling for pending approvals
  useEffect(() => {
    const timer = setInterval(() => {
      refetchVisits();
      updateOutboxCount();
    }, 10000); // 10s interval
    return () => clearInterval(timer);
  }, [refetchVisits]);

  // Load initial outbox count
  useEffect(() => {
    updateOutboxCount();
  }, []);

  const updateOutboxCount = async () => {
    try {
      const count = await offlineService.getPendingQueueCount();
      setPendingOpsCount(count);
    } catch (err) {
      console.error('Failed to read outbox count:', err);
    }
  };

  /**
   * Helper to convert base64 image data into a File object for multipart uploads
   */
  const base64ToFile = (base64String: string, filename: string): File => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  /**
   * Trigger face scan identification
   */
  const handleFaceCapture = async (base64Image: string) => {
    setCapturedPhoto(base64Image);
    setErrorMsg(null);
    setIsBlacklisted(false);
    setScanStatus('scanning');

    if (!isOnline) {
      setErrorMsg('Notice: Offline mode. Skipping face biometric match. Please register manually.');
      setScanStatus('no_match');
      setIdentifiedVisitor(null);
      setIsIdentified(false);
      setStep('form');
      return;
    }

    try {
      const photoFile = base64ToFile(base64Image, 'visitor_face.jpg');
      
      // Call endpoint via VisitorService
      const result = await db.visitors.toArray(); // Fallback array scanning
      
      // Trigger identify API
      const response = await db.visitors.toArray(); // Local database pre-match
      
      // Call service layer directly
      const { VisitorService } = await import('@/services/api/visitor.service');
      const identifyResult = await VisitorService.identify(photoFile);

      if (identifyResult.found && identifyResult.visitor) {
        const matched = identifyResult.visitor;
        if (matched.is_blacklisted) {
          setIsBlacklisted(true);
          setIdentifiedVisitor(matched);
          setScanStatus('error');
          setErrorMsg(`Security Alert: Guest ${matched.name} is blacklisted!`);
        } else {
          setIdentifiedVisitor(matched);
          setIsIdentified(true);
          setScanStatus('match_found');
          // Automatically navigate to form
          setTimeout(() => {
            setStep('form');
          }, 800);
        }
      } else {
        setIdentifiedVisitor(null);
        setIsIdentified(false);
        setScanStatus('no_match');
        setTimeout(() => {
          setStep('form');
        }, 800);
      }
    } catch (err) {
      console.error('Face recognition scan failed:', err);
      setErrorMsg('Biometric recognition service offline. Proceeding to manual registration.');
      setIdentifiedVisitor(null);
      setIsIdentified(false);
      setScanStatus('no_match');
      setTimeout(() => {
        setStep('form');
      }, 800);
    }
  };

  /**
   * Submit registration and check-in visit
   */
  const handleCheckInSubmit = async (formData: CheckInFormValues) => {
    if (!selectedOffice) {
      setErrorMsg('Office Location Error: Please select an office branch from the header first.');
      return;
    }

    setErrorMsg(null);
    const checkInTime = new Date().toISOString();

    try {
      let visitorId = '';

      if (isIdentified && identifiedVisitor) {
        visitorId = identifiedVisitor._id;
      } else {
        // Register visitor first via mutation
        let photoFile: File | undefined = undefined;
        if (capturedPhoto) {
          photoFile = base64ToFile(capturedPhoto, 'new_visitor.jpg');
        }

        const visitorRes = await createVisitor({
          name: formData.name,
          phone: formData.phone,
          id_number: formData.id_number,
          email: formData.email,
          company_name: formData.company_name,
          id_type: formData.id_type,
          address: formData.address,
          photo: photoFile,
          photoBase64: capturedPhoto || undefined,
        } as any);

        visitorId = visitorRes._id;
      }

      // Register visit log via mutation
      await createVisit({
        visitor_id: visitorId,
        host_id: formData.host_id,
        office_id: formData.office_id,
        purpose: formData.purpose,
        notes: formData.notes,
        check_in: checkInTime,
        status: 'pending',
      });

      setSuccessMsg(
        isOnline
          ? `Check-in requested successfully! Host notification has been sent. ✅`
          : `Offline check-in saved locally! Sync will trigger when internet is restored.`
      );
      handleReset();
      updateOutboxCount();
    } catch (err: any) {
      console.error('Check-in processing error:', err);
      setErrorMsg(err.message || 'Check-in transaction failed. Please review values and retry.');
    }
  };

  /**
   * Handle checkout click
   */
  const handleCheckoutClick = (visit: Visit) => {
    setCheckoutVisit(visit);
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutVisit) return;
    setIsCheckoutLoading(true);
    try {
      await updateVisit({
        id: checkoutVisit._id,
        payload: {
          check_out: new Date().toISOString(),
          status: 'exited',
        },
      });
      setSuccessMsg(`Guest ${((checkoutVisit.visitor_id) as Visitor)?.name} checked out successfully.`);
      setCheckoutVisit(null);
      refetchVisits();
      updateOutboxCount();
    } catch (err: any) {
      console.error('Failed to checkout guest:', err);
      setErrorMsg('Checkout failed. Please try again.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  /**
   * Trigger Manual Outbox sync
   */
  const handleManualSync = async () => {
    if (!isOnline) {
      setErrorMsg('Cannot sync. Connection required to synchronize.');
      return;
    }
    setIsSyncing(true);
    setErrorMsg(null);
    try {
      await offlineService.triggerManualSync();
      setSuccessMsg('IndexedDB outbox synced successfully with the cloud backend! ☁️');
      refetchVisits();
      updateOutboxCount();
    } catch (err: any) {
      console.error('Sync failed:', err);
      setErrorMsg(err.message || 'Sync failed. Review network connectivity.');
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Fast check-in re-use for recent or frequent guests
   */
  const handleQuickRecheckIn = (visitor: Visitor) => {
    setIdentifiedVisitor(visitor);
    setIsIdentified(true);
    setCapturedPhoto(visitor.photo_url || null);
    setStep('form');
  };

  const handleReset = () => {
    setStep('camera');
    setCapturedPhoto(null);
    setIdentifiedVisitor(null);
    setIsIdentified(false);
    setIsBlacklisted(false);
    setScanStatus('idle');
  };

  // Extract purposes list
  const parsedPurposes = useMemo(() => {
    if (masterData && masterData.length > 0) {
      return masterData.filter((item) => item.type === 'purpose' && item.is_active).map((item) => item.name);
    }
    return ['Meeting', 'Interview', 'Delivery', 'Service Visit', 'Personal', 'Other'];
  }, [masterData]);

  // Compute active, pending, and search filters
  const computedVisits = useMemo(() => {
    if (!visits) return { active: [], pending: [], searchResults: [] };

    // Today's boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const active = visits.filter(
      (v) =>
        v.status === 'approved' &&
        !v.check_out &&
        new Date(v.check_in) >= todayStart
    );

    const pending = visits.filter(
      (v) =>
        v.status === 'pending' &&
        new Date(v.check_in) >= todayStart
    );

    // Search query matches
    let searchResults: Visitor[] = [];
    if (searchText.trim().length >= 2) {
      const query = searchText.toLowerCase();
      // Search from visitors query
      if (visitors) {
        searchResults = (Array.isArray(visitors) ? visitors : []).filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.phone.includes(query) ||
            v.id_number.toLowerCase().includes(query)
        );
      }
    }

    return { active, pending, searchResults };
  }, [visits, visitors, searchText]);

  // Filter out frequent guests (guests visited > 2 times)
  const frequentGuests = useMemo(() => {
    if (!visits || !visitors) return [];
    const countMap: Record<string, number> = {};
    visits.forEach((v) => {
      const vId = typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id._id : v.visitor_id;
      if (vId) {
        countMap[vId] = (countMap[vId] || 0) + 1;
      }
    });

    const visitorArr = Array.isArray(visitors) ? visitors : [];
    return visitorArr
      .filter((v) => countMap[v._id] >= 2 && !v.is_blacklisted)
      .slice(0, 6);
  }, [visits, visitors]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner Control Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <Smartphone className="text-blue-600 animate-pulse shrink-0" size={22} />
            <span className="truncate">Receptionist Workspace</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium truncate">
            Desk: <span className="font-bold text-slate-700">{selectedOffice?.name || 'General Desk'}</span> | Branch: {selectedOffice?.city || 'N/A'}
          </p>
        </div>

        {/* Sync Status bar */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Network tag */}
          <div className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 text-xs ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {isOnline ? <Wifi size={13} className="text-emerald-600" /> : <WifiOff size={13} className="text-red-600 animate-bounce" />}
            {isOnline ? 'Online' : 'Offline Mode'}
          </div>

          {/* Sync tag */}
          {pendingOpsCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-amber-100 transition-colors shadow-sm text-xs"
            >
              <Database size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{pendingOpsCount} Pending</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Alert notifications */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm animate-fadeIn">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm animate-fadeIn">
          <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs font-bold">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 text-xs font-bold">dismiss</button>
        </div>
      )}

      {/* Blacklist Critical overlay lock */}
      {isBlacklisted && identifiedVisitor && (
        <div className="bg-red-50 text-red-950 border border-red-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto shadow-xl animate-fadeIn border-l-8 border-l-red-600">
          <UserX size={56} className="text-red-600 animate-bounce" />
          <div className="space-y-1">
            <h2 className="text-xl font-black text-red-900 uppercase tracking-tight">🚨 Blacklist Security Alert</h2>
            <p className="text-sm font-bold text-slate-800">
              The matching individual <span className="font-extrabold text-red-600">{identifiedVisitor.name}</span> is blacklisted.
            </p>
            <p className="text-xs text-slate-500">
              ID Sequence: {identifiedVisitor.id_number} | Phone: {identifiedVisitor.phone}
            </p>
          </div>
          <div className="bg-red-100/60 p-4 rounded-xl text-xs font-medium max-w-md border border-red-200 text-red-950">
            Automated check-in protocols have been disabled for security reasons. Please contact security personnel or office admins immediately.
          </div>
          <button
            onClick={handleReset}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Acknowledge & Scan Next Guest
          </button>
        </div>
      )}

      {/* Main split grid panel */}
      {!isBlacklisted && (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* LEFT WORKSPACE PANEL (Main registration / Face scan scanner) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 w-full">
            {step === 'camera' ? (
              <CameraCapture
                onCapture={handleFaceCapture}
                onSkipScan={() => setStep('form')}
                isLoading={scanStatus === 'scanning'}
                scanStatus={scanStatus}
                errorMessage={errorMsg}
                identifiedName={identifiedVisitor?.name}
              />
            ) : (
              <CheckInForm
                initialData={identifiedVisitor}
                isIdentified={isIdentified}
                hosts={hosts || []}
                offices={(offices as LocalOffice[]) || []}
                purposes={parsedPurposes}
                onSubmit={handleCheckInSubmit}
                onReset={handleReset}
                isLoading={isVisitorCreating}
              />
            )}
          </div>

          {/* RIGHT WORKSPACE PANEL (Logs, Approvals, Outbox) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[400px] lg:min-h-[500px] w-full">
            {/* Tab selection bar */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 p-2.5 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
                  activeTab === 'active'
                    ? 'bg-white text-blue-600 shadow-sm border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <Users size={14} />
                <span>Active</span>
                {computedVisits.active.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                    {computedVisits.active.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
                  activeTab === 'pending'
                    ? 'bg-white text-blue-600 shadow-sm border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <Clock size={14} />
                <span>Approvals</span>
                {computedVisits.pending.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                    {computedVisits.pending.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
                  activeTab === 'search'
                    ? 'bg-white text-blue-600 shadow-sm border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <Search size={14} />
                <span>Lookup</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border relative ${
                  activeTab === 'sync'
                    ? 'bg-white text-blue-600 shadow-sm border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <ArrowRightLeft size={14} />
                <span>Outbox</span>
                {pendingOpsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </button>
            </div>

            {/* Tab scrollable area */}
            <div className="p-3 sm:p-4 flex-1 overflow-y-auto max-h-[400px] lg:max-h-[550px] custom-scrollbar space-y-4">
              {/* TAB 1: ACTIVE VISITORS */}
              {activeTab === 'active' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Facility Guests</h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Today</span>
                  </div>

                  {isVisitsLoading ? (
                    <LoadingSkeleton type="row" count={3} />
                  ) : computedVisits.active.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Users className="mx-auto text-slate-300" size={32} />
                      <p className="text-xs font-semibold">No checked-in guests inside the facility.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3.5">
                      {computedVisits.active.map((visit) => (
                        <VisitorCard
                          key={visit._id}
                          visit={visit}
                          onCheckout={handleCheckoutClick}
                          onViewDetails={(v) => setSelectedVisitorDetail(v.visitor_id as Visitor)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PENDING APPROVALS QUEUE */}
              {activeTab === 'pending' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Awaiting Verification</h3>
                    <button
                      onClick={() => refetchVisits()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Refresh
                    </button>
                  </div>

                  {isVisitsLoading ? (
                    <LoadingSkeleton type="row" count={2} />
                  ) : computedVisits.pending.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Clock className="mx-auto text-slate-300 animate-pulse" size={32} />
                      <p className="text-xs font-semibold">Verification queue is empty.</p>
                      <p className="text-[10px]">All visitor approvals are cleared.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3.5">
                      {computedVisits.pending.map((visit) => (
                        <ApprovalCard
                          key={visit._id}
                          visit={visit}
                          onViewDetails={(v) => setSelectedVisitorDetail(v.visitor_id as Visitor)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SEARCH & QUICK ACTIONS */}
              {activeTab === 'search' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Search Bar Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Search Visitor Records</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={16} /></span>
                      <input
                        type="text"
                        placeholder="Search name, phone, or ID..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Search Results list */}
                  {searchText.trim().length >= 2 && (
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Matches</h4>
                      {computedVisits.searchResults.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No search results matching "{searchText}".</p>
                      ) : (
                        <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                          {computedVisits.searchResults.map((v) => (
                            <div
                              key={v._id}
                              onClick={() => handleQuickRecheckIn(v)}
                              className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
                            >
                              <div>
                                <h5 className="text-xs font-bold text-slate-800">{v.name}</h5>
                                <p className="text-[10px] text-slate-500 font-semibold">{v.phone} | {v.company_name || 'Individual'}</p>
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-100 px-2 py-1 rounded-lg">Check-In</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Frequent Guests Grid Actions */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <History size={12} className="text-slate-400" />
                      Frequent Guests (Quick Check-In)
                    </h4>
                    {frequentGuests.length === 0 ? (
                      <p className="text-xs text-slate-400">Guests with multiple visits will appear here for one-click check-ins.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {frequentGuests.map((v) => (
                          <div
                            key={v._id}
                            onClick={() => handleQuickRecheckIn(v)}
                            className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 p-3 rounded-xl cursor-pointer text-left transition-all active:scale-[0.97]"
                          >
                            <h5 className="text-xs font-bold text-slate-800 truncate">{v.name}</h5>
                            <span className="text-[10px] font-semibold text-slate-500 truncate block">{v.company_name || 'Individual'}</span>
                            <span className="text-[9px] text-blue-600 font-bold block mt-1">One-tap tap →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: OFFLINE SYNC OUTBOX QUEUE */}
              {activeTab === 'sync' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                    <Database size={36} className="text-amber-500 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Dexie IndexedDB Sync Queue</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        We save visitor credentials locally in the tablet storage when connectivity drops.
                      </p>
                    </div>

                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing || pendingOpsCount === 0}
                      className="min-h-[44px] w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="animate-spin" size={13} />
                          <span>Syncing Outbox Queue...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={13} />
                          <span>Sync Pending Outbox Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Outbox Items Queue list */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queued Actions ({pendingOpsCount})</h3>
                    {pendingOpsCount === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-6">Outbox queue is empty. System is synchronized.</p>
                    ) : (
                      <div className="space-y-2">
                        {/* We fetch items asynchronously, displaying a simple counter or status logs */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                          <p className="font-bold text-slate-700">Pending Actions Queue:</p>
                          <p className="text-[11px]">Actions will replay in order. Local visitor IDs resolve to database ObjectIds dynamically.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog overlays */}
      <CheckoutDialog
        isOpen={!!checkoutVisit}
        onClose={() => setCheckoutVisit(null)}
        onConfirm={handleCheckoutConfirm}
        visitorName={checkoutVisit ? ((checkoutVisit.visitor_id as Visitor)?.name || 'this visitor') : ''}
        isLoading={isCheckoutLoading}
      />

      {/* Visitor Profile inspect details Modal overlay */}
      {selectedVisitorDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Visitor Profile Detail</h3>
              <button
                onClick={() => setSelectedVisitorDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                x
              </button>
            </div>
            <div className="p-6">
              <VisitorProfile visitor={selectedVisitorDetail} lastVisitDate={selectedVisitorDetail.createdAt} />
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedVisitorDetail(null)}
                className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
