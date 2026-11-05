// Pure reminder schedule logic — no database, no Next.js — so it's easy to test.
// (The .ts extension lets Node's test runner import it directly.)
import { addDays, daysBetween } from "./dates.ts";

/** Reminder stages, in order. `offset` = days relative to the due date. */
export const STAGES = [
  { kind: "before_3", offset: -3, label: "3 days before due" },
  { kind: "due", offset: 0, label: "On the due date" },
  { kind: "after_3", offset: 3, label: "3 days overdue" },
  { kind: "after_7", offset: 7, label: "7 days overdue" },
  { kind: "after_14", offset: 14, label: "14 days overdue" },
] as const;

export type Stage = (typeof STAGES)[number];
export type StageKind = Stage["kind"];

type InvoiceLike = { status: "open" | "paid"; due_date: string };

/**
 * Which reminder (if any) should go out today.
 *
 * Rule: find the latest stage whose day has arrived. Send it unless it was
 * already sent. If the bot didn't run for a while, it does NOT fire every
 * missed stage at once — only the most recent one — so the client gets a
 * single email, not a pile of them.
 */
export function reminderDueToday(
  invoice: InvoiceLike,
  today: string,
  sentKinds: Iterable<string>,
): Stage | null {
  if (invoice.status === "paid") return null;

  const daysPastDue = daysBetween(invoice.due_date, today); // negative = not due yet
  const latest = STAGES.findLast((s) => s.offset <= daysPastDue);
  if (!latest) return null; // too early for any reminder

  const sent = new Set(sentKinds);
  return sent.has(latest.kind) ? null : latest;
}

/** The next reminder that will go out and on what date, or null if none are left. */
export function nextReminder(
  invoice: InvoiceLike,
  today: string,
  sentKinds: Iterable<string>,
): { stage: Stage; date: string } | null {
  if (invoice.status === "paid") return null;

  const now = reminderDueToday(invoice, today, sentKinds);
  if (now) return { stage: now, date: today };

  const daysPastDue = daysBetween(invoice.due_date, today);
  const upcoming = STAGES.find((s) => s.offset > daysPastDue);
  return upcoming ? { stage: upcoming, date: addDays(invoice.due_date, upcoming.offset) } : null;
}
