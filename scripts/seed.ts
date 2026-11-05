// Wipes the database and fills it with sample data.
// Run with: npm run db:seed
import { randomBytes } from "node:crypto";
import { db } from "../lib/db.ts";

// Due dates are relative to today so every status shows up.
function daysFromToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA"); // local YYYY-MM-DD
}

db.exec("DELETE FROM reminders; DELETE FROM invoices; DELETE FROM clients;");
db.exec("DELETE FROM sqlite_sequence;"); // restart ids at 1

const addClient = db.prepare("INSERT INTO clients (name, email) VALUES (?, ?)");
const addInvoice = db.prepare(
  `INSERT INTO invoices (client_id, number, amount_cents, due_date, status, paid_at, pay_token)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);

const clients = [
  ["Acme Studio", "billing@acme.test"],
  ["Bright Bakery", "owner@brightbakery.test"],
  ["Kofi Design Co.", "kofi@kofidesign.test"],
];
const clientIds = clients.map(
  ([name, email]) => Number(addClient.run(name, email).lastInsertRowid),
);

// [client index, amount in dollars, due in N days, paid?]
const invoices: [number, number, number, boolean][] = [
  [0, 1200, 5, false],   // upcoming
  [0, 450, 3, false],    // "3 days before" reminder is due today
  [1, 800, 0, false],    // due today
  [1, 300, -4, false],   // overdue
  [2, 2500, -15, false], // very overdue
  [2, 600, -10, true],   // already paid
];

invoices.forEach(([c, dollars, dueIn, paid], i) => {
  addInvoice.run(
    clientIds[c],
    `INV-${String(i + 1).padStart(3, "0")}`,
    dollars * 100,
    daysFromToday(dueIn),
    paid ? "paid" : "open",
    paid ? new Date().toISOString() : null,
    randomBytes(16).toString("hex"),
  );
});

const count = (t: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
console.log(
  `Seeded ${count("clients")} clients, ${count("invoices")} invoices, ${count("reminders")} reminders.`,
);
