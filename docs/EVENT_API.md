# ORKing Event API — Backend Developer Reference

## 1. Architecture Overview

```
                         ORKing System Architecture
 ┌─────────────────────────────────────────────────────────────────┐
 │                        OPERATING ROOM                          │
 │                                                                │
 │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
 │  │ CAM-1    │ │ CAM-2    │ │ CAM-3    │ │ CAM-4    │          │
 │  │ Ceiling  │ │ Sterile  │ │ Back Tbl │ │ Waste    │          │
 │  │ 4K/30fps │ │ 4K/30fps │ │ 1080/30  │ │ 1080/24  │          │
 │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
 │       │             │            │             │                │
 │  ┌────┴─────┐ ┌─────┴────┐                                    │
 │  │ MIC-1    │ │ MIC-2    │                                     │
 │  │ Boom     │ │ Anesth.  │                                     │
 │  └────┬─────┘ └────┬─────┘                                    │
 └───────┼─────────────┼──────────────────────────────────────────┘
         │             │
         ▼             ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                    BACKEND PROCESSING                           │
 │                                                                 │
 │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
 │  │ Vision       │  │ Audio        │  │ Fusion Engine        │  │
 │  │ Pipeline     │  │ Pipeline     │  │                      │  │
 │  │              │  │              │  │ • Item tracking      │  │
 │  │ • Object     │  │ • Speech-to- │  │ • Count verification │  │
 │  │   detection  │  │   text (STT) │  │ • Phase detection    │  │
 │  │ • Tracking   │  │ • Keyword    │  │ • Alert correlation  │  │
 │  │ • Zone       │  │   spotting   │  │ • Compliance checks  │  │
 │  │   mapping    │  │ • Speaker    │  │                      │  │
 │  │              │  │   diarize    │  │                      │  │
 │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
 │         │                 │                      │              │
 │         └─────────────────┴──────────────────────┘              │
 │                           │                                     │
 │                    ┌──────┴──────┐                              │
 │                    │  Event      │                              │
 │                    │  Serializer │                              │
 │                    └──────┬──────┘                              │
 └───────────────────────────┼─────────────────────────────────────┘
                             │
                     WebSocket (JSON)
                     ws://host:8765/events
                             │
 ┌───────────────────────────┼─────────────────────────────────────┐
 │                    FRONTEND (ORKing UI)                         │
 │                           │                                     │
 │                    ┌──────┴──────┐                              │
 │                    │  EventBus   │   ← eventAPI.js              │
 │                    │  (Singleton)│                              │
 │                    └──────┬──────┘                              │
 │                           │                                     │
 │         ┌─────────┬───────┼────────┬──────────┐                │
 │         ▼         ▼       ▼        ▼          ▼                │
 │    ┌─────────┐┌────────┐┌──────┐┌────────┐┌────────┐          │
 │    │Phase    ││Inven-  ││Count ││Tran-   ││System  │          │
 │    │Timeline ││tory    ││Panel ││script  ││Status  │          │
 │    │         ││Grid    ││      ││Feed    ││Bar     │          │
 │    └─────────┘└────────┘└──────┘└────────┘└────────┘          │
 └─────────────────────────────────────────────────────────────────┘
```

## 2. WebSocket Protocol

### Connection

```
URL:    ws://<host>:8765/events
Proto:  JSON text frames
Auth:   Bearer token in first message (future)
```

### Message Flow

```
Client → Server:  { "action": "subscribe", "types": ["inventory.*", "phase.*"] }
Server → Client:  { "id": "evt-...", "ts": 1711100000000, "source": "CAM-1", ... }
Client → Server:  { "action": "ack", "id": "evt-..." }  (optional)
```

### Reconnection Strategy

1. On disconnect, wait 1 second
2. Retry with exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
3. On reconnect, request missed events via REST: `GET /api/events?since=<last_ts>`
4. Backend buffers last 10 minutes of events for replay

### Heartbeat

- Server sends `{ type: "system.heartbeat" }` every 30 seconds
- Client should reconnect if no message received for 90 seconds


## 3. Event Envelope Format

Every event follows the same structure:

```json
{
  "id":     "evt-1711100000000-42",
  "ts":     1711100000000,
  "source": "CAM-1",
  "type":   "inventory.move",
  "data":   { ... }
}
```

| Field    | Type   | Description                                                        |
|----------|--------|--------------------------------------------------------------------|
| `id`     | string | Unique event ID. Format: `evt-{epoch_ms}-{seq}`. Monotonically increasing. |
| `ts`     | number | Unix epoch milliseconds when the event was produced.               |
| `source` | string | Producer identifier. One of: `CAM-1`..`CAM-4`, `MIC-1`, `MIC-2`, `SYSTEM`. |
| `type`   | string | Dot-namespaced event type (see section 4).                         |
| `data`   | object | Type-specific payload (see section 4 for each schema).             |

### Internal Fields (mock only)

