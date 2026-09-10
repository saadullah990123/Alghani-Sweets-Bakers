import LegalLayout from '@/components/legal/LegalLayout';
import { getSettings } from '@/db/store';

export const metadata = { title: 'Refund & Cancellation Policy | Al-Ghani Sweets & Bakers' };
export const revalidate = 60;

export default async function RefundPolicyPage() {
  const settings = await getSettings();

  return (
    <LegalLayout title="Refund & Cancellation Policy" lastUpdated="September 2026">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm leading-relaxed">
        <strong>Note for the business owner:</strong> This page proposes sensible, commonly-used default
        rules (a standard approach many bakeries use) since specific refund rules for the custom-cake
        advance hadn't been decided yet. Please review and adjust the percentages/timeframes below to match
        what you actually want to offer, then remove this note.
      </div>

      <section>
        <h2 className="font-bold text-gray-900 text-base">1. Ready-Made Items (Cakes, Sweets, Bakery, Snacks)</h2>
        <p>
          Because these are perishable food items, we generally cannot accept returns once an order has
          been handed over. If an item arrives damaged, incorrect, or not as described, please contact us
          within <strong>2 hours of delivery/pickup</strong> with a photo — we will offer a replacement or a
          full refund at our discretion.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">2. Customized Cake Advance ({settings.advancePercentage}%)</h2>
        <p>
          Custom cake orders require a {settings.advancePercentage}% advance payment before we begin
          preparation, since ingredients and design work are committed to your order specifically. Our
          proposed default rules for this advance:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Cancelled 48+ hours before the scheduled pickup/delivery time:</strong> full advance
            refunded.
          </li>
          <li>
            <strong>Cancelled 24–48 hours before:</strong> 50% of the advance refunded (to cover ingredients
            already sourced).
          </li>
          <li>
            <strong>Cancelled less than 24 hours before, or after preparation has started:</strong> advance
            is non-refundable.
          </li>
          <li>
            <strong>Order changes</strong> (size, flavor, design) requested more than 48 hours in advance
            will be accommodated where possible at no extra cancellation cost, subject to any price
            difference.
          </li>
          <li>
            If <strong>we</strong> are unable to fulfil your order for any reason on our end, the full
            advance (and any balance paid) is refunded in full.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">3. How Refunds Are Issued</h2>
        <p>
          Refunds are issued back to the original payment method (JazzCash, Easypaisa, bank transfer/card)
          within 3–5 business days of approval. Cash on Delivery refunds are handled directly with our
          team.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">4. How to Request a Refund or Cancellation</h2>
        <p>
          Contact us as soon as possible using the phone number or WhatsApp listed in the website footer,
          quoting your order number.
        </p>
      </section>
    </LegalLayout>
  );
}
