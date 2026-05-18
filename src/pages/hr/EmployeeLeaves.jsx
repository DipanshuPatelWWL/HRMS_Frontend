import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Swal from "sweetalert2";

const roleBadge = (role) => {
    const map = {
        employee: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
        tl: { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
        manager: { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
    };
    const s = map[role] || map.employee;
    return (
        <span style={{
            padding: "2px 10px", borderRadius: 20, fontSize: ".72rem",
            fontWeight: 600, background: s.bg, color: s.color,
            border: `1px solid ${s.border}`, textTransform: "capitalize",
        }}>
            {role}
        </span>
    );
};

const avatarColor = (name = "") => {
    const colors = ["#4f46e5", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];
    return colors[name.charCodeAt(0) % colors.length] || "#4f46e5";
};

const initials = (name = "") =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const EmployeeLeaves = () => {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [totalInput, setTotalInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await API.get("/leave/balances/all");
            setEmployees(res.data.employees || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEmployees(); }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    const openEdit = (emp) => {
        setSelected(emp);
        setTotalInput(emp.leaveBalance?.total ?? 0);
    };

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await API.put(`/leave/balance/${selected._id}`, { total: totalInput });
            showToast(`✅ Balance updated for ${selected.name}`);
            setSelected(null);
            fetchEmployees();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Action Failed",
                text: err.response?.data?.message || "Failed to update",
                confirmButtonColor: "#EF4444",
            });
        } finally {
            setSaving(false);
        }
    };

    const filtered = employees.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <style>{`
                .hlb-grid {
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    gap: 1.25rem;
                    align-items: start;
                }
                .hlb-emp-row {
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: .85rem 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: .75rem;
                    cursor: pointer;
                    transition: border-color .15s, background .15s;
                }
                .hlb-emp-row:hover   { border-color: #818cf8; background: #fafafa; }
                .hlb-emp-row.active  { border-color: #4f46e5; background: #eef2ff; }
                .hlb-avatar {
                    width: 38px; height: 38px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: .9rem; flex-shrink: 0; color: #fff;
                }
                    /* ── Spinner ── */
                .spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    display: inline-block;
                    animation: spin 0.6s linear infinite;
                    margin-right: 6px;
                }
                .hlb-stat-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: .65rem;
                    margin-top: .2rem;
                }
                .hlb-stat-box {
                    border-radius: 10px;
                    padding: .75rem .85rem;
                    border: 1px solid;
                    text-align: center;
                }
                .hlb-stat-box .stat-val {
                    font-size: 1.5rem;
                    font-weight: 800;
                    line-height: 1.1;
                }
                .hlb-stat-box .stat-lbl {
                    font-size: .7rem;
                    font-weight: 500;
                    margin-top: 3px;
                    opacity: .8;
                }
                .hlb-input-wrap {
                    background: #f8fafc;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 1rem;
                }
                .hlb-big-input {
                    width: 100%;
                    border: 2px solid #c7d2fe;
                    border-radius: 10px;
                    padding: .7rem 1rem;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #4f46e5;
                    background: white;
                    text-align: center;
                    outline: none;
                    box-sizing: border-box;
                    margin-top: .5rem;
                    transition: border-color .15s;
                }
                .hlb-big-input:focus { border-color: #4f46e5; }
                .hlb-toast {
                    position: fixed;
                    bottom: 1.5rem; right: 1.5rem;
                    background: #1e293b; color: #fff;
                    padding: .7rem 1.2rem;
                    border-radius: 10px;
                    font-size: .85rem; font-weight: 500;
                    z-index: 9999;
                    box-shadow: 0 4px 20px rgba(0,0,0,.18);
                    animation: slideUp .2s ease;
                }
                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                .hlb-empty {
                    text-align: center; color: var(--text-3);
                    padding: 2.5rem 0; font-size: .875rem;
                }
                @media (max-width: 768px) {
                    .hlb-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="page-header">
                <h1>Leave Balance Management</h1>
                <p>View and update employee leave allocations</p>
            </div>

            <div className="hlb-grid">

                {/* ── Left: Employee List ── */}
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <p className="fw-600">Employees</p>
                        <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <input
                        className="input"
                        placeholder="🔍  Search by name, email or ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ marginBottom: ".85rem" }}
                    />

                    {loading ? (
                        <p className="hlb-empty">Loading employees…</p>
                    ) : filtered.length === 0 ? (
                        <p className="hlb-empty">No employees found</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                            {filtered.map(emp => {
                                const bal = emp.leaveBalance || {};
                                const total = bal.total ?? 0;
                                const used = bal.used ?? 0;
                                const remaining = Math.max(0, total - used);

                                return (
                                    <div
                                        key={emp._id}
                                        className={`hlb-emp-row ${selected?._id === emp._id ? "active" : ""}`}
                                        onClick={() => openEdit(emp)}
                                    >
                                        <div style={{ display: "flex", gap: ".75rem", alignItems: "flex-start", minWidth: 0, flex: 1 }}>
                                            <div
                                                className="hlb-avatar"
                                                style={{ background: avatarColor(emp.name) }}
                                            >
                                                {initials(emp.name)}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".15rem" }}>
                                                    <p className="fw-600" style={{ fontSize: ".875rem" }}>{emp.name}</p>
                                                    {roleBadge(emp.role)}
                                                </div>
                                                <p style={{ fontSize: ".75rem", color: "var(--text-3)", marginBottom: ".45rem" }}>
                                                    {emp.employeeId} · {emp.email}
                                                </p>

                                                {/* Balance summary chips */}
                                                <div style={{ display: "flex", gap: ".4rem" }}>
                                                    {[
                                                        { label: "Total", val: total, bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
                                                        { label: "Used", val: used, bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
                                                        { label: "Remaining", val: remaining, bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                                                    ].map(c => (
                                                        <span key={c.label} style={{
                                                            padding: "2px 8px", borderRadius: 8,
                                                            fontSize: ".72rem", fontWeight: 700,
                                                            background: c.bg, color: c.color,
                                                            border: `1px solid ${c.border}`,
                                                        }}>
                                                            {c.label}: {c.val}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2"
                                            viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right: Edit Panel ── */}
                <div className="card">
                    {!selected ? (
                        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>👈</div>
                            <p className="fw-600" style={{ marginBottom: ".35rem" }}>Select an Employee</p>
                            <p style={{ fontSize: ".85rem", color: "var(--text-3)" }}>
                                Click any employee to update their leave balance
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>

                            {/* Employee header */}
                            <div style={{
                                background: "#f8fafc", border: "1px solid var(--border)",
                                borderRadius: "var(--radius-md)", padding: ".85rem 1rem",
                                display: "flex", alignItems: "center", gap: ".75rem",
                            }}>
                                <div className="hlb-avatar" style={{ background: avatarColor(selected.name) }}>
                                    {initials(selected.name)}
                                </div>
                                <div>
                                    <p className="fw-600" style={{ fontSize: ".9rem" }}>{selected.name}</p>
                                    <p style={{ fontSize: ".75rem", color: "var(--text-3)" }}>
                                        {selected.employeeId} · {selected.email}
                                    </p>
                                </div>
                            </div>

                            {/* Current stats */}
                            <div className="hlb-stat-row">
                                {[
                                    { label: "Total Allocated", val: selected.leaveBalance?.total ?? 0, bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
                                    { label: "Used", val: selected.leaveBalance?.used ?? 0, bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
                                    { label: "Remaining", val: Math.max(0, (selected.leaveBalance?.total ?? 0) - (selected.leaveBalance?.used ?? 0)), bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                                ].map(s => (
                                    <div key={s.label} className="hlb-stat-box"
                                        style={{ background: s.bg, borderColor: s.border, color: s.color }}>
                                        <div className="stat-val">{s.val}</div>
                                        <div className="stat-lbl">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="hlb-input-wrap">
                                <p className="fw-600" style={{ fontSize: ".85rem", color: "var(--text-2)" }}>
                                    Update Total Leave Allocation
                                </p>
                                <p style={{ fontSize: ".75rem", color: "var(--text-3)", marginTop: ".2rem" }}>
                                    Set the total number of paid leave days for this employee
                                </p>
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    className="hlb-big-input"
                                    value={totalInput}
                                    onChange={e => setTotalInput(e.target.value)}
                                />
                                {/* Live preview */}
                                {totalInput !== "" && (
                                    <p style={{
                                        marginTop: ".5rem", textAlign: "center",
                                        fontSize: ".78rem", color: "#4f46e5", fontWeight: 600,
                                    }}>
                                        Remaining after save: {Math.max(0, Number(totalInput) - (selected.leaveBalance?.used ?? 0))} days
                                    </p>
                                )}
                            </div>

                            {/* Warning note */}
                            <div style={{
                                background: "#fffbeb", border: "1px solid #fde68a",
                                borderRadius: "var(--radius-sm)", padding: ".6rem .85rem",
                                fontSize: ".78rem", color: "#92400e",
                            }}>
                                ⚠️ Only <b>total allocation</b> is updated. Used days are automatically tracked by the system.
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: ".75rem" }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ flex: 1, justifyContent: "center" }}
                                >
                                    {saving ? (<><span className="spinner" /> Saving...</>) : ("💾 Save Balance")}
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => setSelected(null)}
                                    style={{ flex: 1, justifyContent: "center" }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {toast && <div className="hlb-toast">{toast}</div>}
        </DashboardLayout>
    );
};

export default EmployeeLeaves;