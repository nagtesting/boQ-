// api/boq.js
// BOQ Capital Cost Estimator v4 — Unified API
// Handles: calc engine + live market data in one serverless function
// multicalci.com | Server-side IP protection — calculation logic never exposed to client
//
// Routes (via action param):
//   Calc:      get_catalog | validate | calc_items | calc_physics | calc_indirect | calc_summary | export_csv
//   Live data: live_data | live_fx | live_cepci | live_commodities

'use strict';

// ─────────────────────────────────────────────────────────────
// SECTION 1: REFERENCE DATA
// ─────────────────────────────────────────────────────────────
const CEPCI_REF = 397.0;
const CEPCI = { 2020: 596.2, 2021: 708.0, 2022: 816.0, 2023: 789.6, 2024: 798.4, 2025: 810.0 };

const LOC = {
  US: { f: 1.00, c: 'USD', s: '$',  n: 'United States' },
  IN: { f: 0.62, c: 'INR', s: '₹',  n: 'India' },
  SA: { f: 0.88, c: 'USD', s: '$',  n: 'Saudi Arabia' },
  AE: { f: 0.95, c: 'USD', s: '$',  n: 'UAE' },
  QA: { f: 0.92, c: 'USD', s: '$',  n: 'Qatar' },
  DE: { f: 1.18, c: 'EUR', s: '€',  n: 'Germany' },
  GB: { f: 1.22, c: 'GBP', s: '£',  n: 'United Kingdom' },
  AU: { f: 1.30, c: 'AUD', s: 'A$', n: 'Australia' },
  CN: { f: 0.68, c: 'CNY', s: '¥',  n: 'China' },
  SG: { f: 1.15, c: 'SGD', s: 'S$', n: 'Singapore' },
  BR: { f: 0.80, c: 'BRL', s: 'R$', n: 'Brazil' },
  CA: { f: 1.08, c: 'CAD', s: 'C$', n: 'Canada' },
  NO: { f: 1.45, c: 'NOK', s: 'kr', n: 'Norway' },
  FR: { f: 1.15, c: 'EUR', s: '€',  n: 'France' },
  NL: { f: 1.20, c: 'EUR', s: '€',  n: 'Netherlands' },
  JP: { f: 1.25, c: 'JPY', s: '¥',  n: 'Japan' },
  KR: { f: 1.05, c: 'KRW', s: '₩',  n: 'South Korea' },
  ZA: { f: 0.72, c: 'ZAR', s: 'R',  n: 'South Africa' },
  EG: { f: 0.65, c: 'EGP', s: '£',  n: 'Egypt' },
};

const FX_STATIC = {
  USD: 1, CAD: 1.36, EUR: 0.93, GBP: 0.80, INR: 83.5,
  CNY: 7.24, JPY: 148, KRW: 1320, SGD: 1.34, AUD: 1.52,
  ZAR: 18.7, EGP: 48, BRL: 4.95, NOK: 10.8,
  AED: 3.67, SAR: 3.75, QAR: 3.64,
};

const MAT_F = {
  cs: 1.0, ss304: 1.55, ss316: 1.80, dss: 2.20,
  ti: 4.80, monel: 2.90, hastelloy: 3.80,
};

const MAT_L = {
  cs: 'Carbon Steel', ss304: 'SS 304', ss316: 'SS 316',
  dss: 'Duplex SS 2205', ti: 'Titanium Gr.2',
  monel: 'Monel 400', hastelloy: 'Hastelloy C276',
};

const CX_F = { simple: 0.85, moderate: 1.00, complex: 1.25, extreme: 1.55 };

const INDIRECT_DEFAULTS = {
  eng: 25, pmc: 12, civil_civil: 8, comm: 5,
  land: 4, cont: 15, esc: 5, spares: 3,
};

const DISC_INDIRECT_DEFAULTS = {
  process: { eng: 22, pmc: 10, civil_civil: 5,  comm: 5, land: 3, cont: 15, esc: 4, spares: 2 },
  mech:    { eng: 25, pmc: 12, civil_civil: 8,  comm: 6, land: 2, cont: 15, esc: 5, spares: 3 },
  civil:   { eng: 18, pmc: 10, civil_civil: 15, comm: 4, land: 8, cont: 20, esc: 3, spares: 1 },
  elec:    { eng: 28, pmc: 12, civil_civil: 4,  comm: 5, land: 1, cont: 15, esc: 4, spares: 2 },
  inst:    { eng: 35, pmc: 12, civil_civil: 3,  comm: 5, land: 1, cont: 12, esc: 4, spares: 3 },
};

