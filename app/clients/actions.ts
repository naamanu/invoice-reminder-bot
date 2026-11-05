"use server";

import { revalidatePath } from "next/cache";
import { createClient, DuplicateEmailError } from "@/lib/clients";

export type AddClientState = {
  error?: string;
  addedAt?: number; // set on success; used to reset the form
  // Echo the inputs back so the form keeps them after an error.
  values?: { name: string; email: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addClient(
  _prev: AddClientState,
  formData: FormData,
): Promise<AddClientState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const values = { name, email };

  if (!name) return { error: "Name is required.", values };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", values };

  try {
    createClient(name, email);
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return { error: `A client with ${email} already exists.`, values };
    }
    throw err;
  }

  revalidatePath("/clients");
  return { addedAt: Date.now() };
}
