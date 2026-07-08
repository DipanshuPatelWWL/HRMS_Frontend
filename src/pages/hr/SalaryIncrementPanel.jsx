import { useEffect, useState } from "react";
import API from "../../services/api";
import { FiTrendingUp, FiCalendar, FiPlusCircle, FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => currentYear + 1 - i);

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const SalaryIncrementPanel = ({ employeeId }) => {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState(null);
    const [toastVisible, setToastVisible] = useState(false);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setToastVisible(true);
        setTimeout(() => {
            setToastVisible(false);
            setTimeout(() => setToast(null), 300);
        }, 3200);
    };

    const [form, setForm] = useState({
        newSalary: "",
        effectiveMonth: new Date().getMonth() + 1,
        effectiveYear: currentYear,
        reason: "",
    });

    const load = async () => {
        setLoading(true);
        try {
            const [statsRes, historyRes] = await Promise.all([
                API.get(`/users/${employeeId}/increment-stats`),
                API.get(`/users/${employeeId}/salary-history`),
            ]);
            setStats(statsRes.data.stats);
            setHistory(historyRes.data.history || []);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to load salary data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (employeeId) load(); }, [employeeId]);

    const handleSubmit = async () => {
        if (!form.newSalary || form.newSalary <= 0) {
            return showToast("Enter a valid new salary", "error");
        }
        setSaving(true);
        try {
            await API.post(`/users/${employeeId}/salary-increment`, form);
            showToast("Salary increment recorded");
            setForm({ ...form, newSalary: "", reason: "" });
            load();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to save increment", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p style={{ padding: "1rem", color: "var(--text-3)" }}>Loading salary data…</p>;

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* Stats cards */}
            {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
                        <p style={{ fontSize: ".72rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>Current Salary</p>
                        <p style={{ fontSize: "1.3rem", fontWeight: 800 }}>{fmt(stats.currentSalary)}</p>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
                        <p style={{ fontSize: ".72rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>Last Increment</p>
                        <p style={{ fontSize: "1.3rem", fontWeight: 800, color: stats.lastIncrementAmount > 0 ? "#16a34a" : "var(--text-1)" }}>
                            {stats.lastIncrementAmount > 0 ? "+" : ""}{fmt(stats.lastIncrementAmount)}
                        </p>
                        <p style={{ fontSize: ".72rem", color: "var(--text-3)" }}>
                            {stats.lastIncrementDate ? new Date(stats.lastIncrementDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                        </p>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
                        <p style={{ fontSize: ".72rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>Last Increment %</p>
                        <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#2563eb" }}>{stats.lastIncrementPercent}%</p>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
                        <p style={{ fontSize: ".72rem", color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>
                            Total Increase (FY {stats.financialYear})
                        </p>
                        <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#7c3aed" }}>
                            {fmt(stats.yearlyIncrementAmount)} <span style={{ fontSize: ".85rem" }}>({stats.yearlyIncrementPercent}%)</span>
                        </p>
                        {stats.sinceJoiningThisYear && (
                            <p style={{ fontSize: ".68rem", color: "var(--text-3)" }}>Since joining this FY</p>
                        )}
                    </div>
                </div>
            )}

            {/* Add increment form */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 800, fontSize: ".85rem", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <FiPlusCircle color="#2563eb" /> Record Salary Increment
                </p>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div>
                        <label style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-2)" }}>New Monthly Salary</label><br />
                        <input
                            type="number"
                            value={form.newSalary}
                            onChange={e => setForm({ ...form, newSalary: +e.target.value })}
                            placeholder="e.g. 15000"
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", width: 160 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-2)" }}>Effective Month</label><br />
                        <select value={form.effectiveMonth} onChange={e => setForm({ ...form, effectiveMonth: +e.target.value })}
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-2)" }}>Year</label><br />
                        <select value={form.effectiveYear} onChange={e => setForm({ ...form, effectiveYear: +e.target.value })}
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <label style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-2)" }}>Reason (optional)</label><br />
                        <input
                            type="text"
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                            placeholder="Annual increment, promotion…"
                            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", width: "100%" }}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{ background: "#2563eb", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                    >
                        {saving ? "Saving…" : "Save Increment"}
                    </button>
                </div>
                <p style={{ fontSize: ".72rem", color: "var(--text-3)", marginTop: ".6rem" }}>
                    Increments always apply from the 1st of the selected month. Payroll generated for that month onward will use the new amount.
                </p>
            </div>

            {/* History table */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
                <p style={{ fontWeight: 800, fontSize: ".85rem", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <FiClock color="#16a34a" /> Salary History
                </p>
                {history.length === 0 ? (
                    <p style={{ color: "var(--text-3)", fontSize: ".85rem" }}>No salary changes recorded yet.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", fontSize: ".72rem", color: "var(--text-2)", textTransform: "uppercase" }}>
                                <th style={{ padding: "8px" }}>Effective From</th>
                                <th style={{ padding: "8px" }}>Effective To</th>
                                <th style={{ padding: "8px" }}>Salary</th>
                                <th style={{ padding: "8px" }}>Change</th>
                                <th style={{ padding: "8px" }}>Reason</th>
                                <th style={{ padding: "8px" }}>Changed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(h => (
                                <tr key={h._id} style={{ borderTop: "1px solid var(--border)", fontSize: ".85rem" }}>
                                    <td style={{ padding: "8px" }}>{new Date(h.effectiveFrom).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</td>
                                    <td style={{ padding: "8px" }}>{h.effectiveTo ? new Date(h.effectiveTo).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : <span style={{ color: "#16a34a", fontWeight: 700 }}>Current</span>}</td>
                                    <td style={{ padding: "8px", fontWeight: 700 }}>{fmt(h.monthlySalary)}</td>
                                    <td style={{ padding: "8px", color: h.incrementAmount >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                                        {h.incrementAmount !== 0 ? `${h.incrementAmount > 0 ? "+" : ""}${fmt(h.incrementAmount)} (${h.incrementPercent}%)` : "—"}
                                    </td>
                                    <td style={{ padding: "8px", color: "var(--text-3)" }}>{h.reason || "—"}</td>
                                    <td style={{ padding: "8px", color: "var(--text-3)" }}>{h.changedBy?.name || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div
                    style={{
                        position: "fixed", bottom: "1.5rem", right: "1.5rem",
                        padding: ".8rem 1.4rem", borderRadius: "12px",
                        fontSize: ".88rem", fontWeight: 700, zIndex: 10050,
                        display: "flex", alignItems: "center", gap: ".65rem",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                        background: toast.type === "success" ? "#14532d" : "#7f1d1d",
                        color: "#fff",
                        opacity: toastVisible ? 1 : 0,
                        transform: toastVisible ? "translateY(0)" : "translateY(14px)",
                        transition: "opacity 0.3s ease, transform 0.3s ease",
                    }}
                >
                    {toast.type === "success" ? <FiCheckCircle size={17} /> : <FiAlertCircle size={17} />}
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default SalaryIncrementPanel;