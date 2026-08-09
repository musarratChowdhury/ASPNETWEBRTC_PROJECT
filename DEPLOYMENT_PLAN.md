# Deployment Plan: WebRTC Meeting App → Cloudflare + Firebase (free)

Status: approved (media plane = native WebRTC via Durable Object; auth = optional sign-in; repo layout = new `meet-worker/` subfolder).

## Reality check

Cloudflare's free tier runs Workers (JS/TS), static assets, Durable Objects, KV/R2/D1 — it does **not** run ASP.NET Core / SignalR. The SignalR hub and Razor runtime must be replaced, mirroring the HC2 migration (`hc2-worker`: SignalR GameHub → `GameRoom` Durable Object; static SPA served via `assets` binding; Firebase ID-token verification with `jose`).

| Current app | Cloudflare replacement |
|---|---|
| `Program.cs` + `DefaultHub` (SignalR at `/meeting`) | Cloudflare Worker + `MeetingRoom` Durable Object (WebSocket) |
| `HomeController.JoinRoom` / `[HttpGet("/{roomId}")]` | Static `index.html`: create button sets `location = /<crypto.randomUUID()>`; room page reads id from URL |
| `Views/*.cshtml` + tailwind `styles.css` | Static assets served via Worker `assets` binding |
| `room.js` PeerJS + SignalR | Native `RTCPeerConnection` + WebSocket signaling; TURN from Cloudflare |
| `Users.list` static dictionary | DO instance per room (`idFromName(roomId)`) — real presence |

## Target architecture

```
Browser (static site on Worker assets)
  ├─ index.html  (Create meeting → /<uuid>)
  ├─ room.html   (video grid, chat, copy link, optional sign-in)
  ├─ room.js     (native RTCPeerConnection + WebSocket signaling + TURN)
  └─ styles.css  (existing tailwind output, copied)
        │
        ▼  WebSocket  /ws/room/:roomId
Cloudflare Worker (meet-worker/)
  ├─ src/index.ts          routes: /ws/room/*, /api/turn, /api/auth-check, static assets
  ├─ src/meetingRoom.ts    Durable Object = per-room presence + signaling + chat relay
  ├─ src/firebase.ts       jose JWKS verifyIdToken (ported from hc2-worker)
  └─ wrangler.jsonc        DO binding, assets binding, vars, secrets
        │
        ├─ Cloudflare Realtime TURN  (free 1000 GB/mo) — /api/turn issues short-lived iceServers
        └─ Firebase Auth (free 50k MAU) — email/password + Google, optional sign-in
```

## Phase 1 — Scaffold `meet-worker/` (mirror `hc2-worker/`)

