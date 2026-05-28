import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API, { BASE_URL, QR_CODE_URL } from "../../services/api";
import Swal from "sweetalert2";
import ActiveSessions from "../../components/common/ActiveSessions";

// react-icons — lucide set
import {
    LuUser, LuBadge, LuMail, LuShield, LuBriefcase, LuBuilding2,
    LuCalendar, LuCircleDot, LuPhone, LuCake, LuGlobe, LuHeart,
    LuPencil, LuCreditCard, LuLock, LuUpload, LuX, LuCheck,
    LuTriangleAlert, LuRefreshCw, LuSave, LuKeyRound, LuEye,
    LuEyeOff, LuChevronDown, LuFolder, LuInfo, LuMonitor,
} from "react-icons/lu";
import StopwatchLoader from "../../components/common/StopwatchLoader";
import { QRCodeSVG } from "qrcode.react";

import EmployeeIDCard from "../../components/scanner/EmployeeIDCard";
import logoImg from "../../assets/logo.png";

/* ════════════════════════════════════════
   VALIDATORS
════════════════════════════════════════ */

const bankValidators = {
    accountHolderName: (v) => {
        if (!v?.trim()) return "Required";
        if (v.trim().length < 3) return "At least 3 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(v.trim())) return "Letters only";
        return null;
    },
    accountNumber: (v) => {
        if (!v?.trim()) return "Required";
        if (!/^\d{9,18}$/.test(v.trim())) return "9–18 digits only";
        return null;
    },
    confirmAccountNumber: (v, accountNumber) => {
        if (!v?.trim()) return "Required";
        if (v.trim() !== accountNumber?.trim()) return "Account numbers do not match";
        return null;
    },
    ifscCode: (v) => {
        if (!v?.trim()) return "Required";
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.trim().toUpperCase())) return "Format: ABCD0123456";
        return null;
    },
};

const toUrl = (path) =>
    !path ? "" : path.startsWith("http") ? path : `${BASE_URL}/${path.replace(/^\//, "")}`;

/* ════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════ */
const T = {
    bg: "#f5f4f7",
    surface: "#ffffff",
    border: "#e4e1f0",
    borderFocus: "#6c63ff",
    text: "#111827",
    textSub: "#374151",
    muted: "#6b7280",
    accent: "#6c63ff",
    accentLight: "#ede9ff",
    success: "#059669",
    successLight: "#ecfdf5",
    error: "#dc2626",
    errorLight: "#fef2f2",
    warn: "#d97706",
    warnLight: "#fffbeb",
    radius: 16,
    radiusSm: 10,
};

/* ════════════════════════════════════════
   GLOBAL CSS
════════════════════════════════════════ */
const css = `
@keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
@keyframes spin { to { transform:rotate(360deg); } }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes slideIn { from { opacity:0; transform:translateX(10px); } to { opacity:1; transform:translateX(0); } }

.pf-input:focus {
  border-color: ${T.borderFocus} !important;
  box-shadow: 0 0 0 3px rgba(108,99,255,.13) !important;
  outline: none !important;
}
.pf-btn-primary { transition: all .2s ease !important; }
.pf-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(108,99,255,.38) !important; }
.pf-btn-primary:active:not(:disabled) { transform: translateY(0); }
.pf-ghost:hover { background: ${T.accentLight} !important; color: ${T.accent} !important; }
.pf-tab-item { transition: color .15s ease, border-color .15s ease !important; }
.pf-tab-item:hover { color: ${T.accent} !important; }
.pf-qcard:hover {
  border-color: ${T.accent} !important;
  background: ${T.accentLight} !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(108,99,255,.14);
}
.pf-qcard { transition: all .2s ease !important; }
.tab-bar-scroll { scrollbar-width: none; }
.tab-bar-scroll::-webkit-scrollbar { display: none; }

@media (max-width: 480px) {
  .pf-grid-2 { grid-template-columns: 1fr !important; }
  .pf-info-grid { grid-template-columns: 1fr !important; }
  .pf-quick-grid { grid-template-columns: 1fr 1fr !important; }
  .pf-hero-ring { display: none !important; }
  .pf-hero-meta span { font-size: 11px !important; }
  .pf-panel { padding: 18px 16px !important; }
  .pf-tab-item { padding: 12px 13px !important; font-size: 12px !important; }
  .pf-tab-item span:first-child { display: none; }
}
`;

/* ════════════════════════════════════════
   STATIC DATA
════════════════════════════════════════ */
const GOV_ID_TYPES = [
    { value: "aadhaar", label: "Aadhaar Card", hint: "12 digits · Cannot start with 0 or 1" },
    { value: "pan", label: "PAN Card", hint: "Format: ABCDE1234F" },
    { value: "passport", label: "Passport", hint: "Format: A1234567" },
    { value: "voter_id", label: "Voter ID", hint: "Format: ABC1234567" },
    { value: "driving_license", label: "Driving License", hint: "Format: MH0120191234567" },
    { value: "other", label: "Other", hint: "Minimum 4 characters" },
];

const ACCOUNT_TYPES = [
    { value: "savings", label: "Savings" },
    { value: "current", label: "Current" },
    { value: "salary", label: "Salary" },
    { value: "other", label: "Other" },
];

const MARITAL_STATUS_OPTIONS = [
    { value: "", label: "Select status" },
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "divorced", label: "Divorced" },
    { value: "widowed", label: "Widowed" },
    { value: "separated", label: "Separated" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const NATIONALITY_OPTIONS = [
    { value: "", label: "Select nationality" },
    { value: "Indian", label: "Indian" },
    { value: "American", label: "American" },
    { value: "British", label: "British" },
    { value: "Canadian", label: "Canadian" },
    { value: "Australian", label: "Australian" },
    { value: "German", label: "German" },
    { value: "French", label: "French" },
    { value: "Japanese", label: "Japanese" },
    { value: "Chinese", label: "Chinese" },
    { value: "Singaporean", label: "Singaporean" },
    { value: "Other", label: "Other" },
];

const TABS = [
    { id: "overview", label: "Overview", Icon: LuUser },
    { id: "personal", label: "Personal", Icon: LuPencil },
    { id: "govid", label: "Gov ID", Icon: LuBadge },
    { id: "bank", label: "Bank", Icon: LuCreditCard },
    { id: "security", label: "Security", Icon: LuLock },
    { id: "idcard", label: "ID Card", Icon: LuBadge },
    { id: "sessions", label: "Sessions", Icon: LuMonitor },
];

const ROLE_COLORS = {
    hr: "#1d4ed8",
    superadmin: "#7e22ce",
    manager: "#15803d",
    tl: "#c2410c",
    employee: "#374151",
};

/* ════════════════════════════════════════
   ATOMS
════════════════════════════════════════ */
const ff = "'Plus Jakarta Sans', sans-serif";

const Label = ({ children, required }) => (
    <span style={{
        display: "block", fontSize: 11, fontWeight: 700, color: T.muted,
        marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase", fontFamily: ff,
    }}>
        {children}{required && <span style={{ color: T.error, marginLeft: 2 }}>*</span>}
    </span>
);

const FieldError = ({ error, touched }) => {
    if (!touched || !error) return null;
    return (
        <span style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, color: T.error, marginTop: 5,
            animation: "fadeUp .15s ease", fontFamily: ff,
        }}>
            <LuInfo size={11} />
            {error}
        </span>
    );
};

