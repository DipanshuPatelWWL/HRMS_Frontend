import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";

const initials = (name) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const ArchivedEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await API.get("/users/archived");
                setEmployees(res.data.users || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = employees.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
        e.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ fontFamily: "'DM Sans', sans-serif", paddingBottom: 40 }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-1)" }}>
                        Archived Employees
                    </h1>
                    <p style={{ color: "var(--text-2)", fontSize: ".85rem", marginTop: 4 }}>
                        Inactive employees — data preserved
                    </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <input
                        placeholder="Search by name, ID or department..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            padding: "8px 14px", borderRadius: 9, border: "1.5px solid var(--border)",
                            background: "var(--surface)", color: "var(--text-1)", fontSize: ".83rem",
                            outline: "none", width: "100%", maxWidth: 340
                        }}
                    />
                </div>

                {loading ? (
                    <p style={{ color: "var(--text-2)" }}>Loading...</p>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-2)" }}>
                        No archived employees found
                    </div>
                ) : (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".83rem" }}>
                            <thead>
                                <tr style={{ background: "var(--surface-3)" }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)" }}>Employee</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)" }}>Department</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)" }}>Joining Date</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(emp => (
                                    <tr key={emp._id} style={{ borderTop: "1px solid var(--border)" }}>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: "50%",
                                                    background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                                                    color: "#fff", display: "flex", alignItems: "center",
                                                    justifyContent: "center", fontWeight: 700, fontSize: ".75rem"
                                                }}>
                                                    {initials(emp.name)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700, color: "var(--text-1)", fontSize: ".83rem" }}>{emp.name}</p>
                                                    <p style={{ fontSize: ".7rem", color: "var(--text-2)", fontFamily: "DM Mono,monospace" }}>{emp.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "var(--text-1)" }}>
                                            <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, fontSize: ".72rem", fontWeight: 700 }}>
                                                {emp.department || "—"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "var(--text-2)", fontSize: ".8rem" }}>
                                            {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN") : "—"}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <button
                                                onClick={() => navigate(`/hr/employee-history/${emp._id}`)}
                                                style={{
                                                    padding: "5px 12px", borderRadius: 7, border: "1.5px solid #bfdbfe",
                                                    background: "#eff6ff", color: "#1d4ed8", fontWeight: 700,
                                                    fontSize: ".75rem", cursor: "pointer"
                                                }}
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ArchivedEmployees;