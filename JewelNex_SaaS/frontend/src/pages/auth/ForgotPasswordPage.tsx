import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Gem, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

const schema = z.object({ email: z.string().email('Invalid email address') });
type FormData = z.infer<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.forgotPassword(data);
      toast.success('An OTP has been sent to your email.');
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-600 to-gold-400 rounded-2xl mb-4 shadow-lg shadow-gold-600/20">
            <Gem className="w-8 h-8 text-dark-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">JewelNex</h1>
          <p className="text-dark-400 text-sm mt-1">Smart Jewellery ERP</p>
        </div>

        <div className="card border-dark-700">
          <div className="w-12 h-12 bg-gold-600/10 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-gold-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Forgot Password?</h2>
          <p className="text-dark-400 text-sm mb-6">
            No worries! Enter your email and we'll send you a 6-digit OTP to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
              {errors.email && <p className="form-error">⚠ {errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Mail className="w-4 h-4" /> Send OTP</>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4 border-t border-dark-800 pt-4">
            <Link to="/reset-password" className="text-sm text-gold-500 hover:text-gold-400 font-semibold transition-colors">
              Already have an OTP? Enter it here
            </Link>
            
            <Link to="/login" className="btn-ghost justify-center">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
