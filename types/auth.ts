export const APP_ROLE_KEYS = [
  "SUPERADMIN",
  "OWNER",
  "ADMIN",
  "MANAGER",
  "FINANCE",
  "OPERATIONS",
  "VIEWER",
  "LEADER",
  "CONSULTANT",
  "CLIENT"
] as const;

export const EXECUTIVE_ROLE_KEYS = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "FINANCE",
  "OPERATIONS",
  "VIEWER"
] as const;

export const EXECUTIVE_OPERATOR_ROLE_KEYS = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "OPERATIONS"
] as const;

export const FINANCE_ROLE_KEYS = ["OWNER", "ADMIN", "FINANCE"] as const;

export const REGISTRABLE_ROLE_KEYS = ["LEADER", "CONSULTANT", "CLIENT"] as const;

export type AppRoleKey = (typeof APP_ROLE_KEYS)[number];
export type ExecutiveRoleKey = (typeof EXECUTIVE_ROLE_KEYS)[number];
export type RegistrableRoleKey = (typeof REGISTRABLE_ROLE_KEYS)[number];

export type SessionUser = {
  userId: string;
  tenantId: string | null;
  companyId: string | null;
  role: AppRoleKey;
  accessCode: string;
  fullName: string;
};
