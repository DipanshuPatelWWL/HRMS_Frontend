import { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";

const SOURCE_LABELS = { kb: "Knowledge Base", db: "Live Data", ai: "AI" };
const SOURCE_COLORS = { kb: "#7c3aed", db: "#059669", ai: "#2563eb" };

export default function ChatWidget() {
    const { user } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            from: "ai",
            text: `Hi ${user?.name?.split(" ")[0] || "there"}! I can help with leaves, salary, attendance, tickets, holidays, and more. What do you need?`,
        },
    ]);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Focus input when chat opens
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100);
    }, [open]);

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const token = localStorage.getItem("token");
        setInput("");
        setMessages(prev => [...prev, { from: "user", text }]);
        setLoading(true);

        try {
            const res = await API.post("/ai/ask", {
                question: text,
            });
            setMessages(prev => [
                ...prev,
                { from: "ai", text: res.data.answer, source: res.data.source },
            ]);
        } catch (e) {
            const msg = e.response?.data?.message || "Can't reach the server. Please try again.";
            setMessages(prev => [...prev, { from: "ai", text: `⚠️ ${msg}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <>
            {/* FAB button */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Open AI Assistant"
                style={{
                    position: "fixed", bottom: 24, right: 24,
                    width: 56, height: 56, borderRadius: "50%",
                    background: "#2563eb", color: "#fff", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 26, zIndex: 9999,
                    boxShadow: "0 4px 16px rgba(37,99,235,0.45)",
                    transition: "transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
                {open ? "✕" : "💬"}
            </button>

            {/* Chat panel */}
            {open && (
                <div
                    role="dialog"
                    aria-label="HRMS AI Assistant"
                    style={{
                        position: "fixed", bottom: 92, right: 24,
                        width: 360, height: 520,
                        background: "#fff", borderRadius: 14,
                        display: "flex", flexDirection: "column",
                        zIndex: 9999, overflow: "hidden",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        border: "1px solid #e5e7eb",
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: "12px 16px",
                        background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
                        color: "#fff", fontWeight: 600, fontSize: 15,
                        display: "flex", alignItems: "center", gap: 8,
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 18 }}>🤖</span>
                        HRMS AI Assistant
                        <span style={{
                            marginLeft: "auto", fontSize: 11, fontWeight: 400,
                            background: "rgba(255,255,255,0.2)", borderRadius: 20,
                            padding: "2px 8px",
                        }}>
                            Online
                        </span>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, padding: "12px 12px 4px",
                        overflowY: "auto", display: "flex",
                        flexDirection: "column", gap: 8,
                    }}>
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                style={{
                                    maxWidth: "85%",
                                    alignSelf: m.from === "ai" ? "flex-start" : "flex-end",
                                }}
                            >
                                <div style={{
                                    padding: "9px 13px",
                                    borderRadius: m.from === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                                    background: m.from === "ai" ? "#f1f5f9" : "#2563eb",
                                    color: m.from === "ai" ? "#0f172a" : "#fff",
                                    whiteSpace: "pre-wrap", fontSize: 13.5,
                                    lineHeight: 1.5,
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                }}>
                                    {m.text}
                                </div>
                                {m.source && (
                                    <div style={{
                                        fontSize: 10, marginTop: 3,
                                        paddingLeft: 4,
                                        color: SOURCE_COLORS[m.source] || "#94a3b8",
                                    }}>
                                        ● {SOURCE_LABELS[m.source] || m.source}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div style={{
                                alignSelf: "flex-start",
                                background: "#f1f5f9",
                                borderRadius: "4px 18px 18px 18px",
                                padding: "10px 16px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                minWidth: 54,
                                marginTop: 2,
                            }}>
                                <style>{`
            @keyframes waBounce {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                30%            { transform: translateY(-6px); opacity: 1; }
            }
        `}</style>
                                {[0, 1, 2].map(i => (
                                    <span key={i} style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: "#94a3b8",
                                        display: "inline-block",
                                        animation: `waBounce 1.2s ease-in-out infinite`,
                                        animationDelay: `${i * 0.2}s`,
                                    }} />
                                ))}
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={bottomRef} />
                    </div>

                    {/* Suggested quick questions */}
                    {messages.length === 1 && (
                        <div style={{
                            display: "flex", flexWrap: "wrap", gap: 6,
                            padding: "4px 12px 8px", flexShrink: 0,
                        }}>
                            {["My leave balance", "Today's attendance", "My payslip", "Upcoming holidays"].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                                    style={{
                                        fontSize: 11, padding: "4px 10px",
                                        border: "1px solid #dbeafe", borderRadius: 20,
                                        background: "#eff6ff", color: "#1d4ed8",
                                        cursor: "pointer",
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input row */}
                    <div style={{
                        display: "flex", padding: "8px 10px",
                        borderTop: "1px solid #e5e7eb", gap: 8,
                        background: "#fafafa", flexShrink: 0,
                    }}>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            disabled={loading}
                            placeholder="Ask about leaves, salary, attendance…"
                            style={{
                                flex: 1, padding: "8px 12px",
                                border: "1px solid #d1d5db", borderRadius: 8,
                                fontSize: 13.5, outline: "none",
                                background: loading ? "#f9fafb" : "#fff",
                            }}
                        />
                        <button
                            onClick={send}
                            disabled={loading || !input.trim()}
                            style={{
                                padding: "8px 14px",
                                background: (loading || !input.trim()) ? "#93c5fd" : "#2563eb",
                                color: "#fff", border: "none", borderRadius: 8,
                                cursor: (loading || !input.trim()) ? "not-allowed" : "pointer",
                                fontSize: 14, fontWeight: 600,
                                transition: "background 0.15s",
                            }}
                        >
                            ↑
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}