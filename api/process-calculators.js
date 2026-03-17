// ════════════════════════════════════════════════════════════════════════════
// api/process-calculators.js
// MERGED VERCEL SERVERLESS API — FILE 5 of 5
//
// CALCULATORS IN THIS FILE
// ────────────────────────
//   SECTION A  ►  CONTROL VALVE SIZING                 /api/control-valve
//   SECTION B  ►  GAS EQUATION OF STATE (EOS)          /api/eos
//   SECTION C  ►  ORIFICE FLOW CALCULATOR              /api/orifice-flow
//   SECTION D  ►  PRESSURE DROP CALCULATOR             /api/pressure-drop-calculator
//   SECTION E  ►  VESSEL & SEPARATOR SIZING            /api/vessel-separator-sizing
//                                                      /api/calculate  (legacy alias)
//
// HOW TO NAVIGATE
//   Search "SECTION A" → Control Valve (ISA/IEC sizing, Cv, Kv)
//   Search "SECTION B" → Equation of State (Ideal, VdW, SRK, PR)
//   Search "SECTION C" → Orifice Flow (ISO 5167, Reader-Harris/Gallagher)
//   Search "SECTION D" → Pressure Drop (Darcy-Weisbach, Hazen-Williams)
//   Search "SECTION E" → Vessel & Separator Sizing
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
    case 'control-valve':
      return await controlValve_handler(req, res);
    case 'eos':
      return await eos_handler(req, res);
    case 'orifice-flow':
      return await orificeFlow_handler(req, res);
    case 'pressure-drop-calculator':
      return await pressureDrop_handler(req, res);
    case 'vessel-separator-sizing':
    case 'calculate':                    // legacy alias kept for backwards compatibility
      return await vesselSeparator_handler(req, res);
    default:
      return res.status(404).json({
        error: `Unknown route: "${key}". Valid: control-valve, eos, orifice-flow, pressure-drop-calculator, vessel-separator-sizing`
      });
  }
}
// ── End of Router ────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION A  ►  CONTROL VALVE SIZING
// Route: /api/control-valve
// (Original: SECTION 02 of 21)
// ══════════════════════════════════════════════════════════════════════════════
// SECTION 02 of 21  ►  CONTROL VALVE
// Route: /api/control-valve
// Source: control-valve.js
// ══════════════════════════════════════════════════════════════════════════════

