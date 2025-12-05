# 📢 Fonctionnalité de Communication dans les Tontines

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de tontine de communiquer avec tous les membres de leur tontine via un système de messages. Les membres peuvent voir les messages de l'administrateur dans leur interface.

## ✅ Ce qui a été implémenté

### 1. Base de données

**Fichier**: `creer-table-messages-tontine.sql`

- Table `tontine_messages` créée pour stocker les messages
- Colonnes :
  - `id` : UUID (clé primaire)
  - `tontineId` : UUID (référence à la tontine)
  - `adminId` : UUID (référence à l'administrateur)
  - `message` : TEXT (contenu du message)
  - `createdAt` : TIMESTAMP (date de création)
  - `updatedAt` : TIMESTAMP (date de mise à jour)
- Index pour améliorer les performances
- Row Level Security (RLS) activé avec politiques :
  - Les admins peuvent gérer leurs propres messages
  - Les membres peuvent lire les messages de leurs tontines
- Trigger pour mettre à jour automatiquement `updatedAt`

### 2. Interface Administrateur

**Fichier**: `components/admin-tontine/CommunicationTab.jsx`

- Formulaire pour envoyer un message aux membres
- Zone de texte pour écrire le message
- Bouton "Envoyer le message"
- Liste des messages envoyés avec :
  - Nom de l'administrateur
  - Date et heure d'envoi
  - Contenu du message
  - Bouton de suppression pour chaque message
- Dialog de confirmation pour la suppression

**Intégration**: 
- Onglet "Communication" ajouté dans la page de gestion de tontine (`app/admin-tontine/tontine/[id]/page.js`)
- L'onglet est maintenant le 4ème onglet (après Vue d'ensemble, Membres, Cycles, Communication, Paramètres)

### 3. Interface Membre

**Fichier**: `components/member/TontineMessages.jsx`

- Affichage des 5 messages les plus récents de l'administrateur
- Design cohérent avec le reste de l'interface (couleurs cyan/bleu)
- Affichage du nom de l'administrateur et de la date
- Formatage du texte avec préservation des sauts de ligne
- Affichage conditionnel (ne s'affiche que s'il y a des messages)

**Intégration**:
- Composant ajouté dans `app/page.js` pour la vue membre
- Affiché juste après le sélecteur de tontine et avant les informations du cycle

## 📋 Utilisation

### Pour l'administrateur

1. Accéder à la page de gestion de sa tontine (`/admin-tontine/tontine/[id]`)
2. Cliquer sur l'onglet "Communication"
3. Écrire un message dans la zone de texte
4. Cliquer sur "Envoyer le message"
5. Le message sera visible par tous les membres de la tontine

### Pour les membres

1. Se connecter à leur compte
2. Sélectionner une tontine
3. Les messages de l'administrateur s'affichent automatiquement en haut de la page
4. Les messages sont triés du plus récent au plus ancien

## 🔒 Sécurité

- Row Level Security (RLS) activé sur la table `tontine_messages`
- Les administrateurs ne peuvent gérer que les messages de leurs propres tontines
- Les membres ne peuvent lire que les messages des tontines auxquelles ils appartiennent
- Vérification des permissions au niveau de la base de données

## 🎨 Design

- Utilisation de la palette de couleurs SolidarPay (cyan/bleu)
- Interface responsive et moderne
- Messages affichés dans des cards avec ombre légère
- Icône MessageSquare pour identifier visuellement la section

## 📝 Notes importantes

1. **Exécution du script SQL** : Avant d'utiliser cette fonctionnalité, il faut exécuter le script `creer-table-messages-tontine.sql` dans Supabase SQL Editor.

2. **Limite d'affichage** : Dans l'interface membre, seuls les 5 messages les plus récents sont affichés pour éviter de surcharger l'interface.

3. **Suppression** : Les administrateurs peuvent supprimer leurs propres messages, mais cette action est irréversible.

4. **Formatage** : Les messages préservent les sauts de ligne et l'espacement grâce à `whitespace-pre-wrap`.

## 🚀 Prochaines améliorations possibles

- Notifications en temps réel pour les nouveaux messages
- Possibilité pour les membres de répondre aux messages
- Historique complet des messages (au-delà de 5)
- Marquer les messages comme lus/non lus
- Pièces jointes dans les messages
- Messages épinglés/importants