| Field         | Type    | Description                                         |
|---------------|---------|-----------------------------------------------------|
| `_historical` | boolean | Set to `true` if the event was emitted as catch-up history. Not present on live events. |
| `_offsetSec`  | number  | Seconds from procedure start. Removed before emit.  |


## 4. Event Types — Complete Reference

### 4.1 Phase Events

#### `phase.start`

Emitted when a surgical phase begins.

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field         | Type    | Required | Description                              |
|---------------|---------|----------|------------------------------------------|
| `phaseId`     | number  | yes      | Phase ID (0–14)                          |
| `phaseIndex`  | number  | yes      | Array index in PHASES                    |
| `label`       | string  | yes      | Full phase name, e.g. "Initial Count"    |
| `short`       | string  | yes      | Short label, e.g. "I·CNT"               |
| `colorKey`    | string  | yes      | Theme color key (teal, purple, amber, etc.) |
| `isGate`      | boolean | yes      | Whether this is a safety gate            |
| `duration`    | number  | no       | Planned duration in minutes              |
| `benchmark`   | number  | no       | Benchmark duration in minutes            |
| `offsetStart` | number  | yes      | Offset from procedure start in seconds   |

```json
{
  "id": "evt-1711100000000-1",
  "ts": 1711099340000,
  "source": "SYSTEM",
  "type": "phase.start",
  "data": {
    "phaseId": 2,
    "phaseIndex": 2,
    "label": "Initial Count",
    "short": "I·CNT",
    "colorKey": "amber",
    "isGate": true,
    "duration": 4.4,
    "benchmark": 8,
    "offsetStart": -1099
  }
}
```

**Triggers:** Phase timeline highlight, phase badge update, gate indicator.

---

#### `phase.complete`

Emitted when a phase ends. Currently derived from the next `phase.start`.

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field         | Type   | Required | Description                        |
|---------------|--------|----------|------------------------------------|
| `phaseId`     | number | yes      | Completed phase ID                 |
| `label`       | string | yes      | Phase label                        |
| `actualMins`  | number | yes      | Actual duration in minutes         |
| `benchmarkMins` | number | no    | Benchmark for comparison           |
| `status`      | string | yes      | "on_time", "over", "under"         |

```json
{
  "id": "evt-1711100000000-2",
  "ts": 1711099840000,
  "source": "SYSTEM",
  "type": "phase.complete",
  "data": {
    "phaseId": 2,
    "label": "Initial Count",
    "actualMins": 4.4,
    "benchmarkMins": 8,
    "status": "under"
  }
}
```

**Triggers:** Phase bar fill, efficiency metrics update.

---

### 4.2 Inventory Events

#### `inventory.baseline`

Emitted during initial count to establish the starting inventory.

| Source | `CAM-2` (mayo) or `CAM-3` (back table) |
|--------|------------------------------------------|

**Data payload:**

| Field      | Type   | Required | Description                                          |
|------------|--------|----------|------------------------------------------------------|
| `itemId`   | string | yes      | Item ID, e.g. "SPG-001"                              |
| `itemName` | string | yes      | Full item name                                       |
| `category` | string | yes      | One of: sponge, needle, sharp, pack, instrument      |
| `zone`     | string | yes      | Initial zone: mayo or back_table                     |
| `count`    | number | yes      | Initial quantity                                     |
| `locations`| object | yes      | `{ m, b, p, d }` counts by zone                     |
| `note`     | string | no       | Description of the baseline event                    |
| `frame`    | string | no       | Video frame reference                                |

```json
{
  "id": "evt-1711100000000-10",
  "ts": 1711098901000,
  "source": "CAM-2",
  "type": "inventory.baseline",
  "data": {
    "itemId": "SPG-001",
    "itemName": "Lap Sponge 18×18",
    "category": "sponge",
    "zone": "mayo",
    "count": 5,
    "locations": { "m": 5, "b": 0, "p": 0, "d": 0 },
    "note": "Initial count: 5 units on mayo stand",
    "frame": "/videos/cam2-sterile.mp4#t=2"
  }
}
```

**Triggers:** Inventory grid population, category totals, count baseline.

---

#### `inventory.move`

Emitted when an item moves between zones.

| Source | Camera covering the destination zone |
|--------|--------------------------------------|

**Data payload:**

| Field         | Type   | Required | Description                                 |
|---------------|--------|----------|---------------------------------------------|
| `itemId`      | string | yes      | Item ID                                     |
| `itemName`    | string | yes      | Full item name                              |
| `category`    | string | yes      | Item category                               |
| `zone`        | string | yes      | Destination zone                            |
| `action`      | string | yes      | Always `"move"`                             |
| `destination` | string | yes      | Same as `zone` — destination zone constant  |
| `note`        | string | no       | Description of the movement                 |
| `frame`       | string | no       | Video frame reference                       |

```json
{
  "id": "evt-1711100000000-20",
  "ts": 1711100540000,
  "source": "CAM-1",
  "type": "inventory.move",
  "data": {
    "itemId": "SPG-001",
    "itemName": "Lap Sponge 18×18",
    "category": "sponge",
    "zone": "patient",
    "action": "move",
    "destination": "patient",
    "note": "1× Lap Sponge → patient (packing surgical site)",
    "frame": "/videos/cam1-overhead.mp4#t=4"
  }
}
```

