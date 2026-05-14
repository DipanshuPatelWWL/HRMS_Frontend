import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
    getEmployeeAssets,
    addAsset,
    updateAssetCondition,
    uploadAssetPhoto,
    updateDesk,
    updateSystemPassword,
    getAssetHistory,
} from "../../services/assetsServices";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { HistoryTimeline } from "../../components/common/AssetShared";
import { BASE_URL } from "../../services/api";

// ─── Inline CSS ──────────────────────────────────────────────────────────────

const style = document.createElement("style");
style.textContent = `
  @keyframes am-fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes am-slideDown {
    from { opacity: 0; max-height: 0; }
    to   { opacity: 1; max-height: 600px; }
  }
  @keyframes am-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(29,158,117,.25); }
    50%      { box-shadow: 0 0 0 6px rgba(29,158,117,0); }
  }
  @keyframes am-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes am-pop {
    0%   { transform: scale(.85); opacity: 0; }
    60%  { transform: scale(1.04); }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes am-toastIn {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .am-fadeIn  { animation: am-fadeIn  .35s cubic-bezier(.22,1,.36,1) both; }
  .am-pop     { animation: am-pop     .3s  cubic-bezier(.22,1,.36,1) both; }
  .am-spinner { animation: am-spin    .8s  linear infinite; }
  .am-row-hover:hover { background: #f7faf9 !important; }
  .am-btn-ghost {
    background: none; border: 1px solid #e2e8f0; border-radius: 7px;
    padding: 5px 12px; font-size: 12px; cursor: pointer; color: #4a5568;
    transition: background .18s, border-color .18s, color .18s;
  }
  .am-btn-ghost:hover { background: #f0faf6; border-color: #1D9E75; color: #1D9E75; }
  .am-icon-btn {
    background: none; border: none; cursor: pointer; padding: 6px;
    border-radius: 6px; display: inline-flex; align-items: center;
    color: #718096; transition: background .15s, color .15s;
  }
  .am-icon-btn:hover { background: #edf2f7; color: #1D9E75; }
  .am-search-input {
    width: 100%; padding: 12px 16px 12px 44px;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; outline: none; box-sizing: border-box;
    transition: border-color .2s, box-shadow .2s;
    background: #fff;
  }
  .am-search-input:focus {
    border-color: #1D9E75;
    box-shadow: 0 0 0 3px rgba(29,158,117,.12);
  }
  .am-primary-btn {
    padding: 11px 22px; background: #1D9E75; color: #fff;
    border: none; border-radius: 9px; font-size: 13.5px;
    cursor: pointer; font-weight: 600; letter-spacing: .01em;
    display: inline-flex; align-items: center; gap: 7px;
    transition: background .18s, transform .12s, box-shadow .18s;
    white-space: nowrap;
  }
  .am-primary-btn:hover:not(:disabled) {
    background: #16856199;
    box-shadow: 0 4px 14px rgba(29,158,117,.3);
    transform: translateY(-1px);
  }
  .am-primary-btn:active:not(:disabled) { transform: translateY(0); }
  .am-primary-btn:disabled { background: #a0d4c4; cursor: not-allowed; }
  .am-modal-bg {
    position: fixed; inset: 0; background: rgba(15,20,30,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 16px; box-sizing: border-box;
    animation: am-fadeIn .2s ease both;
  }
  .am-modal {
    background: #fff; border-radius: 14px; width: 100%; max-width: 480px;
    max-height: 85vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,.18);
    animation: am-pop .28s cubic-bezier(.22,1,.36,1) both;
  }
  .am-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .am-table th {
    padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .06em; color: #718096;
    border-bottom: 1.5px solid #edf2f7; background: #f8fafc; white-space: nowrap;
  }
  .am-table td {
    padding: 13px 14px; border-bottom: 1px solid #f0f4f8;
    vertical-align: middle; color: #2d3748;
  }
  .am-table tbody tr {
    transition: background .15s;
  }
  .am-table tbody tr:last-child td { border-bottom: none; }
  .am-input {
    width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0;
    border-radius: 8px; font-size: 13.5px; outline: none;
    box-sizing: border-box; transition: border-color .18s, box-shadow .18s;
  }
  .am-input:focus { border-color: #1D9E75; box-shadow: 0 0 0 3px rgba(29,158,117,.1); }
  select.am-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23718096' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
  .am-label { font-size: 11.5px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: .04em; display: block; margin-bottom: 5px; }
  .am-card { background: #fff; border: 1px solid #edf2f7; border-radius: 12px; }
`;
if (!document.head.querySelector("style[data-am]")) {
    style.setAttribute("data-am", "1");
    document.head.appendChild(style);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_ASSET = {
    assetType: "", name: "", barcode: "", condition: "Good",
};
const CONDITIONS = ["Good", "Damaged", "Replaced", "Retired"];
const ASSET_TYPES = ["Laptop", "Mouse", "Keyboard", "Monitor", "Headset", "Other"];

// ─── Tiny icon SVGs ───────────────────────────────────────────────────────────

const Icon = {
    Search: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
    ),
    Plus: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
        </svg>
    ),
    X: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
    Eye: ({ open }) => open
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
    Edit: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    History: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
        </svg>
    ),
    Camera: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Laptop: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M1 21h22" />
        </svg>
    ),
    Desk: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="7" width="20" height="4" rx="1" /><path d="M5 11v6M19 11v6M5 17h14" />
        </svg>
    ),
    Lock: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    User: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Spinner: () => (
        <svg className="am-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
    ),
    Check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
};

