import { CheckinForm } from "./checkin-form";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; p?: string; t?: string }>;
}) {
  const { s, p, t } = await searchParams;
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 p-4">
      <CheckinForm session={s ?? ""} prof={p ?? ""} token={t ?? ""} />
    </div>
  );
}
