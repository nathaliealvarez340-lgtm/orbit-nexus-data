"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      onClick={() =>
        startTransition(async () => {
          try {
            const response = await fetch("/api/auth/logout", {
              method: "POST",
              cache: "no-store",
              keepalive: true
            });

            if (response.ok) {
              window.location.replace("/login");
              return;
            }
          } catch {
            // Fallback below will force a fresh request against the current route.
          }

          window.location.reload();
        })
      }
      disabled={isPending}
    >
      {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
