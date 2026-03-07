import { users, type User, type UpsertUser } from "@shared/models/auth";
import { eq } from "drizzle-orm";

// If a DATABASE_URL isn't provided, use an in-memory fallback so the
// server can run in development without a database.
let authStorageImpl: any = null;

type StoredUser = User & { id: string };
const userMap = new Map<string, StoredUser>();

class InMemoryAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    // Support both ID and email lookups
    let user = userMap.get(id);
    if (user) return user;

    // Try email lookup
    for (const u of userMap.values()) {
      if (u.email === id) return u;
    }
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = (userData as any).id || `user-${Math.random().toString(36).slice(2,8)}`;
    const now = new Date();
    const existing = userMap.get(id) || ({} as StoredUser);
    const merged = {
      id,
      email: (userData as any).email || existing.email || null,
      passwordHash: (userData as any).passwordHash || existing.passwordHash || null,
      firstName: (userData as any).firstName || existing.firstName || null,
      lastName: (userData as any).lastName || null,
      profileImageUrl: (userData as any).profileImageUrl || null,
      isAdmin: (userData as any).isAdmin || false,
      createdAt: existing.createdAt || now,
      updatedAt: now,
    } as any;
    userMap.set(id, merged);
    return merged as User;
  }
}

if (!process.env.DATABASE_URL) {
  authStorageImpl = new InMemoryAuthStorage();
} else {
  try {
    // Use real DB-backed implementation when DATABASE_URL exists
    // Lazy import of db-related code to avoid throwing when no DB is present
    const { db } = await import("../../db");
    const { users: usersTable } = await import("@shared/models/auth");

    // Test connection so we can fall back if the DB is unreachable
    await (db as any).select().from(usersTable).limit(1);

    class AuthStorage {
      async getUser(id: string): Promise<User | undefined> {
        // Support both ID and email lookups
        let user = await (db as any)
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, id))
          .then((rows: any[]) => rows[0]);
        if (user) return user;

        // Try email lookup
        user = await (db as any)
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, id))
          .then((rows: any[]) => rows[0]);
        return user;
      }

      async upsertUser(userData: UpsertUser): Promise<User> {
        const [user] = await (db as any)
          .insert(usersTable)
          .values(userData)
          .onConflictDoUpdate({
            target: usersTable.id,
            set: {
              ...userData,
              updatedAt: new Date(),
            },
          })
          .returning();
        return user;
      }
    }

    authStorageImpl = new AuthStorage();
  } catch (error) {
    console.warn("Auth database unavailable. Falling back to in-memory storage.");
    authStorageImpl = new InMemoryAuthStorage();
  }
}

export const authStorage = authStorageImpl as {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
};
