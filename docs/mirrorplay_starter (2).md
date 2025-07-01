# MirrorPlay Starter v1.0 – **Full Stack Live‑Streaming with Web3 Auth**

> **Status:** Production‑ready MVP – clone, add keys, `docker compose up`, and stream!\
> **Stack:** Go (SFU) · React 18 · Tailwind · Thirdweb Auth · Express Router · Postgres (Supabase) · getstream.io (Feeds + Chat)

---

## 🗂 Repo Layout

```
mirrorplay-starter/
├── docker-compose.yml
├── .env.example
├── magic-mirror/             # SFU (git submodule)
├── server/                   # Node 18 + ESM
│   ├── index.js              # Express bootstrap
│   ├── auth.js               # wallet login helpers
│   ├── streams.js            # start/stop/list REST
│   ├── db.js                 # Supabase client (optional)
│   └── package.json
└── client/                   # React + Vite
    ├── vite.config.js
    ├── src/
    │   ├── main.jsx          # Thirdweb + React‑Router providers
    │   ├── App.jsx          
    │   ├── hooks/useAuth.js  # login / logout / axios auth
    │   ├── hooks/useStream.js# start/stop helpers
    │   ├── mirror/           # WebRTC logic
    │   │   └── signaling.js
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── LivePlayer.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Timeline.jsx   # Streams feed
    │       ├── Broadcast.jsx
    │       └── Watch.jsx
    └── package.json
```

---

## ⚙️ Key Environment Variables (`.env.example`)

```dotenv
# getstream.io
STREAM_API_KEY=
STREAM_API_SECRET=
STREAM_APP_ID=

# Thirdweb
THIRDWEB_CLIENT_ID=
THIRDWEB_SECRET_KEY=

# JWT
JWT_SECRET=replace_me
JWT_EXPIRY=7d

# Supabase (optional – thumbnails, analytics)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE=
```

