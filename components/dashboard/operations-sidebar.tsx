"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings,
  UserCircle,
  X
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import { useLanguage } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

type OperationsSidebarItem = {
  label: string;
  href: string;
  badge?: string;
  active?: boolean;
};

type OperationsSidebarProps = {
  roleLabel: string;
  accessCode: string;
  ownerName: string;
  items: OperationsSidebarItem[];
};

type SidebarLink = {
  labelKey: TranslationKey;
  href: string;
};

type SidebarGroup = {
  id: string;
  labelKey: TranslationKey;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  children?: SidebarLink[];
};

const sidebarGroups: SidebarGroup[] = [
  {
    id: "dashboard",
    labelKey: "workspace.sidebar.dashboard",
    icon: LayoutDashboard,
    href: "/workspace"
  },
  {
    id: "notifications",
    labelKey: "workspace.sidebar.notifications",
    icon: Bell,
    children: [
      { labelKey: "workspace.sidebar.gmail", href: "/workspace/integrations?provider=gmail" },
      { labelKey: "workspace.sidebar.orbit", href: "/workspace/alerts" }
    ]
  },
  {
    id: "quotes",
    labelKey: "workspace.sidebar.quotes",
    icon: FileText,
    children: [
      { labelKey: "workspace.sidebar.newQuote", href: "/workspace/quotes?maiaAction=new_quote" },
      { labelKey: "workspace.sidebar.completedQuotes", href: "/workspace/quotes" },
      { labelKey: "workspace.sidebar.drafts", href: "/workspace/quotes?status=draft" },
      { labelKey: "workspace.sidebar.deletedQuotes", href: "/workspace/quotes?status=deleted" }
    ]
  },
  {
    id: "billing",
    labelKey: "workspace.sidebar.billing",
    icon: ReceiptText,
    children: [
      { labelKey: "workspace.sidebar.newInvoice", href: "/workspace/invoices?mode=new" },
      { labelKey: "workspace.sidebar.issuedCfdi", href: "/workspace/invoices?status=stamped" },
      { labelKey: "workspace.sidebar.inProgress", href: "/workspace/invoices?status=pending" },
      { labelKey: "workspace.sidebar.deletedCfdi", href: "/workspace/invoices?status=deleted" }
    ]
  },
  {
    id: "information",
    labelKey: "workspace.sidebar.information",
    icon: UserCircle,
    children: [
      { labelKey: "workspace.sidebar.companyClient", href: "/workspace/clients" },
      { labelKey: "workspace.sidebar.tasks", href: "/workspace/tasks" },
      { labelKey: "workspace.sidebar.reports", href: "/workspace/reports" }
    ]
  }
];

const bottomLinks: SidebarLink[] = [
  { labelKey: "workspace.sidebar.settings", href: "/workspace/tax-profile" },
  { labelKey: "workspace.sidebar.account", href: "/workspace" }
];

function stripQuery(href: string) {
  return href.split("?")[0] ?? href;
}

function isRouteActive(pathname: string, href: string) {
  const route = stripQuery(href);

  if (route === "/workspace") {
    return pathname === "/workspace";
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

function getGroupActive(pathname: string, group: SidebarGroup) {
  if (group.href) {
    return isRouteActive(pathname, group.href);
  }

  return group.children?.some((item) => isRouteActive(pathname, item.href)) ?? false;
}

function SidebarItemGlow({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
        "bg-[linear-gradient(135deg,rgba(93,224,230,0.18),rgba(0,74,173,0.14),rgba(255,255,255,0.035))]",
        "shadow-[0_16px_44px_rgba(0,74,173,0.16)]",
        active ? "opacity-100" : "group-hover:opacity-100"
      )}
    />
  );
}