// ============================================================
// Vercel Serverless API — Control Valve Sizing
// File: /api/control-valve.js
// ALL math, unit conversions, validation done HERE — nothing in client
// ============================================================
const TSAT_TABLE = [
  [14.696,212.0],[20,227.9],[40,267.2],[60,292.7],[80,312.0],
  [100,327.8],[150,358.4],[200,381.8],[300,417.4],[400,444.6],
  [500,467.0],[700,503.1],[1000,544.7],[1500,596.4],[2000,636.0],
  [2500,668.1],[3000,695.4],
];
function getTsatF(P_psia) {
  const t = TSAT_TABLE;
  if (P_psia <= t[0][0]) return t[0][1];
  if (P_psia >= t[t.length-1][0]) return t[t.length-1][1];
  for (let i=0; i<t.length-1; i++) {
    if (t[i][0] <= P_psia && P_psia <= t[i+1][0]) {
      const frac = Math.log(P_psia/t[i][0]) / Math.log(t[i+1][0]/t[i][0]);
      return t[i][1] + frac*(t[i+1][1]-t[i][1]);
    }
  }
  // Steam specific volume vg [ft³/lb] vs P [psia] — NIST saturated steam
const VG_TABLE = [
  [14.696,26.80],[20,20.09],[40,10.50],[60,7.176],[80,5.472],
  [100,4.432],[150,3.015],[200,2.289],[300,1.543],[400,1.162],
  [500,0.928],[700,0.655],[1000,0.446],[1500,0.277],[2000,0.188],
  [2500,0.131],[3000,0.086],
];
function getVgSteam(P_psia) {
  const t = VG_TABLE;
  if (P_psia <= t[0][0]) return t[0][1];
  if (P_psia >= t[t.length-1][0]) return t[t.length-1][1];
  for (let i=0; i<t.length-1; i++) {
    if (t[i][0] <= P_psia && P_psia <= t[i+1][0]) {
      const frac = Math.log(P_psia/t[i][0]) / Math.log(t[i+1][0]/t[i][0]);
      return t[i][1] + frac*(t[i+1][1]-t[i][1]);
    }
  }
  return t[t.length-1][1];
}
  return t[t.length-1][1];
}
function controlValve_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

    try {
    const d = req.body;

    // ── RAW INPUTS ────────────────────────────────────────────────────────────
    const phase    = d.phase    || 'liq_gen';
    const flowType = d.flowType || 'vol';
    const units    = d.units    || 'imp';   // 'imp' = US, 'met' = SI
    const m        = units === 'met';
    const isL      = phase.includes('liq');
    const isG      = phase.includes('gas');
    const isS      = phase === 'steam';

    const Q  = parseFloat(d.Q)  || 0;
    const P1 = parseFloat(d.P1) || 0;
    const P2 = parseFloat(d.P2) || 0;
    const T  = parseFloat(d.T)  || (m ? 20 : 60);
    const SG = parseFloat(d.SG) || 1;
    const Pv = parseFloat(d.Pv) || 0;
    const D  = parseFloat(d.D)  || (m ? 52.5 : 2.067);
    const FL = parseFloat(d.FL) || 0.9;
    const k  = parseFloat(d.k)  || 1.4;
    const Z  = parseFloat(d.Z)  || 1.0;
    const fluidVisc  = parseFloat(d.fluidVisc) || 1.0;
    const fluidPc    = d.fluidPc ? parseFloat(d.fluidPc) : null;
    const steamFluid = d.steamFluid || '';
    const charType   = d.charType  || 'equal_pct'; // valve characteristic for open% calc
    const R_trim     = Math.max(10, Math.min(200, parseFloat(d.R_trim) || 50)); // rangeability
      // Valve NPS for Fp piping geometry factor (IEC 60534-2-1 §4.1)
    // If not supplied → Fp = 1.0 (no correction)
    const d_valve_raw = d.d_valve ? parseFloat(d.d_valve) : null;
    const d_valve_in  = d_valve_raw ? (m ? d_valve_raw/25.4 : d_valve_raw) : null;
    // Q_min for turndown check
    const Q_min_raw   = d.Q_min ? parseFloat(d.Q_min) : null;

    // ── VALIDATION ────────────────────────────────────────────────────────────
    const warns = [];
    let hasError = false;

    if (P1 <= 0) { warns.push({ cls:'warn-red', txt:'❌ Inlet pressure P₁ must be positive.' }); hasError=true; }
    if (P2 < 0)  { warns.push({ cls:'warn-red', txt:'❌ Outlet pressure P₂ cannot be negative.' }); hasError=true; }
    if (!hasError && P2 >= P1) { warns.push({ cls:'warn-red', txt:'❌ P₂ ≥ P₁: Outlet pressure must be less than inlet pressure.' }); hasError=true; }
    if (Q <= 0)  { warns.push({ cls:'warn-red', txt:'❌ Flow rate must be greater than zero.' }); hasError=true; }
    if (isL && SG <= 0) { warns.push({ cls:'warn-red', txt:'❌ Specific gravity must be positive.' }); hasError=true; }
    if (isG && SG <= 0) { warns.push({ cls:'warn-red', txt:'❌ Molecular weight must be positive.' }); hasError=true; }
    if (FL <= 0 || FL > 1) warns.push({ cls:'warn-amber', txt:'⚠ FL/xT should be between 0.1 and 1.0.' });
    if (Z <= 0  || Z > 1.5) warns.push({ cls:'warn-amber', txt:'⚠ Compressibility Z outside typical range (0.7–1.05).' });

    // Gauge pressure warnings
    if (!hasError && isL && !m && P1 < 14.5 && P1 > 0)
      warns.push({ cls:'warn-amber', txt:`⚠ P₁ = ${P1} psi looks like gauge pressure. IEC 60534 requires ABSOLUTE pressure. Add 14.7 psia.` });
    if (!hasError && m && P1 < 1.013 && P1 > 0 && isL)
      warns.push({ cls:'warn-amber', txt:`⚠ P₁ = ${P1} bar looks like gauge pressure. IEC 60534 requires ABSOLUTE pressure (bara). Add 1.013 bar.` });
    if (isL && Pv > 0 && Pv >= P1) {
      warns.push({ cls:'warn-red', txt:'❌ Vapour pressure Pv ≥ P₁: fluid already vaporised at inlet.' }); hasError=true;
    }

    if (hasError) return res.status(200).json({ error: null, warns, Cv:null, Kv:null });

    // ── UNIT CONVERSIONS to US base ───────────────────────────────────────────
    let P1a = P1, P2a = P2, Pva = Pv, T_F = T, D_in = D;
    if (m) {
      P1a  *= 14.5038;   // bara → psia
      P2a  *= 14.5038;
      Pva  *= 14.5038;
      D_in  = D / 25.4;  // mm → in
      T_F   = T * 9/5 + 32; // °C → °F
    }
      // ── SG temperature correction warning ────────────────────────────────────
    if (isL && T_F > 176 && SG > 0.940 && SG < 1.050)
      warns.push({ cls:'warn-amber',
        txt:`⚠ Process temperature ${m?T.toFixed(0)+'°C':T_F.toFixed(0)+'°F'} > 80°C: verify SG is corrected for process temperature. Using ambient SG can cause Cv errors up to 5%.` });
    const dP   = Math.max(P1a - P2a, 0.0001);
    const TR   = T_F + 459.67;  // Rankine
    const A_in2 = Math.PI / 4 * D_in * D_in;
     const Pc_default = phase==='liq_gen'?600:phase==='liq_chem'?900:3208;
    const Pc_psia = fluidPc ? fluidPc * 14.5038 : Pc_default;

    // ── FLOW CONVERSION to canonical units ────────────────────────────────────
    let Qc = Q;
    if (isL) {
      if      (flowType === 'vol')  { if (m) Qc = Q * 4.40287; }
      else if (flowType === 'mass') {
        const rho = SG * 8.3454;
        Qc = m ? (Q * 2.20462) / (rho * 60) : Q / (rho * 60);
      } else { if (m) Qc = Q * 4.40287; }
    } else if (isG) {
      if      (flowType === 'vol')  { if (m) Qc = Q * 37.33; }
      else if (flowType === 'mass') { const lbh = m ? Q * 2.20462 : Q; Qc = (lbh / SG) * 379.5; }
      else { if (m) Qc = Q * 37.33; }
    } else {
      Qc = m ? Q * 2.20462 : Q; // steam → lb/h
    }

    // ── CORE IEC 60534-2-1 CALCULATIONS ──────────────────────────────────────
    let Cv = 0, vel = 0, dPmax = 0, dPeff = dP, x_ratio = 0, Fp = 1.0, Fp_g = 1.0;
    let flowState = '', noiseDb = 0, Y = null, FR = null, Rev = null;

    if (isL) {
      // LIQUID — IEC 60534-2-1 §5.1
      const FF  = Math.max(0.5, Math.min(0.96, 0.96 - 0.28 * Math.sqrt(Math.max(Pva / Pc_psia, 0))));
      dPmax     = Math.max(FL * FL * (P1a - FF * Pva), 0.001);
      dPeff     = Math.min(dP, dPmax);
      Cv        = Qc * Math.sqrt(SG / Math.max(dPeff, 0.0001));

      // Reynolds viscosity correction IEC 60534 §5.3
      Rev = 76000 * Qc / (fluidVisc * Math.pow(FL, 1.5) * Math.sqrt(Math.max(Cv, 0.001)));
      FR  = 1.0;
      if (Rev < 10000) {
        if      (Rev < 10)    FR = 0.026 * Math.pow(Rev, 0.33);
        else if (Rev < 100)   FR = 0.12  * Math.pow(Rev, 0.20);
        else if (Rev < 1000)  FR = 0.34  * Math.pow(Rev, 0.10);
        else                  FR = 0.70  * Math.pow(Rev / 10000, 0.04);
        FR = Math.min(Math.max(FR, 0.1), 1.0);
        Cv = Cv / FR;
      }
// ── Fp PIPING GEOMETRY FACTOR — IEC 60534-2-1 §4.1 Eq.2 ──────────────
      Fp = 1.0;
      if (d_valve_in && d_valve_in < D_in * 0.99) {
        const beta  = d_valve_in / D_in;
        const beta2 = beta * beta;
        const K1    = 0.5 * Math.pow(1 - beta2, 2);
        const K2    = 1.0 * Math.pow(1 - beta2, 2);
        const sumK  = K1 + K2;
        Fp = 1.0 / Math.sqrt(1.0 + (sumK * Cv * Cv) / (890.0 * Math.pow(d_valve_in, 4)));
        Fp = Math.min(1.0, Math.max(0.5, Fp));
        Cv = Cv / Fp;
        if (Fp < 0.99) warns.push({ cls:'warn-amber',
          txt:`⚠ Fp piping correction: Fp=${Fp.toFixed(3)}, Cv increased by ${((1/Fp-1)*100).toFixed(1)}% for ${m?(d_valve_raw.toFixed(0)+' mm valve'):(d_valve_in.toFixed(3)+'" valve')} in ${m?((D_in*25.4).toFixed(0)+' mm pipe'):(D_in.toFixed(3)+'" pipe')} (IEC 60534-2-1 §4.1).` });
      }
      
      vel = Qc * 0.002228 / (A_in2 / 144.0);

      const sigma = (P1a - Pva) / Math.max(dP, 0.0001);
      const ci    = dP / Math.max(dPmax, 0.0001);
      x_ratio     = Math.min(ci, 1.0);

      if      (dP >= dPmax) flowState = '🔴 Choked / Flashing';
      else if (ci > 0.75)   flowState = `🟡 Cavitation Risk (σ=${sigma.toFixed(2)})`;
      else if (ci > 0.50)   flowState = `🟠 Incipient Cavitation (σ=${sigma.toFixed(2)})`;
      else                  flowState = '🟢 Normal Liquid';

      noiseDb = Math.round(68 + 10*Math.log10(Math.max(Cv,1)) + 12*(ci>1?1:ci)*Math.log10(Math.max(P1a/14.7,1.1)));

      if (dP >= dPmax) warns.push({ cls:'warn-red',   txt:`⚠️ Choked flow — Cv at ΔP_choked = ${fmt2(m?dPmax/14.5038:dPmax)} ${m?'bara':'psia'}. Hardened trim required.` });
      else if (ci > 0.75) warns.push({ cls:'warn-amber', txt:`⚠ Cavitation risk (ΔP/ΔP_choked = ${(ci*100).toFixed(0)}%). Anti-cavitation trim recommended. σ = ${sigma.toFixed(2)}.` });
      else if (ci > 0.50) warns.push({ cls:'warn-amber', txt:`⚠ Incipient cavitation. Monitor trim. σ = ${sigma.toFixed(2)}.` });
      if (FR < 0.95) warns.push({ cls:'warn-amber', txt:`⚠ Viscosity correction: FR=${FR.toFixed(3)}, Rev=${Rev.toFixed(0)}. Cv +${((1/FR-1)*100).toFixed(1)}% for viscous flow.` });

    } else if (isG) {
      // GAS — IEC 60534-2-1 §5.2
      const MW     = SG;
      const xT     = FL;
      const x      = dP / Math.max(P1a, 0.0001);
      const Fk     = k / 1.4;
      const x_crit = Fk * xT;
      const x_lim  = Math.min(x, x_crit);
      x_ratio      = x / Math.max(x_crit, 0.0001);
      Y            = Math.max(1.0 - x_lim / (3.0 * Fk * xT), 0.667);
      dPmax        = x_crit * P1a;

      Cv = Qc * Math.sqrt(MW * TR * Z) / (1360.0 * P1a * Y * Math.sqrt(Math.max(x_lim, 0.0001)));
// ── Fp PIPING GEOMETRY FACTOR for Gas ───────────────────────────────────
      Fp_g = 1.0;
      if (d_valve_in && d_valve_in < D_in * 0.99) {
        const beta_g  = d_valve_in / D_in;
        const beta2_g = beta_g * beta_g;
        const sumK_g  = 0.5*Math.pow(1-beta2_g,2) + 1.0*Math.pow(1-beta2_g,2);
        Fp_g = 1.0 / Math.sqrt(1.0 + (sumK_g * Cv * Cv) / (890.0 * Math.pow(d_valve_in, 4)));
        Fp_g = Math.min(1.0, Math.max(0.5, Fp_g));
        Cv   = Cv / Fp_g;
        if (Fp_g < 0.99) warns.push({ cls:'warn-amber',
          txt:`⚠ Fp piping correction (gas): Fp=${Fp_g.toFixed(3)}, Cv +${((1/Fp_g-1)*100).toFixed(1)}% (IEC 60534-2-1 §4.1).` });
      }
      
      const Q_cfs = Qc * (14.696 / Math.max(P2a,14.696)) * (TR / 519.67) / 3600.0;
      vel = Q_cfs / (A_in2 / 144.0);

      if      (x >= x_crit)       { flowState = '🔴 Choked Gas (Sonic)';  warns.push({ cls:'warn-red',   txt:`⚠️ Sonic flow: x=${(x*100).toFixed(1)}% ≥ Fk·xT=${(x_crit*100).toFixed(1)}%. Flow will NOT increase with higher ΔP.` }); }
      else if (x > x_crit * 0.8)  { flowState = `🟡 Near-Critical Gas`;   warns.push({ cls:'warn-amber', txt:`⚠ Near sonic: x/x_crit=${(x_ratio*100).toFixed(0)}%. Significant noise likely.` }); }
      else                         { flowState = '🟢 Normal Gas Flow'; }
      if (vel > 100) warns.push({ cls:'warn-amber', txt:`⚠ Inlet velocity ${vel.toFixed(0)} ft/s > 100 ft/s. Consider larger pipe.` });

      noiseDb = Math.round(62 + 10*Math.log10(Math.max(Cv,1)) + 18*x_lim + 5*Math.log10(Math.max(P1a/14.7,1.1)));

    } else {
      // STEAM — ISA S75.01
      const W          = Qc;
      const x_s        = dP / Math.max(P1a, 0.0001);
      const x_crit_s   = 0.42;
      dPmax            = x_crit_s * P1a;
      x_ratio          = x_s / x_crit_s;
      const dPeff_s    = Math.min(dP, dPmax);
      const isSup      = steamFluid === 'Superheated Steam';
      const isWet      = steamFluid === 'Wet Steam (90%)';

      if (isSup) {
        const Tsat_F = getTsatF(P1a);
        const Fs     = 1.0 + 0.00065 * Math.max(T_F - Tsat_F, 0);
        Cv = W * Fs / (2.1 * Math.sqrt(Math.max(dPeff_s * (P1a + P2a), 0.0001)));
      } else if (isWet) {
        Cv = W / (0.90 * 2.1 * Math.sqrt(Math.max(dPeff_s * (P1a + P2a), 0.0001)));
      } else {
        Cv = W / (2.1 * Math.sqrt(Math.max(dPeff_s * (P1a + P2a), 0.0001)));
      }

    // Steam specific volume: NIST table for sat, superheat T-ratio correction
      const vg_sat     = getVgSteam(Math.max(P2a, 14.696));
      const Tsat_out   = getTsatF(Math.max(P2a, 14.696));
      const T_act_R    = isSup ? Math.max(T_F, Tsat_out) + 459.67 : Tsat_out + 459.67;
      const T_sat_R    = Tsat_out + 459.67;
      const v_spec     = vg_sat * (T_act_R / T_sat_R);
      vel = W * v_spec / (3600.0 * A_in2 / 144.0);

      flowState = x_ratio >= 1 ? '🔴 Choked Steam' : '🟢 Steam Flow OK';
      if (x_ratio >= 1) warns.push({ cls:'warn-red', txt:`⚠️ Choked steam: ΔP/P₁=${(x_s*100).toFixed(1)}% > 42%. Verify flash piping downstream.` });
      noiseDb = Math.round(65 + 10*Math.log10(Math.max(Cv,1)) + 15*(x_ratio>1?1:x_ratio));
    }

    const Kv = Cv / 1.1561;

    // ── VELOCITY DISPLAY (convert to metric if needed) ────────────────────────
    const vel_disp = m ? vel * 0.3048 : vel;
    const velLim   = isL ? (m ? 5 : 15) : (m ? 30 : 100);
    const velOk    = vel_disp < velLim;
    if (!velOk) warns.push({ cls:'warn-amber', txt:`ℹ Pipe velocity (${vel_disp.toFixed(1)} ${m?'m/s':'ft/s'}) exceeds recommended limit. Consider larger bore piping.` });

    // ── VALVE SIZE RECOMMENDATION ─────────────────────────────────────────────
    const stdCv = [
      {s:'1"',Cv_rated:11},{s:'1.5"',Cv_rated:25},{s:'2"',Cv_rated:55},
      {s:'3"',Cv_rated:120},{s:'4"',Cv_rated:240},{s:'6"',Cv_rated:550},
      {s:'8"',Cv_rated:1000},{s:'10"',Cv_rated:1800},{s:'12"',Cv_rated:3000},
      {s:'14"',Cv_rated:4500},{s:'16"',Cv_rated:6500},
    ];
    const ri0 = stdCv.findIndex(s => s.Cv_rated * 0.8 >= Cv);
    const ri   = ri0 === -1 ? stdCv.length-1 : Math.max(0, Math.min(ri0, stdCv.length-1));
    const sizes = {
      smaller: stdCv[Math.max(ri-1,0)],
      rec:     stdCv[ri],
      larger:  stdCv[Math.min(ri+1, stdCv.length-1)],
    };

    // ── OPEN % CALCULATION (moved from client) ────────────────────────────────
    function openPct_eq(CvReq, szCv) {
      const ratio = Math.min(CvReq / Math.max(szCv, 0.001), 1.5);
      if (charType === 'equal_pct') {
        const h = ratio <= 0 ? 0 : 1 + Math.log(Math.max(ratio, 1 / R_trim)) / Math.log(R_trim);
        return Math.max(0, Math.min(h * 100, 200));
      } else if (charType === 'quick_open') {
        return Math.min(ratio * ratio * 100, 200);
      } else {
        return Math.min(ratio * 100, 200); // linear and others
      }
    }
    const openPct_rec     = openPct_eq(Cv, sizes.rec.Cv_rated);
    const openPct_smaller = openPct_eq(Cv, sizes.smaller.Cv_rated);
    const openPct_larger  = openPct_eq(Cv, sizes.larger.Cv_rated);

    // ── >100% open warning (moved from client) ────────────────────────────────
    if (openPct_rec > 100) {
      warns.push({ cls:'warn-red', txt:`⚠️ Cv ${fmtN(Cv)} exceeds rated Cv of ${sizes.rec.s} (${sizes.rec.Cv_rated}). Select: ${sizes.larger.s}.` });
    }
// ── TURNDOWN / Q_MIN CHECK ───────────────────────────────────────────────
    let Cv_min = null, turndown = null, turndownOk = null;
    if (Q_min_raw && Q_min_raw > 0 && Q_min_raw < Q) {
      const Qc_min = Qc * (Q_min_raw / Q);
      if (isL)       Cv_min = (Qc_min * Math.sqrt(SG / Math.max(dPeff, 0.0001))) / (FR||1);
      else if (isG)  Cv_min = Qc_min * Math.sqrt(SG * TR * Z) / (1360.0 * P1a * (Y||0.9) * Math.sqrt(Math.max(dPeff||dP*0.5, 0.0001)));
      else           Cv_min = Qc_min / (2.1 * Math.sqrt(Math.max(dPeff||dP*0.5, 0.0001) * (P1a + P2a)));
      turndown   = Cv / Math.max(Cv_min, 0.0001);
      turndownOk = turndown <= R_trim;
      if (!turndownOk)
        warns.push({ cls:'warn-amber',
          txt:`⚠ Turndown ${turndown.toFixed(1)}:1 exceeds valve rangeability R=${R_trim}. Consider larger trim or split-range control.` });
      else if (Cv_min < sizes.rec.Cv_rated * 0.03)
        warns.push({ cls:'warn-amber',
          txt:`⚠ Cv at minimum flow (${fmtN(Cv_min)}) is < 3% of rated Cv — poor low-flow controllability. Consider characterised trim.` });
    }
      
    // ── DISPLAY LABELS (all formatting done server side) ──────────────────────
    const pu       = m ? 'bar' : 'psi';
    const dp2label = v => v == null ? '—' : (m ? (v / 14.5038).toFixed(3) : v.toFixed(2)) + ' ' + pu;

    return res.status(200).json({
      Cv:              fmtN(Cv),
      Kv:              fmtN(Kv),
      CvLabel:         fmtN(Cv) == null ? '—' : String(fmtN(Cv)),
      KvLabel:         fmtN(Kv) == null ? '—' : String(fmtN(Kv)),
      vel:             fmtN(vel_disp),
      velLabel:        (fmtN(vel_disp) ?? '—') + ' ' + (m ? 'm/s' : 'ft/s'),
      velOk,
      velLim,
      dP,   dPeff,   dPmax,
      dPLabel:         dp2label(dP),
      dPeffLabel:      dp2label(dPeff),
      dPmaxLabel:      isL || isS ? dp2label(dPmax) : 'x_crit=' + ((k / 1.4) * FL).toFixed(3),
      dpRatioPct:      ((dP / Math.max(P1a, 0.001)) * 100).toFixed(1),
      Y:               isG ? fmtN(Y) : null,
      Rev:             isL && Rev != null ? Rev : null,
      flowState,
      noiseDb,
      sizes,
      openPct_rec,
      openPct_smaller,
      openPct_larger,
      warns,
      // Display labels
      sgLabel:         SG.toFixed(3) + (isL ? ' (SG)' : isG ? ' g/mol' : ' (steam MW=18.02)'),
      tempLabel:       m ? ((T_F - 32) * 5 / 9).toFixed(1) + '°C' : T_F.toFixed(1) + '°F',
      flLabel:         FL.toFixed(3) + (isG ? ' (xT)' : ' (FL)'),
      pipeLabel:       m ? (D_in * 25.4).toFixed(1) + ' mm' : D_in.toFixed(3) + ' in',
       
Fp:              Fp < 1.0 ? +Fp.toFixed(4) : Fp_g < 1.0 ? +Fp_g.toFixed(4) : 1.0,
      FpLabel:         Fp < 1.0 ? Fp.toFixed(3) : Fp_g < 1.0 ? Fp_g.toFixed(3) : '1.000',
      Cv_min:          Cv_min!=null ? fmtN(Cv_min) : null,
      turndown:        turndown!=null ? +turndown.toFixed(1) : null,
      turndownOk,
       });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function fmtN(v) {
  if (v == null || isNaN(v) || !isFinite(v)) return null;
  return v < 1 ? Math.round(v*1000)/1000 : v < 10 ? Math.round(v*100)/100 : Math.round(v*10)/10;
}
function fmt2(v) {
  return v == null ? '—' : v.toFixed(2);
}

// ── End of Section 02: Control Valve ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B  ►  GAS EQUATION OF STATE (EOS)
// Route: /api/eos
// (Original: SECTION 04 of 21)
// ══════════════════════════════════════════════════════════════════════════════
// SECTION 04 of 21  ►  EQUATION OF STATE (EOS)
// Route: /api/eos
// Source: eos.js
// ══════════════════════════════════════════════════════════════════════════════

// ================================================================
// api/eos.js  —  Vercel Serverless Function
// 🔐 ALL CALCULATION LOGIC RUNS ON SERVER — NEVER EXPOSED TO BROWSER
// Place this file in your GitHub repo at: /api/eos.js
// ================================================================

function eos_handler(req, res) {
  // Allow CORS for your domain only
  const origin = req.headers.origin || '';
  const allowed = origin.endsWith('.vercel.app') || origin === 'https://multicalci.com';
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://multicalci.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { eos, T_K, P_Pa, Tc_K, Pc_Pa, omega, M, n } = req.body;

    if (!eos)          return res.status(400).json({ error: 'Missing EOS type' });
    if (!isFinite(T_K)  || T_K  <= 0) return res.status(400).json({ error: 'Temperature must be positive and finite.' });
    if (!isFinite(P_Pa) || P_Pa <= 0) return res.status(400).json({ error: 'Pressure must be positive and finite.' });
    if (!isFinite(Tc_K) || Tc_K <= 0) return res.status(400).json({ error: 'Critical temperature Tc must be positive.' });
    if (!isFinite(Pc_Pa)|| Pc_Pa<= 0) return res.status(400).json({ error: 'Critical pressure Pc must be positive.' });
    if (!isFinite(M)    || M    <  1)  return res.status(400).json({ error: 'Molar mass must be ≥ 1 g/mol.' });
    if (!isFinite(n)    || n    <= 0)  return res.status(400).json({ error: 'Number of moles must be positive.' });
    if (T_K < 10) return res.status(400).json({ error: `Temperature ${T_K.toFixed(2)} K is below 10 K. EOS calculations are not reliable at near-absolute-zero temperatures.` });

    const roots = runEOS(eos, T_K, P_Pa, Tc_K, Pc_Pa, omega);
    if (!roots.length) return res.status(400).json({ error: 'No real solution found — conditions may be below absolute minimum volume for this EOS. Try a lower pressure or higher temperature.' });

    const primary = roots.reduce((a, b) => a.Z > b.Z ? a : b);
    const Z       = primary.Z;

    if (!isFinite(Z) || Z <= 0) return res.status(400).json({ error: `EOS produced an invalid Z-factor (${Z}). Conditions may be in an unphysical region.` });
    if (Z > 20)                 return res.status(400).json({ error: `Z = ${Z.toFixed(3)} — unusually high. Check inputs.` });

    const phi      = primary.phi;
    const Vm_SI    = primary.Vm;
    const rho_mass = (1 / Vm_SI) * (M / 1000);
    const f_Pa     = phi * P_Pa;
    const Tr       = T_K / Tc_K;
    const Pr       = P_Pa / Pc_Pa;

    const warnings = buildWarnings(eos, T_K, P_Pa, Tc_K, Pc_Pa, omega, Z, Tr, Pr, roots);

    return res.status(200).json({
      success: true,
      data: {
        Z, phi, Vm_SI, rho_mass, f_Pa, Tr, Pr,
        roots: roots.map(r => ({ Z: r.Z, Vm: r.Vm, phi: r.phi, label: r.label })),
        rootCount: roots.length,
        eosParams: { A: primary.A, B: primary.B, a: primary.a, b: primary.b,
                     m: primary.m, kappa: primary.kappa, alpha: primary.alpha },
        warnings
      }
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server calculation error: ' + err.message });
  }
}

// ================================================================
// 🔐 CORE CALCULATION ENGINE — HIDDEN ON SERVER
// ================================================================

const R = 8.314462; // J/(mol·K)

function solveCubic(c2, c1, c0) {
  const shift = -c2 / 3;
  const p = c1 - c2 * c2 / 3;
  const q = 2 * c2 * c2 * c2 / 27 - c1 * c2 / 3 + c0;
  const D = q * q / 4 + p * p * p / 27;
  let roots = [];

  if (D > 1e-10) {
    const sqrtD = Math.sqrt(D);
    const u = Math.cbrt(-q / 2 + sqrtD);
    const v = Math.cbrt(-q / 2 - sqrtD);
    roots = [u + v + shift];
  } else if (D < -1e-10) {
    const r       = Math.sqrt(-p * p * p / 27);
    const cosArg  = Math.max(-1, Math.min(1, -q / (2 * r)));
    const theta   = Math.acos(cosArg);
    const m       = 2 * Math.cbrt(r);
    roots = [
      m * Math.cos(theta / 3) + shift,
      m * Math.cos((theta + 2 * Math.PI) / 3) + shift,
      m * Math.cos((theta + 4 * Math.PI) / 3) + shift,
    ];
  } else {
    const u = Math.cbrt(-q / 2);
    roots = [2 * u + shift, -u + shift];
  }

  return roots.filter(z => z > 1e-6 && isFinite(z)).sort((a, b) => a - b);
}

function solveIdeal(T_K, P_Pa) {
  const Vm = R * T_K / P_Pa;
  return [{ Z: 1, Vm, phi: 1, label: 'Z = 1 (Ideal)' }];
}

function solveVdW(T_K, P_Pa, Tc_K, Pc_Pa) {
  const a  = 27 * R * R * Tc_K * Tc_K / (64 * Pc_Pa);
  const b  = R * Tc_K / (8 * Pc_Pa);
  const c2 = -(b + R * T_K / P_Pa);
  const c1 = a / P_Pa;
  const c0 = -a * b / P_Pa;
  const Vms = solveCubic(c2, c1, c0);
  return Vms.map((Vm, i) => {
    const Z     = P_Pa * Vm / (R * T_K);
    const lnPhi = b / (Vm - b) - Math.log(Math.max(1e-300, P_Pa * (Vm - b) / (R * T_K))) - 2 * a / (R * T_K * Vm);
    return { Z, Vm, phi: Math.exp(lnPhi), label: ['Vapour Z', 'Middle Z', 'Liquid Z'][i] || 'Z', a, b };
  });
}

function solveSRK(T_K, P_Pa, Tc_K, Pc_Pa, omega) {
  const a0          = 0.42748 * R * R * Tc_K * Tc_K / Pc_Pa;
  const b           = 0.08664 * R * Tc_K / Pc_Pa;
  const m           = 0.480 + 1.574 * omega - 0.176 * omega * omega;
  const Tr          = T_K / Tc_K;
  const sqrtTr      = Math.sqrt(Math.max(0, Tr));
  const alpha_base  = 1 + m * (1 - sqrtTr);
  const alpha       = Math.max(1e-6, alpha_base * alpha_base);
  const a           = a0 * alpha;
  const A           = a * P_Pa / (R * R * T_K * T_K);
  const B           = b * P_Pa / (R * T_K);
  const c2 = -1;
  const c1 = A - B - B * B;
  const c0 = -A * B;
  const Zs = solveCubic(c2, c1, c0);
  return Zs.map((Z, i) => {
    const Vm    = Z * R * T_K / P_Pa;
    const lnPhi = (Z - 1) - Math.log(Math.max(1e-300, Z - B)) - (A / B) * Math.log(Math.max(1e-300, 1 + B / Z));
    return { Z, Vm, phi: Math.exp(lnPhi), label: ['Vapour Z', 'Middle Z', 'Liquid Z'][i] || 'Z', A, B, a, b, m, alpha };
  });
}

function solvePR(T_K, P_Pa, Tc_K, Pc_Pa, omega) {
  const a0          = 0.45724 * R * R * Tc_K * Tc_K / Pc_Pa;
  const b           = 0.07780 * R * Tc_K / Pc_Pa;
  const kappa       = 0.37464 + 1.54226 * omega - 0.26992 * omega * omega;
  const Tr          = T_K / Tc_K;
  const alpha_base  = 1 + kappa * (1 - Math.sqrt(Math.max(0, Tr)));
  const alpha       = Math.max(1e-6, alpha_base * alpha_base);
  const a           = a0 * alpha;
  const A           = a * P_Pa / (R * R * T_K * T_K);
  const B           = b * P_Pa / (R * T_K);
  const c2 = -(1 - B);
  const c1 = A - 3 * B * B - 2 * B;
  const c0 = -(A * B - B * B - B * B * B);
  const Zs = solveCubic(c2, c1, c0);
  return Zs.map((Z, i) => {
    const Vm     = Z * R * T_K / P_Pa;
    const sq2    = Math.SQRT2;
    const denom1 = Math.max(1e-300, Z + (1 + sq2) * B);
    const denom2 = Math.max(1e-300, Z + (1 - sq2) * B);
    const lnPhi  = (Z - 1) - Math.log(Math.max(1e-300, Z - B)) - A / (2 * sq2 * B) * Math.log(denom1 / denom2);
    return { Z, Vm, phi: Math.exp(lnPhi), label: ['Vapour Z', 'Middle Z', 'Liquid Z'][i] || 'Z', A, B, a, b, kappa, alpha };
  });
}

function runEOS(eos, T_K, P_Pa, Tc_K, Pc_Pa, omega) {
  switch (eos) {
    case 'ideal': return solveIdeal(T_K, P_Pa);
    case 'vdw':   return solveVdW(T_K, P_Pa, Tc_K, Pc_Pa);
    case 'srk':   return solveSRK(T_K, P_Pa, Tc_K, Pc_Pa, omega);
    case 'pr':    return solvePR(T_K, P_Pa, Tc_K, Pc_Pa, omega);
    default: return [];
  }
}

function buildWarnings(eos, T_K, P_Pa, Tc_K, Pc_Pa, omega, Z, Tr, Pr, roots) {
  const warnings = [];
  const POLAR_GASES_SET  = new Set(['H2O','MeOH','EtOH','iPrOH','nPrOH','nBuOH','iBuOH','nPenOH','EG','HF','FormAcid','AcAcid','PropAcid','NH3','HCN']);
  const QUANTUM_GASES    = new Set(['H2','He']);
  const ASSOC_GASES      = new Set(['AcAcid','FormAcid','PropAcid','HF']);

  if (Tr < 0.5)            warnings.push({ type: 'subcritical', msg: `Deep subcritical region (Tr = ${Tr.toFixed(3)}): Operating well below Tc. Liquid-phase properties may be unreliable.` });
  if (Math.abs(Tr-1)<0.05 && Math.abs(Pr-1)<0.05)
                           warnings.push({ type: 'critical', msg: `Near-critical region (Tr ≈ ${Tr.toFixed(3)}, Pr ≈ ${Pr.toFixed(3)}): EOS accuracy is reduced very close to the critical point.` });
  if (Pr > 10)             warnings.push({ type: 'highP', msg: `Very high reduced pressure (Pr = ${Pr.toFixed(2)}): Cubic EOS accuracy degrades at Pr > 10.` });
  else if (Pr > 5)         warnings.push({ type: 'highP', msg: `High reduced pressure (Pr = ${Pr.toFixed(2)}): Validate results at Pr > 5.` });
  if (eos === 'ideal' && Pr > 0.1) warnings.push({ type: 'ideal', msg: `Ideal gas law: only accurate at Pr < 0.1. At Pr = ${Pr.toFixed(3)}, switch to PR or SRK.` });
  if (eos === 'vdw')       warnings.push({ type: 'vdw', msg: 'van der Waals EOS is historical/qualitative (1873). Use PR or SRK for engineering work.' });
  if (roots.length === 3)  warnings.push({ type: 'twophase', msg: `Three real roots found (Tr=${Tr.toFixed(3)}, Pr=${Pr.toFixed(3)}) — possible two-phase region. Largest Z = vapour, smallest Z = liquid.` });
  if (Z > 2.0 && eos !== 'ideal') warnings.push({ type: 'highZ', msg: `Z = ${Z.toFixed(4)} is above typical range. Verify conditions.` });
  if (Z < 0.2 && Z > 0 && eos !== 'ideal') warnings.push({ type: 'lowZ', msg: `Very low Z-factor (Z = ${Z.toFixed(4)}) — may indicate liquid-like conditions.` });

  return warnings;
}

// ── End of Section 04: Equation of State (EOS) ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C  ►  ORIFICE FLOW CALCULATOR
// Route: /api/orifice-flow
// (Original: SECTION 07 of 21)
// ══════════════════════════════════════════════════════════════════════════════
// SECTION 07 of 21  ►  ORIFICE FLOW
// Route: /api/orifice-flow
// Source: orifice-flow.js
// ══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
//  /api/calculate.js  —  Vercel Serverless Function
//  multicalci.com — ISO 5167 / AGA3 Orifice Flow Calculator
//
//  ALL calculation logic lives here:
//    • ISO 5167-2:2022 Reader-Harris/Gallagher Cd equation
//    • IAPWS-IF97 steam density (Region 1 + Region 2, full 43-term)
//    • Pitzer Z correlation, Sutherland viscosity
//    • Expansibility factor Y (orifice + nozzle/venturi)
//    • Pressure recovery / permanent pressure loss
//    • Uncertainty estimation (ISO GUM)
//    • Iterative flow / ΔP / bore-size solvers (Newton-Raphson)
//    • All unit conversions (DP, flow, dimensions) → SI internally
//
//  Client only sends raw form values + unit labels.
//  Client only receives final results + warnings JSON.
// ═══════════════════════════════════════════════════════════════════════

// ── REFERENCE CONDITIONS ──────────────────────────────────────────────
const REF_COND = {
  normal:   { T_K: 273.15, P_Pa: 101325 },   // 0°C, 1 atm
  standard: { T_K: 288.15, P_Pa: 101325 },   // 15°C, 1 atm
};

// ── UNIT CONVERSIONS ──────────────────────────────────────────────────
function dpToPa(val, unit) {
  const map = {
    mmH2O: 9.80665, inH2O: 249.089, Pa: 1, kPa: 1000,
    mbar: 100, bar: 1e5, psi: 6894.757, kgcm2: 98066.5,
  };
  return val * (map[unit] ?? 1);
}

function dimToMm(val, unit) {
  const map = { mm: 1, cm: 10, m: 1000, in: 25.4 };
  return val * (map[unit] ?? 1);
}

function flowToKgs(val, unit, rho_op, rho_n, rho_s) {
  switch (unit) {
    case 'kghr':   return val / 3600;
    case 'kgs':    return val;
    case 'tonhr':  return val * 1000 / 3600;
    case 'm3hr':   return (val * rho_op) / 3600;
    case 'Nm3hr':  return (val * rho_n)  / 3600;
    case 'Nm3day': return (val * rho_n)  / 86400;
    case 'Sm3hr':  return (val * rho_s)  / 3600;
    default:       return val / 3600;
  }
}

// ── ISO 5167-2:2022 Reader-Harris/Gallagher Cd ────────────────────────
// Clause 5.3.2.1, valid: D 50–1000 mm, β 0.1–0.75, Re_D ≥ 5000
function computeCd_ISO(Re, beta, tapType, D_mm) {
  if (!Re || Re < 100) Re = 1e6;
  const b  = beta;
  const b4 = Math.pow(b, 4);
  const A  = Math.pow(19000 * b / Re, 0.8);

  // Fixed Cd for nozzles/venturis
  const FIXED = { nozzle_isa: 0.9900, venturi_tube: 0.9850, venturi_nozzle: 0.9650 };
  if (FIXED[tapType] !== undefined) return FIXED[tapType];

  // Base RHG
  let Cd = 0.5961 + 0.0261*b*b - 0.216*Math.pow(b,8)
    + 0.000521 * Math.pow(1e6*b/Re, 0.7)
    + (0.0188 + 0.0063*A) * Math.pow(b, 3.5) * Math.pow(1e6/Re, 0.3);

  // Tap corrections (L1, L2)
  let L1 = 0, L2 = 0;
  if (tapType === 'sharp_flange') {
    L1 = 25.4 / (D_mm || 100);
    L2 = L1;
} else if (tapType === 'd_d2_tap') {
    L1 = 1.0; L2 = 0.47;
} else {
    L1 = 0; L2 = 0; // corner tap and sharp_corner
}

  const M2 = 2 * L2 / (1 - b);
  Cd += (0.0390 - 0.0337 * Math.pow(b,7)) * L1 * b4 / (1 - 4*b4);
  Cd -= 0.0116 * M2 * Math.pow(b, 1.3) * Math.pow(1 - 0.23*Math.pow(b, 5.5), -1) * (1 - 0.14*A);

  // Small pipe correction
  if ((D_mm || 100) < 71.12) {
    Cd += 0.011 * (0.75 - b) * (2.8 - (D_mm||100) / 25.4);
  }

  return Math.max(0.5, Math.min(1.0, Cd));
}

function getCd(Re, beta, tapType, D_mm, customCd) {
  if (tapType === 'custom_cd') {
    const v = parseFloat(customCd);
    return (!isNaN(v) && v >= 0.50 && v <= 0.95) ? v : 0.611;
  }
  return computeCd_ISO(Re, beta, tapType, D_mm);
}

// ── EXPANSIBILITY FACTOR Y (ISO 5167) ─────────────────────────────────
function computeY(beta, dp_Pa, P_Pa, k, tapType) {
  if (dp_Pa <= 0 || P_Pa <= 0) return 1;
  const tau = dp_Pa / P_Pa;

  if (['nozzle_isa','venturi_tube','venturi_nozzle'].includes(tapType)) {
    const tau_r = 1 - tau;
    if (tau_r <= 0 || tau_r >= 1) return 0.667;
    const b4   = Math.pow(beta, 4);
    const tr2k = Math.pow(tau_r, 2/k);
    const trk1 = Math.pow(tau_r, (k-1)/k);
    const num  = k * tr2k * (1 - b4);
    const den  = (k-1) * (1-trk1) * (1 - b4*tr2k);
    return (den > 0 && num > 0) ? Math.max(0.5, Math.min(1.0, Math.sqrt(num/den))) : 1;
  }

  // Orifice ISO 5167-2 §5.3.3
  const coefA = tapType === 'd_d2_tap' ? 0.40 : 0.41;
  const coefB = tapType === 'd_d2_tap' ? 0.33 : 0.35;
  return Math.max(0.50, Math.min(1.0, 1 - (coefA + coefB * Math.pow(beta, 4)) * tau / k));
}

// ── PERMANENT PRESSURE LOSS ────────────────────────────────────────────
function computePressureRecovery(beta, Cd, tapType) {
  if (['nozzle_isa','venturi_nozzle'].includes(tapType)) {
    return (1 - Math.pow(beta, 1.9) * Cd * Cd) * 100;
  }
  if (tapType === 'venturi_tube') {
   return (1 - Math.pow(beta, 2) * Cd * Cd) * 100;
  }
  // Orifice ISO 5167-1 Eq.(22)
  const b2  = beta * beta;
  const b4  = b2 * b2;
  const num = Math.sqrt(1 - b4*(1-Cd*Cd)) - Cd*b2;
  const den = Math.sqrt(1 - b4*(1-Cd*Cd)) + Cd*b2;
  return den > 0 ? (num/den)*100 : 0;
}

// ── UNCERTAINTY ESTIMATE (ISO GUM / ISO 5167-1 §7) ───────────────────
function estimateUncertainty(beta, Re, tapType, isGas) {
  let u_Cd;
  if (tapType === 'nozzle_isa')                               u_Cd = 0.008;
  else if (['venturi_tube','venturi_nozzle'].includes(tapType)) u_Cd = 0.005;
  else if (Re > 1e5) u_Cd = 0.005;
  else if (Re > 1e4) u_Cd = 0.010;
  else               u_Cd = 0.020;

  const u_rho  = isGas ? 0.010 : 0.005;
  const u_dp   = 0.005;
  const u_beta = 0.001;
  const b4     = Math.pow(beta, 4);
  const u_beta_flow = 4 * u_beta * b4 / (1 - b4);
  const u_comb = Math.sqrt(u_Cd**2 + (0.5*u_dp)**2 + (0.5*u_rho)**2 + u_beta_flow**2);
  return (u_comb * 2 * 100).toFixed(2);
}

// ── STEAM VISCOSITY (IAPWS 2008 simplified) ───────────────────────────
function steamViscosity(T_K) {
  const T_bar = T_K / 647.096;
  const H = [1.67752, 2.20462, 0.6366564, -0.241605];
  let s = 0;
  for (let i = 0; i < 4; i++) s += H[i] / Math.pow(T_bar, i);
  return Math.max(8e-6, Math.min(3e-5, 1e-6 * 100 * Math.sqrt(T_bar) / s));
}

// ── SUTHERLAND VISCOSITY ──────────────────────────────────────────────
function sutherlandViscosity(f, T_K) {
  if (!f?.mu_ref) return f?.mu ?? 1.82e-5;
  const v = f.mu_ref * Math.pow(T_K / f.T_ref, 1.5) * (f.T_ref + f.S) / (T_K + f.S);
  return Math.max(1e-7, Math.min(1e-3, v));
}

// ── PITZER Z CORRELATION ──────────────────────────────────────────────
function pitzerZ(f, T_K, P_Pa) {
  if (!f?.Tc || !f?.Pc) return { Z: 1.0, outOfRange: false };
  const Tr = T_K / f.Tc;
  const Pr = (P_Pa / 1e6) / f.Pc;
  if (Tr < 0.5) return { Z: 1.0, outOfRange: true };
  const outOfRange = Pr > 0.9 || Tr < 0.7;
  const B0 = 0.083 - 0.422 / Math.pow(Tr, 1.6);
  const B1 = 0.139 - 0.172 / Math.pow(Tr, 4.2);
  const Z  = Math.max(0.5, Math.min(1.2, 1 + (B0 + (f.omega||0)*B1) * Pr / Tr));
  return { Z, outOfRange, Tr, Pr };
}

// ── IAPWS-IF97 STEAM DENSITY (full Region 1 + Region 2) ──────────────
function steamDensity(p_bar, t_c) {
  const P_MPa = p_bar * 0.1;
  const T     = t_c + 273.15;
  const R     = 461.526;

  function T_sat(p_MPa) {
    if (p_MPa <= 0) return 373.15;
    const n1=-17.073846940092, n2=12020.82470247, n3=-3232555.0322333,
          n4=14.91510861353,   n5=-4823.2657361591, n6=405113.40542057,
          n7=-0.23855557567849, n8=650.17534844798;
    const vv = p_MPa + n7 / (p_MPa - n8);
    const AA = vv*vv + 1167.0521452767*vv - 724213.16703206;
    const BB = n1*vv*vv + n2*vv + n3;
    const CC = n4*vv*vv + n5*vv + n6;
    const disc = BB*BB - 4*AA*CC;
    if (disc < 0) return 647.1;
    return 2*CC / (-BB + Math.sqrt(disc));
  }

  const T_s = T_sat(P_MPa);

  // Region 1 — liquid
  if (T < T_s - 0.5 || T <= 273.15) {
    const tau1 = 1386 / T;
    const pi1  = P_MPa / 16.53;
    const I1 = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,3,3,4,4,4,5,8,8,21,23,29,30,31,32];
    const J1 = [-2,-1,0,1,2,3,4,5,-9,-7,-1,0,-3,0,-3,1,-8,-6,-4,1,-3,-2,-4,-9,-7,-1,4,5];
    const n1c = [
      0.14632971213167,-0.84548187169114,-3.7563603672040,3.3855169168385,
      -0.95791963387872,0.15772038513228,-0.016616417199501,0.00081214629983568,
      -0.28319080123804e-3,-0.60706301565874e-3,-0.018990068218419,-0.032529748770505,
      -0.21841717175414e-1,-0.52838357969930e-4,-0.47184321073267e-3,
      -0.30001780793026e-3,0.47661393906987e-4,-0.44141845330846e-5,
      -0.72694996297594e-15,-0.31679644845054e-4,-0.28270797985312e-5,
      -0.85205128120103e-9,-0.22425281908000e-5,-0.65171222895601e-6,
      -0.14341729937924e-12,-0.40516996860117e-6,-0.12734301741641e-8,
      -0.17424871230634e-9
    ];
    let dphi_dpi = 0;
    for (let i = 0; i < n1c.length; i++) {
      dphi_dpi += -n1c[i] * (I1[i]||0) * Math.pow(7.1-pi1,(I1[i]||0)-1) * Math.pow(tau1-1.222, J1[i]||0);
    }
    const v_m3kg = (R * T / (P_MPa*1e6)) * pi1 * dphi_dpi;
    if (v_m3kg > 0) return { rho: 1/v_m3kg, isSat: false, T_sat_C: T_s-273.15, mu: steamViscosity(T) };
    const rho_liq = 1000*(1-3.17e-6*(T-277.13)**2 - 1.3e-8*(T-277.13)**3);
    return { rho: Math.max(900,rho_liq), isSat: false, T_sat_C: T_s-273.15, mu: steamViscosity(T) };
  }

  const isSat = Math.abs(T - T_s) < 2.0;

  // Region 2 — superheated steam
  const tau2 = 540 / T;
  const pi2  = P_MPa;
  const Ir = [1,1,1,1,1,2,2,2,2,2,3,3,3,3,3,4,4,4,5,6,6,6,7,7,7,8,8,9,10,10,10,16,16,18,20,20,20,21,22,23,24,24,24];
  const Jr = [0,1,2,3,6,1,2,4,7,36,0,1,3,6,35,1,2,3,7,3,16,35,0,11,25,8,36,13,4,10,14,29,50,57,20,35,48,21,53,39,26,40,58];
  const nr = [
    -1.7731742473213e-3,-1.7834862292358e-2,-4.5996013696365e-2,-5.7581259083432e-2,
    -5.0325278727930e-2,-3.3032641670203e-5,-1.8948987516315e-4,-3.9392777243355e-3,
    -4.3797295650573e-2,-2.6674547914087e-5,2.0481737692310e-7,4.3870667284435e-7,
    -3.2277677238570e-5,-1.5033924542148e-2,-4.0668253562950e-2,-7.8847309559367e-10,
    1.2790717852285e-8,4.8225372718507e-7,2.2922076337661e-6,-1.6714766451061e-11,
    -2.1171472321355e-3,-2.3895741934104e-2,-5.9059564324270e-18,-1.2621808899101e-6,
    -3.8946842435739e-2,1.1256211360459e-11,-8.2311340897998e-2,1.9809712802088e-8,
    1.0406965210174e-19,-1.0234747095929e-13,-1.0018179379511e-9,-8.0882908646985e-11,
    1.0693031879409e-1,-3.3662250574171e-1,8.9185845355421e-25,3.0629316876232e-13,
    -4.2002467698208e-6,-5.9056029685639e-26,3.7826947613457e-6,-1.2768608934681e-15,
    7.3087610595061e-29,5.5414715350778e-17,-9.4369707241210e-7
  ];
  let phiR_pi = 0;
  for (let i = 0; i < nr.length; i++) {
    if (Ir[i]===0) continue;
    phiR_pi += nr[i] * Ir[i] * Math.pow(pi2, Ir[i]-1) * Math.pow(tau2-0.5, Jr[i]);
  }
  const v = (R * T / (P_MPa*1e6)) * pi2 * (1/pi2 + phiR_pi);
  return { rho: v > 0 ? 1/v : 1.0, isSat, T_sat_C: T_s-273.15, mu: steamViscosity(T) };
}

// ── INPUT VALIDATION ──────────────────────────────────────────────────
function validateInputs({ D_m, d_m, P_Pa, rho, mu, beta, Z }) {
  const errs = [];
  if (d_m >= D_m)           errs.push('Bore d must be smaller than pipe ID D');
  if (rho <= 0)             errs.push('Density must be > 0');
  if (mu  <= 0)             errs.push('Viscosity must be > 0 Pa·s');
  if (P_Pa <= 0)         errs.push('Pressure must be > 0 — ensure ABSOLUTE pressure is entered (not gauge)');
else if (P_Pa < 10000) errs.push(`Pressure = ${(P_Pa/1e5).toFixed(4)} bara — very low; confirm ABSOLUTE pressure (bara/psia), not gauge`);
  if (beta <= 0 || beta>=1) errs.push('Beta ratio β must be between 0 and 1 (exclusive)');
  const D_mm = D_m * 1000;
  if (D_mm < 50)   errs.push(`Pipe ID = ${D_mm.toFixed(1)} mm < ISO 5167 minimum 50 mm — small-pipe correction applied`);
  if (D_mm > 1000) errs.push(`Pipe ID = ${D_mm.toFixed(1)} mm > ISO 5167 maximum 1000 mm — Cd correlation outside validated range`);
  if (Z !== undefined && (Z <= 0 || Z > 3.0)) errs.push(`Z = ${Z} is physically impossible`);
  return errs;
}

// ═════════════════════════════════════════════════════════════════════
//  FLUID DATABASE (gas properties at reference conditions)
// ═════════════════════════════════════════════════════════════════════
const FLUID_DB_orifice = {
  'Air':            {t:'g',sg:1.000,M:28.964,k:1.400,mu:1.82e-5,Z:1.000,Tc:132.5,Pc:3.77, omega:0.035,mu_ref:1.716e-5,T_ref:273.15,S:110.4},
  'Nitrogen (N₂)':  {t:'g',sg:0.967,M:28.014,k:1.400,mu:1.76e-5,Z:1.000,Tc:126.2,Pc:3.39, omega:0.037,mu_ref:1.663e-5,T_ref:273.15,S:107.0},
  'Oxygen (O₂)':    {t:'g',sg:1.105,M:32.000,k:1.395,mu:2.01e-5,Z:1.000,Tc:154.6,Pc:5.04, omega:0.025,mu_ref:1.919e-5,T_ref:273.15,S:138.9},
  'Hydrogen (H₂)':  {t:'g',sg:0.070,M:2.016, k:1.405,mu:8.90e-6,Z:1.000,Tc:33.2, Pc:1.30, omega:-0.216,mu_ref:8.411e-6,T_ref:273.15,S:96.7},
  'CO₂':            {t:'g',sg:1.519,M:44.010,k:1.289,mu:1.48e-5,Z:0.994,Tc:304.1,Pc:7.38, omega:0.239,mu_ref:1.370e-5,T_ref:273.15,S:222.0},
  'CO':             {t:'g',sg:0.967,M:28.010,k:1.400,mu:1.77e-5,Z:1.000,Tc:132.9,Pc:3.50, omega:0.048,mu_ref:1.657e-5,T_ref:273.15,S:118.0},
  'Methane (CH₄)':  {t:'g',sg:0.554,M:16.043,k:1.304,mu:1.10e-5,Z:0.998,Tc:190.6,Pc:4.60, omega:0.012,mu_ref:1.030e-5,T_ref:273.15,S:164.0},
  'Propane (C₃H₈)': {t:'g',sg:1.522,M:44.097,k:1.130,mu:8.20e-6,Z:0.981,Tc:369.8,Pc:4.25, omega:0.152,mu_ref:7.550e-6,T_ref:273.15,S:278.0},
  'Butane (C₄H₁₀)': {t:'g',sg:2.009,M:58.124,k:1.100,mu:7.40e-6,Z:0.960,Tc:425.1,Pc:3.80, omega:0.200,mu_ref:6.870e-6,T_ref:273.15,S:329.0},
  'Natural Gas':    {t:'g',sg:0.620,M:17.967,k:1.310,mu:1.10e-5,Z:0.990,Tc:203.3,Pc:4.64, omega:0.010,mu_ref:1.027e-5,T_ref:273.15,S:170.0},
  'Ammonia (NH₃)':  {t:'g',sg:0.588,M:17.031,k:1.310,mu:1.00e-5,Z:0.995,Tc:405.6,Pc:11.28,omega:0.250,mu_ref:9.270e-6,T_ref:273.15,S:503.0},
  'Chlorine':       {t:'g',sg:2.448,M:70.906,k:1.340,mu:1.33e-5,Z:0.990,Tc:417.2,Pc:7.71, omega:0.069,mu_ref:1.234e-5,T_ref:273.15,S:351.0},
  'Argon':          {t:'g',sg:1.380,M:39.948,k:1.667,mu:2.27e-5,Z:1.000,Tc:150.9,Pc:4.87, omega:0.001,mu_ref:2.125e-5,T_ref:273.15,S:142.0},
  'Helium':         {t:'g',sg:0.138,M:4.003, k:1.667,mu:1.99e-5,Z:1.000,Tc:5.2,  Pc:0.23, omega:-0.390,mu_ref:1.875e-5,T_ref:273.15,S:79.4},
  'SO₂':            {t:'g',sg:2.264,M:64.065,k:1.290,mu:1.25e-5,Z:0.990,Tc:430.8,Pc:7.88, omega:0.245,mu_ref:1.163e-5,T_ref:273.15,S:416.0},
  'H₂S':            {t:'g',sg:1.189,M:34.081,k:1.320,mu:1.22e-5,Z:0.990,Tc:373.2,Pc:8.94, omega:0.100,mu_ref:1.130e-5,T_ref:273.15,S:331.0},
  'Ethane (C₂H₆)':  {t:'g',sg:1.049,M:30.069,k:1.200,mu:9.10e-6,Z:0.988,Tc:305.3,Pc:4.87, omega:0.099,mu_ref:8.560e-6,T_ref:273.15,S:252.0},
  'Ethylene':       {t:'g',sg:0.968,M:28.054,k:1.240,mu:1.02e-5,Z:0.993,Tc:282.4,Pc:5.04, omega:0.089,mu_ref:9.450e-6,T_ref:273.15,S:225.0},
  'Acetylene':      {t:'g',sg:0.897,M:26.038,k:1.232,mu:1.03e-5,Z:0.990,Tc:308.3,Pc:6.14, omega:0.187,mu_ref:9.570e-6,T_ref:273.15,S:234.0},
  'Flue Gas':       {t:'g',sg:1.000,M:28.964,k:1.350,mu:1.90e-5,Z:1.000,Tc:132.5,Pc:3.77, omega:0.035,mu_ref:1.716e-5,T_ref:273.15,S:110.4},
// ── Liquids ── rho0=kg/m³ at T0°C, beta_T=thermal expansion coefficient /°C
  // ρ(T) = rho0 / (1 + beta_T*(T - T0))
  'Water':             {t:'l', rho0:998.2,  T0:20, beta_T:2.1e-4},
  'Seawater':          {t:'l', rho0:1025.0, T0:20, beta_T:2.0e-4},
  'Crude Oil (30API)': {t:'l', rho0:876.0,  T0:15, beta_T:7.0e-4},
  'Diesel / Gas Oil':  {t:'l', rho0:840.0,  T0:15, beta_T:7.0e-4},
  'Kerosene':          {t:'l', rho0:800.0,  T0:15, beta_T:8.0e-4},
  'Gasoline':          {t:'l', rho0:720.0,  T0:15, beta_T:9.5e-4},
  'Methanol':          {t:'l', rho0:791.0,  T0:20, beta_T:1.19e-3},
  'Ethanol':           {t:'l', rho0:789.0,  T0:20, beta_T:1.08e-3},
  'Toluene':           {t:'l', rho0:867.0,  T0:20, beta_T:1.07e-3},
  'Benzene':           {t:'l', rho0:879.0,  T0:20, beta_T:1.21e-3},
  'Acetone':           {t:'l', rho0:791.0,  T0:20, beta_T:1.46e-3},
  'Sulfuric Acid 98%': {t:'l', rho0:1836.0, T0:20, beta_T:5.5e-4},
  'HCl 32%':           {t:'l', rho0:1157.0, T0:20, beta_T:4.5e-4},
  'NaOH 50%':          {t:'l', rho0:1525.0, T0:20, beta_T:5.0e-4},
  'MEA':               {t:'l', rho0:1018.0, T0:20, beta_T:8.0e-4},
  'Glycerol':          {t:'l', rho0:1261.0, T0:20, beta_T:5.0e-4},
  'Ethylene Glycol':   {t:'l', rho0:1113.0, T0:20, beta_T:6.0e-4},
};

// ═════════════════════════════════════════════════════════════════════
//  MAIN CALCULATION ENGINE
// ═════════════════════════════════════════════════════════════════════
function getReMin(b) {
    if (b <= 0.44) return 5000; if (b <= 0.56) return 10000; if (b <= 0.65) return 30000; return 170000;
  }
function calculate(params) {
  const {
    mode,                // 'flow' | 'dp' | 'beta'
    cat,                 // 'gas' | 'liquid' | 'steam'
    tapType,
    customCd,
    P_bar,               // absolute pressure in bar
    T_c,                 // temperature in °C
    Z_input,             // user compressibility factor
    k,                   // isentropic exponent
    mu_input,            // viscosity Pa·s (may be auto-updated for steam/gas)
    sg,                  // specific gravity (gas: vs air; liquid: vs water)
    MW_input,            // molar mass g/mol
    fluidKey,            // key in FLUID_DB_orifice or null
    D_mm,                // pipe ID in mm
    d_mm,                // orifice bore in mm
    dp_Pa_in,            // differential pressure in Pa (mode='flow' or 'beta')
    flow_in,             // flow target value
    flow_unit,           // unit of flow_in
  } = params;

  const isSteam = cat === 'steam';
  const isLiq   = cat === 'liquid';
  const isGas   = !isSteam && !isLiq;

  const P_Pa = P_bar * 1e5;
  const T_K  = T_c + 273.15;
  const D    = D_mm / 1000;
  const A_pipe = Math.PI / 4 * D * D;

  // ── DENSITY & AUTO FLUID PROPS ──────────────────────────────────────
  let rho_op, mu, Z_used, mu_auto, Z_auto, steamSatWarning = false, steamSatT = null;

  if (isSteam) {
    const sres = steamDensity(P_bar, T_c);
    rho_op = sres.rho;
    steamSatWarning = sres.isSat;
    steamSatT = sres.T_sat_C;
    mu = sres.mu;
    mu_auto = mu;
    Z_used  = 1;
 } else if (isLiq) {
    // Temperature-corrected liquid density: ρ(T) = ρ₀ / (1 + β·(T − T₀))
    const f_liq = FLUID_DB_orifice[fluidKey] || null;
    if (f_liq?.t === 'l' && f_liq.rho0 && f_liq.beta_T !== undefined) {
      rho_op = f_liq.rho0 / (1 + f_liq.beta_T * (T_c - f_liq.T0));
      rho_op = Math.max(100, rho_op);
    } else {
      rho_op = sg * 1000; // fallback: SG already T-corrected by client
    }
    mu     = mu_input;
    Z_used = 1;
  } else {
    // Gas
    const f = FLUID_DB_orifice[fluidKey] || null;
    let MW_use;
    if (f?.t === 'g') {
      MW_use = f.M;
      mu = sutherlandViscosity(f, T_K);
      mu_auto = mu;
      const zr = pitzerZ(f, T_K, P_Pa);
      Z_used = zr.Z;
      Z_auto = zr;
    } else {
      MW_use = (MW_input > 1 && MW_input < 500) ? MW_input : sg * 28.964;
      mu     = mu_input;
      Z_used = Z_input || 1;
    }
    rho_op = (P_Pa * MW_use) / (Z_used * 8314.46 * T_K);
  }

  if (!rho_op || rho_op <= 0) rho_op = 1.2;

  // ── REFERENCE DENSITIES ─────────────────────────────────────────────
  const f_db  = FLUID_DB_orifice[fluidKey] || null;
  const MW_final = f_db?.t==='g' ? f_db.M : (MW_input>1&&MW_input<500 ? MW_input : sg*28.964);
  const rho_n = isGas ? (REF_COND.normal.P_Pa * MW_final)   / (8314.46 * REF_COND.normal.T_K)   : 0;
  const rho_s = isGas ? (REF_COND.standard.P_Pa * MW_final) / (8314.46 * REF_COND.standard.T_K) : 0;

  // ── GEOMETRY ─────────────────────────────────────────────────────────
  let d_cur_m = (mode === 'beta') ? D * 0.5 : d_mm / 1000;
  const A2    = Math.PI / 4 * d_cur_m * d_cur_m;
  let beta    = d_cur_m / D;
  const calcE = (b) => 1 / Math.sqrt(1 - Math.pow(b, 4));

  let mass_h  = 0, dp_Pa = 0, d_calc_mm = d_mm, Cd = 0, Re_pipe = 0, Y_out = 1;

  // ══════════ MODE: FLOW RATE ══════════════════════════════════════════
  if (mode === 'flow') {
    dp_Pa = dp_Pa_in;
    const Y = isLiq ? 1 : computeY(beta, dp_Pa, P_Pa, k, tapType);
    Y_out  = Y;

    let Re_est = 1e6;
    Cd = getCd(Re_est, beta, tapType, D_mm, customCd);
    const E = calcE(beta);

    for (let iter = 0; iter < 15; iter++) {
      const qm_s = Cd * E * Y * A2 * Math.sqrt(2 * rho_op * dp_Pa);
      const v_p  = qm_s / (rho_op * A_pipe);
      Re_est     = (rho_op * v_p * D) / Math.max(mu, 1e-10);
      const CdNew = getCd(Re_est, beta, tapType, D_mm, customCd);
      if (Math.abs(CdNew - Cd) < 1e-8) break;
      Cd = CdNew;
    }
    mass_h = Cd * calcE(beta) * Y * A2 * Math.sqrt(2 * rho_op * dp_Pa) * 3600;

  // ══════════ MODE: DIFF PRESSURE ══════════════════════════════════════
  } else if (mode === 'dp') {
    let mass_kg_s;
    if (isSteam || isLiq) {
      if      (flow_unit === 'kgs')   mass_kg_s = flow_in;
      else if (flow_unit === 'tonhr') mass_kg_s = flow_in * 1000 / 3600;
      else if (flow_unit === 'm3hr')  mass_kg_s = flow_in * rho_op / 3600;
      else                            mass_kg_s = flow_in / 3600;
    } else {
      mass_kg_s = flowToKgs(flow_in, flow_unit, rho_op, rho_n, rho_s);
    }
    mass_h = mass_kg_s * 3600;

    const E = calcE(beta);
    let Cd_est = getCd(1e6, beta, tapType, D_mm, customCd);
    dp_Pa = Math.pow(mass_kg_s / (Cd_est * E * A2), 2) / (2 * rho_op);

    for (let iter = 0; iter < 20; iter++) {
      const Y_est = isLiq ? 1 : computeY(beta, dp_Pa, P_Pa, k, tapType);
      const v_p   = mass_kg_s / (rho_op * A_pipe);
      const Re    = (rho_op * v_p * D) / Math.max(mu, 1e-10);
      Cd = getCd(Re, beta, tapType, D_mm, customCd);
      const dp_new = Math.pow(mass_kg_s / (Cd * E * Y_est * A2), 2) / (2 * rho_op);
      if (Math.abs(dp_new - dp_Pa) < 0.001) { dp_Pa = dp_new; break; }
      dp_Pa = dp_new;
    }
    Y_out = isLiq ? 1 : computeY(beta, dp_Pa, P_Pa, k, tapType);

  // ══════════ MODE: BORE SIZE (Newton-Raphson) ══════════════════════════
  } else {
    dp_Pa = dp_Pa_in;
    let mass_kg_s;
    if (isSteam || isLiq) {
      if      (flow_unit === 'kgs')   mass_kg_s = flow_in;
      else if (flow_unit === 'tonhr') mass_kg_s = flow_in * 1000 / 3600;
      else if (flow_unit === 'm3hr')  mass_kg_s = flow_in * rho_op / 3600;
      else                            mass_kg_s = flow_in / 3600;
    } else {
      mass_kg_s = flowToKgs(flow_in, flow_unit, rho_op, rho_n, rho_s);
    }
    mass_h = mass_kg_s * 3600;

    let d_iter = D * 0.5;
    const tol = 1e-9, maxIt = 60, h = 1e-7;
    const fn = (d) => {
      const b2  = Math.min(Math.max(d/D, 0.05), 0.94);
      const b4  = Math.pow(b2, 4);
      const E2  = 1 / Math.sqrt(1 - b4);
      const A2i = Math.PI / 4 * d * d;
      const Y2  = isLiq ? 1 : computeY(b2, dp_Pa, P_Pa, k, tapType);
      const Re_d = mass_kg_s * D / (A_pipe * Math.max(mu, 1e-10));
      const Cd2  = getCd(Re_d, b2, tapType, D_mm, customCd);
      return Cd2 * E2 * Y2 * A2i * Math.sqrt(2 * rho_op * dp_Pa) - mass_kg_s;
    };
    for (let i = 0; i < maxIt; i++) {
      const fv   = fn(d_iter);
      const dfv  = (fn(d_iter + h) - fv) / h;
      if (Math.abs(dfv) < 1e-30) break;
      const d_new = Math.min(Math.max(d_iter - fv/dfv, D*0.05), D*0.94);
      if (Math.abs(d_new - d_iter) < tol || Math.abs(fv) < tol * mass_kg_s) break;
      d_iter = d_new;
    }

    d_calc_mm = d_iter * 1000;
    beta      = d_iter / D;
    d_cur_m   = d_iter;
    const v_p_b  = mass_kg_s / (rho_op * A_pipe);
    const Re_b   = (rho_op * v_p_b * D) / Math.max(mu, 1e-10);
    Cd    = getCd(Re_b, beta, tapType, D_mm, customCd);
    Y_out = null; // bore mode — Y not single-valued
  }

  // ── DERIVED QUANTITIES ──────────────────────────────────────────────
  const d_final   = (mode === 'beta') ? d_calc_mm / 1000 : d_cur_m;
  const A2_final  = Math.PI / 4 * d_final * d_final;
  beta = d_final / D;

  const v_orifice = (mass_h > 0 && rho_op > 0 && A2_final > 0) ? mass_h / (3600 * rho_op * A2_final) : 0;
  const v_pipe    = (mass_h > 0 && rho_op > 0 && A_pipe > 0)   ? mass_h / (3600 * rho_op * A_pipe)   : 0;
  Re_pipe = (rho_op * v_pipe * D) / Math.max(mu, 1e-10);
  if (Re_pipe > 0) Cd = getCd(Re_pipe, beta, tapType, D_mm, customCd);

  // ── PRESSURE LOSS ────────────────────────────────────────────────────
  const perm_pct = computePressureRecovery(beta, Cd, tapType);

  let dp_Pa_ref = dp_Pa;
  if (mode === 'beta' || dp_Pa_ref <= 0) {
    const A2_f = Math.PI/4 * d_final**2;
    const E_f  = 1/Math.sqrt(1 - beta**4);
    const Y_f  = isLiq ? 1 : computeY(beta, 1000, P_Pa, k, tapType);
    const qm_s = mass_h / 3600;
    if (qm_s > 0 && Cd > 0 && E_f > 0 && A2_f > 0 && Y_f > 0 && rho_op > 0) {
      dp_Pa_ref = Math.pow(qm_s / (Cd * E_f * Y_f * A2_f), 2) / (2 * rho_op);
    }
  }
  const perm_Pa = (perm_pct / 100) * dp_Pa_ref;

  // ── VOLUMETRIC / REFERENCE FLOWS ─────────────────────────────────────
  const qv_act_m3h = rho_op > 0 ? mass_h / rho_op : 0;
  const nm3hr      = isGas && rho_n > 0 ? mass_h / rho_n : null;
  const sm3hr      = isGas && rho_s > 0 ? mass_h / rho_s : null;

  // ── UNCERTAINTY ──────────────────────────────────────────────────────
  const u_pct = estimateUncertainty(beta, Re_pipe, tapType, isGas);

  // ── WARNINGS ─────────────────────────────────────────────────────────
  const warns = [], infos = [];
  const valErrs = validateInputs({ D_m: D, d_m: d_final, P_Pa, rho: rho_op, mu, beta, Z: Z_used });
  valErrs.forEach(e => warns.push(e));

  const isNozzleType = ['nozzle_isa','venturi_nozzle'].includes(tapType);
  const betaMax = isNozzleType ? 0.80 : 0.75;
  if (beta < 0.20 || beta > betaMax) warns.push(`β=${beta.toFixed(4)} outside ISO 5167 range 0.20–${betaMax}`);
  if (beta > 0.70 && beta <= 0.75)   infos.push(`β=${beta.toFixed(4)} in high-beta range — verify corner tap validity`);
  if (!isLiq && dp_Pa > 0 && (dp_Pa/P_Pa) > 0.25) warns.push('⚡ ΔP/P > 0.25: Exceeds ISO 5167-2 expansibility factor validity limit');
  if (v_orifice > 100) warns.push(`Orifice velocity ${v_orifice.toFixed(1)} m/s very high — verify sizing`);
  if (isLiq && T_c > 80 && T_c < 120 && P_bar < 2.0) warns.push('⚠ Liquid near boiling point at low pressure — flashing possible');
  if (P_bar < 0.5) warns.push('⚠ Upstream pressure < 0.5 bara — verify ABSOLUTE pressure (bara/psia), not gauge');
  if (isSteam && steamSatWarning) infos.push(`Temperature near saturation (T_sat ≈ ${steamSatT?.toFixed(1)}°C) — verify steam quality`);
  if (isSteam) infos.push('⚠ Wet steam (quality x<1) not modelled — ensure steam is dry/superheated at operating conditions');
  if (Re_pipe > 5000 && beta >= 0.20 && beta <= 0.75)
    infos.push('ISO 5167 requires ≥10–30 D upstream + ≥5 D downstream straight run');
    const Re_min = getReMin(beta);
  if (Re_pipe > 0 && Re_pipe < Re_min) warns.push(`Re=${Re_pipe.toFixed(0)} below ISO 5167 minimum (${Re_min} for β=${beta.toFixed(3)})`);
  if (Z_auto?.outOfRange)
    infos.push(`Pitzer Z validity: Tr=${Z_auto.Tr?.toFixed(2)}, Pr=${Z_auto.Pr?.toFixed(2)} — outside recommended range (Tr>0.7, Pr<0.9)`);

  // ── RESPONSE ──────────────────────────────────────────────────────────
  return {
    // Primary result
    mode,
    mass_kghr:      mass_h,
    mass_kgs:       mass_h / 3600,
    mass_tonhr:     mass_h / 1000,
    qv_act_m3hr:    qv_act_m3h,
    qv_act_m3s:     qv_act_m3h / 3600,
    nm3hr,
    nm3day:         nm3hr != null ? nm3hr * 24 : null,
    sm3hr,
    // DP (all units)
    dp_Pa,
    dp_mmH2O:       dp_Pa / 9.80665,
    dp_inH2O:       dp_Pa / 249.089,
    dp_kPa:         dp_Pa / 1000,
    dp_mbar:        dp_Pa / 100,
    dp_bar:         dp_Pa / 1e5,
    dp_psi:         dp_Pa / 6894.757,
    dp_kgcm2:       dp_Pa / 98066.5,
    // Bore
    bore_mm:        d_calc_mm,
    bore_in:        d_calc_mm / 25.4,
    beta,
    // Fluid
    rho_op,
    mu_used:        mu,
    mu_auto:        mu_auto ?? null,
    Z_used,
    Z_auto:         Z_auto?.Z ?? null,
    Z_autoOutOfRange: Z_auto?.outOfRange ?? false,
    steamSatWarning,
    steamSatT,
    // Meter
    Cd,
    Y:              Y_out,
    E:              calcE(beta),
    Re_pipe,
    // Pressure loss
    perm_pct,
    perm_Pa,
    perm_mmH2O:     perm_Pa / 9.80665,
    perm_mbar:      perm_Pa / 100,
    perm_bar:       perm_Pa / 1e5,
    perm_kPa:       perm_Pa / 1000,
    perm_psi:       perm_Pa / 6894.757,
    // Uncertainty
    uncertainty_pct: u_pct,
    dp_P_ratio:      P_Pa > 0 ? dp_Pa / P_Pa : 0,
    // Velocities
    v_orifice,
    v_pipe,
    // Warnings
    warnings: warns,
    infos,
  };
}

// ═════════════════════════════════════════════════════════════════════
//  VERCEL HANDLER  (CommonJS — works with all Vercel Node runtimes)
// ═════════════════════════════════════════════════════════════════════

// Helper: set all CORS headers on a response object
function setCORS_orifice(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

// Helper: read raw POST body as text, then JSON-parse
function readBody(req) {
  return new Promise((resolve, reject) => {
    // Vercel may pre-parse body when Content-Type is application/json
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end',  () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch(e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function orificeFlow_handler(req, res) {
  setCORS_orifice(res);

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const body = await readBody(req);
// ── DENSITY PREVIEW (lightweight — called on every T/P/fluid change) ──
    if (body.action === 'density-preview') {
      const isMetric = (body.unitSys || 'metric') === 'metric';
      let P_bar = parseFloat(body.P) || 10;
      let T_c   = parseFloat(body.T) || 20;
      if (!isMetric) { P_bar = P_bar * 0.0689476; T_c = (T_c - 32) * 5/9; }
      const T_K = T_c + 273.15;
      const P_Pa = P_bar * 1e5;
      const cat      = body.cat      || 'gas';
      const fluidKey = body.fluidKey || null;
      const sg_input = parseFloat(body.sg) || 1.0;

      let rho = null, mu_out = null, Z_out = null;

      if (cat === 'steam') {
        const sres = steamDensity(P_bar, T_c);
        rho    = sres.rho;
        mu_out = sres.mu;
      } else if (cat === 'liquid') {
        const f = FLUID_DB_orifice[fluidKey] || null;
        if (f?.t === 'l' && f.rho0 && f.beta_T !== undefined) {
          rho = f.rho0 / (1 + f.beta_T * (T_c - f.T0));
          rho = Math.max(100, rho);
        } else {
          rho = sg_input * 1000;
        }
      } else {
        // Gas
        const f = FLUID_DB_orifice[fluidKey] || null;
        if (f?.t === 'g') {
          const zr   = pitzerZ(f, T_K, P_Pa);
          Z_out      = zr.Z;
          mu_out     = sutherlandViscosity(f, T_K);
          const MW   = f.M;
          rho        = (P_Pa * MW) / (Z_out * 8314.46 * T_K);
        } else {
          const MW   = (parseFloat(body.MW) > 1) ? parseFloat(body.MW) : sg_input * 28.964;
          const Z    = parseFloat(body.Z) || 1;
          rho        = (P_Pa * MW) / (Z * 8314.46 * T_K);
        }
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        rho_op: rho,
        mu_auto: mu_out,
        Z_auto:  Z_out,
      }));
    }
    
    // ── PARSE & NORMALISE ALL INPUTS TO SI ──────────────────────────
    const mode     = body.mode    || 'flow';
    const cat      = body.cat     || 'gas';
    const tapType  = body.tapType || 'sharp_corner';
    const isMetric = (body.unitSys || 'metric') === 'metric';

    // Pressure & temperature
    let P_bar = parseFloat(body.P) || 10;
    let T_c   = parseFloat(body.T) || 20;
    if (!isMetric) { P_bar = P_bar * 0.0689476; T_c = (T_c - 32) * 5/9; }

    // Pipe & bore in mm
    const D_mm = dimToMm(parseFloat(body.D) || 154.05, body.D_unit || 'mm');
    const d_mm = dimToMm(parseFloat(body.d) || 75.00,  body.d_unit || 'mm');

    // DP in Pa
    const dp_Pa_in = dpToPa(parseFloat(body.dp) || 0, body.dp_unit || 'mmH2O');

    // Flow input
    const flow_in   = parseFloat(body.flow) || 0;
    const flow_unit = body.flow_unit || 'Nm3hr';

    const params = {
      mode, cat, tapType,
      customCd:  body.customCd,
      P_bar, T_c,
      Z_input:   parseFloat(body.Z)   || 1,
      k:         parseFloat(body.k)   || 1.4,
      mu_input:  parseFloat(body.mu)  || 1.82e-5,
      sg:        parseFloat(body.sg)  || 0.65,
      MW_input:  parseFloat(body.MW)  || 28.964,
      fluidKey:  body.fluidKey || null,
      D_mm, d_mm, dp_Pa_in, flow_in, flow_unit,
    };

    const result = calculate(params);

    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, ...result }));

  } catch (err) {
    console.error('orifice-flow.js error:', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
};

// ── End of Section 07: Orifice Flow ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SECTION D  ►  PRESSURE DROP CALCULATOR
// Route: /api/pressure-drop-calculator
// (Original: SECTION 08 of 21)
// ══════════════════════════════════════════════════════════════════════════════
// SECTION 08 of 21  ►  PRESSURE DROP CALCULATOR
// Route: /api/pressure-drop-calculator
// Source: pressure-drop-calculator.js
// ══════════════════════════════════════════════════════════════════════════════

// api/pressure-drop-calculator.js
// Vercel Serverless Function — Pressure Drop Calculator
// Handles: fluidList, fluidProps, fittingsList, calculate, calcHW
// All engineering computation lives here — zero physics in the browser.

'use strict';

/* ═══════════════════════════════════════════════════════════════
   SECURITY HELPERS
═══════════════════════════════════════════════════════════════ */
const ALLOWED_ORIGINS = [
  'https://multicalci.com',
  'https://www.multicalci.com',
  'https://nagtesting.vercel.app',
];

function setCORS_pdrop(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
}

function sanitizeNumber(v, fallback = null) {
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

function sanitizeString(v, maxLen = 64) {
  if (typeof v !== 'string') return '';
  return v.replace(/[^a-zA-Z0-9_\-\.]/g, '').slice(0, maxLen);
}

function err(res, status, msg) {
  return res.status(status).json({ ok: false, error: msg });
}

/* ═══════════════════════════════════════════════════════════════
   FLUID DATABASE  (120+ fluids — Andrade liquids · Sutherland gas)
   Sources: Perry's ChE Handbook · NIST WebBook · Yaws' Handbook
═══════════════════════════════════════════════════════════════ */
const FLUID_DB_pdrop = [
  // ── WATER & AQUEOUS ──────────────────────────────────────────────────────
  {id:'water',       name:'Water',                      cat:'Water & Aqueous',     isGas:false,
   rhoModel:'poly_water', viscModel:'andrade', A:-3.5985, B:1061.0,
   Pv_A:8.07131, Pv_B:1730.63, Pv_C:233.426,
   vp:[[0,0.611],[10,1.228],[20,2.338],[30,4.243],[40,7.384],[50,12.35],[60,19.94],[70,31.18],[80,47.39],[90,70.11],[100,101.3],[110,143.3],[120,198.5],[150,476.2],[200,1554]]},

  {id:'seawater',    name:'Seawater (3.5% NaCl)',       cat:'Water & Aqueous',     isGas:false,
   rhoModel:'linear', rho0:1025, Tref:20, k_rho:-0.30,
   viscModel:'andrade', A:-3.35, B:1030.0,
   vp:[[0,0.54],[10,1.08],[20,2.1],[30,3.81],[50,10.9],[80,44.3],[100,97.0]]},

  {id:'brine10',     name:'Brine 10% NaCl',             cat:'Water & Aqueous',     isGas:false,
   rhoModel:'linear', rho0:1071, Tref:20, k_rho:-0.35,
   viscModel:'andrade', A:-3.60, B:1010.0,
   vp:[[0,0.54],[20,2.1],[50,10.5],[80,43.0],[100,96.0]]},

  {id:'brine20',     name:'Brine 20% NaCl',             cat:'Water & Aqueous',     isGas:false,
   rhoModel:'linear', rho0:1148, Tref:20, k_rho:-0.40,
   viscModel:'linear', mu0:1.90, Tref_mu:20, k_mu:-0.030,
   vp:[[0,0.5],[20,1.95],[50,10.0],[80,41.5],[100,93.0]]},

  {id:'brine25',     name:'Brine 25% NaCl',             cat:'Water & Aqueous',     isGas:false,
   rhoModel:'linear', rho0:1188, Tref:20, k_rho:-0.45,
   viscModel:'linear', mu0:2.30, Tref_mu:20, k_mu:-0.040, vapFixed:0.017},

  {id:'cacl2_20',    name:'CaCl₂ Solution 20%',         cat:'Water & Aqueous',     isGas:false,
   rhoModel:'linear', rho0:1176, Tref:20, k_rho:-0.45,
   viscModel:'andrade', A:-3.40, B:1100.0,
   vp:[[0,0.48],[20,1.85],[50,9.5],[80,40.0],[100,90.0]]},

  {id:'cacl2_30',    name:'CaCl₂ Solution 30%',         cat:'Water & Aqueous',     isGas:false,
   rhoModel:'linear', rho0:1280, Tref:20, k_rho:-0.50,
   viscModel:'andrade', A:-2.80, B:1350.0,
   vp:[[0,0.4],[20,1.6],[50,8.5],[80,36.0],[100,82.0]]},

  // ── GLYCOLS & COOLANTS ────────────────────────────────────────────────────
  {id:'eg30',        name:'Ethylene Glycol 30%',        cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1054, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-4.50, B:1350.0, vapFixed:0.021},

  {id:'eg50',        name:'Ethylene Glycol 50%',        cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1080, Tref:20, k_rho:-0.58,
   viscModel:'andrade', A:-3.80, B:1650.0,
   vp:[[0,0.3],[20,1.2],[50,8.0],[80,34],[100,78]]},

  {id:'eg70',        name:'Ethylene Glycol 70%',        cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1096, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-2.80, B:2100.0,
   vp:[[0,0.18],[20,0.8],[50,6.0],[80,28],[100,68]]},

  {id:'pg30',        name:'Propylene Glycol 30%',       cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1034, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-4.00, B:1400.0,
   vp:[[0,0.5],[20,1.8],[50,10.0],[80,40],[100,90]]},

  {id:'pg50',        name:'Propylene Glycol 50%',       cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1059, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-3.20, B:1800.0,
   vp:[[0,0.35],[20,1.3],[50,8.5],[80,35],[100,80]]},

  {id:'deg',         name:'Diethylene Glycol (DEG)',    cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1118, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-2.60, B:2300.0, vapFixed:0.0003},

  {id:'teg',         name:'Triethylene Glycol (TEG)',   cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1126, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:-2.00, B:2600.0, vapFixed:0.00001},

  {id:'mea30',       name:'MEA 30% (Monoethanolamine)', cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1013, Tref:25, k_rho:-0.50,
   viscModel:'andrade', A:-3.60, B:1400.0, vapFixed:0.010},

  {id:'dea35',       name:'DEA 35% (Diethanolamine)',   cat:'Glycols & Coolants',  isGas:false,
   rhoModel:'linear', rho0:1038, Tref:25, k_rho:-0.52,
   viscModel:'andrade', A:-2.80, B:1700.0, vapFixed:0.006},

  // ── PETROLEUM & FUELS ─────────────────────────────────────────────────────
  {id:'gasoline',    name:'Gasoline (Petrol)',           cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:740, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-4.80, B:900.0,
   Pv_A:6.80, Pv_B:1064.0, Pv_C:228.0,
   vp:[[0,10],[10,16],[20,25],[30,38.5],[40,57],[50,82],[60,115]]},

  {id:'diesel',      name:'Diesel Fuel',                 cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:840, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:-3.20, B:1600.0,
   vp:[[20,0.01],[40,0.03],[60,0.07],[80,0.15],[100,0.3]]},

  {id:'kerosene',    name:'Kerosene / Jet-A',            cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:800, Tref:20, k_rho:-0.68,
   viscModel:'andrade', A:-3.90, B:1500.0, vapFixed:0.003},

  {id:'jeta1',       name:'Jet A-1 Fuel',                cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:804, Tref:15, k_rho:-0.72,
   viscModel:'andrade', A:-3.85, B:1480.0, vapFixed:0.003},

  {id:'hfo',         name:'Heavy Fuel Oil (HFO 380)',    cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:975, Tref:15, k_rho:-0.60,
   viscModel:'andrade', A:3.00, B:4200.0, vapFixed:0.001},

  {id:'crude20',     name:'Crude Oil API 20 (heavy)',    cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:934, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:1.00, B:3200.0,
   vp:[[20,0.05],[40,0.16],[80,1.0]]},

  {id:'crude30',     name:'Crude Oil API 30',            cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:876, Tref:20, k_rho:-0.70,
   viscModel:'andrade', A:-1.80, B:2200.0, vapFixed:0.020},

  {id:'crude40',     name:'Crude Oil API 40',            cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:825, Tref:20, k_rho:-0.72,
   viscModel:'andrade', A:-3.00, B:1700.0, vapFixed:0.040},

  {id:'crude50',     name:'Crude Oil API 50 (light)',    cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:780, Tref:20, k_rho:-0.75,
   viscModel:'andrade', A:-4.00, B:1400.0,
   vp:[[20,0.02],[40,0.08],[80,0.6]]},

  {id:'naphtha',     name:'Naphtha (light)',              cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:690, Tref:20, k_rho:-0.85,
   viscModel:'andrade', A:-4.90, B:880.0,
   Pv_A:6.90, Pv_B:1100.0, Pv_C:225.0},

  {id:'naphtha_h',   name:'Naphtha (heavy)',              cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:730, Tref:20, k_rho:-0.80,
   viscModel:'andrade', A:-4.50, B:1000.0, vapFixed:0.030},

  {id:'atmresid',    name:'Atmospheric Residue (ATB)',    cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:960, Tref:60, k_rho:-0.62,
   viscModel:'andrade', A:5.00, B:4800.0, vapFixed:0.001},

  {id:'vacresid',    name:'Vacuum Residue (VTB)',         cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:985, Tref:80, k_rho:-0.60,
   viscModel:'andrade', A:7.50, B:5200.0, vapFixed:0.0001},

  {id:'bitumen',     name:'Bitumen / Asphalt',            cat:'Petroleum & Fuels',   isGas:false,
   rhoModel:'linear', rho0:1030, Tref:150, k_rho:-0.55,
   viscModel:'andrade', A:8.00, B:5500.0, vapFixed:0.0001},

  // ── LUBRICANTS & HYDRAULIC OILS ───────────────────────────────────────────
  {id:'lube32',      name:'Lube Oil ISO VG 32',          cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:858, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:0.20, B:2700.0, vapFixed:0.001},

  {id:'lube46',      name:'Lube Oil ISO VG 46',          cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:870, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:1.20, B:3100.0, vapFixed:0.001},

  {id:'lube68',      name:'Lube Oil ISO VG 68',          cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:872, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:1.60, B:3300.0, vapFixed:0.001},

  {id:'lube100',     name:'Lube Oil ISO VG 100',         cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:874, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:2.00, B:3600.0, vapFixed:0.001},

  {id:'lube150',     name:'Lube Oil ISO VG 150',         cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:875, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:2.40, B:3800.0, vapFixed:0.001},

  {id:'lube220',     name:'Lube Oil ISO VG 220',         cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:880, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:2.90, B:4000.0, vapFixed:0.001},

  {id:'hydr32',      name:'Hydraulic Oil ISO 32',        cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:860, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:0.50, B:2800.0, vapFixed:0.001},

  {id:'hydr46',      name:'Hydraulic Oil ISO 46',        cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:870, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:0.90, B:3000.0, vapFixed:0.001},

  {id:'hydr68',      name:'Hydraulic Oil ISO 68',        cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:875, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:1.40, B:3200.0, vapFixed:0.001},

  {id:'hydr100',     name:'Hydraulic Oil ISO 100',       cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:880, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:2.00, B:3500.0, vapFixed:0.001},

  {id:'thermoil',    name:'Thermal / Heat Transfer Oil', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:855, Tref:100, k_rho:-0.65,
   viscModel:'andrade', A:-0.50, B:2500.0, vapFixed:0.001},

  {id:'turbineoil',  name:'Turbine Oil ISO VG 46',       cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:869, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:0.85, B:2950.0, vapFixed:0.001},

  {id:'gearoil320',  name:'Gear Oil ISO VG 320',         cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:890, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:3.80, B:4400.0, vapFixed:0.001},

  // ── ALCOHOLS ──────────────────────────────────────────────────────────────
  {id:'methanol',    name:'Methanol',                    cat:'Alcohols',            isGas:false,
   rhoModel:'linear', rho0:792, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-5.50, B:1020.0,
   Pv_A:7.8974, Pv_B:1474.08, Pv_C:229.13,
   vp:[[0,4.06],[10,6.97],[20,12.9],[30,21.9],[40,35.4],[64.7,101.3]]},

  {id:'ethanol',     name:'Ethanol (96%)',               cat:'Alcohols',            isGas:false,
   rhoModel:'linear', rho0:789, Tref:20, k_rho:-1.05,
   viscModel:'andrade', A:-4.80, B:1310.0,
   Pv_A:8.1122, Pv_B:1592.864, Pv_C:226.184,
   vp:[[0,1.63],[10,3.12],[20,5.95],[30,10.5],[40,17.7],[50,29.4],[60,47.1],[78.3,101.3]]},

  {id:'ethanol_abs', name:'Ethanol Absolute (99.9%)',    cat:'Alcohols',            isGas:false,
   rhoModel:'linear', rho0:785, Tref:20, k_rho:-1.06,
   viscModel:'andrade', A:-4.90, B:1320.0,
   Pv_A:8.1122, Pv_B:1592.864, Pv_C:226.184},

  {id:'ipa',         name:'Isopropanol (IPA)',           cat:'Alcohols',            isGas:false,
   rhoModel:'linear', rho0:786, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-3.80, B:1600.0,
   Pv_A:8.1178, Pv_B:1580.92, Pv_C:219.61,
   vp:[[0,1.33],[20,4.38],[40,13.2],[82.3,101.3]]},

  {id:'nbutanol',    name:'n-Butanol',                   cat:'Alcohols',            isGas:false,
   rhoModel:'linear', rho0:810, Tref:20, k_rho:-0.82,
   viscModel:'andrade', A:-3.20, B:1850.0,
   Pv_A:7.8366, Pv_B:1558.19, Pv_C:196.88,
   vp:[[0,0.58],[20,0.59],[40,4.35],[50,6.9],[80,22.4],[117.7,101.3]]},

  {id:'glycerol',    name:'Glycerol (100%)',             cat:'Alcohols',            isGas:false,
   rhoModel:'linear', rho0:1261, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:4.50, B:5400.0,
   vp:[[20,0.0002],[60,0.004],[100,0.05],[150,0.55]]},

  {id:'glycerol50',  name:'Glycerol 50% in Water',      cat:'Alcohols',            isGas:false,
   rhoModel:'linear', rho0:1126, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-0.50, B:2200.0,
   vp:[[20,0.1],[40,0.35],[80,3.5],[100,10]]},

  // ── AROMATICS ─────────────────────────────────────────────────────────────
  {id:'benzene',     name:'Benzene',                     cat:'Aromatics',           isGas:false,
   rhoModel:'linear', rho0:879, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-4.60, B:1100.0,
   Pv_A:6.90565, Pv_B:1211.033, Pv_C:220.790,
   vp:[[0,3.52],[20,10.0],[40,24.4],[60,52.0],[80.1,101.3]]},

  {id:'toluene',     name:'Toluene',                     cat:'Aromatics',           isGas:false,
   rhoModel:'linear', rho0:867, Tref:20, k_rho:-0.92,
   viscModel:'andrade', A:-5.00, B:1200.0,
   Pv_A:6.95464, Pv_B:1344.800, Pv_C:219.482,
   vp:[[0,1.57],[20,3.79],[40,9.87],[60,23.4],[110.6,101.3]]},

  {id:'xylene',      name:'Xylene (mixed)',               cat:'Aromatics',           isGas:false,
   rhoModel:'linear', rho0:864, Tref:20, k_rho:-0.88,
   viscModel:'andrade', A:-4.50, B:1350.0,
   Pv_A:6.99052, Pv_B:1453.430, Pv_C:215.307},

  {id:'oxylene',     name:'o-Xylene',                    cat:'Aromatics',           isGas:false,
   rhoModel:'linear', rho0:880, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-4.30, B:1370.0,
   Pv_A:6.99891, Pv_B:1474.679, Pv_C:213.686},

  {id:'styrene',     name:'Styrene',                     cat:'Aromatics',           isGas:false,
   rhoModel:'linear', rho0:906, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-4.40, B:1350.0,
   Pv_A:7.14016, Pv_B:1574.51, Pv_C:218.38,
   vp:[[0,0.3],[20,0.81],[60,5.05],[100,23.1],[145,101.3]]},

  {id:'cumene',      name:'Cumene (Isopropylbenzene)',    cat:'Aromatics',           isGas:false,
   rhoModel:'linear', rho0:862, Tref:20, k_rho:-0.88,
   viscModel:'andrade', A:-4.60, B:1380.0,
   vp:[[0,0.35],[20,0.8],[40,2.2],[80,10.6],[152.4,101.3]]},

  // ── ALIPHATICS ────────────────────────────────────────────────────────────
  {id:'hexane',      name:'n-Hexane',                    cat:'Aliphatics',          isGas:false,
   rhoModel:'linear', rho0:659, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-5.40, B:900.0,
   Pv_A:6.87601, Pv_B:1171.17, Pv_C:224.408},

  {id:'heptane',     name:'n-Heptane',                   cat:'Aliphatics',          isGas:false,
   rhoModel:'linear', rho0:684, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-5.10, B:1060.0,
   Pv_A:6.89385, Pv_B:1264.13, Pv_C:216.640},

  {id:'octane',      name:'n-Octane',                    cat:'Aliphatics',          isGas:false,
   rhoModel:'linear', rho0:703, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-4.80, B:1140.0,
   Pv_A:6.91868, Pv_B:1351.99, Pv_C:209.155,
   vp:[[0,1.4],[20,1.47],[40,6.1],[60,11.5],[80,20.2],[125.7,101.3]]},

  {id:'cyclohex',    name:'Cyclohexane',                 cat:'Aliphatics',          isGas:false,
   rhoModel:'linear', rho0:779, Tref:20, k_rho:-0.97,
   viscModel:'andrade', A:-4.90, B:1100.0,
   Pv_A:6.84498, Pv_B:1203.526, Pv_C:222.863},

  {id:'isooctane',   name:'Isooctane (2,2,4-TMP)',       cat:'Aliphatics',          isGas:false,
   rhoModel:'linear', rho0:692, Tref:20, k_rho:-0.92,
   viscModel:'andrade', A:-5.20, B:1000.0, vapFixed:0.050},

  // ── CHLORINATED SOLVENTS ──────────────────────────────────────────────────
  {id:'dcm',         name:'Dichloromethane (DCM)',        cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1325, Tref:20, k_rho:-1.80,
   viscModel:'andrade', A:-5.50, B:900.0,
   Pv_A:7.0820, Pv_B:1138.91, Pv_C:231.50,
   vp:[[0,16.7],[20,46.5],[40,110],[39.6,101.3]]},

  {id:'chloroform',  name:'Chloroform (CHCl₃)',          cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1489, Tref:20, k_rho:-1.85,
   viscModel:'andrade', A:-5.20, B:1000.0,
   Pv_A:6.9360, Pv_B:1170.966, Pv_C:226.232},

  {id:'cctc',        name:'Carbon Tetrachloride (CCl₄)', cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1594, Tref:20, k_rho:-1.90,
   viscModel:'andrade', A:-5.10, B:1050.0,
   Pv_A:6.93390, Pv_B:1242.43, Pv_C:230.0},

  {id:'tce',         name:'Trichloroethylene',            cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1462, Tref:20, k_rho:-1.60,
   viscModel:'andrade', A:-4.80, B:1200.0,
   Pv_A:6.9730, Pv_B:1315.0, Pv_C:217.0,
   vp:[[0,3.36],[20,9.08],[40,21.6],[87.2,101.3]]},

  {id:'pce',         name:'Perchloroethylene (PCE)',      cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1623, Tref:20, k_rho:-1.70,
   viscModel:'andrade', A:-4.60, B:1280.0,
   vp:[[0,1.87],[20,1.93],[40,10.9],[60,24.8],[121.3,101.3]]},

  // ── KETONES & ESTERS ──────────────────────────────────────────────────────
  {id:'acetone',     name:'Acetone',                      cat:'Ketones & Esters',    isGas:false,
   rhoModel:'linear', rho0:791, Tref:20, k_rho:-1.10,
   viscModel:'andrade', A:-5.80, B:900.0,
   Pv_A:7.11714, Pv_B:1210.595, Pv_C:229.664,
   vp:[[0,9.9],[20,24.5],[40,53.7],[56,101.3]]},

  {id:'mek',         name:'MEK (Methyl Ethyl Ketone)',    cat:'Ketones & Esters',    isGas:false,
   rhoModel:'linear', rho0:805, Tref:20, k_rho:-1.05,
   viscModel:'andrade', A:-5.40, B:1100.0,
   Pv_A:7.0652, Pv_B:1261.34, Pv_C:221.97,
   vp:[[0,3.5],[20,10.1],[40,25.0],[60,55],[79.6,101.3]]},

  {id:'mibk',        name:'MIBK (Methyl Isobutyl Ketone)',cat:'Ketones & Esters',   isGas:false,
   rhoModel:'linear', rho0:801, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-5.00, B:1150.0,
   vp:[[0,1.0],[20,3.0],[40,8.0],[60,18.9],[115.9,101.3]]},

  {id:'cyclohexanone',name:'Cyclohexanone',               cat:'Ketones & Esters',   isGas:false,
   rhoModel:'linear', rho0:948, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-4.20, B:1500.0,
   vp:[[0,0.4],[20,0.53],[40,2.27],[60,8.09],[80,22.8],[155.6,101.3]]},

  {id:'ethacet',     name:'Ethyl Acetate',                cat:'Ketones & Esters',    isGas:false,
   rhoModel:'linear', rho0:900, Tref:20, k_rho:-1.10,
   viscModel:'andrade', A:-5.20, B:1090.0,
   Pv_A:7.0145, Pv_B:1244.95, Pv_C:217.88},

  {id:'butacet',     name:'Butyl Acetate',                cat:'Ketones & Esters',    isGas:false,
   rhoModel:'linear', rho0:882, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-4.80, B:1250.0, vapFixed:0.015},

  // ── ACIDS & BASES ─────────────────────────────────────────────────────────
  {id:'h2so4_98',    name:'Sulfuric Acid 98%',           cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1840, Tref:25, k_rho:-0.70,
   viscModel:'andrade', A:2.20, B:3700.0,
   vp:[[20,3e-05],[100,0.01],[200,0.5]]},

  {id:'h2so4_50',    name:'Sulfuric Acid 50%',           cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1395, Tref:25, k_rho:-0.80,
   viscModel:'andrade', A:-2.00, B:1800.0, vapFixed:0.020},

  {id:'h2so4_10',    name:'Sulfuric Acid 10%',           cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1066, Tref:25, k_rho:-0.45,
   viscModel:'andrade', A:-3.60, B:1100.0,
   vp:[[20,2.3],[50,10.0],[80,38],[100,90]]},

  {id:'hcl30',       name:'Hydrochloric Acid 30%',       cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1149, Tref:20, k_rho:-0.45,
   viscModel:'andrade', A:-4.00, B:1050.0, vapFixed:0.060},

  {id:'hcl10',       name:'Hydrochloric Acid 10%',       cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1047, Tref:20, k_rho:-0.40,
   viscModel:'andrade', A:-3.80, B:1000.0,
   vp:[[10,25],[20,42],[30,65],[50,120]]},

  {id:'hno3_65',     name:'Nitric Acid 65%',             cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1391, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-4.80, B:1000.0, vapFixed:0.040},

  {id:'hno3_30',     name:'Nitric Acid 30%',             cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1180, Tref:20, k_rho:-0.70,
   viscModel:'andrade', A:-4.20, B:1050.0,
   vp:[[0,1.2],[20,3.0],[50,11.0],[80,35]]},

  {id:'h3po4_85',    name:'Phosphoric Acid 85%',         cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1685, Tref:25, k_rho:-0.95,
   viscModel:'andrade', A:0.50, B:3200.0,
   vp:[[20,0.01],[60,0.04],[100,0.15],[150,1.0]]},

  {id:'naoh30',      name:'NaOH (Caustic) 30%',          cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1328, Tref:20, k_rho:-0.45,
   viscModel:'andrade', A:-3.00, B:1400.0, vapFixed:0.020},

  {id:'naoh50',      name:'NaOH (Caustic) 50%',          cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1525, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-1.20, B:2000.0,
   vp:[[20,0.5],[50,4.0],[80,25],[100,70]]},

  {id:'koh30',       name:'KOH Solution 30%',            cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1290, Tref:20, k_rho:-0.50,
   viscModel:'andrade', A:-3.00, B:1500.0,
   vp:[[20,1.5],[50,8.0],[80,35],[100,85]]},

  {id:'aceticac',    name:'Acetic Acid (glacial)',        cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1049, Tref:20, k_rho:-1.05,
   viscModel:'andrade', A:-4.20, B:1400.0,
   Pv_A:7.38782, Pv_B:1533.313, Pv_C:222.309},

  {id:'aceticac_50', name:'Acetic Acid 50%',             cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1062, Tref:20, k_rho:-0.85,
   viscModel:'andrade', A:-3.80, B:1350.0, vapFixed:0.040},

  {id:'formicac',    name:'Formic Acid 85%',             cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:1193, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-3.60, B:1450.0, vapFixed:0.040},

  {id:'ammonia_aq',  name:'Ammonia Solution 25%',        cat:'Acids & Bases',       isGas:false,
   rhoModel:'linear', rho0:910, Tref:20, k_rho:-0.85,
   viscModel:'andrade', A:-4.50, B:900.0,
   vp:[[0,0.55],[20,2.0],[40,6.5],[80,35],[100,90]]},

  // ── LIQUEFIED GASES ────────────────────────────────────────────────────────
  {id:'lpg',         name:'LPG (Propane/Butane mix)',    cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:530, Tref:20, k_rho:-1.80,
   viscModel:'andrade', A:-7.00, B:700.0, vapFixed:8.0},

  {id:'propane_liq', name:'Liquid Propane',              cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:493, Tref:20, k_rho:-1.90,
   viscModel:'andrade', A:-7.20, B:650.0, vapFixed:8.4},

  {id:'butane_liq',  name:'Liquid Butane',               cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:580, Tref:20, k_rho:-1.70,
   viscModel:'andrade', A:-6.50, B:700.0, vapFixed:2.1},

  {id:'ammonia_liq', name:'Liquid Ammonia',              cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:610, Tref:20, k_rho:-2.00,
   viscModel:'andrade', A:-4.729, B:800.0,
   vp:[[-50,40.8],[-40,71.7],[-33.35,101.3],[-20,190.1],[0,429.6],[20,857.2],[35,1351],[50,2032],[75,3588],[100,6253]]},
  // ── AMMONIA (dual-phase: auto liquid/gas based on T & P) ─────────────────
  {id:'ammonia',     name:'Ammonia (NH₃) — auto phase',   cat:'Dual-Phase (auto L/G)', isGas:'auto',
   // Antoine: log10(Pv/mmHg) = A - B/(C + T°C), valid -83 to 133°C
   Pv_A:7.596673, Pv_B:1028.083, Pv_C:251.369,
   Tc:132.25, Pc:112.8,
   // Liquid phase
   liq_rhoModel:'linear', liq_rho0:682.0, liq_Tref:-33.35, liq_k_rho:-1.88,
   liq_viscModel:'andrade', liq_A:-6.743, liq_B:632.0,
   // Gas phase
   gas_rhoModel:'ideal_gas', gas_MW:17.03,
   gas_viscModel:'sutherland', gas_mu_ref:0.01010e-3, gas_T_ref:293.15, gas_C_su:370.0,
   vp:[[-50,40.8],[-40,71.7],[-33.35,101.3],[-20,190.1],[0,429.6],[20,857.2],[35,1351],[50,2032],[75,3588],[100,6253]]},



  {id:'co2_liq',     name:'Liquid CO₂ (subcritical)',    cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:773, Tref:20, k_rho:-3.50,
   viscModel:'andrade', A:-7.50, B:600.0, vapFixed:57.3},

  {id:'r134a',       name:'Refrigerant R-134a',          cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:1206, Tref:20, k_rho:-3.50,
   viscModel:'andrade', A:-6.00, B:800.0,
   vp:[[-26.4,101.3],[0,293],[20,572],[40,1017],[60,1682]]},

  {id:'r22',         name:'Refrigerant R-22',            cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:1194, Tref:20, k_rho:-3.40,
   viscModel:'andrade', A:-6.20, B:750.0,
   vp:[[-40.8,101.3],[-20,245],[0,499],[20,909],[40,1535]]},

  {id:'r410a',       name:'Refrigerant R-410A',          cat:'Liquefied Gases',     isGas:false,
   rhoModel:'linear', rho0:1062, Tref:20, k_rho:-3.80,
   viscModel:'andrade', A:-6.50, B:720.0,
   vp:[[-51.4,101.3],[-20,400],[0,799],[20,1358],[40,2143]]},

  // ── GASES (ideal gas law for ρ, Sutherland for μ) ─────────────────────────
  {id:'air',         name:'Air',                          cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:28.97,
   viscModel:'sutherland', mu_ref:0.01827e-3, T_ref:291.15, C_su:120.0},

  {id:'nitrogen',    name:'Nitrogen (N₂)',                cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:28.01,
   viscModel:'sutherland', mu_ref:0.01781e-3, T_ref:300.55, C_su:111.0},

  {id:'oxygen',      name:'Oxygen (O₂)',                  cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:32.00,
   viscModel:'sutherland', mu_ref:0.02018e-3, T_ref:292.25, C_su:127.0},

  {id:'hydrogen',    name:'Hydrogen (H₂)',                cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:2.016,
   viscModel:'sutherland', mu_ref:0.00876e-3, T_ref:293.85, C_su:72.0},

  {id:'helium',      name:'Helium (He)',                  cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:4.003,
   viscModel:'sutherland', mu_ref:0.01960e-3, T_ref:273.15, C_su:79.4},

  {id:'argon',       name:'Argon (Ar)',                   cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:39.95,
   viscModel:'sutherland', mu_ref:0.02228e-3, T_ref:273.15, C_su:144.4},

  {id:'co2gas',      name:'CO₂ Gas',                      cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:44.01,
   viscModel:'sutherland', mu_ref:0.01480e-3, T_ref:293.15, C_su:240.0},

  {id:'cogas',       name:'CO Gas (Carbon Monoxide)',     cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:28.01,
   viscModel:'sutherland', mu_ref:0.01661e-3, T_ref:273.15, C_su:118.0},

  {id:'methane',     name:'Methane (CH₄)',                cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:16.04,
   viscModel:'sutherland', mu_ref:0.01100e-3, T_ref:293.15, C_su:198.0},

  {id:'ethane',      name:'Ethane (C₂H₆)',               cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:30.07,
   viscModel:'sutherland', mu_ref:0.00900e-3, T_ref:293.15, C_su:252.0},

  {id:'propgas',     name:'Propane Gas (C₃H₈)',          cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:44.10,
   viscModel:'sutherland', mu_ref:0.00820e-3, T_ref:293.15, C_su:330.0},

  {id:'natgas',      name:'Natural Gas (SG 0.65)',        cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:18.83,
   viscModel:'sutherland', mu_ref:0.01100e-3, T_ref:293.15, C_su:180.0},

  {id:'natgas_h',    name:'Natural Gas (SG 0.75, rich)',  cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:21.73,
   viscModel:'sutherland', mu_ref:0.01050e-3, T_ref:293.15, C_su:185.0},

  {id:'h2s',         name:'Hydrogen Sulfide (H₂S)',       cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:34.08,
   viscModel:'sutherland', mu_ref:0.01180e-3, T_ref:293.15, C_su:331.0},

  {id:'so2',         name:'Sulfur Dioxide (SO₂)',         cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:64.06,
   viscModel:'sutherland', mu_ref:0.01257e-3, T_ref:293.15, C_su:416.0},

  {id:'chlorinegas', name:'Chlorine Gas (Cl₂)',           cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:70.90,
   viscModel:'sutherland', mu_ref:0.01330e-3, T_ref:293.15, C_su:351.0},

  {id:'steam_gas',   name:'Steam (superheated)',           cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:18.015,
   viscModel:'sutherland', mu_ref:0.01200e-3, T_ref:373.15, C_su:1064.0},

  {id:'ammgas',      name:'Ammonia Gas (NH₃)',            cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:17.03,
   viscModel:'sutherland', mu_ref:0.01010e-3, T_ref:293.15, C_su:370.0},

  {id:'fluegas',     name:'Flue Gas (typical)',           cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:29.0,
   viscModel:'sutherland', mu_ref:0.01900e-3, T_ref:473.15, C_su:110.0},

  {id:'biogas',      name:'Biogas (60% CH₄, 40% CO₂)',   cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:27.22,
   viscModel:'sutherland', mu_ref:0.01250e-3, T_ref:293.15, C_su:200.0},

  {id:'syngas',      name:'Syngas (H₂+CO mixture)',       cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:15.50,
   viscModel:'sutherland', mu_ref:0.01300e-3, T_ref:293.15, C_su:150.0},

  {id:'hclgas',      name:'HCl Gas',                      cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:36.46,
   viscModel:'sutherland', mu_ref:0.01426e-3, T_ref:273.15, C_su:360.0},

  // ── CHEMICAL PROCESS ──────────────────────────────────────────────────────
  {id:'dmf',         name:'DMF (Dimethylformamide)',       cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:944, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-4.50, B:1200.0, vapFixed:0.004},

  {id:'dmso',        name:'DMSO (Dimethyl Sulfoxide)',     cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:1101, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-3.50, B:1700.0, vapFixed:0.001},

  {id:'thf',         name:'THF (Tetrahydrofuran)',          cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:889, Tref:20, k_rho:-1.10,
   viscModel:'andrade', A:-5.20, B:1000.0,
   Pv_A:6.9953, Pv_B:1202.29, Pv_C:226.25},

  {id:'nmp',         name:'N-Methylpyrrolidone (NMP)',     cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:1028, Tref:20, k_rho:-0.96,
   viscModel:'andrade', A:-3.40, B:1700.0,
   vp:[[20,0.04],[50,0.37],[80,2.4],[100,5.8],[202,101.3]]},

  {id:'acetonitrile',name:'Acetonitrile (MeCN)',           cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:786, Tref:20, k_rho:-1.10,
   viscModel:'andrade', A:-5.60, B:950.0,
   Pv_A:7.1190, Pv_B:1314.4, Pv_C:230.0},

  {id:'diethether',  name:'Diethyl Ether',                 cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:713, Tref:20, k_rho:-1.20,
   viscModel:'andrade', A:-5.90, B:850.0,
   Pv_A:6.9267, Pv_B:1064.07, Pv_C:228.799},

  {id:'dioxane',     name:'1,4-Dioxane',                   cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:1034, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-4.80, B:1250.0, vapFixed:0.038},

  {id:'furfural',    name:'Furfural',                      cat:'Chemical Process',    isGas:false,
   rhoModel:'linear', rho0:1160, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-3.60, B:1600.0, vapFixed:0.003},

  // ── FOOD & PHARMA ──────────────────────────────────────────────────────────
  {id:'milk',        name:'Milk (whole)',                  cat:'Food & Pharma',       isGas:false,
   rhoModel:'linear', rho0:1030, Tref:20, k_rho:-0.35,
   viscModel:'andrade', A:-3.80, B:1100.0, vapFixed:0.023},

  {id:'milk_skim',   name:'Skim Milk',                     cat:'Food & Pharma',       isGas:false,
   rhoModel:'linear', rho0:1034, Tref:20, k_rho:-0.33,
   viscModel:'andrade', A:-4.00, B:1050.0, vapFixed:0.023},

  {id:'olive',       name:'Olive Oil',                     cat:'Food & Pharma',       isGas:false,
   rhoModel:'linear', rho0:910, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:1.00, B:3200.0, vapFixed:0.001},

  {id:'sunflower',   name:'Sunflower Oil',                 cat:'Food & Pharma',       isGas:false,
   rhoModel:'linear', rho0:919, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:0.90, B:3000.0,
   vp:[[40,0.001],[80,0.01],[100,0.03]]},

  {id:'palmoil',     name:'Palm Oil',                      cat:'Food & Pharma',       isGas:false,
   rhoModel:'linear', rho0:891, Tref:50, k_rho:-0.67,
   viscModel:'andrade', A:1.20, B:3400.0, vapFixed:0.001},

  {id:'cornsyrup',   name:'Corn Syrup 63° Brix',          cat:'Food & Pharma',       isGas:false,
   rhoModel:'linear', rho0:1303, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:3.20, B:3500.0, vapFixed:0.010},

  {id:'honey',       name:'Honey',                         cat:'Food & Pharma',       isGas:false,
   rhoModel:'linear', rho0:1420, Tref:20, k_rho:-0.50,
   viscModel:'andrade', A:5.00, B:4800.0, vapFixed:0.005},

  // ── SPECIAL & METALS ──────────────────────────────────────────────────────
  {id:'mercury',     name:'Mercury (liquid)',              cat:'Special & Metals',    isGas:false,
   rhoModel:'linear', rho0:13534, Tref:20, k_rho:-2.45,
   viscModel:'andrade', A:-3.50, B:800.0,
   vp:[[20,0.000227],[100,0.016],[200,0.279],[356.7,101.3]]},

  {id:'molten_s',    name:'Molten Sulfur',                 cat:'Special & Metals',    isGas:false,
   rhoModel:'linear', rho0:1800, Tref:130, k_rho:-0.95,
   viscModel:'andrade', A:-3.80, B:1500.0, vapFixed:0.001},

  {id:'slurry10',    name:'Slurry (10% solids)',           cat:'Special & Metals',    isGas:false,
   rhoModel:'linear', rho0:1100, Tref:20, k_rho:-0.35,
   viscModel:'linear', mu0:5.0, Tref_mu:20, k_mu:-0.05, vapFixed:0.020},

  {id:'slurry30',    name:'Slurry (30% solids)',           cat:'Special & Metals',    isGas:false,
   rhoModel:'linear', rho0:1350, Tref:20, k_rho:-0.40,
   viscModel:'linear', mu0:20.0, Tref_mu:20, k_mu:-0.15, vapFixed:0.015},

  {id:'slurry50',    name:'Slurry (50% solids, dense)',    cat:'Special & Metals',    isGas:false,
   rhoModel:'linear', rho0:1650, Tref:20, k_rho:-0.45,
   viscModel:'linear', mu0:80.0, Tref_mu:20, k_mu:-0.40, vapFixed:0.010},

  {id:'drilling_mud',name:'Drilling Mud (12 ppg)',         cat:'Special & Metals',    isGas:false,
   rhoModel:'linear', rho0:1440, Tref:25, k_rho:-0.50,
   viscModel:'linear', mu0:30.0, Tref_mu:25, k_mu:-0.20, vapFixed:0.015},

  // ── PROPANE (dual-phase) ──────────────────────────────────────────────────
  {id:'propane',     name:'Propane (C₃H₈) — auto phase',  cat:'Dual-Phase (auto L/G)', isGas:'auto',
   Pv_A:6.82973, Pv_B:803.810, Pv_C:246.990,
   Tc:96.68, Pc:42.48,
   liq_rhoModel:'linear', liq_rho0:493.0, liq_Tref:-42.1, liq_k_rho:-1.90,
   liq_viscModel:'andrade', liq_A:-7.20, liq_B:650.0,
   gas_rhoModel:'ideal_gas', gas_MW:44.10,
   gas_viscModel:'sutherland', gas_mu_ref:0.00820e-3, gas_T_ref:293.15, gas_C_su:330.0,
   vp:[[-42.1,101.3],[-30,161],[-20,245],[0,474],[20,879],[40,1530],[50,1771],[96.68,4248]]},

  // ── CO₂ (dual-phase) ─────────────────────────────────────────────────────
  {id:'co2',         name:'CO₂ — auto phase',              cat:'Dual-Phase (auto L/G)', isGas:'auto',
   Pv_form:'cc_ln', Pv_A:10.79, Pv_B:-1977,
   Tc:31.04, Pc:73.77,
   liq_rhoModel:'linear', liq_rho0:773.0, liq_Tref:20.0, liq_k_rho:-3.50,
   liq_viscModel:'andrade', liq_A:-7.50, liq_B:600.0,
   gas_rhoModel:'ideal_gas', gas_MW:44.01,
   gas_viscModel:'sutherland', gas_mu_ref:0.01480e-3, gas_T_ref:293.15, gas_C_su:240.0,
   vp:[[-56.6,517],[-40,1013],[-20,1969],[0,3484],[20,5729],[30,7176]]},

  // ── WATER / STEAM (dual-phase) ────────────────────────────────────────────
  {id:'water_steam', name:'Water/Steam — auto phase',       cat:'Dual-Phase (auto L/G)', isGas:'auto',
   Pv_A:8.07131, Pv_B:1730.63, Pv_C:233.426,
   Tc:373.95, Pc:220.64,
   liq_rhoModel:'poly_water', 
   liq_viscModel:'andrade', liq_A:-3.5985, liq_B:1061.0,
   gas_rhoModel:'ideal_gas', gas_MW:18.015,
   gas_viscModel:'sutherland', gas_mu_ref:0.01200e-3, gas_T_ref:373.15, gas_C_su:1064.0,
   vp:[[0,0.611],[20,2.338],[40,7.384],[60,19.94],[80,47.39],[100,101.3],[120,198.5],[150,476.2],[200,1554],[250,3975],[300,8592],[373.95,22064]]},

];

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY CALCULATION ENGINE

/* ═══════════════════════════════════════════════════════════════
   FITTING CATALOGUE
═══════════════════════════════════════════════════════════════ */
const FITTING_CATALOGUE = {
  elbow90:{label:'90° Elbow — Standard',k:0.9},elbow90lr:{label:'90° Elbow — Long Radius',k:0.6},
  elbow45:{label:'45° Elbow — Standard',k:0.4},elbow45lr:{label:'45° Elbow — Long Radius',k:0.2},
  elbow180:{label:'180° Return Bend',k:1.5},teerun:{label:'Tee — Through Run',k:0.6},
  teebranch:{label:'Tee — Branch Flow',k:1.8},teecombine:{label:'Tee — Combining',k:1.3},
  reducer:{label:'Sudden Contraction',k:0.5},expander:{label:'Sudden Expansion',k:1.0},
  gradred:{label:'Gradual Reducer',k:0.1},entrance:{label:'Pipe Entrance — Sharp',k:0.5},
  exit:{label:'Pipe Exit',k:1.0},gate_open:{label:'Gate Valve — Fully Open',k:0.2},
  gate_75:{label:'Gate Valve — 75% Open',k:1.1},gate_50:{label:'Gate Valve — 50% Open',k:5.6},
  globe_open:{label:'Globe Valve — Fully Open',k:10},globe_50:{label:'Globe Valve — 50% Open',k:13},
  diaphragm:{label:'Diaphragm Valve',k:2.3},ball_open:{label:'Ball Valve — Fully Open',k:0.05},
  ball_75:{label:'Ball Valve — 75% Open',k:0.7},ball_50:{label:'Ball Valve — 50% Open',k:5.5},
  plug_open:{label:'Plug Valve — Open',k:0.3},needle:{label:'Needle Valve',k:3.0},
  butterfly_open:{label:'Butterfly — Fully Open',k:0.5},butterfly_75:{label:'Butterfly — 75° Open',k:0.8},
  butterfly_60:{label:'Butterfly — 60° Open',k:2.0},butterfly_45:{label:'Butterfly — 45° Open',k:10},
  check_swing:{label:'Check Valve — Swing',k:2.0},check_lift:{label:'Check Valve — Lift',k:12},
  check_ball:{label:'Check Valve — Ball',k:4.5},check_tilting:{label:'Check Valve — Tilting Disc',k:0.8},
  angle:{label:'Angle Valve',k:5.0},prv:{label:'Pressure Reducing Valve',k:8.0},
  psv:{label:'Pressure Safety Valve',k:6.0},control:{label:'Control Valve — Open',k:5.0},
  solenoid:{label:'Solenoid Valve',k:3.5},ystrainer:{label:'Y-Strainer — Clean',k:3.0},
  tstrainer:{label:'T-Strainer — Clean',k:2.0},basket:{label:'Basket Strainer — Clean',k:1.5},
  orifice:{label:'Orifice Plate',k:10},flowmeter:{label:'Flow Meter',k:4.0},
  venturi:{label:'Venturi Meter',k:0.5},custom:{label:'Custom / Other',k:1.0},
};


/* ═══════════════════════════════════════════════════════════════
   PROPERTY CALCULATION ENGINE
   calcFluidProps(id, T_C, P_bar) → {rho[kg/m³], mu[cP], Pv[bar], isGas, warn}
═══════════════════════════════════════════════════════════════ */
// calcFluidProps(id, T_C, P_bar) → {rho[kg/m³], mu[cP], Pv[bar], isGas, warn}
// ─────────────────────────────────────────────────────────────────────────────

// ── VAPOUR PRESSURE LOOKUP — log-linear interpolation (same method as NPSH calculator) ──
// vp table: [[T_C, kPa], ...] — must be sorted ascending by T
// Returns Pv in kPa. Far more accurate than Antoine for most fluids.
function vpI(f, T_C) {
  const d = f.vp;
  if (!d || !d.length) return null;  // no table → fallback to Antoine/fixed
  if (T_C <= d[0][0])             return d[0][1];
  if (T_C >= d[d.length-1][0])   return d[d.length-1][1];
  for (let i = 0; i < d.length-1; i++) {
    if (T_C >= d[i][0] && T_C < d[i+1][0]) {
      const r  = (T_C - d[i][0]) / (d[i+1][0] - d[i][0]);
      const l1 = Math.log(Math.max(d[i][1],   1e-10));
      const l2 = Math.log(Math.max(d[i+1][1], 1e-10));
      return Math.exp(l1 + r*(l2 - l1));  // kPa
    }
  }
  return d[d.length-1][1];
}

function calcFluidProps(id, T_C, P_bar) {
  const f = FLUID_DB_pdrop.find(x => x.id === id);
  if (!f) return null;
  const T_K = T_C + 273.15;
  let rho, mu, Pv = 0, warn = '', phaseLabel = '';

  // ── VAPOUR PRESSURE — priority: vp table > Antoine/CC > fixed ─────────────
  // Method 1: lookup table with log-linear interpolation (most accurate)
  const vpTable = vpI(f, T_C);
  if (vpTable !== null) {
    Pv = vpTable / 100;  // kPa → bar
  } else if (f.Pv_form === 'cc_ln' && f.Pv_A !== undefined) {
    // Clausius-Clapeyron ln form: ln(Pv_bar) = A + B/T_K
    Pv = Math.max(0, Math.exp(f.Pv_A + f.Pv_B / T_K));
  } else if (f.Pv_A !== undefined) {
    // Antoine: log10(Pv/mmHg) = A − B/(C + T°C)
    const denom = f.Pv_C + T_C;
    if (denom > 0) {
      const logPv = f.Pv_A - f.Pv_B / denom;
      Pv = Math.max(0, Math.pow(10, logPv) * 0.00133322); // bar
    }
  } else if (f.vapFixed !== undefined) {
    Pv = f.vapFixed;
  }

  // ── PHASE DETECTION for dual-phase fluids (isGas === 'auto') ──────────────
  // Rule: if T > Tc OR P < Pv(T) → GAS phase; else → LIQUID phase
  // Also handle supercritical: T > Tc AND P > Pc → supercritical (treat as gas-like)
  let effectiveIsGas = f.isGas; // default: use declared phase
  if (f.isGas === 'auto') {
    const aboveCriticalT = (f.Tc !== undefined) && (T_C > f.Tc);
    const aboveCriticalP = (f.Pc !== undefined) && (P_bar > f.Pc);
    // Supercritical region
    if (aboveCriticalT && aboveCriticalP) {
      effectiveIsGas = true;
      phaseLabel = '⬡ Supercritical';
      warn += '⚠ Supercritical conditions (T > Tc=' + f.Tc + '°C, P > Pc=' + f.Pc + ' bar). Using gas-like properties. ';
    }
    // Above critical temperature but sub-critical pressure → gas
    else if (aboveCriticalT) {
      effectiveIsGas = true;
      phaseLabel = '↑ Gas (T > Tc)';
    }
    // Below critical T: compare Pv(T) with operating P
    // If P < Pv → system pressure is below vapour pressure → GAS
    // If P >= Pv → liquid (condensed)
    else if (Pv > 0 && P_bar < Pv) {
      effectiveIsGas = true;
      phaseLabel = '↑ Gas (P < Psat=' + Pv.toFixed(3) + ' bar)';
    } else {
      effectiveIsGas = false;
      phaseLabel = '↓ Liquid (P ≥ Psat=' + Pv.toFixed(3) + ' bar)';
    }
  }

  // ── DENSITY ────────────────────────────────────────────────────────────────
  if (f.isGas === 'auto') {
    // Dual-phase fluid — use phase-specific model
    if (effectiveIsGas) {
      // Gas: ideal gas law
      rho = (P_bar * 1e5 * f.gas_MW) / (8314.0 * T_K);
    } else {
      // Liquid
      if (f.liq_rhoModel === 'poly_water') {
        rho = 999.842 + 0.0622*T_C - 0.003713*T_C*T_C + 4.0e-6*Math.pow(T_C,3);
        if (T_C < 0 || T_C > 374) warn += 'Water polynomial valid 0–374°C. ';
      } else {
        rho = f.liq_rho0 + f.liq_k_rho * (T_C - f.liq_Tref);
        if (rho < 1) { rho = 1; warn += 'ρ clamped — near or above boiling point. '; }
      }
    }
  } else if (f.rhoModel === 'poly_water') {
    rho = 999.842 + 0.0622*T_C - 0.003713*T_C*T_C + 4.0e-6*Math.pow(T_C,3);
    if (T_C < 0 || T_C > 150) warn += 'Water poly valid 0–150°C. ';
  } else if (f.rhoModel === 'ideal_gas') {
    rho = (P_bar * 1e5 * f.MW) / (8314.0 * T_K);
  } else {
    rho = f.rho0 + f.k_rho * (T_C - f.Tref);
    if (rho < 1) { rho = 1; warn += 'T may be above boiling point — ρ clamped. '; }
  }

  // ── VISCOSITY ──────────────────────────────────────────────────────────────
  if (f.isGas === 'auto') {
    if (effectiveIsGas) {
      // Sutherland
      const ratio = T_K / f.gas_T_ref;
      const mu_Pas = f.gas_mu_ref * Math.pow(ratio, 1.5) * (f.gas_T_ref + f.gas_C_su) / (T_K + f.gas_C_su);
      mu = mu_Pas * 1000;
    } else {
      // Andrade for liquid
      mu = Math.exp(f.liq_A + f.liq_B / T_K);
    }
    mu = Math.max(0.001, Math.min(mu, 1e7));
  } else if (f.viscModel === 'andrade') {
    mu = Math.exp(f.A + f.B / T_K);
    mu = Math.max(0.001, Math.min(mu, 1e7));
  } else if (f.viscModel === 'sutherland') {
    const ratio = T_K / f.T_ref;
    const mu_Pas = f.mu_ref * Math.pow(ratio, 1.5) * (f.T_ref + f.C_su) / (T_K + f.C_su);
    mu = mu_Pas * 1000;
    mu = Math.max(0.001, mu);
  } else {
    const Tref_mu = f.Tref_mu !== undefined ? f.Tref_mu : f.Tref;
    mu = f.mu0 + f.k_mu * (T_C - Tref_mu);
    mu = Math.max(0.001, mu);
  }

  // ── FLASH / BOILING WARNING (non-auto fluids) ──────────────────────────────
  if (f.isGas !== 'auto' && !f.isGas && P_bar > 0 && Pv > 0 && Pv >= P_bar)
    warn += '⚠ Vapour pressure ≥ operating pressure — fluid may flash or boil! ';

  // ── GAS compressibility reminder ───────────────────────────────────────────
  if (effectiveIsGas === true && f.isGas !== 'auto')
    warn += '';  // existing gas entries already get the alert via selectFluid()

  return {
    rho:        parseFloat(rho.toFixed(3)),
    mu:         parseFloat(mu.toFixed(4)),
    Pv:         parseFloat(Pv.toFixed(6)),
    isGas:      effectiveIsGas === true || effectiveIsGas === 'auto',
    phaseLabel: phaseLabel,
    name:       f.name, cat: f.cat, warn
  };
}

// Shim so any legacy code that reads FLUID_LIBRARY still works

/* ═══════════════════════════════════════════════════════════════
   DARCY-WEISBACH + COLEBROOK-WHITE CALCULATION ENGINE
═══════════════════════════════════════════════════════════════ */
function calcPressureDrop(inputs) {
  let { D, L, Q, rho, mu, dz, epsBase, foulingMm, fittings, pumpEff, motorEff, unitMode } = inputs;

  // Validate
  if ([D, L, Q, rho, mu].some(v => !isFinite(v) || v <= 0))
    return { ok: false, error: 'All inputs must be positive finite numbers.' };
  if (mu < 0.00001)
    return { ok: false, error: 'Viscosity too low — check units (enter in cP, e.g. water = 1.0 cP).' };

  const eps = epsBase + Math.max(0, foulingMm);  // total roughness [mm]
  dz = isFinite(dz) ? dz : 0;
  const D_orig = D, L_orig = L, dz_orig = dz;
  // Convert to SI
  if (unitMode === 'imperial') {
    D   *= 25.4;      // in → mm
    L   *= 0.3048;    // ft → m
    dz  *= 0.3048;    // ft → m
    Q   *= 0.227124;  // GPM → m³/h
    rho *= 16.0185;   // lb/ft³ → kg/m³
  }

  const Dm    = D / 1000;           // mm → m
  const Qs    = Q / 3600;           // m³/h → m³/s
  const mu_Pa = mu / 1000;          // cP → Pa·s
  const eps_m = eps / 1000;         // mm → m

  const A  = Math.PI * Dm * Dm / 4;
  const V  = Qs / A;
  const Re = rho * V * Dm / mu_Pa;

  if (Re < 1) return { ok: false, error: 'Reynolds number < 1 — check inputs.' };

  // Friction factor — Churchill (1977) spans ALL regimes
  let f;
  if (Re < 2300) {
    f = 64 / Re;  // Laminar: Hagen-Poiseuille exact
  } else if (Re < 4000) {
    const A_ch = Math.pow(2.457 * Math.log(1 / (Math.pow(7 / Re, 0.9) + 0.27 * (eps_m / Dm))), 16);
    const B_ch = Math.pow(37530 / Re, 16);
    f = 8 * Math.pow(Math.pow(8 / Re, 12) + 1 / Math.pow(A_ch + B_ch, 1.5), 1 / 12);
    const fCB = Math.pow(-2 * Math.log10(eps_m / (3.7 * Dm) + 2.51 / (Re * Math.sqrt(0.02))), -2);
    f = Math.max(f, fCB);
  } else {
    // Swamee-Jain seed → Colebrook-White iteration
    const arg = eps_m / (3.7 * Dm) + 5.74 / Math.pow(Re, 0.9);
    f = arg > 0 ? 0.25 / Math.pow(Math.log10(arg), 2) : 0.02;
    if (!isFinite(f) || f <= 0) f = 0.02;
    for (let i = 0; i < 50; i++) {
      const inner = eps_m / (3.7 * Dm) + 2.51 / (Re * Math.sqrt(f));
      if (inner <= 0 || !isFinite(inner)) break;
      const fn = Math.pow(-2 * Math.log10(inner), -2);
      if (!isFinite(fn) || fn <= 0) break;
      if (Math.abs(fn - f) < 1e-10) { f = fn; break; }
      f = fn;
    }
  }
  if (!isFinite(f) || f <= 0) return { ok: false, error: 'Friction factor calculation failed — check pipe roughness.' };

  // K-factor total from fittings list
  const Ktot = Array.isArray(fittings)
    ? fittings.reduce((s, fit) => {
        const k = sanitizeNumber(fit.k, 0);
        const qty = Math.max(0, parseInt(fit.qty) || 0);
        return s + qty * k;
      }, 0)
    : 0;

  const dynPres = rho * V * V / 2;
  const dpPipe  = f * (L / Dm) * dynPres;
  const dpMinor = Ktot * dynPres;
  const dpElev  = rho * 9.81 * dz;
  const dpTotal = dpPipe + dpMinor + dpElev;

  const headLoss = dpTotal / (rho * 9.81);
  const Leq = f > 0 ? Ktot * Dm / f : 0;

  const P_hyd   = Qs * dpTotal;
  const P_shaft = P_hyd / pumpEff;
  const P_motor = P_shaft / motorEff;

  let regime, regimeClass;
  if (Re < 2300)       { regime = 'Laminar';      regimeClass = 'badge-green'; }
  else if (Re < 4000)  { regime = 'Transitional'; regimeClass = 'badge-amber'; }
  else                 { regime = 'Turbulent';    regimeClass = 'badge-red';   }

  const uncertPct = Re < 4000 ? 25 : (eps / Dm > 0.01 ? 8 : 5);

  // Unit display conversion
  let dpDisp, dpPipeDisp, dpMinorDisp, dpElevDisp, dpUnit, velDisp, velUnit, headDisp, headUnit;
  if (unitMode === 'imperial') {
    const toP = v => v * 0.000145038;
    dpDisp = toP(dpTotal); dpPipeDisp = toP(dpPipe); dpMinorDisp = toP(dpMinor); dpElevDisp = toP(dpElev);
    dpUnit = 'psi'; velDisp = V * 3.28084; velUnit = 'ft/s';
    headDisp = headLoss * 3.28084; headUnit = 'ft';
  } else {
    const toBar = v => v / 100000;
    dpDisp = toBar(dpTotal); dpPipeDisp = toBar(dpPipe); dpMinorDisp = toBar(dpMinor); dpElevDisp = toBar(dpElev);
    dpUnit = 'bar'; velDisp = V; velUnit = 'm/s';
    headDisp = headLoss; headUnit = 'm';
  }

  const warnings = [];
  if (V > 3 && rho > 500)
    warnings.push(`High velocity ${V.toFixed(2)} m/s — erosion risk above 3 m/s for liquids.`);
  else if (V > 15)
    warnings.push(`Very high velocity ${V.toFixed(2)} m/s — erosion and noise concern.`);
  if (Re >= 2300 && Re < 4000)
    warnings.push('Transitional regime (Re 2300–4000). Friction factor uncertainty ±20–30%.');
  if (Re < 4000 && Ktot > 0)
    warnings.push('Fittings equivalent length (Le) less reliable in laminar/transitional flow.');

  return {
    ok: true,
    dpDisp, dpPipeDisp, dpMinorDisp, dpElevDisp, dpUnit,
    velDisp, velUnit, headDisp, headUnit,
    Re, f, Ktot,
    regime, regimeClass,
    Leq, epsTotalMm: eps, foulingMm,
    P_hyd, P_shaft, P_motor,
    Qs, dpTotal, dpPipe, dpMinor, dpElev,
    uncertPct, warnings,
    per100label: unitMode === 'imperial' ? 'ΔP per 100 ft' : 'ΔP per 100 m',
    lenUnit:  unitMode === 'imperial' ? 'ft' : 'm',
    diamUnit: unitMode === 'imperial' ? 'in' : 'mm',
    diameter: D_orig, length: L_orig, dz: dz_orig,
  };
}

/* ═══════════════════════════════════════════════════════════════
   HAZEN-WILLIAMS CALCULATION ENGINE
═══════════════════════════════════════════════════════════════ */
function calcHW(inputs) {
  const { D_mm, L_m, Q_m3h, C } = inputs;
  if (D_mm <= 0 || L_m <= 0 || Q_m3h <= 0 || C <= 0)
    return { ok: false, error: 'All inputs must be positive values.' };

  const D_m  = D_mm / 1000;
  const Q_s  = Q_m3h / 3600;
  const hf   = 10.67 * L_m * Math.pow(Q_s, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.8704));
  if (!isFinite(hf) || hf < 0) return { ok: false, error: 'Calculation error — check inputs.' };

  const S    = hf / L_m;
  const A    = Math.PI * D_m * D_m / 4;
  const V    = Q_s / A;
  const rho  = 998, g = 9.81;
  const dpPa = hf * rho * g;
  const dpBar = dpPa / 1e5;

  const warnings = [
    '⚠ Hazen-Williams is valid only for water between 5–30°C (fully turbulent, Re > 100,000, D > 50 mm).'
  ];
  if (V > 3) warnings.push(`⚠ Velocity ${V.toFixed(2)} m/s exceeds 3 m/s — erosion risk.`);
  if (C < 80) warnings.push(`⚠ C = ${C} indicates severely fouled/corroded pipe.`);

  return {
    ok: true,
    hf, dpBar, S, V, C,
    per100m: (hf / L_m * 100),
    warnings,
  };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HANDLER
═══════════════════════════════════════════════════════════════ */
async function pressureDrop_handler(req, res) {
  setCORS_pdrop(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed');

  let body;
  try {
    body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
  } catch {
    return err(res, 400, 'Invalid JSON body');
  }

  const action = sanitizeString(body.action, 32);

  /* ── ACTION: fluidList ── */
  if (action === 'fluidList') {
    const list = FLUID_DB_pdrop.map(f => ({
      id:    f.id,
      name:  f.name,
      cat:   f.cat,
      isGas: f.isGas,
    }));
    return res.status(200).json({ ok: true, fluids: list });
  }

  /* ── ACTION: fluidProps ── */
  if (action === 'fluidProps') {
    const id    = sanitizeString(body.fluidId, 64);
    const T_C   = sanitizeNumber(body.T_C);
    const P_bar = sanitizeNumber(body.P_bar, 1.0);

    if (!id || T_C === null || !isFinite(T_C))
      return err(res, 400, 'fluidId and T_C are required');
    if (T_C < -273 || T_C > 2000)
      return err(res, 400, 'T_C out of reasonable range');

    const props = calcFluidProps(id, T_C, P_bar);
    if (!props) return err(res, 404, `Unknown fluid: ${id}`);
    return res.status(200).json({ ok: true, ...props });
  }

  /* ── ACTION: fittingsList ── */
  if (action === 'fittingsList') {
    const list = Object.entries(FITTING_CATALOGUE).map(([id, v]) => ({
      id, label: v.label, k: v.k,
    }));
    return res.status(200).json({ ok: true, fittings: list });
  }

  /* ── ACTION: calculate (Darcy-Weisbach) ── */
  if (action === 'calculate') {
    const D         = sanitizeNumber(body.D);
    const L         = sanitizeNumber(body.L);
    const Q         = sanitizeNumber(body.Q);
    const rho       = sanitizeNumber(body.rho);
    const mu        = sanitizeNumber(body.mu);
    const dz        = sanitizeNumber(body.dz, 0);
    const epsBase   = sanitizeNumber(body.epsBase, 0.046);
    const foulingMm = sanitizeNumber(body.foulingMm, 0);
    const pumpEff   = Math.max(0.01, Math.min(1, sanitizeNumber(body.pumpEff, 0.75)));
    const motorEff  = Math.max(0.01, Math.min(1, sanitizeNumber(body.motorEff, 0.92)));
    const unitMode  = body.unitMode === 'imperial' ? 'imperial' : 'metric';
    const isGasFluid = !!body.isGasFluid;

    // Sanitize fittings array
    const rawFits = Array.isArray(body.fittings) ? body.fittings.slice(0, 200) : [];
    const fittings = rawFits.map(f => ({
      k:   sanitizeNumber(f.k, 0),
      qty: Math.max(0, Math.min(999, parseInt(f.qty) || 0)),
    }));

    if ([D, L, Q, rho, mu].some(v => v === null))
      return err(res, 400, 'D, L, Q, rho, mu are required');

    const result = calcPressureDrop({ D, L, Q, rho, mu, dz, epsBase, foulingMm, fittings, pumpEff, motorEff, unitMode });
    if (!result.ok) return err(res, 422, result.error);

    if (isGasFluid)
      result.warnings.unshift('⚠ Compressible fluid detected. Darcy-Weisbach with constant density is approximate. Valid only if ΔP/P₁ < 10%.');

    return res.status(200).json(result);
  }

  /* ── ACTION: calcHW (Hazen-Williams) ── */
  if (action === 'calcHW') {
    const D_mm  = sanitizeNumber(body.D_mm);
    const L_m   = sanitizeNumber(body.L_m);
    const Q_m3h = sanitizeNumber(body.Q_m3h);
    const C     = sanitizeNumber(body.C);

    if ([D_mm, L_m, Q_m3h, C].some(v => v === null))
      return err(res, 400, 'D_mm, L_m, Q_m3h, C are required');

    const result = calcHW({ D_mm, L_m, Q_m3h, C });
    if (!result.ok) return err(res, 422, result.error);
    return res.status(200).json(result);
  }

  return err(res, 400, `Unknown action: ${action}`);
};

// ── End of Section 08: Pressure Drop Calculator ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E  ►  VESSEL & SEPARATOR SIZING
// Route: /api/vessel-separator-sizing  (also: /api/calculate — legacy alias)
// (Original: SECTION 15 of 21)
// ══════════════════════════════════════════════════════════════════════════════
// SECTION 15 of 21  ►  VESSEL & SEPARATOR SIZING
// Route: /api/vessel-separator-sizing
// Source: vessel-separator-sizing.js
// ══════════════════════════════════════════════════════════════════════════════

// Vercel Serverless API — Vessel & Separator Sizing Calculator
// Repo: github.com/nagtesting/nagtesting
// Path: /api/calculate.js
// ============================================================

// ========================================================================
// SECTION: NPSH VESSEL
// ========================================================================

// ── UNIT CONVERSION LIBRARY ──────────────────────────────────
function toM3h(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'm3h')    return val;
  if (u === 'm3s')    return val * 3600;
  if (u === 'ft3min') return val * 1.69901;
  if (u === 'mmscfd') return val * 1179.869;
  if (u === 'bpd')    return val * 0.00662458;
  if (u === 'gpm')    return val * 0.227125;
  return val;
}

function toKgm3(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'kgm3')  return val;
  if (u === 'lbft3') return val * 16.01846;
  return val;
}

function toMPag(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'MPa')  return val;
  if (u === 'barg') return val * 0.1;
  if (u === 'psi')  return val * 0.00689476;
  if (u === 'kPa')  return val * 0.001;
  if (u === 'ksi')  return val * 6.89476;
  return val;
}

