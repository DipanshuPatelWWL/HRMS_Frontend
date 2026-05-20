import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API, { BASE_URL } from "../../services/api";
import logo from "../../assets/logo.png";

import {
    FaBuilding,
    FaPhoneAlt,
    FaEnvelope,
    FaGlobe,
    FaUserTie,
    FaIdBadge
} from "react-icons/fa";

import { MdLocationOn } from "react-icons/md";
import { HiBadgeCheck } from "react-icons/hi";

/* ── Company info ── */
const COMPANY = {
    name: "World WebLogic",
    address: "B 108, 1st Floor, Office No. 2nd, Sector 63, Noida - 201309, Uttar Pradesh India",
    website: "worldweblogic.com",
    phone1: "+91 120 4545733",
    phone2: "+91 85058 37801",
    email: "info@worldweblogic.com",
};

/* ── Role themes ── */
const ROLE_THEME = {
    hr: { label: "Human Resources", grad: "linear-gradient(135deg,#1d4ed8,#3b82f6)", light: "#dbeafe", dark: "#1e3a8a", primary: "#1d4ed8" },
    manager: { label: "Manager", grad: "linear-gradient(135deg,#059669,#10b981)", light: "#d1fae5", dark: "#065f46", primary: "#059669" },
    tl: { label: "Team Lead", grad: "linear-gradient(135deg,#d97706,#f59e0b)", light: "#fef3c7", dark: "#92400e", primary: "#d97706" },
    employee: { label: "Employee", grad: "linear-gradient(135deg,#6d28d9,#8b5cf6)", light: "#ede9fe", dark: "#4c1d95", primary: "#6d28d9" },
    superadmin: { label: "Super Admin", grad: "linear-gradient(135deg,#dc2626,#ef4444)", light: "#fee2e2", dark: "#7f1d1d", primary: "#dc2626" },
};
const getTheme = (role) => ROLE_THEME[role?.toLowerCase()] ?? ROLE_THEME.employee;

const ff = "'Plus Jakarta Sans', sans-serif";

