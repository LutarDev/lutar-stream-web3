"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { WebRTCSignaling } from "@/lib/webrtc-signaling";
import { StreamChat } from "stream-chat";
import { Chat, Channel, Window, MessageList, MessageInput } from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { 
  Send, 
  Heart, 
  Share2, 
  Users,
  MessageCircle
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";

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
  const resolvedParams = useParams();
  const roomId = resolvedParams.roomId as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, login, isLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [tipAmount, setTipAmount] = useState("0.01");
  const [streamChatClient, setStreamChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const account = useActiveAccount();

  useEffect(() => {
    const initializeStream = async () => {
      try {
        // Connect to SFU for video
        const signaling = new WebRTCSignaling(roomId, "viewer");
        const { pc } = await signaling.connect();

        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
          }
        };

        // Initialize Stream Chat
        if (user?.streamToken) {
          const chatClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!
          );

          await chatClient.connectUser(
            {
              id: user.address,
              name: `User ${user.address.slice(0, 6)}...`,
            },
            user.streamToken
          );

          const chatChannel = chatClient.channel("livestream", `stream:${roomId}`, {
            name: `Stream ${roomId}`,
          });

          await chatChannel.watch();

          setStreamChatClient(chatClient);
          setChannel(chatChannel);

          // Listen for new messages
          chatChannel.on("message.new", (event) => {
            if (!event.message) return;
            
            setChatMessages((prev) => [
              ...prev,
              {
                id: event.message!.id,
                user: {
                  address: event.message!.user?.id || "unknown",
                  displayName: event.message!.user?.name || "Unknown User",
                },
                message: event.message!.text || "",
                timestamp: new Date(event.message!.created_at || Date.now()),
                type: "message",
              },
            ]);
          });
        }

        // Simulate viewer count updates
        const interval = setInterval(() => {
          setViewerCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
        }, 5000);

        return () => {
          clearInterval(interval);
          signaling.disconnect();
          if (streamChatClient) {
            streamChatClient.disconnectUser();
          }
        };
      } catch (error) {
        console.error("Failed to connect to stream:", error);
      }
    };

    if (roomId) {
      initializeStream();
    }
  }, [roomId, user, streamChatClient]);

  const sendMessage = () => {
    if (!messageInput.trim() || !channel) return;

    channel.sendMessage({
      text: messageInput,
    });

    setMessageInput("");
  };

  const sendTip = () => {
    if (!channel) return;

    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) return;

    channel.sendMessage({
      text: `🎉 Tipped ${amount} ETH!`,
      type: "system",
    });

    // In a real implementation, you would handle the actual payment here
    console.log(`Sending tip of ${amount} ETH`);
  };

  const shareStream = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Stream URL copied to clipboard!");
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  controls
                  className="w-full rounded-lg bg-black"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">LIVE</span>
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{viewerCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stream Info */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Stream Title</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={shareStream}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!account ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="mb-4">Connect your wallet to join the chat.</p>
                </div>
              ) : !user && !isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="mb-4">Sign in to join the chat.</p>
                  <button className="btn btn-primary" onClick={login}>Sign In</button>
                </div>
              ) : streamChatClient && channel ? (
                <Chat client={streamChatClient} theme="livestream dark">
                  <Channel channel={channel}>
                    <Window>
                      <MessageList />
                      <MessageInput focus />
                    </Window>
                  </Channel>
                </Chat>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 p-2">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="font-medium text-blue-400">
                          {msg.user.displayName}
                        </span>
                        <span className="text-gray-300 ml-2">{msg.message}</span>
                        <span className="text-gray-500 ml-2 text-xs">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t p-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <Button onClick={sendMessage} size="sm">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        placeholder="0.01"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                      <Button onClick={sendTip} variant="outline" size="sm">
                        <Heart className="w-4 h-4 mr-1" />
                        Tip
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
