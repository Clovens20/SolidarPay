-- SolidarPay — Création automatique de public.users à l’inscription Auth
-- Exécuter une fois dans Supabase → SQL Editor (même projet que l’app).
-- Effet : la ligne profil est créée dans Postgres (hors PostgREST), donc plus d’échec
-- PGRST002 après un signUp réussi ni d’e-mail de confirmation sans ligne users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_country TEXT;
  v_phone TEXT;
BEGIN
  v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'member');
  IF v_role NOT IN ('member', 'admin') THEN
    v_role := 'member';
  END IF;

  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'fullName'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    SPLIT_PART(NEW.email, '@', 1),
    'Utilisateur'
  );

  v_country := NULLIF(UPPER(TRIM(NEW.raw_user_meta_data->>'country')), '');
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  INSERT INTO public.users (id, email, "fullName", phone, country, role)
  VALUES (NEW.id, NEW.email, v_full_name, v_phone, v_country, v_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "fullName" = EXCLUDED."fullName",
    phone = EXCLUDED.phone,
    country = COALESCE(EXCLUDED.country, users.country),
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
