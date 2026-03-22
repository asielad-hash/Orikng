# Orikng (ORKing) — Product & Design Document

**Version:** 2.0.0 | **Date:** 2026-03-22 | **Repo:** https://github.com/asielad-hash/Orikng

---

## 1. Product Requirements (PRD)

### 1.1 Purpose
Event-driven OR (Operating Room) intelligence dashboard for TrackiMed. Displays real-time surgical item tracking, procedure timeline, analytics, device settings, and case archives on a wall-mounted 16:9 display. All state changes (phase transitions, inventory movements, alerts) flow through a unified EventBus — currently driven by a MockAlgorithm, designed to be replaced by real camera/vision backend via WebSocket. Includes an integrated feedback/annotation system for collaborative design iteration.

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
    App.jsx                     Main dashboard (Inventory, Timeline, Analytics screens)
    procedureDB.js              Procedure data: phases, items, events, transcription
    eventAPI.js                 EventBus, event types (EVT), zones, createEvent()
    mockAlgorithm.js            Mock backend — converts procedureDB → EventBus events
    archiveDB.js                Archive case data
    Feedback.jsx                Feedback overlay system
    Login.jsx                   Login screen with @trackimed.com validation
    firebase.js                 Firebase Realtime DB config
    main.jsx                    React entry point
  server.js                     Express backend with Claude API
  index.html                    HTML entry point
  vite.config.js                Vite build configuration
  package.json                  Dependencies
  render.yaml                   Render deployment config
  public/videos/                Surgical video files (4 camera feeds)
  public/assets/                TrackiMed branding, tray PDFs
```

### 2.4 Dashboard Screens

#### Inventory
- **66 surgical item types / 169 pieces** across 5 categories: Sponges, Needles, Sharps, Instruments, Packs
- Per-item: Baseline count, current zone location, event history with video captures
- **4 OR zones**: Mayo (green), Back Table (blue), Patient, Disposed
- Zone map visualization with origin-colored counts (green = mayo origin, blue = back table origin) and baseline reference
- **Counts panel**: Shows all safety gate count results (Initial Count, Pre-Close, Count Resolution, Final Count) with status indicators (pending/in-progress/balanced)
- Staff positions (SRG, AST, SCR, CIR) on zone map
- Live event feed with phase-colored entries

#### Timeline
- **15 procedure phases**: OR Setup → Initial Count → Patient In → Anesthesia → Time Out → Procedure → Pre-Close Count → Count Resolution → Surgeon Decision → Closure → Final Count → Emergence → Patient Out → Turnover → Idle
- **4 safety gates**: Initial Count, Time Out, Pre-Close Count, Final Count
- **Event-driven phase transitions**: Active phase is driven by `phase.start` events from EventBus (not hardcoded time offsets). MockAlgorithm emits these on schedule; real backend will emit them via WebSocket when camera algo detects phase changes.
- Phase duration tracking with benchmarks — active phase turns red with warning when exceeding benchmark
- **Idle phase**: Final state after turnover. Benchmark = 15 min. Room status changes to "AVAILABLE". Alert raised if idle > 15 min.
- **Unified alert system**: Aggregates inventory alerts + phase duration alerts. Count turns red when > 0. Tooltip shows all active alerts grouped by type. Phase alerts auto-clear on next phase transition.
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

### 2.7 Event Architecture

All state changes flow through a central **EventBus** (`eventAPI.js`). The UI subscribes to events; the backend (mock or real) emits them.

#### Event Types (EVT constants)
```
Phase lifecycle:
  phase.start          — Phase transition (carries phaseIndex, label, benchmark)
  phase.complete       — Phase completed

Inventory tracking:
  inventory.baseline   — Initial item placement at count
  inventory.move       — Item moved between zones
  inventory.dispose    — Item disposed/discarded
  inventory.alert      — Item drop/loss detected
  inventory.recover    — Alert resolved, item recovered
  inventory.open       — Pack/tray opened

Count verification:
  count.start          — Count phase initiated
  count.zone           — Zone count reported
  count.result         — Count result (balanced/unbalanced)
  count.resolve        — Count discrepancy resolved

Audio processing:
  audio.transcript     — Speech-to-text result
  audio.keyword        — Safety keyword detected

Vision / camera:
  vision.detect        — Object detection result
  vision.track         — Object tracking update
  vision.frame         — Frame reference with annotations

System-level:
  system.boot          — System status / info
  system.camera        — Camera status change
  system.mic           — Microphone status change
  system.compliance    — Compliance check result
  system.ebl           — Estimated blood loss update
  system.staff         — Staff presence change
