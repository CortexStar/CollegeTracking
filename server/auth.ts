import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import * as argon2 from "argon2";
import { z } from "zod";
import { pool } from "../db/index.js";
import { db } from "../db/index.js";
import { users, insertUserSchema } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { env } from "../shared/env.js";
import { authLogger } from "../shared/logger.js";

// Type augmentation for Express.User
declare global {
  namespace Express {
    interface User {
      id: number;  // Changed to number to match our schema
      username: string;
      email: string | null;
      name: string | null;
      createdAt: Date;
    }
  }
}

/**
 * Hashes a password using Argon2id
 * 
 * Argon2 is the winner of the Password Hashing Competition and is recommended
 * for password hashing by OWASP, NIST, and cryptographic experts.
 * 
 * Argon2id variant provides balanced protection against both side-channel
 * and GPU attacks.
 * 
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Using Argon2id with recommended parameters
    return await argon2.hash(password, {
      type: argon2.argon2id,  // Use Argon2id variant (balanced security)
      memoryCost: 19456,      // 19 MiB (recommended minimum)
      timeCost: 2,            // 2 iterations
      parallelism: 1,         // 1 thread
      // Argon2 generates salt automatically if not provided
      hashLength: 32,         // 32 bytes hash
    });
  } catch (error) {
    authLogger.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verifies a plain text password against a stored Argon2 hash
 * 
 * @param supplied Plain text password to check
 * @param stored Hashed password from database
 * @returns Boolean indicating if passwords match
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    return await argon2.verify(stored, supplied);
  } catch (error) {
    authLogger.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Custom error handler for authentication errors
 */
const authErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'ValidationError' || err instanceof z.ZodError) {
    return res.status(400).json({ 
      error: "Validation error", 
      details: err.errors || err.message 
    });
  }
  
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({ error: err.message });
  }
  
  console.error("Authentication error:", err);
  next(err);
};

/**
 * Sets up authentication for the Express application
 * @param app Express application instance
 */
export function setupAuth(app: Express) {
  // Create a PostgreSQL session store
  const PgSessionStore = connectPgSimple(session);
  
  const sessionSettings: session.SessionOptions = {
    store: new PgSessionStore({
      pool,
      tableName: "session", // Name of the session table
      createTableIfMissing: true, // Auto-create session table if it doesn't exist
    }),
    secret: env.SESSION_SECRET || "dev_session_secret_at_least_32_chars_long", // Fallback for development
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: env.COOKIE_MAX_AGE,
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  };

  // Configure session and passport middleware
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure the local authentication strategy
  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
    }, async (username, password, done) => {
      try {
        // Find user by username
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        // User not found or password doesn't match
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
          // Use same error message to prevent username enumeration
          return done(null, false, { message: "Incorrect username or password" });
        }

        // Omit password from the user object
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Configure serialization and deserialization of users
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) {
        return done(null, false);
      }

      // Omit password from the user object
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // API Routes for authentication
  
  // Register a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate user data first
      const validatedData = insertUserSchema.omit({ password: true }).parse(req.body);
      
      // Check if username already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, validatedData.username),
      });

      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Validate password separately with custom rules
      const passwordSchema = z.string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password exceeds maximum length");
        
      const validPassword = passwordSchema.parse(req.body.password);
      
      // Hash password and create user
      const hashedPassword = await hashPassword(validPassword);
      
      // Create new user
      const [user] = await db.insert(users).values({
        ...validatedData,
        password: hashedPassword,
      }).returning();

      // Login the new user
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      next(error);
    }
  });

  // Login user with better error handling
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (
      err: Error | null, 
      user: Express.User | false | null, 
      info: { message: string } | undefined
    ) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ 
          error: "Authentication failed", 
          message: info?.message || "Invalid credentials" 
        });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout user
  app.post("/api/logout", (req, res, next) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(200).json({ message: "No active session" });
    }
    
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      
      // Regenerate session to prevent session fixation
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
          return next(regenerateErr);
        }
        
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    res.json(req.user);
  });
  
  // Set up error handling for authentication routes
  app.use('/api/register', authErrorHandler);
  app.use('/api/login', authErrorHandler);
  app.use('/api/logout', authErrorHandler);
}