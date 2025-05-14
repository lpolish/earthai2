import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Database schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Database connection with properly encoded URL
// Original connection string had special characters that need to be URL encoded
const dbUrl = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL
  : 'postgresql://postgres:postgres@db.ponknbkextdldqgxjmvm.supabase.co:5432/postgres';

// Properly encode the URL to handle special characters
const encodedUrl = dbUrl.replace(/^(postgresql:\/\/[^:]+:)([^@]+)(@.+)$/, (_, prefix, password, suffix) => {
  return `${prefix}${encodeURIComponent(password)}${suffix}`;
});

const sql = neon(encodedUrl);
export const db = drizzle(sql);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert; 