// ─────────────────────────────────────────────────────────────
//  EmployeeScanner.jsx
//  Drop this file into: src/components/scanner/EmployeeScanner.jsx
//
//  Install deps first:
//    npm install @zxing/library
//
//  Usage (HR panel, e.g. inside Employees.jsx):
//    import EmployeeScanner from "../scanner/EmployeeScanner";
//    <EmployeeScanner onFound={(emp) => openEdit(emp)} />
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { QRCodeSVG } from "qrcode.react";
import API, { QR_CODE_URL } from "../../services/api";

/* ── design tokens (matches your Profile.jsx palette) ── */
const T = {
    bg: "#f5f4f7",
    surface: "#ffffff",
    border: "#e4e1f0",
    accent: "#6c63ff",
    accentLight: "#ede9ff",
    success: "#059669",
    successLight: "#ecfdf5",
    error: "#dc2626",
    errorLight: "#fef2f2",
    warn: "#d97706",
    warnLight: "#fffbeb",
    text: "#111827",
    muted: "#6b7280",
    ff: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
};

/* ── role colour map ── */
const ROLE_CFG = {
    hr: { clr: "#1d4ed8", light: "#dbeafe", dark: "#1e3a8a", grad: "linear-gradient(135deg,#1d4ed8,#3b82f6)", label: "HR" },
    manager: { clr: "#059669", light: "#d1fae5", dark: "#065f46", grad: "linear-gradient(135deg,#059669,#34d399)", label: "Manager" },
    tl: { clr: "#d97706", light: "#fef3c7", dark: "#92400e", grad: "linear-gradient(135deg,#d97706,#fbbf24)", label: "Team Lead" },
    employee: { clr: "#6d28d9", light: "#ede9fe", dark: "#4c1d95", grad: "linear-gradient(135deg,#6d28d9,#a78bfa)", label: "Employee" },
    superadmin: { clr: "#dc2626", light: "#fee2e2", dark: "#7f1d1d", grad: "linear-gradient(135deg,#dc2626,#f87171)", label: "Super Admin" },
};

const getRoleCfg = (role) => ROLE_CFG[role?.toLowerCase()] ?? ROLE_CFG.employee;
const initials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

