import { useEffect, useState, useMemo, useCallback } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ─── Auth helper ────────────────────────────────────────────────────────────
   Reads the logged-in user from wherever your app stores it.
   Adjust the import / key to match your auth setup.
   Expected shape: { _id, name, email, role, department }
──────────────────────────────────────────────────────────────────────────── */
const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

/* ─── User Icon (SVG person silhouette) ─────────────────────────────────── */
const UserIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const icons = {
    task: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    check: "M20 6L9 17l-5-5",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    close: "M18 6L6 18M6 6l12 12",
    report: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
    alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
    plus: "M12 5v14M5 12h14",
    trash: "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
    building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const css = `
.tk-root * { box-sizing: border-box; margin: 0; padding: 0; }
.tk-root {
    font-family: 'DM Sans', sans-serif;
    background: #F0F2F7;
    color: #111318;
    min-height: 100vh;
}

/* header */
.tk-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
}
.tk-header h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -.5px; color: #0A0C10; }
.tk-header p  { font-size: .825rem; color: #4B5563; margin-top: 2px; }

/* ── Tabs ── */
.tk-tabs {
    display: flex;
    gap: 4px;
    background: #D8DCE8;
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 22px;
    width: fit-content;
}
.tk-tab {
    padding: 7px 18px;
    border-radius: 7px;
    border: none;
    background: transparent;
    font-size: .82rem;
    font-weight: 600;
    font-family: inherit;
    color: #374151;
    cursor: pointer;
    transition: all .15s;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}
.tk-tab:hover:not(.active) { background: rgba(255,255,255,.6); color: #111318; }
.tk-tab.active {
    background: #fff;
    color: #4338CA;
    box-shadow: 0 1px 4px rgba(0,0,0,.15);
}

/* stat cards */
.tk-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
}
@media(max-width:900px){ .tk-stats { grid-template-columns: repeat(2,1fr); } }
@media(max-width:480px){ .tk-stats { grid-template-columns: 1fr; } }

.tk-stat {
    background: #fff;
    border-radius: 14px;
    padding: 18px 20px;
    border: 1.5px solid #C8CDD8;
    position: relative;
    overflow: hidden;
}
.tk-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
}
.tk-stat.blue::before   { background: linear-gradient(90deg,#60A5FA,#3B82F6); }
.tk-stat.amber::before  { background: linear-gradient(90deg,#FCD34D,#F59E0B); }
.tk-stat.green::before  { background: linear-gradient(90deg,#4ADE80,#22C55E); }
.tk-stat.red::before    { background: linear-gradient(90deg,#F87171,#EF4444); }

.tk-stat-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #4B5563;
    margin-bottom: 8px;
}
.tk-stat-val {
    font-size: 2.2rem;
    font-weight: 700;
    letter-spacing: -1.5px;
    color: #0A0C10;
    line-height: 1;
}

/* filters bar */
.tk-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
}
.tk-select {
    padding: 7px 12px;
    border-radius: 8px;
    border: 1.5px solid #B0B7C6;
    background: #fff;
    font-size: .82rem;
    font-family: inherit;
    color: #111318;
    cursor: pointer;
    outline: none;
    transition: border .15s;
}
.tk-select:focus { border-color: #4338CA; }
.tk-search {
    padding: 7px 12px;
    border-radius: 8px;
    border: 1.5px solid #B0B7C6;
    background: #fff;
    font-size: .82rem;
    font-family: inherit;
    color: #111318;
    outline: none;
    min-width: 200px;
    transition: border .15s;
}
.tk-search:focus { border-color: #4338CA; }

/* add task button */
.tk-add-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #4338CA;
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: .85rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    white-space: nowrap;
}
.tk-add-btn:hover { background: #3730A3; }

/* task grid */
.tk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.tk-card {
    background: #fff;
    border-radius: 14px;
    border: 1.5px solid #C8CDD8;
    padding: 20px;
    cursor: pointer;
    transition: all .18s;
    position: relative;
    overflow: hidden;
}
.tk-card:hover {
    border-color: #6366F1;
    box-shadow: 0 4px 20px rgba(67,56,202,.1);
    transform: translateY(-1px);
}
.tk-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    border-radius: 14px 0 0 14px;
}
.tk-card.priority-high::before   { background: #EF4444; }
.tk-card.priority-medium::before { background: #F59E0B; }
.tk-card.priority-low::before    { background: #22C55E; }

.tk-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
    gap: 8px;
}
.tk-card-title {
    font-size: .925rem;
    font-weight: 600;
    color: #0A0C10;
    line-height: 1.35;
}
.tk-card-desc {
    font-size: .8rem;
    color: #374151;
    line-height: 1.5;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.tk-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
}
.tk-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: .72rem;
    font-weight: 600;
    border: 1px solid transparent;
}
.chip-blue   { background: #DBEAFE; color: #1E3A8A; border-color: #BFDBFE; }
.chip-amber  { background: #FEF3C7; color: #78350F; border-color: #FDE68A; }
.chip-green  { background: #DCFCE7; color: #14532D; border-color: #BBF7D0; }
.chip-red    { background: #FEE2E2; color: #7F1D1D; border-color: #FECACA; }
.chip-gray   { background: #E5E7EB; color: #1F2937; border-color: #D1D5DB; }
.chip-purple { background: #E0E7FF; color: #312E81; border-color: #C7D2FE; }
.chip-teal   { background: #CCFBF1; color: #134E4A; border-color: #99F6E4; }

.tk-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 99px;
    font-size: .72rem;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid transparent;
}
.badge-pending    { background: #FEF3C7; color: #78350F; border-color: #FDE68A; }
.badge-inprogress { background: #DBEAFE; color: #1E3A8A; border-color: #BFDBFE; }
.badge-done       { background: #DCFCE7; color: #14532D; border-color: #BBF7D0; }
.badge-overdue    { background: #FEE2E2; color: #7F1D1D; border-color: #FECACA; }

.tk-card.overdue { border-color: #FCA5A5; }

.tk-assignee {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: .78rem;
    color: #374151;
    font-weight: 500;
}

/* Avatar uses SVG icon instead of initials/emoji */
.tk-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: #E0E7FF;
    border: 1.5px solid #A5B4FC;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #3730A3;
}
.tk-avatar.avatar-cyan {
    background: #CFFAFE;
    border-color: #67E8F9;
    color: #164E63;
}

.tk-due {
    font-size: .75rem;
    font-family: 'DM Mono', monospace;
    color: #4B5563;
    display: flex;
    align-items: center;
    gap: 4px;
}
.tk-due.overdue { color: #B91C1C; font-weight: 600; }

/* card action buttons (TL/HR view) */
.tk-card-actions {
    display: flex;
    gap: 6px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1.5px solid #E5E7EB;
}
.tk-action-btn {
    flex: 1;
    padding: 6px 10px;
    border-radius: 7px;
    border: 1.5px solid #C8CDD8;
    background: #F9FAFB;
    font-size: .76rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: all .15s;
    color: #1F2937;
}
.tk-action-btn:hover { background: #F3F4F6; border-color: #9CA3AF; }
.tk-action-btn.danger { color: #991B1B; border-color: #FECACA; }
.tk-action-btn.danger:hover { background: #FEE2E2; border-color: #FCA5A5; }
.tk-action-btn.primary { color: #3730A3; border-color: #C7D2FE; }
.tk-action-btn.primary:hover { background: #E0E7FF; border-color: #A5B4FC; }

/* dept breakdown table */
.tk-dept-table {
    background: #fff;
    border-radius: 14px;
    border: 1.5px solid #C8CDD8;
    overflow: hidden;
    margin-bottom: 24px;
}
.tk-dept-table-header {
    padding: 16px 20px;
    border-bottom: 1.5px solid #D1D5DB;
    display: flex;
    align-items: center;
    gap: 8px;
}
.tk-dept-table-header h3 {
    font-size: .9rem;
    font-weight: 700;
    color: #0A0C10;
}
.tk-dept-row {
    display: grid;
    grid-template-columns: 1fr 80px 80px 80px 80px;
    padding: 12px 20px;
    border-bottom: 1px solid #E5E7EB;
    align-items: center;
    font-size: .83rem;
    transition: background .12s;
    cursor: pointer;
}
.tk-dept-row:last-child { border-bottom: none; }
.tk-dept-row:hover { background: #F9FAFB; }
.tk-dept-row.header-row {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: #4B5563;
    cursor: default;
    background: #F3F4F6;
}
.tk-dept-row.header-row:hover { background: #F3F4F6; }
.tk-dept-name { font-weight: 600; color: #0A0C10; }
.tk-dept-num  { text-align: center; color: #1F2937; }

/* empty state */
.tk-empty {
    grid-column: 1/-1;
    text-align: center;
    padding: 4rem 2rem;
    color: #4B5563;
}
.tk-empty-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: #E5E7EB;
    border: 1.5px solid #D1D5DB;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #374151;
}

/* ── Modal ── */
.tk-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
}
.tk-modal {
    background: #fff;
    border-radius: 18px;
    border: 1.5px solid #C8CDD8;
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 28px;
    position: relative;
}
.tk-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}
.tk-modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0A0C10;
    line-height: 1.3;
    padding-right: 12px;
}
.tk-close {
    background: #F3F4F6;
    border: 1.5px solid #D1D5DB;
    cursor: pointer;
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #374151;
    transition: background .15s;
}
.tk-close:hover { background: #E5E7EB; border-color: #9CA3AF; }
.tk-modal-section { margin-bottom: 18px; }
.tk-modal-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #4B5563;
    margin-bottom: 6px;
}
.tk-modal-value {
    font-size: .9rem;
    color: #1F2937;
    font-weight: 500;
    line-height: 1.5;
}
.tk-status-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.tk-status-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1.5px solid #C8CDD8;
    background: #F9FAFB;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all .15s;
    color: #1F2937;
}
.tk-status-btn.active-pending    { background: #FEF3C7; color: #78350F; border-color: #FDE68A; }
.tk-status-btn.active-inprogress { background: #DBEAFE; color: #1E3A8A; border-color: #BFDBFE; }
.tk-status-btn.active-done       { background: #DCFCE7; color: #14532D; border-color: #BBF7D0; }
.tk-status-btn:hover:not(.active-pending):not(.active-inprogress):not(.active-done) {
    border-color: #9CA3AF; background: #F3F4F6; color: #111318;
}
.tk-input {
    width: 100%;
    border: 1.5px solid #B0B7C6;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: .875rem;
    font-family: inherit;
    color: #111318;
    outline: none;
    transition: border .15s;
    background: #fff;
}
.tk-input:focus { border-color: #4338CA; }
.tk-textarea {
    width: 100%;
    border: 1.5px solid #B0B7C6;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: .875rem;
    font-family: inherit;
    color: #111318;
    resize: vertical;
    min-height: 80px;
    outline: none;
    transition: border .15s;
    line-height: 1.5;
    background: #fff;
}
.tk-textarea:focus { border-color: #4338CA; }
.tk-save-btn {
    width: 100%;
    padding: 11px;
    background: #4338CA;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    margin-top: 4px;
}
.tk-save-btn:hover:not(:disabled) { background: #3730A3; }
.tk-save-btn:disabled { opacity: .55; cursor: not-allowed; }
.tk-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.tk-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tk-tag {
    padding: 3px 9px;
    background: #E0E7FF;
    color: #312E81;
    border: 1px solid #C7D2FE;
    border-radius: 6px;
    font-size: .72rem;
    font-weight: 600;
}
.tk-divider { border: none; border-top: 1.5px solid #E5E7EB; margin: 16px 0; }

/* confirm modal */
.tk-confirm-modal { max-width: 380px; }
.tk-confirm-text { font-size: .9rem; color: #1F2937; line-height: 1.6; margin-bottom: 20px; }
.tk-confirm-btns { display: flex; gap: 10px; }
.tk-cancel-btn {
    flex: 1;
    padding: 10px;
    background: #F3F4F6;
    color: #1F2937;
    border: 1.5px solid #D1D5DB;
    border-radius: 9px;
    font-size: .88rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
}
.tk-cancel-btn:hover { background: #E5E7EB; border-color: #9CA3AF; }
.tk-danger-btn {
    flex: 1;
    padding: 10px;
    background: #EF4444;
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: .88rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
}
.tk-danger-btn:hover:not(:disabled) { background: #DC2626; }
.tk-danger-btn:disabled { opacity: .55; cursor: not-allowed; }

/* loading skeleton */
.tk-skeleton {
    background: linear-gradient(90deg, #E5E7EB 25%, #D1D5DB 50%, #E5E7EB 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* toast */
@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

/* spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    display: inline-block;
    animation: spin 0.6s linear infinite;
    margin-right: 6px;
}
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const priorityChip = (p) => {
    const map = {
        high: { cls: "chip-red", label: "High" },
        medium: { cls: "chip-amber", label: "Medium" },
        low: { cls: "chip-green", label: "Low" },
    };
    const { cls, label } = map[p] || map.medium;
    return <span className={`tk-chip ${cls}`}><Icon d={icons.flag} size={11} />{label}</span>;
};

const statusBadge = (status, overdueFlag) => {
    if (overdueFlag && status !== "done") {
        return <span className="tk-badge badge-overdue"><Icon d={icons.alert} size={11} />Overdue</span>;
    }
    const map = {
        pending: { cls: "badge-pending", label: "Pending" },
        "in-progress": { cls: "badge-inprogress", label: "In Progress" },
        done: { cls: "badge-done", label: "Done" },
    };
    const { cls, label } = map[status] || map.pending;
    return <span className={`tk-badge ${cls}`}>{label}</span>;
};

const isOverdue = (task) =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

const formatDue = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
};

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="tk-card" style={{ cursor: "default", pointerEvents: "none" }}>
        <div className="tk-skeleton" style={{ height: 16, width: "70%", marginBottom: 10 }} />
        <div className="tk-skeleton" style={{ height: 12, width: "100%", marginBottom: 6 }} />
        <div className="tk-skeleton" style={{ height: 12, width: "60%", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 8 }}>
            <div className="tk-skeleton" style={{ height: 22, width: 64 }} />
            <div className="tk-skeleton" style={{ height: 22, width: 64 }} />
        </div>
    </div>
);

/* ─── Employee: View / Update Status Modal ───────────────────────────────── */
const ViewTaskModal = ({ task, onClose, onSave }) => {
    const [status, setStatus] = useState(task.status);
    const [report, setReport] = useState(task.workReport || "");
    const [saving, setSaving] = useState(false);
    const [changed, setChanged] = useState(false);

    const overdueFlag = isOverdue(task);
    const statusKeys = ["pending", "in-progress", "done"];
    const statusLabel = { pending: "Pending", "in-progress": "In Progress", done: "Done" };
    const statusActiveClass = {
        pending: "active-pending", "in-progress": "active-inprogress", done: "active-done",
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await onSave(task._id, { status, workReport: report });
            onClose();
        } catch { /* parent handles */ }
        finally { setSaving(false); }
    };

    return (
        <div className="tk-backdrop" onClick={onClose}>
            <div className="tk-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tk-modal-header">
                    <div className="tk-modal-title">{task.title}</div>
                    <button className="tk-close" onClick={onClose}><Icon d={icons.close} size={16} /></button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                    {statusBadge(task.status, overdueFlag)}
                    {priorityChip(task.priority)}
                    {task.tags?.map((t) => <span key={t} className="tk-tag">{t}</span>)}
                </div>

                {task.description && (
                    <div className="tk-modal-section">
                        <div className="tk-modal-label">Description</div>
                        <div className="tk-modal-value" style={{ whiteSpace: "pre-wrap" }}>{task.description}</div>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", marginBottom: 18 }}>
                    <div>
                        <div className="tk-modal-label">Assigned by</div>
                        <div className="tk-assignee" style={{ marginTop: 4 }}>
                            <div className="tk-avatar">
                                <UserIcon size={15} />
                            </div>
                            <span style={{ color: "#1F2937", fontWeight: 500 }}>{task.assignedBy?.name || "—"}</span>
                        </div>
                    </div>
                    <div>
                        <div className="tk-modal-label">Due date</div>
                        <div className={`tk-due ${overdueFlag ? "overdue" : ""}`} style={{ marginTop: 6 }}>
                            <Icon d={icons.calendar} size={12} />
                            {task.dueDate ? formatDue(task.dueDate) : "No deadline"}
                        </div>
                    </div>
                    {task.completedAt && (
                        <div>
                            <div className="tk-modal-label">Completed at</div>
                            <div className="tk-due" style={{ marginTop: 6 }}>
                                <Icon d={icons.check} size={12} />{formatDue(task.completedAt)}
                            </div>
                        </div>
                    )}
                </div>

                <hr className="tk-divider" />

                <div className="tk-modal-section">
                    <div className="tk-modal-label">Update status</div>
                    <div className="tk-status-row">
                        {statusKeys.map((s) => (
                            <button
                                key={s}
                                className={`tk-status-btn ${status === s ? statusActiveClass[s] : ""}`}
                                onClick={() => { setStatus(s); setChanged(true); }}
                            >
                                {statusLabel[s]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="tk-modal-section">
                    <div className="tk-modal-label">Work report</div>
                    <textarea
                        className="tk-textarea"
                        placeholder="Describe what you've done on this task..."
                        value={report}
                        onChange={(e) => { setReport(e.target.value); setChanged(true); }}
                    />
                </div>

                {task.workReport && task.workReport !== report && (
                    <div className="tk-modal-section">
                        <div className="tk-modal-label">Previous report</div>
                        <div className="tk-modal-value" style={{
                            background: "#F3F4F6", border: "1px solid #D1D5DB",
                            padding: "10px 12px", borderRadius: 8,
                            fontSize: ".82rem", whiteSpace: "pre-wrap", color: "#1F2937",
                        }}>{task.workReport}</div>
                    </div>
                )}

                <button className="tk-save-btn" onClick={handleSave} disabled={saving || !changed}>
                    {saving ? <><span className="spinner" /> Saving...</> : "Save changes"}
                </button>
            </div>
        </div>
    );
};

/* ─── TL/HR: Create / Edit Task Modal ───────────────────────────────────────
   mode = "create" | "edit"
   members = array of users available to assign (dept-restricted for TL)
──────────────────────────────────────────────────────────────────────────── */
const TaskFormModal = ({ mode = "create", task = null, members = [], onClose, onSubmit }) => {
    const [form, setForm] = useState({
        title: task?.title || "",
        description: task?.description || "",
        assignedTo: task?.assignedTo?._id || task?.assignedTo || "",
        priority: task?.priority || "medium",
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
        tags: task?.tags?.join(", ") || "",
        status: task?.status || "pending",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError("Title is required."); return; }
        if (!form.assignedTo) { setError("Please select a team member."); return; }
        setError("");
        try {
            setSaving(true);
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                assignedTo: form.assignedTo,
                priority: form.priority,
                dueDate: form.dueDate || null,
                tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
                ...(mode === "edit" && { status: form.status }),
            };
            await onSubmit(payload);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save task.");
        } finally {
            setSaving(false);
        }
    };

    const statusKeys = ["pending", "in-progress", "done"];
    const statusLabel = { pending: "Pending", "in-progress": "In Progress", done: "Done" };
    const statusActiveClass = {
        pending: "active-pending", "in-progress": "active-inprogress", done: "active-done",
    };

    return (
        <div className="tk-backdrop" onClick={onClose}>
            <div className="tk-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tk-modal-header">
                    <div className="tk-modal-title">{mode === "create" ? "Create New Task" : "Edit Task"}</div>
                    <button className="tk-close" onClick={onClose}><Icon d={icons.close} size={16} /></button>
                </div>

                {error && (
                    <div style={{
                        background: "#FEE2E2", border: "1.5px solid #FECACA", borderRadius: 8,
                        padding: "10px 12px", fontSize: ".83rem", color: "#7F1D1D", marginBottom: 14,
                    }}>
                        {error}
                    </div>
                )}

                <div className="tk-modal-section">
                    <div className="tk-modal-label">Title *</div>
                    <input className="tk-input" placeholder="Task title" value={form.title} onChange={set("title")} />
                </div>

                <div className="tk-modal-section">
                    <div className="tk-modal-label">Description</div>
                    <textarea className="tk-textarea" placeholder="Describe the task..." value={form.description} onChange={set("description")} />
                </div>

                <div className="tk-form-row">
                    <div>
                        <div className="tk-modal-label">Assign to *</div>
                        <select className="tk-input" value={form.assignedTo} onChange={set("assignedTo")}>
                            <option value="">Select member</option>
                            {members.map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.name} {m.employeeId ? `(${m.employeeId})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="tk-modal-label">Priority</div>
                        <select className="tk-input" value={form.priority} onChange={set("priority")}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>

                <div className="tk-form-row">
                    <div>
                        <div className="tk-modal-label">Due date</div>
                        <input className="tk-input" type="date" value={form.dueDate} onChange={set("dueDate")} />
                    </div>
                    <div>
                        <div className="tk-modal-label">Tags (comma separated)</div>
                        <input className="tk-input" placeholder="design, frontend, urgent" value={form.tags} onChange={set("tags")} />
                    </div>
                </div>

                {mode === "edit" && (
                    <div className="tk-modal-section">
                        <div className="tk-modal-label">Status</div>
                        <div className="tk-status-row">
                            {statusKeys.map((s) => (
                                <button
                                    key={s}
                                    className={`tk-status-btn ${form.status === s ? statusActiveClass[s] : ""}`}
                                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                                >
                                    {statusLabel[s]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button className="tk-save-btn" onClick={handleSubmit} disabled={saving}>
                    {saving ? (<><span className="spinner" /> Saving...</>) : mode === "create" ? ("Create Task") : ("Update Task")}
                </button>
            </div>
        </div>
    );
};

/* ─── Confirm Delete Modal ───────────────────────────────────────────────── */
const ConfirmModal = ({ task, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);

    const handleConfirm = async () => {
        try {
            setDeleting(true);
            await onConfirm(task._id);
            onClose();
        } catch { /* parent handles */ }
        finally { setDeleting(false); }
    };

    return (
        <div className="tk-backdrop" onClick={onClose}>
            <div className="tk-modal tk-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tk-modal-header">
                    <div className="tk-modal-title">Delete Task</div>
                    <button className="tk-close" onClick={onClose}><Icon d={icons.close} size={16} /></button>
                </div>
                <p className="tk-confirm-text">
                    Are you sure you want to delete <strong>"{task.title}"</strong>?
                    This action cannot be undone.
                </p>
                <div className="tk-confirm-btns">
                    <button className="tk-cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="tk-danger-btn" onClick={handleConfirm} disabled={deleting}>
                        {deleting ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Shared: Task Card ──────────────────────────────────────────────────── */
const TaskCard = ({ task, canManage, onView, onEdit, onDelete }) => {
    const overdueFlag = isOverdue(task);

    return (
        <div
            className={`tk-card priority-${task.priority} ${overdueFlag ? "overdue" : ""}`}
            onClick={() => onView(task)}
        >
            <div className="tk-card-top">
                <div className="tk-card-title">{task.title}</div>
                {statusBadge(task.status, overdueFlag)}
            </div>

            {task.description && <div className="tk-card-desc">{task.description}</div>}

            <div className="tk-card-meta">
                {priorityChip(task.priority)}
                {task.dueDate && (
                    <span className={`tk-chip ${overdueFlag ? "chip-red" : "chip-gray"}`}>
                        <Icon d={icons.calendar} size={11} />{formatDue(task.dueDate)}
                    </span>
                )}
                {task.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="tk-chip chip-purple">
                        <Icon d={icons.tag} size={10} />{tag}
                    </span>
                ))}
                {task.tags?.length > 2 && (
                    <span className="tk-chip chip-gray">+{task.tags.length - 2}</span>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* show "assigned to" in manager views, "assigned by" in employee view */}
                {canManage ? (
                    <div className="tk-assignee">
                        <div className="tk-avatar avatar-cyan">
                            <UserIcon size={15} />
                        </div>
                        <span>{task.assignedTo?.name || "—"}</span>
                    </div>
                ) : (
                    <div className="tk-assignee">
                        <div className="tk-avatar">
                            <UserIcon size={15} />
                        </div>
                        <span>By {task.assignedBy?.name || "—"}</span>
                    </div>
                )}

                {task.workReport && (
                    <span className="tk-chip chip-blue" style={{ fontSize: ".68rem" }}>
                        <Icon d={icons.report} size={10} /> Report added
                    </span>
                )}
            </div>

            {/* Action buttons only for TL/HR views */}
            {canManage && (
                <div className="tk-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="tk-action-btn primary"
                        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    >
                        <Icon d={icons.edit} size={12} /> Edit
                    </button>
                    <button
                        className="tk-action-btn danger"
                        onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                    >
                        <Icon d={icons.trash} size={12} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─── HR: Department Overview Table ─────────────────────────────────────── */
const DeptOverviewTable = ({ deptBreakdown, onSelectDept }) => (
    <div className="tk-dept-table">
        <div className="tk-dept-table-header">
            <Icon d={icons.building} size={16} color="#4338CA" />
            <h3>Department Overview</h3>
        </div>
        <div className="tk-dept-row header-row">
            <div>Department</div>
            <div className="tk-dept-num">Total</div>
            <div className="tk-dept-num">Pending</div>
            <div className="tk-dept-num">In Progress</div>
            <div className="tk-dept-num">Done</div>
        </div>
        {deptBreakdown.length === 0 && (
            <div style={{ padding: "24px 20px", textAlign: "center", color: "#4B5563", fontSize: ".83rem" }}>
                No data yet
            </div>
        )}
        {deptBreakdown.map((d) => (
            <div
                key={d._id}
                className="tk-dept-row"
                onClick={() => onSelectDept(d._id)}
                title={`Filter tasks by ${d._id}`}
            >
                <div className="tk-dept-name">
                    <span className="tk-chip chip-teal" style={{ marginRight: 8 }}>
                        <Icon d={icons.building} size={10} />{d._id || "Unknown"}
                    </span>
                </div>
                <div className="tk-dept-num" style={{ fontWeight: 700 }}>{d.total}</div>
                <div className="tk-dept-num" style={{ color: "#78350F" }}>{d.pending}</div>
                <div className="tk-dept-num" style={{ color: "#1E3A8A" }}>{d.inProgress}</div>
                <div className="tk-dept-num" style={{ color: "#14532D" }}>{d.done}</div>
            </div>
        ))}
    </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
const Tasks = () => {
    const user = getUser();
    const role = user?.role || "employee";

    const defaultTab = role === "hr" || role === "manager" || role === "superadmin"
        ? "all"
        : role === "tl"
            ? "my"
            : "my";

    const [tab, setTab] = useState(defaultTab);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, done: 0, overdue: 0 });
    const [deptBreakdown, setDeptBreakdown] = useState([]);
    const [members, setMembers] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");
    const [search, setSearch] = useState("");

    const [viewTask, setViewTask] = useState(null);
    const [editTask, setEditTask] = useState(null);
    const [deleteTask, setDeleteTask] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    const [toast, setToast] = useState("");

    const canManage = role === "tl" || role === "hr" || role === "manager" || role === "superadmin";
    const isHR = role === "hr" || role === "manager" || role === "superadmin";
    const isTL = role === "tl";

    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    }, []);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (priorityFilter !== "all") params.append("priority", priorityFilter);

            let url;
            if (tab === "my") {
                url = `/tasks/my?${params}`;
            } else if (tab === "department" && isTL) {
                url = `/tasks/department?${params}`;
            } else {
                if (deptFilter !== "all") params.append("department", deptFilter);
                url = `/tasks?${params}`;
            }

            const res = await API.get(url);
            setTasks(res.data.tasks || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [tab, statusFilter, priorityFilter, deptFilter, isTL]);

    const fetchStats = useCallback(async () => {
        try {
            if (isHR) {
                const params = new URLSearchParams();
                if (deptFilter !== "all") params.append("department", deptFilter);
                const res = await API.get(`/tasks/stats?${params}`);
                setStats(res.data.stats || {});
                setDeptBreakdown(res.data.deptBreakdown || []);
            } else if (isTL) {
                const res = await API.get("/tasks/dept-stats");
                setStats(res.data.stats || {});
            }
        } catch { /* silent */ }
    }, [isHR, isTL, deptFilter]);

    useEffect(() => {
        if (tab === "my") {
            const total = tasks.length;
            const pending = tasks.filter((t) => t.status === "pending").length;
            const inProgress = tasks.filter((t) => t.status === "in-progress").length;
            const done = tasks.filter((t) => t.status === "done").length;
            const overdue = tasks.filter((t) => isOverdue(t)).length;
            setStats({ total, pending, inProgress, done, overdue });
        }
    }, [tasks, tab]);

    useEffect(() => {
        const load = async () => {
            try {
                if (isTL) {
                    const res = await API.get("/tasks/dept-members");
                    setMembers(res.data.members || []);
                } else if (isHR) {
                    const res = await API.get("/users?role=employee");
                    setMembers(res.data.users || []);
                    const dRes = await API.get("/tasks/departments");
                    setDepartments(dRes.data.departments || []);
                }
            } catch { /* silent */ }
        };
        load();
    }, [isTL, isHR]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);
    useEffect(() => {
        if (tab !== "my") fetchStats();
        else if (isTL || isHR) fetchStats();
    }, [fetchStats, tab, isTL, isHR]);

    const handleStatusSave = async (id, payload) => {
        const res = await API.put(`/tasks/${id}/status`, payload);
        setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
        showToast("Task updated successfully");
    };

    const handleCreate = async (payload) => {
        const res = await API.post("/tasks", payload);
        if (tab === "department" || tab === "all") {
            setTasks((prev) => [res.data.task, ...prev]);
        }
        showToast("Task created successfully");
        fetchStats();
    };

    const handleEdit = async (payload) => {
        const res = await API.put(`/tasks/${editTask._id}`, payload);
        setTasks((prev) => prev.map((t) => (t._id === editTask._id ? res.data.task : t)));
        showToast("Task updated successfully");
        fetchStats();
    };

    const handleDelete = async (id) => {
        await API.delete(`/tasks/${id}`);
        setTasks((prev) => prev.filter((t) => t._id !== id));
        showToast("Task deleted");
        fetchStats();
    };

    const filtered = useMemo(() =>
        tasks.filter((t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase())) ||
            t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
        ),
        [tasks, search]);

    const statCards = [
        { label: "Total tasks", value: stats.total, color: "blue" },
        { label: "Pending", value: stats.pending, color: "amber" },
        { label: "Completed", value: stats.done, color: "green" },
        { label: "Overdue", value: stats.overdue, color: "red" },
    ];

    const tabs = [
        { key: "my", label: "My Tasks", icon: icons.task, show: true },
        { key: "department", label: "Department Tasks", icon: icons.users, show: isTL },
        { key: "all", label: "All Tasks", icon: icons.layers, show: isHR },
    ].filter((t) => t.show);

    const currentTabIsManaged = tab !== "my" && canManage;
    const showDeptOverview = isHR && tab === "all" && deptBreakdown.length > 0 && deptFilter === "all" && !search;

    return (
        <>
            <style>{css}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
                    background: "#1A1D23", color: "#fff",
                    padding: "12px 20px", borderRadius: 12,
                    fontSize: ".85rem", fontWeight: 500,
                    boxShadow: "0 8px 24px rgba(0,0,0,.25)",
                    animation: "fadeUp .2s ease",
                    display: "flex", alignItems: "center", gap: 8,
                    border: "1px solid #374151",
                }}>
                    <Icon d={icons.check} size={14} color="#4ADE80" /> {toast}
                </div>
            )}

            <DashboardLayout>
                <div className="tk-root">

                    {/* Header */}
                    <div className="tk-header">
                        <div>
                            <h1>Tasks</h1>
                            <p>
                                {tab === "my" && "Track your assigned work and submit reports"}
                                {tab === "department" && "Manage tasks for your department"}
                                {tab === "all" && "View and manage all tasks across departments"}
                            </p>
                        </div>

                        {currentTabIsManaged && (
                            <button className="tk-add-btn" onClick={() => setShowCreate(true)}>
                                <Icon d={icons.plus} size={15} /> Add Task
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    {tabs.length > 1 && (
                        <div className="tk-tabs">
                            {tabs.map((t) => (
                                <button
                                    key={t.key}
                                    className={`tk-tab ${tab === t.key ? "active" : ""}`}
                                    onClick={() => {
                                        setTab(t.key);
                                        setStatusFilter("all");
                                        setPriorityFilter("all");
                                        setDeptFilter("all");
                                        setSearch("");
                                    }}
                                >
                                    <Icon d={t.icon} size={13} /> {t.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Stat cards */}
                    <div className="tk-stats">
                        {statCards.map((s) => (
                            <div key={s.label} className={`tk-stat ${s.color}`}>
                                <div className="tk-stat-label">{s.label}</div>
                                <div className="tk-stat-val">{loading ? "—" : s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Department overview table */}
                    {showDeptOverview && (
                        <DeptOverviewTable
                            deptBreakdown={deptBreakdown}
                            onSelectDept={(dept) => setDeptFilter(dept)}
                        />
                    )}

                    {/* Filters */}
                    <div className="tk-filters">
                        <Icon d={icons.filter} size={15} color="#4B5563" />

                        <input
                            className="tk-search"
                            placeholder="Search tasks, assignee, tags…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select className="tk-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>

                        <select className="tk-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                            <option value="all">All priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {isHR && tab === "all" && departments.length > 0 && (
                            <select className="tk-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                                <option value="all">All departments</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        )}

                        {(statusFilter !== "all" || priorityFilter !== "all" || search || deptFilter !== "all") && (
                            <button
                                onClick={() => {
                                    setStatusFilter("all"); setPriorityFilter("all");
                                    setSearch(""); setDeptFilter("all");
                                }}
                                style={{
                                    padding: "7px 12px", borderRadius: 8,
                                    border: "1.5px solid #B0B7C6", background: "#fff",
                                    fontSize: ".8rem", color: "#374151", cursor: "pointer",
                                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
                                    fontWeight: 600,
                                }}
                            >
                                <Icon d={icons.close} size={12} /> Clear
                            </button>
                        )}
                    </div>

                    {/* Task grid */}
                    <div className="tk-grid">
                        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

                        {!loading && filtered.length === 0 && (
                            <div className="tk-empty">
                                <div className="tk-empty-icon">
                                    <Icon d={icons.task} size={24} color="#374151" />
                                </div>
                                <p style={{ fontWeight: 600, color: "#111318", marginBottom: 6 }}>No tasks found</p>
                                <p style={{ fontSize: ".82rem", color: "#4B5563" }}>
                                    {search || statusFilter !== "all" || priorityFilter !== "all" || deptFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : currentTabIsManaged
                                            ? 'Click "Add Task" to create the first task'
                                            : "You have no tasks assigned yet"}
                                </p>
                            </div>
                        )}

                        {!loading && filtered.map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                canManage={currentTabIsManaged}
                                onView={setViewTask}
                                onEdit={setEditTask}
                                onDelete={setDeleteTask}
                            />
                        ))}
                    </div>

                </div>

                {/* ── Modals ── */}

                {viewTask && !currentTabIsManaged && (
                    <ViewTaskModal
                        task={viewTask}
                        onClose={() => setViewTask(null)}
                        onSave={handleStatusSave}
                    />
                )}

                {viewTask && currentTabIsManaged && (
                    <div className="tk-backdrop" onClick={() => setViewTask(null)}>
                        <div className="tk-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="tk-modal-header">
                                <div className="tk-modal-title">{viewTask.title}</div>
                                <button className="tk-close" onClick={() => setViewTask(null)}>
                                    <Icon d={icons.close} size={16} />
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                                {statusBadge(viewTask.status, isOverdue(viewTask))}
                                {priorityChip(viewTask.priority)}
                                {viewTask.tags?.map((t) => <span key={t} className="tk-tag">{t}</span>)}
                            </div>
                            {viewTask.description && (
                                <div className="tk-modal-section">
                                    <div className="tk-modal-label">Description</div>
                                    <div className="tk-modal-value" style={{ whiteSpace: "pre-wrap" }}>{viewTask.description}</div>
                                </div>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", marginBottom: 18 }}>
                                <div>
                                    <div className="tk-modal-label">Assigned to</div>
                                    <div className="tk-assignee" style={{ marginTop: 4 }}>
                                        <div className="tk-avatar avatar-cyan">
                                            <UserIcon size={15} />
                                        </div>
                                        <span style={{ color: "#1F2937", fontWeight: 500 }}>{viewTask.assignedTo?.name || "—"}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="tk-modal-label">Assigned by</div>
                                    <div className="tk-assignee" style={{ marginTop: 4 }}>
                                        <div className="tk-avatar">
                                            <UserIcon size={15} />
                                        </div>
                                        <span style={{ color: "#1F2937", fontWeight: 500 }}>{viewTask.assignedBy?.name || "—"}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="tk-modal-label">Due date</div>
                                    <div className={`tk-due ${isOverdue(viewTask) ? "overdue" : ""}`} style={{ marginTop: 6 }}>
                                        <Icon d={icons.calendar} size={12} />
                                        {viewTask.dueDate ? formatDue(viewTask.dueDate) : "No deadline"}
                                    </div>
                                </div>
                                {viewTask.assignedTo?.department && (
                                    <div>
                                        <div className="tk-modal-label">Department</div>
                                        <span className="tk-chip chip-teal" style={{ marginTop: 6 }}>
                                            <Icon d={icons.building} size={10} />{viewTask.assignedTo.department}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {viewTask.workReport && (
                                <>
                                    <hr className="tk-divider" />
                                    <div className="tk-modal-section">
                                        <div className="tk-modal-label">Work report by employee</div>
                                        <div className="tk-modal-value" style={{
                                            background: "#F3F4F6", border: "1px solid #D1D5DB",
                                            padding: "10px 12px", borderRadius: 8,
                                            fontSize: ".85rem", whiteSpace: "pre-wrap", color: "#1F2937",
                                        }}>{viewTask.workReport}</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {showCreate && (
                    <TaskFormModal
                        mode="create"
                        members={members}
                        onClose={() => setShowCreate(false)}
                        onSubmit={handleCreate}
                    />
                )}

                {editTask && (
                    <TaskFormModal
                        mode="edit"
                        task={editTask}
                        members={members}
                        onClose={() => setEditTask(null)}
                        onSubmit={handleEdit}
                    />
                )}

                {deleteTask && (
                    <ConfirmModal
                        task={deleteTask}
                        onClose={() => setDeleteTask(null)}
                        onConfirm={handleDelete}
                    />
                )}

            </DashboardLayout>
        </>
    );
};

export default Tasks;