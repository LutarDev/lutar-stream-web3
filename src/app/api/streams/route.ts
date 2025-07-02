import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import jwt from "jsonwebtoken";

const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

// Middleware to verify JWT
function verifyToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
}

// Stream Feeds API helper
async function streamFeedsRequest(endpoint: string, method: string = 'GET', data?: unknown) {
  const baseUrl = `https://api.stream-io-api.com/api/v1.0/feed`;
  const url = `${baseUrl}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${process.env.STREAM_API_SECRET}`,
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

export async function GET() {
  try {
    // Get live streams from Stream Feeds API
    const response = await streamFeedsRequest('/streams/global/?limit=25&filter=is_live:true');
    
    // Transform the response to match your frontend expectations
    const streams = response.results.map((activity: Record<string, unknown>) => ({
      id: activity.foreign_id || `stream:${activity.id}`,
      title: (activity.extra_data as Record<string, unknown>)?.title || "Untitled Stream",
      thumbnail: (activity.extra_data as Record<string, unknown>)?.thumbnail || "https://dummyimage.com/640x360/000/fff&text=Stream",
      streamer: {
        address: (activity.actor as string)?.replace('user:', '') || "0x123...",
        displayName: `User ${(activity.actor as string)?.slice(5, 11) || "Unknown"}...`,
      },
      viewerCount: Math.floor(Math.random() * 1000) + 1,
      isLive: (activity.extra_data as Record<string, unknown>)?.is_live || false,
      startedAt: activity.time,
      category: (activity.extra_data as Record<string, unknown>)?.category || "Gaming",
    }));

    return NextResponse.json(streams);
  } catch (error) {
    console.error("Error fetching streams:", error);
    
    // Fallback to mock data if Stream Feeds API fails
    const mockStreams = [
      {
        id: "stream:1",
        title: "Gaming Stream",
        thumbnail: "https://dummyimage.com/640x360/000/fff&text=Gaming",
        streamer: { address: "0x123...", displayName: "Gamer123" },
        viewerCount: 150,
        isLive: true,
        startedAt: new Date().toISOString(),
        category: "Gaming",
      },
      {
        id: "stream:2", 
        title: "Coding Live",
        thumbnail: "https://dummyimage.com/640x360/000/fff&text=Coding",
        streamer: { address: "0x456...", displayName: "DevCoder" },
        viewerCount: 89,
        isLive: true,
        startedAt: new Date().toISOString(),
        category: "Programming",
      },
    ];

    return NextResponse.json(mockStreams);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = verifyToken(authHeader);
    const { roomId, title } = await request.json();

    // Add activity to Stream Feeds
    const activityData = {
      actor: `user:${user.sub}`,
      verb: "go_live",
      object: `stream:${roomId}`,
      foreign_id: `stream:${roomId}`,
      extra_data: {
        title,
        roomId,
        is_live: true,
        thumbnail: `https://dummyimage.com/640x360/000/fff&text=${encodeURIComponent(title)}`,
        category: "Gaming",
      },
      time: new Date().toISOString(),
    };

    await streamFeedsRequest('/streams/global/', 'POST', activityData);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error starting stream:", error);
    return NextResponse.json(
      { error: "Failed to start stream" },
      { status: 500 }
    );
  }
}