// ─── Condition badge ──────────────────────────────────────────────────────────

const condColors = {
    Good: { bg: "#EAF3DE", color: "#3B6D11" },
    Damaged: { bg: "#FAEEDA", color: "#854F0B" },
    Replaced: { bg: "#E6F1FB", color: "#185FA5" },
    Retired: { bg: "#FAECE7", color: "#993C1D" },
};

function CondBadge({ value }) {
    const c = condColors[value] || { bg: "#f0f4f8", color: "#4a5568" };
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20, fontSize: 11.5,
            fontWeight: 600, background: c.bg, color: c.color,
        }}>
            {value}
        </span>
    );
}

// ─── Asset type icon ──────────────────────────────────────────────────────────

function AssetTypeIcon({ type }) {
    const icons = {
        Laptop: "💻", Monitor: "🖥️", Mouse: "🖱️",
        Keyboard: "⌨️", Headset: "🎧", Other: "📦",
    };
    // We use text emoji here only as asset-type glyphs inside a colored pill
    // so they render consistently without any "emoji" look in the UI chrome.
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8,
            background: "#E1F5EE", fontSize: 16,
        }}>
            <Icon.Laptop />
        </span>
    );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ onClose, children }) {
    useEffect(() => {
        const handler = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="am-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="am-modal">{children}</div>
        </div>
    );
}

function ModalHeader({ title, onClose }) {
    return (
        <div style={{
            padding: "18px 20px", borderBottom: "1px solid #edf2f7",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
            <strong style={{ fontSize: 15, color: "#1a202c" }}>{title}</strong>
            <button className="am-icon-btn" onClick={onClose} aria-label="Close">
                <Icon.X />
            </button>
        </div>
    );
}

// ─── Primary button ───────────────────────────────────────────────────────────

function PrimaryBtn({ children, style: s, ...rest }) {
    return (
        <button className="am-primary-btn" style={s} {...rest}>
            {children}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AssetManagement() {
    const { user } = useContext(AuthContext);

    const [employees, setEmployees] = useState([]);        // full employee list
    const [departments, setDepartments] = useState([]);    // unique dept list
    const [deptFilter, setDeptFilter] = useState("All");   // selected dept
    const [selectedEmpId, setSelectedEmpId] = useState(""); // _id of chosen emp
    const [empData, setEmpData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState("");
    const [notif, setNotif] = useState("");

    const [deskModal, setDeskModal] = useState(false);
    const [deskValue, setDeskValue] = useState("");
    const [pwdModal, setPwdModal] = useState(false);
    const [pwdValue, setPwdValue] = useState("");
    const [showPwd, setShowPwd] = useState(false);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newAsset, setNewAsset] = useState(EMPTY_ASSET);
    const [assetSaving, setAssetSaving] = useState(false);

    const [historyModal, setHistoryModal] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [condModal, setCondModal] = useState(null);
    const [condValue, setCondValue] = useState("Good");
    const [condNote, setCondNote] = useState("");
    const [condSaving, setCondSaving] = useState(false);

    const [detailAsset, setDetailAsset] = useState(null);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const toast = (msg) => {
        setNotif(msg);
        setTimeout(() => setNotif(""), 3500);
    };

    // ── Search ─────────────────────────────────────────────────────────────────

    const handleSelectEmployee = async (employeeId) => {
        if (!employeeId) { setEmpData(null); return; }
        setSelectedEmpId(employeeId);
        setLoading(true); setError(""); setEmpData(null);
        setShowPwd(false); setShowAddForm(false);
        try {
            const res = await getEmployeeAssets(employeeId);   // employeeId = "EMP001" string
            setEmpData({
                employee: res.data.employee,
                assets: res.data.assets ?? [],
                deskNumber: res.data.deskNumber ?? "",
                systemPassword: res.data.systemPassword ?? "",
            });
        } catch (err) {
            setError(
                err.response?.status === 404
                    ? `No record found for selected employee`
                    : "Something went wrong. Please try again."
            );
        } finally { setLoading(false); }
    };

    // ── Desk update ────────────────────────────────────────────────────────────

    const openDeskModal = () => {
        setDeskValue(empData.deskNumber || "");
        setDeskModal(true);
    };

    const handleDeskSave = async () => {
        if (!deskValue.trim()) return;
        try {
            await updateDesk(empData.employee?._id, deskValue.trim());
            setEmpData((p) => ({ ...p, deskNumber: deskValue.trim() }));
            toast("Desk number updated");
        } catch {
            toast("Failed to update desk number");
        } finally { setDeskModal(false); }
    };

    // ── Password update ────────────────────────────────────────────────────────

    const openPwdModal = () => { setPwdValue(""); setPwdModal(true); };

    const handlePwdSave = async () => {
        if (!pwdValue.trim()) return;
        try {
            await updateSystemPassword(empData.employee._id, pwdValue.trim());
            setEmpData((p) => ({ ...p, systemPassword: pwdValue.trim() }));
            toast("System password updated");
        } catch {
            toast("Failed to update password");
        } finally { setPwdModal(false); setPwdValue(""); }
    };

    // ── Add asset ──────────────────────────────────────────────────────────────

    const handleAddAsset = async () => {
        if (!newAsset.assetType || !newAsset.name || !newAsset.barcode) {
            toast("Type, Name and Barcode are required.");
            return;
        }
        setAssetSaving(true);
        try {
            const res = await addAsset(empData.employee._id, newAsset);
            setEmpData((p) => ({ ...p, assets: [...p.assets, res.data.asset] }));
            setNewAsset(EMPTY_ASSET);
            setShowAddForm(false);
            toast(`Asset "${res.data.asset.name}" added`);
        } catch (err) {
            toast(err.response?.data?.message || "Failed to add asset");
        } finally {
            setAssetSaving(false);
        }
    };

    // ── Photo upload ───────────────────────────────────────────────────────────

    const handlePhotoUpload = async (assetId, file) => {
        const fd = new FormData();
        fd.append("photo", file);
        try {
            const res = await uploadAssetPhoto(assetId, fd);
            setEmpData((p) => ({
                ...p,
                assets: p.assets.map((a) =>
                    a._id === assetId ? { ...a, photoUrl: res.data.photoUrl } : a
                ),
            }));
            toast("Photo uploaded");
        } catch { toast("Photo upload failed"); }
    };

    // ── History modal ──────────────────────────────────────────────────────────

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

    // ── Condition modal ────────────────────────────────────────────────────────

    const openCondModal = (asset) => {
        setCondModal(asset);
        setCondValue(asset.condition);
        setCondNote("");
    };

    const handleCondSave = async () => {
        setCondSaving(true);
        try {
            await updateAssetCondition(condModal._id, { condition: condValue, note: condNote });
            setEmpData((p) => ({
                ...p,
                assets: p.assets.map((a) =>
                    a._id === condModal._id ? { ...a, condition: condValue } : a
                ),
            }));
            toast("Condition updated");
            setCondModal(null);
        } catch { toast("Failed to update condition"); }
        finally { setCondSaving(false); }
    };



    useEffect(() => {

        const fetchData = async () => {

            try {

                const token = localStorage.getItem("token");

                // ─── Fetch Employees ─────────────────────────────
                const usersRes = await fetch(
                    `${BASE_URL}/users?role=employee,hr,manager`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const usersJson = await usersRes.json();

                if (usersJson.success) {

                    setEmployees(usersJson.users || []);

                } else {

                    setEmployees([]);

                }

                // ─── Fetch Departments ───────────────────────────
                const deptRes = await fetch(
                    `${BASE_URL}/tasks/departments`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const deptJson = await deptRes.json();

                if (deptJson.success) {

                    setDepartments([
                        "All",
                        ...(deptJson.departments || [])
                    ]);

                } else {

                    setDepartments(["All"]);

                }

            } catch (error) {

                console.error("Dropdown fetch error:", error);

                setEmployees([]);
                setDepartments(["All"]);

            } finally {

                setListLoading(false);

            }
        };

        fetchData();

    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <div style={{ padding: "28px 28px 48px", maxWidth: 1040, margin: "0 auto" }}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a202c", margin: 0 }}>
                        Asset Management
                    </h1>
                    <p style={{ fontSize: 13, color: "#718096", margin: "4px 0 0" }}>
                        Search by Employee ID to view and manage assigned assets
                    </p>
                </div>

                {/* ── Employee selector ──────────────────────────────────── */}
                <div className="am-card" style={{ padding: "20px 22px", marginBottom: 22 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Department filter */}
                        <div style={{ minWidth: 160 }}>
                            <label className="am-label" style={{ marginBottom: 4 }}>Department</label>
                            <select
                                className="am-input"
                                value={deptFilter}
                                onChange={(e) => { setDeptFilter(e.target.value); setSelectedEmpId(""); setEmpData(null); }}
                                style={{ minWidth: 160 }}
                            >
                                {departments.map((d) => <option key={d}>{d}</option>)}
                            </select>
                        </div>

                        {/* Employee dropdown */}
                        <div style={{ flex: 1, minWidth: 220 }}>
                            <label className="am-label" style={{ marginBottom: 4 }}>Employee</label>
                            <select
                                className="am-input"
                                value={selectedEmpId}
                                onChange={(e) => handleSelectEmployee(e.target.value)}
                                disabled={listLoading}
                            >
                                <option value="">
                                    {listLoading ? "Loading employees…" : "Select an employee"}
                                </option>
                                {employees
                                    .filter(
                                        (e) =>
                                            deptFilter === "All" ||
                                            (e.department || "General") === deptFilter
                                    )
                                    .map((e) => (
                                        <option
                                            key={e._id}
                                            value={e.employeeId}
                                        >
                                            {e.name} ({e.employeeId}) - {e.department || "General"}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {loading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#718096", fontSize: 13, paddingTop: 20 }}>
                                <Icon.Spinner /> Loading…
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Toast ──────────────────────────────────────────────── */}
                {notif && (
                    <div style={{
                        position: "fixed", top: 20, right: 20, zIndex: 9999,
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 18px", background: "#fff",
                        border: "1px solid #c6e6da", borderRadius: 10,
                        boxShadow: "0 8px 24px rgba(0,0,0,.1)",
                        animation: "am-toastIn .3s cubic-bezier(.22,1,.36,1) both",
                        fontSize: 13.5, color: "#1a202c",
                    }}>
                        <span style={{
                            width: 22, height: 22, background: "#1D9E75",
                            borderRadius: "50%", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            color: "#fff", flexShrink: 0,
                        }}>
                            <Icon.Check />
                        </span>
                        {notif}
                    </div>
                )}

                {/* ── Error ──────────────────────────────────────────────── */}
                {error && (
                    <div className="am-fadeIn" style={{
                        padding: "13px 18px", background: "#FAECE7",
                        borderRadius: 10, color: "#993C1D",
                        fontSize: 13.5, marginBottom: 20,
                        border: "1px solid #f5c4b3",
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                        {error}
                    </div>
                )}

                {/* ── Employee data ───────────────────────────────────────── */}
                {empData && (
                    <div className="am-fadeIn">

                        {/* ── Employee + stat strip ───────────────────────── */}
                        <div className="am-card" style={{ padding: 20, marginBottom: 16 }}>
                            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>

                                {/* Avatar */}
                                <div style={{
                                    width: 54, height: 54, borderRadius: "50%",
                                    background: "#E1F5EE", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    fontWeight: 700, fontSize: 18, color: "#0F6E56",
                                    flexShrink: 0, animation: "am-pulse 2s ease infinite",
                                }}>
                                    {empData.employee?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 17, fontWeight: 700, color: "#1a202c" }}>
                                            {empData.employee?.name}
                                        </span>
                                        <span style={{
                                            fontSize: 11, padding: "2px 10px", borderRadius: 20,
                                            background: "#E1F5EE", color: "#0F6E56", fontWeight: 600,
                                        }}>
                                            {empData.employee?.employeeId}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: 16, marginTop: 5, flexWrap: "wrap" }}>
                                        {empData.employee?.department && (
                                            <MetaChip icon={<Icon.User />} label={empData.employee.department} />
                                        )}
                                        {empData.employee?.email && (
                                            <MetaChip icon={
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                            } label={empData.employee.email} />
                                        )}
                                        {empData.employee?.joiningDate && (
                                            <MetaChip icon={
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                            } label={`Joined ${empData.employee.joiningDate.slice(0, 10)}`} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Desk & password row */}
                            <div style={{
                                marginTop: 16, paddingTop: 16,
                                borderTop: "1px solid #edf2f7",
                                display: "flex", gap: 14, flexWrap: "wrap",
                            }}>
                                <InfoPill
                                    icon={<Icon.Desk />}
                                    label="Desk"
                                    value={empData.deskNumber || "—"}
                                    onEdit={openDeskModal}
                                />
                                <InfoPill
                                    icon={<Icon.Lock />}
                                    label="System Password"
                                    value={
                                        showPwd
                                            ? empData.systemPassword
                                            : "•".repeat(Math.min(empData.systemPassword?.length || 8, 10))
                                    }
                                    mono
                                    onToggle={() => setShowPwd((p) => !p)}
                                    showPwd={showPwd}
                                    onEdit={openPwdModal}
                                />
                            </div>
                        </div>

                        {/* ── Assets table header ─────────────────────────── */}
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 12,
                        }}>
                            <span style={{
                                fontSize: 11.5, fontWeight: 700,
                                textTransform: "uppercase", letterSpacing: ".07em",
                                color: "#718096",
                            }}>
                                Assigned Assets ({empData.assets?.length})
                            </span>
                            <PrimaryBtn onClick={() => setShowAddForm((p) => !p)}>
                                {showAddForm ? <><Icon.X /> Cancel</> : <><Icon.Plus /> Add Asset</>}
                            </PrimaryBtn>
                        </div>

                        {/* ── Add asset form ──────────────────────────────── */}
                        {showAddForm && (
                            <div className="am-card am-fadeIn" style={{ padding: 22, marginBottom: 16 }}>
                                <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 18px", color: "#1a202c" }}>
                                    New Asset
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px 16px" }}>
                                    {[
                                        {
                                            key: "assetType", label: "Asset Type", type: "select",
                                            opts: ["", ...ASSET_TYPES], ph: "Select type",
                                        },
                                        { key: "name", label: "Asset Name / Model", ph: "Dell Latitude 5520" },
                                        { key: "barcode", label: "Barcode", ph: "BC-XX-YEAR-0000" },
                                        { key: "condition", label: "Condition", type: "select", opts: CONDITIONS },
                                    ].map(({ key, label, type = "text", opts, ph }) => (
                                        <div key={key}>
                                            <label className="am-label">{label}</label>
                                            {opts ? (
                                                <select
                                                    className="am-input"
                                                    value={newAsset[key]}
                                                    onChange={(e) => setNewAsset((p) => ({ ...p, [key]: e.target.value }))}
                                                >
                                                    {opts.map((o) => <option key={o} value={o}>{o || "Select type"}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    className="am-input"
                                                    type={type}
                                                    min={type === "number" ? 0 : undefined}
                                                    value={newAsset[key]}
                                                    placeholder={ph}
                                                    onChange={(e) => setNewAsset((p) => ({ ...p, [key]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                                    <PrimaryBtn onClick={handleAddAsset} disabled={assetSaving}>
                                        {assetSaving ? <><Icon.Spinner /> Saving…</> : <><Icon.Check /> Save Asset</>}
                                    </PrimaryBtn>
                                    <button
                                        className="am-btn-ghost"
                                        onClick={() => { setShowAddForm(false); setNewAsset(EMPTY_ASSET); }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Assets table ────────────────────────────────── */}
                        <div className="am-card" style={{ overflow: "hidden" }}>
                            {empData.assets?.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "52px 0", color: "#a0aec0" }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" style={{ marginBottom: 12 }}>
                                        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v4M10 14h4" />
                                    </svg>
                                    <p style={{ margin: 0, fontSize: 14 }}>No assets assigned yet</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="am-table">
                                        <thead>
                                            <tr>
                                                <th>Asset</th>
                                                <th>Barcode</th>
                                                <th>Condition</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {empData.assets.map((asset, i) => (
                                                <AssetRow
                                                    key={asset._id}
                                                    asset={asset}
                                                    delay={i * 45}
                                                    onRowClick={() => setDetailAsset(asset)}
                                                    onHistory={() => openHistory(asset)}
                                                    onCondChange={() => openCondModal(asset)}
                                                    onPhotoUpload={(file) => handlePhotoUpload(asset._id, file)}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Modals ─────────────────────────────────────────────── */}

                {deskModal && (
                    <Modal onClose={() => setDeskModal(false)}>
                        <ModalHeader title="Edit Desk Number" onClose={() => setDeskModal(false)} />
                        <div style={{ padding: 22 }}>
                            <label className="am-label">Desk Number</label>
                            <input
                                autoFocus
                                className="am-input"
                                value={deskValue}
                                onChange={(e) => setDeskValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleDeskSave()}
                                placeholder="e.g. B2-14"
                            />
                            <PrimaryBtn onClick={handleDeskSave} style={{ marginTop: 18, width: "100%", justifyContent: "center" }}>
                                Save
                            </PrimaryBtn>
                        </div>
                    </Modal>
                )}

                {pwdModal && (
                    <Modal onClose={() => setPwdModal(false)}>
                        <ModalHeader title="Update System Password" onClose={() => setPwdModal(false)} />
                        <div style={{ padding: 22 }}>
                            <label className="am-label">New Password</label>
                            <input
                                autoFocus
                                type="password"
                                className="am-input"
                                value={pwdValue}
                                onChange={(e) => setPwdValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handlePwdSave()}
                                placeholder="Enter new password"
                            />
                            <PrimaryBtn onClick={handlePwdSave} style={{ marginTop: 18, width: "100%", justifyContent: "center" }}>
                                Save
                            </PrimaryBtn>
                        </div>
                    </Modal>
                )}

                {historyModal && (
                    <Modal onClose={() => setHistoryModal(null)}>
                        <ModalHeader
                            title={`History — ${historyModal.asset.name || historyModal.asset.assetType}`}
                            onClose={() => setHistoryModal(null)}
                        />
                        <div style={{ padding: 22 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                                <CondBadge value={historyModal.asset.condition} />
                                <span style={{ fontSize: 12, color: "#718096" }}>
                                    Barcode: <code style={{ fontSize: 11.5 }}>{historyModal.asset.barcode}</code>
                                </span>
                            </div>
                            {historyLoading ? (
                                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#718096", fontSize: 13.5 }}>
                                    <Icon.Spinner /> Loading history…
                                </div>
                            ) : historyModal.history?.length === 0 ? (
                                <p style={{ color: "#a0aec0", fontSize: 13.5 }}>No history found.</p>
                            ) : (
                                <HistoryTimeline items={historyModal.history} showChangedBy />
                            )}
                        </div>
                    </Modal>
                )}

                {condModal && (
                    <Modal onClose={() => setCondModal(null)}>
                        <ModalHeader title="Update Condition" onClose={() => setCondModal(null)} />
                        <div style={{ padding: 22 }}>
                            <label className="am-label">New Condition</label>
                            <select
                                className="am-input"
                                value={condValue}
                                onChange={(e) => setCondValue(e.target.value)}
                                style={{ marginBottom: 14 }}
                            >
                                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                            </select>
                            <label className="am-label" style={{ marginTop: 4 }}>Note</label>
                            <input
                                className="am-input"
                                value={condNote}
                                onChange={(e) => setCondNote(e.target.value)}
                                placeholder="Reason for change…"
                            />
                            <PrimaryBtn
                                onClick={handleCondSave}
                                disabled={condSaving}
                                style={{ marginTop: 18, width: "100%", justifyContent: "center" }}
                            >
                                {condSaving ? <><Icon.Spinner /> Saving…</> : "Save"}
                            </PrimaryBtn>
                        </div>
                    </Modal>
                )}
            </div>
            {detailAsset && (
                <Modal onClose={() => setDetailAsset(null)}>
                    <ModalHeader
                        title={detailAsset.name || detailAsset.assetType}
                        onClose={() => setDetailAsset(null)}
                    />
                    <div style={{ padding: 22 }}>

                        {/* Photo */}
                        {detailAsset.photoUrl && (
                            <div style={{ marginBottom: 18, textAlign: "center" }}>
                                <img
                                    src={`${BASE_URL}/${detailAsset.photoUrl.replace(/\\/g, "/")}`}
                                    alt="Asset"
                                    style={{
                                        maxWidth: "100%", maxHeight: 180,
                                        borderRadius: 10, objectFit: "cover",
                                        border: "1px solid #edf2f7",
                                    }}
                                />
                            </div>
                        )}

                        {/* Badge row */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                            <CondBadge value={detailAsset.condition} />
                            <span style={{
                                fontSize: 11.5, padding: "3px 10px", borderRadius: 20,
                                background: "#E1F5EE", color: "#0F6E56", fontWeight: 600,
                            }}>
                                {detailAsset.assetType}
                            </span>
                        </div>

                        {/* Detail grid */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "14px 16px",
                        }}>
                            {[
                                { label: "Barcode", value: detailAsset.barcode },
                                { label: "Brand", value: detailAsset.vendor || "—" },
                                { label: "Purchase Date", value: detailAsset.purchaseDate?.slice(0, 10) || "—" },
                                { label: "Warranty Expiry", value: detailAsset.warrantyExpiry?.slice(0, 10) || "—" },
                                { label: "Assigned Date", value: detailAsset.assignedDate?.slice(0, 10) || "—" },
                            ].map(({ label, value }) => (
                                <div key={label} style={{
                                    background: "#f8fafc", borderRadius: 9,
                                    border: "1px solid #edf2f7", padding: "10px 14px",
                                }}>
                                    <div style={{
                                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                                        letterSpacing: ".05em", color: "#a0aec0", marginBottom: 3,
                                    }}>
                                        {label}
                                    </div>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1a202c" }}>
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick actions */}
                        <div style={{
                            display: "flex", gap: 8, marginTop: 20,
                            paddingTop: 18, borderTop: "1px solid #edf2f7", flexWrap: "wrap",
                        }}>
                            <button className="am-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6 }}
                                onClick={() => { setDetailAsset(null); openHistory(detailAsset); }}>
                                <Icon.History /> View History
                            </button>
                            <button className="am-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6 }}
                                onClick={() => { setDetailAsset(null); openCondModal(detailAsset); }}>
                                <Icon.Edit /> Update Condition
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </DashboardLayout>
    );
}

// ─── Asset table row ──────────────────────────────────────────────────────────

function AssetRow({ asset, delay, onRowClick, onHistory, onCondChange, onPhotoUpload }) {
    const inputRef = React.useRef();

    return (
        <tr
            className="am-row-hover"
            onClick={onRowClick}
            style={{
                animation: `am-fadeIn .35s ${delay}ms cubic-bezier(.22,1,.36,1) both`,
                cursor: "pointer",
            }}
        >
            {/* Asset name + type */}
            <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: "#E1F5EE", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "#0F6E56", flexShrink: 0,
                    }}>
                        <Icon.Laptop />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1a202c" }}>
                            {asset.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#718096" }}>{asset.assetType}</div>
                    </div>
                </div>
            </td>

            <td>
                <code style={{
                    fontSize: 11.5, color: "#4a5568",
                    background: "#f7fafc", padding: "2px 7px", borderRadius: 5,
                }}>
                    {asset.barcode}
                </code>
            </td>

            <td><CondBadge value={asset.condition} /></td>

            {/* Actions — stopPropagation so they don't open the detail modal */}
            <td onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <button className="am-icon-btn" title="View History" onClick={onHistory}>
                        <Icon.History />
                    </button>
                    <button className="am-icon-btn" title="Update Condition" onClick={onCondChange}>
                        <Icon.Edit />
                    </button>
                    <button className="am-icon-btn" title="Upload Photo"
                        onClick={() => inputRef.current?.click()}>
                        <Icon.Camera />
                    </button>
                    <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                        onChange={(e) => e.target.files[0] && onPhotoUpload(e.target.files[0])} />
                </div>
            </td>
        </tr>
    );
}
// ─── Small shared components ──────────────────────────────────────────────────

function MetaChip({ icon, label }) {
    return (
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#718096" }}>
            <span style={{ color: "#a0aec0", display: "flex" }}>{icon}</span>
            {label}
        </span>
    );
}

function StatPill({ label, value, accent }) {
    return (
        <div style={{
            textAlign: "center",
            padding: "10px 18px",
            background: accent ? "#E1F5EE" : "#f7fafc",
            borderRadius: 10,
            border: `1px solid ${accent ? "#9FE1CB" : "#edf2f7"}`,
        }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: accent ? "#0F6E56" : "#718096", marginBottom: 2 }}>
                {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: accent ? "#085041" : "#1a202c" }}>
                {value}
            </div>
        </div>
    );
}

function InfoPill({ icon, label, value, mono, onToggle, showPwd, onEdit }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 14px", background: "#f8fafc",
            borderRadius: 9, border: "1px solid #edf2f7",
            flex: "1 1 200px",
        }}>
            <span style={{ color: "#1D9E75", display: "flex", flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#a0aec0", marginBottom: 1 }}>
                    {label}
                </div>
                <div style={{
                    fontSize: 14, fontWeight: 500, color: "#1a202c",
                    fontFamily: mono ? "monospace" : undefined,
                    letterSpacing: mono ? 1.5 : undefined,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {value}
                </div>
            </div>
            {onToggle && (
                <button className="am-btn-ghost" onClick={onToggle} style={{ padding: "4px 10px", fontSize: 11.5, flexShrink: 0 }}>
                    <Icon.Eye open={showPwd} />
                </button>
            )}
            {onEdit && (
                <button className="am-btn-ghost" onClick={onEdit} style={{ padding: "4px 10px", fontSize: 11.5, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon.Edit /> Edit
                </button>
            )}
        </div>
    );
}