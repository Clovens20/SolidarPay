# 📋 Guide d'Accès KYC pour les Membres - SolidarPay

## 🎯 Où trouver le bouton pour envoyer vos documents KYC ?

### Option 1 : Alerte visible sur la page principale ✅

**Quand vous êtes connecté en tant que membre**, si vous n'avez pas encore vérifié votre identité, une **carte d'alerte orange** s'affiche automatiquement en haut de votre page d'accueil avec :

- 🔒 Icône de vérification
- **Titre** : "Vérifiez votre identité"
- **Message** : Explication de l'importance de la vérification
- **Bouton** : "Soumettre mon document" (orange) qui vous redirige directement vers la page de vérification

Cette alerte apparaît :
- Si vous n'avez jamais soumis de document
- Si votre document est en attente
- Si votre document a été rejeté

### Option 2 : Bouton "Mon Profil" dans le header ✅

En haut à droite de la page principale, vous trouverez :
- **Bouton "Mon Profil"** avec l'icône utilisateur 👤
- En cliquant dessus, vous accédez à `/profile`
- Dans cette page, cliquez sur l'onglet **"Vérification d'identité"**

### Option 3 : Navigation directe

Vous pouvez aussi aller directement à : **`/profile`** puis cliquer sur l'onglet "Vérification d'identité"

## 📍 Localisation exacte

### Sur la page principale (`/`)

1. **Header (en haut à droite)** :
   ```
   [Votre nom] [Badge Membre] [👤 Mon Profil] [Déconnexion]
   ```

2. **Carte d'alerte (en haut du contenu principal)** :
   - Visible automatiquement si KYC non vérifié
   - Bouton orange "Soumettre mon document"
   - Peut être masquée avec le bouton ❌

### Sur la page Profil (`/profile`)

1. **Onglets** :
   - "Mon Profil" - Vos informations personnelles
   - **"Vérification d'identité"** - Section KYC ← **ICI**

2. **Dans l'onglet "Vérification d'identité"** :
   - **Carte "Statut de vérification"** : Affiche votre statut actuel
   - **Bouton "Télécharger mon document"** ou **"Soumettre un document"**
   - **Zone de drag & drop** pour uploader votre document

## 🚀 Comment soumettre votre document

1. **Cliquez sur le bouton** "Soumettre mon document" (dans l'alerte ou dans le profil)
2. **Glissez-déposez** votre document ou **cliquez pour sélectionner**
3. **Types acceptés** : JPG, PNG, PDF (max 5MB)
4. **Analyse automatique** : Votre document sera analysé en 2-5 secondes
5. **Résultat** : Vous recevrez immédiatement un résultat (Approuvé, Rejeté, ou En attente de revue manuelle)

## ⚠️ Important

- **Limite** : Maximum 5 soumissions par utilisateur
- **Vérification automatique** : La plupart des documents sont approuvés automatiquement
- **Revue manuelle** : Si votre score est entre 50-84%, le Super Admin devra examiner votre document
- **Notification** : Vous recevrez un email avec le résultat

## 🔍 Résumé des emplacements

| Emplacement | Quand visible | Action |
|-------------|---------------|--------|
| **Carte d'alerte orange** (page principale) | Si KYC non vérifié | Bouton "Soumettre mon document" |
| **Bouton "Mon Profil"** (header) | Toujours | Redirige vers `/profile` |
| **Onglet "Vérification d'identité"** (`/profile`) | Toujours | Section complète KYC |
| **Bouton dans KYCStatus** | Si aucun document | "Soumettre un document" |

## 💡 Conseil

**La façon la plus rapide** : Utilisez la carte d'alerte orange qui apparaît automatiquement sur votre page d'accueil quand vous n'avez pas encore vérifié votre identité.

---

**Tout est prêt pour que vous puissiez vérifier votre identité facilement !** ✅

