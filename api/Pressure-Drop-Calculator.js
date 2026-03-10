<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover,maximum-scale=1.0">
<title>Pressure Drop Calculator — Darcy-Weisbach, Pipe Friction | multicalci.com</title>
<meta name="description" content="Free pipe pressure drop calculator — Darcy-Weisbach, Colebrook-White, K-factor minor losses, pump sizing. SI & Imperial. 120+ fluids.">
<link rel="canonical" href="https://multicalci.com/pressure-drop-calculator/">
<meta property="og:title" content="Pressure Drop Calculator — Darcy-Weisbach | multicalci.com">
<meta property="og:description" content="Free pipe pressure drop calculator — Darcy-Weisbach, Colebrook-White, K-factor minor losses, pump sizing. SI & Imperial. 120+ fluids.">
<meta property="og:url" content="https://multicalci.com/pressure-drop-calculator/">
<meta property="og:type" content="website">
    <meta property="og:image" content="https://multicalci.com/assets/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Pressure Drop Calculator — Darcy-Weisbach | multicalci.com">
    <meta name="twitter:image" content="https://multicalci.com/assets/og-image.png">


<meta name="robots" content="index, follow">
<meta name="author" content="multicalci.com">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Pressure Drop Calculator","description":"Free pipe pressure drop calculator using Darcy-Weisbach equation with Colebrook-White friction factor.","applicationCategory":"EngineeringApplication","operatingSystem":"Web","url":"https://multicalci.com/pressure-drop-calculator/","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
/* ═══════════════════════════════════════════════════
   RESET & DESIGN TOKENS
═══════════════════════════════════════════════════ */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --primary:#4f46e5; --primary-l:#6366f1; --primary-pale:#eef2ff; --primary-dim:rgba(79,70,229,.1);
  --accent:#0891b2;  --accent-pale:#ecfeff;
  --green:#059669;   --green-pale:#d1fae5;
  --amber:#d97706;   --amber-pale:#fef3c7;
  --red:#dc2626;     --red-pale:#fee2e2;
  --purple:#7c3aed;  --purple-pale:#f5f3ff;
  --text:#111827;    --text2:#374151;  --text3:#6b7280; --text4:#9ca3af;
  --border:#e5e7eb;  --border2:#d1d5db;
  --bg:#ffffff;      --bg2:#f9fafb;   --bg3:#f3f4f6;
  --shadow:0 1px 3px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.05);
  --shadow-lg:0 4px 6px rgba(0,0,0,.05),0 10px 30px rgba(0,0,0,.08);
  --r:10px;
  --font:'Outfit',sans-serif;
  --mono:'JetBrains Mono',monospace;
}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}
body{font-family:var(--font);background:var(--bg2);color:var(--text);min-height:100vh;font-size:14px;overflow-x:hidden;line-height:1.5;}

/* ═══════════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════════ */
.topbar{
  position:sticky;top:0;z-index:200;
  background:rgba(255,255,255,.96);
  border-bottom:1px solid var(--border);
  backdrop-filter:blur(16px) saturate(1.4);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 18px;height:56px;
  gap:10px;
}
.topbar-brand{display:flex;align-items:center;gap:9px;flex-shrink:0;text-decoration:none;}
.topbar-logo{
  width:34px;height:34px;
  background:linear-gradient(135deg,var(--primary),var(--accent));
  border-radius:8px;display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:.78rem;font-weight:700;color:#fff;
  box-shadow:0 2px 8px rgba(79,70,229,.3);letter-spacing:-.03em;
}
.topbar-name{font-weight:800;font-size:.94rem;color:var(--primary);letter-spacing:-.02em;}
.topbar-name span{color:var(--text3);font-weight:500;}

/* Desktop nav tabs */
.nav-tabs{display:flex;align-items:center;gap:2px;}
@media(max-width:720px){.nav-tabs{display:none;}}
.nav-tab{
  padding:6px 12px;border-radius:7px;border:none;background:transparent;
  font-family:var(--font);font-size:.82rem;font-weight:600;color:var(--text3);
  cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px;
  -webkit-tap-highlight-color:transparent;white-space:nowrap;
}
.nav-tab:hover{background:var(--bg3);color:var(--text2);}
.nav-tab.active{background:var(--primary-pale);color:var(--primary);}
.nav-tab .tab-dot{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.5;flex-shrink:0;}
.nav-tab.active .tab-dot{opacity:1;}

