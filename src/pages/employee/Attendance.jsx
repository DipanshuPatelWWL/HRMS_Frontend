import { useEffect, useState, useMemo, useRef } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AttendanceModal from "../../components/common/AttendanceModal";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
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

const css = `
.att-root *, .att-root *::before, .att-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.att-root {
    font-family: 'DM Sans', sans-serif;
    background: #F4F6FA;
    color: #1A1D23;
    min-height: 100vh;
    padding-bottom: 40px;
}

/* HEADER */
.att-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.att-header h1 { font-size: 1.55rem; font-weight: 700; letter-spacing: -.4px; color: #111318; }
.att-header p  { font-size: .8rem; color: #494c52; margin-top: 3px; }
.att-export-row { display: flex; gap: 8px; }
.btn-export {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; font-size: .8rem; font-weight: 600;
    cursor: pointer; transition: all .15s; border: 1.5px solid transparent; font-family: inherit;
}
.btn-excel { background: #F0FDF4; color: #15803D; border-color: #BBF7D0; }
.btn-excel:hover { background: #DCFCE7; }
.btn-pdf   { background: #FFF1F2; color: #BE123C; border-color: #FECDD3; }
.btn-pdf:hover { background: #FFE4E6; }

/* PUNCH CARD */
.punch-card {
    background: linear-gradient(135deg, #1A1D23 0%, #2D3142 100%);
    border-radius: 16px; padding: 24px 28px;
    display: flex; justify-content: space-between; align-items: center;
    gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
    position: relative; overflow: hidden;
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
.stat-box { background:#fff; border-radius:14px; padding:20px 22px; border:1px solid #E8EBF0; position:relative; overflow:hidden; }
.stat-box::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
.stat-box.green::before  { background:linear-gradient(90deg,#4ADE80,#22C55E); }
.stat-box.orange::before { background:linear-gradient(90deg,#FB923C,#F97316); }
.stat-box.red::before    { background:linear-gradient(90deg,#F87171,#EF4444); }
.stat-label { font-size:.71rem; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:rgba(95, 92, 92, 0.9); margin-bottom:10px; display:flex; align-items:center; gap:6px; }
.stat-value { font-size:2.4rem; font-weight:700; letter-spacing:-1.5px; line-height:1; color:#111318; }
.stat-value span { font-size:.95rem; font-weight:500; color:#9CA3AF; letter-spacing:0; }
.stat-meta { font-size:.75rem; color:#9CA3AF; margin-top:6px; }

/* LAYOUT */
.bottom-grid { display:grid; grid-template-columns:1fr 1.5fr; gap:20px; margin-bottom:24px; }
@media(max-width:860px){ .bottom-grid{ grid-template-columns:1fr; } }
.att-card { background:#fff; border-radius:14px; border:1px solid #E8EBF0; padding:22px 24px; }
.card-title { font-size:.875rem; font-weight:700; color:#111318; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
.card-title-icon { width:28px; height:28px; border-radius:8px; background:#F4F6FA; display:flex; align-items:center; justify-content:center; color:#6B7280; flex-shrink:0; }

/* CALENDAR NAV */
.cal-nav { display:flex; align-items:center; gap:8px; margin-bottom:12px; padding-bottom:12px; border-top:1.5px solid #F0F1F5; }
.cal-nav-arrow { width:32px; height:32px; border-radius:8px; border:1.5px solid #E8EBF0; background:#FAFAFA; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#374151; transition:all .15s; flex-shrink:0; }
.cal-nav-arrow:hover { background:#F3F4F6; border-color:#D1D5DB; }
.cal-nav-center { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; }
.cal-select { -webkit-appearance:none; appearance:none; border:1.5px solid #E8EBF0; border-radius:8px; padding:5px 10px; font-size:.82rem; font-weight:600; color:#111318; background:#FAFAFA; cursor:pointer; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .15s; }
.cal-select:focus { border-color:#6366F1; background:#fff; }
.cal-today-btn { padding:5px 12px; border-radius:7px; font-size:.75rem; font-weight:700; border:1.5px solid #C7D2FE; background:#EEF2FF; color:#4F46E5; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; white-space:nowrap; }
.cal-today-btn:hover { background:#E0E7FF; }

/* CALENDAR GRID */
.cal-day-names { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:4px; }
.cal-day-name { text-align:center; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:rgb(73, 71, 71); padding:4px 0; }
.cal-cells { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.cal-cell { height:46px; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; font-size:.83rem; font-weight:500; color:#6B7280; background:#F8F9FB; border:1.5px solid #ECEEF2; cursor:default; transition:transform .12s, box-shadow .12s; user-select:none; line-height:1; }
.cal-cell.empty { background:transparent; border-color:transparent; pointer-events:none; }
.cal-cell.has-record { cursor:pointer; }
.cal-cell.has-record:hover { transform:scale(1.08); z-index:2; box-shadow:0 4px 14px rgba(0,0,0,.12); }
.cal-cell.s-present { background:#D1FAE5; border-color:#6EE7B7; color:#065F46; font-weight:700; }
.cal-cell.s-absent  { background:#c5d6f3; border-color:#85b2f5; color:#07316d; font-weight:600; }
.cal-cell.s-weekend { background:#F3E8FF; border-color:#D8B4FE; color:#6B21A8; font-weight:600; }
.cal-cell.s-late    { background:#FEE2E2; border-color:#FCA5A5; color:#7F1D1D; font-weight:700; }
.cal-cell.s-halfday { background:#FEF3C7; border-color:#FCD34D; color:#78350F; font-weight:700; }
.cal-cell.s-holiday { background:#FDF4FF; border-color:#D946EF; color:#701A75; font-weight:700;  }
.cal-cell.is-today  { box-shadow: 0 0 0 2.5px #6366F1, 0 2px 8px rgba(99,102,241,.2) !important; border-color:#6366F1 !important; }
.cal-cell.is-today.no-status { background:#EEF2FF; color:#3730A3; font-weight:700; }
.cal-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; box-shadow:0 0 0 1.5px rgba(0,0,0,.08); }
.cal-cell.s-present  .cal-dot { background:#047857; }
.cal-cell.s-late     .cal-dot { background:#B91C1C; }
.cal-cell.s-halfday  .cal-dot { background:#B45309; }
.cal-cell.s-holiday  .cal-dot { background:#D946EF; }
.cal-cell.s-weekend  .cal-dot { background:#6D28D9; }
.cal-cell.s-absent   .cal-dot { background:#3B6CB7; }
.cal-cell.is-today.no-status .cal-dot { background:#4338CA; }
.cal-legend { display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:14px; padding-top:12px; border-top:1.5px solid #F0F1F5; }
.leg-item { display:flex; align-items:center; gap:6px; font-size:.73rem; font-weight:600; color:#374151; }
.leg-swatch { width:14px; height:14px; border-radius:4px; border:1.5px solid transparent; flex-shrink:0; }
.leg-swatch.present { background:#D1FAE5; border-color:#6EE7B7; }
.leg-swatch.late    { background:#FEE2E2; border-color:#FCA5A5; }
.leg-swatch.halfday { background:#FEF3C7; border-color:#FCD34D; }
.leg-swatch.holiday { background:#FDF4FF; border-color:#D946EF; }
.leg-swatch.weekend { background:#F3E8FF; border-color:#D8B4FE; }
.leg-swatch.absent  { background:#c5d6f3; border-color:#85b2f5; }
.leg-swatch.today   { background:#EEF2FF; border-color:#6366F1; }

/* Chart highlight pulse */
.cal-cell.hl-present  { outline: 2.5px solid #22C55E; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(74,222,128,.25); }
.cal-cell.hl-half-day { outline: 2.5px solid #EAB308; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(253,224,71,.25); }
.cal-cell.hl-late     { outline: 2.5px solid #EF4444; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(248,113,113,.25); }
.cal-cell.hl-absent   { outline: 2.5px solid #93C5FD; outline-offset: 2px; transform: scale(1.12); z-index: 3; box-shadow: 0 0 0 4px rgba(147,197,253,.25); }
.cal-cell.hl-dim { opacity: 0.3; transform: scale(0.96); }

/* Chart type toggle */
.chart-toggle { display:flex; gap:4px; background:#F4F6FA; border-radius:9px; padding:3px; }
.chart-toggle-btn {
    display:flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:7px; font-size:.75rem; font-weight:700;
    border:none; cursor:pointer; font-family:'DM Sans',sans-serif;
    transition:all .18s; color:#6B7280; background:transparent;
}
.chart-toggle-btn.active { background:#fff; color:#111318; box-shadow:0 1px 4px rgba(0,0,0,.1); }
.chart-toggle-btn:hover:not(.active) { color:#374151; }

/* Donut legend */
.donut-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; height:220px; position:relative; }
.donut-legend { display:flex; flex-direction:column; gap:7px; width:100%; margin-top:14px; }
.donut-legend-row { display:flex; align-items:center; justify-content:space-between; font-size:.78rem; }
.donut-legend-left { display:flex; align-items:center; gap:7px; font-weight:600; color:#374151; }
.donut-legend-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
.donut-legend-val { font-weight:700; color:#111318; font-family:'DM Mono',monospace; font-size:.78rem; }

/* TABLE */
.att-table-wrap { overflow-x:auto; margin-top:4px; }
.att-table { width:100%; border-collapse:collapse; font-size:.83rem; }
.att-table thead tr { border-bottom:1.5px solid #E8EBF0; }
.att-table th { text-align:left; padding:8px 14px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#2f3032; white-space:nowrap; }
.att-table td { padding:13px 14px; border-bottom:1px solid #F3F4F6; color:#374151; vertical-align:middle; }
.att-table tbody tr { cursor:pointer; transition:background .1s; }
.att-table tbody tr:hover { background:#F9FAFB; }
.att-table tbody tr:last-child td { border-bottom:none; }
.tbadge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:6px; font-size:.72rem; font-weight:700; }
.tbadge.pass { background: #EDE9FE; color: #5B21B6; }
.tbadge.present  { background:#D1FAE5; color:#065F46; }
.tbadge.late     { background:#FEE2E2; color:#7F1D1D; }
.tbadge.half-day { background:#FEF3C7; color:#78350F; }
.tbadge.absent   { background:#c5d6f3; color:#1e3a8a; }
.tbadge.holiday  { background:#DBEAFE; color:#1E3A8A; }
.tbadge.weekend  { background:#F3E8FF; color:#6B21A8; }
.time-chip { display:inline-flex; align-items:center; gap:4px; font-family:'DM Mono',monospace; font-size:.76rem; color:#374151; background:#F3F4F6; padding:3px 8px; border-radius:5px; }
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

    useEffect(() => { viewMonthRef.current = viewMonth; }, [viewMonth]);
    useEffect(() => { viewYearRef.current = viewYear; }, [viewYear]);

    const nowIST = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const [todayYear, todayMonth, todayDay] = nowIST.split("-").map(Number);
    const { user } = useContext(AuthContext);
    const [shiftEndMinutes, setShiftEndMinutes] = useState(null);


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
                // No record for today — check if there's an open overnight punch-in
                // (backend /today only returns today's dateString record).
                // If null, keep todayRec as null; punch-out button stays disabled.
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

        // Request browser notification permission on first load
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
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

    const doPunchIn = async (latitude = null, longitude = null, accuracy = null) => {
        try {
            let deviceUUID = "";
            let productId = "";

            // Step 1: Try Electron IPC (when running inside Electron window)
            if (window.hrmsAgent?.getDeviceInfo) {
                try {
                    const info = await window.hrmsAgent.getDeviceInfo();
                    deviceUUID = info?.deviceUUID || "";
                    productId = info?.productId || "";
                } catch (e) {
                    console.warn("IPC bridge failed:", e);
                }
            }

            // Step 2: Fallback — call local token server (browser tab on same PC)
            // This is the key fix: website punch-in on the office PC works via agent
            if (!deviceUUID || !productId) {
                try {
                    const agentBase = window.hrmsAgent?.getAgentConfig
                        ? (await window.hrmsAgent.getAgentConfig()).tokenServerUrl
                        : "http://127.0.0.1:57373";

                    const r = await fetch(`${agentBase}/get-device-info`, {
                        method: "GET",
                        signal: (() => { const c = new AbortController(); setTimeout(() => c.abort(), 3000); return c.signal; })(),
                    });
                    if (r.ok) {
                        const info = await r.json();
                        deviceUUID = info?.deviceUUID || "";
                        productId = info?.productId || "";
                    }
                } catch (e) {
                    console.warn("Agent token server unreachable:", e.message);
                }
            }

            const payload = {
                deviceId: navigator.userAgent,
                ...(deviceUUID && productId
                    ? { deviceUUID, productId }
                    : {}),
                ...(latitude !== null && longitude !== null
                    ? { lat: latitude, lng: longitude, accuracy: accuracy ?? 0 }
                    : {}),
            };

            await API.post("/attendance/punch-in", payload);

            await Promise.all([
                fetchToday(),
                fetchMonthly(viewMonth, viewYear),
            ]);
        } catch (e) {
            const msg = e.response?.data?.message || "Punch-in failed";
            Swal.fire({
                icon: "error",
                title: "Punch-In Failed",
                text: msg,
                confirmButtonColor: "#EF4444",
            });
            await fetchToday();
        } finally {
            setLoadingIn(false);
        }
    };

    const handlePunchIn = () => {
        if (loadingIn || loadingOut || !!todayRec?.punchIn) return;
        if (!navigator.onLine) { saveOfflinePunch("punch-in"); return; }

        setLoadingIn(true); // ← spin immediately, before GPS resolves

        if (!navigator.geolocation) {
            doPunchIn(null, null, null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                doPunchIn(coords.latitude, coords.longitude, coords.accuracy);
            },
            (err) => {
                console.warn("GPS unavailable:", err.message);
                doPunchIn(null, null, null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
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
            Swal.fire({
                icon: "error",
                title: "Punch-Out Failed",
                text: e.response?.data?.message || "Punch-out failed",
                confirmButtonColor: "#EF4444",
            });
            await fetchToday();
        } finally {
            setLoadingOut(false);
        }
    };

    // Add this derived variable — used for stats and history table
    const pastMonthly = monthly.filter(d => {
        const istDateStr = new Date(d.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const nowISTStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        return istDateStr <= nowISTStr;
    });

    // ── Stats ──
    const presentDays = pastMonthly.filter(d => {
        const dt = new Date(d.date);
        return (d.status === "present" || d.status === "half-day" || d.isHalfDay || d.isLate)
            && (!joiningDate || dt >= joiningDate);
    }).length;

    const halfDays = pastMonthly.filter(d => {
        const dt = new Date(d.date);
        return d.isHalfDay && (!joiningDate || dt >= joiningDate);
    }).length;
    // ✅ FIX: Count only isLate=true records (not half-days which have isLate=false)
    const lateDays = pastMonthly.filter(d => {
        const dt = new Date(d.date);
        return d.isLate && (!joiningDate || dt >= joiningDate);
    }).length;

    const absentDays = pastMonthly.filter(d => {
        const dt = new Date(d.date);
        return d.status === "absent" && (!joiningDate || dt >= joiningDate);
    }).length;

    // ✅ FIX: Quota used this month = lateDays (isLate=true count)
    const quotaUsed = lateDays;
    const quotaRemaining = Math.max(0, MONTHLY_LATE_QUOTA - quotaUsed);
    const quotaExhausted = quotaUsed >= MONTHLY_LATE_QUOTA;

    // ✅ Working days for current viewed month
    const totalDaysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const workingDays = Array.from({ length: totalDaysInMonth }, (_, i) => {
        const date = new Date(viewYear, viewMonth - 1, i + 1);
        return !isWeekend(date);
    }).filter(Boolean).length;

    const workingDaysFinal = workingDays - holidays.length;

    // ✅ FIX: absentDays — half days count as 0.5 present, still not absent

    const eligibleWorkingDays = joiningDate
        ? Array.from({ length: totalDaysInMonth }, (_, i) => {
            const date = new Date(viewYear, viewMonth - 1, i + 1);
            return !isWeekend(date) && date >= joiningDate;
        }).filter(Boolean).length - holidays.length
        : workingDaysFinal;

    const percentage = workingDaysFinal
        ? Math.min(100, (presentDays / workingDaysFinal) * 100).toFixed(1)
        : 0;

    const chartData = useMemo(() => ({
        labels: ["Present", "Half-Day", "Late", "Absent"],
        datasets: [{
            label: "Days",
            data: [presentDays, halfDays, lateDays, absentDays],
            backgroundColor: ["#4ADE80", "#FDE047", "#F87171", "#c5d6f3"],
            hoverBackgroundColor: ["#22C55E", "#EAB308", "#EF4444", "#60A5FA"],
            borderRadius: 8,
            borderSkipped: false,
        }],
    }), [presentDays, halfDays, lateDays, absentDays]);

    const STATUS_MAP = ["present", "half-day", "late", "absent"];

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1A1D23",
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
            y: { grid: { color: "#F3F4F6", drawBorder: false }, ticks: { stepSize: 1, color: "#9CA3AF", font: { size: 11 } }, border: { display: false } },
            x: { grid: { display: false }, ticks: { color: "#6B7280", font: { size: 11, weight: "600" } }, border: { display: false } },
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

    const exportPDF = () => {
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
                    </div>

                    {/* STATS */}
                    <div className="stats-grid">
                        <div className="stat-box green">
                            <div className="stat-label"><Icon d={icons.percent} size={12} color="#9CA3AF" /> Attendance Rate</div>
                            <div className="stat-value">{percentage}<span>%</span></div>
                            <div className="stat-meta">{presentDays} of {workingDaysFinal} working days</div>
                        </div>
                        <div className="stat-box orange">
                            <div className="stat-label"><Icon d={icons.cal} size={12} color="#9CA3AF" /> Present Days</div>
                            <div className="stat-value">{presentDays}<span>/{workingDaysFinal}</span></div>
                            <div className="stat-meta">
                                {halfDays} half-day{halfDays !== 1 ? "s" : ""} · {lateDays} late · {absentDays} absent
                            </div>
                        </div>
                        <div className="stat-box red">
                            <div className="stat-label"><Icon d={icons.clock} size={12} color="#9CA3AF" /> Late Arrivals</div>
                            <div className="stat-value">{lateDays}<span>/{MONTHLY_LATE_QUOTA}</span></div>
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
                            background: "#fff",
                            border: "1px solid #E8EBF0",
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
                                    color: "#374151", display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    <Icon d={icons.clock} size={12} color="#6B7280" />
                                    Work Summary — {MONTHS[viewMonth - 1]} {viewYear}
                                </span>
                            </div>

                            {/* Total Hours */}
                            <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "12px 14px", border: "1px solid #BBF7D0" }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "#15803D", marginBottom: 6 }}>
                                    Total Hours
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111318", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {Math.floor(monthlySummary.totalWorkHours)}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "#6B7280", letterSpacing: 0 }}>
                                        h {Math.round((monthlySummary.totalWorkHours % 1) * 60)}m
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: "#15803D", marginTop: 4, fontWeight: 500 }}>
                                    across {monthlySummary.workedDays} working days
                                </p>
                            </div>

                            {/* Avg Daily Hours */}
                            <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "12px 14px", border: "1px solid #BFDBFE" }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "#1D4ED8", marginBottom: 6 }}>
                                    Avg / Day
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111318", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {Math.floor(monthlySummary.avgDailyHours)}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "#6B7280", letterSpacing: 0 }}>
                                        h {Math.round((monthlySummary.avgDailyHours % 1) * 60)}m
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: "#1D4ED8", marginTop: 4, fontWeight: 500 }}>
                                    average per worked day
                                </p>
                            </div>

                            {/* Total Late Minutes */}
                            <div style={{
                                background: monthlySummary.totalLateMinutes > 0 ? "#FFF7ED" : "#F0FDF4",
                                borderRadius: 10, padding: "12px 14px",
                                border: `1px solid ${monthlySummary.totalLateMinutes > 0 ? "#FED7AA" : "#BBF7D0"}`,
                            }}>
                                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: monthlySummary.totalLateMinutes > 0 ? "#C2410C" : "#15803D", marginBottom: 6 }}>
                                    Total Late
                                </p>
                                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111318", letterSpacing: "-1px", lineHeight: 1 }}>
                                    {monthlySummary.totalLateMinutes}
                                    <span style={{ fontSize: ".85rem", fontWeight: 500, color: "#6B7280", letterSpacing: 0 }}>
                                        {" "}min
                                    </span>
                                </p>
                                <p style={{ fontSize: ".72rem", color: monthlySummary.totalLateMinutes > 0 ? "#C2410C" : "#15803D", marginTop: 4, fontWeight: 500 }}>
                                    {monthlySummary.totalLateMinutes > 0
                                        ? `across ${lateDays} late day${lateDays !== 1 ? "s" : ""}`
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
                            <div style={{ height: 220 }} onMouseLeave={() => setHighlightStatus(null)}>
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                                {[
                                    { color: "#4ADE80", label: "Present" },
                                    { color: "#FDE047", label: "Half-Day" },
                                    { color: "#F87171", label: "Late" },
                                    { color: "#c5d6f3", label: "Absent" },
                                ].map(l => (
                                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".72rem", color: "#6B7280", fontWeight: 500 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: "inline-block" }} />
                                        {l.label}
                                    </div>
                                ))}
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

                                    const nowHourIST = parseInt(
                                        new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false })
                                    );
                                    const isWorkInProgress = today && nowHourIST < 19;

                                    let sCls = "";
                                    const currentDateIST = new Date(
                                        new Date(viewYear, viewMonth - 1, day).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
                                    );
                                    const isBeforeJoining = joiningDate && currentDateIST < joiningDate;
                                    if (holiday) {
                                        sCls = "s-holiday";
                                    } else if (isFuture) {
                                        sCls = "";
                                    } else if (weekend) {
                                        sCls = "s-weekend";
                                    } else if (rec) {
                                        if (!isBeforeJoining) {
                                            if (rec.status === "absent" || (!rec.punchIn && !rec.punchOut)) {
                                                sCls = "s-absent";
                                            } else if (rec.isHalfDay) {
                                                sCls = "s-halfday";
                                            } else if (rec.isLate) {
                                                sCls = "s-late";
                                            } else {
                                                sCls = "s-present";
                                            }
                                        }
                                    } else if (!isWorkInProgress && !isBeforeJoining) {
                                        sCls = "s-absent";
                                    }

                                    // const isBeforeJoining = joiningDate && currentDate < joiningDate;

                                    const hasRecord =
                                        !isBeforeJoining &&
                                        !!(rec || holiday || (!isFuture && (weekend || sCls === "s-absent")));

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
                                            {(hasRecord || today) && <span className="cal-dot" />}
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
                                            <td colSpan={6} style={{ textAlign: "center", color: "#9CA3AF", padding: "2.5rem" }}>
                                                No records for {MONTHS[viewMonth - 1]} {viewYear}
                                            </td>
                                        </tr>
                                    )}
                                    {pastMonthly.map(item => {
                                        const d = new Date(item.date);
                                        // FIX #13: surface eightHourPassUsed visually in the history table
                                        const badgeCls =
                                            item.status === "holiday" ? "holiday" :
                                                item.status === "weekend" ? "weekend" :
                                                    item.isHalfDay ? "half-day" :
                                                        item.isLate ? "late" :
                                                            item.eightHourPassUsed ? "pass" :   // ✅ distinct purple badge
                                                                item.status === "present" ? "present" :
                                                                    "absent";

                                        const badgeLabel =
                                            item.status === "holiday" ? "Holiday" :
                                                item.status === "weekend" ? "Weekend" :
                                                    item.isHalfDay ? "Half Day" :
                                                        item.isLate ? `Late (+${item.lateMinutes}m)` :
                                                            item.eightHourPassUsed ? "Present (8h Pass)" :
                                                                item.status === "present" ? "Present" :
                                                                    "Absent";
                                        return (
                                            <tr key={item._id} onClick={() => setSelected(item)}>
                                                <td style={{ fontWeight: 600, color: "#111318" }}>
                                                    {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td style={{ color: "#9CA3AF" }}>
                                                    {d.toLocaleDateString("en-IN", { weekday: "short" })}
                                                </td>
                                                <td>
                                                    {item.punchIn
                                                        ? <span className="time-chip"><Icon d={icons.login} size={11} color="#059669" />{new Date(item.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                        : <span style={{ color: "#D1D5DB" }}>—</span>}
                                                </td>
                                                <td>
                                                    {item.punchOut
                                                        ? <span className="time-chip"><Icon d={icons.logout} size={11} color="#DC2626" />{new Date(item.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                        : <span style={{ color: "#D1D5DB" }}>—</span>}
                                                </td>



                                                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: ".78rem", color: "#4B5563" }}>
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

                {/* ✅ FIX: Pass holidays to AttendanceModal for real holiday detection */}
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