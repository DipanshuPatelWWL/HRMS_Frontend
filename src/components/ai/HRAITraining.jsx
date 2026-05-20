import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import {
    FiMessageCircle,
    FiSend,
    FiTrash2,
    FiRefreshCw,
    FiAlertCircle,
    FiCheckCircle,
    FiUser,
    FiRepeat,
    FiInbox,
} from "react-icons/fi";
import { LuBrain } from "react-icons/lu";
import API from "../../services/api";

const HRAITraining = () => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [toast, setToast] = useState(null);

    const token = localStorage.getItem("token");

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ================= FETCH QUESTIONS =================
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const res = await API.get("/hr-ai/unanswered");
            setQuestions(res.data.questions || []);
        } catch (error) {
            showToast(error?.response?.data?.message || "Failed to fetch questions", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    // ================= SAVE ANSWER =================
    const submitAnswer = async (id) => {
        if (!answers[id]?.trim()) return showToast("Please write an answer first", "error");
        try {
            setSavingId(id);
            await API.post(`/hr-ai/answer/${id}`, {
                answer: answers[id],
            });
            showToast("Answer saved & added to Knowledge Base ✓");
            setAnswers((prev) => ({ ...prev, [id]: "" }));
            fetchQuestions();
        } catch (error) {
            showToast(error?.response?.data?.message || "Failed to save answer", "error");
        } finally {
            setSavingId(null);
        }
    };

    // ================= DELETE QUESTION =================
    const deleteQuestion = async (id) => {
        try {
            setDeletingId(id);
            await API.delete(`/hr-ai/unanswered/${id}`);
            showToast("Question deleted successfully");
            setQuestions((prev) => prev.filter((q) => q._id !== id));
            setConfirmDeleteId(null);
        } catch (error) {
            showToast(error?.response?.data?.message || "Failed to delete question", "error");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f5f4f0", padding: "32px 28px" }}>

                {/* GOOGLE FONT */}
                <style>{`
                    .q-card {
                        background: #fff;
                        border: 1.5px solid #e8e6e0;
                        border-radius: 16px;
                        padding: 24px;
                        transition: box-shadow 0.2s, border-color 0.2s;
                    }
                    .q-card:hover {
                        box-shadow: 0 6px 28px rgba(0,0,0,0.07);
                        border-color: #d0cec8;
                    }
                    .answer-textarea {
                        width: 100%;
                        border: 1.5px solid #e8e6e0;
                        border-radius: 10px;
                        padding: 12px 14px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 14px;
                        resize: vertical;
                        outline: none;
                        background: #fafaf8;
                        color: #1a1a1a;
                        box-sizing: border-box;
                        transition: border-color 0.2s, box-shadow 0.2s;
                        line-height: 1.6;
                    }
                    .answer-textarea:focus {
                        border-color: #1a1a1a;
                        background: #fff;
                        box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
                    }
                    .answer-textarea::placeholder { color: #aaa9a4; }

                    .btn-save {
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        background: #1a1a1a;
                        color: #fff;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 9px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: opacity 0.2s, transform 0.1s;
                    }
                    .btn-save:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
                    .btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

                    .btn-delete {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: transparent;
                        color: #c0392b;
                        border: 1.5px solid #f0d0cc;
                        padding: 9px 16px;
                        border-radius: 9px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-delete:hover:not(:disabled) {
                        background: #fff0ee;
                        border-color: #c0392b;
                    }
                    .btn-delete:disabled { opacity: 0.45; cursor: not-allowed; }

                    .btn-delete-confirm {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: #c0392b;
                        color: #fff;
                        border: none;
                        padding: 9px 16px;
                        border-radius: 9px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: opacity 0.2s;
                    }
                    .btn-delete-confirm:hover { opacity: 0.88; }

                    .btn-cancel {
                        background: transparent;
                        border: 1.5px solid #ddd;
                        padding: 9px 16px;
                        border-radius: 9px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 14px;
                        cursor: pointer;
                        color: #666;
                        transition: background 0.2s;
                    }
                    .btn-cancel:hover { background: #f5f4f0; }

                    .btn-refresh {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: transparent;
                        color: #555;
                        border: 1.5px solid #e0deda;
                        padding: 9px 16px;
                        border-radius: 9px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-refresh:hover { background: #fff; border-color: #bbb; }

                    .tag-pending {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        background: #fef6e4;
                        color: #b45309;
                        border: 1px solid #fde68a;
                        padding: 4px 10px;
                        border-radius: 20px;
                    }
                    .tag-count {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12px;
                        color: #6b6b65;
                        background: #f5f4f0;
                        padding: 3px 9px;
                        border-radius: 20px;
                    }
                    .tag-role {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12px;
                        color: #6b6b65;
                        background: #f0f0f8;
                        padding: 3px 9px;
                        border-radius: 20px;
                    }

                    .toast {
                        position: fixed;
                        bottom: 28px;
                        right: 28px;
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 14px 20px;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 500;
                        font-family: 'DM Sans', sans-serif;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                        animation: slideUp 0.3s ease;
                    }
                    .toast-success { background: #1a1a1a; color: #fff; }
                    .toast-error { background: #c0392b; color: #fff; }

                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                    .confirm-banner {
                        margin-top: 16px;
                        padding: 14px 16px;
                        background: #fff5f5;
                        border: 1.5px solid #fecaca;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 12px;
                    }
                    .divider {
                        border: none;
                        border-top: 1.5px solid #f0ece6;
                        margin: 20px 0 0 0;
                    }
                `}</style>

                {/* HEADER */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <div style={{ background: "#1a1a1a", borderRadius: "10px", padding: "8px", display: "flex" }}>
                                <LuBrain size={20} color="#fff" />
                            </div>
                            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                                Common Question's
                            </h1>
                        </div>
                        <p style={{ color: "#888", fontSize: "14px", margin: 0, paddingLeft: "48px" }}>
                            Answer pending employee questions to train your HRMS AI
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {!loading && questions.length > 0 && (
                            <span style={{ fontSize: "13px", color: "#888", background: "#fff", border: "1.5px solid #e8e6e0", padding: "6px 14px", borderRadius: "20px", fontWeight: "500" }}>
                                {questions.length} pending
                            </span>
                        )}
                        <button className="btn-refresh" onClick={fetchQuestions} disabled={loading}>
                            <FiRefreshCw size={14} className={loading ? "spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* LOADING */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#888" }}>
                        <FiRefreshCw size={28} className="spin" style={{ marginBottom: "16px", color: "#bbb" }} />
                        <p style={{ fontSize: "15px", fontWeight: "500" }}>Loading unanswered questions...</p>
                    </div>

                ) : questions.length === 0 ? (
                    // EMPTY STATE
                    <div style={{ background: "#fff", border: "1.5px solid #e8e6e0", borderRadius: "18px", padding: "64px 40px", textAlign: "center" }}>
                        <div style={{ width: "64px", height: "64px", background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                            <FiInbox size={28} color="#16a34a" />
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a1a", marginBottom: "8px" }}>
                            All caught up!
                        </h2>
                        <p style={{ color: "#888", fontSize: "14px" }}>
                            No unanswered questions right now. Your AI is fully trained.
                        </p>
                    </div>

                ) : (
                    // QUESTIONS LIST
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {questions.map((q, index) => (
                            <div key={q._id} className="q-card">

                                {/* TOP ROW */}
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                                    <div style={{ flex: 1 }}>
                                        {/* INDEX + QUESTION */}
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                            <span style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#aaa", background: "#f5f4f0", padding: "3px 8px", borderRadius: "6px", marginTop: "2px", flexShrink: 0 }}>
                                                #{String(index + 1).padStart(2, "0")}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                                <FiMessageCircle size={16} color="#888" style={{ marginTop: "3px", flexShrink: 0 }} />
                                                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1a1a1a", margin: 0, lineHeight: "1.4" }}>
                                                    {q.question}
                                                </h2>
                                            </div>
                                        </div>

                                        {/* META TAGS */}
                                        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap", paddingLeft: "60px" }}>
                                            <span className="tag-count">
                                                <FiRepeat size={11} />
                                                Asked {q.count || 1}×
                                            </span>
                                            <span className="tag-role">
                                                <FiUser size={11} />
                                                {q.role || "employee"}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="tag-pending">
                                        <FiAlertCircle size={10} />
                                        Pending
                                    </span>
                                </div>

                                <hr className="divider" />

                                {/* ANSWER BOX */}
                                <div style={{ marginTop: "20px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                                        Your Answer
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Write a clear, helpful answer that the AI will use to respond to similar questions..."
                                        value={answers[q._id] || ""}
                                        onChange={(e) =>
                                            setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))
                                        }
                                        className="answer-textarea"
                                    />
                                </div>

                                {/* ACTIONS */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", flexWrap: "wrap", gap: "10px" }}>
                                    <button
                                        className="btn-delete"
                                        onClick={() => setConfirmDeleteId(confirmDeleteId === q._id ? null : q._id)}
                                        disabled={deletingId === q._id || savingId === q._id}
                                    >
                                        <FiTrash2 size={14} />
                                        Delete
                                    </button>

                                    <button
                                        className="btn-save"
                                        onClick={() => submitAnswer(q._id)}
                                        disabled={savingId === q._id || deletingId === q._id}
                                    >
                                        {savingId === q._id ? (
                                            <>
                                                <FiRefreshCw size={14} className="spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiSend size={14} />
                                                Save Answer
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* CONFIRM DELETE BANNER */}
                                {confirmDeleteId === q._id && (
                                    <div className="confirm-banner">
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <FiAlertCircle size={16} color="#c0392b" />
                                            <span style={{ fontSize: "14px", color: "#7f1d1d", fontWeight: "500" }}>
                                                Delete this question permanently?
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>
                                                Cancel
                                            </button>
                                            <button
                                                className="btn-delete-confirm"
                                                onClick={() => deleteQuestion(q._id)}
                                                disabled={deletingId === q._id}
                                            >
                                                {deletingId === q._id ? (
                                                    <>
                                                        <FiRefreshCw size={13} className="spin" />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiTrash2 size={13} />
                                                        Yes, Delete
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* TOAST */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === "success"
                        ? <FiCheckCircle size={16} />
                        : <FiAlertCircle size={16} />
                    }
                    {toast.message}
                </div>
            )}
        </DashboardLayout>
    );
};

export default HRAITraining;