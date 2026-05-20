import { createContext, useContext, useState, useCallback } from "react";

const NotificationDotContext = createContext(null);

/* Map notification type → which route(s) get a dot */
const TYPE_TO_ROUTES = {
    announcement: ["/employee/announcements", "/tl/announcements", "/hr/announcements", "/manager-announcements"],
    leave_applied: ["/hr/leave-approval", "/tl/leave-approval", "/manager-leave-approval"],
    leave_approved: ["/employee/leave", "/tl/leave"],
    leave_rejected: ["/employee/leave", "/tl/leave"],
    task_assigned: ["/employee/tasks", "/tl/tasks"],
    task_updated: ["/employee/tasks", "/tl/tasks"],
    task_done: ["/tl/team", "/manager-view-task"],
    ticket_replied: ["/employee/helpdesk", "/tl/helpdesk", "/hr/helpdesk", "/manager-helpdesk"],
    ticket_resolved: ["/employee/helpdesk", "/tl/helpdesk", "/hr/helpdesk", "/manager-helpdesk"],
    payroll: ["/employee/payroll", "/tl/payroll"],
    attendance_alert: ["/employee/attendance", "/tl/attendance"],
    general: [],
};

export const NotificationDotProvider = ({ children }) => {
    // Set of route strings that have an unread dot
    const [dotRoutes, setDotRoutes] = useState(new Set());

    const addDots = useCallback((notificationType) => {
        const routes = TYPE_TO_ROUTES[notificationType] || TYPE_TO_ROUTES.general;
        if (!routes.length) return;
        setDotRoutes(prev => {
            const next = new Set(prev);
            routes.forEach(r => next.add(r));
            return next;
        });
    }, []);

    const clearDot = useCallback((route) => {
        setDotRoutes(prev => {
            if (!prev.has(route)) return prev;
            const next = new Set(prev);
            next.delete(route);
            return next;
        });
    }, []);

    const hasDot = useCallback((route) => dotRoutes.has(route), [dotRoutes]);

    return (
        <NotificationDotContext.Provider value={{ addDots, clearDot, hasDot }}>
            {children}
        </NotificationDotContext.Provider>
    );
};

export const useNotificationDots = () => {
    const ctx = useContext(NotificationDotContext);
    if (!ctx) throw new Error("useNotificationDots must be inside NotificationDotProvider");
    return ctx;
};