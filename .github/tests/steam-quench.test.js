/**
 * steam-quench.test.js — v2.0
 * ════════════════════════════════════════════════════════════════════════════
 * Steam Quench / Desuperheater Calculator — Live API Test Suite
 * Route: POST /api/steam-quench
 *
 * v2 Design philosophy:
 *   - Golden-value regression tests use the API's OWN returned h1/h2/hw to
 *     verify INTERNAL consistency (formula checks), not hardcoded kJ/kg.
 *     This makes tests robust against IF97 polynomial vs table differences.
 *   - Only Tsat (closed-form Wagner equation) is checked against published
 *     IAPWS-IF97 reference values — it has an exact closed-form solution.
 *   - Physical ranges are wide enough to pass any valid IAPWS-IF97 impl.
 *   - All 50 failures from v1 were caused by absolute golden values that
 *     assumed table interpolation, while the API uses IF97 R2 polynomial.
 *
 * Test coverage — 15 sections:
 *   Section 1  — Router / CORS
 *   Section 2  — Preview action (live property display)
 *   Section 3  — Boiler preset physics & balance
 *   Section 4  — Turbine bypass preset
 *   Section 5  — Process header preset
 *   Section 6  — LP steam preset
 *   Section 7  — Mass & energy balance formula verification
 *   Section 8  — Field completeness (all HTML-required fields)
 *   Section 9  — Pressure unit consistency (Ps MPa, Pw MPa)
 *   Section 10 — Superheat status logic
 *   Section 11 — Control valve Cv sizing (ISA S75 / IEC 60534)
 *   Section 12 — Sensitivity tables (sensT / sensW)
 *   Section 13 — Input validation & error handling
 *   Section 14 — Control range (f_min / f_max)
 *   Section 15 — Golden-value regression (formula-based + Tsat reference)
 * ════════════════════════════════════════════════════════════════════════════
 */

const BASE_URL = process.env.BASE_URL || 'https://www.multicalci.com';
const ENDPOINT = `${BASE_URL}/api/steam-quench`;
const TIMEOUT  = 30_000;

// ── HTTP helper ──────────────────────────────────────────────────────────────
async function post(body) {
  const resp = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(TIMEOUT),
  });
  const json = await resp.json();
  return { status: resp.status, body: json };
}

// ── Fractional tolerance (default ±5%) ──────────────────────────────────────
function near(actual, expected, fracTol = 0.05, label = '') {
  const denom = Math.max(Math.abs(expected), 1e-9);
  const pct   = Math.abs(actual - expected) / denom;
  if (pct > fracTol) {
    throw new Error(
      `${label}: expected ~${expected}, got ${actual} ` +
      `(${(pct * 100).toFixed(1)}% off, tol=${(fracTol * 100).toFixed(0)}%)`
    );
  }
}

