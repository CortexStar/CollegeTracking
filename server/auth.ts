import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { pool } from "../db/index.js";
import { db } from "../db/index.js";
import { users, insertUserSchema } from "../shared/schema.js";
import { eq } from "drizzle-orm";

// Type augmentation for Express.User
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email?: string;
      name?: string;
      createdAt: Date;
    }
  }
}

// Helper for password hashing
const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using scrypt with a random salt
 * @param password Plain text password to hash
 * @returns Hashed password with salt in format: [hash].[salt]
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a supplied password with a stored hashed password
 * @param supplied Plain text password to check
 * @param stored Hashed password from database
 * @returns Boolean indicating if passwords match
 */
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

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
    secret: process.env.SESSION_SECRET || "dev_session_secret", // Use proper env var in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  };

  // Configure session and passport middleware
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure the local authentication strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        // User not found or password doesn't match
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
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

  passport.deserializeUser(async (id: string, done) => {
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
  app.post("/api/register", async (req, res) => {
    try {
      // Check if username already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, req.body.username),
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Validate user data
      const userData = insertUserSchema.parse({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Create new user
      const [user] = await db.insert(users).values(userData).returning();

      // Login the new user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Error logging in after registration" });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Login user
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // At this point, authentication has succeeded
    // Return the user object (passport.authenticate middleware adds user to req)
    res.json(req.user);
  });

  // Logout user
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    res.json(req.user);
  });
}