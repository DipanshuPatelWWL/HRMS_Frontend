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
                    // Re-sync token to agent on every page load/refresh
                    sendTokenToAgent(token);
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

    const login = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        sendTokenToAgent(data.token);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);

        // IPC only — Electron window handles this
        if (window.hrmsAgent?.isElectron?.()) {
            window.hrmsAgent.clearToken();
        }
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