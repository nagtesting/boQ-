
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="description" content="HeatXpert Pro — Professional Heat Exchanger Design & Analysis Tool">
<meta property="og:title" content="HeatXpert Pro — Heat Exchanger Design">
<meta property="og:description" content="Professional heat exchanger sizing: Shell & Tube, Plate, Air Cooled, Double Pipe. LMTD, NTU, fouling calculations.">
<title>Heat Exchanger Design Calculator — Shell & Tube, TEMA | multicalci.com</title>
<meta name="description" content="Free shell and tube heat exchanger design using Bell-Delaware method. Calculate LMTD, NTU and pressure drop.">
<link rel="canonical" href="https://multicalci.com/heat-exchanger-design/">
<meta property="og:title" content="Heat Exchanger Design Calculator — Shell & Tube, TEMA | multicalci.com">
<meta property="og:description" content="Free shell and tube heat exchanger design using Bell-Delaware method. Calculate LMTD, NTU and pressure drop.">
<meta property="og:url" content="https://multicalci.com/heat-exchanger-design/">
<meta property="og:type" content="website">
    <meta property="og:image" content="https://multicalci.com/assets/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="HeatXpert Pro — Heat Exchanger Design">
    <meta name="twitter:image" content="https://multicalci.com/assets/og-image.png">


<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Heat Exchanger Design Calculator","description":"Shell and tube heat exchanger design calculator using Bell-Delaware method, TEMA standards, with 80+ fluids.","applicationCategory":"EngineeringApplication","operatingSystem":"Web","url":"https://multicalci.com/heat-exchanger-design/","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<meta name="robots" content="index, follow">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/* ══════ RESET & TOKENS ══════ */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#e8500a; --red-dk:#c03d00; --red-lt:#fff3ee;
  --blue:#0055c8; --blue-lt:#eef4ff;
  --teal:#008f76; --teal-lt:#e6f7f4;
  --gold:#c07800; --gold-lt:#fff8e6;
  --ok:#1b7a3e; --warn:#b35a00; --err:#c0201a;
  --bg:#f0f2f7;
  --surf:#ffffff; --surf2:#f5f7fb;
  --bdr:#e2e6f0; --bdr2:#c8d0e4;
  --t1:#0c1322; --t2:#3a4560; --t3:#6b7899;
  --mono:'DM Mono',monospace;
  --sans:'Space Grotesk',system-ui,sans-serif;
  --r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:20px;
  --sh-sm:0 2px 8px rgba(12,20,50,.07);
  --sh-md:0 4px 20px rgba(12,20,50,.10);
  --sh-lg:0 8px 40px rgba(12,20,50,.13);
  --hdr-h:64px;
}

html{scroll-behavior:smooth}
body{
  font-family:var(--sans);font-size:15px;color:var(--t1);
  background:var(--bg);line-height:1.6;min-height:100vh;
  background-image:
    radial-gradient(ellipse 60% 40% at 10% 0%,rgba(232,80,10,.04) 0%,transparent 60%),
    radial-gradient(ellipse 50% 50% at 90% 100%,rgba(0,85,200,.03) 0%,transparent 60%);
}

/* ══════ LAYOUT ══════ */
.wrap{max-width:1720px;margin:0 auto;padding:16px 16px}

/* ══════ HEADER ══════ */
.hdr{
  background:var(--surf);border-radius:var(--r-xl);
  border:1px solid var(--bdr);box-shadow:var(--sh-md);
  padding:14px 20px;margin-bottom:16px;
  position:relative;overflow:hidden;
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;
}
.hdr::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--red),#ff8c42,var(--teal),var(--blue),var(--red));
  background-size:300% 100%;animation:stripe 6s linear infinite;
}
@keyframes stripe{to{background-position:300% 0}}

.hdr-brand{display:flex;align-items:center;gap:12px;flex:1;min-width:200px}
.hdr-icon{
  width:46px;height:46px;border-radius:12px;flex-shrink:0;
  background:linear-gradient(135deg,var(--red),var(--red-dk));
  display:flex;align-items:center;justify-content:center;font-size:22px;
  box-shadow:0 4px 14px rgba(232,80,10,.28);
}
.hdr-title{
  font-size:1.5rem;font-weight:700;letter-spacing:-.5px;
  background:linear-gradient(135deg,var(--red),var(--blue));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  line-height:1.1;
}
.hdr-sub{font-size:.73rem;color:var(--t3);font-weight:500;margin-top:1px;letter-spacing:.5px;text-transform:uppercase}
.hdr-version{
  font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:10px;
  background:var(--teal-lt);color:var(--teal);border:1px solid rgba(0,143,118,.2);
  text-transform:uppercase;letter-spacing:.5px;margin-left:6px;vertical-align:middle;
}

.hdr-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* Unit toggle */
.unit-toggle{
  display:flex;gap:2px;background:var(--surf2);border:1px solid var(--bdr);
  border-radius:var(--r-md);padding:3px;
}
.unit-btn{
  padding:6px 14px;border:none;border-radius:8px;
  font-family:var(--sans);font-size:.78rem;font-weight:700;letter-spacing:.3px;
  cursor:pointer;background:transparent;color:var(--t2);transition:all .2s;
}
.unit-btn.active{
  background:linear-gradient(135deg,var(--red),var(--red-dk));
  color:#fff;box-shadow:0 3px 10px rgba(232,80,10,.28);
}

/* Header buttons */
.hdr-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 16px;border:none;border-radius:var(--r-md);
  font-family:var(--sans);font-size:.78rem;font-weight:700;letter-spacing:.3px;
  cursor:pointer;transition:all .2s;white-space:nowrap;
}
.btn-blue{background:linear-gradient(135deg,var(--blue),#003fa0);color:#fff;box-shadow:0 3px 12px rgba(0,85,200,.22)}
.btn-blue:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(0,85,200,.35)}
.btn-teal{background:linear-gradient(135deg,var(--teal),#005e4e);color:#fff;box-shadow:0 3px 12px rgba(0,143,118,.22)}
.btn-teal:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(0,143,118,.35)}
.btn-share{background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;box-shadow:0 3px 12px rgba(124,58,237,.25)}
.btn-share:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(124,58,237,.4)}

/* Mobile menu toggle */
.menu-toggle{
  display:none;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--r-md);
  padding:8px 10px;cursor:pointer;font-size:1.2rem;
}

/* ══════ NAV TABS ══════ */
.nav-wrap{
  background:var(--surf);border:1px solid var(--bdr);
  border-radius:var(--r-lg);padding:5px;margin-bottom:16px;
  box-shadow:var(--sh-sm);overflow-x:auto;-webkit-overflow-scrolling:touch;
}
.nav-tabs{display:flex;gap:4px;min-width:max-content}
.nav-tab{
  padding:9px 18px;background:transparent;border:1.5px solid transparent;
  border-radius:var(--r-md);font-family:var(--sans);font-size:.82rem;font-weight:700;
  letter-spacing:.2px;text-transform:uppercase;cursor:pointer;color:var(--t2);
  transition:all .2s;white-space:nowrap;
}
.nav-tab:hover{background:var(--surf2);border-color:var(--bdr2);color:var(--t1)}
.nav-tab.active{
  background:linear-gradient(135deg,var(--red),var(--red-dk));
  border-color:var(--red);color:#fff;
  box-shadow:0 3px 12px rgba(232,80,10,.28);
}

/* ══════ TABS ══════ */
.tab-pane{display:none}
.tab-pane.active{display:block;animation:fadeup .3s ease}
@keyframes fadeup{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* ══════ TWO-COL LAYOUT ══════ */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:1100px){.two-col{grid-template-columns:1fr}}

/* ══════ CARD ══════ */
.card{
  background:var(--surf);border:1px solid var(--bdr);
  border-radius:var(--r-xl);box-shadow:var(--sh-sm);
  padding:22px;
}
.card-hd{
  display:flex;align-items:center;gap:12px;
  padding-bottom:14px;border-bottom:2px solid var(--surf2);margin-bottom:18px;
}
.card-icon{
  width:42px;height:42px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;font-size:20px;
  background:linear-gradient(135deg,var(--red),var(--red-dk));
  box-shadow:0 3px 10px rgba(232,80,10,.24);flex-shrink:0;
}
.card-icon.blue{background:linear-gradient(135deg,var(--blue),#003fa0);box-shadow:0 3px 10px rgba(0,85,200,.2)}
.card-icon.teal{background:linear-gradient(135deg,var(--teal),#005e4e);box-shadow:0 3px 10px rgba(0,143,118,.2)}
.card-icon.purple{background:linear-gradient(135deg,#7c3aed,#5b21b6);box-shadow:0 3px 10px rgba(124,58,237,.2)}
.card-title{font-size:1.1rem;font-weight:700;letter-spacing:.2px;text-transform:uppercase;color:var(--t1)}

/* ══════ SECTION HEADINGS ══════ */
.sec-hd{
  font-size:.73rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;
  color:var(--red);border-bottom:1.5px solid #f0cfc0;padding-bottom:6px;margin:20px 0 14px;
  display:flex;align-items:center;gap:7px;
}
.sec-hd.blue{color:var(--blue);border-bottom-color:#c0d5f8}
.sec-hd.teal{color:var(--teal);border-bottom-color:#a0e0d5}
.sec-hd.purple{color:#7c3aed;border-bottom-color:#d4b8fa}

/* ══════ FORM CONTROLS ══════ */
.fg{margin-bottom:12px}
label{
  display:block;font-size:.75rem;font-weight:700;color:var(--t2);
  text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;
}
.irow{display:flex;gap:5px}
.irow input{flex:1;min-width:0}
.u-sel{
  font-family:var(--mono);font-weight:600;color:var(--t2);
  background:var(--surf2);border:1px solid var(--bdr);
  border-radius:5px;padding:3px 2px;font-size:.68rem;
  cursor:pointer;min-width:52px;max-width:80px;
}
.u-sel:focus{outline:1px solid var(--blue);border-color:var(--blue)}
.ulab{
  min-width:66px;padding:8px 8px;
  background:var(--blue-lt);border:1.5px solid #b8ccf5;border-radius:var(--r-sm);
  color:var(--blue);font-family:var(--mono);font-size:.75rem;font-weight:600;
  display:flex;align-items:center;justify-content:center;white-space:nowrap;flex-shrink:0;
}
input[type=number],input[type=text],select,textarea{
  width:100%;padding:8px 10px;
  background:var(--surf2);border:1.5px solid var(--bdr);border-radius:var(--r-sm);
  color:var(--t1);font-family:var(--mono);font-size:.83rem;font-weight:500;
  transition:border-color .2s,box-shadow .2s;
  -webkit-appearance:none;appearance:none;
}
input[type=number]:focus,input[type=text]:focus,select:focus,textarea:focus{
  outline:none;border-color:var(--red);background:#fff;
  box-shadow:0 0 0 3px rgba(232,80,10,.10);
}
select{cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7899' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}

.fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}

/* ══════ BUTTONS ══════ */
.btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:10px 22px;border:none;border-radius:var(--r-md);
  font-family:var(--sans);font-size:.85rem;font-weight:700;
  letter-spacing:.2px;cursor:pointer;transition:all .2s;
  text-transform:uppercase;
}
.btn-calc{
  background:linear-gradient(135deg,var(--red),var(--red-dk));color:#fff;flex:1;
  box-shadow:0 4px 12px rgba(232,80,10,.3);min-height:44px;
}
.btn-calc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(232,80,10,.45)}
.btn-reset{
  background:var(--surf);color:var(--t2);border:1.5px solid var(--bdr);min-height:44px;
}
.btn-reset:hover{border-color:var(--teal);color:var(--teal);background:var(--teal-lt)}

/* ══════ PLACEHOLDER / SPINNER ══════ */
.placeholder{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:60px 20px;text-align:center;color:var(--t3);min-height:300px;
}
.placeholder-icon{font-size:3.5rem;opacity:.2;margin-bottom:14px}
.placeholder h3{font-size:1rem;font-weight:700;color:var(--t2);margin-bottom:5px}
.placeholder p{font-size:.85rem}

.calc-anim{
  display:none;flex-direction:column;align-items:center;
  justify-content:center;padding:60px 20px;text-align:center;min-height:300px;
}
.calc-anim.show{display:flex}
.spinner{
  display:none;
  width:48px;height:48px;border:4px solid var(--bdr);border-top-color:var(--red);
  border-radius:50%;animation:spin .8s linear infinite;margin-bottom:16px;
}
.spinner.show{display:block;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ══════ RESULTS ══════ */
.res-pane{display:none}
.res-pane.show{display:block;animation:fadeup .4s ease}

.res-hd{
  display:flex;align-items:flex-start;justify-content:space-between;
  background:linear-gradient(135deg,var(--blue-lt),#dde8ff);
  padding:14px 16px;border-radius:var(--r-md);border-left:4px solid var(--blue);
  margin-bottom:16px;gap:10px;flex-wrap:wrap;
}
.res-hd-left h3{font-size:1rem;font-weight:700;color:var(--blue);margin-bottom:3px}
.res-meta{font-size:.75rem;color:var(--t3);font-weight:500}

/* Share result button */
.share-result-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 12px;border-radius:20px;font-size:.73rem;font-weight:700;
  background:#7c3aed;color:#fff;border:none;cursor:pointer;transition:all .2s;
  text-transform:uppercase;letter-spacing:.3px;
}
.share-result-btn:hover{background:#6d28d9;transform:translateY(-1px)}

.badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:4px 10px;border-radius:20px;font-size:.72rem;font-weight:700;
  letter-spacing:.3px;text-transform:uppercase;
}
.badge-ok  {background:rgba(27,122,62,.1);color:var(--ok);border:1px solid rgba(27,122,62,.2)}
.badge-warn{background:rgba(179,90,0,.1);color:var(--warn);border:1px solid rgba(179,90,0,.2)}
.badge-err {background:rgba(192,32,26,.1);color:var(--err);border:1px solid rgba(192,32,26,.2)}

/* KPI grid */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px}
.kpi{
  background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--r-md);
  padding:12px 14px;border-top:3px solid var(--bdr2);transition:all .2s;
}
.kpi:hover{box-shadow:var(--sh-sm);background:#fff}
.kpi.red{border-top-color:var(--red)}
.kpi.blue{border-top-color:var(--blue)}
.kpi.teal{border-top-color:var(--teal)}
.kpi.gold{border-top-color:var(--gold)}
.kpi.ok{border-top-color:var(--ok)}
.kpi.warn{border-top-color:var(--warn)}
.kpi.purple{border-top-color:#7c3aed}
.kpi-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:4px}
.kpi-val{font-size:1.4rem;font-weight:700;color:var(--t1);font-family:var(--mono);line-height:1.1}
.kpi-unit{font-size:.73rem;font-weight:600;color:var(--teal);margin-left:2px}

/* Data table */
.dtbl{width:100%;border-collapse:collapse;background:#fff;border-radius:var(--r-md);overflow:hidden;box-shadow:var(--sh-sm);font-size:.83rem}
.dtbl th{background:var(--t1);color:#fff;padding:10px 12px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;font-size:.72rem}
.dtbl td{padding:9px 12px;border-bottom:1px solid var(--bdr);color:var(--t1);font-family:var(--mono);font-size:.83rem;font-weight:500}
.dtbl tr:last-child td{border-bottom:none}
.dtbl tr:hover td{background:var(--surf2)}
.dtbl .lbl-col{font-family:var(--sans);font-weight:700;color:var(--t2);font-size:.78rem}

/* Mobile table scroll */
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:var(--r-md)}

/* Note box */
.note{
  background:linear-gradient(135deg,var(--teal-lt),rgba(0,85,200,.02));
  border:1px solid rgba(0,143,118,.18);border-left:4px solid var(--teal);
  padding:14px 16px;border-radius:var(--r-md);margin-top:14px;
}
.note.warn{background:var(--gold-lt);border-color:rgba(192,120,0,.18);border-left-color:var(--gold)}
.note.err{background:#fff0f0;border-color:rgba(192,32,26,.18);border-left-color:var(--err)}
.note-title{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;display:flex;align-items:center;gap:5px;margin-bottom:7px;color:var(--teal)}
.note.warn .note-title{color:var(--gold)}
.note.err .note-title{color:var(--err)}
.note-body{font-size:.83rem;color:var(--t2);line-height:1.75;font-weight:500}
.note-body ul{margin-left:16px}
.note-body li{margin-bottom:3px}

/* Bar chart */
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.bar-lbl{font-size:.75rem;font-weight:700;color:var(--t2);min-width:120px}
.bar-track{flex:1;min-width:80px;background:var(--surf2);border-radius:4px;height:8px;border:1px solid var(--bdr);overflow:hidden}
.bar-fill{height:100%;border-radius:4px;background:var(--red);transition:width .7s cubic-bezier(.4,0,.2,1)}
.bar-fill.blue{background:var(--blue)}.bar-fill.teal{background:var(--teal)}
.bar-val{font-family:var(--mono);font-size:.75rem;font-weight:700;color:var(--t1);min-width:60px;text-align:right}

/* Balance strip */
.balance-strip{
  display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;
  padding:12px 14px;background:var(--surf2);border-radius:var(--r-md);border:1px solid var(--bdr);
}
.balance-item{font-size:.8rem;font-weight:600;color:var(--t2)}
.balance-item span{display:block;font-family:var(--mono);font-size:.95rem;font-weight:700;color:var(--t1);margin-top:2px}

/* Info boxes */
.info-box{
  background:var(--teal-lt);border:1px solid rgba(0,143,118,.16);
  border-left:4px solid var(--teal);border-radius:var(--r-md);padding:16px 18px;
}
.info-box-title{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--teal);display:flex;align-items:center;gap:7px;margin-bottom:9px}
.info-box-body{font-size:.83rem;color:var(--t2);line-height:1.8;font-weight:500}
.info-box-body strong{color:var(--t1)}
.formula-box{
  font-family:var(--mono);font-size:.78rem;font-weight:600;
  background:rgba(0,143,118,.08);padding:9px 11px;border-radius:var(--r-sm);
  margin:8px 0;line-height:1.7;color:var(--t1);
}

/* Error box */
.err-box{
  display:none;background:#fff5f5;border:1.5px solid rgba(192,32,26,.22);
  border-left:4px solid var(--err);border-radius:var(--r-md);padding:10px 14px;
  margin-top:10px;font-size:.83rem;font-weight:600;color:var(--err);
}
.err-box.show{display:flex;align-items:center;gap:7px}

/* Modal */
.modal-backdrop{
  display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);
  z-index:2000;align-items:center;justify-content:center;padding:16px;
}
.modal-backdrop.open{display:flex}
.modal{
  background:#fff;border-radius:var(--r-xl);padding:28px;
  max-width:560px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.18);
  border:1px solid var(--bdr);animation:fadeup .25s ease;
  max-height:90vh;overflow-y:auto;
}
.modal-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.modal-hd h2{font-size:1.1rem;font-weight:700;color:var(--red)}
.modal-close{background:none;border:none;font-size:1.5rem;color:var(--t3);cursor:pointer;line-height:1;padding:4px 8px;border-radius:var(--r-sm)}
.modal-close:hover{background:var(--surf2);color:var(--t1)}
.modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}

/* Share Modal */
.share-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}
.share-platform{
  display:flex;flex-direction:column;align-items:center;gap:7px;
  padding:14px;background:var(--surf2);border:1.5px solid var(--bdr);
  border-radius:var(--r-md);cursor:pointer;transition:all .2s;text-decoration:none;
  font-size:.8rem;font-weight:700;color:var(--t2);
}
.share-platform:hover{transform:translateY(-2px);box-shadow:var(--sh-md);border-color:var(--bdr2);color:var(--t1)}
.share-platform .sp-icon{font-size:1.8rem}
.share-platform.linkedin:hover{border-color:#0077b5;color:#0077b5;background:#e8f4fd}
.share-platform.twitter:hover{border-color:#000;color:#000;background:#f0f0f0}
.share-platform.whatsapp:hover{border-color:#25d366;color:#25d366;background:#e8f9ec}
.share-platform.email:hover{border-color:var(--red);color:var(--red);background:var(--red-lt)}
.share-platform.copy:hover{border-color:var(--teal);color:var(--teal);background:var(--teal-lt)}
.share-platform.telegram:hover{border-color:#0088cc;color:#0088cc;background:#e3f6ff}
.share-url-box{
  display:flex;gap:8px;align-items:center;margin-top:12px;
  padding:12px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:var(--r-md);
}
.share-url-box input{flex:1;background:transparent;border:none;font-family:var(--mono);font-size:.8rem;color:var(--t2);padding:0;outline:none}
.share-url-copy{
  padding:5px 12px;border-radius:var(--r-sm);background:var(--teal);color:#fff;
  border:none;cursor:pointer;font-size:.75rem;font-weight:700;font-family:var(--sans);transition:all .2s;
}
.share-url-copy:hover{background:#006b58}

/* HX Selector Tab */
.selector-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.hx-card{
  background:var(--surf2);border:2px solid var(--bdr);border-radius:var(--r-lg);
  padding:18px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden;
}
.hx-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--red),var(--blue));opacity:0;transition:opacity .25s;
}
.hx-card:hover{border-color:var(--red);box-shadow:var(--sh-md);transform:translateY(-2px)}
.hx-card:hover::before{opacity:1}
.hx-card-icon{font-size:2rem;margin-bottom:10px}
.hx-card-title{font-size:.95rem;font-weight:700;color:var(--t1);margin-bottom:6px}
.hx-card-desc{font-size:.8rem;color:var(--t3);line-height:1.6}
.hx-card-badge{
  display:inline-flex;margin-top:10px;padding:3px 10px;border-radius:20px;
  font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
  background:var(--red-lt);color:var(--red);border:1px solid rgba(232,80,10,.2);
}

/* ══════ MATERIAL SELECTION HELPER ══════ */
.mat-info{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;
  margin-top:10px;
}
.mat-chip{
  padding:8px 10px;background:var(--surf2);border:1px solid var(--bdr);
  border-radius:var(--r-sm);font-size:.75rem;color:var(--t2);font-weight:500;
}
.mat-chip strong{display:block;font-size:.78rem;color:var(--t1);margin-bottom:2px}

/* ══════ PRINT STYLES ══════ */
@media print{
  .hdr-controls,.nav-wrap,.btn-row,.share-result-btn{display:none!important}
  .card{break-inside:avoid;box-shadow:none!important;border:1px solid #ccc}
  body{background:#fff}
}

/* ══════ RESPONSIVE ══════ */
@media(max-width:768px){
  .wrap{padding:10px 10px}
  .card{padding:14px}
  .hdr{padding:12px 14px;gap:10px}
  .hdr-title{font-size:1.2rem}
  .hdr-controls{gap:6px}
  .hdr-btn{padding:6px 10px;font-size:.72rem}
  .fgrid{grid-template-columns:1fr 1fr}
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  .btn-row{flex-direction:column}
  .btn{width:100%}
  .kpi-val{font-size:1.2rem}
  .balance-strip{grid-template-columns:1fr}
  .share-modal-grid{grid-template-columns:1fr 1fr}
  .modal-grid{grid-template-columns:1fr}
  .selector-grid{grid-template-columns:1fr}
}
@media(max-width:460px){
  .fgrid{grid-template-columns:1fr}
  .kpi-grid{grid-template-columns:1fr}
  .share-modal-grid{grid-template-columns:1fr 1fr}
  .irow{flex-wrap:wrap}
  .irow input{min-width:0;width:100%}
  .ulab{min-width:50px;font-size:.68rem}
}

/* ══════ TOOLTIP ══════ */
.tip{position:relative;cursor:help}
.tip::after{
  content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);
  background:#1a2035;color:#fff;padding:5px 10px;border-radius:6px;font-size:.72rem;font-weight:500;
  white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .2s;z-index:100;font-family:var(--sans);
}
.tip:hover::after{opacity:1}

/* ══════ QUICK GUIDE ══════ */
.quick-guide{
  background:linear-gradient(135deg,#1a2035,#0c1322);
  border-radius:var(--r-xl);padding:20px 24px;margin-bottom:16px;
  color:#fff;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;
  border:1px solid rgba(255,255,255,.05);
}
.qg-step{display:flex;gap:12px;align-items:flex-start}
.qg-num{
  width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-dk));
  display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;
  flex-shrink:0;color:#fff;
}
.qg-text h4{font-size:.85rem;font-weight:700;margin-bottom:3px;color:#e2e8f0}
.qg-text p{font-size:.75rem;color:#94a3b8;line-height:1.5}

/* ══════ FLUIDS COMPARE PANEL ══════ */
.fluid-compare{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;
  margin-top:12px;
}
.fluid-prop{
  padding:10px 12px;background:var(--surf2);border:1px solid var(--bdr);
  border-radius:var(--r-sm);font-size:.78rem;
}
.fluid-prop-label{color:var(--t3);font-weight:600;font-size:.68rem;text-transform:uppercase;letter-spacing:.4px}
.fluid-prop-val{font-family:var(--mono);font-weight:700;color:var(--t1);font-size:.9rem;margin-top:2px}

/* ══════ SENSITIVITY SECTION ══════ */
.sens-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:10px}
.sens-item{
  padding:12px 14px;background:var(--surf2);border:1px solid var(--bdr);
  border-radius:var(--r-md);
}
.sens-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--t3);margin-bottom:6px}
.sens-val{font-family:var(--mono);font-weight:700;font-size:1rem;color:var(--t1)}
</style>
</head>
<body>
<div class="wrap">

<!-- ═══ HEADER ═══ -->
<header class="hdr">
<div class="hdr-brand">
    <div class="hdr-icon">🔥</div>
    <div>
      <div class="hdr-title">HeatXpert Pro <span class="hdr-version">v7.0</span></div>
      <div class="hdr-sub">Heat Exchanger Design &amp; Analysis</div>
    </div>
  </div>
  <div class="hdr-controls">
    <a href="https://multicalci.com/" class="hdr-btn" style="background:var(--surf2);border:1.5px solid var(--bdr2);color:var(--t2);text-decoration:none;box-shadow:none" title="Back to multicalci.com">🏠 Home</a>
    <div class="unit-toggle">
      <button class="unit-btn active" data-sys="metric" onclick="setUnit('metric',this)">SI</button>
      <button class="unit-btn" data-sys="imperial" onclick="setUnit('imperial',this)">US</button>
    </div>
    <button class="hdr-btn btn-share" onclick="openShareModal()">🔗 Share</button>
    <button class="hdr-btn btn-teal" onclick="openCompareModal()">⚖️ Compare</button>
    <button class="hdr-btn btn-blue" onclick="genPDF()">⬇ PDF</button>
  </div>
</header>

<!-- ═══ QUICK GUIDE ═══ -->
<div class="quick-guide" id="quickGuide">
  <div class="qg-step"><div class="qg-num">1</div><div class="qg-text"><h4>Select HX Type</h4><p>Choose from Shell & Tube, Plate, Air Cooled, or Double Pipe</p></div></div>
  <div class="qg-step"><div class="qg-num">2</div><div class="qg-text"><h4>Enter Parameters</h4><p>Set temperatures, flow rates, fluid types, and geometry</p></div></div>
  <div class="qg-step"><div class="qg-num">3</div><div class="qg-text"><h4>Calculate & Review</h4><p>Get duty, area, U, NTU, pressure drop, and design recommendations</p></div></div>
  <div class="qg-step"><div class="qg-num">4</div><div class="qg-text"><h4>Export & Share</h4><p>Download PDF report or share results via social media</p></div></div>
</div>

<!-- ═══ NAV TABS ═══ -->
<div class="nav-wrap">
  <nav class="nav-tabs" id="navTabs">
    <button class="nav-tab active" data-tab="shell-tube"  onclick="switchTab('shell-tube',this)">⚙️ Shell &amp; Tube</button>
    <button class="nav-tab" data-tab="plate"       onclick="switchTab('plate',this)">🔲 Plate HX</button>
    <button class="nav-tab" data-tab="air-cooled"  onclick="switchTab('air-cooled',this)">💨 Air Cooled</button>
    <button class="nav-tab" data-tab="fin-fan"     onclick="switchTab('fin-fan',this)">🌬️ Fin-Fan HX</button>
    <button class="nav-tab" data-tab="double-pipe" onclick="switchTab('double-pipe',this)">↔️ Double Pipe</button>
    <button class="nav-tab" data-tab="lmtd"        onclick="switchTab('lmtd',this)">📐 LMTD / NTU</button>
    <button class="nav-tab" data-tab="wall-thick"  onclick="switchTab('wall-thick',this)">🔩 Wall Thickness</button>
    <button class="nav-tab" data-tab="fouling"     onclick="switchTab('fouling',this)">🧫 Fouling DB</button>
    <button class="nav-tab" data-tab="selector"    onclick="switchTab('selector',this)">🎯 HX Selector</button>
    <button class="nav-tab" data-tab="defs"        onclick="switchTab('defs',this)">📚 Reference</button>
  </nav>
</div>

<!-- ══════════════════════════════════════════════
     TAB 1 — SHELL & TUBE
══════════════════════════════════════════════ -->
<div id="tab-shell-tube" class="tab-pane active">
  <div class="two-col">
    <div class="card">
      <div class="card-hd">
        <div class="card-icon">⚙️</div>
        <div class="card-title">Shell &amp; Tube — Design Inputs</div>
      </div>
      <form id="stForm" novalidate>
        <div class="sec-hd">⚙ Configuration</div>
        <div class="fgrid">
          <div class="fg"><label>HX Type</label>
            <select id="st_type">
              <option value="1-1">1-1 (1 Shell, 1 Pass)</option>
              <option value="1-2" selected>1-2 (1 Shell, 2 Passes)</option>
              <option value="1-4">1-4 (1 Shell, 4 Passes)</option>
              <option value="1-6">1-6 (1 Shell, 6 Passes)</option>
              <option value="2-4">2-4 (2 Shells, 4 Passes)</option>
            </select>
          </div>
          <div class="fg"><label>Flow Arrangement</label>
            <select id="st_flow">
              <option value="counter" selected>Countercurrent</option>
              <option value="parallel">Parallel Flow</option>
              <option value="cross1">Crossflow</option>
            </select>
          </div>
          <div class="fg"><label class="tip" data-tip="Single-phase: standard sensible heat transfer. Condensing: Nusselt film condensation on tube side. Evaporating: Chen correlation for flow boiling on tube side.">Thermal Mode</label>
            <select id="st_shellMode" onchange="onShellModeChange()">
              <option value="single-phase" selected>Single Phase (sensible heat)</option>
              <option value="condensing">Condensing (tube-side)</option>
              <option value="evaporating">Evaporating / Boiling (tube-side)</option>
            </select>
          </div>
        </div>
        <div id="st_phaseNote" style="display:none;padding:7px 12px;border-radius:7px;margin-bottom:10px;
             font-size:.76rem;font-weight:600;background:var(--gold-lt);border:1.5px solid rgba(192,120,0,.25);color:var(--gold)">
          🌡️ <span id="st_phaseNoteText"></span>
        </div>

        <div class="sec-hd" style="color:var(--red);border-bottom-color:#f0cfc0">🔴 Hot Side (Shell)</div>
        <div class="fgrid">
          <div class="fg"><label>Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="st_hTi" step="0.1" value="120" required oninput="coldBalancePreview()"><select id="st_hTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('st_hTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg" id="hotToGroup">
            <label>Outlet Temp <span id="hotToMode" style="font-size:.65rem;color:var(--red);font-style:italic">(enter value)</span> (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="st_hTo" step="0.1" value="60" required oninput="coldBalancePreview()"><select id="st_hTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('st_hTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg" id="hotFlowGroup">
            <label>Flow Rate <span id="hotFlowMode" style="font-size:.65rem;color:var(--red);font-style:italic">← enter value</span></label>
            <div class="irow" style="gap:4px">
              <input type="number" id="st_hF" step="1" value="5000" required style="flex:1;min-width:0" oninput="coldBalancePreview()">
              <select id="st_hFunit" onchange="updateFlowUnit('st_hFunit','st_hFulab')" style="width:90px;padding:6px 4px;font-size:.73rem">
                <option value="kgh">kg/h</option>
                <option value="nm3h">Nm³/h</option>
                <option value="sm3h">Sm³/h</option>
              </select>
            </div>
            <div id="st_hFulab" style="font-size:.68rem;color:var(--t3);margin-top:2px">Mass flow in kg/h</div>
          </div>
          <div class="fg"><label>Fluid</label><select id="st_hFl" onchange="fluidChange('st_hFl');coldBalancePreview();autoTubeSpecs()" data-fluid></select></div>
          <div class="fg">
            <label class="tip" data-tip="Operating pressure for gas density correction (ideal gas law). Ignored for liquids.">
              Operating Pressure <span id="st_hPgasTag" style="font-size:.63rem;color:var(--blue);font-style:italic;font-weight:600"></span>
            </label>
            <div class="irow">
              <input type="number" id="st_hPop" value="1.01325" step="0.1" min="0.01" max="500" oninput="autoTubeSpecs()">
              <select id="st_hPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('st_hPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select>
            </div>
            <div id="st_hPoplabel" style="font-size:.68rem;color:var(--t3);margin-top:2px">Shell-side operating pressure (absolute)</div>
          </div>
        </div>

        <div class="sec-hd" style="color:var(--teal);border-bottom-color:#a0e0d5;flex-wrap:wrap;gap:6px">
          🔵 Cold Side (Tube)
          <span style="margin-left:auto;display:flex;gap:4px;flex-shrink:0">
            <button type="button" id="coldModeFlowBtn" onclick="setColdMode('flow')"
              style="padding:4px 11px;border-radius:6px;border:1.5px solid var(--teal);
                     background:var(--teal);color:#fff;font-size:.7rem;font-weight:700;cursor:pointer;white-space:nowrap">
              ✦ Know Flow → Auto T<sub>out</sub>
            </button>
            <button type="button" id="coldModeTempBtn" onclick="setColdMode('temp')"
              style="padding:4px 11px;border-radius:6px;border:1.5px solid var(--teal);
                     background:transparent;color:var(--teal);font-size:.7rem;font-weight:700;cursor:pointer;white-space:nowrap">
              ✦ Know T<sub>out</sub> → Auto Flow
            </button>
          </span>
        </div>
        <div id="coldModeHint" style="font-size:.72rem;padding:6px 10px;border-radius:6px;
             margin-bottom:10px;background:var(--teal-lt);border:1px solid rgba(0,143,118,.2)">
          ✅ <strong>Mode: Know Flow Rate</strong> — enter cold flow rate; outlet temp will be auto-calculated from Q<sub>hot</sub> = Q<sub>cold</sub>.
        </div>
        <div class="fgrid">
          <div class="fg">
            <label>Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="st_cTi" step="0.1" value="30"
              oninput="coldBalancePreview()"><select id="st_cTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('st_cTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg" id="coldToGroup">
            <label id="coldToLabel">Outlet Temp <span id="coldToMode" style="font-size:.65rem;
              color:var(--teal);font-style:italic">(auto-calculated)</span></label>
            <div class="irow">
              <input type="number" id="st_cTo" step="0.01" placeholder="auto"
                style="flex:1;background:var(--surf2);border-style:dashed;
                       color:var(--t3);font-style:italic" readonly>
              <select id="st_cTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('st_cTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid rgba(0,143,118,.3);background:var(--teal-lt);color:var(--teal);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select>
            </div>
          </div>
          <div class="fg" id="coldFlowGroup">
            <label id="coldFlowLabel">Flow Rate <span id="coldFlowMode" style="font-size:.65rem;
              color:var(--teal);font-style:italic">← enter value</span></label>
            <div class="irow" style="gap:4px">
              <input type="number" id="st_cF" step="1" value="8000" oninput="coldBalancePreview()"
                style="flex:1;min-width:0">
              <select id="st_cFunit" onchange="updateFlowUnit('st_cFunit','st_cFulab')"
                style="width:90px;padding:6px 4px;font-size:.73rem">
                <option value="kgh">kg/h</option>
                <option value="nm3h">Nm³/h</option>
                <option value="sm3h">Sm³/h</option>
              </select>
            </div>
            <div id="st_cFulab" style="font-size:.68rem;color:var(--t3);margin-top:2px">Mass flow in kg/h</div>
          </div>
          <div class="fg">
            <label>Fluid</label>
            <select id="st_cFl" onchange="fluidChange('st_cFl');coldBalancePreview();autoTubeSpecs()" data-fluid></select>
          </div>
          <div class="fg">
            <label class="tip" data-tip="Operating pressure for gas density correction (ideal gas law). Ignored for liquids.">
              Operating Pressure <span id="st_cPgasTag" style="font-size:.63rem;color:var(--blue);font-style:italic;font-weight:600"></span>
            </label>
            <div class="irow">
              <input type="number" id="st_cPop" value="1.01325" step="0.1" min="0.01" max="500" oninput="autoTubeSpecs();coldBalancePreview()">
              <select id="st_cPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('st_cPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select>
            </div>
            <div id="st_cPoplabel" style="font-size:.68rem;color:var(--t3);margin-top:2px">Tube-side operating pressure (absolute)</div>
          </div>
        </div>
        <div id="coldBalanceBox" style="display:none;padding:7px 12px;border-radius:7px;
             margin-top:-4px;margin-bottom:10px;font-size:.78rem;font-weight:600;
             border:1.5px solid;transition:all .2s"></div>

        <div class="sec-hd blue">🔧 Tube Specifications</div>
        <div style="background:var(--blue-lt);border:1.5px solid rgba(0,85,200,.15);border-radius:var(--r-md);
             padding:9px 12px;margin-bottom:10px;font-size:.72rem;color:var(--blue);font-weight:600">
          ⚙ Tube ID and pass count are <strong>auto-calculated</strong> from flow rate + target velocity + tube length.
          Override any field manually — changes trigger instant recalculation.
        </div>

        <!-- ── Tube Standard Selector ─────────────────────────────────────── -->
        <div style="margin-bottom:10px;padding:10px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px">
          <div style="font-size:.73rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t2);margin-bottom:8px">
            📐 Select Standard Tube Size <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--t3)">(auto-fills OD &amp; wall thickness — override below if needed)</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
            <div style="flex:1;min-width:160px">
              <label style="font-size:.7rem;color:var(--t3);font-weight:600;display:block;margin-bottom:3px">Standard</label>
              <select id="st_tube_std" onchange="onTubeStdChange()" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--bdr);background:var(--surf);font-size:.8rem">
                <option value="">— Manual entry —</option>
                <optgroup label="TEMA / HEDH Standard (mm)">
                  <option value="tema_12.7_1.2">12.7mm OD × 1.2mm WT (1/2" TEMA)</option>
                  <option value="tema_15.88_1.2">15.88mm OD × 1.2mm WT (5/8" TEMA)</option>
                  <option value="tema_19.05_1.6">19.05mm OD × 1.6mm WT (3/4" TEMA)</option>
                  <option value="tema_25.4_2.0" selected>25.4mm OD × 2.0mm WT (1" TEMA) ← default</option>
                  <option value="tema_31.75_2.0">31.75mm OD × 2.0mm WT (1¼" TEMA)</option>
                  <option value="tema_38.1_2.6">38.1mm OD × 2.6mm WT (1½" TEMA)</option>
                  <option value="tema_50.8_3.0">50.8mm OD × 3.0mm WT (2" TEMA)</option>
                </optgroup>
                <optgroup label="BWG (Birmingham Wire Gauge) — inch tubes">
                  <option value="bwg_19.05_bwg14">19.05mm OD × 2.11mm WT (3/4" BWG 14)</option>
                  <option value="bwg_19.05_bwg16">19.05mm OD × 1.65mm WT (3/4" BWG 16)</option>
                  <option value="bwg_25.4_bwg14">25.4mm OD × 2.11mm WT (1" BWG 14)</option>
                  <option value="bwg_25.4_bwg16">25.4mm OD × 1.65mm WT (1" BWG 16)</option>
                  <option value="bwg_25.4_bwg18">25.4mm OD × 1.24mm WT (1" BWG 18)</option>
                  <option value="bwg_31.75_bwg14">31.75mm OD × 2.11mm WT (1¼" BWG 14)</option>
                  <option value="bwg_38.1_bwg12">38.1mm OD × 2.77mm WT (1½" BWG 12)</option>
                </optgroup>
                <optgroup label="ANSI Pipe Schedule (as tube)">
                  <option value="ansi_21.3_sch40">21.3mm OD × 2.77mm WT (3/4" NPS Sch 40)</option>
                  <option value="ansi_26.67_sch40">26.67mm OD × 2.87mm WT (1" NPS Sch 40)</option>
                  <option value="ansi_33.4_sch40">33.4mm OD × 3.38mm WT (1¼" NPS Sch 40)</option>
                  <option value="ansi_42.16_sch40">42.16mm OD × 3.56mm WT (1½" NPS Sch 40)</option>
                  <option value="ansi_26.67_sch80">26.67mm OD × 3.91mm WT (1" NPS Sch 80)</option>
                  <option value="ansi_33.4_sch80">33.4mm OD × 4.55mm WT (1¼" NPS Sch 80)</option>
                </optgroup>
                <optgroup label="DIN EN 10216 (metric seamless)">
                  <option value="din_20_2">20mm OD × 2.0mm WT (DIN 20×2)</option>
                  <option value="din_25_2">25mm OD × 2.0mm WT (DIN 25×2)</option>
                  <option value="din_25_2.5">25mm OD × 2.5mm WT (DIN 25×2.5)</option>
                  <option value="din_30_2">30mm OD × 2.0mm WT (DIN 30×2)</option>
                  <option value="din_38_2.5">38mm OD × 2.5mm WT (DIN 38×2.5)</option>
                </optgroup>
              </select>
            </div>
            <div style="font-size:.72rem;color:var(--t3);padding-bottom:8px">
              ID = <strong id="st_tube_id_display">21.4 mm</strong>
              &nbsp;|&nbsp; t/OD = <strong id="st_tube_ratio_display">7.9%</strong>
            </div>
          </div>
        </div>
        <div class="fgrid">
          <div class="fg">
            <label class="tip" data-tip="Auto-calculated from flow/velocity. Standard: 16, 19.05, 25.4, 31.75, 38.1 mm OD">
              Outer Diameter (mm) <span id="odAutoTag" style="font-size:.63rem;color:var(--blue);
              font-style:italic;font-weight:600">(auto)</span>
            </label>
            <div class="irow">
              <input type="number" id="st_od" value="25.4" step="0.1" min="6" max="80"
                oninput="document.getElementById('odAutoTag').textContent='(manual)';
                         document.getElementById('odAutoTag').style.color='var(--warn)';onTubeGeomChange()">
              <select id="st_od_usel" class="u-sel u-dim-sel" onchange="onDimUnitChange2('st_od',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="mm" selected>mm</option>
<option value="cm">cm</option>
<option value="in">in</option>
</select>
            </div>
          </div>
          <div class="fg">
            <label>Wall Thickness (mm)</label>
            <div class="irow"><input type="number" id="st_tw" value="2.0" step="0.1" min="0.5" max="10"
              oninput="autoTubeSpecs()"><select id="st_tw_usel" class="u-sel u-dim-sel" onchange="onDimUnitChange2('st_tw',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="mm" selected>mm</option>
<option value="cm">cm</option>
<option value="in">in</option>
</select></div>
          </div>
          <div class="fg">
            <label>Tube Length (m)
              <span style="font-size:.63rem;color:var(--t3);font-weight:500"> ↓ shorter → more passes</span>
            </label>
            <div class="irow"><input type="number" id="st_len" value="6" step="0.5" min="0.5" max="20"
              oninput="autoTubeSpecs()"><select id="st_len_usel" class="u-sel u-len-sel" onchange="onLenUnitChange('st_len',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="m" selected>m</option>
<option value="ft">ft</option>
</select></div>
          </div>
          <div class="fg">
            <label class="tip" data-tip="Typical: 1.25 (square), 1.25–1.5 (triangular)">Pitch / OD Ratio</label>
            <div class="irow"><input type="number" id="st_pitch" value="1.25" step="0.01" min="1.15" max="1.5"><div class="ulab">—</div></div>
          </div>
          <div class="fg">
            <label class="tip" data-tip="Triangular (30°): higher HTC, lower fouling access. Square (90°): easier cleaning, lower ΔP.">Pitch Layout</label>
            <select id="st_pitchlayout">
              <option value="triangular" selected>Triangular (30°) — higher HTC</option>
              <option value="square">Square (90°) — easier cleaning</option>
              <option value="rotated">Rotated Square (45°)</option>
            </select>
          </div>
          <div class="fg">
            <label>Tube Material</label>
            <select id="st_mat">
              <option value="cs">Carbon Steel (k=50 W/mK)</option>
              <option value="ss304" selected>SS 304 (k=16 W/mK)</option>
              <option value="ss316">SS 316 (k=14 W/mK)</option>
              <option value="copper">Copper (k=385 W/mK)</option>
              <option value="titanium">Titanium (k=21 W/mK)</option>
              <option value="inconel">Inconel 625 (k=10 W/mK)</option>
            </select>
          </div>
          <div class="fg">
            <label class="tip" data-tip="Shell-side (outside tube) fouling resistance Rfo (m²K/W). TEMA RGP-T-2.4: water 0.0001–0.0002, light HC 0.0002, heavy HC 0.0004, steam 0.0001.">Shell-Side Fouling R<sub>fo</sub> (m²K/W)</label>
            <div class="irow"><input type="number" id="st_foulS" value="0.0002" step="0.00001" min="0"><div class="ulab">—</div></div>
          </div>
          <div class="fg">
            <label class="tip" data-tip="Tube-side (inside tube) fouling resistance Rfi (m²K/W). TEMA RGP-T-2.4: cooling water 0.0002, river water 0.0004, seawater 0.0001, clean HC 0.0002.">Tube-Side Fouling R<sub>fi</sub> (m²K/W)</label>
            <div class="irow"><input type="number" id="st_foulT" value="0.0002" step="0.00001" min="0"><div class="ulab">—</div></div>
          </div>
        </div>
        <!-- Auto tube spec result box -->
        <div id="tubeAutoBox" style="display:none;padding:8px 12px;border-radius:7px;
             margin-top:-4px;margin-bottom:10px;font-size:.76rem;background:var(--blue-lt);
             border:1.5px solid rgba(0,85,200,.2);color:var(--t1);line-height:1.8"></div>

        <div class="sec-hd teal">🎯 Tube-Side Velocity Control</div>
        <div style="background:var(--teal-lt);border:1.5px solid rgba(0,143,118,.2);border-radius:var(--r-md);padding:12px 14px;margin-bottom:14px">
          <div style="font-size:.75rem;font-weight:700;color:var(--teal);margin-bottom:8px">
            ▸ The tool calculates number of tube passes to meet your target velocity.
            Recommended: 1–2 m/s (liquids) · 10–25 m/s (gases/steam). Gas density is corrected for actual T &amp; P.
          </div>
          <div class="fgrid" style="margin-bottom:0">
            <div class="fg" style="margin-bottom:0">
              <label>Target Tube Velocity</label>
              <div class="irow">
                <input type="number" id="st_targetVel" value="1.5" step="0.1" min="0.1" max="30" style="flex:1" oninput="updateVelHint();autoTubeSpecs()">
                <div class="ulab" style="background:var(--teal-lt);border-color:rgba(0,143,118,.3);color:var(--teal)">m/s</div>
              </div>
            </div>
            <div class="fg" style="margin-bottom:0">
              <label>Velocity Mode</label>
              <select id="st_velMode" onchange="onVelModeChange()">
                <option value="target" selected>🎯 Target velocity (auto-calc passes)</option>
                <option value="manual">✏️ Manual (use HX type passes)</option>
                <option value="fixedtubes">🔢 Fix No. of Tubes (calc velocity)</option>
              </select>
            </div>
            <div class="fg" style="margin-bottom:0">
              <label>Velocity Range</label>
              <select id="st_velPreset" onchange="applyVelPreset()">
                <option value="">— Quick Presets —</option>
                <option value="0.5">0.5 m/s  (viscous liquid, min)</option>
                <option value="1.0">1.0 m/s  (liquid, conservative)</option>
                <option value="1.5">1.5 m/s  (liquid, recommended ✓)</option>
                <option value="2.5">2.5 m/s  (liquid, aggressive)</option>
                <option value="10">10 m/s  (gas/vapour)</option>
                <option value="20">20 m/s  (steam/hot gas)</option>
              </select>
            </div>
            <div class="fg" style="margin-bottom:0" id="fixedTubesGroup" style="display:none">
              <label class="tip" data-tip="Override tube count. Resultant velocity will be calculated and shown.">No. of Tubes (override)</label>
              <div class="irow">
                <input type="number" id="st_numTubesFixed" value="" step="1" min="1" max="10000" placeholder="e.g. 100" style="flex:1" oninput="autoTubeSpecs()">
                <div class="ulab" style="background:var(--teal-lt);border-color:rgba(0,143,118,.3);color:var(--teal)">tubes</div>
              </div>
            </div>
          </div>
          <div id="st_velHint" style="font-size:.7rem;color:var(--teal);margin-top:6px;font-style:italic">
            ✓ Target: 1.5 m/s → auto-calculating required tube passes
          </div>
        </div>

        <div class="sec-hd blue">🛡️ Baffle & Shell</div>
        <div class="fgrid">
          <div class="fg"><label>Baffle Cut (%)</label>
            <div class="irow"><input type="number" id="st_bcut" value="25" step="1" min="15" max="45"><div class="ulab">%</div></div>
          </div>
          <div class="fg"><label>Baffle Spacing Ratio</label>
            <div class="irow"><input type="number" id="st_bsp" value="0.5" step="0.05" min="0.2" max="1.0"><div class="ulab">—</div></div>
          </div>
          <div class="fg"><label>Design Pressure (bar)</label>
            <div class="irow"><input type="number" id="st_pdes" value="10" step="0.5"><div class="ulab">bar</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Maximum allowable shell-side pressure drop. Flagged if calculated ΔP exceeds this.">Allow. Shell ΔP</label>
            <div class="irow"><input type="number" id="st_pdAllowShell" value="0.70" step="0.05" min="0.01"><select id="st_pdAllowShell_usel" class="u-sel u-pdrop-sel" onchange="onPresUnitChange('st_pdAllowShell',this.value)" style="width:68px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar</option>
<option value="kpa">kPa</option>
<option value="psi">psi</option>
</select></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Maximum allowable tube-side pressure drop. Flagged if calculated ΔP exceeds this.">Allow. Tube ΔP</label>
            <div class="irow"><input type="number" id="st_pdAllowTube" value="1.00" step="0.05" min="0.01"><select id="st_pdAllowTube_usel" class="u-sel u-pdrop-sel" onchange="onPresUnitChange('st_pdAllowTube',this.value)" style="width:68px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar</option>
<option value="kpa">kPa</option>
<option value="psi">psi</option>
</select></div>
          </div>
          <div class="fg"><label>TEMA Class</label>
            <select id="st_tema">
              <option value="R">Class R (Petroleum)</option>
              <option value="C" selected>Class C (Commercial)</option>
              <option value="B">Class B (Chemical)</option>
            </select>
          </div>
        </div>

        <!-- ── FIX 5: Space Constraint Inputs (plant layout enforcement) ─── -->
        <div style="margin-top:10px;padding:10px 14px;background:var(--gold-lt);border:1px solid rgba(192,120,0,.2);border-left:3px solid var(--gold);border-radius:8px">
          <div style="font-size:.73rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gold);margin-bottom:8px">
            📐 Plant Space Constraints <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--t3)">(optional — leave blank for no limit)</span>
          </div>
          <div class="fgrid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
            <div class="fg"><label class="tip" data-tip="Maximum available tube length (horizontal or vertical bay limit). Design enforces L ≤ this value.">Max Tube Length (m)</label>
              <div class="irow"><input type="number" id="st_L_max" placeholder="e.g. 6" step="0.5" min="0.5"><div class="ulab">m</div></div>
            </div>
            <div class="fg"><label class="tip" data-tip="Maximum available shell outer diameter (rack or skid width limit). Warning triggered if shell exceeds this.">Max Shell OD (mm)</label>
              <div class="irow"><input type="number" id="st_shell_OD_max" placeholder="e.g. 1000" step="25" min="100"><div class="ulab">mm</div></div>
            </div>
          </div>
        </div>

        <div id="st_err" class="err-box">⚠ <span id="st_err_txt"></span></div>
        <div class="btn-row">
          <button type="submit" class="btn btn-calc">🧮 Calculate Design</button>
          <button type="button" class="btn btn-reset" onclick="resetForm('st')">↺ Reset</button>
        </div>
      </form>
    </div>
    <div class="card">
      <div id="st_ph" class="placeholder">
        <div class="placeholder-icon">📊</div>
        <h3>Ready to Design</h3>
        <p>Enter parameters and click Calculate</p>
      </div>
      <div id="st_spin" class="calc-anim"><div class="spinner"></div><p style="font-size:.85rem;color:var(--t2);font-weight:600">Calculating heat transfer coefficients…</p></div>
      <div id="st_res" class="res-pane"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB 2 — PLATE HX
══════════════════════════════════════════════ -->
<div id="tab-plate" class="tab-pane">
  <div class="two-col">
    <div class="card">
      <div class="card-hd"><div class="card-icon blue">🔲</div><div class="card-title">Plate HX — Design Inputs</div></div>
      <form id="plForm" novalidate>

        <div class="sec-hd" style="color:var(--red);border-bottom-color:#f0cfc0">🔴 Hot Side</div>
        <div class="fgrid">
          <div class="fg"><label>Fluid</label><select id="pl_hFl" onchange="fluidChange('pl_hFl');plUpdateColdOutlet();plUpdateColdFlow();" data-fluid></select></div>
          <div class="fg"><label class="tip" data-tip="Operating pressure for gas density correction (ideal gas + Z). Ignored for liquids.">Op. Pressure (bar abs)</label>
            <div class="irow"><input type="number" id="pl_hPop" value="1.01325" step="0.1" min="0.01"><select id="pl_hPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('pl_hPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select></div>
          </div>
          <div class="fg"><label>Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="pl_hTi" step="0.1" value="80" required oninput="plUpdateColdOutlet();plUpdateColdFlow();"><select id="pl_hTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('pl_hTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Outlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="pl_hTo" step="0.1" value="45" required oninput="plUpdateColdOutlet();plUpdateColdFlow();"><select id="pl_hTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('pl_hTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Flow Rate</label>
            <div class="irow">
              <input type="number" id="pl_hF" step="1" value="3000" required oninput="plUpdateColdOutlet();plUpdateColdFlow();">
              <select id="pl_hFunit" onchange="updateFlowUnit('pl_hFunit','pl_hFlab');plUpdateColdOutlet();" style="width:100px;font-size:.78rem">
                <option value="kgh">kg/h</option>
                <option value="nm3h">Nm³/h</option>
                <option value="sm3h">Sm³/h</option>
              </select>
            </div>
            <div id="pl_hFlab" style="font-size:.7rem;color:var(--t3);margin-top:2px"></div>
          </div>
        </div>

        <div class="sec-hd" style="color:var(--teal);border-bottom-color:#a0e0d5">🔵 Cold Side</div>
        <div class="fgrid">
          <div class="fg"><label>Fluid</label><select id="pl_cFl" onchange="fluidChange('pl_cFl');plUpdateColdOutlet();plUpdateColdFlow();" data-fluid></select></div>
          <div class="fg"><label class="tip" data-tip="Operating pressure for gas density correction. Ignored for liquids.">Op. Pressure (bar abs)</label>
            <div class="irow"><input type="number" id="pl_cPop" value="1.01325" step="0.1" min="0.01"><select id="pl_cPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('pl_cPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select></div>
          </div>
          <div class="fg"><label>Cold Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="pl_cTi" step="0.1" value="20" required oninput="plUpdateColdOutlet();plUpdateColdFlow();"><select id="pl_cTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('pl_cTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg">
            <label>Cold Side Mode</label>
            <select id="pl_coldMode" onchange="plToggleColdMode()">
              <option value="temp">Specify Outlet Temp</option>
              <option value="flow">Specify Flow Rate → calc outlet T</option>
            </select>
          </div>
          <div class="fg" id="pl_cTo_grp">
            <label>Cold Outlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="pl_cTo" step="0.1" value="55" required oninput="plUpdateColdFlow()"><select id="pl_cTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('pl_cTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg" id="pl_cF_calc" style="">
            <label>Calculated Cold Flow Rate</label>
            <div class="irow"><input type="number" id="pl_cF_disp" readonly style="background:var(--bg2);color:var(--teal);font-weight:700"><div class="ulab">kg/h</div></div>
            <div id="pl_cF_lbl" style="font-size:.7rem;color:var(--teal);margin-top:2px"></div>
          </div>
          <div class="fg" id="pl_cF_grp" style="display:none">
            <label>Cold Flow Rate</label>
            <div class="irow">
              <input type="number" id="pl_cF" step="1" value="4000" oninput="plUpdateColdOutlet();plUpdateColdFlow();">
              <select id="pl_cFunit" onchange="updateFlowUnit('pl_cFunit','pl_cFlab');plUpdateColdOutlet();" style="width:100px;font-size:.78rem">
                <option value="kgh">kg/h</option>
                <option value="nm3h">Nm³/h</option>
                <option value="sm3h">Sm³/h</option>
              </select>
            </div>
            <div id="pl_cFlab" style="font-size:.7rem;color:var(--t3);margin-top:2px"></div>
          </div>
          <div id="pl_cTo_calc" style="display:none" class="fg">
            <label>Calculated Cold Outlet</label>
            <div class="irow"><input type="number" id="pl_cTo_disp" readonly style="background:var(--bg2);color:var(--teal);font-weight:700"><div class="ulab u-temp-l">°C</div></div>
            <div id="pl_cTo_lbl" style="font-size:.7rem;color:var(--teal);margin-top:2px"></div>
          </div>
        </div>

        <div class="sec-hd blue">🔧 Plate Specifications</div>
        <div class="fgrid">
          <div class="fg"><label>Plate Material</label>
            <select id="pl_mat">
              <option value="ss316" selected>SS 316L (k=14 W/mK)</option>
              <option value="titanium">Titanium (k=21 W/mK)</option>
              <option value="nickel">Nickel Alloy (k=12 W/mK)</option>
              <option value="copper">Copper (k=385 W/mK)</option>
            </select>
          </div>
          <div class="fg"><label>Plate Thickness (mm)</label>
            <div class="irow"><input type="number" id="pl_th" value="0.6" step="0.05" min="0.3" max="3"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Higher angle (60-65°) = high mixing, high HTC, high ΔP. Lower (25-30°) = gentle flow.">Corrugation Angle (°)</label>
            <div class="irow"><input type="number" id="pl_angle" value="45" step="1" min="25" max="70"><div class="ulab">°</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Gap between adjacent plates (= corrugation depth). Typical: 2–5 mm.">Channel Gap (mm)</label>
            <div class="irow"><input type="number" id="pl_gap" value="3" step="0.5" min="1" max="10"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Plate Width (mm)</label>
            <div class="irow"><input type="number" id="pl_width" value="240" step="10" min="100" max="1200"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Plate Length (mm)</label>
            <div class="irow"><input type="number" id="pl_plen" value="600" step="10" min="200" max="2400"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Enlargement factor φ accounts for corrugation. Typical 1.15–1.25. Use 1.17 for default.">Enlargement Factor φ</label>
            <div class="irow"><input type="number" id="pl_phi" value="1.17" step="0.01" min="1.0" max="1.5"><div class="ulab">—</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Combined fouling factor both sides. TEMA liquid-liquid: ~0.0002 m²K/W">Fouling Factor (m²K/W)</label>
            <div class="irow"><input type="number" id="pl_foul" value="0.0002" step="0.00005" min="0"><div class="ulab">m²K/W</div></div>
          </div>
          <div class="fg"><label>Allow. Hot ΔP (bar)</label>
            <div class="irow"><input type="number" id="pl_pdH" value="1.50" step="0.1" min="0.01"><select id="pl_pdH_usel" class="u-sel u-pdrop-sel" onchange="onPresUnitChange('pl_pdH',this.value)" style="width:68px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar</option>
<option value="kpa">kPa</option>
<option value="psi">psi</option>
</select></div>
          </div>
          <div class="fg"><label>Allow. Cold ΔP (bar)</label>
            <div class="irow"><input type="number" id="pl_pdC" value="1.50" step="0.1" min="0.01"><select id="pl_pdC_usel" class="u-sel u-pdrop-sel" onchange="onPresUnitChange('pl_pdC',this.value)" style="width:68px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar</option>
<option value="kpa">kPa</option>
<option value="psi">psi</option>
</select></div>
          </div>
        </div>

        <div id="pl_err" class="err-box">⚠ <span id="pl_err_txt"></span></div>
        <div class="btn-row">
          <button type="submit" class="btn btn-calc">🧮 Calculate Design</button>
          <button type="button" class="btn btn-reset" onclick="resetForm('pl')">↺ Reset</button>
        </div>
      </form>
    </div>
    <div class="card">
      <div id="pl_ph" class="placeholder"><div class="placeholder-icon">📋</div><h3>Plate HX Results</h3><p>Enter parameters and calculate</p></div>
      <div id="pl_spin" class="calc-anim"><div class="spinner"></div><p style="font-size:.85rem;color:var(--t2);font-weight:600">Calculating plate design…</p></div>
      <div id="pl_res" class="res-pane"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB 3 — AIR COOLED
══════════════════════════════════════════════ -->
<div id="tab-air-cooled" class="tab-pane">
  <div class="two-col">
    <div class="card">
      <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#0088cc,#0055a0)">💨</div><div class="card-title">Air Cooled HX — Design Inputs</div></div>
      <form id="acForm" novalidate>
        <div class="sec-hd" style="color:var(--red);border-bottom-color:#f0cfc0">🔴 Process Side (Hot)</div>
        <div class="fgrid">
          <div class="fg"><label>Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="ac_Ti" step="0.1" value="120" required><select id="ac_Ti_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('ac_Ti',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Outlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="ac_To" step="0.1" value="60" required><select id="ac_To_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('ac_To',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Flow Rate (<span class="u-flow">kg/h</span>)</label>
            <div class="irow"><input type="number" id="ac_F" step="1" value="10000" required><div class="ulab u-flow-l">kg/h</div></div>
          </div>
          <div class="fg"><label>Process Fluid</label><select id="ac_Fl" onchange="fluidChange('ac_Fl')" data-fluid></select></div>
        </div>
        <div class="sec-hd" style="color:var(--blue);border-bottom-color:#c0d5f8">🌬 Air Side</div>
        <div class="fgrid">
          <div class="fg"><label>Ambient Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="ac_amb" step="0.1" value="35"><select id="ac_amb_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('ac_amb',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Design Air Rise (°C)</label>
            <div class="irow"><input type="number" id="ac_dTa" step="0.5" value="15"><div class="ulab">°C</div></div>
          </div>
          <div class="fg"><label>Fan Type</label>
            <select id="ac_fan">
              <option value="forced">Forced Draft</option>
              <option value="induced">Induced Draft</option>
            </select>
          </div>
          <div class="fg"><label>Fin Type</label>
            <select id="ac_fin">
              <option value="plain">Plain Fins</option>
              <option value="serrated">Serrated Fins</option>
              <option value="spiral">Spiral Wrap</option>
            </select>
          </div>
          <div class="fg"><label>Fin Material</label>
            <select id="ac_fmat">
              <option value="aluminum">Aluminum</option>
              <option value="copper">Copper</option>
              <option value="ss">Stainless Steel</option>
            </select>
          </div>
          <div class="fg"><label>Fins per Meter</label>
            <div class="irow"><input type="number" id="ac_fpm" value="280" step="10" min="100" max="600"><div class="ulab">fins/m</div></div>
          </div>
        </div>
        <div class="sec-hd blue">🏗️ Bay Configuration</div>
        <div class="fgrid">
          <div class="fg"><label>Tube Rows (depth)</label>
            <div class="irow"><input type="number" id="ac_rows" value="4" step="1" min="2" max="10"><div class="ulab">rows</div></div>
          </div>
          <div class="fg"><label>Bay Width (m)</label>
            <div class="irow"><input type="number" id="ac_bayW" value="3" step="0.5" min="1" max="6"><div class="ulab u-len-l">m</div></div>
          </div>
          <div class="fg"><label>No. of Tubes</label>
            <div class="irow"><input type="number" id="ac_nTubes" value="40" step="1" min="4" max="500"><div class="ulab">tubes</div></div>
          </div>
          <div class="fg"><label>Tube Length (m)</label>
            <div class="irow"><input type="number" id="ac_tubeLen" value="6" step="0.5" min="1" max="15"><div class="ulab">m</div></div>
          </div>
        </div>
        <div class="sec-hd teal">🔩 Tube &amp; Fin Geometry</div>
        <div style="background:var(--teal-lt);border:1.5px solid rgba(0,143,118,.2);border-radius:var(--r-md);
             padding:8px 12px;margin-bottom:10px;font-size:.72rem;color:var(--teal);font-weight:600">
          ⚙ Default values match a typical API 661 aluminium-finned tube bundle. Override if known.
        </div>
        <div class="fgrid">
          <div class="fg"><label class="tip" data-tip="Bare tube outside diameter. Typical: 25.4 mm (1 in)">Tube OD (mm)</label>
            <div class="irow"><input type="number" id="ac_tubeOD" value="25.4" step="0.1" min="10" max="60"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Tube inside diameter. Typical: 20–22 mm for 25.4 mm OD">Tube ID (mm)</label>
            <div class="irow"><input type="number" id="ac_tubeID" value="20.0" step="0.1" min="6" max="55"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Fin height above tube surface. Typical: 12.5–16 mm">Fin Height (mm)</label>
            <div class="irow"><input type="number" id="ac_finH" value="12.5" step="0.5" min="5" max="25"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Fin thickness. Aluminium: 0.4 mm typical">Fin Thickness (mm)</label>
            <div class="irow"><input type="number" id="ac_finThk" value="0.4" step="0.05" min="0.2" max="1.5"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Fins per metre of tube. 394 fins/m ≈ 10 fins/inch (common API 661 standard)">Fin Density (fins/m)</label>
            <div class="irow"><input type="number" id="ac_finDens" value="394" step="10" min="100" max="800"><div class="ulab">fins/m</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Transverse pitch: centre-to-centre distance between tubes in a row. Typical: 60–65 mm for 25.4 mm OD tubes">Transverse Pitch (mm)</label>
            <div class="irow"><input type="number" id="ac_pitchT" value="63.5" step="0.5" min="30" max="120"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Airside fouling resistance. Default 0.0002 m²K/W per API 661">Airside Fouling (m²K/W)</label>
            <div class="irow"><input type="number" id="ac_Rfo" value="0.0002" step="0.00005" min="0"><div class="ulab">—</div></div>
          </div>
        </div>
        <div id="ac_err" class="err-box">⚠ <span id="ac_err_txt"></span></div>
        <div class="btn-row">
          <button type="submit" class="btn btn-calc">🧮 Calculate Design</button>
          <button type="button" class="btn btn-reset" onclick="resetForm('ac')">↺ Reset</button>
        </div>
      </form>
    </div>
    <div class="card">
      <div id="ac_ph" class="placeholder"><div class="placeholder-icon">🌡️</div><h3>Air Cooler Results</h3><p>Enter parameters and calculate</p></div>
      <div id="ac_spin" class="calc-anim"><div class="spinner"></div><p style="font-size:.85rem;color:var(--t2);font-weight:600">Calculating air cooler…</p></div>
      <div id="ac_res" class="res-pane"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB FIN-FAN — AIR-COOLED FIN-TUBE HX
══════════════════════════════════════════════ -->
<div id="tab-fin-fan" class="tab-pane">
  <div class="two-col">
    <div class="card">
      <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#0090c8,#004a7a)">🌬️</div><div class="card-title">Fin-Fan HX — Design Inputs</div></div>
      <form id="ffForm" novalidate>

        <div class="sec-hd" style="color:var(--red);border-bottom-color:#f0cfc0">🔴 Tubeside (Process) Fluid</div>
        <div class="fgrid">
          <div class="fg"><label>Fluid</label><select id="ff_tFl" onchange="fluidChange('ff_tFl')" data-fluid></select></div>
          <div class="fg"><label class="tip" data-tip="Tubeside operating pressure for gas density/Z-factor correction">Op. Pressure (bar abs)</label>
            <div class="irow"><input type="number" id="ff_tPop" value="4.0" step="0.1" min="0.01"><select id="ff_tPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('ff_tPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select></div>
          </div>
          <div class="fg"><label>Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="ff_tTi" step="0.1" value="151" required><select id="ff_tTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('ff_tTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Outlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="ff_tTo" step="0.1" value="47" required><select id="ff_tTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('ff_tTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Flow Rate (<span class="u-flow">kg/h</span>)</label>
            <div class="irow"><input type="number" id="ff_tF" step="1" value="295415" required><div class="ulab u-flow-l">kg/h</div></div>
          </div>
          <div class="fg"><label>Tubeside Fouling (m²K/W)</label>
            <div class="irow"><input type="number" id="ff_tFoul" value="0.00029" step="0.00001" min="0"><div class="ulab">m²K/W</div></div>
          </div>
          <div class="fg"><label>Allow. Tube ΔP (bar)</label>
            <div class="irow"><input type="number" id="ff_tPdAllow" value="0.6" step="0.05" min="0.01"><select id="ff_tPdAllow_usel" class="u-sel u-pdrop-sel" onchange="onPresUnitChange('ff_tPdAllow',this.value)" style="width:68px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar</option>
<option value="kpa">kPa</option>
<option value="psi">psi</option>
</select></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Multiply required area by this safety factor. 1.0 = no safety margin.">Heat Transfer Safety Factor</label>
            <div class="irow"><input type="number" id="ff_htSF" value="1.0" step="0.05" min="0.5" max="2.5"><div class="ulab">—</div></div>
          </div>
        </div>

        <div class="sec-hd" style="color:var(--blue);border-bottom-color:#c0d5f8">🌬️ Airside Conditions</div>
        <div class="fgrid">
          <div class="fg"><label>Ambient Air Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="ff_aTamb" step="0.1" value="34" required><select id="ff_aTamb_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('ff_aTamb',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Design Air Outlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="ff_aTout" step="0.1" value="55" required><select id="ff_aTout_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('ff_aTout',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Air Op. Pressure (bar abs)</label>
            <div class="irow"><input type="number" id="ff_aPop" value="1.01325" step="0.01" min="0.5"><select id="ff_aPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('ff_aPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select></div>
          </div>
          <div class="fg"><label>Airside Fouling (m²K/W)</label>
            <div class="irow"><input type="number" id="ff_aFoul" value="0.00018" step="0.00001" min="0"><div class="ulab">m²K/W</div></div>
          </div>
        </div>

        <div class="sec-hd blue">🔧 Tube Geometry</div>
        <div class="fgrid">
          <div class="fg"><label>Tube Type</label>
            <select id="ff_tubeType">
              <option value="highfin" selected>High-finned</option>
              <option value="lowfin">Low-finned</option>
              <option value="bare">Bare tube</option>
            </select>
          </div>
          <div class="fg"><label>Tube OD (mm)</label>
            <div class="irow"><input type="number" id="ff_tubeOD" value="15.875" step="0.125" min="6"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Tube ID (mm)</label>
            <div class="irow"><input type="number" id="ff_tubeID" value="14.097" step="0.125" min="3"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Tube Length (mm)</label>
            <div class="irow"><input type="number" id="ff_tubeLen" value="5143" step="50" min="500"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Tube Layout</label>
            <select id="ff_layout">
              <option value="staggered" selected>Staggered (Triangular)</option>
              <option value="inline">Inline (Square)</option>
            </select>
          </div>
          <div class="fg"><label>Transverse Pitch (mm)</label>
            <div class="irow"><input type="number" id="ff_pitchT" value="38.1" step="0.5" min="10"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Longitudinal Pitch (mm)</label>
            <div class="irow"><input type="number" id="ff_pitchL" value="33.0" step="0.5" min="10"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Number of Tube Rows</label>
            <div class="irow"><input type="number" id="ff_nRows" value="4" step="1" min="1" max="20"><div class="ulab">rows</div></div>
          </div>
          <div class="fg"><label>Number of Passes</label>
            <div class="irow"><input type="number" id="ff_nPasses" value="2" step="1" min="1" max="12"><div class="ulab">—</div></div>
          </div>
          <div class="fg"><label>Number of Tubes</label>
            <div class="irow"><input type="number" id="ff_nTubes" value="261" step="1" min="1"><div class="ulab">tubes</div></div>
          </div>
          <div class="fg"><label>Tube Material</label>
            <select id="ff_tubeMat">
              <option value="cs">Carbon Steel A-179 (k=50)</option>
              <option value="ss304" selected>SA-213 TP304 (k=17)</option>
              <option value="ss316">SA-213 TP316 (k=14)</option>
              <option value="copper">Copper (k=385)</option>
              <option value="titanium">Titanium (k=21)</option>
              <option value="aluminum">Aluminum (k=205)</option>
            </select>
          </div>
        </div>

        <div class="sec-hd" style="color:var(--gold);border-bottom-color:#e8cc80">🌀 Fin Geometry</div>
        <div class="fgrid">
          <div class="fg"><label>Fin Type</label>
            <select id="ff_finType">
              <option value="rectangular" selected>Rectangular (plain)</option>
              <option value="serrated">Serrated / Crimped</option>
              <option value="spiral">Spiral wound</option>
              <option value="welded">Welded / Extruded</option>
            </select>
          </div>
          <div class="fg"><label>Fins per Metre (fins/m)</label>
            <div class="irow"><input type="number" id="ff_finDensity" value="787" step="10" min="50" max="2000"><div class="ulab">fins/m</div></div>
          </div>
          <div class="fg"><label>Fin Root Diameter (mm)</label>
            <div class="irow"><input type="number" id="ff_finRoot" value="15.875" step="0.125" min="6"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Fin Height (mm)</label>
            <div class="irow"><input type="number" id="ff_finH" value="11.112" step="0.5" min="1" max="50"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Fin Base Thickness (mm)</label>
            <div class="irow"><input type="number" id="ff_finThk" value="0.25" step="0.025" min="0.05" max="2"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Fin Material</label>
            <select id="ff_finMat">
              <option value="al1100" selected>Aluminum Alloy 1100-H14 (k=222)</option>
              <option value="al3003">Aluminum 3003 (k=190)</option>
              <option value="copper">Copper (k=385)</option>
              <option value="ss">Stainless Steel (k=16)</option>
            </select>
          </div>
        </div>

        <div class="sec-hd teal">🏗️ Unit & Bundle Geometry</div>
        <div class="fgrid">
          <div class="fg"><label>Bays in Parallel per Unit</label>
            <div class="irow"><input type="number" id="ff_nBays" value="1" step="1" min="1" max="20"><div class="ulab">—</div></div>
          </div>
          <div class="fg"><label>Bundles Parallel per Bay</label>
            <div class="irow"><input type="number" id="ff_nBundlesPBay" value="1" step="1" min="1" max="10"><div class="ulab">—</div></div>
          </div>
          <div class="fg"><label>Bundle Width (mm)</label>
            <div class="irow"><input type="number" id="ff_bundleW" value="3048" step="50" min="500"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Draft Type</label>
            <select id="ff_draft">
              <option value="forced" selected>Forced Draft</option>
              <option value="induced">Induced Draft</option>
            </select>
          </div>
        </div>

        <div class="sec-hd" style="color:var(--teal);border-bottom-color:#a0e0d5">🔄 Fan Geometry</div>
        <div class="fgrid">
          <div class="fg"><label>Number of Fans per Bay</label>
            <div class="irow"><input type="number" id="ff_nFans" value="2" step="1" min="0" max="6"><div class="ulab">fans</div></div>
          </div>
          <div class="fg"><label>Fan Diameter (mm)</label>
            <div class="irow"><input type="number" id="ff_fanDia" value="2743" step="50" min="300"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Fan Efficiency (%)</label>
            <div class="irow"><input type="number" id="ff_fanEff" value="75" step="1" min="20" max="95"><div class="ulab">%</div></div>
          </div>
          <div class="fg"><label>Driver Power per Fan (kW)</label>
            <div class="irow"><input type="number" id="ff_driverKW" value="30" step="1" min="1"><div class="ulab">kW</div></div>
          </div>
          <div class="fg"><label>Fan Ring Type</label>
            <select id="ff_fanRing">
              <option value="none">None</option>
              <option value="flanged" selected>Flanged</option>
              <option value="conical">Conical</option>
            </select>
          </div>
          <div class="fg"><label>Tip Clearance (mm)</label>
            <div class="irow"><input type="number" id="ff_tipClear" value="12" step="1" min="0"><div class="ulab">mm</div></div>
          </div>
        </div>

        <div id="ff_err" class="err-box">⚠ <span id="ff_err_txt"></span></div>
        <div class="btn-row">
          <button type="submit" class="btn btn-calc">🧮 Calculate Design</button>
          <button type="button" class="btn btn-reset" onclick="resetForm('ff')">↺ Reset</button>
        </div>
      </form>
    </div>
    <div class="card">
      <div id="ff_ph" class="placeholder">
        <div class="placeholder-icon">🌬️</div>
        <h3>Fin-Fan HX Results</h3>
        <p>Enter parameters and click Calculate to generate the full engineering datasheet</p>
      </div>
      <div id="ff_spin" class="calc-anim"><div class="spinner"></div><p style="font-size:.85rem;color:var(--t2);font-weight:600">Calculating fin-fan design…</p></div>
      <div id="ff_res" class="res-pane"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB 4 — DOUBLE PIPE
══════════════════════════════════════════════ -->
<div id="tab-double-pipe" class="tab-pane">
  <div class="two-col">
    <div class="card">
      <div class="card-hd"><div class="card-icon teal">↔️</div><div class="card-title">Double Pipe — Design Inputs</div></div>
      <form id="dpForm" novalidate>

        <div class="sec-hd" style="color:var(--red);border-bottom-color:#f0cfc0">🔴 Inner Pipe (Hot)</div>
        <div class="fgrid">
          <div class="fg"><label>Fluid</label><select id="dp_hFl" onchange="fluidChange('dp_hFl');dpUpdateColdOutlet();dpUpdateColdFlow();" data-fluid></select></div>
          <div class="fg"><label class="tip" data-tip="Operating pressure for real-gas Z-factor density correction. Ignored for liquids.">Op. Pressure (bar abs)</label>
            <div class="irow"><input type="number" id="dp_hPop" value="1.01325" step="0.1" min="0.01"><select id="dp_hPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('dp_hPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select></div>
          </div>
          <div class="fg"><label>Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="dp_hTi" step="0.1" value="100" required oninput="dpUpdateColdOutlet();dpUpdateColdFlow();"><select id="dp_hTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('dp_hTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Outlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="dp_hTo" step="0.1" value="55" required oninput="dpUpdateColdOutlet();dpUpdateColdFlow();"><select id="dp_hTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('dp_hTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Flow Rate</label>
            <div class="irow">
              <input type="number" id="dp_hF" step="1" value="2000" required oninput="dpUpdateColdOutlet();dpUpdateColdFlow();">
              <select id="dp_hFunit" onchange="updateFlowUnit('dp_hFunit','dp_hFlab');dpUpdateColdOutlet();" style="width:100px;font-size:.78rem">
                <option value="kgh">kg/h</option>
                <option value="nm3h">Nm³/h</option>
                <option value="sm3h">Sm³/h</option>
              </select>
            </div>
            <div id="dp_hFlab" style="font-size:.7rem;color:var(--t3);margin-top:2px"></div>
          </div>
        </div>

        <div class="sec-hd" style="color:var(--teal);border-bottom-color:#a0e0d5">🔵 Annulus (Cold)</div>
        <div class="fgrid">
          <div class="fg"><label>Fluid</label><select id="dp_cFl" onchange="fluidChange('dp_cFl');dpUpdateColdOutlet();dpUpdateColdFlow();" data-fluid></select></div>
          <div class="fg"><label class="tip" data-tip="Operating pressure for real-gas density correction. Ignored for liquids.">Op. Pressure (bar abs)</label>
            <div class="irow"><input type="number" id="dp_cPop" value="1.01325" step="0.1" min="0.01"><select id="dp_cPop_usel" class="u-sel u-pres-sel" onchange="onPresUnitChange('dp_cPop',this.value)" style="width:72px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar a</option>
<option value="kpa">kPa a</option>
<option value="mpa">MPa a</option>
<option value="psi">psia</option>
<option value="kgcm2">kg/cm²</option>
</select></div>
          </div>
          <div class="fg"><label>Cold Inlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="dp_cTi" step="0.1" value="25" required oninput="dpUpdateColdOutlet();dpUpdateColdFlow();"><select id="dp_cTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('dp_cTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg">
            <label>Cold Side Mode</label>
            <select id="dp_coldMode" onchange="dpToggleColdMode()">
              <option value="temp">Specify Outlet Temp</option>
              <option value="flow">Specify Flow Rate → calc outlet T</option>
            </select>
          </div>
          <div class="fg" id="dp_cTo_grp">
            <label>Cold Outlet Temp (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="dp_cTo" step="0.1" value="65" required oninput="dpUpdateColdFlow()"><select id="dp_cTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('dp_cTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg" id="dp_cF_calc" style="">
            <label>Calculated Cold Flow Rate</label>
            <div class="irow"><input type="number" id="dp_cF_disp" readonly style="background:var(--bg2);color:var(--teal);font-weight:700"><div class="ulab">kg/h</div></div>
            <div id="dp_cF_lbl" style="font-size:.7rem;color:var(--teal);margin-top:2px"></div>
          </div>
          <div class="fg" id="dp_cF_grp" style="display:none">
            <label>Cold Flow Rate</label>
            <div class="irow">
              <input type="number" id="dp_cF" step="1" value="3000" oninput="dpUpdateColdOutlet();dpUpdateColdFlow();">
              <select id="dp_cFunit" onchange="updateFlowUnit('dp_cFunit','dp_cFlab');dpUpdateColdOutlet();" style="width:100px;font-size:.78rem">
                <option value="kgh">kg/h</option>
                <option value="nm3h">Nm³/h</option>
                <option value="sm3h">Sm³/h</option>
              </select>
            </div>
            <div id="dp_cFlab" style="font-size:.7rem;color:var(--t3);margin-top:2px"></div>
          </div>
          <div id="dp_cTo_calc" style="display:none" class="fg">
            <label>Calculated Cold Outlet</label>
            <div class="irow"><input type="number" id="dp_cTo_disp" readonly style="background:var(--bg2);color:var(--teal);font-weight:700"><div class="ulab u-temp-l">°C</div></div>
            <div id="dp_cTo_lbl" style="font-size:.7rem;color:var(--teal);margin-top:2px"></div>
          </div>
        </div>

        <div class="sec-hd blue">🔧 Pipe Dimensions</div>
        <div class="fgrid">
          <div class="fg"><label>Inner Pipe OD (mm)</label>
            <div class="irow"><input type="number" id="dp_iOD" value="50" step="0.5" min="10"><select id="dp_iOD_usel" class="u-sel u-dim-sel" onchange="onDimUnitChange2('dp_iOD',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="mm" selected>mm</option>
<option value="cm">cm</option>
<option value="in">in</option>
</select></div>
          </div>
          <div class="fg"><label>Inner Pipe Wall (mm)</label>
            <div class="irow"><input type="number" id="dp_iW" value="3" step="0.5" min="1"><select id="dp_iW_usel" class="u-sel u-dim-sel" onchange="onDimUnitChange2('dp_iW',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="mm" selected>mm</option>
<option value="cm">cm</option>
<option value="in">in</option>
</select></div>
          </div>
          <div class="fg"><label>Outer Pipe ID (mm)</label>
            <div class="irow"><input type="number" id="dp_oID" value="80" step="0.5" min="20"><div class="ulab">mm</div></div>
          </div>
          <div class="fg"><label>Flow Arrangement</label>
            <select id="dp_arr">
              <option value="counter" selected>Countercurrent</option>
              <option value="parallel">Parallel Flow</option>
            </select>
          </div>
          <div class="fg"><label>Material</label>
            <select id="dp_mat">
              <option value="cs">Carbon Steel (k=50)</option>
              <option value="ss304" selected>SS 304 (k=16)</option>
              <option value="ss316">SS 316 (k=14)</option>
              <option value="copper">Copper (k=385)</option>
            </select>
          </div>
          <div class="fg"><label>Hairpin Length (m)</label>
            <div class="irow"><input type="number" id="dp_hplen" value="6" step="0.5" min="1"><select id="dp_hplen_usel" class="u-sel u-len-sel" onchange="onLenUnitChange('dp_hplen',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="m" selected>m</option>
<option value="ft">ft</option>
</select></div>
          </div>
          <div class="fg"><label class="tip" data-tip="Combined fouling resistance both sides. Typical: 0.0002 m²K/W for clean water.">Fouling Factor (m²K/W)</label>
            <div class="irow"><input type="number" id="dp_foul" value="0.0002" step="0.00005" min="0"><div class="ulab">m²K/W</div></div>
          </div>
          <div class="fg"><label>Allow. Inner ΔP (bar)</label>
            <div class="irow"><input type="number" id="dp_pdH" value="1.00" step="0.1" min="0.01"><select id="dp_pdH_usel" class="u-sel u-pdrop-sel" onchange="onPresUnitChange('dp_pdH',this.value)" style="width:68px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="bar" selected>bar</option>
<option value="kpa">kPa</option>
<option value="psi">psi</option>
</select></div>
          </div>
          <div class="fg"><label>Allow. Annulus ΔP (bar)</label>
            <div class="irow"><input type="number" id="dp_pdC" value="1.00" step="0.1" min="0.01"><div class="ulab">bar</div></div>
          </div>
        </div>

        <div id="dp_err" class="err-box">⚠ <span id="dp_err_txt"></span></div>
        <div class="btn-row">
          <button type="submit" class="btn btn-calc">🧮 Calculate Design</button>
          <button type="button" class="btn btn-reset" onclick="resetForm('dp')">↺ Reset</button>
        </div>
      </form>
    </div>
    <div class="card">
      <div id="dp_ph" class="placeholder"><div class="placeholder-icon">📐</div><h3>Double Pipe Results</h3><p>Enter parameters and calculate</p></div>
      <div id="dp_spin" class="calc-anim"><div class="spinner"></div><p style="font-size:.85rem;color:var(--t2);font-weight:600">Calculating…</p></div>
      <div id="dp_res" class="res-pane"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB 5 — LMTD / NTU
══════════════════════════════════════════════ -->
<div id="tab-lmtd" class="tab-pane">
  <div class="two-col">
    <div class="card">
      <div class="card-hd"><div class="card-icon blue">📐</div><div class="card-title">LMTD &amp; NTU Calculator</div></div>
      <form id="lmForm" novalidate>
        <div class="sec-hd">🌡 Temperature Inputs</div>
        <div class="fgrid">
          <div class="fg"><label>Hot Inlet (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="lm_hTi" step="0.1" value="100" required><select id="lm_hTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('lm_hTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Hot Outlet (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="lm_hTo" step="0.1" value="60" required><select id="lm_hTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('lm_hTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Cold Inlet (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="lm_cTi" step="0.1" value="25" required><select id="lm_cTi_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('lm_cTi',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
          <div class="fg"><label>Cold Outlet (<span class="u-temp">°C</span>)</label>
            <div class="irow"><input type="number" id="lm_cTo" step="0.1" value="70" required><select id="lm_cTo_usel" class="u-sel u-temp-sel" onchange="onTempUnitChange('lm_cTo',this.value)" style="width:52px;padding:4px 2px;font-size:.68rem;border-radius:5px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer">
<option value="c" selected>°C</option>
<option value="f">°F</option>
<option value="k">K</option>
</select></div>
          </div>
        </div>
        <div class="sec-hd blue">⚡ Heat Capacity Rates (optional)</div>
        <div class="fgrid">
          <div class="fg"><label>Hot Side ṁCp (kW/K)</label>
            <div class="irow"><input type="number" id="lm_Ch" step="0.1" value="10" placeholder="e.g. 10"><div class="ulab">kW/K</div></div>
          </div>
          <div class="fg"><label>Cold Side ṁCp (kW/K)</label>
            <div class="irow"><input type="number" id="lm_Cc" step="0.1" value="8" placeholder="e.g. 8"><div class="ulab">kW/K</div></div>
          </div>
          <div class="fg"><label>U × A (optional W/K)</label>
            <div class="irow"><input type="number" id="lm_UA" step="1" placeholder="W/K (optional)"><div class="ulab">W/K</div></div>
          </div>
          <div class="fg"><label>Flow Arrangement</label>
            <select id="lm_arr">
              <option value="counter" selected>Countercurrent</option>
              <option value="parallel">Parallel Flow</option>
              <option value="cross1">Crossflow (both unmixed)</option>
              <option value="cross2">Crossflow (1 mixed)</option>
              <option value="shell12">Shell &amp; Tube 1-2</option>
              <option value="shell24">Shell &amp; Tube 2-4</option>
            </select>
          </div>
        </div>
        <div id="lm_err" class="err-box">⚠ <span id="lm_err_txt"></span></div>
        <div id="lm_spin" class="spinner"></div>
        <div class="btn-row">
          <button type="submit" class="btn btn-calc">🧮 Calculate LMTD &amp; NTU</button>
        </div>
      </form>
    </div>
    <div class="card">
      <div id="lm_ph" class="placeholder"><div class="placeholder-icon">📐</div><h3>LMTD / NTU Results</h3><p>Enter temperatures and click Calculate</p></div>
      <div id="lm_res" class="res-pane"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB 6 — HX SELECTOR
══════════════════════════════════════════════ -->
<div id="tab-selector" class="tab-pane">
  <div class="card" style="margin-bottom:16px">
    <div class="card-hd"><div class="card-icon purple">🎯</div><div class="card-title">Smart HX Type Selector</div></div>
    <p style="font-size:.88rem;color:var(--t2);margin-bottom:20px">Answer the questions below to get a recommended heat exchanger type for your application.</p>
    <div class="fgrid">
      <div class="fg"><label>Application Type</label>
        <select id="sel_app">
          <option value="liquid-liquid">Liquid–Liquid</option>
          <option value="liquid-gas">Liquid–Gas</option>
          <option value="gas-gas">Gas–Gas</option>
          <option value="condensing">Condensing (steam/vapor)</option>
          <option value="evaporating">Evaporating / Reboiling</option>
          <option value="air-cooling">Air Cooling (no cooling water)</option>
        </select>
      </div>
      <div class="fg"><label>Design Pressure (bar)</label>
        <select id="sel_pres">
          <option value="low">Low (&lt;10 bar)</option>
          <option value="medium">Medium (10–50 bar)</option>
          <option value="high">High (&gt;50 bar)</option>
        </select>
      </div>
      <div class="fg"><label>Fouling Tendency</label>
        <select id="sel_foul">
          <option value="low">Low (clean fluids)</option>
          <option value="medium">Medium</option>
          <option value="high">High (slurries, heavy oil)</option>
        </select>
      </div>
      <div class="fg"><label>Duty Size</label>
        <select id="sel_duty">
          <option value="small">Small (&lt;500 kW)</option>
          <option value="medium">Medium (500–5000 kW)</option>
          <option value="large">Large (&gt;5000 kW)</option>
        </select>
      </div>
      <div class="fg"><label>Space Available</label>
        <select id="sel_space">
          <option value="plenty">Plenty</option>
          <option value="limited">Limited</option>
          <option value="very-limited">Very Limited</option>
        </select>
      </div>
      <div class="fg"><label>Fluid Corrosivity</label>
        <select id="sel_corr">
          <option value="low">Low (water, light HC)</option>
          <option value="medium">Medium (brine, chemicals)</option>
          <option value="high">High (acids, chlorides)</option>
        </select>
      </div>
    </div>
    <div class="btn-row"><button class="btn btn-calc" onclick="runSelector()" style="max-width:300px">🎯 Get Recommendation</button></div>
    <div id="sel_result" style="margin-top:20px;display:none"></div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB 7 — EDUCATIONAL GUIDE & REFERENCE
══════════════════════════════════════════════ -->
<div id="tab-defs" class="tab-pane">

<!-- ── HERO BANNER ── -->
<div style="background:linear-gradient(135deg,#0c1322 0%,#1a2540 60%,#0c1f3a 100%);border-radius:var(--r-xl);padding:32px 36px;margin-bottom:20px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.06)">
  <div style="position:absolute;right:-20px;top:-20px;font-size:180px;opacity:.04;line-height:1;pointer-events:none;user-select:none">🔥</div>
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--red),#ff8c42,var(--teal),var(--blue))"></div>
  <div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap">
    <div style="flex:1;min-width:260px">
      <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--teal);margin-bottom:8px">Complete Field Reference</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2.1rem);font-weight:700;color:#fff;line-height:1.15;letter-spacing:-.5px;margin-bottom:12px">Heat Exchanger Engineering<br><span style="color:#ff8c42">Design Guide</span></h1>
      <p style="font-size:.92rem;color:#94a3b8;line-height:1.75;max-width:580px">Everything a student or practising engineer needs to understand the theory, select the right equipment, work through a calculation, and validate the result — from first principles to TEMA code compliance.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
        <span style="padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(232,80,10,.18);color:#ff8c42;border:1px solid rgba(232,80,10,.3)">LMTD &amp; NTU</span>
        <span style="padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(0,143,118,.18);color:#4dd9c0;border:1px solid rgba(0,143,118,.3)">Bell-Delaware</span>
        <span style="padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(0,85,200,.18);color:#7eb8ff;border:1px solid rgba(0,85,200,.3)">Gnielinski</span>
        <span style="padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(192,120,0,.18);color:#ffd060;border:1px solid rgba(192,120,0,.3)">TEMA Standards</span>
        <span style="padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(124,58,237,.18);color:#c4a0ff;border:1px solid rgba(124,58,237,.3)">Fouling &amp; ΔP</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;min-width:220px">
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:var(--r-md);padding:14px;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#ff8c42;font-family:var(--mono)">9</div>
        <div style="font-size:.7rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Sections</div>
      </div>
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:var(--r-md);padding:14px;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#4dd9c0;font-family:var(--mono)">40+</div>
        <div style="font-size:.7rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Formulas</div>
      </div>
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:var(--r-md);padding:14px;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#7eb8ff;font-family:var(--mono)">5</div>
        <div style="font-size:.7rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px">HX Types</div>
      </div>
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:var(--r-md);padding:14px;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#ffd060;font-family:var(--mono)">TEMA</div>
        <div style="font-size:.7rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px">Code Ref.</div>
      </div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 1 — FUNDAMENTALS
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon">🧱</div><div class="card-title">Section 1 — Heat Transfer Fundamentals</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">Heat exchangers transfer thermal energy from a hot fluid to a cold fluid through a separating wall, without the fluids mixing. All designs are governed by the same three equations: the <strong>energy balance</strong>, the <strong>rate equation</strong>, and the <strong>design equation</strong>. Everything else is geometry and material science.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:20px">

    <div class="info-box">
      <div class="info-box-title">⚡ The Three Governing Equations</div>
      <div class="info-box-body">
        <strong>1. Energy Balance</strong> — heat given up = heat received
        <div class="formula-box">Q = ṁ_h · c_p,h · (T_h,in − T_h,out)<br>Q = ṁ_c · c_p,c · (T_c,out − T_c,in)</div>
        <strong>2. Rate Equation</strong> — how fast heat moves through area A
        <div class="formula-box">Q = U · A · F · ΔT_lm</div>
        <strong>3. Design Equation</strong> — size the exchanger
        <div class="formula-box">A_required = Q / (U · F · ΔT_lm)</div>
        These three, combined with an assumed or calculated U, give you every number needed to specify an exchanger.
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">🔗 Thermal Resistance Network</div>
      <div class="info-box-body">
        Heat flows through resistances <strong>in series</strong> — exactly like electrical resistors. The overall U is the reciprocal of the sum of all resistances:
        <div class="formula-box">1/U_o = 1/h_o + R_fo + (A_o·ln(r_o/r_i))/(2πkL) + R_fi·(A_o/A_i) + (A_o/A_i)·(1/h_i)</div>
        Where: h_o = shell-side film coeff, h_i = tube-side film coeff, R_fo / R_fi = fouling resistances (outer/inner), k = wall conductivity.<br><br>
        <strong>The dominant resistance controls U.</strong> In water–water service, fouling typically dominates. In gas–liquid service, the gas-side film always dominates — improving the liquid side is wasted effort.
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">📊 Heat Capacity Rate (C)</div>
      <div class="info-box-body">
        The heat capacity rate C = ṁ · c_p [kW/K] tells you how much temperature change each stream experiences per unit of heat transferred. It controls the temperature profiles.
        <div class="formula-box">C_h = ṁ_h · c_p,h &nbsp;&nbsp; C_c = ṁ_c · c_p,c<br>C_min = min(C_h, C_c) &nbsp; C_max = max(C_h, C_c)<br>C_r = C_min / C_max  (heat capacity ratio)</div>
        <strong>Key insight:</strong> The stream with C_min always undergoes the larger temperature change. If C_h ≪ C_c, the hot stream cools dramatically and the cold stream barely warms — this is the typical situation for steam condensers (C_h → 0 as latent heat dominates).
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">🌡 Flow Arrangements Compared</div>
      <div class="info-box-body">
        <strong>Countercurrent (most efficient):</strong> Streams flow in opposite directions. The cold outlet can approach the hot inlet temperature. Maximum possible ΔT_lm for given terminal temperatures.
        <br><br>
        <strong>Parallel flow (least efficient):</strong> Streams enter same end. Cold outlet can never exceed the equilibrium temperature. LMTD always lower than countercurrent for same temperatures.
        <br><br>
        <strong>Crossflow:</strong> One stream flows perpendicular to the other. Common in air coolers and fin-fan units. F-factor (0.75–0.97) corrects the countercurrent LMTD.
        <div class="formula-box">ΔT_lm,counter > ΔT_lm,cross > ΔT_lm,parallel</div>
        For a given duty, countercurrent requires the smallest area. Always prefer countercurrent unless process constraints prevent it.
      </div>
    </div>

  </div>

  <!-- Typical U table -->
  <div class="sec-hd teal">📋 Typical Overall Heat Transfer Coefficients U (W/m²·K)</div>
  <div class="tbl-wrap">
    <table class="dtbl">
      <thead><tr><th>Service</th><th>Shell &amp; Tube</th><th>Plate HX</th><th>Air Cooler</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td class="lbl-col">Water – Water (clean)</td><td>800–2 000</td><td>3 000–7 000</td><td>—</td><td>Plate HX excels due to high turbulence</td></tr>
        <tr><td class="lbl-col">Steam condenser (shell)</td><td>1 500–6 000</td><td>2 000–5 000</td><td>—</td><td>Condensation is very high h; tube-side controls</td></tr>
        <tr><td class="lbl-col">Water – Light oil</td><td>150–500</td><td>400–1 200</td><td>—</td><td>Oil viscosity limits shell-side h</td></tr>
        <tr><td class="lbl-col">Water – Heavy oil / residue</td><td>50–200</td><td>Not recommended</td><td>—</td><td>High fouling, low h; S&T only</td></tr>
        <tr><td class="lbl-col">Gas – Liquid (high-P gas)</td><td>100–350</td><td>—</td><td>—</td><td>Gas side always limiting; fins help</td></tr>
        <tr><td class="lbl-col">Gas – Gas (no fins)</td><td>15–60</td><td>—</td><td>—</td><td>Both sides poor; use plate-fin for compact duty</td></tr>
        <tr><td class="lbl-col">Air cooling (process fluid)</td><td>—</td><td>—</td><td>40–120</td><td>Air h ≈ 30–80 W/m²K; fins increase effective area 10–20×</td></tr>
        <tr><td class="lbl-col">Reboiler / vaporiser</td><td>500–2 500</td><td>1 000–4 000</td><td>—</td><td>Nucleate boiling greatly enhances h</td></tr>
        <tr><td class="lbl-col">Crude oil train</td><td>100–400</td><td>—</td><td>—</td><td>Heavy fouling; design with 0.0005 m²K/W each side</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 2 — LMTD & NTU METHODS IN DEPTH
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon blue">📐</div><div class="card-title">Section 2 — LMTD &amp; NTU-Effectiveness Methods</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">There are two equivalent design methods. <strong>LMTD</strong> is best when all four terminal temperatures are known (rating / checking an existing exchanger). <strong>NTU-ε</strong> is best when outlet temperatures are unknown (design from duty and inlet temperatures). Both methods must give the same answer.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;margin-bottom:20px">

    <div class="info-box">
      <div class="info-box-title">📐 LMTD Method — Step by Step</div>
      <div class="info-box-body">
        <strong>Step 1 — Compute terminal differences</strong>
        <div class="formula-box">Countercurrent: ΔT_1 = T_h,in − T_c,out &nbsp;&nbsp; ΔT_2 = T_h,out − T_c,in<br>Parallel flow: ΔT_1 = T_h,in − T_c,in &nbsp;&nbsp; ΔT_2 = T_h,out − T_c,out</div>
        <strong>Step 2 — Log-mean</strong>
        <div class="formula-box">ΔT_lm = (ΔT_1 − ΔT_2) / ln(ΔT_1 / ΔT_2)<br>Special case ΔT_1 = ΔT_2: ΔT_lm = ΔT_1</div>
        <strong>Step 3 — Correction factor F</strong> (for multi-pass or crossflow shells)
        <div class="formula-box">Q = U · A · F · ΔT_lm &nbsp;&nbsp; F ≤ 1.0<br>Rule: F &lt; 0.75 → increase shell passes or switch to counter-current</div>
        <strong>When to avoid LMTD:</strong> When only inlet temperatures are known, iteration is required — use NTU-ε instead.
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">📈 NTU-Effectiveness Method</div>
      <div class="info-box-body">
        <strong>Number of Transfer Units</strong> — dimensionless measure of exchanger thermal "size":
        <div class="formula-box">NTU = U · A / C_min</div>
        <strong>Effectiveness ε</strong> — fraction of maximum possible heat transfer achieved:
        <div class="formula-box">ε = Q_actual / Q_max &nbsp;&nbsp; Q_max = C_min · (T_h,in − T_c,in)</div>
        <strong>Counter-current formula</strong> (C_r &lt; 1):
        <div class="formula-box">ε = [1 − exp(−NTU(1−C_r))] / [1 − C_r·exp(−NTU(1−C_r))]</div>
        <strong>Special case C_r = 1 (balanced):</strong>
        <div class="formula-box">ε = NTU / (1 + NTU)</div>
        <strong>Condenser / evaporator (C_r = 0):</strong>
        <div class="formula-box">ε = 1 − exp(−NTU) &nbsp;&nbsp; (any arrangement)</div>
        NTU = 1.0 → ε ≈ 0.63 | NTU = 2.0 → ε ≈ 0.83 | NTU = 4.0 → ε ≈ 0.96 (counter-current, C_r = 0.5). Above NTU ≈ 4 there is severe diminishing return — adding more area barely improves performance.
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">⚖️ Which Method to Use — Decision Guide</div>
      <div class="info-box-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div style="background:var(--teal-lt);border:1px solid rgba(0,143,118,.2);border-radius:var(--r-sm);padding:10px">
            <div style="font-size:.72rem;font-weight:700;color:var(--teal);text-transform:uppercase;margin-bottom:6px">Use LMTD when…</div>
            <div style="font-size:.8rem;color:var(--t2);line-height:1.6">All 4 terminal temperatures known<br>Checking an existing unit<br>Confirming a vendor's area claim<br>Simple single-pass configurations</div>
          </div>
          <div style="background:var(--blue-lt);border:1px solid rgba(0,85,200,.15);border-radius:var(--r-sm);padding:10px">
            <div style="font-size:.72rem;font-weight:700;color:var(--blue);text-transform:uppercase;margin-bottom:6px">Use NTU-ε when…</div>
            <div style="font-size:.8rem;color:var(--t2);line-height:1.6">Only inlet T known (design case)<br>Evaluating performance at off-design flow<br>Comparing arrangements quickly<br>Condensers and evaporators</div>
          </div>
        </div>
        <strong>Both methods are equivalent</strong> — they are mathematically derived from the same physical model. If you get different answers, you have made an arithmetic error in one of them.
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">⚠️ Temperature Cross &amp; Minimum Approach</div>
      <div class="info-box-body">
        A <strong>temperature cross</strong> occurs when the cold outlet T exceeds the hot outlet T. In a single-shell 1-2 unit this is physically impossible (you cannot cross in that region of the exchanger). The remedy is to use multiple shells in series.
        <div class="formula-box">Temperature cross: T_c,out &gt; T_h,out<br>Minimum approach ΔT_min = T_h,out − T_c,in</div>
        <strong>Practical minimum approach guidelines:</strong><br>
        — Water coolers: 5–10°C minimum<br>
        — Process-to-process: 10–15°C for economical design<br>
        — Cryogenic service: 2–5°C (expensive to achieve)<br>
        — Refrigerated systems: 3–8°C<br><br>
        Approach below 5°C drives area up steeply — a 2°C improvement in approach can double the required area. Always question whether that temperature target is genuinely necessary.
      </div>
    </div>

  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 3 — HEAT TRANSFER COEFFICIENTS
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon teal">🔬</div><div class="card-title">Section 3 — Film Heat Transfer Coefficients</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">The film coefficient h [W/m²·K] quantifies how effectively heat is conducted from the wall into the bulk fluid. It depends entirely on flow regime (Re), fluid properties (Pr), and geometry (D, L). This calculator uses the <strong>Gnielinski (1976)</strong> correlation for tube-side and the <strong>Bell-Delaware method</strong> for shell-side — both are the current industry standards.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;margin-bottom:20px">

    <div class="info-box">
      <div class="info-box-title">🔢 Dimensionless Groups — The Foundations</div>
      <div class="info-box-body">
        <div class="formula-box">Re = ρ·v·D / μ = 4ṁ / (π·D·μ) &nbsp;&nbsp; [Reynolds]<br>Pr = μ·c_p / k = ν / α &nbsp;&nbsp; [Prandtl]<br>Nu = h·D / k &nbsp;&nbsp; [Nusselt]</div>
        <strong>Flow regime boundaries (tube flow):</strong><br>
        Re &lt; 2 300 → Laminar (Nu ≈ 3.66 fully developed)<br>
        2 300 &lt; Re &lt; 10 000 → Transition (interpolate)<br>
        Re &gt; 10 000 → Turbulent (Gnielinski applies)<br><br>
        <strong>Prandtl number for common fluids:</strong><br>
        Water (20°C): Pr ≈ 7 | Water (80°C): Pr ≈ 2.2<br>
        Light oil: Pr ≈ 30–200 | Air: Pr ≈ 0.71<br>
        Steam: Pr ≈ 1.0 | Liquid metals: Pr ≈ 0.003–0.03
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">💧 Tube-Side: Gnielinski (1976)</div>
      <div class="info-box-body">
        The most accurate single-phase turbulent correlation for 0.5 ≤ Pr ≤ 2000 and 3000 ≤ Re ≤ 5×10⁶:
        <div class="formula-box">Nu = (f/8)(Re−1000)Pr / [1 + 12.7√(f/8)(Pr²/³−1)]<br>f = (0.790·ln Re − 1.64)⁻² &nbsp; (Petukhov friction factor)</div>
        <strong>L/D entry correction (Hausen)</strong> — significant when L/D &lt; 60:
        <div class="formula-box">Nu_corrected = Nu × [1 + (D/L)^(2/3)]</div>
        <strong>Why not Dittus-Boelter?</strong> Nu = 0.023·Re⁰·⁸·Prⁿ is simpler but overestimates h by 15–25% in the transition region and for Pr &lt; 1. Gnielinski is preferred in all serious design work and is the default in this calculator.
        <br><br>
        <strong>Typical h values (liquid water, v = 1.5 m/s, D = 20 mm):</strong> h ≈ 4 000–8 000 W/m²·K depending on temperature.
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">🐚 Shell-Side: Bell-Delaware Method</div>
      <div class="info-box-body">
        The Bell-Delaware method accounts for the complex flow patterns in a baffled shell — bypass streams, leakage through baffle-to-shell clearances, and unequal baffle spacing at the inlet/outlet nozzles. It applies correction factors to an idealised cross-flow h:
        <div class="formula-box">h_s = h_ideal × J_c × J_l × J_b × J_s × J_r</div>
        <strong>Correction factors:</strong><br>
        J_c = baffle cut geometry (0.65–1.15)<br>
        J_l = baffle-to-shell + tube-to-baffle leakage (0.70–0.90)<br>
        J_b = bundle bypass (0.65–0.95)<br>
        J_s = unequal end-spacing (0.85–1.00)<br>
        J_r = laminar flow correction (&lt;Re 100)<br><br>
        <strong>Combined J product</strong> is typically 0.5–0.7, meaning real shell-side h is 30–50% below the idealised value. This is why Bell-Delaware results look conservative compared to simplified methods.
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">🎯 Maximising h in Practice</div>
      <div class="info-box-body">
        <strong>Tube side:</strong><br>
        — Increase velocity: h ∝ v⁰·⁸. Doubling velocity raises h by 74%.<br>
        — Prefer smaller diameter tubes (larger h, but more tubes needed).<br>
        — L/D &gt; 40 for turbulent fully-developed flow assumptions to hold.<br>
        — Keep Re &gt; 10 000 for good turbulence; avoid transition zone.<br><br>
        <strong>Shell side:</strong><br>
        — Baffle cut 25% is typical optimum (balances h vs ΔP).<br>
        — Baffle spacing B ≈ 0.2–0.5 × shell ID is the normal design range.<br>
        — Triangular pitch (30°) gives ~15% higher h than square pitch for same pitch ratio.<br>
        — Target pitch/OD ratio 1.25–1.33 for most services.<br>
        — Seal strips reduce bypass and improve J_b toward 1.0.
      </div>
    </div>

  </div>

  <!-- Correlation comparison table -->
  <div class="sec-hd blue">📊 Tube-Side Correlation Comparison</div>
  <div class="tbl-wrap">
    <table class="dtbl">
      <thead><tr><th>Correlation</th><th>Regime</th><th>Pr Range</th><th>Accuracy</th><th>Used by this calculator</th></tr></thead>
      <tbody>
        <tr><td class="lbl-col">Gnielinski (1976)</td><td>Turbulent + transition</td><td>0.5–2 000</td><td>±10%</td><td style="color:var(--ok);font-weight:700">✓ Default</td></tr>
        <tr><td class="lbl-col">Dittus-Boelter (1930)</td><td>Turbulent only (Re &gt; 10 000)</td><td>0.6–160</td><td>±25%</td><td style="color:var(--t3)">Not used</td></tr>
        <tr><td class="lbl-col">Sieder-Tate (1936)</td><td>Laminar, entry length dominated</td><td>0.5–17 000</td><td>±20%</td><td style="color:var(--ok);font-weight:700">✓ Laminar fallback</td></tr>
        <tr><td class="lbl-col">Petukhov-Kirillov</td><td>Turbulent Pr 0.5–2000</td><td>0.5–2 000</td><td>±12%</td><td style="color:var(--t3)">Not used (similar to Gnielinski)</td></tr>
        <tr><td class="lbl-col">Churchill-Bernstein</td><td>External crossflow cylinder</td><td>Any</td><td>±20%</td><td style="color:var(--t3)">Shell side (idealised)</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 4 — HX TYPES COMPARED
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#c07800,#8a5200)">⚖️</div><div class="card-title">Section 4 — Heat Exchanger Types: Design Selection Guide</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">Selecting the wrong exchanger type is one of the most expensive engineering mistakes. The decision matrix below captures the key engineering and economic trade-offs. Use the <strong>🎯 HX Selector</strong> tab for an interactive recommendation.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:20px">

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-left:4px solid var(--red);border-radius:var(--r-md);padding:16px 18px">
      <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--red);margin-bottom:10px">⚙️ Shell &amp; Tube (S&amp;T)</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">
        <strong>Best for:</strong> High pressure (&gt;30 bar), high temperature, large duties, fouling services, phase change.<br>
        <strong>Pressure range:</strong> Vacuum to &gt;700 bar (TEMA R)<br>
        <strong>Temperature:</strong> −200°C to &gt;600°C with correct materials<br>
        <strong>Area per unit:</strong> 1–1 000 m²<br>
        <strong>U typical:</strong> 100–2 000 W/m²K<br>
        <strong>Cleaning:</strong> Tube side mechanically cleanable; shell side chemical<br>
        <strong>Weakness:</strong> Large footprint, heavy, 4–10× volume of PHE for same duty in clean service<br>
        <strong>TEMA designation:</strong> 3-letter code (e.g. BEM, AES, BEU) front–shell–rear
      </div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-left:4px solid var(--blue);border-radius:var(--r-md);padding:16px 18px">
      <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--blue);margin-bottom:10px">🔲 Plate Heat Exchanger (PHE)</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">
        <strong>Best for:</strong> Clean liquid–liquid, dairy/pharma (hygienic), low-to-medium pressure, tight temperature approaches.<br>
        <strong>Pressure range:</strong> Up to 25 bar (standard gasket), 40+ bar (semi-welded)<br>
        <strong>Temperature:</strong> −20°C to 180°C (gasket limited)<br>
        <strong>Area per unit:</strong> 0.1–2 500 m²<br>
        <strong>U typical:</strong> 2 000–7 000 W/m²K (3–5× higher than S&amp;T)<br>
        <strong>Cleaning:</strong> Fully cleanable — open and clean in place<br>
        <strong>Weakness:</strong> Gaskets degrade with aggressive solvents/high T; not for slurries or very fouling services<br>
        <strong>Advantage:</strong> Counter-current in single pass; very close temperature approaches
      </div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-left:4px solid var(--teal);border-radius:var(--r-md);padding:16px 18px">
      <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--teal);margin-bottom:10px">💨 Air-Cooled (ACHE) &amp; Fin-Fan</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">
        <strong>Best for:</strong> Remote locations with no cooling water, overhead condensers on distillation columns, gas plant coolers.<br>
        <strong>Pressure range:</strong> Up to 200+ bar (tube bundle can be high-P)<br>
        <strong>Temperature:</strong> Process fluid to 300°C; air ambient to 50°C<br>
        <strong>Area per unit:</strong> 100–10 000 m² (fin area)<br>
        <strong>U typical:</strong> 30–100 W/m²K (bare tube basis — use fin efficiency)<br>
        <strong>Cleaning:</strong> Water wash from outside; tube side piggable<br>
        <strong>Weakness:</strong> Performance degrades in hot weather; very large plot area; noise<br>
        <strong>Fin efficiency:</strong> η_fin = tanh(mL)/(mL) where m = √(2h/k_fin·t_fin)
      </div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-left:4px solid #7c3aed;border-radius:var(--r-md);padding:16px 18px">
      <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#7c3aed;margin-bottom:10px">↔️ Double Pipe &amp; Hairpin</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">
        <strong>Best for:</strong> Small duties (&lt;500 kW), high-pressure narrow streams, pilot plants, true counter-current in one pass.<br>
        <strong>Pressure range:</strong> Essentially unlimited (small diameter)<br>
        <strong>Temperature:</strong> −200°C to &gt;500°C<br>
        <strong>Area per unit:</strong> 0.5–50 m²<br>
        <strong>U typical:</strong> 500–2 000 W/m²K (both streams turbulent)<br>
        <strong>Cleaning:</strong> Fully removable; both sides accessible<br>
        <strong>Weakness:</strong> Expensive per m² for large duties; many connections at scale<br>
        <strong>Advantage:</strong> Genuinely pure counter-current; very high ΔT available in single pass
      </div>
    </div>

  </div>

  <div class="sec-hd" style="color:var(--gold);border-bottom-color:#e8d080">📊 Selection Matrix</div>
  <div class="tbl-wrap">
    <table class="dtbl">
      <thead><tr><th>Criterion</th><th>Shell &amp; Tube</th><th>Plate HX</th><th>Air Cooled</th><th>Double Pipe</th></tr></thead>
      <tbody>
        <tr><td class="lbl-col">Max pressure</td><td style="color:var(--ok)">★★★★★</td><td>★★☆☆☆</td><td>★★★★☆</td><td style="color:var(--ok)">★★★★★</td></tr>
        <tr><td class="lbl-col">Max temperature</td><td style="color:var(--ok)">★★★★★</td><td>★★☆☆☆</td><td>★★★★☆</td><td style="color:var(--ok)">★★★★★</td></tr>
        <tr><td class="lbl-col">High fouling service</td><td style="color:var(--ok)">★★★★★</td><td>★★☆☆☆</td><td>★★★☆☆</td><td>★★★☆☆</td></tr>
        <tr><td class="lbl-col">Area efficiency (U)</td><td>★★★☆☆</td><td style="color:var(--ok)">★★★★★</td><td>★★☆☆☆</td><td>★★★☆☆</td></tr>
        <tr><td class="lbl-col">Close ΔT_approach</td><td>★★★☆☆</td><td style="color:var(--ok)">★★★★★</td><td>★★☆☆☆</td><td>★★★★☆</td></tr>
        <tr><td class="lbl-col">No cooling water needed</td><td>★☆☆☆☆</td><td>★☆☆☆☆</td><td style="color:var(--ok)">★★★★★</td><td>★☆☆☆☆</td></tr>
        <tr><td class="lbl-col">Capital cost per kW</td><td>★★★☆☆</td><td style="color:var(--ok)">★★★★☆</td><td>★★★☆☆</td><td>★★☆☆☆</td></tr>
        <tr><td class="lbl-col">Ease of cleaning</td><td>★★★☆☆</td><td style="color:var(--ok)">★★★★★</td><td>★★★☆☆</td><td style="color:var(--ok)">★★★★★</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 5 — FOULING: THE SILENT KILLER
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#b36000,#7a4000)">🧫</div><div class="card-title">Section 5 — Fouling: The Silent Killer of HX Performance</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">Fouling — the accumulation of unwanted deposits on heat transfer surfaces — is responsible for an estimated <strong>$7–10 billion per year</strong> in additional energy costs and maintenance in the process industries alone. Understanding its mechanisms and how to quantify its effect is essential for any serious design.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:20px">

    <div class="info-box">
      <div class="info-box-title">📐 The Fouling Resistance Model</div>
      <div class="info-box-body">
        Fouling adds a thermal resistance R_f [m²·K/W] to each side of the exchanger. The service overall coefficient U_s is always lower than the clean coefficient U_c:
        <div class="formula-box">1/U_s = 1/U_c + R_f,shell + R_f,tube<br><br>Cleanliness factor: CF = U_s / U_c = 1 / (1 + U_c·R_f,total)</div>
        <strong>Impact on required area:</strong>
        <div class="formula-box">A_service = A_clean × (U_c / U_s) = A_clean × (1 + U_c·R_f,total)</div>
        For U_c = 1 000 W/m²K and R_f,total = 0.0004 m²K/W:<br>
        CF = 1/(1 + 1000×0.0004) = 0.71 → <strong>area must be 41% larger</strong>
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">⚗️ Five Fouling Mechanisms</div>
      <div class="info-box-body">
        <strong>1. Particulate / sedimentation:</strong> Suspended solids settle when velocity falls below ~0.5 m/s. Keep v &gt; 1 m/s in tubes.
        <br><br>
        <strong>2. Crystallisation / scaling:</strong> CaCO₃, CaSO₄ deposit when solubility decreases with temperature (inverse solubility). Dominates in hard-water coolers. Softening or anti-scalant dosing required.
        <br><br>
        <strong>3. Biological:</strong> Algae, bacteria, slime in once-through cooling water. Chlorination at 0.1–0.5 ppm continuous or 1–5 ppm shock-dose.
        <br><br>
        <strong>4. Chemical reaction:</strong> Polymerisation, cracking, coking in hot hydrocarbon streams above 200°C. Wall temperature must stay below the reaction threshold.
        <br><br>
        <strong>5. Corrosion product:</strong> Fe₂O₃, CuO form on carbon steel and copper tubes. Stainless or special alloys, or water treatment (pH, dissolved oxygen control).
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">🛠️ Mitigation Strategies</div>
      <div class="info-box-body">
        <strong>Design measures:</strong><br>
        — Maintain tube velocity &gt; 1.2 m/s (liquids) to suppress settling and inhibit crystallisation<br>
        — Keep wall temperature below reaction/precipitation thresholds<br>
        — Specify smooth bore tubes; 316L SS has lower biofilm affinity than CS<br>
        — Use removable bundles for mechanical cleaning access<br>
        — Limit hot-end wall temperature on crude service: T_wall = T_fluid + Q/(h·A); aim &lt; 280°C<br><br>
        <strong>Operational measures:</strong><br>
        — CIP (clean-in-place) with HCl or NaOH circuits<br>
        — Periodic hydroblasting for tube-side<br>
        — On-line ball cleaning systems for critical coolers<br>
        — Monitor ΔT and ΔP trends — fouling shows up as rising ΔT for same Q and/or rising ΔP for same flow
      </div>
    </div>

  </div>

  <div class="note" style="background:var(--gold-lt);border-color:rgba(192,120,0,.2);border-left-color:var(--gold)">
    <div class="note-title" style="color:var(--gold)">📏 TEMA Fouling Factors — Engineering Intent</div>
    <div class="note-body">
      TEMA fouling values are <strong>not predictions of actual deposit thickness</strong> — they are conservatively chosen design margins to ensure the exchanger still meets the process duty at the end of its cleaning cycle. In high-cleanliness services (pharmaceuticals, ultra-pure water), using published TEMA values can result in significant over-design. In crude oil and heavy fuel oil services, TEMA values may be optimistic — project-specific values from plant operating data should always be used when available.<br><br>
      <strong>Rule of thumb:</strong> For water–water service, every 0.0001 m²K/W of fouling resistance reduces U by approximately 10–15% relative to the clean value (when U_clean ≈ 800–1000 W/m²K).
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 6 — PRESSURE DROP
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#0055c8,#003fa0)">💧</div><div class="card-title">Section 6 — Pressure Drop Design &amp; Optimisation</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">Pressure drop represents pumping energy consumed continuously over the exchanger's 20–30 year life. It must be constrained within allowable limits set by the pumping system, and it is in direct tension with heat transfer — the same geometric changes that improve h also increase ΔP.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:20px">

    <div class="info-box">
      <div class="info-box-title">📐 Tube-Side ΔP Formula</div>
      <div class="info-box-body">
        <div class="formula-box">ΔP_tube = f · (L/D_i) · (ρ·v²/2) + N_p · (ρ·v²/2) · K_b<br><br>f = (0.790·ln Re − 1.64)⁻²  (turbulent, smooth tube)<br>N_p = number of tube passes &nbsp; K_b ≈ 1.5–2.0 (return bends)</div>
        <strong>Key levers:</strong><br>
        — Fewer passes → lower ΔP (but lower h too — the trade-off)<br>
        — Larger diameter tubes → lower v → lower ΔP ∝ v²<br>
        — Shorter tubes → lower ΔP but need more tubes for same area<br><br>
        <strong>Allowable ΔP guidelines:</strong><br>
        — Process shell &amp; tube: 35–70 kPa (0.35–0.70 bar) typical<br>
        — Cooling water (tube side): 50–80 kPa<br>
        — High-pressure gas stream: up to 200 kPa<br>
        — Gravity-drained condensers: 5–15 kPa max
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">📐 Shell-Side ΔP (Bell-Delaware)</div>
      <div class="info-box-body">
        <div class="formula-box">ΔP_shell = ΔP_crossflow + ΔP_windows + ΔP_end_zones<br><br>ΔP_crossflow ∝ (N_b − 1) · f_s · ρ · v_s²<br>Window ΔP increases with smaller baffle cut</div>
        <strong>Baffle geometry effects:</strong><br>
        — Baffle spacing B: ΔP ∝ (1/B)². Increase spacing to halve ΔP, but also reduces h.<br>
        — Baffle cut: 25% is standard. Larger cut (30–40%) reduces ΔP and h equally.<br>
        — Number of baffles N_b = L/B − 1. Fewer baffles = lower ΔP.<br><br>
        <strong>Allowable shell-side ΔP:</strong><br>
        — Process streams: 35–100 kPa<br>
        — Steam condensing: 5–15 kPa (vapour is sensitive to back-pressure)<br>
        — Once-through cooling water: 30–60 kPa
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">⚡ The h vs ΔP Trade-Off</div>
      <div class="info-box-body">
        Both h and ΔP increase with velocity — they cannot be optimised independently. The engineering objective is to achieve the required Q within the allowable ΔP:
        <div class="formula-box">h ∝ v⁰·⁸ (turbulent) &nbsp;&nbsp; ΔP ∝ v¹·⁸ (turbulent)</div>
        Doubling velocity: h increases by 74%, ΔP by 287%. <strong>ΔP rises much faster than h.</strong>
        <br><br>
        <strong>Practical approach for tube-side design:</strong><br>
        1. Fix allowable ΔP → back-calculate max velocity v_max<br>
        2. Calculate h at v_max → check if sufficient<br>
        3. If h too low → change fluid allocation (put high-h fluid on tube side), use enhanced tubes, or split the exchanger<br><br>
        <strong>Pumping power per unit area:</strong>
        <div class="formula-box">P_pump = Q_tube × ΔP_tube / ρ &nbsp;&nbsp; [W]<br>Annualised cost: P_pump × hrs/yr × elec tariff</div>
      </div>
    </div>

  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 7 — TEMA CODES & STANDARDS
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#7c3aed,#5b21b6)">🏛️</div><div class="card-title">Section 7 — TEMA Standards, Codes &amp; Designations</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">TEMA (Tubular Exchanger Manufacturers Association) standards govern the mechanical design, fabrication tolerances, and materials for shell-and-tube heat exchangers. Understanding the 3-letter TEMA designation tells you the complete mechanical configuration at a glance.</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:20px">

    <div class="info-box">
      <div class="info-box-title">🔤 The 3-Letter TEMA Type Code</div>
      <div class="info-box-body">
        Every shell-and-tube HX is described by three letters: <strong>[Front Head] [Shell] [Rear Head]</strong>
        <br><br>
        <strong>Front heads (stationary):</strong><br>
        A = Channel with removable cover | B = Bonnet (integral cover)<br>
        C = Channel integral with tube sheet | N = Channel integral to shell<br><br>
        <strong>Shell types:</strong><br>
        E = Single pass (most common) | F = Two-pass with longitudinal baffle<br>
        G/H = Split flow | J = Divided flow | K = Kettle reboiler | X = Crossflow<br><br>
        <strong>Rear heads:</strong><br>
        L = Like A (removable) | M = Like B (bonnet) | S = Floating head with backing ring<br>
        T = Pull-through floating bundle (easiest clean) | U = U-tube bundle<br>
        W = Externally-sealed floating tube sheet<br><br>
        <strong>Common configurations:</strong><br>
        BEM = Fixed tube sheet (cheapest, for ΔT &lt; 50°C or low fouling)<br>
        AES = Floating head, good for fouling services<br>
        AEU = U-tube bundle, cheapest floating option<br>
        AKT = Kettle reboiler — pool boiling on shell side
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">🏗️ TEMA Classes R, B, C</div>
      <div class="info-box-body">
        <div style="display:grid;gap:10px">
          <div style="background:var(--red-lt);border:1px solid rgba(232,80,10,.2);border-radius:var(--r-sm);padding:10px">
            <div style="font-size:.78rem;font-weight:700;color:var(--red);margin-bottom:5px">Class R — Petroleum &amp; Petrochemical</div>
            <div style="font-size:.81rem;color:var(--t2);line-height:1.6">Heaviest construction. Smallest allowable tolerances on clearances, tube-sheet thickness, nozzle reinforcement. Mandatory for refinery and upstream oil &amp; gas. Max corrosion allowance 3.2 mm (1/8"). Thicker tube sheets, more conservative stress calculations. Specify R when: flammable / toxic service, high temperature, or long run-lengths between maintenance.</div>
          </div>
          <div style="background:var(--blue-lt);border:1px solid rgba(0,85,200,.15);border-radius:var(--r-sm);padding:10px">
            <div style="font-size:.78rem;font-weight:700;color:var(--blue);margin-bottom:5px">Class B — Chemical Process Industry</div>
            <div style="font-size:.81rem;color:var(--t2);line-height:1.6">Intermediate specification. More economical than R but still engineered for reliable CPI service. Widely used in bulk chemical, specialty chemical, and pharma plants. Good default for new designs where Class R is not mandated by process safety review.</div>
          </div>
          <div style="background:var(--teal-lt);border:1px solid rgba(0,143,118,.15);border-radius:var(--r-sm);padding:10px">
            <div style="font-size:.78rem;font-weight:700;color:var(--teal);margin-bottom:5px">Class C — Commercial &amp; General</div>
            <div style="font-size:.81rem;color:var(--t2);line-height:1.6">Lightest construction and largest tolerances. Lowest capital cost. Suitable for HVAC, domestic process, utilities, non-hazardous clean fluids. Not appropriate for fired heater service, high-fouling, or flammable/toxic streams.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">📏 Key TEMA Mechanical Parameters</div>
      <div class="info-box-body">
        <strong>Tube dimensions (preferred OD × wall):</strong><br>
        19.05 mm × 2.11 mm | 25.4 mm × 2.11 mm | 25.4 mm × 2.77 mm<br>
        31.75 mm × 2.77 mm (large, for viscous or fouling fluids)<br><br>
        <strong>Pitch ratios:</strong> PT/OD ≥ 1.25 (minimum for cleaning)<br>
        Standard: 1.25 (triangular 30°) | 1.25 (square 90°) | 1.41 (rotated square 45°)<br><br>
        <strong>Baffle parameters:</strong><br>
        Baffle cut: 15–45%, standard 25%<br>
        Baffle spacing: 0.2·D_s ≤ B ≤ 1.0·D_s<br>
        Minimum: max(50 mm, 0.2·D_s)<br><br>
        <strong>Shell diameter standard range:</strong><br>
        152 mm (6") to 3048 mm (120") in TEMA standard increments<br><br>
        <strong>Tube-sheet thickness rule-of-thumb:</strong><br>
        t_ts ≥ 0.75·OD + C_a (corrosion allowance) for fixed tube sheet
      </div>
    </div>

  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 8 — DESIGN PROCEDURE WALKTHROUGH
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon teal">📋</div><div class="card-title">Section 8 — Complete Design Procedure: Step-by-Step Walkthrough</div></div>

  <p style="font-size:.88rem;color:var(--t2);line-height:1.8;margin-bottom:20px">This is the systematic procedure for designing a shell-and-tube heat exchanger from a process specification. Follow this sequence to avoid iteration traps and ensure every decision is technically defensible. For other types the logic is the same — only the correlation choices differ.</p>

  <div style="display:flex;flex-direction:column;gap:0">

    <!-- Step 1 -->
    <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--bdr)">
      <div style="min-width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-dk));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.9rem;flex-shrink:0;margin-top:2px;box-shadow:0 3px 10px rgba(232,80,10,.28)">1</div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--t1);font-size:.95rem;margin-bottom:6px">Define the Duty</div>
        <div style="font-size:.85rem;color:var(--t2);line-height:1.75">Establish all four terminal temperatures (or three + duty Q). Compute heat duty from the energy balance: Q = ṁ_h · c_p,h · ΔT_h = ṁ_c · c_p,c · ΔT_c. Check energy balance — imbalance &gt;5% means inconsistent inputs. Choose fluid allocation: put the corrosive fluid on tube side (easier to use expensive alloys on smaller surface), fouling fluid on tube side (mechanically cleanable), and high-pressure fluid on tube side (smaller diameter pressure-retaining wall).</div>
      </div>
    </div>

    <!-- Step 2 -->
    <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--bdr)">
      <div style="min-width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-dk));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.9rem;flex-shrink:0;margin-top:2px;box-shadow:0 3px 10px rgba(232,80,10,.28)">2</div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--t1);font-size:.95rem;margin-bottom:6px">Assume a U and Estimate Area</div>
        <div style="font-size:.85rem;color:var(--t2);line-height:1.75">Use U from the typical values table (Section 1) for a first estimate. Calculate LMTD, apply F-factor for configuration, then: A_est = Q / (U · F · ΔT_lm). This gives rough size. Also compute NTU = U·A/C_min to check whether ε is achievable — if NTU &gt; 5, check that temperature cross does not violate single-shell feasibility.</div>
      </div>
    </div>

    <!-- Step 3 -->
    <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--bdr)">
      <div style="min-width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-dk));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.9rem;flex-shrink:0;margin-top:2px;box-shadow:0 3px 10px rgba(232,80,10,.28)">3</div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--t1);font-size:.95rem;margin-bottom:6px">Select Geometry</div>
        <div style="font-size:.85rem;color:var(--t2);line-height:1.75">Choose tube OD, wall thickness, pitch ratio, pitch layout (triangular for highest area density; square for cleaning access), tube length (standard: 1.83, 2.44, 3.66, 4.88, 6.10 m), baffle cut (start with 25%), baffle spacing (B = 0.4–0.5 × D_s), and TEMA type. Estimate the number of tubes N_t = A_est / (π·OD·L), then estimate shell diameter from bundle geometry. Round to nearest standard shell diameter.</div>
      </div>
    </div>

    <!-- Step 4 -->
    <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--bdr)">
      <div style="min-width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-dk));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.9rem;flex-shrink:0;margin-top:2px;box-shadow:0 3px 10px rgba(232,80,10,.28)">4</div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--t1);font-size:.95rem;margin-bottom:6px">Calculate h, U, Area, and Check ΔP</div>
        <div style="font-size:.85rem;color:var(--t2);line-height:1.75">Compute tube-side velocity → Re → Pr → Gnielinski → h_tube. Compute shell-side cross-flow velocity → Bell-Delaware → h_shell with all J-factors. Build the full resistance network: 1/U = 1/h_shell + R_f,shell + wall resistance + R_f,tube·(A_o/A_i) + (1/h_tube)·(A_o/A_i). Then A_required = Q / (U · F · ΔT_lm). Compute ΔP_tube and ΔP_shell separately and check against allowables.</div>
      </div>
    </div>

    <!-- Step 5 -->
    <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--bdr)">
      <div style="min-width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-dk));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.9rem;flex-shrink:0;margin-top:2px;box-shadow:0 3px 10px rgba(232,80,10,.28)">5</div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--t1);font-size:.95rem;margin-bottom:6px">Check Overdesign and Iterate</div>
        <div style="font-size:.85rem;color:var(--t2);line-height:1.75">Overdesign % = (A_available − A_required) / A_required × 100%. Target: 10–20% for process service (allows for fouling uncertainty and future process creep). More than 30% overdesign can cause flow distribution problems (too much bypass area) and increased ΔP on the cold end. If ΔP exceeds allowable: increase baffle spacing, increase tube diameter, or reduce number of passes. If U is too low: increase velocity, reduce pitch ratio, or change fluid allocation.</div>
      </div>
    </div>

    <!-- Step 6 -->
    <div style="display:flex;gap:14px;padding:16px 0">
      <div style="min-width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--red-dk));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:.9rem;flex-shrink:0;margin-top:2px;box-shadow:0 3px 10px rgba(232,80,10,.28)">6</div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--t1);font-size:.95rem;margin-bottom:6px">Specify and Document</div>
        <div style="font-size:.85rem;color:var(--t2);line-height:1.75">Complete a TEMA datasheet (can be generated with the PDF export in this tool). Specify: service, TEMA type, shell ID, tube count, OD×WT, length, pitch, baffle cut/spacing, materials (shell, tubes, tube sheet, baffles), design P and T for each side, test pressure (1.3–1.5× design), corrosion allowance, joint efficiency E, TEMA class, surface area, and fouling factors. Submit to fabricators with TEMA datasheet as the binding document.</div>
      </div>
    </div>

  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTION 9 — COMMON MISTAKES & FAQ
════════════════════════════════════════════ -->
<div class="card" style="margin-bottom:16px">
  <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#1b7a3e,#0e4f27)">❓</div><div class="card-title">Section 9 — Common Mistakes, Traps &amp; FAQs</div></div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;margin-bottom:20px">

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--err);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--err);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">⛔ Mistake 1 — Using Celsius in Carnot-type or absolute formulas</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">The heat exchanger equations use temperature <em>differences</em> (ΔT), so Celsius and Kelvin give identical results for ΔT. However, fluid property correlations (density, viscosity) require absolute temperature in K. The calculator converts internally — but if you export values for manual calculation, always use Kelvin for ρ and μ of gases.</div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--err);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--err);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">⛔ Mistake 2 — Ignoring the F-factor (accepting F &lt; 0.75)</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">The LMTD correction factor F accounts for the departure from true counter-current flow in multi-pass arrangements. When F drops below 0.75, the exchanger approaches a thermodynamic "pinch" — adding more area gives diminishing returns. Solution: use 2 shells in series (each with 1-2 pass), which brings F back above 0.85.</div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--warn);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--warn);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">⚠ Mistake 3 — Putting the wrong fluid on the tube side</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">Rule: <strong>corrosive, high-pressure, fouling, and toxic fluids go on the tube side.</strong> The tube side is cheaper to build in exotic alloys (smaller surface), easier to clean mechanically, and safer to contain (tube failure = controlled leak into shell). Putting corrosive fluid on the shell side means the entire shell, baffles, and tube sheet must be in the expensive alloy.</div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--warn);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--warn);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">⚠ Mistake 4 — Forgetting that U_service &lt; U_clean always</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">Every exchanger is designed "clean" but operates "fouled". The service U is always lower than the clean U. If you size for U_clean and achieve exactly A_clean, your exchanger will under-perform from the first day of fouling. Always design for U_service (i.e., include fouling resistances) and specify U_clean on the datasheet for performance monitoring.</div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--ok);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">✅ FAQ — When should I use a plate HX instead of S&amp;T?</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">Use a plate HX when: (1) operating pressure &lt; 25 bar, (2) operating temperature &lt; 180°C, (3) fluids are clean or mildly fouling, (4) close temperature approaches (&lt;5°C) are needed, (5) compact size matters. The 3–5× higher U of plate HX dramatically reduces capital cost in clean liquid–liquid service. For slurries, heavy oil, high-P, or high-T service, stay with shell-and-tube.</div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--ok);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">✅ FAQ — What causes a large energy balance error (&gt;5%)?</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">Common causes: (1) Using different c_p values for inlet vs mean temperature, especially for gases or wide-range liquids. (2) Phase change on one side (condensation / vaporisation adds or removes latent heat not captured in sensible c_p·ΔT). (3) Heat loss to ambient not accounted for (significant for bare, uninsulated high-T exchangers). (4) Mass flow unit error (kg/h vs kg/s). Always perform the energy balance first before any sizing work.</div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--blue);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">ℹ FAQ — How accurate are the calculator results?</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">Tube-side Gnielinski: ±10% for fully turbulent flow with Pr 0.5–2000. Bell-Delaware shell-side: ±25–30% — inherently less accurate due to baffle clearance uncertainties and bundle bypassing. Always add 15–20% design margin before ordering. For finned-tube air coolers, accuracy is ±20–30% due to fin contact resistance and air maldistribution variability. Results are for preliminary and checking calculations — not a substitute for detailed thermal software (HTRI, Aspen EDR) for final specification.</div>
    </div>

    <div style="background:var(--surf2);border:1px solid var(--bdr);border-top:3px solid var(--blue);border-radius:var(--r-md);padding:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">ℹ FAQ — What is vibrational damage and how do I avoid it?</div>
      <div style="font-size:.83rem;color:var(--t2);line-height:1.75">Flow-induced tube vibration (FIV) occurs when the shell-side cross-flow velocity excites tubes at or near their natural frequency. Signs: unusual noise, tube thinning at baffle contact points, rapid fatigue failures. Prevention: (1) limit unsupported tube span (reduce baffle spacing at inlet), (2) use impingement baffles at inlet nozzle, (3) check that shell-side velocity is below 80% of the critical velocity (Connors' criterion), (4) detuning: use odd-count baffle arrangements. Most critical at inlet/outlet nozzles where velocity is highest.</div>
    </div>

  </div>

  <!-- Quick-reference glossary -->
  <div class="sec-hd teal">📖 Essential Symbols &amp; Units</div>
  <div class="tbl-wrap">
    <table class="dtbl">
      <thead><tr><th>Symbol</th><th>Quantity</th><th>SI Unit</th><th>Typical Values / Notes</th></tr></thead>
      <tbody>
        <tr><td class="lbl-col" style="font-family:var(--mono)">Q</td><td>Heat duty</td><td>kW</td><td>Q = ṁ·c_p·ΔT — always balance hot and cold side first</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">U</td><td>Overall heat transfer coeff.</td><td>W/m²·K</td><td>50–6 000 depending on service — see Section 1 table</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">A</td><td>Heat transfer area</td><td>m²</td><td>Typically based on tube outer surface (A_o = π·OD·N·L)</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">ΔT_lm</td><td>Log mean temperature difference</td><td>K (or °C)</td><td>Effective temperature driving force; always &gt; 0</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">F</td><td>LMTD correction factor</td><td>—</td><td>0.75–1.0; &lt;0.75 = problem; = 1.0 for pure counter-current</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">h</td><td>Film heat transfer coefficient</td><td>W/m²·K</td><td>100–20 000 depending on fluid and velocity</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">R_f</td><td>Fouling resistance</td><td>m²·K/W</td><td>Typical: 0.0001–0.0009; from TEMA 9th ed. Table RGP-T-2.4</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">NTU</td><td>Number of Transfer Units</td><td>—</td><td>NTU = U·A/C_min; typical 0.5–4.0</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">ε</td><td>Heat exchanger effectiveness</td><td>—</td><td>0–1; target 0.65–0.85 for most process exchangers</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">C_r</td><td>Heat capacity ratio C_min/C_max</td><td>—</td><td>0 = condenser/evaporator; 1 = balanced; impacts ε−NTU curves</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">Re</td><td>Reynolds number</td><td>—</td><td>&lt;2300 laminar; &gt;10000 turbulent; keep &gt;10000 in tubes</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">Pr</td><td>Prandtl number</td><td>—</td><td>Water: 2–7; oils: 30–1000; gases: 0.7; liquid metals: &lt;0.05</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">Nu</td><td>Nusselt number</td><td>—</td><td>Nu = h·D/k; links h to fluid properties and geometry</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">ΔP</td><td>Pressure drop</td><td>kPa (or bar)</td><td>Tube: 35–70 kPa; shell: 35–100 kPa; condensers: &lt;15 kPa</td></tr>
        <tr><td class="lbl-col" style="font-family:var(--mono)">LMTD</td><td>Log Mean Temperature Difference</td><td>K</td><td>LMTD_counter &gt; LMTD_cross &gt; LMTD_parallel always</td></tr>
      </tbody>
    </table>
  </div>

  <div class="note" style="margin-top:16px">
    <div class="note-title">📚 Key References &amp; Further Reading</div>
    <div class="note-body">
      <strong>Standards:</strong> TEMA 9th Ed. (tubular HX); ASME Section VIII Div.1 (pressure vessels); EN 13445-3 (European vessels); API 660 (shell-and-tube for petroleum)<br>
      <strong>Textbooks:</strong> Kern, D.Q. — "Process Heat Transfer" (1950, classic, still widely used) | Shah &amp; Sekulić — "Fundamentals of Heat Exchanger Design" (2003, rigorous) | Hewitt, Shires &amp; Bott — "Process Heat Transfer" (1994, practical) | Kakaç &amp; Liu — "Heat Exchangers: Selection, Rating and Thermal Design"<br>
      <strong>Correlations:</strong> Gnielinski (1976) Int. Chem. Eng. 16:359 | Bell &amp; Fenske (1981) HEDH | Colburn J-factor method (air coolers) | Petukhov friction factor (Moody smooth-pipe)<br>
      <strong>Software (detailed design):</strong> HTRI Xchanger Suite | Aspen Exchanger Design &amp; Rating (EDR) | HTFS (now part of Aspen) | CHEMCAD HX module
    </div>
  </div>
</div>

</div><!-- /tab-defs -->

</div><!-- /wrap -->

<!-- ══════════════════════════════════════════════
     TAB: PRESSURE VESSEL WALL THICKNESS (ASME VIII / EN 13445)
══════════════════════════════════════════════ -->
<div id="tab-wall-thick" class="tab-pane">
  <div class="two-col">
    <div class="card">
      <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#6b21d4,#4c0d9e)">🔩</div><div class="card-title">Pressure Vessel Wall Thickness Calculator</div></div>
      <div class="sec-hd purple">⚙ ASME Sec. VIII Div. 1 / EN 13445 Cylinder</div>
      <div class="fgrid">
        <div class="fg"><label>Calculation Standard</label>
          <select id="wt_std">
            <option value="asme8d1">ASME VIII Div. 1 (UG-27)</option>
            <option value="en13445">EN 13445-3 (Clause 7)</option>
            <option value="bs5500">BS PD 5500</option>
          </select>
        </div>
        <div class="fg"><label>Vessel Type</label>
          <select id="wt_type">
            <option value="cylinder">Cylindrical Shell</option>
            <option value="sphere">Spherical Shell</option>
            <option value="cone">Conical Shell</option>
          </select>
        </div>
        <div class="fg"><label>Design Pressure (bar g)</label>
          <div class="irow"><input type="number" id="wt_P" value="10" step="0.1" min="0.01"><div class="ulab">bar g</div></div>
        </div>
        <div class="fg"><label>Internal Diameter (mm)</label>
          <div class="irow"><input type="number" id="wt_D" value="600" step="1" min="10"><div class="ulab">mm</div></div>
        </div>
        <div class="fg"><label>Allowable Stress at T_design (MPa)</label>
          <div class="irow"><input type="number" id="wt_S" value="138" step="1" min="1"><div class="ulab">MPa</div></div>
        </div>
        <div class="fg"><label>Joint Efficiency E</label>
          <select id="wt_E">
            <option value="1.0">1.0 — Fully radiographed (RT-1)</option>
            <option value="0.85" selected>0.85 — Spot radiographed (RT-2)</option>
            <option value="0.7">0.70 — No radiography</option>
            <option value="0.65">0.65 — Fillet welds (lap joint)</option>
          </select>
        </div>
        <div class="fg"><label>Corrosion Allowance (mm)</label>
          <div class="irow"><input type="number" id="wt_CA" value="3" step="0.5" min="0"><div class="ulab">mm</div></div>
        </div>
        <div class="fg"><label>Mill Under-tolerance (mm)</label>
          <div class="irow"><input type="number" id="wt_MT" value="0.6" step="0.1" min="0"><div class="ulab">mm</div></div>
        </div>
        <div class="fg"><label>Half-apex Angle (° — cone only)</label>
          <div class="irow"><input type="number" id="wt_alpha" value="30" step="1" min="1" max="60"><div class="ulab">°</div></div>
        </div>
        <div class="fg"><label>Material</label>
          <select id="wt_mat">
            <option value="138">SA-516-70 / P265GH (138 MPa @ 200°C)</option>
            <option value="118">SA-516-60 (118 MPa)</option>
            <option value="130">SA-516-65 (130 MPa)</option>
            <option value="103">SA-240-304 SS / 1.4301 (103 MPa @ 200°C)</option>
            <option value="96">SA-240-316 SS / 1.4401 (96 MPa @ 200°C)</option>
            <option value="115">SA-36 / S235 (115 MPa @ 200°C)</option>
            <option value="custom">Custom (enter value above)</option>
          </select>
        </div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-calc" onclick="calcWallThickness()">🔩 Calculate Wall Thickness</button>
        <button type="button" class="btn btn-reset" onclick="document.getElementById('wt_res').innerHTML='';document.getElementById('wt_res').style.display='none'">↺ Reset</button>
      </div>
    </div>
    <div class="card">
      <div id="wt_res" style="display:none"></div>
      <div id="wt_ph" class="placeholder"><div class="placeholder-icon">🔩</div><h3>Wall Thickness Results</h3><p>Enter vessel parameters and calculate per ASME VIII or EN 13445</p></div>
      <!-- Material reference table -->
      <div class="sec-hd purple" style="margin-top:16px">📊 Common Material Allowable Stresses</div>
      <div class="tbl-wrap"><table class="dtbl">
        <thead><tr><th>Material</th><th>Code</th><th>S @ 200°C (MPa)</th><th>S @ 300°C (MPa)</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="lbl-col">SA-516-70 / P265GH</td><td>ASME/EN</td><td>138</td><td>127</td><td>Most common vessel steel</td></tr>
          <tr><td class="lbl-col">SA-516-60 / P245GH</td><td>ASME/EN</td><td>118</td><td>109</td><td>Lower strength grade</td></tr>
          <tr><td class="lbl-col">SA-240-304 / 1.4301</td><td>ASME/EN</td><td>103</td><td>94</td><td>Austenitic SS, corrosion resistance</td></tr>
          <tr><td class="lbl-col">SA-240-316L / 1.4404</td><td>ASME/EN</td><td>96</td><td>88</td><td>SS with Mo for chloride resistance</td></tr>
          <tr><td class="lbl-col">SA-240-317L / 1.4438</td><td>ASME/EN</td><td>100</td><td>92</td><td>High Mo SS</td></tr>
          <tr><td class="lbl-col">SA-516-70 HT / P355GH</td><td>ASME/EN</td><td>172</td><td>161</td><td>Higher strength, heat treated</td></tr>
          <tr><td class="lbl-col">Titanium Gr.2 / 3.7035</td><td>ASME/EN</td><td>69</td><td>62</td><td>Excellent corrosion resistance</td></tr>
          <tr><td class="lbl-col">Hastelloy C276 / 2.4819</td><td>ASME/EN</td><td>138</td><td>128</td><td>High-alloy for severe service</td></tr>
        </tbody>
      </table></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     TAB: FOULING DATABASE
══════════════════════════════════════════════ -->
<div id="tab-fouling" class="tab-pane">
  <div class="card">
    <div class="card-hd"><div class="card-icon" style="background:linear-gradient(135deg,#b36000,#7a4000)">🧫</div><div class="card-title">Fouling Factor Database — TEMA Recommended Values</div></div>
    <p style="font-size:.85rem;color:var(--t2);margin-bottom:16px">TEMA 9th Edition Table RGP-T-2.4. Combine shell-side + tube-side fouling resistances for total R_f. Higher fouling = lower U and larger required area.</p>

    <div class="fgrid" style="margin-bottom:16px">
      <div class="fg"><label>Shell-side Service</label>
        <select id="foul_shell" onchange="calcFoulingCombined()">
          <option value="0.0001">Steam (oil-free): 0.000088 m²K/W</option>
          <option value="0.0001">Steam (with trace oil): 0.000176</option>
          <option value="0.0002">Cooling water (treated): 0.000176</option>
          <option value="0.0002" selected>River/lake water: 0.0002</option>
          <option value="0.0003">Seawater (above 52°C): 0.0003</option>
          <option value="0.0001">Seawater (below 52°C): 0.0001</option>
          <option value="0.0002">Light hydrocarbons (clean): 0.0002</option>
          <option value="0.0003">Light HC with impurities: 0.0003</option>
          <option value="0.0005">Heavy fuel oil: 0.0005</option>
          <option value="0.0009">Fuel oil (very heavy): 0.0009</option>
          <option value="0.0002">Amine solutions: 0.0002</option>
          <option value="0.0003">Brine: 0.0003</option>
          <option value="0.0002">Refrigerants: 0.0002</option>
        </select>
      </div>
      <div class="fg"><label>Tube-side Service</label>
        <select id="foul_tube" onchange="calcFoulingCombined()">
          <option value="0.0001">Steam (oil-free): 0.0001</option>
          <option value="0.0001">Boiler feed water (treated): 0.0001</option>
          <option value="0.0002" selected>Cooling water (towers): 0.0002</option>
          <option value="0.0003">Cooling water (river/hard): 0.0003</option>
          <option value="0.0001">Sea water below 52°C: 0.0001</option>
          <option value="0.0002">Light hydrocarbons: 0.0002</option>
          <option value="0.0004">Heavy fuel oil: 0.0004</option>
          <option value="0.0002">Gasoline: 0.0002</option>
          <option value="0.0003">Process water: 0.0003</option>
          <option value="0.0005">Crude oil (300-400°F): 0.0005</option>
          <option value="0.0007">Crude oil (above 400°F): 0.0007</option>
          <option value="0.0002">Chemical solutions (clean): 0.0002</option>
        </select>
      </div>
      <div class="fg"><label>U_clean (W/m²K) — for impact calc</label>
        <div class="irow"><input type="number" id="foul_U_clean" value="800" step="10" min="1" oninput="calcFoulingCombined()"><div class="ulab">W/m²K</div></div>
      </div>
    </div>
    <div id="foul_result" style="background:var(--blue-lt);border:1.5px solid rgba(0,85,200,.15);border-radius:var(--r-md);padding:14px 16px;margin-bottom:16px;font-size:.9rem;font-weight:600;color:var(--t1);display:none"></div>

    <div class="sec-hd" style="color:var(--gold);border-bottom-color:#e8cc80">📋 TEMA Recommended Fouling Resistances (m²K/W)</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px">
      <div>
        <div class="sec-hd teal" style="font-size:.72rem;margin-top:0">💧 Water Services</div>
        <div class="tbl-wrap"><table class="dtbl">
          <thead><tr><th>Service</th><th>R_f (m²K/W)</th></tr></thead>
          <tbody>
            <tr><td class="lbl-col">Sea water below 52°C</td><td>0.000088</td></tr>
            <tr><td class="lbl-col">Sea water above 52°C</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Treated cooling tower water</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">City or well water (hard)</td><td>0.000352</td></tr>
            <tr><td class="lbl-col">River water (min)</td><td>0.000352</td></tr>
            <tr><td class="lbl-col">River water (avg)</td><td>0.000528</td></tr>
            <tr><td class="lbl-col">Boiler feed water (treated)</td><td>0.000088</td></tr>
            <tr><td class="lbl-col">Boiler feed water (untreated)</td><td>0.000528</td></tr>
            <tr><td class="lbl-col">Distilled water</td><td>0.000088</td></tr>
            <tr><td class="lbl-col">Brine (refrigeration)</td><td>0.000352</td></tr>
          </tbody>
        </table></div>
      </div>
      <div>
        <div class="sec-hd red" style="font-size:.72rem;margin-top:0">⛽ Hydrocarbons &amp; Process</div>
        <div class="tbl-wrap"><table class="dtbl">
          <thead><tr><th>Service</th><th>R_f (m²K/W)</th></tr></thead>
          <tbody>
            <tr><td class="lbl-col">Fuel oil (clean)</td><td>0.000528</td></tr>
            <tr><td class="lbl-col">Fuel oil (very heavy)</td><td>0.000880</td></tr>
            <tr><td class="lbl-col">Crude oil (below 150°C)</td><td>0.000352</td></tr>
            <tr><td class="lbl-col">Crude oil (150–230°C)</td><td>0.000528</td></tr>
            <tr><td class="lbl-col">Crude oil (above 230°C)</td><td>0.000704</td></tr>
            <tr><td class="lbl-col">Gasoline/naphtha (clean)</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Light hydrocarbons (clean)</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Light HC (with impurities)</td><td>0.000352</td></tr>
            <tr><td class="lbl-col">Refrigerants (liquid)</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Steam (oil-free)</td><td>0.000088</td></tr>
          </tbody>
        </table></div>
      </div>
      <div>
        <div class="sec-hd blue" style="font-size:.72rem;margin-top:0">🧪 Chemical &amp; Special Services</div>
        <div class="tbl-wrap"><table class="dtbl">
          <thead><tr><th>Service</th><th>R_f (m²K/W)</th></tr></thead>
          <tbody>
            <tr><td class="lbl-col">Amine solutions</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Caustic solutions (clean)</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Acid solutions (clean)</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Organic solvents (clean)</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Vegetable oils</td><td>0.000528</td></tr>
            <tr><td class="lbl-col">Boiler flue gas</td><td>0.000880</td></tr>
            <tr><td class="lbl-col">Engine exhaust gas</td><td>0.001760</td></tr>
            <tr><td class="lbl-col">Refrigerant vapour</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Compressed air (clean)</td><td>0.000176</td></tr>
            <tr><td class="lbl-col">Salt brines (process)</td><td>0.000352</td></tr>
          </tbody>
        </table></div>
      </div>
    </div>

    <div class="note teal" style="margin-top:12px">
      <div class="note-title">📋 How to Use Fouling Factors</div>
      <div class="note-body">
        <ul>
          <li><strong>Combined fouling R_f_total = R_f_shell + R_f_tube</strong> — add both side resistances</li>
          <li>Impact on U: 1/U_service = 1/U_clean + R_f_total → U_service = U_clean / (1 + U_clean × R_f_total)</li>
          <li>Fouling adds 10–40% extra area requirement for most services — build in margin!</li>
          <li>For plate HX: fouling factor is typically half of shell-and-tube due to higher turbulence</li>
          <li>TEMA values are conservative guidelines; actual values depend on water treatment, velocity, temperature</li>
          <li>High velocity (>1.5 m/s liquid) reduces fouling tendency significantly</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<!-- ═══ CUSTOM FLUID MODAL ═══ -->
<div id="fluidModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-hd">
      <h2>➕ Add Custom Fluid</h2>
      <button class="modal-close" onclick="closeModal('fluidModal')">×</button>
    </div>
    <form id="cfForm">
      <div class="fg"><label>Fluid Name</label><input type="text" id="cf_name" placeholder="e.g. Process Oil A" required></div>
      <div class="modal-grid">
        <div class="fg"><label>Density (kg/m³)</label><input type="number" id="cf_rho" step="0.1" placeholder="e.g. 850" required></div>
        <div class="fg"><label>Viscosity (mPa·s)</label><input type="number" id="cf_mu" step="0.01" placeholder="e.g. 5.5" required></div>
        <div class="fg"><label>Specific Heat (kJ/kg·K)</label><input type="number" id="cf_cp" step="0.001" placeholder="e.g. 2.1" required></div>
        <div class="fg"><label>Thermal Cond. (W/m·K)</label><input type="number" id="cf_k" step="0.001" placeholder="e.g. 0.14" required></div>
      </div>
      <div class="btn-row">
        <button type="submit" class="btn btn-calc" style="flex:1">✓ Add Fluid</button>
        <button type="button" class="btn btn-reset" onclick="closeModal('fluidModal')">Cancel</button>
      </div>
    </form>
  </div>
</div>

<!-- ═══ SHARE MODAL ═══ -->
<div id="shareModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-hd">
      <h2>🔗 Share HeatXpert Pro</h2>
      <button class="modal-close" onclick="closeModal('shareModal')">×</button>
    </div>
    <p style="font-size:.85rem;color:var(--t2);margin-bottom:4px">Share this tool with colleagues and engineers:</p>
    <div class="share-modal-grid">
      <a class="share-platform linkedin" href="#" onclick="shareOn('linkedin');return false">
        <span class="sp-icon">💼</span>LinkedIn
      </a>
      <a class="share-platform twitter" href="#" onclick="shareOn('twitter');return false">
        <span class="sp-icon">𝕏</span>X / Twitter
      </a>
      <a class="share-platform whatsapp" href="#" onclick="shareOn('whatsapp');return false">
        <span class="sp-icon">💬</span>WhatsApp
      </a>
      <a class="share-platform telegram" href="#" onclick="shareOn('telegram');return false">
        <span class="sp-icon">✈️</span>Telegram
      </a>
      <a class="share-platform email" href="#" onclick="shareOn('email');return false">
        <span class="sp-icon">📧</span>Email
      </a>
      <a class="share-platform copy" href="#" onclick="copyShareLink();return false">
        <span class="sp-icon">📋</span>Copy Link
      </a>
    </div>
    <div class="share-url-box">
      <input type="text" id="shareUrlInput" value="https://heatxpert.pro" readonly>
      <button class="share-url-copy" onclick="copyShareLink()">Copy</button>
    </div>
    <div style="margin-top:16px;padding:12px 14px;background:var(--surf2);border-radius:var(--r-md);font-size:.8rem;color:var(--t2)">
      <strong style="color:var(--t1)">📊 Share your results:</strong> After calculating, use the "Share Results" button inside the results panel to share specific calculation outputs.
    </div>
  </div>
</div>

<!-- ═══ COMPARE MODAL ═══ -->
<div id="compareModal" class="modal-backdrop">
  <div class="modal" style="max-width:700px">
    <div class="modal-hd">
      <h2>⚖️ HX Types Comparison</h2>
      <button class="modal-close" onclick="closeModal('compareModal')">×</button>
    </div>
    <div class="tbl-wrap">
      <table class="dtbl">
        <thead><tr><th>Parameter</th><th>Shell &amp; Tube</th><th>Plate HX</th><th>Air Cooled</th><th>Double Pipe</th></tr></thead>
        <tbody>
          <tr><td class="lbl-col">U (W/m²K)</td><td>200–1000</td><td>1000–6000</td><td>30–80</td><td>300–1200</td></tr>
          <tr><td class="lbl-col">Max Pressure</td><td>&gt;600 bar</td><td>~30 bar</td><td>~100 bar</td><td>&gt;300 bar</td></tr>
          <tr><td class="lbl-col">Max Temp (°C)</td><td>&gt;600</td><td>~200</td><td>&gt;400</td><td>&gt;600</td></tr>
          <tr><td class="lbl-col">Fouling Tolerance</td><td>Good</td><td>Low</td><td>Moderate</td><td>Good</td></tr>
          <tr><td class="lbl-col">Footprint</td><td>Large</td><td>Compact</td><td>Very Large</td><td>Small</td></tr>
          <tr><td class="lbl-col">Min Approach ΔT</td><td>5–10°C</td><td>1–2°C</td><td>10–15°C</td><td>5°C</td></tr>
          <tr><td class="lbl-col">Cleaning</td><td>Easy</td><td>Easy (gasketed)</td><td>Moderate</td><td>Easy</td></tr>
          <tr><td class="lbl-col">Typical Cost</td><td>$$</td><td>$$$</td><td>$$$</td><td>$</td></tr>
          <tr><td class="lbl-col">Best For</td><td>General service</td><td>Liquid-liquid</td><td>No cooling water</td><td>Small duties</td></tr>
          <tr><td class="lbl-col">Standards</td><td>TEMA / ASME VIII</td><td>ASME VIII</td><td>API 661</td><td>TEMA / ASME</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- ═══════════════════ JAVASCRIPT ═══════════════════ -->
<script>
/* HeatXpert Pro — API-backed client | All calcs server-side via /api/heatxpert */
const GAS_RHO_THRESHOLD = 50;
// ── Sub-render helpers (eliminates deep template nesting) ────────────────────

function renderBlockDiagram(r) {
  var _uid = 's'+Date.now();
  var shellID_mm = (r.shellID * 1000).toFixed(0);
  var OD_mm      = (r.OD * 1000).toFixed(1);
  var Di_mm      = (r.Di * 1000).toFixed(1);
  var L_m        = r.L.toFixed(2);
  var pitch_mm   = (r.OD * 1000 * (r.pitchRatio || 1.25)).toFixed(1);
  var bspRatio   = r.bsp || 0.5;
  var bsp_mm     = (bspRatio * r.shellID * 1000).toFixed(0);
  var nBaffles   = r.bdCorr && r.bdCorr.nBaffles != null ? r.bdCorr.nBaffles : Math.max(1, Math.round(r.L / Math.max(bspRatio * r.shellID, 0.01) - 1));
  var area_req   = convA(r.area).toFixed(2);
  var area_prov  = convA(r.area_provided || r.area).toFixed(2);
  var overS      = (r.overSurf || 0).toFixed(1);
  var Au = aU(), T = tU(), Pu = pU();
  var velOk = r.tubeVel >= (r.targetVel || 1.5) * 0.9;
  var dpSOk = r.shellDP <= r.pdAllowShell;
  var dpTOk = r.tubeDp  <= r.pdAllowTube;
  var velCol = r.tubeVel < 0.5 ? '#c0201a' : r.tubeVel < (r.targetVel||1.5)*0.8 ? '#b35a00' : '#1b7a3e';
  var nB = Math.min(Math.max(nBaffles, 0), 7);
  var blines = '';
  for (var bi = 0; bi < nB; bi++) {
    var bx = Math.round(90 + 520 * (bi+1) / (nB+1));
    var ty = bi % 2 === 0 ? 115 : 90;
    var by = bi % 2 === 0 ? 220 : 195;
    blines += '<line x1="'+bx+'" y1="'+ty+'" x2="'+bx+'" y2="'+by+'" stroke="#888780" stroke-width="2.5" opacity=".6"/>';
  }
  return '<div class="sec-hd" style="margin-top:14px;color:var(--t1)">📐 Exchanger Block Diagram — Dimensions &amp; Flow</div>'
    +'<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:14px;overflow-x:auto">'
    +'<svg viewBox="0 0 780 345" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:780px;font-family:\'Space Grotesk\',system-ui,sans-serif">'
    +'<defs>'
    +'<marker id="sarr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>'
    +'<marker id="sdim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><line x1="5" y1="1" x2="5" y2="9" stroke="context-stroke" stroke-width="1.5"/></marker>'
    +'</defs>'
    // Shell
    +'<rect x="90" y="90" width="520" height="130" rx="6" fill="none" stroke="#3a4560" stroke-width="2"/>'
    +'<ellipse cx="90" cy="155" rx="14" ry="65" fill="#f5f7fb" stroke="#3a4560" stroke-width="2"/>'
    +'<ellipse cx="610" cy="155" rx="14" ry="65" fill="#f5f7fb" stroke="#3a4560" stroke-width="2"/>'
    // Tubes
    +'<line x1="90" y1="133" x2="610" y2="133" stroke="#0055c8" stroke-width="1.5" stroke-dasharray="4 3" opacity=".5"/>'
    +'<line x1="90" y1="155" x2="610" y2="155" stroke="#0055c8" stroke-width="2" stroke-dasharray="4 3" opacity=".7"/>'
    +'<line x1="90" y1="177" x2="610" y2="177" stroke="#0055c8" stroke-width="1.5" stroke-dasharray="4 3" opacity=".5"/>'
    +'<text x="350" y="148" text-anchor="middle" fill="#0055c8" font-size="9" font-weight="600">'+r.numTubes+' tubes ('+r.nTubesPerPass+'/pass \u00d7 '+r.nPasses+' passes) \u2014 OD='+OD_mm+'/ID='+Di_mm+' mm</text>'
    // Baffles
    +blines
    +'<text x="350" y="235" text-anchor="middle" fill="#5f5e5a" font-size="9">'+nBaffles+' baffles \u2014 spacing \u2248 '+bsp_mm+' mm \u2014 pitch='+pitch_mm+' mm</text>'
    // Hot IN nozzle
    +'<rect x="180" y="64" width="32" height="28" rx="3" fill="#fff3ee" stroke="#e8500a" stroke-width="1.5"/>'
    +'<text x="196" y="56" text-anchor="middle" fill="#e8500a" font-size="9" font-weight="700">HOT IN</text>'
    +'<text x="196" y="46" text-anchor="middle" fill="#e8500a" font-size="8">'+tDisp(r.hTi).toFixed(1)+' '+T+'</text>'
    +'<line x1="196" y1="64" x2="196" y2="90" stroke="#e8500a" stroke-width="1.5" marker-end=""+_uid+"_arr)"/>'
    // Hot OUT nozzle
    +'<rect x="430" y="218" width="32" height="28" rx="3" fill="#fff3ee" stroke="#c03d00" stroke-width="1.5"/>'
    +'<text x="446" y="261" text-anchor="middle" fill="#c03d00" font-size="9" font-weight="700">HOT OUT</text>'
    +'<text x="446" y="272" text-anchor="middle" fill="#c03d00" font-size="8">'+tDisp(r.hTo).toFixed(1)+' '+T+'</text>'
    +'<line x1="446" y1="246" x2="446" y2="220" stroke="#c03d00" stroke-width="1.5" marker-end=""+_uid+"_arr)"/>'
    // Cold IN nozzle
    +'<rect x="52" y="137" width="28" height="36" rx="3" fill="#eef4ff" stroke="#0055c8" stroke-width="1.5"/>'
    +'<text x="30" y="149" text-anchor="end" fill="#0055c8" font-size="9" font-weight="700">COLD IN</text>'
    +'<text x="30" y="161" text-anchor="end" fill="#0055c8" font-size="8">'+tDisp(r.cTi).toFixed(1)+' '+T+'</text>'
    +'<line x1="80" y1="155" x2="90" y2="155" stroke="#0055c8" stroke-width="2" marker-end=""+_uid+"_arr)"/>'
    // Cold OUT nozzle
    +'<rect x="620" y="137" width="28" height="36" rx="3" fill="#eef4ff" stroke="#008f76" stroke-width="1.5"/>'
    +'<text x="756" y="149" text-anchor="end" fill="#008f76" font-size="9" font-weight="700">COLD OUT</text>'
    +'<text x="756" y="161" text-anchor="end" fill="#008f76" font-size="8">'+tDisp(r.cTo).toFixed(1)+' '+T+'</text>'
    +'<line x1="620" y1="155" x2="610" y2="155" stroke="#008f76" stroke-width="2" marker-start=""+_uid+"_arr)"/>'
    // Tube length dimension line
    +'<line x1="90" y1="278" x2="610" y2="278" stroke="#444" stroke-width="1" marker-start=""+_uid+"_dim)" marker-end=""+_uid+"_dim)"/>'
    +'<line x1="90" y1="266" x2="90" y2="290" stroke="#444" stroke-width="0.8"/>'
    +'<line x1="610" y1="266" x2="610" y2="290" stroke="#444" stroke-width="0.8"/>'
    +'<text x="350" y="300" text-anchor="middle" fill="#0c1322" font-size="12" font-weight="700">L = '+L_m+' m  (tube length)</text>'
    // Shell ID dimension line
    +'<line x1="42" y1="90" x2="42" y2="220" stroke="#444" stroke-width="1" marker-start=""+_uid+"_dim)" marker-end=""+_uid+"_dim)"/>'
    +'<line x1="30" y1="90" x2="55" y2="90" stroke="#444" stroke-width="0.8"/>'
    +'<line x1="30" y1="220" x2="55" y2="220" stroke="#444" stroke-width="0.8"/>'
    +'<text x="24" y="162" text-anchor="middle" fill="#0c1322" font-size="10" font-weight="700" transform="rotate(-90,24,162)">ID = '+shellID_mm+' mm</text>'
    // Status badges
    +'<rect x="90" y="312" width="158" height="22" rx="4" fill="'+(velOk?'#e6f7f4':'#fff3ee')+'" stroke="'+(velOk?'#008f76':'#e8500a')+'" stroke-width="1"/>'
    +'<text x="169" y="327" text-anchor="middle" fill="'+velCol+'" font-size="9.5" font-weight="700">v = '+r.tubeVel.toFixed(3)+' m/s '+(velOk?'✓':'⚠')+' (target '+(r.targetVel||1.5)+' m/s)</text>'
    +'<rect x="258" y="312" width="148" height="22" rx="4" fill="'+(dpSOk?'#e6f7f4':'#fff3ee')+'" stroke="'+(dpSOk?'#008f76':'#e8500a')+'" stroke-width="1"/>'
    +'<text x="332" y="327" text-anchor="middle" fill="'+(dpSOk?'#1b7a3e':'#c0201a')+'" font-size="9.5" font-weight="700">Shell \u0394P '+convP(r.shellDP).toFixed(3)+' '+Pu+' '+(dpSOk?'✓':'✗')+'</text>'
    +'<rect x="416" y="312" width="148" height="22" rx="4" fill="'+(dpTOk?'#e6f7f4':'#fff3ee')+'" stroke="'+(dpTOk?'#008f76':'#e8500a')+'" stroke-width="1"/>'
    +'<text x="490" y="327" text-anchor="middle" fill="'+(dpTOk?'#1b7a3e':'#c0201a')+'" font-size="9.5" font-weight="700">Tube \u0394P '+convP(r.tubeDp).toFixed(3)+' '+Pu+' '+(dpTOk?'✓':'✗')+'</text>'
    +'<rect x="574" y="312" width="116" height="22" rx="4" fill="'+(parseFloat(overS)>=0?'#e6f7f4':'#fff3ee')+'" stroke="'+(parseFloat(overS)>=0?'#008f76':'#e8500a')+'" stroke-width="1"/>'
    +'<text x="632" y="327" text-anchor="middle" fill="'+(parseFloat(overS)>=0?'#1b7a3e':'#c0201a')+'" font-size="9.5" font-weight="700">Oversurface '+overS+'%</text>'
    // Area label
    +'<text x="350" y="20" text-anchor="middle" fill="#3a4560" font-size="10" font-weight="700">A req='+area_req+' '+Au+' | A prov='+area_prov+' '+Au+' | TEMA '+(r.tema||'C')+'</text>'
    +'</svg></div>';
}

function renderConvergence(r) {
  if (!r.convergence) return '';
  var cv = r.convergence;
  var rows = cv.history.map(function(h) {
    var col = h.deviation_pct < 1 ? 'var(--ok)' : h.deviation_pct < 5 ? 'var(--warn)' : 'var(--err)';
    return '<tr><td>'+h.iter+'</td><td style="font-family:var(--mono)">'+h.U_assumed.toFixed(1)+'</td><td style="font-family:var(--mono);font-weight:700">'+h.U_actual.toFixed(1)+'</td><td style="color:'+col+';font-weight:700">'+h.deviation_pct.toFixed(3)+'%</td></tr>';
  }).join('');
  var tpNote  = cv.twophase_lmtd ? 'Two-phase LMTD uses isothermal-side correction (F=1.0 — no cross-flow penalty).' : '';
  var tpSpan  = cv.twophase_lmtd ? '<span style="color:var(--blue);font-weight:700">🌡️ Two-phase LMTD (F=1.0)</span>' : '';
  var okCol   = cv.converged ? 'var(--ok)' : 'var(--warn)';
  return '<div class="note" style="margin-top:12px;background:var(--blue-lt);border-color:rgba(0,85,200,.18);border-left-color:var(--blue)">'
    +'<div class="note-title" style="color:var(--blue)">🔁 U Convergence — Temperature-Dependent Fluid Properties</div>'
    +'<div class="note-body"><div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:8px">'
    +'<span>Seed U: <strong>'+cv.U_seed+' W/m²K</strong></span>'
    +'<span>→ Converged U: <strong>'+cv.U_final+' W/m²K</strong></span>'
    +'<span>Iterations: <strong>'+cv.iterations+'</strong></span>'
    +'<span>Final deviation: <strong style="color:'+okCol+'">'+cv.deviation_pct+'%</strong></span>'
    +'<span style="font-weight:700;color:'+okCol+'">'+(cv.converged?'✓ Converged':'⚠ Not fully converged')+'</span>'
    +tpSpan+'</div>'
    +'<div style="overflow-x:auto"><table class="dtbl" style="font-size:.72rem">'
    +'<thead><tr><th>Iter</th><th>U Assumed (W/m²K)</th><th>U Actual (W/m²K)</th><th>Deviation %</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:.75rem;margin-top:6px;color:var(--t3)">Fluid properties re-evaluated at bulk mean temperatures each iteration. Viscosity correction (Sieder-Tate): (μ_bulk/μ_wall)^0.14. '+tpNote+'</div>'
    +'</div></div>';
}

function renderDesignAdvisor(r) {
  if (!r.designAdvisor) return '';
  var da = r.designAdvisor, lv = da.levers;
  function card(col, label, headline, detailHtml, noteHtml, badgeHtml, btn) {
    return '<div style="background:var(--surf);border:1px solid var(--bdr);border-radius:8px;padding:12px;border-top:3px solid '+col+';display:flex;flex-direction:column;gap:6px">'
      +'<div style="font-size:.70rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:'+col+'">'+label+'</div>'
      +'<div style="font-family:var(--mono);font-size:1.15rem;font-weight:700;color:var(--t1)">'+headline+'</div>'
      +detailHtml+noteHtml+badgeHtml+btn+'</div>';
  }
  var cards = '';
  if (lv.A_increase_length) {
    var a = lv.A_increase_length, vc = a.partial?'var(--warn)':'var(--ok)';
    cards += card('var(--red)','Lever A — Longer tube (TEMA standard)','L = '+a.L_required_m+' m',
      '<div style="font-size:.78rem;color:var(--t2)">'+a.numTubes+' tubes ('+a.nTubesPerPass+'/pass) &middot; vel=<strong style="color:'+vc+'">'+a.velocity+' m/s</strong> &middot; Shell ID&asymp;'+a.shellID_mm+' mm</div>',
      '<div style="font-size:.75rem;color:var(--t3)">'+a.note+'</div>',
      a.partial?'<div style="font-size:.70rem;color:var(--warn)">⚠ Max TEMA length — combine with B or D</div>':'<div style="font-size:.70rem;color:var(--warn)">⚠ Needs bay space</div>',
      '<button onclick="applyAdvisorLever(\'A\','+a.L_required_m+',null,null,null)" style="margin-top:auto;padding:6px 14px;border:none;border-radius:6px;background:var(--red);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer">↗ Apply — L = '+a.L_required_m+' m</button>');
  }
  if (lv.B_more_passes) {
    var b = lv.B_more_passes;
    cards += card('var(--blue)','Lever B — More tube passes',b.passes+' passes',
      '<div style="font-size:.78rem;color:var(--t2)">'+b.numTubes+' tubes ('+b.nTubesPerPass+'/pass) &middot; vel=<strong style="color:var(--ok)">'+b.velocity+' m/s</strong> &middot; Shell ID&asymp;'+b.shellID_mm+' mm</div>',
      '<div style="font-size:.75rem;color:var(--t3)">'+b.note+'</div>',
      '<div style="font-size:.70rem;color:var(--ok)">✓ Same tube length — no extra bay space</div>',
      '<button onclick="applyAdvisorLever(\'B\',null,'+b.passes+',null,'+b.numTubes+')" style="margin-top:auto;padding:6px 14px;border:none;border-radius:6px;background:var(--blue);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer">↗ Apply — '+b.passes+' passes</button>');
  }
  if (lv.C_more_shells) {
    var c = lv.C_more_shells;
    cards += card('var(--teal)','Lever C — Shells in series',c.shells+' \u00d7 shells',
      '<div style="font-size:.78rem;color:var(--t2)">'+c.tubesPerShell+' tubes/shell ('+c.nTubesPerPass+'/pass) &middot; vel=<strong style="color:var(--ok)">'+c.velocity+' m/s</strong> &middot; Shell ID&asymp;'+c.shellID_mm+' mm each</div>',
      '<div style="font-size:.75rem;color:var(--t3)">'+c.note+'</div>',
      '<div style="font-size:.70rem;color:var(--warn)">⚠ Higher capital cost</div>',
      '<button onclick="applyAdvisorLever(\'C\',null,null,'+c.shells+')" style="margin-top:auto;padding:6px 14px;border:none;border-radius:6px;background:var(--teal);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer">↗ Apply — '+c.shells+' shells</button>');
  }
  if (lv.D_smaller_OD) {
    var d = lv.D_smaller_OD;
    cards += card('#7c3aed','Lever D — Reduce tube OD (TEMA standard)','OD = '+d.OD_mm+' mm',
      '<div style="font-size:.78rem;color:var(--t2)">ID='+d.Di_mm+' mm &middot; '+d.numTubes+' tubes ('+d.nTubesPerPass+'/pass) &middot; vel=<strong style="color:var(--ok)">'+d.velocity+' m/s</strong> &middot; Shell ID&asymp;'+d.shellID_mm+' mm</div>',
      '<div style="font-size:.75rem;color:var(--t3)">'+d.note+'</div>',
      '<div style="font-size:.70rem;color:var(--ok)">✓ Same length · Confirm cleaning access</div>',
      '<button onclick="applyAdvisorLever(\'D\',null,null,null,'+d.numTubes+','+d.OD_mm+','+d.tw_mm+')" style="margin-top:auto;padding:6px 14px;border:none;border-radius:6px;background:#7c3aed;color:#fff;font-size:.78rem;font-weight:700;cursor:pointer">↗ Apply — OD '+d.OD_mm+' mm</button>');
  }
  if (lv.E_combined) {
    var e = lv.E_combined;
    cards += card('var(--gold)','Lever E — Combined: length + passes','L='+e.L_required_m+' m · '+e.passes+' passes',
      '<div style="font-size:.78rem;color:var(--t2)">'+e.numTubes+' tubes ('+e.nTubesPerPass+'/pass) &middot; vel=<strong style="color:var(--ok)">'+e.velocity+' m/s</strong> &middot; Shell ID&asymp;'+e.shellID_mm+' mm</div>',
      '<div style="font-size:.75rem;color:var(--t3)">'+e.note+'</div>',
      '<div style="font-size:.70rem;color:var(--warn)">⚠ Use when single lever is insufficient</div>',
      '<button onclick="applyAdvisorLever(\'E\','+e.L_required_m+','+e.passes+',null,'+e.numTubes+')" style="margin-top:auto;padding:6px 14px;border:none;border-radius:6px;background:var(--gold);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer">↗ Apply — L='+e.L_required_m+' m, '+e.passes+'p</button>');
  }
  var infeasibleBanner = (r.dual_objective_feasible === false)
    ? '<div style="margin-bottom:10px;padding:10px 12px;background:rgba(192,0,26,.07);border-radius:6px;border-left:3px solid var(--err);font-size:.83rem;line-height:1.5;font-weight:600">'
      +'🔴 Area vs velocity conflict at current geometry. Area requirement is a hard constraint — it cannot be relaxed. '
      +'The only resolution is to change tube length, pass count, tube OD, or shell count so that the required area can be achieved '
      +'with fewer tubes per pass. Select a lever below.'
      +'</div>'
    : '';
  return '<div class="note" style="margin-top:12px;background:linear-gradient(135deg,#f0f9f7,#eef4ff);border:1px solid rgba(0,85,200,.18);border-left:4px solid var(--blue);border-radius:10px;padding:14px 18px">'
    +'<div class="note-title" style="color:var(--blue);font-size:.95rem;margin-bottom:10px">🔧 Design Advisor — Fix Low Tube Velocity</div>'
    +'<div class="note-body">'
    +'<div style="margin-bottom:12px;padding:10px 12px;background:rgba(192,120,0,.08);border-radius:6px;border-left:3px solid var(--warn);font-size:.83rem;line-height:1.5">⚠ '+da.problem+'</div>'
    + infeasibleBanner
    +'<div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--t2);margin-bottom:10px">Choose a lever — all tube lengths are TEMA standard — click Apply to recalculate:</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px">'+cards+'</div>'
    +'</div></div>';
}

function renderTemaShell(r) {
  if (!r.temaShell) return '';
  var ts = r.temaShell;
  // Gas resize banner — shown above TEMA shell info when shell was auto-enlarged
  var gasResizeBanner = '';
  if (r.gasResizeNote && !r.gasResizeNote.infeasible) {
    gasResizeBanner = '<div style="margin-bottom:8px;padding:8px 12px;background:#eef4ff;border-radius:6px;border-left:3px solid var(--blue);font-size:.78rem;line-height:1.5">'
      +'<span style="font-weight:700;color:var(--blue)">ℹ Gas Service — Shell Auto-Resized</span><br>'
      +'Tube bundle requires <strong>'+r.gasResizeNote.original_mm+' mm</strong> shell, but at '+r.gasResizeNote.vel_original+' m/s crossflow velocity '
      +'this exceeds the 30 m/s gas erosion limit. Shell enlarged to '
      +'<strong style="color:var(--teal)">'+r.gasResizeNote.required_mm+' mm</strong> '
      +'('+r.gasResizeNote.vel_new+' m/s crossflow) and ΔP recomputed as <strong>'+r.gasResizeNote.dp_new+' bar</strong>.'
      +'</div>';
  } else if (r.gasResizeNote && r.gasResizeNote.infeasible) {
    gasResizeBanner = '<div style="margin-bottom:8px;padding:8px 12px;background:var(--red-lt);border-radius:6px;border-left:3px solid var(--err);font-size:.78rem;line-height:1.5">'
      +'<span style="font-weight:700;color:var(--err)">⚠ Gas Service — Shell Size Infeasible</span><br>'
      +'Required shell ID <strong>'+r.gasResizeNote.required_mm+' mm</strong> exceeds the largest TEMA standard (1524 mm). '
      +'Reduce gas flow rate, increase baffle spacing, or use multiple shells in parallel.'
      +'</div>';
  }
  return gasResizeBanner
    +'<div class="note" style="margin-top:10px;background:var(--surf2);border:1px solid var(--bdr);border-left:4px solid var(--teal);border-radius:10px;padding:10px 14px">'
    +'<div style="font-size:.78rem;font-weight:700;color:var(--teal);margin-bottom:4px">🏗 TEMA Shell Sizing (Table D-5)</div>'
    +'<div style="font-size:.78rem;color:var(--t2);display:flex;flex-wrap:wrap;gap:16px">'
    +'<span>Calculated min ID: <strong>'+ts.D_min_mm+' mm</strong></span>'
    +'<span>\u2192 TEMA standard: <strong style="color:var(--teal)">'+ts.D_std_mm+' mm</strong>'+(ts.isStandard?'':' <span style="color:var(--err)">⚠ exceeds standard table</span>')+'</span>'
    +(ts.prevSize_mm?'<span style="color:var(--t3)">Previous size: '+ts.prevSize_mm+' mm</span>':'')
    +'<span style="color:var(--t3)">Shell \u0394P method: <strong>'+(r.shellDP_method||'bell-delaware-Nc')+'</strong></span>'
    +(r.gasResizeNote && !r.gasResizeNote.infeasible
      ? '<span style="color:var(--blue)">Gas service shell: <strong>'+r.gasResizeNote.required_mm+' mm</strong></span>'
      : '')
    +'</div></div>';
}

function renderSpaceConstraints(r) {
  if (!r.spaceConstraints) return '';
  var sc = r.spaceConstraints;
  if (!sc.L_max_applied && !sc.shell_OD_max_mm) return '';
  return '<div class="note" style="margin-top:10px;background:var(--gold-lt);border:1px solid rgba(192,120,0,.25);border-left:4px solid var(--gold);border-radius:10px;padding:10px 14px">'
    +'<div style="font-size:.78rem;font-weight:700;color:var(--gold);margin-bottom:4px">📐 Space Constraints Active</div>'
    +'<div style="font-size:.78rem;color:var(--t2);display:flex;flex-wrap:wrap;gap:16px">'
    +(sc.L_max_applied?'<span>Max tube length: <strong>'+sc.L_max_applied+' m</strong>'+(sc.L_constrained?' <span style="color:var(--warn)">⚠ length-limited</span>':' ✓')+'</span>':'')
    +(sc.shell_OD_max_mm?'<span>Max shell OD: <strong>'+sc.shell_OD_max_mm+' mm</strong></span>':'')
    +'</div></div>';
}

function renderGeoOptimizer(r) {
  if (!r.velocity_driven_by_area || r.tubeVel >= (r.targetVel||1.5)*0.85) return '';
  return '<div class="note" style="margin-top:12px;background:linear-gradient(135deg,#eef4ff,#f0e8ff);border-color:rgba(124,58,237,.2);border-left-color:#7c3aed">'
    +'<div class="note-title" style="color:#7c3aed">📐 Space-Constrained Geometry Optimizer</div>'
    +'<div class="note-body"><p style="margin-bottom:8px">Tube length is <strong>'+r.L.toFixed(1)+' m</strong> but velocity target <strong>'+r.targetVel+' m/s</strong> cannot be met. The optimizer searches all TEMA OD × pass × shell combinations.</p>'
    +'<button onclick="runGeoOptimizer('+r.area.toFixed(4)+','+(r.cF/3600).toFixed(4)+','+r.L.toFixed(2)+','+r.cFluid.rho.toFixed(1)+','+(r.targetVel||1.5)+')" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-family:var(--sans);font-size:.85rem;font-weight:700;cursor:pointer;box-shadow:0 3px 12px rgba(124,58,237,.3)">🔍 Find Space-Constrained Solutions</button>'
    +'<div id="geo-optimizer-results" style="margin-top:10px"></div>'
    +'</div></div>';
}

function renderSTResults(r, warns=[]) {
  const Q=convQ(r.Q),qH=convQ(r.Qh),qC=convQ(r.Qc);
  const A=convA(r.area),U=convU(r.U);
  const sDP=convP(r.shellDP),tDP=convP(r.tubeDp);
  const T=tU(),H=hU(),Au=aU(),Pu=pU(),Uu=uU();
  const warnHtml=warns.length?`<div class="note warn"><div class="note-title">⚠ Design Warnings</div><div class="note-body"><ul>${warns.map(w=>`<li>${w}</li>`).join('')}</ul></div></div>`:'';
  const sumText=`Q=${Q.toFixed(1)}${H}, Area=${A.toFixed(1)}${Au}, U=${U.toFixed(0)}${Uu}, Eff=${(r.eff*100).toFixed(1)}%`;
  const modeLabel = r.shellMode==='condensing' ? '🌡️ Condensing (Nusselt film)' : r.shellMode==='evaporating' ? '♨️ Evaporating (Chen)' : '💧 Single Phase';
  const modeBadge = r.shellMode && r.shellMode!=='single-phase'
    ? `<span style="font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--gold-lt);color:var(--gold);border:1px solid rgba(192,120,0,.3);margin-left:6px">${modeLabel}</span>` : '';
  return `
  <div class="res-hd">
    <div class="res-hd-left">
      <h3>Shell &amp; Tube — Design Results${modeBadge}</h3>
      <div class="res-meta">TEMA Class ${r.tema} | ${unitSys==='metric'?'SI':'Imperial'} | ${r.nPasses} pass(es) / ${r.nShells} shell(s) | ${r.pitchLayout||'triangular'} pitch</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
      <span class="badge badge-${r.st}">${r.stTxt}</span>
      <button class="share-result-btn" onclick="shareResult('st','${sumText.replace(/'/g,"\\'")}')">🔗 Share</button>
    </div>
  </div>
  <div class="kpi-grid">
    <div class="kpi red"><div class="kpi-label">Heat Duty</div><div class="kpi-val">${Q.toFixed(1)}<span class="kpi-unit">${H}</span></div></div>
    <div class="kpi blue"><div class="kpi-label">LMTD × F</div><div class="kpi-val">${r.FLMTD.toFixed(2)}<span class="kpi-unit">${T}</span></div></div>
    <div class="kpi teal"><div class="kpi-label">Transfer Area</div><div class="kpi-val">${A.toFixed(2)}<span class="kpi-unit">${Au}</span></div></div>
    <div class="kpi gold"><div class="kpi-label">Overall U</div><div class="kpi-val">${U.toFixed(0)}<span class="kpi-unit">${Uu}</span></div></div>
    <div class="kpi ${r.eff>0.7?'ok':'warn'}"><div class="kpi-label">Effectiveness</div><div class="kpi-val">${(r.eff*100).toFixed(1)}<span class="kpi-unit">%</span></div></div>
    <div class="kpi blue"><div class="kpi-label">NTU</div><div class="kpi-val">${r.NTU.toFixed(3)}</div></div>
    <div class="kpi"><div class="kpi-label">No. of Tubes</div><div class="kpi-val">${r.numTubes}<span class="kpi-unit"> (${r.nTubesPerPass||'?'}/pass)</span></div></div>
    <div class="kpi"><div class="kpi-label">Shell ID (est.)</div><div class="kpi-val">${(r.shellID*1000).toFixed(0)}<span class="kpi-unit">mm</span></div></div>
    <div class="kpi ${(r.overSurf||0)<0?'warn':'ok'}">
      <div class="kpi-label">Tube Length</div>
      <div class="kpi-val">${r.L.toFixed(1)}<span class="kpi-unit">m</span></div>
      <div style="font-size:.65rem;color:var(--t3);margin-top:1px">${r.velMode==='target'?`auto: ${r.numTubes} tubes @ ${r.tubeVel.toFixed(2)} m/s`:'manual mode'}</div>
    </div>
    <div class="kpi ${r.overSurf>20?'ok':r.overSurf<-5?'warn':''}">
      <div class="kpi-label">Oversurface</div>
      <div class="kpi-val">${r.overSurf!=null?r.overSurf.toFixed(1):'+0.0'}<span class="kpi-unit">%</span></div>
    </div>
  </div>

  <div class="sec-hd blue">📋 Heat Balance Summary</div>
  <div class="tbl-wrap">
  <table class="dtbl">
    <thead><tr><th>Parameter</th><th>Shell Side (Hot)</th><th>Tube Side (Cold)</th></tr></thead>
    <tbody>
      <tr><td class="lbl-col">Fluid</td>
        <td>${r.hFluid.name}${r.hFluidDB && r.hFluidDB.rho < GAS_RHO_THRESHOLD
          ? `<br><span style="font-size:.7rem;color:var(--blue)">⚗ ρ=${r.hFluid.rho.toFixed(4)} kg/m³ @ ${r.hTmean?r.hTmean.toFixed(0):'—'}°C, ${r.hPop?r.hPop.toFixed(2):'—'} bar | Z=${r.hFluid.Z?r.hFluid.Z.toFixed(4):'1.0000'} (${r.hFluid.zMethod||'ideal'})</span>` : ''}</td>
        <td>${r.cFluid.name}${r.cFluidDB && r.cFluidDB.rho < GAS_RHO_THRESHOLD
          ? `<br><span style="font-size:.7rem;color:var(--blue)">⚗ ρ=${r.cFluid.rho.toFixed(4)} kg/m³ @ ${r.cTmean?r.cTmean.toFixed(0):'—'}°C, ${r.cPop?r.cPop.toFixed(2):'—'} bar | Z=${r.cFluid.Z?r.cFluid.Z.toFixed(4):'1.0000'} (${r.cFluid.zMethod||'ideal'})</span>` : ''}</td>
      </tr>
      <tr><td class="lbl-col">Inlet Temp</td><td>${tDisp(r.hTi).toFixed(1)} ${T}</td><td>${tDisp(r.cTi).toFixed(1)} ${T}</td></tr>
      <tr><td class="lbl-col">Outlet Temp</td>
        <td>${tDisp(r.hTo).toFixed(1)} ${T}</td>
        <td>
          ${tDisp(r.cTo).toFixed(1)} ${T}
        </td>
      </tr>
      <tr><td class="lbl-col">Heat Duty</td>
        <td>${qH.toFixed(2)} ${H}</td>
        <td>${qC.toFixed(2)} ${H}

        </td>
      </tr>
      <tr><td class="lbl-col">Calc. ΔP</td>
        <td style="color:${r.shellDP>r.pdAllowShell?'var(--err)':'var(--ok)'};font-weight:700">
          ${sDP.toFixed(3)} ${Pu} ${r.shellDP>r.pdAllowShell?'✗ EXCEEDS':'✓ OK'}
          ${r.gasResizeNote && !r.gasResizeNote.infeasible
            ? `<br><span style="font-size:.68rem;color:var(--blue);font-weight:600">ℹ gas shell ${r.gasResizeNote.required_mm} mm (bundle ${r.gasResizeNote.original_mm} mm) — auto-sized for ≤30 m/s</span>`
            : r.gasResizeNote && r.gasResizeNote.infeasible
              ? `<br><span style="font-size:.68rem;color:var(--err);font-weight:600">⚠ Gas shell infeasible — needs ${r.gasResizeNote.required_mm} mm (max TEMA 1524 mm)</span>`
              : ''}
        </td>
        <td style="color:${r.tubeDp>r.pdAllowTube?'var(--err)':'var(--ok)'};font-weight:700">
          ${tDP.toFixed(3)} ${Pu} ${r.tubeDp>r.pdAllowTube?'✗ EXCEEDS':'✓ OK'}
        </td>
      </tr>
      <tr><td class="lbl-col">Allowable ΔP</td>
        <td>${convP(r.pdAllowShell).toFixed(3)} ${Pu}</td>
        <td>${convP(r.pdAllowTube).toFixed(3)} ${Pu}</td>
      </tr>
      <tr><td class="lbl-col">Fluid Velocity</td>
        <td>${r.shellVel ? r.shellVel.toFixed(3)+' m/s' : '—'} <span style="font-size:.7rem;color:var(--t3)">(shell cross-flow)</span></td>
        <td>
          <span style="font-weight:700;color:${r.tubeVel<0.5?'var(--err)':r.tubeVel<(r.targetVel||1.5)*0.9?'var(--warn)':r.tubeVel>4?'var(--err)':'var(--ok)'}">
            ${r.tubeVel.toFixed(3)} m/s
          </span>
          <span style="font-size:.7rem;color:var(--t3)"> in-tube</span>
          ${r.targetVel ? `<br><span style="font-size:.7rem;color:${r.tubeVel>=(r.targetVel*0.9)?'var(--teal)':'var(--warn)'}">
            🎯 target: ${r.targetVel} m/s
            ${r.tubeVel >= r.targetVel * 0.9 ? ' ✓ achieved' : ' — below target'}
          </span>` : ''}
          ${r.dual_objective_feasible === false ? `
          <br><span style="font-size:.72rem;font-weight:700;color:var(--err)">
            ⚠ Area vs velocity conflict — at L=${r.L.toFixed(1)} m, OD=${(r.OD*1000).toFixed(1)} mm, ${r.nPasses} passes,
            satisfying the required ${convA(r.area).toFixed(2)} ${aU()} forces ${r.numTubes} tubes,
            giving only ${r.tubeVel.toFixed(3)} m/s.
            <strong>Area requirement overrides velocity target.</strong>
            Use Design Advisor to resolve.
          </span>` : ''}
          ${(r.designAdvisor && r.tubeVel < (r.targetVel||1.5)*0.9) ? `<br><span style="font-size:.7rem;color:var(--blue)">💡 See Design Advisor below for specific fixes</span>` : ''}
        </td>
      </tr>
      <tr><td class="lbl-col">Shell Re / h</td>
        <td>${r.shellRe ? r.shellRe.toFixed(0) : '—'} / ${r.bdCorr ? r.bdCorr.hShell.toFixed(0)+' W/m²K' : '—'}</td>
        <td>Re: ${r.cFluid && r.Di ? (r.cFluid.rho * r.tubeVel * r.Di / (r.cFluid.mu*1e-3)).toFixed(0) : '—'} / h: ${r.bdCorr ? r.bdCorr.hTube.toFixed(0)+' W/m²K' : '—'}
          ${r.cFluid && r.cFluid._isGas ? `<br><span style="font-size:.7rem;color:var(--blue)">⚗ gas props at ${r.cTmean?r.cTmean.toFixed(0):'—'}°C, ${r.cPop?r.cPop.toFixed(2):'—'} bar, Z=${r.cFluid.Z?r.cFluid.Z.toFixed(4):'1.0'}</span>` : ''}
          ${r.shellMode==='condensing'?`<br><span style="font-size:.7rem;color:var(--gold)">🌡️ Nusselt film condensation — h=${r.bdCorr?r.bdCorr.hTube.toFixed(0):'—'} W/m²K</span>`:''}
          ${r.shellMode==='evaporating'?`<br><span style="font-size:.7rem;color:var(--gold)">♨️ Chen correlation (flow boiling) — h=${r.bdCorr?r.bdCorr.hTube.toFixed(0):'—'} W/m²K</span>`:''}
        </td>
      </tr>
      <tr><td class="lbl-col">Tube Length / Count</td>
        <td colspan="2">
          <strong>${r.L.toFixed(1)} m</strong> × <strong>${r.numTubes} tubes</strong>
          (${r.nTubesPerPass} per pass × ${r.nPasses} passes)
          ${r.dual_objective_feasible === false
            ? ` — <span style="color:var(--err)">⚠ <strong>area constraint</strong> forces ${r.numTubes} tubes — velocity target unachievable at this geometry</span>`
            : r.velocity_driven_by_area
              ? ` — <span style="color:var(--teal)">✓ tube count auto-reduced from ${r.numTubes_velocity||'?'} to ${r.numTubes} satisfying both area and velocity</span>`
              : r.velMode==='target'
                ? ` — <span style="color:var(--teal)">🎯 auto-set for ${r.targetVel} m/s target</span>`
                : ' — manual mode'}
        </td>
      </tr>
      <tr><td class="lbl-col">Area: Req / Provided</td>
        <td colspan="2">
          ${convA(r.area).toFixed(2)} ${aU()} required &nbsp;|&nbsp;
          ${convA(r.area_provided||r.area).toFixed(2)} ${aU()} provided &nbsp;|&nbsp;
          <strong style="color:${(r.overSurf||0)>0?'var(--ok)':'var(--err)'}">${(r.overSurf||0).toFixed(1)}% oversurface</strong>
        </td>
      </tr>
      <tr><td class="lbl-col">LMTD / F / F×LMTD</td><td colspan="2">${r.lmtd.toFixed(2)} ${T} × ${r.F.toFixed(3)} <span style="font-size:.7rem;color:var(--t3)">(${r.lmtdArr==='counter'?'F=1 — true countercurrent':r.lmtdArr==='parallel'?'F=1 — parallel':r.lmtdArr==='shell12'?'BMN exact 1-2 shell':r.lmtdArr==='shell24'?'BMN exact 2-4 shell':r.lmtdArr==='cross1'?'crossflow corr.':'—'})</span> = <strong>${r.FLMTD.toFixed(2)} ${T}</strong></td></tr>
      <tr><td class="lbl-col">ΔT₁ / ΔT₂</td>
        <td colspan="2">${r.dT1.toFixed(2)} / ${r.dT2.toFixed(2)} ${T}

        </td>
      </tr>
    </tbody>
  </table>
  </div>

  ${r.bdCorr ? `
  <div class="sec-hd teal" style="margin-top:14px">🔬 Bell-Delaware Correction Factors</div>
  <div class="tbl-wrap"><table class="dtbl">
    <thead><tr><th>Factor</th><th>Symbol</th><th>Value</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td class="lbl-col">Baffle Cut</td><td>Jc</td><td style="font-weight:700">${r.bdCorr.Jc.toFixed(3)}</td><td>Baffle cut geometry correction</td></tr>
      <tr><td class="lbl-col">Leakage</td><td>Jl</td><td style="font-weight:700">${r.bdCorr.Jl.toFixed(3)}</td><td>Shell-tube &amp; baffle-shell leakage</td></tr>
      <tr><td class="lbl-col">Bypass</td><td>Jb</td><td style="font-weight:700">${r.bdCorr.Jb.toFixed(3)}</td><td>Bundle bypass correction</td></tr>
      <tr><td class="lbl-col">Adverse Re</td><td>Jr</td><td style="font-weight:700">${r.bdCorr.Jr.toFixed(3)}</td><td>Adverse temperature gradient (laminar)</td></tr>
      <tr><td class="lbl-col">Unequal Spacing</td><td>Js</td><td style="font-weight:700">${r.bdCorr.Js!=null?r.bdCorr.Js.toFixed(3):'1.000'}</td><td>Inlet/outlet vs central baffle spacing correction</td></tr>
      <tr style="background:var(--blue-lt)"><td class="lbl-col"><strong>Combined J</strong></td><td><strong>J_total</strong></td><td style="font-weight:700;color:var(--blue)">${r.bdCorr.Jtotal.toFixed(3)}</td><td>J<sub>c</sub>·J<sub>l</sub>·J<sub>b</sub>·J<sub>r</sub>·J<sub>s</sub> — overall Bell-Delaware correction</td></tr>
      <tr><td class="lbl-col">Colburn j-factor</td><td>jh</td><td style="font-weight:700">${r.bdCorr.jh.toFixed(4)}</td><td>Ideal bundle heat transfer factor</td></tr>
      <tr><td class="lbl-col">No. Baffles</td><td>Nb</td><td style="font-weight:700">${r.bdCorr.nBaffles}</td><td>Number of baffle spaces</td></tr>
    </tbody>
  </table></div>` : ''}

  <div class="balance-strip">
    <div class="balance-item">Heat Balance
      <span style="color:${r.balErr<2?'var(--ok)':r.balErr<5?'var(--warn)':'var(--err)'}">
        ${r.balErr.toFixed(2)}% ${r.balErr<2?'✓':'⚠'}
      </span>
    </div>
    <div class="balance-item">Tube Geometry<span>ID=${(r.Di*1000).toFixed(1)} / OD=${(r.OD*1000).toFixed(1)} mm</span></div>
  </div>

    ${warnHtml}

  ${renderBlockDiagram(r)}

  ${renderConvergence(r)}

  ${renderDesignAdvisor(r)}

  ${renderTemaShell(r)}

  ${renderSpaceConstraints(r)}

  <div class="note" style="margin-top:12px">
    <div class="note-title">📋 TEMA Design Checklist</div>
    <div class="note-body"><ul>
      <li>Verify fouling factors per TEMA Table RGP-T-2.4 for actual service</li>
      <li>Target tube velocity: 1–3 m/s (liquid) or 10–30 m/s (gas/steam). <strong>Gas density is corrected for actual T &amp; P using ideal gas law.</strong></li>
      <li>Shell-side ΔP ≤ 0.7 bar; Tube-side ΔP ≤ 1.0 bar (typical limits). <strong>ΔP now uses full Bell-Delaware 4-term method.</strong></li>
      <li>Minimum LMTD 5–10°C for economic design</li>
      <li>Corrosion allowance 1.5–3 mm per ASME Section VIII / TEMA Class ${r.tema}</li>
    </ul></div>
  </div>

  ${renderGeoOptimizer(r)}
  `;
}


/* ══════════════════════════════════════════════════════════════════════════
   PLATE HX CALCULATION — Full heat balance, T/P/Z corrections, Gnielinski
   ══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════
   ENHANCED PDF GENERATOR — Dense, Professional Datasheet
   Covers: Shell & Tube | Plate | Air Cooled | Fin-Fan | Double Pipe | LMTD
   ═══════════════════════════════════════════════════════════════════════════ */
function genPDF() {
  const now=new Date().toLocaleString();
  const T=tU(),H=hU(),Au=aU(),Pu=pU(),Uu=uU();
  const st=lastResults.st, pl=lastResults.pl, ac=lastResults.ac, dp=lastResults.dp, lm=lastResults.lm, ff=lastResults.ff;

  const hasAny = st||pl||ac||dp||lm||ff;

  // ── Helper: status color
  const sc = (ok) => ok ? '#1b7a3e' : '#c0201a';
  const scsm = (v,lo,hi) => v>=lo&&v<=hi?'#1b7a3e':'#b35a00';

  // ── Thermal resistance pie (SVG) builder
  function thermalPieSVG(segments) {
    // Larger pie, bigger legend text — readable in print
    let cx=85,cy=85,r=72;
    let startAngle=-Math.PI/2;
    const paths=segments.map(s=>{
      const angle=(s.pct/100)*2*Math.PI;
      const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
      startAngle+=angle;
      const x2=cx+r*Math.cos(startAngle), y2=cy+r*Math.sin(startAngle);
      const large=angle>Math.PI?1:0;
      return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
    }).join('');
    const legend=segments.map((s,i)=>{
      const ly=i*20+14;
      return `<rect x="178" y="${ly}" width="13" height="13" fill="${s.color}" rx="2"/>
              <text x="196" y="${ly+10}" font-size="11" font-weight="600" fill="#0c1322" font-family="sans-serif">${s.label}</text>
              <text x="196" y="${ly+22}" font-size="10" fill="#444" font-family="sans-serif">${s.pct.toFixed(1)}%</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="420" height="180">
      ${paths}${legend}
    </svg>`;
  }

  const html=`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Heat Exchanger Design Calculator — Shell & Tube, TEMA | multicalci.com</title>
<meta name="description" content="Free shell and tube heat exchanger design using Bell-Delaware method. Calculate LMTD, NTU and pressure drop.">
<link rel="canonical" href="https://multicalci.com/heat-exchanger-design/">
<meta property="og:title" content="Heat Exchanger Design Calculator — Shell & Tube, TEMA | multicalci.com">
<meta property="og:description" content="Free shell and tube heat exchanger design using Bell-Delaware method. Calculate LMTD, NTU and pressure drop.">
<meta property="og:url" content="https://multicalci.com/heat-exchanger-design/">
<meta property="og:type" content="website">
    <meta property="og:image" content="https://multicalci.com/assets/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="HeatXpert Pro — Heat Exchanger Design">
    <meta name="twitter:image" content="https://multicalci.com/assets/og-image.png">


<meta name="robots" content="index, follow">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:10mm 10mm 14mm 10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Sans',sans-serif;font-size:9pt;color:#0c1322;background:#fff;line-height:1.4}
h1{font-size:0}

/* ── Header ── */
.rpt-hdr{border-bottom:3px solid #e8500a;padding-bottom:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-end}
.brand{font-size:15pt;font-weight:800;color:#e8500a;letter-spacing:-0.5px;line-height:1}
.brand-sub{font-size:7pt;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin-top:2px}
.meta{text-align:right;font-size:7.5pt;color:#444;line-height:1.7}
.meta b{color:#0c1322}
.doc-no{background:#0c1322;color:#fff;font-size:7pt;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:.5px}

/* ── Section headers ── */
.sec{font-size:7.5pt;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;
     color:#e8500a;border-bottom:1.5px solid #f0cfc0;padding-bottom:3px;margin:10px 0 6px;
     display:flex;align-items:center;gap:6px}
.sec.blue{color:#0055c8;border-bottom-color:#c0d4f8}
.sec.teal{color:#008f76;border-bottom-color:#a0ded5}
.sec.gold{color:#b36000;border-bottom-color:#e8cc80}
.sec.purple{color:#6b21d4;border-bottom-color:#dab8fa}

/* ── Tables ── */
table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:8.2pt}
th{background:#0c1322;color:#fff;padding:5px 7px;font-weight:700;text-align:left;
   font-size:7.2pt;text-transform:uppercase;letter-spacing:.5px}
th.r{text-align:right}
td{padding:3.5px 7px;border-bottom:0.5px solid #e2e6f0;font-family:'IBM Plex Mono',monospace;
   font-size:7.5pt;font-weight:500;vertical-align:middle}
td.lbl{font-family:'IBM Plex Sans',sans-serif;font-weight:700;color:#2d3a4a;font-size:7.5pt;white-space:nowrap}
td.val{color:#0c1322;font-weight:700;text-align:right}
td.u{color:#008f76;font-size:7pt;text-align:right;white-space:nowrap}
tr:nth-child(even) td{background:#fafbfd}
tr:hover td{background:#eef4ff}

/* ── 2-col table layout ── */
.t2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
.t3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px}

/* ── KPI strip ── */
.kpi-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:8px}
.kpi{padding:6px 7px;background:#f4f6fb;border-radius:4px;border-top:2.5px solid #cbd5e0;page-break-inside:avoid}
.kpi.r{border-top-color:#e8500a}.kpi.b{border-top-color:#0055c8}
.kpi.t{border-top-color:#008f76}.kpi.g{border-top-color:#b36000}
.kpi.ok{border-top-color:#1b7a3e}.kpi.warn{border-top-color:#b35a00}
.kl{font-size:5.8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7899;margin-bottom:2px}
.kv{font-size:11pt;font-weight:800;color:#0c1322;font-family:'IBM Plex Mono',monospace;line-height:1.1}
.ku{font-size:6.5pt;color:#008f76}

/* ── Status badge ── */
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:7pt;font-weight:700;
       letter-spacing:.3px;text-transform:uppercase}
.badge.ok{background:rgba(27,122,62,.1);color:#1b7a3e;border:1px solid rgba(27,122,62,.2)}
.badge.warn{background:rgba(179,90,0,.1);color:#b35a00;border:1px solid rgba(179,90,0,.2)}
.badge.err{background:rgba(192,32,26,.1);color:#c0201a;border:1px solid rgba(192,32,26,.2)}

/* ── Highlight cells ── */
.hi-ok{color:#1b7a3e;font-weight:700} .hi-err{color:#c0201a;font-weight:700}
.hi-warn{color:#b35a00;font-weight:700}

/* ── Divider strip ── */
.div-strip{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0;
           background:linear-gradient(135deg,#f0f9f7,#eef4ff);
           padding:7px 10px;border-radius:5px;border:0.5px solid #d5e0f0}
.div-item{font-size:7pt;color:#2d3a4a;font-weight:600}
.div-item span{font-family:'IBM Plex Mono',monospace;color:#0c1322;font-weight:700;margin-left:3px}
.div-sep{color:#bbb;font-size:8pt;align-self:center}

/* ── Note box ── */
.note-pdf{background:#f0f9f7;border-left:2.5px solid #008f76;padding:6px 8px;
          border-radius:3px;font-size:7pt;color:#2d3a4a;margin-top:6px;line-height:1.6}
.note-pdf.warn{background:#fff8ee;border-left-color:#b36000}
.no-res{background:#fff8ee;border:0.5px solid #f0d090;padding:6px 8px;border-radius:3px;
        color:#8a5a00;font-size:8pt;font-weight:600}

/* ── Page break ── */
.pg{page-break-before:always;padding-top:4px}
.no-break{page-break-inside:avoid}

/* ── Footer ── */
.ftr{position:fixed;bottom:0;left:10mm;right:10mm;border-top:0.5px solid #dde2ef;
     padding-top:4px;display:flex;justify-content:space-between;font-size:6.5pt;color:#999;font-weight:600}

/* ── Page-top centered watermark ── */
.page-brand{
  text-align:center;padding:5px 0 7px;border-bottom:2px solid #e8500a;
  margin-bottom:10px;
}
.page-brand-main{
  font-size:16pt;font-weight:900;letter-spacing:-0.5px;
  background:linear-gradient(135deg,#e8500a,#0055c8);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
}
.page-brand-sub{font-size:7.5pt;color:#555;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:1px}
.page-brand-tagline{font-size:6.5pt;color:#888;margin-top:1px}

/* ── Running header on every page via CSS ── */
@page {
  size:A4;
  margin:18mm 10mm 14mm 10mm;
  @top-center {
    content:"multicalci.com — HeatXpert Pro Professional Heat Exchanger Datasheet";
    font-size:7pt;color:#aaa;font-family:'IBM Plex Sans',sans-serif;
  }
}
</style><\/head>
<body>

<!-- ══ PROMINENT PAGE 1 BRAND HEADER — multicalci.com centered at top ══ -->
<div class="page-brand">
  <div class="page-brand-main">multicalci.com</div>
  <div class="page-brand-sub">HeatXpert Pro — Professional Heat Exchanger Design &amp; Analysis</div>
  <div class="page-brand-tagline">Free Engineering Calculators for Process Engineers · Shell &amp; Tube · Plate · Air Cooled · Fin-Fan · Double Pipe</div>
</div>

<div class="rpt-hdr">
  <div>
    <div class="brand">🔥 HeatXpert Pro</div>
    <div class="brand-sub">Engineering Calculation Datasheet</div>
    <div style="margin-top:4px;font-size:8pt;font-weight:700;color:#0055c8">multicalci.com/heat-exchanger-design/</div>
  </div>
  <div class="meta">
    <span class="doc-no">REV A — PRELIMINARY</span><br>
    <b>Date:</b> ${now}<br>
    <b>Units:</b> ${unitSys==='metric'?'Metric — SI':'Imperial — US Customary'}<br>
    <b>Standard:</b> TEMA / ASME VIII / API 661<br>
    <b>Status:</b> ${hasAny?'Calculated':'No Results'}
  </div>
</div>

${!hasAny?`<div class="no-res">⚠ No calculations found. Please run at least one calculation (Shell &amp; Tube, Plate HX, Air Cooled, Fin-Fan, Double Pipe, or LMTD/NTU) before generating the report.</div>`:''}


${st?`
<div class="sec">⚙ Shell &amp; Tube Heat Exchanger — Calculation Results
  ${st.convergence?`<span style="font-size:6pt;font-weight:600;margin-left:8px;padding:1px 6px;border-radius:8px;background:${st.convergence.converged?'rgba(27,122,62,.12)':'rgba(192,32,26,.1)'};color:${st.convergence.converged?'#1b7a3e':'#c0201a'}">U ${st.convergence.converged?'✓ Converged':'⚠ Not converged'} · ${st.convergence.iterations} iter · ${st.convergence.deviation_pct}% dev</span>`:''}
  ${st.convergence?.twophase_lmtd?`<span style="font-size:6pt;font-weight:600;margin-left:4px;padding:1px 6px;border-radius:8px;background:rgba(0,85,200,.1);color:#0055c8">Two-phase LMTD · F=1.0</span>`:''}
</div>
<div class="kpi-strip">
  <div class="kpi r"><div class="kl">Heat Duty</div><div class="kv">${convQ(st.Q).toFixed(1)}<span class="ku"> ${H}</span></div></div>
  <div class="kpi b"><div class="kl">LMTD×F</div><div class="kv">${st.FLMTD.toFixed(2)}<span class="ku"> ${T}</span></div></div>
  <div class="kpi t"><div class="kl">Req. Area</div><div class="kv">${convA(st.area).toFixed(2)}<span class="ku"> ${Au}</span></div></div>
  <div class="kpi g"><div class="kl">U Overall</div><div class="kv">${convU(st.U).toFixed(0)}<span class="ku"> ${Uu}</span></div></div>
  <div class="kpi ${st.eff>0.65?'ok':'warn'}"><div class="kl">Effectiveness ε</div><div class="kv">${(st.eff*100).toFixed(1)}<span class="ku"> %</span></div></div>
  <div class="kpi ${st.NTU?'b':''}"><div class="kl">NTU</div><div class="kv">${st.NTU!=null?st.NTU.toFixed(3):'—'}</div></div>
</div>

<div class="panel-pair">
<div>
<div class="mini-sec red">🔴 Hot Side (Shell)</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th class="r">Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid</td><td>—</td><td>${st.hFluid.name}</td></tr>
    <tr><td class="lbl">T Inlet / Outlet</td><td>${T}</td><td>${tDisp(st.hTi).toFixed(2)} / ${tDisp(st.hTo).toFixed(2)}</td></tr>
    <tr><td class="lbl">ΔT (Hot)</td><td>${T}</td><td>${(st.hTi-st.hTo).toFixed(2)}</td></tr>
    <tr><td class="lbl">Flow Rate</td><td>kg/h</td><td>${st.hFluidDB?.name?st.hFluidDB.name:'—'}</td></tr>
    <tr><td class="lbl">Heat Duty Qh</td><td>${H}</td><td>${convQ(st.Qh).toFixed(3)}</td></tr>
    <tr><td class="lbl">Film HTC h_shell</td><td>W/m²K</td><td>${st.bdCorr?.hShell!=null?st.bdCorr.hShell.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Velocity (cross-flow)</td><td>m/s</td><td>${st.shellVel!=null?st.shellVel.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Pressure Drop (calc)</td><td>${Pu}</td>
      <td class="${(st.shellDP||0)>(st.pdAllowShell||0.7)?'hi-err':'hi-ok'}">${convP(st.shellDP||0).toFixed(4)} ${(st.shellDP||0)>(st.pdAllowShell||0.7)?'✗ EXCEEDS':'✓ OK'}</td></tr>
    <tr><td class="lbl">Allowable ΔP</td><td>${Pu}</td><td>${convP(st.pdAllowShell||0.7).toFixed(3)}</td></tr>
    <tr><td class="lbl">Fouling R (shell)</td><td>m²K/W</td><td>${st.Rfo!=null?st.Rfo.toExponential(2):st.foulFactor!=null?(st.foulFactor/2).toExponential(2):'—'}</td></tr>
  </tbody>
</table>
</div>
<div>
<div class="mini-sec teal">🔵 Cold Side (Tube)</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th class="r">Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid</td><td>—</td><td>${st.cFluid.name}</td></tr>
    <tr><td class="lbl">T Inlet / Outlet</td><td>${T}</td><td>${tDisp(st.cTi).toFixed(2)} / ${tDisp(st.cTo).toFixed(2)}</td></tr>
    <tr><td class="lbl">ΔT (Cold)</td><td>${T}</td><td>${(st.cTo-st.cTi).toFixed(2)}</td></tr>
    <tr><td class="lbl">Flow Rate</td><td>kg/h</td><td>${st.cFluidDB?.name?st.cFluidDB.name:'—'}</td></tr>
    <tr><td class="lbl">Heat Duty Qc</td><td>${H}</td><td>${convQ(st.Qc).toFixed(3)}</td></tr>
    <tr><td class="lbl">Film HTC h_tube</td><td>W/m²K</td><td>${st.bdCorr?.hTube!=null?st.bdCorr.hTube.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Velocity (in-tube)</td><td>m/s</td><td>${st.tubeVel!=null?st.tubeVel.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Pressure Drop (calc)</td><td>${Pu}</td>
      <td class="${(st.tubeDp||0)>(st.pdAllowTube||1.0)?'hi-err':'hi-ok'}">${convP(st.tubeDp||0).toFixed(4)} ${(st.tubeDp||0)>(st.pdAllowTube||1.0)?'✗ EXCEEDS':'✓ OK'}</td></tr>
    <tr><td class="lbl">Allowable ΔP</td><td>${Pu}</td><td>${convP(st.pdAllowTube||1.0).toFixed(3)}</td></tr>
    <tr><td class="lbl">Fouling R (tube)</td><td>m²K/W</td><td>${st.Rfi!=null?st.Rfi.toExponential(2):st.foulFactor!=null?(st.foulFactor/2).toExponential(2):'—'}</td></tr>
  </tbody>
</table>
</div>
</div>


<div class="mini-sec">📐 Exchanger Block Diagram</div>
<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:680px;font-family:'IBM Plex Sans',sans-serif;margin-bottom:8px">
  <defs>
    <marker id="arrd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round"/>
    </marker>
    <marker id="dimd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <line x1="5" y1="1" x2="5" y2="9" stroke="context-stroke" stroke-width="1.5"/>
    </marker>
  </defs>
  <!-- Shell -->
  <rect x="70" y="55" width="440" height="100" rx="5" fill="none" stroke="#3a4560" stroke-width="1.8"/>
  <ellipse cx="70"  cy="105" rx="12" ry="50" fill="#f5f7fb" stroke="#3a4560" stroke-width="1.8"/>
  <ellipse cx="510" cy="105" rx="12" ry="50" fill="#f5f7fb" stroke="#3a4560" stroke-width="1.8"/>
  <!-- Tubes -->
  <line x1="70"  y1="88"  x2="510" y2="88"  stroke="#0055c8" stroke-width="1.2" stroke-dasharray="5 3" opacity=".6"/>
  <line x1="70"  y1="105" x2="510" y2="105" stroke="#0055c8" stroke-width="1.8" stroke-dasharray="5 3" opacity=".8"/>
  <line x1="70"  y1="122" x2="510" y2="122" stroke="#0055c8" stroke-width="1.2" stroke-dasharray="5 3" opacity=".6"/>
  <text x="290" y="100" text-anchor="middle" fill="#0055c8" font-size="7.5" font-weight="600">${st.numTubes} tubes · ${st.nTubesPerPass}/pass × ${st.nPasses} passes · OD ${st.OD?(st.OD*1000).toFixed(1):'?'} / ID ${st.Di?(st.Di*1000).toFixed(1):'?'} mm</text>
  <!-- Baffles -->
  ${Array.from({length:Math.min(st.bdCorr?.nBaffles??4,6)},(_,i)=>{
    const x=70+(440*(i+1)/(Math.min(st.bdCorr?.nBaffles??4,6)+1));
    const t=i%2===0?70:55; const b=i%2===0?155:140;
    return `<line x1="${x.toFixed(0)}" y1="${t}" x2="${x.toFixed(0)}" y2="${b}" stroke="#888" stroke-width="2" opacity=".55"/>`;
  }).join('')}
  <!-- Hot nozzles -->
  <rect x="130" y="35" width="28" height="22" rx="2" fill="#fff3ee" stroke="#e8500a" stroke-width="1.2"/>
  <text x="144" y="29" text-anchor="middle" fill="#e8500a" font-size="7.5" font-weight="700">HOT IN ${tDisp(st.hTi).toFixed(1)}${tU()}</text>
  <line x1="144" y1="35" x2="144" y2="55" stroke="#e8500a" stroke-width="1.2" marker-end="url(#arrd)"/>
  <rect x="370" y="155" width="28" height="22" rx="2" fill="#fff3ee" stroke="#c03d00" stroke-width="1.2"/>
  <text x="384" y="192" text-anchor="middle" fill="#c03d00" font-size="7.5" font-weight="700">HOT OUT ${tDisp(st.hTo).toFixed(1)}${tU()}</text>
  <line x1="384" y1="177" x2="384" y2="155" stroke="#c03d00" stroke-width="1.2" marker-end="url(#arrd)"/>
  <!-- Cold nozzles -->
  <rect x="34" y="88" width="26" height="34" rx="2" fill="#eef4ff" stroke="#0055c8" stroke-width="1.2"/>
  <text x="20" y="98" text-anchor="end" fill="#0055c8" font-size="7.5" font-weight="700">COLD IN</text>
  <text x="20" y="108" text-anchor="end" fill="#0055c8" font-size="7.5">${tDisp(st.cTi).toFixed(1)}${tU()}</text>
  <line x1="60" y1="105" x2="70" y2="105" stroke="#0055c8" stroke-width="1.5" marker-end="url(#arrd)"/>
  <rect x="522" y="88" width="26" height="34" rx="2" fill="#eef4ff" stroke="#008f76" stroke-width="1.2"/>
  <text x="660" y="98" text-anchor="end" fill="#008f76" font-size="7.5" font-weight="700">COLD OUT</text>
  <text x="660" y="108" text-anchor="end" fill="#008f76" font-size="7.5">${tDisp(st.cTo).toFixed(1)}${tU()}</text>
  <line x1="522" y1="105" x2="510" y2="105" stroke="#008f76" stroke-width="1.5" marker-start="url(#arrd)"/>
  <!-- Tube length dimension -->
  <line x1="70" y1="183" x2="510" y2="183" stroke="#444" stroke-width="0.8" marker-start="url(#dimd)" marker-end="url(#dimd)"/>
  <line x1="70" y1="174" x2="70" y2="192" stroke="#444" stroke-width="0.7"/>
  <line x1="510" y1="174" x2="510" y2="192" stroke="#444" stroke-width="0.7"/>
  <text x="290" y="196" text-anchor="middle" fill="#0c1322" font-size="9" font-weight="700">L = ${st.L!=null?st.L.toFixed(2):'?'} m</text>
  <!-- Shell ID dimension -->
  <line x1="28" y1="55" x2="28" y2="155" stroke="#444" stroke-width="0.8" marker-start="url(#dimd)" marker-end="url(#dimd)"/>
  <line x1="18" y1="55" x2="38" y2="55" stroke="#444" stroke-width="0.7"/>
  <line x1="18" y1="155" x2="38" y2="155" stroke="#444" stroke-width="0.7"/>
  <text x="14" y="108" text-anchor="middle" fill="#0c1322" font-size="8" font-weight="700" transform="rotate(-90,14,108)">ID=${st.shellID?(st.shellID*1000).toFixed(0):'?'} mm</text>
  <!-- Status strip -->
  <rect x="70"  y="207" width="125" height="16" rx="3" fill="${st.tubeVel>=(st.targetVel||1.5)*0.9?'#e6f7f4':'#fff3ee'}" stroke="${st.tubeVel>=(st.targetVel||1.5)*0.9?'#008f76':'#e8500a'}" stroke-width="0.8"/>
  <text x="133" y="219" text-anchor="middle" fill="${st.tubeVel>=(st.targetVel||1.5)*0.9?'#1b7a3e':'#c0201a'}" font-size="7.5" font-weight="700">v=${st.tubeVel!=null?st.tubeVel.toFixed(3):'?'} m/s ${st.tubeVel>=(st.targetVel||1.5)*0.9?'✓':'⚠'}</text>
  <rect x="205" y="207" width="125" height="16" rx="3" fill="${(st.shellDP||0)<=(st.pdAllowShell||0.7)?'#e6f7f4':'#fff3ee'}" stroke="${(st.shellDP||0)<=(st.pdAllowShell||0.7)?'#008f76':'#e8500a'}" stroke-width="0.8"/>
  <text x="268" y="219" text-anchor="middle" fill="${(st.shellDP||0)<=(st.pdAllowShell||0.7)?'#1b7a3e':'#c0201a'}" font-size="7.5" font-weight="700">ΔP_s=${convP(st.shellDP||0).toFixed(3)} ${pU()} ${(st.shellDP||0)<=(st.pdAllowShell||0.7)?'✓':'✗'}</text>
  <rect x="340" y="207" width="125" height="16" rx="3" fill="${(st.tubeDp||0)<=(st.pdAllowTube||1.0)?'#e6f7f4':'#fff3ee'}" stroke="${(st.tubeDp||0)<=(st.pdAllowTube||1.0)?'#008f76':'#e8500a'}" stroke-width="0.8"/>
  <text x="403" y="219" text-anchor="middle" fill="${(st.tubeDp||0)<=(st.pdAllowTube||1.0)?'#1b7a3e':'#c0201a'}" font-size="7.5" font-weight="700">ΔP_t=${convP(st.tubeDp||0).toFixed(3)} ${pU()} ${(st.tubeDp||0)<=(st.pdAllowTube||1.0)?'✓':'✗'}</text>
  <rect x="475" y="207" width="105" height="16" rx="3" fill="${(st.overSurf||0)>=0?'#e6f7f4':'#fff3ee'}" stroke="${(st.overSurf||0)>=0?'#008f76':'#e8500a'}" stroke-width="0.8"/>
  <text x="528" y="219" text-anchor="middle" fill="${(st.overSurf||0)>=0?'#1b7a3e':'#c0201a'}" font-size="7.5" font-weight="700">OS=${(st.overSurf||0).toFixed(1)}% ${(st.overSurf||0)>=0?'✓':'✗'}</text>
</svg>

<div class="mini-sec">⚡ Exchanger Performance &amp; Geometry</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr>
      <td class="lbl">LMTD (raw)</td><td>${T}</td><td>${st.lmtd!=null?st.lmtd.toFixed(4):'—'}</td>
      <td class="lbl">U Overall</td><td>W/m²K</td><td><b>${st.U!=null?st.U.toFixed(2):'—'}</b></td>
    </tr>
    <tr>
      <td class="lbl">F correction</td><td>—</td><td>${st.F!=null?st.F.toFixed(4):'—'}</td>
      <td class="lbl">Required Area</td><td>${Au}</td><td>${st.area!=null?convA(st.area).toFixed(3):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Effective LMTD (F×LMTD)</td><td>${T}</td><td><b>${st.FLMTD!=null?st.FLMTD.toFixed(4):'—'}</b></td>
      <td class="lbl">Heat Balance Error</td><td>%</td>
      <td class="${st.balErr>5?'hi-warn':'hi-ok'}">${st.balErr!=null?st.balErr.toFixed(3):'—'} ${st.balErr<3?'✓ Balanced':'⚠ Check inputs'}</td>
    </tr>
    <tr>
      <td class="lbl">Effectiveness ε</td><td>%</td><td>${st.eff!=null?(st.eff*100).toFixed(2):'—'}</td>
      <td class="lbl">NTU</td><td>—</td><td>${st.NTU!=null?st.NTU.toFixed(4):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Number of Tubes</td><td>—</td><td>${st.numTubes!=null?st.numTubes:'—'}</td>
      <td class="lbl">Shell ID (est.)</td><td>mm</td><td>${st.shellID!=null?(st.shellID*1000).toFixed(0):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Tube Length</td><td>m</td><td><b>${st.L!=null?st.L.toFixed(2):'—'}</b></td>
      <td class="lbl">Tubes per Pass</td><td>—</td><td>${st.nTubesPerPass!=null?st.nTubesPerPass:'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Tube OD / ID</td><td>mm</td><td>${st.OD!=null?(st.OD*1000).toFixed(2):'—'} / ${st.Di!=null?(st.Di*1000).toFixed(2):'—'}</td>
      <td class="lbl">Number of Passes</td><td>—</td><td>${st.nPasses!=null?st.nPasses:'—'}</td>
    </tr>
    <tr>
      <td class="lbl">TEMA Class</td><td>—</td><td>${st.tema||'—'}</td>
      <td class="lbl">Pitch / Layout</td><td>—</td><td>${st.pitchRatio!=null?st.pitchRatio.toFixed(2):'—'} / ${st.pitchLayout||'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Tube Material (k)</td><td>W/mK</td><td>${st.tubeMat||'—'}</td>
      <td class="lbl">Fouling R_fo (shell)</td><td>m²K/W</td><td>${st.Rfo!=null?st.Rfo.toExponential(2):st.foulFactor!=null?(st.foulFactor/2).toExponential(2):'—'} / R_fi (tube): ${st.Rfi!=null?st.Rfi.toExponential(2):st.foulFactor!=null?(st.foulFactor/2).toExponential(2):'—'}</td>
    </tr>
    ${st.bdCorr?`<tr>
      <td class="lbl">Bell-Delaware J factors</td><td>—</td>
      <td>Jc=${st.bdCorr.Jc.toFixed(3)} · Jl=${st.bdCorr.Jl.toFixed(3)} · Jb=${st.bdCorr.Jb.toFixed(3)} · Jr=${st.bdCorr.Jr.toFixed(3)} · Js=${st.bdCorr.Js!=null?st.bdCorr.Js.toFixed(3):'1.000'}</td>
      <td class="lbl">J_total</td><td>—</td><td><b>${st.bdCorr.Jtotal.toFixed(4)}</b></td>
    </tr>`:''}
    ${st.bdCorr?.hShell&&st.bdCorr?.hTube?`<tr>
      <td class="lbl">Shell-side Re</td><td>—</td><td>${st.shellRe!=null?st.shellRe.toFixed(0):'—'}</td>
      <td class="lbl">Tube-side Re</td><td>—</td><td>${st.bdCorr?.Re_tube!=null?st.bdCorr.Re_tube.toFixed(0):'—'}</td>
    </tr>`:''}
  </tbody>
</table>


${(()=>{
  if(!st.resistanceBreakdown||st.resistanceBreakdown.length===0) return '';
  const segs=st.resistanceBreakdown;
  const Rt_val=segs.reduce((s,x)=>s+x.pct,0);
  return `<div style="margin-bottom:8px">
  <div class="mini-sec">🔬 Thermal Resistance Distribution</div>
  <div style="display:flex;align-items:flex-start;gap:12px">
    <div style="flex:1">
      <table>
        <thead><tr><th>Component</th><th>R (m²K/W)</th><th>%</th></tr></thead>
        <tbody>
          ${segs.map(s=>`<tr><td class="lbl">${s.label}</td><td>—</td><td class="${s.pct>60?'hi-warn':''}">${s.pct.toFixed(1)}%</td></tr>`).join('')}
          <tr style="background:#eef4ff"><td class="lbl"><b>Total → U</b></td><td>—</td><td><b>100%</b></td></tr>
        </tbody>
      </table>
    </div>
    <div style="flex-shrink:0;padding-top:4px">${thermalPieSVG(segs)}</div>
  </div>
  </div>`;
})()}

<div class="div-strip">
  <div class="div-item">Status: <span>${st.st||'—'}</span></div>
  <span class="div-sep">|</span>
  <div class="div-item">Flow Arrangement: <span>${st.lmtdArr||'—'}</span></div>
  <span class="div-sep">|</span>
  <div class="div-item">HX Type: <span>${st.tema||'—'}</span></div>
  <span class="div-sep">|</span>
  <div class="div-item">Balance Error: <span>${st.balErr!=null?st.balErr.toFixed(2)+'%':'—'}</span></div>
  ${st.convergence?`<span class="div-sep">|</span>
  <div class="div-item">U Convergence: <span style="color:${st.convergence.converged?'#1b7a3e':'#c0201a'}">${st.convergence.converged?'✓':'⚠'} ${st.convergence.iterations} iter / ${st.convergence.deviation_pct}% dev</span></div>`:''}
  ${st.convergence?.twophase_lmtd?`<span class="div-sep">|</span><div class="div-item">LMTD Mode: <span style="color:#0055c8">Two-phase (F=1.0)</span></div>`:''}
</div>

${(()=>{
  if(!st.convergence) return '';
  const cv=st.convergence;
  return `<div style="margin-top:6px;page-break-inside:avoid">
  <div class="mini-sec" style="color:#6b21d4;border-bottom-color:#dab8fa">🔁 U Convergence Iteration Log — Temperature-Dependent Fluid Properties</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <table>
      <thead><tr><th>Iter</th><th>U Assumed (W/m²K)</th><th>U Actual (W/m²K)</th><th>Dev %</th></tr></thead>
      <tbody>
        ${cv.history.slice(0,8).map(r=>`<tr>
          <td>${r.iter}</td>
          <td>${r.U_assumed.toFixed(1)}</td>
          <td>${r.U_actual.toFixed(1)}</td>
          <td class="${r.deviation_pct<1?'hi-ok':r.deviation_pct<5?'':'hi-warn'}">${r.deviation_pct.toFixed(3)}%</td>
        </tr>`).join('')}
        ${cv.history.length>8?`<tr><td colspan="4" style="text-align:center;color:#888;font-size:6.5pt">... ${cv.history.length-8} more iterations</td></tr>`:''}
      </tbody>
    </table>
    <table>
      <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td class="lbl">Seed U (literature)</td><td>${cv.U_seed} W/m²K</td></tr>
        <tr><td class="lbl">Final U (converged)</td><td><b>${cv.U_final} W/m²K</b></td></tr>
        <tr><td class="lbl">Total iterations</td><td>${cv.iterations}</td></tr>
        <tr><td class="lbl">Final deviation</td><td class="${cv.converged?'hi-ok':'hi-warn'}">${cv.deviation_pct}%</td></tr>
        <tr><td class="lbl">Convergence status</td><td class="${cv.converged?'hi-ok':'hi-warn'}">${cv.converged?'✓ Converged (<0.5%)':'⚠ Not converged'}</td></tr>
        <tr><td class="lbl">Fluid props method</td><td>T-dependent (getFluidAtT)</td></tr>
        <tr><td class="lbl">Viscosity correction</td><td>Sieder-Tate (μ/μ_w)^0.14</td></tr>
        <tr><td class="lbl">LMTD method</td><td>${cv.twophase_lmtd?'Two-phase isothermal (F=1.0)':'Standard F-correction'}</td></tr>
      </tbody>
    </table>
  </div>
  </div>`;
})()}
`:''}


${pl?`
<div class="sec ${st?'pg ':''}teal">
  <span style="flex:1">🔲 Plate Heat Exchanger — Calculation Results</span>
</div>
<!-- page brand repeat -->
${st?`<div style="text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8500a20">
  <span style="font-size:11pt;font-weight:900;background:linear-gradient(135deg,#e8500a,#0055c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">multicalci.com</span>
  <span style="font-size:6.5pt;color:#aaa;margin-left:8px">HeatXpert Pro · Heat Exchanger Design Datasheet</span>
</div>`:''}
<div class="kpi-strip">
  <div class="kpi r"><div class="kl">Heat Duty</div><div class="kv">${convQ(pl.Q).toFixed(1)}<span class="ku"> ${H}</span></div></div>
  <div class="kpi b"><div class="kl">LMTD×F</div><div class="kv">${pl.FLMTD.toFixed(2)}<span class="ku"> ${T}</span></div></div>
  <div class="kpi t"><div class="kl">Area Req.</div><div class="kv">${convA(pl.A_req).toFixed(2)}<span class="ku"> ${Au}</span></div></div>
  <div class="kpi g"><div class="kl">U Overall</div><div class="kv">${pl.U!=null?convU(pl.U).toFixed(0):'—'}<span class="ku"> ${Uu}</span></div></div>
  <div class="kpi ${pl.eff>0.65?'ok':'warn'}"><div class="kl">Effectiveness ε</div><div class="kv">${pl.eff!=null?(pl.eff*100).toFixed(1):'—'}<span class="ku"> %</span></div></div>
  <div class="kpi b"><div class="kl">No. Plates</div><div class="kv">${pl.nPlates||'—'}</div></div>
</div>

<div class="panel-pair">
<div>
<div class="mini-sec red">🔴 Hot Side</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid</td><td>—</td><td>${pl.hFluid.name}</td></tr>
    <tr><td class="lbl">T In / Out</td><td>${T}</td><td>${tDisp(pl.hTi).toFixed(2)} / ${tDisp(pl.hTo).toFixed(2)}</td></tr>
    <tr><td class="lbl">Flow Rate</td><td>kg/h</td><td>${pl.hF!=null?pl.hF.toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Heat Duty</td><td>${H}</td><td>${convQ(pl.Q).toFixed(3)}</td></tr>
    <tr><td class="lbl">Pressure Drop</td><td>${Pu}</td>
      <td class="${(pl.dpH||0)>(pl.pdAllowH||1.5)?'hi-err':'hi-ok'}">${pl.dpH!=null?convP(pl.dpH).toFixed(4):'—'}</td></tr>
    <tr><td class="lbl">Allow. ΔP</td><td>${Pu}</td><td>${convP(pl.pdAllowH||1.5).toFixed(3)}</td></tr>
    <tr><td class="lbl">Film h (hot)</td><td>W/m²K</td><td>${pl.hH!=null?pl.hH.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Re (hot)</td><td>—</td><td>${pl.Reh!=null?pl.Reh.toFixed(0):'—'}</td></tr>
  </tbody>
</table>
</div>
<div>
<div class="mini-sec teal">🔵 Cold Side</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid</td><td>—</td><td>${pl.cFluid.name}</td></tr>
    <tr><td class="lbl">T In / Out</td><td>${T}</td><td>${tDisp(pl.cTi).toFixed(2)} / ${tDisp(pl.cTo).toFixed(2)}</td></tr>
    <tr><td class="lbl">Flow Rate</td><td>kg/h</td><td>${pl.cF!=null?pl.cF.toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Heat Duty</td><td>${H}</td><td>${pl.Qcold!=null?convQ(pl.Qcold).toFixed(3):convQ(pl.Q).toFixed(3)}</td></tr>
    <tr><td class="lbl">Pressure Drop</td><td>${Pu}</td>
      <td class="${(pl.dpC||0)>(pl.pdAllowC||1.5)?'hi-err':'hi-ok'}">${pl.dpC!=null?convP(pl.dpC).toFixed(4):'—'}</td></tr>
    <tr><td class="lbl">Allow. ΔP</td><td>${Pu}</td><td>${convP(pl.pdAllowC||1.5).toFixed(3)}</td></tr>
    <tr><td class="lbl">Film h (cold)</td><td>W/m²K</td><td>${pl.hC!=null?pl.hC.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Re (cold)</td><td>—</td><td>${pl.Rec!=null?pl.Rec.toFixed(0):'—'}</td></tr>
  </tbody>
</table>
</div>
</div>

<div class="mini-sec">⚡ Plate Specification &amp; Performance</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr>
      <td class="lbl">Plate dimensions (W×L)</td><td>mm</td><td>${pl.plateW!=null?(pl.plateW*1000).toFixed(0):'—'} × ${pl.plateL!=null?(pl.plateL*1000).toFixed(0):'—'}</td>
      <td class="lbl">Plate thickness</td><td>mm</td><td>${pl.plateTh!=null?(pl.plateTh*1000).toFixed(1):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Channel gap</td><td>mm</td><td>${pl.gap!=null?(pl.gap*1000).toFixed(1):'—'}</td>
      <td class="lbl">Corrugation angle</td><td>°</td><td>${pl.angle!=null?pl.angle.toFixed(0):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Enlargement factor φ</td><td>—</td><td>${pl.phi!=null?pl.phi.toFixed(3):'—'}</td>
      <td class="lbl">Material</td><td>—</td><td>${pl.matName||'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Number of plates</td><td>—</td><td><b>${pl.nPlates||'—'}</b></td>
      <td class="lbl">Required area</td><td>${Au}</td><td>${pl.A_req!=null?convA(pl.A_req).toFixed(3):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Fouling factor</td><td>m²K/W</td><td>${pl.foul!=null?pl.foul.toExponential(2):'—'}</td>
      <td class="lbl">U overall</td><td>W/m²K</td><td><b>${pl.U!=null?pl.U.toFixed(2):'—'}</b></td>
    </tr>
    <tr>
      <td class="lbl">Effectiveness ε</td><td>%</td><td>${pl.eff!=null?(pl.eff*100).toFixed(2):'—'}</td>
      <td class="lbl">NTU</td><td>—</td><td>${pl.NTU!=null?pl.NTU.toFixed(4):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">LMTD</td><td>${T}</td><td>${pl.lmtd!=null?pl.lmtd.toFixed(4):'—'}</td>
      <td class="lbl">Heat Balance Error</td><td>%</td>
      <td class="${pl.balErr>5?'hi-warn':'hi-ok'}">${pl.balErr!=null?pl.balErr.toFixed(3):'—'}</td>
    </tr>
  </tbody>
</table>

<div class="div-strip">
  <div class="div-item">Status: <span>${pl.st||'—'}</span></div>
  <span class="div-sep">|</span>
  <div class="div-item">Close Approach ΔT: <span>${pl.minApproachDT!=null?pl.minApproachDT.toFixed(2):(Math.min(pl.hTi-pl.cTo, pl.hTo-pl.cTi)).toFixed(2)} ${T}</span></div>
  <span class="div-sep">|</span>
  <div class="div-item">Balance Error: <span>${pl.balErr!=null?pl.balErr.toFixed(2)+'%':'—'}</span></div>
</div>
`:''}


${ac?`
<div class="sec ${(st||pl)?'pg ':''}">💨 Air Cooled Heat Exchanger — Calculation Results</div>
${(st||pl)?`<div style="text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8500a20"><span style="font-size:11pt;font-weight:900;background:linear-gradient(135deg,#e8500a,#0055c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">multicalci.com</span><span style="font-size:6.5pt;color:'#aaa';margin-left:8px">HeatXpert Pro · Heat Exchanger Design Datasheet</span></div>`:''}
<div class="kpi-strip">
  <div class="kpi r"><div class="kl">Heat Duty</div><div class="kv">${convQ(ac.Q).toFixed(1)}<span class="ku"> ${H}</span></div></div>
  <div class="kpi b"><div class="kl">LMTD</div><div class="kv">${ac.FLMTD!=null?ac.FLMTD.toFixed(2):'—'}<span class="ku"> ${T}</span></div></div>
  <div class="kpi t"><div class="kl">Req. Area</div><div class="kv">${convA(ac.area).toFixed(1)}<span class="ku"> ${Au}</span></div></div>
  <div class="kpi g"><div class="kl">U Overall</div><div class="kv">${ac.U!=null?convU(ac.U).toFixed(0):'—'}<span class="ku"> ${Uu}</span></div></div>
  <div class="kpi b"><div class="kl">No. Bays</div><div class="kv">${ac.numBays||'—'}</div></div>
  <div class="kpi ${ac.eff>0.5?'ok':'warn'}"><div class="kl">Effectiveness ε</div><div class="kv">${ac.eff!=null?(ac.eff*100).toFixed(1):'—'}<span class="ku"> %</span></div></div>
</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Process Side (Hot)</th><th>Air Side</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid</td><td>—</td><td>${ac.fluid!=null?ac.fluid.name:'—'}</td><td>Atmospheric Air</td></tr>
    <tr><td class="lbl">T Inlet / Outlet</td><td>${T}</td><td>${tDisp(ac.Ti).toFixed(2)} / ${tDisp(ac.To).toFixed(2)}</td><td>${tDisp(ac.Tamb).toFixed(2)} / ${tDisp(ac.TairOut!=null?ac.TairOut:ac.Tamb+(ac.dTa||15)).toFixed(2)}</td></tr>
    <tr><td class="lbl">Flow Rate</td><td>kg/h</td><td>${ac.F!=null?ac.F.toFixed(1):'—'}</td><td>${ac.mAir!=null?ac.mAir.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Heat Duty</td><td>${H}</td><td colspan="2">${convQ(ac.Q).toFixed(3)}</td></tr>
    <tr><td class="lbl">Pressure Drop</td><td>${Pu}</td><td>${ac.dpProcess!=null?convP(ac.dpProcess).toFixed(4):'—'}</td><td>${ac.dpAir!=null?convP(ac.dpAir).toFixed(5):'—'}</td></tr>
    <tr><td class="lbl">Film HTC</td><td>W/m²K</td><td>${ac.hProcess!=null?ac.hProcess.toFixed(0):'—'}</td><td>${ac.hAir!=null?ac.hAir.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">LMTD / U / Area</td><td>—</td><td colspan="2">${ac.FLMTD!=null?ac.FLMTD.toFixed(2):'—'} ${T} / ${ac.U!=null?ac.U.toFixed(1):'—'} W/m²K / ${convA(ac.area).toFixed(2)} ${Au}</td></tr>
    <tr><td class="lbl">No. Bays / Fan Type</td><td>—</td><td colspan="2">${ac.numBays||'—'} bays / ${ac.fanType||'—'}</td></tr>
    <tr><td class="lbl">Fin Type / Material</td><td>—</td><td colspan="2">${ac.finType||'—'} / ${ac.finMat||'—'}</td></tr>
    <tr><td class="lbl">Fins per Metre / Rows</td><td>—</td><td colspan="2">${ac.fpm!=null?ac.fpm:''} fins/m / ${ac.rows||'—'} rows</td></tr>
  </tbody>
</table>
`:''}


${ff?`
<div class="sec ${(st||pl||ac)?'pg ':''}blue">🌬️ Fin-Fan Air Cooled HX — Engineering Datasheet (API 661)</div>
${(st||pl)?`<div style="text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8500a20"><span style="font-size:11pt;font-weight:900;background:linear-gradient(135deg,#e8500a,#0055c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">multicalci.com</span><span style="font-size:6.5pt;color:'#aaa';margin-left:8px">HeatXpert Pro · Heat Exchanger Design Datasheet</span></div>`:''}


<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;background:#f0f9f7;border:0.5px solid #a0ded5;border-radius:4px;padding:6px 10px">
  <div style="font-size:9pt;font-weight:700;color:#0c1322">Overall Status: <span style="color:${ff.st==='ok'?'#1b7a3e':ff.st==='warn'?'#b35a00':'#c0201a'}">${ff.stTxt}</span></div>
  <div style="font-size:7.5pt;color:#555">Total Duty: <b>${ff.Qhot!=null?ff.Qhot.toFixed(1):'—'} kW</b> | Area Prov: <b>${ff.A_prov!=null?ff.A_prov.toFixed(1):'—'} m²</b> | Overdesign: <b style="color:${ff.overDesign>=5?'#1b7a3e':'#b35a00'}">${ff.overDesign!=null?ff.overDesign.toFixed(1)+'%':'—'}</b></div>
</div>


<div class="kpi-strip">
  <div class="kpi r"><div class="kl">Total Duty</div><div class="kv">${ff.Qhot!=null?ff.Qhot.toFixed(1):'—'}<span class="ku"> kW</span></div></div>
  <div class="kpi b"><div class="kl">EMTD</div><div class="kv">${ff.EMTD!=null?ff.EMTD.toFixed(1):'—'}<span class="ku"> ${T}</span></div></div>
  <div class="kpi t"><div class="kl">Ext. Area (prov)</div><div class="kv">${ff.A_prov!=null?ff.A_prov.toFixed(0):'—'}<span class="ku"> m²</span></div></div>
  <div class="kpi g"><div class="kl">Actual U</div><div class="kv">${ff.U_actual!=null?ff.U_actual.toFixed(1):'—'}<span class="ku"> W/m²K</span></div></div>
  <div class="kpi ${ff.overDesign>=5?'ok':'warn'}"><div class="kl">Overdesign</div><div class="kv">${ff.overDesign!=null?ff.overDesign.toFixed(1):'—'}<span class="ku"> %</span></div></div>
  <div class="kpi ${ff.eta_fin>=0.7?'ok':'warn'}"><div class="kl">Fin Efficiency η</div><div class="kv">${ff.eta_fin!=null?(ff.eta_fin*100).toFixed(1):'—'}<span class="ku"> %</span></div></div>
</div>


<div class="mini-sec">📋 Process Conditions</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Outside (Air)</th><th>Tubeside (Process)</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid name</td><td>—</td><td>Atmospheric Air</td><td>${ff.tFluid!=null?ff.tFluid.name:'—'}</td></tr>
    <tr><td class="lbl">Fluid condition</td><td>—</td><td>Sens. Gas</td><td>${(()=>{if(!ff.tTi||!ff.tTo)return'—';const dt=ff.tTi-ff.tTo;return dt>0?'Sensible Liquid/Gas':dt===0?'Phase change':'—';})()}</td></tr>
    <tr><td class="lbl">Total flow rate</td><td>1000 kg/h</td>
      <td>${ff.mAir_kgh!=null?(ff.mAir_kgh/1000).toFixed(3):'—'}</td>
      <td>${ff.tF_kgh!=null?(ff.tF_kgh/1000).toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Temperature In / Out</td><td>${T}</td>
      <td>${ff.aTamb!=null?tDisp(ff.aTamb).toFixed(2):'—'} / ${ff.aTout!=null?tDisp(ff.aTout).toFixed(2):'—'}</td>
      <td>${ff.tTi!=null?tDisp(ff.tTi).toFixed(2):'—'} / ${ff.tTo!=null?tDisp(ff.tTo).toFixed(2):'—'}</td></tr>
    <tr><td class="lbl">Pressure Drop Total / Allow</td><td>bar</td>
      <td>${ff.dpAir_Pa!=null?(ff.dpAir_Pa/1e5).toFixed(5):'—'} / —</td>
      <td class="${ff.dpTube>ff.tPdAllow?'hi-err':'hi-ok'}">${ff.dpTube!=null?ff.dpTube.toFixed(4):'—'} / ${ff.tPdAllow!=null?ff.tPdAllow.toFixed(3):'—'} ${ff.dpTube>ff.tPdAllow?'✗':'✓'}</td></tr>
    <tr><td class="lbl">Velocity (face / tube)</td><td>m/s</td>
      <td>${ff.v_face!=null?ff.v_face.toFixed(3):'—'} face / ${ff.v_max!=null?ff.v_max.toFixed(3):'—'} max</td>
      <td>${ff.tubeVel!=null?ff.tubeVel.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Re (air / tube)</td><td>—</td>
      <td>${ff.Re_air!=null?ff.Re_air.toFixed(0):'—'}</td>
      <td>${ff.Re_tube!=null?ff.Re_tube.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Fouling</td><td>m²K/W</td>
      <td>${ff.aFoul!=null?ff.aFoul.toExponential(2):'—'}</td>
      <td>${ff.tFoul!=null?ff.tFoul.toExponential(2):'—'}</td></tr>
  </tbody>
</table>


<div class="panel-pair">
<div>
<div class="mini-sec">⚡ Exchanger Performance</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Outside film coeff (air)</td><td>W/m²K</td><td>${ff.h_outside!=null?ff.h_outside.toFixed(2):'—'}</td></tr>
    <tr><td class="lbl">Tubeside film coeff</td><td>W/m²K</td><td>${ff.h_tubeside!=null?ff.h_tubeside.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Clean coeff (U_clean)</td><td>W/m²K</td><td>${ff.h_clean!=null?ff.h_clean.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Actual U (extended area)</td><td>W/m²K</td><td><b>${ff.U_actual!=null?ff.U_actual.toFixed(3):'—'}</b></td></tr>
    <tr><td class="lbl">Required U</td><td>W/m²K</td><td>${ff.U_req!=null?ff.U_req.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Provided area</td><td>m²</td><td>${ff.A_prov!=null?ff.A_prov.toFixed(2):'—'}</td></tr>
    <tr><td class="lbl">Required area</td><td>m²</td><td>${ff.A_req!=null?ff.A_req.toFixed(2):'—'}</td></tr>
    <tr><td class="lbl">Overdesign</td><td>%</td><td class="${ff.overDesign>=5?'hi-ok':'hi-warn'}">${ff.overDesign!=null?ff.overDesign.toFixed(2):'—'}</td></tr>
    <tr><td class="lbl">EMTD</td><td>${T}</td><td><b>${ff.EMTD!=null?ff.EMTD.toFixed(2):'—'}</b></td></tr>
    <tr><td class="lbl">LMTD (raw)</td><td>${T}</td><td>${ff.lmtd!=null?ff.lmtd.toFixed(4):'—'}</td></tr>
    <tr><td class="lbl">F correction (rows)</td><td>—</td><td>${ff.F_rows!=null?ff.F_rows.toFixed(4):'—'}</td></tr>
    <tr><td class="lbl">Overall surf. eff. η₀</td><td>—</td><td>${ff.eta_surf!=null?ff.eta_surf.toFixed(4):'—'}</td></tr>
  </tbody>
</table>
</div>
<div>
<div class="mini-sec">🔬 Thermal Resistance Distribution</div>
${(()=>{
  if(!ff.U_actual) return '<p style="font-size:7pt;color:#999">Run calculation to see resistance breakdown</p>';
  const U=ff.U_actual||1, R_total=1/U;
  const R_air=ff.h_air_eff!=null?1/ff.h_air_eff:R_total*0.5;
  const R_tube=ff.h_tubeside!=null?1/ff.h_tubeside:R_total*0.1;
  const R_foul=(ff.tFoul||0.00029)+(ff.aFoul||0.00018);
  const R_wall_est=R_total-R_air-R_tube-R_foul;
  const Rt2=R_air+R_tube+R_foul+Math.max(R_wall_est,0.001);
  const p2=x=>Rt2>0?(x/Rt2*100).toFixed(1):'0.0';
  const segs2=[
    {label:'Air-side film',pct:parseFloat(p2(R_air)),  color:'#0055c8'},
    {label:'Tube film',    pct:parseFloat(p2(R_tube)), color:'#e8500a'},
    {label:'Fouling',      pct:parseFloat(p2(R_foul)), color:'#c07800'},
    {label:'Metal wall',   pct:parseFloat(p2(Math.max(R_wall_est,0.001))),color:'#6b7899'},
  ];
  return `<table>
    <thead><tr><th>Component</th><th>R (m²K/W)</th><th>%</th></tr></thead>
    <tbody>
      <tr><td class="lbl">Air-side film (dominant)</td><td>${R_air.toExponential(3)}</td><td class="hi-warn">${p2(R_air)}%</td></tr>
      <tr><td class="lbl">Tube-side film</td><td>${R_tube.toExponential(3)}</td><td>${p2(R_tube)}%</td></tr>
      <tr><td class="lbl">Fouling (tube+air)</td><td>${R_foul.toExponential(3)}</td><td>${p2(R_foul)}%</td></tr>
      <tr><td class="lbl">Metal wall</td><td>${Math.max(R_wall_est,0).toExponential(3)}</td><td>${p2(Math.max(R_wall_est,0.001))}%</td></tr>
      <tr style="background:#eef4ff"><td class="lbl"><b>Total → U</b></td><td>${Rt2.toExponential(3)}</td><td><b>100%</b></td></tr>
    </tbody>
  </table>
  <div style="margin-top:6px">${thermalPieSVG(segs2)}</div>`;
})()}
</div>
</div>


<div class="mini-sec gold">🏗️ Unit &amp; Tube Geometry</div>
<div class="panel-pair">
<div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Bays in parallel / unit</td><td>—</td><td>${ff.nBays||'—'}</td></tr>
    <tr><td class="lbl">Bundles parallel / bay</td><td>—</td><td>${ff.nBundlesPBay||'—'}</td></tr>
    <tr><td class="lbl">Extended area (eff.)</td><td>m²</td><td>${ff.A_extended!=null?ff.A_extended.toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Bare area/unit (eff.)</td><td>m²</td><td>${ff.A_bare!=null?ff.A_bare.toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Bundle width</td><td>mm</td><td>${ff.bundleW!=null?(ff.bundleW*1000).toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Bundle depth (est.)</td><td>mm</td><td>${ff.bundleL_calc!=null?(ff.bundleL_calc*1000).toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Face area (total)</td><td>m²</td><td>${ff.A_face_total!=null?ff.A_face_total.toFixed(2):'—'}</td></tr>
    <tr><td class="lbl">Area ratio (ext/bare)</td><td>—</td><td>${ff.areaRatio!=null?ff.areaRatio.toFixed(3):'—'}</td></tr>
  </tbody>
</table>
</div>
<div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Tube OD / ID</td><td>mm</td><td>${ff.tubeOD!=null?(ff.tubeOD*1000).toFixed(3):'—'} / ${ff.tubeID!=null?(ff.tubeID*1000).toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Tube length</td><td>mm</td><td>${ff.tubeLen!=null?(ff.tubeLen*1000).toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Tube layout / rows</td><td>—</td><td>${ff.tubeLayout||'—'} / ${ff.nRows||'—'} rows</td></tr>
    <tr><td class="lbl">Trans / Long pitch</td><td>mm</td><td>${ff.pitchT!=null?(ff.pitchT*1000).toFixed(1):'—'} / ${ff.pitchL!=null?(ff.pitchL*1000).toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Number of passes</td><td>—</td><td>${ff.nPasses||'—'}</td></tr>
    <tr><td class="lbl">Tube count (per bay)</td><td>—</td><td>${ff.nTubes||'—'} (${ff.nTubeTotal!=null?ff.nTubeTotal+' total':'—'})</td></tr>
    <tr><td class="lbl">Tube material</td><td>—</td><td>${ff.tubeMat||'—'}</td></tr>
    <tr><td class="lbl">Tube type</td><td>—</td><td>${ff.tubeType||'High-finned'}</td></tr>
  </tbody>
</table>
</div>
</div>


<div class="panel-pair">
<div>
<div class="mini-sec">🌀 Fin Geometry</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fin type</td><td>—</td><td>${ff.finType||'Rectangular'}</td></tr>
    <tr><td class="lbl">Fins / length</td><td>fins/m</td><td>${ff.finDensity!=null?ff.finDensity.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Fin root diameter</td><td>mm</td><td>${ff.finRoot!=null?(ff.finRoot*1000).toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Fin height</td><td>mm</td><td>${ff.finH!=null?(ff.finH*1000).toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Fin OD (tip)</td><td>mm</td><td>${ff.finOD!=null?(ff.finOD*1000).toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Base thickness</td><td>mm</td><td>${ff.finThk!=null?(ff.finThk*1000).toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Fin efficiency η</td><td>%</td><td class="${ff.eta_fin>=0.7?'hi-ok':'hi-warn'}">${ff.eta_fin!=null?(ff.eta_fin*100).toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Overall surf. eff. η₀</td><td>%</td><td>${ff.eta_surf!=null?(ff.eta_surf*100).toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Fin material</td><td>—</td><td>${ff.finMat||'Al 1100-H14'}</td></tr>
    <tr><td class="lbl">Fins per tube</td><td>—</td><td>${ff.finsPerTube!=null?ff.finsPerTube.toFixed(0):'—'}</td></tr>
  </tbody>
</table>
</div>
<div>
<div class="mini-sec">🔄 Fan Geometry &amp; Airside</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">No. fans per bay</td><td>—</td><td>${ff.nFans||'—'}</td></tr>
    <tr><td class="lbl">Fan ring type</td><td>—</td><td>${ff.fanRing||'—'}</td></tr>
    <tr><td class="lbl">Fan diameter</td><td>mm</td><td>${ff.fanDia!=null?(ff.fanDia*1000).toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Fan efficiency</td><td>%</td><td>${ff.fanEff!=null?(ff.fanEff*100).toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Driver power (design)</td><td>kW</td><td>${ff.driverKW!=null?ff.driverKW.toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Required power / fan</td><td>kW</td>
      <td class="${ff.P_fan_each>ff.driverKW?'hi-err':'hi-ok'}">${ff.P_fan_each!=null?ff.P_fan_each.toFixed(2):'—'}</td></tr>
    <tr><td class="lbl">Face velocity</td><td>m/s</td>
      <td class="${ff.v_face>=1.5&&ff.v_face<=4?'hi-ok':'hi-warn'}">${ff.v_face!=null?ff.v_face.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Max velocity</td><td>m/s</td><td>${ff.v_max!=null?ff.v_max.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Air flow (total)</td><td>100 m³/min</td><td>${ff.V_air_100m3min!=null?ff.V_air_100m3min.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Bundle ΔP (air)</td><td>mmH₂O</td><td>${ff.dpAir_mmH2O!=null?ff.dpAir_mmH2O.toFixed(1):'—'}</td></tr>
  </tbody>
</table>
</div>
</div>
`:''}


${dp?`
<div class="sec ${(st||pl||ac||ff)?'pg ':''}blue">↔️ Double Pipe (Hairpin) HX — Calculation Results</div>
${(st||pl)?`<div style="text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8500a20"><span style="font-size:11pt;font-weight:900;background:linear-gradient(135deg,#e8500a,#0055c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">multicalci.com</span><span style="font-size:6.5pt;color:'#aaa';margin-left:8px">HeatXpert Pro · Heat Exchanger Design Datasheet</span></div>`:''}
<div class="kpi-strip">
  <div class="kpi r"><div class="kl">Heat Duty</div><div class="kv">${convQ(dp.Q).toFixed(1)}<span class="ku"> ${H}</span></div></div>
  <div class="kpi b"><div class="kl">LMTD×F</div><div class="kv">${dp.FLMTD.toFixed(2)}<span class="ku"> ${T}</span></div></div>
  <div class="kpi t"><div class="kl">Req. Length</div><div class="kv">${(dp.A_req!=null?dp.A_req.toFixed(2):'—')}<span class="ku"> m</span></div></div>
  <div class="kpi g"><div class="kl">U Overall</div><div class="kv">${convU(dp.U).toFixed(0)}<span class="ku"> ${Uu}</span></div></div>
  <div class="kpi b"><div class="kl">No. Hairpins</div><div class="kv">${dp.nHairpins||'—'}</div></div>
  <div class="kpi ${dp.eff>0.6?'ok':'warn'}"><div class="kl">Effectiveness ε</div><div class="kv">${(dp.eff*100).toFixed(1)}<span class="ku"> %</span></div></div>
</div>

<div class="panel-pair">
<div>
<div class="mini-sec red">🔴 Inner Pipe (Hot)</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid</td><td>—</td><td>${dp.hFluid.name}</td></tr>
    <tr><td class="lbl">T Inlet / Outlet</td><td>${T}</td><td>${tDisp(dp.hTi).toFixed(2)} / ${tDisp(dp.hTo).toFixed(2)}</td></tr>
    <tr><td class="lbl">Flow Rate</td><td>kg/h</td><td>${dp.hF!=null?dp.hF.toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Heat Duty</td><td>${H}</td><td>${convQ(dp.Qhot).toFixed(3)}</td></tr>
    <tr><td class="lbl">Velocity</td><td>m/s</td><td>${dp.velInner!=null?dp.velInner.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Re</td><td>—</td><td>${dp.Re_inner!=null?dp.Re_inner.toFixed(0):'—'} ${dp.Re_inner>=10000?'✓ turbulent':dp.Re_inner>=2300?'transition':'⚠ laminar'}</td></tr>
    <tr><td class="lbl">Film HTC h_i</td><td>W/m²K</td><td>${dp.hInner!=null?dp.hInner.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Pressure Drop</td><td>${Pu}</td>
      <td class="${dp.dpInner>dp.pdAllow?'hi-err':'hi-ok'}">${convP(dp.dpInner).toFixed(4)} ${dp.dpInner>dp.pdAllow?'✗':'✓'}</td></tr>
  </tbody>
</table>
</div>
<div>
<div class="mini-sec teal">🔵 Annulus (Cold)</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Fluid</td><td>—</td><td>${dp.cFluid.name}</td></tr>
    <tr><td class="lbl">T Inlet / Outlet</td><td>${T}</td><td>${tDisp(dp.cTi).toFixed(2)} / ${tDisp(dp.cTo).toFixed(2)}</td></tr>
    <tr><td class="lbl">Flow Rate</td><td>kg/h</td><td>${dp.cF!=null?dp.cF.toFixed(1):'—'}</td></tr>
    <tr><td class="lbl">Heat Duty</td><td>${H}</td><td>${convQ(dp.Qcold).toFixed(3)}</td></tr>
    <tr><td class="lbl">Velocity</td><td>m/s</td><td>${dp.velAnn!=null?dp.velAnn.toFixed(3):'—'}</td></tr>
    <tr><td class="lbl">Re</td><td>—</td><td>${dp.Re_ann!=null?dp.Re_ann.toFixed(0):'—'} ${dp.Re_ann>=10000?'✓ turbulent':dp.Re_ann>=2300?'transition':'⚠ laminar'}</td></tr>
    <tr><td class="lbl">Film HTC h_ann</td><td>W/m²K</td><td>${dp.hAnn!=null?dp.hAnn.toFixed(0):'—'}</td></tr>
    <tr><td class="lbl">Pressure Drop</td><td>${Pu}</td>
      <td class="${dp.dpAnn>dp.pdAllow?'hi-err':'hi-ok'}">${convP(dp.dpAnn).toFixed(4)} ${dp.dpAnn>dp.pdAllow?'✗':'✓'}</td></tr>
  </tbody>
</table>
</div>
</div>

<div class="mini-sec">🔧 Geometry &amp; Summary</div>
<table>
  <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
  <tbody>
    <tr>
      <td class="lbl">Inner pipe OD/ID</td><td>mm</td>
      <td>${dp.iOD!=null?(dp.iOD*1000).toFixed(1):'—'} / ${dp.iID!=null?(dp.iID*1000).toFixed(1):'—'}</td>
      <td class="lbl">Annulus Dh</td><td>mm</td>
      <td>—</td>
    </tr>
    <tr>
      <td class="lbl">Outer pipe ID</td><td>mm</td><td>${dp.iOD!=null?((dp.iOD+0.006)*1000).toFixed(1):'—'}</td>
      <td class="lbl">Flow arrangement</td><td>—</td><td>Countercurrent</td>
    </tr>
    <tr>
      <td class="lbl">Hairpin length</td><td>m</td><td>${dp.L||'—'}</td>
      <td class="lbl">No. hairpins</td><td>—</td><td>${dp.nHairpins||'—'}</td>
    </tr>
    <tr>
      <td class="lbl">Total active length</td><td>m</td><td>${dp.L_total!=null?dp.L_total.toFixed(1):'—'}</td>
      <td class="lbl">Over-surface</td><td>%</td>
      <td class="${dp.overDesign>40?'hi-warn':'hi-ok'}">${dp.overDesign!=null?dp.overDesign.toFixed(1):'—'}</td>
    </tr>
    <tr>
      <td class="lbl">LMTD / F×LMTD</td><td>${T}</td>
      <td>${dp.lmtd.toFixed(4)} / <b>${dp.FLMTD.toFixed(4)}</b></td>
      <td class="lbl">Balance Error</td><td>%</td>
      <td class="${dp.balErr>5?'hi-warn':'hi-ok'}">${dp.balErr.toFixed(3)}</td>
    </tr>
    <tr>
      <td class="lbl">Effectiveness ε</td><td>%</td><td>${(dp.eff*100).toFixed(2)}</td>
      <td class="lbl">NTU</td><td>—</td><td>${dp.NTU.toFixed(4)}</td>
    </tr>
  </tbody>
</table>
`:''}


${lm?`
<div class="sec ${(st||pl||ac||ff||dp)?'pg ':''}teal">📐 LMTD &amp; NTU Calculator — Results</div>
${(st||pl)?`<div style="text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8500a20"><span style="font-size:11pt;font-weight:900;background:linear-gradient(135deg,#e8500a,#0055c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">multicalci.com</span><span style="font-size:6.5pt;color:'#aaa';margin-left:8px">HeatXpert Pro · Heat Exchanger Design Datasheet</span></div>`:''}
<div class="kpi-strip">
  <div class="kpi r"><div class="kl">ΔT₁</div><div class="kv">${lm.dT1.toFixed(3)}<span class="ku"> ${T}</span></div></div>
  <div class="kpi b"><div class="kl">ΔT₂</div><div class="kv">${lm.dT2.toFixed(3)}<span class="ku"> ${T}</span></div></div>
  <div class="kpi t"><div class="kl">LMTD</div><div class="kv">${lm.lmtd.toFixed(4)}<span class="ku"> ${T}</span></div></div>
  <div class="kpi g"><div class="kl">F Correction</div><div class="kv">${lm.F.toFixed(4)}</div></div>
  <div class="kpi r"><div class="kl">F × LMTD</div><div class="kv">${lm.FLMTD.toFixed(4)}<span class="ku"> ${T}</span></div></div>
  <div class="kpi ${lm.eff>0.7?'ok':'warn'}"><div class="kl">Effectiveness ε</div><div class="kv">${lm.eff!=null?(lm.eff*100).toFixed(2):'—'}<span class="ku">%</span></div></div>
</div>
<table>
  <thead><tr><th>Parameter</th><th>Value</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td class="lbl">Hot side: T_in → T_out</td><td>${lm.hTi.toFixed(2)} → ${lm.hTo.toFixed(2)} °C</td><td>ΔT_hot = ${(lm.hTi-lm.hTo).toFixed(4)} ${T}</td></tr>
    <tr><td class="lbl">Cold side: T_in → T_out</td><td>${lm.cTi.toFixed(2)} → ${lm.cTo.toFixed(2)} °C</td><td>ΔT_cold = ${(lm.cTo-lm.cTi).toFixed(4)} ${T}</td></tr>
    <tr><td class="lbl">ΔT₁ / ΔT₂</td><td>${lm.dT1.toFixed(6)} / ${lm.dT2.toFixed(6)} ${T}</td><td>${lm.arr==='counter'?'T_h,in−T_c,out / T_h,out−T_c,in':'Parallel end differences'}</td></tr>
    <tr><td class="lbl">LMTD (log mean)</td><td>${lm.lmtd.toFixed(6)} ${T}</td><td>ΔT_LM = (ΔT₁−ΔT₂)/ln(ΔT₁/ΔT₂)</td></tr>
    <tr><td class="lbl">F correction factor</td><td>${lm.F.toFixed(6)}</td><td>${lm.arr} arrangement</td></tr>
    <tr><td class="lbl">Effective LMTD (F×LMTD)</td><td><b>${lm.FLMTD.toFixed(6)} ${T}</b></td><td>Use in: Q = U · A · F · ΔT_LM</td></tr>
    ${lm.eff!=null?`<tr><td class="lbl">Effectiveness ε</td><td>${(lm.eff*100).toFixed(4)} %</td><td>ε = Q_actual / Q_max</td></tr>`:''}
    ${lm.NTU!=null?`<tr><td class="lbl">NTU</td><td>${lm.NTU.toFixed(6)}</td><td>NTU = U·A/C_min</td></tr>`:''}
    ${lm.UA!=null?`<tr><td class="lbl">U·A product</td><td>${(lm.UA/1000).toFixed(4)} kW/K</td><td>Direct from NTU × C_min</td></tr>`:''}
    ${(lm.Cmin_kW!=null&&lm.NTU!=null&&lm.NTU>0)?`<tr><td class="lbl">C_min / C_max</td><td>${lm.Cmin_kW.toFixed(4)} / ${(lm.UA/lm.NTU/1000).toFixed(4)} kW/K</td><td>C_r = ${(Math.min(lm.Cmin_kW,(lm.UA/lm.NTU/1000))/Math.max(lm.Cmin_kW,(lm.UA/lm.NTU/1000))).toFixed(4)}</td></tr>`:''}
  </tbody>
</table>
`:''}


<div style="margin-top:10px;page-break-inside:avoid">
<div class="sec">📋 Engineering Notes &amp; References</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
  <div class="note-pdf">
    <b>Correlation Methods Used:</b><br>
    • Shell-side HTC: Bell-Delaware (1963) with TEMA correction factors (Jc, Jl, Jb, Jr)<br>
    • Tube-side HTC: Gnielinski (1976) — Turbulent | Sieder-Tate — Laminar | Interpolated — Transition<br>
    • Gas density: Pitzer virial / Peng-Robinson EOS (Z-factor corrected at T&amp;P)<br>
    • Fin-Fan: Robinson-Briggs (1966) j-factor | Schmidt fin efficiency<br>
    • Plate HX: Martin (1996) Nusselt correlation for chevron plates<br>
    • Tube ΔP: Darcy-Weisbach + entry/exit (Ke=0.5, Kx=1.0) + return bends (1.5/pass)
  </div>
  <div class="note-pdf warn">
    <b>⚠ Design Disclaimer:</b><br>
    Results are based on engineering correlations for <b>preliminary sizing only</b>.
    Accuracy: ±15–25% typical for heat transfer; ±20–30% for pressure drop.
    <br><br>
    All final designs must be verified by a qualified engineer and comply with:
    ASME Section VIII (pressure vessels) · TEMA (shell &amp; tube) · API 661 (air coolers)
    · EN 13445 (unfired pressure vessels) · local codes.
  </div>
</div>

<div class="note-pdf" style="margin-top:6px">
  <b>Typical U Values (W/m²K):</b>
  Water–Water: 800–2000 | Water–Light Oil: 150–500 | Gas–Liquid: 15–100 |
  Condensing Steam–Water: 1000–4000 | Air Cooled (extended area): 30–80 |
  Plate HX (L-L): 1000–6000 | Double Pipe: 200–800
</div>
</div>

<div class="ftr">
  <span style="font-weight:800;color:#0055c8;font-size:7pt">multicalci.com</span>
  <span style="font-size:6.5pt">HeatXpert Pro v7.0 — Professional Heat Exchanger Design &amp; Analysis</span>
  <span style="font-size:6.5pt">Generated: ${now} | For Engineering Review Only</span>
  <span>Rev A — Preliminary | For Engineering Review Only</span>
</div>

<\/body><\/html>`;

  // Write HTML directly into new window — blob URL onload is unreliable in Chrome
  const win=window.open('','_blank');
  if (!win) { alert('Pop-up blocked — please allow pop-ups for this site to generate PDF.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Wait for fonts/images to load, then trigger print dialog
  setTimeout(() => { try { win.focus(); win.print(); } catch(e) {} }, 900);
}

/* ══════════════════════════════════════════════════════════════════════════
   WALL THICKNESS CALCULATOR (ASME VIII Div. 1 UG-27 / EN 13445-3 Cl. 7)
   ══════════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════════
   HeatXpert Pro — Client-side JS (API-backed version)
   All calculations are performed server-side via /api/heatxpert
   This file handles: UI, form reads, API calls, result rendering
   ══════════════════════════════════════════════════════════════════════════ */

// Fix: Use absolute API URL so it works from any host (GitHub Pages, CDN, etc.)
// Replace 'your-project.vercel.app' with your actual Vercel deployment URL
const API_URL = (()=>{
  // If the page is served from the same Vercel deployment, use relative path
  if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('multicalci.com')) {
    return '/api/heatxpert';
  }
  // Otherwise (local dev, GitHub Pages, etc.) use the full Vercel URL
  return 'https://your-project.vercel.app/api/heatxpert'; // ← REPLACE with your actual URL
})();
// GAS_RHO_THRESHOLD defined above
let unitSys = 'metric';
let coldMode = 'flow';
let _apiPending = false;
let lastResults = {};

// ── Unit helpers (display only — server always uses SI) ──────────────────────
function tC(val)   { return unitSys==='imperial'?(val-32)*5/9:val; }
function tDisp(v)  { return unitSys==='imperial'?v*9/5+32:v; }
function mF(val)   { return unitSys==='imperial'?val/2.20462:val; }
function tU()      { return unitSys==='metric'?'°C':'°F'; }
function fU()      { return unitSys==='metric'?'kg/h':'lb/h'; }
function pU()      { return unitSys==='metric'?'bar':'psi'; }
function aU()      { return unitSys==='metric'?'m²':'ft²'; }
function hU()      { return unitSys==='metric'?'kW':'BTU/hr'; }
function uU()      { return unitSys==='metric'?'W/m²·K':'BTU/hr·ft²·°F'; }
function convQ(kw) { return unitSys==='imperial'?kw*3412.14:kw; }
function convA(m2) { return unitSys==='imperial'?m2*10.7639:m2; }
function convP(b)  { return unitSys==='imperial'?b*14.504:b; }
function convU(w)  { return unitSys==='imperial'?w*0.17611:w; }

// ═══════════════════════════════════════════════════════════════════
// PER-FIELD UNIT CONVERSION FUNCTIONS
// Each reads the unit selector for that field and converts to SI.
// The API always receives SI values (°C, bar, kg/h, mm for dims).
// ═══════════════════════════════════════════════════════════════════

// Conversion factors to SI
const PRES_TO_BAR = { bar:1, kpa:0.01, mpa:10, psi:0.0689476, kgcm2:0.980665 };
const TEMP_OFFSETS = { c:[1,0], f:[5/9,-32*5/9], k:[1,-273.15] };
const DIM_TO_MM = { mm:1, cm:10, 'in':25.4 };
const LEN_TO_M = { m:1, ft:0.3048 };

function getPresVal(inputId) {
  const raw = parseFloat(g(inputId)?.value) || 0;
  const unit = g(inputId+'_usel')?.value || 'bar';
  return raw * (PRES_TO_BAR[unit] || 1);
}
function getTempVal(inputId) {
  const raw = parseFloat(g(inputId)?.value);
  if (isNaN(raw)) return NaN;
  const unit = g(inputId+'_usel')?.value || 'c';
  const [m,b] = TEMP_OFFSETS[unit] || [1,0];
  return raw * m + b;
}
function getDimMm(inputId) {
  const raw = parseFloat(g(inputId)?.value) || 0;
  const unit = g(inputId+'_usel')?.value || 'mm';
  return raw * (DIM_TO_MM[unit] || 1);
}
function getLenM(inputId) {
  const raw = parseFloat(g(inputId)?.value) || 0;
  const unit = g(inputId+'_usel')?.value || 'm';
  return raw * (LEN_TO_M[unit] || 1);
}
function getFlowKgh(inputId) {
  const raw = parseFloat(g(inputId)?.value) || 0;
  if (unitSys === 'imperial') return raw / 2.20462;
  return raw;
}

// When SI/US global toggle fires, also flip all individual selectors
const _origSetUnit = setUnit;
function setUnit(sys, btn) {
  unitSys = sys;
  document.querySelectorAll('.unit-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  updateAllUnitLabels();
  // Flip all temp selectors
  document.querySelectorAll('.u-temp-sel').forEach(sel=>{
    sel.value = sys==='metric' ? 'c' : 'f';
  });
  // Flip all pressure selectors
  document.querySelectorAll('.u-pres-sel, .u-pdrop-sel').forEach(sel=>{
    sel.value = sys==='metric' ? 'bar' : 'psi';
  });
  // Flip flow labels
  document.querySelectorAll('.u-flow-l').forEach(el=>{
    el.textContent = sys==='metric' ? 'kg/h' : 'lb/h';
  });
  // Flip length selectors
  document.querySelectorAll('.u-len-sel').forEach(sel=>{
    sel.value = sys==='metric' ? 'm' : 'ft';
  });
}

// onchange callbacks for individual selectors
function onPresUnitChange(baseId, unit) {
  // Just visual — conversion happens at submit via getPresVal()
}
function onTempUnitChange(baseId, unit) {
  // Just visual — conversion happens at submit via getTempVal()
}
function onDimUnitChange2(baseId, unit) {
  // Just visual — conversion happens at submit via getDimMm()
}
function onLenUnitChange(baseId, unit) {
  // Just visual — conversion happens at submit via getLenM()
}

// ── Core API call ────────────────────────────────────────────────────────────
async function callAPI(payload) {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || 'API error ' + resp.status);
  }
  return resp.json();
}

// ── UI helpers ───────────────────────────────────────────────────────────────
function v(id)      { return parseFloat(document.getElementById(id).value); }
function g(id)      { return document.getElementById(id); }
function showErr(pfx, msg) {
  const _spin=document.getElementById(pfx+'_spin'); if(_spin) _spin.classList.remove('show');
  const _ph=document.getElementById(pfx+'_ph'); if(_ph) _ph.style.display='';
  const el = document.getElementById(pfx+'_err');
  if (el) {
    // Error boxes use <span id="pfx_err_txt"> for the message text
    const txtEl = document.getElementById(pfx+'_err_txt');
    if (txtEl) txtEl.textContent = msg;
    else el.textContent = msg;
    el.classList.add('show');
  } else alert(msg);
  _apiPending = false;
}
function hideErr(pfx) {
  const el = document.getElementById(pfx+'_err');
  if (el) el.classList.remove('show');
}
function startCalc(pfx) {
  _apiPending = true;
  hideErr(pfx);
  const _ph2=document.getElementById(pfx+'_ph'); if(_ph2) _ph2.style.display='none';
  const _spin2=document.getElementById(pfx+'_spin'); if(_spin2) _spin2.classList.add('show');
  const res = document.getElementById(pfx+'_res');
  if (res) res.classList.remove('show');
}
// ── Space-Constrained Geometry Optimizer ──────────────────────────────────────
async function runGeoOptimizer(area_req, massC_kgs, L_fixed, rho_c, target_vel) {
  const el = document.getElementById('geo-optimizer-results');
  if (!el) return;
  el.innerHTML = '<div style="color:var(--t3);font-size:.82rem;padding:8px 0">🔍 Searching configurations…</div>';
  try {
    const resp = await fetch('/api/heatxpert', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        calcType:'geoOptimizer',
        area_req, massC_kgs, L_fixed, rho_c, target_vel,
        vel_min: 0.8, vel_max: 3.5, max_passes: 8, max_shells: 3
      })
    });
    const data = await resp.json();
    if (data.error) { el.innerHTML = `<div style="color:var(--err);font-size:.82rem">${data.error}</div>`; return; }

    const valid   = data.solutions_valid   || [];
    const partial = data.solutions_partial || [];

    const scoreColor = v => v >= target_vel*0.95 && v <= target_vel*1.3 ? 'var(--ok)'
                          : v >= 0.8 ? 'var(--warn)' : 'var(--err)';

    const renderRow = (s, rank) => `
      <tr style="${rank===0?'background:var(--teal-lt)':''}">
        <td style="font-weight:700;color:${rank===0?'var(--teal)':'var(--t1)'}">${rank===0?'⭐ Best':'#'+(rank+1)}</td>
        <td style="font-weight:700">${s.od_mm} mm</td>
        <td style="font-weight:700">${s.nPasses}</td>
        <td>${s.nShells > 1 ? s.nShells+' × series' : '1'}</td>
        <td>${s.numTubes} <span style="font-size:.7rem;color:var(--t3)">(${s.nTubesPerPass}/pass)</span></td>
        <td style="font-weight:700;color:${scoreColor(s.velocity)}">${s.velocity} m/s</td>
        <td style="color:var(--ok)">+${s.area_margin_pct}%</td>
        <td><button onclick="applyGeoSolution(${s.od_mm},${s.nPasses},${s.nShells},${s.numTubes})"
          style="font-size:.7rem;padding:3px 10px;border:none;border-radius:5px;background:var(--blue);color:#fff;cursor:pointer;font-weight:700">Apply</button></td>
      </tr>`;

    el.innerHTML = `
      <div style="margin-top:6px">
        <div style="font-size:.8rem;font-weight:700;color:#7c3aed;margin-bottom:6px">
          ${data.any_solution
            ? `✅ ${valid.length} solution(s) found — ${data.recommendation}`
            : `⚠ No perfect solution found. Closest partial options shown.`}
        </div>
        <div style="overflow-x:auto">
          <table class="dtbl" style="font-size:.78rem">
            <thead><tr>
              <th>Rank</th><th>Tube OD</th><th>Passes</th><th>Shells</th>
              <th>Tubes</th><th>Velocity</th><th>Area margin</th><th>Action</th>
            </tr></thead>
            <tbody>
              ${valid.map((s,i)=>renderRow(s,i)).join('')}
              ${!data.any_solution ? partial.map((s,i)=>renderRow(s,i)).join('') : ''}
            </tbody>
          </table>
        </div>
        <div style="font-size:.7rem;color:var(--t3);margin-top:6px">
          * Area requirement: ${area_req.toFixed(2)} m² | L fixed: ${L_fixed} m | Target velocity: ${target_vel} m/s |
          Vel range: 0.8–3.5 m/s | Max ${data.solutions_valid?.length||0}+${data.solutions_partial?.length||0} configs evaluated
        </div>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--err);font-size:.82rem">Optimizer error: ${e.message}</div>`;
  }
}

function applyGeoSolution(od_mm, nPasses, nShells, numTubes) {
  var g = function(id) { return document.getElementById(id); };
  var odField      = g('st_od');
  var typeField    = g('st_type');
  var velModeField = g('st_velMode');
  var hxMap = {1:'1-1', 2:'1-2', 4: nShells>=2 ? '2-4' : '1-4', 6:'1-6', 8:'1-4'};
  if (odField)      odField.value      = od_mm;
  if (typeField)    typeField.value    = hxMap[nPasses] || '1-2';
  if (velModeField) velModeField.value = 'target';
  onVelModeChange();
  showToast('✅ Geometry applied — recalculating…');
  setTimeout(function() {
    var calcBtn = document.querySelector('#tab-st .btn-calc');
    if (calcBtn) calcBtn.click();
    var res = document.getElementById('st_res');
    if (res) res.scrollIntoView({behavior:'smooth', block:'start'});
  }, 150);
}

function applyAdvisorLever(lever, newL, newPasses, newShells, newTubes, newOD_mm, newTW_mm) {
  var g = function(id) { return document.getElementById(id); };

  var hTi = parseFloat((g('st_hTi') || {}).value);
  var hTo  = parseFloat((g('st_hTo') || {}).value);
  var cTi  = parseFloat((g('st_cTi') || {}).value);
  if (!isFinite(hTi) || !isFinite(hTo) || !isFinite(cTi) || hTo >= hTi) {
    showToast('⚠ Check temperatures before applying — hot outlet must be below hot inlet');
    return;
  }

  var typeField    = g('st_type');
  var lenField     = g('st_len');
  var odField      = g('st_od');
  var twField      = g('st_tw');
  var velModeField = g('st_velMode');
  var hxMap = {1:'1-1', 2:'1-2', 4:'1-4', 6:'1-6', 8:'1-4'};

  if (lever === 'A') {
    if (newL != null && lenField) lenField.value = newL;
    if (velModeField) velModeField.value = 'target';
    onVelModeChange();
  }

  if (lever === 'B') {
    if (newPasses != null && typeField) {
      typeField.value = hxMap[newPasses] || '1-4';
    }
    if (velModeField) velModeField.value = 'target';
    onVelModeChange();
  }

  if (lever === 'C') {
    if (newShells != null && typeField) {
      typeField.value = newShells >= 2 ? '2-4' : '1-2';
    }
    if (velModeField) velModeField.value = 'target';
    onVelModeChange();
    if (newShells > 2) {
      showToast('ℹ️ Note: form supports up to 2 shells. For ' + newShells + ' shells, apply twice.');
      return;
    }
  }

  if (lever === 'D') {
    if (newOD_mm != null && odField) odField.value = newOD_mm;
    if (newTW_mm != null && twField)  twField.value = newTW_mm;
    if (velModeField) velModeField.value = 'target';
    onVelModeChange();
  }

  if (lever === 'E') {
    if (newL != null && lenField)    lenField.value = newL;
    if (newPasses != null && typeField) {
      typeField.value = hxMap[newPasses] || '1-4';
    }
    if (velModeField) velModeField.value = 'target';
    onVelModeChange();
  }

  var leverNames = {
    A: 'Tube length updated',
    B: 'Pass count updated',
    C: 'Shells in series applied',
    D: 'Tube OD updated',
    E: 'Combined length + passes applied'
  };
  showToast('✅ ' + (leverNames[lever] || 'Applied') + ' — recalculating…');

  setTimeout(function() {
    var calcBtn = document.querySelector('#tab-st .btn-calc');
    if (calcBtn) calcBtn.click();
    var res = document.getElementById('st_res');
    if (res) res.scrollIntoView({behavior:'smooth', block:'start'});
  }, 150);
}


function showRes(pfx, html) {
  document.getElementById(pfx+'_spin').classList.remove('show');
  const res = document.getElementById(pfx+'_res');
  if (res) { res.innerHTML=html; res.classList.add('show'); }
  _apiPending = false;
}
function resetForm(pfx) {
  const formMap={st:'stForm',pl:'plForm',ac:'acForm',dp:'dpForm',ff:'ffForm'};
  const form=document.getElementById(formMap[pfx]);
  if(form) form.reset();
  const res=document.getElementById(pfx+'_res');
  if(res){res.innerHTML='';res.classList.remove('show');}
  hideErr(pfx);
  const ph=document.getElementById(pfx+'_ph');
  if(ph) ph.style.display='';
}
function switchTab(id,btn){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  if(btn) btn.classList.add('active');
}
function updateAllUnitLabels(){
  // data-unit-metric / data-unit-imperial generic labels
  document.querySelectorAll('[data-unit-metric]').forEach(el=>{
    el.textContent=unitSys==='metric'?el.dataset.unitMetric:el.dataset.unitImperial;
  });
  // Temperature labels
  document.querySelectorAll('.u-temp-l').forEach(el=>{
    const sel=el.closest('.irow')?.querySelector('.u-temp-sel');
    if(!sel) el.textContent=unitSys==='metric'?'°C':'°F';
  });
  // Simple flow labels (no dropdown — air cooled, fin-fan)
  document.querySelectorAll('.u-flow-l').forEach(el=>{
    el.textContent=unitSys==='metric'?'kg/h':'lb/h';
  });
  // Pressure labels (bar / psi)
  document.querySelectorAll('.u-pres-l').forEach(el=>{
    el.textContent=unitSys==='metric'?'bar a':'psia';
  });
  // Pressure allowable labels (bar / psi)
  document.querySelectorAll('.u-pdrop-l').forEach(el=>{
    el.textContent=unitSys==='metric'?'bar':'psi';
  });
  // Length labels (m / ft) — tube length etc
  document.querySelectorAll('.u-len-l').forEach(el=>{
    el.textContent=unitSys==='metric'?'m':'ft';
  });
  // Dimension labels mm/in driven by per-field dropdown (u-dim-sel)
  // These are handled by their own onchange. No bulk update needed.
}

// ── Per-input unit conversion helpers ────────────────────────────────────────
// Called by pressure unit selectors
function convInputPres(inputId, selId) {
  const sel=g(selId), inp=g(inputId);
  if(!sel||!inp) return;
  const val=parseFloat(inp.value)||0;
  const unit=sel.value;
  // Convert displayed value → bar_a for storage; display in chosen unit
  // We store nothing; just update the ulab text
  g(selId+'_lbl') && (g(selId+'_lbl').textContent=unit);
}

// Called when dimension unit selector changes (mm / cm / in)
function onDimUnitChange(selId, labId) {
  const sel=g(selId); if(!sel) return;
  if(g(labId)) g(labId).textContent=sel.value;
}

// ── Fluid selector ───────────────────────────────────────────────────────────
const FP_NAMES = {
  water:'Water',brine_nacl:'Brine NaCl 25%',ethylene_glycol_30:'Ethylene Glycol 30%',
  crude_oil_light:'Crude Oil (Light)',crude_oil_heavy:'Crude Oil (Heavy)',diesel:'Diesel',
  kerosene:'Kerosene',fuel_oil:'Fuel Oil',lube_oil:'Lubricating Oil',thermal_oil:'Thermal Oil',
  benzene:'Benzene',toluene:'Toluene',air:'Air',nitrogen:'Nitrogen',natural_gas:'Natural Gas',
  methane:'Methane',co2:'Carbon Dioxide',steam:'Steam',ammonia_gas:'Ammonia Gas',
  ammonia_liquid:'Ammonia (Liquid)',ethanol:'Ethanol',methanol:'Methanol',acetone:'Acetone',
  sulfuric_acid_98:'Sulfuric Acid 98%',hcl_32:'HCl 32%',naoh_50:'NaOH 50%',
  r134a:'R-134a',r410a:'R-410A',milk:'Milk',beer:'Beer',dowtherm:'Dowtherm A'
};
function buildFluidOptions() {
  const groups={
    'Common Liquids':['water','brine-nacl','brine-cacl2','ethylene-glycol-30','ethylene-glycol-50','propylene-glycol-30','propylene-glycol-50'],
    'Hydrocarbons':['crude-oil-light','crude-oil-heavy','diesel','gasoline','kerosene','fuel-oil','lube-oil','hydraulic-oil','thermal-oil'],
    'Aromatics':['benzene','toluene','xylene'],
    'Gases':['air','nitrogen','oxygen','hydrogen','natural-gas','methane','co2','steam','ammonia-gas'],
    'Chemicals':['ammonia-liquid','ethanol','methanol','acetone','sulfuric-acid-98','sulfuric-acid-75','nitric-acid-68','hcl-32','naoh-50','naoh-25','acetic-acid'],
    'Refrigerants':['r134a','r410a','r717'],
    'Food/Process':['milk','juice','beer','sugar-solution'],
    'Special':['molten-salt','dowtherm','mercury','sodium']
  };
  let html='';
  for(const [grp,keys] of Object.entries(groups)){
    html+=`<optgroup label="${grp}">`;
    for(const k of keys){
      const name = k.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      html+=`<option value="${k}">${name}</option>`;
    }
    html+='</optgroup>';
  }
  // Fix: HTML uses data-fluid attribute, not .fluid-sel class
  document.querySelectorAll('[data-fluid]').forEach(s=>{ s.innerHTML=html; });
}

// Fix Bug 2: fluidChange was called but never defined
function fluidChange(id) {
  // Placeholder — fluid properties are resolved server-side.
  // Optionally update gas pressure tag hints here.
  const sel = g(id);
  if (!sel) return;
  const gasKeys = ['air','nitrogen','oxygen','hydrogen','natural-gas','methane','co2','steam','ammonia-gas'];
  const isGas = gasKeys.includes(sel.value);
  // Show/hide gas pressure hints if the tag element exists
  const tagMap = { 'st_hFl':'st_hPgasTag','st_cFl':'st_cPgasTag' };
  const tagEl = g(tagMap[id]);
  if (tagEl) tagEl.textContent = isGas ? '⚗ gas — P matters' : '';
}

// Fix Bug 4: updateVelHint was called but never defined
function updateVelHint() {
  const vel = parseFloat((g('st_targetVel')||{value:'1.5'}).value) || 1.5;
  const el = g('st_velHint');
  if (!el) return;
  const isGas = vel >= 5;
  el.textContent = isGas
    ? `✓ Target: ${vel} m/s → gas/vapour velocity range`
    : `✓ Target: ${vel} m/s → auto-calculating required tube passes`;
}

// Fix Bug 5: live preview stubs for plate and double-pipe cold side
function plUpdateColdOutlet() {
  if (g('pl_coldMode') && g('pl_coldMode').value === 'flow') {
    // Estimate cold outlet from energy balance for display only
    try {
      const hTi = parseFloat(g('pl_hTi').value)||0;
      const hTo = parseFloat(g('pl_hTo').value)||0;
      const hF  = parseFloat(g('pl_hF').value)||1;
      const cTi = parseFloat(g('pl_cTi').value)||0;
      const cF  = parseFloat(g('pl_cF').value)||1;
      // Rough: assume same cp → ΔTc = (hF/cF)*(hTi-hTo)
      const dTc = (hF / cF) * (hTi - hTo);
      const cTo = cTi + Math.abs(dTc);
      if (g('pl_cTo_disp')) g('pl_cTo_disp').value = cTo.toFixed(1);
      if (g('pl_cTo_lbl'))  g('pl_cTo_lbl').textContent = `Estimated (server will compute exactly)`;
    } catch(e) {}
  }
}
function plUpdateColdFlow() {
  if (g('pl_coldMode') && g('pl_coldMode').value === 'temp') {
    try {
      const hTi = parseFloat(g('pl_hTi').value)||0;
      const hTo = parseFloat(g('pl_hTo').value)||0;
      const hF  = parseFloat(g('pl_hF').value)||1;
      const cTi = parseFloat(g('pl_cTi').value)||0;
      const cTo = parseFloat(g('pl_cTo').value)||1;
      const dTc = cTo - cTi; if (dTc <= 0) return;
      const cF = hF * (hTi - hTo) / dTc;
      if (g('pl_cF_disp')) g('pl_cF_disp').value = Math.abs(cF).toFixed(0);
      if (g('pl_cF_lbl'))  g('pl_cF_lbl').textContent = `Estimated kg/h`;
    } catch(e) {}
  }
}
function dpUpdateColdOutlet() {
  if (g('dp_coldMode') && g('dp_coldMode').value === 'flow') {
    try {
      const hTi = parseFloat(g('dp_hTi').value)||0;
      const hTo = parseFloat(g('dp_hTo').value)||0;
      const hF  = parseFloat(g('dp_hF').value)||1;
      const cTi = parseFloat(g('dp_cTi').value)||0;
      const cF  = parseFloat(g('dp_cF').value)||1;
      const dTc = (hF / cF) * (hTi - hTo);
      const cTo = cTi + Math.abs(dTc);
      if (g('dp_cTo_disp')) g('dp_cTo_disp').value = cTo.toFixed(1);
    } catch(e) {}
  }
}
function dpUpdateColdFlow() {
  if (g('dp_coldMode') && g('dp_coldMode').value === 'temp') {
    try {
      const hTi = parseFloat(g('dp_hTi').value)||0;
      const hTo = parseFloat(g('dp_hTo').value)||0;
      const hF  = parseFloat(g('dp_hF').value)||1;
      const cTi = parseFloat(g('dp_cTi').value)||0;
      const cTo = parseFloat(g('dp_cTo').value)||1;
      const dTc = cTo - cTi; if (dTc <= 0) return;
      const cF = hF * (hTi - hTo) / dTc;
      if (g('dp_cF_disp')) g('dp_cF_disp').value = Math.abs(cF).toFixed(0);
    } catch(e) {}
  }
}

// ── Flow unit handling ───────────────────────────────────────────────────────
function getFlowKgH_client(inputId, unitSelId) {
  const val = parseFloat(g(inputId).value) || 0;
  const unit = g(unitSelId) ? g(unitSelId).value : 'kgh';
  // For non-kgh units, let server handle the conversion
  // We just pass val and unit to server
  return { val, unit };
}
function updateFlowUnit(selId,labId){
  const u=g(selId)?g(selId).value:'kgh';
  const lbl=g(labId);
  if(lbl) lbl.textContent=u==='kgh'?'kg/h':u==='nm3h'?'Nm³/h':'Sm³/h';
}

// ── Cold mode logic ──────────────────────────────────────────────────────────
function setColdMode(mode){
  coldMode=mode;
  const flowBtn = g('coldModeFlowBtn'), tempBtn = g('coldModeTempBtn');
  if (flowBtn) { flowBtn.style.background = mode==='flow' ? 'var(--teal)' : 'transparent'; flowBtn.style.color = mode==='flow' ? '#fff' : 'var(--teal)'; }
  if (tempBtn) { tempBtn.style.background = mode==='temp' ? 'var(--teal)' : 'transparent'; tempBtn.style.color = mode==='temp' ? '#fff' : 'var(--teal)'; }
  const hint = g('coldModeHint');
  if (hint) hint.innerHTML = mode==='flow'
    ? '✅ <strong>Mode: Know Flow Rate</strong> — enter cold flow rate; outlet temp will be auto-calculated from Q<sub>hot</sub> = Q<sub>cold</sub>.'
    : '✅ <strong>Mode: Know Outlet Temp</strong> — enter cold outlet temp; flow rate will be auto-calculated.';
  const cToEl = g('st_cTo'), cFEl = g('st_cF');
  if (cToEl) { cToEl.readOnly = mode==='flow'; cToEl.style.borderStyle = mode==='flow' ? 'dashed' : 'solid'; cToEl.style.color = mode==='flow' ? 'var(--t3)' : 'var(--t1)'; }
}

// ── Hot-side flow/temp mode ───────────────────────────────────────────────────
// Hot side: always uses known hTi, hTo, hF — no toggle needed
function hotBalancePreview() { coldBalancePreview(); }
function plToggleColdMode(){
  const mode=g('pl_coldMode').value;
  const showFlow=mode==='flow';
  const plcFgrp=g('pl_cF_grp');   if(plcFgrp)   plcFgrp.style.display   =showFlow?'':'none';
  const plcTocalc=g('pl_cTo_calc');if(plcTocalc) plcTocalc.style.display =showFlow?'':'none';
  const plcTogrp=g('pl_cTo_grp'); if(plcTogrp)  plcTogrp.style.display  =showFlow?'none':'';
  const plcFcalc=g('pl_cF_calc'); if(plcFcalc)  plcFcalc.style.display  =showFlow?'none':'';
}
function dpToggleColdMode(){
  const mode=g('dp_coldMode').value;
  const showFlow=mode==='flow';
  const dpcFgrp=g('dp_cF_grp');   if(dpcFgrp)   dpcFgrp.style.display   =showFlow?'':'none';
  const dpcTocalc=g('dp_cTo_calc');if(dpcTocalc) dpcTocalc.style.display =showFlow?'':'none';
  const dpcTogrp=g('dp_cTo_grp'); if(dpcTogrp)  dpcTogrp.style.display  =showFlow?'none':'';
  const dpcFcalc=g('dp_cF_calc'); if(dpcFcalc)  dpcFcalc.style.display  =showFlow?'none':'';
}

// ── Cold flow/outlet live preview ─────────────────────────────────────────────
function coldBalancePreview(){} // simplified — handled server-side
function autoTubeSpecs(){}     // simplified — client hint only

// ── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function openShareModal(){openModal('shareModal');}
function openCompareModal(){openModal('compareModal');}
function shareOn(platform){
  const url=encodeURIComponent(window.location.href);
  const text=encodeURIComponent('🔧 HeatXpert Pro — Free Heat Exchanger Design Tool #ProcessEngineering');
  const urls={twitter:`https://twitter.com/intent/tweet?text=${text}&url=${url}`,linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${url}`,whatsapp:`https://api.whatsapp.com/send?text=${text}%20${url}`};
  if(urls[platform]) window.open(urls[platform],'_blank');
}
function copyShareLink(){
  navigator.clipboard.writeText(window.location.href).then(()=>showToast('Link copied!'));
}
function shareResult(type,summaryText){
  const text=encodeURIComponent(`📊 HeatXpert Pro — ${summaryText}\n🔧 multicalci.com #ProcessEngineering`);
  window.open('https://twitter.com/intent/tweet?text='+text,'_blank');
}
function showToast(msg){
  const t=document.getElementById('toastEl');
  if(!t)return;
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// ── Tube standard selector ────────────────────────────────────────────────────
const TUBE_STANDARDS = {
  // value: [OD_mm, WT_mm]
  'tema_12.7_1.2':    [12.7,  1.2],
  'tema_15.88_1.2':   [15.88, 1.2],
  'tema_19.05_1.6':   [19.05, 1.6],
  'tema_25.4_2.0':    [25.4,  2.0],
  'tema_31.75_2.0':   [31.75, 2.0],
  'tema_38.1_2.6':    [38.1,  2.6],
  'tema_50.8_3.0':    [50.8,  3.0],
  'bwg_19.05_bwg14':  [19.05, 2.11],
  'bwg_19.05_bwg16':  [19.05, 1.65],
  'bwg_25.4_bwg14':   [25.4,  2.11],
  'bwg_25.4_bwg16':   [25.4,  1.65],
  'bwg_25.4_bwg18':   [25.4,  1.24],
  'bwg_31.75_bwg14':  [31.75, 2.11],
  'bwg_38.1_bwg12':   [38.1,  2.77],
  'ansi_21.3_sch40':  [21.3,  2.77],
  'ansi_26.67_sch40': [26.67, 2.87],
  'ansi_33.4_sch40':  [33.4,  3.38],
  'ansi_42.16_sch40': [42.16, 3.56],
  'ansi_26.67_sch80': [26.67, 3.91],
  'ansi_33.4_sch80':  [33.4,  4.55],
  'din_20_2':         [20.0,  2.0],
  'din_25_2':         [25.0,  2.0],
  'din_25_2.5':       [25.0,  2.5],
  'din_30_2':         [30.0,  2.0],
  'din_38_2.5':       [38.0,  2.5],
};

function onTubeStdChange() {
  const sel = g('st_tube_std');
  if (!sel || !sel.value) return;
  const spec = TUBE_STANDARDS[sel.value];
  if (!spec) return;
  const [od, tw] = spec;
  const idField = g('st_od'), twField = g('st_tw');
  if (idField) {
    idField.value = od;
    // Clear manual override tag
    const tag = g('odAutoTag');
    if (tag) { tag.textContent = '(standard)'; tag.style.color = 'var(--teal)'; }
  }
  if (twField) twField.value = tw;
  // Update ID and ratio display
  updateTubeIdDisplay(od, tw);
  autoTubeSpecs();
}

function updateTubeIdDisplay(od_mm, tw_mm) {
  const id_mm = od_mm - 2 * tw_mm;
  const ratio  = (tw_mm / od_mm * 100).toFixed(1);
  const idEl   = g('st_tube_id_display');
  const ratioEl = g('st_tube_ratio_display');
  if (idEl)    idEl.textContent   = id_mm.toFixed(1) + ' mm';
  if (ratioEl) ratioEl.textContent = ratio + '%';
}

// Update display whenever OD or WT fields change manually
function onTubeGeomChange() {
  const od = parseFloat(g('st_od')?.value) || 25.4;
  const tw = parseFloat(g('st_tw')?.value) || 2.0;
  updateTubeIdDisplay(od, tw);
  // Reset standard selector if user overrides manually
  const sel = g('st_tube_std');
  if (sel) {
    const spec = TUBE_STANDARDS[sel.value];
    if (!spec || spec[0] !== od || spec[1] !== tw) sel.value = '';
  }
  autoTubeSpecs();
}
function onVelModeChange(){
  const mode=(g('st_velMode')||{value:'target'}).value;
  const tgt=g('st_targetVel_row'), fix=g('st_numTubesFixed_row');
  if(tgt) tgt.style.display=mode==='target'?'':'none';
  if(fix) fix.style.display=mode==='fixedtubes'?'':'none';
}
function applyVelPreset(){
  const p=g('st_velPreset'); if(!p) return;
  const vals={liquid_low:0.5,liquid_std:1.5,liquid_high:3.0,gas_low:10,gas_std:20,gas_high:30};
  const el=g('st_targetVel');
  if(el&&vals[p.value]) el.value=vals[p.value];
}

// ── SHELL & TUBE ─────────────────────────────────────────────────────────────
document.getElementById('stForm').addEventListener('submit', async function(e){
  e.preventDefault(); if(_apiPending) return; hideErr('st');
  startCalc('st');
  try {
    // Send raw values + unitSys — server handles all unit conversion
    const hFlKey=g('st_hFl').value, cFlKey=g('st_cFl').value;
    const hTi=getTempVal('st_hTi'), hTo=getTempVal('st_hTo'), cTi=getTempVal('st_cTi');
    const hPop=getPresVal('st_hPop'), cPop=getPresVal('st_cPop');
    const hFraw = parseFloat(g('st_hF').value)||0;
    const hFunit=(g('st_hFunit')||{value:'kgh'}).value;

    let cFraw=0, cToVal=0;
    if(coldMode==='flow'){
      cFraw=parseFloat(g('st_cF').value)||0;
      if(unitSys==='imperial') cFraw=cFraw/2.20462;
    } else {
      cToVal=getTempVal('st_cTo');
    }

    const payload = {
      calcType:'shellTube', unitSys:'metric',
      hFlKey, cFlKey, hPop, cPop,
      hTi, hTo, cTi, hF: hFraw, hFunit,
      coldMode, cF: cFraw, cTo: cToVal,
      OD: getDimMm('st_od'), tw: getDimMm('st_tw'), L: getLenM('st_len'),
      pitch: v('st_pitch'),
      Rfo: parseFloat(g('st_foulS').value)||0.0002,
      Rfi: parseFloat(g('st_foulT').value)||0.0002,
      arr: g('st_flow').value,
      mat: g('st_mat').value,
      hxType: g('st_type').value,
      tema: g('st_tema').value,
      bcut: parseFloat(g('st_bcut').value)/100||0.25,
      bsp: parseFloat(g('st_bsp').value)||0.50,
      velMode: (g('st_velMode')||{value:'target'}).value,
      targetVel: parseFloat(g('st_targetVel').value)||1.5,
      pdAllowShell: getPresVal('st_pdAllowShell'),
      pdAllowTube: getPresVal('st_pdAllowTube'),
      pitchLayout: (g('st_pitchlayout')||{value:'triangular'}).value,
      numTubesFixed: parseInt(g('st_numTubesFixed')||{value:'0'}).value||0,
      shellMode: (g('st_shellMode')||{value:'single-phase'}).value,
      L_max:        parseFloat(g('st_L_max')?.value) || undefined,
      shell_OD_max: parseFloat(g('st_shell_OD_max')?.value) || undefined,
    };
    const r = await callAPI(payload);
    if (r.error) return showErr('st', r.error);
    lastResults.st = r;
    // Update computed cold outlet/flow in form
    if(coldMode==='flow' && g('st_cTo')) {
      const tUnit = g('st_cTo_usel')?.value || 'c';
      const dispVal = tUnit==='f' ? r.cTo*9/5+32 : tUnit==='k' ? r.cTo+273.15 : r.cTo;
      g('st_cTo').value = dispVal.toFixed(2);
    }
    else if(coldMode==='temp' && g('st_cF')) g('st_cF').value = r.cF.toFixed(1);
    showRes('st', renderSTResults(r, r.warns||[]));
  } catch(err) { showErr('st', err.message); }
});

// ── PLATE HX ──────────────────────────────────────────────────────────────────
document.getElementById('plForm').addEventListener('submit', async function(e){
  e.preventDefault(); if(_apiPending) return; hideErr('pl');
  startCalc('pl');
  try {
    const hFlKey=g('pl_hFl').value, cFlKey=g('pl_cFl').value;
    const hTi=getTempVal('pl_hTi'), hTo=getTempVal('pl_hTo'), cTi=getTempVal('pl_cTi');
    const hPop=getPresVal('pl_hPop'), cPop=getPresVal('pl_cPop');
    const hF=parseFloat(g('pl_hF').value)||0;
    const plColdMode=g('pl_coldMode').value;
    let cToVal=0, cFval=0;
    if(plColdMode==='temp') cToVal=getTempVal('pl_cTo');
    else { cFval=parseFloat(g('pl_cF').value)||0; if(unitSys==='imperial') cFval/=2.20462; }
    const payload = {
      calcType:'plate', unitSys:'metric', hFlKey, cFlKey, hPop, cPop,
      hTi, hTo, cTi, hF, coldMode:plColdMode, cTo:cToVal, cF:cFval,
      th: v('pl_th'), angle: v('pl_angle'), gap: v('pl_gap'),
      pw: v('pl_width'), plen: v('pl_plen'), phi: parseFloat((g('pl_phi')||{value:'1.17'}).value)||1.17,
      mat: g('pl_mat').value,
      foul: parseFloat((g('pl_foul')||{value:'0.0002'}).value)||0.0002,
      pdAllowH: getPresVal('pl_pdH'),
      pdAllowC: getPresVal('pl_pdC'),
    };
    const r = await callAPI(payload);
    if (r.error) return showErr('pl', r.error);
    lastResults.pl = r;
    if(plColdMode==='flow' && g('pl_cTo_disp')) {
      const tUnit = g('pl_cTo_usel')?.value || 'c';
      const dispVal = tUnit==='f' ? r.cTo*9/5+32 : tUnit==='k' ? r.cTo+273.15 : r.cTo;
      g('pl_cTo_disp').value = dispVal.toFixed(2);
    }
    showRes('pl', renderPlateResults(r));
  } catch(err) { showErr('pl', err.message); }
});

// ── AIR COOLED ────────────────────────────────────────────────────────────────
document.getElementById('acForm').addEventListener('submit', async function(e){
  e.preventDefault(); if(_apiPending) return; hideErr('ac');
  startCalc('ac');
  try {
    const Ti=getTempVal('ac_Ti'), To=getTempVal('ac_To');
    let F_=parseFloat(g('ac_F').value)||0;
    if(unitSys==='imperial') F_=F_/2.20462;
    const payload = {
      calcType:'airCooled', unitSys:'metric', flKey: g('ac_Fl').value,
      Ti, To, F: F_, Tamb: getTempVal('ac_amb'), dTa: v('ac_dTa'),
      rows: v('ac_rows'), bayW: v('ac_bayW'),
      nTubes: parseInt(g('ac_nTubes').value)||40,
      tubeLen: parseFloat(g('ac_tubeLen').value)||6,
      tubeOD: parseFloat(g('ac_tubeOD').value)||25.4,
      tubeID: parseFloat(g('ac_tubeID').value)||20.0,
      finH:   parseFloat(g('ac_finH').value)||12.5,
      finThk: parseFloat(g('ac_finThk').value)||0.4,
      finDens:parseFloat(g('ac_finDens').value)||394,
      pitchT: parseFloat(g('ac_pitchT').value)||63.5,
      Rfo:    parseFloat(g('ac_Rfo').value)||0.0002,
      fmat: g('ac_fmat').value, fpm: v('ac_fpm'),
      fanType: g('ac_fan').value
    };
    const r = await callAPI(payload);
    if (r.error) return showErr('ac', r.error);
    lastResults.ac = r;
    showRes('ac', renderAirCooledResults(r));
  } catch(err) { showErr('ac', err.message); }
});

// ── DOUBLE PIPE ───────────────────────────────────────────────────────────────
document.getElementById('dpForm').addEventListener('submit', async function(e){
  e.preventDefault(); if(_apiPending) return; hideErr('dp');
  startCalc('dp');
  try {
    const hFlKey=g('dp_hFl').value, cFlKey=g('dp_cFl').value;
    const hTi=getTempVal('dp_hTi'), hTo=getTempVal('dp_hTo'), cTi=getTempVal('dp_cTi');
    const hPop=getPresVal('dp_hPop'), cPop=getPresVal('dp_cPop');
    const hF=parseFloat(g('dp_hF').value)||0;
    const dpColdMode=g('dp_coldMode').value;
    let cFval=0, cToVal=0;
    if(dpColdMode==='flow'){cFval=parseFloat(g('dp_cF').value)||0;if(unitSys==='imperial')cFval/=2.20462;}
    else cToVal=getTempVal('dp_cTo');
    const payload = {
      calcType:'doublePipe', unitSys:'metric', hFlKey, cFlKey, hPop, cPop,
      hTi, hTo, cTi, hF, coldMode:dpColdMode, cF:cFval, cTo:cToVal,
      iOD: getDimMm('dp_iOD'), iTW: getDimMm('dp_iW'), oID: v('dp_oID'),
      L: getLenM('dp_hplen'), nHairpins: 1,
      arr: g('dp_arr').value, mat: g('dp_mat').value,
      foul: parseFloat((g('dp_foul')||{value:'0.0002'}).value)||0.0002,
      pdAllow: Math.min(getPresVal('dp_pdH'), getPresVal('dp_pdC')),
    };
    const r = await callAPI(payload);
    if (r.error) return showErr('dp', r.error);
    lastResults.dp = r;
    showRes('dp', renderDoublePipeResults(r));
  } catch(err) { showErr('dp', err.message); }
});

// ── FIN-FAN ────────────────────────────────────────────────────────────────────
document.getElementById('ffForm').addEventListener('submit', async function(e){
  e.preventDefault(); if(_apiPending) return; hideErr('ff');
  startCalc('ff');
  try {
    const tTi=getTempVal('ff_tTi'), tTo=getTempVal('ff_tTo');
    const aTamb=getTempVal('ff_aTamb'), aTout=getTempVal('ff_aTout');
    const payload = {
      calcType:'finFan', unitSys:'metric',
      tFlKey: g('ff_tFl').value,
      tTi, tTo, tF_kgh: parseFloat(g('ff_tF').value)||0,
      tFoul: parseFloat(g('ff_tFoul').value)||2.9e-4,
      tPdAllow: getPresVal('ff_tPdAllow'),
      htSF: parseFloat(g('ff_htSF').value)||1.0,
      aTamb, aTout, aPop: parseFloat(g('ff_aPop').value)||1.01325,
      aFoul: parseFloat(g('ff_aFoul').value)||1.8e-4,
      tPop: parseFloat(g('ff_tPop').value)||4.0,
      tubeOD: v('ff_tubeOD'), tubeID: v('ff_tubeID'), tubeLen: v('ff_tubeLen'),
      pitchT: v('ff_pitchT'), pitchL: v('ff_pitchL'),
      nRows: v('ff_nRows'), nPasses: v('ff_nPasses'), nTubes: v('ff_nTubes'),
      tubeLayout: g('ff_layout').value, tubeMat: g('ff_tubeMat').value,
      finDensity: v('ff_finDensity'), finRoot: v('ff_finRoot'),
      finH: v('ff_finH'), finThk: v('ff_finThk'), finMat: g('ff_finMat').value,
      nBays: v('ff_nBays'), nBundlesPBay: v('ff_nBundlesPBay'),
      bundleW: v('ff_bundleW'), nFans: v('ff_nFans'),
      fanDia: v('ff_fanDia'), fanEff: v('ff_fanEff'), driverKW: v('ff_driverKW'),
      draftType: g('ff_draft').value,
    };
    const r = await callAPI(payload);
    if (r.error) return showErr('ff', r.error);
    lastResults.ff = r;
    showRes('ff', renderFinFanResults(r));
  } catch(err) { showErr('ff', err.message); }
});

// ── LMTD / NTU ────────────────────────────────────────────────────────────────
document.getElementById('lmForm').addEventListener('submit', async function(e){
  e.preventDefault(); if(_apiPending) return; hideErr('lm');
  try {
    const payload = {
      calcType:'lmtdNtu', unitSys:'metric',
      hTi:getTempVal('lm_hTi'), hTo:getTempVal('lm_hTo'),
      cTi:getTempVal('lm_cTi'), cTo:getTempVal('lm_cTo'),
      Ch: v('lm_Ch')||null, Cc: v('lm_Cc')||null,
      UA: v('lm_UA')||null, arr: g('lm_arr').value
    };
    startCalc('lm');
    const r = await callAPI(payload);
    _apiPending = false;
    g('lm_spin').classList.remove('show');
    if (r.error) { _apiPending = false; return showErr('lm', r.error); }
    lastResults.lm = r;
    const T=tU(), FLMTD=r.FLMTD;
    const sumText=`LMTD=${r.lmtd.toFixed(2)}${T}, F=${r.F.toFixed(3)}, FLMTD=${FLMTD.toFixed(2)}${T}${r.eff!=null?', ε='+(r.eff*100).toFixed(1)+'%':''}`;
    const lmRes=g('lm_res');
    lmRes.innerHTML=`
    <div class="res-hd">
      <div class="res-hd-left"><h3>LMTD &amp; NTU Results</h3><div class="res-meta">${r.arr} flow | ${unitSys==='metric'?'Metric':'Imperial'}</div></div>
      <button class="share-result-btn" onclick="shareResult('lm','${sumText.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')">🔗 Share</button>
    </div>
    <div class="kpi-grid">
      <div class="kpi red"><div class="kpi-label">ΔT₁</div><div class="kpi-val">${r.dT1.toFixed(3)}<span class="kpi-unit">${T}</span></div></div>
      <div class="kpi blue"><div class="kpi-label">ΔT₂</div><div class="kpi-val">${r.dT2.toFixed(3)}<span class="kpi-unit">${T}</span></div></div>
      <div class="kpi teal"><div class="kpi-label">LMTD</div><div class="kpi-val">${r.lmtd.toFixed(4)}<span class="kpi-unit">${T}</span></div></div>
      <div class="kpi gold"><div class="kpi-label">F Factor</div><div class="kpi-val">${r.F.toFixed(4)}</div></div>
      <div class="kpi red"><div class="kpi-label">F × LMTD</div><div class="kpi-val">${FLMTD.toFixed(4)}<span class="kpi-unit">${T}</span></div></div>
      ${r.eff!=null?`<div class="kpi ${r.eff>0.7?'ok':'warn'}"><div class="kpi-label">Effectiveness ε</div><div class="kpi-val">${(r.eff*100).toFixed(2)}<span class="kpi-unit">%</span></div></div>`:''}
      ${r.NTU!=null?`<div class="kpi blue"><div class="kpi-label">NTU</div><div class="kpi-val">${r.NTU.toFixed(4)}</div></div>`:''}
      ${r.UA!=null?`<div class="kpi teal"><div class="kpi-label">U·A Product</div><div class="kpi-val">${(r.UA/1000).toFixed(3)}<span class="kpi-unit">kW/K</span></div></div>`:''}
    </div>
    <div class="tbl-wrap"><table class="dtbl" style="margin-top:14px">
      <thead><tr><th>Parameter</th><th>Value</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td class="lbl-col">Hot: T_in → T_out</td><td>${tDisp(r.hTi).toFixed(2)} → ${tDisp(r.hTo).toFixed(2)} ${T}</td><td>ΔT = ${(r.hTi-r.hTo).toFixed(2)} ${T}</td></tr>
        <tr><td class="lbl-col">Cold: T_in → T_out</td><td>${tDisp(r.cTi).toFixed(2)} → ${tDisp(r.cTo).toFixed(2)} ${T}</td><td>ΔT = ${(r.cTo-r.cTi).toFixed(2)} ${T}</td></tr>
        <tr><td class="lbl-col">LMTD / F / F×LMTD</td><td colspan="2">${r.lmtd.toFixed(4)} × ${r.F.toFixed(4)} = <strong>${FLMTD.toFixed(4)} ${T}</strong></td></tr>
      </tbody>
    </table></div>
    <div class="note" style="margin-top:14px"><div class="note-title">📐 Design Formula</div>
      <div class="note-body"><strong>A = Q / (U × F × LMTD)</strong><br><br>
      ${FLMTD<5?'<strong style="color:var(--warn)">⚠ FLMTD very low (&lt;5°C)</strong>':FLMTD<10?'Note: LMTD is relatively low.':'LMTD is adequate for economic design.'}
    </div></div>`;
    lmRes.classList.add('show');
    g('lm_ph').style.display='none';
  } catch(err) { _apiPending = false; g('lm_spin').classList.remove('show'); showErr('lm',err.message); }
});

// ── SELECTOR ──────────────────────────────────────────────────────────────────
async function runSelector(){
  try {
    const payload={calcType:'selector',app:g('sel_app').value,pres:g('sel_pres').value,foul:g('sel_foul').value,duty:g('sel_duty').value,space:g('sel_space').value,corr:g('sel_corr').value};
    const r=await callAPI(payload);
    if(r.error){alert(r.error);return;}
    const names={'shell-tube':'Shell & Tube','plate':'Plate HX','air-cooled':'Air Cooled','double-pipe':'Double Pipe','spiral':'Spiral','plate-fin':'Plate-Fin'};
    const icons={'shell-tube':'⚙️','plate':'🔲','air-cooled':'💨','double-pipe':'↔️','spiral':'🌀','plate-fin':'📄'};
    const descs={'shell-tube':'Most versatile. Handles high P, T, fouling. Coded per TEMA/ASME.','plate':'Very high U (2–5× S&T). Compact, close approach. Limited to ~30 bar.','air-cooled':'Eliminates cooling water. Required by API 661.','double-pipe':'Simplest construction for small duties (<200 kW).','spiral':'Best for fouling/viscous fluids. Self-cleaning.','plate-fin':'Extremely compact for gas-gas or cryogenic service.'};
    const div=g('sel_result');div.style.display='block';
    div.innerHTML=`<div class="sec-hd purple">🎯 Recommendation</div><div class="selector-grid">
      <div class="hx-card" style="border-color:var(--red)"><div class="hx-card-icon">${icons[r.top]}</div><div class="hx-card-title">${names[r.top]}</div><div class="hx-card-desc">${descs[r.top]}</div><div class="hx-card-badge">⭐ Primary</div></div>
      <div class="hx-card"><div class="hx-card-icon">${icons[r.second]}</div><div class="hx-card-title">${names[r.second]}</div><div class="hx-card-desc">${descs[r.second]}</div><div class="hx-card-badge" style="background:var(--blue-lt);color:var(--blue)">🔷 Alternative</div></div>
    </div>`;
  } catch(e){alert(e.message);}
}

// ── WALL THICKNESS ────────────────────────────────────────────────────────────
async function calcWallThickness(){
  try {
    const payload={calcType:'wallThick',std:g('wt_std').value,type:g('wt_type').value,P:parseFloat(g('wt_P').value)||0,D:parseFloat(g('wt_D').value)||0,S:parseFloat(g('wt_S').value)||138,CA:parseFloat(g('wt_CA').value)||3,MT:parseFloat(g('wt_MT').value)||0.6,E:parseFloat(g('wt_E').value)||1.0,alpha:parseFloat(g('wt_alpha').value)||30,mat:g('wt_mat').value};
    const r=await callAPI(payload);
    if(r.error){alert(r.error);return;}
    const ph=g('wt_ph'),resEl=g('wt_res');
    ph.style.display='none'; resEl.style.display='block';
    resEl.innerHTML=`
    <div style="background:var(--blue-lt);border:1px solid rgba(0,85,200,.15);border-left:3px solid var(--blue);border-radius:var(--r-md);padding:12px 14px;margin-bottom:12px">
      <div style="font-weight:700;color:var(--blue)">${r.standardName}</div>
      <div style="font-family:var(--mono);font-size:.8rem;background:rgba(0,85,200,.06);padding:6px 10px;border-radius:5px;margin-top:4px">${r.formula}</div>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi blue"><div class="kpi-label">Calc. Thickness t</div><div class="kpi-val">${r.t_calc_mm.toFixed(2)}<span class="kpi-unit"> mm</span></div></div>
      <div class="kpi red"><div class="kpi-label">t + CA + MT</div><div class="kpi-val">${r.t_with_CA.toFixed(2)}<span class="kpi-unit"> mm</span></div></div>
      <div class="kpi teal"><div class="kpi-label">Nominal (round-up)</div><div class="kpi-val">${r.t_nominal.toFixed(1)}<span class="kpi-unit"> mm</span></div></div>
      <div class="kpi gold"><div class="kpi-label">OD</div><div class="kpi-val">${r.OD_mm.toFixed(1)}<span class="kpi-unit"> mm</span></div></div>
      <div class="kpi ${r.isThickWall?'warn':'ok'}"><div class="kpi-label">t/R ratio</div><div class="kpi-val">${(r.tRatio*100).toFixed(1)}<span class="kpi-unit">%</span></div></div>
      <div class="kpi blue"><div class="kpi-label">MAWP</div><div class="kpi-val">${r.pMax_check_bar.toFixed(2)}<span class="kpi-unit"> bar g</span></div></div>
    </div>
    <div class="note" style="margin-top:8px"><div class="note-title">✅ Summary</div><div class="note-body">
    Specify <strong>${r.t_nominal.toFixed(1)} mm</strong> nominal wall for ${r.D_mm}mm ID, ${r.P_barg} bar g. MAWP = ${r.pMax_check_bar.toFixed(2)} bar g.
    </div></div>`;
  } catch(e){alert(e.message);}
}

// ── FOULING ──────────────────────────────────────────────────────────────────
async function calcFoulingCombined(){
  try {
    const payload={calcType:'fouling',Rf_s:parseFloat(g('foul_shell').value)||0,Rf_t:parseFloat(g('foul_tube').value)||0,U_cl:parseFloat(g('foul_U_clean').value)||800};
    const r=await callAPI(payload);
    if(r.error) return;
    const res=g('foul_result'); res.style.display='block';
    res.innerHTML=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font-size:.82rem">
      <div><div style="color:var(--t3);font-size:.68rem;text-transform:uppercase;font-weight:700">R_f shell</div><div style="font-family:var(--mono);font-weight:700">${r.Rf_s.toExponential(3)} m²K/W</div></div>
      <div><div style="color:var(--t3);font-size:.68rem;text-transform:uppercase;font-weight:700">R_f tube</div><div style="font-family:var(--mono);font-weight:700">${r.Rf_t.toExponential(3)} m²K/W</div></div>
      <div><div style="color:var(--t3);font-size:.68rem;text-transform:uppercase;font-weight:700">R_f total</div><div style="font-family:var(--mono);font-weight:700;color:var(--red)">${r.Rf_total.toExponential(3)} m²K/W</div></div>
      <div><div style="color:var(--t3);font-size:.68rem;text-transform:uppercase;font-weight:700">U_clean → U_service</div><div style="font-family:var(--mono);font-weight:700">${r.U_cl.toFixed(0)} → ${r.U_service.toFixed(0)} W/m²K</div></div>
    </div>
    <div style="margin-top:10px;padding:8px 12px;background:rgba(232,80,10,.06);border-radius:6px;font-size:.82rem;font-weight:600">
      💡 Area must increase by <b style="color:var(--red)">${r.area_increase.toFixed(1)}%</b> to compensate for fouling.
    </div>`;
  } catch(e){}
}

// ── RENDER FUNCTIONS ──────────────────────────────────────────────────────────
function renderPlateResults(r){
  const Q=convQ(r.Q),A=convA(r.A_req),Ap=convA(r.A_provided),U=convU(r.U);
  const T=tU(),H=hU(),Au=aU(),Pu=pU(),Uu=uU();
  const warnHtml=r.warns&&r.warns.length?`<div class="note warn"><div class="note-title">⚠ Warnings</div><div class="note-body"><ul>${r.warns.map(w=>`<li>${w}</li>`).join('')}</ul></div></div>`:'';
  const sumText=`Q=${Q.toFixed(1)}${H}, Area=${Ap.toFixed(1)}${Au}, U=${U.toFixed(0)}${Uu}`;
  return `<div class="res-hd"><div class="res-hd-left"><h3>Plate HX — Results</h3><div class="res-meta">Counter-current | ${unitSys==='metric'?'SI':'Imperial'}</div></div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="badge badge-${r.st}">${r.st==='ok'?'✓ OK':r.st==='warn'?'⚠ Check':'✗ Failed'}</span>
    <button class="share-result-btn" onclick="shareResult('pl','${sumText}')">🔗 Share</button></div></div>
  <div class="kpi-grid">
    <div class="kpi red"><div class="kpi-label">Heat Duty</div><div class="kpi-val">${Q.toFixed(1)}<span class="kpi-unit">${H}</span></div></div>
    <div class="kpi blue"><div class="kpi-label">F×LMTD</div><div class="kpi-val">${r.FLMTD.toFixed(2)}<span class="kpi-unit">${T}</span></div></div>
    <div class="kpi teal"><div class="kpi-label">Required Area</div><div class="kpi-val">${A.toFixed(2)}<span class="kpi-unit">${Au}</span></div></div>
    <div class="kpi gold"><div class="kpi-label">Overall U</div><div class="kpi-val">${U.toFixed(0)}<span class="kpi-unit">${Uu}</span></div></div>
    <div class="kpi ${r.overDesign>=5?'ok':'warn'}"><div class="kpi-label">Overdesign</div><div class="kpi-val">${r.overDesign.toFixed(1)}<span class="kpi-unit">%</span></div></div>
    <div class="kpi"><div class="kpi-label">Plate Count</div><div class="kpi-val">${r.nPlates}</div></div>
    <div class="kpi ${r.eff>0.7?'ok':'warn'}"><div class="kpi-label">Effectiveness</div><div class="kpi-val">${(r.eff*100).toFixed(1)}<span class="kpi-unit">%</span></div></div>
    <div class="kpi blue"><div class="kpi-label">NTU</div><div class="kpi-val">${r.NTU.toFixed(3)}</div></div>
  </div>
  <div class="tbl-wrap"><table class="dtbl" style="margin-top:12px">
    <thead><tr><th>Parameter</th><th>Hot Side</th><th>Cold Side</th></tr></thead>
    <tbody>
      <tr><td class="lbl-col">Inlet Temp</td><td>${tDisp(r.hTi).toFixed(1)} ${T}</td><td>${tDisp(r.cTi).toFixed(1)} ${T}</td></tr>
      <tr><td class="lbl-col">Outlet Temp</td><td>${tDisp(r.hTo).toFixed(1)} ${T}</td><td>${tDisp(r.cTo).toFixed(1)} ${T}</td></tr>
      <tr><td class="lbl-col">Film HTC h</td><td>${r.hH.toFixed(0)} W/m²K</td><td>${r.hC.toFixed(0)} W/m²K</td></tr>
      <tr><td class="lbl-col">Pressure Drop</td><td style="color:${r.dpH>r.pdAllowH?'var(--err)':'var(--ok)'}">${convP(r.dpH).toFixed(3)} ${Pu}</td><td style="color:${r.dpC>r.pdAllowC?'var(--err)':'var(--ok)'}">${convP(r.dpC).toFixed(3)} ${Pu}</td></tr>
    </tbody></table></div>
  ${warnHtml}`;
}

function renderAirCooledResults(r){
  const Q=convQ(r.Q), Au=aU(), T=tU(), H=hU();
  const A_total = r.A_total ? convA(r.A_total) : null;
  const A_req   = r.A_req   ? convA(r.A_req)   : null;
  const sumText = A_total
    ? `Q=${Q.toFixed(1)}${H}, ExtArea=${A_total.toFixed(1)}${Au}, OD=${r.overDesign!=null?r.overDesign.toFixed(1):'—'}%`
    : `Q=${Q.toFixed(1)}${H}`;
  const warnHtml = r.warns&&r.warns.length
    ? `<div class="note warn"><div class="note-title">⚠ Warnings</div><div class="note-body"><ul>${r.warns.map(w=>`<li>${w}</li>`).join('')}</ul></div></div>` : '';
  return `<div class="res-hd"><div class="res-hd-left"><h3>Air Cooled HX — Results</h3>
    <div class="res-meta">Robinson-Briggs j-factor | Schmidt fin efficiency</div></div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
      <span class="badge badge-${r.st}">${r.stTxt}</span>
      <button class="share-result-btn" onclick="shareResult('ac','${sumText}')">🔗 Share</button>
    </div></div>
  <div class="kpi-grid">
    <div class="kpi red"><div class="kpi-label">Heat Duty</div><div class="kpi-val">${Q.toFixed(1)}<span class="kpi-unit">${H}</span></div></div>
    <div class="kpi blue"><div class="kpi-label">F×LMTD</div><div class="kpi-val">${r.FLMTD.toFixed(2)}<span class="kpi-unit">${T}</span></div></div>
    <div class="kpi teal"><div class="kpi-label">Ext. Surface Area</div><div class="kpi-val">${A_total!=null?A_total.toFixed(1):'—'}<span class="kpi-unit">${Au}</span></div></div>
    <div class="kpi gold"><div class="kpi-label">Overall U</div><div class="kpi-val">${convU(r.U).toFixed(0)}<span class="kpi-unit">${uU()}</span></div></div>
    <div class="kpi ${r.overDesign>=5?'ok':'warn'}"><div class="kpi-label">Overdesign</div><div class="kpi-val">${r.overDesign!=null?r.overDesign.toFixed(1):'—'}<span class="kpi-unit">%</span></div></div>
    <div class="kpi"><div class="kpi-label">Air Flow</div><div class="kpi-val">${(r.mAir*3.6).toFixed(1)}<span class="kpi-unit">t/h</span></div></div>
    <div class="kpi ${r.ApproachTemp>=15?'ok':'warn'}"><div class="kpi-label">Approach ΔT</div><div class="kpi-val">${r.ApproachTemp.toFixed(1)}<span class="kpi-unit">${T}</span></div></div>
    <div class="kpi"><div class="kpi-label">Fan Power</div><div class="kpi-val">${r.fanPower!=null?convQ(r.fanPower).toFixed(2):'—'}<span class="kpi-unit">${H}</span></div></div>
  </div>
  <div class="tbl-wrap"><table class="dtbl" style="margin-top:12px">
    <thead><tr><th>Parameter</th><th>Value</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td class="lbl-col">Airside Re</td>
        <td style="color:${r.Re_fin&&r.Re_fin>=2000?'var(--ok)':'var(--warn)'};font-weight:700">${r.Re_fin!=null?r.Re_fin.toFixed(0):'—'}</td>
        <td style="font-size:.75rem;color:var(--t3)">Valid range: 2,000–50,000</td></tr>
      <tr><td class="lbl-col">Fin Efficiency η_fin</td>
        <td style="color:${r.eta_fin&&r.eta_fin>=0.7?'var(--ok)':r.eta_fin&&r.eta_fin>=0.6?'var(--warn)':'var(--err)'};font-weight:700">
          ${r.eta_fin!=null?(r.eta_fin*100).toFixed(1)+'%':'—'}
        </td>
        <td style="font-size:.75rem;color:var(--t3)">Schmidt approx. Target ≥ 70%</td></tr>
      <tr><td class="lbl-col">Surface Efficiency η₀</td>
        <td style="font-weight:700">${r.eta_0!=null?(r.eta_0*100).toFixed(1)+'%':'—'}</td>
        <td style="font-size:.75rem;color:var(--t3)">Overall (bare + fin weighted)</td></tr>
      <tr><td class="lbl-col">Airside h (bare)</td>
        <td style="font-weight:700">${r.h_air_bare!=null?r.h_air_bare.toFixed(0)+' W/m²K':'—'}</td>
        <td style="font-size:.75rem;color:var(--t3)">Robinson-Briggs j-factor</td></tr>
      <tr><td class="lbl-col">Effective h_air</td>
        <td style="font-weight:700">${r.h_eff!=null?r.h_eff.toFixed(0)+' W/m²K':'—'}</td>
        <td style="font-size:.75rem;color:var(--t3)">h_bare × η₀</td></tr>
      <tr><td class="lbl-col">Tube-side Velocity</td>
        <td style="color:${r.tubeVel&&r.tubeVel>=0.5&&r.tubeVel<=4?'var(--ok)':'var(--warn)'};font-weight:700">
          ${r.tubeVel!=null?r.tubeVel.toFixed(3)+' m/s':'—'}
        </td>
        <td style="font-size:.75rem;color:var(--t3)">Target 0.5–4 m/s (liquid)</td></tr>
      <tr><td class="lbl-col">Area: Required / Provided</td>
        <td style="font-weight:700">${A_req!=null?A_req.toFixed(1):' —'} / ${A_total!=null?A_total.toFixed(1):'—'} ${Au}</td>
        <td style="font-size:.75rem;color:var(--t3)">Extended surface basis</td></tr>
      <tr><td class="lbl-col">Fluid / Approach Temp</td>
        <td style="font-weight:700">${r.fluidName||'—'}</td>
        <td style="font-size:.75rem;color:${r.ApproachTemp>=15?'var(--ok)':'var(--warn)'}">
          Approach: ${r.ApproachTemp!=null?r.ApproachTemp.toFixed(1):'—'} ${T} ${r.ApproachTemp>=15?'✓ OK':'⚠ Close'}
        </td></tr>
    </tbody>
  </table></div>
  ${warnHtml}`;
}

function renderDoublePipeResults(r){
  const Q=convQ(r.Q),A=convA(r.A_req),Ap=convA(r.A_provided);
  const T=tU(),H=hU(),Au=aU(),Pu=pU();
  const warnHtml=r.warns&&r.warns.length?`<div class="note warn"><div class="note-title">⚠ Warnings</div><div class="note-body"><ul>${r.warns.map(w=>`<li>${w}</li>`).join('')}</ul></div></div>`:'';
  const sumText=`Q=${Q.toFixed(1)}${H}, Area=${Ap.toFixed(1)}${Au}`;
  return `<div class="res-hd"><div class="res-hd-left"><h3>Double Pipe HX — Results</h3></div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="badge badge-${r.st}">${r.st==='ok'?'✓ OK':r.st==='warn'?'⚠ Check':'✗ Failed'}</span>
    <button class="share-result-btn" onclick="shareResult('dp','${sumText}')">🔗 Share</button></div></div>
  <div class="kpi-grid">
    <div class="kpi red"><div class="kpi-label">Heat Duty</div><div class="kpi-val">${Q.toFixed(1)}<span class="kpi-unit">${H}</span></div></div>
    <div class="kpi blue"><div class="kpi-label">F×LMTD</div><div class="kpi-val">${r.FLMTD.toFixed(2)}<span class="kpi-unit">${T}</span></div></div>
    <div class="kpi teal"><div class="kpi-label">Required Area</div><div class="kpi-val">${A.toFixed(2)}<span class="kpi-unit">${Au}</span></div></div>
    <div class="kpi gold"><div class="kpi-label">Overall U</div><div class="kpi-val">${convU(r.U).toFixed(0)}<span class="kpi-unit">${uU()}</span></div></div>
    <div class="kpi ${r.overDesign>=5?'ok':'warn'}"><div class="kpi-label">Overdesign</div><div class="kpi-val">${r.overDesign.toFixed(1)}<span class="kpi-unit">%</span></div></div>
    <div class="kpi"><div class="kpi-label">Hairpins</div><div class="kpi-val">${r.nHairpins}<span class="kpi-unit"> × ${r.L.toFixed(1)}m</span></div></div>
    <div class="kpi ${r.eff>0.7?'ok':'warn'}"><div class="kpi-label">Effectiveness</div><div class="kpi-val">${(r.eff*100).toFixed(1)}<span class="kpi-unit">%</span></div></div>
    <div class="kpi blue"><div class="kpi-label">NTU</div><div class="kpi-val">${r.NTU.toFixed(3)}</div></div>
  </div>
  <div class="tbl-wrap"><table class="dtbl" style="margin-top:12px">
    <thead><tr><th>Parameter</th><th>Inner (Hot)</th><th>Annulus (Cold)</th></tr></thead>
    <tbody>
      <tr><td class="lbl-col">Film HTC h</td><td>${r.hInner.toFixed(0)} W/m²K</td><td>${r.hAnn.toFixed(0)} W/m²K</td></tr>
      <tr><td class="lbl-col">Velocity</td><td>${r.velInner.toFixed(3)} m/s</td><td>${r.velAnn.toFixed(3)} m/s</td></tr>
      <tr><td class="lbl-col">Re</td><td>${r.Re_inner.toFixed(0)}</td><td>${r.Re_ann.toFixed(0)}</td></tr>
      <tr><td class="lbl-col">Pressure Drop</td><td style="color:${r.dpInner>r.pdAllow?'var(--err)':'var(--ok)'}">${convP(r.dpInner).toFixed(3)} ${Pu}</td><td style="color:${r.dpAnn>r.pdAllow?'var(--err)':'var(--ok)'}">${convP(r.dpAnn).toFixed(3)} ${Pu}</td></tr>
    </tbody></table></div>
  ${warnHtml}`;
}

function renderFinFanResults(r){
  const T=tU(),H=hU(),Au=aU(),Pu=pU();
  const Q=convQ(r.Qhot),Ap=convA(r.A_prov),Ar=convA(r.A_req);
  const warnHtml=r.warns&&r.warns.length?`<div class="warn-box">${r.warns.map(w=>`<div class="warn-item">⚠ ${w}</div>`).join('')}</div>`:'';
  const sumText=`Q=${Q.toFixed(1)}${H}, Area=${Ap.toFixed(0)}${Au}, OD%=${r.overDesign.toFixed(1)}%`;
  return `<div class="res-hd"><div class="res-hd-left"><h3>Fin-Fan HX — Engineering Datasheet</h3><div class="res-meta">Robinson-Briggs | API 661</div></div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="badge badge-${r.st}">${r.stTxt}</span>
    <button class="share-result-btn" onclick="shareResult('ff','${sumText}')">🔗 Share</button></div></div>
  <div class="kpi-grid">
    <div class="kpi red"><div class="kpi-label">Total Duty</div><div class="kpi-val">${Q.toFixed(1)}<span class="kpi-unit">${H}</span></div></div>
    <div class="kpi blue"><div class="kpi-label">EMTD</div><div class="kpi-val">${r.EMTD.toFixed(1)}<span class="kpi-unit">${T}</span></div></div>
    <div class="kpi teal"><div class="kpi-label">Ext. Area (prov)</div><div class="kpi-val">${Ap.toFixed(0)}<span class="kpi-unit">${Au}</span></div></div>
    <div class="kpi gold"><div class="kpi-label">Actual U</div><div class="kpi-val">${r.U_actual.toFixed(1)}<span class="kpi-unit">W/m²K</span></div></div>
    <div class="kpi ${r.overDesign>=5?'ok':'warn'}"><div class="kpi-label">Overdesign</div><div class="kpi-val">${r.overDesign.toFixed(1)}<span class="kpi-unit">%</span></div></div>
    <div class="kpi"><div class="kpi-label">Air Flow</div><div class="kpi-val">${(r.mAir_kgh/1000).toFixed(1)}<span class="kpi-unit">t/h</span></div></div>
    <div class="kpi ${r.eta_fin>=0.7?'ok':'warn'}"><div class="kpi-label">Fin Efficiency</div><div class="kpi-val">${(r.eta_fin*100).toFixed(1)}<span class="kpi-unit">%</span></div></div>
    <div class="kpi ${r.P_fan_each<=r.driverKW?'ok':'warn'}"><div class="kpi-label">Fan Power</div><div class="kpi-val">${r.P_fan_each.toFixed(1)}<span class="kpi-unit">kW/fan</span></div></div>
  </div>
  <div class="tbl-wrap" style="margin-top:12px"><table class="dtbl">
    <thead><tr><th>Parameter</th><th>Unit</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td class="lbl-col">Outside film coef</td><td>W/m²K</td><td>${r.h_outside.toFixed(2)}</td></tr>
      <tr><td class="lbl-col">Tubeside film coef</td><td>W/m²K</td><td>${r.h_tubeside.toFixed(0)}</td></tr>
      <tr><td class="lbl-col">Overall surf efficiency η₀</td><td>—</td><td>${(r.eta_surf*100).toFixed(1)}%</td></tr>
      <tr><td class="lbl-col">Face velocity</td><td>m/s</td><td style="color:${r.v_face>=1.5&&r.v_face<=4?'var(--ok)':'var(--warn)'}">${r.v_face.toFixed(2)}</td></tr>
      <tr><td class="lbl-col">Airside Re</td><td>—</td><td>${r.Re_air.toFixed(0)}</td></tr>
      <tr><td class="lbl-col">Airside ΔP</td><td>mmH₂O</td><td>${r.dpAir_mmH2O.toFixed(1)}</td></tr>
      <tr><td class="lbl-col">Tubeside ΔP</td><td>bar</td><td style="color:${r.dpTube>r.tPdAllow?'var(--err)':'var(--ok)'}">${r.dpTube.toFixed(3)}</td></tr>
    </tbody></table></div>
  ${warnHtml}`;
}

// ── SHELL MODE CHANGE (phase change selector) ────────────────────────────────
function onShellModeChange() {
  const mode = (document.getElementById('st_shellMode')||{}).value || 'single-phase';
  const note = document.getElementById('st_phaseNote');
  const txt  = document.getElementById('st_phaseNoteText');
  if (!note) return;
  if (mode === 'condensing') {
    note.style.display = 'block';
    txt.textContent = 'Condensing mode: tube-side HTC uses Nusselt horizontal film condensation. '
      + 'Supported fluids: steam, ammonia-liquid, r134a, r717. '
      + 'Enter condensate inlet/outlet temperatures on the cold side.';
  } else if (mode === 'evaporating') {
    note.style.display = 'block';
    txt.textContent = 'Evaporating mode: tube-side HTC uses simplified Chen correlation '
      + '(forced convection + nucleate boiling). For preliminary sizing only. '
      + 'Enter boiling fluid on the cold (tube) side.';
  } else {
    note.style.display = 'none';
  }
}

// ── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  buildFluidOptions();
  setColdMode('flow');  // initialise cold-side toggle to default state
  plToggleColdMode();
  dpToggleColdMode();
  onVelModeChange();
  setTimeout(calcFoulingCombined, 500);
  document.querySelectorAll('.modal-backdrop').forEach(bd=>{
    bd.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
  });
});
</script>
</body>
</html>