// ─────────────────────────────────────────────────────────────
// SECTION 2: ITEM CATALOG (IP protected server-side)
// ─────────────────────────────────────────────────────────────
const ITEMS = [
  // ── REACTORS ──────────────────────────────────────────────
  { id:'re01', desc:'CSTR Reactor',                     disc:'Process',        cat:'process', sub:'reactor', sizing:{lbl:'Volume',     unit:'m³',    def:10,  min:0.1, max:5000  }, Cref:95000,   Sref:10,   n:0.52, matOpts:['cs','ss316','dss','ti'], instF:0.60, hasPT:true,  pDef:15,  tDef:180 },
  { id:'re02', desc:'Fixed Bed Reactor (Catalytic)',    disc:'Process',        cat:'process', sub:'reactor', sizing:{lbl:'Volume',     unit:'m³',    def:15,  min:0.5, max:2000  }, Cref:145000,  Sref:15,   n:0.55, matOpts:['cs','ss316','dss'],     instF:0.65, hasPT:true,  pDef:25,  tDef:350 },
  { id:'re03', desc:'Plug Flow Reactor (Tubular)',      disc:'Process',        cat:'process', sub:'reactor', sizing:{lbl:'Volume',     unit:'m³',    def:5,   min:0.1, max:500   }, Cref:75000,   Sref:5,    n:0.49, matOpts:['cs','ss316','ti'],       instF:0.58, hasPT:true,  pDef:40,  tDef:280 },
  { id:'re04', desc:'Batch Reactor (Jacketed)',         disc:'Process',        cat:'process', sub:'reactor', sizing:{lbl:'Volume',     unit:'m³',    def:5,   min:0.1, max:200   }, Cref:110000,  Sref:5,    n:0.53, matOpts:['cs','ss316','dss','ti'], instF:0.62, hasPT:true,  pDef:5,   tDef:120 },
  // ── COLUMNS ───────────────────────────────────────────────
  { id:'co01', desc:'Distillation Column (Trayed)',     disc:'Process',        cat:'process', sub:'column',  sizing:{lbl:'D²×H',      unit:'m²·m',  def:18,  min:0.5, max:5000  }, Cref:320000,  Sref:18,   n:0.57, matOpts:['cs','ss316','dss'],     instF:0.65, hasPT:true,  pDef:8,   tDef:150, trayFactor:1.15  },
  { id:'co02', desc:'Absorption Column (Packed)',       disc:'Process',        cat:'process', sub:'column',  sizing:{lbl:'D²×H',      unit:'m²·m',  def:12,  min:0.5, max:3000  }, Cref:240000,  Sref:12,   n:0.56, matOpts:['cs','ss316','ti'],       instF:0.62, hasPT:true,  pDef:12,  tDef:45,  packedFactor:0.92 },
  { id:'co03', desc:'Stripping Column',                 disc:'Process',        cat:'process', sub:'column',  sizing:{lbl:'D²×H',      unit:'m²·m',  def:8,   min:0.5, max:2000  }, Cref:185000,  Sref:8,    n:0.55, matOpts:['cs','ss316'],           instF:0.60, hasPT:true,  pDef:6,   tDef:95  },
  // ── HEAT EXCHANGERS ────────────────────────────────────────
  { id:'hx01', desc:'Shell & Tube HX (TEMA R)',         disc:'Process',        cat:'process', sub:'hx',      sizing:{lbl:'Duty',       unit:'kW',    def:2000,min:10,  max:200000}, Cref:52000,   Sref:2000, n:0.68, matOpts:['cs','ss304','ss316','ti'],instF:0.45, hasPT:true,  pDef:20,  tDef:200, typeFactor:1.0   },
  { id:'hx02', desc:'Plate Heat Exchanger',             disc:'Process',        cat:'process', sub:'hx',      sizing:{lbl:'Duty',       unit:'kW',    def:800, min:10,  max:50000 }, Cref:24000,   Sref:800,  n:0.65, matOpts:['ss304','ss316','ti'],    instF:0.42, hasPT:true,  pDef:12,  tDef:80,  typeFactor:0.85  },
  { id:'hx03', desc:'Air-Fin Cooler (ACHE)',            disc:'Process',        cat:'process', sub:'hx',      sizing:{lbl:'Duty',       unit:'kW',    def:3000,min:100, max:100000}, Cref:78000,   Sref:3000, n:0.70, matOpts:['cs','ss304'],           instF:0.50, hasPT:false, pDef:0,   tDef:45,  typeFactor:1.2   },
  { id:'hx04', desc:'Fired Heater / Furnace',           disc:'Process',        cat:'process', sub:'hx',      sizing:{lbl:'Duty',       unit:'MW',    def:10,  min:0.5, max:500   }, Cref:2800000, Sref:10,   n:0.75, matOpts:['cs','ss316'],           instF:0.65, hasPT:true,  pDef:15,  tDef:450, typeFactor:1.4   },
  { id:'hx05', desc:'Double Pipe HX',                   disc:'Process',        cat:'process', sub:'hx',      sizing:{lbl:'Duty',       unit:'kW',    def:200, min:5,   max:5000  }, Cref:9500,    Sref:200,  n:0.60, matOpts:['cs','ss316'],           instF:0.40, hasPT:true,  pDef:25,  tDef:150 },
  // ── UTILITY SYSTEMS ────────────────────────────────────────
  { id:'ut01', desc:'Steam Boiler (Package)',            disc:'Process',        cat:'process', sub:'utility', sizing:{lbl:'Steam rate', unit:'t/h',   def:20,  min:1,   max:500   }, Cref:980000,  Sref:20,   n:0.68, matOpts:['cs'],                   instF:0.60, hasPT:true,  pDef:45,  tDef:180 },
  { id:'ut02', desc:'Cooling Tower (Induced Draft)',    disc:'Process',        cat:'process', sub:'utility', sizing:{lbl:'Duty',       unit:'MW',    def:15,  min:0.5, max:500   }, Cref:420000,  Sref:15,   n:0.62, matOpts:['cs'],                   instF:0.55, hasPT:false, pDef:0,   tDef:35  },
  { id:'ut03', desc:'Water Treatment Plant (WTP)',      disc:'Process',        cat:'process', sub:'utility', sizing:{lbl:'Flow',       unit:'m³/h',  def:100, min:5,   max:5000  }, Cref:650000,  Sref:100,  n:0.65, matOpts:['cs'],                   instF:0.70, hasPT:false, pDef:0,   tDef:25  },
  { id:'ut04', desc:'Chiller / Refrigeration Package',  disc:'Process',        cat:'process', sub:'utility', sizing:{lbl:'Duty',       unit:'kW',    def:500, min:10,  max:20000 }, Cref:280000,  Sref:500,  n:0.67, matOpts:['cs'],                   instF:0.55, hasPT:false, pDef:0,   tDef:5   },
  { id:'ut05', desc:'Nitrogen Generator (PSA)',          disc:'Process',        cat:'process', sub:'utility', sizing:{lbl:'Flow',       unit:'Nm³/h', def:200, min:10,  max:5000  }, Cref:185000,  Sref:200,  n:0.60, matOpts:['cs'],                   instF:0.50, hasPT:false, pDef:0,   tDef:25  },
  // ══════════════════════════════════════════════════════════
  // MECHANICAL — ROTATING EQUIPMENT: PUMPS
  // ══════════════════════════════════════════════════════════
  { id:'pu01', desc:'Centrifugal Pump — End Suction (API 610)',         disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:22,   min:0.5,  max:5000  }, Cref:9800,   Sref:22,   n:0.65, matOpts:['cs','ss316','dss'],     instF:0.40, hasPT:true,  pDef:25,  tDef:80,  apiFactor:1.3  },
  { id:'pu02', desc:'Centrifugal Pump — Between Bearing (BB2/BB5)',     disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:75,   min:5,    max:10000 }, Cref:28000,  Sref:75,   n:0.65, matOpts:['cs','ss316','dss'],     instF:0.42, hasPT:true,  pDef:40,  tDef:120, apiFactor:1.3  },
  { id:'pu03', desc:'Centrifugal Pump — Vertical Turbine (VS1/VS6)',    disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:37,   min:2,    max:3000  }, Cref:18000,  Sref:37,   n:0.65, matOpts:['cs','ss316'],           instF:0.45, hasPT:true,  pDef:10,  tDef:60,  apiFactor:1.2  },
  { id:'pu04', desc:'Centrifugal Pump — Magnetic Drive (Seal-less)',    disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:11,   min:0.5,  max:200   }, Cref:16000,  Sref:11,   n:0.65, matOpts:['ss316','dss','ti'],     instF:0.38, hasPT:true,  pDef:16,  tDef:80   },
  { id:'pu05', desc:'Centrifugal Pump — Self Priming',                  disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:7.5,  min:0.5,  max:200   }, Cref:6800,   Sref:7.5,  n:0.62, matOpts:['cs','ss316'],           instF:0.35, hasPT:true,  pDef:6,   tDef:60   },
  { id:'pu06', desc:'Reciprocating Pump — Plunger (High Pressure)',     disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:15,   min:0.5,  max:500   }, Cref:18000,  Sref:15,   n:0.67, matOpts:['cs','ss316'],           instF:0.42, hasPT:true,  pDef:150, tDef:60   },
  { id:'pu07', desc:'Reciprocating Pump — Diaphragm (Metering/Dosing)', disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Flow Rate', unit:'L/h', def:200,  min:1,    max:20000 }, Cref:3500,   Sref:200,  n:0.55, matOpts:['cs','ss316','ti'],     instF:0.35, hasPT:true,  pDef:25,  tDef:60   },
  { id:'pu08', desc:'Screw Pump (Progressive Cavity / Twin-Screw)',     disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:10,   min:0.2,  max:500   }, Cref:9200,   Sref:10,   n:0.62, matOpts:['cs','ss316'],           instF:0.38, hasPT:true,  pDef:12,  tDef:120  },
  { id:'pu09', desc:'Gear Pump (External/Internal)',                     disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:5.5,  min:0.2,  max:200   }, Cref:5500,   Sref:5.5,  n:0.60, matOpts:['cs','ss316'],           instF:0.35, hasPT:true,  pDef:10,  tDef:150  },
  { id:'pu10', desc:'Submersible Pump (Sump / Drainage)',                disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:5,    min:0.2,  max:100   }, Cref:4200,   Sref:5,    n:0.60, matOpts:['ss304','ss316'],        instF:0.35, hasPT:true,  pDef:3,   tDef:35   },
  { id:'pu11', desc:'Peristaltic Pump (Hose/Tube)',                      disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Flow Rate', unit:'L/h', def:100,  min:1,    max:10000 }, Cref:4800,   Sref:100,  n:0.55, matOpts:['cs'],                   instF:0.30, hasPT:false, pDef:0,   tDef:60   },
  { id:'pu12', desc:'Canned Motor Pump (Hermetically Sealed)',           disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:11,   min:0.5,  max:300   }, Cref:22000,  Sref:11,   n:0.65, matOpts:['ss316','dss','ti'],     instF:0.38, hasPT:true,  pDef:20,  tDef:100  },
  { id:'pu13', desc:'Pump Baseplate, Coupling & Guard (Package)',        disc:'Mechanical', cat:'mech', sub:'mech-pumps', sizing:{lbl:'Shaft Power',unit:'kW',  def:22,   min:0.5,  max:3000  }, Cref:1800,   Sref:22,   n:0.55, matOpts:['cs'],                   instF:0.20, hasPT:false, pDef:0,   tDef:40   },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — ROTATING EQUIPMENT: COMPRESSORS & BLOWERS
  // ══════════════════════════════════════════════════════════
  { id:'cm01', desc:'Centrifugal Compressor — Multistage (API 617)',    disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:500,  min:50,   max:50000 }, Cref:320000, Sref:500,  n:0.67, matOpts:['cs','ss316'],           instF:0.55, hasPT:true,  pDef:80,  tDef:120, driverFactor:1.0 },
  { id:'cm02', desc:'Reciprocating Compressor — Balanced Opposed',      disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:250,  min:5,    max:10000 }, Cref:195000, Sref:250,  n:0.70, matOpts:['cs','ss316'],           instF:0.58, hasPT:true,  pDef:120, tDef:65   },
  { id:'cm03', desc:'Screw Compressor — Oil Injected Package',          disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:100,  min:5,    max:2000  }, Cref:48000,  Sref:100,  n:0.65, matOpts:['cs'],                   instF:0.48, hasPT:true,  pDef:8,   tDef:55   },
  { id:'cm04', desc:'Screw Compressor — Oil Free (API 619)',            disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:200,  min:20,   max:5000  }, Cref:85000,  Sref:200,  n:0.67, matOpts:['cs','ss316'],           instF:0.52, hasPT:true,  pDef:10,  tDef:60   },
  { id:'cm05', desc:'Centrifugal Fan / Process Blower (API 673)',       disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:30,   min:1,    max:2000  }, Cref:12500,  Sref:30,   n:0.60, matOpts:['cs','ss304'],           instF:0.42, hasPT:false, pDef:0,   tDef:40   },
  { id:'cm06', desc:'Roots Blower (Positive Displacement)',              disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:15,   min:1,    max:500   }, Cref:9800,   Sref:15,   n:0.62, matOpts:['cs'],                   instF:0.40, hasPT:false, pDef:0,   tDef:60   },
  { id:'cm07', desc:'Vacuum Pump (Liquid Ring / Dry Screw)',             disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:22,   min:1,    max:500   }, Cref:18000,  Sref:22,   n:0.65, matOpts:['cs','ss316'],           instF:0.42, hasPT:false, pDef:0,   tDef:40   },
  { id:'cm08', desc:'Steam Turbine Driver (Condensing/Back Pressure)',  disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:1000, min:50,   max:50000 }, Cref:420000, Sref:1000, n:0.70, matOpts:['cs','ss316'],           instF:0.60, hasPT:true,  pDef:40,  tDef:380  },
  { id:'cm09', desc:'Gas Turbine Driver (Mechanical Drive)',             disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:5000, min:500,  max:100000}, Cref:2800000,Sref:5000, n:0.72, matOpts:['cs'],                   instF:0.65, hasPT:true,  pDef:20,  tDef:400  },
  { id:'cm10', desc:'Gear Box / Gearbox (Speed Increaser/Reducer)',     disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Power Rating',unit:'kW', def:200,  min:5,    max:20000 }, Cref:28000,  Sref:200,  n:0.62, matOpts:['cs'],                   instF:0.30, hasPT:false, pDef:0,   tDef:80   },
  { id:'cm11', desc:'Flexible Coupling (Disc/Diaphragm, API 671)',      disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Power Rating',unit:'kW', def:100,  min:5,    max:20000 }, Cref:3500,   Sref:100,  n:0.55, matOpts:['cs'],                   instF:0.15, hasPT:false, pDef:0,   tDef:80   },
  { id:'cm12', desc:'Mechanical Seal (Cartridge, API 682)',              disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Dia',  unit:'mm', def:50,   min:20,   max:200   }, Cref:4800,   Sref:50,   n:0.80, matOpts:['cs','ss316'],           instF:0.18, hasPT:true,  pDef:20,  tDef:80   },
  { id:'cm13', desc:'Mechanical Seal Support System (Plan 53/54)',       disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Systems',   unit:'No.', def:4,    min:1,    max:50    }, Cref:12000,  Sref:1,    n:1.00, matOpts:['cs','ss316'],           instF:0.25, hasPT:false, pDef:0,   tDef:40   },
  { id:'cm14', desc:'Lube Oil Console (API 614)',                        disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Shaft Power',unit:'kW',  def:500,  min:50,   max:50000 }, Cref:85000,  Sref:500,  n:0.60, matOpts:['cs'],                   instF:0.35, hasPT:false, pDef:0,   tDef:60   },
  { id:'cm15', desc:'Dry Gas Seal System (API 692)',                     disc:'Mechanical', cat:'mech', sub:'mech-comp', sizing:{lbl:'Systems',   unit:'No.', def:2,    min:1,    max:20    }, Cref:95000,  Sref:1,    n:0.90, matOpts:['cs','ss316'],           instF:0.30, hasPT:false, pDef:0,   tDef:60   },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — STATIC EQUIPMENT: VESSELS & COLUMNS
  // ══════════════════════════════════════════════════════════
  { id:'ve01', desc:'Pressure Vessel — Vertical (ASME VIII Div 1)',     disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:5,    min:0.1,  max:2000  }, Cref:32000,  Sref:5,    n:0.55, matOpts:['cs','ss316','dss'],     instF:0.52, hasPT:true,  pDef:18,  tDef:95   },
  { id:'ve02', desc:'Pressure Vessel — Horizontal (ASME VIII Div 1)',   disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:8,    min:0.5,  max:3000  }, Cref:38000,  Sref:8,    n:0.55, matOpts:['cs','ss316','dss'],     instF:0.50, hasPT:true,  pDef:12,  tDef:80   },
  { id:'ve03', desc:'Pressure Vessel — High Pressure (ASME VIII Div 2)',disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:10,   min:0.5,  max:1000  }, Cref:95000,  Sref:10,   n:0.58, matOpts:['cs','ss316','dss'],     instF:0.58, hasPT:true,  pDef:200, tDef:200  },
  { id:'ve04', desc:'2-Phase Separator (Horizontal, Inlet Device)',     disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:8,    min:0.5,  max:3000  }, Cref:48000,  Sref:8,    n:0.55, matOpts:['cs','ss316','dss'],     instF:0.55, hasPT:true,  pDef:12,  tDef:45   },
  { id:'ve05', desc:'3-Phase Separator / Degasser',                      disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:15,   min:1,    max:5000  }, Cref:82000,  Sref:15,   n:0.57, matOpts:['cs','ss316','dss'],     instF:0.58, hasPT:true,  pDef:8,   tDef:60   },
  { id:'ve06', desc:'Flash Drum / Knockout Drum',                        disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:3,    min:0.2,  max:500   }, Cref:22000,  Sref:3,    n:0.52, matOpts:['cs','ss316'],           instF:0.48, hasPT:true,  pDef:15,  tDef:100  },
  { id:'ve07', desc:'Scrubber / Wet Gas Scrubber',                       disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:5,    min:0.5,  max:1000  }, Cref:42000,  Sref:5,    n:0.55, matOpts:['cs','ss316','dss'],     instF:0.55, hasPT:true,  pDef:6,   tDef:80   },
  { id:'ve08', desc:'Filter Vessel (Basket / Candle Type)',              disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:1,    min:0.05, max:200   }, Cref:12000,  Sref:1,    n:0.55, matOpts:['cs','ss316'],           instF:0.40, hasPT:true,  pDef:10,  tDef:60   },
  { id:'ve09', desc:'Storage Tank — Atmospheric Cone Roof (API 650)',   disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:1000, min:10,   max:200000}, Cref:145000, Sref:1000, n:0.60, matOpts:['cs','ss304'],           instF:0.40, hasPT:false, pDef:0,   tDef:35   },
  { id:'ve10', desc:'Storage Tank — Floating Roof (API 650)',           disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:5000, min:200,  max:500000}, Cref:480000, Sref:5000, n:0.62, matOpts:['cs'],                   instF:0.42, hasPT:false, pDef:0,   tDef:35   },
  { id:'ve11', desc:'Storage Tank — Pressurised Bullet/Sphere (LPG)',  disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:100,  min:5,    max:10000 }, Cref:185000, Sref:100,  n:0.65, matOpts:['cs'],                   instF:0.55, hasPT:true,  pDef:17,  tDef:45   },
  { id:'ve12', desc:'Day Tank / Overflow Tank (Small Atmospheric)',      disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:5,    min:0.2,  max:500   }, Cref:4500,   Sref:5,    n:0.55, matOpts:['cs','ss304','ss316'],  instF:0.30, hasPT:false, pDef:0,   tDef:40   },
  { id:'ve13', desc:'Expansion Vessel / Accumulator',                    disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Volume',  unit:'m³',  def:0.5,  min:0.02, max:50    }, Cref:3800,   Sref:0.5,  n:0.55, matOpts:['cs','ss316'],           instF:0.30, hasPT:true,  pDef:10,  tDef:60   },
  { id:'ve14', desc:'Reactor Internals — Trays / Distributors',         disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Diameter',unit:'m',   def:2,    min:0.3,  max:8     }, Cref:12000,  Sref:2,    n:1.80, matOpts:['cs','ss316'],           instF:0.25, hasPT:false, pDef:0,   tDef:80   },
  { id:'ve15', desc:'Vessel Internals — Demister Pad / Vane Pack',      disc:'Mechanical', cat:'mech', sub:'mech-vessels', sizing:{lbl:'Area',    unit:'m²',  def:4,    min:0.1,  max:100   }, Cref:2800,   Sref:4,    n:0.80, matOpts:['cs','ss316'],           instF:0.20, hasPT:false, pDef:0,   tDef:80   },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — STATIC: HEAT TRANSFER EQUIPMENT (additional)
  // ══════════════════════════════════════════════════════════
  { id:'ht01', desc:'Jacketed Vessel / Reactor (Heating/Cooling)',      disc:'Mechanical', cat:'mech', sub:'mech-ht', sizing:{lbl:'Volume',    unit:'m³',  def:5,    min:0.1,  max:500   }, Cref:55000,  Sref:5,    n:0.55, matOpts:['cs','ss316','dss'],     instF:0.55, hasPT:true,  pDef:10,  tDef:150  },
  { id:'ht02', desc:'Spiral Heat Exchanger',                             disc:'Mechanical', cat:'mech', sub:'mech-ht', sizing:{lbl:'Area',      unit:'m²',  def:20,   min:1,    max:500   }, Cref:22000,  Sref:20,   n:0.65, matOpts:['cs','ss316','ti'],     instF:0.45, hasPT:true,  pDef:15,  tDef:200  },
  { id:'ht03', desc:'Falling Film Evaporator',                           disc:'Mechanical', cat:'mech', sub:'mech-ht', sizing:{lbl:'Duty',      unit:'kW',  def:2000, min:50,   max:50000 }, Cref:380000, Sref:2000, n:0.70, matOpts:['cs','ss316','ti'],     instF:0.60, hasPT:true,  pDef:5,   tDef:120  },
  { id:'ht04', desc:'Wiped Film / Thin Film Evaporator',                 disc:'Mechanical', cat:'mech', sub:'mech-ht', sizing:{lbl:'Area',      unit:'m²',  def:5,    min:0.1,  max:100   }, Cref:95000,  Sref:5,    n:0.65, matOpts:['ss316','ti'],          instF:0.55, hasPT:true,  pDef:5,   tDef:80   },
  { id:'ht05', desc:'Heat Tracing — Electric (Self Regulating)',         disc:'Mechanical', cat:'mech', sub:'mech-ht', sizing:{lbl:'Length',    unit:'m',   def:500,  min:10,   max:50000 }, Cref:22,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.35, hasPT:false, pDef:0,   tDef:40   },
  { id:'ht06', desc:'Heat Tracing — Steam (Half-pipe / Tube)',           disc:'Mechanical', cat:'mech', sub:'mech-ht', sizing:{lbl:'Length',    unit:'m',   def:200,  min:10,   max:20000 }, Cref:38,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.40, hasPT:false, pDef:0,   tDef:40   },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — VALVES (expanded)
  // ══════════════════════════════════════════════════════════
  { id:'va01', desc:'Gate Valve (API 600, Flanged, Full Bore)',          disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:4,    min:0.5,  max:36    }, Cref:680,    Sref:4,    n:1.20, matOpts:['cs','ss316'],           instF:0.25, hasPT:true,  pDef:150, tDef:200  },
  { id:'va02', desc:'Ball Valve (API 6D, Full Bore, Flanged)',            disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:4,    min:0.5,  max:36    }, Cref:890,    Sref:4,    n:1.22, matOpts:['cs','ss316','dss'],     instF:0.22, hasPT:true,  pDef:100, tDef:85   },
  { id:'va03', desc:'Ball Valve — Trunnion Mounted (High Pressure)',     disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:6,    min:2,    max:48    }, Cref:3800,   Sref:6,    n:1.25, matOpts:['cs','ss316','dss'],     instF:0.25, hasPT:true,  pDef:250, tDef:150  },
  { id:'va04', desc:'Globe Valve (BS 1873, Flanged)',                    disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:3,    min:0.5,  max:24    }, Cref:950,    Sref:3,    n:1.20, matOpts:['cs','ss316'],           instF:0.22, hasPT:true,  pDef:50,  tDef:150  },
  { id:'va05', desc:'Butterfly Valve — Double Eccentric (API 609)',      disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:8,    min:2,    max:60    }, Cref:1100,   Sref:8,    n:1.15, matOpts:['cs','ss316'],           instF:0.20, hasPT:true,  pDef:10,  tDef:70   },
  { id:'va06', desc:'Butterfly Valve — Triple Eccentric (High Perf)',    disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:10,   min:4,    max:60    }, Cref:4500,   Sref:10,   n:1.18, matOpts:['cs','ss316','dss'],     instF:0.22, hasPT:true,  pDef:50,  tDef:200  },
  { id:'va07', desc:'Check Valve — Swing (API 6D)',                      disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:4,    min:0.5,  max:36    }, Cref:560,    Sref:4,    n:1.18, matOpts:['cs','ss316'],           instF:0.20, hasPT:true,  pDef:20,  tDef:100  },
  { id:'va08', desc:'Check Valve — Dual Plate (Wafer Type)',             disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:4,    min:0.5,  max:48    }, Cref:380,    Sref:4,    n:1.15, matOpts:['cs','ss316'],           instF:0.18, hasPT:true,  pDef:16,  tDef:80   },
  { id:'va09', desc:'Safety Relief Valve — Spring Loaded (API 520)',     disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'Orifice',unit:'cm²', def:5,    min:0.1,  max:200   }, Cref:2400,   Sref:5,    n:0.85, matOpts:['cs','ss316'],           instF:0.22, hasPT:true,  pDef:40,  tDef:200  },
  { id:'va10', desc:'Safety Relief Valve — Pilot Operated (API 526)',    disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'Orifice',unit:'cm²', def:8,    min:0.5,  max:200   }, Cref:8500,   Sref:8,    n:0.85, matOpts:['cs','ss316'],           instF:0.25, hasPT:true,  pDef:100, tDef:250  },
  { id:'va11', desc:'Pressure Reducing Valve (PRV / Self-Regulating)',   disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:3,    min:0.5,  max:24    }, Cref:2200,   Sref:3,    n:1.10, matOpts:['cs','ss316'],           instF:0.22, hasPT:true,  pDef:20,  tDef:150  },
  { id:'va12', desc:'Knife Gate Valve (Slurry / Pulp Service)',          disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:6,    min:2,    max:48    }, Cref:1800,   Sref:6,    n:1.20, matOpts:['cs','ss316'],           instF:0.22, hasPT:true,  pDef:10,  tDef:80   },
  { id:'va13', desc:'Pinch Valve (Rubber Sleeve, Slurry)',               disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:4,    min:1,    max:24    }, Cref:1200,   Sref:4,    n:1.15, matOpts:['cs'],                   instF:0.18, hasPT:false, pDef:0,   tDef:80   },
  { id:'va14', desc:'Needle Valve (High Pressure, Instrument Root)',     disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:0.5,  min:0.25, max:2     }, Cref:420,    Sref:0.5,  n:1.20, matOpts:['cs','ss316'],           instF:0.18, hasPT:true,  pDef:350, tDef:200  },
  { id:'va15', desc:'Actuated Ball Valve (Pneumatic / Electric)',        disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:3,    min:0.5,  max:24    }, Cref:2800,   Sref:3,    n:1.18, matOpts:['cs','ss316'],           instF:0.25, hasPT:true,  pDef:25,  tDef:100  },
  { id:'va16', desc:'Rupture Disc (Bursting Disc, API 520)',             disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:2,    min:0.5,  max:12    }, Cref:850,    Sref:2,    n:1.00, matOpts:['cs','ss316','ti'],     instF:0.10, hasPT:true,  pDef:20,  tDef:150  },
  { id:'va17', desc:'Steam Trap (Thermodynamic / Mechanical Float)',     disc:'Mechanical', cat:'mech', sub:'mech-valves', sizing:{lbl:'NPS',   unit:'inch', def:1,    min:0.5,  max:3     }, Cref:280,    Sref:1,    n:0.90, matOpts:['cs','ss316'],           instF:0.15, hasPT:true,  pDef:12,  tDef:200  },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — PIPING COMPONENTS
  // ══════════════════════════════════════════════════════════
  { id:'pp01', desc:'Carbon Steel Pipe (ASTM A106 Gr B / API 5L)',      disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Length',  unit:'m',   def:500,  min:5,    max:200000}, Cref:38,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.55, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp02', desc:'Stainless Steel Pipe (ASTM A312 TP316)',            disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Length',  unit:'m',   def:200,  min:5,    max:50000 }, Cref:95,     Sref:1,    n:1.00, matOpts:['ss316'],                instF:0.58, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp03', desc:'Duplex SS Pipe (ASTM A790 UNS S31803)',             disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Length',  unit:'m',   def:100,  min:5,    max:20000 }, Cref:220,    Sref:1,    n:1.00, matOpts:['dss'],                  instF:0.60, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp04', desc:'GRP / FRP Pipe (Fibreglass Reinforced)',            disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Length',  unit:'m',   def:200,  min:5,    max:20000 }, Cref:55,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.50, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp05', desc:'HDPE Pipe (PE100 / PE80)',                          disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Length',  unit:'m',   def:300,  min:5,    max:50000 }, Cref:18,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.40, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp06', desc:'Pipe Fittings (Elbows, Tees, Reducers) — CS',      disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Qty',     unit:'No.', def:100,  min:5,    max:10000 }, Cref:180,    Sref:1,    n:1.00, matOpts:['cs','ss316'],           instF:0.50, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp07', desc:'Flanges (ANSI 150#–2500#, Weld Neck / SO)',        disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Qty',     unit:'No.', def:200,  min:5,    max:20000 }, Cref:95,     Sref:1,    n:1.00, matOpts:['cs','ss316'],           instF:0.40, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp08', desc:'Gaskets — Spiral Wound / Ring Joint (RTJ)',        disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Qty',     unit:'No.', def:200,  min:10,   max:20000 }, Cref:28,     Sref:1,    n:1.00, matOpts:['cs','ss316'],           instF:0.10, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp09', desc:'Bolts & Studs (ASTM A193 B7 / B8M, Nuts)',         disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Sets',    unit:'No.', def:200,  min:10,   max:20000 }, Cref:18,     Sref:1,    n:1.00, matOpts:['cs','ss316'],           instF:0.10, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp10', desc:'Expansion Joint / Flexible Hose Assembly',          disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'NPS',     unit:'inch',def:4,    min:1,    max:36    }, Cref:2800,   Sref:4,    n:1.15, matOpts:['cs','ss316'],           instF:0.30, hasPT:true,  pDef:10,  tDef:150  },
  { id:'pp11', desc:'Pipe Support — Spring Hanger / Snubber',           disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Qty',     unit:'No.', def:30,   min:1,    max:500   }, Cref:1800,   Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.25, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp12', desc:'Strainer — Y-Type / Basket (Line)',                 disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'NPS',     unit:'inch',def:3,    min:0.5,  max:24    }, Cref:950,    Sref:3,    n:1.20, matOpts:['cs','ss316'],           instF:0.22, hasPT:true,  pDef:20,  tDef:80   },
  { id:'pp13', desc:'Sight Glass / Sight Flow Indicator',               disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'NPS',     unit:'inch',def:2,    min:0.5,  max:6     }, Cref:480,    Sref:2,    n:1.00, matOpts:['cs','ss316'],           instF:0.20, hasPT:true,  pDef:10,  tDef:150  },
  { id:'pp14', desc:'Sample Point / Sample Cooler',                      disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'Points',  unit:'No.', def:5,    min:1,    max:100   }, Cref:1800,   Sref:1,    n:1.00, matOpts:['cs','ss316'],           instF:0.25, hasPT:false, pDef:0,   tDef:40   },
  { id:'pp15', desc:'Flame Arrestor / Detonation Arrestor',             disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'NPS',     unit:'inch',def:4,    min:1,    max:24    }, Cref:3200,   Sref:4,    n:1.10, matOpts:['cs','ss316'],           instF:0.20, hasPT:false, pDef:0,   tDef:80   },
  { id:'pp16', desc:'Silencer / Vent Silencer (Blowdown)',              disc:'Mechanical', cat:'mech', sub:'mech-piping', sizing:{lbl:'NPS',     unit:'inch',def:4,    min:1,    max:24    }, Cref:4500,   Sref:4,    n:1.20, matOpts:['cs','ss304'],           instF:0.25, hasPT:false, pDef:0,   tDef:80   },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — INSULATION & SURFACE PROTECTION
  // ══════════════════════════════════════════════════════════
  { id:'in01m', desc:'Pipe Insulation — Mineral Wool (Hot, ≤650°C)',    disc:'Mechanical', cat:'mech', sub:'mech-insulation', sizing:{lbl:'Area',  unit:'m²', def:500,  min:10,   max:50000 }, Cref:65,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.35, hasPT:false, pDef:0,   tDef:40   },
  { id:'in02m', desc:'Pipe Insulation — PUF (Cold / Cryogenic, ≤−100°C)',disc:'Mechanical',cat:'mech', sub:'mech-insulation', sizing:{lbl:'Area',  unit:'m²', def:200,  min:10,   max:20000 }, Cref:120,    Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.40, hasPT:false, pDef:0,   tDef:40   },
  { id:'in03m', desc:'Equipment Insulation (Vessels & HX)',              disc:'Mechanical', cat:'mech', sub:'mech-insulation', sizing:{lbl:'Area',  unit:'m²', def:200,  min:10,   max:20000 }, Cref:85,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.38, hasPT:false, pDef:0,   tDef:40   },
  { id:'in04m', desc:'Painting & Surface Preparation (Blast + 3 Coat)', disc:'Mechanical', cat:'mech', sub:'mech-insulation', sizing:{lbl:'Area',  unit:'m²', def:2000, min:50,   max:200000}, Cref:22,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.30, hasPT:false, pDef:0,   tDef:40   },
  { id:'in05m', desc:'Fireproofing — Passive (Intumescent / Vermiculite)',disc:'Mechanical',cat:'mech', sub:'mech-insulation', sizing:{lbl:'Area',  unit:'m²', def:300,  min:10,   max:20000 }, Cref:95,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.30, hasPT:false, pDef:0,   tDef:40   },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — MATERIAL HANDLING & LIFTING
  // ══════════════════════════════════════════════════════════
  { id:'mh01', desc:'Belt Conveyor (Bulk Material)',                      disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'Length',  unit:'m',   def:50,   min:5,    max:2000  }, Cref:4800,   Sref:50,   n:0.75, matOpts:['cs'],                   instF:0.45, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh02', desc:'Screw Conveyor (Auger)',                             disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'Length',  unit:'m',   def:10,   min:1,    max:100   }, Cref:3200,   Sref:10,   n:0.70, matOpts:['cs','ss316'],           instF:0.40, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh03', desc:'Bucket Elevator (Continuous / Centrifugal)',         disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'Height',  unit:'m',   def:15,   min:3,    max:80    }, Cref:28000,  Sref:15,   n:0.70, matOpts:['cs'],                   instF:0.45, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh04', desc:'Rotary Valve / Airlock (Rotary Feeder)',             disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'Diameter',unit:'mm',  def:300,  min:50,   max:800   }, Cref:8500,   Sref:300,  n:0.80, matOpts:['cs','ss316'],           instF:0.35, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh05', desc:'Vibrating Screen (Circular / Linear)',               disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'Area',    unit:'m²',  def:4,    min:0.25, max:50    }, Cref:22000,  Sref:4,    n:0.70, matOpts:['cs','ss316'],           instF:0.40, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh06', desc:'Silo / Hopper (Bulk Storage, CS)',                   disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'Volume',  unit:'m³',  def:50,   min:1,    max:5000  }, Cref:12000,  Sref:50,   n:0.62, matOpts:['cs','ss304'],           instF:0.45, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh07', desc:'EOT Crane / Overhead Crane',                         disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'SWL (t)', unit:'t',   def:10,   min:1,    max:500   }, Cref:95000,  Sref:10,   n:0.65, matOpts:['cs'],                   instF:0.35, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh08', desc:'Monorail Hoist / Chain Block',                       disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'SWL (t)', unit:'t',   def:2,    min:0.25, max:50    }, Cref:8500,   Sref:2,    n:0.60, matOpts:['cs'],                   instF:0.25, hasPT:false, pDef:0,   tDef:40   },
  { id:'mh09', desc:'Forklift Truck (Battery / Diesel)',                   disc:'Mechanical', cat:'mech', sub:'mech-handling', sizing:{lbl:'Capacity',unit:'t',   def:3,    min:1,    max:30    }, Cref:32000,  Sref:3,    n:0.65, matOpts:['cs'],                   instF:0.05, hasPT:false, pDef:0,   tDef:40   },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — SEPARATION & SOLIDS HANDLING
  // ══════════════════════════════════════════════════════════
  { id:'se01', desc:'Centrifuge (Decanter / Basket / Disc-Stack)',        disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Capacity', unit:'m³/h',def:20,   min:0.5,  max:500   }, Cref:180000, Sref:20,   n:0.68, matOpts:['cs','ss316','dss'],     instF:0.55, hasPT:false, pDef:0,   tDef:60   },
  { id:'se02', desc:'Cyclone Separator (Gas-Solid / Liquid-Liquid)',      disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Flow',     unit:'m³/h',def:5000, min:100,  max:500000}, Cref:12000,  Sref:5000, n:0.60, matOpts:['cs','ss316'],           instF:0.40, hasPT:false, pDef:0,   tDef:80   },
  { id:'se03', desc:'Bag Filter / Pulse Jet Filter (Dust Collector)',     disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Gas Flow', unit:'m³/h',def:10000,min:500,  max:500000}, Cref:85000,  Sref:10000,n:0.65, matOpts:['cs'],                   instF:0.50, hasPT:false, pDef:0,   tDef:60   },
  { id:'se04', desc:'Electrostatic Precipitator (ESP)',                    disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Gas Flow', unit:'m³/h',def:50000,min:5000, max:2000000},Cref:850000, Sref:50000,n:0.68, matOpts:['cs'],                   instF:0.55, hasPT:false, pDef:0,   tDef:120  },
  { id:'se05', desc:'Rotary Dryer / Spray Dryer',                         disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Evap Rate',unit:'kg/h',def:500,  min:10,   max:50000 }, Cref:220000, Sref:500,  n:0.68, matOpts:['cs','ss316'],           instF:0.58, hasPT:true,  pDef:0,   tDef:150  },
  { id:'se06', desc:'Crystalliser (Forced Circulation / Draft Tube)',     disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Volume',   unit:'m³',  def:20,   min:1,    max:500   }, Cref:480000, Sref:20,   n:0.68, matOpts:['ss316','dss','ti'],     instF:0.60, hasPT:false, pDef:0,   tDef:80   },
  { id:'se07', desc:'Filter Press (Plate & Frame / Membrane)',            disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Filter Area',unit:'m²',def:30,   min:1,    max:500   }, Cref:65000,  Sref:30,   n:0.65, matOpts:['cs','ss316'],           instF:0.45, hasPT:false, pDef:0,   tDef:60   },
  { id:'se08', desc:'Microfiltration / Ultrafiltration Membrane Unit',    disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Flow',     unit:'m³/h',def:50,   min:1,    max:2000  }, Cref:95000,  Sref:50,   n:0.65, matOpts:['cs','ss316'],           instF:0.45, hasPT:false, pDef:0,   tDef:40   },
  { id:'se09', desc:'Reverse Osmosis (RO) Unit',                          disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Permeate', unit:'m³/h',def:20,   min:0.5,  max:1000  }, Cref:65000,  Sref:20,   n:0.65, matOpts:['cs'],                   instF:0.45, hasPT:false, pDef:0,   tDef:40   },
  { id:'se10', desc:'Mixer / Agitator (Top Entry, Side Entry)',            disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Power',    unit:'kW',  def:11,   min:0.2,  max:1000  }, Cref:12000,  Sref:11,   n:0.65, matOpts:['cs','ss316','dss'],     instF:0.40, hasPT:false, pDef:0,   tDef:60   },
  { id:'se11', desc:'Static Mixer (In-line)',                              disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'NPS',      unit:'inch',def:4,    min:0.5,  max:24    }, Cref:1800,   Sref:4,    n:1.10, matOpts:['cs','ss316'],           instF:0.20, hasPT:true,  pDef:10,  tDef:80   },
  { id:'se12', desc:'Calciner / Rotary Kiln',                             disc:'Mechanical', cat:'mech', sub:'mech-separation', sizing:{lbl:'Capacity', unit:'t/h', def:10,   min:0.5,  max:500   }, Cref:850000, Sref:10,   n:0.70, matOpts:['cs'],                   instF:0.60, hasPT:true,  pDef:0,   tDef:800  },

  // ══════════════════════════════════════════════════════════
  // MECHANICAL — SAFETY & ENVIRONMENTAL
  // ══════════════════════════════════════════════════════════
  { id:'sf01', desc:'Flare Stack — Elevated (API 537)',                   disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'Height',   unit:'m',   def:40,   min:5,    max:200   }, Cref:185000, Sref:40,   n:0.75, matOpts:['cs'],                   instF:0.45, hasPT:false, pDef:0,   tDef:40   },
  { id:'sf02', desc:'Flare Knockout Drum (API 521)',                      disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'Volume',   unit:'m³',  def:20,   min:1,    max:500   }, Cref:55000,  Sref:20,   n:0.58, matOpts:['cs'],                   instF:0.50, hasPT:true,  pDef:4,   tDef:80   },
  { id:'sf03', desc:'Emergency Shutdown Valve (ESV / ESD)',               disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'NPS',      unit:'inch',def:4,    min:1,    max:30    }, Cref:8500,   Sref:4,    n:1.20, matOpts:['cs','ss316'],           instF:0.28, hasPT:true,  pDef:50,  tDef:150  },
  { id:'sf04', desc:'Deluge / Water Spray System',                        disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'Area',     unit:'m²',  def:500,  min:50,   max:20000 }, Cref:48,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.40, hasPT:false, pDef:0,   tDef:40   },
  { id:'sf05', desc:'Foam Fire Protection System (AFFF)',                 disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'Area',     unit:'m²',  def:500,  min:50,   max:20000 }, Cref:95,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.42, hasPT:false, pDef:0,   tDef:40   },
  { id:'sf06', desc:'Effluent Treatment Plant (ETP/STP)',                 disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'Flow',     unit:'m³/d',def:500,  min:10,   max:50000 }, Cref:350000, Sref:500,  n:0.68, matOpts:['cs'],                   instF:0.65, hasPT:false, pDef:0,   tDef:40   },
  { id:'sf07', desc:'Oily Water Separator (API 421 / CPI)',               disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'Flow',     unit:'m³/h',def:20,   min:1,    max:1000  }, Cref:48000,  Sref:20,   n:0.65, matOpts:['cs'],                   instF:0.50, hasPT:false, pDef:0,   tDef:40   },
  { id:'sf08', desc:'Acid / Alkali Neutralisation Tank',                  disc:'Mechanical', cat:'mech', sub:'mech-safety', sizing:{lbl:'Volume',   unit:'m³',  def:10,   min:0.5,  max:500   }, Cref:12000,  Sref:10,   n:0.60, matOpts:['cs','ss316'],           instF:0.45, hasPT:false, pDef:0,   tDef:40   },

  // ── CIVIL ─────────────────────────────────────────────────
  { id:'ci01', desc:'Bored Pile Foundation',              disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Volume',     unit:'m³',    def:3.4, min:0.1, max:200   }, Cref:5500,    Sref:3.4,  n:0.70, matOpts:['cs'],                   instF:0.10, hasPT:false, pDef:0,   tDef:25  },
  { id:'ci02', desc:'RC Foundation Pad',                   disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Volume',     unit:'m³',    def:10,  min:0.5, max:500   }, Cref:4800,    Sref:10,   n:0.72, matOpts:['cs'],                   instF:0.08, hasPT:false, pDef:0,   tDef:25  },
  { id:'ci03', desc:'Structural Steel (Pipe Rack)',        disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Tonnage',    unit:'T',     def:50,  min:1,   max:5000  }, Cref:3500,    Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.30, hasPT:false, pDef:0,   tDef:25  },
  { id:'ci04', desc:'Concrete Slab (Ground Level)',        disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Area',       unit:'m²',    def:500, min:10,  max:50000 }, Cref:75,      Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.12, hasPT:false, pDef:0,   tDef:25  },
  { id:'ci05', desc:'Control Room / Substation Building',  disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Area',       unit:'m²',    def:150, min:20,  max:5000  }, Cref:185000,  Sref:150,  n:0.80, matOpts:['cs'],                   instF:0.15, hasPT:false, pDef:0,   tDef:25  },
  { id:'ci06', desc:'Bund Wall & Spill Containment',       disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Perimeter',  unit:'m',     def:80,  min:10,  max:2000  }, Cref:320,     Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.15, hasPT:false, pDef:0,   tDef:25  },
  { id:'ci07', desc:'Access Road (Asphalt)',                disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Area',       unit:'m²',    def:2000,min:100, max:100000}, Cref:65,      Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.10, hasPT:false, pDef:0,   tDef:25  },
  { id:'ci08', desc:'Security Fencing (Chain Link)',        disc:'Civil',          cat:'civil',   sub:'civil',   sizing:{lbl:'Length',     unit:'m',     def:400, min:20,  max:10000 }, Cref:55,      Sref:1,    n:1.00, matOpts:['cs'],                   instF:0.08, hasPT:false, pDef:0,   tDef:25  },
  // ── ELECTRICAL: POWER DISTRIBUTION ──────────────────────────
  { id:'el01', desc:'Power Transformer (Oil Filled, ONAN)',  disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'Rating',    unit:'kVA',  def:1000, min:50,   max:100000}, Cref:82000,  Sref:1000, n:0.60, matOpts:['cs'], instF:0.35, hasPT:false, pDef:0, tDef:40 },
  { id:'el02', desc:'Dry Type Transformer (Cast Resin)',     disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'Rating',    unit:'kVA',  def:500,  min:25,   max:5000  }, Cref:55000,  Sref:500,  n:0.62, matOpts:['cs'], instF:0.30, hasPT:false, pDef:0, tDef:40 },
  { id:'el03', desc:'HV Switchgear Panel (11kV VCB)',        disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'Feeders',   unit:'No.',  def:4,    min:1,    max:30    }, Cref:22000,  Sref:1,    n:1.00, matOpts:['cs'], instF:0.32, hasPT:false, pDef:0, tDef:40 },
  { id:'el04', desc:'LV Main Distribution Board (MDB)',      disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'Incomer',   unit:'A',    def:1600, min:200,  max:6300  }, Cref:18000,  Sref:1600, n:0.55, matOpts:['cs'], instF:0.30, hasPT:false, pDef:0, tDef:40 },
  { id:'el05', desc:'Power Factor Correction Panel (APFC)',  disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'KVAR',      unit:'kVAR', def:500,  min:50,   max:10000 }, Cref:12000,  Sref:500,  n:0.60, matOpts:['cs'], instF:0.28, hasPT:false, pDef:0, tDef:40 },
  { id:'el06', desc:'Diesel Generator Set (Standby)',        disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'Rating',    unit:'kVA',  def:500,  min:50,   max:10000 }, Cref:105000, Sref:500,  n:0.65, matOpts:['cs'], instF:0.40, hasPT:false, pDef:0, tDef:40 },
  { id:'el07', desc:'UPS System (Online, Double Conversion)', disc:'Electrical', cat:'elec', sub:'elec-power', sizing:{lbl:'Rating',    unit:'kVA',  def:20,   min:1,    max:2000  }, Cref:9500,   Sref:20,   n:0.65, matOpts:['cs'], instF:0.25, hasPT:false, pDef:0, tDef:40 },
  { id:'el08', desc:'Battery Bank (VRLA/Li-ion)',            disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'Capacity',  unit:'kWh',  def:50,   min:5,    max:5000  }, Cref:18000,  Sref:50,   n:0.80, matOpts:['cs'], instF:0.20, hasPT:false, pDef:0, tDef:40 },
  { id:'el09', desc:'Solar PV System (Rooftop/Ground)',      disc:'Electrical', cat:'elec', sub:'elec-power',  sizing:{lbl:'Capacity',  unit:'kWp',  def:100,  min:5,    max:20000 }, Cref:45000,  Sref:100,  n:0.85, matOpts:['cs'], instF:0.15, hasPT:false, pDef:0, tDef:40 },
  // ── ELECTRICAL: MOTOR CONTROL ────────────────────────────────
  { id:'el10', desc:'Motor Control Centre (MCC)',             disc:'Electrical', cat:'elec', sub:'elec-mcc',   sizing:{lbl:'Load',      unit:'kW',   def:400,  min:20,   max:20000 }, Cref:45000,  Sref:400,  n:0.55, matOpts:['cs'], instF:0.38, hasPT:false, pDef:0, tDef:40 },
  { id:'el11', desc:'Variable Frequency Drive (LV, ≤690V)',   disc:'Electrical', cat:'elec', sub:'elec-mcc',   sizing:{lbl:'Power',     unit:'kW',   def:22,   min:0.5,  max:2000  }, Cref:6500,   Sref:22,   n:0.70, matOpts:['cs'], instF:0.30, hasPT:false, pDef:0, tDef:40 },
  { id:'el12', desc:'VFD (MV, 3.3kV / 6.6kV)',               disc:'Electrical', cat:'elec', sub:'elec-mcc',   sizing:{lbl:'Power',     unit:'kW',   def:500,  min:100,  max:20000 }, Cref:95000,  Sref:500,  n:0.68, matOpts:['cs'], instF:0.35, hasPT:false, pDef:0, tDef:40 },
  { id:'el13', desc:'Soft Starter (LV)',                      disc:'Electrical', cat:'elec', sub:'elec-mcc',   sizing:{lbl:'Power',     unit:'kW',   def:45,   min:5.5,  max:1000  }, Cref:2800,   Sref:45,   n:0.68, matOpts:['cs'], instF:0.25, hasPT:false, pDef:0, tDef:40 },
  { id:'el14', desc:'DOL / Star-Delta Starter Panel',         disc:'Electrical', cat:'elec', sub:'elec-mcc',   sizing:{lbl:'Power',     unit:'kW',   def:22,   min:0.37, max:160   }, Cref:850,    Sref:22,   n:0.65, matOpts:['cs'], instF:0.22, hasPT:false, pDef:0, tDef:40 },
  // ── ELECTRICAL: MOTORS ───────────────────────────────────────
  { id:'el15', desc:'LV Motor IE3 TEFC (≤690V)',              disc:'Electrical', cat:'elec', sub:'elec-motors', sizing:{lbl:'Power',    unit:'kW',   def:22,   min:0.18, max:1000  }, Cref:2600,   Sref:22,   n:0.68, matOpts:['cs'], instF:0.28, hasPT:false, pDef:0, tDef:40 },
  { id:'el16', desc:'LV Motor Flameproof (Ex-d, Zone 1)',     disc:'Electrical', cat:'elec', sub:'elec-motors', sizing:{lbl:'Power',    unit:'kW',   def:22,   min:0.18, max:400   }, Cref:4800,   Sref:22,   n:0.68, matOpts:['cs'], instF:0.30, hasPT:false, pDef:0, tDef:40 },
  { id:'el17', desc:'HV Motor (6.6kV / 11kV, TEFC)',          disc:'Electrical', cat:'elec', sub:'elec-motors', sizing:{lbl:'Power',    unit:'kW',   def:750,  min:100,  max:20000 }, Cref:95000,  Sref:750,  n:0.65, matOpts:['cs'], instF:0.32, hasPT:false, pDef:0, tDef:40 },
  { id:'el18', desc:'Submersible Motor (Pump-set)',            disc:'Electrical', cat:'elec', sub:'elec-motors', sizing:{lbl:'Power',    unit:'kW',   def:7.5,  min:0.37, max:200   }, Cref:3200,   Sref:7.5,  n:0.65, matOpts:['cs'], instF:0.25, hasPT:false, pDef:0, tDef:40 },
  // ── ELECTRICAL: CABLES & WIRING ──────────────────────────────
  { id:'el19', desc:'LV Power Cable (XLPE/PVC, ≤1.1kV)',      disc:'Electrical', cat:'elec', sub:'elec-cables', sizing:{lbl:'Length',   unit:'m',    def:500,  min:10,   max:100000}, Cref:12,     Sref:1,    n:1.00, matOpts:['cs'], instF:0.30, hasPT:false, pDef:0, tDef:40 },
  { id:'el20', desc:'HV Cable (6.6kV / 11kV, XLPE)',          disc:'Electrical', cat:'elec', sub:'elec-cables', sizing:{lbl:'Length',   unit:'m',    def:200,  min:10,   max:20000 }, Cref:85,     Sref:1,    n:1.00, matOpts:['cs'], instF:0.35, hasPT:false, pDef:0, tDef:40 },
  { id:'el21', desc:'Control Cable (Multi-core, 1.5mm²)',      disc:'Electrical', cat:'elec', sub:'elec-cables', sizing:{lbl:'Length',   unit:'m',    def:1000, min:50,   max:200000}, Cref:4.5,    Sref:1,    n:1.00, matOpts:['cs'], instF:0.28, hasPT:false, pDef:0, tDef:40 },
  { id:'el22', desc:'Cable Tray (GI / FRP, 300mm wide)',       disc:'Electrical', cat:'elec', sub:'elec-cables', sizing:{lbl:'Length',   unit:'m',    def:300,  min:10,   max:20000 }, Cref:28,     Sref:1,    n:1.00, matOpts:['cs'], instF:0.25, hasPT:false, pDef:0, tDef:40 },
  { id:'el23', desc:'Cable Conduit (GI/PVC, 25–50mm)',         disc:'Electrical', cat:'elec', sub:'elec-cables', sizing:{lbl:'Length',   unit:'m',    def:200,  min:10,   max:20000 }, Cref:8,      Sref:1,    n:1.00, matOpts:['cs'], instF:0.22, hasPT:false, pDef:0, tDef:40 },
  // ── ELECTRICAL: EARTHING & LIGHTNING ─────────────────────────
  { id:'el24', desc:'Earthing & Grounding System',             disc:'Electrical', cat:'elec', sub:'elec-earthing', sizing:{lbl:'Area',  unit:'m²',   def:5000, min:100,  max:500000}, Cref:3500,   Sref:5000, n:0.70, matOpts:['cs'], instF:0.20, hasPT:false, pDef:0, tDef:40 },
  { id:'el25', desc:'Lightning Protection System (LPS)',        disc:'Electrical', cat:'elec', sub:'elec-earthing', sizing:{lbl:'Area',  unit:'m²',   def:5000, min:100,  max:500000}, Cref:2800,   Sref:5000, n:0.65, matOpts:['cs'], instF:0.18, hasPT:false, pDef:0, tDef:40 },
  // ── ELECTRICAL: LIGHTING & MISC ──────────────────────────────
  { id:'el26', desc:'Area Lighting (LED, Hazardous Zone)',      disc:'Electrical', cat:'elec', sub:'elec-lighting', sizing:{lbl:'Fixtures', unit:'No.', def:50,  min:5,    max:2000  }, Cref:1200,   Sref:1,    n:1.00, matOpts:['cs'], instF:0.22, hasPT:false, pDef:0, tDef:40 },
  { id:'el27', desc:'Area Lighting (LED, Safe Zone)',           disc:'Electrical', cat:'elec', sub:'elec-lighting', sizing:{lbl:'Fixtures', unit:'No.', def:80,  min:5,    max:5000  }, Cref:450,    Sref:1,    n:1.00, matOpts:['cs'], instF:0.20, hasPT:false, pDef:0, tDef:40 },
  { id:'el28', desc:'Emergency Lighting & Exit Signs',          disc:'Electrical', cat:'elec', sub:'elec-lighting', sizing:{lbl:'Fixtures', unit:'No.', def:20,  min:2,    max:500   }, Cref:380,    Sref:1,    n:1.00, matOpts:['cs'], instF:0.18, hasPT:false, pDef:0, tDef:40 },

  // ── INSTRUMENTATION: TRANSMITTERS ────────────────────────────
  { id:'in01', desc:'Pressure Transmitter (HART, 4-20mA)',      disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:10,  min:1, max:500}, Cref:1200,  Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.42, hasPT:false, pDef:0, tDef:25 },
  { id:'in02', desc:'Pressure Transmitter (Smart, FOUNDATION FB)',disc:'Instrumentation',cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:5,   min:1, max:200}, Cref:1800,  Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.42, hasPT:false, pDef:0, tDef:25 },
  { id:'in03', desc:'Differential Pressure Transmitter (DP)',    disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:8,   min:1, max:300}, Cref:1500,  Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.43, hasPT:false, pDef:0, tDef:25 },
  { id:'in04', desc:'Temperature Transmitter (4-20mA, HART)',    disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:15,  min:1, max:500}, Cref:850,   Sref:1, n:1.00, matOpts:['cs'],         instF:0.40, hasPT:false, pDef:0, tDef:25 },
  { id:'in05', desc:'Thermocouple / RTD Element + Thermowell',   disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:20,  min:1, max:500}, Cref:380,   Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.35, hasPT:false, pDef:0, tDef:25 },
  { id:'in06', desc:'Flow Transmitter — Magnetic (Flanged)',      disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:6,   min:1, max:100}, Cref:4800,  Sref:1, n:1.00, matOpts:['ss316'],      instF:0.45, hasPT:false, pDef:0, tDef:25 },
  { id:'in07', desc:'Flow Transmitter — Coriolis (Mass Flow)',    disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:4,   min:1, max:50 }, Cref:9500,  Sref:1, n:1.00, matOpts:['ss316','ti'], instF:0.48, hasPT:false, pDef:0, tDef:25 },
  { id:'in08', desc:'Flow Transmitter — Vortex',                  disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:5,   min:1, max:100}, Cref:3200,  Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.43, hasPT:false, pDef:0, tDef:25 },
  { id:'in09', desc:'Flow Transmitter — Orifice + DP Cell',       disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:8,   min:1, max:200}, Cref:2200,  Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.42, hasPT:false, pDef:0, tDef:25 },
  { id:'in10', desc:'Ultrasonic Flow Meter (Clamp-on)',           disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:3,   min:1, max:50 }, Cref:6500,  Sref:1, n:1.00, matOpts:['cs'],         instF:0.30, hasPT:false, pDef:0, tDef:25 },
  { id:'in11', desc:'Level Transmitter (Guided Wave Radar GWR)',  disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:8,   min:1, max:200}, Cref:4500,  Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.43, hasPT:false, pDef:0, tDef:25 },
  { id:'in12', desc:'Level Transmitter (Non-contact Radar)',      disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:5,   min:1, max:100}, Cref:5800,  Sref:1, n:1.00, matOpts:['cs'],         instF:0.40, hasPT:false, pDef:0, tDef:25 },
  { id:'in13', desc:'Level Switch (Float / Displacer)',           disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:10,  min:1, max:200}, Cref:950,   Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.38, hasPT:false, pDef:0, tDef:25 },
  { id:'in14', desc:'Level Gauge (Glass / Reflex)',               disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:12,  min:1, max:200}, Cref:620,   Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.30, hasPT:false, pDef:0, tDef:25 },
  { id:'in15', desc:'Pressure Gauge (Bourdon, Local)',            disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:20,  min:1, max:500}, Cref:180,   Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.25, hasPT:false, pDef:0, tDef:25 },
  { id:'in16', desc:'Pressure Switch / Pressure Safety Switch',  disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:8,   min:1, max:200}, Cref:650,   Sref:1, n:1.00, matOpts:['cs','ss316'], instF:0.30, hasPT:false, pDef:0, tDef:25 },
  { id:'in17', desc:'Temperature Switch (Bimetal / Electronic)',  disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:6,   min:1, max:100}, Cref:420,   Sref:1, n:1.00, matOpts:['cs'],         instF:0.28, hasPT:false, pDef:0, tDef:25 },
  { id:'in18', desc:'Vibration Monitor (Proximity Probe, API)',   disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:4,   min:1, max:100}, Cref:3800,  Sref:1, n:1.00, matOpts:['cs'],         instF:0.40, hasPT:false, pDef:0, tDef:25 },
  { id:'in19', desc:'Gas Detector (Catalytic / IR, Fixed)',       disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:12,  min:1, max:300}, Cref:2200,  Sref:1, n:1.00, matOpts:['cs'],         instF:0.38, hasPT:false, pDef:0, tDef:25 },
  { id:'in20', desc:'Flame Detector (UV/IR)',                     disc:'Instrumentation', cat:'inst', sub:'inst-transmitters', sizing:{lbl:'Tags', unit:'No.', def:6,   min:1, max:100}, Cref:3500,  Sref:1, n:1.00, matOpts:['cs'],         instF:0.35, hasPT:false, pDef:0, tDef:25 },
  // ── INSTRUMENTATION: CONTROL VALVES ──────────────────────────
  { id:'in21', desc:'Control Valve Globe (PN40, Pneumatic Actuator)',disc:'Instrumentation',cat:'inst',sub:'inst-control-valves',sizing:{lbl:'NPS',unit:'inch',def:3,min:0.5,max:24}, Cref:5500,  Sref:3, n:1.18, matOpts:['cs','ss316'],          instF:0.28, hasPT:true, pDef:25,  tDef:150 },
  { id:'in22', desc:'Control Valve Butterfly (Modulating, Electro-Pneumatic)',disc:'Instrumentation',cat:'inst',sub:'inst-control-valves',sizing:{lbl:'NPS',unit:'inch',def:6,min:2,max:48}, Cref:3800, Sref:6, n:1.12, matOpts:['cs','ss316'],  instF:0.25, hasPT:true, pDef:16,  tDef:100 },
  { id:'in23', desc:'Control Valve Ball (Segment Ball, High-Cv)',  disc:'Instrumentation',cat:'inst',sub:'inst-control-valves',sizing:{lbl:'NPS',unit:'inch',def:4,min:1,max:24},    Cref:7200,  Sref:4, n:1.15, matOpts:['cs','ss316','dss'],    instF:0.28, hasPT:true, pDef:40,  tDef:120 },
  { id:'in24', desc:'On-Off Solenoid Valve (Pneumatic, 2/3-way)',  disc:'Instrumentation',cat:'inst',sub:'inst-control-valves',sizing:{lbl:'NPS',unit:'inch',def:2,min:0.25,max:6},  Cref:1800,  Sref:2, n:1.00, matOpts:['cs','ss316'],          instF:0.22, hasPT:true, pDef:10,  tDef:80  },
  { id:'in25', desc:'Electro-Hydraulic Actuated Valve (EHV)',     disc:'Instrumentation',cat:'inst',sub:'inst-control-valves',sizing:{lbl:'NPS',unit:'inch',def:6,min:2,max:36},    Cref:22000, Sref:6, n:1.20, matOpts:['cs','ss316'],          instF:0.32, hasPT:true, pDef:60,  tDef:200 },
  { id:'in26', desc:'Positioner (Smart, HART/FOUNDATION FB)',      disc:'Instrumentation',cat:'inst',sub:'inst-control-valves',sizing:{lbl:'Tags',unit:'No.',def:8,min:1,max:200},   Cref:1400,  Sref:1, n:1.00, matOpts:['cs'],                  instF:0.20, hasPT:false,pDef:0,   tDef:25  },
  { id:'in27', desc:'Air Filter Regulator (AFR) Set',             disc:'Instrumentation',cat:'inst',sub:'inst-control-valves',sizing:{lbl:'Sets',unit:'No.',def:10,min:1,max:200},  Cref:280,   Sref:1, n:1.00, matOpts:['cs'],                  instF:0.18, hasPT:false,pDef:0,   tDef:25  },
  // ── INSTRUMENTATION: SYSTEMS & PANELS ────────────────────────
  { id:'in28', desc:'DCS — Distributed Control System',           disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'I/O', unit:'I/O',  def:200, min:32,  max:5000 }, Cref:95000, Sref:200,  n:0.70, matOpts:['cs'], instF:0.50, hasPT:false, pDef:0, tDef:25 },
  { id:'in29', desc:'SIS — Safety Instrumented System (SIL-2)',   disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'I/O', unit:'I/O',  def:64,  min:16,  max:2000 }, Cref:65000, Sref:64,   n:0.68, matOpts:['cs'], instF:0.52, hasPT:false, pDef:0, tDef:25 },
  { id:'in30', desc:'PLC Panel (Local, Non-Safety)',               disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'I/O', unit:'I/O',  def:48,  min:16,  max:1000 }, Cref:18000, Sref:48,   n:0.65, matOpts:['cs'], instF:0.45, hasPT:false, pDef:0, tDef:25 },
  { id:'in31', desc:'Fire & Gas Detection System (F&G Panel)',     disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'Detectors',unit:'No.',def:30,min:4,max:500},    Cref:28000, Sref:30,   n:0.65, matOpts:['cs'], instF:0.48, hasPT:false, pDef:0, tDef:25 },
  { id:'in32', desc:'CCTV Surveillance System',                    disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'Cameras', unit:'No.',def:12,  min:2,   max:500  }, Cref:2800,  Sref:1,    n:1.00, matOpts:['cs'], instF:0.25, hasPT:false, pDef:0, tDef:25 },
  { id:'in33', desc:'PA / Emergency Communication System',         disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'Speakers',unit:'No.',def:20,  min:4,   max:300  }, Cref:1200,  Sref:1,    n:1.00, matOpts:['cs'], instF:0.22, hasPT:false, pDef:0, tDef:25 },
  { id:'in34', desc:'SCADA / HMI Workstation',                     disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'Stations',unit:'No.',def:3,   min:1,   max:50   }, Cref:12000, Sref:1,    n:1.00, matOpts:['cs'], instF:0.20, hasPT:false, pDef:0, tDef:25 },
  { id:'in35', desc:'Network Switch (Industrial Ethernet, Managed)',disc:'Instrumentation',cat:'inst',sub:'inst-systems',sizing:{lbl:'Ports',  unit:'No.',def:24,  min:8,   max:96   }, Cref:3500,  Sref:24,   n:0.70, matOpts:['cs'], instF:0.18, hasPT:false, pDef:0, tDef:25 },
  // ── INSTRUMENTATION: CABLES & FIELD WIRING ───────────────────
  { id:'in36', desc:'Instrument Cable (Shielded, Pair/Multi-pair)', disc:'Instrumentation',cat:'inst',sub:'inst-cables',sizing:{lbl:'Length',unit:'m',def:2000,min:50,max:200000},   Cref:3.8,   Sref:1,    n:1.00, matOpts:['cs'], instF:0.30, hasPT:false, pDef:0, tDef:25 },
  { id:'in37', desc:'Fieldbus / Profibus Cable (FF/DP)',            disc:'Instrumentation',cat:'inst',sub:'inst-cables',sizing:{lbl:'Length',unit:'m',def:500, min:20,max:20000},     Cref:8.5,   Sref:1,    n:1.00, matOpts:['cs'], instF:0.28, hasPT:false, pDef:0, tDef:25 },
  { id:'in38', desc:'Thermocouple Extension Cable',                  disc:'Instrumentation',cat:'inst',sub:'inst-cables',sizing:{lbl:'Length',unit:'m',def:500, min:10,max:20000},     Cref:5.5,   Sref:1,    n:1.00, matOpts:['cs'], instF:0.25, hasPT:false, pDef:0, tDef:25 },
  { id:'in39', desc:'Junction Box (Field, SS/GRP, EEx)',             disc:'Instrumentation',cat:'inst',sub:'inst-cables',sizing:{lbl:'Boxes',unit:'No.',def:15,  min:1,  max:300},     Cref:950,   Sref:1,    n:1.00, matOpts:['cs','ss316'], instF:0.28, hasPT:false, pDef:0, tDef:25 },
  { id:'in40', desc:'Instrument Cable Tray (Perforated, 150mm)',    disc:'Instrumentation',cat:'inst',sub:'inst-cables',sizing:{lbl:'Length',unit:'m',def:400, min:20,max:20000},     Cref:18,    Sref:1,    n:1.00, matOpts:['cs'], instF:0.22, hasPT:false, pDef:0, tDef:25 },
  { id:'in41', desc:'Marshalling Cabinet (Cross-wiring Panel)',      disc:'Instrumentation',cat:'inst',sub:'inst-cables',sizing:{lbl:'Terminals',unit:'No.',def:200,min:24,max:2000},  Cref:180,   Sref:1,    n:0.90, matOpts:['cs'], instF:0.25, hasPT:false, pDef:0, tDef:25 },
  // ── INSTRUMENTATION: UTILITIES & MISC ────────────────────────
  { id:'in42', desc:'Instrument Air Dryer + Filter Package',        disc:'Instrumentation',cat:'inst',sub:'inst-utilities',sizing:{lbl:'Flow',unit:'Nm³/h',def:150,min:10,max:3000},  Cref:38000, Sref:150,  n:0.65, matOpts:['cs'], instF:0.50, hasPT:false, pDef:0, tDef:25 },
  { id:'in43', desc:'Instrument Air Header + Distribution',          disc:'Instrumentation',cat:'inst',sub:'inst-utilities',sizing:{lbl:'Outlets',unit:'No.',def:40, min:5, max:500},  Cref:350,   Sref:1,    n:1.00, matOpts:['cs','ss316'], instF:0.25, hasPT:false, pDef:0, tDef:25 },
  { id:'in44', desc:'Control Panel / Local Control Station (LCS)',  disc:'Instrumentation',cat:'inst',sub:'inst-utilities',sizing:{lbl:'Panels',unit:'No.',def:5,  min:1,  max:100},   Cref:3200,  Sref:1,    n:1.00, matOpts:['cs'], instF:0.30, hasPT:false, pDef:0, tDef:25 },
  { id:'in45', desc:'Annunciator Panel (Window/LED Type)',           disc:'Instrumentation',cat:'inst',sub:'inst-utilities',sizing:{lbl:'Windows',unit:'No.',def:48, min:8,  max:500},  Cref:180,   Sref:1,    n:0.85, matOpts:['cs'], instF:0.20, hasPT:false, pDef:0, tDef:25 },
];

