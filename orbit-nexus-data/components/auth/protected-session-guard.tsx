"use client";

import { useEffect } from "react";

import {
  clearBrowserSession,
  hasBrowserSession
} from "@/lib/auth/browser-session";

async function invalidateAndRedirect() {
  clearBrowserSession();

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
      keepalive: true
    });
  } catch {
    // Fallback redirect below still forces a fresh request to login.
  }

  window.location.replace("/login");
}

export function ProtectedSessionGuard() {
  useEffect(() => {
    if (!hasBrowserSession()) {
      void invalidateAndRedirect();
      return;
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
