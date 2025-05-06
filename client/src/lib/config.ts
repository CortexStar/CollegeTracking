/**
 * Configuration module for client-side settings
 * 
 * Contains feature flags and environment-specific settings
 */

/**
 * Feature flag for enabling/disabling the authentication system.
 * Set to "N" to disable auth entirely (guest mode).
 * Set to "Y" to enforce authentication.
 */
export const AUTH_ENABLED = (import.meta.env.VITE_AUTH ?? "Y").toUpperCase() === "Y";

/**
 * Google OAuth client ID for client-side authentication
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Add other client-side configuration as needed