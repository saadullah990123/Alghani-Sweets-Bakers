import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = { title: 'Terms of Service | Al-Ghani Sweets & Bakers' };

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="September 2026">
      <section>
        <h2 className="font-bold text-gray-900 text-base">1. Acceptance of Terms</h2>
        <p>
          By using the website of{' '}
          <strong>Al-Ghani Sweets &amp; Bakers</strong>, registered at{' '}
          <strong>Mator Road, near Kahuta Bus Stand, Kahuta, Punjab, Pakistan</strong> ("we", "us", "our") to browse or place
          an order, you agree to these Terms of Service.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">2. Orders</h2>
        <p>
          Orders are placed as a guest — no account or login is required. All prices, taxes, and delivery
          fees are calculated and confirmed by our server at checkout; the amount shown at checkout is the
          final amount due. We reserve the right to decline or cancel an order (for example, if an item is
          unexpectedly unavailable or an address falls outside our delivery area), in which case we will
          contact you and refund any payment already made.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">3. Customized Cakes</h2>
        <p>
          Customized cake orders require an advance payment (shown as a percentage of the order total at
          checkout) before we begin preparation. The remaining balance is due at pickup or delivery. See our{' '}
          <a href="/legal/refund-policy" className="text-brand-600 font-semibold hover:underline">
            Refund &amp; Cancellation Policy
          </a>{' '}
          for how the advance is treated if an order is changed or cancelled.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">4. Payments</h2>
        <p>
          We accept Cash on Delivery and select digital payment methods (JazzCash, Easypaisa, bank
          transfer/card, depending on availability). For non-cash methods, an order is only confirmed as
          paid once our team has manually verified the transaction against the amount due; until then, the
          order shows as "Pending Verification."
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">5. Delivery &amp; Pickup</h2>
        <p>
          Delivery is available within the areas and fees described in our{' '}
          <a href="/legal/shipping-policy" className="text-brand-600 font-semibold hover:underline">
            Shipping &amp; Delivery Policy
          </a>
          . Estimated timings are our best effort and not guaranteed to the minute, especially during peak
          days (Eid, weekends, wedding season).
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">6. Food Safety &amp; Allergens</h2>
        <p>
          Please see our{' '}
          <a href="/legal/disclaimer" className="text-brand-600 font-semibold hover:underline">
            Disclaimer
          </a>{' '}
          regarding allergens and food handling.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by{' '}
          <strong>Punjab, Pakistan</strong> law, we are not liable for indirect or
          consequential losses arising from delays, unavailability of the website, or use of our products
          beyond replacement or refund of the affected order.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">8. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the website after changes are
          posted means you accept the updated Terms.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">9. Governing Law</h2>
        <p>
          These Terms are governed by the laws of{' '}
          <strong>Punjab, Pakistan</strong>, and any
          disputes will be subject to the exclusive jurisdiction of the courts located there.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">10. Contact Us</h2>
        <p>Questions about these Terms can be sent to us via the contact details in our website footer.</p>
      </section>
    </LegalLayout>
  );
}
