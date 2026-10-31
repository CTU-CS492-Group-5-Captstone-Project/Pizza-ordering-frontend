import { money } from "./money";
import type { CartData } from "./Cart";

export default function OrderSummary({ summary }: { summary: Omit<CartData, "lines"> }) {
  return <dl className="totals">
    <dt>Subtotal</dt><dd>{money(summary.subtotal)}</dd>
    <dt>Discount{summary.promotion_title ? ` (${summary.promotion_title})` : ""}</dt><dd>-{money(summary.discount)}</dd>
    <dt>Taxable subtotal</dt><dd>{money(summary.taxable_subtotal)}</dd>
    <dt>Tax ({Number(summary.tax_rate) * 100}%)</dt><dd>{money(summary.tax)}</dd>
    <dt><strong>Total (USD)</strong></dt><dd><strong>{money(summary.total)}</strong></dd>
  </dl>;
}
