/*
 * PROCEDURE DATABASE — Single source of truth for the entire ORKing UI
 *
 * All timestamps are OFFSETS IN SECONDS relative to procedure start (incision = 0)
 * Negative offsets = pre-procedure phases
 * Positive offsets = during/post procedure
 *
 * The app converts these to real local clock time using procStart from localStorage
 *
 * To demo different scenarios, modify this file:
 * - Change item counts/locations for different inventory states
 * - Add/remove events for different alert scenarios
 * - Modify phase durations for efficiency analysis
 * - Swap kit data for different procedure types
 */

// ═══════════════════════════════════════════════════════════
// 1. PROCEDURE METADATA
// ═══════════════════════════════════════════════════════════
export const PROCEDURE = {
  id: "2026-0428-001",
  type: "Total Hip Arthroplasty",
  kit: "Major Bone Set",
  kitBarcode: "10220-000",
  kitPdfUrl: "/assets/Major_Bone_Set.pdf",
  patient: { id: "PT-20260428", gender: "M", age: 68, mrn: "SH-503217" },
  surgeon: { name: "Physician C", id: "SRG-003" },
  or: "OR-1",
  facility: "Sheba Medical Center",
  team: [
    { name: "Physician C", role: "Surgeon", color: "teal" },
    { name: "Physician D", role: "Assistant", color: "teal" },
    { name: "Nurse A", role: "Circulator", color: "blue" },
    { name: "Scrub Tech B", role: "Scrub Tech", color: "cyan" },
  ],
  anesthesia: { name: "Physician F", type: "Regional + Sedation" },
  laterality: "Right",
};

// ═══════════════════════════════════════════════════════════
// 2. PHASE DEFINITIONS — states with benchmarks
// ═══════════════════════════════════════════════════════════
// offsetStart: seconds relative to procedure start (0 = incision)
export const PHASES = [
  { id: 0, label: "OR Setup",          short: "SETUP",  colorKey: "purple", gate: false, offsetStart: -2071, duration: 16.2, benchmark: 15 },
  { id: 1, label: "Initial Count",     short: "I·CNT",  colorKey: "amber",  gate: true,  offsetStart: -1099, duration: 4.4,  benchmark: 8 },
  { id: 2, label: "Patient In",        short: "PT·IN",  colorKey: "cyan",   gate: false, offsetStart: -835,  duration: 2.0,  benchmark: 3 },
  { id: 3, label: "Anesthesia",        short: "ANES",   colorKey: "indigo", gate: false, offsetStart: -715,  duration: 8.75, benchmark: 10 },
  { id: 4, label: "Time Out",          short: "T·OUT",  colorKey: "orange", gate: true,  offsetStart: -190,  duration: 3.0,  benchmark: 5 },
  { id: 5, label: "Procedure",         short: "PROC",   colorKey: "green",  gate: false, offsetStart: 0,     duration: 90,    benchmark: 90 },
  { id: 6, label: "Pre-Close Count",   short: "P·CNT",  colorKey: "red",    gate: true,  offsetStart: 5400,  duration: 8,     benchmark: 8 },
  { id: 7, label: "Count Resolution",  short: "RSLV",   colorKey: "rose",   gate: true,  offsetStart: 5880,  duration: 2,     benchmark: 5 },
  { id: 8, label: "Surgeon Decision",  short: "DECIDE", colorKey: "coral",  gate: false, offsetStart: 6000,  duration: 2,     benchmark: 3 },
  { id: 9, label: "Closure",          short: "CLOSE",  colorKey: "plum",   gate: false, offsetStart: 6120,  duration: 30,    benchmark: 30 },
  { id: 10, label: "Final Count",      short: "F·CNT",  colorKey: "olive",  gate: true,  offsetStart: 7920,  duration: 6,     benchmark: 8 },
  { id: 11, label: "Emergence",        short: "EMRG",   colorKey: "steel",  gate: false, offsetStart: 8280,  duration: 10,    benchmark: 10 },
  { id: 12, label: "Patient Out",      short: "PT·OUT", colorKey: "lime",   gate: false, offsetStart: 8880,  duration: 3,     benchmark: 3 },
  { id: 13, label: "Turnover",         short: "TURN",   colorKey: "teal",   gate: false, offsetStart: 9060,  duration: 25,    benchmark: 25 },
  { id: 14, label: "Idle",             short: "IDLE",   colorKey: "red",    gate: false, offsetStart: 10560, duration: 0,     benchmark: 15 },
];

export const ACTIVE_PHASE = 5; // Current phase index (Procedure)

// ═══════════════════════════════════════════════════════════
// 3. ITEM CATEGORIES
// ═══════════════════════════════════════════════════════════
export const CATEGORIES = [
  { key: "sponge", label: "Sponges", icon: "◼", colorKey: "teal" },
  { key: "needle", label: "Needles", icon: "▲", colorKey: "purple" },
  { key: "sharp",  label: "Sharps",  icon: "◆", colorKey: "amber" },
  { key: "pack",   label: "Disposables", icon: "▣", colorKey: "green" },
  { key: "instrument", label: "Instruments", icon: "◎", colorKey: "cyan" },
];

