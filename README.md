# Tracki — Operating Room Live Dashboard

> **Tracki** is a real-time operating-room (OR) dashboard for surgical instrument and event tracking. It runs on iPad (landscape) inside the OR and on desktop browsers for admin / pre-op planning.

Current version: **v1.0.6**

---

## What it does

- **Live Timeline** — phase-by-phase view of the procedure with running event log, audio transcription, alerts, and a real-time **OR Map**.
- **Inventory** — per-tray instrument & consumable counts; live state shows where each item is right now (Mayo Stand / Back Table / Patient / Disposed).
- **Case Analytics** — phase performance, count compliance, kit utilization, consumables breakdown.
- **OR Map editor** — draggable / resizable / rotatable OR floor plan: patient bed (with anesthesia), Mayo, Back Table, Disposal, Sterile Field, doors (snap to walls + per-wall icon orientation), staff (SRG / AST / PA / SCR / CIR), EMR station.
- **Per-OR settings** stored on the backend filesystem — admins customize the 5 case-type presets per their hospital and every device that logs into the same OR sees the same configuration.
- **Archive** — replay completed cases (recordings + state log + events).
- **Settings (full-screen, tabbed)**: 🏛 OR Map · 📷 Cameras · 🎙 Audio & Alerts · ☁ Recording.

---

## Tech stack

- **Frontend**: React 18 (Vite, JSX, no CSS framework — inline styles)
- **Backend**: Node 18+ Express server
- **Storage**:
  - Per-OR settings: `data/or-settings/<OR>.json` on the server filesystem
  - User session, layout cache: localStorage on the client
- **Auth**: simple email + shared password (`@trackimed.com` allow-list)
- **AI**: Anthropic Claude API for feedback enhancement
- **Realtime collab**: Firebase Realtime Database (Feedback overlay only)
- **Deployment**: Render.com (Node web service)

---

## Repo layout

```
.
├─ server.js                    Express server: static + API endpoints
├─ vite.config.js               Vite config for dev/build
├─ index.html                   SPA entry, viewport / iPad meta
├─ package.json                 Dependencies + scripts
├─ data/
│  └─ or-settings/              Per-OR JSON files (created at runtime)
│     ├─ OR-1.json
│     └─ OR-2.json …
├─ public/
│  ├─ assets/                   Logos, backgrounds, kit PDFs
│  └─ videos/                   Demo videos for camera feeds
└─ src/
   ├─ App.jsx                   Main app — tabs, OR map, panels, settings
   ├─ Login.jsx                 Login screen
   ├─ Feedback.jsx              Pin-and-comment overlay (firebase-backed)
   ├─ procedureDB.js            Procedure timeline / phases / events / items / item events / transcription
   ├─ archiveDB.js              Completed cases (full state + events + recordings)
   ├─ kitCatalog.js             Catalog of kits (Major Bone, Lap Tray, etc.)
   └─ eventAPI.js               Event-bus utility
```

---

## Local development

```bash
# install
npm install

# run vite dev server (frontend only, hot reload)
npm run dev               # http://localhost:5173

# run express backend (serves built dist + API; needs prior `npm run build`)
npm run build && npm start  # http://localhost:3000

# preview production build
npm run preview
```

### Environment variables

| Variable             | Used by                        | Required |
|----------------------|--------------------------------|----------|
| `ANTHROPIC_API_KEY`  | `/api/enhance` (Feedback agent)| yes (server) |
| `PORT`               | Express                        | no (default 3000) |

---

## Backend API

### `POST /api/login`
Validates `@trackimed.com` email + shared password. Returns minimal user payload.

### `POST /api/enhance`
Forwards short feedback into Claude Haiku for enhancement. Used by the Feedback overlay.

### `GET /api/or-settings/:or`
Returns the saved settings for an OR room.

```json
{
  "layout": { ...OR map element positions/angles/sizes... },
  "presetOverrides": { "general": {...}, "orthopedic": {...} },
  "customConfigs": [ { "id", "name", "layout" } ],
  "alerts": [ { "name", "sev", "en" } ],
  "recording": { "recV": true, "recA": true },
  "updatedAt": "ISO8601",
  "updatedBy": "user@trackimed.com"
}
```

If the room file doesn't exist yet, returns empty defaults.

### `PUT /api/or-settings/:or`
Writes the settings bundle for an OR room. The room id is sanitized to `[A-Za-z0-9_-]` to prevent path traversal.

---

## Per-OR settings architecture

Every device that logs into the **same OR room** sees the same settings, in real time:

1. On login, `initORServerSync(roomId, email)` fetches `/api/or-settings/<OR>` and pushes the response into a small in-memory pub/sub store (`__orLayoutSubs`, `__orPresetOverrideSubs`, `__orConfigsSubs`, `__orAlertsSubs`, `__orRecordingSubs`).
2. Every `ORZoneMap` component, the SettingsScreen, and the alert/recording UIs subscribe to those stores.
3. When any of them changes (admin edits a preset, drags an item, toggles an alert), `pushORSettingsToServer` debounces 800 ms and `PUT`s the full bundle.
4. A suppression flag prevents the inbound payload from ricocheting back as a push.

---

## OR Map presets

5 factory presets ship with the app and cover the most common case types:

- 🏥 **General Surgery**
- 🦴 **Orthopedic (THA / Lateral)**
- ❤ **Cardiac / CABG**
- 🤖 **Robotic (Da Vinci)**
- 📹 **Laparoscopy / MIS**

Hospital admins can:
- **APPLY** a preset to the live OR map
- **✏ EDIT** a preset (open the in-place full-screen editor with drag/resize/rotate, then SAVE) — overrides the factory layout for that OR room
- **DUPLICATE** a preset to start a new custom layout
- **RESET** a customized preset back to the factory default
- **+ SAVE CURRENT** — capture the current arrangement as a new custom layout
- Custom layouts can be **APPLY · UPDATE · RENAME · DELETE**'d

All edits propagate to every device logged into the same OR within ~1 second.

---

## Deployment (Render.com)

The repo is mirrored to **`asielad-hash/TrackiApp`** and deployed as a Render Web Service (`https://tracki.onrender.com`).

```
Build Command:  npm install && npm run build
Start Command:  npm start
```

Environment variables on Render:
- `ANTHROPIC_API_KEY`

⚠ **Important: the `data/` directory must be on a Persistent Disk** (Render Settings → Disks). Without it, every redeploy or cold start wipes the `data/or-settings/*.json` files and the hospital's customized OR layouts reset.

```
Mount path:  /opt/render/project/src/data
Size:        1 GB
```

---

## iPad usage

- **Open in Safari** (not Chrome — Safari is the only iOS browser that respects `apple-mobile-web-app-capable`).
- Tap **Share → Add to Home Screen** to launch the app fullscreen with no URL bar (kiosk-style).
- The login screen detects portrait orientation and prompts the user to rotate to landscape.

---

## Versioning

Semver bumps live in three places (package.json + Login footer + topbar + Settings footer); these are kept in sync per release. See git tags and commit messages for release notes.

---

## License

Internal — TrackiMed Inc.

---

*This README is kept up to date with every meaningful change. When updating the app, update this file too.*
