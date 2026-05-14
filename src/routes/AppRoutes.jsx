import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Auth
import Login from "../pages/auth/Login";

// Common
import HolidayCalendar from "../components/common/HolidayCalendar";

// Employee pages
import EmployeeDashboard from "../pages/employee/Dashboard";
import Attendance from "../pages/employee/Attendance";
import Leave from "../pages/employee/Leave";
import Payroll from "../pages/employee/Payroll";
import Profile from "../pages/employee/Profile";
import Tasks from "../pages/employee/Tasks";
import Helpdesk from "../pages/employee/Helpdesk";
import Announcements from "../pages/employee/Announcements";
import MyAssets from "../pages/employee/MyAssets";

import SalesReports from "../pages/employee/SalesReports"
import DailyReports from "../pages/employee/DailyReports";

// TL pages
import TLDashboard from "../pages/teamLeader/Tldashboard"; // NEW

// HR pages
import HRDashboard from "../pages/hr/Dashboard";
import Employees from "../pages/hr/Employees";
import LeaveApproval from "../pages/hr/LeaveApproval";
import PayrollMgmt from "../pages/hr/PayrollMgmt";
import HRHoliday from "../pages/hr/Holiday";
import AnnouncementsPage from "../pages/hr/AnnouncementsPage";
import AttendanceCorrectionRequest from "../pages/employee/AttendanceCorrectionRequest";
import AttendanceCorrectionApproval from "../pages/hr/AttendanceCorrectionApproval";
import HRHelpdesk from "../pages/hr/HRHelpdesk";
import TeamAttendance from "../pages/teamLeader/TeamAttendance";
import HRAttendanceOverview from "../pages/hr/HRAttendanceOverview";
import PublicProfile from "../pages/employee/PublicProfile";
import ScanLogsPage from "../components/scanner/ScanLogsPage";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerTasks from "../pages/manager/ManagerTasks";
import EmployeeLeaves from "../pages/hr/EmployeeLeaves";
import Celebrations from "../components/common/Celebrations";
import ManagerSalesReports from "../pages/manager/ManagerSalesReports";
import ManagerDailyReport from "../pages/manager/ManagerDailyReport";
import HRAITraining from "../components/ai/HRAITraining";
import BDESalesReport from "../pages/bde-bdm/BDESalesReport";
import AssetManagement from "../pages/hr/AssetManagement";

// ─────────────────────────────────────────────
//  Protected route
// ─────────────────────────────────────────────
const Protected = ({ children, allowedRoles, allowedDesignations }) => {
    const { user } = useContext(AuthContext);

    if (!user) return <Navigate to="/login" replace />;

    // allowedRoles not passed → any authenticated user can access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their correct home
        if (user.role === "hr") return <Navigate to="/hr" replace />;
        if (user.role === "tl") return <Navigate to="/tl" replace />;
        if (user.role === "manager") return <Navigate to="/manager" replace />;
        return <Navigate to="/employee" replace />;
    }

    if (
        allowedDesignations &&
        !allowedDesignations.includes(user.designation)
    ) {
        return <Navigate to="/employee" replace />;
    }

    return children;
};

// ─────────────────────────────────────────────
//  Root redirect based on role
// ─────────────────────────────────────────────
const RoleRedirect = () => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === "hr") return <Navigate to="/hr" replace />;
    if (user.role === "tl") return <Navigate to="/tl" replace />;
    return <Navigate to="/employee" replace />;
};

