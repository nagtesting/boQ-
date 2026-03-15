// ════════════════════════════════════════════════════════════════════════════
// api/index.js  —  MERGED VERCEL SERVERLESS API  (single-file, 21 calculators)
// ════════════════════════════════════════════════════════════════════════════
//
// HOW THIS FILE IS STRUCTURED
// ───────────────────────────
// 1. ROUTER  (top)   — inspects req.url and dispatches to the correct handler
// 2. SECTIONS 01-21  — each calculator's complete code in one continuous block
//                      Nothing from one calculator leaks into another.
//
// ROUTE MAP
// ─────────
//   01. /api/compressor                           →  compressor_handler
//   02. /api/control-valve                        →  controlValve_handler
//   03. /api/cooling-tower                        →  coolingTower_handler
//   04. /api/eos                                  →  eos_handler
//   05. /api/fan                                  →  fan_handler
//   06. /api/heatxpert                            →  heatxpert_handler
//   07. /api/orifice-flow                         →  orificeFlow_handler
//   08. /api/pressure-drop-calculator             →  pressureDrop_handler
//   09. /api/psychrometric                        →  psychrometric_handler
//   10. /api/pump                                 →  pump_handler
//   11. /api/rankine                              →  rankine_handler
//   12. /api/steam-quench                         →  steamQuench_handler
//   13. /api/steam-turbine-power                  →  steamTurbine_handler
//   14. /api/steam                                →  steam_handler
//
// TROUBLESHOOTING TIP
// ───────────────────
// Search for  "SECTION XX"  to jump directly to a calculator's code block.
// Sections 01–14: original 14 calculators
// Sections 15–21: vessel, npsh, civil, instrumentation, electrical, mechanical, moc
// Each section is fully self-contained: helper functions, constants, and the
// handler are all within the same contiguous block.
//
// ════════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════════
// ROUTER  —  dispatches incoming requests to the correct calculator handler
// ════════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // Set CORS headers for every request
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Derive route key from the request URL path
  // Supports both  /api/compressor  and  /api/compressor?foo=bar
  const url      = req.url || '';
  const pathname = url.split('?')[0];                // strip query string
  const segments = pathname.replace(/\/+$/, '')      // strip trailing slash
                           .split('/')
                           .filter(Boolean);
  // Last path segment is the calculator key  (e.g. "compressor")
  const key = segments[segments.length - 1] || '';

  switch (key) {

    case 'compressor':
      return await compressor_handler(req, res);

    case 'control-valve':
      return await controlValve_handler(req, res);

    case 'cooling-tower':
      return await coolingTower_handler(req, res);

    case 'eos':
      return await eos_handler(req, res);

    case 'fan':
      return await fan_handler(req, res);

    case 'heatxpert':
      return await heatxpert_handler(req, res);

    case 'orifice-flow':
      return await orificeFlow_handler(req, res);

    case 'pressure-drop-calculator':
      return await pressureDrop_handler(req, res);

    case 'psychrometric':
      return await psychrometric_handler(req, res);

    case 'pump':
      return await pump_handler(req, res);

    case 'rankine':
      return await rankine_handler(req, res);

    case 'steam-quench':
      return await steamQuench_handler(req, res);

    case 'steam-turbine-power':
      return await steamTurbine_handler(req, res);

    case 'steam':
      return await steam_handler(req, res);

    // ── Legacy / alias routes ────────────────────────────────────────────────
    // '/api/calculate' appeared in older HTML comments; both calculators that
    // referenced it (steam-turbine-power, psychrometric) now use their proper
    // named routes above. This case is kept as a safety net.
    case 'calculate':
      // Vessel & Separator HTML calls /api/calculate — route it there
      return await vesselSeparator_handler(req, res);

    // ── Additional calculators (sections 15–21) ──────────────────────────────
    case 'vessel-separator-sizing':
      return await vesselSeparator_handler(req, res);

    case 'npsh-calculator':
      return await npsh_handler(req, res);

    case 'civil-engineering-calculators':
      return await civil_handler(req, res);

    case 'instrumentation-calculators':
      return await instrumentation_handler(req, res);

    case 'electrical-engineering-calculators':
      return await electrical_handler(req, res);

    case 'mechanical-engineering-calculators':
      return await mechanical_handler(req, res);

    case 'moc':
      return await moc_handler(req, res);

    default:
      return res.status(404).json({
        error: `Unknown calculator route: "${key}". ` +
               `Valid routes: compressor, control-valve, cooling-tower, eos, fan, heatxpert, orifice-flow, pressure-drop-calculator, psychrometric, pump, rankine, steam-quench, steam-turbine-power, steam, vessel-separator-sizing, npsh-calculator, civil-engineering-calculators, instrumentation-calculators, electrical-engineering-calculators, mechanical-engineering-calculators, moc`,
      });
  }
}

// ── End of Router ────────────────────────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
// SECTION 01 of 21  ►  COMPRESSOR
// Route: /api/compressor
// Source: compressor.js
// ══════════════════════════════════════════════════════════════════════════════

// api/compressor.js  — Vercel Serverless Function
// Isentropic & polytropic compression thermodynamics — server-side only.
//
// AUDIT v2 — fixes applied:
//  [FIX-1] GAS_LIBRARY extended with all 9 gases missing from v1
//           (co, steam, ethylene, propylene, h2s, chlorine, so2, hcl, acetylene)
//  [FIX-2] gamma_in ?? gasEntry.gamma  (nullish coalescing — replaces falsy ||)
//  [FIX-3] Full server-side input validation added (n_stages, eta, T1, P1, etc.)
//  [FIX-4] n_stages < 1 now throws instead of silently returning P_shaft = 0
//  [FIX-5] eta_mec = 0 / eta_drv = 0 now caught by validation before calc
//  [FIX-6] Server-side manual stage ratio product validation added
//  [FIX-7] Intercooler T_ic > T_out_act warning added to response
//  [FIX-8] CORS headers + OPTIONS preflight handler added
//  [FIX-9] Infinity/NaN guard on all power outputs before return
//
// AUDIT v3 — deep diagnostic (line-by-line):
//  [FIX-10] CRITICAL: polytropicIndex() formula corrected for compression.
//           Old: n = γ/(γ − η·(γ−1))  ← turbine/expansion form — gives T_out < T_is (impossible)
//           New: n = 1/(1 − (γ−1)/(γ·η))  ← compression form — gives T_out > T_is  ✓

/* ─── Physical constants ─────────────────────────────────────────────── */
const R_UNIV = 8314.46261815;  // J/(kmol·K)  NIST universal gas constant

/* ─── Gas property library (protected — not exposed to client) ───────── */
const GAS_LIBRARY = {
  // Permanent gases (ideal-gas behaviour adequate for most pressures)
  air:        { name: 'Air',                   gamma: 1.400, M: 28.970,  realGas: false },
  nitrogen:   { name: 'Nitrogen (N₂)',         gamma: 1.400, M: 28.014,  realGas: false },
  oxygen:     { name: 'Oxygen (O₂)',           gamma: 1.395, M: 31.999,  realGas: false },
  hydrogen:   { name: 'Hydrogen (H₂)',         gamma: 1.405, M:  2.016,  realGas: false },
  helium:     { name: 'Helium (He)',           gamma: 1.667, M:  4.003,  realGas: false },
  argon:      { name: 'Argon (Ar)',            gamma: 1.667, M: 39.948,  realGas: false },
  co:         { name: 'Carbon Monoxide (CO)',  gamma: 1.400, M: 28.010,  realGas: false },
  // Hydrocarbons & refrigerants — real-gas deviations common at high P
  methane:    { name: 'Methane (CH₄)',         gamma: 1.308, M: 16.043,  realGas: false },
  ethane:     { name: 'Ethane (C₂H₆)',         gamma: 1.186, M: 30.069,  realGas: true  },
  propane:    { name: 'Propane (C₃H₈)',        gamma: 1.130, M: 44.097,  realGas: true  },
  nbutane:    { name: 'n-Butane (C₄H₁₀)',      gamma: 1.094, M: 58.123,  realGas: true  },
  ethylene:   { name: 'Ethylene (C₂H₄)',       gamma: 1.238, M: 28.054,  realGas: true  },
  propylene:  { name: 'Propylene (C₃H₆)',      gamma: 1.148, M: 42.081,  realGas: true  },
  acetylene:  { name: 'Acetylene (C₂H₂)',      gamma: 1.232, M: 26.038,  realGas: true  },
  // CO₂ & inorganic process gases
  co2:        { name: 'Carbon Dioxide (CO₂)',  gamma: 1.289, M: 44.010,  realGas: true  },
  steam:      { name: 'Steam (H₂O)',           gamma: 1.135, M: 18.015,  realGas: true  },
  h2s:        { name: 'Hydrogen Sulfide (H₂S)',gamma: 1.320, M: 34.081,  realGas: true  },
  chlorine:   { name: 'Chlorine (Cl₂)',        gamma: 1.340, M: 70.906,  realGas: true  },
  so2:        { name: 'Sulfur Dioxide (SO₂)',  gamma: 1.290, M: 64.065,  realGas: true  },
  hcl:        { name: 'Hydrogen Chloride (HCl)',gamma:1.410, M: 36.461,  realGas: true  },
  ammonia:    { name: 'Ammonia (NH₃)',         gamma: 1.310, M: 17.031,  realGas: true  },
  // Refrigerants
  r717:       { name: 'R-717 (Ammonia)',       gamma: 1.310, M: 17.031,  realGas: true  },
  r22:        { name: 'R-22 (Freon)',          gamma: 1.183, M: 86.468,  realGas: true  },
  r134a:      { name: 'R-134a',               gamma: 1.143, M: 102.03,  realGas: true  },
  r410a:      { name: 'R-410A',               gamma: 1.174, M: 72.585,  realGas: true  },
  r32:        { name: 'R-32',                 gamma: 1.240, M: 52.024,  realGas: true  },
  r290:       { name: 'R-290 (Propane)',       gamma: 1.130, M: 44.097,  realGas: true  },
  r744:       { name: 'R-744 (CO₂)',           gamma: 1.289, M: 44.010,  realGas: true  },
  // Custom (caller must supply gamma and M)
  custom:     { name: 'Custom Gas',            gamma: null,  M: null,    realGas: false },
};

/* ─── Server-side input validation ──────────────────────────────────── */
function validateCompInputs(p) {
  const n = Number(p.n_stages ?? 2);
  if (!Number.isInteger(n) || n < 1 || n > 10)
    return 'n_stages must be an integer between 1 and 10.';

  const required = ['T1', 'P1', 'Q', 'Pout', 'eta', 'eta_mec', 'eta_drv'];
  for (const k of required) {
    if (p[k] === undefined || p[k] === null || !isFinite(Number(p[k])))
      return `Field "${k}" is missing or not a finite number.`;
  }
  const f = k => Number(p[k]);
  // Temperature: accept -273 to 2000 °C (or °F range becomes huge — clamp loosely)
  if (f('T1') < -273)                       return 'Inlet temperature T1 must be > −273 °C (or °F equivalent).';
  if (f('P1') <= 0)                         return 'Inlet pressure P1 must be > 0.';
  if (f('Pout') <= f('P1'))                 return 'Outlet pressure Pout must be > inlet pressure P1.';
  if (f('Q') <= 0)                          return 'Volumetric flow Q must be > 0.';
  if (f('eta')    <= 0 || f('eta')    > 1)  return 'Stage efficiency η must be in (0, 1].';
  if (f('eta_mec') <= 0 || f('eta_mec')> 1) return 'Mechanical efficiency η_mec must be in (0, 1].';
  if (f('eta_drv') <= 0 || f('eta_drv')> 1) return 'Driver efficiency η_drv must be in (0, 1].';

  // Custom gas: gamma and M must be supplied and valid
  if ((p.gas === 'custom' || !GAS_LIBRARY[p.gas]) && !(p.gamma > 1 && p.M > 0))
    return 'Custom gas requires gamma > 1 and M > 0.';

  // Manual stage ratios: product should equal r_total within 2%
  if (p.ratioMode === 'manual' && Array.isArray(p.stageRatios_manual)) {
    const r_total = f('Pout') / f('P1');
    const product = p.stageRatios_manual.reduce((acc, r) => acc * Number(r), 1);
    if (Math.abs(product / r_total - 1) > 0.02)
      return `Manual stage ratios product (${product.toFixed(4)}) differs from total ratio (${r_total.toFixed(4)}) by >2%. Adjust ratios so their product equals Pout/P1.`;
  }
  return null;
}

/* ─── Polytropic index from efficiency ───────────────────────────────── */
// For a compressor, polytropic efficiency is defined such that:
//   (n−1)/n  =  (γ−1) / (γ · η_p)
// → n = 1 / [1 − (γ−1)/(γ·η_p)]
//
// Physical check: η_p < 1  →  exponent > (γ−1)/γ  →  T₂_act > T₂_isentropic  ✓
// The alternative formula n = γ/(γ − η_p(γ−1)) is correct for EXPANSION (turbines),
// where it gives T₂_act < T₂_isentropic.  Using it for compression is a sign error.
function polytropicIndex(gamma, eta_p) {
  return 1 / (1 - (gamma - 1) / (gamma * eta_p));
}

/* ─── Isentropic stage ───────────────────────────────────────────────── */
function isentropicStage(T_in_K, r_stage, gamma, Cp, eta_is, mdot) {
  const T_out_is  = T_in_K * Math.pow(r_stage, (gamma - 1) / gamma);
  const T_out_act = T_in_K + (T_out_is - T_in_K) / eta_is;
  const w_is      = Cp * (T_out_is - T_in_K);   // J/kg isentropic specific work
  const w_act     = w_is / eta_is;               // J/kg actual specific work
  return {
    T_out_act,
    P_is_kW:  mdot * w_is  / 1000,
    P_act_kW: mdot * w_act / 1000,
  };
}

/* ─── Polytropic stage ────────────────────────────────────────────────── */
function polytropicStage(T_in_K, r_stage, gamma, n_poly, R_spec, Cp, mdot) {
  const T_out_act = T_in_K * Math.pow(r_stage, (n_poly - 1) / n_poly);
  const w_act     = (n_poly / (n_poly - 1)) * R_spec * T_in_K
                    * (Math.pow(r_stage, (n_poly - 1) / n_poly) - 1); // J/kg
  const T_out_is  = T_in_K * Math.pow(r_stage, (gamma - 1) / gamma);
  return {
    T_out_act,
    P_is_kW:  mdot * Cp * (T_out_is - T_in_K) / 1000,
    P_act_kW: mdot * w_act / 1000,
  };
}

/* ─── US → SI conversion ─────────────────────────────────────────────── */
function toSI_comp(inp) {
  const T1_C = (inp.T1 - 32) / 1.8;          // °F → °C
  const P1   = inp.P1   * 0.0689476;          // psia → bar
  const Pout = inp.Pout * 0.0689476;
  let Q_m3h  = inp.Q * 1.69901;              // ACFM → m³/h
  if (inp.flowBasis === 'scfm') {
    // Convert SCFM → ACFM at actual conditions (ideal gas)
    const T_std_K = 288.706;   // 60 °F in K
    const P_std   = 1.01325;   // bar
    const T1_K    = T1_C + 273.15;
    Q_m3h = inp.Q * 1.69901 * (P_std / P1) * (T1_K / T_std_K);
  }
  return { T1_C, P1, Pout, Q_m3h };
}

/* ─── Finite guard ───────────────────────────────────────────────────── */
function assertFinite_comp(val, label) {
  if (!isFinite(val))
    throw new Error(`Computed "${label}" is not finite — check input magnitudes.`);
}

/* ─── Main calculation ───────────────────────────────────────────────── */
function compressorCalc(params) {
  const {
    n_stages = 2, T1, P1, Q, Pout,
    gamma: gamma_in, M: M_in,
    eta, eta_mec, eta_drv,
    eff_mode = 'isentropic',
    Cp_override,
    gas = 'air',
    stageRatios_manual,
    ratioMode = 'equal',
    intercoolers = [],
    unitMode  = 'SI',
  } = params;

  /* ── Unit conversion ── */
  let T1_C = T1, P1_bar = P1, Pout_bar = Pout, Q_m3h = Q;
  if (unitMode === 'US') {
    const si = toSI_comp({ T1, P1, Pout, Q, flowBasis: params.flowBasis });
    T1_C = si.T1_C; P1_bar = si.P1; Pout_bar = si.Pout; Q_m3h = si.Q_m3h;
  }

  /* ── Gas properties ──
     Use nullish coalescing (??) so that gamma_in = 0 does NOT silently
     fall through to the library value (0 is invalid anyway, caught above). */
  const gasEntry  = GAS_LIBRARY[gas] ?? GAS_LIBRARY.air;
  const gamma     = gamma_in  ?? gasEntry.gamma;
  const M         = M_in      ?? gasEntry.M;
  const isRealGas = gasEntry.realGas;

  const P_ratio_high = (Pout_bar / P1_bar) > 10;
  const realGasWarn  = isRealGas || P_ratio_high;

  const R_spec        = R_UNIV / M;                        // J/(kg·K)
  const Cp_ideal      = gamma * R_spec / (gamma - 1);      // J/(kg·K)  ideal gas
  const Cp_overridden = !!(Cp_override && Cp_override > 100);
  const Cp            = Cp_overridden ? Cp_override : Cp_ideal;

  /* ── Pressure ratios ── */
  const r_total = Pout_bar / P1_bar;
  let stageRatios;
  if (ratioMode === 'manual' && Array.isArray(stageRatios_manual) && stageRatios_manual.length === n_stages) {
    stageRatios = stageRatios_manual.map(Number);
  } else {
    const r_eq  = Math.pow(r_total, 1 / n_stages);
    stageRatios = Array(n_stages).fill(r_eq);
  }

  /* ── Polytropic index ── */
  const n_poly = polytropicIndex(gamma, eta);

  /* ── Inlet density & mass flow ── */
  const T1_K  = T1_C + 273.15;
  const rho1  = P1_bar * 1e5 * M / (R_UNIV * T1_K);   // kg/m³  ideal gas Z=1
  const Q_m3s = Q_m3h / 3600;
  const mdot  = rho1 * Q_m3s;                           // kg/s

  /* ── Stage-by-stage loop ── */
  let totalActPower = 0;
  let totalIsPower  = 0;
  let T_in = T1_K;
  let P_in = P1_bar;
  const stageData = [];
  const icWarnings = [];

  for (let i = 1; i <= n_stages; i++) {
    const r_stg     = stageRatios[i - 1];
    const P_out_stg = P_in * r_stg;

    let T_out_act, P_is_kW, P_act_kW;
    if (eff_mode === 'isentropic') {
      ({ T_out_act, P_is_kW, P_act_kW } =
          isentropicStage(T_in, r_stg, gamma, Cp, eta, mdot));
    } else {
      ({ T_out_act, P_is_kW, P_act_kW } =
          polytropicStage(T_in, r_stg, gamma, n_poly, R_spec, Cp, mdot));
    }

    totalIsPower  += P_is_kW;
    totalActPower += P_act_kW;

    stageData.push({
      stage:   i,
      P_in,    P_out: P_out_stg, r: r_stg,
      T_in_C:  T_in      - 273.15,
      T_out_C: T_out_act - 273.15,
      P_act_kW,
    });

    /* ── Intercooler between stages ── */
    if (i < n_stages) {
      const ic     = (intercoolers && intercoolers[i - 1]) || {};
      // Use nullish coalescing so 0 °C is a valid intercooler temperature
      const T_ic_C = ic.T_out_C !== undefined && ic.T_out_C !== null
                     ? Number(ic.T_out_C) : 40;
      const dP_ic  = ic.dP_bar  !== undefined && ic.dP_bar  !== null
                     ? Number(ic.dP_bar)  : 0.05;

      // Physical sanity check: cooled temp should be below discharge temp
      const T_out_act_C = T_out_act - 273.15;
      if (T_ic_C >= T_out_act_C) {
        icWarnings.push(
          `Intercooler ${i}: outlet T (${T_ic_C.toFixed(1)} °C) ≥ stage ${i} discharge T (${T_out_act_C.toFixed(1)} °C) — cooling has no effect or heats the gas. Check intercooler settings.`
        );
      }

      stageData.push({
        isIC:     true,
        icNum:    i,
        T_in_C:   T_out_act_C,
        T_out_C:  T_ic_C,
        dP_ic,
        P_in_IC:  P_out_stg,
        P_out_IC: P_out_stg - dP_ic,
      });

      T_in = T_ic_C + 273.15;
      P_in = P_out_stg - dP_ic;
    }
  }

  const P_shaft_total = totalActPower / eta_mec;
  const P_input_total = P_shaft_total / eta_drv;

  // Guard infinite/NaN outputs
  assertFinite_comp(P_shaft_total, 'P_shaft_total');
  assertFinite_comp(P_input_total, 'P_input_total');

  const lastStage = stageData.filter(d => !d.isIC).slice(-1)[0];
  const finalT    = lastStage ? lastStage.T_out_C : 0;

  /* ── Actual outlet pressure (may be < Pout_bar when intercooler dP_ic > 0) ── */
  // The stage loop applies equal pressure ratios but intercooler pressure drops
  // reduce the inlet pressure to each subsequent stage.  The result is that the
  // actual discharge pressure is slightly less than the target (Pout_bar).
  // We compute it from the last stage's P_out so the client can show it and
  // warn the user when the deviation is significant.
  const actual_Pout = lastStage ? lastStage.P_out : Pout_bar;
  const Pout_deviation_pct = Math.abs(actual_Pout - Pout_bar) / Pout_bar * 100;
  const PoutWarn = Pout_deviation_pct > 0.5   // warn if >0.5% off target
    ? `Actual outlet pressure (${actual_Pout.toFixed(3)} bar) differs from target (${Pout_bar.toFixed(3)} bar) by ${Pout_deviation_pct.toFixed(2)}% due to intercooler pressure drops. To hit exactly ${Pout_bar.toFixed(3)} bar, increase the stage pressure ratios to compensate.`
    : null;

  return {
    ok: true,
    // Power
    totalIsPower, totalActPower, P_shaft_total, P_input_total,
    // Gas props
    gamma, M, R_spec, Cp, Cp_overridden, rho1, mdot,
    // Ratios
    r_total, r_stage: stageRatios[0], n_stages,
    // Thermo
    n_poly, eff_mode, eta, eta_mec, eta_drv,
    T1: T1_C, P1: P1_bar, Pout: Pout_bar, actual_Pout,
    // Stages
    stageData,
    // Final discharge temperature
    finalT,
    // Warnings
    realGasWarn, isRealGasRisk: isRealGas, P_ratio_high,
    gasName: gasEntry.name,
    icWarnings: icWarnings.length ? icWarnings : null,
    PoutWarn,
  };
}

/* ─── CORS helper ────────────────────────────────────────────────────── */
function setCORS_comp(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ─── Vercel handler ─────────────────────────────────────────────────── */
function compressor_handler(req, res) {
  setCORS_comp(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body;
  if (!body || typeof body !== 'object')
    return res.status(400).json({ error: 'Invalid request body.' });

  const err = validateCompInputs(body);
  if (err) return res.status(400).json({ error: err });

  try {
    return res.status(200).json(compressorCalc(body));
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Calculation error.' });
  }
}

// ── End of Section 01: Compressor ──────────────────────────────────────────



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
// SECTION 03 of 21  ►  COOLING TOWER
// Route: /api/cooling-tower
// Source: cooling-tower.js
// ══════════════════════════════════════════════════════════════════════════════

// ================================================================
// api/cooling-tower.js  —  Vercel Serverless Function
// 🔐 ALL CALCULATION LOGIC RUNS ON SERVER — NEVER EXPOSED TO BROWSER
// Place this file in your GitHub repo at: /api/cooling-tower.js
// ================================================================

function coolingTower_handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = origin.endsWith('.vercel.app') || origin === 'https://multicalci.com';
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://multicalci.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, params } = req.body;
    if (!action) return res.status(400).json({ error: 'Missing action' });

    if (action === 'calculate') {
      const result = runCalculate(params);
      if (result.error) return res.status(400).json({ error: result.error });
      return res.status(200).json({ success: true, data: result });
    }

    if (action === 'predictCWT') {
      const result = runPredictCWT(params);
      if (result.error) return res.status(400).json({ error: result.error });
      return res.status(200).json({ success: true, data: result });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    return res.status(500).json({ error: 'Server calculation error: ' + err.message });
  }
}

// ================================================================
// 🔐 CORE CALCULATION ENGINE — HIDDEN ON SERVER
// ================================================================

// ── Psychrometric helpers ────────────────────────────────────────

function psat_kPa(T_C) {
  if (T_C <= 60) {
    return 0.61121 * Math.exp((18.678 - T_C / 234.5) * (T_C / (257.14 + T_C)));
  } else {
    const P_mmHg = Math.pow(10, 8.07131 - 1730.63 / (233.426 + T_C));
    return P_mmHg * 0.133322;
  }
}

function saturationEnthalpy(T_C, P_kPa) {
  const psat = psat_kPa(T_C);
  if (psat >= P_kPa) return null;
  const Ws = 0.62198 * psat / (P_kPa - psat);
  return 1.006 * T_C + Ws * (2501 + 1.805 * T_C);
}

function airEnthalpy(Twb_C, P_kPa) {
  return saturationEnthalpy(Twb_C, P_kPa);
}

function cpWater(T_C) {
  const t = T_C;
  return 4.2174 - 0.005618 * t + 1.313e-4 * t * t - 1.014e-6 * t * t * t;
}

function elevToPatm(elev_m) {
  return 101.325 * Math.pow(1 - 2.25577e-5 * elev_m, 5.25588);
}

function rhoWater(T_C) {
  return 999.842 - 0.0624 * T_C - 0.003712 * T_C * T_C;
}

function rhoAir(T_C, Patm_kPa, RH = 1.0) {
  const T_K = T_C + 273.15;
  const pv = RH * psat_kPa(T_C);
  const pd = Patm_kPa - pv;
  return (pd * 0.028964 + pv * 0.018016) / (8.314462e-3 * T_K);
}

// ── KaV/L — Adaptive Chebyshev Integration (CTI ATC-105) ────────

function kavl(cwt_C, hwt_C, wb_C, P_kPa) {
  const range = hwt_C - cwt_C;
  if (range <= 0) return null;
  const h_a = airEnthalpy(wb_C, P_kPa);
  if (h_a === null) return null;

  const fracs = range > 15
    ? [0.05, 0.15, 0.30, 0.45, 0.55, 0.70, 0.85, 0.95]
    : [0.1, 0.4, 0.6, 0.9];
  const n = fracs.length;

  let sum = 0;
  let anyPositive = false;
  for (const f of fracs) {
    const T_i = cwt_C + f * range;
    const h_si = saturationEnthalpy(T_i, P_kPa);
    if (h_si === null) continue;
    const dh = h_si - h_a;
    if (dh < 0.01) continue;
    const cp_i = cpWater(T_i);
    sum += cp_i / dh;
    anyPositive = true;
  }
  if (!anyPositive) return null;
  return (range / n) * sum;
}

// ── CTI κ (Kappa) Solver ─────────────────────────────────────────

function solveCWT(target_kavl, hwt_C, wb_C, P_kPa) {
  let lo = wb_C + 0.01, hi = hwt_C - 0.01;
  if (lo >= hi) return { cwt: null, converged: false };
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const k = kavl(mid, hwt_C, wb_C, P_kPa);
    if (k === null) { lo = mid; continue; }
    if (k > target_kavl) lo = mid; else hi = mid;
    if (hi - lo < 1e-6) break;
  }
  const cwt = (lo + hi) / 2;
  const k_check = kavl(cwt, hwt_C, wb_C, P_kPa);
  const converged = k_check !== null && Math.abs(k_check - target_kavl) / target_kavl < 0.001;
  return { cwt, converged };
}

function computeKappa(cwt_d_C, hwt_d_C, wb_d_C, P_kPa) {
  const kavl_d = kavl(cwt_d_C, hwt_d_C, wb_d_C, P_kPa);
  if (!kavl_d || kavl_d <= 0) return null;

  const approach = cwt_d_C - wb_d_C;
  const delta = Math.max(0.1, Math.min(1.0, approach * 0.03));

  const r_plus = solveCWT(kavl_d, hwt_d_C, wb_d_C + delta, P_kPa);
  const r_minus = solveCWT(kavl_d, hwt_d_C, wb_d_C - delta, P_kPa);

  if (r_plus.cwt === null || r_minus.cwt === null) return null;
  if (!r_plus.converged || !r_minus.converged) return null;

  const kappa = (r_plus.cwt - r_minus.cwt) / (2 * delta);
  if (kappa <= 0 || kappa > 1.5) return null;
  return kappa;
}

function calcPredictedCWT(cwt_d, wb_d, wb_a, kappa) {
  return cwt_d + kappa * (wb_a - wb_d);
}

// ── Status Assessments ───────────────────────────────────────────

function approachSt(dAppVsPred_C, thW_C, thB_C) {
  if (dAppVsPred_C <= 0)       return { cls: 'ok',   lbl: 'ON PREDICTION', icon: '✅', t: 'Actual approach at or better than κ-predicted Merkel value. Tower performing to specification.' };
  if (dAppVsPred_C <= 0.5)     return { cls: 'ok',   lbl: 'ACCEPTABLE',    icon: '✅', t: 'Within ±0.5°C of Merkel prediction. Monitor trend — no immediate action.' };
  if (dAppVsPred_C <= thW_C)   return { cls: 'ok',   lbl: 'ACCEPTABLE',    icon: '✅', t: 'Within warning band of Merkel prediction. Increase monitoring frequency. Check water chemistry and distribution headers.' };
  if (dAppVsPred_C <= thB_C)   return { cls: 'warn', lbl: 'DEGRADED',      icon: '⚠️', t: 'Actual approach exceeds κ-predicted value beyond warning threshold. Inspect: fill media, nozzles, louvres, drift eliminators, and fan. Schedule maintenance.' };
  return                              { cls: 'bad',  lbl: 'CRITICAL',      icon: '🔴', t: 'Actual approach far exceeds Merkel prediction — critical degradation. Likely causes: fill fouling/scaling, blocked nozzles, draft failure. Immediate inspection required.' };
}

function lgSt(lg) {
  if (lg < 0.6)  return { cls: 'bad',  lbl: 'VERY LOW', icon: '🔴', t: 'Unusually low L/G. Check pump operation, valve positions, basin level, and flow meter calibration.' };
  if (lg < 0.75) return { cls: 'warn', lbl: 'LOW',      icon: '⚠️', t: 'Below typical range. Verify pump impeller, strainer condition, and water distribution headers.' };
  if (lg <= 1.5) return { cls: 'ok',   lbl: 'NORMAL',   icon: '✅', t: 'L/G within typical operating range (0.75–1.5) for counterflow/crossflow towers.' };
  if (lg <= 2.0) return { cls: 'warn', lbl: 'HIGH',     icon: '⚠️', t: 'High L/G — water dominates. Check fan blade pitch, motor speed, belt/drive system, or air-side obstructions.' };
  return               { cls: 'bad',  lbl: 'VERY HIGH', icon: '🔴', t: 'Very high L/G. Significant air-side deficiency. Immediate fan/mechanical draft investigation required.' };
}

function fillStatus(pct) {
  if (pct === null || isNaN(pct)) return { cls: 'info', lbl: 'N/A',      icon: '—',  t: 'Cannot compute fill efficiency — verify all inputs.', bar: 'am' };
  if (pct >= 95)  return { cls: 'ok',   lbl: 'GOOD',     icon: '✅', t: 'Fill operating at or near design specification (≥95%). No immediate action required.', bar: 'gn' };
  if (pct >= 80)  return { cls: 'warn', lbl: 'DEGRADED',  icon: '⚠️', t: 'Fill partially degraded (80–95%). Schedule inspection: check for scaling, biological fouling, sagging or collapsed blocks.', bar: 'am' };
  if (pct >= 60)  return { cls: 'bad',  lbl: 'POOR',      icon: '🔴', t: 'Fill severely degraded (60–80%). Urgent inspection required. Likely causes: heavy fouling, scaling, structural damage.', bar: 'rd' };
  return                { cls: 'bad',  lbl: 'CRITICAL',   icon: '🔴', t: 'Fill critically degraded (<60%). Tower cannot meet design duty. Immediate shutdown for inspection and fill replacement required.', bar: 'rd' };
}

function perfScore(app_a, pred_app, fillPct, lg) {
  // Approach score (50 pts)
  const dApp = app_a - pred_app;
  let appScore;
  if (dApp <= 0) appScore = 50;
  else if (dApp <= 0.5) appScore = 45;
  else if (dApp <= 1.5) appScore = 35;
  else if (dApp <= 3.0) appScore = 20;
  else appScore = 5;

  // Fill score (35 pts)
  let fillScore;
  if (fillPct === null) fillScore = 20;
  else if (fillPct >= 95) fillScore = 35;
  else if (fillPct >= 80) fillScore = 25;
  else if (fillPct >= 60) fillScore = 12;
  else fillScore = 3;

  // L/G score (15 pts)
  let lgScore;
  if (lg === null) lgScore = 10;
  else if (lg >= 0.75 && lg <= 1.5) lgScore = 15;
  else if (lg >= 0.6 && lg <= 2.0) lgScore = 8;
  else lgScore = 2;

  return appScore + fillScore + lgScore;
}

function scoreInfo(s) {
  if (s >= 85) return { c: '#00e676', lbl: 'EXCELLENT' };
  if (s >= 70) return { c: '#00c9a7', lbl: 'GOOD' };
  if (s >= 55) return { c: '#ffb800', lbl: 'FAIR' };
  return { c: '#ff4444', lbl: 'POOR' };
}

// ── WBT Sweep Builder ────────────────────────────────────────────

function buildWBTSweep(dWB_C, dCWT_C, dHWT_C, aWB_C, kappa, Patm_kPa) {
  const steps = [];
  for (let dT = -15; dT <= 15; dT += 1) {
    const wb = dWB_C + dT;
    const pred = calcPredictedCWT(dCWT_C, dWB_C, wb, kappa);
    const kavlV = kavl(pred, dHWT_C, wb, Patm_kPa);
    const app = pred - wb;
    steps.push({
      wb: parseFloat(wb.toFixed(1)),
      pred: parseFloat(pred.toFixed(2)),
      app: parseFloat(app.toFixed(2)),
      kavlV: kavlV !== null ? parseFloat(kavlV.toFixed(4)) : null,
      isActual: Math.abs(wb - aWB_C) < 0.05
    });
  }
  return steps;
}

// ── Main calculate handler ───────────────────────────────────────

function runCalculate(p) {
  const {
    dWB_C, dCWT_C, dHWT_C, dWR, dAR,
    aWB_C, aCWT_C, aHWT_C,
    thW_C, thB_C,
    elev, patm,
    unitSys
  } = p;

  // Determine Patm
  let Patm_kPa = 101.325;
  if (isFinite(patm) && patm > 70 && patm < 110) {
    Patm_kPa = patm;
  } else if (isFinite(elev) && elev >= 0) {
    Patm_kPa = elevToPatm(elev);
  }

  // Validation
  const errs = [];
  if (!isFinite(dWB_C) || !isFinite(aWB_C)) errs.push('WBT values must be finite.');
  if (!isFinite(dCWT_C) || !isFinite(dHWT_C)) errs.push('Design CWT and HWT must be provided.');
  if (!isFinite(aCWT_C) || !isFinite(aHWT_C)) errs.push('Actual CWT and HWT must be provided.');
  if (dCWT_C <= dWB_C) errs.push('Design CWT must be > WBT (approach must be positive).');
  if (dHWT_C <= dCWT_C) errs.push('Design HWT must be > CWT (range must be positive).');
  if (aCWT_C <= aWB_C) errs.push('Actual CWT must be > Actual WBT.');
  if (aHWT_C <= aCWT_C) errs.push('Actual HWT must be > Actual CWT.');
  if (!isFinite(dWR) || dWR <= 0) errs.push('Water flow must be positive.');
  if (dHWT_C > 80 || aHWT_C > 80) errs.push('HWT must be below 80°C — near-boiling inputs are outside the valid psychrometric range.');
  if (dWB_C < -10 || aWB_C < -10) errs.push('WBT below −10°C is outside the valid psychrometric range for evaporative cooling.');
  if (errs.length) return { error: errs.join(' | ') };

  const hasAirFlow = isFinite(dAR) && dAR > 0;
  const thW = isFinite(thW_C) ? thW_C : 1.5;
  const thB = isFinite(thB_C) ? thB_C : 3.0;

  // Core calcs
  const app_d = dCWT_C - dWB_C, app_a = aCWT_C - aWB_C;
  const rng_d = dHWT_C - dCWT_C, rng_a = aHWT_C - aCWT_C;
  const dApp = app_a - app_d, dWBT = aWB_C - dWB_C;

  const avgTw_d = (dCWT_C + dHWT_C) / 2;
  const RHO_W_d = rhoWater(avgTw_d);
  const RHO_A_site = rhoAir(aWB_C, Patm_kPa);
  const Lmass = dWR * RHO_W_d / 3600;
  const Gmass = hasAirFlow ? dAR * RHO_A_site / 3600 : null;
  const lg = hasAirFlow ? Lmass / Gmass : null;

  const kavl_d = kavl(dCWT_C, dHWT_C, dWB_C, Patm_kPa);
  const kavl_a = kavl(aCWT_C, aHWT_C, aWB_C, Patm_kPa);
  const kavl_d_norm = kavl(dCWT_C, dHWT_C, aWB_C, Patm_kPa);
  const kavl_a_norm = kavl(aCWT_C, aHWT_C, aWB_C, Patm_kPa);
  let fillPct = null;
  if (kavl_d_norm !== null && kavl_d_norm > 0 && kavl_a_norm !== null)
    fillPct = Math.min((kavl_a_norm / kavl_d_norm) * 100, 150);

  const kappa = computeKappa(dCWT_C, dHWT_C, dWB_C, Patm_kPa);
  const kappaOK = kappa !== null;
  const kappaVal = kappaOK ? kappa : 0.6;
  const pred_cwt = calcPredictedCWT(dCWT_C, dWB_C, aWB_C, kappaVal);
  const pred_app = pred_cwt - aWB_C;
  const cwtDev = aCWT_C - pred_cwt;
  const dAppVsPred = app_a - pred_app;

  const effectiveness_d = rng_d / (dHWT_C - dWB_C);
  const effectiveness_a = rng_a / (aHWT_C - aWB_C);

  const appStResult = approachSt(dAppVsPred, thW, thB);
  const lgStResult = lg !== null ? lgSt(lg) : { cls: 'info', lbl: 'N/A', icon: '—', t: 'Air flow not provided — L/G ratio not computed.' };
  const fillStResult = fillStatus(fillPct);

  const score = perfScore(app_a, pred_app, fillPct, lg);
  const sInfo = scoreInfo(score);

  const worst = fillStResult.cls === 'bad' || appStResult.cls === 'bad' ? 'bad'
    : fillStResult.cls === 'warn' || appStResult.cls === 'warn' ? 'warn' : 'ok';

  // Build sweep table data
  const sweepData = buildWBTSweep(dWB_C, dCWT_C, dHWT_C, aWB_C, kappaVal, Patm_kPa);

  // Merkel chart data points
  const chartData = buildMerkelChart(dCWT_C, dHWT_C, dWB_C, aCWT_C, aHWT_C, aWB_C, Patm_kPa);

  return {
    // Inputs (echoed back in SI °C)
    dWB: dWB_C, dCWT: dCWT_C, dHWT: dHWT_C, dWR_r: dWR, dAR_r: dAR,
    aWB: aWB_C, aCWT: aCWT_C, aHWT: aHWT_C,
    hasAirFlow,

    // Core results
    app_d, app_a, rng_d, rng_a, dApp, dWBT,
    Lmass, Gmass, lg,
    kavl_d, kavl_a, kavl_d_norm, kavl_a_norm, fillPct,
    kappa: kappaVal, kappaOK, pred_cwt, pred_app, cwtDev, dAppVsPred,
    effectiveness_d, effectiveness_a,
    Patm_kPa, RHO_W_d, RHO_A_site,
    thW_C: thW, thB_C: thB,
    appSt: appStResult, lgSt: lgStResult, fillSt: fillStResult,
    worst, score, sInfo,

    // Table/chart data
    sweepData,
    chartData,

    // Range flag for integration info
    largeRange: rng_d > 15,

    ts: new Date().toISOString()
  };
}

function buildMerkelChart(dCWT_C, dHWT_C, dWB_C, aCWT_C, aHWT_C, aWB_C, Patm_kPa) {
  // Saturation curve points
  const Tmin = Math.min(dCWT_C, aCWT_C) - 2;
  const Tmax = Math.max(dHWT_C, aHWT_C) + 2;
  const nPts = 60;
  const satCurve = [];
  for (let i = 0; i <= nPts; i++) {
    const T = Tmin + i * (Tmax - Tmin) / nPts;
    satCurve.push({ T: parseFloat(T.toFixed(2)), h: saturationEnthalpy(T, Patm_kPa) });
  }

  // Chebyshev integration points (actual)
  const range_a = aHWT_C - aCWT_C;
  const fracs = [0.1, 0.4, 0.6, 0.9];
  const h_a_actual = airEnthalpy(aWB_C, Patm_kPa);
  const chevPts = fracs.map(f => {
    const Ti = aCWT_C + f * range_a;
    const cpAvg = (cpWater(aCWT_C) + cpWater(Ti)) / 2;
    return {
      T: parseFloat(Ti.toFixed(2)),
      hs: saturationEnthalpy(Ti, Patm_kPa),
      ha: h_a_actual + cpAvg * (Ti - aCWT_C)
    };
  });

  return {
    Tmin, Tmax,
    satCurve,
    chevPts,
    hADesign: saturationEnthalpy(dWB_C, Patm_kPa),
    hAActual: h_a_actual,
    aCWT: aCWT_C, aHWT: aHWT_C, aWB: aWB_C, dWB: dWB_C
  };
}

function runPredictCWT(p) {
  const { dWB_C, dCWT_C, dHWT_C, aWB_C, Patm_kPa = 101.325 } = p;

  if (!isFinite(dWB_C) || !isFinite(dCWT_C) || !isFinite(dHWT_C) || !isFinite(aWB_C))
    return { error: 'Enter Design WBT, CWT, HWT and Actual WBT first.' };

  const app_d = dCWT_C - dWB_C, rng_d = dHWT_C - dCWT_C;
  if (app_d <= 0) return { error: 'Design approach ≤ 0: CWT must be > WBT.' };
  if (rng_d <= 0) return { error: 'Design range ≤ 0: HWT must be > CWT.' };

  const kappa = computeKappa(dCWT_C, dHWT_C, dWB_C, Patm_kPa);
  if (kappa === null) return { error: '⚠ κ solver did not converge. Check input ranges.' };

  const pred_C = calcPredictedCWT(dCWT_C, dWB_C, aWB_C, kappa);
  const dWBT_C = aWB_C - dWB_C;
  const dCWT_delta = pred_C - dCWT_C;

  return {
    pred_C: parseFloat(pred_C.toFixed(2)),
    kappa: parseFloat(kappa.toFixed(3)),
    dWBT_C: parseFloat(dWBT_C.toFixed(2)),
    dCWT_delta: parseFloat(dCWT_delta.toFixed(2)),
    Patm_kPa: parseFloat(Patm_kPa.toFixed(2))
  };
}

// ── End of Section 03: Cooling Tower ──────────────────────────────────────────



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
// SECTION 05 of 21  ►  FAN
// Route: /api/fan
// Source: fan.js
// ══════════════════════════════════════════════════════════════════════════════

// api/fan.js  — Vercel Serverless Function
// Fan & blower power, specific speed, affinity laws — server-side only.
//
// AUDIT v2 — fixes applied:
//  [FIX-1] Full server-side input validation added (was entirely missing)
//  [FIX-2] Infinity/NaN guard on computed power outputs before return
//  [FIX-3] lb/ft³→kg/m³ factor corrected to 16.01846 (was 16.0185 — rounding error)
//  [FIX-4] CORS headers + OPTIONS preflight handler added
//
// AUDIT v3 — deep diagnostic (line-by-line):
//  [FIX-5] affinityLaws() now receives actual rho_ratio (rho/1.2) instead of hardcoded 1.0.
//           Old: dP and P affinity predictions always assumed standard air density.
//           New: predictions scale correctly for hot air, altitude, or dense process gases.

/* ─── Fan specific-speed classification (dimensionless SI) ───────────── */
// Ω_s = ω·√Q(m³/s) / (ΔPt/ρ)^0.75
// Thresholds from ISO 13349 / AMCA 802:
function classifyFan(Ns_fan) {
  if (Ns_fan < 0.5)  return 'High-Pressure Centrifugal';
  if (Ns_fan < 1.2)  return 'Centrifugal (Standard)';
  if (Ns_fan < 2.5)  return 'Mixed Flow';
  if (Ns_fan < 4.0)  return 'Axial Flow';
  return 'High-Flow Axial';
}

/* ─── Affinity (fan similarity) laws ────────────────────────────────── */
// Q₂ = Q₁ · (N₂/N₁)·(D₂/D₁)³
// ΔP₂= ΔP₁· (N₂/N₁)²·(D₂/D₁)²·(ρ₂/ρ₁)
// P₂ = P₁ · (N₂/N₁)³·(D₂/D₁)⁵·(ρ₂/ρ₁)
function affinityLaws(Q1, dPt1, P_shaft1, N1, D1, N2, D2, rho_ratio = 1.0) {
  const rN = N2 / N1;
  const rD = D2 / D1;
  return {
    Q2:       Q1       * rN       * Math.pow(rD, 3),
    dP2:      dPt1     * Math.pow(rN, 2) * Math.pow(rD, 2) * rho_ratio,
    P2_shaft: P_shaft1 * Math.pow(rN, 3) * Math.pow(rD, 5) * rho_ratio,
    rN, rD,
  };
}

/* ─── Server-side input validation ──────────────────────────────────── */
function validateFanInputs(p) {
  const required = ['Q', 'dPs', 'dPd', 'rho', 'N1', 'D1', 'eta_t', 'eta_m', 'N2', 'D2'];
  for (const k of required) {
    if (p[k] === undefined || p[k] === null || !isFinite(Number(p[k])))
      return `Field "${k}" is missing or not a finite number.`;
  }
  const f = k => Number(p[k]);
  if (f('Q')   <= 0)                        return 'Flow Q must be > 0.';
  if (f('rho') <= 0)                        return 'Density ρ must be > 0.';
  if (f('N1')  <= 0)                        return 'Speed N1 must be > 0.';
  if (f('D1')  <= 0)                        return 'Diameter D1 must be > 0.';
  if (f('N2')  <= 0)                        return 'Speed N2 must be > 0.';
  if (f('D2')  <= 0)                        return 'Diameter D2 must be > 0.';
  if (f('eta_t') <= 0 || f('eta_t') > 1)   return 'Total efficiency η_t must be in (0, 1].';
  if (f('eta_m') <= 0 || f('eta_m') > 1)   return 'Motor efficiency η_m must be in (0, 1].';
  // dPs and dPd can be zero (e.g. static-only or dynamic-only measurement) but total must be > 0
  if (f('dPs') + f('dPd') <= 0)            return 'Total pressure (dPs + dPd) must be > 0.';
  if (f('dPs') < 0 || f('dPd') < 0)        return 'Pressure components dPs and dPd must be ≥ 0.';
  return null;
}

/* ─── US → SI conversion ─────────────────────────────────────────────── */
function toSI_fan(inp) {
  return {
    Q_m3h: inp.Q   * 1.69901,   // CFM → m³/h   [0.028316847 m³/ft³ × 60 min/h]
    dPs:   inp.dPs * 249.089,   // in WG → Pa
    dPd:   inp.dPd * 249.089,
    rho:   inp.rho * 16.01846,  // lb/ft³ → kg/m³  [corrected from 16.0185]
    D1_mm: inp.D1  * 25.4,      // in → mm
    D2_mm: inp.D2  * 25.4,
  };
}

/* ─── Finite guard ───────────────────────────────────────────────────── */
function assertFinite_fan(val, label) {
  if (!isFinite(val))
    throw new Error(`Computed "${label}" is not finite — check input magnitudes.`);
}

/* ─── Main calculation ───────────────────────────────────────────────── */
function fanCalc(params) {
  const {
    Q, dPs, dPd, rho,
    N1, D1, eta_t, eta_m,
    N2, D2,
    unitMode = 'SI',
  } = params;

  let Q_m3h, dPs_Pa, dPd_Pa, rho_kgm3, D1_mm, D2_mm;

  if (unitMode === 'US') {
    const si = toSI_fan({ Q, dPs, dPd, rho, D1, D2 });
    Q_m3h = si.Q_m3h; dPs_Pa = si.dPs; dPd_Pa = si.dPd;
    rho_kgm3 = si.rho; D1_mm = si.D1_mm; D2_mm = si.D2_mm;
  } else {
    Q_m3h = Q; dPs_Pa = dPs; dPd_Pa = dPd;
    rho_kgm3 = rho; D1_mm = D1; D2_mm = D2;
  }

  const Q_m3s = Q_m3h / 3600;
  const dPt   = dPs_Pa + dPd_Pa;             // total pressure rise  [Pa]

  /* ── Power chain ── */
  const P_air   = Q_m3s * dPt   / 1000;     // kW  fluid (air) power
  const P_shaft = P_air  / eta_t;            // kW  shaft
  const P_input = P_shaft / eta_m;           // kW  motor input

  assertFinite_fan(P_air,   'P_air');
  assertFinite_fan(P_shaft, 'P_shaft');
  assertFinite_fan(P_input, 'P_input');

  /* ── Static efficiency = static fluid power / shaft power ── */
  const eta_s = (Q_m3s * dPs_Pa) / (P_shaft * 1000);

  /* ── Fan specific speed (dimensionless SI) ──
     Ω_s = ω · √Q(m³/s) / (ΔPt/ρ)^0.75  */
  const omega  = N1 * 2 * Math.PI / 60;     // rad/s
  const Ns_fan = omega * Math.sqrt(Q_m3s)
               / Math.pow(dPt / rho_kgm3, 0.75);

  const fanType = classifyFan(Ns_fan);

  /* ── Tip speed ── */
  const tip_speed = Math.PI * (D1_mm / 1000) * N1 / 60;   // m/s
  const tipWarn   = tip_speed > 120
    ? '⚠ Check tip speed (>120 m/s) — blade stress limit'
    : '✓ Within typical range (<120 m/s)';

  /* ── Density deviation check (fan laws assume constant ρ) ── */
  const rhoRef          = 1.2;    // kg/m³  standard air
  const densityDeviates = Math.abs(rho_kgm3 / rhoRef - 1) > 0.10;

  /* ── Affinity laws ──
     ΔP and P both scale with density, so we pass rho/rhoRef as the density ratio.
     This ensures affinity predictions are correct when the fan operates at
     non-standard air density (hot air, altitude, dense gas etc.).
     Q (volumetric) is density-independent, so rho_ratio only affects ΔP and P. */
  const rho_ratio = rho_kgm3 / rhoRef;
  const aff = affinityLaws(Q_m3h, dPt, P_shaft, N1, D1_mm, N2, D2_mm, rho_ratio);

  return {
    ok: true,
    // Power
    P_air, P_shaft, P_input,
    // Pressures
    dPs: dPs_Pa, dPd: dPd_Pa, dPt,
    // Efficiency
    eta_t, eta_m, eta_s,
    // Classification
    Ns_fan, fanType,
    // Geometry
    D1: D1_mm, D2: D2_mm, N1, N2,
    tip_speed, tipWarn,
    // Conditions
    Q: Q_m3h, rho: rho_kgm3,
    densityDeviates,
    // Affinity law predictions
    affinity: {
      Q2:       aff.Q2,
      dP2:      aff.dP2,
      P2_shaft: aff.P2_shaft,
      rN:       aff.rN,
      rD:       aff.rD,
    },
  };
}

/* ─── CORS helper ────────────────────────────────────────────────────── */
function setCORS_fan(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ─── Vercel handler ─────────────────────────────────────────────────── */
function fan_handler(req, res) {
  setCORS_fan(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body;
  if (!body || typeof body !== 'object')
    return res.status(400).json({ error: 'Invalid request body.' });

  const err = validateFanInputs(body);
  if (err) return res.status(400).json({ error: err });

  try {
    return res.status(200).json(fanCalc(body));
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Calculation error.' });
  }
}

// ── End of Section 05: Fan ──────────────────────────────────────────



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
    rho_pts:[[10,999.7],[25,997.0],[50,988.1],[75,974.9],[100,958.4],[150,916.8]],
    mu_pts: [[10,1.307],[25,0.890],[50,0.547],[75,0.378],[100,0.282],[150,0.183]],
    cp_pts: [[10,4.192],[25,4.182],[50,4.182],[75,4.190],[100,4.216],[150,4.310]],
    k_pts:  [[10,0.580],[25,0.607],[50,0.644],[75,0.667],[100,0.679],[150,0.683]],
    name:'Water'
  },

  'brine-nacl':         {rho:1197,mu:1.8,   cp:3.50,  k:0.500, name:'Brine NaCl 25%'},
  'brine-cacl2':        {rho:1298,mu:2.5,   cp:3.20,  k:0.480, name:'Brine CaCl₂ 30%'},
 'ethylene-glycol-30': {
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
function interpProp(pts, T) {
  if (!pts || pts.length === 0) return null;
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
    rho:  raw.rho_pts  ? interpProp(raw.rho_pts,  T_degC) : raw.rho,
    mu:   raw.mu_pts   ? interpProp(raw.mu_pts,   T_degC) : raw.mu,
    cp:   raw.cp_pts   ? interpProp(raw.cp_pts,   T_degC) : raw.cp,
    k:    raw.k_pts    ? interpProp(raw.k_pts,    T_degC) : raw.k,
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
// SECTION 09 of 21  ►  PSYCHROMETRIC
// Route: /api/psychrometric
// Source: psychrometric.js
// ══════════════════════════════════════════════════════════════════════════════

// ============================================================
// Vercel Serverless API — Psychrometric Engine
// All thermodynamic calculations run server-side.
// Client sends raw inputs; server returns computed state.
// ============================================================

// ── ASHRAE 2009 Wexler-Hyland saturation pressure ──────────
function satPressure(T_C) {
  const T = T_C + 273.15;
  if (T_C >= 0) {
    const C8 = -5.8002206e3, C9 = 1.3914993, C10 = -4.8640239e-2,
          C11 = 4.1764768e-5, C12 = -1.4452093e-8, C13 = 6.5459673;
    return Math.exp(C8/T + C9 + C10*T + C11*T*T + C12*T*T*T + C13*Math.log(T)) / 1000;
  } else {
    const C1 = -5.6745359e3, C2 = 6.3925247, C3 = -9.677843e-3,
          C4 = 6.2215701e-7, C5 = 2.0747825e-9, C6 = -9.484024e-13, C7 = 4.1635019;
    return Math.exp(C1/T + C2 + C3*T + C4*T*T + C5*T*T*T + C6*T*T*T*T + C7*Math.log(T)) / 1000;
  }
}

// ── ISA atmosphere pressure from altitude ──────────────────
function altitudePressure(z_m) {
  return 101.325 * Math.pow(1 - 0.0065 * z_m / 288.15, 5.255);
}

// ── ASHRAE humidity ratio ──────────────────────────────────
function humidityRatio(pv_kPa, p_kPa) {
  return 0.621945 * pv_kPa / (p_kPa - pv_kPa);
}

// ── Moist air enthalpy (kJ/kg dry air) ─────────────────────
function enthalpy(T_C, W) {
  return 1.006 * T_C + W * (2501 + 1.86 * T_C);
}

// ── Specific volume (m³/kg dry air) ────────────────────────
function specVolume(T_C, W, p_kPa) {
  return 0.287058 * (T_C + 273.15) * (1 + 1.6078 * W) / p_kPa;
}

// ── Dew point — ARM (Alduchov & Eskridge 1996) ─────────────
function dewPoint(rh_fraction, T_C) {
  const a = 17.625, b = 243.04;
  const alpha = Math.log(Math.max(rh_fraction, 1e-6)) + a * T_C / (b + T_C);
  return b * alpha / (a - alpha);
}

// ── Wet bulb — Stull (2011) + ASHRAE thermodynamic Newton ──
function wetBulbApprox(T_C, rh_fraction, p_kPa) {
  const rh100 = rh_fraction * 100;
  let wb = T_C * Math.atan(0.151977 * Math.pow(rh100 + 8.313659, 0.5))
         + Math.atan(T_C + rh100)
         - Math.atan(rh100 - 1.676331)
         + 0.00391838 * Math.pow(rh100, 1.5) * Math.atan(0.023101 * rh100)
         - 4.686035;
  wb = Math.min(wb, T_C);
  const W_target = humidityRatio(satPressure(T_C) * rh_fraction, p_kPa);
  for (let i = 0; i < 50; i++) {
    const Ws_wb = humidityRatio(satPressure(wb), p_kPa);
    const W_calc = ((2501 - 2.381 * wb) * Ws_wb - 1.006 * (T_C - wb))
                 / (2501 + 1.805 * T_C - 4.186 * wb);
    const err = W_calc - W_target;
    if (Math.abs(err) < 1e-9) break;
    const h = 1e-4;
    const Ws_wb_h = humidityRatio(satPressure(wb + h), p_kPa);
    const W_calc_h = ((2501 - 2.381 * (wb + h)) * Ws_wb_h - 1.006 * (T_C - (wb + h)))
                   / (2501 + 1.805 * T_C - 4.186 * (wb + h));
    const dFdwb = (W_calc_h - W_calc) / h;
    wb -= Math.abs(dFdwb) > 1e-12 ? err / dFdwb : err * 60;
    wb = Math.min(wb, T_C);
  }
  return wb;
}

// ── Full state point from T, RH%, altitude ─────────────────
function calcState(T_C, rh_pct, z_m, p_override) {
  const p = p_override > 0 ? p_override : altitudePressure(z_m);
  const ps = satPressure(T_C);
  const rh = rh_pct / 100;
  const pv = ps * rh;
  const W = humidityRatio(pv, p);
  const h = enthalpy(T_C, W);
  const v = specVolume(T_C, W, p);
  const rho = (1 + W) / v;
  return { T: T_C, p, rh, W, h, v, rho, pv, ps };
}

// ── HVAC process ────────────────────────────────────────────
function calcProcess(T1, rh1, T2, rh2, Q_m3h, z_m) {
  const S1 = calcState(T1, rh1, z_m);
  const S2 = calcState(T2, rh2, z_m);
  const Q_kgs = Q_m3h / 3600 * S1.rho / (1 + S1.W);
  const dh = S2.h - S1.h;
  const dW = S2.W - S1.W;
  const Q_total = Q_kgs * dh;
  const Q_sensible = Q_kgs * 1.006 * (T2 - T1);
  const T_mean = (T1 + T2) / 2;
  const h_fg = 2501 - 2.381 * T_mean;
  const Q_latent = Q_kgs * h_fg * dW;
  const m_water = Q_kgs * Math.abs(dW) * 3600;
  const SHR = Math.abs(Q_total) > 0.001 ? Math.abs(Q_sensible) / Math.abs(Q_total) : 1.0;
  const procType = dh < 0
    ? (dW < -0.0001 ? 'Cooling + Dehumidification' : 'Sensible Cooling Only')
    : (dW > 0.0001 ? 'Heating + Humidification' : 'Sensible Heating Only');
  return { S1, S2, Q_kgs, dh, dW, Q_total, Q_sensible, Q_latent, m_water, SHR, procType };
}

// ── Duct / fan calculator ───────────────────────────────────
function calcDuct(T_C, rh_pct, z_m, shape, dims, Q_m3h, L, rough_mm) {
  const S = calcState(T_C, rh_pct, z_m);
  let A_m2, Dh_m, perim_m;
  if (shape === 'round') {
    const D = dims.diameter / 1000;
    A_m2 = Math.PI * D * D / 4;
    Dh_m = D;
    perim_m = Math.PI * D;
  } else {
    const W = dims.width / 1000, H = dims.height / 1000;
    A_m2 = W * H;
    Dh_m = 4 * A_m2 / (2 * (W + H));
    perim_m = 2 * (W + H);
  }
  const Q_m3s = Q_m3h / 3600;
  const rough_m = rough_mm / 1000;
  const vel_ms = Q_m3s / A_m2;
  // Sutherland's law — temperature-dependent viscosity
  const T_K = T_C + 273.15;
  const mu = 1.716e-5 * Math.pow(T_K / 273.15, 1.5) * (273.15 + 110.4) / (T_K + 110.4);
  const Re = S.rho * vel_ms * Dh_m / mu;
  let f, regimeNote = '';
  if (Re > 4000) {
    f = 0.25 / Math.pow(Math.log10(rough_m / (3.7 * Dh_m) + 5.74 / Math.pow(Re, 0.9)), 2);
  } else if (Re > 2300) {
    const f_lam = 64 / 2300;
    const f_turb = 0.25 / Math.pow(Math.log10(rough_m / (3.7 * Dh_m) + 5.74 / Math.pow(4000, 0.9)), 2);
    f = f_lam + (f_turb - f_lam) * (Re - 2300) / (4000 - 2300);
    regimeNote = 'Transition regime (Re 2300–4000) — friction factor interpolated; result uncertain ±20%';
  } else {
    f = Re > 0 ? 64 / Re : 0.02;
  }
  const dP_Pa = f * (L / Dh_m) * 0.5 * S.rho * vel_ms * vel_ms;
  const dP_mmWg = dP_Pa / 9.80665;
  const Pstatic_Pa = 0.5 * S.rho * vel_ms * vel_ms;
  const fanPower_kW = (dP_Pa * Q_m3s) / (1000 * 0.7);
  return { S, A_m2, Dh_m, perim_m, vel_ms, Re, f, dP_Pa, dP_mmWg, Pstatic_Pa, fanPower_kW, regimeNote };
}

// ── RH curves for chart (server generates coordinate data) ──
function calcChartData(p_kPa) {
  const Tmin = -10, Tmax = 50, Wmax = 0.030;
  const step = 0.5;
  const points = t => {
    const arr = [];
    for (let tt = Tmin; tt <= Tmax; tt += step) {
      arr.push({ t: tt, W: humidityRatio(satPressure(tt), p_kPa) });
    }
    return arr;
  };
  const satCurve = points();
  const rhCurves = [20, 30, 40, 50, 60, 70, 80].map(rh => {
    const pts = [];
    for (let t = Tmin; t <= Tmax; t += step) {
      const W = humidityRatio(satPressure(t) * rh / 100, p_kPa);
      if (W >= 0 && W <= Wmax) pts.push({ t, W });
    }
    return { rh, pts };
  });
  const enthalpyLines = [];
  for (let h_line = 10; h_line <= 110; h_line += 10) {
    const pts = [];
    for (let t = Tmin; t <= Tmax; t += step) {
      const W = (h_line - 1.006 * t) / (2501 + 1.86 * t);
      if (W >= 0 && W <= Wmax) pts.push({ t, W });
    }
    enthalpyLines.push({ h: h_line, pts });
  }
  return { satCurve, rhCurves, enthalpyLines };
}

// ════════════════════════════════════════════════════════════
// VERCEL HANDLER
// ════════════════════════════════════════════════════════════
function psychrometric_handler(req, res) {
  // CORS headers (adjust origin in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, payload } = req.body;

    // ── STATE POINT ─────────────────────────────────────────
    if (action === 'statePoint') {
      const { T, mode, z, p_override, rh, wb, dp, W_in } = payload;

      if (T < -60 || T > 80) {
        return res.status(400).json({ error: 'Temperature out of valid range (−60°C to 80°C)' });
      }
      const p = p_override > 0 ? p_override : altitudePressure(z);
      const ps = satPressure(T);
      let pv, rh_val, W_val;

      if (mode === 'rh') {
        rh_val = rh / 100;
        pv = ps * rh_val;
      } else if (mode === 'wb') {
        if (wb > T) return res.status(400).json({ error: 'Wet bulb must be ≤ dry bulb temperature' });
        const psw = satPressure(wb);
        pv = psw - 0.000662 * p * (T - wb);
        rh_val = pv / ps;
      } else if (mode === 'dp') {
        if (dp >= T) return res.status(400).json({ error: 'Dew point must be < dry bulb temperature' });
        pv = satPressure(dp);
        rh_val = pv / ps;
      } else if (mode === 'w') {
        W_val = W_in;
        pv = W_val * p / (0.621945 + W_val);
        rh_val = pv / ps;
      }

      rh_val = Math.max(0, Math.min(1, rh_val));
      if (!W_val) W_val = humidityRatio(pv, p);
      const h = enthalpy(T, W_val);
      const v = specVolume(T, W_val, p);
      const rho = (1 + W_val) / v;
      const dp_C = dewPoint(rh_val, T);
      const wb_C = wetBulbApprox(T, rh_val, p);

      return res.status(200).json({
        T, p, ps, pv, rh: rh_val, W: W_val, h, v, rho, dp: dp_C, wb: wb_C
      });
    }

    // ── HVAC PROCESS ────────────────────────────────────────
    if (action === 'process') {
      const { T1, rh1, T2, rh2, Q_m3h, z } = payload;
      return res.status(200).json(calcProcess(T1, rh1, T2, rh2, Q_m3h, z));
    }

    // ── DUCT ────────────────────────────────────────────────
    if (action === 'duct') {
      const { T, rh, z, shape, dims, Q_m3h, L, rough_mm } = payload;
      return res.status(200).json(calcDuct(T, rh, z, shape, dims, Q_m3h, L, rough_mm));
    }

    // ── CHART DATA ──────────────────────────────────────────
    if (action === 'chartData') {
      const { p } = payload;
      return res.status(200).json(calcChartData(p || 101.325));
    }

    // ── ALTITUDE → PRESSURE ─────────────────────────────────
    if (action === 'altPressure') {
      return res.status(200).json({ p: altitudePressure(payload.z) });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('[psychrometric]', err);
    return res.status(500).json({ error: 'Internal calculation error', detail: err.message });
  }
}

// ── End of Section 09: Psychrometric ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
// SECTION 10 of 21  ►  PUMP
// Route: /api/pump
// Source: pump.js
// ══════════════════════════════════════════════════════════════════════════════

// api/pump.js  — Vercel Serverless Function
// All proprietary pump formulae, constants and fluid library live here.
// The client never sees these formulas — they are executed server-side only.
//
// AUDIT v2 — fixes applied:
//  [FIX-1] Full server-side numeric + range validation for all inputs
//  [FIX-2] Infinity/NaN guard on all computed power outputs before return
//  [FIX-3] Dead variable Q_total_m3s removed
//  [FIX-4] CORS headers + OPTIONS preflight handler added
//  [FIX-5] Stage loop de-duplicated (single P_hyd_s/P_shaft_s computed once)
//  [IMPROVE] lb/ft³→kg/m³ factor standardised to 16.01846 (exact 6 s.f.)

/* ─── Physical constants ─────────────────────────────────────────────── */
const G_GRAV = 9.80665;     // m/s²  standard gravity (ISO 80000-3)

/* ─── Fluid property library (protected — not exposed to client) ─────── */
const FLUID_LIBRARY = {
  water_20:  { name: 'Water 20 °C',    rho: 998.2, mu: 1.002, Pv_bar: 0.02338 },
  water_60:  { name: 'Water 60 °C',    rho: 983.2, mu: 0.467, Pv_bar: 0.1993  },
  water_80:  { name: 'Water 80 °C',    rho: 971.8, mu: 0.355, Pv_bar: 0.4736  },
  diesel:    { name: 'Diesel',          rho: 820,   mu: 3.5,   Pv_bar: 0.0003  },
  seawater:  { name: 'Seawater 20 °C', rho: 1025,  mu: 1.08,  Pv_bar: 0.023   },
  glycol50:  { name: 'EG 50% 20 °C',   rho: 1058,  mu: 6.5,   Pv_bar: 0.01    },
  ammonia:   { name: 'Liquid NH₃',     rho: 610,   mu: 0.13,  Pv_bar: 8.57    },
};

/* ─── Server-side input validation ──────────────────────────────────── */
function validatePumpInputs(p) {
  const required = ['Q','H','rho','eta_h','eta_mec','eta_m','N_rpm',
                    'Ps','Pv','Vs','hfs','NPSHr'];
  for (const k of required) {
    if (p[k] === undefined || p[k] === null || !isFinite(Number(p[k])))
      return `Field "${k}" is missing or not a finite number.`;
  }
  const f = k => Number(p[k]);
  if (f('Q')     <= 0)                      return 'Flow rate Q must be > 0.';
  if (f('H')     <= 0)                      return 'Head H must be > 0.';
  if (f('rho')   <= 0)                      return 'Density ρ must be > 0.';
  if (f('N_rpm') <= 0)                      return 'Speed N must be > 0.';
  if (f('eta_h')   <= 0 || f('eta_h')  > 1) return 'Hydraulic efficiency η_h must be in (0, 1].';
  if (f('eta_mec') <= 0 || f('eta_mec')> 1) return 'Mechanical efficiency η_mec must be in (0, 1].';
  if (f('eta_m')   <= 0 || f('eta_m')  > 1) return 'Motor efficiency η_m must be in (0, 1].';
  if (f('NPSHr') < 0)                       return 'NPSHr must be ≥ 0.';
  const n = p.n_stages !== undefined ? Number(p.n_stages) : 1;
  if (!Number.isInteger(n) || n < 1 || n > 20)
    return 'n_stages must be an integer between 1 and 20.';
  const nu = p.nu_cSt !== undefined ? Number(p.nu_cSt) : 1.0;
  if (!isFinite(nu) || nu <= 0)             return 'Viscosity ν must be > 0 cSt.';
  return null;
}

/* ─── Viscosity correction (HI 9.6.7 / Gülich Ch.16) ───────────────── */
// C_η ≈ 1 − 0.0105·(ν − 1)^0.60  — valid ~1–3000 cSt centrifugal pumps
function viscCorrectionFactor(nu_cSt) {
  return Math.max(0.40, 1.0 - 0.0105 * Math.pow(nu_cSt - 1, 0.60));
}

/* ─── NPSH available (ISO 9906 / HI full equation) ──────────────────── */
// NPSHa = (Ps − Pv)×10⁵ / (ρg) + V²/(2g) − hfs − z_s
function calcNPSHa(Ps_bar, Pv_bar, rho, Vs_ms, hfs_m, zs_m) {
  return (Ps_bar - Pv_bar) * 1e5 / (rho * G_GRAV)
       + (Vs_ms * Vs_ms)  / (2 * G_GRAV)
       - hfs_m
       - zs_m;
}

/* ─── Specific speed (SI — Gülich / Kaplan definition) ──────────────── */
// Ns = N_rpm · √Q(m³/s) / H(m)^(3/4)
function calcNs(N_rpm, Q_m3s, H_m) {
  return N_rpm * Math.sqrt(Q_m3s) / Math.pow(H_m, 0.75);
}

/* ─── Impeller type classification ──────────────────────────────────── */
function classifyImpeller(Ns) {
  if (Ns < 25)  return 'Radial (Centrifugal)';
  if (Ns < 60)  return 'Francis / Mixed Flow';
  if (Ns < 120) return 'Mixed Flow / Axial';
  return 'Axial Flow';
}

/* ─── US → SI unit conversion ───────────────────────────────────────── */
function toSI_pump(inp) {
  return {
    Q_m3h:  inp.Q      * 0.22712,    // US GPM → m³/h   [3.785411784 L/min × 60/1000]
    H_m:    inp.H      * 0.3048,     // ft → m
    rho:    inp.rho    * 16.01846,   // lb/ft³ → kg/m³  [0.45359237 / 0.028316847]
    Ps_bar: inp.Ps     * 0.0689476,  // psia → bar
    Pv_bar: inp.Pv     * 0.0689476,
    Vs_ms:  inp.Vs     * 0.3048,     // ft/s → m/s
    hfs_m:  inp.hfs    * 0.3048,
    zs_m:   inp.zs     * 0.3048,
    NPSHr:  inp.NPSHr  * 0.3048,
  };
}

/* ─── Finite output guard ────────────────────────────────────────────── */
// JSON.stringify silently converts Infinity/NaN → null, hiding errors from client.
function assertFinite_pump(val, label) {
  if (!isFinite(val))
    throw new Error(`Computed "${label}" is not finite — check input magnitudes.`);
}

/* ─── Main calculation ───────────────────────────────────────────────── */
function pumpCalc(params) {
  const {
    Q, H, rho,
    n_stages = 1,
    config   = 'series',
    eta_h: eta_h_in, eta_mec, eta_m,
    N_rpm,
    nu_cSt   = 1.0,
    Ps, Pv, Vs, hfs,
    zs       = 0,
    NPSHr,
    pump_type = 'centrifugal',
    unitMode  = 'SI',
  } = params;

  /* ── Unit conversion ── */
  let si;
  if (unitMode === 'US') {
    si = toSI_pump({ Q, H, rho, Ps, Pv, Vs, hfs, zs, NPSHr });
  } else {
    si = { Q_m3h: Q, H_m: H, rho,
           Ps_bar: Ps, Pv_bar: Pv,
           Vs_ms: Vs, hfs_m: hfs, zs_m: zs, NPSHr };
  }

  /* ── Viscosity correction (centrifugal only, ν > 10 cSt) ── */
  let eta_h         = eta_h_in;
  let viscCorr      = false;
  let viscCorrFactor = 1.0;
  if (pump_type === 'centrifugal' && nu_cSt > 10) {
    viscCorrFactor = viscCorrectionFactor(nu_cSt);
    eta_h          = eta_h_in * viscCorrFactor;
    viscCorr       = true;
  }

  /* ── Stage totals ── */
  const Q_stage     = si.Q_m3h;
  const H_total     = config === 'series'   ? n_stages * si.H_m   : si.H_m;
  const Q_total     = config === 'parallel' ? n_stages * si.Q_m3h : si.Q_m3h;
  const Q_stage_m3s = Q_stage / 3600;

  /* ── Power chain ── */
  const P_hyd_stage = si.rho * G_GRAV * Q_stage_m3s * si.H_m / 1000; // kW
  const P_hyd_total = n_stages * P_hyd_stage;
  const P_shaft     = P_hyd_total / (eta_h * eta_mec);
  const P_input     = P_shaft / eta_m;

  // Guard against Infinity/NaN before returning
  assertFinite_pump(P_hyd_total, 'P_hyd_total');
  assertFinite_pump(P_shaft,     'P_shaft');
  assertFinite_pump(P_input,     'P_input');

  /* ── Vapour pressure guard ── */
  const pvWarn  = si.Pv_bar >= si.Ps_bar;
  const Pv_safe = pvWarn ? si.Ps_bar * 0.999 : si.Pv_bar;

  /* ── NPSH available ── */
  const NPSHa = calcNPSHa(si.Ps_bar, Pv_safe, si.rho, si.Vs_ms, si.hfs_m, si.zs_m);
  const margin = NPSHa - si.NPSHr;
  const cavOk  = margin >= 0.5;

  /* ── Specific speed & impeller type ── */
  const Ns      = calcNs(N_rpm, Q_stage_m3s, si.H_m);
  const impType = classifyImpeller(Ns);

  /* ── Per-stage table (computed once, reused for all identical stages) ── */
  const P_shaft_stage = P_hyd_stage / (eta_h * eta_mec);
  const stages = [];
  for (let i = 1; i <= n_stages; i++) {
    stages.push({
      stage:   i,
      Q:       Q_stage,
      H:       si.H_m,
      P_hyd:   P_hyd_stage,
      P_shaft: P_shaft_stage,
      eta_h,
    });
  }

  return {
    ok: true,
    P_hyd_total, P_shaft, P_input,
    NPSHa, NPSHr: si.NPSHr, margin, cavOk, pvWarn,
    Q_total, H_total, n_stages, config,
    Ns, impType,
    eta_h, eta_mec, eta_m,
    viscCorr, viscCorrFactor, nu_cSt, eta_h_input: eta_h_in,
    zs: si.zs_m,
    stages,
  };
}

/* ─── CORS helper ────────────────────────────────────────────────────── */
function setCORS_pump(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ─── Vercel handler ─────────────────────────────────────────────────── */
function pump_handler(req, res) {
  setCORS_pump(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body;
  if (!body || typeof body !== 'object')
    return res.status(400).json({ error: 'Invalid request body.' });

  const err = validatePumpInputs(body);
  if (err) return res.status(400).json({ error: err });

  try {
    return res.status(200).json(pumpCalc(body));
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Calculation error.' });
  }
}

// ── End of Section 10: Pump ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
// SECTION 11 of 21  ►  RANKINE CYCLE
// Route: /api/rankine
// Source: rankine (1).js
// ══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// Vercel Serverless Function — Rankine Cycle Thermodynamic Engine
// All steam property lookups, interpolation, and cycle calculations
// run here — never exposed to the browser.
// ═══════════════════════════════════════════════════════════════════

// ── STEAM TABLE DATA (IAPWS-IF97) ──────────────────────────────────
// SAT_T_rankine: [T_C, hf, hfg, hg, sf, sfg, sg, vf, vg]
const SAT_T_rankine=[[0.01,0.00,2501.4,2501.4,0.0000,9.1562,9.1562,0.0010002,206.140],[5,21.02,2489.6,2510.6,0.0763,8.9496,9.0259,0.0010001,147.120],[10,42.02,2477.7,2519.7,0.1511,8.7488,8.8999,0.0010003,106.380],[15,62.98,2465.9,2528.9,0.2245,8.5566,8.7811,0.0010009,77.926],[20,83.91,2453.6,2537.5,0.2966,8.3706,8.6671,0.0010018,57.791],[25,104.87,2441.7,2546.5,0.3673,8.1910,8.5583,0.0010029,43.360],[30,125.77,2430.0,2555.8,0.4369,8.0164,8.4533,0.0010044,32.894],[35,146.66,2418.2,2564.9,0.5052,7.8478,8.3530,0.0010060,25.216],[40,167.54,2406.0,2573.5,0.5724,7.6845,8.2569,0.0010079,19.523],[45,188.44,2393.9,2582.4,0.6386,7.5261,8.1647,0.0010099,15.258],[50,209.33,2382.0,2591.3,0.7037,7.3725,8.0762,0.0010121,12.032],[60,251.18,2357.7,2608.8,0.8313,7.0784,7.9096,0.0010171,7.671],[70,292.97,2333.0,2626.0,0.9548,6.7989,7.7537,0.0010228,5.042],[80,334.88,2307.8,2642.7,1.0753,6.5366,7.6119,0.0010292,3.407],[90,376.90,2282.2,2659.1,1.1924,6.2866,7.4790,0.0010361,2.361],[100,419.06,2256.9,2676.0,1.3069,6.0480,7.3549,0.0010435,1.6720],[110,461.14,2229.7,2690.8,1.4185,5.8194,7.2379,0.0010516,1.2101],[120,503.78,2202.6,2706.3,1.5279,5.6006,7.1284,0.0010603,0.8917],[130,546.37,2174.2,2720.5,1.6346,5.3906,7.0252,0.0010700,0.6685],[140,589.16,2144.9,2734.0,1.7391,5.1894,6.9285,0.0010803,0.5089],[150,632.18,2114.3,2746.5,1.8416,4.9961,6.8377,0.0010912,0.3924],[160,675.55,2082.6,2758.1,1.9422,4.8100,6.7522,0.0011029,0.3071],[170,719.08,2049.5,2768.5,2.0412,4.6297,6.6709,0.0011150,0.2428],[180,763.06,2015.3,2778.2,2.1387,4.4547,6.5934,0.0011281,0.1940],[190,807.57,1979.0,2786.4,2.2349,4.2844,6.5192,0.0011420,0.1565],[200,852.38,1940.7,2793.1,2.3300,4.1179,6.4479,0.0011565,0.12721],[210,897.76,1900.7,2798.5,2.4245,3.9583,6.3828,0.0011726,0.10441],[220,943.58,1858.5,2802.1,2.5175,3.7927,6.3102,0.0011891,0.08619],[230,990.21,1813.8,2804.0,2.6099,3.6234,6.2333,0.0012075,0.07158],[240,1037.6,1769.4,2807.0,2.7018,3.4735,6.1753,0.0012270,0.05977]];
const SAT_P_rankine=[[1.0,99.63,417.44,2675.6,1.3026,7.3594,0.001043,1.6941],[2.0,120.23,504.68,2706.7,1.5301,7.1268,0.001061,0.88574],[3.0,133.55,561.43,2725.3,1.6716,6.9909,0.001073,0.60582],[4.0,143.63,604.66,2738.1,1.7764,6.8959,0.001084,0.46242],[5.0,151.86,640.09,2748.1,1.8604,6.8212,0.001093,0.37483],[6.0,158.85,670.38,2756.4,1.9308,6.7600,0.001101,0.31567],[7.0,165.00,697.07,2763.4,1.9918,6.7080,0.001108,0.27279],[8.0,170.43,720.87,2769.1,2.0461,6.6628,0.001115,0.24049],[9.0,175.38,742.56,2773.8,2.0946,6.6226,0.001121,0.21497],[10.0,179.91,762.81,2778.1,2.1387,6.5865,0.001127,0.19444],[12.0,187.99,798.65,2784.8,2.2166,6.5233,0.001139,0.16333],[14.0,195.07,830.08,2790.0,2.2837,6.4693,0.001149,0.14078],[16.0,201.41,858.56,2794.0,2.3440,6.4218,0.001159,0.12374],[18.0,207.11,885.17,2797.6,2.3976,6.3794,0.001168,0.11043],[20.0,212.42,908.47,2799.5,2.4468,6.3409,0.001177,0.099585],[25.0,224.00,962.11,2803.3,2.5547,6.2575,0.001197,0.079977],[30.0,233.90,1008.4,2804.2,2.6457,6.1869,0.001216,0.066628],[35.0,242.60,1049.8,2803.8,2.7253,6.1253,0.001235,0.057063],[40.0,250.40,1087.4,2801.4,2.7966,6.0696,0.001252,0.049779],[45.0,257.49,1122.1,2798.3,2.8612,6.0190,0.001269,0.044079],[50.0,263.99,1154.4,2794.3,2.9202,5.9737,0.001286,0.039457],[60.0,275.64,1213.7,2784.3,3.0248,5.8902,0.001319,0.032445],[70.0,285.88,1267.4,2772.1,3.1210,5.8133,0.001352,0.027370],[80.0,295.06,1317.1,2758.4,3.2076,5.7450,0.001384,0.023525],[90.0,303.40,1363.2,2742.8,3.2857,5.6811,0.001418,0.020489],[100.0,311.06,1407.6,2724.5,3.3596,5.6141,0.001452,0.018026],[110.0,318.15,1450.3,2705.0,3.4295,5.5473,0.001489,0.015985],[120.0,324.75,1491.8,2684.9,3.4962,5.4924,0.001527,0.014267],[130.0,330.93,1532.0,2662.9,3.5605,5.4295,0.001567,0.012721],[140.0,336.75,1571.0,2638.7,3.6229,5.3717,0.001611,0.011485],[150.0,342.24,1609.0,2614.5,3.6834,5.3108,0.001658,0.010340],[160.0,347.44,1650.5,2580.6,3.7428,5.2455,0.001710,0.0093499],[170.0,352.37,1690.7,2548.5,3.7996,5.1832,0.001765,0.0083849],[180.0,357.06,1732.0,2509.1,3.8553,5.1044,0.001840,0.0074920],[190.0,361.54,1776.5,2468.4,3.9102,5.0218,0.001926,0.0066531],[200.0,365.81,1826.3,2409.7,4.0139,4.9269,0.002036,0.0058750],[210.0,369.89,1886.3,2336.8,4.1014,4.8013,0.002213,0.0051020],[220.0,373.71,2010.3,2192.4,4.2887,4.5481,0.002790,0.0037800],[220.64,374.14,2099.3,2099.3,4.4120,4.4120,0.003155,0.0031550]];
const SH_FB_rankine=[{P:1,d:[[100,2676.2,7.361,1.696],[150,2776.5,7.615,1.937],[200,2875.5,7.835,2.172],[250,2974.5,8.033,2.406],[300,3074.3,8.217,2.639],[350,3175.8,8.390,2.871],[400,3279.6,8.545,3.103],[500,3488.1,8.834,3.565],[600,3705.4,9.102,4.028],[700,3928.7,9.352,4.490],[800,4159.0,9.586,4.952]]},{P:5,d:[[152,2748.7,6.821,0.375],[200,2855.4,7.059,0.425],[250,2961.0,7.272,0.474],[300,3064.2,7.460,0.523],[350,3168.1,7.633,0.570],[400,3272.3,7.794,0.617],[500,3484.9,8.087,0.711],[600,3704.3,8.352,0.804],[700,3927.1,8.605,0.897],[800,4157.8,8.840,0.990]]},{P:10,d:[[180,2778.1,6.587,0.1944],[200,2827.9,6.694,0.2060],[250,2942.6,6.925,0.2328],[300,3051.2,7.123,0.2579],[350,3157.7,7.301,0.2825],[400,3264.5,7.465,0.3066],[500,3478.5,7.762,0.3541],[600,3697.9,8.029,0.4011],[700,3922.5,8.281,0.4479],[800,4154.5,8.516,0.4945]]},{P:20,d:[[213,2799.5,6.341,0.0996],[250,2902.5,6.545,0.1114],[300,3023.5,6.768,0.1255],[350,3137.0,6.958,0.1385],[400,3248.7,7.127,0.1520],[500,3467.6,7.432,0.1757],[600,3687.9,7.702,0.1996],[700,3913.3,7.955,0.2233],[800,4142.0,8.192,0.2467]]},{P:40,d:[[251,2801.4,6.070,0.0498],[300,2962.0,6.362,0.0589],[350,3092.5,6.584,0.0666],[400,3213.6,6.771,0.0734],[500,3445.3,7.090,0.0864],[600,3670.3,7.369,0.0989],[700,3894.9,7.624,0.1112],[800,4122.0,7.861,0.1234]]},{P:60,d:[[276,2784.3,5.890,0.0324],[300,2885.5,6.070,0.0362],[350,3043.4,6.336,0.0421],[400,3178.3,6.545,0.0474],[500,3422.2,6.883,0.0567],[600,3658.4,7.169,0.0653],[700,3876.1,7.428,0.0736],[800,4095.0,7.667,0.0818]]},{P:80,d:[[295,2758.4,5.745,0.0235],[300,2786.5,5.794,0.0243],[350,2988.1,6.132,0.0299],[400,3139.4,6.366,0.0343],[500,3398.3,6.727,0.0398],[600,3633.2,7.059,0.0480],[700,3857.2,7.321,0.0543],[800,4074.0,7.562,0.0604]]},{P:100,d:[[311,2725.5,5.614,0.0180],[350,2924.5,5.945,0.0228],[400,3096.5,6.212,0.0264],[450,3249.0,6.419,0.0297],[500,3374.2,6.599,0.0328],[600,3625.3,6.903,0.0384],[700,3838.2,7.176,0.0427],[800,4053.0,7.418,0.0487]]},{P:120,d:[[325,2684.9,5.492,0.0143],[360,2820.0,5.752,0.0165],[400,3051.6,6.004,0.0208],[450,3215.9,6.233,0.0236],[500,3350.7,6.425,0.0262],[600,3582.3,6.742,0.0308],[700,3793.5,7.027,0.0351],[800,4032.0,7.271,0.0405]]},{P:140,d:[[337,2637.6,5.372,0.0115],[360,2753.0,5.581,0.0132],[400,3001.9,5.845,0.0166],[450,3182.5,6.086,0.0191],[500,3323.1,6.285,0.0214],[600,3541.2,6.604,0.0260],[700,3762.2,6.898,0.0302],[800,4011.0,7.143,0.0352]]},{P:160,d:[[347,2580.6,5.246,0.0093],[380,2745.0,5.508,0.0115],[400,2947.0,5.693,0.0132],[450,3146.1,5.951,0.0157],[500,3295.0,6.156,0.0178],[600,3561.1,6.513,0.0214],[700,3732.3,6.781,0.0256],[800,3989.0,7.029,0.0302]]},{P:180,d:[[357,2509.1,5.104,0.0075],[390,2748.0,5.484,0.0100],[400,2880.1,5.554,0.0107],[450,3104.9,5.827,0.0130],[500,3266.1,6.037,0.0149],[600,3542.0,6.409,0.0181],[700,3701.4,6.657,0.0218],[800,3968.0,6.909,0.0260]]},{P:200,d:[[366,2409.7,4.927,0.0059],[395,2702.0,5.378,0.0085],[400,2818.1,5.472,0.0099],[450,3060.1,5.796,0.0121],[500,3239.3,6.018,0.0145],[600,3532.0,6.336,0.0175],[700,3670.6,6.589,0.0210],[800,3947.0,6.845,0.0249]]}];

// ── STEAM PROPERTY ENGINE ──────────────────────────────────────────
function pSat_rankine(T_C){const T=T_C+273.15,Tc=647.096,Pc=220.64;if(T>=Tc)return Pc;if(T<273.15)return NaN;const tau=1-T/Tc,arg=(Tc/T)*(-7.85951783*tau+1.84408259*Math.pow(tau,1.5)+-11.7866497*Math.pow(tau,3)+22.6807411*Math.pow(tau,3.5)+-15.9618719*Math.pow(tau,4)+1.80122502*Math.pow(tau,7.5));return Pc*Math.exp(arg);}
function tSat_rankine(P_bar){if(!isFinite(P_bar)||P_bar<=0||P_bar>220.9)return NaN;let T=100*Math.pow(P_bar/1.01325,0.27)+273.15;for(let i=0;i<60;i++){const Tc=T-273.15,P=pSat_rankine(Tc),dP=(pSat_rankine(Tc+0.005)-pSat_rankine(Tc-0.005))/0.01;if(!isFinite(P)||!isFinite(dP)||dP===0)break;const dT=(P-P_bar)/dP;T-=dT;if(Math.abs(dT)<1e-7)break;}return T-273.15;}
function tSatMPa(P_MPa){return tSat_rankine(P_MPa*10);}

function csplineInterp_rankine(xs,ys,x){const n=xs.length;if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];let i=0;for(let j=0;j<n-1;j++){if(xs[j]<=x&&x<=xs[j+1]){i=j;break;}}const t=(x-xs[i])/(xs[i+1]-xs[i]),t2=t*t,t3=t2*t,h=xs[i+1]-xs[i];const m1=i>0?(ys[i+1]-ys[i-1])/(xs[i+1]-xs[i-1]):(ys[i+1]-ys[i])/h;const m2=i<n-2?(ys[i+2]-ys[i])/(xs[i+2]-xs[i]):(ys[i+1]-ys[i])/h;return ys[i]*(2*t3-3*t2+1)+ys[i+1]*(-2*t3+3*t2)+m1*h*(t3-2*t2+t)+m2*h*(t3-t2);}
function satByT(T_C){if(T_C<0.01||T_C>374.14)return null;let row;if(T_C<=240){const xs=SAT_T_rankine.map(r=>r[0]),interp=c=>csplineInterp_rankine(xs,SAT_T_rankine.map(r=>r[c]),T_C);row={T:T_C,hf:interp(1),hfg:interp(2),hg:interp(3),sf:interp(4),sfg:interp(5),sg:interp(6),vf:interp(7),vg:interp(8),P_bar:pSat_rankine(T_C)};}else{const P=pSat_rankine(T_C);row=satByP_rankine(P);}return row;}
function satByP_rankine(P_bar){if(P_bar<0.006||P_bar>220.9)return null;const xs=SAT_P_rankine.map(r=>r[0]),interp=c=>csplineInterp_rankine(xs,SAT_P_rankine.map(r=>r[c]),P_bar);const Ts=interp(1),hf=interp(2),hg=interp(3),sf=interp(4),sg=interp(5),vf=interp(6),vg=interp(7);return{T:Ts,P_bar,hf,hfg:hg-hf,hg,sf,sfg:sg-sf,sg,vf,vg};}
function shProps(P_bar,T_C){const prs=SH_FB_rankine.map(b=>b.P);function atB(idx,T){const d=SH_FB_rankine[idx].d;return{h:csplineInterp_rankine(d.map(r=>r[0]),d.map(r=>r[1]),T),s:csplineInterp_rankine(d.map(r=>r[0]),d.map(r=>r[2]),T),v:csplineInterp_rankine(d.map(r=>r[0]),d.map(r=>r[3]),T)};}if(P_bar<=prs[0])return atB(0,T_C);if(P_bar>=prs[prs.length-1])return atB(prs.length-1,T_C);let lo=0;for(let i=0;i<prs.length-1;i++){if(prs[i]<=P_bar&&P_bar<=prs[i+1]){lo=i;break;}}const fP=(P_bar-prs[lo])/(prs[lo+1]-prs[lo]),a=atB(lo,T_C),b_=atB(lo+1,T_C);return{h:a.h+fP*(b_.h-a.h),s:a.s+fP*(b_.s-a.s),v:a.v+fP*(b_.v-a.v)};}
function supState(T_C,P_MPa){const P_bar=P_MPa*10,sat=satByP_rankine(P_bar);if(!sat)return null;if(T_C<=sat.T)return{h:sat.hg,s:sat.sg,v:sat.vg};return shProps(P_bar,T_C);}
function condProps(T_C){return satByT(Math.max(0.01,Math.min(373,T_C)));}

// ── CYCLE CALCULATORS ──────────────────────────────────────────────
function calcBasic({T3,Ph,T1,Pc,etaT,etaP,etaG,etaB,mdot,hhv}){
  const TsatBoiler=tSatMPa(Ph),Ph_bar=Ph*10,Pc_bar=Pc*10;
  if(T3<=T1) return{error:'Boiler temperature must exceed condenser temperature.'};
  if(T3<=TsatBoiler) return{error:`Boiler T (${T3.toFixed(1)}°C) must exceed T_sat = ${TsatBoiler.toFixed(1)}°C at ${Ph} MPa.`};
  if(T1<1) return{error:'Condenser temperature must be > 1°C.'};
  if(Pc>=Ph) return{error:'Condenser pressure must be less than boiler pressure.'};
  if(mdot<=0) return{error:'Steam mass flow must be positive.'};
  if(hhv<=0) return{error:'Fuel HHV must be positive.'};
  if(etaT<=0||etaT>1) return{error:'Turbine efficiency must be 1–100%.'};
  if(etaP<=0||etaP>1) return{error:'Pump efficiency must be 1–100%.'};
  const s1=condProps(T1),st3=supState(T3,Ph);
  if(!s1||!st3) return{error:'Steam property lookup failed — check input range.'};
  const h3=st3.h,s3=st3.s;
  const x4s=(s3-s1.sf)/Math.max(s1.sfg,1e-6);
  const h4s=x4s>=1?s1.hg:s1.hf+Math.max(0,x4s)*s1.hfg;
  const h4=h3-etaT*(h3-h4s);
  const wps=s1.vf*(Ph_bar-Pc_bar)*100,wp=wps/etaP,h2=s1.hf+wp;
  const qB=h3-h2,wT=h3-h4,wNet=wT-wp;
  if(qB<=0) return{error:'Heat input qB ≤ 0 — check inputs.'};
  if(wNet<=0) return{error:'Net work ≤ 0 — increase pressure ratio or efficiency.'};
  const etaTh=wNet/qB;
  const etaCarnot=1-(T1+273.15)/(T3+273.15),eta2nd=etaTh/Math.max(etaCarnot,0.001);
  const etaOverall=etaTh*etaG*etaB,WkW=wNet*mdot,QkW=qB*mdot,QrejkW=QkW-WkW;
  const heatRate=3600/Math.max(etaTh,0.001),fuelRate=QkW/(etaB*hhv*1000);
  const x4raw=(h4-s1.hf)/Math.max(s1.hfg,1e-6);
  if(x4raw<0) return{error:'Turbine exit is sub-cooled liquid (x<0) — reduce pressure ratio or increase boiler temperature.'};
  const x4=Math.max(0,x4raw),moisture=(1-Math.min(x4,1))*100;
  const bwr=wp/Math.max(wT,1);
  return{
    ok:true,type:'basic',
    etaTh,etaCarnot,eta2nd,etaOverall,
    WkW,QkW,QrejkW,heatRate,fuelRate,bwr,
    wT,wp,wNet,qB,
    h1:s1.hf,h2,h3,h4,
    s1:{hf:s1.hf,sf:s1.sf,sfg:s1.sfg,hfg:s1.hfg,vf:s1.vf},
    s3:{h:h3,s:s3},
    x4,moisture,
    TsatBoiler,T1,T3,Ph,Pc,mdot,etaG,etaB
  };
}

function calcSuperheat({Tsh,Ph,Tc,Pc,etaT,etaP,mdot}){
  const TsatB=tSatMPa(Ph),Ph_bar=Ph*10,Pc_bar=Pc*10;
  if(Tsh<=TsatB) return{error:`T_sh (${Tsh.toFixed(1)}°C) must exceed T_sat = ${TsatB.toFixed(1)}°C at ${Ph} MPa.`};
  if(Tc>=TsatB) return{error:`Condenser temperature must be below boiler T_sat = ${TsatB.toFixed(1)}°C.`};
  if(Pc>=Ph) return{error:'Condenser pressure must be less than boiler pressure.'};
  if(mdot<=0) return{error:'Steam mass flow must be positive.'};
  if(etaT<=0||etaT>1) return{error:'Turbine efficiency must be 1–100%.'};
  if(etaP<=0||etaP>1) return{error:'Pump efficiency must be 1–100%.'};
  const s1=condProps(Tc),st3=supState(Tsh,Ph);
  if(!s1||!st3) return{error:'Steam property lookup failed.'};
  const h3=st3.h,s3=st3.s;
  const x4s=(s3-s1.sf)/Math.max(s1.sfg,1e-6);
  const h4s=x4s>=1?s1.hg:s1.hf+Math.max(0,x4s)*s1.hfg;
  const h4=h3-etaT*(h3-h4s);
  const wps=s1.vf*(Ph_bar-Pc_bar)*100,wp=wps/etaP,h2=s1.hf+wp;
  const qB=h3-h2,wT=h3-h4,wNet=wT-wp;
  if(qB<=0) return{error:'Boiler heat input ≤ 0.'};
  if(wNet<=0) return{error:'Net work ≤ 0.'};
  const etaTh=wNet/qB;
  const etaC=1-(Tc+273.15)/(Tsh+273.15),eta2nd=etaTh/Math.max(etaC,0.001);
  const heatRate=3600/Math.max(etaTh,0.001),WkW=wNet*mdot,QkW=qB*mdot;
  const x4raw=(h4-s1.hf)/Math.max(s1.hfg,1e-6);
  if(x4raw<0) return{error:'Turbine exit sub-cooled — reduce pressure ratio or increase superheat.'};
  const x4=Math.max(0,x4raw),moisture=(1-Math.min(x4,1))*100;
  const bwr=wp/Math.max(wT,1);
  const dsh=Tsh-TsatB;
  return{
    ok:true,type:'superheat',
    etaTh,etaC,eta2nd,WkW,QkW,heatRate,bwr,
    wT,wp,wNet,qB,
    h1:s1.hf,h2,h3,h4,
    s1:{hf:s1.hf,sf:s1.sf,sfg:s1.sfg,hfg:s1.hfg,vf:s1.vf},
    x4,moisture,dsh,TsatB,
    Tsh,Ph,Tc,Pc,mdot
  };
}

function calcReheat({T1,P1,Trh,P2,Tc:TcIn,Pc,etaHPT,etaLPT,etaP,mdot}){
  // Derive condenser T from Pc if not explicitly provided
  const Tc = (TcIn !== null && TcIn !== undefined && !isNaN(TcIn)) ? TcIn : tSatMPa(Pc);
  const Tsat1=tSatMPa(P1),Tsat2=tSatMPa(P2);
  if(T1<=Tsat1) return{error:`HPT inlet T (${T1.toFixed(1)}°C) must exceed T_sat = ${Tsat1.toFixed(1)}°C at ${P1} MPa.`};
  if(Trh<=Tsat2) return{error:`Reheat T (${Trh.toFixed(1)}°C) must exceed T_sat = ${Tsat2.toFixed(1)}°C at ${P2} MPa.`};
  if(P2>=P1) return{error:'Reheat pressure must be less than HPT inlet pressure.'};
  if(Pc>=P2) return{error:'Condenser pressure must be less than reheat pressure.'};
  if(mdot<=0) return{error:'Steam mass flow must be positive.'};
  const Ph_bar=P1*10,P2_bar=P2*10,Pc_bar=Pc*10;
  const s1c=condProps(Tc),st3=supState(T1,P1),st_rh=supState(Trh,P2);
  if(!s1c||!st3||!st_rh) return{error:'Steam property lookup failed.'};
  const h3=st3.h,s3=st3.s;
  // HPT isentropic expansion to P2
  const s_rh_in=s3;
  const sat2=satByP_rankine(P2_bar);
  const x4s_rh=(s_rh_in-sat2.sf)/Math.max(sat2.sfg,1e-6);
  const h4s_rh=x4s_rh>=1?sat2.hg:sat2.hf+Math.max(0,x4s_rh)*sat2.hfg;
  const h4_rh=h3-etaHPT*(h3-h4s_rh); // HPT exit
  // Reheat
  const h5=st_rh.h,s5=st_rh.s;
  // LPT isentropic expansion to Pc
  const x6s=(s5-s1c.sf)/Math.max(s1c.sfg,1e-6);
  const h6s=x6s>=1?s1c.hg:s1c.hf+Math.max(0,x6s)*s1c.hfg;
  const h6=h5-etaLPT*(h5-h6s);
  const wps=s1c.vf*(Ph_bar-Pc_bar)*100,wp=wps/etaP,h2=s1c.hf+wp;
  const wHPT=h3-h4_rh,wLPT=h5-h6,wNet=wHPT+wLPT-wp;
  const qBoiler=h3-h2,qReheat=h5-h4_rh,qTotal=qBoiler+qReheat;
  if(qTotal<=0) return{error:'Total heat input ≤ 0.'};
  if(wNet<=0) return{error:'Net work ≤ 0.'};
  const etaTh=wNet/qTotal;
  const etaC=1-(Tc+273.15)/(T1+273.15),eta2nd=etaTh/Math.max(etaC,0.001);
  const WkW=wNet*mdot,QkW=qTotal*mdot,heatRate=3600/Math.max(etaTh,0.001);
  const x6raw=(h6-s1c.hf)/Math.max(s1c.hfg,1e-6);
  const x6=Math.max(0,x6raw),moisture=(1-Math.min(x6,1))*100;
  const bwr=wp/Math.max(wHPT+wLPT,1);
  const optP2=Math.sqrt(P1*Pc);
  return{
    ok:true,type:'reheat',
    etaTh,etaC,eta2nd,WkW,QkW,heatRate,bwr,
    wHPT,wLPT,wp,wNet,qBoiler,qReheat,qTotal,
    h1:s1c.hf,h2,h3,h4:h4_rh,h5,h6,
    s1:{hf:s1c.hf,sf:s1c.sf,sfg:s1c.sfg,hfg:s1c.hfg,vf:s1c.vf},
    x6,moisture,Tsat1,Tsat2,optP2,
    T1,P1,Trh,P2,Tc,Pc,mdot
  };
}

function calcRegenFWH({Thi,Phi,Tbleed,Pbleed,Tc:TcIn,Pc,etaT,etaP,mdot}){
  // Derive condenser T from Pc if not explicitly provided
  const Tc = (TcIn !== null && TcIn !== undefined && !isNaN(TcIn)) ? TcIn : tSatMPa(Pc);
  const TsatIn=tSatMPa(Phi),TsatBleed=tSatMPa(Pbleed);
  if(Thi<=TsatIn) return{error:`Turbine inlet T (${Thi.toFixed(1)}°C) must exceed T_sat = ${TsatIn.toFixed(1)}°C at ${Phi} MPa.`};
  if(Pbleed>=Phi) return{error:'Bleed pressure must be less than inlet pressure.'};
  if(Pc>=Pbleed) return{error:'Condenser pressure must be less than bleed pressure.'};
  if(mdot<=0) return{error:'Steam mass flow must be positive.'};
  const Phi_bar=Phi*10,Pbleed_bar=Pbleed*10,Pc_bar=Pc*10;
  const s1=condProps(Tc),s6=satByP_rankine(Pbleed_bar),stIn=supState(Thi,Phi);
  if(!s1||!s6||!stIn) return{error:'Steam property lookup failed.'};
  const h1_orig=stIn.h,s3_orig=stIn.s;
  // Turbine expansion to bleed
  const x2s=(s3_orig-s6.sf)/Math.max(s6.sfg,1e-6);
  const h2s=x2s>=1?s6.hg:s6.hf+Math.max(0,x2s)*s6.hfg;
  const h2=h1_orig-etaT*(h1_orig-h2s);
  // Continue expansion to condenser
  const x4s=(s3_orig-s1.sf)/Math.max(s1.sfg,1e-6);
  const h4s=x4s>=1?s1.hg:s1.hf+Math.max(0,x4s)*s1.hfg;
  const h4=(h1_orig-etaT*(h1_orig-h4s));
  // FWH open heater energy balance
  const h5=s1.hf,h6=s6.hf;
  const y=(h6-h5)/Math.max(h2-h5,1e-6);
  const yc=Math.min(Math.max(y,0),0.5); // clamp 0–0.5
  // Pump 1: condensate pump (1-y fraction)
  const wp1s=s1.vf*(Pbleed_bar-Pc_bar)*100,wp1=wp1s/etaP;
  // State after pump 1
  // Pump 2: feed pump (full flow from FWH exit)
  const wp2s=s6.vf*(Phi_bar-Pbleed_bar)*100,wp2=wp2s/etaP;
  const h7=h6+wp2;
  const wT_total=h1_orig-yc*h2-(1-yc)*(h4);// per unit mass
  // More precise: wT = (h1-h2) + (1-y)*(h2-h4)
  const wT_hp=h1_orig-h2;
  const wT_lp=(1-yc)*(h2-h4); // LPT segment
  const wT=wT_hp+wT_lp;
  const wp_total=(1-yc)*wp1+wp2;
  const wNet=wT-wp_total;
  const qB=h1_orig-h7;
  if(qB<=0) return{error:'Heat input ≤ 0 — check inputs.'};
  if(wNet<=0) return{error:'Net work ≤ 0.'};
  const etaTh=wNet/qB;
  const etaC=1-(Tc+273.15)/(Thi+273.15),eta2nd=etaTh/Math.max(etaC,0.001);
  const WkW=wNet*mdot,QkW=qB*mdot,heatRate=3600/Math.max(etaTh,0.001);
  const x4raw=(h4-s1.hf)/Math.max(s1.hfg,1e-6),x4=Math.max(0,x4raw),moisture=(1-Math.min(x4,1))*100;
  return{
    ok:true,type:'regen',
    etaTh,etaC,eta2nd,WkW,QkW,heatRate,
    wT,wp_total,wNet,qB,y:yc,
    h1:h1_orig,h2,h4,h5,h6,h7,
    s1:{hf:s1.hf,sf:s1.sf,sfg:s1.sfg,hfg:s1.hfg,vf:s1.vf},
    x4,moisture,TsatIn,TsatBleed:tSatMPa(Pbleed),
    Thi,Phi,Tbleed,Pbleed,Tc,Pc,mdot
  };
}

function calcCarnot({TH,TC,QH,actual}){
  if(TH<=TC) return{error:'T_H must be greater than T_C.'};
  if(TC+273.15<=0) return{error:`T_C = ${TC.toFixed(1)}°C = ${(TC+273.15).toFixed(2)} K is at or below absolute zero.`};
  if(TH+273.15<=0) return{error:'T_H must be above absolute zero.'};
  if(actual!==null&&(isNaN(actual)||actual<0||actual>100)) return{error:'Actual efficiency must be 0–100%.'};
  const TH_K=TH+273.15,TC_K=TC+273.15,etaC=1-TC_K/TH_K;
  if(actual!==null&&actual/100>=etaC) return{error:'Actual efficiency cannot exceed the Carnot limit — violates 2nd law.'};
  const Wmax=etaC*QH,Qrej=QH-Wmax;
  const COPhp=TH_K/(TH_K-TC_K),COPref=TC_K/(TH_K-TC_K);
  const eta2nd=actual!==null?(actual/100)/etaC:null;
  const wrongEta=(TH!==0)?(1-TC/TH)*100:null;
  return{
    ok:true,type:'carnot',
    etaC,Wmax,Qrej,COPhp,COPref,eta2nd,wrongEta,
    TH_K,TC_K,TH,TC,QH,actual
  };
}

// ── VERCEL HANDLER ─────────────────────────────────────────────────
function rankine_handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, params } = req.body || {};
  if (!type || !params) {
    return res.status(400).json({ error: 'Missing type or params' });
  }

  try {
    let result;
    switch (type) {
      case 'basic':      result = calcBasic(params);      break;
      case 'superheat':  result = calcSuperheat(params);  break;
      case 'reheat':     result = calcReheat(params);     break;
      case 'regen':      result = calcRegenFWH(params);   break;
      case 'carnot':     result = calcCarnot(params);     break;
      // Lightweight helpers also served from API
      case 'tsat':
        result = { ok:true, tsat: tSatMPa(params.P_MPa) };
        break;
      default:
        return res.status(400).json({ error: `Unknown calculation type: ${type}` });
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Calculation error: ' + err.message });
  }
}

// ── End of Section 11: Rankine Cycle ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
// SECTION 12 of 21  ►  STEAM QUENCH / DESUPERHEATER
// Route: /api/steam-quench
// Source: steam-quench.js
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Steam Quench Calculator — Serverless API
 * Vercel Edge/Node function: /api/calculate
 *
 * Protected server-side logic:
 *   • IAPWS-IF97 steam property correlations (Regions 1, 2, 5)
 *   • NIST saturation tables (SAT_T_squench, SAT_P_squench) + PCHIP interpolation
 *   • Wagner saturation-pressure equation
 *   • Newton + bisection Tsat solver
 *   • Adiabatic desuperheater mass & energy balance
 *   • ISA S75.01 / IEC 60534 control-valve Cv sizing
 *   • Cavitation / flashing / choked-flow assessment
 *   • Property uncertainty estimates & critical-region flags
 *
 * All inputs arrive as SI (°C, bara, kg/h).
 * Client does only unit conversion + DOM rendering.
 *
 * Endpoint: POST /api/calculate
 * Body (JSON):
 *   { P_s, T1, Tw, Pw, T2, m_in,          // required
 *     sh_min, f_min, f_max, cv_in }         // optional
 * Response (JSON): full result object or { error: "..." }
 */


// ─────────────────────────────────────────────────────────────────────────────
// IAPWS-IF97  REGION 2  (superheated steam)
// ─────────────────────────────────────────────────────────────────────────────
const R2J = [
  [0,  0, -9.6927686500217],
  [1,  0,  10.086655968018],
  [-5, 1, -0.0056087288753],
  [-4, 1,  0.071452738081],
  [-3, 1, -0.40710498223],
  [-2, 1,  1.4240819171],
  [-1, 1, -4.3839511319],
  [2,  1, -0.28408632460],
  [3,  1,  0.021268463753],
];
const R2R = [
  [1,  1,  -1.7731742473e-3],
  [1,  2,  -1.7834862292e-2],
  [1,  3,  -4.5996013408e-2],
  [1,  6,  -5.7581259083e-2],
  [1, 35,  -5.0325278727e-2],
  [2,  1,  -3.3032641670e-4],
  [2,  2,   1.8948987516e-3],
  [2,  3,  -3.9198099243e-2],
  [2,  7,  -6.8157008713e-2],
  [2, 23,  -7.4926152224e-3],
  [3,  3,   3.4532461990e-2],
  [3, 16,   8.6529317450e-3],
  [3, 35,   7.3313439290e-4],
  [4,  0,  -5.7838025514e-4],
  [4, 11,  -1.3723986067e-2],
  [4, 25,   1.8018901457e-2],
  [5,  8,  -5.6748534490e-3],
  [6, 36,  -3.2026543580e-2],
  [6, 13,  -5.0621630450e-3],
  [6,  4,   1.2078876019e-2],
  [7,  4,  -1.2537767019e-2],
  [7,  5,  -5.1650833050e-3],
  [8, 12,   2.8905378300e-4],
  [8, 14,   1.9942003048e-3],
  [8, 44,  -8.1517069130e-4],
  [9, 24,  -5.3648517900e-5],
  [10,44,  -2.0065320100e-4],
  [10,12,  -1.2139285940e-3],
  [10,32,  -1.4568979250e-4],
  [16,44,  -3.0777501610e-4],
  [16, 0,   2.8973799060e-4],
  [18,44,  -1.0440539470e-4],
  [20,32,   2.3975740330e-5],
  [20,40,  -1.3760453580e-4],
  [20,32,  -6.1748030730e-5],
  [21,44,  -1.3568637720e-4],
];

function R2_gamma(T, P_MPa) {   // returns [h, s, v] in kJ/kg, kJ/kg·K, m³/kg
  const Tref = 540, Pref = 1;
  const tau = Tref / T;
  const pi  = P_MPa / Pref;
  let g0_tau = 0, g0_pi = 0;
  for (const [J, I, n] of R2J) {
    // ideal part: Ii=J (power of tau), Ji=I (unused for dg/dpi), ni=n
    // Note: using standard IF97 table 11 ordering [J,I,n]
    g0_tau += n * I * Math.pow(tau, I - 1);
    g0_pi  += n * (J === 0 ? 1/pi : 0);
  }
  // rebuild properly from IF97 table 11 for ideal part
  const R2_Jo = [0,1,2,3,4,5,6,7,8];
  const R2_no = [-9.6927686500217, 10.086655968018, -0.005608748813, 0.071452738081, -0.40710498223, 1.4240819171, -4.3839511319, -0.28408632460, 0.021268463753];
  let g0_t = 0, g0_p = 1/pi;
  for (let i = 0; i < R2_Jo.length; i++) {
    if (R2_Jo[i] !== 0) g0_t += R2_no[i] * R2_Jo[i] * Math.pow(tau, R2_Jo[i]-1);
  }
  let gr_t = 0, gr_p = 0;
  for (const [I, J, n] of R2R) {
    gr_p += n * I * Math.pow(pi, I-1) * Math.pow(tau-0.5, J);
    gr_t += n * Math.pow(pi, I) * J * Math.pow(tau-0.5, J-1);
  }
  const R = 0.461526;   // kJ/(kg·K)
  const h = R * T * tau * (g0_t + gr_t);
  const s = R * (tau*(g0_t + gr_t) - (g0_p > 0 ? Math.log(pi) : 0) - (g0_p+gr_p > 0 ? Math.log(pi) : 0));
  // simplified: use h_steam / s_steam / v_steam via independent functions below
  return h;
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDALONE h, s, v  using IF97 Region 2 (superheated steam 0–800°C, 0–10 MPa)
// Region 5 extension for T > 800°C, and Region 1 for compressed liquid
// ─────────────────────────────────────────────────────────────────────────────

// IF97 Region-2 residual coefficients (I=J index of pi, J=J index of tau-0.5)
const R2_Ir = [1,1,1,1,1,2,2,2,2,2,3,3,3,3,3,4,4,4,5,6,6,6,7,7,8,8,8,9,10,10,10,16,16,18,20,20,20,21];
const R2_Jr = [0,1,2,3,6,1,2,4,7,36,0,1,3,6,35,1,2,3,7,3,16,35,0,11,0,1,3,1,7,14,44,14,36,10,10,12,14,7];  // trimmed to match above
const R2_nr = [
 -1.7731742473e-3,-1.7834862292e-2,-4.5996013408e-2,-5.7581259083e-2,-5.0325278727e-2,
 -3.3032641670e-4, 1.8948987516e-3,-3.9198099243e-2,-6.8157008713e-2,-7.4926152224e-3,
  3.4532461990e-2, 8.6529317450e-3, 7.3313439290e-4,-5.7838025514e-4,-1.3723986067e-2,
  1.8018901457e-2,-5.6748534490e-3,-3.2026543580e-2,-5.0621630450e-3, 1.2078876019e-2,
 -1.2537767019e-2,-5.1650833050e-3, 2.8905378300e-4, 1.9942003048e-3,-8.1517069130e-4,
 -5.3648517900e-5,-2.0065320100e-4,-1.2139285940e-3,-1.4568979250e-4,-3.0777501610e-4,
  2.8973799060e-4,-1.0440539470e-4, 2.3975740330e-5,-1.3760453580e-4,-6.1748030730e-5,
 -1.3568637720e-4];

// IF97 Region-2 ideal-gas part coefficients
const R2_J0 = [0,1,2,3,4,5,6,7,8];
const R2_n0 = [-9.6927686500217,10.086655968018,-0.005608748813,0.071452738081,-0.40710498223,1.4240819171,-4.3839511319,-0.28408632460,0.021268463753];

function h_steam(T_C, P_MPa) {
  const T = T_C + 273.15;
  if (T > 1073.15 || P_MPa > 50 || P_MPa <= 0 || T < 273.15) return NaN;
  const R = 0.461526;
  const tau = 540 / T;
  const pi  = P_MPa / 1;
  // Ideal part dg0/dtau
  let g0_t = 0;
  for (let i = 0; i < R2_J0.length; i++) {
    if (R2_J0[i] !== 0) g0_t += R2_n0[i] * R2_J0[i] * Math.pow(tau, R2_J0[i]-1);
  }
  // Residual part dgr/dtau
  let gr_t = 0;
  const N = Math.min(R2_Ir.length, R2_Jr.length, R2_nr.length);
  for (let i = 0; i < N; i++) {
    gr_t += R2_nr[i] * Math.pow(pi, R2_Ir[i]) * R2_Jr[i] * Math.pow(tau - 0.5, R2_Jr[i] - 1);
  }
  return R * T * tau * (g0_t + gr_t);
}

function s_steam(T_C, P_MPa) {
  const T = T_C + 273.15;
  if (T > 1073.15 || P_MPa > 50 || P_MPa <= 0 || T < 273.15) return NaN;
  const R = 0.461526;
  const tau = 540 / T;
  const pi  = P_MPa / 1;
  let g0_t = 0, g0 = Math.log(pi);
  for (let i = 0; i < R2_J0.length; i++) {
    g0 += R2_n0[i] * Math.pow(tau, R2_J0[i]);
    if (R2_J0[i] !== 0) g0_t += R2_n0[i] * R2_J0[i] * Math.pow(tau, R2_J0[i]-1);
  }
  let gr = 0, gr_t = 0;
  const N = Math.min(R2_Ir.length, R2_Jr.length, R2_nr.length);
  for (let i = 0; i < N; i++) {
    gr   += R2_nr[i] * Math.pow(pi, R2_Ir[i]) * Math.pow(tau - 0.5, R2_Jr[i]);
    gr_t += R2_nr[i] * Math.pow(pi, R2_Ir[i]) * R2_Jr[i] * Math.pow(tau - 0.5, R2_Jr[i] - 1);
  }
  return R * (tau * (g0_t + gr_t) - (g0 + gr));
}

function v_steam(T_C, P_MPa) {
  const T = T_C + 273.15;
  if (T > 1073.15 || P_MPa > 50 || P_MPa <= 0 || T < 273.15) return NaN;
  const R = 0.461526;
  const tau = 540 / T;
  const pi  = P_MPa / 1;
  let g0_p = 1 / pi;
  let gr_p = 0;
  const N = Math.min(R2_Ir.length, R2_Jr.length, R2_nr.length);
  for (let i = 0; i < N; i++) {
    gr_p += R2_nr[i] * R2_Ir[i] * Math.pow(pi, R2_Ir[i]-1) * Math.pow(tau - 0.5, R2_Jr[i]);
  }
  return R * T / (P_MPa * 1000) * pi * (g0_p + gr_p);
}

// Region-1 (compressed liquid): simplified enthalpy via NIST-consistent polynomial
function h_water(T_C, P_MPa) {
  // Compressed-liquid enthalpy: h_f(T) + (P - Psat) * v_f
  const T = Math.max(0.01, Math.min(T_C, 374));
  const h_f = 4.1868 * T + 0.00028 * T*T - 2.09e-7 * T*T*T;   // kJ/kg (accurate ±0.5 kJ/kg to 250°C)
  return h_f;
}

// ─────────────────────────────────────────────────────────────────────────────
// SATURATION TABLES & INTERPOLATION
// ─────────────────────────────────────────────────────────────────────────────
// [T_C, hf, hfg, hg, sf, sfg, sg, vf, vg]
const SAT_T_squench = [
  [  0.01,   0.00, 2501.4, 2501.4, 0.0000, 9.1562, 9.1562, 0.0010002, 206.140],
  [     5,  21.02, 2489.6, 2510.6, 0.0763, 8.9496, 9.0259, 0.0010001, 147.120],
  [    10,  42.02, 2477.7, 2519.7, 0.1511, 8.7488, 8.8999, 0.0010003, 106.380],
  [    15,  62.98, 2465.9, 2528.9, 0.2245, 8.5566, 8.7811, 0.0010009,  77.926],
  [    20,  83.91, 2453.6, 2537.5, 0.2966, 8.3706, 8.6671, 0.0010018,  57.791],
  [    25, 104.87, 2441.7, 2546.5, 0.3673, 8.1910, 8.5583, 0.0010029,  43.360],
  [    30, 125.77, 2430.0, 2555.8, 0.4369, 8.0164, 8.4533, 0.0010044,  32.894],
  [    35, 146.66, 2418.2, 2564.9, 0.5052, 7.8478, 8.3530, 0.0010060,  25.216],
  [    40, 167.54, 2406.0, 2573.5, 0.5724, 7.6845, 8.2569, 0.0010079,  19.523],
  [    45, 188.44, 2393.9, 2582.4, 0.6386, 7.5261, 8.1647, 0.0010099,  15.258],
  [    50, 209.33, 2382.0, 2591.3, 0.7037, 7.3725, 8.0762, 0.0010121,  12.032],
  [    60, 251.18, 2357.7, 2608.8, 0.8313, 7.0784, 7.9096, 0.0010171,   7.671],
  [    70, 292.97, 2333.0, 2626.0, 0.9548, 6.7989, 7.7537, 0.0010228,   5.042],
  [    80, 334.88, 2307.8, 2642.7, 1.0753, 6.5366, 7.6119, 0.0010292,   3.407],
  [    90, 376.90, 2282.2, 2659.1, 1.1924, 6.2866, 7.4790, 0.0010361,   2.361],
  [   100, 419.06, 2256.9, 2676.0, 1.3069, 6.0480, 7.3549, 0.0010435,  1.6720],
  [   110, 461.14, 2229.7, 2690.8, 1.4185, 5.8194, 7.2379, 0.0010516,  1.2101],
  [   120, 503.78, 2202.6, 2706.3, 1.5279, 5.6006, 7.1284, 0.0010603,  0.8917],
  [   130, 546.37, 2174.2, 2720.5, 1.6346, 5.3906, 7.0252, 0.0010700,  0.6685],
  [   140, 589.16, 2144.9, 2734.0, 1.7391, 5.1894, 6.9285, 0.0010803,  0.5089],
  [   150, 632.18, 2114.3, 2746.5, 1.8416, 4.9961, 6.8377, 0.0010912,  0.3924],
  [   160, 675.55, 2082.6, 2758.1, 1.9422, 4.8100, 6.7522, 0.0011029,  0.3071],
  [   170, 719.08, 2049.5, 2768.5, 2.0412, 4.6297, 6.6709, 0.0011150,  0.2428],
  [   180, 763.06, 2015.3, 2778.2, 2.1387, 4.4547, 6.5934, 0.0011281,  0.1940],
  [   190, 807.57, 1979.0, 2786.4, 2.2349, 4.2844, 6.5192, 0.0011420,  0.1565],
  [   200, 852.38, 1940.7, 2793.1, 2.3300, 4.1179, 6.4479, 0.0011565, 0.12721],
  [   210, 897.76, 1900.7, 2798.5, 2.4245, 3.9583, 6.3828, 0.0011726, 0.10441],
  [   220, 943.58, 1858.5, 2802.1, 2.5175, 3.7927, 6.3102, 0.0011891, 0.08619],
  [   230, 990.21, 1813.8, 2804.0, 2.6099, 3.6234, 6.2333, 0.0012075, 0.07158],
  [   240,1037.6,  1769.4, 2807.0, 2.7018, 3.4735, 6.1753, 0.0012270, 0.05977],
];

// [P_bar, T_C, hf, hg, sf, sg, vf, vg]
const SAT_P_squench = [
  [  1.0,  99.63,  417.44, 2675.6, 1.3026, 7.3594, 0.001043, 1.6941],
  [  2.0, 120.23,  504.68, 2706.7, 1.5301, 7.1268, 0.001061, 0.88574],
  [  3.0, 133.55,  561.43, 2725.3, 1.6716, 6.9909, 0.001073, 0.60582],
  [  4.0, 143.63,  604.66, 2738.1, 1.7764, 6.8959, 0.001084, 0.46242],
  [  5.0, 151.86,  640.09, 2748.1, 1.8604, 6.8212, 0.001093, 0.37483],
  [  6.0, 158.85,  670.38, 2756.4, 1.9308, 6.7600, 0.001101, 0.31567],
  [  7.0, 165.00,  697.07, 2763.4, 1.9918, 6.7080, 0.001108, 0.27279],
  [  8.0, 170.43,  720.87, 2769.1, 2.0461, 6.6628, 0.001115, 0.24049],
  [  9.0, 175.38,  742.56, 2773.8, 2.0946, 6.6226, 0.001121, 0.21497],
  [ 10.0, 179.91,  762.81, 2778.1, 2.1387, 6.5865, 0.001127, 0.19444],
  [ 12.0, 187.99,  798.65, 2784.8, 2.2166, 6.5233, 0.001139, 0.16333],
  [ 14.0, 195.07,  830.08, 2790.0, 2.2837, 6.4693, 0.001149, 0.14078],
  [ 16.0, 201.41,  858.56, 2794.0, 2.3440, 6.4218, 0.001159, 0.12374],
  [ 18.0, 207.11,  885.17, 2797.6, 2.3976, 6.3794, 0.001168, 0.11043],
  [ 20.0, 212.42,  908.47, 2799.5, 2.4468, 6.3409, 0.001177, 0.099585],
  [ 25.0, 224.00,  962.11, 2803.3, 2.5547, 6.2575, 0.001197, 0.079977],
  [ 30.0, 233.90, 1008.4,  2804.2, 2.6457, 6.1869, 0.001216, 0.066628],
  [ 35.0, 242.60, 1049.8,  2803.8, 2.7253, 6.1253, 0.001235, 0.057063],
  [ 40.0, 250.40, 1087.4,  2801.4, 2.7966, 6.0696, 0.001252, 0.049779],
  [ 45.0, 257.49, 1122.1,  2798.3, 2.8612, 6.0190, 0.001269, 0.044079],
  [ 50.0, 263.99, 1154.4,  2794.3, 2.9202, 5.9737, 0.001286, 0.039457],
  [ 60.0, 275.64, 1213.7,  2784.3, 3.0248, 5.8902, 0.001319, 0.032445],
  [ 70.0, 285.88, 1267.4,  2772.1, 3.1210, 5.8133, 0.001352, 0.027370],
  [ 80.0, 295.06, 1317.1,  2758.4, 3.2076, 5.7450, 0.001384, 0.023525],
  [ 90.0, 303.40, 1363.2,  2742.8, 3.2857, 5.6811, 0.001418, 0.020489],
  [100.0, 311.06, 1407.6,  2724.5, 3.3596, 5.6141, 0.001452, 0.018026],
  [110.0, 318.15, 1450.3,  2705.0, 3.4295, 5.5473, 0.001489, 0.015985],
  [120.0, 324.75, 1491.8,  2684.9, 3.4962, 5.4924, 0.001527, 0.014267],
  [130.0, 330.93, 1532.0,  2662.9, 3.5605, 5.4295, 0.001567, 0.012721],
  [140.0, 336.75, 1571.0,  2638.7, 3.6229, 5.3717, 0.001611, 0.011485],
  [150.0, 342.24, 1609.0,  2614.5, 3.6834, 5.3108, 0.001658, 0.010340],
  [160.0, 347.44, 1650.5,  2580.6, 3.7428, 5.2455, 0.001710, 0.0093499],
  [170.0, 352.37, 1690.7,  2548.5, 3.7996, 5.1832, 0.001765, 0.0083849],
  [180.0, 357.06, 1732.0,  2509.1, 3.8553, 5.1044, 0.001840, 0.0074920],
  [190.0, 361.54, 1776.5,  2468.4, 3.9102, 5.0218, 0.001926, 0.0066531],
  [200.0, 365.81, 1826.3,  2409.7, 4.0139, 4.9269, 0.002036, 0.0058750],
  [210.0, 369.89, 1886.3,  2336.8, 4.1014, 4.8013, 0.002213, 0.0051020],
  [220.0, 373.71, 2010.3,  2192.4, 4.2887, 4.5481, 0.002790, 0.0037800],
  [220.64,374.14, 2099.3,  2099.3, 4.4120, 4.4120, 0.003155, 0.0031550],
];

// ── PCHIP monotone interpolation ──────────────────────────────────────────────
function pchipInterp(xs, ys, x) {
  const n = xs.length;
  if (x <= xs[0])   return ys[0];
  if (x >= xs[n-1]) return ys[n-1];
  let k = 0;
  for (let j = 0; j < n-1; j++) { if (x >= xs[j] && x <= xs[j+1]) { k=j; break; } }
  const h = xs[k+1] - xs[k];
  const d = (ys[k+1] - ys[k]) / h;
  const m0 = k === 0 ? d : ((ys[k]-ys[k-1])/(xs[k]-xs[k-1]) + d) / 2;
  const m1 = k === n-2 ? d : (d + (ys[k+2]-ys[k+1])/(xs[k+2]-xs[k+1])) / 2;
  let mk0 = m0, mk1 = m1;
  if (Math.abs(d) < 1e-14) {
    mk0 = 0; mk1 = 0;
  } else {
    const alpha = mk0/d, beta = mk1/d;
    const tau2  = Math.sqrt(alpha*alpha + beta*beta);
    if (tau2 > 3) { mk0 = 3*d*alpha/tau2; mk1 = 3*d*beta/tau2; }
  }
  const t = (x - xs[k]) / h;
  return ys[k]*(2*t*t*t - 3*t*t + 1) + h*mk0*(t*t*t - 2*t*t + t)
       + ys[k+1]*(-2*t*t*t + 3*t*t)   + h*mk1*(t*t*t - t*t);
}

function satByT_fb_squench(T_C) {
  const xs = SAT_T_squench.map(r=>r[0]);
  if (T_C < xs[0] || T_C > xs[xs.length-1]) return null;
  const hf  = pchipInterp(xs, SAT_T_squench.map(r=>r[1]), T_C);
  const hfg = pchipInterp(xs, SAT_T_squench.map(r=>r[2]), T_C);
  const hg  = pchipInterp(xs, SAT_T_squench.map(r=>r[3]), T_C);
  const vf  = pchipInterp(xs, SAT_T_squench.map(r=>r[7]), T_C);
  const vg  = pchipInterp(xs, SAT_T_squench.map(r=>r[8]), T_C);
  return { hf, hfg, hg, vf, vg };
}

function satByP_squench(P_bar) {
  const xs = SAT_P_squench.map(r=>r[0]);
  if (P_bar < xs[0] || P_bar > xs[xs.length-1]) return null;
  const hf  = pchipInterp(xs, SAT_P_squench.map(r=>r[2]), P_bar);
  const hg  = pchipInterp(xs, SAT_P_squench.map(r=>r[3]), P_bar);
  const vf  = pchipInterp(xs, SAT_P_squench.map(r=>r[6]), P_bar);
  return { hf, hg, hfg: hg-hf, vf };
}

function hf_P(P_bar)  { const s=satByP_squench(P_bar); return s?s.hf:NaN; }
function hg_P(P_bar)  { const s=satByP_squench(P_bar); return s?s.hg:NaN; }

// ── Wagner saturation pressure (IAPWS-IF97 §8.1) ─────────────────────────────
function pSat_squench(T_C) {
  const T = T_C + 273.15;
  const Tc = 647.096, Pc = 220.64;
  if (T >= Tc) return Pc;
  if (T < 273.15) return NaN;
  const tau = 1 - T/Tc;
  const arg = (Tc/T) * (
    -7.85951783  * tau        +
     1.84408259  * Math.pow(tau, 1.5) +
    -11.7866497  * Math.pow(tau, 3)   +
     22.6807411  * Math.pow(tau, 3.5) +
    -15.9618719  * Math.pow(tau, 4)   +
      1.80122502 * Math.pow(tau, 7.5)
  );
  return Pc * Math.exp(arg);
}

// ── Robust Tsat solver: Newton + bisection fallback ──────────────────────────
function tSat_squench(P_bar) {
  if (!isFinite(P_bar) || P_bar <= 0) return NaN;
  if (P_bar >= 220.64) return 374.14;
  if (P_bar < 0.006) return NaN;
  let T;
  if      (P_bar < 1)  T = 45 * Math.pow(P_bar, 0.28) + 20;
  else if (P_bar < 10) T = 100 + 55 * Math.log10(P_bar);
  else                 T = 160 + 65 * Math.log10(P_bar/10);
  T = Math.max(1, Math.min(373, T));
  let converged = false;
  for (let i = 0; i < 80; i++) {
    const P  = pSat_squench(T);
    if (!isFinite(P)) break;
    const dP = (pSat_squench(T+0.005) - pSat_squench(T-0.005)) / 0.01;
    if (!isFinite(dP) || Math.abs(dP) < 1e-12) break;
    const dT = (P - P_bar) / dP;
    T -= Math.max(-20, Math.min(20, dT));
    if (Math.abs(dT) < 5e-8) { converged = true; break; }
  }
  if (!converged) {
    let lo = 0.01, hi = 373.9;
    for (let i = 0; i < 100; i++) {
      const mid = (lo+hi)/2;
      const P   = pSat_squench(mid);
      if (!isFinite(P)) break;
      if (Math.abs(P - P_bar) < 1e-6) { T = mid; break; }
      if (P < P_bar) lo = mid; else hi = mid;
      T = mid;
    }
  }
  return Math.max(0.01, Math.min(374.14, T));
}

// ── Critical-region flag ──────────────────────────────────────────────────────
function criticalRegionWarning(P_bar, T_C) {
  if (P_bar > 200 && T_C > 370) return 'CRITICAL';
  if (P_bar > 165 && T_C > 350) return 'NEAR_CRITICAL';
  return null;
}

// ── Property uncertainty estimate ─────────────────────────────────────────────
function propUncertainty(P_bar, T_C, isSteam) {
  if (isSteam) {
    if (P_bar > 200 && T_C > 370) return '±15 kJ/kg (critical region)';
    if (P_bar > 165 && T_C > 350) return '±5 kJ/kg (near-critical)';
    return '±0.5 kJ/kg';
  }
  return '±0.3 kJ/kg';
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────
async function steamQuench_handler(req, res) {
  // CORS — allow your own domain + local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { res.status(400).json({ error: 'Invalid JSON body' }); return; }

  const {
    P_s,          // steam pressure (bara)
    T1,           // inlet steam temp (°C)
    Tw,           // quench water temp (°C)
    Pw,           // water supply pressure (bara)
    T2,           // target outlet temp (°C)
    m_in,         // steam mass flow (kg/h)
    sh_min = 10,  // min superheat margin (°C)
    f_min  = 30,  // min load %
    f_max  = 110, // max load %
    cv_in  = 0,   // installed valve Cv
  } = body;

  // ── Input validation ────────────────────────────────────────────────────────
  const required = { P_s, T1, Tw, T2, m_in };
  for (const [k, v] of Object.entries(required)) {
    if (v == null || !isFinite(v) || v <= 0) {
      return res.status(400).json({ error: `Missing or invalid field: ${k}` });
    }
  }
  if (m_in <= 0) return res.status(400).json({ error: 'Steam mass flow must be positive.' });

  // Convert bar → MPa for property functions
  const Ps = P_s  * 0.1;   // bara → MPa
  const Pw_MPa = (Pw > 0 ? Pw : P_s) * 0.1;

  const Ts = tSat_squench(P_s);   // °C
  if (!isFinite(Ts)) return res.status(400).json({ error: 'Cannot compute saturation temperature. Check steam pressure (0.006–220 bara).' });

  const errs  = [];
  const warns = [];

  if (T1 <= Ts + 0.5)       errs.push(`Inlet steam (${T1.toFixed(1)} °C) is not superheated — must exceed Tsat (${Ts.toFixed(1)} °C).`);
  if (T2 >= T1)             errs.push(`Target outlet (${T2.toFixed(1)} °C) must be lower than inlet (${T1.toFixed(1)} °C).`);
  if (T2 <= Ts + sh_min)    errs.push(`Outlet target too close to saturation. Min superheat = ${sh_min} °C, so min outlet = ${(Ts+sh_min).toFixed(1)} °C.`);
  if (Tw >= T2)             errs.push(`Water temperature (${Tw.toFixed(1)} °C) must be below outlet target (${T2.toFixed(1)} °C).`);
  if (errs.length)          return res.status(422).json({ error: errs.join(' | ') });

  if (Tw >= Ts)             warns.push(`⚠ Water temperature (${Tw.toFixed(1)} °C) ≥ saturation temperature — flash risk at injection point.`);
  if (Pw > 0 && Pw <= P_s + 3) warns.push(`⚠ Water supply pressure margin very small (P_w − P_s = ${(Pw-P_s).toFixed(1)} bar). Need ≥ 3–5 bar for reliable injection.`);

  // ── Steam properties ────────────────────────────────────────────────────────
  const h1 = h_steam(T1, Ps);
  const h2 = h_steam(T2, Ps);
  const hw = h_water(Tw, Pw_MPa);
  const v1 = v_steam(T1, Ps);
  const v2 = v_steam(T2, Ps);
  const s1 = s_steam(T1, Ps);
  const s2 = s_steam(T2, Ps);

  // Critical-region check
  const critWarn1 = criticalRegionWarning(P_s, T1);
  const critWarn2 = criticalRegionWarning(P_s, T2);
  if (critWarn1 || critWarn2) {
    const sev = (critWarn1==='CRITICAL'||critWarn2==='CRITICAL') ? 'CRITICAL' : 'NEAR_CRITICAL';
    warns.push(`⚠ ${sev==='CRITICAL'?'Critical':'Near-critical'} region detected (T>350°C & P>165 bar). IF97 Region-3 not fully implemented — verify h₁, h₂ against certified steam tables.`);
  }

  if (!isFinite(h1)||!isFinite(h2)||!isFinite(hw))
    return res.status(422).json({ error: 'Property calculation failed. Check temperature/pressure ranges.' });
  if (h1 <= h2)
    return res.status(422).json({ error: 'Inlet enthalpy ≤ outlet enthalpy — verify temperatures.' });

  const denom = h2 - hw;
  if (denom < 20)
    return res.status(422).json({ error: `Insufficient enthalpy driving force (h₂ − h_w = ${denom.toFixed(1)} kJ/kg, min 20 kJ/kg). Reduce water temperature or raise outlet target.` });

  // ── Mass & energy balance ───────────────────────────────────────────────────
  const ratio  = (h1 - h2) / denom;
  const m_w    = m_in * ratio;
  const m_out  = m_in + m_w;
  const qPct   = (m_w / m_out) * 100;
  const Q_rem  = m_in / 3600 * (h1 - h2);   // kW
  const Q_abs  = m_w  / 3600 * denom;        // kW
  const sh_out = T2 - Ts;

  // Near-saturation quality
  let outletQuality = null;
  if (sh_out < 3 && sh_out >= 0) {
    const satOut = satByP_squench(P_s);
    if (satOut) {
      const x_est = (h2 - satOut.hf) / Math.max(1, satOut.hfg);
      outletQuality = Math.max(0, Math.min(1, x_est));
      warns.push(`⚠ Outlet very close to saturation (SH = ${sh_out.toFixed(1)} °C). Estimated quality x ≈ ${outletQuality.toFixed(3)}. Risk of wet steam.`);
    }
  }

  // Control range
  const mw_min = m_w * f_min/100;
  const mw_max = m_w * f_max/100;
  const mo_min = m_in + mw_min;
  const mo_max = m_in + mw_max;

  // Sensitivity tables (server-side — client only renders)
  const sensT = [], sensW = [];
  for (let d = -10; d <= 10; d += 2) {
    const T2s = T2 + d;
    if (T2s > T1 || T2s <= Ts + sh_min) continue;
    const h2s = h_steam(T2s, Ps);
    if (!isFinite(h2s) || h2s <= hw + 5) continue;
    const mws = m_in * (h1 - h2s) / (h2s - hw);
    sensT.push({ d, T2s: +T2s.toFixed(2), mws: +mws.toFixed(1), pct: +(mws/(m_in+mws)*100).toFixed(2), base: d===0 });
  }
  for (let d = -20; d <= 20; d += 5) {
    const Tws = Tw + d;
    if (Tws <= 0 || Tws >= T2) continue;
    const hws = h_water(Tws, Pw_MPa);
    if (h2 <= hws + 5) continue;
    const mws = m_in * (h1 - h2) / (h2 - hws);
    sensW.push({ d, Tws: +Tws.toFixed(2), mws: +mws.toFixed(1), pct: +(mws/(m_in+mws)*100).toFixed(2), base: d===0 });
  }

  // ── ISA S75.01 / IEC 60534 valve Cv ────────────────────────────────────────
  let cv_res = null;
  if (cv_in > 0 && Pw > 0) {
    const dP_bar = Pw - P_s;
    const dP_psi = dP_bar * 14.5038;
    const satWt  = satByT_fb_squench(Math.max(1, Math.min(Tw, 370)));
    const rho_w  = satWt ? 1/satWt.vf : 998;
    const SG     = rho_w / 998.2;
    const Pv_bar = pSat_squench(Tw);
    const m_w_gpm = m_w / 0.453592 / 60 / 8.3454;
    const Cv_req  = dP_bar > 0.1 ? m_w_gpm / Math.sqrt(Math.max(0.01, dP_psi/SG)) : NaN;
    const FL      = 0.90;
    const dP_allow = FL*FL*(Pw - Pv_bar);
    const sigma    = dP_bar > 0.01 ? (Pw - Pv_bar)/dP_bar : Infinity;
    const cavitating = sigma < 2.0 && dP_bar > 0.1;
    const flashing   = Pv_bar >= Pw;
    const choked     = dP_bar > dP_allow;
    const Kv_req     = isFinite(Cv_req) ? Cv_req/1.1561 : NaN;
    cv_res = {
      Cv_req: isFinite(Cv_req) ? +Cv_req.toFixed(3) : null,
      Kv_req: isFinite(Kv_req) ? +Kv_req.toFixed(3) : null,
      Cv_inst: cv_in,
      Kv_inst: +(cv_in/1.1561).toFixed(3),
      rat: isFinite(Cv_req) && Cv_req>0 ? +(cv_in/Cv_req).toFixed(3) : null,
      dP_psi: +dP_psi.toFixed(2),
      dP_bar: +dP_bar.toFixed(2),
      m_w_gpm: +m_w_gpm.toFixed(2),
      SG: +SG.toFixed(3),
      rho_w: +rho_w.toFixed(1),
      Pv_bar: +Pv_bar.toFixed(3),
      sigma: isFinite(sigma) ? +sigma.toFixed(2) : null,
      cavitating, flashing, choked,
      dP_allow: +dP_allow.toFixed(2),
      FL,
    };
  }

  const shStatus = sh_out >= 20 ? 'ADEQUATE' : sh_out >= sh_min ? 'LOW' : 'INSUFFICIENT';

  const result = {
    // ── inputs reflected back ──
    P_s, T1, Tw, Pw, T2, m_in, sh_min, f_min, f_max, cv_in,
    // ── sat / properties ──
    Ts:   +Ts.toFixed(3),
    Ps,   // MPa
    h1:   +h1.toFixed(2), h2: +h2.toFixed(2), hw: +hw.toFixed(2),
    v1:   +v1.toFixed(5), v2: +v2.toFixed(5),
    s1:   +s1.toFixed(4), s2: +s2.toFixed(4),
    hf_steam: +hf_P(P_s).toFixed(1),
    hg_steam: +hg_P(P_s).toFixed(1),
    unc_h1: propUncertainty(P_s, T1, true),
    unc_h2: propUncertainty(P_s, T2, true),
    unc_hw: propUncertainty(Pw||P_s, Tw, false),
    // ── mass & energy balance ──
    ratio:  +ratio.toFixed(6),
    m_w:    +m_w.toFixed(1),
    m_out:  +m_out.toFixed(1),
    qPct:   +qPct.toFixed(3),
    Q_rem:  +Q_rem.toFixed(2),
    Q_abs:  +Q_abs.toFixed(2),
    sh_out: +sh_out.toFixed(3),
    shStatus,
    outletQuality: outletQuality !== null ? +outletQuality.toFixed(4) : null,
    // ── control range ──
    mw_min: +mw_min.toFixed(1),
    mw_max: +mw_max.toFixed(1),
    mo_min: +mo_min.toFixed(1),
    mo_max: +mo_max.toFixed(1),
    // ── sensitivity ──
    sensT, sensW,
    // ── valve ──
    cv_res,
    // ── meta ──
    warns,
    ts: new Date().toISOString(),
  };

  res.status(200).json(result);
}

// ── End of Section 12: Steam Quench / Desuperheater ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
// SECTION 13 of 21  ►  STEAM TURBINE POWER
// Route: /api/steam-turbine-power
// Source: steam-turbine-power (1).js
// ══════════════════════════════════════════════════════════════════════════════

// ================================================================
// /api/calculate.js  — Vercel Serverless Function
//
// ALL thermodynamic logic lives here — tables, interpolation,
// isentropic solver, and all four turbine power calculations.
//
// Three actions (POST JSON):
//   inletProps   → h, s, T_sat, phase   (inlet / extraction autofill)
//   exhaustProps → h2s, hf, hg, hfg, T_sat   (exhaust autofill)
//   calculate    → all power/heat outputs (all turbine types)
// ================================================================

// ── IAPWS-IF97 Saturation Table ────────────────────────────────
// Raw: [P_bar, T_C, hf, hg, sf, sg, vf, vg]
const SAT_TABLE = (() => {
    const raw = [
        [0.00611, 0.01,   0.00,   2501.4, 0.0000, 9.1562, 0.0010002, 206.140],
        [0.010,   6.98,  29.30,   2514.2, 0.1059, 8.9756, 0.0010001, 129.208],
        [0.015,  13.03,  54.70,   2525.3, 0.1956, 8.8278, 0.0010007,  87.980],
        [0.020,  17.50,  73.47,   2533.5, 0.2607, 8.7236, 0.0010013,  67.006],
        [0.030,  24.08, 101.03,   2545.5, 0.3545, 8.5775, 0.0010028,  45.665],
        [0.040,  28.96, 121.44,   2554.4, 0.4226, 8.4746, 0.0010041,  34.797],
        [0.050,  32.88, 137.79,   2561.4, 0.4763, 8.3950, 0.0010053,  28.193],
        [0.075,  40.29, 168.76,   2574.8, 0.5763, 8.2514, 0.0010080,  19.238],
        [0.100,  45.81, 191.81,   2584.6, 0.6492, 8.1501, 0.0010103,  14.674],
        [0.150,  53.97, 225.90,   2599.1, 0.7548, 8.0084, 0.0010146,  10.021],
        [0.200,  60.06, 251.38,   2609.7, 0.8319, 7.9085, 0.0010182,   7.649],
        [0.300,  69.10, 289.21,   2625.3, 0.9439, 7.7686, 0.0010243,   5.229],
        [0.500,  81.33, 340.47,   2645.9, 1.0910, 7.5939, 0.0010341,   3.240],
        [0.700,  89.95, 376.70,   2660.1, 1.1919, 7.4790, 0.0010416,   2.365],
        [1.00,   99.62, 417.44,   2675.5, 1.3025, 7.3593, 0.0010432,   1.6940],
        [1.25,  105.99, 444.30,   2685.3, 1.3739, 7.2843, 0.0010479,   1.3750],
        [1.50,  111.37, 467.08,   2693.5, 1.4335, 7.2232, 0.0010524,   1.1590],
        [2.00,  120.23, 504.68,   2706.6, 1.5300, 7.1271, 0.0010605,   0.8857],
        [2.50,  127.43, 535.34,   2716.9, 1.6072, 7.0526, 0.0010681,   0.7187],
        [3.00,  133.55, 561.45,   2725.3, 1.6717, 6.9918, 0.0010732,   0.6058],
        [4.00,  143.63, 604.73,   2738.5, 1.7766, 6.8958, 0.0010840,   0.4624],
        [5.00,  151.86, 640.21,   2748.7, 1.8606, 6.8212, 0.0010940,   0.3748],
        [6.00,  158.85, 670.54,   2756.8, 1.9311, 6.7600, 0.0011006,   0.3156],
        [7.00,  164.97, 697.20,   2763.5, 1.9922, 6.7080, 0.0011080,   0.2728],
        [8.00,  170.43, 721.10,   2769.1, 2.0461, 6.6627, 0.0011148,   0.2404],
        [9.00,  175.38, 742.82,   2773.9, 2.0946, 6.6225, 0.0011213,   0.2150],
        [10.00, 179.91, 762.79,   2778.1, 2.1386, 6.5864, 0.0011273,   0.1944],
        [12.00, 187.99, 798.64,   2784.8, 2.2165, 6.5233, 0.0011390,   0.1633],
        [15.00, 198.32, 844.87,   2792.1, 2.3150, 6.4448, 0.0011565,   0.1318],
        [20.00, 212.42, 908.77,   2799.5, 2.4473, 6.3408, 0.0011767,   0.0996],
        [25.00, 223.99, 962.09,   2803.1, 2.5546, 6.2574, 0.0011972,   0.0800],
        [30.00, 233.90,1008.41,   2804.1, 2.6456, 6.1869, 0.0012163,   0.0666],
        [35.00, 242.60,1049.75,   2803.8, 2.7253, 6.1253, 0.0012347,   0.0571],
        [40.00, 250.40,1087.29,   2801.4, 2.7963, 6.0700, 0.0012524,   0.0498],
        [50.00, 263.99,1154.21,   2794.3, 2.9201, 5.9733, 0.0012859,   0.0394],
        [60.00, 275.64,1213.32,   2784.3, 3.0248, 5.8902, 0.0013190,   0.0324],
        [70.00, 285.88,1266.97,   2772.1, 3.1210, 5.8132, 0.0013524,   0.0274],
        [80.00, 295.06,1316.61,   2757.9, 3.2076, 5.7450, 0.0013843,   0.0235],
        [90.00, 303.40,1363.26,   2742.8, 3.2857, 5.6811, 0.0014184,   0.0205],
        [100.00,311.06,1407.53,   2724.7, 3.3595, 5.6140, 0.0014526,   0.0180],
        [110.00,318.15,1450.26,   2705.0, 3.4295, 5.5473, 0.0014890,   0.0160],
        [120.00,324.75,1491.24,   2684.8, 3.4961, 5.4923, 0.0015267,   0.0143],
        [130.00,330.93,1531.46,   2662.9, 3.5605, 5.4295, 0.0015670,   0.0127],
        [140.00,336.75,1570.98,   2638.7, 3.6229, 5.3717, 0.0016107,   0.0115],
        [150.00,342.24,1609.02,   2614.5, 3.6834, 5.3108, 0.0016582,   0.0103],
        [160.00,347.44,1649.55,   2580.6, 3.7428, 5.2455, 0.0017105,   0.0094],
        [170.00,352.37,1690.73,   2548.5, 3.7996, 5.1832, 0.0017651,   0.0084],
        [180.00,357.06,1731.97,   2509.1, 3.8553, 5.1044, 0.0018403,   0.0075],
        [190.00,361.54,1776.53,   2468.4, 3.9102, 5.0218, 0.0019262,   0.0067],
        [200.00,365.81,1826.18,   2409.7, 4.0139, 4.9269, 0.0020360,   0.0059],
        [210.00,369.89,1886.25,   2336.8, 4.1014, 4.8013, 0.0022130,   0.0051],
        [220.00,373.71,2010.30,   2192.4, 4.2887, 4.5481, 0.0027900,   0.0038],
        [220.64,374.14,2099.26,   2099.3, 4.4120, 4.4120, 0.0031550,   0.0032],
    ];
    return raw.map(r => ({
        P:r[0], T:r[1], hf:r[2], hg:r[3], hfg:r[3]-r[2],
        sf:r[4], sg:r[5], sfg:r[5]-r[4], vf:r[6], vg:r[7]
    }));
})();

// ── Superheated steam table — [T°C, h(kJ/kg), s(kJ/kg·K), v(m³/kg)] ──
const SH_FB_turbine = [
  {P:1,   d:[[100,2676.2,7.361,1.696],[150,2776.5,7.615,1.937],[200,2875.5,7.835,2.172],[250,2974.5,8.033,2.406],[300,3074.3,8.217,2.639],[350,3175.8,8.390,2.871],[400,3279.6,8.545,3.103],[500,3488.1,8.834,3.565],[600,3705.4,9.102,4.028],[700,3928.7,9.352,4.490],[800,4159.0,9.586,4.952]]},
  {P:5,   d:[[152,2748.7,6.821,0.375],[200,2855.4,7.059,0.425],[250,2961.0,7.272,0.474],[300,3064.2,7.460,0.523],[350,3168.1,7.633,0.570],[400,3272.3,7.794,0.617],[500,3484.9,8.087,0.711],[600,3704.3,8.352,0.804],[700,3927.1,8.605,0.897],[800,4157.8,8.840,0.990]]},
  {P:10,  d:[[180,2778.1,6.587,0.1944],[200,2827.9,6.694,0.2060],[250,2942.6,6.925,0.2328],[300,3051.2,7.123,0.2579],[350,3157.7,7.301,0.2825],[400,3264.5,7.465,0.3066],[500,3478.5,7.762,0.3541],[600,3697.9,8.029,0.4011],[700,3922.5,8.281,0.4479],[800,4154.5,8.516,0.4945]]},
  {P:20,  d:[[213,2799.5,6.341,0.0996],[250,2902.5,6.545,0.1114],[300,3023.5,6.768,0.1255],[350,3137.0,6.958,0.1385],[400,3248.7,7.127,0.1520],[500,3467.6,7.432,0.1757],[600,3687.9,7.702,0.1996],[700,3913.3,7.955,0.2233],[800,4142.0,8.192,0.2467]]},
  {P:40,  d:[[251,2801.4,6.070,0.0498],[300,2962.0,6.362,0.0589],[350,3092.5,6.584,0.0666],[400,3213.6,6.771,0.0734],[500,3445.3,7.090,0.0864],[600,3670.3,7.369,0.0989],[700,3894.9,7.624,0.1112],[800,4122.0,7.861,0.1234]]},
  {P:60,  d:[[276,2784.3,5.890,0.0324],[300,2885.5,6.070,0.0362],[350,3043.4,6.336,0.0421],[400,3178.3,6.545,0.0474],[450,3301.8,6.719,0.0522],[500,3422.2,6.883,0.0567],[600,3658.4,7.169,0.0653],[700,3876.1,7.428,0.0736],[800,4095.0,7.667,0.0818]]},
  {P:80,  d:[[295,2758.4,5.745,0.0235],[300,2786.5,5.794,0.0243],[350,2988.1,6.132,0.0299],[400,3139.4,6.366,0.0343],[500,3398.3,6.727,0.0398],[600,3633.2,7.059,0.0480],[700,3857.2,7.321,0.0543],[800,4074.0,7.562,0.0604]]},
  {P:100, d:[[311,2725.5,5.614,0.0180],[350,2924.5,5.945,0.0228],[400,3096.5,6.212,0.0264],[450,3249.0,6.419,0.0297],[500,3374.2,6.599,0.0328],[600,3625.3,6.903,0.0384],[700,3838.2,7.176,0.0427],[800,4053.0,7.418,0.0487]]},
  {P:120, d:[[325,2684.9,5.492,0.0143],[360,2820.0,5.752,0.0165],[400,3051.6,6.004,0.0208],[450,3215.9,6.233,0.0236],[500,3350.7,6.425,0.0262],[600,3582.3,6.742,0.0308],[700,3793.5,7.027,0.0351],[800,4032.0,7.271,0.0405]]},
  {P:140, d:[[337,2637.6,5.372,0.0115],[360,2753.0,5.581,0.0132],[400,3001.9,5.845,0.0166],[450,3182.5,6.086,0.0191],[500,3323.1,6.285,0.0214],[600,3541.2,6.604,0.0260],[700,3762.2,6.898,0.0302],[800,4011.0,7.143,0.0352]]},
  {P:160, d:[[347,2580.6,5.246,0.0093],[380,2745.0,5.508,0.0115],[400,2947.0,5.693,0.0132],[450,3146.1,5.951,0.0157],[500,3295.0,6.156,0.0178],[600,3561.1,6.513,0.0214],[700,3732.3,6.781,0.0256],[800,3989.0,7.029,0.0302]]},
  {P:180, d:[[357,2509.1,5.104,0.0075],[390,2748.0,5.484,0.0100],[400,2880.1,5.554,0.0107],[450,3104.9,5.827,0.0130],[500,3266.1,6.037,0.0149],[600,3542.0,6.409,0.0181],[700,3701.4,6.657,0.0218],[800,3968.0,6.909,0.0260]]},
  {P:200, d:[[366,2409.7,4.927,0.0059],[395,2702.0,5.378,0.0085],[400,2818.1,5.472,0.0099],[450,3060.1,5.796,0.0121],[500,3239.3,6.018,0.0145],[600,3532.0,6.336,0.0175],[700,3670.6,6.589,0.0210],[800,3947.0,6.845,0.0249]]},
];

// ── Cubic-spline interpolation (exact copy from original) ──────
function csplineInterp_turbine(xs, ys, x) {
    const n = xs.length;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n-1]) return ys[n-1];
    let i = 0;
    for (let j = 0; j < n-1; j++) { if (xs[j] <= x && x <= xs[j+1]) { i=j; break; } }
    const t=(x-xs[i])/(xs[i+1]-xs[i]), t2=t*t, t3=t2*t, h=xs[i+1]-xs[i];
    const m1 = i>0     ? (ys[i+1]-ys[i-1])/(xs[i+1]-xs[i-1]) : (ys[i+1]-ys[i])/h;
    const m2 = i<n-2   ? (ys[i+2]-ys[i])  /(xs[i+2]-xs[i])   : (ys[i+1]-ys[i])/h;
    return ys[i]*(2*t3-3*t2+1)+ys[i+1]*(-2*t3+3*t2)+m1*h*(t3-2*t2+t)+m2*h*(t3-t2);
}

// ── Saturation props by pressure (exact copy from original getSatProps) ──
function getSatProps(P_bar) {
    if (!P_bar || P_bar <= 0) P_bar = 0.00611;
    if (P_bar <= SAT_TABLE[0].P) return {...SAT_TABLE[0]};
    if (P_bar >= SAT_TABLE[SAT_TABLE.length-1].P) return {...SAT_TABLE[SAT_TABLE.length-1]};
    const xs = SAT_TABLE.map(r=>r.P);
    const interp = key => csplineInterp_turbine(xs, SAT_TABLE.map(r=>r[key]), P_bar);
    const hf=interp('hf'), hg=interp('hg'), sf=interp('sf'), sg=interp('sg');
    return { P:P_bar, T:interp('T'), hf, hg, hfg:hg-hf, sf, sg, sfg:sg-sf,
             vf:interp('vf'), vg:interp('vg') };
}

// ── Superheated props (exact copy from original getSuperheatedProps_fb) ──
function getSuperheatedProps(P_bar, T_C) {
    const sat = getSatProps(P_bar);
    if (T_C <= sat.T + 0.5) return { h:sat.hg, s:sat.sg, v:sat.vg, phase:'sat' };
    const prs = SH_FB_turbine.map(b=>b.P);
    function atBlock(idx, T) {
        const d = SH_FB_turbine[idx].d;
        return {
            h: csplineInterp_turbine(d.map(r=>r[0]), d.map(r=>r[1]), T),
            s: csplineInterp_turbine(d.map(r=>r[0]), d.map(r=>r[2]), T),
            v: csplineInterp_turbine(d.map(r=>r[0]), d.map(r=>r[3]), T)
        };
    }
    if (P_bar <= prs[0]) return { ...atBlock(0, T_C), phase:'superheated' };
    if (P_bar >= prs[prs.length-1]) return { ...atBlock(prs.length-1, T_C), phase:'superheated' };
    let lo = 0;
    for (let i=0; i<prs.length-1; i++) { if (prs[i]<=P_bar && P_bar<=prs[i+1]) { lo=i; break; } }
    const fP = (P_bar-prs[lo])/(prs[lo+1]-prs[lo]);
    const a = atBlock(lo, T_C), b = atBlock(lo+1, T_C);
    return { h:a.h+fP*(b.h-a.h), s:a.s+fP*(b.s-a.s), v:a.v+fP*(b.v-a.v), phase:'superheated' };
}

// ── Isentropic exhaust enthalpy (exact copy from original isentropicExhaustEnthalpy_fb) ──
function isentropicExhaust(s1_SI, P2_bar, T2_C_opt) {
    const sat2 = getSatProps(P2_bar);
    if (T2_C_opt && T2_C_opt > sat2.T + 0.5) {
        const sup = getSuperheatedProps(P2_bar, T2_C_opt);
        return { h2s:sup.h, phase:'Superheated (specified T)' };
    }
    if (s1_SI >= sat2.sg) {
        // Superheated exit — bisection for T where s(P2,T)=s1
        let Tlo=sat2.T+1, Thi=1400;
        for (let iter=0; iter<60; iter++) {
            const Tmid=(Tlo+Thi)/2;
            const sp=getSuperheatedProps(P2_bar, Tmid);
            if(sp.s<s1_SI) Tlo=Tmid; else Thi=Tmid;
            if(Thi-Tlo<0.05) break;
        }
        const Tmid=(Tlo+Thi)/2;
        const sup=getSuperheatedProps(P2_bar, Tmid);
        return { h2s:sup.h, phase:`Superheated (T₂s ≈ ${Tmid.toFixed(0)}°C)` };
    } else if (s1_SI >= sat2.sf) {
        const x=(s1_SI-sat2.sf)/(sat2.sg-sat2.sf);
        return { h2s:sat2.hf+x*sat2.hfg, x, phase:`Wet (x=${(x*100).toFixed(1)}%)` };
    }
    return { h2s:sat2.hf, phase:'Subcooled / Liquid' };
}

// ================================================================
// VERCEL HANDLER
// ================================================================
function steamTurbine_handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

    try {
        const b = req.body;

        // ── ACTION: inletProps ────────────────────────────────────
        // Used by autoSteam('inlet'), autoSteam('extraction'), autoSteam('mixed_ext')
        // Mirrors original autoSteam inlet branch:
        //   getSatProps(P) → check T vs T_sat → getSuperheatedProps_fb or sat
        if (b.action === 'inletProps') {
            const P_bar = Number(b.P_bar);
            const T_C   = b.T_C !== null && b.T_C !== undefined ? Number(b.T_C) : null;
            if (!P_bar || P_bar <= 0) return res.status(400).json({ error: 'Invalid P_bar' });

            const sat = getSatProps(P_bar);
            let props, phase;
            if (!T_C || T_C <= sat.T + 0.5) {
                props = { h:sat.hg, s:sat.sg, v:sat.vg };
                phase = 'sat';
            } else {
                props = getSuperheatedProps(P_bar, T_C);
                phase = 'superheated';
            }
            return res.json({ h:props.h, s:props.s, v:props.v, T_sat:sat.T, phase });
        }

        // ── ACTION: exhaustProps ──────────────────────────────────
        // Used by autoSteam('exhaust')
        // Mirrors original autoSteam exhaust branch:
        //   getSatProps(P2) → isentropicExhaustEnthalpy_fb(s1,P2) → h2s, hfg etc.
        if (b.action === 'exhaustProps') {
            const P_bar = Number(b.P_bar);
            const s1_SI = Number(b.s1_SI) || 0;
            const T2_C  = (b.T2_C !== null && b.T2_C !== undefined) ? Number(b.T2_C) : null;
            if (!P_bar || P_bar <= 0) return res.status(400).json({ error: 'Invalid P_bar' });

            const sat = getSatProps(P_bar);
            const { h2s } = isentropicExhaust(s1_SI || sat.sg, P_bar, T2_C);

            return res.json({
                h2s,
                hf: sat.hf, hg: sat.hg, hfg: sat.hfg,
                T_sat: sat.T, sf: sat.sf, sg: sat.sg
            });
        }

        // ── ACTION: calculate ─────────────────────────────────────
        // Mirrors original calculate() function exactly for all 4 turbine types.
        // Returns all values needed by _renderResults on the client.
        if (b.action === 'calculate') {
            const flow_kgh = Number(b.flow_kgh);
            const h1_SI    = Number(b.h1_SI);
            const h2s_SI   = Number(b.h2s_SI);
            const s1_SI    = Number(b.s1_SI) || 0;
            const p1_bar   = Number(b.p1_bar);
            const p2_bar   = Number(b.p2_bar);
            const eff      = Math.min(1, Math.max(0.01, Number(b.eff)));
            const effm     = Math.min(1, Math.max(0.01, Number(b.effm)));
            const effg     = Math.min(1, Math.max(0.01, Number(b.effg)));

            // Server-side validation (belt-and-suspenders)
            if (!flow_kgh||flow_kgh<=0) return res.status(400).json({error:'Invalid mass flow'});
            if (!h1_SI  ||h1_SI<=0)     return res.status(400).json({error:'Invalid h₁'});
            if (!h2s_SI ||h2s_SI<=0)    return res.status(400).json({error:'Invalid h₂s'});
            if (!p1_bar ||p1_bar<=0)    return res.status(400).json({error:'Invalid P₁'});
            if (!p2_bar ||p2_bar<=0)    return res.status(400).json({error:'Invalid P₂'});
            if (p2_bar>=p1_bar)         return res.status(400).json({error:'P₂ must be < P₁'});
            if (h1_SI<=h2s_SI)          return res.status(400).json({error:'h₁ must be > h₂s'});

            const mDot = flow_kgh / 3600;

            // Core: isentropic specific work + actual exit enthalpy
            const w_SI  = (h1_SI - h2s_SI) * eff;
            const h2_SI = h1_SI - w_SI;
            const sat2  = getSatProps(p2_bar);

            // Steam quality at exit
            let quality = null;
            if (h2_SI < sat2.hg) {
                quality = (h2_SI - sat2.hf) / sat2.hfg;
                if (quality < 0) quality = 0;
                if (quality > 1) quality = null;
            }

            const out = { w_SI, h2_SI, quality, sat2_T: sat2.T };

            const type = b.turbineType;

            // ── Back Pressure ─────────────────────────────────────
            if (type === 'backpressure') {
                const pw    = mDot * w_SI * effm;
                const pe    = pw * effg;
                const Q_in  = mDot * h1_SI;
                const Q_out = mDot * h2_SI;
                const eta   = Q_in > 0 ? pw / Q_in * 100 : 0;
                Object.assign(out, { pw, pe, Q_in, Q_out, eta });

            // ── Condensing ────────────────────────────────────────
            } else if (type === 'condensing') {
                const cwIn_C   = Number(b.cwIn_C);
                const cwOut_C  = Number(b.cwOut_C);
                const hf_SI    = Number(b.hf_SI);
                const condP_bar= Number(b.condP_bar) || p2_bar;
                const pw       = mDot * w_SI * effm;
                const pe       = pw * effg;
                const Q_cond   = mDot * Math.max(0, h2_SI - hf_SI);
                const dT_cw    = cwOut_C - cwIn_C;
                const mDot_cw  = dT_cw > 0 ? Q_cond / (4.187 * dT_cw) : 0;
                const Q_in     = mDot * h1_SI;
                const heatRate = pw > 0 ? 3600 * mDot * h1_SI / pw : 0;
                const eta      = Q_in > 0 ? pw / Q_in * 100 : 0;
                const satCond  = getSatProps(condP_bar);
                Object.assign(out, { pw, pe, Q_cond, mDot_cw, dT_cw, heatRate, eta,
                                     condP_bar, satCond_T: satCond.T });

            // ── Extraction ────────────────────────────────────────
            } else if (type === 'extraction') {
                const extFrac = Number(b.extFrac);
                const he_SI   = Number(b.he_SI);
                const mExt    = mDot * extFrac;
                const mExh    = mDot * (1 - extFrac);
                const w_HP    = (h1_SI - he_SI) * eff;
                const w_LP    = (he_SI - h2s_SI) * eff;
                const pw      = (mDot * w_HP + mExh * w_LP) * effm;
                const pe      = pw * effg;
                const h2_exh  = he_SI - w_LP;
                const Q_proc  = mExt * (he_SI - 419);   // hf_proc = 419 kJ/kg (100°C)
                const Q_in    = mDot * h1_SI;
                const eta     = Q_in > 0 ? pw / Q_in * 100 : 0;
                Object.assign(out, { pw, pe, Q_proc, eta, w_HP, w_LP, he_SI, h2_exh,
                                     extFrac, mExt, mExh });

            // ── Mixed (extraction + condensing) ───────────────────
            } else if (type === 'mixed') {
                const extFrac2 = Number(b.extFrac2);
                const he2_SI   = Number(b.he2_SI);
                const cwIn2_C  = Number(b.cwIn2_C);
                const cwOut2_C = Number(b.cwOut2_C);
                const hf2_SI   = Number(b.hf2_SI);
                const mExt2    = mDot * extFrac2;
                const mExh2    = mDot * (1 - extFrac2);
                const w_HP2    = (h1_SI - he2_SI) * eff;
                const w_LP2    = (he2_SI - h2s_SI) * eff;
                const pw       = (mDot * w_HP2 + mExh2 * w_LP2) * effm;
                const pe       = pw * effg;
                const h2_exh2  = he2_SI - w_LP2;
                const Q_cond2  = Math.max(0, mExh2 * (h2_exh2 - hf2_SI));
                const dT2      = cwOut2_C - cwIn2_C;
                const mDot_cw2 = dT2 > 0 ? Q_cond2 / (4.187 * dT2) : 0;
                const Q_proc2  = mExt2 * (he2_SI - 419);
                const Q_in     = mDot * h1_SI;
                const eta      = Q_in > 0 ? pw / Q_in * 100 : 0;
                Object.assign(out, { pw, pe, Q_cond:Q_cond2, mDot_cw:mDot_cw2, dT_cw:dT2,
                                     Q_proc:Q_proc2, eta, w_HP:w_HP2, w_LP:w_LP2,
                                     he_SI:he2_SI, h2_exh:h2_exh2,
                                     extFrac:extFrac2, mExt:mExt2, mExh:mExh2 });
            } else {
                return res.status(400).json({ error: 'Unknown turbineType' });
            }

            return res.json(out);
        }

        return res.status(400).json({ error: 'Unknown action' });

    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
}

// ── End of Section 13: Steam Turbine Power ──────────────────────────────────────────



// ══════════════════════════════════════════════════════════════════════════════
// SECTION 14 of 21  ►  STEAM PROPERTIES (IAPWS-IF97)
// Route: /api/steam
// Source: steam.js
// ══════════════════════════════════════════════════════════════════════════════

// ================================================================
// api/steam.js  —  Vercel Serverless Function
// 🔐 ALL CALCULATION LOGIC RUNS ON SERVER — NEVER EXPOSED TO BROWSER
// Place this file in your GitHub repo at: /api/steam.js
// ================================================================

function steam_handler(req, res) {
  // Allow CORS for your domain only
  const origin = req.headers.origin || '';
  const allowed = origin.endsWith('.vercel.app') || origin === 'https://multicalci.com';
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://multicalci.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, P_bar, T_C, x, specBy, sys } = req.body;

    // ── Input validation ──────────────────────────────────────────
    if (!type) return res.status(400).json({ error: 'Missing calculation type' });

    // Run calculation — all logic hidden on server
    const result = calcProps(type, P_bar, T_C, x, specBy);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // If Imperial requested, convert result before sending
    const finalResult = (sys === 'IMP') ? convertToImperial(result) : result;

    return res.status(200).json({ success: true, data: finalResult });

  } catch (err) {
    return res.status(500).json({ error: 'Server calculation error' });
  }
}

// ================================================================
// 🔐 CORE CALCULATION ENGINE — HIDDEN ON SERVER
// Extracted from your original steam-properties-calculator
// ================================================================

function pSat_steam(T_C) {
  const T = T_C + 273.15;
  const Tc = 647.096, Pc = 220.64;
  if (T >= Tc) return Pc;
  if (T < 273.15) return NaN;
  const tau = 1 - T / Tc;
  const arg = (Tc / T) * (
    -7.85951783 * tau +
     1.84408259 * Math.pow(tau, 1.5) +
    -11.7866497 * Math.pow(tau, 3) +
     22.6807411 * Math.pow(tau, 3.5) +
    -15.9618719 * Math.pow(tau, 4) +
     1.80122502 * Math.pow(tau, 7.5)
  );
  return Pc * Math.exp(arg);
}

function tSat_steam(P_bar) {
  if (!isFinite(P_bar) || P_bar <= 0) return NaN;
  if (P_bar >= 220.64) return 374.14;
  // For P > 80 bar the empirical guess overshoots the critical temperature and
  // the Newton solver diverges. Use the SAT_P_steam table for a much better starting guess.
  let T;
  if (P_bar > 80) {
    // SAT_P_steam table already covers 1–220.64 bar; interpolate for Tsat directly.
    const xs = SAT_P_steam.map(r => r[0]);
    const ts = SAT_P_steam.map(r => r[1]);
    T = csplineInterp_steam(xs, ts, P_bar) + 273.15;
  } else {
    T = 100 * Math.pow(P_bar / 1.01325, 0.27) + 273.15;
  }
  for (let i = 0; i < 60; i++) {
    const Tc = T - 273.15;
    const P  = pSat_steam(Tc);
    const dP = (pSat_steam(Tc + 0.005) - pSat_steam(Tc - 0.005)) / 0.01;
    if (!isFinite(P) || !isFinite(dP) || dP === 0) break;
    const dT = (P - P_bar) / dP;
    T -= dT;
    if (Math.abs(dT) < 1e-7) break;
  }
  return T - 273.15;
}

// NIST Saturation Tables
const SAT_T_steam = [
  [  0.01,   0.00, 2501.4, 2501.4, 0.0000, 9.1562, 9.1562, 0.0010002, 206.140],
  [     5,  21.02, 2489.6, 2510.6, 0.0763, 8.9496, 9.0259, 0.0010001, 147.120],
  [    10,  42.02, 2477.7, 2519.7, 0.1511, 8.7488, 8.8999, 0.0010003, 106.380],
  [    15,  62.98, 2465.9, 2528.9, 0.2245, 8.5566, 8.7811, 0.0010009,  77.926],
  [    20,  83.91, 2453.6, 2537.5, 0.2966, 8.3706, 8.6671, 0.0010018,  57.791],
  [    25, 104.87, 2441.7, 2546.5, 0.3673, 8.1910, 8.5583, 0.0010029,  43.360],
  [    30, 125.77, 2430.0, 2555.8, 0.4369, 8.0164, 8.4533, 0.0010044,  32.894],
  [    35, 146.66, 2418.2, 2564.9, 0.5052, 7.8478, 8.3530, 0.0010060,  25.216],
  [    40, 167.54, 2406.0, 2573.5, 0.5724, 7.6845, 8.2569, 0.0010079,  19.523],
  [    45, 188.44, 2393.9, 2582.4, 0.6386, 7.5261, 8.1647, 0.0010099,  15.258],
  [    50, 209.33, 2382.0, 2591.3, 0.7037, 7.3725, 8.0762, 0.0010121,  12.032],
  [    60, 251.18, 2357.7, 2608.8, 0.8313, 7.0784, 7.9096, 0.0010171,   7.671],
  [    70, 292.97, 2333.0, 2626.0, 0.9548, 6.7989, 7.7537, 0.0010228,   5.042],
  [    80, 334.88, 2307.8, 2642.7, 1.0753, 6.5366, 7.6119, 0.0010292,   3.407],
  [    90, 376.90, 2282.2, 2659.1, 1.1924, 6.2866, 7.4790, 0.0010361,   2.361],
  [   100, 419.06, 2256.9, 2676.0, 1.3069, 6.0480, 7.3549, 0.0010435,  1.6720],
  [   110, 461.14, 2229.7, 2690.8, 1.4185, 5.8194, 7.2379, 0.0010516,  1.2101],
  [   120, 503.78, 2202.6, 2706.3, 1.5279, 5.6006, 7.1284, 0.0010603,  0.8917],
  [   130, 546.37, 2174.2, 2720.5, 1.6346, 5.3906, 7.0252, 0.0010700,  0.6685],
  [   140, 589.16, 2144.9, 2734.0, 1.7391, 5.1894, 6.9285, 0.0010803,  0.5089],
  [   150, 632.18, 2114.3, 2746.5, 1.8416, 4.9961, 6.8377, 0.0010912,  0.3924],
  [   160, 675.55, 2082.6, 2758.1, 1.9422, 4.8100, 6.7522, 0.0011029,  0.3071],
  [   170, 719.08, 2049.5, 2768.5, 2.0412, 4.6297, 6.6709, 0.0011150,  0.2428],
  [   180, 763.06, 2015.3, 2778.2, 2.1387, 4.4547, 6.5934, 0.0011281,  0.1940],
  [   190, 807.57, 1979.0, 2786.4, 2.2349, 4.2844, 6.5192, 0.0011420,  0.1565],
  [   200, 852.38, 1940.7, 2793.1, 2.3300, 4.1179, 6.4479, 0.0011565, 0.12721],
  [   210, 897.76, 1900.7, 2798.5, 2.4245, 3.9583, 6.3828, 0.0011726, 0.10441],
  [   220, 943.58, 1858.5, 2802.1, 2.5175, 3.7927, 6.3102, 0.0011891, 0.08619],
  [   230, 990.21, 1813.8, 2804.0, 2.6099, 3.6234, 6.2333, 0.0012075, 0.07158],
  [   240, 1037.6, 1769.4, 2807.0, 2.7018, 3.4735, 6.1753, 0.0012270, 0.05977],
];
const SAT_P_steam = [
  [  1.0,  99.63,  417.44, 2675.6, 1.3026, 7.3594, 0.001043, 1.6941],
  [  2.0, 120.23,  504.68, 2706.7, 1.5301, 7.1268, 0.001061, 0.88574],
  [  3.0, 133.55,  561.43, 2725.3, 1.6716, 6.9909, 0.001073, 0.60582],
  [  4.0, 143.63,  604.66, 2738.1, 1.7764, 6.8959, 0.001084, 0.46242],
  [  5.0, 151.86,  640.09, 2748.1, 1.8604, 6.8212, 0.001093, 0.37483],
  [  6.0, 158.85,  670.38, 2756.4, 1.9308, 6.7600, 0.001101, 0.31567],
  [  7.0, 165.00,  697.07, 2763.4, 1.9918, 6.7080, 0.001108, 0.27279],
  [  8.0, 170.43,  720.87, 2769.1, 2.0461, 6.6628, 0.001115, 0.24049],
  [  9.0, 175.38,  742.56, 2773.8, 2.0946, 6.6226, 0.001121, 0.21497],
  [ 10.0, 179.91,  762.81, 2778.1, 2.1387, 6.5865, 0.001127, 0.19444],
  [ 12.0, 187.99,  798.65, 2784.8, 2.2166, 6.5233, 0.001139, 0.16333],
  [ 14.0, 195.07,  830.08, 2790.0, 2.2837, 6.4693, 0.001149, 0.14078],
  [ 16.0, 201.41,  858.56, 2794.0, 2.3440, 6.4218, 0.001159, 0.12374],
  [ 18.0, 207.11,  885.17, 2797.6, 2.3976, 6.3794, 0.001168, 0.11043],
  [ 20.0, 212.42,  908.47, 2799.5, 2.4468, 6.3409, 0.001177, 0.099585],
  [ 25.0, 224.00,  962.11, 2803.3, 2.5547, 6.2575, 0.001197, 0.079977],
  [ 30.0, 233.90, 1008.4,  2804.2, 2.6457, 6.1869, 0.001216, 0.066628],
  [ 35.0, 242.60, 1049.8,  2803.8, 2.7253, 6.1253, 0.001235, 0.057063],
  [ 40.0, 250.40, 1087.4,  2801.4, 2.7966, 6.0696, 0.001252, 0.049779],
  [ 45.0, 257.49, 1122.1,  2798.3, 2.8612, 6.0190, 0.001269, 0.044079],
  [ 50.0, 263.99, 1154.4,  2794.3, 2.9202, 5.9737, 0.001286, 0.039457],
  [ 60.0, 275.64, 1213.7,  2784.3, 3.0248, 5.8902, 0.001319, 0.032445],
  [ 70.0, 285.88, 1267.4,  2772.1, 3.1210, 5.8133, 0.001352, 0.027370],
  [ 80.0, 295.06, 1317.1,  2758.4, 3.2076, 5.7450, 0.001384, 0.023525],
  [ 90.0, 303.40, 1363.2,  2742.8, 3.2857, 5.6811, 0.001418, 0.020489],
  [100.0, 311.06, 1407.6,  2724.5, 3.3596, 5.6141, 0.001452, 0.018026],
  [110.0, 318.15, 1450.3,  2705.0, 3.4295, 5.5473, 0.001489, 0.015985],
  [120.0, 324.75, 1491.8,  2684.9, 3.4962, 5.4924, 0.001527, 0.014267],
  [130.0, 330.93, 1532.0,  2662.9, 3.5605, 5.4295, 0.001567, 0.012721],
  [140.0, 336.75, 1571.0,  2638.7, 3.6229, 5.3717, 0.001611, 0.011485],
  [150.0, 342.24, 1609.0,  2614.5, 3.6834, 5.3108, 0.001658, 0.010340],
  [160.0, 347.44, 1650.5,  2580.6, 3.7428, 5.2455, 0.001710, 0.0093499],
  [170.0, 352.37, 1690.7,  2548.5, 3.7996, 5.1832, 0.001765, 0.0083849],
  [180.0, 357.06, 1732.0,  2509.1, 3.8553, 5.1044, 0.001840, 0.0074920],
  [190.0, 361.54, 1776.5,  2468.4, 3.9102, 5.0218, 0.001926, 0.0066531],
  [200.0, 365.81, 1826.3,  2409.7, 4.0139, 4.9269, 0.002036, 0.0058750],
  [210.0, 369.89, 1886.3,  2336.8, 4.1014, 4.8013, 0.002213, 0.0051020],
  [220.0, 373.71, 2010.3,  2192.4, 4.2887, 4.5481, 0.002790, 0.0037800],
  [220.64,374.14, 2099.3,  2099.3, 4.4120, 4.4120, 0.003155, 0.0031550],
];

const SH_FB_steam = [
  {P:1,  d:[[100,2676.2,7.361,1.696],[150,2776.5,7.615,1.937],[200,2875.5,7.835,2.172],[250,2974.5,8.033,2.406],[300,3074.3,8.217,2.639],[350,3175.8,8.390,2.871],[400,3279.6,8.545,3.103],[500,3488.1,8.834,3.565],[600,3705.4,9.102,4.028],[700,3928.7,9.352,4.490],[800,4159.0,9.586,4.952]]},
  {P:5,  d:[[152,2748.7,6.821,0.375],[200,2855.4,7.059,0.425],[250,2961.0,7.272,0.474],[300,3064.2,7.460,0.523],[350,3168.1,7.633,0.570],[400,3272.3,7.794,0.617],[500,3484.9,8.087,0.711],[600,3704.3,8.352,0.804],[700,3927.1,8.605,0.897],[800,4157.8,8.840,0.990]]},
  {P:10, d:[[180,2778.1,6.587,0.1944],[200,2827.9,6.694,0.2060],[250,2942.6,6.925,0.2328],[300,3051.2,7.123,0.2579],[350,3157.7,7.301,0.2825],[400,3264.5,7.465,0.3066],[500,3478.5,7.762,0.3541],[600,3697.9,8.029,0.4011],[700,3922.5,8.281,0.4479],[800,4154.5,8.516,0.4945]]},
  {P:20, d:[[213,2799.5,6.341,0.0996],[250,2902.5,6.545,0.1114],[300,3023.5,6.768,0.1255],[350,3137.0,6.958,0.1385],[400,3248.7,7.127,0.1520],[500,3467.6,7.432,0.1757],[600,3687.9,7.702,0.1996],[700,3913.3,7.955,0.2233],[800,4142.0,8.192,0.2467]]},
  {P:40, d:[[251,2801.4,6.070,0.0498],[300,2962.0,6.362,0.0589],[350,3092.5,6.584,0.0666],[400,3213.6,6.771,0.0734],[500,3445.3,7.090,0.0864],[600,3670.3,7.369,0.0989],[700,3894.9,7.624,0.1112],[800,4122.0,7.861,0.1234]]},
  {P:60, d:[[276,2784.3,5.890,0.0324],[300,2885.5,6.070,0.0362],[350,3043.4,6.336,0.0421],[400,3178.3,6.545,0.0474],[500,3422.2,6.883,0.0567],[600,3658.4,7.169,0.0653],[700,3876.1,7.428,0.0736],[800,4095.0,7.667,0.0818]]},
  {P:80, d:[[295,2758.4,5.745,0.0235],[300,2786.5,5.794,0.0243],[350,2988.1,6.132,0.0299],[400,3139.4,6.366,0.0343],[500,3398.3,6.727,0.0398],[600,3633.2,7.059,0.0480],[700,3857.2,7.321,0.0543],[800,4074.0,7.562,0.0604]]},
  {P:100,d:[[311,2725.5,5.614,0.0180],[350,2924.5,5.945,0.0228],[400,3096.5,6.212,0.0264],[450,3249.0,6.419,0.0297],[500,3374.2,6.599,0.0328],[600,3625.3,6.903,0.0384],[700,3838.2,7.176,0.0427],[800,4053.0,7.418,0.0487]]},
  {P:120,d:[[325,2684.9,5.492,0.0143],[360,2820.0,5.752,0.0165],[400,3051.6,6.004,0.0208],[450,3215.9,6.233,0.0236],[500,3350.7,6.425,0.0262],[600,3582.3,6.742,0.0308],[700,3793.5,7.027,0.0351],[800,4032.0,7.271,0.0405]]},
  {P:140,d:[[337,2637.6,5.372,0.0115],[360,2753.0,5.581,0.0132],[400,3001.9,5.845,0.0166],[450,3182.5,6.086,0.0191],[500,3323.1,6.285,0.0214],[600,3541.2,6.604,0.0260],[700,3762.2,6.898,0.0302],[800,4011.0,7.143,0.0352]]},
  {P:160,d:[[347,2580.6,5.246,0.0093],[380,2745.0,5.508,0.0115],[400,2947.0,5.693,0.0132],[450,3146.1,5.951,0.0157],[500,3295.0,6.156,0.0178],[600,3561.1,6.513,0.0214],[700,3732.3,6.781,0.0256],[800,3989.0,7.029,0.0302]]},
  {P:180,d:[[357,2509.1,5.104,0.0075],[390,2748.0,5.484,0.0100],[400,2880.1,5.554,0.0107],[450,3104.9,5.827,0.0130],[500,3266.1,6.037,0.0149],[600,3542.0,6.409,0.0181],[700,3701.4,6.657,0.0218],[800,3968.0,6.909,0.0260]]},
  {P:200,d:[[366,2409.7,4.927,0.0059],[395,2702.0,5.378,0.0085],[400,2818.1,5.472,0.0099],[450,3060.1,5.796,0.0121],[500,3239.3,6.018,0.0145],[600,3532.0,6.336,0.0175],[700,3670.6,6.589,0.0210],[800,3947.0,6.845,0.0249]]},
];

function csplineInterp_steam(xs, ys, x) {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n-1]) return ys[n-1];
  let i = 0;
  for (let j = 0; j < n-1; j++) { if (xs[j] <= x && x <= xs[j+1]) { i=j; break; } }
  const t=(x-xs[i])/(xs[i+1]-xs[i]), t2=t*t, t3=t2*t, h=xs[i+1]-xs[i];
  const m1 = i>0 ? (ys[i+1]-ys[i-1])/(xs[i+1]-xs[i-1]) : (ys[i+1]-ys[i])/h;
  const m2 = i<n-2 ? (ys[i+2]-ys[i])/(xs[i+2]-xs[i]) : (ys[i+1]-ys[i])/h;
  return ys[i]*(2*t3-3*t2+1)+ys[i+1]*(-2*t3+3*t2)+m1*h*(t3-2*t2+t)+m2*h*(t3-t2);
}

function satByT_fb_steam(T_C) {
  if (T_C < 0.01 || T_C > 374.14) return null;
  let row;
  if (T_C <= 240) {
    const xs = SAT_T_steam.map(r=>r[0]);
    const interp = c => csplineInterp_steam(xs, SAT_T_steam.map(r=>r[c]), T_C);
    row = { T:T_C, hf:interp(1), hfg:interp(2), hg:interp(3), sf:interp(4), sfg:interp(5), sg:interp(6), vf:interp(7), vg:interp(8), P:pSat_steam(T_C) };
  } else {
    const P = pSat_steam(T_C);
    row = satByP_fb(P);
  }
  return row;
}

function satByP_fb(P_bar) {
  if (P_bar < 0.006 || P_bar > 220.9) return null;
  const xs = SAT_P_steam.map(r=>r[0]);
  const interp = c => csplineInterp_steam(xs, SAT_P_steam.map(r=>r[c]), P_bar);
  const Ts=interp(1), hf=interp(2), hg=interp(3), sf=interp(4), sg=interp(5), vf=interp(6), vg=interp(7);
  return { T:Ts, P:P_bar, hf, hfg:hg-hf, hg, sf, sfg:sg-sf, sg, vf, vg };
}

function shProps_fb(P_bar, T_C) {
  const prs = SH_FB_steam.map(b=>b.P);
  function atB(idx,T) {
    const d = SH_FB_steam[idx].d;
    return { h:csplineInterp_steam(d.map(r=>r[0]),d.map(r=>r[1]),T), s:csplineInterp_steam(d.map(r=>r[0]),d.map(r=>r[2]),T), v:csplineInterp_steam(d.map(r=>r[0]),d.map(r=>r[3]),T) };
  }
  if (P_bar<=prs[0]) return atB(0,T_C);
  if (P_bar>=prs[prs.length-1]) return atB(prs.length-1,T_C);
  let lo=0;
  for (let i=0;i<prs.length-1;i++) { if(prs[i]<=P_bar&&P_bar<=prs[i+1]){lo=i;break;} }
  const fP=(P_bar-prs[lo])/(prs[lo+1]-prs[lo]), a=atB(lo,T_C), b=atB(lo+1,T_C);
  return { h:a.h+fP*(b.h-a.h), s:a.s+fP*(b.s-a.s), v:a.v+fP*(b.v-a.v) };
}

function superheated(P_bar, T_C) {
  const fb = shProps_fb(P_bar, T_C);
  const Tsat = tSat_steam(P_bar);
  return { h:fb.h, s:fb.s, v:fb.v, rho:1/fb.v, u:fb.h-P_bar*100*fb.v, Tsat, dT_sh:T_C-Tsat };
}

function calcProps(type, P_bar, T_C, x, specBy) {
  if (type === 'compressed') {
    if (!isFinite(T_C)||T_C<0.01||T_C>=374.14) return { error:'Temperature must be 0.01–374°C for compressed liquid.' };
    if (!isFinite(P_bar)||P_bar<=0.006) return { error:'Pressure must be ≥ 0.006 bar.' };
    const T_sat = tSat_steam(P_bar);
    if (!isFinite(T_sat)) return { error:'Pressure out of range (0.006–220.9 bar).' };
    if (T_C>=T_sat) return { error:`Temperature must be below T_sat = ${T_sat.toFixed(2)}°C at ${P_bar.toFixed(3)} bar.` };
    const sat = satByT_fb_steam(T_C);
    if (!sat) return { error:'Out of valid range.' };
    const dP_kPa = (P_bar-sat.P)*100;
    const h = sat.hf+sat.vf*dP_kPa, s = sat.sf, v = sat.vf*(1-4e-5*(P_bar-sat.P));
    const result = { phase:'Compressed Liquid', phaseCls:'compressed', T:T_C, P:P_bar, Tsat:T_sat, h, s, v, rho:1/v, u:h-P_bar*100*v, x:null, hf:sat.hf, hfg:sat.hfg, hg:sat.hg };
    return addTransport(result, 'compressed');
  }
  if (type === 'sat-liq') {
    if (specBy==='P' && (!isFinite(P_bar)||P_bar<0.006||P_bar>220.9)) return { error:'Saturation pressure must be 0.006 – 220.9 bar.' };
    if (specBy==='T' && (!isFinite(T_C)||T_C<0.01||T_C>374.14)) return { error:'Saturation temperature must be 0.01 – 374.14°C (above 374.14°C there is no liquid-vapor saturation).' };
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb_steam(T_C);
    if (!sat) return { error:'Input out of valid range (0.006–220.9 bar / 0.01–374.14°C).' };
    const result = { phase:'Saturated Liquid', phaseCls:'sat-liq', T:sat.T, P:sat.P, Tsat:sat.T, h:sat.hf, s:sat.sf, v:sat.vf, rho:1/sat.vf, u:sat.hf-sat.P*100*sat.vf, x:0, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
    return addTransport(result, 'sat-liq');
  }
  if (type === 'wet') {
    if (x === null || x === undefined || !isFinite(Number(x)) || Number(x)<0 || Number(x)>1) return { error:'Steam quality x must be between 0 and 1.' };
    x = Number(x);
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb_steam(T_C);
    if (!sat) return { error:'Input out of valid range.' };
    const h=sat.hf+x*sat.hfg, s=sat.sf+x*sat.sfg, v=sat.vf+x*(sat.vg-sat.vf);
    const result = { phase:`Wet Steam (x = ${x.toFixed(3)})`, phaseCls:'wet', T:sat.T, P:sat.P, Tsat:sat.T, h, s, v, rho:1/v, u:h-sat.P*100*v, x, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
    return addTransport(result, 'wet');
  }
  if (type === 'sat-vap') {
    if (specBy==='P' && (!isFinite(P_bar)||P_bar<0.006||P_bar>220.9)) return { error:'Saturation pressure must be 0.006 – 220.9 bar.' };
    if (specBy==='T' && (!isFinite(T_C)||T_C<0.01||T_C>374.14)) return { error:'Saturation temperature must be 0.01 – 374.14°C. Above 374.14°C is supercritical — no distinct vapor phase.' };
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb_steam(T_C);
    if (!sat) return { error:'Input out of valid range.' };
    const result = { phase:'Saturated Vapor (Dry)', phaseCls:'sat-vap', T:sat.T, P:sat.P, Tsat:sat.T, h:sat.hg, s:sat.sg, v:sat.vg, rho:1/sat.vg, u:sat.hg-sat.P*100*sat.vg, x:1, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
    return addTransport(result, 'sat-vap');
  }
  if (type === 'superheat') {
    if (!isFinite(P_bar)||P_bar<=0||P_bar>1000) return { error:'Pressure must be 0.006–1000 bar.' };
    if (!isFinite(T_C)||T_C<0.01||T_C>800) return { error:'Temperature must be 0.01–800°C.' };
    const T_sat = tSat_steam(P_bar);
    if (!isFinite(T_sat)) return { error:'Pressure out of saturation range.' };
    if (T_C<=T_sat) return { error:`Temperature must exceed T_sat = ${T_sat.toFixed(2)}°C at ${P_bar.toFixed(3)} bar.` };
    const sh = superheated(P_bar, T_C);
    const result = { phase:'Superheated Steam', phaseCls:'superheat', T:T_C, P:P_bar, Tsat:sh.Tsat, dT_sh:sh.dT_sh, h:sh.h, s:sh.s, v:sh.v, rho:sh.rho, u:sh.u, x:null };
    return addTransport(result, 'superheat');
  }
  return { error:'Unknown fluid type.' };
}

// ── Transport Properties (IAPWS correlations) ────────────────────
// Dynamic viscosity — IAPWS 2008 (μPa·s)
function dynVisc(T_C, rho_kgm3) {
  const T = T_C + 273.15;
  const Tstar = 647.096, rhoStar = 317.763;
  const Tr = T / Tstar, rhoR = rho_kgm3 / rhoStar;
  const H0 = [1.67752, 2.20462, 0.6366564, -0.241605];
  let mu0 = 0;
  for (let i = 0; i < 4; i++) mu0 += H0[i] / Math.pow(Tr, i);
  mu0 = 100 * Math.sqrt(Tr) / mu0;
  const H1 = [
    [5.20094e-1, 2.22531e-1,-2.81378e-1, 1.61913e-1,-3.25372e-2, 0, 0],
    [8.50895e-2, 9.99115e-1,-9.06851e-1, 2.57399e-1, 0, 0, 0],
    [-1.08374,   1.88797,   -7.72479e-1, 0, 0, 0, 0],
    [-2.89555e-1,1.26613,   -4.89837e-1, 0, 6.98452e-2, 0,-4.35673e-3],
    [0,          0,         -2.57040e-1, 0, 0, 8.72102e-3, 0],
    [0,          1.20573e-1, 0,          0, 0, 0,-5.93264e-4]
  ];
  let mu1 = 0;
  for (let i = 0; i < 6; i++) {
    const ti = Math.pow(1/Tr - 1, i);
    let s = 0;
    for (let j = 0; j < 7; j++) s += H1[i][j] * Math.pow(rhoR - 1, j);
    mu1 += ti * s;
  }
  mu1 = Math.exp(rhoR * mu1);
  return mu0 * mu1; // μPa·s
}

// Thermal conductivity (mW/m·K) — table interpolation, IAPWS 2011 reference values
function thermCond(T_C, rho_kgm3) {
  // Classify by density: liquid-like (rho > 200 kg/m³) vs steam-like
  if (rho_kgm3 > 200) {
    // Liquid water — IAPWS 2011 Table 4 (saturated liquid, 0–300°C)
    const Tl = [0,  10,  20,  30,  40,  50,  60,  70,  80,  90,
                100, 110, 120, 130, 140, 150, 160, 170, 180, 190,
                200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300];
    const Ll = [561.0,580.0,598.4,615.4,630.5,644.0,655.8,665.8,674.1,680.9,
                679.1,682.3,683.2,682.3,680.0,675.3,669.5,661.8,652.3,641.2,
                628.7,613.7,596.7,578.0,557.5,535.5,511.9,487.0,461.5,435.4,407.8];
    return _lerp1(Tl, Ll, Math.min(Math.max(T_C, 0), 300));
  } else {
    // Steam — IAPWS 2011 Table 4 (low-pressure steam, 100–600°C)
    const Ts = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
    const Ls = [25.1, 28.9, 33.1, 37.6, 43.1, 48.9, 55.1, 61.5, 68.0, 74.7, 81.5];
    // Pressure correction: +0.01 mW/m·K per bar above 1 bar (minor effect)
    const base = _lerp1(Ts, Ls, Math.min(Math.max(T_C, 100), 600));
    return base + 0.01 * Math.max(0, rho_kgm3 * 0.004615 * (T_C + 273.15) / 100 - 1);
  }
}
function _lerp1(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length-1]) return ys[ys.length-1];
  let i = 0; for (; i < xs.length-1; i++) if (xs[i] <= x && x < xs[i+1]) break;
  return ys[i] + (ys[i+1] - ys[i]) * (x - xs[i]) / (xs[i+1] - xs[i]);
}

// Specific heat Cp approximation (kJ/kg·K)
function specHeatCp(T_C, P_bar, phase) {
  if (phase === 'liquid' || phase === 'compressed') {
    // Cp liquid water (kJ/kg·K) — IAPWS-IF97 table interpolation
    const CpT = [0,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300,320,340,360,374];
    const CpV = [4.218,4.194,4.182,4.179,4.179,4.182,4.185,4.190,4.198,4.208,4.216,4.229,4.245,4.264,4.285,4.310,4.340,4.376,4.419,4.470,4.497,4.610,4.691,4.790,4.906,5.062,5.267,5.545,5.932,6.550,7.500,12.00,18.00,40.00,100];
    return _lerp1(CpT, CpV, Math.min(Math.max(T_C, 0), 370));
  }
  // Steam Cp — table interpolation, IAPWS-IF97 reference values (kJ/kg·K)
  const Ts = [100, 150, 200, 250, 300, 350, 400, 450, 500, 600];
  const Cs = [2.034,1.983,1.975,1.985,1.997,2.017,2.056,2.102,2.150,2.254];
  const base = _lerp1(Ts, Cs, Math.min(Math.max(T_C, 100), 600));
  // Minor pressure correction: Cp increases ~0.5% per 10 bar
  return base * (1 + 0.0004 * Math.max(0, P_bar - 1));
}

// Specific heat Cv = Cp - T·v·alpha²/kappa (simplified ratio method)
function specHeatCv(Cp, T_C, phase) {
  // For liquid: Cp/Cv ≈ 1.01–1.04; for steam: ≈ 1.28–1.33
  const ratio = (phase === 'liquid' || phase === 'compressed') ? 1.025 : 1.30;
  return Cp / ratio;
}

// Speed of sound (m/s) — from gamma and ideal gas for steam, IAPWS table for liquid
function speedSound(T_C, P_bar, rho, phase) {
  if (phase === 'liquid' || phase === 'compressed') {
    // IAPWS liquid water fit — T in °C
    return 1402.4 + 5.038*T_C - 0.05799*T_C*T_C + 3.287e-4*T_C*T_C*T_C - 1.098e-6*T_C*T_C*T_C*T_C
           + (P_bar > 1 ? 0.16*P_bar : 0);
  }
  // Steam: w = sqrt(gamma·R·T/M) with gamma from Cp/Cv
  const Cp = specHeatCp(T_C, P_bar, 'steam');
  const Cv = specHeatCv(Cp, T_C, 'steam');
  const gamma = Cp / Cv;
  const R = 8314.46 / 18.015; // J/(kg·K) for water
  return Math.sqrt(gamma * R * (T_C + 273.15));
}

// Surface tension — IAPWS 1994 (mN/m), saturation only
function surfTension(T_C) {
  const T = T_C + 273.15, Tc = 647.096;
  if (T >= Tc) return NaN;
  const tau = 1 - T/Tc;
  return 235.8 * Math.pow(tau, 1.256) * (1 - 0.625*tau); // mN/m
}

// Attach transport properties to a result object (SI units)
function addTransport(r, phase) {
  const T = r.T, P = r.P;
  const liqPhase = (phase === 'compressed' || phase === 'sat-liq');
  const vapPhase = (phase === 'sat-vap' || phase === 'superheat');
  const wetPhase = (phase === 'wet');

  if (liqPhase) {
    r.mu  = dynVisc(T, r.rho);
    r.lam = thermCond(T, r.rho);
    r.Cp  = specHeatCp(T, P, 'liquid');
    r.Cv  = specHeatCv(r.Cp, T, 'liquid');
    r.w   = speedSound(T, P, r.rho, 'liquid');
    r.Pr  = (r.mu * 1e-6 * r.Cp * 1000) / (r.lam * 1e-3); // dimensionless
    r.sigma = surfTension(T);
  } else if (vapPhase) {
    r.mu  = dynVisc(T, r.rho);
    r.lam = thermCond(T, r.rho);
    r.Cp  = specHeatCp(T, P, 'steam');
    r.Cv  = specHeatCv(r.Cp, T, 'steam');
    r.w   = speedSound(T, P, r.rho, 'steam');
    r.Pr  = (r.mu * 1e-6 * r.Cp * 1000) / (r.lam * 1e-3);
    if (phase === 'sat-vap') r.sigma = surfTension(T);
  } else if (wetPhase) {
    // Wet steam: liquid-phase transport at saturation temperature
    const rhof = 1 / r.vf, rhog = 1 / r.vg;
    r.mu_f  = dynVisc(T, rhof);
    r.mu_g  = dynVisc(T, rhog);
    r.lam_f = thermCond(T, rhof);
    r.lam_g = thermCond(T, rhog);
    r.Cp_f  = specHeatCp(T, P, 'liquid');
    r.Cp_g  = specHeatCp(T, P, 'steam');
    r.sigma = surfTension(T);
  }
  return r;
}

// ── Imperial unit conversion ──────────────────────────────────────
function convertToImperial(r) {
  const cv = {
    T:   v => v * 9/5 + 32,
    dT:  v => v * 9/5,
    P:   v => v * 14.5038,
    h:   v => v * 0.429922,
    s:   v => v * 0.238846,
    v:   v => v * 16.01846,
    rho: v => v * 0.062428,
    u:   v => v * 0.429922,
  };
  const c = {...r};
  if (isFinite(c.T))    c.T    = cv.T(c.T);
  if (isFinite(c.Tsat)) c.Tsat = cv.T(c.Tsat);
  if (isFinite(c.dT_sh))c.dT_sh= cv.dT(c.dT_sh);
  if (isFinite(c.P))    c.P    = cv.P(c.P);
  if (isFinite(c.h))    c.h    = cv.h(c.h);
  if (isFinite(c.s))    c.s    = cv.s(c.s);
  if (isFinite(c.v))    c.v    = cv.v(c.v);
  if (isFinite(c.rho))  c.rho  = cv.rho(c.rho);
  if (isFinite(c.u))    c.u    = cv.u(c.u);
  ['hf','hfg','hg'].forEach(k => { if(isFinite(c[k])) c[k]=cv.h(c[k]); });
  ['sf','sfg','sg'].forEach(k => { if(isFinite(c[k])) c[k]=cv.s(c[k]); });
  ['vf','vg'].forEach(k => { if(isFinite(c[k])) c[k]=cv.v(c[k]); });
  // Transport: mu stays μPa·s (same in both), lam: mW/m·K → BTU/hr·ft·°F, w: m/s → ft/s
  // Cp/Cv: kJ/kg·K → BTU/lb·°F, sigma: mN/m → lbf/ft
  if (isFinite(c.lam))   c.lam   = c.lam   * 5.77789e-4;  // mW/m·K → BTU/hr·ft·°F
  if (isFinite(c.lam_f)) c.lam_f = c.lam_f * 5.77789e-4;
  if (isFinite(c.lam_g)) c.lam_g = c.lam_g * 5.77789e-4;
  if (isFinite(c.Cp))    c.Cp    = c.Cp    * 0.238846;     // kJ/kg·K → BTU/lb·°F
  if (isFinite(c.Cv))    c.Cv    = c.Cv    * 0.238846;
  if (isFinite(c.Cp_f))  c.Cp_f  = c.Cp_f  * 0.238846;
  if (isFinite(c.Cp_g))  c.Cp_g  = c.Cp_g  * 0.238846;
  if (isFinite(c.w))     c.w     = c.w     * 3.28084;      // m/s → ft/s
  if (isFinite(c.sigma)) c.sigma = c.sigma  * 6.85218e-5;  // mN/m → lbf/ft
  return c;
}

// ── End of Section 14: Steam Properties (IAPWS-IF97) ──────────────────────────────────────────


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
  const Vo       = Qo_s * tro * 60 * surge;
  const Vw       = Qw_s * trw * 60 * surge;
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
    ],
    summary: `K_eff=${K_eff.toFixed(4)} | ρg=${rhog.toFixed(2)} | ρo=${rhoo.toFixed(1)} | ρw=${rhow.toFixed(1)} kg/m³ | tro=${tro} | trw=${trw} min | icm=${icm}m`
  };
}

// ── CALC 4: PRESSURE VESSEL THICKNESS (ASME VIII) ─────────────
function calcPV(p) {
  const P      = toMPag(p.P, p.P_u);
  const D_mm   = toMm(p.D, p.D_u);
  const S      = toMPaStress(p.S, p.S_u);
  const E      = parseFloat(p.E);
  const CA     = toMm(p.CA, p.CA_u);
  const head   = p.head;
  const minT   = parseFloat(p.minT);
  const T_C    = toC(p.T, p.T_u);
  const cat    = p.cat;

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

  const MAWP       = (S * E * t_sh_nom) / (R + 0.6 * t_sh_nom);
  const P_hyd      = 1.3 * MAWP;
  const thick_ratio = P / (S * E);

  let warns = [], status = 'PASS';
  if (head === 'flat') warns.push('⚠ Flat cover: UG-34 simplified formula only. Real flat covers require full UG-34 analysis including attachment weld classification, bolt loading, and effective gasket seating width. Engineer review mandatory.');
  if (head === 'conical45') warns.push('⚠ α=45° conical: approaching practical limit. Knuckle reinforcement per UG-33 likely required.');
  if (!headOk) warns.push('⚠ Head denominator ≤ 0 — head calculation invalid. Pressure exceeds allowable.');
  if (thick_ratio > 0.385) { warns.push('⚠ P/(S×E) > 0.385 — ASME UG-27 thin-wall formula is no longer valid. Use ASME Appendix 1-2 thick-wall formula: t = R[e^(P/SE) − 1]. Consult a certified PV engineer.'); status = 'WARN'; }
  else if (thick_ratio > 0.3) warns.push('⚠ P/(S×E) > 0.3 — approaching thin-wall formula limit (0.385). Consider ASME App.1-2 thick-wall analysis for accuracy.');
  if (isFinite(T_C)) {
    if (T_C > 260) warns.push('⚠ T>260°C: Verify allowable stress S at operating temperature from ASME Sec.II Part D. Tabulated S may be lower than ambient value.');
    if (T_C < -29) warns.push('⚠ T<−29°C: MDMT and Charpy impact testing per ASME UCS-66 apply. Do not use standard CS at this temperature without impact test verification.');
  }
  warns.push('ℹ UG-37 nozzle reinforcement NOT calculated. All nozzles, manholes and openings require separate UG-37 pad reinforcement analysis or FEA for Code compliance.');
  if (cat === 'detailed') warns.push('ℹ Detailed design category selected — this tool gives preliminary sizing only. Full ASME Sec.VIII Div.1 review by a qualified PV engineer required.');
  if (!headOk || thick_ratio > 0.5) status = 'WARN';

  return {
    status, warns,
    results: [
      { label:'Shell: t_calc',           value: t_sh_calc.toFixed(2)+' mm  ('+( t_sh_calc/25.4).toFixed(3)+'")', warn: false },
      { label:'Shell: t + CA',           value: t_sh_net.toFixed(2)+' mm', warn: false },
      { label:'Shell: t_nominal',        value: t_sh_nom.toFixed(1)+' mm  ('+( t_sh_nom/25.4).toFixed(3)+'")', warn: t_sh_nom<minT },
      { label:head_label+': t_calc',     value: headOk ? t_hd_calc.toFixed(2)+' mm' : 'INVALID', warn: !headOk, cls: headOk ? '' : 'f' },
      { label:head_label+': t_nom',      value: headOk ? t_hd_nom.toFixed(1)+' mm' : '—', warn: false },
      { label:'MAWP (shell nom.)',        value: MAWP.toFixed(3)+' MPag  ('+( MAWP/0.1).toFixed(1)+' barg)', warn: false },
      { label:'Design Pressure',         value: P.toFixed(3)+' MPag  ('+( P/0.1).toFixed(1)+' barg)', warn: false },
      { label:'P/(S×E) ratio',           value: thick_ratio.toFixed(4), warn: thick_ratio>0.385 },
      { label:'Hydrotest (~1.3×MAWP)',   value: P_hyd.toFixed(3)+' MPag', warn: false },
      { label:'Corrosion Allow.',        value: CA.toFixed(1)+' mm', warn: false },
    ],
    summary: `ASME Sec.VIII Div.1 | ID=${D_mm.toFixed(0)} mm (${(D_mm/25.4).toFixed(2)}") | S=${S.toFixed(1)} MPa | E=${E.toFixed(2)}${isFinite(T_C)?' | T='+T_C.toFixed(0)+'°C':''}`
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


// ================================================================

// ════════════════════════════════════════════════════════════════════════════
// Internal dispatcher — routes by body.type to the correct calc function
// ════════════════════════════════════════════════════════════════════════════
async function handle_vessel_separator(req, body, res) {
  const type = body.type || body.calculator || '';

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
    case 'h2p':    result = calcH2P(body);    break;
    case 'v2p':    result = calcV2P(body);    break;
    case '3p':     result = calc3P(body);     break;
    case 'pv':     result = calcPV(body);     break;
    case 'mist':   result = calcMist(body);   break;
    case 'nozzle': result = calcNozzle(body); break;
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
// SECTION 16 of 21  ►  NPSH CALCULATOR
// Route: /api/npsh-calculator
// Source: npsh-calculator.js
// ══════════════════════════════════════════════════════════════════════════════

// NPSH CALCULATOR — api/npsh-calculator.js
// ================================================================

// ── NPSH sanitisation helpers (shared) ──
function sNum(v, def = null) { const n = parseFloat(v); return isFinite(n) ? n : def; }
function sInt(v, def = 0)    { const n = parseInt(v);   return isFinite(n) ? n : def; }
function sStr(v, allowed, def) { return allowed.includes(v) ? v : def; }

/* ===================================================================
   NPSH CALCULATOR API — multicalci.com
   Vercel serverless function: api/npsh-calculator.js

   Algorithm: Hydraulic Institute 9.6.1 / AFT Fathom grade
   All internal units: Pa, m, m³/s, kg/m³

   ACTIONS (POST):
     fluidList      → returns all 31 fluids [{index, id, name}]
     fluidProps     → {fluidIndex, T_C} → {rho, mu_mPas, pv_kPa, pv_bar, hvp}
     estimateNpshr  → {fluidIndex, T_C, N_rpm, Q_raw, H_total, stages, pumpType, unitMode}
                   → {npshr_m, npshr_bar, sigma, Ns, Nss, method}
     calculate      → full NPSHa calc payload → all results
=================================================================== */

/* ═══════════════════════════════════════════════════════════════
   FLUID DATABASE — 31 fluids (SECURED — not exposed to browser)
   Each: {id, name, rho20, mu20, vp:[[T_C, kPa],...], muF(T)->mPa·s}
═══════════════════════════════════════════════════════════════ */
const NPSH_FLUIDS = [
  {id:'water',name:'Water (H₂O)',rho20:998.2,mu20:1.002,
   vp:[[0,.611],[5,.872],[10,1.228],[15,1.706],[20,2.338],[25,3.169],[30,4.243],[40,7.384],[50,12.35],[60,19.94],[70,31.18],[80,47.39],[90,70.11],[100,101.3],[110,143.3],[120,198.5],[150,476.2],[200,1554]],
   muF:t=>2.414e-5*Math.pow(10,247.8/(t+133.15))*1000, rhoF:t=>999.842*(1-3.85e-5*(t-4)*(t-4)/(t+288))},
  {id:'seawater',name:'Seawater (3.5% NaCl)',rho20:1025,mu20:1.07,vp:[[0,.54],[10,1.08],[20,2.10],[30,3.81],[50,10.9],[80,44.3],[100,97.0]],muF:t=>Math.max(.5,1.07*Math.exp(-.018*(t-20)))},
  {id:'ethanol',name:'Ethanol (C₂H₅OH)',rho20:789,mu20:1.17,vp:[[0,1.63],[10,3.12],[20,5.95],[30,10.5],[40,17.7],[50,29.4],[60,47.1],[78.3,101.3]],muF:t=>Math.max(.05,1.17*Math.exp(-.02*(t-20)))},
  {id:'methanol',name:'Methanol (CH₃OH)',rho20:791,mu20:.59,vp:[[0,4.06],[10,6.97],[20,12.9],[30,21.9],[40,35.4],[64.7,101.3]],muF:t=>Math.max(.02,.59*Math.exp(-.022*(t-20)))},
  {id:'acetone',name:'Acetone',rho20:791,mu20:.32,vp:[[0,9.9],[20,24.5],[40,53.7],[56,101.3]],muF:t=>Math.max(.01,.32*Math.exp(-.025*(t-20)))},
  {id:'toluene',name:'Toluene',rho20:867,mu20:.59,vp:[[0,1.57],[20,3.79],[40,9.87],[60,23.4],[110.6,101.3]],muF:t=>Math.max(.01,.59*Math.exp(-.018*(t-20)))},
  {id:'benzene',name:'Benzene (C₆H₆)',rho20:879,mu20:.65,vp:[[0,3.52],[20,10.0],[40,24.4],[60,52.0],[80.1,101.3]],muF:t=>Math.max(.01,.65*Math.exp(-.019*(t-20)))},
  {id:'diesel',name:'Diesel Fuel',rho20:835,mu20:3.5,vp:[[20,.01],[40,.03],[60,.07],[80,.15],[100,.3]],muF:t=>Math.max(.5,3.5*Math.exp(-.028*(t-20)))},
  {id:'petrol',name:'Petrol / Gasoline',rho20:720,mu20:.45,vp:[[0,10],[10,16],[20,25],[30,38.5],[40,57],[50,82],[60,115]],muF:t=>Math.max(.05,.45*Math.exp(-.02*(t-20)))},
  {id:'hfo',name:'Heavy Fuel Oil (HFO 380)',rho20:991,mu20:700,vp:[[50,.001],[80,.005],[100,.01],[150,.1]],muF:t=>Math.max(10,700*Math.exp(-.055*(t-20)))},
  {id:'lube',name:'Lube Oil (ISO VG 46)',rho20:870,mu20:46,vp:[[50,.001],[80,.003],[100,.006]],muF:t=>Math.max(1,46*Math.exp(-.05*(t-20)))},
  {id:'glycol33',name:'Ethylene Glycol-Water 33%',rho20:1060,mu20:2.8,vp:[[0,.45],[20,1.65],[50,9.5],[80,38],[100,85]],muF:t=>Math.max(.3,2.8*Math.exp(-.028*(t-20)))},
  {id:'glycol50',name:'Ethylene Glycol-Water 50%',rho20:1070,mu20:5.0,vp:[[0,.3],[20,1.2],[50,8.0],[80,34],[100,78]],muF:t=>Math.max(.3,5.0*Math.exp(-.035*(t-20)))},
  {id:'milk',name:'Milk (whole)',rho20:1030,mu20:2.0,vp:[[5,.872],[20,2.33],[40,7.38],[80,47.4],[100,101.3]],muF:t=>Math.max(.3,2.0*Math.exp(-.025*(t-20)))},
  {id:'honey',name:'Honey',rho20:1420,mu20:6000,vp:[[20,.5],[40,2.0],[60,7.0]],muF:t=>Math.max(50,6000*Math.exp(-.09*(t-20)))},
  {id:'hcl30',name:'Hydrochloric Acid 30%',rho20:1149,mu20:2.1,vp:[[10,25],[20,42],[30,65],[50,120]],muF:t=>Math.max(.5,2.1*Math.exp(-.022*(t-20)))},
  {id:'h2so4',name:'Sulphuric Acid 98%',rho20:1840,mu20:24.5,vp:[[20,3e-5],[100,.01],[200,.5]],muF:t=>Math.max(2,24.5*Math.exp(-.04*(t-20)))},
  {id:'naoh20',name:'Sodium Hydroxide 20%',rho20:1220,mu20:4.0,vp:[[10,1.0],[20,1.8],[50,9.0],[80,38],[100,87]],muF:t=>Math.max(.5,4.0*Math.exp(-.03*(t-20)))},
  {id:'ipa',name:'Isopropyl Alcohol (IPA)',rho20:785,mu20:2.37,vp:[[0,1.33],[20,4.38],[40,13.2],[82.3,101.3]],muF:t=>Math.max(.1,2.37*Math.exp(-.033*(t-20)))},
  {id:'glycerol',name:'Glycerol (Glycerine)',rho20:1261,mu20:1480,vp:[[20,2e-4],[60,.004],[100,.05]],muF:t=>Math.max(5,1480*Math.exp(-.11*(t-20)))},
  {id:'ammonia',name:'Ammonia (liquid)',rho20:610,mu20:.14,vp:[[-33,101.3],[-20,190],[0,430],[20,857],[50,2033]],muF:t=>Math.max(.05,.14*Math.exp(-.025*(t+33)))},
  {id:'styrene',name:'Styrene',rho20:906,mu20:.72,vp:[[0,.3],[20,.81],[60,5.05],[100,23.1],[145,101.3]],muF:t=>Math.max(.05,.72*Math.exp(-.022*(t-20)))},
  {id:'xylene',name:'Xylene (mixed)',rho20:864,mu20:.62,vp:[[0,.48],[20,1.05],[60,6.48],[100,27.8],[140,101.3]],muF:t=>Math.max(.05,.62*Math.exp(-.018*(t-20)))},
  {id:'brine',name:'Brine (NaCl 25%)',rho20:1193,mu20:2.4,vp:[[0,.45],[20,1.6],[50,9.0],[80,37],[100,84]],muF:t=>Math.max(.5,2.4*Math.exp(-.025*(t-20)))},
  {id:'palm',name:'Palm Oil',rho20:912,mu20:60,vp:[[40,.001],[80,.01],[100,.03]],muF:t=>Math.max(2,60*Math.exp(-.055*(t-20)))},
  {id:'crude',name:'Crude Oil (light, API 35)',rho20:847,mu20:12,vp:[[20,.05],[40,.16],[80,1.0]],muF:t=>Math.max(.5,12*Math.exp(-.04*(t-20)))},
  {id:'kerosene',name:'Kerosene / Jet A',rho20:800,mu20:1.5,vp:[[20,.15],[50,.6],[100,4.0]],muF:t=>Math.max(.1,1.5*Math.exp(-.028*(t-20)))},
  {id:'mercury',name:'Mercury (Hg)',rho20:13600,mu20:1.55,vp:[[20,2.27e-4],[100,.016],[200,.279],[356.7,101.3]],muF:t=>Math.max(.8,1.55*Math.exp(-.003*(t-20)))},
  {id:'freon22',name:'Refrigerant R-22 (liquid)',rho20:1194,mu20:.21,vp:[[-40,101.3],[0,499],[20,909],[40,1535]],muF:t=>Math.max(.05,.21*Math.exp(-.018*(t-20)))},
  {id:'co2',name:'CO₂ (liquid, pressurised)',rho20:773,mu20:.07,vp:[[-40,1006],[-20,1969],[0,3484],[20,5729],[30,7176]],muF:t=>Math.max(.02,.07*Math.exp(-.02*(t+40)))},
  {id:'coconut',name:'Coconut Oil',rho20:924,mu20:28,vp:[[30,.001],[80,.01],[100,.02]],muF:t=>Math.max(1,28*Math.exp(-.05*(t-20)))}
];

/* ═══════════════════════════════════════════════════════════════
   CORE PHYSICS — ALL SECURED ON SERVER
═══════════════════════════════════════════════════════════════ */

/** Log-linear vapour pressure interpolation — accurate above 80°C */
function npshVpI(f, T) {
  const d = f.vp;
  if (!d || !d.length) return 101.325;
  if (T <= d[0][0]) return d[0][1];
  if (T >= d[d.length-1][0]) return d[d.length-1][1];
  for (let i = 0; i < d.length-1; i++) {
    if (T >= d[i][0] && T < d[i+1][0]) {
      const r = (T - d[i][0]) / (d[i+1][0] - d[i][0]);
      const lv1 = Math.log(Math.max(d[i][1], 1e-10));
      const lv2 = Math.log(Math.max(d[i+1][1], 1e-10));
      return Math.exp(lv1 + r * (lv2 - lv1));
    }
  }
  return d[d.length-1][1];
}

function rhoAt(f, T) { return f.rhoF ? f.rhoF(T) : f.rho20 * (1 - 6.5e-4 * (T - 20)); }
function muAt(f, T)  { return f.muF  ? f.muF(T) / 1000 : f.mu20 / 1000 * (1 - 0.02 * (T - 20)); }

/**
 * Colebrook-White friction factor (industry standard)
 * Laminar: Hagen-Poiseuille  f = 64/Re
 * Transitional: blended continuously
 * Turbulent: iterative Colebrook-White (8–12 iterations)
 */
function frictionFactor(Re, eps_mm, D_m) {
  if (Re < 1)    return 64;
  if (Re < 2300) return 64 / Re;
  if (Re < 4000) {
    const f_lam  = 64 / 2300;
    const r      = eps_mm / (D_m * 1000);
    const f_turb = 0.25 / Math.pow(Math.log10(r / 3.7 + 5.74 / Math.pow(4000, 0.9)), 2);
    const blend  = (Re - 2300) / (4000 - 2300);
    return f_lam + (f_turb - f_lam) * blend;
  }
  // Turbulent — Colebrook-White iterative
  const r = eps_mm / (D_m * 1000);
  let f = 0.02;
  for (let i = 0; i < 12; i++) {
    const rhs = 1 / (-2 * Math.log10(r / 3.7 + 2.51 / (Re * Math.sqrt(f))));
    f = rhs * rhs;
  }
  return Math.max(0.008, Math.min(0.1, f));
}

/**
 * NPSHr estimation — Thoma cavitation number σ method
 * Per Hydraulic Institute 9.6.1 + HI suction specific speed check
 * Returns the MORE CONSERVATIVE of two methods:
 *   1. Thoma σ model:  NPSHr = σ × H_stage
 *   2. Nss limit method: NPSHr from Nss_max = 210 (SI)
 */
function calcEstimateNpshr(inputs) {
  const { N, Q_m3s, H_total, stages, pumpType } = inputs;
  const H_stage = H_total / Math.max(1, stages);

  // Dimensionless specific speed (SI: rpm, m³/s, m)
  const Ns = N * Math.sqrt(Q_m3s) / Math.pow(Math.max(H_stage, 1), 0.75);

  // Thoma sigma from specific speed — HI empirical correlation
  const CsMap = {
    centrifugal_low:  0.30,
    centrifugal_med:  0.45,
    centrifugal_high: 0.65,
    mixed:            0.85,
    axial:            1.20,
    multistage:       0.40,
  };
  const Cs    = CsMap[pumpType] || 0.40;
  const sigma = Cs * Math.pow(Ns / 1000, 4/3);
  const npshr_sigma = Math.max(0.3, sigma * H_stage);

  // Suction specific speed limit method (Nss_max = 210 SI)
  const Nss_limit    = 210;
  const npshr_nss    = Math.pow(N * Math.sqrt(Q_m3s) / Nss_limit, 4/3);
  const npshr_nss_safe = Math.max(0.3, npshr_nss);

  // Conservative: take higher of the two
  const npshr_m   = Math.max(npshr_sigma, npshr_nss_safe);
  const Nss_actual = N * Math.sqrt(Q_m3s) / Math.pow(Math.max(npshr_m, 0.1), 0.75);
  const npshr_bar  = npshr_m * 9810 / 1e5;

  return { npshr_m, npshr_bar, sigma, Ns, Nss: Nss_actual, H_stage };
}

/**
 * Main NPSHa calculation engine
 * Algorithm: Aspen HYSYS / AFT Fathom grade — HI 9.6.1
 *
 * NPSHa = P_abs/(ρg) + z − h_f − Pv/(ρg)
 *
 * CRITICAL: All pressure-to-head conversions use ACTUAL fluid density.
 * This is the #1 source of error in inferior calculators.
 */
function calcNPSH(inputs) {
  const {
    fluidIndex, T_C, unitMode,
    D_mm, Q_raw, L_m, Lf_m, eps_mm,
    upType, baro_bar, vessel_pg_raw,
    z_raw_user, npshrMethod, npshr_direct_user,
    N_rpm, H_total_user, stages, pumpType,
    margin_req,
  } = inputs;

  const isImp   = unitMode === 'IMP';
  const isAbove = upType.endsWith('above');
  const isVessel = upType.startsWith('vessel');

  // ── Fluid ──
  const f   = NPSH_FLUIDS[fluidIndex] || NPSH_FLUIDS[0];
  const T   = T_C; // always SI internally
  const rho = rhoAt(f, T);
  const mu  = muAt(f, T);           // Pa·s
  const pv_kPa = npshVpI(f, T);         // kPa
  const pv_Pa  = pv_kPa * 1000;     // Pa
  const pv_bar = pv_kPa / 100;
  const g   = 9.81;
  const rg  = rho * g;              // Pa/m — ACTUAL fluid

  // ── Pipe ──
  const D = D_mm / 1000;            // m
  const A = Math.PI * D * D / 4;   // m²

  // ── Flow → m³/s ──
  const Q = isImp ? Q_raw / 264.172 / 60 : Q_raw / 3600;

  // ── Velocity ──
  const v  = (Q > 0 && A > 0) ? Q / A : 0;
  const vh = v * v / (2 * g);

  // ── Pipe length (always in metres from user — unit conversion done in HTML) ──
  const L  = L_m;
  const Lf = Lf_m;
  const Le = L + Lf;

  // ── Friction ──
  const Re = (mu > 0 && D > 0) ? rho * v * D / mu : 0;
  const ff = frictionFactor(Re, eps_mm, D);
  const hf = (Le > 0 && D > 0) ? ff * (Le / D) * vh : 0;

  // ── Upstream pressure → Pa ──
  let P_abs_Pa = 0;
  if (isVessel) {
    const pg_Pa = isImp ? vessel_pg_raw * 6894.76 : vessel_pg_raw * 1e5;
    P_abs_Pa    = baro_bar * 1e5 + pg_Pa;
  } else {
    P_abs_Pa = baro_bar * 1e5;
  }

  // ── CRITICAL: H_abs uses ACTUAL fluid density ──
  const H_abs = P_abs_Pa / rg;

  // ── Static head (magnitude in metres, sign applied by config) ──
  const z_raw = z_raw_user; // already metres
  const z     = isAbove ? z_raw : -z_raw;

  // ── Vapour pressure head ──
  const h_vp = pv_Pa / rg;
  // ── VLE / Saturated liquid detection ──
  // For a pure single-component fluid in a pressurised vessel (refrigerant
  // receiver, liquid ammonia accumulator, condensate drum) the vessel pressure
  // equals the vapour pressure at the bulk liquid temperature. Any apparent
  // difference is instrument error, not real subcooling.
  // Threshold: if Pv/P_abs > 0.90 (within 3%) treat as saturated service.
  const saturationRatio = isVessel ? (pv_Pa / P_abs_Pa) : 0;
  const isSaturatedService = isVessel && saturationRatio >= 0.90;
  // In saturated service the pressure terms cancel → NPSHa = z − hf only
  const H_abs_effective = isSaturatedService ? h_vp : H_abs;

  // ── NPSHa (HI 9.6.1) ──
  const npsha = H_abs_effective + z - hf - h_vp;

  // ── NPSHa pressure equivalents ──
  const npsha_deltaP_Pa  = rg * npsha;
  const npsha_deltaP_bar = npsha_deltaP_Pa / 1e5;
  const npsha_Ps_bar     = (pv_Pa + npsha_deltaP_Pa) / 1e5;
  const npsha_ft         = npsha * 3.281;
  const npsha_psi        = npsha_deltaP_bar * 14.504;

  // ── NPSHr ──
  let npshr_m = 0;
  let npshrEstimate = null;
  if (npshrMethod === 'direct') {
    npshr_m = isImp ? npshr_direct_user / 3.281 : npshr_direct_user;
  } else {
    const Q_m3s = Q;
    const H_total = isImp ? H_total_user / 3.281 : H_total_user;
    npshrEstimate = calcEstimateNpshr({ N: N_rpm, Q_m3s, H_total, stages, pumpType });
    npshr_m = npshrEstimate.npshr_m;
  }

  // ── Safety margin ──
  const margin_actual   = npsha - (npshr_m + margin_req);
  const npsha_required  = npshr_m + margin_req;

  // ── Engineering warnings ──
  const warnings = [];
  if (v > 3.0)
    warnings.push({cls:'err', msg:'⛔ Pipe velocity '+v.toFixed(2)+' m/s exceeds 3 m/s. Risk of erosion, excessive losses and noise. Upsize suction pipe by at least one DN size.'});
  else if (v > 1.5)
    warnings.push({cls:'warn', msg:'⚠ Pipe velocity '+v.toFixed(2)+' m/s is above recommended 1.5 m/s for suction piping. Consider upsizing.'});
  if (Re > 2300 && Re < 4000)
    warnings.push({cls:'warn', msg:'⚠ Transition flow regime (Re = '+Re.toFixed(0)+'). Friction factor is uncertain (range 0.02–0.05). System may be unstable. Redesign to achieve Re > 4000 or < 2300.'});
  if (!isAbove && z_raw > 5.0)
    warnings.push({cls:'warn', msg:'⚠ Suction lift '+z_raw.toFixed(1)+' m exceeds practical limit of 5 m for most pump/fluid combinations at sea level. Maximum theoretical = P_atm/ρg.'});
  if (npsha < npshr_m && npsha > 0)
    warnings.push({cls:'err', msg:'⛔ NPSHa ('+npsha.toFixed(2)+' m) < NPSHr ('+npshr_m.toFixed(2)+' m). Cavitation will occur. Redesign suction system.'});
  if (margin_actual < 1.0 && margin_actual >= 0)
    warnings.push({cls:'warn', msg:'⚠ NPSHa margin '+margin_actual.toFixed(2)+' m is below recommended 1.0 m. Use ≥1.5 m for hot fluids or critical services (HI 9.6.1).'});
  if (npsha < 0)
    warnings.push({cls:'err', msg:'⛔ NPSHa is NEGATIVE ('+npsha.toFixed(2)+' m). Fluid will flash in suction pipe. Immediate redesign required — raise tank, lower pump, or reduce temperature.'});
  if (T > 80)
    warnings.push({cls:'warn', msg:'⚠ High temperature '+T.toFixed(0)+'°C: vapour pressure is rising steeply. Small temperature increases cause large NPSHa reductions. Check worst-case temperature.'});
  if (isSaturatedService)
    warnings.push({cls:'err', msg:'⛔ SATURATED LIQUID SERVICE DETECTED — Pv/P_vessel = '+(saturationRatio*100).toFixed(1)+'%. This vessel contains liquid in VLE equilibrium with its own vapour (refrigerant receiver, ammonia accumulator, condensate drum). The vessel pressure and vapour pressure are the SAME thermodynamic state — they cancel exactly. NPSHa = z − h_f = '+npsha.toFixed(2)+' m only. Standard NPSH formula does not apply. Do NOT use a standard centrifugal pump — specify canned motor, barrel type, or a pump with inducer rated for near-zero NPSH service.'});
  // ── Status classification ──
  let sc, st;
  if (npsha < 0) {
    sc='err'; st='⛔ Critical — NPSHa negative. Fluid flashing in suction pipe.';
  } else if (npsha < npshr_m) {
    sc='err'; st='⛔ Cavitation — NPSHa ('+npsha.toFixed(2)+' m) < NPSHr ('+npshr_m.toFixed(2)+' m). Pump will cavitate.';
  } else if (margin_actual < 0) {
    sc='warn'; st='⚠ Marginal — NPSHa > NPSHr but safety margin of '+margin_req.toFixed(1)+' m not satisfied (HI 9.6.1).';
  } else if (margin_actual < 1.0) {
    sc='warn'; st='⚠ Acceptable — Margin '+margin_actual.toFixed(2)+' m meets minimum. Use ≥1 m for critical service.';
  } else if (margin_actual >= 3) {
    sc='ok'; st='✔ Excellent — NPSHa = '+npsha.toFixed(2)+' m. Margin = '+margin_actual.toFixed(2)+' m. Very low cavitation risk.';
  } else {
    sc='ok'; st='✔ Adequate — NPSHa = '+npsha.toFixed(2)+' m. Margin = '+margin_actual.toFixed(2)+' m exceeds safety requirement.';
  }

  // ── Cavitation check ──
  const cavPmin_Pa  = pv_Pa + npshr_m * rg;
  const cavPmin_bar = cavPmin_Pa / 1e5;
  const cavPs_Pa    = pv_Pa + npsha * rg;
  const cavPs_bar   = cavPs_Pa / 1e5;
  const cavMargin_bar = cavPs_bar - cavPmin_bar;
  const cavS         = cavPs_bar > 0 ? pv_bar / cavPs_bar : 0;

  // ── Net ΔP calculation note ──
  const netDP_bar = (P_abs_Pa - pv_Pa) / 1e5;
  const netDP_m   = (P_abs_Pa - pv_Pa) / rg;

  // ── NPSHr pressure equivalents ──
  const npshr_bar_fluid = npshr_m * rg / 1e5;
  const npshr_bar_water = npshr_m * 9810 / 1e5;

  return {
    ok: true,
    // Fluid
    fluidName: f.name,
    fluidShort: f.name.replace(/\s*\(.*\)/, ''),
    T, rho, mu_mPas: mu * 1000,
    pv_Pa, pv_kPa, pv_bar,
    // Pipe / flow
    D_mm, D, A, Q, v, vh, Re, ff, hf, Le, eps_mm,
    // Heads
    H_abs, P_abs_Pa, z, z_raw,
    h_vp,
    // NPSHa
    npsha, npsha_deltaP_Pa, npsha_deltaP_bar,
    npsha_Ps_bar, npsha_ft, npsha_psi,
    // NPSHr
    npshr_m, npshr_bar_fluid, npshr_bar_water,
    npshrEstimate,
    // Margin
    margin_req, margin_actual, npsha_required,
    // Status
    sc, st,
    warnings,
    // Cavitation
    cavPmin_Pa, cavPmin_bar, cavPs_Pa, cavPs_bar,
    cavMargin_bar, cavS,
    // Helpers
    netDP_bar, netDP_m,
    isSaturatedService, saturationRatio,
    rg, g,
    tp: upType, isAbove, isVessel,
  };
}

/* ═══════════════════════════════════════════════════════════════
   INPUT SANITISATION
═══════════════════════════════════════════════════════════════ */

async function handle_calculate(body, res) {
  const { calc, params } = body || {};
  if (!calc || !params) {
    return res.status(400).json({ error: 'Missing calc type or params.' });
  }
  let result;
  try {
    switch (calc) {
      case 'h2p':    result = calcH2P(params);    break;
      case 'v2p':    result = calcV2P(params);    break;
      case '3ph':    result = calc3P(params);     break;
      case 'pv':     result = calcPV(params);     break;
      case 'mist':   result = calcMist(params);   break;
      case 'nozzle': result = calcNozzle(params); break;
      default:
        return res.status(400).json({ error: `Unknown calc type: ${calc}` });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Calculation error: ' + err.message });
  }
  return res.status(200).json(result);
}

async function handle_npsh_calculator(body, res) {
  const action = (body.action || '').trim();

  /* ── fluidList ── */
  if (action === 'fluidList') {
    return res.status(200).json({
      ok: true,
      fluids: NPSH_FLUIDS.map((f, i) => ({ index: i, id: f.id, name: f.name })),
    });
  }

  /* ── fluidProps ── */
  if (action === 'fluidProps') {
    const idx = sInt(body.fluidIndex, 0);
    const T   = sNum(body.T_C, 20);
    if (idx < 0 || idx >= NPSH_FLUIDS.length) return res.status(400).json({ ok: false, error: 'Invalid fluidIndex' });
    const f       = NPSH_FLUIDS[idx];
    const rho     = rhoAt(f, T);
    const mu_mPas = muAt(f, T) * 1000;
    const pv_kPa  = npshVpI(f, T);
    const pv_bar  = pv_kPa / 100;
    const rg      = rho * 9.81;
    const hvp     = pv_kPa * 1000 / rg;
    return res.status(200).json({
      ok: true, name: f.name,
      rho:     parseFloat(rho.toFixed(3)),
      mu_mPas: parseFloat(mu_mPas.toFixed(4)),
      pv_kPa:  parseFloat(pv_kPa.toFixed(5)),
      pv_bar:  parseFloat(pv_bar.toFixed(6)),
      hvp:     parseFloat(hvp.toFixed(4)),
    });
  }

  /* ── estimateNpshr ── */
  if (action === 'estimateNpshr') {
    const idx      = sInt(body.fluidIndex, 0);
    const T_C      = sNum(body.T_C, 20);
    const unitMode = sStr(body.unitMode, ['SI','IMP'], 'SI');
    const isImp    = unitMode === 'IMP';
    const N_rpm    = sNum(body.N_rpm, 1450);
    const Q_raw    = sNum(body.Q_raw, 50);
    const H_user   = sNum(body.H_total, 30);
    const stages   = Math.max(1, sInt(body.stages, 1));
    const pumpType = sStr(body.pumpType, ['centrifugal_low','centrifugal_med','centrifugal_high','mixed','axial','multistage'], 'centrifugal_med');
    const Q_m3s    = isImp ? Q_raw / 264.172 / 60 : Q_raw / 3600;
    const H_total  = isImp ? H_user / 3.281 : H_user;
    const result   = calcEstimateNpshr({ N: N_rpm, Q_m3s, H_total, stages, pumpType });
    const f        = NPSH_FLUIDS[idx] || NPSH_FLUIDS[0];
    const rho      = rhoAt(f, T_C);
    const rg       = rho * 9.81;
    const npshr_bar_fluid = result.npshr_m * rg / 1e5;
    return res.status(200).json({ ok: true, ...result, npshr_bar_fluid });
  }

  /* ── calculate (main NPSHa) ── */
  if (action === 'calculate') {
    const VALID_UP    = ['open_above','open_below','vessel_above','vessel_below'];
    const VALID_NPSHR = ['direct','estimate'];
    const VALID_PUMP  = ['centrifugal_low','centrifugal_med','centrifugal_high','mixed','axial','multistage'];
    const VALID_UNIT  = ['SI','IMP'];
    const inputs = {
      fluidIndex:         Math.max(0, Math.min(NPSH_FLUIDS.length-1, sInt(body.fluidIndex, 0))),
      T_C:                Math.max(-50, Math.min(250, sNum(body.T_C, 20))),
      unitMode:           sStr(body.unitMode,   VALID_UNIT,  'SI'),
      D_mm:               Math.max(5, Math.min(2000, sNum(body.D_mm, 154.1))),
      Q_raw:              Math.max(0.001, sNum(body.Q_raw, 50)),
      L_m:                Math.max(0, sNum(body.L_m, 5)),
      Lf_m:               Math.max(0, sNum(body.Lf_m, 2.5)),
      eps_mm:             Math.max(0.0001, Math.min(10, sNum(body.eps_mm, 0.046))),
      upType:             sStr(body.upType, VALID_UP, 'open_above'),
      baro_bar:           Math.max(0.5, Math.min(1.1, sNum(body.baro_bar, 1.01325))),
      vessel_pg_raw:      sNum(body.vessel_pg_raw, 1.5),
      z_raw_user:         sNum(body.z_raw_user, 3.0),
      npshrMethod:        sStr(body.npshrMethod, VALID_NPSHR, 'direct'),
      npshr_direct_user:  Math.max(0, sNum(body.npshr_direct_user, 3.0)),
      N_rpm:              Math.max(100, Math.min(10000, sNum(body.N_rpm, 1450))),
      H_total_user:       Math.max(1, sNum(body.H_total_user, 30)),
      stages:             Math.max(1, Math.min(20, sInt(body.stages, 1))),
      pumpType:           sStr(body.pumpType, VALID_PUMP, 'centrifugal_med'),
      margin_req:         Math.max(0, Math.min(10, sNum(body.margin_req, 0.6))),
    };
    const result = calcNPSH(inputs);
    return res.status(200).json(result);
  }

  return res.status(400).json({ ok: false, error: 'Unknown action: ' + action });
}





// ================================================================

// ════════════════════════════════════════════════════════════════════════════
// Vercel handler — dispatches to handle_npsh_calculator
// ════════════════════════════════════════════════════════════════════════════
async function npsh_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = req.method === 'POST' ? req.body : {};
  if (req.method === 'POST' && (!body || typeof body !== 'object'))
    return res.status(400).json({ error: 'Invalid request body.' });

  try {
    return await handle_npsh_calculator(body, res);
  } catch (e) {
    console.error('[npsh-calculator.js] Unhandled error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

// ── End of Section 16: NPSH Calculator ──────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION 17 of 21  ►  CIVIL ENGINEERING CALCULATORS
// Route: /api/civil-engineering-calculators
// Source: civil-engineering-calculators.js
// ══════════════════════════════════════════════════════════════════════════════

// CIVIL ENGINEERING CALCULATORS — api/civil-engineering-calculators.js
// Covers: Beam, Column, Footing, Concrete Mix, Steel Section,
//         Pipe Flow, Retaining Wall, Earthwork, Surveying
// ================================================================

// ============================================================
// Vercel Serverless API — Civil Engineering Calculators
// Repo: github.com/nagtesting/nagtesting
// Path: /api/civil-engineering-calculators.js
// Covers: Beam, Column, Footing, Concrete Mix, Steel Section,
//         Pipe Flow, Retaining Wall, Earthwork, Surveying
// ============================================================

// ========================================================================
// SECTION: CIVIL
// ========================================================================

// ── SAFE HELPERS ─────────────────────────────────────────────
function safeDiv(num, den, fallback = Infinity) {
  return Math.abs(den) < 1e-15 ? fallback : num / den;
}
function fN(v, dp = 2, u = '') {
  return (isNaN(v) || !isFinite(v)) ? '—' : (v.toFixed(dp) + (u ? ' ' + u : ''));
}

// ── UNIT CONVERTERS ───────────────────────────────────────────
function toM(val, u)   { return u === 'ft'  ? val * 0.3048   : val; }
function civil_toMm(val, u) { return u === 'in' ? val * 25.4 : val; }
function toKN(val, u)  { return u === 'kip' ? val * 4.44822  : val; }
function toKPa(val, u) { return u === 'ksf' ? val * 47.88    : val; }
function toKNm3(val,u) { return u === 'pcf' ? val * 0.157088 : val; }
function toM3(val, u)  { return u === 'yd3' ? val * 0.7646   : val; }
function toM2(val, u)  { return u === 'ft2' ? val * 0.0929   : val; }
function toKmh(val, u) { return u === 'mph' ? val * 1.60934  : val; }
function toMs2(val, u) { return u === 'ft2' ? val * 0.0929   : val; }
function toLS(val, u)  { return u === 'gpm' ? val * 0.0630902 : val; }

// ── CALC: BEAM BENDING ────────────────────────────────────────
function calcBeam(p) {
  let L  = toM(parseFloat(p.L),  p.L_u);
  let w  = p.w_u === 'kipft' ? parseFloat(p.w) * 14.5939 : parseFloat(p.w);
  let b  = civil_toMm(parseFloat(p.b), p.dim_u) / 1000;
  let d  = civil_toMm(parseFloat(p.d), p.dim_u) / 1000;
  let tw = civil_toMm(parseFloat(p.tw)||0, p.dim_u) / 1000;
  let tf = civil_toMm(parseFloat(p.tf)||0, p.dim_u) / 1000;
  let dia= civil_toMm(parseFloat(p.dia)||0, p.dim_u) / 1000;
  const E_GPa = parseFloat(p.E_GPa);
  const fy    = parseFloat(p.fy);
  const type  = p.type;
  const sec   = p.sec;
  const Ev    = E_GPa * 1e6; // kN/m²

  const warns = [];
  if (L <= 0)    throw new Error('Span L must be > 0');
  if (w < 0)     throw new Error('Load cannot be negative');
  if (E_GPa <= 0) throw new Error('Elastic modulus must be > 0');
  if (E_GPa > 500) warns.push('⚠ E > 500 GPa is unrealistic — check units (enter GPa, not MPa)');
  if (fy <= 0)   throw new Error('Yield stress fy must be > 0');

  let I, A_sec;
  if (sec === 'rect') {
    if (b <= 0 || d <= 0) throw new Error('Width b and depth d must be > 0');
    I = b*d*d*d/12; A_sec = b*d;
  } else if (sec === 'circ') {
    if (dia <= 0) throw new Error('Diameter must be > 0');
    I = Math.PI * Math.pow(dia,4) / 64; A_sec = Math.PI*dia*dia/4;
  } else if (sec === 'hol') {
    if (b<=0||d<=0||tw<=0||tf<=0) throw new Error('All hollow section dimensions must be > 0');
    if (2*tw >= b) throw new Error('2·tw ≥ b — wall eliminates void (width)');
    if (2*tf >= d) throw new Error('2·tf ≥ d — wall eliminates void (depth)');
    const bi = b-2*tw, di = d-2*tf;
    I = (b*d*d*d - bi*di*di*di)/12; A_sec = b*d-bi*di;
  } else { // I
    if (b<=0||d<=0||tw<=0||tf<=0) throw new Error('All I-section dimensions must be > 0');
    if (tw >= b) throw new Error('Web thickness tw ≥ flange width b');
    if (2*tf >= d) throw new Error('2·tf ≥ d — no web remains');
    const hw = d-2*tf;
    I = (b*d*d*d - (b-tw)*hw*hw*hw)/12;
    A_sec = 2*b*tf + hw*tw;
  }

  if (I <= 0 || !isFinite(I)) throw new Error('Computed I ≤ 0 — check section geometry');
  const y   = sec === 'circ' ? dia/2 : d/2;
  const Z   = safeDiv(I, y);
  const rg  = Math.sqrt(safeDiv(I, A_sec, 0));

  let M=0, V=0, def=0, formula='';
  if      (type==='ss_udl')   { M=w*L*L/8;     V=w*L/2;   def=5*w*L*L*L*L/(384*Ev*I); formula='M=wL²/8 | V=wL/2 | δ=5wL⁴/384EI'; }
  else if (type==='ss_pt')    { M=w*L/4;        V=w/2;     def=w*L*L*L/(48*Ev*I);      formula='M=PL/4 | V=P/2 | δ=PL³/48EI'; }
  else if (type==='cant_udl') { M=w*L*L/2;      V=w*L;     def=w*L*L*L*L/(8*Ev*I);     formula='M=wL²/2 | V=wL | δ=wL⁴/8EI'; }
  else if (type==='cant_pt')  { M=w*L;          V=w;       def=w*L*L*L/(3*Ev*I);       formula='M=PL | V=P | δ=PL³/3EI'; }
  else if (type==='fixed_udl'){ M=w*L*L/12;     V=w*L/2;   def=w*L*L*L*L/(384*Ev*I);  formula='M_end=wL²/12 | M_mid=wL²/24 | V=wL/2 | δ=wL⁴/384EI'; }

  const sigma = safeDiv(M, Z) / 1000; // MPa
  if (!isFinite(sigma)) throw new Error('Bending stress overflow — check inputs');

  const isConcrete = (E_GPa >= 15 && E_GPa <= 50);
  const creepTheta = isConcrete ? 2.5 : 1.0;
  const def_lt = def * creepTheta;
  const LD_lt  = def_lt > 0 ? L / def_lt : Infinity;
  const LD     = def > 0 ? L / def : Infinity;
  const ok = sigma <= fy;

  if (E_GPa >= 15 && E_GPa <= 50)
    warns.push('⚠ Concrete detected — long-term deflection multiplied by θ=' + creepTheta + ' (IS 456 Cl.23.2 simplified)');
  if (LD < 250)
    warns.push('⚠ L/δ = ' + LD.toFixed(0) + ' < 250 — serviceability deflection may be excessive');

  return {
    status: ok ? 'PASS' : 'WARN',
    warns,
    summary: `Type: ${type} | Section: ${sec} | Formula: ${formula}`,
    results: [
      { label: 'Moment of Inertia I',  value: fN(I*1e12/1e6, 3, '×10⁶ mm⁴'), warn: false },
      { label: 'Section Modulus Z',    value: fN(Z*1e9/1e3, 2, '×10³ mm³'),  warn: false },
      { label: 'Radius of Gyration',   value: fN(rg*1000, 2, 'mm'),           warn: false },
      { label: 'Max Bending Moment M', value: fN(M, 3, 'kN·m'),               warn: false },
      { label: 'Max Shear Force V',    value: fN(V, 3, 'kN'),                  warn: false },
      { label: 'Max Deflection δ',     value: fN(def*1000, 3, 'mm'),           warn: false },
      { label: 'Long-term Deflection', value: fN(def_lt*1000, 3, 'mm') + (isConcrete ? ' (×'+creepTheta+' creep IS 456)' : ' (no creep)'), warn: isConcrete },
      { label: 'L/δ (short-term)',     value: LD === Infinity ? '∞' : fN(LD, 0), warn: LD < 250 },
      { label: 'L/δ (long-term)',      value: LD_lt === Infinity ? '∞' : fN(LD_lt, 0), warn: LD_lt < 250 },
      { label: 'Bending Stress σ',     value: fN(sigma, 2, 'MPa'),             warn: !ok },
      { label: 'Stress Check',         value: ok ? '✓ OK — σ ≤ fy' : '✗ Overstressed (fy=' + fy + ' MPa)', warn: !ok },
      { label: 'EI Stiffness',         value: fN(Ev*I, 0, 'kN·m²'),            warn: false },
    ]
  };
}

// ── CALC: COLUMN BUCKLING ─────────────────────────────────────
function calcCol(p) {
  const sec = p.sec;
  const K   = parseFloat(p.K);
  let Le    = toM(parseFloat(p.Le), p.Le_u);
  let b     = civil_toMm(parseFloat(p.b)||0, p.dim_u) / 1000;
  let d     = civil_toMm(parseFloat(p.d)||0, p.dim_u) / 1000;
  let diam  = civil_toMm(parseFloat(p.diam)||0, p.dim_u) / 1000;
  let OD    = civil_toMm(parseFloat(p.OD)||0, p.dim_u) / 1000;
  let t     = civil_toMm(parseFloat(p.t)||0, p.dim_u) / 1000;
  let tw    = civil_toMm(parseFloat(p.tw)||0, p.dim_u) / 1000;
  let tf    = civil_toMm(parseFloat(p.tf)||0, p.dim_u) / 1000;
  const E_GPa = parseFloat(p.E_GPa);
  const Ev    = E_GPa * 1e6;
  const fy    = parseFloat(p.fy);
  let N       = toKN(parseFloat(p.N)||0, p.N_u);

  if (Le <= 0)   throw new Error('Length Le must be > 0');
  if (E_GPa <= 0) throw new Error('Elastic modulus must be > 0');
  if (fy <= 0)   throw new Error('Yield stress fy must be > 0');

  let A=0, Ix=0, Iy=0;
  if (sec === 'rect') {
    if (b<=0||d<=0) throw new Error('Width and depth must be > 0');
    A = b*d; Ix = b*d*d*d/12; Iy = d*b*b*b/12;
  } else if (sec === 'circ') {
    if (diam <= 0) throw new Error('Diameter must be > 0');
    A = Math.PI*diam*diam/4; Ix = Iy = Math.PI*Math.pow(diam,4)/64;
  } else if (sec === 'I') {
    if (b<=0||d<=0||tw<=0||tf<=0) throw new Error('All I-section dimensions must be > 0');
    if (tw >= b) throw new Error('Web thickness tw ≥ flange width b');
    if (2*tf >= d) throw new Error('2·tf ≥ d — no web remains');
    const hw = d-2*tf;
    A  = 2*b*tf + hw*tw;
    Ix = (b*d*d*d - (b-tw)*hw*hw*hw) / 12;
    Iy = 2*(tf*b*b*b/12) + hw*tw*tw*tw/12;
  } else { // hollow
    if (OD<=0||t<=0) throw new Error('OD and thickness must be > 0');
    const ID = OD-2*t;
    if (ID <= 0) throw new Error('Wall thickness t > OD/2 — section is solid');
    A = Math.PI*(OD*OD-ID*ID)/4; Ix = Iy = Math.PI*(Math.pow(OD,4)-Math.pow(ID,4))/64;
  }

  const I_min  = Math.min(Ix, Iy);
  const r_min  = Math.sqrt(I_min/A);
  const KL     = K * Le;
  const KL_r   = safeDiv(KL, r_min);
  const fy_kPa = fy * 1000;
  const sigma_cr_euler = (Math.PI*Math.PI*Ev) / (KL_r*KL_r);
  const lambda_c = Math.PI * Math.sqrt(2*Ev/fy_kPa);
  let sigma_cr, formula_note;
  if (KL_r >= lambda_c) {
    sigma_cr = sigma_cr_euler; formula_note = 'Euler (slender)';
  } else {
    sigma_cr = fy_kPa*(1-(fy_kPa*KL_r*KL_r)/(4*Math.PI*Math.PI*Ev));
    formula_note = 'Johnson parabola (KL/r < λc=' + lambda_c.toFixed(0) + ')';
  }
  const Pcr = sigma_cr * A;

  const lambda_bar = Math.sqrt(fy_kPa / ((Math.PI*Math.PI*Ev)/(KL_r*KL_r)));
  const alphaMap   = { rect:0.49, circ:0.21, I:0.21, hol:0.34 };
  const alpha      = alphaMap[sec] || 0.34;
  let chi;
  if (lambda_bar <= 0.2) {
    chi = 1.0;
  } else {
    const phi = 0.5*(1 + alpha*(lambda_bar-0.2) + lambda_bar*lambda_bar);
    chi = Math.min(1.0, 1.0/(phi + Math.sqrt(phi*phi - lambda_bar*lambda_bar)));
  }
  const gamma_M0 = 1.10;
  const fcd = chi * fy_kPa / gamma_M0;
  const Pd  = fcd * A;
  const sigma_act = safeDiv(N, A);
  const demandOK  = N <= Pd;
  const SF        = N > 0 ? safeDiv(Pd, N) : Infinity;
  const curveLabel = {0.21:'a (α=0.21)', 0.34:'b (α=0.34)', 0.49:'c (α=0.49)'}[alpha] || 'b';
  const warns = [];
  if (KL_r > 180) warns.push('⚠ KL/r > 180 — very slender column, consider stiffening');
  if (!demandOK)  warns.push('⚠ Applied load N exceeds design resistance Pd');

  return {
    status: demandOK ? 'PASS' : 'WARN',
    warns,
    summary: `Section: ${sec} | KL/r = ${fN(KL_r,1)} | ${formula_note} | IS 800 curve ${curveLabel}`,
    results: [
      { label: 'Area A',                   value: fN(A*1e6, 1, 'mm²'),              warn: false },
      { label: 'Min. Inertia I_min',        value: fN(I_min*1e12/1e6, 2, '×10⁶ mm⁴'), warn: false },
      { label: 'Min. Radius of Gyration r', value: fN(r_min*1000, 2, 'mm'),          warn: false },
      { label: 'Slenderness KL/r',          value: fN(KL_r, 1) + ' (λc = ' + lambda_c.toFixed(0) + ')', warn: KL_r > 180 },
      { label: 'IS 800 λ̄',                 value: fN(lambda_bar, 3),                warn: false },
      { label: 'IS 800 χ (curve '+curveLabel+')', value: fN(chi, 3),                warn: false },
      { label: 'Pcr (elastic theoretical)', value: fN(Pcr, 2, 'kN'),                warn: false },
      { label: 'Pd (IS 800 design)',        value: fN(Pd, 2, 'kN'),                  warn: !demandOK },
      { label: 'Applied Load N',            value: fN(N, 2, 'kN'),                   warn: !demandOK },
      { label: 'Demand Check N ≤ Pd',       value: demandOK ? '✓ Adequate' : '✗ N > Pd — overstressed', warn: !demandOK },
      { label: 'Safety Factor Pd/N',        value: SF === Infinity ? '∞' : fN(SF, 2) + (SF>=2?' ✓ Adequate':SF>=1?' ⚠ Marginal':' ✗ Inadequate'), warn: SF < 1.5 },
      { label: 'Critical Stress σcr',       value: fN(sigma_cr/1000, 2, 'MPa'),      warn: false },
      { label: 'Axial Stress σ',            value: fN(sigma_act/1000, 2, 'MPa'),     warn: sigma_act > fy_kPa },
    ]
  };
}

// ── CALC: FOOTING ─────────────────────────────────────────────
function calcFooting(p) {
  let P   = toKN(parseFloat(p.P),   p.P_u);
  let cb  = civil_toMm(parseFloat(p.cb),  p.dim_u) / 1000;
  let cd  = civil_toMm(parseFloat(p.cd),  p.dim_u) / 1000;
  let B   = toM(parseFloat(p.B),    p.L_u);
  let L   = toM(parseFloat(p.L),    p.L_u);
  let d   = civil_toMm(parseFloat(p.d),   p.dim_u) / 1000;
  let qa  = toKPa(parseFloat(p.qa), p.qa_u);
  let ex  = toM(parseFloat(p.ex)||0, p.L_u);
  let ey  = toM(parseFloat(p.ey)||0, p.L_u);
  const fck  = parseInt(p.fck);
  const fy_s = parseInt(p.fy_s);

  if (P<=0)         throw new Error('Column load P must be > 0');
  if (B<=0||L<=0)   throw new Error('Footing dimensions must be > 0');
  if (d<=0)         throw new Error('Effective depth must be > 0');
  if (cb<=0||cd<=0) throw new Error('Column dimensions must be > 0');
  if (cb>=B||cd>=L) throw new Error('Column larger than footing');

  const q_avg = P / (B*L);
  const q_max = q_avg * (1 + 6*Math.abs(ex)/B + 6*Math.abs(ey)/L);
  const q_min = q_avg * (1 - 6*Math.abs(ex)/B - 6*Math.abs(ey)/L);
  const A_req = P / qa;
  const A_prov = B * L;
  const bearOK = q_max <= qa;
  const cantB  = (B-cb)/2, cantL = (L-cd)/2;
  const Mu_B   = 1.5 * q_max * cantB * cantB / 2;
  const Mu_L   = 1.5 * q_max * cantL * cantL / 2;
  const b_px   = cb+d, b_py = cd+d;
  const b0     = 2*(b_px+b_py);
  const V_punch = 1.5*P - 1.5*q_avg*b_px*b_py;
  const tau_v   = V_punch / (b0*d*1000);
  const beta_c  = Math.min(cb,cd) / Math.max(cb,cd);
  const k_s     = Math.min(1.0, 0.5+beta_c);
  const tau_co  = 0.25*Math.sqrt(fck);
  const tau_c   = k_s*tau_co;
  const punchOK = tau_v <= tau_c;
  const D_overall = d + 0.05;
  const pt_min    = fy_s >= 500 ? 0.0012 : 0.0015;
  const Ast_min   = pt_min * 1000 * D_overall * 1000;
  const Ast_B_calc = (Mu_B*1e6)/(0.87*fy_s*0.9*d*1000);
  const Ast_L_calc = (Mu_L*1e6)/(0.87*fy_s*0.9*d*1000);
  const Ast_B = Math.max(Ast_B_calc, Ast_min);
  const Ast_L = Math.max(Ast_L_calc, Ast_min);
  const critB = Math.max(0,(B-cb)/2-d), critL = Math.max(0,(L-cd)/2-d);
  const Vow_B = 1.5*q_max*critB, Vow_L = 1.5*q_max*critL;
  const tau_ow_B = Vow_B/(d*1000), tau_ow_L = Vow_L/(d*1000);
  function tauC_IS456(pt,fck){ if(pt<=0)return 0; const beta=Math.max(1,0.8*fck/(6.89*pt*100)); return 0.85*Math.sqrt(0.8*fck)*(Math.sqrt(1+5*beta)-1)/(6*beta); }
  const pt_B = Math.min(Ast_B/(1000*d*1000),0.03), pt_L = Math.min(Ast_L/(1000*d*1000),0.03);
  const tau_c_ow_B = tauC_IS456(pt_B*100,fck), tau_c_ow_L = tauC_IS456(pt_L*100,fck);
  const owOK_B = tau_ow_B <= tau_c_ow_B, owOK_L = tau_ow_L <= tau_c_ow_L;
  const allOK = bearOK && punchOK && owOK_B && owOK_L;
  const warns = [];
  if (!bearOK)  warns.push('⚠ Max bearing pressure q_max exceeds allowable SBC');
  if (!punchOK) warns.push('⚠ Punching shear fails — increase d or fck');
  if (!owOK_B)  warns.push('⚠ One-way shear fails in B-direction — increase effective depth');
  if (!owOK_L)  warns.push('⚠ One-way shear fails in L-direction — increase effective depth');
  if (q_min < 0) warns.push('⚠ Tension at base (q_min < 0) — check soil contact');

  return {
    status: allOK ? 'PASS' : 'WARN',
    warns,
    summary: `Footing ${fN(B,2)}×${fN(L,2)} m | d=${fN(d*1000,0)} mm | fck=${fck} MPa | fy=${fy_s} MPa`,
    results: [
      { label: 'Max Bearing Pressure q_max', value: fN(q_max,2,'kN/m²'), warn: !bearOK },
      { label: 'Bearing Check',              value: bearOK ? '✓ q_max ≤ qa' : '✗ Exceeds qa='+qa.toFixed(0)+' kN/m²', warn: !bearOK },
      { label: 'Min Bearing Pressure q_min', value: fN(q_min,2,'kN/m²'), warn: q_min<0 },
      { label: 'Required Area',              value: fN(A_req,2,'m²'),     warn: false },
      { label: 'Provided Area',              value: fN(A_prov,2,'m²') + (A_prov>=A_req?' ✓':' ✗'), warn: A_prov<A_req },
      { label: 'Factored Mu (B-dir)',        value: fN(Mu_B,2,'kN·m/m'), warn: false },
      { label: 'Factored Mu (L-dir)',        value: fN(Mu_L,2,'kN·m/m'), warn: false },
      { label: 'Punch Perimeter b0',         value: fN(b0*1000,0,'mm'),  warn: false },
      { label: 'Applied τ_v',                value: fN(tau_v,3,'MPa'),   warn: !punchOK },
      { label: 'k_s (IS 456 Cl.31.6.3)',     value: fN(k_s,3)+' (β_c='+fN(beta_c,3)+')', warn: false },
      { label: 'Allowable τ_c',              value: fN(tau_c,3,'MPa'),   warn: false },
      { label: 'Punching Check',             value: punchOK ? '✓ Safe τ_v ≤ τ_c' : '✗ Fails — increase d or fck', warn: !punchOK },
      { label: 'Ast B-dir',                  value: fN(Ast_B,0,'mm²/m'), warn: false },
      { label: 'Ast L-dir',                  value: fN(Ast_L,0,'mm²/m'), warn: false },
      { label: 'Ast_min',                    value: fN(Ast_min,0,'mm²/m') + ' (IS 456 Cl.26.5.2.1)', warn: false },
      { label: 'One-way Shear B',            value: fN(tau_ow_B,3,'MPa')+' vs τ_c='+fN(tau_c_ow_B,3,'MPa'), warn: !owOK_B },
      { label: 'One-way Shear L',            value: fN(tau_ow_L,3,'MPa')+' vs τ_c='+fN(tau_c_ow_L,3,'MPa'), warn: !owOK_L },
    ]
  };
}

// ── CALC: CONCRETE MIX ───────────────────────────────────────
function calcConc(p) {
  const grade  = parseInt(p.grade);
  const wc     = parseFloat(p.wc);
  let   vol    = parseFloat(p.vol_u) === 'yd3' ? parseFloat(p.vol)*0.7646 : parseFloat(p.vol);
  if (vol <= 0) vol = 1;
  const slump  = parseInt(p.slump);
  const aggSz  = parseInt(p.aggSz);
  const FA_pct = parseFloat(p.FA_pct) / 100;
  const exp    = p.exp;
  const cem    = p.cem;
  const expMap = {
    mild:      { minCem:300, maxWC:0.65 },
    moderate:  { minCem:320, maxWC:0.55 },
    severe:    { minCem:340, maxWC:0.50 },
    very_severe:{ minCem:360, maxWC:0.45 }
  };
  const expData = expMap[exp] || expMap['moderate'];

  let W = 175;
  if (aggSz===10) W+=15; if (aggSz===40) W-=15;
  if (slump===25) W-=15; if (slump===150) W+=20;
  let C = W / wc;
  if (C < expData.minCem) C = expData.minCem;
  const WC_actual = W / C;
  const S_dev = grade >= 30 ? 5 : 4;
  const fm    = grade + 1.65 * S_dev;
  const rho_cem = cem==='PPC' ? 2900 : (cem==='SRPC' ? 3200 : 3150);
  const vol_cem = C/rho_cem, vol_w = W/1000, vol_air = 0.015;
  const vol_agg = 1 - vol_cem - vol_w - vol_air;
  const FA = vol_agg * FA_pct * 2650;
  const CA = vol_agg * (1-FA_pct) * 2700;
  const density = C+W+FA+CA;
  const bags = C/50;
  const rFA = FA/C, rCA = CA/C, rW = W/C;
  const wcOK = WC_actual <= expData.maxWC;
  const warns = [];
  if (!wcOK) warns.push('⚠ W/C ratio ' + WC_actual.toFixed(3) + ' exceeds durability limit ' + expData.maxWC + ' for ' + exp + ' exposure');

  return {
    status: wcOK ? 'PASS' : 'WARN',
    warns,
    summary: `M${grade} | fm=${fN(fm,1)} MPa | W/C=${WC_actual.toFixed(3)} | ρ=${fN(density,0)} kg/m³`,
    results: [
      { label: 'Target Mean Strength fm', value: fN(fm,1,'MPa') + ' = fck + 1.65×'+S_dev, warn: false },
      { label: 'Cement Content',          value: fN(C,0,'kg/m³') + ' | Batch: ' + fN(C*vol,0,'kg'), warn: C > 500 },
      { label: 'Water Content',           value: fN(W,0,'L/m³') + ' | Batch: ' + fN(W*vol,0,'L'), warn: false },
      { label: 'W/C Ratio (actual)',       value: WC_actual.toFixed(3) + (wcOK?' ✓':' ✗ Exceeds '+expData.maxWC), warn: !wcOK },
      { label: 'Fine Aggregate FA',        value: fN(FA,0,'kg/m³') + ' | Batch: ' + fN(FA*vol,0,'kg'), warn: false },
      { label: 'Coarse Aggregate CA',      value: fN(CA,0,'kg/m³') + ' | Batch: ' + fN(CA*vol,0,'kg'), warn: false },
      { label: 'Mix Ratio C:FA:CA:W',      value: '1:'+rFA.toFixed(2)+':'+rCA.toFixed(2)+':'+rW.toFixed(2), warn: false },
      { label: 'Fresh Density (computed)', value: fN(density,0,'kg/m³'), warn: false },
      { label: 'Cement Bags',             value: fN(bags,1,'bags (50 kg/m³)'), warn: false },
    ]
  };
}

// ── CALC: STEEL SECTION ───────────────────────────────────────
function calcSteel(p) {
  const type = p.type;
  const fy_s = parseFloat(p.fy_s);
  if (!isFinite(fy_s) || fy_s <= 0) throw new Error('fy must be a positive number');

  let Ixx=0, Iyy=0, A=0, Zpx=0, Zpy=0, yc=0, yt=0, yb=0, zt=0, zb=0;
  let zpxLabel='', zpyLabel='';

  function findPNA(areaAbove, lo, hi, tol=1e-6) {
    for (let i=0; i<60; i++) {
      const mid=(lo+hi)/2;
      if (areaAbove(mid) > A/2) lo=mid; else hi=mid;
      if (hi-lo < tol) break;
    }
    return (lo+hi)/2;
  }

  if (type === 'I') {
    const H=parseFloat(p.H),Bf=parseFloat(p.Bf),Tf=parseFloat(p.Tf),Tw=parseFloat(p.Tw);
    if (H<=0||Bf<=0||Tf<=0||Tw<=0) throw new Error('All dimensions must be > 0');
    if (H<=2*Tf) throw new Error('H ≤ 2·Tf — web height is zero');
    if (Tw>=Bf)  throw new Error('Web thickness ≥ flange width');
    const hw=H-2*Tf;
    A=2*Bf*Tf+hw*Tw; yc=H/2; yt=yb=H/2; zt=zb=Bf/2;
    Ixx=(Bf*H*H*H-(Bf-Tw)*hw*hw*hw)/12;
    Iyy=2*(Tf*Bf*Bf*Bf/12)+hw*Tw*Tw*Tw/12;
    Zpx=2*(Bf*Tf*(hw/2+Tf/2)+Tw*(hw/2)*(hw/4));
    Zpy=2*(2*Tf*(Bf/2)*(Bf/4)+hw*(Tw/2)*(Tw/4));
    zpxLabel='Exact — doubly-symmetric I'; zpyLabel='Exact';

  } else if (type === 'C') {
    const H=parseFloat(p.H),Bf=parseFloat(p.Bf),Tf=parseFloat(p.Tf),Tw=parseFloat(p.Tw);
    if (H<=0||Bf<=0||Tf<=0||Tw<=0) throw new Error('All dimensions must be > 0');
    if (H<=2*Tf) throw new Error('H ≤ 2·Tf — web height is zero');
    if (Tw>=Bf)  throw new Error('Web thickness ≥ flange width');
    const hw=H-2*Tf;
    A=2*Bf*Tf+hw*Tw; yc=H/2; yt=yb=H/2;
    const A_flange=Bf*Tf,A_web=hw*Tw;
    const zc_flange=Tw+Bf/2, zc_web=Tw/2;
    const zc=(2*A_flange*zc_flange+A_web*zc_web)/A;
    zt=zc; zb=Bf+Tw-zc;
    Ixx=(Bf*H*H*H-(Bf-Tw)*hw*hw*hw)/12;
    const Iyy_flange_own=2*(Tf*Bf*Bf*Bf/12);
    const Iyy_flange_pa=2*(A_flange*(zc_flange-zc)*(zc_flange-zc));
    const Iyy_web_own=hw*Tw*Tw*Tw/12;
    const Iyy_web_pa=A_web*(zc_web-zc)*(zc_web-zc);
    Iyy=Iyy_flange_own+Iyy_flange_pa+Iyy_web_own+Iyy_web_pa;
    Zpx=2*(Bf*Tf*(hw/2+Tf/2)+Tw*(hw/2)*(hw/4));
    const zfl_right=Bf+Tw-zc;
    const Zpy_flange_right=2*(Tf*zfl_right*(zfl_right/2));
    const Zpy_web_left=hw*(Math.min(Tw,zc))*(Math.min(Tw,zc)/2);
    const Zpy_flange_left=2*(Tf*Math.max(0,zc-Tw)*(Math.max(0,zc-Tw)/2));
    Zpy=Zpy_flange_right+Zpy_web_left+Zpy_flange_left;
    zpxLabel='Exact — C-channel'; zpyLabel='Exact — minor axis';

  } else if (type === 'angle') {
    const La=parseFloat(p.La),ta=parseFloat(p.ta);
    if (La<=0||ta<=0) throw new Error('Leg length and thickness must be > 0');
    if (ta>=La)       throw new Error('Thickness ≥ leg length');
    const A1=La*ta, y1c=La/2, A2=(La-ta)*ta, y2c=ta/2;
    A=A1+A2; yc=(A1*y1c+A2*y2c)/A;
    yt=La-yc; yb=yc; zt=La-yc; zb=yc;
    const Ixx1=ta*La*La*La/12+A1*(y1c-yc)*(y1c-yc);
    const Ixx2=(La-ta)*ta*ta*ta/12+A2*(y2c-yc)*(y2c-yc);
    Ixx=Ixx1+Ixx2; Iyy=Ixx;
    const Ixy=A1*(La/2-yc)*(y1c-yc)+A2*((La+ta)/2-yc)*(y2c-yc);
    const Imin=Ixx-Math.abs(Ixy); const Imax=Ixx+Math.abs(Ixy);
    function areaAboveAngle(y){ return ta*Math.max(0,La-y)+(La-ta)*Math.max(0,ta-y); }
    const y_pna=findPNA(areaAboveAngle,0,La);
    function fmAbove(y_p){ let S=0; if(y_p<ta){S+=La*(ta-y_p)*(ta-y_p)/2;S+=ta*((La-y_p)*(La-y_p)-(ta-y_p)*(ta-y_p))/2;}else{S=ta*(La-y_p)*(La-y_p)/2;} return S; }
    function fmBelow(y_p){ const lo_end=Math.min(y_p,ta); let S=La*(y_p*lo_end-lo_end*lo_end/2); if(y_p>ta)S+=ta*(y_p-ta)*(y_p-ta)/2; return S; }
    Zpx=fmAbove(y_pna)+fmBelow(y_pna); Zpy=Zpx;
    Ixx=Imin; Iyy=Imax;
    zpxLabel='Exact — bisection PNA (equal angle)'; zpyLabel='Exact (= Zpx)';

  } else if (type === 'SHS') {
    const Bs=parseFloat(p.Bs),ts=parseFloat(p.ts);
    if (Bs<=0||ts<=0) throw new Error('Outer size and thickness must be > 0');
    if (2*ts>=Bs)     throw new Error('2·t ≥ B — wall thickness eliminates void');
    const Bi=Bs-2*ts;
    A=Bs*Bs-Bi*Bi; yc=Bs/2; yt=yb=Bs/2; zt=zb=Bs/2;
    Ixx=Iyy=(Bs*Bs*Bs*Bs-Bi*Bi*Bi*Bi)/12;
    Zpx=Zpy=(Bs*Bs*Bs-Bi*Bi*Bi)/4;
    zpxLabel=zpyLabel='Exact — (Bs³−Bi³)/4';

  } else if (type === 'CHS') {
    const Dc=parseFloat(p.Dc),tc=parseFloat(p.tc);
    if (Dc<=0||tc<=0) throw new Error('Outer diameter and thickness must be > 0');
    if (2*tc>=Dc)     throw new Error('2·t ≥ D — wall eliminates bore');
    const Di=Dc-2*tc;
    A=Math.PI*(Dc*Dc-Di*Di)/4; yc=Dc/2; yt=yb=Dc/2; zt=zb=Dc/2;
    Ixx=Iyy=Math.PI*(Math.pow(Dc,4)-Math.pow(Di,4))/64;
    Zpx=Zpy=(Math.pow(Dc,3)-Math.pow(Di,3))/6;
    zpxLabel=zpyLabel='Exact — (Do³−Di³)/6';
  } else {
    throw new Error('Unknown section type: ' + type);
  }

  if (!isFinite(A)||A<=0) throw new Error('Computed area invalid — check inputs');
  if (!isFinite(Ixx)||Ixx<=0) throw new Error('Ixx ≤ 0 — geometry produces zero inertia');

  const y_max=Math.max(yt,yb), z_max=Math.max(zt,zb);
  const Zxx=Ixx/y_max, Zyy=Iyy/z_max;
  const rx=Math.sqrt(Ixx/A), ry=Math.sqrt(Iyy/A);
  const wt_per_m=A*7850/1e6;
  const gamma_M0=1.10;
  const Mc=Zpx*fy_s/(gamma_M0*1e6);
  const eps=Math.sqrt(250/fy_s);
  let classNote='', classBadge='info';
  if (type==='I') {
    const H=parseFloat(p.H),Bf=parseFloat(p.Bf),Tf=parseFloat(p.Tf),Tw=parseFloat(p.Tw),hw=H-2*Tf;
    const b_tf=Bf/(2*Tf),d_tw=hw/Tw;
    if(b_tf<=9.4*eps&&d_tw<=84*eps){classNote='Class 1 — Plastic';classBadge='ok';}
    else if(b_tf<=10.5*eps&&d_tw<=105*eps){classNote='Class 2 — Compact';classBadge='ok';}
    else if(b_tf<=15.7*eps&&d_tw<=126*eps){classNote='Class 3 — Semi-compact';classBadge='warn';}
    else{classNote='Class 4 — Slender ⚠';classBadge='err';}
  }
  const warns = [];
  if (classBadge==='err') warns.push('⚠ Class 4 slender section — moment capacity Mc may be reduced per IS 800');

  return {
    status: classBadge==='err' ? 'WARN' : 'PASS',
    warns,
    summary: `Type: ${type} | A=${fN(A,0)} mm² | wt=${fN(wt_per_m,2)} kg/m | Mc=${fN(Mc,2)} kN·m`,
    results: [
      { label: 'Area A',              value: fN(A,0,'mm²'),              warn: false },
      { label: 'Ixx (major)',         value: fN(Ixx/1e6,3,'×10⁶ mm⁴'), warn: false },
      { label: 'Iyy (minor)',         value: fN(Iyy/1e6,3,'×10⁶ mm⁴'), warn: false },
      { label: 'Elastic Modulus Zxx', value: fN(Zxx/1e3,2,'×10³ mm³'), warn: false },
      { label: 'Elastic Modulus Zyy', value: fN(Zyy/1e3,2,'×10³ mm³'), warn: false },
      { label: 'Radius of Gyration rx', value: fN(rx,2,'mm'),           warn: false },
      { label: 'Radius of Gyration ry', value: fN(ry,2,'mm'),           warn: false },
      { label: 'Plastic Modulus Zpx',  value: fN(Zpx/1e3,3,'×10³ mm³')+' ('+zpxLabel+')', warn: false },
      { label: 'Section Classification', value: classNote || 'N/A for this section type', warn: classBadge==='err' },
      { label: 'Weight per metre',     value: fN(wt_per_m,2,'kg/m'),    warn: false },
      { label: 'Moment Capacity Mc',   value: fN(Mc,2,'kN·m') + ' (IS 800 Cl.8.2.1.2, γM0=1.10)', warn: false },
    ]
  };
}

// ── CALC: PIPE FLOW ────────────────────────────────────────────
function calcPipe(p) {
  const mode  = p.mode;
  let D_mm    = civil_toMm(parseFloat(p.D), p.D_u);
  if (D_mm <= 0) throw new Error('Diameter must be > 0');
  const D = D_mm / 1000;

  if (mode === 'pressure') {
    let L   = toM(parseFloat(p.L),   p.L_u);
    let Q_ls= toLS(parseFloat(p.Q), p.Q_u);
    let Hlim= toM(parseFloat(p.Hlim),p.L_u);
    const eps_mm = parseFloat(p.eps_mm);
    const fl_data = { w:{rho:998.2,mu:1.003e-3}, wc:{rho:999.7,mu:1.307e-3}, sw:{rho:1025,mu:1.073e-3} };
    const fl = fl_data[p.fluid] || fl_data['w'];
    if (L<=0) throw new Error('Length must be > 0');
    if (Q_ls<=0) throw new Error('Flow rate must be > 0');
    const Ap = Math.PI*D*D/4;
    const Q_m3s = Q_ls/1000, v = Q_m3s/Ap;
    const Re = fl.rho*v*D/fl.mu;
    const g = 9.81, eps_rel = eps_mm/D_mm;
    const f = Re<1 ? 64/Math.max(Re,0.01) : Re<2300 ? 64/Re : 0.25/Math.pow(Math.log10(eps_rel/3.7+5.74/Math.pow(Re,0.9)),2);
    const hf = f*(L/D)*(v*v/(2*g));
    const vH = v*v/(2*g);
    const hfOK = hf <= Hlim;
    const regime = Re<2300?'Laminar':Re<4000?'Transitional':'Turbulent';
    const warns = [];
    if (!hfOK) warns.push('⚠ Head loss ' + fN(hf,3) + ' m exceeds limit ' + fN(Hlim,3) + ' m');
    if (Re>=2300&&Re<4000) warns.push('⚠ Transitional flow (Re=' + Re.toFixed(0) + ') — friction factor uncertain');

    return {
      status: hfOK ? 'PASS' : 'WARN',
      warns,
      summary: `Pressure pipe | D=${fN(D_mm,0)} mm | Q=${fN(Q_ls,2)} L/s | v=${fN(v,2)} m/s | ${regime}`,
      results: [
        { label: 'Flow Velocity v',     value: fN(v,3,'m/s'),       warn: false },
        { label: 'Reynolds Number Re',  value: Re.toFixed(0),        warn: Re>=2300&&Re<4000 },
        { label: 'Flow Regime',         value: regime,               warn: Re>=2300&&Re<4000 },
        { label: 'Darcy Friction Factor f', value: fN(f,5,''),      warn: false },
        { label: 'Head Loss hf',        value: fN(hf,3,'m'),        warn: !hfOK },
        { label: 'Head Loss Check',     value: hfOK ? '✓ hf ≤ limit' : '✗ Exceeds limit', warn: !hfOK },
        { label: 'Hydraulic Gradient',  value: fN(hf/L,5,'m/m'),    warn: false },
        { label: 'Velocity Head v²/2g', value: fN(vH,4,'m'),        warn: false },
        { label: 'Flow Area A',         value: fN(Ap*1e4,2,'cm²'),  warn: false },
        { label: 'Mass Flow ṁ',         value: fN(fl.rho*Q_m3s,3,'kg/s'), warn: false },
      ]
    };

  } else { // gravity/manning
    const S = parseFloat(p.S), n = parseFloat(p.n);
    const shape = p.shape;
    let width = toM(parseFloat(p.width)||0, p.L_u);
    let depth = toM(parseFloat(p.depth)||0, p.L_u);
    const z   = parseFloat(p.z)||0;
    let Q_des_ls = toLS(parseFloat(p.Q_des)||0, p.Q_u);
    if (S<=0) throw new Error('Slope S must be > 0');
    if (n<=0) throw new Error('Manning n must be > 0');
    const g=9.81;
    let A_full,P_wet,R_h,v_full,Q_full,y_eff;
    if (shape==='circ') {
      A_full=Math.PI*D*D/4; P_wet=Math.PI*D; R_h=D/4;
      v_full=(1/n)*Math.pow(R_h,2/3)*Math.pow(S,0.5); Q_full=A_full*v_full; y_eff=D;
    } else if (shape==='rect') {
      if(width<=0||depth<=0) throw new Error('Width and depth must be > 0');
      A_full=width*depth; P_wet=width+2*depth; R_h=A_full/P_wet;
      v_full=(1/n)*Math.pow(R_h,2/3)*Math.pow(S,0.5); Q_full=A_full*v_full; y_eff=depth;
    } else {
      if(width<=0||depth<=0) throw new Error('Width and depth must be > 0');
      A_full=(width+z*depth)*depth; P_wet=width+2*depth*Math.sqrt(1+z*z); R_h=A_full/P_wet;
      v_full=(1/n)*Math.pow(R_h,2/3)*Math.pow(S,0.5); Q_full=A_full*v_full; y_eff=depth;
    }
    const Q_des = Q_des_ls/1000;
    const capOK = Q_full >= Q_des;
    const S_min = Math.pow(0.6*n/Math.pow(R_h,2/3),2);
    const Fr    = v_full/Math.sqrt(g*y_eff);
    const frLabel = Fr<1?'Subcritical':Fr>1?'Supercritical':'Critical';
    const warns = [];
    if (!capOK) warns.push('⚠ Full-flow capacity insufficient — increase D, slope, or reduce n');
    if (v_full < 0.6) warns.push('⚠ v < 0.6 m/s — below self-cleaning velocity');

    return {
      status: capOK ? 'PASS' : 'WARN',
      warns,
      summary: `Gravity | D=${fN(D_mm,0)} mm | S=${fN(S,5)} | n=${fN(n,4)} | Q_full=${fN(Q_full*1000,2)} L/s`,
      results: [
        { label: 'Full-Flow Capacity Q', value: fN(Q_full*1000,3,'L/s'), warn: !capOK },
        { label: 'Capacity Check',       value: capOK ? '✓ Q_full ≥ Q_design' : '✗ Insufficient capacity', warn: !capOK },
        { label: 'Full-Flow Velocity v', value: fN(v_full,3,'m/s'),      warn: v_full<0.6 },
        { label: 'Hydraulic Radius R',   value: fN(R_h,4,'m'),           warn: false },
        { label: 'Flow Area A',          value: fN(A_full,4,'m²'),        warn: false },
        { label: 'Wetted Perimeter P',   value: fN(P_wet,3,'m'),          warn: false },
        { label: 'Min Slope (v=0.6m/s)', value: fN(S_min,5,'m/m'),       warn: false },
        { label: 'Froude Number Fr',     value: fN(Fr,3) + ' (' + frLabel + ')', warn: Fr>1 },
      ]
    };
  }
}

// ── CALC: RETAINING WALL ──────────────────────────────────────
function calcRetWall(p) {
  let H     = toM(parseFloat(p.H), p.L_u);
  let B     = toM(parseFloat(p.B), p.L_u);
  let stem  = toM(parseFloat(p.stem), p.L_u);
  let base  = toM(parseFloat(p.base), p.L_u);
  let gamma  = toKNm3(parseFloat(p.gamma), p.g_u);
  let gammaC = toKNm3(parseFloat(p.gammaC), p.g_u);
  let q   = toKPa(parseFloat(p.q)||0,   p.q_u);
  let qa  = toKPa(parseFloat(p.qa),      p.q_u);
  const phi = parseFloat(p.phi) * Math.PI/180;
  const mu  = parseFloat(p.mu);

  if (H<=0)    throw new Error('Wall height H must be > 0');
  if (B<=0)    throw new Error('Base width B must be > 0');
  if (stem<=0) throw new Error('Stem thickness must be > 0');
  if (base<=0) throw new Error('Base thickness must be > 0');
  if (base>=H) throw new Error('Base thickness must be less than wall height H');
  if (stem>=B) throw new Error('Stem thickness must be less than base width B');

  const Hs     = H-base;
  const Ka     = Math.pow(Math.tan(Math.PI/4-phi/2),2);
  const Kp     = Math.pow(Math.tan(Math.PI/4+phi/2),2);
  const Pa_soil  = 0.5*gamma*H*H*Ka;
  const Pa_surch = q*H*Ka;
  const Pa       = Pa_soil + Pa_surch;
  const Mo = Pa_soil*(H/3) + Pa_surch*(H/2);
  const W_stem = gammaC*stem*Hs, W_base = gammaC*B*base, W_soil = gamma*(B-stem)*Hs;
  const W  = W_stem + W_base + W_soil;
  const Mr = W_stem*(stem/2) + W_base*(B/2) + W_soil*(stem+(B-stem)/2);
  const FSOvt = Mr/Mo, FSsl = mu*W/Pa;
  const e  = B/2 - (Mr-Mo)/W;
  const q_max = (W/B)*(1+6*e/B), q_min = (W/B)*(1-6*e/B);
  const otOK = FSOvt>=1.5, slOK = FSsl>=1.5, qOK = q_max<=qa;
  const allOK = otOK && slOK && qOK;
  const warns = [];
  if (!otOK) warns.push('⚠ Overturning FS=' + FSOvt.toFixed(2) + ' < 1.5 — redesign required');
  if (!slOK) warns.push('⚠ Sliding FS=' + FSsl.toFixed(2) + ' < 1.5 — add shear key or increase base');
  if (!qOK)  warns.push('⚠ Foundation pressure q_max exceeds allowable bearing capacity');

  return {
    status: allOK ? 'PASS' : 'WARN',
    warns,
    summary: `H=${fN(H,2)}m | B=${fN(B,2)}m | Ka=${fN(Ka,4)} | FSOvt=${fN(FSOvt,2)} | FSsl=${fN(FSsl,2)}`,
    results: [
      { label: 'Active Pressure Ka',     value: fN(Ka,4),                warn: false },
      { label: 'Passive Pressure Kp',    value: fN(Kp,4),                warn: false },
      { label: 'Active Force Pa',        value: fN(Pa,2,'kN/m'),         warn: false },
      { label: 'Vertical Load W',        value: fN(W,2,'kN/m'),          warn: false },
      { label: 'Overturning Moment Mo',  value: fN(Mo,2,'kN·m/m'),       warn: false },
      { label: 'Stabilising Moment Mr',  value: fN(Mr,2,'kN·m/m'),       warn: false },
      { label: 'FS Overturning (≥1.5)',  value: fN(FSOvt,2) + (otOK?' ✓ OK':' ✗ Fails'), warn: !otOK },
      { label: 'FS Sliding (≥1.5)',      value: fN(FSsl,2)  + (slOK?' ✓ OK':' ✗ Fails — add shear key'), warn: !slOK },
      { label: 'Eccentricity e',         value: fN(e,3,'m'),              warn: e>B/6 },
      { label: 'Max Foundation Pressure',value: fN(q_max,2,'kN/m²'),     warn: !qOK },
      { label: 'Min Foundation Pressure',value: fN(q_min,2,'kN/m²'),     warn: q_min<0 },
      { label: 'Bearing Check',          value: qOK ? '✓ q_max ≤ qa' : '✗ Exceeds qa=' + qa.toFixed(0) + ' kN/m²', warn: !qOK },
    ]
  };
}

// ── CALC: EARTHWORK ───────────────────────────────────────────
function calcEarth(p) {
  const method = p.method;
  let A1 = toM2(parseFloat(p.A1), p.A_u);
  let A2 = toM2(parseFloat(p.A2), p.A_u);
  let Am = toM2(parseFloat(p.Am)||0, p.A_u);
  let L  = toM(parseFloat(p.L),   p.L_u);
  const sw    = parseFloat(p.sw)/100;
  const sh    = parseFloat(p.sh)/100;
  const densB = parseFloat(p.densB);
  const densL = parseFloat(p.densL);
  const truck = parseFloat(p.truck);

  if (A1<0||A2<0)        throw new Error('Cross-section areas must be ≥ 0');
  if (L<=0)              throw new Error('Distance L must be > 0');
  if (densB<=0||densL<=0) throw new Error('Densities must be > 0');
  if (truck<=0)          throw new Error('Truck capacity must be > 0');

  const Vavg  = L*(A1+A2)/2;
  const Vprism= method==='prism' ? L*(A1+4*Am+A2)/6 : Vavg;
  const Vb=Vprism, Vl=Vb*(1+sw), Vc=Vb*(1-sh);
  const mass=Vb*densB, trucks=Math.ceil(Vl/truck), LF=densB/densL;
  const prismCorr = Vprism-Vavg;

  return {
    status: 'PASS',
    warns: [],
    summary: `Method: ${method} | Vbank=${fN(Vb,2)} m³ | Loose=${fN(Vl,2)} m³ | Trucks=${trucks}`,
    results: [
      { label: 'Bank Volume',           value: fN(Vb,2,'m³'),             warn: false },
      { label: 'Loose Volume',          value: fN(Vl,2,'m³'),             warn: false },
      { label: 'Compacted Volume',      value: fN(Vc,2,'m³'),             warn: false },
      { label: 'Mass of Material',      value: fN(mass,2,'t'),            warn: false },
      { label: 'Load Factor (Bank/Loose)', value: fN(LF,3,''),            warn: false },
      { label: 'Truck Loads Required',  value: trucks + ' loads',          warn: false },
      { label: 'Prismoidal Correction', value: method==='prism' ? fN(prismCorr,3,'m³') : 'N/A (avg end area)', warn: false },
    ]
  };
}

// ── CALC: SURVEYING & ROAD GEOMETRY ──────────────────────────
function calcSurvey(p) {
  let R   = toM(parseFloat(p.R),   p.L_u);
  const delta_deg = parseFloat(p.delta_deg);
  const delta = delta_deg * Math.PI/180;
  let V   = toKmh(parseFloat(p.V), p.V_u);
  const e = parseFloat(p.e)/100;
  const f_fr = parseFloat(p.f_fr);
  let SSD = toM(parseFloat(p.SSD), p.L_u);
  const G1 = parseFloat(p.G1), G2 = parseFloat(p.G2);

  if (R<=0)         throw new Error('Radius R must be > 0');
  if (delta_deg<=0) throw new Error('Deflection angle must be > 0');
  if (V<=0)         throw new Error('Design speed must be > 0');
  if (SSD<=0)       throw new Error('SSD must be > 0');

  const Lc    = R*delta;
  const T     = R*Math.tan(delta/2);
  const M_ord = R*(1-Math.cos(delta/2));
  const E_ext = R*(1/Math.cos(delta/2)-1);
  const chord = 2*R*Math.sin(delta/2);
  const DC    = 180*20/(Math.PI*R);
  const Rmin  = V*V/(127*(e+f_fr));
  const RminOK= R >= Rmin;
  const A_grade = Math.abs(G1-G2);
  const VCL_crest = A_grade>0 ? A_grade*SSD*SSD/658 : 0;
  const VCL_sag   = A_grade>0 ? (A_grade*SSD/3.5+SSD) : 0;
  const VCL = G2<G1 ? VCL_crest : VCL_sag;
  const RC  = VCL>0 ? A_grade*1000/VCL : 0;
  const warns = [];
  if (!RminOK) warns.push('⚠ R=' + fN(R,1) + ' m < Rmin=' + fN(Rmin,1) + ' m for V=' + fN(V,0) + ' km/h — unsafe speed');

  return {
    status: RminOK ? 'PASS' : 'WARN',
    warns,
    summary: `R=${fN(R,1)}m | Δ=${fN(delta_deg,2)}° | V=${fN(V,0)}km/h | Lc=${fN(Lc,2)}m`,
    results: [
      { label: 'Curve Length Lc',       value: fN(Lc,2,'m'),   warn: false },
      { label: 'Tangent Length T',      value: fN(T,2,'m'),    warn: false },
      { label: 'Mid-Ordinate M',        value: fN(M_ord,3,'m'),warn: false },
      { label: 'External Distance E',   value: fN(E_ext,3,'m'),warn: false },
      { label: 'Chord Length C',        value: fN(chord,3,'m'),warn: false },
      { label: 'Degree of Curvature',   value: fN(DC,4,'°'),   warn: false },
      { label: 'Min Radius Rmin',       value: fN(Rmin,1,'m'), warn: !RminOK },
      { label: 'Speed Check R ≥ Rmin',  value: RminOK ? '✓ R ≥ Rmin — safe' : '✗ R < Rmin — unsafe', warn: !RminOK },
      { label: 'Grade Difference A',    value: fN(A_grade,3,'%'), warn: false },
      { label: 'Vertical Curve Length', value: fN(VCL,1,'m'),  warn: false },
      { label: 'Rate of Change RC',     value: fN(RC,4,'%/m'), warn: false },
    ]
  };
}

async function handle_civil_engineering(body, res) {
  const { calc, params: p } = body || {};
  if (!calc || !p)
    return res.status(400).json({ error: 'Missing calc or params in request body' });
  try {
    let result;
    switch (calc) {
      case 'beam':    result = calcBeam(p);    break;
      case 'col':     result = calcCol(p);     break;
      case 'footing': result = calcFooting(p); break;
      case 'conc':    result = calcConc(p);    break;
      case 'steel':   result = calcSteel(p);   break;
      case 'pipe':    result = calcPipe(p);    break;
      case 'retwall': result = calcRetWall(p); break;
      case 'earth':   result = calcEarth(p);   break;
      case 'survey':  result = calcSurvey(p);  break;
      default:
        return res.status(400).json({ error: 'Unknown calc type: ' + calc });
    }
    return res.status(200).json(result);
  } catch(err) {
    return res.status(422).json({ error: err.message });
  }
}





// ================================================================

// ════════════════════════════════════════════════════════════════════════════
// Vercel handler — dispatches to handle_civil_engineering
// ════════════════════════════════════════════════════════════════════════════
async function civil_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = req.method === 'POST' ? req.body : {};
  if (req.method === 'POST' && (!body || typeof body !== 'object'))
    return res.status(400).json({ error: 'Invalid request body.' });

  try {
    return await handle_civil_engineering(body, res);
  } catch (e) {
    console.error('[civil-engineering-calculators.js] Unhandled error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

// ── End of Section 17: Civil Engineering Calculators ──────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION 18 of 21  ►  INSTRUMENTATION CALCULATORS
// Route: /api/instrumentation-calculators
// Source: instrumentation-calculators.js
// ══════════════════════════════════════════════════════════════════════════════

// INSTRUMENTATION CALCULATORS — 4-20mA, Thermowell, Loop, LLA
// ================================================================

/**
 * Vercel Serverless Function — /api/calculate
 * POST body: { tool: string, inputs: object }
 * Returns:   { ok: true, result: object } | { ok: false, error: string }
 *
 * AUDIT FIXES vs first draft:
 *  FIX-API-1  All numeric inputs coerced with Number() before isNaN checks.
 *  FIX-API-2  calcLoop: added txmin < supply guard (missing → negative maxLoad).
 *  FIX-API-3  calcThermowell: Re/fs/fn/mu returned as formatted strings so
 *             exponential notation is preserved for display on client.
 *  FIX-API-4  calcSqrt: cutoff clamped 0–100; dp===cutoff treated as above
 *             cutoff (flow shown) consistent with hysteresis semantics.
 *  FIX-API-5  awgToMm2: explicit guard for AWG ≤ 0.
 *  FIX-API-6  calcLLA: maxLoad_diag added to return object (was computed
 *             but not returned, silently omitting limit from warn message).
 *  FIX-API-7  calcThermowell: validation BEFORE unit conversion.
 *  FIX-API-8  OPTIONS preflight returns 204 (correct), not 200.
 *  FIX-API-9  calcLoop: 22 mA diagnostic check added (was only in LLA).
 */
// FIX-API-1: coerce to Number, NaN stays NaN
function instr_n(val) { const v = Number(val); return isNaN(v) ? NaN : v; }

/* ── NAMUR NE43 ── */
function namurZone(mA) {
  if (mA < 3.6)   return { zone:'FAIL_LOW',   label:'🔴 NAMUR FAIL – Low (< 3.6 mA)',      color:'red',    isValid:false, isFault:true  };
  if (mA < 3.8)   return { zone:'WARN_LOW',   label:'🟠 NAMUR FAULT – Low (3.6–3.8 mA)',   color:'orange', isValid:false, isFault:true  };
  if (mA < 4.0)   return { zone:'BURNOUT_LO', label:'⚠ Below live-zero (3.8–4.0 mA)',      color:'orange', isValid:false, isFault:true  };
  if (mA <= 20.0) return { zone:'VALID',      label:'✅ Valid 4–20 mA signal',              color:'green',  isValid:true,  isFault:false };
  if (mA <= 21.0) return { zone:'BURNOUT_HI', label:'🟠 NAMUR FAULT – High (20–21 mA)',    color:'orange', isValid:false, isFault:true  };
  return           { zone:'FAIL_HIGH',  label:'🔴 NAMUR FAIL – High (> 21 mA)',      color:'red',    isValid:false, isFault:true  };
}

/* ── SIGNAL ── */
function calcSignal(raw) {
  const v = instr_n(raw.v), mn = instr_n(raw.mn), mx = instr_n(raw.mx);
  const dir = String(raw.dir || 'ma2eu');
  if (isNaN(v))           throw new Error('Please enter an input value');
  if (isNaN(mn)||isNaN(mx)) throw new Error('Enter valid Range Min and Max');
  if (mn === mx)          throw new Error('Range Min and Max cannot be equal (zero span)');

  if (dir === 'ma2eu') {
    const nz = namurZone(v);
    if (nz.isFault) return { type:'fault', nz, mA:v };
    const result = mn + ((v - 4) / 16) * (mx - mn);
    return { type:'ma2eu', result:+result.toFixed(4), pct:+((v-4)/16*100).toFixed(1), span:+(mx-mn).toFixed(4), mA:v, mn, mx, nz };
  } else {
    const lo = Math.min(mn,mx), hi = Math.max(mn,mx);
    if (v < lo || v > hi) throw new Error(`Value must be within range [${lo} … ${hi}]`);
    const result = 4 + ((v - mn) / (mx - mn)) * 16;
    return { type:'eu2ma', result:+result.toFixed(4), pct:+((result-4)/16*100).toFixed(1), eu:v, mn, mx, nz:namurZone(result) };
  }
}

/* ── SQRT ── FIX-API-4 */
function calcSqrt(raw) {
  const dp = instr_n(raw.dp), qmax = instr_n(raw.qmax);
  const funit = String(raw.funit || 'm3h');
  let cutoff = instr_n(raw.cutoff);
  if (isNaN(cutoff) || cutoff < 0) cutoff = 1;
  if (cutoff > 100) cutoff = 100;

  if (isNaN(dp) || dp < 0 || dp > 100) throw new Error('DP% must be 0 – 100');
  if (isNaN(qmax) || qmax <= 0)        throw new Error('Enter a valid Max Flow span (> 0)');

  const hysteresisHigh = +(cutoff + 0.5).toFixed(1);
  if (dp < cutoff) {
    return { cutoffActive:true, flow:0, dp, qmax, cutoff, hysteresisHigh, funit };
  }
  const flow = qmax * Math.sqrt(dp / 100);
  return {
    cutoffActive:false,
    flow:+flow.toFixed(4), sqrtVal:+Math.sqrt(dp/100).toFixed(5),
    pct:+(flow/qmax*100).toFixed(2), dp, qmax, cutoff, hysteresisHigh, funit
  };
}

/* ── LOOP ── FIX-API-2, FIX-API-5, FIX-API-9 */
const AWG_TABLE = {10:5.261,12:3.309,14:2.081,16:1.309,18:0.8231,20:0.5176,22:0.3255,24:0.2047,26:0.1288,28:0.0810};

function awgToMm2(awg) {
  if (awg <= 0) throw new Error('AWG value must be > 0'); // FIX-API-5
  const a = Math.round(awg);
  if (AWG_TABLE[a]) return AWG_TABLE[a];
  const d_in = 0.005 * Math.pow(92, (36 - awg) / 39);
  const d_mm = d_in * 25.4;
  return (Math.PI / 4) * d_mm * d_mm;
}

function calcLoop(raw) {
  let len = instr_n(raw.len);
  const lenU = String(raw.lenU || 'm');
  let csaRaw = instr_n(raw.csaRaw);
  const csaU = String(raw.csaU || 'mm2');
  const supply = instr_n(raw.supply), txmin = instr_n(raw.txmin), load = instr_n(raw.load);
  const cableTemp = instr_n(raw.cableTemp);

  if ([len,csaRaw,supply,txmin,load].some(isNaN)) throw new Error('Fill all fields');
  if (len    <= 0) throw new Error('Cable length must be > 0');
  if (csaRaw <= 0) throw new Error('Cable cross-section must be > 0');
  if (supply <= 0) throw new Error('Supply voltage must be > 0');
  if (txmin  <= 0) throw new Error('Transmitter min voltage must be > 0');
  if (load   <  0) throw new Error('Loop burden cannot be negative');
  if (txmin >= supply) throw new Error('Transmitter min voltage must be less than supply voltage'); // FIX-API-2

  if (lenU === 'km') len *= 1000; else if (lenU === 'ft') len *= 0.3048;
  const csa = csaU === 'awg' ? awgToMm2(csaRaw) : csaRaw;

  const rho_cu_20 = 0.0168;
  const T = isNaN(cableTemp) ? 20 : cableTemp;
  const alpha = 0.00393;
  const rho_cu = rho_cu_20 * (1 + alpha * (T - 20));
  const cable_r = rho_cu * (2 * len) / csa;

  const total_r     = load + cable_r;
  const vDrop_cable = cable_r * 0.020;
  const vDrop_load  = load    * 0.020;
  const vAtTx       = supply - vDrop_cable - vDrop_load;
  const headroom    = vAtTx  - txmin;
  const maxLoad     = (supply - txmin) / 0.020;
  const loadUsed    = (total_r / maxLoad * 100).toFixed(1);
  const vRequired_safe = txmin * 1.3 + total_r * 0.020;

  // FIX-API-9: 22 mA diagnostic check (was missing from loop calc)
  const vAtTx_diag    = supply - (total_r * 0.022);
  const headroom_diag = vAtTx_diag - txmin;

  const warns = [];
  if (headroom < 0) warns.push(`🚨 FAIL — Tx voltage at 20 mA is ${vAtTx.toFixed(2)} V, below minimum ${txmin} V. Reduce cable length, increase CSA, or reduce burden.`);
  else if (headroom < 2) warns.push(`⚠ WARNING — Headroom only ${headroom.toFixed(2)} V. Marginal — consider increasing supply or reducing load.`);
  if (supply < vRequired_safe) warns.push(`⚠ SAFETY MARGIN — Industrial practice requires supply ≥ 1.3 × V_tx_min + loop drop = ${vRequired_safe.toFixed(2)} V. Current supply (${supply} V) is below this threshold.`);
  if (headroom_diag < 0) warns.push(`🚨 DIAGNOSTIC OVERLOAD — At 22 mA (HART diagnostic peak), Tx sees ${vAtTx_diag.toFixed(2)} V, below minimum ${txmin} V. Loop will collapse during diagnostics.`);
  else if (headroom_diag < 1) warns.push(`⚠ MARGINAL AT 22 mA — Headroom during HART diagnostic is only ${headroom_diag.toFixed(2)} V. Verify transmitter diagnostic current spec.`);
  if (T !== 20) warns.push(`ℹ Cable R corrected to ${T}°C: ρ = ${rho_cu.toFixed(5)} Ω·mm²/m (vs 0.0168 at 20°C, Δ${((rho_cu/rho_cu_20-1)*100).toFixed(1)}%)`);
  if (T > 100)  warns.push(`⚠ HIGH TEMPERATURE — Linear α correction (R_T = R₂₀[1 + α(T−20)]) becomes increasingly inaccurate above 100°C. Error may reach 2–5% at 200°C.`);

  return {
    cable_r:        +cable_r.toFixed(3),
    total_r:        +total_r.toFixed(3),
    vDrop_cable:    +vDrop_cable.toFixed(3),
    vDrop_load:     +vDrop_load.toFixed(3),
    vAtTx:          +vAtTx.toFixed(3),
    headroom:       +headroom.toFixed(3),
    headroom_diag:  +headroom_diag.toFixed(3),
    maxLoad:        +maxLoad.toFixed(1),
    loadUsed,
    vRequired_safe: +vRequired_safe.toFixed(2),
    rho_cu:         +rho_cu.toFixed(5),
    csa:            +csa.toFixed(3),
    T, csaU,
    csaRaw_rounded: Math.round(csaRaw),
    pass20mA: headroom >= 0,
    pass22mA: headroom_diag >= 0,
    warns
  };
}

/* ── THERMOWELL ── FIX-API-3, FIX-API-7 */
function strouhalFromRe(Re) {
  if (Re < 1000)   return { St:0.21, regime:'Sub-critical (Re < 10³)' };
  if (Re < 200000) return { St:0.22, regime:'Subcritical (10³ ≤ Re < 2×10⁵)' };
  if (Re < 500000) return { St:0.19, regime:'Critical / drag-crisis (2×10⁵ ≤ Re < 5×10⁵)' };
  return            { St:0.27, regime:'Supercritical (Re ≥ 5×10⁵)' };
}
function estimateMu(fluid, rho) {
  if (fluid === 'liquid') return 0.001;
  if (fluid === 'gas')    return 1.8e-5;
  return rho > 100 ? 0.001 : 1.8e-5;
}

function calcThermowell(raw) {
  // FIX-API-7: validate BEFORE unit conversion
  const U_raw   = instr_n(raw.U),  d_raw = instr_n(raw.d), vel_raw = instr_n(raw.vel);
  const lenU    = String(raw.lenU  || 'mm');
  const odU     = String(raw.odU   || 'mm');
  const velU    = String(raw.velU  || 'ms');
  const fluid   = String(raw.fluid || 'liquid');
  let rho       = instr_n(raw.rho);

  if (isNaN(U_raw)||isNaN(d_raw)||isNaN(vel_raw)) throw new Error('Fill insertion length, tip OD and velocity');
  if (U_raw   <= 0) throw new Error('Insertion length must be > 0');
  if (d_raw   <= 0) throw new Error('Tip OD must be > 0');
  if (vel_raw <= 0) throw new Error('Velocity must be > 0');

  let U = U_raw, d = d_raw, vel = vel_raw;
  if (lenU === 'mm') U /= 1000; else if (lenU === 'in') U *= 0.0254;
  if (odU  === 'mm') d /= 1000; else if (odU  === 'in') d *= 0.0254;
  if (velU === 'fts') vel *= 0.3048;

  let densityNote = '';
  if (fluid === 'liquid' && (isNaN(rho)||rho<=0)) {
    rho = 1000; densityNote = 'Liquid: default ρ = 1000 kg/m³ (water). For hydrocarbons or oils enter Custom density.';
  } else if (fluid === 'gas' && (isNaN(rho)||rho<=0)) {
    rho = 10;   densityNote = 'Gas: default ρ = 10 kg/m³. ⚠ Rough estimate — actual density depends heavily on P and T. Enter Custom density for accurate results.';
  } else if (fluid === 'custom' && (isNaN(rho)||rho<=0)) {
    throw new Error('Enter custom fluid density');
  }

  const mu = estimateMu(fluid, rho);
  const Re = (rho * vel * d) / mu;
  const { St, regime } = strouhalFromRe(Re);
  const fs = St * vel / d;

  const E = 193e9, rho_mat = 7950;
  const r = d / 2;
  const I = (Math.PI * Math.pow(r, 4)) / 4;
  const A = Math.PI * r * r;
  const fn = (3.52 / (2 * Math.PI * U * U)) * Math.sqrt((E * I) / (rho_mat * A));
  const fr = fs / fn;

  let status, statusLevel;
  if (fr < 0.6)      { status = '✅ ACCEPTABLE (f_s/f_n < 0.6)';               statusLevel = 'ok';   }
  else if (fr < 0.8) { status = '⚠ MARGINAL (0.6 ≤ f_s/f_n < 0.8)';          statusLevel = 'warn'; }
  else               { status = '🚨 CRITICAL — Resonance risk (f_s/f_n ≥ 0.8)'; statusLevel = 'fail'; }

  const warns = [];
  if (fr >= 0.8) warns.push(`🚨 Frequency ratio ${fr.toFixed(3)} ≥ 0.8. HIGH RESONANCE RISK — shorten U, increase tip OD d, or reduce process velocity.`);
  else if (fr >= 0.6) warns.push(`⚠ Ratio ${fr.toFixed(3)} is marginal (0.6–0.8). Perform full ASME PTC 19.3 TW detailed calculation before finalising design.`);
  if (densityNote) warns.push(`ℹ Density note: ${densityNote}`);
  warns.push(`ℹ Reynolds regime: ${regime} → St = ${St} (Reynolds-corrected). Re = ${Re.toExponential(2)}.`);
  warns.push(`ℹ Scruton number (Sc = 2mδ/ρd²) requires structural damping data — cannot be calculated here. Perform full ASME PTC 19.3 TW for final design sign-off.`);
  warns.push(`ℹ Solid uniform 316SS rod assumed. Tapered/stepped geometry, support compliance and fluid damping not modelled — simplified first-pass only.`);

  // FIX-API-3: return pre-formatted strings for scientific notation values
  return {
    Re_str:    Re.toExponential(3),
    St, regime,
    fs_str:    fs.toFixed(3),
    fn_str:    fn.toFixed(3),
    fr_str:    fr.toFixed(4),
    fr_num:    fr,
    status, statusLevel,
    U_mm:      +(U * 1000).toFixed(1),
    d_mm:      +(d * 1000).toFixed(2),
    vel_ms:    +vel.toFixed(3),
    rho,
    mu_str:    mu.toExponential(2),
    I_e10_str: (I * 1e10).toFixed(4),
    warns
  };
}

/* ── LLA ── FIX-API-6 */
function calcLLA(raw) {
  const supply  = instr_n(raw.supply),  txmin = instr_n(raw.txmin);
  const ai      = isNaN(instr_n(raw.ai))      ? 0 : Math.max(0, instr_n(raw.ai));
  const iso     = isNaN(instr_n(raw.iso))     ? 0 : Math.max(0, instr_n(raw.iso));
  const barrier = isNaN(instr_n(raw.barrier)) ? 0 : Math.max(0, instr_n(raw.barrier));
  const cable   = isNaN(instr_n(raw.cable))   ? 0 : Math.max(0, instr_n(raw.cable));
  const other   = isNaN(instr_n(raw.other))   ? 0 : Math.max(0, instr_n(raw.other));

  if (isNaN(supply)||isNaN(txmin)) throw new Error('Enter supply and Tx min voltages');
  if (supply <= 0)    throw new Error('Supply voltage must be > 0');
  if (txmin  <= 0)    throw new Error('Transmitter min voltage must be > 0');
  if (txmin >= supply) throw new Error('Tx min voltage must be less than supply voltage');

  const total          = ai + iso + barrier + cable + other;
  const maxLoad        = (supply - txmin) / 0.020;
  const vDrop          = total * 0.020;
  const vRequired      = txmin + 0.020 * total;
  const vRequired_safe = 1.3 * txmin + 0.020 * total;
  const vAtTx          = supply - vDrop;
  const headroom       = vAtTx - txmin;
  const usedPct        = (total / maxLoad * 100).toFixed(1);

  const I_DIAG        = 0.022;
  const vAtTx_diag    = supply - (total * I_DIAG);
  const headroom_diag = vAtTx_diag - txmin;
  const maxLoad_diag  = (supply - txmin) / I_DIAG; // FIX-API-6

  const warns = [];
  if (headroom < 0) warns.push(`🚨 FAIL @ 20 mA — Total load (${total.toFixed(1)} Ω) exceeds max allowable (${maxLoad.toFixed(1)} Ω). Transmitter cannot be powered at full-scale output.`);
  else if (parseFloat(usedPct) > 80) warns.push(`⚠ Load is at ${usedPct}% of maximum at 20 mA. Marginal headroom — review cable lengths and additional loads.`);
  if (supply < vRequired_safe) warns.push(`⚠ SAFETY MARGIN — Industrial practice: supply ≥ 1.3 × V_tx_min + loop drop = ${vRequired_safe.toFixed(2)} V. Current supply (${supply} V) is below this threshold.`);
  if (headroom_diag < 0) warns.push(`🚨 DIAGNOSTIC OVERLOAD — At 22 mA (smart transmitter diagnostic peak), headroom is ${headroom_diag.toFixed(3)} V. Loop will collapse during HART diagnostics. Reduce total impedance below ${maxLoad_diag.toFixed(0)} Ω.`);
  else if (headroom_diag < 1) warns.push(`⚠ MARGINAL AT 22 mA — Smart transmitters may output up to 22–24 mA during HART diagnostics. Headroom at 22 mA is only ${headroom_diag.toFixed(3)} V. Verify transmitter diagnostic current specification.`);

  return {
    total:           +total.toFixed(2),
    maxLoad:         +maxLoad.toFixed(1),
    maxLoad_diag:    +maxLoad_diag.toFixed(0), // FIX-API-6
    vDrop:           +vDrop.toFixed(3),
    vRequired:       +vRequired.toFixed(3),
    vRequired_safe:  +vRequired_safe.toFixed(3),
    vAtTx:           +vAtTx.toFixed(3),
    headroom:        +headroom.toFixed(3),
    headroom_diag:   +headroom_diag.toFixed(3),
    usedPct,
    pass20mA:  headroom >= 0,
    pass22mA:  headroom_diag >= 0,
    ai, iso, barrier, cable, other,
    warns
  };
}

// ========================================================================
// SECTION: INSTRUMENTATION
// ========================================================================

async function handle_instrumentation(body, res) {
  const { tool, inputs } = body || {};
  if (!tool)   return res.status(400).json({ ok: false, error: 'Missing tool' });
  if (!inputs) return res.status(400).json({ ok: false, error: 'Missing inputs' });
  try {
    let result;
    switch (tool) {
      case 'signal':     result = calcSignal(inputs);     break;
      case 'sqrt':       result = calcSqrt(inputs);       break;
      case 'loop':       result = calcLoop(inputs);       break;
      case 'thermowell': result = calcThermowell(inputs); break;
      case 'lla':        result = calcLLA(inputs);        break;
      default: return res.status(400).json({ ok: false, error: `Unknown tool: ${tool}` });
    }
    return res.status(200).json({ ok: true, result });
  } catch(e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}


// ================================================================

// ════════════════════════════════════════════════════════════════════════════
// Vercel handler — dispatches to handle_instrumentation
// ════════════════════════════════════════════════════════════════════════════
async function instrumentation_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = req.method === 'POST' ? req.body : {};
  if (req.method === 'POST' && (!body || typeof body !== 'object'))
    return res.status(400).json({ error: 'Invalid request body.' });

  try {
    return await handle_instrumentation(body, res);
  } catch (e) {
    console.error('[instrumentation-calculators.js] Unhandled error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

// ── End of Section 18: Instrumentation Calculators ──────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION 19 of 21  ►  ELECTRICAL ENGINEERING CALCULATORS
// Route: /api/electrical-engineering-calculators
// Source: electrical-engineering-calculators.js
// ══════════════════════════════════════════════════════════════════════════════

// ELECTRICAL ENGINEERING CALCULATORS — Ohm, Cable, Motor, VD, etc.
// ================================================================

/**
 * /api/calculate.js  — Vercel Serverless Function
 * Handles all secure electrical engineering calculations.
 * Called by the client-side index.html via POST /api/calculate
 *
 * Body: { calc: "<name>", inputs: { ...fields } }
 * Response: { ok: true, results: { ...outputs } }  |  { ok: false, error: "..." }
 */

// ─── tiny helpers (same logic as the original HTML) ─────────────────────────
const elec_fN = (v, d) => (v !== null && v !== undefined && isFinite(v) ? +v.toFixed(d) : null);
const consistent = (a, b, ratio) => Math.abs(ratio - 1) < 0.02;

// Lookup: cable reactance by voltage level
// Keys match the HTML <select> option values exactly (cbVLevel / vdVLevel)
const CABLE_X_TABLE = {
  lv_trefoil: { x: 0.080e-3, label: "LV Trefoil/touching ≤1 kV",      note: "0.08 mΩ/m typical — IEC 60228. ±15% vs actual datasheet." },
  lv_flat:    { x: 0.100e-3, label: "LV Flat formation ≤1 kV",         note: "0.10 mΩ/m — flat-laid LV cables. Verify with manufacturer." },
  mv_close:   { x: 0.100e-3, label: "MV touching trefoil 1–36 kV",     note: "0.10 mΩ/m — ⚠ Use manufacturer datasheet for MV project work." },
  mv_1d:      { x: 0.130e-3, label: "MV spacing 1× dia. 1–36 kV",      note: "0.13 mΩ/m — ⚠ Verify with manufacturer data." },
  mv_2d:      { x: 0.170e-3, label: "MV spacing 2× dia. 1–36 kV",      note: "0.17 mΩ/m — ⚠ ±30–50% error possible. Use datasheet." },
  mv_3d:      { x: 0.200e-3, label: "MV spacing 3× dia. 1–36 kV",      note: "0.20 mΩ/m — ⚠ Broad estimate. Datasheet required." },
  hv:         { x: 0.300e-3, label: "HV XLPE >33 kV",                  note: "⛔ HV: estimate only. Use IEC 60287 software for design." },
};
function getCableX(vLevel) {
  return CABLE_X_TABLE[vLevel] || CABLE_X_TABLE["lv_trefoil"];
}

// Standard breaker sizes
const BRK_STD = [6,10,13,16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,500,630,800,1000,1250,1600,2000,2500,3200,4000];
function nextBrk(i) { return BRK_STD.find(b => b >= i) || Math.ceil(i); }

// ─── Calculator implementations ─────────────────────────────────────────────

function calcOhm({ V, I, R, P, oRs, oRp }) {
  // Parse inputs — treat empty/undefined as NaN, allow 0 for R (short circuit)
  let v = parseFloat(V), i = parseFloat(I), r = parseFloat(R), p = parseFloat(P);

  // Validate ranges for filled fields
  if (isFinite(v) && v < 0)  return { error: "Voltage V must be ≥ 0." };
  if (isFinite(i) && i < 0)  return { error: "Current I must be ≥ 0." };
  if (isFinite(r) && r < 0)  return { error: "Resistance R must be ≥ 0 (use 0 for short circuit)." };
  if (isFinite(p) && p < 0)  return { error: "Power P must be ≥ 0." };

  // Count defined (non-NaN, non-negative) inputs — include R=0
  const defined = [v, i, r, p].filter(x => isFinite(x) && x >= 0).length;
  if (defined < 2) return { error: "Enter at least 2 values (V, I, R, or P)." };

  // Overdetermined: 3+ fields — check mutual consistency (2% tolerance)
  if (defined > 2) {
    const tol = 0.02;
    const ok = (a, b) => b === 0 ? a === 0 : Math.abs(a / b - 1) < tol;
    const errs = [];
    if (isFinite(v) && isFinite(i) && isFinite(r)) {
      if (!ok(v, i * r)) errs.push("V ≠ I×R");
    }
    if (isFinite(v) && isFinite(i) && isFinite(p)) {
      if (!ok(p, v * i)) errs.push("P ≠ V×I");
    }
    if (isFinite(v) && isFinite(r) && isFinite(p) && r > 0) {
      if (!ok(p, v * v / r)) errs.push("P ≠ V²/R");
    }
    if (isFinite(i) && isFinite(r) && isFinite(p)) {
      if (!ok(p, i * i * r)) errs.push("P ≠ I²×R");
    }
    if (errs.length) return { error: "Overdetermined: " + errs.join(", ") + " (±2% tolerance). Clear one field." };
  }

  // Solve — pick first valid pair (handle R=0 for short-circuit)
  if (isFinite(v) && isFinite(i) && v >= 0 && i >= 0)          { r = i > 0 ? v / i : 0; p = v * i; }
  else if (isFinite(v) && isFinite(r) && v >= 0 && r > 0)      { i = v / r;              p = v * i; }
  else if (isFinite(i) && isFinite(r) && i >= 0 && r >= 0)     { v = i * r;              p = v * i; }
  else if (isFinite(r) && isFinite(p) && r > 0 && p >= 0)      { v = Math.sqrt(p * r);   i = v / r; }
  else if (isFinite(v) && isFinite(p) && v > 0 && p >= 0)      { i = p / v;              r = v / i; }
  else if (isFinite(i) && isFinite(p) && i > 0 && p >= 0)      { v = p / i;              r = v / i; }

  // Float guard: round to 10 sig-figs to kill floating-point noise
  const r10 = x => parseFloat(x.toPrecision(10));
  if (isFinite(v)) v = r10(v); if (isFinite(i)) i = r10(i);
  if (isFinite(r)) r = r10(r); if (isFinite(p)) p = r10(p);

  const G = (isFinite(r) && r > 0) ? 1 / r : null;
  const Ekwh = isFinite(p) ? p / 1000 : null;

  // Series / parallel resistor networks
  const parseList = str => (str || "").split(",").map(s => parseFloat(s.trim())).filter(x => isFinite(x) && x >= 0);
  const sr = parseList(oRs), pr = parseList(oRp);
  const Rs = sr.length ? parseFloat(sr.reduce((a, b) => a + b, 0).toPrecision(10)) : null;
  // Parallel: zero-resistance in parallel short-circuits the network → result = 0
  const hasZero = pr.some(x => x === 0);
  const Rp = pr.length ? (hasZero ? 0 : parseFloat((1 / pr.reduce((a, b) => a + 1 / b, 0)).toPrecision(10))) : null;

  return { V: elec_fN(v,4), I: elec_fN(i,6), R: elec_fN(r,6), P: elec_fN(p,4), G: elec_fN(G,6), Ekwh: elec_fN(Ekwh,6), Rs: elec_fN(Rs,4), Rp: elec_fN(Rp,4) };
}

function calcPower({ phase, VL, IL, PF, eff, loadType, hr, rate }) {
  phase = parseInt(phase) || 1;
  VL = parseFloat(VL); IL = parseFloat(IL); PF = parseFloat(PF);
  eff = parseFloat(eff); hr = parseFloat(hr) || 8760; rate = parseFloat(rate) || 0;
  if (!(VL > 0 && IL > 0 && PF > 0 && PF <= 1 && eff > 0 && eff <= 1))
    return { error: "Invalid inputs — check V, I, PF (0–1), efficiency (0–1)." };

  const S = phase === 3 ? Math.sqrt(3) * VL * IL : VL * IL;
  const Vphi = phase === 3 ? VL / Math.sqrt(3) : VL;
  const P = S * PF;
  const sinPhi = Math.sqrt(Math.max(0, 1 - PF * PF));
  const Q = S * sinPhi;
  const phi = Math.acos(Math.min(1, Math.max(-1, PF)));
  const Pin = P / eff;
  const phi2 = Math.acos(0.95);
  const Qc_var = P * (Math.tan(phi) - Math.tan(phi2));
  const energy = P * hr / 1000;
  const cost = energy * rate;

  return {
    S: elec_fN(S, 2), P: elec_fN(P, 2), Q: elec_fN(Q, 2),
    phi_deg: elec_fN(phi * 180 / Math.PI, 2),
    Vphi: elec_fN(Vphi, 2),
    Pin: elec_fN(Pin, 2),
    Qc_kvar: elec_fN(Math.max(0, Qc_var / 1000), 3),
    energy_kwh: elec_fN(energy, 1),
    cost: elec_fN(cost, 2),
    harmonic_warn: (Math.max(0, Qc_var / 1000) > 0 && PF < 0.85),
  };
}

function calcCable({ phase, I, V, L_m, PF, area_mm2, VDmax_pct, T_op, kT, kG, kI, material, vLevel }) {
  phase = parseInt(phase) || 3;
  I = parseFloat(I); V = parseFloat(V); L_m = parseFloat(L_m);
  PF = parseFloat(PF); area_mm2 = parseFloat(area_mm2);
  VDmax_pct = parseFloat(VDmax_pct) || 5;
  T_op = parseFloat(T_op) || 30;
  kT = parseFloat(kT) || 0.87; kG = parseFloat(kG) || 1.0; kI = parseFloat(kI) || 1.0;

  if (!(I > 0 && V > 0 && L_m > 0 && PF > 0 && PF <= 1 && area_mm2 > 0))
    return { error: "Invalid inputs." };

  const rho20 = material === "al" ? 2.82e-8 : 1.72e-8;
  const alpha = material === "al" ? 0.00403 : 0.00393;
  const rho_T = rho20 * (1 + alpha * (T_op - 20));
  const rm = rho_T * 1e6;  // Ω·mm²/m

  const cxData = getCableX(vLevel || "lv_trefoil");
  const X_mpm = cxData.x;

  const sinPF = Math.sqrt(Math.max(0, 1 - PF * PF));
  const Rc = rm * L_m / area_mm2;
  const Xc = X_mpm * L_m;
  const mult = phase === 3 ? Math.sqrt(3) : 2;
  const VD = mult * I * (Rc * PF + Xc * sinPF);
  const VD_pct = (VD / V) * 100;
  const VDmax = V * VDmax_pct / 100;
  const Amin = rm * mult * L_m * I * PF / VDmax;
  const loss = I * I * Rc * (phase === 3 ? 3 : 2);
  const kTotal = kT * kG * kI;
  const dens = I / area_mm2;
  const Rpkm = rm * 1000 / area_mm2;

  return {
    Rc: elec_fN(Rc, 6), Xc: elec_fN(Xc, 6),
    VD: elec_fN(VD, 3), VD_pct: elec_fN(VD_pct, 2),
    within_limit: VD_pct <= VDmax_pct,
    Amin: elec_fN(Amin, 2), loss_W: elec_fN(loss, 1),
    kTotal: elec_fN(kTotal, 4), dens: elec_fN(dens, 4), Rpkm: elec_fN(Rpkm, 4),
    X_mpm_mohm: elec_fN(X_mpm * 1e3, 3), cxLabel: cxData.label,
    skin_warn: area_mm2 > 150,
    long_cable_warn: L_m > 500,
    high_temp_warn: T_op > 90,
  };
}

function calcVD({ phase, V, I, L_m, area_mm2, PF, material, vLevel }) {
  phase = parseInt(phase) || 3;
  V = parseFloat(V); I = parseFloat(I); L_m = parseFloat(L_m);
  area_mm2 = parseFloat(area_mm2); PF = parseFloat(PF) || 0.85;

  if (!(V > 0 && I > 0 && L_m > 0 && area_mm2 > 0))
    return { error: "Invalid inputs — V, I, Length and CSA must all be > 0." };
  if (!(PF > 0 && PF <= 1))
    return { error: "Power factor must be in range (0, 1]." };

  const rho20 = material === "al" ? 2.82e-8 : 1.72e-8;
  const alpha = material === "al" ? 0.00403 : 0.00393;
  // IEC/NEC standard: use 75°C for voltage drop / protection calculations
  const T_op = 75;
  const rho_T = rho20 * (1 + alpha * (T_op - 20));
  const rm = rho_T * 1e6;  // Ω·mm²/m at 75°C
  const sinPF = Math.sqrt(Math.max(0, 1 - PF * PF));

  // Use reactance from vLevel selector (same table as cable sizing)
  const cxData = getCableX(vLevel || "lv_trefoil");
  const X_mpm = cxData.x;

  const Rc = rm * L_m / area_mm2;
  const Xc = X_mpm * L_m;
  const mult = phase === 3 ? Math.sqrt(3) : 2;
  const VD = mult * I * (Rc * PF + Xc * sinPF);
  const VD_pct = (VD / V) * 100;
  const VDmax_pct = 5;
  const Amin = rm * mult * L_m * I * PF / (V * VDmax_pct / 100);
  const loss = I * I * Rc * (phase === 3 ? 3 : 2);
  const brkRule = 1.25;
  const brk = nextBrk(I * brkRule);
  const dens = I / area_mm2;

  return {
    VD: elec_fN(VD, 4), VD_pct: elec_fN(VD_pct, 4),
    within_5pct: VD_pct <= 5,
    end_voltage: elec_fN(V - VD, 2),
    loss_W: elec_fN(loss, 2), Amin: elec_fN(Amin, 2),
    Rc: elec_fN(Rc, 6), Xc: elec_fN(Xc, 6),
    X_mpm_mohm: elec_fN(X_mpm * 1e3, 3),
    dens: elec_fN(dens, 4), brk,
  };
}

function calcMotor({ Pkw, V, PF, eff, n, phase, poles, freq, SF, start, brkRule, ISM }) {
  Pkw = parseFloat(Pkw); V = parseFloat(V); PF = parseFloat(PF);
  eff = parseFloat(eff); n = parseFloat(n) || 1480; phase = parseInt(phase) || 3;
  poles = parseInt(poles) || 4; freq = parseFloat(freq) || 50;
  SF = parseFloat(SF) || 1.0;
  // brkRule: 1.25 = 125% FLC (IEC standard), 2.5 = 250% for DOL inverse-time (NEC 430.52)
  brkRule = parseFloat(brkRule) || 1.25;
  // ISM: locked-rotor current multiplier from motor nameplate (IEC 60034, typically 5–8)
  ISM = parseFloat(ISM) || 6;

  if (!(Pkw > 0 && V > 0 && PF > 0 && PF <= 1 && eff > 0 && eff <= 1))
    return { error: "Invalid motor parameters — check kW, V, PF (0–1), efficiency (0–1)." };
  if (n <= 0) return { error: "Rated speed must be > 0 RPM." };

  const Pout = Pkw * 1000;           // shaft output in Watts
  const Pin  = Pout / eff;           // electrical input in Watts
  // IL = Pin / (sqrt(3)*V*PF) for 3-phase, Pin/(V*PF) for 1-phase
  const IL   = phase === 3 ? Pin / (Math.sqrt(3) * V * PF) : Pin / (V * PF);
  const IL_SF = IL * SF;
  // S = sqrt(3)*V*IL for 3-phase  (derived from IL above, not redundant formula)
  const S    = phase === 3 ? Math.sqrt(3) * V * IL : V * IL;
  // Torque from SHAFT power (not Pin) — prevents overestimation
  const T    = Pout / (2 * Math.PI * n / 60);
  const Ns   = 60 * freq / (poles / 2);
  const slip = ((Ns - n) / Ns) * 100;
  const Q    = S * Math.sqrt(Math.max(0, 1 - PF * PF));

  // Starting current & torque by method
  // Note: HTML option value is "sd" for Star-Delta (not "star_delta")
  let Is, Ts, note;
  if (start === "dol") {
    Is = ISM * IL;
    Ts = 150;
    note = `DOL: Is = ${ISM}×IL (nameplate ISM = ${ISM})`;
  } else if (start === "sd") {
    // Y-Δ reduces both voltage and current by 1/√3 → current reduces to 1/3
    Is = ISM * IL / 3;
    Ts = 50;   // 50% of rated torque (= DOL torque / 3, assuming DOL ≈ 150% rated)
    note = `Y-Δ: Is = ISM×IL/3 = ${(ISM/3).toFixed(2)}×IL. ⚠ Load torque must be < 33% rated at switchover.`;
  } else if (start === "autotx") {
    // Auto-transformer (65% tap): voltage ratio 0.65 → current ratio 0.65² ≈ 0.42×
    Is = ISM * IL * 0.42;
    Ts = 42;
    note = `Auto-transformer (65% tap): Is ≈ 0.42×DOL = ${(ISM*0.42).toFixed(2)}×IL`;
  } else if (start === "softstarter") {
    Is = 2.5 * IL;
    Ts = 100;
    note = "Soft starter: Is ≈ 2–3×IL (ramp limited).";
  } else {
    // VFD
    Is = 1.0 * IL;
    Ts = 150;
    note = "VFD: Is ≈ 1.0×IL (current-limited by drive). Consult VFD commissioning data.";
  }

  const brk = nextBrk(IL_SF * brkRule);

  return {
    IL: elec_fN(IL, 3), IL_SF: elec_fN(IL_SF, 3), SF,
    Pin_W: elec_fN(Pin, 2), S_VA: elec_fN(S, 2),
    T_Nm: elec_fN(T, 2), Ns: elec_fN(Ns, 0), slip_pct: elec_fN(slip, 2),
    Is: elec_fN(Is, 2), Ts_pct: Ts, Q_VAr: elec_fN(Q, 2),
    start_note: note, brkRule, brk,
  };
}

function calcXfmr({ kVA, V1, V2, PF, xLoad_pct, Pfe, Pcu, Zpct, Rpct, pfType }) {
  kVA = parseFloat(kVA); V1 = parseFloat(V1); V2 = parseFloat(V2);
  PF = parseFloat(PF) || 0.8; xLoad_pct = parseFloat(xLoad_pct) || 100;
  Pfe = parseFloat(Pfe) || 1000; Pcu = parseFloat(Pcu) || 3000;
  Zpct = parseFloat(Zpct) || 4; Rpct = parseFloat(Rpct) || 1;

  if (!(kVA > 0 && V1 > 0 && V2 > 0)) return { error: "kVA and voltages must be > 0." };
  if (!(PF > 0 && PF <= 1)) return { error: "PF must be in (0,1]." };

  const xL = xLoad_pct / 100;
  const Xpct = Math.sqrt(Math.max(0, Zpct * Zpct - Rpct * Rpct));
  const a = V1 / V2;
  const I1 = kVA * 1000 / V1;
  const I2 = kVA * 1000 / V2;
  const Pout_W = xL * kVA * 1000 * PF;
  const CuL = xL * xL * Pcu;
  const eff = Pout_W > 0 ? Pout_W / (Pout_W + Pfe + CuL) * 100 : 0;
  const sinp = Math.sqrt(Math.max(0, 1 - PF * PF));
  const VR = Rpct * PF + (pfType === "lead" ? -1 : 1) * Xpct * sinp;
  const xmaxE = Math.sqrt(Pfe / Math.max(1, Pcu));
  const Isc = I1 / (Math.max(0.01, Zpct) / 100);

  return {
    a: elec_fN(a, 5), Xpct: elec_fN(Xpct, 3),
    I1: elec_fN(I1, 3), I2: elec_fN(I2, 3),
    eff: elec_fN(eff, 3), VR: elec_fN(VR, 3),
    maxEff_pct_kva: elec_fN(xmaxE * 100, 2),
    Isc: elec_fN(Isc, 3),
    CuL_W: elec_fN(CuL, 1), Pout_W: elec_fN(Pout_W, 1),
  };
}

function calcCap({ Cu, Lm, R, V, f }) {
  Cu = parseFloat(Cu); Lm = parseFloat(Lm);
  R = parseFloat(R); V = parseFloat(V); f = parseFloat(f) || 50;

  const C = (Cu > 0) ? Cu * 1e-6 : NaN;
  const L = (Lm > 0) ? Lm * 1e-3 : NaN;
  const w = 2 * Math.PI * f;

  const Xc = (isFinite(C) && C > 0 && f > 0) ? 1 / (w * C) : null;
  const XL  = (isFinite(L) && L > 0 && f > 0) ? w * L       : null;
  const f0  = (isFinite(L) && isFinite(C) && L > 0 && C > 0) ? 1 / (2 * Math.PI * Math.sqrt(L * C)) : null;
  const w0  = f0 ? 1 / Math.sqrt(L * C) : null;
  const Ecap = (isFinite(C) && C > 0 && isFinite(V)) ? 0.5 * C * V * V : null;
  const Qch  = (isFinite(C) && C > 0 && isFinite(V)) ? C * V : null;
  const tau  = (isFinite(R) && R > 0 && isFinite(C) && C > 0) ? R * C : null;
  const Z = (isFinite(R) && R > 0 && Xc != null && XL != null)
    ? Math.sqrt(R * R + Math.pow(XL - Xc, 2)) : null;
  const Ic = (Xc != null && Xc > 0 && isFinite(V)) ? V / Xc : null;
  const Qf_series = (isFinite(R) && R > 0 && isFinite(L) && L > 0 && isFinite(C) && C > 0)
    ? (1 / R) * Math.sqrt(L / C) : null;

  return {
    Xc: elec_fN(Xc, 4), XL: elec_fN(XL, 4),
    Ecap_mJ: elec_fN(Ecap != null ? Ecap * 1000 : null, 4),
    Qch_mC: elec_fN(Qch != null ? Qch * 1000 : null, 4),
    f0: elec_fN(f0, 3), w0: elec_fN(w0, 2),
    tau_ms: elec_fN(tau != null ? tau * 1000 : null, 4),
    Qf_series: elec_fN(Qf_series, 4),
    Z: elec_fN(Z, 4), Ic: elec_fN(Ic, 5),
  };
}

function calcFault({ gridMVA, xkVA, xZpct, xRpct, CL_m, CA_mm2, LV, fltMat, motKVA }) {
  // Note: Vn_kV (HV nominal voltage) was previously accepted but unused.
  // All calculations use LV (low-voltage bus voltage) as the reference.
  gridMVA = parseFloat(gridMVA);
  xkVA   = parseFloat(xkVA);   xZpct = parseFloat(xZpct) || 4; xRpct = parseFloat(xRpct) || 1;
  CL_m   = parseFloat(CL_m)   || 10; CA_mm2 = parseFloat(CA_mm2) || 50;
  LV     = parseFloat(LV)     || 415; motKVA = parseFloat(motKVA) || 0;

  if (!(LV > 0 && xkVA > 0 && gridMVA > 0 && CA_mm2 > 0 && CL_m >= 0))
    return { error: "LV voltage, transformer kVA, grid MVA, and cable CSA must all be > 0." };
  if (xRpct > xZpct)
    return { error: `%R (${xRpct}%) cannot exceed %Z (${xZpct}%). Check transformer nameplate.` };

  const rho = fltMat === "al" ? 2.82e-8 : 1.72e-8;
  // IEC 60909 §2.3: cable resistance at 20°C for maximum fault current calculation
  const rm = rho * 1e6;  // Ω·mm²/m at 20°C

  // IEC 60909 §4.3: voltage factor c = 1.05 for maximum fault current at LV systems ≤ 1 kV
  const c = 1.05;

  // Per-unit base on transformer kVA (LV side)
  const Sbase = xkVA * 1000;
  const Zbase = LV * LV / Sbase;  // Ω

  // Grid source impedance referred to LV side: Zq = Zbase * (Sbase / Skq)
  // Equivalent to: LV² / (gridMVA × 1e6) — transformer MVA base cancels
  const Zgrid_mag = LV * LV / (gridMVA * 1e6);
  const XR_grid = 10;  // typical X/R for HV grid sources (IEC 60909 Table 3)
  const Rgrid = Zgrid_mag / Math.sqrt(1 + XR_grid * XR_grid);
  const Xgrid = XR_grid * Rgrid;

  // Transformer impedance components from %Z and %R
  const Zpct   = xZpct;
  const Rpct_x = Math.min(xRpct, xZpct);  // guard: R% ≤ Z%
  const Xpct_x = Math.sqrt(Math.max(0, Zpct * Zpct - Rpct_x * Rpct_x));
  const Zxfmr_mag = (Zpct   / 100) * Zbase;
  const Rxfmr     = (Rpct_x / 100) * Zbase;
  const Xxfmr     = (Xpct_x / 100) * Zbase;
  const XR_xfmr   = Xxfmr > 0 ? Xxfmr / Math.max(Rxfmr, 1e-9) : 5;

  // Cable impedance (positive sequence, conductor at 20°C per IEC 60909 for max fault)
  const Rcable = rm * CL_m / CA_mm2;
  const Xcable = 0.08e-3 * CL_m;  // ≈ 0.08 mΩ/m typical LV XLPE

  // Total positive-sequence impedance
  const Rtot = Rgrid + Rxfmr + Rcable;
  const Xtot = Xgrid + Xxfmr + Xcable;
  const Ztot = Math.sqrt(Rtot * Rtot + Xtot * Xtot);
  if (Ztot === 0) return { error: "Total impedance is zero — check inputs." };
  const XR_total = Xtot / Math.max(Rtot, 1e-12);

  // IEC 60909 §4.2: symmetrical 3-phase fault current
  const Isc3 = c * LV / (Math.sqrt(3) * Ztot);

  // Phase-phase fault: Isc2 = (√3/2) × Isc3 ≈ 0.866 × Isc3
  const Isc2 = Isc3 * Math.sqrt(3) / 2;

  // 1-phase fault: requires Z0 (zero-sequence). Using Isc1 ≈ 0.85×Isc3 as approximation.
  // For accurate Isc1, zero-sequence impedance data is required.
  const Isc1 = Isc3 * 0.85;

  // IEC 60909 §4.7: peak asymmetrical current — κ factor
  const kappa = 1.02 + 0.98 * Math.exp(-3 / XR_total);
  const Ip = kappa * Math.sqrt(2) * Isc3;

  // IEC 60909 §3.10: motor back-EMF contribution (conservative: 6× FLC)
  const Imot = motKVA > 0 ? (motKVA * 1000 / (Math.sqrt(3) * LV)) * 6 : 0;
  const Isc3_total = Isc3 + Imot;

  const fMVA = Math.sqrt(3) * LV * Isc3 / 1e6;

  // IEC standard breaker kA ratings
  const kA_std = [6, 10, 16, 20, 25, 31.5, 40, 50, 63, 80, 100, 125, 150, 200];
  const brkKA = kA_std.find(k => k >= Ip / 1000) || Math.ceil(Ip / 1000);

  return {
    Isc3: elec_fN(Isc3, 1), Isc2: elec_fN(Isc2, 1),
    Isc1: elec_fN(Isc1, 1), Isc1_note: "Approximate (Isc1 = 0.85×Isc3). Accurate value requires Z0 data.",
    Ip: elec_fN(Ip, 1), kappa: elec_fN(kappa, 4),
    Imot: elec_fN(Imot, 1), Isc3_total: elec_fN(Isc3_total, 1),
    fMVA: elec_fN(fMVA, 4), Ztot: elec_fN(Ztot, 6),
    Zgrid_mag: elec_fN(Zgrid_mag, 6), Zxfmr_mag: elec_fN(Zxfmr_mag, 6),
    Rcable: elec_fN(Rcable, 6), Xcable: elec_fN(Xcable, 6),
    XR_total: elec_fN(XR_total, 2), brkKA,
    c_factor: 1.05,
  };
}

function calcIllum({ L_m, W_m, H_m, WH_m, E_target, F_lm, Pw, MF, UF }) {
  L_m = parseFloat(L_m); W_m = parseFloat(W_m);
  H_m = parseFloat(H_m); WH_m = parseFloat(WH_m) || 0.85;
  E_target = parseFloat(E_target) || 500;
  F_lm = parseFloat(F_lm) || 4000;
  Pw = parseFloat(Pw) || 36;
  MF = parseFloat(MF) || 0.8; UF = parseFloat(UF) || 0.6;

  if (!(L_m > 0 && W_m > 0 && H_m > 0))
    return { error: "Room dimensions (L, W, H) must all be > 0." };
  if (E_target <= 0) return { error: "Target illuminance must be > 0 lux." };
  if (F_lm <= 0)     return { error: "Lumens per fitting must be > 0." };
  if (!(MF > 0 && MF <= 1)) return { error: "Maintenance Factor MF must be in (0, 1]." };
  if (!(UF > 0 && UF <= 1)) return { error: "Utilisation Factor UF must be in (0, 1]." };

  // Mounting height above working plane
  const Hm = H_m - WH_m;
  if (Hm <= 0) return { error: `Mounting height Hm = H − WH = ${H_m} − ${WH_m} = ${Hm.toFixed(2)} m. Hm must be > 0. Reduce working height or increase mounting height.` };

  const A = L_m * W_m;
  const RI = A / (Hm * (L_m + W_m));
  const N = Math.ceil(E_target * A / (F_lm * MF * UF));
  if (N <= 0) return { error: "Calculated luminaire count is 0 — check input values." };

  const Ea = N * F_lm * MF * UF / A;
  const Wtot = N * Pw;
  const Wdens = Wtot / A;

  // Find grid layout with aspect ratio closest to room aspect ratio
  let br = 1, bc = N, ba = Infinity;
  for (let rr = 1; rr <= N; rr++) {
    const cc = Math.ceil(N / rr);
    const asp = Math.abs(L_m / cc - W_m / rr);
    if (asp < ba) { ba = asp; br = rr; bc = cc; }
  }
  const Sl = L_m / bc, Sw = W_m / br;

  return {
    N, RI: elec_fN(RI, 3), Hm: elec_fN(Hm, 2), Ea: elec_fN(Ea, 1),
    target_met: Ea >= E_target,
    Wtot: elec_fN(Wtot, 0), Wdens: elec_fN(Wdens, 2),
    A: elec_fN(A, 1), grid: `${br} rows × ${bc} cols`,
    Sl: elec_fN(Sl, 2), Sw: elec_fN(Sw, 2),
  };
}

function calcHVTest({ Uo, U, L_m, T_deg, method, cond, insType, sheathType }) {
  Uo = parseFloat(Uo) || 6; U = parseFloat(U) || 10;
  L_m = parseFloat(L_m) || 100; T_deg = parseFloat(T_deg) || 20;

  let testV = 0, dur = "", std = "", pass = "", warnMsg = "";
  const isXLPE = insType === "xlpe";
  const isPILC = insType === "pil";

  if (method === "ac_site") {
    if (cond === "new")       { testV = 2 * Uo;    dur = "60 min"; }
    else if (cond === "maint") { testV = 1.5 * Uo;  dur = "30 min"; }
    else if (cond === "repair"){ testV = 1.73 * Uo; dur = "60 min"; }
    else                       { testV = 2.5 * Uo;  dur = "60 min (factory acceptance)"; }
    std  = "IEC 60502-4 / IEC 60840 (AC site test)";
    pass = "No breakdown or disruptive discharge. Leakage current stable.";
  } else if (method === "ac_factory") {
    testV = (isXLPE ? 2.5 : 2) * Uo;
    if (insType === "pvc") testV = 2 * Uo;
    dur  = "5 min (routine); longer for type test";
    std  = "IEC 60502-2 / IEC 60840 (factory AC)";
    pass = "No puncture or surface tracking. PD within limit.";
  } else if (method === "dc_site") {
    if (isXLPE) warnMsg = "DC NOT recommended for XLPE — creates space charge causing delayed failures. Use VLF instead.";
    testV = (isPILC ? 3.5 : 3) * Uo;
    if (cond === "maint") testV = 2.5 * Uo;
    dur  = "15 min (legacy)";
    std  = "IEEE 400 (DC — legacy method)";
    pass = "Leakage current ≤ manufacturer limit. No breakdown.";
  } else if (method === "vlf") {
    testV = (cond === "maint" ? 1.5 : cond === "new" ? 2 : 1.73) * Uo;
    dur  = "60 min (new/repair); 30 min (maintenance)";
    std  = "IEEE 400.2 / HD 620 (VLF 0.1 Hz)";
    pass = "No breakdown. tanδ < 4×10⁻³ indicates good insulation.";
    if (!isXLPE) warnMsg = "VLF optimised for XLPE/EPR. For PILC, AC or DC per IEC 60502 more traditional.";
  } else {
    dur  = "1–10 min (DAR / Polarisation Index)";
    std  = "IEEE 43 / IEC — Insulation Resistance Test";
    pass = "PI = IR_10min/IR_1min > 2 good; < 1 suspect.";
  }

  const lenKm = Math.max(L_m / 1000, 0.01);
  const irMin = ((Uo + 1) * lenKm).toFixed(2);
  const irAtT = (parseFloat(irMin) * Math.pow(0.5, (T_deg - 20) / 10)).toFixed(2);

  let sheathTxt = "Not required";
  if (sheathType === "pvc_outer") sheathTxt = "DC 10 kV / 1 min — outer sheath to earth. No breakdown.";
  else if (sheathType === "pe_outer") sheathTxt = "DC 25 kV / 1 min — outer sheath to earth. No breakdown.";

  if (!warnMsg) warnMsg = "HV testing is life-threatening — authorised personnel only. Maintain exclusion zone, earth all conductors before connecting. Discharge cable after every test.";

  return {
    testV: testV > 0 ? elec_fN(testV, 2) : null,
    dur, std, pass,
    sheathTest: sheathTxt,
    ir_min_MOhm: irMin, ir_at_temp_MOhm: irAtT,
    warn: warnMsg,
  };
}

// ========================================================================
// SECTION: ELECTRICAL
// ========================================================================

async function handle_electrical(body, res) {
  const ELEC_CALCS = {
    ohm:    calcOhm,
    power:  calcPower,
    cable:  calcCable,
    vd:     calcVD,
    motor:  calcMotor,
    xfmr:   calcXfmr,
    cap:    calcCap,
    fault:  calcFault,
    illum:  calcIllum,
    hvtest: calcHVTest,
  };
  const { calc, inputs } = body || {};
  const fn = ELEC_CALCS[calc];
  if (!fn) return res.status(400).json({ ok: false, error: `Unknown calculator: "${calc}"` });
  try {
    const results = fn(inputs || {});
    if (results && results.error) return res.status(200).json({ ok: false, error: results.error });
    return res.status(200).json({ ok: true, results });
  } catch(err) {
    return res.status(200).json({ ok: false, error: 'Calculation failed: ' + err.message });
  }
}



// ================================================================

// ════════════════════════════════════════════════════════════════════════════
// Vercel handler — dispatches to handle_electrical
// ════════════════════════════════════════════════════════════════════════════
async function electrical_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = req.method === 'POST' ? req.body : {};
  if (req.method === 'POST' && (!body || typeof body !== 'object'))
    return res.status(400).json({ error: 'Invalid request body.' });

  try {
    return await handle_electrical(body, res);
  } catch (e) {
    console.error('[electrical-engineering-calculators.js] Unhandled error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

// ── End of Section 19: Electrical Engineering Calculators ──────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION 20 of 21  ►  MECHANICAL ENGINEERING CALCULATORS
// Route: /api/mechanical-engineering-calculators
// Source: mechanical-engineering-calculators.js
// ══════════════════════════════════════════════════════════════════════════════

// MECHANICAL ENGINEERING CALCULATORS
// Route: POST /api/mechanical-engineering-calculators
// Body:  { calculator: string, inputs: object }
// Response: { ok: boolean, results: object }
// ================================================================

// ── Protected lookup tables ──────────────────────────────────────

const MECH_MAT = {
  shaft: {
    'c45':       { Sy: 390e6, Su: 620e6,  E: 200e9, rho: 7850 },
    '4140':      { Sy: 655e6, Su: 1020e6, E: 200e9, rho: 7850 },
    'stainless': { Sy: 207e6, Su: 517e6,  E: 193e9, rho: 7960 },
  },
  spring: {
    'steel-hard': { G: 79000, Ssy: 700 },
    'steel-ht':   { G: 79000, Ssy: 550 },
    'ss302':      { G: 69000, Ssy: 480 },
    'chrome-si':  { G: 77200, Ssy: 750 },
  },
  sheet: {
    'ms':     { K: 0.44, Sy: 250, E: 200, Rmin_factor: 0.5 },
    'ss304':  { K: 0.44, Sy: 310, E: 193, Rmin_factor: 1.0 },
    'alum':   { K: 0.40, Sy: 193, E: 70,  Rmin_factor: 4.0 },
    'copper': { K: 0.44, Sy: 210, E: 117, Rmin_factor: 1.0 },
    'galv':   { K: 0.44, Sy: 280, E: 200, Rmin_factor: 0.5 },
  },
  gear: {
    'steel-ht':   { Sall: 200 },
    'steel-soft': { Sall: 83  },
    'ci':         { Sall: 50  },
    'bronze':     { Sall: 40  },
  },
  pvessel: {
    'cs':    { S: 138 },
    'ss':    { S: 138 },
    'ss316': { S: 115 },
  },
  liquid: {
    water: 1000, diesel: 840, petrol: 720,
    lpg: 488, acid: 1840, caustic: 1530,
  },
  cncKc: {
    'mild-steel': 1500, 'alloy-steel': 2200, 'ss': 2500,
    'alum': 700, 'cast-iron': 1100, 'copper': 900, 'titanium': 3000,
  },
  cncVc: {
    'mild-steel': 200, 'alloy-steel': 150, 'ss': 120,
    'alum': 600, 'cast-iron': 180, 'copper': 300, 'titanium': 50,
  },
  fastener: {
    '4.6':  { Sy: 240 }, '8.8': { Sy: 660 },
    '10.9': { Sy: 940 }, '12.9': { Sy: 1100 }, 'A2-70': { Sy: 450 },
  },
  gasket: {
    swg:    { m: 3.0,  y: 69  },
    rtj:    { m: 6.5,  y: 179 },
    flat:   { m: 4.75, y: 62  },
    rubber: { m: 0.5,  y: 0   },
  },
  bolt: {
    '800':  { Sy: 724, Su: 862  },
    '8.8':  { Sy: 660, Su: 800  },
    '10.9': { Sy: 940, Su: 1040 },
  },
  beam: {
    'steel':  { E: 200, Fy: 250, rho: 7850 },
    'alum':   { E: 69,  Fy: 276, rho: 2700 },
    'timber': { E: 12,  Fy: 30,  rho: 500  },
    'conc':   { E: 30,  Fy: 25,  rho: 2400 },
  },
};

// AGMA Lewis Y form factor — interpolated, AGMA 908-B89 (server-side only)
function mech_lewisY(z) {
  const T = [
    [12,0.245],[13,0.261],[14,0.277],[15,0.290],[16,0.296],[17,0.303],
    [18,0.309],[19,0.314],[20,0.322],[22,0.331],[24,0.337],[26,0.346],
    [28,0.353],[30,0.359],[34,0.371],[38,0.384],[43,0.397],[50,0.409],
    [60,0.422],[75,0.435],[100,0.447],[150,0.460],[300,0.472],[400,0.480],
  ];
  if (z <= 0) return 0.245;
  for (let i = T.length - 1; i >= 0; i--) {
    if (z >= T[i][0]) {
      if (i === T.length - 1) return T[i][1];
      return T[i][1] + (T[i+1][1] - T[i][1]) * (z - T[i][0]) / (T[i+1][0] - T[i][0]);
    }
  }
  return 0.245;
}

// ISO metric coarse pitch (server-side only)
function mech_isoPitch(d) {
  if (d <= 6) return 1.0; if (d <= 8) return 1.25; if (d <= 10) return 1.5;
  if (d <= 12) return 1.75; if (d <= 16) return 2.0; if (d <= 20) return 2.5;
  if (d <= 24) return 3.0; return 3.5;
}

// AWS D1.1 Table 5.8 minimum fillet weld size
function mech_awsMinWeld(leg) {
  if (leg <= 6) return 3; if (leg <= 12) return 5; if (leg <= 19) return 6; return 8;
}

// Standard rolled section library (I mm⁴, Z mm³, A mm²) — server-side only
const MECH_SECTIONS = {
  'HEA100': { I: 3490000,   Z: 72760,  A: 2124 },
  'HEA140': { I: 10330000,  Z: 173500, A: 3142 },
  'HEA180': { I: 27900000,  Z: 324000, A: 4525 },
  'HEA200': { I: 36920000,  Z: 388800, A: 5383 },
  'IPE160': { I: 8693000,   Z: 123000, A: 2009 },
  'IPE200': { I: 19430000,  Z: 194200, A: 2848 },
  'IPE240': { I: 38920000,  Z: 324300, A: 3912 },
  'IPE300': { I: 83560000,  Z: 557400, A: 5381 },
  'UB203x133x30': { I: 28500000,  Z: 279000,  A: 3820 },
  'UB305x165x54': { I: 117000000, Z: 765000,  A: 6860 },
};

// ── Calculator engines ───────────────────────────────────────────

function mech_pressureVessel(inp) {
  let { P, Pu, T_design, T_unit, D, Du, S, E, CA, type, materialKey } = inp;
  if (Pu === 'bar') P *= 0.1; else if (Pu === 'psi') P *= 0.00689476;
  const T_C = T_unit === 'F' ? (T_design - 32) * 5/9 : (T_design || 20);
  if (materialKey && MECH_MAT.pvessel[materialKey]) S = MECH_MAT.pvessel[materialKey].S;
  let R = D / 2;
  if (Du === 'in') R *= 25.4;
  if (P <= 0 || R <= 0 || S <= 0 || CA < 0) return { error: 'Invalid inputs' };
  let t_calc, formula;
  const D_inside = R * 2;
  switch (type) {
    case 'cyl':       t_calc = (P*R)/(S*E - 0.6*P);         formula = 't = P·R/(S·E−0.6P) [ASME VIII UG-27(c)(1)]'; break;
    case 'sph':       t_calc = (P*R)/(2*S*E - 0.2*P);       formula = 't = P·R/(2·S·E−0.2P) [ASME VIII UG-27(d)]'; break;
    case 'head-hemi': t_calc = (P*R)/(2*S*E - 0.2*P);       formula = 't = P·R/(2·S·E−0.2P) [ASME VIII UG-32(f)]'; break;
    case 'head-ell':  t_calc = (P*D_inside)/(2*S*E - 0.2*P);formula = 't = P·D/(2·S·E−0.2P) [ASME VIII UG-32(d)]'; break;
    default: return { error: 'Unknown vessel type' };
  }
  const t_gross   = t_calc + CA;
  const t_nominal = Math.ceil(t_gross / 0.5) * 0.5;
  const t_net     = t_nominal - CA;
  const t_min_asme = 1.5875;
  let sigma_h, sigma_l, MAWP;
  if (type === 'cyl') {
    sigma_h = P*R/t_net; sigma_l = P*R/(2*t_net); MAWP = S*E*t_net/(R + 0.6*t_net);
  } else if (type === 'head-ell') {
    sigma_h = P*D_inside/(2*t_net); sigma_l = sigma_h/2; MAWP = 2*S*E*t_net/(D_inside + 0.2*t_net);
  } else {
    sigma_h = P*R/(2*t_net); sigma_l = sigma_h; MAWP = 2*S*E*t_net/(R + 0.2*t_net);
  }
  const sf            = S*E / Math.max(sigma_h, 0.001);
  const thinWallRatio = t_nominal / R;
  const ok            = sf >= 1.0 && t_nominal >= t_min_asme;
  const tempWarning   = T_C > 300
    ? `At ${T_C.toFixed(0)}°C ASME allowable stress is significantly reduced. Verify S from ASME II-D Table 1A.`
    : T_C > 50 ? `At ${T_C.toFixed(0)}°C confirm S is the temperature-derated value from ASME II-D Table 1A.` : null;
  return {
    ok,
    t_calc:      +t_calc.toFixed(3),      t_gross:   +t_gross.toFixed(3),
    t_nominal:   +t_nominal.toFixed(1),   t_net:     +t_net.toFixed(3),
    sigma_h:     +sigma_h.toFixed(2),     sigma_l:   +sigma_l.toFixed(2),
    MAWP_bar:    +(MAWP*10).toFixed(2),   sf:        +sf.toFixed(3),
    thinWallRatio: +thinWallRatio.toFixed(3),
    thinWallOk: thinWallRatio < 0.5,
    hoopFail:   sigma_h > S*E,
    t_min_asme, formula,
    R_mm: +R.toFixed(1), P_bar: +(P*10).toFixed(2), S, E, CA, tempWarning,
  };
}

function mech_boltFlange(inp) {
  let { nb, bd, ba, T, Tu, K, gtype, gm, gy, god, gid, P, Pu, bgrade } = inp;
  if (Tu === 'lbft') T *= 1.35582;
  if (Pu === 'bar') P *= 0.1; else if (Pu === 'psi') P *= 0.00689476;
  const gp = MECH_MAT.gasket[gtype];
  if (gp) { gm = gp.m; gy = gp.y; }
  if (!ba || ba <= 0) {
    const cp = mech_isoPitch(bd);
    const d2 = bd - 0.6495*cp; const d3 = bd - 1.2269*cp;
    ba = Math.PI/4 * Math.pow((d2+d3)/2, 2);
  }
  const Fi           = T / (K * bd / 1000);
  const totalPreload = Fi * nb;
  const G            = (god + gid) / 2;
  const b            = (god - gid) / 4;
  const Agasket_eff  = Math.PI * G * b;
  const Wm1 = Math.PI*G*b*gm*P + Math.PI/4*G*G*P;
  const Wm2 = Math.PI*G*b*gy;
  const Sy_bolt  = (MECH_MAT.bolt[bgrade] || { Sy: 724 }).Sy;
  const Sall     = 0.66 * Sy_bolt;
  const boltStress = Fi / ba;
  const util     = boltStress / Sall * 100;
  const ok       = boltStress < Sall && totalPreload > Math.max(Wm1, Wm2);
  const Fi_low   = T / (0.40 * bd / 1000);
  const Fi_high  = T / (0.10 * bd / 1000);
  return {
    ok,
    Fi_kN:          +(Fi/1000).toFixed(2),
    totalPreload_kN:+(totalPreload/1000).toFixed(2),
    boltStress:     +boltStress.toFixed(1),
    Sall:           +Sall.toFixed(1),
    util:           +util.toFixed(1),
    Wm1_kN:         +(Wm1/1000).toFixed(2),
    Wm2_kN:         +(Wm2/1000).toFixed(2),
    gasketStress:   +(totalPreload/Agasket_eff).toFixed(1),
    gy, gm,
    At:             +ba.toFixed(1),
    nb, bd, T_Nm: +T.toFixed(1), K, P_bar: +(P*10).toFixed(2),
    preloadRange: {
      low_kN:  +(Fi_low  * nb / 1000).toFixed(1),
      high_kN: +(Fi_high * nb / 1000).toFixed(1),
    },
    kUncertaintyNote: `K=${K}. Typical range 0.10 (oiled)–0.40 (dry). Preload uncertainty ±~30%.`,
  };
}

function mech_weld(inp) {
  let { w, wLeg_u, Lw, wL_u, wtype, config, V, V_u, N_kN, M_kNm, FEXX, e, gw, gh } = inp;
  if (wLeg_u === 'in') w  *= 25.4;
  if (wL_u   === 'in') Lw *= 25.4;
  if (V_u    === 'N')  V  /= 1000; else if (V_u === 'kip') V *= 4.44822;
  if (w <= 0 || Lw <= 0 || FEXX <= 0) return { error: 'Invalid weld inputs' };
  let throat, throatNote;
  if      (wtype === 'fillet')    { throat = 0.707*w; throatNote = 'a = 0.707·w (45° equal-leg fillet, AWS D1.1 2.4.1)'; }
  else if (wtype === 'butt-full') { throat = w;        throatNote = 'a = w (complete joint penetration)'; }
  else                            { throat = Math.max(w-3, w*0.7); throatNote = 'a ≈ w−3mm (partial penetration, 60° bevel approx)'; }
  const allowable = 0.3 * FEXX;
  if (config === 'group-rect') {
    if (!gw || !gh || gw <= 0 || gh <= 0) return { error: 'Enter valid group dimensions' };
    const Lw_group  = 2*(gw+gh);
    const Aw        = throat * Lw_group;
    const Jw_unit   = (gw*gh*(gw*gw + gh*gh)) / 6;
    const r_max     = Math.sqrt(Math.pow(gw/2,2) + Math.pow(gh/2,2));
    const tau_V     = V*1000 / Aw;
    const sigma_N   = (N_kN||0)*1000 / Aw;
    let tau_torsion = 0, torsionNote = '';
    if (e > 0) {
      const Mt    = V*1000*e;
      tau_torsion = Mt*r_max / (throat*Jw_unit);
      torsionNote = `Mt=${(Mt/1e6).toFixed(3)} kN·m, τ_tors=${tau_torsion.toFixed(1)} MPa at r_max=${r_max.toFixed(1)} mm`;
    }
    const sigma_M   = (M_kNm||0)*1e6 / (throat*(gh*gw*gw/6));
    const sigma_tot = sigma_N + sigma_M;
    const tau_tot   = Math.sqrt(
      Math.pow(tau_V + tau_torsion*(gw/2)/r_max, 2) +
      Math.pow(tau_torsion*(gh/2)/r_max, 2)
    );
    const combined = Math.sqrt(sigma_tot*sigma_tot/3 + tau_tot*tau_tot);
    const util     = combined / allowable * 100;
    return {
      ok: combined <= allowable, isGroup: true,
      throat: +throat.toFixed(2), Aw: +Aw.toFixed(1),
      tau_V: +tau_V.toFixed(2), tau_torsion: +tau_torsion.toFixed(2),
      combined: +combined.toFixed(2), allowable: +allowable.toFixed(1),
      util: +util.toFixed(1), Lw_group: +Lw_group.toFixed(0),
      throatNote, torsionNote, FEXX, gw, gh,
    };
  }
  const nWelds    = config === 'double' ? 2 : 1;
  const Aw        = throat * Lw * nWelds;
  const tau_V     = V*1000 / Aw;
  const sigma_N   = (N_kN||0)*1000 / Aw;
  const sigma_M   = (M_kNm||0)*1e6 / (Aw * Lw / 6);
  const sigma_tot = sigma_N + sigma_M;
  const tau_tot   = Math.sqrt(Math.pow(tau_V,2) + Math.pow(sigma_tot/Math.sqrt(3),2));
  const util      = tau_tot / allowable * 100;
  const ok        = tau_tot <= allowable;
  return {
    ok, isGroup: false,
    throat: +throat.toFixed(2), Aw: +Aw.toFixed(1),
    tau_V: +tau_V.toFixed(2), sigma_tot: +sigma_tot.toFixed(2),
    tau_tot: +tau_tot.toFixed(2), allowable: +allowable.toFixed(1),
    util: +util.toFixed(1),
    minWeld: mech_awsMinWeld(w),
    suggestedLeg: tau_tot > allowable ? Math.ceil(w * Math.sqrt(tau_tot/allowable) + 1) : null,
    throatNote, FEXX, config,
    w: +w.toFixed(1), Lw: +Lw.toFixed(0), V: +V.toFixed(1), M_kNm: M_kNm||0,
  };
}

function mech_gear(inp) {
  let { m, z1, z2, F, n1, P, P_u, eta, materialKey, Sall } = inp;
  if (P_u === 'hp') P *= 0.7457;
  if (materialKey && MECH_MAT.gear[materialKey]) Sall = MECH_MAT.gear[materialKey].Sall;
  if (z1 < 6 || z2 < 6) return { error: 'Minimum 6 teeth per gear' };
  if (m <= 0 || F <= 0 || n1 <= 0 || P <= 0) return { error: 'Invalid gear inputs' };
  if (F < 8*m) return { error: `Face width F=${F}mm too narrow. AGMA: F ≥ ${8*m}mm` };
  const i = z2/z1, n2 = n1/i, d1 = m*z1, d2 = m*z2, a = (d1+d2)/2;
  const T1 = P*1000/(2*Math.PI*n1/60), T2 = T1*i*eta;
  const Wt = T1*1000/(d1/2);
  const Vp = Math.PI*d1*n1/60000;
  const Vp_fpm = Vp * 196.85, Qv = 6;
  const A_agma = 56 + Math.sqrt(200 - Qv*Qv);
  const Kv = Math.max(1.0, (A_agma + Math.sqrt(Vp_fpm)) / A_agma);
  const Ks = Math.max(1.0, 1.192 * Math.pow(F * Math.sqrt(mech_lewisY(Math.min(z1,z2))) / m, 0.0535));
  const F_over_d = F / d1;
  const Km = 1 + 0.0675*F_over_d + 0.0128*F_over_d*F_over_d + (n1 > 3600 ? 0.15 : 0);
  const Y1 = mech_lewisY(z1), Y2 = mech_lewisY(z2);
  const sigma_lewis = Wt / (F * m * Math.min(Y1,Y2));
  const sigma_agma  = Wt * Kv * Ks * Km / (F * m * Math.min(Y1,Y2));
  const sf = Sall / sigma_agma;
  const ok = sf > 1.5 && Vp < 25;
  return {
    ok, i: +i.toFixed(3), n2: +n2.toFixed(1), d1: +d1.toFixed(1), d2: +d2.toFixed(1), a: +a.toFixed(1),
    Wt: +Wt.toFixed(1), T1_Nm: +T1.toFixed(2), T2_Nm: +T2.toFixed(2), Vp: +Vp.toFixed(2),
    sigma_lewis: +sigma_lewis.toFixed(2), sigma_agma: +sigma_agma.toFixed(2),
    Kv: +Kv.toFixed(3), Ks: +Ks.toFixed(3), Km: +Km.toFixed(3),
    Y1: +Y1.toFixed(4), Y2: +Y2.toFixed(4), sf: +sf.toFixed(3), Sall,
    P_kW: +P.toFixed(2), P_out_kW: +(P*eta).toFixed(2),
    eta_recommended: Vp < 5 ? 0.96 : Vp < 15 ? 0.97 : 0.98,
    faceWidthWarn: F > 16*m ? `Face width F=${F}mm exceeds AGMA max 16×m=${16*m}mm.` : null,
  };
}

function mech_shaft(inp) {
  let { M, T, Fa, d, d_u, L, Sy, Su, SF, Lk, materialKey } = inp;
  const mat = MECH_MAT.shaft[materialKey];
  if (mat) { Sy = mat.Sy/1e6; Su = mat.Su/1e6; }
  if (d_u === 'in') d *= 25.4;
  d /= 1000; L /= 1000; Lk /= 1000;
  Sy *= 1e6; Su *= 1e6;
  if (d <= 0 || SF < 1 || M < 0 || T < 0) return { error: 'Invalid shaft inputs' };
  const r = d/2;
  const J = Math.PI*Math.pow(d,4)/32;
  const I = Math.PI*Math.pow(d,4)/64;
  const A = Math.PI*d*d/4;
  const sigma_b = M*r/I, tau_t = T*r/J, sigma_a = (Fa||0)/A;
  const sigma_total = sigma_b + sigma_a;
  const sigma_vm = Math.sqrt(sigma_total*sigma_total + 3*tau_t*tau_t);
  const sf_vm = Sy / sigma_vm;
  const Se = 0.504 * Su;
  const sf_fatigue = 1 / (sigma_b/Se + tau_t/(0.577*Se));
  const E_s   = mat ? mat.E : 200e9;
  const rho_s = mat ? mat.rho : 7850;
  const w_self = rho_s * A * 9.81;
  const delta_ss = 5 * w_self * Math.pow(L,4) / (384 * E_s * I);
  const Nc = (30/Math.PI) * Math.sqrt(9.81 / Math.max(delta_ss, 1e-9));
  const kw = Math.max(4, Math.round(d*1000/4));
  const key_shear   = 2*T / (d * (kw/1000) * Lk);
  const key_bearing = 4*T / (d * (kw/2000) * Lk);
  const ok = sf_vm > SF;
  return {
    ok,
    sigma_b: +(sigma_b/1e6).toFixed(3), sigma_a: +(sigma_a/1e6).toFixed(3),
    tau_t:   +(tau_t/1e6).toFixed(3),   sigma_vm: +(sigma_vm/1e6).toFixed(3),
    Sy_MPa: +(Sy/1e6).toFixed(0), sf_vm: +sf_vm.toFixed(3), sf_fatigue: +sf_fatigue.toFixed(3),
    Nc_rpm: +Nc.toFixed(0), Se_MPa: +(Se/1e6).toFixed(0),
    key_shear: +(key_shear/1e6).toFixed(2), key_bearing: +(key_bearing/1e6).toFixed(2),
    kw, kh: kw, d_mm: +(d*1000).toFixed(0), L_mm: +(L*1000).toFixed(0),
    J_mm4: +(J*1e12).toFixed(2), Fa_N: Fa||0, SF,
    vmFail: sigma_vm > Sy, keyShearFail: key_shear > 0.577*Sy, keyBearFail: key_bearing > Sy,
  };
}

function mech_sheetMetal(inp) {
  let { t, t_u, K, theta, R, A, B, Sy, E, materialKey } = inp;
  const mat = MECH_MAT.sheet[materialKey];
  if (mat) { K = mat.K; Sy = mat.Sy; E = mat.E; }
  if (t_u === 'in') t *= 25.4;
  const E_MPa = E * 1000;
  if (t <= 0 || R < 0 || theta <= 0) return { error: 'Invalid sheet metal inputs' };
  const BA        = (Math.PI/180) * theta * (R + K*t);
  const BD        = 2*(R+t)*Math.tan(theta/2*Math.PI/180) - BA;
  const TotalFlat = A + B + BA;
  const Kf        = Sy * R / (E_MPa * t);
  const thetaFinal = theta * (1 - 3*Kf + 4*Math.pow(Kf,3));
  const springback = Math.max(0, theta - thetaFinal);
  const effMat = MECH_MAT.sheet[materialKey] || MECH_MAT.sheet['ms'];
  const Rmin   = effMat.Rmin_factor * t;
  const Rmin_labels = { ms:'0.5t (mild steel)', ss304:'1.0t (SS304)', alum:'4.0t (Al 6061)', copper:'1.0t (copper)', galv:'0.5t (galvanised)' };
  return {
    ok: R >= Rmin,
    BA: +BA.toFixed(3), BD: +BD.toFixed(3), TotalFlat: +TotalFlat.toFixed(3),
    springback: +springback.toFixed(2), overbend: +(theta+springback).toFixed(1),
    Rmin: +Rmin.toFixed(2), Rmin_note: Rmin_labels[materialKey] || `${effMat.Rmin_factor}t`,
    Kf: +Kf.toFixed(4), neutral_mm: +(K*t).toFixed(3), arc_R: +(R+K*t).toFixed(3),
    bendOk: R >= Rmin, Kf_warn: Kf > 0.3,
    t, K, theta, R, A, B, Sy, E,
  };
}

function mech_spring(inp) {
  let { dw, D, Na, F, G, Ssy, ends, materialKey } = inp;
  const mat = MECH_MAT.spring[materialKey];
  if (mat) { G = mat.G; Ssy = mat.Ssy; }
  if (dw <= 0 || D <= 0 || dw >= D) return { error: 'Invalid wire/coil diameter' };
  if (Na < 1 || F <= 0) return { error: 'Invalid active coils or load' };
  const C  = D / dw;
  const Kw = (4*C-1)/(4*C-4) + 0.615/C;
  const k  = G * Math.pow(dw,4) / (8 * Math.pow(D,3) * Na);
  const delta = F / k;
  const tau   = Kw * 8*F*D / (Math.PI*Math.pow(dw,3));
  const sf    = Ssy / tau;
  const p_free = dw * 1.25;
  let Nt, Lf;
  if      (ends === 'closed-ground') { Nt = Na+2; Lf = Na*p_free + 2*dw; }
  else if (ends === 'closed')        { Nt = Na+2; Lf = Na*p_free + 3*dw; }
  else                               { Nt = Na;   Lf = Na*p_free + dw;   }
  const solid_h        = Nt * dw;
  const endDw          = ends === 'closed-ground' ? 2 : ends === 'closed' ? 3 : 1;
  const pitch          = (Lf - endDw*dw) / Na;
  const coil_gap       = pitch - dw;
  const clash_clearance = Lf - delta - solid_h;
  const slenderness    = Lf / D;
  return {
    ok: sf >= 1.2 && C >= 4 && C <= 12,
    k: +k.toFixed(3), delta: +delta.toFixed(3), Kw: +Kw.toFixed(4), C: +C.toFixed(2),
    tau: +tau.toFixed(2), Ssy: +Ssy.toFixed(1), sf: +sf.toFixed(3),
    Lf: +Lf.toFixed(2), solid_h: +solid_h.toFixed(2), pitch: +pitch.toFixed(3),
    coil_gap: +coil_gap.toFixed(3), clash_clearance: +clash_clearance.toFixed(3),
    slenderness: +slenderness.toFixed(3), Nt,
    bucklingRisk: slenderness > 4.0, clashWarn: clash_clearance < 0.15*Lf, C_warn: C < 4 || C > 12,
    dw, D, Na, G, F, ends,
  };
}

function mech_fastener(inp) {
  let { d, p, Sy, T, Tu, K, Fa_kN, gradeKey } = inp;
  if (gradeKey && MECH_MAT.fastener[gradeKey]) Sy = MECH_MAT.fastener[gradeKey].Sy;
  if (Tu === 'lbft') T *= 1.35582;
  if (d <= 0 || p <= 0 || Sy <= 0 || T <= 0) return { error: 'Invalid fastener inputs' };
  if (K < 0.05 || K > 0.5) return { error: 'K outside typical range 0.05–0.5' };
  const d2 = d - 0.6495*p, d3 = d - 1.2269*p;
  const At = Math.PI/4 * Math.pow((d2+d3)/2, 2);
  const Fi = T*1000 / (K*d);
  const sigma_preload = Fi / At;
  const tau_tighten   = sigma_preload * 0.5 * Math.tan(Math.atan(p / (Math.PI*d2)));
  const sigma_vm_tight = Math.sqrt(sigma_preload*sigma_preload + 3*tau_tighten*tau_tighten);
  const Fa            = (Fa_kN||0) * 1000;
  const sigma_service = (Fi + Fa) / At;
  const sf   = Sy / Math.max(sigma_vm_tight, sigma_service);
  const util = sigma_service / Sy * 100;
  const ok   = sf >= 1.2 && sigma_service < Sy;
  const T_strip = 0.18 * Sy * At * d / 1000;
  return {
    ok,
    At: +At.toFixed(2), d2: +d2.toFixed(3), d3: +d3.toFixed(3),
    Fi_kN: +(Fi/1000).toFixed(3), sigma_preload: +sigma_preload.toFixed(1),
    sigma_service: +sigma_service.toFixed(1), Sy, sf: +sf.toFixed(3),
    util: +util.toFixed(1), T_strip_Nm: +T_strip.toFixed(1),
    T_strip_ratio: +(T_strip/T).toFixed(2),
    p, K, T, Fa_kN: Fa_kN||0, gradeKey,
  };
}

function mech_cnc(inp) {
  let { D, Vc, Vc_u, fz, z, ap, ae, workMat, toolMat } = inp;
  if (Vc_u === 'sfm') Vc *= 0.3048;
  if (!Vc && workMat) {
    const base = MECH_MAT.cncVc[workMat] || 200;
    Vc = toolMat === 'hss' ? Math.round(base/4) : base;
  }
  if (D <= 0 || Vc <= 0 || fz <= 0 || z < 1 || ap <= 0 || ae <= 0) return { error: 'Invalid CNC inputs' };
  if (ae > D) return { error: `Radial depth ae=${ae}mm exceeds tool diameter D=${D}mm` };
  const n   = 1000*Vc / (Math.PI*D);
  const f   = fz*z*n;
  const MRR = ae*ap*f / 1000;
  const kc_val = MECH_MAT.cncKc[workMat] || 1500;
  const Pc  = kc_val*ae*ap*f / (60*1e6);
  const tc  = 100 / (f/60);
  return {
    ok: true,
    n: +n.toFixed(0), f: +f.toFixed(0), Vc, fz,
    MRR: +MRR.toFixed(2), Pc: +Pc.toFixed(3), tc_per_100mm: +tc.toFixed(1),
    kc_val, D, ae, ap, z,
    highSpindleWarn: n > 30000 ? `Spindle ${Math.round(n)} rpm is very high. Verify machine maximum.` : null,
    aeWarn: ae > D*0.75 ? `High radial engagement ae/D=${(ae/D*100).toFixed(0)}%. Consider reducing.` : null,
  };
}

function mech_tank(inp) {
  let { D, Du, H, fill_pct, rho, type, thk, liquidKey } = inp;
  if (Du === 'm') D *= 1000; else if (Du === 'ft') D *= 304.8;
  if (liquidKey && MECH_MAT.liquid[liquidKey]) rho = MECH_MAT.liquid[liquidKey];
  const R    = D / 2;
  const fill = fill_pct / 100;
  let V_total = 0, V_fill = 0;
  switch (type) {
    case 'vert-cyl':       V_total = Math.PI*R*R*H/1e6; V_fill = V_total*fill; break;
    case 'horiz-cyl': {
      V_total = Math.PI*R*R*H/1e6;
      const h_fill  = D*fill;
      const theta_h = 2*Math.acos(Math.max(-1, Math.min(1, 1 - 2*h_fill/D)));
      V_fill = (R*R*(theta_h - Math.sin(theta_h))/2) * H/1e6; break;
    }
    case 'rect':           V_total = D*D*H/1e6; V_fill = V_total*fill; break;
    case 'cone':           V_total = Math.PI*R*R*H/3/1e6; V_fill = V_total*Math.pow(fill,3); break;
    case 'sph':            V_total = 4/3*Math.PI*Math.pow(R,3)/1e6; V_fill = V_total*fill; break;
    case 'vert-cyl-heads': {
      const Vcyl = Math.PI*R*R*H/1e6; const Vhead = 2*(Math.PI/12*D*R*R/1e6);
      V_total = Vcyl+Vhead; V_fill = V_total*fill; break;
    }
    default: return { error: 'Unknown tank type' };
  }
  const OD          = D + 2*thk;
  const mass_liquid = V_fill * rho;
  const hydrostatic = rho*9.81*(H/1000)*fill/1e5;
  const V_litre     = V_total * 1000;
  return {
    ok: true,
    V_total_L:      +V_litre.toFixed(1),
    V_fill_L:       +(V_fill*1000).toFixed(1),
    V_total_m3:     +V_total.toFixed(4),
    V_gal:          +(V_litre*0.264172).toFixed(1),
    V_bbls:         +(V_litre/158.987).toFixed(2),
    mass_liquid_kg: +mass_liquid.toFixed(1),
    hydrostatic_bar:+hydrostatic.toFixed(3),
    OD: +OD.toFixed(0), D, H, fill_pct, rho, thk,
  };
}

function mech_cog(inp) {
  const { components } = inp;
  if (!components || components.length === 0) return { error: 'No components provided' };
  let totalM = 0, sumMx = 0, sumMy = 0;
  for (const c of components) { totalM += c.m; sumMx += c.m*c.x; sumMy += c.m*c.y; }
  if (totalM === 0) return { error: 'Total mass is zero' };
  const cogX = sumMx/totalM, cogY = sumMy/totalM;
  return {
    ok: true,
    totalM: +totalM.toFixed(4), weight_N: +(totalM*9.81).toFixed(1),
    cogX: +cogX.toFixed(2), cogY: +cogY.toFixed(2),
    breakdown: components.map(c => ({
      name: c.name, m: c.m, x: c.x, y: c.y,
      pct: +(c.m/totalM*100).toFixed(1),
    })),
  };
}

function mech_beam(inp) {
  let { loadType, section, L, load, a_pos, E, Fy, materialKey,
        b_rect, h_rect, bf, tf, hw, tw, bh, hh, th, dia } = inp;
  const mat = MECH_MAT.beam[materialKey];
  if (mat) { E = mat.E; if (!Fy) Fy = mat.Fy; }
  // Resolve section properties
  let I_mm4, Z_mm3, A_mm2, sectionDesc = '';
  if (MECH_SECTIONS[section]) {
    ({ I: I_mm4, Z: Z_mm3, A: A_mm2 } = MECH_SECTIONS[section]); sectionDesc = section;
  } else if (section === 'rect' && b_rect > 0 && h_rect > 0) {
    I_mm4 = b_rect*Math.pow(h_rect,3)/12; Z_mm3 = b_rect*h_rect*h_rect/6; A_mm2 = b_rect*h_rect;
    sectionDesc = `Rect ${b_rect}×${h_rect} mm`;
  } else if (section === 'circle' && dia > 0) {
    I_mm4 = Math.PI*Math.pow(dia,4)/64; Z_mm3 = Math.PI*Math.pow(dia,3)/32; A_mm2 = Math.PI*dia*dia/4;
    sectionDesc = `Circle ⌀${dia} mm`;
  } else if (section === 'ibeam' && bf > 0 && tf > 0 && hw > 0 && tw > 0) {
    // hw may be overall depth H (from HTML) or pure web height — derive web height
    const hw_web = hw > 2*tf ? hw - 2*tf : hw; // if overall H sent, subtract flanges
    const I_f = 2*(bf*Math.pow(tf,3)/12 + bf*tf*Math.pow((hw_web/2+tf/2),2));
    const I_w = tw*Math.pow(hw_web,3)/12;
    I_mm4 = I_f + I_w; Z_mm3 = I_mm4/((hw_web/2+tf)); A_mm2 = 2*bf*tf + hw_web*tw;
    sectionDesc = `I-beam ${bf}×${tf}f / ${hw_web}×${tw}w mm`;
  } else if (section === 'hollow-rect' && bh > 0 && hh > 0 && th > 0) {
    const bi = bh-2*th, hi = hh-2*th;
    I_mm4 = (bh*Math.pow(hh,3) - bi*Math.pow(hi,3))/12; Z_mm3 = I_mm4/(hh/2); A_mm2 = bh*hh - bi*hi;
    sectionDesc = `Hollow ${bh}×${hh}×${th} mm`;
  } else {
    return { error: 'Unknown section or missing dimensions' };
  }
  if (!I_mm4 || I_mm4 <= 0 || L <= 0 || load <= 0) return { error: 'Invalid beam inputs' };
  const E_Pa  = E * 1e9, I_m4 = I_mm4*1e-12, L_m = L/1000;
  const EI    = E_Pa * I_m4;
  let delta_max_m = 0, M_max_Nm = 0, V_max_N = 0, reaction_A = 0, reaction_B = 0, formulaStr = '';
  if (loadType === 'udl-ss') {
    const w = load;
    delta_max_m = 5*w*Math.pow(L_m,4)/(384*EI); M_max_Nm = w*L_m*L_m/8;
    V_max_N = w*L_m/2; reaction_A = reaction_B = V_max_N; formulaStr = 'δ=5wL⁴/384EI · M=wL²/8';
  } else if (loadType === 'point-ss-mid') {
    const P = load;
    delta_max_m = P*Math.pow(L_m,3)/(48*EI); M_max_Nm = P*L_m/4;
    V_max_N = P/2; reaction_A = reaction_B = P/2; formulaStr = 'δ=PL³/48EI · M=PL/4';
  } else if (loadType === 'point-ss-off') {
    const P = load, a = (a_pos||L/2)/1000, b = L_m-a;
    reaction_A = P*b/L_m; reaction_B = P*a/L_m; M_max_Nm = reaction_A*a; V_max_N = Math.max(reaction_A,reaction_B);
    const tmp = P*a*b*(a+2*b)*Math.sqrt(3*a*(a+2*b));
    delta_max_m = tmp/(27*EI*L_m); formulaStr = 'δ_max=Pa·b·(a+2b)√(3a(a+2b))/27EIL';
  } else if (loadType === 'cantilever-udl') {
    const w = load;
    delta_max_m = w*Math.pow(L_m,4)/(8*EI); M_max_Nm = w*L_m*L_m/2;
    V_max_N = w*L_m; reaction_A = V_max_N; formulaStr = 'δ=wL⁴/8EI · M=wL²/2 (cantilever)';
  } else if (loadType === 'cantilever-point') {
    const P = load;
    delta_max_m = P*Math.pow(L_m,3)/(3*EI); M_max_Nm = P*L_m;
    V_max_N = P; reaction_A = P; formulaStr = 'δ=PL³/3EI · M=PL (cantilever)';
  } else if (loadType === 'fixed-point') {
    // Fixed-fixed, central point load
    const P = load;
    delta_max_m = P*Math.pow(L_m,3)/(192*EI); M_max_Nm = P*L_m/8;
    V_max_N = P/2; reaction_A = reaction_B = P/2; formulaStr = 'δ=PL³/192EI · M=PL/8 (fixed-fixed)';
  } else if (loadType === 'fixed-udl') {
    // Fixed-fixed, UDL
    const w = load;
    delta_max_m = w*Math.pow(L_m,4)/(384*EI); M_max_Nm = w*L_m*L_m/12;
    V_max_N = w*L_m/2; reaction_A = reaction_B = V_max_N; formulaStr = 'δ=wL⁴/384EI · M=wL²/12 (fixed-fixed)';
  } else {
    return { error: 'Unknown load type' };
  }
  const sigma   = Z_mm3 > 0 ? M_max_Nm*1e3/Z_mm3 : 0;
  const dLimit  = L_m / 360;
  const Fy_Pa   = (Fy||250) * 1e6;
  const ok      = sigma <= Fy_Pa && delta_max_m <= dLimit;
  return {
    ok,
    Mmax: +(M_max_Nm/1000).toFixed(3), Vmax: +(V_max_N/1000).toFixed(3),
    delta_mm: +(delta_max_m*1000).toFixed(3), dLimit_mm: +(dLimit*1000).toFixed(3),
    sigma_MPa: +(sigma/1e6).toFixed(2), Fy_MPa: Fy||250,
    sf: +(Fy_Pa/Math.max(sigma,1)).toFixed(3),
    EI_kNm2: +(EI/1e3).toFixed(1),
    reaction_A_kN: +(reaction_A/1000).toFixed(3), reaction_B_kN: +(reaction_B/1000).toFixed(3),
    I_mm4: I_mm4.toExponential(3), Z_mm3: Z_mm3.toExponential(3), A_mm2,
    E_GPa: E, L_m: +L_m.toFixed(3), sectionDesc, formulaStr,
    stressFail: sigma > Fy_Pa, deflFail: delta_max_m > dLimit,
  };
}

function mech_materialProps(inp) {
  const { category, key } = inp;
  const cat = MECH_MAT[category];
  if (!cat) return { ok: false, error: `Unknown category "${category}"` };
  if (key) {
    if (cat[key] !== undefined) return { ok: true, props: cat[key] };
    return { ok: false, error: `Key "${key}" not found in "${category}"` };
  }
  return { ok: true, keys: Object.keys(cat) };
}

// ── Route handler ─────────────────────────────────────────────────

// ========================================================================
// SECTION: MECHANICAL
// ========================================================================

async function handle_mechanical_engineering(body, res) {
  const { calculator, inputs } = body || {};
  if (!calculator || !inputs) {
    return res.status(400).json({ ok: false, error: 'Missing "calculator" or "inputs" in request body.' });
  }
  let result;
  try {
    switch (calculator) {
      case 'pressure-vessel': result = mech_pressureVessel(inputs); break;
      case 'bolt-flange':     result = mech_boltFlange(inputs);     break;
      case 'weld':            result = mech_weld(inputs);           break;
      case 'gear':            result = mech_gear(inputs);           break;
      case 'shaft':           result = mech_shaft(inputs);          break;
      case 'sheet-metal':     result = mech_sheetMetal(inputs);     break;
      case 'spring':          result = mech_spring(inputs);         break;
      case 'fastener':        result = mech_fastener(inputs);       break;
      case 'cnc':             result = mech_cnc(inputs);            break;
      case 'tank':            result = mech_tank(inputs);           break;
      case 'cog':             result = mech_cog(inputs);            break;
      case 'beam':            result = mech_beam(inputs);           break;
      case 'material-props':  result = mech_materialProps(inputs);  break;
      default:
        return res.status(400).json({ ok: false, error: `Unknown calculator: "${calculator}"` });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Calculation error: ' + err.message });
  }
  if (result && result.error) return res.status(422).json({ ok: false, error: result.error });
  return res.status(200).json({ ok: true, results: result });
}




// ================================================================

// ════════════════════════════════════════════════════════════════════════════
// Vercel handler — dispatches to handle_mechanical_engineering
// ════════════════════════════════════════════════════════════════════════════
async function mechanical_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = req.method === 'POST' ? req.body : {};
  if (req.method === 'POST' && (!body || typeof body !== 'object'))
    return res.status(400).json({ error: 'Invalid request body.' });

  try {
    return await handle_mechanical_engineering(body, res);
  } catch (e) {
    console.error('[mechanical-engineering-calculators.js] Unhandled error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

// ── End of Section 20: Mechanical Engineering Calculators ──────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION 21 of 21  ►  MATERIAL OF CONSTRUCTION (MOC)
// Route: /api/moc
// Source: moc.js
// ══════════════════════════════════════════════════════════════════════════════

// MOC (Material of Construction) ENGINE
// Routes: GET  /api/moc  → catalog (equipment, industries, fluids)
//         POST /api/moc  → analyze (scoring engine, returns results)
// ================================================================

/* ── EQUIPMENT ── */
const EQUIPMENT = [
  {id:'pipe',       icon:'🔧', name:'Pipe / Tubing'},
  {id:'vessel',     icon:'🏺', name:'Storage Vessel'},
  {id:'pv',         icon:'🫙', name:'Pressure Vessel'},
  {id:'hx',         icon:'♨️',  name:'Heat Exchanger'},
  {id:'sep',        icon:'⚗️',  name:'Separator'},
  {id:'column',     icon:'🏛️', name:'Distill. Column'},
  {id:'reactor',    icon:'⚡', name:'Reactor'},
  {id:'pump',       icon:'💧', name:'Pump Casing'},
  {id:'compressor', icon:'⚙️', name:'Compressor'},
  {id:'tank',       icon:'🛢️', name:'Storage Tank'},
  {id:'coil',       icon:'🔩', name:'Coil / Jacket'},
  {id:'valve',      icon:'🔑', name:'Valve Body'},
  {id:'nozzle',     icon:'💨', name:'Nozzle / Fitting'},
  {id:'condenser',  icon:'❄️', name:'Condenser'},
  {id:'reboiler',   icon:'🔥', name:'Reboiler'},
  {id:'filter',     icon:'🗂️', name:'Filter / Strainer'},
];

/* ── INDUSTRIES ── */
const INDUSTRIES = ['All','Oil & Gas','Chemical','Petrochemical','Water','Power','Food & Bev','Pharma','Mining'];

/* ── FLUID LIBRARY — PROTECTED ── */
const FLUIDS = [
  {id:'crude',       name:'Crude Oil',              sub:'Sour / sweet',      color:'#3a2800', ind:'Oil & Gas',      corr:'moderate', acid:false, alkali:false, h2s:true,  cl:false},
  {id:'nat_gas',     name:'Natural Gas (Dry)',       sub:'Non-corrosive',     color:'#6b5a00', ind:'Oil & Gas',      corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'h2s_gas',     name:'H₂S (Sour Gas)',         sub:'Wet sour service',  color:'#8a4000', ind:'Oil & Gas',      corr:'severe',   acid:true,  alkali:false, h2s:true,  cl:false},
  {id:'diesel',      name:'Diesel / Fuel Oil',      sub:'Refined product',   color:'#5a4000', ind:'Oil & Gas',      corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'h2so4',       name:'Sulphuric Acid H₂SO₄',  sub:'All concentrations',color:'#8a0000', ind:'Chemical',       corr:'severe',   acid:true,  alkali:false, h2s:false, cl:false},
  {id:'hcl',         name:'Hydrochloric Acid HCl',  sub:'All concentrations',color:'#6b0000', ind:'Chemical',       corr:'severe',   acid:true,  alkali:false, h2s:false, cl:true},
  {id:'hno3',        name:'Nitric Acid HNO₃',       sub:'All concentrations',color:'#7a2000', ind:'Chemical',       corr:'severe',   acid:true,  alkali:false, h2s:false, cl:false},
  {id:'naoh',        name:'Caustic Soda NaOH',      sub:'All concentrations',color:'#004060', ind:'Chemical',       corr:'moderate', acid:false, alkali:true,  h2s:false, cl:false},
  {id:'hf',          name:'Hydrofluoric Acid HF',   sub:'Alkylation units',  color:'#8a0000', ind:'Petrochemical',  corr:'severe',   acid:true,  alkali:false, h2s:false, cl:false},
  {id:'h3po4',       name:'Phosphoric Acid H₃PO₄',  sub:'All concentrations',color:'#6b4000', ind:'Chemical',       corr:'severe',   acid:true,  alkali:false, h2s:false, cl:false},
  {id:'water_sw',    name:'Seawater',               sub:'Cl⁻ ~18,000 ppm',  color:'#004080', ind:'Water',          corr:'severe',   acid:false, alkali:false, h2s:false, cl:true},
  {id:'water_fw',    name:'Fresh Water',            sub:'General service',   color:'#0066cc', ind:'Water',          corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'water_bw',    name:'Boiler Feed Water',      sub:'Demineralised',     color:'#003366', ind:'Power',          corr:'moderate', acid:false, alkali:false, h2s:false, cl:false},
  {id:'water_cl',    name:'Cooling Water (CW)',     sub:'Treated CW',        color:'#00668a', ind:'Water',          corr:'moderate', acid:false, alkali:false, h2s:false, cl:true},
  {id:'steam',       name:'Steam (Process)',        sub:'Saturated/super',   color:'#6b6b6b', ind:'Power',          corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'milk',        name:'Milk / Dairy',           sub:'Sanitary grade',    color:'#b8a060', ind:'Food & Bev',     corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'ethanol',     name:'Ethanol / Alcohol',      sub:'Fermentation',      color:'#8a6000', ind:'Food & Bev',     corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'pharma',      name:'WFI / Pharma Media',     sub:'USP grade',         color:'#6b4080', ind:'Pharma',         corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'benzene',     name:'Benzene / Aromatics',    sub:'Carcinogenic',      color:'#4a3a00', ind:'Petrochemical',  corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'fgd',         name:'FGD Slurry (Gypsum)',    sub:'Power plant',       color:'#808060', ind:'Power',          corr:'moderate', acid:true,  alkali:false, h2s:false, cl:true},
  {id:'lox',         name:'Liquid Oxygen LOX',      sub:'Cryogenic',         color:'#0080cc', ind:'Chemical',       corr:'moderate', acid:false, alkali:false, h2s:false, cl:false},
  {id:'lng',         name:'LNG / LPG',              sub:'Cryogenic',         color:'#00666b', ind:'Oil & Gas',      corr:'low',      acid:false, alkali:false, h2s:false, cl:false},
  {id:'brine',       name:'Produced Water / Brine', sub:'High Cl⁻',         color:'#6b6b00', ind:'Oil & Gas',      corr:'severe',   acid:false, alkali:false, h2s:true,  cl:true},
  {id:'co2',         name:'CO₂ / Carbonic Acid',   sub:'Wet CO₂',           color:'#666699', ind:'Oil & Gas',      corr:'moderate', acid:true,  alkali:false, h2s:false, cl:false},
  {id:'amine',       name:'Amine (MEA/DEA/MDEA)',   sub:'H₂S absorption',    color:'#336633', ind:'Oil & Gas',      corr:'moderate', acid:false, alkali:true,  h2s:true,  cl:false},
  {id:'acid_mine',   name:'Acid Mine Drainage',     sub:'pH 1–4',            color:'#8a4000', ind:'Mining',         corr:'severe',   acid:true,  alkali:false, h2s:false, cl:true},
  {id:'sulfur',      name:'Molten Sulfur',          sub:'130–160°C',         color:'#b8a000', ind:'Petrochemical',  corr:'severe',   acid:false, alkali:false, h2s:true,  cl:false},
  {id:'nh3',         name:'Ammonia NH₃',            sub:'Anhydrous/aqueous', color:'#006b4a', ind:'Chemical',       corr:'moderate', acid:false, alkali:true,  h2s:false, cl:false},
  {id:'cl2',         name:'Chlorine Gas Cl₂',       sub:'Wet / Dry',         color:'#5a6b00', ind:'Chemical',       corr:'severe',   acid:false, alkali:false, h2s:false, cl:true},
  {id:'chlorine_sol',name:'Brine / NaCl Solution',  sub:'Chlor-alkali',      color:'#006633', ind:'Chemical',       corr:'moderate', acid:false, alkali:false, h2s:false, cl:true},
];

/* ── FLUID AUTOFILL HINTS (UX only — no engine logic) ── */
const FLUID_AUTOFILL = {
  h2so4:{pH:1,H2S:0,Cl:0}, hcl:{pH:1,H2S:0,Cl:100000}, hno3:{pH:1,H2S:0,Cl:0},
  h3po4:{pH:2,H2S:0,Cl:0}, co2:{pH:5,H2S:0,Cl:0}, naoh:{pH:13,H2S:0,Cl:0},
  nh3:{pH:11,H2S:0,Cl:0}, acid_mine:{pH:2,H2S:0,Cl:0}, water_sw:{pH:8,H2S:0,Cl:18000},
  water_fw:{pH:7,H2S:0,Cl:0}, water_bw:{pH:9.5,H2S:0,Cl:0}, water_cl:{pH:7.5,H2S:0,Cl:200},
  brine:{pH:7,H2S:0.005,Cl:50000}, crude:{pH:6,H2S:0.01,Cl:0}, h2s_gas:{pH:5,H2S:0.1,Cl:0},
  amine:{pH:9,H2S:0.005,Cl:0}, sulfur:{pH:5,H2S:0.05,Cl:0}, fgd:{pH:4,H2S:0,Cl:0},
  chlorine_sol:{pH:7,H2S:0,Cl:15000}, cl2:{pH:6,H2S:0,Cl:10000},
  lox:{pH:7,H2S:0,Cl:0}, lng:{pH:7,H2S:0,Cl:0}, milk:{pH:6.5,H2S:0,Cl:0},
  ethanol:{pH:7,H2S:0,Cl:0}, benzene:{pH:7,H2S:0,Cl:0},
};

/* ── MATERIAL DATABASE — PROTECTED ── */
const MATERIALS = {
  CS_A106:   {id:'CS_A106',   group:'Carbon Steel',   color:'#5a3e00',name:'Carbon Steel A106',        grade:'ASTM A106 Gr.B / IS 2062 Gr.B',           std:'ASTM A106, A53, IS:2062',      cost_idx:1.0,  t_min:-29, t_max:425, p_max:400,composition:{C:'0.30 max',Mn:'0.29–1.06',P:'0.048 max',S:'0.058 max',Si:'0.10 min',Fe:'Balance'},pros:['Lowest cost','Widely available','Easy to weld','Good for dry non-corrosive service'],cons:['Not for wet/corrosive service','Not for acids/alkalis','Corrosion allowance required'],suits:['nat_gas','diesel','steam','water_bw','lng'],avoids:['h2so4','hcl','hno3','water_sw','cl2','fgd','acid_mine'],desc:'Standard carbon steel for non-corrosive service. Most economical option. Widely used in oil & gas for dry service.',tags:['Low Alloy','Weldable','General Service']},
  MS_Fe410:  {id:'MS_Fe410',  group:'Mild Steel',     color:'#7a5a00',name:'Mild Steel IS 2062',        grade:'IS 2062 E250/E350 (Fe410)',                std:'IS:2062, BS EN 10025',          cost_idx:0.9,  t_min:-10, t_max:350, p_max:150,composition:{C:'0.23 max',Mn:'1.50 max',P:'0.045 max',S:'0.045 max',Si:'0.40 max',Fe:'Balance'},pros:['Very low cost','Excellent weldability','Good machinability'],cons:['Very prone to corrosion','Not for corrosive service','Limited temperature'],suits:['nat_gas','diesel','benzene'],avoids:['h2so4','hcl','water_sw','water_fw','cl2','brine'],desc:'General structural steel. Lowest cost but poorest corrosion resistance. For structural/non-process components.',tags:['Structural','Low Cost','Non-Corrosive Only']},
  LAS_P11:   {id:'LAS_P11',   group:'Low Alloy Steel',color:'#4a3000',name:'Low Alloy Steel Cr-Mo',     grade:'ASTM A335 P11 / P22',                     std:'ASTM A335, A387',               cost_idx:2.5,  t_min:-29, t_max:600, p_max:600,composition:{C:'0.05–0.15',Cr:'1.00–1.50',Mo:'0.44–0.65',Mn:'0.30–0.60',Si:'0.50–1.00',Fe:'Balance'},pros:['High temperature service','Good creep resistance','HTHA resistance per API 941 Nelson curves'],cons:['PWHT required','Not for corrosive service'],suits:['steam','nat_gas','diesel'],avoids:['h2so4','hcl','water_sw'],desc:'Cr-Mo alloy steel for high-temperature, high-pressure service. Refinery heaters, steam piping above 400°C.',tags:['High Temp','Cr-Mo','Creep Resistant']},
  SS_304:    {id:'SS_304',    group:'Stainless Steel',color:'#6a8a9a',name:'Stainless Steel 304',        grade:'ASTM A312 TP304 / UNS S30400',             std:'ASTM A312, A240, IS:6913',      cost_idx:4.5,  t_min:-196,t_max:870, p_max:400,composition:{C:'0.08 max',Cr:'18.0–20.0',Ni:'8.0–10.5',Mn:'2.0 max',Si:'0.75 max',N:'0.10 max',Fe:'Balance'},pros:['Good general corrosion resistance','Food/pharma grade','Wide temperature range'],cons:['Cl SCC above ~60°C','Not for HCl or HF'],suits:['water_fw','steam','milk','ethanol','pharma','naoh','nh3','nat_gas'],avoids:['hcl','hf','water_sw','brine','cl2','acid_mine'],desc:'Austenitic SS for moderate corrosion, food, pharma, and general process. Avoid chloride-rich environments at elevated temperature.',tags:['Austenitic','Food Grade','General Corrosion']},
  SS_316L:   {id:'SS_316L',   group:'Stainless Steel',color:'#5a7a8a',name:'Stainless Steel 316L',       grade:'ASTM A312 TP316L / UNS S31603',            std:'ASTM A312, A240, IS:6913',      cost_idx:5.5,  t_min:-196,t_max:870, p_max:400,composition:{C:'0.035 max',Cr:'16.0–18.0',Ni:'10.0–14.0',Mo:'2.0–3.0',Mn:'2.0 max',Fe:'Balance'},pros:['Better chloride resistance than 304 (Mo addition)','Low C — no sensitisation','Pharma/food grade'],cons:['Cl SCC risk above 60°C','Not for concentrated HCl/HF'],suits:['water_fw','water_cl','steam','milk','ethanol','pharma','naoh','nh3','co2','amine'],avoids:['hcl','hf','water_sw','cl2','acid_mine'],desc:'Mo-bearing austenitic SS. Preferred over 304 for moderate chloride, pharma, and food process service.',tags:['Austenitic','Mo-Bearing','Low Carbon','Pharma']},
  SS_317L:   {id:'SS_317L',   group:'Stainless Steel',color:'#5070a0',name:'Stainless Steel 317L',       grade:'ASTM A312 TP317L / UNS S31703',            std:'ASTM A312, A240',               cost_idx:6.5,  t_min:-196,t_max:870, p_max:400,composition:{C:'0.035 max',Cr:'18.0–20.0',Ni:'11.0–15.0',Mo:'3.0–4.0',Mn:'2.0 max',Fe:'Balance'},pros:['Higher Mo than 316L — better Cl resistance','Good for dilute acids','FGD service'],cons:['Higher cost than 316L','Still susceptible to high-Cl SCC'],suits:['water_cl','co2','fgd','amine','h3po4'],avoids:['hcl','water_sw','cl2','hf','acid_mine'],desc:'Higher Mo than 316L. FGD systems, phosphoric acid, moderately aggressive chloride environments.',tags:['High Mo','FGD','Acid Resistant']},
  SS_321:    {id:'SS_321',    group:'Stainless Steel',color:'#7a90a0',name:'Stainless Steel 321',         grade:'ASTM A312 TP321 / UNS S32100',             std:'ASTM A312, A240',               cost_idx:5.8,  t_min:-196,t_max:900, p_max:400,composition:{C:'0.08 max',Cr:'17.0–19.0',Ni:'9.0–12.0',Ti:'5×C min',Mn:'2.0 max',Fe:'Balance'},pros:['Ti-stabilised — excellent sensitisation resistance','High-temp welded assemblies'],cons:['Similar Cl SCC risk as 304','Not for highly corrosive media'],suits:['steam','nat_gas','diesel','amine','co2'],avoids:['hcl','water_sw','cl2','hf'],desc:'Ti-stabilised austenitic SS for welded construction at elevated temperatures. Refinery HX, furnace tubing.',tags:['Ti-Stabilised','Weld Service','High Temp']},
  DSS_2205:  {id:'DSS_2205',  group:'Duplex SS',      color:'#304870',name:'Duplex SS 2205',              grade:'ASTM A790 UNS S31803/S32205',              std:'ASTM A790, A928',               cost_idx:8.5,  t_min:-50, t_max:315, p_max:500,composition:{C:'0.03 max',Cr:'21.0–23.0',Ni:'4.5–6.5',Mo:'2.5–3.5',N:'0.08–0.20',Fe:'Balance'},pros:['Excellent Cl SCC resistance (PREN~35)','High strength — thinner walls','Good pitting resistance'],cons:['Max 315°C (sigma phase)','Higher cost','Welding care needed'],suits:['water_sw','brine','water_cl','crude','amine','co2','h3po4'],avoids:['hcl','hf','cl2','h2so4'],desc:'Duplex SS for excellent seawater, brine, and chloride resistance where austenitic grades fail by SCC.',tags:['Duplex','Seawater','High Strength','SCC Resistant']},
  SDSS_2507: {id:'SDSS_2507', group:'Duplex SS',      color:'#203060',name:'Super Duplex SS 2507',        grade:'ASTM A790 UNS S32750',                     std:'ASTM A790, A928',               cost_idx:12.0, t_min:-50, t_max:300, p_max:500,composition:{C:'0.03 max',Cr:'24.0–26.0',Ni:'6.0–8.0',Mo:'3.0–5.0',N:'0.24–0.32',Fe:'Balance'},pros:['Highest PREN ~42','Extreme Cl/seawater resistance','Very high strength'],cons:['Most expensive standard SS','Strict welding','Max 300°C'],suits:['water_sw','brine','crude','h2s_gas'],avoids:['hcl','hf','cl2'],desc:'Super Duplex for most aggressive chloride environments. Subsea pipelines, topside processing.',tags:['Super Duplex','Subsea','Extreme Cl Resistance']},
  Inconel625:{id:'Inconel625',group:'Nickel Alloy',   color:'#1a5060',name:'Alloy 625 (Inconel 625)',     grade:'ASTM B444 UNS N06625',                     std:'ASTM B444, B705',               cost_idx:25.0, t_min:-196,t_max:980, p_max:500,composition:{Ni:'58 min',Cr:'20.0–23.0',Mo:'8.0–10.0',Nb:'3.15–4.15',Fe:'5.0 max',Co:'1.0 max'},pros:['Exceptional corrosion resistance','Wide temp range','No Cl SCC','Excellent HCl and H₂SO₄'],cons:['Very high cost','Limited availability'],suits:['hcl','h2so4','water_sw','brine','cl2','acid_mine','hf'],avoids:[],desc:'Ni-based superalloy. Premium MOC for aggressive acids, seawater, and high-temperature corrosive service.',tags:['Ni-Alloy','Premium','All Corrosives','High Temp']},
  Hast_C276: {id:'Hast_C276', group:'Nickel Alloy',   color:'#0a2840',name:'Hastelloy C-276',             grade:'ASTM B574 UNS N10276',                     std:'ASTM B574, B619',               cost_idx:30.0, t_min:-196,t_max:1040,p_max:500,composition:{Ni:'57 min',Mo:'15.0–17.0',Cr:'14.5–16.5',W:'3.0–4.5',Fe:'4.0–7.0',Co:'2.5 max'},pros:['Best all-round acid resistance','Excellent HCl','Chlorine and halogen service'],cons:['Extremely high cost','Specialist procurement only'],suits:['hcl','h2so4','hno3','cl2','acid_mine','hf','h2s_gas'],avoids:[],desc:'Gold standard Ni-Mo-Cr alloy for severe corrosion. Virtually immune to pitting/crevice/SCC.',tags:['Hastelloy','Best Corrosion','Severe Duty']},
  Ti_Gr2:    {id:'Ti_Gr2',    group:'Titanium',       color:'#505060',name:'Titanium Grade 2',            grade:'ASTM B338 Grade 2 / UNS R50400',           std:'ASTM B338, B265',               cost_idx:20.0, t_min:-196,t_max:260, p_max:300,composition:{Ti:'99.2 min',Fe:'0.30 max',O:'0.25 max',C:'0.08 max',N:'0.03 max'},pros:['Immune to Cl SCC','Excellent seawater/Cl service','Lightweight (4.5 g/cm³)'],cons:['High cost','Max 260°C','Not for reducing acids or fluoride (HF)'],suits:['water_sw','water_cl','brine','cl2','hno3'],avoids:['hf','hcl'],desc:'Commercially pure titanium. Standard for seawater HX, condenser tubes, and chloride-rich offshore environments.',tags:['Titanium','Seawater','SCC Immune','Lightweight']},
  Zirconium: {id:'Zirconium', group:'Special Alloy',  color:'#707050',name:'Zirconium 702',               grade:'ASTM B523 UNS R60702',                     std:'ASTM B523',                     cost_idx:40.0, t_min:-196,t_max:370, p_max:300,composition:{Zr:'99.2 min (+ Hf)',Hf:'4.5 max',Fe:'0.20 max',O:'0.16 max'},pros:['Best for hot concentrated HCl','H₂SO₄ resistance','Acetic acid production'],cons:['Highest cost','Ignition risk in some oxidising acids'],suits:['hcl','h2so4','h3po4'],avoids:['hf','cl2'],desc:'Specialty alloy for hot concentrated HCl and sulfuric acid.',tags:['Special','Hot HCl','Sulphuric Acid']},
  HDPE:      {id:'HDPE',      group:'Polymer',        color:'#005533',name:'HDPE PE100',                   grade:'PE100 / ASTM D3035 / ISO 4427',            std:'ASTM D3035, ISO 4427',          cost_idx:0.8,  t_min:-50, t_max:60,  p_max:16, composition:{PE:'High Density Polyethylene',Density:'0.941–0.965 g/cm³',MFI:'0.2–1.0 g/10min',SDR:'11–26 typical'},pros:['Excellent acid/alkali resistance','Very low cost','No corrosion','Lightweight'],cons:['Max 60°C','Low pressure (<16 bar)','UV degradation outdoors'],suits:['water_fw','water_sw','water_cl','hcl','h2so4','naoh','nh3','acid_mine','h3po4','chlorine_sol'],avoids:['steam','lox','sulfur','lng'],desc:'HDPE for cold corrosive service. Water supply, acid distribution lines, chemical transport.',tags:['Polymer','Acid Resistant','Low Cost','Water']},
  PP:        {id:'PP',        group:'Polymer',        color:'#003388',name:'Polypropylene PP',             grade:'PP-H / PP-R (DIN 8077 / ISO 15494)',       std:'DIN 8077, ISO 15494',           cost_idx:0.9,  t_min:0,   t_max:80,  p_max:10, composition:{PP:'Polypropylene homopolymer/random copolymer',Density:'0.895–0.920 g/cm³',MFR:'0.3–3 g/10min'},pros:['Broad chemical resistance','Slightly higher temp than HDPE','Hygienic surface'],cons:['Brittle below 0°C','Max 80°C','Low pressure (<10 bar)'],suits:['water_fw','water_cl','hcl','h2so4','naoh','nh3','h3po4','milk','ethanol','acid_mine'],avoids:['steam','lox','sulfur','benzene','cl2'],desc:'Polypropylene piping for chemical, water treatment, and food/beverage service.',tags:['Polymer','Chemical Resistant','Low Pressure']},
  PVDF:      {id:'PVDF',      group:'Polymer',        color:'#440055',name:'PVDF / Kynar',                 grade:'ASTM D3222 Type I / DIN 16968',            std:'ASTM D3222',                    cost_idx:8.0,  t_min:-40, t_max:140, p_max:12, composition:{PVDF:'Polyvinylidene Fluoride',Density:'1.76–1.78 g/cm³',MW:'180,000–500,000'},pros:['Excellent halogen and acid resistance','Higher temp than PP/HDPE','Semiconductor-grade purity'],cons:['High cost for polymer','UV sensitive','Low pressure (<12 bar)'],suits:['hcl','cl2','water_fw','h3po4','pharma','h2so4'],avoids:['steam','lox','hno3'],desc:'Fluoropolymer for aggressive halogen and acid service.',tags:['Fluoropolymer','Halogen Resistant','Pharma']},
  FRP_VE:    {id:'FRP_VE',    group:'FRP/GRP',        color:'#006633',name:'FRP Vinyl Ester',              grade:'ASTM D5364 / ASME RTP-1',                  std:'ASME RTP-1, BS 4994',           cost_idx:3.5,  t_min:-40, t_max:100, p_max:6,  composition:{Matrix:'Vinyl Ester Resin',Reinforcement:'E-glass or C-glass',CorrosionBarrier:'2–3mm rich barrier',Laminate:'Filament wound'},pros:['Excellent acid/brine resistance','Lightweight','Large vessels cost-effective'],cons:['Pressure limited (<6 bar vessel)','Max ~100°C','Brittle — impact sensitive'],suits:['hcl','h2so4','water_sw','brine','h3po4','acid_mine','water_cl','fgd'],avoids:['steam','lox','benzene','cl2'],desc:'FRP with vinyl ester resin for FGD absorbers, acid storage tanks, and chemical process vessels.',tags:['FRP','Acid Resistant','Large Vessel','Lightweight']},
  CuNi_7030: {id:'CuNi_7030',group:'Copper Alloy',   color:'#c87c40',name:'Cupro-Nickel 70/30',           grade:'ASTM B466 UNS C71500',                     std:'ASTM B466, B111',               cost_idx:15.0, t_min:-196,t_max:260, p_max:200,composition:{Cu:'65–70%',Ni:'29–33%',Fe:'0.40–1.0',Mn:'1.0 max'},pros:['Excellent seawater resistance','Biofouling resistance','Standard HX tube for seawater condensers'],cons:['Not for oxidising acids','NH₃/amine attack susceptibility'],suits:['water_sw','water_fw','water_cl'],avoids:['h2so4','hcl','nh3','h2s_gas','crude'],desc:'70/30 Cu-Ni. Standard tube material for seawater-cooled HX, condensers, and desalination plants.',tags:['Cu-Ni','Seawater','HX Tubes','Marine']},
  Monel_400: {id:'Monel_400', group:'Nickel Alloy',   color:'#508060',name:'Monel 400',                    grade:'ASTM B165 UNS N04400',                     std:'ASTM B165, B127',               cost_idx:18.0, t_min:-196,t_max:480, p_max:400,composition:{Ni:'63 min',Cu:'28.0–34.0',Fe:'2.5 max',Mn:'2.0 max'},pros:['Excellent HF acid resistance','Good seawater resistance','HF alkylation unit standard'],cons:['SCC in moist aerated HF vapour','High cost'],suits:['hf','water_sw','crude','nat_gas'],avoids:['hno3','cl2'],desc:'Ni-Cu alloy. Industry standard for HF alkylation units.',tags:['Monel','HF Service','Ni-Cu','Alkylation']},
};

/* ── CORROSION RATES — PROTECTED ── */
const CORR_RATES = {
  'Carbon Steel':   {low:0.05, moderate:0.3,  severe:2.0},
  'Mild Steel':     {low:0.07, moderate:0.4,  severe:2.5},
  'Stainless Steel':{low:0.005,moderate:0.05, severe:0.5},
  'Duplex SS':      {low:0.002,moderate:0.02, severe:0.15},
  'Nickel Alloy':   {low:0.001,moderate:0.01, severe:0.05},
  'Titanium':       {low:0.001,moderate:0.005,severe:0.02},
  'Copper Alloy':   {low:0.02, moderate:0.1,  severe:0.8},
  'Polymer':        {low:0.0,  moderate:0.0,  severe:0.0},
  'FRP/GRP':        {low:0.0,  moderate:0.0,  severe:0.0},
  'Special Alloy':  {low:0.001,moderate:0.005,severe:0.02},
};

// ══════════════════════════════════════════════════════════════════════
//  ENGINE FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

function getCorrSufficiency(mat, fluidCorr, life) {
  const rates = CORR_RATES[mat.group];
  if (!rates) return null;
  const rate      = rates[fluidCorr] || rates['moderate'];
  if (rate === 0) return {rate:0,totalLoss:0,minCA:0,adequate:true,note:'Polymer/FRP — no metallic corrosion allowance required.'};
  const totalLoss = rate * life;
  const minCA     = Math.ceil(totalLoss * 10) / 10;
  const minWall   = mat.group==='Nickel Alloy' ? 1.6 : mat.group==='Titanium' ? 0.9 : 3.0;
  const adequate  = minCA <= (minWall * 0.5);
  return {rate, totalLoss:totalLoss.toFixed(2), minCA:minCA.toFixed(1), adequate,
    note: adequate
      ? `Est. total loss ${totalLoss.toFixed(2)} mm over ${life} yr. Min corrosion allowance: ${minCA.toFixed(1)} mm.`
      : `⚠ Est. total loss ${totalLoss.toFixed(2)} mm over ${life} yr — corrosion allowance ${minCA.toFixed(1)} mm may be impractical. Consider upgrading material.`
  };
}

function scoreFluidMaterial(fluidId, mat, T, P, pH, Cl, H2S, V, costPrio, equipId, industry) {
  let score = 100;
  const f = FLUIDS.find(x => x.id === fluidId);
  if (!f) return 0;

  if (mat.avoids && mat.avoids.includes(fluidId)) return -1;
  if (T > mat.t_max || T < mat.t_min) return -1;
  if (P > mat.p_max) return -1;

  if (mat.suits && mat.suits.includes(fluidId)) score += 30;

  if (f.corr==='severe'   && mat.group==='Carbon Steel') score -= 40;
  if (f.corr==='severe'   && mat.group==='Mild Steel')   score -= 50;
  if (f.corr==='moderate' && mat.group==='Carbon Steel') score -= 20;
  if (f.corr==='low'      && (mat.group==='Carbon Steel'||mat.group==='Mild Steel')) score += 10;

  if (Cl > 200 && T > 60) {
    if (['SS_304','SS_316L','SS_317L','SS_321'].includes(mat.id)) score -= 35;
    if (['DSS_2205','SDSS_2507'].includes(mat.id)) score += 15;
    if (mat.id==='Ti_Gr2') score += 20;
  }
  if (Cl > 5000) {
    if (['SS_304','SS_316L','SS_317L','SS_321'].includes(mat.id)) return -1;
    if (['DSS_2205','SDSS_2507'].includes(mat.id)) score += 10;
  }

  if (H2S > 0.0003) {
    if (mat.group==='Carbon Steel' && T > 60)  score -= 20;
    if (mat.group==='Carbon Steel' && pH < 5)  return -1;
    if (H2S > 0.1 && (mat.group==='Carbon Steel'||mat.group==='Mild Steel')) return -1;
    if (['Inconel625','Hast_C276','Monel_400'].includes(mat.id)) score += 12;
    if (['DSS_2205','SDSS_2507'].includes(mat.id)) score += 8;
  }

  if (pH < 3) {
    if (mat.group==='Carbon Steel') score -= 30;
    if (mat.group==='Mild Steel')   score -= 35;
    if (['Inconel625','Hast_C276','Zirconium'].includes(mat.id)) score += 20;
    if (['HDPE','PP','FRP_VE'].includes(mat.id) && T < mat.t_max) score += 15;
  }
  if (pH > 11) {
    if (['Inconel625','SS_304','SS_316L'].includes(mat.id)) score += 8;
  }

  if (T > 250 && mat.group==='Polymer')  return -1;
  if (T > 300 && mat.group==='FRP/GRP')  return -1;
  if (T > 280 && mat.group==='Duplex SS') return -1;
  if (T > 425 && mat.id==='SS_304') score -= 25;
  if (T > 400 && ['SS_304','SS_316L','DSS_2205'].includes(mat.id)) score -= 10;
  if (T > 500 && mat.id==='LAS_P11') score += 20;

  const hthafluids = ['h2s_gas','crude','nat_gas','benzene','diesel','lng'];
  if (T > 230 && mat.group==='Carbon Steel' && hthafluids.includes(fluidId)) score -= 20;

  if (['co2','brine','crude','amine'].includes(fluidId) && H2S > 0.0003) {
    if (mat.group==='Carbon Steel'||mat.group==='Mild Steel') score -= 20;
    if (mat.group==='Stainless Steel') score += 5;
  }

  if (['water_fw','water_cl','water_sw','acid_mine'].includes(fluidId) &&
      (mat.group==='Carbon Steel'||mat.group==='Mild Steel')) score -= 15;

  if (V > 3  && ['Polymer','FRP/GRP'].includes(mat.group)) score -= 10;
  if (V > 5  && ['Polymer','FRP/GRP'].includes(mat.group)) score -= 15;
  if (V > 5  && mat.group==='Copper Alloy') score -= 20;
  if (V > 10 && mat.group==='Carbon Steel') score -= 10;
  if (V > 15 && mat.group==='Carbon Steel') score -= 20;
  if (V > 20 && mat.group==='Stainless Steel') score -= 10;

  if (equipId) {
    if (['vessel','pv','pipe'].includes(equipId) && ['Pharmaceutical','Food & Beverage'].includes(industry)) {
      if (['SS_304','SS_316L'].includes(mat.id)) score += 15;
      if (mat.group==='Carbon Steel'||mat.group==='Mild Steel') score -= 25;
    }
    if (['hx','condenser'].includes(equipId)) {
      if (mat.id==='Ti_Gr2')    score += 10;
      if (mat.id==='CuNi_7030') score += 8;
      if (mat.group==='FRP/GRP') score -= 20;
    }
    if (equipId==='pump') {
      if (mat.group==='Duplex SS') score += 8;
      if (mat.group==='Polymer')   score -= 10;
    }
    if (equipId==='tank' && P > 2 && mat.group==='Polymer') score -= 20;
    if (['column','reactor'].includes(equipId) && Cl > 500) {
      if (mat.group==='Stainless Steel') score -= 8;
      if (mat.group==='Duplex SS')       score += 5;
    }
    if (equipId==='reboiler' && T > 350) {
      if (mat.group==='Low Alloy Steel'||mat.id==='LAS_P11') score += 10;
      if (mat.group==='Carbon Steel' && T > 400) score -= 20;
    }
  }

  if (costPrio==='economy')     score = Math.max(10, score - mat.cost_idx * 3);
  if (costPrio==='performance') score += mat.cost_idx * 0.5;

  return Math.max(0, Math.min(130, score));
}

function buildExplanation(mat, fluidId, T, P, pH, Cl, H2S) {
  const f = FLUIDS.find(x => x.id === fluidId);
  const lines = [];
  lines.push(`${mat.name} (${mat.grade}) is recommended based on the following analysis:`);
  if (mat.suits && mat.suits.includes(fluidId)) lines.push(`• Proven industry suitability for ${f?f.name:fluidId} service.`);
  if (f) {
    if (f.corr==='low')    lines.push(`• Fluid has low inherent corrosivity — ${mat.group} is acceptable at these conditions.`);
    if (f.corr==='severe') lines.push(`• Fluid is highly corrosive — enhanced corrosion resistance of ${mat.name} is required.`);
  }
  if (T > 300) lines.push(`• Operating temperature ${T}°C requires creep/oxidation resistance — validated to ${mat.t_max}°C.`);
  else if (T < -20) lines.push(`• Low service temperature ${T}°C is within the ductile range (min ${mat.t_min}°C).`);
  else lines.push(`• Temperature ${T}°C is within validated range (${mat.t_min}°C – ${mat.t_max}°C).`);
  if (Cl > 200 && T > 60) {
    if (['DSS_2205','SDSS_2507'].includes(mat.id))
      lines.push(`• Chloride SCC risk: Cl⁻ ${Cl} ppm at ${T}°C — Duplex microstructure provides resistance where austenitic grades fail.`);
    if (mat.id==='Ti_Gr2')
      lines.push(`• Titanium is immune to chloride SCC — ideal for ${Cl} ppm Cl⁻ at ${T}°C.`);
  }
  if (H2S > 0.0003) lines.push(`• H₂S PP = ${H2S} bar — NACE MR0175/ISO 15156 sour service compliance required. Hardness limits apply.`);
  if (pH < 4) lines.push(`• pH ${pH} indicates strong acid conditions. This material's corrosion rate is acceptable in this range.`);
  if (pH > 10) lines.push(`• pH ${pH} alkaline conditions — material selected for caustic SCC resistance.`);
  lines.push(`Key advantages: ${mat.pros.slice(0,3).join('; ')}.`);
  if (mat.cons && mat.cons.length) lines.push(`Limitation to note: ${mat.cons[0]}.`);
  return lines.join('\n');
}

function buildConstraintRows(mat, fluidId, T, P, pH, Cl, H2S, V, fluidObj) {
  const rows = [];
  const tStatus = T <= mat.t_max*0.9 ? 'PASS' : T <= mat.t_max ? 'CAUTION' : 'FAIL';
  rows.push({label:'Temperature', input:`${T}°C`, limit:`${mat.t_max}°C max`, status:tStatus, note:T>mat.t_max*0.9?'within 10% of limit':''});
  if (T < 20) rows.push({label:'Min Temperature', input:`${T}°C`, limit:`${mat.t_min}°C min`, status:T>=mat.t_min?'PASS':'FAIL', note:''});
  const pStatus = P<=mat.p_max*0.8?'PASS':P<=mat.p_max?'CAUTION':'FAIL';
  rows.push({label:'Pressure (indicative)', input:`${P} bar g`, limit:`${mat.p_max} bar indicative`, status:pStatus, note:'verify by code calc'});
  const avoidStatus = (mat.avoids||[]).includes(fluidId)?'FAIL':(mat.suits||[]).includes(fluidId)?'PASS':'CAUTION';
  rows.push({label:'Fluid Compatibility', input:fluidObj?.name||fluidId, limit:'', status:avoidStatus,
    note:avoidStatus==='FAIL'?'explicitly avoided':avoidStatus==='PASS'?'explicitly suitable':'no explicit data — verify'});
  if (Cl > 0) {
    let clStatus='PASS', clNote='';
    if (['SS_304','SS_316L','SS_317L','SS_321'].includes(mat.id)) {
      if (Cl>5000&&T>60){clStatus='FAIL';clNote='hard limit exceeded';}
      else if (Cl>200&&T>60){clStatus='CAUTION';clNote='SCC risk — monitor';}
    } else if (['DSS_2205','SDSS_2507'].includes(mat.id)) {
      clStatus=Cl>50000?'CAUTION':'PASS'; clNote=Cl>50000?'verify PREN adequacy':'excellent Cl resistance';
    } else if (mat.id==='Ti_Gr2'){clStatus='PASS';clNote='immune to Cl SCC';}
    rows.push({label:'Chloride SCC', input:`Cl⁻ ${Cl} ppm @ ${T}°C`, limit:'200 ppm + 60°C threshold', status:clStatus, note:clNote});
  }
  if (H2S > 0) {
    const h2sStatus = H2S>0.0003&&(mat.group==='Carbon Steel'||mat.group==='Mild Steel')&&pH<5?'FAIL':H2S>0.0003?'CAUTION':'PASS';
    rows.push({label:'H₂S Sour Service', input:`${H2S} bar H₂S PP`, limit:'0.0003 bar NACE limit', status:h2sStatus, note:H2S>0.0003?'NACE MR0175 applies':'below NACE threshold'});
  }
  if (mat.group==='Duplex SS') {
    const sigmaStatus=T>280?'FAIL':T>260?'CAUTION':'PASS';
    rows.push({label:'Sigma Phase', input:`${T}°C`, limit:'280°C max (sustained)', status:sigmaStatus, note:T>260?'embrittlement risk':''});
  }
  if ((mat.group==='Carbon Steel'||mat.group==='Low Alloy Steel') && ['h2s_gas','crude','nat_gas','benzene','diesel','lng'].includes(fluidId)) {
    const hthaStatus=T>300?'FAIL':T>230?'CAUTION':'PASS';
    rows.push({label:'HTHA (API 941)', input:`${T}°C`, limit:'230°C CS limit (indicative)', status:hthaStatus, note:T>230?'verify Nelson curve':''});
  }
  if (V > 0) {
    let vLimit=50,vStatus='PASS',vNote='';
    if (mat.group==='Copper Alloy') vLimit=3;
    else if (['Polymer','FRP/GRP'].includes(mat.group)) vLimit=3;
    else if (mat.group==='Carbon Steel') vLimit=10;
    if (V>vLimit*1.5){vStatus='FAIL';vNote='erosion damage likely';}
    else if (V>vLimit){vStatus='CAUTION';vNote='approaching erosion limit';}
    if (vLimit<50) rows.push({label:'Velocity / Erosion', input:`${V} m/s`, limit:`~${vLimit} m/s guideline`, status:vStatus, note:vNote});
  }
  if (mat.id==='SS_304'&&T>425)
    rows.push({label:'HAZ Sensitization', input:`${T}°C welded service`, limit:'425°C limit for 304', status:'CAUTION', note:'use 316L/321 for welded high-T'});
  return rows;
}

function mocValidateInputs(T, P, pH, Cl, H2S, V, life) {
  const errs=[],warns=[];
  if (isNaN(T))              errs.push('Temperature is required.');
  else if (T<-270)           errs.push('Temperature below −270°C is physically impossible.');
  else if (T>1200)           errs.push('Temperature above 1200°C is outside all standard material limits.');
  else if (T>700)            warns.push(`Temperature ${T}°C — only refractory alloys operate here. Verify.`);
  if (isNaN(P))              errs.push('Pressure is required.');
  else if (P<0)              errs.push('Pressure cannot be negative.');
  else if (P>3000)           warns.push(`Pressure ${P} bar g is extremely high. Verify.`);
  if (isNaN(pH))             errs.push('pH is required (0–14).');
  else if (pH<0||pH>14)      errs.push('pH must be between 0 and 14.');
  if (isNaN(Cl)||Cl<0)       errs.push('Cl⁻ must be 0 or a positive value in ppm.');
  else if (Cl>200000)        warns.push('Cl⁻ > 200,000 ppm — verify units.');
  if (isNaN(H2S)||H2S<0)     errs.push('H₂S partial pressure must be 0 or positive.');
  else if (H2S>20)           warns.push('H₂S PP > 20 bar is extreme sour service. Verify.');
  if (isNaN(V)||V<0)         errs.push('Velocity must be 0 or positive.');
  else if (V>50)             warns.push(`Velocity ${V} m/s is very high.`);
  if (isNaN(life)||life<1)   errs.push('Design life must be at least 1 year.');
  else if (life>100)         warns.push('Design life > 100 years — unusual. Verify.');
  if (pH<2&&H2S>0.0003)      warns.push('pH < 2 with H₂S — extremely aggressive sour service.');
  if (Cl>5000&&T>150)        warns.push('High Cl⁻ at elevated temperature — Cl SCC near-certain for austenitic SS.');
  if (T>400&&P>200)          warns.push('High T + High P — ensure ASME code-compliant wall thickness calculation.');
  if (V>15&&pH<5)            warns.push('High velocity + acidic fluid — severe erosion-corrosion synergy expected.');
  return {errs,warns};
}

function runAnalysis({fluidId,equipId,T,P,pH,Cl,H2S,V,life,costPrio,industry,notes}) {
  const validation = mocValidateInputs(T,P,pH,Cl,H2S,V,life);
  if (validation.errs.length>0) return {ok:false, errors:validation.errs};

  const fluid = FLUIDS.find(f=>f.id===fluidId);
  const equip = EQUIPMENT.find(e=>e.id===equipId);
  if (!fluid) return {ok:false, errors:['Unknown fluid ID.']};
  if (!equip) return {ok:false, errors:['Unknown equipment ID.']};

  const allScored = Object.values(MATERIALS).map(mat=>({mat, score:scoreFluidMaterial(fluidId,mat,T,P,pH,Cl,H2S,V,costPrio,equipId,industry)}));
  const eliminated = allScored.filter(x=>x.score<=0).map(x=>x.mat.name);
  const scored     = allScored.filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if (scored.length===0) return {ok:false, errors:['No standard material found for these conditions.']};

  const best=scored[0], alts=scored.slice(1,5);
  const warnings=[];

  if (Cl>200&&T>60&&['SS_304','SS_316L'].includes(best.mat.id))
    warnings.push({type:'scc_cl',label:'Chloride SCC Risk',body:`Cl⁻ ${Cl} ppm at ${T}°C exceeds safe limit for austenitic SS. Upgrade to Duplex 2205 or Titanium Gr.2.`});
  if (T>260&&T<=280&&best.mat.group==='Duplex SS')
    warnings.push({type:'sigma',label:'Sigma Phase Warning',body:'Duplex SS approaching sigma phase embrittlement range (260–280°C). Restrict to short-duration excursions only.'});
  if (T>425&&best.mat.id==='SS_304')
    warnings.push({type:'sensitization',label:'Sensitization / IGC Risk',body:'SS 304 in welded service above 425°C susceptible to IGC. Upgrade to SS 316L, SS 321, or SS 347.'});
  if (H2S>0.0003) {
    const sscRisk=pH<6?'HIGH — SSC primary threat':'MODERATE — HIC primary concern';
    warnings.push({type:'nace',label:'NACE MR0175 / ISO 15156 Sour Service',body:`H₂S PP = ${H2S} bar. SSC risk: ${sscRisk}. Hardness max HV 248 (HRC 22). PWHT mandatory for CS welds. Specify HIC-resistant plate (NACE TM0284).`});
  }
  if (H2S>0.0003&&pH<5&&(best.mat.group==='Carbon Steel'||best.mat.group==='Mild Steel'))
    warnings.push({type:'hic',label:'Hydrogen Blistering / HIC — DOMINANT RISK',body:`Wet H₂S at pH ${pH} — severe hydrogen absorption. Requires HIC-resistant plate (NACE TM0284 Grade A), hardness control (HV ≤ 248). Consider SS 316L, Duplex 2205, or Alloy 625.`});
  if (T>230&&(best.mat.group==='Carbon Steel'||best.mat.group==='Mild Steel'))
    warnings.push({type:'htha',label:'HTHA Risk (API 941)',body:'CS/MS above 230°C in hydrocarbon/H₂ service. Verify position on API 941 Nelson curves.'});
  if (pH<4)
    warnings.push({type:'acid',label:'Strong Acid Service',body:`pH ${pH} — corrosion rate increases exponentially. Min corrosion allowance 3–6 mm recommended.`});
  if (T<0&&best.mat.group==='Carbon Steel')
    warnings.push({type:'lowtemp',label:'Low Temperature Impact Toughness',body:'Below 0°C — Charpy CVN testing required per ASME UCS-66. Consider LTCS A333 Gr.6 or austenitic SS.'});
  if ((best.mat.group==='Carbon Steel'||best.mat.group==='Mild Steel')&&(fluidId==='water_sw'||Cl>1000))
    warnings.push({type:'galvanic',label:'Galvanic Corrosion Risk',body:'CS in contact with stainless or copper alloys in saline service — CS acts as anode. Ensure electrical isolation at dissimilar-metal joints.'});
  if (best.mat.id==='Ti_Gr2'&&(fluidId==='water_sw'||Cl>1000))
    warnings.push({type:'galvanic',label:'Galvanic Corrosion Risk',body:'Titanium coupled to carbon steel in saline service creates a severe galvanic pair — CS corrodes rapidly. Electrically isolate all flanges.'});
  if (V>5&&best.mat.group==='Copper Alloy')
    warnings.push({type:'erosion',label:'Erosion-Corrosion Risk',body:`Cu-Ni velocity limit ~3 m/s. At ${V} m/s impingement attack likely. Consider Titanium or Duplex SS.`});
  if (notes&&notes.trim().length>0) {
    const nl=notes.toLowerCase(), noteWarnings=[];
    if (/oxygen|o2|aerat/.test(nl))           noteWarnings.push('Oxygen present — dissolved O₂ significantly accelerates corrosion in CS/MS.');
    if (/solid|slurry|sand|particl|abrasiv/.test(nl)) noteWarnings.push('Solids/abrasives noted — erosion-corrosion rate will exceed model predictions.');
    if (/chloride|cl-/.test(nl)&&Cl===0)      noteWarnings.push('Chloride contamination noted but Cl⁻ input is 0 — re-enter a representative value.');
    if (/h2s|sour|sulphide|sulfide/.test(nl)&&H2S===0) noteWarnings.push('H₂S noted but H₂S PP input is 0 — enter a representative H₂S partial pressure.');
    if (noteWarnings.length) warnings.push({type:'notes',label:'Advisory from Notes Field',body:noteWarnings.join(' | ')});
  }

  const corrSuff      = getCorrSufficiency(best.mat, fluid.corr||'moderate', life);
  const constraintRows= buildConstraintRows(best.mat, fluidId, T, P, pH, Cl, H2S, V, fluid);
  const explanation   = buildExplanation(best.mat, fluidId, T, P, pH, Cl, H2S);
  const displayScore  = Math.min(Math.round(best.score), 100);

  let dominantFailureMode=null;
  if (Cl>200&&T>60&&['SS_304','SS_316L'].includes(best.mat.id)) dominantFailureMode='Chloride SCC';
  if (H2S>0.0003&&pH<5&&(best.mat.group==='Carbon Steel'||best.mat.group==='Mild Steel')) dominantFailureMode='Hydrogen Blistering / HIC';
  if (T>230&&(best.mat.group==='Carbon Steel'||best.mat.group==='Mild Steel')) dominantFailureMode=dominantFailureMode||'HTHA';

  return {
    ok:true, warnings, inputWarnings:validation.warns,
    best:{id:best.mat.id,name:best.mat.name,grade:best.mat.grade,std:best.mat.std,group:best.mat.group,color:best.mat.color,desc:best.mat.desc,tags:best.mat.tags,pros:best.mat.pros,cons:best.mat.cons,cost_idx:best.mat.cost_idx,t_min:best.mat.t_min,t_max:best.mat.t_max,p_max:best.mat.p_max,composition:best.mat.composition,score:displayScore},
    alts:alts.map(a=>({id:a.mat.id,name:a.mat.name,grade:a.mat.grade,std:a.mat.std,group:a.mat.group,desc:a.mat.desc,tags:a.mat.tags,pros:a.mat.pros,cons:a.mat.cons,cost_idx:a.mat.cost_idx,t_max:a.mat.t_max,score:Math.min(Math.round(a.score),100)})),
    eliminated, constraintRows, explanation, corrSuff, dominantFailureMode,
    summary:{equip:equip.name,fluid:fluid.name,T,P,pH,Cl,H2S,V,life,industry},
    totalEvaluated:scored.length,
  };
}

// MOC rate limiter (scoped to /api/moc)
const _mocRateMap = new Map();
function mocRateLimit(ip) {
  const now = Date.now(), entry = _mocRateMap.get(ip) || { count: 0, window: now };
  if (now - entry.window > 60000) { entry.count = 0; entry.window = now; }
  entry.count++;
  _mocRateMap.set(ip, entry);
  return entry.count > 30;
}

function mocParseBody(body) {
  const n = (v, def, min, max) => { const f = parseFloat(v); return isNaN(f) ? def : Math.min(max, Math.max(min, f)); };
  return {
    fluidId:  String(body.fluidId  || '').slice(0, 40),
    equipId:  String(body.equipId  || '').slice(0, 40),
    T:        n(body.T,    100, -270, 1200),
    P:        n(body.P,     10,    0, 5000),
    pH:       n(body.pH,     7,    0,   14),
    Cl:       n(body.Cl,     0,    0, 300000),
    H2S:      n(body.H2S,    0,    0,   50),
    V:        n(body.V,      2,    0,  100),
    life:     n(body.life,  25,    1,  100),
    costPrio: ['balanced', 'economy', 'performance'].includes(body.costPrio) ? body.costPrio : 'balanced',
    industry: String(body.industry || 'Oil & Gas').slice(0, 40),
    notes:    String(body.notes    || '').slice(0, 500),
  };
}

// ========================================================================
// SECTION: MOC
// ========================================================================

async function handle_moc(req, body, res) {
  // GET → catalog
  if (req.method === 'GET') {
    const fluidsDisplay = FLUIDS.map(f => ({
      id: f.id, name: f.name, sub: f.sub, color: f.color, ind: f.ind,
      autofill: FLUID_AUTOFILL[f.id] || null,
    }));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json({ equipment: EQUIPMENT, industries: INDUSTRIES, fluids: fluidsDisplay });
  }
  // POST → analyze
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (mocRateLimit(ip)) return res.status(429).json({ error: 'Too many requests. Please wait.' });
  const result = runAnalysis(mocParseBody(body));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.ok ? 200 : 422).json(result);
}



// ════════════════════════════════════════════════════════════════════════════
// Vercel handler — dispatches to handle_moc
// Supports both GET (catalog) and POST (analyze)
// ════════════════════════════════════════════════════════════════════════════
async function moc_handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = req.method === 'POST' ? req.body : {};
  if (req.method === 'POST' && (!body || typeof body !== 'object'))
    return res.status(400).json({ error: 'Invalid request body.' });

  try {
    return await handle_moc(req, body, res);
  } catch (e) {
    console.error('[moc.js] Unhandled error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

// ── End of Section 21: Material of Construction (MOC) ──────────────────────────────────────────