- `package.json` (wrangler ^4, typescript, `jose`), `tsconfig.json`, `wrangler.jsonc`, `.dev.vars`, `AGENTS.md` (Cloudflare docs pointers — copy HC2's).
- `wrangler.jsonc`:
  - `durable_objects.bindings`: `MEETING_ROOM` → `MeetingRoom`; `migrations` with `new_sqlite_classes: ["MeetingRoom"]`.
  - `assets`: `{ directory: "./dist", binding: "ASSETS", not_found_handling: "single-page-application" }`.
  - `vars`: `FIREBASE_PROJECT_ID`, `TURN_KEY_ID`.
  - `compatibility_flags`: `nodejs_compat`.
- `src/firebase.ts`: copy from `hc2-worker/src/firebase.ts` unchanged (jose JWKS — needs only the project id, no service account).

Free-tier fit: Workers 100k req/day, 10ms CPU, DO on free plan, static assets free/unlimited. WebSocket upgrade = 1 request; messages are free.

## Phase 2 — `MeetingRoom` Durable Object (replaces `Hubs/DefaultHub.cs`)

- WebSocket Hibernation API (`WebSocketPair`, `ctx.acceptWebSocket`, `webSocketMessage`/`webSocketClose`) — same pattern as HC2's `GameRoom`.
- Participant roster on the object: `{ id, displayName, uid? }[]`; object keyed by `idFromName(roomId)`.
- Protocol (JSON over WS):
  - `join {roomId, displayName, token?}` → register; reply `joined {self, participants}`; broadcast `user-connected` to others.
  - `signal {to, data}` → relay SDP/ICE **only to the target connection** (point-to-point, not group broadcast).
  - `chat {message}` → broadcast `chat {from, message}`.
  - `bye` / `webSocketClose` → broadcast `user-disconnected`, remove from roster.

## Phase 3 — Worker routes (`src/index.ts`)

- `GET /ws/room/:roomId` → upgrade to the DO (port HC2's `handleGameRoom`; reject non-WebSocket with 426).
- `GET /api/turn` → `POST https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate-ice-servers` with `Authorization: Bearer ${TURN_KEY_API_TOKEN}` (secret) and `{"ttl": 14400}`; return the `iceServers` array (drop the alternate port-53 URLs browsers block). Optionally cache ~10 min in KV.
- `GET /api/auth-check` → `verifyIdToken` from `Authorization: Bearer` → `{uid, name, email}` or 401.
- default → `env.ASSETS.fetch(request)`.

## Phase 4 — Front-end (static, no build step)

- `dist/index.html`: port `Views/Home/Index.cshtml` + `site.js` (button → `location = /${crypto.randomUUID()}`).
- `dist/room.html`: port `Views/Home/Room.cshtml` (video grid, chat UI, copy link).
- `dist/room.js`: rewrite dropping `signalr.min.js` and PeerJS:
  - connect WS to `/ws/room/<id>`; token sent in the `join` message if signed in.
  - `getUserMedia` → local stream; per remote participant create `RTCPeerConnection({ iceServers: await (await fetch('/api/turn')).json() })`, `addTrack`, `createOffer`, send `signal`; handle `onicecandidate`; answer incoming offers; attach `ontrack` to the video grid.
  - `user-connected` → create connection; `user-disconnected` → close it + remove video element.
  - chat wired to `chat` messages.
- `dist/assets/css/styles.css` + `room.css`: copy from `wwwroot/css/` (committed output — no tailwind run at deploy; the `--watch` build gotcha is irrelevant here).
- **Optional sign-in:** Firebase Auth compat SDK via CDN; "Sign in" gate personalizes chat name; guests join anonymously as `Guest-xxxx`. HTTPS (workers.dev) satisfies the camera/mic secure-context requirement.

## Phase 5 — Firebase setup (manual, in browser)

- Create a Firebase project (or a new one) → add a Web app → copy web config (`apiKey`, `authDomain`, `projectId`) into `dist` config and set `FIREBASE_PROJECT_ID`.
- Enable Authentication: Email/Password + Google.
- No Firestore/Storage for v1 (avoids the 2026 Storage-on-Spark caveat; use Cloudflare R2 free tier if file sharing is ever needed).

## Phase 6 — TURN setup (manual, in browser)

- Cloudflare Dashboard → Realtime → create a TURN key → copy **Token ID** (`TURN_KEY_ID` var) and **API Token** (`wrangler secret put TURN_KEY_API_TOKEN`).
- Free tier: first 1,000 GB/month egress-to-client; STUN free/unlimited.
- TURN endpoints: `turn.cloudflare.com:3478` (udp/tcp), `5349`/`443` (tls). Credentials are short-lived (TTL); refresh via `RTCPeerConnection.setConfiguration()` if a call outlives them.

## Phase 7 — Deploy & verify

```bash
cd meet-worker
npm i
npx wrangler login          # interactive, browser
npx wrangler secret put TURN_KEY_API_TOKEN
npx wrangler deploy          # → https://<name>.<subdomain>.workers.dev
```

- Verify: two incognito windows, same link → video/audio both ways (TURN across NAT), chat works, optional sign-in flow; `npx wrangler tail` for logs.
- Update repo `AGENTS.md`: document `meet-worker/` as the live deployment; the ASP.NET project becomes legacy reference.

## What stays / goes

- **Goes:** SignalR, PeerJS dependency, Razor runtime, Dockerfile (not the deploy path), `Users.list`.
- **Stays:** tailwind UI (copied CSS), video-grid/chat markup, copy-link UX, the .NET project as reference source.

## Things needed from the human

1. Firebase project ID + web config (or reuse the `hcdb-22f1d`-style setup and paste the config).
2. Cloudflare TURN Token ID + API Token.
3. `npx wrangler login` (interactive — cannot be automated) and deploy permission.
