import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const searchParams = req.nextUrl.searchParams;
  const amount = searchParams.get("amount") ?? "";
  const recipients = searchParams.get("recipients") ?? "";

  // Simple OG image without external fetch — edge-safe
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #6C63FF 0%, #00D4AA 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "rgba(255,255,255,0.15)",
            padding: "12px 24px",
            borderRadius: "999px",
            fontSize: "18px",
          }}
        >
          <span>Live on Stellar Testnet</span>
        </div>
        <div style={{ fontSize: "56px", fontWeight: 800, marginTop: "32px", textAlign: "center" }}>
          {amount ? `${amount}` : `Invoice #${id}`}
        </div>
        <div style={{ fontSize: "22px", opacity: 0.85, marginTop: "12px" }}>
          {recipients ? `${recipients} recipient${recipients === "1" ? "" : "s"} • Split payment on Stellar` : "Split payment on Stellar Soroban"}
        </div>
        <div style={{ fontSize: "18px", opacity: 0.7, marginTop: "40px", display: "flex", gap: "12px" }}>
          <span>sharpy • stellar-sharpy</span>
          <span>•</span>
          <span>pay/{id}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
