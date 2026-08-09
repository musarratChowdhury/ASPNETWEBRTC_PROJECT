# AGENTS.md

WebRTC video-conferencing demo: ASP.NET Core 7 MVC + SignalR (room presence/chat) with PeerJS (P2P media). Single web project, no tests, no database.

## Build & run — read this first
- The csproj has an MSBuild target (`aspnetwebrtc_project`, `BeforeTargets="Build"`) that runs `npm run css:build` before **every** build. Building requires Node/npm + `npm install` (tailwind, daisyui).
- **Gotcha:** `npm run css:build` runs `npx tailwindcss ... --watch`, which never exits. A CLI `dotnet build` / `dotnet run` will hang (the project is only buildable this way under Visual Studio's up-to-date check, or by killing the watch). For a one-shot rebuild run `npx tailwindcss -i ./wwwroot/css/site.css -o ./wwwroot/css/styles.css` (no `--watch`), then let `dotnet build` run with the output already current.
- `wwwroot/css/site.css` is the tailwind **input** (`@tailwind` directives); `wwwroot/css/styles.css` is the committed **output** the layout references (`_Layout.cshtml`). Never edit `styles.css` directly.
- Client browser libs come from libman (`libman.json` → `wwwroot/js/dist/browser/signalr.min.js`); run `libman restore` if missing. PeerJS is loaded from the unpkg CDN in `Views/Home/Room.cshtml` (needs internet at runtime).
- No tests exist. `npm test` is a stub that exits non-zero.

## Architecture
- SignalR hub `DefaultHub` (`Hubs/DefaultHub.cs`) is mapped at `/meeting` in `Program.cs`. A "room" is just a SignalR group; join/leave/chat events are group-broadcast.
- Rooms are implicit and unvalidated: `HomeController.JoinRoom` redirects to `/{Guid.NewGuid()}`, and `[HttpGet("/{roomId}")] Room` renders the room view. There is no room registry or persistence.
- Media plane is `wwwroot/js/room.js`: `new Peer()` (PeerJS default cloud server) for P2P audio/video; SignalR only signals `user-connected`/`user-disconnected` and chat (`ReceiveMessage`).
- `Users.list` (`Hubs/Users.cs`) is a static in-memory `Dictionary<connectionId, userId>` — per-process only, lost on restart, unusable across scaled-out instances. Don't extend patterns that assume it survives.
- Inconsistent namespaces: `Hubs/DefaultHub.cs` declares `AspNetWebRTC.Hubs` while `Users.cs`/controllers use `ASPNETWEBRTC_PROJECT.*`. Follow the file you're editing's own namespace.

## Docker
- `Dockerfile` installs Node 14 (nodesource), but `package.json` needs tailwind ^3.4.1 / daisyui ^4.6.1 (require Node ≥14/16) and the pre-build tailwind `--watch` will block `docker build`. If Docker builds, they must have been pre-built; changes to `site.css` won't propagate through the image.
