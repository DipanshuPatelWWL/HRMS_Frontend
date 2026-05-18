import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { BASE_URL, QR_CODE_URL } from "../../services/api";

/* ── Company constants ── */
const COMPANY = {
    name: "World WebLogic",
    tagline: "give digital wings to your brand",
    fullName: "World WebLogic Pvt. Ltd.",
    address: "B-108 1st Floor Office No. - 2, B Block, Sector 63, Noida, Uttar Pradesh Pin Code : 201309",
    website: "www.worldweblogic.com",
    phone1: "+91 1204545733",
    phone2: "+91 85058 37801",
    email: "info@worldweblogic.com",
};

/* ── Single fixed theme — Navy + Orange, always ── */
const THEME = {
    navy: "#1a2e6e",
    orange: "#f07c1b",
    white: "#ffffff",
    textDark: "#1a1a1a",
    textMid: "#333333",
};

const ff = "'Montserrat', 'Open Sans', sans-serif";

/* ── Globe SVG logo mark ── */
const GlobeMark = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill={THEME.navy} stroke={THEME.orange} strokeWidth="1.5" />
        <ellipse cx="16" cy="16" rx="7" ry="15" fill="none" stroke={THEME.white} strokeWidth="1" opacity="0.6" />
        <line x1="1" y1="16" x2="31" y2="16" stroke={THEME.white} strokeWidth="1" opacity="0.6" />
        <line x1="16" y1="1" x2="16" y2="31" stroke={THEME.white} strokeWidth="1" opacity="0.6" />
        <ellipse cx="16" cy="16" rx="14" ry="6" fill="none" stroke={THEME.white} strokeWidth="1" opacity="0.4" />
    </svg>
);

/* ── Top header with navy bg + orange arc decoration ── */
const CardHeader = ({ logoImg }) => (
    <div style={{
        background: "white",
        position: "relative",
        height: 92,
        overflow: "hidden",
        flexShrink: 0,
    }}>
        {/* Orange arc — top right */}
        <div style={{
            position: "absolute",
            top: -30,
            right: -40,
            width: 120,
            height: 130,
            borderRadius: "50%",
            background: THEME.orange,
        }} />
        <div style={{
            position: "absolute",
            top: -20,
            left: -130,
            width: 180,
            height: 45,
            borderRadius: "50%",
            transform: "rotate(180deg)",
            background: THEME.navy,
        }} />

        {/* Logo row */}
        <div style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 14px 0",
        }}>
            {logoImg
                ? <img
                    src={logoImg}
                    alt="World WebLogic" style={{ height: 48, maxWidth: 180, objectFit: "contain" }} />
                : <GlobeMark size={34} />
            }
        </div>

        {/* Bottom wave curve */}
        <svg
            viewBox="0 0 280 36"
            preserveAspectRatio="none"
            style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 36 }}
        >
            {/* Navy fills the bottom portion, white wave cuts into it */}
            <path d="M0,36 L0,18 Q70,0 140,18 Q210,36 280,18 L280,36 Z" fill={THEME.white} />
        </svg>
    </div>
);

