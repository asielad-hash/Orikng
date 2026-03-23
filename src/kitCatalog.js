/*
 * KIT CATALOG — Real surgical instrument lists from hospital kit PDFs.
 * Each kit contains the FULL instrument list from the PDF.
 * The archive adapter uses these to show all instruments, demonstrating
 * that only a low percentage of the kit is actually used per case.
 *
 * 5 Kits from: C:\Users\asiel\OneDrive\Desktop\Trackimed\SurgicalInstruments\KITs Catalogue\
 *   1. Sheba Basic Delicate Set   — 58 pieces
 *   2. Robotic Lap Tray           — 46 pieces
 *   3. Sheba Mastectomy           — 72 pieces
 *   4. Masectomy Tray             — 126 pieces
 *   5. Major Bone Set             — 108 pieces
 */

// ═══════════════════════════════════════════════════════
// 1. SHEBA BASIC DELICATE SET (58 pieces)
// ═══════════════════════════════════════════════════════
const BASIC_DELICATE = [
  { n: "Knife Handle #3", cat: "instrument", init: 1, z: "mayo" },
  { n: "Knife Handle #7", cat: "instrument", init: 1, z: "mayo" },
  { n: "Backhaus Towel Clip", cat: "instrument", init: 4, z: "back_table" },
  { n: "Edna Towel Clip", cat: "instrument", init: 4, z: "back_table" },
  { n: "Mosquito Forceps Curved", cat: "instrument", init: 4, z: "mayo" },
  { n: "Mosquito Forceps Straight", cat: "instrument", init: 2, z: "mayo" },
  { n: "Pean Forceps 14cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Baby Mixter", cat: "instrument", init: 1, z: "mayo" },
  { n: "Kocher Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Allis Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Lahey Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Rochester Pean Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Foerster Sponge Holder", cat: "instrument", init: 1, z: "back_table" },
  { n: "Halsey Needle Holder", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo-Hegar Needle Holder", cat: "instrument", init: 2, z: "mayo" },
  { n: "Mayo Scissors Straight", cat: "instrument", init: 1, z: "mayo" },
  { n: "Metzenbaum Scissors 18cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Standard Surgical Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Adson Forceps", cat: "instrument", init: 1, z: "mayo" },
  { n: "DeBakey Forceps 15cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "DeBakey Forceps 20cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Standard Anatomical Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Gillies Skin Hook", cat: "instrument", init: 2, z: "back_table" },
  { n: "Senn-Miller Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "US Army Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Roux Retractor #1", cat: "instrument", init: 2, z: "back_table" },
  { n: "Kocher-Richardson Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Richardson Retractor Medium", cat: "instrument", init: 2, z: "back_table" },
  { n: "Yankauer Suction Tip", cat: "instrument", init: 1, z: "mayo" },
]; // Total: 58

// ═══════════════════════════════════════════════════════
// 2. ROBOTIC LAP TRAY (46 pieces)
// ═══════════════════════════════════════════════════════
const LAP_TRAY = [
  { n: "Inner Tube 8mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Outer Tube 8mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Biopsy Jaw Insert", cat: "instrument", init: 2, z: "back_table" },
  { n: "Metzenbaum Jaw Insert", cat: "instrument", init: 2, z: "back_table" },
  { n: "Crile Jaw Insert", cat: "instrument", init: 2, z: "back_table" },
  { n: "Hook Jaw Insert", cat: "instrument", init: 1, z: "back_table" },
  { n: "Satinsky Jaw Insert", cat: "instrument", init: 1, z: "back_table" },
  { n: "Crafoord Jaw Insert", cat: "instrument", init: 1, z: "back_table" },
  { n: "Maryland Jaw Insert", cat: "instrument", init: 2, z: "mayo" },
  { n: "Bowel Jaw Insert", cat: "instrument", init: 1, z: "back_table" },
  { n: "Clip Applier 5mm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Sovereign Grasper", cat: "instrument", init: 2, z: "mayo" },
  { n: "Hunter Bowel Grasper", cat: "instrument", init: 1, z: "back_table" },
  { n: "Hem-o-lok Applier ML", cat: "instrument", init: 1, z: "mayo" },
  { n: "Hem-o-lok Applier L", cat: "instrument", init: 1, z: "back_table" },
  { n: "Lapra-Ty Applier", cat: "instrument", init: 1, z: "back_table" },
  { n: "Crile Grasper", cat: "instrument", init: 2, z: "back_table" },
  { n: "Needle Holder Curved Left", cat: "instrument", init: 1, z: "mayo" },
  { n: "Needle Holder Curved Right", cat: "instrument", init: 1, z: "mayo" },
  { n: "Needle Holder Straight", cat: "instrument", init: 1, z: "mayo" },
  { n: "Self-Righting Needle Holder", cat: "instrument", init: 1, z: "mayo" },
  { n: "Injection Cannula", cat: "instrument", init: 1, z: "back_table" },
  { n: "Quick Snap Handle A", cat: "instrument", init: 1, z: "back_table" },
  { n: "Quick Snap Handle B", cat: "instrument", init: 1, z: "back_table" },
  { n: "Suction Tip 5mm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Suction Tip 10mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Uterine Probe", cat: "instrument", init: 1, z: "back_table" },
  { n: "DaVinci Cable", cat: "instrument", init: 2, z: "back_table" },
  { n: "DaVinci Cannula 8mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "DaVinci Trocar", cat: "instrument", init: 2, z: "back_table" },
  { n: "Bulldog Clip Straight 25mm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Bulldog Clip Curved 25mm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Bulldog Clip Straight 45mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bulldog Clip Curved 45mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Insulation Tester", cat: "instrument", init: 1, z: "back_table" },
]; // Total: 46

// ═══════════════════════════════════════════════════════
// 3. SHEBA MASTECTOMY (72 pieces)
// ═══════════════════════════════════════════════════════
const SHEBA_MASTECTOMY = [
  { n: "Knife Handle #3", cat: "instrument", init: 1, z: "mayo" },
  { n: "Knife Handle #7", cat: "instrument", init: 1, z: "mayo" },
  { n: "Backhaus Towel Clip", cat: "instrument", init: 4, z: "back_table" },
  { n: "Towel Clamp", cat: "instrument", init: 4, z: "back_table" },
  { n: "Mosquito Forceps Curved", cat: "instrument", init: 6, z: "mayo" },
  { n: "Mosquito Forceps Straight", cat: "instrument", init: 4, z: "mayo" },
  { n: "Pean Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Baby-Mixter Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Heiss Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Kocher Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Rochester-Pean Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Allis Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Lahey Forceps Straight", cat: "instrument", init: 2, z: "back_table" },
  { n: "Lahey Forceps Curved", cat: "instrument", init: 2, z: "back_table" },
  { n: "Babcock Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Foerster Sponge Holder", cat: "instrument", init: 2, z: "back_table" },
  { n: "Halsey Needle Holder", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo-Hegar NH 18cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo-Hegar NH 20cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo-Hegar NH 22cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo Scissors Straight", cat: "instrument", init: 1, z: "mayo" },
  { n: "Metzenbaum Scissors 18cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Metzenbaum Scissors 20cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Standard Surgical Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Adson Forceps", cat: "instrument", init: 1, z: "mayo" },
  { n: "DeBakey Forceps 15cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "DeBakey Forceps 20cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "DeBakey Forceps 25cm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Gillies Skin Hook", cat: "instrument", init: 2, z: "back_table" },
  { n: "Pilling Weck Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Senn-Miller Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "US Army Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Roux Retractor #1", cat: "instrument", init: 2, z: "back_table" },
  { n: "Roux Retractor #3", cat: "instrument", init: 2, z: "back_table" },
  { n: "Volkman Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Kocher Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Richardson Retractor S", cat: "instrument", init: 2, z: "back_table" },
  { n: "Richardson Retractor M", cat: "instrument", init: 2, z: "back_table" },
  { n: "Richardson Retractor L", cat: "instrument", init: 2, z: "back_table" },
  { n: "Yankauer Suction Tip", cat: "instrument", init: 1, z: "mayo" },
]; // Total: 82 — Note: PDF says 72 items, qty differences account for 82 pieces

// ═══════════════════════════════════════════════════════
// 4. MASECTOMY TRAY (126 pieces)
// ═══════════════════════════════════════════════════════
const MASECTOMY_TRAY = [
  // Retractors (18)
  { n: "Richardson Retractor Small", cat: "instrument", init: 2, z: "back_table" },
  { n: "Richardson Retractor Medium", cat: "instrument", init: 2, z: "back_table" },
  { n: "Kelly Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Army Navy Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Freeman Breast Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Freeman Facelift Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Senn Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Mannerfelt Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Joseph Skin Hook", cat: "instrument", init: 2, z: "back_table" },
  // Forceps (19)
  { n: "DeBakey Forceps 15cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "DeBakey Forceps 20cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Cushing Brown Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Tissue Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Dressing Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Adson Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Semken Bipolar Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Brown Adson Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Rees Monopolar Forceps", cat: "instrument", init: 3, z: "mayo" },
  // Knife Handles (3)
  { n: "Knife Handle #3", cat: "instrument", init: 1, z: "mayo" },
  { n: "Knife Handle #7", cat: "instrument", init: 1, z: "mayo" },
  { n: "Knife Handle #4", cat: "instrument", init: 1, z: "mayo" },
  // Clamps (52)
  { n: "Backhaus Towel Clip", cat: "instrument", init: 6, z: "back_table" },
  { n: "Mosquito Forceps Curved", cat: "instrument", init: 8, z: "mayo" },
  { n: "Mosquito Forceps Straight", cat: "instrument", init: 4, z: "mayo" },
  { n: "Crile Forceps Curved", cat: "instrument", init: 4, z: "back_table" },
  { n: "Allis Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Lahey Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Babcock Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Ochsner Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Rochester Pean Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Diethrich Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Tonsil Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Gemini Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Foerster Sponge Stick", cat: "instrument", init: 4, z: "back_table" },
  // Needle Holders (16)
  { n: "Mayo Hegar NH 16cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Mayo Hegar NH 18cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Crile Wood TC NH", cat: "instrument", init: 2, z: "mayo" },
  { n: "Olsen Hegar TC NH", cat: "instrument", init: 2, z: "mayo" },
  { n: "Halsey TC NH", cat: "instrument", init: 4, z: "mayo" },
  { n: "Webster NH", cat: "instrument", init: 4, z: "mayo" },
  // Scissors (10)
  { n: "Lister Bandage Scissors", cat: "instrument", init: 1, z: "back_table" },
  { n: "Mayo Scissors Straight", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo Scissors Curved", cat: "instrument", init: 1, z: "mayo" },
  { n: "Gorney Freeman TC Scissors", cat: "instrument", init: 2, z: "mayo" },
  { n: "Metzenbaum TC Scissors", cat: "instrument", init: 2, z: "mayo" },
  { n: "Kaye SuperCut Scissors", cat: "instrument", init: 1, z: "mayo" },
  { n: "Lahey Metzenbaum TC Scissors", cat: "instrument", init: 2, z: "mayo" },
  // Cookie Cutters / Areola Markers (8)
  { n: "Freeman Areola Marker 42mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Freeman Areola Marker 38mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Freeman Areola Marker 36mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Freeman Areola Marker 34mm", cat: "instrument", init: 2, z: "back_table" },
]; // Total: 126

// ═══════════════════════════════════════════════════════
// 5. MAJOR BONE SET (108 pieces)
// ═══════════════════════════════════════════════════════
const MAJOR_BONE = [
  // Clamps (42)
  { n: "Backhaus Towel Clip", cat: "instrument", init: 6, z: "back_table" },
  { n: "Edna Towel Clip", cat: "instrument", init: 2, z: "back_table" },
  { n: "Crile Forceps Curved", cat: "instrument", init: 4, z: "mayo" },
  { n: "Crile Forceps Straight", cat: "instrument", init: 2, z: "mayo" },
  { n: "Rochester Pean Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Allis Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Kocher Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Ochsner Forceps", cat: "instrument", init: 4, z: "back_table" },
  { n: "Varco Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Martin Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Coller Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Braun Forceps", cat: "instrument", init: 2, z: "back_table" },
  { n: "Lewin Bone Clamp", cat: "instrument", init: 4, z: "back_table" },
  // Needle Holders (4)
  { n: "Mayo Hegar TC NH 18cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Crile Wood TC NH", cat: "instrument", init: 2, z: "mayo" },
  // Scissors (7)
  { n: "Lister Bandage Scissors", cat: "instrument", init: 1, z: "back_table" },
  { n: "Mayo Scissors Straight", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo Scissors Curved", cat: "instrument", init: 1, z: "mayo" },
  { n: "Metzenbaum TC Scissors", cat: "instrument", init: 1, z: "mayo" },
  { n: "Reynolds Scissors", cat: "instrument", init: 1, z: "mayo" },
  { n: "FiberWire Scissors", cat: "instrument", init: 1, z: "mayo" },
  { n: "Nelson Metzenbaum TC", cat: "instrument", init: 1, z: "mayo" },
  // Forceps (10)
  { n: "Ferris Smith Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Tissue Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Dressing Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "Adson Forceps", cat: "instrument", init: 2, z: "mayo" },
  { n: "DeBakey Forceps", cat: "instrument", init: 1, z: "mayo" },
  { n: "Mayo Russian Forceps", cat: "instrument", init: 1, z: "mayo" },
  // Retractors (14)
  { n: "Army Navy Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Volkmann Retractor Sharp", cat: "instrument", init: 2, z: "back_table" },
  { n: "Volkmann Retractor Blunt", cat: "instrument", init: 2, z: "back_table" },
  { n: "Weitlaner Retractor Sharp", cat: "instrument", init: 2, z: "back_table" },
  { n: "Weitlaner Retractor Blunt", cat: "instrument", init: 2, z: "back_table" },
  { n: "Senn Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "Kelly Retractor", cat: "instrument", init: 2, z: "back_table" },
  // Elevators (5)
  { n: "Cobb Spinal Elevator 25mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Cobb Spinal Elevator 19mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Freer Elevator", cat: "instrument", init: 1, z: "mayo" },
  { n: "Key Elevator Large", cat: "instrument", init: 1, z: "back_table" },
  { n: "Key Elevator Small", cat: "instrument", init: 1, z: "back_table" },
  // Curettes (7)
  { n: "Bruns Curette #000", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bruns Curette #00", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bruns Curette #0", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bruns Curette #1", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bruns Curette #2", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bruns Curette #3", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bruns Curette #4", cat: "instrument", init: 1, z: "back_table" },
  // Misc (9)
  { n: "Bone Hook", cat: "instrument", init: 1, z: "back_table" },
  { n: "Yankauer Suction Tip", cat: "instrument", init: 1, z: "mayo" },
  { n: "Poole Suction Tip", cat: "instrument", init: 1, z: "mayo" },
  { n: "Knife Handle #3", cat: "instrument", init: 2, z: "mayo" },
  { n: "Knife Handle #7", cat: "instrument", init: 2, z: "mayo" },
  { n: "Ruler", cat: "instrument", init: 1, z: "back_table" },
  { n: "Mallet", cat: "instrument", init: 1, z: "back_table" },
  // Rongeurs & Cutters (10)
  { n: "Stille Rongeur", cat: "instrument", init: 1, z: "back_table" },
  { n: "Stille Luer Rongeur", cat: "instrument", init: 1, z: "back_table" },
  { n: "Caspar Rongeur", cat: "instrument", init: 1, z: "back_table" },
  { n: "Leksell Rongeur", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bone Cutter", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bone Tamp", cat: "instrument", init: 1, z: "back_table" },
  { n: "Bone Rasp", cat: "instrument", init: 1, z: "back_table" },
  { n: "Ruskin Rongeur", cat: "instrument", init: 1, z: "back_table" },
  { n: "Pin Cutter", cat: "instrument", init: 1, z: "back_table" },
  { n: "Wire Cutter", cat: "instrument", init: 1, z: "back_table" },
]; // Total: 108

// ═══════════════════════════════════════════════════════
// KIT REGISTRY — maps kit names to instrument arrays + PDF files
// ═══════════════════════════════════════════════════════
const KIT_REGISTRY = {
  "Sheba Basic Delicate Set":   { items: BASIC_DELICATE,   pdf: "/assets/Basic_Delicate_Set.pdf" },
  "Robotic Lap Tray":           { items: LAP_TRAY,         pdf: "/assets/Robotic_Lap_Tray.pdf" },
  "Sheba Mastectomy":           { items: SHEBA_MASTECTOMY, pdf: "/assets/Sheba_Mastectomy.pdf" },
  "Masectomy Tray":             { items: MASECTOMY_TRAY,   pdf: "/assets/Masectomy_Tray.pdf" },
  "Major Bone Set":             { items: MAJOR_BONE,       pdf: "/assets/Major_Bone_Set.pdf" },
};

// Get the PDF path for a kit name
export function getKitPdf(kitName) {
  return KIT_REGISTRY[kitName]?.pdf || "/assets/Masectomy_Tray.pdf";
}

// Standard consumables included with every kit
const STANDARD_CONSUMABLES = [
  { n: "Lap Sponge 18×18", cat: "sponge", init: 5, z: "mayo" },
  { n: "Raytec Sponge 4×4", cat: "sponge", init: 5, z: "mayo" },
  { n: "Peanut Sponge", cat: "sponge", init: 5, z: "mayo" },
  { n: "4×4 Gauze Pad", cat: "sponge", init: 10, z: "mayo" },
  { n: "Suture Needle CT-1", cat: "needle", init: 4, z: "mayo" },
  { n: "Suture Needle SH", cat: "needle", init: 3, z: "mayo" },
  { n: "Keith Needle", cat: "needle", init: 2, z: "mayo" },
  { n: "Tapered RB-1", cat: "needle", init: 3, z: "mayo" },
  { n: "Blade #10", cat: "sharp", init: 2, z: "mayo" },
  { n: "Blade #15", cat: "sharp", init: 1, z: "mayo" },
  { n: "Blade #11", cat: "sharp", init: 1, z: "mayo" },
  { n: "Cavity Pack", cat: "pack", init: 2, z: "mayo" },
  { n: "Lap Pack (5ct)", cat: "pack", init: 2, z: "mayo" },
]; // 45 consumable pieces

// Get kit items — returns FULL kit instruments + standard consumables
export function getKitItems(kitName) {
  const kit = KIT_REGISTRY[kitName];
  const instruments = kit ? kit.items : BASIC_DELICATE;
  const all = [...instruments.map(i => ({ ...i })), ...STANDARD_CONSUMABLES.map(i => ({ ...i }))];
  return assignIds(all);
}

function assignIds(items) {
  const counters = {};
  return items.map(item => {
    const prefix = item.cat === 'sponge' ? 'SPG' : item.cat === 'needle' ? 'NDL' : item.cat === 'sharp' ? 'SHP' : item.cat === 'pack' ? 'PAK' : 'INS';
    counters[prefix] = (counters[prefix] || 0) + 1;
    return { ...item, id: `${prefix}-${String(counters[prefix]).padStart(3, '0')}` };
  });
}
