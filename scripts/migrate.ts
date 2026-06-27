import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

function rootCause(e: unknown): Error {
  let cur: unknown = e;
  while (cur instanceof Error && "cause" in cur && cur.cause instanceof Error) {
    cur = cur.cause;
  }
  return cur instanceof Error ? cur : new Error(String(e));
}

function dbHost(url: string): string {
  try {
    return new URL(url.replace(/^postgres:/, "postgresql:")).hostname;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function isRetryable(e: unknown): boolean {
  const root = rootCause(e);
  const code = "code" in root ? String(root.code) : "";
  // DNS not ready yet, or Postgres still accepting connections.
  return (
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT"
  );
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const host = dbHost(url);
  console.log(`migrate: connecting to ${host}`);

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
      const root = rootCause(e);
      const code = "code" in root ? String(root.code) : "";
      const detail = code ? `${code}: ${root.message}` : root.message;

      if (attempt === maxAttempts) {
        if (code === "EAI_AGAIN" || code === "ENOTFOUND") {
          console.error(
            `migrate: cannot resolve database host "${host}". ` +
              "On Coolify, open the application → link/connect the Postgres resource " +
              "(same server/project), then redeploy with the internal connection string.",
          );
        }
        throw e;
      }

      if (!isRetryable(e)) throw e;

      console.log(`migrate: DB not ready (${detail}); retry ${attempt}/${maxAttempts} in 3s`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
