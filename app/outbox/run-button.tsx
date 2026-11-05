"use client";

import { useActionState } from "react";
import { formatDate } from "@/lib/dates";
import { runRemindersAction, type RunState } from "./actions";

export function RunButton() {
  const [state, formAction, pending] = useActionState<RunState>(runRemindersAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Running…" : "Run reminders now"}
      </button>

      {state.sent && state.ranFor && (
        <div role="status" className="text-sm">
          {state.sent.length === 0 ? (
            <p className="text-zinc-500">
              Nothing to send for {formatDate(state.ranFor)} — every reminder due that day has already gone out.
            </p>
          ) : (
            <>
              <p className="font-medium text-green-700 dark:text-green-500">
                Sent {state.sent.length} reminder{state.sent.length === 1 ? "" : "s"} for{" "}
                {formatDate(state.ranFor)}:
              </p>
              <ul className="mt-1 list-disc pl-5 text-zinc-600 dark:text-zinc-400">
                {state.sent.map((s) => (
                  <li key={s.invoiceNumber}>
                    {s.clientName} — {s.subject}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </form>
  );
}
