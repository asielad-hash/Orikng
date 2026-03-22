/*
 * EVENT API — Event bus and standard event envelope for ORKing
 *
 * All inter-module communication flows through EventBus.
 * Backend algorithms (camera, mic, system) emit events.
 * UI components subscribe to the types they care about.
 *
 * Event envelope:
 *   { id, ts, source, type, data }
 *
 * Type strings are dot-namespaced (e.g. "inventory.move").
 * Listeners can use wildcards: "inventory.*" matches all inventory events.
 */

// ═══════════════════════════════════════════════════════════
// EVENT TYPE CONSTANTS
// ═══════════════════════════════════════════════════════════
export const EVT = {
  // Phase lifecycle
  PHASE_START:         'phase.start',
  PHASE_COMPLETE:      'phase.complete',

  // Inventory tracking
  INVENTORY_BASELINE:  'inventory.baseline',
  INVENTORY_MOVE:      'inventory.move',
  INVENTORY_DISPOSE:   'inventory.dispose',
  INVENTORY_ALERT:     'inventory.alert',
  INVENTORY_RECOVER:   'inventory.recover',
  INVENTORY_OPEN:      'inventory.open',

  // Count verification
  COUNT_START:         'count.start',
  COUNT_ZONE:          'count.zone',
  COUNT_RESULT:        'count.result',
  COUNT_RESOLVE:       'count.resolve',

  // Audio processing
  AUDIO_TRANSCRIPT:    'audio.transcript',
  AUDIO_KEYWORD:       'audio.keyword',

  // Vision / camera
  VISION_DETECT:       'vision.detect',
  VISION_TRACK:        'vision.track',
  VISION_FRAME:        'vision.frame',

  // System-level
  SYSTEM_BOOT:         'system.boot',
  SYSTEM_CAMERA:       'system.camera',
  SYSTEM_MIC:          'system.mic',
  SYSTEM_COMPLIANCE:   'system.compliance',
  SYSTEM_EBL:          'system.ebl',
  SYSTEM_STAFF:        'system.staff',
};

// ═══════════════════════════════════════════════════════════
// ZONE CONSTANTS — physical areas tracked by cameras
// ═══════════════════════════════════════════════════════════
export const ZONES = {
  MAYO:       'mayo',
  BACK_TABLE: 'back_table',
  PATIENT:    'patient',
  FLOOR:      'floor',
  WASTE:      'waste',
  STERILE:    'sterile',
  OFF_FIELD:  'off_field',
};

// Short-code to zone mapping (used by procedureDB loc keys)
export const ZONE_FROM_LOC = {
  m: ZONES.MAYO,
  b: ZONES.BACK_TABLE,
  p: ZONES.PATIENT,
  d: ZONES.WASTE,
};

// ═══════════════════════════════════════════════════════════
// ITEM CATEGORY CONSTANTS
// ═══════════════════════════════════════════════════════════
export const ITEM_CATEGORIES = {
  SPONGE:     'sponge',
  NEEDLE:     'needle',
  SHARP:      'sharp',
  PACK:       'pack',
  INSTRUMENT: 'instrument',
};

// ═══════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════
export class EventBus {
  constructor() {
    this._listeners = new Map();   // type → Set<callback>
    this._history = [];            // all emitted events
    this._ws = null;               // future WebSocket
  }

