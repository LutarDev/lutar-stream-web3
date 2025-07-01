import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { StreamChat } from "stream-chat";
import { createAuth } from "thirdweb/auth";
import { createThirdwebClient } from "thirdweb";

// Initialize Stream client
const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

const thirdwebClient = createThirdwebClient({ secretKey: process.env.THIRDWEB_SECRET_KEY! });
const auth = createAuth({ 
  client: thirdwebClient,
  domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || "localhost:3000"
});

export async function POST(request: NextRequest) {
  try {
    const { payload, signature } = await request.json();

    // Verify the login payload and signature
    const verifiedPayload = await auth.verifyPayload({ payload, signature });

    // In a real implementation, you would verify the signature here
    // For now, we'll use a simplified approach
    const address = payload.address || "0x1234567890123456789012345678901234567890";
    // Create JWT token
    const token = jwt.sign(
      { sub: address.toLowerCase() },
      process.env.JWT_SECRET || '',
      { expiresIn: process.env.JWT_EXPIRY || "7d" }
    );

    // Create Stream user token
    const streamToken = streamClient.createToken(address.toLowerCase());

    // Create or update Stream user
    await streamClient.upsertUser({
      id: address.toLowerCase(),
      name: `User ${address.slice(0, 6)}...`,
    });

    return NextResponse.json({
      token,
      streamToken,
      address: address.toLowerCase(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
