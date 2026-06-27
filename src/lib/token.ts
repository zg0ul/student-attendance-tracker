import { createHmac } from "node:crypto";

/* Rotating, signed QR token. Port of the HMAC scheme in Code.gs.
 * token = "<bucket>.<sig>" where sig = HMAC(session|prof|bucket)[:20 hex].
 * Valid only within the current time window (+ optional grace windows) and
 * bound to the session, so a screenshot goes stale and cannot cross sessions.
 */

function secret(): string {
  const s = process.env.SHARED_SECRET;
  if (!s) throw new Error("SHARED_SECRET is not set");
  return s;
}

export function currentBucket(windowSeconds: number): number {
  return Math.floor(Date.now() / 1000 / windowSeconds);
}

export function sign(session: number, prof: string, bucket: number): string {
  const msg = `${session}|${prof}|${bucket}`;
  return createHmac("sha256", secret()).update(msg).digest("hex").slice(0, 20);
}

export function getToken(
  session: number,
  prof: string,
  windowSeconds: number,
): string {
  const b = currentBucket(windowSeconds);
  return `${b}.${sign(session, prof, b)}`;
}

export function tokenValid(
  session: number,
  prof: string,
  token: string,
  windowSeconds: number,
  graceWindows: number,
): boolean {
  if (!token || !token.includes(".")) return false;
  const [bucketStr, sig] = token.split(".");
  const bucket = parseInt(bucketStr, 10);
  if (Number.isNaN(bucket)) return false;
  const cur = currentBucket(windowSeconds);
  if (bucket > cur || bucket < cur - graceWindows) return false; // future / too old
  return sig === sign(session, prof, bucket);
}
