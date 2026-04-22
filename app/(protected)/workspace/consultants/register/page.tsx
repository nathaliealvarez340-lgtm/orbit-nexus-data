import { ConsultantRegisterView } from "@/components/dashboard/consultant-register-view";
import { requireSession } from "@/lib/auth/session";

export default async function ConsultantRegisterPage() {
  const session = await requireSession();

  return <ConsultantRegisterView session={session} />;
}
