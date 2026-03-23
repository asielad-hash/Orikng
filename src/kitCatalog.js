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
// 1. SHEBA BASIC DELICATE SET (58 pieces — from PDF: Sheba-Basic-000)
// ═══════════════════════════════════════════════════════
const BASIC_DELICATE = [
  // Knife Handles (2)
  { n: "Handle, Knife, Scalpel, #3", cat: "instrument", init: 2, z: "mayo" },
  // Towel Clips (8)
  { n: "Towel Clip, 9cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Towel Clamp, 14cm", cat: "instrument", init: 6, z: "back_table" },
  // Clamps (22)
  { n: "Clamp, Mosquito, Curved, 12cm", cat: "instrument", init: 6, z: "mayo" },
  { n: "Clamp, Pean, Curved, 14cm", cat: "instrument", init: 6, z: "back_table" },
  { n: "Clamp, Baby Mixter, Hemostatic, 18cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Clamp, Kocher, Haemostatic, Curved, 18cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Clamp, Allis, Tissue, 15cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Clamp, Lahey, Straight, 15cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Clamp, Rochester Pean, Curved, 18cm", cat: "instrument", init: 2, z: "back_table" },
  // Needle Holders (3)
  { n: "Needleholder, Halsey, 13cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Needleholder, Mayo-Hegar, 15cm", cat: "instrument", init: 2, z: "mayo" },
  // Sponge Holder (1)
  { n: "Sponge Forceps, Foerster, Straight, 24cm", cat: "instrument", init: 1, z: "back_table" },
  // Scissors (2)
  { n: "Scissors, Mayo, Dissecting, Curved, 14cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Scissors, Metzenbaum, Dissecting, Curved, 18cm", cat: "instrument", init: 1, z: "mayo" },
  // Forceps (7)
  { n: "Forceps, Standard, Surgical, 14cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Forceps, Adson, Surgical, 12cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Forceps, DeBakey, Tissue, 2mm, 15cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Forceps, DeBakey, Tissue, 2mm, 20cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Forceps, Standard, Anatomical, 14cm", cat: "instrument", init: 1, z: "mayo" },
  // Retractors (12)
  { n: "Hook, Gillies, Skin", cat: "instrument", init: 2, z: "back_table" },
  { n: "Retractor, Senn-Miller", cat: "instrument", init: 2, z: "back_table" },
  { n: "Retractor, US Army, 22cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Retractor, Roux, #1, 165mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Retractor, Kocher-Richardson, XS", cat: "instrument", init: 2, z: "back_table" },
  { n: "Retractor, Richardson, Medium", cat: "instrument", init: 2, z: "back_table" },
  // Suction (1)
  { n: "Suction Tube, Yankauer", cat: "instrument", init: 1, z: "mayo" },
]; // Total: 58

// ═══════════════════════════════════════════════════════
// 2. ROBOTIC LAP TRAY (70 pieces — from PDF: LRG-ROBOTIC LAP TRAY-000)
// ═══════════════════════════════════════════════════════
const LAP_TRAY = [
  // Top Rack (42 pieces)
  { n: "Tube, Inner, Metal, 31cm", cat: "instrument", init: 9, z: "back_table" },
  { n: "Tube, Outer, Insulated, 5mm, 31cm", cat: "instrument", init: 6, z: "back_table" },
  { n: "Tube, Inner, Metal, 42cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Tube, Outer, Insulated, 10mm, 31cm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Tube, Outer, Insulated, 5mm, 42cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Insert, Jaw, Large Biopsy Spoon Forceps", cat: "instrument", init: 1, z: "back_table" },
  { n: "Insert, Jaw, w/ Teeth, Biopsy Forceps", cat: "instrument", init: 1, z: "back_table" },
  { n: "Insert, Jaw, TC, Metzenbaum Scissors 31cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Insert, Jaw, 31cm, Crile Dissector", cat: "instrument", init: 1, z: "back_table" },
  { n: "Insert, Jaw, TC, Metzenbaum Scissors 42cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Insert, Jaw, 42cm, Hook Scissors", cat: "instrument", init: 1, z: "back_table" },
  { n: "Insert, Satinsky ATR Clamp", cat: "instrument", init: 1, z: "back_table" },
  { n: "Insert, Jaw, Crafoord Clamp", cat: "instrument", init: 1, z: "back_table" },
  { n: "Insert, Jaw, Maryland", cat: "instrument", init: 1, z: "mayo" },
  { n: "Insert, Jaw, 31cm, Bowel Grasper", cat: "instrument", init: 2, z: "back_table" },
  { n: "Applier/Remover, Clip, Straight", cat: "instrument", init: 1, z: "mayo" },
  { n: "Grasper, Sovereign, Atraumatic, 5mm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Forceps, Hunter, Bowel Grasping, 5mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Applier, Hem-o-lok, Large, 10mm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Applier, Hem-o-lok, XLarge, 10mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Applier, Lapra-Ty, Absorbable Suture Clip", cat: "instrument", init: 2, z: "back_table" },
  { n: "Grasper, Crile, Curved", cat: "instrument", init: 1, z: "back_table" },
  // Bottom Rack (21 pieces)
  { n: "Needleholder, Curved Left, 5mm, 31cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Needleholder, TC, Curved Right, 5mm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Needleholder, Super Self Righting, 5mm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Needleholder, Straight, 5mm, 31cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Cannula, Injection, Sharp, 5mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Handle, Quick Snap, Monopolar, Non Ratchet", cat: "instrument", init: 4, z: "back_table" },
  { n: "Handle, Quick Snap, Monopolar, Ratchet", cat: "instrument", init: 1, z: "back_table" },
  { n: "Suction Tip, Irrigating, 5mm, 33cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "Suction Tip, Vented, 5mm, 45cm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Probe, Sims, Uterine, 4mm, 13\"", cat: "instrument", init: 1, z: "back_table" },
  { n: "Cable, DaVinci, Bipolar, Blue", cat: "instrument", init: 1, z: "back_table" },
  { n: "Cord, DaVinci Xi/X, Bipolar, 5m", cat: "instrument", init: 1, z: "back_table" },
  { n: "Cannula, DaVinci, 8mm", cat: "instrument", init: 4, z: "back_table" },
  { n: "Pin, Gauge, for 8mm Cannula", cat: "instrument", init: 1, z: "back_table" },
  { n: "Trocar, DaVinci, Non Disposable, 8mm", cat: "instrument", init: 1, z: "back_table" },
  // Bottom Small Cage (6 pieces)
  { n: "Clip, Bulldog, Straight, 25mm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Clip, Bulldog, Straight, 45mm", cat: "instrument", init: 1, z: "back_table" },
  { n: "Clip, Bulldog, Curved, 25mm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Clip, Bulldog, Curved, 45mm", cat: "instrument", init: 1, z: "back_table" },
  // Testing Device (1 piece)
  { n: "Insulation & Cord Tester", cat: "instrument", init: 1, z: "back_table" },
]; // Total: 70

