import { Suspense } from "react";
import { listClients } from "@/lib/clients";
import { addDays, formatDate } from "@/lib/dates";
import { getToday } from "@/lib/today";
import { formatMoney } from "@/lib/format";
import { invoiceStatus, listInvoices, type InvoiceStatus } from "@/lib/invoices";
import { nextReminder } from "@/lib/reminder-rules";
import { AddInvoiceForm } from "./add-invoice-form";
import { markPaidAction, reopenAction } from "./actions";

export const metadata = { title: "Invoices · Invoice Reminder Bot" };

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading invoices…</p>}>
        <InvoicesContent />
      </Suspense>
    </div>
  );
}

async function InvoicesContent() {
  const [clients, invoices] = await Promise.all([listClients(), listInvoices()]);
  const today = await getToday(); // real date, or the "pretend today" from the Outbox page

  return (
    <>
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">Add an invoice</h2>
        <AddInvoiceForm
          clients={clients.map(({ id, name }) => ({ id, name }))}
          defaultDueDate={addDays(today, 14)}
        />
      </section>

      {invoices.length === 0 ? (
        <p className="text-sm text-zinc-500">No invoices yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="py-2 font-medium">Invoice</th>
                <th className="py-2 font-medium">Client</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 pl-6 font-medium">Due</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Next reminder</th>
                <th className="py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 font-mono text-xs">{inv.number}</td>
                  <td className="py-2">{inv.client_name}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMoney(inv.amount_cents, inv.currency)}
                  </td>
                  <td className="py-2 pl-6 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                  <td className="py-2">
                    <StatusBadge status={invoiceStatus(inv, today)} />
                  </td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">
                    <NextReminderCell next={nextReminder(inv, today, inv.sent_kinds)} today={today} />
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <form action={(inv.status === "open" ? markPaidAction : reopenAction).bind(null, inv.id)}>
                      <button
                        type="submit"
                        className={
                          inv.status === "open"
                            ? "whitespace-nowrap rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                            : "whitespace-nowrap text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
                        }
                      >
                        {inv.status === "open" ? "Mark paid" : "Undo"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function NextReminderCell({
  next,
  today,
}: {
  next: ReturnType<typeof nextReminder>;
  today: string;
}) {
  if (!next) return <span>—</span>;
  const when = next.date === today ? "Today" : formatDate(next.date);
  return (
    <span className="whitespace-nowrap">
      <span className={next.date === today ? "font-medium text-zinc-900 dark:text-zinc-100" : ""}>
        {when}
      </span>
      {" · "}
      {next.stage.label}
    </span>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const [label, color] = (() => {
    switch (status.kind) {
      case "paid":
        return ["Paid", "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"];
      case "upcoming":
        return [
          `Due in ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"}`,
          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        ];
      case "due_today":
        return ["Due today", "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"];
      case "overdue":
        return [
          `${status.daysLate} day${status.daysLate === 1 ? "" : "s"} overdue`,
          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
        ];
    }
  })();
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
