# 🌍 Guide : Ajouter les Pays Demandés

## 📋 Pays à Ajouter

1. **Canada** (CA)
2. **États-Unis** (US)
3. **Mexique** (MX)
4. **Chili** (CL)
5. **Haïti** (HT)
6. **Sénégal** (SN)
7. **Cameroun** (CM)

---

## ✅ Solution 1 : Script SQL (Rapide)

Exécutez le script SQL dans Supabase :

1. Ouvrez **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Exécutez le fichier : **`ajouter-pays-demandes.sql`**

Ce script ajoutera automatiquement tous les pays demandés.

---

## ✅ Solution 2 : Interface Super Admin (Pour l'avenir)

Maintenant, vous pouvez ajouter des pays directement depuis l'interface !

### Comment ajouter un nouveau pays :

1. **Connectez-vous en Super Admin** : `/admin/login`
2. **Allez dans** : "Pays & Méthodes"
3. **Cliquez sur** : "Ajouter un pays"
4. **Remplissez le formulaire** :
   - Nom du pays (ex: "Cameroun")
   - Code ISO (ex: "CM")
   - Méthodes de paiement disponibles
   - Statut (Actif/Inactif)
5. **Cliquez sur** : "Ajouter"

---

## 🔍 Vérifier que les Pays sont Ajoutés

Exécutez cette requête SQL pour vérifier :

```sql
SELECT code, name, enabled, "paymentMethods"
FROM payment_countries
WHERE code IN ('CA', 'US', 'MX', 'CL', 'HT', 'SN', 'CM')
ORDER BY name;
```

---

## 📝 Codes ISO des Pays

- **CA** = Canada
- **US** = États-Unis
- **MX** = Mexique
- **CL** = Chili
- **HT** = Haïti
- **SN** = Sénégal
- **CM** = Cameroun

---

## ✅ Fonctionnalités Ajoutées

- ✅ Bouton "Ajouter un pays" dans l'interface
- ✅ Modal pour ajouter un nouveau pays
- ✅ Validation du code ISO (2 lettres)
- ✅ Gestion des méthodes de paiement
- ✅ Activation/désactivation du pays
- ✅ Script SQL pour ajouter les pays demandés

---

**Tout est prêt ! 🎉**