/* ════════════════════════════════════════
   FRONT FACE
════════════════════════════════════════ */
function CardFront({ user, logoImg }) {
    const avatarSrc = user?.avatar
        ? (user.avatar.startsWith("http") ? user.avatar : `${BASE_URL}${user.avatar}`)
        : null;

    const joiningDate = user?.joiningDate
        ? new Date(user.joiningDate).toLocaleDateString("en-IN", {
            day: "2-digit", month: "2-digit", year: "numeric"
        }).replace(/\//g, ".")
        : "—";

    const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

    return (
        <div style={{
            width: 280,
            height: 440,
            background: THEME.white,
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.2), 0 3px 10px rgba(0,0,0,.1)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily: ff,
        }}>
            <CardHeader logoImg={logoImg} />

            {/* Body */}
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "6px 12px 0",
                background: THEME.white,
            }}>
                {/* Photo */}
                <div style={{
                    width: 115,
                    height: 135,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#d0d0d0",
                    flexShrink: 0,
                }}>
                    {avatarSrc
                        ? <img src={avatarSrc} alt={user?.name} style={{ width: "100%", height: "30vh", objectFit: "cover", objectPosition: "bottom" }} />
                        : (
                            <div style={{
                                width: "100%", height: "100%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "#c8c8c8",
                                fontSize: 28, fontWeight: 800, color: THEME.navy,
                            }}>
                                {initials}
                            </div>
                        )
                    }
                </div>

                {/* Orange dot decorations — left & right of photo area */}
                <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "space-between", marginTop: -130, paddingBottom: 118, pointerEvents: "none" }}>
                    <DotArrow direction="right" />
                    <DotArrow direction="left" />
                </div>

                {/* Name */}
                <div style={{
                    fontFamily: ff,
                    fontSize: 17,
                    fontWeight: 900,
                    color: THEME.navy,
                    textAlign: "center",
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    marginBottom: 3,
                }}>
                    {user?.name || "EMPLOYEE NAME"}
                </div>

                {/* Divider */}
                <div style={{ width: "80%", height: 2, background: THEME.navy, marginBottom: 4 }} />

                {/* Designation */}
                <div style={{
                    fontFamily: ff,
                    fontSize: 11,
                    fontWeight: 600,
                    color: THEME.textMid,
                    textAlign: "center",
                    marginBottom: 14,
                }}>
                    {user?.designation || "Designation"}
                </div>

                {/* Employee Code + Joining Date */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                    <div style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, color: THEME.textDark }}>
                        Employee Code : <span style={{ fontWeight: 800 }}>{user?.employeeId || "WWL000"}</span>
                    </div>
                    <div style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, color: THEME.textDark }}>
                        Department : <span style={{ fontWeight: 800 }}>{user?.department || "Dept"}</span>
                    </div>
                    <div style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, color: THEME.textDark }}>
                        Date Of Joining : <span style={{ fontWeight: 800 }}>{joiningDate}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                background: THEME.navy,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
            }}>
                <span style={{ fontFamily: ff, fontSize: 10, fontWeight: 700, color: THEME.white }}>
                    {COMPANY.website}
                </span>
                {/* Small orange square accent */}
                <div style={{ width: 18, height: 18, background: THEME.orange, borderRadius: 2 }} />
            </div>
        </div>
    );
}

/* ── Orange dot-arrow decoration ── */
function DotArrow({ direction }) {
    const dots = [];
    const rows = [5, 4, 3, 2, 1];
    rows.forEach((count, ri) => {
        for (let ci = 0; ci < count; ci++) {
            dots.push({ row: ri, col: ci });
        }
    });

    const flip = direction === "left";

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            opacity: 0.85,
            transform: flip ? "scaleX(-1)" : "none",
            paddingLeft: flip ? 0 : 4,
            paddingRight: flip ? 4 : 0,
        }}>
            {[5, 4, 3, 2, 1].map((count, ri) => (
                <div key={ri} style={{ display: "flex", gap: 3 }}>
                    {Array.from({ length: count }).map((_, ci) => (
                        <div key={ci} style={{
                            width: 4, height: 4,
                            borderRadius: "50%",
                            background: THEME.orange,
                        }} />
                    ))}
                </div>
            ))}
        </div>
    );
}

/* ════════════════════════════════════════
   BACK FACE
════════════════════════════════════════ */
function CardBack({ user, logoImg }) {
    return (
        <div style={{
            width: 280,
            height: 440,
            background: THEME.white,
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.2), 0 3px 10px rgba(0,0,0,.1)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily: ff,
        }}>
            <CardHeader logoImg={logoImg} />

            {/* Body */}
            <div style={{
                flex: 1,
                padding: "18px 18px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: THEME.white,
            }}>
                {/* Blood group, phone, emergency */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                        { label: "BLOOD GROUP", value: user?.bloodGroup || "N/A" },
                        { label: "PHONE NO.", value: user?.phone || "—" },
                        { label: "EMR. CONTACT NO.", value: user?.phone || "—" },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontFamily: ff, fontSize: 9.5, fontWeight: 700, color: THEME.textDark, minWidth: 110, letterSpacing: ".03em" }}>
                                {label}
                            </span>
                            <span style={{ fontFamily: ff, fontSize: 9.5, fontWeight: 800, color: THEME.textDark }}>: {value}</span>
                        </div>
                    ))}
                </div>

                {/* QR Code */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                    <div style={{
                        background: THEME.white,
                        border: `2px solid ${THEME.navy}22`,
                        borderRadius: 8,
                        padding: 6,
                        boxShadow: "0 2px 10px rgba(0,0,0,.1)",
                    }}>
                        <QRCodeSVG
                            value={`${QR_CODE_URL}/employee/${user?.employeeId || "WWL000"}`}
                            size={80}
                            fgColor={THEME.navy}
                            bgColor="#ffffff"
                            level="M"
                            includeMargin={false}
                        />
                        <div style={{
                            fontFamily: ff, fontSize: 8, textAlign: "center",
                            marginTop: 4, color: THEME.textMid, letterSpacing: ".05em", fontWeight: 700,
                        }}>
                            {user?.employeeId || "WWL000"}
                        </div>
                    </div>
                </div>

                {/* Company full block */}
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: ff, fontSize: 15, fontWeight: 900, color: THEME.orange, marginBottom: 4 }}>
                        {COMPANY.fullName}
                    </div>
                    <div style={{ fontFamily: ff, fontSize: 8.5, fontWeight: 700, color: THEME.textDark, lineHeight: 1.6 }}>
                        {COMPANY.address}
                    </div>
                    <div style={{ fontFamily: ff, fontSize: 8.5, fontWeight: 700, color: THEME.textDark, marginTop: 3 }}>
                        Phone no. : {COMPANY.phone1}
                    </div>
                    <div style={{ fontFamily: ff, fontSize: 8.5, fontWeight: 700, color: THEME.textDark }}>
                        {COMPANY.email}
                    </div>
                </div>
            </div>

            {/* Footer — "If found" notice */}
            <div style={{
                background: THEME.navy,
                padding: "7px 12px",
                flexShrink: 0,
            }}>
                <p style={{
                    fontFamily: ff,
                    fontSize: 7,
                    color: THEME.white,
                    textAlign: "center",
                    margin: 0,
                    lineHeight: 1.5,
                }}>
                    This card is the property of World WebLogic Pvt. Ltd. If found,<br />
                    Please return to us immediately on above mentioned Address.
                </p>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   MAIN EXPORT — EmployeeIDCard panel
