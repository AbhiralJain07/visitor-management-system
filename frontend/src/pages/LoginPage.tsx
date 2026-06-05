import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore, type UserSession } from '@/store/authStore';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { type LoginFields } from '@/features/auth/schemas/authSchemas';

export const LoginPage: React.FC = () => {
  const { loginMutate, isLoading, error } = useAuth();
  const { login: storeLogin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isRegister, setIsRegister] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);

  const isHindi = language === 'hi';
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (data: LoginFields) => {
    // If username is an email address, use it directly. Otherwise, format it as email
    const email = data.username.includes('@') ? data.username : `${data.username}@company.com`;
    const success = await loginMutate({ email, password: data.password });
    if (success) {
      const currentUser = useAuthStore.getState().user;
      let targetPath = from;
      if ((targetPath === '/dashboard' || targetPath === '/') && currentUser && ['super_admin', 'support_admin', 'auditor'].includes(currentUser.role)) {
        targetPath = '/super-admin/dashboard';
      }
      navigate(targetPath, { replace: true });
    }
  };

  const handleSimulateLogin = (role: UserSession['role']) => {
    let user: UserSession;
    switch (role) {
      case 'super_admin':
        user = { id: 'sa1', name: 'Super Administrator', email: 'super.admin@vms.com', role: 'super_admin' };
        break;
      case 'support_admin':
        user = { id: 'sup1', name: 'Support Administrator', email: 'support.admin@vms.com', role: 'support_admin' };
        break;
      case 'auditor':
        user = { id: 'aud1', name: 'Auditor General', email: 'auditor.audit@vms.com', role: 'auditor' };
        break;
      case 'admin':
        user = { id: 'admin1', name: 'Alok Sharma', email: 'alok.admin@company.com', role: 'admin' };
        break;
      case 'manager':
        user = { id: 'man1', name: 'Sanjay Dutt', email: 'sanjay.manager@company.com', role: 'manager' };
        break;
      case 'receptionist':
        user = { id: 'rec1', name: 'Pooja Verma', email: 'pooja.reception@company.com', role: 'receptionist' };
        break;
      case 'security':
        user = { id: 'sec1', name: 'Rohan Singh', email: 'rohan.security@company.com', role: 'security' };
        break;
      default:
        user = { id: 'emp1', name: 'Vikram Rao', email: 'vikram.rao@company.com', role: 'employee' };
        break;
    }
    storeLogin(user, `mock-jwt-token-for-${role}`);
    let targetPath = from;
    if ((targetPath === '/dashboard' || targetPath === '/') && ['super_admin', 'support_admin', 'auditor'].includes(role)) {
      targetPath = '/super-admin/dashboard';
    }
    navigate(targetPath, { replace: true });
  };

  const sandboxFooter = (
    <div className="space-y-3">
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200/60"></div>
        <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-bold uppercase tracking-wider select-none">
          Sandbox Simulator Mode
        </span>
        <div className="flex-grow border-t border-slate-200/60"></div>
      </div>

      {/* Tenant Sandbox Triggers */}
      <span className="text-[9px] text-slate-400 font-bold block uppercase select-none">Tenant Portal Profiles</span>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5">
        <button
          type="button"
          id="sandbox-admin"
          onClick={() => handleSimulateLogin('admin')}
          className="text-left bg-slate-50 hover:bg-blue-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-blue-300 min-h-[44px]"
        >
          <span className="font-semibold text-slate-800 leading-tight">Admin</span>
          <span className="text-[9px] text-slate-400">Offices & settings</span>
        </button>
        <button
          type="button"
          id="sandbox-manager"
          onClick={() => handleSimulateLogin('manager')}
          className="text-left bg-slate-50 hover:bg-blue-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-blue-300 min-h-[44px]"
        >
          <span className="font-semibold text-slate-800 leading-tight">Manager</span>
          <span className="text-[9px] text-slate-400">Logs & reports</span>
        </button>
        <button
          type="button"
          id="sandbox-receptionist"
          onClick={() => handleSimulateLogin('receptionist')}
          className="text-left bg-slate-50 hover:bg-blue-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-blue-300 min-h-[44px]"
        >
          <span className="font-semibold text-slate-800 leading-tight">Receptionist</span>
          <span className="text-[9px] text-slate-400">Check-in guests</span>
        </button>
        <button
          type="button"
          id="sandbox-security"
          onClick={() => handleSimulateLogin('security')}
          className="text-left bg-slate-50 hover:bg-blue-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-blue-300 min-h-[44px]"
        >
          <span className="font-semibold text-slate-800 leading-tight">Security</span>
          <span className="text-[9px] text-slate-400">Inspect logs</span>
        </button>
        <button
          type="button"
          id="sandbox-employee"
          onClick={() => handleSimulateLogin('employee')}
          className="text-left bg-slate-50 hover:bg-blue-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-blue-300 col-span-2 sm:col-span-1 min-h-[44px]"
        >
          <span className="font-semibold text-slate-800 leading-tight">Employee Host</span>
          <span className="text-[9px] text-slate-400">Approve visitors</span>
        </button>
      </div>

      {/* Super Admin Sandbox Triggers */}
      <span className="text-[9px] text-slate-400 font-bold block uppercase select-none pt-1">Platform Admin Profiles</span>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          id="sandbox-super-admin"
          onClick={() => handleSimulateLogin('super_admin')}
          className="text-left bg-slate-50 hover:bg-indigo-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-indigo-300 min-h-[44px]"
        >
          <span className="font-bold text-slate-800 leading-tight">Super Admin</span>
          <span className="text-[9px] text-slate-400">Full Access</span>
        </button>
        <button
          type="button"
          id="sandbox-support-admin"
          onClick={() => handleSimulateLogin('support_admin')}
          className="text-left bg-slate-50 hover:bg-indigo-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-indigo-300 min-h-[44px]"
        >
          <span className="font-semibold text-slate-800 leading-tight">Support</span>
          <span className="text-[9px] text-slate-400">Masters ctrl</span>
        </button>
        <button
          type="button"
          id="sandbox-auditor"
          onClick={() => handleSimulateLogin('auditor')}
          className="text-left bg-slate-50 hover:bg-indigo-50/50 text-slate-700 border border-slate-200 rounded-xl p-2.5 text-xs transition-all flex flex-col gap-0.5 hover:border-indigo-300 min-h-[44px]"
        >
          <span className="font-semibold text-slate-800 leading-tight">Auditor</span>
          <span className="text-[9px] text-slate-400">Analytics</span>
        </button>
      </div>
    </div>
  );

  const getTitle = () => {
    if (isRegister) {
      return isHindi ? 'खाता बनाएं' : 'Create Account';
    }
    return isHindi ? 'स्वागत है' : 'Welcome Back';
  };

  const getDescription = () => {
    if (isRegister) {
      return isHindi
        ? 'अपनी कंपनी पंजीकृत करें और अतिथियों का प्रबंधन शुरू करें।'
        : 'Register your company and start managing visitors.';
    }
    return isHindi
      ? 'जारी रखने के लिए अपनी कंपनी चुनें और साइन इन करें।'
      : 'Select your company and sign in to continue.';
  };

  const sandboxWidget = (
    <div className="w-full border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900/90 backdrop-blur">
      <button
        type="button"
        onClick={() => setShowSandbox(!showSandbox)}
        className="w-full px-5 py-3 flex items-center justify-between text-left text-[10px] font-black text-slate-400 hover:text-white bg-slate-900/95 hover:bg-slate-800 transition-all select-none focus:outline-none min-h-[40px] tracking-wider"
      >
        <span>🛠️ DEVELOPER SANDBOX SIMULATOR</span>
        <span>{showSandbox ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
      </button>
      {showSandbox && (
        <div className="p-4 border-t border-slate-800/80 max-h-[260px] overflow-y-auto custom-scrollbar">
          {sandboxFooter}
        </div>
      )}
    </div>
  );

  return (
    <AuthCard
      title={getTitle()}
      description={getDescription()}
      language={language}
      onLanguageChange={setLanguage}
      footer={sandboxWidget}
    >
      {isRegister ? (
        <RegisterForm
          onBackToLogin={() => setIsRegister(false)}
          language={language}
        />
      ) : (
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          apiError={error}
          language={language}
          onRegisterToggle={() => setIsRegister(true)}
        />
      )}
    </AuthCard>
  );
};

export default LoginPage;
