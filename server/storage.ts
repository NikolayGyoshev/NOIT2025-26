import { users, rooms, reservations, reviews, contactMessages, type User, type UpsertUser, type Room, type InsertRoom, type Reservation, type InsertReservation, type Review, type InsertReview, type ContactMessage, type InsertContactMessage } from "@shared/schema";
import { eq, and, gte, lte, desc, lt, gt, ne } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // Kept for compat if needed, though auth uses email
  createUser(user: UpsertUser): Promise<User>;

  // Rooms
  getRooms(filters?: { minPrice?: number; maxPrice?: number; capacity?: number }): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;

  // Reservations
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservations(userId?: string): Promise<(Reservation & { room: Room })[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  updateReservationStatus(id: number, status: string): Promise<Reservation>;
  hasOverlappingReservation(roomId: number, startDate: Date, endDate: Date): Promise<boolean>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviews(roomId: number): Promise<(Review & { user: { username: string } })[]>;

  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessagesByEmail(email: string): Promise<ContactMessage[]>;
  replyToContactMessage(id: number, replyMessage: string, repliedBy: string): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // Auth delegates
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Auth uses email/oauth, but for completeness:
    // This might fail if username column doesn't exist in auth schema (it uses email).
    // Let's check shared/models/auth.ts again. It has 'email', not 'username'.
    // However, shared/schema.ts might have re-exported 'users' with 'username' if I wasn't careful.
    // I imported users from ./models/auth.
    // Shared/models/auth.ts has `email`, `firstName`, `lastName`. No `username`.
    // So `getUserByUsername` is not really applicable unless we map it to email or remove it.
    // I will remove it from IStorage if possible, but the blueprint might rely on it?
    // The blueprint provided `DatabaseStorage` with `getUserByUsername`.
    // I'll implement it searching by email for now to be safe, or just return undefined.
    return undefined; 
  }
  async createUser(user: UpsertUser): Promise<User> {
    return authStorage.upsertUser(user as any); // Type mismatch potential, but upsertUser handles it.
  }

  // Rooms
  async getRooms(filters?: { minPrice?: number; maxPrice?: number; capacity?: number }): Promise<Room[]> {
    let query = db.select().from(rooms);
    const conditions = [];
    if (filters?.minPrice) conditions.push(gte(rooms.price, filters.minPrice));
    if (filters?.maxPrice) conditions.push(lte(rooms.price, filters.maxPrice));
    if (filters?.capacity) conditions.push(gte(rooms.capacity, filters.capacity));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    return await query;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async updateRoom(id: number, updates: Partial<InsertRoom>): Promise<Room> {
    const [updated] = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
    return updated;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  // Reservations
  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const [newReservation] = await db.insert(reservations).values(reservation).returning();
    return newReservation;
  }

  async getReservations(userId?: string): Promise<(Reservation & { room: Room })[]> {
    const query = db.select({
      reservation: reservations,
      room: rooms,
    })
    .from(reservations)
    .innerJoin(rooms, eq(reservations.roomId, rooms.id));

    if (userId) {
      query.where(eq(reservations.userId, userId));
    }
    
    const rows = await query.orderBy(desc(reservations.startDate));
    return rows.map(r => ({ ...r.reservation, room: r.room }));
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [res] = await db.select().from(reservations).where(eq(reservations.id, id));
    return res;
  }

  async updateReservationStatus(id: number, status: string): Promise<Reservation> {
    const [updated] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
    return updated;
  }

  async hasOverlappingReservation(roomId: number, startDate: Date, endDate: Date): Promise<boolean> {
    const overlap = await db
      .select({ id: reservations.id })
      .from(reservations)
      .where(
        and(
          eq(reservations.roomId, roomId),
          ne(reservations.status, "cancelled"),
          lt(reservations.startDate, endDate),
          gt(reservations.endDate, startDate)
        )
      )
      .limit(1);
    return overlap.length > 0;
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getReviews(roomId: number): Promise<(Review & { user: { username: string } })[]> {
    const rows = await db.select({
      review: reviews,
      user: users,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.roomId, roomId))
    .orderBy(desc(reviews.createdAt));

    return rows.map(r => ({
      ...r.review,
      user: { username: r.user.firstName || r.user.email || "Anonymous" } // Map to display name
    }));
  }

  // Contact Messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [created] = await db.insert(contactMessages).values(message).returning();
    return created;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async getContactMessagesByEmail(email: string): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.email, email))
      .orderBy(desc(contactMessages.createdAt));
  }

  async replyToContactMessage(id: number, replyMessage: string, repliedBy: string): Promise<ContactMessage> {
    const [updated] = await db
      .update(contactMessages)
      .set({ replyMessage, repliedAt: new Date(), repliedBy })
      .where(eq(contactMessages.id, id))
      .returning();
    if (!updated) throw new Error("Not found");
    return updated;
  }
}

type RoomInternal = InsertRoom & { id: number };
type ReservationInternal = InsertReservation & { id: number; userId: string; startDate: Date; endDate: Date };
type ReviewInternal = InsertReview & { id: number };
type ContactMessageInternal = InsertContactMessage & { id: number; createdAt: Date; repliedAt?: Date; replyMessage?: string; repliedBy?: string };

class InMemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private rooms: RoomInternal[] = [];
  private reservations: ReservationInternal[] = [];
  private reviews: ReviewInternal[] = [];
  private contactMessages: ContactMessageInternal[] = [];
  private roomId = 1;
  private reservationId = 1;
  private reviewId = 1;
  private contactMessageId = 1;

  // Auth delegates
  async getUser(id: string): Promise<User | undefined> {
    const u = this.users.get(id);
    if (u) return u;
    // fallback to authStorage (which itself may be in-memory)
    return authStorage.getUser(id);
  }
  async getUserByUsername(_username: string): Promise<User | undefined> { return undefined; }
  async createUser(user: UpsertUser): Promise<User> {
    const id = (user as any).id || `dev-${Math.random().toString(36).slice(2,8)}`;
    const now = new Date();
    const created: any = { id, ...user, createdAt: now, updatedAt: now, isAdmin: (user as any).isAdmin || false };
    this.users.set(id, created);
    return created as User;
  }

  // Rooms
  async getRooms(filters?: { minPrice?: number; maxPrice?: number; capacity?: number }): Promise<Room[]> {
    let results = this.rooms.slice();
    if (filters?.minPrice) results = results.filter(r => r.price >= filters.minPrice!);
    if (filters?.maxPrice) results = results.filter(r => r.price <= filters.maxPrice!);
    if (filters?.capacity) results = results.filter(r => r.capacity >= filters.capacity!);
    return results as Room[];
  }
  async getRoom(id: number): Promise<Room | undefined> { return this.rooms.find(r => r.id === id) as Room | undefined; }
  async createRoom(room: InsertRoom): Promise<Room> {
    const newRoom = { ...room, id: this.roomId++ } as RoomInternal;
    this.rooms.push(newRoom);
    return newRoom as Room;
  }
  async updateRoom(id: number, updates: Partial<InsertRoom>): Promise<Room> {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx === -1) throw new Error("Not found");
    this.rooms[idx] = { ...this.rooms[idx], ...updates };
    return this.rooms[idx] as Room;
  }
  async deleteRoom(id: number): Promise<void> { this.rooms = this.rooms.filter(r => r.id !== id); }

  // Reservations
  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const newRes: any = { ...reservation, id: this.reservationId++, createdAt: new Date() };
    this.reservations.push(newRes);
    return newRes as Reservation;
  }
  async getReservations(userId?: string): Promise<(Reservation & { room: Room })[]> {
    const rows = this.reservations
      .filter(r => !userId || r.userId === userId)
      .map(r => ({ ...r, room: this.rooms.find(room => room.id === r.roomId)! }));
    return rows as any;
  }
  async getReservation(id: number): Promise<Reservation | undefined> { return this.reservations.find(r => r.id === id) as Reservation | undefined; }
  async updateReservationStatus(id: number, status: string): Promise<Reservation> {
    const res = this.reservations.find(r => r.id === id);
    if (!res) throw new Error("Not found");
    res.status = status;
    return res as Reservation;
  }

  async hasOverlappingReservation(roomId: number, startDate: Date, endDate: Date): Promise<boolean> {
    return this.reservations.some(r =>
      r.roomId === roomId &&
      r.status !== "cancelled" &&
      r.startDate < endDate &&
      r.endDate > startDate
    );
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    const newRev: any = { ...review, id: this.reviewId++, createdAt: new Date() };
    this.reviews.push(newRev);
    return newRev as Review;
  }
  async getReviews(roomId: number): Promise<(Review & { user: { username: string } })[]> {
    const rows = this.reviews
      .filter(r => r.roomId === roomId)
      .map(r => ({ ...r, user: { username: "Dev User" } }));
    return rows as any;
  }

  // Contact Messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const created: ContactMessageInternal = {
      ...message,
      id: this.contactMessageId++,
      createdAt: new Date(),
    };
    this.contactMessages.unshift(created);
    return created as ContactMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return this.contactMessages as ContactMessage[];
  }

  async getContactMessagesByEmail(email: string): Promise<ContactMessage[]> {
    return this.contactMessages.filter(m => m.email === email) as ContactMessage[];
  }

  async replyToContactMessage(id: number, replyMessage: string, repliedBy: string): Promise<ContactMessage> {
    const msg = this.contactMessages.find(m => m.id === id);
    if (!msg) throw new Error("Not found");
    msg.replyMessage = replyMessage;
    msg.repliedAt = new Date();
    msg.repliedBy = repliedBy;
    return msg as ContactMessage;
  }
}

// Use DB-backed storage when available, otherwise fall back to in-memory storage
let storageImpl: IStorage;

if (process.env.DATABASE_URL) {
  try {
    // Lazy import to avoid importing ./db at module load time when no DB exists
    const { db } = await import("./db");
    // Test connection early so we can fall back if the DB is unreachable
    await db.select().from(rooms).limit(1);
    (global as any).db = db; // keep for debugging
    storageImpl = new DatabaseStorage();
  } catch (error) {
    console.warn("Database unavailable. Falling back to in-memory storage.");
    storageImpl = new InMemoryStorage();
  }
} else {
  storageImpl = new InMemoryStorage();
}

export const storage = storageImpl;
