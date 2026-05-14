import jsPDF from "jspdf";
import logoImg from "../assets/logo.png";

// ── Company ───────────────────────────────────────────────
const COMPANY = {
    name: "World WebLogic",
    address: "B 108, 1st Floor, Office No. 2nd, Sector 63, Noida - 201309, Uttar Pradesh India",
    website: "worldweblogic.com",
    phone1: "+91 120 4545733",
    phone2: "+91 85058 37801",
    email: "info@worldweblogic.com",
};

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ── Colors ────────────────────────────────────────────────
const TEAL = [0, 150, 136];
const TEAL_DARK = [0, 121, 107];
const LIGHT_GRAY = [245, 245, 245];
const BLACK = [30, 30, 30];
const DARK_GRAY = [80, 80, 80];
const MID_GRAY = [140, 140, 140];
const WHITE = [255, 255, 255];
const BORDER = [200, 200, 200];
const TEAL_LIGHT = [224, 247, 244];
const RED = [200, 50, 50];

// ── Helpers ───────────────────────────────────────────────
const RS = "Rs.";

const fmt = (n) => {
    if (typeof n !== "number" || isNaN(n)) return "0.00";
    return Math.abs(n).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const fmtInt = (n) =>
    typeof n === "number" && !isNaN(n) ? String(Math.round(n)) : "0";

function formatDateStr(dateVal) {
    if (!dateVal) return "—";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
        });
    } catch {
        return "—";
    }
}

function sf(doc, weight = "normal", size = 9) {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
}

function fillRect(doc, x, y, w, h, fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, "F");
}

function strokeRect(doc, x, y, w, h, color = BORDER, lw = 0.25) {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, "S");
}

function fillStrokeRect(doc, x, y, w, h, fill, strokeColor = BORDER, lw = 0.25) {
    doc.setFillColor(...fill);
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, "FD");
}

function hline(doc, x1, x2, y, color = BORDER, lw = 0.25) {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(x1, y, x2, y);
}

function cell(doc, x, y, w, h, text, opts = {}) {
    const {
        fill,
        textColor = BLACK,
        fontWeight = "normal",
        fontSize = 8,
        align = "left",
        paddingX = 2.5,
    } = opts;

    if (fill) fillRect(doc, x, y, w, h, fill);
    strokeRect(doc, x, y, w, h);

    if (text === null || text === undefined || text === "") return;

    sf(doc, fontWeight, fontSize);
    doc.setTextColor(...textColor);

    const ty = y + h / 2 + fontSize * 0.45;
    const tx =
        align === "center" ? x + w / 2
            : align === "right" ? x + w - paddingX
                : x + paddingX;

    doc.text(String(text), tx, ty, { align });
}

// ─────────────────────────────────────────────────────────
//  NUMBER TO WORDS  (Indian system)
// ─────────────────────────────────────────────────────────
function numberToWords(n) {
    if (n === 0) return "zero";
    const ones = [
        "", "one", "two", "three", "four", "five", "six", "seven",
        "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
        "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
    ];
    const tens = [
        "", "", "twenty", "thirty", "forty", "fifty",
        "sixty", "seventy", "eighty", "ninety",
    ];

    function convert(num) {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
        if (num < 1000) return ones[Math.floor(num / 100)] + " hundred" + (num % 100 ? " " + convert(num % 100) : "");
        if (num < 100000) return convert(Math.floor(num / 1000)) + " thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
        if (num < 10000000) return convert(Math.floor(num / 100000)) + " lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
        return convert(Math.floor(num / 10000000)) + " crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
    }
    return convert(Math.abs(Math.round(n)));
}