**Triggers:** Inventory grid zone update, item location badge change, movement animation.

---

#### `inventory.dispose`

Emitted when an item is disposed (waste bucket or sharps container).

| Source | `CAM-4` |
|--------|---------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `itemId`   | string | yes      | Item ID                                  |
| `itemName` | string | yes      | Full item name                           |
| `category` | string | yes      | Item category                            |
| `zone`     | string | yes      | Always `"waste"`                         |
| `note`     | string | no       | Description                              |
| `frame`    | string | no       | Video frame reference                    |

```json
{
  "id": "evt-1711100000000-30",
  "ts": 1711100780000,
  "source": "CAM-4",
  "type": "inventory.dispose",
  "data": {
    "itemId": "SPG-001",
    "itemName": "Lap Sponge 18×18",
    "category": "sponge",
    "zone": "waste",
    "note": "1× Lap Sponge → waste bucket (CAM-4 confirmed)",
    "frame": "/videos/cam4-waste.mp4#t=5"
  }
}
```

**Triggers:** Inventory disposed count increment, waste counter update.

---

#### `inventory.alert`

Emitted when a safety concern is detected (item drop, discrepancy, missing item).

| Source | Camera that detected the issue |
|--------|-------------------------------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `itemId`   | string | yes      | Item ID                                  |
| `itemName` | string | yes      | Full item name                           |
| `category` | string | yes      | Item category                            |
| `zone`     | string | yes      | Zone where issue detected (e.g. "floor") |
| `note`     | string | yes      | Alert description                        |
| `frame`    | string | no       | Video frame reference                    |

```json
{
  "id": "evt-1711100000000-40",
  "ts": 1711101560000,
  "source": "CAM-1",
  "type": "inventory.alert",
  "data": {
    "itemId": "SPG-003",
    "itemName": "Raytec Sponge",
    "category": "sponge",
    "zone": "floor",
    "note": "Raytec drop detected — floor zone, CAM-1",
    "frame": "/videos/cam1-overhead.mp4#t=6"
  }
}
```

**Triggers:** Alert banner, audio chime, item highlight in red, event log warning entry.

---

#### `inventory.recover`

Emitted when an alerted item is recovered and returned to a safe zone.

| Source | Camera covering the recovery zone |
|--------|----------------------------------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `itemId`   | string | yes      | Item ID                                  |
| `itemName` | string | yes      | Full item name                           |
| `category` | string | yes      | Item category                            |
| `zone`     | string | yes      | Zone item was recovered to (e.g. "mayo") |
| `note`     | string | yes      | Recovery description                     |
| `frame`    | string | no       | Video frame reference                    |

```json
{
  "id": "evt-1711100000000-41",
  "ts": 1711101560000,
  "source": "CAM-2",
  "type": "inventory.recover",
  "data": {
    "itemId": "SPG-003",
    "itemName": "Raytec Sponge",
    "category": "sponge",
    "zone": "mayo",
    "note": "Raytec recovered → returned to mayo stand",
    "frame": "/videos/cam2-sterile.mp4#t=7"
  }
}
```

**Triggers:** Alert dismiss, item status reset to normal, event log resolution entry.

---

#### `inventory.open`

Emitted when a pack/container is opened and its contents are added to the count.

| Source | `CAM-2` |
|--------|---------|

**Data payload:**

| Field      | Type   | Required | Description                                  |
|------------|--------|----------|----------------------------------------------|
| `itemId`   | string | yes      | Pack item ID                                 |
| `itemName` | string | yes      | Pack name                                    |
| `category` | string | yes      | Always `"pack"`                              |
| `zone`     | string | yes      | Zone where opened (usually "mayo")           |
| `note`     | string | yes      | What was added to the count                  |
| `frame`    | string | no       | Video frame reference                        |

```json
{
  "id": "evt-1711100000000-50",
  "ts": 1711100960000,
  "source": "CAM-2",
  "type": "inventory.open",
  "data": {
    "itemId": "PAK-001",
    "itemName": "Cavity Pack",
    "category": "pack",
    "zone": "mayo",
    "note": "1× Cavity Pack opened — contents laid out on mayo",
    "frame": "/videos/cam2-sterile.mp4#t=5"
  }
}
```

**Triggers:** Count adjustment, pack status update, event log entry.

---

### 4.3 Count Events

#### `count.start`

Emitted when a formal count process begins (initial, pre-close, or final).

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field       | Type   | Required | Description                                  |
|-------------|--------|----------|----------------------------------------------|
| `countType` | string | yes      | "initial", "pre_close", "final", "running"   |
| `phaseId`   | number | yes      | Associated phase ID                          |
| `text`      | string | yes      | Description                                  |

