-- ====================================
-- CORRECTION DE L'UTILISATEUR SUPER ADMIN EXISTANT
-- Script pour mettre à jour l'utilisateur qui existe déjà
-- ====================================

-- ÉTAPE 1: VÉRIFIER L'ÉTAT ACTUEL
SELECT 
  '🔍 ÉTAT ACTUEL DANS users' as info,
  id,
  email,
  role,
  "fullName",
  "createdAt"
FROM users
WHERE email = 'clodenerc@yahoo.fr';

-- ÉTAPE 2: VÉRIFIER DANS auth.users
SELECT 
  '🔍 ÉTAT ACTUEL DANS auth.users' as info,
  id as auth_id,
  email,
  email_confirmed_at
FROM auth.users
WHERE email = 'clodenerc@yahoo.fr';

-- ÉTAPE 3: VÉRIFIER LA CORRESPONDANCE DES IDs
SELECT 
  '🔍 CORRESPONDANCE DES IDs' as info,
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.email as user_email,
  u.role,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs correspondent'
    WHEN au.id IS NULL THEN '❌ Pas dans auth.users'
    WHEN u.id IS NULL THEN '❌ Pas dans users'
    ELSE '⚠️ IDs DIFFÉRENTS - Problème !'
  END as statut
FROM auth.users au
FULL OUTER JOIN users u ON au.id = u.id
WHERE au.email = 'clodenerc@yahoo.fr' OR u.email = 'clodenerc@yahoo.fr';

-- ÉTAPE 4: CORRIGER SI L'ID EST DIFFÉRENT
-- Si l'email existe mais avec un ID différent, supprimer l'ancien et créer le bon
DO $$
DECLARE
  auth_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Trouver l'ID dans auth.users
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'clodenerc@yahoo.fr'
  LIMIT 1;
  
  -- Trouver l'ID dans users
  SELECT id INTO existing_user_id
  FROM users
  WHERE email = 'clodenerc@yahoo.fr'
  LIMIT 1;
  
  -- Si les IDs sont différents, corriger
  IF auth_user_id IS NOT NULL AND existing_user_id IS NOT NULL AND auth_user_id != existing_user_id THEN
    RAISE NOTICE '⚠️ IDs différents détectés ! Auth ID: %, User ID: %', auth_user_id, existing_user_id;
    RAISE NOTICE 'Suppression de l''ancien utilisateur avec mauvais ID...';
    
    -- Supprimer l'ancien utilisateur avec mauvais ID
    DELETE FROM users WHERE id = existing_user_id;
    
    -- Créer avec le bon ID
    INSERT INTO users (id, email, "fullName", role, "createdAt")
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'fullName', 'Super Admin'),
      'super_admin',
      created_at
    FROM auth.users
    WHERE id = auth_user_id;
    
    RAISE NOTICE '✅ Utilisateur corrigé avec le bon ID';
  ELSIF auth_user_id IS NOT NULL AND existing_user_id IS NULL THEN
    -- L'utilisateur n'existe pas dans users, le créer
    RAISE NOTICE 'Création de l''utilisateur dans users...';
    INSERT INTO users (id, email, "fullName", role, "createdAt")
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'fullName', 'Super Admin'),
      'super_admin',
      created_at
    FROM auth.users
    WHERE id = auth_user_id;
    RAISE NOTICE '✅ Utilisateur créé';
  ELSIF auth_user_id IS NULL THEN
    RAISE NOTICE '❌ Utilisateur introuvable dans auth.users !';
  END IF;
END $$;

-- ÉTAPE 5: METTRE À JOUR LE RÔLE (peu importe l'ID)
UPDATE users
SET 
  role = 'super_admin',
  "fullName" = COALESCE("fullName", 'Super Admin')
WHERE email = 'clodenerc@yahoo.fr'
  AND role != 'super_admin';

-- ÉTAPE 6: S'ASSURER QUE L'ID CORRESPOND À auth.users
-- Si l'utilisateur existe avec un ID différent, le supprimer et recréer
DO $$
DECLARE
  auth_id UUID;
  user_id UUID;
BEGIN
  SELECT id INTO auth_id FROM auth.users WHERE email = 'clodenerc@yahoo.fr' LIMIT 1;
  SELECT id INTO user_id FROM users WHERE email = 'clodenerc@yahoo.fr' LIMIT 1;
  
  IF auth_id IS NOT NULL AND user_id IS NOT NULL AND auth_id != user_id THEN
    -- Supprimer l'ancien
    DELETE FROM users WHERE email = 'clodenerc@yahoo.fr' AND id != auth_id;
    
    -- Créer avec le bon ID
    INSERT INTO users (id, email, "fullName", role, "createdAt")
    SELECT 
      id,
      email,
      'Super Admin',
      'super_admin',
      created_at
    FROM auth.users
    WHERE id = auth_id
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin';
  END IF;
END $$;

-- ÉTAPE 7: VÉRIFICATION FINALE
SELECT 
  '✅ VÉRIFICATION FINALE' as info,
  u.id,
  u.email,
  u.role,
  u."fullName",
  au.id as auth_id,
  CASE 
    WHEN u.id = au.id AND u.role = 'super_admin' THEN '✅ PARFAIT - Prêt pour connexion'
    WHEN u.id = au.id AND u.role != 'super_admin' THEN CONCAT('⚠️ Rôle incorrect: ', u.role)
    WHEN u.id != au.id THEN '⚠️ IDs différents'
    WHEN au.id IS NULL THEN '❌ Pas dans auth.users'
    WHEN u.id IS NULL THEN '❌ Pas dans users'
    ELSE '⚠️ À vérifier'
  END as statut
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'clodenerc@yahoo.fr';

-- Message final
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Vérifiez les résultats de l''ÉTAPE 7 ci-dessus.';
  RAISE NOTICE 'Si le statut est "✅ PARFAIT", vous pouvez vous connecter maintenant !';
  RAISE NOTICE '';
END $$;

