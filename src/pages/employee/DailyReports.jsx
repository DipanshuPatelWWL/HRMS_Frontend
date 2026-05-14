import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import API, { BASE_URL } from "../../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const isImage = (f) => f && f.type && f.type.startsWith("image/");

const getDayName = (date) =>
    new Date(date).toLocaleDateString("en-US", { weekday: "long" });

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEEKEND_DAYS = ["Saturday", "Sunday"];
const PER_PAGE = 10;
const EMPTY_FORM = { task_name: "", day: "", date: "", status: "pending", message: "", file: null };


// ── Injected styles ───────────────────────────────────────────────────────────
const globalStyles = `
    @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
    }
    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes rowSlideIn {
        from { opacity: 0; transform: translateX(-12px); }
        to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes countUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .emp-row { transition: background 0.18s, transform 0.15s; }
    .emp-row:hover { background: rgba(79,70,229,0.06) !important; transform: translateX(2px); }
    .emp-action-btn { transition: all 0.15s; }
    .emp-action-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .emp-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
    .emp-stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
`;


const normalizeReport = (report) => {
    const filePath = report.file || "";
    const normalized = filePath.replace(/\\/g, "/");
    const clean = normalized.startsWith("/") ? normalized.slice(1) : normalized;
    const isImg = clean && /\.(png|jpg|jpeg|gif|webp)$/i.test(clean);
    return {
        ...report,
        fileName: clean ? clean.split("/").pop() : "",
        filePreview: clean && isImg ? `${BASE_URL}/${clean}` : null,
        fileUrl: clean ? `${BASE_URL}/${clean}` : null,
    };
};

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ status }) {
    const isPending = status === "pending";
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
            textTransform: "capitalize",
            backgroundColor: isPending ? "#fffbeb" : "#f0fdf4",
            color: isPending ? "#b45309" : "#15803d",
            border: `1px solid ${isPending ? "#fde68a" : "#bbf7d0"}`,
        }}>
            {isPending ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <circle cx="4" cy="4" r="3" fill="#f59e0b" />
                </svg>
            ) : (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <circle cx="4" cy="4" r="3" fill="#22c55e" />
                </svg>
            )}
            {status}
        </span>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, active, onClick, loading }) {
    const palette = {
        blue: { border: "#3b82f6", bg: active ? "#eff6ff" : "#fff", shadow: "rgba(59,130,246,0.18)" },
        amber: { border: "#f59e0b", bg: active ? "#fffbeb" : "#fff", shadow: "rgba(245,158,11,0.18)" },
        green: { border: "#22c55e", bg: active ? "#f0fdf4" : "#fff", shadow: "rgba(34,197,94,0.18)" },
    };
    const p = palette[color];
    return (
        <div className="emp-stat-card" style={{
            backgroundColor: p.bg, borderRadius: 14,
            boxShadow: active ? `0 0 0 2px ${p.border}, 0 8px 24px ${p.shadow}` : "0 1px 4px rgba(0,0,0,0.07)",
            border: `1px solid ${active ? p.border : "#f3f4f6"}`,
            borderTop: `4px solid ${p.border}`,
            padding: 24, flex: 1, minWidth: 0, cursor: "pointer",
        }} onClick={onClick}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#6b7280", margin: "0 0 8px" }}>{label}</p>
            {loading
                ? <div style={{ width: 64, height: 40, borderRadius: 8, backgroundColor: "#f3f4f6", animation: "pulse 1.5s ease-in-out infinite" }} />
                : <p style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1, animation: "countUp 0.4s ease" }}>{value}</p>
            }
        </div>
    );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }) {
    if (!visible) return null;
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 20px", borderRadius: 12, color: "#ffffff",
            fontSize: 14, fontWeight: 600, boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            backgroundColor: type === "error" ? "#ef4444" : "#059669",
            animation: "slideUp 0.3s ease",
        }}>
            <span>{type === "error" ? "✕" : "✓"}</span>{message}
        </div>
    );
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────
function DropZone({ onChange, hasFile }) {
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault(); setDrag(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onChange(file);
    };

    return (
        <div
            style={{
                cursor: "pointer", borderRadius: 12,
                border: `2px dashed ${drag ? "#818cf8" : hasFile ? "#86efac" : "#e5e7eb"}`,
                padding: "20px 16px", textAlign: "center", transition: "all 0.2s",
                backgroundColor: drag ? "#eef2ff" : hasFile ? "#f0fdf4" : "transparent",
                userSelect: "none",
            }}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            {hasFile ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <svg style={{ width: 24, height: 24 }} fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#16a34a", margin: 0 }}>File attached — click to replace</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <svg style={{ width: 28, height: 28 }} fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#6b7280", margin: 0 }}>
                        Drop file here or <span style={{ color: "#4f46e5", textDecoration: "underline" }}>browse</span>
                    </p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>PDF, DOC, DOCX, PNG, JPG — max 5 MB</p>
                </div>
            )}
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
        </div>
    );
}

