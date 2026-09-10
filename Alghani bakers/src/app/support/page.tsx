import Link from 'next/link';
import { getSettings } from '@/db/store';
import { Phone, Mail, MapPin, MessageCircle, ArrowLeft, HelpCircle } from 'lucide-react';

export const metadata = { title: 'Support & Help Center | Al-Ghani Sweets & Bakers' };
export const revalidate = 60;

const FAQS = [
  {
    q: 'How do I track my order?',
    a: "We'll contact you directly by phone/WhatsApp with updates. If you placed a delivery order, you can also call us any time with your order number for a status update.",
  },
  {
    q: 'How does payment verification work?',
    a: "For JazzCash, Easypaisa, bank transfer or card payments, your order shows as \"Pending Verification\" until our team manually checks your transaction against the order amount — this usually happens within a short time during business hours.",
  },
  {
    q: 'Can I change or cancel my order?',
    a: "Contact us as soon as possible — the sooner you reach out, the more likely we can accommodate changes or a cancellation. See our Refund & Cancellation Policy for how this works for customized cakes.",
  },
  {
    q: 'Do you cater to food allergies?',
    a: 'Please tell us about any allergy in the special instructions field or by calling ahead — see our Disclaimer page for full allergen information.',
  },
  {
    q: 'What areas do you deliver to?',
    a: 'See our Shipping & Delivery Policy for delivery area and fee details, or just enter your address at checkout to see if delivery is available.',
  },
];

export default async function SupportPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-600 transition mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Homepage</span>
      </Link>

      <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-gray-900">Support &amp; Help Center</h1>
      <p className="text-sm text-gray-500 mt-2">
        Have a question about an order, delivery, or anything else? Here's how to reach us, plus answers to
        a few common questions.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <a
          href={`tel:${settings.phone.replace(/\s+/g, '')}`}
          className="flex flex-col items-center gap-2 p-5 bg-white border border-gray-200 rounded-2xl hover:border-brand-300 hover:shadow-sm transition text-center"
        >
          <Phone className="w-5 h-5 text-brand-600" />
          <span className="text-xs font-bold text-gray-800">Call Us</span>
          <span className="text-xs text-gray-500">{settings.phone}</span>
        </a>
        <a
          href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-5 bg-white border border-gray-200 rounded-2xl hover:border-green-300 hover:shadow-sm transition text-center"
        >
          <MessageCircle className="w-5 h-5 text-green-600" />
          <span className="text-xs font-bold text-gray-800">WhatsApp</span>
          <span className="text-xs text-gray-500">{settings.whatsapp}</span>
        </a>
        <a
          href={`mailto:${settings.email}`}
          className="flex flex-col items-center gap-2 p-5 bg-white border border-gray-200 rounded-2xl hover:border-brand-300 hover:shadow-sm transition text-center"
        >
          <Mail className="w-5 h-5 text-brand-600" />
          <span className="text-xs font-bold text-gray-800">Email</span>
          <span className="text-xs text-gray-500 break-all">{settings.email}</span>
        </a>
      </div>

      {settings.address && (
        <div className="flex items-start gap-2.5 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <span>{settings.address}</span>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-serif text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-500" />
          <span>Frequently Asked Questions</span>
        </h2>
        <div className="mt-4 space-y-3">
          {FAQS.map((item, i) => (
            <details key={i} className="group p-4 bg-white border border-gray-200 rounded-2xl">
              <summary className="cursor-pointer font-bold text-sm text-gray-800 list-none flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
