import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance, sessions } from "@/db/schema";
import { sheetsConfigured } from "@/lib/export";
import { PageHeader } from "@/components/page-header";
import { DataClient } from "./data-client";

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const s = Number(session) || 0;

  const [rows, sess] = await Promise.all([
    db
      .select()
      .from(attendance)
      .where(s ? eq(attendance.sessionNumber, s) : undefined)
      .orderBy(desc(attendance.createdAt))
      .limit(1000),
    db.select().from(sessions).orderBy(asc(sessions.sessionNumber)),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance">
        Every check-in is recorded here. Filter by a specific class, or download everything as a
        spreadsheet (CSV) to keep or share. Rows marked &ldquo;Not in roster&rdquo; are IDs that weren&apos;t on your
        student list — worth a quick look.
      </PageHeader>
      <DataClient
        rows={rows.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          sessionNumber: r.sessionNumber,
          day: r.day,
          period: r.period,
          studentId: r.studentId,
          studentName: r.studentName,
          department: r.department,
          professorName: r.professorName,
          distanceM: r.distanceM,
          status: r.status,
        }))}
        sessions={sess.map((x) => ({ sessionNumber: x.sessionNumber, day: x.day, period: x.period }))}
        selected={s}
        sheetsEnabled={sheetsConfigured()}
      />
    </div>
  );
}