// ─────────────────────────────────────────────────────────────
// SECTION 3: CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────
function powerLaw(Cref, Sref, S, n) {
  if (S <= 0 || Sref <= 0) return 0;
  return Cref * Math.pow(Math.max(S, 0.001) / Sref, n);
}

function calcPTFactor(pressure, temperature) {
  let pF = 1.0;
  if      (pressure <= 10)  pF = 1.00;
  else if (pressure <= 50)  pF = 1.15;
  else if (pressure <= 100) pF = 1.35;
  else if (pressure <= 200) pF = 1.65;
  else                       pF = 2.10;

  let tF = 1.0;
  if      (temperature <= -50) tF = 1.40;
  else if (temperature <= 150) tF = 1.00;
  else if (temperature <= 300) tF = 1.20;
  else if (temperature <= 450) tF = 1.50;
  else                          tF = 1.90;

  return pF * tF;
}

function buildGlobals(params, liveFX) {
  const country    = params.country    || 'IN';
  const year       = parseInt(params.year) || 2025;
  const basis      = params.basis      || 'pec';
  const currMode   = params.curr       || 'local';
  const complexity = params.complexity || 'moderate';
  const loc        = LOC[country]      || LOC.US;
  const ci         = params.liveCEPCI  || CEPCI[year] || 810;
  const Fc         = ci / CEPCI_REF;
  const Fl         = loc.f;
  const fxRates    = liveFX            || FX_STATIC;
  const fxR        = fxRates[loc.c]   || 1;
  const sym        = currMode === 'usd' ? '$' : loc.s;
  const toLocal    = currMode === 'usd' ? (v => v) : (v => v * fxR);
  const cxF        = CX_F[complexity]  || 1.0;
  return { loc, ci, Fc, Fl, fxR, sym, toLocal, cxF, basis, year };
}

