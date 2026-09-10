import { NextRequest, NextResponse } from 'next/server';
import { createComplaint } from '@/db/store';

// Public API — anyone can submit a complaint (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerPhone, customerName, description, imageUrl } = body;

    if (!customerPhone || !description) {
      return NextResponse.json(
        { error: 'Phone number and description are required.' },
        { status: 400 }
      );
    }

    const complaint = await createComplaint({
      customerPhone: String(customerPhone).trim(),
      customerName: customerName ? String(customerName).trim() : undefined,
      description: String(description).trim(),
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    });

    return NextResponse.json({ success: true, complaint });
  } catch (err) {
    console.error('Complaint submission error:', err);
    return NextResponse.json({ error: 'Failed to submit complaint' }, { status: 500 });
  }
}
