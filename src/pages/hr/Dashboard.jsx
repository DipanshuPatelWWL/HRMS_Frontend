import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate, Link } from "react-router-dom";

const StatCard = ({ title, value, accent, action, actionLabel }) => {
    const nav = useNavigate();

    const accentMap = {
        brand: { bg: "#eef2ff", border: "#c7d2fe", num: "#3b5bdb", dot: "#3b5bdb" },
        success: { bg: "#f0fdf4", border: "#bbf7d0", num: "#15803d", dot: "#16a34a" },
        warn: { bg: "#fffbeb", border: "#fde68a", num: "#b45309", dot: "#d97706" },
        danger: { bg: "#fef2f2", border: "#fecaca", num: "#b91c1c", dot: "#dc2626" },
    };
    const a = accentMap[accent] || accentMap.brand;

    return (
        <div
            className="hrd-stat-card"
            style={{
                background: a.bg,
                border: `1.5px solid ${a.border}`,
                cursor: action ? "pointer" : "default",
            }}
            onClick={() => action && nav(action)}
        >
            <div className="hrd-stat-dot" style={{ background: a.dot }} />
            <p className="hrd-stat-title">{title}</p>
            <p className="hrd-stat-value" style={{ color: a.num }}>{value}</p>
            {actionLabel && (
                <p className="hrd-stat-action" style={{ color: a.dot }}>
                    {actionLabel} →
                </p>
            )}
        </div>
    );
};

const HRDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            API.get("/reports/hr-dashboard").catch(() => null),
            API.get("/leave/all?status=pending&limit=5").catch(() => null),
            API.get("/users").catch(() => null),
        ]).then(([statsRes, leaveRes, usersRes]) => {
            const users = usersRes?.data?.users || usersRes?.data?.employees || usersRes?.data?.data || [];
            if (statsRes) {
                setStats({ ...statsRes.data.data, totalEmployees: users.length });
            } else {
                setStats({ totalEmployees: users.length });
            }
            if (leaveRes) setRecent(leaveRes.data.leaves || []);
        }).finally(() => setLoading(false));
    }, []);

    const cards = [
        { title: "Total Employees", value: loading ? "—" : (stats?.totalEmployees ?? "—"), accent: "brand", action: "/hr/employees", actionLabel: "View all" },
        { title: "Present Today", value: loading ? "—" : (stats?.presentToday ?? "—"), accent: "success" },
        { title: "Pending Leaves", value: loading ? "—" : (stats?.pendingLeaves ?? recent.length), accent: "warn", action: "/hr/leave-approval", actionLabel: "Review" },
        { title: "Payrolls Generated", value: loading ? "—" : (stats?.payrollCount ?? "—"), accent: "danger", action: "/hr/payroll-management", actionLabel: "Manage" },
    ];

    const quickLinks = [
        { label: "Manage Employees", href: "/hr/employees", primary: true },
        { label: "Approve Leaves", href: "/hr/leave-approval", primary: false },
        { label: "Generate Payroll", href: "/hr/payroll-management", primary: false },
        { label: "Help Desk", href: "/hr/helpdesk", primary: false },
    ];

    return (
        <DashboardLayout>
            <div className="hrd-page">

                {/* ── Page Header ── */}
                <div className="hrd-page-header">
                    <div className="hrd-page-header-left">
                        <div className="hrd-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="hrd-page-title">HR Overview</h1>
                            <p className="hrd-page-sub">Organisation snapshot for today</p>
                        </div>
                    </div>
                    <div className="hrd-today-badge">
                        {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="hrd-stats-grid">
                    {cards.map(c => <StatCard key={c.title} {...c} />)}
                </div>

                {/* ── Pending Leave Requests ── */}
                <div className="hrd-card" style={{ marginTop: "20px" }}>
                    <div className="hrd-card-header">
                        <div className="hrd-card-title-row">
                            <div className="hrd-card-icon warn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                </svg>
                            </div>
                            <p className="hrd-card-title">Pending Leave Requests</p>
                        </div>
                        <Link to="/hr/leave-approval" className="hrd-view-all">View all →</Link>
                    </div>

                    {recent.length === 0 ? (
                        <div className="hrd-empty">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p className="hrd-empty-text">No pending requests</p>
                        </div>
                    ) : (
                        <div className="hrd-table-wrap">
                            <table className="hrd-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map(l => (
                                        <tr key={l._id}>
                                            <td className="hrd-td-name">{l.user?.name || "—"}</td>
                                            <td className="hrd-td-type">{l.type}</td>
                                            <td>{new Date(l.fromDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}</td>
                                            <td>{new Date(l.toDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}</td>
                                            <td className="hrd-td-reason">{l.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Quick Actions ── */}
                <div className="hrd-card" style={{ marginTop: "16px" }}>
                    <div className="hrd-card-title-row" style={{ marginBottom: "14px" }}>
                        <div className="hrd-card-icon brand">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                        <p className="hrd-card-title">Quick Actions</p>
                    </div>
                    <div className="hrd-quick-actions">
                        {quickLinks.map(({ label, href, primary }) => (
                            <Link key={label} to={href} className={primary ? "hrd-btn-primary" : "hrd-btn-ghost"}>
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                /* ── BASE ── */
                .hrd-page {
                    min-height: 100vh;
                    background: var(--surface-2);
                    padding: 32px;
                    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
                    box-sizing: border-box;
                }

                /* ── PAGE HEADER ── */
                .hrd-page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 14px;
                }
                .hrd-page-header-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .hrd-header-icon {
                    width: 46px;
                    height: 46px;
                    border-radius: 13px;
                    background: linear-gradient(135deg, #3b5bdb, #4c6ef5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 14px rgba(59,91,219,0.35);
                    flex-shrink: 0;
                }
                .hrd-page-title {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--text-1);
                    letter-spacing: -0.4px;
                }
                .hrd-page-sub {
                    margin: 2px 0 0;
                    font-size: 13px;
                    color: var(--text-2);
                    font-weight: 500;
                }
                .hrd-today-badge {
                    background: var(--surface);
                    border: 1.5px solid var(--border);
                    border-radius: 10px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-1);
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                    white-space: nowrap;
                }

                /* ── STAT CARDS ── */
                .hrd-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }
                .hrd-stat-card {
                    border-radius: 18px;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .hrd-stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                }
                .hrd-stat-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-bottom: 12px;
                }
                .hrd-stat-title {
                    margin: 0 0 6px;
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-1);
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                }
                .hrd-stat-value {
                    margin: 0;
                    font-size: 2.2rem;
                    font-weight: 800;
                    line-height: 1;
                    letter-spacing: -1px;
                }
                .hrd-stat-action {
                    margin: 8px 0 0;
                    font-size: 12px;
                    font-weight: 600;
                }

                /* ── CARDS ── */
                .hrd-card {
                    background: var(--surface);
                    border-radius: 20px;
                    padding: 22px 24px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
                    border: 1px solid var(--border);
                }
                .hrd-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .hrd-card-title-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .hrd-card-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .hrd-card-icon.warn  { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
                .hrd-card-icon.brand { background: #eef2ff; color: #3b5bdb; border: 1px solid #c7d2fe; }
                .hrd-card-title {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-1);
                }
                .hrd-view-all {
                    font-size: 13px;
                    font-weight: 600;
                    color: #3b5bdb;
                    text-decoration: none;
                    transition: opacity 0.12s;
                }
                .hrd-view-all:hover { opacity: 0.75; }

                /* ── EMPTY STATE ── */
                .hrd-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 28px 0;
                }
                .hrd-empty-text {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-2);
                }

                /* ── TABLE ── */
                .hrd-table-wrap {
                    overflow-x: auto;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                }
                .hrd-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13.5px;
                    min-width: 520px;
                }
                .hrd-table thead tr {
                    background: var(--surface-3);
                }
                .hrd-table th {
                    padding: 11px 14px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-1);
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    border-bottom: 1px solid var(--border);
                    white-space: nowrap;
                }
                .hrd-table td {
                    padding: 12px 14px;
                    color: var(--text-2);
                    font-weight: 500;
                    border-bottom: 1px solid var(--border);
                }
                .hrd-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .hrd-table tbody tr:hover td {
                    background: var(--surface-3);
                }
                .hrd-td-name {
                    font-weight: 700 !important;
                    color: var(--text-1) !important;
                }
                .hrd-td-type {
                    text-transform: capitalize;
                    font-weight: 600 !important;
                }
                .hrd-td-reason {
                    color: var(--text-2) !important;
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* ── QUICK ACTIONS ── */
                .hrd-quick-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .hrd-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    padding: 9px 18px;
                    background: linear-gradient(135deg, #3b5bdb, #4c6ef5);
                    color: white;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    box-shadow: 0 3px 10px rgba(59,91,219,0.3);
                    transition: transform 0.12s, box-shadow 0.12s;
                }
                .hrd-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(59,91,219,0.38);
                }
                .hrd-btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    padding: 9px 18px;
                    background: var(--surface-3);
                    color: var(--text-1);
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    border: 1.5px solid var(--border);
                    transition: background 0.12s, border-color 0.12s;
                }
                .hrd-btn-ghost:hover {
                    background: var(--surface-2);
                    border-color: var(--border-strong);
                }

                /* ── RESPONSIVE: TABLET (≤ 900px) ── */
                @media (max-width: 900px) {
                    .hrd-page {
                        padding: 20px;
                    }
                    .hrd-stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .hrd-page-title {
                        font-size: 18px;
                    }
                }

                /* ── RESPONSIVE: MOBILE (≤ 600px) ── */
                @media (max-width: 600px) {
                    .hrd-page {
                        padding: 14px 12px;
                    }
                    .hrd-page-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                        margin-bottom: 18px;
                    }
                    .hrd-today-badge {
                        align-self: flex-start;
                    }
                    .hrd-stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                    }
                    .hrd-stat-card {
                        padding: 16px;
                        border-radius: 14px;
                    }
                    .hrd-stat-value {
                        font-size: 1.7rem;
                    }
                    .hrd-card {
                        padding: 16px;
                        border-radius: 16px;
                    }
                    .hrd-card-title {
                        font-size: 14px;
                    }
                    .hrd-quick-actions {
                        gap: 8px;
                    }
                    .hrd-btn-primary,
                    .hrd-btn-ghost {
                        width: 100%;
                        justify-content: center;
                        padding: 10px 14px;
                    }
                    .hrd-header-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 11px;
                    }
                    .hrd-page-title {
                        font-size: 16px;
                    }
                    .hrd-page-sub {
                        font-size: 12px;
                    }
                }

                /* ── RESPONSIVE: TINY (≤ 380px) ── */
                @media (max-width: 380px) {
                    .hrd-stats-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                    }
                    .hrd-stat-value {
                        font-size: 1.4rem;
                    }
                    .hrd-stat-title {
                        font-size: 10px;
                    }
                    .hrd-page {
                        padding: 12px 8px;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default HRDashboard;