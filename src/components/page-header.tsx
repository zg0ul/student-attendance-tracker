// Title + plain-language explanation shown at the top of each admin section.
export function PageHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 space-y-1.5 border-b pb-5">
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
