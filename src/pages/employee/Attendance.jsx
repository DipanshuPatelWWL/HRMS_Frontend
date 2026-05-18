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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

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

const IS_DEV = import.meta.env.DEV;
const OFFICE_LAT = 28.61597;
const OFFICE_LNG = 77.37919;

const Attendance = () => {
    const now = new Date();
    const [todayRec, setTodayRec] = useState(null);
    const [monthly, setMonthly] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [holidays, setHolidays] = useState([]);
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [monthlySummary, setMonthlySummary] = useState(null);
    const viewMonthRef = useRef(now.getMonth() + 1);
    const viewYearRef = useRef(now.getFullYear());

    useEffect(() => { viewMonthRef.current = viewMonth; }, [viewMonth]);
    useEffect(() => { viewYearRef.current = viewYear; }, [viewYear]);

    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;
    const todayYear = now.getFullYear();
    const { user } = useContext(AuthContext);


    const fetchToday = async () => {
        try {
            const r = await API.get("/attendance/today");
            const rec = r.data.attendance;
            if (Array.isArray(rec)) {
                const open = rec.find(a => a.punchIn && !a.punchOut);
                const completed = rec.find(a => a.punchIn && a.punchOut);
                setTodayRec(open || completed || rec[rec.length - 1]);
            } else {
                setTodayRec(rec);
            }
        } catch {
        }
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
    const joiningDate = user?.joiningDate
        ? new Date(new Date(user.joiningDate).setHours(0, 0, 0, 0))
        : null;

    const saveOfflinePunch = (type) => {
        const q = JSON.parse(localStorage.getItem("punchQueue") || "[]");
        q.push({ type, timestamp: new Date().toISOString() });
        localStorage.setItem("punchQueue", JSON.stringify(q));
        alert("No internet — punch saved offline. Will sync when reconnected.");
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
        window.addEventListener("online", syncOfflinePunches);

        const onFocus = () => {
            fetchToday();
            // Reads from ref — always the current month/year
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

    const doPunchIn = async (latitude, longitude, accuracy) => {
        try {
            setLoading(true);
            await API.post("/attendance/punch-in", {
                lat: latitude,
                lng: longitude,
                accuracy,
                deviceId: navigator.userAgent,
            });
            await Promise.all([
                fetchToday(),
                fetchMonthly(viewMonth, viewYear),
            ]);
        } catch (e) {
            const msg = e.response?.data?.message || "Punch-in failed";
            alert(msg);
            await fetchToday();
        } finally {
            setLoading(false);
        }
    };

    const handlePunchIn = () => {
        if (!navigator.onLine) { saveOfflinePunch("punch-in"); return; }

        // In dev: skip GPS entirely, spoof office coordinates
        if (IS_DEV) {
            doPunchIn(OFFICE_LAT, OFFICE_LNG, 10);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude, accuracy } }) => {
                // Match backend threshold (150m)
                if (accuracy > 150) {
                    alert("GPS signal too weak. Please move to an open area and try again.");
                    return;
                }
                doPunchIn(latitude, longitude, accuracy);
            },
            (err) => {
                console.error("Geolocation error:", err);
                alert("Location permission required to punch in.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handlePunchOut = async () => {
        if (!navigator.onLine) { saveOfflinePunch("punch-out"); return; }
        try {
            setLoading(true);
            await API.post("/attendance/punch-out");
            // Await both so calendar + history update atomically
            await Promise.all([
                fetchToday(),
                fetchMonthly(viewMonth, viewYear),
            ]);
        } catch (e) {
            alert(e.response?.data?.message || "Punch-out failed");
            await fetchToday();
        } finally {
            setLoading(false);
        }
    };

    // Add this derived variable — used for stats and history table
    const pastMonthly = monthly.filter(d => {
        const dt = new Date(d.date);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return dt <= todayMidnight;
    });

    // ── Stats ──
    const presentDays = pastMonthly.filter(d => {
        const dt = new Date(d.date);
        return d.status === "present" && !d.isHalfDay && (!joiningDate || dt >= joiningDate);
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
        ? Math.min(100, ((presentDays + halfDays) / workingDaysFinal) * 100).toFixed(1)
        : 0;

    const chartData = useMemo(() => ({
        labels: ["Present", "Half-Day", "Late", "Absent"],
        datasets: [{
            label: "Days",
            data: [presentDays, halfDays, lateDays, absentDays],
            backgroundColor: ["#4ADE80", "#FDE047", "#F87171", "#c5d6f3"],
            borderRadius: 8,
            borderSkipped: false,
        }],
    }), [presentDays, halfDays, lateDays, absentDays]);

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
            return dt.getDate() === day && dt.getMonth() + 1 === viewMonth && dt.getFullYear() === viewYear;
        });

    const getHoliday = (day) =>
        holidays.find(h => {
            const dt = new Date(h.date);
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(dt.getTime() + istOffset);
            return istDate.getUTCDate() === day &&
                istDate.getUTCMonth() + 1 === viewMonth &&
                istDate.getUTCFullYear() === viewYear;
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
        return `${quotaRemaining} late arrival${quotaRemaining !== 1 ? "s" : ""} remaining (till 10:30 AM)`;
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
                                            {new Date(todayRec.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </b>
                                        {todayRec?.punchOut && (
                                            <>&nbsp;·&nbsp;Out:&nbsp;
                                                <b style={{ color: "#F87171" }}>
                                                    {new Date(todayRec.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

                        <div className="punch-btns">
                            <button
                                onClick={handlePunchIn}
                                disabled={loading || !!todayRec?.punchIn}
                                className="btn-punch btn-punchin"
                            >
                                <Icon d={icons.login} size={15} color="#052e16" />
                                {loading
                                    ? <><span className="spinner" /> Punching In...</>
                                    : IS_DEV
                                        ? "Punch In "
                                        : navigator.onLine ? "Punch In" : "Punch In (Offline)"}
                            </button>
                            <button
                                onClick={navigator.onLine ? handlePunchOut : () => saveOfflinePunch("punch-out")}
                                // ✅ FIX: enable only when punched in AND not yet punched out
                                disabled={loading || !todayRec?.punchIn || !!todayRec?.punchOut}
                                className="btn-punch btn-punchout"
                            >
                                <Icon d={icons.logout} size={15} />
                                {loading ? <><span className="spinner" /> Punching Out...</>
                                    : navigator.onLine ? "Punch Out" : "Punch Out (Offline)"}
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
                            <div className="stat-meta">{halfDays} half-day{halfDays !== 1 ? "s" : ""} · {absentDays} absent</div>
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
                            <div style={{ height: 220 }}>
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

                                    // ✅ FIX: Don't mark today as absent before end of shift (19:00)
                                    const isWorkInProgress = today && now.getHours() < 19;

                                    let sCls = "";
                                    const isBeforeJoining = joiningDate && currentDate < joiningDate;

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

                                    const cls = ["cal-cell", sCls, today ? "is-today" : "", noStatus, hasRecord ? "has-record" : ""]
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
                                        const badgeCls =
                                            item.status === "holiday" ? "holiday" :
                                                item.status === "weekend" ? "weekend" :
                                                    item.isHalfDay ? "half-day" :
                                                        item.isLate ? "late" :
                                                            item.status === "present" ? "present" :
                                                                "absent";

                                        const badgeLabel =
                                            item.status === "holiday" ? "Holiday" :
                                                item.status === "weekend" ? "Weekend" :
                                                    item.isHalfDay ? "Half Day" :
                                                        item.isLate ? `Late (+${item.lateMinutes}m)` :
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