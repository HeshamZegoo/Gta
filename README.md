# METRO CITY — Mobile Open World

A mobile-first 3D browser game prototype built with Three.js.

## Run locally
Serve this folder over HTTP (ES modules do not work reliably from file://):
```bash
python -m http.server 8080
```
Open http://localhost:8080.

## Controls
- Touch: movement pad, ENTER CAR, then steering / GAS / BRAKE.
- Keyboard: WASD or arrow keys, E to enter/exit, Shift to sprint.

## Current playable foundation
- Procedural city grid, roads, buildings, street trees and street lights.
- Third-person character controller.
- Drivable vehicles, parked cars and simple ambient traffic.
- Mobile HUD and touch controls.
- ACES tone mapping, shadows and adaptive pixel ratio.

## Asset roadmap
The current character, cars and city are procedural placeholders, not the final photoreal assets. Next: replace them with verified, properly licensed GLB assets (realistic vehicles, rigged characters, modular architecture, props and PBR materials), then test each asset in the browser before calling it final.

## 4K / HDR / DLSS
- ACES tone mapping and sRGB output are enabled. True HDR display output depends on browser, OS and display support; this prototype does not claim full HDR10 output.
- Native 4K rendering is intended only for capable desktop hardware. Phones need adaptive resolution and quality settings to avoid heat and frame drops.
- NVIDIA DLSS 5 exists, but it is not a drop-in feature for a Three.js browser game on iPhone/Android. Official DLSS 5 requires supported NVIDIA RTX hardware and an integration supported by NVIDIA. This web build will use adaptive resolution, LOD, compressed textures and browser-friendly optimization instead.

## Deploy
The GitHub Actions workflow in .github/workflows/pages.yml deploys the site to GitHub Pages after Pages is enabled in repository settings.
