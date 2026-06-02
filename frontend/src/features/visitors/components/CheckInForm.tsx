import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type LocalEmployee, type LocalOffice } from '@/offline/db';
import { type Visitor } from '@/types/api.types';
import {
  UserCheck2,
  RefreshCcw,
  User,
  Phone,
  FileText,
  Briefcase,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Camera,
} from 'lucide-react';

const formSchema = z.object({
  // Step 1: Identity Info
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  id_type: z.string(),
  id_number: z.string().min(4, 'ID number must be at least 4 characters'),
  
  // Step 2: Personal Metadata
  email: z.string().email('Please enter a valid email address').or(z.literal('')),
  company_name: z.string().optional(),
  address: z.string().optional(),

  // Step 3: Logistics
  host_id: z.string().min(1, 'Please select a host employee'),
  office_id: z.string().min(1, 'Please select an office branch'),
  purpose: z.string().min(1, 'Please select a purpose of visit'),
  notes: z.string().optional(),
});

export type CheckInFormValues = z.infer<typeof formSchema>;

interface CheckInFormProps {
  initialData?: Partial<Visitor> | null;
  isIdentified: boolean;
  hosts: LocalEmployee[];
  offices: LocalOffice[];
  purposes: string[];
  onSubmit: (data: CheckInFormValues) => Promise<void>;
  onReset: () => void;
  isLoading?: boolean;
}

