import {
  CompanyBillingStatus,
  CompanyPlan,
  Prisma,
  type PrismaClient
} from "@prisma/client";

import { buildQuoteSummary, getPlanDisplayName } from "@/lib/commercial/plans";
import { deriveCompanyCodePrefix, generateCompanyRegistrationCode } from "@/lib/company-code";
import { getAppUrl } from "@/lib/config";
import { normalizeEmail, normalizeName } from "@/lib/normalization";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

type StartCompanyActivationInput = {
  fullName: string;
  email: string;
  companyName: string;
  sector: string;
  plan: CompanyPlan;
  extraUsers?: number;
};

type ActivationRequestRecord = Prisma.CompanyActivationRequestGetPayload<{
  include: {
    company: true;
  };
}>;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .trim();
}

async function buildUniqueSlug(client: Prisma.TransactionClient | PrismaClient, name: string) {
  const baseSlug = slugify(name) || "tenant";
  let candidate = baseSlug;
  let suffix = 1;

  while (
    (await client.company.findUnique({
      where: { slug: candidate },
      select: { id: true }
    })) ||
    (await client.companyActivationRequest.findFirst({
      where: {
        companySlug: candidate,
        companyId: null
      },
      select: { id: true }
    }))
  ) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

async function buildUniqueCodePrefix(
  client: Prisma.TransactionClient | PrismaClient,
  companyName: string
) {
  const normalizedName = companyName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
  const letters = normalizedName.split("").filter(Boolean);
  const fallbackPrefix = deriveCompanyCodePrefix(companyName);
  const candidates = new Set<string>();

  if (fallbackPrefix) {
    candidates.add(fallbackPrefix);
  }

  for (let firstIndex = 0; firstIndex < letters.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < letters.length; secondIndex += 1) {
      candidates.add(`${letters[firstIndex]}${letters[secondIndex]}`);
    }
  }

  candidates.add("NX");

  for (const candidate of candidates) {
    const existsInCompany = await client.company.findUnique({
      where: {
        codePrefix: candidate
      },
      select: {
        id: true
      }
    });

    if (existsInCompany) {
      continue;
    }

    const existsInActivation = await client.companyActivationRequest.findFirst({
      where: {
        companyCodePrefix: candidate,
        companyId: null
      },
      select: {
        id: true
      }
    });

    if (!existsInActivation) {
      return candidate;
    }
  }

  throw new ServiceError(
    "No fue posible reservar un prefijo unico para la empresa. Intenta nuevamente.",
    409
  );
}

async function buildUniqueRegistrationCode(
  client: Prisma.TransactionClient | PrismaClient,
  companyCodePrefix: string
) {
  let candidate = generateCompanyRegistrationCode(companyCodePrefix);

  while (
    await client.company.findFirst({
      where: {
        registrationCode: candidate
      },
      select: {
        id: true
      }
    })
  ) {
    candidate = generateCompanyRegistrationCode(companyCodePrefix);
  }

  return candidate;
}

function buildProductDescription(input: {
  plan: CompanyPlan;
  includedUsers: number;
  extraUsers: number;
}) {
  if (input.plan === "CORE") {
    return `Plan Core con ${input.includedUsers} usuarios incluidos y ${input.extraUsers} usuarios adicionales.`;
  }

  if (input.plan === "GROWTH") {
    return `Plan Growth con capacidad de hasta ${input.includedUsers} usuarios.`;
  }

  return "Plan Enterprise con activacion guiada y precio personalizado.";
}

