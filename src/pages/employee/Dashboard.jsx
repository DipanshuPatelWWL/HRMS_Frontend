import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";

const StatCard = ({ title, value, accent, sub }) => (
    <div className={`stat-card ${accent}`}>
        <p style={{ fontSize: ".8rem", fontWeight: 500, color: "var(--text-3)", marginBottom: ".4rem" }}>{title}</p>
        <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: ".78rem", color: "var(--text-3)", marginTop: ".35rem" }}>{sub}</p>}
    </div>
);

const EmployeeDashboard = () => {
    const [stats, setStats] = useState({ attendancePercentage: 0, leavesTaken: 0, lateDays: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        API.get("/reports/dashboard")
            .then(res => {
                if (res.data?.data) setStats(res.data.data);
            })
            .catch(err => {
                console.error(err);
                setError(err.response?.data?.message || "Failed to load dashboard");
            })
            .finally(() => setLoading(false));
    }, []);


    const cards = [
        { title: "Attendance", value: loading ? "—" : `${stats.attendancePercentage}%`, accent: "brand", sub: "This month" },
        { title: "Leaves Taken", value: loading ? "—" : stats.leavesTaken, accent: "warn", sub: "Total approved" },
        { title: "Late Days", value: loading ? "—" : stats.lateDays, accent: "danger", sub: "This month" },
    ];

    const handleNavigate = (id) => {
        if (id == 2) {
            navigate("/employee/leave")
        } else if (id == 1) {
            navigate("/employee/attendance")
        } else {
            navigate("/employee/payroll")
        }
    }

    if (error) return (
        <DashboardLayout>
            <p style={{ color: "red", padding: "2rem" }}>{error}</p>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="page-header">
                <h1>Overview</h1>
                <p>Your attendance and leave summary for this month</p>
            </div>

            <div className="grid-stats">
                {cards.map(c => <StatCard key={c.title} {...c} />)}
            </div>

            {/* Quick tips */}
            <div className="card" style={{ marginTop: "1.25rem" }}>
                <p className="fw-600" style={{ marginBottom: ".75rem" }}>Quick actions</p>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                    <button onClick={() => handleNavigate(1)} className="btn btn-primary btn-sm">Mark Attendance</button>
                    <button onClick={() => handleNavigate(2)} className="btn btn-ghost btn-sm">Apply Leave</button>
                    <button onClick={() => handleNavigate(3)} className="btn btn-ghost btn-sm">View Payslips</button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDashboard;