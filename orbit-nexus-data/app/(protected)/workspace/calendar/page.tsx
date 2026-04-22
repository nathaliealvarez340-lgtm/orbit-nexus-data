import { redirect } from "next/navigation";

import { ConsultantCalendarWorkspace } from "@/components/dashboard/consultant-calendar-workspace";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceCalendarPage() {
  const session = await requireSession();

  if (session.role !== "CONSULTANT") {
    redirect("/workspace");
  }

  return <ConsultantCalendarWorkspace session={session} />;
}
