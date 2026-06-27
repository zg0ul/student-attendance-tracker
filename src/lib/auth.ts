import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db, schema } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Professors don't self-register; the admin creates accounts.
    disableSignUp: true,
  },
  // Origin allowlist. In production, the served URL (BETTER_AUTH_URL) is trusted
  // plus anything in TRUSTED_ORIGINS. In dev we also trust the host you're
  // hitting, so testing on a phone over Wi-Fi (http://192.168.x.x:3000) just works.
  trustedOrigins: (request) => {
    const list = (process.env.TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (process.env.NODE_ENV !== "production") {
      const origin = request?.headers.get("origin");
      if (origin) list.push(origin);
    }
    return list;
  },
  plugins: [admin({ defaultRole: "professor", adminRoles: ["admin"] })],
});

export type AppUser = typeof auth.$Infer.Session.user;
