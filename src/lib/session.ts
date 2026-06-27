import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const s = await auth.api.getSession({ headers: await headers() });
  return s?.user ?? null;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("FORBIDDEN");
  return u;
}
