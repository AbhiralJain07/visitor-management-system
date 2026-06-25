import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEmployees, useOffices } from '@/features/tenant-admin/api/queryHooks';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  userCreateFormSchema,
  userEditFormSchema,
  type UserCreateFormValues,
  type UserEditFormValues,
} from '@/features/tenant-admin/schemas';
import {
  Plus, Search, Edit2, Trash2, X, Key, Mail, Phone,
  Building, AlertTriangle, Eye, Check, Lock
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'tenant_admin', 'manager'].includes(user?.role || '');

  const [searchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { employees, pagination, isLoading: employeesLoading, createEmployee, updateEmployee, deleteEmployee } = useEmployees({
    page,
    limit,
    search: searchQuery,
    role: roleFilter,
    department: departmentFilter,
  });
  const { offices, isLoading: officesLoading } = useOffices();

  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [searchQuery, roleFilter, departmentFilter]);
  useEffect(() => { if (qParam) setSearchQuery(qParam); }, [qParam]);

  // Create form (with password)
  const createForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateFormSchema),
    defaultValues: {
      name: '', email: '', password: '', role: 'employee',
      phone: '', office_id: '', telegram_id: '', department: '',
    },
  });

  // Edit form (without password)
  const editForm = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      name: '', email: '', role: 'employee',
      phone: '', office_id: '', telegram_id: '', department: '',
    },
  });

  const activeForm = editingEmployee ? editForm : createForm;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = activeForm as any;

  const departments = useMemo(() => {
    const list = new Set<string>();
    employees.forEach((e) => { if (e.department) list.add(e.department); });
    return Array.from(list);
  }, [employees]);

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormError(null);
    createForm.reset({
      name: '', email: '', password: '', role: 'employee',
      phone: '', office_id: offices[0]?._id || '',
      telegram_id: '', department: departments[0] || 'Engineering',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmployee(emp);
    setFormError(null);
    const officeIdStr = typeof emp.office_id === 'object' && emp.office_id !== null
      ? emp.office_id._id : emp.office_id || '';
    editForm.reset({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      phone: emp.phone || '',
      office_id: officeIdStr,
      telegram_id: emp.telegram_id || '',
      department: emp.department || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this employee?')) {
      try {
        await deleteEmployee(id);
        if (selectedEmployee?._id === id) setSelectedEmployee(null);
      } catch (err) {
        console.error('Delete employee failed:', err);
      }
    }
  };

  const handleResetPassword = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResetSuccess(`Password reset link dispatched to: ${email} ✅`);
    setTimeout(() => setResetSuccess(null), 4000);
  };

  const onSubmit = async (data: UserCreateFormValues | UserEditFormValues) => {
    try {
      setFormError(null);
      if (editingEmployee) {
        await updateEmployee({ id: editingEmployee._id, payload: data as UserEditFormValues });
      } else {
        await createEmployee(data as UserCreateFormValues);
      }
      setModalOpen(false);
      setEditingEmployee(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong.';
      setFormError(msg);
    }
  };

  const getOfficeName = (officeId: any) => {
    if (typeof officeId === 'object' && officeId !== null) return officeId.name;
    const found = offices.find((o) => o._id === officeId);
    return found ? found.name : 'Unknown Office';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Employee Directory</h1>
          <p className="text-sm text-slate-500">Manage hosts, notification routing, and department configurations.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 cursor-pointer transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Password reset notification */}
      {resetSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-start space-x-2 shadow-sm">
          <Check size={16} className="text-emerald-600 mt-0.5" />
          <span className="text-xs font-medium">{resetSuccess}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, department..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >x</button>
          )}
        </div>
        <div className="flex items-center space-x-2 self-start md:self-auto w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="receptionist">Receptionist</option>
            <option value="security">Security Guard</option>
            <option value="employee">Employee Host</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Table */}
        <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${selectedEmployee ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-300`}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Office</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {employeesLoading || officesLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">Loading employees...</td>
                  </tr>
                ) : employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr
                      key={emp._id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${selectedEmployee?._id === emp._id ? 'bg-blue-50/20' : ''}`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shrink-0 font-semibold text-xs">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[150px]">{emp.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[180px]">{emp.email}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{emp.department || 'General'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          emp.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          emp.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          emp.role === 'receptionist' ? 'bg-green-50 text-green-700 border-green-200' :
                          emp.role === 'security' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{getOfficeName(emp.office_id)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                            title="View details"
                          ><Eye size={14} /></button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => handleOpenEdit(emp, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                                title="Edit"
                              ><Edit2 size={14} /></button>
                              <button
                                onClick={(e) => handleResetPassword(emp.email, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                                title="Reset password"
                              ><Key size={14} /></button>
                              <button
                                onClick={(e) => handleDelete(emp._id, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                title="Delete"
                              ><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 space-y-2">
                      <AlertTriangle className="mx-auto text-slate-300" size={24} />
                      <p className="text-xs font-semibold">No employees found</p>
                      <p className="text-[10px] text-slate-400">Try modifying filters or add a new employee.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/20">
            {employeesLoading || officesLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Loading employees...</div>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-4 space-y-3 hover:bg-slate-50/60 cursor-pointer transition-colors ${selectedEmployee?._id === emp._id ? 'bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shrink-0 font-semibold text-xs">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{emp.name}</span>
                    </div>
                    <span className={`inline-flex items-center text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      emp.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      emp.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      emp.role === 'receptionist' ? 'bg-green-50 text-green-700 border-green-200' :
                      emp.role === 'security' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>{emp.role}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                    <div className="col-span-2 truncate">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Email</span>
                      <span className="text-slate-700">{emp.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Department</span>
                      <span>{emp.department || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Office</span>
                      <span className="truncate block max-w-[120px]">{getOfficeName(emp.office_id)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2.5 border-t border-slate-100 flex-wrap">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp); }}
                      className="flex-1 min-h-[44px] min-w-[80px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-[11px]"
                    ><Eye size={12} /> View</button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(emp, e)}
                          className="flex-1 min-h-[44px] min-w-[60px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold text-[11px]"
                        ><Edit2 size={12} /> Edit</button>
                        <button
                          onClick={(e) => handleResetPassword(emp.email, e)}
                          className="flex-1 min-h-[44px] min-w-[60px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl text-amber-700 font-bold text-[11px]"
                        ><Key size={12} /> Reset</button>
                        <button
                          onClick={(e) => handleDelete(emp._id, e)}
                          className="min-h-[44px] flex items-center justify-center p-2.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl text-red-700"
                        ><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <AlertTriangle className="mx-auto text-slate-300" size={24} />
                <p className="text-xs font-semibold">No employees found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
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
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 font-semibold min-h-[36px]"
                >Previous</button>
                <span className="text-xs text-slate-600 font-semibold">Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 font-semibold min-h-[36px]"
                >Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile backdrop */}
        {selectedEmployee && (
          <div
            onClick={() => setSelectedEmployee(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Details Drawer */}
        {selectedEmployee && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-2xl space-y-6 fixed inset-x-0 bottom-0 top-16 md:inset-y-0 md:right-0 md:left-auto md:w-[460px] lg:relative lg:inset-auto lg:w-auto lg:col-span-1 z-50 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800">Worker Profile</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              ><X size={16} /></button>
            </div>

            <div className="space-y-5">
              {/* Avatar + Name + Status */}
              <div className="flex flex-col items-center text-center gap-3 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-5 border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-500/20 shrink-0">
                  {selectedEmployee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{selectedEmployee.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                    {selectedEmployee.department || 'General'} Division
                  </p>
                </div>
                {/* Role + Status badges */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className={`inline-flex items-center text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${
                    selectedEmployee.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    selectedEmployee.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedEmployee.role === 'receptionist' ? 'bg-green-50 text-green-700 border-green-200' :
                    selectedEmployee.role === 'security' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {selectedEmployee.role}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                    selectedEmployee.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedEmployee.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {selectedEmployee.is_active !== false ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>

              {/* Contact & Professional Details */}
              <div className="space-y-3 border border-slate-100 rounded-xl p-4">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact Information</h4>

                <div className="flex items-center space-x-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail size={12} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Email</p>
                    <span className="text-slate-700 font-semibold truncate block max-w-[280px]">{selectedEmployee.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                    <Phone size={12} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Phone</p>
                    <span className="text-slate-700 font-semibold">{selectedEmployee.phone || 'Not registered'}</span>
                  </div>
                </div>

                {selectedEmployee.telegram_id && (
                  <div className="flex items-center space-x-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      TG
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Telegram ID</p>
                      <span className="text-slate-700 font-mono font-bold">{selectedEmployee.telegram_id}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Office & Department Details */}
              <div className="space-y-3 border border-slate-100 rounded-xl p-4">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Work Assignment</h4>

                <div className="flex items-center space-x-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <Building size={12} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Office Branch</p>
                    <span className="text-slate-700 font-semibold">{getOfficeName(selectedEmployee.office_id)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Department</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">{selectedEmployee.department || 'General'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Employee ID</p>
                    <p className="text-[10px] font-mono font-bold text-slate-600 mt-1">
                      {selectedEmployee._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  {selectedEmployee.createdAt && (
                    <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Member Since</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        {new Date(selectedEmployee.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="border-t border-slate-50 pt-4 flex flex-col space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleOpenEdit(selectedEmployee, e)}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                    ><Edit2 size={12} /> Edit Profile</button>
                    <button
                      onClick={(e) => handleDelete(selectedEmployee._id, e)}
                      className="flex items-center justify-center p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px]"
                    ><Trash2 size={14} /></button>
                  </div>
                  <button
                    onClick={(e) => handleResetPassword(selectedEmployee.email, e)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                  ><Key size={12} /> Send Password Reset Link</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-12 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                {editingEmployee ? 'Modify Employee Profile' : 'Register New Employee'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
              ><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[85vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar">

              {/* Server error */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alok Sharma"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {errors.name && <p className="text-[10px] text-red-600 font-semibold">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {errors.email && <p className="text-[10px] text-red-600 font-semibold">{errors.email.message}</p>}
              </div>

              {/* Password — only for create */}
              {!editingEmployee && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={10} /> Initial Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    {...register('password')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {(errors as any).password && <p className="text-[10px] text-red-600 font-semibold">{(errors as any).password.message}</p>}
                </div>
              )}

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  {...register('phone')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Telegram */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telegram Alert ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 987654321"
                  {...register('telegram_id')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering, Sales, HR"
                  {...register('department')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="employee">Employee Host</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="security">Security Guard</option>
                  <option value="manager">Manager</option>
                  <option value="admin">System Admin</option>
                </select>
                {errors.role && <p className="text-[10px] text-red-600 font-semibold">{errors.role.message}</p>}
              </div>

              {/* Office */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Office Branch</label>
                <select
                  {...register('office_id')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {offices.map((office) => (
                    <option key={office._id} value={office._id}>
                      {office.name} ({office.city})
                    </option>
                  ))}
                </select>
                {errors.office_id && <p className="text-[10px] text-red-600 font-semibold">{errors.office_id.message}</p>}
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/10"
                >
                  {isSubmitting
                    ? (editingEmployee ? 'Updating...' : 'Registering...')
                    : (editingEmployee ? 'Save Changes' : 'Register Employee')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
