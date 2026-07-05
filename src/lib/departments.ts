export function parseDepartments(raw: string): string[] {
  return raw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

export function isAllowedDepartment(raw: string, allowed: string[]): boolean {
  const value = raw.trim();
  return value.length > 0 && allowed.includes(value);
}
