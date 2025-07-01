"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Square,
  Monitor,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share,
  Users,
  Eye
} from "lucide-react";

export default function BroadcastPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("My Awesome Stream");
  const [roomId] = useState(() => crypto.randomUUID());
  const [viewers, setViewers] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setIsStreaming(true);

      // Simulate viewer count increase
      const interval = setInterval(() => {
        setViewers(prev => prev + Math.floor(Math.random() * 3));
      }, 3000);

      // Cleanup when stream ends
      mediaStream.getVideoTracks()[0].onended = () => {
        setIsStreaming(false);
        clearInterval(interval);
        setViewers(0);
      };

    } catch (error) {
      console.error("Error starting stream:", error);
      alert("Failed to start stream. Please try again.");
    }
  };

  const stopStream = () => {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setStream(null);
    }
    setIsStreaming(false);
    setViewers(0);
  };

  const toggleMute = () => {
    if (stream) {
      for (const track of stream.getAudioTracks()) {
        track.enabled = isMuted;
      }
      setIsMuted(!isMuted);
    }
  };

  const shareStream = () => {
    const url = `${window.location.origin}/watch/${roomId}`;
    navigator.clipboard.writeText(url);
    alert("Stream URL copied to clipboard!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Streaming Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Stream Preview</span>
                </CardTitle>
                {isStreaming && (
                  <Badge className="bg-red-600 text-white animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <div className="text-center">
                      <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-semibold mb-2">Ready to go live?</p>
                      <p className="text-muted-foreground">
                        Click "Start Stream" to begin broadcasting
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stream Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {!isStreaming ? (
                    <Button onClick={startStream} className="flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <span>Start Stream</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={stopStream}
                      variant="destructive"
                      className="flex items-center space-x-2"
                    >
                      <Square className="h-4 w-4" />
                      <span>Stop Stream</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    disabled={!isStreaming}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    disabled={!isStreaming}
                  >
                    {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                </div>

                {isStreaming && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-sm">
                      <Eye className="h-4 w-4" />
                      <span>{viewers} viewers</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareStream}
                      className="flex items-center space-x-1"
                    >
                      <Share className="h-3 w-3" />
                      <span>Share</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stream Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stream Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Stream Title
                </label>
                <Input
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter your stream title..."
                  disabled={isStreaming}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Room ID
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={roomId}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(roomId);
                      alert("Room ID copied!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {isStreaming && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Stream Stats</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="destructive">Live</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Viewers:</span>
                      <span>{viewers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quality:</span>
                      <span>1080p 60fps</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share Your Stream</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Share this link with your viewers:
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/watch/${roomId}`}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareStream}
                  >
                    <Share className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isStreaming && (
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <p>Set your stream title and customize settings</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <p>Click "Start Stream" and select what to share</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <p>Share the stream link with your audience</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
