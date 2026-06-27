import { CheckinForm } from "./checkin-form";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; p?: string; t?: string }>;
}) {
  const { s, p, t } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <CheckinForm session={s ?? ""} prof={p ?? ""} token={t ?? ""} />
    </div>
  );
}
