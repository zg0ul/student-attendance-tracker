import { NextRequest, NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = Number(req.nextUrl.searchParams.get("session"));
  if (!session) return NextResponse.json({ error: "bad session" }, { status: 400 });

  const [{ n }] = await db
    .select({ n: count() })
    .from(attendance)
    .where(eq(attendance.sessionNumber, session));
  return NextResponse.json({ count: n });
}
