import {
  CompanyBillingStatus,
  CompanyPlan,
  Prisma,
  type PrismaClient
} from "@prisma/client";

import { buildQuoteSummary, getPlanDisplayName } from "@/lib/commercial/plans";
import { generateCompanyRegistrationCode } from "@/lib/company-code";
import { normalizeEmail } from "@/lib/normalization";
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

const COMPANY_IDENTIFIER_RETRY_LIMIT = 5;
const CHECKOUT_APP_URL_FALLBACK = "https://orbitne.com";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .trim();
}

async function buildUniqueSlug(
  client: Prisma.TransactionClient | PrismaClient,
  name: string,
  excludeActivationRequestId?: string
) {
  const baseSlug = slugify(name) || "tenant";
  for (let attempt = 0; attempt < COMPANY_IDENTIFIER_RETRY_LIMIT; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const [existingCompany, existingActivation] = await Promise.all([
      client.company.findUnique({
        where: { slug: candidate },
        select: { id: true }
      }),
      client.companyActivationRequest.findFirst({
        where: {
          companySlug: candidate,
          companyId: null,
          ...(excludeActivationRequestId
            ? {
                NOT: {
                  id: excludeActivationRequestId
                }
              }
            : {})
        },
        select: { id: true }
      })
    ]);

    if (!existingCompany && !existingActivation) {
      if (attempt > 0) {
        console.info("[billing/checkout] Resolved slug collision", {
          companyName: name,
          finalSlug: candidate,
          attempts: attempt + 1
        });
      }

      return candidate;
    }

    console.warn("[billing/checkout] Slug collision detected", {
      companyName: name,
      candidate,
      attempt: attempt + 1
    });
  }

  throw new ServiceError(
    "No fue posible generar un identificador interno para la empresa. Intenta nuevamente.",
    409
  );
}

async function buildUniqueCodePrefix(
  client: Prisma.TransactionClient | PrismaClient,
  baseIdentifier: string,
  excludeActivationRequestId?: string
) {
  const basePrefix = slugify(baseIdentifier).replace(/[^a-z0-9-]/g, "") || "tenant";

  for (let attempt = 0; attempt < COMPANY_IDENTIFIER_RETRY_LIMIT; attempt += 1) {
    const candidate = attempt === 0 ? basePrefix : `${basePrefix}-${attempt}`;
    const [existingCompany, existingActivation] = await Promise.all([
      client.company.findUnique({
        where: {
          codePrefix: candidate
        },
        select: {
          id: true
        }
      }),
      client.companyActivationRequest.findFirst({
        where: {
          companyCodePrefix: candidate,
          companyId: null,
          ...(excludeActivationRequestId
            ? {
                NOT: {
                  id: excludeActivationRequestId
                }
              }
            : {})
        },
        select: {
          id: true
        }
      })
    ]);

    if (!existingCompany && !existingActivation) {
      if (attempt > 0) {
        console.info("[billing/checkout] Resolved codePrefix collision", {
          baseIdentifier,
          finalCodePrefix: candidate,
          attempts: attempt + 1
        });
      }

      return candidate;
    }

    console.warn("[billing/checkout] codePrefix collision detected", {
      baseIdentifier,
      candidate,
      attempt: attempt + 1
    });
  }

  throw new ServiceError(
    "No fue posible generar un prefijo interno para la empresa. Intenta nuevamente.",
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
    return `Plan Growth con ${input.includedUsers} usuarios incluidos y ${input.extraUsers} usuarios adicionales.`;
  }

  return "Plan Enterprise con activacion guiada y precio personalizado.";
}

function resolveCheckoutAppUrl() {
  const rawValue =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    CHECKOUT_APP_URL_FALLBACK;

  try {
    return new URL(rawValue).origin.replace(/\/$/, "");
  } catch {
    throw new ServiceError(
      "La configuracion de la plataforma esta incompleta. Define APP_URL o NEXT_PUBLIC_APP_URL.",
      503
    );
  }
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
    const companyCodePrefix = await buildUniqueCodePrefix(tx, companySlug);

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
      activationRequestId: activation.id,
      companySlug: activation.companySlug,
      companyCodePrefix: activation.companyCodePrefix
    };
  }

  let stripe;
  let appUrl: string;

  try {
    stripe = getStripe();
  } catch (error) {
    console.error("[billing/checkout] Stripe initialization failed", {
      companyName,
      plan: input.plan,
      error
    });

    throw new ServiceError(
      "Stripe no está configurado correctamente. Revisa STRIPE_SECRET_KEY.",
      503
    );
  }

  try {
    appUrl = resolveCheckoutAppUrl();
  } catch (error) {
    console.error("[billing/checkout] APP_URL configuration error", {
      companyName,
      plan: input.plan,
      error
    });

    throw new ServiceError(
      "La configuración de la plataforma está incompleta. Define APP_URL o NEXT_PUBLIC_APP_URL.",
      503
    );
  }

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${appUrl}/activation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?activation=cancelled`,
      customer_email: email,
      client_reference_id: activation.id,
      billing_address_collection: "required",
      metadata: {
        activationRequestId: activation.id,
        companyName,
        companySlug: activation.companySlug,
        companyCodePrefix: activation.companyCodePrefix,
        contactName: fullName,
        contactEmail: email,
        sector,
        plan: input.plan,
        includedUsers: String(quote.includedUsers),
        extraUsers: String(quote.extraUsers),
        totalAmountMxn: String(quote.totalAmountMxn),
        totalUsers: String(quote.totalUsers)
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
  } catch (error) {
    console.error("[billing/checkout] Stripe session creation failed", {
      activationRequestId: activation.id,
      companyName,
      plan: input.plan,
      totalAmountMxn: quote.totalAmountMxn,
      error
    });

    throw new ServiceError(
      "Stripe no pudo iniciar el checkout. Revisa logs del servidor.",
      502
    );
  }

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
    companySlug: activation.companySlug,
    companyCodePrefix: activation.companyCodePrefix,
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

  const finalSlug = await buildUniqueSlug(client, activation.companyName, activation.id);
  const finalCodePrefix = await buildUniqueCodePrefix(client, finalSlug, activation.id);
  const registrationCode = await buildUniqueRegistrationCode(client, finalCodePrefix);

  if (
    finalSlug !== activation.companySlug ||
    finalCodePrefix !== activation.companyCodePrefix
  ) {
    console.info("[billing/checkout] Adjusted company identifiers before create", {
      activationRequestId: activation.id,
      previousSlug: activation.companySlug,
      finalSlug,
      previousCodePrefix: activation.companyCodePrefix,
      finalCodePrefix
    });
  }

  const company = await client.company.create({
    data: {
      name: activation.companyName,
      slug: finalSlug,
      codePrefix: finalCodePrefix,
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
      companySlug: finalSlug,
      companyCodePrefix: finalCodePrefix,
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
