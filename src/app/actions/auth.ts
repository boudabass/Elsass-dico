'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irdsoeamklkngxbgscom.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHNvZWFta2xrbmd4YmdzY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTQzNTcsImV4cCI6MjA4Mzk5MDM1N30.lcDopujYrmV6bvBOIOZzltl6TZcNB7wrbnsTlgl0hzk';

export async function signOutAction() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )

    await supabase.auth.signOut()
    redirect('/login')
}