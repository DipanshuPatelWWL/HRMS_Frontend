import { useState, useEffect, useCallback } from "react";
import PolicyCard from "../../components/common/PolicyCard";
import PolicyAcknowledgeModal from "../../components/common/PolicyAcknowledgeModal";
import PolicyDeclineModal from "../../components/common/PolicyDeclineModal";
import { FaCheckDouble } from "react-icons/fa";
import { MdOutlineCheckBox, MdOutlineIndeterminateCheckBox } from "react-icons/md";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API from "../../services/api";
import Swal from "sweetalert2";

const FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "declined", label: "Declined" },
];

const Policies = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState([]);
    const [openPolicy, setOpenPolicy] = useState(null);
    const [declinePolicy, setDeclinePolicy] = useState(null);

    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await API.get("/policies/my");
            setPolicies(data.policies ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

    const showToast = (title) => Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
    });

    const handleModalSuccess = (action) => {
        setOpenPolicy(null);
        setDeclinePolicy(null);
        setSelected([]);
        fetchPolicies();
        showToast(action === "acknowledged" ? "Policy acknowledged!" : "Response recorded.");
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkAcknowledge = async (ids) => {
        const isAll = ids.length === pendingPolicies.length && pendingPolicies.length > 0;
        const { isConfirmed } = await Swal.fire({
            title: isAll ? "Acknowledge All?" : `Acknowledge ${ids.length} policy(s)?`,
            text: "This confirms you have read and understood the selected policies.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, acknowledge",
            cancelButtonText: "Cancel",
        });
        if (!isConfirmed) return;
        try {
            await API.post("/policies/acknowledge", { policyIds: ids });
            setSelected([]);
            fetchPolicies();
            showToast(`${ids.length} policy(s) acknowledged!`);
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed", text: "Could not acknowledge policies." });
        }
    };

    const filtered = filter === "all" ? policies : policies.filter(p => p.status === filter);
    const pendingPolicies = policies.filter(p => p.requiresAction);

    return (
        <DashboardLayout>
            <div style={{ padding: "20px", maxWidth: 860, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0a0a0a" }}>Company Policies</h2>
                        {pendingPolicies.length > 0 && (
                            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#d97706" }}>
                                {pendingPolicies.length} policy(s) require your acknowledgement
                            </p>
                        )}
                    </div>
                    {/* Acknowledge All pending */}
                    {pendingPolicies.length > 0 && (
                        <button
                            onClick={() => handleBulkAcknowledge(pendingPolicies.map(p => p._id))}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: "#4f46e5", color: "#fff", border: "none",
                                padding: "9px 16px", borderRadius: 8, cursor: "pointer",
                                fontWeight: 600, fontSize: "0.85rem",
                            }}
                        >
                            <FaCheckDouble size={14} /> Acknowledge All
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    {FILTER_OPTIONS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600,
                                border: filter === f.value ? "none" : "1px solid #ddd",
                                background: filter === f.value ? "#4f46e5" : "#fff",
                                color: filter === f.value ? "#fff" : "#555",
                                cursor: "pointer",
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Bulk actions */}
                {selected.length > 0 && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        background: "#eef2ff", borderRadius: 8, marginBottom: 14, flexWrap: "wrap",
                    }}>
                        <span style={{ fontSize: "0.85rem", color: "#4f46e5", fontWeight: 600 }}>
                            {selected.length} selected
                        </span>
                        <button
                            onClick={() => handleBulkAcknowledge(selected)}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "#4f46e5", color: "#fff", border: "none",
                                padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem",
                            }}
                        >
                            <MdOutlineCheckBox size={16} /> Acknowledge Selected
                        </button>
                        <button
                            onClick={() => setSelected([])}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "#fff", color: "#555", border: "1px solid #ddd",
                                padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: "0.8rem",
                            }}
                        >
                            <MdOutlineIndeterminateCheckBox size={16} /> Deselect
                        </button>
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading policies...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#888" }}>No policies found.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filtered.map(policy => (
                            <PolicyCard
                                key={policy._id}
                                policy={policy}
                                selected={selected.includes(policy._id)}
                                onSelect={toggleSelect}
                                onOpen={setOpenPolicy}
                            />
                        ))}
                    </div>
                )}

                {/* Modals */}
                {openPolicy && (
                    <PolicyAcknowledgeModal
                        policy={openPolicy}
                        onClose={() => setOpenPolicy(null)}
                        onSuccess={handleModalSuccess}
                        onDecline={(p) => { setOpenPolicy(null); setDeclinePolicy(p); }}
                    />
                )}
                {declinePolicy && (
                    <PolicyDeclineModal
                        policy={declinePolicy}
                        onClose={() => setDeclinePolicy(null)}
                        onSuccess={handleModalSuccess}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default Policies;