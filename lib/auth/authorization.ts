import { ServiceError } from "@/lib/services/service-error";
import type { AppRoleKey, SessionUser } from "@/types/auth";

export function assertRole(session: SessionUser, allowedRoles: AppRoleKey[]) {
  if (!allowedRoles.includes(session.role)) {
    throw new ServiceError("No tienes permisos para realizar esta accion.", 403);
  }
}

