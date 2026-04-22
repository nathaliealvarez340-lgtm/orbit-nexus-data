import { ProjectCreateView } from "@/components/dashboard/project-create-view";
import { requireSession } from "@/lib/auth/session";

export default async function ProjectCreatePage() {
  const session = await requireSession();

  return <ProjectCreateView session={session} />;
}
