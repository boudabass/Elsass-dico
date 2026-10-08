// Une destination ne se prend jamais telle quelle dans l'URL : sans ce contrôle,
// `?suite=https://ailleurs` ferait de la route de renouvellement une redirection
// ouverte, et un lien de phishing porterait notre domaine.
//
// Les navigateurs lisent `//ailleurs` et `/\ailleurs` comme des URL absolues. Et
// `?suite=/%09/site` passe la lecture naïve : les paramètres sont décodés, donc
// `%09` devient une tabulation, que le navigateur supprime dans une URL, et il
// lit `//site`. D'où trois garde-fous : aucun caractère de contrôle, aucun
// antislash, et une résolution qui doit rester sur notre origine.

const BASE = "https://elsass-dico.invalid"

export function destinationSure(suite: string | null): string {
  if (!suite || !suite.startsWith("/")) return "/"
  if (/[\u0000-\u001f\u007f\\]/.test(suite)) return "/"

  let url: URL
  try {
    url = new URL(suite, BASE)
  } catch {
    return "/"
  }
  if (url.origin !== new URL(BASE).origin) return "/"

  // La forme normalisée, jamais la chaîne brute. Un chemin qui commence par
  // `//` (par exemple `/./../..//site`) serait lu comme une URL absolue.
  const chemin = url.pathname + url.search + url.hash
  return chemin.startsWith("//") ? "/" : chemin
}
