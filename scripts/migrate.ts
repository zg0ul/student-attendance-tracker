import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // The DB may still be starting (or its DNS name not yet resolvable) when the
  // app container boots. Retry a few times before giving up.
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const sql = postgres(url, { max: 1 });
    try {
      await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
      await sql.end();
      console.log("migrations applied");
      return;
    } catch (e) {
      await sql.end({ timeout: 1 }).catch(() => {});
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt === maxAttempts) throw e;
      console.log(`migrate: DB not ready (${msg}); retry ${attempt}/${maxAttempts} in 3s`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
