import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Rate limiting middleware to prevent abuse
 * Following security best practices for API protection
 */

// General API rate limiter - Very relaxed for NAS usage
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Very high limit for NAS usage
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter: req.rateLimit?.reset,
    });
  },
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for file uploads (CSV import) - Very relaxed for NAS
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Very high limit for NAS usage
  message: "Too many file uploads, please try again later.",
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Upload limit exceeded",
      message:
        "You have reached the maximum number of file uploads. Please try again in an hour.",
      retryAfter: req.rateLimit?.reset,
    });
  },
});

// Rate limiter for expensive operations (dashboard calculations) - Very relaxed for NAS
export const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Very high limit for NAS usage
  message: "Too many dashboard requests, please try again later.",
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Dashboard rate limit exceeded",
      message:
        "Too many dashboard requests. Please wait a moment before refreshing.",
      retryAfter: req.rateLimit?.reset,
    });
  },
});

// Create transaction rate limiter - Very relaxed for NAS
export const createTransactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // Very high limit for NAS usage
  message: "Too many transactions created, please slow down.",
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Transaction creation rate limit exceeded",
      message: "You are creating transactions too quickly. Please slow down.",
      retryAfter: req.rateLimit?.reset,
    });
  },
});

// Dynamic rate limiter based on user tier (for future implementation)
export const createDynamicLimiter = (
  tier: "free" | "premium" | "enterprise",
) => {
  const limits = {
    free: { windowMs: 15 * 60 * 1000, max: 50 },
    premium: { windowMs: 15 * 60 * 1000, max: 500 },
    enterprise: { windowMs: 15 * 60 * 1000, max: 5000 },
  };

  return rateLimit({
    ...limits[tier],
    keyGenerator: (req: Request) => {
      // Could use user ID from JWT token instead of IP
      return req.ip || "unknown";
    },
  });
};