```json
{
  "id": "evt-1711100000000-60",
  "ts": 1711105400000,
  "source": "SYSTEM",
  "type": "count.start",
  "data": {
    "countType": "pre_close",
    "phaseId": 7,
    "text": "Pre-closure count initiated — verifying all zones"
  }
}
```

**Triggers:** Count panel activation, zone-by-zone progress display.

---

#### `count.zone`

Emitted when a specific zone has been counted.

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field    | Type   | Required | Description                                 |
|----------|--------|----------|---------------------------------------------|
| `zone`   | string | yes      | Zone that was counted                       |
| `count`  | number | yes      | Number of items in that zone                |
| `status` | string | yes      | "verified", "discrepancy"                   |
| `text`   | string | yes      | Description                                 |

```json
{
  "id": "evt-1711100000000-61",
  "ts": 1711105520000,
  "source": "SYSTEM",
  "type": "count.zone",
  "data": {
    "zone": "mayo",
    "count": 88,
    "status": "verified",
    "text": "Mayo Stand count: 88 items verified"
  }
}
```

**Triggers:** Zone checkmark in count panel, progress bar update.

---

#### `count.result`

Emitted with the result of a count (per-category or overall).

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field      | Type   | Required | Description                                |
|------------|--------|----------|--------------------------------------------|
| `category` | string | no       | Category counted, or "all" for total       |
| `expected` | number | yes      | Expected count                             |
| `actual`   | number | yes      | Actual count                               |
| `balanced` | boolean| yes      | Whether expected === actual                |
| `text`     | string | yes      | Description                                |

```json
{
  "id": "evt-1711100000000-62",
  "ts": 1711105940000,
  "source": "SYSTEM",
  "type": "count.result",
  "data": {
    "category": "all",
    "expected": 169,
    "actual": 169,
    "balanced": true,
    "text": "Count BALANCED — 169/169 total, all categories reconciled"
  }
}
```

**Triggers:** Count badge (green check or red X), summary panel update.

---

#### `count.resolve`

Emitted when a count discrepancy is resolved (or confirmed balanced).

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field        | Type   | Required | Description                              |
|--------------|--------|----------|------------------------------------------|
| `resolution` | string | yes      | "balanced", "x_ray_ordered", "documented"|
| `total`      | number | yes      | Final total count                        |
| `text`       | string | yes      | Resolution description                   |

```json
{
  "id": "evt-1711100000000-63",
  "ts": 1711105940000,
  "source": "SYSTEM",
  "type": "count.resolve",
  "data": {
    "resolution": "balanced",
    "total": 169,
    "text": "Count BALANCED ✓ — 169/169 (all zones reconciled)"
  }
}
```

**Triggers:** Safety gate clearance, proceed-to-close authorization.

---

### 4.4 Audio Events

#### `audio.transcript`

Emitted for each transcribed speech segment.

| Source | `MIC-1` (boom mic) or `MIC-2` (anesthesia station) |
|--------|------------------------------------------------------|

**Data payload:**

| Field        | Type    | Required | Description                              |
|--------------|---------|----------|------------------------------------------|
| `speaker`    | string  | yes      | Speaker name or role                     |
| `text`       | string  | yes      | Transcribed text                         |
| `confidence` | number  | yes      | STT confidence (0.0–1.0)                |
| `isSystem`   | boolean | no       | `true` if this is a system message       |

```json
{
  "id": "evt-1711100000000-70",
  "ts": 1711100360000,
  "source": "MIC-1",
  "type": "audio.transcript",
  "data": {
    "speaker": "Physician A",
    "text": "Metz and DeBakey. Starting the dissection.",
    "confidence": 0.96
  }
}
```

**Triggers:** Transcript feed append, speaker badge update.

---

#### `audio.keyword`

Emitted when a safety-critical keyword is detected in speech.

| Source | `MIC-1` or `MIC-2` |
|--------|---------------------|

**Data payload:**

| Field        | Type     | Required | Description                             |
|--------------|----------|----------|-----------------------------------------|
| `speaker`    | string   | yes      | Who said it                             |
| `text`       | string   | yes      | Full transcript containing the keyword  |
| `confidence` | number   | yes      | STT confidence                          |
| `isAlert`    | boolean  | yes      | Always `true`                           |
| `keywords`   | string[] | yes      | List of detected keywords               |

```json
{
  "id": "evt-1711100000000-71",
  "ts": 1711100300000,
  "source": "MIC-1",
  "type": "audio.keyword",
  "data": {
    "speaker": "Scrub Tech",
    "text": "Raytec down! Dropped on the floor.",
    "confidence": 0.98,
    "isAlert": true,
    "keywords": ["dropped"]
  }
}
```

**Triggers:** Alert banner, transcript highlight in red, audio chime, correlated inventory.alert.

---

### 4.5 Vision Events

#### `vision.detect`

Emitted when a new object is detected in a camera frame.

| Source | `CAM-1`..`CAM-4` |
|--------|-------------------|

**Data payload:**

