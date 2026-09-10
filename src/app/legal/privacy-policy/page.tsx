import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = { title: 'Privacy Policy | Al-Ghani Sweets & Bakers' };

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="September 2026">
      <section>
        <h2 className="font-bold text-gray-900 text-base">1. Who We Are</h2>
        <p>
          This Privacy Policy explains how{' '}
          <strong>Al-Ghani Sweets &amp; Bakers</strong>,
          registered at <strong>Mator Road, near Kahuta Bus Stand, Kahuta, Punjab, Pakistan</strong> ("we", "us", "our"),
          collects, uses, and protects information when you use our website to browse and order cakes,
          sweets, and food items ("the Service").
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">2. Information We Collect</h2>
        <p>When you place an order as a guest (we do not require account creation), we collect:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your name, phone number, and (optionally) email address</li>
          <li>Delivery address and nearby landmark, if you choose delivery</li>
          <li>Order details: items, customization notes, and special instructions</li>
          <li>Payment method selected and, where applicable, a transaction reference you provide (we never
            collect or store your card, JazzCash, or Easypaisa PIN/credentials)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">3. How We Use Your Information</h2>
        <p>We use the information you provide solely to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Prepare, verify, and deliver your order</li>
          <li>Contact you about your order status (by phone, WhatsApp, or email)</li>
          <li>Verify payments for non-cash orders</li>
          <li>Improve our menu and service based on aggregated order trends</li>
        </ul>
        <p>We do not sell or rent your personal information to third parties.</p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">4. Cookies</h2>
        <p>
          Our storefront does not use tracking or advertising cookies. The only cookie we set is a
          strictly necessary, encrypted session cookie used to keep an admin staff member signed in to the
          management dashboard; it is not used to track customers browsing the public store.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">5. Data Retention</h2>
        <p>
          We retain order records for{' '}
          <strong>6 years</strong> for accounting, tax, and dispute
          resolution purposes, in line with <strong>applicable Pakistani tax and business record-keeping laws</strong>.
          You may request that we delete personal information that is not otherwise required to be kept
          for these legal reasons by contacting us using the details below.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">6. Data Sharing</h2>
        <p>
          We share order and delivery details only with our own delivery riders/staff for the purpose of
          fulfilling your order, and with payment providers (JazzCash, Easypaisa, Meezan Bank) solely to
          verify the transaction you initiated with them.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">7. Your Rights</h2>
        <p>
          You may ask us to correct inaccurate information, or to delete your data (subject to legal
          retention requirements above), at any time by contacting us.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">8. Governing Law</h2>
        <p>
          This policy is governed by the laws of{' '}
          <strong>Punjab, Pakistan</strong>.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 text-base">9. Contact Us</h2>
        <p>
          For any privacy questions or requests, please reach out via the contact details listed in our
          website footer.
        </p>
      </section>
    </LegalLayout>
  );
}
