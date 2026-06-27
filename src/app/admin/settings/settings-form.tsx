"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { Settings } from "@/db/schema";
import { updateSettings } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

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
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setV((s) => ({ ...s, classLat: pos.coords.latitude, classLng: pos.coords.longitude })),
      () => toast.error("Could not read location"),
      { enableHighAccuracy: true },
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="geo">Require geofence</Label>
            <p className="text-xs text-muted-foreground">
              Reject check-ins from outside the classroom radius.
            </p>
          </div>
          <Switch
            id="geo"
            checked={v.requireGeo}
            onCheckedChange={(c) => setV((s) => ({ ...s, requireGeo: c }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Classroom latitude</Label>
            <Input type="number" step="any" value={v.classLat} onChange={(e) => num("classLat", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Classroom longitude</Label>
            <Input type="number" step="any" value={v.classLng} onChange={(e) => num("classLng", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
            Use my current location
          </Button>
          <a
            className="text-sm text-muted-foreground underline"
            href={`https://www.google.com/maps?q=${v.classLat},${v.classLng}`}
            target="_blank"
            rel="noreferrer"
          >
            Preview on Google Maps
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Geofence radius (m)</Label>
            <Input type="number" value={v.geoRadiusM} onChange={(e) => num("geoRadiusM", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Max check-ins per device / session</Label>
            <Input type="number" value={v.maxCheckinsPerDevice} onChange={(e) => num("maxCheckinsPerDevice", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>QR rotation window (s)</Label>
            <Input type="number" value={v.tokenWindowSeconds} onChange={(e) => num("tokenWindowSeconds", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Grace windows (accept previous N)</Label>
            <Input type="number" value={v.tokenGraceWindows} onChange={(e) => num("tokenGraceWindows", e.target.value)} />
          </div>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
