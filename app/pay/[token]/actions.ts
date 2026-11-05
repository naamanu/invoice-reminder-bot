"use server";

import { revalidatePath } from "next/cache";
import { markInvoicePaid } from "@/lib/invoices";

export async function confirmPaid(token: string) {
  markInvoicePaid({ token });
  revalidatePath("/", "layout"); // pay page, invoices, clients totals
}