  /**
   * Subscribe to an event type.
   * Supports wildcards: "inventory.*" matches inventory.move, inventory.alert, etc.
   * Use "*" to listen to ALL events.
   *
   * @param {string} type - Event type or wildcard pattern
   * @param {Function} callback - Called with the event object
   */
  on(type, callback) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(callback);
  }

  /**
   * Unsubscribe from an event type.
   *
   * @param {string} type - Must match the exact string used in on()
   * @param {Function} callback - The same function reference passed to on()
   */
  off(type, callback) {
    const set = this._listeners.get(type);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this._listeners.delete(type);
    }
  }

  /**
   * Emit an event. Dispatches to all matching listeners and stores in history.
   *
   * @param {Object} event - Must include { id, ts, source, type, data }
   */
  emit(event) {
    // Ensure required fields
    if (!event.id) event.id = _genId();
    if (!event.ts) event.ts = Date.now();

    // Store in history
    this._history.push(event);

    // Dispatch to exact-match listeners
    this._dispatch(event.type, event);

    // Dispatch to wildcard listeners
    // e.g. type "inventory.move" also triggers "inventory.*"
    const dotIdx = event.type.lastIndexOf('.');
    if (dotIdx > 0) {
      const namespace = event.type.substring(0, dotIdx);
      this._dispatch(`${namespace}.*`, event);
    }

    // Dispatch to global wildcard
    this._dispatch('*', event);
  }

  /**
   * Query event history by type and optional time filter.
   *
   * @param {string} [type] - Event type to filter (supports wildcards). Omit for all.
   * @param {number} [since] - Only return events with ts >= since (epoch ms)
   * @returns {Object[]} Matching events
   */
  query(type, since) {
    let results = this._history;

    if (type && type !== '*') {
      if (type.endsWith('.*')) {
        const prefix = type.slice(0, -2);
        results = results.filter(e => e.type.startsWith(prefix + '.'));
      } else {
        results = results.filter(e => e.type === type);
      }
    }

    if (since) {
      results = results.filter(e => e.ts >= since);
    }

    return results;
  }

  /**
   * Get all events in history (no filtering).
   * @returns {Object[]}
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Clear all history. Useful for reset / new procedure.
   */
  clearHistory() {
    this._history = [];
  }

  /**
   * Connect to a WebSocket endpoint for live backend events.
   * Future implementation — currently a no-op stub.
   *
   * @param {string} url - WebSocket URL, e.g. "ws://localhost:8765/events"
   */
  connect(url) {
    if (typeof WebSocket === 'undefined') {
      console.warn('[EventBus] WebSocket not available in this environment');
      return;
    }

    if (this._ws) {
      this._ws.close();
    }

    console.log(`[EventBus] Connecting to ${url}`);
    this._ws = new WebSocket(url);

    this._ws.onopen = () => {
      console.log('[EventBus] WebSocket connected');
      this.emit({
        id: _genId(),
        ts: Date.now(),
        source: 'SYSTEM',
        type: EVT.SYSTEM_BOOT,
        data: { status: 'ws_connected', url },
      });
    };

    this._ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        this.emit(event);
      } catch (err) {
        console.error('[EventBus] Failed to parse WebSocket message:', err);
      }
    };

    this._ws.onclose = () => {
      console.log('[EventBus] WebSocket disconnected');
      // TODO: auto-reconnect with exponential backoff
    };

    this._ws.onerror = (err) => {
      console.error('[EventBus] WebSocket error:', err);
    };
  }

  /**
   * Disconnect WebSocket if connected.
   */
  disconnect() {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  }

  // ── internal ──

  _dispatch(key, event) {
    const set = this._listeners.get(key);
    if (set) {
      for (const cb of set) {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Listener error for "${key}":`, err);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

let _seq = 0;
function _genId() {
  return `evt-${Date.now()}-${++_seq}`;
}

/**
 * Create a standard event envelope.
 *
 * @param {string} source - Who produced the event (e.g. "CAM-1", "MIC-1", "SYSTEM")
 * @param {string} type   - Event type from EVT constants
 * @param {Object} data   - Event-specific payload
 * @param {number} [ts]   - Timestamp override (epoch ms). Defaults to now.
 * @returns {Object} Complete event envelope
 */
export function createEvent(source, type, data, ts) {
  return {
    id: _genId(),
    ts: ts || Date.now(),
    source,
    type,
    data,
  };
}

// ═══════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════
export const eventBus = new EventBus();
