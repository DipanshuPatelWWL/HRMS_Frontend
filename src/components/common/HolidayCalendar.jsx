import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import StopwatchLoader from "./StopwatchLoader";

const HolidayCalendar = () => {
    const [value, setValue] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchHolidays = async () => {
            setLoading(true);
            try {
                const month = value.getMonth() + 1;
                const year = value.getFullYear();
                const res = await axios.get(
                    `http://localhost:5000/api/holidays?month=${month}&year=${year}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setHolidays(res.data.holidays);
            } catch (err) {
                console.error("Error fetching holidays", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
    }, [value]);

    const getHolidayForDate = (date) =>
        holidays.find((h) => {
            const hDate = new Date(h.date);
            return hDate.toDateString() === date.toDateString();
        });

    const isHoliday = (date) => !!getHolidayForDate(date);

    const handleChange = (date) => {
        setValue(date);
        setSelectedDate(date);
    };

    const upcomingHolidays = holidays
        .filter((h) => new Date(h.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const pastHolidays = holidays
        .filter((h) => new Date(h.date) < new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <DashboardLayout>
            <div className="hc-wrapper">

                {/* Page heading */}
                <div className="hc-heading">
                    <span className="hc-heading-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </span>
                    <h2 className="hc-title">Holiday Calendar</h2>
                    {loading && <StopwatchLoader />}
                </div>

                <div className="hc-layout">

                    {/* ── Left: Calendar ── */}
                    <div className="hc-cal-card">
                        <Calendar
                            value={value}
                            onChange={handleChange}
                            tileClassName={({ date, view }) => {
                                if (view !== "month") return null;
                                const classes = [];
                                const day = date.getDay();
                                if (day === 0 || day === 6) classes.push("hc-weekend-tile");
                                if (isHoliday(date)) classes.push("hc-holiday-tile");
                                if (
                                    selectedDate &&
                                    date.toDateString() === selectedDate.toDateString()
                                )
                                    classes.push("hc-selected-tile");
                                return classes.join(" ") || null;
                            }}
                            tileContent={({ date, view }) => {
                                if (view !== "month") return null;
                                return isHoliday(date) ? (
                                    <span className="hc-tile-dot" />
                                ) : null;
                            }}
                            prevLabel={
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            }
                            nextLabel={
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            }
                            prev2Label={null}
                            next2Label={null}
                        />
                    </div>

                    {/* ── Right: Sidebar ── */}
                    <div className="hc-sidebar">

                        {/* Selected date detail */}
                        {selectedDate ? (
                            <div className="hc-detail-card">
                                <div className="hc-detail-meta">
                                    <span className="hc-detail-weekday">
                                        {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                                    </span>
                                    <span className="hc-detail-full">
                                        {selectedDate.toLocaleDateString("en-US", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                                {getHolidayForDate(selectedDate) ? (
                                    <div className="hc-event-badge">
                                        <span className="hc-event-dot" />
                                        {getHolidayForDate(selectedDate).name}
                                    </div>
                                ) : (
                                    <p className="hc-no-event">No holiday on this date</p>
                                )}
                            </div>
                        ) : (
                            <div className="hc-detail-card hc-detail-empty">
                                <span className="hc-empty-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </span>
                                <p>Select a date to see details</p>
                            </div>
                        )}

                        {/* Holiday list */}
                        <div className="hc-list-card">
                            {holidays.length === 0 && !loading && (
                                <p className="hc-no-event" style={{ padding: "4px 0" }}>No holidays this month</p>
                            )}

                            {upcomingHolidays.length > 0 && (
                                <>
                                    <p className="hc-list-section-label">
                                        Upcoming · {upcomingHolidays.length}
                                    </p>
                                    <ul className="hc-list">
                                        {upcomingHolidays.map((h) => (
                                            <li key={h._id} className="hc-list-item">
                                                <div className="hc-list-left">
                                                    <span className="hc-list-dot" />
                                                    <span className="hc-list-name">{h.name}</span>
                                                </div>
                                                <span className="hc-list-date">
                                                    {new Date(h.date).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {pastHolidays.length > 0 && (
                                <>
                                    <p className="hc-list-section-label hc-label-past">
                                        Past · {pastHolidays.length}
                                    </p>
                                    <ul className="hc-list">
                                        {pastHolidays.map((h) => (
                                            <li key={h._id} className="hc-list-item hc-list-item--past">
                                                <div className="hc-list-left">
                                                    <span className="hc-list-dot hc-dot--past" />
                                                    <span className="hc-list-name hc-name--past">{h.name}</span>
                                                </div>
                                                <span className="hc-list-date">{new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ────────── Styles ────────── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

                /* Wrapper */
                .hc-wrapper {
                    max-width: 840px;
                    margin: 32px auto;
                    padding: 0 20px;
                    font-family: 'DM Sans', sans-serif;
                }

                /* Heading */
                .hc-heading {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 24px;
                }
                .hc-heading-icon {
                    width: 36px;
                    height: 36px;
                    background: #EFF6FF;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #2563EB;
                    flex-shrink: 0;
                }
                .hc-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                }
                .hc-loading-badge {
                    margin-left: auto;
                    font-size: 12px;
                    color: #6B7280;
                    background: #F3F4F6;
                    border-radius: 20px;
                    padding: 3px 10px;
                }

                /* Two-column layout */
                .hc-layout {
                    display: grid;
                    grid-template-columns: 1fr 290px;
                    gap: 18px;
                    align-items: start;
                }
                @media (max-width: 660px) {
                    .hc-layout { grid-template-columns: 1fr; }
                }

                /* ── Calendar card ── */
                .hc-cal-card {
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid #E5E7EB;
                    padding: 22px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }

                /* react-calendar base reset */
                .hc-cal-card .react-calendar {
                    width: 100%;
                    border: none;
                    background: transparent;
                    font-family: 'DM Sans', sans-serif;
                    line-height: 1.4;
                }

                /* Navigation bar */
                .hc-cal-card .react-calendar__navigation {
                    display: flex;
                    align-items: center;
                    margin-bottom: 18px;
                    gap: 6px;
                    height: auto;
                }
                .hc-cal-card .react-calendar__navigation button {
                    background: none;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    min-width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #374151;
                    padding: 0;
                    transition: background 0.13s, border-color 0.13s;
                }
                .hc-cal-card .react-calendar__navigation button:hover:not(:disabled) {
                    background: #F9FAFB;
                    border-color: #D1D5DB;
                }
                .hc-cal-card .react-calendar__navigation button:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .hc-cal-card .react-calendar__navigation__label {
                    flex: 1;
                    font-size: 15px;
                    font-weight: 600;
                    color: #111827;
                    border: none !important;
                    background: none !important;
                    pointer-events: none;
                    cursor: default;
                }

                /* Weekday headers */
                .hc-cal-card .react-calendar__month-view__weekdays {
                    margin-bottom: 4px;
                }
                .hc-cal-card .react-calendar__month-view__weekdays__weekday {
                    padding: 6px 0;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 600;
                    color: #9CA3AF;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .hc-cal-card .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none;
                }

                /* Day tiles */
                .hc-cal-card .react-calendar__tile {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    font-weight: 400;
                    color: #374151;
                    padding: 6px 2px;
                    transition: background 0.12s, color 0.12s;
                    aspect-ratio: 1;
                    height: auto;
                }
                .hc-cal-card .react-calendar__tile:hover:not(.react-calendar__tile--active) {
                    background: #F3F4F6;
                }

                /* Today */
                .hc-cal-card .react-calendar__tile--now:not(.react-calendar__tile--active) {
                    background: #EFF6FF;
                    color: #2563EB;
                    font-weight: 600;
                }

                /* Active / selected */
                .hc-cal-card .react-calendar__tile--active,
                .hc-cal-card .react-calendar__tile--active:hover {
                    background: #2563EB !important;
                    color: #ffffff !important;
                    font-weight: 600;
                    border-radius: 10px;
                }

                /* Neighbouring month */
                .hc-cal-card .react-calendar__month-view__days__day--neighboringMonth {
                    color: #D1D5DB;
                }

                /* Weekend tile (Sat & Sun) */
                .hc-cal-card .hc-weekend-tile:not(.react-calendar__tile--active) {
                    color: #DC2626;
                    background: #FFF5F5;
                }
                .hc-cal-card .hc-weekend-tile:not(.react-calendar__tile--active):hover {
                    background: #FEE2E2;
                }

                /* Holiday tile */
                .hc-cal-card .hc-holiday-tile:not(.react-calendar__tile--active) {
                    background: #FEF2F2;
                    color: #B91C1C;
                    font-weight: 600;
                }
                .hc-cal-card .hc-holiday-tile:not(.react-calendar__tile--active):hover {
                    background: #fab8b8;
                }

                /* Holiday dot */
                .hc-tile-dot {
                    display: block;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: #EF4444;
                    margin-top: 3px;
                }
                .react-calendar__tile--active .hc-tile-dot {
                    background: rgba(255,255,255,0.75);
                }

                /* ── Sidebar ── */
                .hc-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                /* Detail card */
                .hc-detail-card {
                    background: #ffffff;
                    border: 1px solid #E5E7EB;
                    border-radius: 14px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .hc-detail-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 24px 16px;
                    color: #9CA3AF;
                    font-size: 13px;
                    text-align: center;
                }
                .hc-detail-empty p { margin: 0; }
                .hc-empty-icon { color: #D1D5DB; }

                .hc-detail-meta {
                    margin-bottom: 12px;
                }
                .hc-detail-weekday {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: #6B7280;
                    margin-bottom: 3px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .hc-detail-full {
                    display: block;
                    font-size: 16px;
                    font-weight: 600;
                    color: #111827;
                }

                .hc-event-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: #FEF2F2;
                    color: #991B1B;
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 8px;
                    padding: 6px 12px;
                    border: 1px solid #FECACA;
                }
                .hc-event-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #EF4444;
                    flex-shrink: 0;
                }
                .hc-no-event {
                    font-size: 13px;
                    color: #9CA3AF;
                    margin: 0;
                }

                /* Holiday list card */
                .hc-list-card {
                    background: #ffffff;
                    border: 1px solid #E5E7EB;
                    border-radius: 14px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .hc-list-section-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #9CA3AF;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    margin: 0 0 8px;
                }
                .hc-label-past { margin-top: 14px; }

                .hc-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .hc-list-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #F3F4F6;
                }
                .hc-list-item:last-child { border-bottom: none; }

                .hc-list-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                .hc-list-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #EF4444;
                    flex-shrink: 0;
                }
                .hc-dot--past { background: #D1D5DB; }

                .hc-list-name {
                    font-size: 13px;
                    color: #111827;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .hc-name--past { color: #9CA3AF; }

                .hc-list-date {
                    font-size: 12px;
                    color: #6B7280;
                    flex-shrink: 0;
                    margin-left: 8px;
                }
            `}</style>
        </DashboardLayout>
    );
};

export default HolidayCalendar;