// Config Tailwind dédiée à design-sync.
//
// Les composants shadcn de ce dépôt ne portent AUCUN style propre : tout passe
// par des classes utilitaires, générées à la compilation depuis les fichiers
// scannés. Un `cssEntry` pointé sur src/app/globals.css livrerait donc les
// tokens sans une seule utilitaire, et toutes les cartes rendraient nues.
//
// D'où ce fichier : même thème que la config du site (import ci-dessous, jamais
// une copie — une copie divergerait en silence), mais un `content` élargi aux
// previews écrites pour le sync, sans quoi les classes qu'elles seules
// utilisent manqueraient au CSS produit.
//
//   npx tailwindcss -c .design-sync/tailwind.sync.ts \
//     -i src/app/globals.css -o .design-sync/compiled.css
//
// À relancer après toute écriture de preview, avant le rebuild du convertisseur.
import type { Config } from "tailwindcss";
import base from "../tailwind.config";

export default {
  ...base,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./.design-sync/previews/**/*.{ts,tsx}",
  ],
} satisfies Config;
