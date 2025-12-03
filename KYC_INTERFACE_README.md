# 🔐 Interface Vérifications KYC - Super Admin

## Vue d'ensemble

L'interface de vérifications KYC permet au Super Admin de gérer tous les documents d'identité soumis par les utilisateurs de SolidarPay. C'est la seule interaction directe avec les utilisateurs.

## 📋 Fonctionnalités

### Tabs de navigation

- **⏳ En attente** - Documents nécessitant une vérification (badge avec nombre)
- **✅ Approuvées** - Historique des documents approuvés
- **❌ Rejetées** - Historique des documents rejetés
- **📋 Toutes** - Tous les documents

### Cartes de vérification (grille 3 colonnes)

Chaque document affiche:
- Photo du membre (initiales)
- Nom complet
- Email
- Pays (avec drapeau)
- Date de soumission
- **Score automatique** avec barre de progression:
  - 90-100%: Vert "Haute confiance"
  - 70-89%: Orange "Revue recommandée"
  - 0-69%: Rouge "Faible confiance"
- Preview du document (thumbnail)
- Bouton "Examiner"

### Modal "Examen du Document"

#### Section 1 - Infos du membre (gauche):
- Photo de profil
- Nom complet
- Email
- Téléphone
- Pays
- Date d'inscription
- Type de compte (Membre / Admin Tontine)

#### Section 2 - Document (centre, GRAND):
- Image du document uploadé
- Contrôles: Zoom +/-, Rotation, Plein écran
- Type de document détecté
- Bouton "Télécharger l'original"

#### Section 3 - Analyse automatique (droite):

**Résultats de la vérification automatique:**
- Score global (cercle de progression)
- Checklist:
  * ✅/❌ Visage détecté
  * ✅/❌ Qualité suffisante
  * ✅/❌ Texte lisible
  * ✅/❌ Document non expiré
  * ✅/⚠️/❌ Nom correspond

**Informations extraites:**
- Nom sur le document
- Date de naissance
- Numéro du document
- Date d'expiration
- Pays d'émission

**Comparaison avec l'inscription:**
- Nom inscrit vs Nom du document (highlight si différent)
- Alerte si incohérences

#### Zone de décision (bas du modal):

**3 BOUTONS PRINCIPAUX:**

1. **✅ APPROUVER** (vert):
   - Confirmation: "Approuver le document de [Nom] ?"
   - Action: Statut KYC → Vérifié
   - Notification automatique au membre

2. **❌ REJETER** (rouge):
   - Dropdown de raisons prédéfinies:
     * Document illisible ou de mauvaise qualité
     * Document expiré
     * Informations ne correspondent pas
     * Type de document non accepté
     * Photo floue ou incomplète
     * Document frauduleux suspecté
   - Textarea pour commentaire additionnel (optionnel)
   - Confirmation: "Rejeter le document ?"
   - Action: Statut KYC → Rejeté
   - Notification avec raison au membre

3. **🔄 DEMANDER NOUVEAU DOCUMENT** (orange):
   - Dropdown de raisons (mêmes que rejeter)
   - Textarea pour instructions spécifiques
   - Exemple: "Veuillez soumettre une photo plus claire en pleine lumière"
   - Action: Statut KYC → Nouveau document requis
   - Notification détaillée au membre

#### Historique (onglet dans le modal):

Si le membre a soumis plusieurs documents:
- Timeline des soumissions
- Documents précédents (thumbnails)
- Décisions précédentes (date, décision, raison)

#### Actions rapides:

- Si score > 95% et tout vert: Bouton "Approbation rapide" (1 clic)
- Si déjà 3+ rejets: Alerte "Ce compte a déjà été rejeté plusieurs fois"

### Statistiques (haut de page)

- Total en attente (nombre avec alerte si > 10)
- Traitées aujourd'hui
- Taux d'approbation (%)
- Temps moyen de traitement (heures)

### Filtres

- Par pays
- Par score automatique (90-100%, 70-89%, 0-69%)
- Par date de soumission
- Par type de document

### Tri

- Plus anciens d'abord (par défaut)
- Plus récents d'abord
- Score le plus bas d'abord
- Score le plus haut d'abord

## 📧 Notifications automatiques

### Quand j'approuve:
Email: "✅ Félicitations ! Votre identité a été vérifiée. Vous pouvez maintenant participer pleinement à SolidarPay."

### Quand je rejette:
Email: "❌ Vérification non approuvée - Raison: [raison]. Vous pouvez soumettre un nouveau document dans votre profil."

### Quand je demande nouveau document:
Email: "🔄 Nouveau document requis - [raison et instructions]. Veuillez soumettre un nouveau document."

## 🔄 Auto-refresh

L'interface se met à jour automatiquement toutes les 60 secondes pour voir les nouveaux documents.

## 🗄️ Base de données

### Tables utilisées

- `kyc_documents` - Documents KYC avec:
  - `autoScore` - Score automatique (0-100)
  - `analysisResults` - Résultats JSON de l'analyse
  - `extractedInfo` - Informations extraites JSON

### Mise à jour

Exécutez le script `database-kyc-updates.sql` pour ajouter:
- Champ `autoScore`
- Champ `analysisResults` (JSONB)
- Champ `extractedInfo` (JSONB)
- Index pour les performances
- Vue pour les statistiques

## 🎨 Design

- Palette turquoise de SolidarPay
- Interface responsive
- Modal full-screen pour l'examen
- Cartes avec hover effects
- Badges colorés selon le statut

## 🔒 Sécurité

- Seul le Super Admin peut accéder
- Tous les accès aux documents sont loggés
- Watermark automatique sur les téléchargements (à implémenter côté serveur)
- RLS (Row Level Security) activé

## 📝 Notes techniques

### Score automatique

Pour l'instant, le score est calculé en mode "mock". En production, il faudra:
1. Intégrer une API d'IA/ML pour l'analyse OCR
2. Détecter les visages (Face API)
3. Vérifier l'authenticité (fraude detection)
4. Extraire les informations automatiquement

### Analyse automatique

Les résultats de l'analyse sont simulés. En production:
1. Utiliser OCR pour extraire le texte
2. Détecter les visages
3. Vérifier la qualité de l'image
4. Vérifier la date d'expiration
5. Comparer les noms

## 🚀 Utilisation

1. Accédez à `/admin/kyc`
2. Consultez les statistiques en haut
3. Utilisez les filtres pour trouver des documents
4. Cliquez sur "Examiner" sur une carte
5. Examinez le document dans le modal
6. Prenez une décision (Approuver/Rejeter/Demander nouveau)
7. L'utilisateur sera notifié automatiquement

## 📧 Templates d'email

Les templates d'email sont dans `lib/kyc-emails.js`:
- `sendKYCApprovalEmail()` - Email d'approbation
- `sendKYCRejectionEmail()` - Email de rejet
- `sendKYCNewDocumentEmail()` - Email de demande de nouveau document

Tous utilisent Resend pour l'envoi.

## 🔄 Prochaines étapes

- [ ] Implémenter l'analyse OCR réelle
- [ ] Intégrer la détection de fraude
- [ ] Ajouter le watermark côté serveur
- [ ] Logs détaillés d'accès aux documents
- [ ] Export des statistiques
- [ ] Recherche avancée

