import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ListChecks,
  CalendarDays,
  Settings,
  Presentation,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/data", label: "Attendance", icon: ClipboardList },
  { href: "/admin/professors", label: "Professors", icon: Users },
  { href: "/admin/roster", label: "Roster", icon: ListChecks },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/display");

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="border-b px-5 py-4">
          <Brand subtitle="Admin" />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/display"
              className="flex items-center gap-2.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              <Presentation className="size-4" />
              Run a class
            </Link>
          </div>
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 truncate px-1 text-xs text-muted-foreground">{user.name}</div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <Brand subtitle="Admin" />
          <SignOutButton />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-4xl flex-1 p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
