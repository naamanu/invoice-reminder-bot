"use server";

import { revalidatePath } from "next/cache";
import { isISODate } from "@/lib/dates";
import { clientExists, createInvoice, markInvoicePaid, reopenInvoice } from "@/lib/invoices";

export async function markPaidAction(id: number) {
  markInvoicePaid({ id });
  revalidatePath("/", "layout");
}

export async function reopenAction(id: number) {
  reopenInvoice(id);
  revalidatePath("/", "layout");
}

export type AddInvoiceState = {
  error?: string;
  added?: { number: string; at: number }; // set on success; `at` resets the form
  values?: { clientId: string; amount: string; dueDate: string };
};

// Dollars with optional cents: 1200, 1200.5, 1200.50
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

export async function addInvoice(
  _prev: AddInvoiceState,
  formData: FormData,
): Promise<AddInvoiceState> {
  const clientId = String(formData.get("clientId") ?? "");
  const amount = String(formData.get("amount") ?? "").trim().replace(/,/g, "");
  const dueDate = String(formData.get("dueDate") ?? "");
  const values = { clientId, amount, dueDate };

  const id = Number(clientId);
  if (!Number.isInteger(id) || !clientExists(id)) {
    return { error: "Pick a client.", values };
  }
  if (!AMOUNT_RE.test(amount)) {
    return { error: "Enter an amount like 1200 or 1200.50.", values };
  }
  const amountCents = Math.round(Number(amount) * 100);
  if (amountCents <= 0) return { error: "Amount must be more than zero.", values };
  if (!isISODate(dueDate)) return { error: "Pick a valid due date.", values };

  const number = createInvoice({ clientId: id, amountCents, dueDate });

  revalidatePath("/invoices");
  revalidatePath("/clients"); // outstanding totals change too
  return { added: { number, at: Date.now() } };
}
