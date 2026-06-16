import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../components/WalletProvider";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Sharpy — Split Payments on Stellar",
  description: "Advanced on-chain split payment protocol with recurring invoices, escrow, and batch operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg min-h-screen text-text antialiased">
        <WalletProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-10">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
