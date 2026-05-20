import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import socket from "../../socket";
import AnnouncementForm from "../../components/announcements/AnnouncementForm";
import AnnouncementCard from "../../components/announcements/AnnouncementCard";
import AnalyticsModal from "../../components/announcements/AnalyticsModal";
import DashboardLayout from "../../components/layout/DashboardLayout";

const styles = `
  * { box-sizing: border-box; }

  .ann-page {
    min-height: 100vh;
    background: #f0f2f8;
    font-family: 'Nunito', sans-serif;
    color: #1e1e2e;
    padding: 36px 32px 60px;
    max-width: 920px;
    margin: 0 auto;
  }

  .ann-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
    animation: fadeSlideDown 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }

  .ann-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 2.75rem;
    letter-spacing: -0.04em;
    margin: 0;
    color: #1e1e2e;
  }

 @media (max-width:480px) {
 .ann-title {
    font-family: 'Syne', sans-serif;
    font-weight: bold;
    font-size: 1.4rem;
    letter-spacing: -0.04em;
    margin: 0;
    color: #1e1e2e;
}}


 @media (max-width:860px) {
 .ann-title {
    font-family: 'Syne', sans-serif;
    font-weight: bold;
    font-size: 2.4rem;
    letter-spacing: -0.04em;
    margin: 0;
    color: #1e1e2e;
}}

  .ann-title span {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ann-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ann-count-badge {
    background: #1e1e2e;
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 8px 20px;
    border-radius: 100px;
  }

  @media (max-width:480px){
   .ann-count-badge {
    background: #1e1e2e;
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-weight: 500;
    font-size: 0.60rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
  }
  }

  .ann-unread-badge {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 8px 16px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .ann-tabs {
    display: flex;
    gap: 4px;
    background: #fff;
    border: 1.5px solid #e8eaf2;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 24px;
    animation: fadeSlideDown 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both;
    width: fit-content;
  }

  .ann-tab {
    padding: 8px 20px;
    border-radius: 9px;
    border: none;
    background: transparent;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ann-tab.active {
    background: #1e1e2e;
    color: #fff;
  }
  .ann-tab:hover:not(.active) {
    background: #f1f5f9;
    color: #334155;
  }

  .ann-list { display: flex; flex-direction: column; gap: 14px; }

  .ann-list-item {
    animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }

  .ann-empty {
    text-align: center;
    padding: 64px 0;
    color: #94a3b8;
    font-size: 0.95rem;
  }
  .ann-empty-icon { font-size: 2.8rem; display: block; margin-bottom: 12px; }

  .ann-skeleton {
    background: #fff;
    border: 1.5px solid #e8eaf2;
    border-radius: 18px;
    padding: 20px 22px;
    margin-bottom: 14px;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .ann-skel-line {
    background: #f1f5f9;
    border-radius: 6px;
    margin-bottom: 10px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const SkeletonCard = () => (
    <div className="ann-skeleton">
        <div className="ann-skel-line" style={{ width: "55%", height: 18 }} />
        <div className="ann-skel-line" style={{ width: "90%", height: 13 }} />
        <div className="ann-skel-line" style={{ width: "75%", height: 13 }} />
        <div className="ann-skel-line" style={{ width: "40%", height: 13, marginBottom: 0 }} />
    </div>
);

const AnnouncementsPage = () => {
    const [data, setData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    // HR can toggle between "Mine" and "All"
    const [viewMode, setViewMode] = useState("mine"); // "mine" | "all"
    const [editTarget, setEditTarget] = useState(null);

    const user = JSON.parse(localStorage.getItem("user"));
    const isHR = ["hr", "manager", "superadmin"].includes(user?.role);

    // ---------- fetch helpers ----------

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await API.get("/announcements/unread-count");
            setUnreadCount(res.data.count ?? 0);
        } catch { /* silent */ }
    }, []);

    // GET /announcements        → role-filtered list for current user
    // GET /announcements/all    → full list for HR/manager
    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint =
                isHR && viewMode === "all" ? "/announcements/all" : "/announcements";
            const res = await API.get(endpoint);
            setData(res.data.announcements ?? []);
        } catch {
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [isHR, viewMode]);

    // GET /users  → for the employee multi-select in the form
    const fetchEmployees = useCallback(async () => {
        if (!isHR) return;
        try {
            const res = await API.get("/users");
            setEmployees(res.data.users ?? res.data ?? []);
        } catch { /* silent */ }
    }, [isHR]);

    // ---------- effects ----------

    useEffect(() => {
        fetchAnnouncements();
        fetchUnreadCount();
        fetchEmployees();
    }, [fetchAnnouncements, fetchUnreadCount, fetchEmployees]);

    useEffect(() => {
        // Real-time: prepend new announcement
        socket.on("newAnnouncement", (a) => {
            setData((prev) => [a, ...prev]);
            setUnreadCount((c) => c + 1);
        });
        // Real-time: update existing
        socket.on("updatedAnnouncement", (a) => {
            setData((prev) => prev.map((x) => (x._id === a._id ? a : x)));
        });
        // Real-time: remove deleted
        socket.on("deletedAnnouncement", (id) => {
            setData((prev) => prev.filter((x) => x._id !== id));
        });

        return () => {
            socket.off("newAnnouncement");
            socket.off("updatedAnnouncement");
            socket.off("deletedAnnouncement");
        };
    }, []);

    // ---------- actions ----------

    // PUT /announcements/:id/read
    const markRead = async (id) => {
        try {
            await API.put(`/announcements/${id}/read`);
            setData((prev) =>
                prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    // DELETE /announcements/:id
    const handleDelete = async (id) => {
        try {
            await API.delete(`/announcements/${id}`);
            setData((prev) => prev.filter((a) => a._id !== id));
        } catch { /* silent */ }
    };

    // GET /announcements/:id  → analytics modal
    const openAnalytics = async (id) => {
        try {
            const res = await API.get(`/announcements/${id}`);
            setSelected(res.data);
        } catch { /* silent */ }
    };

    const handleEdit = (announcement) => setEditTarget(announcement);

    const handleFormSuccess = () => {
        setEditTarget(null);
        fetchAnnouncements();
        fetchUnreadCount();
    };

    // ---------- render ----------

    return (
        <DashboardLayout>
            <style>{styles}</style>
            <div className="ann-page">
                {/* Header */}
                <div className="ann-header">
                    <h1 className="ann-title">Announce<span>ments</span></h1>
                    <div className="ann-header-right">
                        {unreadCount > 0 && (
                            <span className="ann-unread-badge">🔔 {unreadCount} unread</span>
                        )}
                        <span className="ann-count-badge">{data.length} Total</span>
                    </div>
                </div>

                {/* HR view tabs: Mine / All */}
                {isHR && (
                    <div className="ann-tabs">
                        <button
                            className={`ann-tab ${viewMode === "mine" ? "active" : ""}`}
                            onClick={() => setViewMode("mine")}
                        >
                            My View
                        </button>
                        <button
                            className={`ann-tab ${viewMode === "all" ? "active" : ""}`}
                            onClick={() => setViewMode("all")}
                        >
                            All Announcements
                        </button>
                    </div>
                )}

                {/* Create / Edit form — HR only */}
                {isHR && (
                    <AnnouncementForm
                        onSuccess={handleFormSuccess}
                        employees={employees}
                        editTarget={editTarget}
                        onCancelEdit={() => setEditTarget(null)}
                    />
                )}

                {/* List */}
                {loading ? (
                    [1, 2, 3].map((k) => <SkeletonCard key={k} />)
                ) : data.length === 0 ? (
                    <div className="ann-empty">
                        <span className="ann-empty-icon">📭</span>
                        No announcements yet
                    </div>
                ) : (
                    <div className="ann-list">
                        {data.map((a, i) => (
                            <div
                                key={a._id}
                                className="ann-list-item"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <AnnouncementCard
                                    a={a}
                                    isHR={isHR}
                                    onRead={markRead}
                                    onDelete={handleDelete}
                                    onAnalytics={openAnalytics}
                                    onEdit={handleEdit}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <AnalyticsModal data={selected} onClose={() => setSelected(null)} />
            </div>
        </DashboardLayout>
    );
};

export default AnnouncementsPage;