| Field        | Type   | Required | Description                              |
|--------------|--------|----------|------------------------------------------|
| `objectId`   | string | yes      | Detected object / item ID               |
| `objectName` | string | yes      | Human label                              |
| `category`   | string | yes      | Item category                            |
| `zone`       | string | yes      | Zone where detected                      |
| `confidence` | number | yes      | Detection confidence (0.0–1.0)          |
| `bbox`       | object | no       | `{ x, y, w, h }` bounding box (normalized 0–1) |
| `frame`      | string | no       | Video frame reference                    |

```json
{
  "id": "evt-1711100000000-80",
  "ts": 1711100000000,
  "source": "CAM-2",
  "type": "vision.detect",
  "data": {
    "objectId": "SPG-001",
    "objectName": "Lap Sponge 18×18",
    "category": "sponge",
    "zone": "mayo",
    "confidence": 0.97,
    "bbox": { "x": 0.32, "y": 0.45, "w": 0.08, "h": 0.06 },
    "frame": "/videos/cam2-sterile.mp4#t=2"
  }
}
```

**Triggers:** Object overlay on camera feed, detection log entry.

---

#### `vision.track`

Emitted when a tracked object changes position or zone.

| Source | `CAM-1`..`CAM-4` |
|--------|-------------------|

**Data payload:**

| Field        | Type   | Required | Description                              |
|--------------|--------|----------|------------------------------------------|
| `objectId`   | string | yes      | Tracked item ID                          |
| `fromZone`   | string | yes      | Previous zone                            |
| `toZone`     | string | yes      | New zone                                 |
| `velocity`   | number | no       | Movement speed (pixels/sec)              |
| `confidence` | number | yes      | Tracking confidence                      |

```json
{
  "id": "evt-1711100000000-81",
  "ts": 1711100540000,
  "source": "CAM-1",
  "type": "vision.track",
  "data": {
    "objectId": "SPG-001",
    "fromZone": "mayo",
    "toZone": "patient",
    "velocity": 120,
    "confidence": 0.94
  }
}
```

**Triggers:** Movement trail animation, zone transfer detection (feeds into inventory.move).

---

#### `vision.frame`

Emitted periodically with frame-level metadata from cameras.

| Source | `CAM-1`..`CAM-4` |
|--------|-------------------|

**Data payload:**

| Field        | Type   | Required | Description                              |
|--------------|--------|----------|------------------------------------------|
| `cameraId`   | number | yes      | Camera number (1–4)                      |
| `frameNum`   | number | yes      | Sequential frame number                  |
| `timestamp`  | number | yes      | Frame capture timestamp (ms)             |
| `objectCount`| number | yes      | Number of tracked objects in frame       |
| `zones`      | object | no       | Object counts per zone in this frame     |

```json
{
  "id": "evt-1711100000000-82",
  "ts": 1711100000000,
  "source": "CAM-2",
  "type": "vision.frame",
  "data": {
    "cameraId": 2,
    "frameNum": 54000,
    "timestamp": 1711100000000,
    "objectCount": 42,
    "zones": { "mayo": 38, "sterile": 4 }
  }
}
```

**Triggers:** Frame counter update, camera health indicator.

---

### 4.6 System Events

#### `system.boot`

Emitted on system startup or general system info messages.

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `status`   | string | no       | "online", "ws_connected", etc.           |
| `text`     | string | yes      | Description                              |
| `severity` | string | yes      | "info", "ok", "warn"                     |
| `phaseId`  | number | no       | Associated phase if applicable           |

```json
{
  "id": "evt-1711100000000-90",
  "ts": 1711097929000,
  "source": "SYSTEM",
  "type": "system.boot",
  "data": {
    "status": "online",
    "text": "System operational — 4 cameras online",
    "severity": "info",
    "phaseId": 0
  }
}
```

**Triggers:** System status bar update, boot log entry.

---

#### `system.camera`

Emitted for camera status changes (online, offline, error).

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `cameraId` | number | yes      | Camera number (1–4)                      |
| `status`   | string | yes      | "online", "offline", "error"             |
| `text`     | string | yes      | Description                              |

```json
{
  "id": "evt-1711100000000-91",
  "ts": 1711097929000,
  "source": "SYSTEM",
  "type": "system.camera",
  "data": {
    "cameraId": 1,
    "status": "online",
    "text": "CAM-1 Ceiling Main — 4K/30fps, PTZ enabled"
  }
}
```

**Triggers:** Camera status indicator (green/red dot), camera feed panel.

---

#### `system.mic`

Emitted for microphone status changes.

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field    | Type   | Required | Description                              |
|----------|--------|----------|------------------------------------------|
| `micId`  | number | yes      | Microphone number (1–2)                  |
| `status` | string | yes      | "online", "offline", "muted"             |
| `text`   | string | yes      | Description                              |

```json
{
  "id": "evt-1711100000000-92",
  "ts": 1711097929000,
  "source": "SYSTEM",
  "type": "system.mic",
  "data": {
    "micId": 1,
    "status": "online",
    "text": "MIC-1 Boom — active, STT pipeline running"
  }
}
```

