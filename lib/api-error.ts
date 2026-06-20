/**
 * Centralized API Error Handling — Ported from YoloHub's error.middleware.ts
 * Custom Error Classes + helper để return response nhất quán từ mọi route.
 */
import { NextResponse } from "next/server";


export const ErrorCodes = {
  // Auth
  TOKEN_INVALID:            "TOKEN_INVALID",
  TOKEN_EXPIRED:            "TOKEN_EXPIRED",
  INVALID_CREDENTIALS:      "INVALID_CREDENTIALS",
  ACCOUNT_INACTIVE:         "ACCOUNT_INACTIVE",
  ACCOUNT_BANNED:           "ACCOUNT_BANNED",
  USER_NOT_FOUND:           "USER_NOT_FOUND",
  USER_ALREADY_EXISTS:      "USER_ALREADY_EXISTS",
  EMAIL_NOT_VERIFIED:       "EMAIL_NOT_VERIFIED",
  EMAIL_ALREADY_VERIFIED:   "EMAIL_ALREADY_VERIFIED",
  // Resources
  COURSE_NOT_FOUND:         "COURSE_NOT_FOUND",
  CATEGORY_NOT_FOUND:       "CATEGORY_NOT_FOUND",
  LESSON_NOT_FOUND:         "LESSON_NOT_FOUND",
  ORDER_NOT_FOUND:          "ORDER_NOT_FOUND",
  COUPON_NOT_FOUND:         "COUPON_NOT_FOUND",
  // Validation
  INVALID_INPUT_FORMAT:     "INVALID_INPUT_FORMAT",
  REQUIRED_FIELD_MISSING:   "REQUIRED_FIELD_MISSING",
  PASSWORD_TOO_WEAK:        "PASSWORD_TOO_WEAK",
  INVALID_EMAIL_FORMAT:     "INVALID_EMAIL_FORMAT",
  // Business
  DUPLICATE_ENTRY:          "DUPLICATE_ENTRY",
  ALREADY_ENROLLED:         "ALREADY_ENROLLED",
  NOT_ENROLLED:             "NOT_ENROLLED",
  COUPON_EXPIRED:           "COUPON_EXPIRED",
  COUPON_ALREADY_USED:      "COUPON_ALREADY_USED",
  COUPON_LIMIT_REACHED:     "COUPON_LIMIT_REACHED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  UNAUTHORIZED_ACTION:      "UNAUTHORIZED_ACTION",
  // Rate Limit
  RATE_LIMIT_EXCEEDED:      "RATE_LIMIT_EXCEEDED",
  // System
  INTERNAL_SERVER_ERROR:    "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ─── Custom Error Classes ─────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: ErrorCode | string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, errorCode: ErrorCode = ErrorCodes.TOKEN_INVALID) {
    super(message, 401, errorCode);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, errorCode: ErrorCode = ErrorCodes.INSUFFICIENT_PERMISSIONS) {
    super(message, 403, errorCode);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, errorCode: ErrorCode = ErrorCodes.COURSE_NOT_FOUND) {
    super(message, 404, errorCode);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errorCode: ErrorCode = ErrorCodes.INVALID_INPUT_FORMAT) {
    super(message, 400, errorCode);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, errorCode: ErrorCode = ErrorCodes.DUPLICATE_ENTRY) {
    super(message, 409, errorCode);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
    this.name = "RateLimitError";
  }
}

// ─── Response Builder ─────────────────────────────────────────────────────────

interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: unknown;
  retryAfter?: number;
}

/**
 * Xử lý lỗi tập trung — dùng trong mọi catch block.
 * Tự nhận biết AppError vs lỗi bất ngờ, format nhất quán.
 *
 * @example
 * } catch (error) {
 *   return handleApiError(error);
 * }
 */
export function handleApiError(error: unknown): NextResponse {
  // Lỗi có kiểm soát từ custom classes
  if (error instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: error.message,
      errorCode: error.errorCode,
    };

    if (error instanceof RateLimitError && error.retryAfter) {
      body.retryAfter = error.retryAfter;
    }

    return NextResponse.json(body, { status: error.statusCode });
  }

  // MySQL duplicate entry
  if (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ER_DUP_ENTRY"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Dữ liệu đã tồn tại trong hệ thống",
        errorCode: ErrorCodes.DUPLICATE_ENTRY,
      },
      { status: 409 }
    );
  }

  // Lỗi không xác định — ẩn chi tiết ở production
  console.error("[API Error]", error);
  const isDev = process.env.NODE_ENV === "development";
  return NextResponse.json(
    {
      success: false,
      error: isDev && error instanceof Error ? error.message : "Lỗi hệ thống, vui lòng thử lại sau",
      errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
    },
    { status: 500 }
  );
}

/**
 * Helper để trả về rate-limit response với đầy đủ headers.
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  const error = new RateLimitError(
    `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter} giây.`,
    retryAfter
  );
  const res = handleApiError(error);
  res.headers.set("Retry-After", String(retryAfter));
  res.headers.set("X-RateLimit-Remaining", "0");
  return res;
}