// ═══════════════════════════════════════════════════════
// 3. SHEBA MASTECTOMY (72 pieces — from PDF: Sheba-Mast-000)
// ═══════════════════════════════════════════════════════
const SHEBA_MASTECTOMY = [
  // Knife Handles (2)
  { n: "Scalpel Handle No. 3", cat: "instrument", init: 2, z: "mayo" },
  // Clamps (34)
  { n: "Towel Clip, 13cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Towel Clamp, 14cm", cat: "instrument", init: 6, z: "back_table" },
  { n: "Mosquito Curved Forceps, 12cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Curved PEAN Forceps, 14cm", cat: "instrument", init: 6, z: "back_table" },
  { n: "Baby-Mixter Forceps, 14cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "HEISS Hemostatic Forceps, Curved, 20cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "KOCHER Haemostatic Forceps, 18cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "ROCHESTER-PEAN Hemostatic, Curved, 20cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "ALLIS Tissue Forceps, 15cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "LAHEY Straight Forceps, 15cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "LAHEY Curved Forceps, 19cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Tissue Forceps Babcock, 16cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Foerster Sponge Forceps, Straight, 24cm", cat: "instrument", init: 2, z: "back_table" },
  // Needle Holders (4)
  { n: "Halsey Needle Holder, 13cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "Mayo-Hegar Needle Holder, 15cm", cat: "instrument", init: 2, z: "mayo" },
  // Scissors (3)
  { n: "MAYO Dissecting Scissors, Curved, 17cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "METZENBAUM Dissecting Scissors, 18cm", cat: "instrument", init: 1, z: "mayo" },
  { n: "METZENBAUM Dissecting Scissors, 20cm", cat: "instrument", init: 1, z: "mayo" },
  // Forceps (6)
  { n: "Standard Surgical Tweezers, 14cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "ADSON Surgical Tweezers, 12cm", cat: "instrument", init: 2, z: "mayo" },
  { n: "DeBakey 2mm Tissue Forceps, 20cm", cat: "instrument", init: 2, z: "mayo" },
  // Retractors (22)
  { n: "GILLIES Skin Hook", cat: "instrument", init: 2, z: "back_table" },
  { n: "PILLING WECK Medium Clip, 8\"", cat: "instrument", init: 2, z: "back_table" },
  { n: "SAN-MILLER Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "US Army Retractor, 22cm", cat: "instrument", init: 2, z: "back_table" },
  { n: "ROUX Retractor No. 1, 140mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "ROUX Retractor No. 3, 165mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "Volkman 4 Teeth Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "KOCHER Retractor", cat: "instrument", init: 2, z: "back_table" },
  { n: "RICHARDSON Retractor, Small, 23x20mm", cat: "instrument", init: 2, z: "back_table" },
  { n: "RICHARDSON Retractor, Medium", cat: "instrument", init: 2, z: "back_table" },
  { n: "RICHARDSON Retractor, Large", cat: "instrument", init: 2, z: "back_table" },
  // Suction (1)
  { n: "YANKAUER Suction Tube", cat: "instrument", init: 1, z: "mayo" },
]; // Total: 72

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
