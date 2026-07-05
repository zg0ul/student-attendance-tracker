import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, user } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { parseDepartments } from "@/lib/departments";

export type SessionInfo = {
  session: number;
  day: number | null;
  period: number | null;
  label: string | null;
  professorName: string | null;
  departments: string[];
};

export async function getSessionInfo(
  sessionNumber: number,
  profId: string,
): Promise<SessionInfo | null> {
  if (!sessionNumber) return null;

  const [sess] = await db
    .select({ day: sessions.day, period: sessions.period, label: sessions.label })
    .from(sessions)
    .where(eq(sessions.sessionNumber, sessionNumber))
    .limit(1);
  const [prof] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, profId))
    .limit(1);
  const cfg = await getSettings();
  const departments = parseDepartments(cfg.departments);

  return {
    session: sessionNumber,
    day: sess?.day ?? null,
    period: sess?.period ?? null,
    label: sess?.label ?? null,
    professorName: prof?.name ?? null,
    departments,
  };
}