function toBara(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'bara') return val;
  if (u === 'barg') return val + 1.01325;
  if (u === 'psia') return val * 0.0689476;
  if (u === 'psig') return (val + 14.696) * 0.0689476;
  if (u === 'MPa')  return val * 10;
  if (u === 'MPag') return val * 10 + 1.01325;
  return val;
}

function toMm(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'mm') return val;
  if (u === 'm')  return val * 1000;
  if (u === 'in') return val * 25.4;
  if (u === 'ft') return val * 304.8;
  return val;
}

function toMPaStress(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'MPa') return val;
  if (u === 'psi') return val * 0.00689476;
  if (u === 'ksi') return val * 6.89476;
  return val;
}

function toC(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'C') return val;
  if (u === 'F') return (val - 32) / 1.8;
  if (u === 'K') return val - 273.15;
  return val;
}

function toMs(val, u) {
  if (!isFinite(val)) return NaN;
  if (u === 'ms')  return val;
  if (u === 'fts') return val * 0.3048;
  return val;
}

// ── PRESSURE CORRECTION (GPSA Fig.7-3) ───────────────────────
function kPcorr(K_base, P_bara) {
  if (!isFinite(P_bara) || P_bara <= 7.0) return K_base;
  const corr = Math.max(0.45, 1 - 0.0040 * (P_bara - 7.0));
  return K_base * corr;
}

