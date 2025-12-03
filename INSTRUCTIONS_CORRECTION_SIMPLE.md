# 🎯 Instructions Simples : Corriger le Super Admin

## 🔴 Votre Problème

L'email `clodenerc@yahoo.fr` existe déjà dans la base de données, mais il y a probablement un problème avec l'ID ou le rôle.

## ✅ Solution en 3 Commandes SQL

### Exécutez ces commandes **UNE PAR UNE** dans Supabase SQL Editor :

### 1️⃣ Mettre à jour le rôle
```sql
UPDATE users
SET role = 'super_admin'
WHERE email = 'clodenerc@yahoo.fr';
```

### 2️⃣ Vérifier l'ID
```sql
SELECT 
  au.id as auth_id,
  u.id as user_id,
  CASE WHEN au.id = u.id THEN '✅ OK' ELSE '❌ Différent' END as correspondance
FROM auth.users au
JOIN users u ON u.email = au.email
WHERE au.email = 'clodenerc@yahoo.fr';
```

### 3️⃣ Si les IDs sont différents, exécutez :
```sql
-- Trouver le bon ID
DO $$
DECLARE
  auth_id UUID;
BEGIN
  SELECT id INTO auth_id FROM auth.users WHERE email = 'clodenerc@yahoo.fr';
  
  -- Supprimer l'ancien
  DELETE FROM users WHERE email = 'clodenerc@yahoo.fr';
  
  -- Créer avec le bon ID
  INSERT INTO users (id, email, "fullName", role, "createdAt")
  SELECT id, email, 'Super Admin', 'super_admin', created_at
  FROM auth.users WHERE id = auth_id;
END $$;
```

## 🎯 Solution Automatique (Recommandée)

Exécutez simplement le fichier :
```
corriger-utilisateur-existant.sql
```

Ce script fait tout automatiquement !

## ✅ Vérification

Après avoir exécuté les commandes, vérifiez :

```sql
SELECT id, email, role FROM users 
WHERE email = 'clodenerc@yahoo.fr';
```

Vous devriez voir :
- ✅ `role = 'super_admin'`
- ✅ L'ID correspond à celui dans `auth.users`

Ensuite, essayez de vous connecter sur `/admin/login` !

