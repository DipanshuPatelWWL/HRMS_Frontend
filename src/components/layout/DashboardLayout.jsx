import { useState, useCallback, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Load collapsed state from localStorage or default to false (expanded)
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });

    const openSidebar = useCallback(() => setSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    const toggleCollapse = useCallback(() => {
        setCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('sidebar-collapsed', newState);
            return newState;
        });
    }, []);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;

            // Prevent scrolling
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            // Restore scrolling
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';

            // Restore scroll position
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [sidebarOpen]);

    return (
        <div style={{ display: "flex" }}>
            {/* Backdrop – clicking closes sidebar on mobile */}
            <div
                className={`sidebar-backdrop ${sidebarOpen ? "sidebar-open" : ""}`}
                onClick={closeSidebar}
            />

            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
                collapsed={collapsed}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
                <Navbar
                    onSidebarOpen={openSidebar}
                    collapsed={collapsed}
                    onToggleCollapse={toggleCollapse}
                />
                <main className={`layout-main ${collapsed ? "main-collapsed" : ""}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;