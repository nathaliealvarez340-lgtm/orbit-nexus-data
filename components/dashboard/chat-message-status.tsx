import { Check, CheckCheck } from "lucide-react";

import type { WorkspaceChatMessageStatus } from "@/lib/dashboard/chat-data";
import { cn } from "@/lib/utils";

type ChatMessageStatusProps = {
  status: WorkspaceChatMessageStatus;
  className?: string;
};

export function ChatMessageStatus({ status, className }: ChatMessageStatusProps) {
  if (status === "sent") {
    return <Check className={cn("h-3.5 w-3.5", className)} />;
  }

  return (
    <CheckCheck
      className={cn(
        "h-3.5 w-3.5",
        status === "seen" ? "text-cyan-300" : undefined,
        className
      )}
    />
  );
}
