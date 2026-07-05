import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/session-info";

// Public, non-secret display info for the check-in page header.
export async function GET(req: NextRequest) {
  const s = Number(req.nextUrl.searchParams.get("s"));
  const p = req.nextUrl.searchParams.get("p") ?? "";
  if (!s) return NextResponse.json({ error: "bad session" }, { status: 400 });

  const info = await getSessionInfo(s, p);
  return NextResponse.json(info);
}
