import { asc, count } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { RosterClient } from "./roster-client";

export default async function RosterPage() {
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(students).orderBy(asc(students.studentId)).limit(200),
    db.select({ n: count() }).from(students),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Roster">
        The roster is your list of enrolled students. When a student checks in, the system matches
        their ID number to this list and records their name automatically — so students can never
        type a fake name. Upload everyone once at the start of the course.
      </PageHeader>
      <p className="text-sm text-muted-foreground">
        {n} students enrolled{n > 200 ? " (showing the first 200)" : ""}.
      </p>
      <RosterClient students={rows} total={n} />
    </div>
  );
}
