import { useEffect, useState, useMemo, useCallback } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════════════════════
   MANAGER TASKS PAGE
   Route: /manager-tasks
   Role: manager / hr / superadmin
   Features:
     - Stat cards: Total, Pending, In-Progress, Done, Overdue
     - Department overview table (click to filter)
     - Tab: All Tasks | By Department | By TL | By Employee
     - Filters: search, status, priority, department, TL, date range, month
     - Task cards with view modal (read-only + work report)
══════════════════════════════════════════════════════════════ */

/* ─── Inline SVG Icon ─────────────────────────────────────────── */
const Ic = ({ d, size = 16, color = "currentColor", style }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, ...style }}
    >
        <path d={d} />
    </svg>
);

const IC = {
    task: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    close: "M18 6L6 18M6 6l12 12",
    check: "M20 6L9 17l-5-5",
    alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
    report: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    back: "M19 12H5M12 19l-7-7 7-7",
    expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
    person: "M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zM3 21c0-4.418 4.03-8 9-8s9 3.582 9 8",
};

/* ─── Helpers ─────────────────────────────────────────────────── */
const initials = (name = "") =>
    (name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

const isOverdue = (task) =>
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

/* ── Reset & root ── */
.mt-root *, .mt-root *::before, .mt-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
.mt-root {
    font-family: 'DM Sans', sans-serif;
    color: #111318;
    padding-bottom: 48px;
    background: transparent;
}

/* ── Animations ── */
@keyframes mt-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes mt-scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
}
@keyframes mt-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
@keyframes mt-fillBar {
    from { width: 0; }
    to   { width: var(--w); }
}

/* ── Header ── */
.mt-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
    animation: mt-fadeUp .35s ease both;
}
.mt-header-left h1 {
    font-size: 1.55rem;
    font-weight: 800;
    letter-spacing: -.5px;
    color: #111318;
    margin-bottom: 4px;
}
.mt-header-left p {
    font-size: .83rem;
    color: #374151;
    font-weight: 500;
}
.mt-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    background: #fff;
    border: 1.5px solid #E2E8F0;
    border-radius: 10px;
    font-size: .82rem;
    font-weight: 700;
    color: #374151;
    cursor: pointer;
    font-family: inherit;
    transition: all .18s;
}
.mt-back-btn:hover {
    background: #F8FAFC;
    border-color: #C7D2FE;
    color: #4F46E5;
    transform: translateX(-2px);
}

/* ── Stat cards ── */
.mt-stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 13px;
    margin-bottom: 24px;
    animation: mt-fadeUp .35s ease both;
    animation-delay: .05s;
}
@media(max-width:1100px){ .mt-stats { grid-template-columns: repeat(3,1fr); } }
@media(max-width:680px) { .mt-stats { grid-template-columns: repeat(2,1fr); } }
@media(max-width:420px) { .mt-stats { grid-template-columns: 1fr; } }

