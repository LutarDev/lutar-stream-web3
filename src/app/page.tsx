"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Users, Clock } from "lucide-react";

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

  useEffect(() => {
    // Simulate fetching live streams
    const mockStreams: Stream[] = [
      {
        id: "room-1",
        title: "Epic Valorant Ranked Climb 🚀",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop",
        streamer: {
          address: "0xABC123",
          displayName: "ProGamer_42"
        },
        viewerCount: 1234,
        isLive: true,
        startedAt: "2024-01-15T10:30:00Z",
        category: "Gaming"
      },
      {
        id: "room-2",
        title: "Building the Future of Web3 💻",
        thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=360&fit=crop",
        streamer: {
          address: "0xDEF456",
          displayName: "DevMaster"
        },
        viewerCount: 856,
        isLive: true,
        startedAt: "2024-01-15T11:15:00Z",
        category: "Technology"
      },
      {
        id: "room-3",
        title: "Chill Art Stream 🎨",
        thumbnail: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=640&h=360&fit=crop",
        streamer: {
          address: "0xGHI789",
          displayName: "ArtisticSoul"
        },
        viewerCount: 432,
        isLive: true,
        startedAt: "2024-01-15T09:45:00Z",
        category: "Creative"
      },
      {
        id: "room-4",
        title: "Learning Solidity Together 📚",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop",
        streamer: {
          address: "0xJKL012",
          displayName: "BlockchainTutor"
        },
        viewerCount: 678,
        isLive: true,
        startedAt: "2024-01-15T12:00:00Z",
        category: "Education"
      },
      {
        id: "room-5",
        title: "Late Night Music Production 🎵",
        thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop",
        streamer: {
          address: "0xMNO345",
          displayName: "BeatMaker"
        },
        viewerCount: 289,
        isLive: true,
        startedAt: "2024-01-15T08:20:00Z",
        category: "Music"
      },
      {
        id: "room-6",
        title: "Speedrun Challenge WR Attempt ⚡",
        thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=640&h=360&fit=crop",
        streamer: {
          address: "0xPQR678",
          displayName: "SpeedDemon"
        },
        viewerCount: 2156,
        isLive: true,
        startedAt: "2024-01-15T13:30:00Z",
        category: "Gaming"
      }
    ];

    setStreams(mockStreams);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Live on MirrorPlay</h1>
        <p className="text-muted-foreground">
          Discover amazing creators streaming live with Web3 technology
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streams.map((stream) => (
          <Link key={stream.id} href={`/watch/${stream.id}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="relative">
                <img
                  src={stream.thumbnail}
                  alt={stream.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-red-600 hover:bg-red-600 text-white flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span>LIVE</span>
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{stream.viewerCount.toLocaleString()}</span>
                  </Badge>
                </div>
                <div className="absolute bottom-3 right-3">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                    {stream.category}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {stream.title}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {stream.streamer.address.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{stream.streamer.displayName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {stream.streamer.address.slice(0, 6)}...{stream.streamer.address.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(stream.startedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Ready to start streaming?
        </p>
        <Link
          href="/broadcast"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Start Your Stream
        </Link>
      </div>
    </div>
  );
}
