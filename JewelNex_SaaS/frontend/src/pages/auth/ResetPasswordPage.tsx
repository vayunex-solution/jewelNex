import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Gem, ArrowRight, Loader2, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number')
    .regex(/[^a-zA-Z0-9]/, 'Must include a special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();
  
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema)
  });

  if (!email) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center card max-w-md w-full border-dark-700">
          <h2 className="text-xl font-bold text-white mb-4">Invalid Request</h2>
          <p className="text-dark-400 mb-6">Missing email address. Please try requesting a reset again.</p>
          <Link to="/forgot-password" className="btn-primary inline-flex justify-center items-center">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetFormValues) => {
    try {
      await authService.resetPassword({
        email,
        otp: data.otp,
        password: data.password
      });
      setSuccess(true);
      toast.success('Password reset successfully! 💎');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please check your OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-600 to-gold-400 rounded-2xl mb-4 shadow-lg shadow-gold-600/20">
            <Gem className="w-8 h-8 text-dark-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">JewelNex</h1>
          <p className="text-dark-400 text-sm mt-1">Reset Account Password</p>
        </div>

        <div className="card border-dark-700">
          {success ? (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Password Reset!</h3>
              <p className="text-dark-400 mb-6">Your password has been changed successfully.</p>
              <div className="flex items-center justify-center gap-2 text-dark-600 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to login...
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold-600/10 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-gold-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Password</h2>
                  <p className="text-xs text-dark-500">For {email}</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="form-label text-xs uppercase tracking-wider font-bold text-dark-500">6-Digit OTP</label>
                  <input
                    {...register('otp')}
                    type="text"
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    className="block w-full text-center tracking-[0.5em] text-2xl font-mono appearance-none rounded-xl border border-dark-700 bg-dark-900/50 px-3 py-3 text-white placeholder-dark-800 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all"
                  />
                  {errors.otp && <p className="form-error">⚠ {errors.otp.message}</p>}
                </div>

                <div>
                  <label className="form-label text-xs uppercase tracking-wider font-bold text-dark-500">New Password</label>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="input-field"
                  />
                  {errors.password && <p className="form-error">⚠ {errors.password.message}</p>}
                </div>

                <div>
                  <label className="form-label text-xs uppercase tracking-wider font-bold text-dark-500">Confirm Password</label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="input-field"
                  />
                  {errors.confirmPassword && <p className="form-error">⚠ {errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full mt-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  {isSubmitting ? 'Updating...' : 'Reset Password'}
                </button>
              </form>

              <Link to="/login" className="btn-ghost mt-6 w-full justify-center text-xs">
                <ArrowLeft className="w-3 h-3 mr-2" /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-dark-600 text-xs mt-8 relative z-10">
        © {new Date().getFullYear()} VayuNex Solution · Security Portal
      </p>
    </div>
  );
};

export default ResetPasswordPage;
