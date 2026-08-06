import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

export function createClient() {
    return createBrowserClient(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
        {
            auth: {
                // Le verrou navigator.locks par défaut sert à synchroniser le
                // rafraîchissement de session entre onglets. En pratique il
                // peut rester bloqué (onglet précédent non refermé proprement)
                // et fait alors pendre indéfiniment getSession()/getUser(),
                // sans même émettre de requête réseau. On le désactive : le
                // coût (rafraîchissements concurrents entre onglets) est
                // largement inférieur au risque de page bloquée sur "Chargement...".
                lock: (_name, _acquireTimeout, fn) => fn(),
            },
        }
    )
}