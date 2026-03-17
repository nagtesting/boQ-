// ════════════════════════════════════════════════════════════════════════════
// api/heat-exchanger.js
// MERGED VERCEL SERVERLESS API — FILE 4 of 5
//
// CALCULATORS IN THIS FILE
// ────────────────────────
//   SECTION A  ►  HEATXPERT PRO — SHELL & TUBE         /api/heatxpert  (subType: shellTube)
//   SECTION B  ►  HEATXPERT PRO — PLATE                /api/heatxpert  (subType: plate)
//   SECTION C  ►  HEATXPERT PRO — AIR COOLED           /api/heatxpert  (subType: airCooled)
//   SECTION D  ►  HEATXPERT PRO — FIN-FAN              /api/heatxpert  (subType: finFan)
//   SECTION E  ►  HEATXPERT PRO — DOUBLE PIPE          /api/heatxpert  (subType: doublePipe)
//   SECTION F  ►  HEATXPERT PRO — LMTD/NTU             /api/heatxpert  (subType: lmtdNtu)
//   SECTION G  ►  HEATXPERT PRO — WALL THICKNESS       /api/heatxpert  (subType: wallThick)
//   SECTION H  ►  HEATXPERT PRO — FOULING              /api/heatxpert  (subType: fouling)
//   SECTION I  ►  HEATXPERT PRO — SELECTOR             /api/heatxpert  (subType: selector)
//
// All sub-types are routed through a single endpoint: /api/heatxpert
// The "type" field in the POST body determines which sub-calculator runs.
//
// HOW TO NAVIGATE
//   Search "SECTION A" → Shell & Tube (Bell-Delaware)
//   Search "SECTION B" → Plate HX
//   Search "SECTION C" → Air Cooled HX
//   Search "SECTION D" → Fin-Fan HX
//   Search "SECTION E" → Double Pipe HX
//   Search "SECTION F" → LMTD / NTU method
//   Search "SECTION G" → Wall Thickness
//   Search "SECTION H" → Fouling
//   Search "SECTION I" → HX Type Selector
//   Search "heatxpert_handler" → Main dispatcher function
//
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url      = req.url || '';
  const pathname = url.split('?')[0];
  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const key = segments[segments.length - 1] || '';

  switch (key) {
    case 'heatxpert':
      return await heatxpert_handler(req, res);
    default:
      return res.status(404).json({
        error: `Unknown route: "${key}". Valid: heatxpert`
      });
  }
}
// ── End of Router ────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION A–I  ►  HEATXPERT PRO (HEAT EXCHANGER DESIGN)
// Route: /api/heatxpert
// (Original: SECTION 06 of 21)
//
// Internal sub-type dispatch (by POST body "type" field):
//   shellTube  → calcShellTube()   [Bell-Delaware method]
//   plate      → calcPlate()
//   airCooled  → calcAirCooled()
//   finFan     → calcFinFan()
//   doublePipe → calcDoublePipe()
//   lmtdNtu    → calcLmtdNtu()
//   wallThick  → calcWallThickness()
//   fouling    → calcFouling()
//   selector   → calcSelector()
// ══════════════════════════════════════════════════════════════════════════════
// SECTION 06 of 21  ►  HEATXPERT PRO (HEAT EXCHANGER)
// Route: /api/heatxpert
// Source: heatxpert.js
// ══════════════════════════════════════════════════════════════════════════════

// ─── VERCEL DEPLOYMENT: place this file at /api/heatxpert.js in your repo root ───
// Route auto-created at /api/heatxpert by Vercel

export const config = { api: { bodyParser: true } };
// ─── CORS ALLOWED ORIGINS ──────────────────────────────────────────────────
const HEATXPERT_ALLOWED_ORIGINS = new Set([
  'https://multicalci.com',
  'https://www.multicalci.com',
  'http://localhost:3000',
  'http://localhost:5173',
  // Add your Vercel preview URL here, e.g.:
  // 'https://multicalci-git-main-yourteam.vercel.app',
]);

function heatxpert_handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowed = HEATXPERT_ALLOWED_ORIGINS.has(origin);
  res.setHeader('Vary', 'Origin');   // required when CORS origin is dynamic

  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://multicalci.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    // Safely parse body — Vercel may deliver it as a string or object
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
    }
    const { calcType } = body;
    if (!calcType) return res.status(400).json({ error: 'calcType required' });

   // ── Normalise units before dispatch ──────────────────────────────────
    const us = body.unitSys || 'metric';
    if (us === 'imperial') {
      ['hTi','hTo','cTi','cTo','Ti','To','Tamb','tTi','tTo','aTamb','aTout'].forEach(k => {
        if (body[k] != null) body[k] = toSI_temp(body[k], 'imperial');
      });
      ['hF','cF','F','tF_kgh'].forEach(k => {
        if (body[k] != null) body[k] = toSI_flow(body[k], 'imperial');
      });
    }
    if (body.hFunit && body.hFunit !== 'kgh')
      body.hF = toSI_flowWithUnit(body.hF, body.hFunit, body.hFlKey, body.hTi, body.hPop);
    if (body.cFunit && body.cFunit !== 'kgh')
      body.cF = toSI_flowWithUnit(body.cF, body.cFunit, body.cFlKey, body.cTi, body.cPop);

    switch (calcType) {
      case 'shellTube':   return res.json(calcShellTube(body));
      case 'plate':       return res.json(calcPlate(body));
      case 'airCooled':   return res.json(calcAirCooled(body));
      case 'finFan':      return res.json(calcFinFan(body));
      case 'doublePipe':  return res.json(calcDoublePipe(body));
      case 'lmtdNtu':     return res.json(calcLmtdNtu(body));
      case 'wallThick':   return res.json(calcWallThickness(body));
      case 'fouling':     return res.json(calcFouling(body));
      case 'selector':    return res.json(calcSelector(body));
      default:            return res.status(400).json({ error: 'Unknown calcType: ' + calcType });
    }
  } catch (err) {
    console.error('HeatXpert API error:', err);
    return res.status(500).json({ error: 'Calculation error: ' + (err.message || 'unknown') });
  }
}

// ─── FLUID DATABASE ───────────────────────────────────────────────────────────
const GAS_RHO_THRESHOLD = 50;
const P_REF_DB = 1.01325;
const T_REF_DB = 293.15;