const AppRoutes = () => (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/employee/:employeeId" element={<PublicProfile />} />

        {/* ── EMPLOYEE ROUTES ── */}
        <Route path="/employee" element={<Protected allowedRoles={["employee"]}><EmployeeDashboard /></Protected>} />
        <Route path="/employee/attendance" element={<Protected><Attendance /></Protected>} />
        <Route path="/employee/leave" element={<Protected allowedRoles={["employee"]}><Leave /></Protected>} />
        <Route path="/employee/payroll" element={<Protected allowedRoles={["employee"]}><Payroll /></Protected>} />
        <Route path="/employee/profile" element={<Protected allowedRoles={["employee"]}><Profile /></Protected>} />
        <Route path="/employee/tasks" element={<Protected allowedRoles={["employee"]}><Tasks /></Protected>} />
        <Route path="/employee/helpdesk" element={<Protected allowedRoles={["employee"]}><Helpdesk /></Protected>} />
        <Route path="/employee/announcements" element={<Protected allowedRoles={["employee"]}><Announcements /></Protected>} />
        <Route path="/employee/holidays" element={<Protected allowedRoles={["employee"]}><HolidayCalendar /></Protected>} />
        <Route path="/employee/attendance-correction" element={<Protected allowedRoles={["employee"]}><AttendanceCorrectionRequest /></Protected>} />
        <Route path="/employee/daily-report" element={<Protected allowedRoles={["employee"]}><DailyReports /></Protected>} />
        <Route path="/employee/assets" element={<Protected allowedRoles={["employee"]}><MyAssets /></Protected>} />

        {/* Sales Report Route */}
        <Route path="/employee/sales-reports"
            element={<Protected allowedRoles={["employee"]}
                allowedDepartment={["Sales"]}>
                <SalesReports />
            </Protected>} />


        {/* ── TL ROUTES ── */}
        {/* Dashboard */}
        <Route path="/tl" element={<Protected allowedRoles={["tl"]}><TLDashboard /></Protected>} />

        {/* Personal (reusing same components as employee – TL is also an employee) */}
        <Route path="/tl/team-attendance" element={<Protected allowedRoles={["tl"]}><TeamAttendance /></Protected>} />
        <Route path="/tl/leave" element={<Protected allowedRoles={["tl"]}><Leave /></Protected>} />
        <Route path="/tl/payroll" element={<Protected allowedRoles={["tl"]}><Payroll /></Protected>} />
        <Route path="/tl/profile" element={<Protected allowedRoles={["tl"]}><Profile /></Protected>} />
        <Route path="/tl/tasks" element={<Protected allowedRoles={["tl"]}><Tasks /></Protected>} />
        <Route path="/tl/helpdesk" element={<Protected allowedRoles={["tl"]}><Helpdesk /></Protected>} />
        <Route path="/tl/announcements" element={<Protected allowedRoles={["tl"]}><Announcements /></Protected>} />
        <Route path="/tl/holidays" element={<Protected allowedRoles={["tl"]}><HolidayCalendar /></Protected>} />
        <Route path="/tl/attendance-correction" element={<Protected allowedRoles={["tl"]}><AttendanceCorrectionRequest /></Protected>} />
        <Route path="/tl/assets" element={<Protected allowedRoles={["tl"]}><MyAssets /></Protected>} />

        {/* Team management – reuse HR components (they already handle role-based filtering on backend) */}
        <Route path="/tl/team" element={<Protected allowedRoles={["tl"]}><Employees /></Protected>} />
        <Route path="/tl/leave-approval" element={<Protected allowedRoles={["tl"]}><LeaveApproval /></Protected>} />
        <Route path="/tl/attendance" element={<Protected allowedRoles={["tl"]}><Attendance /></Protected>} />


        {/* BDE - BDM  */}

        <Route
            path="/sales-reports"
            element={
                <Protected
                    allowedRoles={["employee"]}
                    allowedDesignations={[
                        "Business Development Executive",
                        "Business Development Manager"
                    ]}
                >
                    <BDESalesReport />
                </Protected>
            }
        />


        {/* ── HR ROUTES ── */}
        <Route path="/hr" element={<Protected allowedRoles={["hr"]}><HRDashboard /></Protected>} />
        <Route path="/hr/employees" element={<Protected allowedRoles={["hr"]}><Employees /></Protected>} />
        <Route path="/hr/leave-approval" element={<Protected allowedRoles={["hr"]}><LeaveApproval /></Protected>} />
        <Route path="/hr/payroll-management" element={<Protected allowedRoles={["hr"]}><PayrollMgmt /></Protected>} />
        <Route path="/hr/holidays" element={<Protected allowedRoles={["hr"]}><HRHoliday /></Protected>} />
        <Route path="/hr/announcements" element={<Protected allowedRoles={["hr"]}><AnnouncementsPage /></Protected>} />
        <Route path="/hr/correction-requests" element={<Protected allowedRoles={["hr"]}><AttendanceCorrectionApproval /></Protected>} />
        <Route path="/hr/helpdesk" element={<Protected allowedRoles={["hr"]}><HRHelpdesk /></Protected>} />
        <Route path="/hr-attendance" element={<Protected allowedRoles={["hr"]}><HRAttendanceOverview /></Protected>} />
        <Route path="/hr/scan-logs" element={<Protected allowedRoles={["hr"]}><ScanLogsPage /></Protected>} />
        <Route path="/hr/employee-leave" element={<Protected allowedRoles={["hr"]}><EmployeeLeaves /></Protected>} />
        <Route path="/hr/upcoming-events" element={<Protected allowedRoles={["hr"]}><Celebrations /></Protected>} />
        <Route path="/hr/ai-training" element={<Protected allowedRoles={["hr"]}><HRAITraining /></Protected>} />
        <Route path="/hr/assets" element={<Protected allowedRoles={["hr"]}><AssetManagement /></Protected>} />




        {/* Manager Routes */}
        <Route path="/manager" element={<Protected allowedRoles={["manager"]}><ManagerDashboard /></Protected>} />
        <Route path="/manager-employees" element={<Protected allowedRoles={["manager"]}><Employees /></Protected>} />
        <Route path="/manager-leave-approval" element={<Protected allowedRoles={["manager"]}><LeaveApproval /></Protected>} />
        <Route path="/manager-payroll-management" element={<Protected allowedRoles={["manager"]}><PayrollMgmt /></Protected>} />
        <Route path="/manager-holidays" element={<Protected allowedRoles={["manager"]}><HRHoliday /></Protected>} />
        <Route path="/manager-announcements" element={<Protected allowedRoles={["manager"]}><AnnouncementsPage /></Protected>} />
        <Route path="/manager-correction-requests" element={<Protected allowedRoles={["manager"]}><AttendanceCorrectionApproval /></Protected>} />
        <Route path="/manager-helpdesk" element={<Protected allowedRoles={["manager"]}><HRHelpdesk /></Protected>} />
        <Route path="/manager-attendance" element={<Protected allowedRoles={["manager"]}><HRAttendanceOverview /></Protected>} />
        <Route path="/manager-scan-logs" element={<Protected allowedRoles={["manager"]}><ScanLogsPage /></Protected>} />
        <Route path="/manager-view-task" element={<Protected allowedRoles={["manager"]}><ManagerTasks /></Protected>} />
        <Route path="/manager/upcoming-events" element={<Protected allowedRoles={["manager"]}><Celebrations /></Protected>} />
        <Route path="/manager-sales-reports" element={<Protected allowedRoles={["manager"]}><ManagerSalesReports /></Protected>} />
        <Route path="/manager-daily-report" element={<Protected allowedRoles={["manager"]}><ManagerDailyReport /></Protected>} />
        <Route path="/manager-assets" element={<Protected allowedRoles={["manager"]}><AssetManagement /></Protected>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
);

export default AppRoutes;