import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Sharpy — Split Payments on Stellar",
  description: "Advanced on-chain split payment protocol with recurring invoices, escrow, and batch operations.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <Providers>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
