import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFields } from '../schemas/authSchemas';

export const ForgotPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setIsLoading(true);
    // Simulate backend integration delay
    // Note: In the future, hook up the actual backend API request here
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmittedEmail(data.email);
    setIsLoading(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center animate-fadeIn select-none py-2">
        {/* Success icon with ring animation */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-green-600 shadow-sm">
              <CheckCircle2 size={28} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Check your inbox</h2>
            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              We sent a secure password reset link to{' '}
              <span className="font-semibold text-slate-800 break-all">{submittedEmail}</span>.
              Please check your inbox and spam folder.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Resend Reset Link
          </button>

          <Link
            to="/login"
            className="inline-flex items-center justify-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors gap-1.5 focus:outline-none pt-1"
          >
            <ArrowLeft size={14} />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="forgot-email"
            className="text-xs font-semibold text-slate-700 block"
          >
            Registered Email Address
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
              <Mail size={16} />
            </span>
            <input
              id="forgot-email"
              type="email"
              disabled={isLoading}
              placeholder="you@company.com"
              autoComplete="email"
              {...register('email')}
              className={`w-full text-sm bg-slate-50 border rounded-xl pl-10 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-1 transition-all disabled:opacity-60 min-h-[44px] ${
                errors.email
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-medium text-red-600 animate-fadeIn">
              {errors.email.message}
            </p>
          )}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            We'll send a secure link to reset your password. Link expires in 15 minutes.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          id="forgot-password-submit-btn"
          className="w-full min-h-[44px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Sending reset link...</span>
            </>
          ) : (
            <>
              <Send size={15} />
              <span>Send Reset Link</span>
            </>
          )}
        </button>
      </form>

      {/* Back to Login Link */}
      <div className="text-center pt-1">
        <Link
          to="/login"
          className="inline-flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors gap-1.5 focus:outline-none"
        >
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