const FP = {
  'water': {
    rho:998, mu:0.89, cp:4.182, k:0.600,
    rho_pts:[[10,999.7],[25,997.0],[50,988.1],[75,974.9],[100,958.4],[150,916.8]],
    mu_pts: [[10,1.307],[25,0.890],[50,0.547],[75,0.378],[100,0.282],[150,0.183]],
    cp_pts: [[10,4.192],[25,4.182],[50,4.182],[75,4.190],[100,4.216],[150,4.310]],
    k_pts:  [[10,0.580],[25,0.607],[50,0.644],[75,0.667],[100,0.679],[150,0.683]],
    name:'Water'
  },

  'brine-nacl':         {rho:1197,mu:1.8,   cp:3.50,  k:0.500, name:'Brine NaCl 25%'},
  'brine-cacl2':        {rho:1298,mu:2.5,   cp:3.20,  k:0.480, name:'Brine CaCl₂ 30%'},
  'ethylene-glycol-30': {
    rho:1040, mu:2.5, cp:3.80, k:0.450,
    rho_pts:[[0,1054],[20,1040],[40,1027],[60,1014],[80,1000]],
    mu_pts: [[0,5.6],[20,2.5],[40,1.4],[60,0.85],[80,0.55]],
    cp_pts: [[0,3.64],[20,3.80],[40,3.90],[60,3.99],[80,4.07]],
    k_pts:  [[0,0.440],[20,0.450],[40,0.455],[60,0.460],[80,0.462]],
    name:'Ethylene Glycol 30%'
  },

  'ethylene-glycol-50': {rho:1078,mu:4.8,   cp:3.50,  k:0.380, name:'Ethylene Glycol 50%'},
  'propylene-glycol-30':{rho:1020,mu:2.2,   cp:3.90,  k:0.430, name:'Propylene Glycol 30%'},
  'propylene-glycol-50':{rho:1042,mu:5.5,   cp:3.60,  k:0.350, name:'Propylene Glycol 50%'},
   'crude-oil-light': {
    rho:850, mu:10, cp:2.10, k:0.140,
    rho_pts:[[20,855],[40,840],[60,825],[80,810],[100,795]],
    mu_pts: [[20,15.0],[40,8.0],[60,4.5],[80,2.8],[100,1.9]],
    cp_pts: [[20,2.00],[50,2.10],[80,2.20],[100,2.28]],
    k_pts:  [[20,0.142],[60,0.138],[100,0.133]],
    name:'Crude Oil (Light)'
  },

  'crude-oil-heavy':    {rho:950, mu:100,   cp:1.90,  k:0.120, name:'Crude Oil (Heavy)'},
  'diesel':             {rho:840, mu:3.5,   cp:2.00,  k:0.130, name:'Diesel'},
  'gasoline':           {rho:740, mu:0.6,   cp:2.20,  k:0.140, name:'Gasoline'},
  'kerosene':           {rho:820, mu:2.0,   cp:2.10,  k:0.130, name:'Kerosene'},
  'fuel-oil':           {rho:960, mu:50,    cp:1.80,  k:0.110, name:'Fuel Oil'},
  'lube-oil':           {rho:900, mu:80,    cp:2.00,  k:0.130, name:'Lubricating Oil'},
  'hydraulic-oil':      {rho:880, mu:40,    cp:2.00,  k:0.130, name:'Hydraulic Oil'},
  'thermal-oil':        {rho:870, mu:20,    cp:2.30,  k:0.120, name:'Thermal Oil'},
  'benzene':            {rho:880, mu:0.65,  cp:1.75,  k:0.140, name:'Benzene'},
  'toluene':            {rho:870, mu:0.59,  cp:1.69,  k:0.130, name:'Toluene'},
  'xylene':             {rho:870, mu:0.81,  cp:1.71,  k:0.130, name:'Xylene'},
  'air':                {rho:1.205,mu:0.0182,cp:1.005,k:0.0262,name:'Air',           MW:28.97,Tc:132.5,Pc:37.9, omega:0.035},
  'nitrogen':           {rho:1.165,mu:0.0175,cp:1.040,k:0.0260,name:'Nitrogen',       MW:28.01,Tc:126.2,Pc:33.9, omega:0.040},
  'oxygen':             {rho:1.331,mu:0.0202,cp:0.920,k:0.0265,name:'Oxygen',         MW:32.00,Tc:154.6,Pc:50.4, omega:0.022},
  'hydrogen':           {rho:0.084,mu:0.0088,cp:14.30,k:0.1800,name:'Hydrogen',       MW:2.016,Tc:33.2, Pc:13.0, omega:-0.217},
  'natural-gas':        {rho:0.720,mu:0.0110,cp:2.200,k:0.0350,name:'Natural Gas',    MW:17.00,Tc:200.0,Pc:46.0, omega:0.012},
  'methane':            {rho:0.664,mu:0.0109,cp:2.220,k:0.0340,name:'Methane',        MW:16.04,Tc:190.6,Pc:46.1, omega:0.011},
  'co2':                {rho:1.842,mu:0.0147,cp:0.850,k:0.0168,name:'Carbon Dioxide', MW:44.01,Tc:304.2,Pc:73.8, omega:0.239},
'steam': {
    rho:0.598, mu:0.0120, cp:2.010, k:0.0250,
    mu_pts: [[100,0.01227],[150,0.01415],[200,0.01615],[300,0.02008],[400,0.02449]],
    k_pts:  [[100,0.02479],[150,0.02897],[200,0.03355],[300,0.04345],[400,0.05476]],
    cp_pts: [[100,2.042],[150,1.980],[200,1.975],[300,1.997],[400,2.059]],
    MW:18.02, Tc:647.1, Pc:220.6, omega:0.345,
    hvap:2257, Tsat:100,
    name:'Steam'
  },

  'ammonia-gas':        {rho:0.730,mu:0.0101,cp:2.190,k:0.0246,name:'Ammonia Gas',    MW:17.03,Tc:405.6,Pc:113.5,omega:0.253},
  'ammonia-liquid':     {rho:610, mu:0.25,  cp:4.70,  k:0.500, hvap:1370, Tsat:-33, name:'Ammonia (Liquid)'},
  'ethanol':            {rho:790, mu:1.20,  cp:2.46,  k:0.170, name:'Ethanol'},
  'methanol':           {rho:792, mu:0.60,  cp:2.53,  k:0.210, name:'Methanol'},
  'acetone':            {rho:790, mu:0.32,  cp:2.15,  k:0.160, name:'Acetone'},
  'sulfuric-acid-98':   {rho:1840,mu:25,    cp:1.38,  k:0.350, name:'Sulfuric Acid 98%'},
  'sulfuric-acid-75':   {rho:1660,mu:8,     cp:1.80,  k:0.400, name:'Sulfuric Acid 75%'},
  'nitric-acid-68':     {rho:1400,mu:2.0,   cp:2.50,  k:0.400, name:'Nitric Acid 68%'},
  'hcl-32':             {rho:1160,mu:1.5,   cp:2.80,  k:0.450, name:'HCl 32%'},
  'naoh-50':            {rho:1530,mu:15,    cp:2.80,  k:0.450, name:'NaOH 50%'},
  'naoh-25':            {rho:1280,mu:3.0,   cp:3.40,  k:0.500, name:'NaOH 25%'},
  'acetic-acid':        {rho:1050,mu:1.2,   cp:2.10,  k:0.190, name:'Acetic Acid'},
  'r134a':              {rho:1200,mu:0.20,  cp:1.43,  k:0.080, hvap:198,  Tsat:-26, name:'R-134a'},
  'r410a':              {rho:1060,mu:0.15,  cp:1.77,  k:0.080, name:'R-410A'},
  'r717':               {rho:610, mu:0.25,  cp:4.70,  k:0.500, hvap:1370, Tsat:-33, name:'R-717 (Ammonia)'},
  'milk':               {rho:1030,mu:2.0,   cp:3.90,  k:0.550, name:'Milk'},
  'juice':              {rho:1050,mu:3.0,   cp:3.80,  k:0.540, name:'Fruit Juice'},
  'beer':               {rho:1010,mu:1.5,   cp:4.00,  k:0.580, name:'Beer'},
  'sugar-solution':     {rho:1250,mu:15,    cp:3.20,  k:0.450, name:'Sugar Solution 50%'},
  'molten-salt':        {rho:1900,mu:5.0,   cp:1.50,  k:0.500, name:'Molten Salt'},
  'dowtherm':           {rho:1060,mu:3.5,   cp:2.20,  k:0.130, name:'Dowtherm A'},
  'mercury':            {rho:13600,mu:1.5,  cp:0.14,  k:8.300, name:'Mercury'},
  'sodium':             {rho:930, mu:0.7,   cp:1.38,  k:86.00, name:'Liquid Sodium'},
};

const KMAT = {cs:50, ss304:16, ss316:14, copper:385, titanium:21, inconel:10, nickel:12};

// Normalize fluid key lookup (case-insensitive)
function getFluid(key) { return FP[(key||"").toLowerCase().trim()] || FP.water; }

// ─── TEMPERATURE INTERPOLATION HELPER ───────────────────────────────────────
function interpProp(pts, T, fallback) {
  if (!pts || pts.length === 0) return fallback;
  if (T <= pts[0][0])              return pts[0][1];
  if (T >= pts[pts.length-1][0])   return pts[pts.length-1][1];
  for (let i = 1; i < pts.length; i++) {
    if (T <= pts[i][0]) {
      const [T0,v0] = pts[i-1], [T1,v1] = pts[i];
      return v0 + (v1-v0)*(T-T0)/(T1-T0);
    }
  }
}

function getFluidAtT(key, T_degC) {
  const raw = FP[(key||'').toLowerCase().trim()] || FP.water;
  return {
    rho:  raw.rho_pts  ? interpProp(raw.rho_pts,  T_degC, raw.rho) : raw.rho,
    mu:   raw.mu_pts   ? interpProp(raw.mu_pts,   T_degC, raw.mu)  : raw.mu,
    cp:   raw.cp_pts   ? interpProp(raw.cp_pts,   T_degC, raw.cp)  : raw.cp,
    k:    raw.k_pts    ? interpProp(raw.k_pts,    T_degC, raw.k)   : raw.k,
    name: raw.name, MW: raw.MW, Tc: raw.Tc, Pc: raw.Pc,
    omega: raw.omega, hvap: raw.hvap, Tsat: raw.Tsat
  };
}


// ─── FLUID PROPERTY FUNCTIONS ─────────────────────────────────────────────────
function calcZ(fluid, T_K, P_bar) {
  if (!fluid.Tc || !fluid.Pc) return 1.0;
  const Tr = T_K / fluid.Tc, Pr = P_bar / fluid.Pc;
  if (Tr <= 0 || Pr <= 0) return 1.0;
  if (Pr > 1.0) return calcZ_PR(fluid, T_K, P_bar);
  const B0 = 0.083 - 0.422/Math.pow(Tr,1.6);
  const B1 = 0.139 - 0.172/Math.pow(Tr,4.2);
  const omega = fluid.omega || 0;
  return Math.max(0.1, Math.min(1 + (B0 + omega*B1)*(Pr/Tr), 2.0));
}

function calcZ_PR(fluid, T_K, P_bar) {
  if (!fluid.Tc || !fluid.Pc || !fluid.MW) return 1.0;
  const omega = fluid.omega||0, Tr = T_K/fluid.Tc, Pr = P_bar/fluid.Pc;
  const kappa = 0.37464 + 1.54226*omega - 0.26992*omega*omega;
  const alpha  = Math.pow(1 + kappa*(1 - Math.sqrt(Tr)), 2);
  const a = 0.45724*alpha*Math.pow(fluid.Pc,2)/Math.pow(fluid.Tc,2);
  const R_bar = 0.083145;
  const A_pr = a*Pr/(Math.pow(fluid.Pc,2)*Tr*Tr);
  const b_val = 0.07780*R_bar*fluid.Tc/fluid.Pc;
  const B_pr = b_val*P_bar/(R_bar*T_K);
  const c2 = -(1-B_pr), c1 = A_pr-3*B_pr*B_pr-2*B_pr, c0 = -(A_pr*B_pr-B_pr*B_pr-B_pr*B_pr*B_pr);
  let Z = Math.max(B_pr+1e-6, 1.0);
  for (let i=0; i<50; i++) {
    const fZ = Z*Z*Z+c2*Z*Z+c1*Z+c0;
    const dfZ = 3*Z*Z+2*c2*Z+c1;
    if (Math.abs(dfZ)<1e-12) break;
    const dZ = fZ/dfZ; Z -= dZ;
    if (Math.abs(dZ)<1e-9) break;
  }
  return Math.max(0.1, Math.min(Z, 2.5));
}

function fluidRhoActual(fluid, T_degC, P_bar_abs) {
  if (fluid.rho >= GAS_RHO_THRESHOLD) return fluid.rho;
  const T_K = T_degC + 273.15;
  const P = Math.max(P_bar_abs||P_REF_DB, 0.001);
  if (fluid.MW && fluid.Tc && fluid.Pc) {
    const Z = calcZ(fluid, T_K, P);
    return Math.max((fluid.MW*P)/(Z*83.145*T_K)*1000, 1e-4);
  }
  return fluid.rho*(P/P_REF_DB)*(T_REF_DB/(T_degC+273.15));
}

function fluidMuActual(fluid, T_degC) {
  if (fluid.rho >= GAS_RHO_THRESHOLD) return fluid.mu;
  return fluid.mu * Math.pow((T_degC+273.15)/T_REF_DB, 0.67);
}

function fluidKActual(fluid, T_degC) {
  if (fluid.rho >= GAS_RHO_THRESHOLD) return fluid.k;
  return fluid.k * Math.pow((T_degC+273.15)/T_REF_DB, 0.8);
}

function fluidAtConditions(fluidKey, T_mean_degC, P_bar_abs) {
  const normalizedKey = (fluidKey || '').toLowerCase().trim();
  const f = FP[normalizedKey];
  if (!f) {
    console.warn(`[HeatXpert] Unknown fluid key: "${fluidKey}" — falling back to water`);
  }
  const fluid = f || FP.water;
  const isGas = fluid.rho < GAS_RHO_THRESHOLD;
  const T_K = T_mean_degC + 273.15;
  const P = Math.max(P_bar_abs||P_REF_DB, 0.001);
  let Z_val=1.0, method='liquid';
  if (isGas) {
    Z_val = calcZ(fluid, T_K, P);
    method = (fluid.MW && fluid.Tc && fluid.Pc) ? (P/(fluid.Pc||1)>1.0?'Peng-Robinson':'Pitzer virial') : 'ideal gas (no crit. props)';
  }
const tProps = getFluidAtT(normalizedKey, T_mean_degC);
  const rhoFinal = isGas ? fluidRhoActual(fluid,T_mean_degC,P_bar_abs) : tProps.rho;
  return { rho:rhoFinal, mu:tProps.mu, cp:tProps.cp, k:tProps.k,
    name:fluid.name, Z:Z_val, zMethod:method, _isGas:isGas,
    hvap:fluid.hvap, Tsat:fluid.Tsat };

}

