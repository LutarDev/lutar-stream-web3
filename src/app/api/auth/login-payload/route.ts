import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "siwe";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const now = new Date();
  const payload = {
    domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "localhost:3000",
    address,
    statement: "Sign in to MirrorPlay",
    uri: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    version: "1",
    chain_id: process.env.NEXT_PUBLIC_CHAIN_ID || "1",
    nonce: generateNonce(),
    issued_at: now.toISOString(),
    expiration_time: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    invalid_before: now.toISOString(),
  };

  return NextResponse.json(payload);
}
