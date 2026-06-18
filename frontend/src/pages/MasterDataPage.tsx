import React, { useState, useMemo } from 'react';
import { useCustomMasterData } from '@/features/tenant-admin/api/queryHooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { masterDataFormSchema, type MasterDataFormValues } from '@/features/tenant-admin/schemas';
import { Plus, Edit2, Trash2, X, Tags, ListCollapse, ArrowUp, ArrowDown, Settings, Check, AlertTriangle, Lock } from 'lucide-react';

export const MasterDataPage: React.FC = () => {
  const { masterData, isLoading, isError, createItem, updateItem, deleteItem } = useCustomMasterData();

  // Tab state: 'purpose' or 'department'
  const [activeTab, setActiveTab] = useState<'purpose' | 'department'>('purpose');

  // Edit item state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MasterDataFormValues>({
    resolver: zodResolver(masterDataFormSchema),
    defaultValues: {
      name: '',
      type: 'purpose',
      sortOrder: 1,
      is_active: true,
    },
  });

  // Filter and sort items based on type
  const items = useMemo(() => {
    return masterData
      .filter((item) => item.type === activeTab)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [masterData, activeTab]);

  // Handle open modal for creation
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormError(null);
    reset({
      name: '',
      type: activeTab,
      sortOrder: items.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    reset({
      name: item.name,
      type: item.type,
      sortOrder: item.sortOrder,
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this master data category?')) {
      try {
        await deleteItem(id);
      } catch (err) {
        console.error('Delete master data failed:', err);
      }
    }
  };

  // Submit handler
  const onSubmit = async (data: MasterDataFormValues) => {
    try {
      setFormError(null);
      if (editingItem) {
        await updateItem({ id: editingItem._id, payload: data });
      } else {
        await createItem(data);
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong.';
      setFormError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Tags className="text-blue-600" size={24} />
            Custom Master Data
          </h1>
          <p className="text-sm text-slate-500">Customize visit purposes and host employee departments for checkout registries.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 cursor-pointer transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Add Option</span>
        </button>
      </div>

      {/* Selector Tabs & Form split panel layout */}
      <div className="grid gap-6 md:grid-cols-4 items-start">
        {/* Left Side Tab Navigation panel */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm space-y-1.5 md:col-span-1">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3.5 pt-2 pb-1.5">Configure Tables</h3>
          <button
            onClick={() => setActiveTab('purpose')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'purpose'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Settings size={16} />
            <span>Visit Purposes</span>
          </button>
          <button
            onClick={() => setActiveTab('department')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'department'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <ListCollapse size={16} />
            <span>Departments</span>
          </button>
        </div>

        {/* Right Side Master Lists panel */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden md:col-span-3">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeTab === 'purpose' ? 'Active Visit Purposes' : 'Company Departments List'}
            </h3>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              {items.length} Options Defined
            </span>
          </div>

          {/* Desktop/Tablet Table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Label Name</th>
                  <th className="px-6 py-3">Display Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium font-sans">
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                        {item.name}
                        {(item as any).is_global && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                            <Lock size={8} /> Global
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono font-semibold">
                        <span className="bg-slate-50 px-2 py-0.5 border border-slate-100 rounded">
                          {item.sortOrder}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          item.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => !(item as any).is_global && handleOpenEdit(item)}
                            disabled={(item as any).is_global}
                            className={`p-1.5 rounded-lg border border-transparent transition-all ${(item as any).is_global ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'}`}
                            title={(item as any).is_global ? 'Global items cannot be edited' : 'Edit'}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => !(item as any).is_global && handleDelete(item._id)}
                            disabled={(item as any).is_global}
                            className={`p-1.5 rounded-lg border border-transparent transition-all ${(item as any).is_global ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100'}`}
                            title={(item as any).is_global ? 'Global items cannot be deleted' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 space-y-2">
                      <AlertTriangle className="mx-auto text-slate-300" size={24} />
                      <p className="text-xs font-semibold">No custom settings configured</p>
                      <p className="text-[10px] text-slate-400">Click Add Option to seed custom categories.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list view */}
          <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/20">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item._id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                      {(item as any).is_global && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                          <Lock size={8} /> Global
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                      item.is_active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Display Order</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{item.sortOrder}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={() => !(item as any).is_global && handleOpenEdit(item)}
                      disabled={(item as any).is_global}
                      className={`flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 rounded-xl font-bold text-xs transition-colors ${(item as any).is_global ? 'bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700'}`}
                    >
                      <Edit2 size={12} />
                      Edit Option
                    </button>
                    <button
                      onClick={() => !(item as any).is_global && handleDelete(item._id)}
                      disabled={(item as any).is_global}
                      className={`flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 rounded-xl font-bold text-xs transition-colors ${(item as any).is_global ? 'bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed' : 'bg-red-50 border border-red-200 hover:bg-red-100 text-red-700'}`}
                    >
                      <Trash2 size={12} />
                      Delete Option
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <AlertTriangle className="mx-auto text-slate-300" size={24} />
                <p className="text-xs font-semibold">No custom settings configured</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Creation/Edit Overlay Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />

          {/* Dialog Container */}
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden animate-scaleUp max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-12 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                {editingItem ? 'Edit Category Option' : 'Add Category Option'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[85vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Server error */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Option label name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Option Label Name</label>
                <input
                  type="text"
                  placeholder={activeTab === 'purpose' ? 'e.g. Vendor Visit' : 'e.g. Marketing Department'}
                  {...register('name')}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 min-h-[44px]"
                />
                {errors.name && <p className="text-[10px] text-red-600 font-semibold">{errors.name.message}</p>}
              </div>

              {/* Sort Display Order */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sort Display Order</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  {...register('sortOrder', { valueAsNumber: true })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono min-h-[44px]"
                />
                {errors.sortOrder && <p className="text-[10px] text-red-600 font-semibold">{errors.sortOrder.message}</p>}
              </div>

              {/* Active Switch status toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">Is Option Enabled</span>
                  <p className="text-[9px] text-slate-400">Disabled options won't display in dropdowns.</p>
                </div>
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Actions buttons */}
              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/10 min-h-[44px]"
                >
                  {isSubmitting ? 'Saving...' : 'Save Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataPage;
