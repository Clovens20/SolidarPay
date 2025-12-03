# 🧪 Guide : Tester le Projet SolidarPay en Local (Sans Domaine)

Ce guide vous explique comment tester complètement votre application SolidarPay sur votre machine locale, sans avoir besoin d'un domaine personnalisé.

## 📋 Prérequis

- ✅ Node.js 18+ installé
- ✅ Compte Supabase (gratuit)
- ✅ Compte Resend (gratuit, pour les emails)
- ✅ Un navigateur web moderne

## 🚀 Étape 1 : Configuration des Variables d'Environnement

### 1.1 Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet :

```bash
# Dans le terminal, à la racine du projet
touch .env
```

### 1.2 Configuration Supabase

1. **Créez un compte Supabase** (gratuit) : https://supabase.com
2. **Créez un nouveau projet**
3. **Récupérez vos clés** :
   - Allez dans **Settings** → **API**
   - Copiez :
     - `Project URL` (ex: `https://xxxxx.supabase.co`)
     - `anon public` key

4. **Ajoutez dans `.env`** :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici
```

### 1.3 Configuration Resend (Emails)

1. **Créez un compte Resend** : https://resend.com
2. **Générez une API Key** :
   - Allez dans **API Keys**
   - Cliquez sur **Create API Key**
   - Copiez la clé

3. **Ajoutez dans `.env`** :

```env
# Resend Configuration
RESEND_API_KEY=re_votre_api_key_ici
RESEND_FROM_EMAIL=SolidarPay <onboarding@resend.dev>
```

### 1.4 Fichier `.env` complet

Votre fichier `.env` devrait ressembler à :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=SolidarPay <onboarding@resend.dev>
```

## 🗄️ Étape 2 : Configuration de la Base de Données Supabase

### 2.1 Exécuter les Scripts SQL

1. **Ouvrez Supabase Dashboard**
2. **Allez dans SQL Editor**
3. **Exécutez les scripts dans l'ordre** :

```bash
# Option 1 : Utiliser le script consolidé
# Exécutez : database-complete.sql
```

OU exécutez les scripts individuellement dans cet ordre :

1. `database-schema.sql` - Schéma de base
2. `database-super-admin.sql` - Tables Super Admin
3. `database-kyc-updates.sql` - Updates KYC
4. `database-kyc-automatic-updates.sql` - Système KYC automatique
5. `database-admin-tontine-updates.sql` - Tables Admin Tontine
6. `database-system-logs-updates.sql` - Logs système
7. `database-frequency-weekly-update.sql` - Fréquence hebdomadaire
8. `fix-sql-errors.sql` - Corrections

### 2.2 Configurer les URLs Autorisées dans Supabase

**IMPORTANT** : Supabase doit accepter les requêtes depuis `localhost`.

1. **Allez dans Supabase Dashboard**
2. **Settings** → **Authentication** → **URL Configuration**
3. **Ajoutez ces URLs** dans "Site URL" et "Redirect URLs" :

```
http://localhost:3000
http://localhost:3000/**
http://127.0.0.1:3000
http://127.0.0.1:3000/**
```

4. **Cliquez sur "Save"**

### 2.3 Configurer Row Level Security (RLS)

Les scripts SQL incluent déjà la configuration RLS, mais vérifiez que :
- Toutes les tables ont RLS activé
- Les politiques sont correctement configurées

## 💻 Étape 3 : Installer les Dépendances

```bash
# Installer toutes les dépendances
npm install
```

Ou si vous utilisez Yarn :

```bash
yarn install
```

## 🏃 Étape 4 : Lancer le Serveur de Développement

```bash
# Démarrage standard (port 3000)
npm run dev
```

Ou si le port 3000 est occupé :

```bash
# Port alternatif (3001)
npm run dev:port
```

Le serveur démarre sur : **http://localhost:3000**

## 🌐 Étape 5 : Tester l'Application

### 5.1 Accès aux Interfaces

1. **Page principale** : http://localhost:3000
   - Inscription/Connexion pour membres

2. **Super Admin** : http://localhost:3000/admin/login
   - Connexion Super Admin

3. **Admin Tontine** : http://localhost:3000/admin-tontine
   - Après connexion avec un compte admin

4. **Profil Membre** : http://localhost:3000/profile
   - Après connexion avec un compte member

### 5.2 Créer un Compte Super Admin

Pour tester l'interface Super Admin :

1. **Via l'interface Supabase** :
   ```sql
   -- Dans Supabase SQL Editor
   UPDATE users 
   SET role = 'super_admin' 
   WHERE email = 'votre-email@example.com';
   ```

2. **Ou créer directement** :
   ```sql
   INSERT INTO users (id, email, "fullName", role)
   VALUES (
     gen_random_uuid(),
     'admin@solidarpay.com',
     'Super Admin',
     'super_admin'
   );
   ```

