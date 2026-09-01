import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sharpy.example.com";
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "CCMN5OYWBWVVRIB3IDE2CCODM3CMGSMYQ7EV2UVBJ23DVIH2CL6FJRXP";

  // Try to fetch invoice for rich preview; fall back gracefully
  let title = `Pay Invoice #${id} — Sharpy`;
  let description = `Secure split payment invoice on Stellar Soroban. Pay via wallet, x402, or cross-chain CCTP.`;
  let amountStr: string | null = null;

  try {
    // Lightweight attempt: fetch via RPC simulation indirectly by calling a simple endpoint
    // If it fails, we still return generic metadata
    const { SharpyClient, NETWORKS } = await import("@stellar-sharpy/sdk");
    const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") as "testnet" | "mainnet";
    const net = NETWORKS[network];
    const client = new SharpyClient({ rpcUrl: rpcUrl ?? net.rpcUrl, networkPassphrase: net.networkPassphrase, contractId });
    const numericId = Number(id);
    if (!isNaN(numericId)) {
      const inv = await client.getInvoice(numericId);
      const total = inv.amounts.reduce((a: bigint, b: bigint) => a + b, 0n);
      // formatAmount in SDK expects stroops; do simple conversion
      const formatted = Number(total) / 1e7;
      amountStr = `${formatted.toLocaleString()} tokens`;
      title = `Pay ${amountStr} — Invoice #${id} • Sharpy`;
      description = `Split payment to ${inv.recipients.length} recipient${inv.recipients.length !== 1 ? "s" : ""} • Due ${new Date(inv.deadline * 1000).toLocaleDateString()} • ${inv.status}`;
    }
  } catch {
    // graceful fallback
  }

  const ogImage = `${baseUrl}/api/og/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/pay/${id}`,
      siteName: "Sharpy",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
