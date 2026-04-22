"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import { useWorkspaceProjects } from "@/components/dashboard/workspace-projects-provider";
import {
  createSeedConversations,
  ensureChatCoverage,
  getConversationCounterpart,
  getCurrentChatRole,
  getViewerUnreadCount,
  getWorkspaceChatUserId,
  type WorkspaceChatConversation,
  type WorkspaceChatMessageStatus,
  type WorkspaceChatRole
} from "@/lib/dashboard/chat-data";
import type { SessionUser } from "@/types/auth";

type WorkspaceChatContextValue = {
  currentRole: WorkspaceChatRole | null;
  currentUserId: string | null;
  conversations: WorkspaceChatConversation[];
  totalUnreadCount: number;
  isHydrated: boolean;
  getConversationUnreadCount: (conversation: WorkspaceChatConversation) => number;
  getConversationCounterpartData: (conversation: WorkspaceChatConversation) => ReturnType<typeof getConversationCounterpart>;
  openConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
};

const STORAGE_CHAT_KEY = "orbit-nexus-workspace-chat";
const WorkspaceChatContext = createContext<WorkspaceChatContextValue | null>(null);

function isMessageStatus(value: unknown): value is WorkspaceChatMessageStatus {
  return value === "sent" || value === "delivered" || value === "seen";
}

function isConversationRecord(value: unknown): value is WorkspaceChatConversation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const conversation = value as WorkspaceChatConversation;

  return (
    typeof conversation.id === "string" &&
    typeof conversation.tenantId !== "undefined" &&
    typeof conversation.leaderId === "string" &&
    typeof conversation.consultantId === "string" &&
    typeof conversation.projectFolio === "string" &&
    typeof conversation.projectHref === "string" &&
    typeof conversation.unreadCountLeader === "number" &&
    typeof conversation.unreadCountConsultant === "number" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(
      (message) =>
        !!message &&
        typeof message.id === "string" &&
        typeof message.conversationId === "string" &&
        typeof message.senderId === "string" &&
        typeof message.senderRole === "string" &&
        typeof message.text === "string" &&
        typeof message.createdAt === "string" &&
        isMessageStatus(message.status)
    )
  );
}

function getScopedStorageKey(baseKey: string, companyId: string | null) {
  return `${baseKey}:${companyId ?? "public"}`;
}

function sortConversations(conversations: WorkspaceChatConversation[]) {
  return [...conversations].sort(
    (left, right) =>
      new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime()
  );
}

function deliverIncomingMessages(
  conversations: WorkspaceChatConversation[],
  currentUserId: string | null
): WorkspaceChatConversation[] {
  if (!currentUserId) {
    return conversations;
  }

  return conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.senderId !== currentUserId && message.status === "sent"
        ? {
            ...message,
            status: "delivered" as const
          }
        : message
    )
  }));
}

