import bcryptjs from "bcryptjs";
import { authStorage } from "./storage";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  isAdmin: boolean = false
) {
  // Check if user already exists
  const existing = await authStorage.getUser(email).catch(() => null);
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(password);
  const user = await authStorage.upsertUser({
    id: `user-${Math.random().toString(36).slice(2, 8)}`, // Generate a simple ID
    email,
    passwordHash,
    firstName,
    lastName,
    profileImageUrl: null,
    isAdmin,
  });

  return user;
}

function buildAdminId(email: string) {
  const safe = email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  if (safe.length > 0) {
    return `admin-${safe}`;
  }
  return `admin-${Math.random().toString(36).slice(2, 10)}`;
}

export async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) return;

  if (adminPassword.length < 6) {
    console.warn("ADMIN_PASSWORD must be at least 6 characters. Admin user not created.");
    return;
  }

  const existing = await authStorage.getUser(adminEmail).catch(() => null);
  const passwordHash = await hashPassword(adminPassword);

  await authStorage.upsertUser({
    id: (existing as any)?.id || buildAdminId(adminEmail),
    email: adminEmail,
    passwordHash,
    firstName: process.env.ADMIN_FIRST_NAME?.trim() || existing?.firstName || "Admin",
    lastName: process.env.ADMIN_LAST_NAME?.trim() || existing?.lastName || "User",
    profileImageUrl: existing?.profileImageUrl || null,
    isAdmin: true,
  });
}

export async function loginUser(email: string, password: string) {
  const user = await authStorage.getUser(email).catch(() => null);
  
  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && user.email?.toLowerCase() === adminEmail && !user.isAdmin) {
    const updated = await authStorage.upsertUser({
      ...user,
      isAdmin: true,
    } as any);
    return updated;
  }

  return user;
}
