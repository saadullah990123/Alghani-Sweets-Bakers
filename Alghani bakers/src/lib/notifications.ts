import nodemailer from 'nodemailer';
import { Order, StoreSettings } from './types';
import { formatPKR, formatDate } from './utils';

// -----------------------------------------------------------------------------
// New-order alerts (email + WhatsApp/webhook)
// -----------------------------------------------------------------------------
// Nothing here is hardcoded to a paid provider. Everything is optional and
// controlled entirely by environment variables — if a channel isn't
// configured, it's silently skipped (and logged), so this never blocks or
// breaks order placement. This runs *after* an order is already saved, and
// failures here must never fail the checkout request.
//
// Email: any standard SMTP account (Gmail app password, SendGrid, Mailgun,
// Zoho, your own mail server, etc.) via nodemailer. Configure:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO
//
// WhatsApp / generic webhook: any service that accepts an incoming POST —
// WhatsApp Cloud API, a Zapier/Make/n8n webhook, Twilio Function, etc.
// Configure:
//   ORDER_ALERT_WEBHOOK_URL         (required to enable)
//   ORDER_ALERT_WEBHOOK_AUTH_HEADER (optional, e.g. "Bearer xyz")
//
// This intentionally does not hardcode the WhatsApp Cloud API's specific
// payload shape, since that requires a Meta Business/App ID + phone number ID
// this project doesn't have credentials for. Instead it POSTs a clean JSON
// payload (id, customer, phone, total, items, link) that works as-is with a
// no-code automation tool, or that a WhatsApp Cloud API proxy can reshape.

function buildOrderSummaryText(order: Order, settings: StoreSettings): string {
  const itemLines = order.items
    .map((i) => `  • ${i.quantity} x ${i.productName}${i.variantName ? ` (${i.variantName})` : ''} — ${formatPKR(i.lineTotal)}`)
    .join('\n');

  return [
    `New order received on ${settings.businessName}`,
    `Order: ${order.id}`,
    `Placed: ${formatDate(order.createdAt)}`,
    `Customer: ${order.customerTitle || ''} ${order.customerName} (${order.customerPhone})`,
    `Type: ${order.orderType}${order.orderType === 'DELIVERY' ? ` — ${order.deliveryAddress}` : ''}`,
    `Payment: ${order.paymentMethod} (${order.paymentStatus})`,
    `Items:`,
    itemLines,
    `Grand Total: ${formatPKR(order.grandTotal)}`,
    order.containsCustomizedCake ? `Advance required: ${formatPKR(order.advanceRequired)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendEmailAlert(order: Order, settings: StoreSettings): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ALERT_EMAIL_TO) {
    console.log(
      '[notifications] Email alert skipped — SMTP_HOST/SMTP_USER/SMTP_PASS/ALERT_EMAIL_TO not configured.'
    );
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Finding 21-A: bound how long a hung/unreachable SMTP server can hold
      // this connection open. This is fire-and-forget from the checkout
      // path already, so this doesn't add user-facing latency — it just
      // stops slow/dead SMTP servers from leaving sockets open indefinitely
      // under sustained order volume.
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    await transporter.sendMail({
      from: `"${settings.businessName}" <${SMTP_USER}>`,
      to: ALERT_EMAIL_TO,
      subject: `New Order ${order.id} — ${formatPKR(order.grandTotal)}`,
      text: buildOrderSummaryText(order, settings),
    });

    console.log(`[notifications] Order alert email sent for ${order.id}`);
  } catch (err) {
    console.error('[notifications] Failed to send order alert email:', err);
  }
}

async function sendWebhookAlert(order: Order, settings: StoreSettings): Promise<void> {
  const url = process.env.ORDER_ALERT_WEBHOOK_URL;
  if (!url) {
    console.log('[notifications] WhatsApp/webhook alert skipped — ORDER_ALERT_WEBHOOK_URL not configured.');
    return;
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.ORDER_ALERT_WEBHOOK_AUTH_HEADER) {
      headers['Authorization'] = process.env.ORDER_ALERT_WEBHOOK_AUTH_HEADER;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      // Finding 21-A: without a timeout, an unreachable/hanging webhook
      // endpoint would leave this fetch pending indefinitely. This is
      // fire-and-forget from the checkout path already, so this doesn't
      // add user-facing latency — it bounds resource accumulation under
      // sustained order volume against a broken endpoint.
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        orderId: order.id,
        customerName: `${order.customerTitle || ''} ${order.customerName}`.trim(),
        customerPhone: order.customerPhone,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderType: order.orderType,
        containsCustomizedCake: order.containsCustomizedCake,
        itemsSummary: order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
        message: buildOrderSummaryText(order, settings),
        adminLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/orders/${order.id}`,
        whatsappToNumber: settings.whatsapp,
      }),
    });

    if (!res.ok) {
      console.error(`[notifications] Webhook alert responded with ${res.status} for order ${order.id}`);
    } else {
      console.log(`[notifications] Webhook alert sent for ${order.id}`);
    }
  } catch (err) {
    console.error('[notifications] Failed to send webhook alert:', err);
  }
}

// Fire-and-forget: never throw back into the checkout request path.
export function notifyNewOrder(order: Order, settings: StoreSettings): void {
  Promise.allSettled([sendEmailAlert(order, settings), sendWebhookAlert(order, settings)]).catch(() => {
    // Both helpers already catch internally; this is just an extra safety net.
  });
}
