import { FaCheckCircle, FaClock } from "react-icons/fa";
import { MdPolicy } from "react-icons/md";
import "react-quill-new/dist/quill.snow.css";

const STATUS_CONFIG = {
    acknowledged: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", Icon: FaCheckCircle, label: "Acknowledged" },
    pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", Icon: FaClock, label: "Pending" },
};

const CATEGORY_LABELS = {
    attendance: "Attendance", leave: "Leave", wfh: "Work From Home",
    "code-of-conduct": "Code of Conduct", it: "IT", other: "General",
};

const PolicyCard = ({ policy, selected, onSelect, onOpen }) => {
    const cfg = STATUS_CONFIG[policy.status] ?? STATUS_CONFIG.pending;
    const { Icon } = cfg;

    return (
        <div
            style={{
                border: selected ? "2px solid #4f46e5" : `1px solid ${cfg.border}`,
                borderRadius: 10,
                padding: "14px 16px",
                background: cfg.bg,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                transition: "box-shadow 0.15s",
                boxShadow: selected ? "0 0 0 3px #4f46e530" : "none",
            }}
            onClick={() => onOpen(policy)}
        >
            {/* Checkbox */}
            <input
                type="checkbox"
                onChange={e => { e.stopPropagation(); onSelect(policy._id); }}
                checked={selected}
                onClick={e => { e.stopPropagation(); onSelect(policy._id); }}
                style={{ marginTop: 3, accentColor: "#4f46e5", width: 16, height: 16, flexShrink: 0 }}
            />

            <MdPolicy size={20} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />

            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0a0a0a" }}>{policy.title}</span>
                    {policy.requiresAction && (
                        <span style={{
                            background: "#7c3aed", color: "#fff", fontSize: "0.6rem",
                            fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        }}>Action needed</span>
                    )}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>
                    {CATEGORY_LABELS[policy.category] ?? "General"} · v{policy.version}
                    {policy.publishedAt && ` · ${new Date(policy.publishedAt).toLocaleDateString()}`}
                </div>
                {policy.description && (
                    <div style={{ fontSize: "0.8rem", color: "#444", marginTop: 4 }}>
                        {policy.description}
                    </div>
                )}
            </div>

            <div style={{
                display: "flex", alignItems: "center", gap: 5,
                color: cfg.color, fontSize: "0.78rem", fontWeight: 600, flexShrink: 0,
            }}>
                <Icon size={14} />
                {cfg.label}
            </div>
        </div>
    );
};

export default PolicyCard;