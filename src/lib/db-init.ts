import { sql } from "drizzle-orm";
import { db } from "@/db";

export class DatabaseSetupError extends Error {
  code: string;
  hint: string;
  constructor(message: string, code: string, hint: string) {
    super(message);
    this.code = code;
    this.hint = hint;
  }
}

const globalDb = globalThis as typeof globalThis & {
  __chazmasterDbReady?: Promise<void>;
};

async function createTables(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS card_photos (
      id serial PRIMARY KEY,
      mime_type text DEFAULT 'image/jpeg' NOT NULL,
      data_base64 text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS collection_cards (
      id serial PRIMARY KEY,
      tcg_id text,
      name text NOT NULL,
      card_number text NOT NULL,
      set_total text,
      set_name text NOT NULL,
      set_id text,
      set_symbol_url text,
      rarity text DEFAULT 'Rare' NOT NULL,
      pokemon_type text DEFAULT 'Colorless' NOT NULL,
      hp integer,
      stage text,
      illustrator text,
      attacks_json text,
      image_url text NOT NULL,
      captured_photo_url text,
      photo_id integer,
      language text DEFAULT 'English' NOT NULL,
      variant text DEFAULT 'Holofoil' NOT NULL,
      condition text DEFAULT 'Near Mint' NOT NULL,
      price numeric(10, 2) DEFAULT '0.00' NOT NULL,
      market_price numeric(10, 2),
      quantity integer DEFAULT 1 NOT NULL,
      for_sale boolean DEFAULT true NOT NULL,
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);

  // Backfill language column for older deployments created before i18n support
  await db.execute(sql`
    ALTER TABLE collection_cards
    ADD COLUMN IF NOT EXISTS language text DEFAULT 'English' NOT NULL;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS order_inquiries (
      id serial PRIMARY KEY,
      buyer_name text,
      buyer_note text,
      items_json text NOT NULL,
      total_amount numeric(10, 2) NOT NULL,
      total_cards integer NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seed_meta (
      key text PRIMARY KEY,
      seeded_at timestamp DEFAULT now() NOT NULL
    );
  `);
}

/**
 * Ensures the PostgreSQL schema exists. Safe to call on every request:
 * the work is memoized per server instance and every statement is idempotent.
 * On serverless hosts (Vercel) this removes the need to run drizzle-kit push.
 */
export function ensureDatabaseReady(): Promise<void> {
  if (!globalDb.__chazmasterDbReady) {
    globalDb.__chazmasterDbReady = createTables().catch((err: unknown) => {
      globalDb.__chazmasterDbReady = undefined;
      throw err;
    });
  }
  return globalDb.__chazmasterDbReady;
}

export function describeDbError(err: unknown): {
  error: string;
  code: string;
  hint: string;
} {
  const raw = err instanceof Error ? err.message : String(err);
  const message = raw.toLowerCase();

  if (
    message.includes("database_url") ||
    message.includes("required") ||
    message.includes("password must be a string") ||
    message.includes("enotfound") ||
    message.includes("getaddrinfo")
  ) {
    return {
      error: "Database is not connected on this deployment.",
      code: "DB_NOT_CONFIGURED",
      hint:
        "Add a PostgreSQL connection string as the DATABASE_URL environment variable in your Vercel project settings (Neon, Supabase or Vercel Postgres), then redeploy.",
    };
  }

  if (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("undefined_table")
  ) {
    return {
      error: "Database tables are missing.",
      code: "DB_TABLES_MISSING",
      hint:
        "Open the Admin page and press 'Set up database tables' — it creates every required table automatically.",
    };
  }

  if (message.includes("password authentication failed") || message.includes("28p01")) {
    return {
      error: "Database rejected the credentials.",
      code: "DB_AUTH_FAILED",
      hint: "Check the username and password inside your DATABASE_URL variable, then redeploy.",
    };
  }

  if (message.includes("ssl") || message.includes("self signed")) {
    return {
      error: "Database SSL connection failed.",
      code: "DB_SSL_FAILED",
      hint: "Append ?sslmode=require to your DATABASE_URL (most hosted Postgres providers need it).",
    };
  }

  return {
    error: "Database error while saving.",
    code: "DB_ERROR",
    hint: `Underlying error: ${raw.slice(0, 220)}`,
  };
}