/* Topbar right */
.topbar-actions{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.unit-pill{display:flex;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;overflow:hidden;}
.upbtn{
  padding:5px 11px;border:none;background:transparent;
  font-family:var(--font);font-size:.76rem;font-weight:700;color:var(--text3);
  cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent;min-height:30px;
}
.upbtn.on{background:var(--primary);color:#fff;}

.btn-icon{
  display:flex;align-items:center;gap:5px;
  padding:5px 12px;border-radius:8px;border:none;
  font-family:var(--font);font-size:.79rem;font-weight:700;
  cursor:pointer;transition:all .18s;white-space:nowrap;min-height:32px;
  -webkit-tap-highlight-color:transparent;
}
.btn-pdf{background:var(--primary);color:#fff;box-shadow:0 2px 8px rgba(79,70,229,.25);}
.btn-pdf:hover{background:var(--primary-l);transform:translateY(-1px);}
.btn-reset{background:var(--bg3);color:var(--text3);border:1px solid var(--border2);}
.btn-reset:hover{background:var(--red-pale);color:var(--red);border-color:#fca5a5;}
@media(max-width:480px){.btn-pdf .pdf-label,.btn-reset .reset-label{display:none;}}

/* Mobile bottom tabs */
.mob-tabs{
  display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;
  background:#fff;border-top:1px solid var(--border);
  padding-bottom:env(safe-area-inset-bottom,4px);
  box-shadow:0 -2px 12px rgba(0,0,0,.07);
}
.mob-tabs-inner{display:flex;overflow-x:auto;scrollbar-width:none;}
.mob-tabs-inner::-webkit-scrollbar{display:none;}
.mtab{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:3px;padding:7px 6px 5px;min-height:50px;border:none;background:transparent;
  font-family:var(--font);font-size:.62rem;font-weight:700;color:var(--text3);
  cursor:pointer;border-top:2px solid transparent;-webkit-tap-highlight-color:transparent;
  transition:color .12s;letter-spacing:.2px;
}
.mtab-icon{font-size:1.1rem;line-height:1;}
.mtab.active{color:var(--primary);border-top-color:var(--primary);}
.mtab:active{background:var(--primary-pale);}
@media(max-width:720px){.mob-tabs{display:block;}}

/* ═══════════════════════════════════════════════════
   DISCLAIMER
═══════════════════════════════════════════════════ */
.disclaimer-bar{
  background:var(--amber-pale);border-bottom:1.5px solid #fcd34d;
  padding:7px 18px;font-size:.73rem;color:#78350f;font-weight:500;
  display:flex;align-items:flex-start;gap:7px;line-height:1.5;
}
.disclaimer-bar strong{color:#92400e;}

/* ═══════════════════════════════════════════════════
   SECTION / TAB CONTENT
═══════════════════════════════════════════════════ */
.section{display:none;animation:fadeIn .22s ease;}
.section.active{display:block;}
@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

/* ═══════════════════════════════════════════════════
   HERO STRIP
═══════════════════════════════════════════════════ */
.hero{
  background:linear-gradient(135deg,#4f46e5 0%,#0891b2 100%);
  padding:24px 22px 20px;border-radius:12px;margin:14px 14px 0;
  position:relative;overflow:hidden;
}
.hero::before{
  content:'ΔP';position:absolute;right:20px;top:50%;transform:translateY(-50%);
  font-size:5.5rem;font-weight:800;color:rgba(255,255,255,.07);
  font-family:var(--mono);pointer-events:none;line-height:1;
}
.hero h1{font-size:1.35rem;font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:-.03em;}
.hero p{font-size:.84rem;color:rgba(255,255,255,.8);font-weight:400;line-height:1.5;}
.hero-badges{display:flex;gap:6px;margin-top:11px;flex-wrap:wrap;}
.hbadge{
  padding:3px 9px;border-radius:14px;font-size:.67rem;font-weight:700;
  background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);
  letter-spacing:.2px;
}

/* ═══════════════════════════════════════════════════
   LAYOUT
═══════════════════════════════════════════════════ */
.page-body{padding:14px 14px 28px;}
@media(max-width:720px){.page-body{padding:10px 10px 72px;}}
.two-col{display:grid;grid-template-columns:390px 1fr;gap:16px;align-items:start;}
@media(max-width:1100px){.two-col{grid-template-columns:1fr;}}

/* ═══════════════════════════════════════════════════
   CARDS
═══════════════════════════════════════════════════ */
.card{
  background:var(--bg);border:1px solid var(--border);
  border-radius:var(--r);padding:18px;
  box-shadow:var(--shadow);
}
.card+.card{margin-top:14px;}
.card-hdr{
  display:flex;align-items:center;gap:9px;
  margin-bottom:16px;padding-bottom:11px;border-bottom:1px solid var(--border);
}
.card-icon{
  width:30px;height:30px;border-radius:7px;
  background:var(--primary-pale);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
}
.card-icon svg{width:15px;height:15px;color:var(--primary);}
.card-title{font-size:.93rem;font-weight:700;color:var(--text);}

/* ═══════════════════════════════════════════════════
   FORM ELEMENTS
═══════════════════════════════════════════════════ */
.fsec{margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border);}
.fsec:last-of-type{border-bottom:none;margin-bottom:0;padding-bottom:0;}
.fsec-title{
  font-size:.67rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
  color:var(--primary);margin-bottom:11px;display:flex;align-items:center;gap:6px;
}
.fsec-title::after{content:'';flex:1;height:1px;background:var(--primary-pale);}

.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
@media(max-width:380px){.row2,.row3{grid-template-columns:1fr;}}
.fgroup{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;}
.fgroup:last-child{margin-bottom:0;}
.flabel{font-size:.74rem;font-weight:600;color:var(--text2);letter-spacing:.1px;}
.flabel-hint{font-size:.69rem;font-weight:400;color:var(--text3);margin-left:4px;}

/* Input with unit suffix */
.irow{display:flex;}
.irow input{
  flex:1;border-radius:8px 0 0 8px!important;
  border-right:none!important;
}
.iunit{
  padding:0 10px;background:var(--bg3);
  border:1px solid var(--border2);border-radius:0 8px 8px 0;
  font-family:var(--mono);font-size:.71rem;font-weight:600;color:var(--accent);
  display:flex;align-items:center;white-space:nowrap;min-width:48px;justify-content:center;
}

/* All native inputs */
input[type=number],input[type=text],select{
  width:100%;padding:8px 10px;background:var(--bg);
  border:1px solid var(--border2);border-radius:8px;
  color:var(--text);font-family:var(--mono);font-size:14px;
  transition:border-color .18s,box-shadow .18s;outline:none;
  min-height:38px;appearance:none;-webkit-appearance:none;
}
input:focus,select:focus{
  border-color:var(--primary);
  box-shadow:0 0 0 3px rgba(79,70,229,.1);
}
select{
  cursor:pointer;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;padding-right:28px;
}

/* Calculate button */
.btn-calc{
  width:100%;padding:12px;border:none;border-radius:9px;
  background:linear-gradient(135deg,var(--primary),var(--primary-l));
  color:#fff;font-family:var(--font);font-size:.9rem;font-weight:700;
  cursor:pointer;transition:all .2s;
  box-shadow:0 4px 14px rgba(79,70,229,.3);
  margin-top:4px;display:flex;align-items:center;justify-content:center;gap:7px;
  min-height:46px;-webkit-tap-highlight-color:transparent;letter-spacing:-.01em;
}
.btn-calc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(79,70,229,.4);}
.btn-calc:active{transform:translateY(0);}
.btn-calc svg{width:16px;height:16px;flex-shrink:0;}
@media(hover:none){.btn-calc:hover{transform:none;box-shadow:0 4px 14px rgba(79,70,229,.3);}}

/* ═══════════════════════════════════════════════════
   ALERTS
═══════════════════════════════════════════════════ */
.alerts-stack{display:flex;flex-direction:column;gap:7px;margin-bottom:12px;}
.alert{
  display:none;align-items:flex-start;gap:8px;
  padding:9px 12px;border-radius:8px;font-size:.79rem;font-weight:500;line-height:1.5;
}
.alert.show{display:flex;}
.alert-icon{flex-shrink:0;margin-top:1px;}
.alert-warn{background:var(--amber-pale);border:1px solid #fcd34d;color:#92400e;}
.alert-err{background:var(--red-pale);border:1px solid #fca5a5;color:#991b1b;}
.alert-gas{background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;}
.alert-info{background:var(--primary-pale);border:1px solid #c7d2fe;color:#312e81;}

/* Warn items list */
.warn-list{list-style:none;display:flex;flex-direction:column;gap:4px;}
.warn-list li::before{content:'•';margin-right:5px;}

/* ═══════════════════════════════════════════════════
   FLUID SEARCH
═══════════════════════════════════════════════════ */
.fluid-search-wrap{position:relative;}
.fluid-search-input{
  width:100%;padding:9px 12px;
  border:1.5px solid var(--border2);border-radius:8px;
  font-size:13px;font-family:var(--font);background:var(--bg);
  outline:none;transition:border-color .18s,box-shadow .18s;
}
.fluid-search-input:focus{
  border-color:var(--primary);
  box-shadow:0 0 0 3px rgba(79,70,229,.1);
}
.fluid-dropdown{
  display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;
  background:var(--bg);border:1.5px solid var(--primary);
  border-radius:8px;max-height:220px;overflow-y:auto;
  z-index:300;box-shadow:0 8px 24px rgba(0,0,0,.12);
}
.fd-category{
  padding:5px 10px 3px;font-size:.63rem;font-weight:700;color:var(--primary);
  letter-spacing:.9px;text-transform:uppercase;background:var(--bg2);
  border-bottom:1px solid var(--border);position:sticky;top:0;
}
.fd-item{
  padding:8px 13px;cursor:pointer;font-size:.82rem;color:var(--text);
  border-bottom:1px solid var(--bg3);
  display:flex;justify-content:space-between;align-items:center;gap:8px;
  transition:background .12s;
}
.fd-item:hover{background:var(--primary-pale);color:var(--primary);}
.fd-item-cat{font-size:.68rem;color:var(--text3);font-family:var(--mono);white-space:nowrap;}
.fluid-badge{
  display:none;align-items:center;gap:8px;
  margin-top:7px;padding:8px 12px;
  background:var(--primary-pale);border:1px solid #c7d2fe;border-radius:8px;
  font-size:.81rem;font-weight:600;color:var(--primary);
}
.fluid-badge.show{display:flex;}
.fluid-badge-text{flex:1;font-size:.79rem;}
.fluid-badge-clear{
  background:none;border:none;color:var(--primary);cursor:pointer;
  font-size:1rem;font-weight:700;padding:0 2px;line-height:1;
  opacity:.6;transition:opacity .14s;
}
.fluid-badge-clear:hover{opacity:1;}

/* Op conditions panel */
.op-cond-panel{
  display:none;background:var(--primary-pale);
  border:1.5px solid #c7d2fe;border-radius:9px;
  padding:13px 15px;margin-bottom:12px;
}
.op-cond-panel.show{display:block;}
.op-cond-title{
  font-size:.65rem;font-weight:700;color:var(--primary);
  letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px;
}
.prop-strip{
  margin-top:9px;padding:8px 12px;background:var(--bg);
  border:1px solid #c7d2fe;border-radius:7px;
  font-family:var(--mono);font-size:.77rem;color:var(--text2);
  display:flex;flex-wrap:wrap;gap:10px;align-items:center;
}
.prop-sep{color:var(--border2);}

/* ═══════════════════════════════════════════════════
   FITTINGS TABLE
═══════════════════════════════════════════════════ */
.fit-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:7px;border:1px solid var(--border);}
.fit-table{width:100%;border-collapse:collapse;font-size:.79rem;min-width:360px;}
.fit-table th{
  background:var(--bg3);color:var(--text3);
  font-size:.65rem;font-weight:700;letter-spacing:.6px;text-transform:uppercase;
  padding:7px 8px;border-bottom:2px solid var(--border2);text-align:left;
  white-space:nowrap;
}
.fit-table td{padding:4px 5px;border-bottom:1px solid var(--border);vertical-align:middle;}
.fit-table tr:last-child td{border-bottom:none;}
.fit-table tr:hover td{background:var(--bg2);}
.fit-ksub-col{text-align:right;}
@media(max-width:460px){.fit-ksub-col{display:none;}}
.fit-name{font-size:.79rem;font-weight:600;color:var(--text);line-height:1.3;}
.fit-sub{font-size:.66rem;color:var(--text4);}

.fit-qty{width:50px!important;padding:4px 5px!important;text-align:center;font-size:13px!important;min-height:32px!important;}
.fit-k{width:58px!important;padding:4px 5px!important;text-align:center;font-size:13px!important;color:var(--accent)!important;font-weight:700!important;min-height:32px!important;}
.fit-k.custom-k{color:var(--amber)!important;border-color:var(--amber)!important;}

.btn-del{
  width:26px;height:26px;border-radius:6px;border:none;
  background:var(--red-pale);color:var(--red);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .14s;flex-shrink:0;-webkit-tap-highlight-color:transparent;
}
.btn-del:hover{background:var(--red);color:#fff;}
.btn-del svg{width:10px;height:10px;}

.fit-adder{
  display:flex;gap:7px;align-items:center;
  margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);
}
.fit-adder select{flex:1!important;font-size:13px!important;min-height:38px!important;font-family:var(--font)!important;}
.btn-add-fit{
  padding:7px 13px;border-radius:7px;border:1.5px solid var(--primary);
  background:var(--primary-pale);color:var(--primary);
  font-family:var(--font);font-size:.79rem;font-weight:700;
  cursor:pointer;transition:all .16s;white-space:nowrap;min-height:38px;
  -webkit-tap-highlight-color:transparent;
}
.btn-add-fit:hover{background:var(--primary);color:#fff;}

.fit-ktotal{
  display:flex;justify-content:space-between;align-items:center;
  background:var(--primary-pale);border:1px solid #c7d2fe;border-radius:7px;
  padding:7px 11px;margin-top:7px;
}
.kt-label{font-size:.75rem;font-weight:700;color:var(--primary);}
.kt-val{font-family:var(--mono);font-size:.93rem;font-weight:700;color:var(--primary);}

/* ═══════════════════════════════════════════════════
   RESULTS
═══════════════════════════════════════════════════ */
.placeholder-state{text-align:center;padding:48px 16px;color:var(--text4);}
.placeholder-icon{width:56px;height:56px;margin:0 auto 14px;opacity:.2;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.placeholder-state h3{font-size:1rem;color:var(--text3);margin-bottom:4px;font-weight:700;}
.placeholder-state p{font-size:.83rem;}

.res-header{
  background:linear-gradient(135deg,var(--green),#10b981);
  border-radius:10px;padding:18px 20px;margin-bottom:14px;
  text-align:center;color:#fff;box-shadow:0 4px 16px rgba(5,150,105,.22);
}
.rh-label{font-size:.69rem;font-weight:700;letter-spacing:1.2px;opacity:.85;margin-bottom:2px;text-transform:uppercase;}
.rh-value{font-family:var(--mono);font-size:2.4rem;font-weight:700;line-height:1;word-break:break-all;}
.rh-unit{font-size:1rem;font-weight:600;margin-left:4px;opacity:.9;}
.rh-sub{font-size:.77rem;opacity:.8;margin-top:4px;}
.rh-uncert{font-size:.72rem;opacity:.75;margin-top:3px;}

.res-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:13px;}
@media(max-width:380px){.res-grid{grid-template-columns:1fr;}}

.rcard{
  background:var(--bg2);border:1px solid var(--border);
  border-radius:9px;padding:11px 13px;
  border-left:3px solid var(--primary);
  word-break:break-word;overflow-wrap:anywhere;
}
.rcard.g{border-left-color:var(--green);}
.rcard.a{border-left-color:var(--amber);}
.rcard.r{border-left-color:var(--red);}
.rcard.p{border-left-color:var(--purple);}
.rcard-label{font-size:.67rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;}
.rcard-val{font-family:var(--mono);font-size:1.22rem;font-weight:700;color:var(--text);}
.rcard-unit{font-size:.74rem;color:var(--accent);margin-left:2px;font-weight:600;}
.rcard-note{font-size:.69rem;color:var(--text3);margin-top:3px;}

.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.68rem;font-weight:700;letter-spacing:.2px;margin-top:3px;}
.badge-green{background:var(--green-pale);color:var(--green);border:1px solid #a7f3d0;}
.badge-amber{background:var(--amber-pale);color:var(--amber);border:1px solid #fcd34d;}
.badge-red{background:var(--red-pale);color:var(--red);border:1px solid #fca5a5;}

/* Summary box */
.summary-box{
  background:var(--primary-pale);border:1px solid #c7d2fe;
  border-radius:9px;padding:13px 15px;margin-bottom:11px;
}
.summary-box h4{font-size:.77rem;font-weight:700;color:var(--primary);margin-bottom:8px;letter-spacing:.2px;}
.summary-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:5px 0;border-bottom:1px solid #e0e7ff;flex-wrap:wrap;gap:4px;
}
.summary-row:last-child{border-bottom:none;}
.sr-key{font-size:.77rem;color:var(--text2);}
.sr-val{font-family:var(--mono);font-size:.78rem;font-weight:600;color:var(--text);}

/* Pump section */
.pump-section{background:var(--purple-pale);border:1px solid #ddd6fe;border-radius:9px;padding:13px 15px;margin-top:11px;}
.pump-section-title{font-size:.66rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--purple);margin-bottom:9px;}

/* Uncertainty box */
.uncertainty-box{
  background:var(--bg3);border:1px solid var(--border2);border-radius:8px;
  padding:9px 13px;margin-top:9px;font-size:.75rem;color:var(--text2);
  font-family:var(--mono);line-height:1.7;
}
.uncertainty-box strong{color:var(--primary);}

/* NPSH result */
.npsh-result{font-family:var(--mono);font-size:1.05rem;font-weight:700;}
.npsh-ok{color:var(--green);}
.npsh-warn{color:var(--amber);}
.npsh-fail{color:var(--red);}

/* Method tab */
.method-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
@media(max-width:768px){.method-grid{grid-template-columns:1fr;}}
.formula-box{
  background:var(--bg3);border:1px solid var(--border);border-radius:8px;
  padding:11px 13px;font-family:var(--mono);font-size:.79rem;
  color:var(--text2);line-height:2;margin:8px 0;
}
.eq-highlight{color:var(--primary);font-weight:700;}
.eq-accent{color:var(--accent);}
.info-list{list-style:none;margin-top:6px;}
.info-list li{
  padding:5px 0;border-bottom:1px solid var(--border);
  font-size:.81rem;color:var(--text2);
  display:flex;justify-content:space-between;gap:8px;
}
.info-list li:last-child{border-bottom:none;}
.info-list li strong{color:var(--text);font-weight:600;flex-shrink:0;}
.info-list li code{font-family:var(--mono);font-size:.76rem;color:var(--accent);}

/* K-factor table */
.ktable{width:100%;border-collapse:collapse;font-size:.82rem;}
.ktable th{
  background:var(--bg3);color:var(--text2);font-weight:700;
  font-size:.67rem;letter-spacing:.5px;text-transform:uppercase;
  padding:7px 9px;border:1px solid var(--border);text-align:left;
}
.ktable td{padding:6px 9px;border:1px solid var(--border);color:var(--text2);}
.ktable tr:nth-child(even) td{background:var(--bg2);}
.ktable td:last-child{font-family:var(--mono);font-weight:600;color:var(--primary);}
@media(max-width:600px){.ktable{font-size:.74rem;}.ktable th,.ktable td{padding:5px 6px;}}

/* H-W badge */
.hw-badge{
  display:inline-block;padding:2px 9px;border-radius:9px;font-size:.67rem;
  font-weight:700;background:#fff0f6;border:1px solid #f9a8d4;color:#be185d;
  margin-left:7px;vertical-align:middle;
}

/* Scrollbar */
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:var(--bg2);}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

/* Home button */
.home-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 12px;border-radius:7px;
  background:var(--bg3);border:1.5px solid var(--border2);
  color:var(--text2);font-family:var(--font);font-size:.74rem;font-weight:600;
  text-decoration:none;transition:all .16s;white-space:nowrap;flex-shrink:0;
}
.home-btn:hover{background:var(--primary);color:#fff;border-color:var(--primary);}
.home-btn svg{width:12px;height:12px;}

/* ── Fluid Select ─────────────────────────── */
.fluid-select-wrap{position:relative;}
.fluid-filter-input{
  width:100%;padding:8px 12px;margin-bottom:5px;
  border:1.5px solid var(--border2);border-radius:8px;
  font-size:13px;font-family:var(--font);background:var(--bg);
  outline:none;transition:border-color .18s,box-shadow .18s;
  box-sizing:border-box;
}
.fluid-filter-input:focus{
  border-color:var(--primary);
  box-shadow:0 0 0 3px rgba(79,70,229,.1);
}
.fluid-select{
  width:100%;border:1.5px solid var(--border2);border-radius:8px;
  font-size:.82rem;font-family:var(--font);background:var(--bg);
  color:var(--text);outline:none;padding:4px 0;
  cursor:pointer;transition:border-color .18s;
  box-sizing:border-box;
}
.fluid-select:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(79,70,229,.1);}
.fluid-select optgroup{font-size:.72rem;font-weight:700;color:var(--primary);background:var(--bg2);}
.fluid-select option{font-size:.82rem;padding:4px 8px;color:var(--text);background:var(--bg);}
.fluid-select option:checked{background:var(--primary-pale);color:var(--primary);}

/* ── Fluid select collapse on selection ─────────── */
.fluid-select-wrap.selected .fluid-filter-input { display:none; }
.fluid-select-wrap.selected .fluid-select        { display:none; }
.fluid-badge {
  cursor:default;
}
.fluid-badge-name {
  flex:1; font-size:.84rem; font-weight:700; color:var(--primary);
}
.fluid-badge-change {
  background:none; border:1px solid var(--primary); border-radius:6px;
  color:var(--primary); cursor:pointer; font-size:.72rem; font-weight:700;
  padding:2px 8px; margin-right:4px; transition:all .15s;
}
.fluid-badge-change:hover { background:var(--primary); color:#fff; }
</style>
</head>
<body>
<!-- ══ TOP NAV ══ -->
<nav class="topbar">
  <a class="topbar-brand" href="https://multicalci.com/">
    <div class="topbar-logo">ΔP</div>
    <div class="topbar-name">multi<span>calci.com</span></div>
  </a>

  <div class="nav-tabs" id="desktopTabs">
    <button class="nav-tab active" data-tab="calculator"><span class="tab-dot"></span>Calculator</button>
    <button class="nav-tab" data-tab="method"><span class="tab-dot"></span>Method</button>
    <button class="nav-tab" data-tab="kfactors"><span class="tab-dot"></span>K-Factor Reference</button>
    <button class="nav-tab" data-tab="hazen"><span class="tab-dot"></span>Hazen-Williams</button>
    <button class="nav-tab" data-tab="study"><span class="tab-dot"></span>Study Guide</button>
  </div>

  <div class="topbar-actions">
    <a href="https://multicalci.com/" class="home-btn" title="All Calculators">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
      Home
    </a>
    <div class="unit-pill">
      <button class="upbtn on" data-unit="metric">SI</button>
      <button class="upbtn" data-unit="imperial">US</button>
    </div>
    <button class="btn-icon btn-reset" id="btnReset" title="Reset all inputs">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
      <span class="reset-label">Reset</span>
    </button>
    <button class="btn-icon btn-pdf" id="btnPDF" title="Generate PDF Report">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      <span class="pdf-label">PDF Report</span>
    </button>
  </div>
</nav>

<!-- ══ DISCLAIMER ══ -->
<div class="disclaimer-bar">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  <span><strong>NOT FOR FINAL DESIGN.</strong> Results are indicative only — incompressible Darcy-Weisbach model. Gases and steam require compressible flow analysis. Verify all results with a qualified engineer (ASME B31.3 / Crane TP-410). K-factors are typical averages — use vendor data for critical designs.</span>
</div>
<!-- ══ CALCULATOR TAB ══ -->
<div class="section active" id="tab-calculator">
  <div class="hero">
    <h1>Pressure Drop Calculator</h1>
    <p>Darcy-Weisbach · Colebrook-White friction factor · K-Factor minor losses · Pump sizing</p>
    <div class="hero-badges">
      <span class="hbadge">Darcy-Weisbach</span>
      <span class="hbadge">Colebrook-White</span>
      <span class="hbadge">Churchill (transitional)</span>
      <span class="hbadge">K-Factor Method</span>
      <span class="hbadge">120+ Fluids</span>
      <span class="hbadge">SI / Imperial</span>
      <span class="hbadge">NPSH Check</span>
      <span class="hbadge">Pump Power</span>
    </div>
  </div>

  <div class="page-body">
    <div class="two-col">

      <!-- ── LEFT: INPUTS ── -->
      <div>
        <div class="card">
          <div class="card-hdr">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
            </div>
            <div class="card-title">Input Parameters</div>
          </div>

          <form id="calcForm">

            <!-- PIPE SPECS -->
            <div class="fsec">
              <div class="fsec-title">Pipe Specifications</div>
              <div class="row2">
                <div class="fgroup">
                  <label class="flabel">Pipe Diameter</label>
                  <div class="irow">
                    <input type="number" id="diameter" value="100" step="0.1" min="0.1" required>
                    <div class="iunit" id="diameterUnit">mm</div>
                  </div>
                </div>
                <div class="fgroup">
                  <label class="flabel">Pipe Length</label>
                  <div class="irow">
                    <input type="number" id="length" value="50" step="0.1" min="0.1" required>
                    <div class="iunit" id="lengthUnit">m</div>
                  </div>
                </div>
              </div>
              <div class="fgroup">
                <label class="flabel">Elevation Change Δz <span class="flabel-hint">(+ uphill, − downhill)</span></label>
                <div class="irow">
                  <input type="number" id="elevation" value="0" step="0.1">
                  <div class="iunit" id="elevUnit">m</div>
                </div>
              </div>
              <div class="fgroup">
                <label class="flabel">Pipe Material (Wall Roughness ε)</label>
                <select id="material">
                  <option value="0.045">Carbon Steel — ε = 0.045 mm</option>
                  <option value="0.015">Stainless Steel — ε = 0.015 mm</option>
                  <option value="0.0015">PVC / Plastic — ε = 0.0015 mm</option>
                  <option value="0.0015">Copper — ε = 0.0015 mm</option>
                  <option value="0.26">Concrete — ε = 0.26 mm</option>
                  <option value="0.15">Galvanized Steel — ε = 0.15 mm</option>
                  <option value="0.007">HDPE — ε = 0.007 mm</option>
                  <option value="0.9">Cast Iron — ε = 0.9 mm</option>
                  <option value="custom">Custom roughness →</option>
                </select>
              </div>
              <div class="fgroup" id="custom-eps-row" style="display:none">
                <label class="flabel">Custom ε (mm)</label>
                <input type="number" id="customEps" value="0.05" step="0.001" min="0">
              </div>
            </div>

            <!-- FLOW CONDITIONS -->
            <div class="fsec">
              <div class="fsec-title">Flow Conditions</div>

              <!-- Fluid picker -->
              <div class="fgroup" style="margin-bottom:13px;">
                <label class="flabel">Fluid <span class="flabel-hint">— filter &amp; select from 138 fluids</span></label>
                <div class="fluid-select-wrap">
  <input type="text" id="fluidFilter" class="fluid-filter-input" placeholder="🔍 Filter fluids…" autocomplete="off" oninput="filterFluidSelect(this.value)">
  <select id="fluidSelect" class="fluid-select" size="7" onchange="onFluidSelectChange(this.value)">
    <option value="">— Select a fluid —</option>
    <optgroup label="Water & Aqueous">
      <option value="water">Water</option>
      <option value="seawater">Seawater (3.5% NaCl)</option>
      <option value="brine10">Brine 10% NaCl</option>
      <option value="brine20">Brine 20% NaCl</option>
      <option value="brine25">Brine 25% NaCl</option>
      <option value="cacl2_20">CaCl₂ Solution 20%</option>
      <option value="cacl2_30">CaCl₂ Solution 30%</option>
    </optgroup>
    <optgroup label="Glycols & Coolants">
      <option value="eg30">Ethylene Glycol 30%</option>
      <option value="eg50">Ethylene Glycol 50%</option>
      <option value="eg70">Ethylene Glycol 70%</option>
      <option value="pg30">Propylene Glycol 30%</option>
      <option value="pg50">Propylene Glycol 50%</option>
      <option value="deg">Diethylene Glycol (DEG)</option>
      <option value="teg">Triethylene Glycol (TEG)</option>
      <option value="mea30">MEA 30% (Monoethanolamine)</option>
      <option value="dea35">DEA 35% (Diethanolamine)</option>
    </optgroup>
    <optgroup label="Petroleum & Fuels">
      <option value="gasoline">Gasoline (Petrol)</option>
      <option value="diesel">Diesel Fuel</option>
      <option value="kerosene">Kerosene / Jet-A</option>
      <option value="jeta1">Jet A-1 Fuel</option>
      <option value="hfo">Heavy Fuel Oil (HFO 380)</option>
      <option value="crude20">Crude Oil API 20 (heavy)</option>
      <option value="crude30">Crude Oil API 30</option>
      <option value="crude40">Crude Oil API 40</option>
      <option value="crude50">Crude Oil API 50 (light)</option>
      <option value="naphtha">Naphtha (light)</option>
      <option value="naphtha_h">Naphtha (heavy)</option>
      <option value="atmresid">Atmospheric Residue (ATB)</option>
      <option value="vacresid">Vacuum Residue (VTB)</option>
      <option value="bitumen">Bitumen / Asphalt</option>
    </optgroup>
    <optgroup label="Lubricants & Hydraulic">
      <option value="lube32">Lube Oil ISO VG 32</option>
      <option value="lube46">Lube Oil ISO VG 46</option>
      <option value="lube68">Lube Oil ISO VG 68</option>
      <option value="lube100">Lube Oil ISO VG 100</option>
      <option value="lube150">Lube Oil ISO VG 150</option>
      <option value="lube220">Lube Oil ISO VG 220</option>
      <option value="hydr32">Hydraulic Oil ISO 32</option>
      <option value="hydr46">Hydraulic Oil ISO 46</option>
      <option value="hydr68">Hydraulic Oil ISO 68</option>
      <option value="hydr100">Hydraulic Oil ISO 100</option>
      <option value="thermoil">Thermal / Heat Transfer Oil</option>
      <option value="turbineoil">Turbine Oil ISO VG 46</option>
      <option value="gearoil320">Gear Oil ISO VG 320</option>
    </optgroup>
    <optgroup label="Alcohols">
      <option value="methanol">Methanol</option>
      <option value="ethanol">Ethanol (96%)</option>
      <option value="ethanol_abs">Ethanol Absolute (99.9%)</option>
      <option value="ipa">Isopropanol (IPA)</option>
      <option value="nbutanol">n-Butanol</option>
      <option value="glycerol">Glycerol (100%)</option>
      <option value="glycerol50">Glycerol 50% in Water</option>
    </optgroup>
    <optgroup label="Aromatics">
      <option value="benzene">Benzene</option>
      <option value="toluene">Toluene</option>
      <option value="xylene">Xylene (mixed)</option>
      <option value="oxylene">o-Xylene</option>
      <option value="styrene">Styrene</option>
      <option value="cumene">Cumene (Isopropylbenzene)</option>
    </optgroup>
    <optgroup label="Aliphatics">
      <option value="hexane">n-Hexane</option>
      <option value="heptane">n-Heptane</option>
      <option value="octane">n-Octane</option>
      <option value="cyclohex">Cyclohexane</option>
      <option value="isooctane">Isooctane (2,2,4-TMP)</option>
    </optgroup>
    <optgroup label="Chlorinated Solvents">
      <option value="dcm">Dichloromethane (DCM)</option>
      <option value="chloroform">Chloroform (CHCl₃)</option>
      <option value="cctc">Carbon Tetrachloride (CCl₄)</option>
      <option value="tce">Trichloroethylene</option>
      <option value="pce">Perchloroethylene (PCE)</option>
    </optgroup>
    <optgroup label="Ketones & Esters">
      <option value="acetone">Acetone</option>
      <option value="mek">MEK (Methyl Ethyl Ketone)</option>
      <option value="mibk">MIBK (Methyl Isobutyl Ketone)</option>
      <option value="cyclohexanone">Cyclohexanone</option>
      <option value="ethacet">Ethyl Acetate</option>
      <option value="butacet">Butyl Acetate</option>
    </optgroup>
    <optgroup label="Acids & Bases">
      <option value="h2so4_98">Sulfuric Acid 98%</option>
      <option value="h2so4_50">Sulfuric Acid 50%</option>
      <option value="h2so4_10">Sulfuric Acid 10%</option>
      <option value="hcl30">Hydrochloric Acid 30%</option>
      <option value="hcl10">Hydrochloric Acid 10%</option>
      <option value="hno3_65">Nitric Acid 65%</option>
      <option value="hno3_30">Nitric Acid 30%</option>
      <option value="h3po4_85">Phosphoric Acid 85%</option>
      <option value="naoh30">NaOH (Caustic) 30%</option>
      <option value="naoh50">NaOH (Caustic) 50%</option>
      <option value="koh30">KOH Solution 30%</option>
      <option value="aceticac">Acetic Acid (glacial)</option>
      <option value="aceticac_50">Acetic Acid 50%</option>
      <option value="formicac">Formic Acid 85%</option>
      <option value="ammonia_aq">Ammonia Solution 25%</option>
    </optgroup>
    <optgroup label="Liquefied Gases">
      <option value="lpg">LPG (Propane/Butane mix)</option>
      <option value="propane_liq">Liquid Propane</option>
      <option value="butane_liq">Liquid Butane</option>
      <option value="ammonia_liq">Liquid Ammonia</option>
      <option value="co2_liq">Liquid CO₂ (subcritical)</option>
      <option value="r134a">Refrigerant R-134a</option>
      <option value="r22">Refrigerant R-22</option>
      <option value="r410a">Refrigerant R-410A</option>
    </optgroup>
    <optgroup label="Dual-Phase (auto L/G)">
      <option value="ammonia">Ammonia (NH₃) — auto phase</option>
      <option value="propane">Propane (C₃H₈) — auto phase</option>
      <option value="co2">CO₂ — auto phase</option>
      <option value="water_steam">Water/Steam — auto phase</option>
    </optgroup>
    <optgroup label="Gases (⚠ Compressible)">
      <option value="air">Air</option>
      <option value="nitrogen">Nitrogen (N₂)</option>
      <option value="oxygen">Oxygen (O₂)</option>
      <option value="hydrogen">Hydrogen (H₂)</option>
      <option value="helium">Helium (He)</option>
      <option value="argon">Argon (Ar)</option>
      <option value="co2gas">CO₂ Gas</option>
      <option value="cogas">CO Gas (Carbon Monoxide)</option>
      <option value="methane">Methane (CH₄)</option>
      <option value="ethane">Ethane (C₂H₆)</option>
      <option value="propgas">Propane Gas (C₃H₈)</option>
      <option value="natgas">Natural Gas (SG 0.65)</option>
      <option value="natgas_h">Natural Gas (SG 0.75, rich)</option>
      <option value="h2s">Hydrogen Sulfide (H₂S)</option>
      <option value="so2">Sulfur Dioxide (SO₂)</option>
      <option value="chlorinegas">Chlorine Gas (Cl₂)</option>
      <option value="steam_gas">Steam (superheated)</option>
      <option value="ammgas">Ammonia Gas (NH₃)</option>
      <option value="fluegas">Flue Gas (typical)</option>
      <option value="biogas">Biogas (60% CH₄, 40% CO₂)</option>
      <option value="syngas">Syngas (H₂+CO mixture)</option>
      <option value="hclgas">HCl Gas</option>
    </optgroup>
    <optgroup label="Chemical Process">
      <option value="dmf">DMF (Dimethylformamide)</option>
      <option value="dmso">DMSO (Dimethyl Sulfoxide)</option>
      <option value="thf">THF (Tetrahydrofuran)</option>
      <option value="nmp">N-Methylpyrrolidone (NMP)</option>
      <option value="acetonitrile">Acetonitrile (MeCN)</option>
      <option value="diethether">Diethyl Ether</option>
      <option value="dioxane">1,4-Dioxane</option>
      <option value="furfural">Furfural</option>
    </optgroup>
    <optgroup label="Food & Pharma">
      <option value="milk">Milk (whole)</option>
      <option value="milk_skim">Skim Milk</option>
      <option value="olive">Olive Oil</option>
      <option value="sunflower">Sunflower Oil</option>
      <option value="palmoil">Palm Oil</option>
      <option value="cornsyrup">Corn Syrup 63° Brix</option>
      <option value="honey">Honey</option>
    </optgroup>
    <optgroup label="Special & Metals">
      <option value="mercury">Mercury (liquid)</option>
      <option value="molten_s">Molten Sulfur</option>
      <option value="slurry10">Slurry (10% solids)</option>
      <option value="slurry30">Slurry (30% solids)</option>
      <option value="slurry50">Slurry (50% solids, dense)</option>
      <option value="drilling_mud">Drilling Mud (12 ppg)</option>
    </optgroup>
  </select>
  <div class="fluid-badge" id="fluidSelectedBadge">
    <span class="fluid-badge-name" id="fluidBadgeName"></span>
    <button type="button" class="fluid-badge-change" id="btnChangeFluid" title="Change fluid">Change</button>
    <button type="button" class="fluid-badge-clear" id="btnClearFluid" title="Clear selection">✕</button>
  </div>
  <div style="margin-top:4px;font-size:.69rem;color:var(--text3);">Can't find your fluid? Select closest match and override ρ &amp; μ below.</div>
</div>
              </div>

              <!-- Operating conditions panel -->
              <div class="op-cond-panel" id="opCondRow">
                <div class="op-cond-title">Operating Conditions → auto-calculate ρ &amp; μ</div>
                <div class="row2">
                  <div class="fgroup">
                    <label class="flabel">Temperature</label>
                    <div class="irow">
                      <input type="number" id="opTemp" value="20" step="1">
                      <div class="iunit" id="opTempUnit">°C</div>
                    </div>
                  </div>
                  <div class="fgroup">
                    <label class="flabel">Operating Pressure</label>
                    <div class="irow">
                      <input type="number" id="opPres" value="1.0" step="0.1" min="0.01">
                      <div class="iunit">bar abs</div>
                    </div>
                  </div>
                </div>
                <div class="prop-strip" id="propStrip">
                  <span id="propRho">ρ = —</span>
                  <span class="prop-sep">|</span>
                  <span id="propMu">μ = —</span>
                  <span class="prop-sep">|</span>
                  <span id="propPv">Psat = —</span>
                  <span class="prop-sep">|</span>
                  <span id="propPhase" style="font-weight:700;"></span>
                  <span id="propWarn" style="color:#b45309;font-size:.72rem;"></span>
                </div>
              </div>

              <!-- Flow rate + fluid props -->
              <div class="row2">
                <div class="fgroup">
                  <label class="flabel">Flow Rate</label>
                  <div class="irow">
                    <input type="number" id="flowrate" value="50" step="0.1" min="0.001" required>
                    <div class="iunit" id="flowrateUnit">m³/h</div>
                  </div>
                </div>
                <div class="fgroup">
                  <label class="flabel">Fluid Density <span class="flabel-hint">(auto / editable)</span></label>
                  <div class="irow">
                    <input type="number" id="density" value="998" step="0.1" min="0.001" required>
                    <div class="iunit" id="densityUnit">kg/m³</div>
                  </div>
                </div>
              </div>
              <div class="row2">
                <div class="fgroup">
                  <label class="flabel">Dynamic Viscosity <span class="flabel-hint">(auto / editable)</span></label>
                  <div class="irow">
                    <input type="number" id="viscosity" value="1.002" step="0.0001" min="0.0001" required>
                    <div class="iunit">cP</div>
                  </div>
                </div>
                <div class="fgroup" id="vapPressRow">
                  <label class="flabel">Vapour Pressure <span class="flabel-hint">(auto / editable)</span></label>
                  <div class="irow">
                    <input type="number" id="vapPressure" value="0.023" step="0.00001" min="0">
                    <div class="iunit">bar</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FITTINGS -->
            <div class="fsec">
              <div class="fsec-title">Fittings &amp; Valves</div>
              <div class="fit-table-wrap">
                <table class="fit-table" id="fitTable">
                  <thead>
                    <tr>
                      <th style="width:42%">Fitting / Valve</th>
                      <th style="width:13%">Qty</th>
                      <th style="width:14%">K each</th>
                      <th class="fit-ksub-col" style="width:16%;text-align:right">K×Qty</th>
                      <th style="width:8%"></th>
                    </tr>
                  </thead>
                  <tbody id="fitRows"></tbody>
                </table>
              </div>
              <div class="fit-ktotal">
                <span class="kt-label">∑ Total K-Factor</span>
                <span class="kt-val" id="ktotalDisplay">0.00</span>
              </div>
              <div class="fit-adder">
                <select id="fitPicker">
                  <optgroup label="── Elbows ──">
                    <option value="elbow90|0.9">90° Elbow — Standard (K=0.9)</option>
                    <option value="elbow90lr|0.6">90° Elbow — Long Radius (K=0.6)</option>
                    <option value="elbow45|0.4">45° Elbow — Standard (K=0.4)</option>
                    <option value="elbow45lr|0.2">45° Elbow — Long Radius (K=0.2)</option>
                    <option value="elbow180|1.5">180° Return Bend (K=1.5)</option>
                  </optgroup>
                  <optgroup label="── Tees ──">
                    <option value="teerun|0.6">Tee — Through Run (K=0.6)</option>
                    <option value="teebranch|1.8">Tee — Branch Flow (K=1.8)</option>
                    <option value="teecombine|1.3">Tee — Combining (K=1.3)</option>
                  </optgroup>
                  <optgroup label="── Reducers / Expanders ──">
                    <option value="reducer|0.5">Sudden Contraction (K=0.5)</option>
                    <option value="expander|1.0">Sudden Expansion (K=1.0)</option>
                    <option value="gradred|0.1">Gradual Reducer (K=0.1)</option>
                    <option value="entrance|0.5">Pipe Entrance — Sharp (K=0.5)</option>
                    <option value="exit|1.0">Pipe Exit (K=1.0)</option>
                  </optgroup>
                  <optgroup label="── Gate / Globe / Diaphragm ──">
                    <option value="gate_open|0.2">Gate Valve — Fully Open (K=0.2)</option>
                    <option value="gate_75|1.1">Gate Valve — 75% Open (K=1.1)</option>
                    <option value="gate_50|5.6">Gate Valve — 50% Open (K=5.6)</option>
                    <option value="globe_open|10">Globe Valve — Fully Open (K=10)</option>
                    <option value="globe_50|13">Globe Valve — 50% Open (K=13)</option>
                    <option value="diaphragm|2.3">Diaphragm Valve (K=2.3)</option>
                  </optgroup>
                  <optgroup label="── Ball / Plug / Needle ──">
                    <option value="ball_open|0.05">Ball Valve — Fully Open (K=0.05)</option>
                    <option value="ball_75|0.7">Ball Valve — 75% Open (K=0.7)</option>
                    <option value="ball_50|5.5">Ball Valve — 50% Open (K=5.5)</option>
                    <option value="plug_open|0.3">Plug Valve — Open (K=0.3)</option>
                    <option value="needle|3.0">Needle Valve (K=3.0)</option>
                  </optgroup>
                  <optgroup label="── Butterfly Valves ──">
                    <option value="butterfly_open|0.5">Butterfly — Fully Open (K=0.5)</option>
                    <option value="butterfly_75|0.8">Butterfly — 75° Open (K=0.8)</option>
                    <option value="butterfly_60|2.0">Butterfly — 60° Open (K=2.0)</option>
                    <option value="butterfly_45|10">Butterfly — 45° Open (K=10)</option>
                  </optgroup>
                  <optgroup label="── Check Valves ──">
                    <option value="check_swing|2.0">Check Valve — Swing (K=2.0)</option>
                    <option value="check_lift|12">Check Valve — Lift (K=12)</option>
                    <option value="check_ball|4.5">Check Valve — Ball (K=4.5)</option>
                    <option value="check_tilting|0.8">Check Valve — Tilting Disc (K=0.8)</option>
                  </optgroup>
                  <optgroup label="── Control / Safety Valves ──">
                    <option value="angle|5.0">Angle Valve (K=5.0)</option>
                    <option value="prv|8.0">Pressure Reducing Valve (K=8.0)</option>
                    <option value="psv|6.0">Pressure Safety Valve (K=6.0)</option>
                    <option value="control|5.0">Control Valve — Open (K=5.0)</option>
                    <option value="solenoid|3.5">Solenoid Valve (K=3.5)</option>
                  </optgroup>
                  <optgroup label="── Strainers / Filters ──">
                    <option value="ystrainer|3.0">Y-Strainer — Clean (K=3.0)</option>
                    <option value="tstrainer|2.0">T-Strainer — Clean (K=2.0)</option>
                    <option value="basket|1.5">Basket Strainer — Clean (K=1.5)</option>
                  </optgroup>
                  <optgroup label="── Meters / Instruments ──">
                    <option value="orifice|10">Orifice Plate (K=10)</option>
                    <option value="flowmeter|4.0">Flow Meter (K=4.0)</option>
                    <option value="venturi|0.5">Venturi Meter (K=0.5)</option>
                  </optgroup>
                  <optgroup label="── Custom ──">
                    <option value="custom|1.0">Custom / Other (enter K manually)</option>
                  </optgroup>
                </select>
                <button class="btn-add-fit" type="button" id="btnAddFit">＋ Add</button>
              </div>
            </div>

            <!-- PUMP SIZING -->
            <div class="fsec">
              <div class="fsec-title">Pump Sizing (Optional)</div>
              <div class="row2">
                <div class="fgroup">
                  <label class="flabel">Pump Efficiency (η)</label>
                  <div class="irow">
                    <input type="number" id="pumpEff" value="75" step="1" min="1" max="100">
                    <div class="iunit">%</div>
                  </div>
                </div>
                <div class="fgroup">
                  <label class="flabel">Motor Efficiency (η_m)</label>
                  <div class="irow">
                    <input type="number" id="motorEff" value="92" step="1" min="1" max="100">
                    <div class="iunit">%</div>
                  </div>
                </div>
              </div>
              <div class="fgroup" style="margin-top:2px;">
                <label class="flabel">Fouling / Aging Roughness Allowance <span class="flabel-hint">added on top of material ε</span></label>
                <div class="irow">
                  <input type="number" id="foulingAllowance" value="0" step="0.01" min="0" placeholder="e.g. 0.1">
                  <div class="iunit">mm</div>
                </div>
                <div style="font-size:.69rem;color:var(--text3);margin-top:3px;">Typical: Carbon steel 10 yr = +0.1 mm · Galvanized = +0.3 mm · Blocked strainer = up to +1 mm</div>
              </div>
              <div style="background:var(--amber-pale);border:1px solid #fcd34d;border-radius:7px;padding:8px 11px;margin-top:8px;font-size:.75rem;color:#78350f;line-height:1.55;">
                <strong>Temperature effects:</strong> Viscosity is strongly T-dependent. Water at 20°C: 1.0 cP; at 60°C: 0.47 cP; at 80°C: 0.36 cP. Use the fluid library for accurate auto-fill.
              </div>
            </div>

            <!-- NPSH -->
            <div class="fsec">
              <div class="fsec-title">NPSH &amp; Cavitation Check (Optional)</div>
              <div style="font-size:.74rem;color:var(--text3);margin-bottom:9px;line-height:1.55;">
                NPSH<sub>A</sub> = (P<sub>suct abs</sub> − P<sub>vapor</sub>) / (ρg) + Z<sub>s</sub> − ΔH<sub>fs</sub>. Must exceed NPSH<sub>R</sub> by ≥ 0.5 m.
              </div>
              <div class="row2">
                <div class="fgroup">
                  <label class="flabel">Suction Pressure (abs)</label>
                  <div class="irow">
                    <input type="number" id="npsh-Psuct" value="1.013" step="0.001" min="0">
                    <div class="iunit">bar abs</div>
                  </div>
                </div>
                <div class="fgroup">
                  <label class="flabel">Vapor Pressure of Fluid</label>
                  <div class="irow">
                    <input type="number" id="npsh-Pvap" value="0.02337" step="0.0001" min="0">
                    <div class="iunit">bar abs</div>
                  </div>
                  <div style="font-size:.67rem;color:var(--text3);margin-top:2px;" id="npsh-vpHint">Water@20°C: 0.02337 · @60°C: 0.1994 · @80°C: 0.4739</div>
                </div>
              </div>
              <div class="row2">
                <div class="fgroup">
                  <label class="flabel">Suction Head Z<sub>s</sub></label>
                  <div class="irow">
                    <input type="number" id="npsh-Zs" value="0" step="0.1">
                    <div class="iunit">m</div>
                  </div>
                </div>
                <div class="fgroup">
                  <label class="flabel">Suction Pipe Friction Loss</label>
                  <div class="irow">
                    <input type="number" id="npsh-Hfs" value="0" step="0.01" min="0">
                    <div class="iunit">m</div>
                  </div>
                </div>
              </div>
              <div class="fgroup">
                <label class="flabel">Required NPSH<sub>R</sub> (from pump curve)</label>
                <div class="irow">
                  <input type="number" id="npsh-NPSHr" value="3" step="0.1" min="0">
                  <div class="iunit">m</div>
                </div>
              </div>
              <div id="npsh-result" style="display:none;margin-top:7px;"></div>
            </div>

            <!-- Alerts -->
            <div class="alerts-stack" id="alertsStack">
              <div class="alert alert-err" id="alertErr">
                <svg class="alert-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span id="alertErrText"></span>
              </div>
              <div class="alert alert-gas" id="alertGas" style="display:none">
                <svg class="alert-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span id="alertGasText"></span>
              </div>
              <div class="alert alert-warn" id="alertWarn">
                <svg class="alert-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <ul class="warn-list" id="alertWarnList"></ul>
              </div>
            </div>

            <button class="btn-calc" type="button" id="btnCalc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
              Calculate Pressure Drop
            </button>
          </form>
        </div>
      </div>

      <!-- ── RIGHT: RESULTS ── -->
      <div>
        <div class="card">
          <div class="card-hdr">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="card-title">Results</div>
          </div>
          <div id="placeholder" class="placeholder-state">
            <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3>Ready to Calculate</h3>
            <p>Enter parameters on the left and click Calculate</p>
          </div>
          <div id="results" style="display:none;"></div>
        </div>
      </div>

    </div>
  </div>
</div>
<!-- ══ METHOD TAB ══ -->
<div class="section" id="tab-method">
  <div class="hero">
    <h1>Calculation Method</h1>
    <p>Darcy-Weisbach equation with iterative Colebrook-White friction factor</p>
  </div>
  <div class="page-body">
    <div class="method-grid">
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div><div class="card-title">Darcy-Weisbach Equation</div></div>
        <p style="color:var(--text2);font-size:.86rem;margin-bottom:10px;">Primary equation for frictional pressure loss in fully-developed pipe flow:</p>
        <div class="formula-box"><span class="eq-highlight">ΔP_friction</span> = f × (L / D) × (ρ × V² / 2)</div>
        <ul class="info-list">
          <li><strong>ΔP</strong><code>Pressure drop [Pa]</code></li>
          <li><strong>f</strong><code>Darcy friction factor [-]</code></li>
          <li><strong>L</strong><code>Pipe length [m]</code></li>
          <li><strong>D</strong><code>Internal diameter [m]</code></li>
          <li><strong>ρ</strong><code>Fluid density [kg/m³]</code></li>
          <li><strong>V</strong><code>Mean flow velocity [m/s]</code></li>
        </ul>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg></div><div class="card-title">Colebrook-White (Friction Factor)</div></div>
        <p style="color:var(--text2);font-size:.86rem;margin-bottom:10px;">Solved iteratively for turbulent flow Darcy friction factor:</p>
        <div class="formula-box">1/√f = −2 log₁₀(<span class="eq-accent">ε/(3.7D)</span> + <span class="eq-highlight">2.51/(Re·√f)</span>)</div>
        <p style="color:var(--text2);font-size:.8rem;margin-top:10px;"><strong>Seed value</strong> (Swamee-Jain):</p>
        <div class="formula-box">f₀ = 0.25 / [log₁₀(<span class="eq-accent">ε/(3.7D)</span> + <span class="eq-highlight">5.74/Re⁰·⁹</span>)]²</div>
        <ul class="info-list">
          <li><strong>ε</strong><code>Pipe roughness [m]</code></li>
          <li><strong>Re</strong><code>Reynolds number [-]</code></li>
        </ul>
        <p style="color:var(--text2);font-size:.81rem;margin-top:10px;"><strong>Laminar flow</strong> (Re &lt; 2300): <code style="font-family:var(--mono);color:var(--primary)">f = 64 / Re</code></p>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div><div class="card-title">Reynolds Number &amp; Flow Regimes</div></div>
        <div class="formula-box"><span class="eq-highlight">Re</span> = ρ × V × D / μ</div>
        <ul class="info-list">
          <li><strong>Re &lt; 2,300</strong><code>Laminar — f = 64/Re</code></li>
          <li><strong>2,300 – 4,000</strong><code>Transitional — Churchill (1977)</code></li>
          <li><strong>Re &gt; 4,000</strong><code>Turbulent — Colebrook-White</code></li>
          <li><strong>μ</strong><code>Dynamic viscosity [Pa·s]</code></li>
        </ul>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div><div class="card-title">Minor Losses &amp; Equivalent Length</div></div>
        <div class="formula-box">
          <span class="eq-highlight">ΔP_minor</span> = ΣK × (ρ × V² / 2)<br>
          <span class="eq-highlight">L_eq</span> = K × D / f
        </div>
        <p style="color:var(--text2);font-size:.82rem;margin-top:10px;">Each fitting's K is multiplied by the velocity head. L_eq is the equivalent pipe length that gives the same friction loss.</p>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg></div><div class="card-title">Elevation &amp; Total System Head</div></div>
        <div class="formula-box">
          <span class="eq-highlight">ΔP_total</span> = ΔP_friction + ΔP_minor + ρ·g·Δz<br>
          <span class="eq-highlight">H_total</span> = ΔP_total / (ρ·g)  [m]
        </div>
        <ul class="info-list">
          <li><strong>Δz</strong><code>Elevation change [m] (+ uphill)</code></li>
          <li><strong>g</strong><code>9.81 m/s²</code></li>
          <li><strong>H</strong><code>Head loss [m of fluid]</code></li>
        </ul>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><div class="card-title">Pump Power Requirement</div></div>
        <div class="formula-box">
          <span class="eq-highlight">P_hydraulic</span> = Q × ΔP_total<br>
          <span class="eq-highlight">P_shaft</span> = P_hydraulic / η_pump<br>
          <span class="eq-highlight">P_motor</span> = P_shaft / η_motor
        </div>
        <ul class="info-list">
          <li><strong>Q</strong><code>Volume flow [m³/s]</code></li>
          <li><strong>η_pump</strong><code>Pump efficiency (0.65–0.85 typical)</code></li>
          <li><strong>η_motor</strong><code>Motor efficiency (0.88–0.96 typical)</code></li>
        </ul>
      </div>
    </div>
  </div>
</div>

<!-- ══ K-FACTOR TAB ══ -->
<div class="section" id="tab-kfactors">
  <div class="hero">
    <h1>K-Factor Reference</h1>
    <p>Standard resistance coefficients for common pipe fittings and valves (Crane TP-410)</p>
  </div>
  <div class="page-body">
    <div class="card">
      <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div><div class="card-title">Fittings K-Values</div></div>
      <table class="ktable">
        <thead><tr><th>Fitting / Valve</th><th>Description</th><th>K-Factor</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>90° Elbow (Standard)</td><td>Short-radius 90° bend</td><td>0.9</td><td>Long-radius: K ≈ 0.6</td></tr>
          <tr><td>45° Elbow</td><td>Standard 45° bend</td><td>0.4</td><td>Long-radius: K ≈ 0.2</td></tr>
          <tr><td>180° Return Bend</td><td>U-turn fitting</td><td>1.5</td><td>Close return</td></tr>
          <tr><td>Tee (Through)</td><td>Flow through run</td><td>0.6</td><td>Branch: K ≈ 1.8</td></tr>
          <tr><td>Gate Valve (Full Open)</td><td>Fully open gate</td><td>0.2</td><td>Half open: K ≈ 5.6</td></tr>
          <tr><td>Globe Valve (Full Open)</td><td>Fully open globe</td><td>10</td><td>High resistance</td></tr>
          <tr><td>Ball Valve (Full Open)</td><td>Full bore ball</td><td>0.05</td><td>Excellent low-loss</td></tr>
          <tr><td>Butterfly (Full Open)</td><td>Wafer/lug type</td><td>0.5</td><td>45° open: K ≈ 10</td></tr>
          <tr><td>Check Valve (Swing)</td><td>Swing non-return</td><td>2.0</td><td>Lift type: K ≈ 12</td></tr>
          <tr><td>Pressure Reducing Valve</td><td>PRV fully open</td><td>8.0</td><td>Varies by brand</td></tr>
          <tr><td>Y-Strainer (Clean)</td><td>Clean condition</td><td>3.0</td><td>Dirty: up to 10×</td></tr>
          <tr><td>Pipe Entrance (Sharp)</td><td>Sharp-edge inlet</td><td>0.5</td><td>Rounded: K ≈ 0.05</td></tr>
          <tr><td>Pipe Exit</td><td>Into reservoir</td><td>1.0</td><td>All velocity head lost</td></tr>
        </tbody>
      </table>
      <p style="margin-top:11px;font-size:.79rem;color:var(--text3);">Source: Crane Technical Paper 410. Values vary by manufacturer and pipe schedule. For critical designs, use vendor data.</p>
    </div>
    <div class="card" style="margin-top:14px;">
      <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div><div class="card-title">Pipe Roughness Reference (ε)</div></div>
      <table class="ktable">
        <thead><tr><th>Material</th><th>ε (mm)</th><th>Condition</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>PVC / Plastic / GRP</td><td>0.0015</td><td>New, smooth</td><td>Near-hydrodynamically smooth</td></tr>
          <tr><td>Copper</td><td>0.0015</td><td>New</td><td>Drawn tubing</td></tr>
          <tr><td>HDPE</td><td>0.007</td><td>New</td><td>Polyethylene pipe</td></tr>
          <tr><td>Stainless Steel</td><td>0.015</td><td>New, clean</td><td>304/316 series</td></tr>
          <tr><td>Carbon Steel</td><td>0.045</td><td>New, commercial</td><td>Light rust: 0.1–0.3 mm</td></tr>
          <tr><td>Galvanized Steel</td><td>0.15</td><td>New</td><td>After use: up to 1 mm</td></tr>
          <tr><td>Cast Iron (uncoated)</td><td>0.26–0.9</td><td>Uncoated</td><td>Older pipes may be higher</td></tr>
          <tr><td>Concrete</td><td>0.26–3.0</td><td>Varies</td><td>Depends on finish quality</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- ══ HAZEN-WILLIAMS TAB ══ -->
<div class="section" id="tab-hazen">
  <div class="hero">
    <h1>Hazen-Williams Method <span class="hw-badge">Water Only</span></h1>
    <p>Empirical method for water systems — simpler alternative to Darcy-Weisbach for water distribution</p>
  </div>
  <div class="page-body">
    <div class="two-col">
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg></div><div class="card-title">Hazen-Williams Calculator</div></div>
        <div class="fsec">
          <div class="fsec-title">Pipe Parameters</div>
          <div class="row2">
            <div class="fgroup">
              <label class="flabel">Pipe Inside Diameter</label>
              <div class="irow"><input type="number" id="hw-D" value="100" step="0.1" min="0.1"><div class="iunit">mm</div></div>
            </div>
            <div class="fgroup">
              <label class="flabel">Pipe Length</label>
              <div class="irow"><input type="number" id="hw-L" value="100" step="0.1" min="0.1"><div class="iunit">m</div></div>
            </div>
          </div>
          <div class="fgroup">
            <label class="flabel">Flow Rate</label>
            <div class="irow"><input type="number" id="hw-Q" value="30" step="0.1" min="0.001"><div class="iunit">m³/h</div></div>
          </div>
          <div class="fgroup">
            <label class="flabel">Hazen-Williams C Coefficient</label>
            <select id="hw-C">
              <option value="150">C = 150 — PVC, fibreglass, new smooth plastic</option>
              <option value="140" selected>C = 140 — New cast iron, new steel</option>
              <option value="130">C = 130 — Welded steel, new galvanized</option>
              <option value="120">C = 120 — Cast iron (10 yr), copper</option>
              <option value="110">C = 110 — Cast iron (20 yr), light encrustation</option>
              <option value="100">C = 100 — Cast iron (old), ordinary concrete</option>
              <option value="90">C = 90 — Old cast iron, moderate tuberculation</option>
              <option value="80">C = 80 — Severely corroded pipe</option>
              <option value="custom">Custom C →</option>
            </select>
          </div>
          <div class="fgroup" id="hw-custom-row" style="display:none">
            <label class="flabel">Custom C value</label>
            <input type="number" id="hw-Cval" value="120" step="1" min="1" max="200">
          </div>
        </div>
        <button class="btn-calc" type="button" id="btnCalcHW" style="margin-top:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
          Calculate H-W
        </button>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div class="card-title">Hazen-Williams Results</div></div>
        <div id="hw-results">
          <div class="placeholder-state">
            <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
            <h3>Enter pipe parameters</h3>
            <p>Select pipe type and flow rate, then calculate</p>
          </div>
        </div>
        <div class="card" style="margin-top:14px;background:var(--bg2);border-style:dashed;">
          <div style="font-size:.81rem;color:var(--text2);line-height:1.65;">
            <strong style="color:var(--primary);">Hazen-Williams Formula:</strong>
            <div class="formula-box" style="margin-top:7px;">
              hf = 10.67 × L × Q<sup>1.852</sup> / (C<sup>1.852</sup> × D<sup>4.8704</sup>)<br>
              <span style="color:var(--text3);font-size:.73rem;">Q [m³/s], D [m], hf [m]</span>
            </div>
            <p style="font-size:.77rem;color:var(--text3);margin-top:5px;">Valid only for water 5–30°C, Re &gt; 100,000, D &gt; 50 mm. Not applicable to gases, oils or viscous fluids.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══ MOBILE BOTTOM TABS ══ -->
<nav class="mob-tabs" id="mobTabs">
  <div class="mob-tabs-inner">
    <button class="mtab active" data-tab="calculator">
      <svg class="mtab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
      Calc
    </button>
    <button class="mtab" data-tab="method">
      <svg class="mtab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      Method
    </button>
    <button class="mtab" data-tab="kfactors">
      <svg class="mtab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
      K-Factors
    </button>
    <button class="mtab" data-tab="hazen">
      <svg class="mtab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
      H-W
    </button>
    <button class="mtab" data-tab="study">
      <svg class="mtab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
      Study
    </button>
  </div>
</nav>
<style>
/* STUDY GUIDE + SOCIAL SHARE FOOTER */
.sg{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:26px 30px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,.07);}
.sg h3{font-size:1.06rem;font-weight:700;color:#111827;margin:0 0 14px;padding-bottom:11px;border-bottom:1.5px solid #e5e7eb;display:flex;align-items:center;gap:9px;}
.sg h4{font-size:.94rem;font-weight:700;color:#4f46e5;margin:18px 0 7px;}
.sg p{font-size:.92rem;color:#374151;line-height:1.84;margin:0 0 11px;}
.sg p:last-child{margin:0;}
.sg ul,.sg ol{padding-left:19px;color:#374151;font-size:.91rem;line-height:1.88;margin:8px 0 12px;}
.sg li{margin-bottom:6px;}
.sg strong{color:#111827;font-weight:700;}
.sfb{background:#0f172a;border-radius:8px;padding:16px 20px;margin:13px 0;border-left:3px solid #4f46e5;}
.sfb .sfm{font-family:'JetBrains Mono',monospace;font-size:1.01rem;font-weight:600;color:#a5b4fc;line-height:1.62;margin-bottom:4px;}
.sfb .sfl{font-family:'JetBrains Mono',monospace;font-size:.68rem;color:#475569;letter-spacing:.3px;}
.sfb .sfw{margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);font-family:'JetBrains Mono',monospace;font-size:.77rem;color:#94a3b8;line-height:1.9;}
.sco{border-radius:8px;padding:12px 15px;margin:12px 0;font-size:.89rem;line-height:1.78;display:flex;gap:10px;align-items:flex-start;}
.sco-i{flex-shrink:0;font-size:1rem;margin-top:1px;}
.sco.info{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a5f;}
.sco.warn{background:#fffbeb;border:1px solid #fde68a;color:#713f12;}
.sco.good{background:#f0fdf4;border:1px solid #86efac;color:#14532d;}
.sco.danger{background:#fef2f2;border:1px solid #fca5a5;color:#7f1d1d;}
.stbl{width:100%;border-collapse:collapse;font-size:.87rem;margin:13px 0;}
.stbl thead tr{background:#0f172a;}
.stbl th{padding:9px 12px;text-align:left;font-family:'JetBrains Mono',monospace;font-size:.67rem;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:#a5b4fc;}
.stbl td{padding:9px 12px;border-bottom:1px solid #e5e7eb;color:#374151;vertical-align:top;line-height:1.5;}
.stbl tr:last-child td{border-bottom:none;}
.stbl tr:hover td{background:#f9fafb;}
.stbl .mono{font-family:'JetBrains Mono',monospace;color:#4f46e5;font-weight:600;font-size:.82rem;}
.stbl .bold{color:#111827;font-weight:600;}
.s2col{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:13px 0;}
@media(max-width:680px){.s2col{grid-template-columns:1fr;}}
.s2item{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:15px 17px;}
.s2item-t{font-family:'JetBrains Mono',monospace;font-size:.65rem;text-transform:uppercase;letter-spacing:1.2px;color:#4f46e5;margin-bottom:7px;font-weight:600;}
.s2item p{font-size:.88rem;color:#374151;line-height:1.68;margin:0;}
.sstep{display:grid;grid-template-columns:38px 1fr;gap:12px;margin-bottom:22px;}
.sstep-n{width:38px;height:38px;background:#0f172a;color:#a5b4fc;font-family:'JetBrains Mono',monospace;font-size:.9rem;font-weight:700;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sstep-b h4{font-size:.93rem;font-weight:700;color:#111827;margin:2px 0 5px;}
.sstep-b p{font-size:.89rem;color:#374151;line-height:1.74;margin:0 0 5px;}
.sstep-b ul{font-size:.88rem;color:#374151;line-height:1.78;padding-left:16px;margin:4px 0;}
.sfaq{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:7px;}
.sfaq-q{width:100%;text-align:left;background:#fff;border:none;padding:14px 18px;font-family:'Inter',sans-serif;font-size:.91rem;font-weight:600;color:#111827;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:9px;transition:background .13s;line-height:1.3;}
.sfaq-q:hover{background:#f9fafb;}
.sfaq-q.on{background:#eef2ff;color:#4f46e5;}
.sfaq-arr{font-family:'JetBrains Mono',monospace;font-size:.86rem;color:#4f46e5;transition:transform .22s;flex-shrink:0;}
.sfaq-q.on .sfaq-arr{transform:rotate(45deg);}
.sfaq-a{display:none;padding:0 18px 16px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:.9rem;color:#374151;line-height:1.82;}
.sfaq-a.on{display:block;animation:sgrise .2s ease;}
@keyframes sgrise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.sfaq-a p{margin:11px 0 0;}
.sfaq-a ul{padding-left:17px;margin:8px 0 0;}
.sfaq-a li{margin-bottom:6px;}
.sfaq-code{font-family:'JetBrains Mono',monospace;background:#0f172a;color:#a5b4fc;padding:9px 13px;border-radius:6px;display:block;margin:9px 0;font-size:.79rem;line-height:1.72;}
.shr{background:#1e293b;border-top:3px solid #4f46e5;padding:46px 26px 38px;font-family:'Inter',sans-serif;}
.shr-in{max-width:1060px;margin:0 auto;}
.shr-hd{display:flex;align-items:center;gap:13px;margin-bottom:24px;}
.shr-logo{width:44px;height:44px;background:linear-gradient(135deg,#4f46e5,#0891b2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;box-shadow:0 4px 14px rgba(79,70,229,.4);}
.shr-hd h3{font-size:1.18rem;font-weight:700;color:#f1f5f9;margin:0 0 3px;}
.shr-hd p{font-size:.82rem;color:#64748b;margin:0;}
.shr-snap-wrap{background:rgba(79,70,229,.1);border:1px solid rgba(79,70,229,.25);border-radius:9px;padding:13px 17px;margin-bottom:24px;display:flex;align-items:center;gap:13px;flex-wrap:wrap;}
.shr-snap-lbl{font-family:'JetBrains Mono',monospace;font-size:.62rem;text-transform:uppercase;letter-spacing:1.4px;color:#a5b4fc;margin-bottom:4px;}
.shr-snap-val{font-family:'JetBrains Mono',monospace;font-size:.85rem;font-weight:600;color:#cbd5e1;line-height:1.55;}
.shr-copy-res{flex-shrink:0;padding:8px 14px;background:transparent;border:1.5px solid rgba(79,70,229,.4);border-radius:7px;color:#a5b4fc;font-family:'JetBrains Mono',monospace;font-size:.7rem;font-weight:700;cursor:pointer;letter-spacing:.4px;transition:all .16s;display:flex;align-items:center;gap:5px;}
.shr-copy-res:hover{background:rgba(79,70,229,.18);border-color:#a5b4fc;}
.shr-lbl{font-family:'JetBrains Mono',monospace;font-size:.63rem;text-transform:uppercase;letter-spacing:2px;color:#334155;margin-bottom:12px;}
.shr-btns{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:30px;}
.shb{display:inline-flex;align-items:center;gap:7px;padding:11px 18px;border-radius:9px;font-family:'Inter',sans-serif;font-size:.86rem;font-weight:600;text-decoration:none;border:none;cursor:pointer;transition:all .18s;white-space:nowrap;}
.shb:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.32);}
.shb-wa{background:#25d366;color:#fff;}.shb-wa:hover{background:#1daf54;}
.shb-tw{background:#000;color:#fff;border:1px solid #222;}.shb-tw:hover{border-color:#aaa;}
.shb-li{background:#0a66c2;color:#fff;}.shb-li:hover{background:#0854a0;}
.shb-fb{background:#1877f2;color:#fff;}.shb-fb:hover{background:#1260cc;}
.shb-tg{background:#26a5e4;color:#fff;}.shb-tg:hover{background:#1d8fc7;}
.shb-em{background:#1e3a5f;color:#cbd5e1;border:1px solid rgba(255,255,255,.1);}.shb-em:hover{background:#263549;}
.shb-cp{background:#4f46e5;color:#fff;}.shb-cp:hover{background:#4338ca;}
.shr-div{border:none;border-top:1px solid rgba(255,255,255,.05);margin:0 0 18px;}
.shr-nav{display:flex;flex-wrap:wrap;align-items:center;gap:18px;}
.shr-nav a{font-size:.82rem;font-weight:600;color:#334155;text-decoration:none;transition:color .13s;}
.shr-nav a:hover{color:#a5b4fc;}
.shr-copy{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:.71rem;color:#1e3a5f;}
@media(max-width:580px){.shr-btns{gap:7px;}.shb{padding:9px 11px;font-size:.8rem;}.shr-nav{gap:11px;}.shr-copy{margin-left:0;width:100%;}.shr-copy-res{width:100%;justify-content:center;}.sg{padding:18px 14px;}}
</style><div class="section" id="tab-study">
  <div class="hero">
    <h1>&#128218; Study Guide</h1>
    <p>Fluid mechanics fundamentals and pipe flow engineering — for students and practicing engineers</p>
    <div class="hero-badges">
      <span class="hbadge">Bernoulli Equation</span><span class="hbadge">Reynolds Number</span>
      <span class="hbadge">Darcy-Weisbach</span><span class="hbadge">Churchill Equation</span>
      <span class="hbadge">Moody Chart</span><span class="hbadge">Minor Losses (K-Factor)</span>
      <span class="hbadge">Pump Sizing</span><span class="hbadge">NPSH</span><span class="hbadge">Water Hammer</span>
    </div>
  </div>
  <div class="page-body">

    <div class="sg">
      <h3>&#128202; What Is Pressure Drop — and Why Engineers Must Get It Right</h3>
      <p>When fluid flows through a pipe, it continuously loses mechanical energy to friction between the fluid and pipe wall and to turbulent mixing within the flow. This energy dissipation appears as a fall in static pressure along the pipe — that fall is <strong>pressure drop (&#916;P)</strong>. It is the single most important parameter in the hydraulic design of any piped system.</p>
      <p>Three consequences of getting &#916;P wrong:</p>
      <ul>
        <li><strong>Undersized pump:</strong> cannot overcome actual system resistance — flow target never reached, equipment starved.</li>
        <li><strong>Undersized pipe:</strong> high &#916;P, excessive pump energy, erosion, noise, and cavitation risk on suction side.</li>
        <li><strong>Oversized pipe:</strong> wasteful capital cost; very low velocity causes sedimentation, microbial growth, poor flushing.</li>
      </ul>
      <div class="s2col">
        <div class="s2item">
          <div class="s2item-t">Two Components of Total &#916;P</div>
          <p><strong>Major losses (friction):</strong> viscous friction along straight pipe. Governed by Darcy-Weisbach. Proportional to L/D and V&#178;.<br><br>
          <strong>Minor losses (fittings):</strong> from valves, elbows, tees, entries, exits. Can be 30&#8211;80% of total &#916;P in fitting-dense systems.</p>
        </div>
        <div class="s2item">
          <div class="s2item-t">Pressure Unit Quick Reference</div>
          <p>1 bar = 100,000 Pa = 100 kPa<br>1 psi = 6,895 Pa = 0.0689 bar<br>1 atm = 101,325 Pa = 1.013 bar<br>1 m H&#8322;O (water, 20&#176;C) = 9,810 Pa<br><br>&#916;P [Pa] = &#961; [kg/m&#179;] &#215; 9.81 &#215; h [m]<br>For water: 10 m head &#8776; 0.981 bar &#8776; 14.2 psi</p>
        </div>
      </div>
    </div>

    <div class="sg">
      <h3>&#9889; Extended Bernoulli Equation</h3>
      <p>The extended Bernoulli equation adds a head-loss term h<sub>L</sub> to the ideal inviscid form, accounting for all energy dissipated by friction and turbulence:</p>
      <div class="sfb">
        <div class="sfm">P&#8321;/(&#961;g) + V&#8321;&#178;/(2g) + z&#8321;  =  P&#8322;/(&#961;g) + V&#8322;&#178;/(2g) + z&#8322;  +  h<sub>L</sub></div>
        <div class="sfl">Extended Bernoulli &#8212; steady, incompressible, single streamline [all terms in metres of fluid]</div>
        <div class="sfw">P = static pressure [Pa] &#160; &#961; = density [kg/m&#179;] &#160; V = mean velocity [m/s]<br>z = elevation above datum [m] &#160; g = 9.81 m/s&#178;<br>h<sub>L</sub> = total head loss [m] = &#916;P<sub>total</sub>/(&#961;g)</div>
      </div>
      <div class="sco info"><span class="sco-i">&#8505;&#65039;</span><div><strong>Velocity head is the master variable:</strong> &#916;P = K &#215; (&#961;V&#178;/2). Doubling velocity quadruples ALL pressure losses simultaneously &#8212; friction and fittings alike. This is why pipe diameter selection so dramatically affects pump energy. Going up one pipe size (e.g. 50 mm&#8594;65 mm) reduces velocity by 41% and friction &#916;P by ~62%.</div></div>
    </div>

    <div class="sg">
      <h3>&#127754; Reynolds Number &#8212; Laminar vs Turbulent Flow</h3>
      <div class="sfb">
        <div class="sfm">Re  =  &#961; V D / &#956;  =  V D / &#957;</div>
        <div class="sfl">Reynolds number (dimensionless) &#8212; ratio of inertial to viscous forces</div>
        <div class="sfw">&#961; = density [kg/m&#179;] &#160; V = velocity [m/s] &#160; D = internal diameter [m]<br>&#956; = dynamic viscosity [Pa&#183;s] &#160; (1 cP = 0.001 Pa&#183;s &#8592; always convert!)<br>&#957; = kinematic viscosity = &#956;/&#961; [m&#178;/s]</div>
      </div>
      <table class="stbl">
        <thead><tr><th>Re Range</th><th>Regime</th><th>Friction Factor Method</th><th>Engineering Meaning</th></tr></thead>
        <tbody>
          <tr><td class="mono">&lt; 2,300</td><td class="bold">Laminar</td><td class="mono">f = 64/Re (exact)</td><td>Parabolic velocity profile. &#916;P &#8733; V (linear). Typical in viscous oils, small tubes, low flow.</td></tr>
          <tr><td class="mono">2,300&#8211;4,000</td><td class="bold">Transitional</td><td>Churchill (1977) blended</td><td>Unstable. Avoid steady design here. This calculator uses the Churchill equation &#8212; no discontinuity.</td></tr>
          <tr><td class="mono">4,000&#8211;100,000</td><td class="bold">Turbulent</td><td>Colebrook-White</td><td>Most process piping. Both Re and roughness &#949;/D determine f.</td></tr>
          <tr><td class="mono">&gt; 100,000</td><td class="bold">Fully Turbulent</td><td>f = f(&#949;/D) only</td><td>f independent of Re. Roughness completely dominates. Large mains, gas transmission.</td></tr>
        </tbody>
      </table>
      <div class="sco warn"><span class="sco-i">&#9888;&#65039;</span><div><strong>Viscosity changes everything:</strong> SAE-30 oil at 40&#176;C (&#957; &#8776; 100 cSt) in 50 mm pipe at 1 m/s &#8594; Re = 500 (laminar), f = 0.128. Water same pipe/velocity &#8594; Re = 50,000 (turbulent), f = 0.021. Oil needs 6&#215; more pump power. Never assume turbulent flow for viscous fluids.</div></div>
    </div>

    <div class="sg">
      <h3>&#128208; Darcy-Weisbach + Churchill + Colebrook-White</h3>
      <div class="sfb">
        <div class="sfm">&#916;P<sub>friction</sub>  =  f &#183; (L/D) &#183; (&#961;V&#178;/2)    [Pa]</div>
        <div class="sfl">Darcy-Weisbach &#8212; valid for all incompressible, fully-developed, steady pipe flow</div>
        <div class="sfw">f = Darcy friction factor (&#8211;) &#160; L = length [m] &#160; D = internal diameter [m]<br>&#961; = density [kg/m&#179;] &#160; V = mean velocity [m/s]<br><br>&#9888; Code must use &#961;V&#178;/2 (dynamic pressure), NOT &#961;V&#178; &#8212; common bug that doubles the result.</div>
      </div>
      <div class="sfb">
        <div class="sfm">1/&#8730;f  =  &#8722;2 log&#8321;&#8320;( &#949;/(3.7D) + 2.51/(Re&#183;&#8730;f) )</div>
        <div class="sfl">Colebrook-White (1939) &#8212; implicit; solved iteratively. Basis of the Moody Chart.</div>
      </div>
      <div class="sfb">
        <div class="sfm">f = 8&#183;[(8/Re)&#185;&#178; + 1/(A+B)^1.5]^(1/12)</div>
        <div class="sfl">Churchill (1977) &#8212; spans ALL regimes including transitional. Used in this calculator.</div>
        <div class="sfw">A = [2.457&#183;ln(1/((7/Re)^0.9 + 0.27&#949;/D))]&#185;&#178;&#160;&#160;&#160;B = (37530/Re)&#185;&#178;</div>
      </div>
      <div class="sco info"><span class="sco-i">&#8505;&#65039;</span><div><strong>Practical values for water in steel pipe:</strong> At 1&#8211;3 m/s in 50&#8211;200 mm commercial steel, Re = 50,000&#8211;600,000 and f &#8776; 0.016&#8211;0.022. Rule of thumb: 100 mm pipe at 2 m/s, f &#8776; 0.019 &#8594; friction loss &#8776; 380 Pa/m = 0.38 mbar/m.</div></div>
    </div>

    <div class="sg">
      <h3>&#128297; Minor Losses &#8212; K-Factor Method (Crane TP-410)</h3>
      <div class="sfb">
        <div class="sfm">&#916;P<sub>minor</sub>  =  &#931;K &#183; (&#961;V&#178;/2)    [Pa]</div>
        <div class="sfl">Crane Technical Paper 410 / Idelchik "Handbook of Hydraulic Resistance"</div>
        <div class="sfw">K = resistance coefficient &#160; V = mean pipe velocity [m/s]<br>L<sub>eq</sub> = K&#183;D/f [m] &#8212; equivalent pipe length (turbulent fully-developed flow only)</div>
      </div>
      <table class="stbl">
        <thead><tr><th>Fitting</th><th>K (typical)</th><th>Physics</th></tr></thead>
        <tbody>
          <tr><td class="bold">Sharp pipe entrance</td><td class="mono">0.5</td><td>Vena contracta (&#8776;62% of pipe area) then re-expansion. Turbulent mixing destroys KE.</td></tr>
          <tr><td class="bold">Pipe exit to tank</td><td class="mono">1.0</td><td>All velocity head irreversibly lost. K_exit = 1.0 exactly by definition.</td></tr>
          <tr><td class="bold">90&#176; standard elbow</td><td class="mono">0.9</td><td>Separation zone on inner wall. Long-radius (r/D=1.5): K &#8776; 0.3.</td></tr>
          <tr><td class="bold">Globe valve (full open)</td><td class="mono">6&#8211;12</td><td>Two 90&#176; turns inside valve body. Designed for throttling, not low-loss isolation.</td></tr>
          <tr><td class="bold">Gate valve (full open)</td><td class="mono">0.2</td><td>Full-bore when open. K rises steeply on closing: &#8776;5.6 at 50% open.</td></tr>
          <tr><td class="bold">Ball valve (full open)</td><td class="mono">0.05&#8211;0.1</td><td>Smooth bore. Preferred for low-loss on/off liquid service.</td></tr>
        </tbody>
      </table>
      <div class="sco warn"><span class="sco-i">&#9888;&#65039;</span><div><strong>K-factor uncertainty &#177;20&#8211;30%.</strong> Values are averages &#8212; real values vary by manufacturer, pipe schedule, and close-coupled installation. For HAZOP-reviewed designs, request vendor test data.</div></div>
    </div>

    <div class="sg">
      <h3>&#128295; Pipe Roughness, Materials and Schedule</h3>
      <table class="stbl">
        <thead><tr><th>Material</th><th>&#949; (mm)</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="bold">Commercial/welded steel</td><td class="mono">0.046</td><td>Standard process plant. Roughness increases with corrosion &#8212; use fouling allowance.</td></tr>
          <tr><td class="bold">Stainless steel (drawn)</td><td class="mono">0.015</td><td>Cold-drawn surface. Hygienic, corrosive, cryogenic service.</td></tr>
          <tr><td class="bold">PVC / smooth plastic</td><td class="mono">0.0015</td><td>Hydraulically very smooth. Not for high temperature.</td></tr>
          <tr><td class="bold">HDPE</td><td class="mono">0.007</td><td>Slightly rougher than PVC. Buried water and gas distribution.</td></tr>
          <tr><td class="bold">New cast iron</td><td class="mono">0.26</td><td>Old tuberculated cast iron: &#949; = 1&#8211;3 mm &#8212; massively increases friction.</td></tr>
          <tr><td class="bold">Galvanised steel</td><td class="mono">0.15</td><td>Zinc coating adds roughness vs bare steel. HVAC, potable water.</td></tr>
          <tr><td class="bold">Concrete (pre-cast)</td><td class="mono">0.3&#8211;1.0</td><td>Wide range by finish and age.</td></tr>
          <tr><td class="bold">Fiberglass (GRP)</td><td class="mono">0.005&#8211;0.01</td><td>Very smooth, non-corroding, chemical-resistant.</td></tr>
        </tbody>
      </table>
      <div class="sco danger"><span class="sco-i">&#128308;</span><div><strong>Always use actual ID, never nominal size.</strong> 4&#8243; Sch 40: ID = 102.3 mm. 4&#8243; Sch 80: ID = 97.2 mm &#8212; a 5% reduction. Since &#916;P &#8733; 1/D&#8309;, a 5% diameter error causes a 28% &#916;P error. Use the schedule database in this calculator.</div></div>
    </div>

    <div class="sg">
      <h3>&#128167; Recommended Pipe Velocities (Industry Practice)</h3>
      <table class="stbl">
        <thead><tr><th>Service</th><th>Typical Range</th><th>Max</th><th>Limiting Factor</th></tr></thead>
        <tbody>
          <tr><td class="bold">Water &#8212; pump suction</td><td class="mono">0.5&#8211;1.5 m/s</td><td class="mono">1.5 m/s</td><td>High V &#8594; low static pressure &#8594; NPSH deficit &#8594; cavitation</td></tr>
          <tr><td class="bold">Water &#8212; pump discharge</td><td class="mono">1.5&#8211;3.0 m/s</td><td class="mono">3.5 m/s</td><td>Erosion and noise above 3.5 m/s</td></tr>
          <tr><td class="bold">Hydrocarbon liquid</td><td class="mono">1.0&#8211;2.5 m/s</td><td class="mono">3.0 m/s</td><td>Static electricity risk; erosion (API 14E)</td></tr>
          <tr><td class="bold">Slurry (erosive)</td><td class="mono">1.5&#8211;3.0 m/s</td><td class="mono">3.0 m/s</td><td>Min for suspension; max for erosion limit</td></tr>
          <tr><td class="bold">Steam (low pressure)</td><td class="mono">15&#8211;35 m/s</td><td class="mono">40 m/s</td><td>Condensate droplet erosion; noise</td></tr>
          <tr><td class="bold">Steam (high pressure)</td><td class="mono">25&#8211;50 m/s</td><td class="mono">60 m/s</td><td>Dry superheated OK; erosion still limits</td></tr>
          <tr><td class="bold">Air/gas (low P)</td><td class="mono">5&#8211;15 m/s</td><td class="mono">20 m/s</td><td>Noise; check Mach &lt; 0.3</td></tr>
          <tr><td class="bold">Gas (high P)</td><td class="mono">10&#8211;20 m/s</td><td class="mono">30 m/s</td><td>API 14E erosional velocity: V_e = C/&#8730;&#961;, C=100&#8211;125</td></tr>
        </tbody>
      </table>
      <div class="sco good"><span class="sco-i">&#9989;</span><div><strong>Economic velocity for water:</strong> Optimising capital cost (pipe) vs operating cost (pump energy) gives 1.5&#8211;2.5 m/s in most process water systems. Below 1 m/s the pipe is almost certainly oversized. Above 3 m/s, running costs dominate life-cycle cost.</div></div>
    </div>

    <div class="sg">
      <h3>&#9889; Pump Sizing &#8212; From System &#916;P to Motor Power</h3>
      <div class="sfb">
        <div class="sfm">H<sub>system</sub>  =  (&#916;P<sub>friction</sub> + &#916;P<sub>fittings</sub> + &#916;P<sub>elevation</sub>) / (&#961;g)  [m]</div>
        <div class="sfl">System head &#8212; both forms are equivalent: P = Q&#183;&#916;P [W]  or  P = &#961;gQH [W]  (since &#916;P = &#961;gH)</div>
      </div>
      <div class="sfb">
        <div class="sfm">P<sub>shaft</sub> = Q&#183;&#916;P<sub>total</sub> / &#951;<sub>pump</sub>&#160;&#160;&#160;P<sub>motor</sub> = P<sub>shaft</sub> / &#951;<sub>motor</sub></div>
        <div class="sfw">&#951;<sub>pump</sub> = 0.65&#8211;0.85 (centrifugal, near BEP)&#160;&#160;&#160;&#951;<sub>motor</sub> = 0.88&#8211;0.96<br>VSD savings: P &#8733; N&#179; &#8594; halving speed &#8594; 12.5% power demand</div>
      </div>
      <div class="sfb">
        <div class="sfm">NPSH<sub>A</sub>  =  (P<sub>suct</sub> &#8722; P<sub>vap</sub>)/(&#961;g)  +  Z<sub>s</sub>  &#8722;  H<sub>fs</sub>  &#8722;  V&#178;/(2g)</div>
        <div class="sfl">NPSH available [m] &#8212; velocity head term included per Hydraulic Institute standard</div>
        <div class="sfw">P<sub>suct</sub> = abs. pressure at suction source [Pa]&#160;&#160;P<sub>vap</sub> = vapour pressure at operating T [Pa]<br>Z<sub>s</sub> = static elevation [m] (negative if pump above liquid)&#160;&#160;H<sub>fs</sub> = suction friction head [m]<br>V&#178;/(2g) = velocity head at pump suction flange &#8212; significant above V = 2 m/s<br>Required margin: NPSH<sub>A</sub> &#8805; NPSH<sub>R</sub> + 0.5 m (API 610 requires more for hydrocarbons)</div>
      </div>
    </div>

    <div class="sg">
      <h3>&#129518; Step-by-Step Calculator Guide</h3>
      <div class="sstep"><div class="sstep-n">1</div><div class="sstep-b"><h4>Select Fluid and Enter Operating T &amp; P</h4><p>Search the fluid library. Once selected, a panel appears for <strong>temperature</strong> and <strong>operating pressure</strong>. Density (&#961;) and viscosity (&#956;) auto-calculate using the Andrade correlation (liquids) or ideal gas + Sutherland law (gases). Review the live strip. You can override any value manually.</p></div></div>
      <div class="sstep"><div class="sstep-n">2</div><div class="sstep-b"><h4>Enter Pipe Geometry &#8212; Use Actual Internal Diameter</h4><p>Select nominal bore and schedule &#8212; actual ID fills automatically. <strong>Never use nominal bore as ID.</strong> Since &#916;P &#8733; 1/D&#8309;, a 5% diameter error causes a 28% &#916;P error.</p></div></div>
      <div class="sstep"><div class="sstep-n">3</div><div class="sstep-b"><h4>Enter Flow Rate and Check Velocity</h4><p>After calculating, check that velocity is within the acceptable range for your service. If too high, increase pipe diameter and re-run.</p></div></div>
      <div class="sstep"><div class="sstep-n">4</div><div class="sstep-b"><h4>Add All Fittings &#8212; Include Entry and Exit</h4><p>Add every elbow, valve, tee, reducer. <strong>Don't omit pipe entrance (K=0.5) and exit (K=1.0)</strong> &#8212; frequently forgotten, dominant losses in short-pipe systems.</p></div></div>
      <div class="sstep"><div class="sstep-n">5</div><div class="sstep-b"><h4>Enter Elevation Change and Review Warnings</h4><p>&#916;z = outlet elevation minus inlet. Positive = uphill. Check all alerts: high velocity &#8594; larger pipe; transitional Re &#8594; Churchill used, &#177;20% uncertainty; gas detected &#8594; verify &#916;P/P&#8321; &lt; 10%; vapour pressure warning &#8594; flash risk.</p></div></div>
    </div>

    <div class="sg">
      <h3>&#10067; Frequently Asked Questions</h3>
      <div class="sfaq"><button class="sfaq-q" onclick="sgFaq(this)">Why does &#916;P increase so steeply when I increase flow rate?<span class="sfaq-arr">+</span></button><div class="sfaq-a"><p>In turbulent flow, &#916;P scales with approximately V&#178;, and velocity is proportional to flow rate. Doubling flow rate doubles velocity and quadruples pressure drop.</p><div class="sfaq-code">Turbulent:  &#916;P &#8733; Q^1.75 to Q^2.0   (f weakly depends on Re)
Laminar:    &#916;P &#8733; Q^1.0             (Hagen-Poiseuille: strictly linear)
Example: 2x flow rate &#8594; approx. 4x pump power demand</div><p>Going from 50 mm to 65 mm pipe (30% larger) reduces velocity by 41% &#8594; friction &#916;P drops ~62%. Extra pipe cost pays back quickly in energy savings for continuous-flow systems.</p></div></div>

      <div class="sfaq"><button class="sfaq-q" onclick="sgFaq(this)">Why is there a velocity head term in the NPSH formula?<span class="sfaq-arr">+</span></button><div class="sfaq-a"><p>NPSH available represents the <em>total</em> energy at the pump suction flange above vapour pressure. Total energy per unit weight = pressure head + velocity head. Omitting V&#178;/(2g) overestimates NPSH<sub>A</sub> and risks unexpected cavitation in high-velocity suction lines.</p><div class="sfaq-code">V = 2.0 m/s:  V&#178;/(2g) = 0.20 m  &#8594; small but real
V = 3.5 m/s:  V&#178;/(2g) = 0.62 m  &#8594; significant
V = 5.0 m/s:  V&#178;/(2g) = 1.27 m  &#8594; must always include</div></div></div>

      <div class="sfaq"><button class="sfaq-q" onclick="sgFaq(this)">Can I use Darcy-Weisbach for compressible gas flow?<span class="sfaq-arr">+</span></button><div class="sfaq-a"><p>Yes &#8212; with caveats. The incompressible model is valid for gases when <strong>&#916;P/P&#8321; &lt; 10%</strong>. Beyond this, gas density changes significantly along the pipe.</p><ul><li><strong>&#916;P/P&#8321; &lt; 10%:</strong> Incompressible Darcy-Weisbach acceptable. Use average density.</li><li><strong>10&#8211;20%:</strong> Use isothermal compressible flow equations.</li><li><strong>&gt;20%:</strong> Use Weymouth, Panhandle, or Fanno flow equations.</li></ul><p>Also check Mach number: if V &gt; 0.3 &#215; speed of sound (&#8776;100 m/s in air at 1 bar), compressibility matters regardless of &#916;P/P&#8321;.</p></div></div>

      <div class="sfaq"><button class="sfaq-q" onclick="sgFaq(this)">What causes water hammer and how does velocity relate?<span class="sfaq-arr">+</span></button><div class="sfaq-a"><p><strong>Water hammer</strong> is the pressure surge when flow is suddenly stopped &#8212; most commonly by rapid valve closure. The Joukowski equation gives the peak surge:</p><div class="sfaq-code">&#916;P<sub>surge</sub> = &#961; &#183; a &#183; &#916;V    [Pa]
a = pressure wave speed &#8776; 900&#8211;1,400 m/s (water in steel pipe)
Example: V = 2 m/s, &#961; = 1000, a = 1200 m/s
&#916;P = 1000 &#215; 1200 &#215; 2 = 2,400,000 Pa = 24 bar &#8594; potentially catastrophic!</div><p>Mitigation: slow-closing valves (closure time &gt; 2L/a), surge vessels, PRVs. Higher velocity &#8594; directly proportional larger surge &#8594; strongest argument for keeping liquid velocities below 3 m/s.</p></div></div>

      <div class="sfaq"><button class="sfaq-q" onclick="sgFaq(this)">Darcy vs Fanning friction factor &#8212; which does this calculator use?<span class="sfaq-arr">+</span></button><div class="sfaq-a"><p>This calculator uses the <strong>Darcy (Moody) friction factor throughout</strong>:</p><div class="sfaq-code">f<sub>Darcy</sub> = 4 &#215; f<sub>Fanning</sub>&#160;&#160;(laminar: f<sub>D</sub>=64/Re vs f<sub>F</sub>=16/Re)
Darcy-Weisbach: &#916;P = f<sub>D</sub> &#215; (L/D) &#215; (&#961;V&#178;/2) &#8592; this calculator
Red flag: if a textbook gives f &#8776; 0.005 for turbulent water in steel &#8594; it is Fanning
           (f<sub>Darcy</sub> would be &#8776; 0.020 for same conditions)</div><p>Mixing the two definitions doubles or halves your calculated &#916;P.</p></div></div>

      <div class="sfaq"><button class="sfaq-q" onclick="sgFaq(this)">When should I use Hazen-Williams vs Darcy-Weisbach?<span class="sfaq-arr">+</span></button><div class="sfaq-a"><p>Hazen-Williams (1906) is empirically calibrated for water in municipal distribution networks only.</p><ul><li><strong>Use H-W when:</strong> water distribution, irrigation, fire suppression (NFPA 13 mandates H-W for sprinkler hydraulics). C-factor data available from field tests. Working with utility standards.</li><li><strong>Use Darcy-Weisbach when:</strong> any fluid other than water; T outside 5&#8211;30&#176;C; Re &lt; 100,000; pipe &lt; 50 mm; viscous fluid, gas, or steam; rigorous engineering analysis required.</li></ul><p>H-W gives large errors outside its calibration range. For all process engineering, Darcy-Weisbach with Colebrook-White is the correct method.</p></div></div>
    </div>

    <div class="sg">
      <h3>&#128214; Standards and References</h3>
      <div class="s2col">
        <div class="s2item"><div class="s2item-t">Piping Design Standards</div><p><strong>ASME B31.3</strong> &#8212; Process Piping (chemical plants, refineries)<br><strong>ASME B31.1</strong> &#8212; Power Piping (boilers, steam)<br><strong>API 14E</strong> &#8212; Production Piping (erosional velocity)<br><strong>API 610</strong> &#8212; Centrifugal Pumps (NPSH margins)<br><strong>ISO 4126</strong> &#8212; Safety Devices / Pressure Relief (not piping hydraulics)</p></div>
        <div class="s2item"><div class="s2item-t">Hydraulic Calculation References</div><p><strong>Crane TP-410</strong> &#8212; Flow of Fluids Through Valves, Fittings and Pipe (K-factors)<br><strong>Idelchik</strong> &#8212; Handbook of Hydraulic Resistance<br><strong>NFPA 13</strong> &#8212; Fire Sprinkler Systems (H-W C = 120&#8211;100)<br><strong>Hydraulic Institute</strong> &#8212; Pump Standards, NPSH testing</p></div>
      </div>
    </div>

  </div>
</div>

<div class="shr">
  <div class="shr-in">
    <div class="shr-hd">
      <div class="shr-logo">&#916;P</div>
      <div><h3>Share This Calculator</h3><p>Send the tool or your current results to colleagues</p></div>
    </div>
    <div class="shr-snap-wrap">
      <div style="flex:1;min-width:0;">
        <div class="shr-snap-lbl">Live Results Snapshot</div>
        <div class="shr-snap-val" id="shr-snap">Run the calculator above to generate a shareable result summary</div>
      </div>
      <button class="shr-copy-res" onclick="shrCopyResult()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy Result</button>
    </div>
    <div class="shr-lbl">Share via</div>
    <div class="shr-btns">
      <button class="shb shb-wa" onclick="shrOpen('whatsapp')"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>WhatsApp</button>
      <button class="shb shb-tw" onclick="shrOpen('twitter')"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.849L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>X / Twitter</button>
      <button class="shb shb-li" onclick="shrOpen('linkedin')"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>LinkedIn</button>
      <button class="shb shb-fb" onclick="shrOpen('facebook')"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>Facebook</button>
      <button class="shb shb-tg" onclick="shrOpen('telegram')"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.012 9.49c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.12 14.807l-2.95-.924c-.642-.204-.657-.641.136-.953l11.527-4.448c.535-.197 1.004.13.729.766z"/></svg>Telegram</button>
      <button class="shb shb-em" onclick="shrOpen('email')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>Email</button>
      <button class="shb shb-cp" id="shr-cp-btn" onclick="shrOpen('copy')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy Link</button>
    </div>
    <hr class="shr-div">
    <div class="shr-nav">
      <a href="https://multicalci.com/">&#127968; All Calculators</a>
      <a href="https://multicalci.com/control-valve-sizing/">Control Valve</a>
      <a href="https://multicalci.com/cooling-tower-performance/">Cooling Tower</a>
      <a href="https://multicalci.com/orifice-flow-calculator/">Orifice Flow</a>
      <a href="https://multicalci.com/about.html">About</a>
      <span class="shr-copy">&#169; 2026 multicalci.com</span>
    </div>
  </div>
</div>


<script>
/* Fitting catalogue — labels only for UI display (K-values calculated server-side) */
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
/* Lightweight fluid list for UI only — real properties fetched from API */
const FLUID_UI_LIST = [
  {id:'water',name:'Water',cat:'Water & Aqueous',isGas:false},
  {id:'seawater',name:'Seawater (3.5% NaCl)',cat:'Water & Aqueous',isGas:false},
  {id:'brine10',name:'Brine 10% NaCl',cat:'Water & Aqueous',isGas:false},
  {id:'brine20',name:'Brine 20% NaCl',cat:'Water & Aqueous',isGas:false},
  {id:'brine25',name:'Brine 25% NaCl',cat:'Water & Aqueous',isGas:false},
  {id:'cacl2_20',name:'CaCl₂ Solution 20%',cat:'Water & Aqueous',isGas:false},
  {id:'cacl2_30',name:'CaCl₂ Solution 30%',cat:'Water & Aqueous',isGas:false},
  {id:'eg30',name:'Ethylene Glycol 30%',cat:'Glycols & Coolants',isGas:false},
  {id:'eg50',name:'Ethylene Glycol 50%',cat:'Glycols & Coolants',isGas:false},
  {id:'eg70',name:'Ethylene Glycol 70%',cat:'Glycols & Coolants',isGas:false},
  {id:'pg30',name:'Propylene Glycol 30%',cat:'Glycols & Coolants',isGas:false},
  {id:'pg50',name:'Propylene Glycol 50%',cat:'Glycols & Coolants',isGas:false},
  {id:'deg',name:'Diethylene Glycol (DEG)',cat:'Glycols & Coolants',isGas:false},
  {id:'teg',name:'Triethylene Glycol (TEG)',cat:'Glycols & Coolants',isGas:false},
  {id:'mea30',name:'MEA 30%',cat:'Glycols & Coolants',isGas:false},
  {id:'dea35',name:'DEA 35%',cat:'Glycols & Coolants',isGas:false},
  {id:'gasoline',name:'Gasoline (Petrol)',cat:'Petroleum & Fuels',isGas:false},
  {id:'diesel',name:'Diesel Fuel',cat:'Petroleum & Fuels',isGas:false},
  {id:'kerosene',name:'Kerosene / Jet-A',cat:'Petroleum & Fuels',isGas:false},
  {id:'jeta1',name:'Jet A-1 Fuel',cat:'Petroleum & Fuels',isGas:false},
  {id:'hfo',name:'Heavy Fuel Oil (HFO 380)',cat:'Petroleum & Fuels',isGas:false},
  {id:'crude20',name:'Crude Oil API 20',cat:'Petroleum & Fuels',isGas:false},
  {id:'crude30',name:'Crude Oil API 30',cat:'Petroleum & Fuels',isGas:false},
  {id:'crude40',name:'Crude Oil API 40',cat:'Petroleum & Fuels',isGas:false},
  {id:'crude50',name:'Crude Oil API 50',cat:'Petroleum & Fuels',isGas:false},
  {id:'naphtha',name:'Naphtha (light)',cat:'Petroleum & Fuels',isGas:false},
  {id:'methanol',name:'Methanol',cat:'Alcohols',isGas:false},
  {id:'ethanol',name:'Ethanol (96%)',cat:'Alcohols',isGas:false},
  {id:'ipa',name:'Isopropanol (IPA)',cat:'Alcohols',isGas:false},
  {id:'glycerol',name:'Glycerol (100%)',cat:'Alcohols',isGas:false},
  {id:'benzene',name:'Benzene',cat:'Aromatics',isGas:false},
  {id:'toluene',name:'Toluene',cat:'Aromatics',isGas:false},
  {id:'xylene',name:'Xylene (mixed)',cat:'Aromatics',isGas:false},
  {id:'acetone',name:'Acetone',cat:'Ketones & Esters',isGas:false},
  {id:'mek',name:'MEK',cat:'Ketones & Esters',isGas:false},
  {id:'h2so4_98',name:'Sulfuric Acid 98%',cat:'Acids & Bases',isGas:false},
  {id:'h2so4_50',name:'Sulfuric Acid 50%',cat:'Acids & Bases',isGas:false},
  {id:'hcl30',name:'Hydrochloric Acid 30%',cat:'Acids & Bases',isGas:false},
  {id:'naoh_50',name:'NaOH 50%',cat:'Acids & Bases',isGas:false},
  {id:'naoh_30',name:'NaOH 30%',cat:'Acids & Bases',isGas:false},
  {id:'air',name:'Air (dry)',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'nitrogen',name:'Nitrogen (N₂)',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'oxygen',name:'Oxygen (O₂)',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'methane',name:'Methane (CH₄)',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'hydrogen',name:'Hydrogen (H₂)',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'naturalgas',name:'Natural Gas',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'steam',name:'Steam (saturated)',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'co2_gas',name:'CO₂ (gas)',cat:'Gases (⚠ Compressible)',isGas:true},
  {id:'propane',name:'Propane — auto phase',cat:'Dual-Phase (auto L/G)',isGas:'auto'},
  {id:'co2',name:'CO₂ — auto phase',cat:'Dual-Phase (auto L/G)',isGas:'auto'},
  {id:'water_steam',name:'Water/Steam — auto phase',cat:'Dual-Phase (auto L/G)',isGas:'auto'},
  {id:'dmf',name:'DMF',cat:'Chemical Process',isGas:false},
  {id:'dmso',name:'DMSO',cat:'Chemical Process',isGas:false},
  {id:'thf',name:'THF',cat:'Chemical Process',isGas:false},
  {id:'milk',name:'Milk (whole)',cat:'Food & Pharma',isGas:false},
  {id:'olive',name:'Olive Oil',cat:'Food & Pharma',isGas:false},
  {id:'honey',name:'Honey',cat:'Food & Pharma',isGas:false},
  {id:'mercury',name:'Mercury (liquid)',cat:'Special & Metals',isGas:false},
  {id:'slurry10',name:'Slurry (10% solids)',cat:'Special & Metals',isGas:false},
  {id:'slurry30',name:'Slurry (30% solids)',cat:'Special & Metals',isGas:false},
  {id:'drilling_mud',name:'Drilling Mud (12 ppg)',cat:'Special & Metals',isGas:false},
  {id:'lube46',name:'Lube Oil ISO VG 46',cat:'Lubricants & Hydraulic',isGas:false},
  {id:'hydr46',name:'Hydraulic Oil ISO 46',cat:'Lubricants & Hydraulic',isGas:false},
  {id:'lube68',name:'Lube Oil ISO VG 68',cat:'Lubricants & Hydraulic',isGas:false},
  {id:'hydr68',name:'Hydraulic Oil ISO 68',cat:'Lubricants & Hydraulic',isGas:false},
];
// Alias for legacy selectFluid() references
const FLUID_DB = FLUID_UI_LIST;
</script>
<style>
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
</style>
<script>
/* ══════════════════════════════════════════════════════════
   TAB SWITCHING — clean event delegation, no inline onclick
══════════════════════════════════════════════════════════ */
function switchTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab, .mtab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  document.querySelectorAll('[data-tab="' + id + '"]').forEach(b => b.classList.add('active'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ══════════════════════════════════════════════════════════
   UNIT TOGGLE
══════════════════════════════════════════════════════════ */
let unitMode = 'metric';
document.querySelectorAll('.upbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    unitMode = btn.dataset.unit;
    document.querySelectorAll('.upbtn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const m = unitMode === 'metric';
    document.getElementById('diameterUnit').textContent  = m ? 'mm'    : 'in';
    document.getElementById('lengthUnit').textContent    = m ? 'm'     : 'ft';
    document.getElementById('elevUnit').textContent      = m ? 'm'     : 'ft';
    document.getElementById('flowrateUnit').textContent  = m ? 'm³/h'  : 'GPM';
    document.getElementById('densityUnit').textContent   = m ? 'kg/m³' : 'lb/ft³';
    if (lastResults) renderResults(lastResults);
  });
});

/* ══════════════════════════════════════════════════════════
   RESET BUTTON
══════════════════════════════════════════════════════════ */
document.getElementById('btnReset').addEventListener('click', () => {
  if (!confirm('Reset all inputs and clear results?')) return;
  document.getElementById('calcForm').reset();
  document.getElementById('diameter').value = '100';
  document.getElementById('length').value = '50';
  document.getElementById('elevation').value = '0';
  document.getElementById('density').value = '998';
  document.getElementById('viscosity').value = '1.002';
  document.getElementById('vapPressure').value = '0.023';
  document.getElementById('flowrate').value = '50';
  document.getElementById('pumpEff').value = '75';
  document.getElementById('motorEff').value = '92';
  document.getElementById('foulingAllowance').value = '0';
  fittingsList = []; rowCounter = 0;
  addFittingById('elbow90', 4);
  addFittingById('elbow45', 2);
  addFittingById('teerun', 1);
  addFittingById('gate_open', 1);
  addFittingById('check_swing', 1);
  addFittingById('entrance', 1);
  clearFluidSelection();
  hideAlerts();
  document.getElementById('placeholder').style.display = '';
  document.getElementById('results').style.display = 'none';
  lastResults = null;
  document.getElementById('custom-eps-row').style.display = 'none';
});

/* ══════════════════════════════════════════════════════════
   PDF BUTTON
══════════════════════════════════════════════════════════ */
document.getElementById('btnPDF').addEventListener('click', () => generatePDF());
document.getElementById('btnCalc').addEventListener('click', () => calculate());

/* ══════════════════════════════════════════════════════════
   ALERTS — separate warn items, no concatenation bug
══════════════════════════════════════════════════════════ */
const _warnMessages = [];

function showAlert(type, msg) {
  if (type === 'warn') {
    _warnMessages.push(msg);
    const list = document.getElementById('alertWarnList');
    list.innerHTML = _warnMessages.map(m => `<li>${m}</li>`).join('');
    document.getElementById('alertWarn').classList.add('show');
  } else if (type === 'gas') {
    document.getElementById('alertGasText').textContent = msg;
    document.getElementById('alertGas').style.display = 'flex';
  } else {
    document.getElementById('alertErrText').textContent = msg;
    document.getElementById('alertErr').classList.add('show');
  }
}
function hideGasAlert() { document.getElementById('alertGas').style.display = 'none'; }
function hideAlerts() {
  document.getElementById('alertWarn').classList.remove('show');
  document.getElementById('alertErr').classList.remove('show');
  document.getElementById('alertWarnList').innerHTML = '';
  _warnMessages.length = 0;
}

/* ══════════════════════════════════════════════════════════
   HW C-FACTOR CUSTOM TOGGLE
══════════════════════════════════════════════════════════ */
document.getElementById('hw-C').addEventListener('change', function() {
  document.getElementById('hw-custom-row').style.display = this.value === 'custom' ? '' : 'none';
});
document.getElementById('btnCalcHW').addEventListener('click', () => calcHW());

/* ══════════════════════════════════════════════════════════
   MATERIAL CUSTOM ROUGHNESS TOGGLE
══════════════════════════════════════════════════════════ */
document.getElementById('material').addEventListener('change', function() {
  document.getElementById('custom-eps-row').style.display = this.value === 'custom' ? '' : 'none';
});

/* ══════════════════════════════════════════════════════════
   ENTER KEY ON FORM
══════════════════════════════════════════════════════════ */
document.getElementById('calcForm').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); calculate(); }
});

/* ══════════════════════════════════════════════════════════
   FLUID SEARCH UI
══════════════════════════════════════════════════════════ */
let _selectedFluid = null;

// ── Fluid Select (native select + filter) ──────────────────────────────
let _fluidSelectAllOptions = null; // cache

function filterFluidSelect(q) {
  const sel = document.getElementById('fluidSelect');
  if (!_fluidSelectAllOptions) {
    // Cache all options with their optgroup labels
    _fluidSelectAllOptions = [];
    Array.from(sel.options).forEach(opt => {
      if (opt.value) _fluidSelectAllOptions.push({opt, text: opt.text.toLowerCase(), grp: opt.parentElement.label || ''});
    });
  }
  const lq = q.toLowerCase().trim();
  // Remove and re-add optgroups with matching options only
  const sel2 = document.getElementById('fluidSelect');
  sel2.innerHTML = '<option value="">— Select a fluid —</option>';
  if (!lq) {
    // Restore all
    _fluidSelectAllOptions.forEach(({opt}) => {
      let grp = sel2.querySelector(`optgroup[label="${opt.parentElement ? opt.parentElement.label : ''}"]`);
      if (!grp) { grp = document.createElement('optgroup'); grp.label = opt.parentElement ? opt.parentElement.label : ''; sel2.appendChild(grp); }
      grp.appendChild(opt.cloneNode(true));
    });
  } else {
    const matches = _fluidSelectAllOptions.filter(({text, grp}) => text.includes(lq) || grp.toLowerCase().includes(lq));
    if (matches.length === 0) {
      const o = document.createElement('option'); o.disabled = true; o.text = 'No match found';
      sel2.appendChild(o);
    } else {
      const grpMap = {};
      matches.forEach(({opt}) => {
        const grpLabel = opt.parentElement ? opt.parentElement.label : 'Other';
        if (!grpMap[grpLabel]) { grpMap[grpLabel] = document.createElement('optgroup'); grpMap[grpLabel].label = grpLabel; sel2.appendChild(grpMap[grpLabel]); }
        grpMap[grpLabel].appendChild(opt.cloneNode(true));
      });
    }
  }
}

function onFluidSelectChange(id) {
  if (!id) return;
  selectFluid(id);
}

document.getElementById('btnClearFluid').addEventListener('click', clearFluidSelection);
document.getElementById('btnChangeFluid').addEventListener('click', function() {
  // Keep selected fluid data but re-open picker for user to change
  clearFluidSelection();
  // Focus the filter input after a tick
  setTimeout(() => {
    const fi = document.getElementById('fluidFilter');
    if (fi) fi.focus();
  }, 50);
});
document.getElementById('opTemp').addEventListener('input', autoCalcProps);
document.getElementById('opPres').addEventListener('input', autoCalcProps);

function selectFluid(id) {
  const f = FLUID_DB.find(x => x.id === id);
  if (!f) return;
  _selectedFluid = f;
  lastFluidKey = id;
  // Sync the select element
  const sel = document.getElementById('fluidSelect');
  if (sel) { Array.from(sel.options).forEach(o => { if (o.value === id) o.selected = true; }); }
  // Collapse picker — show only the selected name chip
  const wrap = document.querySelector('.fluid-select-wrap');
  if (wrap) wrap.classList.add('selected');
  const badge = document.getElementById('fluidSelectedBadge');
  badge.classList.add('show');
  const nameEl = document.getElementById('fluidBadgeName');
  if (nameEl) nameEl.textContent = f.name;
  document.getElementById('opCondRow').classList.add('show');
  autoCalcProps();
  if (f.isGas === 'auto') {
    // Phase will be determined dynamically in autoCalcProps — no static alert
  } else if (f.isGas) {
    showAlert('gas', '⚠ Compressible gas selected (' + f.name + '). Darcy-Weisbach assumes constant density — valid only if ΔP/P₁ < 10%.');
  } else {
    hideGasAlert();
  }
}

function clearFluidSelection() {
  _selectedFluid = null;
  lastFluidKey = '';
  const sel = document.getElementById('fluidSelect');
  if (sel) sel.value = '';
  const fi = document.getElementById('fluidFilter');
  if (fi) { fi.value = ''; filterFluidSelect(''); }
  // Re-expand the picker
  const wrap = document.querySelector('.fluid-select-wrap');
  if (wrap) wrap.classList.remove('selected');
  document.getElementById('fluidSelectedBadge').classList.remove('show');
  document.getElementById('opCondRow').classList.remove('show');
  const pw = document.getElementById('propWarn');
  if (pw) pw.textContent = '';
  const pp = document.getElementById('propPhase');
  if (pp) pp.textContent = '';
  hideGasAlert();
}


/* Legacy fillFluid kept for any residual calls */
function fillFluid() {
  const key = document.getElementById('fluidType') ? document.getElementById('fluidType').value : '';
  if (key) selectFluid(key);
}

/* ══════════════════════════════════════════════════════════
   FITTINGS SYSTEM
══════════════════════════════════════════════════════════ */
let fittingsList = [], rowCounter = 0, lastResults = null, lastFluidKey = '';

document.getElementById('btnAddFit').addEventListener('click', addFitting);

function addFitting() {
  const picker = document.getElementById('fitPicker');
  const parts  = picker.value.split('|');
  addFittingById(parts[0], 1, parseFloat(parts[1]));
}
function addFittingById(id, qty = 1, kOverride = null) {
  const cat = FITTING_CATALOGUE[id]; if (!cat) return;
  const k = kOverride !== null ? kOverride : cat.k;
  const rowId = ++rowCounter;
  fittingsList.push({ rowId, id, label: cat.label, qty, k, isCustom: id === 'custom' });
  renderFittingsTable();
}
function removeFitting(rowId) {
  fittingsList = fittingsList.filter(f => f.rowId !== rowId);
  renderFittingsTable();
}
function updateQty(rowId, val) {
  const f = fittingsList.find(x => x.rowId === rowId);
  if (f) { f.qty = Math.max(0, parseInt(val) || 0); updateKTotal(); }
}
function updateK(rowId, val) {
  const f = fittingsList.find(x => x.rowId === rowId);
  if (f) { f.k = parseFloat(val) || 0; f.isCustom = true; updateKTotal(); }
}
function renderFittingsTable() {
  const tbody = document.getElementById('fitRows');
  if (fittingsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text4);padding:13px;font-size:.79rem;">No fittings added yet.</td></tr>`;
    updateKTotal(); return;
  }
  tbody.innerHTML = fittingsList.map(f => {
    const ksub = (f.qty * f.k).toFixed(3);
    return `<tr>
      <td>
        <div class="fit-name">${f.label}</div>
        <div class="fit-sub">${f.isCustom ? 'Custom K' : 'K = ' + f.k}</div>
      </td>
      <td><input class="fit-qty" type="number" value="${f.qty}" min="0"
            onchange="updateQty(${f.rowId},this.value)" oninput="updateQty(${f.rowId},this.value)"></td>
      <td><input class="fit-k ${f.isCustom ? 'custom-k' : ''}" type="number" value="${f.k}" step="0.01" min="0"
            onchange="updateK(${f.rowId},this.value)" oninput="updateK(${f.rowId},this.value)"></td>
      <td class="fit-ksub-col"><span style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:var(--primary);">${ksub}</span></td>
      <td>
        <button class="btn-del" type="button" onclick="removeFitting(${f.rowId})" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
  updateKTotal();
}
function updateKTotal() {
  const ktot = fittingsList.reduce((s, f) => s + f.qty * f.k, 0);
  document.getElementById('ktotalDisplay').textContent = ktot.toFixed(3);
}
function getTotalK() { return fittingsList.reduce((s, f) => s + f.qty * f.k, 0); }

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  addFittingById('elbow90', 4);
  addFittingById('elbow45', 2);
  addFittingById('teerun', 1);
  addFittingById('gate_open', 1);
  addFittingById('check_swing', 1);
  addFittingById('entrance', 1);
});
</script>
<script>

/* ══════════════════════════════════════════════════════════
   API-BASED CALCULATE — all heavy math runs server-side
══════════════════════════════════════════════════════════ */
const API_BASE = (() => {
  const h = window.location.hostname;
  return (h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:3000' : '';
})();

async function calculate() {
  hideAlerts();
  let D   = parseFloat(document.getElementById('diameter').value);
  let L   = parseFloat(document.getElementById('length').value);
  let Q   = parseFloat(document.getElementById('flowrate').value);
  let rho = parseFloat(document.getElementById('density').value);
  let mu  = parseFloat(document.getElementById('viscosity').value);
  let dz  = parseFloat(document.getElementById('elevation').value) || 0;
  const matEl     = document.getElementById('material');
  const matVal    = matEl.value;
  const foulingMm = parseFloat(document.getElementById('foulingAllowance').value) || 0;
  const epsBase   = matVal === 'custom'
    ? (parseFloat(document.getElementById('customEps').value) || 0.05)
    : parseFloat(matVal);
  const eps      = epsBase + Math.max(0, foulingMm);
  const pumpEff  = (parseFloat(document.getElementById('pumpEff').value)  || 75) / 100;
  const motorEff = (parseFloat(document.getElementById('motorEff').value) || 92) / 100;
  const matLabel = matEl.options[matEl.selectedIndex].text;
  const fittingsPayload = fittingsList.filter(f => f.qty > 0).map(f => ({ id:f.id, label:f.label, qty:f.qty, k:f.k }));
  const PsuctBar = parseFloat(document.getElementById('npsh-Psuct').value);
  const PvapBar  = parseFloat(document.getElementById('npsh-Pvap').value);
  const npshPayload = (!isNaN(PsuctBar) && PsuctBar > 0) ? {
    PsuctBar, PvapBar: isNaN(PvapBar) ? 0 : PvapBar,
    Zs:    parseFloat(document.getElementById('npsh-Zs').value)    || 0,
    Hfs:   parseFloat(document.getElementById('npsh-Hfs').value)   || 0,
    NPSHr: parseFloat(document.getElementById('npsh-NPSHr').value) || 0,
  } : null;

  const btn = document.getElementById('btnCalc');
  const origHTML = btn.innerHTML;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="animation:spin .9s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-5"/></svg> Calculating…';
  btn.disabled = true;

  try {
    const resp = await fetch(API_BASE + '/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'calculate',
        D, L, Q, rho, mu, dz, eps, pumpEff, motorEff, unitMode,
        fluidId: lastFluidKey || '',
        fittings: fittingsPayload,
        npsh: npshPayload,
        matLabel, foulingMm,
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) { showAlert('err', data.error || 'Server error.'); return; }

    data.inputs.mat     = matLabel;
    data.inputs.Qunit   = unitMode === 'imperial' ? 'GPM' : 'm³/h';
    data.inputs.rhoUnit = unitMode === 'imperial' ? 'lb/ft³' : 'kg/m³';
    data.fittingsSnapshot = fittingsPayload.map(f => ({ label:f.label, qty:f.qty, k:f.k, ksub:f.qty*f.k }));
    data.foulingMm  = foulingMm;
    data.epsTotalMm = eps;
    data.unitMode   = unitMode;
    lastResults = data;

    if (data.warnings) data.warnings.forEach(w => {
      if (w.includes('Compressible')) showAlert('gas', w); else showAlert('warn', w);
    });

    renderResults(data);
    if (data.npsh && !data.npsh.skip) renderNPSH(data.npsh);

  } catch(err) {
    showAlert('err', 'Network error: ' + err.message);
  } finally {
    btn.innerHTML = origHTML;
    btn.disabled = false;
  }
}

/* ══ FLUID PROPS VIA API ══ */
async function autoCalcProps() {
  if (!_selectedFluid) return;
  const T_C   = parseFloat(document.getElementById('opTemp').value);
  const P_bar = parseFloat(document.getElementById('opPres').value) || 1.0;
  if (isNaN(T_C)) return;
  try {
    const resp = await fetch(API_BASE + '/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fluidProps', fluidId: _selectedFluid.id, T_C, P_bar })
    });
    const p = await resp.json();
    if (!p || p.error) return;
    document.getElementById('density').value     = p.rho;
    document.getElementById('viscosity').value   = p.mu;
    document.getElementById('vapPressure').value = p.Pv;
    const npshPvap = document.getElementById('npsh-Pvap');
    if (npshPvap) npshPvap.value = p.Pv;
    document.getElementById('propRho').textContent = 'ρ = ' + p.rho + ' kg/m³';
    document.getElementById('propMu').textContent  = 'μ = ' + p.mu  + ' cP';
    document.getElementById('propPv').textContent  = 'Psat = ' + p.Pv + ' bar';
    document.getElementById('propWarn').textContent = p.warn || '';
    const phaseEl = document.getElementById('propPhase');
    if (phaseEl) { phaseEl.textContent = p.phaseLabel || ''; phaseEl.style.color = p.isGas ? '#0891b2' : '#2563eb'; }
    const phaseTag = p.phaseLabel ? '  [' + p.phaseLabel + ']' : '';
    const badgeName = document.getElementById('fluidBadgeName');
    if (badgeName) badgeName.textContent =
      p.name + phaseTag + '  @  ' + T_C + '°C, ' + P_bar + ' bar  →  ρ = ' + p.rho + ' kg/m³  |  μ = ' + p.mu + ' cP' + (p.warn ? '  ⚠' : '');
    if (_selectedFluid.isGas === 'auto' || _selectedFluid.isGas) {
      if (p.isGas) showAlert('gas', '⚠ ' + p.name + ' is in GAS phase' + phaseTag + '. Darcy-Weisbach valid only if ΔP/P₁ < 10%.');
      else hideGasAlert();
    }
  } catch(e) {}
}

/* ══ NPSH RENDER ══ */
function renderNPSH(n) {
  const el = document.getElementById('npsh-result');
  if (!n || n.skip) { el.style.display='none'; return; }
  el.style.display = 'block';
  const safe = n.status === 'ok', warn = n.status === 'warn';
  const icon = safe ? '✅' : warn ? '⚠' : '❌';
  const msg  = safe ? 'NPSH adequate — cavitation risk low'
             : warn ? 'NPSH margin < 0.5 m — cavitation risk elevated'
             : 'NPSH DEFICIT — cavitation likely! Reduce flow, increase suction head, or lower temperature.';
  el.innerHTML = `<div style="background:${safe?'var(--green-pale)':warn?'var(--amber-pale)':'var(--red-pale)'};border:1px solid ${safe?'#a7f3d0':warn?'#fcd34d':'#fca5a5'};border-radius:8px;padding:11px 14px;">
    <div style="font-size:.7rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--text3);margin-bottom:6px;">NPSH Analysis</div>
    <div class="npsh-result ${n.status==='ok'?'npsh-ok':n.status==='warn'?'npsh-warn':'npsh-fail'}" style="margin-bottom:6px;">${icon} NPSH<sub>A</sub> = ${n.NPSH_A.toFixed(2)} m  |  NPSH<sub>R</sub> = ${n.NPSHr.toFixed(1)} m  |  Margin = ${n.margin.toFixed(2)} m</div>
    <div style="font-size:.79rem;color:var(--text2);">${msg}</div>
    <div style="font-size:.72rem;color:var(--text3);margin-top:5px;">NPSH<sub>A</sub> = (${n.Psuct_kPa.toFixed(0)} − ${n.Pvap_kPa.toFixed(0)} kPa)/(${n.rho.toFixed(0)}×9.81) + ${n.Zs} − ${n.Hfs} m</div>
  </div>`;
}

/* ══ RENDER RESULTS ══ */
/* ══ RENDER RESULTS ══ */
function renderResults(r) {
  document.getElementById('placeholder').style.display = 'none';
  const el = document.getElementById('results');
  el.style.display = 'block';

  // ── Re-derive all display values from raw SI fields so unit-toggle works ──
  // r.dpTotal, r.dpPipe, r.dpMinor, r.dpElev are always in Pa (SI)
  // r.Qs is always m³/s, r.rho_SI is always kg/m³
  // We use the CURRENT clientside unitMode (not r.unitMode from last API call)
  const isImperial = (unitMode === 'imperial');
  let dpDisp, dpPipeDisp, dpMinorDisp, dpElevDisp, dpUnit;
  let velDisp, velUnit, headDisp, headUnit, lenUnit, diamUnit, per100label;

  // Velocity from Qs and diameter: V = Qs / A; Dm = r.diameter in user units
  // r.diameter is already in user units (in or mm), r.length is in user units (ft or m)
  const Dm_si = isImperial ? (r.diameter * 25.4 / 1000) : (r.diameter / 1000);
  const A_si  = Math.PI * Dm_si * Dm_si / 4;
  const V_si  = r.Qs / A_si;  // m/s

  if (isImperial) {
    const toP = v => v * 0.000145038;
    dpDisp      = toP(r.dpTotal);
    dpPipeDisp  = toP(r.dpPipe);
    dpMinorDisp = toP(r.dpMinor);
    dpElevDisp  = toP(r.dpElev);
    dpUnit      = 'psi';
    velDisp     = V_si * 3.28084;
    velUnit     = 'ft/s';
    headDisp    = (r.dpTotal / (r.rho_SI * 9.81)) * 3.28084;
    headUnit    = 'ft';
    lenUnit     = 'ft';
    diamUnit    = 'in';
    per100label = 'ΔP per 100 ft';
  } else {
    const toBar = v => v / 100000;
    dpDisp      = toBar(r.dpTotal);
    dpPipeDisp  = toBar(r.dpPipe);
    dpMinorDisp = toBar(r.dpMinor);
    dpElevDisp  = toBar(r.dpElev);
    dpUnit      = 'bar';
    velDisp     = V_si;
    velUnit     = 'm/s';
    headDisp    = r.dpTotal / (r.rho_SI * 9.81);
    headUnit    = 'm';
    lenUnit     = 'm';
    diamUnit    = 'mm';
    per100label = 'ΔP per 100 m';
  }

  // Leq in display units
  const Leq_si = isImperial ? (r.Leq * 0.3048) : r.Leq;  // r.Leq already in user's ft or m
  // Actually r.Leq comes back in user units already (fixed on API side), just use lenUnit label
  const LeqDisplay = r.Leq;

  const pct = x => r.dpTotal > 0 ? (x/r.dpTotal*100).toFixed(1) : '0.0';
  const dpLow  = (dpDisp*(1-r.uncertPct/100)).toFixed(4);
  const dpHigh = (dpDisp*(1+r.uncertPct/100)).toFixed(4);
  const uncertNote = r.uncertPct > 10
    ? `<div style="font-size:.74rem;color:#92400e;margin-top:4px;">⚠ Transitional regime — high uncertainty (±${r.uncertPct}%): ${dpLow}–${dpHigh} ${dpUnit}</div>`
    : `<div style="font-size:.74rem;opacity:.75;margin-top:4px;">Estimated model uncertainty ±${r.uncertPct}%: ${dpLow}–${dpHigh} ${dpUnit}</div>`;
  const gasNote    = r.isGasFluid ? `<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:7px;padding:8px 12px;margin-bottom:12px;font-size:.79rem;color:#991b1b;font-weight:600;">⚠ Compressible fluid: results use an incompressible model. Valid only if ΔP/P₁ < 10%.</div>` : '';
  const foulingNote = r.foulingMm > 0 ? `<div style="font-size:.73rem;color:var(--text3);margin-bottom:8px;">🔧 Fouling allowance +${r.foulingMm} mm applied → total ε = ${r.epsTotalMm.toFixed(4)} mm</div>` : '';
  el.innerHTML = `
    ${gasNote}${foulingNote}
    <div class="res-header">
      <div class="rh-label">TOTAL PRESSURE DROP</div>
      <div class="rh-value">${dpDisp.toFixed(4)}<span class="rh-unit">${dpUnit}</span></div>
      <div class="rh-sub">Friction ${pct(r.dpPipe)}% · Fittings ${pct(r.dpMinor)}% · Elevation ${pct(r.dpElev)}%</div>
      ${uncertNote}
    </div>
    <div class="res-grid">
      <div class="rcard"><div class="rcard-label">Pipe Friction</div>
        <div class="rcard-val">${dpPipeDisp.toFixed(4)}<span class="rcard-unit">${dpUnit}</span></div>
        <div style="font-size:.72rem;color:var(--text3);margin-top:3px;">${pct(r.dpPipe)}% of total</div></div>
      <div class="rcard"><div class="rcard-label">Minor Losses</div>
        <div class="rcard-val">${dpMinorDisp.toFixed(4)}<span class="rcard-unit">${dpUnit}</span></div>
        <div style="font-size:.72rem;color:var(--text3);margin-top:3px;">${pct(r.dpMinor)}% of total</div></div>
      <div class="rcard"><div class="rcard-label">Flow Velocity</div>
        <div class="rcard-val">${velDisp.toFixed(3)}<span class="rcard-unit">${velUnit}</span></div></div>
      <div class="rcard"><div class="rcard-label">Reynolds Number</div>
        <div class="rcard-val">${parseFloat(r.Re).toFixed(0)}</div>
        <span class="badge ${r.regimeClass}">${r.regime}</span></div>
      <div class="rcard"><div class="rcard-label">Friction Factor f</div>
        <div class="rcard-val">${r.f.toFixed(5)}</div>
        <div style="font-size:.72rem;color:var(--text3);margin-top:3px;">Darcy-Weisbach</div></div>
      <div class="rcard"><div class="rcard-label">Total K-Factor</div>
        <div class="rcard-val">${r.Ktot.toFixed(3)}</div>
        <div style="font-size:.72rem;color:var(--text3);margin-top:3px;">All fittings</div></div>
      <div class="rcard g"><div class="rcard-label">Total Head Loss</div>
        <div class="rcard-val">${headDisp.toFixed(3)}<span class="rcard-unit">${headUnit}</span></div></div>
      <div class="rcard ${r.dpElev>0?'a':r.dpElev<0?'g':''}">
        <div class="rcard-label">Elevation ΔP</div>
        <div class="rcard-val">${dpElevDisp.toFixed(4)}<span class="rcard-unit">${dpUnit}</span></div>
        <div style="font-size:.72rem;color:var(--text3);margin-top:3px;">${r.dz>=0?'+uphill':'−downhill'}</div></div>
    </div>
    <div class="summary-box">
      <h4>📋 Calculation Summary</h4>
      <div class="summary-row"><span class="sr-key">Pipe Diameter</span><span class="sr-val">${r.diameter.toFixed(1)} ${diamUnit}</span></div>
      <div class="summary-row"><span class="sr-key">Pipe Length</span><span class="sr-val">${r.length.toFixed(1)} ${lenUnit}</span></div>
      <div class="summary-row"><span class="sr-key">Friction : Fittings : Elevation</span><span class="sr-val">${pct(r.dpPipe)}% : ${pct(r.dpMinor)}% : ${pct(r.dpElev)}%</span></div>
      <div class="summary-row"><span class="sr-key">${per100label}</span><span class="sr-val">${(dpDisp/r.length*100).toFixed(4)} ${dpUnit}/100${lenUnit}</span></div>
      <div class="summary-row"><span class="sr-key">Fittings Equiv. Length (Le)</span><span class="sr-val">${LeqDisplay.toFixed(1)} ${lenUnit}</span></div>
    </div>
    <div class="pump-section">
      <div class="pump-section-title">⚡ Pump & Motor Power Requirement</div>
      <div class="res-grid">
        <div class="rcard p"><div class="rcard-label">Hydraulic Power</div>
          <div class="rcard-val">${(r.P_hyd/1000).toFixed(3)}<span class="rcard-unit">kW</span></div>
          <div style="font-size:.72rem;color:var(--text3);margin-top:3px;">Q × ΔP_total</div></div>
        <div class="rcard p"><div class="rcard-label">Shaft Power (${r.inputs.pumpEff}% pump)</div>
          <div class="rcard-val">${(r.P_shaft/1000).toFixed(3)}<span class="rcard-unit">kW</span></div></div>
        <div class="rcard p"><div class="rcard-label">Motor Power (${r.inputs.motorEff}% motor)</div>
          <div class="rcard-val">${(r.P_motor/1000).toFixed(3)}<span class="rcard-unit">kW</span></div></div>
        <div class="rcard p"><div class="rcard-label">Motor Power</div>
          <div class="rcard-val">${(r.P_motor/745.7).toFixed(2)}<span class="rcard-unit">hp</span></div></div>
      </div>
    </div>`;
}


/* ══ HAZEN-WILLIAMS ══ */
function syncHWC(){
  document.getElementById('hw-custom-row').style.display=document.getElementById('hw-C').value==='custom'?'':'none';
}
function calcHW(){
  const D_mm=parseFloat(document.getElementById('hw-D').value)||100;
  const L_m =parseFloat(document.getElementById('hw-L').value)||100;
  const Q_m3h=parseFloat(document.getElementById('hw-Q').value)||30;
  const Cv=document.getElementById('hw-C').value;
  const C=Cv==='custom'?(parseFloat(document.getElementById('hw-Cval').value)||120):parseFloat(Cv);

  if(D_mm<=0||L_m<=0||Q_m3h<=0||C<=0){
    document.getElementById('hw-results').innerHTML='<div class="alert alert-err show" style="margin:0;">⚠ All inputs must be positive values.</div>';return;
  }

  const D_m=D_mm/1000;
  const Q_m3s=Q_m3h/3600;
  // Hazen-Williams head loss [m]: hf = 10.67 * L * Q^1.852 / (C^1.852 * D^4.8704)
  // Constant 10.67 valid ONLY for Q[m³/s], D[m], hf[m] — SI specific
  const hf=10.67*L_m*Math.pow(Q_m3s,1.852)/(Math.pow(C,1.852)*Math.pow(D_m,4.8704));
  if(!isFinite(hf)||hf<0){
    document.getElementById('hw-results').innerHTML='<div class="alert alert-err show" style="margin:0;">⚠ Calculation error — check inputs.</div>';return;
  }
  // Head loss gradient
  const S=hf/L_m;
  // Velocity
  const A=Math.PI*D_m*D_m/4;
  const V=Q_m3s/A;
  // Convert to pressure (water @ 20°C, 998 kg/m³)
  const rho=998, g=9.81;
  const dpPa=hf*rho*g;
  const dpBar=dpPa/1e5;

  // FIX: H-W validity warnings
  const hwWarnings=[];
  // Temperature validity: H-W valid for water 4–25°C only
  hwWarnings.push('⚠ Hazen-Williams is valid only for water between 5–30°C (fully turbulent, Re > 100,000, D > 50 mm). Do not apply to oils, glycols, gases or steam.');
  if(V>3) hwWarnings.push('⚠ Velocity ' + V.toFixed(2) + ' m/s exceeds 3 m/s — erosion risk. Consider larger diameter.');
  if(C<80) hwWarnings.push('⚠ C = '+C+' indicates severely fouled/corroded pipe — actual condition should be verified on site.');
  const warnHtml=hwWarnings.map(w=>`<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:7px 10px;margin-bottom:7px;font-size:.77rem;color:#78350f;font-weight:600;">${w}</div>`).join('');

  document.getElementById('hw-results').innerHTML=`
    ${warnHtml}
    <div class="res-header" style="background:linear-gradient(135deg,#0891b2,#0369a1)">
      <div class="rh-label">HAZEN-WILLIAMS HEAD LOSS</div>
      <div class="rh-value">${hf.toFixed(3)}<span class="rh-unit">m</span></div>
      <div class="rh-sub">Equivalent to ${dpBar.toFixed(4)} bar (water @ 20°C) | ±10–15% typical accuracy</div>
    </div>
    <div class="res-grid">
      <div class="rcard"><div class="rcard-label">Head Loss (hf)</div>
        <div class="rcard-val">${hf.toFixed(3)}<span class="rcard-unit">m</span></div></div>
      <div class="rcard"><div class="rcard-label">Pressure Drop</div>
        <div class="rcard-val">${dpBar.toFixed(4)}<span class="rcard-unit">bar</span></div></div>
      <div class="rcard"><div class="rcard-label">Head Gradient (S)</div>
        <div class="rcard-val">${(S*1000).toFixed(3)}<span class="rcard-unit">m/km</span></div></div>
      <div class="rcard"><div class="rcard-label">Flow Velocity</div>
        <div class="rcard-val">${V.toFixed(3)}<span class="rcard-unit">m/s</span></div></div>
      <div class="rcard"><div class="rcard-label">C Coefficient</div>
        <div class="rcard-val">${C}</div></div>
      <div class="rcard"><div class="rcard-label">hf per 100 m</div>
        <div class="rcard-val">${(hf/L_m*100).toFixed(3)}<span class="rcard-unit">m/100m</span></div></div>
    </div>
    <div class="summary-box">
      <h4>📋 Input Summary</h4>
      <div class="summary-row"><span class="sr-key">Pipe Diameter</span><span class="sr-val">${D_mm} mm</span></div>
      <div class="summary-row"><span class="sr-key">Pipe Length</span><span class="sr-val">${L_m} m</span></div>
      <div class="summary-row"><span class="sr-key">Flow Rate</span><span class="sr-val">${Q_m3h} m³/h (${(Q_m3s*1000).toFixed(2)} L/s)</span></div>
      <div class="summary-row"><span class="sr-key">H-W Coefficient C</span><span class="sr-val">${C}</span></div>
    </div>
    <div class="uncertainty-box"><strong>Uncertainty:</strong> Hazen-Williams typically ±10–15% for design purposes. For critical designs use Darcy-Weisbach with actual fluid viscosity.</div>`;
}

/* ══ PDF REPORT — html2pdf, A4 single page ══ */
function generatePDF() {
  if(!lastResults){alert('Please run a calculation first, then click PDF Report.');return;}
  if(typeof html2pdf==='undefined'){alert('PDF library not loaded — check internet connection.');return;}

  const r=lastResults;
  // ── Re-derive display values from raw SI fields (same logic as renderResults) ──
  const isImperial = (r.unitMode === 'imperial');
  let dpDisp, dpPipeDisp, dpMinorDisp, dpElevDisp, dpUnit, velDisp, velUnit, headDisp, headUnit, lenUnit, diamUnit, per100label;
  const Dm_si = isImperial ? (r.diameter * 25.4 / 1000) : (r.diameter / 1000);
  const A_si  = Math.PI * Dm_si * Dm_si / 4;
  const V_si  = r.Qs / A_si;
  if (isImperial) {
    const toP = v => v * 0.000145038;
    dpDisp=toP(r.dpTotal); dpPipeDisp=toP(r.dpPipe); dpMinorDisp=toP(r.dpMinor); dpElevDisp=toP(r.dpElev);
    dpUnit='psi'; velDisp=V_si*3.28084; velUnit='ft/s';
    headDisp=(r.dpTotal/(r.rho_SI*9.81))*3.28084; headUnit='ft';
    lenUnit='ft'; diamUnit='in'; per100label='ΔP per 100 ft';
  } else {
    const toBar = v => v / 100000;
    dpDisp=toBar(r.dpTotal); dpPipeDisp=toBar(r.dpPipe); dpMinorDisp=toBar(r.dpMinor); dpElevDisp=toBar(r.dpElev);
    dpUnit='bar'; velDisp=V_si; velUnit='m/s';
    headDisp=r.dpTotal/(r.rho_SI*9.81); headUnit='m';
    lenUnit='m'; diamUnit='mm'; per100label='ΔP per 100 m';
  }

  const r=lastResults;
  const now=new Date();
  const dateStr=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const timeStr=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const pct=x=>r.dpTotal>0?(x/r.dpTotal*100).toFixed(1):'0.0';
  const fittingsRows=r.fittingsSnapshot.length
    ?r.fittingsSnapshot.map(f=>`<tr><td>${f.label}</td><td>${f.qty}</td><td>${f.k}</td><td>${f.ksub.toFixed(3)}</td></tr>`).join('')
     +`<tr style="background:#eef2ff;font-weight:700;"><td colspan="3">Total K-Factor</td><td>${r.Ktot.toFixed(3)}</td></tr>`
    :`<tr><td colspan="4" style="text-align:center;color:#9ca3af;">No fittings</td></tr>`;

  const fluidName = _selectedFluid ? (_selectedFluid.name || _selectedFluid.label || 'Unknown Fluid') : 'Custom (manual entry)';
  const btn=document.querySelector('.btn-pdf');
  const origTxt=btn?btn.innerHTML:'';
  if(btn){btn.innerHTML='⏳ Generating…';btn.disabled=true;}

  // Build A4-sized hidden report element
  const report=document.createElement('div');
  report.style.cssText='width:794px;position:fixed;top:-9999px;left:-9999px;background:#fff;font-family:Arial,sans-serif;font-size:11px;color:#111827;padding:28px 32px;box-sizing:border-box;line-height:1.45;';

  report.innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #4f46e5;padding-bottom:10px;margin-bottom:12px;">
    <div>
      <div style="font-size:20px;font-weight:800;color:#4f46e5;">ΔP multicalci.com</div>
      <div style="font-size:9px;color:#6b7280;letter-spacing:1px;margin-top:2px;">PRESSURE DROP CALCULATION REPORT</div>
      <div style="display:inline-block;background:#eef2ff;border:1px solid #4f46e5;color:#4f46e5;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;margin-top:5px;">Darcy-Weisbach · Colebrook-White · K-Factor</div>
    </div>
    <div style="text-align:right;font-size:9.5px;color:#6b7280;line-height:1.8;">
      <strong style="color:#111827;">Pressure Drop Calculation Report</strong><br>
      Date: <strong>${dateStr}</strong>   Time: <strong>${timeStr}</strong><br>
      Fluid: <strong>${fluidName}</strong><br>
      Unit System: <strong>${isImperial?'Imperial (psi, GPM)':'SI (bar, m³/h)'}</strong>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;border-radius:8px;padding:12px 18px;text-align:center;margin-bottom:11px;">
    <div style="font-size:9px;font-weight:700;letter-spacing:1px;opacity:.85;margin-bottom:2px;">TOTAL PRESSURE DROP</div>
    <div style="font-family:'Courier New',monospace;font-size:30px;font-weight:700;line-height:1;">${dpDisp.toFixed(4)}<span style="font-size:13px;margin-left:4px;opacity:.9;">${dpUnit}</span></div>
    <div style="font-size:9px;opacity:.8;margin-top:3px;">Friction ${pct(r.dpPipe)}% · Fittings ${pct(r.dpMinor)}% · Elevation ${pct(r.dpElev)}%  |  Model uncertainty ±${r.uncertPct}%: ${(dpDisp*(1-r.uncertPct/100)).toFixed(4)}–${(dpDisp*(1+r.uncertPct/100)).toFixed(4)} ${dpUnit}</div>
  </div>

  ${r.isGasFluid?'<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:5px;padding:6px 10px;margin-bottom:8px;font-size:9.5px;color:#991b1b;font-weight:700;">⚠ COMPRESSIBLE FLUID — Incompressible model used. Valid only if ΔP/P₁ < 10%.</div>':''}
  <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:5px;padding:5px 10px;margin-bottom:10px;font-size:9px;color:#78350f;font-weight:700;">⚠ NOT FOR FINAL DESIGN. Results are indicative only. Verify with a qualified engineer per applicable codes.</div>

  <div style="font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#4f46e5;border-bottom:1.5px solid #e0e7ff;padding-bottom:3px;margin:0 0 8px;">Detailed Results</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #4f46e5;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Pipe Friction</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${dpPipeDisp.toFixed(4)}<span style="font-size:9px;color:#0891b2;margin-left:1px;">${dpUnit}</span></div>
      <div style="font-size:8px;color:#6b7280;">${pct(r.dpPipe)}%</div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #4f46e5;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Minor Losses</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${dpMinorDisp.toFixed(4)}<span style="font-size:9px;color:#0891b2;margin-left:1px;">${dpUnit}</span></div>
      <div style="font-size:8px;color:#6b7280;">${pct(r.dpMinor)}%</div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #059669;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Total Head Loss</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${headDisp.toFixed(3)}<span style="font-size:9px;color:#0891b2;margin-left:1px;">${headUnit}</span></div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #d97706;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Elevation ΔP</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${dpElevDisp.toFixed(4)}<span style="font-size:9px;color:#0891b2;margin-left:1px;">${dpUnit}</span></div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #4f46e5;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Flow Velocity</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${velDisp.toFixed(3)}<span style="font-size:9px;color:#0891b2;margin-left:1px;">${velUnit}</span></div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #4f46e5;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Reynolds No.</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${Math.round(r.Re).toLocaleString()}</div>
      <div style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:7.5px;font-weight:700;margin-top:2px;${r.regime==='Laminar'?'background:#d1fae5;color:#059669;':r.regime==='Transitional'?'background:#fef3c7;color:#d97706;':'background:#fee2e2;color:#dc2626;'}">${r.regime}</div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #4f46e5;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Friction Factor f</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${r.f.toFixed(5)}</div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-left:3px solid #4f46e5;border-radius:5px;padding:7px 9px;background:#f9fafb;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.4px;margin-bottom:2px;">Equiv. Length Le</div>
      <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;">${r.Leq.toFixed(1)}<span style="font-size:9px;color:#0891b2;margin-left:1px;">${lenUnit}</span></div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
    <div>
      <div style="font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#4f46e5;border-bottom:1.5px solid #e0e7ff;padding-bottom:3px;margin-bottom:7px;">Process Conditions</div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <tr><th style="background:#f3f4f6;padding:5px 8px;border:1px solid #e5e7eb;text-align:left;font-size:8.5px;font-weight:700;color:#374151;">Parameter</th><th style="background:#f3f4f6;padding:5px 8px;border:1px solid #e5e7eb;text-align:left;font-size:8.5px;font-weight:700;color:#374151;">Value</th></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">Fluid</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:700;">${fluidName}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:4px 8px;border:1px solid #e5e7eb;">Pipe Diameter</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:'Courier New',monospace;font-weight:700;">${r.inputs.D} ${diamUnit}</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">Pipe Length</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:'Courier New',monospace;font-weight:700;">${r.inputs.L} ${lenUnit}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:4px 8px;border:1px solid #e5e7eb;">Elevation Change</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:'Courier New',monospace;font-weight:700;">${r.dz.toFixed(2)} ${lenUnit}</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">Pipe Material</td><td style="padding:4px 8px;border:1px solid #e5e7eb;">${r.inputs.mat.split('—')[0].trim()}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:4px 8px;border:1px solid #e5e7eb;">Flow Rate</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:'Courier New',monospace;font-weight:700;">${r.inputs.Q} ${r.inputs.Qunit}</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">Fluid Density</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:'Courier New',monospace;font-weight:700;">${r.inputs.rho.toFixed(1)} ${r.inputs.rhoUnit}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:4px 8px;border:1px solid #e5e7eb;">Dynamic Viscosity</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:'Courier New',monospace;font-weight:700;">${r.inputs.mu} cP</td></tr>
        ${r.foulingMm>0?`<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">Fouling Allowance</td><td style="padding:4px 8px;border:1px solid #e5e7eb;font-family:'Courier New',monospace;font-weight:700;">+${r.foulingMm} mm</td></tr>`:''}
      </table>
    </div>
    <div>
      <div style="font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#4f46e5;border-bottom:1.5px solid #e0e7ff;padding-bottom:3px;margin-bottom:7px;">Fittings & Valves</div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <tr>
          <th style="background:#f3f4f6;padding:5px 8px;border:1px solid #e5e7eb;font-size:8.5px;font-weight:700;color:#374151;text-align:left;">Fitting</th>
          <th style="background:#f3f4f6;padding:5px 8px;border:1px solid #e5e7eb;font-size:8.5px;font-weight:700;color:#374151;text-align:center;">Qty</th>
          <th style="background:#f3f4f6;padding:5px 8px;border:1px solid #e5e7eb;font-size:8.5px;font-weight:700;color:#374151;text-align:center;">K</th>
          <th style="background:#f3f4f6;padding:5px 8px;border:1px solid #e5e7eb;font-size:8.5px;font-weight:700;color:#374151;text-align:right;">K×Qty</th>
        </tr>
        ${fittingsRows}
      </table>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
    <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:6px;padding:9px 12px;">
      <div style="font-size:8.5px;font-weight:700;color:#4f46e5;margin-bottom:6px;letter-spacing:.3px;">SUMMARY</div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #e0e7ff;font-size:9.5px;"><span>Friction : Fittings : Elevation</span><span style="font-family:'Courier New',monospace;font-weight:700;">${pct(r.dpPipe)}% : ${pct(r.dpMinor)}% : ${pct(r.dpElev)}%</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #e0e7ff;font-size:9.5px;"><span>${per100label}</span><span style="font-family:'Courier New',monospace;font-weight:700;">${(dpDisp/r.length*100).toFixed(4)} ${dpUnit}/100${lenUnit}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #e0e7ff;font-size:9.5px;"><span>Equiv. pipe length (Le)</span><span style="font-family:'Courier New',monospace;font-weight:700;">${r.Leq.toFixed(1)} ${lenUnit}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:9.5px;"><span>Flow regime (Re)</span><span style="font-family:'Courier New',monospace;font-weight:700;">${r.regime} (${Math.round(r.Re).toLocaleString()})</span></div>
    </div>
    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:9px 12px;">
      <div style="font-size:8.5px;font-weight:700;color:#7c3aed;margin-bottom:6px;letter-spacing:.3px;">PUMP & MOTOR POWER</div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #e0e7ff;font-size:9.5px;"><span>Hydraulic Power</span><span style="font-family:'Courier New',monospace;font-weight:700;">${(r.P_hyd/1000).toFixed(3)} kW</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #e0e7ff;font-size:9.5px;"><span>Shaft Power (pump η=${r.inputs.pumpEff}%)</span><span style="font-family:'Courier New',monospace;font-weight:700;">${(r.P_shaft/1000).toFixed(3)} kW</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #e0e7ff;font-size:9.5px;"><span>Motor Input (motor η=${r.inputs.motorEff}%)</span><span style="font-family:'Courier New',monospace;font-weight:700;">${(r.P_motor/1000).toFixed(3)} kW</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:9.5px;"><span>Motor Power (HP)</span><span style="font-family:'Courier New',monospace;font-weight:700;">${(r.P_motor/745.7).toFixed(2)} hp</span></div>
    </div>
  </div>

  <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:5px;padding:8px 10px;font-family:'Courier New',monospace;font-size:9px;color:#374151;line-height:2;margin-bottom:10px;">
    <span style="color:#4f46e5;font-weight:700;">Friction:</span>        ΔP = f × (L/D) × (ρV²/2)          
    <span style="color:#4f46e5;font-weight:700;">Colebrook-White:</span> 1/√f = −2 log₁₀(ε/3.7D + 2.51/Re√f)<br>
    <span style="color:#4f46e5;font-weight:700;">Reynolds:</span>         Re = ρVD/μ                      
    <span style="color:#4f46e5;font-weight:700;">Minor Losses:</span>    ΔP_minor = ΣK × (ρV²/2)<br>
    <span style="color:#4f46e5;font-weight:700;">Pump Power:</span>       P_motor = Q × ΔP / (η_pump × η_motor)
  </div>

  <div style="display:flex;justify-content:space-between;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:6px;">
    <span>multicalci.com — Pressure Drop Calculator — Darcy-Weisbach · Colebrook-White · K-Factor</span>
    <span style="color:#dc2626;font-weight:700;">NOT FOR FINAL DESIGN — verify with qualified engineer</span>
    <span>Generated ${dateStr} at ${timeStr}</span>
  </div>`;

  document.body.appendChild(report);

  const opt = {
    margin: 0,
    filename: 'PressureDrop_Report_' + dateStr.replace(/ /g,'_') + '.pdf',
    image: { type: 'jpeg', quality: 0.97 },
    html2canvas: { scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(report).save()
    .then(()=>{
      document.body.removeChild(report);
      if(btn){btn.innerHTML=origTxt;btn.disabled=false;}
    })
    .catch(()=>{
      document.body.removeChild(report);
      if(btn){btn.innerHTML=origTxt;btn.disabled=false;}
      alert('PDF generation failed. Try Ctrl+P to print as PDF instead.');
    });
}
</script></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
function sgFaq(btn){const a=btn.nextElementSibling,o=btn.classList.contains('on');document.querySelectorAll('.sfaq-q').forEach(q=>q.classList.remove('on'));document.querySelectorAll('.sfaq-a').forEach(a=>a.classList.remove('on'));if(!o){btn.classList.add('on');a.classList.add('on');}}
const SHR_URL='https://multicalci.com/pressure-drop-calculator/';
const SHR_TITLE='Pipe Pressure Drop Calculator — Darcy-Weisbach & Colebrook-White | multicalci.com';
const SHR_DESC='Free Pipe Pressure Drop Calculator — Darcy-Weisbach, Colebrook-White, Churchill equation, K-factor minor losses, temperature-corrected fluid properties, pump sizing. SI & Imperial.';
function shrSnapText(){const s=document.getElementById('shr-snap');const v=s?s.textContent.trim():'';return(v&&!v.startsWith('Run'))?v:null;}
function shrMsg(){const s=shrSnapText();return s?SHR_DESC+'\n\nResults: '+s+'\n\n'+SHR_URL:SHR_DESC+'\n\n'+SHR_URL;}
function shrOpen(p){const e=encodeURIComponent;if(p==='copy'){shrDoCopy(SHR_URL,'shr-cp-btn');return;}const u={whatsapp:'https://wa.me/?text='+e(shrMsg()),twitter:'https://twitter.com/intent/tweet?text='+e(SHR_DESC)+'&url='+e(SHR_URL),linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+e(SHR_URL),facebook:'https://www.facebook.com/sharer/sharer.php?u='+e(SHR_URL),telegram:'https://t.me/share/url?url='+e(SHR_URL)+'&text='+e(SHR_DESC),email:'mailto:?subject='+e(SHR_TITLE)+'&body='+e(shrMsg())};window.open(u[p],'_blank','noopener,noreferrer');}
function shrCopyResult(){const s=document.getElementById('shr-snap');shrDoCopy((s?s.textContent:'')+'\\n'+SHR_URL,null);const b=document.querySelector('.shr-copy-res');if(b){const o=b.innerHTML;b.innerHTML='✓ Copied!';setTimeout(()=>b.innerHTML=o,2200);}}
function shrDoCopy(txt,bId){const done=()=>{if(!bId)return;const b=document.getElementById(bId);if(!b)return;const o=b.innerHTML;b.innerHTML='✓ Copied!';setTimeout(()=>b.innerHTML=o,2200);};if(navigator.clipboard)navigator.clipboard.writeText(txt).then(done).catch(()=>{shrFb(txt);done();});else{shrFb(txt);done();}}
function shrFb(txt){const t=document.createElement('textarea');t.value=txt;t.style.cssText='position:fixed;opacity:0;';document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);}
(function(){function refresh(){if(typeof lastResults==='undefined'||!lastResults||!lastResults.dpTotal)return;
  const r=lastResults;
  // Re-derive display values so snap text reflects current unit toggle
  const imp=(typeof unitMode!=='undefined'&&unitMode==='imperial');
  const Dm_s=imp?(r.diameter*25.4/1000):(r.diameter/1000);
  const A_s=Math.PI*Dm_s*Dm_s/4;
  const V_s=r.Qs/A_s;
  const dpD=imp?r.dpTotal*0.000145038:r.dpTotal/100000;
  const dpPD=imp?r.dpPipe*0.000145038:r.dpPipe/100000;
  const dpMD=imp?r.dpMinor*0.000145038:r.dpMinor/100000;
  const vD=imp?V_s*3.28084:V_s;
  const dU=imp?'psi':'bar'; const vU=imp?'ft/s':'m/s';
  const p=[];
  p.push('Total: '+dpD.toFixed(4)+' '+dU);
  p.push('Friction: '+dpPD.toFixed(4)+' '+dU);
  if(dpMD>0)p.push('Fittings: '+dpMD.toFixed(4)+' '+dU);
  p.push('V: '+vD.toFixed(2)+' '+vU);
  if(r.Re!==undefined)p.push('Re: '+Math.round(r.Re));
  if(r.f!==undefined)p.push('f: '+r.f.toFixed(5));
  const s=document.getElementById('shr-snap');if(s&&p.length>=2)s.textContent=p.join('  |  ')+'  —  multicalci.com';}
setInterval(refresh,900);setTimeout(refresh,1800);})();

</script>

</body>
</html>