// ═══════════════════════════════════════════════════════════
// 4. INVENTORY ITEMS — loc: m=mayo, b=back table, p=patient, d=disposed
// ═══════════════════════════════════════════════════════════
export const ITEMS = [
  // CONSUMABLES — mayo → patient → disposed (orthopedic surgery)
  { id: "SPG-001", name: "Lap Sponge 18×18",   cat: "sponge", init: 5,  loc: { m: 3, b: 0, p: 0, d: 2 }, zone: "mayo" },
  { id: "SPG-002", name: "4×4 Gauze Pad",      cat: "sponge", init: 10, loc: { m: 7, b: 0, p: 0, d: 3 }, zone: "mayo" },
  { id: "SPG-003", name: "Raytec Sponge",      cat: "sponge", init: 5,  loc: { m: 4, b: 0, p: 0, d: 1 }, zone: "mayo" },
  { id: "NDL-001", name: "Suture Needle CT-1", cat: "needle", init: 4,  loc: { m: 4, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "NDL-002", name: "Suture Needle SH",   cat: "needle", init: 3,  loc: { m: 2, b: 0, p: 0, d: 1 }, zone: "mayo" },
  { id: "NDL-003", name: "Vicryl 2-0 (CT-2)",  cat: "needle", init: 3,  loc: { m: 3, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "NDL-004", name: "Ethibond #5",        cat: "needle", init: 4,  loc: { m: 4, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "SHP-001", name: "Blade #10",          cat: "sharp",  init: 2,  loc: { m: 1, b: 0, p: 0, d: 1 }, zone: "mayo" },
  { id: "SHP-002", name: "Blade #15",          cat: "sharp",  init: 1,  loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "SHP-003", name: "Blade #20",          cat: "sharp",  init: 1,  loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "SHP-004", name: "K-wire 2.5mm",       cat: "sharp",  init: 4,  loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "SHP-005", name: "Drill Bit 3.2mm",    cat: "sharp",  init: 2,  loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "PAK-001", name: "Bone Cement Mix Pack", cat: "pack",  init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "PAK-002", name: "Pulse Lavage Pack",  cat: "pack",   init: 1,  loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "PAK-003", name: "Hemovac Drain Pack", cat: "pack",   init: 1,  loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },

  // INSTRUMENTS — MAJOR BONE SET (orthopedic, total hip arthroplasty)
  // CLAMPS / TOWEL CLIPS
  { id: "INS-001", name: "Backhaus Towel Clip",       cat: "instrument", init: 6, loc: { m: 0, b: 6, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-002", name: "Edna Towel Clip",           cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-003", name: "Crile Forceps Curved",      cat: "instrument", init: 4, loc: { m: 4, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-004", name: "Crile Forceps Straight",    cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-005", name: "Rochester Pean Forceps",    cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-006", name: "Allis Forceps",             cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-007", name: "Kocher Forceps",            cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-008", name: "Ochsner Forceps",           cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-009", name: "Varco Forceps",             cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-010", name: "Martin Forceps",            cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-011", name: "Coller Forceps",            cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-012", name: "Braun Forceps",             cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-013", name: "Lewin Bone Clamp",          cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  // NEEDLE HOLDERS
  { id: "INS-014", name: "Mayo Hegar TC NH 18cm",     cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-015", name: "Crile Wood TC NH",          cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  // SCISSORS
  { id: "INS-016", name: "Lister Bandage Scissors",   cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-017", name: "Mayo Scissors Straight",    cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-018", name: "Mayo Scissors Curved",      cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-019", name: "Metzenbaum TC Scissors",    cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-020", name: "Reynolds Scissors",         cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-021", name: "FiberWire Scissors",        cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-022", name: "Nelson Metzenbaum TC",      cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  // FORCEPS
  { id: "INS-023", name: "Ferris Smith Forceps",      cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-024", name: "Tissue Forceps",            cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-025", name: "Dressing Forceps",          cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-026", name: "Adson Forceps",             cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-027", name: "DeBakey Forceps",           cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-028", name: "Mayo Russian Forceps",      cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  // RETRACTORS
  { id: "INS-029", name: "Army Navy Retractor",       cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-030", name: "Volkmann Retractor Sharp",  cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-031", name: "Volkmann Retractor Blunt",  cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-032", name: "Weitlaner Retractor Sharp", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-033", name: "Weitlaner Retractor Blunt", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-034", name: "Senn Retractor",            cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-035", name: "Kelly Retractor",           cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  // ELEVATORS
  { id: "INS-036", name: "Cobb Spinal Elevator 25mm", cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-037", name: "Cobb Spinal Elevator 19mm", cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-038", name: "Freer Elevator",            cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-039", name: "Key Elevator Large",        cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-040", name: "Key Elevator Small",        cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  // CURETTES
  { id: "INS-041", name: "Bruns Curette #000",        cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-042", name: "Bruns Curette #00",         cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-043", name: "Bruns Curette #0",          cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-044", name: "Bruns Curette #1",          cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-045", name: "Bruns Curette #2",          cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-046", name: "Bruns Curette #3",          cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-047", name: "Bruns Curette #4",          cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  // MISC
  { id: "INS-048", name: "Bone Hook",                 cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-049", name: "Yankauer Suction Tip",      cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-050", name: "Poole Suction Tip",         cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-051", name: "Knife Handle #3",           cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-052", name: "Knife Handle #7",           cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-053", name: "Ruler",                     cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-054", name: "Mallet",                    cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  // RONGEURS & CUTTERS
  { id: "INS-055", name: "Stille Rongeur",            cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-056", name: "Stille Luer Rongeur",       cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-057", name: "Caspar Rongeur",            cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-058", name: "Leksell Rongeur",           cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-059", name: "Bone Cutter",               cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-060", name: "Bone Tamp",                 cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-061", name: "Bone Rasp",                 cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-062", name: "Ruskin Rongeur",            cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-063", name: "Pin Cutter",                cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-064", name: "Wire Cutter",               cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
];

// ═══════════════════════════════════════════════════════════
// 5. ITEM EVENTS — per-item timeline (offsets in seconds from procedure start)
//    type: baseline | to_patient | to_mayo | to_back | disposed | alert | resolved | opened
// ═══════════════════════════════════════════════════════════
export const ITEM_EVENTS = {
  // ═══════════════════════════════════════════════════════════
  // CONSUMABLES — usage timeline through the THA case
  // ═══════════════════════════════════════════════════════════
  // SPONGES
  "SPG-001": [
    { at: -1099, type: "baseline", note: "Initial count: 5 lap sponges on mayo stand", frame: "/videos/cam2-sterile.mp4#t=2" },
    { at: 720,   type: "to_patient", note: "1× Lap Sponge → wound for hemostasis after capsulotomy", frame: "/videos/cam1-overhead.mp4#t=4" },
    { at: 1380,  type: "to_mayo", note: "1× Lap Sponge ← returned (used to clear femoral head)", frame: "/videos/cam2-sterile.mp4#t=3" },
    { at: 1500,  type: "disposed", note: "1× Lap Sponge → waste bucket (blood-soaked)", frame: "/videos/cam4-waste.mp4#t=5" },
    { at: 4800,  type: "disposed", note: "1× Lap Sponge → waste bucket (post pulse-lavage)", frame: "/videos/cam4-waste.mp4#t=12" },
  ],
  "SPG-002": [
    { at: -1099, type: "baseline", note: "Initial count: 10 4×4 gauze pads on mayo stand", frame: "/videos/cam2-sterile.mp4#t=1" },
    { at: 180,   type: "to_patient", note: "2× 4×4 Gauze → incision wound (initial bleed control)", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 540,   type: "disposed", note: "1× 4×4 Gauze → waste", frame: "/videos/cam4-waste.mp4#t=8" },
    { at: 1140,  type: "to_patient", note: "1× 4×4 Gauze → packing during osteotomy", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 1740,  type: "disposed", note: "1× 4×4 Gauze → waste", frame: "/videos/cam4-waste.mp4#t=10" },
    { at: 2700,  type: "disposed", note: "1× 4×4 Gauze → waste (acetabular reaming)", frame: "/videos/cam4-waste.mp4#t=15" },
    { at: 5340,  type: "to_mayo", note: "1× Gauze ← returned to mayo (pre-close prep)", frame: "/videos/cam2-sterile.mp4#t=4" },
  ],
  "SPG-003": [
    { at: -1099, type: "baseline", note: "Initial count: 5 Raytec sponges on mayo stand", frame: "/videos/cam2-sterile.mp4#t=3" },
    { at: 1260,  type: "to_patient", note: "1× Raytec → packing acetabulum (femoral neck cut)", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 1560,  type: "alert", note: "Raytec drop detected — floor zone, CAM-1", frame: "/videos/cam1-overhead.mp4#t=6" },
    { at: 1560,  type: "resolved", note: "Raytec recovered → returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 2700,  type: "disposed", note: "1× Raytec → waste (post acetabular prep)", frame: "/videos/cam4-waste.mp4#t=18" },
    { at: 5350,  type: "to_mayo", note: "1× Raytec ← returned to mayo (pre-close count)", frame: "/videos/cam2-sterile.mp4#t=5" },
  ],
  // NEEDLES / SUTURES
  "NDL-001": [
    { at: -1099, type: "baseline", note: "Initial count: 4 CT-1 suture needles on mayo", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 6300,  type: "to_patient", note: "1× CT-1 loaded → fascial closure", frame: "/videos/cam1-overhead.mp4#t=9" },
    { at: 6720,  type: "to_mayo", note: "1× CT-1 ← returned to mayo (fascia layer complete)", frame: "/videos/cam2-sterile.mp4#t=6" },
  ],
  "NDL-002": [
    { at: -1099, type: "baseline", note: "Initial count: 3 SH suture needles on mayo", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 7080,  type: "to_patient", note: "1× SH Needle loaded → subcutaneous closure", frame: "/videos/cam1-overhead.mp4#t=11" },
    { at: 7320,  type: "to_mayo", note: "1× SH Needle ← returned to mayo (subq complete)", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 7440,  type: "disposed", note: "1× SH Needle → sharps container", frame: "/videos/cam4-waste.mp4#t=20" },
  ],
  "NDL-003": [
    { at: -1099, type: "baseline", note: "Initial count: 3 Vicryl 2-0 (CT-2) on mayo", frame: "/videos/cam2-sterile.mp4#t=6" },
    { at: 6900,  type: "to_patient", note: "1× Vicryl 2-0 → IT band/fascia repair", frame: "/videos/cam1-overhead.mp4#t=10" },
  ],
  "NDL-004": [
    { at: -1099, type: "baseline", note: "Initial count: 4 Ethibond #5 sutures on mayo", frame: "/videos/cam2-sterile.mp4#t=6" },
    { at: 6480,  type: "to_patient", note: "1× Ethibond #5 → posterior capsule repair", frame: "/videos/cam1-overhead.mp4#t=13" },
    { at: 6900,  type: "to_mayo", note: "1× Ethibond #5 ← returned (capsule sutured)", frame: "/videos/cam2-sterile.mp4#t=14" },
  ],
  // SHARPS
  "SHP-001": [
    { at: -1099, type: "baseline", note: "Initial count: 2 #10 blades on mayo", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 0,     type: "to_patient", note: "1× #10 Blade mounted on knife handle → skin incision", frame: "/videos/cam1-overhead.mp4#t=2" },
    { at: 240,   type: "to_mayo", note: "1× #10 Blade ← removed from handle, returned to mayo", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 360,   type: "disposed", note: "1× #10 Blade → sharps container", frame: "/videos/cam4-waste.mp4#t=28" },
  ],
  "SHP-002": [
    { at: -1099, type: "baseline", note: "Initial count: 1 #15 blade on mayo", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 540,   type: "to_patient", note: "1× #15 Blade → fine fascial dissection", frame: "/videos/cam1-overhead.mp4#t=4" },
  ],
  "SHP-003": [
    { at: -1099, type: "baseline", note: "Initial count: 1 #20 blade on mayo", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 720,   type: "to_patient", note: "1× #20 Blade → capsulotomy (large blade for thick capsule)", frame: "/videos/cam1-overhead.mp4#t=6" },
  ],
  "SHP-004": [
    { at: -1080, type: "baseline", note: "Initial count: 4 K-wires 2.5mm on back table", frame: "/videos/cam3-backtable.mp4#t=8" },
    { at: 2700,  type: "to_patient", note: "2× K-wire 2.5mm → cup positioning reference pin", frame: "/videos/cam1-overhead.mp4#t=14" },
    { at: 4200,  type: "to_back", note: "2× K-wire ← removed after cup seated", frame: "/videos/cam3-backtable.mp4#t=12" },
  ],
  "SHP-005": [
    { at: -1080, type: "baseline", note: "Initial count: 2 drill bits 3.2mm on back table", frame: "/videos/cam3-backtable.mp4#t=9" },
    { at: 2400,  type: "to_patient", note: "1× Drill bit 3.2mm → cup screw pilot hole", frame: "/videos/cam1-overhead.mp4#t=15" },
    { at: 2580,  type: "to_back", note: "1× Drill bit 3.2mm ← returned to back table", frame: "/videos/cam3-backtable.mp4#t=11" },
  ],
  // PACKS (consumable kits)
  "PAK-001": [
    { at: -1080, type: "baseline", note: "Initial: 1 bone cement mix pack on back table", frame: "/videos/cam3-backtable.mp4#t=10" },
    { at: 3600,  type: "opened", note: "Bone Cement Mix Pack OPENED — cementing femoral stem", frame: "/videos/cam2-sterile.mp4#t=20" },
    { at: 3900,  type: "to_patient", note: "Cement applied to femoral canal", frame: "/videos/cam1-overhead.mp4#t=18" },
    { at: 4500,  type: "disposed", note: "Empty cement pack → waste", frame: "/videos/cam4-waste.mp4#t=22" },
  ],
  "PAK-002": [
    { at: -1080, type: "baseline", note: "Initial: 1 pulse lavage pack on back table", frame: "/videos/cam3-backtable.mp4#t=11" },
    { at: 4800,  type: "opened", note: "Pulse Lavage Pack OPENED — flushing femoral canal", frame: "/videos/cam2-sterile.mp4#t=22" },
    { at: 5040,  type: "disposed", note: "Pulse lavage tip → waste", frame: "/videos/cam4-waste.mp4#t=24" },
  ],
  "PAK-003": [
    { at: -1080, type: "baseline", note: "Initial: 1 Hemovac drain pack on back table", frame: "/videos/cam3-backtable.mp4#t=12" },
    { at: 5340,  type: "opened", note: "Hemovac Drain Pack OPENED — drain prep", frame: "/videos/cam2-sterile.mp4#t=24" },
    { at: 6120,  type: "to_patient", note: "Hemovac drain placed in deep tissue", frame: "/videos/cam1-overhead.mp4#t=20" },
  ],

  // ═══════════════════════════════════════════════════════════
  // INSTRUMENTS — Major Bone Set; detailed events for items used
  // during a typical THA, baseline-only otherwise
  // ═══════════════════════════════════════════════════════════
  "INS-001": [
    { at: -1080, type: "baseline", note: "Initial: 6 Backhaus Towel Clips on back table", frame: "/videos/cam3-backtable.mp4#t=2" },
    { at: -120,  type: "to_patient", note: "4× Backhaus Towel Clips → drape securing", frame: "/videos/cam1-overhead.mp4#t=1" },
  ],
  "INS-002": [{ at: -1080, type: "baseline", note: "Initial: 2 Edna Towel Clips on back table", frame: "/videos/cam3-backtable.mp4#t=2" }],
  "INS-003": [
    { at: -1099, type: "baseline", note: "Initial: 4 Crile Forceps Curved on mayo", frame: "/videos/cam2-sterile.mp4#t=4" },
    { at: 240,   type: "to_patient", note: "1× Crile Curved → vessel hemostasis (subcut)", frame: "/videos/cam1-overhead.mp4#t=2" },
    { at: 360,   type: "to_mayo", note: "1× Crile Curved ← returned to mayo", frame: "/videos/cam2-sterile.mp4#t=5" },
  ],
  "INS-004": [{ at: -1099, type: "baseline", note: "Initial: 2 Crile Forceps Straight on mayo", frame: "/videos/cam2-sterile.mp4#t=4" }],
  "INS-005": [{ at: -1080, type: "baseline", note: "Initial: 4 Rochester Pean Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=3" }],
  "INS-006": [
    { at: -1080, type: "baseline", note: "Initial: 4 Allis Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=3" },
    { at: 600,   type: "to_mayo", note: "2× Allis ← pulled to mayo (capsule grasping)", frame: "/videos/cam2-sterile.mp4#t=6" },
    { at: 720,   type: "to_patient", note: "2× Allis → grasping posterior capsule for incision", frame: "/videos/cam1-overhead.mp4#t=7" },
    { at: 1080,  type: "to_mayo", note: "2× Allis ← returned (capsulotomy complete)", frame: "/videos/cam2-sterile.mp4#t=7" },
  ],
  "INS-007": [{ at: -1080, type: "baseline", note: "Initial: 4 Kocher Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=4" }],
  "INS-008": [{ at: -1080, type: "baseline", note: "Initial: 4 Ochsner Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=4" }],
  "INS-009": [{ at: -1080, type: "baseline", note: "Initial: 2 Varco Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=5" }],
  "INS-010": [{ at: -1080, type: "baseline", note: "Initial: 2 Martin Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=5" }],
  "INS-011": [{ at: -1080, type: "baseline", note: "Initial: 2 Coller Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=6" }],
  "INS-012": [{ at: -1080, type: "baseline", note: "Initial: 2 Braun Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=6" }],
  "INS-013": [
    { at: -1080, type: "baseline", note: "Initial: 4 Lewin Bone Clamps on back table", frame: "/videos/cam3-backtable.mp4#t=7" },
    { at: 1200,  type: "to_mayo", note: "2× Lewin Bone Clamp ← pulled to mayo (femoral neck stabilization)", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 1500,  type: "to_back", note: "2× Lewin Bone Clamp ← returned (osteotomy complete)", frame: "/videos/cam3-backtable.mp4#t=10" },
  ],
  "INS-014": [
    { at: -1099, type: "baseline", note: "Initial: 2 Mayo Hegar TC NH 18cm on mayo", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 6300,  type: "to_patient", note: "1× Mayo Hegar NH → fascia closure", frame: "/videos/cam1-overhead.mp4#t=15" },
    { at: 7200,  type: "to_mayo", note: "1× Mayo Hegar NH ← returned (closure complete)", frame: "/videos/cam2-sterile.mp4#t=10" },
  ],
  "INS-015": [
    { at: -1099, type: "baseline", note: "Initial: 2 Crile Wood TC NH on mayo", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 7080,  type: "to_patient", note: "1× Crile Wood NH → subcutaneous suturing", frame: "/videos/cam1-overhead.mp4#t=16" },
  ],
  "INS-016": [{ at: -1080, type: "baseline", note: "Initial: 1 Lister Bandage Scissors on back table", frame: "/videos/cam3-backtable.mp4#t=8" }],
  "INS-017": [
    { at: -1099, type: "baseline", note: "Initial: 1 Mayo Scissors Straight on mayo", frame: "/videos/cam2-sterile.mp4#t=11" },
    { at: 60,    type: "to_patient", note: "1× Mayo Straight → subcutaneous tissue division", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 240,   type: "to_mayo", note: "1× Mayo Straight ← returned to mayo", frame: "/videos/cam2-sterile.mp4#t=12" },
  ],
  "INS-018": [
    { at: -1099, type: "baseline", note: "Initial: 1 Mayo Scissors Curved on mayo", frame: "/videos/cam2-sterile.mp4#t=11" },
    { at: 360,   type: "to_patient", note: "1× Mayo Curved → IT band division", frame: "/videos/cam1-overhead.mp4#t=4" },
    { at: 540,   type: "to_mayo", note: "1× Mayo Curved ← returned to mayo", frame: "/videos/cam2-sterile.mp4#t=12" },
  ],
  "INS-019": [
    { at: -1099, type: "baseline", note: "Initial: 1 Metzenbaum TC Scissors on mayo", frame: "/videos/cam2-sterile.mp4#t=12" },
    { at: 480,   type: "to_patient", note: "1× Metzenbaum → fine dissection short rotators", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 660,   type: "to_mayo", note: "1× Metzenbaum ← returned to mayo", frame: "/videos/cam2-sterile.mp4#t=13" },
  ],
  "INS-020": [{ at: -1099, type: "baseline", note: "Initial: 1 Reynolds Scissors on mayo", frame: "/videos/cam2-sterile.mp4#t=13" }],
  "INS-021": [
    { at: -1099, type: "baseline", note: "Initial: 1 FiberWire Scissors on mayo", frame: "/videos/cam2-sterile.mp4#t=13" },
    { at: 6900,  type: "to_patient", note: "1× FiberWire Scissors → suture cutting (capsule)", frame: "/videos/cam1-overhead.mp4#t=12" },
  ],
  "INS-022": [{ at: -1099, type: "baseline", note: "Initial: 1 Nelson Metzenbaum TC on mayo", frame: "/videos/cam2-sterile.mp4#t=14" }],
  "INS-023": [{ at: -1099, type: "baseline", note: "Initial: 2 Ferris Smith Forceps on mayo", frame: "/videos/cam2-sterile.mp4#t=14" }],
  "INS-024": [
    { at: -1099, type: "baseline", note: "Initial: 2 Tissue Forceps on mayo", frame: "/videos/cam2-sterile.mp4#t=15" },
    { at: 120,   type: "to_patient", note: "1× Tissue Forceps → handling subcut tissue", frame: "/videos/cam1-overhead.mp4#t=6" },
  ],
  "INS-025": [{ at: -1099, type: "baseline", note: "Initial: 2 Dressing Forceps on mayo", frame: "/videos/cam2-sterile.mp4#t=15" }],
  "INS-026": [
    { at: -1099, type: "baseline", note: "Initial: 2 Adson Forceps on mayo", frame: "/videos/cam2-sterile.mp4#t=16" },
    { at: 60,    type: "to_patient", note: "1× Adson Forceps → fine skin handling for incision", frame: "/videos/cam1-overhead.mp4#t=2" },
    { at: 7200,  type: "to_patient", note: "1× Adson Forceps → skin closure tissue handling", frame: "/videos/cam1-overhead.mp4#t=17" },
  ],
  "INS-027": [{ at: -1099, type: "baseline", note: "Initial: 1 DeBakey Forceps on mayo", frame: "/videos/cam2-sterile.mp4#t=16" }],
  "INS-028": [{ at: -1099, type: "baseline", note: "Initial: 1 Mayo Russian Forceps on mayo", frame: "/videos/cam2-sterile.mp4#t=17" }],
  "INS-029": [
    { at: -1080, type: "baseline", note: "Initial: 2 Army Navy Retractors on back table", frame: "/videos/cam3-backtable.mp4#t=14" },
    { at: 180,   type: "to_mayo", note: "2× Army Navy ← pulled to mayo (superficial retraction)", frame: "/videos/cam2-sterile.mp4#t=18" },
    { at: 240,   type: "to_patient", note: "2× Army Navy → subcutaneous retraction", frame: "/videos/cam1-overhead.mp4#t=8" },
    { at: 5400,  type: "to_back", note: "2× Army Navy ← back to table (closure prep)", frame: "/videos/cam3-backtable.mp4#t=16" },
  ],
  "INS-030": [
    { at: -1080, type: "baseline", note: "Initial: 2 Volkmann Sharp Retractors on back table", frame: "/videos/cam3-backtable.mp4#t=14" },
    { at: 540,   type: "to_mayo", note: "2× Volkmann Sharp ← pulled (deeper retraction)", frame: "/videos/cam2-sterile.mp4#t=19" },
    { at: 660,   type: "to_patient", note: "2× Volkmann Sharp → exposing fascia & glutes", frame: "/videos/cam1-overhead.mp4#t=9" },
    { at: 5340,  type: "to_back", note: "2× Volkmann Sharp ← back to table", frame: "/videos/cam3-backtable.mp4#t=17" },
  ],
  "INS-031": [{ at: -1080, type: "baseline", note: "Initial: 2 Volkmann Blunt Retractors on back table", frame: "/videos/cam3-backtable.mp4#t=15" }],
  "INS-032": [
    { at: -1080, type: "baseline", note: "Initial: 2 Weitlaner Sharp Retractors on back table", frame: "/videos/cam3-backtable.mp4#t=15" },
    { at: 720,   type: "to_mayo", note: "1× Weitlaner Sharp ← pulled (self-retaining)", frame: "/videos/cam2-sterile.mp4#t=20" },
    { at: 780,   type: "to_patient", note: "1× Weitlaner Sharp → self-retaining at fascia", frame: "/videos/cam1-overhead.mp4#t=10" },
    { at: 5340,  type: "to_back", note: "1× Weitlaner Sharp ← back to table", frame: "/videos/cam3-backtable.mp4#t=18" },
  ],
  "INS-033": [{ at: -1080, type: "baseline", note: "Initial: 2 Weitlaner Blunt Retractors on back table", frame: "/videos/cam3-backtable.mp4#t=16" }],
  "INS-034": [{ at: -1080, type: "baseline", note: "Initial: 2 Senn Retractors on back table", frame: "/videos/cam3-backtable.mp4#t=16" }],
  "INS-035": [
    { at: -1080, type: "baseline", note: "Initial: 2 Kelly Retractors on back table", frame: "/videos/cam3-backtable.mp4#t=17" },
    { at: 1200,  type: "to_mayo", note: "2× Kelly ← pulled to mayo (femoral neck exposure)", frame: "/videos/cam2-sterile.mp4#t=21" },
    { at: 1320,  type: "to_patient", note: "2× Kelly → retracting glutes for neck access", frame: "/videos/cam1-overhead.mp4#t=11" },
    { at: 4500,  type: "to_back", note: "2× Kelly ← back to table", frame: "/videos/cam3-backtable.mp4#t=19" },
  ],
  "INS-036": [{ at: -1080, type: "baseline", note: "Initial: 1 Cobb Spinal Elevator 25mm on back table", frame: "/videos/cam3-backtable.mp4#t=18" }],
  "INS-037": [
    { at: -1080, type: "baseline", note: "Initial: 1 Cobb Spinal Elevator 19mm on back table", frame: "/videos/cam3-backtable.mp4#t=18" },
    { at: 1080,  type: "to_mayo", note: "1× Cobb Elevator 19mm ← pulled (capsule release)", frame: "/videos/cam2-sterile.mp4#t=22" },
    { at: 1140,  type: "to_patient", note: "1× Cobb Elevator → capsule release on femoral neck", frame: "/videos/cam1-overhead.mp4#t=12" },
    { at: 1380,  type: "to_back", note: "1× Cobb Elevator ← back to table", frame: "/videos/cam3-backtable.mp4#t=19" },
  ],
  "INS-038": [
    { at: -1099, type: "baseline", note: "Initial: 1 Freer Elevator on mayo", frame: "/videos/cam2-sterile.mp4#t=18" },
    { at: 900,   type: "to_patient", note: "1× Freer Elevator → soft tissue elevation off bone", frame: "/videos/cam1-overhead.mp4#t=11" },
    { at: 1080,  type: "to_mayo", note: "1× Freer Elevator ← returned to mayo", frame: "/videos/cam2-sterile.mp4#t=19" },
  ],
  "INS-039": [{ at: -1080, type: "baseline", note: "Initial: 1 Key Elevator Large on back table", frame: "/videos/cam3-backtable.mp4#t=19" }],
  "INS-040": [{ at: -1080, type: "baseline", note: "Initial: 1 Key Elevator Small on back table", frame: "/videos/cam3-backtable.mp4#t=20" }],
  "INS-041": [{ at: -1080, type: "baseline", note: "Initial: 1 Bruns Curette #000 on back table", frame: "/videos/cam3-backtable.mp4#t=20" }],
  "INS-042": [{ at: -1080, type: "baseline", note: "Initial: 1 Bruns Curette #00 on back table", frame: "/videos/cam3-backtable.mp4#t=21" }],
  "INS-043": [
    { at: -1080, type: "baseline", note: "Initial: 1 Bruns Curette #0 on back table", frame: "/videos/cam3-backtable.mp4#t=21" },
    { at: 1740,  type: "to_mayo", note: "1× Bruns #0 ← pulled (acetabular floor cleaning)", frame: "/videos/cam2-sterile.mp4#t=23" },
    { at: 1860,  type: "to_patient", note: "1× Bruns Curette #0 → acetabulum", frame: "/videos/cam1-overhead.mp4#t=13" },
    { at: 1980,  type: "to_back", note: "1× Bruns #0 ← back to table", frame: "/videos/cam3-backtable.mp4#t=22" },
  ],
  "INS-044": [
    { at: -1080, type: "baseline", note: "Initial: 1 Bruns Curette #1 on back table", frame: "/videos/cam3-backtable.mp4#t=22" },
    { at: 1980,  type: "to_mayo", note: "1× Bruns #1 ← pulled (next reaming size)", frame: "/videos/cam2-sterile.mp4#t=24" },
    { at: 2040,  type: "to_patient", note: "1× Bruns #1 → acetabular reaming", frame: "/videos/cam1-overhead.mp4#t=14" },
    { at: 2160,  type: "to_back", note: "1× Bruns #1 ← back to table", frame: "/videos/cam3-backtable.mp4#t=23" },
  ],
  "INS-045": [
    { at: -1080, type: "baseline", note: "Initial: 1 Bruns Curette #2 on back table", frame: "/videos/cam3-backtable.mp4#t=23" },
    { at: 2160,  type: "to_mayo", note: "1× Bruns #2 ← pulled (deeper reaming)", frame: "/videos/cam2-sterile.mp4#t=25" },
    { at: 2220,  type: "to_patient", note: "1× Bruns #2 → acetabular reaming", frame: "/videos/cam1-overhead.mp4#t=15" },
    { at: 2340,  type: "to_back", note: "1× Bruns #2 ← back to table", frame: "/videos/cam3-backtable.mp4#t=24" },
  ],
  "INS-046": [{ at: -1080, type: "baseline", note: "Initial: 1 Bruns Curette #3 on back table", frame: "/videos/cam3-backtable.mp4#t=24" }],
  "INS-047": [{ at: -1080, type: "baseline", note: "Initial: 1 Bruns Curette #4 on back table", frame: "/videos/cam3-backtable.mp4#t=25" }],
  "INS-048": [
    { at: -1080, type: "baseline", note: "Initial: 1 Bone Hook on back table", frame: "/videos/cam3-backtable.mp4#t=25" },
    { at: 1380,  type: "to_mayo", note: "1× Bone Hook ← pulled (femoral head extraction)", frame: "/videos/cam2-sterile.mp4#t=26" },
    { at: 1440,  type: "to_patient", note: "1× Bone Hook → femoral head dislocated and extracted", frame: "/videos/cam1-overhead.mp4#t=16" },
    { at: 1620,  type: "to_back", note: "1× Bone Hook ← back to table", frame: "/videos/cam3-backtable.mp4#t=26" },
  ],
  "INS-049": [
    { at: -1099, type: "baseline", note: "Initial: 1 Yankauer Suction Tip on mayo", frame: "/videos/cam2-sterile.mp4#t=20" },
    { at: 60,    type: "to_patient", note: "1× Yankauer Suction → wound suctioning (incision)", frame: "/videos/cam1-overhead.mp4#t=3" },
  ],
  "INS-050": [
    { at: -1099, type: "baseline", note: "Initial: 1 Poole Suction Tip on mayo", frame: "/videos/cam2-sterile.mp4#t=20" },
    { at: 1080,  type: "to_patient", note: "1× Poole Suction → bulk fluid evacuation post-osteotomy", frame: "/videos/cam1-overhead.mp4#t=12" },
    { at: 4800,  type: "to_patient", note: "1× Poole Suction → pulse-lavage runoff capture", frame: "/videos/cam1-overhead.mp4#t=19" },
  ],
  "INS-051": [
    { at: -1099, type: "baseline", note: "Initial: 2 Knife Handles #3 on mayo", frame: "/videos/cam2-sterile.mp4#t=21" },
    { at: -30,   type: "to_patient", note: "1× Knife Handle #3 (with #10 blade) → skin incision", frame: "/videos/cam1-overhead.mp4#t=2" },
    { at: 360,   type: "to_mayo", note: "1× Knife Handle #3 ← returned to mayo", frame: "/videos/cam2-sterile.mp4#t=22" },
  ],
  "INS-052": [
    { at: -1099, type: "baseline", note: "Initial: 2 Knife Handles #7 on mayo", frame: "/videos/cam2-sterile.mp4#t=21" },
    { at: 540,   type: "to_patient", note: "1× Knife Handle #7 (with #15 blade) → fine dissection", frame: "/videos/cam1-overhead.mp4#t=4" },
    { at: 720,   type: "to_mayo", note: "1× Knife Handle #7 ← returned to mayo", frame: "/videos/cam2-sterile.mp4#t=22" },
  ],
  "INS-053": [{ at: -1080, type: "baseline", note: "Initial: 1 Ruler on back table", frame: "/videos/cam3-backtable.mp4#t=27" }],
  "INS-054": [
    { at: -1080, type: "baseline", note: "Initial: 1 Mallet on back table", frame: "/videos/cam3-backtable.mp4#t=27" },
    { at: 1080,  type: "to_mayo", note: "1× Mallet ← pulled (femoral neck osteotomy)", frame: "/videos/cam2-sterile.mp4#t=27" },
    { at: 1140,  type: "to_patient", note: "1× Mallet → driving osteotome through femoral neck", frame: "/videos/cam1-overhead.mp4#t=13" },
    { at: 2700,  type: "to_patient", note: "1× Mallet → impacting acetabular cup", frame: "/videos/cam1-overhead.mp4#t=14" },
    { at: 3000,  type: "to_patient", note: "1× Mallet → broaching femoral canal", frame: "/videos/cam1-overhead.mp4#t=15" },
    { at: 4500,  type: "to_patient", note: "1× Mallet → final head impaction", frame: "/videos/cam1-overhead.mp4#t=18" },
    { at: 4800,  type: "to_back", note: "1× Mallet ← back to table", frame: "/videos/cam3-backtable.mp4#t=29" },
  ],
  "INS-055": [{ at: -1080, type: "baseline", note: "Initial: 1 Stille Rongeur on back table", frame: "/videos/cam3-backtable.mp4#t=28" }],
  "INS-056": [
    { at: -1080, type: "baseline", note: "Initial: 1 Stille Luer Rongeur on back table", frame: "/videos/cam3-backtable.mp4#t=28" },
    { at: 2880,  type: "to_mayo", note: "1× Stille Luer Rongeur ← pulled (cleaning canal)", frame: "/videos/cam2-sterile.mp4#t=28" },
    { at: 3000,  type: "to_patient", note: "1× Stille Luer Rongeur → trimming femoral calcar", frame: "/videos/cam1-overhead.mp4#t=15" },
    { at: 3180,  type: "to_back", note: "1× Stille Luer Rongeur ← back to table", frame: "/videos/cam3-backtable.mp4#t=29" },
  ],
  "INS-057": [{ at: -1080, type: "baseline", note: "Initial: 1 Caspar Rongeur on back table", frame: "/videos/cam3-backtable.mp4#t=29" }],
  "INS-058": [
    { at: -1080, type: "baseline", note: "Initial: 1 Leksell Rongeur on back table", frame: "/videos/cam3-backtable.mp4#t=30" },
    { at: 1620,  type: "to_mayo", note: "1× Leksell Rongeur ← pulled (acetabular rim trim)", frame: "/videos/cam2-sterile.mp4#t=29" },
    { at: 1740,  type: "to_patient", note: "1× Leksell Rongeur → acetabular rim debridement", frame: "/videos/cam1-overhead.mp4#t=14" },
    { at: 1980,  type: "to_back", note: "1× Leksell Rongeur ← back to table", frame: "/videos/cam3-backtable.mp4#t=31" },
  ],
  "INS-059": [
    { at: -1080, type: "baseline", note: "Initial: 1 Bone Cutter on back table", frame: "/videos/cam3-backtable.mp4#t=30" },
    { at: 1080,  type: "to_mayo", note: "1× Bone Cutter ← pulled (femoral neck osteotomy)", frame: "/videos/cam2-sterile.mp4#t=30" },
    { at: 1140,  type: "to_patient", note: "1× Bone Cutter → femoral neck osteotomy with mallet", frame: "/videos/cam1-overhead.mp4#t=13" },
    { at: 1380,  type: "to_back", note: "1× Bone Cutter ← back to table (osteotomy complete)", frame: "/videos/cam3-backtable.mp4#t=32" },
  ],
  "INS-060": [
    { at: -1080, type: "baseline", note: "Initial: 1 Bone Tamp on back table", frame: "/videos/cam3-backtable.mp4#t=31" },
    { at: 2700,  type: "to_mayo", note: "1× Bone Tamp ← pulled (acetabular cup impaction)", frame: "/videos/cam2-sterile.mp4#t=31" },
    { at: 2820,  type: "to_patient", note: "1× Bone Tamp → seating acetabular cup", frame: "/videos/cam1-overhead.mp4#t=14" },
    { at: 3060,  type: "to_back", note: "1× Bone Tamp ← back to table", frame: "/videos/cam3-backtable.mp4#t=33" },
  ],
  "INS-061": [
    { at: -1080, type: "baseline", note: "Initial: 1 Bone Rasp on back table", frame: "/videos/cam3-backtable.mp4#t=31" },
    { at: 2880,  type: "to_mayo", note: "1× Bone Rasp ← pulled (femoral broaching)", frame: "/videos/cam2-sterile.mp4#t=31" },
    { at: 3000,  type: "to_patient", note: "1× Bone Rasp → femoral canal preparation", frame: "/videos/cam1-overhead.mp4#t=15" },
    { at: 3300,  type: "to_back", note: "1× Bone Rasp ← back to table", frame: "/videos/cam3-backtable.mp4#t=33" },
  ],
  "INS-062": [{ at: -1080, type: "baseline", note: "Initial: 1 Ruskin Rongeur on back table", frame: "/videos/cam3-backtable.mp4#t=32" }],
  "INS-063": [{ at: -1080, type: "baseline", note: "Initial: 1 Pin Cutter on back table", frame: "/videos/cam3-backtable.mp4#t=33" }],
  "INS-064": [{ at: -1080, type: "baseline", note: "Initial: 1 Wire Cutter on back table", frame: "/videos/cam3-backtable.mp4#t=33" }],
};

// ═══════════════════════════════════════════════════════════
// 6. SYSTEM EVENTS — room-level events (offsets in seconds)
// ═══════════════════════════════════════════════════════════
export const SYSTEM_EVENTS = [
  { at: -2071, phase: 0, text: "→ OR Setup", type: "phase" },
  { at: -2071, phase: 0, text: "System operational — 4 cameras online", type: "info" },
  { at: -2071, phase: 0, text: "OR Setup — 4 staff entered, Major Bone Set + implant trays prepared", type: "info" },
  { at: -1099, phase: 1, text: "→ Initial Count (Safety Gate)", type: "phase" },
  { at: -1099, phase: 1, text: "Initial Count — Mayo Stand: 41 pcs / 23 types", type: "gate" },
  { at: -1039, phase: 1, text: "Initial Count — Back Table: 56 pcs / 53 types", type: "gate" },
  { at: -859,  phase: 1, text: "Count BALANCED ✓ — 97/97 (Mayo 41 + Back Table 56)", type: "ok" },
  { at: -835,  phase: 2, text: "→ Patient In", type: "phase" },
  { at: -835,  phase: 2, text: "Patient positioned lateral decubitus, ID & site verified (Right hip)", type: "info" },
  { at: -715,  phase: 3, text: "→ Anesthesia", type: "phase" },
  { at: -715,  phase: 3, text: "Spinal anesthesia placed; sedation titrated", type: "info" },
  { at: -190,  phase: 4, text: "→ Time Out (Safety Gate)", type: "phase" },
  { at: -190,  phase: 4, text: "Time Out — 4/4 verbal confirms: patient, RIGHT hip, THA, consent", type: "gate" },
  { at: 0,     phase: 5, text: "→ Procedure", type: "phase" },
  { at: 0,     phase: 5, text: "Skin incision — posterolateral approach to right hip", type: "info" },
  { at: 360,   phase: 5, text: "IT band split — gluteus maximus retracted", type: "info" },
  { at: 600,   phase: 5, text: "Short external rotators tagged & released; capsule exposed", type: "info" },
  { at: 720,   phase: 5, text: "Capsulotomy complete — femoral head visualized", type: "info" },
  { at: 1080,  phase: 5, text: "Femoral neck osteotomy — using bone cutter + mallet", type: "info" },
  { at: 1380,  phase: 5, text: "Femoral head extracted via bone hook — sized 52mm", type: "info" },
  { at: 1560,  phase: 5, text: "⚠ SPG-003 Raytec drop detected — floor zone", type: "warn" },
  { at: 1560,  phase: 5, text: "SPG-003 Raytec recovered → sterile field", type: "ok" },
  { at: 1740,  phase: 5, text: "Acetabular reaming begun — Bruns curettes #0 → #4 progression", type: "info" },
  { at: 1800,  phase: 5, text: "Running count at 30 min — all items balanced (97/97)", type: "gate" },
  { at: 2400,  phase: 5, text: "Acetabular trial cup placed — fit assessed", type: "info" },
  { at: 2700,  phase: 5, text: "Final acetabular cup impacted — 54mm with bone tamp", type: "info" },
  { at: 2880,  phase: 5, text: "Femoral canal preparation — broaching with bone rasp", type: "info" },
  { at: 3300,  phase: 5, text: "Femoral trial reduction — leg length & offset verified", type: "info" },
  { at: 3600,  phase: 5, text: "PAK-001 Bone Cement Mix Pack opened — cement preparation", type: "info" },
  { at: 3600,  phase: 5, text: "Running count at 60 min — all items balanced (97/97)", type: "gate" },
  { at: 3900,  phase: 5, text: "Femoral stem cemented in place — distal cement plug seated", type: "info" },
  { at: 4200,  phase: 5, text: "Femoral head trial selected — 32mm +0 neck length", type: "info" },
  { at: 4500,  phase: 5, text: "Final reduction — head impacted onto trunnion", type: "info" },
  { at: 4680,  phase: 5, text: "⚠ Minor bleeder detected — gluteal artery branch", type: "warn" },
  { at: 4740,  phase: 5, text: "Bleeder controlled — bipolar cautery applied", type: "ok" },
  { at: 4800,  phase: 5, text: "PAK-002 Pulse Lavage opened — joint irrigation", type: "info" },
  { at: 5100,  phase: 5, text: "Range of motion check — stable in 90° flexion + IR", type: "info" },
  { at: 5340,  phase: 5, text: "EBL update: 320cc — within acceptable range, no transfusion", type: "info" },
  { at: 5340,  phase: 5, text: "PAK-003 Hemovac drain pack opened — drain prep", type: "info" },
  { at: 5400,  phase: 6, text: "→ Pre-Close Count (Safety Gate)", type: "phase" },
  { at: 5400,  phase: 6, text: "Pre-closure count initiated — verifying all zones", type: "gate" },
  { at: 5520,  phase: 6, text: "Mayo Stand count: 41 items verified", type: "gate" },
  { at: 5640,  phase: 6, text: "Back Table count: 56 items verified", type: "gate" },
  { at: 5760,  phase: 6, text: "Waste & Disposed count: all accounted", type: "gate" },
  { at: 5820,  phase: 6, text: "Patient zone verified — 0 retained items", type: "gate" },
  { at: 5880,  phase: 7, text: "→ Count Resolution (Safety Gate)", type: "phase" },
  { at: 5880,  phase: 7, text: "Count resolution — comparing all zones against baseline", type: "gate" },
  { at: 5940,  phase: 7, text: "Count BALANCED ✓ — 97/97 (all zones reconciled)", type: "ok" },
  { at: 6000,  phase: 8, text: "→ Surgeon Decision", type: "phase" },
  { at: 6000,  phase: 8, text: "Surgeon reviewing implant position — fluoroscopy if needed", type: "info" },
  { at: 6060,  phase: 8, text: "Surgeon satisfied — closure approved", type: "ok" },
  { at: 6120,  phase: 9, text: "→ Closure", type: "phase" },
  { at: 6120,  phase: 9, text: "Hemovac drain placed in deep tissue — closure initiated", type: "info" },
  { at: 6480,  phase: 9, text: "Posterior capsule repaired — Ethibond #5 sutures", type: "info" },
  { at: 6900,  phase: 9, text: "IT band / fascia repaired — Vicryl 2-0", type: "info" },
  { at: 7080,  phase: 9, text: "Subcutaneous closure — interrupted SH sutures", type: "info" },
  { at: 7500,  phase: 9, text: "Skin closure complete — staples applied", type: "info" },
  { at: 7800,  phase: 9, text: "Sterile dressing applied — drain secured", type: "info" },
  { at: 7920,  phase: 10, text: "→ Final Count (Safety Gate)", type: "phase" },
  { at: 7920,  phase: 10, text: "Final count initiated — all categories", type: "gate" },
  { at: 8040,  phase: 10, text: "Sponges: 20/20 ✓ | Needles: 14/14 ✓ | Sharps: 11/11 ✓", type: "gate" },
  { at: 8160,  phase: 10, text: "Instruments: 49/49 ✓ | Disposables: 3/3 ✓", type: "gate" },
  { at: 8220,  phase: 10, text: "Final count BALANCED ✓ — 97/97 all categories", type: "ok" },
  { at: 8280,  phase: 11, text: "→ Emergence", type: "phase" },
  { at: 8280,  phase: 11, text: "Spinal block monitoring — sensation returning per dermatome", type: "info" },
  { at: 8520,  phase: 11, text: "Patient alert and oriented — vitals stable", type: "info" },
  { at: 8700,  phase: 11, text: "Patient transferred to bed — log-roll precautions for hip", type: "ok" },
  { at: 8880,  phase: 12, text: "→ Patient Out", type: "phase" },
  { at: 8880,  phase: 12, text: "Hip precautions reviewed with PACU team — abductor pillow placed", type: "info" },
  { at: 8940,  phase: 12, text: "Handoff to PACU nurse — implant info & hip precautions noted", type: "info" },
  { at: 9000,  phase: 12, text: "Patient out of OR — en route to recovery", type: "ok" },
  { at: 9060,  phase: 13, text: "→ Turnover", type: "phase" },
  { at: 9060,  phase: 13, text: "Room turnover initiated — cleaning protocol started", type: "info" },
  { at: 9600,  phase: 13, text: "Instruments collected — sent to SPD for reprocessing", type: "info" },
  { at: 10200, phase: 13, text: "Room cleaned and disinfected — surfaces wiped", type: "info" },
  { at: 10500, phase: 13, text: "Room ready for next case", type: "ok" },
  { at: 10560, phase: 14, text: "→ Idle — room available", type: "phase" },
];

// ═══════════════════════════════════════════════════════════
// 7. LIVE EVENTS — appear during procedure as time passes
//    These extend SYSTEM_EVENTS in real-time (Total Hip Arthroplasty)
// ═══════════════════════════════════════════════════════════
export const LIVE_EVENTS = [
  // ── Phase 5: Procedure (0–5400s) — THA workflow ──
  { at: 30,   text: "INS-051 Knife Handle #3 (with #10 blade) → patient (skin incision)", type: "info", itemId: "INS-051" },
  { at: 60,   text: "SHP-001 Blade #10 → skin incision", type: "info", itemId: "SHP-001" },
  { at: 90,   text: "INS-026 Adson Forceps → patient (fine skin handling)", type: "info", itemId: "INS-026" },
  { at: 180,  text: "INS-017 Mayo Scissors Straight → patient (subcutaneous division)", type: "info", itemId: "INS-017" },
  { at: 240,  text: "INS-029 Army Navy Retractors → patient (subcutaneous retraction)", type: "info", itemId: "INS-029" },
  { at: 300,  text: "Subcutaneous fat divided — IT band exposed", type: "info" },
  { at: 360,  text: "INS-018 Mayo Scissors Curved → IT band division", type: "info", itemId: "INS-018" },
  { at: 420,  text: "INS-052 Knife Handle #7 (with #15 blade) → fine fascial dissection", type: "info", itemId: "INS-052" },
  { at: 480,  text: "INS-019 Metzenbaum Scissors → patient (rotators dissection)", type: "info", itemId: "INS-019" },
  { at: 540,  text: "INS-030 Volkmann Sharp Retractors → patient (deep retraction)", type: "info", itemId: "INS-030" },
  { at: 600,  text: "Short external rotators tagged with Ethibond #5", type: "info" },
  { at: 660,  text: "INS-006 Allis Forceps → patient (capsule grasping)", type: "info", itemId: "INS-006" },
  { at: 720,  text: "SHP-003 Blade #20 → capsulotomy", type: "info", itemId: "SHP-003" },
  { at: 780,  text: "INS-032 Weitlaner Sharp Retractor → self-retaining at fascia", type: "info", itemId: "INS-032" },
  { at: 900,  text: "INS-038 Freer Elevator → patient (capsule release)", type: "info", itemId: "INS-038" },
  { at: 1080, text: "Capsulotomy complete — femoral head fully visualized", type: "info" },
  { at: 1140, text: "INS-059 Bone Cutter + INS-054 Mallet → femoral neck osteotomy", type: "info", itemId: "INS-059" },
  { at: 1200, text: "INS-013 Lewin Bone Clamp → femoral neck stabilization", type: "info", itemId: "INS-013" },
  { at: 1380, text: "INS-048 Bone Hook → femoral head extraction", type: "info", itemId: "INS-048" },
  { at: 1440, text: "Femoral head extracted — measured 52mm, sent to back table", type: "info" },
  { at: 1500, text: "SPG-001 Lap Sponge → packing acetabulum", type: "info", itemId: "SPG-001" },
  { at: 1560, text: "⚠ SPG-003 Raytec drop detected — floor zone, CAM-1", type: "warn", itemId: "SPG-003" },
  { at: 1580, text: "SPG-003 Raytec recovered → returned to mayo stand", type: "ok", itemId: "SPG-003" },
  { at: 1620, text: "INS-058 Leksell Rongeur → acetabular rim debridement", type: "info", itemId: "INS-058" },
  { at: 1740, text: "INS-035 Kelly Retractors → patient (acetabular exposure)", type: "info", itemId: "INS-035" },
  { at: 1800, text: "Running count at 30 min — all items balanced (97/97)", type: "gate" },
  { at: 1860, text: "INS-043 Bruns Curette #0 → acetabular floor cleaning", type: "info", itemId: "INS-043" },
  { at: 2040, text: "INS-044 Bruns Curette #1 → acetabular reaming", type: "info", itemId: "INS-044" },
  { at: 2220, text: "INS-045 Bruns Curette #2 → acetabular reaming progression", type: "info", itemId: "INS-045" },
  { at: 2400, text: "Acetabular trial cup placed — 54mm, fit confirmed", type: "info" },
  { at: 2460, text: "SHP-005 Drill bit 3.2mm → cup screw pilot hole", type: "info", itemId: "SHP-005" },
  { at: 2580, text: "EBL update: 240cc — within expected range", type: "info" },
  { at: 2700, text: "SHP-004 K-wire → cup positioning reference", type: "info", itemId: "SHP-004" },
  { at: 2820, text: "INS-060 Bone Tamp + INS-054 Mallet → cup impaction", type: "info", itemId: "INS-060" },
  { at: 2880, text: "Final acetabular cup seated — 54mm porous-coated", type: "ok" },
  { at: 3000, text: "INS-056 Stille Luer Rongeur → trimming femoral calcar", type: "info", itemId: "INS-056" },
  { at: 3060, text: "INS-061 Bone Rasp → femoral canal preparation", type: "info", itemId: "INS-061" },
  { at: 3300, text: "Femoral broaching complete — size 12 broach in place", type: "info" },
  { at: 3360, text: "Trial reduction performed — leg length & offset assessed", type: "info" },
  { at: 3540, text: "Trial implant removed — preparing for cementation", type: "info" },
  { at: 3600, text: "Running count at 60 min — all items balanced (97/97)", type: "gate" },
  { at: 3660, text: "PAK-001 Bone Cement Mix Pack opened — preparing PMMA", type: "info", itemId: "PAK-001" },
  { at: 3780, text: "Cement reaching doughy phase — femoral canal cleaned", type: "info" },
  { at: 3900, text: "Cement injected into femoral canal — distal plug seated", type: "info" },
  { at: 3960, text: "Definitive femoral stem implanted — held in correct version", type: "ok" },
  { at: 4140, text: "Cement set — stem stable, awaiting final reduction", type: "info" },
  { at: 4200, text: "Final femoral head selected — 32mm, +0 neck length", type: "info" },
  { at: 4380, text: "INS-054 Mallet → final head impaction onto trunnion", type: "info", itemId: "INS-054" },
  { at: 4500, text: "Final reduction complete — joint stable", type: "ok" },
  { at: 4620, text: "Hip ROM check: 90° flexion + IR, no impingement", type: "info" },
  { at: 4680, text: "⚠ Minor bleeder — gluteal artery branch", type: "warn" },
  { at: 4740, text: "Bleeder controlled — bipolar cautery, hemostasis confirmed", type: "ok" },
  { at: 4800, text: "PAK-002 Pulse Lavage opened — joint irrigation 2L", type: "info", itemId: "PAK-002" },
  { at: 4980, text: "INS-050 Poole Suction → fluid evacuation", type: "info", itemId: "INS-050" },
  { at: 5100, text: "ROM final check: stable in flexion, extension, IR, ER", type: "info" },
  { at: 5220, text: "Capsule repaired with NDL-004 Ethibond #5", type: "info", itemId: "NDL-004" },
  { at: 5340, text: "PAK-003 Hemovac drain pack opened — drain prep", type: "info", itemId: "PAK-003" },
  // ── Phase 6: Pre-Close Count (5400–5880s) ──
  { at: 5400, text: "→ Pre-Close Count — safety gate initiated", type: "phase" },
  { at: 5430, text: "Counting Mayo Stand — sponges, needles, sharps", type: "gate" },
  { at: 5490, text: "Mayo Stand — all sponges accounted (20/20)", type: "ok" },
  { at: 5520, text: "Mayo Stand — all needles accounted (14/14)", type: "ok" },
  { at: 5550, text: "Mayo Stand — all sharps accounted (3/3)", type: "ok" },
  { at: 5580, text: "Mayo Stand — instruments verified (41 items)", type: "ok" },
  { at: 5640, text: "Back Table — all items verified (56 items)", type: "ok" },
  { at: 5700, text: "Waste zone — disposed items cross-referenced with count sheet", type: "gate" },
  { at: 5760, text: "Patient zone — verified clear, 0 retained items", type: "ok" },
  { at: 5820, text: "All zones verified — count data submitted for resolution", type: "gate" },
  // ── Phase 7: Count Resolution (5880–6000s) ──
  { at: 5880, text: "→ Count Resolution — comparing totals against baseline", type: "phase" },
  { at: 5910, text: "Sponges: 20 initial, 20 accounted ✓", type: "ok" },
  { at: 5930, text: "Needles: 14 initial, 14 accounted ✓", type: "ok" },
  { at: 5950, text: "Sharps: 11 initial, 11 accounted ✓", type: "ok" },
  { at: 5970, text: "Instruments: 49 initial, 49 accounted ✓", type: "ok" },
  { at: 5990, text: "Count BALANCED — 97/97 total, all categories reconciled", type: "ok" },
  // ── Phase 8: Surgeon Decision (6000–6120s) ──
  { at: 6000, text: "→ Surgeon Decision — reviewing implant position", type: "phase" },
  { at: 6030, text: "Physician C confirms cup orientation and femoral version", type: "info" },
  { at: 6060, text: "Implant position satisfactory — closure approved", type: "ok" },
  { at: 6090, text: "Closure plan: capsule, fascia/IT band, subq, skin staples", type: "info" },
  // ── Phase 9: Closure (6120–7920s) ──
  { at: 6120, text: "→ Closure — beginning layered closure", type: "phase" },
  { at: 6180, text: "Hemovac drain placed in deep tissue — secured", type: "info" },
  { at: 6300, text: "INS-014 Mayo Hegar TC NH 18cm → fascial closure", type: "info", itemId: "INS-014" },
  { at: 6420, text: "Posterior capsule reapproximated — 4× Ethibond #5 figure-of-eight", type: "info" },
  { at: 6480, text: "NDL-004 Ethibond #5 → posterior capsule repair", type: "info", itemId: "NDL-004" },
  { at: 6720, text: "IT band / fascia closed — Vicryl 2-0 interrupted", type: "info" },
  { at: 6900, text: "NDL-003 Vicryl 2-0 (CT-2) → IT band repair complete", type: "info", itemId: "NDL-003" },
  { at: 7080, text: "INS-015 Crile Wood TC NH → subcutaneous closure", type: "info", itemId: "INS-015" },
  { at: 7200, text: "Subcutaneous layer complete — SH sutures placed", type: "info" },
  { at: 7320, text: "NDL-002 SH suture needles → sharps container", type: "info", itemId: "NDL-002" },
  { at: 7500, text: "Skin closure with staples — 28 staples applied", type: "info" },
  { at: 7620, text: "Drain site secured — 3-0 nylon suture", type: "info" },
  { at: 7740, text: "Sterile dressing applied — drain functional", type: "info" },
  { at: 7860, text: "Sterile drape removed — wound care complete", type: "info" },
  // ── Phase 10: Final Count (7920–8280s) ──
  { at: 7920, text: "→ Final Count — all categories, post-closure verification", type: "phase" },
  { at: 7980, text: "Final count — sponges: 20/20 ✓", type: "ok" },
  { at: 8010, text: "Final count — needles: 14/14 ✓", type: "ok" },
  { at: 8040, text: "Final count — sharps: 11/11 ✓", type: "ok" },
  { at: 8070, text: "Final count — instruments: 49/49 ✓", type: "ok" },
  { at: 8100, text: "Final count — disposables: 3/3 ✓", type: "ok" },
  { at: 8160, text: "FINAL COUNT BALANCED ✓ — 97/97, all categories verified", type: "ok" },
  { at: 8220, text: "Count documentation complete — signed by Scrub Tech and Circulator", type: "gate" },
  // ── Phase 11: Emergence (8280–8880s) ──
  { at: 8280, text: "→ Emergence — spinal block monitoring", type: "phase" },
  { at: 8340, text: "Sedation lifted — patient regaining alertness", type: "info" },
  { at: 8460, text: "Vitals stable — BP 128/76, HR 70, SpO2 98%", type: "info" },
  { at: 8520, text: "Patient responsive — log-roll precautions briefed", type: "info" },
  { at: 8640, text: "Abductor pillow placed between knees", type: "ok" },
  { at: 8700, text: "Patient transferred to bed — hip precautions maintained", type: "ok" },
  { at: 8760, text: "Post-op vitals: BP 124/74, HR 72, SpO2 98%, RR 14", type: "info" },
  { at: 8820, text: "Pain score 2/10 — spinal block still effective", type: "ok" },
  // ── Phase 12: Patient Out (8880–9060s) ──
  { at: 8880, text: "→ Patient Out — transfer to recovery", type: "phase" },
  { at: 8910, text: "Patient moved with hip precautions — log-roll technique", type: "info" },
  { at: 8940, text: "Monitors transferred — continuous SpO2, ECG, BP", type: "info" },
  { at: 8970, text: "PACU handoff — implant info & precautions noted", type: "info" },
  { at: 9000, text: "Patient out of OR — procedure duration: 1h 30min, EBL 320cc", type: "ok" },
  { at: 9030, text: "Operative note dictated — implant log entered", type: "info" },
  // ── Phase 13: Turnover (9060–10560s) ──
  { at: 9060, text: "→ Turnover — room reset initiated", type: "phase" },
  { at: 9120, text: "Drapes and disposables removed — biohazard bags sealed", type: "info" },
  { at: 9240, text: "Instruments collected from mayo stand — placed in transport trays", type: "info" },
  { at: 9360, text: "Back table instruments collected — all 56 items accounted", type: "info" },
  { at: 9480, text: "Instrument trays sent to SPD for decontamination and reprocessing", type: "info" },
  { at: 9600, text: "Sharps containers sealed and replaced", type: "info" },
  { at: 9720, text: "OR table wiped down — enzymatic cleaner applied", type: "info" },
  { at: 9840, text: "All horizontal surfaces cleaned — EPA-registered disinfectant", type: "info" },
  { at: 9960, text: "Floor mopped — working from clean to dirty zones", type: "info" },
  { at: 10080, text: "Equipment wiped and repositioned for next case", type: "info" },
  { at: 10200, text: "Fresh linens and drapes staged — new case setup beginning", type: "info" },
  { at: 10320, text: "Supply restock complete — sutures, sponges, gloves replenished", type: "info" },
  { at: 10440, text: "Room inspection complete — turnover verified by charge nurse", type: "ok" },
  { at: 10560, text: "Room ready for next case — turnover time: 25 min", type: "ok" },
];
export const TRANSCRIPTION = {
  // Pre-procedure (static — always shown)
  static: [
    { at: -2071, speaker: "System",      text: "Audio capture started — 2 microphones active", type: "sys" },
    { at: -2071, speaker: "Circulator",  text: "Good morning everyone, we're setting up for the right total hip arthroplasty.", type: "speech" },
    { at: -1951, speaker: "Scrub Tech",  text: "Major Bone Set is open. Starting the instrument count.", type: "speech" },
    { at: -1099, speaker: "Scrub Tech",  text: "Initial count: 97 pieces across 76 types — Major Bone Set + consumables.", type: "speech" },
    { at: -859,  speaker: "Circulator",  text: "Count is balanced. 97 out of 97. Documented.", type: "speech" },
    { at: -835,  speaker: "Circulator",  text: "Patient is in the room. Lateral decubitus on the bean bag, right side up.", type: "speech" },
    { at: -750,  speaker: "Anesthesia",  text: "Spinal block placed. Sedation titrated. Patient is comfortable.", type: "speech" },
    { at: -715,  speaker: "Anesthesia",  text: "Patient ready. Vitals stable. You can prep when you're ready.", type: "speech" },
    { at: -600,  speaker: "Scrub Tech",  text: "Prep and drape complete. Ready for time out.", type: "speech" },
    { at: -190,  speaker: "Circulator",  text: "Time out. Patient is M-S-, 68-year-old male. Mr. S confirmed.", type: "speech" },
    { at: -180,  speaker: "Physician C", text: "Confirmed. Right total hip arthroplasty, posterolateral approach.", type: "speech" },
    { at: -170,  speaker: "Anesthesia",  text: "Spinal anesthesia, no allergies. Cefazolin given 30 min ago.", type: "speech" },
    { at: -160,  speaker: "Scrub Tech",  text: "All counts verified. 97 of 97. Implant trays staged.", type: "speech" },
    { at: -150,  speaker: "Physician C", text: "Anything else? Going to incision.", type: "speech" },
    { at: -140,  speaker: "All",         text: "Time out complete.", type: "speech" },
  ],

  // Live transcription (appears as time progresses during procedure)
  live: [
    { at: 0,    speaker: "Physician C", text: "Knife.", type: "speech" },
    { at: 5,    speaker: "Scrub Tech",  text: "Knife handle three with ten blade.", type: "speech" },
    { at: 30,   speaker: "Physician C", text: "Posterolateral incision, 12cm. Centered over greater trochanter.", type: "speech" },
    { at: 60,   speaker: "Physician C", text: "Bovie. Down through subcutaneous fat.", type: "speech" },
    { at: 120,  speaker: "Physician C", text: "Army-Navy retractors. Let's identify the IT band.", type: "speech" },
    { at: 180,  speaker: "Physician D", text: "There's the IT band. Nice white tendinous tissue.", type: "speech" },
    { at: 240,  speaker: "Physician C", text: "Mayo scissors curved. Splitting along the fibers.", type: "speech" },
    { at: 360,  speaker: "Physician C", text: "Good split. Now we'll find the gluteus maximus.", type: "speech" },
    { at: 420,  speaker: "Physician D", text: "Glutes are retracting nicely. Short rotators are visible.", type: "speech" },
    { at: 480,  speaker: "Physician C", text: "Metzenbaum. Tag the rotators with Ethibond #5 before we release.", type: "speech" },
    { at: 540,  speaker: "Scrub Tech",  text: "Ethibond on a CT-1.", type: "speech" },
    { at: 600,  speaker: "Physician C", text: "Tagging piriformis and short externals. We'll repair these later.", type: "speech" },
    { at: 660,  speaker: "Physician C", text: "Good tags. Now release the rotators off the trochanter.", type: "speech" },
    { at: 720,  speaker: "Physician C", text: "Capsule exposed. Let's open it. Knife handle, 20 blade.", type: "speech" },
    { at: 780,  speaker: "Physician C", text: "Capsulotomy — T-shape. Let's see the head.", type: "speech" },
    { at: 900,  speaker: "Physician C", text: "Allis on each capsule corner. Pull them out of the way.", type: "speech" },
    { at: 1020, speaker: "Physician D", text: "Capsule's open. Femoral head is right there.", type: "speech" },
    { at: 1080, speaker: "Physician C", text: "Beautiful. Let's mark the neck cut. Bone cutter and mallet.", type: "speech" },
    { at: 1140, speaker: "Physician C", text: "Lewin clamp on the trochanter to stabilize.", type: "speech" },
    { at: 1200, speaker: "Physician C", text: "Saw cut along the marked line. Two-finger breadth above the lesser troch.", type: "speech" },
    { at: 1300, speaker: "Physician C", text: "Cut's complete. Bone hook to deliver the head.", type: "speech" },
    { at: 1380, speaker: "Physician C", text: "Head is out. Looks like 52mm. Send it to the table.", type: "speech" },
    { at: 1440, speaker: "Scrub Tech",  text: "Femoral head measured 52mm. Good size match.", type: "speech" },
    { at: 1500, speaker: "Physician C", text: "Lap sponge in the acetabulum while we expose.", type: "speech" },
    { at: 1560, speaker: "Circulator",  text: "Heads up — we have a Raytec on the floor. Tracking it.", type: "speech" },
    { at: 1580, speaker: "Scrub Tech",  text: "Raytec recovered, returned to mayo. No contamination — bagged.", type: "speech" },
    { at: 1620, speaker: "Physician C", text: "Leksell rongeur. Trim the labrum off the rim.", type: "speech" },
    { at: 1740, speaker: "Physician C", text: "Kelly retractors. Let's expose the acetabulum properly.", type: "speech" },
    { at: 1800, speaker: "Circulator",  text: "Running count at 30 min. All items balanced — 97 of 97.", type: "speech" },
    { at: 1860, speaker: "Physician C", text: "Bruns curette zero. Clean out the floor.", type: "speech" },
    { at: 1980, speaker: "Physician C", text: "Now reaming. Start with size 48 reamer.", type: "speech" },
    { at: 2040, speaker: "Scrub Tech",  text: "48 reamer on the driver.", type: "speech" },
    { at: 2160, speaker: "Physician C", text: "Going up through 50, 52, 54.", type: "speech" },
    { at: 2280, speaker: "Physician D", text: "Subchondral bleeding looks good — we're at viable bone.", type: "speech" },
    { at: 2400, speaker: "Physician C", text: "Stop at 54. Let's trial the cup.", type: "speech" },
    { at: 2460, speaker: "Scrub Tech",  text: "54mm trial cup.", type: "speech" },
    { at: 2520, speaker: "Physician C", text: "Press fit feels solid. Good 40-degree abduction, 15-degree anteversion.", type: "speech" },
    { at: 2640, speaker: "Physician C", text: "Open the 54 porous cup. Let's go to definitive.", type: "speech" },
    { at: 2700, speaker: "Physician C", text: "Cup impactor and mallet.", type: "speech" },
    { at: 2820, speaker: "Physician C", text: "Tapping it home. Three quick taps... seated.", type: "speech" },
    { at: 2880, speaker: "Physician C", text: "Cup is in. Solid press fit. Liner — neutral 32mm.", type: "speech" },
    { at: 2940, speaker: "Scrub Tech",  text: "Neutral 32mm liner ready.", type: "speech" },
    { at: 3000, speaker: "Physician C", text: "Now the femur. Box osteotome to start the canal.", type: "speech" },
    { at: 3060, speaker: "Physician C", text: "Stille Luer rongeur — trim the calcar a touch.", type: "speech" },
    { at: 3120, speaker: "Physician C", text: "Broaching now. Start small and work up.", type: "speech" },
    { at: 3240, speaker: "Physician C", text: "Size 10 broach. Then 11... 12.", type: "speech" },
    { at: 3300, speaker: "Physician C", text: "Size 12 feels rotationally stable. Trial reduction.", type: "speech" },
    { at: 3360, speaker: "Physician D", text: "Trial head, 32mm plus zero. Let's check leg lengths.", type: "speech" },
    { at: 3420, speaker: "Physician C", text: "Reduce. Range of motion — 90 of flexion, IR is fine.", type: "speech" },
    { at: 3480, speaker: "Physician D", text: "Leg lengths look equal. No telescoping.", type: "speech" },
    { at: 3540, speaker: "Physician C", text: "Good. Dislocate. We'll cement the size 12 stem.", type: "speech" },
    { at: 3600, speaker: "Circulator",  text: "Running count at 60 min — 97 of 97. All balanced.", type: "speech" },
    { at: 3660, speaker: "Scrub Tech",  text: "Opening the cement. Mixing now — start your timer.", type: "speech" },
    { at: 3780, speaker: "Physician C", text: "Doughy stage. Let's pulse-lavage and dry the canal.", type: "speech" },
    { at: 3900, speaker: "Physician C", text: "Cement gun in. Retrograde fill, holding pressure.", type: "speech" },
    { at: 3960, speaker: "Physician C", text: "Stem in. Hold it neutral... fifteen of anteversion.", type: "speech" },
    { at: 4080, speaker: "Physician D", text: "Cement is setting. Stem is steady.", type: "speech" },
    { at: 4140, speaker: "Physician C", text: "Cement set. Trim the excess at the calcar.", type: "speech" },
    { at: 4200, speaker: "Physician C", text: "Final head. 32mm plus zero, taper engaged.", type: "speech" },
    { at: 4380, speaker: "Physician C", text: "Mallet — impacting onto the trunnion.", type: "speech" },
    { at: 4500, speaker: "Physician C", text: "Reduce the hip. Smooth.", type: "speech" },
    { at: 4560, speaker: "Physician D", text: "Joint is stable. Good range of motion.", type: "speech" },
    { at: 4620, speaker: "Physician C", text: "Stress it — flexion to 90, IR to 30. No impingement, no instability.", type: "speech" },
    { at: 4680, speaker: "Physician C", text: "Bleeder. Gluteal artery branch — bovie please.", type: "speech" },
    { at: 4740, speaker: "Physician C", text: "Got it. Bipolar. Hemostasis confirmed.", type: "speech" },
    { at: 4800, speaker: "Physician C", text: "Pulse lavage — irrigate the joint thoroughly.", type: "speech" },
    { at: 4980, speaker: "Physician D", text: "Suction — Poole tip, please.", type: "speech" },
    { at: 5100, speaker: "Physician C", text: "Joint is clean and dry. Final ROM check.", type: "speech" },
    { at: 5220, speaker: "Physician C", text: "Repair the capsule with the Ethibond tags.", type: "speech" },
    { at: 5340, speaker: "Scrub Tech",  text: "Hemovac drain pack open. Drain ready when you want it.", type: "speech" },
    { at: 5400, speaker: "Circulator",  text: "Pre-close count starting. Anything still in the field?", type: "speech" },
    { at: 5430, speaker: "Scrub Tech",  text: "All sponges accounted on the mayo — twenty.", type: "speech" },
    { at: 5520, speaker: "Scrub Tech",  text: "Needles fourteen, sharps eleven.", type: "speech" },
    { at: 5640, speaker: "Scrub Tech",  text: "Back table verified — fifty-six items.", type: "speech" },
    { at: 5820, speaker: "Circulator",  text: "Pre-close count balanced. 97 of 97.", type: "speech" },
    { at: 5990, speaker: "Physician C", text: "Thank you. Count's clean. Cup, stem, head — all where they should be.", type: "speech" },
    { at: 6000, speaker: "Physician C", text: "Looking at version, abduction, leg length one more time.", type: "speech" },
    { at: 6030, speaker: "Physician D", text: "Position is excellent. Components look great.", type: "speech" },
    { at: 6060, speaker: "Physician C", text: "Satisfied. Let's close.", type: "speech" },
    { at: 6090, speaker: "Physician C", text: "Closure: capsule, fascia/IT band, subq, then staples.", type: "speech" },
    { at: 6120, speaker: "Physician C", text: "Hemovac drain through a separate stab. Anchor to skin.", type: "speech" },
    { at: 6300, speaker: "Physician C", text: "Mayo Hegar needle holder. Ethibond on a CT-1.", type: "speech" },
    { at: 6420, speaker: "Physician C", text: "Capsule reapproximated — four figure-of-eight.", type: "speech" },
    { at: 6720, speaker: "Physician C", text: "Vicryl 2-0 for the IT band. Interrupted, every centimeter.", type: "speech" },
    { at: 6900, speaker: "Physician D", text: "Fascia closed. Layer's tight, no gaps.", type: "speech" },
    { at: 7080, speaker: "Physician C", text: "Crile Wood needle holder. Now subcutaneous, SH on Vicryl.", type: "speech" },
    { at: 7320, speaker: "Physician C", text: "Subq done. Staples for skin — staple gun please.", type: "speech" },
    { at: 7500, speaker: "Physician C", text: "Twenty-eight staples. Wound looks well approximated.", type: "speech" },
    { at: 7620, speaker: "Physician C", text: "Three-zero nylon for the drain site.", type: "speech" },
    { at: 7740, speaker: "Scrub Tech",  text: "Dressing — gauze, ABD pad, then tape.", type: "speech" },
    { at: 7800, speaker: "Physician C", text: "Drain is functional. Suction confirmed.", type: "speech" },
    { at: 7920, speaker: "Circulator",  text: "Final count starting. Sponges, needles, sharps, instruments, packs.", type: "speech" },
    { at: 8040, speaker: "Scrub Tech",  text: "Sponges 20 of 20. Needles 14 of 14. Sharps 11 of 11.", type: "speech" },
    { at: 8100, speaker: "Scrub Tech",  text: "Instruments 49 of 49. Packs 3 of 3.", type: "speech" },
    { at: 8160, speaker: "Circulator",  text: "Final count BALANCED. 97 of 97. Documented.", type: "speech" },
    { at: 8280, speaker: "Anesthesia",  text: "Coming off sedation. Patient should be waking soon.", type: "speech" },
    { at: 8520, speaker: "Anesthesia",  text: "Spinal level still T10. Vitals stable.", type: "speech" },
    { at: 8640, speaker: "Circulator",  text: "Abductor pillow placed. Hip precautions in effect.", type: "speech" },
    { at: 8700, speaker: "Anesthesia",  text: "Patient transferred to bed — log roll, no flexion past 90.", type: "speech" },
    { at: 8820, speaker: "Physician C", text: "Pain control on board. Patient looks comfortable.", type: "speech" },
    { at: 8880, speaker: "Circulator",  text: "Patient out. Going to PACU. Implant log entered.", type: "speech" },
    { at: 8940, speaker: "Physician C", text: "Great case team. Thanks everyone. See you for the next one.", type: "speech" },
  ],
};

export const COMPLIANCE = [
  { label: "Time Out Completed",    value: "Yes",           color: "green" },
  { label: "Verbal Confirms",       value: "4/4",           color: "green" },
  { label: "Initial Count Balanced", value: "169/169",      color: "green" },
  { label: "Preference Card Match", value: "94%",           color: null }, // use bmColor
  { label: "Documentation Mode",    value: "Auto-Capture",  color: "teal" },
  { label: "Specimen Labeled",      value: "Pending",       color: "amber" },
  { label: "Fire Risk Assessment",  value: "Completed",     color: "green" },
  { label: "Laterality Verified",   value: "Left side",     color: "green" },
  { label: "Antibiotic Given",      value: "Yes — on time", color: "green" },
  { label: "Blood Products",        value: "None required", color: "muted" },
];

// ═══════════════════════════════════════════════════════════
// 10. CAMERA CONFIGURATION
// ═══════════════════════════════════════════════════════════
export const CAMERAS = [
  { id: 1, name: "Ceiling Main",  zone: "Full OR",    res: "4K",    fps: 30, ptz: true,  video: "/videos/cam1-overhead.mp4" },
  { id: 2, name: "Sterile Field", zone: "Sterile",    res: "4K",    fps: 30, ptz: true,  video: "/videos/cam2-sterile.mp4" },
  { id: 3, name: "Back Table",    zone: "Back Table", res: "1080p", fps: 30, ptz: false, video: "/videos/cam3-backtable.mp4" },
  { id: 4, name: "Waste & Door",  zone: "Waste",      res: "1080p", fps: 24, ptz: false, video: "/videos/cam4-waste.mp4" },
];

// ═══════════════════════════════════════════════════════════
// HELPER: Convert offset seconds to real local time string
// ═══════════════════════════════════════════════════════════
export function getTimeFormatter(procStartMs) {
  return {
    short: (offsetSec) => {
      const d = new Date(procStartMs + offsetSec * 1000);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    },
    full: (offsetSec) => {
      const d = new Date(procStartMs + offsetSec * 1000);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    },
  };
}
