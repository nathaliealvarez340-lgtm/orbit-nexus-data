"use client";

import type { Route } from "next";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  getNotificationCategoryLabel,
  type LeaderNotification
} from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils";

type LeaderNotificationsProps = {
  notifications: LeaderNotification[];
};

const categoryStyles = {
  critical: "bg-rose-500/12 text-rose-300",
  follow_up: "bg-amber-500/12 text-amber-300",
  activity: "bg-cyan-500/12 text-cyan-300",
  assignment: "bg-violet-500/12 text-violet-300",
  validation: "bg-sky-500/12 text-sky-300"
} as const;

const priorityBorderStyles = {
  high: "border-rose-500/20",
  medium: "border-amber-500/20",
  low: "border-white/10"
} as const;

export function LeaderNotifications({ notifications }: LeaderNotificationsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  function handleNotificationClick(href?: string) {
    setIsOpen(false);

    if (href) {
      router.push(href as Route);
    }
  }

  return (
    <>
      <Button
        aria-label="Abrir notificaciones"
        className="relative h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 shadow-[0_14px_35px_rgba(2,6,23,0.28)] hover:border-cyan-400/30 hover:bg-white/[0.08]"
        size="icon"
        type="button"
        variant="outline"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </Button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[220]">
              <button
                aria-label="Cerrar notificaciones"
                className="absolute inset-0 bg-slate-950/72 backdrop-blur-[2px]"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                }}
              />

              <aside className="absolute right-4 top-4 z-[221] h-[calc(100vh-2rem)] w-full max-w-[25rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_36px_120px_rgba(2,6,23,0.62)]">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-slate-950 px-5 py-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                      Centro de notificaciones
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Seguimiento del lider</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Alertas, seguimiento y actividad reciente del portafolio en un solo panel.
                    </p>
                  </div>

                  <Button
                    className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {notifications.length ? (
                  <div className="h-[calc(100%-7rem)] overflow-y-auto px-4 py-4">
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          className={cn(
                            "w-full rounded-[1.5rem] border bg-white/[0.03] px-4 py-4 text-left transition-colors hover:bg-white/[0.05]",
                            priorityBorderStyles[notification.priority]
                          )}
                          type="button"
                          onClick={() => {
                            handleNotificationClick(notification.href);
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-white">{notification.title}</p>
                                {notification.unread ? (
                                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
                                ) : null}
                              </div>
                              <p className="text-sm leading-6 text-slate-400">{notification.description}</p>
                            </div>

                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                                categoryStyles[notification.category]
                              )}
                            >
                              {getNotificationCategoryLabel(notification.category)}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            <div className="flex flex-wrap items-center gap-3">
                              <span>{notification.timestamp}</span>
                              {notification.projectFolio ? <span>{notification.projectFolio}</span> : null}
                              {notification.relatedLabel ? <span>{notification.relatedLabel}</span> : null}
                            </div>
                            {notification.ctaLabel ? (
                              <span className="text-cyan-300">{notification.ctaLabel}</span>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-white">Todo en orden</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      No hay notificaciones pendientes para este frente operativo.
                    </p>
                  </div>
                )}
              </aside>
            </div>,
            document.body
          )
        : null}
    </>
  );
}