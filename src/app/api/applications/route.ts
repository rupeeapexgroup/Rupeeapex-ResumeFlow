import { NextRequest, NextResponse } from 'next/server';
import { candidateApplicationSchema } from '@/lib/validation';
import { submitApplication } from '@/services/candidateService';

// Simple in-memory rate limiting map for public applications
const ipSubmissionTracker = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipSubmissionTracker.get(ip);

  if (!record || now > record.resetAt) {
    ipSubmissionTracker.set(ip, { count: 1, resetAt: now + 60 * 1000 }); // 60-second window
    return true;
  }

  if (record.count >= 10) {
    return false; // Max 10 submissions per minute per IP
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const dataJson = formData.get('data') as string;
    const photoFile = formData.get('photograph') as File | null;

    if (!dataJson) {
      return NextResponse.json({ error: 'Missing application data payload' }, { status: 400 });
    }

    if (!photoFile) {
      return NextResponse.json({ error: 'Candidate photograph is mandatory' }, { status: 400 });
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(dataJson);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON application payload' }, { status: 400 });
    }

    const validationResult = candidateApplicationSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      const issue = validationResult.error.errors[0];
      const message = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation error';
      return NextResponse.json({ error: message, details: validationResult.error.errors }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Photograph exceeds maximum allowed size (5MB)' }, { status: 400 });
    }

    const result = await submitApplication(
      validationResult.data,
      buffer,
      photoFile.name || 'candidate-photo.jpg'
    );

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: result.applicationId,
      candidateId: result.candidateId,
    });
  } catch (err: any) {
    console.error('Candidate submission error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit candidate application' },
      { status: 500 }
    );
  }
}
