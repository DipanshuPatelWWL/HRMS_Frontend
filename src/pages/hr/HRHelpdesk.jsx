import { useEffect, useState, useMemo, useRef } from "react";
import API, { BASE_URL } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StopwatchLoader from "../../components/common/StopwatchLoader";

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
    trash: "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2",
    assign: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    status: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    critical: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.hr-root * { box-sizing: border-box; margin: 0; padding: 0; }
.hr-root {
    font-family: 'DM Sans', sans-serif;
    background: #F4F6FA;
    color: #1A1D23;
    min-height: 100vh;
}

/* header */
.hr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
}
.hr-header h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -.5px; color: #111318; }
.hr-header p  { font-size: .825rem; color: #47494e; margin-top: 2px; }

/* stats */
.hr-stats {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-bottom: 24px;
}
@media(max-width:1100px){ .hr-stats { grid-template-columns: repeat(3,1fr); } }
@media(max-width:600px){ .hr-stats { grid-template-columns: repeat(2,1fr); } }

.hr-stat {
    background: #fff;
    border-radius: 14px;
    padding: 16px 18px;
    border: 1px solid #E8EBF0;
    position: relative;
    overflow: hidden;
}
.hr-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
}
.hr-stat.blue::before   { background: linear-gradient(90deg,#60A5FA,#3B82F6); }
.hr-stat.amber::before  { background: linear-gradient(90deg,#FCD34D,#F59E0B); }
.hr-stat.green::before  { background: linear-gradient(90deg,#4ADE80,#22C55E); }
.hr-stat.red::before    { background: linear-gradient(90deg,#F87171,#EF4444); }
.hr-stat.gray::before   { background: linear-gradient(90deg,#D1D5DB,#9CA3AF); }
.hr-stat.purple::before { background: linear-gradient(90deg,#A78BFA,#7C3AED); }

.hr-stat-label {
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #585a5e;
    margin-bottom: 8px;
}
.hr-stat-val {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -1.5px;
    color: #111318;
    line-height: 1;
}

/* filters */
.hr-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
}
.hr-select {
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
.hr-select:focus { border-color: #6366F1; }
.hr-search {
    padding: 7px 12px;
    border-radius: 8px;
    border: 1.5px solid #E8EBF0;
    background: #fff;
    font-size: .82rem;
    font-family: inherit;
    color: #2d2e31;
    outline: none;
    min-width: 200px;
    transition: border .15s;
}
.hr-search:focus { border-color: #6366F1; }

/* ticket list */
.hr-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.hr-ticket-row {
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
.hr-ticket-row:hover {
    border-color: #C7D2FE;
    box-shadow: 0 4px 20px rgba(99,102,241,.07);
    transform: translateY(-1px);
}
.hr-ticket-row.priority-critical {
    border-left: 3px solid #EF4444;
}
.hr-ticket-row.priority-high {
    border-left: 3px solid #F59E0B;
}

.hr-ticket-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.hr-ticket-body { flex: 1; min-width: 0; }
.hr-ticket-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
}
.hr-ticket-title {
    font-size: .925rem;
    font-weight: 600;
    color: #111318;
}
.hr-ticket-id {
    font-family: 'DM Mono', monospace;
    font-size: .72rem;
    color: #242525;
    background: #F3F4F6;
    padding: 2px 7px;
    border-radius: 5px;
    white-space: nowrap;
}
.hr-ticket-desc {
    font-size: .8rem;
    color: #323335;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.hr-ticket-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

/* raised by pill */
.hr-raised-by {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: .72rem;
    font-weight: 600;
    background: #F5F3FF;
    color: #5B21B6;
}

/* chips */
.hr-chip {
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
.hr-badge {
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
.badge-closed     { background: #e6e7e9; color: #2a2b2c; }

/* reply count bubble */
.hr-reply-count {
    font-size: .7rem;
    background: #EEF2FF;
    color: #4338CA;
    border-radius: 99px;
    padding: 2px 8px;
    font-weight: 700;
}

/* unassigned badge */
.hr-unassigned {
    font-size: .7rem;
    background: #FFF7ED;
    color: #C2410C;
    border-radius: 99px;
    padding: 2px 8px;
    font-weight: 700;
}

/* empty */
.hr-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: #9CA3AF;
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E8EBF0;
}
.hr-empty-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}

/* skeleton */
.hr-skeleton {
    background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Modal shared ── */
.hr-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
}
.hr-modal {
    background: #fff;
    border-radius: 18px;
    width: 100%;
    max-width: 680px;
    max-height: 92vh;
    overflow-y: auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 0;
}
.hr-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 22px;
}
.hr-modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111318;
    line-height: 1.3;
    padding-right: 12px;
}
.hr-close-btn {
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
.hr-close-btn:hover { background: #E5E7EB; }

/* thread meta */
.hr-thread-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #F3F4F6;
}

/* ── HR Controls Panel ── */
.hr-controls {
    background: #F9FAFB;
    border: 1px solid #E8EBF0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.hr-controls-title {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #9CA3AF;
    margin-bottom: 2px;
}
.hr-controls-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
@media(max-width:480px){ .hr-controls-row { grid-template-columns: 1fr; } }

.hr-ctrl-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.hr-ctrl-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #6B7280;
}
.hr-ctrl-select {
    padding: 8px 10px;
    border: 1.5px solid #E8EBF0;
    border-radius: 8px;
    font-size: .82rem;
    font-family: inherit;
    color: #374151;
    outline: none;
    cursor: pointer;
    background: #fff;
    transition: border .15s;
}
.hr-ctrl-select:focus { border-color: #6366F1; }

.hr-ctrl-btn {
    padding: 9px 16px;
    background: #6366F1;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: .82rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    align-self: flex-end;
    white-space: nowrap;
}
.hr-ctrl-btn:hover:not(:disabled) { background: #4F46E5; }
.hr-ctrl-btn:disabled { opacity: .55; cursor: not-allowed; }

/* description block */
.hr-desc-block {
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

/* replies */
.hr-replies {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    max-height: 280px;
    overflow-y: auto;
    padding-right: 4px;
}
.hr-replies::-webkit-scrollbar { width: 4px; }
.hr-replies::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }

.hr-reply-bubble {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}
.hr-reply-bubble.staff { flex-direction: row-reverse; }

.hr-bubble-avatar {
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
.hr-bubble-content { max-width: 75%; }
.hr-bubble-name {
    font-size: .7rem;
    color: #9CA3AF;
    margin-bottom: 4px;
    font-weight: 500;
}
.hr-reply-bubble.staff .hr-bubble-name { text-align: right; }
.hr-bubble-text {
    background: #F3F4F6;
    padding: 10px 14px;
    border-radius: 12px 12px 12px 4px;
    font-size: .85rem;
    color: #374151;
    line-height: 1.5;
    word-break: break-word;
}
.hr-reply-bubble.staff .hr-bubble-text {
    background: #6366F1;
    color: #fff;
    border-radius: 12px 12px 4px 12px;
}
.hr-bubble-time {
    font-size: .65rem;
    color: #D1D5DB;
    margin-top: 4px;
    font-family: 'DM Mono', monospace;
}
.hr-reply-bubble.staff .hr-bubble-time { text-align: right; }

.hr-no-replies {
    text-align: center;
    padding: 2rem;
    color: #9CA3AF;
    font-size: .82rem;
    background: #F9FAFB;
    border-radius: 10px;
}

/* reply input */
.hr-reply-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    border-top: 1px solid #F3F4F6;
    padding-top: 16px;
}
.hr-reply-input {
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
.hr-reply-input:focus { border-color: #6366F1; }
.hr-send-btn {
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
.hr-send-btn:hover:not(:disabled) { background: #4F46E5; }
.hr-send-btn:disabled { opacity: .45; cursor: not-allowed; }

/* danger btn */
.hr-danger-btn {
    padding: 8px 16px;
    background: #FFF1F2;
    color: #BE123C;
    border: 1.5px solid #FECDD3;
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
.hr-danger-btn:hover { background: #FFE4E6; }

/* form */
.hr-label {
    font-size: .75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #6B7280;
}
.hr-input {
    padding: 10px 12px;
    border: 1.5px solid #E8EBF0;
    border-radius: 10px;
    font-size: .875rem;
    font-family: inherit;
    color: #374151;
    outline: none;
    transition: border .15s;
}
.hr-input:focus { border-color: #6366F1; }

/* toast */
.hr-toast {
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

const toUrl = (path) =>
    !path ? "" : path.startsWith("http") ? path : `${BASE_URL}/${path.replace(/^\//, "")}`;

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
    return <span className={`hr-badge ${cls}`}>{label}</span>;
};

const priorityChip = (p) => {
    const map = {
        low: { cls: "chip-green", label: "Low" },
        medium: { cls: "chip-amber", label: "Medium" },
        high: { cls: "chip-red", label: "High" },
        critical: { cls: "chip-red", label: "⚠ Critical" },
    };
    const { cls, label } = map[p] || map.medium;
    return <span className={`hr-chip ${cls}`}><Icon d={icons.flag} size={11} />{label}</span>;
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
    return <span className={`hr-chip ${cls}`}>{label}</span>;
};

const iconBg = { it: "#EFF6FF", hr: "#EEF2FF", admin: "#F3F4F6", payroll: "#F0FDF4", attendance: "#FFFBEB", other: "#F3F4F6" };
const iconColor = { it: "#3B82F6", hr: "#6366F1", admin: "#6B7280", payroll: "#22C55E", attendance: "#F59E0B", other: "#9CA3AF" };

/* ─── HR Thread Modal ────────────────────────────────────────────────────── */
const HRThreadModal = ({ ticket: initialTicket, onClose, onUpdate, onDelete, hrStaffList }) => {
    const [ticket, setTicket] = useState(initialTicket);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // local editable controls
    const [newStatus, setNewStatus] = useState(initialTicket.status);
    const [newAssignee, setNewAssignee] = useState(initialTicket.assignedTo?._id || initialTicket.assignedTo || "");

    const repliesEndRef = useRef(null);

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

    const handleSaveControls = async () => {
        try {
            setSaving(true);
            const body = { status: newStatus };
            if (newAssignee) body.assignedTo = newAssignee;
            else body.assignedTo = null;

            const res = await API.put(`/tickets/${ticket._id}/status`, body);
            setTicket(res.data.ticket);
            onUpdate(res.data.ticket);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update ticket");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Permanently delete this ticket? This cannot be undone.")) return;
        try {
            setDeleting(true);
            await API.delete(`/tickets/${ticket._id}`);
            onDelete(ticket._id);
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete ticket");
        } finally {
            setDeleting(false);
        }
    };

    const isClosed = ticket.status === "closed";
    const isDirty =
        newStatus !== ticket.status ||
        (newAssignee || "") !== (ticket.assignedTo?._id || ticket.assignedTo || "");

    return (
        <div className="hr-backdrop" onClick={onClose}>
            <style>
                {`/* ── Spinner ── */
            .spinner {
                width: 14px; height: 14px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                display: inline-block;
                animation: spin 0.6s linear infinite;
                margin-right: 6px;
            }`}
            </style>
            <div className="hr-modal" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="hr-modal-header">
                    <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: ".72rem", color: "#4B5563", fontWeight: 600, marginBottom: 4 }}>
                            {ticket.ticketId}
                        </div>
                        <div className="hr-modal-title">{ticket.title}</div>
                    </div>
                    <button className="hr-close-btn" onClick={onClose}>
                        <Icon d={icons.close} size={16} />
                    </button>
                </div>

                {/* Meta */}
                <div className="hr-thread-meta">
                    {statusBadge(ticket.status)}
                    {priorityChip(ticket.priority)}
                    {categoryChip(ticket.category)}
                    <span className="hr-chip chip-gray">
                        <Icon d={icons.calendar} size={11} />
                        {formatDate(ticket.createdAt)}
                    </span>
                    {ticket.user && (
                        <span className="hr-raised-by">
                            <Icon d={icons.user} size={11} />
                            {ticket.user.name}
                            {ticket.user.employeeId && (
                                <span style={{ opacity: .85, fontWeight: 600 }}>· {ticket.user.employeeId}</span>
                            )}
                        </span>
                    )}
                    {ticket.assignedTo && (
                        <span className="hr-chip chip-purple">
                            <Icon d={icons.assign} size={11} />
                            {ticket.assignedTo.name}
                        </span>
                    )}
                </div>

                {/* Description */}
                <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "#374151", marginBottom: 8 }}>
                    Description
                </div>
                <div className="hr-desc-block">{ticket.description}</div>


                {/* Attachments */}
                {ticket.attachments?.length > 0 && (
                    <>
                        <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "#374151", marginBottom: 8 }}>
                            Attachments ({ticket.attachments.length})
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                            {ticket.attachments.map((att, i) => (
                                <a
                                    key={i}
                                    href={toUrl(att.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: "block", width: 80, height: 80,
                                        borderRadius: 8, overflow: "hidden",
                                        border: "1px solid #E8EBF0", flexShrink: 0,
                                        transition: "transform .15s",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.04)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    <img
                                        src={toUrl(att.url)}
                                        alt={att.originalName}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                </a>
                            ))}
                        </div>
                    </>
                )}

                {/* ── HR Controls ── */}
                <div className="hr-controls">
                    <div className="hr-controls-title" style={{ color: "#4B5563" }}>HR Actions</div>
                    <div className="hr-controls-row">
                        {/* Status */}
                        <div className="hr-ctrl-group">
                            <div className="hr-ctrl-label" style={{ color: "#374151" }}>Status</div>
                            <select
                                className="hr-ctrl-select"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <div className="hr-ctrl-group">
                            <div className="hr-ctrl-label" style={{ color: "#374151" }}>Assign To</div>
                            <select
                                className="hr-ctrl-select"
                                value={newAssignee}
                                onChange={(e) => setNewAssignee(e.target.value)}
                            >
                                <option value="">— Unassigned —</option>
                                {hrStaffList.map((staff) => (
                                    <option key={staff._id} value={staff._id}>
                                        {staff.name} ({staff.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                        <button
                            className="hr-danger-btn"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            <Icon d={icons.trash} size={13} />
                            {deleting ? "Deleting…" : "Delete ticket"}
                        </button>

                        <button
                            className="hr-ctrl-btn"
                            onClick={handleSaveControls}
                            disabled={saving || !isDirty}
                        >
                            {saving ? (<><span className="spinner" /> Saving...</>) : ("Save changes")}
                        </button>
                    </div>
                </div>

                {/* Resolved info */}
                {ticket.status === "resolved" && ticket.resolvedAt && (
                    <div style={{
                        background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8,
                        padding: "10px 14px", fontSize: ".8rem", color: "#15803D",
                        display: "flex", alignItems: "center", gap: 6, marginBottom: 16,
                        fontWeight: 600,
                    }}>
                        <Icon d={icons.check} size={14} color="#15803D" />
                        Resolved on {formatDate(ticket.resolvedAt)}
                        {ticket.resolvedBy?.name && ` by ${ticket.resolvedBy.name}`}
                    </div>
                )}

                {/* Conversation */}
                <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "#374151", marginBottom: 10 }}>
                    Conversation ({ticket.replies?.length || 0})
                </div>

                <div className="hr-replies" style={{ minHeight: 160, overflowY: "auto" }}>
                    {(!ticket.replies || ticket.replies.length === 0) && (
                        <div className="hr-no-replies" style={{ color: "#6B7280", fontWeight: 600 }}>No replies yet.</div>
                    )}
                    {ticket.replies?.map((r) => {
                        const isStaff = r.isStaff;
                        const name = r.sentBy?.name || "Unknown";
                        const bg = isStaff ? "#6366F1" : "#6B7280";
                        return (
                            <div key={r._id} className={`hr-reply-bubble ${isStaff ? "staff" : ""}`}>
                                <div className="hr-bubble-avatar" style={{ background: bg }}>
                                    {initials(name)}
                                </div>
                                <div className="hr-bubble-content">
                                    <div className="hr-bubble-name" style={{ color: "#374151", fontWeight: 600 }}>
                                        {name}
                                        {isStaff && (
                                            <span style={{ marginLeft: 5, background: "#EEF2FF", color: "#4338CA", padding: "1px 5px", borderRadius: 4, fontSize: ".65rem", fontWeight: 700 }}>
                                                Staff
                                            </span>
                                        )}
                                    </div>
                                    <div className="hr-bubble-text">{r.message}</div>
                                    <div className="hr-bubble-time" style={{ color: "#6B7280" }}>{timeAgo(r.createdAt)}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={repliesEndRef} />
                </div>

                {/* Reply input */}
                {isClosed ? (
                    <div style={{
                        textAlign: "center", padding: "14px", background: "#F3F4F6",
                        borderRadius: 10, color: "#4B5563", fontSize: ".82rem", fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        borderTop: "1px solid #E5E7EB", paddingTop: 16, marginTop: 4,
                    }}>
                        <Icon d={icons.lock} size={14} color="#4B5563" /> This ticket is closed
                    </div>
                ) : (
                    <div className="hr-reply-row">
                        <textarea
                            className="hr-reply-input"
                            placeholder="Reply as staff… (Enter to send)"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button
                            className="hr-send-btn"
                            onClick={handleSendReply}
                            disabled={sending || !reply.trim()}
                        >
                            <Icon d={icons.send} size={15} color="#fff" />
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};

/* ─── Skeleton Row ───────────────────────────────────────────────────────── */
const SkeletonRow = () => (
    <div className="hr-ticket-row" style={{ cursor: "default", pointerEvents: "none" }}>
        <div className="hr-skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
            <div className="hr-skeleton" style={{ height: 14, width: "55%", marginBottom: 8 }} />
            <div className="hr-skeleton" style={{ height: 12, width: "80%", marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8 }}>
                <div className="hr-skeleton" style={{ height: 20, width: 60 }} />
                <div className="hr-skeleton" style={{ height: 20, width: 60 }} />
                <div className="hr-skeleton" style={{ height: 20, width: 80 }} />
            </div>
        </div>
    </div>
);

/* ─── Main HR Helpdesk Component ─────────────────────────────────────────── */
const HRHelpdesk = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [hrStaffList, setHrStaffList] = useState([]);

    // filters
    const [statusFilter, setStatus] = useState("all");
    const [categoryFilter, setCat] = useState("all");
    const [priorityFilter, setPriority] = useState("all");
    const [search, setSearch] = useState("");

    const [toast, setToast] = useState("");

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    // Fetch all tickets
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (categoryFilter !== "all") params.append("category", categoryFilter);
            if (priorityFilter !== "all") params.append("priority", priorityFilter);
            const res = await API.get(`/tickets?${params.toString()}`);
            setTickets(res.data.tickets || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const res = await API.get("/tickets/stats");
            setStats(res.data.stats);
        } catch { /* silent */ }
        finally { setStatsLoading(false); }
    };

    // Fetch HR/manager staff list for assignment dropdown
    // Adjust the endpoint to whatever returns your staff users
    const fetchStaff = async () => {
        try {
            const res = await API.get("/users?roles=hr,manager,tl,superadmin");
            setHrStaffList(res.data.users || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, categoryFilter, priorityFilter]);

    useEffect(() => {
        fetchStats();
        fetchStaff();
    }, []);

    const handleUpdate = (updated) => {
        setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        fetchStats(); // refresh stats after status change
        showToast("Ticket updated");
    };

    const handleDelete = (id) => {
        setTickets((prev) => prev.filter((t) => t._id !== id));
        fetchStats();
        showToast("Ticket deleted");
    };

    // client-side search
    const filtered = useMemo(() =>
        tickets.filter((t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.ticketId?.toLowerCase().includes(search.toLowerCase()) ||
            t.user?.name?.toLowerCase().includes(search.toLowerCase())
        ),
        [tickets, search]);

    const statCards = [
        { label: "Total", value: stats?.total ?? "—", color: "blue" },
        { label: "Open", value: stats?.open ?? "—", color: "amber" },
        { label: "In Progress", value: stats?.inProgress ?? "—", color: "purple" },
        { label: "Resolved", value: stats?.resolved ?? "—", color: "green" },
        { label: "Closed", value: stats?.closed ?? "—", color: "gray" },
        { label: "Critical", value: stats?.critical ?? "—", color: "red" },
    ];

    return (
        <>
            <style>{css}</style>

            {toast && (
                <div className="hr-toast">
                    <Icon d={icons.check} size={14} color="#4ADE80" /> {toast}
                </div>
            )}

            <DashboardLayout>
                <div className="hr-root">

                    {/* Header */}
                    <div className="hr-header">
                        <div>
                            <h1>Helpdesk Management</h1>
                            <p>Manage, assign and resolve employee tickets</p>
                        </div>
                        <button
                            onClick={() => { fetchTickets(); fetchStats(); }}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "8px 14px", borderRadius: 8,
                                border: "1.5px solid #a1a5aa", background: "#fff",
                                fontSize: ".82rem", color: "#4f5155",
                                cursor: "pointer", fontFamily: "inherit",
                            }}
                        >
                            <Icon d={icons.refresh} size={14} /> Refresh
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="hr-stats">
                        {statCards.map((s) => (
                            <div key={s.label} className={`hr-stat ${s.color}`}>
                                <div className="hr-stat-label">{s.label}</div>
                                <div className="hr-stat-val">{statsLoading ? "—" : s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="hr-filters">
                        <Icon d={icons.filter} size={15} color="#5d5e61" />

                        <input
                            className="hr-search"
                            placeholder="Search by title, employee or ID…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select className="hr-select" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
                            <option value="all">All status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>

                        <select className="hr-select" value={categoryFilter} onChange={(e) => setCat(e.target.value)}>
                            <option value="all">All categories</option>
                            <option value="it">IT</option>
                            <option value="hr">HR</option>
                            <option value="admin">Admin</option>
                            <option value="payroll">Payroll</option>
                            <option value="attendance">Attendance</option>
                            <option value="other">Other</option>
                        </select>

                        <select className="hr-select" value={priorityFilter} onChange={(e) => setPriority(e.target.value)}>
                            <option value="all">All priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>

                        {(statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all" || search) && (
                            <button
                                onClick={() => { setStatus("all"); setCat("all"); setPriority("all"); setSearch(""); }}
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
                    </div>

                    {/* Ticket count */}
                    {!loading && (
                        <div style={{ fontSize: ".8rem", color: "#444547", marginBottom: 12 }}>
                            Showing {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
                        </div>
                    )}

                    {/* Ticket list */}
                    <div className="hr-list">
                        {loading && <StopwatchLoader />}

                        {!loading && filtered.length === 0 && (
                            <div className="hr-empty">
                                <div className="hr-empty-icon">
                                    <Icon d={icons.inbox} size={24} color="#9CA3AF" />
                                </div>
                                <p style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>No tickets found</p>
                                <p style={{ fontSize: ".82rem" }}>
                                    {search || statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "No tickets have been raised yet"}
                                </p>
                            </div>
                        )}

                        {!loading && filtered.map((ticket) => (
                            <div
                                key={ticket._id}
                                className={`hr-ticket-row priority-${ticket.priority}`}
                                onClick={() => setSelected(ticket)}
                            >
                                {/* Icon */}
                                <div
                                    className="hr-ticket-icon"
                                    style={{ background: iconBg[ticket.category] || "#F3F4F6" }}
                                >
                                    <Icon
                                        d={icons.ticket}
                                        size={18}
                                        color={iconColor[ticket.category] || "#9CA3AF"}
                                    />
                                </div>

                                {/* Body */}
                                <div className="hr-ticket-body">
                                    <div className="hr-ticket-top">
                                        <div className="hr-ticket-title">{ticket.title}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                            <span className="hr-ticket-id">{ticket.ticketId}</span>
                                            {statusBadge(ticket.status)}
                                        </div>
                                    </div>

                                    <div className="hr-ticket-desc">{ticket.description}</div>

                                    <div className="hr-ticket-meta">
                                        {/* Raised by */}
                                        {ticket.user && (
                                            <span className="hr-raised-by">
                                                <Icon d={icons.user} size={11} />
                                                {ticket.user.name}
                                            </span>
                                        )}

                                        {categoryChip(ticket.category)}
                                        {priorityChip(ticket.priority)}

                                        <span className="hr-chip chip-gray">
                                            <Icon d={icons.calendar} size={11} />
                                            {formatDate(ticket.createdAt)}
                                        </span>

                                        {ticket.replies?.length > 0 && (
                                            <span className="hr-reply-count">
                                                {ticket.replies.length} {ticket.replies.length === 1 ? "reply" : "replies"}
                                            </span>
                                        )}

                                        {ticket.assignedTo ? (
                                            <span className="hr-chip chip-purple">
                                                <Icon d={icons.user} size={11} />
                                                {ticket.assignedTo.name}
                                            </span>
                                        ) : (
                                            <span className="hr-unassigned">Unassigned</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* HR Thread Modal */}
                {selected && (
                    <HRThreadModal
                        ticket={selected}
                        onClose={() => setSelected(null)}
                        onUpdate={(updated) => {
                            handleUpdate(updated);
                            setSelected(updated);
                        }}
                        onDelete={handleDelete}
                        hrStaffList={hrStaffList}
                    />
                )}
            </DashboardLayout>
        </>
    );
};

export default HRHelpdesk;