import { asc } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { SessionsClient } from "./sessions-client";

export default async function SessionsPage() {
  const cfg = await getSettings();
  const rows = await db.select().from(sessions).orderBy(asc(sessions.sessionNumber));
  return (
    <div className="space-y-6">
      <PageHeader title="Sessions">
        A session is a single class on a single day — for example "Day 3, Class 2". Set how many
        days the course runs and how many classes happen each day, and the system creates a numbered
        slot for each one. You can give a slot a name (like "CV Writing") so it's easy to recognise.
      </PageHeader>
      <SessionsClient days={cfg.days} periods={cfg.periods} sessions={rows} />
    </div>
  );
}
