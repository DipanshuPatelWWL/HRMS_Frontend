import { useState, useEffect } from "react";
import { getMyAssets, getAssetHistory } from "../../services/assetsServices";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { HistoryTimeline } from "../../components/common/AssetShared";
import { BASE_URL } from "../../services/api";

/* ─── Inject Styles ──────────────────────────────────────────────────────── */
const injectStyles = () => {
    if (document.head.querySelector("style[data-ma2]")) return;
    const s = document.createElement("style");
    s.setAttribute("data-ma2", "1");
    s.textContent = `
    @keyframes ma2-rise    { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
    @keyframes ma2-pop     { 0%{transform:scale(.9);opacity:0} 60%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
    @keyframes ma2-spin    { to { transform:rotate(360deg) } }
    @keyframes ma2-fadein  { from{opacity:0} to{opacity:1} }
    @keyframes ma2-slideup { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

    .ma2-wrap * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

    /* ── Card ── */
    .ma2-card {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 16px;
        padding: 20px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: border-color .2s, box-shadow .2s, transform .2s;
        animation: ma2-rise .4s cubic-bezier(.22,1,.36,1) both;
    }
    .ma2-card:hover {
        border-color: #1D9E75;
        box-shadow: 0 12px 32px rgba(29,158,117,.15);
        transform: translateY(-3px);
    }
    .ma2-card:hover .ma2-card-arrow { opacity: 1; transform: translateX(0); }

    .ma2-card-arrow {
        opacity: 0;
        transform: translateX(-4px);
        transition: opacity .2s, transform .2s;
        color: #1D9E75;
        display: flex;
        align-items: center;
    }

    /* ── Stat ── */
    .ma2-stat {
        border-radius: 14px;
        padding: 18px 20px;
        border: 2px solid transparent;
        transition: transform .2s, box-shadow .2s;
        animation: ma2-rise .4s cubic-bezier(.22,1,.36,1) both;
    }
    .ma2-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }

    /* ── Info row ── */
    .ma2-info {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 14px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 14px;
        animation: ma2-rise .4s cubic-bezier(.22,1,.36,1) both;
        transition: border-color .2s;
    }
    .ma2-info:hover { border-color: #1D9E75; }

    /* ── History button ── */
    .ma2-hist-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 14px; border-radius: 8px;
        border: 2px solid #cbd5e1; background: var(--surface);
        font-size: 12px; font-weight: 700; color: var(--text-1);
        cursor: pointer; transition: all .18s;
        font-family: 'Plus Jakarta Sans', sans-serif;
        letter-spacing: .01em;
    }
    .ma2-hist-btn:hover {
        background: #f0faf6; border-color: #1D9E75; color: #1D9E75;
    }

    /* ── Modal ── */
    .ma2-modal-bg {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.55);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000; padding: 16px;
        animation: ma2-fadein .2s ease both;
        backdrop-filter: blur(3px);
    }
    .ma2-modal {
        background: var(--surface);
        border-radius: 20px;
        width: 100%; max-width: 480px;
        max-height: 88vh; overflow-y: auto;
        box-shadow: 0 32px 80px rgba(0,0,0,.22);
        animation: ma2-pop .3s cubic-bezier(.22,1,.36,1) both;
    }
    .ma2-spin { animation: ma2-spin .75s linear infinite; }

    .ma2-detail-field {
        background: var(--surface-2);
        border: 1.5px solid var(--border);
        border-radius: 10px;
        padding: 12px 14px;
    }
    .ma2-tag {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 12px; border-radius: 20px;
        font-size: 11.5px; font-weight: 700; letter-spacing: .02em;
    }
    .ma2-pwd-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 6px 12px; border-radius: 8px;
        border: 2px solid var(--border); background: var(--surface);
        font-size: 12px; font-weight: 700; color: var(--text-1);
        cursor: pointer; transition: all .17s;
        font-family: 'Plus Jakarta Sans', sans-serif;
        white-space: nowrap; flex-shrink: 0;
    }
    .ma2-pwd-btn:hover { border-color: #1D9E75; color: #1D9E75; background: #f0faf6; }

    /* ── Responsive: Stats grid ── */
    .ma2-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 18px;
    }

    /* ── Responsive: Asset grid ── */
    .ma2-asset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
        gap: 14px;
    }

    /* ── Responsive: Detail fields grid ── */
    .ma2-fields-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 20px;
    }

    /* ── Page wrapper padding ── */
    .ma2-page {
        padding: 28px 28px 60px;
        max-width: 960px;
        margin: 0 auto;
    }

    /* ── Tablet: ≤ 768px ── */
    @media (max-width: 768px) {
        .ma2-page {
            padding: 20px 16px 60px;
        }
        .ma2-stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        .ma2-stat {
            padding: 14px 12px;
        }
        .ma2-stat-num {
            font-size: 24px !important;
        }
        .ma2-stat-icon {
            display: none !important;
        }
        .ma2-asset-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .ma2-card {
            padding: 14px;
        }
        .ma2-fields-grid {
            grid-template-columns: 1fr 1fr;
        }
        .ma2-modal {
            max-width: 100%;
            border-radius: 16px;
        }
    }

    /* ── Mobile: ≤ 480px ── */
    @media (max-width: 480px) {
        .ma2-page {
            padding: 16px 12px 72px;
        }

        /* Stats: single row of 3 compact tiles */
        .ma2-stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            margin-bottom: 12px;
        }
        .ma2-stat {
            padding: 10px 8px;
            border-radius: 10px;
        }
        .ma2-stat-label {
            font-size: 9px !important;
            letter-spacing: .04em !important;
        }
        .ma2-stat-num {
            font-size: 22px !important;
        }
        .ma2-stat-icon {
            display: none !important;
        }

        /* Info rows */
        .ma2-info {
            padding: 12px 14px;
            gap: 10px;
            border-radius: 12px;
        }
        .ma2-info-icon-wrap {
            width: 38px !important;
            height: 38px !important;
            border-radius: 10px !important;
        }
        .ma2-info-value {
            font-size: 14px !important;
        }

        /* Asset grid: single column */
        .ma2-asset-grid {
            grid-template-columns: 1fr;
            gap: 10px;
        }
        .ma2-card {
            padding: 14px 14px;
            border-radius: 12px;
        }
        .ma2-card-icon-wrap {
            width: 40px !important;
            height: 40px !important;
            border-radius: 10px !important;
        }
        .ma2-card-name {
            font-size: 13.5px !important;
        }

        /* Modal: bottom sheet on mobile */
        .ma2-modal-bg {
            align-items: flex-end;
            padding: 0;
        }
        .ma2-modal {
            max-width: 100%;
            max-height: 92vh;
            border-radius: 20px 20px 0 0;
        }
        .ma2-fields-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .ma2-detail-field {
            padding: 10px 11px;
        }

        /* Page heading */
        .ma2-page-title {
            font-size: 20px !important;
        }
        .ma2-section-label {
            font-size: 10px !important;
        }
    }

    /* ── Very small: ≤ 360px ── */
    @media (max-width: 360px) {
        .ma2-fields-grid {
            grid-template-columns: 1fr;
        }
        .ma2-stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
        }
        .ma2-stat-num {
            font-size: 18px !important;
        }
    }
    `;
    document.head.appendChild(s);
};

