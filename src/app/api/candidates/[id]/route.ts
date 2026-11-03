import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';
import { getCandidateById, updateCandidateStatus } from '@/services/candidateService';
import { statusUpdateSchema } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: HR access required' }, { status: 401 });
  }

  try {
    const candidate = await getCandidateById(params.id);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate record not found' }, { status: 404 });
    }

    return NextResponse.json({ candidate });
  } catch (err: any) {
    console.error('Error fetching candidate details:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: HR access required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = statusUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid status data';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { applicationStatus, statusNotes } = parseResult.data;
    const updated = await updateCandidateStatus(params.id, applicationStatus, statusNotes);

    if (!updated) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      candidate: updated,
    });
  } catch (err: any) {
    console.error('Error updating candidate status:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

