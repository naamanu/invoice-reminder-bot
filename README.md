# Invoice Reminder Bot

Sends polite, automatic reminders for unpaid invoices. Local-only: data lives in
a SQLite file and emails go to an in-app **Outbox** instead of being sent.

## Run it

```bash
npm install
npm run db:seed   # sample clients + invoices (also resets everything)
npm run dev       # http://localhost:3000
```

Optional: `SENDER_NAME="Ama Mensah" npm run dev` to sign emails with your name.

## How it works

1. **Clients** — add the people you bill.
2. **Invoices** — add an invoice (client, amount, due date). Each row shows its
   status and the next reminder that will go out.
3. **Outbox** — click **Run reminders now** (the "daily job"). Use
   **Pretend today is…** to jump ahead and watch later reminders fire.
4. **Mark as paid** — from the Invoices page, or by the client clicking the
   link in any reminder email (`/pay/<token>`). Paid invoices get no more reminders.

### Reminder schedule

| Stage      | When                  |
| ---------- | --------------------- |
| `before_3` | 3 days before due     |
| `due`      | on the due date       |
| `after_3`  | 3 days overdue        |
| `after_7`  | 7 days overdue        |
| `after_14` | 14 days overdue (last)|

Each stage is sent at most once. If runs were missed, only the most recent
stage is sent — never a pile of catch-up emails.

## Project layout

| Path                    | What                                          |
| ----------------------- | --------------------------------------------- |
| `lib/db.ts`             | SQLite connection + schema (`data/app.db`)    |
| `lib/reminder-rules.ts` | Pure schedule logic (tested)                  |
| `lib/email-templates.ts`| Reminder email wording                        |
| `lib/run-reminders.ts`  | The job that writes due reminders to the outbox |
| `lib/today.ts`          | Real or "pretend" today                       |
| `app/clients`, `app/invoices`, `app/outbox`, `app/pay/[token]` | Pages |
| `scripts/seed.ts`       | Sample data                                   |

## Commands

- `npm test` — reminder rule tests
- `npm run db:seed` — reset to sample data
- `npm run lint` / `npm run build`
