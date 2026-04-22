import { ProjectDetailView } from "@/components/dashboard/project-detail-view";
import { requireSession } from "@/lib/auth/session";

type ProjectDetailPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await requireSession();
  const resolvedParams = await params;

  return <ProjectDetailView projectSlug={resolvedParams.projectSlug} session={session} />;
}
