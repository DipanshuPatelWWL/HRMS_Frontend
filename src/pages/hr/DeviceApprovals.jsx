import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
    HiOutlineDeviceMobile,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineClock,
    HiOutlineSearch,
    HiOutlineDesktopComputer,
    HiOutlineShieldCheck,
    HiOutlineTrash,
    HiOutlineX,
    HiOutlineArrowLeft,
} from "react-icons/hi";
import { RiComputerLine } from "react-icons/ri";
import StopwatchLoader from "../../components/common/StopwatchLoader";

// ─────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────
const TABS = [
    { key: "pending", label: "Pending", icon: HiOutlineClock },
    { key: "approved", label: "Approved", icon: HiOutlineCheckCircle },
    { key: "rejected", label: "Rejected", icon: HiOutlineXCircle },
    { key: "all", label: "All Requests", icon: HiOutlineDeviceMobile },
];

const STATUS_CFG = {
    pending: { label: "Pending", bg: "var(--warn-bg)", color: "var(--warn)", dot: "#F97316" },
    approved: { label: "Approved", bg: "var(--success-bg)", color: "var(--success)", dot: "#22C55E" },
    rejected: { label: "Rejected", bg: "var(--danger-bg)", color: "var(--danger)", dot: "#EF4444" },
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const initials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const fmtDateTime = (d) =>
    d
        ? new Date(d).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
        : "—";

const maskToken = (t) => (t ? `${t.slice(0, 6)}••••${t.slice(-4)}` : "—");

// ─────────────────────────────────────────────
//  Status Badge
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 99,
                fontSize: ".72rem",
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.color,
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {cfg.label}
        </span>
    );
};

