import { useEffect, useState } from "react";
import {
    ClipboardEdit,
    Info,
    CalendarDays,
    LogIn,
    LogOut,
    ArrowRightLeft,
    FileText,
    Send,
    Undo2,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    MessageSquare,
    AlertCircle,
    ListChecks,
} from "lucide-react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ─── Constants ─────────────────────────────────────────────────── */
const TYPE_LABELS = {
    punch_in: "Punch In",
    punch_out: "Punch Out",
    both: "Both (Punch In & Out)",
};

const TYPE_ICON = {
    punch_in: <LogIn size={13} strokeWidth={2.2} />,
    punch_out: <LogOut size={13} strokeWidth={2.2} />,
    both: <ArrowRightLeft size={13} strokeWidth={2.2} />,
};

const STATUS_MAP = {
    pending: { cls: "badge-warn", label: "Pending", Icon: Clock },
    approved: { cls: "badge-success", label: "Approved", Icon: CheckCircle2 },
    rejected: { cls: "badge-danger", label: "Rejected", Icon: XCircle },
};

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

const EMPTY_FORM = {
    type: "punch_out",
    date: "",
    requestedPunchIn: "",
    requestedPunchOut: "",
    reason: "",
};

/* ─── Component ─────────────────────────────────────────────────── */
const AttendanceCorrectionRequest = () => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [corrections, setCorrections] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    const fetchMine = async () => {
        try {
            const res = await API.get("/attendance-corrections/my");
            setCorrections(res.data.corrections || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchMine();
        // trigger mount animation
        const t = setTimeout(() => setMounted(true), 30);
        return () => clearTimeout(t);
    }, []);

    const needsPunchIn = form.type === "punch_in" || form.type === "both";
    const needsPunchOut = form.type === "punch_out" || form.type === "both";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setSuccess(""); setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); setSuccess(""); setError("");
        try {
            const payload = { type: form.type, date: form.date, reason: form.reason };
            if (needsPunchIn) payload.requestedPunchIn = `${form.date}T${form.requestedPunchIn}`;
            if (needsPunchOut) payload.requestedPunchOut = `${form.date}T${form.requestedPunchOut}`;
            await API.post("/attendance-corrections", payload);
            setSuccess("Correction request submitted. HR will review it shortly.");
            setForm(EMPTY_FORM);
            fetchMine();
        } catch (err) {
            setError(err.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async (id) => {
        if (!confirm("Withdraw this request?")) return;
        try {
            await API.delete(`/attendance-corrections/${id}`);
            fetchMine();
        } catch (err) {
            alert(err.response?.data?.message || "Could not withdraw");
        }
    };

    /* ────────────────────────────────────────────────────────────── */
    return (
        <DashboardLayout>
            <style>{`
                /* ── Keyframes ─────────────────────────────────────── */
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes shimmer {
                    0%   { background-position: -400px 0; }
                    100% { background-position:  400px 0; }
                }
                @keyframes popIn {
                    0%   { transform: scale(.88); opacity: 0; }
                    70%  { transform: scale(1.03); }
                    100% { transform: scale(1);   opacity: 1; }
                }

                /* ── Page entrance ─────────────────────────────────── */
                .corr-page-enter {
                    opacity: 0;
                    transform: translateY(12px);
                    transition: opacity .45s ease, transform .45s ease;
                }
                .corr-page-enter.mounted {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* ── Grid ──────────────────────────────────────────── */
                .corr-grid {
                    display: grid;
                    grid-template-columns: 380px 1fr;
                    gap: 1.25rem;
                    align-items: start;
                }
                @media (max-width: 960px) {
                    .corr-grid { grid-template-columns: 1fr; }
                }

                /* ── Info banner ───────────────────────────────────── */
                .corr-info-banner {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    background: #e0f2fe;
                    border: 1px solid #7dd3fc;
                    border-radius: 9px;
                    padding: 11px 14px;
                    font-size: .82rem;
                    color: #0c4a6e;
                    font-weight: 500;
                    margin-bottom: 1.1rem;
                    animation: fadeIn .5s ease both;
                }
                .corr-info-banner svg {
                    flex-shrink: 0;
                    margin-top: 1px;
                    color: #0284c7;
                }

                /* ── Form labels ───────────────────────────────────── */
                .corr-form-label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: .82rem;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: .35rem;
                }
                .corr-form-label svg { color: #374151; }
                .corr-req { color: #dc2626; margin-left: 1px; }

                /* ── Feedback banners ──────────────────────────────── */
                .corr-feedback {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-radius: 8px;
                    padding: .6rem .9rem;
                    font-size: .84rem;
                    font-weight: 500;
                    animation: popIn .25s ease both;
                }
                .corr-feedback.success {
                    background: #f0fdf4;
                    color: #14532d;
                    border: 1px solid #86efac;
                }
                .corr-feedback.err {
                    background: #fef2f2;
                    color: #7f1d1d;
                    border: 1px solid #fca5a5;
                }

                /* ── Submit button ─────────────────────────────────── */
                .corr-submit-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: .45rem;
                    transition: transform .15s ease, box-shadow .15s ease;
                }
                .corr-submit-btn:not(:disabled):hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(0,0,0,.15);
                }
                .corr-submit-btn:not(:disabled):active {
                    transform: translateY(0);
                }

                /* ── My Requests scrollable panel ──────────────────── */
                .corr-list-scroll {
                    max-height: 600px;
                    overflow-y: auto;
                    padding-right: 4px;
                    display: flex;
                    flex-direction: column;
                    gap: .8rem;
                    /* custom scrollbar */
                    scrollbar-width: thin;
                    scrollbar-color: #d1d5db transparent;
                }
                .corr-list-scroll::-webkit-scrollbar { width: 5px; }
                .corr-list-scroll::-webkit-scrollbar-track { background: transparent; }
                .corr-list-scroll::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }
                @media (max-width: 960px) {
                    .corr-list-scroll { max-height: 420px; }
                }

                /* ── Correction item card ──────────────────────────── */
                .corr-item {
                    border: 1.5px solid #d1d5db;
                    border-radius: 10px;
                    padding: 1rem 1.1rem;
                    background: #fff;
                    transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
                    animation: fadeSlideUp .35s ease both;
                }
                .corr-item:hover {
                    border-color: #6b7280;
                    box-shadow: 0 4px 16px rgba(0,0,0,.1);
                    transform: translateY(-2px);
                }

                /* staggered entrance */
                .corr-item:nth-child(1) { animation-delay: .04s; }
                .corr-item:nth-child(2) { animation-delay: .09s; }
                .corr-item:nth-child(3) { animation-delay: .14s; }
                .corr-item:nth-child(4) { animation-delay: .19s; }
                .corr-item:nth-child(5) { animation-delay: .24s; }
                .corr-item:nth-child(6) { animation-delay: .29s; }

                .corr-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: .6rem;
                    margin-bottom: .6rem;
                }
                .corr-item-title {
                    font-size: .92rem;
                    font-weight: 700;
                    color: #111827;
                    display: flex;
                    align-items: center;
                    gap: .4rem;
                    flex-wrap: wrap;
                }
                .corr-item-title svg { color: #374151; flex-shrink: 0; }
                .corr-item-sub {
                    font-size: .78rem;
                    color: #4b5563;
                    font-weight: 500;
                    margin-top: .2rem;
                    display: flex;
                    align-items: center;
                    gap: .3rem;
                }
                .corr-item-sub svg { color: #6b7280; }

                /* ── Time chips ────────────────────────────────────── */
                .corr-times {
                    display: flex;
                    gap: .6rem;
                    flex-wrap: wrap;
                    margin: .55rem 0;
                }
                .time-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-family: ui-monospace, "Cascadia Code", monospace;
                    font-size: .79rem;
                    font-weight: 600;
                    background: #f3f4f6;
                    border: 1px solid #d1d5db;
                    padding: 3px 10px;
                    border-radius: 6px;
                    color: #111827;
                    transition: background .15s, border-color .15s;
                }
                .corr-item:hover .time-chip {
                    background: #e5e7eb;
                    border-color: #9ca3af;
                }

                /* ── Reason text ───────────────────────────────────── */
                .corr-reason {
                    font-size: .81rem;
                    color: #374151;
                    font-weight: 500;
                    display: flex;
                    align-items: flex-start;
                    gap: .35rem;
                    line-height: 1.45;
                }
                .corr-reason svg { flex-shrink: 0; margin-top: 2px; color: #6b7280; }

                /* ── Approved correction line ──────────────────────── */
                .corr-approved-line {
                    display: flex;
                    align-items: center;
                    gap: .4rem;
                    flex-wrap: wrap;
                    font-size: .78rem;
                    font-weight: 600;
                    color: #14532d;
                    background: #f0fdf4;
                    border: 1px solid #86efac;
                    border-radius: 6px;
                    padding: .35rem .7rem;
                    margin-top: .5rem;
                }
                .corr-approved-line svg { flex-shrink: 0; color: #16a34a; }

                /* ── Rejected remark ───────────────────────────────── */
                .corr-remark {
                    display: flex;
                    align-items: flex-start;
                    gap: .4rem;
                    font-size: .78rem;
                    font-weight: 500;
                    color: #7f1d1d;
                    background: #fef2f2;
                    border: 1px solid #fca5a5;
                    border-radius: 6px;
                    padding: .35rem .7rem;
                    margin-top: .5rem;
                    font-style: italic;
                }
                .corr-remark svg { flex-shrink: 0; margin-top: 1px; color: #dc2626; }

                /* ── Withdraw button ───────────────────────────────── */
                .corr-withdraw-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: .35rem;
                    font-size: .78rem;
                    font-weight: 600;
                    color: #374151;
                    border: 1.5px solid #d1d5db;
                    border-radius: 7px;
                    padding: .3rem .7rem;
                    background: #fff;
                    cursor: pointer;
                    margin-top: .6rem;
                    transition: border-color .15s, color .15s, background .15s, transform .15s;
                }
                .corr-withdraw-btn:hover {
                    border-color: #dc2626;
                    color: #dc2626;
                    background: #fff5f5;
                    transform: translateY(-1px);
                }
                .corr-withdraw-btn:active { transform: translateY(0); }

                /* ── Badge with icon ───────────────────────────────── */
                .badge-icon {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                /* ── Empty state ───────────────────────────────────── */
                .corr-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: .65rem;
                    padding: 3rem 0 2rem;
                    color: #6b7280;
                    animation: fadeIn .4s ease;
                }
                .corr-empty svg { opacity: .25; }
                .corr-empty p {
                    font-size: .9rem;
                    font-weight: 500;
                    color: #374151;
                    margin: 0;
                }

                /* ── Section heading ───────────────────────────────── */
                .corr-section-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #111827;
                    display: flex;
                    align-items: center;
                    gap: .45rem;
                    margin-bottom: 1.1rem;
                }
                .corr-section-title svg { color: #374151; }

                /* ── Count badge ───────────────────────────────────── */
                .corr-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 22px;
                    height: 22px;
                    background: #1f2937;
                    color: #fff;
                    border-radius: 20px;
                    font-size: .72rem;
                    font-weight: 700;
                    padding: 0 6px;
                    margin-left: 2px;
                }
            `}</style>

            <div className={`corr-page-enter${mounted ? " mounted" : ""}`}>
                <div className="page-header">
                    <h1>Attendance Correction</h1>
                    <p>Request a fix for a missing or incorrect punch time</p>
                </div>

                <div className="corr-grid">

                    {/* ── Form ────────────────────────────────────────── */}
                    <div className="card">
                        <p className="corr-section-title">
                            <ClipboardEdit size={16} strokeWidth={2.2} />
                            New Request
                        </p>

                        {/* Info banner */}
                        <div className="corr-info-banner">
                            <Info size={15} strokeWidth={2.2} />
                            <span>
                                Your request goes to HR for review. Once approved, your attendance
                                record is automatically updated — no manual editing needed.
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>

                            {/* Correction type */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="corr-form-label">
                                    <ArrowRightLeft size={13} strokeWidth={2.2} />
                                    Correction type
                                </label>
                                <select name="type" className="input select" value={form.type} onChange={handleChange}>
                                    <option value="punch_in">Punch In — fix / add check-in time</option>
                                    <option value="punch_out">Punch Out — fix / add check-out time</option>
                                    <option value="both">Both — fix both check-in and check-out</option>
                                </select>
                            </div>

                            {/* Date */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="corr-form-label">
                                    <CalendarDays size={13} strokeWidth={2.2} />
                                    Date <span className="corr-req">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    className="input"
                                    value={form.date}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Punch-in time */}
                            {needsPunchIn && (
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="corr-form-label">
                                        <LogIn size={13} strokeWidth={2.2} />
                                        Correct punch-in time <span className="corr-req">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="requestedPunchIn"
                                        className="input"
                                        value={form.requestedPunchIn}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* Punch-out time */}
                            {needsPunchOut && (
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="corr-form-label">
                                        <LogOut size={13} strokeWidth={2.2} />
                                        Correct punch-out time <span className="corr-req">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="requestedPunchOut"
                                        className="input"
                                        value={form.requestedPunchOut}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* Reason */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="corr-form-label">
                                    <FileText size={13} strokeWidth={2.2} />
                                    Reason <span className="corr-req">*</span>
                                </label>
                                <input
                                    name="reason"
                                    className="input"
                                    placeholder="e.g. Forgot to punch out"
                                    value={form.reason}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Success */}
                            {success && (
                                <div className="corr-feedback success">
                                    <CheckCircle2 size={15} strokeWidth={2.2} />
                                    {success}
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="corr-feedback err">
                                    <AlertCircle size={15} strokeWidth={2.2} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary corr-submit-btn"
                                disabled={submitting}
                            >
                                <Send size={14} strokeWidth={2.2} />
                                {submitting ? "Submitting…" : "Submit Request"}
                            </button>
                        </form>
                    </div>

                    {/* ── My Requests list ────────────────────────────── */}
                    <div className="card">
                        <p className="corr-section-title">
                            <ListChecks size={16} strokeWidth={2.2} />
                            My Requests
                            {corrections.length > 0 && (
                                <span className="corr-count">{corrections.length}</span>
                            )}
                        </p>

                        {corrections.length === 0 ? (
                            <div className="corr-empty">
                                <ListChecks size={44} strokeWidth={1.4} />
                                <p>No correction requests yet</p>
                            </div>
                        ) : (
                            <div className="corr-list-scroll">
                                {corrections.map((c) => {
                                    const badge = STATUS_MAP[c.status] || STATUS_MAP.pending;
                                    const BadgeIcon = badge.Icon;
                                    return (
                                        <div key={c._id} className="corr-item">
                                            {/* Header */}
                                            <div className="corr-item-header">
                                                <div>
                                                    <p className="corr-item-title">
                                                        {TYPE_ICON[c.type]}
                                                        {TYPE_LABELS[c.type]} — {fmtDate(c.date)}
                                                    </p>
                                                    <p className="corr-item-sub">
                                                        <CalendarDays size={11} strokeWidth={2} />
                                                        Raised {fmtDate(c.createdAt)}
                                                    </p>
                                                </div>
                                                <span className={`badge badge-icon ${badge.cls}`}>
                                                    <BadgeIcon size={11} strokeWidth={2.5} />
                                                    {badge.label}
                                                </span>
                                            </div>

                                            {/* Time chips */}
                                            {(c.requestedPunchIn || c.requestedPunchOut) && (
                                                <div className="corr-times">
                                                    {c.requestedPunchIn && (
                                                        <span className="time-chip">
                                                            <LogIn size={11} strokeWidth={2.2} />
                                                            {fmtTime(c.requestedPunchIn)}
                                                        </span>
                                                    )}
                                                    {c.requestedPunchOut && (
                                                        <span className="time-chip">
                                                            <LogOut size={11} strokeWidth={2.2} />
                                                            {fmtTime(c.requestedPunchOut)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reason */}
                                            <p className="corr-reason">
                                                <MessageSquare size={12} strokeWidth={2} />
                                                {c.reason}
                                            </p>

                                            {/* Approved: correction line */}
                                            {c.status === "approved" && c.originalPunchIn !== undefined && (
                                                <div className="corr-approved-line">
                                                    <CheckCircle2 size={13} strokeWidth={2.2} />
                                                    Corrected:&nbsp;
                                                    <span style={{ fontFamily: "monospace" }}>
                                                        {fmtTime(c.originalPunchIn)}
                                                    </span>
                                                    <ArrowRight size={12} strokeWidth={2.2} />
                                                    <span style={{ fontFamily: "monospace" }}>
                                                        {fmtTime(c.requestedPunchIn || c.originalPunchIn)}
                                                    </span>
                                                    {c.requestedPunchOut && (
                                                        <>
                                                            &nbsp;·&nbsp;
                                                            <span style={{ fontFamily: "monospace" }}>
                                                                {fmtTime(c.originalPunchOut)}
                                                            </span>
                                                            <ArrowRight size={12} strokeWidth={2.2} />
                                                            <span style={{ fontFamily: "monospace" }}>
                                                                {fmtTime(c.requestedPunchOut)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Rejected: HR remark */}
                                            {c.status === "rejected" && c.hrRemark && (
                                                <div className="corr-remark">
                                                    <XCircle size={12} strokeWidth={2.2} />
                                                    HR: {c.hrRemark}
                                                </div>
                                            )}

                                            {/* Pending: withdraw */}
                                            {c.status === "pending" && (
                                                <button
                                                    onClick={() => handleWithdraw(c._id)}
                                                    className="corr-withdraw-btn"
                                                >
                                                    <Undo2 size={13} strokeWidth={2.2} />
                                                    Withdraw
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AttendanceCorrectionRequest;