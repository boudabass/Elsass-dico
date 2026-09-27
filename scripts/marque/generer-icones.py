# Génère les icônes de l'app (favicon, écran d'accueil iOS, manifeste PWA).
# Un carré de quatre lettres (décision de John, 27/09/2026) :
#   T E   The Elsassisch
#   E D   Elsass Dico
# Un « E » seul ne distinguait pas le dico des autres projets elsass-*.
# Police Azimut (celle de la signature), blanc sur le rouge du logo (#a7070d,
# cf. globals.css). Rejouable :
#   python3 scripts/marque/generer-icones.py   (demande Pillow)
from PIL import Image, ImageDraw, ImageFont

ROUGE = (0xA7, 0x07, 0x0D)
POLICE = "src/app/fonts/Azimut-Regular.otf"
LIGNES = ("TE", "ED")


def icone(taille, part):
    """Carré rouge plein ; le bloc de lettres occupe `part` du côté."""
    # Dessin à 4× puis réduction : les empattements restent nets en petit.
    grand = taille * 4
    im = Image.new("RGB", (grand, grand), ROUGE)
    d = ImageDraw.Draw(im)
    bloc = part * grand
    cellule = bloc / 2
    # Hauteur de capitale mesurée sur « E » : même corps pour les 4 lettres.
    ref = ImageFont.truetype(POLICE, 100)
    _, t, _, b = d.textbbox((0, 0), "E", font=ref)
    f = ImageFont.truetype(POLICE, round(100 * cellule * 0.78 / (b - t)))
    _, t, _, b = d.textbbox((0, 0), "E", font=f)
    haut_capitale = b - t
    origine = (grand - bloc) / 2
    for i, ligne in enumerate(LIGNES):
        for j, lettre in enumerate(ligne):
            l, _, r, _ = d.textbbox((0, 0), lettre, font=f)
            cx = origine + cellule * (j + 0.5)
            cy = origine + cellule * (i + 0.5)
            d.text((cx - (r - l) / 2 - l, cy - haut_capitale / 2 - t), lettre, font=f, fill="white")
    return im.resize((taille, taille), Image.LANCZOS)


icone(256, 0.84).save("src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
icone(512, 0.66).save("src/app/icon.png", optimize=True)
# iOS arrondit lui-même les coins et refuse la transparence.
icone(180, 0.66).save("src/app/apple-icon.png", optimize=True)
icone(192, 0.66).save("public/icones/icone-192.png", optimize=True)
icone(512, 0.66).save("public/icones/icone-512.png", optimize=True)
# Android découpe l'icône « masquable » en cercle ou en goutte : le bloc doit
# tenir dans le cercle central de 80 %, donc sa diagonale aussi.
icone(512, 0.54).save("public/icones/icone-masquable-512.png", optimize=True)