**Triggers:** Mic status indicator, audio pipeline health.

---

#### `system.compliance`

Emitted for compliance and safety gate checks.

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `text`     | string | yes      | Compliance check description             |
| `severity` | string | yes      | "gate", "ok", "warn"                     |
| `phaseId`  | number | no       | Associated phase                         |

```json
{
  "id": "evt-1711100000000-93",
  "ts": 1711099141000,
  "source": "SYSTEM",
  "type": "system.compliance",
  "data": {
    "text": "Count BALANCED ✓ — 169/169 (Mayo 88 + Back Table 81)",
    "severity": "ok",
    "phaseId": 2
  }
}
```

**Triggers:** Compliance panel checkmark, safety gate clearance indicator, event log.

---

#### `system.ebl`

Emitted for Estimated Blood Loss updates.

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `text`     | string | yes      | EBL description                          |
| `severity` | string | yes      | "info" or "warn"                         |
| `phaseId`  | number | no       | Associated phase                         |

```json
{
  "id": "evt-1711100000000-94",
  "ts": 1711103000000,
  "source": "SYSTEM",
  "type": "system.ebl",
  "data": {
    "text": "EBL update: 280cc — within acceptable range",
    "severity": "info",
    "phaseId": 6
  }
}
```

**Triggers:** EBL display update, transfusion alert if threshold exceeded.

---

#### `system.staff`

Emitted for staff presence changes (entry, exit, role changes).

| Source | `SYSTEM` |
|--------|----------|

**Data payload:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `text`     | string | yes      | Staff event description                  |
| `severity` | string | yes      | "info"                                   |
| `phaseId`  | number | no       | Associated phase                         |

```json
{
  "id": "evt-1711100000000-95",
  "ts": 1711097929000,
  "source": "SYSTEM",
  "type": "system.staff",
  "data": {
    "text": "OR Setup — 4 staff entered, 5 trays prepared",
    "severity": "info",
    "phaseId": 1
  }
}
```

**Triggers:** Staff panel update, team presence indicator.


## 5. Zone Definitions

Zones represent physical areas in the operating room tracked by the camera system.

| Constant     | String         | Description                                                |
|--------------|----------------|------------------------------------------------------------|
| `MAYO`       | `mayo`         | Mayo stand / sterile instrument tray next to the surgeon   |
| `BACK_TABLE` | `back_table`   | Back table with additional instruments and supplies        |
| `PATIENT`    | `patient`      | On or inside the patient (surgical site)                   |
| `FLOOR`      | `floor`        | Floor zone — items here trigger alerts                     |
| `WASTE`      | `waste`        | Waste bucket, sharps container, biohazard disposal         |
| `STERILE`    | `sterile`      | Sterile field perimeter (drapes, barriers)                 |
| `OFF_FIELD`  | `off_field`    | Outside the sterile field — non-sterile area               |

### Zone-to-Camera Mapping

| Zone         | Primary Camera | Notes                               |
|--------------|----------------|-------------------------------------|
| `mayo`       | CAM-2          | Sterile field camera, 4K with PTZ   |
| `back_table` | CAM-3          | Dedicated back table camera, 1080p  |
| `patient`    | CAM-1          | Ceiling main camera, 4K with PTZ    |
| `floor`      | CAM-1          | Ceiling camera covers the full OR   |
| `waste`      | CAM-4          | Waste & door camera, 1080p          |
| `sterile`    | CAM-2          | Sterile field camera                |
| `off_field`  | CAM-1 / CAM-4  | Peripheral coverage                |

### Zone Short Codes (procedureDB)

The `loc` field in ITEMS uses short codes that map to zones:

| Code | Zone         |
|------|--------------|
| `m`  | `mayo`       |
| `b`  | `back_table` |
| `p`  | `patient`    |
| `d`  | `waste`      |


## 6. Item Category Definitions

| Constant      | String         | Description                           | Icon | Examples                            |
|---------------|----------------|---------------------------------------|------|-------------------------------------|
| `SPONGE`      | `sponge`       | Absorbent materials for hemostasis    | ◼    | Lap Sponge, 4x4 Gauze, Raytec     |
| `NEEDLE`      | `needle`       | Suture needles of all types           | ▲    | CT-1, SH, Keith, RB-1             |
| `SHARP`       | `sharp`        | Blades, trocars, cutting instruments  | ◆    | Blade #10, #15, #11, Trocar 5mm   |
| `PACK`        | `pack`         | Disposable packs and containers       | ▣    | Cavity Pack, Lap Pack (5ct)        |
| `INSTRUMENT`  | `instrument`   | Reusable surgical instruments         | ◎    | Retractors, Forceps, Clamps, etc.  |

### Category Counts (Mastectomy/Reconstruction Kit)

| Category    | Types | Total Items |
|-------------|-------|-------------|
| Sponge      | 3     | 20          |
| Needle      | 4     | 12          |
| Sharp       | 4     | 7           |
| Pack        | 2     | 4           |
| Instrument  | 53    | 128         |
| **Total**   | **66**| **169** (initial) + 2 (baseline instruments not listed in events) |