/* ════════════════════════════════════════
   LOADING SCREEN
════════════════════════════════════════ */
function LoadingScreen() {
    return (
        <div style={{
            minHeight: "100vh", display: "grid", placeItems: "center",
            background: "#f5f4f7", fontFamily: ff,
        }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                * { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>
            <div style={{ textAlign: "center", animation: "fadeUp .3s ease" }}>
                <div style={{
                    width: 44, height: 44,
                    border: "3px solid #e4e1f0",
                    borderTopColor: "#6c63ff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    margin: "0 auto 14px",
                }} />
                <p style={{ color: "#6b7280", fontSize: 13, fontWeight: 600 }}>Verifying employee…</p>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   ERROR SCREEN
════════════════════════════════════════ */
function ErrorScreen({ message }) {
    return (
        <div style={{
            minHeight: "100vh", display: "grid", placeItems: "center",
            background: "#f5f4f7", fontFamily: ff, padding: 24,
        }}>
            <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                * { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>
            <div style={{
                textAlign: "center", maxWidth: 340,
                background: "#fff", borderRadius: 20, padding: "40px 32px",
                boxShadow: "0 8px 32px rgba(0,0,0,.1)",
                animation: "fadeUp .3s ease",
            }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
                <p style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 8 }}>
                    Employee Not Found
                </p>
                <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                    {message || "This QR code is invalid or the employee is no longer active."}
                </p>
                <div style={{
                    background: "#f0f9ff", border: "1px solid #bae6fd",
                    borderRadius: 10, padding: "10px 14px",
                    fontSize: 11.5, color: "#0c4a6e", fontWeight: 500, lineHeight: 1.5,
                }}>
                    🏢 {COMPANY.name}<br />
                    📞 {COMPANY.phone1}
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   INFO ROW
════════════════════════════════════════ */
function InfoRow({ icon, label, value }) {
    if (!value) return null;
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 10,
            background: "#f8fafc", border: "1px solid #e2e8f0",
        }}>
            <span style={{
                fontSize: 18,
                flexShrink: 0,
                display: "flex",
                alignItems: "center"
            }}>
                {icon}
            </span>
            <div>
                <div style={{
                    fontSize: 9.5, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2,
                }}>
                    {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    {value}
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function PublicProfile() {
    const { employeeId } = useParams();
    const [emp, setEmp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await API.get(`/public/employee/${employeeId}`);
                setEmp(res.data.employee);
            } catch (err) {
                setError(
                    err?.response?.data?.message ||
                    "Employee not found or link is invalid."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [employeeId]);

    if (loading) return <LoadingScreen />;
    if (error) return <ErrorScreen message={error} />;

    const theme = getTheme(emp.role);
    const initials = emp.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
    const avatarSrc = emp.avatar
        ? (emp.avatar.startsWith("http") ? emp.avatar : `${BASE_URL}/${emp.avatar}`)
        : null;

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(160deg, #f5f4f7 0%, #ede9ff 100%)",
            fontFamily: ff, padding: "24px 16px 48px",
        }}>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes scaleIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
            `}</style>

            <div style={{ maxWidth: 440, margin: "0 auto" }}>

                {/* ── Verified tag ── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, marginBottom: 16,
                    animation: "fadeUp .3s ease",
                }}>
                    <span style={{
                        background: "#dcfce7", color: "#052e16",
                        fontSize: 10.5, fontWeight: 700, padding: "4px 12px",
                        borderRadius: 99, border: "1px solid #86efac",
                        display: "flex", alignItems: "center", gap: 5,
                    }}>
                        <HiBadgeCheck size={12} />
                        Official Employee Verification
                    </span>
                </div>

                {/* ── Main card ── */}
                <div style={{
                    background: "#fff", borderRadius: 24,
                    boxShadow: "0 12px 40px rgba(0,0,0,.13)",
                    overflow: "hidden",
                    animation: "scaleIn .35s ease",
                }}>
                    {/* Header band */}
                    <div style={{
                        background: `url(${logo}) center/contain no-repeat`,
                        backgroundColor: "#5750d3", // fallback color
                        height: 100,
                        position: "relative",
                        overflow: "hidden",
                    }}>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "0 22px 24px", position: "relative" }}>

                        {/* Avatar */}
                        <div style={{
                            marginTop: -44, marginBottom: 14,
                            display: "flex", alignItems: "flex-end", gap: 14,
                        }}>
                            <div style={{
                                width: 88, height: 88, borderRadius: "50%",
                                border: "4px solid #fff",
                                boxShadow: "0 4px 18px rgba(0,0,0,.16)",
                                overflow: "hidden", flexShrink: 0,
                                background: theme.grad,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {avatarSrc
                                    ? <img src={avatarSrc} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{initials}</span>}
                            </div>

                            {/* active badge next to avatar */}
                            {emp.status === "active" && (
                                <div style={{
                                    marginBottom: 8,
                                    background: "#dcfce7", color: "#052e16",
                                    fontSize: 10, fontWeight: 700,
                                    padding: "4px 10px", borderRadius: 99,
                                    border: "1px solid #86efac",
                                    display: "flex", alignItems: "center", gap: 5,
                                }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                                    Active
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <h1 style={{
                            fontSize: 24, fontWeight: 800, color: "#0f172a",
                            letterSpacing: "-.02em", marginBottom: 6, lineHeight: 1.2,
                        }}>
                            {emp.name}
                        </h1>

                        {/* Role pill */}
                        <span style={{
                            display: "inline-block",
                            background: theme.light, color: theme.dark,
                            fontSize: 10, fontWeight: 700,
                            padding: "4px 12px", borderRadius: 99,
                            textTransform: "uppercase", letterSpacing: ".07em",
                            marginBottom: 20,
                            border: `1px solid ${theme.primary}33`,
                        }}>
                            {theme.label}
                        </span>

                        {/* Info rows */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                            <InfoRow icon={<FaUserTie />} label="Designation" value={emp.designation} />
                            <InfoRow icon={<FaBuilding />} label="Department" value={emp.department} />
                            <InfoRow icon={<FaIdBadge />} label="Employee ID" value={emp.employeeId} />
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: "#f1f5f9", marginBottom: 16 }} />

                        {/* Company block */}
                        <div style={{
                            background: theme.light,
                            border: `1px solid ${theme.primary}22`,
                            borderRadius: 14,
                            padding: "14px 16px",
                            marginBottom: 14,
                        }}>
                            {/* Title */}
                            <p style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: theme.dark,
                                textTransform: "uppercase",
                                letterSpacing: ".08em",
                                marginBottom: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}>
                                <FaBuilding style={{ marginRight: 6, color: theme.primary }} />
                                Company Information
                            </p>

                            {/* Clickable rows */}
                            {[
                                {
                                    icon: <MdLocationOn />,
                                    text: COMPANY.address,
                                    link: "https://maps.app.goo.gl/QqBYL99MyRnPiAyB8"
                                },
                                {
                                    icon: <FaPhoneAlt />,
                                    text: `${COMPANY.phone1} · ${COMPANY.phone2}`,
                                    link: `tel:${COMPANY.phone1}`
                                },
                                {
                                    icon: <FaEnvelope />,
                                    text: COMPANY.email,
                                    link: `mailto:${COMPANY.email}`
                                },
                                {
                                    icon: <FaGlobe />,
                                    text: COMPANY.website,
                                    link: `https://${COMPANY.website}`
                                },
                            ].map(({ icon, text, link }, index) => (
                                <a
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "flex-start",
                                        marginBottom: 8,
                                        textDecoration: "none",
                                        color: theme.dark,
                                        padding: "6px 8px",
                                        borderRadius: 8,
                                        transition: "0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = theme.primary + "15";
                                        e.currentTarget.style.transform = "translateX(3px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.transform = "translateX(0)";
                                    }}
                                >
                                    {/* Icon */}
                                    <span style={{
                                        fontSize: 14,
                                        flexShrink: 0,
                                        marginTop: 2,
                                        color: theme.primary
                                    }}>
                                        {icon}
                                    </span>

                                    {/* Text */}
                                    <span style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        lineHeight: 1.5,
                                    }}>
                                        {text}
                                    </span>
                                </a>
                            ))}
                        </div>

                        {/* Security note */}
                        <div style={{
                            padding: "10px 14px", borderRadius: 10,
                            background: "#f0f9ff", border: "1px solid #bae6fd",
                            fontSize: 11, color: "#0c4a6e", fontWeight: 500,
                            display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.6,
                        }}>
                            <span style={{ flexShrink: 0 }}>🔒</span>
                            <span>
                                Powered by{" "}
                                <a
                                    href="https://worldweblogic.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontWeight: 700,
                                        color: "#2563eb",
                                        textDecoration: "none"
                                    }}
                                >
                                    World WebLogic HR System
                                </a>.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p style={{
                    textAlign: "center", fontSize: 11,
                    color: "#9ca3af", marginTop: 18, fontWeight: 500,
                    animation: "fadeUp .4s ease",
                }}>
                    {COMPANY.name} · {COMPANY.website}
                </p>
            </div>
        </div>
    );
}