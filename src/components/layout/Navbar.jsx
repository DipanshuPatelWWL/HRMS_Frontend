import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../common/NotificationBell";
import { useLocation } from "react-router-dom";

const pageTitles = {
    // ── Employee ──────────────────────────────────────────────
    "/employee": "Dashboard",
    "/employee/attendance": "Attendance",
    "/employee/holidays": "Holiday Calendar",
    "/employee/leave": "Leave",
    "/employee/attendance-correction": "Attendance Correction",
    "/employee/payroll": "Payroll",
    "/employee/profile": "Profile",
    "/employee/tasks": "Tasks",
    "/employee/helpdesk": "Helpdesk",
    "/employee/announcements": "Announcements",
    "/employee/assets": "Assets",
    "/employee/policies": "Policies",
    "/employee/sales-reports": "Sales Report",
    "/employee/daily-report": "Daily Report",
    "/sales-reports": "Sales Report",      // BDE / BDM route

    // ── TL – Personal ─────────────────────────────────────────
    "/tl": "TL Dashboard",
    "/tl/attendance": "My Attendance",
    "/tl/holidays": "Holiday Calendar",
    "/tl/leave": "My Leave",
    "/tl/attendance-correction": "Attendance Correction",
    "/tl/payroll": "My Payroll",
    "/tl/profile": "Profile",
    "/tl/tasks": "My Tasks",
    "/tl/policies": "Policies",
    "/tl/helpdesk": "Helpdesk",
    "/tl/announcements": "Announcements",
    "/tl/assets": "Assets",

    // ── TL – Team ─────────────────────────────────────────────
    "/tl/team": "My Team",
    "/tl/daily-report": "Daily Report",
    "/tl/leave-approval": "Leave Approvals",
    "/tl/team-attendance": "Team Attendance",

    // ── HR – Overview ─────────────────────────────────────────
    "/hr": "HR Dashboard",
    "/hr/employees": "Employees",
    "/hr-attendance": "Attendance Overview",
    "/hr/holidays": "Holiday Management",
    "/hr/announcements": "Announcements",
    "/hr/scan-logs": "Scan Logs",
    "/hr/upcoming-events": "Upcoming Events",
    "/hr/ai-training": "AI Training",
    "/hr/assets": "Assets Management",
    "/hr/policies": "Policy Management",
    "/hr/profile": "Profile",

    // ── HR – Management ───────────────────────────────────────
    "/hr/leave-approval": "Leave Approvals",
    "/hr/employee-leave": "Employee Leaves",
    "/hr/correction-requests": "Attendance Management",
    "/hr/payroll-management": "Payroll Management",
    "/hr/helpdesk": "Helpdesk Management",

    // ── Manager – Overview ────────────────────────────────────
    "/manager": "Manager Dashboard",
    "/manager-employees": "Employees",
    "/manager-attendance": "Attendance Overview",
    "/manager-holidays": "Holiday Management",
    "/manager-announcements": "Announcements",
    "/manager-scan-logs": "Scan Logs",
    "/manager-view-task": "View Tasks",
    "/manager/upcoming-events": "Upcoming Events",
    "/manager-sales-reports": "Sales Reports",
    "/manager-daily-report": "Daily Report",
    "/manager-policies": "Policy Management",
    "/manager-assets": "Assets Management",
    "/manager/profile": "Profile",

    // ── Manager – Management ──────────────────────────────────
    "/manager-leave-approval": "Leave Approvals",
    "/manager-correction-requests": "Attendance Management",
    "/manager-payroll-management": "Payroll Management",
    "/manager-helpdesk": "Helpdesk Management",
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

const CollapseIcon = ({ collapsed }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {collapsed
            ? <path d="M9 18l6-6-6-6" />   /* chevron-right = expand  */
            : <path d="M15 18l-6-6 6-6" /> /* chevron-left  = collapse */
        }
    </svg>
);

/**
 * Resolve the page title for the current pathname.
 * Falls back to checking if any key is a prefix of the pathname
 * (handles dynamic segments like /employee/attendance/123).
 */
const resolveTitle = (pathname) => {
    if (pageTitles[pathname]) return pageTitles[pathname];

    // Check longest matching prefix
    const match = Object.keys(pageTitles)
        .filter(key => pathname.startsWith(key + "/"))
        .sort((a, b) => b.length - a.length)[0];

    return match ? pageTitles[match] : "HRMS";
};

/**
 * Navbar
 *
 * Props:
 *  onSidebarOpen    – fn      – opens mobile drawer
 *  collapsed        – boolean – current desktop collapse state
 *  onToggleCollapse – fn      – toggles desktop collapse
 */
const Navbar = ({ onSidebarOpen, collapsed, onToggleCollapse }) => {
    const { user } = useContext(AuthContext);
    const { pathname } = useLocation();

    const title = resolveTitle(pathname);

    const initials = user?.name
        ?.split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return (
        <div className={`topnav ${collapsed ? "nav-collapsed" : ""}`}>
            <div className="topnav-left">

                {/* Mobile: hamburger opens the drawer */}
                <button
                    className="hamburger"
                    onClick={onSidebarOpen}
                    aria-label="Open menu"
                >
                    <HamburgerIcon />
                </button>

                {/* Desktop: collapse / expand toggle */}
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

                    <span className="user-chip-name">{user?.name}</span>

                </div>
            </div>
        </div>
    );
};

export default Navbar;