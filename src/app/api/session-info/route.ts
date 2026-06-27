import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, user } from "@/db/schema";

// Public, non-secret display info for the check-in page header.
export async function GET(req: NextRequest) {
  const s = Number(req.nextUrl.searchParams.get("s"));
  const p = req.nextUrl.searchParams.get("p") ?? "";
  if (!s) return NextResponse.json({ error: "bad session" }, { status: 400 });

  const [sess] = await db
    .select({ day: sessions.day, period: sessions.period, label: sessions.label })
    .from(sessions)
    .where(eq(sessions.sessionNumber, s))
    .limit(1);
  const [prof] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, p))
    .limit(1);

  return NextResponse.json({
    session: s,
    day: sess?.day ?? null,
    period: sess?.period ?? null,
    label: sess?.label ?? null,
    professorName: prof?.name ?? null,
  });
}
