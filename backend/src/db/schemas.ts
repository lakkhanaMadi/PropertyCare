
import { relations, sql } from "drizzle-orm";
import { pgTable, integer, uuid, text, boolean, timestamp, time, pgEnum, numeric, check, date, jsonb } from "drizzle-orm/pg-core";


//user
export const rolesEnum = pgEnum('roles', ['homeowner', 'worker', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  clerk_user_id: text('clerk_user_id'),
  email: text('email').unique().notNull(),
  user_name: text('name').notNull(),
  role: rolesEnum('role').notNull().default('homeowner'),
  avatar_url: text('avatar_url'),
  phone_number: text('phone_number'),
  phone_verified: boolean('phone_verified').default(false),
  is_active: boolean('is_active').default(false),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date())
});


//workers table
export const worker_profiles = pgTable('worker_profiles', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  worker_id: uuid('worker_id').references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  bio: text('bio'),
  exprience_years: integer('experience_years'),
  service_radius: integer('service_radius'),
  location: text('location'),
  hourly_rate: integer('hourly_rate'),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date())

});

//services table
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date())


});

//worker_services table
export const worker_services = pgTable('worker_services', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  worker_id: uuid('worker_id').notNull().references(() => worker_profiles.id, { onDelete: 'cascade' }),
  service_id: uuid('service_id').notNull().references(() => services.id),
  price_min: numeric('price_min', { precision: 10, scale: 2 }).notNull(),
  price_max: numeric('price_max', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date())

},
  (table) => ({

    //to make sure max_price and min_price is non negative and max price >= min price
    pricePositive: check('price_positive', sql`${table.price_min}>=0 AND ${table.price_max} >=0`),
    priceRangeValid: check('price_range_valid', sql`${table.price_max}>= ${table.price_min}`)
  })
);

//bookings table
export const bookingEnum = pgEnum('bookings', ['pending', 'confirmed', 'completed', 'cancelled']);

export const booking = pgTable('booking', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  homeowner_id: uuid('homeowner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  worker_service_id: uuid('worker_service_id').notNull().references(() => worker_services.id, { onDelete: 'restrict' }),
  status: bookingEnum('status').notNull(),
  scheduled_date: date('scheduled_date').notNull(),
  scheduled_time: time('scheduled_time').notNull(),
  address: text('address').notNull(),
  agreed_price: numeric('agreed_price', { precision: 10, scale: 2 }),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date())


});

//reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  booking_id: uuid('booking_id').notNull().references(() => booking.id, { onDelete: 'cascade' }),
  homeowner_id: uuid('homeowner_id').notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text('content').notNull(),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),



});

//chats table
export const chats = pgTable('chats', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  homeowner_id: uuid('homeowner_id').notNull().references(() => users.id, { onDelete: "cascade" }),
  worker_id: uuid('worker_id').notNull().references(() => worker_profiles.id, { onDelete: "cascade" }),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date())


});

//messages table
export const messageEnum = pgEnum('messageType', ['text', 'image', 'location', 'file']);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chat_id: uuid('chat_id').notNull().references(() => chats.id, { onDelete: "cascade" }),
  sender_id: uuid('sender_id').notNull().references(() => users.id, { onDelete: "cascade" }),
  message_type: messageEnum('message_type').notNull(),
  content: jsonb('content').notNull(),
  created_at: timestamp('created_at', { mode: "date" }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date())


});

//relations
export const homeownerRelations = relations(users, ({ many }) => ({
  booking: many(booking),
  reviews: many(reviews),
  chats: many(chats),
  messages: many(messages)
}));

export const workerProfileRelations = relations(worker_profiles, ({ one }) => ({
  user: one(users, { fields: [worker_profiles.worker_id], references: [users.id] }),
}));

export const workerServicesRelations = relations(worker_services, ({ one }) => ({
  worker: one(worker_profiles, { fields: [worker_services.worker_id], references: [worker_profiles.id] }),
  service: one(services, { fields: [worker_services.service_id], references: [services.id] }),
}));

export const workerRelations = relations(worker_profiles, ({ many }) => ({
  workerServices: many(worker_services)
}));

export const serviceRelations = relations(services, ({ many }) => ({
  workerServices: many(worker_services)
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  homeowner: one(users, { fields: [booking.homeowner_id], references: [users.id] }),
  workerService: one(worker_services, { fields: [booking.worker_service_id], references: [worker_services.id] }),
  reviews: many(reviews)
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  homeowner: one(users, { fields: [reviews.homeowner_id], references: [users.id] }),
  booking: one(booking, { fields: [reviews.booking_id], references: [booking.id] })
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  homeowner: one(users, { fields: [chats.homeowner_id], references: [users.id] }),
  worker: one(worker_profiles, { fields: [chats.worker_id], references: [worker_profiles.id] }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, { fields: [messages.sender_id], references: [users.id] }),
  chat: one(chats, { fields: [messages.chat_id], references: [chats.id] })
}));

