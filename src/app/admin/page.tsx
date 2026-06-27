import Link from "next/link";
import { count, sql } from "drizzle-orm";
import { ListChecks, Users, CalendarDays, Settings, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { attendance, students, sessions } from "@/db/schema";

export default async function AdminDashboard() {
  const [[a], [s], [se], [act]] = await Promise.all([
    db.select({ n: count() }).from(attendance),
    db.select({ n: count() }).from(students),
    db.select({ n: count() }).from(sessions),
    db.select({ n: sql<number>`count(distinct ${attendance.sessionNumber})` }).from(attendance),
  ]);

  const stats = [
    { label: "Check-ins recorded", value: a.n },
    { label: "Students in roster", value: s.n },
    { label: "Classes set up", value: se.n },
    { label: "Classes with attendance", value: act.n },
  ];

  const setup = [
    {
      href: "/admin/roster",
      icon: ListChecks,
      title: "1. Add your students",
      body: "Upload the enrolled students (their ID number and name) so the system can recognise who's checking in.",
    },
    {
      href: "/admin/professors",
      icon: Users,
      title: "2. Add professors",
      body: "Create a sign-in for each professor who will run a class. They only see the class screen, not this admin area.",
    },
    {
      href: "/admin/sessions",
      icon: CalendarDays,
      title: "3. Set up the classes",
      body: "Tell the system how many days the course runs and how many classes happen each day.",
    },
    {
      href: "/admin/settings",
      icon: Settings,
      title: "4. Set the location (optional)",
      body: "Drop a pin on your classroom so students can only check in when they're actually in the room.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold">Welcome back</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          This is where you set up the course and review who attended. Professors use a separate
          screen to run their classes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="rounded-xl border bg-card p-4">
            <div className="font-heading text-3xl font-bold text-primary">{st.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{st.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Getting started</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {setup.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <c.icon className="size-4.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-medium">
                    {c.title}
                    <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
