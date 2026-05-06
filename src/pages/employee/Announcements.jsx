import { useEffect, useState, useMemo } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import socket from "../../socket";

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const icons = {
    bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
    pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7v.01 M12 11v.01",
    alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
    check: "M20 6L9 17l-5-5",
    close: "M18 6L6 18M6 6l12 12",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.an-root *,
.an-root *::before,
.an-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

.an-root {
    font-family: 'DM Sans', sans-serif;
    background: #F4F6FA;
    color: #1A1D23;
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
}

/* ── Header ── */
.an-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: clamp(16px, 3vw, 24px);
    flex-wrap: wrap;
    gap: 12px;
}
.an-header h1 {
    font-size: clamp(1.2rem, 4vw, 1.6rem);
    font-weight: 700;
    letter-spacing: -.5px;
    color: #111318;
}
.an-header p {
    font-size: clamp(.75rem, 2.5vw, .825rem);
    color: #818898;
    margin-top: 2px;
}

.an-refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 14px);
    border-radius: 9px;
    border: 1.5px solid #E8EBF0;
    background: #fff;
    font-size: clamp(.75rem, 2.5vw, .82rem);
    color: #6B7280;
    cursor: pointer;
    font-family: inherit;
    transition: all .15s;
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
}
.an-refresh-btn:hover { background: #F9FAFB; border-color: #D1D5DB; }
.an-refresh-btn:active { background: #F3F4F6; }

/* ── Stats ── */
.an-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(8px, 2vw, 14px);
    margin-bottom: clamp(16px, 3vw, 24px);
}
@media (max-width: 480px) {
    .an-stats { grid-template-columns: repeat(3, 1fr); gap: 8px; }
}
@media (max-width: 320px) {
    .an-stats { grid-template-columns: 1fr; }
}

.an-stat {
    background: #fff;
    border-radius: clamp(10px, 2.5vw, 14px);
    padding: clamp(12px, 3vw, 18px) clamp(14px, 3vw, 20px);
    border: 1px solid #E8EBF0;
    position: relative;
    overflow: hidden;
}
.an-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
}
.an-stat.blue::before   { background: linear-gradient(90deg,#60A5FA,#3B82F6); }
.an-stat.red::before    { background: linear-gradient(90deg,#F87171,#EF4444); }
.an-stat.green::before  { background: linear-gradient(90deg,#4ADE80,#22C55E); }

.an-stat-label {
    font-size: clamp(.6rem, 2vw, .72rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #9CA3AF;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.an-stat-val {
    font-size: clamp(1.5rem, 5vw, 2.2rem);
    font-weight: 700;
    letter-spacing: -1.5px;
    color: #111318;
    line-height: 1;
}

/* ── Filters ── */
.an-filters {
    display: flex;
    gap: 8px;
    margin-bottom: clamp(14px, 3vw, 20px);
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
}
.an-filters-icon { flex-shrink: 0; }

.an-search {
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px);
    border-radius: 8px;
    border: 1.5px solid #E8EBF0;
    background: #fff;
    font-size: clamp(13px, 3vw, .82rem);
    /* Prevent iOS zoom */
    font-size: max(16px, clamp(13px, 3vw, 13px));
    font-family: inherit;
    color: #374151;
    outline: none;
    flex: 1;
    min-width: 120px;
    max-width: 100%;
    transition: border .15s;
}
@media (min-width: 768px) {
    .an-search { font-size: .82rem; }
}
.an-search:focus { border-color: #6366F1; }

.an-select {
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px);
    border-radius: 8px;
    border: 1.5px solid #E8EBF0;
    background: #fff;
    font-size: max(16px, clamp(13px, 3vw, 13px));
    font-family: inherit;
    color: #374151;
    cursor: pointer;
    outline: none;
    transition: border .15s;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236366F1' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
    flex-shrink: 0;
}
@media (min-width: 768px) {
    .an-select { font-size: .82rem; }
}
.an-select:focus { border-color: #6366F1; }

.an-clear-btn {
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px);
    border-radius: 8px;
    border: 1.5px solid #E8EBF0;
    background: #fff;
    font-size: clamp(.74rem, 2.5vw, .8rem);
    color: #6B7280;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
}
.an-clear-btn:hover { background: #F9FAFB; }
.an-clear-btn:active { background: #F3F4F6; }

/* ── Announcement list ── */
.an-list {
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 2vw, 12px);
}

/* ── Card ── */
.an-card {
    background: #fff;
    border-radius: clamp(10px, 2.5vw, 14px);
    border: 1px solid #E8EBF0;
    padding: clamp(14px, 3.5vw, 20px) clamp(14px, 4vw, 22px);
    cursor: pointer;
    transition: all .18s;
    position: relative;
    overflow: hidden;
    width: 100%;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.an-card:hover {
    border-color: #C7D2FE;
    box-shadow: 0 4px 20px rgba(99,102,241,.07);
    transform: translateY(-1px);
}
.an-card:active { transform: none; box-shadow: none; }
.an-card.unread   { border-left: 3px solid #6366F1; }
.an-card.pinned   { border-top: 2px solid #F59E0B; }
.an-card.important { background: linear-gradient(135deg, #fff 0%, #FFFBEB 100%); }

/* ── Banners ── */
.an-pinned-banner,
.an-important-banner {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: clamp(.64rem, 2vw, .7rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    margin-bottom: 8px;
}
.an-pinned-banner    { color: #D97706; }
.an-important-banner { color: #DC2626; }

/* ── Card top ── */
.an-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: nowrap;
}
.an-card-title {
    font-size: clamp(.88rem, 3vw, 1rem);
    font-weight: 600;
    color: #111318;
    line-height: 1.35;
    word-break: break-word;
    overflow-wrap: break-word;
    min-width: 0;
    flex: 1;
}
.an-card-title.unread { color: #1e1b4b; }

.an-card-time {
    font-family: 'DM Mono', monospace;
    font-size: clamp(.64rem, 2vw, .72rem);
    color: #9CA3AF;
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: 2px;
}

.an-card-body {
    font-size: clamp(.8rem, 2.5vw, .85rem);
    color: #6B7280;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: clamp(8px, 2vw, 12px);
    word-break: break-word;
}

/* ── Card footer ── */
.an-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
}
.an-card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

/* ── Unread dot ── */
.an-unread-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #6366F1;
    flex-shrink: 0;
    margin-top: 5px;
}

/* ── Chips ── */
.an-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px);
    border-radius: 6px;
    font-size: clamp(.65rem, 2vw, .72rem);
    font-weight: 600;
    white-space: nowrap;
}
.chip-blue    { background: #EFF6FF; color: #1D4ED8; }
.chip-purple  { background: #EEF2FF; color: #4338CA; }
.chip-gray    { background: #F3F4F6; color: #4B5563; }
.chip-amber   { background: #FFFBEB; color: #92400E; }
.chip-green   { background: #F0FDF4; color: #15803D; }
.chip-red     { background: #FFF1F2; color: #BE123C; }

/* ── Read badge ── */
.an-read-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: clamp(.64rem, 2vw, .72rem);
    color: #9CA3AF;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
}

/* ── Empty ── */
.an-empty {
    text-align: center;
    padding: clamp(2rem, 8vw, 4rem) clamp(1rem, 4vw, 2rem);
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E8EBF0;
    color: #9CA3AF;
}
.an-empty-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
}
.an-empty-title {
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
    font-size: clamp(.85rem, 2.5vw, 1rem);
}
.an-empty-sub { font-size: clamp(.74rem, 2.5vw, .82rem); }

/* ── Skeleton ── */
.an-skeleton {
    background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Detail Modal ── */
.an-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.48);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    padding: 0;
}
@media (min-width: 600px) {
    .an-backdrop {
        align-items: center;
        padding: 16px;
    }
}

.an-modal {
    background: #fff;
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 100%;
    max-height: 92vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: clamp(18px, 4vw, 28px);
    -webkit-overflow-scrolling: touch;
}
@media (min-width: 600px) {
    .an-modal {
        border-radius: 18px;
        max-width: 580px;
        max-height: 88vh;
    }
}

/* Modal drag handle — mobile only */
.an-modal-handle {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: #E5E7EB;
    margin: 0 auto 16px;
    display: block;
}
@media (min-width: 600px) {
    .an-modal-handle { display: none; }
}

.an-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: 10px;
}
.an-modal-title {
    font-size: clamp(.95rem, 3.5vw, 1.15rem);
    font-weight: 700;
    color: #111318;
    line-height: 1.35;
    word-break: break-word;
    overflow-wrap: break-word;
    flex: 1;
    min-width: 0;
}
.an-close-btn {
    background: #F3F4F6;
    border: none;
    cursor: pointer;
    width: 36px; height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #6B7280;
    transition: background .15s;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.an-close-btn:hover { background: #E5E7EB; }
.an-close-btn:active { background: #D1D5DB; }

.an-modal-meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #F3F4F6;
    align-items: center;
}

.an-modal-body {
    font-size: clamp(.84rem, 2.5vw, .9rem);
    color: #374151;
    line-height: 1.75;
    white-space: pre-wrap;
    margin-bottom: 20px;
    word-break: break-word;
    overflow-wrap: break-word;
}

.an-modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #F3F4F6;
    flex-wrap: wrap;
    gap: 10px;
}
.an-modal-posted {
    font-size: clamp(.7rem, 2vw, .78rem);
    color: #9CA3AF;
}

.an-read-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: clamp(8px, 2vw, 9px) clamp(14px, 3vw, 18px);
    background: #6366F1;
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: clamp(.8rem, 2.5vw, .85rem);
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    min-height: 40px;
}
.an-read-btn:hover { background: #4F46E5; }
.an-read-btn.done {
    background: #F0FDF4;
    color: #15803D;
    cursor: default;
}

/* ── Expiry warning ── */
.an-expiry {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: clamp(.7rem, 2.5vw, .75rem);
    color: #D97706;
    background: #FFFBEB;
    padding: 6px 10px;
    border-radius: 7px;
    border: 1px solid #FDE68A;
    margin-bottom: 14px;
    flex-wrap: wrap;
}

/* ── Toast ── */
.an-toast {
    position: fixed;
    bottom: clamp(16px, 4vw, 24px);
    right: clamp(12px, 4vw, 24px);
    left: clamp(12px, 4vw, auto);
    z-index: 9999;
    background: #1A1D23;
    color: #fff;
    padding: clamp(10px, 2.5vw, 12px) clamp(14px, 3vw, 20px);
    border-radius: 12px;
    font-size: clamp(.8rem, 2.5vw, .85rem);
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,.2);
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideUp .2s ease;
    max-width: calc(100vw - clamp(24px, 8vw, 48px));
    word-break: break-word;
}
@media (min-width: 480px) {
    .an-toast {
        left: auto;
        max-width: 320px;
    }
}
@keyframes slideUp {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
}

/* ── Responsive: very small screens ── */
@media (max-width: 360px) {
    .an-card-meta .an-chip:nth-child(n+3) { display: none; }
    .an-filters-icon { display: none; }
}
`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const roleChip = (role) => {
    const map = {
        all: { cls: "chip-blue", label: "Everyone" },
        employee: { cls: "chip-green", label: "Employees" },
        hr: { cls: "chip-purple", label: "HR" },
        manager: { cls: "chip-amber", label: "Managers" },
        tl: { cls: "chip-gray", label: "Team Leads" },
    };
    const { cls, label } = map[role] || map.all;
    return (
        <span className={`an-chip ${cls}`}>
            <Icon d={icons.tag} size={10} />{label}
        </span>
    );
};

const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const diff = (new Date(expiresAt) - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 3;
};

/* ─── Detail Modal ───────────────────────────────────────────────────────── */
const AnnouncementModal = ({ announcement, onClose, onRead }) => {
    const [marking, setMarking] = useState(false);

    const handleMarkRead = async () => {
        if (announcement.isRead) return;
        try {
            setMarking(true);
            await API.put(`/announcements/${announcement._id}/read`);
            onRead(announcement._id);
        } catch { /* silent */ }
        finally { setMarking(false); }
    };

    useEffect(() => {
        if (!announcement.isRead) handleMarkRead();
        // Lock scroll on body when modal open
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const expiringSoon = isExpiringSoon(announcement.expiresAt);

    return (
        <div className="an-backdrop" onClick={onClose}>
            <div className="an-modal" onClick={(e) => e.stopPropagation()}>

                {/* Drag handle (mobile) */}
                <span className="an-modal-handle" />

                {/* Header */}
                <div className="an-modal-header">
                    <div className="an-modal-title">{announcement.title}</div>
                    <button className="an-close-btn" onClick={onClose} aria-label="Close">
                        <Icon d={icons.close} size={16} />
                    </button>
                </div>

                {/* Banners */}
                {announcement.pinned && (
                    <div className="an-pinned-banner">
                        <Icon d={icons.pin} size={12} color="#D97706" />
                        Pinned announcement
                    </div>
                )}
                {announcement.important && (
                    <div className="an-important-banner">
                        <Icon d={icons.alert} size={12} color="#DC2626" />
                        Important
                    </div>
                )}

                {/* Meta */}
                <div className="an-modal-meta">
                    {roleChip(announcement.targetRole)}
                    <span className="an-chip chip-gray">
                        <Icon d={icons.user} size={10} />
                        {announcement.createdBy?.name || "—"}
                    </span>
                    <span className="an-chip chip-gray">
                        <Icon d={icons.calendar} size={10} />
                        {timeAgo(announcement.createdAt)}
                    </span>
                </div>

                {/* Expiry warning */}
                {expiringSoon && (
                    <div className="an-expiry">
                        <Icon d={icons.clock} size={13} color="#D97706" />
                        Expires on {formatDate(announcement.expiresAt)}
                    </div>
                )}

                {/* Body */}
                <div className="an-modal-body">{announcement.body}</div>

                {/* Footer */}
                <div className="an-modal-footer">
                    <span className="an-modal-posted">
                        Posted {formatDate(announcement.createdAt)}
                    </span>
                    <button
                        className={`an-read-btn ${announcement.isRead ? "done" : ""}`}
                        onClick={handleMarkRead}
                        disabled={marking || announcement.isRead}
                    >
                        <Icon
                            d={icons.check}
                            size={14}
                            color={announcement.isRead ? "#15803D" : "#fff"}
                        />
                        {announcement.isRead ? "Read" : marking ? "Marking…" : "Mark as read"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Skeleton Card ──────────────────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="an-card" style={{ cursor: "default", pointerEvents: "none" }}>
        <div className="an-skeleton" style={{ height: 16, width: "65%", marginBottom: 10 }} />
        <div className="an-skeleton" style={{ height: 12, width: "100%", marginBottom: 6 }} />
        <div className="an-skeleton" style={{ height: 12, width: "75%", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
            <div className="an-skeleton" style={{ height: 20, width: 70 }} />
            <div className="an-skeleton" style={{ height: 20, width: 70 }} />
        </div>
    </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [readFilter, setReadFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState("");

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await API.get("/announcements");
            const list = res.data.announcements || [];
            list.sort((a, b) => {
                if (a.pinned !== b.pinned) return b.pinned - a.pinned;
                if (a.important !== b.important) return b.important - a.important;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setAnnouncements(list);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchAnnouncements();
        socket.off("newAnnouncement");
        socket.on("newAnnouncement", (newItem) => {
            setAnnouncements(prev => {
                if (prev.some(a => a._id === newItem._id)) return prev;
                return [newItem, ...prev];
            });
            showToast(`📢 ${newItem.title}`);
        });
        return () => socket.off("newAnnouncement");
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(prev => prev === msg ? "" : prev), 3000);
    };

    const handleRead = async (id) => {
        try {
            await API.put(`/announcements/${id}/read`);
            setAnnouncements(prev =>
                prev.map(a => a._id === id ? { ...a, isRead: true } : a)
            );
            showToast("Marked as read");
        } catch { }
    };

    const stats = useMemo(() => ({
        total: announcements.length,
        unread: announcements.filter(a => !a.isRead).length,
        pinned: announcements.filter(a => a.pinned).length,
    }), [announcements]);

    const filtered = useMemo(() => {
        let list = announcements;
        if (readFilter === "unread") list = list.filter(a => !a.isRead);
        if (readFilter === "read") list = list.filter(a => a.isRead);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.body.toLowerCase().includes(q)
            );
        }
        return list.sort((a, b) => {
            if (a.isRead !== b.isRead) return a.isRead - b.isRead;
            return 0;
        });
    }, [announcements, readFilter, search]);

    const statCards = [
        { label: "Total", value: stats.total, color: "blue" },
        { label: "Unread", value: stats.unread, color: "red" },
        { label: "Pinned", value: stats.pinned, color: "green" },
    ];

    return (
        <>
            <style>{css}</style>

            {/* Toast */}
            {toast && (
                <div className="an-toast">
                    <Icon d={icons.check} size={14} color="#4ADE80" /> {toast}
                </div>
            )}

            <DashboardLayout>
                <div className="an-root">

                    {/* Header */}
                    <div className="an-header">
                        <div>
                            <h1>Announcements</h1>
                            <p>Company notices and updates</p>
                        </div>
                        <button className="an-refresh-btn" onClick={fetchAnnouncements}>
                            <Icon d={icons.refresh} size={14} /> Refresh
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="an-stats">
                        {statCards.map(s => (
                            <div key={s.label} className={`an-stat ${s.color}`}>
                                <div className="an-stat-label">{s.label}</div>
                                <div className="an-stat-val">{loading ? "—" : s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="an-filters">
                        <span className="an-filters-icon">
                            <Icon d={icons.filter} size={15} color="#9CA3AF" />
                        </span>

                        <input
                            className="an-search"
                            placeholder="Search announcements…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        <select
                            className="an-select"
                            value={readFilter}
                            onChange={e => setReadFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>

                        {(readFilter !== "all" || search) && (
                            <button
                                className="an-clear-btn"
                                onClick={() => { setReadFilter("all"); setSearch(""); }}
                            >
                                <Icon d={icons.close} size={12} /> Clear
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="an-list">

                        {loading && Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}

                        {!loading && filtered.length === 0 && (
                            <div className="an-empty">
                                <div className="an-empty-icon">
                                    <Icon d={icons.inbox} size={24} color="#9CA3AF" />
                                </div>
                                <p className="an-empty-title">No announcements</p>
                                <p className="an-empty-sub">
                                    {search || readFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "No announcements posted yet"}
                                </p>
                            </div>
                        )}

                        {!loading && filtered.map(a => {
                            const cardClass = [
                                "an-card",
                                !a?.isRead ? "unread" : "",
                                a?.pinned ? "pinned" : "",
                                a?.important ? "important" : "",
                            ].filter(Boolean).join(" ");

                            return (
                                <div
                                    key={a?._id || Math.random()}
                                    className={cardClass}
                                    onClick={() => setSelected(a)}
                                >
                                    {a?.pinned && (
                                        <div className="an-pinned-banner">
                                            <Icon d={icons.pin} size={11} color="#D97706" />
                                            Pinned
                                        </div>
                                    )}
                                    {a?.important && !a?.pinned && (
                                        <div className="an-important-banner">
                                            <Icon d={icons.alert} size={11} color="#DC2626" />
                                            Important
                                        </div>
                                    )}

                                    <div className="an-card-top">
                                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                                            {!a?.isRead && <div className="an-unread-dot" />}
                                            <div className={`an-card-title ${!a?.isRead ? "unread" : ""}`}>
                                                {a?.title || "No Title"}
                                            </div>
                                        </div>
                                        <span className="an-card-time">
                                            {a?.createdAt ? timeAgo(a.createdAt) : ""}
                                        </span>
                                    </div>

                                    <div className="an-card-body">{a?.body || ""}</div>

                                    <div className="an-card-footer">
                                        <div className="an-card-meta">
                                            {roleChip(a?.targetRole)}
                                            <span className="an-chip chip-gray">
                                                <Icon d={icons.user} size={10} />
                                                {a?.createdBy?.name || "—"}
                                            </span>
                                            {isExpiringSoon(a?.expiresAt) && (
                                                <span className="an-chip chip-amber">
                                                    <Icon d={icons.clock} size={10} />
                                                    Expiring soon
                                                </span>
                                            )}
                                        </div>

                                        {a?.isRead ? (
                                            <span className="an-read-badge">
                                                <Icon d={icons.check} size={12} color="#9CA3AF" />
                                                Read
                                            </span>
                                        ) : (
                                            <span className="an-chip chip-purple" style={{ fontSize: ".68rem" }}>
                                                New
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detail modal */}
                {selected && (
                    <AnnouncementModal
                        announcement={selected}
                        onClose={() => setSelected(null)}
                        onRead={(id) => {
                            handleRead(id);
                            setSelected(prev => prev ? { ...prev, isRead: true } : prev);
                        }}
                    />
                )}
            </DashboardLayout>
        </>
    );
};

export default Announcements;