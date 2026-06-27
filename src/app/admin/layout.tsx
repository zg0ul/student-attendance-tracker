import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/data", label: "Attendance" },
  { href: "/admin/professors", label: "Professors" },
  { href: "/admin/roster", label: "Roster" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/display");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Admin</span>
          <nav className="hidden gap-3 text-sm text-muted-foreground sm:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-foreground">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/display" className="text-sm text-muted-foreground hover:text-foreground">
            Run a class
          </Link>
          <SignOutButton />
        </div>
      </header>
      <nav className="flex gap-3 overflow-x-auto border-b px-4 py-2 text-sm text-muted-foreground sm:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-foreground">
            {n.label}
          </Link>
        ))}
      </nav>
      <main className="mx-auto w-full max-w-4xl flex-1 p-4">{children}</main>
    </div>
  );
}
