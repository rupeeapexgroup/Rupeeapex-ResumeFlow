import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { loginAdmin } from '@/services/adminService';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { username, password } = parseResult.data;
    const loginResult = await loginAdmin(username, password);

    if (!loginResult.success || !loginResult.token) {
      return NextResponse.json(
        { error: loginResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { username, role: 'HR_ADMIN' },
    });

    setSessionCookie(response, loginResult.token);
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during login' },
      { status: 500 }
    );
  }
}
