import { prisma } from "@/lib/prisma";
import {
  CORE_BASE_MXN,
  CORE_EXTRA_USER_MXN,
  GROWTH_MONTHLY_MXN
} from "@/lib/commercial/plans";

export type PricingSettingsSummary = {
  id: string | null;
  coreMonthlyMxn: number;
  growthMonthlyMxn: number;
  extraUserMonthlyMxn: number;
  enterpriseStartingUsd: number;
  updatedByName: string | null;
  updatedAt: string | null;
};

const ENTERPRISE_REFERENCE_USD = 549;

function buildDefaultPricingSettings(): PricingSettingsSummary {
  return {
    id: null,
    coreMonthlyMxn: CORE_BASE_MXN,
    growthMonthlyMxn: GROWTH_MONTHLY_MXN,
    extraUserMonthlyMxn: CORE_EXTRA_USER_MXN,
    enterpriseStartingUsd: ENTERPRISE_REFERENCE_USD,
    updatedByName: null,
    updatedAt: null
  };
}

export async function getPricingSettings() {
  const settings = await prisma.pricingSetting.findFirst({
    orderBy: {
      createdAt: "desc"
    }
  });

  if (!settings) {
    return buildDefaultPricingSettings();
  }

  return {
    id: settings.id,
    coreMonthlyMxn: settings.coreMonthlyMxn,
    growthMonthlyMxn: settings.growthMonthlyMxn,
    extraUserMonthlyMxn: settings.extraUserMonthlyMxn,
    enterpriseStartingUsd: settings.enterpriseStartingUsd,
    updatedByName: settings.updatedByName ?? null,
    updatedAt: settings.updatedAt.toISOString()
  } satisfies PricingSettingsSummary;
}

export async function savePricingSettings(input: {
  coreMonthlyMxn: number;
  growthMonthlyMxn: number;
  extraUserMonthlyMxn: number;
  enterpriseStartingUsd: number;
  updatedByName: string;
}) {
  const current = await prisma.pricingSetting.findFirst({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true
    }
  });

  const settings = current
    ? await prisma.pricingSetting.update({
        where: {
          id: current.id
        },
        data: {
          coreMonthlyMxn: input.coreMonthlyMxn,
          growthMonthlyMxn: input.growthMonthlyMxn,
          extraUserMonthlyMxn: input.extraUserMonthlyMxn,
          enterpriseStartingUsd: input.enterpriseStartingUsd,
          updatedByName: input.updatedByName
        }
      })
    : await prisma.pricingSetting.create({
        data: {
          coreMonthlyMxn: input.coreMonthlyMxn,
          growthMonthlyMxn: input.growthMonthlyMxn,
          extraUserMonthlyMxn: input.extraUserMonthlyMxn,
          enterpriseStartingUsd: input.enterpriseStartingUsd,
          updatedByName: input.updatedByName
        }
      });

  return {
    id: settings.id,
    coreMonthlyMxn: settings.coreMonthlyMxn,
    growthMonthlyMxn: settings.growthMonthlyMxn,
    extraUserMonthlyMxn: settings.extraUserMonthlyMxn,
    enterpriseStartingUsd: settings.enterpriseStartingUsd,
    updatedByName: settings.updatedByName ?? null,
    updatedAt: settings.updatedAt.toISOString()
  } satisfies PricingSettingsSummary;
}