const Input = ({ error, touched, style, ...props }) => (
    <input className="pf-input" style={{
        width: "100%", padding: "10px 13px", borderRadius: T.radiusSm,
        border: `1.5px solid ${touched ? (error ? "#fca5a5" : "#6ee7b7") : T.border}`,
        background: touched ? (error ? T.errorLight : T.successLight) : T.surface,
        fontSize: 13.5, color: T.text, fontFamily: ff,
        transition: "border .15s, box-shadow .15s",
        ...style,
    }} {...props} />
);

const Select = ({ error, touched, children, style, ...props }) => (
    <select className="pf-input" style={{
        width: "100%", padding: "10px 36px 10px 13px", borderRadius: T.radiusSm,
        border: `1.5px solid ${touched ? (error ? "#fca5a5" : "#6ee7b7") : T.border}`,
        background: `${touched ? (error ? T.errorLight : T.successLight) : T.surface} url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' strokeWidth='1.5' strokeLinecap='round'/%3E%3C/svg%3E") no-repeat right 13px center`,
        fontSize: 13.5, color: T.text, appearance: "none", outline: "none",
        cursor: "pointer", fontFamily: ff, transition: "border .15s, box-shadow .15s",
        ...style,
    }} {...props}>{children}</select>
);

const Btn = ({ loading, children, variant = "primary", size = "md", style, ...props }) => {
    const sizes = { sm: { padding: "7px 14px", fontSize: 12 }, md: { padding: "10px 22px", fontSize: 13.5 } };
    const variants = {
        primary: { background: loading ? "#a5a0f0" : T.accent, color: "#fff", boxShadow: loading ? "none" : "0 4px 14px rgba(108,99,255,.28)" },
        ghost: { background: T.accentLight, color: T.accent, border: `1px solid ${T.border}` },
        danger: { background: T.errorLight, color: T.error, border: "1px solid #fecaca" },
    };
    return (
        <button
            className={variant === "primary" ? "pf-btn-primary" : "pf-ghost"}
            style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                borderRadius: T.radiusSm, fontWeight: 600, border: "none",
                cursor: loading ? "not-allowed" : "pointer", fontFamily: ff,
                ...sizes[size], ...variants[variant], ...style,
            }}
            disabled={loading} {...props}
        >
            {loading
                ? <StopwatchLoader />
                : null}
            {children}
        </button>
    );
};

const Alert = ({ type, text }) => (
    <div style={{
        padding: "10px 14px", borderRadius: T.radiusSm, fontSize: 13, fontWeight: 500,
        background: type === "success" ? T.successLight : T.errorLight,
        color: type === "success" ? "#065f46" : "#991b1b",
        border: `1.5px solid ${type === "success" ? "#a7f3d0" : "#fecaca"}`,
        display: "flex", alignItems: "center", gap: 8,
        animation: "fadeUp .2s ease", fontFamily: ff,
    }}>
        {type === "success"
            ? <LuCheck size={15} style={{ flexShrink: 0 }} />
            : <LuX size={15} style={{ flexShrink: 0 }} />}
        {text}
    </div>
);

// InfoRow with react-icon support
const InfoRow = ({ label, value, Icon }) => (
    <div style={{ padding: "11px 14px", borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
        <div style={{
            fontSize: 10, fontWeight: 700, color: T.muted,
            letterSpacing: ".07em", textTransform: "uppercase",
            marginBottom: 5, fontFamily: ff,
            display: "flex", alignItems: "center", gap: 5,
        }}>
            {Icon && <Icon size={11} />}{label}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: value ? T.text : T.muted, fontFamily: ff }}>
            {value || "—"}
        </div>
    </div>
);

const Pill = ({ children, color = T.accent, bg = T.accentLight }) => (
    <span style={{
        background: bg, color, fontSize: 10, fontWeight: 700,
        letterSpacing: ".07em", textTransform: "uppercase",
        padding: "3px 10px", borderRadius: 99, border: `1px solid ${color}33`, fontFamily: ff,
    }}>{children}</span>
);

const StatusPill = ({ done }) => (
    <Pill color={done ? T.success : T.warn} bg={done ? T.successLight : T.warnLight}>
        {done ? "✓ Complete" : "Incomplete"}
    </Pill>
);

