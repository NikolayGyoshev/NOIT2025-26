import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

export * from "./models/auth";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cents
  capacity: integer("capacity").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url").notNull(),
  features: text("features").array(),
  isAvailable: boolean("is_available").default(true),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // users.id is varchar
  roomId: integer("room_id").notNull().references(() => rooms.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  repliedAt: timestamp("replied_at"),
  replyMessage: text("reply_message"),
  repliedBy: text("replied_by"),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  reservations: many(reservations),
  reviews: many(reviews),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  room: one(rooms, {
    fields: [reservations.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  room: one(rooms, {
    fields: [reviews.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  repliedAt: true,
  replyMessage: true,
  repliedBy: true,
});

// Types
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
