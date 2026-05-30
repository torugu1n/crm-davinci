import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const parts = host.split('.');
  let subdomain = '';

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'vtecsolutions.online';
  const basePartsCount = baseDomain.split('.').length;

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      subdomain = parts[0];
    }
  } else if (host.includes(baseDomain)) {
    if (parts.length > basePartsCount) {
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
