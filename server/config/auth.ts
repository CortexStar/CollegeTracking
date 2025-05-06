/**
 * Authentication configuration for server-side
 * 
 * Contains feature flags and environment-specific settings
 */

/**
 * Feature flag for enabling/disabling the authentication system.
 * Set to "N" to disable auth entirely (guest mode).
 * Set to "Y" to enforce authentication.
 */
export const AUTH_ENABLED = (process.env.AUTH ?? "Y").toUpperCase() === "Y";

/**
 * Google OAuth credentials
 */
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

/**
 * Middleware for protected routes - conditionally applied based on AUTH_ENABLED
 */
export function requireAuth(req: any, res: any, next: any) {
  if (!AUTH_ENABLED) {
    // If auth is disabled, allow all requests without authentication
    return next();
  }
  
  // Otherwise, check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  next();
}