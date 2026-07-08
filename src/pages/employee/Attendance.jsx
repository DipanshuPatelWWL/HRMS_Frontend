import { useEffect, useState, useMemo, useRef } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AttendanceModal from "../../components/common/AttendanceModal";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Swal from "sweetalert2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Icon = ({ d, size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const icons = {
    login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    excel: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
    pdf: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
    cal: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
    chart: "M18 20V10M12 20V4M6 20v-6",
    percent: "M19 5 5 19M9 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
    chevL: "M15 18l-6-6 6-6",
    chevR: "M9 18l6-6-6-6",
    quota: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

const MONTHLY_LATE_QUOTA = 3;

const STATUS_COLORS = {
    present: { solid: "#22C55E", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
    late: { solid: "#22C55E", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" }, // late is treated as full day
    halfday: { solid: "#F97316", bg: "#FFEDD5", border: "#FDBA74", text: "#7C2D12" }, // Orange
    absent: { solid: "#EF4444", bg: "#FEE2E2", border: "#FCA5A5", text: "#7F1D1D" }, // Red
    holiday: { solid: "#EAB308", bg: "#FEF9C3", border: "#FDE047", text: "#713F12" }, // Yellow
    weekend: { solid: "#9CA3AF", bg: "#F3F4F6", border: "#D1D5DB", text: "#374151" }, // Gray
    leave: { solid: "#A855F7", bg: "#F3E8FF", border: "#D8B4FE", text: "#581C87" }, // Purple
    today: { solid: "#3B82F6", bg: "#DBEAFE", border: "#3B82F6", text: "#1E3A8A" } // Blue Border
};

const css = `
.att-root *, .att-root *::before, .att-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.att-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--surface-2);
    color: var(--text-1);
    min-height: 100vh;
    padding-bottom: 40px;
}

/* HEADER */
.att-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.att-header h1 { font-size: 1.55rem; font-weight: 700; letter-spacing: -.4px; color: var(--text-1); }
.att-header p  { font-size: .8rem; color: var(--text-2); margin-top: 3px; }
.att-export-row { display: flex; gap: 8px; }
.btn-export {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; font-size: .8rem; font-weight: 600;
    cursor: pointer; transition: all .15s; border: 1.5px solid transparent; font-family: inherit;
}
.btn-excel { background: var(--success-bg); color: var(--success); border-color: var(--success); }
.btn-excel:hover { background: var(--surface-3); }
.btn-pdf   { background: var(--danger-bg); color: var(--danger); border-color: var(--danger); }
.btn-pdf:hover { background: var(--surface-3); }

/* PUNCH CARD */
/* PUNCH CARD */
.punch-card {
    background: linear-gradient(135deg, #1A1D23 0%, #2D3142 100%);
    border-radius: 16px; padding: 24px 28px;
    display: flex; justify-content: space-between; align-items: center;
    gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
    position: relative; overflow: hidden;
}
@media (max-width: 768px) {
    .punch-card {
        flex-direction: column;
        align-items: flex-start;
    }
    .punch-card > div:last-child {
        width: 100%;
        align-items: flex-start !important;
        margin-left: 0 !important;
    }
    .punch-btns {
        width: 100%;
        justify-content: flex-start;
    }
    .punch-btns .btn-punch {
        flex: 1;
        justify-content: center;
    }
}
.punch-card::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,.04);
}
.punch-card::after {
    content:''; position:absolute; bottom:-60px; left:30%;
    width:220px; height:220px; border-radius:50%; background:rgba(255,255,255,.03);
}
.punch-title { font-size:.72rem; text-transform:uppercase; letter-spacing:1px; color:#8892A4; margin-bottom:6px; font-weight:600; }
.punch-sub { font-size:.8rem; color:#8892A4; margin-top:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.punch-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#4ADE80; box-shadow:0 0 8px #4ADE80; animation: blink 2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
.punch-btns { display:flex; gap:10px; z-index:1; }
.btn-punch {
    display:flex; align-items:center; gap:7px; padding:10px 22px; border-radius:10px;
    font-size:.875rem; font-weight:600; cursor:pointer; transition:all .2s; border:none; font-family:inherit;
}
.btn-punchin  { background:#4ADE80; color:#052e16; }
.btn-punchin:hover:not(:disabled)  { background:#22c55e; transform:translateY(-1px); box-shadow:0 4px 16px rgba(74,222,128,.4); }
.btn-punchout { background:rgba(255,255,255,.1); color:#fff; border:1.5px solid rgba(255,255,255,.15); }
.btn-punchout:hover:not(:disabled) { background:rgba(255,255,255,.18); transform:translateY(-1px); }
.btn-punch:disabled { opacity:.4; cursor:not-allowed; transform:none!important; box-shadow:none!important; }
.status-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:99px; font-size:.73rem; font-weight:600; }
.pill-green { background:rgba(74,222,128,.15); color:#4ADE80; }
.pill-blue  { background:rgba(96,165,250,.15);  color:#60A5FA; }
.pill-gray  { background:rgba(255,255,255,.1);  color:#8892A4; }
.pill-warn  { background:rgba(251,191,36,.15);  color:#FBBf24; }

/* ✅ QUOTA BANNER */
.quota-banner {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.quota-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: .73rem;
    font-weight: 700;
    z-index: 1;
}
.quota-pill-safe   { background: rgba(74,222,128,.15); color: #4ADE80; }
.quota-pill-warn   { background: rgba(251,191,36,.2);  color: #FBBf24; }
.quota-pill-danger { background: rgba(248,113,113,.2); color: #F87171; }
.quota-bar-wrap {
    display: flex;
    gap: 5px;
    z-index: 1;
}
.quota-bar-dot {
    width: 10px; height: 10px; border-radius: 3px;
    transition: background .2s;
}
.quota-bar-dot.used   { background: #F87171; }
.quota-bar-dot.unused { background: rgba(255,255,255,.2); }

/* STATS */
.stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
@media(max-width:860px){ .stats-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:480px){ .stats-grid{ grid-template-columns:1fr; } }
.stat-box { background:var(--surface); border-radius:14px; padding:20px 22px; border:1px solid var(--border); position:relative; overflow:hidden; }
.stat-box::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
.stat-box.green::before  { background:linear-gradient(90deg,#4ADE80,#22C55E); }
.stat-box.orange::before { background:linear-gradient(90deg,#FB923C,#F97316); }
.stat-box.red::before    { background:linear-gradient(90deg,#F87171,#EF4444); }
.stat-label { font-size:.71rem; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:var(--text-3); margin-bottom:10px; display:flex; align-items:center; gap:6px; }
.stat-value { font-size:2.4rem; font-weight:700; letter-spacing:-1.5px; line-height:1; color:var(--text-1); }
.stat-value span { font-size:.95rem; font-weight:500; color:var(--text-3); letter-spacing:0; }
.stat-meta { font-size:.75rem; color:var(--text-3); margin-top:6px; }

/* LAYOUT */
.bottom-grid { display:grid; grid-template-columns:1fr 1.5fr; gap:20px; margin-bottom:24px; }
@media(max-width:860px){ .bottom-grid{ grid-template-columns:1fr; } }
.att-card { background:var(--surface); border-radius:14px; border:1px solid var(--border); padding:22px 24px; }
.card-title { font-size:.875rem; font-weight:700; color:var(--text-1); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
.card-title-icon { width:28px; height:28px; border-radius:8px; background:var(--surface-3); display:flex; align-items:center; justify-content:center; color:var(--text-3); flex-shrink:0; }

/* CALENDAR NAV */
.cal-nav { display:flex; align-items:center; gap:8px; margin-bottom:12px; padding-bottom:12px; border-top:1.5px solid var(--border); }
.cal-nav-arrow { width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border); background:var(--surface-2); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-2); transition:all .15s; flex-shrink:0; }
.cal-nav-arrow:hover { background:var(--surface-3); border-color:var(--border-strong); }
.cal-nav-center { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; }
.cal-select { -webkit-appearance:none; appearance:none; border:1.5px solid var(--border); border-radius:8px; padding:5px 10px; font-size:.82rem; font-weight:600; color:var(--text-1); background:var(--surface-2); cursor:pointer; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .15s; }
.cal-select:focus { border-color:#6366F1; background:var(--surface); }
.cal-today-btn { padding:5px 12px; border-radius:7px; font-size:.75rem; font-weight:700; border:1.5px solid var(--border-strong); background:var(--brand-light); color:var(--brand); cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; white-space:nowrap; }
.cal-today-btn:hover { background:var(--surface-3); }

/* CALENDAR GRID */
.cal-day-names { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:4px; }
.cal-day-name { text-align:center; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--text-2); padding:4px 0; }
.cal-cell { height:46px; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; font-size:.83rem; font-weight:500; color:var(--text-3); background:var(--surface-3); border:1.5px solid var(--border); cursor:default; transition:transform .12s, box-shadow .12s; user-select:none; line-height:1; }
.cal-cells { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.cal-cell.empty { background:transparent; border-color:transparent; pointer-events:none; }
.cal-cell.has-record { cursor:pointer; }
.cal-cell.has-record:hover { transform:scale(1.08); z-index:2; box-shadow:0 4px 14px rgba(0,0,0,.12); }
.cal-cell.s-present { background:${STATUS_COLORS.present.bg}; border-color:${STATUS_COLORS.present.border}; color:${STATUS_COLORS.present.text}; font-weight:700; }
.cal-cell.s-absent  { background:${STATUS_COLORS.absent.bg}; border-color:${STATUS_COLORS.absent.border}; color:${STATUS_COLORS.absent.text}; font-weight:600; }
.cal-cell.s-weekend { background:${STATUS_COLORS.weekend.bg}; border-color:${STATUS_COLORS.weekend.border}; color:${STATUS_COLORS.weekend.text}; font-weight:600; }
.cal-cell.s-late    { background:${STATUS_COLORS.late.bg}; border-color:${STATUS_COLORS.late.border}; color:${STATUS_COLORS.late.text}; font-weight:700; }
.cal-cell.s-halfday { background:${STATUS_COLORS.halfday.bg}; border-color:${STATUS_COLORS.halfday.border}; color:${STATUS_COLORS.halfday.text}; font-weight:700; }
.cal-cell.s-holiday { background:${STATUS_COLORS.holiday.bg}; border-color:${STATUS_COLORS.holiday.border}; color:${STATUS_COLORS.holiday.text}; font-weight:700;  }
.cal-cell.is-today  { box-shadow: 0 0 0 2.5px #6366F1, 0 2px 8px rgba(99,102,241,.2) !important; border-color:#6366F1 !important; }
.cal-cell.is-today.no-status { background:#EEF2FF; color:#3730A3; font-weight:700; }
.cal-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; box-shadow:0 0 0 1.5px rgba(0,0,0,.08); }
.cal-cell.s-present  .cal-dot { background:${STATUS_COLORS.present.solid}; }
.cal-cell.s-late     .cal-dot { background:${STATUS_COLORS.late.solid}; }
.cal-cell.s-halfday  .cal-dot { background:${STATUS_COLORS.halfday.solid}; }
.cal-cell.s-holiday  .cal-dot { background:${STATUS_COLORS.holiday.solid}; }
.cal-cell.s-weekend  .cal-dot { background:${STATUS_COLORS.weekend.solid}; }
.cal-cell.s-absent   .cal-dot { background:${STATUS_COLORS.absent.solid}; }
.cal-cell.s-leave  { background:${STATUS_COLORS.leave.bg}; border-color:${STATUS_COLORS.leave.border}; color:${STATUS_COLORS.leave.text}; font-weight:700; }
.cal-cell.s-leave  .cal-dot { background:${STATUS_COLORS.leave.solid}; }
.leg-swatch.leave  { background:${STATUS_COLORS.leave.bg}; border-color:${STATUS_COLORS.leave.border}; }
.tbadge.leave      { background:${STATUS_COLORS.leave.bg}; color:${STATUS_COLORS.leave.text}; border: 1px solid ${STATUS_COLORS.leave.border}; }
.cal-cell.is-today.no-status .cal-dot { background:#4338CA; }
.cal-legend { display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:14px; padding-top:12px; border-top:1.5px solid var(--border); }
.leg-item { display:flex; align-items:center; gap:6px; font-size:.73rem; font-weight:600; color:var(--text-2); }
.leg-swatch { width:14px; height:14px; border-radius:4px; border:1.5px solid transparent; flex-shrink:0; }
.leg-swatch.present { background:${STATUS_COLORS.present.bg}; border-color:${STATUS_COLORS.present.border}; }
.leg-swatch.late    { background:${STATUS_COLORS.late.bg}; border-color:${STATUS_COLORS.late.border}; }
.leg-swatch.halfday { background:${STATUS_COLORS.halfday.bg}; border-color:${STATUS_COLORS.halfday.border}; }
.leg-swatch.holiday { background:${STATUS_COLORS.holiday.bg}; border-color:${STATUS_COLORS.holiday.border}; }
.leg-swatch.weekend { background:${STATUS_COLORS.weekend.bg}; border-color:${STATUS_COLORS.weekend.border}; }
.leg-swatch.absent  { background:${STATUS_COLORS.absent.bg}; border-color:${STATUS_COLORS.absent.border}; }
.leg-swatch.today   { background:#EEF2FF; border-color:#6366F1; }
.tbadge.short-leave { background: #E0E7FF; color: #3730A3; }

/* Chart highlight pulse */
.cal-cell.hl-present  { outline: 2.5px solid ${STATUS_COLORS.present.solid}; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(74,222,128,.25); }
.cal-cell.hl-half-day { outline: 2.5px solid ${STATUS_COLORS.halfday.solid}; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(253,224,71,.25); }
.cal-cell.hl-late     { outline: 2.5px solid ${STATUS_COLORS.late.solid}; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(248,113,113,.25); }
.cal-cell.hl-absent   { outline: 2.5px solid ${STATUS_COLORS.absent.solid}; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(147,197,253,.25); }
.cal-cell.hl-dim { opacity: 0.3; transform: scale(0.96); }

/* Chart type toggle */
.chart-toggle { display:flex; gap:4px; background:var(--surface-3); border-radius:9px; padding:3px; }
.chart-toggle-btn { ... color:var(--text-3); background:transparent; }
.chart-toggle-btn.active { background:var(--surface); color:var(--text-1); box-shadow:0 1px 4px rgba(0,0,0,.1); }
.chart-toggle-btn:hover:not(.active) { color:var(--text-2); }

/* Donut legend */
.donut-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; height:220px; position:relative; }
.donut-legend { display:flex; flex-direction:column; gap:7px; width:100%; margin-top:14px; }
.donut-legend-row { display:flex; align-items:center; justify-content:space-between; font-size:.78rem; }
.donut-legend-left { display:flex; align-items:center; gap:7px; font-weight:600; color:var(--text-2); }
.donut-legend-val { font-weight:700; color:var(--text-1); font-family:'DM Mono',monospace; font-size:.78rem; }
.donut-legend-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }

/* TABLE */
.att-table-wrap { overflow-x:auto; margin-top:4px; }
.att-table { width:100%; border-collapse:collapse; font-size:.83rem; }
.att-table thead tr { border-bottom:1.5px solid var(--border); }
.att-table th { text-align:left; padding:8px 14px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:var(--text-2); white-space:nowrap; }
.att-table td { padding:13px 14px; border-bottom:1px solid var(--border); color:var(--text-2); vertical-align:middle; }
.att-table tbody tr { cursor:pointer; transition:background .1s; }
.att-table tbody tr:hover { background:var(--surface-2); }
.att-table tbody tr:last-child td { border-bottom:none; }
.tbadge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:6px; font-size:.72rem; font-weight:700; }
.tbadge.pass { background: #EDE9FE; color: #5B21B6; }
.tbadge.present  { background:${STATUS_COLORS.present.bg}; color:${STATUS_COLORS.present.text}; }
.tbadge.late     { background:${STATUS_COLORS.late.bg}; color:${STATUS_COLORS.late.text}; }
.tbadge.half-day { background:${STATUS_COLORS.halfday.bg}; color:${STATUS_COLORS.halfday.text}; }
.tbadge.absent   { background:${STATUS_COLORS.absent.bg}; color:${STATUS_COLORS.absent.text}; }
.tbadge.holiday  { background:${STATUS_COLORS.holiday.bg}; color:${STATUS_COLORS.holiday.text}; }
.tbadge.weekend  { background:${STATUS_COLORS.weekend.bg}; color:${STATUS_COLORS.weekend.text}; }
.tbadge.leave    { background:${STATUS_COLORS.leave.bg}; color:${STATUS_COLORS.leave.text}; border: 1px solid ${STATUS_COLORS.leave.border}; }
.time-chip { display:inline-flex; align-items:center; gap:4px; font-family:'DM Mono',monospace; font-size:.76rem; color:var(--text-2); background:var(--surface-3); padding:3px 8px; border-radius:5px; }
`;

const LiveClock = () => {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "1.85rem", fontWeight: 700, color: "#fff", letterSpacing: "-1px" }}>
            {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
    );
};

