import { ServiceError } from "@/lib/services/service-error";
import type { AppRoleKey, SessionUser } from "@/types/auth";

export const EXECUTIVE_WORKSPACE_ROLES: AppRoleKey[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "FINANCE",
  "OPERATIONS",
  "VIEWER",
  "LEADER",
  "CONSULTANT",
  "CLIENT"
];

export const FINANCE_WORKSPACE_ROLES: AppRoleKey[] = [
  "OWNER",
  "ADMIN",
  "FINANCE",
  "LEADER"
];

export const QUOTES_WORKSPACE_ROLES: AppRoleKey[] = [
  "OWNER",
  "ADMIN",
  "FINANCE",
  "MANAGER",
  "LEADER"
];

export const CLIENTS_WORKSPACE_ROLES: AppRoleKey[] = [
  "OWNER",
  "ADMIN",
  "FINANCE",
  "MANAGER",
  "LEADER"
];

export const OPERATIONS_MANAGEMENT_ROLES: AppRoleKey[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "LEADER"
];

export function assertRole(session: SessionUser, allowedRoles: AppRoleKey[]) {
  if (!allowedRoles.includes(session.role)) {
    throw new ServiceError("No tienes permisos para realizar esta accion.", 403);
  }
}

export function isExecutiveWorkspaceRole(role: AppRoleKey) {
  return EXECUTIVE_WORKSPACE_ROLES.includes(role);
}

export function isFinanceWorkspaceRole(role: AppRoleKey) {
  return FINANCE_WORKSPACE_ROLES.includes(role);
}

export function canAccessQuotesModule(role: AppRoleKey) {
  return QUOTES_WORKSPACE_ROLES.includes(role);
}

export function canAccessFinanceModule(role: AppRoleKey) {
  return FINANCE_WORKSPACE_ROLES.includes(role);
}

export function canAccessClientsModule(role: AppRoleKey) {
  return CLIENTS_WORKSPACE_ROLES.includes(role);
}

export function isOwnerOrAdmin(role: AppRoleKey) {
  return role === "OWNER" || role === "ADMIN";
}
