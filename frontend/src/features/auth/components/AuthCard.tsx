import React from 'react';
import { ShieldCheck, Lock, Eye, Fingerprint } from 'lucide-react';

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const FEATURE_HIGHLIGHTS = [
  { icon: ShieldCheck, label: 'Enterprise Security', desc: 'Multi-tenant isolation & encryption' },
  { icon: Eye, label: 'Visitor Tracking', desc: 'Real-time presence monitoring' },
  { icon: Fingerprint, label: 'Face Recognition', desc: 'AI-powered biometric check-in' },
  { icon: Lock, label: 'Role-Based Access', desc: 'Granular permission controls' },
];

export const AuthCard: React.FC<AuthCardProps> = ({
  title,
  description,
  children,
  footer,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-stretch relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/8 blur-[130px] pointer-events-none" />

      {/* ──────────────────────────────── */}
      {/* LEFT Brand Panel (hidden on mobile, visible md+) */}
      {/* ──────────────────────────────── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] xl:w-[55%] flex-col justify-between p-10 lg:p-14 relative z-10 border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <span className="text-white font-extrabold text-lg tracking-tight">VisitorGuard</span>
            <span className="block text-blue-400 text-[10px] font-semibold uppercase tracking-widest leading-none">Enterprise VMS</span>
          </div>
        </div>

        {/* Hero tagline */}
        <div className="space-y-6 mt-auto mb-auto py-10">
          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight">
              Secure visitor<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                management
              </span>
              <br />at every door.
            </h2>
            <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-sm">
              Track, approve, and analyze all visitor activity across your multi-tenant facilities — in real-time.
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
          © {new Date().getFullYear()} VisitorGuard. Enterprise Edition.
        </p>
      </div>

      {/* ──────────────────────────────── */}
      {/* RIGHT Form Panel */}
      {/* ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-8 md:px-10 lg:px-14 relative z-10">
        {/* Mobile Logo (only shown on mobile where brand panel is hidden) */}
        <div className="md:hidden flex items-center gap-2.5 mb-8 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-base tracking-tight">VisitorGuard</span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden animate-fadeIn">
          {/* Card header */}
          <div className="px-8 pt-8 pb-5 text-center border-b border-slate-100 select-none">
            {/* Icon badge - only on mobile (desktop has brand panel) */}
            <div className="md:hidden mx-auto w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 mb-3 hover:scale-105 transition-transform duration-300">
              <ShieldCheck size={22} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Form body */}
          <div className="px-6 sm:px-8 py-6 space-y-4">
            {children}
          </div>

          {/* Optional footer block */}
          {footer && (
            <div className="px-6 sm:px-8 pb-6 pt-0">
              {footer}
            </div>
          )}
        </div>

        {/* Bottom tagline - mobile only */}
        <p className="md:hidden mt-8 text-slate-600 text-[11px] text-center">
          © {new Date().getFullYear()} VisitorGuard Enterprise VMS
        </p>
      </div>
    </div>
  );
};

export default AuthCard;
