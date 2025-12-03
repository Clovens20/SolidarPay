# 🚀 Guide Rapide : Résoudre "Utilisateur Introuvable" - Super Admin

## 🔴 Le Problème

Vous voyez cette erreur :
```
Utilisateur introuvable dans la base de données.
Veuillez contacter le support.
```

**Cela signifie** : L'utilisateur existe dans Supabase Auth mais **PAS dans la table `users`**.

## ✅ Solution en 2 Étapes

### Étape 1 : Exécuter le Script SQL

1. **Ouvrez Supabase Dashboard**
2. **Allez dans SQL Editor**
3. **Exécutez** le fichier : `creer-super-admin-user.sql`

Ce script va :
- ✅ Vérifier l'existence dans `auth.users`
- ✅ Vérifier l'existence dans `users`
- ✅ Créer l'utilisateur dans `users` automatiquement
- ✅ Mettre le rôle à `super_admin`
- ✅ Vérifier que tout est correct

### Étape 2 : Vérifier

Après l'exécution, vérifiez que vous voyez :
```
✅ OK - Prêt pour la connexion
```

## 🔧 Solution Alternative (Si le script ne fonctionne pas)

### Création Manuelle

Si le script automatique ne fonctionne pas, créez manuellement :

```sql
-- 1. D'abord, trouvez l'ID réel dans auth.users
SELECT id, email FROM auth.users 
WHERE email = 'clodenerc@yahoo.fr';

-- 2. Ensuite, créez dans users avec l'ID trouvé
INSERT INTO users (id, email, "fullName", role, "createdAt")
VALUES (
  'cb289deb-9d0d-498c-ba0d-90f77fc58f4e',  -- Remplacez par l'ID réel
  'clodenerc@yahoo.fr',
  'Super Admin',
  'super_admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin';
```

## ✅ Après la Correction

1. ✅ Exécutez le script SQL
2. ✅ Vérifiez que le statut est "✅ OK"
3. ✅ Essayez de vous connecter sur `/admin/login`
4. ✅ La connexion devrait fonctionner maintenant !

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez l'ID** :
   - L'ID dans `auth.users` doit être **exactement le même** que dans `users`
   - Exécutez : `VERIFICATION_RAPIDE_USERS.sql`

2. **Vérifiez l'email** :
   - L'email doit être confirmé dans Supabase Auth
   - Dashboard → Authentication → Users → Vérifier l'email

3. **Contactez-moi** avec les résultats du script de vérification

---

**Le problème sera résolu après l'exécution du script SQL ! 🎉**

