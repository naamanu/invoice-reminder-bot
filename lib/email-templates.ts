// Reminder email text. Tone gets firmer with each stage but stays polite.
import { daysBetween, formatDate } from "./dates.ts";
import type { StageKind } from "./reminder-rules.ts";

export type EmailInput = {
  stage: StageKind;
  today: string;
  clientName: string;
  invoiceNumber: string;
  amount: string; // already formatted, e.g. "$1,200.00"
  dueDate: string; // YYYY-MM-DD
  payUrl: string;
  senderName: string;
};

export function buildReminderEmail(e: EmailInput): { subject: string; body: string } {
  const due = formatDate(e.dueDate);
  const diff = daysBetween(e.today, e.dueDate); // >0 not due yet, <0 overdue
  const late = -diff;
  const plural = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

  let subject: string;
  let opening: string;

  switch (e.stage) {
    case "before_3":
      subject = `Friendly reminder: invoice ${e.invoiceNumber} is due ${due}`;
      opening = `Just a friendly heads-up that invoice ${e.invoiceNumber} for ${e.amount} is due in ${plural(diff)}, on ${due}.`;
      break;
    case "due":
      subject = `Invoice ${e.invoiceNumber} is due ${diff === 0 ? "today" : due}`;
      opening =
        diff === 0
          ? `This is a reminder that invoice ${e.invoiceNumber} for ${e.amount} is due today (${due}).`
          : `Invoice ${e.invoiceNumber} for ${e.amount} was due on ${due}.`;
      break;
    case "after_3":
      subject = `Invoice ${e.invoiceNumber} is now overdue`;
      opening = `Invoice ${e.invoiceNumber} for ${e.amount} was due on ${due} and is now ${plural(late)} overdue. It may have slipped through the cracks — no worries if so.`;
      break;
    case "after_7":
      subject = `Second notice: invoice ${e.invoiceNumber} is ${plural(late)} overdue`;
      opening = `I'm following up on invoice ${e.invoiceNumber} for ${e.amount}, which was due on ${due} and is now ${plural(late)} overdue. Could you let me know when I can expect payment?`;
      break;
    case "after_14":
      subject = `Final reminder: invoice ${e.invoiceNumber} is ${plural(late)} overdue`;
      opening = `This is my final automated reminder about invoice ${e.invoiceNumber} for ${e.amount}, due on ${due} and now ${plural(late)} overdue. Please arrange payment as soon as possible, or reply if there's an issue I can help with.`;
      break;
  }

  const body = [
    `Hi ${e.clientName},`,
    "",
    opening,
    "",
    `Already paid? Let me know with one click and the reminders will stop:`,
    e.payUrl,
    "",
    "Thanks,",
    e.senderName,
  ].join("\n");

  return { subject, body };
}
