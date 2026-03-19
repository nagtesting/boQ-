
# ════════════════════════════════════════════════════════════════════════════
# api/steam-calcs.py
# MERGED VERCEL PYTHON SERVERLESS FUNCTION
#
# CALCULATORS IN THIS FILE
# ─────────────────────────────────────────────────────────────────────────
#   SECTION A  ►  STEAM PROPERTIES (IAPWS-IF97)        /api/steam
#   SECTION B  ►  STEAM QUENCH / DESUPERHEATER         /api/steam-quench
#   SECTION C  ►  STEAM TURBINE POWER                  /api/steam-turbine-power
#   SECTION D  ►  RANKINE CYCLE                        /api/rankine
#
# HOW TO NAVIGATE
#   Search "SECTION A" → Steam Properties
#   Search "SECTION B" → Steam Quench / Desuperheater
#   Search "SECTION C" → Steam Turbine Power
#   Search "SECTION D" → Rankine Cycle
#
# ROUTING
#   All 4 routes point here via vercel.json rewrites.
#   The handler reads the last URL path segment and dispatches internally.
#
# DEPENDENCY
#   requirements.txt (repo root):  iapws
#
# ════════════════════════════════════════════════════════════════════════════

from http.server import BaseHTTPRequestHandler
import json
import math
from datetime import datetime
from iapws import IAPWS97


# ════════════════════════════════════════════════════════════════════════════
# SHARED IAPWS HELPERS  (used by all sections)
# ════════════════════════════════════════════════════════════════════════════

def _sat_liq(P_bar=None, T_C=None):
    if P_bar is not None:
        return IAPWS97(P=P_bar / 10, x=0)
    return IAPWS97(T=T_C + 273.15, x=0)

def _sat_vap(P_bar=None, T_C=None):
    if P_bar is not None:
        return IAPWS97(P=P_bar / 10, x=1)
    return IAPWS97(T=T_C + 273.15, x=1)

def _sat_pair(P_bar=None, T_C=None):
    if P_bar is not None:
        return _sat_liq(P_bar=P_bar), _sat_vap(P_bar=P_bar)
    return _sat_liq(T_C=T_C), _sat_vap(T_C=T_C)

def _superheated(P_bar, T_C):
    liq = _sat_liq(P_bar=P_bar)
    if T_C + 273.15 <= liq.T:
        return _sat_vap(P_bar=P_bar)
    return IAPWS97(P=P_bar / 10, T=T_C + 273.15)

def _pump_work(v_m3kg, P_hi_bar, P_lo_bar, eta_p):
    return v_m3kg * (P_hi_bar - P_lo_bar) * 100.0 / eta_p

def _isentropic_exhaust(s1, P2_bar, T2_C=None):
    liq2, vap2 = _sat_pair(P_bar=P2_bar)
    P2_MPa = P2_bar / 10
    if T2_C is not None and T2_C > liq2.T - 273.15 + 0.5:
        st = IAPWS97(P=P2_MPa, T=T2_C + 273.15)
        return st.h, f'Superheated (T2={T2_C:.1f}C)'
    if s1 >= vap2.s:
        T_lo = liq2.T + 0.5; T_hi = 1673.15
        for _ in range(80):
            T_mid = (T_lo + T_hi) / 2
            if IAPWS97(P=P2_MPa, T=T_mid).s < s1:
                T_lo = T_mid
            else:
                T_hi = T_mid
            if T_hi - T_lo < 1e-4: break
        T_exit = (T_lo + T_hi) / 2
        st_exit = IAPWS97(P=P2_MPa, T=T_exit)
        return st_exit.h, f'Superheated (T2s~{T_exit-273.15:.1f}C)'
    elif s1 >= liq2.s:
        x = (s1 - liq2.s) / max(vap2.s - liq2.s, 1e-9)
        x = max(0.0, min(1.0, x))
        return liq2.h + x*(vap2.h - liq2.h), f'Wet Steam (x={x*100:.1f}%)'
    else:
        return liq2.h, 'Subcooled'

def _safe(val, scale=1.0, digits=4):
    if val is None: return None
    v = val * scale
    return round(v, digits) if math.isfinite(v) else None

def _tsat_C(P_bar):
    return _sat_liq(P_bar=P_bar).T - 273.15


# ════════════════════════════════════════════════════════════════════════════
# MAIN VERCEL HANDLER
# ════════════════════════════════════════════════════════════════════════════