### 5.3 Tester les Fonctionnalités

✅ **Tests recommandés** :
- [ ] Inscription d'un nouveau membre
- [ ] Connexion membre
- [ ] Upload KYC (document d'identité)
- [ ] Connexion Super Admin
- [ ] Vérification KYC dans `/admin/kyc`
- [ ] Création d'une tontine
- [ ] Ajout de membres à une tontine

## 📧 Étape 6 : Tester les Emails

Les emails Resend fonctionnent en local ! Vérifiez :

1. **Dashboard Resend** : https://resend.com/emails
2. Les emails envoyés apparaîtront dans les logs
3. Pour tester sans envoyer réellement, utilisez le mode développement

## 🔧 Options Avancées : Partager en Local

Si vous voulez tester depuis un autre appareil (téléphone, tablette) :

### Option A : ngrok (Recommandé)

1. **Installez ngrok** : https://ngrok.com/download

2. **Lancez ngrok** :
   ```bash
   ngrok http 3000
   ```

3. **Utilisez l'URL fournie** :
   ```
   https://xxxxx.ngrok.io
   ```

4. **Mettez à jour Supabase** :
   - Ajoutez l'URL ngrok dans "Redirect URLs"
   - Format : `https://xxxxx.ngrok.io/**`

### Option B : Cloudflare Tunnel (Gratuit)

1. **Installez Cloudflare Tunnel** : https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

2. **Créez un tunnel** :
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Utilisez l'URL fournie** et mettez à jour Supabase

### Option C : Partagez via Réseau Local

1. **Trouvez votre IP locale** :
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. **Modifiez le script dev** pour écouter sur toutes les interfaces :
   ```bash
   # Dans package.json, modifiez :
   "dev": "next dev --hostname 0.0.0.0 --port 3000"
   ```

3. **Accédez depuis un autre appareil** :
   ```
   http://VOTRE_IP_LOCALE:3000
   ```

## 🐛 Dépannage

### Problème : "Supabase connection failed"

**Solution** :
- Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est correct dans `.env`
- Vérifiez que la clé `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correcte
- Redémarrez le serveur après modification de `.env`

### Problème : "Authentication redirect error"

**Solution** :
- Ajoutez `http://localhost:3000/**` dans Supabase Auth URLs
- Vérifiez que le Site URL est bien `http://localhost:3000`

### Problème : "Port 3000 already in use"

**Solution** :
```bash
# Utilisez le port 3001
npm run dev:port

# Ou tuez le processus sur le port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Problème : "Cannot find module"

**Solution** :
```bash
# Réinstallez les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problème : "Database errors"

**Solution** :
- Vérifiez que tous les scripts SQL ont été exécutés
- Vérifiez l'ordre d'exécution dans `SQL_EXECUTION_GUIDE.md`
- Exécutez `fix-sql-errors.sql` pour corriger les erreurs

## ✅ Checklist de Test

Avant de déployer en production, testez :

- [ ] ✅ Application démarre sur localhost:3000
- [ ] ✅ Inscription fonctionne
- [ ] ✅ Connexion fonctionne
- [ ] ✅ Interface Super Admin accessible
- [ ] ✅ Interface Admin Tontine accessible
- [ ] ✅ Upload KYC fonctionne
- [ ] ✅ Base de données accessible
- [ ] ✅ Emails fonctionnent (vérifier Resend dashboard)
- [ ] ✅ Toutes les pages chargent correctement
- [ ] ✅ Aucune erreur dans la console navigateur
- [ ] ✅ Aucune erreur dans les logs serveur

## 📝 Notes Importantes

1. **`.env` ne doit JAMAIS être commité** (déjà dans `.gitignore`)
2. **Les variables `NEXT_PUBLIC_*` sont exposées au client** - Ne mettez pas de secrets dedans
3. **Supabase fonctionne parfaitement avec localhost** - Pas besoin de domaine
4. **Les emails Resend fonctionnent en local** - Vérifiez le dashboard

## 🚀 Prochaine Étape : Déploiement

Une fois les tests locaux réussis, vous pouvez déployer sur :
- **Vercel** (recommandé pour Next.js) : https://vercel.com
- **Netlify** : https://netlify.com
- **Railway** : https://railway.app

Pour le déploiement, configurez les mêmes variables d'environnement dans votre plateforme.

## 💡 Astuces

1. **Mode développement** : Les erreurs sont plus détaillées
2. **Hot reload** : Les changements se reflètent automatiquement
3. **DevTools** : Ouvrez la console navigateur (F12) pour voir les logs
4. **Logs Supabase** : Dashboard → Logs → API Logs

---

**Vous êtes prêt à tester ! 🎉**

En cas de problème, consultez la section Dépannage ou ouvrez une issue.