// ── STANDARD DIAMETERS ────────────────────────────────────────
const STD_D = [.30,.40,.50,.61,.762,.914,1.067,1.219,1.372,1.524,1.676,1.829,2.032,2.134,2.438,2.743,3.048,3.658,4.267];
function nearestStd(d) {
  if (!isFinite(d) || d <= 0) return STD_D[0];
  const f = STD_D.find(x => x >= d);
  return f !== undefined ? f : Math.ceil(d * 100) / 100;
}

const NPS = [
  [15,15.8,'½"'],[20,20.9,'¾"'],[25,26.6,'1"'],[40,40.9,'1½"'],[50,52.5,'2"'],
  [80,77.9,'3"'],[100,102.3,'4"'],[150,154.1,'6"'],[200,202.7,'8"'],[250,254.5,'10"'],
  [300,304.8,'12"'],[350,333.3,'14"'],[400,381,'16"'],[450,428.7,'18"'],
  [500,477.9,'20"'],[600,574.7,'24"'],[750,720,'30"']
];
function nearestNPS(dmm) {
  if (!isFinite(dmm) || dmm <= 0) return NPS[0];
  return NPS.find(n => n[1] >= dmm) || NPS[NPS.length - 1];
}

// ── CALC 1: HORIZONTAL 2-PHASE ────────────────────────────────
function calcH2P(p) {
  const Qg      = toM3h(p.Qg, p.Qg_u);
  const Ql      = toM3h(p.Ql, p.Ql_u);
  const rhog    = toKgm3(p.rhog, p.rhog_u);
  const rhol    = toKgm3(p.rhol, p.rhol_u);
  const T_C     = toC(p.T, p.T_u);
  const P_bara  = toBara(p.P, p.P_u);
  const tr      = parseFloat(p.tr);
  const LD      = parseFloat(p.LD);
  const K       = parseFloat(p.K);
  const surge   = parseFloat(p.surge);
  const margPct = parseFloat(p.margin) / 100;
  const llfrac  = parseFloat(p.llfrac);
  const svcFactor = parseFloat(p.svcFactor);

  if ([Qg,Ql,rhog,rhol,tr,LD,K].some(x => !isFinite(x) || x <= 0))
    return { error: 'Fill all flow, density and sizing fields with positive values.' };
  if (rhog >= rhol)
    return { error: 'Gas density must be less than liquid density.' };
  if (LD < 1.5 || LD > 8)
    return { error: 'L/D must be between 1.5 and 8 for a horizontal separator.' };

  const K_pcorr  = isFinite(P_bara) && P_bara > 0 ? kPcorr(K, P_bara) : K;
  const K_eff    = K_pcorr * svcFactor;
  const Uterm    = K_eff * Math.sqrt((rhol - rhog) / rhog);
  const Udesign  = margPct * Uterm;
  if (Udesign <= 0) return { error: 'Udesign ≤ 0 — check K and densities.' };

  const Qg_s      = Qg / 3600;
  const Ql_s      = Ql / 3600;
  const Vl_surge  = Ql_s * tr * 60 * surge;
  const D_liq     = Math.cbrt(Vl_surge / (llfrac * Math.PI / 4 * LD));
  const A_gas_req = Qg_s / Udesign;
  const D_gas     = Math.sqrt(A_gas_req / ((1 - llfrac) * Math.PI / 4));
  const D_calc    = Math.max(D_liq, D_gas);
  const D_std     = nearestStd(D_calc);
  const L         = Math.ceil(LD * D_std * 2) / 2;
  const A_gas_act = (1 - llfrac) * Math.PI * D_std * D_std / 4;
  const Uact      = Qg_s / A_gas_act;
  const ratio     = Uact / Uterm;
  const V_vessel  = Math.PI * D_std * D_std / 4 * L;
  const governs   = D_gas >= D_liq ? 'Gas velocity' : 'Liquid retention';

  let warns = [], status = 'PASS';
  if (ratio > margPct)   { warns.push(`⚠ Gas velocity ratio ${(ratio*100).toFixed(1)}% exceeds margin ${(margPct*100).toFixed(0)}%. Upsize vessel.`); status = 'WARN'; }
  if (LD < 2 || LD > 5)   warns.push(`⚠ L/D=${LD.toFixed(1)} outside typical 2–5 range for horizontal separators.`);
  if (svcFactor < 1.0)     warns.push(`⚠ Service derating applied (×${svcFactor}). Verify K with separator internals vendor.`);
  if (K_pcorr < K)         warns.push(`ℹ P-correction applied: K ${K.toFixed(4)} → K_pcorr ${K_pcorr.toFixed(4)} m/s.`);
  if (isFinite(T_C)) {
    if (T_C > 260) warns.push('⚠ T>260°C: Verify allowable stress S at operating temp (ASME Sec.II Part D).');
    if (T_C < -29) warns.push('⚠ T<−29°C: MDMT and Charpy impact testing per ASME UCS-66 may apply.');
  }
  if (D_std > 4.0) warns.push(`⚠ D=${D_std.toFixed(2)} m exceeds 4.0 m shop fabrication limit. Field fabrication or special transport required.`);
if (D_std > 4.267) warns.push(`⚠ D=${D_std.toFixed(2)} m exceeds standard vessel diameter list. Verify availability with fabricator.`);
  return {
    status, warns,
    results: [
      { label:'Calc. Min. D',         value: D_calc.toFixed(3)+' m', warn: false },
      { label:'Std. Vessel D',         value: D_std.toFixed(3)+' m ('+( D_std*39.37).toFixed(0)+'")', warn: false },
      { label:'Seam–Seam Length',      value: L.toFixed(1)+' m', warn: false },
      { label:'Actual L/D',            value: (L/D_std).toFixed(2), warn: (L/D_std)<2||(L/D_std)>5 },
      { label:'K_eff (P×svc)',         value: K_eff.toFixed(4)+' m/s', warn: K_eff<K },
      { label:'Uterm',                 value: Uterm.toFixed(3)+' m/s', warn: false },
      { label:'Udesign',               value: Udesign.toFixed(3)+' m/s', warn: false },
      { label:'Actual Gas Vel.',       value: Uact.toFixed(3)+' m/s', warn: ratio>margPct },
      { label:'Velocity Ratio',        value: (ratio*100).toFixed(1)+'%', warn: ratio>margPct },
      { label:'Liq. Hold-up (surged)', value: Vl_surge.toFixed(3)+' m³', warn: false },
      { label:'Vessel Volume',         value: V_vessel.toFixed(2)+' m³', warn: false },
      { label:'Governs',               value: governs, warn: false },
    ],
    summary: `Qg=${Qg.toFixed(1)} m³/h | Ql=${Ql.toFixed(1)} m³/h | ρg=${rhog.toFixed(2)} kg/m³ | ρl=${rhol.toFixed(1)} kg/m³${isFinite(T_C)?' | T='+T_C.toFixed(0)+'°C':''} | tr=${tr}min | surge×${surge} | llfrac=${(llfrac*100).toFixed(0)}%`
  };
}

