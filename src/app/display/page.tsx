import { redirect } from "next/navigation";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { DisplayClient } from "./display-client";

export default async function DisplayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cfg = await getSettings();
  const sess = await db.select().from(sessions).orderBy(asc(sessions.sessionNumber));

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-medium">{user.name}</div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>
      <DisplayClient
        professorName={user.name}
        days={cfg.days}
        periods={cfg.periods}
        sessions={sess}
      />
    </div>
  );
}
