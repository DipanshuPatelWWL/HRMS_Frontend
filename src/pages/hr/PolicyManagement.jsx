import { useState, useEffect, useCallback } from "react";
import { MdAdd, MdPeople, MdPublish, MdArchive, MdEdit, MdUnarchive, MdDeleteForever } from "react-icons/md";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../services/api";
import Swal from "sweetalert2";

// ─── Sub-component: Response Stats Bar ───────────────────────
const StatsBar = ({ stats }) => {
    const total = stats.total || 1;
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", height: 8 }}>
                <div style={{ width: `${(stats.acknowledged / total) * 100}%`, background: "#16a34a" }} />
                <div style={{ width: `${(stats.declined / total) * 100}%`, background: "#dc2626" }} />
                <div style={{ width: `${(stats.pending / total) * 100}%`, background: "#d97706" }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: "0.75rem" }}>
                <span style={{ color: "#16a34a" }}><FaCheckCircle size={10} /> {stats.acknowledged} ack</span>
                <span style={{ color: "#dc2626" }}><FaTimesCircle size={10} /> {stats.declined} declined</span>
                <span style={{ color: "#d97706" }}><FaClock size={10} /> {stats.pending} pending</span>
            </div>
        </div>
    );
};

// ─── Sub-component: Create/Edit Policy Form ───────────────────
const PolicyForm = ({ initial, onSave, onClose }) => {
    const [form, setForm] = useState({
        title: initial?.title ?? "",
        description: initial?.description ?? "",
        content: initial?.content ?? "",
        category: initial?.category ?? "other",
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) return;
        setLoading(true);
        try {
            if (initial?._id) {
                await API.put(`/policies/${initial._id}`, form);
            } else {
                await API.post("/policies", form);
            }
            onSave();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16,
        }}>
            <div style={{
                background: "#fff", borderRadius: 14, width: "100%", maxWidth: 660,
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", fontWeight: 700, fontSize: "1rem" }}>
                    {initial ? "Edit Policy" : "Create Policy"}
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                        { label: "Title *", key: "title", type: "input" },
                        { label: "Short description", key: "description", type: "input" },
                    ].map(({ label, key, type }) => (
                        <div key={key}>
                            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>{label}</label>
                            <input
                                value={form[key]}
                                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: "0.875rem", boxSizing: "border-box" }}
                            />
                        </div>
                    ))}
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Category</label>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Category</label>
                        <select
                            value={form.category}
                            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: "0.875rem" }}
                        >
                            {["attendance", "leave", "wfh", "code-of-conduct", "it", "other"].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Policy Content * (HTML supported)</label>
                        <textarea
                            value={form.content}
                            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                            rows={10}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box" }}
                            placeholder="Write the full policy here. HTML tags are supported."
                        />
                    </div>
                </div>
                <div style={{ padding: "14px 20px", borderTop: "1px solid #eee", display: "flex", gap: 10 }}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                    >
                        {loading ? "Saving..." : (initial ? "Update Policy" : "Create Policy")}
                    </button>
                    <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-component: Responses drawer ─────────────────────────
const ResponsesDrawer = ({ policyId, policyTitle, onClose }) => {
    const [responses, setResponses] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const { data } = await API.get(`/policies/${policyId}/responses`);
                setResponses(data.responses ?? []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [policyId]);

    const STATUS_COLOR = { acknowledged: "#16a34a", declined: "#dc2626", pending: "#d97706" };
    const filtered = statusFilter === "all" ? responses : responses.filter(r => r.status === statusFilter);

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", justifyContent: "flex-end", zIndex: 9998,
        }}>
            <div style={{
                width: "100%", maxWidth: 480, background: "#fff",
                height: "100%", display: "flex", flexDirection: "column",
                boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
            }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Responses — {policyTitle}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        {["all", "acknowledged", "declined", "pending"].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                                    border: statusFilter === s ? "none" : "1px solid #ddd",
                                    background: statusFilter === s ? "#4f46e5" : "#fff",
                                    color: statusFilter === s ? "#fff" : "#555", cursor: "pointer",
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>No responses.</div>
                    ) : filtered.map((r, i) => (
                        <div key={i} style={{
                            padding: "12px 14px", borderRadius: 8, background: "#f9f9f9",
                            marginBottom: 8, borderLeft: `3px solid ${STATUS_COLOR[r.status]}`,
                        }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                                {r.employee?.name ?? "Unknown"}
                                <span style={{ fontWeight: 400, color: "#888", fontSize: "0.78rem", marginLeft: 8 }}>
                                    {r.employee?.employeeId}
                                </span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#666", marginTop: 2 }}>
                                {r.employee?.department} · {r.employee?.designation}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                                <span style={{ color: STATUS_COLOR[r.status], fontWeight: 700, fontSize: "0.78rem", textTransform: "capitalize" }}>
                                    {r.status}
                                </span>
                                {r.respondedAt && (
                                    <span style={{ color: "#aaa", fontSize: "0.72rem" }}>
                                        · {new Date(r.respondedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            {r.declineReason && (
                                <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#dc2626", background: "#fef2f2", padding: "6px 10px", borderRadius: 6 }}>
                                    Reason: {r.declineReason}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ padding: "14px 20px", borderTop: "1px solid #eee" }}>
                    <button onClick={onClose} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 500 }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main HR PolicyManagement page ───────────────────────────
const PolicyManagement = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editPolicy, setEditPolicy] = useState(null);
    const [viewResponses, setViewResponses] = useState(null);

    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await API.get("/policies");
            setPolicies(data.policies ?? []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

    const handlePublish = async (policyId) => {
        try {
            await API.post(`/policies/${policyId}/publish`, { assignTo: "all" });
            fetchPolicies();
        } catch (err) { console.error(err); }
    };

    const handleArchive = async (policyId) => {
        const { isConfirmed } = await Swal.fire({
            title: "Archive Policy?",
            text: "This policy will be hidden from employees. You can restore it later.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, archive it",
            cancelButtonText: "Cancel",
        });
        if (!isConfirmed) return;
        try {
            await API.patch(`/policies/${policyId}/archive`);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Policy archived",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });
            fetchPolicies();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: "Could not archive policy." });
        }
    };

    const handleRestore = async (policyId) => {
        const { isConfirmed } = await Swal.fire({
            title: "Restore Policy?",
            text: "This will move the policy back to draft status.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, restore it",
            cancelButtonText: "Cancel",
        });
        if (!isConfirmed) return;
        try {
            await API.patch(`/policies/${policyId}/restore`);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Policy restored to draft",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });
            fetchPolicies();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: "Could not restore policy." });
        }
    };

    const handleDelete = async (policyId) => {
        const { isConfirmed } = await Swal.fire({
            title: "Delete Permanently?",
            text: "This action cannot be undone. All responses will be lost.",
            icon: "error",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
        });
        if (!isConfirmed) return;
        try {
            await API.delete(`/policies/${policyId}`);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Policy deleted",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });
            fetchPolicies();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: "Could not delete policy." });
        }
    };

    const STATUS_COLOR = { draft: "#d97706", published: "#16a34a", archived: "#888" };

    return (
        <DashboardLayout>
            <div style={{ padding: "20px", maxWidth: 960, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Policy Management</h2>
                    <button
                        onClick={() => { setEditPolicy(null); setShowForm(true); }}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "#4f46e5", color: "#fff", border: "none",
                            padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                        }}
                    >
                        <MdAdd size={18} /> Create Policy
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading...</div>
                ) : policies.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#888" }}>No policies yet. Create your first policy.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {policies.map(policy => (
                            <div key={policy._id} style={{
                                border: "1px solid #eee", borderRadius: 10, padding: "16px 18px",
                                background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{policy.title}</span>
                                            <span style={{
                                                padding: "2px 8px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700,
                                                background: `${STATUS_COLOR[policy.status]}22`,
                                                color: STATUS_COLOR[policy.status],
                                                textTransform: "capitalize",
                                            }}>
                                                {policy.status}
                                            </span>
                                            <span style={{ fontSize: "0.75rem", color: "#aaa" }}>v{policy.version}</span>
                                        </div>
                                        {policy.description && (
                                            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>{policy.description}</div>
                                        )}
                                        {policy.stats && <StatsBar stats={policy.stats} />}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {policy.status === "draft" && (
                                            <button
                                                onClick={() => handlePublish(policy._id)}
                                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                                            >
                                                <MdPublish size={14} /> Publish
                                            </button>
                                        )}

                                        {policy.status !== "archived" && (
                                            <>
                                                <button
                                                    onClick={() => setViewResponses(policy)}
                                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "0.8rem" }}
                                                >
                                                    <MdPeople size={14} /> Responses
                                                </button>
                                                <button
                                                    onClick={() => { setEditPolicy(policy); setShowForm(true); }}
                                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "0.8rem" }}
                                                >
                                                    <MdEdit size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleArchive(policy._id)}
                                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem" }}
                                                >
                                                    <MdArchive size={14} /> Archive
                                                </button>
                                            </>
                                        )}

                                        {policy.status === "archived" && (
                                            <>
                                                <button
                                                    onClick={() => handleRestore(policy._id)}
                                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                                                >
                                                    <MdUnarchive size={14} /> Restore
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(policy._id)}
                                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                                                >
                                                    <MdDeleteForever size={14} /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showForm && (
                    <PolicyForm
                        initial={editPolicy}
                        onSave={() => { setShowForm(false); fetchPolicies(); }}
                        onClose={() => setShowForm(false)}
                    />
                )}
                {viewResponses && (
                    <ResponsesDrawer
                        policyId={viewResponses._id}
                        policyTitle={viewResponses.title}
                        onClose={() => setViewResponses(null)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default PolicyManagement;