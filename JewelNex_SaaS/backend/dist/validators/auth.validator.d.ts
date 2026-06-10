import { z } from 'zod';
export declare const signupSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const verifyOTPSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const resendOTPSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=auth.validator.d.ts.map