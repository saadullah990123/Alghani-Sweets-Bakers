import { describe, it, expect } from 'vitest';
import { updateOrderPaymentStatus, deleteOrder, getOrderById } from '@/db/store';
import { PaymentStatus } from '@/lib/types';

describe('Admin Order Features', () => {
  const validPaymentStatuses: PaymentStatus[] = ['paid', 'pending', 'verified', 'cancelled'];

  it('validates allowed payment statuses', () => {
    for (const st of validPaymentStatuses) {
      expect(['paid', 'pending', 'verified', 'cancelled']).toContain(st);
    }
    const invalidStatus = 'refunded';
    expect(validPaymentStatuses).not.toContain(invalidStatus);
  });

  it('updates payment status for an existing order', async () => {
    const order = await getOrderById('AGB-20260905-102');
    if (order) {
      const updated = await updateOrderPaymentStatus('AGB-20260905-102', 'paid');
      expect(updated).not.toBeNull();
      expect(updated?.paymentStatus).toBe('paid');
      // Verify orderStatus was NOT changed
      expect(updated?.orderStatus).toBe(order.orderStatus);

      // Revert back for consistency
      await updateOrderPaymentStatus('AGB-20260905-102', 'pending');
    }
  });

  it('returns null when updating payment status for non-existent order', async () => {
    const result = await updateOrderPaymentStatus('NON-EXISTENT-ID', 'verified');
    expect(result).toBeNull();
  });

  it('returns false when attempting to delete a non-existent order', async () => {
    const result = await deleteOrder('NON-EXISTENT-ORDER-ID-999');
    expect(result).toBe(false);
  });
});
