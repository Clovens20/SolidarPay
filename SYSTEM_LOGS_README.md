# 📋 Logs Système - Super Admin

## Vue d'ensemble

L'interface de Logs Système permet au Super Admin de surveiller tous les événements techniques de la plateforme SolidarPay. **Focus technique uniquement** - pas de logs des actions utilisateurs.

## 📊 Types d'événements trackés

### 🔐 Authentification (stats uniquement)

- Connexions/déconnexions (stats uniquement)
- Comptes verrouillés (trop de tentatives)

**Note:** Seuls les statistiques sont trackées, pas les détails individuels pour préserver la vie privée.

### 📄 KYC (mon domaine)

Tous les événements liés aux vérifications KYC que vous effectuez:

- 📄 **Document soumis** - Quand un utilisateur soumet un document
- ✅ **Document approuvé** - Quand vous approuvez un document
- ❌ **Document rejeté** - Quand vous rejetez un document
- 🔄 **Nouveau document demandé** - Quand vous demandez un nouveau document

### 💰 Tontines (stats uniquement)

Statistiques agrégées, pas les détails individuels:

- Nombre de tontines créées par jour
- Nombre de membres ajoutés par jour

### ⚙️ Système

Modifications techniques de la plateforme:

- 🔧 Mode maintenance activé/désactivé
- ⚙️ Paramètres modifiés
- 💾 Sauvegardes créées
- 🌍 Pays ajouté/modifié
- 💳 Méthode de paiement ajoutée/modifiée
- 🎨 Personnalisation modifiée

### ❌ Erreurs

Erreurs techniques à surveiller:

- ❌ Erreurs serveur (500)
- ⚠️ Uploads échoués
- 🔌 Erreurs base de données
- 📧 Erreurs envoi d'email
- 💥 Erreurs critiques

## 📋 Tableau de logs

Chaque ligne contient:

- **Horodatage** - Date et heure précise de l'événement
- **Niveau** - Info / Warning / Error / Critical (avec badge coloré)
- **Type** - Catégorie de l'événement (icône + label)
- **Action/Événement** - Message descriptif
- **IP** - Adresse IP si pertinente (pour erreurs)
- **Détails** - Bouton ⓘ pour voir les métadonnées complètes

## 🔍 Filtres

- **Type d'événement** - Auth, KYC, Tontines, Système, Erreurs
- **Niveau** - Info, Warning, Error, Critical
- **Date** - Range (début et fin)
- **Recherche textuelle** - Recherche dans message, catégorie, métadonnées

## 📊 Statistiques

Cartes affichées en haut:

- **Erreurs critiques** - Nombre dans les dernières 24h (alerte si > 0)
- **KYC traités** - Documents traités aujourd'hui
- **Modifications système** - Nombre cette semaine
- **Uptime du site** - Pourcentage de disponibilité

## 🚨 Alertes temps réel

Alertes automatiques affichées en haut:

- **Erreur critique détectée** - Si erreur critique dans les 24h
- **10+ documents KYC en attente** - Rappel si backlog important
- **Site lent** - Si temps de réponse moyen > 3s
- **Espace disque faible** - (À implémenter avec monitoring)

## 🚫 Ce qui n'est PAS tracké

**PAS DE:**
- Logs d'actions des admins tontine
- Détails des cycles de paiement
- Actions des membres
- Informations personnelles sensibles

**FOCUS SUR:**
- Vos actions (vérifications KYC)
- Modifications système
- Erreurs techniques
- Performances

## 🔧 Système de logging

### Fonction helper

Utilisez `lib/system-logger.js` pour logger les événements:

```javascript
import { logSystemEvent, logKYCApproved } from '@/lib/system-logger'

// Log KYC approval
await logKYCApproved(userId, documentId, reviewerId)

// Log custom event
await logSystemEvent('system_settings', 'Couleur principale modifiée', {
  oldValue: '#0891B2',
  newValue: '#0E7490'
})
```

### Fonctions disponibles

**KYC:**
- `logKYCSubmitted(userId, documentId)`
- `logKYCApproved(userId, documentId, reviewedBy)`
- `logKYCRejected(userId, documentId, reviewedBy, reason)`
- `logKYCRequested(userId, documentId, reviewedBy, reason)`

**Système:**
- `logSystemMaintenance(action, details)`
- `logSystemSettingsChange(setting, oldValue, newValue, changedBy)`
- `logSystemBackup(type, size)`
- `logCountryChange(action, countryCode, details)`
- `logPaymentMethodChange(action, method, details)`
- `logCustomizationChange(component, details)`

**Erreurs:**
- `logServerError(error, endpoint, request)`
- `logUploadError(error, fileName, request)`
- `logDatabaseError(error, query, request)`
- `logEmailError(error, recipient, request)`
- `logCriticalError(error, context, request)`

## 🔄 Auto-refresh

L'interface se met à jour automatiquement toutes les **30 secondes** pour voir les nouveaux événements en temps réel.

## 🗄️ Base de données

### Mise à jour

Exécutez `database-system-logs-updates.sql` pour:
- Créer/vérifier la table `system_logs`
- Ajouter les index nécessaires
- Créer les vues pour statistiques
- Ajouter la fonction de nettoyage

### Rétention

- **Info/Warning**: Conservés 90 jours
- **Error/Critical**: Conservés indéfiniment

## 🎨 Design

- Palette turquoise de SolidarPay
- Badges colorés selon le niveau
- Lignes surlignées pour erreurs critiques
- Modal de détails avec métadonnées JSON

## 🔒 Sécurité

- Seul le Super Admin peut accéder
- Pas d'informations personnelles sensibles
- IP masquée pour les logs normaux
- RLS (Row Level Security) activé

## 📝 Intégration

Pour logger un événement depuis n'importe quelle partie de l'application:

```javascript
import { logSystemEvent } from '@/lib/system-logger'

// Dans un API route
export async function POST(request) {
  try {
    // ... votre code ...
    await logSystemEvent('system_settings', 'Paramètre modifié', {
      setting: 'primary_color',
      value: '#0891B2'
    }, request)
  } catch (error) {
    await logSystemEvent('error_server', error.message, {
      endpoint: '/api/settings'
    }, request)
  }
}
```

## 🚀 Utilisation

1. Accédez à `/admin/logs`
2. Consultez les alertes en haut (si présentes)
3. Vérifiez les statistiques
4. Utilisez les filtres pour trouver des événements spécifiques
5. Cliquez sur ⓘ pour voir les détails complets d'un événement
6. Surveillez les erreurs critiques en priorité