// ── File Preview Block ────────────────────────────────────────────────────────
function FilePreviewBlock({ previewUrl, fileName, fileUrl, onRemove }) {
    if (!fileName) return null;

    const isPdf = fileName?.toLowerCase().endsWith(".pdf");

    if (previewUrl || isPdf) {

        return (
            <div
                style={{
                    marginTop: 12,
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                }}
            >
                {/* PDF Preview */}
                {isPdf && fileUrl ? (
                    <>
                        <iframe
                            src={fileUrl}
                            title="PDF Preview"
                            style={{
                                width: "100%",
                                height: 260,
                                border: "none",
                                display: "block",
                                backgroundColor: "#f9fafb",
                            }}
                        />

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                borderTop: "1px solid #e5e7eb",
                                backgroundColor: "#f9fafb",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    minWidth: 0,
                                }}
                            >
                                <span style={{ fontSize: 18 }}>📄</span>

                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "#374151",
                                        fontWeight: 500,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {fileName}
                                </span>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    flexShrink: 0,
                                }}
                            >
                                <a
                                    href={fileUrl}
                                    download
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: 8,
                                        backgroundColor: "#4f46e5",
                                        color: "#fff",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textDecoration: "none",
                                    }}
                                >
                                    Download
                                </a>

                                {onRemove && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove();
                                        }}
                                        type="button"
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            color: "#9ca3af",
                                        }}
                                    >
                                        <svg
                                            style={{ width: 16, height: 16 }}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "10px 12px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 0,
                            }}
                        >
                            <svg
                                style={{ width: 16, height: 16, flexShrink: 0 }}
                                fill="none"
                                stroke="#6366f1"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"
                                />
                            </svg>

                            <span
                                style={{
                                    fontSize: 12,
                                    color: "#4f46e5",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {fileName}
                            </span>
                        </div>

                        {onRemove && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                type="button"
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    color: "#a5b4fc",
                                }}
                            >
                                <svg
                                    style={{ width: 16, height: 16 }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, backgroundColor: "#eef2ff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
                </svg>
                <span style={{ fontSize: 12, color: "#4f46e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                {fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: "#6366f1", textDecoration: "none" }}>View ↗</a>}
                {onRemove && (
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#a5b4fc" }}>
                        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr style={{ borderBottom: "1px solid #f9fafb" }}>
            {[40, 160, 100, 100, 90, 120].map((w, i) => (
                <td key={i} style={{ padding: "14px 20px" }}>
                    <div style={{ height: 14, borderRadius: 6, backgroundColor: "#f3f4f6", animation: "pulse 1.5s ease-in-out infinite", width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ── Day Selector ──────────────────────────────────────────────────────────────
// Shows all 7 days as pill buttons.
// Weekend  → gray  + disabled
// Absent   → red   + disabled (dot indicator)
// Present  → indigo + clickable
// Selected → solid indigo
function DaySelector({ value, onChange, presentDays, loadingAttendance }) {
    const getState = (day) => {
        if (WEEKEND_DAYS.includes(day)) return "weekend";
        if (loadingAttendance) return "loading";
        if (presentDays.size === 0) return "active";   // no attendance data → allow all
        return presentDays.has(day) ? "active" : "absent";
    };

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DAYS.map((day) => {
                const state = getState(day);
                const isDisabled = state !== "active";
                const isSelected = value === day;

                let bg = "#eef2ff", border = "#c7d2fe", color = "#4f46e5";
                if (state === "weekend") { bg = "#f9fafb"; border = "#e5e7eb"; color = "#d1d5db"; }
                if (state === "absent") { bg = "#fff1f2"; border = "#fecdd3"; color = "#fca5a5"; }
                if (state === "loading") { bg = "#f9fafb"; border = "#e5e7eb"; color = "#d1d5db"; }
                if (isSelected) { bg = "#4f46e5"; border = "#4f46e5"; color = "#ffffff"; }

                const dotColor = state === "absent" ? "#f87171" : state === "weekend" ? "#d1d5db" : null;

                return (
                    <button
                        key={day}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => onChange(day)}
                        title={
                            state === "weekend" ? "Weekend — office closed"
                                : state === "absent" ? "You were absent this day"
                                    : ""
                        }
                        style={{
                            position: "relative", padding: "5px 12px", borderRadius: 8,
                            fontSize: 12, fontWeight: 600,
                            border: `1px solid ${border}`, backgroundColor: bg, color,
                            cursor: isDisabled ? "not-allowed" : "pointer", transition: "all 0.15s",
                        }}
                    >
                        {day.slice(0, 3)}
                        {dotColor && (
                            <span style={{
                                position: "absolute", top: -3, right: -3, width: 8, height: 8,
                                borderRadius: "50%", backgroundColor: dotColor, border: "1.5px solid #fff",
                            }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function ReportModal({ open, onClose, onSave, editData, saving, presentDays, loadingAttendance, hasPunchedIn,
    attendanceCheckLoading }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [filePreview, setFilePreview] = useState(null);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (open) {
            if (editData) {
                setForm({
                    task_name: editData.task_name || "",
                    day: editData.day || "",
                    date: editData.date ? new Date(editData.date).toISOString().slice(0, 10) : "",
                    status: editData.status || "pending",
                    message: editData.message || "",
                    file: null,
                });
                setFilePreview(editData.filePreview || null);
            } else {
                setForm(EMPTY_FORM);
                setFilePreview(null);
            }
            setFormError("");
        }
    }, [open, editData]);

    useEffect(() => () => {
        if (filePreview && filePreview.startsWith("blob:")) URL.revokeObjectURL(filePreview);
    }, [filePreview]);

    if (!open) return null;

    const handleFileChange = (file) => {
        if (filePreview && filePreview.startsWith("blob:")) URL.revokeObjectURL(filePreview);
        setForm((f) => ({ ...f, file }));
        setFilePreview(isImage(file) ? URL.createObjectURL(file) : null);
    };

    const clearFile = () => {
        if (filePreview && filePreview.startsWith("blob:")) URL.revokeObjectURL(filePreview);
        setForm((f) => ({ ...f, file: null }));
        setFilePreview(null);
    };

    // When date changes → auto-detect day name and validate
    const handleDateChange = (e) => {
        const dateVal = e.target.value;
        setForm((f) => {
            let autoDay = f.day;
            if (dateVal) {
                const dayName = getDayName(dateVal + "T00:00:00");
                const isWeekendDay = WEEKEND_DAYS.includes(dayName);
                const isPresent = presentDays.size === 0 || presentDays.has(dayName);
                autoDay = (!isWeekendDay && isPresent) ? dayName : "";
            }
            return { ...f, date: dateVal, day: autoDay };
        });
    };

    const handleSubmit = () => {
        if (!form.task_name.trim() || !form.day || !form.date) {
            setFormError("Task name, day, and date are required.");
            return;
        }
        if (WEEKEND_DAYS.includes(form.day)) {
            setFormError("You cannot submit a report for a weekend day.");
            return;
        }
        if (presentDays.size > 0 && !presentDays.has(form.day)) {
            setFormError("You were absent on this day. Reports can only be submitted for present days.");
            return;
        }
        const existingFile = editData?.fileName;
        if (!form.file && !existingFile) {
            setFormError("Attaching a file is required.");
            return;
        }
        setFormError("");
        onSave(form);
    };

    const hasFile = !!(form.file || editData?.fileName);
    const displayFileName = form.file?.name || editData?.fileName || null;
    const displayPreview = form.file ? filePreview : (editData?.filePreview || null);
    const displayFileUrl = form.file
        ? URL.createObjectURL(form.file)
        : (editData?.fileUrl || null);

    const inputStyle = {
        width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
        padding: "10px 12px", fontSize: 14, outline: "none",
        boxSizing: "border-box", fontFamily: "inherit",
    };
    const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", padding: 16 }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,0.15)", width: "100%", maxWidth: 512, maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "fadeInScale 0.2s ease" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", margin: 0 }}>{editData ? "Edit Report" : "Add Daily Report"}</h2>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, marginBottom: 0 }}>
                            {editData ? "Update your report details" : "Fill in your task details for today"}
                        </p>
                    </div>
                    <button onClick={onClose} disabled={saving} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, opacity: saving ? 0.4 : 1 }}>
                        <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
                    {formError && (
                        <p style={{ fontSize: 12, color: "#ef4444", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                            <svg style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                            </svg>
                            {formError}
                        </p>
                    )}

                    {/* Task Name */}
                    <div>
                        <label style={labelStyle}>Task Name <span style={{ color: "#f87171" }}>*</span></label>
                        <input type="text" value={form.task_name}
                            onChange={(e) => setForm(f => ({ ...f, task_name: e.target.value }))}
                            placeholder="e.g. API Integration for Attendance" style={inputStyle} />
                    </div>

                    {/* Date */}
                    <div>
                        <label style={labelStyle}>Date <span style={{ color: "#f87171" }}>*</span></label>
                        <input type="date" value={form.date} onChange={handleDateChange} style={inputStyle} />
                    </div>

                    {/* Day selector */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Day <span style={{ color: "#f87171" }}>*</span></label>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                {loadingAttendance ? "⏳ Loading attendance..." : presentDays.size > 0 ? "Only present days are selectable" : "Select a day"}
                            </span>
                        </div>

                        {/* Legend */}
                        <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
                            {[
                                { dot: "#4f46e5", label: "Present" },
                                { dot: "#fca5a5", label: "Absent" },
                                { dot: "#d1d5db", label: "Weekend" },
                            ].map(({ dot, label }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, display: "inline-block" }} />
                                    {label}
                                </div>
                            ))}
                        </div>

                        <DaySelector value={form.day} onChange={(day) => setForm(f => ({ ...f, day }))} presentDays={presentDays} loadingAttendance={loadingAttendance} />
                    </div>

                    {/* Status */}
                    <div>
                        <label style={labelStyle}>Status</label>
                        <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, backgroundColor: "#ffffff" }}>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    {/* Message */}
                    <div>
                        <label style={labelStyle}>Message / Notes</label>
                        <textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                            rows={3} placeholder="Brief description of what was accomplished..."
                            style={{ ...inputStyle, resize: "none" }} />
                    </div>

                    {/* File */}
                    <div>
                        <label style={{ ...labelStyle, marginBottom: 6 }}>
                            Attach File <span style={{ color: "#f87171" }}>*</span>
                            <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4 }}>(PDF, DOC, Image · max 5MB)</span>
                        </label>
                        <DropZone onChange={handleFileChange} hasFile={hasFile} />
                        <FilePreviewBlock previewUrl={displayPreview} fileName={displayFileName} fileUrl={displayFileUrl} onRemove={form.file ? clearFile : null} />
                    </div>
                </div>

                {
                    !attendanceCheckLoading &&
                    !hasPunchedIn && (
                        <div
                            style={{
                                margin: "0 24px 16px",
                                padding: "10px 12px",
                                borderRadius: 8,
                                background: "#FEF2F2",
                                border: "1px solid #FECACA",
                                color: "#DC2626",
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            ⚠ Please punch in first to submit daily report.
                        </div>
                    )
                }

                {/* Footer */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                    <button onClick={onClose} disabled={saving}
                        style={{ padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "#4b5563", backgroundColor: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", opacity: saving ? 0.4 : 1 }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving || attendanceCheckLoading || !hasPunchedIn}
                        style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, color: "#ffffff", backgroundColor: "#4f46e5", border: "none", borderRadius: 8, cursor: "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}>
                        {saving && <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#ffffff", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
                        {saving ? "Saving..." : editData ? "Save Changes" : "Submit Report"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ report, onClose }) {
    const [previewOpen, setPreviewOpen] = useState(false);

    if (!report) return null;

    const isPdf = report.fileName?.toLowerCase().endsWith(".pdf");

    const rowStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f9fafb",
    };

    return (
        <>
            {/* Main Modal */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(4px)",
                    padding: 16,
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: 16,
                        boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
                        width: "100%",
                        maxWidth: 500,
                        maxHeight: "90vh",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "16px 24px",
                            borderBottom: "1px solid #f3f4f6",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    margin: 0,
                                    color: "#111827",
                                }}
                            >
                                {report.task_name}
                            </h2>

                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: 12,
                                    color: "#9ca3af",
                                }}
                            >
                                Report Details
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                fontSize: 20,
                                color: "#9ca3af",
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Body */}
                    <div
                        style={{
                            padding: 20,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        {/* IMAGE PREVIEW */}
                        {report.filePreview && (
                            <div
                                onClick={() => setPreviewOpen(true)}
                                style={{
                                    borderRadius: 14,
                                    overflow: "hidden",
                                    border: "1px solid #e5e7eb",
                                    cursor: "pointer",
                                    backgroundColor: "#f9fafb",
                                }}
                            >
                                <img
                                    src={`${BASE_URL}/report.filePreview`}
                                    alt="preview"
                                    style={{
                                        width: "100%",
                                        maxHeight: 260,
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />

                                <div
                                    style={{
                                        padding: "10px 14px",
                                        borderTop: "1px solid #e5e7eb",
                                        fontSize: 13,
                                        color: "#4b5563",
                                        fontWeight: 500,
                                    }}
                                >
                                    📷 {report.fileName}
                                </div>
                            </div>
                        )}

                        {/* PDF PREVIEW */}
                        {/* PDF PREVIEW */}
                        {!report.filePreview && isPdf && report.fileUrl && (
                            <div
                                style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                    background: "#fff",
                                }}
                            >
                                {/* Header */}
                                <div
                                    style={{
                                        padding: "10px 14px",
                                        borderBottom: "1px solid #e5e7eb",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        backgroundColor: "#f9fafb",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            minWidth: 0,
                                            flex: 1,
                                        }}
                                    >
                                        <span style={{ fontSize: 18 }}>📄</span>

                                        <span
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "#374151",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {report.fileName}
                                        </span>
                                    </div>

                                    {/* Download Button */}
                                    <a
                                        href={report.fileUrl}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            padding: "7px 14px",
                                            borderRadius: 8,
                                            backgroundColor: "#4f46e5",
                                            color: "#fff",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            textDecoration: "none",
                                            flexShrink: 0,
                                        }}
                                    >
                                        Download
                                    </a>
                                </div>

                                {/* PDF Viewer */}
                                <iframe
                                    src={report.fileUrl}
                                    title="PDF Preview"
                                    style={{
                                        width: "100%",
                                        height: 400,
                                        border: "none",
                                    }}
                                />
                            </div>
                        )}

                        {/* OTHER FILE */}
                        {!report.filePreview && !isPdf && report.fileName && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "12px 14px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    backgroundColor: "#f9fafb",
                                }}
                            >
                                <span style={{ fontSize: 20 }}>📁</span>

                                <div
                                    style={{
                                        flex: 1,
                                        overflow: "hidden",
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 13,
                                            color: "#374151",
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {report.fileName}
                                    </p>
                                </div>
                            </div>
                        )}

                        {[
                            { label: "Task Name", value: report.task_name },
                            { label: "Day", value: report.day },
                            { label: "Date", value: fmt(report.date) },
                        ].map(({ label, value }) => (
                            <div key={label} style={rowStyle}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#9ca3af",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {label}
                                </span>

                                <span
                                    style={{
                                        fontSize: 14,
                                        color: "#374151",
                                        fontWeight: 500,
                                    }}
                                >
                                    {value}
                                </span>
                            </div>
                        ))}

                        <div style={rowStyle}>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#9ca3af",
                                    textTransform: "uppercase",
                                }}
                            >
                                Status
                            </span>

                            <Badge status={report.status} />
                        </div>

                        {report.message && (
                            <div>
                                <p
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#9ca3af",
                                        textTransform: "uppercase",
                                        marginBottom: 8,
                                    }}
                                >
                                    Message
                                </p>

                                <div
                                    style={{
                                        backgroundColor: "#f9fafb",
                                        borderRadius: 10,
                                        padding: 14,
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        color: "#4b5563",
                                    }}
                                >
                                    {report.message}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FULLSCREEN IMAGE PREVIEW */}
            {previewOpen && report.filePreview && (
                <div
                    onClick={() => setPreviewOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 999,
                        backgroundColor: "rgba(0,0,0,0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                    }}
                >
                    <button
                        onClick={() => setPreviewOpen(false)}
                        style={{
                            position: "absolute",
                            top: 20,
                            right: 20,
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            color: "#fff",
                            fontSize: 24,
                            cursor: "pointer",
                        }}
                    >
                        ×
                    </button>

                    <img
                        src={report.filePreview}
                        alt="fullscreen"
                        style={{
                            maxWidth: "100%",
                            maxHeight: "90vh",
                            borderRadius: 12,
                        }}
                    />
                </div>
            )}
        </>
    );
}



// ── Pagination Bar ────────────────────────────────────────────────────────────
function PaginationBar({ safePage, totalPages, filteredLen, goPage }) {
    if (filteredLen === 0) return null;
    const start = (safePage - 1) * PER_PAGE + 1;
    const end = Math.min(safePage * PER_PAGE, filteredLen);
    const btnBase = { width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, cursor: "pointer" };

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Showing {start}–{end} of {filteredLen}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => goPage(safePage - 1)} disabled={safePage === 1} style={{ ...btnBase, backgroundColor: "transparent", color: "#6b7280", opacity: safePage === 1 ? 0.3 : 1 }}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => goPage(p)}
                        style={{ ...btnBase, backgroundColor: p === safePage ? "#4f46e5" : "transparent", color: p === safePage ? "#ffffff" : "#4b5563", borderColor: p === safePage ? "#4f46e5" : "#e5e7eb", fontWeight: 500 }}>{p}</button>
                ))}
                <button onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages} style={{ ...btnBase, backgroundColor: "transparent", color: "#6b7280", opacity: safePage === totalPages ? 0.3 : 1 }}>›</button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DailyReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingId, setSendingId] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [detailRow, setDetailRow] = useState(null);

    const [statusFilter, setStatusFilter] = useState("");
    const [statCardFilter, setStatCardFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Attendance: which days this month was the user present?
    const [presentDays, setPresentDays] = useState(new Set());
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [hasPunchedIn, setHasPunchedIn] = useState(false);
    const [attendanceCheckLoading, setAttendanceCheckLoading] = useState(false);

    const [toast, setToast] = useState({ message: "", type: "success", visible: false });

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
    }, []);



    useEffect(() => {

        const checkTodayPunchIn = async () => {
            try {
                setAttendanceCheckLoading(true);
                const res = await API.get("/attendance/today");
                const attendance = res.data?.attendance;

                // Array response
                if (Array.isArray(attendance)) {
                    const validPunch = attendance.find(
                        (a) => a.punchIn
                    );
                    setHasPunchedIn(!!validPunch);
                }

                // Single object response
                else if (attendance?.punchIn) {
                    setHasPunchedIn(true);
                } else {
                    setHasPunchedIn(false);
                }

            } catch (err) {
                setHasPunchedIn(false);
            } finally {
                setAttendanceCheckLoading(false);
            }
        };

        checkTodayPunchIn();

    }, []);


    // ── Fetch reports — FIX: backend returns { data: [...] } not { reports: [...] } ──
    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const response = await API.get("/getAllDailyReports");
            const raw = response.data;

            let reportsRaw = [];
            if (Array.isArray(raw)) reportsRaw = raw;
            else if (Array.isArray(raw?.data)) reportsRaw = raw.data;      // ← correct key
            else if (Array.isArray(raw?.reports)) reportsRaw = raw.reports;
            else {
                reportsRaw = Object.keys(raw || {}).filter((k) => !isNaN(k)).map((k) => raw[k]);
            }

            setReports(reportsRaw.map(normalizeReport));
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to fetch reports", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports,]);

    const activeFilter = statCardFilter || statusFilter;
    const filtered = useMemo(
        () =>
            activeFilter
                ? reports.filter(
                    (r) => r.status?.toLowerCase() === activeFilter.toLowerCase()
                )
                : reports,
        [reports, activeFilter]
    );

    const base = useMemo(
        () =>
            statusFilter
                ? reports.filter(
                    (r) => r.status?.toLowerCase() === statusFilter.toLowerCase()
                )
                : reports,
        [reports, statusFilter]
    );
    const total = base.length;
    const pending = base.filter(
        (r) => r.status?.toLowerCase() === "pending"
    ).length;

    const completed = base.filter(
        (r) => r.status?.toLowerCase() === "completed"
    ).length;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageSlice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    const goPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };
    useEffect(() => { setCurrentPage(1); }, [statusFilter, statCardFilter]);

    const handleDropdownFilter = (val) => { setStatusFilter(val); setStatCardFilter(""); };
    const handleStatCard = (filter) => { setStatCardFilter((prev) => prev === filter ? "" : filter); setStatusFilter(""); };

    const openAdd = () => { setEditData(null); setEditId(null); setModalOpen(true); };
    const openEdit = (e, report) => { e.stopPropagation(); setEditData(report); setEditId(report._id); setModalOpen(true); };

    const createReport = async (form) => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("task_name", form.task_name);
            fd.append("day", form.day);
            fd.append("date", form.date);
            fd.append("status", form.status);
            fd.append("message", form.message);
            if (form.file) fd.append("file", form.file);

            const { data } = await API.post("/createDailyReport", fd, { headers: { "Content-Type": "multipart/form-data" } });
            // Backend returns { data: report } → normalize it
            const created = normalizeReport(data.data || data.report || {});
            setReports((prev) => [created, ...prev]);
            setCurrentPage(1);
            setModalOpen(false);
            showToast("Report created successfully");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to create report", "error");
        } finally {
            setSaving(false);
        }
    };

    const updateReport = async (form) => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("task_name", form.task_name);
            fd.append("day", form.day);
            fd.append("date", form.date);
            fd.append("status", form.status);
            fd.append("message", form.message);
            if (form.file) fd.append("file", form.file);

            const { data } = await API.put(`/updateDailyReport/${editId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            const updated = normalizeReport(data.data || data.report || {});
            setReports((prev) => prev.map((r) => r._id === editId ? updated : r));
            setModalOpen(false);
            showToast("Report updated successfully");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update report", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = (form) => { if (editId) updateReport(form); else createReport(form); };

    const handleSend = async (e, id) => {
        e.stopPropagation();
        setSendingId(id);
        try {
            await API.patch(`/sendDailyReport/${id}/send`);
            setReports((prev) => prev.map((r) => r._id === id ? { ...r, sent: true } : r));
            setDetailRow((d) => d?._id === id ? { ...d, sent: true } : d);
            showToast("Report sent successfully");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to send report", "error");
        } finally {
            setSendingId(null);
        }
    };

    const thStyle = { padding: "12px 20px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", textAlign: "left" };
    const thCenterStyle = { ...thStyle, textAlign: "center" };

    return (
        <DashboardLayout>
            <style>{globalStyles}</style>

            <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", padding: 24, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>Daily Reports</h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", marginTop: 0, marginBottom: 0, paddingLeft: 46 }}>Submit and track your daily task reports</p>
                </div>

                {/* Stat Cards */}
                <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                    <StatCard label="Total" value={total} color="blue" loading={loading} active={statCardFilter === "" && statusFilter === ""} onClick={() => handleStatCard("")} />
                    <StatCard label="Pending" value={pending} color="amber" loading={loading} active={statCardFilter === "pending"} onClick={() => handleStatCard("pending")} />
                    <StatCard label="Completed" value={completed} color="green" loading={loading} active={statCardFilter === "completed"} onClick={() => handleStatCard("completed")} />
                </div>

                {/* Table Card */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}>

                    {/* Toolbar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>All Reports</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={fetchReports} disabled={loading}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", color: "#6b7280", fontSize: 14, backgroundColor: "transparent", cursor: "pointer", opacity: loading ? 0.4 : 1 }}>
                                <svg style={{ width: 16, height: 16, animation: loading ? "spin 1s linear infinite" : "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                            <select value={statusFilter} onChange={(e) => handleDropdownFilter(e.target.value)}
                                style={{ fontSize: 14, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", backgroundColor: "#ffffff", color: "#4b5563", outline: "none", cursor: "pointer" }}>
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                            <button onClick={openAdd}
                                style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#4f46e5", color: "#ffffff", fontSize: 14, fontWeight: 500, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}>
                                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>Add Report
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f9fafb" }}>
                                        {["#", "Task Name", "Day", "Date", "Status", "Actions"].map((h) => (
                                            <th key={h} style={h === "Actions" ? thCenterStyle : thStyle}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                            </table>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#9ca3af" }}>
                            <svg style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
                            </svg>
                            <p style={{ fontWeight: 500, margin: 0 }}>No reports found</p>
                            <p style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                                {activeFilter ? `No ${activeFilter} reports.` : `Click "Add Report" to submit your first daily report`}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f9fafb" }}>
                                            {["#", "Task Name", "Day", "Date", "Status", "Actions"].map((h) => (
                                                <th key={h} style={h === "Actions" ? thCenterStyle : thStyle}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageSlice.map((r, i) => (
                                            <tr key={r._id} onClick={() => setDetailRow(r)}
                                                className="emp-row"
                                                style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", animation: `rowSlideIn 0.25s ease ${i * 0.04}s both` }}
                                            >
                                                <td style={{ padding: "14px 20px" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, backgroundColor: "#f1f5f9", fontSize: 11, fontWeight: 800, color: "#475569" }}>
                                                        {String((safePage - 1) * PER_PAGE + i + 1).padStart(2, "0")}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 20px", fontWeight: 700, color: "#0f172a" }}>{r.task_name}</td>
                                                <td style={{ padding: "14px 20px", color: "#334155", fontWeight: 500 }}>{r.day}</td>
                                                <td style={{ padding: "14px 20px", color: "#334155", fontWeight: 500 }}>{fmt(r.date)}</td>
                                                <td style={{ padding: "14px 20px" }}><Badge status={r.status} /></td>
                                                <td style={{ padding: "14px 20px" }} onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                                        <button onClick={(e) => openEdit(e, r)} disabled={r.sent}
                                                            className="emp-action-btn"
                                                            title={r.sent ? "Cannot edit a sent report" : "Edit report"}
                                                            style={{
                                                                display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid", cursor: r.sent ? "not-allowed" : "pointer",
                                                                borderColor: r.sent ? "#e2e8f0" : "#c7d2fe",
                                                                color: r.sent ? "#cbd5e1" : "#4f46e5",
                                                                backgroundColor: r.sent ? "#f8fafc" : "#eef2ff",
                                                            }}>
                                                            <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            {r.sent ? "Locked" : "Edit"}
                                                        </button>

                                                        {r.sent ? (
                                                            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "1px solid #bbf7d0", color: "#15803d", backgroundColor: "#f0fdf4" }}>
                                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Sent
                                                            </span>
                                                        ) : (
                                                            <button onClick={(e) => handleSend(e, r._id)} disabled={sendingId === r._id}
                                                                className="emp-action-btn"
                                                                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid #bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff", cursor: "pointer", opacity: sendingId === r._id ? 0.5 : 1 }}>
                                                                {sendingId === r._id
                                                                    ? <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #93c5fd", borderTopColor: "#2563eb", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                                                    : <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                                    </svg>
                                                                }
                                                                Send
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <PaginationBar safePage={safePage} totalPages={totalPages} filteredLen={filtered.length} goPage={goPage} />
                        </>
                    )}
                </div>
            </div>

            <ReportModal
                open={modalOpen}
                onClose={() => !saving && setModalOpen(false)}
                onSave={handleSave}
                editData={editData}
                saving={saving}
                presentDays={presentDays}
                loadingAttendance={loadingAttendance}

                hasPunchedIn={hasPunchedIn}
                attendanceCheckLoading={attendanceCheckLoading}
            />
            <DetailModal report={detailRow} onClose={() => setDetailRow(null)} />
            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    );
}