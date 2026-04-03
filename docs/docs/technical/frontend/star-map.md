---
id: star-map
title: 3D Star Map
sidebar_position: 2
---

# 3D Star Map

The star map is built with React Three Fibre (R3F) — a React renderer for Three.js. It lives on the Explore page and is gated behind `MobileGate` so only tablets and larger screens access it.

## Architecture

```
ExplorePage
  └── MobileGate (md breakpoint)
        └── Canvas (R3F)
              └── StarSystemScene
                    ├── Lights (ambient + point lights for each star)
                    ├── Stars (drei — background star field)
                    ├── OrbitalRings (one per planet, rendered as Line)
                    ├── ScatterParticles (300 instanced mesh objects)
                    ├── RouteArcs (QuadraticBezierCurve3, shown on selection)
                    ├── BodyMesh (one per body — sphere + label via Html)
                    └── OrbitControls (drei — pan, zoom, rotate)
```

## Orbital Position Calculation

The 3D positions come from `frontend/src/lib/orbital.ts` — the same formula as the Go gateway and Python services. At every animation frame, the simulation day (`simDay`) determines where every body is:

```typescript
// Inside StarSystemScene — runs per-frame via useFrame
const positions = allBodyPositions(systemConfig.bodies, simDay);
// positions['aethon'] = { x: 0.923, y: 0.415 } in AU
```

Positions are scaled to scene units using `AU_SCALE = 18` — so 1 AU maps to 18 scene units. This gives the inner system a comfortable visual spread without the outer system being unreachably far.

## Body Rendering

Each body is a `BodyMesh` component — a Three.js sphere with `meshStandardMaterial`, emissive colour, and a selection ring when active. Bodies use `Html` from drei to render name labels in 3D space with `distanceFactor` so they scale with camera distance.

Visitable bodies show a faint ring at all times. Selected bodies get a brighter ring and a pulsing glow sphere via `useFrame`.

## Route Arcs

When a body is selected, route arcs appear connecting it to all its scheduled destinations. Each arc is a `QuadraticBezierCurve3` with a midpoint elevated in Y — giving the arcs a visible curve against the orbital plane. Standard routes are indigo; scenic routes are amber.

## The Scatter

The Scatter belt is rendered as 300 small sphere meshes distributed in a torus-shaped region between 1.8 AU and 2.6 AU. These are static (not animated) for performance. At `AU_SCALE = 18`, the Scatter fills a visible band in the scene that the eye naturally reads as a hazard zone.

## Side Panel

Clicking a visitable body opens `PlanetSidePanel` — an `AnimatePresence` panel that slides in from the right via `sidePanelEnter` variant. The panel shows planet summary, quick facts, route list, next optimal windows (fetched from the gateway's `/api/voyages/closest-approach`), and book/profile CTAs.

The panel key is set to `selectedId` so AnimatePresence remounts it with a fresh animation when a different body is selected.

## Mobile Gating

The star map is gated at the `md` breakpoint (768px). Below this, `MobileGate` renders a friendly placeholder explaining the feature requires a larger screen. Tablet users (768px+) get the full experience.

This decision was made because the interaction model — click to select, orbit controls for navigation — is designed for pointer input and a screen large enough to see the full system at once.

## Performance Notes

The scene uses `antialias: true` on the Canvas. With 300 Scatter particles, 15+ body meshes, orbital rings, and Html labels, the scene is moderately complex. On modern hardware it runs at 60fps. If performance is a concern:

- Reduce `Scatter` particle count from 300
- Use `instancedMesh` for the Scatter instead of individual meshes
- Reduce orbit ring segment count from 128 to 64
