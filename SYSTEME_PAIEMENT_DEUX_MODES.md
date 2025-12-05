# 💳 Système de Paiement - Deux Modes

## 📋 Vue d'ensemble

Les **admin-tontines** peuvent maintenant choisir entre deux modes de paiement lors de la création d'une tontine :

1. **Paiement direct** : Les membres paient directement la personne qui va recevoir la tontine
2. **Paiement via admin** : Les membres paient l'admin-tontine, qui paie ensuite le bénéficiaire une fois que tous les membres ont payé

De plus, chaque membre peut configurer ses méthodes de paiement selon son pays.

## ✅ Modifications Effectuées

### 1. **Base de Données** (`systeme-paiement-deux-modes.sql`)

#### Table `tontines`
- ✅ Ajout du champ `paymentMode` (TEXT) : `'direct'` ou `'via_admin'`
- ✅ Valeur par défaut : `'direct'` (compatible avec l'existant)

#### Nouvelle Table `user_payment_methods`
- ✅ Stocke les méthodes de paiement configurées par chaque membre
- ✅ Colonnes :
  - `userId` : ID du membre
  - `country` : Code pays (CA, FR, US, etc.)
  - `paymentMethod` : Type de méthode (interac, credit_card, bank_transfer, etc.)
  - `paymentDetails` : Détails spécifiques (JSONB) - email, numéro de compte, etc.
  - `isDefault` : Méthode par défaut pour ce pays
  - `isActive` : Actif/inactif

#### Table `contributions`
- ✅ Ajout de `receivedByAdmin` : Indique si le paiement a été reçu par l'admin
- ✅ Ajout de `receivedByAdminAt` : Date de réception par l'admin
- ✅ Ajout de `transferredToBeneficiary` : Indique si l'admin a transféré au bénéficiaire
- ✅ Ajout de `transferredToBeneficiaryAt` : Date de transfert
- ✅ Ajout de `paymentMethod` : Méthode utilisée
- ✅ Ajout de `paymentDetails` : Détails du paiement (JSONB)

#### Table `cycles`
- ✅ Ajout de `allPaymentsReceived` : Tous les paiements reçus par l'admin
- ✅ Ajout de `beneficiaryPaid` : Le bénéficiaire a été payé
- ✅ Ajout de `beneficiaryPaidAt` : Date de paiement du bénéficiaire

#### Vue `cycle_payments_summary`
- ✅ Vue pour faciliter la gestion des paiements avec statistiques

### 2. **Formulaire de Création de Tontine**

#### `app/admin-tontine/new/page.js`
- ✅ Ajout du sélecteur de mode de paiement
- ✅ Deux options :
  - **Paiement direct** : Les membres paient directement le bénéficiaire
  - **Paiement via admin** : Les membres paient l'admin, qui paie ensuite le bénéficiaire
- ✅ Description dynamique selon le mode choisi
- ✅ Email KOHO avec description adaptée selon le mode

### 3. **Interface de Configuration des Méthodes de Paiement**

#### Nouveau Composant : `components/profile/PaymentMethodsTab.jsx`
- ✅ Affichage des méthodes de paiement configurées
- ✅ Ajout d'une nouvelle méthode de paiement
- ✅ Sélection du pays (basé sur `payment_countries`)
- ✅ Sélection de la méthode disponible pour ce pays
- ✅ Formulaire dynamique selon la méthode :
  - **Interac, PayPal, Zelle, Cash App** : Email requis
  - **Virement bancaire, Mobile Money** : Numéro de compte/téléphone + Nom banque
  - **Carte de crédit** : Détails supplémentaires
- ✅ Modification et suppression de méthodes
- ✅ Méthode par défaut

#### `app/profile/page.js`
- ✅ Ajout du tab "Méthodes de paiement" dans le profil
- ✅ Intégration du composant `PaymentMethodsTab`

## 📊 Structure des Données

### Mode de Paiement : Direct
```json
{
  "paymentMode": "direct",
  "kohoReceiverEmail": "beneficiary@example.com"
}
```
- Les membres paient directement `kohoReceiverEmail`
- L'admin n'intervient pas dans le processus de paiement

### Mode de Paiement : Via Admin
```json
{
  "paymentMode": "via_admin",
  "kohoReceiverEmail": "admin@example.com"
}
```
- Les membres paient l'admin (`kohoReceiverEmail` = email de l'admin)
- L'admin suit les paiements reçus
- Une fois tous les paiements reçus, l'admin peut payer le bénéficiaire

