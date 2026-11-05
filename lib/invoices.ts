import { randomBytes } from "node:crypto";
import { connection } from "next/server";
import { db, type Invoice } from "./db";
import { daysBetween } from "./dates";

export type InvoiceRow = Invoice & {
  client_name: string;
  client_email: string;
  sent_kinds: string[]; // reminder stages already sent for this invoice
};

export type InvoiceStatus =
  | { kind: "paid" }
  | { kind: "upcoming"; daysLeft: number }
  | { kind: "due_today" }
  | { kind: "overdue"; daysLate: number };

export function invoiceStatus(inv: Pick<Invoice, "status" | "due_date">, today: string): InvoiceStatus {
  if (inv.status === "paid") return { kind: "paid" };
  const diff = daysBetween(today, inv.due_date);
  if (diff > 0) return { kind: "upcoming", daysLeft: diff };
  if (diff === 0) return { kind: "due_today" };
  return { kind: "overdue", daysLate: -diff };
}

/**
 * Invoices with client info and sent reminder stages.
 * `where` is a fixed SQL snippet written in code; pass user values via `params` (? placeholders).
 */
export function queryInvoices(where = "1 = 1", ...params: (string | number)[]): InvoiceRow[] {
  const rows = db
    .prepare(
      `SELECT i.*, c.name AS client_name, c.email AS client_email,
              (SELECT GROUP_CONCAT(r.kind) FROM reminders r WHERE r.invoice_id = i.id) AS sent_kinds
         FROM invoices i
         JOIN clients c ON c.id = i.client_id
        WHERE ${where}
        ORDER BY (i.status = 'paid'), i.due_date, i.id`,
    )
    .all(...params) as (Omit<InvoiceRow, "sent_kinds"> & { sent_kinds: string | null })[];
  return rows.map((r) => ({ ...r, sent_kinds: r.sent_kinds ? r.sent_kinds.split(",") : [] }));
}

export async function listInvoices(): Promise<InvoiceRow[]> {
  await connection(); // synchronous driver: opt out of prerendering
  return queryInvoices();
}

/** Look up an invoice by its secret "mark as paid" token. */
export async function findInvoiceByToken(token: string): Promise<InvoiceRow | null> {
  await connection(); // synchronous driver: opt out of prerendering
  return queryInvoices("i.pay_token = ?", token)[0] ?? null;
}

/** Mark paid. Returns false if it was already paid or doesn't exist. */
export function markInvoicePaid(where: { id: number } | { token: string }): boolean {
  const [col, value] = "id" in where ? ["id", where.id] : ["pay_token", where.token];
  const res = db
    .prepare(
      `UPDATE invoices SET status = 'paid', paid_at = datetime('now')
        WHERE ${col} = ? AND status = 'open'`,
    )
    .run(value);
  return res.changes > 0;
}

/** Undo a "paid" by mistake. Reminders already sent stay in the outbox and won't repeat. */
export function reopenInvoice(id: number): void {
  db.prepare(`UPDATE invoices SET status = 'open', paid_at = NULL WHERE id = ?`).run(id);
}

export function clientExists(id: number): boolean {
  return db.prepare("SELECT 1 FROM clients WHERE id = ?").get(id) !== undefined;
}

/** Next number in the INV-001, INV-002, … sequence. */
function nextInvoiceNumber(): string {
  const row = db
    .prepare(
      `SELECT COALESCE(MAX(CAST(SUBSTR(number, 5) AS INTEGER)), 0) AS n
         FROM invoices WHERE number LIKE 'INV-%'`,
    )
    .get() as { n: number };
  return `INV-${String(row.n + 1).padStart(3, "0")}`;
}

export function createInvoice(input: {
  clientId: number;
  amountCents: number;
  dueDate: string;
}): string {
  const number = nextInvoiceNumber();
  db.prepare(
    `INSERT INTO invoices (client_id, number, amount_cents, due_date, pay_token)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(input.clientId, number, input.amountCents, input.dueDate, randomBytes(16).toString("hex"));
  return number;
}
