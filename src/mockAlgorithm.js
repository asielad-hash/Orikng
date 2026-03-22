/*
 * MOCK ALGORITHM — Simulates backend camera/mic processing
 *
 * Reads procedureDB data and emits standard events on the EventBus
 * at real-time pace. When the app starts mid-procedure, past events
 * are emitted immediately (marked _historical), future events are
 * scheduled with setTimeout at the correct real-time offset.
 *
 * In production, this file is replaced by the real WebSocket connection
 * to the backend processing pipeline.
 */

import { eventBus, EVT, ZONES, ZONE_FROM_LOC, createEvent } from './eventAPI';
import {
  PROCEDURE,
  PHASES,
  ITEMS,
  ITEM_EVENTS,
  SYSTEM_EVENTS,
  LIVE_EVENTS,
  TRANSCRIPTION,
  CAMERAS,
  COMPLIANCE,
} from './procedureDB';

// ═══════════════════════════════════════════════════════════
// UNIQUE ID GENERATOR
// ═══════════════════════════════════════════════════════════
let _seq = 0;
function genId() {
  return `evt-${Date.now()}-${++_seq}`;
}

// ═══════════════════════════════════════════════════════════
// EVENT TYPE MAPPING — procedureDB types → EVT constants
// ═══════════════════════════════════════════════════════════
const ITEM_TYPE_MAP = {
  baseline:   EVT.INVENTORY_BASELINE,
  to_patient: EVT.INVENTORY_MOVE,
  to_mayo:    EVT.INVENTORY_MOVE,
  to_back:    EVT.INVENTORY_MOVE,
  disposed:   EVT.INVENTORY_DISPOSE,
  alert:      EVT.INVENTORY_ALERT,
  resolved:   EVT.INVENTORY_RECOVER,
  opened:     EVT.INVENTORY_OPEN,
};

// Map procedureDB item event types to destination zones
const ITEM_DEST_MAP = {
  to_patient: ZONES.PATIENT,
  to_mayo:    ZONES.MAYO,
  to_back:    ZONES.BACK_TABLE,
  disposed:   ZONES.WASTE,
  baseline:   null, // zone comes from item definition
  alert:      ZONES.FLOOR,
  resolved:   ZONES.MAYO,
  opened:     ZONES.MAYO,
};

// Camera source mapping based on destination zone
function cameraForZone(zone) {
  switch (zone) {
    case ZONES.PATIENT:    return 'CAM-1';
    case ZONES.MAYO:       return 'CAM-2';
    case ZONES.STERILE:    return 'CAM-2';
    case ZONES.BACK_TABLE: return 'CAM-3';
    case ZONES.WASTE:      return 'CAM-4';
    case ZONES.FLOOR:      return 'CAM-1';
    default:               return 'CAM-1';
  }
}

// Map system event types to severity/category
const SYSTEM_TYPE_MAP = {
  phase: 'phase',
  info:  'info',
  gate:  'gate',
  ok:    'ok',
  warn:  'warn',
};

// ═══════════════════════════════════════════════════════════
// MOCK ALGORITHM CLASS
// ═══════════════════════════════════════════════════════════
export class MockAlgorithm {
  constructor(bus = eventBus) {
    this.bus = bus;
    this.timers = [];
    this.procStartMs = null;
  }

  /**
   * Start the mock algorithm from a given procedure start time.
   *
   * Events before `now` are emitted immediately (with _historical = true).
   * Events after `now` are scheduled at the correct real-time delay.
   *
   * @param {number} procStartMs - Epoch ms of procedure start (incision = offset 0)
   */
  start(procStartMs) {
    this.procStartMs = procStartMs;
    const now = Date.now();
    const elapsedSec = (now - procStartMs) / 1000;

    // Convert all DB entries to standard events
    const allEvents = [
      ...this._convertSystemEvents(),
      ...this._convertItemEvents(),
      ...this._convertLiveEvents(),
      ...this._convertTranscription(),
      ...this._convertPhaseTransitions(),
    ].sort((a, b) => a._offsetSec - b._offsetSec);

    for (const evt of allEvents) {
      const delaySec = evt._offsetSec - elapsedSec;
      delete evt._offsetSec; // remove internal field

      if (delaySec <= 0) {
        // Past event — emit immediately as history
        evt._historical = true;
        this.bus.emit(evt);
      } else {
        // Future event — schedule at real-time
        const timer = setTimeout(() => {
          this.bus.emit(evt);
        }, delaySec * 1000);
        this.timers.push(timer);
      }
    }
  }

