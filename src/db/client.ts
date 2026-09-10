import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const rawUrl = process.env.DATABASE_URL?.trim();
const connectionString = (rawUrl && (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://'))) ? rawUrl : undefined;

// Supabase Transaction Pooler (port 6543) requires prepared statements to be disabled (`prepare: false`).
// `max: 10` limits connections per serverless instance to prevent hitting pool limits under concurrency.
const client = connectionString
  ? postgres(connectionString, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 15,
    prepare: false,
  })
  : null;

export const db = client ? drizzle(client, { schema }) : null;