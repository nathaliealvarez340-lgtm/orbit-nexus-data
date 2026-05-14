import {
  Prisma,
  ActivityLogType,
  AlertLifecycleStatus,
  AlertSeverity,
  AutomationStatus,
  AutomationTriggerType,
  IntegrationStatus,
  InvoiceStatus,
  MetricTrend,
  OrganizationAccessType,
  ProjectPriority,
  ProjectStatus,
  QuoteClientType,
  QuoteComplexity,
  QuoteInvoiceStatus,
  QuoteStatus,
  QuoteUrgency,
  ReportType,
  RoleKey,
  TaskPriority,
  TaskStatus,
  TeamStatus,
  UserStatus
} from "@prisma/client";

import { CORE_BASE_MXN, CORE_INCLUDED_USERS } from "../lib/commercial/plans";
import {
  getDefaultCompanySeed,
  getDemoProjectFolio,
  getSuperadminSeed,
  getUsableSeedAccounts,
  shouldSeedDemoProject
} from "../lib/config";
import { generateUniqueAccessCode } from "../lib/access-code";
import {
  consultantDirectoryUsers,
  leaderDirectoryUsers,
  type AuthorizedDirectoryUser
} from "../lib/directory/authorized-users";
import { normalizeName } from "../lib/normalization";
import { hashPassword } from "../lib/password";
import { prisma } from "../lib/prisma";

function asJson(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

async function seedRoles() {
  const roles: Array<{ key: RoleKey; name: string; description: string }> = [
    {
      key: "SUPERADMIN",
      name: "Superadmin",
      description: "Acceso global a la plataforma y gestion de empresas."
    },
    {
      key: "OWNER",
      name: "Owner",
      description: "Acceso propietario al sistema operativo ejecutivo de la organizacion."
    },
    {
      key: "ADMIN",
      name: "Admin",
      description: "Administra usuarios, configuracion y operacion de la organizacion."
    },
    {
      key: "MANAGER",
      name: "Manager",
      description: "Coordina proyectos, tareas, equipos y prioridades operativas."
    },
    {
      key: "FINANCE",
      name: "Finance",
      description: "Gestiona cotizaciones, facturas internas y control financiero."
    },
    {
      key: "OPERATIONS",
      name: "Operations",
      description: "Opera proyectos, tareas, alertas y seguimiento ejecutivo."
    },
    {
      key: "VIEWER",
      name: "Viewer",
      description: "Consulta reportes, metricas y actividad sin permisos administrativos."
    },
    {
      key: "LEADER",
      name: "Lider",
      description: "Gestiona proyectos, consultores, incidencias y auditorias."
    },
    {
      key: "CONSULTANT",
      name: "Consultor",
      description: "Recibe proyectos, entrega avances y colabora con clientes."
    },
    {
      key: "CLIENT",
      name: "Cliente",
      description: "Consulta avances, comenta entregables y participa en el proyecto."
    }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description
      },
      create: role
    });
  }
}

async function seedDefaultCompany() {
  const company = getDefaultCompanySeed();

  return prisma.company.upsert({
    where: { slug: company.slug },
    update: {
      name: company.name,
      codePrefix: company.codePrefix,
      registrationCode: company.registrationCode,
      isActive: true,
      subscriptionPlan: "CORE",
      includedUsers: CORE_INCLUDED_USERS,
      extraUsers: 0,
      monthlyAmountMxn: CORE_BASE_MXN,
      billingStatus: "ACTIVE",
      activatedAt: new Date()
    },
    create: {
      name: company.name,
      slug: company.slug,
      codePrefix: company.codePrefix,
      registrationCode: company.registrationCode,
      isActive: true,
      subscriptionPlan: "CORE",
      includedUsers: CORE_INCLUDED_USERS,
      extraUsers: 0,
      monthlyAmountMxn: CORE_BASE_MXN,
      billingStatus: "ACTIVE",
      activatedAt: new Date()
    }
  });
}

async function seedSuperadmin() {
  const role = await prisma.role.findUniqueOrThrow({
    where: { key: "SUPERADMIN" }
  });

  const seed = getSuperadminSeed();
  const passwordHash = await hashPassword(seed.password);

  await prisma.user.upsert({
    where: {
      accessCode: seed.accessCode
    },
    update: {
      roleId: role.id,
      fullName: seed.name,
      normalizedFullName: normalizeName(seed.name),
      email: seed.email.trim().toLowerCase(),
      phone: seed.phone,
      passwordHash,
      status: "ACTIVE",
      registeredAt: new Date()
    },
    create: {
      roleId: role.id,
      fullName: seed.name,
      normalizedFullName: normalizeName(seed.name),
      email: seed.email.trim().toLowerCase(),
      phone: seed.phone,
      passwordHash,
      accessCode: seed.accessCode,
      status: "ACTIVE",
      registeredAt: new Date()
    }
  });
}

