import { ExecutiveCommandCenter } from "@/components/dashboard/executive-command-center";
import { RoleFallbackDashboard } from "@/components/dashboard/role-fallback-dashboard";
import { SuperadminDashboard } from "@/components/dashboard/superadmin-dashboard";
import { isExecutiveWorkspaceRole } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";
import { getSuperadminDashboardData } from "@/lib/services/admin/company-management";
import { getExecutiveCommandCenterData } from "@/lib/services/executive/command-center";

export default async function WorkspacePage() {
  const session = await requireSession();

  if (session.role === "SUPERADMIN") {
    const { companies, overview, activationRequests, supportTickets, pricingSettings } =
      await getSuperadminDashboardData();
    return (
      <SuperadminDashboard
        session={session}
        companies={companies}
        overview={overview}
        activationRequests={activationRequests}
        supportTickets={supportTickets}
        pricingSettings={pricingSettings}
      />
    );
  }

  if (isExecutiveWorkspaceRole(session.role)) {
    return (
      <ExecutiveCommandCenter
        data={await getExecutiveCommandCenterData(session)}
        session={session}
      />
    );
  }

  return <RoleFallbackDashboard session={session} />;
}
