import { NextRequest, NextResponse } from "next/server";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

const FACILITATOR_URL = "https://channels.openzeppelin.com/x402/testnet";
const USDC_CONTRACT = process.env.NEXT_PUBLIC_USDC_CONTRACT_ID ?? "";
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  NETWORK === "mainnet"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";

// Stable read-only placeholder account — exists on both testnet and mainnet,
// never needs a real keypair, used purely to build simulate-only transactions.
const READ_ONLY_SOURCE = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";

/**
 * Server-side read: simulate get_invoice without any wallet/signing dependency.
 * Bypasses SharpyClient entirely so there is no dynamic Freighter import in the
 * Node.js server context.
 */
async function fetchInvoiceServerSide(invoiceId: number) {
  const server = new Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);

  const account = await server.getAccount(READ_ONLY_SOURCE);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("get_invoice", nativeToScVal(invoiceId, { type: "u64" }))
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if ("error" in sim) {
    const msg: string = (sim as any).error ?? "Simulation error";
    if (msg.toLowerCase().includes("not found") || msg.includes("MissingValue")) {
      throw new Error("invoice not found");
    }
    throw new Error(`RPC simulation failed: ${msg}`);
  }

  const retval = (sim as any).result?.retval;
  if (!retval) {
    throw new Error("invoice not found");
  }

  const raw = scValToNative(retval) as any;

  return {
    status: raw.status as string,
    amounts: (raw.amounts as bigint[]) ?? [],
    funded: BigInt(raw.funded ?? 0n),
    escrowEnabled: Boolean(raw.escrow_enabled),
    escrowReleaseDelay: Number(raw.escrow_release_delay ?? 0),
    creator: raw.creator as string,
    recipients: (raw.recipients as string[]) ?? [],
    deadline: Number(raw.deadline ?? 0),
  };
}

/**
 * GET /api/x402/[id]
 * Returns x402 payment requirements for the invoice.
 * Used by AI agents and HTTP clients to discover payment terms.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoiceId = Number(params.id);

  if (!invoiceId || Number.isNaN(invoiceId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  try {
    const invoice = await fetchInvoiceServerSide(invoiceId);

    if (invoice.status !== "Pending") {
      return NextResponse.json(
        { error: "Invoice is not pending" },
        { status: 400 }
      );
    }

    const total = invoice.amounts.reduce((a: bigint, b: bigint) => a + b, 0n);
    const remaining = total - invoice.funded;

    if (remaining <= 0n) {
      return NextResponse.json(
        { error: "Invoice is already fully funded" },
        { status: 400 }
      );
    }

    const paymentRequired = {
      version: "2",
      accepts: [
        {
          scheme: "exact",
          network: `stellar:${NETWORK}`,
          maxAmountRequired: remaining.toString(),
          resource: `${req.nextUrl.origin}/api/x402/${invoiceId}`,
          description: `Payment for Sharpy invoice #${invoiceId}`,
          mimeType: "application/json",
          payTo: CONTRACT_ID,
          maxTimeoutSeconds: 300,
          asset: USDC_CONTRACT,
          extra: {
            invoiceId,
            name: "Sharpy Invoice Payment",
            version: "1",
          },
        },
      ],
    };

    return NextResponse.json(paymentRequired, {
      status: 402,
      headers: { "X-Payment-Required": "true" },
    });
  } catch (e: any) {
    const msg: string = e?.message ?? "Unknown error";
    console.error(`[x402] GET /api/x402/${invoiceId} failed:`, msg);

    if (msg.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to load invoice", detail: msg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/x402/[id]
 * Verifies and settles an x402 payment via facilitator.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoiceId = Number(params.id);

  if (!invoiceId || Number.isNaN(invoiceId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  const paymentHeader = req.headers.get("X-Payment");

  if (!paymentHeader) {
    return NextResponse.json(
      { error: "Missing X-Payment header" },
      { status: 400 }
    );
  }

  try {
    // Validate the payment header is a valid JSON string (not raw base64)
    // The facilitator expects the payment as a JSON-encoded object, not base64.
    let paymentPayload: string;
    try {
      // Accept either a JSON string or a JSON object serialised as string
      const parsed = JSON.parse(paymentHeader);
      paymentPayload = JSON.stringify(parsed);
    } catch {
      // Already a plain string — pass through
      paymentPayload = paymentHeader;
    }

    // Verify with facilitator
    const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: paymentPayload,
        resource: `${req.nextUrl.origin}/api/x402/${invoiceId}`,
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}));
      console.error(`[x402] verify failed for invoice ${invoiceId}:`, err);
      return NextResponse.json(
        { error: "Payment verification failed", detail: err },
        { status: 402 }
      );
    }

    const verified = await verifyRes.json();

    // Settle via facilitator
    const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment: paymentPayload }),
    });

    if (!settleRes.ok) {
      const err = await settleRes.json().catch(() => ({}));
      console.error(`[x402] settle failed for invoice ${invoiceId}:`, err);
      return NextResponse.json(
        { error: "Payment settlement failed", detail: err },
        { status: 402 }
      );
    }

    const receipt = await settleRes.json();

    return NextResponse.json({
      success: true,
      invoiceId,
      payer: verified.payer,
      amount: verified.amount,
      receipt,
    });
  } catch (e: any) {
    const msg: string = e?.message ?? "Payment processing failed";
    console.error(`[x402] POST /api/x402/${invoiceId} failed:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
