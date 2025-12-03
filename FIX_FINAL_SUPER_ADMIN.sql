-- ====================================
-- FIX FINAL - Super Admin (Email Déjà Existant)
-- ====================================

-- ÉTAPE 1: Mettre à jour le rôle de l'utilisateur existant
UPDATE users
SET 
  role = 'super_admin',
  "fullName" = COALESCE("fullName", 'Super Admin')
WHERE email = 'clodenerc@yahoo.fr';

-- ÉTAPE 2: Vérifier et corriger l'ID si nécessaire
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
  
  -- Récupérer l'ID actuel dans users
  SELECT id INTO user_id
  FROM users
  WHERE email = 'clodenerc@yahoo.fr'
  LIMIT 1;
  
  -- Si les IDs sont différents, corriger
  IF auth_id IS NOT NULL AND user_id IS NOT NULL AND auth_id != user_id THEN
    -- Supprimer l'ancien avec mauvais ID
    DELETE FROM users WHERE id = user_id;
    
    -- Recréer avec le bon ID
    INSERT INTO users (id, email, "fullName", role, "createdAt")
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'fullName', 'Super Admin'),
      'super_admin',
      created_at
    FROM auth.users
    WHERE id = auth_id;
  END IF;
END $$;

-- ÉTAPE 3: Vérification finale
SELECT 
  '=== ✅ RÉSULTAT ===' as info,
  u.id,
  u.email,
  u.role,
  CASE 
    WHEN u.id = au.id AND u.role = 'super_admin' THEN '✅ PARFAIT - Prêt pour connexion !'
    WHEN u.role != 'super_admin' THEN '⚠️ Rôle non corrigé'
    ELSE '⚠️ Vérifiez manuellement'
  END as statut
FROM auth.users au
JOIN users u ON u.email = au.email
WHERE au.email = 'clodenerc@yahoo.fr';

