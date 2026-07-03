import { createContext, useState, useEffect } from "react";
import API from "../services/api";
import StopwatchLoader from "../components/common/StopwatchLoader";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    // ─────────────────────────────────────────────
    //  ELECTRON IPC
    // ─────────────────────────────────────────────
    const sendTokenToAgent = (token) => {

        if (window.hrmsAgent?.isElectron?.()) {
            window.hrmsAgent.setToken(token);
        }
    };

    // ─────────────────────────────────────────────
    //  GET LOCAL AGENT SECRET
    // ─────────────────────────────────────────────
    const getAgentSecret = async () => {

        try {

            const ctrl = new AbortController();

            const timeout = setTimeout(() => {
                ctrl.abort();
            }, 2000);

            const res = await fetch(
                "http://127.0.0.1:57373/agent-secret",
                {
                    method: "GET",
                    signal: ctrl.signal,
                }
            );

            clearTimeout(timeout);

            if (!res.ok) {
                return null;
            }

            const data = await res.json();

            return data.secret || null;

        } catch (e) {
            return null;
        }
    };

    // ─────────────────────────────────────────────
    //  SEND TOKEN TO LOCAL AGENT SERVER
    // ─────────────────────────────────────────────
    const sendTokenToAgentServer = async (token) => {

        try {

            const secret = await getAgentSecret();

            if (!secret) {
                return;
            }

            const ctrl = new AbortController();

            const timeout = setTimeout(() => {
                ctrl.abort();
            }, 2000);

            await fetch("http://127.0.0.1:57373/set-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-agent-secret": secret,
                },
                body: JSON.stringify({ token }),
                signal: ctrl.signal,
            });

            clearTimeout(timeout);

        } catch (e) {
            // Agent not running — silently ignore
        }
    };

    // ─────────────────────────────────────────────
    //  RESTORE SESSION ON PAGE REFRESH
    // ─────────────────────────────────────────────
    useEffect(() => {

        const token = localStorage.getItem("token");

        if (token) {

            API.get("/auth/me")
                .then((res) => {

                    setUser(res.data.user);

                    // Electron window sync
                    sendTokenToAgent(token);

                    // Local tracking agent sync
                    sendTokenToAgentServer(token);
                })
                .catch(() => {

                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                })
                .finally(() => {
                    setChecking(false);
                });

        } else {
            setChecking(false);
        }

    }, []);

    // ─────────────────────────────────────────────
    //  LOGIN
    // ─────────────────────────────────────────────
    const login = (data) => {

        localStorage.setItem("token", data.token);

        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        setUser(data.user);

        // Electron IPC sync
        sendTokenToAgent(data.token);

        // Local tracking agent sync
        sendTokenToAgentServer(data.token);
    };

    // ─────────────────────────────────────────────
    //  LOGOUT
    // ─────────────────────────────────────────────
    const logout = async () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);

        // Electron IPC
        if (window.hrmsAgent?.isElectron?.()) {
            window.hrmsAgent.clearToken();
        }

        try {

            const secret = await getAgentSecret();

            if (!secret) {
                return;
            }

            const ctrl = new AbortController();

            const timeout = setTimeout(() => {
                ctrl.abort();
            }, 2000);

            await fetch(
                "http://127.0.0.1:57373/clear-token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-agent-secret": secret,
                    },
                    signal: ctrl.signal,
                }
            );

            clearTimeout(timeout);

        } catch (e) {
            // Ignore if agent not running
        }
    };

    // ─────────────────────────────────────────────
    //  LOADING SCREEN
    // ─────────────────────────────────────────────
    if (checking) {
        return <StopwatchLoader />;
    }

    const refreshUser = async () => {
        try {
            const res = await API.get("/auth/me");
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
        } catch { /* silent */ }
    };

    // ─────────────────────────────────────────────
    //  PROVIDER
    // ─────────────────────────────────────────────
    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};