function calcItem(item, size, matKey, qty, pressure, temperature, globals) {
  const { Fc, Fl, toLocal, basis, cxF } = globals;
  const Fm   = MAT_F[matKey] || 1.0;
  const Fpt  = (item.hasPT && pressure != null && temperature != null)
    ? calcPTFactor(pressure, temperature) : 1.0;

  let Fadd = 1.0;
  if (item.apiFactor)      Fadd *= item.apiFactor;
  if (item.trayFactor)     Fadd *= item.trayFactor;
  if (item.packedFactor)   Fadd *= item.packedFactor;
  if (item.typeFactor)     Fadd *= item.typeFactor;
  if (item.driverFactor)   Fadd *= item.driverFactor;
  if (item.actuatorFactor) Fadd *= item.actuatorFactor;

  const Cp0      = powerLaw(item.Cref, item.Sref, size, item.n);
  const pec_usd  = Cp0 * Fc * Fl * Fm * Fpt * Fadd;
  const instFact = basis === 'tic' ? (1 + item.instF * cxF) : 1.0;
  const unit_usd = pec_usd * instFact;
  const total_usd= unit_usd * qty;
  const low_usd  = total_usd * 0.85;
  const high_usd = total_usd * 1.25;

  return {
    unit_usd, total_usd, low_usd, high_usd,
    unit_local:  toLocal(unit_usd),
    total_local: toLocal(total_usd),
    low_local:   toLocal(low_usd),
    high_local:  toLocal(high_usd),
    Fpt: +Fpt.toFixed(3), Fm: +Fm.toFixed(3), Fadd: +Fadd.toFixed(3),
  };
}

