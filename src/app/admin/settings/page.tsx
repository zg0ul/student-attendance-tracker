import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const cfg = await getSettings();
  return (
    <div>
      <PageHeader title="Settings">
        Control how check-in works: where students must be standing, and how the QR code protects
        against sharing. These apply to every class.
      </PageHeader>
      <SettingsForm initial={cfg} />
    </div>
  );
}