class handler(BaseHTTPRequestHandler):

    def log_message(self, format, *args): pass

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        key = self.path.split('?')[0].rstrip('/').split('/')[-1]
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = json.loads(self.rfile.read(length))
        except Exception:
            return self._send(400, {'error': 'Invalid JSON body'})
        try:
            if   key == 'steam':               r = self._section_a(body)
            elif key == 'steam-quench':        r = self._section_b(body)
            elif key == 'steam-turbine-power': r = self._section_c(body)
            elif key == 'rankine':             r = self._section_d(body)
            else: r = {'error': f'Unknown route: {key}'}
        except Exception as e:
            return self._send(422, {'error': str(e)})
        self._send(400 if 'error' in r else 200, r)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self._cors()
        self.send_header('Content-Type', 'application/json')
        self.end_headers(); self.wfile.write(body)


    # ════════════════════════════════════════════════════════════════════════
    # SECTION A  ►  STEAM PROPERTIES  /api/steam
    # Phases: compressed | sat-liq | wet | sat-vap | superheat
    # ════════════════════════════════════════════════════════════════════════

    def _section_a(self, body):
        phase  = body.get('type')
        P_bar  = body.get('P_bar')
        T_C    = body.get('T_C')
        x_in   = body.get('x')
        specBy = body.get('specBy', 'P')
        sys_   = body.get('sys', 'SI')
        result = self._a_calc(phase, P_bar, T_C, x_in, specBy)
        if 'error' in result: return result
        if sys_ == 'IMP': result = self._a_imperial(result)
        return {'success': True, 'data': result}

    def _a_calc(self, phase, P_bar, T_C, x_in, specBy):
        # A1: Compressed liquid
        if phase == 'compressed':
            if P_bar is None or T_C is None: return {'error': 'P_bar and T_C required.'}
            liq, vap = _sat_pair(P_bar=P_bar)
            Tsat_C = liq.T - 273.15
            if T_C >= Tsat_C: return {'error': f'T must be below T_sat={Tsat_C:.2f}C at {P_bar:.3f} bar.'}
            st = IAPWS97(P=P_bar/10, T=T_C+273.15)
            r  = self._a_state(st, liq, vap, None)
            r.update({'phase': 'Compressed Liquid', 'phaseCls': 'compressed'})
            return r
        # A2: Saturated liquid
        if phase == 'sat-liq':
            liq, vap = _sat_pair(P_bar=P_bar) if specBy=='P' else _sat_pair(T_C=T_C)
            r = self._a_state(liq, liq, vap, 0)
            r.update({'phase': 'Saturated Liquid', 'phaseCls': 'sat-liq'}); return r
        # A3: Wet steam
        if phase == 'wet':
            if x_in is None: return {'error': 'x required.'}
            x = float(x_in)
            if not (0.0 <= x <= 1.0): return {'error': 'x must be 0-1.'}
            if specBy == 'P':
                liq, vap = _sat_pair(P_bar=P_bar); st = IAPWS97(P=P_bar/10, x=x)
            else:
                liq, vap = _sat_pair(T_C=T_C); st = IAPWS97(T=T_C+273.15, x=x)
            r = self._a_state(st, liq, vap, x)
            r.update({'phase': f'Wet Steam (x = {x:.3f})', 'phaseCls': 'wet'})
            if x < 0.88: r['erosionRisk'] = True
            # Split transport for wet steam — matches JS addTransport wet branch
            r['mu_f']  = _safe(liq.mu, 1e6, 4); r['mu_g']  = _safe(vap.mu, 1e6, 4)
            r['lam_f'] = _safe(liq.k,  1e3, 4); r['lam_g'] = _safe(vap.k,  1e3, 4)
            r['Cp_f']  = _safe(liq.cp, 1.0, 4); r['Cp_g']  = _safe(vap.cp, 1.0, 4)
            return r
        # A4: Saturated vapor
        if phase == 'sat-vap':
            liq, vap = _sat_pair(P_bar=P_bar) if specBy=='P' else _sat_pair(T_C=T_C)
            r = self._a_state(vap, liq, vap, 1)
            r.update({'phase': 'Saturated Vapor (Dry)', 'phaseCls': 'sat-vap'}); return r
        # A5: Superheated
        if phase == 'superheat':
            if P_bar is None or T_C is None: return {'error': 'P_bar and T_C required.'}
            liq, vap = _sat_pair(P_bar=P_bar)
            Tsat_C = liq.T - 273.15
            if T_C <= Tsat_C: return {'error': f'T must exceed T_sat={Tsat_C:.2f}C at {P_bar:.3f} bar.'}
            st = IAPWS97(P=P_bar/10, T=T_C+273.15)
            r  = self._a_state(st, liq, vap, None)
            r.update({'phase': 'Superheated Steam', 'phaseCls': 'superheat', 'dT_sh': round(T_C-Tsat_C, 4)})
            return r
        return {'error': f'Unknown phase: {phase}'}

    def _a_state(self, st, liq, vap, x_val):
        try: sigma = _safe(st.sigma, 1.0, 4)
        except Exception: sigma = None
        return {
            'T': round(st.T-273.15, 4), 'P': round(st.P*10, 4),
            'Tsat': round(liq.T-273.15, 4), 'h': round(st.h, 3),
            's': round(st.s, 5), 'v': round(st.v, 7), 'rho': round(1/st.v, 4),
            'u': round(st.u, 3), 'x': x_val,
            'hf': round(liq.h, 3), 'hfg': round(vap.h-liq.h, 3), 'hg': round(vap.h, 3),
            'sf': round(liq.s, 5), 'sfg': round(vap.s-liq.s, 5), 'sg': round(vap.s, 5),
            'vf': round(liq.v, 7), 'vg': round(vap.v, 7),
            'mu': _safe(st.mu, 1e6, 4), 'lam': _safe(st.k, 1e3, 4),
            'Cp': _safe(st.cp, 1.0, 4), 'Cv': _safe(st.cv, 1.0, 4),
            'w':  _safe(st.w,  1.0, 3), 'Pr': _safe(st.Prandt, 1.0, 4),
            'sigma': sigma,
        }

    def _a_imperial(self, r):
        tc=lambda v: round(v*9/5+32,3)   if v is not None else None
        pc=lambda v: round(v*14.5038,4)  if v is not None else None
        hc=lambda v: round(v*0.429922,4) if v is not None else None
        sc=lambda v: round(v*0.238846,5) if v is not None else None
        vc=lambda v: round(v*16.01846,6) if v is not None else None
        rc=lambda v: round(v*0.062428,4) if v is not None else None
        kc=lambda v: round(v*5.77789e-4,6) if v is not None else None
        cc=lambda v: round(v*0.238846,4)   if v is not None else None
        wc=lambda v: round(v*3.28084,3)    if v is not None else None
        c = dict(r)
        for k in ['T','Tsat']:             c[k]=tc(c.get(k))
        for k in ['P']:                    c[k]=pc(c.get(k))
        for k in ['h','hf','hfg','hg','u']:c[k]=hc(c.get(k))
        for k in ['s','sf','sfg','sg']:    c[k]=sc(c.get(k))
        for k in ['v','vf','vg']:          c[k]=vc(c.get(k))
        for k in ['rho']:                  c[k]=rc(c.get(k))
        for k in ['lam']:                  c[k]=kc(c.get(k))
        for k in ['Cp','Cv']:              c[k]=cc(c.get(k))
        for k in ['w']:                    c[k]=wc(c.get(k))
        if c.get('dT_sh') is not None: c['dT_sh']=round(c['dT_sh']*9/5,4)
        return c

    # ── End Section A ─────────────────────────────────────────────────────


    # ════════════════════════════════════════════════════════════════════════
    # SECTION B  ►  STEAM QUENCH / DESUPERHEATER  /api/steam-quench
    # Returns ALL fields that the HTML reads from lastR.
    # HTML is 100% client-side — this replaces the JS steam engine entirely.
    # ════════════════════════════════════════════════════════════════════════

    def _section_b(self, body):
        # ── B1: Parse ─────────────────────────────────────────────────────
        try:
            P_s    = float(body['P_s'])           # bara steam pressure
            T1     = float(body['T1'])             # °C inlet steam
            Tw     = float(body['Tw'])             # °C quench water
            Pw     = float(body.get('Pw', P_s))   # bara water supply
            T2     = float(body['T2'])             # °C target outlet
            m_in   = float(body['m_in'])           # kg/h inlet flow
            sh_min = float(body.get('sh_min', 10))
            f_min  = float(body.get('f_min',  30))
            f_max  = float(body.get('f_max', 110))
            cv_in  = float(body.get('cv_in',   0))
        except (KeyError, TypeError) as e:
            return {'error': f'Missing input: {e}'}

        Ps_MPa = P_s / 10
        Pw_MPa = Pw  / 10
        warns  = []

        # ── B2: Tsat at steam pressure ────────────────────────────────────
        sat_line = IAPWS97(P=Ps_MPa, x=0)
        Ts = sat_line.T - 273.15

        # ── B3: Validation ────────────────────────────────────────────────
        if T1 <= Ts + 0.5:
            return {'error': f'Inlet steam ({T1:.1f}C) not superheated — must exceed Tsat ({Ts:.1f}C).'}
        if T2 >= T1:
            return {'error': 'Target outlet must be lower than inlet temperature.'}
        if T2 <= Ts + sh_min:
            return {'error': f'Outlet target too close to saturation. Min outlet = {Ts+sh_min:.1f}C.'}
        if Tw >= T2:
            return {'error': 'Water temperature must be below outlet target.'}
        if m_in <= 0:
            return {'error': 'Steam mass flow must be positive.'}

        if Tw >= Ts:
            warns.append(f'Warning: Water temp ({Tw:.1f}C) >= Tsat at steam pressure — flash risk.')
        if Pw > 0 and Pw <= P_s + 0.3:
            warns.append(f'Warning: Low water pressure margin (Pw-Ps = {Pw-P_s:.2f} bara). Need >= 3 bar.')

        # ── B4: IAPWS97 properties ────────────────────────────────────────
        st1 = IAPWS97(P=Ps_MPa, T=T1+273.15)
        st2 = IAPWS97(P=Ps_MPa, T=T2+273.15)
        stw = IAPWS97(P=Pw_MPa, T=Tw+273.15)
        h1,h2,hw = st1.h,st2.h,stw.h
        v1,v2    = st1.v,st2.v
        s1,s2    = st1.s,st2.s

        if not all(math.isfinite(v) for v in [h1,h2,hw]):
            return {'error': 'Steam property calculation failed.'}
        if h1 <= h2: return {'error': 'Inlet enthalpy <= outlet enthalpy.'}
        denom = h2 - hw
        if denom < 20: return {'error': f'Insufficient driving force (h2-hw = {denom:.1f} kJ/kg, min 20).'}

        # ── B5: Mass & energy balance ─────────────────────────────────────
        ratio  = (h1-h2)/denom
        m_w    = m_in*ratio; m_out = m_in+m_w
        qPct   = m_w/m_out*100
        Q_rem  = m_in/3600*(h1-h2); Q_abs = m_w/3600*denom
        sh_out = T2-Ts
        mw_min = m_w*f_min/100; mw_max = m_w*f_max/100
        mo_min = m_in+mw_min;   mo_max = m_in+mw_max

        # ── B6: Superheat status object (matches JS shSt.{c,lbl,bb}) ─────
        if sh_out >= 20:
            shSt = {'c':'ok', 'lbl':'ADEQUATE SUPERHEAT',    'bb':'bb-ok'}
        elif sh_out >= sh_min:
            shSt = {'c':'wa', 'lbl':'LOW SUPERHEAT MARGIN',  'bb':'bb-wa'}
        else:
            shSt = {'c':'bd', 'lbl':'INSUFFICIENT SUPERHEAT','bb':'bb-bd'}

        # ── B7: Near-saturation quality check ────────────────────────────
        outletQuality = None
        if 0 <= sh_out < 3:
            liq_ps = IAPWS97(P=Ps_MPa, x=0); vap_ps = IAPWS97(P=Ps_MPa, x=1)
            hfg_ps = vap_ps.h - liq_ps.h
            if hfg_ps > 1:
                x_est = (h2-liq_ps.h)/hfg_ps
                outletQuality = max(0.0, min(1.0, x_est))
                warns.append(f'Outlet very close to saturation (SH={sh_out:.1f}C). x~{outletQuality:.3f}.')

        # ── B8: Uncertainty estimates ─────────────────────────────────────
        def _unc(P_bar_v, T_C_v, is_sh):
            if T_C_v > 350 and P_bar_v > 165:
                d = math.sqrt(((T_C_v-374.14)/24)**2+((P_bar_v-220.64)/56)**2)
                return '+-15 kJ/kg critical' if d < 0.5 else '+-5 kJ/kg near-critical'
            if is_sh:
                return ('+-2 kJ/kg' if P_bar_v > 160 else '+-1 kJ/kg' if P_bar_v > 80 else '+-0.5 kJ/kg')
            return '+-0.3 kJ/kg'
        unc_h1 = _unc(P_s, T1, True)
        unc_h2 = _unc(P_s, T2, True)
        unc_hw = _unc(Pw,  Tw, False)

        # ── B9: Sensitivity tables ────────────────────────────────────────
        sensT, sensW = [], []
        for d in range(-10, 11, 2):
            T2s = T2+d
            if T2s > T1 or T2s <= Ts+sh_min: continue
            h2s = IAPWS97(P=Ps_MPa, T=T2s+273.15).h
            if not math.isfinite(h2s) or h2s <= hw+5: continue
            mws = m_in*(h1-h2s)/(h2s-hw)
            sensT.append({'d':d,'T2s':round(T2s,2),'mws':round(mws,1),
                          'pct':round(mws/(m_in+mws)*100,2),'base':d==0})
        for d in range(-20, 21, 5):
            Tws = Tw+d
            if Tws <= 0 or Tws >= T2: continue
            hws = IAPWS97(P=Pw_MPa, T=Tws+273.15).h
            if not math.isfinite(hws) or h2 <= hws+5: continue
            mws = m_in*(h1-h2)/(h2-hws)
            sensW.append({'d':d,'Tws':round(Tws,2),'mws':round(mws,1),
                          'pct':round(mws/(m_in+mws)*100,2),'base':d==0})

        # ── B10: Saturation boundary (for stream table row) ───────────────
        liq_ps = IAPWS97(P=Ps_MPa, x=0); vap_ps = IAPWS97(P=Ps_MPa, x=1)
        hf_Ps  = round(liq_ps.h, 2);     hg_Ps  = round(vap_ps.h, 2)

        # ── B11: Valve Cv (ISA S75.01) ────────────────────────────────────
        cv_res = None
        if cv_in > 0 and Pw > 0:
            dP_bar = Pw-P_s; dP_psi = dP_bar*14.5038
            rho_w  = 1.0/stw.v; SG = rho_w/998.2
            sat_w  = IAPWS97(T=Tw+273.15, x=0); Pv_bar = sat_w.P*10
            m_w_gpm = m_w/0.453592/60/8.3454
            FL = 0.90; dP_allow = FL*FL*(Pw-Pv_bar)
            Cv_req = m_w_gpm/math.sqrt(dP_psi/SG) if dP_bar>0.1 and dP_psi>0 and SG>0 else None
            Kv_req = Cv_req/1.1561 if Cv_req and math.isfinite(Cv_req) else None
            rat    = cv_in/Cv_req  if Cv_req and math.isfinite(Cv_req) and Cv_req>0 else None
            sigma  = (Pw-Pv_bar)/dP_bar if dP_bar>0.01 else None
            cv_res = {
                'Cv_req':  round(Cv_req,3) if Cv_req and math.isfinite(Cv_req) else None,
                'Kv_req':  round(Kv_req,3) if Kv_req and math.isfinite(Kv_req) else None,
                'Cv_inst': cv_in,
                'Kv_inst': round(cv_in/1.1561,3),
                'rat':     round(rat,3)   if rat   and math.isfinite(rat)   else None,
                'dP_psi':  round(dP_psi,2), 'dP_bar': round(dP_bar,2),
                'm_w_gpm': round(m_w_gpm,2), 'SG': round(SG,3), 'rho_w': round(rho_w,1),
                'Pv_bar':  round(Pv_bar,3),
                'sigma':   round(sigma,2) if sigma and math.isfinite(sigma) else None,
                'cavitating': sigma is not None and sigma < 2.0 and dP_bar > 0.1,
                'flashing':   Pv_bar >= Pw,
                'choked':     dP_bar > dP_allow,
                'dP_allow':   round(dP_allow,2), 'FL': FL,
            }

        # ── B12: Return — every field HTML reads from lastR ───────────────
        return {
            # Inputs echoed (HTML uses these in render/sensitivity/PDF)
            'P_s': P_s,
            'Ps':  Ps_MPa,    # HTML calls h_steam(T, r.Ps) in sensitivity — MPa
            'T1': T1, 'T2': T2, 'Tw': Tw,
            'Pw': Pw_MPa,     # HTML calls h_water(Tws, r.Pw) — MPa
            'm_in': m_in, 'fMin': f_min, 'fMax': f_max, 'shMin_C': sh_min,
            # Saturation
            'Ts': round(Ts, 3),
            # Properties
            'h1': round(h1,2), 'h2': round(h2,2), 'hw': round(hw,2),
            'v1': round(v1,5), 'v2': round(v2,5),
            's1': round(s1,4), 's2': round(s2,4),
            # Sat boundary for stream table
            'hf_Ps': hf_Ps, 'hg_Ps': hg_Ps,
            # Mass balance
            'ratio': round(ratio,6), 'm_w': round(m_w,1), 'm_out': round(m_out,1),
            'qPct': round(qPct,3), 'Q_rem': round(Q_rem,2), 'Q_abs': round(Q_abs,2),
            # Superheat
            'sh_out': round(sh_out,3), 'shSt': shSt, 'shStatus': shSt['lbl'],
            # Control range
            'mw_min': round(mw_min,1), 'mw_max': round(mw_max,1),
            'mo_min': round(mo_min,1), 'mo_max': round(mo_max,1),
            # Quality & uncertainty
            'outletQuality': round(outletQuality,4) if outletQuality is not None else None,
            'unc_h1': unc_h1, 'unc_h2': unc_h2, 'unc_hw': unc_hw,
            # Tables & valve
            'sensT': sensT, 'sensW': sensW, 'cv_res': cv_res, 'warns': warns,
            # Timestamp for PDF header
            'ts': datetime.now().strftime('%d %b %Y, %H:%M:%S'),
        }

    # ── End Section B ─────────────────────────────────────────────────────


    # ════════════════════════════════════════════════════════════════════════
    # SECTION C  ►  STEAM TURBINE POWER  /api/steam-turbine-power
    # Actions: inletProps | exhaustProps | calculate
    # Types  : backpressure | condensing | extraction | mixed
    # ════════════════════════════════════════════════════════════════════════

    def _section_c(self, body):
        action = body.get('action', 'calculate')
        if   action == 'inletProps':   return self._c_inlet(body)
        elif action == 'exhaustProps': return self._c_exhaust(body)
        elif action == 'calculate':    return self._c_calc(body)
        return {'error': f'Unknown action: {action}'}

    def _c_inlet(self, body):
        P_bar = float(body['P_bar'])
        T_C   = float(body['T_C']) if body.get('T_C') is not None else None
        liq, vap = _sat_pair(P_bar=P_bar); Tsat_C = liq.T-273.15
        if T_C is None or T_C <= Tsat_C+0.5:
            return {'h':round(vap.h,3),'s':round(vap.s,5),'v':round(vap.v,7),'T_sat':round(Tsat_C,3),'phase':'sat'}
        st = IAPWS97(P=P_bar/10, T=T_C+273.15)
        return {'h':round(st.h,3),'s':round(st.s,5),'v':round(st.v,7),'T_sat':round(Tsat_C,3),'phase':'superheated'}

    def _c_exhaust(self, body):
        P_bar = float(body['P_bar'])
        s1    = float(body.get('s1_SI', 0))
        T2_C  = float(body['T2_C']) if body.get('T2_C') is not None else None
        liq2, vap2 = _sat_pair(P_bar=P_bar)
        h2s, phase = _isentropic_exhaust(s1 or vap2.s, P_bar, T2_C)
        return {'h2s':round(h2s,3),'hf':round(liq2.h,3),'hg':round(vap2.h,3),
                'hfg':round(vap2.h-liq2.h,3),'T_sat':round(liq2.T-273.15,3),
                'sf':round(liq2.s,5),'sg':round(vap2.s,5),'phase':phase}

    def _c_calc(self, body):
        try:
            flow_kgh=float(body['flow_kgh']); h1=float(body['h1_SI'])
            h2s=float(body['h2s_SI']); s1=float(body.get('s1_SI',0))
            p1_bar=float(body['p1_bar']); p2_bar=float(body['p2_bar'])
            eff=min(1.0,max(0.01,float(body['eff'])))
            effm=min(1.0,max(0.01,float(body['effm'])))
            effg=min(1.0,max(0.01,float(body['effg'])))
            turb=body.get('turbineType','backpressure')
        except (KeyError,TypeError) as e: return {'error':f'Missing: {e}'}
        if flow_kgh<=0: return {'error':'Invalid mass flow'}
        if h1<=0: return {'error':'Invalid h1'}
        if h2s<=0: return {'error':'Invalid h2s'}
        if p1_bar<=0: return {'error':'Invalid P1'}
        if p2_bar<=0: return {'error':'Invalid P2'}
        if p2_bar>=p1_bar: return {'error':'P2 must be < P1'}
        if h1<=h2s: return {'error':'h1 must be > h2s'}

        mDot=flow_kgh/3600; w=(h1-h2s)*eff; h2=h1-w
        liq2,vap2=_sat_pair(P_bar=p2_bar)
        quality=None
        if h2 < vap2.h:
            q=(h2-liq2.h)/max(vap2.h-liq2.h,1e-9); quality=max(0.0,min(1.0,q))
        out={'w_SI':round(w,3),'h2_SI':round(h2,3),
             'quality':round(quality,4) if quality is not None else None,
             'sat2_T':round(liq2.T-273.15,3)}

        # C3a: Back pressure
        if turb == 'backpressure':
            pw=mDot*w*effm; pe=pw*effg; Q_in=mDot*h1
            out.update({'pw':round(pw,3),'pe':round(pe,3),'Q_in':round(Q_in,3),
                        'Q_out':round(mDot*h2,3),
                        'eta':round(pw/Q_in*100 if Q_in>0 else 0,4)})

        # C3b: Condensing
        elif turb == 'condensing':
            cwIn_C=float(body['cwIn_C']); cwOut_C=float(body['cwOut_C'])
            hf=float(body['hf_SI']); condP_bar=float(body.get('condP_bar',p2_bar))
            pw=mDot*w*effm; pe=pw*effg
            Q_cond=mDot*max(0,h2-hf); dT_cw=cwOut_C-cwIn_C
            mDot_cw=Q_cond/(4.187*dT_cw) if dT_cw>0 else 0
            Q_in=mDot*h1
            heatRate=pw/(mDot*h1)*3600 if pw>0 else 0
            liq_c,_=_sat_pair(P_bar=condP_bar)
            out.update({'pw':round(pw,3),'pe':round(pe,3),'Q_cond':round(Q_cond,3),
                        'mDot_cw':round(mDot_cw,4),'dT_cw':round(dT_cw,2),
                        'heatRate':round(heatRate,2),'Q_in':round(Q_in,3),
                        'eta':round(pw/Q_in*100 if Q_in>0 else 0,4),
                        'condP_bar':condP_bar,'satCond_T':round(liq_c.T-273.15,3)})

        # C3c: Extraction — uses JS field names (extFrac, he_SI)
        elif turb == 'extraction':
            extFrac=float(body['extFrac']); he_SI=float(body['he_SI'])
            mExt=mDot*extFrac; mExh=mDot*(1-extFrac)
            if mExh<0: return {'error':'Extraction flow exceeds inlet.'}
            w_HP=(h1-he_SI)*eff; w_LP=(he_SI-h2s)*eff
            pw=(mDot*w_HP+mExh*w_LP)*effm; pe=pw*effg
            h2_exh=he_SI-w_LP; Q_proc=mExt*(he_SI-419); Q_in=mDot*h1
            out.update({'pw':round(pw,3),'pe':round(pe,3),'Q_proc':round(Q_proc,3),
                        'eta':round(pw/Q_in*100 if Q_in>0 else 0,4),
                        'w_HP':round(w_HP,3),'w_LP':round(w_LP,3),
                        'he_SI':round(he_SI,3),'h2_exh':round(h2_exh,3),
                        'extFrac':extFrac,'mExt':round(mExt,4),'mExh':round(mExh,4)})

        # C3d: Mixed — uses JS field names (extFrac2, he2_SI)
        elif turb == 'mixed':
            extFrac2=float(body['extFrac2']); he2_SI=float(body['he2_SI'])
            cwIn2_C=float(body['cwIn2_C']); cwOut2_C=float(body['cwOut2_C'])
            hf2_SI=float(body['hf2_SI'])
            mExt2=mDot*extFrac2; mExh2=mDot*(1-extFrac2)
            if mExh2<0: return {'error':'Extraction flow exceeds inlet.'}
            w_HP2=(h1-he2_SI)*eff; w_LP2=(he2_SI-h2s)*eff
            pw=(mDot*w_HP2+mExh2*w_LP2)*effm; pe=pw*effg
            h2_exh2=he2_SI-w_LP2
            Q_cond2=max(0,mExh2*(h2_exh2-hf2_SI))
            dT2=cwOut2_C-cwIn2_C; mDot_cw2=Q_cond2/(4.187*dT2) if dT2>0 else 0
            Q_proc2=mExt2*(he2_SI-419); Q_in=mDot*h1
            out.update({'pw':round(pw,3),'pe':round(pe,3),'Q_cond':round(Q_cond2,3),
                        'mDot_cw':round(mDot_cw2,4),'dT_cw':round(dT2,2),
                        'Q_proc':round(Q_proc2,3),'eta':round(pw/Q_in*100 if Q_in>0 else 0,4),
                        'w_HP':round(w_HP2,3),'w_LP':round(w_LP2,3),
                        'he_SI':round(he2_SI,3),'h2_exh':round(h2_exh2,3),
                        'extFrac':extFrac2,'mExt':round(mExt2,4),'mExh':round(mExh2,4)})
        else:
            return {'error':f'Unknown turbineType: {turb}'}
        return out

    # ── End Section C ─────────────────────────────────────────────────────


    # ════════════════════════════════════════════════════════════════════════
    # SECTION D  ►  RANKINE CYCLE  /api/rankine
    # HTML sends: { type, params }   type = cycle name or 'tsat'
    # All pressures in params are in MPa
    # ════════════════════════════════════════════════════════════════════════

    def _section_d(self, body):
        cycle  = body.get('type', '')
        params = body.get('params', body)

        # tsat autofill — called by every cycle tab for Tsat display
        if cycle == 'tsat':
            P_MPa = float(params.get('P_MPa', 0))
            if P_MPa <= 0: return {'tsat': None}
            try:
                return {'tsat': round(_sat_liq(P_bar=P_MPa*10).T-273.15, 3)}
            except Exception: return {'tsat': None}

        if   cycle == 'basic':     return self._d_basic(params)
        elif cycle == 'superheat': return self._d_superheat(params)
        elif cycle == 'reheat':    return self._d_reheat(params)
        elif cycle == 'regen':     return self._d_regen(params)
        elif cycle == 'carnot':    return self._d_carnot(params)
        return {'error': f'Unknown cycle: {cycle}'}

    # shared helpers
    def _d_isentropic_h(self, s1, liq, vap):
        if s1 >= vap.s: return vap.h, 1.0
        x=(s1-liq.s)/max(vap.s-liq.s,1e-9); x=max(0.0,min(1.0,x))
        return liq.h+x*(vap.h-liq.h), x

    def _d_tsat(self, P_MPa): return IAPWS97(P=P_MPa, x=0).T-273.15

    def _d_s1(self, liq, vap):
        return {'hf':round(liq.h,2),'sf':round(liq.s,5),
                'sfg':round(vap.s-liq.s,5),'hfg':round(vap.h-liq.h,2),'vf':round(liq.v,7)}

    # D1: Basic Rankine
    def _d_basic(self, p):
        T3=float(p['T3']); Ph=float(p['Ph']); T1=float(p['T1']); Pc=float(p['Pc'])
        etaT=float(p['etaT']); etaP=float(p['etaP']); etaG=float(p['etaG'])
        etaB=float(p['etaB']); mdot=float(p['mdot']); hhv=float(p['hhv'])
        TsatB=self._d_tsat(Ph)
        if T3<=TsatB: return {'error':f'Boiler T must exceed Tsat={TsatB:.1f}C.'}
        if Pc>=Ph: return {'error':'Condenser P must be < boiler P.'}
        st3=_superheated(Ph*10,T3); h3,s3=st3.h,st3.s
        liq1=IAPWS97(P=Pc,x=0); vap1=IAPWS97(P=Pc,x=1)
        h4s,_=self._d_isentropic_h(s3,liq1,vap1); h4=h3-etaT*(h3-h4s)
        wp=_pump_work(liq1.v,Ph*10,Pc*10,etaP); h2=liq1.h+wp
        qB=h3-h2; wT=h3-h4; wNet=wT-wp
        if qB<=0: return {'error':'qB<=0'}
        if wNet<=0: return {'error':'Net work<=0'}
        etaTh=wNet/qB; etaC=1-(T1+273.15)/(T3+273.15)
        WkW=wNet*mdot; QkW=qB*mdot; QrejkW=QkW-WkW
        heatRate=3600/max(etaTh,1e-9); fuelRate=QkW/(etaB*hhv*1000)
        x4raw=(h4-liq1.h)/max(vap1.h-liq1.h,1e-9)
        if x4raw<0: return {'error':'Turbine exit sub-cooled.'}
        x4=max(0.0,min(1.0,x4raw))
        return {'ok':True,'type':'basic',
                'etaTh':round(etaTh,6),'etaCarnot':round(etaC,6),
                'eta2nd':round(etaTh/max(etaC,1e-9),6),'etaOverall':round(etaTh*etaG*etaB,6),
                'WkW':round(WkW,2),'QkW':round(QkW,2),'QrejkW':round(QrejkW,2),
                'heatRate':round(heatRate,1),'fuelRate':round(fuelRate,5),
                'bwr':round(wp/max(wT,1e-9),5),
                'wT':round(wT,3),'wp':round(wp,3),'wNet':round(wNet,3),'qB':round(qB,3),
                'h1':round(liq1.h,2),'h2':round(h2,2),'h3':round(h3,2),'h4':round(h4,2),
                's1':self._d_s1(liq1,vap1),'s3':{'h':round(h3,2),'s':round(s3,5)},
                'x4':round(x4,4),'moisture':round((1-x4)*100,2),
                'TsatBoiler':round(TsatB,2),'T1':T1,'T3':T3,'Ph':Ph,'Pc':Pc,
                'mdot':mdot,'etaG':etaG,'etaB':etaB}

    # D2: Superheat Rankine
    def _d_superheat(self, p):
        Tsh=float(p['Tsh']); Ph=float(p['Ph']); Tc=float(p['Tc']); Pc=float(p['Pc'])
        etaT=float(p['etaT']); etaP=float(p['etaP']); mdot=float(p['mdot'])
        TsatB=self._d_tsat(Ph)
        if Tsh<=TsatB: return {'error':f'T_sh must exceed Tsat={TsatB:.1f}C.'}
        if Pc>=Ph: return {'error':'Condenser P must be < boiler P.'}
        st3=_superheated(Ph*10,Tsh); h3,s3=st3.h,st3.s
        liq1=IAPWS97(P=Pc,x=0); vap1=IAPWS97(P=Pc,x=1)
        h4s,_=self._d_isentropic_h(s3,liq1,vap1); h4=h3-etaT*(h3-h4s)
        wp=_pump_work(liq1.v,Ph*10,Pc*10,etaP); h2=liq1.h+wp
        qB=h3-h2; wT=h3-h4; wNet=wT-wp
        if qB<=0: return {'error':'qB<=0'}
        if wNet<=0: return {'error':'Net work<=0'}
        etaTh=wNet/qB; etaC=1-(Tc+273.15)/(Tsh+273.15)
        WkW=wNet*mdot; QkW=qB*mdot
        x4raw=(h4-liq1.h)/max(vap1.h-liq1.h,1e-9)
        if x4raw<0: return {'error':'Turbine exit sub-cooled.'}
        x4=max(0.0,min(1.0,x4raw))
        return {'ok':True,'type':'superheat',
                'etaTh':round(etaTh,6),'etaC':round(etaC,6),
                'eta2nd':round(etaTh/max(etaC,1e-9),6),
                'WkW':round(WkW,2),'QkW':round(QkW,2),
                'heatRate':round(3600/max(etaTh,1e-9),1),'bwr':round(wp/max(wT,1e-9),5),
                'wT':round(wT,3),'wp':round(wp,3),'wNet':round(wNet,3),'qB':round(qB,3),
                'h1':round(liq1.h,2),'h2':round(h2,2),'h3':round(h3,2),'h4':round(h4,2),
                's1':self._d_s1(liq1,vap1),
                'x4':round(x4,4),'moisture':round((1-x4)*100,2),
                'dsh':round(Tsh-TsatB,2),'TsatB':round(TsatB,2),'Tsh':Tsh,'Ph':Ph,'Tc':Tc,'Pc':Pc}

    # D3: Reheat Rankine
    def _d_reheat(self, p):
        T1=float(p['T1']); P1=float(p['P1'])
        Trh=float(p['Trh']); P2=float(p['P2']); Pc=float(p['Pc'])
        etaHPT=float(p['etaHPT']); etaLPT=float(p['etaLPT'])
        etaP=float(p['etaP']); mdot=float(p['mdot'])
        Tc=float(p['Tc']) if p.get('Tc') is not None else self._d_tsat(Pc)
        st3=_superheated(P1*10,T1); h3,s3=st3.h,st3.s
        liq2=IAPWS97(P=P2,x=0); vap2=IAPWS97(P=P2,x=1)
        h4s,_=self._d_isentropic_h(s3,liq2,vap2); h4=h3-etaHPT*(h3-h4s)
        st5=_superheated(P2*10,Trh); h5,s5=st5.h,st5.s
        liq_c=IAPWS97(P=Pc,x=0); vap_c=IAPWS97(P=Pc,x=1)
        h6s,_=self._d_isentropic_h(s5,liq_c,vap_c); h6=h5-etaLPT*(h5-h6s)
        wp=_pump_work(liq_c.v,P1*10,Pc*10,etaP); h2=liq_c.h+wp
        wHPT=h3-h4; wLPT=h5-h6; wNet=wHPT+wLPT-wp
        qBoil=h3-h2; qReh=h5-h4; qTotal=qBoil+qReh
        if qTotal<=0: return {'error':'Heat input<=0'}
        if wNet<=0: return {'error':'Net work<=0'}
        etaTh=wNet/qTotal; etaC=1-(Tc+273.15)/(T1+273.15)
        WkW=wNet*mdot; QkW=qTotal*mdot
        x6raw=(h6-liq_c.h)/max(vap_c.h-liq_c.h,1e-9); x6=max(0.0,min(1.0,x6raw))
        optP2=math.sqrt(P1*Pc)
        return {'ok':True,'type':'reheat',
                'etaTh':round(etaTh,6),'etaC':round(etaC,6),
                'eta2nd':round(etaTh/max(etaC,1e-9),6),
                'WkW':round(WkW,2),'QkW':round(QkW,2),
                'heatRate':round(3600/max(etaTh,1e-9),1),'bwr':round(wp/max(wHPT+wLPT,1e-9),5),
                'wHPT':round(wHPT,3),'wLPT':round(wLPT,3),
                'wp':round(wp,3),'wNet':round(wNet,3),
                'qBoiler':round(qBoil,3),'qReheat':round(qReh,3),'qTotal':round(qTotal,3),
                'h1':round(liq_c.h,2),'h2':round(h2,2),'h3':round(h3,2),
                'h4':round(h4,2),'h5':round(h5,2),'h6':round(h6,2),
                's1':self._d_s1(liq_c,vap_c),
                'x6':round(x6,4),'moisture':round((1-x6)*100,2),
                'Tsat1':round(self._d_tsat(P1),2),'optP2':round(optP2,4),
                'Tc':Tc,'T1':T1,'P1':P1,'Trh':Trh,'P2':P2,'Pc':Pc}

    # D4: Regenerative Rankine
    def _d_regen(self, p):
        Thi=float(p['Thi']); Phi=float(p['Phi'])
        Pbleed=float(p['Pbleed']); Pc=float(p['Pc'])
        etaT=float(p['etaT']); etaP=float(p['etaP']); mdot=float(p['mdot'])
        Tc=float(p['Tc']) if p.get('Tc') is not None else self._d_tsat(Pc)
        stIn=_superheated(Phi*10,Thi); h_in,s_in=stIn.h,stIn.s
        liq_bl=IAPWS97(P=Pbleed,x=0); vap_bl=IAPWS97(P=Pbleed,x=1)
        h_bl_s,_=self._d_isentropic_h(s_in,liq_bl,vap_bl); h_bl=h_in-etaT*(h_in-h_bl_s)
        liq_c=IAPWS97(P=Pc,x=0); vap_c=IAPWS97(P=Pc,x=1)
        h4s,_=self._d_isentropic_h(s_in,liq_c,vap_c); h4=h_in-etaT*(h_in-h4s)
        h5=liq_c.h; h6=liq_bl.h
        y=min(max((h6-h5)/max(h_bl-h5,1e-9),0.0),0.5)
        wp1=_pump_work(liq_c.v, Pbleed*10,Pc*10,    etaP)
        wp2=_pump_work(liq_bl.v,Phi*10,   Pbleed*10, etaP)
        h7=h6+wp2; h2=h7  # h2 = boiler feed = h7
        wT=(h_in-h_bl)+(1-y)*(h_bl-h4); wp_total=(1-y)*wp1+wp2
        wNet=wT-wp_total; qB=h_in-h7
        if qB<=0: return {'error':'Heat input<=0'}
        if wNet<=0: return {'error':'Net work<=0'}
        etaTh=wNet/qB; etaC=1-(Tc+273.15)/(Thi+273.15)
        WkW=wNet*mdot; QkW=qB*mdot
        x4raw=(h4-liq_c.h)/max(vap_c.h-liq_c.h,1e-9); x4=max(0.0,min(1.0,x4raw))
        return {'ok':True,'type':'regen',
                'etaTh':round(etaTh,6),'etaC':round(etaC,6),
                'eta2nd':round(etaTh/max(etaC,1e-9),6),
                'WkW':round(WkW,2),'QkW':round(QkW,2),
                'heatRate':round(3600/max(etaTh,1e-9),1),
                'wT':round(wT,3),'wp_total':round(wp_total,3),
                'wNet':round(wNet,3),'qB':round(qB,3),'y':round(y,4),
                'h1':round(h_in,2),'h2':round(h2,2),'h4':round(h4,2),
                'h5':round(h5,2),'h6':round(h6,2),'h7':round(h7,2),
                'h_bl':round(h_bl,2),'s1':self._d_s1(liq_c,vap_c),
                'x4':round(x4,4),'moisture':round((1-x4)*100,2),
                'TsatIn':round(self._d_tsat(Phi),2),'TsatBleed':round(self._d_tsat(Pbleed),2),
                'Thi':Thi,'Phi':Phi,'Pbleed':Pbleed,'Tc':Tc,'Pc':Pc}

    # D5: Carnot
    def _d_carnot(self, p):
        TH=float(p['TH']); TC=float(p['TC']); QH=float(p['QH'])
        actual=float(p['actual']) if p.get('actual') is not None else None
        if TH<=TC: return {'error':'T_H must be > T_C.'}
        TH_K=TH+273.15; TC_K=TC+273.15; etaC=1-TC_K/TH_K
        if actual is not None and actual/100>=etaC: return {'error':'Actual eta > Carnot limit.'}
        Wmax=etaC*QH; Qrej=QH-Wmax
        eta2nd=(actual/100)/etaC if actual is not None else None
        wrongEta=(1-TC/TH)*100 if TH!=0 else None  # HTML shows this as the "wrong" Celsius calc
        return {'ok':True,'type':'carnot',
                'etaC':round(etaC,6),'Wmax':round(Wmax,2),'Qrej':round(Qrej,2),
                'COPhp':round(TH_K/(TH_K-TC_K),4),'COPref':round(TC_K/(TH_K-TC_K),4),
                'eta2nd':round(eta2nd,4) if eta2nd is not None else None,
                'wrongEta':round(wrongEta,4) if wrongEta is not None else None,
                'TH_K':TH_K,'TC_K':TC_K,'TH':TH,'TC':TC,'QH':QH}

    # ── End Section D ─────────────────────────────────────────────────────
