# 🔧 Solution : Utilisateur Introuvable - Super Admin

## 🔴 Problème

L'erreur "Utilisateur introuvable dans la base de données" signifie que :
- ✅ L'utilisateur existe dans `auth.users` (connexion Supabase réussie)
- ❌ L'utilisateur **n'existe pas** dans la table `users`

## 🔍 Cause

Lors de la connexion, le système :
1. Vérifie les identifiants dans Supabase Auth → ✅ Réussit
2. Cherche l'utilisateur dans la table `users` → ❌ Échoue (utilisateur absent)

## ✅ Solution Rapide

### Étape 1 : Exécuter le Script de Correction

Dans **Supabase SQL Editor**, exécutez :

```sql
-- Fichier : fix-super-admin-user.sql
```

Ce script va :
- Vérifier l'existence dans `auth.users`
- Vérifier l'existence dans `users`
- Créer l'utilisateur dans `users` s'il n'existe pas
- Mettre à jour le rôle à `super_admin`
- Vérifier la correspondance

### Étape 2 : Création Manuelle (Si le script ne fonctionne pas)

**Option A : Créer depuis auth.users**

```sql
-- Remplacer 'VOTRE_ID_AUTH' par l'ID réel de auth.users
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'fullName', 'Super Admin'),
  'super_admin',
  created_at
FROM auth.users
WHERE email = 'clodenerc@yahoo.fr'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.users.id
  );
```

**Option B : Créer avec l'ID exact**

```sql
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',
  'clodenerc@yahoo.fr',
  'Super Admin',
  'super_admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'super_admin',
  email = EXCLUDED.email;
```

## 📋 Vérification

Après avoir exécuté le script, vérifiez :

```sql
SELECT 
  u.id,
  u.email,
  u.role,
  u."fullName",
  CASE 
    WHEN u.role = 'super_admin' THEN '✅ Prêt'
    ELSE '⚠️ Rôle incorrect'
  END as statut
FROM users u
WHERE u.email = 'clodenerc@yahoo.fr'
   OR u.id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';
```

## 🔧 Si l'utilisateur n'existe pas dans auth.users

Si l'utilisateur n'existe même pas dans `auth.users`, vous devez :

1. **Créer l'utilisateur dans Supabase Auth Dashboard** :
   - Allez dans **Authentication** → **Users**
   - Cliquez sur **Add user**
   - Email : `clodenerc@yahoo.fr`
   - Mot de passe : (défini par vous)
   - **Auto Confirm User** : Activé ✅

2. **Puis exécutez le script** pour créer l'enregistrement dans `users`

## ✅ Après la Correction

1. Vérifiez que l'utilisateur existe dans `users` avec le rôle `super_admin`
2. Essayez de vous connecter à nouveau sur `/admin/login`
3. La connexion devrait fonctionner

## 🆘 Si ça ne fonctionne toujours pas

1. Vérifiez l'ID dans `auth.users` :
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'clodenerc@yahoo.fr';
   ```

2. Vérifiez l'ID dans `users` :
   ```sql
   SELECT id, email, role FROM users WHERE email = 'clodenerc@yahoo.fr';
   ```

3. Les IDs doivent correspondre exactement !

