import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';
import { getCandidateById } from '@/services/candidateService';
import { getCandidateResume } from '@/lib/storage';

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
    if (!candidate || !candidate.resumeStorageKey) {
      return NextResponse.json({ error: 'Resume not found for this candidate' }, { status: 404 });
    }

    const resumeData = await getCandidateResume(candidate.resumeStorageKey, candidate.resumeMimeType);
    if (!resumeData) {
      return NextResponse.json({ error: 'Resume file not found in storage' }, { status: 404 });
    }

    const isDownload = req.nextUrl.searchParams.get('download') === 'true' || req.nextUrl.searchParams.get('download') === '1';
    const disposition = isDownload ? 'attachment' : 'inline';
    const filename = candidate.resumeFileName || `Candidate_${candidate.applicationId}_Resume.pdf`;

    return new NextResponse(resumeData.buffer as any, {
      headers: {
        'Content-Type': resumeData.mimeType || 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error retrieving candidate resume:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
