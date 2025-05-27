import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create the database connection
const client = postgres(process.env.DATABASE_URL, { 
  prepare: false,
  ssl: 'require', // Always require SSL for Supabase
  onnotice: () => {}, // Suppress notices in development
  connection: {
    application_name: 'earthai-app'
  },
  // Add connection pooling and timeout settings
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema'; 