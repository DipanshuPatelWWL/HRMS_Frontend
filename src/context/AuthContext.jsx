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
                .then(res => setUser(res.data.user))
                .catch(() => localStorage.removeItem("token"))
                .finally(() => setChecking(false));
        } else {
            setChecking(false);
        }
    }, []);

    const login = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);

        // ── Send token to Electron agent via local server ──
        fetch("http://127.0.0.1:57373/set-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: data.token }),
        }).catch(() => {
            // Electron not running — silently ignored
        });
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);

        // ── Clear token from Electron agent ──
        fetch("http://127.0.0.1:57373/clear-token", {
            method: "POST",
        }).catch(() => { });
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