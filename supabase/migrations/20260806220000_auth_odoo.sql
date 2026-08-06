-- ============================================
-- Authentification adossée à Odoo + rôle contributeur
-- ============================================
-- Odoo devient l'autorité sur les mots de passe, Supabase reste l'autorité
-- sur les sessions et les rôles. odoo_uid matérialise le lien entre les deux
-- annuaires : l'e-mail sert de clé de correspondance au premier login, mais
-- il peut changer côté Odoo, d'où la conservation de l'identifiant numérique.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS odoo_uid INTEGER UNIQUE;

COMMENT ON COLUMN public.profiles.odoo_uid IS
  'Identifiant du compte portail Odoo correspondant, renseigné au premier login. Le rôle n''est jamais dérivé d''Odoo : il est géré ici.';

-- ============================================
-- Troisième rôle : contributeur
-- ============================================
-- Comble l'écart entre la documentation (qui prévoyait un rôle intermédiaire)
-- et la contrainte réelle, restée binaire user/admin.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'contributeur', 'admin'));

-- Même idiome que public.is_admin() (cf. 01_fix_profiles_rls.sql) : passer par
-- une fonction SECURITY DEFINER évite la récursion RLS sur profiles.
CREATE OR REPLACE FUNCTION public.is_contributeur()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'contributeur'
  );
$$;

-- ============================================
-- Policies contributeur sur entrees
-- ============================================
-- Un contributeur propose et corrige, mais ne valide pas : le passage à
-- statut='valide' reste réservé aux admins (règle 4 de CLAUDE.md, rien ne
-- passe en production sans validation humaine).

-- Lecture de toutes les entrées, y compris celles encore à valider.
CREATE POLICY "contributeurs_lecture_entrees"
ON public.entrees FOR SELECT TO authenticated
USING (public.is_contributeur());

CREATE POLICY "contributeurs_creation_entrees"
ON public.entrees FOR INSERT TO authenticated
WITH CHECK (public.is_contributeur() AND statut <> 'valide');

-- Une entrée déjà validée n'est plus modifiable par un contributeur, et il ne
-- peut pas non plus faire passer une entrée à l'état validé.
CREATE POLICY "contributeurs_modification_entrees"
ON public.entrees FOR UPDATE TO authenticated
USING (public.is_contributeur() AND statut <> 'valide')
WITH CHECK (public.is_contributeur() AND statut <> 'valide');
