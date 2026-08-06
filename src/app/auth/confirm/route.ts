import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Point d'entrée des liens d'invitation et de réinitialisation. Le jeton est
// vérifié côté serveur (verifyOtp), ce qui pose les cookies de session avant
// la redirection : l'utilisateur arrive donc authentifié sur /set-password et
// peut définir son mot de passe.
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/dashboard'

    if (!token_hash || !type) {
        return NextResponse.redirect(new URL('/login?erreur=lien_invalide', request.url))
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (error) {
        console.warn(`[Auth Confirm] Vérification échouée: ${error.message}`)
        return NextResponse.redirect(new URL('/login?erreur=lien_expire', request.url))
    }

    // `next` provient de nos propres liens, mais on force un chemin relatif
    // pour qu'un lien trafiqué ne puisse pas rediriger vers un site externe.
    const destination = next.startsWith('/') ? next : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
}
