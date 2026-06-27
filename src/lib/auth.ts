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
  plugins: [admin({ defaultRole: "professor", adminRoles: ["admin"] })],
});

export type AppUser = typeof auth.$Infer.Session.user;
