import { useEffect, useState, useContext } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const StatCard = ({ title, value, accent, sub }) => (
    <div className={`stat-card ${accent}`}>
        <p style={{ fontSize: ".8rem", fontWeight: 500, color: "var(--text-3)", marginBottom: ".4rem" }}>{title}</p>
        <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: ".78rem", color: "var(--text-3)", marginTop: ".35rem" }}>{sub}</p>}
    </div>
);

// Badge to highlight TL role clearly
const TLBadge = () => (
    <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".3rem",
        background: "var(--brand-light)",
        color: "var(--brand)",
        fontSize: ".72rem",
        fontWeight: 700,
        letterSpacing: ".04em",
        padding: ".2rem .55rem",
        borderRadius: "999px",
        textTransform: "uppercase",
        marginLeft: ".5rem",
        verticalAlign: "middle",
    }}>
        Team Lead
    </span>
);

const TLDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Personal stats (same API as employee dashboard)
    const [myStats, setMyStats] = useState({ attendancePercentage: 0, leavesTaken: 0, lateDays: 0 });
    const [myLoading, setMyLoading] = useState(true);

    // Team stats
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamLoading, setTeamLoading] = useState(true);
    const [pendingLeaves, setPendingLeaves] = useState(0);

    useEffect(() => {
        // 1. Personal dashboard stats
        API.get("/reports/dashboard")
            .then(res => setMyStats(res.data.data))
            .catch(console.error)
            .finally(() => setMyLoading(false));

        // 2. Team members (backend already filters by reportingTo for TL role)
        API.get("/users")
            .then(res => setTeamMembers(res.data.users || []))
            .catch(console.error)
            .finally(() => setTeamLoading(false));

        // 3. Pending leave approvals for TL's team
        API.get("/leave/all?status=pending")
            .then(res => {
                const leaves = res.data.leaves || res.data.data || [];
                setPendingLeaves(leaves.length);
            })
            .catch(console.error);
    }, []);

    const myCards = [
        { title: "My Attendance", value: myLoading ? "—" : `${myStats.attendancePercentage}%`, accent: "brand", sub: "This month" },
        { title: "Leaves Taken", value: myLoading ? "—" : myStats.leavesTaken, accent: "warn", sub: "Total approved" },
        { title: "Late Days", value: myLoading ? "—" : myStats.lateDays, accent: "danger", sub: "This month" },
    ];

    const teamCards = [
        { title: "Team Size", value: teamLoading ? "—" : teamMembers.length, accent: "brand", sub: "Direct reports" },
        { title: "Pending Leaves", value: pendingLeaves, accent: "warn", sub: "Awaiting your approval" },
    ];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="page-header">
                <h1>
                    Welcome, {user?.name?.split(" ")[0]}
                    <TLBadge />
                </h1>
                <p>Your personal summary and team overview for this month</p>
            </div>

            {/* ── MY STATS ── */}
            <p className="fw-600" style={{ marginBottom: ".6rem", fontSize: ".85rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                My Overview
            </p>
            <div className="grid-stats">
                {myCards.map(c => <StatCard key={c.title} {...c} />)}
            </div>

            {/* ── TEAM STATS ── */}
            <p className="fw-600" style={{ margin: "1.5rem 0 .6rem", fontSize: ".85rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                Team Overview
            </p>
            <div className="grid-stats">
                {teamCards.map(c => <StatCard key={c.title} {...c} />)}
            </div>

            {/* ── QUICK ACTIONS ── */}
            <div className="card" style={{ marginTop: "1.25rem" }}>
                <p className="fw-600" style={{ marginBottom: ".75rem" }}>Quick Actions</p>

                {/* Personal */}
                <p style={{ fontSize: ".78rem", color: "var(--text-3)", marginBottom: ".5rem" }}>Personal</p>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    <button onClick={() => navigate("/tl/attendance")} className="btn btn-primary btn-sm">Mark Attendance</button>
                    <button onClick={() => navigate("/tl/leave")} className="btn btn-ghost btn-sm">Apply Leave</button>
                    <button onClick={() => navigate("/tl/payroll")} className="btn btn-ghost btn-sm">View Payslips</button>
                </div>

                {/* Team */}
                <p style={{ fontSize: ".78rem", color: "var(--text-3)", marginBottom: ".5rem" }}>Team</p>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                    <button onClick={() => navigate("/tl/leave-approval")} className="btn btn-primary btn-sm">
                        Review Leaves {pendingLeaves > 0 && `(${pendingLeaves})`}
                    </button>
                    <button onClick={() => navigate("/tl/team")} className="btn btn-ghost btn-sm">View My Team</button>
                    <button onClick={() => navigate("/tl/team-attendance")} className="btn btn-ghost btn-sm">Team Attendance</button>
                </div>
            </div>

            {/* ── TEAM MEMBERS LIST ── */}
            {!teamLoading && teamMembers.length > 0 && (
                <div className="card" style={{ marginTop: "1.25rem" }}>
                    <p className="fw-600" style={{ marginBottom: ".75rem" }}>My Team Members</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                        {teamMembers.map(member => (
                            <div key={member._id} style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: ".5rem .75rem",
                                borderRadius: "8px",
                                background: "var(--surface-3)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                                    {/* Avatar initials */}
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: "var(--brand, #3b6ff5)",
                                        color: "#fff", display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        fontSize: ".75rem", fontWeight: 700,
                                    }}>
                                        {member.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--text-1)" }}>{member.name}</p>
                                        <p style={{ fontSize: ".75rem", color: "var(--text-3)" }}>{member.designation || member.department || "—"}</p>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: ".72rem", fontWeight: 600, padding: ".2rem .5rem",
                                    borderRadius: "999px",
                                    background: member.status === "active" ? "var(--success-bg)" : "var(--danger-bg)",
                                    color: member.status === "active" ? "var(--success)" : "var(--danger)",
                                }}>
                                    {member.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TLDashboard;