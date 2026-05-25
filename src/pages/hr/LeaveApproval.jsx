import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StopwatchLoader from "../../components/common/StopwatchLoader";
import Swal from "sweetalert2";

// ─── Leave Balance Modal ───────────────────────────────────
const LeaveBalanceModal = ({ leave, onClose }) => {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const userId = leave.user?._id || leave.user;
                const res = await API.get(`/users/${userId}/leave-balance`);
                setBalance(res.data.leaveBalance);
            } catch (err) {
                console.error("Failed to fetch leave balance", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();
    }, [leave]);

    if (!leave) return null;

    const leaveTypeColor = {
        casual: { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
        sick: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
        earned: { bg: "#dcfce7", color: "#14532d", border: "#4ade80" },
    };

    const typeStyle = leaveTypeColor[leave.type] || leaveTypeColor.casual;

    // Days between two dates (working days estimate)
    const daysBetween = (from, to) => {
        const diff = new Date(to) - new Date(from);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    const requestedDays = daysBetween(leave.fromDate, leave.toDate);

    const BalanceBar = ({ used, total, color }) => {
        const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
        const remaining = Math.max(0, total - used);
        return (
            <div>
                <div style={{
                    height: 6,
                    background: "#e5e7eb",
                    borderRadius: 99,
                    overflow: "hidden",
                    marginTop: 6,
                }}>
                    <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 99,
                        transition: "width 0.4s ease",
                    }} />
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: ".72rem",
                    color: "#6b7280",
                    marginTop: 4,
                    fontWeight: 500,
                }}>
                    <span>{used} used</span>
                    <span>{remaining} remaining</span>
                </div>
            </div>
        );
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,.45)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff",
                    borderRadius: 20,
                    width: "100%",
                    maxWidth: 480,
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 25px 50px rgba(0,0,0,.18)",
                    animation: "modalPop .18s ease",
                }}
            >
                <style>{`
                    @keyframes modalPop {
                        from { opacity:0; transform:scale(.96) translateY(10px); }
                        to   { opacity:1; transform:scale(1)  translateY(0);    }
                    }
                `}</style>

                {/* Header */}
                <div style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}>
                    <div>
                        <h2 style={{
                            fontSize: "1.1rem",
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: 0,
                        }}>
                            Leave Request Details
                        </h2>
                        <p style={{
                            fontSize: ".78rem",
                            color: "#6b7280",
                            marginTop: 3,
                            fontWeight: 500,
                        }}>
                            {leave.userName || leave.user?.name} ·{" "}
                            {leave.employeeId || leave.user?.employeeId}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: "none",
                            background: "#f3f4f6",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            color: "#6b7280",
                            fontWeight: 700,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: "20px 24px" }}>

                    {/* Leave request summary */}
                    <div style={{
                        background: typeStyle.bg,
                        border: `1.5px solid ${typeStyle.border}`,
                        borderRadius: 12,
                        padding: "14px 16px",
                        marginBottom: 20,
                    }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 10,
                        }}>
                            <span style={{
                                fontSize: ".72rem",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: ".5px",
                                color: typeStyle.color,
                            }}>
                                {leave.type} Leave Request
                            </span>
                            <span style={{
                                background: "#fff",
                                border: `1px solid ${typeStyle.border}`,
                                color: typeStyle.color,
                                borderRadius: 99,
                                padding: "2px 10px",
                                fontSize: ".75rem",
                                fontWeight: 700,
                            }}>
                                {requestedDays} day{requestedDays !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Date row */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                        }}>
                            <div>
                                <div style={{
                                    fontSize: ".68rem",
                                    color: typeStyle.color,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: ".4px",
                                }}>
                                    From
                                </div>
                                <div style={{
                                    fontSize: ".9rem",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    marginTop: 2,
                                }}>
                                    {new Date(leave.fromDate).toLocaleDateString("en-IN", {
                                        timeZone: "Asia/Kolkata",
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: ".68rem",
                                    color: typeStyle.color,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: ".4px",
                                }}>
                                    To
                                </div>
                                <div style={{
                                    fontSize: ".9rem",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    marginTop: 2,
                                }}>
                                    {new Date(leave.toDate).toLocaleDateString("en-IN", {
                                        timeZone: "Asia/Kolkata",
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        {leave.reason && (
                            <div style={{
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: `1px solid ${typeStyle.border}`,
                            }}>
                                <div style={{
                                    fontSize: ".68rem",
                                    color: typeStyle.color,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: ".4px",
                                    marginBottom: 3,
                                }}>
                                    Reason
                                </div>
                                <div style={{
                                    fontSize: ".85rem",
                                    color: "#374151",
                                    fontWeight: 500,
                                }}>
                                    {leave.reason}
                                </div>
                            </div>
                        )}

                        {/* Medical certificate if uploaded */}
                        {leave.medicalCertificate?.uploaded && (
                            <div style={{
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: `1px solid ${typeStyle.border}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}>
                                <span style={{ fontSize: ".85rem" }}>📎</span>
                                <a
                                    href={leave.medicalCertificate.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        fontSize: ".82rem",
                                        color: typeStyle.color,
                                        fontWeight: 700,
                                        textDecoration: "underline",
                                    }}
                                >
                                    {leave.medicalCertificate.fileName || "View Certificate"}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Leave Balance Section */}
                    <div>
                        <p style={{
                            fontSize: ".72rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: ".5px",
                            color: "#374151",
                            marginBottom: 12,
                        }}>
                            Employee Leave Balance
                        </p>

                        {loading && (
                            <div style={{
                                textAlign: "center",
                                padding: "1.5rem",
                                color: "#9ca3af",
                                fontSize: ".85rem",
                            }}>
                                Loading balance...
                            </div>
                        )}

                        {!loading && !balance && (
                            <div style={{
                                textAlign: "center",
                                padding: "1rem",
                                color: "#9ca3af",
                                fontSize: ".85rem",
                            }}>
                                Balance not available
                            </div>
                        )}

                        {!loading && balance && (
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}>
                                {/* Casual Leave */}
                                <div style={{
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                    // Highlight if this is the leave type being requested
                                    ...(leave.type === "casual" && {
                                        border: "1.5px solid #93c5fd",
                                        background: "#eff6ff",
                                    }),
                                }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 7,
                                        }}>
                                            <span style={{ fontSize: "1rem" }}>🏖️</span>
                                            <span style={{
                                                fontSize: ".85rem",
                                                fontWeight: 700,
                                                color: "#1e293b",
                                            }}>
                                                Casual Leave
                                            </span>
                                            {leave.type === "casual" && (
                                                <span style={{
                                                    fontSize: ".68rem",
                                                    background: "#dbeafe",
                                                    color: "#1d4ed8",
                                                    border: "1px solid #93c5fd",
                                                    borderRadius: 99,
                                                    padding: "1px 7px",
                                                    fontWeight: 700,
                                                }}>
                                                    This request
                                                </span>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: ".9rem",
                                            fontWeight: 800,
                                            color: balance.casual.total - balance.casual.used > 0
                                                ? "#15803d"
                                                : "#dc2626",
                                        }}>
                                            {Math.max(0, balance.casual.total - balance.casual.used)}/{balance.casual.total}
                                        </span>
                                    </div>
                                    <BalanceBar
                                        used={balance.casual.used}
                                        total={balance.casual.total}
                                        color="#3b82f6"
                                    />
                                    {/* Warn if requested days exceed balance */}
                                    {leave.type === "casual" &&
                                        requestedDays > Math.max(0, balance.casual.total - balance.casual.used) && (
                                            <div style={{
                                                marginTop: 6,
                                                fontSize: ".75rem",
                                                color: "#dc2626",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}>
                                                ⚠️ Requested {requestedDays}d exceeds balance —{" "}
                                                {requestedDays - Math.max(0, balance.casual.total - balance.casual.used)}d
                                                will be unpaid
                                            </div>
                                        )}
                                </div>

                                {/* Sick Leave */}
                                <div style={{
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                    ...(leave.type === "sick" && {
                                        border: "1.5px solid #fcd34d",
                                        background: "#fffbeb",
                                    }),
                                }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 7,
                                        }}>
                                            <span style={{ fontSize: "1rem" }}>🤒</span>
                                            <span style={{
                                                fontSize: ".85rem",
                                                fontWeight: 700,
                                                color: "#1e293b",
                                            }}>
                                                Sick Leave
                                            </span>
                                            {leave.type === "sick" && (
                                                <span style={{
                                                    fontSize: ".68rem",
                                                    background: "#fef3c7",
                                                    color: "#92400e",
                                                    border: "1px solid #fcd34d",
                                                    borderRadius: 99,
                                                    padding: "1px 7px",
                                                    fontWeight: 700,
                                                }}>
                                                    This request
                                                </span>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: ".9rem",
                                            fontWeight: 800,
                                            color: balance.sick.total - balance.sick.used > 0
                                                ? "#15803d"
                                                : "#dc2626",
                                        }}>
                                            {Math.max(0, balance.sick.total - balance.sick.used)}/{balance.sick.total}
                                        </span>
                                    </div>
                                    <BalanceBar
                                        used={balance.sick.used}
                                        total={balance.sick.total}
                                        color="#f59e0b"
                                    />
                                    {leave.type === "sick" &&
                                        requestedDays > Math.max(0, balance.sick.total - balance.sick.used) && (
                                            <div style={{
                                                marginTop: 6,
                                                fontSize: ".75rem",
                                                color: "#dc2626",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}>
                                                ⚠️ Requested {requestedDays}d exceeds balance —{" "}
                                                {requestedDays - Math.max(0, balance.sick.total - balance.sick.used)}d
                                                will be unpaid
                                            </div>
                                        )}
                                </div>

                                {/* Earned Leave */}
                                <div style={{
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                    ...(leave.type === "earned" && {
                                        border: "1.5px solid #4ade80",
                                        background: "#f0fdf4",
                                    }),
                                }}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 7,
                                        }}>
                                            <span style={{ fontSize: "1rem" }}>⭐</span>
                                            <span style={{
                                                fontSize: ".85rem",
                                                fontWeight: 700,
                                                color: "#1e293b",
                                            }}>
                                                Earned Leave
                                            </span>
                                            {leave.type === "earned" && (
                                                <span style={{
                                                    fontSize: ".68rem",
                                                    background: "#dcfce7",
                                                    color: "#14532d",
                                                    border: "1px solid #4ade80",
                                                    borderRadius: 99,
                                                    padding: "1px 7px",
                                                    fontWeight: 700,
                                                }}>
                                                    This request
                                                </span>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: ".9rem",
                                            fontWeight: 800,
                                            color: balance.earned.total - balance.earned.used > 0
                                                ? "#15803d"
                                                : "#dc2626",
                                        }}>
                                            {Math.max(0, balance.earned.total - balance.earned.used)}/{balance.earned.total}
                                        </span>
                                    </div>
                                    <BalanceBar
                                        used={balance.earned.used}
                                        total={balance.earned.total}
                                        color="#22c55e"
                                    />
                                    {leave.type === "earned" &&
                                        requestedDays > Math.max(0, balance.earned.total - balance.earned.used) && (
                                            <div style={{
                                                marginTop: 6,
                                                fontSize: ".75rem",
                                                color: "#dc2626",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}>
                                                ⚠️ Requested {requestedDays}d exceeds balance —{" "}
                                                {requestedDays - Math.max(0, balance.earned.total - balance.earned.used)}d
                                                will be unpaid
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 24px",
                    borderTop: "1px solid #f1f5f9",
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: "100%",
                            padding: "11px",
                            borderRadius: 12,
                            border: "none",
                            background: "#111827",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: ".9rem",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────
const LeaveApproval = () => {
    const [leaves, setLeaves] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const definedRoles = user?.role || "";

    const shouldSkipTL = (leave) => {
        return (
            leave.skipTLApproval === true ||
            leave.userRole === "tl" ||
            leave.userDesignation === "Business Development Manager" ||
            leave.userDesignation === "Business Development Executive"
        );
    };

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/leave/all`, {
                params: { status: filter },
                headers: { "Cache-Control": "no-cache" },
            });
            setLeaves(res.data?.leaves || []);
        } catch (error) {
            console.log("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, [filter]);

    const action = async (id, status) => {
        const isApproving = status === "approved";

        const result = await Swal.fire({
            title: isApproving ? "Approve this leave?" : "Reject this leave?",
            text: isApproving
                ? "The employee will be notified of the approval."
                : "The employee will be notified of the rejection.",
            icon: isApproving ? "question" : "warning",
            showCancelButton: true,
            confirmButtonColor: isApproving ? "#22C55E" : "#EF4444",
            cancelButtonColor: "#6B7280",
            confirmButtonText: isApproving ? "Yes, approve" : "Yes, reject",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        setActionLoading(prev => ({ ...prev, [id]: isApproving ? "approving" : "rejecting" })); // ← ADDED

        try {
            const role = user?.role;
            let url = "";

            if (role === "hr") url = `/leave/hr-approve/${id}`;
            else if (role === "manager") url = `/leave/manager-approve/${id}`;
            else if (role === "tl") url = `/leave/tl-approve/${id}`;
            else return Swal.fire({
                icon: "error",
                title: "Unauthorized",
                text: "You do not have permission to perform this action.",
                confirmButtonColor: "#6366F1",
            });

            await API.put(url, { action: status });

            setSelectedLeave(null);

            Swal.fire({
                icon: "success",
                title: isApproving ? "Leave Approved" : "Leave Rejected",
                text: isApproving
                    ? "The leave request has been approved successfully."
                    : "The leave request has been rejected.",
                confirmButtonColor: "#6366F1",
                timer: 2000,
                showConfirmButton: false,
            });

            fetchLeaves();

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Action failed",
                text: err.response?.data?.message || "Something went wrong.",
                confirmButtonColor: "#6366F1",
            });
        } finally {
            setActionLoading(prev => {
                const n = { ...prev };
                delete n[id];
                return n;
            });
        }
    };

    const tabs = ["pending", "approved", "rejected"]
    return (
        <DashboardLayout>
            <div className="page-header">
                <h1>Leave Approvals</h1>
                <p>Review and action employee leave requests</p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: ".4rem", marginBottom: "1.25rem" }}>
                {tabs.map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`btn btn-sm ${filter === t ? "btn-primary" : "btn-ghost"}`}
                        style={{ textTransform: "capitalize" }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="card">
                {loading && <StopwatchLoader />}

                {!loading && leaves.length === 0 && (
                    <p style={{
                        color: "var(--text-3)",
                        fontSize: ".875rem",
                        textAlign: "center",
                        padding: "2rem 0",
                    }}>
                        No {filter} leaves
                    </p>
                )}

                {!loading && leaves.length > 0 && (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Reason</th>
                                    {(definedRoles === "hr" || definedRoles === "manager") && <th>TL</th>}
                                    <th>HR</th>
                                    <th>Status</th>
                                    {filter === "pending" && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(l => (
                                    <tr
                                        key={l._id}
                                        // ── NEW: click row to open modal ──
                                        onClick={() => setSelectedLeave(l)}
                                        style={{ cursor: "pointer" }}
                                        title="Click to view leave balance"
                                    >
                                        <td style={{ fontWeight: 500 }}>
                                            <div>{l.userName || l.user?.name || "—"}</div>
                                            <div style={{
                                                fontSize: ".75rem",
                                                color: "#707070",
                                            }}>
                                                {l.employeeId || l.user?.employeeId || ""}
                                            </div>
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>
                                            {/* ── NEW: colored type badge ── */}
                                            <span style={{
                                                padding: "3px 10px",
                                                borderRadius: 99,
                                                fontSize: ".75rem",
                                                fontWeight: 700,
                                                background:
                                                    l.type === "casual" ? "#dbeafe" :
                                                        l.type === "sick" ? "#fef3c7" :
                                                            "#dcfce7",
                                                color:
                                                    l.type === "casual" ? "#1d4ed8" :
                                                        l.type === "sick" ? "#92400e" :
                                                            "#14532d",
                                            }}>
                                                {l.type}
                                            </span>
                                        </td>
                                        <td>{new Date(l.fromDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}</td>
                                        <td>{new Date(l.toDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })}</td>
                                        <td style={{
                                            maxWidth: "140px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {l.reason}
                                        </td>

                                        {/* TL Approval */}
                                        {(definedRoles === "hr" || definedRoles === "manager") && (
                                            <td>
                                                {shouldSkipTL(l) ? (
                                                    <span className="badge" style={{
                                                        background: "#f3f4f6",
                                                        color: "#9ca3af",
                                                        fontSize: ".72rem",
                                                        fontStyle: "italic",
                                                    }}>
                                                        Not Required
                                                    </span>
                                                ) : l.tlApproval?.status === "approved" ? (
                                                    <span className="badge badge-success">Approved</span>
                                                ) : l.tlApproval?.status === "rejected" ? (
                                                    <span className="badge badge-danger">Rejected</span>
                                                ) : (
                                                    <span className="badge badge-warn">Pending</span>
                                                )}
                                            </td>
                                        )}

                                        {/* HR Approval */}
                                        <td>
                                            {(l.hrApproval?.status === "approved" || l.managerApproval?.status === "approved") ? (
                                                <span className="badge badge-success">Approved</span>
                                            ) : (l.hrApproval?.status === "rejected" || l.managerApproval?.status === "rejected") ? (
                                                <span className="badge badge-danger">Rejected</span>
                                            ) : (
                                                <span className="badge badge-warn">Pending</span>
                                            )}
                                        </td>

                                        {/* Overall Status */}
                                        <td>
                                            <span className={`badge ${l.status === "approved" ? "badge-success" :
                                                l.status === "rejected" ? "badge-danger" :
                                                    "badge-warn"
                                                }`}>
                                                {l.status}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        {filter === "pending" && (
                                            <td onClick={e => e.stopPropagation()}>
                                                {/* Stop row click when clicking buttons */}

                                                {user?.role === "tl" && l.tlApproval?.status === "pending" && (
                                                    <div style={{ display: "flex", gap: ".4rem" }}>
                                                        <button
                                                            onClick={() => action(l._id, "approved")}
                                                            className="btn btn-success btn-sm"
                                                            disabled={!!actionLoading[l._id]}
                                                            style={{ minWidth: 90, opacity: actionLoading[l._id] ? 0.7 : 1 }}
                                                        >
                                                            {actionLoading[l._id] === "approving" ? "Approving…" : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => action(l._id, "rejected")}
                                                            className="btn btn-sm"
                                                            disabled={!!actionLoading[l._id]}
                                                            style={{
                                                                background: "var(--danger-bg)",
                                                                color: "var(--danger)",
                                                                border: "1px solid #fecaca",
                                                                minWidth: 80,
                                                                opacity: actionLoading[l._id] ? 0.7 : 1,
                                                            }}
                                                        >
                                                            {actionLoading[l._id] === "rejecting" ? "Rejecting…" : "Reject"}
                                                        </button>
                                                    </div>
                                                )}
                                                {user?.role === "tl" && l.tlApproval?.status !== "pending" && (
                                                    <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>
                                                        Already acted
                                                    </span>
                                                )}

                                                {user?.role === "hr" && (shouldSkipTL(l) || l.tlApproval?.status === "approved") && (
                                                    <div style={{ display: "flex", gap: ".4rem" }}>
                                                        <button
                                                            onClick={() => action(l._id, "approved")}
                                                            className="btn btn-success btn-sm"
                                                            disabled={!!actionLoading[l._id]}
                                                            style={{ minWidth: 90, opacity: actionLoading[l._id] ? 0.7 : 1 }}
                                                        >
                                                            {actionLoading[l._id] === "approving" ? "Approving…" : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => action(l._id, "rejected")}
                                                            className="btn btn-sm"
                                                            disabled={!!actionLoading[l._id]}
                                                            style={{
                                                                background: "var(--danger-bg)",
                                                                color: "var(--danger)",
                                                                border: "1px solid #fecaca",
                                                                minWidth: 80,
                                                                opacity: actionLoading[l._id] ? 0.7 : 1,
                                                            }}
                                                        >
                                                            {actionLoading[l._id] === "rejecting" ? "Rejecting…" : "Reject"}
                                                        </button>
                                                    </div>
                                                )}
                                                {user?.role === "hr" && !shouldSkipTL(l) && l.tlApproval?.status !== "approved" && (
                                                    <span style={{ fontSize: ".78rem", color: "#707070" }}>
                                                        ⏳ Awaiting TL
                                                    </span>
                                                )}

                                                {user?.role === "manager" && (
                                                    <div style={{ display: "flex", gap: ".4rem" }}>
                                                        <button
                                                            onClick={() => action(l._id, "approved")}
                                                            className="btn btn-success btn-sm"
                                                            disabled={!!actionLoading[l._id]}
                                                            style={{ minWidth: 90, opacity: actionLoading[l._id] ? 0.7 : 1 }}
                                                        >
                                                            {actionLoading[l._id] === "approving" ? "Approving…" : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => action(l._id, "rejected")}
                                                            className="btn btn-sm"
                                                            disabled={!!actionLoading[l._id]}
                                                            style={{
                                                                background: "var(--danger-bg)",
                                                                color: "var(--danger)",
                                                                border: "1px solid #fecaca",
                                                                minWidth: 80,
                                                                opacity: actionLoading[l._id] ? 0.7 : 1,
                                                            }}
                                                        >
                                                            {actionLoading[l._id] === "rejecting" ? "Rejecting…" : "Reject"}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── NEW: Leave Balance Modal ── */}
            {selectedLeave && (
                <LeaveBalanceModal
                    leave={selectedLeave}
                    onClose={() => setSelectedLeave(null)}
                />
            )}
        </DashboardLayout>
    );
};

export default LeaveApproval;