export function WorkspaceChatProvider({
  children,
  tenantId,
  session
}: {
  children: ReactNode;
  tenantId: string | null;
  session: SessionUser;
}) {
  const { projects } = useWorkspaceProjects();
  const currentRole = getCurrentChatRole(session.role);
  const currentUserId = currentRole
    ? getWorkspaceChatUserId(session.fullName, currentRole)
    : null;
  const [conversations, setConversations] = useState<WorkspaceChatConversation[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const deliveryTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      deliveryTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      deliveryTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!currentRole) {
      setConversations([]);
      setIsHydrated(true);
      return;
    }

    const scopedStorageKey = getScopedStorageKey(STORAGE_CHAT_KEY, tenantId);

    try {
      const storedValue =
        window.localStorage.getItem(scopedStorageKey) ??
        window.localStorage.getItem(STORAGE_CHAT_KEY);
      const baseConversations = storedValue
        ? (() => {
            const parsed = JSON.parse(storedValue) as unknown;
            return Array.isArray(parsed) && parsed.every(isConversationRecord)
              ? parsed.filter(
                  (conversation) =>
                    (conversation.tenantId ?? null) === tenantId
                )
              : createSeedConversations({ tenantId, session, projects });
          })()
        : createSeedConversations({ tenantId, session, projects });

      setConversations(
        deliverIncomingMessages(
          ensureChatCoverage({
            conversations: baseConversations,
            tenantId,
            session,
            projects
          }),
          currentUserId
        )
      );
    } catch {
      window.localStorage.removeItem(scopedStorageKey);
      setConversations(
        deliverIncomingMessages(
          createSeedConversations({
            tenantId,
            session,
            projects
          }),
          currentUserId
        )
      );
    } finally {
      setIsHydrated(true);
    }
  }, [currentRole, currentUserId, projects, session, tenantId]);

  useEffect(() => {
    if (!isHydrated || !currentRole) {
      return;
    }

    window.localStorage.setItem(
      getScopedStorageKey(STORAGE_CHAT_KEY, tenantId),
      JSON.stringify(conversations)
    );
  }, [conversations, currentRole, isHydrated, tenantId]);

  useEffect(() => {
    if (!currentRole) {
      return;
    }

    const scopedStorageKey = getScopedStorageKey(STORAGE_CHAT_KEY, tenantId);

    function handleStorage(event: StorageEvent) {
      if (event.key !== scopedStorageKey || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as unknown;

        if (Array.isArray(parsed) && parsed.every(isConversationRecord)) {
          setConversations(
            deliverIncomingMessages(
              ensureChatCoverage({
                conversations: parsed.filter(
                  (conversation) =>
                    (conversation.tenantId ?? null) === tenantId
                ),
                tenantId,
                session,
                projects
              }),
              currentUserId
            )
          );
        }
      } catch {
        // Ignore malformed external updates and keep local state stable.
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [currentRole, currentUserId, projects, session, tenantId]);

  const visibleConversations = useMemo(() => {
    if (!currentRole || !currentUserId) {
      return [];
    }

    return sortConversations(
      conversations.filter((conversation) =>
        currentRole === "LEADER"
          ? conversation.leaderId === currentUserId
          : conversation.consultantId === currentUserId
      )
    );
  }, [conversations, currentRole, currentUserId]);

  const totalUnreadCount = useMemo(() => {
    if (!currentRole) {
      return 0;
    }

    return visibleConversations.reduce(
      (total, conversation) => total + getViewerUnreadCount(conversation, currentRole),
      0
    );
  }, [currentRole, visibleConversations]);

  const value = useMemo<WorkspaceChatContextValue>(
    () => ({
      currentRole,
      currentUserId,
      conversations: visibleConversations,
      totalUnreadCount,
      isHydrated,
      getConversationUnreadCount(conversation) {
        if (!currentRole) {
          return 0;
        }

        return getViewerUnreadCount(conversation, currentRole);
      },
      getConversationCounterpartData(conversation) {
        return getConversationCounterpart(conversation, currentRole ?? "LEADER");
      },
      openConversation(conversationId) {
        if (!currentRole || !currentUserId) {
          return;
        }

        setConversations((currentConversations) =>
          currentConversations.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            return {
              ...conversation,
              unreadCountLeader: currentRole === "LEADER" ? 0 : conversation.unreadCountLeader,
              unreadCountConsultant:
                currentRole === "CONSULTANT" ? 0 : conversation.unreadCountConsultant,
              messages: conversation.messages.map((message) => {
                if (message.senderId === currentUserId || message.status === "seen") {
                  return message;
                }

                return {
                  ...message,
                  status: "seen" as const
                };
              })
            };
          })
        );
      },
      sendMessage(conversationId, text) {
        if (!currentRole || !currentUserId) {
          return;
        }

        const nextMessage = text.trim();

        if (!nextMessage) {
          return;
        }

        const createdAt = new Date().toISOString();
        const messageId = `${conversationId}-message-${Date.now()}`;

        setConversations((currentConversations) =>
          sortConversations(
            currentConversations.map((conversation) => {
              if (conversation.id !== conversationId) {
                return conversation;
              }

              return {
                ...conversation,
                lastMessageAt: createdAt,
                unreadCountLeader:
                  currentRole === "CONSULTANT"
                    ? conversation.unreadCountLeader + 1
                    : conversation.unreadCountLeader,
                unreadCountConsultant:
                  currentRole === "LEADER"
                    ? conversation.unreadCountConsultant + 1
                    : conversation.unreadCountConsultant,
                messages: [
                  ...conversation.messages,
                  {
                    id: messageId,
                    conversationId,
                    senderId: currentUserId,
                    senderRole: currentRole,
                    text: nextMessage,
                    createdAt,
                    status: "sent"
                  }
                ]
              };
            })
          )
        );

        const timeoutId = window.setTimeout(() => {
          setConversations((currentConversations) =>
            currentConversations.map((conversation) => {
              if (conversation.id !== conversationId) {
                return conversation;
              }

              return {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === messageId && message.status === "sent"
                    ? {
                        ...message,
                        status: "delivered" as const
                      }
                    : message
                )
              };
            })
          );
        }, 420);

        deliveryTimeoutsRef.current.push(timeoutId);
      }
    }),
    [currentRole, currentUserId, isHydrated, totalUnreadCount, visibleConversations]
  );

  return <WorkspaceChatContext.Provider value={value}>{children}</WorkspaceChatContext.Provider>;
}

export function useWorkspaceChat() {
  const context = useContext(WorkspaceChatContext);

  if (!context) {
    throw new Error("useWorkspaceChat must be used within WorkspaceChatProvider.");
  }

  return context;
}
