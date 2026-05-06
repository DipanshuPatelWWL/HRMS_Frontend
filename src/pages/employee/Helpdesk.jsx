import { useEffect, useState, useMemo, useRef } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const icons = {
    ticket: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    plus: "M12 5v14M5 12h14",
    close: "M18 6L6 18M6 6l12 12",
    send: "M22 2L11 13 M22 2L15 22l-4-9-9-4 22-9z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    check: "M20 6L9 17l-5-5",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    hash: "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
    refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
    lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.hd-root * { box-sizing: border-box; margin: 0; padding: 0; }
.hd-root {
    font-family: 'DM Sans', sans-serif;
    background: #F4F6FA;
    color: #1A1D23;
    min-height: 100vh;
}

/* header */
.hd-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
}
.hd-header h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -.5px; color: #111318; }
.hd-header p  { font-size: .825rem; color: #818898; margin-top: 2px; }

/* new ticket btn */
.btn-new-ticket {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    background: #6366F1;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: .875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s, transform .15s;
}
.btn-new-ticket:hover {
    background: #4F46E5;
    transform: translateY(-1px);
}

/* stats */
.hd-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
}
@media(max-width:900px){ .hd-stats { grid-template-columns: repeat(2,1fr); } }
@media(max-width:480px){ .hd-stats { grid-template-columns: 1fr; } }

