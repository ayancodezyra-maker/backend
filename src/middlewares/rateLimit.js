/* CURSOR PATCH START */
import rateLimit from "express-rate-limit";
import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

// 1. Blocked IP checker
export async function checkBlockedIp(req, res, next) {
  try {
    const ip = getIp(req);

    const { data } = await supabase
      .from("blocked_ips")
      .select("*")
      .eq("ip", ip)
      .single();

    if (data?.blocked_until && new Date(data.blocked_until) > new Date()) {
      return res
        .status(429)
        .json(formatResponse(false, "Your IP is temporarily blocked.", null));
    }

    return next();
  } catch {
    return next();
  }
}

// 2. DDoS burst detector (>20/sec)
const ddosMap = new Map();
setInterval(() => ddosMap.clear(), 1000);

export async function ddosDetector(req, res, next) {
  const ip = getIp(req);

  const count = (ddosMap.get(ip) || 0) + 1;
  ddosMap.set(ip, count);

  if (count > 20) {
    await supabase.from("blocked_ips").upsert({
      ip,
      reason: "ddos_detected",
      blocked_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return res
      .status(429)
      .json(
        formatResponse(
          false,
          "Your IP is temporarily blocked due to suspicious activity.",
          null
        )
      );
  }

  next();
}

// 3. Global rate limit
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) =>
    res
      .status(429)
      .json(formatResponse(false, "Too many requests. Slow down.", null)),
});

// 4. Login limiter
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (req, res) =>
    res
      .status(429)
      .json(
        formatResponse(false, "Too many login attempts. Try again later.", null)
      ),
});

// 5. Reset password limiter
export const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  handler: (req, res) =>
    res
      .status(429)
      .json(
        formatResponse(false, "Too many reset attempts. Try again later.", null)
      ),
});

// 6. Create custom rate limiter factory
export function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    handler: (req, res) =>
      res
        .status(429)
        .json(formatResponse(false, "Too many requests. Slow down.", null)),
    ...options,
  };
  
  return rateLimit(defaultOptions);
}
/* CURSOR PATCH END */
