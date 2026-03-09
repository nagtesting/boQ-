// ================================================================
// api/steam.js  —  Vercel Serverless Function
// 🔐 ALL CALCULATION LOGIC RUNS ON SERVER — NEVER EXPOSED TO BROWSER
// Place this file in your GitHub repo at: /api/steam.js
// ================================================================

export default function handler(req, res) {
  // Allow CORS for your domain only
  res.setHeader('Access-Control-Allow-Origin', 'https://multicalci.com');
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
  let T = 100 * Math.pow(P_bar / 1.01325, 0.27) + 273.15;
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
    return { phase:'Compressed Liquid', phaseCls:'compressed', T:T_C, P:P_bar, Tsat:T_sat, h, s, v, rho:1/v, u:h-P_bar*100*v, x:null, hf:sat.hf, hfg:sat.hfg, hg:sat.hg };
  }
  if (type === 'sat-liq') {
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb(T_C);
    if (!sat) return { error:'Input out of valid range (0.006–220.9 bar / 0.01–374.14°C).' };
    return { phase:'Saturated Liquid', phaseCls:'sat-liq', T:sat.T, P:sat.P, Tsat:sat.T, h:sat.hf, s:sat.sf, v:sat.vf, rho:1/sat.vf, u:sat.hf-sat.P*100*sat.vf, x:0, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
  }
  if (type === 'wet') {
    if (!isFinite(x)||x<0||x>1) return { error:'Steam quality x must be between 0 and 1.' };
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb(T_C);
    if (!sat) return { error:'Input out of valid range.' };
    const h=sat.hf+x*sat.hfg, s=sat.sf+x*sat.sfg, v=sat.vf+x*(sat.vg-sat.vf);
    return { phase:`Wet Steam (x = ${x.toFixed(3)})`, phaseCls:'wet', T:sat.T, P:sat.P, Tsat:sat.T, h, s, v, rho:1/v, u:h-sat.P*100*v, x, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
  }
  if (type === 'sat-vap') {
    const sat = (specBy==='P') ? satByP_fb(P_bar) : satByT_fb(T_C);
    if (!sat) return { error:'Input out of valid range.' };
    return { phase:'Saturated Vapor (Dry)', phaseCls:'sat-vap', T:sat.T, P:sat.P, Tsat:sat.T, h:sat.hg, s:sat.sg, v:sat.vg, rho:1/sat.vg, u:sat.hg-sat.P*100*sat.vg, x:1, hf:sat.hf, hfg:sat.hfg, hg:sat.hg, sf:sat.sf, sfg:sat.sfg, sg:sat.sg, vf:sat.vf, vg:sat.vg };
  }
  if (type === 'superheat') {
    if (!isFinite(P_bar)||P_bar<=0||P_bar>1000) return { error:'Pressure must be 0.006–1000 bar.' };
    if (!isFinite(T_C)||T_C<0.01||T_C>800) return { error:'Temperature must be 0.01–800°C.' };
    const T_sat = tSat(P_bar);
    if (!isFinite(T_sat)) return { error:'Pressure out of saturation range.' };
    if (T_C<=T_sat) return { error:`Temperature must exceed T_sat = ${T_sat.toFixed(2)}°C at ${P_bar.toFixed(3)} bar.` };
    const sh = superheated(P_bar, T_C);
    return { phase:'Superheated Steam', phaseCls:'superheat', T:T_C, P:P_bar, Tsat:sh.Tsat, dT_sh:sh.dT_sh, h:sh.h, s:sh.s, v:sh.v, rho:sh.rho, u:sh.u, x:null };
  }
  return { error:'Unknown fluid type.' };
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
  return c;
}
