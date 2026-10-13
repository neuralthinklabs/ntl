import dotenv from 'dotenv'
import path from 'path'
import { defineConfig } from 'drizzle-kit'

// Force-load Next.js's .env.local file explicitly
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
})

// The SQL files in supabase/migrations are the single source of truth for the
// database (they also carry RLS policies, triggers and storage rules that
// Drizzle cannot express). db/schema.ts is maintained by hand to match them
// and is used only for typed queries. Drizzle Kit is kept for `db:studio`;
// its generator output goes to a scratch folder so it can never collide with
// the Supabase migrations.
export default defineConfig({
  schema: './db/schema.ts',
  out: './.drizzle-scratch',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