/* ═══════════════════════════════════════════════════════════
   SECTION 1 — Live Camera Scanner
═══════════════════════════════════════════════════════════ */
function LiveScanner({ onDetected, onClose }) {
    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const [cameras, setCameras] = useState([]);
    const [camIdx, setCamIdx] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [lastCode, setLastCode] = useState(null);
    const [flash, setFlash] = useState(false);

    /* enumerate cameras */
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true })          // triggers permission prompt
            .then((stream) => {
                stream.getTracks().forEach((t) => t.stop());   // release immediately
                return navigator.mediaDevices.enumerateDevices();
            })
            .then((devices) => {
                const devs = devices.filter((d) => d.kind === "videoinput");
                setCameras(devs);
                const rearIdx = devs.findIndex((d) =>
                    /back|rear|environment/i.test(d.label)
                );
                if (rearIdx !== -1) setCamIdx(rearIdx);
            })
            .catch(() => setError("Camera permission denied or no camera found."));
    }, []);

    /* start / restart decode loop whenever camera changes */
    useEffect(() => {
        if (!cameras.length) return;

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        setScanning(true);
        setError(null);

        const deviceId = cameras[camIdx]?.deviceId;

        reader
            .decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
                if (result) {
                    const text = result.getText();
                    setLastCode(text);
                    setFlash(true);
                    setTimeout(() => setFlash(false), 600);
                    onDetected(text);   /* ← fires back to parent */
                }
                if (err && !(err instanceof NotFoundException)) {
                    /* NotFoundException just means no QR in frame — normal */
                }
            })
            .catch((e) => {
                setError(e.message ?? "Could not start camera.");
                setScanning(false);
            });

        return () => {
            reader.reset();
            setScanning(false);
        };
    }, [cameras, camIdx]); // eslint-disable-line react-hooks/exhaustive-deps

    const switchCamera = () => {
        if (readerRef.current) readerRef.current.reset();
        setCamIdx((i) => (i + 1) % cameras.length);
    };

    /* ── styles ── */
    const S = {
        overlay: {
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,.82)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            fontFamily: T.ff,
        },
        box: {
            background: "#000", borderRadius: 20, overflow: "hidden",
            width: "min(96vw, 500px)",
            position: "relative",
            boxShadow: "0 24px 64px rgba(0,0,0,.7)",
        },
        video: {
            width: "100%",
            display: "block",
            maxHeight: "65vh",
            objectFit: "cover"
        },
        topBar: {
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(180deg,rgba(0,0,0,.65) 0%,transparent 100%)",
        },
        title: { color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: ".04em" },
        closeBtn: {
            background: "rgba(255,255,255,.18)", border: "none",
            borderRadius: "50%", width: 34, height: 34,
            color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: "34px",
            textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center",
        },
        /* scanning guide box */
        guide: {
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 300,
            height: 300,
            border: `2.5px solid ${flash ? "#22c55e" : T.accent}`,
            borderRadius: 14,
            transition: "border-color .2s",
            pointerEvents: "none",
        },

        corner: (t, r, b, l) => ({
            position: "absolute", width: 22, height: 22,
            borderColor: flash ? "#22c55e" : T.accent,
            borderStyle: "solid", borderWidth: 0,
            borderTopWidth: t ? 3 : 0, borderRightWidth: r ? 3 : 0,
            borderBottomWidth: b ? 3 : 0, borderLeftWidth: l ? 3 : 0,
            borderRadius: t && l ? "4px 0 0 0" : t && r ? "0 4px 0 0" : b && l ? "0 0 0 4px" : "0 0 4px 0",
            top: t ? -1 : "auto", bottom: b ? -1 : "auto",
            left: l ? -1 : "auto", right: r ? -1 : "auto",
            transition: "border-color .2s",
        }),
        bottomBar: {
            background: "rgba(0,0,0,.7)", padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: 10,
        },
        statusRow: {
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
        },
        dot: (on) => ({
            width: 8, height: 8, borderRadius: "50%",
            background: on ? "#22c55e" : "#ef4444",
            animation: on ? "pulse 1.4s infinite" : "none",
        }),
        statusText: { color: "#d1d5db", fontSize: 12, fontWeight: 500 },
        lastCode: {
            background: "rgba(108,99,255,.18)", border: "1px solid rgba(108,99,255,.4)",
            borderRadius: 8, padding: "6px 12px",
            color: "#c4b5fd", fontSize: 11.5, fontFamily: "monospace",
            textAlign: "center", wordBreak: "break-all",
        },
        switchBtn: {
            background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
            borderRadius: 8, color: "#fff", fontSize: 12,
            padding: "6px 14px", cursor: "pointer", fontFamily: T.ff, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6, margin: "0 auto",
        },
        errBox: {
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "10px 14px",
            color: "#991b1b", fontSize: 13, textAlign: "center",
        },
    };

    return (
        <div style={S.overlay}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <div style={S.box}>
                {/* top bar */}
                <div style={S.topBar}>
                    <span style={S.title}>
                        {/* camera icon */}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 6 }}>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        Point at Employee ID / QR
                    </span>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* video */}
                <video ref={videoRef} style={S.video} muted playsInline />

                {/* guide overlay */}
                {!error && (
                    <div style={S.guide}>
                        <div style={S.corner(true, false, false, true)} />
                        <div style={S.corner(true, true, false, false)} />
                        <div style={S.corner(false, false, true, true)} />
                        <div style={S.corner(false, true, true, false)} />
                    </div>
                )}

                {/* bottom bar */}
                <div style={S.bottomBar}>
                    {error ? (
                        <div style={S.errBox}>{error}</div>
                    ) : (
                        <>
                            <div style={S.statusRow}>
                                <div style={S.dot(scanning)} />
                                <span style={S.statusText}>
                                    {scanning ? "Scanner active — align barcode/QR in frame" : "Starting camera…"}
                                </span>
                            </div>
                            {lastCode && (
                                <div style={S.lastCode}>Last read: {lastCode}</div>
                            )}
                            {cameras.length > 1 && (
                                <button style={S.switchBtn} onClick={switchCamera}>
                                    {/* flip icon */}
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
                                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                                    </svg>
                                    Switch Camera ({camIdx + 1}/{cameras.length})
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 14, fontFamily: T.ff }}>
                Supports QR codes, Code128, EAN, and most 1D/2D barcodes
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 2 — Full Employee Detail Card (HR view)
═══════════════════════════════════════════════════════════ */
function EmployeeDetailCard({ emp, govId, bank, onClose }) {
    const rc = getRoleCfg(emp.role);
    const ini = initials(emp.name);

    /* ── helper row ── */
    const Row = ({ label, value, mono }) => (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "8px 0", borderBottom: `1px solid ${T.border}`
        }}>
            <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600, minWidth: 130, fontFamily: T.ff }}>{label}</span>
            <span style={{
                fontSize: 12.5, color: T.text, fontWeight: 500, textAlign: "right", flex: 1,
                fontFamily: mono ? "monospace" : T.ff
            }}>{value || "—"}</span>
        </div>
    );

    /* ── status pill ── */
    const StatusPill = ({ ok, yes, no }) => (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
            background: ok ? T.successLight : T.warnLight,
            color: ok ? T.success : T.warn,
            border: `1px solid ${ok ? "#6ee7b7" : "#fde68a"}`
        }}>
            {ok ? yes : no}
        </span>
    );

    const S = {
        wrap: {
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, fontFamily: T.ff,
        },
        card: {
            background: T.surface, borderRadius: 20, width: "min(95vw,640px)",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.22)",
        },
        header: {
            height: 80, background: rc.grad, position: "relative", borderRadius: "20px 20px 0 0",
        },
        avatar: {
            position: "absolute", bottom: -36, left: 22,
            width: 72, height: 72, borderRadius: "50%",
            background: rc.grad, border: "3px solid #fff",
            boxShadow: "0 4px 14px rgba(0,0,0,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif",
        },
        closeBtn: {
            position: "absolute", top: 12, right: 14,
            background: "rgba(255,255,255,.2)", border: "none",
            borderRadius: "50%", width: 32, height: 32,
            color: "#fff", cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
        },
        body: { padding: "48px 22px 24px" },
        nameRow: { marginBottom: 4 },
        name: { fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: T.text },
        desig: {
            fontSize: 12, color: rc.clr, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".07em", marginBottom: 12
        },
        rolePill: {
            display: "inline-flex", alignItems: "center", gap: 5,
            background: rc.light, color: rc.dark,
            border: `1px solid ${rc.clr}33`,
            fontSize: 10, fontWeight: 700, padding: "3px 11px",
            borderRadius: 20, textTransform: "uppercase", letterSpacing: ".07em",
            marginBottom: 18,
        },
        sectionTitle: {
            fontSize: 10, fontWeight: 700, color: T.muted,
            textTransform: "uppercase", letterSpacing: ".07em",
            margin: "18px 0 4px",
        },
        idCard: {
            background: T.bg, borderRadius: 12,
            border: `1px solid ${T.border}`,
            padding: "12px 16px", marginBottom: 4,
        },
        twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
        miniCard: {
            background: T.bg, borderRadius: 10,
            border: `1px solid ${T.border}`,
            padding: "10px 14px",
        },
        miniLabel: {
            fontSize: 10, color: T.muted, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3
        },
        miniVal: { fontSize: 13, color: T.text, fontWeight: 600 },
        printBtn: {
            display: "inline-flex", alignItems: "center", gap: 7,
            background: rc.clr, color: "#fff",
            border: "none", borderRadius: 10,
            padding: "9px 20px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: T.ff,
            marginTop: 18,
        },
    };

    return (
        <div style={S.wrap} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={S.card}>
                {/* coloured header */}
                <div style={S.header}>
                    <div style={S.avatar}>{ini}</div>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                    {/* scanned badge */}
                    <span style={{
                        position: "absolute", top: 12, left: 16,
                        background: "rgba(255,255,255,.22)", borderRadius: 20,
                        fontSize: 10, color: "#fff", fontWeight: 700, padding: "3px 10px",
                        display: "flex", alignItems: "center", gap: 5,
                    }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Scanned
                    </span>
                </div>

                <div style={S.body}>
                    {/* name + role */}
                    <div style={S.nameRow}>
                        <div style={S.name}>{emp.name}</div>
                    </div>
                    <div style={S.desig}>{emp.designation || emp.role}</div>
                    <span style={S.rolePill}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: rc.clr, display: "inline-block" }} />
                        {rc.label}
                    </span>

                    {/* ── Account Info ── */}
                    <div style={S.sectionTitle}>Account Information</div>
                    <div style={S.idCard}>
                        <Row label="Employee ID" value={emp.employeeId} mono />
                        <Row label="Email" value={emp.email} />
                        <Row label="Department" value={emp.department} />
                        <Row label="Joining Date" value={emp.joiningDate
                            ? new Date(emp.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
                            : null} />
                        <Row label="Status" value={emp.status?.toUpperCase()} />
                        <Row label="Phone" value={emp.phone} mono />
                        <Row label="Date of Birth" value={emp.dob
                            ? new Date(emp.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : null} />
                        <Row label="Nationality" value={emp.nationality} />
                        <Row label="Marital Status" value={emp.maritalStatus} />
                        <Row label="Guardian Name" value={emp.guardianName} />
                    </div>

                    {/* ── Salary ── */}
                    {emp.salary?.monthly && (
                        <>
                            <div style={S.sectionTitle}>Salary</div>
                            <div style={S.twoCol}>
                                <div style={S.miniCard}>
                                    <div style={S.miniLabel}>Monthly</div>
                                    <div style={{ ...S.miniVal, color: T.success }}>
                                        ₹{Number(emp.salary.monthly).toLocaleString("en-IN")}
                                    </div>
                                </div>
                                <div style={S.miniCard}>
                                    <div style={S.miniLabel}>Per Day</div>
                                    <div style={S.miniVal}>
                                        ₹{Number(emp.salary.perDay).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Gov ID ── */}
                    <div style={S.sectionTitle}>Government ID</div>
                    <div style={S.idCard}>
                        {govId ? (
                            <>
                                {govId.pan && <Row label="PAN" value={govId.pan} mono />}
                                {govId.aadhaar && <Row label="Aadhaar" value={govId.aadhaar} mono />}
                                {!govId.pan && !govId.aadhaar && (
                                    <span style={{ fontSize: 12.5, color: T.warn }}>No government ID on file</span>
                                )}
                            </>
                        ) : (
                            <span style={{ fontSize: 12.5, color: T.warn }}>Not submitted</span>
                        )}
                    </div>

                    {/* ── Bank Details ── */}
                    <div style={S.sectionTitle}>Bank Details</div>
                    <div style={S.idCard}>
                        {bank?.accountNumber ? (
                            <>
                                <Row label="Account Holder" value={bank.accountHolderName} />
                                <Row label="Account Number" value={`••••${bank.accountNumber.slice(-4)}`} mono />
                                <Row label="IFSC Code" value={bank.ifscCode} mono />
                                <Row label="Bank" value={bank.bankName} />
                                <Row label="Branch" value={bank.branchName} />
                                <Row label="Account Type" value={bank.accountType} />
                            </>
                        ) : (
                            <span style={{ fontSize: 12.5, color: T.warn }}>No bank details on file</span>
                        )}
                    </div>

                    {/* ── QR Code ── */}
                    <div style={S.sectionTitle}>Employee QR Code</div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 16,
                        background: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: 12, padding: "14px 16px",
                    }}>
                        <div style={{
                            background: "#fff", padding: 8, borderRadius: 10,
                            border: `2px solid ${rc.clr}22`,
                            boxShadow: "0 2px 8px rgba(0,0,0,.08)", flexShrink: 0,
                        }}>
                            <QRCodeSVG
                                value={`${QR_CODE_URL}/employee/${emp.employeeId || emp._id || "N/A"}`}
                                size={80}
                                fgColor={rc.clr}
                                bgColor="#ffffff"
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                                Scan to verify
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: rc.clr, fontFamily: "monospace", marginBottom: 4 }}>
                                {emp.employeeId || "—"}
                            </div>
                            <div style={{ fontSize: 11.5, color: T.sub, fontWeight: 500 }}>
                                Point HR scanner at this QR to pull up this employee's full profile instantly.
                            </div>
                        </div>
                    </div>

                    {/* ── Completion pills ── */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
                        <StatusPill ok={!!emp.phone} yes="Phone ✓" no="Phone missing" />
                        <StatusPill ok={!!emp.dob} yes="DOB ✓" no="DOB missing" />
                        <StatusPill ok={!!emp.avatar} yes="Photo ✓" no="Photo missing" />
                        <StatusPill ok={!!(govId?.pan || govId?.aadhaar)} yes="Gov ID ✓" no="Gov ID pending" />
                        <StatusPill ok={!!bank?.accountNumber} yes="Bank ✓" no="Bank pending" />
                    </div>

                    {/* print button */}
                    <button style={S.printBtn} onClick={() => window.print()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Print / Export
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 3 — Main EmployeeScanner (exported component)
═══════════════════════════════════════════════════════════ */
export default function EmployeeScanner({ onFound, onEdit }) {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manualId, setManualId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [emp, setEmp] = useState(null);
    const [govId, setGovId] = useState(null);
    const [bank, setBank] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const lastFetchRef = useRef(null);

    /* ── fetch all data for an employee by their DB _id ── */
    const fetchEmployee = useCallback(async (identifier) => {
        if (!identifier?.trim()) return;
        setLoading(true);
        setError(null);
        setEmp(null); setGovId(null); setBank(null);

        try {
            /* search by employeeId field across all users */
            const listRes = await API.get("/users");
            const users = listRes.data.users ?? listRes.data.employees ?? listRes.data.data ?? [];

            /* match by employeeId OR _id OR partial name */
            const match = users.find(
                (u) =>
                    u.employeeId?.toLowerCase() === identifier.toLowerCase() ||
                    u._id === identifier ||
                    u.name?.toLowerCase().includes(identifier.toLowerCase())
            );

            if (!match) {
                setError(`No employee found for "${identifier}"`);
                setLoading(false);
                return;
            }

            setEmp(match);

            /* parallel fetch for gov-id + bank */
            const [govRes, bankRes] = await Promise.allSettled([
                API.get(`/users/${match._id}/government-id`),
                API.get(`/users/${match._id}/bank-details`),
            ]);

            if (govRes.status === "fulfilled") setGovId(govRes.value.data.governmentIds ?? null);
            if (bankRes.status === "fulfilled") setBank(bankRes.value.data.bankDetails ?? null);

            // Always open detail card on search/scan
            setDetailOpen(true);
        } catch (e) {
            setError(e?.response?.data?.message ?? "Failed to load employee.");
        } finally {
            setLoading(false);
        }
    }, [onFound]);

    /* ── called by LiveScanner when a code is detected ── */
    const handleDetected = useCallback((text) => {
        if (lastFetchRef.current === text) return;
        lastFetchRef.current = text;
        setTimeout(() => { lastFetchRef.current = null; }, 3000);

        // extract ID from URL or use plain text directly
        const cleaned = text.includes("/employee/")
            ? text.split("/employee/").pop()
            : text;

        setScannerOpen(false);
        setManualId(cleaned);
        fetchEmployee(cleaned);
    }, [fetchEmployee]);

    const handleManualSearch = () => fetchEmployee(manualId);

    /* ── styles ── */
    const S = {
        wrap: {
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: "20px 22px",
            fontFamily: T.ff, boxShadow: "0 2px 12px rgba(0,0,0,.06)",
        },
        title: {
            fontFamily: "'Syne','Plus Jakarta Sans',sans-serif",
            fontSize: 15, fontWeight: 800, color: T.text,
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
        },
        row: { display: "flex", gap: 10, flexWrap: "wrap" },
        input: {
            flex: 1, minWidth: 180, padding: "10px 14px",
            border: `1.5px solid ${T.border}`, borderRadius: 10,
            fontSize: 13.5, color: T.text, fontFamily: T.ff,
            background: T.bg, outline: "none", transition: "border .15s",
        },
        searchBtn: {
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: T.accent, color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: T.ff, display: "flex", alignItems: "center", gap: 7,
            transition: "all .2s",
        },
        scanBtn: {
            padding: "10px 18px", borderRadius: 10,
            border: `1.5px solid ${T.border}`,
            background: T.surface, color: T.text,
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: T.ff, display: "flex", alignItems: "center", gap: 7,
        },
        divider: {
            display: "flex", alignItems: "center", gap: 10,
            margin: "14px 0", color: T.muted, fontSize: 12, fontWeight: 600,
        },
        errBox: {
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: T.errorLight, border: `1px solid #fecaca`,
            color: "#991b1b", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
        },
        loadBox: {
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: T.accentLight, color: T.accent,
            fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
        },
        successBox: {
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: T.successLight, border: `1px solid #6ee7b7`,
            color: "#065f46", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
        },
    };

    return (
        <>
            <div style={S.wrap}>
                <div style={S.title}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5">
                        <rect x="2" y="5" width="20" height="14" rx="3" />
                        <path d="M8 10h8M8 14h5" />
                    </svg>
                    Employee Lookup
                </div>

                {/* manual input row */}
                <div style={S.row}>
                    <input
                        style={S.input}
                        placeholder="Enter Employee ID (e.g. EMP001)"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                        onFocus={(e) => (e.target.style.borderColor = T.accent)}
                        onBlur={(e) => (e.target.style.borderColor = T.border)}
                    />
                    <button style={S.searchBtn} onClick={handleManualSearch} disabled={loading}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        Search
                    </button>
                </div>

                {/* divider */}
                <div style={S.divider}>
                    <span style={{ flex: 1, height: 1, background: T.border }} />
                    or use live camera
                    <span style={{ flex: 1, height: 1, background: T.border }} />
                </div>

                {/* scan button */}
                <button style={{ ...S.scanBtn, width: "100%", justifyContent: "center" }}
                    onClick={() => setScannerOpen(true)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                    Open Camera Scanner
                    <span style={{ marginLeft: "auto", fontSize: 10, color: T.muted, fontWeight: 600 }}>
                        QR / Barcode / Code128
                    </span>
                </button>

                {/* status feedback */}
                {loading && (
                    <div style={S.loadBox}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ animation: "spin 1s linear infinite" }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Loading employee data…
                    </div>
                )}

                {error && (
                    <div style={S.errBox}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                {emp && !loading && !error && (
                    <div style={S.successBox} onClick={() => setDetailOpen(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {emp.name} ({emp.employeeId}) — click to view details
                    </div>
                )}
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* live camera scanner overlay */}
            {scannerOpen && (
                <LiveScanner
                    onDetected={handleDetected}
                    onClose={() => setScannerOpen(false)}
                />
            )}

            {/* full detail card overlay */}
            {detailOpen && emp && (
                <EmployeeDetailCard
                    emp={emp}
                    govId={govId}
                    bank={bank}
                    onClose={() => setDetailOpen(false)}
                />
            )}
        </>
    );
}

export { EmployeeDetailCard as EmployeeIDCard };