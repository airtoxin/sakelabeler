import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

const OWNER = '11111111-1111-4111-8111-111111111111';
const SHARED = '22222222-2222-4222-8222-222222222222';
const OUTSIDER = '33333333-3333-4333-8333-333333333333';
const migrations = path.resolve('supabase', 'migrations');
const breweryMigration = fs.readdirSync(migrations).find(name => name.endsWith('_add_brewery_to_sake_records.sql'));

async function createDatabase({ migrateBrewery = true } = {}) {
  const db = new PGlite();
  // Only the auth/storage schema surface needed by the repository's migrations.
  // This is an in-process test database, never a live Supabase project.
  await db.exec(`
    CREATE SCHEMA auth;
    CREATE SCHEMA storage;
    CREATE ROLE authenticated;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  `);
  for (const file of fs.readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) {
    if (!migrateBrewery && file === breweryMigration) continue;
    await db.exec(fs.readFileSync(path.join(migrations, file), 'utf8'));
  }
  await db.exec(`
    INSERT INTO auth.users (id) VALUES ('${OWNER}'), ('${SHARED}'), ('${OUTSIDER}');
    GRANT USAGE ON SCHEMA public, auth, storage TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, storage TO authenticated;
  `);
  return db;
}

async function asUser(db, userId, callback) {
  return db.transaction(async tx => {
    await tx.exec('SET LOCAL ROLE authenticated');
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId]);
    return callback(tx);
  });
}

export { createDatabase, asUser, OWNER, SHARED, OUTSIDER, breweryMigration, migrations };
