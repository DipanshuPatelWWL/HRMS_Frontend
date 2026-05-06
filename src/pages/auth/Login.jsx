import { useState, useContext } from "react";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
            else navigate("/employee");

        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">HR</div>
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
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", borderRadius: "var(--radius-sm)", padding: ".6rem .85rem", fontSize: ".85rem", marginBottom: ".75rem", border: "1px solid #fecaca" }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: ".65rem" }} disabled={loading}>
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;