"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { WebRTCSignaling } from "@/lib/webrtc-signaling";
import axios from "axios";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Share2, 
  Square,
  Play
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";

export default function BroadcastPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, login, isLoading } = useAuth();
  const account = useActiveAccount();
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [title, setTitle] = useState("My Awesome Stream");
  const [roomId] = useState(() => crypto.randomUUID());
  const [signaling, setSignaling] = useState<WebRTCSignaling | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4 text-lg">Please connect your wallet to start streaming.</p>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4 text-lg">Sign in with your wallet to start streaming.</p>
        <button
          className="btn btn-primary"
          onClick={login}
        >
          Sign In
        </button>
      </div>
    );
  }

  const startStream = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Connect to SFU
      const signalingInstance = new WebRTCSignaling(roomId, "streamer");
      const { pc } = await signalingInstance.connect();
      setSignaling(signalingInstance);

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Start stream in backend
      await axios.post("/api/streams", {
        roomId,
        title,
      });

      setIsLive(true);

      // Handle page unload
      window.addEventListener("beforeunload", stopStream);
    } catch (error) {
      console.error("Failed to start stream:", error);
      alert("Failed to start stream");
    }
  };

  const stopStream = async () => {
    try {
      if (signaling) {
        signaling.disconnect();
        setSignaling(null);
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Stop stream in backend
      await axios.post("/api/streams/stop", { roomId });

      setIsLive(false);
      window.removeEventListener("beforeunload", stopStream);
    } catch (error) {
      console.error("Failed to stop stream:", error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const shareStream = () => {
    const url = `${window.location.origin}/watch/${roomId}`;
    navigator.clipboard.writeText(url);
    alert("Stream URL copied to clipboard!");
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLive ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                Live Broadcasting
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Start Broadcasting
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isLive && (
            <div className="space-y-4">
              <Input
                placeholder="Stream title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg"
              />
              <Button
                onClick={startStream}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Go Live
              </Button>
            </div>
          )}

          {isLive && (
            <>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black"
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "secondary"}
                    size="sm"
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={toggleVideo}
                    variant={!isVideoEnabled ? "destructive" : "secondary"}
                    size="sm"
                  >
                    {!isVideoEnabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={stopStream}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Stream
                </Button>
                <Button onClick={shareStream} variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                Share this URL with viewers:{" "}
                <code className="bg-gray-800 px-2 py-1 rounded">
                  {`${window.location.origin}/watch/${roomId}`}
                </code>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
