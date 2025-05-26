import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // Made optional for OAuth users
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table for NextAuth
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Conversations table to group related messages
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat messages table with optimized structure
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  locationContext: jsonb('location_context').$type<{
    center: { lat: number; lng: number };
    zoom: number;
    bounds?: { north: number; south: number; east: number; west: number };
  }>(),
  metadata: jsonb('metadata').$type<{
    tokens?: number;
    processingTime?: number;
    model?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert; 