## 7. Phase Definitions

The surgical procedure is divided into 15 phases (IDs 0–14). Phases with `gate: true` are safety gates that require verification before proceeding.

| ID | Label               | Short   | Color  | Gate | Offset (sec) | Duration (min) | Benchmark (min) |
|----|---------------------|---------|--------|------|---------------|----------------|-----------------|
| 0  | Patient Out (Prev)  | PT·OUT  | teal   | no   | -2071         | —              | —               |
| 1  | OR Setup            | SETUP   | purple | no   | -2071         | 16.2           | 15              |
| 2  | Initial Count       | I·CNT   | amber  | yes  | -1099         | 4.4            | 8               |
| 3  | Patient In          | PT·IN   | cyan   | no   | -835          | 2.0            | 3               |
| 4  | Anesthesia          | ANES    | purple | no   | -715          | 8.75           | 10              |
| 5  | Time Out            | T·OUT   | amber  | yes  | -190          | 3.0            | 5               |
| 6  | Procedure           | PROC    | green  | no   | 0             | 90             | 90              |
| 7  | Pre-Close Count     | P·CNT   | red    | yes  | 5400          | 8              | 8               |
| 8  | Count Resolution    | RSLV    | red    | yes  | 5880          | 2              | 5               |
| 9  | Surgeon Decision    | DECIDE  | orange | no   | 6000          | 2              | 3               |
| 10 | Closure             | CLOSE   | purple | no   | 6120          | 30             | 30              |
| 11 | Final Count         | F·CNT   | amber  | yes  | 7920          | 6              | 8               |
| 12 | Emergence           | EMRG    | cyan   | no   | 8280          | 10             | 10              |
| 13 | Patient Out         | PT·OUT  | green  | no   | 8880          | 3              | 3               |
| 14 | Turnover            | TURN    | teal   | no   | 9060          | 25             | 25              |

### Safety Gates

Safety gates (phases 2, 5, 7, 8, 11) represent mandatory verification points:

- **Initial Count (2):** All instruments and supplies counted and documented before patient contact.
- **Time Out (5):** Verbal confirmation of patient identity, procedure, site, and consent.
- **Pre-Close Count (7):** Full count of all zones before wound closure begins.
- **Count Resolution (8):** Discrepancy resolution — totals compared against baseline.
- **Final Count (11):** Post-closure verification that all items are accounted for.


## 8. REST API Endpoints

These endpoints supplement the WebSocket stream for data that needs to be fetched on demand.

### `GET /api/events`

Retrieve historical events.

**Query Parameters:**

| Param  | Type   | Default | Description                              |
|--------|--------|---------|------------------------------------------|
| `type` | string | —       | Filter by event type (supports wildcards)|
| `since`| number | —       | Only events after this timestamp (ms)    |
| `limit`| number | 1000    | Max events to return                     |
| `offset`| number| 0       | Pagination offset                        |

**Response:**

```json
{
  "events": [ { "id": "...", "ts": ..., ... }, ... ],
  "total": 1523,
  "hasMore": true
}
```

---

### `GET /api/procedure`

Get current procedure metadata and status.

**Response:**

```json
{
  "id": "2026-0321-001",
  "type": "Mastectomy / Reconstruction",
  "kit": "LRG-Mastectomy Tray",
  "patient": { "id": "PT-20260321", "gender": "F", "age": 55, "mrn": "SH-449821" },
  "surgeon": { "name": "Physician A", "id": "SRG-001" },
  "or": "OR-1",
  "facility": "Sheba Medical Center",
  "currentPhase": { "id": 6, "label": "Procedure", "elapsed": 2100 },
  "startTime": 1711100000000,
  "team": [ ... ],
  "compliance": [ ... ]
}
```

---

### `GET /api/inventory`

Get current inventory state (snapshot of all items and their locations).

**Query Parameters:**

| Param      | Type   | Default | Description                     |
|------------|--------|---------|---------------------------------|
| `category` | string | —       | Filter by category              |
| `zone`     | string | —       | Filter by current zone          |

**Response:**

```json
{
  "items": [
    {
      "id": "SPG-001",
      "name": "Lap Sponge 18×18",
      "category": "sponge",
      "initialCount": 5,
      "currentLocations": { "mayo": 3, "back_table": 0, "patient": 0, "waste": 2 },
      "lastEvent": { "type": "inventory.dispose", "ts": 1711101740000 }
    }
  ],
  "totals": {
    "initial": 169,
    "accounted": 169,
    "balanced": true,
    "byCategory": {
      "sponge": { "initial": 20, "accounted": 20 },
      "needle": { "initial": 12, "accounted": 12 },
      "sharp": { "initial": 7, "accounted": 7 },
      "pack": { "initial": 4, "accounted": 4 },
      "instrument": { "initial": 128, "accounted": 128 }
    }
  }
}
```

---