```

#### Event Envelope
```json
{
  "id": "evt-1711234567890-42",
  "ts": 1711234567890,
  "source": "CAM-1",
  "type": "phase.start",
  "data": {
    "phaseIndex": 5,
    "label": "Procedure",
    "benchmark": 90,
    "confidence": 0.94
  }
}
```

#### Event Flow
```
MockAlgorithm (demo)           Real Backend (production)
  |                              |
  | reads procedureDB            | camera/mic processing
  | schedules events             | WebSocket connection
  |                              |
  +------> EventBus <-----------+
              |
              | dispatches to subscribers
              |
    +---------+---------+
    |         |         |
  App.jsx  TlScreen  InvScreen
  (phase)  (timeline) (inventory)
```

- **MockAlgorithm** (`mockAlgorithm.js`): Reads `procedureDB.js` and emits events at real-time pace. Past events are replayed as `_historical`. Future events are scheduled via `setTimeout`.
- **Real backend**: Connects via `eventBus.connect(wsUrl)`. WebSocket `onmessage` parses JSON and calls `eventBus.emit()`. Same event types — UI works unchanged.
- **Phase transitions**: `App.jsx` subscribes to `phase.start` events. When received, updates active phase state (`setAs(phaseIndex)`). Historical events are skipped (handled by initial elapsed-time calculation on load).

#### Alert System
Alerts are aggregated from multiple sources into a unified count:
1. **Inventory alerts** — unresolved item drops/losses from `useInventoryState()`
2. **Phase duration alerts** — active phase exceeding its benchmark (auto-clears on next phase)
3. *(extensible — future types added to the `alerts[]` array)*

### 2.8 Data Models

**Surgical Item (procedureDB.js → ITEMS):**
```json
{
  "id": "SPG-001",
  "name": "Lap Sponge 18×18",
  "cat": "sponge",
  "init": 10,
  "loc": { "m": 10, "b": 0, "p": 0, "d": 0 },
  "zone": "mayo"
}
```
Fields: `cat` = category, `init` = baseline count, `loc` = current location counts (m=mayo, b=back table, p=patient, d=disposed), `zone` = origin zone.

**Procedure Phase (procedureDB.js → PHASES):**
```json
{
  "id": 5,
  "label": "Procedure",
  "short": "PROC",
  "colorKey": "green",
  "gate": false,
  "offsetStart": 0,
  "duration": 90,
  "benchmark": 90
}
```
15 phases (0–14): OR Setup → Initial Count → Patient In → Anesthesia → Time Out → Procedure → Pre-Close Count → Count Resolution → Surgeon Decision → Closure → Final Count → Emergence → Patient Out → Turnover → Idle. Gate phases require verification. `benchmark` is the target duration in minutes (Idle benchmark = 15 min, 0 is optimal).

**Item Event (procedureDB.js → ITEM_EVENTS):**
```json
{
  "at": 300,
  "type": "to_patient",
  "note": "Raytec sponge passed to surgeon",
  "frame": "/videos/cam1.mp4#t=305"
}
```
Types: `baseline`, `to_patient`, `to_mayo`, `to_back`, `disposed`, `alert`, `resolved`, `opened`.

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

### 2.9 Theme System

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

### 2.10 Key Design Decisions
- **Event-driven architecture**: All state changes (phases, inventory, alerts) flow through EventBus. UI subscribes, backend emits. MockAlgorithm swappable for real camera backend without UI changes.
- **Phase transitions via events**: Active phase is `useState` updated by `phase.start` events, not derived from elapsed time. Enables real-time camera algo to drive phase changes.
- **Unified alert system**: Aggregates inventory, phase duration, and future alert types into a single count with typed entries. Extensible via `alerts[]` array.
- **Origin-colored zone counts**: OR Zone Map shows item counts colored by origin zone (green=mayo, blue=back table) so staff can see where items came from at a glance.
- **No UI library**: All components are custom CSS-in-JS for full design control
- **Real video feeds**: 4 camera feeds use actual surgical video files, not canvas simulation
- **Firebase Realtime DB**: Enables multi-reviewer collaboration without custom backend
- **Claude Haiku**: Fast, low-cost AI enhancement for feedback text
- **16:9 aspect ratio**: Optimized for wall-mounted OR displays
- **Inline styles with theme objects**: Enables runtime theme switching without CSS reloads
- **Login with session persistence**: @trackimed.com email validation, localStorage session

### 2.11 Prerequisites
- Node.js 20+
- npm
- Anthropic API key (optional — for AI feedback enhancement)

### 2.12 Installation
```bash
cd Orikng
npm install
```

### 2.13 Running (Development)
```bash
cd Orikng
npm run dev
```

**URL:** http://localhost:5173 (Vite dev server with hot reload)

**Note:** Development mode serves the React app via Vite. The `/api/enhance` endpoint (Claude AI) is only available when running the Express server.

### 2.14 Running (Production)
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

### 2.15 npm Scripts
| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Dev server with hot reload (port 5173) |
| `npm run build` | `vite build` | Production build → `dist/` |
| `npm run preview` | `vite preview` | Preview production build locally |
| `npm start` | `node server.js` | Production Express server (port 3000) |

### 2.16 Deployment (Render.com)
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
