/**
 * 
 * Giới hạn số request theo IP trong một khoảng thời gian nhất định.
 * Dùng Map để lưu trạng thái (serverless-safe với Next.js route handlers).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

// Store riêng cho từng "namespace" (auth, payment, chatbot, v.v.)
const stores = new Map<string, Map<string, RateLimitRecord>>();

function getStore(namespace: string): Map<string, RateLimitRecord> {
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map());
  }
  return stores.get(namespace)!;
}

export interface RateLimitConfig {
  /** Khoảng thời gian reset (ms). Mặc định 60 giây */
  windowMs: number;
  /** Số request tối đa trong window. */
  limit: number;
  /** Tên namespace để tách store (vd: "auth", "chatbot"). */
  namespace?: string;
}

export interface RateLimitResult {
  success: boolean;
  /** Số request còn lại */
  remaining: number;
  /** Thời điểm reset (Unix ms) */
  resetAt: number;
  /** Header Retry-After (giây) */
  retryAfter?: number;
}

/**
 * Kiểm tra rate limit cho một identifier (thường là IP).
 * Trả về { success: false } nếu vượt giới hạn.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { windowMs, limit, namespace = "default" } = config;
  const store = getStore(namespace);
  const now = Date.now();

  const record = store.get(identifier);

  // Nếu chưa có record hoặc đã qua window → reset
  if (!record || now >= record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(identifier, newRecord);
    return { success: true, remaining: limit - 1, resetAt: newRecord.resetAt };
  }

  // Đã vượt giới hạn
  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }

  // Tăng count
  record.count++;
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Lấy IP từ Next.js Request (hỗ trợ proxy headers).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

// ─── Preset Configs ──────────────────────────────────────────

/** Dùng cho /api/auth/login, /api/auth/register */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 phút
  limit: 10,                 // 10 lần / 15 phút
  namespace: "auth",
};

/** Dùng cho /api/chat */
export const CHATBOT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 phút
  limit: 20,           // 20 message / phút
  namespace: "chatbot",
};

/** Dùng cho /api/orders, /api/checkout */
export const PAYMENT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 phút
  limit: 5,            // 5 request / phút
  namespace: "payment",
};

/** Rate limit mặc định chung */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 phút
  limit: 60,           // 60 request / phút
  namespace: "default",
};
