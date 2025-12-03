# 🧹 Instructions : Nettoyage des Utilisateurs

## 🎯 Objectif

Nettoyer la base de données pour que chaque email ait **un seul enregistrement** avec le **bon ID**.

## ✅ Les Bons IDs

- **Super Admin** : `cb289deb-9d0d-498c-ba0d-90f77fc58f4e` → `clodenerc@yahoo.fr`
- **Admin Tontine** : `76223ba8-d868-4bc3-8363-93a20e60d34f` → `claircl18@gmail.com`
- **Membre** : `e4afdfa7-4699-49cc-b740-2e8bef97ce55` → `Paulinacharles615@gmail.com`

## 🚀 Exécution

### Dans Supabase SQL Editor, exécutez :

```
NETTOYAGE_UTILISATEURS.sql
```

## 📋 Ce que fait le script

1. ✅ **Diagnostic** : Affiche tous les enregistrements actuels
2. ✅ **Suppression** : Supprime tous les anciens enregistrements avec mauvais IDs
3. ✅ **Création/MAJ** : Crée ou met à jour les 3 utilisateurs avec les bons IDs et rôles
4. ✅ **Vérification** : Vérifie qu'il n'y a plus de doublons

## ✅ Résultat Attendu

Après l'exécution, vous devriez voir :

```
✅ Super Admin - PARFAIT
✅ Admin Tontine - PARFAIT  
✅ Membre - PARFAIT
```

Et dans la vérification doublons :
```
✅ OK - Un seul enregistrement (pour chaque email)
```

## 🔐 Après le Nettoyage

1. ✅ Vérifiez que les 3 utilisateurs sont corrects
2. ✅ Essayez de vous connecter avec chaque utilisateur
3. ✅ Tout devrait fonctionner maintenant !

---

**C'est simple : Exécutez `NETTOYAGE_UTILISATEURS.sql` et c'est fait ! 🎉**

