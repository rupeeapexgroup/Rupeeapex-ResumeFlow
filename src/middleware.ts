import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'resumeflow_session';

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'resumeflow_rupeeapex_super_secure_jwt_session_secret_32chars!';
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect HR / Admin web routes and API routes
  const isHrWebRoute = pathname.startsWith('/admin') || pathname.startsWith('/hr');
  const isHrApiRoute = pathname.startsWith('/api/candidates') || pathname.startsWith('/api/admin');

  if (isHrWebRoute || isHrApiRoute) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    let isAuthenticated = false;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, getSessionSecret());
        if (payload && payload.role === 'HR_ADMIN') {
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      if (isHrApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized: Valid HR authentication session required.' },
          { status: 401 }
        );
      }

      // Redirect unauthenticated visitors attempting to access HR dashboard or candidates to /login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/hr/:path*',
    '/api/candidates/:path*',
    '/api/admin/:path*',
  ],
};

