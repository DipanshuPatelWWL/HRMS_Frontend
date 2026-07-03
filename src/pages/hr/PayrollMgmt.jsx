import { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { generatePayslipPDF } from "../../utils/payslipPDF";
import StopwatchLoader from "../../components/common/StopwatchLoader";
import Swal from "sweetalert2";

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
const StatusBadge = ({ status, isPreview }) => {
    if (isPreview) {
        return (
            <span style={{
                background: "#dbeafe", color: "#1e40af", border: "1.5px solid #93c5fd",
                padding: "5px 12px", borderRadius: "20px", fontSize: ".78rem", fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 6,
            }}>
                <FiZap size={13} />
                PREVIEW
            </span>
        );
    }
    const s = status === "paid"
        ? { bg: "var(--success-bg)", color: "var(--success)", border: "var(--success)", dot: "var(--success)", label: "FINAL (Paid)", Icon: FiCheckCircle }
        : { bg: "var(--warn-bg)", color: "var(--warn)", border: "var(--warn)", dot: "var(--warn)", label: "FINAL (Draft)", Icon: FiClock };
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
            padding: "5px 12px", borderRadius: "20px", fontSize: ".78rem", fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 6,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            cursor: "default",
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
            <s.Icon size={13} />
            {s.label}
        </span>
    );
};

