"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type SessionRow = { sessionNumber: number; day: number; period: number; label: string | null };

export function DisplayClient({
  professorName,
  days,
  periods,
  sessions,
}: {
  professorName: string;
  days: number;
  periods: number;
  sessions: SessionRow[];
}) {
  const [day, setDay] = useState(1);
  const [period, setPeriod] = useState(1);
  const [started, setStarted] = useState(false);

  const sessionNumber = (day - 1) * periods + period;
  const label = useMemo(
    () => sessions.find((s) => s.sessionNumber === sessionNumber)?.label,
    [sessions, sessionNumber],
  );

  const tokenQuery = useQuery({
    queryKey: ["token", sessionNumber],
    queryFn: async () => {
      const r = await fetch(`/api/token?session=${sessionNumber}`);
      if (!r.ok) throw new Error("token fetch failed");
      return r.json() as Promise<{ token: string; prof: string }>;
    },
    enabled: started,
    refetchInterval: 25000,
  });

  const countQuery = useQuery({
    queryKey: ["count", sessionNumber],
    queryFn: async () => {
      const r = await fetch(`/api/count?session=${sessionNumber}`);
      return r.json() as Promise<{ count: number }>;
    },
    enabled: started,
    refetchInterval: 8000,
  });

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!started || !tokenQuery.data) return;
    const { token, prof } = tokenQuery.data;
    const url = `${window.location.origin}/checkin?s=${sessionNumber}&p=${encodeURIComponent(prof)}&t=${token}`;
    QRCode.toDataURL(url, { width: 360, margin: 1, errorCorrectionLevel: "M" }).then(setQrDataUrl);
  }, [started, tokenQuery.data, sessionNumber]);

  if (!started) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 rounded-xl border p-6">
          <h1 className="text-lg font-semibold">Start a session</h1>
          <p className="text-sm text-muted-foreground">{professorName}</p>
          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={String(day)} onValueChange={(v) => v && setDay(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class / Period</Label>
            <Select value={String(period)} onValueChange={(v) => v && setPeriod(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: periods }, (_, i) => i + 1).map((c) => (
                  <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => setStarted(true)}>
            Show QR for this class
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-2xl font-bold">
        Session {sessionNumber} · Day {day}, Class {period}
      </div>
      {label && <div className="text-muted-foreground">{label}</div>}
      <div className="rounded-2xl bg-white p-6 shadow">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="Attendance QR" width={360} height={360} />
        ) : (
          <div className="flex h-[360px] w-[360px] items-center justify-center text-muted-foreground">
            Generating QR…
          </div>
        )}
      </div>
      <p className="max-w-md text-sm text-muted-foreground">
        Scan with your phone camera. The code refreshes automatically — a screenshot will not work for long.
      </p>
      <div className="text-4xl font-extrabold text-green-600">
        {countQuery.data?.count ?? 0}
        <span className="block text-sm font-medium text-muted-foreground">checked in</span>
      </div>
      <Button variant="secondary" onClick={() => { setStarted(false); setQrDataUrl(null); }}>
        End / change class
      </Button>
    </div>
  );
}
