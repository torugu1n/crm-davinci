import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const parts = host.split('.');
  let subdomain = '';

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      subdomain = parts[0];
    }
  } else if (host.includes('vtecsolutions.online')) {
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  } else {
    // Custom domain
    subdomain = host;
  }

  const response = NextResponse.next();
  if (subdomain && !['www', 'app', 'localhost'].includes(subdomain)) {
    response.headers.set('x-tenant-subdomain', subdomain);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
