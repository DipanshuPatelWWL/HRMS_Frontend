// ✅ FIXED: AttendanceModal.jsx
// Fixes:
// 1. isHoliday was checking isWeekend — now accepts holidays prop for real holiday check
// 2. isWeekend renamed correctly and separated from isHoliday
// 3. Proper fallback display for weekend vs holiday vs absent

const AttendanceModal = ({ data, onClose, holidays = [] }) => {
    if (!data) return null;

    const formatWorkHours = (decimalHours) => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    // ✅ FIX: Separate weekend check from holiday check
    const isWeekend = (date) => {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    };

    // ✅ FIX: Real holiday check using holidays prop passed from parent
    const isActualHoliday = (date) => {
        if (!holidays || holidays.length === 0) return false;
        return holidays.some(h =>
            new Date(h.date).toDateString() === new Date(date).toDateString()
        );
    };

    const getHolidayName = (date) => {
        if (!holidays || holidays.length === 0) return null;
        const h = holidays.find(h =>
            new Date(h.date).toDateString() === new Date(date).toDateString()
        );
        return h ? h.name : null;
    };

    const weekend = isWeekend(data.date);
    const holiday = isActualHoliday(data.date);
    const holidayName = getHolidayName(data.date);
    const isNonWorkingDay = weekend || holiday;

    const getNonWorkingLabel = () => {
        if (holiday) return `Holiday${holidayName ? ` · ${holidayName}` : ""}`;
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
            value: data.overtime > 0
                ? `${Math.floor(data.overtime / 60)}h ${Math.round(data.overtime % 60)}m`
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

    // ✅ FIX: Correct status badge — holiday and weekend get their own badge
    const getStatusClass = () => {
        if (holiday) return "badge-holiday";
        if (weekend) return "badge-weekend";
        if (data.isHalfDay) return "badge-warn";
        if (data.isLate) return "badge-late";
        const map = {
            present: "badge-success",
            "half-day": "badge-warn",
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
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Attendance Details</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "var(--text-3)", fontSize: "1.25rem", lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>

                <style>{`
                    .badge-holiday {
                        background: #DBEAFE;
                        color: #1E3A8A;
                        padding: 3px 10px;
                        border-radius: 6px;
                        font-size: .72rem;
                        font-weight: 700;
                    }
                    .badge-weekend {
                        background: #F3E8FF;
                        color: #6B21A8;
                        padding: 3px 10px;
                        border-radius: 6px;
                        font-size: .72rem;
                        font-weight: 700;
                    }
                    .badge-late {
                        background: #FEE2E2;
                        color: #7F1D1D;
                        padding: 3px 10px;
                        border-radius: 6px;
                        font-size: .72rem;
                        font-weight: 700;
                    }
                `}</style>

                <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                    {rows.map(r => (
                        <div
                            key={r.label}
                            style={{
                                display: "flex", justifyContent: "space-between",
                                alignItems: "center", fontSize: ".875rem",
                            }}
                        >
                            <span style={{ color: "var(--text-3)" }}>{r.label}</span>
                            {r.label === "Status" ? (
                                <span className={getStatusClass()}>{getStatusLabel()}</span>
                            ) : (
                                <span style={{ fontWeight: 500, color: "var(--text-1)" }}>
                                    {r.value}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                    <button onClick={onClose} className="btn btn-ghost" style={{ width: "100%" }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;