import LegalLayout from '@/components/legal/LegalLayout';
import { getSettings } from '@/db/store';
import { formatPKR } from '@/lib/utils';

export const metadata = { title: 'Shipping & Delivery Policy | Al-Ghani Sweets & Bakers' };
export const revalidate = 60;

export default async function ShippingPolicyPage() {
  const settings = await getSettings();

  return (
    <LegalLayout title="Shipping & Delivery Policy" lastUpdated="September 2026">
      <section>
        <h2 className="font-bold text-gray-900 text-base">1. Delivery or Pickup</h2>
        <p>
          At checkout you can choose either <strong>Pickup</strong> from{' '}
          {settings.address || 'our outlet'} at no extra charge, or <strong>Delivery</strong> to your
          address.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">2. Delivery Fees</h2>
        <p>
          A standard delivery fee of <strong>{formatPKR(settings.deliveryFee)}</strong> applies to orders
          below {formatPKR(settings.minOrderValue)}. Orders outside our core delivery radius may attract an
          additional fee of <strong>{formatPKR(settings.additionalDeliveryFee)}</strong>. The exact fee for
          your address is always calculated by our server and shown before you confirm your order — never
          a manually typed amount.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">3. Delivery Timing</h2>
        <p>
          Ready-made items are typically delivered the same day for orders placed with enough lead time
          before closing. Customized cakes require advance notice — the required lead time is shown when
          you configure your cake. Delivery windows are estimates; on high-demand days (weekends, Eid,
          wedding season) please allow extra buffer time.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">4. Delivery Area</h2>
        <p>
          We currently deliver within our local service area. If your address falls outside our delivery
          radius, we'll contact you at checkout to arrange pickup instead, or to let you know it's outside
          our range.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">5. Receiving Your Order</h2>
        <p>
          Please inspect your order at the door / at pickup. For cakes especially, check the item before
          our rider leaves or before you leave the counter — see our{' '}
          <a href="/legal/refund-policy" className="text-brand-600 font-semibold hover:underline">
            Refund &amp; Cancellation Policy
          </a>{' '}
          for what to do if something isn't right.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">6. Contact</h2>
        <p>
          For delivery questions on an active order, call or WhatsApp us at{' '}
          <strong>{settings.whatsapp || settings.phone}</strong>.
        </p>
      </section>
    </LegalLayout>
  );
}
