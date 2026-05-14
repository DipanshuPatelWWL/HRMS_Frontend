import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
    HiOutlineUsers,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineClock,
    HiOutlineLogout,
    HiOutlineExclamationCircle,
    HiOutlineSearch,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
} from "react-icons/hi";
import {
    MdOutlineBeachAccess,
} from "react-icons/md";
import {
    RiCalendarCheckLine,
    RiBuilding2Line,
} from "react-icons/ri";
import StopwatchLoader from "../../components/common/StopwatchLoader";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG = {
    // present: { label: "Present", bg: "#D1FAE5", color: "#065F46", dot: "#059669" },
    punched_in: { label: "Punched In", bg: "#DBEAFE", color: "#1E3A8A", dot: "#2563EB" },
    half_day: { label: "Half Day", bg: "#FEF3C7", color: "#78350F", dot: "#D97706" },
    late: { label: "Late", bg: "#FEE2E2", color: "#7F1D1D", dot: "#DC2626" },
    absent: { label: "Absent", bg: "#F1F5F9", color: "#1E293B", dot: "#475569" },
    on_leave: { label: "On Leave", bg: "#F3E8FF", color: "#6B21A8", dot: "#7C3AED" },
    holiday: { label: "Holiday", bg: "#DBEAFE", color: "#1E3A8A", dot: "#2563EB" },
};

const matchesStatus = (emp, filterStatus) => {
    if (filterStatus === "all") return true;
    // Direct match on attendanceStatus field
    if (emp.attendanceStatus === filterStatus) return true;
    // Fallback — match boolean flags
    if (filterStatus === "half_day" && emp.isHalfDay) return true;
    if (filterStatus === "on_leave" && emp.onLeave) return true;
    if (filterStatus === "late" && emp.isLate && !emp.isHalfDay && !emp.onLeave) return true;
    return false;
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const initials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const fmt12 = (dt) =>
    dt
        ? new Date(dt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
        : "—";

const fmtHours = (h) => {
    if (!h) return "—";
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
};

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : "—";

// ─────────────────────────────────────────────
//  Status Badge
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 99,
                fontSize: ".72rem",
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.color,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: cfg.dot,
                    display: "inline-block",
                }}
            />
            {cfg.label}
        </span>
    );
};

