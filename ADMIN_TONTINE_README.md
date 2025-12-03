# 🔐 Interface Admin Tontine - SolidarPay

## Vue d'ensemble

L'interface Admin Tontine (`/admin-tontine`) permet aux administrateurs de tontine de gérer leurs propres tontines, rechercher et ajouter des membres, et consulter les documents KYC de leurs membres.

## 🔑 Accès

- **Route**: `/admin-tontine`
- **Rôle requis**: `admin` dans la table `users`

## 📋 Structure des rôles

- **`/membre`** = Participants aux tontines (rôle: `member`)
- **`/admin-tontine`** = Admins qui créent et gèrent leurs tontines (rôle: `admin`)
- **`/admin`** = Super Admin pour la gestion technique (rôle: `super_admin`)

## 🎨 Palette de couleurs

Utilise la palette turquoise de SolidarPay:
- **Primaire**: `#0891B2` (bleu turquoise)
- **Secondaire**: `#0E7490` (bleu foncé)
- **Fond**: `#F0F9FF` (bleu très clair)

## 📁 Structure de l'interface

### 1. Sidebar Navigation

- 📊 **Mes Tontines** - Liste de toutes les tontines de l'admin
- ➕ **Créer une nouvelle tontine** - Formulaire de création
- 🔍 **Rechercher des membres** - Recherche globale de membres
- 👤 **Mon profil** - Gestion du profil

### 2. Page "Gérer ma tontine"

Une fois une tontine sélectionnée, l'admin peut la gérer via 4 tabs:

#### Tab "Vue d'ensemble"
- Statistiques générales (membres, cotisation, total collecté, cycles)
- Informations de la tontine

#### Tab "Membres"
La fonctionnalité principale avec:

**A) Section Recherche (formulaire):**
- **Étape 1**: Sélectionner le pays
  - Dropdown des pays actifs
  - Message: "Sélectionnez d'abord le pays de votre tontine"
  - Note: "Seuls les membres de ce pays pourront être ajoutés"

- **Étape 2**: Rechercher
  - Champ de recherche: "Nom complet ou email"
  - Bouton "Rechercher"
  - Validation: pays requis

**B) Résultats de recherche (cards en grille):**
Pour chaque membre trouvé:
- Photo de profil (initiale)
- Nom complet
- Email
- Téléphone
- Pays (drapeau)
- Badge statut KYC:
  - ✅ **Vérifié** (vert) → Bouton "Ajouter"
  - ⏳ **En attente** (orange) → Message "En cours de vérification"
  - ❌ **Non vérifié** (rouge) → Message "Doit compléter sa vérification"

**C) Modal de confirmation d'ajout:**
- Titre: "Ajouter [Nom] à [Nom de la tontine] ?"
- Résumé avec photo, nom, statut KYC
- Note: "Son document sera accessible dans votre interface"
- Boutons: "Confirmer" / "Annuler"

**D) Liste des membres déjà ajoutés:**
Tableau avec:
- Photo
- Nom complet
- Email
- Téléphone
- Statut KYC
- Document (bouton "Voir")
- Date d'ajout
- Actions (menu ⋮):
  - Voir le document KYC
  - Retirer de la tontine (avec confirmation)

**E) Accès aux documents KYC:**
Modal "Document KYC de [Nom]":
- Informations du membre
- Image du document (zoomable avec boutons + / -)
- Date de vérification
- Approuvé par: Super Admin
- Bouton "Télécharger" (avec note watermark)
- Note de confidentialité

#### Tab "Cycles"
- Gestion des cycles de cotisation
- (À implémenter complètement)

#### Tab "Paramètres"
- Modification des paramètres de la tontine
- (À implémenter complètement)

## 🔒 Sécurité et confidentialité

- L'admin tontine ne voit QUE:
  - Les documents de SES membres
  - Dans SES tontines uniquement
- Watermark automatique sur les téléchargements
- Log de chaque accès au document (à implémenter)
- RLS (Row Level Security) sur toutes les tables

## 📊 Filtres pour les membres

Dans la liste des membres de sa tontine:
- Par statut KYC (à implémenter)
- Par date d'ajout (à implémenter)
- Recherche par nom (à implémenter)

## 🗄️ Base de données

### Tables utilisées

- `users` - Utilisateurs avec champ `country` (code ISO)
- `tontines` - Tontines avec `adminId`
- `tontine_members` - Association membres-tontines
- `kyc_documents` - Documents KYC des utilisateurs
- `payment_countries` - Pays disponibles

### Mise à jour de la base de données

Exécutez le script SQL `database-admin-tontine-updates.sql` pour:
- Ajouter le champ `country` à la table `users`
- Ajouter les index nécessaires
- Créer une vue pour faciliter la recherche

## 🚀 Installation

1. **Mettre à jour la base de données**:
```sql
-- Exécutez database-admin-tontine-updates.sql dans Supabase SQL Editor
```

2. **Créer un compte admin tontine**:
```sql
-- Mettre à jour un utilisateur existant
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

3. **Accéder à l'interface**:
- Connectez-vous avec un compte ayant le rôle `admin`
- Accédez à `/admin-tontine`

## 📝 Fonctionnalités implémentées

✅ Authentification admin tontine
✅ Liste des tontines de l'admin
✅ Création de nouvelle tontine
✅ Gestion d'une tontine avec tabs
✅ Recherche de membres par pays et nom/email
✅ Ajout de membres à la tontine
✅ Liste des membres avec statut KYC
✅ Visualisation des documents KYC (modal zoomable)
✅ Retrait de membres
✅ Badges de statut KYC
✅ Filtrage par pays

## 🔄 Fonctionnalités à implémenter

- Filtres avancés dans la liste des membres
- Logs d'accès aux documents KYC
- Watermark automatique sur téléchargements (côté serveur)
- Gestion complète des cycles
- Paramètres de tontine complets
- Recherche globale de membres (page séparée)

## 🛠️ Technologies utilisées

- Next.js 14 (App Router)
- React 18
- Tailwind CSS avec palette turquoise
- Lucide React pour les icônes
- Supabase pour l'authentification et la base de données
- shadcn/ui pour les composants

## 📧 Support

Pour toute question concernant l'interface admin tontine, contactez l'équipe technique.

