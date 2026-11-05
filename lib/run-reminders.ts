// The "daily job": works out which reminders are due on `today` and writes
// them to the outbox (the reminders table). Nothing is really emailed.
import { db } from "./db";
import { buildReminderEmail } from "./email-templates";
import { formatMoney } from "./format";
import { queryInvoices } from "./invoices";
import { reminderDueToday } from "./reminder-rules";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const SENDER_NAME = process.env.SENDER_NAME ?? "Your Name";

export type RunResult = { invoiceNumber: string; clientName: string; subject: string }[];

export function runReminders(today: string): RunResult {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO reminders (invoice_id, kind, to_email, subject, body, sent_on)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const sent: RunResult = [];

  db.exec("BEGIN");
  try {
    for (const inv of queryInvoices("i.status = 'open'")) {
      const stage = reminderDueToday(inv, today, inv.sent_kinds);
      if (!stage) continue;

      const { subject, body } = buildReminderEmail({
        stage: stage.kind,
        today,
        clientName: inv.client_name,
        invoiceNumber: inv.number,
        amount: formatMoney(inv.amount_cents, inv.currency),
        dueDate: inv.due_date,
        payUrl: `${APP_URL}/pay/${inv.pay_token}`,
        senderName: SENDER_NAME,
      });

      const res = insert.run(inv.id, stage.kind, inv.client_email, subject, body, today);
      if (res.changes > 0) {
        sent.push({ invoiceNumber: inv.number, clientName: inv.client_name, subject });
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return sent;
}
