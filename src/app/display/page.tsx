import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { DisplayClient } from "./display-client";

export default async function DisplayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cfg = await getSettings();
  const sess = await db.select().from(sessions).orderBy(asc(sessions.sessionNumber));

  return (
    <DisplayClient
      professorName={user.name}
      isAdmin={user.role === "admin"}
      days={cfg.days}
      periods={cfg.periods}
      sessions={sess}
    />
  );
}
