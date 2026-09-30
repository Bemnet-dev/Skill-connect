"use client";

import React from "react";
import { DollarSign, Download, ArrowUpRight, ShieldCheck, Wallet } from "lucide-react";
import { EarningsChart } from "@/features/booking/components/EarningsChart";
import { Button } from "@/components/ui/Button";

interface TransactionRow {
  id: string;
  bookingId: number;
  date: string;
  customerName: string;
  category: string;
  amount: number;
  provider: "Telebirr" | "CBE Birr" | "Chapa";
  status: "Settled" | "Escrow Held" | "Processing";
}

const mockTransactions: TransactionRow[] = [
  {
    id: "TX-9901",
    bookingId: 44,
    date: "Sep 28, 2026",
    customerName: "Abebe Demisse",
    category: "Plumbing",
    amount: 1800,
    provider: "Telebirr",
    status: "Settled",
  },
  {
    id: "TX-9872",
    bookingId: 41,
    date: "Sep 24, 2026",
    customerName: "Rahel Solomon",
    category: "Plumbing",
    amount: 3200,
    provider: "CBE Birr",
    status: "Settled",
  },
  {
    id: "TX-9840",
    bookingId: 39,
    date: "Sep 20, 2026",
    customerName: "Michael Assefa",
    category: "Pipe Repair",
    amount: 1500,
    provider: "Telebirr",
    status: "Settled",
  },
  {
    id: "TX-9805",
    bookingId: 35,
    date: "Sep 15, 2026",
    customerName: "Almaz Kebede",
    category: "Plumbing",
    amount: 2500,
    provider: "Chapa",
    status: "Settled",
  },
];

export default function WorkerEarningsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Earnings &amp; Payouts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor settled revenue, pending escrow releases, and Ethiopian bank transfer history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export Statement
          </Button>
        </div>
      </div>

      {/* Primary Chart (Consuming Moved EarningsChart Component) */}
      <div>
        <EarningsChart
          totalEarnings={116700}
          completedJobsCount={77}
          currency="ETB"
        />
      </div>

      {/* Payout Channels & Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-gray-900 text-sm">Primary Payout Method</h4>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Telebirr: <span className="font-mono font-medium">+251 91 ****54</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Automatic daily settlement to your mobile wallet within 2 hours of customer approval.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-gray-900 text-sm">Secondary Bank Account</h4>
              <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                CBE Birr
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Commercial Bank of Ethiopia: <span className="font-mono font-medium">1000****7892</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Available as alternate destination for settlements exceeding 50,000 ETB.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Payout Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-base">Recent Settlements</h3>
          <span className="text-xs text-gray-500">Showing last 4 transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Customer / Job</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {mockTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-mono text-gray-500 font-medium">
                    {tx.id}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-gray-900 block">
                      {tx.customerName}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Booking #{tx.bookingId} &bull; {tx.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{tx.date}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-600">
                      {tx.provider}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                    +{tx.amount.toLocaleString()} ETB
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
