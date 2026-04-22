import type { ReactNode } from "react";

import { ProtectedSessionGuard } from "@/components/auth/protected-session-guard";
import { WorkspaceChatProvider } from "@/components/dashboard/workspace-chat-provider";
import { WorkspaceProjectsProvider } from "@/components/dashboard/workspace-projects-provider";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <WorkspaceProjectsProvider tenantId={session.tenantId}>
      <WorkspaceChatProvider tenantId={session.tenantId} session={session}>
        <ProtectedSessionGuard />
        {children}
      </WorkspaceChatProvider>
    </WorkspaceProjectsProvider>
  );
}
