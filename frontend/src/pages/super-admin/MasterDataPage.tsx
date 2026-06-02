import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, ShieldX, Check, Trash2, X, AlertTriangle, Layers } from 'lucide-react';
import {
  useMasterData,
  useMasterTypes,
  useCreateMasterData,
  useUpdateMasterData,
  useDeleteMasterData,
} from '@/features/super-admin/api/queryHooks';
import { masterDataFormSchema, type MasterDataFormFields } from '@/features/super-admin/schemas';
import { type MasterDataItem, type TranslationSchema } from '@/features/super-admin/types';
import { PermissionGuard } from '@/features/super-admin/components/PermissionGuard';
import { TranslationInput } from '@/features/super-admin/components/TranslationInput';
import {
  PageHeader,
  DataTable,
  SearchBar,
  StatusBadge,
  ConfirmationDialog,
  EmptyState,
} from '@/features/super-admin/components/UIComponents';

export const MasterDataPage: React.FC = () => {
  // Navigation / Filter State
  const [selectedTypeCode, setSelectedTypeCode] = useState('All');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack Queries
  const { data: masterTypes = [] } = useMasterTypes();
  const { data: masterItems = [], isLoading, refetch } = useMasterData(selectedTypeCode, search);
  const createMutation = useCreateMasterData();
  const updateMutation = useUpdateMasterData();
  const deleteMutation = useDeleteMasterData();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MasterDataItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<MasterDataFormFields>({
    resolver: zodResolver(masterDataFormSchema),
    defaultValues: {
      name: '',
      code: '',
      sortOrder: 0,
      status: 'Active',
      translations: {
        en: '',
        hi: '',
        ta: '',
        te: '',
        mr: '',
        bn: '',
      },
    },
  });

  const handleOpenAddModal = () => {
    reset({
      name: '',
      code: '',
      sortOrder: masterItems.length + 1,
      status: 'Active',
      translations: {
        en: '',
        hi: '',
        ta: '',
        te: '',
        mr: '',
        bn: '',
      },
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MasterDataItem) => {
    reset({
      name: item.name,
      code: item.code,
      sortOrder: item.sortOrder,
      status: item.status,
      translations: {
        en: item.translations.en || item.name,
        hi: item.translations.hi || '',
        ta: item.translations.ta || '',
        te: item.translations.te || '',
        mr: item.translations.mr || '',
        bn: item.translations.bn || '',
      },
    });
    setIsEditMode(true);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const onSubmitForm = async (data: MasterDataFormFields) => {
    // Automatically keep default name field in sync with English translation
    const payload = {
      ...data,
      name: data.translations.en,
      typeCode: selectedTypeCode === 'All' ? (masterTypes[0]?.code || 'VISITOR_TYPE') : selectedTypeCode,
    };

    try {
      if (isEditMode && selectedItem) {
        await updateMutation.mutateAsync({
          id: selectedItem._id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (item: MasterDataItem) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateMutation.mutateAsync({
        id: item._id,
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

  // Helper: Count translation completeness
  const getCompletenessText = (translations: TranslationSchema) => {
    const total = 6;
    const filled = ['en', 'hi', 'ta', 'te', 'mr', 'bn'].filter((k) => !!translations[k as keyof TranslationSchema]?.trim()).length;
    return `${filled}/${total}`;
  };

  const getCompletenessPercent = (translations: TranslationSchema) => {
    const filled = ['en', 'hi', 'ta', 'te', 'mr', 'bn'].filter((k) => !!translations[k as keyof TranslationSchema]?.trim()).length;
    return Math.round((filled / 6) * 100);
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Code',
      accessor: (row: MasterDataItem) => (
        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md select-all">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Record Value',
      accessor: (row: MasterDataItem) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm leading-tight">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">{row.typeCode} Category</span>
        </div>
      ),
    },
    {
      header: 'Sort Order',
      accessor: (row: MasterDataItem) => (
        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 border border-slate-200/50 rounded-lg">
          #{row.sortOrder}
        </span>
      ),
    },
    {
      header: 'Translations completeness',
      accessor: (row: MasterDataItem) => {
        const text = getCompletenessText(row.translations);
        const pct = getCompletenessPercent(row.translations);
        const badgeColor =
          pct === 100
            ? 'text-green-700 bg-green-50 border-green-200'
            : pct >= 50
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-red-700 bg-red-50 border-red-200';

        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 border rounded-full text-xs font-semibold ${badgeColor}`}>
              {text} ({pct}%)
            </span>
            {pct < 100 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Missing regional translation keys" />
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: MasterDataItem) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: MasterDataItem) => (
        <div className="flex items-center gap-1.5">
          <PermissionGuard action="master_data:write">
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
              title="Edit Record"
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
              title={row.status === 'Active' ? 'Deactivate Record' : 'Activate Record'}
            >
              {row.status === 'Active' ? <ShieldX size={14} /> : <Check size={14} />}
            </button>
          </PermissionGuard>

          <PermissionGuard action="master_data:delete">
            <button
              onClick={() => setDeleteConfirmId(row._id)}
              className="p-1 border border-red-100 rounded bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs"
              title="Delete Record"
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
        title="Master Records"
        description="Translate and customize operational labels used by employees and kiosks: Visitor Types, Visit Purposes, and ID Proof designations."
        action={
          <PermissionGuard action="master_data:write">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              <Plus size={15} />
              <span>Add Record</span>
            </button>
          </PermissionGuard>
        }
      />

      {/* Main Split Panel Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left pane: Category Navigation List */}
        <div className="w-full lg:w-1/4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">
            Filter Master Categories
          </span>
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
            <button
              onClick={() => {
                setSelectedTypeCode('All');
                setCurrentPage(1);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                selectedTypeCode === 'All'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/60 lg:border-none'
              }`}
            >
              <Layers size={14} />
              <span>All Categories</span>
            </button>

            {masterTypes.map((type) => (
              <button
                key={type._id}
                onClick={() => {
                  setSelectedTypeCode(type.code);
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                  selectedTypeCode === type.code
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/60 lg:border-none'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span className="truncate">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right pane: Table items list */}
        <div className="w-full lg:w-3/4 space-y-4">
          <div className="flex items-center">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search records by name, code..."
            />
          </div>

          <DataTable
            columns={columns}
            data={masterItems}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={1}
            emptyState={
              <EmptyState
                title="No Records Found"
                description={`No master data entries are currently configured under this category.`}
                action={
                  <PermissionGuard action="master_data:write">
                    <button
                      onClick={handleOpenAddModal}
                      className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-100/50 transition-colors"
                    >
                      Create First Record
                    </button>
                  </PermissionGuard>
                }
              />
            }
          />
        </div>
      </div>

      {/* ==========================================================
         ADD / EDIT MASTER RECORD MODAL
         ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-md font-bold text-slate-950">
                {isEditMode ? 'Edit Master Record' : 'Add Master Record'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category indicator (read-only for add/edit modal) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block">Adding to Category</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 capitalize">
                    {selectedTypeCode === 'All' ? (masterTypes[0]?.name || 'Visitor Type') : selectedTypeCode.replace('_', ' ')}
                  </div>
                </div>

                {/* Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Unique Record Code</label>
                  <input
                    type="text"
                    {...register('code')}
                    disabled={isEditMode}
                    placeholder="CONTRACTOR"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                      errors.code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.code && <p className="text-[10px] font-semibold text-red-600">{errors.code.message}</p>}
                </div>

                {/* Sort Order */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Display Sort Order</label>
                  <input
                    type="number"
                    {...register('sortOrder', { valueAsNumber: true })}
                    placeholder="1"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      errors.sortOrder ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.sortOrder && <p className="text-[10px] font-semibold text-red-600">{errors.sortOrder.message}</p>}
                </div>

                {/* Status */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">Record Status</label>
                  <select
                    {...register('status')}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Multilingual Translation Tab Editor */}
                <div className="space-y-1 sm:col-span-2 pt-2">
                  <Controller
                    name="translations"
                    control={control}
                    render={({ field }) => (
                      <TranslationInput
                        translations={field.value}
                        onChange={field.onChange}
                        errors={errors.translations as any}
                      />
                    )}
                  />
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
                  <span>{isEditMode ? 'Save Changes' : 'Create Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
         CONFIRMATION DIALOG: DELETE RECORD
         ========================================================== */}
      <ConfirmationDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Master Record"
        message="Are you absolutely sure you want to delete this master record? Any active employee profiles, kiosk visit records, or checkout settings referencing this code will be broken or set to fallback values. This action is permanent."
        confirmText="Yes, Delete Record"
        cancelText="Discard"
        variant="danger"
      />
    </div>
  );
};

export default MasterDataPage;
