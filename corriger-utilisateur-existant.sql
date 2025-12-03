-- ====================================
-- CORRECTION INTELLIGENTE - Utilisateur Existant
-- Gère le cas où l'email existe déjà mais avec un mauvais ID
-- ====================================

-- ÉTAPE 1: DIAGNOSTIC
SELECT 
  '=== DIAGNOSTIC ===' as info,
  'auth.users' as source,
  id,
  email
FROM auth.users
WHERE email = 'clodenerc@yahoo.fr';

SELECT 
  'users' as source,
  id,
  email,
  role
FROM users
WHERE email = 'clodenerc@yahoo.fr';

-- ÉTAPE 2: SOLUTION SIMPLE - Mettre à jour le rôle de l'utilisateur existant
UPDATE users
SET 
  role = 'super_admin',
  "fullName" = COALESCE("fullName", 'Super Admin')
WHERE email = 'clodenerc@yahoo.fr';

-- ÉTAPE 3: Vérifier si l'ID correspond
DO $$
DECLARE
  auth_id UUID;
  user_id UUID;
BEGIN
  -- Récupérer l'ID de auth.users
  SELECT id INTO auth_id
  FROM auth.users
  WHERE email = 'clodenerc@yahoo.fr'
  LIMIT 1;
  
  -- Récupérer l'ID de users
  SELECT id INTO user_id
  FROM users
  WHERE email = 'clodenerc@yahoo.fr'
  LIMIT 1;
  
  -- Si les IDs sont différents, corriger
  IF auth_id IS NOT NULL AND user_id IS NOT NULL AND auth_id != user_id THEN
    RAISE NOTICE '⚠️ IDs différents ! Auth: %, User: %', auth_id, user_id;
    RAISE NOTICE 'Correction en cours...';
    
    -- Supprimer l'ancien avec mauvais ID
    DELETE FROM users WHERE id = user_id;
    
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
    
    RAISE NOTICE '✅ Corrigé avec le bon ID: %', auth_id;
  ELSIF auth_id = user_id THEN
    RAISE NOTICE '✅ IDs correspondent ! Rôle mis à jour.';
  END IF;
END $$;

-- ÉTAPE 4: VÉRIFICATION FINALE
SELECT 
  '=== ✅ RÉSULTAT ===' as info,
  au.id as auth_id,
  au.email,
  u.id as user_id,
  u.role,
  CASE 
    WHEN u.id = au.id AND u.role = 'super_admin' THEN '✅ PARFAIT - Connectez-vous maintenant !'
    WHEN u.id != au.id THEN '⚠️ IDs différents - Problème résolu ci-dessus'
    WHEN u.role != 'super_admin' THEN CONCAT('⚠️ Rôle: ', u.role)
    ELSE '⚠️ À vérifier'
  END as statut
FROM auth.users au
LEFT JOIN users u ON (
  u.email = 'clodenerc@yahoo.fr'
)
WHERE au.email = 'clodenerc@yahoo.fr';

