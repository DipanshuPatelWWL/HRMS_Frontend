import { useEffect, useState } from "react";
import { MdPolicy, MdClose } from "react-icons/md";
import API from "../../services/api";
import "react-quill-new/dist/quill.snow.css";

const PolicyAcknowledgeModal = ({ policy, onClose, onSuccess }) => {
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fullPolicy, setFullPolicy] = useState(null);
    const [fetching, setFetching] = useState(true);


    useEffect(() => {
        const load = async () => {
            setFetching(true);
            try {
                const { data } = await API.get(`/policies/${policy._id}`);
                setFullPolicy(data.policy);
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };
        load();
    }, [policy._id]);

    const handleAcknowledge = async () => {
        if (!checked) return;
        setLoading(true);
        try {
            await API.post("/policies/acknowledge", { policyIds: [policy._id] });
            onSuccess("acknowledged");
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
                background: "#fff", borderRadius: 14, width: "100%", maxWidth: 640,
                maxHeight: "85vh", display: "flex", flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}>
                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "16px 20px", borderBottom: "1px solid #eee",
                }}>
                    <MdPolicy size={22} color="#4f46e5" />
                    <span style={{ fontWeight: 700, fontSize: "1rem", flex: 1 }}>{fullPolicy?.title ?? policy.title}</span>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <MdClose size={20} color="#888" />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                    {fetching ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading policy...</div>
                    ) : fullPolicy?.content ? (
                        <div
                            className="ql-editor"
                            style={{
                                fontSize: "0.875rem", lineHeight: 1.7, color: "#222",
                                padding: 0,          // ql-editor adds its own, override it
                                minHeight: "unset",
                            }}
                            dangerouslySetInnerHTML={{ __html: fullPolicy.content }}
                        />
                    ) : (
                        <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>No content available.</div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid #eee" }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 14 }}>
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => setChecked(e.target.checked)}
                            style={{ marginTop: 3, accentColor: "#4f46e5", width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: "0.875rem", color: "#222", fontWeight: 500 }}>
                            I have read and understood this policy
                        </span>
                    </label>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            onClick={handleAcknowledge}
                            disabled={!checked || loading || fetching}
                            style={{
                                flex: 1, padding: "10px", borderRadius: 8, border: "none",
                                cursor: checked && !fetching ? "pointer" : "not-allowed",
                                background: checked && !fetching ? "#4f46e5" : "#c7d2fe",
                                color: "#fff", fontWeight: 600, fontSize: "0.875rem",
                            }}
                        >
                            {loading ? "Saving..." : "Acknowledge"}
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: "10px 20px", borderRadius: 8, border: "1px solid #ddd",
                                background: "#fff", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyAcknowledgeModal;