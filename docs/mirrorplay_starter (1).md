# MirrorPlay Starter v0.2 – **Dynamic Wallets ✕ Web3 Auth**

A **Twitch‑style gameplay‑streaming platform** built from three pieces:

1. **magic‑mirror** – low‑latency WebRTC SFU (Go)
2. **Stream Twitter‑clone (React)** – social feed, chat & notifications
3. **Express + Thirdweb Auth** – Node.js API for wallet login, Stream user tokens, and go‑live hooks

---

## 🚀 What’s new in v0.2

| Area              | v0.1                               |  v0.2 (this doc)                                                                                     |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Login**         | Anonymous dev tokens               | 🔐 **Web3 sign‑in** via [Thirdweb Auth](https://portal.thirdweb.com/auth)                            |
| **Wallets**       | none                               | 🔑 Embedded wallets (social/email login) *or* externally connected wallets (Metamask, WalletConnect) |
| **User ID**       | hard‑coded "admin" / random viewer | Ethereum / EVM address (checksummed)                                                                 |
| **Stream Tokens** | dev tokens                         | Server‑issued Stream Chat + Feed tokens tied to wallet address                                       |
| **API Security**  | none                               | JWT Bearer tokens signed with `JWT_SECRET`                                                           |

---

## 1 · Updated project layout

```
mirrorplay-starter/
├── docker-compose.yml
├── magic-mirror/               # SFU (git submodule)
├── client/                     # React app
│   ├── src/
│   │   ├── App.jsx            # wrapped with ThirdwebProvider + AuthProvider
│   │   ├── hooks/useAuth.js
│   │   ├── pages/
│   │   │   ├── Login.jsx      # email / social / wallet connect
│   │   │   ├── Broadcast.jsx
│   │   │   └── Watch.jsx
│   │   └── mirror/signaling.js
│   └── package.json ( + @thirdweb-dev/* deps )
└── server/
    ├── index.js                # Express API + Thirdweb Auth backend
    ├── auth.js                 # login / verifySig helpers
    └── package.json ( + thirdweb, ethers, jsonwebtoken )
```

---

## 2 · Quick start

```bash
# clone + init submodules
$ git clone https://github.com/yourname/mirrorplay-starter.git
$ cd mirrorplay-starter && git submodule update --init

# configure env vars (see below)
$ cp .env.example .env && nano .env

# boot the stack
$ docker compose up --build
```

Open:

- **/login** → connect or create wallet → redirected to timeline
- **/broadcast** → share screen
- **/watch/{roomId}** → view + chat

---

## 3 · Environment variables (`.env.example`)

```dotenv
# Stream (getstream.io)
STREAM_API_KEY=
STREAM_API_SECRET=
STREAM_APP_ID=

# Thirdweb (portal.thirdweb.com)
THIRDWEB_CLIENT_ID=
THIRDWEB_SECRET_KEY=

# Express / JWT
PORT=4000
JWT_SECRET=replace_me
JWT_EXPIRY=7d
```

> **THIRDWEB\_CLIENT\_ID** – public, used by the browser SDK **THIRDWEB\_SECRET\_KEY** – keep on server only; signs login payloads

---

## 4 · Docker compose (excerpt)

```yaml
version: "3.9"
services:
  # ... SFU unchanged ...
  api:
    build: ./server
    environment:
      - STREAM_API_KEY
      - STREAM_API_SECRET
      - THIRDWEB_SECRET_KEY
      - JWT_SECRET
      - JWT_EXPIRY
    ports: ["4000:4000"]

  client:
    build: ./client
    environment:
      - VITE_STREAM_API_KEY=${STREAM_API_KEY}
      - VITE_THIRDWEB_CLIENT_ID=${THIRDWEB_CLIENT_ID}
    ports: ["5173:5173"]
    depends_on: [api, sfu]
```

---

## 5 · Web3 Auth Flow

1. **Frontend** calls `useLogin()` from `@thirdweb-dev/react` ⟶ prompts wallet/email/social.
2. Thirdweb SDK returns `{ payload, signature }`.
3. POST `/api/auth/login` with `{ payload, signature }`.
4. **Server** verifies signature via ThirdwebAuth ⟶ returns:
   ```json
   {
     "token": "<JWT>",
     "streamToken": "<Stream JWT>",
     "address": "0xAbC…"
   }
   ```
5. Front‑end stores tokens in `localStorage` and sets default axios `Authorization: Bearer <JWT>`.
6. Stream Chat client uses `streamToken` to connect as `user:id=<address>`.

> JWT claims: `{ sub: <address>, exp, iat }`

---

## 6 · Server snippets

### `server/auth.js`

```js
import { ThirdwebAuth, ThirdwebUser } from "@thirdweb-dev/auth/express";
import { StreamClient } from "stream";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const twAuth = ThirdwebAuth({
  privateKey: process.env.THIRDWEB_SECRET_KEY,
  domain: "mirrorplay.app"
});

export function issueJwt(address) {
  return jwt.sign({ sub: address.toLowerCase() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "7d"
  });
}

const stream = new StreamClient(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);
export function streamUserToken(address) {
  return stream.createUserToken(address.toLowerCase());
}
```

### `server/index.js` (only new routes shown)

```js
import express from "express";
import cors from "cors";
import { twAuth, issueJwt, streamUserToken } from "./auth.js";

const app = express();
app.use(cors());
app.use(express.json());

// ---- 1. login ----
app.post("/api/auth/login", twAuth.loginHandler, async (req, res) => {
  const user = req.user; // contains address
  const token = issueJwt(user.address);
  const streamToken = streamUserToken(user.address);
  res.json({ token, streamToken, address: user.address });
});

// ---- 2. guard middleware ----
function authenticate(req, _res, next) {
  const b = req.headers.authorization || "";
  const [, token] = b.split(" ");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return _res.status(401).end();
  }
}

// ---- 3. protected go‑live endpoints ----
app.post("/api/streams/start", authenticate, async (req, res) => {
  // use req.user.sub (wallet address) as actor
  /* … unchanged logic, but actor = `user:${req.user.sub}` */
});
```

---

## 7 · Frontend integration

### `client/src/main.jsx`

```jsx
import { ThirdwebProvider, AuthProvider } from "@thirdweb-dev/react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThirdwebProvider
    activeChain="ethereum"
    clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
  >
    <AuthProvider
      authUrl="/api/auth"  // proxies via Vite config to Express
      loginOptions={{ domain: "mirrorplay.app" }}
    >
      <App />
    </AuthProvider>
  </ThirdwebProvider>
);
```

### `client/src/hooks/useAuth.js`

```js
import { useAddress, useLogin, useLogout } from "@thirdweb-dev/react";
import axios from "axios";

export function useAuth() {
  const address = useAddress();
  const loginWithSig = useLogin();
  const logoutWallet = useLogout();

  async function login() {
    const data = await loginWithSig(); // returns { payload, signature }
    const res = await axios.post("/api/auth/login", data);
    localStorage.setItem("jwt", res.data.token);
    localStorage.setItem("streamToken", res.data.streamToken);
  }

  function logout() {
    localStorage.clear();
    logoutWallet();
  }

  return { address, login, logout };
}
```

### `client/src/pages/Login.jsx`

```jsx
import { ConnectWallet } from "@thirdweb-dev/react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { address, login } = useAuth();
  if (address) return (
    <button onClick={login} className="btn-primary mt-6">Sign message & enter</button>
  );
  return <ConnectWallet />; // embedded/social or browser wallet
}
```

> After successful login, React Router redirects user to `/` timeline (feeds powered by Stream, now authenticated).

### Updating **Broadcast/Watch**

- Replace hard‑coded dummy viewer token with `localStorage.getItem("streamToken")` when creating `StreamChat` instance.
- Actor address comes from `useAuth().address`.

---

## 8 · Tailwind/UX tweaks

Add a wallet‑connect button in the navbar showing ENS‑style shortened address and balance (optional via `viem`).

---

## 9 · Next enhancements (post‑auth)

1. **On‑chain tipping** – tip streamer via `ethers.js`, reflect as super‑chat.
2. **Gasless smart wallets** – upgrade embedded wallets to smart‑account (ERC‑4337) using Thirdweb’s Smart Wallet.
3. **Creator payouts dashboard** – query Polygon tx and display earnings.
4. **Signed thumbnails** – host S3 / CloudFront with signed URLs belonging to wallet address.

---

🎉 Dynamic wallets & secure auth are now wired in. Clone, set keys, `docker compose up` and enjoy wallet‑based chat, feeds, and streaming!

