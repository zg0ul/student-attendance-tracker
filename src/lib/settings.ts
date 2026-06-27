import { db } from "@/db";
import { settings, type Settings } from "@/db/schema";
import { eq } from "drizzle-orm";

// The singleton config row (id = 1). Seeded by scripts/seed.ts; this is a
// self-healing fallback in case it's missing.
export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings).where(eq(settings.id, 1));
  if (rows[0]) return rows[0];
  const [created] = await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(settings).where(eq(settings.id, 1)))[0];
}
