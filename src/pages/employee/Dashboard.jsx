import { useEffect, useState } from "react";
import {
    FaCalendarCheck,
    FaUmbrellaBeach,
    FaMoneyCheckAlt,
    FaCalendarAlt,
    FaChevronRight,
    FaChartLine,
    FaCheckCircle,
    FaClock,
    FaCircle,
    FaSignInAlt,
    FaLaptopCode,
    FaDoorOpen,
    FaSun,
    FaMoon,
} from "react-icons/fa";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";

const css = `
.emp-root *, .emp-root *::before, .emp-root *::after { box-sizing: border-box; }
.emp-root { font-family: 'DM Sans', sans-serif; color: var(--text-1); }

/* HERO BANNER */
.emp-hero {
    margin-bottom: 24px;
    padding: 28px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--brand, #4F46E5), var(--brand-strong, #6366F1));
    color: #fff;
    position: relative;
    overflow: hidden;
}
.emp-hero::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,.08);
}
.emp-hero h2 { margin-bottom: 8px; font-weight: 700; }
.emp-hero p { opacity: .9; margin-bottom: 24px; }
.emp-hero-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:18px; position:relative; z-index:1; }
.emp-hero-label { opacity:.8; font-size:.78rem; }
.emp-hero-value { margin-top:6px; font-weight:700; }

/* STAT CARDS */
.emp-cards-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:20px; margin-bottom:25px; }
.emp-stat-card {
    background: var(--surface);
    border-radius: 16px;
    padding: 22px;
    border-top: 4px solid var(--card-accent);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 4px 15px rgba(0,0,0,.06);
    transition: transform .25s ease, box-shadow .25s ease;
}
.emp-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0,0,0,.12);
}
.emp-stat-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.emp-stat-title { font-size:14px; color:var(--text-2); font-weight:500; }
.emp-stat-icon {
    width:45px; height:45px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    background: var(--card-accent-bg); font-size:20px;
    transition: transform .25s ease;
}
.emp-stat-card:hover .emp-stat-icon { transform: scale(1.12) rotate(-6deg); }
.emp-stat-value { font-size:34px; font-weight:700; margin-bottom:6px; color:var(--text-1); }
.emp-stat-sub { color:var(--text-2); font-size:14px; }

/* QUICK ACTIONS */
.emp-card { background: var(--surface); border: 1px solid var(--border); border-radius:16px; margin-top:25px; padding: 22px 24px; }
.emp-card-title { margin-bottom:20px; font-weight:700; color: var(--text-1); }
.emp-actions-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:18px; }
.emp-action-row {
    cursor:pointer;
    border:1px solid var(--border);
    border-radius:14px;
    padding:18px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    background: var(--surface);
    transition: background .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.emp-action-row:hover {
    background: var(--surface-2);
    border-color: var(--border-strong);
    transform: translateX(4px);
    box-shadow: 0 4px 14px rgba(0,0,0,.08);
}
.emp-action-left { display:flex; align-items:center; gap:14px; }
.emp-action-icon {
    width:50px; height:50px; border-radius:12px;
    background: var(--action-accent-bg); color: var(--action-accent);
    display:flex; align-items:center; justify-content:center; font-size:22px;
    transition: transform .2s ease;
}
.emp-action-row:hover .emp-action-icon { transform: scale(1.1); }
.emp-action-title { margin:0; font-weight:600; color: var(--text-1); }
.emp-action-sub { color: var(--text-2); }
.emp-action-chevron { color: var(--text-3); transition: transform .2s ease; }
.emp-action-row:hover .emp-action-chevron { transform: translateX(4px); color: var(--brand, #6366F1); }

/* TIMELINE */
.emp-timeline-grid { display:flex; justify-content:space-between; flex-wrap:wrap; gap:20px; }
.emp-timeline-item { flex:1; min-width:180px; text-align:center; }
.emp-timeline-circle {
    width:55px; height:55px; margin:0 auto; border-radius:50%;
    display:flex; align-items:center; justify-content:center; font-size:20px;
    background: var(--timeline-bg);
    transition: transform .2s ease;
}
.emp-stat-icon svg, .emp-timeline-circle svg, .emp-action-icon svg { display:block; }
.emp-timeline-item:hover .emp-timeline-circle { transform: scale(1.1); }
.emp-timeline-label { margin-top:12px; font-weight:600; color: var(--text-1); }
.emp-timeline-value { color: var(--text-2); margin-top: 4px; }
`;

