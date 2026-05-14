import { redirect } from "next/navigation";

import { ConsultantRegisterView } from "@/components/dashboard/consultant-register-view";
import { OPERATIONS_MANAGEMENT_ROLES } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";

export default async function ConsultantRegisterPage() {
  const session = await requireSession();

  if (!OPERATIONS_MANAGEMENT_ROLES.includes(session.role)) {
    redirect("/workspace");
  }

  return <ConsultantRegisterView session={session} />;
}
