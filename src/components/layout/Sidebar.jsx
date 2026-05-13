import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";

import {
    MdDashboard,
    MdAccessTime,
    MdEventNote,
    MdEditCalendar,
    MdOutlinePayments,
    MdAnnouncement,
    MdHeadsetMic,
    MdBarChart,
    MdEventAvailable,
    MdSensors,
    MdEvent,
    MdPsychology,
    MdTrendingUp,
    MdAssignment,
} from "react-icons/md";
import {
    FaUserAlt,
    FaUsers,
    FaUserFriends,
    FaUserMinus,
    FaClipboardCheck,
    FaClipboardList,
    FaListAlt,
    FaCommentDots,
    FaSignOutAlt,
    FaCalendarAlt,
} from "react-icons/fa";

/* ─── Scoped styles ─── */
const SIDEBAR_STYLES = `
  .sidebar .nav-item-label,
  .sidebar .sidebar-section-label,
  .sidebar .sidebar-title,
  .sidebar .nav-tooltip {
    color: #0a0a0a !important;
  }

  .sidebar-logo,
  .sidebar-brand .sidebar-logo {
    color: #ffffff !important;
    background: #4f46e5 !important;
  }

  .sidebar-footer .nav-item,
  .sidebar-footer .nav-item *,
  .sidebar-footer .nav-item span {
    color: var(--danger) !important;
  }

  .sidebar-section-label {
    font-weight: 700 !important;
    letter-spacing: 0.07em;
  }

  .sidebar {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    max-height: 100dvh !important;
    overflow: hidden !important;
  }

  .sidebar-nav {
    flex: 1 1 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    scrollbar-width: thin;
    scrollbar-color: #4f46e5 transparent;
  }

  .sidebar-nav::-webkit-scrollbar { width: 4px; }
  .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
  .sidebar-nav::-webkit-scrollbar-thumb {
    background: #4f46e566;
    border-radius: 4px;
  }

  .sidebar-footer {
    flex-shrink: 0 !important;
    padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
  }

  .nav-item {
    transition: background 0.15s ease !important;
    position: relative;
    overflow: hidden;
  }

  .nav-item:not(.active):hover {
    background: #4e46e52d !important;
  }

  .nav-item.active {
    background: #625be79a !important;
  }

  .nav-icon {
    flex-shrink: 0;
  }
`;

/* ─── Icon map: iconKey → React Icon component ─── */
const ICON_MAP = {
    dashboard: MdDashboard,
    attendance: MdAccessTime,
    holiday: FaCalendarAlt,
    leave: FaUserMinus,
    attendanceCorrection: MdEditCalendar,
    payroll: MdOutlinePayments,
    profile: FaUserAlt,
    employees: FaUsers,
    leaveApprove: FaClipboardCheck,
    payrollMgmt: MdOutlinePayments,
    tasks: FaListAlt,
    helpdesk: FaCommentDots,
    announcements: MdAnnouncement,
    team: FaUserFriends,
    attendanceOverview: MdBarChart,
    holidayMgmt: MdEventAvailable,
    correctionRequests: FaClipboardList,
    helpdeskMgmt: MdHeadsetMic,
    myAttendance: MdEventNote,
    scanLogs: MdSensors,
    upcomingEvents: MdEvent,        // calendar-style event icon for "Upcoming Events"
    aiTraining: MdPsychology,       // brain/AI icon for "AI Training"
    salesReport: MdTrendingUp,      // trending chart icon for "Sales Report"
    dailyReport: MdAssignment,      // clipboard/document icon for "Daily Report"
};

/**
 * NavItem – renders a Link with icon + label.
 */
