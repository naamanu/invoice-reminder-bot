// SQLite database using Node's built-in driver (no extra packages).
// The file lives at data/app.db and is created on first use.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS clients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    number        TEXT NOT NULL UNIQUE,          -- e.g. INV-001
    amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
    currency      TEXT NOT NULL DEFAULT 'USD',
    due_date      TEXT NOT NULL,                 -- YYYY-MM-DD
    status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid')),
    paid_at       TEXT,
    pay_token     TEXT NOT NULL UNIQUE,          -- secret for the "mark as paid" link
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- One row per reminder "sent" (written to the local outbox, not real email).
  CREATE TABLE IF NOT EXISTS reminders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,                   -- before_3 | due | after_3 | after_7 | after_14
    to_email    TEXT NOT NULL,
    subject     TEXT NOT NULL,
    body        TEXT NOT NULL,
    sent_on     TEXT NOT NULL,                   -- YYYY-MM-DD ("today" when it ran)
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (invoice_id, kind)                    -- never send the same reminder twice
  );
`;

function open(): DatabaseSync {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  return db;
}

// Reuse one connection across Next.js hot reloads.
const g = globalThis as unknown as { __db?: DatabaseSync };
export const db: DatabaseSync = g.__db ?? (g.__db = open());

export type Client = { id: number; name: string; email: string; created_at: string };

export type Invoice = {
  id: number;
  client_id: number;
  number: string;
  amount_cents: number;
  currency: string;
  due_date: string;
  status: "open" | "paid";
  paid_at: string | null;
  pay_token: string;
  created_at: string;
};

export type Reminder = {
  id: number;
  invoice_id: number;
  kind: string;
  to_email: string;
  subject: string;
  body: string;
  sent_on: string;
  created_at: string;
};
