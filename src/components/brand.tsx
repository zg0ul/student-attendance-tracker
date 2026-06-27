import Image from "next/image";

// Wordmark used in headers. `tone="light"` for dark backgrounds (the class stage).
export function Brand({
  tone = "dark",
  subtitle,
}: {
  tone?: "dark" | "light";
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/brand-mark.png" alt="" width={28} height={28} priority className="shrink-0" />
      <div className="leading-tight">
        <div
          className={`font-heading text-[15px] font-bold ${
            tone === "light" ? "text-white" : "text-foreground"
          }`}
        >
          Class Attendance
        </div>
        <div
          className={`text-[11px] ${
            tone === "light" ? "text-white/60" : "text-muted-foreground"
          }`}
        >
          {subtitle ?? "Employability Readiness"}
        </div>
      </div>
    </div>
  );
}
