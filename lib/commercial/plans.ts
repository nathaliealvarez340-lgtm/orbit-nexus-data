type CompanyPlan = "CORE" | "GROWTH" | "ENTERPRISE";

export const CORE_INCLUDED_USERS = 15;
export const CORE_BASE_MXN = 830;
export const CORE_EXTRA_USER_MXN = 279;
export const CORE_MAX_EXTRA_USERS = 10;
export const GROWTH_MAX_USERS = 40;
export const GROWTH_MONTHLY_MXN = 2390;

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
    const extraUsers = Math.max(0, Math.min(CORE_MAX_EXTRA_USERS, input.extraUsers ?? 0));
    const extraAmountMxn = extraUsers * CORE_EXTRA_USER_MXN;

    return {
      plan: input.plan,
      includedUsers: GROWTH_MAX_USERS,
      extraUsers,
      totalUsers: GROWTH_MAX_USERS + extraUsers,
      baseAmountMxn: GROWTH_MONTHLY_MXN,
      extraAmountMxn,
      totalAmountMxn: GROWTH_MONTHLY_MXN + extraAmountMxn,
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
