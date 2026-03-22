/*
 * ARCHIVE ADAPTER — Converts archive case data into procedureDB-compatible shapes
 * so that TlScreen and InvScreen can render archived cases with the SAME engine
 * as the live dashboard.
 *
 * The adapter produces data in the exact same format as procedureDB:
 *   - phases[]:     same shape as PHASES (offsetStart, duration, benchmark, gate, etc.)
 *   - systemEvents[]: same shape as EVT ({ at, t, s, e, tp })
 *   - items[]:      same shape as ITEMS ({ id, n, cat, init, z })
 *   - itemEvents{}: same shape as ITEM_EVENTS ({ at, type, note, frame })
 *
 * The only difference is consumption mode:
 *   - Summary: elapsed = totalElapsed → all events are visible
 *   - Replay:  elapsed ticks up → events appear sequentially (same as live)
 */

import { PHASES } from './procedureDB';
import { getKitItems } from './kitCatalog';

// ── Helpers ──

function parseTime(t) {
  if (!t) return 0;
  const p = t.split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0];
}

function durToMin(d) {
  if (!d) return 0;
  const p = d.split(':').map(Number);
  return p.length === 2 ? p[0] + p[1] / 60 : p[0];
}

function fmtHHMM(sec) {
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Main adapter ──

export function adaptArchiveCase(archiveCase) {
  const op = archiveCase;
  const t0 = parseTime(op.stateLog[0]?.t || '00:00:00');

  // ═══ 1. PHASES — from stateLog, same shape as PHASES ═══
  const phases = PHASES.map((phase, i) => {
    const sl = op.stateLog.find(s => s.s === i);
    if (!sl) return { ...phase, offsetStart: phase.offsetStart, duration: 0 };
    return {
      ...phase,
      offsetStart: parseTime(sl.t) - t0,
      duration: sl.dur ? durToMin(sl.dur) : 0,
      benchmark: sl.b || phase.benchmark,
    };
  });

  // Total elapsed
  const lastSl = op.stateLog[op.stateLog.length - 1];
  const totalElapsed = (parseTime(lastSl.t) - t0) + (lastSl.dur ? durToMin(lastSl.dur) * 60 : 0);

  // ═══ 2. SYSTEM EVENTS — from archive events[], same shape as EVT ═══
  const systemEvents = (op.events || []).map(e => {
    const offsetSec = parseTime(e.t) - t0;
    let s = 0;
    for (let i = op.stateLog.length - 1; i >= 0; i--) {
      if (parseTime(e.t) >= parseTime(op.stateLog[i].t)) { s = op.stateLog[i].s; break; }
    }
    return { at: offsetSec, t: e.t.slice(0, 5), s, e: e.e, tp: e.tp };
  });

  // Ensure every gate phase has proper gate+ok events within its time window
  // The counts panel filters events by phase offsetStart, so events MUST fall
  // within the correct phase's window to be matched.
  for (const sl of op.stateLog) {
    const phase = PHASES[sl.s];
    if (!phase || !phase.gate) continue;
    const phaseAt = parseTime(sl.t) - t0;
    const phaseDurSec = sl.dur ? durToMin(sl.dur) * 60 : 0;

    // Check if this gate phase already has an "ok" event within its time window
    const nextSl = op.stateLog.find(s2 => s2.s > sl.s);
    const nextAt = nextSl ? parseTime(nextSl.t) - t0 : phaseAt + phaseDurSec + 60;
    const hasOk = systemEvents.some(e => e.at >= phaseAt && e.at < nextAt && e.tp === 'ok');

    if (!hasOk) {
      if (sl.count) {
        // Has count data — generate gate + ok events
        const status = sl.count.status;
        const okAt = phaseAt + Math.min(phaseDurSec - 10, phaseDurSec * 0.8);
        systemEvents.push({ at: phaseAt + 5, t: sl.t.slice(0, 5), s: sl.s, e: `${phase.label}: ${sl.count.base} = ${sl.count.field} field + ${sl.count.disp} disposed`, tp: 'gate' });
        systemEvents.push({ at: okAt, t: sl.t.slice(0, 5), s: sl.s, e: `Count ${status.toUpperCase()} ✓`, tp: 'ok' });
      } else if (phaseDurSec === 0) {
        // Zero-duration gate — skipped (counts already balanced)
        systemEvents.push({ at: phaseAt, t: sl.t.slice(0, 5), s: sl.s, e: `${phase.label} — skipped (counts balanced)`, tp: 'ok' });
      }
    }
  }
  systemEvents.sort((a, b) => a.at - b.at);

  // ═══ 3. ITEMS — from kit catalogue, same shape as ITEMS ═══
  const items = getKitItems(op.kit);
  // items already have: { id, n, cat, init, z }  — no loc (computed from events by the engine)

  // ═══ 4. ITEM EVENTS — same shape as ITEM_EVENTS ═══
  // { at, type, note, frame }
  // The engine (useInventoryState) processes these identically to live:
  //   - baseline: marks item as visible, sets initial location from item.z
  //   - to_mayo/to_back/to_patient/disposed: moves pieces between zones
  //
  // We distribute the archive's final zone counts as movement events
  // spread across the procedure phase timeline.

  const zM = op.zMayo || 0, zB = op.zBack || 0, zP = op.zPatient || 0, zD = op.zDisposed || 0;
  const zTotal = zM + zB + zP + zD || 1;

  // Phase timing for spreading events
  const icPhase = phases[1]; // Initial Count
  const baselineAt = icPhase ? icPhase.offsetStart : 60;
  const procPhase = phases[5]; // Procedure
  const procStart = procPhase ? procPhase.offsetStart : 300;
  const procDurSec = procPhase ? (procPhase.duration || 60) * 60 : 3600;

  // Camera frame mapping by event type (same as live procedureDB)
  const frameFor = (type, at) => {
    const t = Math.max(1, Math.floor((at % 30) + 1)); // vary timestamp within video
    if (type === 'baseline') return `/videos/cam2-sterile.mp4#t=${t}`;
    if (type === 'to_mayo') return `/videos/cam2-sterile.mp4#t=${t}`;
    if (type === 'to_back') return `/videos/cam3-backtable.mp4#t=${t}`;
    if (type === 'to_patient') return `/videos/cam1-overhead.mp4#t=${t}`;
    if (type === 'disposed') return `/videos/cam4-waste.mp4#t=${t}`;
    return `/videos/cam1-overhead.mp4#t=${t}`;
  };

  const itemEvents = {};

  items.forEach(item => {
    const evts = [];
    const baseZone = item.z === 'back_table' ? 'back table' : 'mayo stand';

    // ── Baseline event (same as live: at initial count phase) ──
    evts.push({
      at: baselineAt,
      type: 'baseline',
      note: `Initial count: ${item.init} units on ${baseZone}`,
      frame: frameFor('baseline', baselineAt),
    });

    // ── Compute how many pieces move where ──
    // Items start in their declared zone (mayo or back_table)
    // We need to generate events that move pieces to match the archive's final distribution
    const isFromMayo = item.z === 'mayo';

    // How many of THIS item's pieces end up in each zone (proportional to global distribution)
    let toMayo = 0, toBack = 0, toPatient = 0, toDisposed = 0;

    if (isFromMayo) {
      // Starts on mayo. Some may move to back, patient, or disposed.
      const stayMayo = Math.round(item.init * zM / zTotal);
      toDisposed = Math.round(item.init * zD / zTotal);
      toPatient = Math.round(item.init * zP / zTotal);
      toBack = item.init - stayMayo - toDisposed - toPatient;
      if (toBack < 0) { toBack = 0; }
    } else {
      // Starts on back table. Some may move to mayo, patient, or disposed.
      const stayBack = Math.round(item.init * zB / zTotal);
      toDisposed = Math.round(item.init * zD / zTotal);
      toPatient = Math.round(item.init * zP / zTotal);
      toMayo = item.init - stayBack - toDisposed - toPatient;
      if (toMayo < 0) { toMayo = 0; }
    }

    const totalMoves = toMayo + toBack + toPatient + toDisposed;
    let moveIdx = 0;

    // ── Movement events spread across procedure phase ──
    // to_mayo (back table items moved to mayo)
    for (let j = 0; j < toMayo; j++) {
      moveIdx++;
      const at = procStart + Math.round((moveIdx / (totalMoves + 1)) * procDurSec * 0.5);
      evts.push({
        at,
        type: 'to_mayo',
        note: `1× ${item.n} → mayo stand`,
        frame: frameFor('to_mayo', at),
      });
    }

    // to_back (mayo items moved to back table)
    for (let j = 0; j < toBack; j++) {
      moveIdx++;
      const at = procStart + Math.round((moveIdx / (totalMoves + 1)) * procDurSec * 0.5);
      evts.push({
        at,
        type: 'to_back',
        note: `1× ${item.n} → back table`,
        frame: frameFor('to_back', at),
      });
    }

    // to_patient
    for (let j = 0; j < toPatient; j++) {
      moveIdx++;
      const at = procStart + Math.round((moveIdx / (totalMoves + 1)) * procDurSec * 0.65);
      evts.push({
        at,
        type: 'to_patient',
        note: `1× ${item.n} → patient (in use)`,
        frame: frameFor('to_patient', at),
      });
    }

    // disposed
    for (let j = 0; j < toDisposed; j++) {
      moveIdx++;
      const at = procStart + Math.round((moveIdx / (totalMoves + 1)) * procDurSec * 0.8);
      evts.push({
        at,
        type: 'disposed',
        note: `1× ${item.n} → waste (disposed)`,
        frame: frameFor('disposed', at),
      });
    }

    // Sort by time
    evts.sort((a, b) => a.at - b.at);
    itemEvents[item.id] = evts;
  });

  // ═══ Return — same shape consumed by TlScreen, InvScreen, TnScreen ═══
  return {
    phases,
    systemEvents,
    items,
    itemEvents,
    liveEvents: [],
    transcription: { static: [], live: [] },
    totalElapsed,
    t0,
  };
}
