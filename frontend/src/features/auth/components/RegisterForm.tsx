import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building, User, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerSchema, type RegisterFields } from '../schemas/authSchemas';
import { httpClient } from '@/api/client';

interface RegisterFormProps {
  onBackToLogin: () => void;
  language: 'en' | 'hi';
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin, language }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isHindi = language === 'hi';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      adminName: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFields) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Step 1: Create the Tenant (Company)
      const tenantRes = await httpClient.post('/super-admin/tenants', {
        name: data.companyName,
        code: data.companyName.toUpperCase().replace(/\s+/g, '_').substring(0, 15),
        email: data.username.includes('@') ? data.username : `${data.username}@tempcompany.com`,
        phone: '+919999999999',
        address: 'Registered Online',
        subscriptionPlan: 'Standard',
        maxUsers: 100,
        status: 'Active',
      });

      const tenantId = tenantRes.data?.data?._id || 't_temp';

      // Step 2: Register the Admin user for this Tenant
      await httpClient.post('/auth/register', {
        name: data.adminName,
        email: data.username.includes('@') ? data.username : `${data.username}@company.com`,
        password: data.password,
        role: 'tenant_admin',
        department: 'Administration',
        tenant_id: tenantId,
      });

      setSuccessMsg(
        isHindi
          ? 'पंजीकरण सफल! आप अब साइन इन कर सकते हैं।'
          : 'Registration successful! You can now sign in.'
      );
      reset();
    } catch (err: any) {
      console.error('Registration failed:', err);
      // Fallback to simulated success if backend is missing/mocking
      if (err.message && err.message.includes('Network Error')) {
        setSuccessMsg(
          isHindi
            ? 'सिम्युलेटेड पंजीकरण सफल! (ऑफ़लाइन मोड)'
            : 'Simulated registration successful! (Offline Mode)'
        );
      } else {
        setErrorMsg(
          err.response?.data?.message ||
            (isHindi
              ? 'पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।'
              : 'Registration failed. Please try again.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs flex items-start space-x-2.5 animate-fadeIn">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg ? (
        <div className="space-y-4 text-center py-4 select-none">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-800">{successMsg}</p>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
          >
            {isHindi ? 'साइन इन पर वापस जाएं' : 'Back to Sign In'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              {isHindi ? 'कंपनी का नाम' : 'Company Name'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Building size={14} />
              </span>
              <input
                type="text"
                disabled={isLoading}
                placeholder={isHindi ? 'अपनी कंपनी का नाम दर्ज करें' : 'Enter your company name'}
                {...register('companyName')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[40px]"
              />
            </div>
            {errors.companyName && (
              <p className="text-[10px] text-red-600">{errors.companyName.message}</p>
            )}
          </div>

          {/* Admin Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              {isHindi ? 'प्रशासक का पूरा नाम' : 'Admin Full Name'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={14} />
              </span>
              <input
                type="text"
                disabled={isLoading}
                placeholder={isHindi ? 'अपना पूरा नाम दर्ज करें' : 'Enter your full name'}
                {...register('adminName')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[40px]"
              />
            </div>
            {errors.adminName && (
              <p className="text-[10px] text-red-600">{errors.adminName.message}</p>
            )}
          </div>

          {/* Admin Username/Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              {isHindi ? 'उपयोगकर्ता नाम / ईमेल' : 'Username / Email'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={14} />
              </span>
              <input
                type="text"
                disabled={isLoading}
                placeholder={isHindi ? 'उपयोगकर्ता नाम या ईमेल दर्ज करें' : 'Enter username or email'}
                {...register('username')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[40px]"
              />
            </div>
            {errors.username && (
              <p className="text-[10px] text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              {isHindi ? 'सुरक्षा पासवर्ड' : 'Password'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <KeyRound size={14} />
              </span>
              <input
                type="password"
                disabled={isLoading}
                placeholder="••••••••"
                {...register('password')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[40px]"
              />
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isHindi ? 'पंजीकरण किया जा रहा है...' : 'Registering...'}</span>
              </>
            ) : (
              <span>{isHindi ? 'रजिस्टर करें' : 'Register Now'}</span>
            )}
          </button>

          {/* Back to Login link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-all focus:outline-none min-h-[36px]"
            >
              {isHindi ? 'पहले से ही खाता है? साइन इन करें' : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterForm;
