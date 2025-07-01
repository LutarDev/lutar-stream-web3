import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import jwt from "jsonwebtoken";

const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

function verifyToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
}

// Stream Feeds API helper
async function streamFeedsRequest(endpoint: string, method: string = 'GET', data?: any) {
  const baseUrl = `https://api.stream-io-api.com/api/v1.0/feed`;
  const url = `${baseUrl}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${process.env.STREAM_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Stream Feeds API error: ${response.statusText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = verifyToken(authHeader);
    const { roomId } = await request.json();

    // Update activity to mark stream as offline
    const updateData = {
      foreign_id: `stream:${roomId}`,
      extra_data: {
        is_live: false,
      },
    };

    await streamFeedsRequest(`/streams/global/${roomId}/`, 'PUT', updateData);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error stopping stream:", error);
    return NextResponse.json(
      { error: "Failed to stop stream" },
      { status: 500 }
    );
  }
}