════════════════════════════════════════ */
export default function EmployeeIDCard({ user, logoImg }) {
    const frontRef = useRef(null);
    const backRef = useRef(null);

    const handlePrint = () => {
        const frontHTML = frontRef.current?.outerHTML;
        const backHTML = backRef.current?.outerHTML;
        if (!frontHTML || !backHTML) return;

        const sharedStyles = `
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Open+Sans:wght@400;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                background: white;
                font-family: 'Montserrat', 'Open Sans', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .print-page {
                width: 100%;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                page-break-after: always;
            }
            .print-page:last-child { page-break-after: avoid; }
            @page { size: A4; margin: 0; }
            @media print {
                html, body { width: 210mm; height: 297mm; background: white !important; }
                .print-page { width: 210mm; height: 297mm; page-break-after: always; }
            }
        `;

        const win = window.open("", "_blank");
        win.document.write(`
            <html>
            <head>
                <title>Employee ID Card — ${user?.name || "Employee"}</title>
                <style>${sharedStyles}</style>
            </head>
            <body>
                <div class="print-page">${frontHTML}</div>
                <div class="print-page">${backHTML}</div>
            </body>
            </html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); }, 600);
    };

    return (
        <div style={{ fontFamily: ff }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 16, color: "#111827", margin: "0 0 4px" }}>
                    Employee ID Card
                </p>
                <p style={{ fontFamily: ff, fontSize: 13, color: "#374151", margin: 0 }}>
                    Your official company ID — front &amp; back. Print or save for access.
                </p>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em" }}>Front</span>
                    <div ref={frontRef}>
                        <CardFront user={user} logoImg={logoImg} />
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em" }}>Back</span>
                    <div ref={backRef}>
                        <CardBack user={user} logoImg={logoImg} />
                    </div>
                </div>
            </div>

            {/* Print button */}
            <div style={{ display: "flex", gap: 10 }}>
                <button
                    onClick={handlePrint}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: THEME.navy, color: THEME.white,
                        border: "none", borderRadius: 10,
                        padding: "10px 22px", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: ff,
                        boxShadow: `0 4px 14px rgba(26,46,110,.4)`,
                        transition: "all .2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = THEME.orange; }}
                    onMouseLeave={e => { e.currentTarget.style.background = THEME.navy; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print ID Card
                </button>
            </div>

            {/* Info note */}
            <div style={{
                marginTop: 18, padding: "10px 14px", borderRadius: 10,
                background: "#f0f9ff", border: "1px solid #bae6fd",
                fontSize: 12, color: "#0c4a6e", fontWeight: 500, fontFamily: ff,
                display: "flex", gap: 8, alignItems: "flex-start",
            }}>
                <span>ℹ️</span>
                <span>
                    Your ID card uses your current profile photo, name, employee ID, designation and department.
                    Keep your profile updated to ensure your ID card stays accurate.
                </span>
            </div>
        </div>
    );
}