async function seedMaiaOwner() {
  const role = await prisma.role.findUniqueOrThrow({
    where: { key: "OWNER" }
  });
  const passwordHash = await hashPassword("MAIA1234!");
  const company = await prisma.company.upsert({
    where: { slug: "maia" },
    update: {
      name: "MAIA",
      codePrefix: "MAIA",
      registrationCode: "MAIA-OWNER-2026",
      isActive: true,
      contactName: "Nathalie / Admin MAIA",
      contactEmail: "admin@maia.local",
      ownerContactEmail: "admin@maia.local",
      authorizedEmailDomain: "maia.local",
      organizationAccessType: OrganizationAccessType.COMPANY,
      subscriptionPlan: "CORE",
      includedUsers: CORE_INCLUDED_USERS,
      extraUsers: 0,
      monthlyAmountMxn: CORE_BASE_MXN,
      billingStatus: "ACTIVE",
      activatedAt: new Date()
    },
    create: {
      name: "MAIA",
      slug: "maia",
      codePrefix: "MAIA",
      registrationCode: "MAIA-OWNER-2026",
      isActive: true,
      contactName: "Nathalie / Admin MAIA",
      contactEmail: "admin@maia.local",
      ownerContactEmail: "admin@maia.local",
      authorizedEmailDomain: "maia.local",
      organizationAccessType: OrganizationAccessType.COMPANY,
      subscriptionPlan: "CORE",
      includedUsers: CORE_INCLUDED_USERS,
      extraUsers: 0,
      monthlyAmountMxn: CORE_BASE_MXN,
      billingStatus: "ACTIVE",
      activatedAt: new Date()
    }
  });

  const user = await prisma.user.upsert({
    where: {
      accessCode: "MAIA-001234"
    },
    update: {
      companyId: company.id,
      roleId: role.id,
      fullName: "Nathalie / Admin MAIA",
      normalizedFullName: normalizeName("Nathalie / Admin MAIA"),
      email: "admin@maia.local",
      phone: "+520000000000",
      passwordHash,
      status: UserStatus.ACTIVE,
      disabledAt: null,
      registeredAt: new Date()
    },
    create: {
      companyId: company.id,
      roleId: role.id,
      fullName: "Nathalie / Admin MAIA",
      normalizedFullName: normalizeName("Nathalie / Admin MAIA"),
      email: "admin@maia.local",
      phone: "+520000000000",
      passwordHash,
      accessCode: "MAIA-001234",
      status: UserStatus.ACTIVE,
      registeredAt: new Date()
    }
  });

  await prisma.activityLog.upsert({
    where: {
      id: "seed-maia-owner-activity"
    },
    update: {
      companyId: company.id,
      userId: user.id,
      title: "Cuenta owner MAIA lista",
      description:
        "La cuenta interna MAIA quedo preparada para validar acceso completo al sistema operativo ejecutivo."
    },
    create: {
      id: "seed-maia-owner-activity",
      companyId: company.id,
      userId: user.id,
      type: ActivityLogType.SYSTEM,
      title: "Cuenta owner MAIA lista",
      description:
        "La cuenta interna MAIA quedo preparada para validar acceso completo al sistema operativo ejecutivo.",
      routePath: "/workspace"
    }
  });

  return {
    company,
    user
  };
}

async function seedAuthorizedDirectoryUsers(params: {
  companyId: string;
  roleKey: RoleKey;
  users: AuthorizedDirectoryUser[];
}) {
  const { companyId, roleKey, users } = params;

  const role = await prisma.role.findUniqueOrThrow({
    where: { key: roleKey }
  });

  for (const user of users) {
    const normalizedFullName = normalizeName(user.fullName);
    const normalizedEmail = user.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: {
        companyId_roleId_email: {
          companyId,
          roleId: role.id,
          email: normalizedEmail
        }
      }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          companyId,
          roleId: role.id,
          fullName: user.fullName.trim(),
          normalizedFullName,
          email: normalizedEmail,
          phone: user.phone?.trim() || null,
          importedFromDirectory: true,
          directorySyncedAt: new Date(),
          status: UserStatus.PENDING_REGISTRATION
        }
      });
      continue;
    }

    await prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        fullName: user.fullName.trim(),
        normalizedFullName,
        email: normalizedEmail,
        phone: user.phone?.trim() || null,
        importedFromDirectory: true,
        directorySyncedAt: new Date(),
        companyId,
        roleId: role.id,
        ...(existingUser.status === UserStatus.PENDING_REGISTRATION
          ? {
              status: UserStatus.PENDING_REGISTRATION,
              accessCode: null,
              passwordHash: null,
              registeredAt: null,
              disabledAt: null,
              createdByLeaderId: null
            }
          : {})
      }
    });
  }
}

async function seedUsableDirectoryAccount(params: {
  companyId: string;
  companyCodePrefix: string;
  roleKey: Extract<RoleKey, "LEADER" | "CONSULTANT">;
  user: AuthorizedDirectoryUser;
  requestedAccessCode: string;
  password: string;
}) {
  const { companyId, companyCodePrefix, roleKey, user, requestedAccessCode, password } = params;
  const role = await prisma.role.findUniqueOrThrow({
    where: { key: roleKey }
  });
  const normalizedEmail = user.email.trim().toLowerCase();
  const normalizedFullName = normalizeName(user.fullName);
  const existingUser = await prisma.user.findUnique({
    where: {
      companyId_roleId_email: {
        companyId,
        roleId: role.id,
        email: normalizedEmail
      }
    }
  });

  if (!existingUser) {
    return;
  }

  const passwordHash = await hashPassword(password);
  let accessCode = requestedAccessCode;

  const userWithRequestedAccessCode = await prisma.user.findUnique({
    where: {
      accessCode: requestedAccessCode
    },
    select: {
      id: true
    }
  });

  if (userWithRequestedAccessCode && userWithRequestedAccessCode.id !== existingUser.id) {
    accessCode = await generateUniqueAccessCode(prisma, roleKey, companyCodePrefix);
  }

  await prisma.user.update({
    where: {
      id: existingUser.id
    },
    data: {
      companyId,
      roleId: role.id,
      fullName: user.fullName.trim(),
      normalizedFullName,
      email: normalizedEmail,
      phone: user.phone?.trim() || null,
      importedFromDirectory: true,
      accessCode,
      passwordHash,
      status: UserStatus.ACTIVE,
      disabledAt: null,
      registeredAt: existingUser.registeredAt ?? new Date()
    }
  });
}

async function seedDemoProject(companyId: string) {
  if (!shouldSeedDemoProject()) {
    return;
  }

  await prisma.project.upsert({
    where: {
      folio: getDemoProjectFolio()
    },
    update: {
      companyId,
      name: "Proyecto demo de onboarding",
      description: "Proyecto base para validar el registro de clientes en Fase 1.",
      durationLabel: "4 semanas",
      clientContactName: "Direccion Operativa NTT DATA",
      clientContactEmail: "cliente.demo@orbitnexus.local",
      status: "READY_FOR_MATCHING"
    },
    create: {
      companyId,
      name: "Proyecto demo de onboarding",
      description: "Proyecto base para validar el registro de clientes en Fase 1.",
      durationLabel: "4 semanas",
      folio: getDemoProjectFolio(),
      clientContactName: "Direccion Operativa NTT DATA",
      clientContactEmail: "cliente.demo@orbitnexus.local",
      priority: "MEDIUM",
      status: "READY_FOR_MATCHING"
    }
  });
}

