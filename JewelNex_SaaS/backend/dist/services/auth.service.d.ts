import type { SignupRequestDto, LoginRequestDto, VerifyOTPRequestDto, ResendOTPRequestDto, ForgotPasswordRequestDto, ResetPasswordRequestDto, LoginResponseDto } from '../dto/auth.dto';
export declare const signupService: (data: SignupRequestDto) => Promise<{
    message: string;
}>;
export declare const verifyOTPService: (data: VerifyOTPRequestDto) => Promise<{
    message: string;
}>;
export declare const resendOTPService: (data: ResendOTPRequestDto) => Promise<{
    message: string;
}>;
export declare const loginService: (data: LoginRequestDto) => Promise<LoginResponseDto>;
export declare const forgotPasswordService: (data: ForgotPasswordRequestDto) => Promise<{
    message: string;
}>;
export declare const resetPasswordService: (data: ResetPasswordRequestDto) => Promise<{
    message: string;
}>;
//# sourceMappingURL=auth.service.d.ts.map