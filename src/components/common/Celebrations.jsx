import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API, { BASE_URL } from "../../services/api";
import {
    FaBirthdayCake,
    FaEnvelope,
    FaTrash,
    FaEdit,
    FaPlus,
    FaTimes,
    FaCalendarAlt,
    FaBuilding,
    FaCheck,
    FaSpinner,
    FaEye,
    FaChevronLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// ─────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────

const DaysBadge = ({ days }) => {
    if (days === 0) return (
        <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>Today</span>
    );
    if (days <= 7) return (
        <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>{days}d</span>
    );
    return (
        <span style={{ background: "#ede9fe", color: "#5b21b6", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>{days}d</span>
    );
};

const StatusBadge = ({ status }) => {
    const map = {
        pending: { bg: "#fef3c7", color: "#92400e" },
        sent: { bg: "#d1fae5", color: "#065f46" },
        failed: { bg: "#fee2e2", color: "#991b1b" },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{ background: s.bg, color: s.color, fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", textTransform: "capitalize" }}>{status}</span>
    );
};

const Avatar = ({ name, type }) => {
    const initials = name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
    const style = type === "birthday"
        ? { background: "#ede9fe", color: "#5b21b6" }
        : { background: "#d1fae5", color: "#065f46" };
    return (
        <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0, ...style }}>
            {initials}
        </div>
    );
};


// ─────────────────────────────────────────────
// UPCOMING ROW
// ─────────────────────────────────────────────

const UpcomingRow = ({ event, onEdit, onSchedule }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #f3f4f6" }}>
        <Avatar name={event.employeeName} type={event.eventType} />
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {event.employeeName}
            </p>
            <p style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>
                {event.eventType === "birthday"
                    ? "🎂 Birthday"
                    : `🏢 ${event.anniversaryYear ? `${event.anniversaryYear}-Year ` : ""}Work Anniversary`
                }
            </p>
        </div>
        <DaysBadge days={event.daysLeft} />
        <button
            onClick={() => onSchedule(event)}
            title="Schedule celebration"
            style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", background: "#d1fae5", color: "#065f46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}
        >
            <FaCalendarAlt />
        </button>
    </div>
);


// ─────────────────────────────────────────────
// SCHEDULED ROW
// ─────────────────────────────────────────────

const ScheduledRow = ({ item, onDelete, onEdit }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #f3f4f6" }}>
        <Avatar name={item.employeeId?.name} type={item.eventType} />
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.employeeId?.name || "—"}
            </p>
            <p style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>
                {item.templateId?.templateName || "No template"}
            </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <StatusBadge status={item.status} />
            <span style={{ fontSize: 11, color: "#374151" }}>
                {new Date(item.scheduledAt).toLocaleDateString("en-IN")}
            </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onEdit(item)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", background: "#ede9fe", color: "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                <FaEdit />
            </button>
            <button onClick={() => onDelete(item._id)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                <FaTrash />
            </button>
        </div>
    </div>
);

const EmptyState = ({ message }) => (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
        <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>🎉</div>
        <p style={{ fontSize: 14, color: "#374151" }}>{message}</p>
    </div>
);


// ─────────────────────────────────────────────
// EMAIL PREVIEW  (mirrors the Gmail screenshot)
// ─────────────────────────────────────────────

const EMAIL_THEMES = {
    dark_purple: {
        bannerBg: "linear-gradient(155deg,#0f0b2e 0%,#1e1260 55%,#0f0b2e 100%)",
        logoBg: "rgba(255,255,255,0.12)",
        logoColor: "#e0d9ff",
        avatarBg: "rgba(255,255,255,0.18)",
        avatarColor: "#fff",
        headingColor: "#ffffff",
        accentColor: "#a78bfa",
        bodyBg: "#ffffff",
    },
    corporate_blue: {
        bannerBg: "linear-gradient(155deg,#0c2d6b 0%,#1d5fcc 55%,#0c2d6b 100%)",
        logoBg: "rgba(255,255,255,0.12)",
        logoColor: "#bfdbfe",
        avatarBg: "rgba(255,255,255,0.2)",
        avatarColor: "#fff",
        headingColor: "#ffffff",
        accentColor: "#60a5fa",
        bodyBg: "#ffffff",
    },
    warm_gold: {
        bannerBg: "linear-gradient(155deg,#78350f 0%,#b45309 55%,#78350f 100%)",
        logoBg: "rgba(255,255,255,0.15)",
        logoColor: "#fde68a",
        avatarBg: "rgba(255,255,255,0.2)",
        avatarColor: "#fff",
        headingColor: "#fef3c7",
        accentColor: "#fbbf24",
        bodyBg: "#ffffff",
    },
    light_minimal: {
        bannerBg: "linear-gradient(155deg,#f5f3ff 0%,#ede9fe 55%,#f5f3ff 100%)",
        logoBg: "#ede9fe",
        logoColor: "#5b21b6",
        avatarBg: "#ddd6fe",
        avatarColor: "#4c1d95",
        headingColor: "#3b0764",
        accentColor: "#7c3aed",
        bodyBg: "#ffffff",
    },
};

const TEMPLATE_DEFS = [
    { id: "dark_purple", name: "Royal Night", types: ["birthday", "anniversary"], thumb: "dark_purple" },
    { id: "corporate_blue", name: "Corporate Blue", types: ["birthday", "anniversary", "custom"], thumb: "corporate_blue" },
    { id: "warm_gold", name: "Warm Gold", types: ["birthday", "custom"], thumb: "warm_gold" },
    { id: "light_minimal", name: "Light Minimal", types: ["birthday", "anniversary", "custom"], thumb: "light_minimal" },
];

const ThumbPreview = ({ themeId }) => {
    const t = EMAIL_THEMES[themeId];
    return (
        <div style={{ height: 80, background: t.bannerBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: t.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: t.avatarColor, fontWeight: 700 }}>AB</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: t.headingColor, letterSpacing: "-0.01em" }}>HAPPY BIRTHDAY</div>
            <div style={{ width: 36, height: 2, background: t.accentColor, borderRadius: 2 }} />
        </div>
    );
};

