import { redirect } from "next/navigation";

import { LeaderQuotesView } from "@/components/dashboard/leader-quotes-view";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceQuotesPage() {
  const session = await requireSession();

  if (session.role !== "LEADER") {
    redirect("/workspace");
  }

  return <LeaderQuotesView session={session} />;
}
