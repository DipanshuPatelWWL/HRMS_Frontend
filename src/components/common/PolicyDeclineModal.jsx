import { useState } from "react";
import API from "../../services/api";

const PolicyDeclineModal = ({ policy, onClose, onSuccess }) => {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleDecline = async () => {
        if (!reason.trim()) { setError("Please provide a reason."); return; }
        setLoading(true);
        try {
            await API.post(`/policies/${policy._id}/decline`, { reason });
            onSuccess("declined");
        } catch (err) {
            setError("Failed to submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 16,
        }}>
            <div style={{
                background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480,
                padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}>
                <h3 style={{ margin: "0 0 6px", fontSize: "1rem", color: "#dc2626" }}>Decline Policy</h3>
                <p style={{ margin: "0 0 16px", fontSize: "0.875rem", color: "#555" }}>
                    Please explain why you are declining <strong>{policy.title}</strong>.
                </p>
                <textarea
                    value={reason}
                    onChange={e => { setReason(e.target.value); setError(""); }}
                    rows={4}
                    placeholder="Enter your reason here..."
                    style={{
                        width: "100%", borderRadius: 8, border: "1px solid #ddd",
                        padding: "10px 12px", fontSize: "0.875rem", resize: "vertical",
                        boxSizing: "border-box", outline: "none",
                    }}
                />
                {error && <div style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: 6 }}>{error}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button
                        onClick={handleDecline}
                        disabled={loading}
                        style={{
                            flex: 1, padding: "10px", borderRadius: 8, border: "none",
                            background: "#dc2626", color: "#fff", fontWeight: 600,
                            fontSize: "0.875rem", cursor: "pointer",
                        }}
                    >
                        {loading ? "Submitting..." : "Submit Decline"}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 20px", borderRadius: 8, border: "1px solid #ddd",
                            background: "#fff", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PolicyDeclineModal;