import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gem, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.login(data);
      const { token, user } = res.data.data;
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}! 💎`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed';
      const code = err?.response?.data?.code;

      if (code === 'UNVERIFIED') {
        toast.error(msg);
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background glow */}
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

        {/* Card */}
        <div className="card border-dark-700">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-dark-400 text-sm mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && <p className="form-error">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="input-field pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gold-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="form-error">⚠ {errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-gold-500 hover:text-gold-400 font-semibold transition-colors">
              Create account
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

export default LoginPage;