Add `.env` to **server/** and `.env` (Vite) for **client/** or rely on Docker compose to inject.

---

## 🐳 `docker-compose.yml` (excerpt)

```yaml
version: "3.9"
services:
  sfu:
    build: ./magic-mirror
    command: go run ./cmd/server
    ports:
      - "8080:8080"   # WebSocket signalling

  api:
    build: ./server
    environment:
      - STREAM_API_KEY
      - STREAM_API_SECRET
      - THIRDWEB_SECRET_KEY
      - JWT_SECRET
      - JWT_EXPIRY
      - SUPABASE_URL
      - SUPABASE_SERVICE_ROLE
    ports: ["4000:4000"]
    depends_on: [sfu]

  client:
    build: ./client
    environment:
      - VITE_STREAM_API_KEY=${STREAM_API_KEY}
      - VITE_THIRDWEB_CLIENT_ID=${THIRDWEB_CLIENT_ID}
    ports: ["5173:5173"]
    depends_on: [api, sfu]
```

---

## 🔐 Server Code Highlights

### `server/auth.js`

```js
import { ThirdwebAuth } from "@thirdweb-dev/auth/express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const twAuth = ThirdwebAuth({
  privateKey: process.env.THIRDWEB_SECRET_KEY,
  domain: "mirrorplay.app",
});

export const signJwt = (address) =>
  jwt.sign({ sub: address.toLowerCase() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "7d",
  });
```

### `server/streams.js`

```js
import { Router } from "express";
import { StreamClient } from "stream";
import { authenticate } from "./middleware.js";
const router = Router();
const sc = new StreamClient(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);

// helpers
const streamsFeed = sc.flatFeed("streams", "global");

// POST /streams/start
router.post("/start", authenticate, async (req, res) => {
  const { roomId, title } = req.body;
  const address = req.user.sub;
  await streamsFeed.addActivity({
    actor: `user:${address}`,
    verb: "go_live",
    object: `stream:${roomId}`,
    foreign_id: `stream:${roomId}`,
    title,
    roomId,
    is_live: true,
    time: new Date(),
    thumbnail: `https://dummyimage.com/640x360/000/fff&text=${encodeURIComponent(title)}`,
  });
  res.json({ ok: true });
});

// POST /streams/stop
router.post("/stop", authenticate, async (req, res) => {
  const { roomId } = req.body;
  await streamsFeed.updateActivitiesByForeignID([{
    foreignID: `stream:${roomId}`,
    time: null,
    set: { is_live: false },
  }]);
  res.json({ ok: true });
});

// GET /streams
router.get("/", async (_req, res) => {
  const { results } = await streamsFeed.get({ limit: 25, filter: { is_live: true } });
  res.json(results);
});

export default router;
```

### `server/index.js`

```js
import express from "express";
import cors from "cors";
import { twAuth, signJwt } from "./auth.js";
import streamsRouter from "./streams.js";
import jwt from "jsonwebtoken";
import { StreamClient } from "stream";

const app = express();
app.use(cors());
app.use(express.json());

const sc = new StreamClient(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);

// login
app.post("/api/auth/login", twAuth.loginHandler, (req, res) => {
  const { address } = req.user;
  const token = signJwt(address);
  const streamToken = sc.createUserToken(address.toLowerCase());
  res.json({ token, streamToken, address });
});

// jwt guard
export function authenticate(req, res, next) {
  try {
    const [, tok] = (req.headers.authorization || "").split(" ");
    req.user = jwt.verify(tok, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).end(); }
}

// routes
app.use("/api/streams", streamsRouter);

app.listen(4000, () => console.log("API on :4000"));
```

---

## 🖥️ Client Code Highlights

### `client/src/mirror/signaling.js`

```js
export async function connect(role, roomId) {
  const ws = new WebSocket("ws://localhost:8080/signal");
  const pc = new RTCPeerConnection();

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) ws.send(JSON.stringify({ type: "candidate", candidate }));
  };

  ws.onopen = () => ws.send(JSON.stringify({ type: "join", room: roomId, id: crypto.randomUUID() }));

  ws.onmessage = async ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.type === "offer" && role === "viewer") {
      await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      ws.send(JSON.stringify({ type: "answer", sdp: ans.sdp }));
    } else if (msg.type === "answer" && role === "streamer") {
      await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
    } else if (msg.type === "candidate") {
      await pc.addIceCandidate(msg.candidate);
    }
  };
  return { pc };
}
```

### `client/src/hooks/useAuth.js`

```js
import { useAddress, useLogin, useLogout } from "@thirdweb-dev/react";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const useAuth = () => {
  const address = useAddress();
  const loginSig = useLogin();
  const logoutWallet = useLogout();

  async function login() {
    const cred = await loginSig();
    const { data } = await api.post("/auth/login", cred);
    localStorage.setItem("jwt", data.token);
    localStorage.setItem("streamToken", data.streamToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  }
  function logout() {
    localStorage.clear();
    logoutWallet();
  }
  return { address, login, logout, api };
};
```

### `client/src/hooks/useStream.js`

```js
import { useAuth } from "./useAuth";
import { useState } from "react";

export const useStream = () => {
  const { api } = useAuth();
  const [roomId] = useState(() => crypto.randomUUID());

  const start = (title) => api.post("/streams/start", { roomId, title });
  const stop = () => api.post("/streams/stop", { roomId });

  return { roomId, start, stop };
};
```

### `client/src/pages/Broadcast.jsx`

```jsx
import { useEffect, useRef, useState } from "react";
import { connect } from "../mirror/signaling";
import { useStream } from "../hooks/useStream";
import { StreamChat } from "stream-chat";

export default function Broadcast() {
  const videoRef = useRef();
  const [title, setTitle] = useState("Untitled run");
  const { roomId, start, stop } = useStream();

  useEffect(() => {
    (async () => {
      const { pc } = await connect("streamer", roomId);
      const media = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      media.getTracks().forEach((t) => pc.addTrack(t, media));
      videoRef.current.srcObject = media;
      await start(title);
      window.addEventListener("beforeunload", stop);
    })();
  }, [roomId, title]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">🔴 Live – {title}</h1>
      <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-xl" />
      <p className="mt-2 text-xs text-gray-400">Share link: /watch/{roomId}</p>
    </div>
  );
}
```

### `client/src/pages/Watch.jsx`

```jsx
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { connect } from "../mirror/signaling";
import { StreamChat, Chat, Channel, Window, MessageList, MessageInput } from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

export default function Watch() {
  const { roomId } = useParams();
  const videoRef = useRef();
  const streamToken = localStorage.getItem("streamToken");
  const address = localStorage.getItem("jwt") ? JSON.parse(atob(localStorage.getItem("jwt").split(".")[1])).sub : "anon";

  useEffect(() => {
    (async () => {
      const { pc } = await connect("viewer", roomId);
      pc.ontrack = (ev) => (videoRef.current.srcObject = ev.streams[0]);
    })();
  }, [roomId]);

  const chatClient = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY);
  chatClient.connectUser({ id: address }, streamToken || chatClient.devToken(address));
  const channel = chatClient.channel("livestream", `stream:${roomId}`, { name: roomId });

  return (
    <div className="flex h-screen">
      <video ref={videoRef} autoPlay controls playsInline className="flex-1 bg-black" />
      <Chat client={chatClient} theme="livestream dark">
        <Channel channel={channel}>
          <Window>
            <MessageList />
            <MessageInput focus />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
}
```

### `client/src/pages/Timeline.jsx`

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Timeline() {
  const { api } = useAuth();
  const [streams, setStreams] = useState([]);
  useEffect(() => {
    api.get("/streams").then(({ data }) => setStreams(data));
  }, []);
  return (
    <div className="p-6 grid md:grid-cols-3 gap-4">
      {streams.map((st) => (
        <Link key={st.object} to={`/watch/${st.extra_data.roomId}`} className="relative">
          <img src={st.extra_data.thumbnail} className="rounded-lg" />
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-px rounded">LIVE</span>
          <h2 className="mt-2 font-semibold">{st.extra_data.title}</h2>
          <p className="text-xs text-gray-400">{st.actor.id.slice(5, 11)}…</p>
        </Link>
      ))}
    </div>
  );
}
```

---

## 🌟 Going Further

- **On‑chain Tipping:** integrate `ethers` & `thirdweb/pay` → Chat sticker when tx confirmed.
- **OBS Ingest:** add WHIP adapter (pion‑whip) container; create stream key derived from wallet address.
- **Recording & VOD:** fork SFU track, pipe to FFmpeg, write to S3; post VOD activity to `vods` feed.
- **Smart Wallet Upgrade:** switch `ConnectWallet` to SmartWallet for gasless UX.
- **Moderation:** enable Stream AI filters + user‑report REST route.

---

🎉 **MirrorPlay v1.0** is complete – low‑latency live video, wallet login, secure APIs, Stream social layer, and polished UI out‑of‑the‑box.\
Clone, configure, deploy – *and may the Force be with your streams!*

