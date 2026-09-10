import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = { title: 'Disclaimer | Al-Ghani Sweets & Bakers' };

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" lastUpdated="September 2026">
      <section>
        <h2 className="font-bold text-gray-900 text-base">1. Allergen Information</h2>
        <p>
          Our kitchen prepares items containing (or that may come into contact with) common allergens
          including wheat/gluten, eggs, milk/dairy, tree nuts, peanuts, and soy. While we take reasonable
          care, our kitchen is not a certified allergen-free facility, and cross-contact between products
          is possible.
        </p>
        <p>
          If you or the person you're ordering for has a food allergy or intolerance, please tell us via
          the order's special instructions field, or by calling us before ordering, so we can advise
          whether we can safely accommodate it. When in doubt, please do not rely solely on this website —
          confirm directly with our staff.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">2. Product Images</h2>
        <p>
          Photos on our website are representative of our products but actual cakes/items — especially
          custom designs — may vary slightly in appearance, color, and finishing due to the handmade nature
          of our preparation.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">3. Pricing</h2>
        <p>
          Prices are subject to change without prior notice; the price shown and confirmed at checkout is
          the price that applies to your order.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">4. Storage &amp; Consumption</h2>
        <p>
          Perishable items should be stored appropriately (refrigerated where indicated) and consumed
          within the timeframe advised by our staff at the time of purchase. We are not responsible for
          quality issues arising from improper storage after delivery/pickup.
        </p>
      </section>
    </LegalLayout>
  );
}
