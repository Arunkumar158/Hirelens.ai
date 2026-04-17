import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const resetTokenStore = new Map<string, { userId: number; expiresAt: number }>();
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  role: z.enum(["jobseeker", "recruiter", "admin"]).default("jobseeker"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function sendPasswordResetEmail(email: string, resetLink: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@hirelens.ai";

  if (!host || !user || !pass) {
    console.log(`[password-reset] SMTP not configured; reset link for ${email}: ${resetLink}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: "HireLens Password Reset",
    text: `Reset your password using this link: ${resetLink}`,
    html: `<p>Reset your HireLens password using this link:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
  });
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "hirelens-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const payload = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(payload.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmailUser = await storage.getUserByEmail(payload.email);
      if (existingEmailUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(payload.password);
      const user = await storage.createUser({
        ...payload,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid registration data" });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: { message?: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (user) {
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = hashResetToken(rawToken);
        const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
        resetTokenStore.set(tokenHash, { userId: user.id, expiresAt });

        const appUrl = process.env.APP_URL || req.headers.origin || "http://localhost:5000";
        const resetLink = `${appUrl}/reset-password?token=${rawToken}`;
        await sendPasswordResetEmail(email, resetLink);
      }

      res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid request" });
      }
      res.status(500).json({ message: "Failed to process forgot password request" });
    }
  });

  app.get("/api/reset-password/validate", (req, res) => {
    const token = req.query.token;
    if (typeof token !== "string" || !token) {
      return res.status(400).json({ valid: false, message: "Token is required" });
    }

    const tokenHash = hashResetToken(token);
    const tokenEntry = resetTokenStore.get(tokenHash);
    if (!tokenEntry || tokenEntry.expiresAt < Date.now()) {
      if (tokenEntry && tokenEntry.expiresAt < Date.now()) {
        resetTokenStore.delete(tokenHash);
      }
      return res.status(400).json({ valid: false, message: "Token is invalid or expired" });
    }

    res.status(200).json({ valid: true });
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const tokenHash = hashResetToken(token);
      const tokenEntry = resetTokenStore.get(tokenHash);

      if (!tokenEntry || tokenEntry.expiresAt < Date.now()) {
        if (tokenEntry && tokenEntry.expiresAt < Date.now()) {
          resetTokenStore.delete(tokenHash);
        }
        return res.status(400).json({ message: "Token is invalid or expired" });
      }

      const user = await storage.getUser(tokenEntry.userId);
      if (!user) {
        resetTokenStore.delete(tokenHash);
        return res.status(404).json({ message: "User not found for this token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      resetTokenStore.delete(tokenHash);
      resetTokenStore.forEach((entry, storedHash) => {
        if (entry.userId === user.id) {
          resetTokenStore.delete(storedHash);
        }
      });

      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid request" });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}
