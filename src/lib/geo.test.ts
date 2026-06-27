import { describe, expect, it } from "vitest";
import { distMeters } from "./geo";

describe("distMeters", () => {
  it("is zero for identical points", () => {
    expect(distMeters(31.94, 35.87, 31.94, 35.87)).toBe(0);
  });

  it("approximates one degree of longitude at the equator (~111.3 km)", () => {
    const d = distMeters(0, 0, 0, 1);
    expect(d).toBeGreaterThan(111000);
    expect(d).toBeLessThan(111400);
  });

  it("computes a short campus-scale distance", () => {
    // ~0.0009 deg lat ≈ 100 m
    const d = distMeters(31.9421, 35.873, 31.9430, 35.873);
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(110);
  });
});
