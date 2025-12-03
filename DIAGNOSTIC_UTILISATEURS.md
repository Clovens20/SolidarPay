# 🔍 Diagnostic des Utilisateurs - SolidarPay

## 📋 Utilisateurs à Vérifier

1. **Admin Tontine** :
   - ID: `76223ba8-d868-4bc3-8363-93a20e60d34f`
   - Email: `claircl18@gmail.com`
   - Rôle attendu: `admin`

2. **Super Admin** :
   - ID: `cb289deb-9d0d-498c-ba0d-90f77fc58f4e`
   - Email: `clodenerc@yahoo.fr`
   - Rôle attendu: `super_admin`

3. **Membre** :
   - ID: `e4afdfa7-4699-49cc-b740-2e8bef97ce55`
   - Email: `Paulinacharles615@gmail.com`
   - Rôle attendu: `member`

## 🔧 Étape 1 : Exécuter le Diagnostic

### Dans Supabase SQL Editor :

1. **Ouvrez Supabase Dashboard** → **SQL Editor**
2. **Exécutez** le fichier `diagnostic-users.sql`
3. **Analysez les résultats** pour identifier les problèmes

## 🔍 Problèmes Courants et Solutions

### Problème 1 : Utilisateur existe dans `auth.users` mais pas dans `users`

**Symptôme** :
- Connexion Supabase réussie
- Erreur "User not found" dans l'application

**Solution** :
```sql
-- L'utilisateur existe dans auth.users mais pas dans users
-- Exécutez fix-users-connection.sql pour créer les enregistrements manquants
```

### Problème 2 : Rôle incorrect ou manquant

**Symptôme** :
- Connexion réussie
- Redirection incorrecte ou accès refusé

**Solution** :
```sql
-- Mettre à jour le rôle
UPDATE users 
SET role = 'admin'  -- ou 'super_admin' ou 'member'
WHERE id = 'votre-id-ici';
```

### Problème 3 : Email non confirmé dans Supabase Auth

**Symptôme** :
- Impossible de se connecter
- Message "Email not confirmed"

**Solution** :
1. **Dans Supabase Dashboard** :
   - Allez dans **Authentication** → **Users**
   - Trouvez l'utilisateur
   - Cliquez sur **...** → **Confirm email**

   OU

2. **Via SQL** (déconseillé en production) :
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW()
   WHERE email = 'email@example.com';
   ```

### Problème 4 : IDs ne correspondent pas

**Symptôme** :
- Utilisateur dans `auth.users` avec un ID
- Utilisateur dans `users` avec un ID différent

**Solution** :
```sql
-- Vérifier les correspondances
SELECT 
  au.id as auth_id,
  au.email,
  u.id as user_id,
  u.role
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email IN (
  'claircl18@gmail.com',
  'clodenerc@yahoo.fr',
  'Paulinacharles615@gmail.com'
);
```

### Problème 5 : Contrainte CHECK ne permet pas `super_admin`

**Symptôme** :
- Erreur lors de la mise à jour du rôle
- Message "violates check constraint"

**Solution** :
```sql
-- Vérifier la contrainte
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_role_check';

-- Si super_admin n'est pas inclus, exécutez :
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'member', 'super_admin'));
```

## 🔧 Étape 2 : Corriger les Problèmes

### Option A : Correction Automatique (Recommandé)

1. **Exécutez** `fix-users-connection.sql` dans Supabase SQL Editor
2. Ce script va :
   - Vérifier/corriger la contrainte de rôle
   - Créer les enregistrements manquants dans `users`
   - Mettre à jour les rôles
   - Vérifier les correspondances

### Option B : Correction Manuelle

Suivez les instructions ci-dessus pour chaque problème identifié.

## ✅ Étape 3 : Vérifier la Correction

### Après avoir exécuté les corrections, vérifiez :

```sql
-- Vérification complète
SELECT 
  u.id,
  u.email,
  u.role,
  u."fullName",
  au.email_confirmed_at,
  CASE 
    WHEN au.id IS NULL THEN '❌ Pas dans auth.users'
    WHEN u.id IS NULL THEN '❌ Pas dans users'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    WHEN u.role NOT IN ('admin', 'member', 'super_admin') THEN '❌ Rôle invalide'
    ELSE '✅ OK'
  END as statut
FROM users u
FULL OUTER JOIN auth.users au ON u.id = au.id
WHERE u.email IN (
  'claircl18@gmail.com',
  'clodenerc@yahoo.fr',
  'Paulinacharles615@gmail.com'
)
OR au.email IN (
  'claircl18@gmail.com',
  'clodenerc@yahoo.fr',
  'Paulinacharles615@gmail.com'
);
```

## 🔐 Étape 4 : Vérifier les Mots de Passe

Si les utilisateurs ne peuvent toujours pas se connecter :

1. **Dans Supabase Dashboard** :
   - Allez dans **Authentication** → **Users**
   - Trouvez l'utilisateur
   - Cliquez sur **...** → **Send password reset**

2. **OU réinitialiser le mot de passe** :
   - Dans l'interface Supabase
   - Utilisez "Reset password" pour envoyer un email de réinitialisation

## 📝 Checklist Complète

- [ ] ✅ Utilisateur existe dans `auth.users`
- [ ] ✅ Utilisateur existe dans `users`
- [ ] ✅ IDs correspondent entre `auth.users` et `users`
- [ ] ✅ Email est confirmé (`email_confirmed_at` n'est pas NULL)
- [ ] ✅ Rôle est correct (`admin`, `member`, ou `super_admin`)
- [ ] ✅ Contrainte CHECK permet `super_admin`
- [ ] ✅ Mot de passe est connu/fonctionne
- [ ] ✅ URLs de redirection sont configurées dans Supabase

## 🚨 Messages d'Erreur Courants

### "Accès réservé aux super administrateurs"
**Cause** : Rôle n'est pas `super_admin`
**Solution** : Mettre à jour le rôle dans la table `users`

### "User not found"
**Cause** : Utilisateur n'existe pas dans `users`
**Solution** : Créer l'enregistrement dans `users`

### "Invalid login credentials"
**Cause** : Mauvais email/mot de passe OU email non confirmé
**Solution** : Vérifier les identifiants ou confirmer l'email

### "Email not confirmed"
**Cause** : `email_confirmed_at` est NULL dans `auth.users`
**Solution** : Confirmer l'email dans Supabase Dashboard

## 🔗 Liens Utiles

- **Supabase Dashboard** : https://supabase.com/dashboard
- **SQL Editor** : Dashboard → SQL Editor
- **Authentication Users** : Dashboard → Authentication → Users

## 📞 Support

Si les problèmes persistent après avoir suivi ce guide :
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs Supabase (Dashboard → Logs)
3. Vérifiez que les variables d'environnement sont correctes

