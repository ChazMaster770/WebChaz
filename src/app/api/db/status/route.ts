import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { describeDbError, ensureDatabaseReady } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.DATABASE_URL);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      tablesReady: false,
      error: "DATABASE_URL is not set on this deployment.",
      hint:
        "In Vercel: Project → Settings → Environment Variables → add DATABASE_URL with your PostgreSQL connection string (Neon/Supabase/Vercel Postgres), then redeploy.",
    });
  }

  try {
    await db.execute(sql`select 1`);
  } catch (err) {
    const info = describeDbError(err);
    return NextResponse.json({
      configured: true,
      connected: false,
      tablesReady: false,
      error: info.error,
      hint: info.hint,
    });
  }

  try {
    await ensureDatabaseReady();
    return NextResponse.json({
      configured: true,
      connected: true,
      tablesReady: true,
    });
  } catch (err) {
    const info = describeDbError(err);
    return NextResponse.json({
      configured: true,
      connected: true,
      tablesReady: false,
      error: info.error,
      hint: info.hint,
    });
  }
}

export async function POST() {
  try {
    await ensureDatabaseReady();
    return NextResponse.json({ success: true, tablesReady: true });
  } catch (err) {
    const info = describeDbError(err);
    return NextResponse.json({ success: false, ...info }, { status: 500 });
  }
}