// ─────────────────────────────────────────────
//  Overview Stat Card
// ─────────────────────────────────────────────
const OvCard = ({ label, value, color, Icon }) => (
    <div
        style={{
            background: "#fff",
            borderRadius: 14,
            padding: "18px 20px",
            border: "1px solid #E8EBF0",
            position: "relative",
            overflow: "hidden",
        }}
    >
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: color,
                borderRadius: "14px 14px 0 0",
            }}
        />
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
            }}
        >
            <div>
                <p
                    style={{
                        fontSize: ".67rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".6px",
                        color: "#374151",
                        marginBottom: 8,
                    }}
                >
                    {label}
                </p>
                <p
                    style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "#111318",
                        lineHeight: 1,
                        letterSpacing: "-1.5px",
                    }}
                >
                    {value}
                </p>
            </div>
            <div
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `${color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Icon size={20} color={color} />
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
const HRAttendanceOverview = () => {
    const now = new Date();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [tab, setTab] = useState("today");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDept, setFilterDept] = useState("all");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(
                `/attendance/hr-overview?month=${viewMonth}&year=${viewYear}`
            );
            setData(res.data);
        } catch (err) {
            console.error("HR attendance overview fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [viewMonth, viewYear]);

    const departments = [
        ...new Set(
            (data?.todaySummary || []).map((e) => e.department).filter(Boolean)
        ),
    ];

    const applyFilters = (list) =>
        list.filter((e) => {
            const matchSearch =
                e.name?.toLowerCase().includes(search.toLowerCase()) ||
                e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
                e.department?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = matchesStatus(e, filterStatus);
            const matchDept = filterDept === "all" || e.department === filterDept;
            return matchSearch && matchStatus && matchDept;
        });

    const filteredToday = applyFilters(data?.todaySummary || []);
    const filteredMonthly = (data?.monthlyStats || []).filter(
        (e) =>
            e.name?.toLowerCase().includes(search.toLowerCase()) ||
            e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
            e.department?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredLeaves = (data?.leaves || []).filter(
        (l) =>
            l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            l.user?.employeeId?.toLowerCase().includes(search.toLowerCase())
    );

    const ov = data?.todayOverview || {};

    const missedPunchOut = filteredToday.filter((e) => e.missedPunchOut);
    const activePunchedIn = filteredToday.filter(
        (e) => e.attendanceStatus === "punched_in"
    );

    return (
        <DashboardLayout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
                .hr-ov-root { font-family: 'DM Sans', sans-serif; padding-bottom: 40px; }
                .hr-ov-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
                .hr-tabs { display: flex; gap: 4px; background: #F1F5F9; border-radius: 10px; padding: 4px; margin-bottom: 20px; width: fit-content; }
                .hr-tab { padding: 7px 18px; border-radius: 7px; border: none; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .15s; background: transparent; color: #374151; display: flex; align-items: center; gap: 6px; }
                .hr-tab.active { background: #fff; color: #111318; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
                .hr-tab:not(.active):hover { color: #111318; background: #e8edf2; }
                .hr-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 12px; }
                .hr-stats-sec { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
                @media(max-width:900px){ .hr-stats{ grid-template-columns:repeat(2,1fr); } .hr-stats-sec{ grid-template-columns:repeat(2,1fr); } }
                @media(max-width:500px){ .hr-stats{ grid-template-columns:1fr; } .hr-stats-sec{ grid-template-columns:1fr; } }
                .hr-card { background: #fff; border-radius: 14px; border: 1px solid #E8EBF0; overflow: hidden; margin-bottom: 16px; }
                .hr-card-header { padding: 14px 20px; border-bottom: 1px solid #F1F5F9; font-size: .85rem; font-weight: 700; color: #111318; display: flex; align-items: center; gap: 8px; }
                .hr-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
                .hr-table th { text-align: left; padding: 10px 16px; font-size: .67rem; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #1E293B; border-bottom: 1.5px solid #F1F5F9; white-space: nowrap; background: #FAFBFC; }
                .hr-table td { padding: 11px 16px; border-bottom: 1px solid #F8FAFC; vertical-align: middle; }
                .hr-table tbody tr:hover { background: #FAFBFC; }
                .hr-table tbody tr:last-child td { border-bottom: none; }
                .hr-chip { display: inline-flex; align-items: center; gap: 4px; font-family: 'DM Mono',monospace; font-size: .73rem; background: #F3F4F6; padding: 3px 8px; border-radius: 5px; color: #111318; }
                .hr-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
                .hr-filters-search { flex: 1; min-width: 200px; max-width: 300px; padding: 8px 14px 8px 36px; border: 1.5px solid #E2E8F0; border-radius: 9px; font-size: .82rem; font-family:'DM Sans',sans-serif; outline: none; transition: border-color .15s; color: #111318; }
                .hr-filters-search:focus { border-color: #6366F1; }
                .hr-filters-search::placeholder { color: #6B7280; }
                .hr-filters select { padding: 8px 12px; border: 1.5px solid #E2E8F0; border-radius: 9px; font-size: .82rem; font-family:'DM Sans',sans-serif; background: #fff; outline: none; cursor: pointer; color: #111318; }
                .hr-filters select:focus { border-color: #6366F1; }
                .hr-nav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .hr-nav-btn { width: 32px; height: 32px; border: 1.5px solid #E2E8F0; border-radius: 8px; background: #FAFAFA; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #111318; font-size: 1rem; transition: all .15s; }
                .hr-nav-btn:hover { background: #F1F5F9; border-color: #6366F1; color: #6366F1; }
                .hr-nav select { border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 6px 10px; font-size: .82rem; font-weight: 600; font-family:'DM Sans',sans-serif; background: #FAFAFA; outline: none; cursor: pointer; color: #111318; }
                .hr-nav select:focus { border-color: #6366F1; }
                .hr-today-btn { padding: 6px 14px; border-radius: 7px; font-size: .75rem; font-weight: 700; border: 1.5px solid #C7D2FE; background: #EEF2FF; color: #4F46E5; cursor: pointer; font-family:'DM Sans',sans-serif; }
                .hr-today-btn:hover { background: #E0E7FF; }
                .alert-section { border-radius: 12px; padding: 14px 18px; margin-bottom: 16px; }
                .alert-section-title { font-size: .78rem; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
                .alert-chips { display: flex; gap: 8px; flex-wrap: wrap; }
                .spinner-sm { width: 20px; height: 20px; border: 2px solid #E2E8F0; border-top-color: #6366F1; border-radius: 50%; animation: spin .6s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .empty-cell { text-align: center; color: #374151; padding: 2.5rem; font-size: .85rem; }
                .dept-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .67rem; font-weight: 700; background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }
                .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 300px; }
                .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #374151; pointer-events: none; }
            `}</style>

            <div className="hr-ov-root">
                {/* ── Header ── */}
                <div className="hr-ov-header">
                    <div>
                        <h1
                            style={{
                                fontSize: "1.45rem",
                                fontWeight: 800,
                                color: "#111318",
                                letterSpacing: "-.3px",
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                            }}
                        >
                            <RiCalendarCheckLine size={26} color="#6366F1" />
                            Attendance Overview
                        </h1>
                        <p
                            style={{
                                fontSize: ".8rem",
                                color: "#374151",
                                marginTop: 4,
                                fontWeight: 500,
                            }}
                        >
                            {now.toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>

                    {/* Month / Year nav */}
                    <div className="hr-nav">
                        <button
                            className="hr-nav-btn"
                            onClick={() =>
                                viewMonth === 1
                                    ? (setViewMonth(12),
                                        setViewYear((y) => y - 1))
                                    : setViewMonth((m) => m - 1)
                            }
                        >
                            <HiOutlineChevronLeft size={16} />
                        </button>
                        <select
                            value={viewMonth}
                            onChange={(e) =>
                                setViewMonth(Number(e.target.value))
                            }
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>
                                    {m}
                                </option>
                            ))}
                        </select>
                        <select
                            value={viewYear}
                            onChange={(e) =>
                                setViewYear(Number(e.target.value))
                            }
                        >
                            {Array.from(
                                { length: 6 },
                                (_, i) => now.getFullYear() - 3 + i
                            ).map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <button
                            className="hr-today-btn"
                            onClick={() => {
                                setViewMonth(now.getMonth() + 1);
                                setViewYear(now.getFullYear());
                            }}
                        >
                            Today
                        </button>
                        <button
                            className="hr-nav-btn"
                            onClick={() =>
                                viewMonth === 12
                                    ? (setViewMonth(1),
                                        setViewYear((y) => y + 1))
                                    : setViewMonth((m) => m + 1)
                            }
                        >
                            <HiOutlineChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Primary Stats ── */}
                <div className="hr-stats">
                    <OvCard
                        label="Total Active"
                        value={ov.totalActive ?? "—"}
                        color="#6366F1"
                        Icon={HiOutlineUsers}
                    />
                    <OvCard
                        label="Punched In"
                        value={ov.punchedIn ?? "—"}
                        color="#22C55E"
                        Icon={HiOutlineCheckCircle}
                    />
                    <OvCard
                        label="Absent Today"
                        value={ov.absentToday ?? "—"}
                        color="#EF4444"
                        Icon={HiOutlineXCircle}
                    />
                    <OvCard
                        label="On Leave"
                        value={ov.onLeaveTodayCount ?? "—"}
                        color="#A78BFA"
                        Icon={MdOutlineBeachAccess}
                    />
                </div>

                {/* ── Secondary Stats ── */}
                <div className="hr-stats-sec">
                    <OvCard
                        label="Punched Out"
                        value={ov.punchedOut ?? "—"}
                        color="#3B82F6"
                        Icon={HiOutlineLogout}
                    />
                    <OvCard
                        label="Missed Punch Out"
                        value={ov.missedPunchOut ?? "—"}
                        color="#F97316"
                        Icon={HiOutlineExclamationCircle}
                    />
                    <OvCard
                        label="Late Today"
                        value={ov.lateToday ?? "—"}
                        color="#F43F5E"
                        Icon={HiOutlineClock}
                    />
                </div>

                {/* ── Missed Punch Out Alert ── */}
                {!loading && missedPunchOut.length > 0 && (
                    <div
                        className="alert-section"
                        style={{
                            background: "#FFF7ED",
                            border: "1px solid #FED7AA",
                        }}
                    >
                        <div
                            className="alert-section-title"
                            style={{ color: "#9A3412" }}
                        >
                            <HiOutlineExclamationCircle size={16} />
                            Missed Punch Out ({missedPunchOut.length})
                        </div>
                        <div className="alert-chips">
                            {missedPunchOut.map((e) => (
                                <div
                                    key={e._id}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "5px 10px",
                                        background: "#fff",
                                        border: "1px solid #FED7AA",
                                        borderRadius: 8,
                                        fontSize: ".76rem",
                                        fontWeight: 600,
                                        color: "#7C2D12",
                                    }}
                                >
                                    {e.name}
                                    <span
                                        style={{
                                            fontFamily: "DM Mono,monospace",
                                            fontSize: ".68rem",
                                            color: "#C2410C",
                                        }}
                                    >
                                        ({e.employeeId})
                                    </span>
                                    {e.punchIn && (
                                        <span
                                            style={{
                                                marginLeft: 4,
                                                color: "#15803D",
                                                fontWeight: 700,
                                            }}
                                        >
                                            In: {fmt12(e.punchIn)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Currently In Office Alert ── */}
                {!loading && activePunchedIn.length > 0 && (
                    <div
                        className="alert-section"
                        style={{
                            background: "#F0FDF4",
                            border: "1px solid #BBF7D0",
                        }}
                    >
                        <div
                            className="alert-section-title"
                            style={{ color: "#14532D" }}
                        >
                            <HiOutlineCheckCircle size={16} />
                            Currently In Office ({activePunchedIn.length})
                        </div>
                        <div className="alert-chips">
                            {activePunchedIn.map((e) => (
                                <div
                                    key={e._id}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "5px 10px",
                                        background: "#fff",
                                        border: "1px solid #BBF7D0",
                                        borderRadius: 8,
                                        fontSize: ".76rem",
                                        fontWeight: 600,
                                        color: "#14532D",
                                    }}
                                >
                                    {e.name} ·{" "}
                                    <span
                                        style={{
                                            fontFamily: "DM Mono,monospace",
                                            fontSize: ".68rem",
                                        }}
                                    >
                                        {fmt12(e.punchIn)}
                                    </span>
                                    {e.isLate && (
                                        <span
                                            style={{
                                                marginLeft: 4,
                                                background: "#FEE2E2",
                                                color: "#991B1B",
                                                padding: "1px 6px",
                                                borderRadius: 4,
                                                fontSize: ".68rem",
                                                fontWeight: 700,
                                            }}
                                        >
                                            Late
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="hr-tabs">
                    <button
                        className={`hr-tab ${tab === "today" ? "active" : ""}`}
                        onClick={() => setTab("today")}
                    >
                        <HiOutlineClock size={14} />
                        Today's Status
                    </button>
                    <button
                        className={`hr-tab ${tab === "monthly" ? "active" : ""}`}
                        onClick={() => setTab("monthly")}
                    >
                        <RiBuilding2Line size={14} />
                        Monthly Stats
                    </button>
                    <button
                        className={`hr-tab ${tab === "leaves" ? "active" : ""}`}
                        onClick={() => setTab("leaves")}
                    >
                        <MdOutlineBeachAccess size={14} />
                        Leave Schedule
                    </button>
                </div>

                {/* ── Filters ── */}
                <div className="hr-filters">
                    <div className="search-wrap">
                        <HiOutlineSearch
                            className="search-icon"
                            size={15}
                        />
                        <input
                            className="hr-filters-search"
                            placeholder="Search by name, ID or department…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {tab === "today" && (
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            {/* <option value="present">Present</option> */}
                            <option value="punched_in">Punched In</option>
                            <option value="half_day">Half Day</option>
                            <option value="absent">Absent</option>
                            <option value="on_leave">On Leave</option>
                        </select>
                    )}
                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {departments.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                    <span
                        style={{
                            fontSize: ".78rem",
                            color: "#374151",
                            marginLeft: "auto",
                            fontWeight: 500,
                        }}
                    >
                        {tab === "today"
                            ? filteredToday.length
                            : tab === "monthly"
                                ? filteredMonthly.length
                                : filteredLeaves.length}{" "}
                        results
                    </span>
                </div>

                {/* ── Loading ── */}
                {loading && <StopwatchLoader />}

                {/* ─────────────────────────────────────────────
                     TODAY TAB
                ───────────────────────────────────────────── */}
                {!loading && tab === "today" && (
                    <div className="hr-card">
                        <div className="hr-card-header">
                            <HiOutlineClock size={16} color="#6366F1" />
                            Today —{" "}
                            {now.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                            <span
                                style={{
                                    marginLeft: "auto",
                                    fontSize: ".75rem",
                                    color: "#374151",
                                    fontWeight: 600,
                                }}
                            >
                                {filteredToday.length} employees
                            </span>
                        </div>
                        <table className="hr-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Punch In</th>
                                    <th>Punch Out</th>
                                    <th>Work Hrs</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredToday.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="empty-cell">
                                            No employees found
                                        </td>
                                    </tr>
                                )}
                                {filteredToday.map((emp) => (
                                    <tr key={emp._id}>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: "50%",
                                                        background:
                                                            "linear-gradient(135deg,#667eea,#764ba2)",
                                                        color: "#fff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        fontWeight: 700,
                                                        fontSize: ".75rem",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {initials(emp.name)}
                                                </div>
                                                <div>
                                                    <p
                                                        style={{
                                                            fontWeight: 700,
                                                            color: "#111318",
                                                            fontSize: ".83rem",
                                                        }}
                                                    >
                                                        {emp.name}
                                                    </p>
                                                    <p
                                                        style={{
                                                            fontSize: ".7rem",
                                                            color: "#374151",
                                                            fontFamily:
                                                                "DM Mono,monospace",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {emp.employeeId}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="dept-tag">
                                                {emp.department || "—"}
                                            </span>
                                        </td>
                                        <td>
                                            <StatusBadge
                                                status={emp.attendanceStatus}
                                            />
                                        </td>
                                        <td>
                                            {emp.punchIn ? (
                                                <span className="hr-chip">
                                                    <span
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                "#22C55E",
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                    {fmt12(emp.punchIn)}
                                                    {emp.isLate && (
                                                        <span
                                                            style={{
                                                                color: "#DC2626",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            +{emp.lateMinutes}m
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span
                                                    style={{ color: "#6B7280" }}
                                                >
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {emp.punchOut ? (
                                                <span className="hr-chip">
                                                    <span
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                "#EF4444",
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                    {fmt12(emp.punchOut)}
                                                </span>
                                            ) : emp.missedPunchOut ? (
                                                <span
                                                    style={{
                                                        fontSize: ".72rem",
                                                        color: "#DC2626",
                                                        fontWeight: 700,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <HiOutlineExclamationCircle
                                                        size={13}
                                                    />
                                                    Missed
                                                </span>
                                            ) : (
                                                <span
                                                    style={{ color: "#6B7280" }}
                                                >
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                fontFamily:
                                                    "DM Mono,monospace",
                                                fontSize: ".77rem",
                                                color: "#111318",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {fmtHours(emp.workHours)}
                                        </td>
                                        <td style={{ fontSize: ".71rem" }}>
                                            {emp.onLeave && (
                                                <span
                                                    style={{
                                                        background: "#F3E8FF",
                                                        color: "#6B21A8",
                                                        padding: "2px 7px",
                                                        borderRadius: 4,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {emp.leaveType || "Leave"}
                                                </span>
                                            )}
                                            {emp.isHalfDay && !emp.onLeave && (
                                                <span
                                                    style={{
                                                        background: "#FEF3C7",
                                                        color: "#92400E",
                                                        padding: "2px 7px",
                                                        borderRadius: 4,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    Half Day
                                                </span>
                                            )}
                                            {emp.isLate &&
                                                !emp.isHalfDay &&
                                                !emp.onLeave && (
                                                    <span
                                                        style={{
                                                            background:
                                                                "#FEE2E2",
                                                            color: "#991B1B",
                                                            padding: "2px 7px",
                                                            borderRadius: 4,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Late
                                                    </span>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ─────────────────────────────────────────────
                     MONTHLY TAB
                ───────────────────────────────────────────── */}
                {!loading && tab === "monthly" && (
                    <div className="hr-card">
                        <div className="hr-card-header">
                            <RiBuilding2Line size={16} color="#6366F1" />
                            Monthly Stats — {MONTHS[viewMonth - 1]} {viewYear}
                            <span
                                style={{
                                    marginLeft: "auto",
                                    fontSize: ".75rem",
                                    color: "#374151",
                                    fontWeight: 600,
                                }}
                            >
                                {filteredMonthly.length} employees
                            </span>
                        </div>
                        <table className="hr-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Present</th>
                                    <th>Half Days</th>
                                    <th>Late</th>
                                    <th>Absent</th>
                                    <th>Leave Days</th>
                                    <th>Total Hrs</th>
                                    <th>Avg / Day</th>
                                    <th>Late hrs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaves.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="empty-cell">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                                {filteredMonthly.map((emp) => {
                                    const s = emp.stats;
                                    return (
                                        <tr key={emp._id}>
                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 10,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 34,
                                                            height: 34,
                                                            borderRadius: "50%",
                                                            background:
                                                                "linear-gradient(135deg,#667eea,#764ba2)",
                                                            color: "#fff",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontWeight: 700,
                                                            fontSize: ".75rem",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {initials(emp.name)}
                                                    </div>
                                                    <div>
                                                        <p
                                                            style={{
                                                                fontWeight: 700,
                                                                color: "#111318",
                                                                fontSize:
                                                                    ".83rem",
                                                            }}
                                                        >
                                                            {emp.name}
                                                        </p>
                                                        <p
                                                            style={{
                                                                fontSize:
                                                                    ".7rem",
                                                                color: "#374151",
                                                                fontFamily:
                                                                    "DM Mono,monospace",
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {emp.employeeId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="dept-tag">
                                                    {emp.department || "—"}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#15803D",
                                                        fontSize: ".85rem",
                                                    }}
                                                >
                                                    {s.presentDays}
                                                </span>
                                            </td>
                                            <td>
                                                {s.halfDays > 0 ? (
                                                    <span
                                                        style={{
                                                            background:
                                                                "#FEF3C7",
                                                            color: "#92400E",
                                                            padding:
                                                                "2px 8px",
                                                            borderRadius: 4,
                                                            fontWeight: 700,
                                                            fontSize: ".75rem",
                                                        }}
                                                    >
                                                        {s.halfDays}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "#374151",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        0
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {s.lateDays > 0 ? (
                                                    <span
                                                        style={{
                                                            background:
                                                                "#FEE2E2",
                                                            color: "#991B1B",
                                                            padding:
                                                                "2px 8px",
                                                            borderRadius: 4,
                                                            fontWeight: 700,
                                                            fontSize: ".75rem",
                                                        }}
                                                    >
                                                        {s.lateDays}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "#374151",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        0
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {s.absentDays > 0 ? (
                                                    <span
                                                        style={{
                                                            background:
                                                                "#F1F5F9",
                                                            color: "#1E293B",
                                                            padding:
                                                                "2px 8px",
                                                            borderRadius: 4,
                                                            fontWeight: 700,
                                                            fontSize: ".75rem",
                                                        }}
                                                    >
                                                        {s.absentDays}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "#374151",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        0
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {s.leaveDays > 0 ? (
                                                    <span
                                                        style={{
                                                            background: "#F3E8FF",
                                                            color: "#6B21A8",
                                                            padding: "2px 8px",
                                                            borderRadius: 4,
                                                            fontWeight: 700,
                                                            fontSize: ".75rem",
                                                        }}
                                                    >
                                                        {s.leaveDays}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#374151", fontWeight: 500 }}>0</span>
                                                )}
                                            </td>

                                            {/* Total Work Hours */}
                                            <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".77rem", fontWeight: 600, color: "#111318" }}>
                                                {s.totalWorkHours > 0 ? (
                                                    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
                                                        {Math.floor(s.totalWorkHours)}
                                                        <span style={{ fontSize: ".68rem", color: "#6B7280", fontWeight: 400 }}>
                                                            h {Math.round((s.totalWorkHours % 1) * 60)}m
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#9CA3AF" }}>—</span>
                                                )}
                                            </td>

                                            {/* Avg Daily Hours */}
                                            <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".77rem", fontWeight: 600, color: "#111318" }}>
                                                {s.avgDailyHours > 0 ? (
                                                    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
                                                        {Math.floor(s.avgDailyHours)}
                                                        <span style={{ fontSize: ".68rem", color: "#6B7280", fontWeight: 400 }}>
                                                            h {Math.round((s.avgDailyHours % 1) * 60)}m
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#9CA3AF" }}>—</span>
                                                )}
                                            </td>

                                            {/* Total Late Minutes */}
                                            <td>
                                                {s.totalLateMinutes > 0 ? (() => {
                                                    const totalMins = Math.round(s.totalLateMinutes);
                                                    const hrs = Math.floor(totalMins / 60);
                                                    const mins = totalMins % 60;
                                                    return (
                                                        <span style={{
                                                            background: "#FFF7ED",
                                                            color: "#C2410C",
                                                            padding: "2px 8px",
                                                            borderRadius: 4,
                                                            fontWeight: 700,
                                                            fontSize: ".75rem",
                                                            fontFamily: "DM Mono,monospace",
                                                        }}>
                                                            {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
                                                        </span>
                                                    );
                                                })() : (
                                                    <span style={{ color: "#374151", fontWeight: 500 }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ─────────────────────────────────────────────
                     LEAVES TAB
                ───────────────────────────────────────────── */}
                {!loading && tab === "leaves" && (
                    <div className="hr-card">
                        <div className="hr-card-header">
                            <MdOutlineBeachAccess size={16} color="#6366F1" />
                            Approved Leave Schedule — {MONTHS[viewMonth - 1]}{" "}
                            {viewYear}
                            <span
                                style={{
                                    marginLeft: "auto",
                                    fontSize: ".75rem",
                                    color: "#374151",
                                    fontWeight: 600,
                                }}
                            >
                                {filteredLeaves.length} leaves
                            </span>
                        </div>
                        <table className="hr-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Leave Type</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaves.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="empty-cell">
                                            No approved leaves for this period
                                        </td>
                                    </tr>
                                )}
                                {filteredLeaves.map((leave) => {
                                    const from = new Date(leave.fromDate);
                                    const to = new Date(leave.toDate);
                                    const days =
                                        Math.ceil(
                                            (to - from) /
                                            (1000 * 60 * 60 * 24)
                                        ) + 1;
                                    return (
                                        <tr key={leave._id}>
                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 10,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 34,
                                                            height: 34,
                                                            borderRadius: "50%",
                                                            background:
                                                                "linear-gradient(135deg,#a78bfa,#7c3aed)",
                                                            color: "#fff",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontWeight: 700,
                                                            fontSize: ".75rem",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {initials(
                                                            leave.user.name
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p
                                                            style={{
                                                                fontWeight: 700,
                                                                color: "#111318",
                                                                fontSize:
                                                                    ".83rem",
                                                            }}
                                                        >
                                                            {leave.user.name}
                                                        </p>
                                                        <p
                                                            style={{
                                                                fontSize:
                                                                    ".7rem",
                                                                color: "#374151",
                                                                fontFamily:
                                                                    "DM Mono,monospace",
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {
                                                                leave.user
                                                                    .employeeId
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="dept-tag">
                                                    {leave.user.department ||
                                                        "—"}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: "#F3E8FF",
                                                        color: "#6B21A8",
                                                        padding: "3px 9px",
                                                        borderRadius: 5,
                                                        fontWeight: 700,
                                                        fontSize: ".74rem",
                                                        textTransform:
                                                            "capitalize",
                                                    }}
                                                >
                                                    {leave.type?.replace(
                                                        /_/g,
                                                        " "
                                                    ) || "Leave"}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    fontSize: ".8rem",
                                                    color: "#111318",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {fmtDate(leave.fromDate)}
                                            </td>
                                            <td
                                                style={{
                                                    fontSize: ".8rem",
                                                    color: "#111318",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {fmtDate(leave.toDate)}
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontWeight: 800,
                                                        color: "#4F46E5",
                                                        fontSize: ".85rem",
                                                    }}
                                                >
                                                    {days}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: ".72rem",
                                                        color: "#374151",
                                                        marginLeft: 3,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    day{days !== 1 ? "s" : ""}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        background: "#D1FAE5",
                                                        color: "#065F46",
                                                        padding: "3px 9px",
                                                        borderRadius: 5,
                                                        fontWeight: 700,
                                                        fontSize: ".72rem",
                                                    }}
                                                >
                                                    Approved
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default HRAttendanceOverview;