import { redirect } from "next/navigation";

import { LeaderQuotesView } from "@/components/dashboard/leader-quotes-view";
import { canAccessQuotesModule } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceQuotesPage() {
  const session = await requireSession();

  if (!canAccessQuotesModule(session.role)) {
    redirect("/workspace");
  }

  return <LeaderQuotesView session={session} />;
}
