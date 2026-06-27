import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.SHARED_SECRET = "test-secret-for-vitest";
});

// Import after the secret is set (token.ts reads it lazily, but keep it explicit).
const { getToken, tokenValid, sign, currentBucket } = await import("./token");

const W = 60;
const G = 1;

describe("token", () => {
  it("validates a freshly issued token", () => {
    const t = getToken(5, "prof-1", W);
    expect(tokenValid(5, "prof-1", t, W, G)).toBe(true);
  });

  it("rejects a token for a different session", () => {
    const t = getToken(5, "prof-1", W);
    expect(tokenValid(6, "prof-1", t, W, G)).toBe(false);
  });

  it("rejects a token for a different professor", () => {
    const t = getToken(5, "prof-1", W);
    expect(tokenValid(5, "prof-2", t, W, G)).toBe(false);
  });

  it("accepts within the grace window but rejects older", () => {
    const cur = currentBucket(W);
    const prev = `${cur - 1}.${sign(5, "prof-1", cur - 1)}`;
    const old = `${cur - 2}.${sign(5, "prof-1", cur - 2)}`;
    expect(tokenValid(5, "prof-1", prev, W, G)).toBe(true); // grace = 1
    expect(tokenValid(5, "prof-1", old, W, G)).toBe(false);
  });

  it("rejects a future bucket and tampered signatures", () => {
    const cur = currentBucket(W);
    const future = `${cur + 1}.${sign(5, "prof-1", cur + 1)}`;
    expect(tokenValid(5, "prof-1", future, W, G)).toBe(false);
    expect(tokenValid(5, "prof-1", `${cur}.deadbeef`, W, G)).toBe(false);
    expect(tokenValid(5, "prof-1", "garbage", W, G)).toBe(false);
  });
});
