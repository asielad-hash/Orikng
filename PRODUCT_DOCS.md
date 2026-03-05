# Orikng (ORKing) — Product & Design Document

**Version:** 1.0.0 | **Date:** 2026-03-04 | **Repo:** https://github.com/asielad-hash/Orikng

---

## 1. Product Requirements (PRD)

### 1.1 Purpose
Interactive OR (Operating Room) dashboard mockup and design review tool for TrackiMed. Simulates a wall-mounted 16:9 display showing real-time surgical item tracking, procedure timeline, analytics, device settings, and case archives. Includes an integrated feedback/annotation system for collaborative design iteration.

### 1.2 Target Users
- Product designers reviewing OR dashboard UI/UX
- Stakeholders evaluating TrackiMed's visual design
- Development team collecting structured feedback with visual annotations

### 1.3 Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Inventory Screen | Real-time surgical item tracking: 25 items across 5 categories with zone mapping |
| 2 | Timeline Screen | 15-state procedure progression with 4 safety gates and duration tracking |
| 3 | Analytics Screen | Case duration, OR utilization, turnover, efficiency metrics, alert history |
| 4 | Settings Screen | Camera/microphone config, cloud recording, alert types, AI/CV versions |
| 5 | Archive Screen | Completed operations browser with state logs, events, recordings |
| 6 | Feedback System | Comment panel + visual pin annotations + modifications log |
| 7 | AI Enhancement | Claude AI converts brief feedback into structured requirements |
| 8 | Firebase Sync | Real-time feedback persistence across reviewers |
| 9 | Dark/Light Theme | Comprehensive dual-palette system |

### 1.4 User Workflow
```
Dashboard
  -> Navigate 5 tabs: Inventory | Timeline | Analytics | Settings | Archive
  -> Review each screen's design and data presentation

Feedback Mode
  -> Open comment drawer  ->  Type feedback  ->  (Optional) AI enhance
  -> Set priority + category  ->  Submit  ->  Syncs to Firebase

Pin Mode
  -> Click screen location  ->  Drop numbered pin  ->  Add note
  -> Pins visible to all reviewers via Firebase

Modifications Log
  -> View all comments + pins  ->  Filter by screen/status/priority
  -> Resolve items  ->  Export as markdown
```

---

## 2. Software Design (SDD)

### 2.1 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3.1, Vite 6.0.7 |
| Backend | Express 5.2.1 (Node.js) |
| AI | Anthropic Claude (claude-haiku-4-5-20251001) |
| Database | Firebase Realtime Database |
| Fonts | DM Sans, JetBrains Mono (Google Fonts) |
| Deployment | Render.com (render.yaml) |

### 2.2 Architecture
```
Browser (React SPA)
  |
  |-- App.jsx (5-tab dashboard)
  |     ├── Inventory — item tracking grid + zone map
  |     ├── Timeline — 15-state procedure flow + safety gates
  |     ├── Analytics — charts + metrics + alert history
  |     ├── Settings — cameras, mics, cloud, alerts, AI versions
  |     └── Archive — completed operations browser
  |
  |-- Feedback.jsx (overlay system)
  |     ├── Comment Panel (side drawer)
  |     ├── Pin Mode (click-to-annotate)
  |     └── Modifications Log (full-screen modal)
  |
  |-- Firebase Realtime DB
  |     ├── /comments — feedback entries
  |     └── /pins — visual annotations
  |
  +-- Express Server (server.js)
        └── POST /api/enhance — Claude AI feedback enhancement
```

### 2.3 File Structure
```
Orikng/
  src/
    App.jsx                     Main 5-tab dashboard
    Feedback.jsx                Feedback overlay system (607 lines)
    firebase.js                 Firebase Realtime DB config
    main.jsx                    React entry point
  trackimed-or-mockup.jsx       Extended mockup variant (45 KB)
  server.js                     Express backend with Claude API
  index.html                    HTML entry point
  vite.config.js                Vite build configuration
  package.json                  Dependencies
  render.yaml                   Render deployment config
```

### 2.4 Dashboard Screens

#### Inventory
- **25 surgical items** across 5 categories: Sponges, Needles, Sharps, Instruments, Packs
- Per-item: Baseline count, In-Field count, Disposed count
- **4 OR zones**: Mayo, Sterile Field, Back Table, Waste
- Zone map visualization with staff positions (SRG, AST, SCR, CIR)
- Interactive counting mode with progress animation
- Live event feed

#### Timeline
- **15 procedure states**: System Ready → OR Setup → Initial Count → Patient In → Anesthesia → Time Out → Procedure → Pre-Close Count → Count Resolution → Surgeon Decision → Closure → Final Count → Emergence → Patient Out → Turnover
- **4 safety gates**: Initial Count, Time Out, Pre-Close Count, Final Count
- Phase duration tracking with min-max benchmarks
- Elapsed time, staff count, items tracked, alerts count

#### Analytics
- Case duration, OR utilization, turnover time metrics
- Item tracking summary (tracked, disposed, added)
- Efficiency metrics (staff, preference card compliance, auto documentation)
- Phase duration breakdown bars
- Alert history with resolution status
- Category breakdown progress

