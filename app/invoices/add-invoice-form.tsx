"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addInvoice, type AddInvoiceState } from "./actions";

const inputClass =
  "rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

export function AddInvoiceForm({
  clients,
  defaultDueDate,
}: {
  clients: { id: number; name: string }[];
  defaultDueDate: string;
}) {
  const [state, formAction, pending] = useActionState<AddInvoiceState, FormData>(
    addInvoice,
    {},
  );

  if (clients.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Add a client first on the <Link href="/clients" className="underline">Clients</Link> page.
      </p>
    );
  }

  return (
    <form
      key={state.added?.at ?? "form"} // fresh inputs after a successful add
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Client
        <select name="clientId" defaultValue={state.values?.clientId ?? ""} className={inputClass}>
          <option value="" disabled>
            Choose…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm sm:w-36">
        Amount (USD)
        <input
          name="amount"
          inputMode="decimal"
          placeholder="1200.00"
          defaultValue={state.values?.amount}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:w-44">
        Due date
        <input
          name="dueDate"
          type="date"
          defaultValue={state.values?.dueDate ?? defaultDueDate}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Adding…" : "Add invoice"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 sm:basis-full">
          {state.error}
        </p>
      )}
      {state.added && (
        <p role="status" className="text-sm text-green-700 dark:text-green-500 sm:basis-full">
          Created {state.added.number}.
        </p>
      )}
    </form>
  );
}
