import React from "react";
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { type PaymentStatus } from "../schema";

export interface EscrowStatusBadgeProps {
  status: PaymentStatus | string;
  amount?: number;
  currency?: string;
}

/**
 * EscrowStatusBadge Component
 *
 * Visualizes the state of funds in the SkillConnect escrow safety layer:
 * - Held: Funds secured by platform until job completion
 * - Released: Funds disbursed to worker upon customer sign-off
 * - Pending: Payment initiated but awaiting gateway callback
 */
export function EscrowStatusBadge({
  status,
  amount,
  currency = "ETB",
}: EscrowStatusBadgeProps) {
  switch (status) {
    case "Held":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          Held in Escrow {amount ? `(${amount.toLocaleString()} ${currency})` : ""}
        </span>
      );
    case "Released":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Escrow Released {amount ? `(${amount.toLocaleString()} ${currency})` : ""}
        </span>
      );
    case "Refunded":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          Refunded to Customer
        </span>
      );
    case "Failed":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          Payment Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          Payment Pending
        </span>
      );
  }
}

export default EscrowStatusBadge;
