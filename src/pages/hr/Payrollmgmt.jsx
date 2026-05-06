import { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { generatePayslipPDF } from "../../utils/payslipPDF";
import StopwatchLoader from "../../components/common/StopwatchLoader";

import {
    FiCreditCard, FiSettings, FiList, FiRefreshCw,
    FiDownload, FiCheckCircle, FiTrash2, FiZap,
    FiCalendar, FiFilter, FiUsers, FiDollarSign,
    FiTrendingUp, FiClock, FiCheck, FiX,
    FiChevronDown, FiAlertCircle
} from "react-icons/fi";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (n) =>
    typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—";

// ─────────────────────────────────────────────
//  Animated wrapper hook
// ─────────────────────────────────────────────
const useFadeIn = (delay = 0) => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "translateY(18px)";
        const timer = setTimeout(() => {
            el.style.transition = `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        }, 50);
        return () => clearTimeout(timer);
    }, [delay]);
    return ref;
};

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const s = status === "paid"
        ? { bg: "#dcfce7", color: "#166534", border: "#86efac", dot: "#16a34a", label: "Paid", Icon: FiCheckCircle }
        : { bg: "#fef9c3", color: "#854d0e", border: "#fde047", dot: "#ca8a04", label: "Draft", Icon: FiClock };
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            padding: "4px 10px", borderRadius: "20px", fontSize: ".71rem", fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            cursor: "default",
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
            <s.Icon size={11} />
            {s.label}
        </span>
    );
};

const StatCard = ({ label, value, sub, accent, Icon, delay = 0 }) => {
    const ref = useFadeIn(delay);
    return (
        <div ref={ref} style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "1.1rem 1.25rem",
            borderTop: `3px solid ${accent}`,
            transition: "transform 0.22s ease, box-shadow 0.22s ease",
            cursor: "default",
            position: "relative",
            overflow: "hidden",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.09)`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Decorative bg icon */}
            <div style={{ position: "absolute", top: 10, right: 14, opacity: 0.07, color: accent }}>
                {Icon && <Icon size={42} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: ".4rem" }}>
                {Icon && (
                    <span style={{
                        background: `${accent}18`, color: accent,
                        borderRadius: 8, width: 30, height: 30,
                        display: "grid", placeItems: "center", flexShrink: 0,
                        transition: "background 0.2s"
                    }}>
                        <Icon size={15} />
                    </span>
                )}
                <p style={{ fontSize: ".72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>{label}</p>
            </div>
            <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</p>
            {sub && <p style={{ fontSize: ".72rem", color: "#94a3b8", marginTop: ".3rem" }}>{sub}</p>}
        </div>
    );
};

// Icon button with ripple + hover
const IconBtn = ({ onClick, disabled, title, children, variant = "ghost", style = {} }) => {
    const base = {
        display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px",
        borderRadius: 8, fontSize: ".75rem", fontWeight: 600, cursor: "pointer",
        border: "1px solid transparent", transition: "all 0.18s ease",
        outline: "none", ...style,
    };
    const variants = {
        ghost: { background: "#f1f5f9", color: "#374151", borderColor: "#e2e8f0" },
        primary: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
        success: { background: "#166534", color: "#fff", borderColor: "#166534" },
        danger: { background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" },
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{ ...base, ...variants[variant], opacity: disabled ? 0.6 : 1 }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.96)"; }}
            onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = ""; }}
        >
            {children}
        </button>
    );
};

// Animated select
const AnimSelect = ({ value, onChange, children, minWidth = 120 }) => (
    <div style={{ position: "relative", display: "inline-block" }}>
        <select
            value={value}
            onChange={onChange}
            style={{
                appearance: "none", padding: "7px 32px 7px 12px",
                borderRadius: 8, border: "1px solid #e2e8f0",
                background: "#fff", fontSize: ".8rem", fontWeight: 500,
                color: "#1e293b", cursor: "pointer", minWidth,
                transition: "border-color 0.18s, box-shadow 0.18s",
                outline: "none",
            }}
            onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
        >
            {children}
        </select>
        <FiChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
);

