"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/state/query/queryClient";
import { SocketProvider } from "@/state/context/SocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>{children}</SocketProvider>
    </QueryClientProvider>
  );
}
