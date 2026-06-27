"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/session-info?s=${session}&p=${encodeURIComponent(prof)}`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, [session, prof]);

  async function submit() {
    if (!id.trim()) {
      setMsg({ kind: "err", text: "Please enter your Student ID." });
      return;
    }
    setState("submitting");
    setMsg(null);
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
        setMsg({ kind: "ok", text: `✓ Present — ${data.name}` });
        setState("done");
      } else {
        setMsg({ kind: "err", text: data.msg });
        setState("idle");
      }
    } catch {
      setMsg({ kind: "err", text: "Network hiccup — tap submit again." });
      setState("idle");
    }
  }

  if (!session || !token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Invalid link. Please scan the live QR code on the classroom screen.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Attendance Check-in</CardTitle>
        <div className="space-y-1 pt-1">
          <Badge variant="secondary">
            Session {session}
            {info?.day ? ` · Day ${info.day}, Class ${info.period}` : ""}
          </Badge>
          {info?.professorName && (
            <p className="text-sm text-muted-foreground">{info.professorName}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sid">Student ID</Label>
          <Input
            id="sid"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 0190123"
            autoFocus
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && state === "idle" && submit()}
            disabled={state === "done"}
          />
        </div>
        <Button
          className="w-full"
          onClick={submit}
          disabled={state !== "idle"}
        >
          {state === "submitting" ? "Submitting…" : state === "done" ? "Done" : "Mark me present"}
        </Button>
        {msg && (
          <p
            className={
              msg.kind === "ok"
                ? "rounded-md bg-green-100 p-3 text-sm text-green-800"
                : "rounded-md bg-red-100 p-3 text-sm text-red-800"
            }
          >
            {msg.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
