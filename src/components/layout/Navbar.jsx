import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../common/NotificationBell";
import { useLocation } from "react-router-dom";

const pageTitles = {
    // Employee
    "/employee": "Dashboard",
    "/employee/attendance": "Attendance",
    "/employee/holidays": "Holiday Calendar",
    "/employee/leave": "Leave",
    "/employee/attendance-correction": "Attendance Correction Request",
    "/employee/payroll": "Payroll",
    "/employee/profile": "Profile",
    "/employee/tasks": "Tasks",
    "/employee/helpdesk": "Helpdesk",
    "/employee/announcements": "Announcements",

    "/employee/sales-reports": "Sales Report",

    // TL – Personal
    "/tl": "TL Dashboard",
    "/tl/attendance": "My Attendance",
    "/tl/holidays": "Holiday Calendar",
    "/tl/leave": "My Leave",
    "/tl//attendance-correction": "Attendance Correction Request",
    "/tl/payroll": "My Payroll",
    "/tl/profile": "Profile",
    "/tl/tasks": "My Tasks",
    "/tl/helpdesk": "Helpdesk",
    "/tl/announcements": "Announcements",

    // TL – Team
    "/tl/team": "My Team",
    "/tl/leave-approval": "Leave Approvals",
    "/tl/team-attendance": "Team Attendance",

    // HR
    "/hr": "HR Dashboard",
    "/hr/employees": "Employees",
    "/hr-attendance": "Attendance Overview",
    "/hr/leave-approval": "Leave Approvals",
    "/hr/correction-requests": "Attendance Management",
    "/hr/payroll-management": "Payroll Management",
    "/hr/helpdesk": "Helpdesk Management",
    "/hr/holidays": "Holiday Management",
    "/hr/announcements": "Announcements",
    "/hr/scan-logs": "Scan Logs",
    "/hr/employee-leave": "Employee Leaves",
    "/hr/upcoming-events": "Upcoming Events",
    "/hr/ai-training": "AI Training",

    // Manager

    "/manager": "Manager Dashboard",
    "/manager-view-task": "View Tasks",
    "/manager/upcoming-events": "Upcoming Events",
    "/manager-sales-reports": "Sales Reports",
};

/* ── Icons ── */
const HamburgerIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

/* Collapse left / expand right chevrons */
const CollapseIcon = ({ collapsed }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {collapsed
            ? <path d="M9 18l6-6-6-6" />   /* chevron-right  = expand */
            : <path d="M15 18l-6-6 6-6" /> /* chevron-left   = collapse */
        }
    </svg>
);

/**
 * Navbar
 *
 * Props:
 *  onSidebarOpen – fn      – opens mobile drawer
 *  collapsed     – boolean – current desktop collapse state
 *  onToggleCollapse – fn   – toggles desktop collapse
 */
const Navbar = ({ onSidebarOpen, collapsed, onToggleCollapse }) => {
    const { user } = useContext(AuthContext);
    const { pathname } = useLocation();
    const title = pageTitles[pathname] || "HRMS";
    const initials = user?.name
        ?.split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return (
        <div className={`topnav ${collapsed ? "nav-collapsed" : ""}`}>
            <div className="topnav-left">

                {/* ── Mobile: hamburger opens the drawer ── */}
                <button
                    className="hamburger"
                    onClick={onSidebarOpen}
                    aria-label="Open menu"
                >
                    <HamburgerIcon />
                </button>

                {/* ── Desktop: collapse / expand toggle ── */}
                <button
                    className="sidebar-toggle-btn desktop-toggle"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <CollapseIcon collapsed={collapsed} />
                </button>

                <span className="page-title">{title}</span>
            </div>

            <div className="topnav-right">
                <NotificationBell />

                <div className="user-chip">
                    <div className="user-avatar">{initials}</div>

                    {/* Name hidden on very small screens via CSS */}
                    <span className="user-chip-name">{user?.name}</span>

                    {/* TL role badge */}
                    {user?.role === "tl" && (
                        <span style={{
                            fontSize: ".68rem",
                            fontWeight: 700,
                            background: "var(--brand-light)",
                            color: "var(--brand)",
                            padding: ".15rem .4rem",
                            borderRadius: "999px",
                            letterSpacing: ".03em",
                        }}>
                            TL
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;