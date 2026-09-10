import { NextRequest, NextResponse } from 'next/server';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  confirmOrderAdvance,
  confirmOrderPayment,
  markOrderPaymentFailed,
  getCustomerOrderHistory,
  getDashboardStats,
} from '@/db/store';
import { parsePaginationParams } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const customerPhone = searchParams.get('customerPhone');
    const statsOnly = searchParams.get('stats');

    if (statsOnly) {
      const stats = await getDashboardStats();
      return NextResponse.json(stats);
    }

    if (customerPhone) {
      const history = await getCustomerOrderHistory(customerPhone);
      return NextResponse.json(history);
    }

    if (id) {
      const order = await getOrderById(id);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      return NextResponse.json(order);
    }

    const status = searchParams.get('status') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const customParam = searchParams.get('containsCustomizedCake');
    const containsCustomizedCake = customParam !== null ? customParam === 'true' : undefined;
    const search = searchParams.get('search') || undefined;
    const sortFieldParam = searchParams.get('sortField');
    const sortField =
      sortFieldParam === 'grandTotal' || sortFieldParam === 'id' || sortFieldParam === 'createdAt' ? sortFieldParam : undefined;
    const sortOrderParam = searchParams.get('sortOrder');
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : sortOrderParam === 'desc' ? 'desc' : undefined;
    const { page, pageSize } = parsePaginationParams(searchParams);

    const result = await getOrders({
      status,
      paymentMethod,
      containsCustomizedCake,
      search,
      sortField,
      sortOrder,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Admin Orders GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, status, internalNotes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (action === 'CONFIRM_ADVANCE') {
      const updated = await confirmOrderAdvance(id);
      return NextResponse.json(updated);
    }

    if (action === 'CONFIRM_PAYMENT') {
      const updated = await confirmOrderPayment(id);
      return NextResponse.json(updated);
    }

    if (action === 'MARK_PAYMENT_FAILED') {
      const updated = await markOrderPaymentFailed(id);
      return NextResponse.json(updated);
    }

    if (action === 'UPDATE_STATUS' && status) {
      const updated = await updateOrderStatus(id, status, internalNotes);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin Orders PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
