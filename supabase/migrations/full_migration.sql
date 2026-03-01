-- ============================================
-- MIGRATION 1: Table profiles avec rôles
-- ============================================

-- Création de la table profiles dans le schéma public
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Activation de la Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
ON public.profiles FOR SELECT TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les profils" ON public.profiles;
CREATE POLICY "Les administrateurs peuvent voir tous les profils" 
ON public.profiles FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id);

-- Fonction pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$;

-- Trigger pour exécuter la fonction après un insert dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- MIGRATION 2: Table app_settings
-- ============================================

-- Table app_settings (singleton)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  version TEXT DEFAULT '1.0.0',
  maintenance BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings"
ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify settings" ON public.app_settings;
CREATE POLICY "Only admins can modify settings"
ON public.app_settings FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO public.app_settings (version, maintenance) 
VALUES ('1.0.0', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MIGRATION 3: Créer profil pour utilisateurs existants
-- ============================================

-- Pour les utilisateurs déjà créés avant le trigger
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user' 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
