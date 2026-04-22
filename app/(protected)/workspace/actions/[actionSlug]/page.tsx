import { ActionDetailView } from "@/components/dashboard/action-detail-view";
import { requireSession } from "@/lib/auth/session";

type ActionDetailPageProps = {
  params: Promise<{
    actionSlug: string;
  }>;
  searchParams?: Promise<{
    project?: string | string[];
  }>;
};

export default async function ActionDetailPage({
  params,
  searchParams
}: ActionDetailPageProps) {
  const session = await requireSession();
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const projectSlug = Array.isArray(resolvedSearchParams?.project)
    ? resolvedSearchParams.project[0]
    : resolvedSearchParams?.project;

  return (
    <ActionDetailView
      actionSlug={resolvedParams.actionSlug}
      projectSlug={projectSlug}
      session={session}
    />
  );
}
