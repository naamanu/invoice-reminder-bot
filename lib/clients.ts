import { connection } from "next/server";
import { db } from "./db";

export type ClientRow = {
  id: number;
  name: string;
  email: string;
  open_invoices: number;
  outstanding_cents: number;
};

export async function listClients(): Promise<ClientRow[]> {
  // The SQLite driver is synchronous, so tell Next.js this must run per request
  // (otherwise the page would be prerendered once and never show new clients).
  await connection();
  return db
    .prepare(
      `SELECT c.id, c.name, c.email,
              COUNT(i.id)                     AS open_invoices,
              COALESCE(SUM(i.amount_cents), 0) AS outstanding_cents
         FROM clients c
         LEFT JOIN invoices i ON i.client_id = c.id AND i.status = 'open'
        GROUP BY c.id
        ORDER BY c.name COLLATE NOCASE`,
    )
    .all() as ClientRow[];
}

export class DuplicateEmailError extends Error {}

export function createClient(name: string, email: string): number {
  try {
    const result = db
      .prepare("INSERT INTO clients (name, email) VALUES (?, ?)")
      .run(name, email);
    return Number(result.lastInsertRowid);
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      throw new DuplicateEmailError(email);
    }
    throw err;
  }
}
