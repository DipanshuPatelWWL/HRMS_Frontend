import { useEffect, useRef, useState, useCallback } from "react";
import API from "../../services/api";
import socket from "../../socket";
import { toast } from "react-toastify";

/* ─── Bell SVG ───────────────────────────────────────────────────────────── */
const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

/* ─── Notification type config ───────────────────────────────────────────── */
const TYPE_CONFIG = {
    announcement: { icon: "📢", label: "Announcement", color: "#7c3aed" },
    leave_applied: { icon: "📋", label: "Leave Request", color: "#0369a1" },
    leave_approved: { icon: "✅", label: "Leave Approved", color: "#059669" },
    leave_rejected: { icon: "❌", label: "Leave Rejected", color: "#dc2626" },
    task_assigned: { icon: "📌", label: "Task Assigned", color: "#d97706" },
    task_updated: { icon: "🔄", label: "Task Updated", color: "#0369a1" },
    task_done: { icon: "🎉", label: "Task Completed", color: "#059669" },
    ticket_replied: { icon: "💬", label: "Ticket Reply", color: "#7c3aed" },
    ticket_resolved: { icon: "🔒", label: "Ticket Resolved", color: "#059669" },
    payroll: { icon: "💰", label: "Payroll", color: "#059669" },
    general: { icon: "🔔", label: "Notification", color: "#64748b" },
};

const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.general;

/* ─── Time formatter ─────────────────────────────────────────────────────── */
const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = `
.nb-wrap { position: relative; }

/* Bell button */
.nb-btn {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    color: var(--text-2, #64748b);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
}
.nb-btn:hover { background: var(--bg-2, #f1f5f9); color: var(--text-1, #1e293b); }

/* Badge */
.nb-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 17px;
    height: 17px;
    border-radius: 999px;
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    pointer-events: none;
    animation: nb-pop 0.25s cubic-bezier(0.22,1,0.36,1) both;
    border: 2px solid var(--bg-1, #fff);
}

/* Bell ring animation */
@keyframes nb-ring {
    0%,100% { transform: rotate(0); }
    10%,30%,50% { transform: rotate(-12deg); }
    20%,40%,60% { transform: rotate(12deg); }
    70% { transform: rotate(0); }
}
.nb-btn.ringing svg { animation: nb-ring 0.7s ease; }

@keyframes nb-pop {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
}

/* Dropdown panel */
/* REPLACE in styles */
.nb-panel {
    position: fixed;        /* ← change from absolute to fixed */
    top: 56px;              /* ← just below topnav */
    left: 8px;              /* ← pin to left edge */
    right: 8px;             /* ← pin to right edge */
    width: auto;            /* ← let left+right control width */
    max-width: 100%;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(30,30,46,0.14), 0 4px 12px rgba(30,30,46,0.06);
    z-index: 9999;
    overflow: hidden;
    animation: nb-slide 0.22s cubic-bezier(0.22,1,0.36,1) both;
}

/* Keep desktop behavior */
@media (min-width: 769px) {
    .nb-panel {
        position: absolute;
        top: calc(100% + 8px);
        left: auto;
        right: 0;
        width: 360px;
        max-width: 94vw;
    }
}


@keyframes nb-slide {
    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Panel header */
.nb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 12px;
    border-bottom: 1px solid #f1f5f9;
    position: sticky;    /* ← keep header pinned */
    top: 0;
    background: #fff;
    z-index: 1;
}
.nb-head-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: #1e1e2e;
    display: flex;
    align-items: center;
    gap: 7px;
}
.nb-unread-pill {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 100px;
}
.nb-mark-all {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #7c3aed;
    font-weight: 700;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.15s;
}
.nb-mark-all:hover { background: #f5f3ff; }

/* Filter tabs */
.nb-filters {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafafa;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;   /* ← smooth iOS scroll */
    scrollbar-width: none;               /* ← hide scrollbar Firefox */
}

.nb-filters::-webkit-scrollbar {
    display: none;                       /* ← hide scrollbar Chrome/Safari */
}
.nb-filter-btn {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1.5px solid transparent;
    background: transparent;
    font-size: 0.73rem;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
}
.nb-filter-btn.active {
    background: #fff;
    border-color: #e2e8f0;
    color: #1e1e2e;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.nb-filter-btn:hover:not(.active) { color: #334155; background: #f1f5f9; }

/* List */
.nb-list {
    max-height: 380px;
    overflow-y: auto;
}

@media (max-width: 768px) {
    .nb-list {
        max-height: 45vh;   /* ← proportional to screen height */
    }
}


.nb-list::-webkit-scrollbar { width: 4px; }
.nb-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

/* Item */
.nb-item {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f8fafc;
    transition: background 0.14s;
    align-items: flex-start;
    position: relative;
}

@media (max-width: 768px) {
    .nb-item {
        padding: 14px 16px;   /* ← slightly more vertical padding */
    }

    .nb-item-title {
        font-size: 0.85rem;   /* ← slightly larger for readability */
        white-space: normal;  /* ← allow wrapping on mobile */
    }

    .nb-item-body {
        font-size: 0.8rem;
    }
}

.nb-item:last-child { border-bottom: none; }
.nb-item:hover { background: #f8fafc; }
.nb-item.unread { background: #faf5ff; }
.nb-item.unread:hover { background: #f5f0fe; }

/* Unread dot */
.nb-item.unread::after {
    content: '';
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #7c3aed;
}

/* Icon circle */
.nb-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f5f3ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
}

/* Content */
.nb-content { flex: 1; min-width: 0; padding-right: 14px; }
.nb-item-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: #1e1e2e;
    margin: 0 0 2px;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nb-item-body {
    font-size: 0.77rem;
    color: #64748b;
    margin: 0 0 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
}
.nb-item-meta {
    display: flex;
    align-items: center;
    gap: 6px;
}
.nb-item-time { font-size: 0.7rem; color: #94a3b8; }
.nb-item-type {
    font-size: 0.66rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    background: #f1f5f9;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* Empty */
.nb-empty {
    padding: 2.5rem 1rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.83rem;
}
.nb-empty-icon { font-size: 2rem; margin-bottom: 8px; }

/* Footer */
.nb-footer {
    padding: 10px 16px;
    border-top: 1px solid #f1f5f9;
    background: #fafafa;
    display: flex;
    justify-content: center;
}
.nb-clear-btn {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
}
.nb-clear-btn:hover { color: #dc2626; background: #fee2e2; }
`;

