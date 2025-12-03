# 🔧 Solution Simple : Corriger le Super Admin

## 🔴 Le Problème

Vous avez cette erreur :
```
duplicate key value violates unique constraint "users_email_key"
Key (email)=(clodenerc@yahoo.fr) already exists.
```

**Cela signifie** : L'utilisateur existe déjà dans `users`, mais probablement avec un **mauvais ID** ou un **mauvais rôle**.

## ✅ Solution en 1 Étape

### Exécuter le Script de Correction

Dans **Supabase SQL Editor**, exécutez :

```
resoudre-duplicate-email.sql
```

Ce script va :
1. ✅ Vérifier l'état actuel
2. ✅ Trouver l'ID correct dans `auth.users`
3. ✅ Supprimer l'ancien utilisateur avec mauvais ID
4. ✅ Créer avec le bon ID
5. ✅ Mettre le rôle à `super_admin`

## 📋 Alternative : Correction Manuelle Simple

Si vous préférez, exécutez ces 3 commandes SQL une par une :

### 1. Vérifier l'ID réel dans auth.users
```sql
SELECT id, email FROM auth.users 
WHERE email = 'clodenerc@yahoo.fr';
```

### 2. Supprimer l'ancien utilisateur (si ID différent)
```sql
DELETE FROM users WHERE email = 'clodenerc@yahoo.fr';
```

### 3. Créer avec le bon ID (remplacer VOTRE_ID par l'ID trouvé à l'étape 1)
```sql
INSERT INTO users (id, email, "fullName", role, "createdAt")
SELECT 
  id,
  email,
  'Super Admin',
  'super_admin',
  created_at
FROM auth.users
WHERE email = 'clodenerc@yahoo.fr';
```

### 4. Vérifier
```sql
SELECT id, email, role FROM users 
WHERE email = 'clodenerc@yahoo.fr';
```

Vous devriez voir `role = 'super_admin'`.

## ✅ Résultat Attendu

Après l'exécution :
- ✅ L'utilisateur existe dans `users` avec le bon ID
- ✅ Le rôle est `super_admin`
- ✅ L'ID correspond à celui dans `auth.users`
- ✅ Vous pouvez vous connecter sur `/admin/login`

---

**Exécutez `resoudre-duplicate-email.sql` et le problème sera résolu ! 🎉**

