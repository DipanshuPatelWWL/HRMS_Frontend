import { useEffect, useState, useContext } from "react";
import API, { BASE_URL } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { AuthContext } from "../../context/AuthContext";
import StopwatchLoader from "../../components/common/StopwatchLoader";
import EmployeeScanner from "../../components/scanner/EmployeeScanner"
import { EmployeeIDCard } from "../../components/scanner/EmployeeScanner";
import { QRCodeSVG } from "qrcode.react";
import Swal from "sweetalert2";

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const initials = (name) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const getDaysInMonth = (year, month) => {
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;
    return new Date(y, m, 0).getDate();
};

const toUrl = (path) =>
    !path ? "" : path.startsWith("http") ? path : `${BASE_URL}/${path.replace(/^\//, "")}`;

const getRoleLabel = (role) => {
    if (!role) return "—";
    const r = role.toLowerCase();
    if (r === "tl") return "Team Leader";
    if (r === "hr") return "HR";
    if (r === "superadmin") return "Super Admin";
    if (r === "manager") return "Manager";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

// ─────────────────────────────────────────────
//  Static Data
// ─────────────────────────────────────────────
const DEPARTMENT_DESIGNATIONS = {
    "": [],
    "SEO": [
        "SEO Intern", "SEO Trainee", "SEO Executive", "SEO Analyst",
        "Senior SEO Executive", "Senior SEO Analyst", "SEO Specialist",
        "SEO Lead", "SEO Manager", "Senior SEO Manager", "SEO Head",
    ],
    "Sales": [
        "Email Marketing Intern", "Email Marketing Trainee", "Email Marketing Executive",
        "Email Marketing Analyst", "Senior Email Marketing Executive", "Email Marketing Specialist",
        "CRM Executive", "Sales Executive", "Senior Sales Executive", "Email Marketing Lead",
        "Sales Lead", "Email Marketing Manager", "Sales Manager", "Senior Sales Manager",
        "Business Development Manager", "Business Development Executive", "Sales Head",
    ],
    "Development": [
        "Development Intern", "Trainee Developer", "Junior Frontend Developer",
        "Junior Backend Developer", "Junior Full Stack Developer", "Frontend Developer",
        "Backend Developer", "Full Stack Developer", "React Developer", "Node.js Developer",
        "MERN Stack Developer", "Senior Frontend Developer", "Senior Backend Developer",
        "Senior Full Stack Developer", "Tech Lead", "Team Lead - Development",
        "Software Engineer", "Senior Software Engineer", "Engineering Manager", "CTO",
    ],
};

const ACCOUNT_TYPES = [
    { value: "savings", label: "Savings" },
    { value: "current", label: "Current" },
    { value: "salary", label: "Salary" },
    { value: "other", label: "Other" },
];

// ─────────────────────────────────────────────
//  Real-time validators
// ─────────────────────────────────────────────
const validators = {
    accountHolderName: (v) => {
        if (!v?.trim()) return "Account holder name is required";
        if (v.trim().length < 3) return "Must be at least 3 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(v.trim())) return "Only letters, spaces, dots, hyphens and apostrophes allowed";
        return null;
    },
    accountNumber: (v) => {
        if (!v?.trim()) return "Account number is required";
        if (!/^\d{9,18}$/.test(v.trim())) return "Must be 9–18 digits";
        return null;
    },
    ifscCode: (v) => {
        if (!v?.trim()) return "IFSC code is required";
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.trim().toUpperCase())) return "Format: ABCD0123456 (4 letters, 0, then 6 alphanumeric)";
        return null;
    },
    branchName: () => null,
    bankName: () => null,
    accountType: () => null,
    idType: (v) => (!v ? "Please select an ID type" : null),
    idNumber: (v, idType) => {
        if (!v?.trim()) return "ID number is required";
        const val = v.trim().toUpperCase().replace(/\s/g, "");
        if (idType === "aadhaar") {
            if (!/^\d{12}$/.test(val)) return "Aadhaar must be exactly 12 digits";
            if (/^[01]/.test(val)) return "Aadhaar cannot start with 0 or 1";
        } else if (idType === "pan") {
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val)) return "PAN format: ABCDE1234F";
        } else if (idType === "passport") {
            if (!/^[A-Z][0-9]{7}$/.test(val)) return "Passport format: A1234567";
        } else if (idType === "voter_id") {
            if (!/^[A-Z]{3}[0-9]{7}$/.test(val)) return "Voter ID format: ABC1234567";
        } else if (idType === "driving_license") {
            const cleaned = val.replace(/-/g, "");
            if (!/^[A-Z]{2}\d{13}$/.test(cleaned)) return "Format: MH0120191234567";
        } else if (idType === "other") {
            if (val.length < 4) return "Must be at least 4 characters";
        }
        return null;
    },
};

// ─────────────────────────────────────────────
//  Field Error
// ─────────────────────────────────────────────
const FieldError = ({ error, touched }) => {
    if (!touched || !error) return null;
    return (
        <span style={{
            display: "flex", alignItems: "center", gap: "4px",
            fontSize: ".72rem", color: "#dc2626", marginTop: "4px",
            animation: "fadeInError .15s ease-out",
        }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
        </span>
    );
};

// ─────────────────────────────────────────────
//  Badges
// ─────────────────────────────────────────────
const ROLE_ICON = {
    hr: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    manager: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    tl: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    superadmin: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    employee: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" /></svg>,
};

const RoleBadge = ({ role }) => {
    const r = role?.toLowerCase();
    const styles = {
        hr: { bg: "#f0e7ff", color: "#5b21b6", border: "#c4b5fd" },
        manager: { bg: "#fff7e0", color: "#92400e", border: "#fcd34d" },
        tl: { bg: "#e0f0ff", color: "#1e40af", border: "#93c5fd" },
        superadmin: { bg: "#ffe4e4", color: "#991b1b", border: "#fca5a5" },
        employee: { bg: "#e8faf0", color: "#065f46", border: "#6ee7b7" },
    };
    const s = styles[r] || styles.employee;
    return (
        <span style={{
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            padding: "3px 9px 3px 7px", borderRadius: "20px",
            fontSize: ".7rem", fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: "4px",
            letterSpacing: ".2px",
            whiteSpace: "nowrap",
        }}>
            {ROLE_ICON[r] || ROLE_ICON.employee}
            {getRoleLabel(role)}
        </span>
    );
};

const STATUS_ICON = {
    active: <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>,
    inactive: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /></svg>,
    terminated: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

const StatusBadge = ({ status }) => {
    const styles = {
        active: { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
        inactive: { bg: "#fef9c3", color: "#a16207", border: "#fde047" },
        terminated: { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
    };
    const s = styles[status] || styles.active;
    return (
        <span style={{
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            padding: "3px 9px 3px 7px", borderRadius: "20px",
            fontSize: ".7rem", fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: "5px",
            textTransform: "capitalize", letterSpacing: ".2px",
        }}>
            {STATUS_ICON[status] || STATUS_ICON.active}
            {status}
        </span>
    );
};

// ─────────────────────────────────────────────
//  Confirm Dialog
// ─────────────────────────────────────────────
const ConfirmDialog = ({ title, message, confirmText, confirmStyle = {}, icon, onConfirm, onCancel, loading }) => (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
        <div className="modal" style={{ maxWidth: 430, width: "calc(100% - 2rem)", margin: "0 auto" }}>
            <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                display: "grid", placeItems: "center", margin: "0 auto 1rem"
            }}>
                {icon}
            </div>
            <p style={{ textAlign: "center", fontSize: "1.1rem", fontWeight: 700, marginBottom: ".5rem", color: "#0f172a" }}>{title}</p>
            <p style={{ textAlign: "center", color: "#1e293b", fontSize: ".875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>{message}</p>
            <div style={{ display: "flex", gap: ".65rem" }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel} disabled={loading}>Cancel</button>
                <button className="btn" style={{ flex: 1, justifyContent: "center", color: "#fff", border: "none", ...confirmStyle }} onClick={onConfirm} disabled={loading}>
                    {loading ? <><span className="spinner" style={{ borderTopColor: "#fff" }} />Processing...</> : confirmText}
                </button>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
//  Basic Info Form Fields
// ─────────────────────────────────────────────
const EMPTY_FORM = {
    name: "", email: "", password: "", role: "employee",
    monthlySalary: "", department: "", designation: "",
    maritalStatus: "", nationality: "",
    dob: "", joiningDate: "",
    phone: "",
    _isAdd: false,
};


const PasswordInput = ({ name, placeholder, value, onChange }) => {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: "relative" }}>
            <input
                name={name}
                className="input"
                placeholder={placeholder}
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                required
                style={{ paddingRight: 42 }}
            />
            <button
                type="button"
                onClick={() => setShow(prev => !prev)}
                style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    color: "#64748b",
                }}
                tabIndex={-1}
                title={show ? "Hide password" : "Show password"}
            >
                {show ? (
                    /* Eye-off icon */
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                ) : (
                    /* Eye icon */
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
};

const FormFields = ({ form, onChange }) => {
    const designations = DEPARTMENT_DESIGNATIONS[form.department] || [];

    const handleFieldChange = (e) => {
        const { name } = e.target;
        if (name === "department") onChange({ target: { name: "designation", value: "" } });
        onChange(e);
    };

    return (
        <>
            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                    Full name <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input name="name" className="input" placeholder="e.g., Jane Doe" value={form.name} onChange={onChange} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                    Email <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input name="email" className="input" placeholder="jane.doe@company.com" type="email" value={form.email} onChange={onChange} required />
            </div>

            {form._isAdd && (
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                        Password <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <PasswordInput name="password" placeholder="Minimum 8 characters" value={form.password} onChange={onChange} />
                </div>
            )}

            {form._isAdd && (
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Phone Number
                    </label>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
                        <div style={{
                            padding: "0 12px", height: "42px", display: "flex", alignItems: "center", gap: "6px",
                            background: "#f1f5f9", borderRight: "1px solid var(--border)",
                            fontSize: ".85rem", fontWeight: 700, color: "#0f172a", flexShrink: 0,
                        }}>
                            🇮🇳 +91
                        </div>
                        <input
                            name="phone"
                            placeholder="9876543210"
                            type="text"
                            value={form.phone ? form.phone.replace(/^91/, "") : ""}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                onChange({ target: { name: "phone", value: val ? "91" + val : "" } });
                            }}
                            maxLength={10}
                            style={{
                                flex: 1, border: "none", outline: "none", padding: "0 12px",
                                height: "42px", fontFamily: "monospace", letterSpacing: "1px",
                                fontSize: ".9rem", background: "transparent", color: "#0f172a",
                            }}
                        />
                        {form.phone && (
                            <div style={{ paddingRight: 10, display: "flex", alignItems: "center" }}>
                                {form.phone.replace(/^91/, "").length === 10
                                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" /></svg>
                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                }
                            </div>
                        )}
                    </div>
                    <span style={{
                        fontSize: ".72rem", marginTop: "4px", display: "flex", alignItems: "center", gap: 4,
                        color: form.phone && form.phone.replace(/^91/, "").length !== 10 ? "#dc2626" : "#16a34a",
                        fontWeight: 500
                    }}>
                        {form.phone && form.phone.replace(/^91/, "").length !== 10
                            ? <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {`Enter ${10 - (form.phone.replace(/^91/, "").length)} more digit(s)`}
                            </>
                            : <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" /></svg>
                                Valid mobile number
                            </>
                        }
                    </span>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }} className="resp-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>Date Of Birth</label>
                    <input name="dob" className="input" type="date" value={form.dob} onChange={onChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                        Joining Date <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input name="joiningDate" className="input" type="date" value={form.joiningDate} onChange={onChange} required />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }} className="resp-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                        Role <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <select name="role" className="input select" value={form.role} onChange={onChange}>
                        <option value="employee">Employee</option>
                        <option value="tl">Team Leader</option>
                        <option value="manager">Manager</option>
                        <option value="hr">HR</option>
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>Department</label>
                    <select name="department" className="input select" value={form.department} onChange={handleFieldChange}>
                        <option value="">Select department</option>
                        <option value="SEO">SEO</option>
                        <option value="Sales">Sales</option>
                        <option value="Development">Development</option>
                    </select>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }} className="resp-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>Designation</label>
                    <select
                        name="designation" className="input select" value={form.designation} onChange={onChange}
                        disabled={!form.department}
                        style={{ opacity: !form.department ? 0.6 : 1, cursor: !form.department ? "not-allowed" : "pointer" }}
                    >
                        <option value="">{form.department ? "Select designation" : "Select dept first"}</option>
                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                {form.role === "employee" && (
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                            Monthly Salary <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input name="monthlySalary" type="number" className="input" placeholder="₹ 50,000" value={form.monthlySalary} onChange={onChange} min="0" />
                    </div>
                )}
            </div>
        </>
    );
};

