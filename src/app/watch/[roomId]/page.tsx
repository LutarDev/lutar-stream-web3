"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  Gift,
  Send,
  Users,
  Eye,
  Volume2,
  VolumeX,
  Maximize,
  Share2
} from "lucide-react";

interface ChatMessage {
  id: string;
  user: {
    address: string;
    displayName: string;
  };
  message: string;
  timestamp: Date;
  type: "message" | "tip" | "follow";
  tipAmount?: number;
}

interface WatchPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function WatchPage({ params }: WatchPageProps) {
  const [roomId, setRoomId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewers, setViewers] = useState(1247);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [tipAmount, setTipAmount] = useState("5");
  const [streamInfo] = useState({
    title: "Epic Valorant Ranked Climb 🚀",
    streamer: {
      address: "0xABC123",
      displayName: "ProGamer_42"
    },
    category: "Gaming",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop"
  });

  // Handle async params
  useEffect(() => {
    params.then(({ roomId: resolvedRoomId }) => {
      setRoomId(resolvedRoomId);
    });
  }, [params]);

  useEffect(() => {
    // Simulate loading a stream (in real app, this would connect to WebRTC)
    if (videoRef.current) {
      videoRef.current.poster = streamInfo.thumbnail;
    }

    // Simulate chat messages
    const simulateChat = () => {
      const mockMessages: ChatMessage[] = [
        {
          id: "1",
          user: { address: "0xDEF456", displayName: "GameMaster" },
          message: "Nice play there!",
          timestamp: new Date(Date.now() - 30000),
          type: "message"
        },
        {
          id: "2",
          user: { address: "0xGHI789", displayName: "CryptoFan" },
          message: "Just followed! Great stream 🔥",
          timestamp: new Date(Date.now() - 20000),
          type: "follow"
        },
        {
          id: "3",
          user: { address: "0xJKL012", displayName: "TipperX" },
          message: "Amazing clutch!",
          timestamp: new Date(Date.now() - 10000),
          type: "tip",
          tipAmount: 10
        }
      ];
      setMessages(mockMessages);
    };

    simulateChat();

    // Simulate viewer count fluctuation
    const viewerInterval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 10 - 5));
    }, 5000);

    return () => clearInterval(viewerInterval);
  }, [streamInfo.thumbnail]);

  const sendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: {
        address: `0x${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
        displayName: "You"
      },
      message: chatMessage,
      timestamp: new Date(),
      type: "message"
    };

    setMessages(prev => [...prev, newMessage]);
    setChatMessage("");

    // Auto scroll to bottom
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendTip = () => {
    const tipMessage: ChatMessage = {
      id: Date.now().toString(),
      user: {
        address: `0x${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
        displayName: "You"
      },
      message: `Sent ${tipAmount} tokens! Keep up the great work! 🎉`,
      timestamp: new Date(),
      type: "tip",
      tipAmount: Number.parseInt(tipAmount)
    };

    setMessages(prev => [...prev, tipMessage]);

    // Auto scroll to bottom
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  const shareStream = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Stream URL copied to clipboard!");
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Video Player */}
      <div className="flex-1 flex flex-col">
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            controls={false}
            poster={streamInfo.thumbnail}
          >
            <track kind="captions" src="" label="English" />
          </video>

          {/* Video Overlay */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <Badge className="bg-red-600 text-white animate-pulse">
              🔴 LIVE
            </Badge>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{viewers.toLocaleString()}</span>
            </Badge>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-4 right-4 flex items-center space-x-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" size="icon">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stream Info */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{streamInfo.title}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={shareStream}
              className="flex items-center space-x-1"
            >
              <Share2 className="h-3 w-3" />
              <span>Share</span>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {streamInfo.streamer.address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{streamInfo.streamer.displayName}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {streamInfo.streamer.address.slice(0, 6)}...{streamInfo.streamer.address.slice(-4)}
                </p>
              </div>
              <Badge variant="outline">{streamInfo.category}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={isFollowing ? "secondary" : "default"}
                onClick={() => setIsFollowing(!isFollowing)}
                className="flex items-center space-x-1"
              >
                <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                <span>{isFollowing ? 'Following' : 'Follow'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-80 border-l flex flex-col bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Live Chat</span>
            <Badge variant="secondary">{viewers}</Badge>
          </CardTitle>
        </CardHeader>

        {/* Chat Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {msg.user.address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {msg.user.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                  {msg.type === "tip" && (
                    <Badge variant="secondary" className="text-xs">
                      💰 {msg.tipAmount}
                    </Badge>
                  )}
                  {msg.type === "follow" && (
                    <Badge variant="secondary" className="text-xs">
                      ❤️ Follow
                    </Badge>
                  )}
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tip Section */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2 mb-3">
            <Input
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="Amount"
              className="w-20"
              min="1"
            />
            <span className="text-sm text-muted-foreground">tokens</span>
            <Button
              onClick={sendTip}
              size="sm"
              className="flex items-center space-x-1"
            >
              <Gift className="h-3 w-3" />
              <span>Tip</span>
            </Button>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              size="icon"
              disabled={!chatMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Be respectful and follow community guidelines
          </p>
        </div>
      </div>
    </div>
  );
}
