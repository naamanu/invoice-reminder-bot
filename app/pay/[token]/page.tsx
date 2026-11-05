// The page a client lands on from the "Already paid?" link in a reminder email.
// Opening the link does NOT mark anything paid — email scanners and link
// previews open links automatically. The client has to click the button.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { findInvoiceByToken } from "@/lib/invoices";
import { confirmPaid } from "./actions";

export const metadata = { title: "Confirm payment" };

export default function PayPage({ params }: PageProps<"/pay/[token]">) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 pt-8">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <PayContent params={params} />
      </Suspense>
    </div>
  );
}

async function PayContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await findInvoiceByToken(token);
  if (!invoice) notFound();

  const amount = formatMoney(invoice.amount_cents, invoice.currency);

  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">Invoice {invoice.number}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{amount}</p>
      <p className="mt-1 text-sm text-zinc-500">
        For {invoice.client_name} · due {formatDate(invoice.due_date)}
      </p>

      {invoice.status === "paid" ? (
        <p role="status" className="mt-6 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Thanks — this invoice is marked as paid. You won&apos;t get any more reminders about it.
        </p>
      ) : (
        <form action={confirmPaid.bind(null, token)} className="mt-6 flex flex-col gap-3">
          <p className="text-sm">
            Already sent the payment? Confirm below and the reminders will stop.
          </p>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Yes, I&apos;ve paid this invoice
          </button>
        </form>
      )}
    </div>
  );
}