function addDays(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

async function upsertExecutiveProject(params: {
  companyId: string;
  leaderId?: string | null;
  folio: string;
  name: string;
  description: string;
  durationLabel: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  clientContactName: string;
  clientContactEmail: string;
  requirements: Record<string, unknown>;
}) {
  const {
    companyId,
    leaderId,
    folio,
    name,
    description,
    durationLabel,
    status,
    priority,
    startDate,
    endDate,
    clientContactName,
    clientContactEmail,
    requirements
  } = params;

  return prisma.project.upsert({
    where: { folio },
    update: {
      companyId,
      leaderId: leaderId ?? null,
      name,
      description,
      durationLabel,
      startDate,
      endDate,
      status,
      priority,
      clientContactName,
      clientContactEmail,
      requirements: asJson(requirements)
    },
    create: {
      companyId,
      leaderId: leaderId ?? null,
      folio,
      name,
      description,
      durationLabel,
      startDate,
      endDate,
      status,
      priority,
      clientContactName,
      clientContactEmail,
      requirements: asJson(requirements)
    }
  });
}

async function upsertExecutiveTeam(params: {
  companyId: string;
  ownerUserId?: string | null;
  name: string;
  slug: string;
  description: string;
}) {
  const { companyId, ownerUserId, name, slug, description } = params;

  return prisma.team.upsert({
    where: {
      companyId_slug: {
        companyId,
        slug
      }
    },
    update: {
      ownerUserId: ownerUserId ?? null,
      name,
      description,
      status: TeamStatus.ACTIVE
    },
    create: {
      companyId,
      ownerUserId: ownerUserId ?? null,
      name,
      slug,
      description,
      status: TeamStatus.ACTIVE
    }
  });
}

async function upsertExecutiveTeamMember(params: {
  companyId: string;
  teamId: string;
  userId: string;
  title: string;
}) {
  const { companyId, teamId, userId, title } = params;

  return prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId,
        userId
      }
    },
    update: {
      title
    },
    create: {
      companyId,
      teamId,
      userId,
      title
    }
  });
}

async function upsertExecutiveTask(params: {
  companyId: string;
  projectId?: string | null;
  teamId?: string | null;
  ownerUserId?: string | null;
  assigneeUserId?: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercent: number;
  riskScore: number;
  dueAt?: Date | null;
  metadata?: Record<string, unknown>;
}) {
  const existingTask = await prisma.task.findFirst({
    where: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      title: params.title
    }
  });

  if (existingTask) {
    return prisma.task.update({
      where: { id: existingTask.id },
      data: {
        teamId: params.teamId ?? null,
        ownerUserId: params.ownerUserId ?? null,
        assigneeUserId: params.assigneeUserId ?? null,
        description: params.description,
        status: params.status,
        priority: params.priority,
        progressPercent: params.progressPercent,
        riskScore: params.riskScore,
        dueAt: params.dueAt ?? null,
        metadata: asJson(params.metadata)
      }
    });
  }

  return prisma.task.create({
    data: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      teamId: params.teamId ?? null,
      ownerUserId: params.ownerUserId ?? null,
      assigneeUserId: params.assigneeUserId ?? null,
      title: params.title,
      description: params.description,
      status: params.status,
      priority: params.priority,
      progressPercent: params.progressPercent,
      riskScore: params.riskScore,
      dueAt: params.dueAt ?? null,
      metadata: asJson(params.metadata)
    }
  });
}

async function upsertExecutiveKpi(params: {
  companyId: string;
  projectId?: string | null;
  teamId?: string | null;
  name: string;
  value: number;
  unit?: string | null;
  targetValue?: number | null;
  trend: MetricTrend;
  summary: string;
  lastMeasuredAt?: Date | null;
}) {
  const existingKpi = await prisma.kpi.findFirst({
    where: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      name: params.name
    }
  });

  if (existingKpi) {
    return prisma.kpi.update({
      where: { id: existingKpi.id },
      data: {
        teamId: params.teamId ?? null,
        value: params.value,
        unit: params.unit ?? null,
        targetValue: params.targetValue ?? null,
        trend: params.trend,
        summary: params.summary,
        lastMeasuredAt: params.lastMeasuredAt ?? null
      }
    });
  }

  return prisma.kpi.create({
    data: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      teamId: params.teamId ?? null,
      name: params.name,
      value: params.value,
      unit: params.unit ?? null,
      targetValue: params.targetValue ?? null,
      trend: params.trend,
      summary: params.summary,
      lastMeasuredAt: params.lastMeasuredAt ?? null
    }
  });
}

async function upsertExecutiveAlert(params: {
  companyId: string;
  projectId?: string | null;
  taskId?: string | null;
  teamId?: string | null;
  title: string;
  description: string;
  severity: AlertSeverity;
  recommendedAction: string;
}) {
  const existingAlert = await prisma.operationalAlert.findFirst({
    where: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      title: params.title
    }
  });

  if (existingAlert) {
    return prisma.operationalAlert.update({
      where: { id: existingAlert.id },
      data: {
        taskId: params.taskId ?? null,
        teamId: params.teamId ?? null,
        description: params.description,
        severity: params.severity,
        status: AlertLifecycleStatus.OPEN,
        recommendedAction: params.recommendedAction,
        resolvedAt: null
      }
    });
  }

  return prisma.operationalAlert.create({
    data: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      taskId: params.taskId ?? null,
      teamId: params.teamId ?? null,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: AlertLifecycleStatus.OPEN,
      recommendedAction: params.recommendedAction
    }
  });
}

async function upsertExecutiveReport(params: {
  companyId: string;
  projectId?: string | null;
  generatedById?: string | null;
  title: string;
  summary: string;
  periodLabel: string;
  body: Record<string, unknown>;
}) {
  const existingReport = await prisma.executiveReport.findFirst({
    where: {
      companyId: params.companyId,
      title: params.title,
      periodLabel: params.periodLabel
    }
  });

  if (existingReport) {
    return prisma.executiveReport.update({
      where: { id: existingReport.id },
      data: {
        projectId: params.projectId ?? null,
        generatedById: params.generatedById ?? null,
        summary: params.summary,
        reportType: ReportType.WEEKLY,
        body: asJson(params.body),
        generatedAt: new Date()
      }
    });
  }

  return prisma.executiveReport.create({
    data: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      generatedById: params.generatedById ?? null,
      title: params.title,
      summary: params.summary,
      reportType: ReportType.WEEKLY,
      periodLabel: params.periodLabel,
      body: asJson(params.body),
      generatedAt: new Date()
    }
  });
}

