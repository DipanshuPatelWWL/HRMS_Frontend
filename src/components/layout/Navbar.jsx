import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../common/NotificationBell";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

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
    "/employee/sales-reports": "Lead Data",
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
    "/tl/sales-reports": "Lead Data",
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
    "/hr/assets": "Assets Management",
    "/hr/activity-monitor": "Activity Monitor",
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
    "/manager-sales-intelligence": "Sales Intelligence",
    "/hr/sales-intelligence": "Sales Intelligence",
    "/sales-intelligence": "Sales Intelligence",
    "/manager-daily-report": "Daily Report",
    "/manager-policies": "Policy Management",
    "/manager-activity-monitor": "Activity Monitor",
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


const resolveTitle = (pathname) => {
    if (pageTitles[pathname]) return pageTitles[pathname];

    // Check longest matching prefix
    const match = Object.keys(pageTitles)
        .filter(key => pathname.startsWith(key + "/"))
        .sort((a, b) => b.length - a.length)[0];

    return match ? pageTitles[match] : "HRMS";
};


const SunIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const MoonIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const Navbar = ({ onSidebarOpen, collapsed, onToggleCollapse }) => {
    const { user } = useContext(AuthContext);
    const { pathname } = useLocation();
    const { theme, toggle: toggleTheme } = useTheme();

    const title = resolveTitle(pathname);

    const initials = user?.name
        ?.split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    const profilePath = `/${pathname.split("/")[1]}/profile`;

    return (
        <>
            <style>{`
            /* ── Profile Link ── */
            .profile_name {
                text-decoration: none;
                color: inherit;
                outline: none;
            }

            /* ── User Chip ── */
            .user-chip {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px 12px 5px 5px;
                border-radius: 999px;
                background: var(--surface-3);
                border: 1px solid var(--border);
                cursor: pointer;
                transition: background 0.2s ease, border-color 0.2s ease,
                            box-shadow 0.2s ease, transform 0.15s ease;
            }

            .user-chip:hover {
                background: var(--surface-2);
                border-color: var(--border-strong);
                box-shadow: 0 2px 8px rgba(99, 99, 200, 0.15);
                transform: translateY(-1px);
            }

            .user-chip:active {
                transform: translateY(0px);
                box-shadow: none;
                background: var(--surface-3);
            }

            /* ── Avatar ── */
            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: #fff;
                font-size: 13px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35);
                transition: transform 0.2s ease;
            }

            .user-chip:hover .user-avatar {
                transform: scale(1.08);
            }

            /* ── Username ── */
            .user-chip-name {
                font-size: 13.5px;
                font-weight: 500;
                color: var(--text-1);
                white-space: nowrap;
                transition: color 0.2s ease;
            }

            .user-chip:hover .user-chip-name {
                color: #4f46e5;
            }

            /* ── Theme Toggle ── */
.theme-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-3);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease,
                box-shadow 0.2s ease, transform 0.15s ease;
}

.theme-toggle-btn:hover {
    background: var(--surface-3);
    color: #4f46e5;
    border-color: #4f46e5;
    box-shadow: 0 2px 8px rgba(99, 99, 200, 0.15);
    transform: translateY(-1px) rotate(12deg);
}

.theme-toggle-btn:active {
    transform: translateY(0) rotate(0deg);
    box-shadow: none;
}

            /* ── Mobile ── */
            @media (max-width: 768px) {
                .user-chip-name {
                    display: none;
                }
                .user-chip {
                    padding: 5px;
                    border-radius: 50%;
                }
            }
        `}</style>

            <div className={`topnav ${collapsed ? "nav-collapsed" : ""}`}>
                <div className="topnav-left">
                    <button className="hamburger" onClick={onSidebarOpen} aria-label="Open menu">
                        <HamburgerIcon />
                    </button>
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
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle-btn"
                        aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                        title={theme === "light" ? "Dark mode" : "Light mode"}
                    >
                        {theme === "light" ? <MoonIcon /> : <SunIcon />}
                    </button>
                    <NotificationBell />
                    <Link to={profilePath} className="profile_name">
                        <div className="user-chip">
                            <div className="user-avatar">{initials}</div>
                            <span className="user-chip-name">{user?.name}</span>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Navbar;