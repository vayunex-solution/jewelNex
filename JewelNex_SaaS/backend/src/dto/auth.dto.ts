// ─────────────────────────────────────────
// Auth DTOs — Request & Response Contracts
// These are the ONLY shapes controllers expose
// ─────────────────────────────────────────

export interface SignupRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  email: string;
  otp: string;
  password: string;
}

export interface VerifyOTPRequestDto {
  email: string;
  otp: string;
}

export interface ResendOTPRequestDto {
  email: string;
}

// ─────────────────────────────────────────
// Auth Response DTOs
// Never expose raw DB fields to client
// ─────────────────────────────────────────

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  companyId: string | null;
}

export interface LoginResponseDto {
  token: string;
  user: UserResponseDto;
}
