import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import DashboardLayout from "../layout/DashboardLayout";
import StopwatchLoader from "./StopwatchLoader";
import API from "../../services/api";

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
    Star: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
    if (document.head.querySelector("style[data-hc2]")) return;
    const s = document.createElement("style");
    s.setAttribute("data-hc2", "1");
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    @keyframes hc2-rise { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
    @keyframes hc2-pop  { 0%{transform:scale(.95);opacity:0} 70%{transform:scale(1.01)} 100%{transform:scale(1);opacity:1} }

    .hc2-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
    .hc2-rise  { animation: hc2-rise .38s cubic-bezier(.22,1,.36,1) both; }

    /* ── Calendar card ── */
    .hc2-cal-card {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 4px 16px rgba(0,0,0,.06);
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
        margin-bottom: 20px;
        gap: 6px;
        height: auto;
    }
    .hc2-cal-card .react-calendar__navigation button {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 9px;
        min-width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #0f172a;
        padding: 0;
        font-family: 'Plus Jakarta Sans', sans-serif;
        transition: background .13s, border-color .13s;
    }
    .hc2-cal-card .react-calendar__navigation button:hover:not(:disabled) {
        background: #f0faf6;
        border-color: #1D9E75;
        color: #1D9E75;
    }
    .hc2-cal-card .react-calendar__navigation button:disabled {
        opacity: .35;
        cursor: not-allowed;
    }
    .hc2-cal-card .react-calendar__navigation__label {
        flex: 1;
        font-size: 15.5px;
        font-weight: 800;
        color: #0f172a;
        border: none !important;
        background: none !important;
        pointer-events: none;
        cursor: default;
        letter-spacing: -.01em;
    }

    /* Weekday headers */
    .hc2-cal-card .react-calendar__month-view__weekdays {
        margin-bottom: 6px;
    }
    .hc2-cal-card .react-calendar__month-view__weekdays__weekday {
        padding: 7px 0;
        text-align: center;
        font-size: 11px;
        font-weight: 800;
        color: #475569;
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
        font-size: 13.5px;
        font-weight: 600;
        color: #0f172a;
        padding: 7px 2px;
        transition: background .12s, color .12s, border-color .12s;
        aspect-ratio: 1;
        height: auto;
    }
    .hc2-cal-card .react-calendar__tile:hover:not(.react-calendar__tile--active) {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }

    /* Today */
    .hc2-cal-card .react-calendar__tile--now:not(.react-calendar__tile--active) {
        background: #EFF6FF;
        color: #1d4ed8;
        font-weight: 800;
        border-color: #BFDBFE;
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
        color: #cbd5e1;
        font-weight: 400;
    }

    /* Weekend */
    .hc2-cal-card .hc2-weekend:not(.react-calendar__tile--active) {
        color: #dc2626;
        background: #fff5f5;
    }
    .hc2-cal-card .hc2-weekend:not(.react-calendar__tile--active):hover {
        background: #fee2e2;
        border-color: #fca5a5;
    }

    /* Holiday */
    .hc2-cal-card .hc2-holiday:not(.react-calendar__tile--active) {
        background: #fff1f2;
        color: #be123c;
        font-weight: 800;
        border-color: #fecdd3;
    }
    .hc2-cal-card .hc2-holiday:not(.react-calendar__tile--active):hover {
        background: #ffe4e6;
    }

    /* Holiday dot */
    .hc2-tile-dot {
        display: block;
        width: 5px;
        height: 5px;
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
        background: #fff;
        border: 2px solid #e2e8f0;
        border-radius: 16px;
        padding: 18px 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,.05);
        transition: border-color .18s;
    }
    .hc2-card:hover { border-color: #cbd5e1; }

    /* ── List item ── */
    .hc2-list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 0;
        border-bottom: 1.5px solid #f1f5f9;
        transition: background .12s;
    }
    .hc2-list-item:last-child { border-bottom: none; }

    /* ── Section label ── */
    .hc2-section-label {
        font-size: 10.5px;
        font-weight: 800;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: .09em;
        margin: 0 0 8px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    `;
    document.head.appendChild(s);
};


/* ─── Main Component ─────────────────────────────────────────────────────── */
const HolidayCalendar = () => {
    injectStyles();

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
    }, [calMonth]);

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
            <div className="hc2-wrap" style={{ maxWidth: 880, margin: "32px auto", padding: "0 22px" }}>

                {/* ── Page Header ── */}
                <div className="hc2-rise" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: "#EFF6FF", border: "2px solid #BFDBFE",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#1d4ed8", flexShrink: 0,
                    }}>
                        <Icons.CalendarDays size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 21, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-.02em" }}>
                            Holiday Calendar
                        </h2>
                        <p style={{ fontSize: 12.5, color: "#475569", margin: "2px 0 0", fontWeight: 500 }}>
                            {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            {" — "}
                            {holidays.length} holiday{holidays.length !== 1 ? "s" : ""} this month
                        </p>
                    </div>
                    {loading && (
                        <div style={{ marginLeft: "auto" }}>
                            <StopwatchLoader />
                        </div>
                    )}
                </div>

                {/* ── Two-column layout ── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 300px",
                    gap: 18,
                    alignItems: "start",
                }}>

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
                        <div style={{
                            marginTop: 18, paddingTop: 16,
                            borderTop: "2px solid #f1f5f9",
                            display: "flex", gap: 18, flexWrap: "wrap",
                        }}>
                            {[
                                { color: "#1D9E75", label: "Selected" },
                                { color: "#1d4ed8", label: "Today", bg: "#EFF6FF" },
                                { color: "#be123c", label: "Holiday", bg: "#fff1f2" },
                                { color: "#dc2626", label: "Weekend", bg: "#fff5f5" },
                            ].map(({ color, label, bg }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{
                                        width: 12, height: 12, borderRadius: 4,
                                        background: bg || color, border: `2px solid ${color}`,
                                        flexShrink: 0,
                                    }} />
                                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "#334155" }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Selected date card */}
                        <div className="hc2-card hc2-rise" style={{ animationDelay: "120ms" }}>
                            {selectedDate ? (
                                <>
                                    {/* Date heading */}
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 4 }}>
                                            Selected Date
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-.01em" }}>
                                            {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                        </div>
                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                                            {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    {selectedHoliday ? (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 9,
                                            background: "#fff1f2", border: "2px solid #fecdd3",
                                            borderRadius: 10, padding: "10px 14px",
                                        }}>
                                            <Icons.Gift size={16} />
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 800, color: "#9f1239", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 1 }}>
                                                    Public Holiday
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: "#be123c" }}>
                                                    {selectedHoliday.name}
                                                </div>
                                            </div>
                                        </div>
                                    ) : isWeekend ? (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 9,
                                            background: "#fff5f5", border: "2px solid #fca5a5",
                                            borderRadius: 10, padding: "10px 14px",
                                        }}>
                                            <Icons.Sun size={16} />
                                            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#dc2626" }}>
                                                Weekend — Day off
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 9,
                                            background: "#f8fafc", border: "2px solid #e2e8f0",
                                            borderRadius: 10, padding: "10px 14px",
                                        }}>
                                            <Icons.Info size={16} />
                                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#475569" }}>
                                                Regular working day
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                                    <div style={{ color: "#cbd5e1", marginBottom: 10, display: "flex", justifyContent: "center" }}>
                                        <Icons.Empty size={36} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#475569" }}>
                                        Select a date
                                    </p>
                                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                                        Click any day to see details
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Holiday list card */}
                        <div className="hc2-card hc2-rise" style={{ animationDelay: "180ms" }}>

                            {holidays.length === 0 && !loading && (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                                    <div style={{ color: "#cbd5e1", marginBottom: 8, display: "flex", justifyContent: "center" }}>
                                        <Icons.Empty size={30} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#475569" }}>No holidays this month</p>
                                </div>
                            )}

                            {upcomingHolidays.length > 0 && (
                                <>
                                    <div className="hc2-section-label">
                                        <Icons.Clock size={12} />
                                        Upcoming
                                        <span style={{
                                            marginLeft: "auto", fontSize: 10, fontWeight: 800,
                                            background: "#DCFCE7", color: "#166534",
                                            border: "1.5px solid #86EFAC",
                                            borderRadius: 20, padding: "1px 8px",
                                        }}>
                                            {upcomingHolidays.length}
                                        </span>
                                    </div>
                                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 4px" }}>
                                        {upcomingHolidays.map((h) => (
                                            <li key={h._id} className="hc2-list-item">
                                                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                                                    <Icons.Dot color="#ef4444" />
                                                    <span style={{
                                                        fontSize: 13, fontWeight: 700, color: "#0f172a",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>
                                                        {h.name}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: 11.5, fontWeight: 700, color: "#475569",
                                                    flexShrink: 0, marginLeft: 8,
                                                    background: "#f8fafc", border: "1.5px solid #e2e8f0",
                                                    borderRadius: 6, padding: "2px 7px",
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
                                            background: "#f1f5f9", color: "#475569",
                                            border: "1.5px solid #cbd5e1",
                                            borderRadius: 20, padding: "1px 8px",
                                        }}>
                                            {pastHolidays.length}
                                        </span>
                                    </div>
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                        {pastHolidays.map((h) => (
                                            <li key={h._id} className="hc2-list-item" style={{ opacity: .7 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                                                    <Icons.Dot color="#94a3b8" />
                                                    <span style={{
                                                        fontSize: 13, fontWeight: 600, color: "#475569",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>
                                                        {h.name}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: 11.5, fontWeight: 600, color: "#94a3b8",
                                                    flexShrink: 0, marginLeft: 8,
                                                    background: "#f8fafc", border: "1.5px solid #e2e8f0",
                                                    borderRadius: 6, padding: "2px 7px",
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