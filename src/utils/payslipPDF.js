import Swal from "sweetalert2";

// ─────────────────────────────────────────────────────────
//  NUMBER TO WORDS  (Indian system)
// ─────────────────────────────────────────────────────────
function numberToWords(n) {
  if (!n || n === 0) return "zero";
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

  const words = convert(Math.abs(Math.round(n)));
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ─────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────
export const generatePayslipPDF = async (p) => {
  const emp = (p.employee && typeof p.employee === "object") ? p.employee : {};

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const monthLabel = (typeof p.month === "number" && p.month >= 1 && p.month <= 12)
    ? `${MONTHS[p.month - 1]} ${p.year}`
    : `${p.month} ${p.year}`;

  // ── Local formatter ───────────────────────────────────
  const fmt = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ── Salary structure rows ─────────────────────────────
  const STRUCTURE_LABELS = {
    basic: "Basic Salary",
    hra: "HRA (House Rent Allowance)",
    specialAllowance: "Special Allowance",
    conveyance: "Conveyance / Internet",
    otherAllowance: "Other Allowance",
  };

  const structureRows = p.salaryStructure
    ? Object.entries(p.salaryStructure)
      .filter(([, c]) => c.amount > 0)
      .map(([key, c]) => `
          <tr>
            <td style="padding:7px 10px;color:#374151;font-size:13px;">
              ${c.label || STRUCTURE_LABELS[key] || key}
            </td>
            <td style="padding:7px 10px;color:#374151;font-size:13px;text-align:right;">
              ${c.percent ? c.percent + "%" : "—"}
            </td>
            <td style="padding:7px 10px;font-weight:600;color:#111827;font-size:13px;text-align:right;">
              ${fmt(c.amount)}
            </td>
          </tr>`)
      .join("")
    : `<tr>
        <td style="padding:7px 10px;color:#374151;font-size:13px;" colspan="2">Basic Salary</td>
        <td style="padding:7px 10px;font-weight:600;text-align:right;font-size:13px;">
          ${fmt(p.monthlySalary)}
        </td>
       </tr>`;

  // ── Statutory deduction rows ──────────────────────────
  const statutoryRows = p.statutoryDeductions
    ? Object.entries(p.statutoryDeductions)
      .filter(([, c]) => c && c.amount > 0)
      .map(([key, c]) => {
        const labelMap = { pf: "Provident Fund (PF)", esi: "ESI", professionalTax: "Professional Tax", tds: "Income Tax (TDS)" };
        const label = c.label || labelMap[key] || key.toUpperCase();
        return `
            <tr>
              <td style="padding:7px 10px;color:#374151;font-size:13px;">
                ${label}
              </td>
              <td style="padding:7px 10px;color:#dc2626;font-size:13px;text-align:right;">
                −${fmt(c.amount)}
              </td>
            </tr>`;
      })
      .join("")
    : "";

  // ── Amount in words ───────────────────────────────────
  // Use Math.round to fix floating point truncation error (e.g., 249999.03 floored is 249999)
  const netInWords = numberToWords(Math.round(p.netSalary || 0));

  // ─────────────────────────────────────────────────────
  //  HTML TEMPLATE
  // ─────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Payslip — ${monthLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 24px; }

  .wrap {
    max-width: 750px; margin: auto; background: #fff;
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #1a237e, #3949ab);
    padding: 28px 32px; color: #fff;
  }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: .3px; }
  .header p  { font-size: 13px; opacity: .85; margin-top: 3px; }
  .header-row {
    display: flex; justify-content: space-between;
    align-items: flex-start; flex-wrap: wrap; gap: 12px;
  }
  .payslip-badge {
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 8px; padding: 8px 18px; text-align: right;
  }
  .payslip-badge .period { font-size: 15px; font-weight: 800; }
  .payslip-badge .label  { font-size: 11px; opacity: .8; margin-top: 2px; }

  /* ── Employee Info ── */
  .emp-section {
    background: #f8fafc; border-bottom: 1px solid #e5e7eb;
    padding: 20px 32px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  .emp-field .lbl {
    font-size: 10.5px; color: #6b7280;
    text-transform: uppercase; letter-spacing: .5px; font-weight: 700;
  }
  .emp-field .val {
    font-size: 13.5px; color: #111827; font-weight: 600; margin-top: 2px;
  }

  /* ── Sections ── */
  .section { padding: 22px 32px; }
  .section-title {
    font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: .7px;
    color: #6b7280; margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 1.5px solid #e5e7eb;
  }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; }
  tr:nth-child(even) td { background: #f9fafb; }
  th {
    padding: 8px 10px; text-align: left;
    font-size: 11px; color: #6b7280;
    text-transform: uppercase; letter-spacing: .5px; font-weight: 800;
  }
  th:last-child { text-align: right; }

  /* ── Attendance chips ── */
  .att-row { display: flex; gap: 10px; flex-wrap: wrap; padding: 4px 0; }
  .att-chip {
    padding: 5px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 700; border: 1px solid;
  }

  /* ── Deduction total ── */
  .deduct-total {
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 8px; padding: 10px 14px;
    display: flex; justify-content: space-between;
    font-weight: 800; font-size: 14px; color: #991b1b; margin-top: 8px;
  }

  /* ── Net salary ── */
  .net-box {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    border: 2px solid #86efac; border-radius: 10px;
    padding: 20px 28px;
    display: flex; justify-content: space-between; align-items: center;
    margin: 0 32px 16px;
  }
  .net-box .net-label {
    font-size: 13px; font-weight: 700; color: #052e16;
    text-transform: uppercase; letter-spacing: .5px;
  }
  .net-box .net-sub {
    font-size: 11px; color: #166534; margin-top: 4px; font-weight: 500;
  }
  .net-box .net-amount { font-size: 28px; font-weight: 900; color: #052e16; }

  /* ── Amount in words ── */
  .words-box {
    margin: 0 32px 24px;
    padding: 10px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 12px;
    color: #374151;
    font-style: italic;
  }
  .words-box strong { font-style: normal; color: #111827; }

  /* ── Footer ── */
  .footer {
    background: #f8fafc; border-top: 1px solid #e5e7eb;
    padding: 14px 32px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; color: #9ca3af;
  }

  /* ── Divider ── */
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 32px; }

  /* ── Signature area ── */
  .signature-row {
    display: flex; justify-content: space-between;
    padding: 24px 32px 8px;
    border-top: 1px solid #e5e7eb;
  }
  .sig-box { text-align: center; }
  .sig-line {
    width: 140px; border-top: 1px solid #9ca3af;
    margin: 32px auto 6px;
  }
  .sig-label { font-size: 11px; color: #6b7280; font-weight: 600; }

  @media print {
    body { background: #fff; padding: 0; }
    .wrap { box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="wrap">

  <!-- ── Header ── -->
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

  <!-- ── Employee Info ── -->
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
      <div class="val">
        ${emp.joiningDate
      ? new Date(emp.joiningDate).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
      : "—"}
      </div>
    </div>
    <div class="emp-field">
      <div class="lbl">Pay Period</div>
      <div class="val">${monthLabel}</div>
    </div>

    ${emp.bankDetails?.accountNumber ? `
    <div class="emp-field">
      <div class="lbl">Bank Account</div>
      <div class="val">xxxx${String(emp.bankDetails.accountNumber).slice(-4)}</div>
    </div>` : ""}

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
  </div>

  <!-- ── Attendance Summary ── -->
  <div class="section">
    <div class="section-title">Attendance Summary</div>
    <div class="att-row">
      <span class="att-chip" style="background:#dcfce7;color:#14532d;border-color:#4ade80;">
        ✓ Present: ${p.presentDays || 0}d
      </span>
      <span class="att-chip" style="background:#fff7ed;color:#c2410c;border-color:#fdba74;">
        ◑ Half Day: ${p.halfDays || 0}d
      </span>
      <span class="att-chip" style="background:#fee2e2;color:#991b1b;border-color:#fca5a5;">
        ✗ Absent: ${p.absentDays || 0}d
      </span>
      <span class="att-chip" style="background:#dbeafe;color:#1d4ed8;border-color:#93c5fd;">
        ✈ Paid Leave: ${p.paidLeave || 0}d
      </span>
      ${(p.unpaidLeave || 0) > 0
      ? `<span class="att-chip" style="background:#fef3c7;color:#92400e;border-color:#fcd34d;">
             ⚠ Unpaid Leave: ${p.unpaidLeave}d
           </span>`
      : ""}
      <span class="att-chip" style="background:#f3e8ff;color:#6b21a8;border-color:#d8b4fe;">
        🎉 Holidays: ${p.holidays || 0}d
      </span>
      <span class="att-chip" style="background:#f1f5f9;color:#475569;border-color:#cbd5e1;">
        📅 Working Days: ${p.totalWorkingDays || 0}d
      </span>
      <span class="att-chip" style="background:#f1f5f9;color:#475569;border-color:#cbd5e1;">
        📆 Calendar Days: ${p.totalCalendarDays || 0}d
      </span>
    </div>
  </div>

  <hr class="divider"/>

  <!-- ── Earnings Calculation ── -->
  <div class="section">
    <div class="section-title">Salary Calculation</div>
    <table>
      <tbody>
        <tr>
          <td style="padding:7px 10px;color:#374151;font-size:13px;" colspan="2">Fixed Monthly CTC</td>
          <td style="padding:7px 10px;font-weight:600;color:#111827;text-align:right;font-size:13px;">
            ${fmt(p.monthlySalary)}
          </td>
        </tr>
        ${p.lopAmount > 0 ? `
        <tr>
          <td style="padding:7px 10px;color:#dc2626;font-size:13px;" colspan="2">
            Loss of Pay (LOP) Deduction <span style="font-size:11px;color:#6b7280;margin-left:4px;">(${p.lopDays || 0} days × ${fmt(p.perDaySalary)})</span>
          </td>
          <td style="padding:7px 10px;font-weight:600;color:#dc2626;text-align:right;font-size:13px;">
            −${fmt(p.lopAmount)}
          </td>
        </tr>` : ""}
      </tbody>
      <tfoot>
        <tr style="background:#eff6ff;border-top:2px solid #bfdbfe;">
          <td style="padding:10px;font-weight:800;color:#1e40af;font-size:14px;" colspan="2">
            Earned Gross Salary
          </td>
          <td style="padding:10px;font-weight:800;color:#1e40af;font-size:14px;text-align:right;">
            ${fmt(p.grossEarnings)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
  
  <hr class="divider"/>

  <!-- ── Component Breakdown ── -->
  <div class="section">
    <div class="section-title">Component Breakdown</div>
    <table>
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="text-align:left;">Component</th>
          <th style="text-align:right;">%</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${structureRows}
      </tbody>
    </table>
  </div>

  <hr class="divider"/>

  <!-- ── Statutory Deductions ── -->
  <div class="section">
    <div class="section-title">Statutory Deductions</div>

    ${statutoryRows
      ? `<table>
           <thead>
             <tr style="background:#f3f4f6;">
               <th style="text-align:left;">Description</th>
               <th style="text-align:right;">Amount</th>
             </tr>
           </thead>
           <tbody>
             ${statutoryRows}
           </tbody>
         </table>`
      : `<p style="color:#9ca3af;font-size:13px;padding:4px 0;">
           No statutory deductions this month
         </p>`
    }

    <div class="deduct-total">
      <span>Total Deductions</span>
      <span>−${fmt(p.totalStatutoryDeductions || 0)}</span>
    </div>
  </div>

  <hr class="divider"/>

  <!-- ── Net Salary ── -->
  <div class="net-box">
    <div>
      <div class="net-label">Net In-Hand Salary</div>
      <div class="net-sub">
        Earned Gross ${fmt(p.grossEarnings)}
        &nbsp;−&nbsp;
        Deductions ${fmt(p.totalStatutoryDeductions || 0)}
      </div>
    </div>
    <div class="net-amount">${fmt(p.netSalary || 0)}</div>
  </div>

  <!-- ── Amount in Words ── -->
  <div class="words-box">
    Amount in words:&nbsp;
    <strong>${netInWords} Rupees Only</strong>
  </div>

  <!-- ── Signature Area ── -->
  <div class="signature-row">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Employee Signature</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Authorized Signatory</div>
    </div>
  </div>

  <!-- ── Footer ── -->
  <div class="footer">
    <span>
      Generated on ${new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    })}
    </span>
    <span>This is a system-generated payslip. No signature required.</span>
    <span>World WebLogic Pvt Ltd</span>
  </div>

</div>
</body>
</html>`;

  // ── Open in new window and print ─────────────────────
  const win = window.open("", "_blank");
  if (!win) {
    Swal.fire({
      icon: "warning",
      title: "Popup Blocked",
      text: "Please allow popups for this site to download the payslip.",
      confirmButtonText: "OK",
      confirmButtonColor: "#4f46e5",
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