async function upsertExecutiveAutomation(params: {
  companyId: string;
  ownerUserId?: string | null;
  name: string;
  description: string;
  moduleScope: string;
  configuration: Record<string, unknown>;
  nextRunAt?: Date | null;
}) {
  const existingAutomation = await prisma.automation.findFirst({
    where: {
      companyId: params.companyId,
      name: params.name
    }
  });

  if (existingAutomation) {
    return prisma.automation.update({
      where: { id: existingAutomation.id },
      data: {
        ownerUserId: params.ownerUserId ?? null,
        description: params.description,
        status: AutomationStatus.ACTIVE,
        triggerType: AutomationTriggerType.SCHEDULE,
        moduleScope: params.moduleScope,
        configuration: asJson(params.configuration),
        nextRunAt: params.nextRunAt ?? null
      }
    });
  }

  return prisma.automation.create({
    data: {
      companyId: params.companyId,
      ownerUserId: params.ownerUserId ?? null,
      name: params.name,
      description: params.description,
      status: AutomationStatus.ACTIVE,
      triggerType: AutomationTriggerType.SCHEDULE,
      moduleScope: params.moduleScope,
      configuration: asJson(params.configuration),
      nextRunAt: params.nextRunAt ?? null
    }
  });
}

async function upsertExecutiveMetric(params: {
  companyId: string;
  projectId?: string | null;
  teamId?: string | null;
  name: string;
  value: number;
  unit?: string | null;
  benchmark?: number | null;
  label?: string | null;
  trend: MetricTrend;
}) {
  const existingMetric = await prisma.operationalMetric.findFirst({
    where: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      name: params.name
    }
  });

  if (existingMetric) {
    return prisma.operationalMetric.update({
      where: { id: existingMetric.id },
      data: {
        teamId: params.teamId ?? null,
        value: params.value,
        unit: params.unit ?? null,
        benchmark: params.benchmark ?? null,
        label: params.label ?? null,
        trend: params.trend
      }
    });
  }

  return prisma.operationalMetric.create({
    data: {
      companyId: params.companyId,
      projectId: params.projectId ?? null,
      teamId: params.teamId ?? null,
      name: params.name,
      value: params.value,
      unit: params.unit ?? null,
      benchmark: params.benchmark ?? null,
      label: params.label ?? null,
      trend: params.trend
    }
  });
}

async function upsertExecutiveIntegration(params: {
  companyId: string;
  name: string;
  provider: string;
  metadata: Record<string, unknown>;
}) {
  return prisma.integration.upsert({
    where: {
      companyId_provider: {
        companyId: params.companyId,
        provider: params.provider
      }
    },
    update: {
      name: params.name,
      status: IntegrationStatus.CONNECTED,
      metadata: asJson(params.metadata),
      lastSyncedAt: new Date()
    },
    create: {
      companyId: params.companyId,
      name: params.name,
      provider: params.provider,
      status: IntegrationStatus.CONNECTED,
      metadata: asJson(params.metadata),
      lastSyncedAt: new Date()
    }
  });
}

async function upsertExecutiveActivityLog(params: {
  companyId: string;
  userId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  alertId?: string | null;
  reportId?: string | null;
  automationId?: string | null;
  title: string;
  description: string;
  routePath?: string;
  metadata?: Record<string, unknown>;
}) {
  const existingLog = await prisma.activityLog.findFirst({
    where: {
      companyId: params.companyId,
      title: params.title
    }
  });

  if (existingLog) {
    return prisma.activityLog.update({
      where: { id: existingLog.id },
      data: {
        userId: params.userId ?? null,
        projectId: params.projectId ?? null,
        taskId: params.taskId ?? null,
        alertId: params.alertId ?? null,
        reportId: params.reportId ?? null,
        automationId: params.automationId ?? null,
        description: params.description,
        routePath: params.routePath ?? null,
        metadata: asJson(params.metadata)
      }
    });
  }

  return prisma.activityLog.create({
    data: {
      companyId: params.companyId,
      userId: params.userId ?? null,
      projectId: params.projectId ?? null,
      taskId: params.taskId ?? null,
      alertId: params.alertId ?? null,
      reportId: params.reportId ?? null,
      automationId: params.automationId ?? null,
      type: ActivityLogType.SYSTEM,
      title: params.title,
      description: params.description,
      routePath: params.routePath ?? null,
      metadata: asJson(params.metadata)
    }
  });
}

