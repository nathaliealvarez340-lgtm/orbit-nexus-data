type CompanyPlan = "CORE" | "GROWTH" | "ENTERPRISE";

export const CORE_INCLUDED_USERS = 20;
export const CORE_BASE_MXN = 5200;
export const CORE_EXTRA_USER_MXN = 299;
export const CORE_MAX_EXTRA_USERS = 10;
export const GROWTH_MAX_USERS = 50;
export const GROWTH_MONTHLY_MXN = 12900;

export type QuoteInput = {
  plan: CompanyPlan;
  extraUsers?: number;
};

export type QuoteSummary = {
  plan: CompanyPlan;
  includedUsers: number;
  extraUsers: number;
  totalUsers: number;
  baseAmountMxn: number;
  extraAmountMxn: number;
  totalAmountMxn: number;
  checkoutEnabled: boolean;
};

export function buildQuoteSummary(input: QuoteInput): QuoteSummary {
  if (input.plan === "CORE") {
    const extraUsers = Math.max(0, Math.min(CORE_MAX_EXTRA_USERS, input.extraUsers ?? 0));
    const extraAmountMxn = extraUsers * CORE_EXTRA_USER_MXN;

    return {
      plan: input.plan,
      includedUsers: CORE_INCLUDED_USERS,
      extraUsers,
      totalUsers: CORE_INCLUDED_USERS + extraUsers,
      baseAmountMxn: CORE_BASE_MXN,
      extraAmountMxn,
      totalAmountMxn: CORE_BASE_MXN + extraAmountMxn,
      checkoutEnabled: true
    };
  }

  if (input.plan === "GROWTH") {
    return {
      plan: input.plan,
      includedUsers: GROWTH_MAX_USERS,
      extraUsers: 0,
      totalUsers: GROWTH_MAX_USERS,
      baseAmountMxn: GROWTH_MONTHLY_MXN,
      extraAmountMxn: 0,
      totalAmountMxn: GROWTH_MONTHLY_MXN,
      checkoutEnabled: true
    };
  }

  return {
    plan: input.plan,
    includedUsers: 50,
    extraUsers: 0,
    totalUsers: 50,
    baseAmountMxn: 0,
    extraAmountMxn: 0,
    totalAmountMxn: 0,
    checkoutEnabled: false
  };
}

export function getPlanDisplayName(plan: CompanyPlan) {
  switch (plan) {
    case "CORE":
      return "Core";
    case "GROWTH":
      return "Growth";
    case "ENTERPRISE":
      return "Enterprise";
    default:
      return plan;
  }
}