"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";
import Link from "next/link";
import { 
  Play, 
  Users, 
  Clock,
  TrendingUp
} from "lucide-react";

interface Stream {
  id: string;
  title: string;
  thumbnail: string;
  streamer: {
    address: string;
    displayName: string;
  };
  viewerCount: number;
  isLive: boolean;
  startedAt: string;
  category: string;
}

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await axios.get("/api/streams");
        const streamData = response.data.map((activity: Record<string, unknown>) => ({
          id: activity.foreign_id as string,
          title: (activity.extra_data as Record<string, unknown>)?.title || "Untitled Stream",
          thumbnail: (activity.extra_data as Record<string, unknown>)?.thumbnail || "https://dummyimage.com/640x360/000/fff&text=Stream",
          streamer: {
            address: activity.actor as string || "unknown",
            displayName: `User ${(activity.actor as string)?.slice(5, 11) || "Unknown"}...`,
          },
          viewerCount: Math.floor(Math.random() * 1000) + 1,
          isLive: (activity.extra_data as Record<string, unknown>)?.is_live || false,
          startedAt: activity.time as string,
          category: "Gaming",
        }));
        setStreams(streamData);
      } catch (error) {
        console.error("Failed to fetch streams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-700 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Live Streams</h1>
        <p className="text-gray-400">Discover amazing content from creators around the world</p>
      </div>

      {streams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
            <p className="text-gray-400 mb-4">Be the first to go live!</p>
            <Link href="/broadcast">
              <Button>
                <Play className="w-4 h-4 mr-2" />
                Start Streaming
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {streams.map((stream) => {
            const streamId = stream.id || `stream:${Math.random().toString(36).substring(7)}`;
            const roomId = streamId.includes(':') ? streamId.split(':')[1] : streamId;
            
            return (
              <Link key={stream.id || streamId} href={`/watch/${roomId}`}>
                <Card className="hover:scale-105 transition-transform cursor-pointer">
                  <div className="relative">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    {stream.isLive && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        LIVE
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                      <Users className="w-3 h-3" />
                      {stream.viewerCount}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-2">{stream.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{stream.streamer.displayName}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{stream.category}</Badge>
                      {stream.isLive && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDuration(stream.startedAt)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