const EmployeeDashboard = () => {
    const [stats, setStats] = useState({
        attendancePercentage: 0,
        presentDays: 0,
        lateDays: 0,
        leavesTaken: 0,
        pendingLeaves: 0,
        absentDays: 0,
        workedDays: 0,
        workingDays: 0,
        totalWorkHours: 0,
        avgDailyHours: 0,
        employee: {},
        today: {},
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {

        API.get("/reports/dashboard")
            .then((res) => {

                if (res.data?.data) {

                    setStats(res.data.data);

                }

            })
            .catch((err) => {

                console.error(err);

                setError(
                    err.response?.data?.message ||
                    "Failed to load dashboard"
                );

            })
            .finally(() => {

                setLoading(false);

            });

    }, []);


    const formatTime = (time) => {

        if (!time) return "--";

        return new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    };

    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return {
                text: "Good Morning",
                icon: <FaSun />,
            };
        }

        if (hour >= 12 && hour < 17) {
            return {
                text: "Good Afternoon",
                icon: <FaSun />,
            };
        }

        if (hour >= 17 && hour < 21) {
            return {
                text: "Good Evening",
                icon: <FaSun />,
            };
        }

        return {
            text: "Good Night",
            icon: <FaMoon />,
        };
    };

    const greeting = getGreeting();


    const cards = [
        {
            id: 1,
            title: "Attendance",
            value: loading ? "--" : `${stats.attendancePercentage}%`,
            subtitle: "Monthly Attendance",
            color: "#4F46E5",
            icon: <FaChartLine />
        },
        {
            id: 2,
            title: "Present Days",
            value: loading ? "--" : stats.presentDays,
            subtitle: `${stats.workingDays} Working Days`,
            color: "#10B981",
            icon: <FaCheckCircle />
        },
        {
            id: 3,
            title: "Late Days",
            value: loading ? "--" : stats.lateDays,
            subtitle: "This Month",
            color: "#EF4444",
            icon: <FaClock />
        },
        {
            id: 4,
            title: "Today's Status",
            value: stats.today?.status || "--",
            subtitle: stats.today?.punchIn
                ? `In at ${formatTime(stats.today.punchIn)}`
                : "Not Started",
            color: "#22C55E",
            icon: <FaCircle />
        }
    ];

    const quickActions = [
        {
            id: 1,
            title: "Attendance",
            subtitle: "View Attendance",
            icon: <FaCalendarCheck />,
            color: "#4F46E5",
            route: "/employee/attendance",
        },
        {
            id: 2,
            title: "Apply Leave",
            subtitle: "Request Leave",
            icon: <FaUmbrellaBeach />,
            color: "#F59E0B",
            route: "/employee/leave",
        },
        {
            id: 3,
            title: "Payroll",
            subtitle: "View Payslips",
            icon: <FaMoneyCheckAlt />,
            color: "#10B981",
            route: "/employee/payroll",
        },
        {
            id: 4,
            title: "Holiday Calendar",
            subtitle: "Upcoming Holidays",
            icon: <FaCalendarAlt />,
            color: "#EF4444",
            route: "/employee/holidays",
        },
    ];

    if (error) return (
        <DashboardLayout>
            <p style={{ color: "red", padding: "2rem" }}>{error}</p>
        </DashboardLayout>
    );

    return (
        <>
            <style>{css}</style>
            <DashboardLayout>
                <div className="emp-root">
                    <div className="emp-hero">

                        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {greeting.icon}
                            {greeting.text}, {stats.employee?.name}
                        </h2>
                        <p>Welcome back. Here's your work summary for today.</p>

                        <div className="emp-hero-grid">
                            <div>
                                <small className="emp-hero-label">Status</small>
                                <h3 className="emp-hero-value">{stats.today?.status || "Not Started"}</h3>
                            </div>

                            <div>
                                <small className="emp-hero-label">Punch In</small>
                                <h3 className="emp-hero-value">
                                    {stats.today?.punchIn ? formatTime(stats.today.punchIn) : "--"}
                                </h3>
                            </div>

                            <div>
                                <small className="emp-hero-label">Shift</small>
                                <h3 className="emp-hero-value">
                                    {stats.today?.shift
                                        ? `${String(stats.today.shift.startHour).padStart(2, "0")}:${String(stats.today.shift.startMinute).padStart(2, "0")} - ${String(stats.today.shift.endHour).padStart(2, "0")}:${String(stats.today.shift.endMinute).padStart(2, "0")}`
                                        : "--"}
                                </h3>
                            </div>
                        </div>
                    </div>

                </div>


                <div className="emp-cards-grid">
                    {cards.map((item) => (
                        <div
                            key={item.id}
                            className="emp-stat-card"
                            style={{
                                "--card-accent": item.color,
                                "--card-accent-bg": `${item.color}15`,
                            }}
                        >
                            <div className="emp-stat-top">
                                <span className="emp-stat-title">{item.title}</span>
                                <div className="emp-stat-icon">{item.icon}</div>
                            </div>

                            <h2 className="emp-stat-value">{item.value}</h2>
                            <p className="emp-stat-sub">{item.subtitle}</p>
                        </div>
                    ))}
                </div>

                <div className="emp-card">
                    <h4 className="emp-card-title">Today's Timeline</h4>

                    <div className="emp-timeline-grid">
                        <div className="emp-timeline-item">
                            <div className="emp-timeline-circle" style={{ "--timeline-bg": "var(--success-bg, #DCFCE7)", color: "#16A34A" }}>
                                <FaSignInAlt />
                            </div>
                            <h6 className="emp-timeline-label">Punch In</h6>
                            <p className="emp-timeline-value">{formatTime(stats.today?.punchIn)}</p>
                        </div>

                        <div className="emp-timeline-item">
                            <div className="emp-timeline-circle" style={{ "--timeline-bg": "var(--brand-light, #ECFDF5)", color: "#4F46E5" }}>
                                <FaLaptopCode />
                            </div>
                            <h6 className="emp-timeline-label">Current Status</h6>
                            <p className="emp-timeline-value">
                                {stats.today?.punchIn && !stats.today?.punchOut
                                    ? "Working"
                                    : stats.today?.punchOut
                                        ? "Completed"
                                        : "Not Started"}
                            </p>
                        </div>

                        <div className="emp-timeline-item">
                            <div className="emp-timeline-circle" style={{ "--timeline-bg": "var(--warn-bg, #FEF3C7)", color: "#D97706" }}>
                                <FaClock />
                            </div>
                            <h6 className="emp-timeline-label">Shift Ends</h6>
                            <p className="emp-timeline-value">
                                {stats.today?.shift
                                    ? `${String(stats.today.shift.endHour).padStart(2, "0")}:${String(stats.today.shift.endMinute).padStart(2, "0")}`
                                    : "--"}
                            </p>
                        </div>

                        <div className="emp-timeline-item">
                            <div className="emp-timeline-circle" style={{ "--timeline-bg": "var(--danger-bg, #FEE2E2)", color: "#DC2626" }}>
                                <FaDoorOpen />
                            </div>
                            <h6 className="emp-timeline-label">Punch Out</h6>
                            <p className="emp-timeline-value">{formatTime(stats.today?.punchOut)}</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
};

export default EmployeeDashboard;