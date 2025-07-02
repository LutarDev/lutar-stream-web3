"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, Eye, Calendar, TrendingUp, Filter } from "lucide-react";

interface VOD {
  id: string;
  title: string;
  thumbnail: string;
  duration: number; // in minutes
  views: number;
  streamer: {
    address: string;
    displayName: string;
  };
  recordedAt: string;
  category: string;
  tags: string[];
}

export default function VODsPage() {
  const [vods, setVods] = useState<VOD[]>([]);
  const [activeTab, setActiveTab] = useState("recent");

  useEffect(() => {
    // Simulate fetching VODs
    const mockVODs: VOD[] = [
      {
        id: "vod-1",
        title: "Epic 6-Hour Valorant Marathon Stream",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop",
        duration: 360,
        views: 12543,
        streamer: {
          address: "0xABC123",
          displayName: "ProGamer_42"
        },
        recordedAt: "2024-01-14T18:30:00Z",
        category: "Gaming",
        tags: ["Valorant", "Ranked", "FPS"]
      },
      {
        id: "vod-2",
        title: "Building a DeFi Protocol from Scratch",
        thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=360&fit=crop",
        duration: 180,
        views: 8921,
        streamer: {
          address: "0xDEF456",
          displayName: "DevMaster"
        },
        recordedAt: "2024-01-14T14:15:00Z",
        category: "Technology",
        tags: ["Web3", "Coding", "Tutorial"]
      },
      {
        id: "vod-3",
        title: "Digital Art Creation Session",
        thumbnail: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=640&h=360&fit=crop",
        duration: 120,
        views: 5634,
        streamer: {
          address: "0xGHI789",
          displayName: "ArtisticSoul"
        },
        recordedAt: "2024-01-13T20:45:00Z",
        category: "Creative",
        tags: ["Art", "Digital", "Process"]
      },
      {
        id: "vod-4",
        title: "Solidity Smart Contract Security Review",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop",
        duration: 90,
        views: 7892,
        streamer: {
          address: "0xJKL012",
          displayName: "BlockchainTutor"
        },
        recordedAt: "2024-01-13T16:20:00Z",
        category: "Education",
        tags: ["Blockchain", "Security", "Smart Contracts"]
      },
      {
        id: "vod-5",
        title: "Ambient Music Production Stream",
        thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop",
        duration: 240,
        views: 3421,
        streamer: {
          address: "0xMNO345",
          displayName: "BeatMaker"
        },
        recordedAt: "2024-01-12T22:10:00Z",
        category: "Music",
        tags: ["Music", "Production", "Ambient"]
      },
      {
        id: "vod-6",
        title: "Speedrun World Record Attempt - Failed",
        thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=640&h=360&fit=crop",
        duration: 45,
        views: 15678,
        streamer: {
          address: "0xPQR678",
          displayName: "SpeedDemon"
        },
        recordedAt: "2024-01-12T19:30:00Z",
        category: "Gaming",
        tags: ["Speedrun", "Gaming", "Challenge"]
      }
    ];

    setVods(mockVODs);
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const sortedVods = {
    recent: [...vods].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
    popular: [...vods].sort((a, b) => b.views - a.views),
    trending: [...vods].sort((a, b) => b.views - a.views) // In real app, this would be based on recent engagement
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Video on Demand</h1>
        <p className="text-muted-foreground">
          Watch recorded streams from your favorite creators
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>Popular</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <VODGrid vods={sortedVods.recent} formatDuration={formatDuration} formatDate={formatDate} />
        </TabsContent>

        <TabsContent value="popular">
          <VODGrid vods={sortedVods.popular} formatDuration={formatDuration} formatDate={formatDate} />
        </TabsContent>

        <TabsContent value="trending">
          <VODGrid vods={sortedVods.trending} formatDuration={formatDuration} formatDate={formatDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VODGrid({
  vods,
  formatDuration,
  formatDate
}: {
  vods: VOD[];
  formatDuration: (minutes: number) => string;
  formatDate: (dateString: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vods.map((vod) => (
        <Link key={vod.id} href={`/vod/${vod.id}`}>
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <img
                src={vod.thumbnail}
                alt={vod.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Play className="h-8 w-8 text-primary-foreground fill-current ml-1" />
                </div>
              </div>

              <div className="absolute bottom-3 right-3">
                <Badge variant="secondary" className="bg-black/80 text-white flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(vod.duration)}</span>
                </Badge>
              </div>

              <div className="absolute top-3 left-3">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                  {vod.category}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {vod.title}
              </h3>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {vod.streamer.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{vod.streamer.displayName}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {vod.streamer.address.slice(0, 6)}...{vod.streamer.address.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{vod.views.toLocaleString()} views</span>
                </div>
                <span>{formatDate(vod.recordedAt)}</span>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {vod.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
