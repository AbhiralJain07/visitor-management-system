import React from 'react';
import { ShieldCheck, Lock, Eye, Fingerprint, Globe } from 'lucide-react';

const LanguageSelectorDropdown: React.FC<{
  language: 'en' | 'hi';
  onLanguageChange: (lang: 'en' | 'hi') => void;
}> = ({ language, onLanguageChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="mb-4 relative z-30 select-none flex justify-center animate-fadeIn">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-4 py-2 shadow-sm text-xs font-bold text-slate-800 hover:border-slate-300 transition-all select-none focus:outline-none min-h-[36px] cursor-pointer"
      >
        <Globe size={14} className="text-blue-500 shrink-0" />
        <span>{language === 'hi' ? 'हिंदी (HI)' : 'English (EN)'}</span>
        <span className="text-[9px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 animate-scaleIn">
            <button
              type="button"
              onClick={() => {
                onLanguageChange('en');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                language === 'en' ? 'text-blue-600 bg-blue-50/40' : 'text-slate-700'
              }`}
            >
              <span>English (EN)</span>
              {language === 'en' && <span className="text-blue-500 font-bold">✓</span>}
            </button>
            <button
              type="button"
              onClick={() => {
                onLanguageChange('hi');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                language === 'hi' ? 'text-blue-600 bg-blue-50/40' : 'text-slate-700'
              }`}
            >
              <span>हिंदी (HI)</span>
              {language === 'hi' && <span className="text-blue-500 font-bold">✓</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  language?: 'en' | 'hi';
  onLanguageChange?: (lang: 'en' | 'hi') => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  title,
  description,
  children,
  footer,
  language = 'en',
  onLanguageChange,
}) => {
  const isHindi = language === 'hi';

  const FEATURE_HIGHLIGHTS = [
    { 
      icon: ShieldCheck, 
      label: isHindi ? 'उद्यम सुरक्षा' : 'Enterprise Security', 
      desc: isHindi ? 'बहु-किरायेदार अलगाव और एन्क्रिप्शन' : 'Multi-tenant isolation & encryption' 
    },
    { 
      icon: Eye, 
      label: isHindi ? 'अतिथि ट्रैकिंग' : 'Atithi Tracking', 
      desc: isHindi ? 'वास्तविक समय उपस्थिति की निगरानी' : 'Real-time presence monitoring' 
    },
    { 
      icon: Fingerprint, 
      label: isHindi ? 'चेहरा पहचान' : 'Face Recognition', 
      desc: isHindi ? 'अतिथि के लिए एआई-संचालित बायोमेट्रिक चेक-इन' : 'AI-powered biometric check-in for Atithi' 
    },
    { 
      icon: Lock, 
      label: isHindi ? 'भूमिका आधारित पहुंच' : 'Role-Based Access', 
      desc: isHindi ? 'अतिथि लॉग के लिए बारीक अनुमति नियंत्रण' : 'Granular permission controls for Atithi logs' 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-stretch relative overflow-hidden font-sans">
      {/* Ambient background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/8 blur-[130px] pointer-events-none" />

      {/* ──────────────────────────────── */}
      {/* LEFT Brand Panel (hidden on mobile, visible md+) */}
      {/* ──────────────────────────────── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] xl:w-[55%] flex-col justify-between p-10 lg:p-14 relative z-10 border-r border-white/5 bg-slate-900/40">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <span className="text-white font-extrabold text-lg tracking-tight">
              Atithi Devo Bhavah | अतिथि देवो भवः
            </span>
            <span className="block text-blue-400 text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5">
              {isHindi ? 'एंटरप्राइज अतिथि प्रबंधन' : 'Enterprise Visitor Management'}
            </span>
          </div>
        </div>

        {/* Hero tagline */}
        <div className="space-y-6 mt-auto mb-auto py-10">
          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight">
              {isHindi ? 'हर द्वार पर' : 'Secure Atithi'}<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {isHindi ? 'सुरक्षित अतिथि प्रबंधन।' : 'management'}
              </span>
              <br />{isHindi ? '' : 'at every door.'}
            </h2>
            <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-sm">
              {isHindi 
                ? 'वास्तविक समय में अपनी बहु-किरायेदार सुविधाओं में सभी अतिथि गतिविधियों को ट्रैक, स्वीकृत और विश्लेषण करें।' 
                : 'Track, approve, and analyze all Atithi activity across your multi-tenant facilities — in real-time.'}
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {FEATURE_HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <Icon size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-none">{label}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-[10px] font-medium">
          © {new Date().getFullYear()} Atithi Devo Bhavah VMS.
        </p>
      </div>

      {/* ──────────────────────────────── */}
      {/* RIGHT Form Panel */}
      {/* ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-8 md:px-10 lg:px-14 relative z-10 bg-slate-900/10">
        {/* Mobile Logo (only shown on mobile where brand panel is hidden) */}
        <div className="md:hidden flex flex-col items-center gap-1.5 mb-6 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="text-white font-extrabold text-base tracking-tight text-center">
              Atithi Devo Bhavah | अतिथि देवो भवः
            </span>
          </div>
          <span className="text-blue-400 text-[9px] font-bold uppercase tracking-wider text-center">
            {isHindi ? 'एंटरप्राइज अतिथि प्रबंधन प्रणाली' : 'Enterprise Visitor Management'}
          </span>
        </div>

        {/* Language selector pill sitting above the login card */}
        {onLanguageChange && (
          <LanguageSelectorDropdown
            language={language}
            onLanguageChange={onLanguageChange}
          />
        )}

        {/* Form card */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden animate-fadeIn">
          {/* Card header */}
          <div className="px-8 pt-8 pb-5 text-center border-b border-slate-100 select-none">
            {/* Icon badge - only on mobile */}
            <div className="md:hidden mx-auto w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 mb-3 hover:scale-105 transition-transform duration-300">
              <ShieldCheck size={22} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[300px] mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Form body */}
          <div className="px-6 sm:px-8 py-6 space-y-4">
            {children}
          </div>
        </div>

        {/* Optional footer block (aligned with the card) */}
        {footer && (
          <div className="w-full max-w-md mt-5 select-none z-20">
            {footer}
          </div>
        )}

        {/* Bottom tagline - mobile only */}
        <p className="md:hidden mt-8 text-slate-500 text-[10px] text-center font-medium">
          © {new Date().getFullYear()} EvolveITSM VMS
        </p>
      </div>
    </div>
  );
};

export default AuthCard;
