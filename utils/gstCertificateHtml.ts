import type { User } from '@store/userStore';

export function buildGstCertificateHtml(user: User): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1a1a1a; }
    .header { background: #1e3a5f; color: white; padding: 16px; text-align: center; font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f0f4f8; }
    .meta { margin: 16px 0; font-size: 12px; }
    .seal { text-align: right; margin-top: 24px; color: #1e3a5f; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">GST COMPLIANCE VERIFICATION</div>
  <div class="meta">
    <p><strong>Legal Entity:</strong> ${user.legalEntityName}</p>
    <p><strong>GSTIN:</strong> ${user.gstNumber} — VERIFIED</p>
    <p><strong>PAN:</strong> ${user.pan}</p>
    <p><strong>Jurisdiction:</strong> ${user.jurisdiction}</p>
  </div>
  <table>
    <tr>
      <th>Description</th><th>HSN</th><th>Taxable Value</th><th>GST Rate</th><th>Tax Amount</th>
    </tr>
    <tr><td>OPC Cement 53 Grade</td><td>2523</td><td>₹85,000</td><td>28%</td><td>₹23,800</td></tr>
    <tr><td>TMT Steel Bars 12mm</td><td>7214</td><td>₹1,20,000</td><td>18%</td><td>₹21,600</td></tr>
    <tr><td>Grey Fill Sand</td><td>2505</td><td>₹45,000</td><td>5%</td><td>₹2,250</td></tr>
  </table>
  <div class="seal">● OFFICIAL VERIFICATION SEAL — BuildQuick India</div>
</body>
</html>`;
}