/* ─── Asset Config ───────────────────────────────────────────────────────── */
const ASSET_META = {
    Laptop: { bg: "var(--success-bg)", accent: "#166534", border: "#86EFAC" },
    Monitor: { bg: "var(--brand-light)", accent: "#1e40af", border: "#93C5FD" },
    Mouse: { bg: "#FEF9C3", accent: "#854d0e", border: "#FDE047" },
    Keyboard: { bg: "var(--surface-3)", accent: "#6b21a8", border: "#D8B4FE" },
    Headset: { bg: "#FCE7F3", accent: "#9d174d", border: "#F9A8D4" },
    Other: { bg: "var(--surface-2)", accent: "#334155", border: "#CBD5E1" },
};

const COND = {
    Good: { bg: "var(--success-bg)", color: "#166534", dot: "#16a34a" },
    New: { bg: "#D1FAE5", color: "#065f46", dot: "#059669" },
    Damaged: { bg: "var(--warn-bg)", color: "#92400e", dot: "#d97706" },
    Replaced: { bg: "var(--brand-light)", color: "#1e40af", dot: "#2563eb" },
    Retired: { bg: "var(--danger-bg)", color: "#9f1239", dot: "#e11d48" },
    Fair: { bg: "#FEF9C3", color: "#854d0e", dot: "#ca8a04" },
};

