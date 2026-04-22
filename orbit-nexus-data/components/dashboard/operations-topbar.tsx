import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { SearchBar } from "@/components/dashboard/search-bar";
import type { DashboardSearchItem } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

type OperationsTopbarProps = {
  session: SessionUser;
  searchItems: DashboardSearchItem[];
  headerActions?: ReactNode;
  showProfileCard?: boolean;
};

export function OperationsTopbar({
  session,
  searchItems,
  headerActions,
  showProfileCard = true
}: OperationsTopbarProps) {
  return (
    <header className="rounded-[1.75rem] border border-white/10 bg-slate-950/88 px-5 py-4 shadow-[0_24px_70px_rgba(2,6,23,0.4)] backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <SearchBar className="max-w-none" items={searchItems} variant="dark" />
        </div>

        <div
          className={cn(
            "flex flex-wrap gap-3",
            showProfileCard ? "items-center" : "items-stretch"
          )}
        >
          {headerActions}

          <div
            className={cn(
              "[&>button]:border-white/10 [&>button]:bg-white/[0.05] [&>button]:text-slate-200 [&>button]:hover:bg-white/[0.08]",
              !showProfileCard &&
                "[&>button]:h-16 [&>button]:min-w-[132px] [&>button]:rounded-[1.2rem] [&>button]:px-5"
            )}
          >
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