// ─────────────────────────────────────────────────────────────
// SECTION 4: PHYSICS BULK MTO
// ─────────────────────────────────────────────────────────────
function calcPhysicsBulk(physics, globals) {
  const { Fc, Fl, toLocal } = globals;
  const p = physics.piping     || {};
  const e = physics.electrical || {};
  const s = physics.structural || {};
  const i = physics.instruments|| {};

  const liquidQ   = (p.liquidFlow || 0) / 3600;
  const gasQ      = (p.gasFlow    || 0) / 3600;
  const totalLen  = (p.branches   || 0) * (p.avgLength || 0) * 2;
  const csPipe    = Math.round(totalLen * 0.8);
  const ssPipe    = Math.round(totalLen * 0.2);
  const valves    = Math.round(totalLen / 50);
  const pipingCost= (csPipe * 38 + ssPipe * 95 + valves * 680) * Fc * Fl;

  const kva      = ((e.totalKw || 0) * (e.diversity || 0.75) / Math.max(e.pf || 0.85, 0.1)) * 1.25;
  const txKva    = Math.ceil(kva / 100) * 100;
  const hvCable  = (e.cableLen || 150) * 1.2;
  const lvCable  = (e.cableLen || 150) * (p.branches || 12) * 0.8;
  const mccCount = Math.ceil(((e.totalKw || 0) * (e.diversity || 0.75)) / 400);
  const elecCost = (txKva * 82 + hvCable * 45 + lvCable * 12 + mccCount * 45000) * Fc * Fl;

  const eqSteel   = (s.heavyEq  || 0) * (s.eqWeight  || 0) * 0.3;
  const rackSteel = (s.rackLen  || 0) * (s.rackTiers || 0) * 25 / 1000;
  const totalSteel= (eqSteel + rackSteel) * (s.seismic || 1.15);
  const structCost= totalSteel * 3200 * Fc * Fl;

  const totalEq   = (i.units || 0) * (i.eqPerUnit || 0);
  const ioCount   = Math.round(totalEq * (i.density || 14) * (i.sil || 1.3) * (1 + (i.fieldbus || 40) / 100 * 0.3));
  const dcsCost   = 95000 * Math.pow(Math.max(ioCount, 1) / 200, 0.7) * ((i.sil || 1.3) > 1.2 ? 1.4 : 1.0) * Fc * Fl;
  const instCable = totalEq * (i.density || 14) * 15;

  const totalCost = pipingCost + elecCost + structCost + dcsCost;
  return {
    piping:      { csPipe, ssPipe, valves, cost: pipingCost,  cost_local: toLocal(pipingCost)  },
    electrical:  { txKva, hvCable: +hvCable.toFixed(0), lvCable: +lvCable.toFixed(0), mccCount, cost: elecCost,   cost_local: toLocal(elecCost)   },
    structural:  { totalSteel: +totalSteel.toFixed(1), cost: structCost,  cost_local: toLocal(structCost)  },
    instruments: { ioCount, instCable: +instCable.toFixed(0), cost: dcsCost,    cost_local: toLocal(dcsCost)    },
    totalCost,
    totalCost_local: toLocal(totalCost),
  };
}

