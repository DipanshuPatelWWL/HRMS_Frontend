import { useEffect, useState, useMemo } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import socket from "../../socket";

/* ─── Tabler Icon ────────────────────────────────────────────────────────── */
const TI = ({ name, size = 16, style = {} }) => (
    <i
        className={`ti ti-${name}`}
        style={{ fontSize: size, lineHeight: 1, display: "inline-flex", alignItems: "center", ...style }}
        aria-hidden="true"
    />
);

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

.an-root *,
.an-root *::before,
.an-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

.an-root {
    font-family: 'DM Sans', sans-serif;
    background: #f8f7ff;
    color: #0F1117;
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
    color: #0F1117;
}
.an-header p {
    font-size: clamp(.75rem, 2.5vw, .825rem);
    color: #4B5563;
    margin-top: 2px;
}

.an-refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 14px);
    border-radius: 9px;
    border: 1.5px solid #9CA3AF;
    background: #fff;
    font-size: clamp(.75rem, 2.5vw, .82rem);
    color: #1F2937;
    cursor: pointer;
    font-family: inherit;
    transition: all .15s;
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
    font-weight: 500;
}
.an-refresh-btn:hover { background: #F3F4F6; border-color: #6B7280; }
.an-refresh-btn:active { background: #E5E7EB; }

/* ── Stats ── */
.an-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(8px, 2vw, 14px);
    margin-bottom: clamp(16px, 3vw, 24px);
}
@media (max-width: 320px) {
    .an-stats { grid-template-columns: 1fr; }
}

.an-stat {
    background: #fff;
    border-radius: clamp(10px, 2.5vw, 14px);
    padding: clamp(12px, 3vw, 18px) clamp(14px, 3vw, 20px);
    border: 1.5px solid #D1D5DB;
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
.an-stat.blue::before   { background: #2563EB; }
.an-stat.red::before    { background: #DC2626; }
.an-stat.green::before  { background: #16A34A; }

.an-stat-label {
    font-size: clamp(.6rem, 2vw, .72rem);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #374151;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.an-stat-val {
    font-size: clamp(1.5rem, 5vw, 2.2rem);
    font-weight: 700;
    letter-spacing: -1.5px;
    color: #0F1117;
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
.an-filters-icon { flex-shrink: 0; color: #374151; }

.an-search {
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px);
    border-radius: 8px;
    border: 1.5px solid #9CA3AF;
    background: #fff;
    font-size: max(16px, clamp(13px, 3vw, 13px));
    font-family: inherit;
    color: #111827;
    outline: none;
    flex: 1;
    min-width: 120px;
    max-width: 100%;
    transition: border .15s;
}
@media (min-width: 768px) {
    .an-search { font-size: .82rem; }
}
.an-search:focus { border-color: #4338CA; }
.an-search::placeholder { color: #6B7280; }

.an-select {
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px);
    border-radius: 8px;
    border: 1.5px solid #9CA3AF;
    background: #fff;
    font-size: max(16px, clamp(13px, 3vw, 13px));
    font-family: inherit;
    color: #111827;
    cursor: pointer;
    outline: none;
    transition: border .15s;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234338CA' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
    flex-shrink: 0;
}
@media (min-width: 768px) {
    .an-select { font-size: .82rem; }
}
.an-select:focus { border-color: #4338CA; }

.an-clear-btn {
    padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px);
    border-radius: 8px;
    border: 1.5px solid #9CA3AF;
    background: #fff;
    font-size: clamp(.74rem, 2.5vw, .8rem);
    color: #1F2937;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
    font-weight: 500;
}
.an-clear-btn:hover { background: #F3F4F6; border-color: #6B7280; }
.an-clear-btn:active { background: #E5E7EB; }

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
    border: 1.5px solid #D1D5DB;
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
    border-color: #6366F1;
    box-shadow: 0 4px 20px rgba(99,102,241,.09);
    transform: translateY(-1px);
}
.an-card:active { transform: none; box-shadow: none; }
.an-card.unread   { border-left: 3px solid #4338CA; }
.an-card.pinned   { border-top: 2px solid #B45309; }
.an-card.important { background: #FFFBEB; }

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
.an-pinned-banner    { color: #92400E; }
.an-important-banner { color: #991B1B; }

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
    color: #111827;
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
    color: #4B5563;
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: 2px;
}

.an-card-body {
    font-size: clamp(.8rem, 2.5vw, .85rem);
    color: #374151;
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
    background: #4338CA;
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
.chip-blue    { background: #DBEAFE; color: #1E3A8A; border: 1px solid #BFDBFE; }
.chip-purple  { background: #EDE9FE; color: #3730A3; border: 1px solid #DDD6FE; }
.chip-gray    { background: #F3F4F6; color: #1F2937; border: 1px solid #D1D5DB; }
.chip-amber   { background: #FEF3C7; color: #78350F; border: 1px solid #FDE68A; }
.chip-green   { background: #DCFCE7; color: #14532D; border: 1px solid #BBF7D0; }
.chip-red     { background: #FFE4E6; color: #881337; border: 1px solid #FECDD3; }

/* ── Read badge ── */
.an-read-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: clamp(.64rem, 2vw, .72rem);
    color: #374151;
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
    border: 1.5px solid #D1D5DB;
    color: #374151;
}
.an-empty-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: #F3F4F6;
    border: 1.5px solid #D1D5DB;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #374151;
}
.an-empty-title {
    font-weight: 600;
    color: #111827;
    margin-bottom: 6px;
    font-size: clamp(.85rem, 2.5vw, 1rem);
}
.an-empty-sub { font-size: clamp(.74rem, 2.5vw, .82rem); color: #4B5563; }

/* ── Skeleton ── */
.an-skeleton {
    background: linear-gradient(90deg, #E5E7EB 25%, #D1D5DB 50%, #E5E7EB 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Detail Modal ── */
.an-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.55);
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
    border: 1.5px solid #9CA3AF;
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

.an-modal-handle {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: #9CA3AF;
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
    color: #0F1117;
    line-height: 1.35;
    word-break: break-word;
    overflow-wrap: break-word;
    flex: 1;
    min-width: 0;
}
.an-close-btn {
    background: #F3F4F6;
    border: 1.5px solid #D1D5DB;
    cursor: pointer;
    width: 36px; height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #1F2937;
    transition: background .15s;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.an-close-btn:hover { background: #E5E7EB; border-color: #9CA3AF; }
.an-close-btn:active { background: #D1D5DB; }

.an-modal-meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1.5px solid #D1D5DB;
    align-items: center;
}

.an-modal-body {
    font-size: clamp(.84rem, 2.5vw, .9rem);
    color: #1F2937;
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
    border-top: 1.5px solid #D1D5DB;
    flex-wrap: wrap;
    gap: 10px;
}
.an-modal-posted {
    font-size: clamp(.7rem, 2vw, .78rem);
    color: #4B5563;
}

.an-read-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: clamp(8px, 2vw, 9px) clamp(14px, 3vw, 18px);
    background: #4338CA;
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
.an-read-btn:hover { background: #3730A3; }
.an-read-btn.done {
    background: #DCFCE7;
    color: #14532D;
    border: 1.5px solid #BBF7D0;
    cursor: default;
}

/* ── Expiry warning ── */
.an-expiry {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: clamp(.7rem, 2.5vw, .75rem);
    color: #78350F;
    background: #FEF3C7;
    padding: 6px 10px;
    border-radius: 7px;
    border: 1.5px solid #FCD34D;
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
    background: #111827;
    color: #F9FAFB;
    padding: clamp(10px, 2.5vw, 12px) clamp(14px, 3vw, 20px);
    border-radius: 12px;
    border: 1px solid #374151;
    font-size: clamp(.8rem, 2.5vw, .85rem);
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,.25);
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
        all: { cls: "chip-blue", label: "Everyone", icon: "users" },
        employee: { cls: "chip-green", label: "Employees", icon: "user-check" },
        hr: { cls: "chip-purple", label: "HR", icon: "heart-handshake" },
        manager: { cls: "chip-amber", label: "Managers", icon: "briefcase" },
        tl: { cls: "chip-gray", label: "Team Leads", icon: "award" },
    };
    const { cls, label, icon } = map[role] || map.all;
    return (
        <span className={`an-chip ${cls}`}>
            <TI name={icon} size={11} />{label}
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
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const expiringSoon = isExpiringSoon(announcement.expiresAt);

    return (
        <div className="an-backdrop" onClick={onClose}>
            <div className="an-modal" onClick={(e) => e.stopPropagation()}>

                <span className="an-modal-handle" />

                <div className="an-modal-header">
                    <div className="an-modal-title">{announcement.title}</div>
                    <button className="an-close-btn" onClick={onClose} aria-label="Close">
                        <TI name="x" size={16} />
                    </button>
                </div>

                {announcement.pinned && (
                    <div className="an-pinned-banner">
                        <TI name="pin" size={13} style={{ color: "#92400E" }} />
                        Pinned announcement
                    </div>
                )}
                {announcement.important && (
                    <div className="an-important-banner">
                        <TI name="alert-triangle" size={13} style={{ color: "#991B1B" }} />
                        Important
                    </div>
                )}

                <div className="an-modal-meta">
                    {roleChip(announcement.targetRole)}
                    <span className="an-chip chip-gray">
                        <TI name="user" size={11} />
                        {announcement.createdBy?.name || "—"}
                    </span>
                    <span className="an-chip chip-gray">
                        <TI name="calendar" size={11} />
                        {timeAgo(announcement.createdAt)}
                    </span>
                </div>

                {expiringSoon && (
                    <div className="an-expiry">
                        <TI name="clock" size={14} style={{ color: "#78350F" }} />
                        Expires on {formatDate(announcement.expiresAt)}
                    </div>
                )}

                <div className="an-modal-body">{announcement.body}</div>

                <div className="an-modal-footer">
                    <span className="an-modal-posted">
                        <TI name="calendar-event" size={13} style={{ marginRight: 4, verticalAlign: -2, color: "#4B5563" }} />
                        Posted {formatDate(announcement.createdAt)}
                    </span>
                    <button
                        className={`an-read-btn ${announcement.isRead ? "done" : ""}`}
                        onClick={handleMarkRead}
                        disabled={marking || announcement.isRead}
                    >
                        <TI
                            name={announcement.isRead ? "circle-check" : "check"}
                            size={15}
                            style={{ color: announcement.isRead ? "#14532D" : "#fff" }}
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
            showToast(`New announcement: ${newItem.title}`);
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
        { label: "Total", value: stats.total, color: "blue", icon: "layout-list" },
        { label: "Unread", value: stats.unread, color: "red", icon: "bell" },
        { label: "Pinned", value: stats.pinned, color: "green", icon: "pin" },
    ];

    return (
        <>
            <style>{css}</style>

            {toast && (
                <div className="an-toast">
                    <TI name="circle-check" size={15} style={{ color: "#4ADE80", flexShrink: 0 }} />
                    {toast}
                </div>
            )}

            <DashboardLayout>
                <div className="an-root">

                    {/* Header */}
                    <div className="an-header">
                        <div>
                            <h1>
                                <TI name="speakerphone" size={22} style={{ marginRight: 8, verticalAlign: -3, color: "#4338CA" }} />
                                Announcements
                            </h1>
                            <p>Company notices and updates</p>
                        </div>
                        <button className="an-refresh-btn" onClick={fetchAnnouncements}>
                            <TI name="refresh" size={15} /> Refresh
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
                            <TI name="filter" size={16} />
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
                                <TI name="x" size={13} /> Clear
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
                                    <TI name="inbox" size={26} />
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
                                            <TI name="pin" size={12} style={{ color: "#92400E" }} />
                                            Pinned
                                        </div>
                                    )}
                                    {a?.important && !a?.pinned && (
                                        <div className="an-important-banner">
                                            <TI name="alert-triangle" size={12} style={{ color: "#991B1B" }} />
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
                                                <TI name="user" size={11} />
                                                {a?.createdBy?.name || "—"}
                                            </span>
                                            {isExpiringSoon(a?.expiresAt) && (
                                                <span className="an-chip chip-amber">
                                                    <TI name="clock" size={11} />
                                                    Expiring soon
                                                </span>
                                            )}
                                        </div>

                                        {a?.isRead ? (
                                            <span className="an-read-badge">
                                                <TI name="circle-check" size={13} style={{ color: "#374151" }} />
                                                Read
                                            </span>
                                        ) : (
                                            <span className="an-chip chip-purple" style={{ fontSize: ".68rem" }}>
                                                <TI name="sparkles" size={10} />
                                                New
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

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