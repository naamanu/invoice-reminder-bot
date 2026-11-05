import { Suspense } from "react";
import { formatDate, todayISO } from "@/lib/dates";
import { listOutbox } from "@/lib/outbox";
import { getSimulatedDate } from "@/lib/today";
import { clearOutboxAction, setSimulatedDate } from "./actions";
import { RunButton } from "./run-button";

export const metadata = { title: "Outbox · Invoice Reminder Bot" };

const secondaryButton =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900";

export default function OutboxPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Outbox</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Emails the bot would send. Nothing leaves your machine.
        </p>
      </div>

      <section className="flex flex-col gap-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <Suspense fallback={null}>
          <DateControl />
        </Suspense>
        <RunButton />
      </section>

      <Suspense fallback={<p className="text-sm text-zinc-500">Loading outbox…</p>}>
        <OutboxList />
      </Suspense>
    </div>
  );
}

async function DateControl() {
  const simulated = await getSimulatedDate();
  return (
    <form action={setSimulatedDate} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex flex-col gap-1 text-sm">
        Pretend today is
        <input
          type="date"
          name="date"
          defaultValue={simulated ?? todayISO()}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>
      <button type="submit" className={secondaryButton}>
        Set date
      </button>
      {simulated && (
        <button type="submit" name="mode" value="real" className={secondaryButton}>
          Back to real today
        </button>
      )}
    </form>
  );
}

async function OutboxList() {
  const emails = await listOutbox();

  if (emails.length === 0) {
    return <p className="text-sm text-zinc-500">The outbox is empty. Run reminders to fill it.</p>;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500">
          {emails.length} email{emails.length === 1 ? "" : "s"}
        </h2>
        <form action={clearOutboxAction}>
          <button type="submit" className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100">
            Clear outbox
          </button>
        </form>
      </div>
      <ul className="flex flex-col gap-2">
        {emails.map((e) => (
          <li key={e.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <details>
              <summary className="flex cursor-pointer flex-col gap-0.5 p-3 sm:flex-row sm:items-center sm:gap-3">
                <span className="whitespace-nowrap text-xs text-zinc-500">{formatDate(e.sent_on)}</span>
                <span className="font-medium">{e.subject}</span>
                <span className="text-sm text-zinc-500 sm:ml-auto">{e.client_name}</span>
              </summary>
              <div className="border-t border-zinc-200 p-3 text-sm dark:border-zinc-800">
                <p className="text-zinc-500">
                  To: {e.to_email} · {e.invoice_number}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans">{e.body}</pre>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
