import { asc } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { ProfessorsClient } from "./professors-client";

export default async function ProfessorsPage() {
  const list = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
    })
    .from(user)
    .orderBy(asc(user.name));

  return (
    <div className="space-y-6">
      <PageHeader title="Professors">
        Give each professor their own sign-in so they can run their classes. Professors only see the
        class screen — they can&apos;t change settings or see this admin area. Make someone an admin to
        give them full access. Deactivate an account to block sign-in without deleting their history.
      </PageHeader>
      <ProfessorsClient
        users={list.map((u) => ({ ...u, role: u.role ?? "professor", banned: !!u.banned }))}
      />
    </div>
  );
}