// ─────────────────────────────────────────────
//  HR Payroll Management Page
// ─────────────────────────────────────────────
const PayrollMgmt = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selected, setSelected] = useState(new Set());

    const [filterMonth, setFilterMonth] = useState(currentMonth);
    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterStatus, setFilterStatus] = useState("");

    const [genMonth, setGenMonth] = useState(currentMonth);
    const [genYear, setGenYear] = useState(currentYear);
    const [genResult, setGenResult] = useState(null);

    const [markingId, setMarkingId] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [toastVisible, setToastVisible] = useState(false);
    const [hoveredRow, setHoveredRow] = useState(null);

    const headerRef = useFadeIn(0);
    const genPanelRef = useFadeIn(100);
    const tablePanelRef = useFadeIn(200);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setToastVisible(true);
        setTimeout(() => {
            setToastVisible(false);
            setTimeout(() => setToast(null), 300);
        }, 3200);
    };

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterMonth) params.set("month", filterMonth);
            if (filterYear) params.set("year", filterYear);
            if (filterStatus) params.set("status", filterStatus);

            const [pRes, sRes] = await Promise.all([
                API.get(`/payroll/all?${params}`),
                API.get(`/payroll/stats?month=${filterMonth}&year=${filterYear}`),
            ]);
            setPayrolls(pRes.data.payrolls || []);
            setStats(sRes.data.stats || null);
            setSelected(new Set());
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load payrolls", "error");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchPayrolls(); }, [filterMonth, filterYear, filterStatus]);

    const handleGenerate = async () => {
        setGenerating(true);
        setGenResult(null);
        try {
            const res = await API.post("/payroll/generate", { month: genMonth, year: genYear });
            setGenResult(res.data);
            showToast(`Generated ${res.data.generated} payslip(s)`);
            fetchPayrolls();
        } catch (err) {
            showToast(err.response?.data?.message || "Generation failed", "error");
        } finally { setGenerating(false); }
    };

    const handleMarkPaid = async (id) => {
        setMarkingId(id);
        try {
            await API.put(`/payroll/${id}/mark-paid`, { remarks: "" });
            setPayrolls(prev => prev.map(p =>
                p._id === id ? { ...p, status: "paid", paidAt: new Date() } : p
            ));
            showToast("Marked as paid ✅");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed", "error");
        } finally { setMarkingId(null); }
    };

    const handleBulkPaid = async () => {
        if (!selected.size) return;
        setBulkLoading(true);
        try {
            await API.put("/payroll/bulk-mark-paid", { ids: [...selected], remarks: "" });
            setPayrolls(prev => prev.map(p =>
                selected.has(p._id) ? { ...p, status: "paid", paidAt: new Date() } : p
            ));
            setSelected(new Set());
            showToast(`${selected.size} payroll(s) marked as paid ✅`);
        } catch (err) {
            showToast(err.response?.data?.message || "Bulk action failed", "error");
        } finally { setBulkLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this draft payroll?")) return;
        try {
            await API.delete(`/payroll/${id}`);
            setPayrolls(prev => prev.filter(p => p._id !== id));
            showToast("Deleted");
        } catch (err) {
            showToast(err.response?.data?.message || "Delete failed", "error");
        }
    };

    const toggleSelect = (id) => {
        setSelected(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const toggleAll = () => {
        const draftIds = payrolls.filter(p => p.status === "draft").map(p => p._id);
        if (draftIds.every(id => selected.has(id))) {
            setSelected(new Set());
        } else {
            setSelected(new Set(draftIds));
        }
    };

    const draftPayrolls = payrolls.filter(p => p.status === "draft");

    return (
        <DashboardLayout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

                .pr-root { font-family: 'DM Sans', sans-serif; }

                .pr-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .pr-panel {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 1.35rem;
                    margin-bottom: 1.25rem;
                    transition: box-shadow 0.2s ease;
                }

                .pr-panel:hover {
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                }

                .pr-panel-title {
                    font-size: .78rem;
                    font-weight: 700;
                    color: #1e293b;
                    text-transform: uppercase;
                    letter-spacing: .6px;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: .5rem;
                }

                .pr-panel-title svg {
                    transition: transform 0.3s ease;
                }

                .pr-panel:hover .pr-panel-title svg {
                    transform: rotate(15deg);
                }

                .pr-filter-row {
                    display: flex;
                    gap: .65rem;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }

                /* Table */
                .pr-table { border-collapse: collapse; }
                .pr-table th {
                    background: #f8fafc;
                    font-size: .7rem;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                    color: #64748b;
                    font-weight: 700;
                    border-bottom: 1px solid #e2e8f0;
                    padding: .65rem .85rem;
                    white-space: nowrap;
                }
                .pr-table td {
                    padding: .7rem .85rem;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: .83rem;
                    color: #262729;
                    transition: background 0.15s ease;
                }
                .pr-table tr:last-child td { border-bottom: none; }
                .pr-table tbody tr {
                    transition: background 0.15s ease;
                    cursor: default;
                }
                .pr-table tbody tr:hover td { background: #f8fafc; }
                .pr-table tbody tr.row-hovered td { background: #f0f7ff; }

                /* Checkbox */
                .pr-cb {
                    width: 15px;
                    height: 15px;
                    cursor: pointer;
                    accent-color: #2563eb;
                    transition: transform 0.15s;
                }
                .pr-cb:hover { transform: scale(1.15); }

                /* Employee chip */
                .emp-chip { display: flex; align-items: center; gap: .6rem; }
                .emp-avatar {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: linear-gradient(135deg,#3b82f6,#8b5cf6);
                    color: #fff; display: grid; place-items: center;
                    font-size: .72rem; font-weight: 700; flex-shrink: 0;
                    transition: transform 0.22s ease, box-shadow 0.22s ease;
                }
                .pr-table tbody tr:hover .emp-avatar {
                    transform: scale(1.08);
                    box-shadow: 0 4px 12px rgba(59,130,246,0.35);
                }
                .emp-name { font-weight: 600; color: #0f172a; font-size: .83rem; }
                .emp-meta { font-size: .69rem; color: #64748b; }

                /* Action buttons area */
                .pr-actions { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
                .pr-actions button { opacity: 0; transform: translateX(6px); transition: opacity 0.18s ease, transform 0.18s ease; }
                .pr-table tbody tr:hover .pr-actions button,
                .pr-table tbody tr.row-hovered .pr-actions button {
                    opacity: 1;
                    transform: translateX(0);
                }

                /* Toast */
                .toast {
                    position: fixed; bottom: 1.5rem; right: 1.5rem;
                    padding: .75rem 1.3rem; border-radius: 12px;
                    font-size: .83rem; font-weight: 600; z-index: 9999;
                    display: flex; align-items: center; gap: .6rem;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.18);
                    transition: opacity 0.3s ease, transform 0.3s ease;
                }
                .toast.success { background: #166534; color: #fff; }
                .toast.error   { background: #991b1b; color: #fff; }
                .toast-enter   { opacity: 1; transform: translateY(0); }
                .toast-exit    { opacity: 0; transform: translateY(14px); }

                /* Gen result banner */
                .gen-result {
                    background: linear-gradient(90deg, #f0fdf4, #dcfce7);
                    border: 1px solid #86efac; border-radius: 10px;
                    padding: .75rem 1rem; font-size: .8rem; color: #166534;
                    margin-top: .75rem; display: flex; align-items: center; gap: .5rem;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Spinning refresh icon */
                .spin { animation: spin 0.7s linear; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Attendance dots */
                .att-dot {
                    display: inline-flex; align-items: center; gap: 3px;
                    padding: 2px 7px; border-radius: 20px; font-size: .71rem;
                    font-weight: 700; transition: transform 0.18s ease;
                }
                .att-dot:hover { transform: scale(1.1); }

                /* Page header */
                .pr-page-header {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: .75rem;
                }

                /* Form label */
                .pr-label {
                    display: block; font-size: .72rem; font-weight: 600;
                    color: #64748b; margin-bottom: .3rem; letter-spacing: .3px;
                }

                @media (max-width: 900px) { .pr-stats { grid-template-columns: 1fr 1fr; } }
                @media (max-width: 600px) { .pr-stats { grid-template-columns: 1fr; } }
            `}</style>

            <div className="pr-root">
                {/* Header */}
                <div ref={headerRef} className="pr-page-header">
                    <div>
                        <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            <span style={{
                                background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                                color: "#fff", width: 38, height: 38, borderRadius: 10,
                                display: "grid", placeItems: "center",
                                boxShadow: "0 4px 14px rgba(37,99,235,0.3)"
                            }}>
                                <FiCreditCard size={18} />
                            </span>
                            Payroll Management
                        </h1>
                        <p style={{ fontSize: ".83rem", color: "#64748b", margin: ".3rem 0 0 48px" }}>
                            Generate payslips, mark salaries as paid, and download records
                        </p>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="pr-stats">
                        <StatCard label="Total Payslips" value={stats.total} sub={`${MONTHS[filterMonth - 1]} ${filterYear}`} accent="#3b82f6" Icon={FiUsers} delay={0} />
                        <StatCard label="Paid" value={stats.paid} sub={`₹${(stats.paidAmount || 0).toLocaleString("en-IN")}`} accent="#16a34a" Icon={FiCheckCircle} delay={80} />
                        <StatCard label="Pending (Draft)" value={stats.draft} sub={`₹${(stats.draftAmount || 0).toLocaleString("en-IN")}`} accent="#f59e0b" Icon={FiClock} delay={160} />
                        <StatCard label="Total Payable" value={`₹${(stats.totalNet || 0).toLocaleString("en-IN")}`} sub="Gross net salaries" accent="#8b5cf6" Icon={FiTrendingUp} delay={240} />
                    </div>
                )}

                {/* Generate Panel */}
                <div ref={genPanelRef} className="pr-panel">
                    <p className="pr-panel-title">
                        <span style={{ background: "#eff6ff", color: "#2563eb", width: 26, height: 26, borderRadius: 6, display: "grid", placeItems: "center" }}>
                            <FiSettings size={13} />
                        </span>
                        Generate Payroll
                    </p>
                    <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div>
                            <label className="pr-label"><FiCalendar size={10} style={{ marginRight: 4 }} />Month</label>
                            <AnimSelect value={genMonth} onChange={e => setGenMonth(+e.target.value)} minWidth={150}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </AnimSelect>
                        </div>
                        <div>
                            <label className="pr-label"><FiCalendar size={10} style={{ marginRight: 4 }} />Year</label>
                            <AnimSelect value={genYear} onChange={e => setGenYear(+e.target.value)} minWidth={100}>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </AnimSelect>
                        </div>
                        <IconBtn
                            variant="primary"
                            onClick={handleGenerate}
                            disabled={generating}
                            style={{ padding: "8px 18px", fontSize: ".82rem" }}
                        >
                            {generating ? (
                                <>
                                    <FiRefreshCw size={14} className="spin" />
                                    Generating…
                                </>
                            ) : (
                                <>
                                    <FiZap size={14} />
                                    Generate for All Employees
                                </>
                            )}
                        </IconBtn>
                    </div>
                    {genResult && (
                        <div className="gen-result">
                            <FiCheckCircle size={15} />
                            <strong>{genResult.generated}</strong> payslip(s) generated successfully
                        </div>
                    )}
                </div>

                {/* Filter + Table */}
                <div ref={tablePanelRef} className="pr-panel">
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem", marginBottom: "1rem" }}>
                        <p className="pr-panel-title" style={{ margin: 0 }}>
                            <span style={{ background: "#f0fdf4", color: "#16a34a", width: 26, height: 26, borderRadius: 6, display: "grid", placeItems: "center" }}>
                                <FiList size={13} />
                            </span>
                            Payroll Records
                        </p>
                        {selected.size > 0 && (
                            <IconBtn
                                variant="success"
                                onClick={handleBulkPaid}
                                disabled={bulkLoading}
                                style={{ fontSize: ".78rem", animation: "slideDown 0.2s ease" }}
                            >
                                {bulkLoading ? (
                                    <><FiRefreshCw size={13} className="spin" />Processing…</>
                                ) : (
                                    <><FiCheck size={13} />Mark {selected.size} as Paid</>
                                )}
                            </IconBtn>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="pr-filter-row" style={{ marginBottom: "1.1rem" }}>
                        <div>
                            <label className="pr-label"><FiCalendar size={10} style={{ marginRight: 4 }} />Month</label>
                            <AnimSelect value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} minWidth={140}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </AnimSelect>
                        </div>
                        <div>
                            <label className="pr-label"><FiCalendar size={10} style={{ marginRight: 4 }} />Year</label>
                            <AnimSelect value={filterYear} onChange={e => setFilterYear(+e.target.value)} minWidth={100}>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </AnimSelect>
                        </div>
                        <div>
                            <label className="pr-label"><FiFilter size={10} style={{ marginRight: 4 }} />Status</label>
                            <AnimSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} minWidth={110}>
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="paid">Paid</option>
                            </AnimSelect>
                        </div>
                        <IconBtn
                            variant="ghost"
                            onClick={fetchPayrolls}
                            style={{ marginTop: "auto" }}
                        >
                            <FiRefreshCw size={13} />
                            Refresh
                        </IconBtn>
                    </div>

                    {loading && <StopwatchLoader />}

                    {!loading && payrolls.length === 0 && (
                        <div style={{
                            textAlign: "center", padding: "3.5rem",
                            animation: "slideDown 0.3s ease"
                        }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "50%",
                                background: "#f1f5f9", display: "grid",
                                placeItems: "center", margin: "0 auto .75rem",
                            }}>
                                <FiAlertCircle size={28} color="#94a3b8" />
                            </div>
                            <p style={{ fontWeight: 700, color: "#475569", fontSize: ".95rem" }}>No payrolls found</p>
                            <p style={{ fontSize: ".82rem", color: "#94a3b8", marginTop: ".25rem" }}>
                                Generate payroll for {MONTHS[filterMonth - 1]} {filterYear} above
                            </p>
                        </div>
                    )}

                    {!loading && payrolls.length > 0 && (
                        <div className="table-wrap" style={{ overflowX: "auto" }}>
                            <table className="table pr-table" style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 36 }}>
                                            <input
                                                type="checkbox"
                                                className="pr-cb"
                                                checked={draftPayrolls.length > 0 && draftPayrolls.every(p => selected.has(p._id))}
                                                onChange={toggleAll}
                                                title="Select all drafts"
                                            />
                                        </th>
                                        <th>Employee</th>
                                        <th>Period</th>
                                        <th>Attendance</th>
                                        <th>Monthly CTC</th>
                                        <th>Deductions</th>
                                        <th>Net Salary</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls.map((p, idx) => {
                                        const emp = p.employee || {};
                                        const init = (emp.name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                                        const isHovered = hoveredRow === p._id;
                                        return (
                                            <tr
                                                key={p._id}
                                                className={isHovered ? "row-hovered" : ""}
                                                onMouseEnter={() => setHoveredRow(p._id)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                                style={{ transition: "background 0.15s ease" }}
                                            >
                                                <td>
                                                    {p.status === "draft" && (
                                                        <input
                                                            type="checkbox"
                                                            className="pr-cb"
                                                            checked={selected.has(p._id)}
                                                            onChange={() => toggleSelect(p._id)}
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="emp-chip">
                                                        <div className="emp-avatar">{init}</div>
                                                        <div>
                                                            <div className="emp-name">{emp.name || "—"}</div>
                                                            <div className="emp-meta">
                                                                {emp.employeeId || ""}
                                                                {emp.designation && ` · ${emp.designation}`}
                                                                {emp.department && ` · ${emp.department}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".8rem", color: "#475569" }}>
                                                        <FiCalendar size={11} />
                                                        {MONTHS[(p.month || 1) - 1]} {p.year}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                        <span className="att-dot" style={{ background: "#dcfce7", color: "#166534" }}>
                                                            <FiCheck size={9} />{p.presentDays ?? 0}P
                                                        </span>
                                                        {p.absentDays > 0 && (
                                                            <span className="att-dot" style={{ background: "#fee2e2", color: "#dc2626" }}>
                                                                <FiX size={9} />{p.absentDays}A
                                                            </span>
                                                        )}
                                                        {p.halfDays > 0 && (
                                                            <span className="att-dot" style={{ background: "#fff7ed", color: "#ea580c" }}>
                                                                {p.halfDays}H
                                                            </span>
                                                        )}
                                                        {p.paidLeave > 0 && (
                                                            <span className="att-dot" style={{ background: "#eff6ff", color: "#2563eb" }}>
                                                                {p.paidLeave}
                                                                PL
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#475569", fontSize: ".83rem" }}>

                                                        ₹ {p.monthlySalary ? p.monthlySalary.toLocaleString("en-IN") : "—"}
                                                    </div>
                                                </td>
                                                <td style={{ color: "#dc2626", fontWeight: 600, fontSize: ".83rem" }}>
                                                    {p.deductions > 0 ? `- ₹${p.deductions.toLocaleString("en-IN")}` : <span style={{ color: "#94a3b8" }}>—</span>}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 800, fontSize: ".95rem", color: "#0f172a" }}>
                                                        ₹{(p.netSalary || 0).toLocaleString("en-IN")}
                                                    </span>
                                                </td>
                                                <td><StatusBadge status={p.status} /></td>
                                                <td>
                                                    <div className="pr-actions">
                                                        <IconBtn
                                                            variant="ghost"
                                                            title="Download PDF"
                                                            onClick={() => generatePayslipPDF(p)}
                                                            style={{ fontSize: ".71rem", padding: "5px 10px" }}
                                                        >
                                                            <FiDownload size={12} />
                                                            PDF
                                                        </IconBtn>
                                                        {p.status === "draft" && (
                                                            <>
                                                                <IconBtn
                                                                    variant="success"
                                                                    onClick={() => handleMarkPaid(p._id)}
                                                                    disabled={markingId === p._id}
                                                                    style={{ fontSize: ".71rem", padding: "5px 10px" }}
                                                                >
                                                                    {markingId === p._id
                                                                        ? <FiRefreshCw size={12} className="spin" />
                                                                        : <><FiCheck size={12} />Paid</>}
                                                                </IconBtn>
                                                                <IconBtn
                                                                    variant="danger"
                                                                    onClick={() => handleDelete(p._id)}
                                                                    title="Delete draft"
                                                                    style={{ fontSize: ".71rem", padding: "5px 9px" }}
                                                                >
                                                                    <FiTrash2 size={12} />
                                                                </IconBtn>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type} ${toastVisible ? "toast-enter" : "toast-exit"}`}>
                    {toast.type === "success"
                        ? <FiCheckCircle size={16} />
                        : <FiAlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}
        </DashboardLayout>
    );
};

export default PayrollMgmt;