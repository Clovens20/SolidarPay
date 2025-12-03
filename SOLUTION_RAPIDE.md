# 🚀 Solution Rapide : Erreur "Duplicate Key"

## 🔴 Votre Erreur

```
duplicate key value violates unique constraint "users_email_key"
Key (email)=(clodenerc@yahoo.fr) already exists.
```

## ✅ Solution en 1 Commande

L'utilisateur existe déjà, il faut juste mettre à jour le rôle et vérifier l'ID.

### Exécutez ce script dans Supabase SQL Editor :

```sql
-- Fichier : FIX_FINAL_SUPER_ADMIN.sql
```

## 📋 Ou exécutez ces 2 commandes manuellement :

### 1. Mettre à jour le rôle
```sql
UPDATE users
SET role = 'super_admin'
WHERE email = 'clodenerc@yahoo.fr';
```

### 2. Vérifier que tout est bon
```sql
SELECT 
  u.id,
  u.email,
  u.role,
  CASE 
    WHEN u.role = 'super_admin' THEN '✅ Prêt !'
    ELSE '⚠️ Problème'
  END as statut
FROM users u
WHERE u.email = 'clodenerc@yahoo.fr';
```

## ✅ C'est tout !

Après avoir exécuté, essayez de vous connecter sur `/admin/login`.

---

**Le fichier `FIX_FINAL_SUPER_ADMIN.sql` fait tout automatiquement ! 🎉**

