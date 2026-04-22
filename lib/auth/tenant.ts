import { TENANT_ACCESS_DENIED_MESSAGE } from "@/lib/constants";
import { ServiceError } from "@/lib/services/service-error";
import type { SessionUser } from "@/types/auth";

export function getSessionTenantId(session: SessionUser) {
  return session.tenantId ?? session.companyId;
}

export function assertTenantAccess(session: SessionUser, companyId: string | null) {
  if (session.role === "SUPERADMIN") {
    return;
  }

  if (!companyId || getSessionTenantId(session) !== companyId) {
    throw new ServiceError(TENANT_ACCESS_DENIED_MESSAGE, 403);
  }
}

export function scopedCompanyId(session: SessionUser) {
  return session.role === "SUPERADMIN" ? undefined : getSessionTenantId(session);
}

export function scopedTenantId(session: SessionUser) {
  return scopedCompanyId(session);
}
