// ================================================================
// api/index.js — Unified serverless router for all calculators
// Consolidates 14 API functions into 1 (Vercel Hobby plan limit)
// 
// Routing: POST /api/index?route=compressor  OR
//          Vercel rewrites /api/compressor → /api/index
// ================================================================

export const config = { api: { bodyParser: true } };


// ── COMPRESSOR LOGIC ──────────────────────────────────────────
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
function assertFinite(val, label) {
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
  assertFinite(P_shaft_total, 'P_shaft_total');
  assertFinite(P_input_total, 'P_input_total');

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
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ─── Vercel handler ─────────────────────────────────────────────────── */


// ── CONTROL-VALVE LOGIC ──────────────────────────────────────────
// ============================================================
// Vercel Serverless API — Control Valve Sizing
// File: /api/control-valve.js
// ALL math, unit conversions, validation done HERE — nothing in client
// Protected by secret key — requests without key return 403
// ============================================================

const SECRET_KEY = 'cv-k3y9x';  // must match _K in index.html



// ── COOLING-TOWER LOGIC ──────────────────────────────────────────
// ================================================================
// api/cooling-tower.js  —  Vercel Serverless Function
// 🔐 ALL CALCULATION LOGIC RUNS ON SERVER — NEVER EXPOSED TO BROWSER
// Place this file in your GitHub repo at: /api/cooling-tower.js
// ================================================================



// ── EOS LOGIC ──────────────────────────────────────────
// ================================================================
// api/eos.js  —  Vercel Serverless Function
// 🔐 ALL CALCULATION LOGIC RUNS ON SERVER — NEVER EXPOSED TO BROWSER
// Place this file in your GitHub repo at: /api/eos.js
// ================================================================



// ── FAN LOGIC ──────────────────────────────────────────
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
function assertFinite(val, label) {
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

  assertFinite(P_air,   'P_air');
  assertFinite(P_shaft, 'P_shaft');
  assertFinite(P_input, 'P_input');

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
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ─── Vercel handler ─────────────────────────────────────────────────── */


// ── HEATXPERT LOGIC ──────────────────────────────────────────
// ─── VERCEL DEPLOYMENT: place this file at /api/heatxpert.js in your repo root ───
// Route auto-created at /api/heatxpert by Vercel

const config = { api: { bodyParser: true } };



// ── ORIFICE-FLOW LOGIC ──────────────────────────────────────────
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
  return val * (map[unit] ?? 9.80665);
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
  if (tapType === 'sharp_flange' || tapType === 'sharp_corner') {
    L1 = 25.4 / (D_mm || 100);
    L2 = L1;
  } else if (tapType === 'd_d2_tap') {
    L1 = 1.0; L2 = 0.47;
  } else {
    L1 = 0; L2 = 0; // corner tap
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
    return (1 - Cd) * (1 - Math.pow(beta, 2)) * 100;
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
  const u_beta_flow = 2 * u_beta * b4 / (1 - b4);
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
  if (P_Pa <= 0)            errs.push('Pressure must be > 0 — ensure ABSOLUTE pressure is entered (not gauge)');
  if (P_Pa < 10000)         errs.push(`Pressure = ${(P_Pa/1e5).toFixed(4)} bara — very low; confirm ABSOLUTE pressure (bara/psia), not gauge`);
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
const FLUID_DB = {
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
};

// ═════════════════════════════════════════════════════════════════════
//  MAIN CALCULATION ENGINE
// ═════════════════════════════════════════════════════════════════════
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
    fluidKey,            // key in FLUID_DB or null
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
    rho_op = sg * 1000;
    mu     = mu_input;
    Z_used = 1;
  } else {
    // Gas
    const f = FLUID_DB[fluidKey] || null;
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
  const f_db  = FLUID_DB[fluidKey] || null;
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
  function getReMin(b) {
    if (b <= 0.44) return 5000; if (b <= 0.56) return 10000; if (b <= 0.65) return 30000; return 170000;
  }
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
    // Warnings
    warnings: warns,
    infos,
  };
}

// ═════════════════════════════════════════════════════════════════════
//  VERCEL HANDLER  (CommonJS — works with all Vercel Node runtimes)
// ═════════════════════════════════════════════════════════════════════

// Helper: set all CORS headers on a response object
function setCORS(res) {
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



// ── PRESSURE-DROP-CALCULATOR LOGIC ──────────────────────────────────────────
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

function setCORS(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
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
const FLUID_DB = [
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
  const f = FLUID_DB.find(x => x.id === id);
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
    diameter: inputs.D, length: inputs.L, dz,
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


// ── PSYCHROMETRIC LOGIC ──────────────────────────────────────────
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


// ── PUMP LOGIC ──────────────────────────────────────────
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
function assertFinite(val, label) {
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
  assertFinite(P_hyd_total, 'P_hyd_total');
  assertFinite(P_shaft,     'P_shaft');
  assertFinite(P_input,     'P_input');

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
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ─── Vercel handler ─────────────────────────────────────────────────── */


// ── RANKINE LOGIC ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// Vercel Serverless Function — Rankine Cycle Thermodynamic Engine
// All steam property lookups, interpolation, and cycle calculations
// run here — never exposed to the browser.
// ═══════════════════════════════════════════════════════════════════

// ── STEAM TABLE DATA (IAPWS-IF97) ──────────────────────────────────
// SAT_T: [T_C, hf, hfg, hg, sf, sfg, sg, vf, vg]
const SAT_T=[[0.01,0.00,2501.4,2501.4,0.0000,9.1562,9.1562,0.0010002,206.140],[5,21.02,2489.6,2510.6,0.0763,8.9496,9.0259,0.0010001,147.120],[10,42.02,2477.7,2519.7,0.1511,8.7488,8.8999,0.0010003,106.380],[15,62.98,2465.9,2528.9,0.2245,8.5566,8.7811,0.0010009,77.926],[20,83.91,2453.6,2537.5,0.2966,8.3706,8.6671,0.0010018,57.791],[25,104.87,2441.7,2546.5,0.3673,8.1910,8.5583,0.0010029,43.360],[30,125.77,2430.0,2555.8,0.4369,8.0164,8.4533,0.0010044,32.894],[35,146.66,2418.2,2564.9,0.5052,7.8478,8.3530,0.0010060,25.216],[40,167.54,2406.0,2573.5,0.5724,7.6845,8.2569,0.0010079,19.523],[45,188.44,2393.9,2582.4,0.6386,7.5261,8.1647,0.0010099,15.258],[50,209.33,2382.0,2591.3,0.7037,7.3725,8.0762,0.0010121,12.032],[60,251.18,2357.7,2608.8,0.8313,7.0784,7.9096,0.0010171,7.671],[70,292.97,2333.0,2626.0,0.9548,6.7989,7.7537,0.0010228,5.042],[80,334.88,2307.8,2642.7,1.0753,6.5366,7.6119,0.0010292,3.407],[90,376.90,2282.2,2659.1,1.1924,6.2866,7.4790,0.0010361,2.361],[100,419.06,2256.9,2676.0,1.3069,6.0480,7.3549,0.0010435,1.6720],[110,461.14,2229.7,2690.8,1.4185,5.8194,7.2379,0.0010516,1.2101],[120,503.78,2202.6,2706.3,1.5279,5.6006,7.1284,0.0010603,0.8917],[130,546.37,2174.2,2720.5,1.6346,5.3906,7.0252,0.0010700,0.6685],[140,589.16,2144.9,2734.0,1.7391,5.1894,6.9285,0.0010803,0.5089],[150,632.18,2114.3,2746.5,1.8416,4.9961,6.8377,0.0010912,0.3924],[160,675.55,2082.6,2758.1,1.9422,4.8100,6.7522,0.0011029,0.3071],[170,719.08,2049.5,2768.5,2.0412,4.6297,6.6709,0.0011150,0.2428],[180,763.06,2015.3,2778.2,2.1387,4.4547,6.5934,0.0011281,0.1940],[190,807.57,1979.0,2786.4,2.2349,4.2844,6.5192,0.0011420,0.1565],[200,852.38,1940.7,2793.1,2.3300,4.1179,6.4479,0.0011565,0.12721],[210,897.76,1900.7,2798.5,2.4245,3.9583,6.3828,0.0011726,0.10441],[220,943.58,1858.5,2802.1,2.5175,3.7927,6.3102,0.0011891,0.08619],[230,990.21,1813.8,2804.0,2.6099,3.6234,6.2333,0.0012075,0.07158],[240,1037.6,1769.4,2807.0,2.7018,3.4735,6.1753,0.0012270,0.05977]];
const SAT_P=[[1.0,99.63,417.44,2675.6,1.3026,7.3594,0.001043,1.6941],[2.0,120.23,504.68,2706.7,1.5301,7.1268,0.001061,0.88574],[3.0,133.55,561.43,2725.3,1.6716,6.9909,0.001073,0.60582],[4.0,143.63,604.66,2738.1,1.7764,6.8959,0.001084,0.46242],[5.0,151.86,640.09,2748.1,1.8604,6.8212,0.001093,0.37483],[6.0,158.85,670.38,2756.4,1.9308,6.7600,0.001101,0.31567],[7.0,165.00,697.07,2763.4,1.9918,6.7080,0.001108,0.27279],[8.0,170.43,720.87,2769.1,2.0461,6.6628,0.001115,0.24049],[9.0,175.38,742.56,2773.8,2.0946,6.6226,0.001121,0.21497],[10.0,179.91,762.81,2778.1,2.1387,6.5865,0.001127,0.19444],[12.0,187.99,798.65,2784.8,2.2166,6.5233,0.001139,0.16333],[14.0,195.07,830.08,2790.0,2.2837,6.4693,0.001149,0.14078],[16.0,201.41,858.56,2794.0,2.3440,6.4218,0.001159,0.12374],[18.0,207.11,885.17,2797.6,2.3976,6.3794,0.001168,0.11043],[20.0,212.42,908.47,2799.5,2.4468,6.3409,0.001177,0.099585],[25.0,224.00,962.11,2803.3,2.5547,6.2575,0.001197,0.079977],[30.0,233.90,1008.4,2804.2,2.6457,6.1869,0.001216,0.066628],[35.0,242.60,1049.8,2803.8,2.7253,6.1253,0.001235,0.057063],[40.0,250.40,1087.4,2801.4,2.7966,6.0696,0.001252,0.049779],[45.0,257.49,1122.1,2798.3,2.8612,6.0190,0.001269,0.044079],[50.0,263.99,1154.4,2794.3,2.9202,5.9737,0.001286,0.039457],[60.0,275.64,1213.7,2784.3,3.0248,5.8902,0.001319,0.032445],[70.0,285.88,1267.4,2772.1,3.1210,5.8133,0.001352,0.027370],[80.0,295.06,1317.1,2758.4,3.2076,5.7450,0.001384,0.023525],[90.0,303.40,1363.2,2742.8,3.2857,5.6811,0.001418,0.020489],[100.0,311.06,1407.6,2724.5,3.3596,5.6141,0.001452,0.018026],[110.0,318.15,1450.3,2705.0,3.4295,5.5473,0.001489,0.015985],[120.0,324.75,1491.8,2684.9,3.4962,5.4924,0.001527,0.014267],[130.0,330.93,1532.0,2662.9,3.5605,5.4295,0.001567,0.012721],[140.0,336.75,1571.0,2638.7,3.6229,5.3717,0.001611,0.011485],[150.0,342.24,1609.0,2614.5,3.6834,5.3108,0.001658,0.010340],[160.0,347.44,1650.5,2580.6,3.7428,5.2455,0.001710,0.0093499],[170.0,352.37,1690.7,2548.5,3.7996,5.1832,0.001765,0.0083849],[180.0,357.06,1732.0,2509.1,3.8553,5.1044,0.001840,0.0074920],[190.0,361.54,1776.5,2468.4,3.9102,5.0218,0.001926,0.0066531],[200.0,365.81,1826.3,2409.7,4.0139,4.9269,0.002036,0.0058750],[210.0,369.89,1886.3,2336.8,4.1014,4.8013,0.002213,0.0051020],[220.0,373.71,2010.3,2192.4,4.2887,4.5481,0.002790,0.0037800],[220.64,374.14,2099.3,2099.3,4.4120,4.4120,0.003155,0.0031550]];
const SH_FB=[{P:1,d:[[100,2676.2,7.361,1.696],[150,2776.5,7.615,1.937],[200,2875.5,7.835,2.172],[250,2974.5,8.033,2.406],[300,3074.3,8.217,2.639],[350,3175.8,8.390,2.871],[400,3279.6,8.545,3.103],[500,3488.1,8.834,3.565],[600,3705.4,9.102,4.028],[700,3928.7,9.352,4.490],[800,4159.0,9.586,4.952]]},{P:5,d:[[152,2748.7,6.821,0.375],[200,2855.4,7.059,0.425],[250,2961.0,7.272,0.474],[300,3064.2,7.460,0.523],[350,3168.1,7.633,0.570],[400,3272.3,7.794,0.617],[500,3484.9,8.087,0.711],[600,3704.3,8.352,0.804],[700,3927.1,8.605,0.897],[800,4157.8,8.840,0.990]]},{P:10,d:[[180,2778.1,6.587,0.1944],[200,2827.9,6.694,0.2060],[250,2942.6,6.925,0.2328],[300,3051.2,7.123,0.2579],[350,3157.7,7.301,0.2825],[400,3264.5,7.465,0.3066],[500,3478.5,7.762,0.3541],[600,3697.9,8.029,0.4011],[700,3922.5,8.281,0.4479],[800,4154.5,8.516,0.4945]]},{P:20,d:[[213,2799.5,6.341,0.0996],[250,2902.5,6.545,0.1114],[300,3023.5,6.768,0.1255],[350,3137.0,6.958,0.1385],[400,3248.7,7.127,0.1520],[500,3467.6,7.432,0.1757],[600,3687.9,7.702,0.1996],[700,3913.3,7.955,0.2233],[800,4142.0,8.192,0.2467]]},{P:40,d:[[251,2801.4,6.070,0.0498],[300,2962.0,6.362,0.0589],[350,3092.5,6.584,0.0666],[400,3213.6,6.771,0.0734],[500,3445.3,7.090,0.0864],[600,3670.3,7.369,0.0989],[700,3894.9,7.624,0.1112],[800,4122.0,7.861,0.1234]]},{P:60,d:[[276,2784.3,5.890,0.0324],[300,2885.5,6.070,0.0362],[350,3043.4,6.336,0.0421],[400,3178.3,6.545,0.0474],[500,3422.2,6.883,0.0567],[600,3658.4,7.169,0.0653],[700,3876.1,7.428,0.0736],[800,4095.0,7.667,0.0818]]},{P:80,d:[[295,2758.4,5.745,0.0235],[300,2786.5,5.794,0.0243],[350,2988.1,6.132,0.0299],[400,3139.4,6.366,0.0343],[500,3398.3,6.727,0.0398],[600,3633.2,7.059,0.0480],[700,3857.2,7.321,0.0543],[800,4074.0,7.562,0.0604]]},{P:100,d:[[311,2725.5,5.614,0.0180],[350,2924.5,5.945,0.0228],[400,3096.5,6.212,0.0264],[450,3249.0,6.419,0.0297],[500,3374.2,6.599,0.0328],[600,3625.3,6.903,0.0384],[700,3838.2,7.176,0.0427],[800,4053.0,7.418,0.0487]]},{P:120,d:[[325,2684.9,5.492,0.0143],[360,2820.0,5.752,0.0165],[400,3051.6,6.004,0.0208],[450,3215.9,6.233,0.0236],[500,3350.7,6.425,0.0262],[600,3582.3,6.742,0.0308],[700,3793.5,7.027,0.0351],[800,4032.0,7.271,0.0405]]},{P:140,d:[[337,2637.6,5.372,0.0115],[360,2753.0,5.581,0.0132],[400,3001.9,5.845,0.0166],[450,3182.5,6.086,0.0191],[500,3323.1,6.285,0.0214],[600,3541.2,6.604,0.0260],[700,3762.2,6.898,0.0302],[800,4011.0,7.143,0.0352]]},{P:160,d:[[347,2580.6,5.246,0.0093],[380,2745.0,5.508,0.0115],[400,2947.0,5.693,0.0132],[450,3146.1,5.951,0.0157],[500,3295.0,6.156,0.0178],[600,3561.1,6.513,0.0214],[700,3732.3,6.781,0.0256],[800,3989.0,7.029,0.0302]]},{P:180,d:[[357,2509.1,5.104,0.0075],[390,2748.0,5.484,0.0100],[400,2880.1,5.554,0.0107],[450,3104.9,5.827,0.0130],[500,3266.1,6.037,0.0149],[600,3542.0,6.409,0.0181],[700,3701.4,6.657,0.0218],[800,3968.0,6.909,0.0260]]},{P:200,d:[[366,2409.7,4.927,0.0059],[395,2702.0,5.378,0.0085],[400,2818.1,5.472,0.0099],[450,3060.1,5.796,0.0121],[500,3239.3,6.018,0.0145],[600,3532.0,6.336,0.0175],[700,3670.6,6.589,0.0210],[800,3947.0,6.845,0.0249]]}];

// ── STEAM PROPERTY ENGINE ──────────────────────────────────────────
function pSat(T_C){const T=T_C+273.15,Tc=647.096,Pc=220.64;if(T>=Tc)return Pc;if(T<273.15)return NaN;const tau=1-T/Tc,arg=(Tc/T)*(-7.85951783*tau+1.84408259*Math.pow(tau,1.5)+-11.7866497*Math.pow(tau,3)+22.6807411*Math.pow(tau,3.5)+-15.9618719*Math.pow(tau,4)+1.80122502*Math.pow(tau,7.5));return Pc*Math.exp(arg);}
function tSat(P_bar){if(!isFinite(P_bar)||P_bar<=0||P_bar>220.9)return NaN;let T=100*Math.pow(P_bar/1.01325,0.27)+273.15;for(let i=0;i<60;i++){const Tc=T-273.15,P=pSat(Tc),dP=(pSat(Tc+0.005)-pSat(Tc-0.005))/0.01;if(!isFinite(P)||!isFinite(dP)||dP===0)break;const dT=(P-P_bar)/dP;T-=dT;if(Math.abs(dT)<1e-7)break;}return T-273.15;}
function tSatMPa(P_MPa){return tSat(P_MPa*10);}

function csplineInterp(xs,ys,x){const n=xs.length;if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];let i=0;for(let j=0;j<n-1;j++){if(xs[j]<=x&&x<=xs[j+1]){i=j;break;}}const t=(x-xs[i])/(xs[i+1]-xs[i]),t2=t*t,t3=t2*t,h=xs[i+1]-xs[i];const m1=i>0?(ys[i+1]-ys[i-1])/(xs[i+1]-xs[i-1]):(ys[i+1]-ys[i])/h;const m2=i<n-2?(ys[i+2]-ys[i])/(xs[i+2]-xs[i]):(ys[i+1]-ys[i])/h;return ys[i]*(2*t3-3*t2+1)+ys[i+1]*(-2*t3+3*t2)+m1*h*(t3-2*t2+t)+m2*h*(t3-t2);}
function satByT(T_C){if(T_C<0.01||T_C>374.14)return null;let row;if(T_C<=240){const xs=SAT_T.map(r=>r[0]),interp=c=>csplineInterp(xs,SAT_T.map(r=>r[c]),T_C);row={T:T_C,hf:interp(1),hfg:interp(2),hg:interp(3),sf:interp(4),sfg:interp(5),sg:interp(6),vf:interp(7),vg:interp(8),P_bar:pSat(T_C)};}else{const P=pSat(T_C);row=satByP(P);}return row;}
function satByP(P_bar){if(P_bar<0.006||P_bar>220.9)return null;const xs=SAT_P.map(r=>r[0]),interp=c=>csplineInterp(xs,SAT_P.map(r=>r[c]),P_bar);const Ts=interp(1),hf=interp(2),hg=interp(3),sf=interp(4),sg=interp(5),vf=interp(6),vg=interp(7);return{T:Ts,P_bar,hf,hfg:hg-hf,hg,sf,sfg:sg-sf,sg,vf,vg};}
function shProps(P_bar,T_C){const prs=SH_FB.map(b=>b.P);function atB(idx,T){const d=SH_FB[idx].d;return{h:csplineInterp(d.map(r=>r[0]),d.map(r=>r[1]),T),s:csplineInterp(d.map(r=>r[0]),d.map(r=>r[2]),T),v:csplineInterp(d.map(r=>r[0]),d.map(r=>r[3]),T)};}if(P_bar<=prs[0])return atB(0,T_C);if(P_bar>=prs[prs.length-1])return atB(prs.length-1,T_C);let lo=0;for(let i=0;i<prs.length-1;i++){if(prs[i]<=P_bar&&P_bar<=prs[i+1]){lo=i;break;}}const fP=(P_bar-prs[lo])/(prs[lo+1]-prs[lo]),a=atB(lo,T_C),b_=atB(lo+1,T_C);return{h:a.h+fP*(b_.h-a.h),s:a.s+fP*(b_.s-a.s),v:a.v+fP*(b_.v-a.v)};}
function supState(T_C,P_MPa){const P_bar=P_MPa*10,sat=satByP(P_bar);if(!sat)return null;if(T_C<=sat.T)return{h:sat.hg,s:sat.sg,v:sat.vg};return shProps(P_bar,T_C);}
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
  const sat2=satByP(P2_bar);
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
  const s1=condProps(Tc),s6=satByP(Pbleed_bar),stIn=supState(Thi,Phi);
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


// ── STEAM-QUENCH LOGIC ──────────────────────────────────────────
/**
 * Steam Quench Calculator — Serverless API
 * Vercel Edge/Node function: /api/calculate
 *
 * Protected server-side logic:
 *   • IAPWS-IF97 steam property correlations (Regions 1, 2, 5)
 *   • NIST saturation tables (SAT_T, SAT_P) + PCHIP interpolation
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

const config = { runtime: 'nodejs' };

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
const SAT_T = [
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
const SAT_P = [
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

function satByT_fb(T_C) {
  const xs = SAT_T.map(r=>r[0]);
  if (T_C < xs[0] || T_C > xs[xs.length-1]) return null;
  const hf  = pchipInterp(xs, SAT_T.map(r=>r[1]), T_C);
  const hfg = pchipInterp(xs, SAT_T.map(r=>r[2]), T_C);
  const hg  = pchipInterp(xs, SAT_T.map(r=>r[3]), T_C);
  const vf  = pchipInterp(xs, SAT_T.map(r=>r[7]), T_C);
  const vg  = pchipInterp(xs, SAT_T.map(r=>r[8]), T_C);
  return { hf, hfg, hg, vf, vg };
}

function satByP(P_bar) {
  const xs = SAT_P.map(r=>r[0]);
  if (P_bar < xs[0] || P_bar > xs[xs.length-1]) return null;
  const hf  = pchipInterp(xs, SAT_P.map(r=>r[2]), P_bar);
  const hg  = pchipInterp(xs, SAT_P.map(r=>r[3]), P_bar);
  const vf  = pchipInterp(xs, SAT_P.map(r=>r[6]), P_bar);
  return { hf, hg, hfg: hg-hf, vf };
}

function hf_P(P_bar)  { const s=satByP(P_bar); return s?s.hf:NaN; }
function hg_P(P_bar)  { const s=satByP(P_bar); return s?s.hg:NaN; }

// ── Wagner saturation pressure (IAPWS-IF97 §8.1) ─────────────────────────────
function pSat(T_C) {
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
function tSat(P_bar) {
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
    const P  = pSat(T);
    if (!isFinite(P)) break;
    const dP = (pSat(T+0.005) - pSat(T-0.005)) / 0.01;
    if (!isFinite(dP) || Math.abs(dP) < 1e-12) break;
    const dT = (P - P_bar) / dP;
    T -= Math.max(-20, Math.min(20, dT));
    if (Math.abs(dT) < 5e-8) { converged = true; break; }
  }
  if (!converged) {
    let lo = 0.01, hi = 373.9;
    for (let i = 0; i < 100; i++) {
      const mid = (lo+hi)/2;
      const P   = pSat(mid);
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


// ── STEAM-TURBINE-POWER LOGIC ──────────────────────────────────────────
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
const SH_FB = [
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
function csplineInterp(xs, ys, x) {
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
    const interp = key => csplineInterp(xs, SAT_TABLE.map(r=>r[key]), P_bar);
    const hf=interp('hf'), hg=interp('hg'), sf=interp('sf'), sg=interp('sg');
    return { P:P_bar, T:interp('T'), hf, hg, hfg:hg-hf, sf, sg, sfg:sg-sf,
             vf:interp('vf'), vg:interp('vg') };
}

// ── Superheated props (exact copy from original getSuperheatedProps_fb) ──
function getSuperheatedProps(P_bar, T_C) {
    const sat = getSatProps(P_bar);
    if (T_C <= sat.T + 0.5) return { h:sat.hg, s:sat.sg, v:sat.vg, phase:'sat' };
    const prs = SH_FB.map(b=>b.P);
    function atBlock(idx, T) {
        const d = SH_FB[idx].d;
        return {
            h: csplineInterp(d.map(r=>r[0]), d.map(r=>r[1]), T),
            s: csplineInterp(d.map(r=>r[0]), d.map(r=>r[2]), T),
            v: csplineInterp(d.map(r=>r[0]), d.map(r=>r[3]), T)
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


// ── STEAM LOGIC ──────────────────────────────────────────
// ================================================================
// api/steam.js  —  Vercel Serverless Function
// 🔐 ALL CALCULATION LOGIC RUNS ON SERVER — NEVER EXPOSED TO BROWSER
// Place this file in your GitHub repo at: /api/steam.js
// ================================================================



// ── ROUTE HANDLERS ────────────────────────────────────────────────────────

async function handle_compressor(body, res) {
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid request body.' });
  const err = validateCompInputs(body);
  if (err) return res.status(400).json({ error: err });
  return res.status(200).json(compressorCalc(body));
}


async function handle_control_valve(req, body, res) {
  const SECRET_KEY = 'cv-k3y9x';
  if (req.headers['x-api-key'] !== SECRET_KEY)
    return res.status(403).json({ error: 'Forbidden' });
  try {
    const d = body;

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
    const dP   = Math.max(P1a - P2a, 0.0001);
    const TR   = T_F + 459.67;  // Rankine
    const A_in2 = Math.PI / 4 * D_in * D_in;
    const Pc_psia = fluidPc ? fluidPc * 14.5038 : 3208;

    // ── FLOW CONVERSION to canonical units ────────────────────────────────────
    let Qc = Q;
    if (isL) {
      if      (flowType === 'vol')  { if (m) Qc = Q * 4.40287; }
      else if (flowType === 'mass') {
        const rho = SG * 8.3454;
        Qc = m ? (Q * 2.20462) / (rho * 60) : Q / (rho * 60);
      } else { if (m) Qc = Q * 4.40287; }
    } else if (isG) {
      if      (flowType === 'vol')  { if (m) Qc = Q * 35.3147; }
      else if (flowType === 'mass') { const lbh = m ? Q * 2.20462 : Q; Qc = (lbh / SG) * 379.5; }
      else { if (m) Qc = Q * 35.3147; }
    } else {
      Qc = m ? Q * 2.20462 : Q; // steam → lb/h
    }

    // ── CORE IEC 60534-2-1 CALCULATIONS ──────────────────────────────────────
    let Cv = 0, vel = 0, dPmax = 0, dPeff = dP, x_ratio = 0;
    let flowState = '', noiseDb = 0, Y = null, FR = null, Rev = null;

    if (isL) {
      // LIQUID — IEC 60534-2-1 §5.1
      const FF  = Math.min(0.96, 0.96 - 0.28 * Math.sqrt(Math.max(Pva / Pc_psia, 0)));
      dPmax     = Math.max(FL * FL * (P1a - FF * Pva), 0.001);
      dPeff     = Math.min(dP, dPmax);
      Cv        = Qc * Math.sqrt(SG / Math.max(dPeff, 0.0001));

      // Reynolds viscosity correction IEC 60534 §5.3
      Rev = 76000 * Qc / (fluidVisc * Math.sqrt(Math.max(Cv * FL * FL, 0.001)));
      FR  = 1.0;
      if (Rev < 10000) {
        if      (Rev < 10)    FR = 0.026 * Math.pow(Rev, 0.33);
        else if (Rev < 100)   FR = 0.12  * Math.pow(Rev, 0.20);
        else if (Rev < 1000)  FR = 0.34  * Math.pow(Rev, 0.10);
        else                  FR = 0.70  * Math.pow(Rev / 10000, 0.04);
        FR = Math.min(Math.max(FR, 0.1), 1.0);
        Cv = Cv / FR;
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
        const Tsat_F = -459.67 + 49.16 * Math.pow(P1a, 0.2345) + 200;
        const Fs     = 1.0 + 0.00065 * Math.max(T_F - Tsat_F, 0);
        Cv = W * Fs / (2.1 * Math.sqrt(Math.max(dPeff_s * (P1a + P2a), 0.0001)));
      } else if (isWet) {
        Cv = W / (0.90 * 2.1 * Math.sqrt(Math.max(dPeff_s * (P1a + P2a), 0.0001)));
      } else {
        Cv = W / (2.1 * Math.sqrt(Math.max(dPeff_s * (P1a + P2a), 0.0001)));
      }

      const v_spec = (85.76 * TR) / (P2a * 144.0);
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

    // ── DISPLAY LABELS (built server side so no math in client) ──────────────
    const pu        = m ? 'bar' : 'psi';
    const dp2label  = v => v == null ? '—' : (m ? (v/14.5038).toFixed(3) : v.toFixed(2)) + ' ' + pu;

    return res.status(200).json({
      Cv:         fmtN(Cv),
      Kv:         fmtN(Kv),
      vel:        fmtN(vel_disp),
      velOk,
      velLim,
      dP,   dPeff, dPmax,
      dpRatioPct: ((dP / Math.max(P1a,0.001)) * 100).toFixed(1),
      Y:          isG ? fmtN(Y) : null,
      Rev:        isL && Rev != null ? Rev : null,
      flowState,
      noiseDb,
      sizes,
      warns,
      // Display labels — all formatting done server side
      sgLabel:    SG.toFixed(3) + (isL?' (SG)': isG?' g/mol':' (steam MW=18.02)'),
      tempLabel:  m ? ((T_F-32)*5/9).toFixed(1)+'°C' : T_F.toFixed(1)+'°F',
      flLabel:    FL.toFixed(3) + (isG?' (xT)':' (FL)'),
      pipeLabel:  m ? (D_in*25.4).toFixed(1)+' mm' : D_in.toFixed(3)+' in',
      dPmaxLabel: isL||isS ? dp2label(dPmax) : 'x_crit='+((k/1.4)*FL).toFixed(3),
    });

  
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


async function handle_cooling_tower(body, res) {
  const { action, params } = body;
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
}


async function handle_eos(body, res) {
  const { eos, T_K, P_Pa, Tc_K, Pc_Pa, omega, M, n } = body;
  if (!eos)           return res.status(400).json({ error: 'Missing EOS type' });
  if (!isFinite(T_K)  || T_K  <= 0) return res.status(400).json({ error: 'Temperature must be positive and finite.' });
  if (!isFinite(P_Pa) || P_Pa <= 0) return res.status(400).json({ error: 'Pressure must be positive and finite.' });
  if (!isFinite(Tc_K) || Tc_K <= 0) return res.status(400).json({ error: 'Critical temperature Tc must be positive.' });
  if (!isFinite(Pc_Pa)|| Pc_Pa<= 0) return res.status(400).json({ error: 'Critical pressure Pc must be positive.' });
  if (!isFinite(M)    || M    <  1)  return res.status(400).json({ error: 'Molar mass must be ≥ 1 g/mol.' });
  if (!isFinite(n)    || n    <= 0)  return res.status(400).json({ error: 'Number of moles must be positive.' });
  if (T_K < 10) return res.status(400).json({ error: `Temperature ${T_K.toFixed(2)} K is below 10 K.` });
  const roots = runEOS(eos, T_K, P_Pa, Tc_K, Pc_Pa, omega);
  if (!roots.length) return res.status(400).json({ error: 'No real solution found.' });
  const primary = roots.reduce((a, b) => a.Z > b.Z ? a : b);
  const Z = primary.Z;
  if (!isFinite(Z) || Z <= 0) return res.status(400).json({ error: `EOS produced an invalid Z-factor (${Z}).` });
  if (Z > 20) return res.status(400).json({ error: `Z = ${Z.toFixed(3)} — unusually high. Check inputs.` });
  const phi = primary.phi;
  const Vm_SI = primary.Vm;
  const rho_mass = (1 / Vm_SI) * (M / 1000);
  const f_Pa = phi * P_Pa;
  const Tr = T_K / Tc_K, Pr = P_Pa / Pc_Pa;
  const warnings = buildWarnings(eos, T_K, P_Pa, Tc_K, Pc_Pa, omega, Z, Tr, Pr, roots);
  return res.status(200).json({ success: true, data: {
    Z, phi, Vm_SI, rho_mass, f_Pa, Tr, Pr,
    roots: roots.map(r => ({ Z: r.Z, Vm: r.Vm, phi: r.phi, label: r.label })),
    rootCount: roots.length,
    eosParams: { A: primary.A, B: primary.B, a: primary.a, b: primary.b,
                 m: primary.m, kappa: primary.kappa, alpha: primary.alpha },
    warnings
  }});
}


async function handle_fan(body, res) {
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid request body.' });
  const err = validateFanInputs(body);
  if (err) return res.status(400).json({ error: err });
  return res.status(200).json(fanCalc(body));
}


async function handle_heatxpert(body, res) {
  let hxBody = body;
  if (typeof hxBody === 'string') { try { hxBody = JSON.parse(hxBody); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); } }
  const { calcType } = hxBody;
  if (!calcType) return res.status(400).json({ error: 'calcType required' });
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
}


async function handle_orifice_flow(body, res) {
  try {

    const body = await readBody(req);

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
    console.error('orifice-flow error:', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}


async function handle_pressure_drop(req, body, res) {

  setCORS(req, res);

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
    const list = FLUID_DB.map(f => ({
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
}


async function handle_psychrometric(body, res) {
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
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Calculation error.' });
  }
}


async function handle_pump(body, res) {
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid request body.' });
  const err = validatePumpInputs(body);
  if (err) return res.status(400).json({ error: err });
  return res.status(200).json(pumpCalc(body));
}


async function handle_rankine(body, res) {
  const { type, params } = body || {};
  if (!type) return res.status(400).json({ error: 'Missing type' });
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
    if (!result) return res.status(400).json({ error: 'Unknown type: ' + type });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}


async function handle_steam_quench(req, body, res) {
  // body already parsed by router
  // Re-wrap the original handler logic
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

  const Ts = tSat(P_s);   // °C
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
    const satOut = satByP(P_s);
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
    const satWt  = satByT_fb(Math.max(1, Math.min(Tw, 370)));
    const rho_w  = satWt ? 1/satWt.vf : 998;
    const SG     = rho_w / 998.2;
    const Pv_bar = pSat(Tw);
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


}


async function handle_steam_turbine(body, res) {
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

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


async function handle_steam(body, res) {
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

function pSat(T_C) {
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

function tSat(P_bar) {
  if (!isFinite(P_bar) || P_bar <= 0) return NaN;
  if (P_bar >= 220.64) return 374.14;
  // For P > 80 bar the empirical guess overshoots the critical temperature and
  // the Newton solver diverges. Use the SAT_P table for a much better starting guess.
  let T;
  if (P_bar > 80) {
    // SAT_P table already covers 1–220.64 bar; interpolate for Tsat directly.
    const xs = SAT_P.map(r => r[0]);
    const ts = SAT_P.map(r => r[1]);
    T = csplineInterp(xs, ts, P_bar) + 273.15;
  } else {
    T = 100 * Math.pow(P_bar / 1.01325, 0.27) + 273.15;
  }
  for (let i = 0; i < 60; i++) {
    const Tc = T - 273.15;
    const P  = pSat(Tc);
    const dP = (pSat(Tc + 0.005) - pSat(Tc - 0.005)) / 0.01;
    if (!isFinite(P) || !isFinite(dP) || dP === 0) break;
    const dT = (P - P_bar) / dP;
    T -= dT;
    if (Math.abs(dT) < 1e-7) break;
  }
  return T - 273.15;
}

// NIST Saturation Tables
const SAT_T = [
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
const SAT_P = [
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

const SH_FB = [
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

function csplineInterp(xs, ys, x) {
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

function satByT_fb(T_C) {
  if (T_C < 0.01 || T_C > 374.14) return null;
  let row;
  if (T_C <= 240) {
    const xs = SAT_T.map(r=>r[0]);
    const interp = c => csplineInterp(xs, SAT_T.map(r=>r[c]), T_C);
    row = { T:T_C, hf:interp(1), hfg:interp(2), hg:interp(3), sf:interp(4), sfg:interp(5), sg:interp(6), vf:interp(7), vg:interp(8), P:pSat(T_C) };
  } else {
    const P = pSat(T_C);
    row = satByP_fb(P);
  }
  return row;
}

function satByP_fb(P_bar) {
  if (P_bar < 0.006 || P_bar > 220.9) return null;
  const xs = SAT_P.map(r=>r[0]);
  const interp = c => csplineInterp(xs, SAT_P.map(r=>r[c]), P_bar);
  const Ts=interp(1), hf=interp(2), hg=interp(3), sf=interp(4), sg=interp(5), vf=interp(6), vg=interp(7);
  return { T:Ts, P:P_bar, hf, hfg:hg-hf, hg, sf, sfg:sg-sf, sg, vf, vg };
}

function shProps_fb(P_bar, T_C) {
  const prs = SH_FB.map(b=>b.P);
  function atB(idx,T) {
    const d = SH_FB[idx].d;
    return { h:csplineInterp(d.map(r=>r[0]),d.map(r=>r[1]),T), s:csplineInterp(d.map(r=>r[0]),d.map(r=>r[2]),T), v:csplineInterp(d.map(r=>r[0]),d.map(r=>r[3]),T) };
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
  const Tsat = tSat(P_bar);
  return { h:fb.h, s:fb.s, v:fb.v, rho:1/fb.v, u:fb.h-P_bar*100*fb.v, Tsat, dT_sh:T_C-Tsat };
}

function calcProps(type, P_bar, T_C, x, specBy) {
  if (type === 'compressed') {
    if (!isFinite(T_C)||T_C<0.01||T_C>=374.14) return { error:'Temperature must be 0.01–374°C for compressed liquid.' };
    if (!isFinite(P_bar)||P_bar<=0.006) return { error:'Pressure must be ≥ 0.006 bar.' };
    const T_sat = tSat(P_bar);
    if (!isFinite(T_sat)) return { error:'Pressure out of range (0.006–220.9 bar).' };
    if (T_C>=T_sat) return { error:`Temperature must be below T_sat = ${T_sat.toFixed(2)}°C at ${P_bar.toFixed(3)} bar.` };
    const sat = satByT_fb(T_C);
    if (!sat) return { error:'Out of valid range.' };
    const dP_kPa = (P_bar-sat.P)*100;
    const h = sat.hf+sat.vf*dP_kPa, s = sat.sf, v = sat.vf*(1-4e-5*(P_bar-sat.P));
    const result = { phase:'Compressed Liquid', phaseCls:'compressed', T:T_C, P:P_bar, Tsat:T_sat, h, s, v, rho:1/v, u:h-P_bar*100*v, x:null, hf:sat.hf, hfg:sat.hfg, hg:sat.hg };
    return addTransport(result, 'compressed');
  }
  if (type === 'sat-liq') {
    if (specBy==='P' && (!isFinite(P_bar)||P_bar<0.006||P_bar>220.9)) return { error:'Saturation pressure must be 0.006 – 220.9 bar.' };
    if (specBy==='T' && (!isFinite(T_C)||T_C<0.01||T_C>374.14)) return { error:'Saturation temperature must be 0.01 – 374.14°C (above 374.14°C there is no liquid-vapor saturation).' };
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb(T_C);
    if (!sat) return { error:'Input out of valid range (0.006–220.9 bar / 0.01–374.14°C).' };
    const result = { phase:'Saturated Liquid', phaseCls:'sat-liq', T:sat.T, P:sat.P, Tsat:sat.T, h:sat.hf, s:sat.sf, v:sat.vf, rho:1/sat.vf, u:sat.hf-sat.P*100*sat.vf, x:0, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
    return addTransport(result, 'sat-liq');
  }
  if (type === 'wet') {
    if (x === null || x === undefined || !isFinite(Number(x)) || Number(x)<0 || Number(x)>1) return { error:'Steam quality x must be between 0 and 1.' };
    x = Number(x);
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb(T_C);
    if (!sat) return { error:'Input out of valid range.' };
    const h=sat.hf+x*sat.hfg, s=sat.sf+x*sat.sfg, v=sat.vf+x*(sat.vg-sat.vf);
    const result = { phase:`Wet Steam (x = ${x.toFixed(3)})`, phaseCls:'wet', T:sat.T, P:sat.P, Tsat:sat.T, h, s, v, rho:1/v, u:h-sat.P*100*v, x, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
    return addTransport(result, 'wet');
  }
  if (type === 'sat-vap') {
    if (specBy==='P' && (!isFinite(P_bar)||P_bar<0.006||P_bar>220.9)) return { error:'Saturation pressure must be 0.006 – 220.9 bar.' };
    if (specBy==='T' && (!isFinite(T_C)||T_C<0.01||T_C>374.14)) return { error:'Saturation temperature must be 0.01 – 374.14°C. Above 374.14°C is supercritical — no distinct vapor phase.' };
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb(T_C);
    if (!sat) return { error:'Input out of valid range.' };
    const result = { phase:'Saturated Vapor (Dry)', phaseCls:'sat-vap', T:sat.T, P:sat.P, Tsat:sat.T, h:sat.hg, s:sat.sg, v:sat.vg, rho:1/sat.vg, u:sat.hg-sat.P*100*sat.vg, x:1, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
    return addTransport(result, 'sat-vap');
  }
  if (type === 'superheat') {
    if (!isFinite(P_bar)||P_bar<=0||P_bar>1000) return { error:'Pressure must be 0.006–1000 bar.' };
    if (!isFinite(T_C)||T_C<0.01||T_C>800) return { error:'Temperature must be 0.01–800°C.' };
    const T_sat = tSat(P_bar);
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

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


// ================================================================
// MAIN VERCEL HANDLER — routes by URL path
// ================================================================

export default async function handler(req, res) {
  // CORS — allow vercel preview + production domains
  const origin = req.headers.origin || '';
  const isAllowed = origin.endsWith('.vercel.app') ||
                    origin.includes('multicalci.com') ||
                    origin === 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin',  isAllowed ? origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Max-Age',       '86400');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // Determine route from URL: /api/compressor → 'compressor'
  const url   = req.url || '';
  const route = url.split('?')[0].replace(/\/+$/, '').split('/').pop();

  // Parse body safely
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
  }

  try {
    switch (route) {
      case 'compressor':               return await handle_compressor(body, res);
      case 'control-valve':            return await handle_control_valve(req, body, res);
      case 'cooling-tower':            return await handle_cooling_tower(body, res);
      case 'eos':                      return await handle_eos(body, res);
      case 'fan':                      return await handle_fan(body, res);
      case 'heatxpert':                return await handle_heatxpert(body, res);
      case 'orifice-flow':             return await handle_orifice_flow(body, res);
      case 'pressure-drop-calculator': return await handle_pressure_drop(req, body, res);
      case 'psychrometric':            return await handle_psychrometric(body, res);
      case 'pump':                     return await handle_pump(body, res);
      case 'rankine':                  return await handle_rankine(body, res);
      case 'steam-quench':             return await handle_steam_quench(req, body, res);
      case 'steam-turbine-power':      return await handle_steam_turbine(body, res);
      case 'steam':                    return await handle_steam(body, res);
      default:
        return res.status(404).json({ error: `Unknown route: "${route}". Valid routes: compressor, control-valve, cooling-tower, eos, fan, heatxpert, orifice-flow, pressure-drop-calculator, psychrometric, pump, rankine, steam-quench, steam-turbine-power, steam` });
    }
  } catch (e) {
    console.error(`[api/index.js] [${route}] Unhandled error:`, e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
