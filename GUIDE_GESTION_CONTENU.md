# 📝 Guide de Gestion du Contenu - SolidarPay

## 🎯 Vue d'ensemble

Le système de gestion de contenu permet au Super Admin de modifier en temps réel :
- **La page d'accueil (Landing Page)** : Toutes les sections
- **Le Footer** : Toutes les sections et liens
- **Les Pages Légales** : CGU, Confidentialité, À propos, Contact

## 🗄️ Base de données

### Tables créées

1. **`landing_page_content`** : Stocke le contenu de chaque section de la landing page
2. **`footer_content`** : Stocke le contenu de chaque section du footer
3. **`legal_pages`** : Stocke le contenu des pages légales

### Script SQL

Exécutez le script `database-content-management.sql` dans Supabase SQL Editor pour créer les tables et les données initiales.

## 📍 Accès aux interfaces

Dans le Super Admin (`/admin`), vous trouverez trois nouveaux menus dans la sidebar :

1. **🏠 Page d'Accueil** (`/admin/landing-page`)
2. **📄 Footer** (`/admin/footer`)
3. **⚖️ Pages Légales** (`/admin/legal-pages`)

## 🏠 Gestion de la Page d'Accueil

### Sections disponibles

1. **Hero Section** : Titre principal, sous-titre, description
2. **Qu'est-ce que SolidarPay ?** : Section d'introduction
3. **Pourquoi SolidarPay ?** : Section des avantages
4. **Comment ça marche ?** : Section explicative
5. **Pour qui est SolidarPay ?** : Section cible
6. **Témoignages** : Section des témoignages
7. **Call to Action** : Section finale d'incitation

### Fonctionnalités

- ✅ Activer/Désactiver chaque section
- ✅ Modifier le titre, sous-titre, description
- ✅ Ajouter une URL d'image
- ✅ Réorganiser l'ordre d'affichage
- ✅ Aperçu en temps réel
- ✅ Sauvegarde automatique par section

### Comment modifier

1. Accédez à `/admin/landing-page`
2. Cliquez sur une section pour l'étendre
3. Modifiez les champs désirés
4. Cliquez sur "Sauvegarder"
5. Les modifications sont immédiates sur la page publique

## 📄 Gestion du Footer

### Sections disponibles

1. **Marque** : Logo et description de SolidarPay
2. **Navigation** : Liens de navigation
3. **Légal** : Liens vers les pages légales
4. **Contact** : Email et téléphone
5. **Réseaux sociaux** : Liens vers les réseaux sociaux

### Fonctionnalités

- ✅ Activer/Désactiver chaque section
- ✅ Ajouter/Modifier/Supprimer des liens
- ✅ Modifier les informations de contact
- ✅ Ajouter des réseaux sociaux
- ✅ Supprimer complètement une section
- ✅ Aperçu en temps réel

### Comment modifier

1. Accédez à `/admin/footer`
2. Cliquez sur une section pour l'étendre
3. Modifiez le contenu :
   - Pour les liens : Ajoutez un label et une URL
   - Pour le contact : Modifiez email et téléphone
   - Pour les réseaux sociaux : Ajoutez la plateforme et l'URL
4. Cliquez sur "Sauvegarder"
5. Les modifications apparaissent immédiatement

## ⚖️ Gestion des Pages Légales

### Pages disponibles

1. **À propos** (`/about`) : Page à propos de SolidarPay
2. **Contact** (`/contact`) : Page de contact
3. **CGU** (`/terms`) : Conditions Générales d'Utilisation
4. **Confidentialité** (`/privacy`) : Politique de Confidentialité

### Fonctionnalités

- ✅ Créer et modifier le contenu de chaque page
- ✅ Modifier le titre et la meta description (SEO)
- ✅ Éditeur de contenu HTML/Markdown
- ✅ Activer/Désactiver chaque page
- ✅ Aperçu en temps réel
- ✅ Lien direct vers la page publique

### Comment modifier

1. Accédez à `/admin/legal-pages`
2. Sélectionnez l'onglet de la page à modifier
3. Modifiez le titre, la meta description et le contenu
4. Le contenu peut être en HTML ou Markdown
5. Cliquez sur "Sauvegarder"
6. La page est mise à jour immédiatement

### Format du contenu

Le contenu peut être écrit en :
- **HTML** : Utilisez des balises HTML standard
- **Markdown** : Format texte simplifié (sera converti en HTML)

Exemple HTML :
```html
<h1>Titre</h1>
<p>Paragraphe de texte.</p>
<ul>
  <li>Point 1</li>
  <li>Point 2</li>
</ul>
```

## 🔒 Sécurité

- Seul le **Super Admin** peut modifier le contenu
- Toutes les modifications sont **loguées** dans `system_logs`
- Les pages légales désactivées ne sont pas accessibles publiquement
- RLS (Row Level Security) activé sur toutes les tables

## 📊 Logs

Toutes les modifications sont automatiquement enregistrées dans `system_logs` avec :
- Type d'action : `landing_page_updated`, `footer_updated`, `legal_page_updated`
- Section/page modifiée
- Timestamp

## 🚀 Utilisation rapide

### Première configuration

1. Exécutez `database-content-management.sql` dans Supabase
2. Connectez-vous en Super Admin
3. Accédez aux nouvelles pages dans la sidebar
4. Commencez à modifier le contenu !

### Modifier le footer

1. Allez dans `/admin/footer`
2. Cliquez sur "Navigation" ou "Légal"
3. Ajoutez/modifiez les liens
4. Sauvegardez

### Créer une page légale

1. Allez dans `/admin/legal-pages`
2. Sélectionnez l'onglet (ex: "CGU")
3. Écrivez votre contenu en HTML
4. Sauvegardez
5. La page est disponible sur `/terms`

## 💡 Astuces

- **Aperçu** : Utilisez le bouton "Aperçu" pour voir les modifications en temps réel
- **Désactiver temporairement** : Utilisez le switch pour masquer une section sans la supprimer
- **Ordre d'affichage** : Modifiez `display_order` pour réorganiser les sections
- **HTML** : Vous pouvez utiliser du HTML complet dans les pages légales pour un formatage avancé

---

**Tout est prêt ! Vous pouvez maintenant gérer tout le contenu de votre site depuis l'interface Super Admin !** 🎉

