import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { supabase } from '@/lib/supabase';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create the database connection using Supabase's connection string with properly encoded URL
const dbUrl = process.env.DATABASE_URL;

// Properly encode the URL to handle special characters
const encodedUrl = dbUrl.replace(/^(postgresql:\/\/[^:]+:)([^@]+)(@.+)$/, (_, prefix, password, suffix) => {
  return `${prefix}${encodeURIComponent(password)}${suffix}`;
});

const client = postgres(encodedUrl, { 
  max: 1,
  ssl: 'require'
});

export const db = drizzle(client, { schema });

// Helper function to get authenticated user's session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const session = await getSession();
  if (!session) return null;
  
  const { data: user, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user.user;
};

// Export schema for use in other files
export * from './schema'; 