#### Settings
- **4 cameras**: Full OR (4K), Sterile Field (1080p), Back Table (1080p), Waste (1080p)
- PTZ controls, canvas-based video feed simulation
- **Microphones**: Ambient + Directional modes, audio meter, noise cancellation
- **Cloud Recording**: AWS S3 with H.265 + FLAC, AES-256 encryption
- **8 alert types**: configurable by severity (critical → low)
- **AI/CV versions**: ORKing v3.2, YOLO-Surg v8, Tracki v2.1

#### Archive
- 5 sample operations with full details
- State log with temporal progression
- Video/audio playback simulation with timeline scrubbing
- Event markers (warnings, gates) on timeline
- Recording metadata (source, duration, size, format)

### 2.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/enhance | AI-enhance feedback text via Claude |
| GET | /*splat | SPA fallback → dist/index.html |

**POST /api/enhance Request:**
```json
{
  "text": "The counter is hard to read",
  "screen": "inventory",
  "category": "ux",
  "priority": "high"
}
```

**Response:**
```json
{
  "enhanced": "The item counter display needs larger font and higher contrast to be readable from 2+ meters in typical OR lighting."
}
```

### 2.6 Feedback System

**Comment Fields:**
```json
{
  "id": "firebase-key",
  "author": "John Doe",
  "text": "Counter is unclear",
  "screen": "inventory|timeline|turnover|settings|archive",
  "category": "ux|bug|feature|content|general",
  "priority": "critical|high|medium|low",
  "timestamp": 1709596802000,
  "resolved": false,
  "resolvedBy": null,
  "resolvedAt": null
}
```

**Pin Fields (extends Comment):**
```json
{
  "xPct": 45.5,
  "yPct": 62.3
}
```

**Firebase Paths:**
- `/comments` — Text feedback entries
- `/pins` — Visual pin annotations

**Features:**
- AI enhancement via Claude (converts brief notes to structured requirements)
- Per-screen filtering
- Resolution workflow (resolve/reopen with author + timestamp)
- Modifications log with multi-filter table
- Markdown export and clipboard copy

### 2.7 Data Models

**Surgical Item:**
```json
{
  "id": "SPG-001",
  "name": "Lap Sponge 18×18",
  "category": "sponge",
  "init": 10,
  "f": 8,
  "d": 2,
  "zone": "sterile"
}
```

**Procedure State:**
```json
{
  "id": 0,
  "label": "System Ready",
  "short": "SYS",
  "checkKey": "teal",
  "gateRequired": false
}
```

**Archive Operation:**
```json
{
  "id": "2026-0207-002",
  "date": "2026-02-07",
  "procedure": "Right Hemicolectomy",
  "surgeon": "Dr. Y. Shapira",
  "team": ["Dr. A. Levi", "N. Cohen RN"],
  "patient": "M/67",
  "duration": "3:14:22",
  "items": 72,
  "alerts": 1,
  "countResults": ["Balanced", "Balanced", "Balanced"],
  "recordings": [
    {"src": "CAM-1", "dur": "2:58:22", "size": "5.8 GB", "fmt": "H.265"}
  ]
}
```

### 2.8 Theme System

| Token | Dark | Light |
|-------|------|-------|
| Background | #080b14 | #eef1f6 |
| Panel | #0f1725 | #ffffff |
| Card | #131d2f | #f5f7fa |
| Text | #f0f4fa | #1a1a2e |
| Accent Teal | #00C9B7 | #00C9B7 |
| Accent Green | #22D67E | #22D67E |
| Accent Red | #F5425A | #F5425A |
| Accent Amber | #F5A623 | #F5A623 |

**Typography:** DM Sans (display), JetBrains Mono (metrics/code)

### 2.9 Key Design Decisions
- **No UI library**: All components are custom CSS-in-JS for full design control
- **Canvas video simulation**: Settings screen uses canvas-based feed (not real video)
- **Firebase Realtime DB**: Enables multi-reviewer collaboration without custom backend
- **Claude Haiku**: Fast, low-cost AI enhancement for feedback text
- **16:9 aspect ratio**: Optimized for wall-mounted OR displays
- **Inline styles with theme objects**: Enables runtime theme switching without CSS reloads
- **localStorage for author**: Persists reviewer name across sessions

### 2.10 Prerequisites
- Node.js 20+
- npm
- Anthropic API key (optional — for AI feedback enhancement)

### 2.11 Installation
```bash
cd Orikng
npm install
```

### 2.12 Running (Development)
```bash
cd Orikng
npm run dev
```

**URL:** http://localhost:5173 (Vite dev server with hot reload)

**Note:** Development mode serves the React app via Vite. The `/api/enhance` endpoint (Claude AI) is only available when running the Express server.

### 2.13 Running (Production)
```bash
cd Orikng

# 1. Build the frontend
npm run build                     # Outputs to dist/

# 2. Start the server
export ANTHROPIC_API_KEY=sk-...   # Optional: enables AI feedback enhancement
node server.js
```

**URL:** http://localhost:3000

**The Express server:**
- Serves the built React app from `dist/`
- Provides `/api/enhance` for Claude-powered feedback enhancement
- SPA fallback routing for client-side React routes

### 2.14 npm Scripts
| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Dev server with hot reload (port 5173) |
| `npm run build` | `vite build` | Production build → `dist/` |
| `npm run preview` | `vite preview` | Preview production build locally |
| `npm start` | `node server.js` | Production Express server (port 3000) |

### 2.15 Deployment (Render.com)
```yaml
# render.yaml
services:
  - type: web
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: node server.js
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
```
