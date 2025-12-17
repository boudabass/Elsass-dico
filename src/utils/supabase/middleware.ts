import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create the Supabase Client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    // This validates the user token.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    console.log(`[Middleware] Path: ${request.nextUrl.pathname} | User: ${user ? 'LOGGED IN' : 'GUEST'}`);

    // PROTECTION LOGIC
    // Explicitly define public paths
    const isPublicPath =
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/api/auth')

    // If NO USER and NOT PUBLIC -> Redirect to Landing ( / )
    if (!user && !isPublicPath) {
        console.log(`[Middleware] Access Denied. Redirecting to /`);
        return NextResponse.redirect(new URL('/', request.url))
    }

    // If USER and LOGIN Page -> Redirect to Dashboard
    if (user && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}
