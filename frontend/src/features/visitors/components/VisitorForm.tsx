import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type LocalEmployee } from '@/offline/db';
import { type Visitor } from '@/types/api.types';
import { UserCheck2, RefreshCcw, User, Phone, FileText, Briefcase, HelpCircle, Loader2 } from 'lucide-react';

const checkInSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  id_number: z.string().min(4, 'ID number must be at least 4 characters'),
  host_id: z.string().min(1, 'Please select a host employee'),
  purpose: z.string().min(1, 'Please select a purpose for your visit'),
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

interface VisitorFormProps {
  initialData?: Partial<Visitor> | null;
  isIdentified: boolean;
  hosts: LocalEmployee[];
  onSubmit: (data: CheckInFormData) => Promise<void>;
  onReset: () => void;
  isLoading?: boolean;
}

export const VisitorForm: React.FC<VisitorFormProps> = ({
  initialData,
  isIdentified,
  hosts,
  onSubmit,
  onReset,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_number: '',
      host_id: '',
      purpose: '',
    },
  });

  // Update form fields when initialData (face scanning autofill) changes
  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name || '');
      setValue('phone', initialData.phone || '');
      setValue('id_number', initialData.id_number || '');
    } else {
      reset({
        name: '',
        phone: '',
        id_number: '',
        host_id: '',
        purpose: '',
      });
    }
  }, [initialData, setValue, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6 max-w-xl mx-auto w-full"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isIdentified ? 'Visitor Profile Identified' : 'Register New Visitor'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIdentified
              ? 'We matched their face profile. Please fill host & purpose details.'
              : 'Complete the form credentials below to sign in.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <RefreshCcw size={13} />
          Scan Again
        </button>
      </div>

      <div className="space-y-4">
        {/* Visitor Profile Section */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitor Information</h3>
          
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={16} />
              </span>
              <input
                id="name"
                type="text"
                disabled={isIdentified || isLoading}
                placeholder="Jane Doe"
                {...register('name')}
                className={`w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  isIdentified ? 'bg-slate-100 text-slate-600 font-medium' : ''
                }`}
              />
            </div>
            {errors.name && <p className="text-[11px] text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="phone">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Phone size={16} />
              </span>
              <input
                id="phone"
                type="tel"
                disabled={isIdentified || isLoading}
                placeholder="+91 9876543210"
                {...register('phone')}
                className={`w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  isIdentified ? 'bg-slate-100 text-slate-600 font-medium' : ''
                }`}
              />
            </div>
            {errors.phone && <p className="text-[11px] text-red-500 font-medium">{errors.phone.message}</p>}
          </div>

          {/* ID Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="id_number">
              Govt. ID Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <FileText size={16} />
              </span>
              <input
                id="id_number"
                type="text"
                disabled={isIdentified || isLoading}
                placeholder="Aadhar, PAN, or Passport No."
                {...register('id_number')}
                className={`w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  isIdentified ? 'bg-slate-100 text-slate-600 font-medium' : ''
                }`}
              />
            </div>
            {errors.id_number && <p className="text-[11px] text-red-500 font-medium">{errors.id_number.message}</p>}
          </div>
        </div>

        {/* Visit Details Section */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visit Logistics</h3>

          {/* Host Dropdown Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="host_id">
              Select Host Employee
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Briefcase size={16} />
              </span>
              <select
                id="host_id"
                disabled={isLoading}
                {...register('host_id')}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Choose Host Host --</option>
                {hosts.map((host) => (
                  <option key={host._id} value={host._id}>
                    {host.name} ({host.department || 'General'})
                  </option>
                ))}
              </select>
            </div>
            {errors.host_id && <p className="text-[11px] text-red-500 font-medium">{errors.host_id.message}</p>}
          </div>

          {/* Purpose of Visit */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block" htmlFor="purpose">
              Purpose of Visit
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <HelpCircle size={16} />
              </span>
              <select
                id="purpose"
                disabled={isLoading}
                {...register('purpose')}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Choose Purpose --</option>
                <option value="Meeting">Official Meeting</option>
                <option value="Interview">Job Interview</option>
                <option value="Delivery">Package Delivery</option>
                <option value="Service Visit">Maintenance / IT Support</option>
                <option value="Other">Other Purpose</option>
              </select>
            </div>
            {errors.purpose && <p className="text-[11px] text-red-500 font-medium">{errors.purpose.message}</p>}
          </div>
        </div>
      </div>

      {/* Large touch submission */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full min-h-[50px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-65"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Processing visitor check-in...</span>
          </>
        ) : (
          <>
            <UserCheck2 size={18} />
            <span>Complete Guest Check-in</span>
          </>
        )}
      </button>
    </form>
  );
};