export async function startCompanyActivation(input: StartCompanyActivationInput) {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const companyName = input.companyName.trim();
  const sector = input.sector.trim();
  const quote = buildQuoteSummary({
    plan: input.plan,
    extraUsers: input.extraUsers
  });

  if (!fullName || !email || !companyName || !sector) {
    throw new ServiceError("Debes completar los datos basicos para cotizar la activacion.", 400);
  }

  const activation = await prisma.$transaction(async (tx) => {
    const companySlug = await buildUniqueSlug(tx, companyName);
    const companyCodePrefix = await buildUniqueCodePrefix(tx, companyName);

    return tx.companyActivationRequest.create({
      data: {
        fullName,
        email,
        companyName,
        sector,
        plan: input.plan,
        includedUsers: quote.includedUsers,
        extraUsers: quote.extraUsers,
        totalAmountMxn: quote.totalAmountMxn,
        status: quote.checkoutEnabled
          ? CompanyBillingStatus.PENDING
          : CompanyBillingStatus.ENTERPRISE_REVIEW,
        companySlug,
        companyCodePrefix
      }
    });
  });

  if (!quote.checkoutEnabled) {
    return {
      mode: "manual-review" as const,
      activationRequestId: activation.id
    };
  }

  let stripe;

  try {
    stripe = getStripe();
  } catch {
    throw new ServiceError(
      "La activacion comercial con Stripe no esta disponible todavia. Configura Stripe antes de continuar.",
      503
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: `${getAppUrl()}/activation/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/?activation=cancelled`,
    customer_email: email,
    billing_address_collection: "required",
    metadata: {
      activationRequestId: activation.id,
      companyName,
      plan: input.plan
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "mxn",
          unit_amount: quote.totalAmountMxn * 100,
          recurring: {
            interval: "month"
          },
          product_data: {
            name: `Orbit Nexus ${getPlanDisplayName(input.plan)}`,
            description: buildProductDescription({
              plan: input.plan,
              includedUsers: quote.includedUsers,
              extraUsers: quote.extraUsers
            })
          }
        }
      }
    ]
  });

  await prisma.companyActivationRequest.update({
    where: {
      id: activation.id
    },
    data: {
      stripeCheckoutSessionId: session.id
    }
  });

  return {
    mode: "checkout" as const,
    activationRequestId: activation.id,
    checkoutUrl: session.url,
    sessionId: session.id
  };
}

async function ensureCompanyFromActivation(
  client: Prisma.TransactionClient | PrismaClient,
  activation: ActivationRequestRecord,
  stripeSession?: Stripe.Checkout.Session,
  nextStatus?: CompanyBillingStatus
) {
  if (activation.company) {
    if (nextStatus) {
      await client.company.update({
        where: {
          id: activation.company.id
        },
        data: {
          billingStatus: nextStatus,
          stripeCustomerId:
            typeof stripeSession?.customer === "string"
              ? stripeSession.customer
              : activation.stripeCustomerId ?? activation.company.stripeCustomerId,
          stripeSubscriptionId:
            typeof stripeSession?.subscription === "string"
              ? stripeSession.subscription
              : activation.stripeSubscriptionId ?? activation.company.stripeSubscriptionId,
          stripeCheckoutSessionId: stripeSession?.id ?? activation.stripeCheckoutSessionId,
          activatedAt:
            nextStatus === CompanyBillingStatus.ACTIVE
              ? activation.company.activatedAt ?? new Date()
              : activation.company.activatedAt
        }
      });
    }

    return activation.company;
  }

  const registrationCode = await buildUniqueRegistrationCode(client, activation.companyCodePrefix);
  const company = await client.company.create({
    data: {
      name: activation.companyName,
      slug: activation.companySlug,
      codePrefix: activation.companyCodePrefix,
      registrationCode,
      isActive: true,
      sector: activation.sector,
      contactName: activation.fullName,
      contactEmail: activation.email,
      subscriptionPlan: activation.plan,
      includedUsers: activation.includedUsers,
      extraUsers: activation.extraUsers,
      monthlyAmountMxn: activation.totalAmountMxn,
      billingStatus: nextStatus ?? activation.status,
      stripeCustomerId:
        typeof stripeSession?.customer === "string" ? stripeSession.customer : activation.stripeCustomerId,
      stripeSubscriptionId:
        typeof stripeSession?.subscription === "string"
          ? stripeSession.subscription
          : activation.stripeSubscriptionId,
      stripeCheckoutSessionId: stripeSession?.id ?? activation.stripeCheckoutSessionId,
      activatedAt: nextStatus === CompanyBillingStatus.ACTIVE ? new Date() : null
    }
  });

  await client.companyActivationRequest.update({
    where: {
      id: activation.id
    },
    data: {
      companyId: company.id,
      registrationCode,
      status: nextStatus ?? activation.status,
      stripeCustomerId:
        typeof stripeSession?.customer === "string" ? stripeSession.customer : activation.stripeCustomerId,
      stripeSubscriptionId:
        typeof stripeSession?.subscription === "string"
          ? stripeSession.subscription
          : activation.stripeSubscriptionId,
      stripeCheckoutSessionId: stripeSession?.id ?? activation.stripeCheckoutSessionId
    }
  });

  return company;
}