### Méthode de Paiement d'un Membre
```json
{
  "userId": "uuid",
  "country": "CA",
  "paymentMethod": "interac",
  "paymentDetails": {
    "email": "member@example.com"
  },
  "isDefault": true,
  "isActive": true
}
```

## 🎯 Flux de Paiement

### Mode Direct (Comportement Actuel)
```
1. Cycle créé avec bénéficiaire
   ↓
2. Membres voient les informations du bénéficiaire
   ↓
3. Membres paient directement le bénéficiaire
   ↓
4. Membres déclarent avoir payé
   ↓
5. Admin valide les paiements
   ↓
6. Cycle complété
```

### Mode Via Admin (Nouveau)
```
1. Cycle créé avec bénéficiaire
   ↓
2. Membres voient les informations de l'admin
   ↓
3. Membres paient l'admin
   ↓
4. Membres déclarent avoir payé
   ↓
5. Admin confirme la réception de chaque paiement
   ↓
6. Une fois tous les paiements reçus, l'admin voit un bouton "Payer le bénéficiaire"
   ↓
7. Admin paie le bénéficiaire
   ↓
8. Cycle complété
```

## 📝 Fichiers Modifiés/Créés

### Scripts SQL
- ✅ `systeme-paiement-deux-modes.sql` - Script complet pour la base de données

### Interface Admin
- ✅ `app/admin-tontine/new/page.js` - Ajout du choix de mode de paiement

### Interface Membre
- ✅ `components/profile/PaymentMethodsTab.jsx` - Nouveau composant pour gérer les méthodes
- ✅ `app/profile/page.js` - Ajout du tab "Méthodes de paiement"

## 🚀 Prochaines Étapes

### À Implémenter (Tâches Restantes)

1. **Interface Admin pour Gérer les Paiements** (`app/admin-tontine/tontine/[id]/page.js`)
   - [ ] Afficher les paiements reçus (mode via_admin)
   - [ ] Confirmer la réception de chaque paiement
   - [ ] Afficher le statut : "X/Y paiements reçus"
   - [ ] Bouton "Payer le bénéficiaire" une fois tous les paiements reçus
   - [ ] Formulaire pour payer le bénéficiaire avec détails

2. **Mise à Jour du Flux de Paiement** (`app/page.js`)
   - [ ] Adapter l'affichage selon le mode de paiement
   - [ ] En mode direct : Afficher les infos du bénéficiaire (comportement actuel)
   - [ ] En mode via_admin : Afficher les infos de l'admin
   - [ ] Utiliser les méthodes de paiement configurées par le membre

3. **API Endpoints**
   - [ ] Endpoint pour confirmer la réception d'un paiement par l'admin
   - [ ] Endpoint pour payer le bénéficiaire
   - [ ] Mettre à jour les endpoints existants pour prendre en compte le mode

## 📌 Notes Importantes

1. **Compatibilité** : Les tontines existantes auront `paymentMode = 'direct'` par défaut (comportement actuel)

2. **Méthodes de Paiement** : Les méthodes disponibles dépendent du pays configuré dans `payment_countries`

3. **Sécurité** : 
   - Seul l'admin de la tontine peut confirmer les paiements reçus
   - Seul l'admin peut payer le bénéficiaire

4. **Validation** : 
   - Les membres doivent avoir configuré au moins une méthode de paiement pour leur pays
   - L'admin doit avoir configuré son email KOHO en mode via_admin

## ✅ Checklist de Fonctionnalités

- [x] Script SQL pour base de données
- [x] Choix du mode de paiement lors de la création de tontine
- [x] Table pour stocker les méthodes de paiement des membres
- [x] Interface pour configurer les méthodes de paiement
- [ ] Interface admin pour gérer les paiements reçus
- [ ] Bouton pour payer le bénéficiaire
- [ ] Mise à jour du flux de paiement dans l'interface membre
- [ ] API endpoints pour gérer les paiements

---

**Date de réalisation** : $(date)
**Statut** : 🔄 **EN COURS D'IMPLÉMENTATION**

