import { BASE_URL } from "../../services/api";

const conditionMeta = {
    Good: { bg: "#EAF3DE", color: "#3B6D11" },
    Damaged: { bg: "#FAECE7", color: "#993C1D" },
    Replaced: { bg: "#FAEEDA", color: "#854F0B" },
    Retired: { bg: "#F1EFE8", color: "#5F5E5A" },
};

export const ConditionBadge = ({ value }) => {
    const s = conditionMeta[value] || conditionMeta.Good;
    return (
        <span style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 20,
            background: s.bg,
            color: s.color,
        }}>
            {value}
        </span>
    );
};

// ─── History timeline ─────────────────────────────────────────────────────────

const dotColor = {
    assigned: "#1D9E75",
    new: "#2E86DE",
    good: "#639922",
    fair: "#D4A017",
    damaged: "#D85A30",
    replaced: "#BA7517",
    retired: "#888",
};

export const HistoryTimeline = ({ items = [], showChangedBy = true }) => (
    <div style={{ position: "relative", paddingLeft: 20 }}>
        <div style={{
            position: "absolute", left: 6, top: 6, bottom: 6,
            width: 1, background: "#eee",
        }} />
        {Array.isArray(items) &&
            [...items].reverse().map((h, i) => (
                <div key={i} style={{ position: "relative", marginBottom: 18 }}>
                    <div style={{
                        position: "absolute", left: -17, top: 4,
                        width: 9, height: 9, borderRadius: "50%",
                        background: dotColor[h.status?.toLowerCase()] || "#888",
                        border: "2px solid #fff",
                    }} />
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>
                        {h.date?.slice(0, 10)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        {h.action}
                    </div>
                    {h.note && (
                        <div style={{ fontSize: 12, color: "#666" }}>{h.note}</div>
                    )}
                    {showChangedBy && h.changedBy && (
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                            — {h.changedBy}
                        </div>
                    )}
                </div>
            ))}
    </div>
);

// ─── Asset card ───────────────────────────────────────────────────────────────

// FIX: `onCondChange` and `onPhotoUpload` are optional — the employee view
// passes neither. Guard the render instead of letting undefined handlers throw.

export const AssetCard = ({ asset, onHistory, onCondChange, onPhotoUpload }) => (
    <div style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        overflow: "hidden",
    }}>
        {/* Photo area */}
        <div style={{
            height: 120,
            background: "#f8f8f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            borderBottom: "1px solid #eee",
        }}>
            {asset.photoUrl
                ? <img
                    src={`${BASE_URL}/${asset.photoUrl.replace(/^\//, "")}`}
                    alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 36, opacity: 0.3 }}>📦</span>
            }
            <span style={{
                position: "absolute", top: 8, left: 8,
                fontSize: 10, fontWeight: 500,
                padding: "2px 8px", borderRadius: 20,
                background: "#fff", border: "1px solid #eee", color: "#666",
            }}>
                {asset.assetType}
            </span>
        </div>

        {/* Body */}
        <div style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                {asset.name}
            </div>

            {/* Barcode */}
            <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", background: "#f8f8f8",
                borderRadius: 8, marginBottom: 10,
                fontFamily: "monospace", fontSize: 11, color: "#666",
            }}>
                ▌▌▌ {asset.barcode}
            </div>

            {/* Metadata rows — only render truthy / well-formed values */}
            {asset.vendor && (
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    🏪 {asset.vendor}
                </div>
            )}
            {asset.purchaseDate && (
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    📅 Purchased: {asset.purchaseDate.slice(0, 10)}
                </div>
            )}
            {asset.cost != null && (
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    💰 ₹{Number(asset.cost).toLocaleString("en-IN")}
                </div>
            )}
            {asset.warrantyExpiry && (
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    🛡️ Warranty: {asset.warrantyExpiry.slice(0, 10)}
                </div>
            )}
            {asset.assignedDate && (
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    📋 Assigned: {asset.assignedDate.slice(0, 10)}
                </div>
            )}

            <div style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <ConditionBadge value={asset.condition} />
                <div style={{ display: "flex", gap: 6 }}>
                    {onHistory && (
                        <button onClick={onHistory} style={smallBtn}>History</button>
                    )}
                    {onCondChange && (
                        <button onClick={onCondChange} style={smallBtn}>Edit</button>
                    )}
                </div>
            </div>

            {/* Photo upload — only rendered when the handler is provided */}
            {onPhotoUpload && (
                <label style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                    height: 40,
                    border: "1px dashed #ddd",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#888",
                }}>
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            // FIX: guard against empty selection (user opened
                            // the dialog but hit Cancel)
                            if (e.target.files?.[0]) {
                                onPhotoUpload(e.target.files[0]);
                            }
                            // Reset the input value so re-uploading the same
                            // file triggers onChange again
                            e.target.value = "";
                        }}
                    />
                    📷 Upload photo
                </label>
            )}
        </div>
    </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

export const Modal = ({ onClose, children }) => (
    // FIX: `position: fixed` collapses the iframe height in the artifact
    // sandbox. For a real app this is fine, but note that if you ever embed
    // this in an iframe you'll need a portal. The backdrop click correctly
    // propagates to onClose while the inner click stopPropagation guard
    // prevents accidental dismissal.
    <div
        onClick={onClose}
        style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
        }}
    >
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                background: "#fff",
                borderRadius: 12,
                width: "100%",
                maxWidth: 480,
                maxHeight: "80vh",
                overflowY: "auto",
            }}
        >
            {children}
        </div>
    </div>
);

// ─── Shared styles ────────────────────────────────────────────────────────────

export const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: ".4px",
    color: "#888",
    marginBottom: 6,
};

// FIX: Added `boxSizing: "border-box"` so width: "100%" doesn't overflow its
// grid cell when the input has horizontal padding.
export const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    background: "#fafafa",
    boxSizing: "border-box",
};

export const ghostBtn = {
    padding: "5px 12px",
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    color: "#666",
};

const smallBtn = {
    padding: "4px 10px",
    background: "transparent",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 11,
    cursor: "pointer",
    color: "#666",
};