# 🔧 Guide de Configuration Super Admin

## Étape 1: Créer les tables de base de données

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase:

```sql
-- Voir le fichier: database-super-admin.sql
```

Ce script crée:
- `kyc_documents` - Documents d'identité
- `payment_countries` - Pays et méthodes de paiement
- `platform_customization` - Personnalisation
- `system_logs` - Logs système
- `maintenance_schedule` - Planifications de maintenance

## Étape 2: Ajouter le rôle super_admin

Modifiez la contrainte de la table users pour accepter 'super_admin':

```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'member', 'super_admin'));
```

## Étape 3: Créer votre compte super admin

### Option A: Mettre à jour un utilisateur existant

1. Créez un compte utilisateur normal via l'interface
2. Exécutez dans Supabase SQL Editor:

```sql
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'votre-email@example.com';
```

### Option B: Créer un nouveau super admin

1. Créez un utilisateur dans Supabase Auth (Authentication > Users > Add user)
2. Exécutez dans Supabase SQL Editor:

```sql
INSERT INTO users (id, email, "fullName", role)
VALUES (
  'uuid-du-compte-auth',  -- ID du compte créé dans Auth
  'admin@solidarpay.com',
  'Super Admin',
  'super_admin'
);
```

## Étape 4: Tester l'accès

1. Démarrez le serveur: `npm run dev`
2. Allez sur: `http://localhost:3000/admin/login`
3. Connectez-vous avec vos identifiants super admin

## Structure créée

```
app/admin/
├── layout.js          # Layout avec auth et sidebar
├── login/
│   └── page.js        # Page de connexion
├── page.js            # Dashboard avec stats
├── kyc/
│   └── page.js        # Vérifications KYC
├── countries/
│   └── page.js        # Pays & Méthodes
├── customization/
│   └── page.js        # Personnalisation
├── settings/
│   └── page.js        # Paramètres
├── maintenance/
│   └── page.js        # Maintenance
└── logs/
    └── page.js        # Logs système

components/admin/
├── AdminHeader.jsx    # Header avec logo et profil
└── AdminSidebar.jsx   # Navigation sidebar
```

## Palette de couleurs utilisée

Les couleurs turquoise sont configurées dans:
- `tailwind.config.js` - Ajout des couleurs `solidarpay.*`
- `app/globals.css` - Background par défaut

Couleurs disponibles:
- `bg-solidarpay-primary` → #0891B2
- `bg-solidarpay-secondary` → #0E7490
- `bg-solidarpay-bg` → #F0F9FF
- `text-solidarpay-text` → #0F172A
- `border-solidarpay-border` → #E0F2FE

## Fonctionnalités implémentées

✅ Authentification super admin
✅ Dashboard avec statistiques
✅ Graphiques (Recharts)
✅ Vérifications KYC
✅ Gestion Pays & Méthodes
✅ Personnalisation
✅ Paramètres
✅ Maintenance
✅ Logs système
✅ Header avec notifications
✅ Sidebar avec navigation
✅ Palette turquoise

## Notes importantes

- L'interface ne gère PAS les utilisateurs directement
- L'interface ne gère PAS les tontines directement
- Focus uniquement sur les statistiques et aspects techniques
- Toutes les tables utilisent Row Level Security (RLS)

## Prochaines étapes (optionnelles)

1. Implémenter l'upload de documents KYC
2. Ajouter des notifications en temps réel
3. Créer des exports de statistiques
4. Ajouter plus de graphiques au dashboard
5. Implémenter la recherche avancée dans les logs

