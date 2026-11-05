"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isISODate } from "@/lib/dates";
import { clearOutbox } from "@/lib/outbox";
import { runReminders, type RunResult } from "@/lib/run-reminders";
import { getToday, SIM_COOKIE } from "@/lib/today";

export type RunState = { ranFor?: string; sent?: RunResult; at?: number };

export async function runRemindersAction(): Promise<RunState> {
  const today = await getToday();
  const sent = runReminders(today);
  revalidatePath("/", "layout"); // outbox + invoices "next reminder" column
  return { ranFor: today, sent, at: Date.now() };
}

export async function setSimulatedDate(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const jar = await cookies();
  // Note: the button is not named "reset" — that would shadow form.reset(), which React calls after an action.
  if (formData.get("mode") === "real" || !isISODate(date)) {
    jar.delete(SIM_COOKIE);
  } else {
    jar.set(SIM_COOKIE, date, { path: "/", sameSite: "lax", httpOnly: true });
  }
  revalidatePath("/", "layout");
}

export async function clearOutboxAction() {
  clearOutbox();
  revalidatePath("/", "layout");
}
