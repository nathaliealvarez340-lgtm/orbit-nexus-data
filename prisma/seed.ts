import { RoleKey, UserStatus } from "@prisma/client";

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

async function seedRoles() {
  const roles: Array<{ key: RoleKey; name: string; description: string }> = [
    {
      key: "SUPERADMIN",
      name: "Superadmin",
      description: "Acceso global a la plataforma y gestion de empresas."
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
      isActive: true
    },
    create: {
      name: company.name,
      slug: company.slug,
      isActive: true
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

    await prisma.user.upsert({
      where: {
        companyId_roleId_email: {
          companyId,
          roleId: role.id,
          email: normalizedEmail
        }
      },
      update: {
        fullName: user.fullName.trim(),
        normalizedFullName,
        email: normalizedEmail,
        phone: user.phone?.trim() || null,
        importedFromDirectory: true,
        status: UserStatus.PENDING_REGISTRATION,
        companyId,
        roleId: role.id
      },
      create: {
        companyId,
        roleId: role.id,
        fullName: user.fullName.trim(),
        normalizedFullName,
        email: normalizedEmail,
        phone: user.phone?.trim() || null,
        importedFromDirectory: true,
        status: UserStatus.PENDING_REGISTRATION
      }
    });
  }
}

async function seedUsableDirectoryAccount(params: {
  companyId: string;
  roleKey: Exclude<RoleKey, "SUPERADMIN" | "CLIENT">;
  user: AuthorizedDirectoryUser;
  requestedAccessCode: string;
  password: string;
}) {
  const { companyId, roleKey, user, requestedAccessCode, password } = params;
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

  if (
    existingUser.status === UserStatus.ACTIVE &&
    existingUser.accessCode &&
    existingUser.passwordHash
  ) {
    return;
  }

  const passwordHash = await hashPassword(password);
  let accessCode = requestedAccessCode;

  if (existingUser.accessCode) {
    accessCode = existingUser.accessCode;
  } else {
    const userWithRequestedAccessCode = await prisma.user.findUnique({
      where: {
        accessCode: requestedAccessCode
      },
      select: {
        id: true
      }
    });

    if (userWithRequestedAccessCode && userWithRequestedAccessCode.id !== existingUser.id) {
      accessCode = await generateUniqueAccessCode(prisma, roleKey);
    }
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
      status: "READY_FOR_MATCHING"
    },
    create: {
      companyId,
      name: "Proyecto demo de onboarding",
      description: "Proyecto base para validar el registro de clientes en Fase 1.",
      durationLabel: "4 semanas",
      folio: getDemoProjectFolio(),
      priority: "MEDIUM",
      status: "READY_FOR_MATCHING"
    }
  });
}

async function main() {
  await seedRoles();

  const company = await seedDefaultCompany();

  await seedSuperadmin();

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
      roleKey: "LEADER",
      user: leaderDirectoryUsers[0],
      requestedAccessCode: usableSeedAccounts.leader.accessCode,
      password: usableSeedAccounts.leader.password
    });
  }

  if (consultantDirectoryUsers[0]) {
    await seedUsableDirectoryAccount({
      companyId: company.id,
      roleKey: "CONSULTANT",
      user: consultantDirectoryUsers[0],
      requestedAccessCode: usableSeedAccounts.consultant.accessCode,
      password: usableSeedAccounts.consultant.password
    });
  }

  await seedDemoProject(company.id);
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
