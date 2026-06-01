import api from '../lib/api';

export const authService = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: { email: string; otp: string; password: string }) =>
    api.post('/auth/reset-password', data),

  verifyOTP: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),

  resendOTP: (data: { email: string }) =>
    api.post('/auth/resend-otp', data),
};