// ─────────────────────────────────────────────
//  Government ID Tab
// ─────────────────────────────────────────────
const GovernmentIdTab = ({ employeeId }) => {
    const [data, setData] = useState({ pan: "", aadhaar: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [touched, setTouched] = useState({ pan: false, aadhaar: false });
    const [fieldErrors, setFieldErrors] = useState({ pan: null, aadhaar: null });
    const [empDocs, setEmpDocs] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const res = await API.get(`/users/${employeeId}/government-id`);
                if (res.data.governmentIds) {
                    setData({
                        pan: res.data.governmentIds.pan || "",
                        aadhaar: res.data.governmentIds.aadhaar || "",
                    });
                }
            } catch { }
            finally { setLoading(false); }
        };
        loadData();
    }, [employeeId]);

    useEffect(() => {
        if (!employeeId) return;

        API.get(`/users/${employeeId}/documents`)
            .then(r => setEmpDocs(r.data.documents))
            .catch(() => { });
    }, [employeeId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...data, [name]: name === "pan" ? value.toUpperCase() : value };
        let errors = { ...fieldErrors };
        if (name === "pan") errors.pan = value && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.toUpperCase()) ? "Invalid PAN format" : null;
        if (name === "aadhaar") errors.aadhaar = value && !/^\d{12}$/.test(value) ? "Invalid Aadhaar" : null;
        setData(updated);
        setFieldErrors(errors);
        setTouched(prev => ({ ...prev, [name]: true }));
        setResult(null);
    };

    const handleSave = async () => {
        const newErrors = {};
        if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.pan)) newErrors.pan = "Invalid PAN format";
        if (data.aadhaar && !/^\d{12}$/.test(data.aadhaar)) newErrors.aadhaar = "Invalid Aadhaar";
        setFieldErrors(newErrors);
        setTouched({ pan: true, aadhaar: true });
        if (newErrors.pan || newErrors.aadhaar) return;
        setSaving(true);
        setResult(null);
        try {
            await API.put(`/users/${employeeId}/government-id`, { governmentIds: data });
            setResult({ success: true, message: "Government ID validated and saved successfully" });
        } catch (err) {
            setResult({ success: false, message: err.response?.data?.message || "Validation failed" });
        } finally { setSaving(false); }
    };

    const getInputStyle = (name) => {
        if (!touched[name]) return {};
        return fieldErrors[name]
            ? { borderColor: "#fca5a5", background: "#fff5f5" }
            : { borderColor: "#86efac", background: "#f0fdf4" };
    };

    const handleVerifyDoc = async (type) => {
        try {
            await API.put(`/users/${employeeId}/documents/${type}/verify`);

            const r = await API.get(`/users/${employeeId}/documents`);

            setEmpDocs(r.data.documents);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Verification Failed",
                text: err.response?.data?.message || "Verification failed",
                confirmButtonColor: "#EF4444",
            });
        }
    };

    const handleVerifyOtherDoc = async (otherId) => {
        try {
            await API.put(`/users/${employeeId}/documents/other/${otherId}/verify`);

            const r = await API.get(`/users/${employeeId}/documents`);

            setEmpDocs(r.data.documents);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Verification Failed",
                text: err.response?.data?.message || "Verification failed",
                confirmButtonColor: "#EF4444",
            });
        }
    };

    if (loading) return (
        <StopwatchLoader />
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{
                background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px",
                padding: "10px 14px", fontSize: ".8rem", color: "#0c4a6e",
                display: "flex", gap: "8px", alignItems: "flex-start"
            }}>
                <span>ℹ️</span>
                <span style={{ color: "#0c4a6e", fontWeight: 500 }}>
                    Errors appear as you type. Format and checksum validation also runs on the server when you save.
                </span>
            </div>
            <div className="form-group">
                <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>PAN Number</label>
                <input name="pan" className="input" placeholder="ABCDE1234F" value={data.pan} onChange={handleChange} style={getInputStyle("pan")} />
                <FieldError error={fieldErrors.pan} touched={touched.pan} />
            </div>
            <div className="form-group">
                <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>Aadhaar Number</label>
                <input name="aadhaar" className="input" placeholder="12 digits" value={data.aadhaar} onChange={handleChange} style={getInputStyle("aadhaar")} />
                <FieldError error={fieldErrors.aadhaar} touched={touched.aadhaar} />
            </div>
            {result && (
                <div style={{
                    background: result.success ? "#dcfce7" : "#fee2e2",
                    border: `1px solid ${result.success ? "#86efac" : "#fca5a5"}`,
                    borderRadius: "8px", padding: "10px 14px", fontSize: ".82rem",
                    color: result.success ? "#052e16" : "#450a0a",
                    display: "flex", gap: "8px", alignItems: "center", fontWeight: 600
                }}>
                    {result.success ? "✅" : "❌"} {result.message}
                </div>
            )}

            {/* ── Uploaded Documents ── */}
            {empDocs && (
                <div
                    style={{
                        borderTop: "1px dashed #e5e7eb",
                        paddingTop: 16,
                        marginTop: 4,
                    }}
                >
                    <p
                        style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 12,
                        }}
                    >
                        Uploaded Documents
                    </p>

                    {["aadhaar", "pan", "passbook"].map((key) => {
                        const d = empDocs?.[key];

                        if (!d?.url)
                            return (
                                <div
                                    key={key}
                                    style={{
                                        fontSize: 12,
                                        color: "#9ca3af",
                                        marginBottom: 10,
                                    }}
                                >
                                    {key.toUpperCase()}: No document uploaded
                                </div>
                            );

                        return (
                            <div
                                key={key}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    background: d.verified
                                        ? "#ecfdf5"
                                        : "#fffbeb",
                                    border: `1px solid ${d.verified
                                        ? "#a7f3d0"
                                        : "#fde68a"
                                        }`,
                                    marginBottom: 10,
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            fontWeight: 700,
                                            fontSize: 12.5,
                                            margin: "0 0 2px",
                                        }}
                                    >
                                        {key.toUpperCase()} — {d.originalName}
                                    </p>

                                    <p
                                        style={{
                                            fontSize: 11,
                                            color: "#6b7280",
                                            margin: 0,
                                        }}
                                    >
                                        {d.verified
                                            ? `✓ Verified on ${new Date(
                                                d.verifiedAt
                                            ).toLocaleDateString("en-IN")}`
                                            : "Verification pending"}
                                    </p>
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                    <a
                                        href={toUrl(d.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            fontSize: 12,
                                            color: "#6c63ff",
                                            fontWeight: 600,
                                            textDecoration: "none",
                                        }}
                                    >
                                        View
                                    </a>

                                    {!d.verified && (
                                        <button
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: "#059669",
                                                background: "#ecfdf5",
                                                border:
                                                    "1px solid #6ee7b7",
                                                borderRadius: 6,
                                                padding: "3px 10px",
                                                cursor: "pointer",
                                            }}
                                            onClick={() =>
                                                handleVerifyDoc(key)
                                            }
                                        >
                                            Verify
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {(empDocs?.others || []).map((od) => (
                        <div
                            key={od._id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                borderRadius: 10,
                                background: od.verified
                                    ? "#ecfdf5"
                                    : "#fffbeb",
                                border: `1px solid ${od.verified
                                    ? "#a7f3d0"
                                    : "#fde68a"
                                    }`,
                                marginBottom: 10,
                            }}
                        >
                            <div>
                                <p
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 12.5,
                                        margin: "0 0 2px",
                                    }}
                                >
                                    {od.label} — {od.originalName}
                                </p>

                                <p
                                    style={{
                                        fontSize: 11,
                                        color: "#6b7280",
                                        margin: 0,
                                    }}
                                >
                                    {od.verified
                                        ? "✓ Verified"
                                        : "Pending"}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <a
                                    href={toUrl(od.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        fontSize: 12,
                                        color: "#6c63ff",
                                        fontWeight: 600,
                                        textDecoration: "none",
                                    }}
                                >
                                    View
                                </a>

                                {!od.verified && (
                                    <button
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: "#059669",
                                            background: "#ecfdf5",
                                            border:
                                                "1px solid #6ee7b7",
                                            borderRadius: 6,
                                            padding: "3px 10px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            handleVerifyOtherDoc(od._id)
                                        }
                                    >
                                        Verify
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading} style={{ justifyContent: "center" }}>
                {saving ? <><span className="spinner" />Validating & Saving...</> : "Save Government ID"}
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Bank Details Tab
// ─────────────────────────────────────────────
const EMPTY_BANK = {
    accountHolderName: "", accountNumber: "",
    bankName: "", ifscCode: "", branchName: "", accountType: "savings",
};

const BANK_REQUIRED_FIELDS = ["accountHolderName", "accountNumber", "ifscCode"];

const BankDetailsTab = ({ employeeId }) => {
    const [data, setData] = useState(EMPTY_BANK);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ifscLooking, setIfscLooking] = useState(false);
    const [result, setResult] = useState(null);
    const [verification, setVerification] = useState(null);
    const [touched, setTouched] = useState({
        accountHolderName: false, accountNumber: false,
        ifscCode: false, bankName: false, branchName: false, accountType: false
    });
    const [fieldErrors, setFieldErrors] = useState({
        accountHolderName: null, accountNumber: null,
        ifscCode: null, bankName: null, branchName: null, accountType: null
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const res = await API.get(`/users/${employeeId}/bank-details`);
                if (res.data.bankDetails) {
                    const b = res.data.bankDetails;
                    setData({
                        accountHolderName: b.accountHolderName || "",
                        accountNumber: b.accountNumber || "",
                        bankName: b.bankName || "",
                        ifscCode: b.ifscCode || "",
                        branchName: b.branchName || "",
                        accountType: b.accountType || "savings"
                    });
                }
            } catch { }
            finally { setLoading(false); }
        };
        loadData();
    }, [employeeId]);

    const validateField = (name, value) => { const fn = validators[name]; return fn ? fn(value) : null; };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(p => ({ ...p, [name]: value }));
        setFieldErrors(p => ({ ...p, [name]: validateField(name, value) }));
        setTouched(p => ({ ...p, [name]: true }));
        setResult(null); setVerification(null);
    };

    const handleIFSCChange = (e) => {
        const value = e.target.value.toUpperCase();
        setData(p => ({ ...p, ifscCode: value, bankName: "", branchName: "" }));
        setFieldErrors(p => ({ ...p, ifscCode: validateField("ifscCode", value), bankName: null, branchName: null }));
        setTouched(p => ({ ...p, ifscCode: true }));
        setResult(null); setVerification(null);
    };

    const handleIFSCBlur = async () => {
        const cleaned = data.ifscCode.trim().toUpperCase();
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleaned)) return;
        setIfscLooking(true);
        try {
            const res = await fetch(`https://ifsc.razorpay.com/${cleaned}`, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const info = await res.json();
                setData(p => ({ ...p, bankName: info.BANK || p.bankName, branchName: info.BRANCH || p.branchName }));
            }
        } catch { }
        finally { setIfscLooking(false); }
    };

    const handleSave = async () => {
        const newErrors = {}; const newTouched = {};
        for (const key of Object.keys(data)) { newTouched[key] = true; newErrors[key] = validateField(key, data[key]); }
        setTouched(newTouched); setFieldErrors(newErrors);
        if (BANK_REQUIRED_FIELDS.some(f => newErrors[f])) return;
        setSaving(true); setResult(null); setVerification(null);
        try {
            const res = await API.put(`/users/${employeeId}/bank-details`, data);
            if (res.data.verification) {
                const v = res.data.verification;
                setVerification(v);
                setData(p => ({ ...p, bankName: v.bank || p.bankName, branchName: v.branch || p.branchName }));
            }
            setResult({ success: true, message: "Bank details validated and saved successfully" });
        } catch (err) {
            const errors = err.response?.data?.errors;
            setResult({ success: false, message: errors?.length ? errors.join(" · ") : (err.response?.data?.message || "Validation failed") });
        } finally { setSaving(false); }
    };

    const getInputStyle = (name) => {
        if (!touched[name] || !BANK_REQUIRED_FIELDS.includes(name)) return {};
        return fieldErrors[name]
            ? { borderColor: "#fca5a5", background: "#fff5f5" }
            : { borderColor: "#86efac", background: "#f0fdf4" };
    };

    if (loading) return (
        <StopwatchLoader />
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{
                background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px",
                padding: "10px 14px", fontSize: ".8rem", color: "#0c4a6e",
                display: "flex", gap: "8px", alignItems: "flex-start"
            }}>
                <span>ℹ️</span>
                <span style={{ color: "#0c4a6e", fontWeight: 500 }}>
                    Errors appear as you type. Bank name and branch are auto-filled when you finish typing the IFSC code.
                </span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                    Account Holder Name <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input name="accountHolderName" className="input" placeholder="As per bank records"
                    value={data.accountHolderName} style={getInputStyle("accountHolderName")} onChange={handleChange} />
                <FieldError error={fieldErrors.accountHolderName} touched={touched.accountHolderName} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }} className="resp-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                        Account Number <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input name="accountNumber" className="input" placeholder="9–18 digits"
                        value={data.accountNumber} style={getInputStyle("accountNumber")} onChange={handleChange} />
                    <FieldError error={fieldErrors.accountNumber} touched={touched.accountNumber} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>Account Type</label>
                    <select name="accountType" className="input select" value={data.accountType} onChange={handleChange}>
                        {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }} className="resp-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>
                        IFSC Code <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input name="ifscCode" className="input" placeholder="e.g., SBIN0001234"
                        value={data.ifscCode}
                        style={{ fontFamily: "monospace", letterSpacing: "1px", ...getInputStyle("ifscCode") }}
                        onChange={handleIFSCChange} onBlur={handleIFSCBlur} />
                    <FieldError error={fieldErrors.ifscCode} touched={touched.ifscCode} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: "#0f172a", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        Bank Name
                        {ifscLooking && (
                            <span style={{ fontSize: ".68rem", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "3px" }}>
                                <span className="spinner" style={{ borderTopColor: "#1d4ed8", borderColor: "#bfdbfe", width: 10, height: 10, borderWidth: 2, marginRight: 0 }} />
                                Looking up…
                            </span>
                        )}
                    </label>
                    <input name="bankName" className="input" placeholder="Auto-filled from IFSC"
                        value={data.bankName} onChange={handleChange}
                        style={{ background: data.bankName ? "#f0fdf4" : undefined, color: data.bankName ? "#052e16" : undefined }} />
                </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: "#0f172a", fontWeight: 600 }}>Branch Name</label>
                <input name="branchName" className="input" placeholder="Auto-filled from IFSC"
                    value={data.branchName} onChange={handleChange}
                    style={{ background: data.branchName ? "#f0fdf4" : undefined, color: data.branchName ? "#0f172a" : undefined }} />
            </div>

            {verification && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "10px 14px", fontSize: ".8rem" }}>
                    <p style={{ fontWeight: 700, color: "#052e16", marginBottom: ".4rem" }}>✅ IFSC Verified</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".35rem", color: "#166534", fontWeight: 500 }}>
                        <span>🏦 {verification.bank}</span>
                        <span>🏢 {verification.branch}</span>
                        <span>📍 {verification.city}, {verification.state}</span>
                        <span style={{ display: "flex", gap: "6px" }}>
                            {verification.rtgs && <span style={{ background: "#dcfce7", padding: "1px 6px", borderRadius: "4px" }}>RTGS</span>}
                            {verification.neft && <span style={{ background: "#dcfce7", padding: "1px 6px", borderRadius: "4px" }}>NEFT</span>}
                            {verification.imps && <span style={{ background: "#dcfce7", padding: "1px 6px", borderRadius: "4px" }}>IMPS</span>}
                        </span>
                    </div>
                    {verification.warning && <p style={{ color: "#451a03", marginTop: ".4rem", fontSize: ".75rem", fontWeight: 600 }}>⚠️ {verification.warning}</p>}
                </div>
            )}

            {result && (
                <div style={{
                    background: result.success ? "#dcfce7" : "#fee2e2",
                    border: `1px solid ${result.success ? "#86efac" : "#fca5a5"}`,
                    borderRadius: "8px", padding: "10px 14px", fontSize: ".82rem",
                    color: result.success ? "#052e16" : "#450a0a",
                    display: "flex", gap: "8px", alignItems: "flex-start", fontWeight: 600
                }}>
                    <span>{result.success ? "✅" : "❌"}</span>
                    <span>{result.message}</span>
                </div>
            )}

            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading} style={{ justifyContent: "center" }}>
                {saving ? <><span className="spinner" />Validating & Saving...</> : "Save Bank Details"}
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Icons & Confirm Config
// ─────────────────────────────────────────────
const Icons = {
    delete: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
    ),
    terminate: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    deactivate: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <rect x="9" y="8" width="2" height="8" rx="1" />
            <rect x="13" y="8" width="2" height="8" rx="1" />
        </svg>
    ),
    activate: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
    ),
};

