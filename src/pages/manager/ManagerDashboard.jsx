import { useEffect, useState, useContext } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
    FaUsers,
    FaCheckCircle,
    FaClipboardList,
    FaTicketAlt,
    FaMoneyBillWave,
    FaTasks,
} from "react-icons/fa";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
const StatCard = ({ title, value, accent, sub, icon: Icon, payrollPct }) => (
    <div
        className={`stat-card accent-${accent}`}
        style={{ position: "relative", overflow: "hidden" }}
    >
        <div className="stat-card-inner">
            <div style={{ flex: 1 }}>
                <p className="stat-label">{title}</p>
                <p className="stat-value">{value}</p>
                {sub && <p className="stat-sub">{sub}</p>}
                {payrollPct !== undefined && (
                    <div className="payroll-bar">
                        <div
                            className="payroll-fill"
                            style={{ "--pct": `${payrollPct}%` }}
                        />
                    </div>
                )}
            </div>
            {Icon && (
                <div className="stat-icon-wrap">
                    <Icon size={22} />
                </div>
            )}
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   Badge
───────────────────────────────────────────── */
const Badge = ({ label, color }) => (
    <span className={`badge badge-${color}`}>
        <span className="badge-dot" />
        {label}
    </span>
);

/* ─────────────────────────────────────────────
   Leave Request Row
───────────────────────────────────────────── */
const LeaveRow = ({ name, type, dates, status, onApprove, onReject }) => {
    const statusColor =
        status === "pending" ? "warn" : status === "approved" ? "success" : "danger";
    return (
        <div className="list-row">
            <div className="avatar av-purple">
                {name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
            </div>
            <div className="row-info">
                <p className="row-name">{name}</p>
                <p className="row-sub">
                    {type} · {dates}
                </p>
            </div>
            <Badge label={status} color={statusColor} />
            {status === "pending" && (
                <div className="action-btns">
                    <button
                        onClick={onApprove}
                        className="act-btn act-approve"
                        title="Approve"
                    >
                        ✓
                    </button>
                    <button
                        onClick={onReject}
                        className="act-btn act-reject"
                        title="Reject"
                    >
                        ✗
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Attendance Row
───────────────────────────────────────────── */
const AttendanceRow = ({ name, status, checkIn, checkOut }) => {
    const dotColor = {
        present: "#22c55e",
        absent: "#ef4444",
        late: "#f59e0b",
        "half-day": "#8b5cf6",
        punched_in: "#22c55e",
        half_day: "#8b5cf6",
        on_leave: "#a78bfa",
    };
    const displayStatus =
        status === "punched_in"
            ? "present"
            : status === "half_day"
                ? "half day"
                : status === "on_leave"
                    ? "on leave"
                    : status || "—";

    return (
        <div className="list-row">
            <div
                className="att-dot"
                style={{ background: dotColor[status] || "#9ca3af" }}
            />
            <div className="row-info">
                <p className="row-name">{name}</p>
            </div>
            <p className="row-time">
                {checkIn ? `${checkIn}${checkOut ? ` – ${checkOut}` : ""}` : "—"}
            </p>
            <span
                className="att-status"
                style={{ color: dotColor[status] || "#9ca3af" }}
            >
                {displayStatus}
            </span>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Employee Row
───────────────────────────────────────────── */
const EmployeeRow = ({ name, department, status }) => (
    <div className="list-row">
        <div className="avatar av-blue">
            {name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
        </div>
        <div className="row-info">
            <p className="row-name">{name}</p>
            <p className="row-sub">{department || "—"}</p>
        </div>
        <Badge
            label={status || "active"}
            color={status === "inactive" ? "danger" : "success"}
        />
    </div>
);

/* ══════════════════════════════════════════
   Manager Dashboard
══════════════════════════════════════════ */
const ManagerDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [teamAttendance, setTeamAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [payrollStats, setPayrollStats] = useState(null);
    const [taskStats, setTaskStats] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [
                    dashRes,
                    hrDashRes,
                    leaveRes,
                    attendRes,
                    employeeRes,
                    payrollRes,
                    taskRes,
                    ticketRes,
                ] = await Promise.allSettled([
                    API.get("/reports/dashboard"),
                    API.get("/reports/hr-dashboard"),
                    API.get("/leave/all?status=pending&limit=5"),
                    API.get(`/attendance/hr-overview?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
                    API.get("/users"),
                    API.get("/payroll/stats"),
                    API.get("/tasks/stats"),
                    API.get("/tickets?limit=5"),
                ]);

                if (
                    hrDashRes.status === "fulfilled" &&
                    hrDashRes.value.data?.data
                ) {
                    setStats(hrDashRes.value.data.data);
                } else if (
                    dashRes.status === "fulfilled" &&
                    dashRes.value.data?.data
                ) {
                    setStats(dashRes.value.data.data);
                } else {
                    setStats({});
                }

                if (leaveRes.status === "fulfilled") {
                    const d = leaveRes.value.data;
                    setLeaveRequests(
                        Array.isArray(d) ? d : d?.leaves || d?.data || []
                    );
                }

                if (attendRes.status === "fulfilled") {
                    const d = attendRes.value.data;
                    // hr-overview returns todaySummary array
                    const list = d?.todaySummary || d?.attendance || d?.data;
                    setTeamAttendance(Array.isArray(list) ? list : Array.isArray(d) ? d : []);
                }

                if (employeeRes.status === "fulfilled") {
                    const d = employeeRes.value.data;
                    setEmployees(
                        Array.isArray(d) ? d : d?.users || d?.data || []
                    );
                }

                if (payrollRes.status === "fulfilled") {
                    // Support both { stats: {...} } and { data: {...} } shapes
                    const raw = payrollRes.value.data;
                    setPayrollStats(raw?.stats || raw?.data || raw || null);
                }

                if (taskRes.status === "fulfilled") {
                    const raw = taskRes.value.data;
                    setTaskStats(raw?.stats || raw?.data?.stats || raw?.data || raw || null);
                }

                if (ticketRes.status === "fulfilled") {
                    const d = ticketRes.value.data;
                    setTickets(
                        Array.isArray(d) ? d : d?.tickets || d?.data || []
                    );
                }
            } catch (err) {
                setError(
                    err.response?.data?.message || "Failed to load dashboard"
                );
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const handleLeaveAction = async (leaveId, action) => {
        try {
            await API.put(`/leave/hr-approve/${leaveId}`, {
                action: action === "approve" ? "approved" : "rejected",
            });
            setLeaveRequests((prev) =>
                prev.map((l) =>
                    l._id === leaveId
                        ? {
                            ...l,
                            status: action === "approve" ? "approved" : "rejected",
                        }
                        : l
                )
            );
            toast.success(action === "approve" ? "Leave approved!" : "Leave rejected!");
        } catch (err) {
            const message = err.response?.data?.message || "Action failed";
            toast.error(message);
        }
    };

    const firstName = user?.name?.split(" ")[0] || "Manager";
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    // Payroll display value — handle multiple possible field names
    const payrollPaidAmount =
        payrollStats?.paidAmount ||
        payrollStats?.totalPaid ||
        payrollStats?.totalNet ||
        null;
    const payrollPaidCount = payrollStats?.paid ?? null;
    const payrollTotal = payrollStats?.total ?? null;
    const payrollPct =
        payrollPaidCount != null && payrollTotal && payrollTotal > 0
            ? Math.round((payrollPaidCount / payrollTotal) * 100)
            : payrollPaidAmount
                ? 68
                : 0;
    const payrollDisplay = payrollPaidAmount
        ? `₹${(payrollPaidAmount / 1000).toFixed(0)}k`
        : payrollPaidCount != null
            ? `${payrollPaidCount} paid`
            : "—";

    const statCards = [
        {
            title: "Total Employees",
            value: loading
                ? "—"
                : stats?.totalEmployees ?? employees.length ?? "—",
            accent: "purple",
            sub: "Company-wide",
            icon: FaUsers,
        },
        {
            title: "Present Today",
            value: loading
                ? "—"
                : stats?.presentToday ??
                teamAttendance.filter(
                    (a) =>
                        a.attendanceStatus === "punched_in" ||
                        a.status === "present"
                ).length,
            accent: "green",
            sub: "Checked in",
            icon: FaCheckCircle,
        },
        {
            title: "Pending Leaves",
            value: loading
                ? "—"
                : stats?.pendingLeaves ??
                leaveRequests.filter((l) => l.status === "pending").length,
            accent: "amber",
            sub: "Awaiting approval",
            icon: FaClipboardList,
        },
        {
            title: "Open Tickets",
            value: loading
                ? "—"
                : stats?.openTickets ??
                tickets.filter((t) => t.status !== "closed").length,
            accent: "red",
            sub: "Support requests",
            icon: FaTicketAlt,
        },
        {
            title: "Payroll (Month)",
            value: loading ? "—" : payrollDisplay,
            accent: "blue",
            sub: `${payrollPaidCount ?? 0} paid · ${(payrollStats?.draft ?? 0)
                } draft`,
            icon: FaMoneyBillWave,
            payrollPct: loading ? 0 : payrollPct,
        },
        {
            title: "Total Tasks",
            value: loading ? "—" : taskStats?.total ?? "—",
            accent: "indigo",
            sub: `${taskStats?.inProgress ?? 0} in-progress · ${taskStats?.done ?? 0} done`,
            icon: FaTasks,
        },
    ];

    if (error)
        return (
            <DashboardLayout>
                <div style={{ padding: "2rem", color: "var(--danger)" }}>
                    {error}
                </div>
            </DashboardLayout>
        );

    return (
        <DashboardLayout>
            <style>{`
                .mgr-root {
                    font-family: 'DM Sans', sans-serif;
                    padding-bottom: 40px;
                }

                /* ── Entrance animations ── */
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.94); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes fillBar {
                    from { width: 0; }
                    to   { width: var(--pct); }
                }
                @keyframes pulseDot {
                    0%,100% { opacity: 1; transform: scale(1); }
                    50%     { opacity: 0.5; transform: scale(1.5); }
                }

                /* ── Header ── */
                .mgr-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 12px;
                    animation: fadeUp 0.4s ease both;
                }
                .mgr-header h1 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #111318;
                    letter-spacing: -0.4px;
                    margin-bottom: 3px;
                }
                .mgr-header p {
                    font-size: .83rem;
                    color: #374151;
                    font-weight: 500;
                }
                .mgr-btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }

                /* ── Buttons ── */
                .mgr-btn {
                    padding: 8px 18px;
                    border-radius: 9px;
                    font-size: .82rem;
                    font-weight: 700;
                    cursor: pointer;
                    border: 1.5px solid transparent;
                    transition: all 0.2s cubic-bezier(.4,0,.2,1);
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: 0.1px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .mgr-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
                }
                .mgr-btn:active { transform: translateY(0) scale(0.97); box-shadow: none; }
                .mgr-btn-primary { background: #5B4CF5; color: #fff; border-color: #5B4CF5; }
                .mgr-btn-primary:hover { background: #4a3de0; border-color: #4a3de0; }
                .mgr-btn-ghost { background: #fff; color: #111318; border-color: #E2E8F0; }
                .mgr-btn-ghost:hover { background: #F8FAFC; border-color: #C7D2FE; color: #5B4CF5; }

                /* ── Stat cards grid ── */
                .mgr-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 14px;
                    margin-bottom: 20px;
                }
                @media(max-width:900px){ .mgr-stats-grid{ grid-template-columns: repeat(2,1fr); } }
                @media(max-width:560px){ .mgr-stats-grid{ grid-template-columns: 1fr; } }

                .stat-card {
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid #E8EBF0;
                    padding: 18px 20px 16px;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(.4,0,.2,1);
                    animation: scaleIn 0.35s ease both;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.1);
                    border-color: transparent;
                }
                .stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    border-radius: 16px 16px 0 0;
                    transition: height 0.25s ease;
                }
                .stat-card:hover::before { height: 5px; }

                /* Accent colors */
                .accent-purple::before { background: #7C3AED; }
                .accent-green::before  { background: #16A34A; }
                .accent-amber::before  { background: #D97706; }
                .accent-red::before    { background: #DC2626; }
                .accent-blue::before   { background: #2563EB; }
                .accent-indigo::before { background: #4F46E5; }

                .accent-purple .stat-icon-wrap { background: #EDE9FE; color: #7C3AED; }
                .accent-green  .stat-icon-wrap { background: #DCFCE7; color: #16A34A; }
                .accent-amber  .stat-icon-wrap { background: #FEF3C7; color: #D97706; }
                .accent-red    .stat-icon-wrap { background: #FEE2E2; color: #DC2626; }
                .accent-blue   .stat-icon-wrap { background: #DBEAFE; color: #2563EB; }
                .accent-indigo .stat-icon-wrap { background: #E0E7FF; color: #4F46E5; }

                .stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
                .stat-label {
                    font-size: .67rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .7px;
                    color: #374151;
                    margin-bottom: 8px;
                }
                .stat-value {
                    font-size: 2.1rem;
                    font-weight: 800;
                    color: #111318;
                    line-height: 1;
                    letter-spacing: -1.5px;
                    font-variant-numeric: tabular-nums;
                }
                .stat-sub {
                    font-size: .72rem;
                    color: #374151;
                    margin-top: 5px;
                    font-weight: 500;
                }
                .stat-icon-wrap {
                    width: 42px;
                    height: 42px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: transform 0.25s cubic-bezier(.4,0,.2,1);
                }
                .stat-card:hover .stat-icon-wrap {
                    transform: scale(1.12) rotate(-6deg);
                }

                /* Payroll progress bar */
                .payroll-bar {
                    height: 5px;
                    background: #F1F5F9;
                    border-radius: 3px;
                    margin-top: 10px;
                    overflow: hidden;
                    width: 100%;
                }
                .payroll-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #2563EB, #7C3AED);
                    border-radius: 3px;
                    width: 0;
                    animation: fillBar 1.2s cubic-bezier(.4,0,.2,1) 0.5s forwards;
                }

                /* Stagger entrance delays for stat cards */
                .stat-card:nth-child(1) { animation-delay: .05s; }
                .stat-card:nth-child(2) { animation-delay: .10s; }
                .stat-card:nth-child(3) { animation-delay: .15s; }
                .stat-card:nth-child(4) { animation-delay: .20s; }
                .stat-card:nth-child(5) { animation-delay: .25s; }
                .stat-card:nth-child(6) { animation-delay: .30s; }

                /* ── Bottom grid ── */
                .mgr-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
                    animation: fadeUp 0.4s ease both;
                    animation-delay: 0.35s;
                }
                .mgr-row:last-child { animation-delay: 0.45s; }
                @media(max-width:700px){ .mgr-row{ grid-template-columns: 1fr; } }

                .mgr-card {
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid #E8EBF0;
                    padding: 18px 20px;
                    transition: box-shadow 0.2s ease, border-color 0.2s ease;
                }
                .mgr-card:hover {
                    box-shadow: 0 6px 24px rgba(0,0,0,0.07);
                    border-color: #E0E7FF;
                }
                .mgr-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                }
                .mgr-card-title {
                    font-size: .88rem;
                    font-weight: 700;
                    color: #111318;
                }
                .mgr-view-btn {
                    font-size: .76rem;
                    color: #5B4CF5;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 700;
                    transition: opacity 0.15s, letter-spacing 0.15s;
                    padding: 4px 8px;
                    border-radius: 6px;
                }
                .mgr-view-btn:hover {
                    opacity: 0.75;
                    background: #EDE9FE;
                    letter-spacing: 0.2px;
                }

                /* ── List rows ── */
                .list-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 6px;
                    border-bottom: 1px solid #F8FAFC;
                    border-radius: 8px;
                    transition: background 0.15s ease, padding-left 0.15s ease, transform 0.15s ease;
                    cursor: pointer;
                }
                .list-row:last-child { border-bottom: none; }
                .list-row:hover {
                    background: #F8FAFC;
                    padding-left: 10px;
                    transform: translateX(2px);
                }
                .row-info { flex: 1; min-width: 0; }
                .row-name {
                    font-size: .84rem;
                    font-weight: 600;
                    color: #111318;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .row-sub {
                    font-size: .72rem;
                    color: #374151;
                    margin-top: 1px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .row-time {
                    font-size: .72rem;
                    color: #374151;
                    font-family: 'DM Mono', monospace;
                    min-width: 72px;
                    text-align: right;
                }
                .att-status {
                    font-size: .71rem;
                    font-weight: 700;
                    min-width: 54px;
                    text-align: right;
                    text-transform: capitalize;
                }

                /* ── Avatars ── */
                .avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: .74rem;
                    font-weight: 700;
                    flex-shrink: 0;
                    transition: transform 0.2s ease;
                }
                .list-row:hover .avatar { transform: scale(1.08); }
                .av-purple { background: #EDE9FE; color: #6D28D9; }
                .av-blue   { background: #DBEAFE; color: #1D4ED8; }
                .av-green  { background: #DCFCE7; color: #15803D; }

                /* Attendance dot */
                .att-dot {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    transition: transform 0.2s ease;
                }
                .list-row:hover .att-dot { transform: scale(1.4); }

                /* ── Badges ── */
                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: .69rem;
                    font-weight: 700;
                    padding: 3px 9px;
                    border-radius: 20px;
                    white-space: nowrap;
                    transition: transform 0.15s ease;
                    text-transform: capitalize;
                }
                .list-row:hover .badge { transform: scale(1.05); }
                .badge-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                }
                .badge-warn    { background: #FEF3C7; color: #92400E; }
                .badge-warn .badge-dot { background: #D97706; }
                .badge-success { background: #DCFCE7; color: #166534; }
                .badge-success .badge-dot { background: #16A34A; }
                .badge-danger  { background: #FEE2E2; color: #991B1B; }
                .badge-danger .badge-dot { background: #DC2626; }
                .badge-brand   { background: #E0E7FF; color: #3730A3; }
                .badge-brand .badge-dot { background: #4F46E5; }

                /* ── Action buttons ── */
                .action-btns { display: flex; gap: 5px; }
                .act-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 7px;
                    border: none;
                    cursor: pointer;
                    font-size: .8rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                    font-family: 'DM Sans', sans-serif;
                }
                .act-approve { background: #DCFCE7; color: #166534; }
                .act-approve:hover { background: #16A34A; color: #fff; transform: scale(1.12); }
                .act-reject  { background: #FEE2E2; color: #991B1B; }
                .act-reject:hover  { background: #DC2626; color: #fff; transform: scale(1.12); }

                /* ── Empty state ── */
                .empty-state {
                    text-align: center;
                    padding: 2.5rem 1rem;
                    color: #374151;
                }
                .empty-icon { font-size: 1.8rem; opacity: 0.25; margin-bottom: 8px; }
                .empty-text { font-size: .84rem; font-weight: 500; }

                /* ── Loading skeleton ── */
                .skeleton {
                    background: linear-gradient(90deg, #F1F5F9 25%, #E8EBF0 50%, #F1F5F9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 6px;
                }
                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .skel-line { height: 12px; margin: 6px 0; }
                .skel-value { height: 32px; width: 60%; margin: 8px 0 4px; }
            `}</style>

            <div className="mgr-root">
                {/* ── Header ── */}
                <div className="mgr-header">
                    <div>
                        <h1>
                            {greeting}, {firstName}
                        </h1>
                        <p>
                            Full company overview — manage employees, payroll,
                            leaves &amp; more
                        </p>
                    </div>
                    <div className="mgr-btn-row">
                        <button
                            onClick={() => navigate("/manager-employees")}
                            className="mgr-btn mgr-btn-primary"
                        >
                            + Add Employee
                        </button>
                        <button
                            onClick={() =>
                                navigate("/manager-payroll-management")
                            }
                            className="mgr-btn mgr-btn-ghost"
                        >
                            <FaMoneyBillWave /> Payroll
                        </button>
                        <button
                            onClick={() => navigate("/manager-attendance")}
                            className="mgr-btn mgr-btn-ghost"
                        >
                            <span className="">
                                < FaClipboardList />
                            </span> Attendance
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="mgr-stats-grid">
                    {statCards.map((c) => (
                        <StatCard key={c.title} {...c} />
                    ))}
                </div>

                {/* ── Row 1: Leaves + Attendance ── */}
                <div className="mgr-row">
                    {/* Pending Leave Requests */}
                    <div className="mgr-card">
                        <div className="mgr-card-header">
                            <span className="mgr-card-title">
                                Pending Leave Requests
                            </span>
                            <button
                                onClick={() =>
                                    navigate("/manager-leave-approval")
                                }
                                className="mgr-view-btn"
                            >
                                View all →
                            </button>
                        </div>
                        {loading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="list-row"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        <div
                                            className="skeleton"
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                className="skeleton skel-line"
                                                style={{ width: "60%" }}
                                            />
                                            <div
                                                className="skeleton skel-line"
                                                style={{ width: "40%" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : leaveRequests.filter((l) => l.status === "pending")
                            .length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaCheckCircle />
                                </div>
                                <p className="empty-text">
                                    No pending requests
                                </p>
                            </div>
                        ) : (
                            leaveRequests
                                .filter((l) => l.status === "pending")
                                .slice(0, 4)
                                .map((req) => (
                                    <LeaveRow
                                        key={req._id}
                                        name={
                                            req.employee?.fullName ||
                                            req.employee?.name ||
                                            req.employeeName ||
                                            "Employee"
                                        }
                                        type={req.leaveType || req.type || "Leave"}
                                        dates={
                                            req.startDate
                                                ? `${new Date(
                                                    req.startDate
                                                ).toLocaleDateString(
                                                    "en-IN",
                                                    {
                                                        day: "numeric",
                                                        month: "short",
                                                    }
                                                )}${req.endDate &&
                                                    req.endDate !==
                                                    req.startDate
                                                    ? ` – ${new Date(
                                                        req.endDate
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                        }
                                                    )}`
                                                    : ""
                                                }`
                                                : "—"
                                        }
                                        status={req.status || "pending"}
                                        onApprove={() =>
                                            handleLeaveAction(
                                                req._id,
                                                "approve"
                                            )
                                        }
                                        onReject={() =>
                                            handleLeaveAction(req._id, "reject")
                                        }
                                    />
                                ))
                        )}
                    </div>

                    {/* Attendance Overview */}
                    <div className="mgr-card">
                        <div className="mgr-card-header">
                            <span className="mgr-card-title">
                                Attendance Overview
                            </span>
                            <button
                                onClick={() => navigate("/manager-attendance")}
                                className="mgr-view-btn"
                            >
                                Full view →
                            </button>
                        </div>
                        {loading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="list-row"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        <div
                                            className="skeleton"
                                            style={{
                                                width: 9,
                                                height: 9,
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                className="skeleton skel-line"
                                                style={{ width: "50%" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : teamAttendance.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaClipboardList />
                                </div>
                                <p className="empty-text">
                                    No attendance data yet
                                </p>
                            </div>
                        ) : (
                            teamAttendance.slice(0, 5).map((a, i) => (
                                <AttendanceRow
                                    key={a._id || i}
                                    name={
                                        a.employee?.fullName ||
                                        a.employee?.name ||
                                        a.employeeName ||
                                        a.name ||
                                        "Employee"
                                    }
                                    status={a.attendanceStatus || a.status}
                                    checkIn={
                                        a.punchIn || a.checkIn
                                            ? new Date(
                                                a.punchIn || a.checkIn
                                            ).toLocaleTimeString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : null
                                    }
                                    checkOut={
                                        a.punchOut || a.checkOut
                                            ? new Date(
                                                a.punchOut || a.checkOut
                                            ).toLocaleTimeString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : null
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── Row 2: Employees + Tickets ── */}
                <div className="mgr-row">
                    {/* Employees */}
                    <div className="mgr-card">
                        <div className="mgr-card-header">
                            <span className="mgr-card-title">
                                All Employees
                            </span>
                            <button
                                onClick={() => navigate("/manager-employees")}
                                className="mgr-view-btn"
                            >
                                Manage →
                            </button>
                        </div>
                        {loading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="list-row"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        <div
                                            className="skeleton"
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                className="skeleton skel-line"
                                                style={{ width: "55%" }}
                                            />
                                            <div
                                                className="skeleton skel-line"
                                                style={{ width: "35%" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : employees.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaUsers />
                                </div>
                                <p className="empty-text">No employees found</p>
                            </div>
                        ) : (
                            employees.slice(0, 5).map((emp, i) => (
                                <EmployeeRow
                                    key={emp._id || i}
                                    name={
                                        emp.fullName || emp.name || "Employee"
                                    }
                                    department={
                                        emp.department?.name ||
                                        emp.department ||
                                        "—"
                                    }
                                    status={emp.status || "active"}
                                />
                            ))
                        )}
                    </div>

                    {/* Tickets */}
                    <div className="mgr-card">
                        <div className="mgr-card-header">
                            <span className="mgr-card-title">
                                Recent Tickets
                            </span>
                            <button
                                onClick={() => navigate("/manager-helpdesk")}
                                className="mgr-view-btn"
                            >
                                View all →
                            </button>
                        </div>
                        {loading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="list-row"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div
                                                className="skeleton skel-line"
                                                style={{ width: "65%" }}
                                            />
                                            <div
                                                className="skeleton skel-line"
                                                style={{ width: "40%" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : tickets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <FaTicketAlt />
                                </div>
                                <p className="empty-text">No tickets found</p>
                            </div>
                        ) : (
                            tickets.slice(0, 5).map((t, i) => (
                                <div
                                    key={t._id || i}
                                    className="list-row"
                                    onClick={() =>
                                        navigate("/manager-helpdesk")
                                    }
                                >
                                    <div className="row-info">
                                        <p className="row-name">
                                            {t.subject || t.title || "Ticket"}
                                        </p>
                                        <p className="row-sub">
                                            {t.employee?.fullName ||
                                                t.employee?.name ||
                                                "Employee"}{" "}
                                            · {t.category || "General"}
                                        </p>
                                    </div>
                                    <Badge
                                        label={t.status || "open"}
                                        color={
                                            t.status === "closed"
                                                ? "success"
                                                : t.status === "in-progress"
                                                    ? "brand"
                                                    : "warn"
                                        }
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
                theme="light"
            />
        </DashboardLayout>
    );
};

export default ManagerDashboard;