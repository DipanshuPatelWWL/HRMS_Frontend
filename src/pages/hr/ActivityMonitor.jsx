import { useState, useEffect, useContext, useRef, useCallback } from "react";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import socket from "../../socket";

/* ── Duration formatter ── */
const fmtDur = (s = 0) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
};

/* ── Time formatter: show local HH:MM:SS ── */
const fmtTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
};

/* ── Group titles by hour slot ── */
const groupByHour = (titles) => {
    const slots = {};
    titles.forEach(t => {
        if (!t.firstSeen) return;
        const d = new Date(t.firstSeen);
        if (isNaN(d)) return;
        const h = d.getHours();
        const label = `${String(h).padStart(2, "0")}:00 – ${String(h + 1).padStart(2, "0")}:00`;
        if (!slots[label]) slots[label] = { hour: h, label, titles: [] };
        slots[label].titles.push(t);
    });
    return Object.values(slots).sort((a, b) => a.hour - b.hour);
};

/* ── App icon map — SVG paths for common apps ── */
const APP_ICONS = {
    "google chrome": (
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="4" fill="#4285F4" />
            <path d="M12 8h8.66" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M4.22 15L8.7 11.5" stroke="#34A853" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M19.78 15L15.3 11.5" stroke="#FBBC05" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    ),
    "visual studio code": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <path d="M17 1.5L3 9.5v5l14 8 4-2V3.5L17 1.5z" fill="#0066B8" />
            <path d="M17 1.5L3 9.5v5l14-8V1.5z" fill="#1B90F0" />
            <path d="M17 22.5L3 14.5v-5l14 8v5z" fill="#1B90F0" />
            <path d="M3 9.5l4.5 2.5-4.5 2.5v-5z" fill="#fff" opacity="0.4" />
        </svg>
    ),
    "mongodbcompass": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <path d="M12 2C9 2 6 7 6 12c0 3.31 1.5 6.26 3.86 8.14L12 22l2.14-1.86A10 10 0 0 0 18 12c0-5-3-10-6-10z" fill="#00ED64" />
            <path d="M12 4v16" stroke="#00684A" strokeWidth="1.5" />
        </svg>
    ),
    "windows explorer": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" />
            <rect x="2" y="4" width="20" height="5" rx="2" fill="#005A9E" />
            <path d="M4 12h16M4 15h10" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </svg>
    ),
    "postman": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="10" fill="#FF6C37" />
            <path d="M8 12a4 4 0 0 1 8 0" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="12" cy="12" r="1.5" fill="#fff" />
            <path d="M12 12l3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    "figma": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <path d="M8 2h8a2 2 0 0 1 0 4H8a2 2 0 0 1 0-4z" fill="#F24E1E" />
            <path d="M8 6h4a2 2 0 0 1 0 4H8a2 2 0 0 1 0-4z" fill="#FF7262" />
            <path d="M8 10h4a2 2 0 0 1 0 4H8v-4z" fill="#A259FF" />
            <path d="M8 14h4a2 2 0 0 1 0 4H8a2 2 0 0 1 0-4z" fill="#1ABCFE" />
            <circle cx="16" cy="12" r="2" fill="#0ACF83" />
        </svg>
    ),
    "discord": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <path d="M20.32 4.37A19.8 19.8 0 0 0 15.65 3c-.21.38-.46.9-.63 1.3a18.3 18.3 0 0 0-5.98 0A13.5 13.5 0 0 0 8.4 3 19.9 19.9 0 0 0 3.7 4.38C.53 9.24-.32 13.99.1 18.67a20.1 20.1 0 0 0 6.19 3.19c.5-.69.94-1.43 1.32-2.2a13 13 0 0 1-2.08-1.02c.17-.13.34-.26.5-.4a14.3 14.3 0 0 0 12.44 0c.16.14.33.27.5.4-.66.4-1.36.75-2.09 1.03.38.77.82 1.5 1.33 2.19a20 20 0 0 0 6.2-3.2c.5-5.3-.85-9.9-3.59-14.3zM8.68 15.9c-1.29 0-2.34-1.2-2.34-2.67 0-1.48 1.03-2.68 2.34-2.68 1.3 0 2.36 1.2 2.34 2.68 0 1.47-1.04 2.67-2.34 2.67zm6.64 0c-1.29 0-2.34-1.2-2.34-2.67 0-1.48 1.03-2.68 2.34-2.68 1.3 0 2.36 1.2 2.34 2.68 0 1.47-1.03 2.67-2.34 2.67z" fill="#5865F2" />
        </svg>
    ),
    "spotify": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="10" fill="#1DB954" />
            <path d="M7 15.5c3-1.5 7-1.5 10 0M6.5 12c4-2 9-2 12 0M7.5 8.5c3.5-1.5 7.5-1.5 10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
    ),
    "whatsapp": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="10" fill="#25D366" />
            <path d="M17 14.8c-.3.8-1.5 1.5-2.4 1.7-.6.1-1.4.2-4.2-1.3-2.8-1.5-4.5-4.4-4.7-4.6-.1-.2-1-1.4-1-2.7 0-1.3.7-1.9 1-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.6.7c-.1.1-.2.3-.1.5.4.7.9 1.4 1.5 2 .6.5 1.3 1 2 1.3.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.6-.1l2 .9c.3.1.4.3.4.5z" fill="#fff" />
        </svg>
    ),
    "slack": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <path d="M6 15a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2h2v2zM7 15a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-5zM9 6a2 2 0 0 1-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2v2H9zM9 7a2 2 0 0 1 2 2 2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5zM18 9a2 2 0 0 1 2-2 2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2V9zM17 9a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5zM15 18a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2h2zM15 17a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-5z" fill="#E01E5A" />
        </svg>
    ),
    "telegram": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="10" fill="#29B6F6" />
            <path d="M6 12l2 6 2-3 4 3 4-10-12 4z" fill="#fff" opacity="0.9" />
        </svg>
    ),
    "default-browser": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="9" stroke="#4285F4" strokeWidth="1.8" fill="none" />
            <path d="M3 12h18M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" stroke="#4285F4" strokeWidth="1.5" fill="none" />
        </svg>
    ),
    "default-productive": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <rect x="3" y="4" width="18" height="13" rx="2" stroke="#166534" strokeWidth="1.8" fill="none" />
            <path d="M7 20h10M12 17v3" stroke="#166534" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7 12l3-3 2 2 3-4" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    "default-unproductive": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <circle cx="12" cy="12" r="9" stroke="#991B1B" strokeWidth="1.8" fill="none" />
            <path d="M9 15s1.5-2 3-2 3 2 3 2" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="9" cy="10" r="1" fill="#991B1B" />
            <circle cx="15" cy="10" r="1" fill="#991B1B" />
        </svg>
    ),
    "default-neutral": (
        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
            <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#374151" strokeWidth="1.8" fill="none" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#374151" strokeWidth="1.8" fill="none" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#374151" strokeWidth="1.8" fill="none" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#374151" strokeWidth="1.8" fill="none" />
        </svg>
    ),
};