// ─── LMTD CALCULATION ─────────────────────────────────────────────────────────
function calcF_1_2(R, P) {
  if (P <= 0 || P >= 1 || R <= 0) return { F:1.0, valid:false };
  if (R*P >= 1.0) return { F:0.75, valid:false };
  const S = Math.sqrt(R*R+1);
  if (Math.abs(R-1) < 0.001) {
    const denom = (2-P*(2+Math.sqrt(2))) > 0 ? Math.log((2-P*(2-Math.sqrt(2)))/(2-P*(2+Math.sqrt(2)))) : 0;
    if (Math.abs(denom) < 1e-10) return {F:1.0,valid:true};
    const F = Math.sqrt(2)*P / ((1-P)*denom);
    return {F:Math.max(0.5,Math.min(F,1.0)),valid:true};
  }
  const n1 = 2/P - 1 - R + S, n2 = 2/P - 1 - R - S;
  if (n1 <= 0 || n2 <= 0 || n1 === n2) return {F:0.8,valid:false};
  const F = (S/(R-1)) * Math.log((1-P)/(1-P*R)) / Math.log(n1/n2);
  return {F:Math.max(0.5,Math.min(F,1.0)),valid:true};
}

function calcF_crossflow(R, P) {
  if (P <= 0 || R < 0) return {F:1.0,valid:false};
  const NTU = -Math.log(1 - P*(1+Math.min(R,1))) / (1+Math.min(R,1));
  if (!isFinite(NTU)) return {F:0.9,valid:false};
  const F = Math.max(0.7, Math.min(1.0, 0.88 + 0.12*Math.exp(-0.15*NTU)));
  return {F,valid:true};
}

function calcLMTD(hTi, hTo, cTi, cTo, arr) {
  let dT1, dT2;
  if (arr === 'parallel') {
    dT1 = hTi - cTi; dT2 = hTo - cTo;
  } else {
    dT1 = hTi - cTo; dT2 = hTo - cTi;
  }
  if (dT1 <= 0 || dT2 <= 0) return {lmtd:null, err:'Temperature cross — check inlet/outlet temps'};
  const lmtd = Math.abs(dT1-dT2) < 0.001 ? dT1 : (dT1-dT2)/Math.log(dT1/dT2);
  if (!isFinite(lmtd) || lmtd <= 0) return {lmtd:null, err:'LMTD calculation failed'};
  const R = (hTi-hTo)/Math.max(cTo-cTi,0.001);
  const P = (cTo-cTi)/Math.max(hTi-cTi,0.001);
  let F=1.0;
  if (arr==='shell12') F = calcF_1_2(R,P).F;
  else if (arr==='shell24') {
    const P1 = P / Math.max(2-P*(1+R), 0.01);
    F = calcF_1_2(R, Math.min(P1,0.99)).F;
  } else if (arr==='cross1') F = calcF_crossflow(R,P).F;
  return {lmtd, F, dT1, dT2};
}

// ─── TUBE-SIDE HTC ────────────────────────────────────────────────────────────
function calcHtube(fluid, massFlowKgS, Di_m, L_m) {
  const {rho, mu:mu_mPas, cp, k} = fluid;
  const mu = mu_mPas*1e-3;
  const A = Math.PI*Di_m*Di_m/4;
  const vel = massFlowKgS/(rho*Math.max(A,1e-8));
  const Re = rho*vel*Di_m/mu;
  const Pr = Math.max(mu*cp*1000/k, 0.5);
  let Nu;
  if (Re < 2300) {
    const Gz = Re*Pr*Di_m/Math.max(L_m,0.01);
    Nu = Math.max(3.66, 1.86*Math.pow(Gz,0.333));
  } else if (Re < 10000) {
    Nu = 0.116*(Math.pow(Re,0.667)-125)*Math.pow(Pr,0.333)*(1+Math.pow(Di_m/L_m,0.667));
  } else {
   const f_gn = Math.pow(0.790*Math.log(Math.max(Re,10))-1.64, -2);
Nu = (f_gn/8)*(Re-1000)*Pr / (1+12.7*Math.sqrt(f_gn/8)*(Math.pow(Pr,2/3)-1));
Nu = Math.max(Nu, 0.023*Math.pow(Re,0.8)*Math.pow(Pr,0.4)); // floor
  }
  return {h:Nu*k/Di_m, Re, vel, Nu};
}
// ─── FILM CONDENSATION HTC (Nusselt) ────────────────────────────────────────
// orientation: "horizontal" (default for S&T) or "vertical"
function calcHcondense(fluid, Twall_degC, OD_m, L_m, orientation) {
  const hvap  = (fluid.hvap || 2257) * 1000;     // J/kg
  const Tsat  = fluid.Tsat  || 100;              // °C at ~1 bar
  const dT    = Math.max(Math.abs(Tsat - Twall_degC), 1.0);
  const rho   = fluid.rho;
  const mu    = (fluid.mu || 0.28) * 1e-3;
  const k     = fluid.k   || 0.68;
  const g     = 9.81;
  let h;
  if (orientation === "vertical") {
    // Nusselt vertical tube/plate
    h = 0.943 * Math.pow((rho*rho*g*hvap*k*k*k) / (mu*dT*Math.max(L_m,0.01)), 0.25);
  } else {
    // Nusselt horizontal tube (default for S&T condensers)
    h = 0.725 * Math.pow((rho*rho*g*hvap*k*k*k) / (mu*dT*Math.max(OD_m,0.001)), 0.25);
  }
  return Math.min(Math.max(h, 500), 25000);   // clamp to realistic range
}

// ─── CHEN CORRELATION — FLOW BOILING / EVAPORATING ──────────────────────────
function calcHboiling(fluid, tubeRes_h, tubeRes_Re) {
  // Simplified Chen: h_total = F*h_forced + S*h_nucleate
  const Xtt  = 0.9;
  const F    = 2.35 * Math.pow(1/Xtt + 0.213, 0.736);
  const S    = 1 / (1 + 2.53e-6 * Math.pow(Math.max(tubeRes_Re, 1), 1.17));
  const h_nb = 0.00122 * Math.pow(Math.max(fluid.k,0.05), 0.79) / (fluid.mu * 1e-3);
  return F * tubeRes_h + S * h_nb;
}


// ─── BELL-DELAWARE SHELL-SIDE ────────────────────────────────────────────────
function calcBellDelaware(fluid, massFlowKgS, shellID_m, OD_m, pitch_ratio, bcut_frac, bsp_ratio, L_m, nTubes, tema='C', pitchLayout='triangular') {
  const {rho, mu:mu_mPas, cp, k} = fluid;
  const mu = mu_mPas*1e-3;
  const PT = pitch_ratio*OD_m;
  const bsp = bsp_ratio*shellID_m;
  const bundleFrac = pitchLayout==='triangular' ? 0.866 : 1.0;
  const Sm = bsp_ratio * shellID_m * (PT - OD_m) / PT;
  const G_s = massFlowKgS/Math.max(Sm,1e-6);
  const Re_s = G_s*OD_m/mu;
  const Pr_s = Math.max(mu*cp*1000/k, 0.5);
  let a, b;
  if (Re_s < 100) {a=1.40;b=0.667;} else if (Re_s<1000) {a=0.560;b=0.500;} else if (Re_s<10000) {a=0.350;b=0.600;} else {a=0.370;b=0.600;}
  const jh = a*Math.pow(Math.max(Re_s,1), b-1);
  const Nu_s = jh*Re_s*Math.pow(Pr_s,0.333);
  const h_ideal = Nu_s*k/OD_m;
  // Bell-Delaware correction factors
  const Jc = 0.55 + 0.72*(bcut_frac - 0.15);
  const clearance_tema = {R:0.0003,C:0.0005,B:0.0007}[tema]||0.0005;
 const Jl = Math.max(0.70, 1 - 0.6*clearance_tema/Math.max(bsp,0.001));
  const Jb = Math.max(0.70, 1 - 0.3*(1-bsp_ratio));
  const Jr = Re_s<100 ? Math.max(0.4, 0.8-0.003*Re_s) : 1.0;
  const Js = 1.0;
  const Jtotal = Math.max(0.30, Jc*Jl*Jb*Jr*Js);
  const hShell = h_ideal*Jtotal;
  const nBaffles = Math.max(1, Math.round(L_m/Math.max(bsp,0.001)-1));
  const shellVel = G_s/rho;
  return {hShell, hTube:0, Jc, Jl, Jb, Jr, Js, Jtotal, jh, shellVel, shellRe:Re_s, nBaffles};
}

// ─── PRESSURE DROP TUBE ───────────────────────────────────────────────────────
function calcPressDropTube(fluid, massFlowKgS, Di_m, L_m, nPasses) {
  const {rho, mu:mu_mPas} = fluid;
  const mu = mu_mPas*1e-3;
  const A = Math.PI*Di_m*Di_m/4;
  const vel = massFlowKgS/(rho*Math.max(A,1e-8));
  const Re = rho*vel*Di_m/mu;
  const f = Re<2300 ? 64/Math.max(Re,1) : Math.pow(0.790*Math.log(Math.max(Re,10))-1.64,-2);
  const dyn = rho*vel*vel/2;
  const dP_friction = f*(L_m*nPasses/Di_m)*dyn;
  const dP_entry_exit = 1.5*nPasses*dyn;
  const dP_returns = 1.5*Math.max(nPasses-1,0)*dyn;
  const dP_nozzle = 2.0*dyn;
  return Math.max((dP_friction+dP_entry_exit+dP_returns+dP_nozzle)/1e5, 0);
}

// ─── INPUT VALIDATION HELPER ──────────────────────────────────────────────────
function requireFinite(val, name) {
  if (!isFinite(parseFloat(val))) throw new Error(`Invalid input: ${name} must be a finite number`);
  return parseFloat(val);
}
// ─── UNIT CONVERSION HELPERS (server-side) ───────────────────────────────────
function toSI_temp(val, unitSys) {
  return unitSys === 'imperial' ? (val - 32) * 5 / 9 : val;
}

