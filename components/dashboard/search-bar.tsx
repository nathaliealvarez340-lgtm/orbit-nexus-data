"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Input } from "@/components/ui/input";
import type { DashboardSearchItem } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  items: DashboardSearchItem[];
  className?: string;
  variant?: "default" | "compact" | "dark";
};

const groupLabels: Record<DashboardSearchItem["type"], string> = {
  project: "Proyectos",
  action: "Acciones",
  activity: "Actividad",
  user: "Usuarios"
};

const itemTypePills: Record<DashboardSearchItem["type"], string> = {
  project: "Proyecto",
  action: "Accion",
  activity: "Actividad",
  user: "Usuario"
};

const orderedGroups: DashboardSearchItem["type"][] = ["project", "action", "activity", "user"];

export function SearchBar({ items, className, variant = "default" }: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const isCompact = variant === "compact";
  const isDark = variant === "dark";

  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = normalizedQuery
    ? items.filter((item) =>
        [item.title, item.subtitle, ...item.keywords].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        )
      )
    : [];

  const groupedResults = orderedGroups
    .map((group) => ({
      type: group,
      label: groupLabels[group],
      items: filteredItems.filter((item) => item.type === group)
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !normalizedQuery) {
      return;
    }

    function updateDropdownPosition() {
      const rect = containerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setDropdownStyle({
        top: rect.bottom + (isDark || isCompact ? 9 : 12),
        left: rect.left,
        width: rect.width
      });
    }

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isCompact, isDark, isOpen, normalizedQuery]);

  function handleSelect(href: string) {
    setIsOpen(false);
    setQuery("");
    router.push(href as Route);
  }

  const showDropdown = isOpen && normalizedQuery.length > 0;

  return (
    <div ref={containerRef} className={cn("relative z-50 max-w-2xl", className)}>
      <Input
        aria-label="Buscar en dashboard"
        className={cn(
          "pl-4 pr-4 shadow-soft",
          isDark
            ? "h-11 rounded-[1.2rem] border-white/10 bg-white/[0.05] text-sm text-white placeholder:text-slate-500"
            : "border-white/80 bg-white/88",
          isCompact ? "h-11 rounded-[1.15rem] text-sm" : !isDark ? "h-12 rounded-2xl" : ""
        )}
        placeholder="Buscar proyectos, acciones o actividad..."
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;

          setQuery(nextValue);
          setIsOpen(nextValue.trim().length > 0);
        }}
        onFocus={() => {
          if (normalizedQuery) {
            setIsOpen(true);
          }
        }}
      />

      {showDropdown && dropdownStyle
        ? createPortal(
            <div
              ref={dropdownRef}
              className={cn(
                "fixed overflow-hidden border shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
                isDark
                  ? "rounded-[1.2rem] border-white/10 bg-slate-950 shadow-[0_24px_70px_rgba(2,6,23,0.56)]"
                  : "border-slate-200 bg-white",
                isCompact
                  ? "rounded-[1.25rem] shadow-[0_20px_44px_rgba(15,23,42,0.14)]"
                  : !isDark
                    ? "rounded-[1.5rem]"
                    : ""
              )}
              style={{
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
                zIndex: 300
              }}
            >
              {groupedResults.length ? (
                <div
                  className={cn(
                    "overflow-y-auto",
                    isDark
                      ? "max-h-[15rem] p-2"
                      : isCompact
                        ? "max-h-[19rem] p-2.5"
                        : "max-h-[28rem] p-3"
                  )}
                >
                  {groupedResults.map((group) => (
                    <div
                      key={group.type}
                      className={cn(
                        isDark
                          ? "border-b border-white/6 last:border-b-0"
                          : "border-b border-slate-100/90 last:border-b-0",
                        isCompact ? "px-1 py-1.5" : "px-1 py-2"
                      )}
                    >
                      <p
                        className={cn(
                          "font-semibold uppercase tracking-[0.2em]",
                          isDark ? "text-slate-500" : "text-slate-400",
                          isDark
                            ? "px-2.5 py-1.5 text-[10px]"
                            : isCompact
                              ? "px-2.5 py-1.5 text-[10px]"
                              : "px-3 py-2 text-xs"
                        )}
                      >
                        {group.label}
                      </p>

                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            className={cn(
                              "block w-full border border-transparent text-left transition-colors",
                              isDark
                                ? "rounded-xl px-3 py-2.5 hover:border-white/10 hover:bg-white/[0.05]"
                                : "hover:border-slate-200 hover:bg-slate-50",
                              isDark
                                ? ""
                                : isCompact
                                  ? "rounded-xl px-3 py-2.5"
                                  : "rounded-2xl px-3 py-3"
                            )}
                            type="button"
                            onClick={() => {
                              handleSelect(item.href);
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <p
                                  className={cn(
                                    "text-sm font-semibold",
                                    isDark ? "text-white" : "text-slate-900"
                                  )}
                                >
                                  {item.title}
                                </p>
                                <p
                                  className={cn(
                                    isDark ? "text-slate-400" : "text-slate-500",
                                    isCompact ? "text-xs leading-5" : "text-sm leading-6"
                                  )}
                                >
                                  {item.subtitle}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "rounded-full font-semibold uppercase tracking-[0.18em]",
                                  isDark
                                    ? "bg-white/8 text-slate-300"
                                    : "bg-slate-100 text-slate-600",
                                  isDark || isCompact
                                    ? "px-2.5 py-1 text-[10px]"
                                    : "px-3 py-1 text-[11px]"
                                )}
                              >
                                {itemTypePills[group.type]}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    isDark ? "px-4 py-4 text-sm text-slate-400" : "text-slate-500",
                    !isDark && (isCompact ? "px-4 py-4 text-sm" : "px-5 py-6 text-sm")
                  )}
                >
                  Sin resultados
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
