export interface SignalingMessage {
  type: "join" | "offer" | "answer" | "candidate" | "leave";
  room?: string;
  id?: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

export class WebRTCSignaling {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private roomId: string;
  private role: "streamer" | "viewer";

  constructor(roomId: string, role: "streamer" | "viewer") {
    this.roomId = roomId;
    this.role = role;
  }

  async connect(): Promise<{ pc: RTCPeerConnection; ws: WebSocket }> {
    return new Promise((resolve, reject) => {
      const sfuUrl = process.env.NEXT_PUBLIC_SFU_URL || "ws://localhost:8080";
      this.ws = new WebSocket(`${sfuUrl}/signal`);
      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.ws!.send(
          JSON.stringify({
            type: "join",
            room: this.roomId,
            id: crypto.randomUUID(),
          })
        );
        resolve({ pc: this.pc!, ws: this.ws! });
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      // Handle incoming messages
      this.ws.onmessage = async (event) => {
        const message: SignalingMessage = JSON.parse(event.data);
        await this.handleMessage(message);
      };

      // Handle ICE candidates
      this.pc.onicecandidate = ({ candidate }) => {
        if (candidate && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: "candidate",
              candidate,
            })
          );
        }
      };
    });
  }

  private async handleMessage(message: SignalingMessage) {
    if (!this.pc) return;

    switch (message.type) {
      case "offer":
        if (this.role === "viewer") {
          await this.pc.setRemoteDescription({
            type: "offer",
            sdp: message.sdp!,
          });
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.ws!.send(
            JSON.stringify({
              type: "answer",
              sdp: answer.sdp,
            })
          );
        }
        break;

      case "answer":
        if (this.role === "streamer") {
          await this.pc.setRemoteDescription({
            type: "answer",
            sdp: message.sdp!,
          });
        }
        break;

      case "candidate":
        if (message.candidate) {
          await this.pc.addIceCandidate(message.candidate);
        }
        break;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