function toSI_flow(val, unitSys) {
  return unitSys === 'imperial' ? val / 2.20462 : val;
}

function toSI_flowWithUnit(val, flowUnit, fluidKey, T_degC, P_bar) {
  if (!flowUnit || flowUnit === 'kgh') return val;
  const fluid = getFluid(fluidKey);
const rho_n = (fluid.MW || 29) * P_REF_DB * 1e5 / (8314 * T_REF_DB);
const rho_s = (fluid.MW || 29) * P_REF_DB * 1e5 / (8314 * 288.15);
  if (flowUnit === 'nm3h') return val * rho_n;
  if (flowUnit === 'sm3h') return val * rho_s;
  return val;
}

// ─── RESISTANCE BREAKDOWN HELPER ─────────────────────────────────────────────
function calcResistanceBreakdown(hShell, hTube, Rfo, Rfi, Rwall, Ao_Ai) {
  const r_shell = 1 / Math.max(hShell, 0.001);
  const r_tube  = (Ao_Ai || 1) / Math.max(hTube, 0.001);
  const r_fo    = Rfo || 0;
  const r_fi    = (Ao_Ai || 1) * (Rfi || 0);
  const r_w     = Rwall || 0;
  const Rt      = r_shell + r_tube + r_fo + r_fi + r_w;
  if (Rt <= 0) return [];
  const pct = v => parseFloat((v / Rt * 100).toFixed(1));
  return [
    { label: 'Shell-side film', pct: pct(r_shell), color: '#E24B4A' },
    { label: 'Tube-side film',  pct: pct(r_tube),  color: '#378ADD' },
    { label: 'Shell fouling',   pct: pct(r_fo),    color: '#BA7517' },
    { label: 'Tube fouling',    pct: pct(r_fi),    color: '#854F0B' },
    { label: 'Wall conduction', pct: pct(r_w),     color: '#1D9E75' },
  ];
}

// ─── SHELL & TUBE ─────────────────────────────────────────────────────────────
function calcShellTube(b) {
  const hFlKey=b.hFlKey||'water', cFlKey=b.cFlKey||'water';
  const hFluidDB=getFluid(hFlKey), cFluidDB=getFluid(cFlKey);
  const hPop=parseFloat(b.hPop)||P_REF_DB, cPop=parseFloat(b.cPop)||P_REF_DB;
  const hTi=requireFinite(b.hTi,'hTi'), hTo=requireFinite(b.hTo,'hTo'), cTi=requireFinite(b.cTi,'cTi');
  const hF=requireFinite(b.hF,'hF');  // kg/h
  if (hF<=0) throw new Error('Hot flow must be positive');
  if (hTo>=hTi) throw new Error('Hot outlet must be less than hot inlet temperature');
  const hTmean=(hTi+hTo)/2;
  const hFluid=fluidAtConditions(hFlKey,hTmean,hPop);
  const Qhot=(hF/3600)*hFluidDB.cp*(hTi-hTo);
  let cF=parseFloat(b.cF)||0, cTo=parseFloat(b.cTo)||0;
  const coldMode=b.coldMode||'flow';
  if (coldMode==='flow') {
    if (cF<=0) throw new Error('Cold flow must be positive');
    cTo = cTi + Qhot/((cF/3600)*cFluidDB.cp);
  } else {
    if (cTo<=cTi) throw new Error('Cold outlet must be > cold inlet');
    if (cTo>=hTi) throw new Error('Cold outlet must be < hot inlet');
    cF = (Qhot/(cFluidDB.cp*(cTo-cTi)))*3600;
  }
  if (cTo<=cTi) throw new Error('Cold outlet must be greater than cold inlet');
  if (hTi<=cTi) throw new Error('Hot inlet must be above cold inlet');
  const cTmean=(cTi+cTo)/2;
  const cFluid=fluidAtConditions(cFlKey,cTmean,cPop);
  const OD=requireFinite(b.OD,'OD')/1000, tw=requireFinite(b.tw,'tw')/1000, L=requireFinite(b.L,'L');
  const pitch=parseFloat(b.pitch)||1.25;
  const Rfo=Math.max(parseFloat(b.Rfo)||0.0002,0), Rfi=Math.max(parseFloat(b.Rfi)||0.0002,0);
  const arr=b.arr||'counter', kw=KMAT[b.mat]||16;
  const nPasses=b.hxType==='1-1'?1:b.hxType==='1-2'?2:4;
  const nShells=b.hxType==='2-4'?2:1;
  const tema=b.tema||'C';
  const shellMode = b.shellMode || 'single-phase';
  // shellMode values: 'single-phase' | 'condensing' | 'evaporating'
  if (OD<=0||L<=0||OD<=2*tw) throw new Error('Invalid tube geometry');
  const Di=OD-2*tw;
  const massH=hF/3600, massC=cF/3600;
  const A_tube=Math.PI*Di*Di/4;
  const pitchLen=pitch*OD;
  const Rwall=(OD/2)*Math.log(OD/Di)/kw;
  const bcut_frac=parseFloat(b.bcut)||0.25;
  const bsp_ratio=parseFloat(b.bsp)||0.50;
  const velMode=b.velMode||'target';
  const targetVel=parseFloat(b.targetVel)||1.5;
  const pdAllowShell=parseFloat(b.pdAllowShell)||0.70;
  const pdAllowTube=parseFloat(b.pdAllowTube)||1.00;
  const pitchLayout=b.pitchLayout||'triangular';
  const bundleAreaFactor=pitchLayout==='triangular'?0.866:1.0;
  function estimateShellID(n){const bA=n*pitchLen*pitchLen*bundleAreaFactor;return Math.sqrt(4*bA/Math.PI)*1.15;}

  let nTubesPerPass, numTubes, shellID, L_eff;
  if (velMode==='fixedtubes') {
    numTubes=Math.max(1,parseInt(b.numTubesFixed)||0);
    if (!numTubes) throw new Error('Fixed-tube mode: enter number of tubes');
    nTubesPerPass=Math.max(1,Math.round(numTubes/nPasses));
    shellID=estimateShellID(numTubes); L_eff=L;
  } else {
    const nTPP=Math.max(1,Math.ceil(massC/(cFluid.rho*A_tube*targetVel)));
    nTubesPerPass=nTPP; numTubes=nTPP*nPasses;
    shellID=estimateShellID(numTubes); L_eff=L;
  }

  const tubeVel=massC/(nTubesPerPass*cFluid.rho*A_tube);
  const bdRes=calcBellDelaware(hFluid,massH,shellID,OD,pitch,bcut_frac,bsp_ratio,L_eff,numTubes,tema,pitchLayout);
  const tubeRes=calcHtube(cFluid,massC/nTubesPerPass,Di,L_eff);
  let hTube;
  if (shellMode === 'condensing') {
    const Twall = (cTi+cTo)/2;
    hTube = calcHcondense(cFluid, Twall, OD, L_eff, 'horizontal');
  } else if (shellMode === 'evaporating') {
    hTube = calcHboiling(cFluid, tubeRes.h, tubeRes.Re);
  } else {
    hTube = tubeRes.h;    // original single-phase path
  }
  const hShell=bdRes.hShell;
  const Ao_Ai=OD/Di;
  const U_clean=1/(1/hShell+Ao_Ai/hTube+Rwall);
  const U=1/(1/hShell+Rfo+Ao_Ai/hTube+Ao_Ai*Rfi+Rwall);


  let lmtdArr;
  if (arr==='parallel') lmtdArr='parallel';
  else if (arr==='cross1') lmtdArr='cross1';
  else if (nPasses===1&&nShells===1) lmtdArr='counter';
  else if (nShells>=2) lmtdArr='shell24';
  else lmtdArr='shell12';
  const lmtdRes=calcLMTD(hTi,hTo,cTi,cTo,lmtdArr);
  if (!lmtdRes.lmtd) throw new Error(lmtdRes.err||'LMTD error');
  const {lmtd,F,dT1,dT2}=lmtdRes;
  const FLMTD=lmtd*F;
  const Wh=(hF/3600)*hFluidDB.cp, Wc=(cF/3600)*cFluidDB.cp;
  const Qh=Wh*(hTi-hTo), Qc=Wc*(cTo-cTi);
  const Q=(Qh+Qc)/2;
  const balErr=Math.abs(Qh-Qc)/Math.max(Qh,Qc,0.001)*100;
  const area=Q*1000/(U*FLMTD);
  const A_tube_OD=Math.PI*OD*L_eff*numTubes;
  const area_provided=A_tube_OD;
  const overSurf=(area_provided/area-1)*100;
  const NTU=area*U/Math.max(Math.min(Wh,Wc)*1000,0.001);
  const Cmin=Math.min(Wh,Wc), Qmax=Cmin*(hTi-cTi);
  const eff=Qmax>0?Q/Qmax:0;
  const tubeDp=calcPressDropTube(cFluid,massC/nTubesPerPass,Di,L_eff,nPasses);
  // Shell ΔP: use Eu × nBaffles × rho × v² / 2 with Re-dependent Eu factor, convert Pa→bar
  const Re_s_dp = bdRes.shellRe;
  const Eu = Re_s_dp < 300 ? 2.0 : Re_s_dp < 1000 ? 1.2 : 0.8; // Euler number (Kern approximation)
  const shellDP = Eu * bdRes.nBaffles * hFluid.rho * bdRes.shellVel * bdRes.shellVel / 2 / 1e5;
  const warns=[];
  if(tubeVel<0.5) warns.push('Tube velocity below 0.5 m/s — fouling risk');
  if(tubeVel>4) warns.push('Tube velocity above 4 m/s — erosion risk');
  if(FLMTD<5) warns.push('F×LMTD < 5°C — very small driving force');
  if(shellDP>pdAllowShell) warns.push(`Shell ΔP ${shellDP.toFixed(3)} bar exceeds allowable`);
  if(tubeDp>pdAllowTube) warns.push(`Tube ΔP ${tubeDp.toFixed(3)} bar exceeds allowable`);
  if(overSurf<0) warns.push('Insufficient area — increase tube count, length, or passes');
  const st=overSurf<-5?'err':overSurf<5?'warn':'ok';
  const resistanceBreakdown = calcResistanceBreakdown(hShell, hTube, Rfo, Rfi, Rwall, OD/Di);
  return {
    hF,cF,Q,Qh,Qc,U,U_clean,area,area_provided,overSurf,lmtd,F,FLMTD,dT1,dT2,lmtdArr,shellMode,
    numTubes,nTubesPerPass,nPasses,nShells,shellID,Di,OD,L:L_eff,tubeVel,targetVel,velMode,
    shellDP,tubeDp,pdAllowShell,pdAllowTube,bdCorr:{...bdRes,hShell,hTube},
    NTU,eff,balErr,tema,pitchLayout,hTmean,cTmean,hTi,hTo,cTi,cTo,hPop,cPop,
    hFluid,cFluid,hFluidDB,cFluidDB,shellRe:bdRes.shellRe,shellVel:bdRes.shellVel,
    resistanceBreakdown, st, warns
  };
}

