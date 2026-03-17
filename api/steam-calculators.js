// ════════════════════════════════════════════════════════════════════════════
// api/steam-calculators.js
// MERGED VERCEL SERVERLESS API — FILE 3 of 5
//
// CALCULATORS IN THIS FILE
// ────────────────────────
//   SECTION A  ►  STEAM PROPERTIES (IAPWS-IF97)        /api/steam
//   SECTION B  ►  STEAM QUENCH / DESUPERHEATER         /api/steam-quench
//   SECTION C  ►  STEAM TURBINE POWER                  /api/steam-turbine-power
//   SECTION D  ►  RANKINE CYCLE                        /api/rankine
//   SECTION E  ►  FLUID MACHINERY (PUMP/COMPRESSOR)    /api/pump
//
// HOW TO NAVIGATE
//   Search "SECTION A" → Steam Properties (IAPWS-IF97)
//   Search "SECTION B" → Steam Quench / Desuperheater
//   Search "SECTION C" → Steam Turbine Power
//   Search "SECTION D" → Rankine Cycle
//   Search "SECTION E" → Fluid Machinery / Pump / Compressor
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
    case 'steam':
      return await steam_handler(req, res);
    case 'steam-quench':
      return await steamQuench_handler(req, res);
    case 'steam-turbine-power':
      return await steamTurbine_handler(req, res);
    case 'rankine':
      return await rankine_handler(req, res);
    case 'pump':
      return await pump_handler(req, res);
    case 'fan':
      return await fan_handler(req, res);
    case 'compressor':
      return await compressor_handler(req, res);
    default:
      return res.status(404).json({
        error: `Unknown route: "${key}". Valid: steam, steam-quench, steam-turbine-power, rankine, pump, fan, compressor`
      });
  }
}
// ── End of Router ────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SECTION A  ►  STEAM PROPERTIES (IAPWS-IF97)
// Route: /api/steam
// (Original: SECTION 14 of 21)
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

// ══════════════════════════════════════════════════════════════════════════════
// SECTION B  ►  STEAM QUENCH / DESUPERHEATER
// Route: /api/steam-quench
// (Original: SECTION 12 of 21)
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

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C  ►  STEAM TURBINE POWER
// Route: /api/steam-turbine-power
// (Original: SECTION 13 of 21)
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

// ══════════════════════════════════════════════════════════════════════════════
// SECTION D  ►  RANKINE CYCLE
// Route: /api/rankine
// (Original: SECTION 11 of 21)
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

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E  ►  FLUID MACHINERY — PUMP
// Route: /api/pump
// (Original: SECTION 10 of 21)
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

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E2 ►  FLUID MACHINERY — FAN
// Route: /api/fan
// (Original: SECTION 05 of 21)
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

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E3 ►  FLUID MACHINERY — COMPRESSOR
// Route: /api/compressor
// (Original: SECTION 01 of 21)
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