// ── CALC 2: VERTICAL 2-PHASE ──────────────────────────────────
function calcV2P(p) {
  const Qg       = toM3h(p.Qg, p.Qg_u);
  const Ql       = toM3h(p.Ql, p.Ql_u);
  const rhog     = toKgm3(p.rhog, p.rhog_u);
  const rhol     = toKgm3(p.rhol, p.rhol_u);
  const T_C      = toC(p.T, p.T_u);
  const P_bara   = toBara(p.P, p.P_u);
  const tr       = parseFloat(p.tr);
  const K        = parseFloat(p.K);
  const surge    = parseFloat(p.surge);
  const margPct  = parseFloat(p.margin) / 100;
  const boot     = parseFloat(p.boot) || 0.3;
  const intern   = parseFloat(p.intern) || 0.4;
  const svcFactor = parseFloat(p.svcFactor);

  if ([Qg,Ql,rhog,rhol,tr,K].some(x => !isFinite(x) || x <= 0))
    return { error: 'Fill all fields with positive values.' };
  if (rhog >= rhol)
    return { error: 'Gas density must be less than liquid density.' };

  const K_pcorr  = isFinite(P_bara) && P_bara > 0 ? kPcorr(K, P_bara) : K;
  const K_eff    = K_pcorr * svcFactor;
  const Uterm    = K_eff * Math.sqrt((rhol - rhog) / rhog);
  const Udesign  = margPct * Uterm;
  if (Udesign <= 0) return { error: 'Udesign ≤ 0.' };

  const Qg_s       = Qg / 3600;
  const Ql_s       = Ql / 3600;
  const A_req      = Qg_s / Udesign;
  const D_min      = Math.sqrt(4 * A_req / Math.PI);
  const D_std      = nearestStd(D_min);
  const A_std      = Math.PI * D_std * D_std / 4;
  const Uact       = Qg_s / A_std;
  const ratio      = Uact / Uterm;
  const Vl_surge   = Ql_s * tr * 60 * surge;
  const H_liq_bare = Vl_surge / A_std;
  const H_liq_design = H_liq_bare + boot + 0.15;
  const H_shell    = H_liq_design + 0.6 * D_std + intern;
  const HD         = H_shell / D_std;

  let warns = [], status = 'PASS';
  if (ratio > margPct) { warns.push(`⚠ Gas velocity ${(ratio*100).toFixed(1)}% of Uterm exceeds ${(margPct*100).toFixed(0)}% margin.`); status = 'WARN'; }
  if (HD < 2 || HD > 6) { warns.push(`⚠ H/D=${HD.toFixed(2)} outside typical range 2–6. Check vessel proportions.`); if (HD > 6) status = 'WARN'; }
  if (svcFactor < 1.0) warns.push(`⚠ Service derating ×${svcFactor} applied.`);
  if (K_pcorr < K)     warns.push(`ℹ P-correction: K ${K.toFixed(4)} → ${K_pcorr.toFixed(4)} m/s.`);
  if (isFinite(T_C)) {
    if (T_C > 260) warns.push('⚠ T>260°C: Verify S at operating temp.');
    if (T_C < -29) warns.push('⚠ T<−29°C: MDMT check per ASME UCS-66.');
  }
  if (D_std > 4.0) warns.push(`⚠ D=${D_std.toFixed(2)} m: field fabrication required.`);
  if (D_std > 4.267) warns.push(`⚠ D=${D_std.toFixed(2)} m exceeds standard diameter list. Confirm availability with fabricator.`);

  return {
    status, warns,
    results: [
      { label:'Min. Calc. D',           value: D_min.toFixed(3)+' m', warn: false },
      { label:'Std. Vessel D',           value: D_std.toFixed(3)+' m ('+( D_std*39.37).toFixed(0)+'")', warn: false },
      { label:'Uterm',                   value: Uterm.toFixed(3)+' m/s', warn: false },
      { label:'Actual Gas Vel.',         value: Uact.toFixed(3)+' m/s', warn: ratio>margPct },
      { label:'Velocity Ratio',          value: (ratio*100).toFixed(1)+'%', warn: ratio>margPct },
      { label:'Liq. Hold-up (surged)',   value: Vl_surge.toFixed(3)+' m³', warn: false },
      { label:'Liq. Height (bare)',      value: H_liq_bare.toFixed(3)+' m', warn: false },
      { label:'Liq. Section (design)',   value: H_liq_design.toFixed(2)+' m', warn: false },
      { label:'Min. Shell Height',       value: H_shell.toFixed(2)+' m', warn: false },
      { label:'H/D Ratio',               value: HD.toFixed(2), warn: HD>6 },
    ],
    summary: `K_eff=${K_eff.toFixed(4)} | ρg=${rhog.toFixed(2)} | ρl=${rhol.toFixed(1)} kg/m³${isFinite(T_C)?' | T='+T_C.toFixed(0)+'°C':''} | tr=${tr}min | surge×${surge} | boot=${boot}m`
  };
}