.mt-stat {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E8EBF0;
    padding: 16px 18px 14px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all .2s cubic-bezier(.4,0,.2,1);
    animation: mt-scaleIn .3s ease both;
}
.mt-stat:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,.09);
    border-color: transparent;
}
.mt-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
}
.mt-stat.s-total::before   { background: linear-gradient(90deg,#818CF8,#6366F1); }
.mt-stat.s-pending::before { background: linear-gradient(90deg,#FCD34D,#F59E0B); }
.mt-stat.s-prog::before    { background: linear-gradient(90deg,#60A5FA,#3B82F6); }
.mt-stat.s-done::before    { background: linear-gradient(90deg,#4ADE80,#22C55E); }
.mt-stat.s-overdue::before { background: linear-gradient(90deg,#F87171,#EF4444); }

.mt-stat-label {
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #374151;
    margin-bottom: 10px;
}
.mt-stat-val {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1;
    color: #111318;
    font-variant-numeric: tabular-nums;
}
.mt-stat-sub {
    font-size: .72rem;
    color: #374151;
    margin-top: 5px;
    font-weight: 500;
}
.mt-stat:nth-child(1) { animation-delay: .06s; }
.mt-stat:nth-child(2) { animation-delay: .10s; }
.mt-stat:nth-child(3) { animation-delay: .14s; }
.mt-stat:nth-child(4) { animation-delay: .18s; }
.mt-stat:nth-child(5) { animation-delay: .22s; }

/* ── Dept overview card ── */
.mt-dept-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #E8EBF0;
    margin-bottom: 22px;
    overflow: hidden;
    animation: mt-fadeUp .35s ease both;
    animation-delay: .15s;
}
.mt-dept-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px;
    border-bottom: 1px solid #F3F4F6;
}
.mt-dept-card-header h3 {
    font-size: .9rem;
    font-weight: 700;
    color: #111318;
    display: flex;
    align-items: center;
    gap: 8px;
}
.mt-dept-toggle {
    font-size: .76rem;
    font-weight: 700;
    color: #4F46E5;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 4px 10px;
    border-radius: 6px;
    transition: background .15s;
}
.mt-dept-toggle:hover { background: #EDE9FE; }

.mt-dept-table { width: 100%; border-collapse: collapse; }
.mt-dept-table th {
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .65px;
    color: #374151;
    padding: 10px 22px;
    text-align: left;
    background: #F8FAFC;
    border-bottom: 1px solid #E8EBF0;
}
.mt-dept-table th:not(:first-child) { text-align: center; }
.mt-dept-table td {
    padding: 11px 22px;
    font-size: .84rem;
    color: #111318;
    border-bottom: 1px solid #F3F4F6;
    transition: background .12s;
}
.mt-dept-table tr:last-child td { border-bottom: none; }
.mt-dept-table tbody tr {
    cursor: pointer;
    transition: background .12s;
}
.mt-dept-table tbody tr:hover td { background: #F8FAFC; }
.mt-dept-table td:not(:first-child) { text-align: center; font-variant-numeric: tabular-nums; }
.mt-dept-name-cell { font-weight: 600; color: #111318; display: flex; align-items: center; gap: 8px; }

/* Mini progress bar inside dept table */
.mt-dept-progress {
    height: 4px;
    background: #F1F5F9;
    border-radius: 2px;
    width: 80px;
    overflow: hidden;
    display: inline-block;
    vertical-align: middle;
    margin-left: 6px;
}
.mt-dept-progress-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg,#4ADE80,#22C55E);
    width: 0;
    animation: mt-fillBar 1s cubic-bezier(.4,0,.2,1) .4s forwards;
}

/* ── Controls bar ── */
.mt-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    animation: mt-fadeUp .35s ease both;
    animation-delay: .2s;
}
.mt-search {
    padding: 9px 14px;
    border-radius: 9px;
    border: 1.5px solid #E2E8F0;
    background: #fff;
    font-size: .83rem;
    font-family: inherit;
    color: #111318;
    outline: none;
    min-width: 220px;
    transition: border .15s, box-shadow .15s;
}
.mt-search::placeholder { color: #6B7280; }
.mt-search:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
.mt-sel {
    padding: 9px 12px;
    border-radius: 9px;
    border: 1.5px solid #E2E8F0;
    background: #fff;
    font-size: .82rem;
    font-family: inherit;
    color: #111318;
    cursor: pointer;
    outline: none;
    transition: border .15s;
    font-weight: 500;
}
.mt-sel:focus { border-color: #6366F1; }
.mt-date-input {
    padding: 8px 12px;
    border-radius: 9px;
    border: 1.5px solid #E2E8F0;
    background: #fff;
    font-size: .82rem;
    font-family: 'DM Mono', monospace;
    color: #111318;
    outline: none;
    transition: border .15s;
}
.mt-date-input:focus { border-color: #6366F1; }
.mt-clear-btn {
    padding: 8px 13px;
    border-radius: 9px;
    border: 1.5px solid #E2E8F0;
    background: #fff;
    font-size: .78rem;
    color: #374151;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all .15s;
}
.mt-clear-btn:hover { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }

/* ── Tabs ── */
.mt-tabs {
    display: flex;
    gap: 4px;
    background: #E8EBF0;
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 20px;
    width: fit-content;
    animation: mt-fadeUp .35s ease both;
    animation-delay: .18s;
}
.mt-tab {
    padding: 7px 16px;
    border-radius: 7px;
    border: none;
    background: transparent;
    font-size: .81rem;
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
.mt-tab:hover:not(.mt-tab-active) { background: rgba(255,255,255,.7); color: #111318; }
.mt-tab.mt-tab-active {
    background: #fff;
    color: #4F46E5;
    box-shadow: 0 1px 4px rgba(0,0,0,.12);
    font-weight: 700;
}

/* ── Task grid ── */
.mt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 15px;
    animation: mt-fadeUp .35s ease both;
    animation-delay: .25s;
}

.mt-card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E8EBF0;
    padding: 18px 20px;
    cursor: pointer;
    transition: all .18s cubic-bezier(.4,0,.2,1);
    position: relative;
    overflow: hidden;
}
.mt-card:hover {
    border-color: #C7D2FE;
    box-shadow: 0 6px 24px rgba(99,102,241,.1);
    transform: translateY(-2px);
}
.mt-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3.5px;
    border-radius: 14px 0 0 14px;
}
.mt-card.p-high::before   { background: #EF4444; }
.mt-card.p-medium::before { background: #F59E0B; }
.mt-card.p-low::before    { background: #22C55E; }
.mt-card.overdue-card     { border-color: #FECACA; }

.mt-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
}
.mt-card-title {
    font-size: .9rem;
    font-weight: 700;
    color: #111318;
    line-height: 1.35;
}
.mt-card-desc {
    font-size: .78rem;
    color: #374151;
    line-height: 1.55;
    margin-bottom: 13px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* chips */
.mt-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: .69rem;
    font-weight: 700;
    white-space: nowrap;
}
.chip-ind    { background: #EEF2FF; color: #4338CA; }
.chip-amber  { background: #FFFBEB; color: #92400E; }
.chip-green  { background: #F0FDF4; color: #166534; }
.chip-red    { background: #FFF1F2; color: #BE123C; }
.chip-gray   { background: #F3F4F6; color: #4B5563; }
.chip-purple { background: #FAF5FF; color: #6D28D9; }
.chip-teal   { background: #F0FDFA; color: #0F766E; }
.chip-sky    { background: #F0F9FF; color: #0369A1; }

/* status badge */
.mt-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 99px;
    font-size: .7rem;
    font-weight: 700;
    white-space: nowrap;
}
.b-pending  { background: #FFF7ED; color: #C2410C; }
.b-inprog   { background: #EFF6FF; color: #1D4ED8; }
.b-done     { background: #F0FDF4; color: #15803D; }
.b-overdue  { background: #FFF1F2; color: #BE123C; }

.mt-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 13px;
}
.mt-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 11px;
    border-top: 1px solid #F3F4F6;
}
.mt-assignee {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: .78rem;
    color: #374151;
    font-weight: 500;
    min-width: 0;
}
.mt-assignee span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
}
.mt-avatar {
    width: 26px; height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .62rem;
    font-weight: 700;
    flex-shrink: 0;
    color: #fff;
}
.av-ind    { background: #6366F1; }
.av-sky    { background: #0EA5E9; }
.av-violet { background: #8B5CF6; }
.av-teal   { background: #14B8A6; }

/* ── Empty ── */
.mt-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 5rem 2rem;
    color: #9CA3AF;
}
.mt-empty-icon {
    width: 60px; height: 60px;
    background: #F3F4F6;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}
.mt-empty p:first-of-type { font-weight: 700; color: #374151; font-size: .92rem; margin-bottom: 5px; }
.mt-empty p:last-of-type  { font-size: .8rem; }

/* ── Skeleton ── */
.mt-skel {
    background: linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);
    background-size: 200% 100%;
    animation: mt-shimmer 1.4s infinite;
    border-radius: 7px;
}

/* ── Modal ── */
.mt-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15,17,23,.5);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 16px;
    animation: mt-fadeUp .15s ease;
}
.mt-modal {
    background: #fff;
    border-radius: 20px;
    width: 100%;
    max-width: 560px;
    max-height: 88vh;
    overflow-y: auto;
    padding: 28px;
    position: relative;
    box-shadow: 0 32px 80px rgba(0,0,0,.18);
    animation: mt-scaleIn .18s ease;
}
.mt-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 18px;
    gap: 12px;
}
.mt-modal-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #111318;
    line-height: 1.3;
    letter-spacing: -.3px;
}
.mt-close {
    width: 34px; height: 34px;
    border-radius: 9px;
    border: none;
    background: #F3F4F6;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #6B7280;
    transition: background .15s;
}
.mt-close:hover { background: #E5E7EB; color: #111318; }
.mt-modal-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}
.mt-modal-section { margin-bottom: 18px; }
.mt-modal-label {
    font-size: .69rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #9CA3AF;
    margin-bottom: 6px;
}
.mt-modal-value {
    font-size: .88rem;
    color: #374151;
    font-weight: 500;
    line-height: 1.6;
}
.mt-modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 24px;
    margin-bottom: 20px;
}
.mt-divider { border: none; border-top: 1px solid #F3F4F6; margin: 18px 0; }
.mt-work-report {
    background: #F8FAFC;
    border: 1px solid #E8EBF0;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: .84rem;
    color: #374151;
    line-height: 1.65;
    white-space: pre-wrap;
    font-family: 'DM Sans', sans-serif;
}

/* ── Result count ── */
.mt-result-info {
    font-size: .8rem;
    color: #374151;
    font-weight: 600;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ── Dept badge chip ── */
.mt-dept-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: #F0FDFA;
    color: #0F766E;
    border-radius: 5px;
    font-size: .68rem;
    font-weight: 700;
}
`;

/* ─── Sub-components ──────────────────────────────────────────── */

const SkeletonCard = () => (
    <div className="mt-card" style={{ cursor: "default", pointerEvents: "none" }}>
        <div className="mt-skel" style={{ height: 15, width: "70%", marginBottom: 10 }} />
        <div className="mt-skel" style={{ height: 11, width: "100%", marginBottom: 5 }} />
        <div className="mt-skel" style={{ height: 11, width: "55%", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 8 }}>
            <div className="mt-skel" style={{ height: 22, width: 60 }} />
            <div className="mt-skel" style={{ height: 22, width: 60 }} />
        </div>
    </div>
);

const PriorityChip = ({ p }) => {
    const map = { high: ["chip-red", "High"], medium: ["chip-amber", "Medium"], low: ["chip-green", "Low"] };
    const [cls, label] = map[p] || map.medium;
    return <span className={`mt-chip ${cls}`}><Ic d={IC.flag} size={10} />{label}</span>;
};

const StatusBadge = ({ status, overdue }) => {
    if (overdue && status !== "done")
        return <span className="mt-badge b-overdue"><Ic d={IC.alert} size={10} />Overdue</span>;
    const map = {
        pending: ["b-pending", "Pending"],
        "in-progress": ["b-inprog", "In Progress"],
        done: ["b-done", "Done"],
    };
    const [cls, label] = map[status] || ["b-pending", "Pending"];
    return <span className={`mt-badge ${cls}`}>{label}</span>;
};

/* ─── Task Card ───────────────────────────────────────────────── */
const TaskCard = ({ task, onView }) => {
    const overdue = isOverdue(task);
    return (
        <div
            className={`mt-card p-${task.priority} ${overdue ? "overdue-card" : ""}`}
            onClick={() => onView(task)}
        >
            <div className="mt-card-top">
                <div className="mt-card-title">{task.title}</div>
                <StatusBadge status={task.status} overdue={overdue} />
            </div>

            {task.description && (
                <div className="mt-card-desc">{task.description}</div>
            )}

            <div className="mt-card-meta">
                <PriorityChip p={task.priority} />
                {task.dueDate && (
                    <span className={`mt-chip ${overdue ? "chip-red" : "chip-gray"}`}>
                        <Ic d={IC.calendar} size={10} />{fmtDate(task.dueDate)}
                    </span>
                )}
                {task.assignedTo?.department && (
                    <span className="mt-chip chip-teal">
                        <Ic d={IC.building} size={10} />
                        {task.assignedTo.department}
                    </span>
                )}
                {task.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="mt-chip chip-purple">
                        <Ic d={IC.tag} size={9} />{tag}
                    </span>
                ))}
                {task.tags?.length > 2 && (
                    <span className="mt-chip chip-gray">+{task.tags.length - 2}</span>
                )}
            </div>

            <div className="mt-card-footer">
                <div className="mt-assignee">
                    <div className="mt-avatar av-sky">{initials(task.assignedTo?.name)}</div>
                    <span>{task.assignedTo?.name || "—"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {task.workReport && (
                        <span className="mt-chip chip-sky" style={{ fontSize: ".65rem" }}>
                            <Ic d={IC.report} size={9} />Report
                        </span>
                    )}
                    {task.assignedBy?.name && (
                        <span style={{ fontSize: ".72rem", color: "#9CA3AF" }}>
                            by {task.assignedBy.name.split(" ")[0]}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─── View Modal ──────────────────────────────────────────────── */
const ViewModal = ({ task, onClose }) => {
    const overdue = isOverdue(task);
    return (
        <div className="mt-backdrop" onClick={onClose}>
            <div className="mt-modal" onClick={e => e.stopPropagation()}>
                <div className="mt-modal-header">
                    <div className="mt-modal-title">{task.title}</div>
                    <button className="mt-close" onClick={onClose}>
                        <Ic d={IC.close} size={15} />
                    </button>
                </div>

                <div className="mt-modal-meta">
                    <StatusBadge status={task.status} overdue={overdue} />
                    <PriorityChip p={task.priority} />
                    {task.tags?.map(t => (
                        <span key={t} className="mt-chip chip-purple">
                            <Ic d={IC.tag} size={9} />{t}
                        </span>
                    ))}
                </div>

                {task.description && (
                    <div className="mt-modal-section">
                        <div className="mt-modal-label">Description</div>
                        <div className="mt-modal-value" style={{ whiteSpace: "pre-wrap" }}>
                            {task.description}
                        </div>
                    </div>
                )}

                <div className="mt-modal-grid">
                    <div>
                        <div className="mt-modal-label">Assigned To</div>
                        <div className="mt-assignee" style={{ marginTop: 5 }}>
                            <div className="mt-avatar av-sky">{initials(task.assignedTo?.name)}</div>
                            <span style={{ color: "#374151", fontWeight: 600 }}>
                                {task.assignedTo?.name || "—"}
                            </span>
                        </div>
                        {task.assignedTo?.department && (
                            <span className="mt-dept-chip" style={{ marginTop: 6, display: "inline-flex" }}>
                                <Ic d={IC.building} size={9} />{task.assignedTo.department}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="mt-modal-label">Assigned By</div>
                        <div className="mt-assignee" style={{ marginTop: 5 }}>
                            <div className="mt-avatar av-violet">{initials(task.assignedBy?.name)}</div>
                            <span style={{ color: "#374151", fontWeight: 600 }}>
                                {task.assignedBy?.name || "—"}
                            </span>
                        </div>
                        {task.assignedBy?.department && (
                            <span style={{ fontSize: ".72rem", color: "#9CA3AF", marginTop: 4, display: "block" }}>
                                {task.assignedBy.department}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="mt-modal-label">Due Date</div>
                        <div className={`mt-assignee ${overdue ? "" : ""}`} style={{ marginTop: 5, color: overdue ? "#EF4444" : "#374151" }}>
                            <Ic d={IC.calendar} size={13} color={overdue ? "#EF4444" : "#9CA3AF"} />
                            <span style={{ fontWeight: 600 }}>
                                {task.dueDate ? fmtDate(task.dueDate) : "No deadline"}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="mt-modal-label">Created</div>
                        <div className="mt-assignee" style={{ marginTop: 5 }}>
                            <Ic d={IC.clock} size={13} color="#9CA3AF" />
                            <span style={{ color: "#374151", fontWeight: 600 }}>{fmtDate(task.createdAt)}</span>
                        </div>
                    </div>

                    {task.completedAt && (
                        <div>
                            <div className="mt-modal-label">Completed At</div>
                            <div className="mt-assignee" style={{ marginTop: 5 }}>
                                <Ic d={IC.check} size={13} color="#22C55E" />
                                <span style={{ color: "#374151", fontWeight: 600 }}>{fmtDate(task.completedAt)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {task.workReport && (
                    <>
                        <hr className="mt-divider" />
                        <div className="mt-modal-section">
                            <div className="mt-modal-label">
                                <Ic d={IC.report} size={11} style={{ display: "inline", marginRight: 4 }} />
                                Work Report by Employee
                            </div>
                            <div className="mt-work-report">{task.workReport}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

/* ─── Department Overview Table ───────────────────────────────── */
const DeptTable = ({ breakdown, activeDept, onSelectDept }) => {
    const [collapsed, setCollapsed] = useState(false);
    if (!breakdown.length) return null;
    return (
        <div className="mt-dept-card">
            <div className="mt-dept-card-header">
                <h3>
                    <Ic d={IC.building} size={15} color="#6366F1" />
                    Department Overview
                </h3>
                <button className="mt-dept-toggle" onClick={() => setCollapsed(c => !c)}>
                    {collapsed ? "Show ▾" : "Hide ▴"}
                </button>
            </div>
            {!collapsed && (
                <table className="mt-dept-table">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Total</th>
                            <th>Pending</th>
                            <th>In Progress</th>
                            <th>Done</th>
                            <th>Overdue</th>
                            <th>Completion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {breakdown.map(d => {
                            const pct = d.total ? Math.round((d.done / d.total) * 100) : 0;
                            const isActive = activeDept === d._id;
                            return (
                                <tr
                                    key={d._id}
                                    onClick={() => onSelectDept(isActive ? "all" : d._id)}
                                    style={isActive ? { background: "#EEF2FF" } : {}}
                                >
                                    <td>
                                        <div className="mt-dept-name-cell">
                                            <span className="mt-dept-chip">
                                                <Ic d={IC.building} size={9} />{d._id || "Unknown"}
                                            </span>
                                            {isActive && (
                                                <span style={{ fontSize: ".68rem", color: "#6366F1", fontWeight: 700 }}>
                                                    ← active filter
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{d.total}</td>
                                    <td style={{ color: "#C2410C" }}>{d.pending}</td>
                                    <td style={{ color: "#1D4ED8" }}>{d.inProgress}</td>
                                    <td style={{ color: "#15803D" }}>{d.done}</td>
                                    <td style={{ color: "#DC2626" }}>{d.overdue ?? 0}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div className="mt-dept-progress">
                                                <div
                                                    className="mt-dept-progress-fill"
                                                    style={{ "--w": `${pct}%` }}
                                                />
                                            </div>
                                            <span style={{ fontSize: ".72rem", color: "#6B7280", fontWeight: 600 }}>
                                                {pct}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
const ManagerTasks = () => {
    const navigate = useNavigate();

    /* ── State ── */
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, done: 0, overdue: 0 });
    const [deptBreakdown, setDeptBreakdown] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [tlList, setTlList] = useState([]);   // TLs fetched from /users?role=tl
    const [viewTask, setViewTask] = useState(null);

    /* ── Filters ── */
    const [tab, setTab] = useState("all"); // all | dept | tl | employee
    const [search, setSearch] = useState("");
    const [statusF, setStatusF] = useState("all");
    const [priorityF, setPriorityF] = useState("all");
    const [deptF, setDeptF] = useState("all");
    const [tlF, setTlF] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [monthF, setMonthF] = useState(""); // "YYYY-MM"

    /* ── Fetch stats + breakdown ── */
    const fetchStats = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (deptF !== "all") params.append("department", deptF);
            const res = await API.get(`/tasks/stats?${params}`);
            setStats(res.data.stats || {});
            setDeptBreakdown(res.data.deptBreakdown || []);
        } catch { /* silent */ }
    }, [deptF]);

    /* ── Fetch tasks ── */
    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusF !== "all") params.append("status", statusF);
            if (priorityF !== "all") params.append("priority", priorityF);
            if (deptF !== "all") params.append("department", deptF);
            if (tlF !== "all") params.append("assignedBy", tlF);

            const res = await API.get(`/tasks?${params}`);
            setTasks(res.data.tasks || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [statusF, priorityF, deptF, tlF]);

    /* ── Fetch departments + TLs ── */
    useEffect(() => {
        const load = async () => {
            try {
                const [dRes, tlRes] = await Promise.allSettled([
                    API.get("/tasks/departments"),
                    API.get("/users?role=tl"),
                ]);
                if (dRes.status === "fulfilled")
                    setDepartments(dRes.value.data.departments || []);
                if (tlRes.status === "fulfilled") {
                    const d = tlRes.value.data;
                    setTlList(Array.isArray(d) ? d : d?.users || d?.data || []);
                }
            } catch { /* silent */ }
        };
        load();
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    /* ── Client-side filter (search + date + month + tab) ── */
    const filtered = useMemo(() => {
        return tasks.filter(t => {
            // Search
            if (search) {
                const q = search.toLowerCase();
                const hit =
                    t.title?.toLowerCase().includes(q) ||
                    t.description?.toLowerCase().includes(q) ||
                    t.assignedTo?.name?.toLowerCase().includes(q) ||
                    t.assignedBy?.name?.toLowerCase().includes(q) ||
                    t.assignedTo?.department?.toLowerCase().includes(q) ||
                    t.tags?.some(tag => tag.toLowerCase().includes(q));
                if (!hit) return false;
            }

            // Month filter (based on createdAt)
            if (monthF) {
                const d = new Date(t.createdAt);
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (ym !== monthF) return false;
            }

            // Date range filter (based on dueDate)
            if (dateFrom && t.dueDate) {
                if (new Date(t.dueDate) < new Date(dateFrom)) return false;
            }
            if (dateTo && t.dueDate) {
                if (new Date(t.dueDate) > new Date(dateTo + "T23:59:59")) return false;
            }

            // Tab filter
            if (tab === "dept") {
                if (!t.assignedTo?.department) return false;
            }
            if (tab === "tl") {
                // Show only tasks assigned BY a TL
                const tlIds = tlList.map(tl => tl._id);
                if (!tlIds.includes(t.assignedBy?._id)) return false;
            }
            if (tab === "employee") {
            }

            return true;
        });
    }, [tasks, search, monthF, dateFrom, dateTo, tab, tlList]);

    /* ── Stat cards ── */
    const statCards = [
        { key: "s-total", label: "Total Tasks", value: stats.total ?? 0, sub: "All departments" },
        { key: "s-pending", label: "Pending", value: stats.pending ?? 0, sub: "Awaiting start" },
        { key: "s-prog", label: "In Progress", value: stats.inProgress ?? 0, sub: "Active now" },
        { key: "s-done", label: "Completed", value: stats.done ?? 0, sub: "Finished" },
        { key: "s-overdue", label: "Overdue", value: stats.overdue ?? 0, sub: "Past deadline" },
    ];

    const hasFilters = search || statusF !== "all" || priorityF !== "all" ||
        deptF !== "all" || tlF !== "all" || dateFrom || dateTo || monthF;

    const clearFilters = () => {
        setSearch(""); setStatusF("all"); setPriorityF("all");
        setDeptF("all"); setTlF("all");
        setDateFrom(""); setDateTo(""); setMonthF("");
    };

    return (
        <>
            <style>{CSS}</style>
            <DashboardLayout>
                <div className="mt-root">

                    {/* ── Header ── */}
                    <div className="mt-header">
                        <div className="mt-header-left">
                            <h1>Task Management</h1>
                            <p>Full visibility into tasks across all departments, TLs and employees</p>
                        </div>
                        <button className="mt-back-btn" onClick={() => navigate("/manager")}>
                            <Ic d={IC.back} size={14} /> Dashboard
                        </button>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="mt-stats">
                        {statCards.map(s => (
                            <div
                                key={s.key}
                                className={`mt-stat ${s.key}`}
                                onClick={() => {
                                    if (s.key === "s-pending") { setStatusF("pending"); fetchTasks(); }
                                    if (s.key === "s-prog") { setStatusF("in-progress"); fetchTasks(); }
                                    if (s.key === "s-done") { setStatusF("done"); fetchTasks(); }
                                    if (s.key === "s-total") { setStatusF("all"); }
                                }}
                            >
                                <div className="mt-stat-label">{s.label}</div>
                                <div className="mt-stat-val">
                                    {loading ? <div className="mt-skel" style={{ height: 32, width: 60 }} /> : s.value}
                                </div>
                                <div className="mt-stat-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Department Table ── */}
                    {!loading && (
                        <DeptTable
                            breakdown={deptBreakdown}
                            activeDept={deptF}
                            onSelectDept={(d) => setDeptF(d)}
                        />
                    )}


                    {/* ── Filters ── */}
                    <div className="mt-controls">
                        <Ic d={IC.filter} size={14} color="#9CA3AF" />

                        <input
                            className="mt-search"
                            placeholder="Search title, employee, department, tag…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        <select className="mt-sel" value={statusF} onChange={e => setStatusF(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>

                        <select className="mt-sel" value={priorityF} onChange={e => setPriorityF(e.target.value)}>
                            <option value="all">All Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {departments.length > 0 && (
                            <select className="mt-sel" value={deptF} onChange={e => setDeptF(e.target.value)}>
                                <option value="all">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        )}

                        {/* Month picker */}
                        <input
                            className="mt-date-input"
                            type="month"
                            value={monthF}
                            onChange={e => setMonthF(e.target.value)}
                            title="Filter by creation month"
                            style={{ width: 148 }}
                        />

                        {/* Due date range */}
                        <input
                            className="mt-date-input"
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            title="Due date from"
                            style={{ width: 138 }}
                        />
                        <span style={{ fontSize: ".78rem", color: "#9CA3AF", fontWeight: 600 }}>to</span>
                        <input
                            className="mt-date-input"
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            title="Due date to"
                            style={{ width: 138 }}
                        />

                        {hasFilters && (
                            <button className="mt-clear-btn" onClick={clearFilters}>
                                <Ic d={IC.close} size={11} /> Clear all
                            </button>
                        )}
                    </div>

                    {/* ── Result count ── */}
                    {!loading && (
                        <div className="mt-result-info">
                            <Ic d={IC.task} size={12} color="#9CA3AF" />
                            Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of{" "}
                            <strong style={{ color: "#374151" }}>{tasks.length}</strong> tasks
                            {deptF !== "all" && (
                                <span className="mt-dept-chip" style={{ marginLeft: 4 }}>
                                    <Ic d={IC.building} size={9} />{deptF}
                                </span>
                            )}
                        </div>
                    )}

                    {/* ── Task Grid ── */}
                    <div className="mt-grid">
                        {loading && Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}

                        {!loading && filtered.length === 0 && (
                            <div className="mt-empty">
                                <div className="mt-empty-icon">
                                    <Ic d={IC.task} size={26} color="#9CA3AF" />
                                </div>
                                <p>No tasks found</p>
                                <p>
                                    {hasFilters
                                        ? "Try adjusting your filters or clearing them."
                                        : "No tasks have been created yet."}
                                </p>
                            </div>
                        )}

                        {!loading && filtered.map(task => (
                            <TaskCard key={task._id} task={task} onView={setViewTask} />
                        ))}
                    </div>

                </div>

                {/* ── View Modal ── */}
                {viewTask && (
                    <ViewModal task={viewTask} onClose={() => setViewTask(null)} />
                )}

            </DashboardLayout>
        </>
    );
};

export default ManagerTasks;