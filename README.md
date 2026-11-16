# METRO CITY — Mobile Open-World Driving Prototype

A browser-based 3D open-world driving prototype built with Three.js. This is an evolving game prototype, not a finished commercial-scale GTA replacement.

## Run locally

Serve this folder over HTTP (ES modules and GLB loading do not work reliably from `file://`):

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Controls

- Touch: movement pad, ENTER CAR, then steering / GAS / BRAKE.
- Keyboard: WASD or arrow keys, E to enter/exit, Shift to sprint, C to switch chase/cockpit camera.

## Current gameplay

- Procedural city blocks, asphalt, lane markings, sidewalks, textured building facades, balconies, rooftop equipment, trees and streetlights.
- Third-person on-foot controller, sprinting, drivable cars, chase and cockpit camera modes.
- Parked vehicles and simple ambient traffic with pedestrian walk cycles.
- Building collision uses rectangular footprints rather than oversized circular hit zones; vehicle impacts also check nearby vehicles.
- A four-checkpoint timed driving mission, free-roam checkpoint rewards, cash HUD and minimap.
- Local save data for cash, player position and parked/main vehicle positions.
- Mobile touch HUD and keyboard controls.
- Multiplayer prototype with a six-digit room code, one remote peer, bounded position updates and smoothed remote movement.

## Vehicle assets and licensing

The game loads five detailed generic vehicle models at runtime. Their sources, exact runtime URLs and license details are documented in [ASSET_CREDITS.md](./ASSET_CREDITS.md).

All five remote models are optional: if a download or host fails, the detailed procedural fallback cars remain available. The game currently uses static vehicle meshes; model-specific wheel, steering, door and suspension animation is not fully integrated.

## Graphics and performance

- Three.js WebGL rendering with ACES tone mapping, sRGB output, PBR materials, PMREM studio fallback reflections, Poly Haven Urban Street 01 HDR environment reflections, locally-following directional shadows and adaptive pixel ratio (up to 2x on large desktop displays), a procedural atmospheric sky dome and a city-street HDRI reflection environment.
- Five distinct unbranded CC0 GLB cars are distributed across player, parked and traffic vehicles: Spectral GT RS, a generic 1990s JDM coupe, a mid-engine supercar, a four-door sedan and a compact SUV. The game keeps the procedural vehicle fallback if a remote asset cannot load.
- HDR environment lighting improves physically based reflections, but the renderer is not HDR10 output and does not provide native 4K rendering on mobile.
- NVIDIA DLSS is not a drop-in feature for this WebGL build and DLSS 5 is not integrated. A native PC engine build would be needed for that class of GPU feature.
- City buildings and the player character are procedural assets, not photogrammetry or professionally rigged photorealistic assets. The city is a compact generated map, not a real-world-scale GTA map.
- Driving remains arcade-style; there is no full tire, suspension, deformation or rigid-body simulation.

## Multiplayer limitations

Multiplayer uses PeerJS public signaling and a direct WebRTC data channel. It is experimental, supports one remote peer in the current implementation, requires internet access to reach the signaling service, and has not been load-tested or verified across a range of devices/networks. It is not a dedicated server or guaranteed LAN discovery.

## Deploy

The GitHub Actions workflow in `.github/workflows/pages.yml` deploys to GitHub Pages. Check the Actions tab for a successful Pages deployment before assuming the latest commit is live.

## Credits

See [ASSET_CREDITS.md](./ASSET_CREDITS.md) for third-party model credits and license notes.
