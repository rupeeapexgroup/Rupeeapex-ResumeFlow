import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth';
import { getCandidateById } from '@/services/candidateService';
import { getCandidatePhotograph } from '@/lib/storage';

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
    if (!candidate || !candidate.photographStorageKey) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photoData = await getCandidatePhotograph(candidate.photographStorageKey);
    if (!photoData) {
      return NextResponse.json({ error: 'Photo file not found in storage' }, { status: 404 });
    }

    const isDownload = req.nextUrl.searchParams.get('download') === 'true' || req.nextUrl.searchParams.get('download') === '1';
    const ext = photoData.mimeType === 'image/png' ? 'png' : 'jpg';
    const disposition = isDownload ? 'attachment' : 'inline';

    return new NextResponse(photoData.buffer as any, {
      headers: {
        'Content-Type': photoData.mimeType,
        'Content-Disposition': `${disposition}; filename="Candidate_${candidate.applicationId}_Photo.${ext}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error retrieving candidate photo:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