const CONFIRM_CONFIG = {
    delete: {
        title: "Delete employee?",
        getMessage: (name) => <><strong style={{ color: "#0f172a" }}>{name}</strong> will be permanently removed. This action cannot be undone.</>,
        confirmText: "Yes, delete",
        confirmStyle: { background: "#dc2626" },
    },
    terminate: {
        title: "Terminate employee?",
        getMessage: (name) => <><strong style={{ color: "#0f172a" }}>{name}</strong> will be marked as terminated and lose system access.</>,
        confirmText: "Yes, terminate",
        confirmStyle: { background: "#b91c1c" },
    },
    deactivate: {
        title: "Deactivate employee?",
        getMessage: (name) => <><strong style={{ color: "#0f172a" }}>{name}</strong> will be set to inactive. You can reactivate them later.</>,
        confirmText: "Yes, deactivate",
        confirmStyle: { background: "#d97706" },
    },
    activate: {
        title: "Activate employee?",
        getMessage: (name) => <>Set <strong style={{ color: "#0f172a" }}>{name}</strong> back to active status.</>,
        confirmText: "Yes, activate",
        confirmStyle: { background: "#16a34a" },
    },
};

// ─────────────────────────────────────────────
//  Edit Modal Tabs
// ─────────────────────────────────────────────
const EDIT_TABS = [
    {
        key: "basic", label: "Basic Info",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    },
    {
        key: "govid", label: "Gov. ID",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M7 15h4" /><path d="M15 15h2" /></svg>,
    },
    {
        key: "bank", label: "Bank",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><line x1="12" y1="15" x2="12" y2="17" /></svg>,
    },
];

