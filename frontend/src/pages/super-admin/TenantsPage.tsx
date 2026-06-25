import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Eye, Edit2, ShieldX, Check, Trash2, X, AlertTriangle, Users, Copy, EyeOff, KeyRound } from 'lucide-react';
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant } from '@/features/super-admin/api/queryHooks';
import { tenantFormSchema, type TenantFormFields } from '@/features/super-admin/schemas';
import { type TenantCompany, type SubscriptionPlan, type TenantStatus } from '@/features/super-admin/types';
import { usePermissions } from '@/features/super-admin/hooks/usePermissions';
import { PermissionGuard } from '@/features/super-admin/components/PermissionGuard';
import {
  PageHeader,
  DataTable,
  SearchBar,
  StatusBadge,
  ConfirmationDialog,
  EmptyState,
} from '@/features/super-admin/components/UIComponents';

export const TenantsPage: React.FC = () => {
  const { hasPermission } = usePermissions();

  // Search & filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack queries
  const { data: companies = [], isLoading, isError, refetch } = useTenants(search, statusFilter);
  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();
  const deleteTenantMutation = useDeleteTenant();

  // Drawers and Modals states
  const [selectedTenant, setSelectedTenant] = useState<TenantCompany | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [planChangeTenant, setPlanChangeTenant] = useState<{ id: string; currentPlan: SubscriptionPlan; newPlan: SubscriptionPlan } | null>(null);
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // React Hook Form for Company
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TenantFormFields>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: '',
      subscriptionPlan: 'Basic',
      maxUsers: 50,
      status: 'Active',
      adminPassword: '',
    },
  });

  // Action helpers
  const handleOpenAddModal = () => {
    reset({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: '',
      subscriptionPlan: 'Basic',
      maxUsers: 50,
      status: 'Active',
      adminPassword: '',
    });
    setIsEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (company: TenantCompany) => {
    reset({
      name: company.name,
      code: company.code,
      contactPerson: company.contactPerson,
      email: company.email,
      phone: company.phone,
      address: company.address,
      gstNumber: company.gstNumber || '',
      subscriptionPlan: company.subscriptionPlan,
      maxUsers: company.maxUsers,
      status: company.status,
      adminPassword: '',
    });
    setIsEditMode(true);
    setSelectedTenant(company);
    setIsFormModalOpen(true);
  };

  const onSubmitForm = async (data: TenantFormFields) => {
    try {
      if (isEditMode && selectedTenant) {
        await updateTenantMutation.mutateAsync({
          id: selectedTenant._id,
          payload: data,
        });
        setIsFormModalOpen(false);
        setSelectedTenant(null);
      } else {
        const result = await createTenantMutation.mutateAsync(data);
        setIsFormModalOpen(false);
        setSelectedTenant(null);
        // Show credentials modal if returned
        if (result?.adminCredentials) {
          setAdminCredentials(result.adminCredentials);
          setShowAdminPassword(false);
        }
      }
    } catch (error) {
      console.error('Failed to submit company details:', error);
    }
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenDrawer = (company: TenantCompany) => {
    setSelectedTenant(company);
    setIsDetailDrawerOpen(true);
  };

  const handleToggleStatus = async (company: TenantCompany) => {
    const nextStatus: TenantStatus = company.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await updateTenantMutation.mutateAsync({
        id: company._id,
        payload: { status: nextStatus },
      });
      // Update local drawer state if open
      if (selectedTenant && selectedTenant._id === company._id) {
        setSelectedTenant({ ...selectedTenant, status: nextStatus });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteTenantMutation.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
      if (isDetailDrawerOpen && selectedTenant?._id === deleteConfirmId) {
        setIsDetailDrawerOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlanChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>, company: TenantCompany) => {
    const newPlan = e.target.value as SubscriptionPlan;
    if (newPlan === company.subscriptionPlan) return;
    setPlanChangeTenant({
      id: company._id,
      currentPlan: company.subscriptionPlan,
      newPlan,
    });
  };

  const handleConfirmPlanChange = async () => {
    if (!planChangeTenant) return;
    try {
      await updateTenantMutation.mutateAsync({
        id: planChangeTenant.id,
        payload: { subscriptionPlan: planChangeTenant.newPlan },
      });
      if (selectedTenant && selectedTenant._id === planChangeTenant.id) {
        setSelectedTenant({ ...selectedTenant, subscriptionPlan: planChangeTenant.newPlan });
      }
      setPlanChangeTenant(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Company Code',
      accessor: (row: TenantCompany) => (
        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md select-all">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Company Name',
      accessor: (row: TenantCompany) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm leading-tight">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">{row.subscriptionPlan} Plan</span>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (row: TenantCompany) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-slate-700">{row.contactPerson}</span>
          <span className="text-slate-400">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Phone / GST',
      accessor: (row: TenantCompany) => (
        <div className="flex flex-col text-xs text-slate-500">
          <span>{row.phone}</span>
          {row.gstNumber && <span className="font-mono text-[10px] text-slate-400">GST: {row.gstNumber}</span>}
        </div>
      ),
    },
    {
      header: 'Users Active',
      accessor: (row: TenantCompany) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Users size={14} className="text-slate-400" />
          <span>
            <span className="font-bold text-slate-800">{row.activeUsers}</span>/{row.maxUsers}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: TenantCompany) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: TenantCompany) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenDrawer(row)}
            className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          
          <PermissionGuard action="tenants:write">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
              title="Edit Profile"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleToggleStatus(row)}
              className={`p-1 border rounded transition-colors shadow-xs ${
                row.status === 'Active'
                  ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                  : 'border-green-200 bg-white text-green-600 hover:bg-green-50'
              }`}
              title={row.status === 'Active' ? 'Suspend Tenant' : 'Activate Tenant'}
            >
              {row.status === 'Active' ? <ShieldX size={14} /> : <Check size={14} />}
            </button>
          </PermissionGuard>

          <PermissionGuard action="tenants:delete">
            <button
              onClick={() => setDeleteConfirmId(row._id)}
              className="p-1 border border-red-100 rounded bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs"
              title="Delete Tenant"
            >
              <Trash2 size={14} />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tenants Management"
        description="Oversee corporate company directories, subscription metrics, maximum user quotas, and global activation policies."
        action={
          <PermissionGuard action="tenants:write">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              <Plus size={15} />
              <span>Add Company</span>
            </button>
          </PermissionGuard>
        }
      />

      {/* Control Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          placeholder="Search by company, code, email..."
        />

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
          <span>Filter Status:</span>
          {['All', 'Active', 'Suspended', 'Pending'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all shadow-xs ${
                statusFilter === status
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Companies Table */}
      <DataTable
        columns={columns}
        data={companies}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={1}
        emptyState={
          <EmptyState
            title="No Companies Found"
            description="No client companies matched your search keywords or status filters."
          />
        }
      />

      {/* ==========================================================
         ADD / EDIT COMPANY MODAL
         ========================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsFormModalOpen(false)}></div>
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-md font-bold text-slate-950">
                {isEditMode ? 'Edit Tenant Company' : 'Add New Tenant Company'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Company Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Acme India Pvt Ltd"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] font-semibold text-red-600">{errors.name.message}</p>}
                </div>

                {/* Company Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Unique Code</label>
                  <input
                    type="text"
                    {...register('code')}
                    disabled={isEditMode}
                    placeholder="ACME_IND"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                      errors.code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.code && <p className="text-[10px] font-semibold text-red-600">{errors.code.message}</p>}
                </div>

                {/* Contact Person */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Contact Person</label>
                  <input
                    type="text"
                    {...register('contactPerson')}
                    placeholder="Rajesh Kumar"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.contactPerson ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.contactPerson && <p className="text-[10px] font-semibold text-red-600">{errors.contactPerson.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Contact Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="contact@company.com"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] font-semibold text-red-600">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Contact Phone</label>
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="+919876543210"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] font-semibold text-red-600">{errors.phone.message}</p>}
                </div>

                {/* GSTIN */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    {...register('gstNumber')}
                    placeholder="22AAAAA1111A1Z1"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.gstNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.gstNumber && <p className="text-[10px] font-semibold text-red-600">{errors.gstNumber.message}</p>}
                </div>

                {/* Plan */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Subscription Plan</label>
                  <select
                    {...register('subscriptionPlan')}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    {['Basic', 'Standard', 'Premium', 'Enterprise'].map((plan) => (
                      <option key={plan} value={plan}>
                        {plan} Plan
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max User Quota */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Max User Quota</label>
                  <input
                    type="number"
                    {...register('maxUsers', { valueAsNumber: true })}
                    placeholder="100"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.maxUsers ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.maxUsers && <p className="text-[10px] font-semibold text-red-600">{errors.maxUsers.message}</p>}
                </div>

                {/* Status */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">Account Status</label>
                  <select
                    {...register('status')}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
                </div>

                {/* Admin Password (only shown on create) */}
                {!isEditMode && (
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700 block">Initial Admin Password (Optional)</label>
                      <span className="text-[10px] text-slate-400">Leave blank to auto-generate</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        {...register('adminPassword')}
                        placeholder="••••••••"
                        className={`w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                          errors.adminPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.adminPassword && <p className="text-[10px] font-semibold text-red-600">{errors.adminPassword.message}</p>}
                  </div>
                )}

                {/* Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">Corporate Address</label>
                  <textarea
                    {...register('address')}
                    rows={2}
                    placeholder="Building, street, sector, city, state, pincode"
                    className={`w-full text-sm bg-slate-50/50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.address && <p className="text-[10px] font-semibold text-red-600">{errors.address.message}</p>}
                </div>
              </div>

              {/* Submit footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTenantMutation.isPending || updateTenantMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {(createTenantMutation.isPending || updateTenantMutation.isPending) && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{isEditMode ? 'Save Changes' : 'Register Tenant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
         COMPANY DETAILS DRAWER
         ========================================================== */}
      {isDetailDrawerOpen && selectedTenant && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsDetailDrawerOpen(false)}
          ></div>

          {/* Drawer container */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full z-10 animate-slideRight">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200/80 bg-slate-50/30">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tenant Directory Profile</span>
                <h3 className="text-sm font-bold text-slate-900 truncate">{selectedTenant.name}</h3>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
              
              {/* Subscription Summary Card */}
              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg border border-slate-700/50 space-y-4 select-none relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <Plus size={120} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Current Plan</span>
                    <h4 className="text-lg font-extrabold text-blue-400">{selectedTenant.subscriptionPlan}</h4>
                  </div>
                  <StatusBadge status={selectedTenant.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-700/60 pt-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Active / Max Users</span>
                    <span className="text-sm font-extrabold text-white">
                      {selectedTenant.activeUsers} <span className="text-slate-400 font-medium text-xs">/ {selectedTenant.maxUsers}</span>
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Company Code</span>
                    <span className="text-sm font-mono font-bold text-white select-all">{selectedTenant.code}</span>
                  </div>
                </div>
              </div>

              {/* Upgrade/Downgrade controls */}
              <PermissionGuard action="tenants:write">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-slate-800 block">Manage Subscription</span>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold block uppercase">Modify Current Plan Level</label>
                    <select
                      value={selectedTenant.subscriptionPlan}
                      onChange={(e) => handlePlanChangeSelect(e, selectedTenant)}
                      className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-2 cursor-pointer focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {['Basic', 'Standard', 'Premium', 'Enterprise'].map((p) => (
                        <option key={p} value={p}>
                          {p} Plan
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </PermissionGuard>

              {/* Company Info List */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">Organizational Details</h4>
                <div className="grid grid-cols-1 gap-3.5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Contact Person</span>
                    <span className="font-bold text-slate-800">{selectedTenant.contactPerson}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Work Email Address</span>
                    <span className="font-bold text-slate-800 select-all">{selectedTenant.email}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Phone Number</span>
                    <span className="font-bold text-slate-800 select-all">{selectedTenant.phone}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">GSTIN Registration</span>
                    <span className="font-mono font-bold text-slate-800 select-all">{selectedTenant.gstNumber || 'Not Configured'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Registered Corporate Address</span>
                    <span className="font-medium text-slate-600 block leading-relaxed">{selectedTenant.address}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Creation Date</span>
                    <span className="font-medium text-slate-700">
                      {new Date(selectedTenant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <PermissionGuard action="tenants:write">
                <button
                  onClick={() => {
                    handleOpenEditModal(selectedTenant);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded-lg text-center transition-colors shadow-sm"
                >
                  Edit Profile
                </button>
              </PermissionGuard>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-3 rounded-lg text-center transition-colors shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
         CONFIRMATION DIALOG: DELETE COMPANY
         ========================================================== */}
      <ConfirmationDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenant Account"
        message="Are you absolutely sure you want to delete this tenant company? All database records, office kiosk setups, and active user credentials will be permanently erased. This operation cannot be undone."
        confirmText="Yes, Delete Tenant"
        cancelText="Discard"
        variant="danger"
      />

      {/* ==========================================================
         CONFIRMATION DIALOG: UPGRADE/DOWNGRADE SUBSCRIPTION PLAN
         ========================================================== */}
      <ConfirmationDialog
        isOpen={!!planChangeTenant}
        onClose={() => setPlanChangeTenant(null)}
        onConfirm={handleConfirmPlanChange}
        title="Confirm Plan Change"
        message={`Are you sure you want to change the subscription plan level of this tenant company from ${planChangeTenant?.currentPlan} to ${planChangeTenant?.newPlan}? This may restrict active user thresholds or unlock additional VMS features.`}
        confirmText="Confirm Level Change"
        cancelText="Discard Change"
        variant="warning"
      />

      {/* ==========================================================
         ADMIN CREDENTIALS MODAL (shown after tenant creation)
         ========================================================== */}
      {adminCredentials && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setAdminCredentials(null)} />
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl relative z-10 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Tenant Created Successfully!</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">Admin login credentials — save them now</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                <strong>This password is shown only once.</strong> Copy and share it securely with the tenant admin. It cannot be retrieved later.
              </p>
            </div>

            {/* Credentials */}
            <div className="p-6 space-y-3">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Login Email</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <span className="text-sm font-semibold text-slate-800 flex-1 select-all">{adminCredentials.email}</span>
                  <button
                    onClick={() => handleCopyToClipboard(adminCredentials.email, 'email')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    title="Copy email"
                  >
                    {copiedField === 'email' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Login Password</label>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-emerald-800 flex-1 font-mono select-all tracking-wider">
                    {adminCredentials.password}
                  </span>
                  <button
                    onClick={() => handleCopyToClipboard(adminCredentials.password, 'password')}
                    className="p-1.5 rounded-lg hover:bg-emerald-200 text-emerald-500 hover:text-emerald-700 transition-colors shrink-0"
                    title="Copy password"
                  >
                    {copiedField === 'password' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Copy All */}
              <button
                onClick={() => handleCopyToClipboard(`Email: ${adminCredentials.email}\nPassword: ${adminCredentials.password}`, 'all')}
                className="w-full mt-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl py-2.5 text-xs font-bold transition-colors"
              >
                {copiedField === 'all' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copiedField === 'all' ? 'Copied!' : 'Copy Both Credentials'}
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setAdminCredentials(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                I have saved the credentials — Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsPage;
