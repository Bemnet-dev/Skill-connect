"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, Smartphone, CreditCard, Building } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreatePayment } from "../hooks/usePayments";
import { type PaymentProvider } from "../schema";

export interface PaymentFormProps {
  bookingId: number;
  amount: number;
  currency?: string;
  onSuccess?: () => void;
}

const providers: { id: PaymentProvider; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "Telebirr",
    name: "Telebirr",
    description: "Fast mobile money transfer via Ethio Telecom",
    icon: <Smartphone className="w-5 h-5 text-blue-600" />,
  },
  {
    id: "Chapa",
    name: "Chapa",
    description: "Visa, Mastercard, & Ethiopian local debit cards",
    icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: "CBE Birr",
    name: "CBE Birr",
    description: "Commercial Bank of Ethiopia mobile banking",
    icon: <Building className="w-5 h-5 text-purple-600" />,
  },
];

export function PaymentForm({
  bookingId,
  amount,
  currency = "ETB",
  onSuccess,
}: PaymentFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("Telebirr");
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: createPayment, isPending, isError, error } = useCreatePayment();

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    createPayment(
      {
        bookingId,
        amount,
        provider: selectedProvider,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  if (isSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h4 className="font-bold text-gray-900 text-lg">Payment Escrow Initialized</h4>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          {amount.toLocaleString()} {currency} has been placed safely in escrow via {selectedProvider}.
          Funds will be disbursed when you confirm job completion.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handlePay} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
      <div className="border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-gray-900 text-lg">Secure Escrow Checkout</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Your payment is protected. Workers are paid only after you approve the completed work.
        </p>
      </div>

      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error?.message || "Failed to process payment."}</span>
        </div>
      )}

      {/* Amount Summary */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
        <span className="text-sm font-medium text-gray-600">Total Escrow Amount:</span>
        <span className="text-2xl font-bold text-gray-900">
          {amount.toLocaleString()}{" "}
          <span className="text-sm font-medium text-gray-500">{currency}</span>
        </span>
      </div>

      {/* Provider Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Select Payment Gateway
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {providers.map((p) => {
            const isSelected = selectedProvider === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                    <input
                      type="radio"
                      name="provider"
                      checked={isSelected}
                      onChange={() => setSelectedProvider(p.id)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isPending}
          loadingText="Connecting Gateway..."
        >
          Deposit {amount.toLocaleString()} {currency} into Escrow
        </Button>
      </div>
    </form>
  );
}

export default PaymentForm;