### `GET /api/cameras`

Get camera configuration and status.

**Response:**

```json
{
  "cameras": [
    { "id": 1, "name": "Ceiling Main", "zone": "Full OR", "resolution": "4K", "fps": 30, "ptz": true, "status": "online" },
    { "id": 2, "name": "Sterile Field", "zone": "Sterile", "resolution": "4K", "fps": 30, "ptz": true, "status": "online" },
    { "id": 3, "name": "Back Table", "zone": "Back Table", "resolution": "1080p", "fps": 30, "ptz": false, "status": "online" },
    { "id": 4, "name": "Waste & Door", "zone": "Waste", "resolution": "1080p", "fps": 24, "ptz": false, "status": "online" }
  ]
}
```


## 9. Backend Implementation Notes

### Which Algorithms Produce Which Events

| Algorithm               | Input          | Event Types Produced                                    |
|-------------------------|----------------|---------------------------------------------------------|
| Object Detection (YOLO) | CAM-1..4       | `vision.detect`, `inventory.baseline`                   |
| Multi-Object Tracking   | CAM-1..4       | `vision.track`, `inventory.move`, `inventory.dispose`   |
| Zone Classifier         | CAM-1..4       | `inventory.move`, `inventory.alert`                     |
| Drop Detector           | CAM-1          | `inventory.alert`, `inventory.recover`                  |
| Pack Opening Detector   | CAM-2          | `inventory.open`                                        |
| Count Reconciler        | Fusion engine  | `count.start`, `count.zone`, `count.result`, `count.resolve` |
| Speech-to-Text          | MIC-1, MIC-2   | `audio.transcript`                                      |
| Keyword Spotter         | MIC-1, MIC-2   | `audio.keyword`                                         |
| Phase Detector          | Fusion engine  | `phase.start`, `phase.complete`                         |
| EBL Estimator           | CAM-4 + audio  | `system.ebl`                                            |
| Staff Tracker           | CAM-1          | `system.staff`                                          |

### Processing Pipeline

1. **Frame ingestion:** Cameras feed raw frames at configured FPS.
2. **Object detection:** YOLO-based model identifies surgical items per frame.
3. **Tracking:** Multi-object tracker (DeepSORT or ByteTrack) maintains item identity across frames.
4. **Zone classification:** Each tracked object is assigned to a zone based on spatial position.
5. **State change detection:** When an item's zone changes, an `inventory.move` event is produced.
6. **Audio processing:** Parallel STT pipeline transcribes speech, keyword spotter flags safety terms.
7. **Fusion:** The fusion engine correlates audio keywords with visual events (e.g., "dropped" + floor detection = alert).
8. **Phase detection:** Combines multiple signals (time, audio keywords, staff positions) to determine surgical phase.
9. **Count reconciliation:** Periodically compares current tracked state against baseline to produce count events.

### Event Ordering Guarantees

- Events within a single source are strictly ordered by timestamp.
- Cross-source events may arrive slightly out of order (up to 200ms skew).
- The EventBus stores events in arrival order; use `ts` for display ordering.
- Historical events (emitted on reconnect) have `_historical: true`.


## 10. Error Handling and Edge Cases

### WebSocket Disconnection

- Client should buffer UI state locally and attempt reconnection.
- On reconnect, fetch missed events via `GET /api/events?since=<last_ts>`.
- Events are idempotent — duplicate IDs should be deduplicated by the client.

### Count Discrepancy

If a count produces `count.result` with `balanced: false`:

1. System emits `inventory.alert` for each unaccounted item.
2. Phase remains at "Count Resolution" until resolved.
3. Resolution options: manual recount, X-ray order, or surgeon override.
4. Resolution emits `count.resolve` with the outcome.

### Item Not Detected

If an item is expected but not detected by cameras:

1. `inventory.alert` is emitted with `zone: "off_field"`.
2. UI highlights the item in the inventory grid with a warning indicator.
3. Audio keyword detection may correlate with the missing item.

### Camera Failure

1. `system.camera` emitted with `status: "offline"`.
2. Tracking for that camera's zone is degraded.
3. System falls back to audio-only tracking for that zone.
4. UI shows camera feed as offline with last known frame.

### Duplicate Events

- Each event has a unique `id` field.
- Clients must deduplicate by `id` when replaying history.
- The EventBus `emit()` method does not check for duplicates.

### Time Synchronization

- All timestamps use Unix epoch milliseconds.
- Server and client clocks should be synchronized via NTP.
- The `procStartMs` reference time is shared and stored in `localStorage`.
- All procedureDB offsets are relative to `procStartMs` (incision = offset 0).

### Mock vs Production

In development, `MockAlgorithm` replaces the WebSocket connection:

```js
// Development — mock algorithm emits events on the bus
import { startMock } from './mockAlgorithm';
const mock = startMock();

// Production — real WebSocket connection
import { eventBus } from './eventAPI';
eventBus.connect('ws://backend:8765/events');
```

The UI code is identical in both cases — it only interacts with the EventBus.
