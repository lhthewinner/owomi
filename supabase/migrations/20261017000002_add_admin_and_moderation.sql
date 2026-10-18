-- ==============================================================================
-- Migration Lot 12 : Rôle Administrateur, Modération et Statut des comptes
-- ==============================================================================

-- 1. Ajout des colonnes role, status et email à la table profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- 2. Index de performance pour le filtrage administrateur
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 3. Fonction sécurisée pour vérifier si l'utilisateur appelant est administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Politique de consultation des profils par les administrateurs
-- Les administrateurs peuvent lister tous les profils pour la modération
DROP POLICY IF EXISTS "Les administrateurs peuvent consulter tous les profils" ON public.profiles;
CREATE POLICY "Les administrateurs peuvent consulter tous les profils"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 5. Politique de mise à jour du statut par les administrateurs
DROP POLICY IF EXISTS "Les administrateurs peuvent modérer les profils" ON public.profiles;
CREATE POLICY "Les administrateurs peuvent modérer les profils"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- 6. Mise à jour de la fonction de création automatique de profil pour renseigner l'email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, firstname, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'firstname', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