  /**
   * Stop all scheduled future events.
   */
  stop() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  // ═══════════════════════════════════════════════════════════
  // CONVERSION: SYSTEM_EVENTS → standard events
  // ═══════════════════════════════════════════════════════════
  _convertSystemEvents() {
    return SYSTEM_EVENTS.map(se => {
      // Determine the event type based on the system event type
      let evtType;
      switch (se.type) {
        case 'phase':
          // Phase transitions are handled by _convertPhaseTransitions() with full metadata.
          // System events with type 'phase' are informational log entries only.
          evtType = EVT.SYSTEM_BOOT;
          break;
        case 'gate':
          evtType = EVT.SYSTEM_COMPLIANCE;
          break;
        case 'warn':
          evtType = EVT.INVENTORY_ALERT;
          break;
        case 'ok':
          evtType = EVT.SYSTEM_COMPLIANCE;
          break;
        case 'info':
        default:
          // Check for specific info subtypes
          if (se.text.includes('EBL')) {
            evtType = EVT.SYSTEM_EBL;
          } else if (se.text.includes('staff') || se.text.includes('entered')) {
            evtType = EVT.SYSTEM_STAFF;
          } else if (se.text.includes('camera')) {
            evtType = EVT.SYSTEM_CAMERA;
          } else {
            evtType = EVT.SYSTEM_BOOT;
          }
          break;
      }

      return {
        id: genId(),
        ts: this.procStartMs + se.at * 1000,
        source: 'SYSTEM',
        type: evtType,
        data: {
          phaseId: se.phase,
          text: se.text,
          severity: SYSTEM_TYPE_MAP[se.type] || 'info',
        },
        _offsetSec: se.at,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════
  // CONVERSION: ITEM_EVENTS → standard events
  // ═══════════════════════════════════════════════════════════
  _convertItemEvents() {
    const events = [];

    // Look up item metadata from ITEMS array
    const itemMap = new Map();
    for (const item of ITEMS) {
      itemMap.set(item.id, item);
    }

    for (const [itemId, itemEvents] of Object.entries(ITEM_EVENTS)) {
      const itemMeta = itemMap.get(itemId);
      if (!itemMeta) continue;

      for (const ie of itemEvents) {
        const evtType = ITEM_TYPE_MAP[ie.type];
        if (!evtType) continue;

        // Determine destination zone
        let destZone = ITEM_DEST_MAP[ie.type];
        if (ie.type === 'baseline') {
          destZone = itemMeta.zone || ZONES.MAYO;
        }

        // Determine source camera
        const source = cameraForZone(destZone);

        // Build data payload
        const data = {
          itemId: itemId,
          itemName: itemMeta.name,
          category: itemMeta.cat,
          zone: destZone,
          note: ie.note,
        };

        // Add baseline-specific fields
        if (ie.type === 'baseline') {
          data.count = itemMeta.init;
          data.locations = { ...itemMeta.loc };
        }

        // Add movement-specific fields
        if (ie.type === 'to_patient' || ie.type === 'to_mayo' || ie.type === 'to_back') {
          data.action = 'move';
          data.destination = destZone;
        }

        // Add frame reference if present
        if (ie.frame) {
          data.frame = ie.frame;
        }

        events.push({
          id: genId(),
          ts: this.procStartMs + ie.at * 1000,
          source,
          type: evtType,
          data,
          _offsetSec: ie.at,
        });
      }
    }

    return events;
  }

  // ═══════════════════════════════════════════════════════════
  // CONVERSION: LIVE_EVENTS → standard events
  // ═══════════════════════════════════════════════════════════
  _convertLiveEvents() {
    return LIVE_EVENTS.map(le => {
      // Determine event type based on the live event content
      let evtType;
      let source = 'SYSTEM';

      if (le.type === 'phase') {
        evtType = EVT.SYSTEM_BOOT; // phase transitions driven by _convertPhaseTransitions()
      } else if (le.type === 'gate') {
        evtType = EVT.COUNT_ZONE;
        if (le.text.includes('count')) {
          evtType = EVT.COUNT_RESULT;
        }
      } else if (le.type === 'warn') {
        evtType = EVT.INVENTORY_ALERT;
      } else if (le.type === 'ok' && le.itemId) {
        // Item returned / resolved
        evtType = EVT.INVENTORY_MOVE;
        source = 'CAM-2'; // typically returned to mayo
      } else if (le.type === 'info' && le.itemId) {
        // Item-related info
        if (le.text.includes('disposed') || le.text.includes('waste') || le.text.includes('sharps')) {
          evtType = EVT.INVENTORY_DISPOSE;
          source = 'CAM-4';
        } else if (le.text.includes('opened')) {
          evtType = EVT.INVENTORY_OPEN;
          source = 'CAM-2';
        } else if (le.text.includes('→ patient') || le.text.includes('→ patient')) {
          evtType = EVT.INVENTORY_MOVE;
          source = 'CAM-1';
        } else if (le.text.includes('→ mayo') || le.text.includes('from back table')) {
          evtType = EVT.INVENTORY_MOVE;
          source = 'CAM-2';
        } else {
          evtType = EVT.INVENTORY_MOVE;
          source = 'CAM-2';
        }
      } else if (le.type === 'ok') {
        evtType = EVT.SYSTEM_COMPLIANCE;
      } else if (le.text.includes('EBL')) {
        evtType = EVT.SYSTEM_EBL;
      } else {
        evtType = EVT.SYSTEM_BOOT; // general info
      }

      // Build data payload
      const data = {
        text: le.text,
        severity: SYSTEM_TYPE_MAP[le.type] || 'info',
      };

      if (le.itemId) {
        data.itemId = le.itemId;
        // Look up item metadata
        const itemMeta = ITEMS.find(i => i.id === le.itemId);
        if (itemMeta) {
          data.itemName = itemMeta.name;
          data.category = itemMeta.cat;
        }
      }

      return {
        id: genId(),
        ts: this.procStartMs + le.at * 1000,
        source,
        type: evtType,
        data,
        _offsetSec: le.at,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════
  // CONVERSION: TRANSCRIPTION → audio.transcript events
  // ═══════════════════════════════════════════════════════════
  _convertTranscription() {
    const events = [];

    // Static transcription (pre-procedure and early procedure)
    if (TRANSCRIPTION.static) {
      for (const t of TRANSCRIPTION.static) {
        events.push(this._makeTranscriptEvent(t));
      }
    }

    // Live transcription (real-time during procedure)
    if (TRANSCRIPTION.live) {
      for (const t of TRANSCRIPTION.live) {
        events.push(this._makeTranscriptEvent(t));
      }
    }

    return events;
  }

  /**
   * Convert a single transcription entry to an audio.transcript event.
   */
  _makeTranscriptEvent(t) {
    // Determine microphone source based on speaker role
    let source = 'MIC-1'; // default: boom mic
    if (t.speaker === 'Anesthesia' || t.speaker === 'Physician F') {
      source = 'MIC-2'; // anesthesia station mic
    }

    // Check for keyword/alert transcripts
    const evtType = (t.type === 'alert') ? EVT.AUDIO_KEYWORD : EVT.AUDIO_TRANSCRIPT;

    const data = {
      speaker: t.speaker,
      text: t.text,
      confidence: 0.92 + Math.random() * 0.07, // simulate 92-99% confidence
    };

    if (t.type === 'sys') {
      data.isSystem = true;
      source = 'SYSTEM';
    }

    if (t.type === 'alert') {
      data.isAlert = true;
      data.keywords = extractKeywords(t.text);
    }

    return {
      id: genId(),
      ts: this.procStartMs + t.at * 1000,
      source,
      type: evtType,
      data,
      _offsetSec: t.at,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONVERSION: PHASES → phase.start events
  // ═══════════════════════════════════════════════════════════
  _convertPhaseTransitions() {
    return PHASES.map((phase, idx) => {
      return {
        id: genId(),
        ts: this.procStartMs + phase.offsetStart * 1000,
        source: 'SYSTEM',
        type: EVT.PHASE_START,
        data: {
          phaseId: phase.id,
          phaseIndex: idx,
          label: phase.label,
          short: phase.short,
          colorKey: phase.colorKey,
          isGate: phase.gate,
          duration: phase.duration,
          benchmark: phase.benchmark,
          offsetStart: phase.offsetStart,
        },
        _offsetSec: phase.offsetStart,
      };
    });
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Extract safety-critical keywords from transcript text.
 */
function extractKeywords(text) {
  const KEYWORD_LIST = [
    'drop', 'dropped', 'missing', 'lost', 'count', 'recount',
    'bleeder', 'bleeding', 'hemorrhage', 'transfusion',
    'fire', 'alert', 'emergency', 'code',
    'wrong', 'stop', 'wait', 'time out',
    'sponge', 'needle', 'instrument', 'retained',
  ];

  const lower = text.toLowerCase();
  return KEYWORD_LIST.filter(kw => lower.includes(kw));
}

// ═══════════════════════════════════════════════════════════
// CONVENIENCE: Create and start a MockAlgorithm
// ═══════════════════════════════════════════════════════════

/**
 * Start the mock algorithm using procStartMs from localStorage
 * or default to a sensible offset (procedure start = 35 min ago).
 *
 * @param {EventBus} [bus] - Optional event bus override
 * @returns {MockAlgorithm} The running mock algorithm instance
 */
export function startMock(bus) {
  const mock = new MockAlgorithm(bus);

  // Try to read procStart from localStorage (set by the app)
  let procStartMs;
  try {
    const stored = localStorage.getItem('procStart');
    procStartMs = stored ? parseInt(stored, 10) : null;
  } catch {
    procStartMs = null;
  }

  // Default: procedure started 35 minutes ago (mid-procedure)
  if (!procStartMs) {
    procStartMs = Date.now() - 35 * 60 * 1000;
  }

  mock.start(procStartMs);
  return mock;
}
