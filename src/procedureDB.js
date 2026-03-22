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
  id: "2026-0321-001",
  type: "Mastectomy / Reconstruction",
  kit: "Masectomy Tray",
  kitBarcode: "10790-000",
  kitPdfUrl: "/assets/Masectomy_Tray.pdf",
  patient: { id: "PT-20260321", gender: "F", age: 55, mrn: "SH-449821" },
  surgeon: { name: "Physician A", id: "SRG-001" },
  or: "OR-1",
  facility: "Sheba Medical Center",
  team: [
    { name: "Physician A", role: "Surgeon", color: "teal" },
    { name: "Physician B", role: "Assistant", color: "teal" },
    { name: "Nurse A", role: "Circulator", color: "blue" },
    { name: "Scrub Tech A", role: "Scrub Tech", color: "cyan" },
  ],
  anesthesia: { name: "Physician F", type: "General" },
  laterality: "Left",
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
  // CONSUMABLES — mayo → patient → disposed
  { id: "SPG-001", name: "Lap Sponge 18×18",  cat: "sponge", init: 5,  loc: { m: 3, b: 0, p: 0, d: 2 }, zone: "mayo" },
  { id: "SPG-002", name: "4×4 Gauze Pad",     cat: "sponge", init: 10, loc: { m: 7, b: 0, p: 0, d: 3 }, zone: "mayo" },
  { id: "SPG-003", name: "Raytec Sponge",     cat: "sponge", init: 5,  loc: { m: 4, b: 0, p: 0, d: 1 }, zone: "mayo" },
  { id: "NDL-001", name: "Suture Needle CT-1", cat: "needle", init: 4,  loc: { m: 4, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "NDL-002", name: "Suture Needle SH",   cat: "needle", init: 3,  loc: { m: 2, b: 0, p: 0, d: 1 }, zone: "mayo" },
  { id: "NDL-003", name: "Keith Needle",       cat: "needle", init: 2,  loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "NDL-004", name: "Tapered RB-1",       cat: "needle", init: 3,  loc: { m: 3, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "SHP-001", name: "Blade #10",          cat: "sharp",  init: 2,  loc: { m: 1, b: 0, p: 0, d: 1 }, zone: "mayo" },
  { id: "SHP-002", name: "Blade #15",          cat: "sharp",  init: 1,  loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "SHP-003", name: "Blade #11",          cat: "sharp",  init: 1,  loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "SHP-004", name: "Trocar 5mm",         cat: "sharp",  init: 3,  loc: { m: 3, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "PAK-001", name: "Cavity Pack",        cat: "pack",   init: 2,  loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "PAK-002", name: "Lap Pack (5ct)",     cat: "pack",   init: 2,  loc: { m: 1, b: 0, p: 0, d: 1 }, zone: "mayo" },

  // INSTRUMENTS — LRG-MASTECTOMY/RECONSTRUCTION TRAY
  // RETRACTORS
  { id: "INS-001", name: "Retractor, Richardson, Loop Handle, 38mm×38mm, 9½\"", cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-002", name: "Retractor, Kelly, Loop Handle, 51mm×64mm, 9¾\"",     cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-003", name: "Retractor, Kelly, Loop Handle, 37mm×51mm, 9¾\"",     cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-004", name: "Retractor, Army Navy",                                cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-005", name: "Retractor, Richardson, Appendiceal, 19mm×51mm",       cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-006", name: "Retractor, Freeman, Breast/Facelift, 4 Prong, 7\"",   cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-007", name: "Retractor, Senn, Double Ended, 3 Prong, Sharp, 6¼\"", cat: "instrument", init: 2, loc: { m: 1, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-008", name: "Retractor, Mannerfelt, Double Prong, Sharp, Curved, 6\"", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-009", name: "Hook, Joseph, Skin, Double Prong, Sharp, 5mm, 6¼\"",  cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  // FORCEPS
  { id: "INS-010", name: "Forceps, DeBakey, Vascular Tissue, 2mm, 7¾\"",        cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-011", name: "Forceps, Cushing Brown, Straight, 7\", 9×9 Teeth",    cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-012", name: "Forceps, Tissue, 154mm, 6\", 1×2 Teeth",             cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-013", name: "Forceps, Dressing, Serrated, 154mm, 6\"",             cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-014", name: "Forceps, DeBakey, Vascular, Serrated, Straight, 5⅞\"", cat: "instrument", init: 2, loc: { m: 1, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-015", name: "Forceps, Adson, Dressing, Serrated, 4¾\", w/o Teeth", cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-016", name: "Forceps, Semken, Bipolar, Straight, Insulated, 6\"",  cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-017", name: "Forceps, Brown Adson, Tissue, 4¾\", 9×9 Teeth",      cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-018", name: "Forceps, Adson, Delicate, Serrated, 4¾\", 1×2 Teeth", cat: "instrument", init: 2, loc: { m: 1, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-019", name: "Forceps, Rees, Monopolar, 1.2mm, 8\"",               cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  // KNIFE HANDLES
  { id: "INS-020", name: "Handle, Knife, #3",  cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-021", name: "Handle, Knife, #7",  cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  // CLAMPS
  { id: "INS-022", name: "Towel Clip, Backhaus, Perforating, Sharp, 5¼\"",      cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-023", name: "Clamp, Halstead, Mosquito, Curved, 5\"",              cat: "instrument", init: 6, loc: { m: 6, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-024", name: "Clamp, Crile, Curved, 5½\"",                          cat: "instrument", init: 6, loc: { m: 2, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-025", name: "Clamp, Crile, Straight, 5½\"",                        cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-026", name: "Clamp, Allis, 6¼\", 5×6 Teeth",                      cat: "instrument", init: 6, loc: { m: 2, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-027", name: "Clamp, Allis, Tissue, 8\"",                           cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-028", name: "Clamp, Lahey, Tissue",                                cat: "instrument", init: 6, loc: { m: 6, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-029", name: "Clamp, Babcock, Tissue, 8mm×155mm, 6\"",              cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-030", name: "Clamp, Ochsner, Straight, 7¼\"",                      cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-031", name: "Clamp, Rochester Pean, Curved, Matte, 6¼\"",          cat: "instrument", init: 4, loc: { m: 0, b: 4, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-032", name: "Clamp, Diethrich, Right Angle, 7\"",                  cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-033", name: "Clamp, Tonsil",                                       cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-034", name: "Clamp, Gemini, Artery, 137mm, 5⅜\"",                 cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-035", name: "Sponge Stick, Foerster, Serrated, Straight, 9½\"",    cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  // NEEDLE HOLDERS
  { id: "INS-036", name: "Needleholder, Mayo Hegar, Grooved, 7½\"",             cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-037", name: "Needleholder, Crile Wood, TC, 7\"",                   cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-038", name: "Needleholder, Mayo Hegar, TC, 6¼\"",                  cat: "instrument", init: 2, loc: { m: 1, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-039", name: "Needleholder, Crile Wood, TC, Serrated, 7\"",         cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-040", name: "Needleholder/Scissors, Olsen Hegar, TC, 5¾\"",        cat: "instrument", init: 4, loc: { m: 1, b: 3, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-041", name: "Needleholder, Halsey, TC, Serrated, 5¼\"",            cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-042", name: "Needleholder, Webster, Smooth, 4½\"",                 cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  // SCISSORS
  { id: "INS-043", name: "Scissors, Lister, Bandage, 7¼\"",                     cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-044", name: "Scissors, Mayo, Beveled, Curved, 6¾\"",               cat: "instrument", init: 1, loc: { m: 1, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-045", name: "Scissors, Gorney Freeman, TC, Serrated, Curved, 7½\"", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-046", name: "Scissors, Metzenbaum, TC, Curved, 7\"",               cat: "instrument", init: 2, loc: { m: 2, b: 0, p: 0, d: 0 }, zone: "mayo" },
  { id: "INS-047", name: "Scissors, Mayo, Beveled, Straight, 6¾\"",             cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-048", name: "Scissors, Kaye, SuperCut, Curved, 7¾\"",              cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-049", name: "Scissors, Lahey Metzenbaum, TC, Curved, 5¾\"",        cat: "instrument", init: 1, loc: { m: 0, b: 1, p: 0, d: 0 }, zone: "back_table" },
  // COOKIE CUTTERS
  { id: "INS-050", name: "Marker, Freeman, Areola, 42mm", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-051", name: "Marker, Freeman, Areola, 38mm", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-052", name: "Marker, Freeman, Areola, 36mm", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
  { id: "INS-053", name: "Marker, Freeman, Areola, 34mm", cat: "instrument", init: 2, loc: { m: 0, b: 2, p: 0, d: 0 }, zone: "back_table" },
];

// ═══════════════════════════════════════════════════════════
// 5. ITEM EVENTS — per-item timeline (offsets in seconds from procedure start)
//    type: baseline | to_patient | to_mayo | to_back | disposed | alert | resolved | opened
// ═══════════════════════════════════════════════════════════
export const ITEM_EVENTS = {
  // SPONGES
  "SPG-001": [
    { at: -1099, type: "baseline", note: "Initial count: 5 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=2" },
    { at: 540,   type: "to_patient", note: "1× Lap Sponge → patient (packing surgical site)", frame: "/videos/cam1-overhead.mp4#t=4" },
    { at: 720,   type: "to_mayo", note: "1× Lap Sponge ← returned to mayo (soaked, for disposal)", frame: null },
    { at: 780,   type: "disposed", note: "1× Lap Sponge → waste bucket (CAM-4 confirmed)", frame: "/videos/cam4-waste.mp4#t=5" },
    { at: 1740,  type: "disposed", note: "1× Lap Sponge → waste bucket (blood-soaked)", frame: "/videos/cam4-waste.mp4#t=12" },
  ],
  "SPG-002": [
    { at: -1099, type: "baseline", note: "Initial count: 10 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=1" },
    { at: 360,   type: "to_patient", note: "1× Gauze Pad → patient (wound absorption)", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 660,   type: "to_mayo", note: "1× Gauze Pad ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=4" },
    { at: 960,   type: "to_patient", note: "2× Gauze Pad → patient", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 1140,  type: "disposed", note: "1× 4×4 Gauze → waste", frame: "/videos/cam4-waste.mp4#t=8" },
    { at: 1380,  type: "disposed", note: "1× 4×4 Gauze → waste", frame: "/videos/cam4-waste.mp4#t=10" },
    { at: 2340,  type: "disposed", note: "1× 4×4 Gauze → waste", frame: "/videos/cam4-waste.mp4#t=15" },
    { at: 5340,  type: "to_mayo", note: "1× Gauze Pad ← returned to mayo (pre-close)", frame: null },
  ],
  "SPG-003": [
    { at: -1099, type: "baseline", note: "Initial count: 5 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=3" },
    { at: 1260,  type: "to_patient", note: "1× Raytec → patient (packing cavity)", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 1560,  type: "alert", note: "Raytec drop detected — floor zone, CAM-1", frame: "/videos/cam1-overhead.mp4#t=6" },
    { at: 1560,  type: "resolved", note: "Raytec recovered → returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 2700,  type: "disposed", note: "1× Raytec → waste", frame: "/videos/cam4-waste.mp4#t=18" },
    { at: 5350,  type: "to_mayo", note: "1× Raytec ← returned to mayo (pre-close count)", frame: null },
  ],
  // NEEDLES
  "NDL-001": [
    { at: -1099, type: "baseline", note: "Initial count: 4 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 1860,  type: "to_patient", note: "1× CT-1 Needle loaded on needleholder → suturing", frame: "/videos/cam1-overhead.mp4#t=9" },
    { at: 2100,  type: "to_mayo", note: "1× CT-1 Needle ← returned to mayo (suture complete)", frame: null },
  ],
  "NDL-002": [
    { at: -1099, type: "baseline", note: "Initial count: 3 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 2460,  type: "to_patient", note: "1× SH Needle loaded → deep tissue suturing", frame: "/videos/cam1-overhead.mp4#t=11" },
    { at: 2700,  type: "to_mayo", note: "1× SH Needle ← returned to mayo (suture complete)", frame: null },
    { at: 3360,  type: "disposed", note: "1× Suture Needle SH → sharps container", frame: "/videos/cam4-waste.mp4#t=20" },
  ],
  "NDL-003": [
    { at: -1099, type: "baseline", note: "Initial count: 2 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=6" },
  ],
  "NDL-004": [
    { at: -1099, type: "baseline", note: "Initial count: 3 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=6" },
    { at: 3060,  type: "to_patient", note: "1× RB-1 Needle loaded → subcutaneous suturing", frame: "/videos/cam1-overhead.mp4#t=13" },
    { at: 3540,  type: "to_mayo", note: "1× RB-1 Needle ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=14" },
  ],
  // SHARPS
  "SHP-001": [
    { at: -1099, type: "baseline", note: "Initial count: 2 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 0,     type: "to_patient", note: "1× Blade #10 mounted on handle → incision", frame: "/videos/cam1-overhead.mp4#t=2" },
    { at: 3900,  type: "to_mayo", note: "1× Blade #10 ← removed from handle, returned to mayo", frame: null },
    { at: 3960,  type: "disposed", note: "1× Blade #10 → sharps container", frame: "/videos/cam4-waste.mp4#t=28" },
  ],
  "SHP-002": [{ at: -1099, type: "baseline", note: "Initial count: 1 unit on mayo stand", frame: "/videos/cam2-sterile.mp4#t=7" }],
  "SHP-003": [{ at: -1099, type: "baseline", note: "Initial count: 1 unit on mayo stand", frame: "/videos/cam2-sterile.mp4#t=8" }],
  "SHP-004": [
    { at: -1099, type: "baseline", note: "Initial count: 3 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 180,   type: "to_patient", note: "1× Trocar 5mm → patient (port placement)", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 5320,  type: "to_mayo", note: "1× Trocar 5mm ← returned to mayo (port removed)", frame: null },
  ],
  // PACKS
  "PAK-001": [
    { at: -1099, type: "baseline", note: "Initial count: 2 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=9" },
    { at: 960,   type: "opened", note: "1× Cavity Pack opened — contents laid out on mayo", frame: "/videos/cam2-sterile.mp4#t=5" },
  ],
  "PAK-002": [
    { at: -1099, type: "baseline", note: "Initial count: 2 units on mayo stand", frame: "/videos/cam2-sterile.mp4#t=10" },
    { at: 1860,  type: "opened", note: "1× Lap Pack opened — 5 sponges added to count", frame: "/videos/cam2-sterile.mp4#t=11" },
    { at: 2940,  type: "disposed", note: "1× Lap Pack consumed and disposed", frame: "/videos/cam4-waste.mp4#t=14" },
  ],
  // INSTRUMENTS — movements to/from patient
  "INS-001": [
    { at: -1099, type: "baseline", note: "Initial: 2× Richardson Retractor on mayo stand", frame: "/videos/cam2-sterile.mp4#t=2" },
    { at: 120,   type: "to_patient", note: "1× Richardson Retractor → patient (holding wound edges)", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 5200,  type: "to_mayo", note: "1× Richardson Retractor ← returned to mayo (pre-close)", frame: null },
  ],
  "INS-006": [
    { at: -1099, type: "baseline", note: "Initial: 2× Freeman Breast Retractor on mayo stand", frame: "/videos/cam2-sterile.mp4#t=3" },
    { at: 420,   type: "to_patient", note: "1× Freeman Retractor → patient (breast tissue retraction)", frame: "/videos/cam1-overhead.mp4#t=4" },
    { at: 5220,  type: "to_mayo", note: "1× Freeman Retractor ← returned to mayo (pre-close)", frame: null },
  ],
  "INS-010": [
    { at: -1099, type: "baseline", note: "Initial: 2× DeBakey Forceps on mayo stand", frame: "/videos/cam2-sterile.mp4#t=4" },
    { at: 240,   type: "to_patient", note: "1× DeBakey Forceps → patient (grasping tissue)", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 960,   type: "to_mayo", note: "1× DeBakey Forceps ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 1980,  type: "to_patient", note: "1× DeBakey Forceps → patient (vascular dissection)", frame: "/videos/cam1-overhead.mp4#t=10" },
    { at: 5240,  type: "to_mayo", note: "1× DeBakey Forceps ← returned to mayo (pre-close)", frame: null },
  ],
  "INS-020": [
    { at: -1099, type: "baseline", note: "Initial: 2× Knife Handle #3 on mayo stand", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 0,     type: "to_patient", note: "1× Knife Handle #3 with Blade #10 → patient (skin incision)", frame: "/videos/cam1-overhead.mp4#t=2" },
    { at: 5260,  type: "to_mayo", note: "1× Knife Handle #3 ← returned to mayo (pre-close)", frame: null },
  ],
  "INS-023": [
    { at: -1099, type: "baseline", note: "Initial: 6× Mosquito Clamp on mayo stand", frame: "/videos/cam2-sterile.mp4#t=6" },
    { at: 540,   type: "to_patient", note: "1× Mosquito Clamp → patient (clamping vessel)", frame: "/videos/cam1-overhead.mp4#t=4" },
    { at: 900,   type: "to_mayo", note: "1× Mosquito Clamp ← returned to mayo (vessel ligated)", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 2220,  type: "to_patient", note: "1× Mosquito Clamp → patient (hemostasis)", frame: "/videos/cam1-overhead.mp4#t=11" },
    { at: 5280,  type: "to_mayo", note: "1× Mosquito Clamp ← returned to mayo (hemostasis complete)", frame: null },
  ],
  "INS-028": [
    { at: -1099, type: "baseline", note: "Initial: 6× Lahey Clamp on mayo stand", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 1380,  type: "to_patient", note: "1× Lahey Clamp → patient (clamping tissue pedicle)", frame: "/videos/cam1-overhead.mp4#t=7" },
    { at: 5300,  type: "to_mayo", note: "1× Lahey Clamp ← returned to mayo (pedicle ligated)", frame: null },
  ],
  // Instruments used and RETURNED (currently all on mayo)
  "INS-011": [
    { at: -1099, type: "baseline", note: "Initial: 2× Cushing Brown Forceps on mayo stand", frame: "/videos/cam2-sterile.mp4#t=4" },
    { at: 660,   type: "to_patient", note: "1× Cushing Brown Forceps → patient (tissue handling)", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 1260,  type: "to_mayo", note: "1× Cushing Brown Forceps ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=7" },
  ],
  "INS-029": [
    { at: -1099, type: "baseline", note: "Initial: 2× Babcock Clamp on mayo stand", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 1020,  type: "to_patient", note: "1× Babcock Clamp → patient (bowel retraction)", frame: "/videos/cam1-overhead.mp4#t=6" },
    { at: 1500,  type: "to_mayo", note: "1× Babcock Clamp ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=8" },
  ],
  "INS-036": [
    { at: -1099, type: "baseline", note: "Initial: 2× Mayo Hegar Needleholder on mayo stand", frame: "/videos/cam2-sterile.mp4#t=9" },
    { at: 2460,  type: "to_patient", note: "1× Mayo Hegar Needleholder → patient (suturing deep layer)", frame: "/videos/cam1-overhead.mp4#t=12" },
    { at: 3120,  type: "to_mayo", note: "1× Mayo Hegar Needleholder ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=13" },
  ],
  "INS-046": [
    { at: -1099, type: "baseline", note: "Initial: 2× Metzenbaum Scissors on mayo stand", frame: "/videos/cam2-sterile.mp4#t=10" },
    { at: 360,   type: "to_patient", note: "1× Metzenbaum Scissors → patient (tissue dissection)", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 780,   type: "to_mayo", note: "1× Metzenbaum Scissors ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=5" },
  ],
  "INS-004": [
    { at: -1099, type: "baseline", note: "Initial: 2× Army Navy Retractor on mayo stand", frame: "/videos/cam2-sterile.mp4#t=3" },
    { at: 300,   type: "to_patient", note: "1× Army Navy Retractor → patient (skin edge retraction)", frame: "/videos/cam1-overhead.mp4#t=3" },
    { at: 1140,  type: "to_mayo", note: "1× Army Navy Retractor ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=6" },
  ],
  "INS-009": [
    { at: -1099, type: "baseline", note: "Initial: 2× Joseph Skin Hook on mayo stand", frame: "/videos/cam2-sterile.mp4#t=4" },
    { at: 480,   type: "to_patient", note: "1× Joseph Skin Hook → patient (flap elevation)", frame: "/videos/cam1-overhead.mp4#t=4" },
    { at: 1200,  type: "to_mayo", note: "1× Joseph Skin Hook ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=7" },
    { at: 2160,  type: "to_patient", note: "1× Joseph Skin Hook → patient (flap retraction)", frame: "/videos/cam1-overhead.mp4#t=11" },
    { at: 2820,  type: "to_mayo", note: "1× Joseph Skin Hook ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=12" },
  ],
  "INS-015": [
    { at: -1099, type: "baseline", note: "Initial: 2× Adson Forceps on mayo stand", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 720,   type: "to_patient", note: "1× Adson Forceps → patient (skin edge handling)", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 1080,  type: "to_mayo", note: "1× Adson Forceps ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=6" },
  ],
  "INS-032": [
    { at: -1099, type: "baseline", note: "Initial: 2× Diethrich Right Angle on mayo stand", frame: "/videos/cam2-sterile.mp4#t=8" },
    { at: 1620,  type: "to_patient", note: "1× Right Angle → patient (vessel isolation)", frame: "/videos/cam1-overhead.mp4#t=8" },
    { at: 1860,  type: "to_mayo", note: "1× Right Angle ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=9" },
  ],
  "INS-044": [
    { at: -1099, type: "baseline", note: "Initial: 1× Mayo Scissors on mayo stand", frame: "/videos/cam2-sterile.mp4#t=9" },
    { at: 840,   type: "to_patient", note: "1× Mayo Scissors → patient (suture cutting)", frame: "/videos/cam1-overhead.mp4#t=5" },
    { at: 900,   type: "to_mayo", note: "1× Mayo Scissors ← returned to mayo stand", frame: "/videos/cam2-sterile.mp4#t=5" },
  ],
  // BACK TABLE INSTRUMENTS — moved to mayo
  "INS-007": [
    { at: -1099, type: "baseline", note: "Initial: 2× Senn Retractor on back table", frame: "/videos/cam3-backtable.mp4#t=2" },
    { at: 600,   type: "to_mayo", note: "1× Senn Retractor → moved to mayo stand (surgeon request)", frame: "/videos/cam2-sterile.mp4#t=4" },
  ],
  "INS-014": [
    { at: -1099, type: "baseline", note: "Initial: 2× DeBakey Vascular Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=3" },
    { at: 1740,  type: "to_mayo", note: "1× DeBakey Vascular Forceps → moved to mayo stand", frame: "/videos/cam2-sterile.mp4#t=9" },
  ],
  "INS-024": [
    { at: -1099, type: "baseline", note: "Initial: 6× Crile Curved Clamp on back table", frame: "/videos/cam3-backtable.mp4#t=4" },
    { at: 660,   type: "to_mayo", note: "1× Crile Curved Clamp → moved to mayo (hemostasis)", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 660,   type: "to_mayo", note: "1× Crile Curved Clamp → moved to mayo (hemostasis)", frame: null },
  ],
  "INS-026": [
    { at: -1099, type: "baseline", note: "Initial: 6× Allis Clamp on back table", frame: "/videos/cam3-backtable.mp4#t=5" },
    { at: 960,   type: "to_mayo", note: "1× Allis Clamp → moved to mayo (tissue retraction)", frame: "/videos/cam2-sterile.mp4#t=5" },
    { at: 960,   type: "to_mayo", note: "1× Allis Clamp → moved to mayo (tissue retraction)", frame: null },
  ],
  "INS-040": [
    { at: -1099, type: "baseline", note: "Initial: 4× Olsen Hegar Needleholder/Scissors on back table", frame: "/videos/cam3-backtable.mp4#t=6" },
    { at: 2340,  type: "to_mayo", note: "1× Olsen Hegar → moved to mayo stand (suturing phase)", frame: "/videos/cam2-sterile.mp4#t=11" },
  ],
  "INS-018": [
    { at: -1099, type: "baseline", note: "Initial: 2× Adson Delicate Forceps on back table", frame: "/videos/cam3-backtable.mp4#t=3" },
    { at: 1800,  type: "to_mayo", note: "1× Adson Delicate Forceps → moved to mayo stand (fine dissection needed)", frame: "/videos/cam2-sterile.mp4#t=9" },
  ],
  "INS-038": [
    { at: -1099, type: "baseline", note: "Initial: 2× Mayo Hegar TC Needleholder on back table", frame: "/videos/cam3-backtable.mp4#t=6" },
    { at: 2580,  type: "to_mayo", note: "1× Mayo Hegar TC Needleholder → moved to mayo stand (closure suturing)", frame: "/videos/cam2-sterile.mp4#t=12" },
  ],
  "INS-022": [
    { at: -1099, type: "baseline", note: "Initial: 4× Towel Clip on back table", frame: "/videos/cam3-backtable.mp4#t=1" },
  ],
  "INS-031": [
    { at: -1099, type: "baseline", note: "Initial: 4× Rochester Pean Clamp on back table", frame: "/videos/cam3-backtable.mp4#t=7" },
  ],

  // ── MISSING ITEMS: baseline + movement events ──

  // MAYO instruments — baseline only (no movement, stay on mayo)
  "INS-002": [
    { at: -1099, type: "baseline", note: "Initial: 2× Kelly Retractor 51×64mm on mayo stand", frame: null },
  ],
  "INS-012": [
    { at: -1099, type: "baseline", note: "Initial: 2× Tissue Forceps on mayo stand", frame: null },
  ],
  "INS-016": [
    { at: -1099, type: "baseline", note: "Initial: 1× Semken Bipolar Forceps on mayo stand", frame: null },
  ],
  "INS-017": [
    { at: -1099, type: "baseline", note: "Initial: 2× Brown Adson Tissue Forceps on mayo stand", frame: null },
  ],
  "INS-021": [
    { at: -1099, type: "baseline", note: "Initial: 1× Knife Handle #7 on mayo stand", frame: null },
  ],

  // BACK TABLE instruments — baseline only (no movement)
  "INS-003": [
    { at: -1080, type: "baseline", note: "Initial: 2× Kelly Retractor 37×51mm on back table", frame: null },
  ],
  "INS-005": [
    { at: -1080, type: "baseline", note: "Initial: 2× Richardson Appendiceal Retractor on back table", frame: null },
  ],
  "INS-008": [
    { at: -1080, type: "baseline", note: "Initial: 2× Mannerfelt Retractor on back table", frame: null },
  ],
  "INS-013": [
    { at: -1080, type: "baseline", note: "Initial: 2× Dressing Forceps on back table", frame: null },
  ],
  "INS-019": [
    { at: -1080, type: "baseline", note: "Initial: 2× Rees Monopolar Forceps on back table", frame: null },
  ],
  "INS-025": [
    { at: -1080, type: "baseline", note: "Initial: 4× Crile Straight Clamp on back table", frame: null },
  ],
  "INS-027": [
    { at: -1080, type: "baseline", note: "Initial: 4× Allis Tissue Clamp 8\" on back table", frame: null },
  ],
  "INS-030": [
    { at: -1080, type: "baseline", note: "Initial: 2× Ochsner Straight Clamp on back table", frame: null },
  ],
  "INS-033": [
    { at: -1080, type: "baseline", note: "Initial: 2× Tonsil Clamp on back table", frame: null },
  ],
  "INS-034": [
    { at: -1080, type: "baseline", note: "Initial: 2× Gemini Artery Clamp on back table", frame: null },
  ],
  "INS-035": [
    { at: -1080, type: "baseline", note: "Initial: 2× Sponge Stick Foerster on back table", frame: null },
  ],
  "INS-037": [
    { at: -1080, type: "baseline", note: "Initial: 2× Crile Wood TC Needleholder on back table", frame: null },
  ],
  "INS-039": [
    { at: -1080, type: "baseline", note: "Initial: 2× Crile Wood TC Serrated Needleholder on back table", frame: null },
  ],
  "INS-041": [
    { at: -1080, type: "baseline", note: "Initial: 2× Halsey TC Needleholder on back table", frame: null },
  ],
  "INS-042": [
    { at: -1080, type: "baseline", note: "Initial: 2× Webster Smooth Needleholder on back table", frame: null },
  ],
  "INS-043": [
    { at: -1080, type: "baseline", note: "Initial: 1× Lister Bandage Scissors on back table", frame: null },
  ],
  "INS-045": [
    { at: -1080, type: "baseline", note: "Initial: 2× Gorney Freeman TC Scissors on back table", frame: null },
  ],
  "INS-047": [
    { at: -1080, type: "baseline", note: "Initial: 1× Mayo Beveled Straight Scissors on back table", frame: null },
  ],
  "INS-048": [
    { at: -1080, type: "baseline", note: "Initial: 2× Kaye SuperCut Scissors on back table", frame: null },
  ],
  "INS-049": [
    { at: -1080, type: "baseline", note: "Initial: 1× Lahey Metzenbaum TC Scissors on back table", frame: null },
  ],
  "INS-050": [
    { at: -1080, type: "baseline", note: "Initial: 2× Freeman Areola Marker 42mm on back table", frame: null },
  ],
  "INS-051": [
    { at: -1080, type: "baseline", note: "Initial: 2× Freeman Areola Marker 38mm on back table", frame: null },
  ],
  "INS-052": [
    { at: -1080, type: "baseline", note: "Initial: 2× Freeman Areola Marker 36mm on back table", frame: null },
  ],
  "INS-053": [
    { at: -1080, type: "baseline", note: "Initial: 2× Freeman Areola Marker 34mm on back table", frame: null },
  ],
};

// ═══════════════════════════════════════════════════════════
// 6. SYSTEM EVENTS — room-level events (offsets in seconds)
// ═══════════════════════════════════════════════════════════
export const SYSTEM_EVENTS = [
  { at: -2071, phase: 0, text: "→ OR Setup", type: "phase" },
  { at: -2071, phase: 0, text: "System operational — 4 cameras online", type: "info" },
  { at: -2071, phase: 0, text: "OR Setup — 4 staff entered, 5 trays prepared", type: "info" },
  { at: -1099, phase: 1, text: "→ Initial Count (Safety Gate)", type: "phase" },
  { at: -1099, phase: 1, text: "Initial Count — Mayo Stand: 88 pcs / 38 types", type: "gate" },
  { at: -1039, phase: 1, text: "Initial Count — Back Table: 81 pcs / 33 types", type: "gate" },
  { at: -859,  phase: 1, text: "Count BALANCED ✓ — 169/169 (Mayo 88 + Back Table 81)", type: "ok" },
  { at: -835,  phase: 2, text: "→ Patient In", type: "phase" },
  { at: -835,  phase: 2, text: "Patient positioned on table, ID verified", type: "info" },
  { at: -715,  phase: 3, text: "→ Anesthesia", type: "phase" },
  { at: -715,  phase: 3, text: "Anesthesia Induction — general anesthesia administered", type: "info" },
  { at: -190,  phase: 4, text: "→ Time Out (Safety Gate)", type: "phase" },
  { at: -190,  phase: 4, text: "Time Out — 4/4 verbal confirms: patient, site, procedure, consent", type: "gate" },
  { at: 0,     phase: 5, text: "→ Procedure", type: "phase" },
  { at: 0,     phase: 5, text: "Incision — procedure start, mastectomy begun", type: "info" },
  { at: 300,   phase: 5, text: "⚠ SPG-003 Raytec drop detected — floor zone", type: "warn" },
  { at: 300,   phase: 5, text: "SPG-003 Raytec recovered → sterile field", type: "ok" },
  { at: 720,   phase: 5, text: "⚠ Mid-case tray added (+1 suture set)", type: "warn" },
  { at: 1800,  phase: 5, text: "Running count at 30 min — all items balanced (169/169)", type: "gate" },
  { at: 2700,  phase: 5, text: "⚠ Minor bleeder detected — lateral thoracic artery branch", type: "warn" },
  { at: 2760,  phase: 5, text: "Bleeder controlled — bipolar cautery applied", type: "ok" },
  { at: 3000,  phase: 5, text: "EBL update: 280cc — within acceptable range", type: "info" },
  { at: 3600,  phase: 5, text: "Running count at 60 min — all items balanced (169/169)", type: "gate" },
  { at: 4200,  phase: 5, text: "EBL update: 350cc — no transfusion required", type: "info" },
  { at: 5100,  phase: 5, text: "Reconstruction nearing completion — preparing for count", type: "info" },
  { at: 5400,  phase: 6, text: "→ Pre-Close Count (Safety Gate)", type: "phase" },
  { at: 5400,  phase: 6, text: "Pre-closure count initiated — verifying all zones", type: "gate" },
  { at: 5520,  phase: 6, text: "Mayo Stand count: 88 items verified", type: "gate" },
  { at: 5640,  phase: 6, text: "Back Table count: 81 items verified", type: "gate" },
  { at: 5760,  phase: 6, text: "Waste & Disposed count: all accounted", type: "gate" },
  { at: 5820,  phase: 6, text: "Patient zone verified — 0 retained items", type: "gate" },
  { at: 5880,  phase: 7, text: "→ Count Resolution (Safety Gate)", type: "phase" },
  { at: 5880,  phase: 7, text: "Count resolution — comparing all zones against baseline", type: "gate" },
  { at: 5940,  phase: 7, text: "Count BALANCED ✓ — 169/169 (all zones reconciled)", type: "ok" },
  { at: 6000,  phase: 8, text: "→ Surgeon Decision", type: "phase" },
  { at: 6000,  phase: 8, text: "Surgeon reviewing reconstruction — assessing symmetry", type: "info" },
  { at: 6060,  phase: 8, text: "Surgeon satisfied — closure approved", type: "ok" },
  { at: 6120,  phase: 9, text: "→ Closure", type: "phase" },
  { at: 6120,  phase: 9, text: "Closure initiated — deep fascial layer", type: "info" },
  { at: 6600,  phase: 9, text: "Deep layer closure complete — progressing to subcutaneous", type: "info" },
  { at: 7200,  phase: 9, text: "Subcutaneous closure complete — skin closure beginning", type: "info" },
  { at: 7500,  phase: 9, text: "Drain placement confirmed — JP drain functional", type: "info" },
  { at: 7800,  phase: 9, text: "Dressing applied — closure complete", type: "info" },
  { at: 7920,  phase: 10, text: "→ Final Count (Safety Gate)", type: "phase" },
  { at: 7920,  phase: 10, text: "Final count initiated — all categories", type: "gate" },
  { at: 8040,  phase: 10, text: "Sponges: 20/20 ✓ | Needles: 12/12 ✓ | Sharps: 7/7 ✓", type: "gate" },
  { at: 8160,  phase: 10, text: "Instruments: 128/128 ✓ | Disposables: 4/4 ✓", type: "gate" },
  { at: 8220,  phase: 10, text: "Final count BALANCED ✓ — 169/169 all categories", type: "ok" },
  { at: 8280,  phase: 11, text: "→ Emergence", type: "phase" },
  { at: 8280,  phase: 11, text: "Anesthesia reversal initiated — sugammadex administered", type: "info" },
  { at: 8520,  phase: 11, text: "Patient showing spontaneous respiratory effort", type: "info" },
  { at: 8700,  phase: 11, text: "Patient extubated — breathing on own, vitals stable", type: "ok" },
  { at: 8880,  phase: 12, text: "→ Patient Out", type: "phase" },
  { at: 8880,  phase: 12, text: "Patient transferred to stretcher — monitors reconnected", type: "info" },
  { at: 8940,  phase: 12, text: "Handoff to PACU nurse — report given", type: "info" },
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
//    These extend SYSTEM_EVENTS in real-time
// ═══════════════════════════════════════════════════════════
export const LIVE_EVENTS = [
  { at: 60,   text: "INS-026 Allis Clamp pulled from back table → mayo", type: "info", itemId: "INS-026" },
  { at: 125,  text: "INS-046 Metzenbaum Scissors → patient (axillary dissection)", type: "info", itemId: "INS-046" },
  { at: 141,  text: "INS-046 Metzenbaum Scissors ← returned to mayo", type: "ok", itemId: "INS-046" },
  { at: 150,  text: "Sentinel node specimen collected — sent to pathology", type: "info" },
  { at: 240,  text: "SPG-001 Lap Sponge → patient (hemostasis)", type: "info", itemId: "SPG-001" },
  { at: 260,  text: "INS-023 Mosquito Clamp → patient (bleeder)", type: "info", itemId: "INS-023" },
  { at: 280,  text: "Pathology report: Sentinel node NEGATIVE", type: "ok" },
  { at: 330,  text: "Running sponge count verified — 3 disposed, 6 on mayo", type: "gate" },
  { at: 390,  text: "Mastectomy specimen fully resected — margins marked", type: "info" },
  { at: 430,  text: "Wound irrigation — normal saline", type: "info" },
  { at: 470,  text: "EBL update: 150cc", type: "info" },
  { at: 540,  text: "Hemostasis achieved — preparing for reconstruction", type: "info" },
  { at: 600,  text: "INS-040 Olsen Hegar pulled from back table → mayo", type: "info", itemId: "INS-040" },
  { at: 660,  text: "Reconstruction phase beginning — tissue expander being placed", type: "info" },
  { at: 720,  text: "SPG-002 Gauze Pad → patient (expander pocket)", type: "info", itemId: "SPG-002" },
  { at: 780,  text: "Running count: all instruments accounted for", type: "gate" },
  { at: 840,  text: "Tissue expander positioned — checking symmetry", type: "info" },
  { at: 900,  text: "INS-036 Needleholder → patient (closing pocket)", type: "info", itemId: "INS-036" },
  { at: 960,  text: "INS-036 Needleholder ← returned to mayo", type: "ok", itemId: "INS-036" },
  { at: 1020, text: "Deep closure progressing — 2-0 Vicryl", type: "info" },
  { at: 1080, text: "EBL update: 200cc — within expected range", type: "info" },
  { at: 1140, text: "Skin closure beginning — 4-0 Monocryl", type: "info" },
  { at: 1200, text: "INS-044 Mayo Scissors → patient (suture trim)", type: "info", itemId: "INS-044" },
  { at: 1220, text: "INS-044 Mayo Scissors ← returned to mayo", type: "ok", itemId: "INS-044" },
  { at: 1320, text: "Drain placement — JP drain secured", type: "info" },
  { at: 1380, text: "Skin closure complete — steri-strips applied", type: "info" },
  { at: 1440, text: "Dressing applied — surgery site covered", type: "info" },
  // ── Continued Procedure (1500–5400s) ──
  { at: 1500, text: "Reconstruction phase — subpectoral pocket dissection continuing", type: "info" },
  { at: 1620, text: "INS-032 Right Angle Clamp → patient (perforator ligation)", type: "info", itemId: "INS-032" },
  { at: 1680, text: "INS-032 Right Angle Clamp ← returned to mayo", type: "ok", itemId: "INS-032" },
  { at: 1800, text: "Running count at 30 min — all items balanced (169/169)", type: "gate" },
  { at: 1860, text: "PAK-002 Lap Pack opened — 5 sponges added to working count", type: "info", itemId: "PAK-002" },
  { at: 1920, text: "INS-010 DeBakey Forceps → patient (vascular dissection)", type: "info", itemId: "INS-010" },
  { at: 1980, text: "Pectoralis major elevated — expander pocket adequate", type: "info" },
  { at: 2100, text: "SPG-002 Gauze Pad disposed — blood-soaked", type: "info", itemId: "SPG-002" },
  { at: 2220, text: "INS-023 Mosquito Clamp → patient (hemostasis, small perforator)", type: "info", itemId: "INS-023" },
  { at: 2340, text: "SPG-002 Gauze Pad disposed", type: "info", itemId: "SPG-002" },
  { at: 2400, text: "Tissue expander irrigated with antibiotic saline", type: "info" },
  { at: 2520, text: "Expander positioned in subpectoral pocket — fill port oriented", type: "info" },
  { at: 2640, text: "Initial fill: 200cc normal saline into expander", type: "info" },
  { at: 2700, text: "⚠ Minor bleeder — lateral thoracic artery branch", type: "warn" },
  { at: 2760, text: "Bleeder controlled — bipolar cautery, hemostasis confirmed", type: "ok" },
  { at: 2820, text: "INS-009 Joseph Skin Hook ← returned to mayo", type: "ok", itemId: "INS-009" },
  { at: 2940, text: "PAK-002 Lap Pack consumed and disposed", type: "info", itemId: "PAK-002" },
  { at: 3000, text: "EBL update: 280cc — within acceptable range", type: "info" },
  { at: 3120, text: "INS-036 Needleholder ← returned to mayo", type: "ok", itemId: "INS-036" },
  { at: 3240, text: "Acellular dermal matrix being prepared for lower pole coverage", type: "info" },
  { at: 3360, text: "NDL-002 Suture Needle SH → sharps container (disposed)", type: "info", itemId: "NDL-002" },
  { at: 3480, text: "ADM secured to chest wall — 2-0 PDS interrupted sutures", type: "info" },
  { at: 3600, text: "Running count at 60 min — all items balanced (169/169)", type: "gate" },
  { at: 3720, text: "Expander fill adjusted to 250cc — checking projection", type: "info" },
  { at: 3840, text: "INS-015 Adson Forceps → patient (skin edge assessment)", type: "info", itemId: "INS-015" },
  { at: 3900, text: "INS-015 Adson Forceps ← returned to mayo", type: "ok", itemId: "INS-015" },
  { at: 3960, text: "SHP-001 Blade #10 → sharps container (disposed)", type: "info", itemId: "SHP-001" },
  { at: 4020, text: "Wound irrigation — 1L warm normal saline with bacitracin", type: "info" },
  { at: 4200, text: "EBL update: 350cc — no transfusion required", type: "info" },
  { at: 4320, text: "Symmetry check — reconstruction acceptable, good contour", type: "info" },
  { at: 4440, text: "INS-006 Freeman Retractor ← returned from patient to mayo", type: "ok", itemId: "INS-006" },
  { at: 4560, text: "INS-001 Richardson Retractor ← returned from patient to mayo", type: "ok", itemId: "INS-001" },
  { at: 4680, text: "Deep drain placement — 15Fr Blake drain tunneled inferiorly", type: "info" },
  { at: 4800, text: "Drain functional — confirmed suction output", type: "ok" },
  { at: 4920, text: "Skin flap viability assessed — good capillary refill bilaterally", type: "info" },
  { at: 5040, text: "INS-028 Lahey Clamp ← returned from patient to mayo", type: "ok", itemId: "INS-028" },
  { at: 5100, text: "All retractors and clamps returned — preparing for pre-close count", type: "info" },
  { at: 5220, text: "Final hemostasis check — field dry, no active bleeding", type: "ok" },
  { at: 5340, text: "INS-023 Mosquito Clamp ← returned from patient to mayo", type: "ok", itemId: "INS-023" },
  // ── Phase 7: Pre-Close Count (5400–5880s) ──
  { at: 5400, text: "→ Pre-Close Count — safety gate initiated", type: "phase" },
  { at: 5430, text: "Counting Mayo Stand — sponges, needles, sharps", type: "gate" },
  { at: 5490, text: "Mayo Stand — all sponges accounted (20/20)", type: "ok" },
  { at: 5520, text: "Mayo Stand — all needles accounted (12/12)", type: "ok" },
  { at: 5550, text: "Mayo Stand — all sharps accounted (7/7)", type: "ok" },
  { at: 5580, text: "Mayo Stand — instruments verified (88 items)", type: "ok" },
  { at: 5640, text: "Back Table — all items verified (81 items)", type: "ok" },
  { at: 5700, text: "Waste zone — disposed items cross-referenced with count sheet", type: "gate" },
  { at: 5760, text: "Patient zone — verified clear, 0 retained items", type: "ok" },
  { at: 5820, text: "All zones verified — count data submitted for resolution", type: "gate" },
  // ── Phase 8: Count Resolution (5880–6000s) ──
  { at: 5880, text: "→ Count Resolution — comparing totals against baseline", type: "phase" },
  { at: 5910, text: "Sponges: 20 initial, 20 accounted ✓", type: "ok" },
  { at: 5930, text: "Needles: 12 initial, 12 accounted ✓", type: "ok" },
  { at: 5950, text: "Sharps: 7 initial, 7 accounted ✓", type: "ok" },
  { at: 5970, text: "Instruments: 128 initial, 128 accounted ✓", type: "ok" },
  { at: 5990, text: "Count BALANCED — 169/169 total, all categories reconciled", type: "ok" },
  // ── Phase 9: Surgeon Decision (6000–6120s) ──
  { at: 6000, text: "→ Surgeon Decision — reviewing reconstruction outcome", type: "phase" },
  { at: 6030, text: "Physician A assessing expander position and symmetry", type: "info" },
  { at: 6060, text: "Reconstruction satisfactory — closure approved by surgeon", type: "ok" },
  { at: 6090, text: "Closure plan confirmed: fascial, subcutaneous, subcuticular layers", type: "info" },
  // ── Phase 10: Closure (6120–7920s) ──
  { at: 6120, text: "→ Closure — beginning layered closure", type: "phase" },
  { at: 6180, text: "Deep fascial layer — 0 PDS interrupted figure-of-eight", type: "info" },
  { at: 6300, text: "INS-036 Needleholder → patient (deep fascial closure)", type: "info", itemId: "INS-036" },
  { at: 6420, text: "Fascial layer complete — 12 interrupted sutures placed", type: "info" },
  { at: 6480, text: "INS-036 Needleholder ← returned to mayo", type: "ok", itemId: "INS-036" },
  { at: 6540, text: "Subcutaneous layer — 2-0 Vicryl interrupted", type: "info" },
  { at: 6720, text: "INS-038 Mayo Hegar TC → patient (subcutaneous closure)", type: "info", itemId: "INS-038" },
  { at: 6900, text: "Subcutaneous layer complete — good tissue approximation", type: "info" },
  { at: 6960, text: "INS-038 Mayo Hegar TC ← returned to mayo", type: "ok", itemId: "INS-038" },
  { at: 7020, text: "Skin closure — 4-0 Monocryl subcuticular running", type: "info" },
  { at: 7200, text: "Skin closure progressing — medial to lateral", type: "info" },
  { at: 7380, text: "Drain site closure — 3-0 nylon mattress suture", type: "info" },
  { at: 7500, text: "Drain secured and functional — negative suction confirmed", type: "ok" },
  { at: 7620, text: "Skin closure complete — wound edges everted, good alignment", type: "info" },
  { at: 7740, text: "Steri-strips applied — reinforcing skin closure", type: "info" },
  { at: 7860, text: "Sterile dressing applied — Tegaderm over incision line", type: "info" },
  // ── Phase 11: Final Count (7920–8280s) ──
  { at: 7920, text: "→ Final Count — all categories, post-closure verification", type: "phase" },
  { at: 7980, text: "Final count — sponges: 20/20 ✓", type: "ok" },
  { at: 8010, text: "Final count — needles: 12/12 ✓", type: "ok" },
  { at: 8040, text: "Final count — sharps: 7/7 ✓", type: "ok" },
  { at: 8070, text: "Final count — instruments: 128/128 ✓", type: "ok" },
  { at: 8100, text: "Final count — disposables: 4/4 ✓", type: "ok" },
  { at: 8160, text: "FINAL COUNT BALANCED ✓ — 169/169, all categories verified", type: "ok" },
  { at: 8220, text: "Count documentation complete — signed by Scrub Tech and Circulator", type: "gate" },
  // ── Phase 12: Emergence (8280–8880s) ──
  { at: 8280, text: "→ Emergence — anesthesia reversal initiated", type: "phase" },
  { at: 8340, text: "Sugammadex 200mg IV administered — reversing neuromuscular blockade", type: "info" },
  { at: 8460, text: "Sevoflurane discontinued — transitioning to spontaneous ventilation", type: "info" },
  { at: 8520, text: "Patient showing spontaneous respiratory effort — tidal volume increasing", type: "info" },
  { at: 8640, text: "Patient responding to verbal commands — following instructions", type: "ok" },
  { at: 8700, text: "Extubation complete — patient breathing on own, SpO2 98%", type: "ok" },
  { at: 8760, text: "Post-extubation vitals: BP 124/78, HR 72, SpO2 98%, RR 14", type: "info" },
  { at: 8820, text: "Patient alert and oriented — pain score 3/10 with regional block", type: "ok" },
  // ── Phase 13: Patient Out (8880–9060s) ──
  { at: 8880, text: "→ Patient Out — transfer to recovery", type: "phase" },
  { at: 8910, text: "Patient moved from OR table to stretcher — all lines secured", type: "info" },
  { at: 8940, text: "Monitors transferred — continuous SpO2, ECG, BP", type: "info" },
  { at: 8970, text: "PACU handoff — report given to recovery nurse", type: "info" },
  { at: 9000, text: "Patient out of OR — procedure duration: 2h 28min, EBL 350cc", type: "ok" },
  { at: 9030, text: "Operative note dictated — specimens logged", type: "info" },
  // ── Phase 14: Turnover (9060–10560s) ──
  { at: 9060, text: "→ Turnover — room reset initiated", type: "phase" },
  { at: 9120, text: "Drapes and disposables removed — biohazard bags sealed", type: "info" },
  { at: 9240, text: "Instruments collected from mayo stand — placed in transport trays", type: "info" },
  { at: 9360, text: "Back table instruments collected — all 81 items accounted", type: "info" },
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

// ═══════════════════════════════════════════════════════════
// 8. TRANSCRIPTION — audio capture (offsets in seconds)
//    speaker: name, type: sys|speech|alert
// ═══════════════════════════════════════════════════════════
export const TRANSCRIPTION = {
  // Pre-procedure (static — always shown)
  static: [
    { at: -2071, speaker: "System",     text: "Audio capture started — 2 microphones active", type: "sys" },
    { at: -2071, speaker: "Circulator",  text: "Good morning everyone, we're setting up for the mastectomy case.", type: "speech" },
    { at: -1951, speaker: "Scrub Tech",  text: "Five trays opened. Starting instrument count.", type: "speech" },
    { at: -1099, speaker: "Scrub Tech",  text: "Initial count: 169 pieces across 66 types.", type: "speech" },
    { at: -859,  speaker: "Circulator",  text: "Count is balanced. 169 out of 169. Documented.", type: "speech" },
    { at: -835,  speaker: "Circulator",  text: "Patient is in the room. ID verified.", type: "speech" },
    { at: -715,  speaker: "Anesthesia",  text: "Starting induction. Propofol going in now.", type: "speech" },
    { at: -595,  speaker: "Anesthesia",  text: "Patient is under. Vitals stable.", type: "speech" },
    { at: -190,  speaker: "Physician A", text: "Let's do the time out. Patient, procedure, site.", type: "speech" },
    { at: -160,  speaker: "Circulator",  text: "Confirmed. Modified radical mastectomy, left side.", type: "speech" },
    { at: 0,     speaker: "Physician A", text: "Knife please. Making the incision.", type: "speech" },
    { at: 360,   speaker: "Physician A", text: "Metz and DeBakey. Starting the dissection.", type: "speech" },
    { at: 300,   speaker: "Scrub Tech",  text: "Raytec down! Dropped on the floor.", type: "alert" },
    { at: 300,   speaker: "Circulator",  text: "Got it. Recovered. Noted in count.", type: "speech" },
    { at: 720,   speaker: "Circulator",  text: "Mid-case tray added. Count updated.", type: "speech" },
  ],
  // Live — appear as elapsed time passes
  live: [
    { at: 5,   speaker: "Physician A", text: "Careful with the lateral dissection here, I can see the pectoral fascia." },
    { at: 15,  speaker: "Scrub Tech",  text: "Bovie tip back to you, doctor." },
    { at: 25,  speaker: "Physician A", text: "Thank you. Switching to coag mode." },
    { at: 35,  speaker: "Circulator",  text: "Vitals stable. BP 118/72, heart rate 64." },
    { at: 50,  speaker: "Physician A", text: "I need another Allis clamp on this skin flap." },
    { at: 60,  speaker: "Scrub Tech",  text: "Allis from back table — handing now." },
    { at: 75,  speaker: "Anesthesia",  text: "Redosing antibiotics at the one-hour mark." },
    { at: 90,  speaker: "Physician A", text: "Good. The axillary dissection is going well. Sentinel node identified." },
    { at: 110, speaker: "Circulator",  text: "Specimen container is labeled and ready." },
    { at: 125, speaker: "Physician A", text: "Cutting the sentinel node now. Metzenbaum please." },
    { at: 140, speaker: "Scrub Tech",  text: "Metzenbaum scissors." },
    { at: 150, speaker: "Physician A", text: "Sentinel node is out. Send it to pathology, frozen section." },
    { at: 160, speaker: "Circulator",  text: "Specimen passed off. Calling pathology now." },
    { at: 180, speaker: "Physician A", text: "While we wait, let's continue with the mastectomy dissection." },
    { at: 200, speaker: "Anesthesia",  text: "Patient stable. SpO2 99, EtCO2 35." },
    { at: 220, speaker: "Physician A", text: "DeBakey forceps and bovie. Dissecting the inferior flap." },
    { at: 240, speaker: "Scrub Tech",  text: "Lap sponge please — there's some oozing inferiorly." },
    { at: 260, speaker: "Physician A", text: "Mosquito clamp on that bleeder. Tie it off." },
    { at: 280, speaker: "Circulator",  text: "Pathology on the line — sentinel node is negative." },
    { at: 290, speaker: "Physician A", text: "Excellent news. We can proceed without full axillary dissection." },
    { at: 310, speaker: "Physician A", text: "Almost done with the mastectomy. Kelly clamp on that pedicle." },
    { at: 330, speaker: "Scrub Tech",  text: "Running count: 3 sponges disposed so far. 6 remaining on mayo." },
    { at: 350, speaker: "Physician A", text: "Good. Let's start preparing for the reconstruction phase." },
    { at: 370, speaker: "Circulator",  text: "Plastic surgery team notified. Physician B is scrubbing in." },
    { at: 390, speaker: "Physician A", text: "Specimen is fully resected. Marking the margins — superior, inferior, medial, lateral." },
    { at: 410, speaker: "Scrub Tech",  text: "Sutures for margin marking ready." },
    { at: 430, speaker: "Physician A", text: "Irrigating the wound bed now. Normal saline." },
    { at: 450, speaker: "Anesthesia",  text: "Adjusting ventilator. Tidal volume up slightly." },
    { at: 470, speaker: "Circulator",  text: "Estimated blood loss so far: 150cc." },
    { at: 490, speaker: "Physician A", text: "That's well within range. Hemostasis looks good." },
    { at: 510, speaker: "Physician A", text: "Now let's start the reconstruction. Tissue expander coming in." },
    { at: 540, speaker: "Scrub Tech",  text: "Expander is prepped and ready." },
    { at: 570, speaker: "Physician A", text: "Creating the pocket now. Need the Bovie on cut mode." },
    { at: 600, speaker: "Scrub Tech",  text: "Olsen Hegar from back table — for the closure." },
    { at: 630, speaker: "Physician A", text: "Good. Pocket looks adequate. Inserting the expander." },
    { at: 660, speaker: "Physician A", text: "Expander is in place. Let me check the position." },
    { at: 690, speaker: "Physician A", text: "Position looks good. Starting the fill — 150cc saline." },
    { at: 720, speaker: "Anesthesia",  text: "Patient stable throughout. No issues." },
    { at: 750, speaker: "Physician A", text: "Fill complete. Good symmetry. Let's close." },
    { at: 780, speaker: "Scrub Tech",  text: "All instruments accounted for at running count." },
    { at: 810, speaker: "Physician A", text: "Starting deep closure. 2-0 Vicryl on the Mayo Hegar." },
    { at: 840, speaker: "Circulator",  text: "Documenting — tissue expander placed, 150cc fill." },
    { at: 870, speaker: "Physician A", text: "Deep layer is coming together nicely." },
    { at: 900, speaker: "Physician A", text: "Second layer now. Need the Crile Wood needleholder." },
    { at: 930, speaker: "Scrub Tech",  text: "Crile Wood TC, 7 inch." },
    { at: 960, speaker: "Physician A", text: "Good. Subcutaneous closure with 3-0 Monocryl." },
    { at: 990, speaker: "Anesthesia",  text: "Starting to lighten anesthesia. ETA to emergence?" },
    { at: 1020,speaker: "Physician A", text: "About 20 more minutes for skin closure and drain." },
    { at: 1050,speaker: "Physician A", text: "Blood loss update — estimated 200cc total. No transfusion needed." },
    { at: 1080,speaker: "Physician A", text: "Now the skin closure. 4-0 Monocryl subcuticular." },
    { at: 1110,speaker: "Scrub Tech",  text: "4-0 Monocryl loaded." },
    { at: 1140,speaker: "Physician A", text: "Running subcuticular closure going well." },
    { at: 1200,speaker: "Physician A", text: "Almost done with the skin. Need to place the drain." },
    { at: 1260,speaker: "Scrub Tech",  text: "JP drain ready." },
    { at: 1320,speaker: "Physician A", text: "Drain is in. Securing with a 2-0 nylon." },
    { at: 1380,speaker: "Physician A", text: "Closure complete. Let's do the final count." },
    { at: 1410,speaker: "Scrub Tech",  text: "Starting final count now." },
    { at: 1440,speaker: "Physician A", text: "Steri-strips and dressing going on." },
    // ── Continued Procedure Phase (1500–5400s) ──
    { at: 1500,speaker: "Physician A", text: "Now let's focus on the subpectoral pocket. I need more exposure here." },
    { at: 1530,speaker: "Physician B",    text: "I'll hold the pectoralis up for you." },
    { at: 1560,speaker: "Physician A", text: "Good. Bovie on coag, I'm going to release the inferior attachments." },
    { at: 1620,speaker: "Scrub Tech",  text: "Right angle clamp." },
    { at: 1680,speaker: "Physician A", text: "Thank you. That perforator is ligated. Right angle back." },
    { at: 1740,speaker: "Anesthesia",  text: "Thirty minutes in. Vitals unchanged. BP 120/74, pulse 66." },
    { at: 1800,speaker: "Circulator",  text: "Running count at 30 minutes — everything balanced. 169 out of 169." },
    { at: 1860,speaker: "Scrub Tech",  text: "Opening a lap pack — adding 5 sponges to the count." },
    { at: 1920,speaker: "Physician A", text: "DeBakey please. I need to dissect around this vessel." },
    { at: 1980,speaker: "Physician A", text: "Pocket is coming along nicely. Good muscle coverage superiorly." },
    { at: 2040,speaker: "Physician B",    text: "The inferior pole looks good. Plenty of room for the expander." },
    { at: 2100,speaker: "Scrub Tech",  text: "Gauze to waste — blood-soaked." },
    { at: 2160,speaker: "Physician A", text: "Let me irrigate the pocket before we place the expander." },
    { at: 2220,speaker: "Physician A", text: "Mosquito on that small bleeder. Quick cautery." },
    { at: 2280,speaker: "Anesthesia",  text: "Redosing cefazolin now — one-hour mark for redose." },
    { at: 2340,speaker: "Physician A", text: "Good. Pocket is irrigated. Antibiotic saline soak for the expander." },
    { at: 2400,speaker: "Scrub Tech",  text: "Expander soaking in bacitracin solution. Ready when you are." },
    { at: 2460,speaker: "Physician A", text: "Let's place it. Hand me the expander — careful, no-touch technique." },
    { at: 2520,speaker: "Physician A", text: "Expander is in. Orienting the fill port laterally." },
    { at: 2580,speaker: "Physician B",    text: "Position looks centered. Good projection." },
    { at: 2640,speaker: "Physician A", text: "Starting the fill. 200cc normal saline going in." },
    { at: 2700,speaker: "Physician A", text: "Hold on — I see a bleeder. Lateral thoracic branch." },
    { at: 2730,speaker: "Scrub Tech",  text: "Bipolar forceps." },
    { at: 2760,speaker: "Physician A", text: "Got it. Bipolar on that vessel. Hemostasis confirmed." },
    { at: 2820,speaker: "Physician A", text: "Joseph hook back to mayo. I don't need it anymore." },
    { at: 2880,speaker: "Physician B",    text: "The fill looks symmetric from this angle." },
    { at: 2940,speaker: "Circulator",  text: "Lap pack disposed and documented." },
    { at: 3000,speaker: "Circulator",  text: "EBL update — 280cc. Still within acceptable range." },
    { at: 3060,speaker: "Anesthesia",  text: "Copy that. No concerns from my end. Hemodynamically stable." },
    { at: 3120,speaker: "Physician A", text: "Needleholder back to mayo. I'll switch to the PDS for the ADM." },
    { at: 3180,speaker: "Scrub Tech",  text: "2-0 PDS on an RB-1, loaded and ready." },
    { at: 3240,speaker: "Physician A", text: "Now the acellular dermal matrix. Let's shape it for the lower pole." },
    { at: 3300,speaker: "Physician B",    text: "I'll hold the expander in position while you suture the ADM." },
    { at: 3360,speaker: "Scrub Tech",  text: "SH needle to sharps — disposed." },
    { at: 3420,speaker: "Physician A", text: "Securing the ADM to the chest wall. Interrupted PDS sutures." },
    { at: 3480,speaker: "Physician A", text: "First row of sutures is in. Good coverage of the lower pole." },
    { at: 3540,speaker: "Physician B",    text: "ADM is sitting nicely. No tension on the suture line." },
    { at: 3600,speaker: "Circulator",  text: "Running count at 60 minutes — still balanced. 169 out of 169." },
    { at: 3660,speaker: "Physician A", text: "Excellent. Let me finish the lateral row of the ADM." },
    { at: 3720,speaker: "Physician A", text: "Adjusting the fill to 250cc. Let's check projection." },
    { at: 3780,speaker: "Anesthesia",  text: "One hour in. All vitals within normal limits." },
    { at: 3840,speaker: "Physician A", text: "Adson forceps — checking the skin flap thickness." },
    { at: 3900,speaker: "Physician A", text: "Flap viability looks excellent. Good capillary refill." },
    { at: 3960,speaker: "Scrub Tech",  text: "Blade number 10 to sharps container." },
    { at: 4020,speaker: "Physician A", text: "Final irrigation now. Warm saline with bacitracin." },
    { at: 4080,speaker: "Physician B",    text: "I can help with the drain placement when you're ready." },
    { at: 4140,speaker: "Physician A", text: "Let me just check hemostasis one more time. Field is dry." },
    { at: 4200,speaker: "Circulator",  text: "EBL update — 350cc total. No transfusion needed." },
    { at: 4260,speaker: "Physician A", text: "Good. Reconstruction looks solid. Symmetry is acceptable." },
    { at: 4320,speaker: "Physician A", text: "Let's check from the patient's perspective — yes, good contour." },
    { at: 4440,speaker: "Physician A", text: "Freeman retractor back. We don't need retraction anymore." },
    { at: 4560,speaker: "Physician A", text: "Richardson back to mayo as well." },
    { at: 4680,speaker: "Physician A", text: "Now the drain. 15 French Blake, tunneled inferiorly." },
    { at: 4740,speaker: "Physician B",    text: "I'll pull it through the stab incision." },
    { at: 4800,speaker: "Physician A", text: "Drain is in, suction is working. Good output." },
    { at: 4860,speaker: "Anesthesia",  text: "Patient remains stable. Approaching the 80-minute mark." },
    { at: 4920,speaker: "Physician A", text: "Checking skin flap viability one final time — looks great." },
    { at: 5040,speaker: "Physician A", text: "All clamps are off the field. Lahey back to mayo." },
    { at: 5100,speaker: "Physician A", text: "We're about ready for the pre-closure count. Let's get everything off the patient." },
    { at: 5160,speaker: "Scrub Tech",  text: "Clearing the field — all instruments returning to mayo and back table." },
    { at: 5220,speaker: "Physician A", text: "Field is dry, no active bleeding. Ready for count." },
    { at: 5340,speaker: "Physician A", text: "Mosquito clamps back to mayo. All instruments off the patient." },
    // ── Pre-Close Count (5400–5880s) ──
    { at: 5400,speaker: "Circulator",  text: "Let's start the pre-closure count. All work stopped." },
    { at: 5430,speaker: "Scrub Tech",  text: "Counting Mayo Stand. Sponges first." },
    { at: 5460,speaker: "Scrub Tech",  text: "Lap sponges — five. Gauze pads — ten. Raytec — five. All matched." },
    { at: 5490,speaker: "Circulator",  text: "Sponges confirmed — 20 out of 20." },
    { at: 5520,speaker: "Scrub Tech",  text: "Needles — CT-1 four, SH three, Keith two, RB-1 three. That's twelve." },
    { at: 5550,speaker: "Circulator",  text: "Sharps — blade 10 two, blade 15 one, blade 11 one, trocars three. Seven total." },
    { at: 5580,speaker: "Scrub Tech",  text: "Mayo stand instruments — eighty-eight items all present." },
    { at: 5640,speaker: "Circulator",  text: "Back table — eighty-one items verified. All accounted." },
    { at: 5700,speaker: "Scrub Tech",  text: "Checking waste — cross-referencing disposed items with the count sheet." },
    { at: 5760,speaker: "Circulator",  text: "Patient zone clear — zero retained items confirmed visually and by camera." },
    { at: 5820,speaker: "Circulator",  text: "All zones verified. Submitting for count resolution." },
    // ── Count Resolution (5880–6000s) ──
    { at: 5880,speaker: "Circulator",  text: "Count resolution — comparing totals against baseline." },
    { at: 5910,speaker: "Scrub Tech",  text: "Sponges 20 of 20. Needles 12 of 12." },
    { at: 5940,speaker: "Circulator",  text: "Sharps 7 of 7. Instruments 128 of 128. Disposables 4 of 4." },
    { at: 5970,speaker: "Circulator",  text: "Count balanced — 169 out of 169. All categories reconciled." },
    { at: 5990,speaker: "Physician A", text: "Thank you. Count is balanced. Let me look at the reconstruction one more time." },
    // ── Surgeon Decision (6000–6120s) ──
    { at: 6000,speaker: "Physician A", text: "Assessing the expander position and symmetry one final time." },
    { at: 6030,speaker: "Physician B",    text: "Projection looks even. The ADM is holding well." },
    { at: 6060,speaker: "Physician A", text: "I'm satisfied with the reconstruction. Let's proceed with closure." },
    { at: 6090,speaker: "Physician A", text: "Closure plan: PDS for fascia, Vicryl for subcutaneous, Monocryl for skin." },
    // ── Closure (6120–7920s) ──
    { at: 6120,speaker: "Physician A", text: "Starting closure. 0 PDS for the deep fascial layer, figure-of-eight." },
    { at: 6180,speaker: "Scrub Tech",  text: "0 PDS loaded on Mayo Hegar." },
    { at: 6240,speaker: "Physician B",    text: "I'll hold the edges for you with the Adsons." },
    { at: 6300,speaker: "Physician A", text: "First suture going in. Good tissue bite." },
    { at: 6420,speaker: "Physician A", text: "Fascial layer complete — twelve interrupted sutures. Holding well." },
    { at: 6480,speaker: "Scrub Tech",  text: "Needleholder back to mayo. Loading 2-0 Vicryl next." },
    { at: 6540,speaker: "Physician A", text: "Subcutaneous layer now. 2-0 Vicryl interrupted." },
    { at: 6600,speaker: "Physician A", text: "Taking good bites of Scarpa's fascia. Reducing dead space." },
    { at: 6720,speaker: "Scrub Tech",  text: "Mayo Hegar TC from back table — loaded with Vicryl." },
    { at: 6840,speaker: "Physician A", text: "Subcutaneous layer coming together. Good approximation." },
    { at: 6900,speaker: "Physician A", text: "Subcutaneous done. Skin edges look well-perfused." },
    { at: 6960,speaker: "Scrub Tech",  text: "Needleholder back. Loading 4-0 Monocryl for skin." },
    { at: 7020,speaker: "Physician A", text: "Starting the subcuticular closure. Running 4-0 Monocryl." },
    { at: 7080,speaker: "Physician B",    text: "Want me to follow with the Adsons for counter-traction?" },
    { at: 7140,speaker: "Physician A", text: "Yes, please. Keep the edges everted as I go." },
    { at: 7200,speaker: "Physician A", text: "Running from medial to lateral. Closure is going smoothly." },
    { at: 7320,speaker: "Anesthesia",  text: "How much longer for the skin? I'll plan the emergence." },
    { at: 7380,speaker: "Physician A", text: "About 10 more minutes. Also need to secure the drain site." },
    { at: 7440,speaker: "Physician A", text: "3-0 nylon mattress suture at the drain exit site." },
    { at: 7500,speaker: "Physician A", text: "Drain is secured. Suction confirmed — negative pressure holding." },
    { at: 7560,speaker: "Physician B",    text: "Skin closure looks excellent. Edges are nicely everted." },
    { at: 7620,speaker: "Physician A", text: "Subcuticular closure complete. Trimming the tail." },
    { at: 7680,speaker: "Scrub Tech",  text: "Mayo scissors for the suture trim." },
    { at: 7740,speaker: "Physician A", text: "Applying steri-strips now. Every centimeter along the incision." },
    { at: 7800,speaker: "Physician A", text: "Tegaderm over the incision line. Dressing complete." },
    { at: 7860,speaker: "Circulator",  text: "Closure documented. Proceeding to final count." },
    // ── Final Count (7920–8280s) ──
    { at: 7920,speaker: "Circulator",  text: "Final count — post-closure verification. Let's go through everything." },
    { at: 7950,speaker: "Scrub Tech",  text: "Sponges: lap sponges five, gauze pads ten, raytec five — twenty total." },
    { at: 7980,speaker: "Circulator",  text: "Sponges — twenty out of twenty. Confirmed." },
    { at: 8010,speaker: "Scrub Tech",  text: "Needles: CT-1 four, SH three, Keith two, RB-1 three — twelve." },
    { at: 8040,speaker: "Circulator",  text: "Needles twelve out of twelve. Sharps — seven out of seven." },
    { at: 8070,speaker: "Scrub Tech",  text: "Instruments — one hundred twenty-eight total across all trays." },
    { at: 8100,speaker: "Circulator",  text: "Disposables — four out of four." },
    { at: 8130,speaker: "Circulator",  text: "Final count balanced — 169 out of 169. All categories verified." },
    { at: 8160,speaker: "Scrub Tech",  text: "Count sheet signed. Both signatures on the record." },
    { at: 8220,speaker: "Physician A", text: "Final count is balanced. Excellent work, everyone." },
    // ── Emergence (8280–8880s) ──
    { at: 8280,speaker: "Anesthesia",  text: "Beginning emergence. Turning off sevoflurane now." },
    { at: 8340,speaker: "Anesthesia",  text: "Sugammadex 200mg IV — reversing the neuromuscular blockade." },
    { at: 8400,speaker: "Circulator",  text: "Warming blanket on the patient." },
    { at: 8460,speaker: "Anesthesia",  text: "Spontaneous breaths returning. Tidal volume coming up." },
    { at: 8520,speaker: "Anesthesia",  text: "Patient is breathing on their own. Good respiratory effort." },
    { at: 8580,speaker: "Anesthesia",  text: "Train-of-four is 4 out of 4. Full reversal confirmed." },
    { at: 8640,speaker: "Anesthesia",  text: "Patient is following commands. Squeezing my hand." },
    { at: 8700,speaker: "Anesthesia",  text: "Extubating now. Tube is out. SpO2 holding at 98." },
    { at: 8760,speaker: "Anesthesia",  text: "Post-extubation vitals: BP 124 over 78, heart rate 72, SpO2 98." },
    { at: 8820,speaker: "Anesthesia",  text: "Patient is alert and oriented. Pain score 3 out of 10 with the block." },
    // ── Patient Out (8880–9060s) ──
    { at: 8880,speaker: "Circulator",  text: "Moving the patient to the stretcher. Everyone help with the transfer." },
    { at: 8910,speaker: "Circulator",  text: "Lines and drain secured. Nothing caught on the rails." },
    { at: 8940,speaker: "Anesthesia",  text: "Monitors reconnected on the stretcher. All readings stable." },
    { at: 8970,speaker: "Circulator",  text: "PACU nurse is here. Giving the handoff report." },
    { at: 9000,speaker: "Circulator",  text: "Patient is out. Procedure time was 2 hours 28 minutes. EBL 350cc." },
    { at: 9030,speaker: "Physician A", text: "Good work everyone. Great team effort today. I'll go dictate the note." },
    // ── Turnover (9060–10560s) ──
    { at: 9060,speaker: "Circulator",  text: "Starting room turnover. Let's get this cleaned up for the next case." },
    { at: 9120,speaker: "Scrub Tech",  text: "Pulling the drapes. Everything into the biohazard bags." },
    { at: 9240,speaker: "Scrub Tech",  text: "Collecting instruments from the mayo stand. Into the transport trays." },
    { at: 9360,speaker: "Scrub Tech",  text: "Back table instruments collected — all eighty-one items." },
    { at: 9480,speaker: "Scrub Tech",  text: "Instrument trays are closed. Calling for transport to SPD." },
    { at: 9600,speaker: "Circulator",  text: "Sharps containers are full — sealing and replacing." },
    { at: 9720,speaker: "Circulator",  text: "Wiping down the OR table. Enzymatic cleaner first." },
    { at: 9840,speaker: "Circulator",  text: "All surfaces cleaned with the EPA-registered disinfectant." },
    { at: 9960,speaker: "Circulator",  text: "Floor is being mopped — clean to dirty, just like protocol." },
    { at: 10080,speaker: "Circulator", text: "Equipment wiped and repositioned. Bovie and suction back in place." },
    { at: 10200,speaker: "Circulator", text: "Fresh linens are on. New drapes staged for the next case." },
    { at: 10320,speaker: "Scrub Tech", text: "Supply cart restocked — sutures, sponges, and gloves." },
    { at: 10440,speaker: "Circulator", text: "Room inspection done. Charge nurse verified — we're good." },
    { at: 10560,speaker: "Circulator", text: "Room is ready for the next case. Turnover time: 25 minutes." },
  ],
};

// ═══════════════════════════════════════════════════════════
// 9. COMPLIANCE DATA
// ═══════════════════════════════════════════════════════════
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
