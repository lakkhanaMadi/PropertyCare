
import { sql } from "drizzle-orm";
import { pgTable, integer, uuid, text, boolean, timestamp, time, pgEnum, numeric, check, date, jsonb } from "drizzle-orm/pg-core";


//user
export const users = pgTable('users', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  clerk_user_id: text('clerk_user_id').notNull(),
  email: text('email').unique().notNull(),
  user_name: text('name').notNull(),
  avatar_url: text('avatar_url'),
  phone_number: text('phone_number').notNull(),
  phone_verified: boolean('phone_verified'),
  is_active: boolean('is_active'),
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull(),
});


//user roles
export const rolesEnum = pgEnum('roles', ['homeowner', 'worker', 'admin']);

export const user_roles = pgTable('user_roles', {
  id: uuid('id').references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }).primaryKey(),
  role: rolesEnum('role').notNull()
});

//workers table
export const worker_profiles = pgTable('worker_profiles', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  worker_id: uuid('worker_id').references(() => users.id, { onDelete: "cascade" })
    .notNull().unique(),
  bio: text('bio'),
  exprience_years: integer('experience_years'),
  service_radius: integer('service_radius'),
  location: text('location'),
  hourly_rate: integer('hourly_rate'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

//services table
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()

});

//worker_services table
export const worker_services = pgTable('worker_services', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  worker_id: uuid('worker_id').notNull().references(() => worker_profiles.id, { onDelete: 'cascade' }),
  service_id: uuid('service_id').notNull().references(() => services.id),
  price_min: numeric('price_min', { precision: 10, scale: 2 }).notNull(),
  price_max: numeric('price_max', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
},
  (table) => ({

    //to make sure max_price and min_price is non negative

    pricePositive: check('price_positive', sql`${table.price_min}>=0 AND ${table.price_max} >=0`),
    priceRangeValid: check('price_range_valid', sql`${table.price_max}>= ${table.price_min}`)
  })
);

//bookings table
export const bookingEnum = pgEnum('bookings', ['pending', 'confirmed', 'completed', 'cancelled']);

export const booking = pgTable('booking', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  homeowner_id: uuid('homeowner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  worker_service_id: uuid('worker_service_id').notNull().references(() => worker_services.id, { onDelete: 'cascade' }),
  status: bookingEnum('status').notNull(),
  scheduled_date: date('scheduled_date').notNull(),
  scheduled_time: time('scheduled_time').notNull(),
  address: text('address').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),

});

//reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  booking_id: uuid('booking_id').notNull().references(() => booking.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),

});

//chats table
export const chats = pgTable('chats', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  homeowner_id: uuid('homeowner_id').notNull().references
    (() => users.id, { onDelete: "cascade" }),
  worker_id: uuid('worker_id').notNull().references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),

});

//messages table
export const messageEnum = pgEnum('messageType', ['text', 'image', 'location', 'file']);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chat_id: uuid('chat_id').notNull().references(() => chats.id, { onDelete: "cascade" }),
  sender_id: uuid('sender_id').notNull().references(() => users.id, { onDelete: "cascade" }),
  message_type: messageEnum('message_type').notNull(),
  content: jsonb('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),

});