import { useEffect, useState, useMemo } from "react";
import API from "../../services/api";
import { formatRole } from "../../utils/roleFormatter";
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
    HiOutlineDownload,
    HiOutlineDocumentText,
} from "react-icons/hi";
import {
    MdOutlineBeachAccess,
    MdOutlineTableChart,
} from "react-icons/md";
import {
    RiCalendarCheckLine,
    RiBuilding2Line,
} from "react-icons/ri";
import StopwatchLoader from "../../components/common/StopwatchLoader";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

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

const STATUS_CONFIG = {
    punched_in: { label: "Punched In", bg: "var(--brand-light)", color: "var(--brand-dark)", dot: "var(--brand)" },
    punched_out: { label: "Punched Out", bg: "var(--success-bg)", color: "var(--success)", dot: "#962205" },
    absent: { label: "Absent", bg: "#DBEAFE", color: "#1E3A8A", dot: "#3B82F6" },
    on_leave: { label: "On Leave", bg: "#F3E8FF", color: "#6B21A8", dot: "#7C3AED" },
    holiday: { label: "Holiday", bg: "var(--brand-light)", color: "var(--brand-dark)", dot: "var(--brand)" },
    not_started: { label: "Office Closed", bg: "var(--surface-2)", color: "var(--text-3)", dot: "var(--text-3)" },
    missed_punchout: { label: "Missed Punch Out", bg: "var(--warn-bg)", color: "var(--warn)", dot: "#F97316" },
};

const DAY_STATUS_CONFIG = {
    present: { label: "Present", ...STATUS_COLORS.present },
    late: { label: "Late", ...STATUS_COLORS.late },
    halfday: { label: "Half Day", ...STATUS_COLORS.halfday },
    absent: { label: "Absent", ...STATUS_COLORS.absent },
    leave: { label: "Leave", ...STATUS_COLORS.leave },
    holiday: { label: "Holiday", ...STATUS_COLORS.holiday },
    weekend: { label: "Weekend", ...STATUS_COLORS.weekend },
};

