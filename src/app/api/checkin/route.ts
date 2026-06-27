import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance, students, user, sessions } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { tokenValid } from "@/lib/token";
import { distMeters } from "@/lib/geo";

const Body = z.object({
  session: z.coerce.number().int().positive(),
  prof: z.string().min(1),
  token: z.string().min(1),
  id: z.string().trim().min(1),
  deviceId: z.string().min(1),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

function fail(code: string, msg: string) {
  return NextResponse.json({ ok: false, code, msg }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return fail("BAD_REQUEST", "Please enter your Student ID.");
  }
  const { session, prof, token, id, deviceId, lat, lng } = parsed;
  const cfg = await getSettings();

  if (!tokenValid(session, prof, token, cfg.tokenWindowSeconds, cfg.tokenGraceWindows)) {
    return fail("EXPIRED", "This QR code has expired. Scan the live code on screen again.");
  }

  // Geofence (matches Code.gs: compute distance when coords present; reject only
  // when geofence is required).
  let distanceM: number | null = null;
  if (lat != null && lng != null) {
    distanceM = Math.round(distMeters(lat, lng, cfg.classLat, cfg.classLng));
    if (cfg.requireGeo && distanceM > cfg.geoRadiusM) {
      return fail("GEO", "You appear to be outside the classroom. Check in from inside the room.");
    }
  } else if (cfg.requireGeo) {
    return fail("NO_GEO", "Please allow location access to check in.");
  }

  // Roster name lookup — students never type their own name.
  const roster = await db
    .select({ name: students.name })
    .from(students)
    .where(eq(students.studentId, id))
    .limit(1);
  const studentName = roster[0]?.name ?? null;
  const status = studentName ? "OK" : "NOT_IN_ROSTER";

  const profRow = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, prof))
    .limit(1);
  const sessRow = await db
    .select({ day: sessions.day, period: sessions.period })
    .from(sessions)
    .where(eq(sessions.sessionNumber, session))
    .limit(1);
  if (!sessRow[0]) return fail("BAD_SESSION", "Unknown session.");
  const { day, period } = sessRow[0];

  try {
    await db.transaction(async (tx) => {
      // Device limit per session (configurable; default 1).
      const [{ n }] = await tx
        .select({ n: count() })
        .from(attendance)
        .where(and(eq(attendance.sessionNumber, session), eq(attendance.deviceId, deviceId)));
      if (n >= cfg.maxCheckinsPerDevice) {
        throw new CheckinError("DEVICE", "This phone has already checked in for this session.");
      }
      await tx.insert(attendance).values({
        sessionNumber: session,
        day,
        period,
        studentId: id,
        studentName,
        professorId: prof,
        professorName: profRow[0]?.name ?? null,
        deviceId,
        distanceM,
        status,
      });
    });
  } catch (err) {
    if (err instanceof CheckinError) return fail(err.code, err.message);
    // Unique(session, studentId) violation → already present.
    if (isUniqueViolation(err)) {
      return fail("DUP", "You are already marked present for this session.");
    }
    console.error("checkin error", err);
    return fail("ERR", "Server busy, please tap submit again.");
  }

  return NextResponse.json({
    ok: true,
    name: studentName ?? "(name not found — recorded by ID)",
    status,
  });
}

class CheckinError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function isUniqueViolation(err: unknown): boolean {
  // Drizzle wraps the postgres error; the SQLSTATE is on the original (.cause).
  const codeOf = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined;
  if (codeOf(err) === "23505") return true;
  const cause = (err as { cause?: unknown })?.cause;
  return codeOf(cause) === "23505";
}