// ─────────────────────────────────────────────
//  Preview / Detail Modal Sub-component
// ─────────────────────────────────────────────
const SalaryPreviewModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    // Distinguish between Live Preview (no status) and Saved Payroll record
    const isSavedRecord = !!data._id;
    const earnedAmount = data.grossEarnings ?? data.earnedTillDate;
    const netAmount = data.netSalary ?? data.projectedMonthEndNet;
    const tdsAmount = data.statutoryDeductions?.tds?.amount ?? data.projectedMonthEndTDS ?? 0;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            backdropFilter: "blur(4px)"
        }} onClick={onClose}>
            <div style={{
                background: "var(--surface)", width: "100%", maxWidth: 550,
                borderRadius: 16, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                animation: "slideDown 0.3s ease"
            }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: "1.1rem" }}>
                        {isSavedRecord ? <FiList color="#2563eb" /> : <FiZap color="#2563eb" />}
                        {isSavedRecord ? "Salary Breakdown" : "Live Salary Preview"}
                    </h3>
                    <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-3)" }}><FiX size={20} /></button>
                </div>

                <div style={{ padding: "1.5rem", maxHeight: "80vh", overflowY: "auto" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                        {/* Summary Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div style={{ background: "var(--surface-2)", padding: "1rem", borderRadius: 10 }}>
                                <p style={{ fontSize: ".7rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Monthly CTC</p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 800, margin: "4px 0" }}>₹{data.monthlySalary?.toLocaleString("en-IN")}</p>
                            </div>
                            <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                                <p style={{ fontSize: ".7rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                                    {isSavedRecord ? "Gross Earnings" : "Earned Till Date"}
                                </p>
                                <p style={{ fontSize: "1.3rem", fontWeight: 800, margin: "4px 0", color: "#15803d" }}>₹{earnedAmount?.toLocaleString("en-IN")}</p>
                            </div>
                        </div>

                        {isSavedRecord && (
                            <>
                                {/* Attendance Breakdown */}
                                <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "10px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", textAlign: "center" }}>
                                    <div>
                                        <p style={{ fontSize: ".65rem", color: "var(--text-3)", margin: 0 }}>PRESENT</p>
                                        <p style={{ fontSize: ".9rem", fontWeight: 700, margin: 0 }}>{data.presentDays}d</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: ".65rem", color: "var(--text-3)", margin: 0 }}>ABSENT</p>
                                        <p style={{ fontSize: ".9rem", fontWeight: 700, margin: 0, color: "#dc2626" }}>{data.absentDays}d</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: ".65rem", color: "var(--text-3)", margin: 0 }}>HALF DAY</p>
                                        <p style={{ fontSize: ".9rem", fontWeight: 700, margin: 0, color: "#d97706" }}>{data.halfDays}d</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: ".65rem", color: "var(--text-3)", margin: 0 }}>PAID LEAVE</p>
                                        <p style={{ fontSize: ".9rem", fontWeight: 700, margin: 0, color: "#1d4ed8" }}>{data.paidLeave || 0}d</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: ".65rem", color: "var(--text-3)", margin: 0 }}>LOP DAYS</p>
                                        <p style={{ fontSize: ".9rem", fontWeight: 800, margin: 0, color: "#991b1b" }}>
                                            {data.lopDays ?? Math.max(0, (data.absentDays || 0) + (data.halfDays || 0) * 0.5)}d
                                        </p>
                                    </div>
                                </div>

                                {/* Components Breakdown */}
                                <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                                    <div style={{ background: "var(--surface-3)", padding: "8px 12px", fontSize: ".75rem", fontWeight: 800, color: "var(--text-2)" }}>EARNINGS COMPONENTS</div>
                                    <div style={{ padding: "12px" }}>
                                        {(() => {
                                            const STRUCTURE_LABELS = {
                                                basic: "Basic Salary",
                                                hra: "HRA (House Rent Allowance)",
                                                specialAllowance: "Special Allowance",
                                                conveyance: "Conveyance / Internet",
                                                otherAllowance: "Other Allowance",
                                            };
                                            return Object.entries(data.salaryStructure || {})
                                                .filter(([, comp]) => comp.amount > 0)
                                                .map(([key, comp], i) => (
                                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: "6px" }}>
                                                        <span>{comp.label || STRUCTURE_LABELS[key] || key}</span>
                                                        <span style={{ fontWeight: 600 }}>₹{comp.amount?.toLocaleString()}</span>
                                                    </div>
                                                ));
                                        })()}
                                    </div>

                                    <div style={{ background: "var(--surface-3)", padding: "8px 12px", fontSize: ".75rem", fontWeight: 800, color: "var(--text-2)", borderTop: "1px solid var(--border)" }}>DEDUCTIONS</div>
                                    <div style={{ padding: "12px" }}>
                                        {(() => {
                                            const DEDUCTION_LABELS = { pf: "Provident Fund (PF)", esi: "ESI", professionalTax: "Professional Tax", tds: "Income Tax (TDS)" };
                                            return Object.entries(data.statutoryDeductions || {})
                                                .filter(([, ded]) => ded && ded.amount > 0)
                                                .map(([key, ded], i) => (
                                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", marginBottom: "6px" }}>
                                                        <span>{ded.label || DEDUCTION_LABELS[key] || key.toUpperCase()}</span>
                                                        <span style={{ fontWeight: 600, color: "#dc2626" }}>- ₹{ded.amount?.toLocaleString()}</span>
                                                    </div>
                                                ));
                                        })()}
                                    </div>
                                </div>
                            </>
                        )}

                        {!isSavedRecord && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <p style={{ fontSize: ".75rem", color: "var(--text-3)", fontWeight: 700 }}>Proj. Gross</p>
                                    <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>₹{data.projectedMonthEndGross?.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: ".75rem", color: "var(--text-3)", fontWeight: 700 }}>Proj. TDS</p>
                                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#dc2626" }}>- ₹{data.projectedMonthEndTDS?.toLocaleString("en-IN")}</p>
                                </div>
                            </div>
                        )}

                        {/* Final Net Section */}
                        <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: 10, border: "1px solid #bfdbfe", textAlign: "center" }}>
                            <p style={{ fontSize: ".75rem", color: "#1e40af", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>
                                {isSavedRecord ? "Final Net Payout" : "Projected Month-End Net"}
                            </p>
                            <p style={{ fontSize: "1.8rem", fontWeight: 800, margin: "4px 0", color: "#1d4ed8" }}>₹{netAmount?.toLocaleString("en-IN")}</p>
                            <p style={{ fontSize: ".7rem", color: "#1e40af", margin: 0 }}>
                                {isSavedRecord ? `Payout for ${MONTHS[data.month - 1]} ${data.year}` : "Expected payout if no further LOPs occur"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, sub, accent, Icon, delay = 0 }) => {
    const ref = useFadeIn(delay);
    return (
        <div ref={ref} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "1.2rem 1.35rem",
            borderTop: `3px solid ${accent}`,
            transition: "transform 0.22s ease, box-shadow 0.22s ease",
            cursor: "default",
            position: "relative",
            overflow: "hidden",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.1)`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Decorative bg icon */}
            <div style={{ position: "absolute", top: 10, right: 14, opacity: 0.1, color: accent }}>
                {Icon && <Icon size={44} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: ".5rem" }}>
                {Icon && (
                    <span style={{
                        background: `${accent}22`, color: accent,
                        borderRadius: 8, width: 34, height: 34,
                        display: "grid", placeItems: "center", flexShrink: 0,
                        transition: "background 0.2s"
                    }}>
                        <Icon size={17} />
                    </span>
                )}
                <p style={{ fontSize: ".78rem", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 700 }}>{label}</p>
            </div>
            <p style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{value}</p>
            {sub && <p style={{ fontSize: ".78rem", color: "var(--text-3)", marginTop: ".35rem", fontWeight: 500 }}>{sub}</p>}
        </div>
    );
};

// Icon button with ripple + hover
const IconBtn = ({ onClick, disabled, title, children, variant = "ghost", style = {} }) => {
    const base = {
        display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
        borderRadius: 8, fontSize: ".8rem", fontWeight: 700, cursor: "pointer",
        border: "1px solid transparent", transition: "all 0.18s ease",
        outline: "none", ...style,
    };
    const variants = {
        ghost: { background: "var(--surface-3)", color: "var(--text-1)", borderColor: "var(--border)" },
        primary: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
        success: { background: "#15803d", color: "#fff", borderColor: "#15803d" },
        danger: { background: "var(--warn-bg)", color: "var(--warn)", borderColor: "var(--warn)" },
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{ ...base, ...variants[variant], opacity: disabled ? 0.6 : 1 }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.14)"; } }}
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
                appearance: "none", padding: "8px 34px 8px 13px",
                borderRadius: 8, border: "1.5px solid var(--border)",
                background: "var(--surface)", fontSize: ".85rem", fontWeight: 600,
                color: "var(--text-1)", cursor: "pointer", minWidth,
                transition: "border-color 0.18s, box-shadow 0.18s",
                outline: "none",
            }}
            onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.14)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
        >
            {children}
        </select>
        <FiChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
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

    // New state for single preview
    const [previewData, setPreviewData] = useState(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const headerRef = useFadeIn(0);
    const genPanelRef = useFadeIn(100);
    const tablePanelRef = useFadeIn(200);

    const isCurrentViewMonth = filterMonth === currentMonth && filterYear === currentYear;

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
        if (generating) return;
        setGenerating(true);
        setGenResult(null);
        try {
            const res = await API.post("/payroll/generate", { month: genMonth, year: genYear });
            setGenResult(res.data);
            showToast(`Generated ${res.data.generated || 0} payslip(s)`);
            fetchPayrolls();
        } catch (err) {
            if (err.response?.status === 400 && err.response?.data?.message?.includes("Salary Preview")) {
                Swal.fire({
                    title: "Payroll Blocked",
                    text: err.response.data.message,
                    icon: "info",
                    confirmButtonText: "Close"
                });
            } else if (err.response?.status === 429) {
                showToast("A payroll generation job is already in progress. Please wait.", "error");
            } else {
                showToast(err.response?.data?.message || "Generation failed", "error");
            }
        } finally { setGenerating(false); }
    };

    const handleShowPreview = async (empId) => {
        try {
            const res = await API.get(`/payroll/preview?employeeId=${empId}&month=${filterMonth}&year=${filterYear}`);
            setPreviewData(res.data.preview);
            setIsPreviewModalOpen(true);
        } catch (err) {
            showToast("Failed to fetch preview", "error");
        }
    };

    const handleViewPayslip = (p) => {
        setPreviewData(p);
        setIsPreviewModalOpen(true);
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
        const result = await Swal.fire({
            title: "Delete Payroll?",
            text: "This draft payroll will be permanently deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

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
                .pr-root { font-family: 'DM Sans', sans-serif; }

                .pr-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .pr-panel {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    padding: 1.45rem;
                    margin-bottom: 1.25rem;
                    transition: box-shadow 0.2s ease;
                }

                .pr-panel:hover {
                    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
                }

                .pr-panel-title {
                    font-size: .85rem;
                    font-weight: 800;
                    color: var(--text-1);
                    text-transform: uppercase;
                    letter-spacing: .6px;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: .55rem;
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
                    background: var(--surface-3);
                    font-size: .76rem;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                    color: var(--text-2);
                    font-weight: 800;
                    border-bottom: 1.5px solid var(--border);
                    padding: .75rem .9rem;
                    white-space: nowrap;
                }
                .pr-table td {
                    padding: .8rem .9rem;
                    border-bottom: 1px solid var(--border);
                    font-size: .88rem;
                    color: var(--text-1);
                    transition: background 0.15s ease;
                }
                .pr-table tr:last-child td { border-bottom: none; }
                .pr-table tbody tr {
                    transition: background 0.15s ease;
                    cursor: default;
                }
                .pr-table tbody tr:hover td { background: var(--surface-2); }
                .pr-table tbody tr.row-hovered td { background: var(--surface-3); }

                /* Checkbox */
                .pr-cb {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    accent-color: #2563eb;
                    transition: transform 0.15s;
                }
                .pr-cb:hover { transform: scale(1.15); }

                /* Employee chip */
                .emp-chip { display: flex; align-items: center; gap: .7rem; }
                .emp-avatar {
                    width: 38px; height: 38px; border-radius: 10px;
                    background: linear-gradient(135deg,#2563eb,#7c3aed);
                    color: #fff; display: grid; place-items: center;
                    font-size: .75rem; font-weight: 800; flex-shrink: 0;
                    transition: transform 0.22s ease, box-shadow 0.22s ease;
                }
                .pr-table tbody tr:hover .emp-avatar {
                    transform: scale(1.08);
                    box-shadow: 0 4px 14px rgba(37,99,235,0.38);
                }
                .emp-name { font-weight: 700; color: var(--text-1); font-size: .9rem; }
                .emp-meta { font-size: .75rem; color: var(--text-2); font-weight: 500; margin-top: 1px; }

                /* Action buttons area — always visible, stronger colors */
                .pr-actions { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
                .pr-actions button {
                    opacity: 0.45;
                    transform: translateX(4px);
                    transition: opacity 0.18s ease, transform 0.18s ease;
                }
                .pr-table tbody tr:hover .pr-actions button,
                .pr-table tbody tr.row-hovered .pr-actions button {
                    opacity: 1;
                    transform: translateX(0);
                }

                /* Toast */
                .toast {
                    position: fixed; bottom: 1.5rem; right: 1.5rem;
                    padding: .8rem 1.4rem; border-radius: 12px;
                    font-size: .88rem; font-weight: 700; z-index: 9999;
                    display: flex; align-items: center; gap: .65rem;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                    transition: opacity 0.3s ease, transform 0.3s ease;
                }
                .toast.success { background: #14532d; color: #fff; }
                .toast.error   { background: #7f1d1d; color: #fff; }
                .toast-enter   { opacity: 1; transform: translateY(0); }
                .toast-exit    { opacity: 0; transform: translateY(14px); }

                /* Gen result banner */
                .gen-result {
                    background: linear-gradient(90deg, #f0fdf4, #dcfce7);
                    border: 1.5px solid #4ade80; border-radius: 10px;
                    padding: .8rem 1.1rem; font-size: .85rem; color: #14532d;
                    margin-top: .85rem; display: flex; align-items: center; gap: .55rem;
                    font-weight: 600;
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
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 3px 8px; border-radius: 20px; font-size: .76rem;
                    font-weight: 800; transition: transform 0.18s ease;
                    border: 1px solid transparent;
                }
                .att-dot:hover { transform: scale(1.1); }

                /* Page header */
                .pr-page-header {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: .75rem;
                }

                /* Form label */
                .pr-label {
                    display: flex; align-items: center; gap: 4px;
                    font-size: .78rem; font-weight: 700;
                    color: var(--text-2); margin-bottom: .35rem; letter-spacing: .3px;
                }

                /* Period cell */
                .period-cell {
                    display: flex; align-items: center; gap: 6px;
                    font-size: .86rem; color: var(--text-1); font-weight: 500;
                }

                /* Net salary */
                .net-salary {
                    font-weight: 800; font-size: 1rem; color: var(--text-1);
                }

                /* Deduction */
                .deduction-val {
                    color: #b91c1c; font-weight: 700; font-size: .88rem;
                }

                @media (max-width: 900px) { .pr-stats { grid-template-columns: 1fr 1fr; } }
                @media (max-width: 600px) { .pr-stats { grid-template-columns: 1fr; } }
            `}</style>

            <div className="pr-root">
                {/* Header */}
                <div ref={headerRef} className="pr-page-header">
                    <div>
                        <h1 style={{ display: "flex", alignItems: "center", gap: 11, fontSize: "1.55rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            <span style={{
                                background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                                color: "#fff", width: 42, height: 42, borderRadius: 11,
                                display: "grid", placeItems: "center",
                                boxShadow: "0 4px 16px rgba(37,99,235,0.32)"
                            }}>
                                <FiCreditCard size={20} />
                            </span>
                            Payroll Management
                        </h1>
                        <p style={{ fontSize: ".88rem", color: "#374151", margin: ".35rem 0 0 53px", fontWeight: 500 }}>
                            Generate payslips, mark salaries as paid, and download records
                        </p>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="pr-stats">
                        <StatCard label="Total Payslips" value={stats.total} sub={`${MONTHS[filterMonth - 1]} ${filterYear}`} accent="#3b82f6" Icon={FiUsers} delay={0} />
                        <StatCard label="Paid" value={stats.paid} sub={`₹${(stats.paidAmount || 0).toLocaleString("en-IN")}`} accent="#16a34a" Icon={FiCheckCircle} delay={80} />
                        <StatCard label="Pending (Draft)" value={stats.draft} sub={`₹${(stats.draftAmount || 0).toLocaleString("en-IN")}`} accent="#d97706" Icon={FiClock} delay={160} />
                        <StatCard label="Total Payable" value={`₹${(stats.totalNet || 0).toLocaleString("en-IN")}`} sub="Gross net salaries" accent="#7c3aed" Icon={FiTrendingUp} delay={240} />
                    </div>
                )}

                {/* Generate Panel */}
                <div ref={genPanelRef} className="pr-panel">
                    <p className="pr-panel-title">
                        <span style={{ background: "#dbeafe", color: "#1d4ed8", width: 28, height: 28, borderRadius: 7, display: "grid", placeItems: "center" }}>
                            <FiSettings size={15} />
                        </span>
                        Generate Payroll
                    </p>
                    <div style={{ display: "flex", gap: ".85rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div>
                            <label className="pr-label">
                                <FiCalendar size={12} color="#374151" />
                                Month
                            </label>
                            <AnimSelect value={genMonth} onChange={e => setGenMonth(+e.target.value)} minWidth={155}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </AnimSelect>
                        </div>
                        <div>
                            <label className="pr-label">
                                <FiCalendar size={12} color="#374151" />
                                Year
                            </label>
                            <AnimSelect value={genYear} onChange={e => setGenYear(+e.target.value)} minWidth={105}>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </AnimSelect>
                        </div>
                        <IconBtn
                            variant="primary"
                            onClick={handleGenerate}
                            disabled={generating}
                            style={{ padding: "9px 20px", fontSize: ".86rem" }}
                        >
                            {generating ? (
                                <>
                                    <FiRefreshCw size={15} className="spin" />
                                    Generating…
                                </>
                            ) : (
                                <>
                                    <FiZap size={15} />
                                    Generate for All Employees
                                </>
                            )}
                        </IconBtn>
                    </div>
                    {genResult && (
                        <div className="gen-result">
                            <FiCheckCircle size={17} />
                            <strong>{genResult.generated}</strong> payslip(s) generated successfully
                        </div>
                    )}
                </div>

                {/* Filter + Table */}
                <div ref={tablePanelRef} className="pr-panel">
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem", marginBottom: "1rem" }}>
                        <p className="pr-panel-title" style={{ margin: 0 }}>
                            <span style={{ background: "#dcfce7", color: "#15803d", width: 28, height: 28, borderRadius: 7, display: "grid", placeItems: "center" }}>
                                <FiList size={15} />
                            </span>
                            Payroll Records
                        </p>
                        {selected.size > 0 && (
                            <IconBtn
                                variant="success"
                                onClick={handleBulkPaid}
                                disabled={bulkLoading}
                                style={{ fontSize: ".82rem", animation: "slideDown 0.2s ease" }}
                            >
                                {bulkLoading ? (
                                    <><FiRefreshCw size={14} className="spin" />Processing…</>
                                ) : (
                                    <><FiCheck size={14} />Mark {selected.size} as Paid</>
                                )}
                            </IconBtn>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="pr-filter-row" style={{ marginBottom: "1.2rem" }}>
                        <div>
                            <label className="pr-label">
                                <FiCalendar size={12} color="#374151" />
                                Month
                            </label>
                            <AnimSelect value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} minWidth={145}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </AnimSelect>
                        </div>
                        <div>
                            <label className="pr-label">
                                <FiCalendar size={12} color="#374151" />
                                Year
                            </label>
                            <AnimSelect value={filterYear} onChange={e => setFilterYear(+e.target.value)} minWidth={105}>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </AnimSelect>
                        </div>
                        <div>
                            <label className="pr-label">
                                <FiFilter size={12} color="#374151" />
                                Status
                            </label>
                            <AnimSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} minWidth={115}>
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
                            <FiRefreshCw size={14} />
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
                                width: 68, height: 68, borderRadius: "50%",
                                background: "#f3f4f6", display: "grid",
                                placeItems: "center", margin: "0 auto .85rem",
                            }}>
                                <FiAlertCircle size={30} color="#6b7280" />
                            </div>
                            <p style={{ fontWeight: 800, color: "var(--text-1)", fontSize: "1rem" }}>No payrolls found</p>
                            <p style={{ fontSize: ".88rem", color: "#6b7280", marginTop: ".3rem", fontWeight: 500 }}>
                                Generate payroll for {MONTHS[filterMonth - 1]} {filterYear} above
                            </p>
                        </div>
                    )}

                    {!loading && payrolls.length > 0 && (
                        <div className="table-wrap" style={{ overflowX: "auto" }}>
                            <table className="table pr-table" style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 38 }}>
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
                                        <th>Earned Till Date</th>
                                        <th>Proj. Month Net</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls.map((p, idx) => {
                                        const emp = p.employee || {};
                                        const init = (emp.name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                                        const isHovered = hoveredRow === p._id;
                                        // A payroll is a "Preview" if it's for the current month and still in draft status
                                        const isPreview = isCurrentViewMonth && p.status === "draft";

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
                                                    <div className="period-cell">
                                                        <FiCalendar size={13} color="#374151" />
                                                        {MONTHS[(p.month || 1) - 1]} {p.year}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                                        <span className="att-dot" style={{ background: "#dcfce7", color: "#14532d", borderColor: "#4ade80" }}>
                                                            <FiCheck size={10} />{p.presentDays ?? 0}P
                                                        </span>
                                                        {p.absentDays > 0 && (
                                                            <span className="att-dot" style={{ background: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" }} title="Missed working days">
                                                                <FiX size={10} />{p.absentDays}A
                                                            </span>
                                                        )}
                                                        {p.halfDays > 0 && (
                                                            <span className="att-dot" style={{ background: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" }}>
                                                                {p.halfDays}H
                                                            </span>
                                                        )}
                                                        {p.paidLeave > 0 && (
                                                            <span className="att-dot" style={{ background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" }}>
                                                                {p.paidLeave}PL
                                                            </span>
                                                        )}
                                                        {p.remainingWorkingDays > 0 && (
                                                            <span className="att-dot" style={{ background: "#f3f4f6", color: "#4b5563", borderColor: "#d1d5db" }} title="Upcoming working days in the month">
                                                                <FiClock size={10} />{p.remainingWorkingDays} Pend
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: "#111827" }}>
                                                        ₹{(p.monthlySalary || 0).toLocaleString("en-IN")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: "#16a34a" }}>
                                                        ₹{(p.grossEarnings || 0).toLocaleString("en-IN")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <span className="net-salary">
                                                            ₹{(p.netSalary || 0).toLocaleString("en-IN")}
                                                        </span>
                                                        {isPreview && (
                                                            <span style={{ fontSize: ".65rem", color: "#2563eb", fontWeight: 700 }}>
                                                                PROJECTED
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                        <StatusBadge status={p.status} isPreview={isPreview} />
                                                        {p.isReleased
                                                            ? <span style={{ fontSize: ".68rem", color: "#15803d", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                                                                <FiCheck size={10} /> Visible to employee
                                                            </span>
                                                            : <span style={{ fontSize: ".68rem", color: "#9ca3af", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                                                                <FiClock size={10} /> HR only
                                                            </span>
                                                        }
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="pr-actions">
                                                        {p._id ? (
                                                            <IconBtn
                                                                variant="primary"
                                                                title="View Detailed Breakdown"
                                                                onClick={() => handleViewPayslip(p)}
                                                                style={{ fontSize: ".76rem", padding: "6px 11px" }}
                                                            >
                                                                <FiList size={13} />
                                                                View Payslip
                                                            </IconBtn>
                                                        ) : isPreview && (
                                                            <IconBtn
                                                                variant="primary"
                                                                title="Detailed Projection"
                                                                onClick={() => handleShowPreview(emp._id)}
                                                                style={{ fontSize: ".76rem", padding: "6px 11px" }}
                                                            >
                                                                <FiZap size={13} />
                                                                Preview
                                                            </IconBtn>
                                                        )}
                                                        <IconBtn
                                                            variant="ghost"
                                                            title="Download PDF"
                                                            onClick={() => generatePayslipPDF(p)}
                                                            style={{ fontSize: ".76rem", padding: "6px 11px" }}
                                                        >
                                                            <FiDownload size={13} />
                                                            PDF
                                                        </IconBtn>
                                                        {p.status === "draft" && (
                                                            <>
                                                                <IconBtn
                                                                    variant="success"
                                                                    onClick={() => handleMarkPaid(p._id)}
                                                                    disabled={markingId === p._id}
                                                                    style={{ fontSize: ".76rem", padding: "6px 11px" }}
                                                                >
                                                                    {markingId === p._id
                                                                        ? <FiRefreshCw size={13} className="spin" />
                                                                        : <><FiCheck size={13} />Paid</>}
                                                                </IconBtn>
                                                                <IconBtn
                                                                    variant="danger"
                                                                    onClick={() => handleDelete(p._id)}
                                                                    title="Delete draft"
                                                                    style={{ fontSize: ".76rem", padding: "6px 10px" }}
                                                                >
                                                                    <FiTrash2 size={13} />
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

            {/* Modal */}
            <SalaryPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                data={previewData}
            />

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type} ${toastVisible ? "toast-enter" : "toast-exit"}`}>
                    {toast.type === "success"
                        ? <FiCheckCircle size={17} />
                        : <FiAlertCircle size={17} />}
                    {toast.msg}
                </div>
            )}
        </DashboardLayout>
    );
};

export default PayrollMgmt;