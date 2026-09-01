# uskillz

Interactive 3D landing page: a WebGL scene built with React Three Fiber, scroll-driven GSAP
animation and Tone.js audio feedback.

Small, single-page, visual-first — the whole scene lives in one React component tree.

## Overview

An experiment in scroll-driven 3D on the web: an intro scene, category objects that respond to
scroll position and pointer, and short synthesised audio cues on interaction. The point of the
project is the motion and rendering work rather than application structure.

## Features

- WebGL scene with React Three Fiber and `@react-three/drei` helpers
- Scroll-driven animation with GSAP and Lenis smooth scroll
- Category objects with responsive layout for mobile viewports
- Audio feedback synthesised in the browser with Tone.js

## Tech Stack

- React + Vite
- `@react-three/fiber`, `@react-three/drei`, `three`
- `gsap`, `@gsap/react`, `lenis`
- `tone`
- Tailwind CSS
- `lucide-react`

## Getting Started

Requirements: Node.js 18+, npm.

```bash
npm install
npm run dev
```

```bash
npm run build     # production build
npm run preview   # preview the build
npm run lint
```

No environment variables.

## Screenshots

_To add: a short GIF or MP4 of the scroll-driven scene — this project cannot be judged from the
code alone._

## Current Status

Prototype. Not under active development; kept public as a reference for the 3D and scroll-motion
setup.
