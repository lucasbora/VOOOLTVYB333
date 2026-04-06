// Cookie-based user activity and preference tracker.
// Uses document.cookie directly (no localStorage).

const COOKIE_DAYS = 365;

function setCookie(name: string, value: string, days = COOKIE_DAYS): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Updated on every route change. */
export function trackPageVisit(pathname: string): void {
  setCookie('last_visited_page', pathname);
}

/** Updated when user filters by category in the Catalog. */
export function trackPreferredCategory(category: string): void {
  setCookie('preferred_category', category);
}

/** Set once the first time the app loads in this browser. */
export function initSession(): void {
  if (!getCookie('session_start')) {
    setCookie('session_start', new Date().toISOString());
  }
}
