import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const cfg = await getSettings();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Geofence & QR settings</h1>
      <SettingsForm initial={cfg} />
    </div>
  );
}
