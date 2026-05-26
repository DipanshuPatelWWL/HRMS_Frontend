import { createContext, useState, useEffect } from "react";
import API from "../services/api";
import StopwatchLoader from "../components/common/StopwatchLoader";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    // On mount: try to restore session from token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            API.get("/auth/me")
                .then(res => {
                    setUser(res.data.user);
                    // Re-sync token to Electron IPC
                    sendTokenToAgent(token);
                    // Re-sync token to agent token server (browser tab on office PC)
                    sendTokenToAgentServer(token);
                })
                .catch(() => localStorage.removeItem("token"))
                .finally(() => setChecking(false));
        } else {
            setChecking(false);
        }
    }, []);

    const sendTokenToAgent = (token) => {
        if (window.hrmsAgent?.isElectron?.()) {
            window.hrmsAgent.setToken(token);
        }
    };


    const sendTokenToAgentServer = async (token) => {
        try {
            const ctrl = new AbortController();
            setTimeout(() => ctrl.abort(), 2000);
            await fetch("http://127.0.0.1:57373/set-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
                signal: ctrl.signal,
            });
        } catch (e) {
            // Agent not running on this machine — silently ignore
        }
    };

    const login = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        sendTokenToAgent(data.token);
        sendTokenToAgentServer(data.token);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);

        // IPC — Electron window
        if (window.hrmsAgent?.isElectron?.()) {
            window.hrmsAgent.clearToken();
        }

        try {
            const ctrl = new AbortController();
            setTimeout(() => ctrl.abort(), 2000);
            fetch("http://127.0.0.1:57373/clear-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: ctrl.signal,
            }).catch(() => { });
        } catch (e) { }
    };

    if (checking) {
        return (
            <StopwatchLoader />
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};