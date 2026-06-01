import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../src/services/auth.service';
import prisma from '../src/config/database';

vi.mock('../src/config/database', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    role: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../src/utils/mailer', () => ({
  sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signupService', () => {
    it('should throw error if user already exists', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: '1' });

      await expect(authService.signupService({
        name: 'Test',
        email: 'exists@test.com',
        password: 'password'
      })).rejects.toThrow('An account with this email already exists');
    });

    it('should create user and send email on valid signup', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.role.findFirst as any).mockResolvedValue({ id: 'role-1' });
      (prisma.user.create as any).mockResolvedValue({ id: 'user-1', name: 'Test', email: 'test@test.com' });

      const result = await authService.signupService({
        name: 'Test',
        email: 'test@test.com',
        password: 'Password123!'
      });

      expect(result.message).toContain('Account created');
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