const getAppIcon = (appName, category, isBrowser) => {
    const key = appName.toLowerCase().replace(".exe", "").trim();
    if (APP_ICONS[key]) return APP_ICONS[key];
    if (isBrowser) return APP_ICONS["default-browser"];
    if (category === "productive") return APP_ICONS["default-productive"];
    if (category === "unproductive") return APP_ICONS["default-unproductive"];
    return APP_ICONS["default-neutral"];
};

const catConfig = (cat, isBrowser) => {
    if (isBrowser) return { bg: "#DBEAFE", border: "#93C5FD", text: "#1E3A8A", label: "browser", dot: "#1D4ED8" };
    if (cat === "productive") return { bg: "#DCFCE7", border: "#86EFAC", text: "#14532D", label: "productive", dot: "#16A34A" };
    if (cat === "unproductive") return { bg: "#FFE4E6", border: "#FCA5A5", text: "#7F1D1D", label: "unproductive", dot: "#DC2626" };
    return { bg: "#F3F4F6", border: "#9CA3AF", text: "#111827", label: "neutral", dot: "#4B5563" };
};

const barColor = (cat, isBrowser) => {
    if (isBrowser) return "linear-gradient(90deg,#60A5FA,#1D4ED8)";
    if (cat === "productive") return "linear-gradient(90deg,#4ADE80,#16A34A)";
    if (cat === "unproductive") return "linear-gradient(90deg,#FB7185,#DC2626)";
    return "linear-gradient(90deg,#9CA3AF,#4B5563)";
};

