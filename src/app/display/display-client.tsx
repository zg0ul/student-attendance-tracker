"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SessionRow = { sessionNumber: number; day: number; period: number; label: string | null };

export function DisplayClient({
  professorName,
  isAdmin,
  days,
  periods,
  sessions,
}: {
  professorName: string;
  isAdmin: boolean;
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
    QRCode.toDataURL(url, { width: 520, margin: 1, errorCorrectionLevel: "M" }).then(setQrDataUrl);
  }, [started, tokenQuery.data, sessionNumber]);

  /* ---------- Setup screen ---------- */
  if (!started) {
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <Brand subtitle={professorName} />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Admin panel
              </Link>
            )}
            <SignOutButton />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-7 shadow-sm">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl font-bold">Start a class</h1>
              <p className="text-sm text-muted-foreground">
                Pick the day and class. We&apos;ll put a QR code on screen for students to scan — it
                refreshes on its own so old screenshots stop working.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Class</Label>
                <Select value={String(period)} onValueChange={(v) => v && setPeriod(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: periods }, (_, i) => i + 1).map((c) => (
                      <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {label && (
              <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                {label}
              </p>
            )}
            <Button className="h-12 w-full text-base" onClick={() => setStarted(true)}>
              Show QR on screen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Projected stage (no admin chrome) ---------- */
  return (
    <div className="brand-gradient flex min-h-dvh flex-col items-center justify-center px-6 py-8 text-white">
      <div className="absolute left-5 top-5 hidden sm:block">
        <Brand tone="light" />
      </div>

      <div className="mb-5 text-center">
        <div className="font-heading text-3xl font-extrabold sm:text-4xl">
          Session {sessionNumber}
        </div>
        <div className="mt-1 text-white/70">
          Day {day}, Class {period}
          {label ? ` · ${label}` : ""}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="Scan to check in"
            className="size-[min(70vw,420px)]"
          />
        ) : (
          <div className="flex size-[min(70vw,420px)] items-center justify-center text-muted-foreground">
            Generating…
          </div>
        )}
      </div>

      <p className="mt-5 max-w-md text-center text-white/70">
        Open your phone camera and point it at the code, then enter your university ID.
      </p>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-heading text-6xl font-extrabold tabular-nums text-gold sm:text-7xl">
          {countQuery.data?.count ?? 0}
        </span>
        <span className="text-lg text-white/70">checked in</span>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-white/50">
          <RefreshCw className="size-3.5" />
          Code refreshes automatically
        </span>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/15 text-white hover:bg-white/25"
          onClick={() => {
            setStarted(false);
            setQrDataUrl(null);
          }}
        >
          <ArrowLeft className="size-4" /> End class
        </Button>
      </div>
    </div>
  );
}
