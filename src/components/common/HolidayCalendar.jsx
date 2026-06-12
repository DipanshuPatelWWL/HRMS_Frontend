import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../../services/api";
import { useTheme } from "../../hooks/useTheme";

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
const Icons = {
    CalendarDays: ({ size = 18 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
    ),
    ChevronLeft: ({ size = 15 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    ),
    ChevronRight: ({ size = 15 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    Info: ({ size = 22 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    Sun: ({ size = 15 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    ),
    Clock: ({ size = 13 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
        </svg>
    ),
    History: ({ size = 13 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    ),
    Gift: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
    ),
    Empty: ({ size = 38 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 15h8M8 18h5" />
        </svg>
    ),
    Dot: ({ color = "#ef4444" }) => (
        <span style={{
            display: "inline-block", width: 7, height: 7,
            borderRadius: "50%", background: color, flexShrink: 0,
        }} />
    ),
};

/* ─── Inject Styles ──────────────────────────────────────────────────────── */
const injectStyles = () => {
    let s = document.head.querySelector("style[data-hc2]");
    if (!s) {
        s = document.createElement("style");
        s.setAttribute("data-hc2", "1");
        document.head.appendChild(s);
    }
    s.textContent = `
    @keyframes hc2-rise { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
    @keyframes hc2-pop  { 0%{transform:scale(.95);opacity:0} 70%{transform:scale(1.01)} 100%{transform:scale(1);opacity:1} }

    .hc2-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
    .hc2-rise  { animation: hc2-rise .38s cubic-bezier(.22,1,.36,1) both; }

    /* ── Calendar card ── */
   .hc2-cal-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 18px;
    padding: 20px;
    box-shadow: var(--shadow-md);
}
    .hc2-cal-card .react-calendar {
        width: 100%;
        border: none;
        background: transparent;
        font-family: 'Plus Jakarta Sans', sans-serif;
        line-height: 1.4;
    }

    /* Navigation */
    .hc2-cal-card .react-calendar__navigation {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        gap: 6px;
        height: auto;
    }
   .hc2-cal-card .react-calendar__navigation button {
    background: var(--surface-3);
    border: 2px solid var(--border);
    border-radius: 9px;
    min-width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-1);
    padding: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .13s, border-color .13s;
}
.hc2-cal-card .react-calendar__navigation button:hover:not(:disabled) {
    background: var(--surface-2);
    border-color: #1D9E75;
    color: #1D9E75;
}
    .hc2-cal-card .react-calendar__navigation button:disabled {
        opacity: .35;
        cursor: not-allowed;
    }
  .hc2-cal-card .react-calendar__navigation__label {
    flex: 1;
    font-size: clamp(13px, 2.5vw, 15.5px);
    font-weight: 800;
    color: var(--text-1);
    border: none !important;
    background: none !important;
    pointer-events: none;
    cursor: default;
    letter-spacing: -.01em;
}

    /* Weekday headers */
    .hc2-cal-card .react-calendar__month-view__weekdays {
        margin-bottom: 4px;
    }
   .hc2-cal-card .react-calendar__month-view__weekdays__weekday {
    padding: 6px 0;
    text-align: center;
    font-size: clamp(9px, 1.8vw, 11px);
    font-weight: 800;
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: .07em;
}
    .hc2-cal-card .react-calendar__month-view__weekdays__weekday abbr {
        text-decoration: none;
    }

    /* Day tiles */
    .hc2-cal-card .react-calendar__tile {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: none;
        border: 2px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: clamp(11px, 2vw, 13.5px);
        font-weight: 600;
       color: var(--text-1);
        padding: clamp(4px, 1.5vw, 7px) 2px;
        transition: background .12s, color .12s, border-color .12s;
        aspect-ratio: 1;
        height: auto;
        min-height: 36px;
        -webkit-tap-highlight-color: transparent;
    }
        /* Reset react-calendar default tile styles */
.hc2-cal-card .react-calendar__tile:enabled:hover,
.hc2-cal-card .react-calendar__tile:enabled:focus {
    background: var(--surface-3);
    outline: none;
}
.hc2-cal-card .react-calendar button {
    outline: none;
}
  .hc2-cal-card .react-calendar__tile:hover:not(.react-calendar__tile--active) {
    background: var(--surface-3);
    border-color: var(--border-strong);
}

    /* SAT & SUN header labels → red */
   .hc2-cal-card .react-calendar__month-view__weekdays__weekday:nth-child(6) abbr,
.hc2-cal-card .react-calendar__month-view__weekdays__weekday:last-child abbr {
   color: var(--danger);
}

    /* Today */
 .hc2-cal-card .react-calendar__tile--now:not(.react-calendar__tile--active) {
    background: var(--brand-light);
    color: var(--brand);
    font-weight: 800;
    border-color: var(--border-strong);
}

    /* Active/selected */
    .hc2-cal-card .react-calendar__tile--active,
    .hc2-cal-card .react-calendar__tile--active:hover {
        background: #1D9E75 !important;
        color: #ffffff !important;
        font-weight: 800;
        border-color: #1D9E75 !important;
        border-radius: 10px;
    }

    /* Neighbouring month */
   .hc2-cal-card .react-calendar__month-view__days__day--neighboringMonth {
    color: var(--text-3);
    font-weight: 400;
}
    /* Weekend */
.hc2-cal-card .hc2-weekend:not(.react-calendar__tile--active) {
    color: var(--danger);
    background: transparent;
}
.hc2-cal-card .hc2-weekend:not(.react-calendar__tile--active):hover {
    background: var(--surface-3);
    border-color: var(--danger);
}

    /* Holiday */
  .hc2-cal-card .hc2-holiday:not(.react-calendar__tile--active) {
    background: var(--danger-bg);
    color: var(--danger);
    font-weight: 800;
    border-color: var(--border-strong);
}
.hc2-cal-card .hc2-holiday:not(.react-calendar__tile--active):hover {
    background: var(--danger-bg);
    border-color: var(--danger);
}

    /* Holiday dot */
    .hc2-tile-dot {
        display: block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #ef4444;
        margin-top: 2px;
        flex-shrink: 0;
    }
    .react-calendar__tile--active .hc2-tile-dot {
        background: rgba(255,255,255,.8);
    }

    /* ── Cards ── */
 .hc2-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 16px 18px;
    box-shadow: var(--shadow-sm);
    transition: border-color .18s;
}
.hc2-card:hover { border-color: var(--border-strong); }

    /* ── List item ── */
    .hc2-list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 0;
       border-bottom: 1.5px solid var(--border);
        transition: background .12s;
        gap: 8px;
    }
    .hc2-list-item:last-child { border-bottom: none; }

    /* ── Section label ── */
    .hc2-section-label {
        font-size: 10.5px;
        font-weight: 800;
          color: var(--text-2);
        text-transform: uppercase;
        letter-spacing: .09em;
        margin: 0 0 8px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    /* ── Responsive: grid layout ── */
    .hc2-main-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 18px;
        align-items: start;
    }

    /* ── Responsive: sidebar row on mobile ── */
    .hc2-sidebar {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    /* ── Page header ── */
    .hc2-page-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 26px;
        flex-wrap: wrap;
    }

    /* ── Legend ── */
    .hc2-legend {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 2px solid var(--border);
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    /* ── Tablet: 768px ── */
    @media (max-width: 768px) {
        .hc2-main-grid {
            grid-template-columns: 1fr;
        }
        .hc2-sidebar {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .hc2-cal-card {
            padding: 16px;
        }
    }

    /* ── Mobile: 520px ── */
    @media (max-width: 520px) {
        .hc2-sidebar {
            grid-template-columns: 1fr;
        }
        .hc2-cal-card {
            padding: 12px 10px;
            border-radius: 14px;
        }
        .hc2-card {
            padding: 14px;
            border-radius: 12px;
        }
        .hc2-cal-card .react-calendar__navigation button {
            min-width: 32px;
            height: 32px;
            border-radius: 7px;
        }
        .hc2-cal-card .react-calendar__tile {
            border-radius: 7px;
            min-height: 32px;
        }
        .hc2-page-header {
            margin-bottom: 18px;
        }
    }

    /* ── Very small: 360px ── */
    @media (max-width: 360px) {
        .hc2-cal-card {
            padding: 10px 8px;
        }
        .hc2-tile-dot {
            width: 3px;
            height: 3px;
        }
        .hc2-cal-card .react-calendar__navigation button {
            min-width: 28px;
            height: 28px;
        }
        .hc2-legend {
            gap: 8px;
        }
    }
    `;
    document.head.appendChild(s);
};


/* ─── Main Component ─────────────────────────────────────────────────────── */
const HolidayCalendar = () => {
    const { theme } = useTheme();
    const [calMonth, setCalMonth] = useState(new Date());
    const [calValue, setCalValue] = useState(new Date());
    const [value, setValue] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHolidays = async () => {
            setLoading(true);
            try {
                const month = calMonth.getMonth() + 1;
                const year = calMonth.getFullYear();
                const res = await API.get(`/holidays?month=${month}&year=${year}`);
                setHolidays(res.data.holidays);
            } catch (err) {
                console.error("Error fetching holidays", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
        injectStyles();
    }, [calMonth, theme]);

    const getHolidayForDate = (date) =>
        holidays.find((h) => new Date(h.date).toDateString() === date.toDateString());

    const isHoliday = (date) => !!getHolidayForDate(date);

    const handleChange = (date) => {
        setCalValue(date);
        setSelectedDate(date);
    };

    const handleActiveStartDateChange = ({ activeStartDate }) => {
        if (activeStartDate) setCalMonth(activeStartDate);
    };

    const fmtShort = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const upcomingHolidays = holidays
        .filter((h) => new Date(h.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const pastHolidays = holidays
        .filter((h) => new Date(h.date) < new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const selectedHoliday = selectedDate ? getHolidayForDate(selectedDate) : null;
    const isWeekend = selectedDate ? (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) : false;

    return (
        <DashboardLayout>
            <div
                className="hc2-wrap"
                style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px" }}
            >

                {/* ── Page Header ── */}
                <div className="hc2-page-header hc2-rise">
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: "var(--brand-light)", border: "2px solid var(--border-strong)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--brand)",
                        flexShrink: 0,
                    }}>
                        <Icons.CalendarDays size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{
                            fontSize: "clamp(17px, 3.5vw, 21px)",
                            fontWeight: 800, color: "var(--text-1)",
                            margin: 0, letterSpacing: "-.02em",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                            Holiday Calendar
                        </h2>
                        <p style={{ fontSize: 12.5, color: "var(--text-2)", margin: "2px 0 0", fontWeight: 500 }}>
                            {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            {" — "}
                            {holidays.length} holiday{holidays.length !== 1 ? "s" : ""} this month
                        </p>
                    </div>
                </div>

                {/* ── Two-column layout (collapses on tablet/mobile) ── */}
                <div className="hc2-main-grid">

                    {/* ── Calendar ── */}
                    <div className="hc2-cal-card hc2-rise" style={{ animationDelay: "60ms" }}>
                        <Calendar
                            value={value}
                            onChange={handleChange}
                            onActiveStartDateChange={handleActiveStartDateChange}
                            tileClassName={({ date, view }) => {
                                if (view !== "month") return null;
                                const classes = [];
                                const day = date.getDay();
                                if (day === 0 || day === 6) classes.push("hc2-weekend");
                                if (isHoliday(date)) classes.push("hc2-holiday");
                                return classes.join(" ") || null;
                            }}
                            tileContent={({ date, view }) => {
                                if (view !== "month") return null;
                                return isHoliday(date) ? <span className="hc2-tile-dot" /> : null;
                            }}
                            prevLabel={<Icons.ChevronLeft />}
                            nextLabel={<Icons.ChevronRight />}
                            prev2Label={null}
                            next2Label={null}
                        />

                        {/* Legend */}
                        <div className="hc2-legend">
                            {[
                                { borderColor: "#1D9E75", bg: "#1D9E75", label: "Selected" },
                                { borderColor: "var(--brand)", bg: "var(--brand-light)", label: "Today" },
                                { borderColor: "var(--danger)", bg: "var(--danger-bg)", label: "Holiday" },
                                { borderColor: "var(--danger)", bg: "transparent", label: "Weekend" },
                            ].map(({ borderColor, bg, label }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{
                                        width: 12, height: 12, borderRadius: 4,
                                        background: bg, border: `2px solid ${borderColor}`,
                                        flexShrink: 0,
                                    }} />
                                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="hc2-sidebar">

                        {/* Selected date card */}
                        <div className="hc2-card hc2-rise" style={{ animationDelay: "120ms" }}>
                            {selectedDate ? (
                                <>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{
                                            fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                                            letterSpacing: ".08em", color: "var(--text-2)", marginBottom: 4,
                                        }}>
                                            Selected Date
                                        </div>
                                        <div style={{
                                            fontSize: "clamp(15px, 3vw, 18px)",
                                            fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.01em",
                                        }}>
                                            {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                        </div>
                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginTop: 2 }}>
                                            {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                                        </div>
                                    </div>

                                    {selectedHoliday ? (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 9,
                                            background: "var(--danger-bg)", border: "2px solid var(--border-strong)",
                                            borderRadius: 10, padding: "10px 12px",
                                        }}>
                                            <Icons.Gift size={16} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 11, fontWeight: 800, color: "var(--danger)",
                                                    textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 1,
                                                }}>
                                                    Public Holiday
                                                </div>
                                                <div style={{
                                                    fontSize: 13.5, fontWeight: 700, color: "var(--danger)",
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {selectedHoliday.name}
                                                </div>
                                            </div>
                                        </div>
                                    ) : isWeekend ? (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 9,
                                            background: "var(--danger-bg)", border: "2px solid var(--border-strong)",
                                            borderRadius: 10, padding: "10px 12px",
                                        }}>
                                            <Icons.Sun size={16} />
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>
                                                Weekend — Day off
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 9,
                                            background: "var(--surface-3)", border: "2px solid var(--border)",
                                            borderRadius: 10, padding: "10px 12px",
                                        }}>
                                            <Icons.Info size={16} />
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
                                                Regular working day
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: "center", padding: "18px 0", color: "var(--text-3)" }}>
                                    <div style={{ color: "var(--text-3)", marginBottom: 10, display: "flex", justifyContent: "center" }}>
                                        <Icons.Empty size={34} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--text-2)" }}>
                                        Select a date
                                    </p>
                                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
                                        Click any day to see details
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Holiday list card */}
                        <div className="hc2-card hc2-rise" style={{ animationDelay: "180ms" }}>

                            {holidays.length === 0 && !loading && (
                                <div style={{ textAlign: "center", padding: "18px 0" }}>
                                    <div style={{ color: "var(--text-3)", marginBottom: 8, display: "flex", justifyContent: "center" }}>
                                        <Icons.Empty size={28} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
                                        No holidays this month
                                    </p>
                                </div>
                            )}

                            {upcomingHolidays.length > 0 && (
                                <>
                                    <div className="hc2-section-label">
                                        <Icons.Clock size={12} />
                                        Upcoming
                                        <span style={{
                                            marginLeft: "auto", fontSize: 10, fontWeight: 800,
                                            background: "var(--success-bg)", color: "var(--success)",
                                            border: "1.5px solid var(--border-strong)",
                                            borderRadius: 20, padding: "1px 8px",
                                        }}>
                                            {upcomingHolidays.length}
                                        </span>
                                    </div>
                                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 4px" }}>
                                        {upcomingHolidays.map((h) => (
                                            <li key={h._id} className="hc2-list-item">
                                                <div style={{
                                                    display: "flex", alignItems: "center",
                                                    gap: 8, minWidth: 0, flex: 1,
                                                }}>
                                                    <Icons.Dot color="var(--danger)" />
                                                    <span style={{
                                                        fontSize: 13, fontWeight: 700, color: "var(--text-1)",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>
                                                        {h.name}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 700, color: "var(--text-2)",
                                                    flexShrink: 0,
                                                    background: "var(--surface-3)", border: "1.5px solid var(--border)",
                                                    borderRadius: 6, padding: "2px 6px",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {fmtShort(h.date)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {pastHolidays.length > 0 && (
                                <>
                                    <div className="hc2-section-label" style={{ marginTop: upcomingHolidays.length > 0 ? 14 : 0 }}>
                                        <Icons.History size={12} />
                                        Past
                                        <span style={{
                                            marginLeft: "auto", fontSize: 10, fontWeight: 800,
                                            background: "var(--surface-3)", color: "var(--text-2)",
                                            border: "1.5px solid var(--border)",
                                            borderRadius: 20, padding: "1px 8px",
                                        }}>
                                            {pastHolidays.length}
                                        </span>
                                    </div>
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                        {pastHolidays.map((h) => (
                                            <li key={h._id} className="hc2-list-item" style={{ opacity: .7 }}>
                                                <div style={{
                                                    display: "flex", alignItems: "center",
                                                    gap: 8, minWidth: 0, flex: 1,
                                                }}>
                                                    <Icons.Dot color="var(--text-3)" />
                                                    <span style={{
                                                        fontSize: 13, fontWeight: 600, color: "var(--text-2)",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>
                                                        {h.name}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, color: "var(--text-3)",
                                                    flexShrink: 0,
                                                    background: "var(--surface-3)", border: "1.5px solid var(--border)",
                                                    borderRadius: 6, padding: "2px 6px",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {fmtShort(h.date)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HolidayCalendar;