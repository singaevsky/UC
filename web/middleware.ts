import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const roleRoutes: Record<string, string[]> = {
  confectioner: ['/dashboard/confectioner'],
  manager: ['/dashboard/manager'],
  supervisor: ['/dashboard/supervisor'],
  admin: ['/dashboard/supervisor', '/admin']
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Проверяем доступ к дашбордам
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/dashboard/')) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const userRole = profile.role as string;
    const dashboardPath = pathname.split('/')[2]; // 'confectioner', 'manager', etc.

    // Проверяем доступ к конкретному дашборду
    if (dashboardPath) {
      const allowedRoles = Object.keys(roleRoutes).filter(role =>
        roleRoutes[role].some(route => pathname.startsWith(route))
      );

      if (!allowedRoles.includes(userRole) && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/' + userRole, req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
