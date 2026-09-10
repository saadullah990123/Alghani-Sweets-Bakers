import { NextRequest, NextResponse } from 'next/server';
import { createOrder, decrementStock, getAllProductsAdmin, getOrderById, getProductsByIds, getSettings } from '@/db/store';
import { generateOrderId } from '@/lib/utils';
import { DEFAULT_CAKE_WEIGHT_OPTIONS, DEFAULT_CAKE_FLAVOR_OPTIONS } from '@/lib/customizationDefaults';
import { PaymentMethod, PaymentStatus } from '@/lib/types';
import { notifyNewOrder } from '@/lib/notifications';
import { calculateSubtotal, calculateDiscount, calculateOrderTotals } from '@/lib/pricing';
import { OutOfStockError } from '@/lib/stock';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';

// Finding 10-A: bounds how many orders a single client can place in a short
// window, without getting in the way of a real customer (or a shared-IP
// household/office) placing several genuine orders. 10 orders per 15
// minutes per IP is generous headroom for legitimate bursts (e.g. a
// promotion goes out and several real orders land close together) while
// still bounding automated spam.
const CREATE_ORDER_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 };

// Demo voucher table. This is intentionally the only place a discount can be
// granted — a client can never submit a discountAmount directly (see POST
// below), so this is the single source of truth for promo pricing.
const VALID_VOUCHERS: Record<string, number> = {
  ALGHANI10: 10, // percent off subtotal
};

