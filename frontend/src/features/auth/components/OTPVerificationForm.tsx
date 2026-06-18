import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export const OTPVerificationForm: React.FC = () => {
  const navigate = useNavigate();
  
  // 6 separate inputs state
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Countdown timer config (60 seconds)
  const INITIAL_COUNTDOWN = 60;
  const [countdown, setCountdown] = useState<number>(INITIAL_COUNTDOWN);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Refs for focusing inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Decrement countdown every second
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      setCanResend(false);
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle value change for a digit input
  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return; // restrict to numbers only

    const newOtp = [...otp];
    // Keep only the last character entered (in case user types over)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Clear error on new typing
    if (apiError) setApiError(null);

    // Auto-focus next input if value is entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspacing and arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[index] === '') {
        // If current is empty, delete previous digit and move focus back
        if (index > 0) {
          newOtp[index - 1] = '';
          setOtp(newOtp);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Just empty current input
        newOtp[index] = '';
        setOtp(newOtp);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting of full 6-digit OTP code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted value is exactly 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      
      // Focus the last input element
      inputRefs.current[5]?.focus();
      
      // Auto-trigger submit if all 6 digits populated
      submitOtpCode(newOtp.join(''));
    } else {
      setApiError('Pasted verification code must be exactly 6 digits.');
    }
  };

  // Resend OTP trigger
  const handleResend = () => {
    if (!canResend) return;

    // FUTURE INTEGRATION POINT:
    // Here, you would trigger the backend API route (e.g., POST /api/auth/resend-otp)
    // with the user's email or phone session identifier.
    
    console.log('OTP Resend requested (Simulated backend integration)');
    setCountdown(INITIAL_COUNTDOWN);
    setCanResend(false);
    setOtp(new Array(6).fill(''));
    setApiError(null);
    inputRefs.current[0]?.focus();
  };

  // Submit helper
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setApiError('Please fill out all 6 digits of the verification code.');
      return;
    }
    submitOtpCode(code);
  };

  const submitOtpCode = async (code: string) => {
    setIsLoading(true);
    setApiError(null);

    // FUTURE INTEGRATION POINT:
    // Here, you will integrate the backend multi-factor verification route
    // (e.g., POST /api/auth/verify-otp) sending the payload: { code, sessionToken }
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSuccess(true);
    
    // Auto-redirect to dashboard after 2 seconds on mock success
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  // Compute filled count for progress indicator
  const filledCount = otp.filter(d => d !== '').length;

  return (
    <div className="space-y-5">
      {/* Demo helper banner */}
      <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-3 text-[11px] text-blue-700 leading-relaxed space-y-1">
        <p className="font-semibold flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0 text-blue-500" />
          Two-Factor Authentication Sandbox Mode
        </p>
        <p>
          Enter any 6 digits to simulate OTP validation. Resending the code resets the countdown timer.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4 text-center py-4 animate-fadeIn select-none">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-green-600 shadow-sm">
              <CheckCircle size={28} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">OTP Verified!</h2>
            <p className="text-xs text-slate-500">
              Access granted. Redirecting to dashboard...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {apiError && (
            <div className="bg-red-50 text-red-700 border border-red-200/80 rounded-xl p-3 text-xs flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium leading-relaxed">{apiError}</span>
            </div>
          )}

          {/* OTP Input Grid – responsive sizing */}
          <div className="space-y-3">
            <div className="flex justify-center items-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-digit-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  disabled={isLoading}
                  value={digit}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all select-none cursor-text ${
                    digit
                      ? 'border-blue-400 bg-blue-50/30 text-blue-700 focus:ring-blue-500/20 focus:border-blue-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5">
              {otp.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    idx < filledCount ? 'bg-blue-500 scale-110' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              id="otp-verify-btn"
              disabled={isLoading || filledCount < 6}
              className="w-full min-h-[44px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <Shield size={15} />
                  <span>Verify OTP Code</span>
                </>
              )}
            </button>

            {/* Resend & Timer options */}
            <div className="flex items-center justify-between text-xs px-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none min-h-[44px]"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Resend Code</span>
              </button>
              
              {!canResend && (
                <span className="text-slate-400 font-medium">
                  Resend in <span className="text-slate-700 font-semibold tabular-nums">{countdown}s</span>
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Back to Login Link */}
      <div className="text-center pt-1 border-t border-slate-100">
        <Link
          to="/login"
          className="inline-flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors gap-1.5 focus:outline-none pt-3 min-h-[44px]"
        >
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};

export default OTPVerificationForm;