// ── CALC 3: 3-PHASE HORIZONTAL ────────────────────────────────
function calc3P(p) {
  const Qg    = toM3h(p.Qg, p.Qg_u);
  const Qo    = toM3h(p.Qo, p.Qo_u);
  const Qw    = toM3h(p.Qw, p.Qw_u);
  const rhog  = toKgm3(p.rhog, p.rhog_u);
  const rhoo  = toKgm3(p.rhoo, p.rhoo_u);
  const rhow  = toKgm3(p.rhow, p.rhow_u);
  const P_bara = toBara(p.P, p.P_u);
  const tro   = parseFloat(p.tro);
  const trw   = parseFloat(p.trw);
  const LD    = parseFloat(p.LD);
  const K     = parseFloat(p.K);
  const surge = parseFloat(p.surge);
  const dp_um = parseFloat(p.dp_um);
  const mu_cP = parseFloat(p.mu_cP);
  const boot  = parseFloat(p.boot) || 0.3;
  const icm   = parseFloat(p.icm)  || 0.15;
  const svcFactor = parseFloat(p.svcFactor);
const platePack = p.platePack === true || p.platePack === 'true';
  const ppCredit  = platePack ? 0.60 : 1.0;
  if ([Qg,Qo,Qw,rhog,rhoo,rhow,tro,trw,LD,K].some(x => !isFinite(x)) || Qg<=0 || Qo<=0 || Qw<=0)
    return { error: 'Fill all fields with positive values.' };
  if (rhog >= rhoo || rhog >= rhow)
    return { error: 'Gas density must be less than both liquid densities.' };
  if (rhoo >= rhow)
    return { error: 'Oil density must be less than water density for normal separation.' };

  const Qg_s = Qg/3600, Qo_s = Qo/3600, Qw_s = Qw/3600;
  const K_pcorr  = isFinite(P_bara) && P_bara > 0 ? kPcorr(K, P_bara) : K;
  const K_eff    = K_pcorr * svcFactor;
  const Uterm    = K_eff * Math.sqrt((rhoo - rhog) / rhog);
  const Udesign  = 0.85 * Uterm;
   const Vo = Qo_s * tro * 60 * surge * ppCredit;
  const Vw = Qw_s * trw * 60 * surge * ppCredit;
  const Vliq     = Vo + Vw;
  const fo       = Vliq > 0 ? Vo / Vliq : 0;
  const D_liq    = Math.cbrt(Vliq / (0.5 * Math.PI / 4 * LD));
  const A_gas_req = Qg_s / Udesign;
  const D_gas    = Math.sqrt(8 * A_gas_req / Math.PI);
  const D        = Math.max(D_liq, D_gas);
  const D_std    = nearestStd(D);
  const L        = Math.ceil(LD * D_std * 2) / 2;
  const A_std    = Math.PI * D_std * D_std / 4;
  const A_gas_avail = 0.5 * A_std;
  const Uact     = Qg_s / A_gas_avail;
  const ratio    = Uact / Uterm;

  let stokesInfo = null;
  let stokesOk   = null;
  if (isFinite(dp_um) && dp_um > 0 && isFinite(mu_cP) && mu_cP > 0) {
    const dp_m    = dp_um * 1e-6;
    const mu_Pas  = mu_cP * 1e-3;
    const Vs      = dp_m * dp_m * (rhow - rhoo) * 9.81 / (18 * mu_Pas);
    const vLiq_fwd = (Qo_s + Qw_s) / (0.5 * A_std);
    const tDwell  = vLiq_fwd > 0 ? L / vLiq_fwd : 0;
    const H_settle_avail = Vs * tDwell;
    const H_water_layer  = Vw / (A_std * 0.5);
    stokesOk  = H_settle_avail >= H_water_layer;
    stokesInfo = { Vs: Vs.toFixed(5), tDwell: tDwell.toFixed(0), H_settle_avail: H_settle_avail.toFixed(3), H_water_layer: H_water_layer.toFixed(3), ok: stokesOk };
  }

  const H_oil  = fo > 0 ? Vo / (A_std * 0.5) : 0;
  const H_water_calc  = Vw > 0 ? Vw / (A_std * 0.5) : 0;
  const H_boot_design = H_water_calc + boot + icm;

  let warns = [], status = 'PASS';
  if (ratio > 0.85) { warns.push(`⚠ Gas velocity ${(ratio*100).toFixed(1)}% of Uterm. Upsize or add internals.`); status = 'WARN'; }
  if (stokesOk === false) { warns.push('⚠ Stokes check: oil droplet may NOT settle in available time. Increase L/D, reduce dp requirement, or add coalescer pack.'); status = 'WARN'; }
  if (svcFactor < 1.0) warns.push(`⚠ Service derating ×${svcFactor} applied to K.`);
  warns.push('ℹ 3-phase sized by retention time + Stokes check only. Emulsion, dynamic interface and upset behaviour require engineer review.');
  if (platePack) warns.push('ℹ Plate pack credit applied: retention time reduced by 40% per API 12J §6.4.4. Plate pack must be designed and installed per vendor specification. Credit valid only when plates cover full liquid cross-section.');

  return {
    status, warns, stokesInfo,
    results: [
      { label:'Std. Vessel D',           value: D_std.toFixed(3)+' m ('+( D_std*39.37).toFixed(0)+'")', warn: false },
      { label:'Vessel Length',           value: L.toFixed(2)+' m', warn: false },
      { label:'Oil Hold-up (surged)',    value: Vo.toFixed(3)+' m³', warn: false },
      { label:'Water Hold-up (surged)',  value: Vw.toFixed(3)+' m³', warn: false },
      { label:'Total Liquid Vol.',       value: Vliq.toFixed(3)+' m³', warn: false },
      { label:'Gas Uterm',               value: Uterm.toFixed(3)+' m/s', warn: false },
      { label:'Actual Gas Vel.',         value: Uact.toFixed(3)+' m/s', warn: ratio>0.85 },
      { label:'Oil Pad Height (est.)',   value: H_oil.toFixed(3)+' m', warn: false },
      { label:'Water Boot (design)',     value: H_boot_design.toFixed(3)+' m', warn: false },
      { label:'Oil Fraction',            value: (fo*100).toFixed(1)+'%', warn: false },
      { label:'Plate Pack Credit', value: platePack ? '✅ 40% applied (API 12J)' : 'Not applied', warn: false },
    ],
    summary: `K_eff=${K_eff.toFixed(4)} | ρg=${rhog.toFixed(2)} | ρo=${rhoo.toFixed(1)} | ρw=${rhow.toFixed(1)} kg/m³ | tro=${tro} | trw=${trw} min | icm=${icm}m`
  };
}

