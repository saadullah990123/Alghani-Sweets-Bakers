import { NextRequest, NextResponse } from 'next/server';
import { getComplaints, updateComplaintStatus } from '@/db/store';

// GET: fetch all complaints (admin)
export async function GET() {
  try {
    const complaints = await getComplaints();
    return NextResponse.json({ complaints });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

// PATCH: update complaint status (admin)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const updated = await updateComplaintStatus(id, status, adminNotes);
    if (!updated) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, complaint: updated });
  } catch (err) {
    console.error('Error updating complaint:', err);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}
