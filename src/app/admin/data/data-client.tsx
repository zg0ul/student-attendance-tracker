"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pushToGoogleSheet } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = {
  id: number;
  createdAt: string;
  sessionNumber: number;
  day: number;
  period: number;
  studentId: string;
  studentName: string | null;
  professorName: string | null;
  distanceM: number | null;
  status: string;
};
type Sess = { sessionNumber: number; day: number; period: number };

export function DataClient({
  rows,
  sessions,
  selected,
  sheetsEnabled,
}: {
  rows: Row[];
  sessions: Sess[];
  selected: number;
  sheetsEnabled: boolean;
}) {
  const router = useRouter();
  const [pushing, setPushing] = useState(false);

  function onFilter(v: string | null) {
    if (!v) return;
    router.push(v === "all" ? "/admin/data" : `/admin/data?session=${v}`);
  }

  async function push() {
    setPushing(true);
    const res = await pushToGoogleSheet(selected || undefined);
    setPushing(false);
    if (res.ok) toast.success("Pushed to Google Sheet");
    else toast.error(res.error);
  }

  const exportHref = `/api/admin/export${selected ? `?session=${selected}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selected ? String(selected) : "all"} onValueChange={onFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s.sessionNumber} value={String(s.sessionNumber)}>
                Session {s.sessionNumber} · Day {s.day}, Class {s.period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <a href={exportHref} className={buttonVariants({ variant: "outline" })}>
          Export CSV
        </a>
        {sheetsEnabled && (
          <Button variant="outline" onClick={push} disabled={pushing}>
            {pushing ? "Pushing…" : "Push to Google Sheet"}
          </Button>
        )}
        <span className="text-sm text-muted-foreground">{rows.length} rows</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Professor</TableHead>
            <TableHead>Dist (m)</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-xs">
                {new Date(r.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>{r.sessionNumber}</TableCell>
              <TableCell className="font-mono">{r.studentId}</TableCell>
              <TableCell>{r.studentName ?? "—"}</TableCell>
              <TableCell>{r.professorName ?? "—"}</TableCell>
              <TableCell>{r.distanceM ?? "—"}</TableCell>
              <TableCell>
                {r.status === "OK" ? (
                  <Badge>OK</Badge>
                ) : (
                  <Badge variant="destructive">Not in roster</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
