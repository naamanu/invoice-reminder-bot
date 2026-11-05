import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { formatDate } from "@/lib/dates";
import { getSimulatedDate } from "@/lib/today";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice Reminder Bot",
  description: "Polite automatic reminders for unpaid invoices.",
};

async function SimulatedDateBanner() {
  const simulated = await getSimulatedDate();
  if (!simulated) return null;
  return (
    <div className="bg-amber-100 px-4 py-1.5 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      Pretending today is <strong>{formatDate(simulated)}</strong>.{" "}
      <Link href="/outbox" className="underline">
        Change
      </Link>
    </div>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3 text-sm">
            <span className="font-semibold">Invoice Reminder Bot</span>
            <Link href="/clients" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Clients
            </Link>
            <Link href="/invoices" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Invoices
            </Link>
            <Link href="/outbox" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Outbox
            </Link>
          </nav>
          <Suspense fallback={null}>
            <SimulatedDateBanner />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
