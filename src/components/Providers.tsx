"use client";
import { ThemeProvider } from "next-themes";
import { WalletProvider } from "./WalletProvider";
import { ToastProvider } from "./Toast";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WalletProvider>
        <ToastProvider>{children}</ToastProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