// ─── PLATE HX ────────────────────────────────────────────────────────────────
function calcPlate(b) {
  const hFlKey=b.hFlKey||'water', cFlKey=b.cFlKey||'water';
  const hFluidDB=getFluid(hFlKey), cFluidDB=getFluid(cFlKey);
  const hPop=parseFloat(b.hPop)||P_REF_DB, cPop=parseFloat(b.cPop)||P_REF_DB;
  const hTi=requireFinite(b.hTi,'hTi'), hTo=requireFinite(b.hTo,'hTo'), cTi=requireFinite(b.cTi,'cTi');
  const hF=requireFinite(b.hF,'hF');
  if (hF<=0) throw new Error('Hot flow must be positive');
  if (hTo>=hTi) throw new Error('Hot outlet must be below hot inlet');
  if (cTi>=hTo) throw new Error('Cold inlet must be below hot outlet');
  const hTmean=(hTi+hTo)/2;
  const hFluid=fluidAtConditions(hFlKey,hTmean,hPop);
  const Qhot=(hF/3600)*hFluidDB.cp*(hTi-hTo);
  let cF=parseFloat(b.cF)||0, cTo=parseFloat(b.cTo)||0;
  const coldMode=b.coldMode||'flow';
  if (coldMode==='temp') {
    if (cTo<=cTi) throw new Error('Cold outlet must be > cold inlet');
    if (cTo>=hTi) throw new Error('Cold outlet cannot exceed hot inlet');
    cF=(Qhot/(cFluidDB.cp*(cTo-cTi)))*3600;
  } else {
    if (cF<=0) throw new Error('Cold flow must be positive');
    cTo=cTi+Qhot/((cF/3600)*cFluidDB.cp);
    if (cTo>=hTi) throw new Error('Cold outlet exceeds hot inlet — check flow/temps');
  }
  const Qcold=(cF/3600)*cFluidDB.cp*(cTo-cTi);
  const balErr=Math.abs(Qhot-Qcold)/Math.max(Qhot,Qcold,0.001)*100;
  const Q=(Qhot+Qcold)/2;
  const cTmean=(cTi+cTo)/2;
  const cFluid=fluidAtConditions(cFlKey,cTmean,cPop);
  const th=requireFinite(b.th,'th')/1000, angle=parseFloat(b.angle)||45;
  const gap=requireFinite(b.gap,'gap')/1000, pw=requireFinite(b.pw,'pw')/1000;
  const plen=requireFinite(b.plen,'plen')/1000, phi=parseFloat(b.phi)||1.17;
  const kw=KMAT[b.mat]||14, foul=parseFloat(b.foul)||0.0002;
  const pdAllowH=parseFloat(b.pdAllowH)||1.5, pdAllowC=parseFloat(b.pdAllowC)||1.5;
  const lmtdRes=calcLMTD(hTi,hTo,cTi,cTo,'counter');
  if (!lmtdRes.lmtd) throw new Error(lmtdRes.err||'LMTD error');
  const {lmtd,F,dT1,dT2}=lmtdRes, FLMTD=lmtd*F;
  const Dh=2*gap/phi;
  const Ac=pw*gap;
  function htcPlate(fluid,mKgs) {
    const G=mKgs/Math.max(Ac,1e-8);
    const Re=G*Dh/(fluid.mu*1e-3);
    const Pr=Math.max(fluid.mu*1e-3*fluid.cp*1000/fluid.k,0.5);
    const ang=angle;
    let C_Nu,m_Nu;
    if(ang<=30){C_Nu=0.228;m_Nu=0.65;}else if(ang<=45){C_Nu=0.350;m_Nu=0.68;}else if(ang<=60){C_Nu=0.479;m_Nu=0.70;}else{C_Nu=0.560;m_Nu=0.72;}
    const Nu=C_Nu*Math.pow(Math.max(Re,10),m_Nu)*Math.pow(Pr,0.333)*phi;
    return {h:Nu*fluid.k/Dh, Re, G};
  }
  const hRes=htcPlate(hFluid,hF/3600), cRes=htcPlate(cFluid,cF/3600);
  const hH=hRes.h, hC=cRes.h;
  const Rwall=th/kw;
  const U=1/(1/hH+1/hC+Rwall+foul);
  const U_clean=1/(1/hH+1/hC+Rwall);
  const A_req=Q*1000/(U*FLMTD);
  const A_plate=pw*plen;
  const nPlates=Math.max(2,Math.ceil(A_req/A_plate)+2);
  const A_provided=nPlates*A_plate;
  const overDesign=(A_provided/A_req-1)*100;
  function pdPlate(fluid,mKgs){
    const G=mKgs/Math.max(Ac,1e-8);
    const Re=G*Dh/(fluid.mu*1e-3);
    const f_pl=Re<2000?24/Math.max(Re,1):0.6*Math.pow(Re,-0.3);
    const dyn=fluid.rho*Math.pow(mKgs/(fluid.rho*Math.max(Ac,1e-8)),2)/2;
    const np=nPlates/2;
    return Math.max((f_pl*np*(plen/Dh)+1.5*np)*dyn/1e5, 0);
  }
  const dpH=pdPlate(hFluid,hF/3600), dpC=pdPlate(cFluid,cF/3600);
  const NTU=A_req*U/Math.max(Math.min((hF/3600)*hFluidDB.cp,(cF/3600)*cFluidDB.cp)*1000,0.001);
  const Cmin=Math.min((hF/3600)*hFluidDB.cp,(cF/3600)*cFluidDB.cp);
  const eff=Cmin>0?Q/(Cmin*(hTi-cTi)):0;
  const st=overDesign<0?'err':overDesign<5?'warn':'ok';
  const warns=[];
  if(FLMTD<3) warns.push('FLMTD < 3°C — very close approach');
  if(dpH>pdAllowH) warns.push(`Hot ΔP ${dpH.toFixed(3)} bar exceeds allowable`);
  if(dpC>pdAllowC) warns.push(`Cold ΔP ${dpC.toFixed(3)} bar exceeds allowable`);
  if(overDesign<0) warns.push('Insufficient plate area — increase plate count');
  const minApproachDT = Math.min(hTi - cTo, hTo - cTi);
  return {
    Q,Qhot,Qcold,U,U_clean,balErr,lmtd,F,FLMTD,dT1,dT2,
    A_req,A_provided,overDesign,nPlates,A_plate,dpH,dpC,pdAllowH,pdAllowC,
    hH,hC,NTU,eff,hTi,hTo,cTi,cTo,cF,
    minApproachDT,
    hFluid,cFluid,st,warns
  };
}

// ─── AIR COOLED — IMPROVED (Robinson-Briggs j-factor + fin efficiency) ──────
function calcAirCooled(b) {
  const flKey  = b.flKey || 'water';
  const fluid  = getFluid(flKey);
  const Ti     = requireFinite(b.Ti,   'Ti');
  const To     = requireFinite(b.To,   'To');
  const F_kgh  = requireFinite(b.F,    'F');
  const Tamb   = requireFinite(b.Tamb, 'Tamb');
  const dTa    = Math.max(parseFloat(b.dTa)  || 15,  1);

  // Tube & fin geometry — all with defaults matching typical API 661 bundle
  const tubeOD  = (parseFloat(b.tubeOD)  || 25.4)  / 1000;  // m
  const tubeID  = (parseFloat(b.tubeID)  || 20.0)  / 1000;
  const finH    = (parseFloat(b.finH)    || 12.5)  / 1000;
  const finThk  = (parseFloat(b.finThk)  || 0.40)  / 1000;
  const finDens = parseFloat(b.finDens)  || 394;             // fins/m
  const pitchT  = (parseFloat(b.pitchT)  || 63.5)  / 1000;  // transverse pitch m
  const nRows   = Math.max(1, parseInt(b.rows)   || 4);
  const nTubes  = Math.max(1, parseInt(b.nTubes) || 40);     // tubes per row × bays
  const tubeLen = parseFloat(b.tubeLen)  || 6.0;             // m
  const Rfo     = parseFloat(b.Rfo)      || 0.0002;          // fouling m²K/W
  const kFin    = 222;                                        // aluminium W/mK

  if (To >= Ti)   throw new Error('Outlet must be below inlet for air cooling');
  if (Tamb >= To) throw new Error('Ambient must be below process outlet');

  // Heat duty kW
  const Q = (F_kgh / 3600) * fluid.cp * (Ti - To);
  const TairOut = Tamb + dTa;

  // Extended surface geometry
  const finOD       = tubeOD + 2 * finH;
  const finSpacing  = 1.0 / finDens;
  const A_fin_1fin  = Math.PI / 4 * (finOD*finOD - tubeOD*tubeOD) * 2;
  const A_bare_1gap = Math.PI * tubeOD * (finSpacing - finThk);
  const A_per_m     = (A_fin_1fin + A_bare_1gap) * finDens;
  const A_total     = A_per_m * tubeLen * nTubes;         // total ext. surface m²
  const A_inside    = Math.PI * tubeID * tubeLen * nTubes; // total inside surface m²

  // Air-side: minimum free-flow area and mass velocity
  const clearT   = pitchT - finOD;
  const A_min    = Math.max(clearT * tubeLen * nTubes / nRows, 0.001);
  const mAir     = Q * 1000 / (1005 * dTa);              // kg/s (energy balance)
  const G_max    = mAir / A_min;                          // kg/m²s

  // Robinson-Briggs j-factor
  const Re_fin   = G_max * finOD / 1.84e-5;              // air visc ~1.84e-5 Pa•s
  const s_D      = Math.max((finSpacing - finThk) / finOD, 0.05);
  const j        = 0.1378 * Math.pow(Math.max(Re_fin, 500), -0.2178)
                           * Math.pow(s_D, -0.1285);
  const h_air_bare = j * G_max * 1005 / Math.pow(0.72, 2/3);  // W/m²K

  // Fin efficiency — Schmidt approximation
  const m_fin    = Math.sqrt(2 * h_air_bare / (kFin * Math.max(finThk, 0.0001)));
  const mH       = m_fin * finH;
  const eta_fin  = Math.tanh(mH) / Math.max(mH, 1e-9);
  const phi_fin  = A_fin_1fin / (A_fin_1fin + A_bare_1gap);
  const eta_0    = 1 - phi_fin * (1 - eta_fin);           // overall surface efficiency
  const h_eff    = eta_0 * h_air_bare;

  // Tube-side HTC (Dittus-Boelter)
  const tubeFluid = fluidAtConditions(flKey, (Ti+To)/2, parseFloat(b.Pop)||P_REF_DB);
  const tubeRes   = calcHtube(tubeFluid, F_kgh/3600/nTubes, tubeID, tubeLen);

  // Overall U on extended-surface basis
  const Ao_Ai  = A_total / Math.max(A_inside, 0.001);
  const U      = 1 / (Ao_Ai/tubeRes.h + Ao_Ai*Rfo + 1/h_eff);

  // LMTD crossflow with F correction
  const lmtdRes = calcLMTD(Ti, To, Tamb, TairOut, 'cross1');
  if (!lmtdRes.lmtd) throw new Error(lmtdRes.err || 'LMTD error');
  const { lmtd, F, dT1, dT2 } = lmtdRes;
  const FLMTD  = lmtd * F;
  const A_req  = Q * 1000 / (U * FLMTD);
  const overDesign = (A_total / A_req - 1) * 100;

  // Fan power estimate (simple fan-law approach)
  const rhoAir   = 1.18;
  const V_air    = mAir / rhoAir;           // m³/s volumetric
  const dP_air   = 0.8 * nRows * G_max * G_max / (2 * rhoAir);  // Pa simple
  const fanPower = V_air * dP_air / (0.65 * 1000);  // kW at 65% efficiency

  const ApproachTemp = To - Tamb;
  const st     = ApproachTemp<5?'err':ApproachTemp<15?'warn':'ok';
  const stTxt  = ApproachTemp<5?'✗ Approach Too Close':ApproachTemp<15?'⚠ Close Approach':'✓ Design Acceptable';
  const warns  = [];
  if (Re_fin < 2000)    warns.push('Airside Re='+Re_fin.toFixed(0)+' below validated range (2000–50000)');
  if (eta_fin < 0.60)   warns.push('Fin efficiency '+( eta_fin*100).toFixed(1)+'% is low');
  if (overDesign < 0)   warns.push('Insufficient tube area — increase nTubes or tube length');

  return {
    Q, Ti, To, Tamb, TairOut, mAir, U, A_total, A_req, overDesign,
    FLMTD, lmtd, F, dT1, dT2, h_eff, h_air_bare, eta_fin, eta_0,
    Re_fin, tubeVel:tubeRes.vel, fanPower, ApproachTemp, st, stTxt,
    fluidName: fluid.name, warns
  };
}

