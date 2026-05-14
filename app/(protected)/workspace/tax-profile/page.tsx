import { TaxProfileView } from "@/components/dashboard/tax-profile-view";
import { requireSession } from "@/lib/auth/session";
import { getTaxProfile } from "@/lib/services/finance/tax-profile";

export default async function WorkspaceTaxProfilePage() {
  const session = await requireSession();
  const profile = await getTaxProfile(session);

  return <TaxProfileView initialProfile={profile} session={session} />;
}

