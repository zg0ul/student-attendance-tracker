import { asc, count } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { RosterClient } from "./roster-client";

export default async function RosterPage() {
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(students).orderBy(asc(students.studentId)).limit(200),
    db.select({ n: count() }).from(students),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Roster</h1>
      <p className="text-sm text-muted-foreground">{n} students enrolled (showing up to 200).</p>
      <RosterClient students={rows} total={n} />
    </div>
  );
}
