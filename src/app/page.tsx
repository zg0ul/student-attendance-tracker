import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

// Route users by role. The student check-in page (/checkin) is separate and public.
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/admin" : "/display");
}
