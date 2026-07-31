import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
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

    const { data: { user } } = await supabase.auth.getUser()

    // Chemins publics
    const isPublicPath =
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/api/auth')

    // Si pas de user et pas public -> login
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Protection de la zone Admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            // Si pas admin, retour à l'accueil
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return response
}