// ─── DOUBLE PIPE ─────────────────────────────────────────────────────────────
function calcDoublePipe(b) {
  const hFlKey=b.hFlKey||'water', cFlKey=b.cFlKey||'water';
  const hFluidDB=getFluid(hFlKey), cFluidDB=getFluid(cFlKey);
  const hPop=parseFloat(b.hPop)||P_REF_DB, cPop=parseFloat(b.cPop)||P_REF_DB;
  const hTi=requireFinite(b.hTi,'hTi'), hTo=requireFinite(b.hTo,'hTo'), cTi=requireFinite(b.cTi,'cTi');
  const hF=requireFinite(b.hF,'hF');
  if (hF<=0) throw new Error('Hot flow must be positive');
  if (hTo>=hTi) throw new Error('Hot outlet must be below hot inlet');
  const hTmean=(hTi+hTo)/2;
  const hFluid=fluidAtConditions(hFlKey,hTmean,hPop);
  const Qhot=(hF/3600)*hFluidDB.cp*(hTi-hTo);
  let cF=parseFloat(b.cF)||0, cTo=parseFloat(b.cTo)||0;
  const coldMode=b.coldMode||'flow';
  if (coldMode==='flow') {
    if (cF<=0) throw new Error('Cold flow must be positive');
    cTo=cTi+Qhot/((cF/3600)*cFluidDB.cp);
  } else {
    if (cTo<=cTi) throw new Error('Cold outlet must be > cold inlet');
    cF=(Qhot/(cFluidDB.cp*(cTo-cTi)))*3600;
  }
  if (cTo>=hTi) throw new Error('Cold outlet exceeds hot inlet');
  const cTmean=(cTi+cTo)/2;
  const cFluid=fluidAtConditions(cFlKey,cTmean,cPop);
  const Qcold=(cF/3600)*cFluidDB.cp*(cTo-cTi);
  const Q=(Qhot+Qcold)/2;
  const balErr=Math.abs(Qhot-Qcold)/Math.max(Qhot,Qcold,0.001)*100;
  const iOD=requireFinite(b.iOD,'iOD')/1000, iTW=requireFinite(b.iTW,'iTW')/1000;
  const oID=requireFinite(b.oID,'oID')/1000;
  const L=requireFinite(b.L,'L'), nHairpins=Math.max(1,parseInt(b.nHairpins)||1);
  const arr=b.arr||'counter', kw=KMAT[b.mat]||16;
  const foul=parseFloat(b.foul)||0.0002;
  const pdAllowInner = parseFloat(b.pdAllowInner || b.pdAllow) || 1.0;
  const pdAllowAnn   = parseFloat(b.pdAllowAnn   || b.pdAllow) || 1.0;
  const iID=iOD-2*iTW;
  if (iID<=0) throw new Error('Wall thickness too large for inner pipe');
  if (oID<=iOD) throw new Error('Outer pipe ID must be greater than inner pipe OD');
  const lmtdRes=calcLMTD(hTi,hTo,cTi,cTo,arr);
  if (!lmtdRes.lmtd) throw new Error(lmtdRes.err||'LMTD error');
  const {lmtd,F,dT1,dT2}=lmtdRes, FLMTD=lmtd*F;
  const L_total=L*nHairpins*2;
  const htInner=calcHtube(hFluid,hF/3600,iID,L_total);
  const Ann_area=Math.PI*(oID*oID-iOD*iOD)/4;
  const Dh_ann=oID-iOD;
  const velAnn=(cF/3600)/(cFluid.rho*Math.max(Ann_area,1e-8));
  const Re_ann=cFluid.rho*velAnn*Dh_ann/(cFluid.mu*1e-3);
  const Pr_ann=Math.max(cFluid.mu*1e-3*cFluid.cp*1000/cFluid.k,0.5);
  let Nu_ann;
  if(Re_ann<2300){Nu_ann=Math.max(3.66,1.86*Math.pow(Re_ann*Pr_ann*Dh_ann/Math.max(L_total,0.01),0.333));}
  else{Nu_ann=0.023*Math.pow(Re_ann,0.8)*Math.pow(Pr_ann,0.333);}
  const hAnn=Nu_ann*cFluid.k/Dh_ann;
  const Ao_Ai=iOD/iID;
  const Rwall=(iOD/2)*Math.log(iOD/iID)/kw;
  const U=1/(1/htInner.h+Ao_Ai/hAnn+Rwall+foul);
  const A_req=Q*1000/(U*FLMTD);
  const A_provided=Math.PI*iOD*L_total;
  const overDesign=(A_provided/A_req-1)*100;
  const dpInner=calcPressDropTube(hFluid,hF/3600,iID,L_total,1);
  const f_ann=Re_ann<2300?64/Math.max(Re_ann,1):Math.pow(0.790*Math.log(Math.max(Re_ann,10))-1.64,-2);
  const dpAnn=(f_ann*(L_total/Dh_ann)+2.0)*cFluid.rho*velAnn*velAnn/2/1e5;
  const NTU=A_req*U/Math.max(Math.min((hF/3600)*hFluidDB.cp,(cF/3600)*cFluidDB.cp)*1000,0.001);
  const Cmin=Math.min((hF/3600)*hFluidDB.cp,(cF/3600)*cFluidDB.cp);
  const eff=Cmin>0?Q/(Cmin*(hTi-cTi)):0;
  const st=overDesign<0?'err':overDesign<5?'warn':'ok';
  const warns=[];
  if(dpInner>pdAllowInner) warns.push(`Inner pipe ΔP ${dpInner.toFixed(3)} bar exceeds allowable ${pdAllowInner} bar`);
if(dpAnn>pdAllowAnn)     warns.push(`Annulus ΔP ${dpAnn.toFixed(3)} bar exceeds allowable ${pdAllowAnn} bar`);
  if(FLMTD<3) warns.push('FLMTD < 3°C — very close approach');
  return {
    Q,Qhot,Qcold,U,balErr,lmtd,F,FLMTD,dT1,dT2,
    A_req,A_provided,overDesign,hInner:htInner.h,hAnn,
    dpInner,dpAnn,pdAllow:pdAllowInner,pdAllowInner,pdAllowAnn,NTU,eff,
    hTi,hTo,cTi,cTo,cF,iID,iOD,L,L_total,nHairpins,
    hFluid,cFluid,Re_inner:htInner.Re,Re_ann,velInner:htInner.vel,velAnn,
    st,warns
  };
}

