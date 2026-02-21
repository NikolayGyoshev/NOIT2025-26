import { z } from 'zod';
import { insertRoomSchema, insertReservationSchema, insertReviewSchema, insertContactMessageSchema, rooms, reservations, reviews, contactMessages } from './schema';
import type { InsertRoom, InsertReservation, InsertReview, InsertContactMessage } from './schema';

export type { InsertRoom, InsertReservation, InsertReview, InsertContactMessage };
export { insertRoomSchema, insertReservationSchema, insertReviewSchema, insertContactMessageSchema };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  rooms: {
    list: {
      method: 'GET' as const,
      path: '/api/rooms',
      input: z.object({
        minPrice: z.coerce.number().optional(),
        maxPrice: z.coerce.number().optional(),
        capacity: z.coerce.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof rooms.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rooms/:id',
      responses: {
        200: z.custom<typeof rooms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rooms',
      input: insertRoomSchema,
      responses: {
        201: z.custom<typeof rooms.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.notFound, // Unauthorized reused for now or add explicit 401
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/rooms/:id',
      input: insertRoomSchema.partial(),
      responses: {
        200: z.custom<typeof rooms.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/rooms/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  reservations: {
    list: {
      method: 'GET' as const,
      path: '/api/reservations',
      responses: {
        200: z.array(z.custom<typeof reservations.$inferSelect & { room: typeof rooms.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reservations',
      input: z.object({
        roomId: z.number(),
        startDate: z.string().or(z.date()),
        endDate: z.string().or(z.date()),
      }),
      responses: {
        201: z.custom<typeof reservations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    cancel: {
      method: 'PATCH' as const,
      path: '/api/reservations/:id/cancel',
      responses: {
        200: z.custom<typeof reservations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  reviews: {
    list: {
      method: 'GET' as const,
      path: '/api/rooms/:id/reviews',
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect & { user: { username: string } }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rooms/:id/reviews',
      input: insertReviewSchema.omit({ userId: true, roomId: true }),
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  contact: {
    create: {
      method: 'POST' as const,
      path: '/api/contact',
      input: insertContactMessageSchema,
      responses: {
        201: z.custom<typeof contactMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/admin/contact-messages',
      responses: {
        200: z.array(z.custom<typeof contactMessages.$inferSelect>()),
        401: errorSchemas.notFound,
      },
    },
    byEmail: {
      method: 'GET' as const,
      path: '/api/contact',
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.array(z.custom<typeof contactMessages.$inferSelect>()),
        400: errorSchemas.validation,
      },
    },
    reply: {
      method: 'POST' as const,
      path: '/api/admin/contact-messages/:id/reply',
      input: z.object({ replyMessage: z.string().min(3) }),
      responses: {
        200: z.custom<typeof contactMessages.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
