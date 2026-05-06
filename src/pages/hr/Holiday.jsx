import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import axios from "axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "react-calendar/dist/Calendar.css";
import API from "../../services/api";

const HRHoliday = () => {
    const [date, setDate] = useState(new Date());
    const [holidayName, setHolidayName] = useState("");
    const [holidays, setHolidays] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    const token = localStorage.getItem("token");

    const fetchHolidays = async () => {
        try {
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const res = await API.get(`/holidays?month=${month}&year=${year}`);
            setHolidays(res.data.holidays);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [date]);

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const handleSave = async () => {
        if (!holidayName.trim()) {
            showMessage("Please enter a holiday name", "warning");
            return;
        }
        setIsLoading(true);
        try {
            if (editingId) {
                await axios.put(
                    `http://localhost:5000/api/holidays/${editingId}`,
                    { date, name: holidayName },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Holiday updated successfully", "success");
                setEditingId(null);
            } else {
                await axios.post(
                    "http://localhost:5000/api/holidays",
                    { date, name: holidayName },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showMessage("Holiday added successfully", "success");
            }
            setHolidayName("");
            fetchHolidays();
        } catch (err) {
            console.error(err);
            showMessage("Something went wrong", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/holidays/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage("Holiday removed", "info");
            fetchHolidays();
        } catch (err) {
            console.error(err);
            showMessage("Delete failed", "error");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setHolidayName("");
    };

    const isHoliday = (d) =>
        holidays.some((h) => new Date(h.date).toDateString() === d.toDateString());

    const getHolidayForDate = (d) =>
        holidays.find((h) => new Date(h.date).toDateString() === d.toDateString());

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    return (
        <DashboardLayout>
            <div className="hr-holiday-page">
                {/* Header */}
                <div className="hr-header">
                    <div className="hr-header-left">
                        <div className="hr-icon-badge">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="hr-title">Holiday Management</h1>
                            <p className="hr-subtitle">Manage company holidays & time-off calendar</p>
                        </div>
                    </div>
                    <div className="hr-stat-pill">
                        <span className="hr-stat-num">{holidays.length}</span>
                        <span className="hr-stat-label">this month</span>
                    </div>
                </div>

                <div className="hr-grid">
                    {/* Left Column */}
                    <div className="hr-left-col">
                        {/* Calendar Card */}
                        <div className="hr-calendar-card">
                            <div className="hr-calendar-header">
                                <span className="hr-cal-month">
                                    {monthNames[date.getMonth()]} {date.getFullYear()}
                                </span>
                                <div className="hr-cal-legend">
                                    <span className="hr-legend-dot"></span>
                                    <span className="hr-legend-text">Holiday</span>
                                </div>
                            </div>
                            <Calendar
                                value={date}
                                onChange={setDate}
                                tileClassName={({ date: d }) =>
                                    isHoliday(d) ? "hr-holiday-tile" : null
                                }
                                tileContent={({ date: d }) => {
                                    const h = getHolidayForDate(d);
                                    return h ? <div className="hr-tile-tooltip">{h.name}</div> : null;
                                }}
                            />
                        </div>

                        {/* Selected Date Info */}
                        <div className="hr-selected-date-card">
                            <div className="hr-selected-date-top">
                                <div>
                                    <p className="hr-selected-label">Selected date</p>
                                    <p className="hr-selected-date">
                                        {date.toLocaleDateString("en-US", {
                                            weekday: "long", month: "long", day: "numeric", year: "numeric"
                                        })}
                                    </p>
                                </div>
                                {isHoliday(date) && (
                                    <div className="hr-holiday-badge">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        Holiday
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="hr-right-col">
                        {/* Form Card */}
                        <div className="hr-form-card">
                            <div className="hr-form-header">
                                <h2 className="hr-form-title">
                                    {editingId ? "Edit Holiday" : "Add Holiday"}
                                </h2>
                                <p className="hr-form-sub">
                                    {editingId
                                        ? "Update the holiday details below"
                                        : `Adding for ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                                </p>
                            </div>

                            <div className="hr-input-group">
                                <label className="hr-input-label">Holiday Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Republic Day, Diwali..."
                                    value={holidayName}
                                    onChange={(e) => setHolidayName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                    className="hr-input"
                                />
                            </div>

                            {message.text && (
                                <div className={`hr-message-box hr-msg-${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="hr-btn-row">
                                {editingId && (
                                    <button onClick={handleCancel} className="hr-cancel-btn">
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    className="hr-save-btn"
                                    style={{ opacity: isLoading ? 0.7 : 1 }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Saving..." : editingId ? "Update Holiday" : "Add Holiday"}
                                </button>
                            </div>
                        </div>

                        {/* Holiday List */}
                        <div className="hr-list-card">
                            <div className="hr-list-header">
                                <h2 className="hr-list-title">
                                    {monthNames[date.getMonth()]} Holidays
                                </h2>
                                <span className="hr-count-badge">{holidays.length}</span>
                            </div>

                            {holidays.length === 0 ? (
                                <div className="hr-empty-state">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                        <rect x="3" y="4" width="18" height="18" rx="2" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                    </svg>
                                    <p className="hr-empty-text">No holidays for this month</p>
                                    <p className="hr-empty-subtext">Select a date and add one above</p>
                                </div>
                            ) : (
                                <div className="hr-list-items">
                                    {holidays.map((h, idx) => {
                                        const hDate = new Date(h.date);
                                        const dayName = hDate.toLocaleDateString("en-US", { weekday: "short" });
                                        const dayNum = hDate.getDate();
                                        return (
                                            <div key={h._id} className="hr-list-item" style={{ animationDelay: `${idx * 60}ms` }}>
                                                <div className="hr-date-chip">
                                                    <span className="hr-chip-day">{dayName}</span>
                                                    <span className="hr-chip-num">{dayNum}</span>
                                                </div>
                                                <div className="hr-holiday-info">
                                                    <p className="hr-holiday-name">{h.name}</p>
                                                    <p className="hr-holiday-full-date">
                                                        {hDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                                    </p>
                                                </div>
                                                <div className="hr-item-actions">
                                                    <button
                                                        onClick={() => {
                                                            setHolidayName(h.name);
                                                            setDate(new Date(h.date));
                                                            setEditingId(h._id);
                                                        }}
                                                        className="hr-edit-btn"
                                                        title="Edit"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(h._id)}
                                                        className="hr-delete-btn"
                                                        title="Delete"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                            <path d="M10 11v6M14 11v6" />
                                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                /* ───────── BASE ───────── */
                .hr-holiday-page {
                    min-height: 100vh;
                    background: #f6f8fc;
                    padding: 32px;
                    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
                    box-sizing: border-box;
                }

                /* ───────── HEADER ───────── */
                .hr-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 28px;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .hr-header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .hr-icon-badge {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #3b5bdb, #4c6ef5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 14px rgba(59,91,219,0.35);
                    flex-shrink: 0;
                }
                .hr-title {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: #0a0f1e;
                    letter-spacing: -0.4px;
                }
                .hr-subtitle {
                    margin: 2px 0 0;
                    font-size: 13px;
                    color: #1e293b;
                    font-weight: 500;
                }
                .hr-stat-pill {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 12px 20px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                }
                .hr-stat-num {
                    font-size: 28px;
                    font-weight: 700;
                    color: #3b5bdb;
                    line-height: 1;
                }
                .hr-stat-label {
                    font-size: 11px;
                    color: #1e293b;
                    font-weight: 600;
                    margin-top: 2px;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                /* ───────── GRID ───────── */
                .hr-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    align-items: start;
                }
                .hr-left-col,
                .hr-right-col {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* ───────── CALENDAR CARD ───────── */
                .hr-calendar-card {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
                    border: 1px solid #f1f5f9;
                }
                .hr-calendar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .hr-cal-month {
                    font-size: 16px;
                    font-weight: 700;
                    color: #0a0f1e;
                }
                .hr-cal-legend {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .hr-legend-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #e8590c;
                    display: inline-block;
                }
                .hr-legend-text {
                    font-size: 12px;
                    color: #1e293b;
                    font-weight: 600;
                }
                .hr-tile-tooltip {
                    display: none;
                }

                /* ───────── SELECTED DATE CARD ───────── */
                .hr-selected-date-card {
                    background: linear-gradient(135deg, #3b5bdb, #4c6ef5);
                    border-radius: 16px;
                    padding: 16px 20px;
                    box-shadow: 0 4px 16px rgba(59,91,219,0.25);
                }
                .hr-selected-date-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .hr-selected-label {
                    margin: 0 0 4px;
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .hr-selected-date {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: white;
                }
                .hr-holiday-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 20px;
                    backdrop-filter: blur(4px);
                    white-space: nowrap;
                }

                /* ───────── FORM CARD ───────── */
                .hr-form-card {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
                    border: 1px solid #f1f5f9;
                }
                .hr-form-header {
                    margin-bottom: 20px;
                }
                .hr-form-title {
                    margin: 0 0 4px;
                    font-size: 17px;
                    font-weight: 700;
                    color: #0a0f1e;
                }
                .hr-form-sub {
                    margin: 0;
                    font-size: 13px;
                    color: #1e293b;
                    font-weight: 500;
                }
                .hr-input-group {
                    margin-bottom: 16px;
                }
                .hr-input-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    color: #0a0f1e;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .hr-input {
                    width: 100%;
                    padding: 11px 14px;
                    border-radius: 10px;
                    border: 1.5px solid #e2e8f0;
                    font-size: 14px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    color: #0a0f1e;
                    outline: none;
                    background: #f8fafc;
                    box-sizing: border-box;
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                    font-weight: 500;
                }
                .hr-input:focus {
                    border-color: #3b5bdb;
                    box-shadow: 0 0 0 3px rgba(59,91,219,0.12);
                    background: white;
                }
                .hr-input::placeholder {
                    color: #64748b;
                }
                .hr-btn-row {
                    display: flex;
                    gap: 10px;
                }
                .hr-save-btn {
                    flex: 1;
                    padding: 11px;
                    background: linear-gradient(135deg, #3b5bdb, #4c6ef5);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    box-shadow: 0 4px 12px rgba(59,91,219,0.3);
                    transition: transform 0.12s ease, box-shadow 0.12s ease;
                }
                .hr-save-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 18px rgba(59,91,219,0.4);
                }
                .hr-cancel-btn {
                    padding: 11px 18px;
                    background: #f1f5f9;
                    color: #0a0f1e;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    transition: background 0.12s;
                }
                .hr-cancel-btn:hover {
                    background: #e2e8f0;
                }

                /* ───────── MESSAGES ───────── */
                .hr-message-box {
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 14px;
                }
                .hr-msg-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
                .hr-msg-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                .hr-msg-warning { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
                .hr-msg-info    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

                /* ───────── LIST CARD ───────── */
                .hr-list-card {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
                    border: 1px solid #f1f5f9;
                }
                .hr-list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .hr-list-title {
                    margin: 0;
                    font-size: 17px;
                    font-weight: 700;
                    color: #0a0f1e;
                }
                .hr-count-badge {
                    background: #eef2ff;
                    color: #3b5bdb;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 20px;
                }

                /* ───────── EMPTY STATE ───────── */
                .hr-empty-state {
                    text-align: center;
                    padding: 32px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .hr-empty-text {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                }
                .hr-empty-subtext {
                    margin: 0;
                    font-size: 12px;
                    color: #475569;
                    font-weight: 500;
                }

                /* ───────── LIST ITEMS ───────── */
                .hr-list-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .hr-list-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    transition: background 0.15s ease;
                }
                .hr-list-item:hover {
                    background: #f0f4ff;
                    border-color: #dde4ff;
                }
                .hr-date-chip {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: linear-gradient(135deg, #3b5bdb, #4c6ef5);
                    border-radius: 10px;
                    padding: 8px 10px;
                    min-width: 44px;
                    box-shadow: 0 2px 8px rgba(59,91,219,0.25);
                    flex-shrink: 0;
                }
                .hr-chip-day {
                    font-size: 9px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.75);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .hr-chip-num {
                    font-size: 18px;
                    font-weight: 800;
                    color: white;
                    line-height: 1;
                    margin-top: 1px;
                }
                .hr-holiday-info {
                    flex: 1;
                    min-width: 0;
                }
                .hr-holiday-name {
                    margin: 0 0 2px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #0a0f1e;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .hr-holiday-full-date {
                    margin: 0;
                    font-size: 12px;
                    color: #1e293b;
                    font-weight: 500;
                }
                .hr-item-actions {
                    display: flex;
                    gap: 6px;
                    flex-shrink: 0;
                }
                .hr-edit-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 8px;
                    cursor: pointer;
                    color: #b45309;
                    transition: background 0.12s, transform 0.12s;
                }
                .hr-edit-btn:hover {
                    background: #fef3c7;
                    transform: scale(1.08);
                }
                .hr-delete-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    cursor: pointer;
                    color: #b91c1c;
                    transition: background 0.12s, transform 0.12s;
                }
                .hr-delete-btn:hover {
                    background: #fee2e2;
                    transform: scale(1.08);
                }

                /* ───────── CALENDAR OVERRIDES ───────── */
                .react-calendar {
                    width: 100% !important;
                    border: none !important;
                    background: transparent !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                }
                .react-calendar__navigation {
                    display: none !important;
                }
                .react-calendar__month-view__weekdays {
                    margin-bottom: 4px;
                }
                .react-calendar__month-view__weekdays__weekday {
                    padding: 6px 0 !important;
                    text-align: center;
                }
                .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #1e293b !important;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .react-calendar__tile {
                    position: relative;
                    height: 44px !important;
                    border-radius: 10px !important;
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    color: #0a0f1e !important;
                    transition: all 0.15s ease !important;
                    background: transparent !important;
                }
                .react-calendar__tile:hover {
                    background: #f0f5ff !important;
                    color: #3b5bdb !important;
                }
                .react-calendar__tile--now {
                    background: #eef2ff !important;
                    color: #3b5bdb !important;
                    font-weight: 700 !important;
                }
                .react-calendar__tile--active,
                .react-calendar__tile--active:hover {
                    background: #3b5bdb !important;
                    color: white !important;
                    font-weight: 600 !important;
                    box-shadow: 0 4px 12px rgba(59,91,219,0.3) !important;
                }
                .hr-holiday-tile {
                    background: linear-gradient(135deg, #fd7e1422, #fd7e1411) !important;
                    color: #c2410c !important;
                    font-weight: 700 !important;
                }
                .hr-holiday-tile::after {
                    content: '';
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: #e8590c;
                }
                .hr-holiday-tile.react-calendar__tile--active {
                    background: #e8590c !important;
                    color: white !important;
                    box-shadow: 0 4px 12px rgba(232,89,12,0.35) !important;
                }
                .hr-holiday-tile.react-calendar__tile--active::after {
                    background: white;
                }
                .react-calendar__month-view__days__day--neighboringMonth {
                    color: #94a3b8 !important;
                    opacity: 0.6;
                }
                .react-calendar__month-view__days__day--weekend {
                    background: #fff5f5 !important;
                    color: #b91c1c !important;
                }
                .react-calendar__month-view__days__day--weekend:hover {
                    background: #ffe3e3 !important;
                    color: #991b1b !important;
                }
                .react-calendar__month-view__days__day--weekend.react-calendar__tile--active,
                .react-calendar__month-view__days__day--weekend.react-calendar__tile--active:hover {
                    background: #e03131 !important;
                    color: white !important;
                }
                .react-calendar__month-view__days__day--weekend.react-calendar__tile--now {
                    background: #ffe3e3 !important;
                    color: #991b1b !important;
                }
                .react-calendar__month-view__days__day--weekend.hr-holiday-tile {
                    background: linear-gradient(135deg, #fd7e1422, #fff5f5) !important;
                    color: #c2410c !important;
                }
                .react-calendar__month-view__weekdays__weekday:first-child abbr,
                .react-calendar__month-view__weekdays__weekday:last-child abbr {
                    color: #b91c1c !important;
                }

                /* ───────── RESPONSIVE: TABLET (≤ 900px) ───────── */
                @media (max-width: 900px) {
                    .hr-holiday-page {
                        padding: 20px;
                    }
                    .hr-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                    .hr-title {
                        font-size: 18px;
                    }
                }

                /* ───────── RESPONSIVE: MOBILE (≤ 600px) ───────── */
                @media (max-width: 600px) {
                    .hr-holiday-page {
                        padding: 16px 12px;
                    }
                    .hr-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                        margin-bottom: 20px;
                    }
                    .hr-stat-pill {
                        flex-direction: row;
                        gap: 8px;
                        align-items: baseline;
                        padding: 10px 16px;
                        align-self: flex-start;
                    }
                    .hr-stat-num {
                        font-size: 22px;
                    }
                    .hr-icon-badge {
                        width: 40px;
                        height: 40px;
                        border-radius: 11px;
                    }
                    .hr-title {
                        font-size: 17px;
                    }
                    .hr-subtitle {
                        font-size: 12px;
                    }
                    .hr-calendar-card {
                        padding: 14px;
                        border-radius: 16px;
                    }
                    .hr-cal-month {
                        font-size: 14px;
                    }
                    .react-calendar__tile {
                        height: 38px !important;
                        font-size: 12px !important;
                        border-radius: 8px !important;
                    }
                    .react-calendar__month-view__weekdays__weekday abbr {
                        font-size: 10px !important;
                    }
                    .hr-selected-date-card {
                        padding: 14px 16px;
                        border-radius: 14px;
                    }
                    .hr-selected-date {
                        font-size: 13px;
                    }
                    .hr-form-card,
                    .hr-list-card {
                        padding: 16px;
                        border-radius: 16px;
                    }
                    .hr-form-title,
                    .hr-list-title {
                        font-size: 15px;
                    }
                    .hr-btn-row {
                        flex-direction: column;
                    }
                    .hr-cancel-btn {
                        width: 100%;
                        text-align: center;
                    }
                    .hr-list-item {
                        padding: 10px;
                        gap: 10px;
                    }
                    .hr-chip-num {
                        font-size: 15px;
                    }
                    .hr-holiday-name {
                        font-size: 13px;
                    }
                    .hr-holiday-full-date {
                        font-size: 11px;
                    }
                    .hr-edit-btn,
                    .hr-delete-btn {
                        width: 30px;
                        height: 30px;
                    }
                }

                /* ───────── RESPONSIVE: TINY (≤ 380px) ───────── */
                @media (max-width: 380px) {
                    .hr-holiday-page {
                        padding: 12px 8px;
                    }
                    .hr-header-left {
                        gap: 10px;
                    }
                    .hr-title {
                        font-size: 15px;
                    }
                    .hr-date-chip {
                        min-width: 38px;
                        padding: 6px 8px;
                    }
                    .hr-chip-num {
                        font-size: 14px;
                    }
                    .hr-item-actions {
                        gap: 4px;
                    }
                    .hr-edit-btn,
                    .hr-delete-btn {
                        width: 28px;
                        height: 28px;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default HRHoliday;