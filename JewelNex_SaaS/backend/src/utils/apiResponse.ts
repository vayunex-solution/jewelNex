// ─────────────────────────────────────────
// Standard API Response Utilities
// All API responses go through these helpers
// for consistent structure across all endpoints
// ─────────────────────────────────────────

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const successResponse = <T>(
  message: string,
  data?: T
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string, error?: string): ApiResponse => ({
  success: false,
  message,
  error: process.env.NODE_ENV === 'development' ? error : undefined,
});
