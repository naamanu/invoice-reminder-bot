// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextReminder, reminderDueToday } from "./reminder-rules.ts";

const DUE = "2026-06-15";
type Inv = { status: "open" | "paid"; due_date: string };
const open: Inv = { status: "open", due_date: DUE };
const paid: Inv = { status: "paid", due_date: DUE };

// Shorthand: which stage kind is due on `today`, given already-sent kinds.
const dueOn = (today: string, sent: string[] = [], inv = open) =>
  reminderDueToday(inv, today, sent)?.kind ?? null;

test("nothing is sent more than 3 days before the due date", () => {
  assert.equal(dueOn("2026-06-01"), null);
  assert.equal(dueOn("2026-06-11"), null); // 4 days before
});

test("each stage fires on its day", () => {
  assert.equal(dueOn("2026-06-12"), "before_3");
  assert.equal(dueOn("2026-06-15", ["before_3"]), "due");
  assert.equal(dueOn("2026-06-18", ["before_3", "due"]), "after_3");
  assert.equal(dueOn("2026-06-22", ["before_3", "due", "after_3"]), "after_7");
  assert.equal(dueOn("2026-06-29", ["before_3", "due", "after_3", "after_7"]), "after_14");
});

test("a stage already sent is not sent again", () => {
  assert.equal(dueOn("2026-06-12", ["before_3"]), null);
  assert.equal(dueOn("2026-06-13", ["before_3"]), null); // between stages
  assert.equal(dueOn("2026-06-15", ["before_3", "due"]), null);
});

test("catching up sends only the most recent missed stage", () => {
  // Bot didn't run for weeks: one 14-day email, not five emails.
  assert.equal(dueOn("2026-07-01"), "after_14");
  // Invoice added 2 days before due: still gets the "coming up" reminder.
  assert.equal(dueOn("2026-06-13"), "before_3");
  // Missed the due date by a day.
  assert.equal(dueOn("2026-06-16", ["before_3"]), "due");
});

test("nothing is sent after the last stage", () => {
  const all = ["before_3", "due", "after_3", "after_7", "after_14"];
  assert.equal(dueOn("2026-08-01", all), null);
  assert.equal(dueOn("2026-08-01", ["after_14"]), null);
});

test("paid invoices never get reminders", () => {
  assert.equal(dueOn("2026-06-12", [], paid), null);
  assert.equal(dueOn("2026-07-01", [], paid), null);
});

test("nextReminder reports what comes next and when", () => {
  assert.deepEqual(summary(nextReminder(open, "2026-06-01", [])), ["before_3", "2026-06-12"]);
  assert.deepEqual(summary(nextReminder(open, "2026-06-12", [])), ["before_3", "2026-06-12"]); // today
  assert.deepEqual(summary(nextReminder(open, "2026-06-12", ["before_3"])), ["due", "2026-06-15"]);
  assert.deepEqual(summary(nextReminder(open, "2026-06-24", ["after_7"])), ["after_14", "2026-06-29"]);
  assert.equal(nextReminder(open, "2026-07-01", ["after_14"]), null);
  assert.equal(nextReminder(paid, "2026-06-01", []), null);
});

function summary(r: ReturnType<typeof nextReminder>) {
  return r ? [r.stage.kind, r.date] : null;
}
