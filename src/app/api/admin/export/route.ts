import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { toCsv } from "@/lib/export";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const s = Number(req.nextUrl.searchParams.get("session"));
  const rows = await db
    .select()
    .from(attendance)
    .where(s ? eq(attendance.sessionNumber, s) : undefined)
    .orderBy(asc(attendance.createdAt));

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance${s ? `-session-${s}` : ""}.csv"`,
    },
  });
}
