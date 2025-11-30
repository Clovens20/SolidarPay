# 🤝 SolidarPay

Application web de gestion de tontine familiale digitalisée avec paiements KOHO/Interac e-Transfer.

![SolidarPay Logo](https://customer-assets.emergentagent.com/job_c9a6076a-d63d-4961-b674-ac9104b374e9/artifacts/7rmsfnh6_copilot_image_1764402573003.jpeg)

## 📋 Description

SolidarPay est une plateforme moderne qui digitalise la gestion des tontines familiales et entre amis. Elle permet de gérer facilement les cotisations régulières, le suivi des paiements et la rotation des bénéficiaires, le tout intégré avec KOHO pour les transferts Interac.

## ✨ Fonctionnalités

### Pour les Membres
- 🔐 **Authentification sécurisée** via Supabase
- 📊 **Tableau de bord personnalisé** avec le cycle en cours
- 💰 **Paiement facilité via KOHO**
  - Copie automatique des informations de paiement
  - Ouverture d'email pré-rempli pour Interac e-Transfer
  - Déclaration de paiement en un clic
- 📈 **Suivi en temps réel** des cotisations du groupe
- 📜 **Historique complet** de tous les cycles passés
- 📧 **Notifications automatiques** par email avant chaque échéance

### Pour les Administrateurs
- ⚙️ **Configuration flexible** de la tontine
  - Fréquence : mensuelle ou bi-hebdomadaire
  - Montant de cotisation personnalisable
  - Ordre de rotation des bénéficiaires
- 👥 **Gestion des membres** (ajout, suppression, modification)
- ✅ **Validation des paiements** déclarés par les membres
- 🔄 **Lancement de nouveaux cycles** en un clic
- 📊 **Statistiques détaillées** sur les contributions
- 📧 **Envoi de rappels** automatiques aux membres
- 📈 **Tableau de bord admin** avec vue d'ensemble complète

## 🛠️ Technologies Utilisées

- **Frontend**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Emails**: Resend
- **Paiements**: KOHO (Interac e-Transfer)
- **Déploiement**: Compatible Vercel/Netlify

## 📦 Installation

### Prérequis
- Node.js 18+ 
- Yarn
- Compte Supabase
- Compte Resend (pour les emails)
- Compte KOHO (pour les paiements)

### Étapes d'installation

1. **Clonez le dépôt**
```bash
git clone https://github.com/konekte20/SolidarPay.git
cd SolidarPay
```

2. **Installez les dépendances**
```bash
yarn install
```

3. **Configurez les variables d'environnement**

Créez un fichier `.env` à la racine du projet:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_anon_key

# Resend Configuration
RESEND_API_KEY=votre_resend_api_key
RESEND_FROM_EMAIL=SolidarPay <onboarding@resend.dev>
```

4. **Configurez la base de données Supabase**

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase (voir `database-schema.sql`):

```sql
-- Voir le fichier complet dans le dépôt
```

5. **Lancez le serveur de développement**
```bash
yarn dev
```

L'application sera accessible sur `http://localhost:3000`

## 🗄️ Structure de la Base de Données

### Tables principales

- **users**: Informations des utilisateurs (membres et admins)
- **tontines**: Configuration des groupes de tontine
- **tontine_members**: Association membres-tontines avec ordre de rotation
- **cycles**: Cycles de cotisation avec bénéficiaires
- **contributions**: Suivi individuel des paiements

## 🚀 Déploiement

### Déploiement sur Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel
3. Déployez!

```bash
# Ou via CLI
vercel --prod
```

### Variables d'environnement de production

Assurez-vous de configurer toutes les variables d'environnement dans votre plateforme de déploiement:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## 📱 Utilisation

### Première connexion

1. **Inscription**: Créez un compte avec votre email
2. **Email de bienvenue**: Vous recevrez un email de confirmation
3. **Rejoindre une tontine**: L'admin vous ajoutera à un groupe

### Pour les membres

1. **Consultez votre dashboard** pour voir le cycle en cours
2. **Effectuez votre cotisation**:
   - Cliquez sur "Copier les informations" ou "Ouvrir email Interac"
   - Envoyez le paiement via KOHO
   - Cliquez sur "J'ai payé"
3. **Suivez le statut** de votre paiement (en attente de validation)

### Pour les administrateurs

1. **Créez une tontine**:
   - Configurez le montant et la fréquence
   - Ajoutez les membres
   - Définissez l'ordre de rotation
2. **Lancez un cycle**:
   - Le système sélectionne automatiquement le prochain bénéficiaire
   - Les membres sont notifiés par email
3. **Validez les paiements**:
   - Vérifiez les déclarations de paiement
   - Validez ou rejetez selon la réception
4. **Gérez la tontine**:
   - Envoyez des rappels
   - Consultez l'historique
   - Modifiez les paramètres

## 🔐 Sécurité

- Authentification sécurisée via Supabase Auth
- Row Level Security (RLS) sur toutes les tables
- Validation des paiements par l'admin (double vérification)
- Variables d'environnement pour les clés sensibles
- HTTPS obligatoire en production

## 📧 Notifications Email

L'application envoie automatiquement:
- Email de bienvenue à l'inscription
- Rappels avant chaque échéance de cotisation
- Notification au bénéficiaire quand c'est son tour
- Confirmations de validation de paiement

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à:
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT.

## 👥 Auteurs

- **Équipe SolidarPay** - *Développement initial*

## 🙏 Remerciements

- Supabase pour la base de données et l'authentification
- Resend pour les emails transactionnels
- KOHO pour les transferts Interac
- shadcn/ui pour les composants UI
- La communauté Next.js

## 📞 Support

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Email: support@solidarpay.com

---

Fait avec ❤️ pour faciliter la solidarité financière entre proches
