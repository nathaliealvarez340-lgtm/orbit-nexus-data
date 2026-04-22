export const BROWSER_SESSION_STORAGE_KEY = "orbit_nexus_browser_session";

export function setBrowserSession(accessCode: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(BROWSER_SESSION_STORAGE_KEY, accessCode);
}

export function clearBrowserSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(BROWSER_SESSION_STORAGE_KEY);
}

export function hasBrowserSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.sessionStorage.getItem(BROWSER_SESSION_STORAGE_KEY));
}
