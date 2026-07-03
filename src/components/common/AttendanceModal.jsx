const AttendanceModal = ({ data, onClose, holidays = [] }) => {
    if (!data) return null;

    const formatWorkHours = (decimalHours) => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    const isWeekend = (date) => {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    };

    const isActualHoliday = (date) => {
        if (!holidays || holidays.length === 0) return false;

        return holidays.some(
            h =>
                new Date(h.date).toDateString() ===
                new Date(date).toDateString()
        );
    };

    const getHolidayName = (date) => {
        if (!holidays || holidays.length === 0) return null;

        const h = holidays.find(
            h =>
                new Date(h.date).toDateString() ===
                new Date(date).toDateString()
        );

        return h ? h.name : null;
    };

    const holiday = isActualHoliday(data.date);
    const weekend = isWeekend(data.date);
    const holidayName = getHolidayName(data.date);

    const isNonWorkingDay = holiday || weekend;

    const getNonWorkingLabel = () => {
        if (holiday)
            return `Holiday${holidayName ? ` · ${holidayName}` : ""}`;

        if (weekend) return "Weekend";

        return "—";
    };

    const rows = [
        {
            label: "Date",
            value: new Date(data.date).toDateString(),
        },
        {
            label: "Day Type",
            value: holiday
                ? `🎉 Holiday${holidayName ? ` (${holidayName})` : ""}`
                : weekend
                    ? "📅 Weekend"
                    : "📋 Working Day",
        },
        {
            label: "Status",
            value: data.status
                ? data.status
                : holiday
                    ? "Holiday"
                    : weekend
                        ? "Weekend"
                        : "Absent",
        },
        {
            label: "Punch In",
            value: data.punchIn
                ? new Date(data.punchIn).toLocaleTimeString()
                : isNonWorkingDay
                    ? getNonWorkingLabel()
                    : "—",
        },
        {
            label: "Punch Out",
            value: data.punchOut
                ? new Date(data.punchOut).toLocaleTimeString()
                : isNonWorkingDay
                    ? getNonWorkingLabel()
                    : "—",
        },
        {
            label: "Work Hours",
            value: data.workHours
                ? formatWorkHours(data.workHours)
                : isNonWorkingDay
                    ? getNonWorkingLabel()
                    : "—",
        },
        {
            label: "Overtime",
            value:
                data.overtime > 0
                    ? `${Math.floor(data.overtime / 60)}h ${Math.round(
                        data.overtime % 60
                    )}m`
                    : isNonWorkingDay
                        ? "—"
                        : "None",
        },
        {
            label: "Late",
            value: data.isLate
                ? `Yes (+${data.lateMinutes} min)`
                : isNonWorkingDay
                    ? "—"
                    : "No",
        },
        {
            label: "Half Day",
            value: isNonWorkingDay
                ? "—"
                : data.isHalfDay
                    ? "Yes"
                    : "No",
        },
        {
            label: "Location Accuracy",
            value: data.location?.accuracy
                ? `±${Math.round(data.location.accuracy)}m`
                : "—",
        },
        {
            label: "Offline Punch",
            value: isNonWorkingDay
                ? "—"
                : data.isOfflinePunch
                    ? "Yes (synced)"
                    : "No",
        },
    ];
const getStatusBadge = () => {
    if (data.status === "leave" || data.onLeave) return "badge-leave";
    if (holiday) return "badge-holiday";
    if (weekend) return "badge-weekend";
    if (data.isHalfDay) return "badge-warn";
    if (data.isShortLeave) return "badge-neutral";
    if (data.eightHourPassUsed) return "badge-success";
    if (data.isLate) return "badge-late";

    const map = {
        present: "badge-success",
        "half-day": "badge-warn",
        "short-leave": "badge-neutral",
        absent: "badge-absent",
    };

    return map[data.status] || "badge-absent";
};

const getStatusLabel = () => {
    if (data.status === "leave" || data.onLeave) return "On Leave";
    if (holiday) return holidayName || "Holiday";
    if (weekend) return "Weekend";
    if (data.isHalfDay) return "Half Day";
    if (data.isShortLeave) return "Short Leave";
    if (data.eightHourPassUsed) return "Present (8h Pass)";
    if (data.isLate) return "Late";

    return data.status ? (data.status.charAt(0).toUpperCase() + data.status.slice(1).replace("-", " ")) : "Absent";
};

    const STATUS_COLORS = {
        present: { solid: "#22C55E", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
        late: { solid: "#F97316", bg: "#FFEDD5", border: "#FDBA74", text: "#7C2D12" },
        halfday: { solid: "#EAB308", bg: "#FEF9C3", border: "#FDE047", text: "#713F12" },
        absent: { solid: "#3B82F6", bg: "#DBEAFE", border: "#93C5FD", text: "#1E3A8A" },
        holiday: { solid: "#A855F7", bg: "#F3E8FF", border: "#D8B4FE", text: "#581C87" },
        weekend: { solid: "#818CF8", bg: "#EEF2FF", border: "#C7D2FE", text: "#3730A3" },
        leave: { solid: "#EC4899", bg: "#FCE7F3", border: "#F9A8D4", text: "#831843" }
    };

    return (
        <div
            className="modal-backdrop"
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,.45)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "16px",
            }}
        >
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "560px",
                    background: "var(--surface)",
                    borderRadius: window.innerWidth < 640 ? "18px" : "24px",
                    padding: window.innerWidth < 640 ? "18px" : "28px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 10px 30px rgba(0,0,0,.3)",
                    border: "1px solid var(--border)",
                    animation: "modalPop .18s ease",
                }}
            >
                <style>{`
                    @keyframes modalPop {
                        from {
                            opacity: 0;
                            transform: scale(.96) translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }

                    .badge-success{
                        background:${STATUS_COLORS.present.bg};
                        color:${STATUS_COLORS.present.text};
                        border: 1px solid ${STATUS_COLORS.present.border};
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-absent{
                        background:${STATUS_COLORS.absent.bg};
                        color:${STATUS_COLORS.absent.text};
                        border: 1px solid ${STATUS_COLORS.absent.border};
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-warn{
                        background:${STATUS_COLORS.halfday.bg};
                        color:${STATUS_COLORS.halfday.text};
                        border: 1px solid ${STATUS_COLORS.halfday.border};
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-late{
                        background:${STATUS_COLORS.late.bg};
                        color:${STATUS_COLORS.late.text};
                        border: 1px solid ${STATUS_COLORS.late.border};
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-holiday{
                        background:${STATUS_COLORS.holiday.bg};
                        color:${STATUS_COLORS.holiday.text};
                        border: 1px solid ${STATUS_COLORS.holiday.border};
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-weekend{
                        background:${STATUS_COLORS.weekend.bg};
                        color:${STATUS_COLORS.weekend.text};
                        border: 1px solid ${STATUS_COLORS.weekend.border};
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-neutral{
                        background:var(--surface-2);
                        color:var(--text-2);
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    @media(max-width:640px){

                        .modal{
                            width:100% !important;
                            max-width:100% !important;
                            border-radius:18px !important;
                            padding:18px !important;
                            margin:0 4px;
                        }

                        .attendance-row{
                            flex-direction:column;
                            align-items:flex-start !important;
                            gap:7px !important;
                            padding:12px 0 !important;
                        }

                        .attendance-value{
                            text-align:left !important;
                            width:100%;
                            font-size:.88rem !important;
                            line-height:1.45;
                        }

                        .attendance-label{
                            min-width:auto !important;
                            font-size:.8rem !important;
                        }

                        .modal-title-mobile{
                            font-size:1.05rem !important;
                        }

                        .modal-subtitle-mobile{
                            font-size:.75rem !important;
                        }

                        .modal-close-btn{
                            width:34px !important;
                            height:34px !important;
                            font-size:1rem !important;
                        }

                        .modal-close-footer{
                            padding:11px !important;
                            font-size:.88rem !important;
                        }
                    }
                `}</style>

                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        gap: "12px",
                    }}
                >
                    <div>
                        <h2
                            className="modal-title-mobile"
                            style={{
                                fontSize: "1.25rem",
                                fontWeight: 700,
                                color: "var(--text-1)",
                            }}
                        >
                            Attendance Details
                        </h2>

                        <p
                            className="modal-subtitle-mobile"
                            style={{
                                marginTop: "4px",
                                fontSize: ".82rem",
                                color: "var(--text-2)",
                            }}
                        >
                            Complete attendance information
                        </p>
                    </div>

                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "12px",
                            border: "none",
                            background: "var(--surface-3)",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            color: "var(--text-2)",
                            fontWeight: 700,
                            flexShrink: 0,
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* ROWS */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                    }}
                >
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className="attendance-row"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: "18px",
                                padding: "14px 0",
                                borderBottom: "1px solid var(--border)",
                            }}
                        >
                            <span
                                className="attendance-label"
                                style={{
                                    minWidth: "145px",
                                    fontSize: ".88rem",
                                    fontWeight: 600,
                                    color: "var(--text-2)",
                                    flexShrink: 0,
                                }}
                            >
                                {r.label}
                            </span>

                            {r.label === "Status" ? (
                                <span className={getStatusBadge()}>
                                    {getStatusLabel()}
                                </span>
                            ) : (
                                <span
                                    className="attendance-value"
                                    style={{
                                        fontSize: ".92rem",
                                        fontWeight: 600,
                                        color: "var(--text-1)",
                                        textAlign: "right",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {r.value}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div style={{ marginTop: "26px" }}>
                    <button
                        className="modal-close-footer"
                        onClick={onClose}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "14px",
                            border: "none",
                            background: "var(--brand)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: ".92rem",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;