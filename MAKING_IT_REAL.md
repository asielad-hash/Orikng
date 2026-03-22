# ORKing — Making It Real: Implementation Plan

**Date:** 2026-03-20 | **Status:** Phase 1 Complete (Login + Video Feeds)

---

## What Was Done Today (Phase 1)

1. **Login Screen** — Full auth gate with TrackiMed branding
   - `@trackimed.com` email domain validation
   - Password: `orking@Tracki`
   - OR room + role selection
   - Demo quick-access buttons (Surgeon/Nurse/Tech)
   - OR surgery background imagery, animated UI
   - Session persistence (localStorage)

2. **Real Video Feeds** — Replaced canvas simulations with actual surgical videos
   - 4 sample videos from trackInstruments mapped to CAM-1 through CAM-4
   - Settings screen: live video playback with HUD overlay
   - Archive screen: real video playback with transport controls

3. **Branding** — TrackiMed logo (dark/light), OR background, icon copied into `public/assets/`

4. **Server** — Added `/api/login` endpoint and video/asset static serving

---

## Phase 2: Connect to Real Camera Hardware (Next)

### 2.1 Camera Capture Integration

**Goal:** Replace static video files with live camera feeds from OAK-D or IP cameras.

| Task | Details | Effort |
|------|---------|--------|
| **RTSP/WebRTC Bridge** | Build a lightweight service that reads RTSP streams from IP cameras (or OAK-D via DepthAI SDK) and re-streams as WebRTC/HLS | 1-2 weeks |
| **MediaMTX Gateway** | Deploy [MediaMTX](https://github.com/bluenviron/mediamtx) as an RTSP→WebRTC relay. Each camera publishes to a named stream | 2-3 days |
| **Frontend `<video>` → WebRTC** | Replace static `<video src="...">` with WebRTC peer connections. Fall back to HLS for archive/playback | 3-5 days |
| **OAK-D Integration** | Use your existing TrackiMed-Capture app (DepthAI) as the camera driver. Add RTSP publish to its pipeline | 3-5 days |

**Architecture:**
```
OAK-D Camera(s) / IP Cameras
       │ RTSP
       ▼
  MediaMTX Gateway (RTSP→WebRTC)
       │ WebRTC / HLS
       ▼
  ORKing Dashboard (Browser)
```

### 2.2 Camera Config API

| Task | Details |
|------|---------|
| Camera registry | POST/GET `/api/cameras` — add/list cameras with IP, name, zone, capabilities |
| Health monitoring | Periodic health checks on each RTSP stream, report status to dashboard |
| PTZ control | Forward PTZ commands to ONVIF-compatible cameras via REST |

---

## Phase 3: Real-Time Instrument Tracking (AI Pipeline)

### 3.1 Connect TraciMedAlg to Live Feeds

**Goal:** Run Grounding DINO + SAM2 on live camera frames to detect/track surgical instruments in real-time.

| Task | Details | Effort |
|------|---------|--------|
| **Frame Grabber Service** | Python service that pulls frames from MediaMTX WebRTC streams at configurable FPS (e.g., 2-5 fps) | 3-5 days |
| **Detection Pipeline** | Wrap TraciMedAlg's `ToolTracking` class as a gRPC/REST microservice. Input: frame → Output: detected items with bounding boxes + labels | 1-2 weeks |
| **Tracking State Machine** | Maintain a running inventory state: items in field, disposed, added. Emit events (LOST, NEW, BACK) via WebSocket | 1 week |
| **Dashboard WebSocket** | Connect ORKing React app to tracking service via Socket.IO. Update inventory grid, zone map, and event feed in real-time | 3-5 days |

**Architecture:**
```
Camera Streams
       │
  Frame Grabber (2-5 fps)
       │
  TraciMedAlg Service (GPU)
  ├── Grounding DINO → instrument detection
  └── SAM2 → mask tracking
       │
  Tracking State Machine
       │ WebSocket events
       ▼
  ORKing Dashboard (live inventory)
```

### 3.2 SAM3 Integration (trackInstruments)

Your existing trackInstruments app already has a production SAM3 pipeline. Reuse it for:
- **Post-procedure analysis** — run full-video tracking after surgery ends
- **Alert generation** — LOST/NEW/BACK events with annotated video output
- Feed results into the Archive tab as enriched case data

---

## Phase 4: Procedure Timeline Automation

### 4.1 State Detection from Video + Audio

| Component | Detection Method | Implementation |
|-----------|-----------------|----------------|
| **Patient In/Out** | Person detection at door zone (YOLO) | Extend TraciMedAlg with person class |
| **Anesthesia** | Anesthesia machine interaction detection | Zone-specific activity classification |
| **Time Out** | Speech recognition ("time out" verbal confirmation) | Whisper model on MIC audio stream |
| **Incision/Closure** | Surgical activity classification | Fine-tuned video classifier |
| **Counts** | Instrument count events (items moved to/from zones) | Tracking state transitions |

### 4.2 Event Bus Architecture

```
Detection Services (Video + Audio)
       │
  Event Bus (Redis Streams / NATS)
  ├── state_change events
  ├── count events
  ├── alert events
  └── audio transcription events
       │
  Timeline Manager (maintains procedure state)
       │ WebSocket
       ▼
  ORKing Dashboard
```

---

## Phase 5: Data Persistence & Case Management

### 5.1 Database Schema

Replace hardcoded data with a real database (PostgreSQL recommended):

| Table | Purpose |
|-------|---------|
| `users` | Auth, roles, preferences |
| `or_rooms` | Room config, camera assignments |
| `cases` | Active + archived surgical cases |
| `case_states` | Procedure state transitions with timestamps |
| `case_items` | Instrument inventory per case |
| `case_events` | Event log (alerts, counts, state changes) |
| `recordings` | Video/audio recording metadata + S3 references |
| `cameras` | Camera registry with streams |

### 5.2 Auth System

| Task | Details |
|------|---------|
| JWT tokens | Replace localStorage demo auth with proper JWT |
| Firebase Auth | Leverage your existing Firebase project for user management |
| Role-based access | Surgeon sees procedure view, Admin sees all, Nurse sees inventory |
| Session management | Auto-logout, multi-device handling |

---

## Phase 6: Cloud Recording & Storage

### 6.1 Recording Pipeline

```
Camera Streams → MediaMTX → HLS Segments
                              │
                    Recording Service
                    ├── H.265 encoding (ffmpeg)
                    ├── Segment upload to S3
                    └── Metadata to PostgreSQL
                              │
                    ORKing Archive Tab
                    └── HLS playback from S3/CloudFront
```

### 6.2 Storage Estimates

| Resolution | Bitrate | Per Camera/Hour | 4 Cameras/8hr Day |
|-----------|---------|-----------------|---------------------|
| 4K H.265 | 8 Mbps | 3.6 GB | 115 GB |
| 1080p H.265 | 4 Mbps | 1.8 GB | 58 GB |

---

## Phase 7: Speech & NLP Integration

| Feature | Technology | Purpose |
|---------|-----------|---------|
| Live transcription | OpenAI Whisper (local) | Transcribe surgeon/team speech |
| Time Out detection | Keyword spotting | Auto-detect "Time Out" verbal confirmation |
| Command recognition | NLU classifier | "Start count", "Patient in", etc. |
| Case notes | Claude API | Auto-generate post-case summaries |

---

## Phase 8: Analytics & Reporting

### 8.1 Real Metrics from Real Data

| Metric | Source |
|--------|--------|
| Case duration | State timeline (first→last) |
| OR utilization | Patient-in to Patient-out vs. total room time |
| Turnover time | Previous Patient-out to next Patient-in |
| Count accuracy | Automated vs. manual count comparisons |
| Alert frequency | Events per case, categorized |
| Cost savings | Integrate with TrackiMedAnalytics data |

### 8.2 Integration with TrackiMedAnalytics

Your existing cost analytics app has DRG/PCS code mapping and cost data. Feed ORKing case data into it for:
- Per-case cost analysis
- Efficiency-driven savings reports
- Benchmark comparisons

---

## Phase 9: Production Deployment

### 9.1 Infrastructure

```
┌────────────────────────────────────────────┐
│ Hospital Network (On-Premise)              │
│  ├── OAK-D / IP Cameras                   │
│  ├── MediaMTX Gateway (RTSP→WebRTC)       │
│  ├── GPU Server (AI Pipeline)             │
│  │   ├── TraciMedAlg (detection)          │
│  │   ├── SAM3 (tracking)                  │
│  │   └── Whisper (speech)                 │
│  └── ORKing Server (Express + API)        │
│                                            │
│ Cloud (AWS)                                │
│  ├── S3 (video archive)                   │
│  ├── CloudFront (video delivery)          │
│  ├── RDS PostgreSQL (data)                │
│  └── Render.com (web hosting)             │
└────────────────────────────────────────────┘
```

### 9.2 Security & Compliance

| Requirement | Implementation |
|-------------|---------------|
| HIPAA | Encrypted storage (AES-256), TLS 1.3 transit, audit logs |
| Patient privacy | Video anonymization (face blur) — use your existing anonymization pipeline |
| Access control | JWT + RBAC, session timeouts, IP whitelist for OR network |
| Data retention | Configurable per-hospital retention policies |

---

## Recommended Priority Order

| Priority | Phase | Impact | Effort |
|----------|-------|--------|--------|
| **1** | Phase 2 — Camera Integration | Turns demo into live system | 2-3 weeks |
| **2** | Phase 5 — Database + Auth | Enables real data persistence | 1-2 weeks |
| **3** | Phase 3 — AI Tracking | Core value proposition | 3-4 weeks |
| **4** | Phase 6 — Cloud Recording | Required for archive feature | 1-2 weeks |
| **5** | Phase 4 — Timeline Automation | Advanced automation | 3-4 weeks |
| **6** | Phase 7 — Speech/NLP | Differentiator feature | 2-3 weeks |
| **7** | Phase 8 — Analytics | Business metrics | 1-2 weeks |
| **8** | Phase 9 — Production | Deployment readiness | 2-3 weeks |

---

## Quick Start (Today)

```bash
cd Orikng
npm install
npm run dev
```

Open http://localhost:5173 → Login with any `@trackimed.com` email + password `orking@Tracki`

The 4 camera feeds now play real surgical videos. The Settings tab shows live video from your sample OR recordings.