const matchesStatus = (emp, filterStatus) => {
    if (filterStatus === "all") return true;
    if (emp.attendanceStatus === filterStatus) return true;
    if (filterStatus === "on_leave" && emp.onLeave) return true;
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
//  Day Status Badge
// ─────────────────────────────────────────────
const DayStatusBadge = ({ status }) => {
    const cfg = DAY_STATUS_CONFIG[status] || DAY_STATUS_CONFIG.absent;
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
                color: cfg.text,
                border: `1px solid ${cfg.border}`,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: cfg.solid,
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
const OvCard = ({ label, value, color, Icon, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: "var(--surface)",
            borderRadius: 14,
            padding: "18px 20px",
            border: "1px solid var(--border)",
            position: "relative",
            overflow: "hidden",
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
            if (onClick) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }
        }}
        onMouseLeave={(e) => {
            if (onClick) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }
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
                        color: "var(--text-2)",
                        marginBottom: 8,
                    }}
                >
                    {label}
                </p>
                <p
                    style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "var(--text-1)",
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

    // Day-wise tab states
    const [selectedDate, setSelectedDate] = useState(now.toISOString().split("T")[0]);
    const [dayWiseData, setDayWiseData] = useState([]);
    const [dayWiseSummary, setDayWiseSummary] = useState({});
    const [dayWiseLoading, setDayWiseLoading] = useState(false);
    const [dayWisePage, setDayWisePage] = useState(1);
    const [dayWiseTotal, setDayWiseTotal] = useState(0);
    const [dayWiseLimit] = useState(50);
    const [dayWiseSearch, setDayWiseSearch] = useState("");
    const [dayWiseStatusFilter, setDayWiseStatusFilter] = useState("all");
    const [dayWiseDeptFilter, setDayWiseDeptFilter] = useState("all");

    const fetchData = async () => {
        setLoading(true);
        setData(null);
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

    const fetchDayWiseData = async () => {
        setDayWiseLoading(true);
        try {
            const res = await API.get(
                `/attendance/day-wise?date=${selectedDate}&page=${dayWisePage}&limit=${dayWiseLimit}&search=${dayWiseSearch}&department=${dayWiseDeptFilter}&status=${dayWiseStatusFilter}`
            );
            setDayWiseData(res.data.data);
            setDayWiseSummary(res.data.summary);
            setDayWiseTotal(res.data.total);
        } catch (err) {
            console.error("Day-wise attendance fetch failed:", err);
        } finally {
            setDayWiseLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setFilterDept("all");
        setSearch("");
    }, [viewMonth, viewYear]);

    useEffect(() => {
        if (tab === "daywise") {
            fetchDayWiseData();
        }
    }, [tab, selectedDate, dayWisePage, dayWiseSearch, dayWiseStatusFilter, dayWiseDeptFilter]);

    const departments = useMemo(() => {
        const set = new Set();
        (data?.todaySummary || []).forEach(e => e.department && set.add(e.department));
        (data?.monthlyStats || []).forEach(e => e.department && set.add(e.department));
        return [...set].sort();
    }, [data]);

    const handleOvCardClick = (status) => {
        setTab("daywise");
        setSelectedDate(now.toISOString().split("T")[0]);
        setDayWiseStatusFilter(status);
        setDayWiseSearch("");
        setDayWiseDeptFilter("all");
        setDayWisePage(1);
    };

    const handleExportExcel = () => {
        if (!dayWiseData.length) return;
        const exportData = dayWiseData.map(emp => ({
            "Employee Name": emp.name,
            "Employee ID": emp.employeeId,
            "Department": emp.department || "—",
            "Punch In": emp.punchIn ? fmt12(emp.punchIn) : "—",
            "Punch Out": emp.punchOut ? fmt12(emp.punchOut) : "—",
            "Work Hours": fmtHours(emp.workHours),
            "Late Mins": emp.lateMinutes || 0,
            "Status": DAY_STATUS_CONFIG[emp.status]?.label || emp.status
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `Attendance_${selectedDate}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!dayWiseData.length) return;
        const doc = new jsPDF();
        doc.text(`Attendance Report - ${fmtDate(selectedDate)}`, 14, 15);
        const tableData = dayWiseData.map(emp => [
            emp.name,
            emp.employeeId,
            emp.department || "—",
            emp.punchIn ? fmt12(emp.punchIn) : "—",
            emp.punchOut ? fmt12(emp.punchOut) : "—",
            fmtHours(emp.workHours),
            emp.lateMinutes || 0,
            DAY_STATUS_CONFIG[emp.status]?.label || emp.status
        ]);
        autoTable(doc, {
            head: [["Name", "ID", "Dept", "Punch In", "Punch Out", "Work Hrs", "Late", "Status"]],
            body: tableData,
            startY: 20,
        });
        doc.save(`Attendance_${selectedDate}.pdf`);
    };

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
    const filteredMonthly = (data?.monthlyStats || []).filter((e) => {
        const matchSearch =
            e.name?.toLowerCase().includes(search.toLowerCase()) ||
            e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
            e.department?.toLowerCase().includes(search.toLowerCase());
        const matchDept = filterDept === "all" || e.department === filterDept;
        return matchSearch && matchDept;
    });
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

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    return (
        <DashboardLayout>
            <style>{`
                .hr-ov-root { font-family: 'DM Sans', sans-serif; padding-bottom: 40px; }
                .hr-ov-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
                .hr-tabs { display: flex; gap: 4px; background: var(--surface-3); border-radius: 10px; padding: 4px; margin-bottom: 20px; width: fit-content; flex-wrap: wrap; }
                .hr-tab { padding: 7px 18px; border-radius: 7px; border: none; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .15s; background: transparent; color: var(--text-2); display: flex; align-items: center; gap: 6px; }
                .hr-tab.active { background: var(--surface); color: var(--text-1); box-shadow: 0 1px 4px rgba(0,0,0,.1); }
                .hr-tab:not(.active):hover { color: var(--text-1); background: var(--surface-2); }
                .hr-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 12px; }
                .hr-stats-sec { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
                @media(max-width:900px){ .hr-stats{ grid-template-columns:repeat(2,1fr); } .hr-stats-sec{ grid-template-columns:repeat(2,1fr); } }
                @media(max-width:500px){ .hr-stats{ grid-template-columns:1fr; } .hr-stats-sec{ grid-template-columns:1fr; } }
                .hr-card { background: var(--surface); border-radius: 14px; border: 1px solid var(--border); overflow: hidden; margin-bottom: 16px; }
                .hr-card-header { padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: .85rem; font-weight: 700; color: var(--text-1); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .hr-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
                .hr-table th { text-align: left; padding: 10px 16px; font-size: .67rem; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--text-1); border-bottom: 1.5px solid var(--border); white-space: nowrap; background: var(--surface-3); }
                .hr-table td { padding: 11px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                .hr-table tbody tr:hover { background: var(--surface-3); }
                .hr-table tbody tr:last-child td { border-bottom: none; }
                .hr-chip { display: inline-flex; align-items: center; gap: 4px; font-family: 'DM Mono',monospace; font-size: .73rem; background: var(--surface-3); padding: 3px 8px; border-radius: 5px; color: var(--text-1); }
                .hr-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
                .hr-filters-search { flex: 1; min-width: 200px; max-width: 300px; padding: 8px 14px 8px 36px; border: 1.5px solid var(--border); border-radius: 9px; font-size: .82rem; font-family:'DM Sans',sans-serif; outline: none; transition: border-color .15s; color: var(--text-1); background: var(--surface); }
                .hr-filters-search:focus { border-color: #6366F1; }
                .hr-filters-search::placeholder { color: var(--text-3); }
                .hr-filters select, .hr-filters input[type="date"] { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: .82rem; font-family:'DM Sans',sans-serif; background: var(--surface); outline: none; cursor: pointer; color: var(--text-1); }
                .hr-filters select:focus, .hr-filters input[type="date"]:focus { border-color: #6366F1; }
                .hr-nav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .hr-nav-btn { width: 32px; height: 32px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-1); font-size: 1rem; transition: all .15s; }
                .hr-nav-btn:hover { background: var(--surface-3); border-color: #6366F1; color: #6366F1; }
                .hr-nav select { border: 1.5px solid var(--border); border-radius: 8px; padding: 6px 10px; font-size: .82rem; font-weight: 600; font-family:'DM Sans',sans-serif; background: var(--surface); outline: none; cursor: pointer; color: var(--text-1); }
                .hr-nav select:focus { border-color: #6366F1; }
                .hr-today-btn { padding: 6px 14px; border-radius: 7px; font-size: .75rem; font-weight: 700; border: 1.5px solid #C7D2FE; background: #EEF2FF; color: #4F46E5; cursor: pointer; font-family:'DM Sans',sans-serif; }
                .hr-today-btn:hover { background: #E0E7FF; }
                .alert-section { border-radius: 12px; padding: 14px 18px; margin-bottom: 16px; }
                .alert-section-title { font-size: .78rem; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
                .alert-chips { display: flex; gap: 8px; flex-wrap: wrap; }
                .spinner-sm { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: #6366F1; border-radius: 50%; animation: spin .6s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .empty-cell { text-align: center; color: var(--text-2); padding: 2.5rem; font-size: .85rem; }
                .dept-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .67rem; font-weight: 700; background: var(--brand-light); color: var(--brand-dark); border: 1px solid var(--border); }
                .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 300px; }
                .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-2); pointer-events: none; }
                .btn-export { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-size: .75rem; font-weight: 700; cursor: pointer; transition: all .15s; border: 1.5px solid transparent; font-family: inherit; }
                .btn-excel { background: #DCFCE7; color: #166534; border-color: #BBF7D0; }
                .btn-excel:hover { background: #BBF7D0; }
                .btn-pdf { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }
                .btn-pdf:hover { background: #FECACA; }
                .pagination { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); }
                .pagination-btn { padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .75rem; font-weight: 600; color: var(--text-1); }
                .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .pagination-info { font-size: .75rem; color: var(--text-2); font-weight: 600; }
                .summary-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px; }
                @media(max-width: 768px) { .summary-strip { grid-template-columns: repeat(3, 1fr); } }
                @media(max-width: 480px) { .summary-strip { grid-template-columns: repeat(2, 1fr); } }
                .summary-pill { padding: 10px; border-radius: 12px; border: 1px solid var(--border); text-align: center; }
                .summary-pill-val { font-size: 1.4rem; font-weight: 800; line-height: 1; margin-bottom: 2px; }
                .summary-pill-lbl { font-size: .62rem; font-weight: 700; text-transform: uppercase; color: var(--text-2); letter-spacing: .5px; }
            `}</style>

            <div className="hr-ov-root">
                {/* ── Header ── */}
                <div className="hr-ov-header">
                    <div>
                        <h1
                            style={{
                                fontSize: "1.45rem",
                                fontWeight: 800,
                                color: "var(--text-1)",
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
                                color: "var(--text-2)",
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
                        onClick={() => handleOvCardClick("present")}
                    />
                    <OvCard
                        label="Absent Today"
                        value={ov.absentToday ?? "—"}
                        color="#3B82F6"
                        Icon={HiOutlineXCircle}
                        onClick={() => handleOvCardClick("absent")}
                    />
                    <OvCard
                        label="On Leave"
                        value={ov.onLeaveTodayCount ?? "—"}
                        color="#A78BFA"
                        Icon={MdOutlineBeachAccess}
                        onClick={() => handleOvCardClick("leave")}
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
                        onClick={() => handleOvCardClick("late")}
                    />
                </div>

                {/* ── Missed Punch Out Alert ── */}
                {!loading && missedPunchOut.length > 0 && (
                    <div
                        className="alert-section"
                        style={{
                            background: "var(--warn-bg)",
                            border: "1px solid var(--warn)",
                            opacity: 0.9
                        }}
                    >
                        <div
                            className="alert-section-title"
                            style={{ color: "var(--warn)" }}
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
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)",
                                        borderRadius: 8,
                                        fontSize: ".76rem",
                                        fontWeight: 600,
                                        color: "var(--text-1)",
                                    }}
                                >
                                    {e.name}
                                    <span
                                        style={{
                                            fontFamily: "DM Mono,monospace",
                                            fontSize: ".68rem",
                                            color: "var(--text-2)",
                                        }}
                                    >
                                        ({e.employeeId})
                                    </span>
                                    {e.punchIn && (
                                        <span
                                            style={{
                                                marginLeft: 4,
                                                color: "var(--success)",
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
                            background: "var(--success-bg)",
                            border: "1px solid var(--success)",
                            opacity: 0.9
                        }}
                    >
                        <div
                            className="alert-section-title"
                            style={{ color: "var(--success)" }}
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
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)",
                                        borderRadius: 8,
                                        fontSize: ".76rem",
                                        fontWeight: 600,
                                        color: "var(--text-1)",
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
                                                background: "var(--danger-bg)",
                                                color: "var(--danger)",
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
                        className={`hr-tab ${tab === "daywise" ? "active" : ""}`}
                        onClick={() => setTab("daywise")}
                    >
                        <MdOutlineTableChart size={14} />
                        Day-wise Attendance
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

                {/* ─────────────────────────────────────────────
                     TODAY TAB
                ───────────────────────────────────────────── */}
                {tab === "today" && (
                    <>
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
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="punched_in">Punched In</option>
                                <option value="punched_out">Punched Out</option>
                                <option value="absent">Absent</option>
                                <option value="on_leave">On Leave</option>
                                <option value="not_started">Office Closed</option>
                            </select>
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
                        </div>

                        {loading && <StopwatchLoader />}

                        {!loading && (
                            <div className="hr-card">
                                <div className="hr-card-header">
                                    <HiOutlineClock size={16} color="#6366F1" />
                                    Today — {fmtDate(now)}
                                    <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "var(--text-2)", fontWeight: 600 }}>
                                        {filteredToday.length} employees
                                    </span>
                                </div>
                                <div style={{ overflowX: "auto" }}>
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
                                                    <td colSpan={7} className="empty-cell">No employees found</td>
                                                </tr>
                                            )}
                                            {filteredToday.map((emp) => (
                                                <tr key={emp._id}>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".75rem", flexShrink: 0 }}>
                                                                {initials(emp.name)}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 700, color: "var(--text-1)", fontSize: ".83rem" }}>{emp.name}</p>
                                                                <p style={{ fontSize: ".7rem", color: "var(--text-2)", fontFamily: "DM Mono,monospace", fontWeight: 500 }}>{emp.employeeId}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="dept-tag">{emp.department || "—"}</span></td>
                                                    <td><StatusBadge status={emp.attendanceStatus} /></td>
                                                    <td>
                                                        {emp.punchIn ? (
                                                            <span className="hr-chip">
                                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                                                                {fmt12(emp.punchIn)}
                                                                {emp.isLate && <span style={{ color: "#DC2626", fontWeight: 700 }}>+{emp.lateMinutes}m</span>}
                                                            </span>
                                                        ) : <span style={{ color: "#6B7280" }}>—</span>}
                                                    </td>
                                                    <td>
                                                        {emp.punchOut ? (
                                                            <span className="hr-chip">
                                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
                                                                {fmt12(emp.punchOut)}
                                                            </span>
                                                        ) : emp.missedPunchOut ? (
                                                            <span style={{ fontSize: ".72rem", color: "#DC2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                                                <HiOutlineExclamationCircle size={13} /> Missed
                                                            </span>
                                                        ) : <span style={{ color: "#6B7280" }}>—</span>}
                                                    </td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".77rem", color: "var(--text-1)", fontWeight: 600 }}>{fmtHours(emp.workHours)}</td>
                                                    <td style={{ fontSize: ".71rem" }}>
                                                        {emp.attendanceStatus === "not_started" && (
                                                            <span style={{ background: "var(--surface-3)", color: "var(--text-2)", padding: "2px 7px", borderRadius: 4, fontWeight: 600, fontSize: ".68rem" }}>
                                                                Opens {emp.shiftStartHour != null ? `${emp.shiftStartHour % 12 || 12}:${String(emp.shiftStartMinute).padStart(2, "0")} ${emp.shiftStartHour >= 12 ? "PM" : "AM"}` : "10:00 AM"}
                                                            </span>
                                                        )}
                                                        {emp.onLeave && <span style={{ background: "var(--brand-light)", color: "var(--brand)", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{emp.leaveType || "Leave"}</span>}
                                                        {emp.isHalfDay && !emp.onLeave && <span style={{ background: "var(--warn-bg)", color: "var(--warn)", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>Half Day</span>}
                                                        {emp.isLate && !emp.isHalfDay && !emp.onLeave && <span style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>Late</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ─────────────────────────────────────────────
                     DAY-WISE TAB
                ───────────────────────────────────────────── */}
                {tab === "daywise" && (
                    <>
                        <div className="hr-filters">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ fontWeight: 700 }}
                            />
                            <div className="search-wrap">
                                <HiOutlineSearch className="search-icon" size={15} />
                                <input
                                    className="hr-filters-search"
                                    placeholder="Search name or ID…"
                                    value={dayWiseSearch}
                                    onChange={(e) => setDayWiseSearch(e.target.value)}
                                />
                            </div>
                            <select
                                value={dayWiseStatusFilter}
                                onChange={(e) => setDayWiseStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="halfday">Half Day</option>
                                <option value="absent">Absent</option>
                                <option value="leave">Leave</option>
                                <option value="holiday">Holiday</option>
                                <option value="weekend">Weekend</option>
                            </select>
                            <select
                                value={dayWiseDeptFilter}
                                onChange={(e) => setDayWiseDeptFilter(e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                                <button className="btn-export btn-excel" onClick={handleExportExcel}>
                                    <HiOutlineDownload size={14} /> Excel
                                </button>
                                <button className="btn-export btn-pdf" onClick={handleExportPDF}>
                                    <HiOutlineDocumentText size={14} /> PDF
                                </button>
                            </div>
                        </div>

                        <div className="summary-strip">
                            {[
                                { label: "Present", val: dayWiseSummary.present, cfg: DAY_STATUS_CONFIG.present },
                                { label: "Late", val: dayWiseSummary.late, cfg: DAY_STATUS_CONFIG.late },
                                { label: "Half Day", val: dayWiseSummary.halfday, cfg: DAY_STATUS_CONFIG.halfday },
                                { label: "Absent", val: dayWiseSummary.absent, cfg: DAY_STATUS_CONFIG.absent },
                                { label: "Leave", val: dayWiseSummary.leave, cfg: DAY_STATUS_CONFIG.leave },
                                { label: "Weekend", val: dayWiseSummary.weekend, cfg: DAY_STATUS_CONFIG.weekend },
                            ].map(s => (
                                <div key={s.label} className="summary-pill" style={{
                                    background: isDark ? `${s.cfg.solid}15` : s.cfg.bg,
                                    borderColor: `${s.cfg.solid}33`
                                }}>
                                    <div className="summary-pill-val" style={{ color: s.cfg.solid }}>{s.val ?? 0}</div>
                                    <div className="summary-pill-lbl">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {dayWiseLoading && <StopwatchLoader />}

                        {!dayWiseLoading && (
                            <div className="hr-card">
                                <div className="hr-card-header">
                                    <MdOutlineTableChart size={16} color="#6366F1" />
                                    Attendance: {fmtDate(selectedDate)}
                                    <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "var(--text-2)", fontWeight: 600 }}>
                                        {dayWiseTotal} employees
                                    </span>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table className="hr-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Department</th>
                                                <th>Punch In</th>
                                                <th>Punch Out</th>
                                                <th>Work Hours</th>
                                                <th>Late</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dayWiseData.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="empty-cell">No data found</td>
                                                </tr>
                                            )}
                                            {dayWiseData.map((emp) => (
                                                <tr key={emp._id}>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".75rem", flexShrink: 0 }}>
                                                                {initials(emp.name)}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 700, color: "var(--text-1)", fontSize: ".83rem" }}>{emp.name}</p>
                                                                <p style={{ fontSize: ".7rem", color: "var(--text-2)", fontFamily: "DM Mono,monospace", fontWeight: 500 }}>{emp.employeeId}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="dept-tag">{emp.department || "—"}</span></td>
                                                    <td>{emp.punchIn ? <span className="hr-chip">{fmt12(emp.punchIn)}</span> : "—"}</td>
                                                    <td>{emp.punchOut ? <span className="hr-chip">{fmt12(emp.punchOut)}</span> : "—"}</td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".77rem", color: "var(--text-1)", fontWeight: 600 }}>{fmtHours(emp.workHours)}</td>
                                                    <td>{emp.lateMinutes > 0 ? <span style={{ color: "#DC2626", fontWeight: 700, fontSize: ".75rem" }}>{emp.lateMinutes}m</span> : "—"}</td>
                                                    <td><DayStatusBadge status={emp.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {dayWiseTotal > dayWiseLimit && (
                                    <div className="pagination">
                                        <div className="pagination-info">
                                            Showing {(dayWisePage - 1) * dayWiseLimit + 1} to {Math.min(dayWisePage * dayWiseLimit, dayWiseTotal)} of {dayWiseTotal}
                                        </div>
                                        <button
                                            className="pagination-btn"
                                            disabled={dayWisePage === 1}
                                            onClick={() => setDayWisePage(p => p - 1)}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            className="pagination-btn"
                                            disabled={dayWisePage * dayWiseLimit >= dayWiseTotal}
                                            onClick={() => setDayWisePage(p => p + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ─────────────────────────────────────────────
                     MONTHLY TAB
                ───────────────────────────────────────────── */}
                {!loading && tab === "monthly" && (
                    <>
                        <div className="hr-filters">
                            <div className="search-wrap">
                                <HiOutlineSearch className="search-icon" size={15} />
                                <input
                                    className="hr-filters-search"
                                    placeholder="Search name, ID or department…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div className="hr-card">
                            <div className="hr-card-header">
                                <RiBuilding2Line size={16} color="#6366F1" />
                                Monthly Stats — {MONTHS[viewMonth - 1]} {viewYear}
                                <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "var(--text-2)", fontWeight: 600 }}>
                                    {filteredMonthly.length} employees
                                </span>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table className="hr-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Full Day</th>
                                            <th>Half Day</th>
                                            <th>Leave</th>
                                            <th>Absent</th>
                                            <th>Average Hours/Day</th>
                                            <th>Shift Hours</th>
                                            <th>Compliance %</th>
                                            <th>Total Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMonthly.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="empty-cell">No data available</td>
                                            </tr>
                                        )}
                                        {filteredMonthly.map((emp) => {
                                            const s = emp.stats || {
                                                presentDays: 0, halfDays: 0, lateDays: 0,
                                                absentDays: 0, leaveDays: 0, totalWorkHours: 0,
                                                avgDailyHours: 0, totalLateMinutes: 0
                                            };
                                            return (
                                                <tr key={emp._id}>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".75rem", flexShrink: 0 }}>
                                                                {initials(emp.name)}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 700, color: "var(--text-1)", fontSize: ".83rem" }}>{emp.name || "—"}</p>
                                                                <p style={{ fontSize: ".7rem", color: "var(--text-2)", fontFamily: "DM Mono,monospace", fontWeight: 500 }}>{emp.employeeId || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="dept-tag">{emp.department || "—"}</span></td>
                                                    <td><span style={{ fontWeight: 700, color: "#15803D", fontSize: ".85rem" }}>{(s.presentDays || 0) + (s.lateDays || 0)}</span></td>
                                                    <td>{(s.halfDays || 0) > 0 ? <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: ".75rem" }}>{s.halfDays}</span> : <span style={{ color: "var(--text-2)", fontWeight: 500 }}>0</span>}</td>
                                                    <td>{(s.leaveDays || 0) > 0 ? <span style={{ background: "#F3E8FF", color: "#6B21A8", padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: ".75rem" }}>{s.leaveDays}</span> : <span style={{ color: "var(--text-2)", fontWeight: 500 }}>0</span>}</td>
                                                    <td>{(s.absentDays || 0) > 0 ? <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: ".75rem" }}>{s.absentDays}</span> : <span style={{ color: "var(--text-2)", fontWeight: 500 }}>0</span>}</td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".77rem", fontWeight: 600, color: "var(--text-1)" }}>{fmtHours(s.avgDailyHours)}</td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".77rem", fontWeight: 600, color: "var(--text-2)" }}>{s.expectedShiftHours}h</td>
                                                    <td>
                                                        <span style={{ fontWeight: 800, color: s.compliancePercentage >= 90 ? "var(--success)" : s.compliancePercentage >= 75 ? "#D97706" : "#DC2626" }}>
                                                            {s.compliancePercentage}%
                                                        </span>
                                                    </td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".77rem", fontWeight: 600, color: "var(--text-1)" }}>{fmtHours(s.totalWorkHours)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ─────────────────────────────────────────────
                     LEAVES TAB
                ───────────────────────────────────────────── */}
                {!loading && tab === "leaves" && (
                    <>
                        <div className="hr-filters">
                            <div className="search-wrap">
                                <HiOutlineSearch className="search-icon" size={15} />
                                <input
                                    className="hr-filters-search"
                                    placeholder="Search by name, ID or department…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="hr-card">
                            <div className="hr-card-header">
                                <MdOutlineBeachAccess size={16} color="#6366F1" />
                                Approved Leave Schedule — {MONTHS[viewMonth - 1]} {viewYear}
                                <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "var(--text-2)", fontWeight: 600 }}>
                                    {filteredLeaves.length} leaves
                                </span>
                            </div>
                            <div style={{ overflowX: "auto" }}>
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
                                                <td colSpan={7} className="empty-cell">No approved leaves for this period</td>
                                            </tr>
                                        )}
                                        {filteredLeaves.map((leave) => {
                                            const from = new Date(leave.fromDate);
                                            const to = new Date(leave.toDate);
                                            const days = leave.totalDays || (Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1);
                                            return (
                                                <tr key={leave._id}>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".75rem", flexShrink: 0 }}>
                                                                {initials(leave.user.name)}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 700, color: "var(--text-1)", fontSize: ".83rem" }}>{leave.user.name}</p>
                                                                <p style={{ fontSize: ".7rem", color: "var(--text-2)", fontFamily: "DM Mono,monospace", fontWeight: 500 }}>{leave.user.employeeId}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="dept-tag">{leave.user.department || "—"}</span></td>
                                                    <td><span style={{ background: "#F3E8FF", color: "#6B21A8", padding: "3px 9px", borderRadius: 5, fontWeight: 700, fontSize: ".74rem", textTransform: "capitalize" }}>{leave.type?.replace(/_/g, " ") || "Leave"}</span></td>
                                                    <td style={{ fontSize: ".8rem", color: "var(--text-1)", fontWeight: 500 }}>{fmtDate(leave.fromDate)}</td>
                                                    <td style={{ fontSize: ".8rem", color: "var(--text-1)", fontWeight: 500 }}>{fmtDate(leave.toDate)}</td>
                                                    <td><span style={{ fontWeight: 800, color: "#4F46E5", fontSize: ".85rem" }}>{days}</span><span style={{ fontSize: ".72rem", color: "var(--text-2)", marginLeft: 3, fontWeight: 500 }}>day{days !== 1 ? "s" : ""}</span></td>
                                                    <td><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 9px", borderRadius: 5, fontWeight: 700, fontSize: ".72rem" }}>Approved</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default HRAttendanceOverview;