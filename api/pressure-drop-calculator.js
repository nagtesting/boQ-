// ============================================================
// /api/pressure-drop-calculator.js — Vercel Serverless Function
// Protected calculation engine for Pressure Drop Calculator
// Darcy-Weisbach · Colebrook-White · Churchill · NPSH · Pump Power
// Fluid Library (138 fluids) · Andrade viscosity · Sutherland gas
// ============================================================

// ── CORS helper ──────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─────────────────────────────────────────────────────────────────────────────
// FLUID DATABASE — 138 fluids
// density [kg/m³] · viscosity [cP=mPa·s] · vapPressBar [bar abs]
// Sources: Perry's Chemical Engineers Handbook, NIST, Yaws' Handbook
// ─────────────────────────────────────────────────────────────────────────────
const FLUID_DB = [
  // ── WATER & AQUEOUS ──
  {id:'water', name:'Water', cat:'Water & Aqueous', isGas:false,
   rhoModel:'poly_water', viscModel:'andrade', A:-3.5985, B:1061.0,
   Pv_A:8.07131, Pv_B:1730.63, Pv_C:233.426,
   vp:[[0,0.611],[10,1.228],[20,2.338],[30,4.243],[40,7.384],[50,12.35],[60,19.94],[70,31.18],[80,47.39],[90,70.11],[100,101.3],[110,143.3],[120,198.5],[150,476.2],[200,1554]]},
  {id:'seawater', name:'Seawater (3.5% NaCl)', cat:'Water & Aqueous', isGas:false,
   rhoModel:'linear', rho0:1025, Tref:20, k_rho:-0.30,
   viscModel:'andrade', A:-3.35, B:1030.0,
   vp:[[0,0.54],[10,1.08],[20,2.1],[30,3.81],[50,10.9],[80,44.3],[100,97.0]]},
  {id:'brine10', name:'Brine 10% NaCl', cat:'Water & Aqueous', isGas:false,
   rhoModel:'linear', rho0:1071, Tref:20, k_rho:-0.35,
   viscModel:'andrade', A:-3.60, B:1010.0,
   vp:[[0,0.54],[20,2.1],[50,10.5],[80,43.0],[100,96.0]]},
  {id:'brine20', name:'Brine 20% NaCl', cat:'Water & Aqueous', isGas:false,
   rhoModel:'linear', rho0:1148, Tref:20, k_rho:-0.40,
   viscModel:'linear', mu0:1.90, Tref_mu:20, k_mu:-0.030,
   vp:[[0,0.5],[20,1.95],[50,10.0],[80,41.5],[100,93.0]]},
  {id:'brine25', name:'Brine 25% NaCl', cat:'Water & Aqueous', isGas:false,
   rhoModel:'linear', rho0:1188, Tref:20, k_rho:-0.45,
   viscModel:'linear', mu0:2.30, Tref_mu:20, k_mu:-0.040, vapFixed:0.017},
  {id:'cacl2_20', name:'CaCl₂ Solution 20%', cat:'Water & Aqueous', isGas:false,
   rhoModel:'linear', rho0:1176, Tref:20, k_rho:-0.45,
   viscModel:'andrade', A:-3.40, B:1100.0,
   vp:[[0,0.48],[20,1.85],[50,9.5],[80,40.0],[100,90.0]]},
  {id:'cacl2_30', name:'CaCl₂ Solution 30%', cat:'Water & Aqueous', isGas:false,
   rhoModel:'linear', rho0:1280, Tref:20, k_rho:-0.50,
   viscModel:'andrade', A:-2.80, B:1350.0,
   vp:[[0,0.4],[20,1.6],[50,8.5],[80,36.0],[100,82.0]]},
  // ── GLYCOLS & COOLANTS ──
  {id:'eg30', name:'Ethylene Glycol 30%', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1054, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-4.50, B:1350.0, vapFixed:0.021},
  {id:'eg50', name:'Ethylene Glycol 50%', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1080, Tref:20, k_rho:-0.58,
   viscModel:'andrade', A:-3.80, B:1650.0,
   vp:[[0,0.3],[20,1.2],[50,8.0],[80,34],[100,78]]},
  {id:'eg70', name:'Ethylene Glycol 70%', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1096, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-2.80, B:2100.0,
   vp:[[0,0.18],[20,0.8],[50,6.0],[80,28],[100,68]]},
  {id:'pg30', name:'Propylene Glycol 30%', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1034, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-4.00, B:1400.0,
   vp:[[0,0.5],[20,1.8],[50,10.0],[80,40],[100,90]]},
  {id:'pg50', name:'Propylene Glycol 50%', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1059, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-3.20, B:1800.0,
   vp:[[0,0.35],[20,1.3],[50,8.5],[80,35],[100,80]]},
  {id:'deg', name:'Diethylene Glycol (DEG)', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1118, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-2.60, B:2300.0, vapFixed:0.0003},
  {id:'teg', name:'Triethylene Glycol (TEG)', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1126, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:-2.00, B:2600.0, vapFixed:0.00001},
  {id:'mea30', name:'MEA 30% (Monoethanolamine)', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1013, Tref:25, k_rho:-0.50,
   viscModel:'andrade', A:-3.60, B:1400.0, vapFixed:0.010},
  {id:'dea35', name:'DEA 35% (Diethanolamine)', cat:'Glycols & Coolants', isGas:false,
   rhoModel:'linear', rho0:1038, Tref:25, k_rho:-0.52,
   viscModel:'andrade', A:-2.80, B:1700.0, vapFixed:0.006},
  // ── PETROLEUM & FUELS ──
  {id:'gasoline', name:'Gasoline (Petrol)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:740, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-4.80, B:900.0,
   vp:[[0,10],[10,16],[20,25],[30,38.5],[40,57],[50,82],[60,115]]},
  {id:'diesel', name:'Diesel Fuel', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:840, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:-3.20, B:1600.0,
   vp:[[20,0.01],[40,0.03],[60,0.07],[80,0.15],[100,0.3]]},
  {id:'kerosene', name:'Kerosene / Jet-A', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:800, Tref:20, k_rho:-0.68,
   viscModel:'andrade', A:-3.90, B:1500.0, vapFixed:0.003},
  {id:'jeta1', name:'Jet A-1 Fuel', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:795, Tref:20, k_rho:-0.70,
   viscModel:'andrade', A:-4.00, B:1480.0, vapFixed:0.002},
  {id:'hfo', name:'Heavy Fuel Oil (HFO 380)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:991, Tref:50, k_rho:-0.60,
   viscModel:'andrade', A:2.50, B:4500.0, vapFixed:0.0001},
  {id:'crude20', name:'Crude Oil API 20 (heavy)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:934, Tref:20, k_rho:-0.70,
   viscModel:'andrade', A:-1.00, B:4000.0, vapFixed:0.001},
  {id:'crude30', name:'Crude Oil API 30', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:876, Tref:20, k_rho:-0.72,
   viscModel:'andrade', A:-2.50, B:3200.0, vapFixed:0.003},
  {id:'crude40', name:'Crude Oil API 40', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:825, Tref:20, k_rho:-0.75,
   viscModel:'andrade', A:-3.50, B:2500.0, vapFixed:0.010},
  {id:'crude50', name:'Crude Oil API 50 (light)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:779, Tref:20, k_rho:-0.80,
   viscModel:'andrade', A:-4.50, B:1800.0, vapFixed:0.020},
  {id:'naphtha', name:'Naphtha (light)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:710, Tref:20, k_rho:-0.85,
   viscModel:'andrade', A:-5.00, B:850.0, vapFixed:0.12},
  {id:'naphtha_h', name:'Naphtha (heavy)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:770, Tref:20, k_rho:-0.80,
   viscModel:'andrade', A:-4.50, B:1100.0, vapFixed:0.04},
  {id:'atmresid', name:'Atmospheric Residue (ATB)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:960, Tref:100, k_rho:-0.65,
   viscModel:'andrade', A:2.00, B:5000.0, vapFixed:0.0001},
  {id:'vacresid', name:'Vacuum Residue (VTB)', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:1010, Tref:150, k_rho:-0.60,
   viscModel:'andrade', A:4.50, B:7000.0, vapFixed:0.00001},
  {id:'bitumen', name:'Bitumen / Asphalt', cat:'Petroleum & Fuels', isGas:false,
   rhoModel:'linear', rho0:1030, Tref:160, k_rho:-0.58,
   viscModel:'andrade', A:6.00, B:9000.0, vapFixed:0.000001},
  // ── LUBRICANTS & HYDRAULIC ──
  {id:'lube32', name:'Lube Oil ISO VG 32', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:860, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-2.80, B:3400.0, vapFixed:0.0001},
  {id:'lube46', name:'Lube Oil ISO VG 46', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:868, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-2.40, B:3800.0, vapFixed:0.0001},
  {id:'lube68', name:'Lube Oil ISO VG 68', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:875, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-2.00, B:4200.0, vapFixed:0.0001},
  {id:'lube100', name:'Lube Oil ISO VG 100', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:880, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-1.60, B:4600.0, vapFixed:0.0001},
  {id:'lube150', name:'Lube Oil ISO VG 150', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:884, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-1.20, B:5000.0, vapFixed:0.0001},
  {id:'lube220', name:'Lube Oil ISO VG 220', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:888, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-0.80, B:5400.0, vapFixed:0.0001},
  {id:'hydr32', name:'Hydraulic Oil ISO 32', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:856, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-2.80, B:3400.0, vapFixed:0.0001},
  {id:'hydr46', name:'Hydraulic Oil ISO 46', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:862, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-2.40, B:3800.0, vapFixed:0.0001},
  {id:'hydr68', name:'Hydraulic Oil ISO 68', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:869, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-2.00, B:4200.0, vapFixed:0.0001},
  {id:'hydr100', name:'Hydraulic Oil ISO 100', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:875, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-1.60, B:4600.0, vapFixed:0.0001},
  {id:'thermoil', name:'Thermal / Heat Transfer Oil', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:876, Tref:100, k_rho:-0.70,
   viscModel:'andrade', A:-3.50, B:3500.0, vapFixed:0.0001},
  {id:'turbineoil', name:'Turbine Oil ISO VG 46', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:860, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:-2.40, B:3750.0, vapFixed:0.0001},
  {id:'gearoil320', name:'Gear Oil ISO VG 320', cat:'Lubricants & Hydraulic', isGas:false,
   rhoModel:'linear', rho0:896, Tref:40, k_rho:-0.65,
   viscModel:'andrade', A:0.50, B:6800.0, vapFixed:0.00001},
  // ── ALCOHOLS ──
  {id:'methanol', name:'Methanol', cat:'Alcohols', isGas:false,
   rhoModel:'linear', rho0:791, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-5.60, B:1050.0,
   Pv_A:7.8975, Pv_B:1474.08, Pv_C:229.13},
  {id:'ethanol', name:'Ethanol (96%)', cat:'Alcohols', isGas:false,
   rhoModel:'linear', rho0:806, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-3.98, B:1408.0,
   Pv_A:8.1122, Pv_B:1592.864, Pv_C:226.184},
  {id:'ethanol_abs', name:'Ethanol Absolute (99.9%)', cat:'Alcohols', isGas:false,
   rhoModel:'linear', rho0:789, Tref:20, k_rho:-0.91,
   viscModel:'andrade', A:-4.00, B:1420.0,
   Pv_A:8.1122, Pv_B:1592.864, Pv_C:226.184},
  {id:'ipa', name:'Isopropanol (IPA)', cat:'Alcohols', isGas:false,
   rhoModel:'linear', rho0:786, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-3.40, B:1700.0,
   Pv_A:8.1182, Pv_B:1580.92, Pv_C:219.61},
  {id:'nbutanol', name:'n-Butanol', cat:'Alcohols', isGas:false,
   rhoModel:'linear', rho0:810, Tref:20, k_rho:-0.85,
   viscModel:'andrade', A:-2.50, B:2200.0,
   Pv_A:7.9082, Pv_B:1705.59, Pv_C:219.81},
  {id:'glycerol', name:'Glycerol (100%)', cat:'Alcohols', isGas:false,
   rhoModel:'linear', rho0:1261, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:5.40, B:4400.0, vapFixed:0.00014},
  {id:'glycerol50', name:'Glycerol 50% in Water', cat:'Alcohols', isGas:false,
   rhoModel:'linear', rho0:1126, Tref:20, k_rho:-0.50,
   viscModel:'andrade', A:-1.80, B:2200.0, vapFixed:0.012},
  // ── AROMATICS ──
  {id:'benzene', name:'Benzene', cat:'Aromatics', isGas:false,
   rhoModel:'linear', rho0:879, Tref:20, k_rho:-1.06,
   viscModel:'andrade', A:-5.10, B:1100.0,
   Pv_A:6.9058, Pv_B:1211.033, Pv_C:220.790},
  {id:'toluene', name:'Toluene', cat:'Aromatics', isGas:false,
   rhoModel:'linear', rho0:867, Tref:20, k_rho:-0.96,
   viscModel:'andrade', A:-4.90, B:1300.0,
   Pv_A:6.9553, Pv_B:1344.800, Pv_C:219.482},
  {id:'xylene', name:'Xylene (mixed)', cat:'Aromatics', isGas:false,
   rhoModel:'linear', rho0:864, Tref:20, k_rho:-0.92,
   viscModel:'andrade', A:-4.60, B:1500.0, vapFixed:0.009},
  {id:'oxylene', name:'o-Xylene', cat:'Aromatics', isGas:false,
   rhoModel:'linear', rho0:880, Tref:20, k_rho:-0.92,
   viscModel:'andrade', A:-4.30, B:1550.0, vapFixed:0.007},
  {id:'styrene', name:'Styrene', cat:'Aromatics', isGas:false,
   rhoModel:'linear', rho0:909, Tref:20, k_rho:-0.88,
   viscModel:'andrade', A:-4.50, B:1500.0, vapFixed:0.007},
  {id:'cumene', name:'Cumene (Isopropylbenzene)', cat:'Aromatics', isGas:false,
   rhoModel:'linear', rho0:862, Tref:20, k_rho:-0.88,
   viscModel:'andrade', A:-4.50, B:1500.0, vapFixed:0.004},
  // ── ALIPHATICS ──
  {id:'hexane', name:'n-Hexane', cat:'Aliphatics', isGas:false,
   rhoModel:'linear', rho0:659, Tref:20, k_rho:-1.04,
   viscModel:'andrade', A:-5.90, B:850.0,
   Pv_A:6.8764, Pv_B:1171.17, Pv_C:224.408},
  {id:'heptane', name:'n-Heptane', cat:'Aliphatics', isGas:false,
   rhoModel:'linear', rho0:684, Tref:20, k_rho:-0.98,
   viscModel:'andrade', A:-5.40, B:1020.0,
   Pv_A:6.9024, Pv_B:1264.37, Pv_C:216.636},
  {id:'octane', name:'n-Octane', cat:'Aliphatics', isGas:false,
   rhoModel:'linear', rho0:703, Tref:20, k_rho:-0.94,
   viscModel:'andrade', A:-5.00, B:1150.0,
   Pv_A:6.9190, Pv_B:1351.99, Pv_C:209.155},
  {id:'cyclohex', name:'Cyclohexane', cat:'Aliphatics', isGas:false,
   rhoModel:'linear', rho0:779, Tref:20, k_rho:-1.01,
   viscModel:'andrade', A:-4.80, B:1150.0,
   Pv_A:6.8446, Pv_B:1203.526, Pv_C:222.863},
  {id:'isooctane', name:'Isooctane (2,2,4-TMP)', cat:'Aliphatics', isGas:false,
   rhoModel:'linear', rho0:692, Tref:20, k_rho:-0.97,
   viscModel:'andrade', A:-5.10, B:1060.0, vapFixed:0.053},
  // ── CHLORINATED SOLVENTS ──
  {id:'dcm', name:'Dichloromethane (DCM)', cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1325, Tref:20, k_rho:-1.78,
   viscModel:'andrade', A:-5.80, B:750.0,
   Pv_A:7.0803, Pv_B:1138.91, Pv_C:231.46},
  {id:'chloroform', name:'Chloroform (CHCl₃)', cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1489, Tref:20, k_rho:-1.68,
   viscModel:'andrade', A:-5.50, B:960.0,
   Pv_A:6.9025, Pv_B:1170.97, Pv_C:226.40},
  {id:'cctc', name:'Carbon Tetrachloride (CCl₄)', cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1594, Tref:20, k_rho:-1.78,
   viscModel:'andrade', A:-5.00, B:1050.0,
   Pv_A:6.9330, Pv_B:1242.43, Pv_C:230.00},
  {id:'tce', name:'Trichloroethylene', cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1464, Tref:20, k_rho:-1.50,
   viscModel:'andrade', A:-4.80, B:1100.0, vapFixed:0.077},
  {id:'pce', name:'Perchloroethylene (PCE)', cat:'Chlorinated Solvents', isGas:false,
   rhoModel:'linear', rho0:1622, Tref:20, k_rho:-1.45,
   viscModel:'andrade', A:-4.60, B:1200.0, vapFixed:0.019},
  // ── KETONES & ESTERS ──
  {id:'acetone', name:'Acetone', cat:'Ketones & Esters', isGas:false,
   rhoModel:'linear', rho0:791, Tref:20, k_rho:-1.23,
   viscModel:'andrade', A:-6.20, B:800.0,
   Pv_A:7.1327, Pv_B:1219.97, Pv_C:230.653},
  {id:'mek', name:'MEK (Methyl Ethyl Ketone)', cat:'Ketones & Esters', isGas:false,
   rhoModel:'linear', rho0:805, Tref:20, k_rho:-1.12,
   viscModel:'andrade', A:-5.50, B:1000.0,
   Pv_A:7.0649, Pv_B:1261.34, Pv_C:221.97},
  {id:'mibk', name:'MIBK (Methyl Isobutyl Ketone)', cat:'Ketones & Esters', isGas:false,
   rhoModel:'linear', rho0:801, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-5.00, B:1150.0, vapFixed:0.021},
  {id:'cyclohexanone', name:'Cyclohexanone', cat:'Ketones & Esters', isGas:false,
   rhoModel:'linear', rho0:948, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-3.80, B:1700.0, vapFixed:0.005},
  {id:'ethacet', name:'Ethyl Acetate', cat:'Ketones & Esters', isGas:false,
   rhoModel:'linear', rho0:901, Tref:20, k_rho:-1.15,
   viscModel:'andrade', A:-5.30, B:900.0,
   Pv_A:7.0981, Pv_B:1238.71, Pv_C:217.00},
  {id:'butacet', name:'Butyl Acetate', cat:'Ketones & Esters', isGas:false,
   rhoModel:'linear', rho0:882, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-4.80, B:1150.0, vapFixed:0.015},
  // ── ACIDS & BASES ──
  {id:'h2so4_98', name:'Sulfuric Acid 98%', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1836, Tref:20, k_rho:-1.10,
   viscModel:'andrade', A:-1.80, B:2600.0, vapFixed:0.000001},
  {id:'h2so4_50', name:'Sulfuric Acid 50%', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1395, Tref:20, k_rho:-0.85,
   viscModel:'andrade', A:-3.20, B:1600.0, vapFixed:0.005},
  {id:'h2so4_10', name:'Sulfuric Acid 10%', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1066, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-3.80, B:1100.0, vapFixed:0.020},
  {id:'hcl30', name:'Hydrochloric Acid 30%', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1149, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-3.90, B:1050.0, vapFixed:0.08},
  {id:'hno3_65', name:'Nitric Acid 65%', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1390, Tref:20, k_rho:-0.80,
   viscModel:'andrade', A:-3.90, B:1100.0, vapFixed:0.12},
  {id:'hno3_30', name:'Nitric Acid 30%', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1180, Tref:20, k_rho:-0.70,
   viscModel:'andrade', A:-4.00, B:1050.0, vapFixed:0.045},
  {id:'h3po4_85', name:'Phosphoric Acid 85%', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1685, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-1.20, B:3000.0, vapFixed:0.001},
  {id:'naoh_50', name:'NaOH 50% Solution', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1525, Tref:20, k_rho:-0.90,
   viscModel:'andrade', A:-2.80, B:2000.0, vapFixed:0.003},
  {id:'naoh_10', name:'NaOH 10% Solution', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1109, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:-3.60, B:1080.0, vapFixed:0.018},
  {id:'naoh_30', name:'NaOH 30% Solution', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:1328, Tref:20, k_rho:-0.75,
   viscModel:'andrade', A:-3.00, B:1500.0, vapFixed:0.010},
  {id:'nh3_10', name:'Ammonia 10% Solution', cat:'Acids & Bases', isGas:false,
   rhoModel:'linear', rho0:958, Tref:20, k_rho:-0.60,
   viscModel:'andrade', A:-4.20, B:1000.0, vapFixed:0.09},
  // ── AMINES ──
  {id:'mdea50', name:'MDEA 50% (Methyldiethanolamine)', cat:'Amines', isGas:false,
   rhoModel:'linear', rho0:1047, Tref:25, k_rho:-0.55,
   viscModel:'andrade', A:-2.20, B:2200.0, vapFixed:0.003},
  {id:'dga', name:'DGA (Diglycolamine) 50%', cat:'Amines', isGas:false,
   rhoModel:'linear', rho0:1048, Tref:25, k_rho:-0.55,
   viscModel:'andrade', A:-2.80, B:2000.0, vapFixed:0.003},
  // ── GASES (COMPRESSIBLE) ──
  {id:'air', name:'Air (dry)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:28.97,
   viscModel:'sutherland', mu_ref:0.01827e-3, T_ref:291.15, C_su:120.0},
  {id:'nitrogen', name:'Nitrogen (N₂)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:28.01,
   viscModel:'sutherland', mu_ref:0.01781e-3, T_ref:293.15, C_su:111.0},
  {id:'oxygen', name:'Oxygen (O₂)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:32.00,
   viscModel:'sutherland', mu_ref:0.02018e-3, T_ref:293.15, C_su:127.0},
  {id:'co2_gas', name:'CO₂ (gas)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:44.01,
   viscModel:'sutherland', mu_ref:0.01480e-3, T_ref:293.15, C_su:240.0},
  {id:'methane', name:'Methane (CH₄)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:16.04,
   viscModel:'sutherland', mu_ref:0.01100e-3, T_ref:293.15, C_su:162.0},
  {id:'hydrogen', name:'Hydrogen (H₂)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:2.016,
   viscModel:'sutherland', mu_ref:0.00894e-3, T_ref:293.15, C_su:72.0},
  {id:'steam', name:'Steam (saturated)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:18.015,
   viscModel:'sutherland', mu_ref:0.01200e-3, T_ref:373.15, C_su:1064.0},
  {id:'lpg', name:'LPG (60% C₃, 40% C₄)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:47.0,
   viscModel:'sutherland', mu_ref:0.00820e-3, T_ref:293.15, C_su:330.0},
  {id:'naturalgas', name:'Natural Gas (typical)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:18.0,
   viscModel:'sutherland', mu_ref:0.01100e-3, T_ref:293.15, C_su:162.0},
  {id:'ammonia_g', name:'Ammonia Gas (NH₃)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:17.03,
   viscModel:'sutherland', mu_ref:0.00980e-3, T_ref:293.15, C_su:370.0},
  {id:'flue_gas', name:'Flue Gas (typical)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:29.0,
   viscModel:'sutherland', mu_ref:0.01900e-3, T_ref:600.0, C_su:120.0},
  {id:'chlorine_g', name:'Chlorine Gas (Cl₂)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:70.90,
   viscModel:'sutherland', mu_ref:0.01330e-3, T_ref:293.15, C_su:351.0},
  {id:'so2_g', name:'Sulfur Dioxide Gas (SO₂)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:64.06,
   viscModel:'sutherland', mu_ref:0.01250e-3, T_ref:293.15, C_su:416.0},
  {id:'syngas', name:'Syngas (H₂+CO mixture)', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:15.50,
   viscModel:'sutherland', mu_ref:0.01300e-3, T_ref:293.15, C_su:150.0},
  {id:'hclgas', name:'HCl Gas', cat:'Gases (⚠ Compressible)', isGas:true,
   rhoModel:'ideal_gas', MW:36.46,
   viscModel:'sutherland', mu_ref:0.01426e-3, T_ref:273.15, C_su:360.0},
  // ── CHEMICAL PROCESS ──
  {id:'dmf', name:'DMF (Dimethylformamide)', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:944, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-4.50, B:1200.0, vapFixed:0.004},
  {id:'dmso', name:'DMSO (Dimethyl Sulfoxide)', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:1101, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-3.50, B:1700.0, vapFixed:0.001},
  {id:'thf', name:'THF (Tetrahydrofuran)', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:889, Tref:20, k_rho:-1.10,
   viscModel:'andrade', A:-5.20, B:1000.0,
   Pv_A:6.9953, Pv_B:1202.29, Pv_C:226.25},
  {id:'nmp', name:'N-Methylpyrrolidone (NMP)', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:1028, Tref:20, k_rho:-0.96,
   viscModel:'andrade', A:-3.40, B:1700.0,
   vp:[[20,0.04],[50,0.37],[80,2.4],[100,5.8],[202,101.3]]},
  {id:'acetonitrile', name:'Acetonitrile (MeCN)', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:786, Tref:20, k_rho:-1.10,
   viscModel:'andrade', A:-5.60, B:950.0,
   Pv_A:7.1190, Pv_B:1314.4, Pv_C:230.0},
  {id:'diethether', name:'Diethyl Ether', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:713, Tref:20, k_rho:-1.20,
   viscModel:'andrade', A:-5.90, B:850.0,
   Pv_A:6.9267, Pv_B:1064.07, Pv_C:228.799},
  {id:'dioxane', name:'1,4-Dioxane', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:1034, Tref:20, k_rho:-1.00,
   viscModel:'andrade', A:-4.80, B:1250.0, vapFixed:0.038},
  {id:'furfural', name:'Furfural', cat:'Chemical Process', isGas:false,
   rhoModel:'linear', rho0:1160, Tref:20, k_rho:-0.95,
   viscModel:'andrade', A:-3.60, B:1600.0, vapFixed:0.003},
  // ── FOOD & PHARMA ──
  {id:'milk', name:'Milk (whole)', cat:'Food & Pharma', isGas:false,
   rhoModel:'linear', rho0:1030, Tref:20, k_rho:-0.35,
   viscModel:'andrade', A:-3.80, B:1100.0, vapFixed:0.023},
  {id:'milk_skim', name:'Skim Milk', cat:'Food & Pharma', isGas:false,
   rhoModel:'linear', rho0:1034, Tref:20, k_rho:-0.33,
   viscModel:'andrade', A:-4.00, B:1050.0, vapFixed:0.023},
  {id:'olive', name:'Olive Oil', cat:'Food & Pharma', isGas:false,
   rhoModel:'linear', rho0:910, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:1.00, B:3200.0, vapFixed:0.001},
  {id:'sunflower', name:'Sunflower Oil', cat:'Food & Pharma', isGas:false,
   rhoModel:'linear', rho0:919, Tref:20, k_rho:-0.65,
   viscModel:'andrade', A:0.90, B:3000.0,
   vp:[[40,0.001],[80,0.01],[100,0.03]]},
  {id:'palmoil', name:'Palm Oil', cat:'Food & Pharma', isGas:false,
   rhoModel:'linear', rho0:891, Tref:50, k_rho:-0.67,
   viscModel:'andrade', A:1.20, B:3400.0, vapFixed:0.001},
  {id:'cornsyrup', name:'Corn Syrup 63° Brix', cat:'Food & Pharma', isGas:false,
   rhoModel:'linear', rho0:1303, Tref:20, k_rho:-0.55,
   viscModel:'andrade', A:3.20, B:3500.0, vapFixed:0.010},
  {id:'honey', name:'Honey', cat:'Food & Pharma', isGas:false,
   rhoModel:'linear', rho0:1420, Tref:20, k_rho:-0.50,
   viscModel:'andrade', A:5.00, B:4800.0, vapFixed:0.005},
  // ── SPECIAL & METALS ──
  {id:'mercury', name:'Mercury (liquid)', cat:'Special & Metals', isGas:false,
   rhoModel:'linear', rho0:13534, Tref:20, k_rho:-2.45,
   viscModel:'andrade', A:-3.50, B:800.0,
   vp:[[20,0.000227],[100,0.016],[200,0.279],[356.7,101.3]]},
  {id:'molten_s', name:'Molten Sulfur', cat:'Special & Metals', isGas:false,
   rhoModel:'linear', rho0:1800, Tref:130, k_rho:-0.95,
   viscModel:'andrade', A:-3.80, B:1500.0, vapFixed:0.001},
  {id:'slurry10', name:'Slurry (10% solids)', cat:'Special & Metals', isGas:false,
   rhoModel:'linear', rho0:1100, Tref:20, k_rho:-0.35,
   viscModel:'linear', mu0:5.0, Tref_mu:20, k_mu:-0.05, vapFixed:0.020},
  {id:'slurry30', name:'Slurry (30% solids)', cat:'Special & Metals', isGas:false,
   rhoModel:'linear', rho0:1350, Tref:20, k_rho:-0.40,
   viscModel:'linear', mu0:20.0, Tref_mu:20, k_mu:-0.15, vapFixed:0.015},
  {id:'slurry50', name:'Slurry (50% solids, dense)', cat:'Special & Metals', isGas:false,
   rhoModel:'linear', rho0:1650, Tref:20, k_rho:-0.45,
   viscModel:'linear', mu0:80.0, Tref_mu:20, k_mu:-0.40, vapFixed:0.010},
  {id:'drilling_mud', name:'Drilling Mud (12 ppg)', cat:'Special & Metals', isGas:false,
   rhoModel:'linear', rho0:1440, Tref:25, k_rho:-0.50,
   viscModel:'linear', mu0:30.0, Tref_mu:25, k_mu:-0.20, vapFixed:0.015},
  // ── DUAL-PHASE ──
  {id:'propane', name:'Propane (C₃H₈) — auto phase', cat:'Dual-Phase (auto L/G)', isGas:'auto',
   Pv_A:6.82973, Pv_B:803.810, Pv_C:246.990,
   Tc:96.68, Pc:42.48,
   liq_rhoModel:'linear', liq_rho0:493.0, liq_Tref:-42.1, liq_k_rho:-1.90,
   liq_viscModel:'andrade', liq_A:-7.20, liq_B:650.0,
   gas_rhoModel:'ideal_gas', gas_MW:44.10,
   gas_viscModel:'sutherland', gas_mu_ref:0.00820e-3, gas_T_ref:293.15, gas_C_su:330.0,
   vp:[[-42.1,101.3],[-30,161],[-20,245],[0,474],[20,879],[40,1530],[50,1771],[96.68,4248]]},
  {id:'co2', name:'CO₂ — auto phase', cat:'Dual-Phase (auto L/G)', isGas:'auto',
   Pv_form:'cc_ln', Pv_A:10.79, Pv_B:-1977,
   Tc:31.04, Pc:73.77,
   liq_rhoModel:'linear', liq_rho0:773.0, liq_Tref:20.0, liq_k_rho:-3.50,
   liq_viscModel:'andrade', liq_A:-7.50, liq_B:600.0,
   gas_rhoModel:'ideal_gas', gas_MW:44.01,
   gas_viscModel:'sutherland', gas_mu_ref:0.01480e-3, gas_T_ref:293.15, gas_C_su:240.0,
   vp:[[-56.6,517],[-40,1013],[-20,1969],[0,3484],[20,5729],[30,7176]]},
  {id:'water_steam', name:'Water/Steam — auto phase', cat:'Dual-Phase (auto L/G)', isGas:'auto',
   Pv_A:8.07131, Pv_B:1730.63, Pv_C:233.426,
   Tc:373.95, Pc:220.64,
   liq_rhoModel:'poly_water',
   liq_viscModel:'andrade', liq_A:-3.5985, liq_B:1061.0,
   gas_rhoModel:'ideal_gas', gas_MW:18.015,
   gas_viscModel:'sutherland', gas_mu_ref:0.01200e-3, gas_T_ref:373.15, gas_C_su:1064.0,
   vp:[[0,0.611],[20,2.338],[40,7.384],[60,19.94],[80,47.39],[100,101.3],[120,198.5],[150,476.2],[200,1554],[250,3975],[300,8592],[373.95,22064]]},
];

