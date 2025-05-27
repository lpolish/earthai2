import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow access to auth pages and API auth routes without authentication
  if (pathname.startsWith('/auth/') || 
      pathname.startsWith('/api/auth/') || 
      pathname === '/api/auth/health') {
    return NextResponse.next();
  }
  
  // For API routes that require authentication
  if (pathname.startsWith('/api/')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    console.log(`Middleware - API route: ${pathname}, token: ${token ? 'present' : 'missing'}`);
    
    if (!token) {
      // Return JSON error for API routes instead of redirecting
      console.log('Middleware - Returning 401 for API route');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('Middleware - Token found, allowing API request');
    return NextResponse.next();
  }
  
  // For all other routes (pages), allow access - pages will handle auth requirements
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
