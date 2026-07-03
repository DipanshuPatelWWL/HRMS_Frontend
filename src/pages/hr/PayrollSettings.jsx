import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { FiSave, FiSettings, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import StopwatchLoader from "../../components/common/StopwatchLoader";

const PayrollSettings = () => {
    const [settings, setSettings] = useState({
        financialYear: "2025-26",
        taxRegime: "new",
        pfMode: "actual",
        defaultHraType: "non-metro",
        professionalTaxState: "Uttar Pradesh"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await API.get("/settings/payroll");
                if (res.data?.settings) {
                    setSettings(res.data.settings);
                }
            } catch (err) {
                showToast("Failed to load settings", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await API.put("/settings/payroll", settings);
            setSettings(res.data.settings);
            showToast("Payroll settings updated successfully");
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to save settings";
            showToast(errorMsg, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <StopwatchLoader />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <style>{`
                .ps-root { font-family: 'DM Sans', sans-serif; max-width: 800px; margin: 0 auto; }
                .ps-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; }
                .ps-title { font-size: 1.4rem; font-weight: 800; display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; }
                .ps-group { margin-bottom: 1.5rem; }
                .ps-label { display: block; font-size: .85rem; font-weight: 700; color: var(--text-2); margin-bottom: .5rem; text-transform: uppercase; letter-spacing: 0.5px; }
                .ps-select { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); font-size: .95rem; color: var(--text-1); outline: none; transition: border-color 0.2s; }
                .ps-select:focus { border-color: #2563eb; }
                .ps-btn { display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: .95rem; cursor: pointer; transition: opacity 0.2s; }
                .ps-btn:hover { opacity: 0.9; }
                .ps-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                
                .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: #fff; z-index: 9999; animation: slideUp 0.3s ease; }
                .toast.success { background: #16a34a; }
                .toast.error { background: #dc2626; }
                
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div className="ps-root">
                <div className="ps-card">
                    <h1 className="ps-title"><FiSettings color="#2563eb" /> Payroll Settings</h1>
                    
                    <div className="ps-group">
                        <label className="ps-label">Financial Year</label>
                        <select name="financialYear" value={settings.financialYear} onChange={handleChange} className="ps-select">
                            <option value="2024-25">2024-25</option>
                            <option value="2025-26">2025-26</option>
                        </select>
                    </div>

                    <div className="ps-group">
                        <label className="ps-label">Tax Regime</label>
                        <select name="taxRegime" value={settings.taxRegime} onChange={handleChange} className="ps-select">
                            <option value="new">New Regime</option>
                            <option value="old">Old Regime</option>
                        </select>
                    </div>

                    <div className="ps-group">
                        <label className="ps-label">PF Mode</label>
                        <select name="pfMode" value={settings.pfMode} onChange={handleChange} className="ps-select">
                            <option value="actual">Actual (% of Basic)</option>
                            <option value="capped">Capped (Max ₹1,800)</option>
                        </select>
                    </div>

                    <div className="ps-group">
                        <label className="ps-label">Default HRA Type</label>
                        <select name="defaultHraType" value={settings.defaultHraType} onChange={handleChange} className="ps-select">
                            <option value="non-metro">Non-Metro (40%)</option>
                            <option value="metro">Metro (50%)</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    <div className="ps-group">
                        <label className="ps-label">Professional Tax State</label>
                        <select name="professionalTaxState" value={settings.professionalTaxState} onChange={handleChange} className="ps-select">
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Telangana">Telangana</option>
                        </select>
                    </div>

                    <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                        <button className="ps-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : <><FiSave size={18} /> Save Settings</>}
                        </button>
                    </div>
                </div>
            </div>

            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === "success" ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
                    {toast.msg}
                </div>
            )}
        </DashboardLayout>
    );
};

export default PayrollSettings;