async function seedFinancialWorkspace(params: {
  companyId: string;
  leaderUserId?: string | null;
}) {
  const { companyId, leaderUserId } = params;
  const acceptedClient = await prisma.quoteClient.upsert({
    where: {
      companyId_email: {
        companyId,
        email: "finanzas@nova-industrial.mx"
      }
    },
    update: {
      name: "Mariana Torres",
      company: "Nova Industrial",
      phone: "+52 55 4500 1188",
      sector: "Manufactura",
      clientType: QuoteClientType.STRATEGIC
    },
    create: {
      companyId,
      name: "Mariana Torres",
      company: "Nova Industrial",
      email: "finanzas@nova-industrial.mx",
      phone: "+52 55 4500 1188",
      sector: "Manufactura",
      clientType: QuoteClientType.STRATEGIC
    }
  });

  const readyQuote = await prisma.quote.upsert({
    where: {
      companyId_quoteNumber: {
        companyId,
        quoteNumber: "ONX-Q-2026-0001"
      }
    },
    update: {
      clientId: acceptedClient.id,
      createdById: leaderUserId ?? null,
      status: QuoteStatus.ACCEPTED,
      invoiceStatus: QuoteInvoiceStatus.NOT_READY,
      clientName: acceptedClient.name,
      clientCompany: acceptedClient.company,
      clientEmail: acceptedClient.email,
      validUntil: addDays(new Date(), 14),
      commercialTerms: "Vigencia de 14 dias. Pago por transferencia en una sola exhibicion.",
      clientType: QuoteClientType.STRATEGIC,
      complexity: QuoteComplexity.MEDIUM,
      urgency: QuoteUrgency.STANDARD,
      currency: "MXN",
      subtotalCents: 8600000,
      discountCents: 0,
      surchargeCents: 0,
      taxCents: 1376000,
      totalCents: 9976000,
      estimatedProfitCents: 2580000,
      estimatedMarginPercent: 30,
      requiresApproval: false,
      lineItems: {
        deleteMany: {},
        create: [
          {
            name: "Implementacion de tablero ejecutivo",
            description: "Configuracion operativa, metricas y lectura ejecutiva inicial.",
            quantity: 1,
            unitCents: 6200000,
            taxPercent: 16,
            subtotalCents: 6200000,
            taxCents: 992000,
            totalCents: 7192000
          },
          {
            name: "Acompanamiento operativo mensual",
            description: "Seguimiento de prioridades, alertas y reportes ejecutivos.",
            quantity: 1,
            unitCents: 2400000,
            taxPercent: 16,
            subtotalCents: 2400000,
            taxCents: 384000,
            totalCents: 2784000
          }
        ]
      }
    },
    create: {
      companyId,
      clientId: acceptedClient.id,
      createdById: leaderUserId ?? null,
      quoteNumber: "ONX-Q-2026-0001",
      status: QuoteStatus.ACCEPTED,
      invoiceStatus: QuoteInvoiceStatus.NOT_READY,
      clientName: acceptedClient.name,
      clientCompany: acceptedClient.company,
      clientEmail: acceptedClient.email,
      validUntil: addDays(new Date(), 14),
      commercialTerms: "Vigencia de 14 dias. Pago por transferencia en una sola exhibicion.",
      clientType: QuoteClientType.STRATEGIC,
      complexity: QuoteComplexity.MEDIUM,
      urgency: QuoteUrgency.STANDARD,
      currency: "MXN",
      subtotalCents: 8600000,
      discountCents: 0,
      surchargeCents: 0,
      taxCents: 1376000,
      totalCents: 9976000,
      estimatedProfitCents: 2580000,
      estimatedMarginPercent: 30,
      requiresApproval: false,
      shareToken: "seed-onx-q-2026-0001",
      printableSnapshot: asJson({
        source: "seed",
        module: "quotes"
      }),
      lineItems: {
        create: [
          {
            name: "Implementacion de tablero ejecutivo",
            description: "Configuracion operativa, metricas y lectura ejecutiva inicial.",
            quantity: 1,
            unitCents: 6200000,
            taxPercent: 16,
            subtotalCents: 6200000,
            taxCents: 992000,
            totalCents: 7192000
          },
          {
            name: "Acompanamiento operativo mensual",
            description: "Seguimiento de prioridades, alertas y reportes ejecutivos.",
            quantity: 1,
            unitCents: 2400000,
            taxPercent: 16,
            subtotalCents: 2400000,
            taxCents: 384000,
            totalCents: 2784000
          }
        ]
      }
    },
    include: {
      lineItems: true
    }
  });

  const preparedQuote = await prisma.quote.upsert({
    where: {
      companyId_quoteNumber: {
        companyId,
        quoteNumber: "ONX-Q-2026-0002"
      }
    },
    update: {
      clientId: acceptedClient.id,
      createdById: leaderUserId ?? null,
      status: QuoteStatus.ACCEPTED,
      invoiceStatus: QuoteInvoiceStatus.READY_FOR_INVOICE,
      invoicePreparedAt: new Date(),
      clientName: acceptedClient.name,
      clientCompany: acceptedClient.company,
      clientEmail: acceptedClient.email,
      validUntil: addDays(new Date(), 7),
      commercialTerms: "Servicios internos listos para comprobante operativo.",
      clientType: QuoteClientType.STRATEGIC,
      complexity: QuoteComplexity.LOW,
      urgency: QuoteUrgency.STANDARD,
      currency: "MXN",
      subtotalCents: 3200000,
      discountCents: 0,
      surchargeCents: 0,
      taxCents: 512000,
      totalCents: 3712000,
      estimatedProfitCents: 960000,
      estimatedMarginPercent: 30,
      requiresApproval: false,
      lineItems: {
        deleteMany: {},
        create: [
          {
            name: "Diagnostico financiero operativo",
            description: "Revision de metricas, procesos y prioridades de administracion.",
            quantity: 1,
            unitCents: 3200000,
            taxPercent: 16,
            subtotalCents: 3200000,
            taxCents: 512000,
            totalCents: 3712000
          }
        ]
      }
    },
    create: {
      companyId,
      clientId: acceptedClient.id,
      createdById: leaderUserId ?? null,
      quoteNumber: "ONX-Q-2026-0002",
      status: QuoteStatus.ACCEPTED,
      invoiceStatus: QuoteInvoiceStatus.READY_FOR_INVOICE,
      invoicePreparedAt: new Date(),
      clientName: acceptedClient.name,
      clientCompany: acceptedClient.company,
      clientEmail: acceptedClient.email,
      validUntil: addDays(new Date(), 7),
      commercialTerms: "Servicios internos listos para comprobante operativo.",
      clientType: QuoteClientType.STRATEGIC,
      complexity: QuoteComplexity.LOW,
      urgency: QuoteUrgency.STANDARD,
      currency: "MXN",
      subtotalCents: 3200000,
      discountCents: 0,
      surchargeCents: 0,
      taxCents: 512000,
      totalCents: 3712000,
      estimatedProfitCents: 960000,
      estimatedMarginPercent: 30,
      requiresApproval: false,
      shareToken: "seed-onx-q-2026-0002",
      printableSnapshot: asJson({
        source: "seed",
        module: "invoices"
      }),
      lineItems: {
        create: [
          {
            name: "Diagnostico financiero operativo",
            description: "Revision de metricas, procesos y prioridades de administracion.",
            quantity: 1,
            unitCents: 3200000,
            taxPercent: 16,
            subtotalCents: 3200000,
            taxCents: 512000,
            totalCents: 3712000
          }
        ]
      }
    },
    include: {
      lineItems: true
    }
  });

  await prisma.invoice.upsert({
    where: {
      companyId_invoiceNumber: {
        companyId,
        invoiceNumber: "ONX-INV-2026-0001"
      }
    },
    update: {
      quoteId: preparedQuote.id,
      createdById: leaderUserId ?? null,
      status: InvoiceStatus.DRAFT,
      clientName: preparedQuote.clientName,
      clientCompany: preparedQuote.clientCompany,
      clientEmail: preparedQuote.clientEmail,
      rfc: "NIN260101AB1",
      legalName: "NOVA INDUSTRIAL SA DE CV",
      cfdiUse: "G03 - Gastos en general",
      fiscalRegime: "601 - General de Ley Personas Morales",
      fiscalAddress: "Av. Industria 240, Monterrey, Nuevo Leon, 64000",
      paymentMethod: "PUE - Pago en una sola exhibicion",
      paymentForm: "03 - Transferencia electronica",
      currency: "MXN",
      subtotalCents: preparedQuote.subtotalCents,
      taxCents: preparedQuote.taxCents,
      totalCents: preparedQuote.totalCents,
      providerName: null,
      providerInvoiceId: null,
      providerUuid: null,
      failureReason: null,
      internalReceiptSnapshot: asJson({
        kind: "INTERNAL_NON_FISCAL_RECEIPT",
        warning: "Comprobante interno operativo. No sustituye CFDI.",
        seededFromQuote: preparedQuote.quoteNumber
      }),
      issuedAt: null,
      paidAt: null,
      cancelledAt: null,
      lineItems: {
        deleteMany: {},
        create: preparedQuote.lineItems.map((line) => ({
          companyId,
          description: line.name,
          quantity: line.quantity,
          unitCents: line.unitCents,
          taxPercent: line.taxPercent,
          subtotalCents: line.subtotalCents,
          taxCents: line.taxCents,
          totalCents: line.totalCents
        }))
      }
    },
    create: {
      companyId,
      quoteId: preparedQuote.id,
      createdById: leaderUserId ?? null,
      invoiceNumber: "ONX-INV-2026-0001",
      status: InvoiceStatus.DRAFT,
      clientName: preparedQuote.clientName,
      clientCompany: preparedQuote.clientCompany,
      clientEmail: preparedQuote.clientEmail,
      rfc: "NIN260101AB1",
      legalName: "NOVA INDUSTRIAL SA DE CV",
      cfdiUse: "G03 - Gastos en general",
      fiscalRegime: "601 - General de Ley Personas Morales",
      fiscalAddress: "Av. Industria 240, Monterrey, Nuevo Leon, 64000",
      paymentMethod: "PUE - Pago en una sola exhibicion",
      paymentForm: "03 - Transferencia electronica",
      currency: "MXN",
      subtotalCents: preparedQuote.subtotalCents,
      taxCents: preparedQuote.taxCents,
      totalCents: preparedQuote.totalCents,
      internalReceiptSnapshot: asJson({
        kind: "INTERNAL_NON_FISCAL_RECEIPT",
        warning: "Comprobante interno operativo. No sustituye CFDI.",
        seededFromQuote: preparedQuote.quoteNumber
      }),
      lineItems: {
        create: preparedQuote.lineItems.map((line) => ({
          companyId,
          description: line.name,
          quantity: line.quantity,
          unitCents: line.unitCents,
          taxPercent: line.taxPercent,
          subtotalCents: line.subtotalCents,
          taxCents: line.taxCents,
          totalCents: line.totalCents
        }))
      }
    }
  });

  await upsertExecutiveActivityLog({
    companyId,
    userId: leaderUserId ?? null,
    title: "Modulo financiero preparado",
    description:
      "Cotizaciones aceptadas y facturas internas quedaron listas para conectar un proveedor CFDI externo.",
    routePath: "/workspace/invoices",
    metadata: {
      readyQuoteId: readyQuote.id,
      preparedQuoteId: preparedQuote.id,
      nonFiscal: true
    }
  });
}

