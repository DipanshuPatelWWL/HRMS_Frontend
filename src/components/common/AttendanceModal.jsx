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

    const getStatusClass = () => {
        if (holiday) return "badge-holiday";
        if (weekend) return "badge-weekend";
        if (data.isHalfDay) return "badge-warn";
        if (data.isLate) return "badge-late";

        const map = {
            present: "badge-success",
            absent: "badge-danger",
        };

        return map[data.status] || "badge-neutral";
    };

    const getStatusLabel = () => {
        if (holiday) return holidayName || "Holiday";
        if (weekend) return "Weekend";
        if (data.isHalfDay) return "Half Day";
        if (data.isLate) return "Late";

        return data.status || "Absent";
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
                    background: "#fff",
                    borderRadius: window.innerWidth < 640 ? "18px" : "24px",
                    padding: window.innerWidth < 640 ? "18px" : "28px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 25px 50px rgba(0,0,0,.18)",
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
                        background:#DCFCE7;
                        color:#166534;
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-danger{
                        background:#FEE2E2;
                        color:#991B1B;
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-warn{
                        background:#FEF3C7;
                        color:#92400E;
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-late{
                        background:#FEE2E2;
                        color:#B91C1C;
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-holiday{
                        background:#DBEAFE;
                        color:#1D4ED8;
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-weekend{
                        background:#F3E8FF;
                        color:#7E22CE;
                        padding:4px 12px;
                        border-radius:999px;
                        font-size:.72rem;
                        font-weight:700;
                    }

                    .badge-neutral{
                        background:#E5E7EB;
                        color:#374151;
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
                                color: "#111827",
                            }}
                        >
                            Attendance Details
                        </h2>

                        <p
                            className="modal-subtitle-mobile"
                            style={{
                                marginTop: "4px",
                                fontSize: ".82rem",
                                color: "#6B7280",
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
                            background: "#F3F4F6",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            color: "#6B7280",
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
                                borderBottom: "1px solid #F1F5F9",
                            }}
                        >
                            <span
                                className="attendance-label"
                                style={{
                                    minWidth: "145px",
                                    fontSize: ".88rem",
                                    fontWeight: 600,
                                    color: "#64748B",
                                    flexShrink: 0,
                                }}
                            >
                                {r.label}
                            </span>

                            {r.label === "Status" ? (
                                <span className={getStatusClass()}>
                                    {getStatusLabel()}
                                </span>
                            ) : (
                                <span
                                    className="attendance-value"
                                    style={{
                                        fontSize: ".92rem",
                                        fontWeight: 600,
                                        color: "#111827",
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
                            background: "#111827",
                            color: "#fff",
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