import {
  AUTHORIZED_CONSULTANT_NAMES,
  AUTHORIZED_LEADER_NAMES
} from "@/lib/directory/authorized-users";
import type { DashboardProjectRecord } from "@/lib/dashboard/mock-data";
import { normalizeName } from "@/lib/normalization";
import type { SessionUser } from "@/types/auth";

export type WorkspaceChatRole = "LEADER" | "CONSULTANT";
export type WorkspaceChatPresence = "active" | "pending" | "busy";
export type WorkspaceChatMessageStatus = "sent" | "delivered" | "seen";

export type WorkspaceChatParticipant = {
  id: string;
  tenantId: string | null;
  role: WorkspaceChatRole;
  fullName: string;
  status: WorkspaceChatPresence;
};

export type WorkspaceChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: WorkspaceChatRole;
  text: string;
  createdAt: string;
  status: WorkspaceChatMessageStatus;
};

export type WorkspaceChatConversation = {
  id: string;
  tenantId: string | null;
  leaderId: string;
  leaderName: string;
  leaderStatus: WorkspaceChatPresence;
  consultantId: string;
  consultantName: string;
  consultantStatus: WorkspaceChatPresence;
  projectFolio: string;
  projectName: string;
  projectSlug: string;
  projectHref: string;
  lastMessageAt: string;
  unreadCountLeader: number;
  unreadCountConsultant: number;
  messages: WorkspaceChatMessage[];
};

function slugifyToken(value: string) {
  return normalizeName(value).replace(/\s+/g, "-");
}

function buildIdentity(fullName: string, role: WorkspaceChatRole) {
  return `${role.toLowerCase()}-${slugifyToken(fullName)}`;
}

function buildPresence(index: number): WorkspaceChatPresence {
  const pattern: WorkspaceChatPresence[] = ["active", "pending", "busy"];
  return pattern[index % pattern.length];
}

function createParticipant(
  fullName: string,
  role: WorkspaceChatRole,
  tenantId: string | null,
  status: WorkspaceChatPresence
): WorkspaceChatParticipant {
  return {
    id: buildIdentity(fullName, role),
    tenantId,
    role,
    fullName,
    status
  };
}

export function getWorkspaceChatUserId(fullName: string, role: WorkspaceChatRole) {
  return buildIdentity(fullName, role);
}

export function getCurrentChatRole(role: SessionUser["role"]): WorkspaceChatRole | null {
  if (role === "LEADER" || role === "CONSULTANT") {
    return role;
  }

  return null;
}

export function getAcceptedChatParticipants(
  tenantId: string | null,
  session?: SessionUser
) {
  const leaders = AUTHORIZED_LEADER_NAMES.map((fullName, index) =>
    createParticipant(fullName, "LEADER", tenantId, buildPresence(index))
  );
  const consultants = AUTHORIZED_CONSULTANT_NAMES.map((fullName, index) =>
    createParticipant(fullName, "CONSULTANT", tenantId, buildPresence(index + 1))
  );

  const currentRole = session ? getCurrentChatRole(session.role) : null;

  if (!session || !currentRole) {
    return { leaders, consultants };
  }

  const sessionParticipant = createParticipant(
    session.fullName,
    currentRole,
    tenantId,
    "active"
  );

  if (currentRole === "LEADER") {
    return {
      leaders: leaders.some((participant) => participant.id === sessionParticipant.id)
        ? leaders
        : [sessionParticipant, ...leaders],
      consultants
    };
  }

  return {
    leaders,
    consultants: consultants.some((participant) => participant.id === sessionParticipant.id)
      ? consultants
      : [sessionParticipant, ...consultants]
  };
}

