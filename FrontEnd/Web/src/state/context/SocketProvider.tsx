"use client";
import { createContext, useContext, ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SocketContextType {
  // Socket context will be implemented in future phases
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  return context;
}
