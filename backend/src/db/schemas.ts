import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  integer,
  uuid,
  text,
  boolean,
  timestamp,
  time,
  pgEnum,
  numeric,
  check,
  date,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

/* =======================
   USERS
======================= */

export const rolesEnum = pgEnum("roles", ["homeowner", "worker", "admin"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  user_name: text("name").notNull(),
  role: rolesEnum("role").notNull().default("homeowner"),
  avatar_url: text("avatar_url"),
  phone_number: text("phone_number"),
  email_verified: boolean("email_verified").default(false),
  is_active: boolean("is_active").default(false),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* =======================
   WORKER PROFILES (1–1 with users)
======================= */

export const worker_profiles = pgTable("worker_profiles", {
  id: text("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  bio: text("bio"),
  experience_years: integer("experience_years"),
  service_radius: integer("service_radius"),
  location: text("location"),
  hourly_rate: integer("hourly_rate"),

  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* =======================
   SERVICES
======================= */

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* =======================
   WORKER ↔ SERVICES (M–M)
======================= */

export const worker_services = pgTable(
  "worker_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    worker_id: text("worker_id")
      .notNull()
      .references(() => worker_profiles.id, { onDelete: "cascade" }),

    service_id: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),

    price_min: numeric("price_min", { precision: 10, scale: 2 }).notNull(),
    price_max: numeric("price_max", { precision: 10, scale: 2 }).notNull(),

    created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    workerServiceUnique: unique().on(
      table.worker_id,
      table.service_id
    ),
    pricePositive: check(
      "price_positive",
      sql`${table.price_min} >= 0 AND ${table.price_max} >= 0`
    ),
    priceRangeValid: check(
      "price_range_valid",
      sql`${table.price_max} >= ${table.price_min}`
    ),
  })
);

/* =======================
   BOOKINGS
======================= */

export const bookingEnum = pgEnum("bookings", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const booking = pgTable("booking", {
  id: uuid("id").primaryKey().defaultRandom(),

  homeowner_id: text("homeowner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  worker_service_id: uuid("worker_service_id")
    .notNull()
    .references(() => worker_services.id, { onDelete: "restrict" }),

  status: bookingEnum("status").notNull().default("pending"),
  scheduled_date: date("scheduled_date").notNull(),
  scheduled_time: time("scheduled_time").notNull(),
  address: text("address").notNull(),
  agreed_price: numeric("agreed_price", { precision: 10, scale: 2 }),
  is_price_confirmed: boolean("is_price_confirmed").default(false),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* =======================
   REVIEWS
======================= */

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),

  booking_id: uuid("booking_id")
    .notNull()
    .references(() => booking.id, { onDelete: "cascade" }),

  homeowner_id: text("homeowner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/* =======================
   CHATS
======================= */

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),

  homeowner_id: text("homeowner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  worker_id: text("worker_id")
    .notNull()
    .references(() => worker_profiles.id, { onDelete: "cascade" }),

  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* =======================
   MESSAGES
======================= */

export const messageEnum = pgEnum("messageType", [
  "text",
  "image",
  "location",
  "file",
]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),

  chat_id: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),

  sender_id: text("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  message_type: messageEnum("message_type").notNull(),
  content: jsonb("content").notNull(),

  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* =======================
   RELATIONS
======================= */

export const userRelations = relations(users, ({ many, one }) => ({
  workerProfile: one(worker_profiles),
  bookings: many(booking),
  reviews: many(reviews),
  chats: many(chats),
  messages: many(messages),
}));

export const workerProfileRelations = relations(
  worker_profiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [worker_profiles.id],
      references: [users.id],
    }),
    workerServices: many(worker_services),
    chats: many(chats),
  })
);

export const workerServicesRelations = relations(
  worker_services,
  ({ one }) => ({
    worker: one(worker_profiles, {
      fields: [worker_services.worker_id],
      references: [worker_profiles.id],
    }),
    service: one(services, {
      fields: [worker_services.service_id],
      references: [services.id],
    }),
  })
);

export const serviceRelations = relations(services, ({ many }) => ({
  workerServices: many(worker_services),
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  homeowner: one(users, {
    fields: [booking.homeowner_id],
    references: [users.id],
  }),
  workerService: one(worker_services, {
    fields: [booking.worker_service_id],
    references: [worker_services.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  homeowner: one(users, {
    fields: [reviews.homeowner_id],
    references: [users.id],
  }),
  booking: one(booking, {
    fields: [reviews.booking_id],
    references: [booking.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  homeowner: one(users, {
    fields: [chats.homeowner_id],
    references: [users.id],
  }),
  worker: one(worker_profiles, {
    fields: [chats.worker_id],
    references: [worker_profiles.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.sender_id],
    references: [users.id],
  }),
  chat: one(chats, {
    fields: [messages.chat_id],
    references: [chats.id],
  }),
}));

/* =======================
   TYPE INFERENCE
======================= */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type WorkerProfile = typeof worker_profiles.$inferSelect;
export type NewWorkerProfile = typeof worker_profiles.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type WorkerService = typeof worker_services.$inferSelect;
export type NewWorkerService = typeof worker_services.$inferInsert;

export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
