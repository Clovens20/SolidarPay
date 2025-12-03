# 🔧 Résolution des Problèmes de Connexion - Utilisateurs

## 📋 Utilisateurs à Corriger

1. **Admin Tontine** : `claircl18@gmail.com` (ID: `76223ba8-d868-4bc3-8363-93a20e60d34f`)
2. **Super Admin** : `clodenerc@yahoo.fr` (ID: `cb289deb-9d0d-498c-ba0d-90f77fc58f4e`)
3. **Membre** : `Paulinacharles615@gmail.com` (ID: `e4afdfa7-4699-49cc-b740-2e8bef97ce55`)

## 🚀 Solution Rapide (3 étapes)

### Étape 1 : Diagnostic

Exécutez dans **Supabase SQL Editor** le fichier :
- `VERIFICATION_RAPIDE_USERS.sql` - Pour voir rapidement l'état

### Étape 2 : Correction Automatique

Exécutez dans **Supabase SQL Editor** le fichier :
- `fix-users-connection.sql` - Corrige automatiquement tous les problèmes

### Étape 3 : Vérification

Exécutez à nouveau `VERIFICATION_RAPIDE_USERS.sql` pour confirmer que tout est corrigé.

## 🔍 Problèmes Probables

### 1. Utilisateur manquant dans la table `users`

**Symptôme** : Connexion Supabase OK, mais erreur dans l'application

**Solution** : Le script `fix-users-connection.sql` crée automatiquement les enregistrements manquants.

### 2. Rôle incorrect

**Symptôme** : Accès refusé même après connexion

**Solution** : Le script met à jour automatiquement les rôles :
- `admin` pour l'admin tontine
- `super_admin` pour le super admin
- `member` pour le membre

### 3. Email non confirmé

**Symptôme** : Impossible de se connecter

**Solution** : Dans Supabase Dashboard :
1. Allez dans **Authentication** → **Users**
2. Trouvez l'utilisateur
3. Cliquez sur **...** → **Confirm email**

### 4. Contrainte CHECK ne permet pas `super_admin`

**Symptôme** : Erreur lors de la mise à jour du rôle

**Solution** : Le script `fix-users-connection.sql` corrige automatiquement la contrainte.

## 📝 Commandes SQL Manuelles (Si nécessaire)

Si vous préférez corriger manuellement :

```sql
-- 1. Corriger la contrainte
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'member', 'super_admin'));

-- 2. Admin Tontine
UPDATE users SET role = 'admin' 
WHERE email = 'claircl18@gmail.com' OR id = '76223ba8-d868-4bc3-8363-93a20e60d34f';

-- 3. Super Admin
UPDATE users SET role = 'super_admin' 
WHERE email = 'clodenerc@yahoo.fr' OR id = 'cb289deb-9d0d-498c-ba0d-90f77fc58f4e';

-- 4. Membre
UPDATE users SET role = 'member' 
WHERE email = 'Paulinacharles615@gmail.com' OR id = 'e4afdfa7-4699-49cc-b740-2e8bef97ce55';
```

## ✅ Vérification Finale

Après les corrections, vérifiez :

1. **Dans Supabase SQL Editor** :
   ```sql
   SELECT id, email, role FROM users 
   WHERE email IN (
     'claircl18@gmail.com',
     'clodenerc@yahoo.fr',
     'Paulinacharles615@gmail.com'
   );
   ```

2. **Tester la connexion** :
   - Admin Tontine : http://localhost:3000/admin-tontine
   - Super Admin : http://localhost:3000/admin/login
   - Membre : http://localhost:3000

## 🆘 Si ça ne fonctionne toujours pas

1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez que les emails sont confirmés dans Supabase Auth
3. Vérifiez que les mots de passe sont corrects
4. Consultez `DIAGNOSTIC_UTILISATEURS.md` pour plus de détails

