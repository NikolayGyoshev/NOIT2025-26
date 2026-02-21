import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { registerUser, loginUser, ensureAdminUser } from "./passwordAuth";
import { z } from "zod";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  ensureAdminUser().catch((error) => {
    console.warn("Failed to ensure admin user:", error instanceof Error ? error.message : error);
  });

  // Register endpoint
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const isAdmin = adminEmail ? email.toLowerCase() === adminEmail : false;
      const user = await registerUser(email, password, firstName, lastName, isAdmin);

      // Log the user in after registration
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await loginUser(email, password);

      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("[debug] /api/auth/user req.user:", user);

      const userId = user?.id || user?.claims?.sub;
      if (!userId) {
        console.log("[debug] /api/auth/user no userId found in:", user);
        return res.status(401).json({ message: "Unauthorized" });
      }

      let dbUser = await authStorage.getUser(userId).catch(() => null);
      if (!dbUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (adminEmail && dbUser.email?.toLowerCase() === adminEmail && !dbUser.isAdmin) {
        dbUser = await authStorage.upsertUser({
          ...dbUser,
          isAdmin: true,
        } as any);
      }

      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
