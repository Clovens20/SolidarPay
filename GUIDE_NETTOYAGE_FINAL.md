# 🧹 Guide Final : Nettoyage des Utilisateurs

## 🎯 Objectif

Nettoyer la base de données pour que chaque email ait **un seul enregistrement** avec le **bon ID**.

## ✅ Les Bons IDs à Utiliser

| Email | ID | Rôle |
|-------|-----|------|
| `clodenerc@yahoo.fr` | `cb289deb-9d0d-498c-ba0d-90f77fc58f4e` | `super_admin` |
| `claircl18@gmail.com` | `76223ba8-d868-4bc3-8363-93a20e60d34f` | `admin` |
| `Paulinacharles615@gmail.com` | `e4afdfa7-4699-49cc-b740-2e8bef97ce55` | `member` |

## 🚀 Deux Scripts Disponibles

### Option 1 : Script Simple (Recommandé) ⭐

**Fichier** : `NETTOYAGE_SIMPLE.sql`

- ✅ Supprime tous les anciens enregistrements
- ✅ Crée les 3 utilisateurs avec les bons IDs
- ✅ Simple et direct

**Exécution** :
```sql
-- Dans Supabase SQL Editor, exécutez :
NETTOYAGE_SIMPLE.sql
```

### Option 2 : Script Complet (Avec Diagnostic)

**Fichier** : `NETTOYAGE_UTILISATEURS.sql`

- ✅ Affiche un diagnostic avant/après
- ✅ Supprime les anciens enregistrements intelligemment
- ✅ Vérifie les doublons
- ✅ Plus détaillé

**Exécution** :
```sql
-- Dans Supabase SQL Editor, exécutez :
NETTOYAGE_UTILISATEURS.sql
```

## 📋 Résultat Attendu

Après l'exécution, vous devriez voir :

```
✅ Super Admin OK
✅ Admin Tontine OK
✅ Membre OK
```

## ✅ Vérification

Pour vérifier que tout est correct, exécutez :

```sql
SELECT 
  id,
  email,
  role
FROM users
WHERE email IN (
  'clodenerc@yahoo.fr',
  'claircl18@gmail.com',
  'Paulinacharles615@gmail.com'
)
ORDER BY role;
```

Vous devriez voir **exactement 3 lignes** avec les bons IDs et rôles.

## 🔐 Après le Nettoyage

1. ✅ Vérifiez que les 3 utilisateurs sont corrects
2. ✅ Testez la connexion pour chaque utilisateur :
   - Super Admin → `/admin/login`
   - Admin Tontine → Page principale `/`
   - Membre → Page principale `/`
3. ✅ Tout devrait fonctionner maintenant !

---

## 💡 Recommandation

**Utilisez `NETTOYAGE_SIMPLE.sql`** - C'est le plus rapide et le plus sûr ! 🎉

