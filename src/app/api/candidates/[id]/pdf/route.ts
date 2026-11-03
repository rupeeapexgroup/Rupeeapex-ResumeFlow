import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';
import { getCandidateById } from '@/services/candidateService';
import { generateCandidatePdf } from '@/services/pdfService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Strictly enforce HR session check
  const session = await verifySessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: HR access required' }, { status: 401 });
  }

  try {
    const candidate = await getCandidateById(params.id);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate record not found' }, { status: 404 });
    }

    const pdfBytes = await generateCandidatePdf(candidate);

    return new NextResponse(Buffer.from(pdfBytes) as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Candidate_${candidate.applicationId}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error generating candidate PDF:', err);
    return NextResponse.json({ error: 'Failed to generate PDF document' }, { status: 500 });
  }
}
