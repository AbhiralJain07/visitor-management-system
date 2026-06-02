import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOffices } from '@/features/tenant-admin/api/queryHooks';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { officeFormSchema, type OfficeFormValues } from '@/features/tenant-admin/schemas';
import { Plus, Search, Edit2, Trash2, X, Building, Check, Power, AlertTriangle, Eye } from 'lucide-react';

export const OfficesPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [searchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { offices, pagination, isLoading, createOffice, updateOffice, deleteOffice } = useOffices({
    page,
    limit,
    search: searchQuery,
    is_active: statusFilter === 'all' ? 'all' : statusFilter === 'active' ? true : false,
  });

  const [selectedOffice, setSelectedOffice] = useState<any | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any | null>(null);

  // Sync search bar with query parameter from universal search
  useEffect(() => {
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [qParam]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OfficeFormValues>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: {
      name: '',
      city: '',
      address: '',
      is_active: true,
    },
  });

  // Handle open modal for creation
  const handleOpenCreate = () => {
    setEditingOffice(null);
    reset({
      name: '',
      city: '',
      address: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (office: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOffice(office);
    reset({
      name: office.name,
      city: office.city,
      address: office.address,
      is_active: office.is_active,
    });
    setModalOpen(true);
  };

  // Handle delete office
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this office branch?')) {
      try {
        await deleteOffice(id);
        if (selectedOffice?._id === id) {
          setSelectedOffice(null);
        }
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  // Submit handler
  const onSubmit = async (data: OfficeFormValues) => {
    try {
      if (editingOffice) {
        await updateOffice({ id: editingOffice._id, payload: data });
      } else {
        await createOffice(data);
      }
      setModalOpen(false);
      setEditingOffice(null);
    } catch (err) {
      console.error('Form submission failed:', err);
    }
  };

  // Filtered offices list
  const filteredOffices = offices;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Office Management</h1>
          <p className="text-sm text-slate-500">Configure corporate offices, branches, and active digital reception sites.</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 cursor-pointer transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Add Office</span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by office name, city, address..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-mono font-bold"
            >
              x
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center space-x-1.5 self-start md:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'inactive' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Inactive Only
          </button>
        </div>
      </div>

      {/* Layout Grid: List vs Details Drawer */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Table/List panel */}
        <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${selectedOffice ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-300`}>
          {/* Desktop/Tablet Table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Office Name</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      Loading office databases...
                    </td>
                  </tr>
                ) : filteredOffices.length > 0 ? (
                  filteredOffices.map((office) => (
                    <tr
                      key={office._id}
                      onClick={() => setSelectedOffice(office)}
                      className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                        selectedOffice?._id === office._id ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                          <Building size={14} />
                        </div>
                        <span className="truncate max-w-[200px]">{office.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{office.city}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-[250px] truncate">{office.address}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          office.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${office.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {office.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOffice(office);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => handleOpenEdit(office, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                                title="Edit Office"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(office._id, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                title="Delete Office"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 space-y-2">
                      <AlertTriangle className="mx-auto text-slate-300" size={24} />
                      <p className="text-xs font-semibold">No office branches found</p>
                      <p className="text-[10px] text-slate-400">Refine search criteria or register a new office.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list view */}
          <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/20">
            {isLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Loading office databases...
              </div>
            ) : filteredOffices.length > 0 ? (
              filteredOffices.map((office) => (
                <div
                  key={office._id}
                  onClick={() => setSelectedOffice(office)}
                  className={`p-4 space-y-3 hover:bg-slate-50/60 cursor-pointer transition-colors ${
                    selectedOffice?._id === office._id ? 'bg-blue-50/20 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                        <Building size={14} />
                      </div>
                      <span className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{office.name}</span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                        office.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {office.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">City</span>
                      <span>{office.city}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Address</span>
                      <span className="truncate block max-w-[120px]">{office.address}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOffice(office);
                      }}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-xs transition-colors"
                    >
                      <Eye size={13} />
                      View Details
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(office, e)}
                          className="flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold text-xs transition-colors"
                        >
                          <Edit2 size={13} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(office._id, e)}
                          className="min-h-[44px] flex items-center justify-center p-2.5 bg-red-50 border border-red-250 hover:bg-red-100 rounded-xl text-red-750 font-bold text-xs transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <AlertTriangle className="mx-auto text-slate-300" size={24} />
                <p className="text-xs font-semibold">No offices found</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-slate-600 transition-all font-semibold min-h-[36px]"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-600 font-semibold">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-slate-600 transition-all font-semibold min-h-[36px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Backdrop for Mobile/Tablet details overlay */}
        {selectedOffice && (
          <div
            onClick={() => setSelectedOffice(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Details Drawer Panel */}
        {selectedOffice && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-2xl space-y-6 animate-slideIn fixed inset-x-0 bottom-0 top-16 md:inset-y-0 md:right-0 md:left-auto md:w-[460px] lg:relative lg:inset-auto lg:w-auto lg:col-span-1 z-50 overflow-y-auto custom-scrollbar shadow-blue-500/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800">Office Details</h2>
              <button
                onClick={() => setSelectedOffice(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-405 hover:text-slate-600 transition-colors font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{selectedOffice.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{selectedOffice.city}</p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 space-y-3">
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Address Location</h4>
                  <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">{selectedOffice.address}</p>
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Status</h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${selectedOffice.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-semibold text-slate-700">{selectedOffice.is_active ? 'Online Reception Active' : 'Offline / Closed'}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Office Code Identifier</h4>
                  <p className="text-xs font-mono font-semibold text-slate-600 mt-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded inline-block">
                    {selectedOffice._id.startsWith('local-') ? 'OFFICE-OFFLINE' : `OFFICE-${selectedOffice._id.slice(-6).toUpperCase()}`}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="border-t border-slate-50 pt-4 flex gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(selectedOffice, e)}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition-all shadow cursor-pointer"
                  >
                    <Edit2 size={12} />
                    Edit Office
                  </button>
                  <button
                    onClick={(e) => handleDelete(selectedOffice._id, e)}
                    className="flex items-center justify-center p-2.5 bg-red-50 hover:bg-red-100 border border-red-250 text-red-655 rounded-xl transition-all cursor-pointer min-h-[44px]"
                    title="Delete Branch"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Creation/Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />

          {/* Dialog Body */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden animate-scaleUp max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-12 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                {editingOffice ? 'Modify Office Branch' : 'Add Corporate Office'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[85vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Office Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Office Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Corporate Headquarters"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                {errors.name && <p className="text-[10px] text-red-600 font-semibold">{errors.name.message}</p>}
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  {...register('city')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                {errors.city && <p className="text-[10px] text-red-600 font-semibold">{errors.city.message}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detailed Address</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bandra Kurla Complex, Road No. 4, Block G"
                  {...register('address')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                />
                {errors.address && <p className="text-[10px] text-red-600 font-semibold">{errors.address.message}</p>}
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">Reception Active Status</span>
                  <p className="text-[9px] text-slate-400">Controls whether visitors can check-in here.</p>
                </div>
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/10"
                >
                  {isSubmitting ? 'Saving...' : 'Save Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficesPage;
