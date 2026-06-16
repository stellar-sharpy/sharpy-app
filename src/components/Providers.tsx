"use client";
import { ThemeProvider } from "next-themes";
import { WalletProvider } from "./WalletProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WalletProvider>{children}</WalletProvider>
    </ThemeProvider>
  );
}
