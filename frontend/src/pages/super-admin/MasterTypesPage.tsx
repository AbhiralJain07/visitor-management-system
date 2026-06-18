import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, ShieldX, Check, Trash2, X, AlertTriangle } from 'lucide-react';
import { useMasterTypes, useCreateMasterType, useUpdateMasterType, useDeleteMasterType } from '@/features/super-admin/api/queryHooks';
import { masterTypeFormSchema, type MasterTypeFormFields } from '@/features/super-admin/schemas';
import { type MasterType } from '@/features/super-admin/types';
import { PermissionGuard } from '@/features/super-admin/components/PermissionGuard';
import {
  PageHeader,
  DataTable,
  SearchBar,
  StatusBadge,
  ConfirmationDialog,
  EmptyState,
} from '@/features/super-admin/components/UIComponents';

export const MasterTypesPage: React.FC = () => {
  // Search state
  const [search, setSearch] = useState('');

  // TanStack Queries
  const { data: masterTypes = [], isLoading, refetch } = useMasterTypes(search);
  const createMutation = useCreateMasterType();
  const updateMutation = useUpdateMasterType();
  const deleteMutation = useDeleteMasterType();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState<MasterType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MasterTypeFormFields>({
    resolver: zodResolver(masterTypeFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'Active',
    },
  });

  const handleOpenAddModal = () => {
    reset({
      name: '',
      code: '',
      description: '',
      status: 'Active',
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mt: MasterType) => {
    reset({
      name: mt.name,
      code: mt.code,
      description: mt.description || '',
      status: mt.status,
    });
    setIsEditMode(true);
    setSelectedType(mt);
    setIsModalOpen(true);
  };

  const onSubmitForm = async (data: MasterTypeFormFields) => {
    try {
      if (isEditMode && selectedType) {
        await updateMutation.mutateAsync({
          id: selectedType._id,
          payload: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
      setSelectedType(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (mt: MasterType) => {
    const nextStatus = mt.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateMutation.mutateAsync({
        id: mt._id,
        payload: { status: nextStatus },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Category Code',
      accessor: (row: MasterType) => (
        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md select-all">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Category Name',
      accessor: (row: MasterType) => (
        <span className="font-bold text-slate-800 text-sm">{row.name}</span>
      ),
    },
    {
      header: 'Description',
      accessor: (row: MasterType) => (
        <span className="text-xs text-slate-500 max-w-xs block truncate" title={row.description}>
          {row.description || 'No description provided.'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: MasterType) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: MasterType) => (
        <div className="flex items-center gap-1.5">
          <PermissionGuard action="master_types:write">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
              title="Edit Category"
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
              title={row.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
            >
              {row.status === 'Active' ? <ShieldX size={14} /> : <Check size={14} />}
            </button>
          </PermissionGuard>

          <PermissionGuard action="master_types:delete">
            <button
              onClick={() => setDeleteConfirmId(row._id)}
              className="p-1 border border-red-100 rounded bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs"
              title="Delete Category"
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
      {/* Header */}
      <PageHeader
        title="Master Categories"
        description="Configure client-wide categorization types like designation tags, visiting reasons, and accepted verification IDs."
        action={
          <PermissionGuard action="master_types:write">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          </PermissionGuard>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center">
        <SearchBar
          value={search}
          onChange={(val) => setSearch(val)}
          placeholder="Search categories by name, code..."
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={masterTypes}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No Categories Configured"
            description="Create a master category code block to begin referencing custom metadata profiles."
          />
        }
      />

      {/* ==========================================================
         ADD / EDIT CATEGORY MODAL
         ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative z-10 flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-md font-bold text-slate-950">
                {isEditMode ? 'Edit Category Type' : 'Create Category Type'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Category Label</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Visitor Designation"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] font-semibold text-red-600">{errors.name.message}</p>}
                </div>

                {/* Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Unique Code</label>
                  <input
                    type="text"
                    {...register('code')}
                    disabled={isEditMode}
                    placeholder="DESIGNATION"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                      errors.code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.code && <p className="text-[10px] font-semibold text-red-600">{errors.code.message}</p>}
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Category Status</label>
                  <select
                    {...register('status')}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Short Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Explain the purpose of this master category..."
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.description && <p className="text-[10px] font-semibold text-red-600">{errors.description.message}</p>}
                </div>
              </div>

              {/* Submit footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{isEditMode ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
         CONFIRMATION DIALOG: DELETE CATEGORY
         ========================================================== */}
      <ConfirmationDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category Type"
        message="Are you absolutely sure you want to delete this master category? All children master records, translation maps, and existing kiosk selections associated with this code will be broken or cleared. This operation is permanent."
        confirmText="Yes, Delete Category"
        cancelText="Discard"
        variant="danger"
      />
    </div>
  );
};

export default MasterTypesPage;