const CalNav = ({ viewMonth, viewYear, onChange }) => {
    const thisYear = new Date().getFullYear();
    const years = Array.from({ length: 8 }, (_, i) => thisYear - 5 + i);
    const prev = () => viewMonth === 1 ? onChange(12, viewYear - 1) : onChange(viewMonth - 1, viewYear);
    const next = () => viewMonth === 12 ? onChange(1, viewYear + 1) : onChange(viewMonth + 1, viewYear);
    const goToday = () => { const n = new Date(); onChange(n.getMonth() + 1, n.getFullYear()); };
    return (
        <div className="cal-nav">
            <button className="cal-nav-arrow" onClick={prev}><Icon d={icons.chevL} size={14} /></button>
            <div className="cal-nav-center">
                <select className="cal-select" value={viewMonth} onChange={e => onChange(Number(e.target.value), viewYear)}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select className="cal-select" value={viewYear} onChange={e => onChange(viewMonth, Number(e.target.value))}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button className="cal-today-btn" onClick={goToday}>Today</button>
            </div>
            <button className="cal-nav-arrow" onClick={next}><Icon d={icons.chevR} size={14} /></button>
        </div>
    );
};

const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

const OFFICE_LAT = 28.615965009689685;
const OFFICE_LNG = 77.37918363418639;