const ProgressRing = ({ pct, size = 56, stroke = 5 }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const safePct = Math.min(Math.max(Number(pct) || 0, 0), 100);
    const dash = (safePct / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.accent} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray .6s ease" }}
            />
        </svg>
    );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function Profile() {
    const { user, setUser } = useContext(AuthContext);
    const fileRef = useRef(null);

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    const getAvatarSrc = () => toUrl(user?.avatar || "") || null;

    const [tab, setTab] = useState("overview");

    /* ── avatar ── */
    const [avatarPreview, setAvatarPreview] = useState(getAvatarSrc());
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarMsg, setAvatarMsg] = useState(null);

    const stripCountryCode = (phone) => {
        if (!phone) return "";
        const s = phone.toString().replace(/\D/g, "");
        if (s.startsWith("91") && s.length === 12) return s.slice(2);
        return s;
    };

    const isPrivilegedUser = ["hr", "manager", "superadmin"].includes(user?.role);

    const [selfForm, setSelfForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: stripCountryCode(user?.phone),
        dob: user?.dob ? user.dob.slice(0, 10) : "",
        maritalStatus: user?.maritalStatus || "",
        nationality: user?.nationality || "Indian",   // ← default Indian
        guardianName: user?.guardianName || "",
        bloodGroup: user?.bloodGroup || "",
        emergencyContactName: user?.emergencyContact?.name || "",
        emergencyContactPhone: user?.emergencyContact?.phone || "",
        emergencyContactRelation: user?.emergencyContact?.relation || "",
    });

    const [selfMsg, setSelfMsg] = useState(null);
    const [selfLoading, setSelfLoading] = useState(false);

    /* ── password ── */
    const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [pwMsg, setPwMsg] = useState(null);
    const [pwLoading, setPwLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    /* ── govt id ── */
    const [govIds, setGovIds] = useState({
        pan: "",
        aadhaar: "",
    });

    const [govIdErrors, setGovIdErrors] = useState({});
    const [govIdLoading, setGovIdLoading] = useState(false);
    const [govIdFetching, setGovIdFetching] = useState(true);
    const [govIdMsg, setGovIdMsg] = useState(null);
    const [govIdDone, setGovIdDone] = useState(false);

    /* ── bank ── */
    const [bank, setBank] = useState({
        accountHolderName: "", accountNumber: "", confirmAccountNumber: "",
        bankName: "", ifscCode: "", branchName: "", accountType: "savings",
    });
    const [bankTouched, setBankTouched] = useState({});
    const [bankErrors, setBankErrors] = useState({});
    const [bankLoading, setBankLoading] = useState(false);
    const [bankFetching, setBankFetching] = useState(true);
    const [bankMsg, setBankMsg] = useState(null);
    const [bankDone, setBankDone] = useState(false);
    const [ifscLooking, setIfscLooking] = useState(false);
    const [bankVerification, setBankVerification] = useState(null);


    /* ── documents ── */
    const [docs, setDocs] = useState({ aadhaar: null, pan: null, passbook: null, others: [] });
    const [docsFetching, setDocsFetching] = useState(true);
    const [docUploading, setDocUploading] = useState({});
    const [docMsg, setDocMsg] = useState(null);
    const docFileRefs = {
        aadhaar: useRef(null),
        pan: useRef(null),
        passbook: useRef(null),
        other: useRef(null),
    };

    const otherRef = useRef(null);

    /* ════════════════════════════════════════
       COMPLETION
    ════════════════════════════════════════ */
    const completionItems = {
        name: !!user?.name,
        email: !!user?.email,
        phone: !!(user?.phone || selfForm.phone),
        dob: !!(user?.dob || selfForm.dob),
        avatar: !!avatarPreview,
        maritalStatus: !!(user?.maritalStatus || selfForm.maritalStatus),
        nationality: !!(user?.nationality || selfForm.nationality),
        govId: govIdDone,
        bank: bankDone,
    };
    const totalItems = Object.keys(completionItems).length;
    const doneItems = Object.values(completionItems).filter(Boolean).length;
    const completionPct = Math.round((doneItems / totalItems) * 100);
    const profileComplete = completionPct === 100;

    /* ── fetch govt id ── */
    useEffect(() => {
        (async () => {
            setGovIdFetching(true);
            try {
                const res = await API.get("/users/me/government-id");
                if (res.data.governmentIds) {
                    const pan = res.data.governmentIds.pan || "";
                    const aadhaar = res.data.governmentIds.aadhaar || "";

                    setGovIds({ pan, aadhaar });

                    // ✅ ADD THIS
                    if (pan && aadhaar) {
                        setGovIdDone(true);
                    }
                }
            } catch { }
            finally { setGovIdFetching(false); }
        })();
    }, []);


    useEffect(() => {
        (async () => {
            setDocsFetching(true);
            try {
                const res = await API.get("/users/me/documents");
                if (res.data.documents) setDocs(res.data.documents);
            } catch { }
            finally { setDocsFetching(false); }
        })();
    }, []);

    /* ── fetch bank ── */
    useEffect(() => {
        (async () => {
            setBankFetching(true);
            try {
                const res = await API.get("/users/me/bank-details");
                if (res.data.bankDetails?.accountNumber) {
                    const b = res.data.bankDetails;
                    setBank({
                        accountHolderName: b.accountHolderName || "",
                        accountNumber: b.accountNumber || "",
                        confirmAccountNumber: b.accountNumber || "",
                        bankName: b.bankName || "",
                        ifscCode: b.ifscCode || "",
                        branchName: b.branchName || "",
                        accountType: b.accountType || "savings",
                    });
                    setBankDone(true);
                }
            } catch { }
            finally { setBankFetching(false); }
        })();
    }, []);

    /* ── avatar upload ── */
    const handleAvatarPick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            Swal.fire({
                icon: "warning",
                title: "Invalid File",
                text: "Please pick an image file.",
                confirmButtonColor: "#6c63ff",
            });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire({
                icon: "warning",
                title: "File Too Large",
                text: "Image must be under 2MB.",
                confirmButtonColor: "#6c63ff",
            });
            return;
        }
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarLoading(true); setAvatarMsg(null);
        try {
            const fd = new FormData(); fd.append("avatar", file);
            const { data } = await API.post("/users/me/avatar", fd);
            setAvatarPreview(toUrl(data.avatarUrl));
            if (setUser) setUser(data.user);
            setAvatarMsg({ type: "success", text: "Photo updated!" });
        } catch (err) {
            setAvatarMsg({ type: "error", text: err?.response?.data?.message || "Upload failed." });
            setAvatarPreview(getAvatarSrc());
        } finally {
            setAvatarLoading(false); e.target.value = "";
        }
    };


    const handleDocUpload = async (file, type, label = "") => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setDocMsg({ type: "error", text: "Max file size is 5 MB." }); return; }
        setDocUploading(p => ({ ...p, [type]: true }));
        setDocMsg(null);
        try {
            const fd = new FormData();
            fd.append("document", file);
            if (label) fd.append("label", label);
            const { data } = await API.post(`/users/me/documents/${type}`, fd);
            setDocs(data.documents);
            setDocMsg({ type: "success", text: "Document uploaded!" });
        } catch (err) {
            setDocMsg({ type: "error", text: err?.response?.data?.message || "Upload failed." });
        } finally {
            setDocUploading(p => ({ ...p, [type]: false }));
        }
    };



    const handleRemoveAvatar = async () => {
        setAvatarLoading(true);
        try {
            const { data } = await API.put("/users/me/profile", { avatar: "" });
            setAvatarPreview(null);
            if (setUser) setUser(data.user);
            setAvatarMsg({ type: "success", text: "Photo removed." });
        } catch (err) {
            setAvatarMsg({ type: "error", text: err?.response?.data?.message || "Could not remove." });
        } finally { setAvatarLoading(false); }
    };

    /* ── personal save (now includes maritalStatus + nationality) ── */
    const handleSelfSave = async (e) => {
        e.preventDefault(); setSelfLoading(true); setSelfMsg(null);
        try {
            const payload = {
                phone: selfForm.phone,
                dob: selfForm.dob,
                maritalStatus: selfForm.maritalStatus,
                nationality: selfForm.nationality,
                guardianName: selfForm.guardianName,
                bloodGroup: selfForm.bloodGroup,
                emergencyContact: {
                    name: selfForm.emergencyContactName,
                    phone: selfForm.emergencyContactPhone,
                    relation: selfForm.emergencyContactRelation,
                },
            };
            // HR/Manager can also update name and email
            if (isPrivilegedUser) {
                payload.name = selfForm.name;
                payload.email = selfForm.email;
            }
            const { data } = await API.put("/users/me/profile", payload);
            setSelfMsg({ type: "success", text: "Profile updated!" });
            if (setUser) setUser(data.user);
            setSelfForm({
                name: data.user?.name || "",
                email: data.user?.email || "",
                phone: stripCountryCode(data.user?.phone),
                dob: data.user?.dob ? data.user.dob.slice(0, 10) : "",
                maritalStatus: data.user?.maritalStatus || "",
                nationality: data.user?.nationality || "Indian",
                guardianName: data.user?.guardianName || "",
                bloodGroup: data.user?.bloodGroup || "",
                emergencyContactName: data.user?.emergencyContact?.name || "",
                emergencyContactPhone: data.user?.emergencyContact?.phone || "",
                emergencyContactRelation: data.user?.emergencyContact?.relation || "",
            });
        } catch (err) {
            setSelfMsg({ type: "error", text: err?.response?.data?.message || "Update failed." });
        } finally { setSelfLoading(false); }
    };

    /* ── password ── */
    const handlePwChange = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword)
            return setPwMsg({ type: "error", text: "Passwords don't match." });
        if (pwForm.newPassword.length < 6)
            return setPwMsg({ type: "error", text: "Min 6 characters." });
        setPwLoading(true); setPwMsg(null);
        try {
            await API.put("/users/me/password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            setPwMsg({ type: "success", text: "Password changed!" });
            setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setPwMsg({ type: "error", text: err?.response?.data?.message || "Password change failed." });
        } finally { setPwLoading(false); }
    };

    /* ── gov id handlers ── */
    const validateGov = () => {
        const errors = {};

        if (govIds.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(govIds.pan)) {
            errors.pan = "Invalid PAN format";
        }

        if (govIds.aadhaar && !/^\d{12}$/.test(govIds.aadhaar)) {
            errors.aadhaar = "Invalid Aadhaar";
        }

        return errors;
    };

    const handleGovSave = async () => {
        const errors = validateGov();

        if (Object.keys(errors).length > 0) {
            setGovIdErrors(errors);
            return;
        }

        setGovIdLoading(true);
        setGovIdMsg(null);

        try {
            await API.put("/users/me/government-id", {
                governmentIds: govIds
            });

            setGovIdMsg({ type: "success", text: "Government ID saved!" });
            setGovIdDone(true);
        } catch (err) {
            setGovIdMsg({
                type: "error",
                text: err?.response?.data?.message || "Validation failed"
            });
        } finally {
            setGovIdLoading(false);
        }
    };

    /* ── bank handlers ── */
    const handleBankChange = (e) => {
        const { name, value } = e.target;
        const updatedBank = { ...bank, [name]: value };
        setBank(updatedBank);

        let err = null;
        if (name === "confirmAccountNumber") {
            err = bankValidators.confirmAccountNumber(value, updatedBank.accountNumber);
        } else if (name === "accountNumber") {
            err = bankValidators.accountNumber(value);
            if (bankTouched.confirmAccountNumber) {
                setBankErrors(p => ({
                    ...p,
                    accountNumber: err,
                    confirmAccountNumber: bankValidators.confirmAccountNumber(updatedBank.confirmAccountNumber, value),
                }));
                setBankTouched(p => ({ ...p, [name]: true }));
                setBankMsg(null);
                return;
            }
        } else if (bankValidators[name]) {
            err = bankValidators[name](value);
        }

        setBankErrors(p => ({ ...p, [name]: err }));
        setBankTouched(p => ({ ...p, [name]: true }));
        setBankMsg(null);
        setBankVerification(null);
    };

    const handleIFSCChange = (e) => {
        const v = e.target.value.toUpperCase();
        setBank(p => ({ ...p, ifscCode: v, bankName: "", branchName: "" }));
        setBankErrors(p => ({ ...p, ifscCode: bankValidators.ifscCode(v) }));
        setBankTouched(p => ({ ...p, ifscCode: true }));
        setBankMsg(null);
    };

    const handleIFSCBlur = async () => {
        const c = bank.ifscCode.trim().toUpperCase();
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(c)) return;
        setIfscLooking(true);
        try {
            const res = await fetch(`https://ifsc.razorpay.com/${c}`, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const info = await res.json();
                setBank(p => ({ ...p, bankName: info.BANK || p.bankName, branchName: info.BRANCH || p.branchName }));
            }
        } catch { }
        finally { setIfscLooking(false); }
    };

    const handleBankSave = async () => {
        const req = ["accountHolderName", "accountNumber", "confirmAccountNumber", "ifscCode"];
        const newE = {}; const newT = {};
        req.forEach(k => {
            newT[k] = true;
            newE[k] = k === "confirmAccountNumber"
                ? bankValidators.confirmAccountNumber(bank[k], bank.accountNumber)
                : (bankValidators[k]?.(bank[k]) ?? null);
        });
        setBankErrors(p => ({ ...p, ...newE }));
        setBankTouched(p => ({ ...p, ...newT }));
        if (req.some(k => newE[k])) return;

        setBankLoading(true); setBankMsg(null); setBankVerification(null);
        try {
            const { confirmAccountNumber: _skip, ...payload } = bank;
            const res = await API.put("/users/me/bank-details", payload);
            if (res.data.verification) {
                const v = res.data.verification;
                setBankVerification(v);
                setBank(p => ({ ...p, bankName: v.bank || p.bankName, branchName: v.branch || p.branchName }));
            }
            // Instantly reflect saved bank details from server response
            if (res.data.bankDetails) {
                const b = res.data.bankDetails;
                setBank({
                    accountHolderName: b.accountHolderName || "",
                    accountNumber: b.accountNumber || "",
                    confirmAccountNumber: b.accountNumber || "",
                    bankName: b.bankName || "",
                    ifscCode: b.ifscCode || "",
                    branchName: b.branchName || "",
                    accountType: b.accountType || "savings",
                });
            }
            setBankMsg({ type: "success", text: "Bank details saved!" });
            setBankDone(true);
        } catch (err) {
            setBankMsg({
                type: "error",
                text: err.response?.data?.errors?.join(" · ") || err.response?.data?.message || "Validation failed",
            });
        } finally { setBankLoading(false); }
    };

    const getStrength = (pw) =>
        [/.{6,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;

    const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.employee;

    const isNameMatching = () => {
        if (!user?.name || !bank.accountHolderName) return true;

        const normalize = (str) =>
            str.toLowerCase().replace(/\s+/g, " ").trim();

        return normalize(user.name) === normalize(bank.accountHolderName);
    };

    const missingItems = [
        !completionItems.phone && "phone number",
        !completionItems.dob && "date of birth",
        !completionItems.avatar && "profile photo",
        !completionItems.maritalStatus && "marital status",
        !completionItems.nationality && "nationality",
        !completionItems.govId && "government ID",
        !completionItems.bank && "bank details",
    ].filter(Boolean);

    /* ════════════════════════════════════════
       TAB PANELS
    ════════════════════════════════════════ */
    const g2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };

    const panels = {

        /* ── OVERVIEW ── */
        overview: (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "slideIn .25s ease" }}>

                {!profileComplete && (
                    <div style={{
                        background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
                        border: "1.5px solid #fde68a", borderRadius: T.radius,
                        padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start",
                    }}>
                        <LuTriangleAlert size={22} color={T.warn} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, color: "#92400e", margin: "0 0 5px" }}>
                                Complete your profile — {completionPct}% done
                            </p>
                            <p style={{ fontFamily: ff, fontSize: 12.5, color: "#b45309", margin: "0 0 12px", lineHeight: 1.6 }}>
                                Still missing: {missingItems.join(", ")}.
                            </p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {!completionItems.govId && <Btn size="sm" onClick={() => setTab("govid")}><LuBadge size={12} /> Add Gov ID</Btn>}
                                {!completionItems.bank && <Btn size="sm" variant="ghost" onClick={() => setTab("bank")}><LuCreditCard size={12} /> Add Bank</Btn>}
                                {(!completionItems.phone || !completionItems.dob || !completionItems.avatar || !completionItems.maritalStatus || !completionItems.nationality) && (
                                    <Btn size="sm" variant="ghost" onClick={() => setTab("personal")}><LuPencil size={12} /> Edit Personal</Btn>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Account info grid */}
                <div>
                    <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 12, color: T.muted, letterSpacing: ".07em", textTransform: "uppercase", margin: "0 0 12px" }}>
                        Account Information
                    </p>
                    <div className="pf-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                        <InfoRow label="Full Name" value={user?.name} Icon={LuUser} />
                        <InfoRow label="Employee ID" value={user?.employeeId} Icon={LuBadge} />
                        <InfoRow label="Email" value={user?.email} Icon={LuMail} />
                        <InfoRow label="Role" value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Icon={LuShield} />
                        <InfoRow label="Designation" value={user?.designation} Icon={LuBriefcase} />
                        <InfoRow label="Department" value={user?.department} Icon={LuBuilding2} />
                        <InfoRow
                            label="Joining Date"
                            value={user?.joiningDate
                                ? new Date(user.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                : null}
                            Icon={LuCalendar}
                        />
                        <InfoRow label="Status" value={user?.status.charAt(0).toUpperCase() + user?.status?.slice(1)} Icon={LuCircleDot} />
                        <InfoRow label="Phone" value={stripCountryCode(user?.phone) || selfForm.phone} Icon={LuPhone} />
                        <InfoRow
                            label="Date of Birth"
                            value={(user?.dob || selfForm.dob)
                                ? new Date(user?.dob || selfForm.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                : null}
                            Icon={LuCake}
                        />
                        <InfoRow
                            label="Nationality"
                            value={user?.nationality || selfForm.nationality}
                            Icon={LuGlobe}
                        />
                        <InfoRow
                            label="Marital Status"
                            value={
                                (() => {
                                    const raw = user?.maritalStatus || selfForm.maritalStatus;
                                    if (!raw) return null;
                                    const opt = MARITAL_STATUS_OPTIONS.find(o => o.value === raw);
                                    return opt ? opt.label : raw;
                                })()
                            }
                            Icon={LuHeart}
                        />
                        <InfoRow
                            label="Blood Group"
                            value={user?.bloodGroup || selfForm.bloodGroup || null}
                            Icon={LuCircleDot}
                        />
                        {(user?.emergencyContact?.name || selfForm.emergencyContactName) && (
                            <InfoRow
                                label="Emergency Contact"
                                value={`${user?.emergencyContact?.name || selfForm.emergencyContactName} (${user?.emergencyContact?.relation || selfForm.emergencyContactRelation || "—"}) · ${user?.emergencyContact?.phone || selfForm.emergencyContactPhone || "—"}`}
                                Icon={LuPhone}
                            />
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                <div>
                    <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 12, color: T.muted, letterSpacing: ".07em", textTransform: "uppercase", margin: "0 0 12px" }}>
                        Quick Actions
                    </p>
                    <div className="pf-quick-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                        {[
                            {
                                Icon: LuPencil, label: "Personal Details",
                                desc: "Phone, DOB, nationality & more", tid: "personal",
                                warn: !completionItems.phone || !completionItems.dob || !completionItems.avatar || !completionItems.maritalStatus || !completionItems.nationality,
                            },
                            { Icon: LuBadge, label: "Government ID", desc: govIdDone ? "✓ Saved" : "⚠ Required", tid: "govid", warn: !govIdDone },
                            { Icon: LuCreditCard, label: "Bank Details", desc: bankDone ? "✓ Saved" : "⚠ Required", tid: "bank", warn: !bankDone },
                            { Icon: LuLock, label: "Change Password", desc: "Update credentials", tid: "security", warn: false },
                        ].map(({ Icon: QIcon, label, desc, tid, warn }) => (
                            <button
                                key={tid} className="pf-qcard"
                                onClick={() => setTab(tid)}
                                style={{
                                    background: warn ? T.warnLight : T.bg,
                                    border: `1.5px solid ${warn ? "#fde68a" : T.border}`,
                                    borderRadius: 12, padding: "14px",
                                    cursor: "pointer", textAlign: "left", fontFamily: ff,
                                }}
                            >
                                <QIcon size={20} color={warn ? T.warn : T.accent} style={{ marginBottom: 7 }} />
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{label}</div>
                                <div style={{ fontSize: 11.5, color: warn ? T.warn : T.textSub, fontWeight: 500 }}>{desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ),

        /* ── PERSONAL ── */
        personal: (
            <div style={{ animation: "slideIn .25s ease" }}>
                <div style={{ marginBottom: 22 }}>
                    <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 16, color: T.text, margin: "0 0 4px" }}>Personal Details</p>
                    <p style={{ fontFamily: ff, fontSize: 13, color: T.textSub, margin: 0 }}>Phone, date of birth, nationality, marital status and profile photo</p>
                </div>

                <form onSubmit={handleSelfSave} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                    {/* ── Profile Photo ── */}
                    <div>
                        <Label>Profile Photo</Label>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 16,
                            padding: "16px 18px", borderRadius: 12,
                            border: `1.5px dashed ${T.border}`, background: T.bg, flexWrap: "wrap",
                        }}>
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="avatar" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${T.accent}` }} />
                                    : <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${T.accent},#9b89ff)`, display: "grid", placeItems: "center", color: "#fff", fontSize: 20, fontWeight: 800, fontFamily: ff }}>{initials}</div>}
                                {avatarLoading && <StopwatchLoader />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarPick} />
                                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                    <Btn variant="ghost" size="sm" type="button" loading={avatarLoading} onClick={() => fileRef.current?.click()}>
                                        <LuUpload size={12} /> {avatarLoading ? "Uploading…" : "Upload"}
                                    </Btn>
                                    {avatarPreview && !avatarLoading && (
                                        <Btn variant="danger" size="sm" type="button" onClick={handleRemoveAvatar}>
                                            <LuX size={12} /> Remove
                                        </Btn>
                                    )}
                                </div>
                                <span style={{ fontSize: 11, color: T.muted, fontFamily: ff }}>JPG, PNG · Max 2MB · Saved instantly</span>
                                {avatarMsg && (
                                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: avatarMsg.type === "success" ? T.success : T.error, fontFamily: ff, display: "flex", alignItems: "center", gap: 5 }}>
                                        {avatarMsg.type === "success" ? <LuCheck size={12} /> : <LuX size={12} />}
                                        {avatarMsg.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Phone + DOB ── */}
                    <div className="pf-grid-2" style={g2}>
                        <div>
                            <Label>Phone Number</Label>
                            <Input placeholder="10-digit number" value={selfForm.phone} maxLength={10} inputMode="numeric"
                                readOnly
                                onChange={e => setSelfForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} />
                        </div>
                        <div>
                            <Label>Date of Birth</Label>
                            <Input type="date" value={selfForm.dob} onChange={e => setSelfForm(p => ({ ...p, dob: e.target.value }))} />
                        </div>
                    </div>

                    {/* ── HR/Manager: Name + Email editable ── */}
                    {isPrivilegedUser && (
                        <div className="pf-grid-2" style={g2}>
                            <div>
                                <Label>Full Name</Label>
                                <Input
                                    placeholder="Your full name"
                                    value={selfForm.name}
                                    onChange={e => setSelfForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Email Address</Label>
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={selfForm.email}
                                    onChange={e => setSelfForm(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <Label>Father / Guardian Name</Label>
                        <Input
                            placeholder="Enter father or guardian name"
                            value={selfForm.guardianName}
                            onChange={(e) =>
                                setSelfForm(p => ({ ...p, guardianName: e.target.value }))
                            }
                        />
                    </div>

                    {/* ── Blood Group ── */}
                    <div>
                        <Label>Blood Group</Label>
                        <Select
                            value={selfForm.bloodGroup}
                            onChange={e => setSelfForm(p => ({ ...p, bloodGroup: e.target.value }))}
                            touched={!!selfForm.bloodGroup}
                        >
                            <option value="">Select blood group</option>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </Select>
                    </div>

                    {/* ── Emergency Contact ── */}
                    <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", background: T.bg }}>
                        <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 12, color: T.muted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 14px" }}>
                            Emergency Contact
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div className="pf-grid-2" style={g2}>
                                <div>
                                    <Label>Contact Name</Label>
                                    <Input
                                        placeholder="Full name"
                                        value={selfForm.emergencyContactName}
                                        onChange={e => setSelfForm(p => ({ ...p, emergencyContactName: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>Relation</Label>
                                    <Input
                                        placeholder="e.g. Spouse, Parent"
                                        value={selfForm.emergencyContactRelation}
                                        onChange={e => setSelfForm(p => ({ ...p, emergencyContactRelation: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Emergency Phone</Label>
                                <Input
                                    placeholder="10-digit number"
                                    value={selfForm.emergencyContactPhone}
                                    maxLength={10}
                                    inputMode="numeric"
                                    onChange={e => setSelfForm(p => ({ ...p, emergencyContactPhone: e.target.value.replace(/\D/g, "") }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Nationality + Marital Status ── */}
                    <div className="pf-grid-2" style={g2}>
                        <div>
                            <Label>Nationality</Label>
                            <Select
                                value={selfForm.nationality}
                                onChange={e => setSelfForm(p => ({ ...p, nationality: e.target.value }))}
                                touched={!!selfForm.nationality}
                            >
                                {NATIONALITY_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label>Marital Status</Label>
                            <Select
                                value={selfForm.maritalStatus}
                                onChange={e => setSelfForm(p => ({ ...p, maritalStatus: e.target.value }))}
                                touched={!!selfForm.maritalStatus}
                            >
                                {MARITAL_STATUS_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {selfMsg && <Alert {...selfMsg} />}
                    <div>
                        <Btn type="submit" loading={selfLoading}>
                            {selfLoading ? (<><span className="spinner" /> Saving...</>) : (<><LuSave size={14} /> Save Changes
                            </>)}
                        </Btn>
                    </div>
                </form>
            </div>
        ),

        govid: (
            <div style={{ animation: "slideIn .25s ease" }}>
                {/* ── Header ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                    <div>
                        <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 16, color: T.text, margin: "0 0 3px" }}>Government ID & Documents</p>
                        <p style={{ fontFamily: ff, fontSize: 13, color: T.textSub, margin: 0 }}>Enter your numbers and upload supporting documents</p>
                    </div>
                    <StatusPill done={govIdDone} />
                </div>

                {govIdFetching
                    ? <StopwatchLoader />
                    : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                            {/* ── PAN number ── */}
                            <div>
                                <Label>PAN Number</Label>
                                <Input
                                    name="pan"
                                    placeholder="ABCDE1234F"
                                    value={govIds.pan}
                                    error={govIdErrors.pan}
                                    onChange={e => setGovIds(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
                                />
                                <FieldError error={govIdErrors.pan} touched={true} />
                            </div>

                            {/* ── Aadhaar number ── */}
                            <div>
                                <Label>Aadhaar Number</Label>
                                <Input
                                    name="aadhaar"
                                    placeholder="12-digit number"
                                    value={govIds.aadhaar}
                                    error={govIdErrors.aadhaar}
                                    onChange={e => setGovIds(p => ({ ...p, aadhaar: e.target.value }))}
                                />
                                <FieldError error={govIdErrors.aadhaar} touched={true} />
                            </div>

                            {govIdMsg && <Alert {...govIdMsg} />}
                            <div>
                                <Btn onClick={handleGovSave} loading={govIdLoading}>
                                    {govIdDone
                                        ? <><LuRefreshCw size={13} /> Update ID</>
                                        : <><LuSave size={13} /> Save Government ID</>}
                                </Btn>
                            </div>

                            {/* ══════════════════════════════
                        DOCUMENT UPLOADS
                    ══════════════════════════════ */}
                            <div style={{ borderTop: `1.5px dashed ${T.border}`, paddingTop: 20, marginTop: 4 }}>
                                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.text, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
                                    <LuFolder size={14} color={T.accent} /> Supporting Documents
                                </p>

                                {docsFetching
                                    ? <StopwatchLoader />
                                    : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                                            {/* ── Aadhaar doc ── */}
                                            {[
                                                { key: "aadhaar", label: "Aadhaar Card" },
                                                { key: "pan", label: "PAN Card" },
                                                { key: "passbook", label: "Bank Passbook" },
                                            ].map(({ key, label }) => {
                                                const d = docs?.[key];
                                                const isVerified = d?.verified;
                                                const hasFile = !!d?.url;
                                                return (
                                                    <div key={key} style={{
                                                        border: `1.5px solid ${isVerified ? "#a7f3d0" : hasFile ? T.border : T.border}`,
                                                        borderRadius: 12, padding: "14px 16px",
                                                        background: isVerified ? T.successLight : T.bg,
                                                    }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                                            <div>
                                                                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.text, margin: "0 0 3px" }}>{label}</p>
                                                                {hasFile && (
                                                                    <p style={{ fontFamily: ff, fontSize: 11.5, color: T.muted, margin: 0 }}>
                                                                        📎 {d.originalName}
                                                                        {" · "}
                                                                        {new Date(d.uploadedAt).toLocaleDateString("en-IN")}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                                {isVerified
                                                                    ? <Pill color={T.success} bg={T.successLight}>✓ Verified</Pill>
                                                                    : hasFile
                                                                        ? <Pill color={T.warn} bg={T.warnLight}>⏳ Under Process</Pill>
                                                                        : null}

                                                                <input
                                                                    ref={docFileRefs[key]}
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    style={{ display: "none" }}
                                                                    onChange={e => {
                                                                        const f = e.target.files?.[0];
                                                                        if (f) handleDocUpload(f, key);
                                                                        e.target.value = "";
                                                                    }}
                                                                />
                                                                <Btn
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    loading={docUploading[key]}
                                                                    onClick={() => docFileRefs[key].current?.click()}
                                                                >
                                                                    <LuUpload size={12} />
                                                                    {hasFile ? "Re-upload" : "Upload"}
                                                                </Btn>

                                                                {hasFile && (
                                                                    <a
                                                                        href={toUrl(d.url)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        style={{ fontSize: 12, color: T.accent, fontWeight: 600, fontFamily: ff, textDecoration: "none" }}
                                                                    >
                                                                        View
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* ── Other docs ── */}
                                            {(docs?.others || []).map((od, idx) => (
                                                <div key={od._id || idx} style={{
                                                    border: `1.5px solid ${od.verified ? "#a7f3d0" : T.border}`,
                                                    borderRadius: 12, padding: "14px 16px",
                                                    background: od.verified ? T.successLight : T.bg,
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                                        <div>
                                                            <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T.text, margin: "0 0 3px" }}>{od.label}</p>
                                                            <p style={{ fontFamily: ff, fontSize: 11.5, color: T.muted, margin: 0 }}>📎 {od.originalName}</p>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            {od.verified
                                                                ? <Pill color={T.success} bg={T.successLight}>✓ Verified</Pill>
                                                                : <Pill color={T.warn} bg={T.warnLight}>⏳ Under Process</Pill>}
                                                            <a
                                                                href={toUrl(od.url)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                style={{ fontSize: 12, color: T.accent, fontWeight: 600, fontFamily: ff, textDecoration: "none" }}
                                                            >
                                                                View
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* ── Add Other document ── */}

                                            <div>
                                                <input
                                                    ref={otherRef}
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    style={{ display: "none" }}
                                                    onChange={async e => {
                                                        const f = e.target.files?.[0];
                                                        if (f) {
                                                            const { value: lbl, isConfirmed } = await Swal.fire({
                                                                title: "Document Label",
                                                                input: "text",
                                                                inputLabel: "Enter a label for this document",
                                                                inputPlaceholder: "e.g. NOC Certificate",
                                                                inputValue: "Other Document",
                                                                showCancelButton: true,
                                                                confirmButtonText: "Upload",
                                                                cancelButtonText: "Cancel",
                                                                confirmButtonColor: "#6c63ff",
                                                                cancelButtonColor: "#6b7280",
                                                                inputValidator: (value) => {
                                                                    if (!value?.trim()) return "Please enter a label";
                                                                },
                                                            });
                                                            if (isConfirmed) {
                                                                handleDocUpload(f, "other", lbl || "Other Document");
                                                            }
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                />
                                                <Btn
                                                    size="sm"
                                                    variant="ghost"
                                                    loading={docUploading["other"]}
                                                    onClick={() => otherRef.current?.click()}
                                                    style={{ width: "100%", justifyContent: "center", borderStyle: "dashed", border: `1.5px dashed ${T.border}` }}
                                                >
                                                    <LuUpload size={12} /> + Add Other Document
                                                </Btn>
                                            </div>


                                            {docMsg && <Alert {...docMsg} />}
                                        </div>
                                    )}
                            </div>
                        </div >
                    )
                }
            </div >
        ),

        /* ── BANK ── */
        bank: (
            <div style={{ animation: "slideIn .25s ease" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                    <div>
                        <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 16, color: T.text, margin: "0 0 3px" }}>Bank Details</p>
                        <p style={{ fontFamily: ff, fontSize: 13, color: T.textSub, margin: 0 }}>Required for payroll processing</p>
                    </div>
                    <StatusPill done={bankDone} />
                </div>

                {bankFetching
                    ? <StopwatchLoader />
                    : (
                        <div
                            style={{ display: "flex", flexDirection: "column", gap: 16 }}
                            onSubmit={e => e.preventDefault()}
                        >
                            {/* Hidden honeypot fields to trick browser autocomplete away from real fields */}
                            <input type="text" name="username" style={{ display: "none" }} autoComplete="username" readOnly />
                            <input type="password" name="password" style={{ display: "none" }} autoComplete="current-password" readOnly />
                            <div>
                                {bank.accountHolderName && !isNameMatching() && (
                                    <span style={{
                                        color: "#d97706",
                                        fontSize: 12,
                                        fontWeight: 600
                                    }}>
                                        ⚠ Account holder name does not match your profile name
                                    </span>
                                )}
                                <Label required>Account Holder Name</Label>
                                <Input name="accountHolderName" placeholder="As per bank records"
                                    value={bank.accountHolderName} error={bankErrors.accountHolderName} touched={bankTouched.accountHolderName}
                                    onChange={handleBankChange}
                                    autoComplete="off" />
                                <FieldError error={bankErrors.accountHolderName} touched={bankTouched.accountHolderName} />
                            </div>

                            <div className="pf-grid-2" style={g2}>
                                <div>
                                    <Label required>Account Number</Label>
                                    <Input name="accountNumber" placeholder="9–18 digits"
                                        value={bank.accountNumber} error={bankErrors.accountNumber} touched={bankTouched.accountNumber}
                                        onChange={handleBankChange}
                                        autoComplete="off"
                                        data-form-type="other"
                                        style={{ fontFamily: "monospace", letterSpacing: "1px" }} />
                                    <FieldError error={bankErrors.accountNumber} touched={bankTouched.accountNumber} />
                                </div>
                                <div>
                                    <Label>Account Type</Label>
                                    <Select name="accountType" value={bank.accountType} onChange={handleBankChange}>
                                        {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label required>Confirm Account Number</Label>
                                <Input
                                    name="confirmAccountNumber"
                                    type="text"
                                    placeholder="Re-enter account number to confirm"
                                    value={bank.confirmAccountNumber}
                                    error={bankErrors.confirmAccountNumber}
                                    touched={bankTouched.confirmAccountNumber}
                                    onChange={handleBankChange}
                                    onPaste={e => e.preventDefault()}
                                    autoComplete="off"
                                    data-form-type="other"
                                    inputMode="numeric"
                                    style={{ fontFamily: "monospace", letterSpacing: "1px" }}
                                />
                                <FieldError error={bankErrors.confirmAccountNumber} touched={bankTouched.confirmAccountNumber} />
                                {bankTouched.confirmAccountNumber && !bankErrors.confirmAccountNumber && bank.confirmAccountNumber && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.success, marginTop: 5, fontFamily: ff }}>
                                        <LuCheck size={11} /> Account numbers match ✓
                                    </span>
                                )}
                            </div>

                            <div className="pf-grid-2" style={g2}>
                                <div>
                                    <Label required>IFSC Code</Label>
                                    <Input name="ifscCode" placeholder="SBIN0001234"
                                        value={bank.ifscCode} error={bankErrors.ifscCode} touched={bankTouched.ifscCode}
                                        style={{ fontFamily: "monospace", letterSpacing: "1.5px" }}
                                        onChange={handleIFSCChange} onBlur={handleIFSCBlur} />
                                    <FieldError error={bankErrors.ifscCode} touched={bankTouched.ifscCode} />
                                </div>
                                <div>
                                    <Label>
                                        Bank Name{" "}
                                        {ifscLooking && <span style={{ fontSize: 10, color: "#2563eb", fontStyle: "italic" }}>looking up…</span>}
                                    </Label>
                                    <Input name="bankName" placeholder="Auto-filled from IFSC" value={bank.bankName}
                                        onChange={handleBankChange}
                                        style={{ background: bank.bankName ? T.successLight : T.surface, color: bank.bankName ? T.success : T.text }} />
                                </div>
                            </div>

                            <div>
                                <Label>Branch Name</Label>
                                <Input name="branchName" placeholder="Auto-filled from IFSC" value={bank.branchName}
                                    onChange={handleBankChange}
                                    style={{ background: bank.branchName ? T.successLight : T.surface, color: bank.branchName ? T.success : T.text }} />
                            </div>

                            {bankVerification && (
                                <div style={{ background: T.successLight, border: "1px solid #6ee7b7", borderRadius: 10, padding: "12px 14px", fontFamily: ff }}>
                                    <p style={{ fontWeight: 700, color: "#166534", margin: "0 0 8px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                                        <LuCheck size={14} /> IFSC Verified
                                    </p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12.5, color: "#15803d" }}>
                                        <span>🏦 {bankVerification.bank}</span>
                                        <span>🏢 {bankVerification.branch}</span>
                                        <span>📍 {bankVerification.city}, {bankVerification.state}</span>
                                        <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                            {bankVerification.rtgs && <span style={{ background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>RTGS</span>}
                                            {bankVerification.neft && <span style={{ background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>NEFT</span>}
                                            {bankVerification.imps && <span style={{ background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>IMPS</span>}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {bankMsg && <Alert {...bankMsg} />}
                            <div>
                                <Btn onClick={handleBankSave} loading={bankLoading}>
                                    {bankLoading
                                        ? <StopwatchLoader />
                                        : bankDone
                                            ? <><LuRefreshCw size={13} /> Update Bank Details</>
                                            : <><LuSave size={13} /> Save Bank Details</>}
                                </Btn>
                            </div>
                        </div>
                    )}
            </div>
        ),

        /* ── SECURITY ── */
        security: (
            <div style={{ animation: "slideIn .25s ease" }}>
                <div style={{ marginBottom: 22 }}>
                    <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 16, color: T.text, margin: "0 0 4px" }}>Change Password</p>
                    <p style={{ fontFamily: ff, fontSize: 13, color: T.textSub, margin: 0 }}>Use a strong password you don't use elsewhere</p>
                </div>

                <form onSubmit={handlePwChange} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                        <Label>Current Password</Label>
                        <Input type={showPw ? "text" : "password"} placeholder="Enter current password"
                            value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
                    </div>
                    <div className="pf-grid-2" style={g2}>
                        <div>
                            <Label>New Password</Label>
                            <Input type={showPw ? "text" : "password"} placeholder="Min 6 characters"
                                value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required />
                        </div>
                        <div>
                            <Label>Confirm Password</Label>
                            <Input type={showPw ? "text" : "password"} placeholder="Repeat new password"
                                value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                        </div>
                    </div>

                    {pwForm.newPassword && (() => {
                        const s = getStrength(pwForm.newPassword);
                        const clrs = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
                        const lbls = ["", "Weak", "Fair", "Good", "Strong"];
                        const clr = clrs[s - 1] || T.border;
                        return (
                            <div>
                                <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= s ? clr : T.border, transition: "background .3s" }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: 11.5, color: T.textSub, fontWeight: 600, fontFamily: ff }}>{lbls[s] || "Too short"} password</span>
                            </div>
                        );
                    })()}

                    {pwForm.confirmPassword && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: ff, color: pwForm.newPassword === pwForm.confirmPassword ? T.success : T.error, display: "flex", alignItems: "center", gap: 5 }}>
                            {pwForm.newPassword === pwForm.confirmPassword
                                ? <><LuCheck size={13} /> Passwords match</>
                                : <><LuX size={13} /> Passwords don't match</>}
                        </span>
                    )}

                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: T.textSub, cursor: "pointer", userSelect: "none", fontFamily: ff }}>
                        <input type="checkbox" checked={showPw} onChange={() => setShowPw(p => !p)} style={{ width: 14, height: 14, accentColor: T.accent }} />
                        {showPw ? <LuEyeOff size={14} /> : <LuEye size={14} />}
                        Show passwords
                    </label>

                    {pwMsg && <Alert {...pwMsg} />}
                    <div>
                        <Btn type="submit" loading={pwLoading}>
                            <LuKeyRound size={14} /> {pwLoading ? "Updating…" : "Change Password"}
                        </Btn>
                    </div>
                </form>
            </div>
        ),
        /* ── ID CARD ── */
        idcard: (
            <EmployeeIDCard user={user} logoImg={logoImg} BASE_URL={BASE_URL} />
        ),
        /* ── SESSIONS ── */
        sessions: (
            <div style={{ animation: "slideIn .25s ease" }}>
                <div style={{ marginBottom: 22 }}>
                    <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 16, color: T.text, margin: "0 0 4px" }}>
                        Active Sessions
                    </p>
                    <p style={{ fontFamily: ff, fontSize: 13, color: T.textSub, margin: 0 }}>
                        Devices and browsers currently signed in to your account
                    </p>
                </div>
                <ActiveSessions />
            </div>
        ),
    };

    /* ════════════════════════════════════════
       RENDER
    ════════════════════════════════════════ */
    return (
        <DashboardLayout profileComplete={profileComplete}>
            <style>
                {`
                ${css}
                
                /* ── Spinner ── */
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

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 48px", fontFamily: ff }}>

                {/* ══ HERO ══ */}
                <div style={{
                    borderRadius: 20, overflow: "hidden", marginBottom: 24,
                    background: T.surface, border: `1px solid ${T.border}`,
                    boxShadow: "0 4px 20px rgba(0,0,0,.07)",
                }}>
                    <div style={{
                        height: 88,
                        background: "linear-gradient(135deg,#6c63ff 0%,#9b89ff 55%,#c4b5fd 100%)",
                        position: "relative",
                    }}>
                        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%,rgba(255,255,255,.18) 0%,transparent 60%)" }} />
                    </div>

                    <div style={{ padding: "0 20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: -40, flexWrap: "wrap" }}>

                            <div style={{ position: "relative", flexShrink: 0 }}>
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="avatar" style={{ width: 78, height: 78, borderRadius: "50%", objectFit: "cover", border: "3px solid #fff", boxShadow: "0 4px 14px rgba(0,0,0,.14)", display: "block" }} />
                                    : <div style={{ width: 78, height: 78, borderRadius: "50%", background: `linear-gradient(135deg,${T.accent},#9b89ff)`, border: "3px solid #fff", boxShadow: "0 4px 14px rgba(0,0,0,.14)", display: "grid", placeItems: "center", color: "#fff", fontSize: 24, fontWeight: 800, fontFamily: ff }}>{initials}</div>}
                                <div style={{ position: "absolute", bottom: 4, right: 4, width: 13, height: 13, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }} />
                            </div>

                            <div className="pf-hero-meta" style={{ flex: 1, minWidth: 0, paddingTop: 44 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 18, color: T.text, margin: 0 }}>{user?.name}</p>
                                    <span style={{ background: T.accentLight, color: roleColor, fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 99, border: `1px solid ${roleColor}33`, fontFamily: ff, flexShrink: 0 }}>
                                        {user?.role}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
                                    {user?.employeeId && <span style={{ fontSize: 12, color: T.textSub, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><LuBadge size={12} /> {user.employeeId}</span>}
                                    {user?.designation && <span style={{ fontSize: 12, color: T.textSub, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><LuBriefcase size={12} /> {user.designation}</span>}
                                    {user?.email && <span style={{ fontSize: 12, color: T.textSub, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><LuMail size={12} /> {user.email}</span>}
                                </div>
                            </div>

                            <div className="pf-hero-ring" style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 44, flexShrink: 0 }}>
                                {/* completion ring */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ position: "relative", width: 56, height: 56 }}>
                                        <ProgressRing pct={completionPct} size={56} />
                                        <div style={{
                                            position: "absolute", inset: 0, display: "grid", placeItems: "center",
                                            fontFamily: ff, fontWeight: 800, fontSize: 12, color: T.accent
                                        }}>
                                            {completionPct}%
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 12, color: T.text }}>Profile</div>
                                        <div style={{ fontFamily: ff, fontSize: 11, fontWeight: 600, color: completionPct === 100 ? T.success : T.warn }}>
                                            {completionPct === 100 ? "Complete ✓" : `${doneItems}/${totalItems} done`}
                                        </div>
                                    </div>
                                </div>

                                {/* QR code — scannable by HR */}
                                {user?.employeeId && (
                                    <div style={{
                                        background: "#fff", padding: 6, borderRadius: 10,
                                        border: `1.5px solid ${T.border}`,
                                        boxShadow: "0 2px 8px rgba(0,0,0,.07)",
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 3
                                    }}>
                                        <QRCodeSVG
                                            value={`${QR_CODE_URL}/employee/${user.employeeId}`}
                                            size={52}
                                            fgColor={T.accent}
                                            bgColor="#ffffff"
                                            level="M"
                                            includeMargin={false}
                                        />
                                        <span style={{
                                            fontSize: 8, color: T.muted, fontWeight: 700,
                                            letterSpacing: ".06em", fontFamily: ff
                                        }}>
                                            {user.employeeId}
                                        </span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* ══ TABS + PANEL ══ */}
                <div>
                    <div
                        className="tab-bar-scroll"
                        style={{
                            background: T.surface,
                            borderRadius: "16px 16px 0 0",
                            border: `1px solid ${T.border}`,
                            borderBottom: "none",
                            display: "flex",
                            overflowX: "auto",
                            boxShadow: "0 2px 10px rgba(0,0,0,.05)",
                            position: "relative",
                        }}
                    >
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: T.border }} />

                        {TABS.map(({ id, label, Icon: TabIcon }) => {
                            const isActive = tab === id;
                            const needsAttention = (id === "govid" && !govIdDone) || (id === "bank" && !bankDone)
                                || (id === "personal" && (!completionItems.maritalStatus || !completionItems.nationality));
                            return (
                                <button
                                    key={id}
                                    className="pf-tab-item"
                                    onClick={() => setTab(id)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "13px 16px",
                                        border: "none",
                                        borderBottom: `2.5px solid ${isActive ? T.accent : "transparent"}`,
                                        borderRadius: 0, cursor: "pointer",
                                        fontFamily: ff, background: "transparent",
                                        color: isActive ? T.accent : T.textSub,
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: 13, whiteSpace: "nowrap", flexShrink: 0,
                                        position: "relative", zIndex: 1, marginBottom: "-1px",
                                    }}
                                >
                                    <TabIcon size={14} />
                                    <span>{label}</span>
                                    {needsAttention && !isActive && (
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.warn, flexShrink: 0 }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        className="pf-panel"
                        style={{
                            background: T.surface,
                            borderRadius: "0 0 16px 16px",
                            border: `1px solid ${T.border}`,
                            borderTop: "none",
                            padding: "24px 22px",
                            boxShadow: "0 2px 12px rgba(0,0,0,.05)",
                            minHeight: 320,
                        }}
                    >
                        {panels[tab]}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}