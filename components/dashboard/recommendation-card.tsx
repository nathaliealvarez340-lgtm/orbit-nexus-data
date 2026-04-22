import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardRecommendation } from "@/lib/dashboard/mock-data";

type RecommendationCardProps = {
  recommendation: DashboardRecommendation;
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            {recommendation.eyebrow}
          </p>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              {recommendation.title}
            </h3>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              {recommendation.summary}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={recommendation.primaryAction.href as any}>
              {recommendation.primaryAction.label}
            </Link>
          </Button>

          {recommendation.secondaryAction ? (
            <Button asChild variant="outline">
             <Link href={recommendation.primaryAction.href as any}>
                {recommendation.secondaryAction.label}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}