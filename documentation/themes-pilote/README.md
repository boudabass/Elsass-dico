# Pilote du classement par thème (16-17/10/2026) : mis de côté

Décision de John (16/10) : classer les mots par thème avec l'IA (session
Opérateur), en ne lisant **que le français** et sa précision, jamais une
forme alsacienne (règle n° 1). Pilote de 300 lemmes seulement, puis mis de
côté le 17/10 : **rien n'est publié, rien n'est en base.**

- `tirage.py` : tirage rejouable (graine 20261016) parmi 25 311 lemmes
  distincts des attestations de la branche `data` (mot, expression,
  proverbe ; ni toponyme ni prénom).
- `pilote-themes.csv` : passe 1, 15 thèmes, règle « dans le doute, aucun ».
  68 thèmes posés, tous justes, mais 232 mots sur 300 sans thème (77 %).
- `pilote-themes-v2.csv` : passe 2, 19 thèmes (+ Sport et loisirs, École,
  Argent et commerce, Armée), doute réservé aux vrais conflits de sens.
  170 mots classés (57 %), 11 en doute. `resume-v2.txt` liste les 122
  changements.
- Relecture : environ 6 erreurs sur 170 (3 à 4 %) : « à votre santé » en
  Corps et santé (c'est un toast), « gangster » en Famille et gens, « lac
  glacière » en Maison et objets ; « largage » et « maintien » auraient dû
  rester en doute ; « rue latérale » en Transport est bancal.
- Les insultes ne prennent jamais le thème de leur sens littéral (« cochon
  (insulte) » n'est pas un animal) : elles ont leur filtre.

Question ouverte avant d'étendre aux 26 000 mots (environ 15 000 classés,
400 à 500 erreurs attendues) : tout relire, publier avec un signalement
« mauvais thème », ou publier seulement les thèmes nets (Animaux, Cuisine,
Vêtements, Sport, École, Argent, Armée) et relire les flous (Caractère,
Famille et gens, Fêtes et religion, à renommer « Religion et fêtes »).
Il faudra aussi une colonne en base (migration) et un fichier versionné
comme source de vérité.
