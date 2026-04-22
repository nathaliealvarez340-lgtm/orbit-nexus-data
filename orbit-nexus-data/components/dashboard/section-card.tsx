import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
  contentClassName
}: SectionCardProps) {
  return (
    <Card className={cn("border-white/90 bg-white/92", className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                {eyebrow}
              </p>
            ) : null}
            <div className="space-y-1">
              <CardTitle className="text-2xl text-slate-950">{title}</CardTitle>
              {description ? <CardDescription className="text-sm leading-6">{description}</CardDescription> : null}
            </div>
          </div>

          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </CardHeader>

      <CardContent className={cn("p-6 pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
