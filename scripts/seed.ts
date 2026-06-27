import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/db";
import { user, account, settings, sessions } from "../src/db/schema";

async function main() {
  // 1. Settings singleton.
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
  const [cfg] = await db.select().from(settings);
  console.log(`settings: days=${cfg.days} periods=${cfg.periods}`);

  // 2. Generate session grid (idempotent).
  const rows = [];
  for (let day = 1; day <= cfg.days; day++) {
    for (let period = 1; period <= cfg.periods; period++) {
      rows.push({ sessionNumber: (day - 1) * cfg.periods + period, day, period });
    }
  }
  await db.insert(sessions).values(rows).onConflictDoNothing();
  console.log(`sessions: ${rows.length} ensured`);

  // 3. First admin, only if the user table is empty.
  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) {
    console.log("users already exist — skipping admin creation");
    return;
  }
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Site Admin";
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin");
  }

  const userId = randomUUID();
  await db.insert(user).values({
    id: userId,
    name,
    email: email.toLowerCase(),
    emailVerified: true,
    role: "admin",
  });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(password),
  });
  console.log(`admin created: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