// ─── FIN-FAN (DETAILED API 661) ───────────────────────────────────────────────
function calcFinFan(b) {
  const tFlKey=b.tFlKey||'water';
  const tFlDB=getFluid(tFlKey);
  const tPop=parseFloat(b.tPop)||4.0;
  const tTi=requireFinite(b.tTi,'tTi'), tTo=requireFinite(b.tTo,'tTo');
  const tF_kgh=requireFinite(b.tF_kgh,'tF_kgh');
  const tFoul=parseFloat(b.tFoul)||2.9e-4, tPdAllow=parseFloat(b.tPdAllow)||0.6;
  const htSF=parseFloat(b.htSF)||1.0;
  const aTamb=requireFinite(b.aTamb,'aTamb'), aTout=requireFinite(b.aTout,'aTout');
  const aPop=parseFloat(b.aPop)||1.01325, aFoul=parseFloat(b.aFoul)||1.8e-4;
  const tubeOD=requireFinite(b.tubeOD,'tubeOD')/1000, tubeID=requireFinite(b.tubeID,'tubeID')/1000;
  const tubeLen=requireFinite(b.tubeLen,'tubeLen')/1000;
  const pitchT=requireFinite(b.pitchT,'pitchT')/1000, pitchL=requireFinite(b.pitchL,'pitchL')/1000;
  const nRows=Math.max(1,parseInt(b.nRows)||4), nPasses=Math.max(1,parseInt(b.nPasses)||2);
  const nTubes=Math.max(1,parseInt(b.nTubes)||261);
  const tubeLayout=b.tubeLayout||'staggered';
  const kTube=({cs:50,ss304:17,ss316:14,copper:385,titanium:21,aluminum:205})[b.tubeMat]||17;
  const finDensity=parseFloat(b.finDensity)||787;
  const finRoot=requireFinite(b.finRoot,'finRoot')/1000, finH=requireFinite(b.finH,'finH')/1000;
  const finThk=requireFinite(b.finThk,'finThk')/1000;
  const kFin=({al1100:222,al3003:190,copper:385,ss:16})[b.finMat]||222;
  const finOD=finRoot+2*finH;
  const nBays=Math.max(1,parseInt(b.nBays)||1), nBundlesPBay=Math.max(1,parseInt(b.nBundlesPBay)||1);
  const bundleW=requireFinite(b.bundleW,'bundleW')/1000;
  const nFans=Math.max(0,parseInt(b.nFans)||2), fanDia=parseFloat(b.fanDia)||3658/1000;
  const fanEff=Math.max(0.1,parseFloat(b.fanEff)||0.65);
  const driverKW=parseFloat(b.driverKW)||30;
  const draftType=b.draftType||'forced';
  if(tTo>=tTi) throw new Error('Tubeside outlet must be below inlet');
  if(aTout<=aTamb) throw new Error('Air outlet must be above ambient');
  if(tubeID>=tubeOD) throw new Error('Tube ID must be less than tube OD');
  if(finRoot<tubeOD) throw new Error('Fin root diameter must be ≥ tube OD');
  const tTmean=(tTi+tTo)/2;
  const tFluid=fluidAtConditions(tFlKey,tTmean,tPop);
  const tF_kgs=tF_kgh/3600;
  const aTmean=(aTamb+aTout)/2;
  const aFluid=fluidAtConditions('air',aTmean,aPop);
  const Qhot=tF_kgs*tFlDB.cp*(tTi-tTo);
  const nTubeTotal=nTubes*nBays*nBundlesPBay;
  const finSpacing=1.0/finDensity;
  const finsPerTube=finDensity*tubeLen;
  const nFinGaps=finsPerTube-1;
  const A_fin_per_fin=Math.PI/4*(finOD*finOD-tubeOD*tubeOD)*2+Math.PI*finOD*finThk;
  const A_bare_per_fin_gap=Math.PI*tubeOD*(finSpacing-finThk);
  const A_bare_ends=Math.PI*tubeOD*(finSpacing/2);
  const A_fin_per_tube=A_fin_per_fin*finsPerTube;
  const A_bare_per_tube=A_bare_per_fin_gap*nFinGaps+2*A_bare_ends;
  const A_total_per_tube=A_fin_per_tube+A_bare_per_tube;
  const A_extended=A_total_per_tube*nTubeTotal;
  const A_bare=A_bare_per_tube*nTubeTotal;
  const A_bare_unit=Math.PI*tubeOD*tubeLen*nTubeTotal;
  const areaRatio=A_extended/A_bare_unit;
  const A_inside=Math.PI*tubeID*tubeLen*nTubeTotal;
  const bundleL_calc=nRows*pitchL+tubeOD;
  const A_face_per_bundle=bundleW*tubeLen;
  const A_face_total=A_face_per_bundle*nBays*nBundlesPBay;
  function finEff(h_ao){
    const m=Math.sqrt(2*h_ao/(kFin*Math.max(finThk,0.0001)));
    const r1=finRoot/2, r2=finOD/2, r2c=r2+finThk/2;
    const mH=m*(r2c-r1);
    const eta_fin_approx=Math.tanh(mH)/Math.max(mH,1e-9);
    const phi_fin=A_fin_per_tube/A_total_per_tube;
    const eta_surf=1-phi_fin*(1-eta_fin_approx);
    return {eta_fin:eta_fin_approx,eta_surf};
  }
  const clearT=Math.max(pitchT-finOD,pitchT-tubeOD*1.1,0.001);
  const A_min_row=tubeLen*clearT*(1-finDensity*finThk);
  const A_min_total=Math.max(A_min_row*nBays*nBundlesPBay,0.001);
  const cp_air_kJ=aFluid.cp;
  const mAir_kgs=Qhot/(cp_air_kJ*(aTout-aTamb));
  const mAir_kgh=mAir_kgs*3600;
  const rho_air=aFluid.rho;
  const v_face=mAir_kgs/(rho_air*Math.max(A_face_total,0.01));
  const G_max=mAir_kgs/Math.max(A_min_total*nRows,0.001);
  const v_max=G_max/rho_air;
  const mu_air=aFluid.mu*1e-3;
  const Re_air=G_max*finOD/mu_air;
  const Pr_air=Math.max(mu_air*cp_air_kJ*1000/aFluid.k,0.5);
  const s_fin=finSpacing-finThk;
  const s_over_D=Math.max(s_fin/finOD,0.05);
  const Re_safe=Math.max(Re_air,500);
  const j_factor=tubeLayout==='staggered'?0.1378*Math.pow(Re_safe,-0.2178)*Math.pow(s_over_D,-0.1285):0.0724*Math.pow(Re_safe,-0.2178)*Math.pow(s_over_D,-0.1285);
  const cp_air_J=cp_air_kJ*1000;
  let h_air=j_factor*G_max*cp_air_J/Math.pow(Pr_air,2/3);
  for(let i=0;i<5;i++){finEff(h_air);h_air=j_factor*G_max*cp_air_J/Math.pow(Pr_air,2/3);}
  const {eta_fin,eta_surf}=finEff(h_air);
  const h_air_eff=eta_surf*h_air;
  const nTubesPerPass=Math.max(1,Math.round(nTubes/nPasses));
  const massPerTube=tF_kgs/Math.max(nTubesPerPass,1);
  const hTube_res=calcHtube(tFluid,massPerTube,tubeID,tubeLen);
  const h_tube=hTube_res.h;
  const Ao_per_Ai=A_extended/A_inside;
  const Rw_cyl=(tubeOD/2)*Math.log(tubeOD/tubeID)/kTube;
  const Rw_ext=Rw_cyl*(A_extended/A_bare_unit);
  const U_ext=1/(Ao_per_Ai/h_tube+Ao_per_Ai*tFoul+Rw_ext+aFoul/eta_surf+1/h_air_eff);
  const lmtdRes=calcLMTD(tTi,tTo,aTamb,aTout,'cross1');
  if (!lmtdRes.lmtd) throw new Error(lmtdRes.err||'LMTD error');
  const {lmtd,F,dT1,dT2}=lmtdRes;
  const F_rows=Math.min(F+(1-F)*Math.min(nRows,8)*0.08,0.98);
  const EMTD=lmtd*F_rows;
  const A_req=Qhot*1000*htSF/(U_ext*EMTD);
  const A_prov=A_extended;
  const overDesign=(A_prov/A_req-1)*100;
  const U_actual=Qhot*1000/(A_prov*EMTD);
  const tubeVel=massPerTube/(tFluid.rho*Math.PI*tubeID*tubeID/4);
  const mu_t=tFluid.mu*1e-3;
  const Re_tube=tFluid.rho*tubeVel*tubeID/mu_t;
  const f_tube=Re_tube<2300?64/Math.max(Re_tube,1):Math.pow(0.790*Math.log(Math.max(Re_tube,10))-1.64,-2);
  const L_flow=tubeLen*nPasses;
  const dyn_t=tFluid.rho*tubeVel*tubeVel/2;
  const dpTube=(f_tube*L_flow/tubeID+1.5+2.0*(nPasses-1)*1.5+2.0)*dyn_t/1e5;
  const f_air_C=tubeLayout==='staggered'?18.0:14.0;
  const f_friction=f_air_C*Math.pow(Re_safe,-0.316);
  const dpAir_Pa=f_friction*nRows*G_max*G_max/(2*rho_air);
  const dpAir_mmH2O=dpAir_Pa/9.80665;
  const dynPr_air=0.5*rho_air*v_face*v_face;
  const vPr_mmH2O=dynPr_air/9.80665;
  const V_air_m3s=mAir_kgs/rho_air;
  const V_air_100m3min=V_air_m3s*60/100;
  const P_static_Pa=dpAir_Pa;
  const P_fan_total=nFans*nBays>0?V_air_m3s*(P_static_Pa+dynPr_air)/Math.max(fanEff,0.1)/1000:0;
  const P_fan_each=P_fan_total/Math.max(nFans*nBays,1);
  const A_fan_each=Math.PI*fanDia*fanDia/4;
  const A_fan_total=nFans*nBays*A_fan_each;
  const fanAreaRatio=A_fan_total/Math.max(A_face_total,0.001);
  const R_tube_film=Ao_per_Ai/h_tube;
  const R_foul_tube=Ao_per_Ai*tFoul;
  const R_wall_val=Rw_ext;
  const R_foul_air=aFoul/eta_surf;
  const R_air_film=1/h_air_eff;
  const R_total=R_tube_film+R_foul_tube+R_wall_val+R_foul_air+R_air_film;
  const h_clean=1/(R_tube_film+R_wall_val+R_air_film);
  const T_skin_max=tTi-(tTi-aTamb)*(R_tube_film+R_foul_tube)/R_total;
  const T_skin_min=tTo-(tTo-aTamb)*(R_tube_film+R_foul_tube)/R_total;
  let st='ok',stTxt='✓ Design Acceptable';
  if(overDesign<0){st='err';stTxt='✗ Under-designed';}
  else if(overDesign<5||dpTube>tPdAllow||P_fan_each>driverKW*1.05){st='warn';stTxt='⚠ Check Warnings';}
  const warns=[];
  if(overDesign<0) warns.push(`Insufficient tube area — add ${Math.abs(overDesign).toFixed(1)}% more`);
  if(overDesign>50) warns.push(`${overDesign.toFixed(1)}% overdesign is high`);
  if(dpTube>tPdAllow) warns.push(`Tubeside ΔP ${dpTube.toFixed(3)} bar exceeds allowable ${tPdAllow}`);
  if(P_fan_each>driverKW) warns.push(`Fan power ${P_fan_each.toFixed(1)} kW exceeds driver ${driverKW} kW`);
  if(Re_air<2000) warns.push(`Airside Re=${Re_air.toFixed(0)} below validated range of Robinson-Briggs (2000–50000)`);
  if(eta_fin<0.60) warns.push(`Fin efficiency ${(eta_fin*100).toFixed(1)}% is low (<60%)`);
  if(v_face>4.0) warns.push(`Face velocity ${v_face.toFixed(2)} m/s is high (>4 m/s)`);
  if(fanAreaRatio<0.35) warns.push(`Fan coverage ${(fanAreaRatio*100).toFixed(0)}% low (<35%)`);
  return {
    Qhot,tTi,tTo,tF_kgh,tFluid,tFlDB,aTamb,aTout,mAir_kgh,
    A_extended,A_bare,A_req,A_prov,overDesign,EMTD,lmtd,F,F_rows,dT1,dT2,
    U_ext,U_actual,h_outside:h_air,h_tubeside:h_tube,h_clean,
    eta_fin,eta_surf,h_air,h_air_eff,
    dpTube,dpAir_Pa,dpAir_mmH2O,vPr_mmH2O,P_fan_total,P_fan_each,
    v_face,v_max,G_max,V_air_m3s,V_air_100m3min,Re_air,Re_tube,tubeVel,
    A_face_total,bundleL_calc,areaRatio,finsPerTube,
    R_tube_film,R_foul_tube,R_wall_val,R_foul_air,R_air_film,R_total,
    T_skin_max,T_skin_min,nTubeTotal,nTubesPerPass,
    fanAreaRatio,driverKW,nFans,nBays,nBundlesPBay,bundleW,
    st,stTxt,warns
  };
}

