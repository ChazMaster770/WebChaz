import { sql } from "drizzle-orm";
import { db } from "@/db";
import { describeDbError } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "connected" });
  } catch (err) {
    const info = describeDbError(err);
    return Response.json(
      { ok: false, database: "unavailable", error: info.error, hint: info.hint },
      { status: 500 }
    );
  }
}
