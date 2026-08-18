import type { ActivityItem } from '@store/loyaltyStore';

interface StatementData {
  totalPoints: number;
  cashbackEarned: number;
  activityHistory: ActivityItem[];
}

function formatActivityValue(activity: ActivityItem): string {
  if (activity.valueType === 'inr') {
    const sign = activity.isCredit ? '+' : '';
    return `${sign}₹${Math.abs(activity.points).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const sign = activity.points >= 0 ? '+' : '';
  return `${sign}${activity.points.toLocaleString('en-IN')} CP`;
}

export function buildLoyaltyStatementHtml(data: StatementData): string {
  const rows = data.activityHistory
    .map(
      (a) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">${a.title}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#888;">${a.time}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-weight:700;">${formatActivityValue(a)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">${a.status}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, sans-serif; color: #1A1A1A; padding: 32px; }
    h1 { color: #FEB623; font-size: 22px; margin-bottom: 4px; }
    .meta { color: #888; font-size: 13px; margin-bottom: 24px; }
    .summary { display: flex; gap: 32px; margin-bottom: 28px; }
    .card { background: #F5F5F5; border-radius: 12px; padding: 16px 20px; }
    .card label { font-size: 11px; color: #888; text-transform: uppercase; }
    .card .val { font-size: 22px; font-weight: 800; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #FEB623; color: #888; font-size: 11px; text-transform: uppercase; }
  </style>
</head>
<body>
  <h1>Bajriwala — Loyalty Statement</h1>
  <p class="meta">Generated ${new Date().toLocaleDateString('en-IN')}</p>
  <div class="summary">
    <div class="card">
      <label>Total Points</label>
      <div class="val">${data.totalPoints.toLocaleString('en-IN')} CP</div>
    </div>
    <div class="card">
      <label>Cashback Earned</label>
      <div class="val">₹${data.cashbackEarned.toLocaleString('en-IN')}</div>
    </div>
  </div>
  <h2 style="font-size:16px;margin-bottom:12px;">Activity History</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Date</th>
        <th>Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