// ─────────────────────────────────────────────────────────────
// SECTION 5: INDIRECT COST ENGINE
// ─────────────────────────────────────────────────────────────
function calcIndirectTotal(items, indirectPct, discIndirectPct, indirectMode, globals) {
  const { toLocal } = globals;
  const decByDisc = { process: 0, mech: 0, civil: 0, elec: 0, inst: 0 };
  let decTotal_local = 0;

  items.forEach(({ item: id, size, mat, qty, pressure, temperature }) => {
    if (!qty || qty <= 0) return;
    const it  = ITEMS.find(x => x.id === id);
    if (!it) return;
    const res = calcItem(it, size || it.sizing.def, mat || it.matOpts[0], qty,
      pressure ?? it.pDef, temperature ?? it.tDef, globals);
    decByDisc[it.cat] = (decByDisc[it.cat] || 0) + res.total_local;
    decTotal_local += res.total_local;
  });

  if (indirectMode === 'discipline') {
    let total = 0;
    Object.keys(DISC_INDIRECT_DEFAULTS).forEach(disc => {
      const pcts = (discIndirectPct && discIndirectPct[disc]) || DISC_INDIRECT_DEFAULTS[disc];
      const dec  = decByDisc[disc] || 0;
      Object.values(pcts).forEach(pct => { total += dec * pct / 100; });
    });
    return { total, mode: 'discipline', decByDisc, decTotal: decTotal_local };
  }

  // Flat mode
  const pcts = indirectPct || INDIRECT_DEFAULTS;
  const totalPct = Object.values(pcts).reduce((a, b) => a + b, 0);
  const total    = Object.values(pcts).reduce((a, pct) => a + decTotal_local * pct / 100, 0);
  return { total, totalPct, mode: 'flat', decTotal: decTotal_local };
}