/* ── Refresh icon SVG ── */
const RefreshIcon = ({ spinning }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            width: 16, height: 16,
            animation: spinning ? "am-spin 0.8s linear infinite" : "none",
        }}
    >
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

/* ── Inline styles ── */
const css = `
.am-wrap * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

.am-wrap {
  --bg: var(--surface-2);
  --surface: var(--surface);
  --border: var(--border);
  --text: var(--text-1);
  --muted: var(--text-2);
  --faint: var(--text-2);
  --accent: #3730A3;
  --radius: 14px;
  --shadow: 0 1px 3px rgba(0,0,0,.10), 0 4px 16px rgba(0,0,0,.07);
  background: var(--bg);
  min-height: 100vh;
  padding: 1.75rem 1.5rem;
}

.am-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.75rem;
}

.am-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.4px;
  flex: 1;
}

.am-live-dot {
  width: 8px; height: 8px;
  background: #16A34A;
  border-radius: 50%;
  box-shadow: 0 0 0 3px #86EFAC;
  animation: am-pulse 2s infinite;
}
@keyframes am-pulse {
  0%,100% { box-shadow: 0 0 0 3px #86EFAC; }
  50% { box-shadow: 0 0 0 6px #86EFAC44; }
}

@keyframes am-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Refresh button */
.am-refresh-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background .2s, transform .15s, box-shadow .2s;
  box-shadow: 0 2px 8px rgba(55,48,163,.30);
  white-space: nowrap;
}
.am-refresh-btn:hover { background: #312E81; box-shadow: 0 4px 14px rgba(55,48,163,.40); transform: translateY(-1px); }
.am-refresh-btn:active { transform: translateY(0); }
.am-refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Filters */
.am-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
  align-items: center;
}

.am-select, .am-date-input, .am-search {
  height: 40px;
  border: 1.8px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  padding: 0 14px;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.07);
  font-weight: 500;
}

.am-select:focus, .am-date-input:focus, .am-search:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(55,48,163,.15);
}

.am-select { min-width: 200px; cursor: pointer; }
.am-date-input { width: 160px; }
.am-search { flex: 1; min-width: 180px; }

/* Summary grid */
.am-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 1.5rem;
}

.am-metric {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
  transition: transform .2s, box-shadow .2s;
  position: relative;
  overflow: hidden;
}

.am-metric::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: var(--metric-accent, var(--border));
  border-radius: 3px 3px 0 0;
}

.am-metric:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,.12); }
.am-metric-label { font-size: 11.5px; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
.am-metric-value { font-size: 1.5rem; font-weight: 700; color: var(--text); font-family: 'JetBrains Mono', monospace; letter-spacing: -0.5px; line-height: 1; }

/* App cards */
.am-card {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 8px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: border-color .2s, box-shadow .2s, transform .15s;
  animation: am-slide-in .3s ease both;
}

@keyframes am-slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.am-card:hover { border-color: #818CF8; box-shadow: 0 4px 24px rgba(55,48,163,.14); }
.am-card.am-open { border-color: #6366F1; }

.am-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  cursor: pointer;
  user-select: none;
  transition: background .15s;
  border-radius: var(--radius) var(--radius) 0 0;
}

.am-card-header:hover { background: var(--surface-2); }

.am-icon-wrap {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid transparent;
  transition: transform .2s;
}

.am-card:hover .am-icon-wrap { transform: scale(1.08); }

.am-app-name {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.1px;
}

.am-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: .03em;
  border: 1.5px solid transparent;
}

.am-windows-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  min-width: 60px;
  text-align: center;
}

.am-duration {
  font-size: 14px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-1);
  min-width: 60px;
  text-align: right;
}

.am-chevron {
  width: 20px; height: 20px;
  color: var(--text-2);
  transition: transform .25s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
}
.am-chevron.open { transform: rotate(180deg); }

/* Progress bar */
.am-bar-track {
  height: 4px;
  background: var(--surface-3);
  margin: 0 16px;
}
.am-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

/* Window titles */
.am-titles {
  border-top: 2px solid var(--border);
  animation: am-expand .22s ease;
}

@keyframes am-expand {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.am-titles-head {
  display: grid;
  grid-template-columns: 28px 1fr 85px 85px 60px 70px 70px;
  align-items: center;
  padding: 7px 16px 7px 16px;
  background: var(--surface-2);
  border-bottom: 1.5px solid var(--border);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: .07em;
  gap: 6px;
}

.am-title-row {
  display: grid;
  grid-template-columns: 28px 1fr 85px 85px 60px 70px 70px;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: 1.5px solid var(--border);
  transition: background .15s;
  cursor: default;
}

.am-title-row:last-child { border-bottom: none; }
.am-title-row:hover { background: var(--surface-2); }

.am-title-bullet {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  justify-self: center;
  border: 1.5px solid rgba(0,0,0,0.1);
}

.am-title-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.am-time-cell {
  font-size: 11.5px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-1);
  white-space: nowrap;
}

.am-time-label {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 2px;
}

.am-time-start .am-time-label { color: #047857; }
.am-time-end   .am-time-label { color: #B91C1C; }
.am-time-start .am-time-value { color: #065F46; }
.am-time-end   .am-time-value { color: #991B1B; }
.am-time-value { font-size: 11.5px; font-family: 'JetBrains Mono', monospace; font-weight: 600; }

.am-incognito {
  font-size: 10px;
  background: #FEF3C7;
  color: #78350F;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid #FDE68A;
}

.am-visit-count {
  font-size: 12.5px;
  color: var(--text-1);
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
}

.am-title-dur {
  font-size: 12.5px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-1);
  text-align: right;
}

/* Empty / loading */
.am-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-2);
}
.am-empty-icon { font-size: 40px; margin-bottom: 12px; opacity: .6; }
.am-empty-text { font-size: 14px; font-weight: 600; }

.am-loading {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  padding: 4rem;
}
.am-loading span {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: am-bounce 1.2s infinite ease-in-out both;
}
.am-loading span:nth-child(1) { animation-delay: -.32s; }
.am-loading span:nth-child(2) { animation-delay: -.16s; }

.am-capture-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #0F766E;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background .2s, transform .15s;
  box-shadow: 0 2px 8px rgba(15,118,110,.30);
  white-space: nowrap;
}
.am-capture-btn:hover { background: #0D6B63; transform: translateY(-1px); }
.am-capture-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.am-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.am-modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.am-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 4px;
}
.am-modal-sub {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 20px;
}
.am-modal-img-box {
  border: 2px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.am-modal-img-label {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  background: var(--surface-2);
  color: var(--text-2);
  border-bottom: 1px solid var(--border);
}
.am-modal-img-box img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
.am-modal-no-img {
  width: 100%;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 13px;
  background: var(--surface-2);
}
.am-modal-close {
  width: 100%;
  padding: 10px;
  background: var(--text-1);
  color: var(--surface);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}
.am-modal-close:hover { opacity: 0.9; }

@keyframes am-bounce {
  0%,80%,100% { transform: scale(0); opacity:.4; }
  40% { transform: scale(1); opacity:1; }
}
/* ── Timeline / hour-group styles ── */
.am-hour-group {}

.am-hour-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px;
  background: var(--surface-2);
  border-bottom: 1.5px solid var(--border);
  border-top: 1.5px solid var(--border);
}

.am-hour-badge {
  font-size: 11px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  background: #4F46E5;
  color: #fff;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: .04em;
  white-space: nowrap;
}

.am-hour-count {
  font-size: 11px;
  font-weight: 600;
  color: #6366F1;
}

.am-hour-group .am-title-row {
  padding-left: 28px;
}

/* ── NEW — add at end of css string ── */
.am-stream-modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 0;
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  overflow: hidden;
}
.am-stream-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #0A0C10;
  color: #fff;
  flex-shrink: 0;
}
.am-stream-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; font-weight: 700;
}
.am-stream-live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #ef4444;
  animation: am-pulse 1s infinite;
}
.am-stream-screen {
  background: #000;
  flex: 1 1 auto;
  min-height: 0;
  max-height: calc(90vh - 110px);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative;
}
.am-stream-screen img { width: 100%; height: 100%; object-fit: contain; }
.am-stream-locked {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; color: #9CA3AF;
}
.am-stream-locked-icon { font-size: 52px; opacity: .4; }
.am-stream-locked-text { font-size: 15px; font-weight: 600; }
.am-stream-waiting {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; color: var(--text-2); min-height: 200px;
}
.am-stream-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: var(--surface-2);
  border-top: 1px solid var(--border);
  font-size: 12px; color: var(--text-2);
  flex-shrink: 0;
}
.am-stream-stop-btn {
  padding: 8px 20px;
  background: #DC2626; color: #fff;
  border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600;
  font-family: "'DM Sans', sans-serif";
  cursor: pointer;
}
.am-stream-stop-btn:hover { background: #B91C1C; }
`;
;

