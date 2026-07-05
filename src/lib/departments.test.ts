import { describe, expect, it } from "vitest";
import { isAllowedDepartment, parseDepartments } from "./departments";

describe("departments", () => {
  it("parses comma-separated department lists", () => {
    expect(parseDepartments(" Mechanical , Electrical ,Civil ")).toEqual([
      "Mechanical",
      "Electrical",
      "Civil",
    ]);
  });

  it("accepts only configured departments", () => {
    const allowed = parseDepartments("Mechanical, Electrical");
    expect(isAllowedDepartment("Mechanical", allowed)).toBe(true);
    expect(isAllowedDepartment(" Mechanical ", allowed)).toBe(true);
    expect(isAllowedDepartment("Civil", allowed)).toBe(false);
    expect(isAllowedDepartment("", allowed)).toBe(false);
  });
});
