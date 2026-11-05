// "Today" for the whole app. Normally the real date, but for testing you can
// pretend it's another day (stored in a cookie) to see future reminders fire.
import { cookies } from "next/headers";
import { connection } from "next/server";
import { isISODate, todayISO } from "./dates";

export const SIM_COOKIE = "sim_today";

export async function getSimulatedDate(): Promise<string | null> {
  await connection(); // "today" (cookie or clock) is per request, never prerendered
  const value = (await cookies()).get(SIM_COOKIE)?.value;
  return value && isISODate(value) ? value : null;
}

export async function getToday(): Promise<string> {
  return (await getSimulatedDate()) ?? todayISO();
}