// ─── LMTD / NTU ──────────────────────────────────────────────────────────────
function calcLmtdNtu(b) {
  const hTi=requireFinite(b.hTi,'hTi'), hTo=requireFinite(b.hTo,'hTo');
  const cTi=requireFinite(b.cTi,'cTi'), cTo=requireFinite(b.cTo,'cTo');
  const arr=b.arr||'counter';
  if(hTo>=hTi) throw new Error('Hot outlet must be below hot inlet');
  if(cTo<=cTi) throw new Error('Cold outlet must be above cold inlet');
  if(hTi<=cTi) throw new Error('Hot inlet must be above cold inlet');
  const lmtdRes=calcLMTD(hTi,hTo,cTi,cTo,arr);
  if (!lmtdRes.lmtd) throw new Error(lmtdRes.err||'Cannot compute LMTD');
  const {lmtd,F,dT1,dT2}=lmtdRes, FLMTD=lmtd*F;
  const Ch=parseFloat(b.Ch)||null, Cc=parseFloat(b.Cc)||null;
  const UA_given=parseFloat(b.UA)||null;
  let NTU=null,eff=null,Cmin_kW=null,UA=UA_given;
  if(Ch&&Cc){
    Cmin_kW=Math.min(Ch,Cc);
    const Cmax_kW=Math.max(Ch,Cc);
    const Q_kW=Ch*(hTi-hTo), Qmax=Cmin_kW*(hTi-cTi);
    eff=Qmax>0?Q_kW/Qmax:null;
    const Cr=Cmin_kW/Cmax_kW;
   if(arr==='counter'&&Cr<0.999&&eff!=null)
      NTU=Math.log((1-Cr*Math.max(eff,0.001))/Math.max(1-eff,0.001))/(1-Cr);
    else if(arr==='counter'&&Cr>=0.999&&eff!=null)
      NTU=eff/Math.max(1-eff,1e-9);
    else if(arr==='parallel'&&eff!=null)
      NTU=-Math.log(1-eff*(1+Cr))/(1+Cr);
    else if(arr==='cross1'&&eff!=null)
      // Crossflow (both unmixed) — iterative inversion of NTU-effectiveness
      NTU=(function(){let n=1.0;for(let i=0;i<30;i++){const e=1-Math.exp((Math.exp(-Cr*Math.pow(n,0.22))-1)*Math.pow(n,0.78)/Cr);const de=(e-eff);if(Math.abs(de)<1e-6)break;n-=de/0.5;n=Math.max(0.01,n);}return n;})();
    else if(eff!=null)
      NTU=Math.log((1-Cr*Math.max(eff,0.001))/Math.max(1-eff,0.001))/(1-Math.max(Cr,0.001));
    UA=NTU*Cmin_kW*1000;
  }
  return {lmtd,F,FLMTD,dT1,dT2,NTU,eff,UA,Cmin_kW,hTi,hTo,cTi,cTo,arr};
}

// ─── WALL THICKNESS ───────────────────────────────────────────────────────────
function calcWallThickness(b) {
  const std=b.std||'asme8d1', type=b.type||'cylinder';
  const P_barg=requireFinite(b.P,'P'), D_mm=requireFinite(b.D,'D');
  let S_MPa=parseFloat(b.S)||138;
  const CA_mm=parseFloat(b.CA)||3, MT_mm=parseFloat(b.MT)||0.6;
  const E=parseFloat(b.E)||1.0, alpha=parseFloat(b.alpha)||30;
  if(b.mat&&b.mat!=='custom') S_MPa=parseFloat(b.mat)||S_MPa;
  const P_MPa=P_barg*0.1, R_i=D_mm/2;
  if(P_MPa<=0||D_mm<=0||S_MPa<=0) throw new Error('Enter valid pressure, diameter, and stress');
  let t_calc_mm, formula, standardName;
  if(type==='cylinder'){
    if(std==='asme8d1'){t_calc_mm=(P_MPa*R_i)/(S_MPa*E-0.6*P_MPa);formula='t = P·R_i/(S·E−0.6P)';standardName='ASME VIII Div.1 UG-27(c)(1)';}
    else if(std==='en13445'){t_calc_mm=(P_MPa*D_mm)/(2*S_MPa*E-P_MPa);formula='e = P·D_i/(2·f·z−P)';standardName='EN 13445-3 Clause 7.4.2';}
    else{t_calc_mm=(P_MPa*D_mm)/(2*S_MPa*E-P_MPa);formula='e = P·D_i/(2·f·z−P)';standardName='BS PD 5500';}
  } else if(type==='sphere'){
    if(std==='asme8d1'){t_calc_mm=(P_MPa*R_i)/(2*S_MPa*E-0.2*P_MPa);formula='t = P·R_i/(2·S·E−0.2P)';standardName='ASME VIII Div.1 UG-27(d)';}
    else{t_calc_mm=(P_MPa*D_mm)/(4*S_MPa*E-P_MPa);formula='e = P·D_i/(4·f·z−P)';standardName='EN 13445-3 Clause 7.4.3';}
  } else {
    const aRad=alpha*Math.PI/180;
    t_calc_mm=(P_MPa*D_mm)/(2*Math.cos(aRad)*(S_MPa*E-0.6*P_MPa));
    formula=`t = P·D_i/(2·cos(α)·(S·E−0.6P)) α=${alpha}°`;
    standardName=`ASME VIII Div.1 UG-32(g) Conical`;
  }
  const t_with_CA=t_calc_mm+CA_mm+MT_mm;
  const t_nominal=Math.ceil(t_with_CA*2)/2;
  const pMax_check=(S_MPa*E*(t_nominal-CA_mm-MT_mm))/(R_i+0.6*(t_nominal-CA_mm-MT_mm));
  const OD_mm=D_mm+2*t_nominal;
  const tRatio=t_calc_mm/R_i;
  const isThickWall=tRatio>0.5;
  const lameT=isThickWall?R_i*(Math.exp(P_MPa/(2*S_MPa*E))-1):null;
  return {t_calc_mm,t_with_CA,t_nominal,OD_mm,tRatio,isThickWall,pMax_check_bar:pMax_check*10,lameT,P_barg,P_MPa,D_mm,S_MPa,E,CA_mm,MT_mm,formula,standardName};
}

// ─── FOULING COMBINED ─────────────────────────────────────────────────────────
function calcFouling(b) {
  const Rf_s=parseFloat(b.Rf_s)||0, Rf_t=parseFloat(b.Rf_t)||0;
  const U_cl=parseFloat(b.U_cl)||800;
  const Rf_total=Rf_s+Rf_t;
  const U_service=1/(1/U_cl+Rf_total);
  const area_increase=(U_cl/U_service-1)*100;
  return {Rf_s,Rf_t,Rf_total,U_cl,U_service,area_increase};
}

// ─── HX SELECTOR ─────────────────────────────────────────────────────────────
function calcSelector(b) {
  const {app,pres,foul,duty,space,corr}=b;
  const scores={'shell-tube':0,'plate':0,'air-cooled':0,'double-pipe':0,'spiral':0,'plate-fin':0};
  if(app==='liquid-liquid'){scores['plate']+=3;scores['shell-tube']+=2;scores['double-pipe']+=1;}
  if(app==='liquid-gas'){scores['shell-tube']+=3;scores['air-cooled']+=2;}
  if(app==='gas-gas'){scores['plate-fin']+=3;scores['shell-tube']+=1;}
  if(app==='condensing'){scores['shell-tube']+=4;scores['plate']+=1;}
  if(app==='evaporating'){scores['shell-tube']+=4;}
  if(app==='air-cooling'){scores['air-cooled']+=5;}
  if(pres==='high'){scores['shell-tube']+=3;scores['plate']-=2;scores['double-pipe']+=2;}
  if(pres==='medium'){scores['shell-tube']+=2;scores['plate']+=1;}
  if(pres==='low'){scores['plate']+=2;scores['shell-tube']+=1;}
  if(foul==='high'){scores['shell-tube']+=3;scores['plate']-=3;scores['spiral']+=3;}
  if(foul==='medium'){scores['shell-tube']+=2;}
  if(foul==='low'){scores['plate']+=2;}
  if(duty==='small'){scores['double-pipe']+=3;scores['plate']+=2;}
  if(duty==='medium'){scores['plate']+=2;scores['shell-tube']+=2;}
  if(duty==='large'){scores['shell-tube']+=3;scores['air-cooled']+=2;}
  if(space==='very-limited'){scores['plate']+=3;scores['plate-fin']+=2;scores['shell-tube']-=1;}
  if(space==='limited'){scores['plate']+=2;}
  if(space==='plenty'){scores['shell-tube']+=1;scores['air-cooled']+=1;}
  if(corr==='high'){scores['plate']+=2;scores['shell-tube']+=1;}
  if(corr==='medium'){scores['shell-tube']+=1;}
  const sorted=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return {top:sorted[0][0],second:sorted[1][0],scores};
}

// ── End of Section 06: HeatXpert Pro (Heat Exchanger) ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