// ── CALC 4: PRESSURE VESSEL THICKNESS (ASME VIII) ─────────────
const ASME_STRESS_TABLE = {
  'SA516_70':  { name:'SA-516 Gr 70 (CS)',          S_amb:138, S_200:138, S_260:138, S_315:128, S_370:114, mdmt:-29  },
  'SA516_60':  { name:'SA-516 Gr 60 (CS)',          S_amb:118, S_200:118, S_260:118, S_315:110, S_370: 97, mdmt:-29  },
  'SA515_70':  { name:'SA-515 Gr 70 (CS HT)',       S_amb:138, S_200:138, S_260:138, S_315:128, S_370:114, mdmt:  0  },
  'SA387_11':  { name:'SA-387 Gr 11 Cl 2 (Cr-Mo)',  S_amb:155, S_200:155, S_260:155, S_315:150, S_370:145, mdmt:-29  },
  'SA387_22':  { name:'SA-387 Gr 22 Cl 2 (Cr-Mo)',  S_amb:138, S_200:138, S_260:138, S_315:134, S_370:128, mdmt:-29  },
  'SA240_304L':{ name:'SA-240 Tp 304L (SS)',         S_amb:115, S_200:107, S_260: 97, S_315: 87, S_370: 80, mdmt:-196 },
  'SA240_316L':{ name:'SA-240 Tp 316L (SS)',         S_amb:115, S_200:107, S_260: 97, S_315: 87, S_370: 80, mdmt:-196 },
  'SA240_317L':{ name:'SA-240 Tp 317L (SS)',         S_amb:115, S_200:108, S_260: 99, S_315: 90, S_370: 82, mdmt:-196 },
  'SA240_2205':{ name:'SA-240 S31803 Duplex 2205',   S_amb:172, S_200:158, S_260:144, S_315:130, S_370:null,mdmt:-50  },
  'SA333_6':   { name:'SA-333 Gr 6 (LTCS)',          S_amb:138, S_200:138, S_260:138, S_315:128, S_370:null,mdmt:-45  },
  'SA537_1':   { name:'SA-537 Cl 1 (HSLA)',          S_amb:155, S_200:155, S_260:148, S_315:138, S_370:null,mdmt:-29  },
};

function asmeStressAtTemp(matKey, T_C) {
  const m = ASME_STRESS_TABLE[matKey];
  if (!m) return null;
  if (!isFinite(T_C)) return m.S_amb;
  if (T_C <= 100) return m.S_amb;
  if (T_C <= 230) return m.S_200;
  if (T_C <= 285) return m.S_260;
  if (T_C <= 340) return m.S_315;
  return m.S_370 ?? m.S_315;
}

function calcPV(p) {
  const P      = toMPag(p.P, p.P_u);
  const D_mm   = toMm(p.D, p.D_u);
  const CA     = toMm(p.CA, p.CA_u);
  const head   = p.head;
  const minT   = parseFloat(p.minT);
  const T_C    = toC(p.T, p.T_u);
  const cat    = p.cat;
  const L_mm   = toMm(p.L, p.L_u);
  const matKey = p.matKey || '';
  const noz    = Array.isArray(p.nozzles) ? p.nozzles : [];

  // Material / Stress resolution
  let S, S_note = null;
  const matEntry = ASME_STRESS_TABLE[matKey];
  if (matEntry && isFinite(T_C)) {
    S = asmeStressAtTemp(matKey, T_C);
    S_note = `${matEntry.name} | S at ${T_C.toFixed(0)}°C = ${S} MPa (ASME Sec.II Part D)`;
    if (T_C > 400) S_note += ' ⚠ Above 400°C — verify S from Sec.II Part D table directly.';
  } else {
    S = toMPaStress(p.S, p.S_u);
  }

  const E = parseFloat(p.E);

  if ([P,D_mm,S,E,CA].some(x => !isFinite(x) || isNaN(x)) || P<=0 || D_mm<=0 || S<=0 || E<=0)
    return { error: 'Fill all design parameters with valid positive values.' };
  if (E > 1.0 || E < 0.1)
    return { error: 'Joint efficiency E must be 0.10 to 1.00.' };

  const R = D_mm / 2;
  if ((S*E - 0.6*P) <= 0)
    return { error: 'S×E−0.6×P ≤ 0: pressure exceeds allowable for this material/joint. Check inputs.' };

  // Shell UG-27
  const t_sh_calc = (P * R) / (S * E - 0.6 * P);
  const t_sh_net  = t_sh_calc + CA;
  const t_sh_nom  = Math.max(minT, Math.ceil(t_sh_net * 2) / 2);

  // Head
  let t_hd_calc = 0, head_label = '', headOk = true;
  if (head === 'ellipsoidal') {
    const d2 = 2*S*E - 0.2*P; headOk = d2 > 0;
    if (headOk) t_hd_calc = (P * D_mm) / d2;
    head_label = '2:1 Ellipsoidal [UG-32(d)]';
  } else if (head === 'hemispherical') {
    const d2 = 2*S*E - 0.2*P; headOk = d2 > 0;
    if (headOk) t_hd_calc = (P * R) / d2;
    head_label = 'Hemispherical [UG-32(f)]';
  } else if (head === 'conical30') {
    const a = 30*Math.PI/180, d2 = 2*Math.cos(a)*(S*E - 0.6*P); headOk = d2 > 0;
    if (headOk) t_hd_calc = (P * D_mm) / d2;
    head_label = 'Conical α=30° [UG-32(g)]';
  } else if (head === 'conical45') {
    const a = 45*Math.PI/180, d2 = 2*Math.cos(a)*(S*E - 0.6*P); headOk = d2 > 0;
    if (headOk) t_hd_calc = (P * D_mm) / d2;
    head_label = 'Conical α=45° [UG-32(g)]';
  } else {
    t_hd_calc = D_mm * Math.sqrt(0.162 * P / (S * E));
    head_label = 'Flat Cover [UG-34 simplified]';
    headOk = true;
  }
  const t_hd_net = headOk ? t_hd_calc + CA : 0;
  const t_hd_nom = headOk ? Math.max(minT, Math.ceil(t_hd_net * 2) / 2) : 0;

  const MAWP        = (S * E * t_sh_nom) / (R + 0.6 * t_sh_nom);
  const P_hyd       = 1.3 * MAWP;
  const thick_ratio = P / (S * E);

  // ── HEAD VOLUME ──────────────────────────────────────────────
  const D_m = D_mm / 1000;
  const t_sh = t_sh_nom / 1000;
  const t_hd = t_hd_nom / 1000;
  let V_head = 0, V_head_label = '';
  if (headOk) {
    if (head === 'ellipsoidal') {
      V_head = (Math.PI / 24) * Math.pow(D_m, 3);
      V_head_label = 'Ellipsoidal head (per head)';
    } else if (head === 'hemispherical') {
      V_head = (Math.PI / 12) * Math.pow(D_m, 3);
      V_head_label = 'Hemispherical head (per head)';
    } else if (head === 'conical30' || head === 'conical45') {
      const alpha = head === 'conical30' ? 30 : 45;
      const H_cone = (D_m / 2) / Math.tan(alpha * Math.PI / 180);
      V_head = (Math.PI / 12) * Math.pow(D_m / 2, 2) * H_cone;
      V_head_label = `Conical α=${alpha}° head (per head)`;
    } else {
      V_head = 0; V_head_label = 'Flat cover (no head volume)';
    }
  }
  const L_eff_m = isFinite(L_mm) && L_mm > 0 ? L_mm / 1000 : null;
  const V_shell = L_eff_m ? (Math.PI / 4) * Math.pow(D_m, 2) * L_eff_m : null;
  const V_total = (V_shell !== null) ? V_shell + 2 * V_head : null;

  // ── VESSEL EMPTY WEIGHT ──────────────────────────────────────
  const rho_steel = isFinite(parseFloat(p.rho_steel)) ? parseFloat(p.rho_steel) : 7850;
  let W_shell = null, W_heads = null, W_total = null;
  if (L_eff_m) {
    W_shell = Math.PI * D_m * L_eff_m * t_sh * rho_steel;
    const hd_sf = head === 'ellipsoidal' ? 1.09 :
                  head === 'hemispherical' ? 1.0 :
                  head === 'conical30' ? 1/Math.cos(30*Math.PI/180) :
                  head === 'conical45' ? 1/Math.cos(45*Math.PI/180) : 1.0;
    W_heads = 2 * (Math.PI / 4) * Math.pow(D_m, 2) * t_hd * rho_steel * hd_sf;
    W_total = W_shell + W_heads;
  }

  // ── UG-37 NOZZLE REINFORCEMENT ───────────────────────────────
  const ug37Results = [];
  if (noz.length > 0) {
    noz.forEach((nz, i) => {
      const dn = toMm(parseFloat(nz.d), nz.d_u || 'mm');
      const tn = toMm(parseFloat(nz.t), nz.t_u || 'mm');
      if (!isFinite(dn) || dn <= 0) return;
      const tr     = t_sh_calc;
      const F      = 1.0;
      const A_req  = dn * tr * F;
      const A_shell  = (2 * dn) * (t_sh_nom - t_sh_calc);
      const A_nozzle = isFinite(tn) && tn > 0
        ? 2 * Math.min(2.5 * t_sh_nom, 2.5 * tn) * tn : 0;
      const A_avail  = A_shell + A_nozzle;
      const reinf_ok = A_avail >= A_req;
      const pad_req  = reinf_ok ? 0 : A_req - A_avail;
      ug37Results.push({
        id: nz.id || `N${i+1}`,
        dn: dn.toFixed(0), tr: tr.toFixed(2),
        A_req: A_req.toFixed(1), A_avail: A_avail.toFixed(1),
        ok: reinf_ok,
        pad_req: pad_req > 0 ? pad_req.toFixed(0) : '—'
      });
    });
  }

  // ── WARNINGS ─────────────────────────────────────────────────
  let warns = [], status = 'PASS';
  if (S_note) warns.push(`ℹ ${S_note}`);
  if (head === 'flat') warns.push('⚠ Flat cover: UG-34 simplified formula only. Real flat covers require full UG-34 analysis including attachment weld classification, bolt loading, and effective gasket seating width. Engineer review mandatory.');
  if (head === 'conical45') warns.push('⚠ α=45° conical: approaching practical limit. Knuckle reinforcement per UG-33 likely required.');
  if (!headOk) warns.push('⚠ Head denominator ≤ 0 — head calculation invalid. Pressure exceeds allowable.');
  if (thick_ratio > 0.385) { warns.push('⚠ P/(S×E) > 0.385 — ASME UG-27 thin-wall formula is no longer valid. Use ASME Appendix 1-2 thick-wall formula: t = R[e^(P/SE) − 1]. Consult a certified PV engineer.'); status = 'WARN'; }
  else if (thick_ratio > 0.3) warns.push('⚠ P/(S×E) > 0.3 — approaching thin-wall formula limit (0.385). Consider ASME App.1-2 thick-wall analysis for accuracy.');
  if (isFinite(T_C)) {
    if (T_C > 260 && !matEntry) warns.push('⚠ T>260°C: Verify allowable stress S at operating temperature from ASME Sec.II Part D. Tabulated S may be lower than ambient value.');
    if (T_C < -29) warns.push('⚠ T<−29°C: MDMT and Charpy impact testing per ASME UCS-66 apply. Do not use standard CS at this temperature without impact test verification.');
    if (matEntry && T_C < matEntry.mdmt) warns.push(`⚠ T=${T_C.toFixed(0)}°C is below MDMT of ${matEntry.name} (MDMT=${matEntry.mdmt}°C). Charpy impact testing per UCS-66 required or switch to lower-MDMT material.`);
  }
  if (noz.length === 0) warns.push('ℹ UG-37 nozzle reinforcement: No nozzles entered. Add nozzle data to check reinforcement. All openings in pressure vessels require UG-37 area replacement analysis.');
  else {
    const failNoz = ug37Results.filter(n => !n.ok);
    if (failNoz.length > 0) {
      warns.push(`⚠ UG-37: ${failNoz.length} nozzle(s) require reinforcement pad: ${failNoz.map(n=>`${n.id} (need ${n.pad_req} mm² more)`).join(', ')}.`);
      status = 'WARN';
    } else {
      warns.push(`✅ UG-37: All ${ug37Results.length} nozzle(s) pass reinforcement check.`);
    }
  }
  if (cat === 'detailed') warns.push('ℹ Detailed design category selected — this tool gives preliminary sizing only. Full ASME Sec.VIII Div.1 review by a qualified PV engineer required.');
  if (!headOk || thick_ratio > 0.5) status = 'WARN';

  // ── RESULTS ──────────────────────────────────────────────────
  const results = [
    { label:'Shell: t_calc',        value: t_sh_calc.toFixed(2)+' mm  ('+(t_sh_calc/25.4).toFixed(3)+'")', warn: false },
    { label:'Shell: t + CA',        value: t_sh_net.toFixed(2)+' mm', warn: false },
    { label:'Shell: t_nominal',     value: t_sh_nom.toFixed(1)+' mm  ('+(t_sh_nom/25.4).toFixed(3)+'")', warn: t_sh_nom<minT },
    { label:head_label+': t_calc',  value: headOk ? t_hd_calc.toFixed(2)+' mm' : 'INVALID', warn: !headOk, cls: headOk ? '' : 'f' },
    { label:head_label+': t_nom',   value: headOk ? t_hd_nom.toFixed(1)+' mm' : '—', warn: false },
    { label:'MAWP (shell nom.)',     value: MAWP.toFixed(3)+' MPag  ('+(MAWP/0.1).toFixed(1)+' barg)', warn: false },
    { label:'Design Pressure',      value: P.toFixed(3)+' MPag  ('+(P/0.1).toFixed(1)+' barg)', warn: false },
    { label:'P/(S×E) ratio',        value: thick_ratio.toFixed(4), warn: thick_ratio>0.385 },
    { label:'Hydrotest (~1.3×MAWP)',value: P_hyd.toFixed(3)+' MPag', warn: false },
    { label:'Corrosion Allow.',     value: CA.toFixed(1)+' mm', warn: false },
  ];

  // Head volume
  if (headOk && V_head > 0) {
    results.push({ label: V_head_label,    value: V_head.toFixed(4)+' m³  ('+(V_head*1000).toFixed(1)+' L)', warn: false });
    results.push({ label: '2× Head Volume',value: (2*V_head).toFixed(4)+' m³', warn: false });
  }

  // Shell + total volume
  if (V_shell !== null) {
    results.push({ label:'Shell Volume (inside)', value: V_shell.toFixed(3)+' m³  ('+(V_shell*1000).toFixed(0)+' L)', warn: false });
    results.push({ label:'Total Vessel Volume',   value: V_total.toFixed(3)+' m³  ('+(V_total*1000).toFixed(0)+' L)', warn: false });
  }

  // Vessel weight
  if (W_total !== null) {
    results.push({ label:'Shell Empty Weight', value: W_shell.toFixed(0)+' kg  ('+(W_shell*2.20462).toFixed(0)+' lb)', warn: false });
    results.push({ label:'Heads Empty Weight', value: W_heads.toFixed(0)+' kg  ('+(W_heads*2.20462).toFixed(0)+' lb)', warn: false });
    results.push({ label:'Total Empty Weight', value: W_total.toFixed(0)+' kg  ('+(W_total*2.20462).toFixed(0)+' lb)', warn: W_total>50000 });
  }

  // UG-37 nozzle rows
  if (ug37Results.length > 0) {
    ug37Results.forEach(n => {
      results.push({
        label: `UG-37 Nozzle ${n.id} (DN${n.dn}mm)`,
        value: `A_req=${n.A_req}mm² | A_avail=${n.A_avail}mm² | Pad=${n.pad_req}mm² → ${n.ok?'✅ PASS':'⚠ NEEDS PAD'}`,
        warn: !n.ok
      });
    });
  }

  return {
    status, warns,
    results,
    ug37: ug37Results,
    summary: `ASME Sec.VIII Div.1 | ID=${D_mm.toFixed(0)} mm (${(D_mm/25.4).toFixed(2)}") | S=${S.toFixed(1)} MPa | E=${E.toFixed(2)}${isFinite(T_C)?' | T='+T_C.toFixed(0)+'°C':''}${L_eff_m?' | L='+L_eff_m.toFixed(2)+'m':''}`
  };
}

