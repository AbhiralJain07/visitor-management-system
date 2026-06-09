import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, ShieldX, Check, Trash2, X, AlertTriangle, Layers, Settings2, Database } from 'lucide-react';
import {
  useMasterData,
  useMasterTypes,
  useCreateMasterData,
  useUpdateMasterData,
  useDeleteMasterData,
  useCreateMasterType,
  useUpdateMasterType,
  useDeleteMasterType,
} from '@/features/super-admin/api/queryHooks';
import {
  masterDataFormSchema,
  type MasterDataFormFields,
  masterTypeFormSchema,
  type MasterTypeFormFields,
} from '@/features/super-admin/schemas';
import { type MasterDataItem, type TranslationSchema, type MasterType } from '@/features/super-admin/types';
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
  // Tab State
  const [activeTab, setActiveTab] = useState<'records' | 'categories'>('records');

  // Common Search & Page state
  const [search, setSearch] = useState('');
  const [selectedTypeCode, setSelectedTypeCode] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // TanStack Queries & Mutations
  const { data: masterTypes = [] } = useMasterTypes();
  const { data: masterTypesForTab = [], isLoading: isTypesLoading } = useMasterTypes(activeTab === 'categories' ? search : '');
  const { data: masterItems = [], isLoading: isItemsLoading } = useMasterData(selectedTypeCode, activeTab === 'records' ? search : '');

  // Master Data mutations
  const createItemMutation = useCreateMasterData();
  const updateItemMutation = useUpdateMasterData();
  const deleteItemMutation = useDeleteMasterData();

  // Master Type mutations
  const createTypeMutation = useCreateMasterType();
  const updateTypeMutation = useUpdateMasterType();
  const deleteTypeMutation = useDeleteMasterType();

  // Modals state for Records
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isRecordEditMode, setIsRecordEditMode] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MasterDataItem | null>(null);
  const [recordDeleteConfirmId, setRecordDeleteConfirmId] = useState<string | null>(null);

  // Modals state for Categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MasterType | null>(null);
  const [categoryDeleteConfirmId, setCategoryDeleteConfirmId] = useState<string | null>(null);

  // Form setup for Records
  const recordForm = useForm<MasterDataFormFields>({
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

  // Form setup for Categories
  const categoryForm = useForm<MasterTypeFormFields>({
    resolver: zodResolver(masterTypeFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'Active',
    },
  });

  // ----------------------------------------------------
  // RECORD ACTION HANDLERS
  // ----------------------------------------------------
  const handleOpenAddRecordModal = () => {
    recordForm.reset({
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
    setIsRecordEditMode(false);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecordModal = (item: MasterDataItem) => {
    recordForm.reset({
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
    setIsRecordEditMode(true);
    setSelectedRecord(item);
    setIsRecordModalOpen(true);
  };

  const onSubmitRecordForm = async (data: MasterDataFormFields) => {
    const payload = {
      ...data,
      name: data.translations.en,
      typeCode: selectedTypeCode === 'All' ? (masterTypes[0]?.code || 'VISITOR_TYPE') : selectedTypeCode,
    };

    try {
      if (isRecordEditMode && selectedRecord) {
        await updateItemMutation.mutateAsync({
          id: selectedRecord._id,
          payload,
        });
      } else {
        await createItemMutation.mutateAsync(payload);
      }
      setIsRecordModalOpen(false);
      setSelectedRecord(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRecordStatus = async (item: MasterDataItem) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateItemMutation.mutateAsync({
        id: item._id,
        payload: { status: nextStatus },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteRecord = async () => {
    if (!recordDeleteConfirmId) return;
    try {
      await deleteItemMutation.mutateAsync(recordDeleteConfirmId);
      setRecordDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // ----------------------------------------------------
  // CATEGORY ACTION HANDLERS
  // ----------------------------------------------------
  const handleOpenAddCategoryModal = () => {
    categoryForm.reset({
      name: '',
      code: '',
      description: '',
      status: 'Active',
    });
    setIsCategoryEditMode(false);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (mt: MasterType) => {
    categoryForm.reset({
      name: mt.name,
      code: mt.code,
      description: mt.description || '',
      status: mt.status,
    });
    setIsCategoryEditMode(true);
    setSelectedCategory(mt);
    setIsCategoryModalOpen(true);
  };

  const onSubmitCategoryForm = async (data: MasterTypeFormFields) => {
    try {
      if (isCategoryEditMode && selectedCategory) {
        await updateTypeMutation.mutateAsync({
          id: selectedCategory._id,
          payload: data,
        });
      } else {
        await createTypeMutation.mutateAsync(data);
      }
      setIsCategoryModalOpen(false);
      setSelectedCategory(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCategoryStatus = async (mt: MasterType) => {
    const nextStatus = mt.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateTypeMutation.mutateAsync({
        id: mt._id,
        payload: { status: nextStatus },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryDeleteConfirmId) return;
    try {
      await deleteTypeMutation.mutateAsync(categoryDeleteConfirmId);
      setCategoryDeleteConfirmId(null);
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

  // Table Columns Definition for Records
  const recordColumns = [
    {
      header: 'Code',
      accessor: (row: MasterDataItem) => (
        <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md select-all">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Record Value',
      accessor: (row: MasterDataItem) => (
  <div className="flex flex-col">
    <span className="font-bold text-slate-800 text-sm leading-tight">{row.name}</span>
    <span className="text-[9px] text-slate-400 font-semibold uppercase">
      {row.typeCode?.replace('_', ' ') || 
       (typeof row.master_type_id === 'object' ? row.master_type_id?.name : '') || 
       'General'} Category
    </span>
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
      header: 'Translations',
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
            <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[10px] font-bold ${badgeColor}`}>
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
              onClick={() => handleOpenEditRecordModal(row)}
              className="p-1 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
              title="Edit Record"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => handleToggleRecordStatus(row)}
              className={`p-1 border rounded-lg transition-colors shadow-xs ${
                row.status === 'Active'
                  ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                  : 'border-green-200 bg-white text-green-600 hover:bg-green-50'
              }`}
              title={row.status === 'Active' ? 'Deactivate Record' : 'Activate Record'}
            >
              {row.status === 'Active' ? <ShieldX size={13} /> : <Check size={13} />}
            </button>
          </PermissionGuard>

          <PermissionGuard action="master_data:delete">
            <button
              onClick={() => setRecordDeleteConfirmId(row._id)}
              className="p-1 border border-red-100 rounded-lg bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs"
              title="Delete Record"
            >
              <Trash2 size={13} />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  // Table Columns Definition for Categories
  const categoryColumns = [
    {
      header: 'Category Code',
      accessor: (row: MasterType) => (
        <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md select-all">
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
              onClick={() => handleOpenEditCategoryModal(row)}
              className="p-1 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
              title="Edit Category"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => handleToggleCategoryStatus(row)}
              className={`p-1 border rounded-lg transition-colors shadow-xs ${
                row.status === 'Active'
                  ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                  : 'border-green-200 bg-white text-green-600 hover:bg-green-50'
              }`}
              title={row.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
            >
              {row.status === 'Active' ? <ShieldX size={13} /> : <Check size={13} />}
            </button>
          </PermissionGuard>

          <PermissionGuard action="master_types:delete">
            <button
              onClick={() => setCategoryDeleteConfirmId(row._id)}
              className="p-1 border border-red-100 rounded-lg bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs"
              title="Delete Category"
            >
              <Trash2 size={13} />
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
        title={activeTab === 'records' ? 'Master Records' : 'Master Categories'}
        description={
          activeTab === 'records'
            ? 'Translate and customize operational labels used by employees and kiosks: Visitor Types, Visit Purposes, and ID Proof designations.'
            : 'Configure client-wide categorization types like designation tags, visiting reasons, and accepted verification IDs.'
        }
        action={
          activeTab === 'records' ? (
            <PermissionGuard action="master_data:write">
              <button
                onClick={handleOpenAddRecordModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus size={15} />
                <span>Add Record</span>
              </button>
            </PermissionGuard>
          ) : (
            <PermissionGuard action="master_types:write">
              <button
                onClick={handleOpenAddCategoryModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus size={15} />
                <span>Add Category</span>
              </button>
            </PermissionGuard>
          )
        }
      />

      {/* Tabs Selector Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('records');
            setSearch('');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'records'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Database size={14} />
          <span>Master Records</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('categories');
            setSearch('');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Settings2 size={14} />
          <span>Master Categories</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'records' ? (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left pane: Category Navigation List */}
          <div className="w-full lg:w-1/4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3 shrink-0">
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
              columns={recordColumns}
              data={masterItems}
              isLoading={isItemsLoading}
              currentPage={currentPage}
              totalPages={1}
              emptyState={
                <EmptyState
                  title="No Records Found"
                  description="No master data entries are currently configured under this category."
                  action={
                    <PermissionGuard action="master_data:write">
                      <button
                        onClick={handleOpenAddRecordModal}
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
      ) : (
        /* Categories Tab View */
        <div className="space-y-4">
          <div className="flex items-center">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder="Search categories by name, code..."
            />
          </div>

          <DataTable
            columns={categoryColumns}
            data={masterTypesForTab}
            isLoading={isTypesLoading}
            emptyState={
              <EmptyState
                title="No Categories Configured"
                description="Create a master category code block to begin referencing custom metadata profiles."
                action={
                  <PermissionGuard action="master_types:write">
                    <button
                      onClick={handleOpenAddCategoryModal}
                      className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-100/50 transition-colors"
                    >
                      Create First Category
                    </button>
                  </PermissionGuard>
                }
              />
            }
          />
        </div>
      )}

      {/* ==========================================================
         ADD / EDIT MASTER RECORD MODAL
         ========================================================== */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsRecordModalOpen(false)}></div>
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-fadeIn">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-md font-bold text-slate-950">
                {isRecordEditMode ? 'Edit Master Record' : 'Add Master Record'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={recordForm.handleSubmit(onSubmitRecordForm)} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block">Adding to Category</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 capitalize">
                    {selectedTypeCode === 'All' ? (masterTypes[0]?.name || 'Visitor Type') : selectedTypeCode.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Unique Record Code</label>
                  <input
                    type="text"
                    {...recordForm.register('code')}
                    disabled={isRecordEditMode}
                    placeholder="CONTRACTOR"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                      recordForm.formState.errors.code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {recordForm.formState.errors.code && <p className="text-[10px] font-semibold text-red-600">{recordForm.formState.errors.code.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Display Sort Order</label>
                  <input
                    type="number"
                    {...recordForm.register('sortOrder', { valueAsNumber: true })}
                    placeholder="1"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      recordForm.formState.errors.sortOrder ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {recordForm.formState.errors.sortOrder && <p className="text-[10px] font-semibold text-red-600">{recordForm.formState.errors.sortOrder.message}</p>}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">Record Status</label>
                  <select
                    {...recordForm.register('status')}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2 pt-2">
                  <Controller
                    name="translations"
                    control={recordForm.control}
                    render={({ field }) => (
                      <TranslationInput
                        translations={field.value}
                        onChange={field.onChange}
                        errors={recordForm.formState.errors.translations as any}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {(createItemMutation.isPending || updateItemMutation.isPending) && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{isRecordEditMode ? 'Save Changes' : 'Create Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
         ADD / EDIT CATEGORY TYPE MODAL
         ========================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative z-10 flex flex-col animate-fadeIn">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-md font-bold text-slate-950">
                {isCategoryEditMode ? 'Edit Category Type' : 'Create Category Type'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={categoryForm.handleSubmit(onSubmitCategoryForm)} className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Category Label</label>
                  <input
                    type="text"
                    {...categoryForm.register('name')}
                    placeholder="Visitor Designation"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      categoryForm.formState.errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {categoryForm.formState.errors.name && <p className="text-[10px] font-semibold text-red-600">{categoryForm.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Unique Code</label>
                  <input
                    type="text"
                    {...categoryForm.register('code')}
                    disabled={isCategoryEditMode}
                    placeholder="DESIGNATION"
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                      categoryForm.formState.errors.code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {categoryForm.formState.errors.code && <p className="text-[10px] font-semibold text-red-600">{categoryForm.formState.errors.code.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Category Status</label>
                  <select
                    {...categoryForm.register('status')}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Short Description</label>
                  <textarea
                    {...categoryForm.register('description')}
                    rows={3}
                    placeholder="Explain the purpose of this master category..."
                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 transition-all ${
                      categoryForm.formState.errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {categoryForm.formState.errors.description && <p className="text-[10px] font-semibold text-red-600">{categoryForm.formState.errors.description.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {(createTypeMutation.isPending || updateTypeMutation.isPending) && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{isCategoryEditMode ? 'Save Changes' : 'Create Category'}</span>
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
        isOpen={!!recordDeleteConfirmId}
        onClose={() => setRecordDeleteConfirmId(null)}
        onConfirm={handleConfirmDeleteRecord}
        title="Delete Master Record"
        message="Are you absolutely sure you want to delete this master record? Any active employee profiles, kiosk visit records, or checkout settings referencing this code will be broken or set to fallback values. This action is permanent."
        confirmText="Yes, Delete Record"
        cancelText="Discard"
        variant="danger"
      />

      {/* ==========================================================
         CONFIRMATION DIALOG: DELETE CATEGORY
         ========================================================== */}
      <ConfirmationDialog
        isOpen={!!categoryDeleteConfirmId}
        onClose={() => setCategoryDeleteConfirmId(null)}
        onConfirm={handleConfirmDeleteCategory}
        title="Delete Category Type"
        message="Are you absolutely sure you want to delete this master category? All children master records, translation maps, and existing kiosk selections associated with this code will be broken or cleared. This operation is permanent."
        confirmText="Yes, Delete Category"
        cancelText="Discard"
        variant="danger"
      />
    </div>
  );
};

export default MasterDataPage;
