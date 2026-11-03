import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';
import { getDashboardStats } from '@/services/candidateService';

export async function GET(req: NextRequest) {
  const session = await verifySessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: HR access required' }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}