// ── CALC 5: DEMISTER / MIST ELIMINATOR ───────────────────────
function calcMist(p) {
  const Qg     = toM3h(p.Qg, p.Qg_u);
  const rhog   = toKgm3(p.rhog, p.rhog_u);
  const rhol   = toKgm3(p.rhol, p.rhol_u);
  const margin = parseFloat(p.margin) / 100;
  const mtype  = p.mtype;
  const Km     = { wiremesh:0.107, vane:0.18, cyclonic:0.25 };
  let K_base   = mtype === 'custom' ? parseFloat(p.K) : (Km[mtype] || 0.107);
  const svcFactor  = parseFloat(p.svcFactor);
  const pcorrMode  = p.pcorrMode;
  const orient     = p.orient;

  if ([Qg, rhog, rhol, K_base, margin].some(x => !isFinite(x) || x <= 0))
    return { error: 'Fill all fields with positive values.' };
  if (rhog >= rhol)
    return { error: 'Gas density must be less than liquid density.' };

  const Qg_s = Qg / 3600;
  let K_pcorr_val = K_base;
  if (pcorrMode === 'auto') {
    const Pbara = toBara(p.P, p.P_u);
    if (isFinite(Pbara) && Pbara > 0) K_pcorr_val = kPcorr(K_base, Pbara);
  }
  const K_eff   = K_pcorr_val * svcFactor;
  const Uterm   = K_eff * Math.sqrt((rhol - rhog) / rhog);
  const Udesign = margin * Uterm;
  if (Udesign <= 0) return { error: 'Udesign ≤ 0.' };

  const A_req  = Qg_s / Udesign;
  const D_min  = Math.sqrt(4 * A_req / Math.PI);
  const D_std  = nearestStd(D_min);
  const A_std  = Math.PI * D_std * D_std / 4;
  const Uact   = Qg_s / A_std;
  const ratio  = Uact / Uterm;

  let warns = [], status = 'PASS';
  if (ratio > margin) { warns.push(`⚠ Velocity ratio ${(ratio*100).toFixed(1)}% exceeds margin ${(margin*100).toFixed(0)}%.`); status = 'WARN'; }
  if (K_pcorr_val < K_base) warns.push(`ℹ P-correction: K_base=${K_base.toFixed(4)} → K_pcorr=${K_pcorr_val.toFixed(4)} m/s (GPSA Fig.7-3).`);
  if (svcFactor < 1.0) warns.push(`ℹ Service factor ×${svcFactor} applied.`);

  return {
    status, warns,
    results: [
      { label:'K_base',              value: K_base.toFixed(4)+' m/s', warn: false },
      { label:'K_pcorr (pressure)',  value: K_pcorr_val.toFixed(4)+' m/s', warn: K_pcorr_val<K_base },
      { label:'K_eff (P+service)',   value: K_eff.toFixed(4)+' m/s', warn: K_eff<K_base },
      { label:'Uterm',               value: Uterm.toFixed(3)+' m/s', warn: false },
      { label:'Udesign',             value: Udesign.toFixed(3)+' m/s', warn: false },
      { label:'Required Area',       value: A_req.toFixed(4)+' m²', warn: false },
      { label:'Min. Diameter',       value: D_min.toFixed(3)+' m', warn: false },
      { label:'Std. Vessel D',       value: D_std.toFixed(3)+' m', warn: false },
      { label:'Actual Velocity',     value: Uact.toFixed(3)+' m/s', warn: ratio>margin },
      { label:'Velocity Ratio',      value: (ratio*100).toFixed(1)+'%', warn: ratio>margin },
      { label:'Service Factor',      value: '×'+svcFactor, warn: false },
      { label:'Orientation',         value: orient, warn: false },
    ],
    summary: `Type=${mtype} | K_eff=${K_eff.toFixed(4)} m/s | Margin=${(margin*100).toFixed(0)}% | ρg=${rhog.toFixed(2)} | ρl=${rhol.toFixed(1)} kg/m³`
  };
}

// ── CALC 6: NOZZLE SIZING ─────────────────────────────────────
const NZ_SVC = {
  'gas-inlet':  { vel:25,  rhov2:4000 },
  'gas-outlet': { vel:20,  rhov2:4000 },
  'liq-inlet':  { vel:2,   rhov2:15000 },
  'liq-outlet': { vel:1.5, rhov2:15000 },
  'manway':     { vel:20,  rhov2:4000 },
  'drain':      { vel:1,   rhov2:10000 },
};

function calcNozzle(p) {
  const Q_m3h   = toM3h(p.Q, p.Q_u);
  const vel     = toMs(p.vel, p.vel_u);
  const rho     = toKgm3(p.rho, p.rho_u);
  const svc     = p.svc;
  const rhov2_lim = parseFloat(p.rhov2) || (NZ_SVC[svc]?.rhov2 || 4000);

  if ([Q_m3h, vel, rho].some(x => !isFinite(x) || x <= 0))
    return { error: 'Fill flow rate, velocity and density with positive values.' };

  const Q_m3s    = Q_m3h / 3600;
  const A_req    = Q_m3s / vel;
  const D_calc_mm = Math.sqrt(4 * A_req / Math.PI) * 1000;
  const nps      = nearestNPS(D_calc_mm);
  const D_sel_m  = nps[1] / 1000;
  const A_sel    = Math.PI * D_sel_m * D_sel_m / 4;
  const v_act    = Q_m3s / A_sel;
  const rhov2_act = rho * v_act * v_act;
  const rhov2_ok  = rhov2_act <= rhov2_lim;

  let warns = [], status = 'OK';
  if (!rhov2_ok) { warns.push(`⚠ ρv²=${rhov2_act.toFixed(0)} Pa exceeds ${rhov2_lim.toFixed(0)} Pa limit for ${svc}. Upsize nozzle.`); status = 'WARN'; }
  if (v_act > vel) { warns.push(`⚠ Actual vel ${v_act.toFixed(2)} m/s exceeds design ${vel.toFixed(2)} m/s. Consider next NPS up.`); status = 'WARN'; }
  warns.push('ℹ UG-37 nozzle reinforcement analysis NOT performed. Required for all pressure vessel nozzles per ASME Sec.VIII.');

  return {
    status, warns,
    results: [
      { label:'Min. Calc. ID',           value: D_calc_mm.toFixed(1)+' mm', warn: false },
      { label:'Selected NPS',            value: nps[2]+' (DN '+nps[0]+')', warn: false },
      { label:'Selected ID (Sch40)',     value: nps[1].toFixed(1)+' mm ('+( nps[1]/25.4).toFixed(2)+'")', warn: false },
      { label:'Design Velocity',         value: vel.toFixed(2)+' m/s', warn: false },
      { label:'Actual Velocity',         value: v_act.toFixed(3)+' m/s', warn: v_act>vel*1.05 },
      { label:'Fluid Density',           value: rho.toFixed(2)+' kg/m³', warn: false },
      { label:'ρv² Actual',              value: rhov2_act.toFixed(0)+' Pa', warn: !rhov2_ok },
      { label:'ρv² Limit',               value: rhov2_lim.toFixed(0)+' Pa', warn: false },
      { label:'Momentum Check',          value: rhov2_ok ? '✅ PASS' : '⚠ EXCEED', warn: !rhov2_ok },
    ],
    summary: `Service: ${svc} | Q=${Q_m3h.toFixed(2)} m³/h | ρ=${rho.toFixed(2)} kg/m³ | Sch: ${p.sch}`
  };
}


// ═══════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// SERVER-SIDE SECURITY: Engineering constants & input sanitiser
// Transferred from client HTML — these must never live in the browser.
// Called by handle_vessel_separator() before any calc function runs.
// ════════════════════════════════════════════════════════════════════════════

// ── 1. JOINT EFFICIENCY MAP (ASME VIII Table UW-12) ──────────────────────
// Previously: syncE() in HTML lines 1776–1780 set this in the browser.
// Now:        API enforces the correct E for each weld category.
// HTML must send only body.cat (the category string); E is resolved here.
const JOINT_EFF_MAP = {
  '1.0':  1.00,   // Full radiography — Cat. 1 (RT-1)
  '0.85': 0.85,   // Spot radiography — Cat. 2 (RT-2)
  '0.70': 0.70,   // No radiography   — Cat. 3 (RT-3)
  '0.65': 0.65,   // Fillet weld, no RT
  '0.50': 0.50,   // Double fillet, no RT
};

// ── 2. DEMISTER K-FACTOR MAP (GPSA Fig.7-3 base values) ──────────────────
// Previously: const Km = {wiremesh:0.107, vane:0.18, cyclonic:0.25}
//             lived in HTML syncMistK() (HTML lines 1799–1814).
// Now:        API owns these values. Custom K is validated against limits.
const DEMISTER_K_MAP = {
  wiremesh: 0.107,
  vane:     0.18,
  cyclonic: 0.25,
};
const DEMISTER_K_MIN = 0.02;   // absolute lower bound — any K below this is physically unrealistic
const DEMISTER_K_MAX = 0.40;   // absolute upper bound per GPSA

// ── 3. NOZZLE SERVICE LIMITS (API RP 14E / Shell DEP 31.22.05.12) ────────
// Previously: const NZ_SVC_CLIENT lived in HTML lines 1834–1841.
//             setNzDefaults() pre-filled vel and rhov2 fields in the browser.
// Now:        API owns the authoritative service limits.
//             HTML sends only the service type string (body.svc).
//             vel and rhov2 supplied by the client are accepted only if
//             they do NOT exceed the API limits — otherwise API limits win.
const NZ_SVC_LIMITS = {
  'gas-inlet':  { vel_max: 25,  rhov2_max: 4000  },
  'gas-outlet': { vel_max: 20,  rhov2_max: 4000  },
  'liq-inlet':  { vel_max: 2,   rhov2_max: 15000 },
  'liq-outlet': { vel_max: 1.5, rhov2_max: 15000 },
  'manway':     { vel_max: 20,  rhov2_max: 4000  },
  'drain':      { vel_max: 1,   rhov2_max: 10000 },
};

// ── 4. ENGINEERING DEFAULTS (code-based minimums) ────────────────────────
// Previously: DEFAULTS object in HTML lines 1638–1644 pre-filled fields.
// Now:        API applies these when client sends blank / zero / missing values.
const VS_DEFAULTS = {
  h2p:  { tr: 3,      LD: 3,   K: 0.107, surge: 1.25, margin: 85, svcFactor: 1.0, llfrac: 0.5 },
  v2p:  { tr: 3,      K: 0.107, surge: 1.25, margin: 85, boot: 0.3, intern: 0.4, svcFactor: 1.0 },
  '3ph':{ tro: 3,     trw: 3,  LD: 4,   K: 0.107, surge: 1.25,
  dp_um: 200, mu_cP: 2.0, boot: 0.3, icm: 0.15, svcFactor: 1.0 },
  pv:   { E: 1.0,     CA: 3,   minT: 3.175 },
  mist: { margin: 80, K: 0.107, svcFactor: 1.0, orient: 'horizontal' },
  nz:   { vel: 20,    rhov2: 4000 },
};

// ── 5. MASTER INPUT SANITISER ─────────────────────────────────────────────
// Call this at the top of handle_vessel_separator() before dispatch.
// Returns a sanitised, safe copy of body — never mutates the original.
function sanitiseVesselInputs(body) {
  const rawType = body.type || body.calculator || '';
  const type = rawType === '3p' ? '3ph' : rawType;
  const b    = { ...body };   // shallow copy — safe to mutate
  const def  = VS_DEFAULTS[type] || {};

  const applyDefault = (field, fallback) => {
    const v = parseFloat(b[field]);
    if (!isFinite(v) || v <= 0) b[field] = fallback;
  };

  // ── Common defaults by calc type ──
  switch (type) {
    case 'h2p':
      applyDefault('tr',     def.tr);
      applyDefault('LD',     def.LD);
      applyDefault('K',      def.K);
      applyDefault('surge',  def.surge);
      applyDefault('margin', def.margin);
      // Clamp margin to 50–100 %
      b.margin = Math.min(100, Math.max(50, parseFloat(b.margin) || def.margin));
      const sf_h2p = parseFloat(b.svcFactor);
      const lf = parseFloat(b.llfrac);
      if (!isFinite(lf) || lf <= 0 || lf >= 1) b.llfrac = def.llfrac;
      if (!isFinite(sf_h2p) || sf_h2p <= 0) b.svcFactor = def.svcFactor;
      break;

    case 'v2p':
      applyDefault('tr',     def.tr);
      applyDefault('K',      def.K);
      applyDefault('surge',  def.surge);
      applyDefault('margin', def.margin);
      applyDefault('boot',   def.boot);
      applyDefault('intern', def.intern);
      b.margin = Math.min(100, Math.max(50, parseFloat(b.margin) || def.margin));
      const sf_v2p = parseFloat(b.svcFactor);
      if (!isFinite(sf_v2p) || sf_v2p <= 0) b.svcFactor = def.svcFactor;
      break;

    case '3ph':
      applyDefault('tro',   def.tro);
      applyDefault('trw',   def.trw);
      applyDefault('LD',    def.LD);
      applyDefault('K',     def.K);
      applyDefault('surge', def.surge);
      applyDefault('dp_um', def.dp_um);
      applyDefault('mu_cP', def.mu_cP);
      applyDefault('boot',  def.boot);
      applyDefault('icm',   def.icm);
      const sf_3ph = parseFloat(b.svcFactor);
      if (!isFinite(sf_3ph) || sf_3ph <= 0) b.svcFactor = def.svcFactor;
      break;

    case 'pv': {
      // Joint efficiency: resolve from category string; ignore raw E from client
      const cat = String(b.cat || '1.0');
      b.E = JOINT_EFF_MAP[cat] ?? 1.0;   // server owns this — client cannot override

      // Corrosion allowance minimum: never below 0, apply code default if missing
      const ca = parseFloat(b.CA);
      if (!isFinite(ca) || ca < 0) b.CA = def.CA;

      // Minimum thickness: must be a positive number
      const mt = parseFloat(b.minT);
      if (!isFinite(mt) || mt <= 0) b.minT = def.minT;
      break;
    }

    case 'mist': {
      // K-factor: resolve from device type; only accept custom K within bounds
      const mtype = String(b.mtype || 'wiremesh');
      if (mtype !== 'custom') {
        b.K = DEMISTER_K_MAP[mtype] ?? 0.107;  // server owns base K
      } else {
        const kc = parseFloat(b.K);
        if (!isFinite(kc) || kc < DEMISTER_K_MIN || kc > DEMISTER_K_MAX) {
          return { __sanitiseError: `Custom K must be between ${DEMISTER_K_MIN} and ${DEMISTER_K_MAX} m/s.` };
        }
      }
      b.margin = Math.min(100, Math.max(50, parseFloat(b.margin) || def.margin));
      const sf_mist = parseFloat(b.svcFactor);
      if (!isFinite(sf_mist) || sf_mist <= 0) b.svcFactor = def.svcFactor;
      if (!b.orient || b.orient.trim() === '') b.orient = def.orient;
      break;
    }

    case 'nozzle': {
      // Nozzle service: apply API limits — client cannot raise them
      const svc     = String(b.svc || 'gas-outlet');
      const limits  = NZ_SVC_LIMITS[svc];
      if (!limits) {
        return { __sanitiseError: `Unknown nozzle service type: "${svc}".` };
      }
      // If client sent vel or rhov2 above the API limit, clamp to the API limit
      const vel_in   = parseFloat(b.vel);
      const rhov2_in = parseFloat(b.rhov2);
      b.vel   = isFinite(vel_in)   ? Math.min(vel_in,   limits.vel_max)   : limits.vel_max;
      b.rhov2 = isFinite(rhov2_in) ? Math.min(rhov2_in, limits.rhov2_max) : limits.rhov2_max;
      break;
    }
  }

  // ── High-pressure guard: reject absurd pressure values ──
  const Pval = parseFloat(b.P);
  if (isFinite(Pval) && Pval > 5000) {
    return { __sanitiseError: 'Operating pressure exceeds 5000 bar — check units or input value.' };
  }

  return b;  // sanitised body, safe to pass to calc functions
}
// ── End of security/sanitisation block ───────────────────────────────────

// ═══════════════════════════════════════════════════════════════════
// Internal dispatcher — routes by body.type to the correct calc function
// ═══════════════════════════════════════════════════════════════════
async function handle_vessel_separator(req, body, res) {
  
  const safe = sanitiseVesselInputs(body);
  if (safe.__sanitiseError)
    return res.status(422).json({ ok: false, error: safe.__sanitiseError });

  const type = safe.type || safe.calculator || '';

  // Dispatch map
  // type values match what the frontend sends in body.type:
  //   'h2p'    — Horizontal 2-Phase separator
  //   'v2p'    — Vertical 2-Phase separator
  //   '3p'     — 3-Phase separator (horizontal)
  //   'pv'     — Pressure Vessel wall thickness (ASME Sec.VIII Div.1)
  //   'mist'   — Mist Eliminator sizing
  //   'nozzle' — Nozzle sizing (ρv² method)

  let result;
  switch (type) {
    case 'h2p':    result = calcH2P(safe);    break;
    case 'v2p':    result = calcV2P(safe);    break;
     case '3p':
    case '3ph':    result = calc3P(safe);     break;
    case 'pv':     result = calcPV(safe);     break;
    case 'mist':   result = calcMist(safe);   break;
    case 'nozzle': result = calcNozzle(safe); break;
    default:
      return res.status(400).json({
        ok: false,
        error: `Unknown calculator type: "${type}". Valid values: h2p, v2p, 3p, pv, mist, nozzle`
      });
  }

  if (result && result.error)
    return res.status(422).json({ ok: false, error: result.error });

  return res.status(200).json({ ok: true, ...result });
}

// ════════════════════════════════════════════════════════════════════════════
// Vercel handler — entry point for /api/vessel-separator-sizing
// ════════════════════════════════════════════════════════════════════════════

// ── handle_calculate — internal dispatcher called by vesselSeparator_handler ──
// NOTE: All calc functions (calcH2P, calcV2P, calc3P, calcPV, calcMist, calcNozzle,
//       sanitiseVesselInputs) are declared above in SECTION E.
async function handle_calculate(body, res) {
  const { calc, params } = body || {};
  if (!calc || !params) {
    return res.status(400).json({ error: 'Missing calc type or params.' });
  }
  // Inject type so sanitiseVesselInputs knows which case to run
  const safeParams = sanitiseVesselInputs({ ...params, type: calc === '3ph' ? '3ph' : calc });
  if (safeParams.__sanitiseError)
    return res.status(422).json({ ok: false, error: safeParams.__sanitiseError });
  let result;
  try {
    switch (calc) {
      case 'h2p':    result = calcH2P(safeParams);    break;
      case 'v2p':    result = calcV2P(safeParams);    break;
      case '3ph':    result = calc3P(safeParams);     break;
      case 'pv':     result = calcPV(safeParams);     break;
      case 'mist':   result = calcMist(safeParams);   break;
      case 'nozzle': result = calcNozzle(safeParams); break;
      default:
        return res.status(400).json({ error: `Unknown calc type: ${calc}` });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Calculation error: ' + err.message });
  }
  return res.status(200).json(result);
}

async function vesselSeparator_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body;
  if (!body || typeof body !== 'object')
    return res.status(400).json({ error: 'Invalid request body.' });

  try {
    return await handle_calculate(body, res);
  } catch (e) {
    console.error('[vessel-separator-sizing.js] Unhandled error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

// ── End of Section 15: Vessel & Separator Sizing ──────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
