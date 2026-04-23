import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { ConsultantDashboard } from "@/components/dashboard/consultant-dashboard";
import { LeaderDashboard } from "@/components/dashboard/leader-dashboard";
import { RoleFallbackDashboard } from "@/components/dashboard/role-fallback-dashboard";
import { SuperadminDashboard } from "@/components/dashboard/superadmin-dashboard";
import { requireSession } from "@/lib/auth/session";
import {
  getClientDashboardMock,
  getConsultantDashboardMock
} from "@/lib/dashboard/mock-data";
import { getCompanySummaryList } from "@/lib/services/admin/company-management";

export default async function WorkspacePage() {
  const session = await requireSession();

  if (session.role === "SUPERADMIN") {
    const companies = await getCompanySummaryList();
    return <SuperadminDashboard session={session} companies={companies} />;
  }

  if (session.role === "LEADER") {
    return <LeaderDashboard session={session} />;
  }

  if (session.role === "CONSULTANT") {
    return <ConsultantDashboard session={session} data={getConsultantDashboardMock(session)} />;
  }

  if (session.role === "CLIENT") {
    return <ClientDashboard session={session} data={getClientDashboardMock(session)} />;
  }

  return <RoleFallbackDashboard session={session} />;
}
