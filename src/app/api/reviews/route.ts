import { NextRequest, NextResponse } from 'next/server';
import { addReview, getReviewsForProduct, getReviewSummary, getProductById } from '@/db/store';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';

// Finding 10-A: bounds review-spam from a single client. 5 reviews per hour
// per IP is well above what a genuine customer would ever submit in one
// sitting, while meaningfully limiting automated abuse.
const CREATE_REVIEW_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const [reviews, summary] = await Promise.all([
      getReviewsForProduct(productId),
      getReviewSummary(productId),
    ]);

    return NextResponse.json({ reviews, summary });
  } catch (err) {
    console.error('GET /api/reviews error:', err);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rate = checkRateLimit(`create-review:${clientId}`, CREATE_REVIEW_RATE_LIMIT);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds!);
  }

  try {
    const body = await req.json();
    const { productId, customerName, rating, comment } = body;

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json(
        { error: 'productId, customerName, rating, and comment are required' },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify the product actually exists — don't let reviews attach to a
    // fabricated productId.
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const review = await addReview({
      productId,
      customerName: String(customerName).trim().slice(0, 100),
      rating: numericRating,
      comment: String(comment).trim().slice(0, 1000),
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
