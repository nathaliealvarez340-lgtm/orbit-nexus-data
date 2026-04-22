import { redirect } from "next/navigation";

import { ConsultantChatWorkspace } from "@/components/dashboard/consultant-chat-workspace";
import { LeaderChatWorkspace } from "@/components/dashboard/leader-chat-workspace";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceChatPage() {
  const session = await requireSession();

  if (session.role === "LEADER") {
    return <LeaderChatWorkspace session={session} />;
  }

  if (session.role === "CONSULTANT") {
    return <ConsultantChatWorkspace session={session} />;
  }

  redirect("/workspace");
}
