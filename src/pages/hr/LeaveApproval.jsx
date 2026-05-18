import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StopwatchLoader from "../../components/common/StopwatchLoader";
import Swal from "sweetalert2";

const LeaveApproval = () => {
    const [leaves, setLeaves] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const definedRoles = user?.role || "";

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/leave/all`, {
                params: { status: filter },
                headers: {
                    "Cache-Control": "no-cache"
                }
            });

            setLeaves(res.data?.leaves || []);
        } catch (error) {
            console.log("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => { fetch(); }, [filter]);

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

        try {
            let url = "";

            const role = user?.role;

            if (role === "hr") {
                url = `/leave/hr-approve/${id}`;
            } else if (role === "manager") {
                url = `/leave/manager-approve/${id}`;
            } else if (role === "tl") {
                url = `/leave/tl-approve/${id}`;
            } else {
                return Swal.fire({
                    icon: "error",
                    title: "Unauthorized",
                    text: "You do not have permission to perform this action.",
                    confirmButtonColor: "#6366F1",
                });
            }

            await API.put(url, {
                action: status
            });

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

            fetch();

        } catch (err) {
            console.log(err);
            Swal.fire({
                icon: "error",
                title: "Action failed",
                text: err.response?.data?.message || "Something went wrong. Please try again.",
                confirmButtonColor: "#6366F1",
            });
        }
    };

    const tabs = ["pending", "approved", "rejected"];

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1>Leave Approvals</h1>
                <p>Review and action employee leave requests</p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: ".4rem", marginBottom: "1.25rem" }}>
                {tabs.map(t => (
                    <button key={t} onClick={() => setFilter(t)}
                        className={`btn btn-sm ${filter === t ? "btn-primary" : "btn-ghost"}`}
                        style={{ textTransform: "capitalize" }}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="card">
                {loading && <StopwatchLoader />}

                {!loading && leaves.length === 0 && (
                    <p style={{ color: "var(--text-3)", fontSize: ".875rem", textAlign: "center", padding: "2rem 0" }}>
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
                                    <tr key={l._id}>
                                        <td style={{ fontWeight: 500 }}>
                                            <div>{l.userName || l.user?.name || "—"}</div>
                                            <div style={{ fontSize: ".75rem", color: "#707070", }}>
                                                {l.employeeId || l.user?.employeeId || ""}
                                            </div>
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>{l.type}</td>
                                        <td>{new Date(l.fromDate).toLocaleDateString()}</td>
                                        <td>{new Date(l.toDate).toLocaleDateString()}</td>
                                        <td style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {l.reason}
                                        </td>

                                        {/* TL Approval */}
                                        {(definedRoles === "hr" || definedRoles === "manager") &&
                                            <td>
                                                {l.tlApproval?.status === "approved" ? (
                                                    <span className="badge badge-success">Approved</span>
                                                ) : l.tlApproval?.status === "rejected" ? (
                                                    <span className="badge badge-danger">Rejected</span>
                                                ) : (
                                                    <span className="badge badge-warn">Pending</span>
                                                )}
                                            </td>
                                        }

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
                                            <td>
                                                {/* TL — can only act if they haven't yet */}
                                                {user?.role === "tl" && l.tlApproval?.status === "pending" && (
                                                    <div style={{ display: "flex", gap: ".4rem" }}>
                                                        <button onClick={() => action(l._id, "approved")} className="btn btn-success btn-sm">Approve</button>
                                                        <button onClick={() => action(l._id, "rejected")} className="btn btn-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #fecaca" }}>Reject</button>
                                                    </div>
                                                )}
                                                {user?.role === "tl" && l.tlApproval?.status !== "pending" && (
                                                    <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>Already acted</span>
                                                )}

                                                {/* HR — can only act after TL approves */}
                                                {user?.role === "hr" && l.tlApproval?.status === "approved" && (
                                                    <div style={{ display: "flex", gap: ".4rem" }}>
                                                        <button onClick={() => action(l._id, "approved")} className="btn btn-success btn-sm">Approve</button>
                                                        <button onClick={() => action(l._id, "rejected")} className="btn btn-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #fecaca" }}>Reject</button>
                                                    </div>
                                                )}
                                                {user?.role === "hr" && l.tlApproval?.status !== "approved" && (
                                                    <span style={{ fontSize: ".78rem", color: "#707070", }}>⏳ Awaiting TL</span>
                                                )}

                                                {/* Manager */}
                                                {user?.role === "manager" && (
                                                    <div style={{ display: "flex", gap: ".4rem" }}>
                                                        <button onClick={() => action(l._id, "approved")} className="btn btn-success btn-sm">Approve</button>
                                                        <button onClick={() => action(l._id, "rejected")} className="btn btn-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #fecaca" }}>Reject</button>
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
        </DashboardLayout>
    );
};

export default LeaveApproval;