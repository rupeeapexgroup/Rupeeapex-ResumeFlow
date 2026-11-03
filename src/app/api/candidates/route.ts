import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';
import { getCandidates } from '@/services/candidateService';

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: HR access required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const role = searchParams.get('role') || undefined;
  const status = searchParams.get('status') || undefined;
  const education = searchParams.get('education') || undefined;
  const experience = searchParams.get('experience') || undefined;
  const dateRange = searchParams.get('dateRange') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  try {
    const result = await getCandidates({
      search,
      role,
      status,
      education,
      experience,
      dateRange,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error fetching candidates:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve candidate records' },
      { status: 500 }
    );
  }
}

