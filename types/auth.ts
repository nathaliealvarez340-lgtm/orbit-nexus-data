export const APP_ROLE_KEYS = [
  "SUPERADMIN",
  "LEADER",
  "CONSULTANT",
  "CLIENT"
] as const;

export const REGISTRABLE_ROLE_KEYS = ["LEADER", "CONSULTANT", "CLIENT"] as const;

export type AppRoleKey = (typeof APP_ROLE_KEYS)[number];
export type RegistrableRoleKey = (typeof REGISTRABLE_ROLE_KEYS)[number];

export type SessionUser = {
  userId: string;
  tenantId: string | null;
  companyId: string | null;
  role: AppRoleKey;
  accessCode: string;
  fullName: string;
};