export const CheckInForm: React.FC<CheckInFormProps> = ({
  initialData,
  isIdentified,
  hosts,
  offices,
  purposes,
  onSubmit,
  onReset,
  isLoading = false,
}) => {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<CheckInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_type: 'Aadhar',
      id_number: '',
      email: '',
      company_name: '',
      address: '',
      host_id: '',
      office_id: '',
      purpose: '',
      notes: '',
    },
  });

  // Prefill form when face recognition matching changes initialData
  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name || '');
      setValue('phone', initialData.phone || '');
      setValue('id_type', initialData.id_type || 'Aadhar');
      setValue('id_number', initialData.id_number || '');
      setValue('email', initialData.email || '');
      setValue('company_name', initialData.company_name || '');
      setValue('address', initialData.address || '');
      // Jump directly to logistics step for identified users
      setStep(3);
    } else {
      reset({
        name: '',
        phone: '',
        id_type: 'Aadhar',
        id_number: '',
        email: '',
        company_name: '',
        address: '',
        host_id: '',
        office_id: offices[0]?._id || '',
        purpose: '',
        notes: '',
      });
      setStep(1);
    }
  }, [initialData, setValue, reset, offices]);

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof CheckInFormValues> = [];
    if (step === 1) {
      fieldsToValidate = ['name', 'phone', 'id_type', 'id_number'];
    } else if (step === 2) {
      fieldsToValidate = ['email', 'company_name', 'address'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const isStep1Invalid = !!(errors.name || errors.phone || errors.id_type || errors.id_number);
  const isStep2Invalid = !!(errors.email || errors.company_name || errors.address);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-5 max-w-xl mx-auto w-full transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isIdentified ? 'Visitor Profile Identified' : 'Register New Visitor'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIdentified
              ? 'Check credentials below and enter visit details.'
              : 'Enter details using the 3-step registration wizard.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <RefreshCcw size={13} />
          Scan Again
        </button>
      </div>

      {/* Step Stepper Visuals (Only for new visitors) */}
      {!isIdentified && (
        <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-xl border border-slate-150 text-[11px] font-bold text-slate-500">
          <div className={`flex items-center gap-1 ${step === 1 ? 'text-blue-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>1</span>
            <span>Identity</span>
          </div>
          <div className="h-[1px] bg-slate-200 flex-1 mx-2"></div>
          <div className={`flex items-center gap-1 ${step === 2 ? 'text-blue-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>2</span>
            <span>Personal</span>
          </div>
          <div className="h-[1px] bg-slate-200 flex-1 mx-2"></div>
          <div className={`flex items-center gap-1 ${step === 3 ? 'text-blue-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>3</span>
            <span>Logistics</span>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4 min-h-[220px]">
        {/* STEP 1: IDENTITY DETAILS */}
        {step === 1 && !isIdentified && (
          <div className="space-y-3.5 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identity Details</h3>
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><User size={16} /></span>
                <input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  {...register('name')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="phone">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Phone size={16} /></span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  {...register('phone')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
              {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>}
            </div>

            {/* ID Type & Number */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="id_type">ID Type</label>
                <select
                  id="id_type"
                  {...register('id_type')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-2.5 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Aadhar">Aadhar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="License">Driving License</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="id_number">Govt. ID Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><FileText size={16} /></span>
                  <input
                    id="id_number"
                    type="text"
                    placeholder="ID card sequence"
                    {...register('id_number')}
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                {errors.id_number && <p className="text-[10px] text-red-500 font-semibold">{errors.id_number.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL METADATA */}
        {step === 2 && !isIdentified && (
          <div className="space-y-3.5 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal & Company Info</h3>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail size={16} /></span>
                <input
                  id="email"
                  type="email"
                  placeholder="jane.doe@company.com"
                  {...register('email')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email.message}</p>}
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="company_name">Company Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Briefcase size={16} /></span>
                <input
                  id="company_name"
                  type="text"
                  placeholder="Acme Corp"
                  {...register('company_name')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="address">Contact Address</label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-slate-400"><MapPin size={16} /></span>
                <textarea
                  id="address"
                  rows={2}
                  placeholder="Visitor home/office city details"
                  {...register('address')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all custom-scrollbar resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: VISIT LOGISTICS */}
        {step === 3 && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Show static profile details if identified */}
            {isIdentified && initialData && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-slate-500">
                  {initialData.photo_url ? (
                    <img src={initialData.photo_url} alt={initialData.name} className="object-cover h-full w-full" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{initialData.name}</h4>
                  <p className="text-slate-500 font-semibold">{initialData.phone} | {initialData.company_name || 'Individual'}</p>
                </div>
              </div>
            )}

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logistics details</h3>

            {/* Host dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="host_id">Select Host Employee</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><User size={16} /></span>
                <select
                  id="host_id"
                  disabled={isLoading}
                  {...register('host_id')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Select Host --</option>
                  {hosts.map((host) => (
                    <option key={host._id} value={host._id}>
                      {host.name} ({host.department || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
              {errors.host_id && <p className="text-[10px] text-red-500 font-semibold">{errors.host_id.message}</p>}
            </div>

            {/* Office dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="office_id">Select Office Branch</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Building size={16} className="w-4 h-4 text-slate-400" /></span>
                <select
                  id="office_id"
                  disabled={isLoading}
                  {...register('office_id')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {offices.map((office) => (
                    <option key={office._id} value={office._id}>
                      {office.name} ({office.city})
                    </option>
                  ))}
                </select>
              </div>
              {errors.office_id && <p className="text-[10px] text-red-500 font-semibold">{errors.office_id.message}</p>}
            </div>

            {/* Purpose dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="purpose">Purpose of Visit</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><HelpCircle size={16} /></span>
                <select
                  id="purpose"
                  disabled={isLoading}
                  {...register('purpose')}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Purpose --</option>
                  {purposes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {errors.purpose && <p className="text-[10px] text-red-500 font-semibold">{errors.purpose.message}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="notes">Visit Notes / Remarks</label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Bag contents, items carried, etc."
                disabled={isLoading}
                {...register('notes')}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all custom-scrollbar resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Button Stepper Actions */}
      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
        {!isIdentified ? (
          <>
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isLoading}
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <div /> // Spacing
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-[50px] px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <UserCheck2 size={16} />
                    <span>Register & Check-In</span>
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[50px] py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Checking In...</span>
              </>
            ) : (
              <>
                <UserCheck2 size={16} />
                <span>Complete Guest Check-In</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

// Simple visual helper building block for dropdown offices
const Building: React.FC<{ size: number; className?: string }> = ({ size, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="9" y1="22" x2="9" y2="16" />
    <line x1="15" y1="22" x2="15" y2="16" />
    <line x1="9" y1="16" x2="15" y2="16" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M8 10h.01" />
    <path d="M16 10h.01" />
  </svg>
);
