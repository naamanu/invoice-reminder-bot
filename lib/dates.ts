// All dates in the app are plain local calendar dates: "YYYY-MM-DD".

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA"); // en-CA formats as YYYY-MM-DD
}

export function isISODate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Rejects things like 2026-02-31 that Date would silently roll over.
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function toUTC(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function addDays(s: string, n: number): string {
  return new Date(toUTC(s) + n * 86_400_000).toISOString().slice(0, 10);
}

export function formatDate(s: string): string {
  return new Date(toUTC(s)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