const toUrl = (path) =>
    !path ? "" : path.startsWith("http") ? path : `${BASE_URL}/${path.replace(/^\//, "")}`;

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */
const Icons = {
    Laptop: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M1 21h22" />
        </svg>
    ),
    Monitor: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
    ),
    Mouse: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="7" /><path d="M12 2v7" /><line x1="12" y1="9" x2="12" y2="9" />
        </svg>
    ),
    Keyboard: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" />
        </svg>
    ),
    Headset: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" /><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
    ),
    Package: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
        </svg>
    ),
    History: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
        </svg>
    ),
    Eye: ({ size = 14, open }) => open
        ? <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
        : <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
    X: ({ size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
    ),
    Desk: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="7" width="20" height="4" rx="1" /><path d="M5 11v6M19 11v6M5 17h14" />
        </svg>
    ),
    Lock: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Barcode: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14" />
        </svg>
    ),
    Spin: ({ size = 18 }) => (
        <svg className="ma2-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
    ),
    Arrow: ({ size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
    ),
    Tag: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
    ),
    Calendar: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    ),
    Shield: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
    DollarSign: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
    Building: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
    ),
    CheckCircle: ({ size = 36 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    ),
    AlertTriangle: ({ size = 36 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    ),
    Layers: ({ size = 36 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
    ),
    Info: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
    ),
};

const ASSET_ICONS = {
    Laptop: Icons.Laptop,
    Monitor: Icons.Monitor,
    Mouse: Icons.Mouse,
    Keyboard: Icons.Keyboard,
    Headset: Icons.Headset,
    Other: Icons.Package,
};

/* ─── Condition Badge ────────────────────────────────────────────────────── */
function CondBadge({ value }) {
    const c = COND[value] || { bg: "var(--surface-2)", color: "#334155", dot: "var(--text-2)" };
    return (
        <span className="ma2-tag" style={{ background: c.bg, color: c.color }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0 }} />
            {value}
        </span>
    );
}

