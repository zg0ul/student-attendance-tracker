import { asc } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Professors</h1>
      <ProfessorsClient
        users={list.map((u) => ({ ...u, role: u.role ?? "professor", banned: !!u.banned }))}
      />
    </div>
  );
}
