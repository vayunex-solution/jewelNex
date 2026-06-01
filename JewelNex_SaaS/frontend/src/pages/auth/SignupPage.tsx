import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gem, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number')
      .regex(/[^a-zA-Z0-9]/, 'Must include a special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
  <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-400' : 'text-dark-400'}`}>
    <CheckCircle2 className="w-3 h-3" />
    {label}
  </div>
);

const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pwd = watch('password', '');

  const onSubmit = async (data: FormData) => {
    try {
      await authService.signup({ name: data.name, email: data.email, password: data.password });
      setSuccess(true);
      toast.success('Account created! Check your email for OTP.');
      setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Signup failed';
      toast.error(msg);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center card max-w-md w-full animate-slide-up">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-dark-400 text-sm">
            We've sent a 6-digit OTP to your email. Please verify your account.
          </p>
          <p className="text-dark-600 text-xs mt-4">Redirecting to verification page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-600 to-gold-400 rounded-2xl mb-4 shadow-lg shadow-gold-600/20">
            <Gem className="w-8 h-8 text-dark-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">JewelNex</h1>
          <p className="text-dark-400 text-sm mt-1">Smart Jewellery ERP — VayuNex Solution</p>
        </div>

        <div className="card border-dark-700">
          <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
          <p className="text-dark-400 text-sm mb-6">Start your JewelNex journey today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="form-label">Full Name</label>
              <input {...register('name')} type="text" placeholder="Your full name" className="input-field" />
              {errors.name && <p className="form-error">⚠ {errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
              {errors.email && <p className="form-error">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gold-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password strength checklist */}
              {pwd && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <PasswordRequirement met={pwd.length >= 8} label="8+ characters" />
                  <PasswordRequirement met={/[A-Z]/.test(pwd)} label="Uppercase" />
                  <PasswordRequirement met={/[0-9]/.test(pwd)} label="Number" />
                  <PasswordRequirement met={/[^a-zA-Z0-9]/.test(pwd)} label="Special char" />
                </div>
              )}
              {errors.password && <p className="form-error">⚠ {errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className="input-field"
              />
              {errors.confirmPassword && <p className="form-error">⚠ {errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-500 hover:text-gold-400 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-dark-600 text-xs mt-6">
          © {new Date().getFullYear()} VayuNex Solution · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
