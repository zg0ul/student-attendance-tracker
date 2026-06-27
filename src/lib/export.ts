import { JWT } from "google-auth-library";
import type { Attendance } from "@/db/schema";

export const EXPORT_HEADERS = [
  "Timestamp",
  "Session Number",
  "Day",
  "Period",
  "Student ID",
  "Student Name",
  "Professor",
  "Device ID",
  "Distance (m)",
  "Status",
];

function row(a: Attendance): (string | number)[] {
  return [
    a.createdAt.toISOString(),
    a.sessionNumber,
    a.day,
    a.period,
    a.studentId,
    a.studentName ?? "",
    a.professorName ?? "",
    a.deviceId ?? "",
    a.distanceM ?? "",
    a.status,
  ];
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Attendance[]): string {
  const lines = [EXPORT_HEADERS, ...rows.map(row)];
  return lines.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function sheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  );
}

// Overwrites the first sheet's values with the full export. Requires the service
// account to have edit access to GOOGLE_SHEET_ID.
export async function pushToSheet(rows: Attendance[]): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const { token } = await client.getAccessToken();
  const values = [EXPORT_HEADERS, ...rows.map(row)];

  // Clear then write so stale rows don't linger.
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z:clear`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    },
  );
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
}