// ── FITTING CATALOGUE ─────────────────────────────────────────
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

// ── VAPOUR PRESSURE INTERPOLATION ────────────────────────────
function vpI(f, T_C) {
  const d = f.vp;
  if (!d || !d.length) return null;
  if (T_C <= d[0][0]) return d[0][1];
  if (T_C >= d[d.length-1][0]) return d[d.length-1][1];
  for (let i = 0; i < d.length-1; i++) {
    if (T_C >= d[i][0] && T_C < d[i+1][0]) {
      const r  = (T_C - d[i][0]) / (d[i+1][0] - d[i][0]);
      const l1 = Math.log(Math.max(d[i][1], 1e-10));
      const l2 = Math.log(Math.max(d[i+1][1], 1e-10));
      return Math.exp(l1 + r*(l2 - l1)); // kPa
    }
  }
  return d[d.length-1][1];
}

// ── FLUID PROPERTY ENGINE ─────────────────────────────────────
function calcFluidProps(id, T_C, P_bar) {
  const f = FLUID_DB.find(x => x.id === id);
  if (!f) return null;
  const T_K = T_C + 273.15;
  let rho, mu, Pv = 0, warn = '', phaseLabel = '';

  const vpTable = vpI(f, T_C);
  if (vpTable !== null) {
    Pv = vpTable / 100; // kPa → bar
  } else if (f.Pv_form === 'cc_ln' && f.Pv_A !== undefined) {
    Pv = Math.max(0, Math.exp(f.Pv_A + f.Pv_B / T_K));
  } else if (f.Pv_A !== undefined) {
    const denom = f.Pv_C + T_C;
    if (denom > 0) {
      Pv = Math.max(0, Math.pow(10, f.Pv_A - f.Pv_B / denom) * 0.00133322);
    }
  } else if (f.vapFixed !== undefined) {
    Pv = f.vapFixed;
  }

  let effectiveIsGas = f.isGas;
  if (f.isGas === 'auto') {
    const aboveCriticalT = (f.Tc !== undefined) && (T_C > f.Tc);
    const aboveCriticalP = (f.Pc !== undefined) && (P_bar > f.Pc);
    if (aboveCriticalT && aboveCriticalP) {
      effectiveIsGas = true; phaseLabel = '⬡ Supercritical';
      warn += `⚠ Supercritical (T > Tc=${f.Tc}°C, P > Pc=${f.Pc} bar). `;
    } else if (aboveCriticalT) {
      effectiveIsGas = true; phaseLabel = '↑ Gas (T > Tc)';
    } else if (Pv > 0 && P_bar < Pv) {
      effectiveIsGas = true; phaseLabel = `↑ Gas (P < Psat=${Pv.toFixed(3)} bar)`;
    } else {
      effectiveIsGas = false; phaseLabel = `↓ Liquid (P ≥ Psat=${Pv.toFixed(3)} bar)`;
    }
  }

  // Density
  if (f.isGas === 'auto') {
    if (effectiveIsGas) {
      rho = (P_bar * 1e5 * f.gas_MW) / (8314.0 * T_K);
    } else {
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

  // Viscosity
  if (f.isGas === 'auto') {
    if (effectiveIsGas) {
      const ratio = T_K / f.gas_T_ref;
      mu = (f.gas_mu_ref * Math.pow(ratio, 1.5) * (f.gas_T_ref + f.gas_C_su) / (T_K + f.gas_C_su)) * 1000;
    } else {
      mu = Math.exp(f.liq_A + f.liq_B / T_K);
    }
    mu = Math.max(0.001, Math.min(mu, 1e7));
  } else if (f.viscModel === 'andrade') {
    mu = Math.exp(f.A + f.B / T_K);
    mu = Math.max(0.001, Math.min(mu, 1e7));
  } else if (f.viscModel === 'sutherland') {
    const ratio = T_K / f.T_ref;
    const mu_Pas = f.mu_ref * Math.pow(ratio, 1.5) * (f.T_ref + f.C_su) / (T_K + f.C_su);
    mu = Math.max(0.001, mu_Pas * 1000);
  } else {
    const Tref_mu = f.Tref_mu !== undefined ? f.Tref_mu : f.Tref;
    mu = Math.max(0.001, f.mu0 + f.k_mu * (T_C - Tref_mu));
  }

  if (f.isGas !== 'auto' && !f.isGas && P_bar > 0 && Pv > 0 && Pv >= P_bar)
    warn += '⚠ Vapour pressure ≥ operating pressure — fluid may flash or boil! ';

  return {
    rho: parseFloat(rho.toFixed(3)),
    mu:  parseFloat(mu.toFixed(4)),
    Pv:  parseFloat(Pv.toFixed(6)),
    isGas: effectiveIsGas === true || effectiveIsGas === 'auto',
    phaseLabel, name: f.name, cat: f.cat, warn
  };
}

// ── FRICTION FACTOR (Colebrook-White + Churchill blend) ───────
function frictionFactor(Re, eps_m, Dm) {
  if (Re < 1) return { error: 'Reynolds number < 1 — check inputs.' };
  let f;
  if (Re < 2300) {
    f = 64 / Re; // Laminar: Hagen-Poiseuille
  } else if (Re < 4000) {
    // Churchill (1977) — blended transitional
    const A_ch = Math.pow(2.457 * Math.log(1 / (Math.pow(7/Re, 0.9) + 0.27*(eps_m/Dm))), 16);
    const B_ch = Math.pow(37530/Re, 16);
    f = 8 * Math.pow(Math.pow(8/Re, 12) + 1/Math.pow(A_ch + B_ch, 1.5), 1/12);
    const fCB = Math.pow(-2*Math.log10(eps_m/(3.7*Dm) + 2.51/(Re*Math.sqrt(0.02))), -2);
    f = Math.max(f, fCB);
  } else {
    // Swamee-Jain seed + Colebrook-White iteration
    const arg = eps_m/(3.7*Dm) + 5.74/Math.pow(Re, 0.9);
    f = arg > 0 ? 0.25/Math.pow(Math.log10(arg), 2) : 0.02;
    if (!isFinite(f) || f <= 0) f = 0.02;
    for (let i = 0; i < 50; i++) {
      const inner = eps_m/(3.7*Dm) + 2.51/(Re*Math.sqrt(f));
      if (inner <= 0 || !isFinite(inner)) break;
      const fn = Math.pow(-2*Math.log10(inner), -2);
      if (!isFinite(fn) || fn <= 0) break;
      if (Math.abs(fn - f) < 1e-10) { f = fn; break; }
      f = fn;
    }
  }
  if (!isFinite(f) || f <= 0) return { error: 'Friction factor calculation failed — check pipe roughness.' };
  return { f };
}

// ── MAIN PRESSURE DROP CALCULATION ───────────────────────────
function runCalculation(body) {
  let { D, L, Q, rho, mu, dz=0, eps, pumpEff=0.75, motorEff=0.92, unitMode='metric', fittings=[], fluidId='' } = body;

  // Validate
  if ([D,L,Q,rho,mu].some(v => isNaN(v) || v === undefined) || D<=0 || L<=0 || Q<=0 || rho<=0 || mu<=0)
    return { error: 'Please fill in all required fields with positive values.' };
  if (mu < 0.00001)
    return { error: 'Viscosity too low — check units (enter in cP, e.g. water = 1.0 cP).' };

  const D_orig=D, L_orig=L, Q_orig=Q;

  // Unit conversion to SI
  if (unitMode === 'imperial') {
    D   *= 25.4;     // in → mm
    L   *= 0.3048;   // ft → m
    dz  *= 0.3048;
    Q   *= 0.227124; // GPM → m³/h
    rho *= 16.0185;  // lb/ft³ → kg/m³
  }

  const Dm    = D / 1000;           // mm → m
  const Qs    = Q / 3600;           // m³/h → m³/s
  const mu_Pa = mu / 1000;          // cP → Pa·s
  const eps_m = eps / 1000;         // mm → m

  const A  = Math.PI * Dm * Dm / 4;
  const V  = Qs / A;
  const Re = rho * V * Dm / mu_Pa;

  const ffResult = frictionFactor(Re, eps_m, Dm);
  if (ffResult.error) return { error: ffResult.error };
  const f = ffResult.f;

  const dynPres = rho * V * V / 2;
  const dpPipe  = f * (L / Dm) * dynPres;

  // Fittings K total
  const Ktot = fittings.reduce((s, fit) => s + (fit.qty * fit.k), 0);
  const dpMinor = Ktot * dynPres;
  const dpElev  = rho * 9.81 * dz;
  const dpTotal = dpPipe + dpMinor + dpElev;

  const headLoss = dpTotal / (rho * 9.81);
  const Leq = f > 0 ? Ktot * Dm / f : 0;

  const P_hyd   = Qs * dpTotal;
  const P_shaft = P_hyd / pumpEff;
  const P_motor = P_shaft / motorEff;

  let regime, regimeClass;
  if (Re < 2300)      { regime='Laminar';      regimeClass='badge-green'; }
  else if (Re < 4000) { regime='Transitional'; regimeClass='badge-amber'; }
  else                { regime='Turbulent';    regimeClass='badge-red'; }

  const uncertPct = Re < 4000 ? 25 : (eps_m/Dm > 0.01 ? 8 : 5); // relative roughness ε/D (dimensionless)
  const isGasFluid = rho < 5;

  // Unit-aware display values
  let dpDisp, dpPipeDisp, dpMinorDisp, dpElevDisp, dpUnit, velDisp, velUnit, headDisp, headUnit;
  if (unitMode === 'imperial') {
    const toP = v => v * 0.000145038;
    dpDisp=toP(dpTotal); dpPipeDisp=toP(dpPipe); dpMinorDisp=toP(dpMinor); dpElevDisp=toP(dpElev);
    dpUnit='psi'; velDisp=V*3.28084; velUnit='ft/s';
    headDisp=headLoss*3.28084; headUnit='ft';
  } else {
    const toBar = v => v / 100000;
    dpDisp=toBar(dpTotal); dpPipeDisp=toBar(dpPipe); dpMinorDisp=toBar(dpMinor); dpElevDisp=toBar(dpElev);
    dpUnit='bar'; velDisp=V; velUnit='m/s';
    headDisp=headLoss; headUnit='m';
  }

  const per100label = unitMode === 'imperial' ? 'ΔP per 100 ft' : 'ΔP per 100 m';
  const lenUnit      = unitMode === 'imperial' ? 'ft' : 'm';
  const diamUnit     = unitMode === 'imperial' ? 'in' : 'mm';

  const warnings = [];
  if (isGasFluid)
    warnings.push(`⚠ Compressible fluid detected (ρ = ${rho.toFixed(2)} kg/m³). Darcy-Weisbach valid only if ΔP/P₁ < 10%.`);
  if (V > 15)
    warnings.push(`Very high velocity ${V.toFixed(2)} m/s — severe erosion, noise and vibration risk.`);
  else if (V > 3 && rho > 500)
    warnings.push(`High velocity ${V.toFixed(2)} m/s — erosion risk above 3 m/s for liquids.`);
  if (Re >= 2300 && Re < 4000)
    warnings.push('Flow is in the transitional regime (Re 2300–4000). Results have higher uncertainty (±20–30% possible).');
  if (Re < 4000 && Ktot > 0)
    warnings.push('Fittings equivalent length (Le) assumes turbulent flow — less reliable for laminar/transitional Re.');

  // Unit-display values for diameter, length, elevation, Leq
  // diameter/length/dz/Leq for display must be in user's original units (not SI-converted)
  const diamDisp = D_orig;                                           // in or mm (user's units)
  const lenDisp  = L_orig;                                           // ft or m (user's units)
  const dzDisp   = unitMode === 'imperial' ? dz / 0.3048 : dz;      // ft or m (user's units)
  const LeqDisp  = unitMode === 'imperial' ? Leq / 0.3048 : Leq;    // ft or m (user's units)

  return {
    ok: true,
    dpDisp, dpPipeDisp, dpMinorDisp, dpElevDisp, dpUnit,
    velDisp, velUnit, Re, f, Ktot,
    regime, regimeClass,
    headDisp, headUnit, Leq: LeqDisp,
    P_hyd, P_shaft, P_motor, Qs,
    diameter: diamDisp, length: lenDisp, dz: dzDisp,
    dpTotal, dpPipe, dpMinor, dpElev,
    diamUnit, lenUnit, per100label,
    uncertPct, isGasFluid,
    rho_SI: rho,   // SI kg/m³ — used by NPSH
    warnings,
    inputs: {
      D: D_orig, L: L_orig, Q: Q_orig, rho, mu,
      eps, pumpEff: pumpEff*100, motorEff: motorEff*100,
      unitMode, fluidId
    }
  };
}

// ── NPSH CALCULATION ──────────────────────────────────────────
function runNPSH(body) {
  const { rho, dpSuction, PsuctBar, PvapBar, Zs=0, Hfs=0, NPSHr=0 } = body;
  if (isNaN(PsuctBar) || isNaN(PvapBar) || PsuctBar <= 0) return { skip: true };

  const g = 9.81;
  const Psuct_Pa = PsuctBar * 1e5;
  const Pvap_Pa  = PvapBar  * 1e5;
  const V_suct   = dpSuction > 0 ? Math.sqrt(2 * dpSuction / rho) : 0;
  const velHead_s = V_suct * V_suct / (2 * g);
  const NPSH_A = (Psuct_Pa - Pvap_Pa) / (rho * g) + Zs - Hfs - velHead_s;
  const margin = NPSH_A - NPSHr;
  const safe   = margin >= 0.5;
  const warn   = margin >= 0 && margin < 0.5;

  return {
    NPSH_A, NPSHr, margin, safe, warn,
    status: safe ? 'ok' : warn ? 'warn' : 'fail',
    Psuct_kPa: Psuct_Pa/1000, Pvap_kPa: Pvap_Pa/1000,
    rho, Zs, Hfs, velHead_s
  };
}

// ── VERCEL HANDLER ────────────────────────────────────────────
module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const body = req.body;
    const { action } = body;

    if (action === 'fluidProps') {
      const { fluidId, T_C, P_bar } = body;
      const result = calcFluidProps(fluidId, T_C, P_bar);
      if (!result) return res.status(400).json({ error: `Fluid '${fluidId}' not found.` });
      return res.status(200).json(result);
    }

    if (action === 'fluidList') {
      const list = FLUID_DB.map(f => ({ id: f.id, name: f.name, cat: f.cat, isGas: f.isGas }));
      return res.status(200).json({ fluids: list });
    }

    if (action === 'fittingsList') {
      const list = Object.entries(FITTING_CATALOGUE).map(([id, v]) => ({ id, label: v.label, k: v.k }));
      return res.status(200).json({ fittings: list });
    }

    if (action === 'calculate') {
      const result = runCalculation(body);
      if (result.error) return res.status(400).json({ error: result.error });

      // Optional NPSH — must use SI rho (kg/m³), not raw user input
      if (body.npsh && body.npsh.PsuctBar) {
        const npshResult = runNPSH({ ...body.npsh, rho: result.rho_SI, dpSuction: result.dpTotal });
        result.npsh = npshResult;
      }

      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Unknown action.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};
