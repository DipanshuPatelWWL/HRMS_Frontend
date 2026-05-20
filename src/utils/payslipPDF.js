import jsPDF from "jspdf";
import logoImg from "../assets/logo.png";
import Swal from "sweetalert2";

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
export const generatePayslipPDF = async (p) => {
  const emp = (p.employee && typeof p.employee === "object") ? p.employee : {};

  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const monthLabel = (typeof p.month === "number" && p.month >= 1 && p.month <= 12)
    ? `${MONTHS[p.month - 1]} ${p.year}`
    : `${p.month} ${p.year}`;

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Fallback labels in case label field is missing from stored payroll data
  const STRUCTURE_LABELS = {
    basic: "Basic Salary",
    hra: "HRA (House Rent Allowance)",
    specialAllowance: "Special Allowance",
    conveyance: "Conveyance / Internet",
    otherAllowance: "Other Allowance",
  };

  const structureRows = p.salaryStructure
    ? Object.entries(p.salaryStructure)
      .filter(([key, c]) => c.enabled)
      .map(([key, c]) => `
            <tr>
                <td style="padding:7px 10px;color:#374151;font-size:13px;">
                    ${c.label || STRUCTURE_LABELS[key] || key}
                </td>
                <td style="padding:7px 10px;color:#374151;font-size:13px;text-align:right;">${c.percent}%</td>
                <td style="padding:7px 10px;font-weight:600;color:#111827;font-size:13px;text-align:right;">${fmt(c.amount)}</td>
            </tr>`)
      .join("")
    : `<tr><td colspan="3" style="padding:7px 10px;color:#374151;font-size:13px;">Basic Salary</td><td style="padding:7px 10px;text-align:right;font-size:13px;">100%</td><td style="padding:7px 10px;font-weight:600;text-align:right;font-size:13px;">${fmt(p.monthlySalary)}</td></tr>`;

  // ── Statutory deduction rows ──
  const statutoryRows = p.statutoryDeductions
    ? Object.values(p.statutoryDeductions)
      .filter(d => d.enabled && d.amount > 0)
      .map(d => {
        const numTag = d.pfNumber
          ? `<span style="font-size:11px;color:#6b7280;margin-left:6px;">(UAN: ${d.pfNumber})</span>`
          : d.esiNumber
            ? `<span style="font-size:11px;color:#6b7280;margin-left:6px;">(ESI No: ${d.esiNumber})</span>`
            : "";
        return `
                <tr>
                    <td style="padding:7px 10px;color:#374151;font-size:13px;">
                        ${d.label || ""}${numTag}
                    </td>
                    <td style="padding:7px 10px;color:#dc2626;font-size:13px;text-align:right;">
                        −${fmt(d.amount)}
                    </td>
                </tr>`;
      })
      .join("")
    : "";

  // ── Attendance deduction rows ──
  const attendanceDeductRows = [
    p.absentAmt > 0 ? `<tr><td style="padding:7px 10px;color:#374151;font-size:13px;">Absent (${p.absentDays || 0} days × ${fmt(p.perDaySalary)})</td><td style="padding:7px 10px;color:#dc2626;font-size:13px;text-align:right;">−${fmt(p.absentAmt)}</td></tr>` : "",
    p.halfDayDeduct > 0 ? `<tr><td style="padding:7px 10px;color:#374151;font-size:13px;">Half Days (${p.halfDays || 0} days × ${fmt(p.halfDaySalary)})</td><td style="padding:7px 10px;color:#dc2626;font-size:13px;text-align:right;">−${fmt(p.halfDayDeduct)}</td></tr>` : "",
    p.unpaidLeaveAmt > 0 ? `<tr><td style="padding:7px 10px;color:#374151;font-size:13px;">Unpaid Leave (${p.unpaidLeave || 0} days × ${fmt(p.perDaySalary)})</td><td style="padding:7px 10px;color:#dc2626;font-size:13px;text-align:right;">−${fmt(p.unpaidLeaveAmt)}</td></tr>` : "",
  ].join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Payslip — ${monthLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 24px; }
  .wrap { max-width: 750px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }

  /* Header */
  .header { background: linear-gradient(135deg, #1a237e, #3949ab); padding: 28px 32px; color: #fff; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: .3px; }
  .header p  { font-size: 13px; opacity: .85; margin-top: 3px; }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
  .payslip-badge { background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35); border-radius: 8px; padding: 8px 18px; text-align: right; }
  .payslip-badge .period { font-size: 15px; font-weight: 800; }
  .payslip-badge .label  { font-size: 11px; opacity: .8; margin-top: 2px; }

  /* Employee info */
  .emp-section { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 20px 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .emp-field { }
  .emp-field .lbl { font-size: 10.5px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; font-weight: 700; }
  .emp-field .val { font-size: 13.5px; color: #111827; font-weight: 600; margin-top: 2px; }

  /* Sections */
  .section { padding: 22px 32px; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px; color: #6b7280; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1.5px solid #e5e7eb; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; }
  tr:nth-child(even) td { background: #f9fafb; }

  /* Attendance summary chips */
  .att-row { display: flex; gap: 10px; flex-wrap: wrap; padding: 4px 0; }
  .att-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid; }

  /* Total deduction box */
  .deduct-total { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; color: #991b1b; margin-top: 8px; }

  /* Net salary box */
  .net-box { background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 2px solid #86efac; border-radius: 10px; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; margin: 0 32px 24px; }
  .net-box .net-label { font-size: 13px; font-weight: 700; color: #052e16; text-transform: uppercase; letter-spacing: .5px; }
  .net-box .net-amount { font-size: 28px; font-weight: 900; color: #052e16; }

  /* Footer */
  .footer { background: #f8fafc; border-top: 1px solid #e5e7eb; padding: 14px 32px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af; }

  /* Divider */
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 32px; }

  @media print {
    body { background: #fff; padding: 0; }
    .wrap { box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="wrap">

  <!-- Header -->
  <div class="header">
    <div class="header-row">
      <div>
        <h1>World WebLogic Pvt Ltd</h1>
        <p>HR Management System &nbsp;·&nbsp; Salary Slip</p>
      </div>
      <div class="payslip-badge">
        <div class="period">${monthLabel}</div>
        <div class="label">Pay Period</div>
      </div>
    </div>
  </div>

  <!-- Employee Info -->
  <div class="emp-section">
    <div class="emp-field">
      <div class="lbl">Employee Name</div>
      <div class="val">${emp.name || "—"}</div>
    </div>
    <div class="emp-field">
      <div class="lbl">Employee ID</div>
      <div class="val">${emp.employeeId || "—"}</div>
    </div>
    <div class="emp-field">
      <div class="lbl">Designation</div>
      <div class="val">${emp.designation || "—"}</div>
    </div>
    <div class="emp-field">
      <div class="lbl">Department</div>
      <div class="val">${emp.department || "—"}</div>
    </div>
    <div class="emp-field">
      <div class="lbl">Date of Joining</div>
      <div class="val">${emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
    </div>
    <div class="emp-field">
      <div class="lbl">Bank Account</div>
      <div class="val">${emp.bankDetails?.accountNumber ? `xxxx${String(emp.bankDetails.accountNumber).slice(-4)}` : "—"}</div>
    </div>
    ${emp.bankDetails?.bankName ? `
    <div class="emp-field">
      <div class="lbl">Bank Name</div>
      <div class="val">${emp.bankDetails.bankName}</div>
    </div>` : ""}
    ${emp.bankDetails?.ifscCode ? `
    <div class="emp-field">
      <div class="lbl">IFSC Code</div>
      <div class="val">${emp.bankDetails.ifscCode}</div>
    </div>` : ""}
   ${emp.governmentIds?.pan ? `
    <div class="emp-field">
      <div class="lbl">PAN</div>
      <div class="val">${emp.governmentIds.pan}</div>
    </div>` : ""}
    ${p.statutoryDeductions?.pf?.enabled && p.statutoryDeductions?.pf?.pfNumber ? `
    <div class="emp-field">
      <div class="lbl">PF / UAN Number</div>
      <div class="val">${p.statutoryDeductions.pf.pfNumber}</div>
    </div>` : ""}
    ${p.statutoryDeductions?.esi?.enabled && p.statutoryDeductions?.esi?.esiNumber ? `
    <div class="emp-field">
      <div class="lbl">ESI Number</div>
      <div class="val">${p.statutoryDeductions.esi.esiNumber}</div>
    </div>` : ""}
    <div class="emp-field">
      <div class="lbl">Pay Period</div>
      <div class="val">${monthLabel}</div>
    </div>
  </div>

  <!-- Attendance Summary -->
  <div class="section">
    <div class="section-title">Attendance Summary</div>
    <div class="att-row">
      <span class="att-chip" style="background:#dcfce7;color:#14532d;border-color:#4ade80;">✓ Present: ${p.presentDays || 0}d</span>
      <span class="att-chip" style="background:#fff7ed;color:#c2410c;border-color:#fdba74;">◑ Half Day: ${p.halfDays || 0}d</span>
      <span class="att-chip" style="background:#fee2e2;color:#991b1b;border-color:#fca5a5;">✗ Absent: ${p.absentDays || 0}d</span>
      <span class="att-chip" style="background:#dbeafe;color:#1d4ed8;border-color:#93c5fd;">✈ Paid Leave: ${p.paidLeave || 0}d</span>
      ${p.unpaidLeave > 0 ? `<span class="att-chip" style="background:#fef3c7;color:#92400e;border-color:#fcd34d;">⚠ Unpaid Leave: ${p.unpaidLeave}d</span>` : ""}
      <span class="att-chip" style="background:#f3e8ff;color:#6b21a8;border-color:#d8b4fe;">🎉 Holidays: ${p.holidays || 0}d</span>
      <span class="att-chip" style="background:#f1f5f9;color:#475569;border-color:#cbd5e1;">📅 Working Days: ${p.totalWorkingDays || 0}d</span>
      <span class="att-chip" style="background:#f1f5f9;color:#475569;border-color:#cbd5e1;">📆 Calendar Days: ${p.totalCalendarDays || 0}d</span>
    </div>
  </div>

  <hr class="divider"/>

  <!-- Earnings / Salary Structure -->
  <div class="section">
    <div class="section-title">Earnings — Salary Structure</div>
    <table>
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;font-weight:800;">Component</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;font-weight:800;">%</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;font-weight:800;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${structureRows}
      </tbody>
      <tfoot>
        <tr style="background:#eff6ff;border-top:2px solid #bfdbfe;">
          <td style="padding:10px 10px;font-weight:800;color:#1e40af;font-size:14px;" colspan="2">Gross Salary</td>
          <td style="padding:10px 10px;font-weight:800;color:#1e40af;font-size:14px;text-align:right;">${fmt(p.grossEarnings || p.monthlySalary)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <hr class="divider"/>

  <!-- Deductions -->
  <div class="section">
    <div class="section-title">Deductions</div>

    ${statutoryRows || attendanceDeductRows ? `
    <table>
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;font-weight:800;">Description</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;font-weight:800;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${statutoryRows}
        ${attendanceDeductRows}
      </tbody>
    </table>
    ` : `<p style="color:#9ca3af;font-size:13px;padding:4px 0;">No deductions this month</p>`}

    <div class="deduct-total">
      <span>Total Deductions</span>
      <span>−${fmt(p.deductions)}</span>
    </div>
  </div>

  <hr class="divider"/>

  <!-- Net Salary -->
  <div class="net-box">
    <div>
      <div class="net-label">Net In-Hand Salary</div>
      <div style="font-size:11px;color:#166534;margin-top:4px;font-weight:500;">
        Gross ${fmt(p.grossEarnings || p.monthlySalary)} − Deductions ${fmt(p.deductions)}
      </div>
    </div>
    <div class="net-amount">${fmt(p.netSalary)}</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
    <span>This is a system-generated payslip. No signature required.</span>
    <span>World WebLogic Pvt Ltd</span>
  </div>

</div>
</body>
</html>`;

  // Open in new window and print
  const win = window.open("", "_blank");
  if (!win) {
    Swal.fire({
      icon: 'warning',
      title: 'Popup Blocked',
      text: 'Please allow popups for this site to continue.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#4f46e5',
      showClass: { popup: 'animate__animated animate__fadeInDown' },
      hideClass: { popup: 'animate__animated animate__fadeOutUp' },
    });
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };
};