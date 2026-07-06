import { useEffect, useState, useContext } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
    FaCalendarCheck,
    FaUsers,
    FaClipboardList,
    FaChartLine,
    FaClock,
    FaSignInAlt,
    FaLaptopCode,
    FaDoorOpen,
    FaChevronRight,
    FaSun,
    FaMoon,
    FaUmbrellaBeach,
    FaMoneyCheckAlt,
} from "react-icons/fa";


const css = `
.tl-root *, .tl-root *::before, .tl-root *::after { box-sizing: border-box; }
.tl-root { font-family: 'DM Sans', sans-serif; color: var(--text-1); }

/* HERO BANNER */
.tl-hero {
    margin-bottom: 24px;
    padding: 28px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--brand, #4F46E5), var(--brand-strong, #6366F1));
    color: #fff;
    position: relative;
    overflow: hidden;
}
.tl-hero::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,.08);
}
.tl-hero-badge {
    display: inline-flex; align-items: center; gap: .3rem;
    background: rgba(255,255,255,.18); color: #fff;
    font-size: .68rem; font-weight: 700; letter-spacing: .05em;
    padding: .2rem .6rem; border-radius: 999px; text-transform: uppercase;
    margin-left: .6rem; vertical-align: middle;
}
.tl-hero h2 { margin-bottom: 8px; font-weight: 700; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tl-hero p { opacity: .9; margin-bottom: 24px; }
.tl-hero-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:18px; position:relative; z-index:1; }
.tl-hero-label { opacity:.8; font-size:.78rem; }
.tl-hero-value { margin-top:6px; font-weight:700; }

/* SECTION LABEL */
.tl-section-label { margin: 1.5rem 0 .8rem; font-size: .85rem; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; }
.tl-section-label:first-of-type { margin-top: 0; }

/* STAT CARDS */
.tl-cards-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:18px; margin-bottom:8px; }
.tl-stat-card {
    background: var(--surface);
    border-radius: 16px;
    padding: 20px;
    border-top: 4px solid var(--card-accent);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 4px 15px rgba(0,0,0,.06);
    transition: transform .25s ease, box-shadow .25s ease;
}
.tl-stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,.12); }
.tl-stat-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.tl-stat-title { font-size:13px; color:var(--text-2); font-weight:500; }
.tl-stat-icon {
    width:42px; height:42px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    background: var(--card-accent-bg); font-size:18px;
    transition: transform .25s ease;
}
.tl-stat-card:hover .tl-stat-icon { transform: scale(1.12) rotate(-6deg); }
.tl-stat-value { font-size:30px; font-weight:700; margin-bottom:4px; color:var(--text-1); line-height: 1; }
.tl-stat-sub { color:var(--text-2); font-size:13px; }

/* QUICK ACTIONS */
.tl-card { background: var(--surface); border: 1px solid var(--border); border-radius:16px; margin-top:20px; padding: 22px 24px; }
.tl-card-title { margin-bottom:16px; font-weight:700; color: var(--text-1); }
.tl-actions-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
.tl-action-row {
    cursor:pointer; border:1px solid var(--border); border-radius:14px; padding:16px;
    display:flex; justify-content:space-between; align-items:center;
    background: var(--surface);
    transition: background .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.tl-action-row:hover {
    background: var(--surface-2); border-color: var(--border-strong);
    transform: translateX(4px); box-shadow: 0 4px 14px rgba(0,0,0,.08);
}
.tl-action-left { display:flex; align-items:center; gap:12px; }
.tl-action-icon {
    width:44px; height:44px; border-radius:12px;
    background: var(--action-accent-bg); color: var(--action-accent);
    display:flex; align-items:center; justify-content:center; font-size:19px;
    transition: transform .2s ease;
}
.tl-action-row:hover .tl-action-icon { transform: scale(1.1); }
.tl-action-title { margin:0; font-weight:600; color: var(--text-1); font-size: .88rem; }
.tl-action-sub { color: var(--text-2); font-size: .76rem; }
.tl-action-chevron { color: var(--text-3); transition: transform .2s ease; }
.tl-action-row:hover .tl-action-chevron { transform: translateX(4px); color: var(--brand, #6366F1); }

/* TIMELINE */
.tl-timeline-grid { display:flex; justify-content:space-between; flex-wrap:wrap; gap:20px; }
.tl-timeline-item { flex:1; min-width:160px; text-align:center; }
.tl-timeline-circle {
    width:50px; height:50px; margin:0 auto; border-radius:50%;
    display:flex; align-items:center; justify-content:center; font-size:18px;
    background: var(--timeline-bg);
    transition: transform .2s ease;
}
.tl-timeline-item:hover .tl-timeline-circle { transform: scale(1.1); }
.tl-timeline-label { margin-top:10px; font-weight:600; color: var(--text-1); font-size: .82rem; }
.tl-timeline-value { color: var(--text-2); margin-top: 4px; font-size: .82rem; }

/* TEAM MEMBERS */
.tl-member-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:.65rem .85rem; border-radius:12px; background: var(--surface-3);
    transition: background .15s ease, transform .15s ease;
}
.tl-member-row:hover { background: var(--surface-2); transform: translateX(2px); }
.tl-member-avatar {
    width: 36px; height: 36px; border-radius: "50%"; border-radius: 50%;
    background: var(--brand, #4F46E5); color: #fff; display: flex;
    align-items: center; justify-content: center; font-size: .78rem; font-weight: 700; flex-shrink: 0;
}
`;
const formatTime = (time) => {
    if (!time) return "--";
    return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 17) return { text: "Good Morning", icon: <FaSun /> };
    if (hour >= 17 && hour < 21) return { text: "Good Evening", icon: <FaSun /> };
    return { text: "Good Night", icon: <FaMoon /> };
};

const TLDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Personal stats (same API as employee dashboard)
    const [myStats, setMyStats] = useState({
        attendancePercentage: 0,
        leavesTaken: 0,
        lateDays: 0,
        presentDays: 0,
        workingDays: 0,
        employee: {},
        today: {},
    });
    const [myLoading, setMyLoading] = useState(true);
    const greeting = getGreeting();

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
        { title: "My Attendance", value: myLoading ? "—" : `${myStats.attendancePercentage}%`, color: "#4F46E5", icon: <FaChartLine />, sub: "This month" },
        { title: "Present Days", value: myLoading ? "—" : myStats.presentDays, color: "#10B981", icon: <FaCalendarCheck />, sub: `${myStats.workingDays || 0} working days` },
        { title: "Leaves Taken", value: myLoading ? "—" : myStats.leavesTaken, color: "#F59E0B", icon: <FaUmbrellaBeach />, sub: "Total approved" },
        { title: "Late Days", value: myLoading ? "—" : myStats.lateDays, color: "#EF4444", icon: <FaClock />, sub: "This month" },
    ];

    const teamCards = [
        { title: "Team Size", value: teamLoading ? "—" : teamMembers.length, color: "#4F46E5", icon: <FaUsers />, sub: "Direct reports" },
        { title: "Pending Leaves", value: pendingLeaves, color: "#F59E0B", icon: <FaClipboardList />, sub: "Awaiting your approval" },
    ];

    // NEW
    const quickActionsPersonal = [
        { title: "Mark Attendance", sub: "Punch in / out", icon: <FaCalendarCheck />, color: "#4F46E5", route: "/tl/attendance" },
        { title: "Apply Leave", sub: "Request time off", icon: <FaUmbrellaBeach />, color: "#F59E0B", route: "/tl/leave" },
        { title: "Payroll", sub: "View payslips", icon: <FaMoneyCheckAlt />, color: "#10B981", route: "/tl/payroll" },
    ];

    const quickActionsTeam = [
        { title: `Review Leaves${pendingLeaves > 0 ? ` (${pendingLeaves})` : ""}`, sub: "Pending approvals", icon: <FaClipboardList />, color: "#F59E0B", route: "/tl/leave-approval" },
        { title: "My Team", sub: "View team members", icon: <FaUsers />, color: "#4F46E5", route: "/tl/team" },
        { title: "Team Attendance", sub: "Daily overview", icon: <FaCalendarCheck />, color: "#10B981", route: "/tl/team-attendance" },
    ];

    return (
        <>
            <style>{css}</style>
            <DashboardLayout>
                <div className="tl-root">

                    {/* HERO */}
                    <div className="tl-hero">
                        <h2>
                            {greeting.icon}
                            {greeting.text}, {user?.name?.split(" ")[0]}
                            <span className="tl-hero-badge">Team Lead</span>
                        </h2>
                        <p>Your personal summary and team overview for this month</p>

                        <div className="tl-hero-grid">
                            <div>
                                <small className="tl-hero-label">Status</small>
                                <h3 className="tl-hero-value">{myStats.today?.status || "Not Started"}</h3>
                            </div>
                            <div>
                                <small className="tl-hero-label">Punch In</small>
                                <h3 className="tl-hero-value">
                                    {myStats.today?.punchIn ? formatTime(myStats.today.punchIn) : "--"}
                                </h3>
                            </div>
                            <div>
                                <small className="tl-hero-label">Team Size</small>
                                <h3 className="tl-hero-value">{teamLoading ? "—" : teamMembers.length}</h3>
                            </div>
                        </div>
                    </div>

                    {/* ── MY STATS ── */}
                    <p className="tl-section-label">My Overview</p>
                    <div className="tl-cards-grid">
                        {myCards.map((c) => (
                            <div
                                key={c.title}
                                className="tl-stat-card"
                                style={{ "--card-accent": c.color, "--card-accent-bg": `${c.color}15` }}
                            >
                                <div className="tl-stat-top">
                                    <span className="tl-stat-title">{c.title}</span>
                                    <div className="tl-stat-icon" style={{ color: c.color }}>{c.icon}</div>
                                </div>
                                <h2 className="tl-stat-value">{c.value}</h2>
                                <p className="tl-stat-sub">{c.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* TIMELINE */}
                    <div className="tl-card">
                        <h4 className="tl-card-title">Today's Timeline</h4>
                        <div className="tl-timeline-grid">
                            <div className="tl-timeline-item">
                                <div className="tl-timeline-circle" style={{ "--timeline-bg": "var(--success-bg, #DCFCE7)", color: "#16A34A" }}>
                                    <FaSignInAlt />
                                </div>
                                <h6 className="tl-timeline-label">Punch In</h6>
                                <p className="tl-timeline-value">{formatTime(myStats.today?.punchIn)}</p>
                            </div>
                            <div className="tl-timeline-item">
                                <div className="tl-timeline-circle" style={{ "--timeline-bg": "var(--brand-light, #ECFDF5)", color: "#4F46E5" }}>
                                    <FaLaptopCode />
                                </div>
                                <h6 className="tl-timeline-label">Current Status</h6>
                                <p className="tl-timeline-value">
                                    {myStats.today?.punchIn && !myStats.today?.punchOut
                                        ? "Working"
                                        : myStats.today?.punchOut
                                            ? "Completed"
                                            : "Not Started"}
                                </p>
                            </div>
                            <div className="tl-timeline-item">
                                <div className="tl-timeline-circle" style={{ "--timeline-bg": "var(--warn-bg, #FEF3C7)", color: "#D97706" }}>
                                    <FaClock />
                                </div>
                                <h6 className="tl-timeline-label">Shift Ends</h6>
                                <p className="tl-timeline-value">
                                    {myStats.today?.shift
                                        ? `${String(myStats.today.shift.endHour).padStart(2, "0")}:${String(myStats.today.shift.endMinute).padStart(2, "0")}`
                                        : "--"}
                                </p>
                            </div>
                            <div className="tl-timeline-item">
                                <div className="tl-timeline-circle" style={{ "--timeline-bg": "var(--danger-bg, #FEE2E2)", color: "#DC2626" }}>
                                    <FaDoorOpen />
                                </div>
                                <h6 className="tl-timeline-label">Punch Out</h6>
                                <p className="tl-timeline-value">{formatTime(myStats.today?.punchOut)}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── TEAM STATS ── */}
                    <p className="tl-section-label">Team Overview</p>
                    <div className="tl-cards-grid">
                        {teamCards.map((c) => (
                            <div
                                key={c.title}
                                className="tl-stat-card"
                                style={{ "--card-accent": c.color, "--card-accent-bg": `${c.color}15` }}
                            >
                                <div className="tl-stat-top">
                                    <span className="tl-stat-title">{c.title}</span>
                                    <div className="tl-stat-icon" style={{ color: c.color }}>{c.icon}</div>
                                </div>
                                <h2 className="tl-stat-value">{c.value}</h2>
                                <p className="tl-stat-sub">{c.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── QUICK ACTIONS ── */}
                    <div className="tl-card">
                        <h4 className="tl-card-title">Personal Actions</h4>
                        <div className="tl-actions-grid">
                            {quickActionsPersonal.map((a) => (
                                <div
                                    key={a.title}
                                    className="tl-action-row"
                                    onClick={() => navigate(a.route)}
                                    style={{ "--action-accent": a.color, "--action-accent-bg": `${a.color}15` }}
                                >
                                    <div className="tl-action-left">
                                        <div className="tl-action-icon">{a.icon}</div>
                                        <div>
                                            <p className="tl-action-title">{a.title}</p>
                                            <p className="tl-action-sub">{a.sub}</p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="tl-action-chevron" size={14} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="tl-card">
                        <h4 className="tl-card-title">Team Actions</h4>
                        <div className="tl-actions-grid">
                            {quickActionsTeam.map((a) => (
                                <div
                                    key={a.title}
                                    className="tl-action-row"
                                    onClick={() => navigate(a.route)}
                                    style={{ "--action-accent": a.color, "--action-accent-bg": `${a.color}15` }}
                                >
                                    <div className="tl-action-left">
                                        <div className="tl-action-icon">{a.icon}</div>
                                        <div>
                                            <p className="tl-action-title">{a.title}</p>
                                            <p className="tl-action-sub">{a.sub}</p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="tl-action-chevron" size={14} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── TEAM MEMBERS LIST ── */}
                    {!teamLoading && teamMembers.length > 0 && (
                        <div className="tl-card">
                            <h4 className="tl-card-title">My Team Members</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
                                {teamMembers.map((member) => (
                                    <div key={member._id} className="tl-member-row">
                                        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                                            <div className="tl-member-avatar">
                                                {(member.name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
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
                </div>
            </DashboardLayout>
        </>
    );
};

export default TLDashboard;