import { pgTable, text, timestamp, uuid, boolean  } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users= pgTable('users', {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  isActive: boolean('is_Active').default(false),

  createdAt: timestamp('created_at', {mode: "date"}).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', {mode: "date"}).notNull().defaultNow(),

});

