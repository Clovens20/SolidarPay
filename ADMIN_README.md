# 🔐 Interface Super Admin - SolidarPay

## Vue d'ensemble

L'interface Super Admin (`/admin`) est réservée à la gestion technique de la plateforme SolidarPay. Elle permet de gérer les aspects techniques sans intervenir dans la gestion des utilisateurs ou des tontines.

## 🔑 Accès

- **Route**: `/admin`
- **Route de connexion**: `/admin/login`
- **Rôle requis**: `super_admin` dans la table `users`

## 📋 Structure des rôles

- **`/membre`** = Participants aux tontines (rôle: `member`)
- **`/admin-tontine`** = Admins qui créent et gèrent leurs tontines (rôle: `admin`)
- **`/admin`** = Super Admin pour la gestion technique (rôle: `super_admin`)

## 🎨 Palette de couleurs

- **Primaire**: `#0891B2` (bleu turquoise)
- **Secondaire**: `#0E7490` (bleu foncé)
- **Fond**: `#F0F9FF` (bleu très clair)
- **Blanc**: `#FFFFFF`
- **Texte**: `#0F172A`
- **Bordures**: `#E0F2FE`

## 📁 Structure de l'interface

### 1. Header
- Logo SolidarPay
- Titre "Super Admin - Gestion Technique"
- Badge rouge si vérifications KYC en attente
- Menu profil avec dropdown (Paramètres, Déconnexion)

### 2. Sidebar Navigation
- 📊 Dashboard
- ✅ Vérifications KYC (avec badge nombre en attente)
- 🌍 Pays & Méthodes
- 🎨 Personnalisation
- ⚙️ Paramètres
- 🔧 Maintenance
- 📝 Logs Système

### 3. Dashboard
Affiche uniquement des **statistiques** (pas de listes d'utilisateurs ou tontines):

#### Cards de statistiques:
- Total utilisateurs inscrits
- Total membres
- Total admins tontine
- Total tontines créées
- Vérifications KYC en attente (badge rouge si > 0)
- Documents approuvés aujourd'hui
- Pays actifs
- Méthodes de paiement configurées

#### Graphiques:
- Inscriptions par mois (6 derniers mois)
- Tontines créées par mois
- Vérifications KYC (approuvées/rejetées) par semaine
- Répartition géographique (utilisateurs par pays)

#### Alertes techniques:
- ⚠️ Documents KYC à vérifier
- ✅ Dernière sauvegarde
- 🔧 Mode maintenance

#### Timeline technique:
- Nouvelles inscriptions (24h)
- Nouvelles tontines créées (24h)
- Documents KYC soumis (24h)
- Erreurs système (24h)

## 🗄️ Base de données

### Tables nécessaires

Exécutez le script SQL `database-super-admin.sql` pour créer les tables suivantes:

1. **`kyc_documents`** - Documents KYC des utilisateurs
2. **`payment_countries`** - Pays et méthodes de paiement
3. **`platform_customization`** - Personnalisation de la plateforme
4. **`system_logs`** - Logs système
5. **`maintenance_schedule`** - Planifications de maintenance

### Créer un super admin

```sql
-- Mettre à jour un utilisateur existant en super admin
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'votre-email@example.com';
```

Ou créer un nouveau super admin:

```sql
-- Créer un utilisateur super admin
INSERT INTO users (email, "fullName", role)
VALUES ('admin@solidarpay.com', 'Super Admin', 'super_admin');
```

Puis créez le compte d'authentification dans Supabase Auth.

## 🚀 Installation

1. **Installer les dépendances** (déjà fait):
```bash
npm install
```

2. **Configurer la base de données**:
   - Exécutez `database-super-admin.sql` dans Supabase SQL Editor
   - Assurez-vous que la table `users` accepte le rôle `super_admin`

3. **Créer votre compte super admin**:
   - Créez un utilisateur dans Supabase Auth
   - Mettez à jour la table `users` pour lui donner le rôle `super_admin`

4. **Accéder à l'interface**:
   - Allez sur `/admin/login`
   - Connectez-vous avec vos identifiants super admin

## 📝 Notes importantes

- **Pas de gestion d'utilisateurs**: L'interface super admin ne permet PAS de gérer les utilisateurs directement (pas de liste, pas d'ajout/suppression)
- **Pas de gestion de tontines**: L'interface super admin ne permet PAS de gérer les tontines directement
- **Focus technique**: Seulement statistiques, KYC, configuration technique, logs, maintenance

## 🔒 Sécurité

- L'authentification vérifie que l'utilisateur a le rôle `super_admin`
- Row Level Security (RLS) activé sur toutes les tables
- Seul le super admin peut accéder aux données techniques

## 🛠️ Technologies utilisées

- Next.js 14 (App Router)
- React 18
- Tailwind CSS avec palette turquoise
- Recharts pour les graphiques
- Lucide React pour les icônes
- Supabase pour l'authentification et la base de données
- shadcn/ui pour les composants

## 📧 Support

Pour toute question concernant l'interface super admin, contactez l'équipe technique.