function buildConversationId(
  tenantId: string | null,
  leaderId: string,
  consultantId: string,
  projectFolio: string
) {
  return `chat-${tenantId ?? "public"}-${leaderId}-${consultantId}-${slugifyToken(projectFolio)}`;
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function buildSeedMessages(params: {
  conversationId: string;
  leaderId: string;
  consultantId: string;
  projectFolio: string;
  projectName: string;
  variant: number;
}) {
  const { consultantId, conversationId, leaderId, projectFolio, projectName, variant } = params;

  const openedAt = minutesAgo(84 + variant * 7);
  const followUpAt = minutesAgo(41 + variant * 5);
  const latestAt = minutesAgo(variant * 6 + 4);

  if (variant % 3 === 0) {
    return {
      unreadCountLeader: 1,
      unreadCountConsultant: 0,
      lastMessageAt: latestAt,
      messages: [
        {
          id: `${conversationId}-message-1`,
          conversationId,
          senderId: leaderId,
          senderRole: "LEADER" as const,
          text: `Necesito una lectura ejecutiva de ${projectFolio} antes del siguiente corte.`,
          createdAt: openedAt,
          status: "seen" as const
        },
        {
          id: `${conversationId}-message-2`,
          conversationId,
          senderId: consultantId,
          senderRole: "CONSULTANT" as const,
          text: `Comparto en breve el contexto operativo de ${projectName} y el impacto para el cliente.`,
          createdAt: followUpAt,
          status: "seen" as const
        },
        {
          id: `${conversationId}-message-3`,
          conversationId,
          senderId: consultantId,
          senderRole: "CONSULTANT" as const,
          text: "Ya identifique el riesgo principal y necesito tu confirmacion para cerrar la respuesta.",
          createdAt: latestAt,
          status: "delivered" as const
        }
      ]
    };
  }

  if (variant % 3 === 1) {
    return {
      unreadCountLeader: 0,
      unreadCountConsultant: 1,
      lastMessageAt: latestAt,
      messages: [
        {
          id: `${conversationId}-message-1`,
          conversationId,
          senderId: consultantId,
          senderRole: "CONSULTANT" as const,
          text: `El avance operativo de ${projectFolio} quedo alineado con la ruta critica.`,
          createdAt: openedAt,
          status: "seen" as const
        },
        {
          id: `${conversationId}-message-2`,
          conversationId,
          senderId: leaderId,
          senderRole: "LEADER" as const,
          text: "Perfecto. Ajusta la narrativa para que el cliente vea claramente el siguiente hito.",
          createdAt: followUpAt,
          status: "seen" as const
        },
        {
          id: `${conversationId}-message-3`,
          conversationId,
          senderId: leaderId,
          senderRole: "LEADER" as const,
          text: "Necesito que lo subas hoy mismo para liberar la validacion final.",
          createdAt: latestAt,
          status: "delivered" as const
        }
      ]
    };
  }

  return {
    unreadCountLeader: 0,
    unreadCountConsultant: 0,
    lastMessageAt: latestAt,
    messages: [
      {
        id: `${conversationId}-message-1`,
        conversationId,
        senderId: leaderId,
        senderRole: "LEADER" as const,
        text: `Gracias por el seguimiento de ${projectFolio}. Quedo atento a cualquier bloqueo adicional.`,
        createdAt: openedAt,
        status: "seen" as const
      },
      {
        id: `${conversationId}-message-2`,
        conversationId,
        senderId: consultantId,
        senderRole: "CONSULTANT" as const,
        text: "Todo bajo control. Solo estoy afinando el cierre ejecutivo y la siguiente recomendacion.",
        createdAt: latestAt,
        status: "seen" as const
      }
    ]
  };
}

function createSeedConversation(params: {
  tenantId: string | null;
  leader: WorkspaceChatParticipant;
  consultant: WorkspaceChatParticipant;
  project: DashboardProjectRecord;
  index: number;
}): WorkspaceChatConversation {
  const { consultant, index, leader, project, tenantId } = params;
  const conversationId = buildConversationId(
    tenantId,
    leader.id,
    consultant.id,
    project.folio
  );
  const seededMessages = buildSeedMessages({
    conversationId,
    leaderId: leader.id,
    consultantId: consultant.id,
    projectFolio: project.folio,
    projectName: project.name,
    variant: index
  });

  return {
    id: conversationId,
    tenantId,
    leaderId: leader.id,
    leaderName: leader.fullName,
    leaderStatus: leader.status,
    consultantId: consultant.id,
    consultantName: consultant.fullName,
    consultantStatus: consultant.status,
    projectFolio: project.folio,
    projectName: project.name,
    projectSlug: project.slug,
    projectHref: project.href,
    lastMessageAt: seededMessages.lastMessageAt,
    unreadCountLeader: seededMessages.unreadCountLeader,
    unreadCountConsultant: seededMessages.unreadCountConsultant,
    messages: seededMessages.messages
  };
}

function pickPrimaryLeader(
  leaders: WorkspaceChatParticipant[],
  session: SessionUser,
  tenantId: string | null
) {
  const currentUserId = buildIdentity(session.fullName, "LEADER");

  return (
    leaders.find((participant) => participant.id === currentUserId) ??
    leaders[0] ??
    createParticipant(session.fullName, "LEADER", tenantId, "active")
  );
}

function pickPrimaryConsultant(
  consultants: WorkspaceChatParticipant[],
  session: SessionUser,
  tenantId: string | null
) {
  const currentUserId = buildIdentity(session.fullName, "CONSULTANT");

  return (
    consultants.find((participant) => participant.id === currentUserId) ??
    consultants[0] ??
    createParticipant(session.fullName, "CONSULTANT", tenantId, "active")
  );
}

export function createSeedConversations(params: {
  tenantId: string | null;
  session: SessionUser;
  projects: DashboardProjectRecord[];
}) {
  const { projects, session, tenantId } = params;
  const currentRole = getCurrentChatRole(session.role);

  if (!currentRole) {
    return [] as WorkspaceChatConversation[];
  }

  const scopedProjects = projects.length ? projects : [];
  const { leaders, consultants } = getAcceptedChatParticipants(tenantId, session);

  if (!scopedProjects.length || !leaders.length || !consultants.length) {
    return [] as WorkspaceChatConversation[];
  }

  if (currentRole === "LEADER") {
    const currentLeader = pickPrimaryLeader(leaders, session, tenantId);

    return consultants.map((consultant, index) =>
      createSeedConversation({
        tenantId,
        leader: currentLeader,
        consultant,
        project: scopedProjects[index % scopedProjects.length],
        index
      })
    );
  }

  const currentConsultant = pickPrimaryConsultant(consultants, session, tenantId);

  return leaders.map((leader, index) =>
    createSeedConversation({
      tenantId,
      leader,
      consultant: currentConsultant,
      project: scopedProjects[index % scopedProjects.length],
      index
    })
  );
}

export function ensureChatCoverage(params: {
  conversations: WorkspaceChatConversation[];
  tenantId: string | null;
  session: SessionUser;
  projects: DashboardProjectRecord[];
}) {
  const { conversations, projects, session, tenantId } = params;
  const currentRole = getCurrentChatRole(session.role);

  if (!currentRole) {
    return conversations;
  }

  const { leaders, consultants } = getAcceptedChatParticipants(tenantId, session);
  const nextConversations = [...conversations];
  const projectPool = projects.length ? projects : [];

  if (!projectPool.length) {
    return nextConversations;
  }

  if (currentRole === "LEADER") {
    const currentLeader = pickPrimaryLeader(leaders, session, tenantId);

    consultants.forEach((consultant, index) => {
      const project = projectPool[index % projectPool.length];
      const conversationId = buildConversationId(
        tenantId,
        currentLeader.id,
        consultant.id,
        project.folio
      );

      if (!nextConversations.some((conversation) => conversation.id === conversationId)) {
        nextConversations.push(
          createSeedConversation({
            tenantId,
            leader: currentLeader,
            consultant,
            project,
            index
          })
        );
      }
    });
  } else {
    const currentConsultant = pickPrimaryConsultant(consultants, session, tenantId);

    leaders.forEach((leader, index) => {
      const project = projectPool[index % projectPool.length];
      const conversationId = buildConversationId(
        tenantId,
        leader.id,
        currentConsultant.id,
        project.folio
      );

      if (!nextConversations.some((conversation) => conversation.id === conversationId)) {
        nextConversations.push(
          createSeedConversation({
            tenantId,
            leader,
            consultant: currentConsultant,
            project,
            index
          })
        );
      }
    });
  }

  return nextConversations.sort(
    (left, right) =>
      new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime()
  );
}

export function getViewerUnreadCount(
  conversation: WorkspaceChatConversation,
  role: WorkspaceChatRole
) {
  return role === "LEADER"
    ? conversation.unreadCountLeader
    : conversation.unreadCountConsultant;
}

export function getConversationCounterpart(
  conversation: WorkspaceChatConversation,
  role: WorkspaceChatRole
) {
  if (role === "LEADER") {
    return {
      id: conversation.consultantId,
      fullName: conversation.consultantName,
      status: conversation.consultantStatus
    };
  }

  return {
    id: conversation.leaderId,
    fullName: conversation.leaderName,
    status: conversation.leaderStatus
  };
}

export function formatChatTimestamp(value: string, mode: "compact" | "detail" = "compact") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffInMinutes = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / (60 * 1000))
  );

  if (mode === "compact") {
    if (diffInMinutes < 1) {
      return "Ahora";
    }

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    }

    const sameDay = now.toDateString() === date.toDateString();

    if (sameDay) {
      return new Intl.DateTimeFormat("es-MX", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (yesterday.toDateString() === date.toDateString()) {
      return "Ayer";
    }

    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short"
    }).format(date);
  }

  const sameDay = now.toDateString() === date.toDateString();

  if (sameDay) {
    return `Hoy | ${new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (yesterday.toDateString() === date.toDateString()) {
    return `Ayer | ${new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)}`;
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