async function seedExecutiveWorkspace(params: {
  companyId: string;
  leaderUserId?: string | null;
  consultantUserId?: string | null;
}) {
  const { companyId, leaderUserId, consultantUserId } = params;
  const now = new Date();

  const commandCenterTeam = await upsertExecutiveTeam({
    companyId,
    ownerUserId: leaderUserId ?? null,
    name: "Command Center",
    slug: "command-center",
    description: "Equipo responsable de monitoreo ejecutivo, alertas y decisiones operativas."
  });
  const operationsTeam = await upsertExecutiveTeam({
    companyId,
    ownerUserId: leaderUserId ?? null,
    name: "Operations Core",
    slug: "operations-core",
    description: "Equipo base para coordinar proyectos, tareas criticas y automatizaciones."
  });

  if (leaderUserId) {
    await upsertExecutiveTeamMember({
      companyId,
      teamId: commandCenterTeam.id,
      userId: leaderUserId,
      title: "Executive operator"
    });
  }

  if (consultantUserId) {
    await upsertExecutiveTeamMember({
      companyId,
      teamId: operationsTeam.id,
      userId: consultantUserId,
      title: "Operations specialist"
    });
  }

  const financialProject = await upsertExecutiveProject({
    companyId,
    leaderId: leaderUserId ?? null,
    folio: getDemoProjectFolio(),
    name: "Tablero financiero Q2",
    description:
      "Consolidacion de metricas operativas y financieras para seguimiento semanal de direccion.",
    durationLabel: "6 semanas",
    status: ProjectStatus.ACTIVE,
    priority: ProjectPriority.HIGH,
    startDate: addDays(now, -14),
    endDate: addDays(now, 21),
    clientContactName: "Direccion financiera",
    clientContactEmail: "finanzas@orbitne.com",
    requirements: {
      objective: "Consolidar lectura ejecutiva de ingresos, riesgos y throughput.",
      clientProfile: {
        name: "Direccion financiera",
        company: "Orbit Nexus",
        email: "finanzas@orbitne.com",
        phone: "+52 55 5100 1200",
        sector: "Servicios",
        notes: "Necesita lectura ejecutiva antes del cierre semanal."
      }
    }
  });

  const expansionProject = await upsertExecutiveProject({
    companyId,
    leaderId: leaderUserId ?? null,
    folio: "ONX-OPS-2026-0002",
    name: "Expansion regional de operaciones",
    description:
      "Ejecucion del playbook operativo para escalar cobertura y visibilidad en nuevas unidades.",
    durationLabel: "8 semanas",
    status: ProjectStatus.AT_RISK,
    priority: ProjectPriority.CRITICAL,
    startDate: addDays(now, -10),
    endDate: addDays(now, 18),
    clientContactName: "Direccion general",
    clientContactEmail: "direccion@orbitne.com",
    requirements: {
      objective: "Abrir operacion regional sin perder control ni trazabilidad.",
      clientProfile: {
        name: "Direccion general",
        company: "Orbit Nexus",
        email: "direccion@orbitne.com",
        phone: "+52 55 5100 1299",
        sector: "Servicios",
        notes: "Operacion prioritaria con dependencia en aprobaciones interareas."
      }
    }
  });

  const automationProject = await upsertExecutiveProject({
    companyId,
    leaderId: leaderUserId ?? null,
    folio: "ONX-OPS-2026-0003",
    name: "Automatizacion de aprobaciones internas",
    description:
      "Implementacion de automatizaciones para reducir seguimiento manual en validaciones y alertas.",
    durationLabel: "5 semanas",
    status: ProjectStatus.ACTIVE,
    priority: ProjectPriority.MEDIUM,
    startDate: addDays(now, -7),
    endDate: addDays(now, 28),
    clientContactName: "People & Operations",
    clientContactEmail: "ops@orbitne.com",
    requirements: {
      objective: "Reducir tiempos muertos y dependencias manuales en aprobaciones clave.",
      clientProfile: {
        name: "People & Operations",
        company: "Orbit Nexus",
        email: "ops@orbitne.com",
        phone: "+52 55 5100 1222",
        sector: "Servicios",
        notes: "Busca throughput mas estable entre tareas y validaciones."
      }
    }
  });

  const blockedTask = await upsertExecutiveTask({
    companyId,
    projectId: expansionProject.id,
    teamId: operationsTeam.id,
    ownerUserId: leaderUserId ?? null,
    assigneeUserId: consultantUserId ?? null,
    title: "Cerrar aprobacion presupuestal regional",
    description:
      "La expansion regional depende de una aprobacion cruzada que sigue detenida y afecta el calendario.",
    status: TaskStatus.BLOCKED,
    priority: TaskPriority.CRITICAL,
    progressPercent: 44,
    riskScore: 92,
    dueAt: addDays(now, -1),
    metadata: {
      category: "approval",
      executiveImpact: "high"
    }
  });
  const dashboardTask = await upsertExecutiveTask({
    companyId,
    projectId: financialProject.id,
    teamId: commandCenterTeam.id,
    ownerUserId: leaderUserId ?? null,
    assigneeUserId: consultantUserId ?? null,
    title: "Consolidar variaciones del tablero financiero",
    description:
      "Unifica cambios semanales en ingresos, riesgos y throughput para el resumen ejecutivo del viernes.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    progressPercent: 68,
    riskScore: 54,
    dueAt: addDays(now, 2),
    metadata: {
      category: "reporting",
      executiveImpact: "medium"
    }
  });
  const automationTask = await upsertExecutiveTask({
    companyId,
    projectId: automationProject.id,
    teamId: operationsTeam.id,
    ownerUserId: leaderUserId ?? null,
    assigneeUserId: consultantUserId ?? null,
    title: "Publicar automatizacion de checkpoints",
    description:
      "Configuracion final de alertas y checkpoints para evitar seguimiento manual en aprobaciones recurrentes.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    progressPercent: 22,
    riskScore: 38,
    dueAt: addDays(now, 5),
    metadata: {
      category: "automation",
      executiveImpact: "medium"
    }
  });

  await upsertExecutiveKpi({
    companyId,
    projectId: financialProject.id,
    teamId: commandCenterTeam.id,
    name: "Cumplimiento de hitos",
    value: 78,
    unit: "%",
    targetValue: 90,
    trend: MetricTrend.DOWN,
    summary: "El ritmo actual esta por debajo del objetivo y requiere seguimiento cercano.",
    lastMeasuredAt: now
  });
  await upsertExecutiveKpi({
    companyId,
    projectId: expansionProject.id,
    teamId: operationsTeam.id,
    name: "Tiempo de respuesta operativo",
    value: 4.2,
    unit: "h",
    targetValue: 3.5,
    trend: MetricTrend.DOWN,
    summary: "La respuesta interareas se esta alargando por dependencias de aprobacion.",
    lastMeasuredAt: now
  });
  await upsertExecutiveKpi({
    companyId,
    projectId: automationProject.id,
    teamId: operationsTeam.id,
    name: "Cobertura de automatizacion",
    value: 62,
    unit: "%",
    targetValue: 70,
    trend: MetricTrend.UP,
    summary: "La organizacion ya tiene automatizaciones activas, pero aun queda espacio para consolidar cobertura.",
    lastMeasuredAt: now
  });

  const approvalAlert = await upsertExecutiveAlert({
    companyId,
    projectId: expansionProject.id,
    taskId: blockedTask.id,
    teamId: operationsTeam.id,
    title: "Riesgo de atraso en expansion regional",
    description:
      "La aprobacion presupuestal sigue bloqueando el frente mas critico y pone en riesgo el calendario de despliegue.",
    severity: AlertSeverity.CRITICAL,
    recommendedAction: "Escalar aprobacion y definir responsable unico antes del siguiente corte."
  });
  const dashboardAlert = await upsertExecutiveAlert({
    companyId,
    projectId: financialProject.id,
    taskId: dashboardTask.id,
    teamId: commandCenterTeam.id,
    title: "Variaciones financieras sin consolidar",
    description:
      "El tablero ejecutivo aun no integra los ultimos cambios de capacidad y throughput semanal.",
    severity: AlertSeverity.HIGH,
    recommendedAction: "Cerrar consolidacion y validar el resumen ejecutivo antes del viernes."
  });

  const weeklyReport = await upsertExecutiveReport({
    companyId,
    projectId: financialProject.id,
    generatedById: leaderUserId ?? null,
    title: "Resumen ejecutivo semanal",
    summary:
      "El frente regional sigue siendo la prioridad principal, mientras el tablero financiero necesita consolidacion final y la automatizacion mantiene avance estable.",
    periodLabel: "Semana actual",
    body: {
      priorities: [
        "Destrabar aprobacion regional",
        "Consolidar tablero financiero",
        "Publicar checkpoints automaticos"
      ],
      highlights: [
        "2 alertas abiertas",
        "1 tarea bloqueada",
        "1 KPI por debajo del objetivo"
      ]
    }
  });

  const dailyAutomation = await upsertExecutiveAutomation({
    companyId,
    ownerUserId: leaderUserId ?? null,
    name: "Seguimiento diario de bloqueos",
    description:
      "Revisa tareas bloqueadas y notifica a responsables operativos para actuar antes del siguiente corte.",
    moduleScope: "operations",
    configuration: {
      cadence: "daily",
      triggerHour: "09:00"
    },
    nextRunAt: addDays(now, 1)
  });
  const weeklyAutomation = await upsertExecutiveAutomation({
    companyId,
    ownerUserId: leaderUserId ?? null,
    name: "Reporte ejecutivo semanal",
    description:
      "Sintetiza estado operativo, alertas y KPI para la lectura ejecutiva del cierre semanal.",
    moduleScope: "reports",
    configuration: {
      cadence: "weekly",
      triggerDay: "Friday"
    },
    nextRunAt: addDays(now, 3)
  });

  await upsertExecutiveMetric({
    companyId,
    projectId: financialProject.id,
    teamId: commandCenterTeam.id,
    name: "Throughput operativo",
    value: 81,
    unit: "%",
    benchmark: 85,
    label: "Ritmo de avance consolidado",
    trend: MetricTrend.STABLE
  });
  await upsertExecutiveMetric({
    companyId,
    projectId: expansionProject.id,
    teamId: operationsTeam.id,
    name: "Salud de prioridades criticas",
    value: 68,
    unit: "%",
    benchmark: 80,
    label: "Frentes de mayor atencion",
    trend: MetricTrend.DOWN
  });

  await upsertExecutiveIntegration({
    companyId,
    name: "Slack",
    provider: "slack",
    metadata: {
      scope: "notifications",
      status: "stable"
    }
  });
  await upsertExecutiveIntegration({
    companyId,
    name: "Google Calendar",
    provider: "google-calendar",
    metadata: {
      scope: "meetings",
      status: "stable"
    }
  });

  await upsertExecutiveActivityLog({
    companyId,
    userId: leaderUserId ?? consultantUserId ?? null,
    projectId: expansionProject.id,
    taskId: blockedTask.id,
    alertId: approvalAlert.id,
    title: "Orbit Nexus detecto un bloqueo critico",
    description:
      "La aprobacion regional quedo marcada como riesgo prioritario y ya forma parte del Command Center.",
    routePath: "/workspace",
    metadata: {
      module: "alerts"
    }
  });
  await upsertExecutiveActivityLog({
    companyId,
    userId: leaderUserId ?? consultantUserId ?? null,
    projectId: financialProject.id,
    taskId: dashboardTask.id,
    alertId: dashboardAlert.id,
    title: "Se actualizaron las prioridades del tablero financiero",
    description:
      "El sistema marco la consolidacion financiera como siguiente frente visible para la direccion.",
    routePath: "/workspace",
    metadata: {
      module: "projects"
    }
  });
  await upsertExecutiveActivityLog({
    companyId,
    userId: leaderUserId ?? consultantUserId ?? null,
    reportId: weeklyReport.id,
    automationId: weeklyAutomation.id,
    title: "El resumen ejecutivo semanal quedo listo",
    description:
      "La capa operativa ya puede mostrar riesgos, tareas y recomendaciones en una sola lectura ejecutiva.",
    routePath: "/workspace",
    metadata: {
      module: "reports"
    }
  });
  await upsertExecutiveActivityLog({
    companyId,
    userId: leaderUserId ?? consultantUserId ?? null,
    automationId: dailyAutomation.id,
    title: "Seguimiento diario de bloqueos activo",
    description:
      "La automatizacion diaria quedo preparada para notificar bloqueos y acelerar decisiones operativas.",
    routePath: "/workspace",
    metadata: {
      module: "automations"
    }
  });
}

