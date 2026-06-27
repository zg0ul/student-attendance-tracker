"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, GraduationCap, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getDeviceId(): string {
  const k = "att_device_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = "d-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(k, v);
  }
  return v;
}

// Best-effort geolocation; resolves null if denied/unavailable.
function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  });
}

type Info = {
  session: number;
  day: number | null;
  period: number | null;
  label: string | null;
  professorName: string | null;
};

export function CheckinForm({ session, prof, token }: { session: string; prof: string; token: string }) {
  const [id, setId] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [okName, setOkName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/session-info?s=${session}&p=${encodeURIComponent(prof)}`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, [session, prof]);

  async function submit() {
    if (!id.trim()) {
      setError("Enter your university ID number to continue.");
      return;
    }
    setState("submitting");
    setError(null);
    const pos = await getPosition();
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          prof,
          token,
          id: id.trim(),
          deviceId: getDeviceId(),
          lat: pos?.lat ?? null,
          lng: pos?.lng ?? null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOkName(data.name);
        setState("done");
      } else {
        setError(data.msg);
        setState("idle");
      }
    } catch {
      setError("Network hiccup — tap the button to try again.");
      setState("idle");
    }
  }

  // Invalid / missing link
  if (!session || !token) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            This link isn't valid. Scan the live QR code on the classroom screen with your phone
            camera.
          </p>
        </div>
      </div>
    );
  }

  // Success state — the moment that reassures the student it worked.
  if (state === "done") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="size-12 text-success" strokeWidth={2.2} />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold text-success">You're marked present</h1>
            <p className="text-foreground">{okName}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Session {session}
            {info?.day ? ` · Day ${info.day}, Class ${info.period}` : ""}. You can put your phone
            away.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header band */}
      <header className="brand-gradient px-6 pb-10 pt-8 text-white">
        <div className="mx-auto max-w-sm">
          <div className="mb-5 flex items-center gap-2 text-white/80">
            <GraduationCap className="size-5" />
            <span className="text-sm font-medium">Employability Readiness</span>
          </div>
          <h1 className="font-heading text-2xl font-bold">Check in to class</h1>
          <p className="mt-1 text-sm text-white/70">
            Session {session}
            {info?.day ? ` · Day ${info.day}, Class ${info.period}` : ""}
            {info?.label ? ` · ${info.label}` : ""}
          </p>
          {info?.professorName && (
            <p className="mt-0.5 text-sm text-white/60">with {info.professorName}</p>
          )}
        </div>
      </header>

      {/* Card overlapping the band */}
      <div className="mx-auto -mt-6 w-full max-w-sm flex-1 px-6">
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <label htmlFor="sid" className="text-sm font-medium">
              Your university ID number
            </label>
            <Input
              id="sid"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 0190123"
              autoFocus
              className="h-14 text-center text-xl tracking-wider"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && state === "idle" && submit()}
            />
          </div>
          <Button className="h-14 w-full text-base" onClick={submit} disabled={state !== "idle"}>
            {state === "submitting" ? "Checking you in…" : "Mark me present"}
          </Button>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              {error}
            </p>
          )}
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            Your phone may ask for location — it confirms you're in the room.
          </p>
        </div>
      </div>
    </div>
  );
}
