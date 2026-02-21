import bcryptjs from "bcryptjs";
import { authStorage } from "./storage";

const SALT_ROUNDS = 10;
export const STATIC_DEV_ADMIN_EMAIL = "admin@example.com";
export const STATIC_DEV_ADMIN_PASSWORD = "Admin12345";
export const STATIC_DEV_USER_EMAIL = "nikolaygyoshev3@gmail.com";
export const STATIC_DEV_USER_PASSWORD = "NOIT2025/2026";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
  const normalizedEmail = normalizeEmail(email);

  // Check if user already exists
  const existing = await authStorage.getUser(normalizedEmail).catch(() => null);
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(password);
  const user = await authStorage.upsertUser({
    id: `user-${Math.random().toString(36).slice(2, 8)}`, // Generate a simple ID
    email: normalizedEmail,
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
  const isDev = process.env.NODE_ENV === "development";
  const adminEmailRaw = process.env.ADMIN_EMAIL || (isDev ? STATIC_DEV_ADMIN_EMAIL : undefined);
  const adminPassword = process.env.ADMIN_PASSWORD || (isDev ? STATIC_DEV_ADMIN_PASSWORD : undefined);
  const adminEmail = adminEmailRaw ? normalizeEmail(adminEmailRaw) : undefined;

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

function buildDemoId(email: string) {
  const safe = email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  if (safe.length > 0) {
    return `demo-${safe}`;
  }
  return `demo-${Math.random().toString(36).slice(2, 10)}`;
}

export async function ensureDemoUser() {
  if (process.env.NODE_ENV !== "development") return;

  const demoEmail = normalizeEmail(process.env.DEMO_EMAIL || STATIC_DEV_USER_EMAIL);
  const demoPassword = process.env.DEMO_PASSWORD || STATIC_DEV_USER_PASSWORD;

  if (demoPassword.length < 6) {
    console.warn("DEMO_PASSWORD must be at least 6 characters. Demo user not created.");
    return;
  }

  const existing = await authStorage.getUser(demoEmail).catch(() => null);
  const passwordHash = await hashPassword(demoPassword);

  await authStorage.upsertUser({
    id: (existing as any)?.id || buildDemoId(demoEmail),
    email: demoEmail,
    passwordHash,
    firstName: process.env.DEMO_FIRST_NAME?.trim() || existing?.firstName || "Demo",
    lastName: process.env.DEMO_LAST_NAME?.trim() || existing?.lastName || "User",
    profileImageUrl: existing?.profileImageUrl || null,
    isAdmin: false,
  });
}

export async function ensureStaticDevUsers() {
  if (process.env.NODE_ENV !== "development") return;
  await ensureAdminUser();
  await ensureDemoUser();
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();
  let user = await authStorage.getUser(normalizedEmail).catch(() => null);

  const demoEmail = normalizeEmail(process.env.DEMO_EMAIL || STATIC_DEV_USER_EMAIL);
  const adminEmailForLogin = normalizeEmail(process.env.ADMIN_EMAIL || STATIC_DEV_ADMIN_EMAIL);
  const isStaticDevCredential = process.env.NODE_ENV === "development" && (
    (normalizedEmail === demoEmail && trimmedPassword === (process.env.DEMO_PASSWORD || STATIC_DEV_USER_PASSWORD)) ||
    (normalizedEmail === adminEmailForLogin && trimmedPassword === (process.env.ADMIN_PASSWORD || STATIC_DEV_ADMIN_PASSWORD))
  );

  if (isStaticDevCredential) {
    await ensureStaticDevUsers();
    user = await authStorage.getUser(normalizedEmail).catch(() => null);
  }
  
  if ((!user || !user.passwordHash) && process.env.NODE_ENV === "development" && normalizedEmail === demoEmail) {
    await ensureDemoUser();
    user = await authStorage.getUser(normalizedEmail).catch(() => null);
  }

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  let isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid && process.env.NODE_ENV === "development" && trimmedPassword !== password) {
    isValid = await verifyPassword(trimmedPassword, user.passwordHash);
  }
  if (!isValid && process.env.NODE_ENV === "development" && normalizedEmail === demoEmail) {
    await ensureDemoUser();
    user = await authStorage.getUser(normalizedEmail).catch(() => null);
    if (user?.passwordHash) {
      isValid = await verifyPassword(password, user.passwordHash);
    }
  }

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || STATIC_DEV_ADMIN_EMAIL);
  if (adminEmail && user.email?.toLowerCase() === adminEmail && !user.isAdmin) {
    const updated = await authStorage.upsertUser({
      ...user,
      isAdmin: true,
    } as any);
    return updated;
  }

  return user;
}