// ─────────────────────────────────────────────────────────────
// SECTION 6: VALIDATION
// ─────────────────────────────────────────────────────────────
function validateItems(items) {
  const issues = [];
  items.forEach(({ item: id, size, qty, pressure, temperature }) => {
    if (!qty || qty <= 0) return;
    const it = ITEMS.find(x => x.id === id);
    if (!it) { issues.push({ id, msg: `Unknown item: ${id}`, severity: 'error' }); return; }
    if (!size || size <= 0)       issues.push({ id, desc: it.desc, msg: 'Size must be > 0', severity: 'error' });
    if (size < it.sizing.min)     issues.push({ id, desc: it.desc, msg: `Size ${size} below minimum ${it.sizing.min} ${it.sizing.unit}`, severity: 'error' });
    if (size > it.sizing.max)     issues.push({ id, desc: it.desc, msg: `Size ${size} exceeds maximum ${it.sizing.max} ${it.sizing.unit}`, severity: 'error' });
    if (qty > 9999)               issues.push({ id, desc: it.desc, msg: `Qty ${qty} seems unreasonably high`, severity: 'warn' });
    if (it.hasPT) {
      if ((pressure || 0) < 0)   issues.push({ id, desc: it.desc, msg: 'Pressure cannot be negative', severity: 'error' });
      if ((pressure || 0) > 500) issues.push({ id, desc: it.desc, msg: `Pressure ${pressure} barg is very high — verify`, severity: 'warn' });
      if ((temperature || 0) < -196) issues.push({ id, desc: it.desc, msg: `Temperature ${temperature}°C below LOX limit`, severity: 'warn' });
      if ((temperature || 0) > 900)  issues.push({ id, desc: it.desc, msg: `Temperature ${temperature}°C — refractory required`, severity: 'warn' });
    }
  });
  return issues;
}

// ─────────────────────────────────────────────────────────────
// SECTION 7: CSV EXPORT BUILDER
// ─────────────────────────────────────────────────────────────
function buildCSV(items, physicsResult, globals, indirectResult) {
  const { sym, toLocal } = globals;
  const rows = [[
    'ID','Description','Discipline','Category','Sizing Param','Size','Unit',
    'Pressure_barg','Temperature_C','Material','Qty',
    `Unit_Cost_${sym}`,`Total_Cost_${sym}`,`P10_${sym}`,`P90_${sym}`,'Fpt','Fm',
  ]];
  let grand = 0;
  items.forEach(({ item: id, size, mat, qty, pressure, temperature }) => {
    const it  = ITEMS.find(x => x.id === id);
    if (!it || !qty || qty <= 0) return;
    const res = calcItem(it, size || it.sizing.def, mat || it.matOpts[0], qty,
      pressure ?? it.pDef, temperature ?? it.tDef, globals);
    rows.push([
      id, it.desc, it.disc, it.cat, it.sizing.lbl, size, it.sizing.unit,
      pressure ?? '', temperature ?? '', MAT_L[mat] || mat, qty,
      Math.round(res.unit_local), Math.round(res.total_local),
      Math.round(res.low_local),  Math.round(res.high_local),
      res.Fpt, res.Fm,
    ]);
    grand += res.total_local;
  });
  if (physicsResult) {
    const p = physicsResult;
    rows.push(['BULK_PIPING',   'Physics Bulk — Piping',       'Bulk','bulk','—','','','','','','1','',Math.round(p.piping?.cost_local||0),'','','','']);
    rows.push(['BULK_ELEC',     'Physics Bulk — Electrical',   'Bulk','bulk','—','','','','','','1','',Math.round(p.electrical?.cost_local||0),'','','','']);
    rows.push(['BULK_STRUCT',   'Physics Bulk — Structural',   'Bulk','bulk','—','','','','','','1','',Math.round(p.structural?.cost_local||0),'','','','']);
    rows.push(['BULK_INST',     'Physics Bulk — Instruments',  'Bulk','bulk','—','','','','','','1','',Math.round(p.instruments?.cost_local||0),'','','','']);
    grand += p.totalCost_local || 0;
  }
  if (indirectResult) {
    rows.push(['INDIRECT','Indirect Costs','Indirect','indirect','—','','','','','','1','',Math.round(indirectResult.total||0),'','','','']);
    grand += indirectResult.total || 0;
  }
  rows.push(['','','','','','','','','','',`GRAND TOTAL (${sym})`, Math.round(grand),'','','','','']);
  return rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
}

