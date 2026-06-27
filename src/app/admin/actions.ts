"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { asc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { settings, students, sessions, attendance } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { pushToSheet, sheetsConfigured } from "@/lib/export";

type Result = { ok: true } | { ok: false; error: string };

async function guard(): Promise<Result | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return { ok: false, error: "Not authorized" };
  }
}

const SettingsInput = z.object({
  requireGeo: z.boolean(),
  classLat: z.number(),
  classLng: z.number(),
  geoRadiusM: z.number().int().min(1),
  tokenWindowSeconds: z.number().int().min(10),
  tokenGraceWindows: z.number().int().min(0),
  maxCheckinsPerDevice: z.number().int().min(1),
});

export async function updateSettings(input: z.infer<typeof SettingsInput>): Promise<Result> {
  const g = await guard();
  if (g) return g;
  const v = SettingsInput.parse(input);
  await db.update(settings).set(v).where(eq(settings.id, 1));
  revalidatePath("/admin/settings");
  return { ok: true };
}

// Replace days/periods and regenerate the session grid, preserving labels of
// sessions that still exist.
export async function updateSessionGrid(days: number, periods: number): Promise<Result> {
  const g = await guard();
  if (g) return g;
  if (days < 1 || periods < 1) return { ok: false, error: "days/periods must be >= 1" };
  await db.update(settings).set({ days, periods }).where(eq(settings.id, 1));

  const total = days * periods;
  const rows = [];
  for (let day = 1; day <= days; day++) {
    for (let period = 1; period <= periods; period++) {
      rows.push({ sessionNumber: (day - 1) * periods + period, day, period });
    }
  }
  await db.insert(sessions).values(rows).onConflictDoUpdate({
    target: sessions.sessionNumber,
    set: { day: sql`excluded.day`, period: sql`excluded.period` },
  });
  await db.delete(sessions).where(gt(sessions.sessionNumber, total));
  revalidatePath("/admin/sessions");
  return { ok: true };
}

export async function updateSessionLabel(sessionNumber: number, label: string): Promise<Result> {
  const g = await guard();
  if (g) return g;
  await db
    .update(sessions)
    .set({ label: label.trim() || null })
    .where(eq(sessions.sessionNumber, sessionNumber));
  revalidatePath("/admin/sessions");
  return { ok: true };
}

// Upsert roster rows by studentId (append/update). Names come from here.
export async function upsertRoster(
  list: { studentId: string; name: string }[],
): Promise<Result & { count?: number }> {
  const g = await guard();
  if (g) return g;
  const clean = list
    .map((r) => ({ studentId: r.studentId.trim(), name: r.name.trim() }))
    .filter((r) => r.studentId && r.name);
  if (clean.length === 0) return { ok: false, error: "No valid rows found" };
  // De-dup within the batch (last wins) to avoid ON CONFLICT double-hit.
  const map = new Map(clean.map((r) => [r.studentId, r]));
  const rows = [...map.values()];
  await db.insert(students).values(rows).onConflictDoUpdate({
    target: students.studentId,
    set: { name: sql`excluded.name` },
  });
  revalidatePath("/admin/roster");
  return { ok: true, count: rows.length };
}

export async function clearRoster(): Promise<Result> {
  const g = await guard();
  if (g) return g;
  await db.delete(students);
  revalidatePath("/admin/roster");
  return { ok: true };
}

export async function deleteStudents(ids: number[]): Promise<Result> {
  const g = await guard();
  if (g) return g;
  if (ids.length) await db.delete(students).where(inArray(students.id, ids));
  revalidatePath("/admin/roster");
  return { ok: true };
}

export async function pushToGoogleSheet(session?: number): Promise<Result> {
  const g = await guard();
  if (g) return g;
  if (!sheetsConfigured()) return { ok: false, error: "Google Sheets is not configured (.env)" };
  const rows = await db
    .select()
    .from(attendance)
    .where(session ? eq(attendance.sessionNumber, session) : undefined)
    .orderBy(asc(attendance.createdAt));
  try {
    await pushToSheet(rows);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Push failed" };
  }
  return { ok: true };
}
