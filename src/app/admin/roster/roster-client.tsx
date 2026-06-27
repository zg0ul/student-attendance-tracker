"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertRoster, clearRoster } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Student = { id: number; studentId: string; name: string };

// Parse "studentId,name" lines (CSV or pasted). Skips blanks and an optional header.
function parseCsv(text: string): { studentId: string; name: string }[] {
  const out: { studentId: string; name: string }[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const studentId = (cols[0] ?? "").trim();
    const name = (cols.slice(1).join(",") ?? "").trim();
    if (!studentId || !name) continue;
    if (/student/i.test(studentId) && /id|name/i.test(name)) continue; // header
    out.push({ studentId, name });
  }
  return out;
}

export function RosterClient({ students, total }: { students: Student[]; total: number }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function importCsv() {
    const rows = parseCsv(text);
    if (rows.length === 0) return toast.error("No valid rows. Use: StudentID,Name per line.");
    setBusy(true);
    const res = await upsertRoster(rows);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Imported ${res.count} students`);
    setText("");
    router.refresh();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setText(await f.text());
  }

  async function wipe() {
    if (!confirm("Delete the entire roster?")) return;
    const res = await clearRoster();
    if (res.ok) {
      toast.success("Roster cleared");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import / update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            One student per line: <code>StudentID,Full Name</code>. Existing IDs are updated.
          </p>
          <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} className="text-sm" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"0190123,Lara Ahmad\n0190456,Omar Saleh"}
            className="h-40 w-full rounded-md border p-2 font-mono text-sm"
          />
          <div className="flex gap-3">
            <Button onClick={importCsv} disabled={busy}>{busy ? "Importing…" : "Import"}</Button>
            {total > 0 && (
              <Button variant="ghost" onClick={wipe} className="text-red-600">
                Clear roster
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-mono">{s.studentId}</TableCell>
              <TableCell>{s.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