// ─────────────────────────────────────────────
//  TL Read-Only Employee Card
// ─────────────────────────────────────────────
const TLEmployeeCard = ({ employee }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: ".75rem",
        padding: ".75rem 1rem", borderRadius: "10px",
        background: "#fff", border: "1px solid #e5e7eb",
        transition: "box-shadow .15s ease",
        flexWrap: "wrap",
    }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
        <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: 700, fontSize: ".85rem", flexShrink: 0,
        }}>
            {initials(employee.name)}
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
            <p style={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.3, marginBottom: ".15rem" }}>{employee.name}</p>
            <p style={{ fontSize: ".75rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                {employee.designation || employee.department || employee.email || "—"}
            </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".3rem", flexShrink: 0 }}>
            <RoleBadge role={employee.role} />
            <StatusBadge status={employee.status} />
        </div>
    </div>
);

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [salaryModal, setSalaryModal] = useState(false);
    const [salaryData, setSalaryData] = useState(null);
    const [salaryLoading, setSalaryLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    const [addModal, setAddModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editTab, setEditTab] = useState("basic");
    const [editGovIds, setEditGovIds] = useState({
        pan: "",
        aadhaar: "",
    });
    const [empDocs, setEmpDocs] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [confirm, setConfirm] = useState(null);

    const [assignModal, setAssignModal] = useState(false);
    const [tlList, setTlList] = useState([]);
    const [selectedTL, setSelectedTL] = useState("");
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);


    const { user } = useContext(AuthContext);
    const isHR = user?.role?.toLowerCase() === "hr";
    const isTL = user?.role?.toLowerCase() === "tl";
    const isManager = user?.role?.toLowerCase() === "manager";

    useEffect(() => { fetchEmployees(); }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await API.get("/users");
            setEmployees(res.data.users || res.data.employees || res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch employees:", err);
            Swal.fire({
                icon: "error",
                title: "Load Failed",
                text: "Failed to load employees",
                confirmButtonColor: "#EF4444",
            });
        } finally { setLoading(false); }
    };

    const fetchTLs = async () => {
        try {
            const res = await API.get("/users/tls");
            setTlList(res.data.tls || []);
        } catch (err) { console.error("Failed to fetch TLs:", err); }
    };

    const handleAssignTeam = async () => {
        if (!selectedTL || selectedEmployeeIds.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Selection Required",
                text: "Please select a TL and at least one employee",
                confirmButtonColor: "#6366F1",
            });
            return;
        }
        setAssignLoading(true);
        try {
            await API.patch("/users/assign-team", { tlId: selectedTL, employeeIds: selectedEmployeeIds });
            Swal.fire({
                icon: "success",
                title: "Team Assigned",
                text: `${selectedEmployeeIds.length} employee(s) assigned successfully!`,
                confirmButtonColor: "#6366F1",
                timer: 2500,
                timerProgressBar: true,
            });
            setAssignModal(false);
            setSelectedTL("");
            setSelectedEmployeeIds([]);
            fetchEmployees();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Assignment Failed",
                text: err.response?.data?.message || "Assignment failed",
                confirmButtonColor: "#EF4444",
            });
        } finally { setAssignLoading(false); }
    };

    const toggleEmployeeSelect = (id) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const openAssignModal = async () => {
        await fetchTLs();
        setSelectedTL("");
        setSelectedEmployeeIds([]);
        setAssignModal(true);
    };

    const tlTeamMembers = employees;

    const filtered = employees.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(search.toLowerCase())
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            let updated = { ...prev, [name]: value };
            if (name === "role" && value !== "employee") updated.monthlySalary = "";
            return updated;
        });
    };

    const openAdd = () => {
        if (!isHR && !isManager) return;
        setForm({ ...EMPTY_FORM, _isAdd: true });
        setAddModal(true);
    };

    const openEdit = (emp) => {
        if (!isHR && !isManager) return;
        setForm({
            name: emp.name,
            email: emp.email,
            password: "",
            employeeId: emp.employeeId,
            role: emp.role,
            monthlySalary: emp.salary?.monthly || "",
            department: emp.department?._id || emp.department || "",
            designation: emp.designation || "",
            maritalStatus: emp.maritalStatus || "",
            nationality: emp.nationality || "",
            dob: emp.dob ? emp.dob.slice(0, 10) : "",
            joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : "",
            _isAdd: false,
        });
        setEditTarget(emp);
        setEditTab("basic");
    };

    const handleCreate = async () => {
        if (!isHR && !isManager) return;
        if (!form.name || !form.email || !form.password) {
            Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill in all required fields", confirmButtonColor: "#6366F1" });
            return;
        }
        if (form.role === "employee" && !form.monthlySalary) {
            Swal.fire({ icon: "warning", title: "Salary Required", text: "Salary is required for employees", confirmButtonColor: "#6366F1" });
            return;
        }
        if (form.password.length < 8) {
            Swal.fire({ icon: "warning", title: "Weak Password", text: "Password must be at least 8 characters", confirmButtonColor: "#6366F1" });
            return;
        }
        if (form.phone && form.phone.length !== 12) {
            Swal.fire({ icon: "warning", title: "Invalid Phone", text: "Please enter a valid mobile number with country code (e.g. 919876543210 — 12 digits total)", confirmButtonColor: "#6366F1" });
            return;
        }
        if (form.phone && !form.phone.startsWith("91")) {
            Swal.fire({ icon: "warning", title: "Invalid Phone", text: "Phone must start with 91 (India country code)", confirmButtonColor: "#6366F1" });
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name: form.name, email: form.email, password: form.password,
                role: form.role,
                monthlySalary: form.role === "employee" ? Number(form.monthlySalary) : 0,
                department: form.department || null, designation: form.designation || "",
                maritalStatus: form.maritalStatus || undefined, nationality: form.nationality || undefined,
                dob: form.dob || undefined, joiningDate: form.joiningDate || undefined,
                phone: form.phone ? form.phone.toString().replace(/[\s+\-()]/g, "") : undefined,
            };
            const res = await API.post("/users/create", payload);
            setEmployees(prev => [...prev, res.data.user]);
            setAddModal(false);
            setForm(EMPTY_FORM);
            Swal.fire({
                icon: "success",
                title: "Employee Added",
                text: form.phone
                    ? "Employee added successfully! Login credentials sent on Email."
                    : "Employee added successfully! (No phone provided — SMS not sent)",
                confirmButtonColor: "#6366F1",
                timer: 3000,
                timerProgressBar: true,
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Create Failed",
                text: err.response?.data?.message || "Error creating employee",
                confirmButtonColor: "#EF4444",
            });
        } finally { setSubmitting(false); }
    };

    const handleUpdate = async () => {
        if (!isHR && !isManager) return;
        if (!form.name || !form.email) {
            Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill in all required fields", confirmButtonColor: "#6366F1" });
            return;
        }
        if (form.role === "employee" && !form.monthlySalary) {
            Swal.fire({ icon: "warning", title: "Salary Required", text: "Salary is required for employees", confirmButtonColor: "#6366F1" });
            return;
        }
        setSubmitting(true);
        try {
            const daysInMonth = getDaysInMonth();
            const payload = {
                name: form.name, email: form.email, role: form.role,
                department: form.department || null, designation: form.designation || "",
                dob: form.dob || undefined, joiningDate: form.joiningDate || undefined,
                maritalStatus: form.maritalStatus || undefined, nationality: form.nationality || undefined,
                salary: form.role === "employee" ? { monthly: Number(form.monthlySalary), perDay: Number(form.monthlySalary) / daysInMonth } : undefined,
            };
            const res = await API.put(`/users/update/${editTarget._id}`, payload);
            const updated = res.data.user || { ...editTarget, ...payload };
            setEmployees(prev => prev.map(e => e._id === editTarget._id ? updated : e));
            setEditTarget(null);
            Swal.fire({
                icon: "success",
                title: "Updated",
                text: "Employee updated successfully!",
                confirmButtonColor: "#6366F1",
                timer: 2500,
                timerProgressBar: true,
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: err.response?.data?.message || "Error updating employee",
                confirmButtonColor: "#EF4444",
            });
        } finally { setSubmitting(false); }
    };

    const handleConfirmAction = async () => {
        if ((!isHR && !isManager) || !confirm) return;
        const { type, employee } = confirm;
        setActionLoading(true);
        try {
            if (type === "delete") {
                await API.delete(`/users/delete/${employee._id}`);
                setEmployees(prev => prev.filter(e => e._id !== employee._id));
                if (editTarget?._id === employee._id) setEditTarget(null);
                Swal.fire({ icon: "success", title: "Deleted", text: "Employee deleted successfully", confirmButtonColor: "#6366F1", timer: 2500, timerProgressBar: true });
            } else if (type === "terminate") {
                await API.put(`/users/update-status/${employee._id}`, { status: "terminated" });
                setEmployees(prev => prev.map(e => e._id === employee._id ? { ...e, status: "terminated" } : e));
                if (editTarget?._id === employee._id) setEditTarget(null);
                Swal.fire({ icon: "success", title: "Terminated", text: "Employee terminated successfully", confirmButtonColor: "#6366F1", timer: 2500, timerProgressBar: true });
            } else if (type === "deactivate") {
                await API.put(`/users/update-status/${employee._id}`, { status: "inactive" });
                setEmployees(prev => prev.map(e => e._id === employee._id ? { ...e, status: "inactive" } : e));
                Swal.fire({ icon: "success", title: "Deactivated", text: "Employee deactivated", confirmButtonColor: "#6366F1", timer: 2500, timerProgressBar: true });
            } else if (type === "activate") {
                await API.put(`/users/update-status/${employee._id}`, { status: "active" });
                setEmployees(prev => prev.map(e => e._id === employee._id ? { ...e, status: "active" } : e));
                Swal.fire({ icon: "success", title: "Activated", text: "Employee activated", confirmButtonColor: "#6366F1", timer: 2500, timerProgressBar: true });
            }
            setConfirm(null);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Action Failed",
                text: err.response?.data?.message || "Action failed",
                confirmButtonColor: "#EF4444",
            });
        } finally { setActionLoading(false); }
    };

    const handleSaveGovId = async () => {
        if (!editTarget?._id) return;

        try {
            await API.put(`/users/${editTarget._id}/government-id`, { governmentIds: editGovIds });
            Swal.fire({
                icon: "success",
                title: "Saved",
                text: "Government ID saved successfully",
                confirmButtonColor: "#6366F1",
                timer: 2500,
                timerProgressBar: true,
            });
            const r = await API.get(`/users/${editTarget._id}/documents`);
            setEmpDocs(r.data.documents);

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Save Failed",
                text: err.response?.data?.message || "Failed to save Government ID",
                confirmButtonColor: "#EF4444",
            });
        }
    };

    const handleVerifyDoc = async (employeeId, type) => {
        try {
            await API.put(`/users/${employeeId}/documents/${type}/verify`);

            const r = await API.get(`/users/${employeeId}/documents`);
            setEmpDocs(r.data.documents);
            Swal.fire({
                icon: "success",
                title: "Verified",
                text: `${type.toUpperCase()} verified successfully`,
                confirmButtonColor: "#6366F1",
                timer: 2500,
                timerProgressBar: true,
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Verification Failed",
                text: err.response?.data?.message || "Verification failed",
                confirmButtonColor: "#EF4444",
            });
        }
    };

    const handleVerifyOtherDoc = async (employeeId, otherId) => {
        try {
            await API.put(`/users/${employeeId}/documents/other/${otherId}/verify`);

            const r = await API.get(`/users/${employeeId}/documents`);
            setEmpDocs(r.data.documents);
            Swal.fire({
                icon: "success",
                title: "Verified",
                text: "Document verified successfully",
                confirmButtonColor: "#6366F1",
                timer: 2500,
                timerProgressBar: true,
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Verification Failed",
                text: err.response?.data?.message || "Verification failed",
                confirmButtonColor: "#EF4444",
            });
        }
    };

    const handleViewSalary = (emp) => {
        setSelectedEmployee(emp);
        setSalaryModal(true);
        setSalaryData(null);
        const now = new Date();
        setSelectedMonth((now.getMonth() + 1).toString());
        setSelectedYear(now.getFullYear().toString());
    };

    const fetchSalary = async () => {
        if (!selectedMonth || !selectedYear) return;
        setSalaryLoading(true);
        try {
            const res = await API.get(`/salary/${selectedEmployee._id}/monthly?month=${selectedMonth}&year=${selectedYear}`);
            setSalaryData(res.data.data);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Fetch Failed",
                text: err.response?.data?.message || "Error fetching salary",
                confirmButtonColor: "#EF4444",
            });
            setSalaryData(null);
        } finally { setSalaryLoading(false); }
    };





    useEffect(() => {
        if (salaryModal && selectedMonth && selectedYear && selectedEmployee) fetchSalary();
    }, [selectedMonth, selectedYear]);

    const editEmp = editTarget ? (employees.find(e => e._id === editTarget._id) || editTarget) : null;
    const activeConfirmConfig = confirm ? CONFIRM_CONFIG[confirm.type] : null;


    // ── Styles for Gov ID Tab ──
    const labelStyle = {
        display: "block",
        marginBottom: "6px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#0f172a",
    };

    const inputStyle = {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        outline: "none",
        fontSize: "14px",
        background: "#fff",
        color: "#111827",
    };

    const primaryBtnStyle = {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "none",
        background: "#4f46e5",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
    };


    return (
        <DashboardLayout>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                * { box-sizing: border-box; }

                .emp-root { font-family: 'Inter', -apple-system, sans-serif; }

                /* ── MODAL BACKDROP FIX ── */
                .modal-backdrop {
                    position: fixed !important;
                    inset: 0 !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    z-index: 99999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 1rem !important;
                    background: rgba(15, 23, 42, 0.55) !important;
                    backdrop-filter: blur(6px) !important;
                    -webkit-backdrop-filter: blur(6px) !important;
                    overflow-y: auto !important;
                }

                /* ── MODAL BOX FIX ── */
                .modal {
                    position: relative !important;
                    z-index: 100000 !important;
                    background: #ffffff !important;
                    border-radius: 16px !important;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25), 0 8px 20px rgba(0, 0, 0, 0.15) !important;
                    padding: 1.5rem !important;
                    width: 100% !important;
                    margin: auto !important;
                }

                /* ── Toolbar ── */
                .emp-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: .75rem;
                    margin-bottom: 1.25rem;
                    flex-wrap: wrap;
                }
                .emp-toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: .65rem;
                    flex-shrink: 0;
                    flex-wrap: wrap;
                }
                .emp-search { flex: 1; min-width: 180px; max-width: 350px; }
                .emp-actions { display: flex; gap: .5rem; flex-wrap: wrap; }

                /* ── Modal ── */
                .enhanced-modal {
                    max-width: 580px;
                    width: calc(100% - 2rem);
                    margin: 0 auto;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: modalSlideIn 0.2s ease-out;
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(-20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes fadeInError {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ── Spinner ── */
                .spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    display: inline-block;
                    animation: spin 0.6s linear infinite;
                    margin-right: 6px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* ── Stat Card ── */
                .emp-stat-card {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                    border: 1px solid #bae6fd;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                }
                .stat-item { text-align: center; padding: .75rem; }
                .stat-value { font-size: 1.75rem; font-weight: 800; color: #0c4a6e; line-height: 1; }
                .stat-label { font-size: .75rem; color: #0f172a; margin-top: .35rem; text-transform: uppercase; letter-spacing: .5px; font-weight: 600; }

                /* ── Salary ── */
                .salary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; }
                .salary-item {
                    background: #f8fafc; padding: .75rem 1rem;
                    border-radius: 8px; border: 1px solid #e2e8f0;
                }
                .salary-item-label { font-size: .72rem; color: #1e293b; margin-bottom: .25rem; font-weight: 600; }
                .salary-item-value { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
                .salary-total {
                    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
                    border: 2px solid #86efac;
                    padding: 1.25rem; border-radius: 12px;
                    text-align: center; margin-top: 1rem;
                }
                .salary-total-label { font-size: .8rem; color: #052e16; margin-bottom: .5rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
                .salary-total-value { font-size: 2rem; font-weight: 800; color: #052e16; line-height: 1; }

                /* ── Empty State ── */
                .empty-state { text-align: center; padding: 3rem 1rem; }
                .empty-state-icon {
                    width: 64px; height: 64px; margin: 0 auto 1rem;
                    background: #f1f5f9; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; color: #334155;
                }

                /* ── Quick Actions ── */
                .quick-actions-label {
                    font-size: .72rem; color: "#0f172a"; font-weight: 700;
                    text-transform: uppercase; letter-spacing: .5px; margin-bottom: .4rem;
                }
                .quick-actions-bar {
                    display: flex; gap: .5rem; flex-wrap: wrap;
                    padding: .75rem 1rem;
                    background: #f8fafc;
                    border-radius: 10px; border: 1px solid #e2e8f0;
                }

                /* ── Input ── */
                .input { transition: border-color .15s ease, background .15s ease; color: #0f172a; }
                .input::placeholder { color: #64748b; }
                .input:focus { outline: none; }

                /* ── Edit Tabs ── */
                .edit-tabs {
                    display: flex;
                    border-bottom: 2px solid #e5e7eb;
                    margin-bottom: 1.25rem;
                    gap: 0;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .edit-tabs::-webkit-scrollbar { display: none; }
                .edit-tab-btn {
                    padding: .65rem 1rem;
                    border: none; background: none; cursor: pointer;
                    font-size: .82rem; font-weight: 600;
                    color: #374151;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -2px;
                    transition: all .15s ease;
                    display: flex; align-items: center; gap: .4rem;
                    border-radius: 6px 6px 0 0;
                    white-space: nowrap;
                }
                .edit-tab-btn:hover { color: #0f172a; background: #f8fafc; }
                .edit-tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); background: #f0f9ff; }
                .tab-content { min-height: 260px; }

                /* ── TL Banner ── */
                .tl-readonly-banner {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 14px;
                    background: #eff6ff; border: 1px solid #bfdbfe;
                    border-radius: 8px; margin-bottom: 1rem;
                    font-size: .8rem; color: #1e3a8a; font-weight: 600;
                }
                .tl-team-grid { display: flex; flex-direction: column; gap: .6rem; }

                /* ── Table ── */
                .emp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .emp-table { width: 100%; min-width: 520px; border-collapse: collapse; }
                .emp-table th {
                    padding: .75rem 1rem; text-align: left;
                    font-size: .75rem; font-weight: 700;
                    color: #0f172a; text-transform: uppercase;
                    letter-spacing: .5px; border-bottom: 2px solid #e5e7eb;
                    background: #f8fafc;
                }
                .emp-table td {
                    padding: .85rem 1rem;
                    border-bottom: 1px solid #f1f5f9;
                    color: #0f172a;
                    font-size: .875rem;
                }
                .emp-table tr:last-child td { border-bottom: none; }
                .emp-table tr:hover td { background: #f8fafc; }

                /* ── Count badge ── */
                .emp-count-badge {
                    color: #1e293b;
                    font-size: .8rem;
                    font-weight: 600;
                    white-space: nowrap;
                    background: #f1f5f9;
                    padding: 4px 10px;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                }

                /* ── Responsive ── */
                @media (max-width: 768px) {
                    .emp-toolbar { flex-direction: column; align-items: stretch; }
                    .emp-search { max-width: 100%; min-width: 0; width: 100%; }
                    .emp-toolbar-right { justify-content: space-between; width: 100%; }
                    .emp-col-hide { display: none; }
                    .emp-actions { justify-content: flex-end; }
                    .salary-grid { grid-template-columns: 1fr; }
                    .quick-actions-bar { flex-direction: column; }
                    .edit-tab-btn { font-size: .76rem; padding: .55rem .75rem; }
                    .resp-grid-2 { grid-template-columns: 1fr !important; }
                    .emp-stat-card { grid-template-columns: 1fr 1fr; gap: .5rem; padding: .75rem; }
                    .stat-value { font-size: 1.4rem; }
                    .enhanced-modal { width: calc(100% - 1rem); }
                    .modal-backdrop { padding: 0.5rem !important; align-items: flex-start !important; padding-top: 1rem !important; }
                }
                @media (max-width: 480px) {
                    .emp-toolbar-right { flex-wrap: wrap; }
                    .emp-toolbar-right .btn { flex: 1; justify-content: center; font-size: .78rem; padding: .5rem .75rem; }
                    .emp-table { min-width: 400px; }
                    .emp-table th, .emp-table td { padding: .65rem .75rem; }
                    .salary-total-value { font-size: 1.5rem; }
                }
                @media (max-width: 360px) {
                    .emp-table { min-width: 340px; }
                    .edit-tab-btn { padding: .5rem .55rem; font-size: .72rem; gap: .25rem; }
                }
            `}</style>

            <div className="emp-root">
                <div className="page-header">
                    <h1 style={{ color: "#0f172a" }}>{isTL ? "My Team" : "Employees"}</h1>
                    <p style={{ color: "#1e293b", fontWeight: 500 }}>
                        {isTL ? "View your team members" : "Manage your team members and their information"}
                    </p>
                </div>

                {(isHR || isManager) && (
                    <div style={{ marginBottom: "1.25rem" }}>
                        <EmployeeScanner
                            onFound={(emp) => openEdit(emp)}
                        />
                    </div>
                )}

                {/* ── Stats ── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: ".85rem",
                    marginBottom: "1.25rem",
                }}>
                    {[
                        {
                            label: isTL ? "Team Members" : "Total Employees",
                            value: isTL ? tlTeamMembers.length : employees.length,
                            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                            accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
                        },
                        {
                            label: "Active",
                            value: (isTL ? tlTeamMembers : employees).filter(e => e.status === "active").length,
                            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
                            accent: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
                        },
                        {
                            label: "Inactive",
                            value: (isTL ? tlTeamMembers : employees).filter(e => e.status === "inactive").length,
                            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" /></svg>,
                            accent: "#d97706", bg: "#fffbeb", border: "#fde68a",
                        },
                        {
                            label: "Terminated",
                            value: (isTL ? tlTeamMembers : employees).filter(e => e.status === "terminated").length,
                            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
                            accent: "#dc2626", bg: "#fff1f2", border: "#fecdd3",
                        },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            background: stat.bg,
                            border: `1px solid ${stat.border}`,
                            borderRadius: "12px",
                            padding: ".9rem 1.1rem",
                            display: "flex", alignItems: "center", gap: ".85rem",
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: "10px",
                                background: "#fff",
                                border: `1px solid ${stat.border}`,
                                display: "grid", placeItems: "center",
                                color: stat.accent, flexShrink: 0,
                                boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: "1.55rem", fontWeight: 800, color: stat.accent, lineHeight: 1 }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: ".72rem", color: "#374151", fontWeight: 600, marginTop: ".2rem", textTransform: "uppercase", letterSpacing: ".4px" }}>
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    {/* TL Read-only notice */}
                    {isTL && (
                        <div className="tl-readonly-banner">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            You have read-only access. Contact HR to make changes to employee records.
                        </div>
                    )}

                    <div className="emp-toolbar">
                        <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 360 }}>
                            <span style={{
                                position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                                color: "#94a3b8", pointerEvents: "none", display: "flex",
                            }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                            <input
                                className="input"
                                placeholder="Search by name, email or ID…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ color: "#0f172a", paddingLeft: "34px", width: "100%" }}
                            />
                            {search && (
                                <button onClick={() => setSearch("")} style={{
                                    position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                                    background: "#e2e8f0", border: "none", borderRadius: "50%",
                                    width: 18, height: 18, cursor: "pointer", display: "grid", placeItems: "center",
                                    color: "#64748b", padding: 0,
                                }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="emp-toolbar-right">
                            <span className="emp-count-badge" style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4, flexShrink: 0 }}>
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                {filtered.length} {filtered.length === 1 ? (isTL ? "member" : "employee") : (isTL ? "members" : "employees")}
                            </span>
                            {(isHR || isManager) && (
                                <>
                                    <button className="btn btn-primary" onClick={openAdd} style={{ gap: "6px" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="16" />
                                            <line x1="8" y1="12" x2="16" y2="12" />
                                        </svg>
                                        Add Employee
                                    </button>
                                    <button className="btn btn-ghost" onClick={openAssignModal} style={{
                                        border: "1px solid #e2e8f0", color: "#374151", fontWeight: 600, gap: "6px"
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        Assign Team
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <StopwatchLoader />
                    )}

                    {!loading && filtered.length === 0 && (
                        <div style={{ textAlign: "center", padding: "3.5rem 1rem" }}>
                            <div style={{
                                width: 72, height: 72, margin: "0 auto 1.25rem",
                                background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                                borderRadius: "20px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 12px rgba(0,0,0,.06)",
                            }}>
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <p style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: ".4rem" }}>
                                {isTL ? "No team members found" : "No employees found"}
                            </p>
                            <p style={{ fontSize: ".85rem", color: "#64748b", fontWeight: 500, maxWidth: 280, margin: "0 auto" }}>
                                {search
                                    ? <>No results for <strong style={{ color: "#0f172a" }}>"{search}"</strong> — try a different term</>
                                    : isTL
                                        ? "No team members are currently assigned to you"
                                        : "Get started by adding your first employee"
                                }
                            </p>
                            {!search && !isTL && (isHR || isManager) && (
                                <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: "1.25rem", gap: "6px" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                    Add First Employee
                                </button>
                            )}
                        </div>
                    )}

                    {/* TL view: read-only cards */}
                    {!loading && filtered.length > 0 && isTL && (
                        <div className="tl-team-grid">
                            {filtered.map(e => <TLEmployeeCard key={e._id} employee={e} />)}
                        </div>
                    )}

                    {/* HR view: full table */}
                    {!loading && filtered.length > 0 && (isHR || isManager) && (
                        <div className="emp-table-wrap">
                            <table className="emp-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th className="emp-col-hide">ID</th>
                                        <th className="emp-col-hide">Email</th>
                                        <th style={{ whiteSpace: "nowrap" }}>Role</th>
                                        <th style={{ whiteSpace: "nowrap" }}>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(e => (
                                        <tr key={e._id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                                                    <div style={{
                                                        width: 40, height: 40, borderRadius: "50%",
                                                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                                                        color: "white", display: "flex", alignItems: "center",
                                                        justifyContent: "center", fontWeight: 700, fontSize: ".85rem", flexShrink: 0
                                                    }}>
                                                        {initials(e.name)}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{e.name}</p>
                                                        <p className="emp-col-hide" style={{ fontSize: ".75rem", color: "#1e293b", fontWeight: 500 }}>
                                                            {e.designation || e.department || "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="emp-col-hide" style={{ fontFamily: "var(--mono)", fontSize: ".8rem", color: "#0f172a", fontWeight: 600 }}>
                                                {e.employeeId || "—"}
                                            </td>
                                            <td className="emp-col-hide" style={{ color: "#0f172a", fontWeight: 500 }}>{e.email}</td>
                                            <td style={{ whiteSpace: "nowrap" }}><RoleBadge role={e.role} /></td>
                                            <td style={{ whiteSpace: "nowrap" }}><StatusBadge status={e.status} /></td>
                                            <td>
                                                <div style={{ display: "flex", gap: ".4rem", justifyContent: "flex-end", alignItems: "center" }}>
                                                    <button
                                                        title="Edit employee"
                                                        onClick={() => openEdit(e)}
                                                        style={{
                                                            display: "inline-flex", alignItems: "center", gap: "5px",
                                                            padding: "5px 11px", borderRadius: "8px", border: "1px solid #e2e8f0",
                                                            background: "#fff", color: "#374151", fontWeight: 600,
                                                            fontSize: ".78rem", cursor: "pointer", transition: "all .15s",
                                                        }}
                                                        onMouseEnter={ev => { ev.currentTarget.style.background = "#f8fafc"; ev.currentTarget.style.borderColor = "#cbd5e1"; }}
                                                        onMouseLeave={ev => { ev.currentTarget.style.background = "#fff"; ev.currentTarget.style.borderColor = "#e2e8f0"; }}
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        title="Delete employee"
                                                        onClick={() => setConfirm({ type: "delete", employee: e })}
                                                        style={{
                                                            display: "inline-flex", alignItems: "center", gap: "5px",
                                                            padding: "5px 11px", borderRadius: "8px", border: "1px solid #fecaca",
                                                            background: "#fff1f2", color: "#dc2626", fontWeight: 600,
                                                            fontSize: ".78rem", cursor: "pointer", transition: "all .15s",
                                                        }}
                                                        onMouseEnter={ev => { ev.currentTarget.style.background = "#fee2e2"; }}
                                                        onMouseLeave={ev => { ev.currentTarget.style.background = "#fff1f2"; }}
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                                                            <path d="M10 11v6" /><path d="M14 11v6" />
                                                            <path d="M9 6V4h6v2" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Add Modal ─── */}
            {addModal && (isHR || isManager) && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setAddModal(false)}>
                    <div className="modal enhanced-modal">
                        <div className="modal-header">
                            <div>
                                <span className="modal-title" style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{
                                        width: 28, height: 28, borderRadius: "8px",
                                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                            <line x1="12" y1="1" x2="12" y2="4" />
                                            <line x1="19" y1="8" x2="22" y2="8" />
                                            <line x1="19" y1="11" x2="22" y2="11" />
                                        </svg>
                                    </span>
                                    Add New Employee
                                </span>
                                <p style={{ fontSize: ".8rem", color: "#1e293b", marginTop: "0px", fontWeight: 500, paddingLeft: "36px" }}>
                                    Fill in the details below
                                </p>
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setAddModal(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: ".85rem", padding: "0 4px" }}>
                            <FormFields form={form} onChange={handleChange} />
                        </div>
                        <div style={{ display: "flex", gap: ".65rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                            <button className="btn btn-ghost" onClick={() => setAddModal(false)} style={{ flex: 1, color: "#0f172a" }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting} style={{ flex: 2, justifyContent: "center" }}>
                                {submitting ? <><span className="spinner" />Processing...</> : "Add Employee"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Edit Modal (tabbed) ─── */}
            {editTarget && editEmp && (isHR || isManager) && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setEditTarget(null)}>
                    <div className="modal enhanced-modal">
                        <div className="modal-header">
                            <div>
                                <span className="modal-title" style={{ color: "#0f172a" }}>✏️ Edit Employee</span>
                                <p style={{ fontSize: ".8rem", color: "#1e293b", marginTop: "4px", display: "flex", alignItems: "center", gap: ".5rem", fontWeight: 500 }}>
                                    {editEmp.name} &nbsp;·&nbsp; <StatusBadge status={editEmp.status} />
                                </p>
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setEditTarget(null)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div style={{
                            display: "flex", gap: ".35rem",
                            borderBottom: "2px solid #f1f5f9",
                            marginBottom: "1.25rem",
                            paddingBottom: "2px",
                            overflowX: "auto",
                        }}>
                            {EDIT_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setEditTab(tab.key)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "6px",
                                        padding: "7px 14px",
                                        border: "none", borderRadius: "8px 8px 0 0",
                                        cursor: "pointer", fontWeight: 600, fontSize: ".8rem",
                                        whiteSpace: "nowrap", transition: "all .15s",
                                        borderBottom: editTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                                        marginBottom: "-2px",
                                        background: editTab === tab.key ? "#eff6ff" : "transparent",
                                        color: editTab === tab.key ? "var(--primary)" : "#64748b",
                                    }}
                                >
                                    <span style={{ opacity: editTab === tab.key ? 1 : 0.7 }}>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>


                        {editTab === "govid" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                {/* ── uploaded docs ── */}
                                {empDocs && (
                                    <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 16, marginTop: 4 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Uploaded Documents</p>

                                        {["aadhaar", "pan", "passbook"].map(key => {
                                            const d = empDocs?.[key];
                                            if (!d?.url) return (
                                                <div key={key} style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
                                                    {key.toUpperCase()}: No document uploaded
                                                </div>
                                            );
                                            return (
                                                <div key={key} style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "10px 14px", borderRadius: 10,
                                                    background: d.verified ? "#ecfdf5" : "#fffbeb",
                                                    border: `1px solid ${d.verified ? "#a7f3d0" : "#fde68a"}`,
                                                    marginBottom: 10,
                                                }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: 12.5, margin: "0 0 2px" }}>{key.toUpperCase()} — {d.originalName}</p>
                                                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                                                            {d.verified
                                                                ? `✓ Verified on ${new Date(d.verifiedAt).toLocaleDateString("en-IN")}`
                                                                : "Verification pending"}
                                                        </p>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <a href={toUrl(d.url)}
                                                            target="_blank" rel="noreferrer"
                                                            style={{ fontSize: 12, color: "#6c63ff", fontWeight: 600, textDecoration: "none" }}>
                                                            View
                                                        </a>
                                                        {!d.verified && (
                                                            <button
                                                                style={{ fontSize: 12, fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}
                                                                onClick={() => handleVerifyDoc(employeeId, key)}
                                                            >
                                                                Verify
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* others */}
                                        {(empDocs?.others || []).map(od => (
                                            <div key={od._id} style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "10px 14px", borderRadius: 10,
                                                background: od.verified ? "#ecfdf5" : "#fffbeb",
                                                border: `1px solid ${od.verified ? "#a7f3d0" : "#fde68a"}`,
                                                marginBottom: 10,
                                            }}>
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: 12.5, margin: "0 0 2px" }}>{od.label} — {od.originalName}</p>
                                                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                                                        {od.verified ? `✓ Verified` : "Pending"}
                                                    </p>
                                                </div>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <a href={toUrl(od.url)} target="_blank" rel="noreferrer"
                                                        style={{ fontSize: 12, color: "#6c63ff", fontWeight: 600, textDecoration: "none" }}>
                                                        View
                                                    </a>
                                                    {!od.verified && (
                                                        <button
                                                            style={{ fontSize: 12, fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}
                                                            onClick={() => handleVerifyOtherDoc(employeeId, od._id)}
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="tab-content" style={{ padding: "0 4px" }}>
                            {editTab === "basic" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                                    <FormFields form={form} onChange={handleChange} />
                                    <div>
                                        <p style={{ fontSize: ".7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: ".5rem" }}>
                                            Quick Actions
                                        </p>
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                                            gap: ".45rem",
                                            padding: ".75rem",
                                            background: "#f8fafc",
                                            borderRadius: "10px",
                                            border: "1px solid #e2e8f0",
                                        }}>
                                            {(editEmp.role === "employee" || editEmp.role === "tl") && (
                                                <button
                                                    onClick={() => { setEditTarget(null); handleViewSalary(editEmp); }}
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: "6px",
                                                        padding: "7px 11px", borderRadius: "8px",
                                                        background: "#f5f0ff", color: "#6d28d9",
                                                        border: "1px solid #ddd6fe", fontWeight: 600,
                                                        fontSize: ".78rem", cursor: "pointer", transition: "all .15s",
                                                    }}
                                                    onMouseEnter={ev => ev.currentTarget.style.background = "#ede9fe"}
                                                    onMouseLeave={ev => ev.currentTarget.style.background = "#f5f0ff"}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                    </svg>
                                                    View Salary
                                                </button>
                                            )}
                                            {editEmp.status !== "terminated" && (
                                                <button
                                                    onClick={() => setConfirm({ type: editEmp.status === "active" ? "deactivate" : "activate", employee: editEmp })}
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: "6px",
                                                        padding: "7px 11px", borderRadius: "8px",
                                                        background: editEmp.status === "active" ? "#fffbeb" : "#f0fdf4",
                                                        color: editEmp.status === "active" ? "#92400e" : "#065f46",
                                                        border: `1px solid ${editEmp.status === "active" ? "#fde68a" : "#bbf7d0"}`,
                                                        fontWeight: 600, fontSize: ".78rem", cursor: "pointer", transition: "all .15s",
                                                    }}
                                                >
                                                    {editEmp.status === "active"
                                                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                    }
                                                    {editEmp.status === "active" ? "Deactivate" : "Activate"}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setConfirm({ type: "terminate", employee: editEmp })}
                                                disabled={editEmp.status === "terminated"}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    padding: "7px 11px", borderRadius: "8px",
                                                    background: "#fff1f2", color: "#be123c",
                                                    border: "1px solid #fecdd3", fontWeight: 600,
                                                    fontSize: ".78rem", cursor: editEmp.status === "terminated" ? "not-allowed" : "pointer",
                                                    opacity: editEmp.status === "terminated" ? 0.5 : 1, transition: "all .15s",
                                                }}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                                </svg>
                                                Terminate
                                            </button>
                                            <button
                                                onClick={() => setConfirm({ type: "delete", employee: editEmp })}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    padding: "7px 11px", borderRadius: "8px",
                                                    background: "#dc2626", color: "#fff",
                                                    border: "none", fontWeight: 600,
                                                    fontSize: ".78rem", cursor: "pointer", transition: "all .15s",
                                                }}
                                                onMouseEnter={ev => ev.currentTarget.style.background = "#b91c1c"}
                                                onMouseLeave={ev => ev.currentTarget.style.background = "#dc2626"}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {editTab === "govid" && <GovernmentIdTab employeeId={editEmp._id} />}
                            {editTab === "bank" && <BankDetailsTab employeeId={editEmp._id} />}
                        </div>

                        {editTab === "basic" && (
                            <div style={{ display: "flex", gap: ".65rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                                <button className="btn btn-ghost" onClick={() => setEditTarget(null)} style={{ flex: 1, color: "#0f172a" }}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleUpdate} disabled={submitting} style={{ flex: 2, justifyContent: "center" }}>
                                    {submitting ? <><span className="spinner" />Processing...</> : "Update Employee"}
                                </button>
                            </div>
                        )}
                        {editTab !== "basic" && (
                            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                                <button className="btn btn-ghost" onClick={() => setEditTarget(null)} style={{ width: "100%", justifyContent: "center", color: "#0f172a" }}>
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Salary Modal ─── */}
            {salaryModal && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setSalaryModal(false)}>
                    <div className="modal enhanced-modal">
                        <div className="modal-header">
                            <span className="modal-title" style={{ color: "#0f172a" }}>💰 Salary Details — {selectedEmployee?.name}</span>
                            <button className="btn btn-ghost btn-icon" onClick={() => setSalaryModal(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: ".85rem", padding: "0 4px" }}>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                <select className="input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ flex: 1, minWidth: 140, color: "#0f172a" }}>
                                    <option value="">Select Month</option>
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString("default", { month: "long" })}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number" className="input" placeholder="Year"
                                    value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                                    min="2020" max="2030"
                                    style={{ flex: 1, minWidth: 100, color: "#0f172a" }}
                                />
                            </div>

                            {salaryLoading && (
                                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                                    <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3, borderTopColor: "var(--primary)" }} />
                                    <p style={{ marginTop: "1rem", color: "#1e293b", fontSize: ".875rem", fontWeight: 500 }}>Calculating salary...</p>
                                </div>
                            )}

                            {!salaryLoading && salaryData && (
                                <div>
                                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                                        <div style={{ fontSize: ".85rem", color: "#0f172a" }}>
                                            <span style={{ color: "#1e293b", fontWeight: 600 }}>Monthly Salary:</span>
                                            <span style={{ fontWeight: 800, marginLeft: ".5rem", color: "#0f172a" }}>₹{salaryData.monthlySalary?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="salary-grid">
                                        <div className="salary-item">
                                            <div className="salary-item-label">Present Days</div>
                                            <div className="salary-item-value" style={{ color: "#052e16" }}>{salaryData.presentDays}</div>
                                        </div>
                                        <div className="salary-item">
                                            <div className="salary-item-label">Half Days</div>
                                            <div className="salary-item-value" style={{ color: "#7c2d12" }}>{salaryData.halfDays}</div>
                                        </div>
                                        <div className="salary-item">
                                            <div className="salary-item-label">Paid Leave</div>
                                            <div className="salary-item-value" style={{ color: "#1e3a8a" }}>{salaryData.paidLeave ?? 0}</div>
                                        </div>
                                        <div className="salary-item">
                                            <div className="salary-item-label">Unpaid Leave</div>
                                            <div className="salary-item-value" style={{ color: "#7f1d1d" }}>{salaryData.unpaidLeave ?? 0}</div>
                                        </div>
                                        <div className="salary-item">
                                            <div className="salary-item-label">Absent Days</div>
                                            <div className="salary-item-value" style={{ color: "#7f1d1d" }}>{salaryData.absentDays}</div>
                                        </div>
                                        <div className="salary-item">
                                            <div className="salary-item-label">Holidays (Paid)</div>
                                            <div className="salary-item-value" style={{ color: "#3b0764" }}>{salaryData.holidays ?? 0}</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        background: "#fffbeb", border: "1px solid #fde68a",
                                        borderRadius: "8px", padding: ".75rem 1rem",
                                        fontSize: ".8rem", color: "#451a03", marginTop: "1rem", fontWeight: 600
                                    }}>
                                        <strong>Working Days:</strong> {salaryData.totalWorkingDays}&nbsp;·&nbsp;
                                        <strong>Weekends (Paid):</strong> {salaryData.totalWeekends}&nbsp;·&nbsp;
                                        <strong>Holidays (Paid):</strong> {salaryData.holidays}&nbsp;·&nbsp;
                                        <strong>Total Calendar Days:</strong> {salaryData.totalCalendarDays}
                                    </div>
                                    <div className="salary-total">
                                        <div className="salary-total-label">Total Salary</div>
                                        <div className="salary-total-value">₹{salaryData.totalSalary?.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}

                            {!salaryLoading && !salaryData && selectedMonth && selectedYear && (
                                <div style={{ textAlign: "center", padding: "2rem 0", color: "#1e293b", fontWeight: 500 }}>
                                    No salary data available for the selected period
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                            <button className="btn btn-ghost" onClick={() => setSalaryModal(false)} style={{ width: "100%", justifyContent: "center", color: "#0f172a" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Assign Team Modal ─── */}
            {assignModal && (isHR || isManager) && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setAssignModal(false)}>
                    <div className="modal enhanced-modal">
                        <div className="modal-header">
                            <div>
                                <span className="modal-title" style={{ color: "#0f172a" }}>👥 Assign Team to TL</span>
                                <p style={{ fontSize: ".8rem", color: "#1e293b", marginTop: "4px", fontWeight: 500 }}>
                                    Select a Team Leader and employees to assign
                                </p>
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setAssignModal(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0 4px" }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ color: "#0f172a", fontWeight: 700 }}>
                                    Select Team Leader <span style={{ color: "var(--danger)" }}>*</span>
                                </label>
                                <select className="input select" value={selectedTL} onChange={e => setSelectedTL(e.target.value)} style={{ color: "#0f172a" }}>
                                    <option value="">-- Choose a TL --</option>
                                    {tlList.map(tl => (
                                        <option key={tl._id} value={tl._id}>
                                            {tl.name} ({tl.employeeId}) {tl.department ? `— ${tl.department}` : ""}
                                        </option>
                                    ))}
                                </select>
                                {tlList.length === 0 && (
                                    <span style={{ fontSize: ".75rem", color: "#dc2626", marginTop: "4px", display: "block", fontWeight: 600 }}>
                                        ⚠️ No active TLs found. Create a TL first.
                                    </span>
                                )}
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ color: "#0f172a", fontWeight: 700 }}>
                                    Select Employees <span style={{ color: "var(--danger)" }}>*</span>
                                    <span style={{ fontSize: ".72rem", color: "#1e293b", fontWeight: 600, marginLeft: 6 }}>
                                        ({selectedEmployeeIds.length} selected)
                                    </span>
                                </label>
                                <div style={{
                                    maxHeight: 260, overflowY: "auto",
                                    border: "1px solid #e5e7eb", borderRadius: "8px",
                                    padding: ".5rem", display: "flex", flexDirection: "column", gap: ".35rem"
                                }}>
                                    {employees.filter(e => e.role === "employee").map(emp => (
                                        <label key={emp._id} style={{
                                            display: "flex", alignItems: "center", gap: ".65rem",
                                            padding: ".5rem .65rem", borderRadius: "6px", cursor: "pointer",
                                            background: selectedEmployeeIds.includes(emp._id) ? "#eff6ff" : "transparent",
                                            border: `1px solid ${selectedEmployeeIds.includes(emp._id) ? "#bfdbfe" : "transparent"}`,
                                            transition: "all .1s ease",
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployeeIds.includes(emp._id)}
                                                onChange={() => toggleEmployeeSelect(emp._id)}
                                                style={{ accentColor: "var(--primary)", width: 15, height: 15 }}
                                            />
                                            <div style={{
                                                width: 30, height: 30, borderRadius: "50%",
                                                background: "linear-gradient(135deg, #667eea, #764ba2)",
                                                color: "white", display: "flex", alignItems: "center",
                                                justifyContent: "center", fontWeight: 700, fontSize: ".72rem", flexShrink: 0,
                                            }}>
                                                {initials(emp.name)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 700, fontSize: ".82rem", color: "#0f172a", lineHeight: 1.3 }}>{emp.name}</p>
                                                <p style={{ fontSize: ".72rem", color: "#1e293b", fontWeight: 500 }}>
                                                    {emp.employeeId} · {emp.designation || emp.department || emp.email}
                                                </p>
                                            </div>
                                            {emp.reportingTo && (
                                                <span style={{
                                                    fontSize: ".68rem", background: "#fef3c7",
                                                    color: "#451a03", padding: "2px 6px",
                                                    borderRadius: "4px", flexShrink: 0, fontWeight: 700
                                                }}>
                                                    Already assigned
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                    {employees.filter(e => e.role === "employee").length === 0 && (
                                        <p style={{ textAlign: "center", color: "#1e293b", fontSize: ".82rem", padding: "1rem", fontWeight: 500 }}>
                                            No employees found
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: "#0f172a", fontWeight: 600 }}
                                        onClick={() => setSelectedEmployeeIds(employees.filter(e => e.role === "employee").map(e => e._id))}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: "#0f172a", fontWeight: 600 }}
                                        onClick={() => setSelectedEmployeeIds([])}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: ".65rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                            <button className="btn btn-ghost" onClick={() => setAssignModal(false)} style={{ flex: 1, color: "#0f172a" }}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAssignTeam}
                                disabled={assignLoading || !selectedTL || selectedEmployeeIds.length === 0}
                                style={{ flex: 2, justifyContent: "center" }}
                            >
                                {assignLoading
                                    ? <><span className="spinner" />Assigning...</>
                                    : `Assign ${selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : ""} Employee(s)`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Confirm Dialog ─── */}
            {confirm && activeConfirmConfig && (isHR || isManager) && (
                <ConfirmDialog
                    title={activeConfirmConfig.title}
                    message={activeConfirmConfig.getMessage(confirm.employee?.name)}
                    confirmText={activeConfirmConfig.confirmText}
                    confirmStyle={activeConfirmConfig.confirmStyle}
                    icon={Icons[confirm.type]}
                    loading={actionLoading}
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </DashboardLayout>
    );
};

export default Employees;