.hd-stat {
    background: #fff;
    border-radius: 14px;
    padding: 18px 20px;
    border: 1px solid #E8EBF0;
    position: relative;
    overflow: hidden;
}
.hd-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
}
.hd-stat.blue::before   { background: linear-gradient(90deg,#60A5FA,#3B82F6); }
.hd-stat.amber::before  { background: linear-gradient(90deg,#FCD34D,#F59E0B); }
.hd-stat.green::before  { background: linear-gradient(90deg,#4ADE80,#22C55E); }
.hd-stat.red::before    { background: linear-gradient(90deg,#F87171,#EF4444); }

.hd-stat-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #9CA3AF;
    margin-bottom: 8px;
}
.hd-stat-val {
    font-size: 2.2rem;
    font-weight: 700;
    letter-spacing: -1.5px;
    color: #111318;
    line-height: 1;
}

/* filters */
.hd-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
}
.hd-select {
    padding: 7px 12px;
    border-radius: 8px;
    border: 1.5px solid #E8EBF0;
    background: #fff;
    font-size: .82rem;
    font-family: inherit;
    color: #374151;
    cursor: pointer;
    outline: none;
    transition: border .15s;
}
.hd-select:focus { border-color: #6366F1; }

.hd-search {
    padding: 7px 12px;
    border-radius: 8px;
    border: 1.5px solid #E8EBF0;
    background: #fff;
    font-size: .82rem;
    font-family: inherit;
    color: #374151;
    outline: none;
    min-width: 200px;
    transition: border .15s;
}
.hd-search:focus { border-color: #6366F1; }

/* ticket list */
.hd-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.hd-ticket-row {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E8EBF0;
    padding: 18px 20px;
    cursor: pointer;
    transition: all .18s;
    display: flex;
    align-items: flex-start;
    gap: 16px;
}
.hd-ticket-row:hover {
    border-color: #C7D2FE;
    box-shadow: 0 4px 20px rgba(99,102,241,.07);
    transform: translateY(-1px);
}

.hd-ticket-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}
.hd-ticket-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.hd-ticket-body { flex: 1; min-width: 0; }
.hd-ticket-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
}
.hd-ticket-title {
    font-size: .925rem;
    font-weight: 600;
    color: #111318;
}
.hd-ticket-id {
    font-family: 'DM Mono', monospace;
    font-size: .72rem;
    color: #9CA3AF;
    background: #F3F4F6;
    padding: 2px 7px;
    border-radius: 5px;
    white-space: nowrap;
}
.hd-ticket-desc {
    font-size: .8rem;
    color: #6B7280;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.hd-ticket-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

/* chips */
.hd-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: .72rem;
    font-weight: 600;
}
.chip-blue    { background: #EFF6FF; color: #1D4ED8; }
.chip-amber   { background: #FFFBEB; color: #92400E; }
.chip-green   { background: #F0FDF4; color: #15803D; }
.chip-red     { background: #FFF1F2; color: #BE123C; }
.chip-gray    { background: #F3F4F6; color: #4B5563; }
.chip-purple  { background: #EEF2FF; color: #4338CA; }
.chip-orange  { background: #FFF7ED; color: #C2410C; }

/* status badge */
.hd-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 99px;
    font-size: .72rem;
    font-weight: 700;
    white-space: nowrap;
}
.badge-open       { background: #EFF6FF; color: #1D4ED8; }
.badge-inprogress { background: #FFF7ED; color: #C2410C; }
.badge-resolved   { background: #F0FDF4; color: #15803D; }
.badge-closed     { background: #F3F4F6; color: #6B7280; }
.badge-critical   { background: #FFF1F2; color: #BE123C; }

/* reply count bubble */
.hd-reply-count {
    font-size: .7rem;
    background: #EEF2FF;
    color: #4338CA;
    border-radius: 99px;
    padding: 2px 8px;
    font-weight: 700;
}

/* empty */
.hd-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: #9CA3AF;
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E8EBF0;
}
.hd-empty-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}

/* skeleton */
.hd-skeleton {
    background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Modal shared ── */
.hd-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
}
.hd-modal {
    background: #fff;
    border-radius: 18px;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 0;
}
.hd-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 22px;
}
.hd-modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111318;
    line-height: 1.3;
    padding-right: 12px;
}
.hd-close-btn {
    background: #F3F4F6;
    border: none;
    cursor: pointer;
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #6B7280;
    transition: background .15s;
}
.hd-close-btn:hover { background: #E5E7EB; }

/* form */
.hd-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
}
.hd-label {
    font-size: .75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #6B7280;
}
.hd-input {
    padding: 10px 12px;
    border: 1.5px solid #E8EBF0;
    border-radius: 10px;
    font-size: .875rem;
    font-family: inherit;
    color: #374151;
    outline: none;
    transition: border .15s;
}
.hd-input:focus { border-color: #6366F1; }
.hd-textarea {
    padding: 10px 12px;
    border: 1.5px solid #E8EBF0;
    border-radius: 10px;
    font-size: .875rem;
    font-family: inherit;
    color: #374151;
    outline: none;
    resize: vertical;
    min-height: 100px;
    line-height: 1.5;
    transition: border .15s;
}
.hd-textarea:focus { border-color: #6366F1; }
.hd-select-full {
    padding: 10px 12px;
    border: 1.5px solid #E8EBF0;
    border-radius: 10px;
    font-size: .875rem;
    font-family: inherit;
    color: #374151;
    outline: none;
    cursor: pointer;
    background: #fff;
    transition: border .15s;
}
.hd-select-full:focus { border-color: #6366F1; }

.hd-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
}

.hd-submit-btn {
    width: 100%;
    padding: 11px;
    background: #6366F1;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    margin-top: 6px;
}
.hd-submit-btn:hover:not(:disabled) { background: #4F46E5; }
.hd-submit-btn:disabled { opacity: .55; cursor: not-allowed; }

/* ── Thread modal ── */
.hd-thread-modal {
    max-width: 640px;
}

.hd-thread-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #F3F4F6;
}

.hd-replies {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    max-height: 320px;
    overflow-y: auto;
    padding-right: 4px;
}
.hd-replies::-webkit-scrollbar { width: 4px; }
.hd-replies::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }

.hd-reply-bubble {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}
.hd-reply-bubble.staff { flex-direction: row-reverse; }

.hd-bubble-avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .65rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
}

.hd-bubble-content {
    max-width: 75%;
}
.hd-bubble-name {
    font-size: .7rem;
    color: #9CA3AF;
    margin-bottom: 4px;
    font-weight: 500;
}
.hd-reply-bubble.staff .hd-bubble-name { text-align: right; }
.hd-bubble-text {
    background: #F3F4F6;
    padding: 10px 14px;
    border-radius: 12px 12px 12px 4px;
    font-size: .85rem;
    color: #374151;
    line-height: 1.5;
    word-break: break-word;
}
.hd-reply-bubble.staff .hd-bubble-text {
    background: #6366F1;
    color: #fff;
    border-radius: 12px 12px 4px 12px;
}
.hd-bubble-time {
    font-size: .65rem;
    color: #D1D5DB;
    margin-top: 4px;
    font-family: 'DM Mono', monospace;
}
.hd-reply-bubble.staff .hd-bubble-time { text-align: right; }

/* no replies */
.hd-no-replies {
    text-align: center;
    padding: 2rem;
    color: #9CA3AF;
    font-size: .82rem;
    background: #F9FAFB;
    border-radius: 10px;
}

/* reply input row */
.hd-reply-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    border-top: 1px solid #F3F4F6;
    padding-top: 16px;
}
.hd-reply-input {
    flex: 1;
    padding: 10px 14px;
    border: 1.5px solid #E8EBF0;
    border-radius: 10px;
    font-size: .875rem;
    font-family: inherit;
    color: #374151;
    outline: none;
    resize: none;
    min-height: 42px;
    max-height: 120px;
    line-height: 1.5;
    transition: border .15s;
}
.hd-reply-input:focus { border-color: #6366F1; }

.hd-send-btn {
    width: 42px; height: 42px;
    background: #6366F1;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background .15s;
    color: #fff;
}
.hd-send-btn:hover:not(:disabled) { background: #4F46E5; }
.hd-send-btn:disabled { opacity: .45; cursor: not-allowed; }

/* close ticket btn */
.hd-close-ticket-btn {
    padding: 8px 16px;
    background: #F3F4F6;
    color: #6B7280;
    border: 1.5px solid #E8EBF0;
    border-radius: 8px;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all .15s;
    display: flex;
    align-items: center;
    gap: 6px;
}
.hd-close-ticket-btn:hover { background: #E5E7EB; color: #374151; }

/* divider */
.hd-divider { border: none; border-top: 1px solid #F3F4F6; margin: 16px 0; }

/* description block */
.hd-desc-block {
    background: #F9FAFB;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: .85rem;
    color: #374151;
    line-height: 1.6;
    white-space: pre-wrap;
    margin-bottom: 16px;
    border: 1px solid #F3F4F6;
}

/* toast */
.hd-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    background: #1A1D23;
    color: #fff;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: .85rem;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,.2);
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideUp .2s ease;
}
@keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const initials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusBadge = (status) => {
    const map = {
        open: { cls: "badge-open", label: "Open" },
        "in-progress": { cls: "badge-inprogress", label: "In Progress" },
        resolved: { cls: "badge-resolved", label: "Resolved" },
        closed: { cls: "badge-closed", label: "Closed" },
    };
    const { cls, label } = map[status] || map.open;
    return <span className={`hd-badge ${cls}`}>{label}</span>;
};

const priorityChip = (p) => {
    const map = {
        low: { cls: "chip-green", label: "Low" },
        medium: { cls: "chip-amber", label: "Medium" },
        high: { cls: "chip-red", label: "High" },
        critical: { cls: "chip-red", label: "Critical" },
    };
    const { cls, label } = map[p] || map.medium;
    return (
        <span className={`hd-chip ${cls}`}>
            <Icon d={icons.flag} size={11} />{label}
        </span>
    );
};

const categoryChip = (c) => {
    const map = {
        it: { cls: "chip-blue", label: "IT" },
        hr: { cls: "chip-purple", label: "HR" },
        admin: { cls: "chip-gray", label: "Admin" },
        payroll: { cls: "chip-green", label: "Payroll" },
        attendance: { cls: "chip-amber", label: "Attendance" },
        other: { cls: "chip-gray", label: "Other" },
    };
    const { cls, label } = map[c] || map.other;
    return <span className={`hd-chip ${cls}`}>{label}</span>;
};

const iconBg = {
    it: "#EFF6FF",
    hr: "#EEF2FF",
    admin: "#F3F4F6",
    payroll: "#F0FDF4",
    attendance: "#FFFBEB",
    other: "#F3F4F6",
};
const iconColor = {
    it: "#3B82F6",
    hr: "#6366F1",
    admin: "#6B7280",
    payroll: "#22C55E",
    attendance: "#F59E0B",
    other: "#9CA3AF",
};

/* ─── Raise Ticket Modal ─────────────────────────────────────────────────── */
const RaiseModal = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({
        title: "", description: "", category: "other", priority: "medium",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.description.trim()) {
            setError("Title and description are required");
            return;
        }
        try {
            setSubmitting(true);
            setError("");
            const res = await API.post("/tickets", form);
            onCreated(res.data.ticket);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to raise ticket");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="hd-backdrop" onClick={onClose}>
            <div className="hd-modal" onClick={(e) => e.stopPropagation()}>

                <div className="hd-modal-header">
                    <div className="hd-modal-title">Raise a new ticket</div>
                    <button className="hd-close-btn" onClick={onClose}>
                        <Icon d={icons.close} size={16} />
                    </button>
                </div>

                <div className="hd-form-group">
                    <label className="hd-label">Title</label>
                    <input
                        className="hd-input"
                        placeholder="Brief summary of your issue…"
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                    />
                </div>

                <div className="hd-form-group">
                    <label className="hd-label">Description</label>
                    <textarea
                        className="hd-textarea"
                        placeholder="Describe your issue in detail…"
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                    />
                </div>

                <div className="hd-form-row">
                    <div className="hd-form-group" style={{ margin: 0 }}>
                        <label className="hd-label">Category</label>
                        <select
                            className="hd-select-full"
                            value={form.category}
                            onChange={(e) => set("category", e.target.value)}
                        >
                            <option value="it">IT</option>
                            <option value="hr">HR</option>
                            <option value="admin">Admin</option>
                            <option value="payroll">Payroll</option>
                            <option value="attendance">Attendance</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="hd-form-group" style={{ margin: 0 }}>
                        <label className="hd-label">Priority</label>
                        <select
                            className="hd-select-full"
                            value={form.priority}
                            onChange={(e) => set("priority", e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: "#FFF1F2", color: "#BE123C",
                        padding: "10px 14px", borderRadius: 8,
                        fontSize: ".82rem", marginBottom: 10,
                        border: "1px solid #FECDD3",
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <Icon d={icons.alert} size={14} color="#BE123C" /> {error}
                    </div>
                )}

                <button
                    className="hd-submit-btn"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? "Submitting…" : "Submit ticket"}
                </button>

            </div>
        </div>
    );
};

/* ─── Ticket Thread Modal ────────────────────────────────────────────────── */
const ThreadModal = ({ ticket: initialTicket, currentUser, onClose, onUpdate }) => {
    const [ticket, setTicket] = useState(initialTicket);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [closing, setClosing] = useState(false);
    const repliesEndRef = useRef(null);

    // scroll to bottom of replies
    useEffect(() => {
        repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket.replies]);

    const handleSendReply = async () => {
        if (!reply.trim()) return;
        try {
            setSending(true);
            const res = await API.post(`/tickets/${ticket._id}/reply`, { message: reply.trim() });
            setTicket(res.data.ticket);
            onUpdate(res.data.ticket);
            setReply("");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendReply();
        }
    };

    const handleCloseTicket = async () => {
        if (!window.confirm("Close this ticket?")) return;
        try {
            setClosing(true);
            const res = await API.put(`/tickets/${ticket._id}/close`);
            setTicket(res.data.ticket);
            onUpdate(res.data.ticket);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to close ticket");
        } finally {
            setClosing(false);
        }
    };

    const isClosed = ticket.status === "closed";
    const isResolved = ticket.status === "resolved";
    const isOwner = ticket.user?._id === currentUser?._id ||
        ticket.user === currentUser?._id;

    return (
        <div className="hd-backdrop" onClick={onClose}>
            <div
                className="hd-modal hd-thread-modal"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="hd-modal-header">
                    <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: ".72rem",
                            color: "#9CA3AF",
                            marginBottom: 4,
                        }}>
                            {ticket.ticketId}
                        </div>
                        <div className="hd-modal-title">{ticket.title}</div>
                    </div>
                    <button className="hd-close-btn" onClick={onClose}>
                        <Icon d={icons.close} size={16} />
                    </button>
                </div>

                {/* Meta */}
                <div className="hd-thread-meta">
                    {statusBadge(ticket.status)}
                    {priorityChip(ticket.priority)}
                    {categoryChip(ticket.category)}
                    <span className="hd-chip chip-gray">
                        <Icon d={icons.calendar} size={11} />
                        {formatDate(ticket.createdAt)}
                    </span>
                    {ticket.assignedTo && (
                        <span className="hd-chip chip-purple">
                            <Icon d={icons.user} size={11} />
                            {ticket.assignedTo.name}
                        </span>
                    )}
                </div>

                {/* Original description */}
                <div style={{
                    fontSize: ".72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".7px",
                    color: "#9CA3AF",
                    marginBottom: 8,
                }}>
                    Description
                </div>
                <div className="hd-desc-block">{ticket.description}</div>

                {/* Resolved info */}
                {isResolved && ticket.resolvedAt && (
                    <div style={{
                        background: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: ".8rem",
                        color: "#15803D",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 16,
                    }}>
                        <Icon d={icons.check} size={14} color="#15803D" />
                        Resolved on {formatDate(ticket.resolvedAt)}
                        {ticket.resolvedBy && ` by ${ticket.resolvedBy.name}`}
                    </div>
                )}

                {/* Replies thread */}
                <div style={{
                    fontSize: ".72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".7px",
                    color: "#9CA3AF",
                    marginBottom: 10,
                }}>
                    Conversation ({ticket.replies?.length || 0})
                </div>

                <div className="hd-replies">
                    {(!ticket.replies || ticket.replies.length === 0) && (
                        <div className="hd-no-replies">
                            No replies yet. Add a message below.
                        </div>
                    )}

                    {ticket.replies?.map((r) => {
                        const isStaff = r.isStaff;
                        const name = r.sentBy?.name || "Unknown";
                        const bg = isStaff ? "#6366F1" : "#9CA3AF";

                        return (
                            <div
                                key={r._id}
                                className={`hd-reply-bubble ${isStaff ? "staff" : ""}`}
                            >
                                <div
                                    className="hd-bubble-avatar"
                                    style={{ background: bg }}
                                >
                                    {initials(name)}
                                </div>
                                <div className="hd-bubble-content">
                                    <div className="hd-bubble-name">
                                        {name}
                                        {isStaff && (
                                            <span style={{
                                                marginLeft: 5,
                                                background: "#EEF2FF",
                                                color: "#4338CA",
                                                padding: "1px 5px",
                                                borderRadius: 4,
                                                fontSize: ".65rem",
                                                fontWeight: 700,
                                            }}>
                                                Staff
                                            </span>
                                        )}
                                    </div>
                                    <div className="hd-bubble-text">{r.message}</div>
                                    <div className="hd-bubble-time">{timeAgo(r.createdAt)}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={repliesEndRef} />
                </div>

                {/* Reply input — disable if closed */}
                {isClosed ? (
                    <div style={{
                        textAlign: "center",
                        padding: "14px",
                        background: "#F9FAFB",
                        borderRadius: 10,
                        color: "#9CA3AF",
                        fontSize: ".82rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        borderTop: "1px solid #F3F4F6",
                        paddingTop: 16,
                        marginTop: 4,
                    }}>
                        <Icon d={icons.lock} size={14} color="#9CA3AF" />
                        This ticket is closed
                    </div>
                ) : (
                    <div className="hd-reply-row">
                        <textarea
                            className="hd-reply-input"
                            placeholder="Type a message… (Enter to send)"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button
                            className="hd-send-btn"
                            onClick={handleSendReply}
                            disabled={sending || !reply.trim()}
                            title="Send reply"
                        >
                            <Icon d={icons.send} size={15} color="#fff" />
                        </button>
                    </div>
                )}

                {/* Close ticket button — only for owner, only when resolved */}
                {isResolved && isOwner && !isClosed && (
                    <button
                        className="hd-close-ticket-btn"
                        onClick={handleCloseTicket}
                        disabled={closing}
                        style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                    >
                        <Icon d={icons.lock} size={14} />
                        {closing ? "Closing…" : "Mark as closed"}
                    </button>
                )}

            </div>
        </div>
    );
};

/* ─── Skeleton Row ───────────────────────────────────────────────────────── */
const SkeletonRow = () => (
    <div className="hd-ticket-row" style={{ cursor: "default", pointerEvents: "none" }}>
        <div className="hd-skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
            <div className="hd-skeleton" style={{ height: 14, width: "55%", marginBottom: 8 }} />
            <div className="hd-skeleton" style={{ height: 12, width: "80%", marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8 }}>
                <div className="hd-skeleton" style={{ height: 20, width: 60 }} />
                <div className="hd-skeleton" style={{ height: 20, width: 60 }} />
            </div>
        </div>
    </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
const Helpdesk = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRaise, setShowRaise] = useState(false);
    const [selected, setSelected] = useState(null);
    const [statusFilter, setStatus] = useState("all");
    const [categoryFilter, setCat] = useState("all");
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState("");

    // get logged in user from localStorage
    const currentUser = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("user") || "{}"); }
        catch { return {}; }
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (categoryFilter !== "all") params.append("category", categoryFilter);
            const res = await API.get(`/tickets/my?${params.toString()}`);
            setTickets(res.data.tickets || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTickets(); }, [statusFilter, categoryFilter]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    const handleCreated = (ticket) => {
        setTickets((prev) => [ticket, ...prev]);
        showToast("Ticket raised successfully");
    };

    const handleUpdate = (updated) => {
        setTickets((prev) =>
            prev.map((t) => (t._id === updated._id ? updated : t))
        );
    };

    // client side search
    const filtered = useMemo(() =>
        tickets.filter((t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.ticketId?.toLowerCase().includes(search.toLowerCase())
        ),
        [tickets, search]);

    // derive stats
    const stats = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter((t) => t.status === "open").length,
        inProgress: tickets.filter((t) => t.status === "in-progress").length,
        resolved: tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length,
    }), [tickets]);

    const statCards = [
        { label: "Total", value: stats.total, color: "blue" },
        { label: "Open", value: stats.open, color: "amber" },
        { label: "In Progress", value: stats.inProgress, color: "blue" },
        { label: "Resolved", value: stats.resolved, color: "green" },
    ];

    return (
        <>
            <style>{css}</style>

            {/* Toast */}
            {toast && (
                <div className="hd-toast">
                    <Icon d={icons.check} size={14} color="#4ADE80" /> {toast}
                </div>
            )}

            <DashboardLayout>
                <div className="hd-root">

                    {/* Header */}
                    <div className="hd-header">
                        <div>
                            <h1>Helpdesk</h1>
                            <p>Raise issues and track resolution status</p>
                        </div>
                        <button className="btn-new-ticket" onClick={() => setShowRaise(true)}>
                            <Icon d={icons.plus} size={16} color="#fff" />
                            New ticket
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="hd-stats">
                        {statCards.map((s) => (
                            <div key={s.label} className={`hd-stat ${s.color}`}>
                                <div className="hd-stat-label">{s.label}</div>
                                <div className="hd-stat-val">{loading ? "—" : s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="hd-filters">
                        <Icon d={icons.filter} size={15} color="#9CA3AF" />

                        <input
                            className="hd-search"
                            placeholder="Search by title or ticket ID…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className="hd-select"
                            value={statusFilter}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="all">All status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>

                        <select
                            className="hd-select"
                            value={categoryFilter}
                            onChange={(e) => setCat(e.target.value)}
                        >
                            <option value="all">All categories</option>
                            <option value="it">IT</option>
                            <option value="hr">HR</option>
                            <option value="admin">Admin</option>
                            <option value="payroll">Payroll</option>
                            <option value="attendance">Attendance</option>
                            <option value="other">Other</option>
                        </select>

                        {(statusFilter !== "all" || categoryFilter !== "all" || search) && (
                            <button
                                onClick={() => { setStatus("all"); setCat("all"); setSearch(""); }}
                                style={{
                                    padding: "7px 12px", borderRadius: 8,
                                    border: "1.5px solid #E8EBF0", background: "#fff",
                                    fontSize: ".8rem", color: "#6B7280",
                                    cursor: "pointer", fontFamily: "inherit",
                                    display: "flex", alignItems: "center", gap: 5,
                                }}
                            >
                                <Icon d={icons.close} size={12} /> Clear
                            </button>
                        )}

                        <button
                            onClick={fetchTickets}
                            style={{
                                padding: "7px 10px", borderRadius: 8,
                                border: "1.5px solid #E8EBF0", background: "#fff",
                                cursor: "pointer", color: "#6B7280",
                                display: "flex", alignItems: "center",
                            }}
                            title="Refresh"
                        >
                            <Icon d={icons.refresh} size={14} />
                        </button>
                    </div>

                    {/* Ticket list */}
                    <div className="hd-list">

                        {loading && Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))}

                        {!loading && filtered.length === 0 && (
                            <div className="hd-empty">
                                <div className="hd-empty-icon">
                                    <Icon d={icons.inbox} size={24} color="#9CA3AF" />
                                </div>
                                <p style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                                    No tickets found
                                </p>
                                <p style={{ fontSize: ".82rem" }}>
                                    {search || statusFilter !== "all" || categoryFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "You haven't raised any tickets yet"}
                                </p>
                            </div>
                        )}

                        {!loading && filtered.map((ticket) => (
                            <div
                                key={ticket._id}
                                className="hd-ticket-row"
                                onClick={() => setSelected(ticket)}
                            >
                                {/* Icon */}
                                <div>
                                    <div
                                        className="hd-ticket-icon"
                                        style={{
                                            background: iconBg[ticket.category] || "#F3F4F6",
                                        }}
                                    >
                                        <Icon
                                            d={icons.ticket}
                                            size={18}
                                            color={iconColor[ticket.category] || "#9CA3AF"}
                                        />
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="hd-ticket-body">
                                    <div className="hd-ticket-top">
                                        <div className="hd-ticket-title">{ticket.title}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                            <span className="hd-ticket-id">{ticket.ticketId}</span>
                                            {statusBadge(ticket.status)}
                                        </div>
                                    </div>

                                    <div className="hd-ticket-desc">{ticket.description}</div>

                                    <div className="hd-ticket-meta">
                                        {categoryChip(ticket.category)}
                                        {priorityChip(ticket.priority)}

                                        <span className="hd-chip chip-gray">
                                            <Icon d={icons.calendar} size={11} />
                                            {formatDate(ticket.createdAt)}
                                        </span>

                                        {ticket.replies?.length > 0 && (
                                            <span className="hd-reply-count">
                                                {ticket.replies.length} {ticket.replies.length === 1 ? "reply" : "replies"}
                                            </span>
                                        )}

                                        {ticket.assignedTo && (
                                            <span className="hd-chip chip-purple">
                                                <Icon d={icons.user} size={11} />
                                                {ticket.assignedTo.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* Raise ticket modal */}
                {showRaise && (
                    <RaiseModal
                        onClose={() => setShowRaise(false)}
                        onCreated={handleCreated}
                    />
                )}

                {/* Thread modal */}
                {selected && (
                    <ThreadModal
                        ticket={selected}
                        currentUser={currentUser}
                        onClose={() => setSelected(null)}
                        onUpdate={(updated) => {
                            handleUpdate(updated);
                            setSelected(updated);
                        }}
                    />
                )}

            </DashboardLayout>
        </>
    );
};

export default Helpdesk;