const Attendance = () => {
    const now = new Date();
    const [todayRec, setTodayRec] = useState(null);
    const [monthly, setMonthly] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loadingIn, setLoadingIn] = useState(false);
    const [loadingOut, setLoadingOut] = useState(false);
    const [holidays, setHolidays] = useState([]);
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [monthlySummary, setMonthlySummary] = useState(null);
    const [highlightStatus, setHighlightStatus] = useState(null);
    const [chartType, setChartType] = useState("bar");
    const viewMonthRef = useRef(now.getMonth() + 1);
    const viewYearRef = useRef(now.getFullYear());
    const mountedRef = useRef(true);
    const cachedGPSRef = useRef(null);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => { viewMonthRef.current = viewMonth; }, [viewMonth]);
    useEffect(() => { viewYearRef.current = viewYear; }, [viewYear]);

    const nowIST = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const [todayYear, todayMonth, todayDay] = nowIST.split("-").map(Number);
    const { user } = useContext(AuthContext);
    const [shiftEndMinutes, setShiftEndMinutes] = useState(null);
    const [shiftReminderEmail, setShiftReminderEmail] = useState(
        user?.shiftReminderEmail !== undefined ? user.shiftReminderEmail : true
    );
    const [reminderToggleLoading, setReminderToggleLoading] = useState(false);


    // Refs to track which notifications have already fired this session
    const notifiedWarningRef = useRef(false);
    const notifiedEndRef = useRef(false);

    useEffect(() => {
        if (!shiftEndMinutes) return;
        if (!("Notification" in window) || Notification.permission !== "granted") return;

        // Reset fired flags whenever shiftEndMinutes changes (e.g. after re-fetch)
        notifiedWarningRef.current = false;
        notifiedEndRef.current = false;

        const WARN_BEFORE = 10; // minutes before shift end

        const tick = () => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const minutesLeft = shiftEndMinutes - currentMinutes;

            // 10-minute warning
            if (
                minutesLeft <= WARN_BEFORE &&
                minutesLeft > 0 &&
                !notifiedWarningRef.current
            ) {
                notifiedWarningRef.current = true;
                const endH = Math.floor(shiftEndMinutes / 60);
                const endM = String(shiftEndMinutes % 60).padStart(2, "0");
                const ampm = endH >= 12 ? "PM" : "AM";
                const h12 = endH % 12 || 12;
                new Notification("⏰ Shift Ending Soon", {
                    body: `Your shift ends at ${h12}:${endM} ${ampm} — ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""} remaining. Please wrap up!`,
                    icon: "/favicon.ico",
                    tag: "shift-warning",    // prevents duplicate toasts
                    requireInteraction: false,
                });
            }

            // Shift ended
            if (minutesLeft <= 0 && !notifiedEndRef.current) {
                notifiedEndRef.current = true;
                new Notification("🏁 Shift Over", {
                    body: "Your shift has ended. Don't forget to punch out!",
                    icon: "/favicon.ico",
                    tag: "shift-end",
                    requireInteraction: true, // stays until dismissed
                });
            }
        };

        tick(); // run immediately in case page loaded mid-warning window
        const id = setInterval(tick, 60 * 1000); // check every minute

        return () => clearInterval(id);
    }, [shiftEndMinutes]);


    const handleReminderToggle = async () => {
        setReminderToggleLoading(true);
        try {
            const newVal = !shiftReminderEmail;
            await API.put("/users/me/preferences", { shiftReminderEmail: newVal });
            setShiftReminderEmail(newVal);
        } catch {
            setShiftReminderEmail(prev => prev);
        } finally {
            setReminderToggleLoading(false);
        }
    };


    const fetchToday = async () => {
        try {
            const r = await API.get("/attendance/today");
            const rec = r.data.attendance;

            if (Array.isArray(rec)) {
                const open = rec.find(a => a.punchIn && !a.punchOut);
                const completed = rec.find(a => a.punchIn && a.punchOut);
                setTodayRec(open || completed || rec[rec.length - 1]);
            } else if (rec) {
                setTodayRec(rec);
            } else {
                setTodayRec(null);
            }
            if (r.data.shiftEnd !== undefined) {
                setShiftEndMinutes(r.data.shiftEnd);
            }

            if (!rec && r.data.shiftEnd !== undefined) {
                const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
                const nowHour = new Date(nowIST).getHours?.() ?? new Date().getHours();
                const shiftEndHour = Math.floor(r.data.shiftEnd / 60);
                const isOvernightWindow = shiftEndHour <= 4 && nowHour <= 4;
                if (isOvernightWindow) {
                    try {
                        const now = new Date();
                        const yesterday = new Date(now);
                        yesterday.setDate(now.getDate() - 1);
                        const yStr = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
                        const yr = await API.get(`/attendance/monthly?month=${yesterday.getMonth() + 1}&year=${yesterday.getFullYear()}`);
                        const yRec = (yr.data.data || []).find(d => {
                            const ds = new Date(d.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
                            return ds === yStr && d.punchIn && !d.punchOut;
                        });
                        if (yRec) setTodayRec(yRec);
                    } catch { /* silent */ }
                }
            }
        } catch { /* silent */ }
    };

    const fetchMonthly = async (m, y) => {
        try {
            const r = await API.get(`/attendance/monthly?month=${m}&year=${y}`);
            setMonthly(r.data.data || []);
            setMonthlySummary(r.data.summary || null);
        }
        catch { /* silent */ }
    };

    // Normalize to midnight for clean date comparisons
    const rawJoining = user?.joiningDate ? new Date(user.joiningDate) : null;
    const rawCreated = user?.createdAt ? new Date(user.createdAt) : null;
    const effectiveStart = rawJoining && rawCreated
        ? new Date(Math.max(rawJoining.getTime(), rawCreated.getTime()))
        : rawJoining || rawCreated || null;
    const joiningDate = effectiveStart
        ? new Date(
            new Date(effectiveStart).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
            + "T00:00:00+05:30"
        )
        : null;


    const saveOfflinePunch = (type) => {
        // FIX #12: wrap localStorage in try/catch — Safari private mode throws QuotaExceededError
        try {
            const q = JSON.parse(localStorage.getItem("punchQueue") || "[]");
            q.push({ type, timestamp: new Date().toISOString() });
            localStorage.setItem("punchQueue", JSON.stringify(q));
            Swal.fire({
                icon: "info",
                title: "Saved Offline",
                text: "No internet — punch saved offline. Will sync when reconnected.",
                confirmButtonColor: "#6366F1",
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (storageErr) {
            Swal.fire({
                icon: "error",
                title: "Offline Storage Unavailable",
                text: "Could not save punch offline — your browser has blocked local storage. Please connect to the internet and try again.",
                confirmButtonColor: "#EF4444",
            });
        }
    };

    const syncOfflinePunches = async () => {
        if (!navigator.onLine) return;
        const q = JSON.parse(localStorage.getItem("punchQueue") || "[]");
        if (!q.length) return;
        const failed = [];
        for (const item of q) {
            try { await API.post(`/attendance/${item.type}`, { isOfflinePunch: true, offlineTimestamp: item.timestamp }); }
            catch { failed.push(item); }
        }
        localStorage.setItem("punchQueue", JSON.stringify(failed));
        if (!failed.length) localStorage.removeItem("punchQueue");
        // Use refs — not stale closure values
        fetchToday();
        fetchMonthly(viewMonthRef.current, viewYearRef.current);
    };


    useEffect(() => {
        fetchToday();
        syncOfflinePunches();

        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Pre-warm GPS silently so it's ready when user hits Punch In
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    cachedGPSRef.current = {
                        lat: coords.latitude,
                        lng: coords.longitude,
                        accuracy: coords.accuracy,
                        ts: Date.now(),
                    };
                },
                () => { },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
            );
        }

        window.addEventListener("online", syncOfflinePunches);

        const onFocus = () => {
            fetchToday();
            fetchMonthly(viewMonthRef.current, viewYearRef.current);
        };
        window.addEventListener("focus", onFocus);

        return () => {
            window.removeEventListener("online", syncOfflinePunches);
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    const fetchHolidays = async (m, y) => {
        try { const r = await API.get(`/holidays?month=${m}&year=${y}`); setHolidays(r.data.holidays || []); }
        catch { /* silent */ }
    };

    useEffect(() => {
        fetchMonthly(viewMonth, viewYear);
        fetchHolidays(viewMonth, viewYear);
    }, [viewMonth, viewYear]);



    const getDeviceInfo = async () => {
        if (window.hrmsAgent?.getDeviceInfo) {
            try {
                const info = await Promise.race([
                    window.hrmsAgent.getDeviceInfo(),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("IPC timeout")), 1500)),
                ]);
                if (info?.deviceUUID && info?.productId) return info;
            } catch (e) {
                console.warn("IPC bridge failed:", e.message);
            }
        }

        try {
            const agentBase = window.hrmsAgent?.getAgentConfig
                ? (await window.hrmsAgent.getAgentConfig()).tokenServerUrl
                : "http://127.0.0.1:57373";

            const c = new AbortController();
            const timer = setTimeout(() => c.abort(), 1500);
            const r = await fetch(`${agentBase}/get-device-info`, { signal: c.signal });
            clearTimeout(timer);
            if (r.ok) return await r.json();
        } catch (e) {
            console.warn("Agent unreachable:", e.message);
        }

        return { deviceUUID: "", productId: "" };
    };

    const getGPS = () => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({ lat: null, lng: null, accuracy: null });

        // Use cached result if under 2 minutes old
        if (cachedGPSRef.current && Date.now() - cachedGPSRef.current.ts < 120_000) {
            return resolve(cachedGPSRef.current);
        }

        const timer = setTimeout(() => {
            console.warn("GPS timed out");
            resolve({ lat: null, lng: null, accuracy: null });
        }, 3000);

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                clearTimeout(timer);
                resolve({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
            },
            (err) => {
                clearTimeout(timer);
                console.warn("GPS error:", err.message);
                resolve({ lat: null, lng: null, accuracy: null });
            },
            { enableHighAccuracy: false, timeout: 2800, maximumAge: 120000 }
        );
    });


    // NEW — add this function
    const requestDeviceApprovalFlow = async (deviceUUID, productId) => {
        let extra = {};
        if (window.hrmsAgent?.getDeviceInfo) {
            try {
                const info = await window.hrmsAgent.getDeviceInfo();
                extra = { hostname: info?.hostname || "", os: info?.os || "" };
            } catch { /* ignore — HR can still identify by deviceUUID/productId */ }
        }

        const { value: reason, isConfirmed } = await Swal.fire({
            icon: "question",
            title: "Request Device Approval",
            html: "This device isn't approved for punch-in yet.<br/>Send a request to HR to get it approved.",
            input: "text",
            inputPlaceholder: "Reason (optional) — e.g. New office PC",
            showCancelButton: true,
            confirmButtonText: "Send Request",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#6366F1",
            cancelButtonColor: "#6b7280",
        });

        if (!isConfirmed) return;

        try {
            await API.post("/device-approvals/request", {
                deviceUUID,
                productId,
                ...extra,
                reason: reason || "",
            });
            Swal.fire({
                icon: "success",
                title: "Request Sent",
                text: "HR has been notified. You'll be able to punch in once it's approved.",
                confirmButtonColor: "#22C55E",
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Request Failed",
                text: err.response?.data?.message || "Could not send the request",
                confirmButtonColor: "#EF4444",
            });
        }
    };

    const doPunchIn = async (lat, lng, accuracy, deviceUUID = "", productId = "") => {
        try {
            // ── Get stored deviceToken from Electron ──────────────────────
            let deviceToken = null;
            if (window.hrmsAgent?.getDeviceToken) {
                try {
                    deviceToken = await window.hrmsAgent.getDeviceToken();
                } catch (e) {
                    // ignore — will fallback
                }
            }

            const payload = {
                deviceId: navigator.userAgent,
                ...(deviceToken ? { deviceToken } : {}),
                // Still send these as fallback info for logging
                ...(deviceUUID && productId ? { deviceUUID, productId } : {}),
                ...(lat != null && lng != null ? { lat, lng, accuracy: accuracy ?? 0 } : {}),
            };

            const punchRes = await API.post("/attendance/punch-in", payload, {
                headers: { "x-client-type": window.hrmsAgent ? "electron" : "browser" }
            });

            const returnedToken = punchRes?.data?.deviceToken;
            if (returnedToken && window.hrmsAgent?.setDeviceToken) {
                window.hrmsAgent.setDeviceToken(returnedToken).catch(() => { });
            }

            await Promise.all([fetchToday(), fetchMonthly(viewMonth, viewYear)]);
        } catch (e) {
            const code = e.response?.data?.code;
            const msg = e.response?.data?.message || "Punch-in failed";

            if (mountedRef.current) {
                if (code === "DEVICE_NOT_APPROVED") {
                    const respDevice = e.response?.data?.device || {};
                    Swal.fire({
                        icon: "warning",
                        title: "Device Not Approved",
                        text: msg,
                        showCancelButton: true,
                        confirmButtonText: "Request Approval",
                        cancelButtonText: "Not now",
                        confirmButtonColor: "#6366F1",
                        cancelButtonColor: "#6b7280",
                    }).then((result) => {
                        if (result.isConfirmed) {
                            requestDeviceApprovalFlow(
                                respDevice.deviceUUID || deviceUUID,
                                respDevice.productId || productId
                            );
                        }
                    });
                } else {
                    Swal.fire({ icon: "error", title: "Punch-In Failed", text: msg, confirmButtonColor: "#EF4444" });
                }
                await fetchToday();
            }
        } finally {
            if (mountedRef.current) setLoadingIn(false);
        }
    };


    const handlePunchIn = () => {
        if (loadingIn || loadingOut || !!todayRec?.punchIn) return;
        if (!navigator.onLine) { saveOfflinePunch("punch-in"); return; }

        setLoadingIn(true);

        // Device info and GPS fire simultaneously — not sequentially
        Promise.all([getDeviceInfo(), getGPS()])
            .then(([{ deviceUUID, productId }, { lat, lng, accuracy }]) => {
                doPunchIn(lat, lng, accuracy, deviceUUID, productId);
            });
    };

    const handlePunchOut = async () => {
        if (loadingIn || loadingOut || !(todayRec?.punchIn && !todayRec?.punchOut)) return;
        if (!navigator.onLine) { saveOfflinePunch("punch-out"); return; }
        try {
            setLoadingOut(true);
            await API.post("/attendance/punch-out");
            await Promise.all([
                fetchToday(),
                fetchMonthly(viewMonth, viewYear),
            ]);
        } catch (e) {
            if (mountedRef.current) {
                Swal.fire({
                    icon: "error",
                    title: "Punch-Out Failed",
                    text: e.response?.data?.message || "Punch-out failed",
                    confirmButtonColor: "#EF4444",
                });
                await fetchToday();
            }
        } finally {
            if (mountedRef.current) setLoadingOut(false);
        }
    };

    // Add this derived variable — used for stats and history table
    const pastMonthly = monthly.filter(d => {
        const istDateStr = d.dateString
            ? d.dateString
            : new Date(d.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const nowISTStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        return istDateStr <= nowISTStr;
    });

    const summary = monthlySummary || {};

    const fullOnlyCount = summary.present || 0;
    const halfOnlyCount = summary.halfDay || 0;
    const lateOnlyCount = summary.late || 0;
    const absentDays = summary.absent || 0;
    const presentTotal = fullOnlyCount + halfOnlyCount + lateOnlyCount;

    // ✅ FIX: Quota used this month = all late-flagged days (even if they became half-days)
    const quotaUsed = pastMonthly.filter(d => {
        const istStr = d.dateString
            ? d.dateString + "T00:00:00+05:30"
            : new Date(d.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00+05:30";
        const dt = new Date(istStr);
        return d.isLate && (!joiningDate || dt >= joiningDate);
    }).length;
    const quotaRemaining = Math.max(0, MONTHLY_LATE_QUOTA - quotaUsed);
    const quotaExhausted = quotaUsed >= MONTHLY_LATE_QUOTA;

    // ✅ Working days for current viewed month
    const workingDaysFinal = summary.workingDays || 0;

    // ✅ Percentage based on total presence
    const percentage = summary.attendancePercentage || 0;

    const chartData = useMemo(() => {
        return {
            labels: ["Present", "Late", "Half Day", "Leave", "Holiday", "Weekend", "Absent"],
            datasets: [{
                label: "Days",
                data: [
                    summary.present || 0,
                    summary.late || 0,
                    summary.halfDay || 0,
                    summary.leave || 0,
                    summary.holiday || 0,
                    summary.weekend || 0,
                    summary.absent || 0
                ],
                backgroundColor: [
                    STATUS_COLORS.present.solid,
                    STATUS_COLORS.late.solid,
                    STATUS_COLORS.halfday.solid,
                    STATUS_COLORS.leave.solid,
                    STATUS_COLORS.holiday.solid,
                    STATUS_COLORS.weekend.solid,
                    STATUS_COLORS.absent.solid
                ],
                borderRadius: 8,
                borderSkipped: false,
            }],
        };
    }, [summary]);

    const STATUS_MAP = ["present", "late", "half-day", "leave", "holiday", "weekend", "absent"];

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "#221b1b" : "#F3F4F6";
    const tickColor = isDark ? "#6060a0" : "#9CA3AF";
    const xTickColor = isDark ? "#6060a0" : "#6B7280";
    const tooltipBg = isDark ? "#e8e8f5" : "#1A1D23";
    const tooltipText = isDark ? "#0f0f17" : "#ffffff";

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipText,
                bodyColor: tooltipText,
                titleFont: { family: "'DM Sans'", size: 12, weight: "600" },
                bodyFont: { family: "'DM Sans'", size: 12 },
                padding: 10, cornerRadius: 8,
                callbacks: { label: ctx => ` ${ctx.parsed.y} days` },
            },
        },
        onHover: (_, elements) => {
            if (elements.length > 0) {
                setHighlightStatus(STATUS_MAP[elements[0].index]);
            } else {
                setHighlightStatus(null);
            }
        },
        scales: {
            y: { grid: { color: gridColor, drawBorder: false }, ticks: { stepSize: 1, color: tickColor, font: { size: 11 } }, border: { display: false } },
            x: { grid: { display: false }, ticks: { color: xTickColor, font: { size: 11, weight: "600" } }, border: { display: false } },
        },
    };

    // ── Calendar ──
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();

    const getRecord = (day) =>
        monthly.find(d => {
            const dt = new Date(d.date);
            const istStr = dt.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
            const [y, m, dayNum] = istStr.split("-").map(Number);
            return dayNum === day && m === viewMonth && y === viewYear;
        });

    const getHoliday = (day) =>
        holidays.find(h => {
            const dt = new Date(h.date);
            const istStr = dt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
            const [d, m, y] = istStr.split("/").map(Number);
            return d === day && m === viewMonth && y === viewYear;
        });

    const isToday = (day) => day === todayDay && viewMonth === todayMonth && viewYear === todayYear;

    const punchStatus = todayRec
        ? todayRec.punchIn && todayRec.punchOut
            ? { label: "Completed", cls: "pill-green", dot: true }
            : todayRec.punchIn
                ? { label: "Punched In", cls: "pill-blue", dot: true }
                : { label: "Not started", cls: "pill-gray", dot: false }
        : { label: "No record", cls: "pill-gray", dot: false };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(monthly);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `attendance_${MONTHS[viewMonth - 1]}_${viewYear}.xlsx`);
    };

    const exportPDF = async () => {
        const { default: jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold"); doc.setFontSize(16);
        doc.text(`Attendance — ${MONTHS[viewMonth - 1]} ${viewYear}`, 14, 18);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
        ["Date", "Status", "Punch In", "Punch Out"].forEach((h, i) =>
            doc.text(h, [14, 70, 110, 150][i], 30)
        );
        doc.line(14, 32, 196, 32); doc.setTextColor(40);
        monthly.forEach((item, i) => {
            const y = 38 + i * 7;
            doc.text(new Date(item.date).toDateString(), 14, y);
            doc.text(item.status || "-", 70, y);
            doc.text(item.punchIn ? new Date(item.punchIn).toLocaleTimeString() : "—", 110, y);
            doc.text(item.punchOut ? new Date(item.punchOut).toLocaleTimeString() : "—", 150, y);
        });
        doc.save(`attendance_${MONTHS[viewMonth - 1]}_${viewYear}.pdf`);
    };

    // ✅ FIX: Quota label helper
    const getQuotaLabel = () => {
        if (quotaExhausted) return `Quota exhausted — after 10:05 AM = half day`;
        if (quotaUsed === 2) return `1 quota left — use carefully`;
        return `${quotaRemaining} late arrival${quotaRemaining !== 1 ? "s" : ""} remaining`;
    };

    const getQuotaPillClass = () => {
        if (quotaExhausted) return "quota-pill-danger";
        if (quotaUsed >= 2) return "quota-pill-warn";
        return "quota-pill-safe";
    };

    const formatWorkHours = (decimalHours) => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <>
            <style>{`
    ${css}
    .spinner {
        width: 14px; height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        display: inline-block;
        animation: spin 0.6s linear infinite;
        margin-right: 6px;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }`}
            </style>
            <DashboardLayout>
                <div className="att-root">

                    {/* HEADER */}
                    <div className="att-header">
                        <div>
                            <h1>Attendance</h1>
                            <p>{MONTHS[todayMonth - 1]} {todayYear} · {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
                        </div>
                        <div className="att-export-row">
                            <button onClick={exportExcel} className="btn-export btn-excel">
                                <Icon d={icons.excel} size={14} /> Export Excel
                            </button>
                            <button onClick={exportPDF} className="btn-export btn-pdf">
                                <Icon d={icons.pdf} size={14} /> Export PDF
                            </button>
                        </div>
                    </div>

                    {/* PUNCH CARD */}
                    <div className="punch-card">
                        <div>
                            <p className="punch-title">Current Time</p>
                            <LiveClock />
                            <div className="punch-sub">
                                <span className={`status-pill ${punchStatus.cls}`}>
                                    {punchStatus.dot && <span className="punch-dot" />}
                                    {punchStatus.label}
                                </span>
                                {todayRec?.punchIn && (
                                    <span>
                                        In:&nbsp;
                                        <b style={{ color: "#4ADE80" }}>
                                            {new Date(todayRec.punchIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}
                                        </b>
                                        {todayRec?.punchOut && (
                                            <>&nbsp;·&nbsp;Out:&nbsp;
                                                <b style={{ color: "#F87171" }}>
                                                    {new Date(todayRec.punchOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}
                                                </b>
                                            </>
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* ✅ FIX: Late quota display — only show for current month */}
                            {viewMonth === todayMonth && viewYear === todayYear && (
                                <div className="quota-banner">
                                    <span className={`quota-pill ${getQuotaPillClass()}`}>
                                        <Icon d={icons.quota} size={11} color="currentColor" />
                                        Late Quota: {quotaUsed}/{MONTHLY_LATE_QUOTA}
                                    </span>
                                    <div className="quota-bar-wrap">
                                        {Array.from({ length: MONTHLY_LATE_QUOTA }, (_, i) => (
                                            <div
                                                key={i}
                                                className={`quota-bar-dot ${i < quotaUsed ? "used" : "unused"}`}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: ".7rem", color: "#8892A4", zIndex: 1 }}>
                                        {getQuotaLabel()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 23, zIndex: 1, alignItems: "flex-end", marginLeft: "auto" }}>

                            {/* ── Shift-end email reminder toggle ── */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 9,
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.13)",
                                borderRadius: 10, padding: "6px 12px",
                            }}>
                                <span style={{ fontSize: ".75rem", color: "#CBD5E1", fontWeight: 600, whiteSpace: "nowrap" }}>
                                    📧 Shift-end email reminder
                                </span>
                                <button
                                    onClick={handleReminderToggle}
                                    disabled={reminderToggleLoading}
                                    title={shiftReminderEmail ? "Click to disable email reminders" : "Click to enable email reminders"}
                                    style={{
                                        position: "relative", width: 42, height: 24,
                                        borderRadius: 99, border: "none", cursor: reminderToggleLoading ? "not-allowed" : "pointer",
                                        background: shiftReminderEmail ? "#4ADE80" : "rgba(255,255,255,0.18)",
                                        transition: "background 0.25s ease",
                                        flexShrink: 0, padding: 0, outline: "none",
                                        opacity: reminderToggleLoading ? 0.6 : 1,
                                    }}
                                >
                                    <span style={{
                                        position: "absolute", top: 3,
                                        left: shiftReminderEmail ? 21 : 3,
                                        width: 18, height: 18, borderRadius: "50%",
                                        background: "#fff",
                                        transition: "left 0.25s ease",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                                    }} />
                                </button>
                                <span style={{
                                    fontSize: ".72rem", fontWeight: 700, minWidth: 24,
                                    color: shiftReminderEmail ? "#4ADE80" : "#8892A4",
                                }}>
                                    {reminderToggleLoading ? "…" : shiftReminderEmail ? "ON" : "OFF"}
                                </span>
                            </div>

                            {/* Punch buttons */}
                            <div className="punch-btns">
                                <button
                                    onClick={handlePunchIn}
                                    disabled={loadingIn || loadingOut || !!todayRec?.punchIn}
                                    style={loadingIn ? { pointerEvents: "none" } : {}}
                                    className="btn-punch btn-punchin"
                                >
                                    {loadingIn
                                        ? <><span className="spinner" /> Punching In...</>
                                        : <><Icon d={icons.login} size={15} color="#052e16" />{navigator.onLine ? "Punch In" : "Punch In (Offline)"}</>}
                                </button>
                                <button
                                    onClick={navigator.onLine ? handlePunchOut : () => saveOfflinePunch("punch-out")}
                                    disabled={loadingIn || loadingOut || !(todayRec?.punchIn && !todayRec?.punchOut)}
                                    style={loadingOut ? { pointerEvents: "none" } : {}}
                                    className="btn-punch btn-punchout"
                                >
                                    {loadingOut
                                        ? <><span className="spinner" /> Punching Out...</>
                                        : <><Icon d={icons.logout} size={15} />{navigator.onLine ? "Punch Out" : "Punch Out (Offline)"}</>}
                                </button>
                            </div>

                            {/* Notification-blocked warning */}
                            {"Notification" in window && Notification.permission === "denied" && (
                                <div style={{
                                    fontSize: ".72rem",
                                    color: "#FBBf24",
                                    background: "rgba(251,191,36,.1)",
                                    border: "1px solid rgba(251,191,36,.25)",
                                    borderRadius: 8,
                                    padding: "6px 12px",
                                    zIndex: 1,
                                    maxWidth: 260,
                                }}>
                                    🔔 Notifications blocked — enable in browser settings to get shift reminders.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="stats-grid">
                        <div className="stat-box green">
                            <div className="stat-label"><Icon d={icons.percent} size={12} color="#9CA3AF" /> Attendance Rate</div>
                            <div className="stat-value">{percentage}<span>%</span></div>
                            <div className="stat-meta">{presentTotal} of {workingDaysFinal} working days</div>
                        </div>
                        <div className="stat-box orange">
                            <div className="stat-label"><Icon d={icons.cal} size={12} color="#9CA3AF" /> Total Present</div>
                            <div className="stat-value">{presentTotal}<span>/{workingDaysFinal}</span></div>
                            <div className="stat-meta">
                                {fullOnlyCount} full · {halfOnlyCount} half · {lateOnlyCount} late
                            </div>
                        </div>
                        <div className="stat-box red">
                            <div className="stat-label"><Icon d={icons.clock} size={12} color="#9CA3AF" /> Late Arrivals</div>
                            <div className="stat-value">{lateOnlyCount}<span>/{MONTHLY_LATE_QUOTA}</span></div>
                            <div className="stat-meta">
                                {quotaExhausted
                                    ? "⚠️ Quota exhausted — 10:05 AM rule active"
                                    : `${quotaRemaining} quota slot${quotaRemaining !== 1 ? "s" : ""} remaining`}
                            </div>
                        </div>
                    </div>

                    {/* WORK SUMMARY */}
                    {monthlySummary && (
                        <div style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 14,
                            padding: "16px 22px",
                            marginBottom: 24,
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: 12,
                        }}>
                            {/* Section label */}
                            <div style={{ gridColumn: "1 / -1", marginBottom: 4 }}>
                                <span style={{
                                    fontSize: ".68rem", fontWeight: 700,
                                    textTransform: "uppercase", letterSpacing: ".6px",
                                    color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    <Icon d={icons.clock} size={12} color="#6B7280" />
                                    Work Summary — {MONTHS[viewMonth - 1]} {viewYear}
                                </span>
                            </div>

                            {/* Total Hours */}
                            <div style={{ background: "var(--success-bg)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--success)" + "33" }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--success)", marginBottom: 6 }}>
                                    Total Hours
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {Math.floor(monthlySummary.totalWorkHours)}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: 0 }}>
                                        h {Math.round((monthlySummary.totalWorkHours % 1) * 60)}m
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: "var(--success)", marginTop: 4, fontWeight: 500 }}>
                                    across {monthlySummary.workedDays} working days
                                </p>
                                <p style={{ fontSize: ".72rem", color: "var(--brand)", marginTop: 4, fontWeight: 500 }}>
                                    average per worked day
                                </p>
                            </div>

                            {/* Avg Daily Hours */}
                            <div style={{ background: "var(--brand-light)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border-strong)" }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--brand)", marginBottom: 6 }}>
                                    Avg / Day
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {Math.floor(monthlySummary.avgDailyHours)}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: 0 }}>
                                        h {Math.round((monthlySummary.avgDailyHours % 1) * 60)}m
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: "#1D4ED8", marginTop: 4, fontWeight: 500 }}>
                                    average per worked day
                                </p>
                            </div>

                            {/* Expected Shift Hours */}
                            <div style={{ background: "var(--surface-3)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border-strong)" }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)", marginBottom: 6 }}>
                                    Shift Hours
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {Math.floor(monthlySummary.expectedShiftHours || 9)}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: 0 }}>
                                        h {Math.round(((monthlySummary.expectedShiftHours || 9) % 1) * 60)}m
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: "var(--text-3)", marginTop: 4, fontWeight: 500 }}>
                                    expected per day
                                </p>
                            </div>

                            {/* Compliance % */}
                            <div style={{ background: (monthlySummary.compliancePercentage || 0) >= 90 ? "var(--success-bg)" : (monthlySummary.compliancePercentage || 0) >= 75 ? "var(--warn-bg)" : "var(--danger-bg)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${(monthlySummary.compliancePercentage || 0) >= 90 ? "var(--success)" : (monthlySummary.compliancePercentage || 0) >= 75 ? "var(--warn)" : "var(--danger)"}` }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: (monthlySummary.compliancePercentage || 0) >= 90 ? "var(--success)" : (monthlySummary.compliancePercentage || 0) >= 75 ? "#D97706" : "var(--danger)", marginBottom: 6 }}>
                                    Compliance %
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {monthlySummary.compliancePercentage || 0}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: 0 }}>
                                        %
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: (monthlySummary.compliancePercentage || 0) >= 90 ? "#15803D" : (monthlySummary.compliancePercentage || 0) >= 75 ? "#B45309" : "#B91C1C", marginTop: 4, fontWeight: 500 }}>
                                    overall adherence
                                </p>
                            </div>

                            {/* Total Late Minutes */}
                            <div style={{
                                background: monthlySummary.totalLateMinutes > 0 ? "var(--warn-bg)" : "var(--success-bg)",
                                borderRadius: 10, padding: "12px 14px",
                                border: `1px solid ${monthlySummary.totalLateMinutes > 0 ? "var(--warn)" : "var(--success)"}`,
                            }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: monthlySummary.totalLateMinutes > 0 ? "#C2410C" : "#15803D", marginBottom: 6 }}>
                                    Total Late
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {monthlySummary.totalLateMinutes}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: 0 }}>
                                        {" "}min
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: monthlySummary.totalLateMinutes > 0 ? "#C2410C" : "#15803D", marginTop: 4, fontWeight: 500 }}>
                                    {monthlySummary.totalLateMinutes > 0
                                        ? `across ${lateOnlyCount} late day${lateOnlyCount !== 1 ? "s" : ""}`
                                        : "no late arrivals"}
                                </p>
                            </div>
                        </div>
                    )}


                    {/* CHART + CALENDAR */}
                    <div className="bottom-grid">

                        {/* Chart */}
                        <div className="att-card">
                            <div className="card-title">
                                <span className="card-title-icon"><Icon d={icons.chart} size={14} /></span>
                                Monthly Breakdown
                            </div>

                            {/* Summary row — count + label above chart */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
                                {[
                                    { color: STATUS_COLORS.present.solid, label: "Total Present", value: presentTotal, bg: STATUS_COLORS.present.bg },
                                    { color: STATUS_COLORS.present.solid, label: "Full Day", value: fullOnlyCount, bg: STATUS_COLORS.present.bg },
                                    { color: STATUS_COLORS.halfday.solid, label: "Half-Day", value: halfOnlyCount, bg: STATUS_COLORS.halfday.bg },
                                    { color: STATUS_COLORS.absent.solid, label: "Absent", value: absentDays, bg: STATUS_COLORS.absent.bg },
                                ].map(s => (
                                    <div key={s.label} style={{
                                        background: isDark ? `${s.color}15` : s.bg,
                                        borderRadius: 10,
                                        padding: "10px 8px",
                                        textAlign: "center",
                                        border: `1.5px solid ${s.color}33`,
                                    }}>
                                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                        <div style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--text-2)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ height: 200 }} onMouseLeave={() => setHighlightStatus(null)}>
                                <Bar data={chartData} options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        datalabels: undefined,
                                    },
                                }} />
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="att-card">
                            <div className="card-title">
                                <span className="card-title-icon"><Icon d={icons.cal} size={14} /></span>
                                Attendance Calendar
                            </div>

                            <CalNav
                                viewMonth={viewMonth}
                                viewYear={viewYear}
                                onChange={(m, y) => { setViewMonth(m); setViewYear(y); }}
                            />

                            <div className="cal-day-names">
                                {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                            </div>

                            <div className="cal-cells">
                                {Array.from({ length: firstWeekday }, (_, i) =>
                                    <div key={`e${i}`} className="cal-cell empty" />
                                )}

                                {Array.from({ length: daysInMonth }, (_, i) => {
                                    const day = i + 1;
                                    const currentDate = new Date(viewYear, viewMonth - 1, day);
                                    const rec = getRecord(day);
                                    const holiday = getHoliday(day);
                                    const today = isToday(day);
                                    const weekend = isWeekend(currentDate);
                                    const isFuture = currentDate > now && !today;

                                    const nowIST = new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata", hour12: false });
                                    const nowHourIST = parseInt(nowIST.split(", ")[1]?.split(":")[0] ?? "0", 10);
                                    const isWorkInProgress = today && nowHourIST < 19;

                                    let sCls = "";
                                    const currentDateIST = new Date(
                                        new Date(viewYear, viewMonth - 1, day)
                                            .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
                                        + "T00:00:00+05:30"
                                    );
                                    const isBeforeJoining = joiningDate && currentDateIST < joiningDate;
                                    if (holiday) {
                                        sCls = "s-holiday";
                                    } else if (weekend) {
                                        sCls = "s-weekend";  // always show weekend color, past AND future
                                    } else if (isBeforeJoining || isFuture) {
                                        sCls = "";           // blank for future non-weekend, non-holiday days
                                    } else if (rec) {
                                        if (rec.status === "leave" || rec.onLeave || rec.leaveApproved) {
                                            sCls = "s-leave";
                                        } else if (rec.status === "absent" || (!rec.punchIn && !rec.punchOut)) {
                                            sCls = "s-absent";
                                        } else if (rec.isHalfDay) {
                                            sCls = "s-halfday";
                                        } else if (rec.isLate) {
                                            sCls = "s-late";
                                        } else {
                                            sCls = "s-present";
                                        }
                                    } else if (!isWorkInProgress) {
                                        sCls = "s-absent";
                                    }

                                    // const isBeforeJoining = joiningDate && currentDate < joiningDate;
                                    const hasRecord =
                                        !isBeforeJoining &&
                                        !isFuture &&
                                        !!(rec || holiday || weekend || sCls === "s-absent");

                                    const noStatus = !sCls ? "no-status" : "";

                                    // Map sCls → which highlight bucket it belongs to
                                    const cellStatusKey =
                                        sCls === "s-present" ? "present" :
                                            sCls === "s-halfday" ? "half-day" :
                                                sCls === "s-late" ? "late" :
                                                    sCls === "s-absent" ? "absent" : null;

                                    const hlClass =
                                        highlightStatus && cellStatusKey
                                            ? cellStatusKey === highlightStatus
                                                ? `hl-${highlightStatus}`   // this cell matches — glow it
                                                : "hl-dim"                  // another bar is hovered — fade it
                                            : "";

                                    const cls = ["cal-cell", sCls, today ? "is-today" : "", noStatus, hasRecord ? "has-record" : "", hlClass]
                                        .filter(Boolean).join(" ");

                                    return (
                                        <div
                                            key={day}
                                            className={cls}
                                            onClick={() => {
                                                const isBeforeJoining = joiningDate && currentDate < joiningDate;

                                                if (isBeforeJoining) return;
                                                if (isFuture && !holiday) return;

                                                if (holiday) {
                                                    setSelected({ ...holiday, type: "holiday", date: holiday.date || currentDate.toISOString() });
                                                } else if (weekend) {
                                                    setSelected({ type: "weekend", date: currentDate.toISOString(), day: DAYS[currentDate.getDay()] });
                                                } else if (rec) {
                                                    setSelected(rec);
                                                } else {
                                                    setSelected({
                                                        date: currentDate.toISOString(),
                                                        status: "absent",
                                                    });
                                                }
                                            }}
                                            title={
                                                holiday ? `Holiday: ${holiday.name}`
                                                    : weekend ? `Weekend: ${DAYS[currentDate.getDay()]}`
                                                        : rec ? `${rec.status}${rec.isLate ? " · Late" : ""}${rec.isHalfDay ? " · Half Day" : ""}`
                                                            : joiningDate && currentDate < joiningDate
                                                                ? "Not joined yet"
                                                                : isWorkInProgress
                                                                    ? "Today — not yet punched in"
                                                                    : `${day} ${MONTHS[viewMonth - 1]} — No record`
                                            }
                                        >
                                            {day}
                                            {(hasRecord || today) && !isFuture && <span className="cal-dot" />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="cal-legend">
                                <div className="leg-item"><span className="leg-swatch present" /><span>Present</span></div>
                                <div className="leg-item"><span className="leg-swatch late" /><span>Late</span></div>
                                <div className="leg-item"><span className="leg-swatch halfday" /><span>Half-day</span></div>
                                <div className="leg-item"><span className="leg-swatch holiday" /><span>Holiday</span></div>
                                <div className="leg-item"><span className="leg-swatch weekend" /><span>Weekend</span></div>
                                <div className="leg-item"><span className="leg-swatch absent" /><span>Absent</span></div>
                                <div className="leg-item"><span className="leg-swatch leave" /><span>Leave</span></div>
                                <div className="leg-item"><span className="leg-swatch today" /><span>Today</span></div>
                            </div>
                        </div>
                    </div>

                    {/* HISTORY TABLE */}
                    <div className="att-card">
                        <div className="card-title">
                            <span className="card-title-icon"><Icon d={icons.clock} size={14} /></span>
                            Attendance History — {MONTHS[viewMonth - 1]} {viewYear}
                        </div>
                        <div className="att-table-wrap">
                            <table className="att-table">
                                <thead>
                                    <tr>
                                        <th>Date</th><th>Day</th><th>Punch In</th>
                                        <th>Punch Out</th><th>Work Hrs</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pastMonthly.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: "2.5rem" }}>
                                                No records for {MONTHS[viewMonth - 1]} {viewYear}
                                            </td>
                                        </tr>
                                    )}
                                    {[...pastMonthly].reverse().map(item => {
                                        const d = new Date(item.date);
                                        // FIX #13: surface eightHourPassUsed visually in the history table
                                        const hasCompletedPunches = !!(item.punchIn && item.punchOut);
                                        const isGenuinelyAbsent =
                                            item.status === "absent" && !hasCompletedPunches;

                                        const badgeCls =
                                            item.status === "holiday" ? "holiday" :
                                                item.status === "weekend" ? "weekend" :
                                                    item.status === "leave" || item.onLeave || item.leaveApproved ? "leave" :
                                                        item.isHalfDay ? "half-day" :
                                                            item.isShortLeave ? "short-leave" :
                                                                item.isLate ? "late" :
                                                                    item.eightHourPassUsed ? "pass" :
                                                                        isGenuinelyAbsent ? "absent" :
                                                                            "present";

                                        const badgeLabel =
                                            item.status === "holiday" ? "Holiday" :
                                                item.status === "weekend" ? "Weekend" :
                                                    item.status === "leave" || item.onLeave || item.leaveApproved ? "On Leave" :
                                                        item.isHalfDay ? "Half Day" :
                                                            item.isShortLeave ? "Short Leave" :
                                                                item.isLate ? `Late (+${item.lateMinutes}m)` :
                                                                    item.eightHourPassUsed ? "Present (8h Pass)" :
                                                                        isGenuinelyAbsent ? "Absent" :
                                                                            "Present";
                                        return (
                                            <tr key={item.dateString || item.date} onClick={() => setSelected(item)}>
                                                <td style={{ fontWeight: 600, color: "var(--text-1)" }}>
                                                    {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td style={{ color: "var(--text-3)" }}>
                                                    {d.toLocaleDateString("en-IN", { weekday: "short" })}
                                                </td>
                                                <td>
                                                    {item.punchIn
                                                        ? <span className="time-chip"><Icon d={icons.login} size={11} color="#059669" />{new Date(item.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                        : <span style={{ color: "var(--border-strong)" }}>—</span>}
                                                </td>
                                                <td>
                                                    {item.punchOut
                                                        ? <span className="time-chip"><Icon d={icons.logout} size={11} color="#DC2626" />{new Date(item.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                        : <span style={{ color: "var(--border-strong)" }}>—</span>}
                                                </td>



                                                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: ".78rem", color: "var(--text-2)" }}>
                                                    {item.workHours ? formatWorkHours(item.workHours) : "—"}
                                                </td>



                                                <td>
                                                    <span className={`tbadge ${badgeCls}`}>{badgeLabel}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* FIX: Pass holidays to AttendanceModal for real holiday detection */}
                <AttendanceModal
                    data={selected}
                    onClose={() => setSelected(null)}
                    holidays={holidays}
                />
            </DashboardLayout >
        </>
    );
};

export default Attendance;