// ─────────────────────────────────────────────────────────
//  RESOLVE ALL SALARY FIGURES FROM PAYROLL OBJECT
//
//  KEY FORMULA (must match payroll.controller.js):
//    perDay         = monthlySalary / totalWorkingDays
//    halfDaySalary  = perDay / 2
//    basicEarnings  = presentDays × perDay          ← ONLY actual present days
//    halfDayEarnings= halfDays × halfDaySalary
//    paidLeaveAmt   = paidLeave × perDay
//    grossEarnings  = basicEarnings + halfDayEarnings + paidLeaveAmt
//    absentAmt      = absentDays × perDay
//    unpaidLeaveAmt = unpaidLeave × perDay
//    deductions     = absentAmt + unpaidLeaveAmt
//    netSalary      = grossEarnings - deductions
//
//  Weekends and holidays are IMPLICITLY paid because:
//    perDay = salary / workingDays  (not calendar days)
//    We only DEDUCT for absent working days.
//    So if employee attends all working days → net = monthlySalary ✅
// ─────────────────────────────────────────────────────────
function resolveSalaryFigures(p) {
    const emp = (p.employee && typeof p.employee === "object") ? p.employee : {};

    // Monthly salary set by HR
    const monthlySalary =
        p.monthlySalary ||
        p.basicSalary ||
        (emp.salary && typeof emp.salary === "object" ? emp.salary.monthly : null) ||
        (typeof emp.salary === "number" ? emp.salary : 0) ||
        emp.monthlySalary ||
        0;

    // Attendance counts from backend
    const totalWorkingDays = p.totalWorkingDays ?? 0;
    const totalCalendarDays = p.totalCalendarDays ?? 30;
    const weekends = p.weekends ?? p.totalWeekends ?? 0;
    const holidayCount = p.holidays ?? 0;

    // presentDays from backend = FULL present days (half-days are stored separately)
    const presentDays = p.presentDays ?? 0;
    const halfDays = p.halfDays ?? 0;
    const paidLeave = p.paidLeave ?? 0;
    const unpaidLeave = p.unpaidLeave ?? 0;
    const absentDays = p.absentDays ?? 0;

    // ── Per-day rate ──────────────────────────────────────
    // Use backend-stored value first; compute from workingDays as fallback
    const perDaySalary =
        p.perDaySalary ??
        (totalCalendarDays > 0 ? monthlySalary / totalCalendarDays : 0);

    const halfDaySalary =
        p.halfDaySalary ??
        (perDaySalary / 2);

    // ── Earnings ──────────────────────────────────────────
    // New formula: start from full salary, only deductions
    const absentAmt = p.absentAmt ?? round2(absentDays * perDaySalary);
    const halfDayDeduct = p.halfDayDeduct ?? round2(halfDays * halfDaySalary);
    const unpaidLeaveAmt = p.unpaidLeaveAmt ?? round2(unpaidLeave * perDaySalary);
    const totalDeductions = p.deductions ?? round2(absentAmt + halfDayDeduct + unpaidLeaveAmt);

    const rawNet = p.netSalary ?? 0;
    const netSalary = rawNet > 0
        ? rawNet
        : Math.max(0, monthlySalary - totalDeductions);
    function round2(n) { return Math.round(n * 100) / 100; }

    // ── Paid days for attendance display ─────────────────
    const paidDaysDisplay = presentDays + paidLeave;

    return {
        // ── salary rates ──────────────────────────────────
        monthlySalary,
        perDaySalary,
        halfDaySalary,

        // ── attendance counts ─────────────────────────────
        presentDays,
        halfDays,
        absentDays,
        paidLeave,
        unpaidLeave,
        weekends,
        holidayCount,
        totalWorkingDays,
        totalCalendarDays,

        // ── deductions ────────────────────────────────────
        absentAmt,
        halfDayDeduct,
        unpaidLeaveAmt,
        totalDeductions,
        netSalary,
        paidDaysDisplay,
    };
}

