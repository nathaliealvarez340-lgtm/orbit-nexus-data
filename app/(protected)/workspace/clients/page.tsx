import { ClientsView } from "@/components/dashboard/clients-view";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceClients } from "@/lib/services/finance/clients";

export default async function WorkspaceClientsPage() {
  const session = await requireSession();
  const clients = await getWorkspaceClients(session);

  return <ClientsView initialClients={clients} session={session} />;
}