const NavItem = ({ to, label, iconKey, onClick, collapsed }) => {
    const { pathname } = useLocation();
    const active =
        pathname === to ||
        (to !== "/hr" && to !== "/employee" && to !== "/tl" && to !== "/manager" && pathname.startsWith(to + "/"));

    const IconComponent = ICON_MAP[iconKey] || MdDashboard;

    return (
        <Link
            to={to}
            className={`nav-item ${active ? "active" : ""}`}
            style={{ textDecoration: "none", color: "#0a0a0a" }}
            onClick={onClick}
            title={collapsed ? label : undefined}
        >
            <IconComponent size={18} className="nav-icon" />
            <span className="nav-item-label" style={{ color: "#0a0a0a", fontWeight: active ? 600 : 500 }}>
                {label}
            </span>
            <span className="nav-tooltip">{label}</span>
        </Link>
    );
};

/**
 * Sidebar
 *
 * Props:
 *  isOpen    – boolean – mobile drawer open state
 *  onClose   – fn      – close the mobile drawer
 *  collapsed – boolean – desktop icon-only state
 */
const Sidebar = ({ isOpen, onClose, collapsed }) => {
    const { user, logout } = useContext(AuthContext);
    const styleInjected = useRef(false);

    const navRef = useRef(null);

    useEffect(() => {
        if (styleInjected.current) return;
        const tag = document.createElement("style");
        tag.setAttribute("data-sidebar-styles", "1");
        tag.textContent = SIDEBAR_STYLES;
        document.head.appendChild(tag);
        styleInjected.current = true;
    }, []);



    useLayoutEffect(() => {
        const nav = navRef.current;

        if (!nav) return;

        // Restore instantly before paint
        const savedScroll = sessionStorage.getItem("sidebar-scroll");

        if (savedScroll) {
            nav.scrollTop = parseInt(savedScroll, 10);
        }

        const handleScroll = () => {
            sessionStorage.setItem("sidebar-scroll", nav.scrollTop);
        };

        nav.addEventListener("scroll", handleScroll);

        return () => {
            nav.removeEventListener("scroll", handleScroll);
        };
    }, []);


    const sidebarClass = [
        "sidebar",
        isOpen ? "sidebar-open" : "",
        collapsed ? "sidebar-collapsed" : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={sidebarClass}>
            {/* ── Brand ── */}
            <div className="sidebar-brand">
                <div className="sidebar-logo">HR</div>
                <span className="sidebar-title" style={{ color: "#0a0a0a" }}>HRMS</span>

                {/* Mobile-only close button */}
                <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* ── Navigation ── */}
            <nav className="sidebar-nav" ref={navRef}>

                {/* EMPLOYEE */}
                {user?.role === "employee" && (
                    <div className="sidebar-section">
                        <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Employee</div>
                        <NavItem to="/employee" label="Dashboard" iconKey="dashboard" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/attendance" label="Attendance" iconKey="attendance" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/holidays" label="Holiday Calendar" iconKey="holiday" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/leave" label="Leave" iconKey="leave" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/attendance-correction" label="Attendance Correction" iconKey="attendanceCorrection" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/daily-report" label="Daily Report" iconKey="dailyReport" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/payroll" label="Payroll" iconKey="payroll" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/tasks" label="Tasks" iconKey="tasks" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/helpdesk" label="Helpdesk" iconKey="helpdesk" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/announcements" label="Announcements" iconKey="announcements" onClick={onClose} collapsed={collapsed} />

                        {
                            user.role === "employee" && user.department === "Sales" && user.designation !== "Business Development Manager" && user.designation !== "Business Development Executive" && (
                                <NavItem to="/employee/sales-reports" label="Sales Report" iconKey="salesReport" onClick={onClose} collapsed={collapsed} />

                            )
                        }

                        <div>
                            {/* BDE - BDM  */}
                            {
                                user.department === "Sales" &&
                                (
                                    user.designation === "Business Development Manager" ||
                                    user.designation === "Business Development Executive"
                                ) && (
                                    <NavItem
                                        to="/sales-reports"
                                        label="Sales Report"
                                        iconKey="salesReport"
                                        onClick={onClose}
                                        collapsed={collapsed}
                                    />
                                )
                            }
                        </div>

                        <NavItem to="/employee/profile" label="Profile" iconKey="profile" onClick={onClose} collapsed={collapsed} />
                    </div>
                )}

                {/* TL */}
                {user?.role === "tl" && (
                    <>
                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>My Space</div>
                            <NavItem to="/tl" label="Dashboard" iconKey="dashboard" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/attendance" label="My Attendance" iconKey="attendance" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/holidays" label="Holiday Calendar" iconKey="holiday" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/leave" label="My Leave" iconKey="leave" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/attendance-correction" label="Attendance Correction" iconKey="attendanceCorrection" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/payroll" label="My Payroll" iconKey="payroll" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/tasks" label="My Tasks" iconKey="tasks" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/helpdesk" label="Helpdesk" iconKey="helpdesk" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/announcements" label="Announcements" iconKey="announcements" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/profile" label="Profile" iconKey="profile" onClick={onClose} collapsed={collapsed} />
                        </div>

                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Team</div>
                            <NavItem to="/tl/team" label="My Team" iconKey="team" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/leave-approval" label="Leave Approvals" iconKey="leaveApprove" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/team-attendance" label="Team Attendance" iconKey="attendanceOverview" onClick={onClose} collapsed={collapsed} />
                        </div>
                    </>
                )}


                {/* HR */}
                {user?.role === "hr" && (
                    <>
                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Overview</div>
                            <NavItem to="/hr" label="Dashboard" iconKey="dashboard" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/employees" label="Employees" iconKey="employees" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr-attendance" label="Attendance Overview" iconKey="attendanceOverview" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/holidays" label="Holiday Management" iconKey="holidayMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/announcements" label="Announcements" iconKey="announcements" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/scan-logs" label="Scan Logs" iconKey="scanLogs" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/upcoming-events" label="Upcoming Events" iconKey="upcomingEvents" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/ai-training" label="AI Training" iconKey="aiTraining" onClick={onClose} collapsed={collapsed} />
                        </div>
                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Management</div>
                            <NavItem to="/hr/leave-approval" label="Leave Approvals" iconKey="leaveApprove" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/employee-leave" label="Employee Leaves" iconKey="myAttendance" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/correction-requests" label="Attendance Management" iconKey="correctionRequests" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/payroll-management" label="Payroll" iconKey="payrollMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/helpdesk" label="Helpdesk Management" iconKey="helpdeskMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/employee/attendance" label="My Attendance" iconKey="myAttendance" onClick={onClose} collapsed={collapsed} />
                        </div>
                    </>
                )}

                {/* MANAGER */}
                {user?.role === "manager" && (
                    <>
                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Overview</div>
                            <NavItem to="/manager" label="Dashboard" iconKey="dashboard" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-employees" label="Employees" iconKey="employees" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-attendance" label="Attendance Overview" iconKey="attendanceOverview" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-holidays" label="Holiday Management" iconKey="holidayMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-announcements" label="Announcements" iconKey="announcements" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-scan-logs" label="Scan Logs" iconKey="scanLogs" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-view-task" label="View Tasks" iconKey="tasks" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager/upcoming-events" label="Upcoming Events" iconKey="upcomingEvents" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-sales-reports" label="Sales Report" iconKey="salesReport" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-daily-report" label="Daily Report" iconKey="dailyReport" onClick={onClose} collapsed={collapsed} />
                        </div>
                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Management</div>
                            <NavItem to="/manager-leave-approval" label="Leave Approvals" iconKey="leaveApprove" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-correction-requests" label="Attendance Management" iconKey="correctionRequests" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-payroll-management" label="Payroll" iconKey="payrollMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-helpdesk" label="Helpdesk Management" iconKey="helpdeskMgmt" onClick={onClose} collapsed={collapsed} />
                        </div>
                    </>
                )}

            </nav>

            {/* ── Footer logout ── */}
            <div className="sidebar-footer">
                <button
                    onClick={logout}
                    className="nav-item"
                    style={{ color: "var(--danger)" }}
                    title={collapsed ? "Logout" : undefined}
                >
                    <FaSignOutAlt size={18} className="nav-icon" />
                    <span className="nav-item-label">Logout</span>
                    <span className="nav-tooltip">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;