// ─────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────
export const generatePayslipPDF = (p) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    const PW = 210;
    const M = 10;
    const CW = PW - 2 * M;   // 190 mm

    // ── Resolve employee ──────────────────────────────────
    const emp = (p.employee && typeof p.employee === "object") ? p.employee : {};

    const empName = emp.name || p.employeeName || "—";
    const empId = emp.employeeId || p.employeeId || "—";
    const empDesig = emp.designation || p.designation || "—";
    const empDept = (emp.department && typeof emp.department === "object")
        ? (emp.department.name || "—")
        : (emp.department || p.department || "—");

    const empDOJ = formatDateStr(
        emp.joiningDate || emp.dateOfJoining || p.joiningDate || p.dateOfJoining
    );
    const empDOB = formatDateStr(emp.dob || p.dob);

    const empPAN =
        emp.governmentIds?.pan ||
        p.governmentIds?.pan ||
        emp.pan || p.pan || "—";

    const maskAadhaar = (v) => {
        if (!v) return "—";
        const s = String(v);
        return s.length === 12 ? "XXXX XXXX " + s.slice(-4) : "—";
    };
    const empAadhaar = maskAadhaar(emp.governmentIds?.aadhaar);

    const bankDet = emp.bankDetails ?? {};
    const empBank = bankDet.bankName || p.bankName || "—";
    const empAccount = bankDet.accountNumber || p.accountNo || p.accountNumber || "—";

    const empGuardian =
        emp.guardianName || emp.fatherName || emp.fatherHusbandName ||
        emp.guardian || emp.parentName ||
        p.guardianName || p.fatherName || p.fatherHusbandName ||
        p.guardian || p.parentName || "Not Provided";

    const monthName = MONTHS[(p.month || 1) - 1];
    const year = p.year || new Date().getFullYear();

    // ── Resolve all salary figures ────────────────────────
    const S = resolveSalaryFigures(p);

    const isPaid = p.status === "paid";
    const paidDate = (isPaid && p.paidAt)
        ? new Date(p.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—";
    const processedBy = p.paidBy?.name || "HR";

    let y = 8;

    /* ════════════════════════════════════════════════════
       1. OUTER BORDER
    ════════════════════════════════════════════════════ */
    strokeRect(doc, M, y, CW, 295, [170, 170, 170], 0.5);

    /* ════════════════════════════════════════════════════
       2. COMPANY HEADER
    ════════════════════════════════════════════════════ */
    const LOGO_W = 56;
    const HDR_H = 26;

    fillStrokeRect(doc, M, y, LOGO_W, HDR_H, WHITE, BORDER, 0.3);
    try {
        doc.addImage(logoImg, "PNG", M + 1, y + 1, LOGO_W - 2, HDR_H - 2, undefined, "FAST");
    } catch {
        sf(doc, "bold", 10);
        doc.setTextColor(...TEAL);
        doc.text("WORLD", M + LOGO_W / 2, y + 10, { align: "center" });
        doc.text("WEBLOGIC", M + LOGO_W / 2, y + 18, { align: "center" });
    }

    const INFO_X = M + LOGO_W;
    const INFO_W = CW - LOGO_W;
    fillStrokeRect(doc, INFO_X, y, INFO_W, HDR_H, WHITE, BORDER, 0.3);

    sf(doc, "bold", 13);
    doc.setTextColor(...BLACK);
    doc.text(COMPANY.name.toUpperCase(), INFO_X + INFO_W / 2, y + 9, { align: "center" });

    sf(doc, "normal", 7);
    doc.setTextColor(...DARK_GRAY);
    doc.text(COMPANY.address, INFO_X + INFO_W / 2, y + 17, { align: "center" });

    sf(doc, "normal", 6.5);
    doc.text(
        `Tel: ${COMPANY.phone1}  |  ${COMPANY.phone2}  |  Email: ${COMPANY.email}  |  ${COMPANY.website}`,
        INFO_X + INFO_W / 2, y + 24, { align: "center" }
    );

    y += HDR_H;

    /* ════════════════════════════════════════════════════
       3. MONTH BANNER
    ════════════════════════════════════════════════════ */
    const BANNER_H = 8;
    fillStrokeRect(doc, M, y, CW, BANNER_H, TEAL, TEAL_DARK, 0.3);
    sf(doc, "bold", 10);
    doc.setTextColor(...WHITE);
    doc.text(
        `Payslip for the month of  ${monthName.toUpperCase()}, ${year}`,
        PW / 2, y + 5.4, { align: "center" }
    );
    y += BANNER_H;

    /* ════════════════════════════════════════════════════
       4. EMPLOYEE INFO
    ════════════════════════════════════════════════════ */
    const EMP_H = 7;
    const HALF = CW / 2;
    const LBL_W = 47;

    const empLeft = [
        ["CODE", empId],
        ["NAME", empName],
        ["GUARDIAN NAME", empGuardian],
        ["DEPARTMENT", empDept],
        ["DESIGNATION", empDesig],
        ["PAN", empPAN],
        ["AADHAAR", empAadhaar],
    ];

    const empRight = [
        ["BANK NAME", empBank],
        ["ACCOUNT NO", empAccount],
        ["PAYMENT MODE", "Bank"],
        ["DATE OF JOINING", empDOJ],
        ["DATE OF BIRTH", empDOB],
        ["DESIGNATION", empDesig],
        ["", ""],
    ];

    const maxRows = Math.max(empLeft.length, empRight.length);

    for (let i = 0; i < maxRows; i++) {
        const ry = y + i * EMP_H;
        const mid = ry + EMP_H / 2 + 1.2;

        fillStrokeRect(doc, M, ry, HALF, EMP_H, WHITE, BORDER, 0.25);
        if (empLeft[i]) {
            const [lbl, val] = empLeft[i];
            sf(doc, "bold", 7.2);
            doc.setTextColor(...BLACK);
            doc.text(lbl + " :", M + 2.5, mid);
            sf(doc, "normal", 7.2);
            doc.text(String(val), M + LBL_W + (HALF - LBL_W) / 2, mid, { align: "center" });
        }

        fillStrokeRect(doc, M + HALF, ry, HALF, EMP_H, WHITE, BORDER, 0.25);
        if (empRight[i]) {
            const [lbl, val] = empRight[i];
            const rx = M + HALF;
            sf(doc, "bold", 7.2);
            doc.setTextColor(...BLACK);
            doc.text(lbl + " :", rx + 2.5, mid);
            sf(doc, "normal", 7.2);
            doc.text(String(val), rx + LBL_W + (HALF - LBL_W) / 2, mid, { align: "center" });
        }
    }

    y += maxRows * EMP_H;
    y += 6;

    /* ════════════════════════════════════════════════════
       5. ATTENDANCE HEADER
    ════════════════════════════════════════════════════ */
    const ATT_HDR_H = 8;
    fillStrokeRect(doc, M, y, CW, ATT_HDR_H, TEAL, TEAL_DARK, 0.3);
    sf(doc, "bold", 9);
    doc.setTextColor(...WHITE);
    doc.text("ATTENDANCE", PW / 2, y + 4.8, { align: "center" });
    y += ATT_HDR_H;

    /* ════════════════════════════════════════════════════
       6. ATTENDANCE COLUMNS
       NOTE: "Paid Days" = presentDays + paidLeave
             Half-days are shown in salary section, not here
             to avoid confusion in the attendance box
    ════════════════════════════════════════════════════ */
    const attCols = [
        { label: "Working Days", value: fmtInt(S.totalWorkingDays) },
        { label: "PL", value: fmtInt(S.paidLeave) },
        { label: "Half Days", value: fmtInt(S.halfDays) },
        { label: "Absent", value: fmtInt(S.absentDays) },
        { label: "Weekly Off", value: fmtInt(S.weekends) },
        { label: "Paid Days", value: fmtInt(S.paidDaysDisplay) },
    ];

    const attCW = CW / attCols.length;
    const ATTL_H = 7;
    const ATTV_H = 8;

    attCols.forEach(({ label }, i) => {
        const bx = M + i * attCW;
        fillStrokeRect(doc, bx, y, attCW, ATTL_H,
            i % 2 === 0 ? LIGHT_GRAY : WHITE, BORDER, 0.25);
        sf(doc, "bold", 6.5);
        doc.setTextColor(...BLACK);
        doc.text(label, bx + attCW / 2, y + ATTL_H / 2 + 1, { align: "center" });
    });
    y += ATTL_H;

    attCols.forEach(({ value }, i) => {
        const bx = M + i * attCW;
        fillStrokeRect(doc, bx, y, attCW, ATTV_H,
            i % 2 === 0 ? WHITE : LIGHT_GRAY, BORDER, 0.25);
        sf(doc, "bold", 10);
        doc.setTextColor(...BLACK);
        doc.text(value, bx + attCW / 2, y + ATTV_H / 2 + 1.5, { align: "center" });
    });
    y += ATTV_H;

    /* ════════════════════════════════════════════════════
       7. SUMMARY ROW
       PAYABLE DAYS = present + (halfDays × 0.5) + paidLeave
       We show it as a decimal-aware number
    ════════════════════════════════════════════════════ */
    const payableDays = S.presentDays + (S.halfDays * 0.5) + S.paidLeave;

    const sumItems = [
        { label: "PAYABLE DAYS", value: payableDays % 1 === 0 ? fmtInt(payableDays) : payableDays.toFixed(1) },
        { label: "ABSENT DAYS", value: fmtInt(S.absentDays) },
        { label: "WEEKLY OFF", value: fmtInt(S.weekends) },
        { label: "WORKING DAYS", value: fmtInt(S.totalWorkingDays) },
    ];

    const sumCW = CW / sumItems.length;
    const SUM_H = 14;

    sumItems.forEach(({ label, value }, i) => {
        const sx = M + i * sumCW;
        fillStrokeRect(doc, sx, y, sumCW, SUM_H,
            i % 2 === 0 ? LIGHT_GRAY : WHITE, BORDER, 0.25);
        sf(doc, "bold", 6.5);
        doc.setTextColor(...BLACK);
        doc.text(label, sx + sumCW / 2, y + SUM_H * 0.28, { align: "center" });
        sf(doc, "bold", 11);
        doc.text(value, sx + sumCW / 2, y + SUM_H * 0.70, { align: "center" });
    });
    y += SUM_H;
    y += 6;

    /* ════════════════════════════════════════════════════
       7b. SALARY CALCULATION BREAKDOWN BOX
           Shows every step so the employee can verify
    ════════════════════════════════════════════════════ */
    const calcLines = [];

    calcLines.push({
        text: `Monthly Salary = ${RS} ${fmt(S.monthlySalary)}  |  Calendar Days = ${fmtInt(S.totalCalendarDays)}  |  Per Day = ${RS} ${fmt(S.perDaySalary)}`,
        color: DARK_GRAY, bold: false,
    });

    // Line 2: absent deduction (only if any)
    if (S.absentDays > 0) {
        calcLines.push({
            text: `Absent = ${fmtInt(S.absentDays)} days × ${RS} ${fmt(S.perDaySalary)} = − ${RS} ${fmt(S.absentAmt)}`,
            color: RED, bold: true,
        });
    }

    // Line 3: half day deduction (only if any)
    if (S.halfDays > 0) {
        calcLines.push({
            text: `Half Day = ${fmtInt(S.halfDays)} × ${RS} ${fmt(S.halfDaySalary)} (half of ${RS} ${fmt(S.perDaySalary)}) = − ${RS} ${fmt(S.halfDayDeduct)}`,
            color: RED, bold: true,
        });
    }

    // Line 4: paid leave note (only if any — no deduction)
    if (S.paidLeave > 0) {
        calcLines.push({
            text: `Casual Leave = ${fmtInt(S.paidLeave)} days → ✅ No deduction (CL balance used)`,
            color: [0, 100, 80], bold: false,
        });
    }

    // Line 5: unpaid leave deduction (only if any)
    if (S.unpaidLeave > 0) {
        calcLines.push({
            text: `Unpaid Leave = ${fmtInt(S.unpaidLeave)} days × ${RS} ${fmt(S.perDaySalary)} = − ${RS} ${fmt(S.unpaidLeaveAmt)}`,
            color: RED, bold: true,
        });
    }

    // Line 6: net salary (always shown)
    calcLines.push({
        text: `Net Salary = ${RS} ${fmt(S.monthlySalary)} − ${RS} ${fmt(S.totalDeductions)} = ${RS} ${fmt(S.netSalary)}`,
        color: [0, 100, 80], bold: true,
    });

    const lineHeight = 6;
    const paddingTop = 7;
    const paddingBottom = 4;
    const CALC_H = paddingTop + (calcLines.length * lineHeight) + paddingBottom;

    fillStrokeRect(doc, M, y, CW, CALC_H, TEAL_LIGHT, TEAL, 0.4);

    sf(doc, "bold", 8);
    doc.setTextColor(...TEAL_DARK);
    doc.text("SALARY CALCULATION BREAKDOWN", M + 3, y + 5.5);

    let textY = y + 12;
    calcLines.forEach(({ text, color, bold }) => {
        sf(doc, bold ? "bold" : "normal", 7.2);
        doc.setTextColor(...color);
        doc.text(text, M + 3, textY);
        textY += lineHeight;
    });

    y += CALC_H + 2;

    /* ════════════════════════════════════════════════════
       8. SALARY TABLE HEADER
    ════════════════════════════════════════════════════ */
    const C = {
        head: CW * 0.35,
        amt1: CW * 0.25,
        ded: CW * 0.25,
        amt2: CW * 0.15,
    };

    const Xhead = M;
    const Xamt1 = Xhead + C.head;
    const Xded = Xamt1 + C.amt1;
    const Xamt2 = Xded + C.ded;

    const SAL_HDR_H = 9;

    [
        { x: Xhead, w: C.head, label: "SALARY HEAD" },
        { x: Xamt1, w: C.amt1, label: "AMOUNT" },
        { x: Xded, w: C.ded, label: "DEDUCTIONS" },
        { x: Xamt2, w: C.amt2, label: "AMOUNT" },
    ].forEach(({ x, w, label }) => {
        cell(doc, x, y, w, SAL_HDR_H, label, {
            fill: TEAL, textColor: WHITE, fontWeight: "bold",
            fontSize: 7.5, align: "center",
        });
    });
    y += SAL_HDR_H;

    /* ════════════════════════════════════════════════════
       9. SALARY ROWS
       Layout:
         Row 1: Basic earnings      | Absent deduction
         Row 2: Half-day earnings   | Unpaid leave deduction
         Row 3: Paid leave earnings | (empty)
         Row 4: (empty)             | (empty)
    ════════════════════════════════════════════════════ */
    const salRows = [
        {
            head: `Monthly Salary`,
            amt: fmt(S.monthlySalary),
            ded: S.absentDays > 0
                ? `Absent (${fmtInt(S.absentDays)}d × ${RS} ${fmt(S.perDaySalary)})`
                : "",
            damt: S.absentDays > 0 ? fmt(S.absentAmt) : "",
        },
        {
            head: S.paidLeave > 0 ? `Casual Leave (${fmtInt(S.paidLeave)}d) — Paid` : "",
            amt: S.paidLeave > 0 ? "No Deduction" : "",
            ded: S.halfDays > 0
                ? `Half Day (${fmtInt(S.halfDays)}d × ${RS} ${fmt(S.halfDaySalary)})`
                : "",
            damt: S.halfDays > 0 ? fmt(S.halfDayDeduct) : "",
        },
        {
            head: "",
            amt: "",
            ded: S.unpaidLeave > 0
                ? `Unpaid Leave (${fmtInt(S.unpaidLeave)}d × ${RS} ${fmt(S.perDaySalary)})`
                : "",
            damt: S.unpaidLeave > 0 ? fmt(S.unpaidLeaveAmt) : "",
        },
        { head: "", amt: "", ded: "", damt: "" },
    ];

    const SAL_ROW_H = 9;
    salRows.forEach((row, i) => {
        const ry = y + i * SAL_ROW_H;
        const bg = i % 2 === 0 ? WHITE : LIGHT_GRAY;
        [
            { x: Xhead, w: C.head, text: row.head, align: "left" },
            { x: Xamt1, w: C.amt1, text: row.amt, align: "right" },
            { x: Xded, w: C.ded, text: row.ded, align: "left" },
            { x: Xamt2, w: C.amt2, text: row.damt, align: "right" },
        ].forEach(({ x, w, text, align }) => {
            cell(doc, x, ry, w, SAL_ROW_H, text, {
                fill: bg, textColor: BLACK, fontSize: 7.5, align,
            });
        });
    });
    y += salRows.length * SAL_ROW_H;
    y += 4;

    /* ════════════════════════════════════════════════════
       10. GROSS EARNINGS | GROSS DEDUCTIONS
    ════════════════════════════════════════════════════ */
    const GROSS_H = 11;
    const GROSS_LEFT = Xamt1 + C.amt1 - M;
    const GROSS_RIGHT = CW - GROSS_LEFT;

    fillStrokeRect(doc, M, y, GROSS_LEFT, GROSS_H, LIGHT_GRAY, BORDER, 0.4);
    sf(doc, "bold", 8.5);
    doc.setTextColor(...BLACK);
    doc.text("MONTHLY SALARY", M + 2.5, y + GROSS_H / 2 + 1.5);
    doc.text(fmt(S.monthlySalary), M + GROSS_LEFT - 2.5, y + GROSS_H / 2 + 1.5, { align: "right" });

    fillStrokeRect(doc, M + GROSS_LEFT, y, GROSS_RIGHT, GROSS_H, LIGHT_GRAY, BORDER, 0.4);
    sf(doc, "bold", 8.5);
    doc.setTextColor(...BLACK);
    doc.text("TOTAL DEDUCTIONS", M + GROSS_LEFT + 2.5, y + 3.5);
    doc.text(fmt(S.totalDeductions), M + CW - 2.5, y + 3.5, { align: "right" });

    // Show deduction reason
    const dedParts = [];
    if (S.absentDays > 0)
        dedParts.push(`Absent: ${fmtInt(S.absentDays)} day${S.absentDays > 1 ? "s" : ""}`);
    if (S.halfDays > 0)
        dedParts.push(`Half Day: ${fmtInt(S.halfDays)} day${S.halfDays > 1 ? "s" : ""}`);
    if (S.unpaidLeave > 0)
        dedParts.push(`Unpaid Leave: ${fmtInt(S.unpaidLeave)} day${S.unpaidLeave > 1 ? "s" : ""}`);
    const dedReason = dedParts.join(" + ");

    if (dedReason) {
        sf(doc, "normal", 6.2);
        doc.setTextColor(...DARK_GRAY);
        doc.text(dedReason, M + GROSS_LEFT + 2.5, y + 7.2);
    }

    y += GROSS_H;

    /* ════════════════════════════════════════════════════
       11. NET PAY BANNER
    ════════════════════════════════════════════════════ */
    const NET_H = 10;
    fillStrokeRect(doc, M, y, CW, NET_H, TEAL, TEAL_DARK, 0.4);

    sf(doc, "bold", 9.5);
    doc.setTextColor(...WHITE);
    doc.text("NET PAY", M + 4, y + 6.5);

    const words = numberToWords(Math.round(S.netSalary));
    sf(doc, "normal", 7.5);
    doc.text(`RUPEES ${words.toUpperCase()} ONLY`, PW / 2, y + 6.5, { align: "center" });

    sf(doc, "bold", 12);
    doc.text(`${RS} ${fmt(S.netSalary)}`, M + CW - 3, y + 7, { align: "right" });

    y += NET_H;

    /* ════════════════════════════════════════════════════
       12. PAYMENT INFO ROW
    ════════════════════════════════════════════════════ */
    const PAY_H = 9;
    const payItems = [
        { label: "PAYMENT DATE", value: paidDate },
        { label: "PROCESSED BY", value: processedBy },
        { label: "STATUS", value: isPaid ? "PAID" : "DRAFT" },
    ];
    const payCW = CW / payItems.length;

    payItems.forEach(({ label, value }, i) => {
        const px = M + i * payCW;
        fillStrokeRect(doc, px, y, payCW, PAY_H, i % 2 === 0 ? LIGHT_GRAY : WHITE, BORDER, 0.25);
        sf(doc, "bold", 6.5);
        doc.setTextColor(...BLACK);
        doc.text(label, px + payCW / 2, y + 3, { align: "center" });
        sf(doc, "bold", 8.5);
        doc.text(String(value), px + payCW / 2, y + 7.2, { align: "center" });
    });

    y += PAY_H;

    /* ════════════════════════════════════════════════════
       13. FOOTER
    ════════════════════════════════════════════════════ */
    y += 5;
    hline(doc, M, M + CW, y, BORDER, 0.3);
    y += 6;

    sf(doc, "italic", 7.5);
    doc.setTextColor(...MID_GRAY);
    doc.text(
        "This is a Computer generated Pay Slip hence, Signature does not required.",
        M + 2.5, y
    );

    sf(doc, "bold", 8);
    doc.setTextColor(...DARK_GRAY);
    doc.text(`For  ${COMPANY.name.toUpperCase()}`, M + CW - 2.5, y, { align: "right" });

    /* ── Save ─────────────────────────────────────────── */
    const safeName = (empName || "Employee").replace(/\s+/g, "_");
    doc.save(`Payslip_${safeName}_${monthName}_${year}.pdf`);
};