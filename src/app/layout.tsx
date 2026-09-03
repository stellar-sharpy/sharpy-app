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
          <main className="max-w-5xl mx-auto px-4 py-10" id="main-content">{children}</main>
          <footer
            className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-xs"
            style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}
            aria-label="Site footer"
          >
            <span>Sharpy · Split Payments on Stellar</span>
            <span className="mono" aria-label="App version">v0.2.0 · testnet</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
