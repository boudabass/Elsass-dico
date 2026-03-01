-- Supprimer les anciennes policies qui causent la récursion
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Tout le monde peut voir son propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;

-- Créer la fonction is_admin() pour casser la boucle
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Recréer les policies propres utilisant is_admin() et auth.uid()
CREATE POLICY "users_view_own_profile" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR is_admin()
);

CREATE POLICY "users_update_own_profile" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id
);