function SidebarContent({
  accessCode,
  items,
  ownerName,
  roleLabel,
  onNavigate
}: OperationsSidebarProps & { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const badgeLookup = useMemo(
    () => new Map(items.map((item) => [item.href, item.badge])),
    [items]
  );
  const initiallyOpen = useMemo(() => {
    const activeGroups = sidebarGroups
      .filter((group) => group.children?.length && getGroupActive(pathname, group))
      .map((group) => group.id);

    return activeGroups.length ? activeGroups : ["quotes"];
  }, [pathname]);
  const [openGroups, setOpenGroups] = useState<string[]>(initiallyOpen);

  useEffect(() => {
    setOpenGroups((current) => {
      const next = new Set(current);

      sidebarGroups.forEach((group) => {
        if (group.children?.length && getGroupActive(pathname, group)) {
          next.add(group.id);
        }
      });

      return Array.from(next);
    });
  }, [pathname]);

  function toggleGroup(groupId: string) {
    setOpenGroups((current) =>
      current.includes(groupId)
        ? current.filter((item) => item !== groupId)
        : [...current, groupId]
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-4">
        <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">Orbit Nexus</Badge>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
            {t("workspace.sidebar.system")}
          </p>
          <h2 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-tight text-white">
            {ownerName}
          </h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {roleLabel}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {t("workspace.sidebar.code")}
        </p>
        <p className="mt-2 font-semibold text-cyan-300">{accessCode}</p>
        <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-400">
          {t("workspace.sidebar.protected")}
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {sidebarGroups.map((group) => {
          const Icon = group.icon;
          const isActive = getGroupActive(pathname, group);
          const isOpen = openGroups.includes(group.id);
          const groupBadge = group.href ? badgeLookup.get(group.href) : undefined;

          if (group.href) {
            return (
              <Link
                key={group.id}
                className={cn(
                  "group relative flex items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold tracking-[0.04em] outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                  isActive ? "text-white" : "text-slate-300 hover:text-white"
                )}
                href={group.href as Route}
                onClick={onNavigate}
              >
                <SidebarItemGlow active={isActive} />
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-cyan-300 transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                  )}
                />
                <span className="relative z-10 flex items-center gap-3">
                  <Icon className="h-4 w-4 text-cyan-200" />
                  {t(group.labelKey)}
                </span>
                {groupBadge ? (
                  <span className="relative z-10 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                    {groupBadge}
                  </span>
                ) : null}
              </Link>
            );
          }

          return (
            <div key={group.id} className="space-y-1">
              <button
                className={cn(
                  "group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-left text-sm font-semibold tracking-[0.04em] outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                  isActive || isOpen ? "text-white" : "text-slate-300 hover:text-white"
                )}
                type="button"
                onClick={() => toggleGroup(group.id)}
              >
                <SidebarItemGlow active={isActive || isOpen} />
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-cyan-300 transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                  )}
                />
                <span className="relative z-10 flex items-center gap-3">
                  <Icon className="h-4 w-4 text-cyan-200" />
                  {t(group.labelKey)}
                </span>
                <ChevronDown
                  className={cn(
                    "relative z-10 h-4 w-4 text-slate-400 transition-transform duration-300",
                    isOpen && "rotate-180 text-cyan-200"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    className="overflow-hidden"
                    exit={{ height: 0, opacity: 0, y: -6 }}
                    initial={{ height: 0, opacity: 0, y: -6 }}
                    transition={{ duration: 0.24, ease: "easeInOut" }}
                  >
                    <div className="space-y-1 py-1 pl-5">
                      {group.children?.map((item) => {
                        const active = isRouteActive(pathname, item.href);

                        return (
                          <Link
                            key={item.href}
                            className={cn(
                              "group relative block overflow-hidden rounded-2xl px-4 py-2.5 text-sm outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-300/45",
                              active ? "text-cyan-100" : "text-slate-400 hover:text-white"
                            )}
                            href={item.href as Route}
                            onClick={onNavigate}
                          >
                            <SidebarItemGlow active={active} />
                            <span className="relative z-10">{t(item.labelKey)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 pt-4">
        {bottomLinks.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = item.labelKey === "workspace.sidebar.settings" ? Settings : UserCircle;

          return (
            <Link
              key={item.labelKey}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold tracking-[0.04em] outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                active ? "text-white" : "text-slate-300 hover:text-white"
              )}
              href={item.href as Route}
              onClick={onNavigate}
            >
              <SidebarItemGlow active={active} />
              <Icon className="relative z-10 h-4 w-4 text-cyan-200" />
              <span className="relative z-10">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function OperationsSidebar(props: OperationsSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-[170] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/88 text-cyan-100 shadow-[0_16px_44px_rgba(2,6,23,0.45)] backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-500/10 xl:hidden"
        type="button"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className="hidden xl:block xl:w-[19.5rem] xl:shrink-0 xl:self-stretch">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-md">
          <SidebarContent {...props} />
        </div>
      </aside>

      <AnimatePresence>
        {isMobileOpen ? (
          <>
            <motion.button
              animate={{ opacity: 1 }}
              aria-label="Cerrar navegación"
              className="fixed inset-0 z-[190] bg-slate-950/70 backdrop-blur-sm xl:hidden"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              type="button"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              animate={{ x: 0, opacity: 1 }}
              className="fixed bottom-3 left-3 top-3 z-[200] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/94 p-5 shadow-[0_28px_90px_rgba(2,6,23,0.62)] backdrop-blur-xl xl:hidden"
              exit={{ x: -28, opacity: 0 }}
              initial={{ x: -28, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <button
                className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/[0.05] p-2 text-slate-200 transition hover:bg-white/[0.09]"
                type="button"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent {...props} onNavigate={() => setIsMobileOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
