import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Mail, Gem } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

const VerifyOTPPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isResending, setIsResending] = useState(false);

  if (!email) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans p-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center card border-dark-700">
          <h2 className="text-xl font-bold text-white mb-4">Invalid Access</h2>
          <p className="text-dark-400 mb-6">We couldn't find an email to verify. Please try signing up again.</p>
          <Link to="/signup" className="btn-primary inline-flex justify-center items-center">
            Go to Signup
          </Link>
        </div>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }
    
    setStatus('loading');
    try {
      await authService.verifyOTP({ email, otp });
      setStatus('success');
      toast.success('Account verified successfully! 💎');
      setTimeout(() => navigate('/login'), 2500);
    } catch (error: any) {
      setStatus('idle');
      toast.error(error.response?.data?.message || 'Verification failed. Please check your OTP.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendOTP({ email });
      toast.success('A fresh OTP has been sent to your email.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-600/5 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-600 to-gold-400 rounded-2xl mb-4 shadow-lg shadow-gold-600/20">
            <Gem className="w-8 h-8 text-dark-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">JewelNex</h1>
          <p className="text-dark-400 text-sm mt-1">VayuNex Solution Verification</p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up delay-75 relative z-10">
        <div className="card border-dark-700 text-center">
          {status === 'success' ? (
            <div className="py-8 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-dark-400 mb-8">Your email has been verified. Welcome to the elite club.</p>
              <div className="flex items-center justify-center gap-2 text-dark-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to login...
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6 text-left">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Verify your account</h2>
                <p className="text-sm text-dark-400 mb-6">
                  We've sent a 6-digit code to <span className="text-gold-400 font-medium">{email}</span>
                </p>
                
                <label className="form-label text-center">Enter 6-Digit OTP</label>
                <div className="mt-2">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0 0 0 0 0 0"
                    className="block w-full text-center tracking-[0.75em] text-3xl font-mono appearance-none rounded-xl border border-dark-600 bg-dark-800 px-3 py-4 text-dark-50 placeholder-dark-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || otp.length !== 6}
                className="btn-primary w-full py-3 text-base"
              >
                {status === 'loading' ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Verifying...</>
                ) : (
                  'Verify & Activate Account'
                )}
              </button>

              <div className="pt-4 border-t border-dark-800 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-sm text-gold-500 hover:text-gold-400 font-semibold transition-colors disabled:opacity-50"
                >
                  {isResending ? 'Sending OTP...' : "Didn't receive the code? Resend"}
                </button>
                
                <Link to="/login" className="text-xs text-dark-500 hover:text-dark-400 transition-colors">
                  Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-dark-600 text-xs mt-12 relative z-10">
        © {new Date().getFullYear()} VayuNex Solution · Secure Authentication System
      </p>
    </div>
  );
};

export default VerifyOTPPage;
