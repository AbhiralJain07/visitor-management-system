import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { User, KeyRound, Eye, EyeOff, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { loginSchema, type LoginFields } from '../schemas/authSchemas';


interface LoginFormProps {
  onSubmit: (data: LoginFields) => void;
  isLoading: boolean;
  apiError: string | null;
  language: 'en' | 'hi';
  onRegisterToggle: () => void;
}

const DEFAULT_COMPANIES = [
  { _id: 't1', name: 'Acme Corporate Solutions' },
  { _id: 't2', name: 'Zenith Tech Hubs' },
  { _id: 't3', name: 'Vanguard FinTech' },
  { _id: 't4', name: 'Starlight Retailers' },
  { _id: 't5', name: 'Apex Manufacturing' }
];

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  apiError,
  language,
  onRegisterToggle,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [tenants, setTenants] = useState<{_id: string, name: string}[]>([]);

    useEffect(() => {
    fetch('http://localhost:8080/api/tenants/public')
    .then(r => r.json())
    .then(res => { if (res.success) setTenants(res.data); })
    .catch(() => {});
    }, []);

  const isHindi = language === 'hi';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      company: '',
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const companiesList = tenants && tenants.length > 0 ? tenants : DEFAULT_COMPANIES;

  const [companyOpen, setCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ _id: string, name: string } | null>(null);

  const selectCompanyOption = (c: { _id: string, name: string }) => {
    setSelectedCompany(c);
    setValue('company', c._id, { shouldValidate: true });
    setCompanyOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* API Level Credentials/Network Errors */}
      {apiError && (
        <div className="bg-red-50 text-red-700 border border-red-200/80 rounded-xl p-3 text-xs flex items-start space-x-2.5 animate-fadeIn">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <span className="font-medium leading-relaxed">{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Company Custom Dropdown Field */}
        <div className="space-y-1">
          <label
            htmlFor="login-company"
            className="text-xs font-semibold text-slate-700 block transition-colors"
          >
            {isHindi ? 'कंपनी' : 'Company'}
          </label>
          <input type="hidden" {...register('company')} />
          <div className="relative">
            <button
              id="login-company"
              type="button"
              disabled={isLoading}
              onClick={() => setCompanyOpen(!companyOpen)}
              className={`w-full text-left text-sm bg-slate-50 border rounded-xl pl-10 pr-10 py-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-60 min-h-[44px] flex items-center justify-between ${
                errors.company ? 'border-red-300 ring-red-500 bg-red-50/10' : 'border-slate-200'
              }`}
            >
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Building2 size={16} />
              </span>
              <span className={selectedCompany ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                {selectedCompany
                  ? selectedCompany.name
                  : isHindi
                  ? 'अपनी कंपनी चुनें'
                  : 'Select your company'}
              </span>
              <span className="text-slate-400 text-[9px]">▼</span>
            </button>

            {companyOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCompanyOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 max-h-56 overflow-y-auto custom-scrollbar animate-scaleIn">
                  {companiesList.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => selectCompanyOption(c)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        selectedCompany?._id === c._id ? 'text-blue-600 bg-blue-50/40' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400 shrink-0" />
                        <span>{c.name}</span>
                      </div>
                      {selectedCompany?._id === c._id && <span className="text-blue-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {errors.company && (
            <p className="text-[11px] font-medium text-red-600 animate-fadeIn">
              {errors.company.message}
            </p>
          )}
        </div>

        {/* Username Field */}
        <div className="space-y-1">
          <label
            htmlFor="login-username"
            className="text-xs font-semibold text-slate-700 block transition-colors"
          >
            {isHindi ? 'उपयोगकर्ता नाम' : 'Username'}
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
              <User size={16} />
            </span>
            <input
              id="login-username"
              type="text"
              disabled={isLoading}
              placeholder={isHindi ? 'अपना उपयोगकर्ता नाम दर्ज करें' : 'Enter your username'}
              autoComplete="username"
              {...register('username')}
              className={`w-full text-sm bg-slate-50 border rounded-xl pl-10 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 min-h-[44px] ${
                errors.username
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
          {errors.username && (
            <p className="text-[11px] font-medium text-red-600 animate-fadeIn">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold text-slate-700 block"
            >
              {isHindi ? 'सुरक्षा पासवर्ड' : 'Password'}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:underline"
            >
              {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
            </Link>
          </div>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
              <KeyRound size={16} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              disabled={isLoading}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              className={`w-full text-sm bg-slate-50 border rounded-xl pl-10 pr-10 py-3 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 min-h-[44px] ${
                errors.password
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none min-w-[44px] justify-end"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-medium text-red-600 animate-fadeIn">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center">
          <input
            id="login-rememberMe"
            type="checkbox"
            disabled={isLoading}
            {...register('rememberMe')}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-60"
          />
          <label
            htmlFor="login-rememberMe"
            className="ml-2 block text-xs font-medium text-slate-600 select-none cursor-pointer"
          >
            {isHindi ? 'इस डिवाइस पर मुझे याद रखें' : 'Remember me on this device'}
          </label>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          id="login-submit-btn"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{isHindi ? 'प्रमाणित किया जा रहा है...' : 'Authenticating...'}</span>
            </>
          ) : (
            <span className="uppercase tracking-wider">{isHindi ? 'साइन इन करें' : 'Sign In'}</span>
          )}
        </button>
      </form>

      {/* New Customer Registration Link */}
      <div className="text-center pt-2 select-none border-t border-slate-100">
        <span className="text-xs text-slate-500 mr-1.5">
          {isHindi ? 'नए ग्राहक?' : 'New customer?'}
        </span>
        <button
          type="button"
          onClick={onRegisterToggle}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none min-h-[36px]"
        >
          {isHindi ? 'यहाँ पंजीकरण करें' : 'Register here'}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
