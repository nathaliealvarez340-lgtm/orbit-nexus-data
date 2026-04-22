import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type OperationsPanelProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function OperationsPanel({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName
}: OperationsPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.8rem] border border-white/10 bg-slate-950/82 shadow-[0_24px_70px_rgba(2,6,23,0.35)]",
        className
      )}
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
