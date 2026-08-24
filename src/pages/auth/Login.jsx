import { useState, useContext } from "react";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "/logo4.png";

const EyeIcon = ({ open }) =>
    open ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await API.post("/auth/login", form);
            login(res.data);

            const role = res.data.user.role;
            if (role === "hr") navigate("/hr");
            else if (role === "tl") navigate("/tl");
            else if (role === "manager") navigate("/manager");
            else if (role === "superadmin") navigate("/superadmin");
            else navigate("/employee");

        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <style>
                {`/* ── Spinner ── */
                .spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    display: inline-block;
                    animation: spin 0.6s linear infinite;
                    margin-right: 6px;
                }`}
            </style>
            <div className="login-card">
                <img
                    src={logo}
                    alt="HR Logo"
                    className="login-logo"
                    style={{ width: "70px", height: "70px", objectFit: "cover" }}
                />
                <h1 style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: 600, marginBottom: ".25rem" }}>
                    Welcome back
                </h1>
                <p style={{ textAlign: "center", color: "var(--text-3)", fontSize: ".85rem", marginBottom: "1.75rem" }}>
                    Sign in to your HRMS account
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                style={{ paddingRight: "2.5rem" }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                style={{
                                    position: "absolute",
                                    right: ".75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--text-3)",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: 0,
                                    lineHeight: 1,
                                }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", borderRadius: "var(--radius-sm)", padding: ".6rem .85rem", fontSize: ".85rem", marginBottom: ".75rem", border: "1px solid #fecaca" }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: ".65rem" }} disabled={loading}>
                        {loading ? <><span className="spinner" /> Signing in...</> : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;