/* ─── Asset Detail Modal ─────────────────────────────────────────────────── */
function AssetDetailModal({ asset, onClose, onHistory }) {
    const meta = ASSET_META[asset.assetType] || ASSET_META.Other;
    const AssetIcon = ASSET_ICONS[asset.assetType] || Icons.Package;

    useEffect(() => {
        const h = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", h);
        // Prevent background scroll on mobile
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", h);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

    const fields = [
        { icon: Icons.Barcode, label: "Barcode", value: asset.barcode, mono: true },
        { icon: Icons.Building, label: "Company", value: asset.vendor || "—" },
        { icon: Icons.DollarSign, label: "Cost", value: asset.cost != null ? `₹${Number(asset.cost).toLocaleString("en-IN")}` : "—" },
        { icon: Icons.Calendar, label: "Purchase Date", value: fmtDate(asset.purchaseDate) },
        { icon: Icons.Shield, label: "Warranty Expiry", value: fmtDate(asset.warrantyExpiry) },
        { icon: Icons.Tag, label: "Assigned Date", value: fmtDate(asset.assignedDate) },
    ];

    return (
        <div className="ma2-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ma2-modal">
                {/* ── Modal Header ── */}
                <div style={{
                    padding: "20px 22px 18px",
                    borderBottom: "2px solid var(--surface-2)",
                    display: "flex", alignItems: "center", gap: 14,
                    position: "sticky", top: 0, background: "var(--surface)", zIndex: 1,
                    borderRadius: "20px 20px 0 0",
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 13,
                        background: meta.bg, border: `2px solid ${meta.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: meta.accent, flexShrink: 0,
                    }}>
                        <AssetIcon size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-1)", lineHeight: 1.2 }}>
                            {asset.name}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 600, marginTop: 2 }}>
                            {asset.assetType}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 34, height: 34, borderRadius: 9,
                        border: "2px solid var(--border)", background: "var(--surface)",
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "#334155", flexShrink: 0,
                        transition: "all .15s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.color = "#1D9E75"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "#334155"; }}
                    >
                        <Icons.X size={15} />
                    </button>
                </div>

                <div style={{ padding: "20px 22px 24px" }}>
                    {/* Photo */}
                    {asset.photoUrl && (
                        <div style={{ marginBottom: 20 }}>
                            <img
                                src={toUrl(asset.photoUrl)}
                                alt={asset.name}
                                style={{
                                    width: "100%", maxHeight: 200, borderRadius: 12,
                                    objectFit: "cover",
                                    border: "2px solid var(--border)",
                                    display: "block",
                                }}
                            />
                        </div>
                    )}

                    {/* Badges */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                        <CondBadge value={asset.condition} />
                        <span className="ma2-tag" style={{ background: meta.bg, color: meta.accent, border: `1.5px solid ${meta.border}` }}>
                            <AssetIcon size={11} /> {asset.assetType}
                        </span>
                    </div>

                    {/* Fields grid */}
                    <div className="ma2-fields-grid">
                        {fields.map(({ icon: FieldIcon, label, value, mono }) => (
                            <div key={label} className="ma2-detail-field">
                                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                                    <span style={{ color: "var(--text-2)", display: "flex" }}><FieldIcon size={12} /></span>
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-2)" }}>
                                        {label}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 13.5, fontWeight: 700, color: "var(--text-1)",
                                    fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
                                    letterSpacing: mono ? 0.5 : undefined,
                                    wordBreak: "break-all",
                                }}>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* History CTA */}
                    <button
                        className="ma2-hist-btn"
                        style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 13, borderRadius: 10 }}
                        onClick={() => { onClose(); onHistory(); }}
                    >
                        <Icons.History size={15} /> View Full History
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── History Modal ──────────────────────────────────────────────────────── */
function HistoryModal({ modal, loading, onClose }) {
    useEffect(() => {
        const h = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", h);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", h);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div className="ma2-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ma2-modal">
                <div style={{
                    padding: "20px 22px", borderBottom: "2px solid var(--surface-2)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    position: "sticky", top: 0, background: "var(--surface)", zIndex: 1,
                    borderRadius: "20px 20px 0 0",
                }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)" }}>
                            Asset History
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600, marginTop: 1 }}>
                            {modal.asset.name || modal.asset.assetType}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 34, height: 34, borderRadius: 9,
                        border: "2px solid var(--border)", background: "var(--surface)",
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#334155",
                    }}>
                        <Icons.X size={15} />
                    </button>
                </div>
                <div style={{ padding: "20px 22px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <CondBadge value={modal.asset.condition} />
                    </div>
                    {loading ? (
                        <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#334155", fontSize: 13, fontWeight: 600 }}>
                            <Icons.Spin /> Loading history…
                        </div>
                    ) : modal.history.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-3)" }}>
                            <Icons.Info size={28} />
                            <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600 }}>No history found</p>
                        </div>
                    ) : (
                        <HistoryTimeline items={modal.history} showChangedBy={false} />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Asset Card ─────────────────────────────────────────────────────────── */
function AssetCard({ asset, delay, onHistory, onClick }) {
    const meta = ASSET_META[asset.assetType] || ASSET_META.Other;
    const AssetIcon = ASSET_ICONS[asset.assetType] || Icons.Package;

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : null;

    return (
        <div
            className="ma2-card"
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
        >
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div
                    className="ma2-card-icon-wrap"
                    style={{
                        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                        background: meta.bg, border: `2px solid ${meta.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: meta.accent,
                    }}
                >
                    <AssetIcon size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        className="ma2-card-name"
                        style={{
                            fontWeight: 800, fontSize: 14.5, color: "var(--text-1)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            marginBottom: 3,
                        }}
                    >
                        {asset.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>
                        {asset.assetType}
                    </div>
                </div>
                <CondBadge value={asset.condition} />
            </div>

            {/* Barcode */}
            <div style={{
                background: "var(--surface-2)", borderRadius: 8,
                padding: "8px 12px", marginBottom: 14,
                display: "flex", alignItems: "center", gap: 8,
                border: "1.5px solid var(--border)",
            }}>
                <span style={{ color: "var(--text-3)", display: "flex", flexShrink: 0 }}>
                    <Icons.Barcode size={13} />
                </span>
                <code style={{
                    fontSize: 12, color: "var(--text-1)", fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: 0.5, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {asset.barcode}
                </code>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-2)" }}>
                    <Icons.Calendar size={12} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>
                        {fmtDate(asset.assignedDate) ? `Assigned ${fmtDate(asset.assignedDate)}` : "No date"}
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                        className="ma2-hist-btn"
                        onClick={(e) => { e.stopPropagation(); onHistory(); }}
                    >
                        <Icons.History size={13} /> History
                    </button>
                    <span className="ma2-card-arrow">
                        <Icons.Arrow size={15} />
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function MyAssets() {
    injectStyles();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [historyModal, setHistoryModal] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [detailAsset, setDetailAsset] = useState(null);
    const [showPwd, setShowPwd] = useState(false);

    useEffect(() => {
        getMyAssets()
            .then((res) => {
                const payload = res.data?.employee ? res.data : res.data?.data;
                setData(payload ?? res.data);
            })
            .catch(() => setError("Failed to load your assets. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    const openHistory = async (asset) => {
        setHistoryModal({ asset, history: [] });
        setHistoryLoading(true);
        try {
            const res = await getAssetHistory(asset._id);
            setHistoryModal({ asset, history: res.data.data || [] });
        } catch {
            setHistoryModal({ asset, history: [] });
        } finally {
            setHistoryLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ padding: 80, textAlign: "center", color: "#334155", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <Icons.Spin size={28} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Loading your assets…</span>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div style={{
                    margin: 16, padding: "18px 22px",
                    background: "var(--danger-bg)", border: "2px solid #FECDD3",
                    borderRadius: 12, color: "#9f1239",
                    fontSize: 14, fontWeight: 600, display: "flex", gap: 10, alignItems: "center",
                }}>
                    <Icons.AlertTriangle size={18} /> {error}
                </div>
            </DashboardLayout>
        );
    }

    if (!data) return null;

    const employee = data.employee ?? {};
    const assets = data.assets ?? [];
    const deskNumber = data.deskNumber ?? "";
    const systemPassword = data.systemPassword ?? "";

    const goodCount = assets.filter((a) => a.condition === "Good" || a.condition === "New").length;
    const damagedCount = assets.filter((a) => a.condition === "Damaged").length;

    const stats = [
        {
            num: assets.length, label: "Total Assets",
            bg: "#E1F5EE", border: "#6EE7B7", color: "#065f46", numColor: "#064e3b",
            Icon: Icons.Layers,
        },
        {
            num: goodCount, label: "Good Condition",
            bg: "#F0FDF4", border: "#86EFAC", color: "#166534", numColor: "#14532d",
            Icon: Icons.CheckCircle,
        },
        {
            num: damagedCount, label: "Damaged",
            bg: "var(--warn-bg)", border: "#FCD34D", color: "#92400e", numColor: "#78350f",
            Icon: Icons.AlertTriangle,
        },
    ];

    return (
        <DashboardLayout>
            <div className="ma2-wrap ma2-page">

                {/* ── Page Header ── */}
                <div style={{ marginBottom: 24, animation: "ma2-rise .4s cubic-bezier(.22,1,.36,1) both" }}>
                    <h1
                        className="ma2-page-title"
                        style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)", margin: 0, letterSpacing: "-.02em" }}
                    >
                        My Assets
                    </h1>
                    <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: "5px 0 0", fontWeight: 500 }}>
                        Equipment and accessories assigned to you by the company
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="ma2-stats-grid">
                    {stats.map(({ num, label, bg, border, color, numColor, Icon }, i) => (
                        <div
                            key={label}
                            className="ma2-stat"
                            style={{ background: bg, border: `2px solid ${border}`, animationDelay: `${i * 70}ms` }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        className="ma2-stat-label"
                                        style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color, marginBottom: 8 }}
                                    >
                                        {label}
                                    </div>
                                    <div
                                        className="ma2-stat-num"
                                        style={{ fontSize: 30, fontWeight: 800, color: numColor, lineHeight: 1 }}
                                    >
                                        {num}
                                    </div>
                                </div>
                                <div className="ma2-stat-icon" style={{ color, opacity: .5, flexShrink: 0 }}>
                                    <Icon size={30} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Desk ── */}
                <div className="ma2-info" style={{ marginBottom: 10, animationDelay: "180ms" }}>
                    <div
                        className="ma2-info-icon-wrap"
                        style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "#EFF6FF", border: "2px solid #BFDBFE",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#1d4ed8", flexShrink: 0,
                        }}
                    >
                        <Icons.Desk size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-2)", marginBottom: 3 }}>
                            Your Desk
                        </div>
                        <div
                            className="ma2-info-value"
                            style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            {deskNumber || <span style={{ color: "var(--text-3)", fontStyle: "italic", fontWeight: 500, fontSize: 14 }}>Not assigned</span>}
                        </div>
                    </div>
                </div>

                {/* ── System Password ── */}
                <div className="ma2-info" style={{ marginBottom: 28, animationDelay: "240ms" }}>
                    <div
                        className="ma2-info-icon-wrap"
                        style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "#F0FDF4", border: "2px solid #BBF7D0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#166534", flexShrink: 0,
                        }}
                    >
                        <Icons.Lock size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-2)", marginBottom: 3 }}>
                            System Password
                        </div>
                        <div
                            className="ma2-info-value"
                            style={{
                                fontSize: 16, fontWeight: 800, color: "var(--text-1)",
                                fontFamily: showPwd ? "'JetBrains Mono', monospace" : undefined,
                                letterSpacing: showPwd ? 2 : undefined,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                        >
                            {systemPassword
                                ? (showPwd ? systemPassword : "•".repeat(Math.min(systemPassword.length, 10)))
                                : <span style={{ color: "var(--text-3)", fontStyle: "italic", fontWeight: 500, fontSize: 14 }}>Not set</span>
                            }
                        </div>
                    </div>
                    {systemPassword && (
                        <button className="ma2-pwd-btn" onClick={() => setShowPwd((p) => !p)}>
                            <Icons.Eye size={14} open={showPwd} />
                            {showPwd ? "Hide" : "Show"}
                        </button>
                    )}
                </div>

                {/* ── Section Label ── */}
                <div
                    className="ma2-section-label"
                    style={{
                        fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                        letterSpacing: ".08em", color: "#334155", marginBottom: 14,
                        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                        animation: "ma2-rise .4s 300ms cubic-bezier(.22,1,.36,1) both",
                    }}
                >
                    <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 22, height: 22, borderRadius: 6,
                        background: "#1D9E75", color: "var(--surface)",
                        fontSize: 11, fontWeight: 800,
                    }}>
                        {assets.length}
                    </span>
                    Assigned Assets
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                        — click any card to view details
                    </span>
                </div>

                {/* ── Asset Grid ── */}
                {assets.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "60px 0", color: "var(--text-3)",
                        animation: "ma2-rise .4s 300ms cubic-bezier(.22,1,.36,1) both",
                    }}>
                        <div style={{ color: "#cbd5e1", marginBottom: 12, display: "flex", justifyContent: "center" }}>
                            <Icons.Package size={52} />
                        </div>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-2)" }}>No assets assigned yet</p>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-3)" }}>Your company hasn't assigned any equipment to you</p>
                    </div>
                ) : (
                    <div className="ma2-asset-grid">
                        {assets.map((asset, i) => (
                            <AssetCard
                                key={asset._id}
                                asset={asset}
                                delay={320 + i * 55}
                                onHistory={() => openHistory(asset)}
                                onClick={() => setDetailAsset(asset)}
                            />
                        ))}
                    </div>
                )}

                {/* ── Modals ── */}
                {detailAsset && (
                    <AssetDetailModal
                        asset={detailAsset}
                        onClose={() => setDetailAsset(null)}
                        onHistory={() => openHistory(detailAsset)}
                    />
                )}
                {historyModal && (
                    <HistoryModal
                        modal={historyModal}
                        loading={historyLoading}
                        onClose={() => setHistoryModal(null)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}