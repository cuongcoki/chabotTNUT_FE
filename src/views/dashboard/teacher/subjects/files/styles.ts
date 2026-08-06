const CSS = `
  @keyframes tdf-spin    { to{transform:rotate(360deg)} }
  @keyframes tdf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes tdf-overlay { from{opacity:0} to{opacity:1} }
  @keyframes tdf-panel   { from{opacity:0;transform:translateY(14px) scale(.985)} to{opacity:1;transform:none} }

  .tdf-skeleton { border-radius:10px; background:linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%); background-size:200% 100%; animation:tdf-shimmer 1.4s ease infinite; }

  .tdf-stat { background:#fff; border:1px solid #e7ecf3; border-radius:16px; padding:18px 22px; display:flex; align-items:center; gap:16px; box-shadow:0 1px 4px rgba(15,23,42,.04); }

  .tdf-seg { height:38px; padding:0 15px; border:none; border-radius:9px; font-family:inherit; font-size:13.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all .15s; }
  .tdf-seg.on  { background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; box-shadow:0 4px 12px rgba(37,99,235,.25); }
  .tdf-seg.off { background:transparent; color:#64748b; }
  .tdf-seg.off:hover { color:#2563eb; background:rgba(37,99,235,.05); }

  .tdf-lay { height:30px; padding:0 12px; border:none; border-radius:8px; font-family:inherit; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all .15s; }
  .tdf-lay.on  { background:#eff5ff; color:#2563eb; }
  .tdf-lay.off { background:transparent; color:#94a3b8; }

  .tdf-chip { height:38px; padding:0 14px; border-radius:11px; font-family:inherit; font-size:13px; cursor:pointer; border:1px solid; transition:all .13s; white-space:nowrap; }
  .tdf-chip.on  { border-color:#bfdbfe; background:#eff5ff; color:#2563eb; font-weight:700; }
  .tdf-chip.off { border-color:#e7ecf3; background:#fff; color:#64748b; font-weight:600; }
  .tdf-chip.off:hover { border-color:#c5d8f5; background:#f8fbff; }

  /* ── Search bar + status dropdown ─────────────────── */
  @keyframes tdf-dd-in { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

  .tdf-searchbar-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .tdf-search-box { flex:1 1 220px; min-width:0; position:relative; }

  .tdf-status-dd { position:relative; flex-shrink:0; width:196px; }
  .tdf-status-trigger {
    width:100%; height:42px; display:flex; align-items:center; gap:8px;
    padding:0 12px; border-radius:12px; border:1px solid #e7ecf3; background:#fff;
    font-family:inherit; font-size:13.5px; font-weight:600; color:#334155; cursor:pointer;
    transition:border-color .13s, background .13s, color .13s; box-sizing:border-box;
  }
  .tdf-status-trigger:hover { border-color:#c5d8f5; background:#f8fbff; }
  .tdf-status-trigger.open { border-color:#93c5fd; background:#eff5ff; color:#2563eb; }
  .tdf-status-trigger .tdf-status-icon { color:#94a3b8; flex-shrink:0; }
  .tdf-status-trigger.open .tdf-status-icon { color:#2563eb; }
  .tdf-status-trigger .tdf-status-label { flex:1; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tdf-status-trigger .tdf-status-chevron { flex-shrink:0; color:#94a3b8; transition:transform .15s; }
  .tdf-status-trigger.open .tdf-status-chevron { transform:rotate(180deg); color:#2563eb; }

  .tdf-status-menu {
    position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:30;
    background:#fff; border:1px solid #e7ecf3; border-radius:12px;
    box-shadow:0 8px 28px rgba(15,23,42,.14); padding:5px;
    animation:tdf-dd-in .14s ease both;
  }
  .tdf-status-item {
    width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px;
    padding:8px 11px; border-radius:8px; border:none; background:transparent;
    font-family:inherit; font-size:13px; font-weight:600; color:#334155; cursor:pointer;
    text-align:left; transition:background .1s;
  }
  .tdf-status-item:hover { background:#f8fafc; }
  .tdf-status-item.on { color:#2563eb; background:#eff5ff; }
  .tdf-status-item svg { color:#2563eb; flex-shrink:0; }

  @media(max-width:640px) {
    .tdf-searchbar-row { flex-direction:column; align-items:stretch; }
    .tdf-search-box { flex:none; width:100%; }
    .tdf-status-dd { width:100%; }
  }

  .tdf-folder-item { display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:10px; cursor:pointer; font-size:13.5px; transition:background .13s; }
  .tdf-folder-item.on  { background:#eff5ff; color:#1d4ed8; font-weight:700; }
  .tdf-folder-item.off { color:#475569; font-weight:500; }
  .tdf-folder-item.off:hover { background:#f5f8ff; }

  .tdf-file-row { display:flex; align-items:center; gap:12px; padding:13px 18px; cursor:pointer; transition:background .12s; border-top:1px solid #f1f5f9; }
  .tdf-file-row:first-child { border-top:none; }
  .tdf-file-row:hover { background:#f8fbff; }

  .tdf-act { width:32px; height:32px; border-radius:9px; border:1px solid #e7ecf3; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition:all .13s; }
  .tdf-act:hover  { background:#eff5ff; color:#2563eb; border-color:#bfdbfe; }
  .tdf-act.ind:hover { background:#eef2ff; color:#4f46e5; border-color:#c7d2fe; }
  .tdf-act.red:hover { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
  .tdf-act:disabled { opacity:.4; cursor:not-allowed; }

  .tdf-overlay { position:fixed; inset:0; background:rgba(15,23,42,.52); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:60; padding:16px; animation:tdf-overlay .18s ease; }
  .tdf-panel { background:#fff; border-radius:20px; box-shadow:0 30px 70px rgba(15,23,42,.32); overflow:hidden; animation:tdf-panel .22s cubic-bezier(.2,.8,.2,1); }

  .tdf-drop { border:2px dashed #c7daf2; border-radius:16px; background:#f8fbff; padding:34px; text-align:center; cursor:pointer; transition:all .15s; }
  .tdf-drop:hover, .tdf-drop.over { border-color:#2563eb; background:#eff5ff; }

  .tdf-primary { height:44px; padding:0 20px; border:none; border-radius:12px; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; font-weight:700; font-size:14px; font-family:inherit; display:inline-flex; align-items:center; gap:9px; cursor:pointer; box-shadow:0 8px 20px rgba(37,99,235,.28); transition:filter .15s; }
  .tdf-primary:hover { filter:brightness(1.06); }
  .tdf-primary:disabled { opacity:.5; cursor:not-allowed; filter:none; }

  .tdf-rail { width:284px; flex:none; display:flex; flex-direction:column; gap:14px; position:sticky; top:24px; align-self:flex-start; }
  .tdf-rail-card { background:#fff; border:1px solid #e7ecf3; border-radius:16px; padding:18px; }

  .tdf-md { color:#334155; font-size:14px; line-height:1.72; word-break:break-word; }
  .tdf-md > *:first-child { margin-top:0; }
  .tdf-md h1,.tdf-md h2,.tdf-md h3 { color:#0f172a; font-weight:700; line-height:1.3; margin:1.2em 0 .5em; }
  .tdf-md h1{font-size:21px} .tdf-md h2{font-size:17px;padding-bottom:.3em;border-bottom:1px solid #e2e8f0} .tdf-md h3{font-size:15px}
  .tdf-md p{margin:.5em 0} .tdf-md ul,.tdf-md ol{margin:.4em 0;padding-left:1.25em} .tdf-md li{margin:.25em 0}
  .tdf-md a{color:#2563eb;text-decoration:none;border-bottom:1px solid #bfdbfe}
  .tdf-md code{background:#eff6ff;color:#1d4ed8;padding:.1em .4em;border-radius:5px;font-size:.88em;font-family:monospace}
  .tdf-md pre{background:#0f172a;color:#e2e8f0;padding:14px 16px;border-radius:10px;overflow:auto}
  .tdf-md pre code{background:none;color:inherit;padding:0}
  .tdf-md strong{color:#0f172a;font-weight:700}
  .tdf-md blockquote{border-left:3px solid #93c5fd;margin:.6em 0;padding:.15em 0 .15em 1em;color:#64748b}
  .tdf-md hr{border:none;border-top:1px solid #e2e8f0;margin:1em 0}
  .tdf-md table{border-collapse:collapse;width:100%;margin:.7em 0;font-size:13px}
  .tdf-md th,.tdf-md td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left}
  .tdf-md th{background:#f8fafc;font-weight:600;color:#334155}
  .tdf-md [data-line]{cursor:pointer;border-radius:5px;transition:background .15s;}
  .tdf-md [data-line]:hover{background:rgba(37,99,235,.06);}
  @keyframes tdf-md-flash{ 0%{background:rgba(37,99,235,.22)} 100%{background:transparent} }
  .tdf-md-flash{ animation:tdf-md-flash 900ms ease; }

  /* ── Markdown editor: toolbar, line-number gutter, split pane ─ */
  .tdf-mdsplit { flex:1; min-height:0; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }

  .tdf-mdtool-btn { width:30px; height:30px; flex-shrink:0; border:1px solid transparent; border-radius:8px; background:transparent; color:#64748b; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .13s; }
  .tdf-mdtool-btn:hover { background:#eff5ff; color:#2563eb; border-color:#dbeafe; }

  .tdf-mdgutter { flex-shrink:0; width:46px; overflow:hidden; box-sizing:border-box; padding:18px 0; text-align:right; font-family:monospace; font-size:13px; line-height:22px; color:#c2cbd9; background:#fbfcfe; border-right:1px solid #f1f5f9; user-select:none; }
  .tdf-mdgutter > div { padding-right:10px; white-space:nowrap; }

  /* docx-preview reset */
  .docx-wrapper { background:transparent !important; padding:0 !important; }
  .docx-wrapper > section { background:#fff; box-shadow:0 4px 20px rgba(15,23,42,.08); border-radius:8px; margin:0 auto !important; }

  /* ── Responsive stat grid ─────────────────────────── */
  .tdf-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }

  /* ── Band / content padding ───────────────────────── */
  .tdf-band-pad    { padding:18px 28px; }
  .tdf-stats-pad   { padding:18px 28px; }
  .tdf-content-pad { padding:22px 28px 52px; }

  /* ── Page subtitle ────────────────────────────────── */
  .tdf-page-sub { font-size:13px; color:#94a3b8; }

  /* ── Tab bar row ──────────────────────────────────── */
  .tdf-tabbar-row   { display:flex; align-items:center; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .tdf-layout-right { margin-left:auto; display:flex; align-items:center; gap:10px; }

  /* ── File list folder+table grid ─────────────────── */
  .tdf-list-outer { display:grid; grid-template-columns:264px minmax(0,1fr); gap:16px; align-items:start; }

  /* ── File table responsive columns ───────────────── */
  /* (classes used for responsive-only overrides; default styles stay inline) */

  /* ── File card grid ───────────────────────────────── */
  .tdf-card-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; }

  /* ── Detail modal body grid ───────────────────────── */
  .tdf-detail-grid { flex:1; min-height:0; display:grid; grid-template-columns:300px 1fr; }

  /* ── Upload modal file item ───────────────────────── */
  .tdf-upload-item { border:1px solid #eef2f7; border-radius:13px; padding:11px 14px; display:flex; align-items:center; gap:12px; }

  /* ── Train tab (hàng đợi huấn luyện AI) ───────────── */
  .tdf-train-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
  .tdf-train-refresh { margin-left:auto; }

  .tdf-train-row { background:#fff; border:1px solid #e7ecf3; border-radius:14px; padding:14px 17px; display:flex; align-items:center; gap:14px; }
  .tdf-train-head { display:flex; align-items:center; gap:14px; flex:1; min-width:0; }
  .tdf-train-info { flex:1; min-width:0; }
  .tdf-train-actions { display:flex; gap:8px; align-items:center; flex-shrink:0; flex-wrap:wrap; justify-content:flex-end; }

  /* ═══════════════════════════════════════════════════
     BREAKPOINTS
     ═══════════════════════════════════════════════════ */

  /* ≤ 1024px  hide RAG rail */
  @media(max-width:1024px) { .tdf-rail { display:none; } }

  /* ≤ 900px  stats 2 cols */
  @media(max-width:900px) {
    .tdf-stats-grid { grid-template-columns:repeat(2,1fr); }
  }

  /* ≤ 768px  reduce padding, hide stats band */
  @media(max-width:768px) {
    .tdf-band-pad    { padding:14px 18px; }
    .tdf-stats-pad   { display:none; }
    .tdf-content-pad { padding:14px 18px 40px; }
  }

  /* ≤ 700px  hide folder nav, collapse file list grid */
  @media(max-width:700px) {
    .tdf-folder-col  { display:none !important; }
    .tdf-list-outer  { grid-template-columns:1fr; }
  }

  /* ≤ 640px  hide page subtitle, layout toggle goes to new line */
  @media(max-width:640px) {
    .tdf-page-sub     { display:none; }
    .tdf-layout-right { margin-left:0; }
  }

  /* ≤ 640px  train tab: stack info/actions, wrap actions */
  @media(max-width:640px) {
    .tdf-train-row     { flex-direction:column; align-items:stretch; gap:10px; padding:12px 14px; }
    .tdf-train-head    { width:100%; }
    .tdf-train-actions { width:100%; justify-content:flex-start; }
  }

  /* ≤ 420px  train tab toolbar wraps, refresh button full width */
  @media(max-width:420px) {
    .tdf-train-toolbar { gap:8px; }
    .tdf-train-refresh { margin-left:0; width:100%; justify-content:center; }
  }

  /* ≤ 600px  compact stat cards */
  @media(max-width:600px) {
    .tdf-stat { padding:14px 16px; gap:12px; }
    .tdf-stat-num { font-size:22px !important; }
    .tdf-band-pad    { padding:12px 14px; }
    .tdf-stats-pad   { padding:12px 14px; }
    .tdf-content-pad { padding:12px 14px 36px; }
    .tdf-tabbar-row  { gap:8px; margin-bottom:14px; }
  }

  /* ≤ 580px  hide type + status cols in file table, narrow actions col */
  @media(max-width:580px) {
    .tdf-col-type { display:none !important; }
    .tdf-col-st   { display:none !important; }
    .tdf-col-act  { width:76px !important; }
  }

  /* ≤ 560px  upload modal item wraps */
  @media(max-width:560px) {
    .tdf-upload-item { flex-wrap:wrap; row-gap:8px; }
    .tdf-upload-item select { width:100%; order:4; }
  }

  /* ≤ 480px  stat grid compact gap, card grid 1 col */
  @media(max-width:480px) {
    .tdf-stats-grid { gap:10px; }
    .tdf-card-grid  { grid-template-columns:1fr; }
  }

  /* ≤ 680px  detail modal: hide left info panel, preview full width */
  @media(max-width:680px) {
    .tdf-detail-grid { grid-template-columns:1fr; }
    .tdf-detail-left { display:none !important; }
  }
`;

export default CSS;