const VALID_PAYMENT_METHODS: PaymentMethod[] = ['COD', 'ONLINE_CARD', 'JAZZCASH', 'EASYPAISA', 'MEEZAN_BANK'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // This route is public (unauthenticated) and only ever used to let a
    // customer pull up the order they just placed on the confirmation page.
    // It must never be usable to list or browse other customers' orders —
    // an `id` is required for every lookup.
    if (!id) {
      return NextResponse.json({ error: 'An order id is required' }, { status: 400 });
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err: any) {
    console.error('API /api/orders GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rate = checkRateLimit(`create-order:${clientId}`, CREATE_ORDER_RATE_LIMIT);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds!);
  }

  try {
    const body = await req.json();

    if (!body.customerName || !body.customerPhone || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Invalid order data: Name, Phone, and Items required' }, { status: 400 });
    }

    const settings = await getSettings();
    const orderId = generateOrderId();

    // --- Recompute every line item from the real catalog. Nothing about
    // price is ever trusted from the client past this point. ---
    const verifiedItems: import('@/lib/types').OrderItem[] = [];

    // Finding 3-A: fetch every distinct product this cart references in ONE
    // batched call instead of one getProductById() per line item — in
    // Postgres mode that's the difference between 1 query and N sequential
    // network round trips for an N-item cart. The loop below is otherwise
    // unchanged: it still validates and prices each line item individually,
    // just from an in-memory lookup instead of an async call each time.
    const requestedProductIds = [...new Set(body.items.map((i: any) => i?.productId).filter(Boolean))] as string[];
    const productsById = new Map((await getProductsByIds(requestedProductIds)).map((p) => [p.id, p]));
    let allProducts: import('@/lib/types').Product[] | undefined;

    const normalizeProductName = (name: unknown) =>
      String(name || '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    for (const rawItem of body.items) {
      let product = rawItem?.productId ? productsById.get(rawItem.productId) : undefined;
      if (!product && rawItem?.productName) {
        allProducts ??= await getAllProductsAdmin();
        const requestedName = String(rawItem.productName).trim();
        const normalizedName = normalizeProductName(requestedName);
        product = allProducts.find((candidate) => candidate.name.trim() === requestedName);
        product ??= allProducts.find((candidate) => normalizeProductName(candidate.name) === normalizedName);
      }
      if (!product) {
        return NextResponse.json(
          { error: `Item "${rawItem?.productName || rawItem?.productId || 'unknown'}" could not be verified` },
          { status: 400 }
        );
      }
      if (!product.isAvailable) {
        return NextResponse.json({ error: `"${product.name}" is currently unavailable` }, { status: 400 });
      }

      const quantity = Math.max(1, Math.min(50, Math.floor(Number(rawItem.quantity) || 1)));
      let unitPrice: number;
      let variantName: string | undefined;

      if (rawItem.isCustomized) {
        // Customized cakes: price = weight tier + flavor modifier, resolved
        // against the product's own steps if defined, else the shared
        // default price table (same one the modal uses for display).
        const weightOptions =
          product.customizationSteps?.find(
            (s) => s.stepType === 'RADIO' && s.title.toLowerCase().includes('weight')
          )?.options || DEFAULT_CAKE_WEIGHT_OPTIONS;
        const flavorOptions =
          product.customizationSteps?.find(
            (s) => s.stepType === 'RADIO' && s.title.toLowerCase().includes('flavor')
          )?.options || DEFAULT_CAKE_FLAVOR_OPTIONS;

        const weightOpt =
          weightOptions.find((o) => o.name === rawItem.customizationDetails?.weight) || weightOptions[0];
        const flavorOpt =
          flavorOptions.find((o) => o.name === rawItem.customizationDetails?.flavor) || flavorOptions[0];

        unitPrice = (weightOpt?.priceModifier || product.basePrice) + (flavorOpt?.priceModifier || 0);
        variantName = weightOpt?.name;
      } else if (rawItem.variantId) {
        const variant = product.variants?.find((v) => v.id === rawItem.variantId);
        if (!variant) {
          return NextResponse.json({ error: `Invalid option selected for "${product.name}"` }, { status: 400 });
        }
        unitPrice = variant.price;
        variantName = variant.name;
      } else {
        unitPrice = product.basePrice;
      }

      verifiedItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId,
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0],
        variantName,
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
        specialInstructions:
          typeof rawItem.specialInstructions === 'string' ? rawItem.specialInstructions.slice(0, 500) : undefined,
        isCustomized: !!rawItem.isCustomized,
        customizationDetails: rawItem.isCustomized ? rawItem.customizationDetails : undefined,
      });
    }

    // --- Recompute every money total server-side from settings + verified items ---
    // Cart math (line totals -> subtotal) and the tax/delivery/advance
    // calculation both live in src/lib/pricing.ts, covered by unit tests —
    // see src/lib/__tests__/pricing.test.ts.
    const subtotal = calculateSubtotal(verifiedItems);
    const orderType: 'DELIVERY' | 'PICKUP' = body.orderType === 'PICKUP' ? 'PICKUP' : 'DELIVERY';
    const voucherCode = typeof body.voucherCode === 'string' ? body.voucherCode : '';
    const discountAmount = calculateDiscount(subtotal, voucherCode, VALID_VOUCHERS);
    const containsCustomizedCake = verifiedItems.some((i) => i.isCustomized);

    const { taxAmount, deliveryFee, grandTotal, advanceRequired, balanceDue } = calculateOrderTotals({
      subtotal,
      settings,
      orderType,
      discountAmount,
      containsCustomizedCake,
    });
    const advancePercentage = settings.advancePercentage;

    const paymentMethod: PaymentMethod = VALID_PAYMENT_METHODS.includes(body.paymentMethod) ? body.paymentMethod : 'COD';

    // Hard business rule: customized cakes always require an upfront advance —
    // Cash on Delivery can't be used to skip it, whatever the client sends.
    if (containsCustomizedCake && paymentMethod === 'COD') {
      return NextResponse.json(
        { error: 'Cash on Delivery is not available for customized cake orders — an advance payment is required.' },
        { status: 400 }
      );
    }

    // Payment state integrity: an order is NEVER created as already "PAID".
    // COD stays PENDING until delivered in person; every other method sits
    // in PENDING_VERIFICATION until an admin checks the actual transaction
    // (JazzCash/Easypaisa/bank reference, or card receipt) and confirms it.
    const paymentStatus: PaymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'PENDING_VERIFICATION';

    // Atomically check + decrement stock for any tracked item (see
    // decrementStock() in src/db/store.ts for how this stays race-free
    // under concurrent checkouts). Untracked/made-to-order items
    // (stock === undefined) always pass through unaffected. This runs
    // BEFORE the order is persisted so a sold-out item never creates an
    // order the bakery can't actually fulfill, and never partially
    // decrements some items but not others.
    const stockResult = await decrementStock(
      // productId is always set here — every verifiedItems entry is built from
      // a confirmed `product.id` above, never left undefined.
      verifiedItems.map((i) => ({ productId: i.productId!, quantity: i.quantity }))
    );
    if (!stockResult.success) {
      return NextResponse.json({ error: stockResult.error }, { status: 409 });
    }

    const newOrder = await createOrder({
      id: orderId,
      customerTitle: typeof body.customerTitle === 'string' ? body.customerTitle : undefined,
      customerName: String(body.customerName).trim().slice(0, 120),
      customerPhone: String(body.customerPhone).trim().slice(0, 30),
      alternatePhone: body.alternatePhone ? String(body.alternatePhone).trim().slice(0, 30) : undefined,
      customerEmail: body.customerEmail ? String(body.customerEmail).trim().slice(0, 200) : undefined,
      orderType,
      deliveryAddress:
        orderType === 'DELIVERY' ? String(body.deliveryAddress || '').trim().slice(0, 500) : 'Takeaway / Pickup at Bakery',
      nearestLandmark: body.nearestLandmark ? String(body.nearestLandmark).trim().slice(0, 200) : undefined,
      deliveryInstructions: body.deliveryInstructions ? String(body.deliveryInstructions).trim().slice(0, 500) : undefined,

      subtotal,
      taxAmount,
      deliveryFee,
      discountAmount,
      grandTotal,

      containsCustomizedCake,
      advancePercentage,
      advanceRequired,
      advancePaid: 0,
      balanceDue,
      advanceConfirmed: false,

      paymentMethod,
      paymentStatus,
      paymentReference:
        paymentMethod !== 'COD' && body.paymentReference ? String(body.paymentReference).trim().slice(0, 200) : undefined,
      changeRequest: body.changeRequest ? String(body.changeRequest).trim().slice(0, 200) : undefined,

      orderStatus: 'PENDING',
      items: verifiedItems,
    });

    // Fire the WhatsApp/email order alert. This is intentionally fire-and-forget
    // and never allowed to fail or delay the customer's checkout response —
    // see src/lib/notifications.ts for how each channel is configured.
    notifyNewOrder(newOrder, settings);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (err: any) {
    if (err instanceof OutOfStockError) {
      // Only reachable in Postgres mode: the in-transaction stock check in
      // createOrderPg rejected an item (e.g. it sold out between our
      // earlier decrementStock() no-op check and the actual transaction —
      // see the comment on decrementStock() in src/db/store.ts). Report it
      // the same way the JSON-store path already does above (409), not a
      // generic 500.
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('API /api/orders POST error:', err);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