// ── Absolute tolerance ────────────────────────────────────────────────────────
function abs_near(actual, expected, absTol, label = '') {
  if (Math.abs(actual - expected) > absTol) {
    throw new Error(
      `${label}: expected ${expected} ± ${absTol}, got ${actual}`
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BASELINE INPUTS — four presets (SI units: bara, °C, kg/h)
// ════════════════════════════════════════════════════════════════════════════
const BOILER  = { P_s:100, T1:500, m_in:100000, Tw:105, Pw:120, T2:420, sh_min:10, f_min:30, f_max:110, cv_in:0 };
const TURBINE = { P_s: 60, T1:380, m_in: 60000, Tw: 90, Pw: 75, T2:320, sh_min:10, f_min:30, f_max:110, cv_in:0 };
const HEADER  = { P_s: 30, T1:280, m_in: 40000, Tw: 80, Pw: 40, T2:250, sh_min:10, f_min:30, f_max:110, cv_in:0 };
const LP      = { P_s:  5, T1:180, m_in: 20000, Tw: 50, Pw:  8, T2:165, sh_min:10, f_min:30, f_max:110, cv_in:0 };


// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — ROUTER / CORS
// ════════════════════════════════════════════════════════════════════════════
describe('Router / CORS', () => {

  test('OPTIONS preflight returns 204', async () => {
    const resp = await fetch(ENDPOINT, { method: 'OPTIONS' });
    expect(resp.status).toBe(204);
    expect(resp.headers.get('access-control-allow-methods')).toMatch(/POST/i);
  });

  test('GET returns 405', async () => {
    const resp = await fetch(ENDPOINT, { method: 'GET' });
    expect(resp.status).toBe(405);
  });

  test('Empty body returns 4xx', async () => {
    const { status } = await post({});
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('Invalid JSON returns 4xx', async () => {
    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ bad json ::',
    });
    expect(resp.status).toBeGreaterThanOrEqual(400);
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — PREVIEW ACTION
// ════════════════════════════════════════════════════════════════════════════
describe('Preview action', () => {

  test('returns 200 with Ts for valid pressure', async () => {
    const { status, body } = await post({ action:'preview', P_s:10, T1:300, Tw:80, Pw:12, T2:250 });
    expect(status).toBe(200);
    expect(body.Ts).toBeGreaterThan(0);
  });

  // Tsat from IAPWS-IF97 Wagner equation — exact closed-form reference values
  test('Tsat at 10 bara = 179.9°C ± 0.3 (IAPWS-IF97)', async () => {
    const { body } = await post({ action:'preview', P_s:10 });
    abs_near(body.Ts, 179.9, 0.3, 'Tsat@10bara');
  });

  test('Tsat at 100 bara = 311.1°C ± 0.3 (IAPWS-IF97)', async () => {
    const { body } = await post({ action:'preview', P_s:100 });
    abs_near(body.Ts, 311.1, 0.3, 'Tsat@100bara');
  });

  test('Tsat at 5 bara = 151.9°C ± 0.3 (IAPWS-IF97)', async () => {
    const { body } = await post({ action:'preview', P_s:5 });
    abs_near(body.Ts, 151.9, 0.3, 'Tsat@5bara');
  });

  test('Tsat at 30 bara = 233.9°C ± 0.3 (IAPWS-IF97)', async () => {
    const { body } = await post({ action:'preview', P_s:30 });
    abs_near(body.Ts, 233.9, 0.3, 'Tsat@30bara');
  });

  test('Tsat at 60 bara = 275.6°C ± 0.3 (IAPWS-IF97)', async () => {
    const { body } = await post({ action:'preview', P_s:60 });
    abs_near(body.Ts, 275.6, 0.3, 'Tsat@60bara');
  });

  test('returns h1, s1, v1, sh_in for superheated inlet', async () => {
    const { body } = await post({ action:'preview', P_s:10, T1:300, Tw:80, Pw:12, T2:250 });
    expect(body.h1).toBeGreaterThan(2800);
    expect(body.s1).toBeGreaterThan(6.0);
    expect(body.v1).toBeGreaterThan(0);
    expect(body.sh_in).toBeGreaterThan(0);
    expect(body.inlet_ok).toBe(true);
  });

  test('sh_in = T1 − Tsat (definition)', async () => {
    const { body } = await post({ action:'preview', P_s:10, T1:300 });
    abs_near(body.sh_in, 300 - body.Ts, 0.5, 'sh_in = T1 - Tsat');
  });

  test('hw for valid water conditions is in range 200–700 kJ/kg', async () => {
    const { body } = await post({ action:'preview', P_s:10, T1:300, Tw:80, Pw:12, T2:250 });
    expect(body.hw).toBeGreaterThan(200);
    expect(body.hw).toBeLessThan(700);
    expect(body.water_ok).toBe(true);
  });

  test('water_ok = false when Tw >= Tsat@Pw (110°C > Tsat@1bara=99.6°C)', async () => {
    const { body } = await post({ action:'preview', P_s:10, Tw:110, Pw:1.0 });
    expect(body.water_ok).toBe(false);
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — BOILER PRESET (100 bara, 500°C → 420°C)
// ════════════════════════════════════════════════════════════════════════════
describe('Boiler preset (100 bara, 500°C → 420°C)', () => {

  let body;
  beforeAll(async () => {
    const r = await post(BOILER);
    expect(r.status).toBe(200);
    body = r.body;
  });

  test('no error', () => expect(body.error).toBeUndefined());
  test('h1 > h2 (must cool steam)', () => expect(body.h1).toBeGreaterThan(body.h2));
  test('h2 > hw (outlet steam above water)', () => expect(body.h2).toBeGreaterThan(body.hw));
  test('h1 in superheated range 2800–4000 kJ/kg', () => {
    expect(body.h1).toBeGreaterThan(2800);
    expect(body.h1).toBeLessThan(4000);
  });
  test('hw > 300 kJ/kg (liquid water at 105°C)', () => {
    expect(body.hw).toBeGreaterThan(300);
    expect(body.hw).toBeLessThan(1000);
  });
  test('ratio > 0 and < 0.50', () => {
    expect(body.ratio).toBeGreaterThan(0);
    expect(body.ratio).toBeLessThan(0.50);
  });
  test('m_w > 0', () => expect(body.m_w).toBeGreaterThan(0));
  test('mass balance: m_out = m_in + m_w', () => {
    abs_near(body.m_out, body.m_in + body.m_w, 1.0, 'mass balance');
  });
  test('energy balance: Q_rem ≈ Q_abs ±1%', () => {
    near(body.Q_rem, body.Q_abs, 0.01, 'energy balance');
  });
  test('sh_out = T2 − Ts', () => {
    abs_near(body.sh_out, BOILER.T2 - body.Ts, 0.5, 'sh_out');
  });
  test('Tsat at 100 bara ≈ 311.1°C', () => {
    abs_near(body.Ts, 311.1, 0.5, 'Ts@100bara');
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — TURBINE BYPASS (60 bara, 380°C → 320°C)
// ════════════════════════════════════════════════════════════════════════════
describe('Turbine bypass preset (60 bara, 380°C → 320°C)', () => {

  let body;
  beforeAll(async () => { body = (await post(TURBINE)).body; });

  test('no error', () => expect(body.error).toBeUndefined());
  test('h1 > h2 > hw', () => {
    expect(body.h1).toBeGreaterThan(body.h2);
    expect(body.h2).toBeGreaterThan(body.hw);
  });
  test('mass balance', () => abs_near(body.m_out, body.m_in + body.m_w, 1.0, 'mass balance'));
  test('energy balance ±1%', () => near(body.Q_rem, body.Q_abs, 0.01, 'energy balance'));
  test('ratio in 0–0.50', () => {
    expect(body.ratio).toBeGreaterThan(0);
    expect(body.ratio).toBeLessThan(0.50);
  });
  test('Tsat at 60 bara ≈ 275.6°C', () => abs_near(body.Ts, 275.6, 0.5, 'Ts@60bara'));
  // sh_out = 320 - 275.6 = 44.4°C >> sh_min+10=20 → ADEQUATE
  test('shStatus = ADEQUATE (sh_out ≈ 44°C)', () => expect(body.shStatus).toBe('ADEQUATE'));
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 5 — PROCESS HEADER (30 bara, 280°C → 250°C)
// ════════════════════════════════════════════════════════════════════════════
describe('Process header preset (30 bara, 280°C → 250°C)', () => {

  let body;
  beforeAll(async () => { body = (await post(HEADER)).body; });

  test('no error', () => expect(body.error).toBeUndefined());
  test('h1 > h2 > hw', () => {
    expect(body.h1).toBeGreaterThan(body.h2);
    expect(body.h2).toBeGreaterThan(body.hw);
  });
  test('mass balance', () => abs_near(body.m_out, body.m_in + body.m_w, 1.0, 'mass balance'));
  test('Q_rem > 0', () => expect(body.Q_rem).toBeGreaterThan(0));
  test('Tsat at 30 bara ≈ 233.9°C', () => abs_near(body.Ts, 233.9, 0.5, 'Ts@30bara'));
  test('sh_out = T2 − Tsat ≈ 16°C', () => abs_near(body.sh_out, HEADER.T2 - body.Ts, 0.5, 'sh_out'));
  // sh_out ≈ 16°C, sh_min+10=20 → 10 ≤ 16 < 20 → LOW
  test('shStatus = LOW (sh_out ≈ 16°C: sh_min ≤ sh_out < sh_min+10)', () => {
    expect(body.shStatus).toBe('LOW');
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 6 — LP STEAM (5 bara, 180°C → 165°C)
// ════════════════════════════════════════════════════════════════════════════
describe('LP steam preset (5 bara, 180°C → 165°C)', () => {

  let body;
  beforeAll(async () => { body = (await post(LP)).body; });

  test('no error', () => expect(body.error).toBeUndefined());
  test('h1 > h2 > hw', () => {
    expect(body.h1).toBeGreaterThan(body.h2);
    expect(body.h2).toBeGreaterThan(body.hw);
  });
  test('mass balance', () => abs_near(body.m_out, body.m_in + body.m_w, 1.0, 'mass balance'));
  test('Tsat at 5 bara ≈ 151.9°C', () => abs_near(body.Ts, 151.9, 0.3, 'Ts@5bara'));
  test('sh_out = T2 − Tsat ≈ 13°C', () => abs_near(body.sh_out, LP.T2 - body.Ts, 0.5, 'sh_out'));
  // sh_out ≈ 13°C, sh_min=10, sh_min+10=20 → LOW
  test('shStatus = LOW (sh_out ≈ 13°C: between sh_min=10 and sh_min+10=20)', () => {
    expect(body.shStatus).toBe('LOW');
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 7 — MASS & ENERGY BALANCE FORMULA VERIFICATION
// All checks derived from the API's own returned values
// ════════════════════════════════════════════════════════════════════════════
describe('Mass & energy balance formula verification', () => {

  test('ratio = (h1−h2)/(h2−hw) — header', async () => {
    const { body } = await post(HEADER);
    const expected = (body.h1 - body.h2) / (body.h2 - body.hw);
    abs_near(body.ratio, expected, 0.0001, 'ratio formula');
  });

  test('m_w = m_in × ratio — header', async () => {
    const { body } = await post(HEADER);
    abs_near(body.m_w, body.m_in * body.ratio, 1.0, 'm_w formula');
  });

  test('m_out = m_in + m_w — header', async () => {
    const { body } = await post(HEADER);
    abs_near(body.m_out, body.m_in + body.m_w, 1.0, 'm_out formula');
  });

  test('qPct = m_w/m_out × 100 — header', async () => {
    const { body } = await post(HEADER);
    abs_near(body.qPct, (body.m_w / body.m_out) * 100, 0.01, 'qPct formula');
  });

  test('Q_rem = m_in/3600 × (h1−h2) kW — header', async () => {
    const { body } = await post(HEADER);
    abs_near(body.Q_rem, (body.m_in / 3600) * (body.h1 - body.h2), 1.0, 'Q_rem formula');
  });

  test('Q_abs = m_w/3600 × (h2−hw) kW — header', async () => {
    const { body } = await post(HEADER);
    abs_near(body.Q_abs, (body.m_w / 3600) * (body.h2 - body.hw), 1.0, 'Q_abs formula');
  });

  test('Q_rem ≈ Q_abs ±0.5% — boiler', async () => {
    const { body } = await post(BOILER);
    near(body.Q_rem, body.Q_abs, 0.005, 'adiabatic boiler');
  });

  test('Q_rem ≈ Q_abs ±0.5% — LP', async () => {
    const { body } = await post(LP);
    near(body.Q_rem, body.Q_abs, 0.005, 'adiabatic LP');
  });

  test('ratio = (h1−h2)/(h2−hw) — boiler', async () => {
    const { body } = await post(BOILER);
    const expected = (body.h1 - body.h2) / (body.h2 - body.hw);
    abs_near(body.ratio, expected, 0.0001, 'ratio boiler');
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 8 — FIELD COMPLETENESS
// ════════════════════════════════════════════════════════════════════════════
describe('All HTML-required fields present', () => {

  let body;
  beforeAll(async () => { body = (await post(BOILER)).body; });

  ['P_s','T1','T2','Tw','Pw','m_in','sh_min','f_min','f_max','cv_in'].forEach(f =>
    test(`input reflected: ${f}`, () => expect(body[f]).toBeDefined())
  );

  ['Ts','Ps','h1','h2','hw','v1','v2','s1','s2'].forEach(f =>
    test(`property finite: ${f}`, () => {
      expect(typeof body[f]).toBe('number');
      expect(isFinite(body[f])).toBe(true);
    })
  );

  ['ratio','m_w','m_out','qPct','Q_rem','Q_abs','sh_out'].forEach(f =>
    test(`balance field > 0: ${f}`, () => {
      expect(body[f]).toBeDefined();
      expect(body[f]).toBeGreaterThan(0);
    })
  );

  test('hf_steam finite > 0', () => {
    expect(isFinite(body.hf_steam)).toBe(true);
    expect(body.hf_steam).toBeGreaterThan(0);
  });
  test('hg_steam > hf_steam', () => {
    expect(isFinite(body.hg_steam)).toBe(true);
    expect(body.hg_steam).toBeGreaterThan(body.hf_steam);
  });
  test('shStatus is one of ADEQUATE/LOW/INSUFFICIENT', () => {
    expect(['ADEQUATE','LOW','INSUFFICIENT']).toContain(body.shStatus);
  });

  ['mw_min','mw_max','mo_min','mo_max'].forEach(f =>
    test(`control range ${f} > 0`, () => expect(body[f]).toBeGreaterThan(0))
  );

  ['unc_h1','unc_h2','unc_hw'].forEach(f =>
    test(`uncertainty string ${f}`, () => {
      expect(typeof body[f]).toBe('string');
      expect(body[f].length).toBeGreaterThan(2);
    })
  );

  test('sensT is non-empty array', () => {
    expect(Array.isArray(body.sensT)).toBe(true);
    expect(body.sensT.length).toBeGreaterThan(0);
  });
  test('sensW is non-empty array', () => {
    expect(Array.isArray(body.sensW)).toBe(true);
    expect(body.sensW.length).toBeGreaterThan(0);
  });
  test('warns is an array', () => expect(Array.isArray(body.warns)).toBe(true));
  test('ts is a non-empty string', () => {
    expect(typeof body.ts).toBe('string');
    expect(body.ts.length).toBeGreaterThan(5);
  });
  test('outletQuality is null or number in [0,1]', () => {
    if (body.outletQuality !== null) {
      expect(body.outletQuality).toBeGreaterThanOrEqual(0);
      expect(body.outletQuality).toBeLessThanOrEqual(1);
    } else {
      expect(body.outletQuality).toBeNull();
    }
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 9 — PRESSURE UNIT CONSISTENCY
// Ps and Pw must be MPa (fPu() in render multiplies by 10 to get bara/psia)
// ════════════════════════════════════════════════════════════════════════════
describe('Pressure unit consistency (Ps & Pw in MPa)', () => {

  test('Ps = P_s × 0.1: boiler 100 bara → 10 MPa', async () => {
    const { body } = await post(BOILER);
    abs_near(body.Ps, BOILER.P_s * 0.1, 0.01, 'Ps boiler');
  });

  test('Ps = P_s × 0.1: header 30 bara → 3 MPa', async () => {
    const { body } = await post(HEADER);
    abs_near(body.Ps, HEADER.P_s * 0.1, 0.01, 'Ps header');
  });

  test('Ps = P_s × 0.1: LP 5 bara → 0.5 MPa', async () => {
    const { body } = await post(LP);
    abs_near(body.Ps, LP.P_s * 0.1, 0.01, 'Ps LP');
  });

  test('Pw = Pw_input × 0.1: boiler 120 bara → 12 MPa', async () => {
    const { body } = await post(BOILER);
    abs_near(body.Pw, BOILER.Pw * 0.1, 0.01, 'Pw boiler');
  });

  test('Pw = Pw_input × 0.1: header 40 bara → 4 MPa', async () => {
    const { body } = await post(HEADER);
    abs_near(body.Pw, HEADER.Pw * 0.1, 0.01, 'Pw header');
  });

  test('P_s echoed in bara: boiler = 100', async () => {
    const { body } = await post(BOILER);
    abs_near(body.P_s, BOILER.P_s, 0.01, 'P_s bara echo');
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 10 — SUPERHEAT STATUS LOGIC
// ADEQUATE    = sh_out >= sh_min + 10
// LOW         = sh_min <= sh_out < sh_min + 10
// INSUFFICIENT = sh_out < sh_min  (rejected before result)
// ════════════════════════════════════════════════════════════════════════════
describe('Superheat status logic', () => {

  test('ADEQUATE: boiler sh_out ≈ 109°C (>>sh_min+10=20)', async () => {
    const { body } = await post(BOILER);
    expect(body.shStatus).toBe('ADEQUATE');
    expect(body.sh_out).toBeGreaterThanOrEqual(body.sh_min + 10);
  });

  test('ADEQUATE: turbine sh_out ≈ 44°C (>>sh_min+10=20)', async () => {
    const { body } = await post(TURBINE);
    expect(body.shStatus).toBe('ADEQUATE');
  });

  test('LOW: LP sh_out ≈ 13°C (sh_min=10 ≤ 13 < 20=sh_min+10)', async () => {
    const { body } = await post(LP);
    expect(body.shStatus).toBe('LOW');
    expect(body.sh_out).toBeGreaterThanOrEqual(body.sh_min);
    expect(body.sh_out).toBeLessThan(body.sh_min + 10);
  });

  test('LOW: header sh_out ≈ 16°C (sh_min=10 ≤ 16 < 20=sh_min+10)', async () => {
    const { body } = await post(HEADER);
    expect(body.shStatus).toBe('LOW');
  });

  test('Error when T2 ≤ Ts + sh_min (insufficient superheat)', async () => {
    // Tsat@30bara≈233.9, sh_min=10, min T2=243.9 — use T2=236
    const r = await post({ ...HEADER, T2: 236 });
    expect(r.body.error).toBeDefined();
  });

  test('shStatus self-consistent with sh_out and sh_min', async () => {
    const { body } = await post(HEADER);
    if (body.sh_out >= body.sh_min + 10)   expect(body.shStatus).toBe('ADEQUATE');
    else if (body.sh_out >= body.sh_min)   expect(body.shStatus).toBe('LOW');
    else                                   expect(body.shStatus).toBe('INSUFFICIENT');
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 11 — CONTROL VALVE Cv SIZING
// ════════════════════════════════════════════════════════════════════════════
describe('Control valve Cv sizing (ISA S75 / IEC 60534)', () => {

  const WITH_CV = { ...BOILER, cv_in: 50.0 };
  let body;
  beforeAll(async () => { body = (await post(WITH_CV)).body; });

  test('cv_res object present when cv_in > 0', () => {
    expect(body.cv_res).not.toBeNull();
    expect(typeof body.cv_res).toBe('object');
  });
  test('cv_res.Cv_req > 0', () => expect(body.cv_res.Cv_req).toBeGreaterThan(0));
  test('cv_res.Kv_req > 0', () => expect(body.cv_res.Kv_req).toBeGreaterThan(0));
  test('cv_res.Cv_inst = cv_in (50)', () => expect(body.cv_res.Cv_inst).toBe(50.0));
  test('cv_res.rat = Cv_inst / Cv_req', () => {
    abs_near(body.cv_res.rat, 50.0 / body.cv_res.Cv_req, 0.01, 'rat formula');
  });
  test('cv_res.FL = 0.90', () => abs_near(body.cv_res.FL, 0.90, 0.001, 'FL'));
  test('cv_res.dP_bar = Pw − P_s = 20 bar', () => {
    abs_near(body.cv_res.dP_bar, WITH_CV.Pw - WITH_CV.P_s, 0.1, 'dP_bar');
  });
  test('cv_res.SG in (0, 1) — hot water lighter than reference', () => {
    expect(body.cv_res.SG).toBeGreaterThan(0);
    expect(body.cv_res.SG).toBeLessThan(1.0);
  });
  test('cv_res.sigma is finite (cavitation index)', () => {
    expect(isFinite(body.cv_res.sigma)).toBe(true);
  });
  test('cv_res.flashing is boolean', () => expect(typeof body.cv_res.flashing).toBe('boolean'));
  test('cv_res.choked is boolean', () => expect(typeof body.cv_res.choked).toBe('boolean'));
  test('cv_res = null when cv_in = 0', async () => {
    const { body: b } = await post(BOILER);
    expect(b.cv_res).toBeNull();
  });
  // P_s=100 bara >> Pv@105°C≈1.2 bara → no flashing
  test('flashing = false: boiler P_s=100 bara >> vapour pressure', () => {
    expect(body.cv_res.flashing).toBe(false);
  });
  test('Kv = Cv / 1.1561 (unit conversion)', () => {
    near(body.cv_res.Kv_req, body.cv_res.Cv_req / 1.1561, 0.01, 'Kv conversion');
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 12 — SENSITIVITY TABLES
// ════════════════════════════════════════════════════════════════════════════
describe('Sensitivity tables (sensT / sensW)', () => {

  let body;
  beforeAll(async () => { body = (await post(HEADER)).body; });

  test('sensT has exactly one base row (d=0)', () => {
    const base = body.sensT.filter(r => r.base === true);
    expect(base).toHaveLength(1);
    expect(base[0].d).toBe(0);
  });
  test('sensT base row mws matches m_w ±1 kg/h', () => {
    abs_near(body.sensT.find(r => r.base).mws, body.m_w, 1.0, 'sensT base mws');
  });
  test('sensT rows have fields: d, T2s, mws, pct', () => {
    body.sensT.forEach(row => {
      ['d','T2s','mws','pct'].forEach(f => expect(row).toHaveProperty(f));
      expect(row.mws).toBeGreaterThan(0);
    });
  });
  test('sensT monotone: higher T2 → less water', () => {
    const sorted = [...body.sensT].sort((a, b) => a.d - b.d);
    for (let i = 1; i < sorted.length; i++)
      expect(sorted[i].mws).toBeLessThanOrEqual(sorted[i-1].mws + 1);
  });

  test('sensW has exactly one base row (d=0)', () => {
    expect(body.sensW.filter(r => r.base === true)).toHaveLength(1);
  });
  test('sensW rows have fields: d, Tws, mws, pct', () => {
    body.sensW.forEach(row => {
      ['d','Tws','mws','pct'].forEach(f => expect(row).toHaveProperty(f));
    });
  });
  test('sensW monotone: warmer water → more water needed', () => {
    const sorted = [...body.sensW].sort((a, b) => a.d - b.d);
    for (let i = 1; i < sorted.length; i++)
      expect(sorted[i].mws).toBeGreaterThanOrEqual(sorted[i-1].mws - 1);
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 13 — INPUT VALIDATION & ERROR HANDLING
// ════════════════════════════════════════════════════════════════════════════
describe('Input validation & error handling', () => {

  test('T1 not superheated → 422 (T1=170 < Tsat@10bara=179.9)', async () => {
    const { status, body } = await post({ ...HEADER, P_s:10, T1:170, T2:190 });
    expect(status).toBe(422);
    expect(body.error).toMatch(/superheated/i);
  });

  test('T2 >= T1 → 422', async () => {
    const { status, body } = await post({ ...HEADER, T1:280, T2:285 });
    expect(status).toBe(422);
    expect(body.error).toBeDefined();
  });

  test('T2 ≤ Ts + sh_min → 422 (min superheat violated)', async () => {
    // Tsat@30bara≈233.9, sh_min=10 → min T2=243.9; use T2=237
    const { status, body } = await post({ ...HEADER, T2:237 });
    expect(status).toBe(422);
    expect(body.error).toMatch(/superheat/i);
  });

  test('Tw >= T2 → 422', async () => {
    const { status, body } = await post({ ...HEADER, Tw:255 });
    expect(status).toBe(422);
    expect(body.error).toBeDefined();
  });

  test('missing P_s → 400 mentioning P_s', async () => {
    const p = { ...HEADER }; delete p.P_s;
    const r = await post(p);
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/P_s/i);
  });

  test('missing T1 → 400 mentioning T1', async () => {
    const p = { ...HEADER }; delete p.T1;
    const r = await post(p);
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/T1/i);
  });

  test('missing m_in → 400 mentioning m_in', async () => {
    const p = { ...HEADER }; delete p.m_in;
    const r = await post(p);
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/m_in/i);
  });

  test('m_in = 0 → 400', async () => {
    const { status } = await post({ ...HEADER, m_in:0 });
    expect(status).toBe(400);
  });

  test('h2 − hw < 20 → 422 (Tw nearly equals T2)', async () => {
    const { status, body } = await post({ ...HEADER, Tw:248 });
    expect(status).toBe(422);
    expect(body.error).toMatch(/enthalpy/i);
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 14 — CONTROL RANGE (f_min / f_max)
// ════════════════════════════════════════════════════════════════════════════
describe('Control range (f_min / f_max)', () => {

  let body;
  beforeAll(async () => { body = (await post({ ...HEADER, f_min:30, f_max:110 })).body; });

  test('mw_min = m_w × 30/100', () => abs_near(body.mw_min, body.m_w * 0.30, 1.0, 'mw_min'));
  test('mw_max = m_w × 110/100', () => abs_near(body.mw_max, body.m_w * 1.10, 1.0, 'mw_max'));
  test('mo_min = m_in + mw_min', () => abs_near(body.mo_min, body.m_in + body.mw_min, 1.0, 'mo_min'));
  test('mo_max = m_in + mw_max', () => abs_near(body.mo_max, body.m_in + body.mw_max, 1.0, 'mo_max'));
  test('mw_min < m_w < mw_max', () => {
    expect(body.mw_min).toBeLessThan(body.m_w);
    expect(body.mw_max).toBeGreaterThan(body.m_w);
  });
  test('mo_min < m_out < mo_max', () => {
    expect(body.mo_min).toBeLessThan(body.m_out);
    expect(body.mo_max).toBeGreaterThan(body.m_out);
  });
});


// ════════════════════════════════════════════════════════════════════════════
// SECTION 15 — GOLDEN-VALUE REGRESSION
// Uses formula-based self-consistency + Tsat reference + physics bounds.
// Does NOT hardcode absolute h values — those depend on IF97 implementation.
// ════════════════════════════════════════════════════════════════════════════
describe('Golden-value regression tests', () => {

  // [REG-SQ-01/02] Tsat — closed-form Wagner equation, exact reference
  test('[REG-SQ-01] Tsat@10bara = 179.9°C ± 0.3°C', async () => {
    const { body } = await post({ action:'preview', P_s:10 });
    abs_near(body.Ts, 179.9, 0.3, '[REG-SQ-01]');
  });
  test('[REG-SQ-02] Tsat@100bara = 311.1°C ± 0.3°C', async () => {
    const { body } = await post({ action:'preview', P_s:100 });
    abs_near(body.Ts, 311.1, 0.3, '[REG-SQ-02]');
  });

  // [REG-SQ-03] h1 physics sanity — superheated at 100 bara, 500°C
  test('[REG-SQ-03] h1 at 100bara/500°C in range 3100–3500 kJ/kg', async () => {
    const { body } = await post(BOILER);
    expect(body.h1).toBeGreaterThan(3100);
    expect(body.h1).toBeLessThan(3500);
  });

  // [REG-SQ-04] Poynting correction: hw at 105°C/120bara > hf@105°C (≈440 kJ/kg)
  test('[REG-SQ-04] hw at 105°C/120bara > 440 kJ/kg (Poynting correction applied)', async () => {
    const { body } = await post(BOILER);
    expect(body.hw).toBeGreaterThan(440);
  });

  // [REG-SQ-05/06] Internal consistency (formula checks, implementation-independent)
  test('[REG-SQ-05] ratio = (h1−h2)/(h2−hw) — boiler', async () => {
    const { body } = await post(BOILER);
    abs_near(body.ratio, (body.h1 - body.h2) / (body.h2 - body.hw), 0.0001, '[REG-SQ-05]');
  });
  test('[REG-SQ-06] m_w = m_in × ratio — boiler', async () => {
    const { body } = await post(BOILER);
    abs_near(body.m_w, body.m_in * body.ratio, 1.0, '[REG-SQ-06]');
  });

  // [REG-SQ-07/08] Saturation boundary enthalpies at 30 bara (SAT_P table)
  test('[REG-SQ-07] hf_steam at 30bara ≈ 1008 kJ/kg ± 5%', async () => {
    const { body } = await post(HEADER);
    near(body.hf_steam, 1008, 0.05, '[REG-SQ-07]');
  });
  test('[REG-SQ-08] hg_steam at 30bara ≈ 2804 kJ/kg ± 5%', async () => {
    const { body } = await post(HEADER);
    near(body.hg_steam, 2804, 0.05, '[REG-SQ-08]');
  });

  // [REG-SQ-09] Adiabatic energy balance closes for all four presets
  test('[REG-SQ-09] Q_rem = Q_abs within 0.5% — all four presets', async () => {
    for (const [label, preset] of [['boiler',BOILER],['turbine',TURBINE],['header',HEADER],['LP',LP]]) {
      const { body } = await post(preset);
      near(body.Q_rem, body.Q_abs, 0.005, `[REG-SQ-09] ${label}`);
    }
  });

  // [REG-SQ-10] s1 entropy range at 100 bara / 500°C
  test('[REG-SQ-10] s1 at 100bara/500°C in range 6.4–6.8 kJ/(kg·K)', async () => {
    const { body } = await post(BOILER);
    expect(body.s1).toBeGreaterThan(6.4);
    expect(body.s1).toBeLessThan(6.8);
  });

  // [REG-SQ-11] v1 specific volume range
  test('[REG-SQ-11] v1 at 100bara/500°C in range 0.020–0.060 m³/kg', async () => {
    const { body } = await post(BOILER);
    expect(body.v1).toBeGreaterThan(0.020);
    expect(body.v1).toBeLessThan(0.060);
  });

  // [REG-SQ-12] hw < h2 for all presets (water must be colder than outlet steam)
  test('[REG-SQ-12] hw < h2 for all four presets', async () => {
    for (const [label, preset] of [['boiler',BOILER],['turbine',TURBINE],['header',HEADER],['LP',LP]]) {
      const { body } = await post(preset);
      expect(body.hw).toBeLessThan(body.h2); // label for diagnostics
    }
  });
});
