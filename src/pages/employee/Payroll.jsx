import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { generatePayslipPDF } from "../../utils/payslipPDF";
import Swal from "sweetalert2";

const DownloadIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
    </svg>
);

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const fmt = (n) =>
    typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—";

/**
 * FIX 2: Compute display net salary for the TABLE.
 * If backend sends netSalary=0 but there are earnings, recalculate.
 */
const getNetSalary = (p) => p.netSalary ?? 0;
const getGrossEarning = (p) => p.grossEarnings ?? 0;
const getDeductions = (p) => p.deductions ?? 0;

const StatusBadge = ({ status }) => {
    const s = status === "paid"
        ? { bg: "var(--success-bg)", color: "#166534", border: "#86efac", dot: "#16a34a", label: "Paid" }
        : { bg: "#fef9c3", color: "#854d0e", border: "#fde047", dot: "#ca8a04", label: "Draft" };
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            padding: "3px 10px", borderRadius: "6px", fontSize: ".71rem", fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
            {s.label}
        </span>
    );
};

const Payroll = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dlLoading, setDlLoading] = useState(null);

    const [userExtras, setUserExtras] = useState({
        bankDetails: null,
        governmentIds: null,
        guardianName: null,
    });

    useEffect(() => {
        let cancelled = false;

        const fetchAll = async () => {
            try {
                const [payrollRes, bankRes, govRes] = await Promise.all([
                    API.get("/payroll/my"),
                    API.get("/users/me/bank-details").catch(() => null),
                    API.get("/users/me/government-id").catch(() => null),
                ]);
                if (cancelled) return;
                setData(payrollRes.data.payrolls || []);
                setUserExtras({
                    bankDetails: bankRes?.data?.bankDetails || null,
                    governmentIds: govRes?.data?.governmentIds || null,
                    guardianName: null,
                });
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchAll();
        return () => { cancelled = true; };
    }, []);

    // FIX 2: Total earnings uses resolved net salary too
    const totalEarnings = data.reduce((s, p) => s + getNetSalary(p), 0);

    const handleDownload = async (p) => {
        setDlLoading(p._id);
        try {
            const baseEmp = (p.employee && typeof p.employee === "object") ? p.employee : {};
            const enrichedEmp = {
                ...baseEmp,
                bankDetails: userExtras.bankDetails || baseEmp.bankDetails,
                governmentIds: userExtras.governmentIds || baseEmp.governmentIds,
                guardianName: userExtras.guardianName || baseEmp.guardianName,
            };
            const enriched = {
                ...p,
                employee: enrichedEmp,
                month: typeof p.month === "number" ? p.month : parseMonthNumber(p.month),
                year: p.year || new Date().getFullYear(),
                netSalary: getNetSalary(p),
            };
            await generatePayslipPDF(enriched); // make it awaitable
        } catch (err) {
            console.error("PDF generation error:", err);
            Swal.fire({
                icon: "error",
                title: "Download Failed",
                text: "Could not generate PDF. Please try again.",
                confirmButtonColor: "#EF4444",
            });
        } finally {
            setDlLoading(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1>Payroll</h1>
                <p>Your payslips and salary history</p>
            </div>

            {!loading && data.length > 0 && (
                <div className="grid-stats" style={{ marginBottom: "1.25rem" }}>
                    <div className="stat-card brand">
                        <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginBottom: ".3rem" }}>Total earned</p>
                        <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>₹{totalEarnings.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="stat-card success">
                        <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginBottom: ".3rem" }}>Payslips</p>
                        <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.length}</p>
                    </div>
                </div>
            )}

            <div className="card">
                <p className="fw-600" style={{ marginBottom: "1rem" }}>My Payslips</p>

                {!loading && data.length === 0 && (
                    <p style={{ color: "var(--text-3)", fontSize: ".875rem", textAlign: "center", padding: "2rem 0" }}>
                        No payslips generated yet
                    </p>
                )}

                {!loading && data.length > 0 && (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Monthly Salary</th>
                                    <th>Present Days</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                    <th>Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(p => {
                                    const monthLabel = getMonthLabel(p.month, p.year);

                                    // FIX 1: Show actual monthlySalary from HR
                                    const monthlySalaryDisplay =
                                        p.monthlySalary ? fmt(p.monthlySalary) :
                                            p.basicSalary ? fmt(p.basicSalary) : "—";

                                    // FIX 2: Always show correct net salary
                                    const displayNetSalary = p.netSalary ?? 0;

                                    return (
                                        <tr key={p._id}>
                                            <td style={{ fontWeight: 500, color: "var(--text-1)" }}>{monthLabel}</td>
                                            <td>{monthlySalaryDisplay}</td>
                                            <td style={{ color: "#16a34a", fontWeight: 600 }}>
                                                {p.presentDays ?? "—"}
                                                {p.halfDays > 0 && (
                                                    <span style={{ color: "#ea580c", fontSize: ".75rem", marginLeft: 4 }}>
                                                        +{p.halfDays}H
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: "var(--danger)" }}>
                                                {p.deductions > 0 ? `- ₹${p.deductions.toLocaleString("en-IN")}` : "₹0"}
                                            </td>
                                            {/* FIX 2: Use resolved net salary, never wrongly ₹0 */}
                                            <td style={{ fontWeight: 600, color: "var(--success)" }}>
                                                ₹{displayNetSalary.toLocaleString("en-IN")}
                                            </td>
                                            <td><StatusBadge status={p.status} /></td>
                                            <td>
                                                <button
                                                    onClick={() => handleDownload(p)}
                                                    className="btn btn-ghost btn-sm"
                                                    title="Download PDF"
                                                    disabled={dlLoading === p._id}
                                                    style={{ minWidth: 64 }}
                                                >
                                                    {dlLoading === p._id
                                                        ? <span className="spinner" style={{ borderTopColor: "var(--primary)", borderColor: "var(--border)", width: 12, height: 12, borderWidth: 2 }} />
                                                        : <><DownloadIcon /> PDF</>
                                                    }
                                                </button>
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

// ── Helpers ──────────────────────────────────────────────
function getMonthLabel(month, year) {
    if (typeof month === "number" && month >= 1 && month <= 12) {
        return `${MONTHS[month - 1]}${year ? " " + year : ""}`;
    }
    if (typeof month === "string") {
        const parsed = parseInt(month);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
            return `${MONTHS[parsed - 1]}${year ? " " + year : ""}`;
        }
        return month;
    }
    return "—";
}

function parseMonthNumber(month) {
    if (typeof month === "number") return month;
    if (typeof month === "string") {
        const n = parseInt(month);
        if (!isNaN(n)) return n;
        const idx = MONTHS.findIndex(m => month.toLowerCase().startsWith(m.toLowerCase()));
        if (idx !== -1) return idx + 1;
    }
    return 1;
}

export default Payroll;