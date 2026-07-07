import { NextRequest, NextResponse } from "next/server";
import { sharpyClient } from "../../../../lib/client";

const FACILITATOR_URL = "https://channels.openzeppelin.com/x402/testnet";
const USDC_CONTRACT = process.env.NEXT_PUBLIC_USDC_CONTRACT_ID ?? "";
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";

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

  try {
    const invoice = await sharpyClient.getInvoice(invoiceId);

    if (invoice.status !== "Pending") {
      return NextResponse.json({ error: "Invoice is not pending" }, { status: 400 });
    }

    const total = invoice.amounts.reduce((a: bigint, b: bigint) => a + b, 0n);
    const remaining = total - invoice.funded;

    if (remaining <= 0n) {
      return NextResponse.json({ error: "Invoice is already fully funded" }, { status: 400 });
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
    return NextResponse.json({ error: e.message ?? "Invoice not found" }, { status: 404 });
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
  const paymentHeader = req.headers.get("X-Payment");

  if (!paymentHeader) {
    return NextResponse.json({ error: "Missing X-Payment header" }, { status: 400 });
  }

  try {
    // Verify with facilitator
    const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: paymentHeader,
        resource: `${req.nextUrl.origin}/api/x402/${invoiceId}`,
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}));
      return NextResponse.json({ error: "Payment verification failed", detail: err }, { status: 402 });
    }

    const verified = await verifyRes.json();

    // Settle via facilitator
    const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment: paymentHeader }),
    });

    if (!settleRes.ok) {
      return NextResponse.json({ error: "Payment settlement failed" }, { status: 402 });
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
    return NextResponse.json({ error: e.message ?? "Payment processing failed" }, { status: 500 });
  }
}