async function main() {
  await seedRoles();

  const company = await seedDefaultCompany();

  await seedSuperadmin();
  await seedMaiaOwner();

  await seedAuthorizedDirectoryUsers({
    companyId: company.id,
    roleKey: "LEADER",
    users: leaderDirectoryUsers
  });

  await seedAuthorizedDirectoryUsers({
    companyId: company.id,
    roleKey: "CONSULTANT",
    users: consultantDirectoryUsers
  });

  const usableSeedAccounts = getUsableSeedAccounts();

  if (leaderDirectoryUsers[0]) {
    await seedUsableDirectoryAccount({
      companyId: company.id,
      companyCodePrefix: company.codePrefix,
      roleKey: "LEADER",
      user: leaderDirectoryUsers[0],
      requestedAccessCode: usableSeedAccounts.leader.accessCode,
      password: usableSeedAccounts.leader.password
    });
  }

  if (consultantDirectoryUsers[0]) {
    await seedUsableDirectoryAccount({
      companyId: company.id,
      companyCodePrefix: company.codePrefix,
      roleKey: "CONSULTANT",
      user: consultantDirectoryUsers[0],
      requestedAccessCode: usableSeedAccounts.consultant.accessCode,
      password: usableSeedAccounts.consultant.password
    });
  }

  await seedDemoProject(company.id);

  const leaderUser = await prisma.user.findFirst({
    where: {
      companyId: company.id,
      role: {
        key: "LEADER"
      },
      status: UserStatus.ACTIVE
    },
    select: {
      id: true
    }
  });
  const consultantUser = await prisma.user.findFirst({
    where: {
      companyId: company.id,
      role: {
        key: "CONSULTANT"
      },
      status: UserStatus.ACTIVE
    },
    select: {
      id: true
    }
  });

  await seedExecutiveWorkspace({
    companyId: company.id,
    leaderUserId: leaderUser?.id ?? null,
    consultantUserId: consultantUser?.id ?? null
  });

  await seedFinancialWorkspace({
    companyId: company.id,
    leaderUserId: leaderUser?.id ?? null
  });

}

main()
  .then(async () => {
    console.log("Seed completado correctamente.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
