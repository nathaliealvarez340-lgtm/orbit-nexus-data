import type { RegistrableRoleKey } from "@/types/auth";

export type AuthorizedDirectoryRow = {
  fullName: string;
  email: string;
};

export type AuthorizedDirectoryDataset = {
  companyId: string;
  role: Extract<RegistrableRoleKey, "LEADER" | "CONSULTANT">;
  rows: AuthorizedDirectoryRow[];
};

