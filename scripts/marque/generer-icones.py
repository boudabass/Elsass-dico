# Génère les icônes de l'app (favicon, écran d'accueil iOS, manifeste PWA).
# Le « E » est celui de la signature The Elsassisch (police Azimut), blanc sur
# le rouge du logo (#a7070d, cf. globals.css). Rejouable :
#   python3 scripts/marque/generer-icones.py   (demande Pillow)
from PIL import Image, ImageDraw, ImageFont

ROUGE = (0xA7, 0x07, 0x0D)
POLICE = "src/app/fonts/Azimut-Regular.otf"


def icone(taille, part):
    """Carré rouge plein, E centré dont la hauteur vaut `part` du côté."""
    im = Image.new("RGB", (taille, taille), ROUGE)
    d = ImageDraw.Draw(im)
    ref = ImageFont.truetype(POLICE, 100)
    l, t, r, b = d.textbbox((0, 0), "E", font=ref)
    f = ImageFont.truetype(POLICE, round(100 * part * taille / (b - t)))
    l, t, r, b = d.textbbox((0, 0), "E", font=f)
    d.text(((taille - (r - l)) / 2 - l, (taille - (b - t)) / 2 - t), "E", font=f, fill="white")
    return im


# Onglet du navigateur : l'E occupe plus de place, sinon illisible en 16 px.
icone(256, 0.72).save("src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
icone(512, 0.58).save("src/app/icon.png", optimize=True)
# iOS arrondit lui-même les coins et refuse la transparence.
icone(180, 0.58).save("src/app/apple-icon.png", optimize=True)
icone(192, 0.58).save("public/icones/icone-192.png", optimize=True)
icone(512, 0.58).save("public/icones/icone-512.png", optimize=True)
# Android découpe l'icône « masquable » en cercle ou en goutte : l'E doit tenir
# dans le cercle central de 80 %.
icone(512, 0.42).save("public/icones/icone-masquable-512.png", optimize=True)
