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
export interface UserResponseDto {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
}
export interface LoginResponseDto {
    token: string;
    user: UserResponseDto;
}
//# sourceMappingURL=auth.dto.d.ts.map