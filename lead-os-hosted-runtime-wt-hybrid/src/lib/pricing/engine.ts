export function computePrice({ leads, revenue, roi, churnRisk }) {
  let base = 1000;

  // demand factor
  if (leads > 50) base += 500;
  if (leads > 100) base += 1000;

  // ROI factor
  if (roi > 5) base += 500;
  if (roi > 10) base += 1000;

  // churn protection
  if (churnRisk === "HIGH") base -= 300;
  if (churnRisk === "MEDIUM") base -= 100;

  // floor
  if (base < 300) base = 300;

  return base;
}
