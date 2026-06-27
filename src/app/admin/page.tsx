import Link from "next/link";
import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, students, sessions } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const [[a], [s], [se], [sessActive]] = await Promise.all([
    db.select({ n: count() }).from(attendance),
    db.select({ n: count() }).from(students),
    db.select({ n: count() }).from(sessions),
    db
      .select({ n: sql<number>`count(distinct ${attendance.sessionNumber})` })
      .from(attendance),
  ]);

  const stats = [
    { label: "Total check-ins", value: a.n },
    { label: "Students in roster", value: s.n },
    { label: "Sessions configured", value: se.n },
    { label: "Sessions with activity", value: sessActive.n },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((st) => (
          <Card key={st.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-2xl">{st.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{st.label}</CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href="/admin/data">View attendance & export</Link>
        <Link className="underline" href="/admin/roster">Import roster</Link>
        <Link className="underline" href="/admin/professors">Add a professor</Link>
        <Link className="underline" href="/admin/settings">Geofence & QR settings</Link>
      </div>
    </div>
  );
}
