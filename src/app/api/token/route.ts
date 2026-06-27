import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { getToken } from "@/lib/token";

// Professor-auth. Token is bound to the logged-in professor's id.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = Number(req.nextUrl.searchParams.get("session"));
  if (!session) return NextResponse.json({ error: "bad session" }, { status: 400 });

  const cfg = await getSettings();
  const token = getToken(session, user.id, cfg.tokenWindowSeconds);
  return NextResponse.json({ token, prof: user.id, windowSeconds: cfg.tokenWindowSeconds });
}
