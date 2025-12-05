# 🌍 Sélection de Pays lors de l'Inscription - SolidarPay

## 📋 Vue d'ensemble

Lors de la création de compte, les **admin-tontine** et les **membres** doivent maintenant **choisir leur pays de résidence**. Cette information est obligatoire et permet de personnaliser l'expérience utilisateur.

## ✅ Modifications Apportées

### 1. **Formulaire d'Inscription** (`app/register/page.js`)

#### **Nouveau Champ Pays**
- ✅ Ajout d'un sélecteur de pays avec drapeaux
- ✅ Champ **obligatoire** (marqué avec *)
- ✅ Charge les pays depuis la table `payment_countries`
- ✅ Affiche uniquement les pays activés (`enabled = true`)
- ✅ Affichage avec drapeaux pour une meilleure UX
- ✅ Tri alphabétique par nom de pays

#### **Fonctionnalités**
```javascript
- Chargement automatique des pays depuis Supabase
- Sélecteur avec recherche et drapeaux
- Validation : pays obligatoire
- Affichage responsive
```

### 2. **API d'Inscription** (`app/api/[[...path]]/route.js`)

#### **Validation Renforcée**
- ✅ Vérifie que le pays est fourni (obligatoire)
- ✅ Vérifie que le pays existe dans `payment_countries`
- ✅ Vérifie que le pays est activé (`enabled = true`)
- ✅ Retourne des erreurs claires si validation échoue

#### **Sauvegarde**
- ✅ Sauvegarde le code pays dans la colonne `country` de la table `users`
- ✅ Format : Code ISO 2 lettres (ex: CA, FR, US)

### 3. **Base de Données**

La colonne `country` existe déjà dans la table `users` :
- Type : `TEXT`
- Index : `idx_users_country` (pour recherches rapides)
- Format : Code ISO 2 lettres (CA, FR, BE, etc.)

## 🎨 Interface Utilisateur

### Sélecteur de Pays

Le sélecteur affiche :
- 🌍 **Icône Globe** dans le label
- 📋 **Liste des pays** avec drapeaux
- ✅ **Pays activés uniquement** (filtrés côté serveur)
- 🔍 **Recherche** intégrée dans le Select
- 📱 **Responsive** pour mobile et desktop

### Exemple d'Affichage

```
┌─────────────────────────────────────┐
│ 🌍 Pays de résidence *             │
├─────────────────────────────────────┤
│ [Sélectionnez votre pays ▼]        │
│                                     │
│ Options:                            │
│   🇧🇪 Belgique                      │
│   🇨🇦 Canada                        │
│   🇨🇲 Cameroun                      │
│   🇨🇱 Chili                         │
│   🇫🇷 France                        │
│   🇭🇹 Haïti                         │
│   🇲🇽 Mexique                       │
│   🇸🇳 Sénégal                       │
│   🇨🇭 Suisse                        │
│   🇺🇸 États-Unis                    │
└─────────────────────────────────────┘
```

## 📊 Flux d'Inscription

```
1. Utilisateur arrive sur /register
   ↓
2. Chargement des pays activés depuis payment_countries
   ↓
3. Formulaire affiché avec sélecteur de pays
   ↓
4. Utilisateur remplit le formulaire + sélectionne pays
   ↓
5. Validation côté client (pays obligatoire)
   ↓
6. Envoi à l'API /api/auth/register
   ↓
7. Validation API :
   - Pays fourni ?
   - Pays existe dans payment_countries ?
   - Pays activé ?
   ↓
8. Création du compte avec country sauvegardé
   ↓
9. Redirection selon le rôle
```

## 🔒 Validations

### Côté Client
- ✅ Champ pays obligatoire (required)
- ✅ Message d'erreur si non sélectionné
- ✅ Validation avant soumission

### Côté Serveur
- ✅ Vérification que le pays est fourni
- ✅ Vérification que le pays existe dans la base
- ✅ Vérification que le pays est activé
- ✅ Messages d'erreur explicites

## 📝 Fichiers Modifiés

