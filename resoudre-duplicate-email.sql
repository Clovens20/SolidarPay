-- ====================================
-- RÉSOLUTION DU CONFLIT D'EMAIL - Super Admin
-- L'utilisateur existe déjà, il faut corriger l'ID ou le rôle
-- ====================================

-- ÉTAPE 1: DIAGNOSTIC COMPLET
SELECT 
  '=== DIAGNOSTIC ===' as section,
  'users' as table_name,
  id,
  email,
  role,
  "fullName"
FROM users
WHERE email = 'clodenerc@yahoo.fr'
   OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- Vérifier dans auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at
FROM auth.users
WHERE email = 'clodenerc@yahoo.fr'
   OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- ÉTAPE 2: TROUVER L'ID RÉEL DANS auth.users
-- (Nous allons l'utiliser pour corriger)
DO $$
DECLARE
  auth_id UUID;
  existing_id UUID;
  email_exists BOOLEAN;
BEGIN
  -- Trouver l'ID dans auth.users
  SELECT id INTO auth_id
  FROM auth.users
  WHERE email = 'clodenerc@yahoo.fr'
  LIMIT 1;
  
  -- Trouver l'ID existant dans users
  SELECT id INTO existing_id
  FROM users
  WHERE email = 'clodenerc@yahoo.fr'
  LIMIT 1;
  
  IF auth_id IS NULL THEN
    RAISE NOTICE '❌ Utilisateur introuvable dans auth.users !';
    RAISE NOTICE 'Vous devez d''abord créer l''utilisateur dans Supabase Auth Dashboard.';
    RETURN;
  END IF;
  
  IF existing_id IS NULL THEN
    RAISE NOTICE 'L''utilisateur n''existe pas dans users, création...';
    -- Créer avec le bon ID depuis auth.users
    INSERT INTO users (id, email, "fullName", role, "createdAt")
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'fullName', 'Super Admin'),
      'super_admin',
      created_at
    FROM auth.users
    WHERE id = auth_id;
    RAISE NOTICE '✅ Utilisateur créé avec ID: %', auth_id;
    RETURN;
  END IF;
  
  -- Si les IDs correspondent, juste mettre à jour le rôle
  IF auth_id = existing_id THEN
    RAISE NOTICE '✅ IDs correspondent ! Mise à jour du rôle seulement...';
    UPDATE users
    SET role = 'super_admin',
        "fullName" = COALESCE("fullName", 'Super Admin')
    WHERE id = existing_id;
    RAISE NOTICE '✅ Rôle mis à jour à super_admin';
    RETURN;
  END IF;
  
  -- Si les IDs sont différents, c'est le problème !
  IF auth_id != existing_id THEN
    RAISE NOTICE '⚠️ PROBLÈME: IDs différents !';
    RAISE NOTICE 'Auth ID: %, User ID: %', auth_id, existing_id;
    RAISE NOTICE 'Suppression de l''ancien et création avec le bon ID...';
    
    -- Supprimer l'ancien utilisateur (avec mauvais ID)
    DELETE FROM users WHERE id = existing_id;
    RAISE NOTICE 'Ancien utilisateur supprimé (ID: %)', existing_id;
    
    -- Créer avec le bon ID
    INSERT INTO users (id, email, "fullName", role, "createdAt")
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'fullName', 'Super Admin'),
      'super_admin',
      created_at
    FROM auth.users
    WHERE id = auth_id;
    
    RAISE NOTICE '✅ Nouvel utilisateur créé avec le bon ID: %', auth_id;
    RETURN;
  END IF;
  
END $$;

-- ÉTAPE 3: METTRE À JOUR LE RÔLE (peu importe la situation)
UPDATE users
SET 
  role = 'super_admin',
  "fullName" = COALESCE("fullName", 'Super Admin')
WHERE email = 'clodenerc@yahoo.fr';

-- ÉTAPE 4: VÉRIFICATION FINALE
SELECT 
  '=== ✅ VÉRIFICATION FINALE ===' as section,
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.email as user_email,
  u.role,
  u."fullName",
  CASE 
    WHEN u.id IS NULL THEN '❌ Manquant dans users'
    WHEN au.id IS NULL THEN '❌ Manquant dans auth.users'
    WHEN u.id = au.id AND u.role = 'super_admin' THEN '✅ PARFAIT - Prêt !'
    WHEN u.id = au.id AND u.role != 'super_admin' THEN CONCAT('⚠️ Rôle incorrect: ', u.role)
    WHEN u.id != au.id THEN '⚠️ IDs différents'
    ELSE '⚠️ Problème'
  END as statut
FROM auth.users au
LEFT JOIN users u ON (
  u.email = 'clodenerc@yahoo.fr' 
  OR u.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e'
)
WHERE au.email = 'clodenerc@yahoo.fr'
   OR au.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Vérifiez les résultats de l''ÉTAPE 4 ci-dessus.';
  RAISE NOTICE 'Si le statut est "✅ PARFAIT", vous pouvez vous connecter !';
  RAISE NOTICE '';
END $$;