/* ── Chevron SVG ── */
const Chevron = ({ open }) => (
    <svg className={`am-chevron ${open ? "open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

export default function ActivityMonitor() {
    useContext(AuthContext);

    const [employees, setEmployees] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openCards, setOpenCards] = useState({});
    const [search, setSearch] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [capturing, setCapturing] = useState(false);
    const [captureModal, setCaptureModal] = useState(null);
    const [streaming, setStreaming] = useState(false);
    const [streamFrame, setStreamFrame] = useState(null);
    const [streamLocked, setStreamLocked] = useState(false);
    const [streamModal, setStreamModal] = useState(false);
    const streamIdRef = useRef(null);
    const [timelineView, setTimelineView] = useState(false);
    const styleRef = useRef(false);

    /* Inject CSS once */
    useEffect(() => {
        if (styleRef.current) return;
        const tag = document.createElement("style");
        tag.textContent = css;
        document.head.appendChild(tag);
        styleRef.current = true;
    }, []);

    /* Load employees */
    useEffect(() => {
        API.get("/users?limit=200&status=active")
            .then(r => {
                const list = r.data?.users || r.data?.employees || r.data?.data || (Array.isArray(r.data) ? r.data : []);
                setEmployees(list);
                if (list.length > 0) setSelectedUser(list[0]._id);
            })
            .catch(() => { });
    }, []);

    /* Fetch activity */
    const fetchActivity = useCallback(() => {
        if (!selectedUser) return;
        setLoading(true);
        setData([]);
        setOpenCards({});
        API.get(`/activity-monitor/app-detail/${selectedUser}?date=${date}`)
            .then(r => setData(r.data?.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [selectedUser, date, refreshKey]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const handleRefresh = () => {
        setRefreshKey(k => k + 1);
    };


    useEffect(() => {
        // Join hr_room so server can emit capture:done to HR
        socket.emit("join:hr_room");

        const handleCaptureDone = (data) => {
            if (data.employeeId === selectedUser) {
                if (pollRef.current) clearInterval(pollRef.current);
                setCapturing(false);
                setCaptureModal({
                    screenshot: data.screenshot || null,
                    webcamPhoto: data.webcamPhoto || null,
                    completedAt: data.completedAt || new Date().toISOString(),
                    failed: data.status === "failed" || (!data.screenshot && !data.webcamPhoto),
                });
            }
        };

        // ── NEW ──
        const handleStreamStarted = ({ streamId, targetUserId }) => {
            if (targetUserId === selectedUser) {
                streamIdRef.current = streamId;
            }
        };

        const handleStreamFrame = (data) => {
            if (data.streamId !== streamIdRef.current) return;
            if (data.locked) {
                setStreamLocked(true);
                setStreamFrame(null);
            } else if (data.unlocked) {
                setStreamLocked(false);
            } else if (data.frame) {
                setStreamLocked(false);
                setStreamFrame(data.frame);
            }
        };

        socket.on("stream:started", handleStreamStarted);
        socket.on("stream:frame", handleStreamFrame);
        socket.on("capture:done", handleCaptureDone);

        return () => {
            socket.off("capture:done", handleCaptureDone);
            socket.off("stream:started", handleStreamStarted);
            socket.off("stream:frame", handleStreamFrame);
        };
    }, [selectedUser]);



    const pollRef = useRef(null);  // add this with other useRef declarations at top

    const handleCapture = async () => {
        if (!selectedUser || capturing) return;
        if (pollRef.current) clearInterval(pollRef.current);
        setCapturing(true);
        try {
            const res = await API.post(`/activity-monitor/capture-request/${selectedUser}`);
            const captureId = res.data?.captureId;

            let attempts = 0;
            pollRef.current = setInterval(async () => {
                attempts++;
                try {
                    const check = await API.get(`/activity-monitor/captures/${selectedUser}`);
                    const latest = check.data?.data?.[0];
                    if (latest && latest._id === captureId?.toString() && latest.status === "completed") {
                        clearInterval(pollRef.current);
                        setCapturing(false);
                        setCaptureModal({
                            screenshot: latest.screenshot,
                            webcamPhoto: latest.webcamPhoto,
                            completedAt: latest.completedAt,
                        });
                        return;
                    }
                } catch (_) { }

                if (attempts >= 15) {
                    clearInterval(pollRef.current);
                    setCapturing(false);
                    setCaptureModal({
                        screenshot: null,
                        webcamPhoto: null,
                        completedAt: new Date().toISOString(),
                        failed: true,
                    });
                }
            }, 2000);

        } catch (err) {
            setCapturing(false);
            alert("Failed to send capture request");
        }
    };


    // ── NEW — add after handleCapture ──
    const handleStartStream = () => {
        if (!selectedUser) return;
        setStreamFrame(null);
        setStreamLocked(false);
        setStreamModal(true);
        setStreaming(true);
        socket.emit("stream:request", { targetUserId: selectedUser });
    };

    const handleStopStream = () => {
        setStreaming(false);
        setStreamModal(false);
        setStreamFrame(null);
        streamIdRef.current = null;
        socket.emit("stream:stop_request", { targetUserId: selectedUser });
    };

    const toggle = (name) =>
        setOpenCards(prev => ({ ...prev, [name]: !prev[name] }));

    const maxDur = data.reduce((m, a) => Math.max(m, a.totalDuration), 0);

    const filtered = data.filter(app =>
        !search ||
        app.appName.toLowerCase().includes(search.toLowerCase()) ||
        app.titles?.some(t => t.windowTitle.toLowerCase().includes(search.toLowerCase()))
    );

    const totalSec = data.reduce((s, a) => s + a.totalDuration, 0);
    const prodSec = data.filter(a => a.category === "productive").reduce((s, a) => s + a.totalDuration, 0);
    const unpSec = data.filter(a => a.category === "unproductive").reduce((s, a) => s + a.totalDuration, 0);
    const score = totalSec > 0 ? Math.round((prodSec / totalSec) * 100) : 0;

    const metrics = [
        { label: "Total tracked", value: fmtDur(totalSec), accent: "#4F46E5", color: "#0A0C10" },
        { label: "Productive", value: fmtDur(prodSec), accent: "#16A34A", color: "#14532D" },
        { label: "Unproductive", value: fmtDur(unpSec), accent: "#DC2626", color: "#7F1D1D" },
        { label: "Score", value: `${score}%`, accent: score >= 60 ? "#16A34A" : score >= 30 ? "#D97706" : "#DC2626", color: "#0A0C10" },
    ];

    return (
        <DashboardLayout>
            <div className="am-wrap">

                {/* Header */}
                <div className="am-header">
                    <div className="am-live-dot" />
                    <h1 className="am-title">Activity Monitor</h1>
                    <button
                        className="am-refresh-btn"
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Refresh data"
                    >
                        <RefreshIcon spinning={loading} />
                        Refresh
                    </button>

                    <button
                        onClick={() => setTimelineView(v => !v)}
                        style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "8px 16px",
                            background: timelineView ? "#4F46E5" : "#fff",
                            color: timelineView ? "#fff" : "#4F46E5",
                            border: "2px solid #4F46E5",
                            borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                            cursor: "pointer", whiteSpace: "nowrap",
                            transition: "all .2s",
                        }}
                        title="Toggle hourly timeline view"
                    >
                        🕐 {timelineView ? "Timeline ON" : "Timeline"}
                    </button>

                    <button
                        className="am-capture-btn"
                        onClick={handleCapture}
                        disabled={capturing || !selectedUser}
                        title="Take screenshot + webcam photo from employee PC"
                    >
                        {capturing ? "⏳ Capturing..." : "📸 Capture"}
                    </button>

                    <button
                        onClick={streaming ? handleStopStream : handleStartStream}
                        disabled={!selectedUser}
                        style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "8px 16px",
                            background: streaming ? "#DC2626" : "#7C3AED",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 13.5, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                            cursor: !selectedUser ? "not-allowed" : "pointer",
                            opacity: !selectedUser ? 0.6 : 1,
                            boxShadow: streaming ? "0 2px 8px rgba(220,38,38,.35)" : "0 2px 8px rgba(124,58,237,.35)",
                            transition: "all .2s",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {streaming ? "⏹ Stop Live" : "📹 Live View"}
                    </button>
                </div>

                {/* Filters */}
                <div className="am-filters">
                    <select
                        className="am-select"
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                    >
                        {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                                {emp.name}{emp.employeeId ? ` (${emp.employeeId})` : ""} — {emp._id}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="am-date-input"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />

                    <input
                        type="text"
                        className="am-search"
                        placeholder="Search app or window title…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Summary */}
                <div className="am-summary">
                    {metrics.map(m => (
                        <div key={m.label} className="am-metric" style={{ "--metric-accent": m.accent }}>
                            <div className="am-metric-label">{m.label}</div>
                            <div className="am-metric-value" style={{ color: m.color }}>{m.value}</div>
                        </div>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="am-loading">
                        <span /><span /><span />
                    </div>
                )}

                {/* Empty */}
                {!loading && !filtered.length && (
                    <div className="am-empty">
                        <div className="am-empty-icon">📭</div>
                        <div className="am-empty-text">No activity recorded for this date.</div>
                    </div>
                )}

                {/* App cards */}
                {!loading && filtered.map((app, idx) => {
                    const cfg = catConfig(app.category, app.isBrowser);
                    const domCat = app.isBrowser && app.category === "neutral" ? "browser" : app.category;
                    const isOpen = !!openCards[app.appName];
                    const pct = maxDur > 0 ? Math.round((app.totalDuration / maxDur) * 100) : 0;
                    const icon = getAppIcon(app.appName, app.category, app.isBrowser);

                    return (
                        <div
                            key={app.appName}
                            className={`am-card ${isOpen ? "am-open" : ""}`}
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            {/* Header */}
                            <div className="am-card-header" onClick={() => toggle(app.appName)}>
                                <div
                                    className="am-icon-wrap"
                                    style={{ background: cfg.bg, borderColor: cfg.border }}
                                >
                                    {icon}
                                </div>

                                <span className="am-app-name">{app.appName}</span>

                                <span
                                    className="am-badge"
                                    style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                                >
                                    {domCat}
                                </span>

                                <span className="am-windows-count">
                                    {app.titles?.length || 0} window{app.titles?.length !== 1 ? "s" : ""}
                                </span>

                                <span className="am-duration">{fmtDur(app.totalDuration)}</span>

                                <Chevron open={isOpen} />
                            </div>

                            {/* Bar */}
                            <div className="am-bar-track">
                                <div
                                    className="am-bar-fill"
                                    style={{ width: `${pct}%`, background: barColor(app.category, app.isBrowser) }}
                                />
                            </div>

                            {/* Expanded titles */}
                            {isOpen && (
                                <div className="am-titles">
                                    {/* Column headers */}
                                    <div className="am-titles-head">
                                        <span></span>
                                        <span>Window / Tab Title</span>
                                        <span>Start Time</span>
                                        <span>End Time</span>
                                        <span style={{ textAlign: "center" }}>Visits</span>
                                        <span style={{ textAlign: "right" }}>Duration</span>
                                        <span></span>
                                    </div>

                                    {timelineView ? (
                                        /* ── Timeline (hourly grouped) view ── */
                                        groupByHour(app.titles || []).map(slot => (
                                            <div key={slot.label} className="am-hour-group">
                                                {/* Hour label bar */}
                                                <div className="am-hour-label">
                                                    <span className="am-hour-badge">🕐 {slot.label}</span>
                                                    <span className="am-hour-count">
                                                        {slot.titles.length} window{slot.titles.length !== 1 ? "s" : ""}
                                                    </span>
                                                </div>

                                                {slot.titles.map((t, i) => (
                                                    <div key={i} className="am-title-row">
                                                        <div className="am-title-bullet" style={{ background: cfg.dot }} />
                                                        <span className="am-title-text" title={t.windowTitle}>{t.windowTitle}</span>
                                                        <div className="am-time-cell am-time-start">
                                                            <div className="am-time-label">Start</div>
                                                            <div className="am-time-value">{fmtTime(t.firstSeen)}</div>
                                                        </div>
                                                        <div className="am-time-cell am-time-end">
                                                            <div className="am-time-label">End</div>
                                                            <div className="am-time-value">{fmtTime(t.lastSeen)}</div>
                                                        </div>
                                                        <span className="am-visit-count">{t.visits} {t.visits === 1 ? "time" : "times"}</span>
                                                        <span className="am-title-dur">{t.totalDurationFormatted || fmtDur(t.totalDuration)}</span>
                                                        {t.isIncognito ? <span className="am-incognito">🕵️ incognito</span> : <span />}
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        /* ── Default flat view ── */
                                        app.titles?.map((t, i) => (
                                            <div key={i} className="am-title-row">
                                                <div className="am-title-bullet" style={{ background: cfg.dot }} />
                                                <span className="am-title-text" title={t.windowTitle}>{t.windowTitle}</span>
                                                <div className="am-time-cell am-time-start">
                                                    <div className="am-time-label">Start</div>
                                                    <div className="am-time-value">{fmtTime(t.firstSeen)}</div>
                                                </div>
                                                <div className="am-time-cell am-time-end">
                                                    <div className="am-time-label">End</div>
                                                    <div className="am-time-value">{fmtTime(t.lastSeen)}</div>
                                                </div>
                                                <span className="am-visit-count">{t.visits} {t.visits === 1 ? "time" : "times"}</span>
                                                <span className="am-title-dur">{t.totalDurationFormatted || fmtDur(t.totalDuration)}</span>
                                                {t.isIncognito ? <span className="am-incognito">🕵️ incognito</span> : <span />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}


                {/* Capture Modal */}
                {captureModal && (
                    <div className="am-modal-overlay" onClick={() => setCaptureModal(null)}>
                        <div className="am-modal" onClick={e => e.stopPropagation()}>
                            <div className="am-modal-title">📸 Remote Capture</div>
                            <div className="am-modal-sub">
                                {captureModal.failed
                                    ? "⚠️ Capture failed — agent could not take screenshot"
                                    : `Captured at ${new Date(captureModal.completedAt).toLocaleTimeString()}`
                                }
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <div className="am-modal-img-box">
                                    <div className="am-modal-img-label">🖥️ Screenshot</div>
                                    {captureModal.screenshot
                                        ? <img src={captureModal.screenshot} alt="screenshot" style={{ width: "100%", maxHeight: "50vh", height: "auto", objectFit: "contain", display: "block" }} />
                                        : <div className="am-modal-no-img">No screenshot available</div>
                                    }
                                </div>
                            </div>
                            <button className="am-modal-close" onClick={() => setCaptureModal(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {streamModal && (
                    <div className="am-modal-overlay" onClick={handleStopStream}>
                        <div className="am-stream-modal" onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="am-stream-header">
                                <div className="am-stream-title">
                                    <div className="am-stream-live-dot" />
                                    Live View —&nbsp;
                                    {employees.find(e => e._id === selectedUser)?.name || selectedUser}
                                </div>
                                <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>

                            {/* Screen */}
                            <div className="am-stream-screen">
                                {streamLocked ? (
                                    <div className="am-stream-locked">
                                        <div className="am-stream-locked-icon">🔒</div>
                                        <div className="am-stream-locked-text">Screen is locked</div>
                                    </div>
                                ) : streamFrame ? (
                                    <img src={streamFrame} alt="live screen" />
                                ) : (
                                    <div className="am-stream-waiting">
                                        <div className="am-loading" style={{ padding: 0 }}>
                                            <span /><span /><span />
                                        </div>
                                        <div style={{ fontSize: 13 }}>Waiting for stream...</div>
                                        <div style={{ fontSize: 11 }}>Employee app must be running</div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="am-stream-footer">
                                <span>~2 fps · JPEG compressed · encrypted via Socket.IO</span>
                                <button className="am-stream-stop-btn" onClick={handleStopStream}>
                                    ⏹ Stop Stream
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}