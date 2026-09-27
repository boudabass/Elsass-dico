-- Un membre peut créer un mot français (décision de John, 27/09/2026),
-- toujours avec sa première forme alsacienne. `cree_par` distingue ce mot d'un
-- lemme dérivé des sources : l'admin les liste, et l'export des contributions
-- les recrée à la reconstruction de la base.
--
-- SET NULL comme `variantes.cree_par` : supprimer un compte anonymise ses mots
-- sans les effacer (CGU, article 9). Additive : le code de `main` l'ignore.

ALTER TABLE "lemmes" ADD COLUMN "cree_par" TEXT;

ALTER TABLE "lemmes" ADD CONSTRAINT "lemmes_cree_par_fkey"
  FOREIGN KEY ("cree_par") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- `par_membre` survit à l'anonymisation, `cree_par` non : c'est lui qui dit à
-- l'export qu'un mot est à recréer, et à l'admin qu'il ne vient d'aucune source.
ALTER TABLE "lemmes" ADD COLUMN "par_membre" BOOLEAN NOT NULL DEFAULT false;

-- Un mot de membre a eu un auteur à sa création ; l'inverse n'est pas exigé
-- (auteur parti = cree_par NULL, par_membre reste vrai).
ALTER TABLE "lemmes" ADD CONSTRAINT "chk_lemme_auteur_membre" CHECK (
  "cree_par" IS NULL OR "par_membre"
);

CREATE INDEX "lemmes_par_membre_idx" ON "lemmes"("par_membre");
