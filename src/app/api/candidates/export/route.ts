import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';
import { exportCandidatesToExcel } from '@/services/excelService';

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
  const applicantType = searchParams.get('applicantType') || undefined;
  const ageRange = searchParams.get('ageRange') || undefined;
  const gender = searchParams.get('gender') || undefined;
  const dateRange = searchParams.get('dateRange') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  try {
    const excelBuffer = await exportCandidatesToExcel({
      search,
      role,
      status,
      education,
      experience,
      applicantType,
      ageRange,
      gender,
      dateRange,
      startDate,
      endDate,
    });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `Rupeeapex_Candidates_${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error exporting candidates to Excel:', err);
    return NextResponse.json(
      { error: 'Failed to export candidate records to Excel' },
      { status: 500 }
    );
  }
}
