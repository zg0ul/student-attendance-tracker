import { asc } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { SessionsClient } from "./sessions-client";

export default async function SessionsPage() {
  const cfg = await getSettings();
  const rows = await db.select().from(sessions).orderBy(asc(sessions.sessionNumber));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Sessions</h1>
      <SessionsClient days={cfg.days} periods={cfg.periods} sessions={rows} />
    </div>
  );
}
