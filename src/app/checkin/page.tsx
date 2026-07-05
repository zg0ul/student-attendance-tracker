import { getSessionInfo } from "@/lib/session-info";
import { CheckinForm } from "./checkin-form";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; p?: string; t?: string }>;
}) {
  const { s, p, t } = await searchParams;
  const sessionNumber = Number(s);
  const info =
    s && Number.isFinite(sessionNumber)
      ? await getSessionInfo(sessionNumber, p ?? "")
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <CheckinForm session={s ?? ""} prof={p ?? ""} token={t ?? ""} info={info} />
    </div>
  );
}
