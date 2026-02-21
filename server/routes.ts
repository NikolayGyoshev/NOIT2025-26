import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { insertRoomSchema, insertReservationSchema, insertReviewSchema, insertContactMessageSchema } from "@shared/schema";
import { sendReservationConfirmation, sendContactReply } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Health check endpoint for Render
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // === API Routes ===

  const requireAdmin = async (req: any, res: any) => {
    const userId = req.user?.id || req.user?.claims?.sub;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) {
      res.status(401).json({ message: "Admin required" });
      return null;
    }
    return user;
  };

  // Rooms
  app.get(api.rooms.list.path, async (req, res) => {
    try {
      const filters = {
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        capacity: req.query.capacity ? Number(req.query.capacity) : undefined,
      };
      const rooms = await storage.getRooms(filters);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      // Return empty array in development if database is not available
      res.json([]);
    }
  });

  app.get(api.rooms.get.path, async (req, res) => {
    const room = await storage.getRoom(Number(req.params.id));
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.post(api.rooms.create.path, async (req, res) => {
    if (!req.isAuthenticated() || !(req.user as any)?.claims?.is_admin) { 
      const admin = await requireAdmin(req, res);
      if (!admin) return;
    }

    try {
      const input = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(input);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.rooms.update.path, async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const input = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(Number(req.params.id), input);
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.rooms.delete.path, async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    await storage.deleteRoom(Number(req.params.id));
    res.status(204).send();
  });

  // Reservations
  app.get(api.reservations.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const reservations = await storage.getReservations(userId);
    res.json(reservations);
  });

  app.post(api.reservations.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
    console.log("[debug] POST /api/reservations - req.user:", req.user);
    console.log("[debug] POST /api/reservations - userId:", userId);

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }

    try {
      // Debug: log incoming body to server console
      console.log("[debug] POST /api/reservations body:", req.body);

      // Create a schema that accepts strings for dates and coerces them to Date
      const reservationInputSchema = z.object({
        roomId: z.number(),
        startDate: z.string().or(z.date()).transform((val) => new Date(val)),
        endDate: z.string().or(z.date()).transform((val) => new Date(val)),
      });

      const input = reservationInputSchema.parse(req.body);

      console.log("[debug] POST /api/reservations coerced payload:", input);

      // Calculate total price
      const room = await storage.getRoom(input.roomId);
      if (!room) return res.status(404).json({ message: "Room not found" });

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const hasOverlap = await storage.hasOverlappingReservation(input.roomId, start, end);
      if (hasOverlap) {
        return res.status(409).json({ message: "Стаята вече е резервирана за избрания период." });
      }
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * room.price;

      const reservation = await storage.createReservation({
        roomId: input.roomId,
        startDate: start,
        endDate: end,
        userId,
        totalPrice,
        status: "confirmed",
      });
      // Send confirmation email
      try {
        const user = await storage.getUser(userId);
        if (user?.email) {
          await sendReservationConfirmation(
            user.email,
            user.firstName || "Потребител",
            room.title,
            start,
            end,
            totalPrice
          );
        }
      } catch (e) {
        console.error("[email] Failed to send confirmation:", e);
      }
      res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Invalid input" });
      }
    }
  });

  app.patch(api.reservations.cancel.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    // Check ownership or admin
    const reservation = await storage.getReservation(Number(req.params.id));
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    
    const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
    const user = await storage.getUser(userId);
    
    if (reservation.userId !== userId && !user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updated = await storage.updateReservationStatus(Number(req.params.id), "cancelled");
    res.json(updated);
  });

  // Reviews
  app.get(api.reviews.list.path, async (req, res) => {
    const reviews = await storage.getReviews(Number(req.params.id));
    res.json(reviews);
  });

  app.post(api.reviews.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const roomId = Number(req.params.id);

    try {
      const input = insertReviewSchema.omit({ userId: true, roomId: true }).parse(req.body);
      const review = await storage.createReview({
        ...input,
        userId,
        roomId
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Contact Messages
  app.post(api.contact.create.path, async (req, res) => {
    try {
      const input = insertContactMessageSchema.parse(req.body);
      const created = await storage.createContactMessage(input);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.contact.byEmail.path, async (req, res) => {
    try {
      const parsed = api.contact.byEmail.input.parse({ email: req.query.email });
      const messages = await storage.getContactMessagesByEmail(parsed.email);
      res.json(messages);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(400).json({ message: "Invalid input" });
      }
    }
  });

  app.get(api.contact.list.path, async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  app.post(api.contact.reply.path, async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const input = api.contact.reply.input.parse(req.body);
      const id = Number(req.params.id);
      const updated = await storage.replyToContactMessage(id, input.replyMessage, admin.id);

      try {
        await sendContactReply(updated.email, updated.name, updated.subject, updated.message, input.replyMessage);
      } catch (e) {
        console.error("[email] Failed to send contact reply:", e);
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(400).json({ message: "Invalid input" });
      }
    }
  });

  // Seed Data
  try {
    await seedDatabase();
  } catch (error) {
    console.log("Could not seed database (this is OK during development without a database)");
  }

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingRooms = await storage.getRooms();
  if (existingRooms.length === 0) {
    await storage.createRoom({
      title: "Делукс апартамент",
      description: "Луксозна и елегантна стая с премиум удобства. Кралско легло, балкон и модерен дизайн.",
      price: 25000, // 250 BGN per night
      capacity: 2,
      location: "Етаж 5, Крило A",
      imageUrl: "/room1.jpg",
      features: ["Wifi", "TV", "Балкон", "Преглед на град"],
      isAvailable: true
    });
    await storage.createRoom({
      title: "Стандартна двойна стая",
      description: "Удобна стая за двама. Голямо легло, красив интериор и спокойна атмосфера.",
      price: 12000, // 120 BGN per night
      capacity: 2,
      location: "Етаж 2, Крило B",
      imageUrl: "/room2.jpg",
      features: ["Wifi", "TV", "Преглед на град"],
      isAvailable: true
    });
    await storage.createRoom({
      title: "Семеен апартамент",
      description: "Просторен апартамент-люкс за цялото семейство. Две спални, хол и оборудвана кухня.",
      price: 45000, // 450 BGN per night
      capacity: 4,
      location: "Етаж 10, Крило A",
      imageUrl: "/room3.jpg",
      features: ["Wifi", "TV", "Кухня", "Хол"],
      isAvailable: true
    });
  }
  } catch (error) {
    console.log("Database not available for seeding - this is OK during development");
  }
}
