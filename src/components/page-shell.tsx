import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function AiDisclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        AI outputs may be inaccurate. Review before sending. Do not share confidential information.
      </span>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>;
}
