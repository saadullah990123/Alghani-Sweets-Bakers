import { NextRequest, NextResponse } from 'next/server';
import { getAllReviewsAdmin, deleteReview } from '@/db/store';
import { parsePaginationParams } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize } = parsePaginationParams(searchParams);
    const result = await getAllReviewsAdmin({ page, pageSize });
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/admin/reviews error:', err);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Review id is required' }, { status: 400 });
    }
    const success = await deleteReview(id);
    if (!success) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/reviews error:', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
