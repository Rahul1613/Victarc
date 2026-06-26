import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required to keep auth working
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Query user plan from database if user is logged in
  let userPlan = 'demo'
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile) {
        userPlan = profile.plan || 'demo'
      }
    } catch (e) {
      console.error('Error reading plan in middleware:', e)
    }
  }

  const publicPaths = ['/login', '/register', '/terms', '/privacy', '/refund', '/api']
  const isPublic = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path) || request.nextUrl.pathname === '/'
  )

  const protectedPaths = ['/dashboard', '/profile']
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // If user has paid plan -> allow full access
  if (userPlan === 'basic' || userPlan === 'premium') {
    if (request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Logged out or demo user redirects
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
