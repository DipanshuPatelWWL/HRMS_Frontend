import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNotificationDots } from "../common/NotificationDot";

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
    MdInventory2,
    MdManageAccounts,
    MdSpaceDashboard,
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

  /* ── FIXED: logo gets NO background – transparent always ── */
  .sidebar-logo {
    width: 44px !important;
    height: 44px !important;
    object-fit: contain !important;
    background: transparent !important;
    border-radius: 8px !important;
    display: block !important;
    flex-shrink: 0 !important;
  }

  /* ── Brand row ── */
  .sidebar-brand {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 14px 14px 10px !important;
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

  /* ── Nav item base ── */
  .nav-item {
   transition: background 0.15s ease !important;
    position: relative;
    overflow: visible;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 9px 14px !important;
    border-radius: 8px !important;
    margin: 1px 6px !important;
    cursor: pointer;
    border: none;
    background: transparent;
    width: calc(100% - 12px) !important;
    box-sizing: border-box !important;
  }

  .nav-item:not(.active):hover {
    background: #4e46e52d !important;
  }

  .nav-item.active {
    background: #625be79a !important;
  }

  .nav-icon {
    flex-shrink: 0 !important;
    width: 18px !important;
    height: 18px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .nav-item-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.875rem;
    line-height: 1;
  }

  .sidebar-collapsed .nav-item-label {
    display: none !important;
  }

  .nav-tooltip {
    display: none !important;
  }

  .sidebar-collapsed .nav-item {
    justify-content: center !important;
    padding: 10px !important;
    margin: 1px auto !important;
    width: 40px !important;
    border-radius: 10px !important;
  }

  .sidebar-collapsed .sidebar-section-label {
    display: none !important;
  }

  .sidebar-collapsed .sidebar-section {
    padding-top: 4px !important;
  }

  /* Collapsed: hide title and logo gets centered */
  .sidebar-collapsed .sidebar-brand {
    justify-content: center !important;
    padding: 14px 0 10px !important;
  }

  .sidebar-collapsed .sidebar-title,
  .sidebar-collapsed .sidebar-close {
    display: none !important;
  }

  /* Collapsed logo slightly smaller */
  .sidebar-collapsed .sidebar-logo {
    width: 36px !important;
    height: 36px !important;
  }

  /* Tooltip on hover in collapsed mode */
  .sidebar-collapsed .nav-item:hover::after {
    content: attr(title);
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: #1e1b4b;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    padding: 5px 10px;
    border-radius: 6px;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

 .sidebar-collapsed .nav-item:hover::before {
    content: '';
    position: absolute;
    left: calc(100% + 4px);
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: #1e1b4b;
    pointer-events: none;
    z-index: 9999;
  }

  /* Notification dot — collapsed: absolute top-right of icon */
    .sidebar-collapsed .nb-nav-dot {
    position: absolute !important;
    top: -8px !important;
    right: -10px !important;
    margin-left: 0 !important;
  }
`;

/* ─── Icon map ─── */
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
    upcomingEvents: MdEvent,
    aiTraining: MdPsychology,
    salesReport: MdTrendingUp,
    dailyReport: MdAssignment,
    assets: MdInventory2,
    assetsMgmt: MdManageAccounts,
    viewTasks: MdSpaceDashboard,
    policies: MdAssignment,
};

const NavItem = ({ to, label, iconKey, onClick, collapsed }) => {
    const { pathname } = useLocation();
    const { hasDot, clearDot } = useNotificationDots();

    const active =
        pathname === to ||
        (
            to !== "/hr" &&
            to !== "/employee" &&
            to !== "/tl" &&
            to !== "/manager" &&
            pathname.startsWith(to + "/")
        );

    // Clear dot when this tab becomes active
    useEffect(() => {
        if (active && hasDot(to)) {
            clearDot(to);
        }
    }, [active, to, hasDot, clearDot]);

    const showDot = hasDot(to) && !active;
    const IconComponent = ICON_MAP[iconKey] || MdDashboard;

    return (
        <Link
            to={to}
            className={`nav-item ${active ? "active" : ""}`}
            style={{ textDecoration: "none", color: "#0a0a0a" }}
            onClick={onClick}
            title={label}
        >
            {/* Icon wrapper — relative so dot can anchor to it in collapsed mode */}
            <span style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <IconComponent size={18} className="nav-icon" />
                {/* Collapsed dot: sits on top-right corner of the icon */}
                {showDot && collapsed && (
                    <span
                        className="nb-nav-dot"
                        style={{
                            position: "absolute",
                            top: -6,
                            right: -10,
                            background: "#7c3aed",
                            color: "#fff",
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            padding: "1px 4px",
                            borderRadius: "4px",
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                            boxShadow: "0 0 0 2px #fff",
                            lineHeight: 1.4,
                            letterSpacing: "0.02em",
                        }}
                    >
                        New
                    </span>
                )}
            </span>

            <span
                className="nav-item-label"
                style={{ color: "#0a0a0a", fontWeight: active ? 600 : 500 }}
            >
                {label}
            </span>

            {/* Expanded dot: sits at far right of the row */}
            {showDot && !collapsed && (
                <span
                    className="nb-nav-dot"
                    style={{
                        background: "#7c3aed",
                        color: "#fff",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        flexShrink: 0,
                        marginLeft: "auto",
                        whiteSpace: "nowrap",
                        lineHeight: 1.4,
                        letterSpacing: "0.03em",
                    }}
                >
                    New
                </span>
            )}
        </Link>
    );
};

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
        const savedScroll = sessionStorage.getItem("sidebar-scroll");
        if (savedScroll) nav.scrollTop = parseInt(savedScroll, 10);
        const handleScroll = () => sessionStorage.setItem("sidebar-scroll", nav.scrollTop);
        nav.addEventListener("scroll", handleScroll);
        return () => nav.removeEventListener("scroll", handleScroll);
    }, []);

    const sidebarClass = [
        "sidebar",
        isOpen ? "sidebar-open" : "",
        collapsed ? "sidebar-collapsed" : "",
    ].filter(Boolean).join(" ");

    const isSalesBDE =
        user?.department === "Sales" &&
        (
            user?.designation === "Business Development Manager" ||
            user?.designation === "Business Development Executive"
        );

    const isSalesOther =
        user?.role === "employee" &&
        user?.department === "Sales" &&
        !isSalesBDE;

    const isSalesTL =
        user?.role === "tl" &&
        user?.department === "Sales";

    return (
        <div className={sidebarClass}>
            {/* ── Brand ── */}
            <div className="sidebar-brand">
                {/* 
                  KEY FIX: img tag only — no wrapper div with purple bg.
                  The logo PNG itself has the WXL branding; we just display it cleanly.
                */}
                <img
                    src="/logo4.png"
                    alt="HRMS Logo"
                    className="sidebar-logo"
                />

                <span className="sidebar-title" style={{ color: "#0a0a0a", fontWeight: 600, fontSize: "1rem" }}>
                    HRMS
                </span>

                <button
                    className="sidebar-close"
                    onClick={onClose}
                    aria-label="Close menu"
                    style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* ── Navigation ── */}
            <nav className="sidebar-nav" ref={navRef}>

                {/* ══ EMPLOYEE ══ */}
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
                        <NavItem to="/employee/assets" label="Assets" iconKey="assets" onClick={onClose} collapsed={collapsed} />
                        <NavItem to="/employee/policies" label="Policies" iconKey="policies" onClick={onClose} collapsed={collapsed} />
                        {isSalesOther && (
                            <NavItem to="/employee/sales-reports" label="Lead Data" iconKey="salesReport" onClick={onClose} collapsed={collapsed} />
                        )}
                        {isSalesBDE && (
                            <NavItem to="/sales-reports" label="Sales Report" iconKey="salesReport" onClick={onClose} collapsed={collapsed} />
                        )}
                        <NavItem to="/employee/profile" label="Profile" iconKey="profile" onClick={onClose} collapsed={collapsed} />
                    </div>
                )}

                {/* ══ TL ══ */}
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
                            <NavItem to="/tl/assets" label="Assets" iconKey="assets" onClick={onClose} collapsed={collapsed} />
                            {isSalesTL && (
                                <NavItem to="/tl/sales-reports" label="Lead Data" iconKey="salesReport" onClick={onClose} collapsed={collapsed} />)}
                            <NavItem to="/tl/policies" label="Policies" iconKey="policies" onClick={onClose} collapsed={collapsed} />
                        </div>
                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Team</div>
                            <NavItem to="/tl/team" label="My Team" iconKey="team" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/daily-report" label="Daily Report" iconKey="dailyReport" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/leave-approval" label="Leave Approvals" iconKey="leaveApprove" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/team-attendance" label="Team Attendance" iconKey="attendanceOverview" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/tl/profile" label="Profile" iconKey="profile" onClick={onClose} collapsed={collapsed} />
                        </div>
                    </>
                )}

                {/* ══ HR ══ */}
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
                            <NavItem to="/hr/assets" label="Assets Management" iconKey="assetsMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/activity-monitor" label="Activity Monitor" iconKey="scanLogs" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/policies" label="Policy Management" iconKey="policies" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/profile" label="Profile" iconKey="profile" onClick={onClose} collapsed={collapsed} />
                        </div>
                        <div className="sidebar-section">
                            <div className="sidebar-section-label" style={{ color: "#0a0a0a" }}>Management</div>
                            <NavItem to="/hr/leave-approval" label="Leave Approvals" iconKey="leaveApprove" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/employee-leave" label="Employee Leaves" iconKey="myAttendance" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/correction-requests" label="Attendance Management" iconKey="correctionRequests" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/payroll-management" label="Payroll" iconKey="payrollMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/hr/helpdesk" label="Helpdesk Management" iconKey="helpdeskMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/employee/attendance" label="My Attendance" iconKey="attendance" onClick={onClose} collapsed={collapsed} />
                        </div>
                    </>
                )}

                {/* ══ MANAGER ══ */}
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
                            <NavItem to="/manager-view-task" label="View Tasks" iconKey="viewTasks" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager/upcoming-events" label="Upcoming Events" iconKey="upcomingEvents" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-sales-reports" label="Sales Report" iconKey="salesReport" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-daily-report" label="Daily Report" iconKey="dailyReport" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-assets" label="Assets Management" iconKey="assetsMgmt" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-activity-monitor" label="Activity Monitor" iconKey="scanLogs" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager-policies" label="Policy Management" iconKey="policies" onClick={onClose} collapsed={collapsed} />
                            <NavItem to="/manager/profile" label="Profile" iconKey="profile" onClick={onClose} collapsed={collapsed} />
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
                    style={{ color: "var(--danger)", background: "transparent", border: "none", cursor: "pointer" }}
                    title="Logout"
                >
                    <FaSignOutAlt size={18} className="nav-icon" />
                    <span className="nav-item-label">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;