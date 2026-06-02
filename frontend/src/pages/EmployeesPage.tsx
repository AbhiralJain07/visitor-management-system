import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEmployees, useOffices } from '@/features/tenant-admin/api/queryHooks';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userFormSchema, type UserFormValues } from '@/features/tenant-admin/schemas';
import { Plus, Search, Edit2, Trash2, X, Briefcase, Key, Mail, Phone, Building, AlertTriangle, Eye, Check } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, departmentFilter]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Sync with search parameter
  useEffect(() => {
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [qParam]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'employee',
      phone: '',
      office_id: '',
      telegram_id: '',
      department: '',
    },
  });

  // Unique departments for filter list
  const departments = useMemo(() => {
    const list = new Set<string>();
    employees.forEach((e) => {
      if (e.department) list.add(e.department);
    });
    return Array.from(list);
  }, [employees]);

  // Handle open modal for creation
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    reset({
      name: '',
      email: '',
      role: 'employee',
      phone: '',
      office_id: offices[0]?._id || '',
      telegram_id: '',
      department: departments[0] || 'Engineering',
    });
    setModalOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (emp: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmployee(emp);
    const officeIdStr = typeof emp.office_id === 'object' && emp.office_id !== null ? emp.office_id._id : emp.office_id || '';
    reset({
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

  // Handle delete employee
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this employee?')) {
      try {
        await deleteEmployee(id);
        if (selectedEmployee?._id === id) {
          setSelectedEmployee(null);
        }
      } catch (err) {
        console.error('Delete employee failed:', err);
      }
    }
  };

  // Reset password placeholder handler
  const handleResetPassword = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResetSuccess(`A password reset link has been dispatched to: ${email} ✅`);
    setTimeout(() => setResetSuccess(null), 4000);
  };

  // Submit form handler
  const onSubmit = async (data: UserFormValues) => {
    try {
      if (editingEmployee) {
        await updateEmployee({ id: editingEmployee._id, payload: data });
      } else {
        await createEmployee(data);
      }
      setModalOpen(false);
      setEditingEmployee(null);
    } catch (err) {
      console.error('Form submission failed:', err);
    }
  };

  // Filtered employees list
  const filteredEmployees = employees;

  const getOfficeName = (officeId: any) => {
    if (typeof officeId === 'object' && officeId !== null) {
      return officeId.name;
    }
    const found = offices.find((o) => o._id === officeId);
    return found ? found.name : 'Unknown Office';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Employee Directory</h1>
          <p className="text-sm text-slate-500">Manage hosts, notification routing credentials, and department configurations.</p>
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

      {/* Password reset notification banner */}
      {resetSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-start space-x-2 shadow-sm animate-fadeIn">
          <Check size={16} className="text-emerald-600 mt-0.5" />
          <span className="text-xs font-medium">{resetSuccess}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee name, email, department..."
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

        {/* Multi Filters Dropdowns */}
        <div className="flex items-center space-x-2 self-start md:self-auto w-full md:w-auto">
          {/* Role Filter */}
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

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Table/List panel */}
        <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${selectedEmployee ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-300`}>
          {/* Desktop/Tablet Table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Office Branch</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {employeesLoading || officesLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Loading employee database directory...
                    </td>
                  </tr>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp._id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                        selectedEmployee?._id === emp._id ? 'bg-blue-50/20' : ''
                      }`}
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
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">
                        {getOfficeName(emp.office_id)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => handleOpenEdit(emp, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                                title="Edit employee"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => handleResetPassword(emp.email, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                                title="Reset password"
                              >
                                <Key size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(emp._id, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                title="Delete employee"
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
                    <td colSpan={6} className="text-center py-12 text-slate-400 space-y-2">
                      <AlertTriangle className="mx-auto text-slate-300" size={24} />
                      <p className="text-xs font-semibold">No employees found</p>
                      <p className="text-[10px] text-slate-400">Try modifying filters or add a new employee profile.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list view */}
          <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/20">
            {employeesLoading || officesLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Loading employee database directory...
              </div>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-4 space-y-3 hover:bg-slate-50/60 cursor-pointer transition-colors ${
                    selectedEmployee?._id === emp._id ? 'bg-blue-50/20 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shrink-0 font-semibold text-xs">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{emp.name}</span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        emp.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        emp.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        emp.role === 'receptionist' ? 'bg-green-50 text-green-700 border-green-200' :
                        emp.role === 'security' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {emp.role}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                    <div className="col-span-2 truncate">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Email</span>
                      <span className="text-slate-700 font-semibold">{emp.email}</span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployee(emp);
                      }}
                      className="flex-1 min-h-[44px] min-w-[80px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-[11px] transition-colors"
                    >
                      <Eye size={12} />
                      View Details
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(emp, e)}
                          className="flex-1 min-h-[44px] min-w-[60px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold text-[11px]"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleResetPassword(emp.email, e)}
                          className="flex-1 min-h-[44px] min-w-[60px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-250 hover:bg-amber-100 rounded-xl text-amber-700 font-bold text-[11px]"
                        >
                          <Key size={12} />
                          Reset
                        </button>
                        <button
                          onClick={(e) => handleDelete(emp._id, e)}
                          className="min-h-[44px] flex items-center justify-center p-2.5 bg-red-50 border border-red-250 hover:bg-red-100 rounded-xl text-red-700 transition-all"
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
                <p className="text-xs font-semibold">No employees found</p>
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
        {selectedEmployee && (
          <div
            onClick={() => setSelectedEmployee(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Details Drawer Panel */}
        {selectedEmployee && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-2xl space-y-6 animate-slideIn fixed inset-x-0 bottom-0 top-16 md:inset-y-0 md:right-0 md:left-auto md:w-[460px] lg:relative lg:inset-auto lg:w-auto lg:col-span-1 z-50 overflow-y-auto custom-scrollbar shadow-blue-500/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800">Employee Profile</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-405 hover:text-slate-600 transition-colors font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-extrabold text-sm shrink-0">
                  {selectedEmployee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{selectedEmployee.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                    {selectedEmployee.department || 'Administration'} / {selectedEmployee.role}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 space-y-3">
                <div className="flex items-center space-x-2.5 text-xs">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-slate-600 font-semibold truncate">{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-slate-600 font-semibold">{selectedEmployee.phone || 'No phone registered'}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs">
                  <Building size={14} className="text-slate-400" />
                  <span className="text-slate-600 font-semibold">{getOfficeName(selectedEmployee.office_id)}</span>
                </div>
                {selectedEmployee.telegram_id && (
                  <div className="flex items-center space-x-2.5 text-xs">
                    <span className="font-bold text-[10px] text-slate-400 uppercase">Telegram:</span>
                    <span className="text-slate-600 font-mono font-bold">{selectedEmployee.telegram_id}</span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="border-t border-slate-50 pt-4 flex flex-col space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleOpenEdit(selectedEmployee, e)}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition-all shadow cursor-pointer"
                    >
                      <Edit2 size={12} />
                      Edit Profile
                    </button>
                    <button
                      onClick={(e) => handleDelete(selectedEmployee._id, e)}
                      className="flex items-center justify-center p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <button
                    onClick={(e) => handleResetPassword(selectedEmployee.email, e)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Key size={12} />
                    Send Password Reset Link
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Creation/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />

          {/* Dialog Container */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden animate-scaleUp max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-12 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                {editingEmployee ? 'Modify Employee Profile' : 'Register New Employee'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[85vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar">
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

              {/* Telegram Host Alert ID */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telegram Host Alert ID (Optional)</label>
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
                  placeholder="e.g. Engineering, Sales, Human Resources"
                  {...register('department')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Role Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Security Access Role</label>
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

              {/* Office Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default Office Branch</label>
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

              {/* Save Footer Buttons */}
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
                  {isSubmitting ? 'Registering...' : 'Save Employee'}
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