const EmailPreview = ({
    template,
    employeeName,
    employeeEmail,
    designation,
    companyName,
    eventType,
    customMessage,
    profileImage,
}) => {
    const t = EMAIL_THEMES[template?.id] || EMAIL_THEMES.dark_purple;
    const initials = employeeName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "DP";
    const heading = eventType === "birthday" ? "HAPPY BIRTHDAY" : eventType === "anniversary" ? "HAPPY ANNIVERSARY" : "CONGRATULATIONS";

    const subHeading = eventType === "birthday" ? "Wishing you a great birthday\nand a memorable year." : eventType === "anniversary" ? "Thank you for your dedication\nand continued excellence." : "You deserve this recognition!";

    const bodyMsg = customMessage || `On behalf of ${companyName || "our company"}, we wish you a day filled with happiness, laughter, and all the success you deserve. May this year bring you countless opportunities, new achievements, and endless moments of joy. ☀️`;

    return (
        <div style={{ background: "#f3f4f6", padding: "14px", borderRadius: "0 0 12px 12px" }}>
            {/* Email meta row */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "8px 12px",
                    marginBottom: 10,
                    border: "1px solid #e5e7eb"
                }}
            >
                <p style={{ fontSize: 11, color: "#374151" }}>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                        To:
                    </span>{" "}

                    <span style={{ color: "#5b21b6" }}>
                        info@worldweblogic.com,
                    </span>
                </p>
                <p style={{ fontSize: 11, color: "#374151" }}>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                        From:
                    </span>{" "}

                    <span style={{ color: "#5b21b6" }}>
                        {employeeEmail || "employee@company.com"}
                    </span>
                </p>

                <p
                    style={{
                        fontSize: 11,
                        color: "#374151",
                        marginTop: 2
                    }}
                >
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                        Subject:
                    </span>{" "}

                    🎉 {heading.charAt(0) + heading.slice(1).toLowerCase()},{" "}
                    {employeeName || "Employee Name"}!
                </p>
            </div>

            {/* Email card */}
            <div style={{ maxWidth: 340, margin: "0 auto", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>

                {/* Banner */}
                <div style={{ background: t.bannerBg, padding: "20px 16px", textAlign: "center" }}>
                    {/* Company logo area */}
                    <div style={{ display: "inline-block", background: t.logoBg, borderRadius: 6, padding: "3px 10px", marginBottom: 12 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: t.logoColor, textTransform: "uppercase" }}>
                            {companyName || "WORLD WEBLOGIC"} HR
                        </span>
                    </div>

                    {/* Big heading */}
                    <div style={{ fontSize: 26, fontWeight: 900, color: t.headingColor, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>
                        {heading.split(" ").map((word, i) => (
                            <div key={i}>{word}</div>
                        ))}
                    </div>

                    {/* Accent line */}
                    <div style={{ width: 40, height: 3, background: t.accentColor, borderRadius: 3, margin: "8px auto 14px" }} />

                    {/* Sub text */}
                    <p style={{ fontSize: 11, color: t.headingColor, opacity: 0.8, lineHeight: 1.5, marginBottom: 14, whiteSpace: "pre-line" }}>
                        {subHeading}
                    </p>

                    {/* Avatar / Uploaded Image */}
                    <div
                        style={{
                            width: 74,
                            height: 74,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: t.avatarBg,
                            border: `3px solid ${t.accentColor}`,
                            margin: "0 auto 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt={employeeName}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <span
                                style={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: t.avatarColor,
                                }}
                            >
                                {initials}
                            </span>
                        )}
                    </div>

                    {/* Name & designation */}
                    <p style={{ fontSize: 14, fontWeight: 800, color: t.headingColor, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
                        {employeeName || "Employee Name"}
                    </p>
                    <p style={{ fontSize: 10, color: t.accentColor, letterSpacing: "0.06em" }}>
                        {designation || "Designation"}
                    </p>

                    {/* Website */}
                    <p style={{ fontSize: 9, color: t.logoColor, marginTop: 12, opacity: 0.6 }}>www.worldweblogic.com</p>
                </div>

                {/* Body */}
                <div style={{ background: t.bodyBg, padding: "14px 16px", borderTop: `3px solid ${t.accentColor}` }}>
                    <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.65 }}>
                        {bodyMsg}
                    </p>
                    <p style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>
                        Enjoy your special day to the fullest — you deserve nothing but the best! 🥳✨
                    </p>
                </div>

                {/* Signature */}
                <div style={{ background: "#f9fafb", padding: "10px 16px", borderTop: "1px solid #f3f4f6" }}>
                    <p style={{ fontSize: 10, color: "#6b7280", fontStyle: "italic", marginBottom: 4 }}>Thanks & Regards</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>HR Department</p>
                    <p style={{ fontSize: 10, color: "#374151" }}>{companyName || "World WebLogic Pvt. Ltd."}</p>
                    <p style={{ fontSize: 10, color: "#374151" }}>SOFTWARE | DESIGN | MARKETING</p>
                </div>

            </div>
        </div>
    );
};


// ─────────────────────────────────────────────
// TEMPLATE SELECTOR CARD
// ─────────────────────────────────────────────

const TemplateCard = ({ def, isSelected, onSelect, onPreview }) => (
    <div
        onClick={() => onSelect(def)}
        style={{
            border: isSelected ? "2px solid #5b4cf5" : "1.5px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            cursor: "pointer",
            position: "relative",
            transition: "border-color 0.15s, transform 0.1s, box-shadow 0.15s",
            boxShadow: isSelected ? "0 0 0 3px rgba(91,76,245,0.15)" : "none",
            transform: isSelected ? "translateY(-1px)" : "none",
        }}
    >
        {/* Thumbnail */}
        <ThumbPreview themeId={def.thumb} />

        {/* Selected check */}
        {isSelected && (
            <div style={{
                position: "absolute", top: 6, right: 6,
                width: 20, height: 20, borderRadius: "50%",
                background: "#5b4cf5", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}>
                <FaCheck />
            </div>
        )}

        {/* Meta */}
        <div style={{ padding: "8px 10px", background: "#fff", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{def.name}</p>
                <p style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>
                    {def.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" · ")}
                </p>
            </div>
            <button
                onClick={e => { e.stopPropagation(); onPreview(def); }}
                title="Preview email"
                style={{
                    background: "#ede9fe", color: "#5b21b6",
                    border: "none", borderRadius: 6,
                    padding: "4px 8px", fontSize: 10, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    whiteSpace: "nowrap",
                }}
            >
                <FaEye style={{ fontSize: 9 }} /> Preview
            </button>
        </div>
    </div>
);


// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────

const CelebrationModal = ({ isOpen, onClose, onSave, editData, users, templates, saving }) => {

    const [form, setForm] = useState({
        employeeId: "",
        templateId: "",
        templateStyle: "",
        eventType: "birthday",
        sendToEmployee: true,
        sendToOthers: false,
        recipients: [],
        customMessage: "",
        scheduledAt: "",
    });

    // Which template object is selected
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    // Which template is being previewed (can differ from selected while browsing)
    const [previewTemplate, setPreviewTemplate] = useState(null);
    // Show preview panel
    const [showPreview, setShowPreview] = useState(false);
    const [uploadedImage, setUploadedImage] = useState("");

    useEffect(() => {
        if (editData) {
            setForm({
                employeeId: editData.employeeId?._id || editData.employeeId || "",
                templateId: editData.templateId?._id || editData.templateId || "",
                templateStyle: editData.templateStyle || "",
                eventType: editData.eventType || "birthday",
                sendToEmployee: editData.sendToEmployee ?? true,
                sendToOthers: editData.sendToOthers ?? false,
                recipients: editData.recipients?.map(r => r._id || r) ||
                    (editData.employeeId ? [editData.employeeId?._id || editData.employeeId] : []),
                customMessage: editData.customMessage || "",
                scheduledAt: editData.scheduledAt ? new Date(editData.scheduledAt).toISOString().slice(0, 16) : "",
            });

            // If editData has a templateId, try to match a local theme card
            const matched = TEMPLATE_DEFS.find(d => d.id === (editData.templateId?._id || editData.templateId));
            setSelectedTemplate(matched || null);
        } else {
            setForm({ employeeId: "", templateId: "", eventType: "birthday", sendToEmployee: true, sendToOthers: false, recipients: [], customMessage: "", scheduledAt: "" });
            setSelectedTemplate(null);
        }
        setShowPreview(false);
        setPreviewTemplate(null);
    }, [editData, isOpen]);

    if (!isOpen) return null;

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const selectedUser = users.find(u => u._id === form.employeeId);

    // When a template card is selected
    const handleSelectTemplate = (def) => {
        setSelectedTemplate(def);
        const matched = templates.find(t =>
            t.templateName?.toLowerCase().includes(def.name.toLowerCase())
        );
        set("templateId", matched?._id || "");
        set("templateStyle", def.id);   // ← ADD THIS — e.g. "warm_gold"
    };

    const handlePreview = (def) => {
        setPreviewTemplate(def);
        setShowPreview(true);
    };

    const inputStyle = {
        width: "100%", padding: "9px 12px",
        border: "1px solid #d1d5db", borderRadius: 10,
        fontSize: 14, color: "#111827", background: "#fff", outline: "none",
        fontFamily: "inherit",
    };

    const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 6 };

    // Determine which template to show in preview panel
    const activePreview = previewTemplate || selectedTemplate;

    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
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
            <div style={{
                background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb",
                width: "100%", maxWidth: showPreview ? 880 : 520,
                maxHeight: "93vh", overflowY: "auto",
                display: "flex", flexDirection: showPreview ? "row" : "column",
                transition: "max-width 0.25s ease",
            }}
                onClick={e => e.stopPropagation()}
            >

                {/* ── LEFT / MAIN FORM ─────────────────────── */}
                <div style={{ flex: 1, padding: 28, minWidth: 0 }}>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                            {editData ? "✏️ Edit Celebration" : "🎉 Create Celebration"}
                        </h2>
                        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
                            <FaTimes />
                        </button>
                    </div>

                    {/* Employee */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Employee *</label>
                        <select style={inputStyle} value={form.employeeId} onChange={e => set("employeeId", e.target.value)}>
                            <option value="">Select employee...</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name} — {u.designation || u.role}</option>)}
                        </select>
                    </div>

                    {/* Event Type */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Event Type *</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {["birthday", "anniversary", "custom"].map(type => (
                                <button
                                    key={type}
                                    onClick={() => set("eventType", type)}
                                    style={{
                                        flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer",
                                        border: form.eventType === type ? "2px solid #5b4cf5" : "1px solid #e5e7eb",
                                        background: form.eventType === type ? "#ede9fe" : "#f9fafb",
                                        color: form.eventType === type ? "#5b21b6" : "#374151",
                                        fontWeight: form.eventType === type ? 700 : 500,
                                        fontSize: 13, transition: "all 0.15s",
                                    }}
                                >
                                    {type === "birthday" ? "🎂" : type === "anniversary" ? "🏢" : "✨"} {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scheduled At */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Scheduled At *</label>
                        <input type="datetime-local" style={inputStyle} value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} />
                    </div>

                    {/* ── TEMPLATE SELECTOR ─────────────── */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Email Template Style</label>
                            {selectedTemplate && (
                                <span style={{ fontSize: 11, color: "#5b21b6", fontWeight: 700, background: "#ede9fe", padding: "2px 8px", borderRadius: 20 }}>
                                    ✓ {selectedTemplate.name}
                                </span>
                            )}
                        </div>

                        {/* Template cards grid — visual style picker */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                            {TEMPLATE_DEFS.map(def => (
                                <TemplateCard
                                    key={def.id}
                                    def={def}
                                    isSelected={selectedTemplate?.id === def.id}
                                    onSelect={handleSelectTemplate}
                                    onPreview={handlePreview}
                                />
                            ))}
                        </div>

                        {/* Saved templates dropdown — only shown when templates exist in DB */}
                        {templates.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 5 }}>
                                    Link to saved template (optional — auto-matched when possible)
                                </p>
                                <select
                                    style={{ ...inputStyle }}
                                    value={form.templateId}
                                    onChange={e => set("templateId", e.target.value)}
                                >
                                    <option value="">— Select saved template —</option>
                                    {templates.map(t => (
                                        <option key={t._id} value={t._id}>{t.templateName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Custom Message */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Custom Message</label>
                        <textarea
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                            placeholder="Add a personal message (optional)..."
                            value={form.customMessage}
                            onChange={e => set("customMessage", e.target.value)}
                        />
                    </div>

                    {/* Upload Employee Image */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Employee Image</label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];

                                if (!file) return;

                                const reader = new FileReader();

                                reader.onloadend = () => {
                                    setUploadedImage(reader.result);
                                };

                                reader.readAsDataURL(file);
                            }}
                            style={{
                                ...inputStyle,
                                padding: "8px",
                                cursor: "pointer",
                            }}
                        />

                        {uploadedImage && (
                            <div
                                style={{
                                    marginTop: 14,
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <img
                                    src={uploadedImage}
                                    alt="Preview"
                                    style={{
                                        width: 90,
                                        height: 90,
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "3px solid #5b4cf5",
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Send To — single recipients list, includes the employee themselves */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Send Email To</label>
                        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                            Select who should receive this celebration email.
                        </p>
                        <div style={{ border: "1px solid #d1d5db", borderRadius: 10, padding: "8px 12px", maxHeight: 160, overflowY: "auto" }}>
                            {users.map(u => (
                                <label key={u._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 14, color: "#111827", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.recipients.includes(u._id)}
                                        onChange={e =>
                                            set("recipients", e.target.checked
                                                ? [...form.recipients, u._id]
                                                : form.recipients.filter(id => id !== u._id)
                                            )
                                        }
                                        style={{ accentColor: "#5b4cf5" }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                                        {u._id === form.employeeId && (
                                            <span style={{ marginLeft: 6, fontSize: 10, background: "#ede9fe", color: "#5b21b6", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>
                                                Employee
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, color: "#6b7280" }}>{u.email}</span>
                                </label>
                            ))}
                        </div>
                        {form.recipients.length > 0 && (
                            <p style={{ fontSize: 11, color: "#5b21b6", marginTop: 6, fontWeight: 600 }}>
                                ✓ {form.recipients.length} recipient{form.recipients.length > 1 ? "s" : ""} selected
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
                        <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                            Cancel
                        </button>
                        <button
                            onClick={() =>
                                onSave(
                                    {
                                        ...form,
                                        uploadedImage,
                                    },
                                    editData?._id
                                )
                            }
                            disabled={saving}
                            style={{
                                padding: "10px 22px", borderRadius: 10, border: "none",
                                background: saving ? "#a5b4fc" : "#5b4cf5",
                                color: "#fff", fontSize: 14, fontWeight: 700,
                                cursor: saving ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", gap: 8,
                            }}
                        >
                            {saving
                                ? <><FaSpinner style={{ animation: "spin 1s linear infinite" }} /> {editData ? "Saving..." : "Scheduling..."}</>
                                : <><FaCheck /> {editData ? "Save Changes" : "Schedule"}</>
                            }
                        </button>
                    </div>
                </div>

                {/* ── RIGHT PANEL — EMAIL PREVIEW ──────────── */}
                {showPreview && (
                    <div style={{
                        width: 340, borderLeft: "1px solid #e5e7eb",
                        display: "flex", flexDirection: "column", flexShrink: 0,
                        background: "#fafafa",
                        borderRadius: "0 18px 18px 0",
                        overflow: "hidden",
                    }}>
                        {/* Preview header */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>📧 Email Preview</p>
                                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{activePreview?.name || "Select a template"}</p>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 11 }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Scrollable preview body */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
                            {activePreview ? (
                                <EmailPreview
                                    template={activePreview}
                                    employeeName={selectedUser?.name || "User"}
                                    employeeEmail={selectedUser?.email}
                                    designation={selectedUser?.designation || "Full Stack Developer"}
                                    companyName="World WebLogic"
                                    eventType={form.eventType}
                                    customMessage={form.customMessage}
                                    profileImage={uploadedImage}
                                />
                            ) : (
                                <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
                                    <div style={{ fontSize: 32, marginBottom: 10 }}>👆</div>
                                    <p style={{ fontSize: 13 }}>Click <strong>Preview</strong> on any template card to see how the email will look</p>
                                </div>
                            )}
                        </div>

                        {/* Use this template button */}
                        {activePreview && activePreview.id !== selectedTemplate?.id && (
                            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "#fff" }}>
                                <button
                                    onClick={() => { handleSelectTemplate(activePreview); }}
                                    style={{
                                        width: "100%", padding: "10px", borderRadius: 10,
                                        border: "none", background: "#5b4cf5",
                                        color: "#fff", fontSize: 13, fontWeight: 700,
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    }}
                                >
                                    <FaCheck /> Use this template
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};


// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────

const StatCard = ({ label, value, icon, bg, color }) => (
    <div style={{ background: bg, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color }}>
            {icon}
        </div>
        <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{value}</p>
            <p style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{label}</p>
        </div>
    </div>
);


// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const Celebrations = () => {

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [scheduledCelebrations, setScheduledCelebrations] = useState([]);
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [upcomingRes, scheduledRes] = await Promise.allSettled([
                API.get("/celebrations/upcoming"),
                API.get("/celebrations"),
            ]);
            if (upcomingRes.status === "fulfilled") setUpcomingEvents(upcomingRes.value.data.events || []);
            if (scheduledRes.status === "fulfilled") setScheduledCelebrations(scheduledRes.value.data.celebrations || []);
        } catch {
            toast.error("Failed to load celebrations");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await API.get("/users");
            setUsers(res.data?.users || res.data || []);
        } catch { }
    };

    const fetchTemplates = async () => {
        try {
            const res = await API.get("/celebrationTemplate");
            const list = res.data?.templates || res.data || [];
            setTemplates(Array.isArray(list) ? list : []);
        } catch (err) {
            console.warn("celebration-templates endpoint not available:", err?.response?.status);
            setTemplates([]);
        }
    };

    useEffect(() => {
        fetchData();
        fetchUsers();
        fetchTemplates();
    }, []);

    const handleSave = async (form, id) => {
        if (saving) return;   // ← prevent double submit
        if (!form.employeeId || !form.scheduledAt) {
            toast.error("Employee and scheduled date are required.");
            return;
        }
        setSaving(true);
        try {
            if (id) {
                await API.put(`/celebrations/update/${id}`, form);
                toast.success("Celebration updated successfully");
            } else {
                await API.post("/celebrations/create", form);
                toast.success("Celebration scheduled successfully");
            }
            setModalOpen(false);   // ✅ only runs if API succeeded
            setEditData(null);
            fetchData();
        } catch (error) {
            console.error(error);  // ✅ add this to see silent errors
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await API.delete(`/celebrations/delete/${id}`);
            toast.success("Celebration deleted");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Delete failed");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const openCreate = () => { setEditData(null); setModalOpen(true); };
    const openEdit = (item) => { setEditData(item); setModalOpen(true); };
    const openScheduleFromEvent = (event) => {
        setEditData({
            employeeId: { _id: event.employeeId },
            eventType: event.eventType,
            recipients: [event.employeeId],  // auto-check the employee
        });
        setModalOpen(true);
    };

    const todayCount = upcomingEvents.filter(e => e.daysLeft === 0).length;
    const pendingCount = scheduledCelebrations.filter(c => c.status === "pending").length;

    return (
        <DashboardLayout>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .create-btn-main:hover { background: #4c3dd4 !important; }
            `}</style>

            <div style={{ paddingBottom: 40, fontFamily: "'Inter', sans-serif" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-.5px", color: "#111827" }}>Upcoming Events </h1>
                        <p style={{ color: "#374151", fontSize: 14, marginTop: 4 }}>Manage birthdays, work anniversaries, and automated celebration emails.</p>
                    </div>
                    <button className="create-btn-main" onClick={openCreate} style={{ background: "#5b4cf5", color: "#fff", border: "none", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background .2s" }}>
                        <FaPlus /> Create Celebration
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard label="Upcoming (30 days)" value={upcomingEvents.length} icon={<FaBirthdayCake />} bg="#ede9fe" color="#5b21b6" />
                    <StatCard label="Scheduled Emails" value={scheduledCelebrations.length} icon={<FaEnvelope />} bg="#dbeafe" color="#1d4ed8" />
                    <StatCard label="Today's Celebrations" value={todayCount} icon={<FaBirthdayCake />} bg="#d1fae5" color="#065f46" />
                    <StatCard label="Pending to Send" value={pendingCount} icon={<FaCalendarAlt />} bg="#fef3c7" color="#92400e" />
                </div>

                {/* Main grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>

                    {/* Upcoming Events */}
                    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>Upcoming Events</p>
                                <p style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>Next 30 days — birthdays &amp; anniversaries</p>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#5b21b6", fontSize: 16 }}>
                                <FaBirthdayCake />
                            </div>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "36px 16px" }}>
                                <FaSpinner style={{ fontSize: 24, animation: "spin 1s linear infinite", color: "#5b4cf5" }} />
                            </div>
                        ) : upcomingEvents.length === 0 ? (
                            <EmptyState message="No upcoming events in the next 30 days" />
                        ) : (
                            upcomingEvents.map((event, i) => (
                                <UpcomingRow key={i} event={event} onSchedule={openScheduleFromEvent} onEdit={openEdit} />
                            ))
                        )}
                    </div>

                    {/* Scheduled Emails */}
                    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>Scheduled Emails</p>
                                <p style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>All scheduled celebrations</p>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8", fontSize: 16 }}>
                                <FaEnvelope />
                            </div>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "36px 16px" }}>
                                <FaSpinner style={{ fontSize: 24, animation: "spin 1s linear infinite", color: "#5b4cf5" }} />
                            </div>
                        ) : scheduledCelebrations.length === 0 ? (
                            <EmptyState message="No scheduled emails yet" />
                        ) : (
                            scheduledCelebrations.map(item => (
                                <ScheduledRow key={item._id} item={item} onDelete={id => setDeleteConfirm(id)} onEdit={openEdit} />
                            ))
                        )}
                    </div>

                </div>
            </div>

            {/* Modal */}
            <CelebrationModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditData(null); }}
                onSave={handleSave}
                editData={editData}
                users={users}
                templates={templates}
                saving={saving}
            />

            {/* Delete confirm */}
            {deleteConfirm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", padding: 28, maxWidth: 380, width: "100%" }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Delete Celebration?</h3>
                        <p style={{ fontSize: 14, color: "#374151", marginBottom: 24 }}>This action cannot be undone. The scheduled email will be cancelled.</p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Celebrations;