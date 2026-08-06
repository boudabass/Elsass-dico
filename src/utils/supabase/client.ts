import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

// Le verrou navigator.locks par défaut est conservé : il synchronise le
// rafraîchissement de session entre onglets. Il avait été neutralisé le
// 06/08/2026 pour débloquer des pages figées sur "Chargement...", mais la
// cause réelle était ailleurs — un appel Supabase à l'intérieur du callback
// onAuthStateChange, qui s'attendait lui-même (cf. auth-provider.tsx).
export function createClient() {
    return createBrowserClient(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
    )
}