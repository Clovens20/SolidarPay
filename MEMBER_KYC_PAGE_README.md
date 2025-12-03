# 👤 Page Profil et KYC pour les Membres - SolidarPay

## Vue d'ensemble

La page `/profile` permet aux membres de gérer leur profil et de vérifier leur identité (KYC) pour accéder à toutes les fonctionnalités de SolidarPay.

## 🔑 Accès

- **Route**: `/profile`
- **Rôle requis**: `member` (membres de la plateforme)
- **Authentification**: Vérifie la session via localStorage et Supabase

## 📋 Fonctionnalités

### 1. Tab "Mon Profil"
- Affichage des informations personnelles :
  - Email
  - Nom complet
  - Téléphone (si renseigné)
  - Date d'inscription
  - Rôle dans la plateforme

### 2. Tab "Vérification d'identité" (KYC)

#### A) Statut KYC actuel
- Affichage du statut de vérification via le composant `KYCStatus`
- Badge "Compte vérifié" si KYC approuvé
- État en temps réel (polling toutes les 3 secondes)

#### B) Upload de document
- **Si KYC non approuvé** :
  - Message d'invitation à vérifier l'identité
  - Bouton "Télécharger mon document"
  - Composant `UploadKYC` avec :
    - Zone de drag & drop
    - Preview avant envoi
    - Validation des formats (JPG, PNG, PDF, max 5MB)
    - Analyse automatique en temps réel
    - Limite de 5 tentatives

#### C) Historique des soumissions
- Liste de toutes les soumissions KYC (max 5)
- Pour chaque soumission :
  - Numéro de soumission
  - Statut (Approuvé, Rejeté, En attente)
  - Score automatique (si disponible)
  - Date de soumission
  - Raison de rejet (si applicable)

## 🎯 Flux d'utilisation

### Pour un membre :

1. **Accéder au profil** :
   - Se connecter sur la page principale
   - Cliquer sur "Mon Profil" dans le header
   - Ou naviguer vers `/profile`

2. **Vérifier son identité** :
   - Aller dans l'onglet "Vérification d'identité"
   - Voir le statut actuel
   - Si non vérifié, cliquer sur "Télécharger mon document"
   - Glisser-déposer ou sélectionner le fichier
   - Attendre l'analyse automatique (2-5 secondes)

3. **Résultats possibles** :
   - ✅ **Approuvé** : Badge "Compte vérifié", accès complet
   - ❌ **Rejeté** : Voir les raisons, possibilité de réessayer
   - ⏳ **En attente (revue manuelle)** : Attendre 24-48h
   - 🔄 **Nouveau document requis** : Instructions spécifiques

4. **Historique** :
   - Consulter toutes les soumissions précédentes
   - Voir les détails de chaque tentative

## 🔒 Sécurité

- **Authentification** : Vérifie la session via localStorage ET Supabase
- **Redirection** : Si non authentifié, redirige vers la page principale
- **Limite de tentatives** : Maximum 5 soumissions par utilisateur
- **Validation** : Formats de fichiers stricts, taille limitée (5MB)

## 📁 Structure

```
app/profile/
└── page.js          # Page principale profil + KYC

components/kyc/
├── UploadKYC.jsx    # Composant d'upload (déjà créé)
└── KYCStatus.jsx    # Composant de statut (déjà créé)
```

## 🎨 Design

- Palette turquoise SolidarPay cohérente
- Tabs pour organiser Profil et KYC
- Badges colorés selon le statut
- Interface intuitive et responsive

## 🔗 Intégration

La page est accessible depuis :
- **Header de la page principale** : Bouton "Mon Profil" (pour les membres)
- **Navigation directe** : `/profile`
- **Redirection automatique** : Si session invalide, redirige vers `/`

## 📝 Notes techniques

### Authentification
La page utilise une double vérification :
1. `localStorage` pour la compatibilité avec `app/page.js`
2. Supabase Auth pour vérifier la validité de la session

Si la session est invalide, l'utilisateur est redirigé vers la page principale.

### Composants utilisés
- `UploadKYC` : Gère l'upload et l'analyse automatique
- `KYCStatus` : Affiche le statut en temps réel
- Système de polling pour les mises à jour automatiques

### Base de données
- Table `kyc_documents` : Stocke tous les documents KYC
- Table `users` : Informations du profil utilisateur

## ✅ Statut

- ✅ Page créée
- ✅ Authentification implémentée
- ✅ Intégration des composants KYC
- ✅ Historique des soumissions
- ✅ Lien dans le header de la page principale
- ✅ Design cohérent avec la plateforme

## 🚀 Prochaines améliorations (optionnelles)

1. **Édition du profil** : Permettre de modifier nom, téléphone
2. **Changement de mot de passe** : Intégration dans le profil
3. **Notifications** : Alertes en temps réel pour les statuts KYC
4. **Photo de profil** : Upload d'une photo de profil utilisateur

