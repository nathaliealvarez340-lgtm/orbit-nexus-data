import { redirect } from "next/navigation";

import { InvoicesView } from "@/components/dashboard/invoices-view";
import { isFinanceWorkspaceRole } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";
import { getInvoiceWorkspace } from "@/lib/services/finance/invoices";

export default async function WorkspaceInvoicesPage() {
  const session = await requireSession();

  if (!isFinanceWorkspaceRole(session.role)) {
    redirect("/workspace");
  }

  return <InvoicesView initialData={await getInvoiceWorkspace(session)} session={session} />;
}
