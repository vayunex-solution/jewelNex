import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/apiResponse';
import {
  signupService,
  loginService,
  verifyOTPService,
  resendOTPService,
  forgotPasswordService,
  resetPasswordService,
} from '../services/auth.service';
import type {
  SignupRequestDto,
  LoginRequestDto,
  VerifyOTPRequestDto,
  ResendOTPRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
} from '../dto/auth.dto';

// ─────────────────────────────────────────
// AUTH CONTROLLER
// Thin controller — ONLY delegates to service
// No business logic here!
// ─────────────────────────────────────────

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await signupService(req.body as SignupRequestDto);
    res.status(201).json(successResponse(result.message));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signup failed';
    res.status(400).json(errorResponse(message));
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginService(req.body as LoginRequestDto);
    res.status(200).json(successResponse('Login successful', result));
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Login failed';
    const code = err?.code || 'UNAUTHORIZED';
    res.status(401).json({ success: false, message, code });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Verify OTP Request Body:', req.body);
    const result = await verifyOTPService(req.body as VerifyOTPRequestDto);
    res.status(200).json(successResponse(result.message));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    console.error('Verify OTP Error:', message);
    res.status(400).json(errorResponse(message));
  }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await resendOTPService(req.body as ResendOTPRequestDto);
    res.status(200).json(successResponse(result.message));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resend OTP';
    res.status(400).json(errorResponse(message));
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await forgotPasswordService(req.body as ForgotPasswordRequestDto);
    res.status(200).json(successResponse(result.message));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed';
    res.status(400).json(errorResponse(message));
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await resetPasswordService(req.body as ResetPasswordRequestDto);
    res.status(200).json(successResponse(result.message));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reset failed';
    res.status(400).json(errorResponse(message));
  }
};