// ─────────────────────────────────────────────
//  Stat Card
// ─────────────────────────────────────────────
const StatCard = ({ label, value, color, Icon, onClick, active }) => (
    <div
        onClick={onClick}
        style={{
            background: "var(--surface)",
            borderRadius: 14,
            padding: "18px 20px",
            border: active ? `1.5px solid ${color}` : "1px solid var(--border)",
            position: "relative",
            overflow: "hidden",
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
            if (onClick) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }
        }}
        onMouseLeave={(e) => {
            if (onClick) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }
        }}
    >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
                <p style={{ fontSize: ".67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-2)", marginBottom: 8 }}>
                    {label}
                </p>
                <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-1)", lineHeight: 1, letterSpacing: "-1.5px" }}>
                    {value}
                </p>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={color} />
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
//  Approve Modal
// ─────────────────────────────────────────────
const ApproveModal = ({ request, onClose, onConfirm, submitting }) => {
    const [label, setLabel] = useState(request?.hostname || "");
    const [reason, setReason] = useState("");

    return (
        <div className="dm-overlay" onClick={onClose}>
            <div className="dm-box" onClick={(e) => e.stopPropagation()}>
                <div className="dm-head">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <HiOutlineShieldCheck size={20} color="#22C55E" />
                        <h3>Approve Device</h3>
                    </div>
                    <button className="dm-close" onClick={onClose}><HiOutlineX size={18} /></button>
                </div>
                <div className="dm-body">
                    <p className="dm-sub">
                        {request?.user?.name} <span className="dm-muted">({request?.user?.employeeId})</span> will be able to punch in from this device immediately.
                    </p>
                    <label className="dm-label">Device label</label>
                    <input
                        className="dm-input"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Jahid Office PC"
                    />
                    <label className="dm-label">Note (optional)</label>
                    <textarea
                        className="dm-textarea"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Internal note for this approval…"
                        rows={3}
                    />
                </div>
                <div className="dm-actions">
                    <button className="dm-btn dm-btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className="dm-btn dm-btn-approve"
                        onClick={() => onConfirm({ label: label.trim(), reason: reason.trim() })}
                        disabled={submitting}
                    >
                        {submitting ? "Approving…" : "Approve Device"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Reject Modal
// ─────────────────────────────────────────────
const RejectModal = ({ request, onClose, onConfirm, submitting }) => {
    const [reason, setReason] = useState("");

    return (
        <div className="dm-overlay" onClick={onClose}>
            <div className="dm-box" onClick={(e) => e.stopPropagation()}>
                <div className="dm-head">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <HiOutlineXCircle size={20} color="#EF4444" />
                        <h3>Reject Device Request</h3>
                    </div>
                    <button className="dm-close" onClick={onClose}><HiOutlineX size={18} /></button>
                </div>
                <div className="dm-body">
                    <p className="dm-sub">
                        {request?.user?.name} <span className="dm-muted">({request?.user?.employeeId})</span> will be notified this device was rejected.
                    </p>
                    <label className="dm-label">Reason</label>
                    <textarea
                        className="dm-textarea"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Personal device not allowed for punch-in"
                        rows={3}
                        autoFocus
                    />
                </div>
                <div className="dm-actions">
                    <button className="dm-btn dm-btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button
                        className="dm-btn dm-btn-reject"
                        onClick={() => onConfirm({ reason: reason.trim() })}
                        disabled={submitting || !reason.trim()}
                    >
                        {submitting ? "Rejecting…" : "Reject Request"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Revoke Modal
// ─────────────────────────────────────────────
const RevokeModal = ({ request, onClose, onConfirm, submitting }) => (
    <div className="dm-overlay" onClick={onClose}>
        <div className="dm-box" onClick={(e) => e.stopPropagation()}>
            <div className="dm-head">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HiOutlineTrash size={20} color="#EF4444" />
                    <h3>Revoke Device Access</h3>
                </div>
                <button className="dm-close" onClick={onClose}><HiOutlineX size={18} /></button>
            </div>
            <div className="dm-body">
                <p className="dm-sub">
                    This immediately blocks <b>{request?.user?.name}</b> from punching in using
                    {" "}<b>{request?.label || request?.hostname || "this device"}</b>. They'll need HR to re-approve it before they can use it again.
                </p>
            </div>
            <div className="dm-actions">
                <button className="dm-btn dm-btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
                <button className="dm-btn dm-btn-reject" onClick={onConfirm} disabled={submitting}>
                    {submitting ? "Revoking…" : "Revoke Access"}
                </button>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
const DeviceApprovals = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("pending");
    const [search, setSearch] = useState("");

    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [revokeTarget, setRevokeTarget] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/device-approvals?status=all`);
            setRequests(res.data.requests || []);
        } catch (err) {
            console.error("Device approvals fetch failed:", err);
            setToast({ type: "error", msg: "Failed to load device requests" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const counts = useMemo(() => {
        const c = { pending: 0, approved: 0, rejected: 0, all: requests.length };
        requests.forEach((r) => { if (c[r.status] !== undefined) c[r.status]++; });
        return c;
    }, [requests]);

    const filtered = useMemo(() => {
        return requests
            .filter((r) => tab === "all" || r.status === tab)
            .filter((r) => {
                const q = search.toLowerCase();
                if (!q) return true;
                return (
                    r.user?.name?.toLowerCase().includes(q) ||
                    r.user?.employeeId?.toLowerCase().includes(q) ||
                    r.hostname?.toLowerCase().includes(q) ||
                    r.productId?.toLowerCase().includes(q) ||
                    r.deviceUUID?.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [requests, tab, search]);

    const handleApprove = async ({ label, reason }) => {
        setSubmitting(true);
        try {
            await API.put(`/device-approvals/${approveTarget._id}/approve`, { label, reason });
            setToast({ type: "success", msg: `Device approved for ${approveTarget.user?.name}` });
            setApproveTarget(null);
            fetchRequests();
        } catch (err) {
            setToast({ type: "error", msg: err?.response?.data?.message || "Approval failed" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async ({ reason }) => {
        setSubmitting(true);
        try {
            await API.put(`/device-approvals/${rejectTarget._id}/reject`, { reason });
            setToast({ type: "success", msg: `Request rejected for ${rejectTarget.user?.name}` });
            setRejectTarget(null);
            fetchRequests();
        } catch (err) {
            setToast({ type: "error", msg: err?.response?.data?.message || "Rejection failed" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async () => {
        setSubmitting(true);
        try {
            await API.post(`/device-approvals/revoke`, {
                userId: revokeTarget.user?._id,
                deviceToken: revokeTarget.deviceToken,
            });
            setToast({ type: "success", msg: `Device access revoked for ${revokeTarget.user?.name}` });
            setRevokeTarget(null);
            fetchRequests();
        } catch (err) {
            setToast({ type: "error", msg: err?.response?.data?.message || "Revoke failed" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <style>{`
                .da-root { font-family: 'DM Sans', sans-serif; padding-bottom: 40px; }
                .da-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
                .da-back-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 10px; font-size: .85rem; font-weight: 700; cursor: pointer; border: 1.5px solid var(--border); background: var(--surface); color: var(--text-1); font-family: 'DM Sans', sans-serif; transition: all .15s; white-space: nowrap; }
                .da-back-btn:hover { background: var(--surface-3); border-color: #6366F1; color: #6366F1; }
                .da-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
                @media(max-width:900px){ .da-stats{ grid-template-columns:repeat(2,1fr); } }
                @media(max-width:500px){ .da-stats{ grid-template-columns:1fr; } }
                .da-tabs { display: flex; gap: 4px; background: var(--surface-3); border-radius: 10px; padding: 4px; margin-bottom: 20px; width: fit-content; flex-wrap: wrap; }
                .da-tab { padding: 7px 18px; border-radius: 7px; border: none; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .15s; background: transparent; color: var(--text-2); display: flex; align-items: center; gap: 6px; }
                .da-tab.active { background: var(--surface); color: var(--text-1); box-shadow: 0 1px 4px rgba(0,0,0,.1); }
                .da-tab:not(.active):hover { color: var(--text-1); background: var(--surface-2); }
                .da-tab .badge { background: var(--brand-light); color: var(--brand-dark); border-radius: 99px; padding: 1px 7px; font-size: .68rem; font-weight: 800; }
                .da-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
                .search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 320px; }
                .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-2); pointer-events: none; }
                .da-search { width: 100%; padding: 8px 14px 8px 36px; border: 1.5px solid var(--border); border-radius: 9px; font-size: .82rem; font-family:'DM Sans',sans-serif; outline: none; transition: border-color .15s; color: var(--text-1); background: var(--surface); }
                .da-search:focus { border-color: #6366F1; }
                .da-search::placeholder { color: var(--text-3); }
                .da-card { background: var(--surface); border-radius: 14px; border: 1px solid var(--border); overflow: hidden; }
                .da-card-header { padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: .85rem; font-weight: 700; color: var(--text-1); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .da-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
                .da-table th { text-align: left; padding: 10px 16px; font-size: .67rem; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--text-1); border-bottom: 1.5px solid var(--border); white-space: nowrap; background: var(--surface-3); }
                .da-table td { padding: 11px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                .da-table tbody tr:hover { background: var(--surface-3); }
                .da-table tbody tr:last-child td { border-bottom: none; }
                .device-chip { display: inline-flex; align-items: center; gap: 6px; font-size: .77rem; color: var(--text-1); font-weight: 600; }
                .device-sub { font-size: .7rem; color: var(--text-2); font-family: 'DM Mono',monospace; }
                .empty-cell { text-align: center; color: var(--text-2); padding: 2.5rem; font-size: .85rem; }
                .btn-row { display: flex; gap: 6px; }
                .btn-action { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; font-size: .74rem; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; font-family: inherit; transition: all .15s; }
                .btn-approve { background: #DCFCE7; color: #166534; border-color: #BBF7D0; }
                .btn-approve:hover { background: #BBF7D0; }
                .btn-reject { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }
                .btn-reject:hover { background: #FECACA; }
                .btn-revoke { background: var(--surface-3); color: var(--text-2); border-color: var(--border); }
                .btn-revoke:hover { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }

                /* Modal */
                .dm-overlay { position: fixed; inset: 0; background: rgba(15,15,20,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
                .dm-box { background: var(--surface); border-radius: 16px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.25); overflow: hidden; }
                .dm-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
                .dm-head h3 { font-size: .95rem; font-weight: 800; color: var(--text-1); margin: 0; }
                .dm-close { background: none; border: none; cursor: pointer; color: var(--text-2); padding: 4px; border-radius: 6px; display: flex; }
                .dm-close:hover { background: var(--surface-3); }
                .dm-body { padding: 18px 20px; }
                .dm-sub { font-size: .8rem; color: var(--text-2); margin-bottom: 14px; line-height: 1.5; }
                .dm-muted { color: var(--text-3); }
                .dm-label { display: block; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-2); margin-bottom: 6px; margin-top: 12px; }
                .dm-label:first-child { margin-top: 0; }
                .dm-input, .dm-textarea { width: 100%; padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: .84rem; font-family: 'DM Sans',sans-serif; outline: none; color: var(--text-1); background: var(--surface); resize: vertical; }
                .dm-input:focus, .dm-textarea:focus { border-color: #6366F1; }
                .dm-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--border); }
                .dm-btn { padding: 8px 16px; border-radius: 9px; font-size: .82rem; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; font-family: inherit; }
                .dm-btn:disabled { opacity: .6; cursor: not-allowed; }
                .dm-btn-ghost { background: var(--surface-3); color: var(--text-1); border-color: var(--border); }
                .dm-btn-approve { background: #22C55E; color: #fff; }
                .dm-btn-approve:hover:not(:disabled) { background: #16A34A; }
                .dm-btn-reject { background: #EF4444; color: #fff; }
                .dm-btn-reject:hover:not(:disabled) { background: #DC2626; }

                /* Toast */
                .da-toast { position: fixed; bottom: 24px; right: 24px; z-index: 1100; padding: 12px 18px; border-radius: 10px; font-size: .82rem; font-weight: 700; box-shadow: 0 8px 24px rgba(0,0,0,.15); display: flex; align-items: center; gap: 8px; }
                .da-toast.success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
                .da-toast.error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
            `}</style>

            <div className="da-root">
                {/* ── Header ── */}
                <div className="da-header">
                    <div>
                        <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.3px", display: "flex", alignItems: "center", gap: 9 }}>
                            <RiComputerLine size={26} color="#6366F1" />
                            Device Approvals
                        </h1>
                        <p style={{ fontSize: ".8rem", color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>
                            Review and manage employee devices approved for punch-in
                        </p>
                    </div>
                    <button className="da-back-btn" onClick={() => navigate("/hr/correction-requests")}>
                        <HiOutlineArrowLeft size={17} />
                        Back
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="da-stats">
                    <StatCard label="Pending" value={counts.pending} color="#F97316" Icon={HiOutlineClock} onClick={() => setTab("pending")} active={tab === "pending"} />
                    <StatCard label="Approved" value={counts.approved} color="#22C55E" Icon={HiOutlineCheckCircle} onClick={() => setTab("approved")} active={tab === "approved"} />
                    <StatCard label="Rejected" value={counts.rejected} color="#EF4444" Icon={HiOutlineXCircle} onClick={() => setTab("rejected")} active={tab === "rejected"} />
                    <StatCard label="Total Requests" value={counts.all} color="#6366F1" Icon={HiOutlineDeviceMobile} onClick={() => setTab("all")} active={tab === "all"} />
                </div>

                {/* ── Tabs ── */}
                <div className="da-tabs">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button key={key} className={`da-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
                            <Icon size={14} />
                            {label}
                            <span className="badge">{counts[key]}</span>
                        </button>
                    ))}
                </div>

                {/* ── Search ── */}
                <div className="da-filters">
                    <div className="search-wrap">
                        <HiOutlineSearch className="search-icon" size={15} />
                        <input
                            className="da-search"
                            placeholder="Search by name, ID, or hostname…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading && <StopwatchLoader />}

                {!loading && (
                    <div className="da-card">
                        <div className="da-card-header">
                            <HiOutlineDesktopComputer size={16} color="#6366F1" />
                            {TABS.find((t) => t.key === tab)?.label}
                            <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "var(--text-2)", fontWeight: 600 }}>
                                {filtered.length} request{filtered.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="da-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Device</th>
                                        <th>Requested</th>
                                        <th>Status</th>
                                        <th>Device Token</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="empty-cell">No device requests found</td>
                                        </tr>
                                    )}
                                    {filtered.map((r) => (
                                        <tr key={r._id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".75rem", flexShrink: 0 }}>
                                                        {initials(r.user?.name)}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: "var(--text-1)", fontSize: ".83rem" }}>{r.user?.name || "—"}</p>
                                                        <p style={{ fontSize: ".7rem", color: "var(--text-2)", fontFamily: "DM Mono,monospace", fontWeight: 500 }}>{r.user?.employeeId || "—"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="device-chip">
                                                    <HiOutlineDesktopComputer size={14} color="#6366F1" />
                                                    {r.label || r.hostname || "Unknown device"}
                                                </div>
                                                <div className="device-sub">{r.os || "—"} · {r.productId || r.deviceUUID?.slice(0, 12) || "—"}</div>
                                            </td>
                                            <td style={{ fontSize: ".78rem", color: "var(--text-1)" }}>{fmtDateTime(r.createdAt)}</td>
                                            <td><StatusBadge status={r.status} /></td>
                                            <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".74rem", color: "var(--text-2)" }}>
                                                {maskToken(r.deviceToken)}
                                            </td>
                                            <td>
                                                {r.status === "pending" && (
                                                    <div className="btn-row">
                                                        <button className="btn-action btn-approve" onClick={() => setApproveTarget(r)}>
                                                            <HiOutlineCheckCircle size={14} /> Approve
                                                        </button>
                                                        <button className="btn-action btn-reject" onClick={() => setRejectTarget(r)}>
                                                            <HiOutlineXCircle size={14} /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {r.status === "approved" && (
                                                    <button className="btn-action btn-revoke" onClick={() => setRevokeTarget(r)}>
                                                        <HiOutlineTrash size={14} /> Revoke
                                                    </button>
                                                )}
                                                {r.status === "rejected" && (
                                                    <span style={{ fontSize: ".72rem", color: "var(--text-3)" }}>
                                                        {r.reason || "No reason given"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {approveTarget && (
                <ApproveModal
                    request={approveTarget}
                    onClose={() => !submitting && setApproveTarget(null)}
                    onConfirm={handleApprove}
                    submitting={submitting}
                />
            )}
            {rejectTarget && (
                <RejectModal
                    request={rejectTarget}
                    onClose={() => !submitting && setRejectTarget(null)}
                    onConfirm={handleReject}
                    submitting={submitting}
                />
            )}
            {revokeTarget && (
                <RevokeModal
                    request={revokeTarget}
                    onClose={() => !submitting && setRevokeTarget(null)}
                    onConfirm={handleRevoke}
                    submitting={submitting}
                />
            )}

            {toast && (
                <div className={`da-toast ${toast.type}`}>
                    {toast.type === "success" ? <HiOutlineCheckCircle size={16} /> : <HiOutlineXCircle size={16} />}
                    {toast.msg}
                </div>
            )}
        </DashboardLayout>
    );
};

export default DeviceApprovals;