// ─────────────────────────────────────────────────────────────
// SECTION 8: LIVE MARKET DATA
// ─────────────────────────────────────────────────────────────

// In-memory cache (per serverless instance lifecycle, ~6h TTL)
let _cache = { data: null, ts: 0 };
const CACHE_TTL = 6 * 60 * 60 * 1000;

async function fetchLiveData() {
  const now = Date.now();
  if (_cache.data && (now - _cache.ts) < CACHE_TTL) {
    return { ..._cache.data, cached: true, cache_age_min: Math.round((now - _cache.ts) / 60000) };
  }

  const [fxResult, cepciResult, commResult] = await Promise.allSettled([
    fetchFX(), fetchCEPCI(), fetchCommodities(),
  ]);

  const data = {
    fx:          fxResult.status    === 'fulfilled' ? fxResult.value    : { rates: FX_STATIC,  source: 'fallback' },
    cepci:       cepciResult.status === 'fulfilled' ? cepciResult.value : { cepci_estimate: 810, historical: CEPCI, source: 'fallback' },
    commodities: commResult.status  === 'fulfilled' ? commResult.value  : { hrc_steel_t: 680, copper_t: 9200, source: 'fallback' },
  };

  _cache = { data, ts: now };
  return { ...data, cached: false, cache_age_min: 0 };
}

async function fetchFX() {
  // Free tier — no API key needed
  const r = await fetch('https://open.er-api.com/v6/latest/USD', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) throw new Error('FX fetch failed');
  const d = await r.json();
  if (!d.rates) throw new Error('No rates in FX response');
  const want = ['USD','EUR','GBP','INR','CAD','AUD','SGD','CNY','JPY','KRW','ZAR','EGP','BRL','NOK','AED','SAR','QAR'];
  const rates = { USD: 1 };
  want.forEach(c => { if (d.rates[c]) rates[c] = d.rates[c]; });
  return { rates, source: 'open.er-api.com', ts: new Date().toISOString() };
}

async function fetchCEPCI() {
  // BLS PPI Chemical Manufacturing — free, no key for single series
  const year = new Date().getFullYear();
  const url  = `https://api.bls.gov/publicAPI/v2/timeseries/data/PCU325---325---?startyear=${year - 1}&endyear=${year}`;
  const r    = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('BLS fetch failed');
  const d    = await r.json();
  const pt   = d?.Results?.series?.[0]?.data?.[0];
  if (!pt) throw new Error('No BLS data');
  const ppi  = parseFloat(pt.value);
  // Linear regression calibrated against 2020–2024 CEPCI actuals
  const cepci_estimate = Math.round(ppi * 1.94);
  return {
    cepci_estimate,
    ppi_value: ppi,
    period: `${pt.year}-${pt.period}`,
    source: 'BLS PPI PCU325 (proxy, ×1.94)',
    note: 'Approximate. Official CEPCI published quarterly by Chemical Engineering magazine.',
    historical: CEPCI,
    ts: new Date().toISOString(),
  };
}

async function fetchCommodities() {
  // World Bank copper price (free, no key)
  const r = await fetch(
    'https://api.worldbank.org/v2/en/indicator/PCOPP.MT?format=json&mrv=1&per_page=1',
    { signal: AbortSignal.timeout(6000) }
  );
  if (!r.ok) throw new Error('World Bank fetch failed');
  const d   = await r.json();
  const val = d?.[1]?.[0]?.value;
  if (!val) throw new Error('No commodity data');
  return {
    copper_t:      Math.round(val),
    hrc_steel_t:   680,   // static — no free live API; update quarterly
    cs_pipe_per_m: 38,
    ss_pipe_per_m: 95,
    aluminium_t:   2400,
    cement_t:      90,
    source: 'World Bank (copper live), others static reference',
    last_updated: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// SECTION 9: VERCEL HANDLER
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: live data shortcut ─────────────────────────────────
  if (req.method === 'GET') {
    try {
      const type = req.query?.type || 'all';
      const live = await fetchLiveData();
      const payload = {};
      if (type === 'all' || type === 'fx')          payload.fx          = live.fx;
      if (type === 'all' || type === 'cepci')       payload.cepci       = live.cepci;
      if (type === 'all' || type === 'commodities') payload.commodities = live.commodities;
      payload.cached        = live.cached;
      payload.cache_age_min = live.cache_age_min;
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=21600');
      return res.json({ ok: true, ...payload });
    } catch (err) {
      return res.json({ ok: true, fx: { rates: FX_STATIC, source: 'fallback' },
        cepci: { cepci_estimate: 810, historical: CEPCI, source: 'fallback' },
        commodities: { copper_t: 9200, hrc_steel_t: 680, source: 'fallback' }, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use GET (live data) or POST (calculations)' });
  }

  // ── POST: parse body ────────────────────────────────────────
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const {
    action = '',
    params = {},
    items  = [],
    physics= {},
    indirectPct,
    discIndirectPct,
    indirectMode = 'flat',
    liveFX,
  } = body;

  try {
    // ── LIVE DATA (POST variant) ────────────────────────────────
    if (action === 'live_data' || action === 'live_fx' || action === 'live_cepci' || action === 'live_commodities') {
      const live    = await fetchLiveData();
      const type    = action === 'live_data' ? 'all' : action.replace('live_', '');
      const payload = {};
      if (type === 'all' || type === 'fx')          payload.fx          = live.fx;
      if (type === 'all' || type === 'cepci')       payload.cepci       = live.cepci;
      if (type === 'all' || type === 'commodities') payload.commodities = live.commodities;
      payload.cached = live.cached; payload.cache_age_min = live.cache_age_min;
      return res.json({ ok: true, ...payload });
    }

    // Build globals once for all calc actions
    const globals = buildGlobals(params, liveFX);

    // ── GET CATALOG ─────────────────────────────────────────────
    if (action === 'get_catalog') {
      return res.json({
        ok: true,
        items: ITEMS.map(it => ({
          id: it.id, desc: it.desc, disc: it.disc, cat: it.cat, sub: it.sub,
          sizing: it.sizing, matOpts: it.matOpts, hasPT: it.hasPT,
          pDef: it.pDef, tDef: it.tDef,
          // Cref, Sref, n, correction factors intentionally omitted — IP protected
        })),
        countries: Object.entries(LOC).map(([k, v]) => ({ code: k, name: v.n, currency: v.c, symbol: v.s })),
        materials: MAT_L,
        cepciYears: Object.keys(CEPCI).map(Number),
      });
    }

    // ── VALIDATE ────────────────────────────────────────────────
    if (action === 'validate') {
      const issues = validateItems(items);
      return res.json({ ok: true, issues, valid: issues.filter(x => x.severity === 'error').length === 0 });
    }

    // ── CALC ITEMS ──────────────────────────────────────────────
    if (action === 'calc_items') {
      const results = {};
      let decTotal = 0;
      const decByDisc = { process: 0, mech: 0, civil: 0, elec: 0, inst: 0 };
      items.forEach(({ item: id, size, mat, qty, pressure, temperature }) => {
        const it = ITEMS.find(x => x.id === id);
        if (!it) return;
        const r = calcItem(it, size ?? it.sizing.def, mat || it.matOpts[0], qty || 0,
          pressure ?? it.pDef, temperature ?? it.tDef, globals);
        results[id] = {
          unit_local: +r.unit_local.toFixed(0), total_local: +r.total_local.toFixed(0),
          low_local:  +r.low_local.toFixed(0),  high_local:  +r.high_local.toFixed(0),
          Fpt: r.Fpt, Fm: r.Fm,
        };
        if (qty > 0) { decTotal += r.total_local; decByDisc[it.cat] = (decByDisc[it.cat]||0) + r.total_local; }
      });
      return res.json({ ok: true, results, sym: globals.sym, decTotal: +decTotal.toFixed(0), decByDisc });
    }

    // ── CALC PHYSICS ────────────────────────────────────────────
    if (action === 'calc_physics') {
      return res.json({ ok: true, sym: globals.sym, ...calcPhysicsBulk(physics, globals) });
    }

    // ── CALC INDIRECT ───────────────────────────────────────────
    if (action === 'calc_indirect') {
      const result = calcIndirectTotal(items, indirectPct, discIndirectPct, indirectMode, globals);
      return res.json({ ok: true, sym: globals.sym, ...result });
    }

    // ── CALC SUMMARY (all-in-one) ────────────────────────────────
    if (action === 'calc_summary') {
      const itemResults = {};
      let decTotal = 0, decLo = 0, decHi = 0;
      const decByDisc = { process: 0, mech: 0, civil: 0, elec: 0, inst: 0 };

      items.forEach(({ item: id, size, mat, qty, pressure, temperature }) => {
        const it = ITEMS.find(x => x.id === id);
        if (!it) return;
        const r = calcItem(it, size ?? it.sizing.def, mat || it.matOpts[0], qty || 0,
          pressure ?? it.pDef, temperature ?? it.tDef, globals);
        itemResults[id] = {
          unit_local: +r.unit_local.toFixed(0), total_local: +r.total_local.toFixed(0),
          low_local:  +r.low_local.toFixed(0),  high_local:  +r.high_local.toFixed(0),
        };
        if (qty > 0) {
          decTotal += r.total_local; decLo += r.low_local; decHi += r.high_local;
          decByDisc[it.cat] = (decByDisc[it.cat]||0) + r.total_local;
        }
      });

      const physRes  = Object.keys(physics).length > 0 ? calcPhysicsBulk(physics, globals) : null;
      const bulkTotal= physRes?.totalCost_local || 0;

      const indRes   = calcIndirectTotal(items, indirectPct, discIndirectPct, indirectMode, globals);
      const indTotal = indRes.total;

      const grand    = decTotal + bulkTotal + indTotal;
      const grandLo  = decLo   + bulkTotal * 0.75 + indTotal * 0.85;
      const grandHi  = decHi   + bulkTotal * 1.35 + indTotal * 1.20;

      return res.json({
        ok: true, sym: globals.sym,
        itemResults,
        dec:     { total: +decTotal.toFixed(0), lo: +decLo.toFixed(0), hi: +decHi.toFixed(0), byDisc: decByDisc },
        bulk:    { total: +bulkTotal.toFixed(0), lo: +(bulkTotal*0.75).toFixed(0), hi: +(bulkTotal*1.35).toFixed(0), detail: physRes },
        indirect:{ total: +indTotal.toFixed(0),  lo: +(indTotal*0.85).toFixed(0),  hi: +(indTotal*1.20).toFixed(0),  detail: indRes  },
        grand:   { total: +grand.toFixed(0),     lo: +grandLo.toFixed(0),          hi: +grandHi.toFixed(0)          },
        globals: { ci: globals.ci, Fc: +globals.Fc.toFixed(3), Fl: +globals.Fl.toFixed(2), fxR: globals.fxR },
        issues: validateItems(items),
      });
    }

    // ── EXPORT CSV ──────────────────────────────────────────────
    if (action === 'export_csv') {
      const physRes = Object.keys(physics).length > 0 ? calcPhysicsBulk(physics, globals) : null;
      const indRes  = calcIndirectTotal(items, indirectPct, discIndirectPct, indirectMode, globals);
      const csv     = buildCSV(items, physRes, globals, indRes);
      const country = params.country || 'IN';
      const year    = params.year    || 2025;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="BOQ_${country}_${year}_${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(400).json({
      error: `Unknown action: "${action}"`,
      valid_actions: 'GET (live data) | POST: get_catalog, validate, calc_items, calc_physics, calc_indirect, calc_summary, export_csv, live_data',
    });

  } catch (err) {
    console.error('[api/boq]', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
};
