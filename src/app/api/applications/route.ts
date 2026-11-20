import { NextRequest, NextResponse } from 'next/server';
import { candidateApplicationSchema } from '@/lib/validation';
import { submitApplication } from '@/services/candidateService';
import { validateImageMagicBytes, validateResumeMagicBytes } from '@/lib/storage';

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
    const resumeFile = formData.get('resume') as File | null;

    if (!dataJson) {
      return NextResponse.json({ error: 'Missing application data payload' }, { status: 400 });
    }

    if (!photoFile) {
      return NextResponse.json({ error: 'Candidate photograph is mandatory' }, { status: 400 });
    }

    if (!resumeFile || resumeFile.size === 0) {
      return NextResponse.json(
        { error: 'Resume upload is mandatory. Please upload your resume in PDF, DOC, or DOCX format (Max 5 MB).' },
        { status: 400 }
      );
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

    // Pre-check file size before reading full buffer
    const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB = 5,242,880 bytes
    if (photoFile.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: 'Photo size exceeds the maximum allowed limit of 5 MB. Please select an image smaller than or equal to 5 MB.' },
        { status: 413 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: 'Photo size exceeds the maximum allowed limit of 5 MB. Please select an image smaller than or equal to 5 MB.' },
        { status: 413 }
      );
    }

    // Validate real photo content via magic bytes (don't trust client-supplied MIME or extension alone)
    const { isValid } = validateImageMagicBytes(buffer);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid photograph format. Please upload a genuine JPG, JPEG, PNG, or WEBP image file.' },
        { status: 400 }
      );
    }

    // Validate Resume file size & format
    const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
    if (resumeFile.size > MAX_RESUME_BYTES) {
      return NextResponse.json(
        { error: 'Resume size exceeds the maximum allowed limit of 5 MB. Please select a file smaller than or equal to 5 MB.' },
        { status: 413 }
      );
    }

    const resumeArrayBuffer = await resumeFile.arrayBuffer();
    const resumeBuffer = Buffer.from(resumeArrayBuffer);

    if (resumeBuffer.length > MAX_RESUME_BYTES) {
      return NextResponse.json(
        { error: 'Resume size exceeds the maximum allowed limit of 5 MB. Please select a file smaller than or equal to 5 MB.' },
        { status: 413 }
      );
    }

    const { isValid: isResumeValid } = validateResumeMagicBytes(resumeBuffer, resumeFile.name);
    if (!isResumeValid) {
      return NextResponse.json(
        { error: 'Invalid resume format. Only PDF, DOC, and DOCX documents up to 5 MB are allowed.' },
        { status: 400 }
      );
    }

    const result = await submitApplication(
      validationResult.data,
      buffer,
      photoFile.name || 'candidate-photo.jpg',
      resumeBuffer,
      resumeFile.name || 'resume.pdf'
    );

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: result.applicationId,
      candidateId: result.candidateId,
    });
  } catch (err: any) {
    console.error('Candidate submission error:', err);
    const isConnErr =
      /ECONNREFUSED|ServerSelection|timed out|buffering timed out/i.test(err?.name || '') ||
      /ECONNREFUSED|server selection|timed out|buffering timed out/i.test(err?.message || '');
    const errorMessage = isConnErr
      ? 'Database connection unavailable. Please ensure MongoDB is running (e.g. run "npm run db" in a separate terminal).'
      : err.message || 'Failed to submit candidate application';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

