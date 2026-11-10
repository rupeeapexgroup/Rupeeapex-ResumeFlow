import { NextRequest, NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation';
import { registerAdmin, getSignupStatus, MAX_ADMIN_ACCOUNTS } from '@/services/adminService';
import { setSessionCookie } from '@/lib/auth';

export async function GET() {
  try {
    const status = await getSignupStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    console.error('Error checking signup status:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve registration status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Fast check status first
    const status = await getSignupStatus();
    if (!status.allowed) {
      return NextResponse.json(
        {
          error: `Registration closed: The maximum limit of ${MAX_ADMIN_ACCOUNTS} accounts has been reached. Additional sign-ups are permanently disabled.`,
          allowed: false,
          totalAccounts: status.totalAccounts,
          maxAccounts: MAX_ADMIN_ACCOUNTS,
        },
        { status: 403 }
      );
    }

    // 2. Validate input schema
    const body = await req.json();
    const parseResult = signupSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid registration details';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { username, password } = parseResult.data;

    // 3. Register admin (strictly enforces max 2 accounts)
    const result = await registerAdmin(username, password);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { error: result.error || 'Failed to complete registration' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Account created and secured successfully.',
      user: { username: result.username, role: 'HR_ADMIN' },
    });

    setSessionCookie(response, result.token);
    return response;
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during registration' },
      { status: 500 }
    );
  }
}

