# MirrorPlay Starter v1.1 – **Web3 Live‑Streaming with Tipping, VOD & OBS Support**

> **Status:** Advanced MVP – extended with monetization, ingest, and replay.\
> **Stack:** Go (SFU) · React 18 · Tailwind · Thirdweb Auth · Express Router · FFmpeg · getstream.io · Supabase

---

## 🔮 New Features in v1.1

### 🎁 **On-Chain Tipping with thirdweb/pay**

Stream viewers can tip streamers using ERC20 tokens:

```jsx
import { Web3Button } from "@thirdweb-dev/react";

<Web3Button
  contractAddress="<YOUR_CONTRACT_ADDRESS>"
  action={(contract) => contract.erc20.transfer(streamerAddress, tipAmount)}
>
  Send Tip
</Web3Button>
```

→ Hook this into chat: on transfer success, send a Stream message:

```js
await channel.sendMessage({ text: `🎉 ${shortAddr(viewer)} tipped ${tipAmount} tokens!`, type: "system" });
```

---

### 🧪 **OBS Ingest via WHIP Adapter**

Use [pion/whip](https://github.com/pion/whip) as a lightweight ingest adapter:

- Add `whip-adapter` container to `docker-compose.yml`
- Route incoming OBS stream via HTTP WHIP to SFU
- Derive ingest keys from wallet (e.g. `0x...` maps to `/whip/0xabc123`)

Client instructions:

```txt
OBS Settings:
- Streaming Server: http://<your-ip>:8080/whip/<wallet>
- Stream Key: unused
```

---

### 🎞️ **VOD Recording + Playback**

Record every stream and make it playable later:

- Use `ffmpeg` to fork WebRTC stream from SFU
- Store recording to Supabase storage or S3 bucket
- Emit `vod_posted` activity to `vods` feed on finish

Docker example:

```yaml
vod:
  image: ffmpeg
  volumes:
    - ./recordings:/vod
  command: >
    ffmpeg -i http://sfu:8080/room/{roomId}/output \
           -c:v libx264 -preset ultrafast -c:a aac \
           /vod/{roomId}.mp4
```

Serve VODs via a new route:

```js
router.get("/vods", async (_req, res) => {
  const { results } = await vodsFeed.get({ limit: 20 });
  res.json(results);
});
```

Add VOD player page:

```jsx
<video src={`https://your.s3/${roomId}.mp4`} controls className="rounded-xl" />
```

---

### 🔮 **Smart Wallet Upgrade (optional)**

Use `SmartWallet` from Thirdweb for:

- gasless transactions (via relayers)
- session keys for smooth UX
- contract‑based login (can be delegated)

Example:

```js
<ThirdwebProvider
  supportedWallets={[
    smartWallet(
      embeddedWallet(),
      {
        factoryAddress: "0x...",
        gasless: true,
      }
    ),
  ]}
>
```

---

### 🛡️ **Moderation Tools**

Enable chat safety and stream reporting:

- Enable AI moderation via getstream.io filters
- Allow `/report` or emoji triggers to flag abuse
- Add admin REST route to list flagged content

REST example:

```js
router.post("/moderation/report", authenticate, async (req, res) => {
  const { roomId, reason } = req.body;
  await db.insert("reports", { from: req.user.sub, roomId, reason });
  res.json({ ok: true });
});
```

Stream moderation UI:

```jsx
<button onClick={() => api.post("/moderation/report", { roomId, reason: "spam" })}>
  🚩 Report
</button>
```

---

## 🚀 Next Steps

- Add searchable `vods` feed (Stream or Supabase)
- Add `tip history` & leaderboards to streamer profiles
- Embed `on-chain badge` system for top supporters
- Multi-host rooms (P2P or SFU mesh)
- Cross-post to Farcaster or Lens

---

🧠 **MirrorPlay v1.1** is now a fully extensible Web3 stream+social platform: monetized, archived, OBS‑ready, and fit for the metaverse.

Fire it up — and may the Force scale with your viewers.

