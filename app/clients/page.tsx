import { Suspense } from "react";
import { listClients } from "@/lib/clients";
import { formatMoney } from "@/lib/format";
import { AddClientForm } from "./add-client-form";

export const metadata = { title: "Clients · Invoice Reminder Bot" };

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Clients</h1>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">Add a client</h2>
        <AddClientForm />
      </section>

      <Suspense fallback={<p className="text-sm text-zinc-500">Loading clients…</p>}>
        <ClientList />
      </Suspense>
    </div>
  );
}

async function ClientList() {
  const clients = await listClients();

  if (clients.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No clients yet. Add one above, or run <code>npm run db:seed</code>.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 text-right font-medium">Open invoices</th>
            <th className="py-2 text-right font-medium">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2">{c.name}</td>
              <td className="py-2 text-zinc-600 dark:text-zinc-400">{c.email}</td>
              <td className="py-2 text-right tabular-nums">{c.open_invoices}</td>
              <td className="py-2 text-right tabular-nums">
                {formatMoney(c.outstanding_cents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
