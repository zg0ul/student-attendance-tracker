"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSessionGrid, updateSessionLabel } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SessionRow = { sessionNumber: number; day: number; period: number; label: string | null };

export function SessionsClient({
  days,
  periods,
  sessions,
}: {
  days: number;
  periods: number;
  sessions: SessionRow[];
}) {
  const router = useRouter();
  const [d, setD] = useState(days);
  const [p, setP] = useState(periods);
  const [labels, setLabels] = useState<Record<number, string>>(
    Object.fromEntries(sessions.map((s) => [s.sessionNumber, s.label ?? ""])),
  );

  async function regen() {
    if (!confirm(`Set grid to ${d} days × ${p} classes = ${d * p} sessions? Extra sessions are removed.`)) return;
    const res = await updateSessionGrid(d, p);
    if (!res.ok) return toast.error(res.error);
    toast.success("Session grid updated");
    router.refresh();
  }

  async function saveLabel(sessionNumber: number) {
    const res = await updateSessionLabel(sessionNumber, labels[sessionNumber] ?? "");
    if (!res.ok) return toast.error(res.error);
    toast.success(`Session ${sessionNumber} label saved`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course grid</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Days</Label>
            <Input type="number" min={1} value={d} onChange={(e) => setD(Number(e.target.value))} className="w-24" />
          </div>
          <div className="space-y-1">
            <Label>Classes per day</Label>
            <Input type="number" min={1} value={p} onChange={(e) => setP(Number(e.target.value))} className="w-24" />
          </div>
          <Button onClick={regen}>Apply grid ({d * p} sessions)</Button>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Label (optional)</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s.sessionNumber}>
              <TableCell>{s.sessionNumber}</TableCell>
              <TableCell>{s.day}</TableCell>
              <TableCell>{s.period}</TableCell>
              <TableCell>
                <Input
                  value={labels[s.sessionNumber] ?? ""}
                  onChange={(e) => setLabels((l) => ({ ...l, [s.sessionNumber]: e.target.value }))}
                  placeholder="e.g. CV Writing"
                  className="h-8"
                />
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => saveLabel(s.sessionNumber)}>
                  Save
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
