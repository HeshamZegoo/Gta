# METRO CITY — Mobile Open-World Driving Prototype

A mobile-first 3D browser game built with Three.js. This repository is an evolving playable prototype, not a finished commercial-scale GTA replacement.

## Play locally
Serve this folder over HTTP (ES modules and GLB loading do not work reliably from `file://`):
```bash
python -m http.server 8080
```
Open `http://localhost:8080`.

## Controls
- Touch: movement pad, ENTER CAR, then steering / GAS / BRAKE.
- Keyboard: WASD or arrow keys, E to enter/exit, Shift to sprint.

## Implemented
- Procedural city blocks, road grid, sidewalks, buildings, trees and street lights.
- Third-person on-foot controller and drivable vehicles.
- Parked vehicles and simple ambient traffic.
- Mobile touch HUD and keyboard controls.
- ACES tone mapping, sRGB output, shadows and adaptive pixel ratio.
- Asynchronous loading of the Spectral GT RS detailed vehicle GLB, with a procedural fallback if the remote asset cannot load.

## Vehicle asset and license
The primary detailed vehicle is **Spectral GT RS**, authored by JaronKBragg7337 and released under **CC0 1.0 Universal** (public domain dedication). The game loads the GLB from the upstream repository at runtime:
`https://raw.githubusercontent.com/JaronKBragg7337/spectral-gt-rs/main/spectral_gt_rs_game_ready.glb`

The source asset includes detailed exterior/interior materials and animation clips. The game currently uses its static model; full steering/wheel/door animation integration remains future work. See [the source repository](https://github.com/JaronKBragg7337/spectral-gt-rs) and [CC0 license](https://creativecommons.org/publicdomain/zero/1.0/).\n\nA second generic mid-engine supercar is loaded from Innerscene's original CC0 model library: [model page](https://www.innerscene.com/tools/library/3d-parts/generic-mid-engine-supercar-73f252c5). It is unbranded and modeled at real-world scale.

## Graphics / performance notes
- ACES tone mapping and sRGB output are enabled; this is not a claim of HDR10 display output.
- Desktop pixel ratio is capped for performance; mobile uses a lower cap. Native 4K is not forced on phones.
- NVIDIA DLSS 5 is not a drop-in browser feature for iPhone/Android. This web build uses browser/WebGL rendering and adaptive resolution instead.
- The city buildings and player character are still procedural game assets, not photogrammetry or a professionally rigged photorealistic human. The vehicle models are detailed but the game does not yet have a large licensed fleet, animated doors/steering, or full cockpit instrumentation.\n- Driving collisions and handling are arcade approximations, not a full tire/suspension rigid-body simulation.\n- Multiplayer is an experimental one-peer WebRTC data connection using PeerJS's public signaling service; it is not a dedicated server, not a guaranteed same-LAN discovery system, and has not been load-tested. It currently synchronizes player/vehicle position and rotation only.

## Deploy
The GitHub Actions workflow in `.github/workflows/pages.yml` deploys to GitHub Pages after Pages is enabled in repository settings with **Build and deployment → Source → GitHub Actions**. The workflow attempts to enable Pages automatically, but the connected GitHub integration may not have permission to create the Pages site. If the first run reports `Resource not accessible by integration`, enable Pages manually under **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run the workflow. A live deployment must be confirmed in the Actions tab before treating the game URL as published.\n\n## Multiplayer\n1. Open the same published game on two devices.\n2. On the first device choose **MULTIPLAYER → HOST** and share the six-digit room code.\n3. On the second device enter that code and choose **JOIN**.\n4. The connection uses a public PeerJS signaling broker and a direct peer data channel; both devices need internet access. Browser support and broker availability may vary.