1. **`app/register/page.js`**
   - Ajout du sélecteur de pays
   - Chargement des pays depuis Supabase
   - Validation du champ pays
   - Affichage avec drapeaux

2. **`app/api/[[...path]]/route.js`**
   - Validation du pays dans l'endpoint register
   - Vérification que le pays existe et est activé
   - Sauvegarde du pays dans la table users

3. **`ajouter-colonne-country-users.sql`** (nouveau)
   - Script SQL pour s'assurer que la colonne existe

## 🗄️ Structure de la Base de Données

### Table `users`
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
```

### Table `payment_countries`
Les pays sont stockés dans cette table :
```sql
CREATE TABLE IF NOT EXISTS payment_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,  -- CA, FR, US, etc.
  name TEXT NOT NULL,          -- Canada, France, etc.
  enabled BOOLEAN DEFAULT true,
  "paymentMethods" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Pays Disponibles

Les pays sont chargés depuis `payment_countries` où `enabled = true`. 

Pays généralement disponibles :
- 🇨🇦 Canada (CA)
- 🇺🇸 États-Unis (US)
- 🇫🇷 France (FR)
- 🇧🇪 Belgique (BE)
- 🇨🇭 Suisse (CH)
- 🇲🇽 Mexique (MX)
- 🇨🇱 Chili (CL)
- 🇭🇹 Haïti (HT)
- 🇸🇳 Sénégal (SN)
- 🇨🇲 Cameroun (CM)

> **Note** : La liste peut être modifiée par le Super Admin via `/admin/countries`

## 📱 Responsive Design

Le sélecteur de pays est responsive :
- ✅ **Mobile** : Pleine largeur, facile à utiliser
- ✅ **Tablette** : Optimisé pour le touch
- ✅ **Desktop** : Dropdown classique

## ✅ Checklist d'Implémentation

- [x] Sélecteur de pays dans le formulaire
- [x] Chargement des pays depuis payment_countries
- [x] Affichage avec drapeaux
- [x] Validation côté client (obligatoire)
- [x] Validation côté serveur
- [x] Sauvegarde dans la table users
- [x] Messages d'erreur clairs
- [x] Design responsive
- [x] Script SQL pour colonne country
- [x] Documentation complète

## 🔄 Utilisation

### Pour un Nouvel Utilisateur

1. Aller sur `/register`
2. Remplir le formulaire :
   - Nom complet *
   - Email *
   - Téléphone (optionnel)
   - **Pays de résidence *** (nouveau)
   - Type de compte (Membre ou Admin)
   - Mot de passe *
3. Cliquer sur "Créer mon compte"
4. Le pays est sauvegardé automatiquement

### Pour le Super Admin

- Gérer les pays disponibles via `/admin/countries`
- Activer/Désactiver des pays
- Les pays désactivés ne seront plus disponibles dans le sélecteur

## 📌 Notes Importantes

1. **Pays Obligatoire** : Le champ pays est maintenant **obligatoire** pour tous les nouveaux comptes

2. **Pays Activés** : Seuls les pays avec `enabled = true` apparaissent dans le sélecteur

3. **Format du Code** : Le code pays est stocké au format ISO 2 lettres (ex: CA, FR, US)

4. **Compatibilité** : Les utilisateurs existants sans pays auront `country = NULL`. Ils pourront mettre à jour leur profil plus tard.

5. **Validation** : Si un utilisateur essaie de s'inscrire avec un pays désactivé, une erreur claire sera affichée

## 🧪 Test de la Fonctionnalité

### Test 1 : Inscription avec Pays
1. Aller sur `/register`
2. Sélectionner un pays
3. Remplir le formulaire
4. Soumettre → Doit fonctionner

### Test 2 : Validation Pays Obligatoire
1. Aller sur `/register`
2. Ne pas sélectionner de pays
3. Essayer de soumettre → Doit afficher une erreur

### Test 3 : Pays Désactivé
1. Désactiver un pays dans `/admin/countries`
2. Aller sur `/register`
3. Le pays désactivé ne doit pas apparaître dans la liste

---

**Date de réalisation** : $(date)
**Statut** : ✅ **IMPLÉMENTÉ ET FONCTIONNEL**

