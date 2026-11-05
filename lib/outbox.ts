import { connection } from "next/server";
import { db, type Reminder } from "./db";

export type OutboxRow = Reminder & { invoice_number: string; client_name: string };

export async function listOutbox(): Promise<OutboxRow[]> {
  await connection(); // synchronous driver: opt out of prerendering
  return db
    .prepare(
      `SELECT r.*, i.number AS invoice_number, c.name AS client_name
         FROM reminders r
         JOIN invoices i ON i.id = r.invoice_id
         JOIN clients  c ON c.id = i.client_id
        ORDER BY r.sent_on DESC, r.id DESC`,
    )
    .all() as OutboxRow[];
}

export function clearOutbox(): void {
  db.exec("DELETE FROM reminders");
}
