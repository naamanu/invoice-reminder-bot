"use client";

import { useActionState } from "react";
import { addClient, type AddClientState } from "./actions";

export function AddClientForm() {
  const [state, formAction, pending] = useActionState<AddClientState, FormData>(
    addClient,
    {},
  );

  return (
    // key resets the inputs after a successful add
    <form
      key={state.addedAt ?? "form"}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          defaultValue={state.values?.name}
          placeholder="Acme Studio"
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          defaultValue={state.values?.email}
          placeholder="billing@acme.com"
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Adding…" : "Add client"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 sm:basis-full">
          {state.error}
        </p>
      )}
    </form>
  );
}
