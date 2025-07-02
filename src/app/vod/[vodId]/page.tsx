"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Heart,
  Share2,
  Eye,
  Calendar,
  Clock
} from "lucide-react";

interface VODPlayerProps {
  params: Promise<{
    vodId: string;
  }>;
}

export default function VODPlayerPage({ params }: VODPlayerProps) {
  const [vodId, setVodId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [vodInfo, setVodInfo] = useState({
    id: "",
    title: "Epic 6-Hour Valorant Marathon Stream",
    description: "Join me as I climb through the ranks in Valorant! We're aiming for Immortal this session. Expect high-level gameplay, strategy discussions, and plenty of clutch moments. Don't forget to drop a follow if you enjoy the content!",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1280&h=720&fit=crop",
    duration: 360,
    views: 12543,
    likes: 892,
    recordedAt: "2024-01-14T18:30:00Z",
    streamer: {
      address: "0xABC123",
      displayName: "ProGamer_42",
      followers: 15420
    },
    category: "Gaming",
    tags: ["Valorant", "Ranked", "FPS", "Educational"]
  });

  // Handle async params
  useEffect(() => {
    params.then(({ vodId: resolvedVodId }) => {
      setVodId(resolvedVodId);
      setVodInfo(prev => ({ ...prev, id: resolvedVodId }));
    });
  }, [params]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareVOD = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("VOD URL copied to clipboard!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster={vodInfo.thumbnail}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src="#" type="video/mp4" />
                <track kind="captions" src="" label="English" />
                Your browser does not support the video tag.
              </video>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white mb-2">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(-10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(10)}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-white/30 rounded-full h-1">
                  <div
                    className="bg-primary h-1 rounded-full transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Video Info */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{vodInfo.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{vodInfo.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(vodInfo.recordedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{Math.floor(vodInfo.duration / 60)}h {vodInfo.duration % 60}m</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    onClick={() => setIsLiked(!isLiked)}
                    className="flex items-center space-x-1"
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{vodInfo.likes + (isLiked ? 1 : 0)}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={shareVOD}
                    className="flex items-center space-x-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {vodInfo.streamer.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{vodInfo.streamer.displayName}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {vodInfo.streamer.address.slice(0, 6)}...{vodInfo.streamer.address.slice(-4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vodInfo.streamer.followers.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Button>Follow</Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{vodInfo.category}</Badge>
                {vodInfo.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">#{tag}</Badge>
                ))}
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{vodInfo.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Related VODs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-3 group cursor-pointer">
                  <div className="relative">
                    <img
                      src={`https://images.unsplash.com/photo-${1542751371 + i}-adc38448a05e?w=120&h=68&fit=crop`}
                      alt="Related VOD"
                      className="w-20 h-12 object-cover rounded group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-primary">
                      Another Epic Gaming Session #{i}
                    </p>
                    <p className="text-xs text-muted-foreground">ProGamer_42</p>
                    <p className="text-xs text-muted-foreground">2.1k views • 2 days ago</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Show your appreciation with a tip
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25].map((amount) => (
                  <Button key={amount} variant="outline" size="sm">
                    {amount} tokens
                  </Button>
                ))}
              </div>
              <Button className="w-full">Send Custom Tip</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
