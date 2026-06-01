import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { sendMail } from '../utils/mailer';
import { generateOTP, generateTokenExpiry } from '../utils/tokenGenerator';
import { verificationEmailTemplate, resetPasswordEmailTemplate } from '../emails/templates';
import type {
  SignupRequestDto,
  LoginRequestDto,
  VerifyOTPRequestDto,
  ResendOTPRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  LoginResponseDto,
  UserResponseDto,
} from '../dto/auth.dto';

// ─────────────────────────────────────────
// AUTH SERVICE
// All business logic lives here.
// Controllers call this — never Prisma directly.
// ─────────────────────────────────────────

const SALT_ROUNDS = 12;

// Helper: Map user+role to safe UserResponseDto
const toUserDto = (user: { id: string; name: string; email: string; isVerified: boolean; role: { name: string } }): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role.name,
  isVerified: user.isVerified,
});

// Custom Error class to carry codes
class AuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// ─────────────────────────────────────────
// SIGNUP SERVICE
// ─────────────────────────────────────────
export const signupService = async (data: SignupRequestDto): Promise<{ message: string }> => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  
  if (existing) {
    if (!existing.isVerified) {
      // Resend OTP for unverified existing account
      const verificationToken = generateOTP();
      const verificationTokenExpiry = generateTokenExpiry(24);
      
      await prisma.user.update({
        where: { id: existing.id },
        data: { verificationToken, verificationTokenExpiry }
      });
      
      sendMail({
        to: data.email,
        subject: 'Verify Your JewelNex Account',
        html: verificationEmailTemplate(existing.name, verificationToken),
      }).catch((error) => {});
      
      return { message: 'Account exists but is not verified. A new OTP has been sent to your email.' };
    }
    throw new AuthError('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  let role = await prisma.role.findFirst({ where: { name: 'admin' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'admin' } });
  }

  const verificationToken = generateOTP();
  const verificationTokenExpiry = generateTokenExpiry(24);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      roleId: role.id,
      verificationToken,
      verificationTokenExpiry,
    },
    include: { role: true },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'SIGNUP', metadata: { email: data.email } },
  });

  sendMail({
    to: data.email,
    subject: 'Verify Your JewelNex Account',
    html: verificationEmailTemplate(data.name, verificationToken),
  }).catch((error) => {
    // Silently fail mail send on signup to not block user creation
  });

  return { message: 'Account created! Please check your email for the OTP to verify your account.' };
};

// ─────────────────────────────────────────
// VERIFY OTP SERVICE
// ─────────────────────────────────────────
export const verifyOTPService = async (data: VerifyOTPRequestDto): Promise<{ message: string }> => {
  const user = await prisma.user.findFirst({
    where: {
      email: data.email,
      verificationToken: data.otp,
      verificationTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthError('Invalid or expired OTP');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'VERIFY_EMAIL' },
  });

  return { message: 'Email verified successfully. You can now log in.' };
};

// ─────────────────────────────────────────
// RESEND OTP SERVICE
// ─────────────────────────────────────────
export const resendOTPService = async (data: ResendOTPRequestDto): Promise<{ message: string }> => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    // Silent success to prevent enumeration
    return { message: 'If your account exists and is unverified, a new OTP has been sent.' };
  }

  if (user.isVerified) {
    throw new AuthError('Account is already verified.');
  }

  const verificationToken = generateOTP();
  const verificationTokenExpiry = generateTokenExpiry(24);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  sendMail({
    to: data.email,
    subject: 'Verify Your JewelNex Account',
    html: verificationEmailTemplate(user.name, verificationToken),
  }).catch((error) => {});

  return { message: 'If your account exists and is unverified, a new OTP has been sent.' };
};

// ─────────────────────────────────────────
// LOGIN SERVICE
// ─────────────────────────────────────────
export const loginService = async (data: LoginRequestDto): Promise<LoginResponseDto> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { role: true },
  });

  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  if (!user.isVerified) {
    // Optionally trigger an OTP resend here automatically
    const verificationToken = generateOTP();
    const verificationTokenExpiry = generateTokenExpiry(24);
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpiry },
    });
    sendMail({
      to: user.email,
      subject: 'Verify Your JewelNex Account',
      html: verificationEmailTemplate(user.name, verificationToken),
    }).catch((e) => {});

    throw new AuthError('Please verify your email before logging in. A new OTP has been sent.', 'UNVERIFIED');
  }

  if (!user.isActive) {
    throw new AuthError('Your account has been deactivated. Please contact support.');
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new AuthError('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'LOGIN' },
  });

  return { token, user: toUserDto(user) };
};

// ─────────────────────────────────────────
// FORGOT PASSWORD SERVICE
// ─────────────────────────────────────────
export const forgotPasswordService = async (data: ForgotPasswordRequestDto): Promise<{ message: string }> => {
  const user = await prisma.user.findUnique({ where: { email: data.email }, include: { role: true } });

  if (!user) {
    return { message: 'If an account exists with this email, an OTP has been sent.' };
  }

  const resetToken = generateOTP();
  const resetTokenExpiry = generateTokenExpiry(1); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'FORGOT_PASSWORD' },
  });

  sendMail({
    to: data.email,
    subject: 'Reset Your JewelNex Password',
    html: resetPasswordEmailTemplate(user.name, resetToken),
  }).catch((error) => {});

  return { message: 'If an account exists with this email, an OTP has been sent.' };
};

// ─────────────────────────────────────────
// RESET PASSWORD SERVICE
// ─────────────────────────────────────────
export const resetPasswordService = async (data: ResetPasswordRequestDto): Promise<{ message: string }> => {
  const user = await prisma.user.findFirst({
    where: {
      email: data.email,
      resetToken: data.otp,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthError('Invalid or expired OTP');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'RESET_PASSWORD' },
  });

  return { message: 'Password reset successfully. You can now log in with your new password.' };
};
