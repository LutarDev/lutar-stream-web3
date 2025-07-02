import { NextRequest, NextResponse } from "next/server";
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

    if (!verifiedPayload.valid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const address = verifiedPayload.payload.address;
    
    // Create Stream user token (this is the JWT for Stream)
    const streamToken = streamClient.createToken(address.toLowerCase());

    // Create or update Stream user
    await streamClient.upsertUser({
      id: address.toLowerCase(),
      name: `User ${address.slice(0, 6)}...`,
    });

    return NextResponse.json({
      streamToken, // Use Stream token as your auth token
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