async function findActivationForCheckoutSession(session: Stripe.Checkout.Session) {
  const activationRequestId = session.metadata?.activationRequestId;

  if (activationRequestId) {
    return prisma.companyActivationRequest.findUnique({
      where: {
        id: activationRequestId
      },
      include: {
        company: true
      }
    });
  }

  return prisma.companyActivationRequest.findFirst({
    where: {
      stripeCheckoutSessionId: session.id
    },
    include: {
      company: true
    }
  });
}

export async function handleStripeCheckoutCompleted(session: Stripe.Checkout.Session) {
  const activation = await findActivationForCheckoutSession(session);

  if (!activation) {
    throw new ServiceError("No encontramos una activacion asociada al checkout completado.", 404);
  }

  const nextStatus =
    session.payment_status === "paid" ? CompanyBillingStatus.ACTIVE : CompanyBillingStatus.INCOMPLETE;

  await prisma.$transaction(async (tx) => {
    await ensureCompanyFromActivation(tx, activation, session, nextStatus);
  });
}

export async function handleStripeInvoicePaid(invoice: Stripe.Invoice) {
  const invoiceRecord = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  };
  const subscriptionId =
    typeof invoiceRecord.subscription === "string"
      ? invoiceRecord.subscription
      : invoiceRecord.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const activation = await prisma.companyActivationRequest.findFirst({
    where: {
      OR: [
        {
          stripeSubscriptionId: subscriptionId
        },
        {
          stripeCustomerId:
            typeof invoiceRecord.customer === "string"
              ? invoiceRecord.customer
              : invoiceRecord.customer?.id
        }
      ]
    },
    include: {
      company: true
    }
  });

  if (!activation) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const company = await ensureCompanyFromActivation(tx, activation, undefined, CompanyBillingStatus.ACTIVE);

    await tx.company.update({
      where: {
        id: company.id
      },
      data: {
        billingStatus: CompanyBillingStatus.ACTIVE,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId:
          typeof invoiceRecord.customer === "string"
            ? invoiceRecord.customer
            : invoiceRecord.customer?.id,
        activatedAt: company.activatedAt ?? new Date()
      }
    });

    await tx.companyActivationRequest.update({
      where: {
        id: activation.id
      },
      data: {
        status: CompanyBillingStatus.ACTIVE,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId:
          typeof invoiceRecord.customer === "string"
            ? invoiceRecord.customer
            : invoiceRecord.customer?.id
      }
    });
  });
}

export async function getActivationStatusBySessionId(sessionId: string) {
  const activation = await prisma.companyActivationRequest.findFirst({
    where: {
      stripeCheckoutSessionId: sessionId
    },
    include: {
      company: true
    }
  });

  if (!activation) {
    throw new ServiceError("No encontramos una activacion asociada a esta sesion.", 404);
  }

  return {
    companyName: activation.companyName,
    plan: activation.plan,
    totalAmountMxn: activation.totalAmountMxn,
    status: activation.status,
    contactEmail: activation.email,
    registrationCode: activation.registrationCode ?? activation.company?.registrationCode ?? null,
    companyReady: Boolean(activation.companyId && activation.company),
    companyId: activation.companyId ?? null
  };
}
