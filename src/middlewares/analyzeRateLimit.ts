import rateLimit from "express-rate-limit";
import { Request } from "express";

/**
 * Rate limit for the /api/analyze endpoint.
 * 10 requests per minute per organization.
 * Uses in-memory store (resets on server restart).
 */
export const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },

  // Key by org_id so the limit is per organization, not per IP
  keyGenerator: (req: Request) => {
    const orgId =
      (req as any)?.org_id ||
      (req as any)?.auth?.orgId;
    return String(orgId || "unknown");
  },

  message: {
    error: "RATE_LIMITED",
    message:
      "Too many analysis requests. Please wait a moment before trying again.",
  },
});