/* ─── Component ──────────────────────────────────────────────────────────── */
const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [ringing, setRinging] = useState(false);
    const [filter, setFilter] = useState("all");

    const dropRef = useRef(null);
    const audioRef = useRef(null);
    const isInit = useRef(false);

    /* ── Play sound ── */
    const playSound = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { });
    }, []);

    /* ── Ring bell ── */
    const ringBell = useCallback(() => {
        setRinging(true);
        setTimeout(() => setRinging(false), 700);
    }, []);

    /* ── Add incoming notification ── */
    const addNotification = useCallback((item) => {
        const cfg = getConfig(item.type);
        setItems(prev => {
            if (prev.some(n => n._id === item._id)) return prev;
            return [{ ...item, isRead: false }, ...prev];
        });
        ringBell();
        playSound();
        toast.info(
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: "0.84rem", color: cfg.color }}>
                        {cfg.label}
                    </div>
                    <div style={{ fontSize: "0.8rem" }}>{item.title || item.message}</div>
                </div>
            </div>,
            { autoClose: 4000, position: "top-right" }
        );
    }, [ringBell, playSound]);

    /* ── Fetch all notifications ── */
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await API.get("/notifications");
            setItems(res.data.data || []);
        } catch { }
    }, []);

    /* ── Mount: fetch + socket listeners ── */
    useEffect(() => {
        fetchNotifications();

        /* All socket events that should trigger a notification */
        const SOCKET_EVENTS = [
            "newAnnouncement",
            "updatedAnnouncement",
            "leaveApplied",
            "leaveApproved",
            "leaveRejected",
            "taskAssigned",
            "taskUpdated",
            "taskCompleted",
            "ticketReplied",
            "ticketResolved",
            "payrollGenerated",
            "newNotification",          // generic catch-all
        ];

        const handlers = {};

        SOCKET_EVENTS.forEach(event => {
            const handler = (data) => {
                /* Normalise payload to notification shape */
                const notification = {
                    _id: data._id || data.notificationId || `${event}-${Date.now()}`,
                    type: data.type || eventToType(event),
                    title: data.title || data.subject || eventToTitle(event, data),
                    message: data.body || data.message || data.description || "",
                    isRead: false,
                    createdAt: data.createdAt || new Date().toISOString(),
                    ...data,
                };
                addNotification(notification);
            };
            handlers[event] = handler;
            socket.on(event, handler);
        });

        isInit.current = true;

        return () => {
            SOCKET_EVENTS.forEach(event => socket.off(event, handlers[event]));
        };
    }, [fetchNotifications, addNotification]);

    /* ── Polling fallback (30s) ── */
    useEffect(() => {
        const id = setInterval(fetchNotifications, 30000);
        return () => clearInterval(id);
    }, [fetchNotifications]);

    /* ── Close on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── Mark one read ── */
    const markRead = async (id) => {
        try {
            await API.put(`/notifications/${id}`);
            setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch { }
    };

    /* ── Mark all read ── */
    const markAll = async () => {
        try {
            await API.put("/notifications/mark-all-read");
            setItems(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { }
    };

    /* ── Clear all (local only — extend with API if needed) ── */
    const clearAll = async () => {
        try {
            await API.delete("/notifications/clear");
            setItems([]);
        } catch { }
    };

    /* ── Derived ── */
    const unreadCount = items.filter(n => !n.isRead).length;

    const FILTERS = ["all", "announcement", "leave_approved", "leave_rejected", "task_assigned", "ticket_replied"];

    const displayed = filter === "all"
        ? items
        : items.filter(n => n.type === filter);

    return (
        <>
            <style>{styles}</style>
            {/* Notification sound — use a short beep */}
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />
            {/*
              Since we can't embed a real audio file in JSX here,
              replace the src with your actual sound file path:
              src="/notification.mp3"
            */}

            <div className="nb-wrap" ref={dropRef}>
                <button
                    className={`nb-btn ${ringing ? "ringing" : ""}`}
                    onClick={() => setOpen(o => !o)}
                    title="Notifications"
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                >
                    <BellIcon />
                    {unreadCount > 0 && (
                        <span className="nb-badge">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                {open && (
                    <div className="nb-panel">
                        {/* Header */}
                        <div className="nb-head">
                            <span className="nb-head-title">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="nb-unread-pill">{unreadCount} new</span>
                                )}
                            </span>
                            <div style={{ display: "flex", gap: 4 }}>
                                {unreadCount > 0 && (
                                    <button className="nb-mark-all" onClick={markAll}>
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter tabs */}
                        <div className="nb-filters">
                            {FILTERS.map(f => (
                                <button
                                    key={f}
                                    className={`nb-filter-btn ${filter === f ? "active" : ""}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === "all" ? "All" : getConfig(f).label}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="nb-list">
                            {displayed.length === 0 ? (
                                <div className="nb-empty">
                                    <div className="nb-empty-icon">🔔</div>
                                    <div>
                                        {filter === "all"
                                            ? "No notifications yet"
                                            : `No ${getConfig(filter).label} notifications`}
                                    </div>
                                </div>
                            ) : (
                                displayed.map(n => {
                                    const cfg = getConfig(n.type);
                                    return (
                                        <div
                                            key={n._id}
                                            className={`nb-item ${!n.isRead ? "unread" : ""}`}
                                            onClick={() => markRead(n._id)}
                                        >
                                            <div
                                                className="nb-icon"
                                                style={{ background: `${cfg.color}15` }}
                                            >
                                                {cfg.icon}
                                            </div>
                                            <div className="nb-content">
                                                <p className="nb-item-title">{n.title}</p>
                                                {n.message && (
                                                    <p className="nb-item-body">{n.message}</p>
                                                )}
                                                <div className="nb-item-meta">
                                                    <span className="nb-item-time">
                                                        {timeAgo(n.createdAt)}
                                                    </span>
                                                    <span className="nb-item-type">{cfg.label}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="nb-footer">
                                <button className="nb-clear-btn" onClick={clearAll}>
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function eventToType(event) {
    const map = {
        newAnnouncement: "announcement",
        updatedAnnouncement: "announcement",
        leaveApplied: "leave_applied",
        leaveApproved: "leave_approved",
        leaveRejected: "leave_rejected",
        taskAssigned: "task_assigned",
        taskUpdated: "task_updated",
        taskCompleted: "task_done",
        ticketReplied: "ticket_replied",
        ticketResolved: "ticket_resolved",
        payrollGenerated: "payroll",
    };
    return map[event] || "general";
}

function eventToTitle(event, data) {
    const map = {
        newAnnouncement: `New announcement: ${data.title || ""}`,
        updatedAnnouncement: `Announcement updated: ${data.title || ""}`,
        leaveApplied: `Leave request from ${data.userName || "employee"}`,
        leaveApproved: "Your leave was approved",
        leaveRejected: "Your leave was rejected",
        taskAssigned: `New task: ${data.title || ""}`,
        taskUpdated: `Task updated: ${data.title || ""}`,
        taskCompleted: `Task completed: ${data.title || ""}`,
        ticketReplied: `Reply on ticket ${data.ticketId || ""}`,
        ticketResolved: `Ticket resolved: ${data.ticketId || ""}`,
        payrollGenerated: "Payslip generated",
    };
    return map[event] || "New notification";
}

export default NotificationBell;