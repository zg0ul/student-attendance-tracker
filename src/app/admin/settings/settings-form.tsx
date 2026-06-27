"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { MapPin, QrCode } from "lucide-react";
import type { Settings } from "@/db/schema";
import { updateSettings } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const MapPicker = dynamic(
  () => import("@/components/map-picker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);

  function num(key: keyof Settings, value: string) {
    setV((s) => ({ ...s, [key]: value === "" ? 0 : Number(value) }));
  }

  async function save() {
    setSaving(true);
    const res = await updateSettings({
      requireGeo: v.requireGeo,
      classLat: v.classLat,
      classLng: v.classLng,
      geoRadiusM: v.geoRadiusM,
      tokenWindowSeconds: v.tokenWindowSeconds,
      tokenGraceWindows: v.tokenGraceWindows,
      maxCheckinsPerDevice: v.maxCheckinsPerDevice,
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved");
    else toast.error(res.error);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Location isn't available on this device");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setV((s) => ({ ...s, classLat: pos.coords.latitude, classLng: pos.coords.longitude }));
        toast.success("Location set to where you are now");
      },
      () => toast.error("Couldn't read your location"),
      { enableHighAccuracy: true },
    );
  }

  return (
    <div className="space-y-6">
      {/* Location */}
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <MapPin className="size-4.5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">Classroom location</h2>
            <p className="text-sm text-muted-foreground">
              When this is on, students can only check in if their phone is inside the room. Drop a
              pin on your classroom below, or open it inside the room and tap "Use my location".
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
          <Label htmlFor="geo" className="cursor-pointer">
            Require students to be in the room
          </Label>
          <Switch
            id="geo"
            checked={v.requireGeo}
            onCheckedChange={(c) => setV((s) => ({ ...s, requireGeo: c }))}
          />
        </div>

        <MapPicker
          lat={v.classLat}
          lng={v.classLng}
          onPick={(lat, lng) => setV((s) => ({ ...s, classLat: lat, classLng: lng }))}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
            Use my location
          </Button>
          <span className="text-xs text-muted-foreground">
            Pin: {v.classLat.toFixed(5)}, {v.classLng.toFixed(5)}
          </span>
        </div>

        <div className="mt-4 max-w-xs">
          <Field
            label="Allowed distance from the pin"
            hint="How far from the pin a check-in still counts. 200 m is a good default."
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={v.geoRadiusM}
                onChange={(e) => num("geoRadiusM", e.target.value)}
              />
              <span className="text-sm text-muted-foreground">metres</span>
            </div>
          </Field>
        </div>
      </section>

      {/* QR / anti-cheating */}
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <QrCode className="size-4.5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">QR code & anti-cheating</h2>
            <p className="text-sm text-muted-foreground">
              The on-screen code changes on a timer so a screenshot stops working. These are sensible
              by default — only change them if you know you need to.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Code changes every"
            hint="Lower = harder to share a screenshot, but scanners must be quick."
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={v.tokenWindowSeconds}
                onChange={(e) => num("tokenWindowSeconds", e.target.value)}
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </Field>
          <Field
            label="Grace period"
            hint="Also accept the previous code, for slow phones. 1 is fine."
          >
            <Input
              type="number"
              value={v.tokenGraceWindows}
              onChange={(e) => num("tokenGraceWindows", e.target.value)}
            />
          </Field>
          <Field
            label="Check-ins allowed per phone"
            hint="Keep at 1 so one phone can't mark several people present."
          >
            <Input
              type="number"
              value={v.maxCheckinsPerDevice}
              onChange={(e) => num("maxCheckinsPerDevice", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <Button onClick={save} disabled={saving} size="lg">
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
