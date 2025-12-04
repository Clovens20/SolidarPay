# 📸 Instructions pour Ajouter le Logo SolidarPay

## 📋 Étapes pour Ajouter Votre Logo

### Option 1 : Logo dans le Dossier Public (Recommandé)

1. **Téléchargez votre logo** dans le dossier `public/`
   - Nom du fichier : `logo.png` ou `logo.svg`
   - Format recommandé : PNG avec fond transparent ou SVG
   - Taille recommandée : 512x512 pixels minimum

2. **Le logo sera automatiquement utilisé** dans toute l'application

### Option 2 : Logo via l'Interface Super Admin

1. Connectez-vous en Super Admin : `/admin/login`
2. Allez dans **Personnalisation** (`/admin/customization`)
3. Dans la section **Logo**, entrez l'URL de votre logo
   - Peut être une URL externe (ex: `https://votredomaine.com/logo.png`)
   - Ou un chemin local (ex: `/logo.png`)
4. Cliquez sur **Sauvegarder**

## 🎨 Format du Logo

Votre logo doit être :
- Format : PNG, SVG, ou JPG
- Fond : Transparent (recommandé) ou blanc
- Taille : Minimum 512x512 pixels
- Aspect ratio : Carré (1:1) recommandé

## 📁 Emplacement du Fichier

Si vous choisissez l'option 1, placez votre logo ici :
```
SolidarPay/
└── public/
    └── logo.png  (ou logo.svg)
```

## ✅ Vérification

Après avoir ajouté le logo :
1. Rechargez la page
2. Le logo devrait apparaître dans :
   - L'en-tête de l'application
   - La landing page
   - L'interface Super Admin (si configuré)

## 🔄 Fallback

Si le logo n'est pas trouvé :
- Un logo par défaut avec la lettre "S" s'affichera
- Le logo par défaut utilise les couleurs de la marque SolidarPay

---

**Note** : Le code est déjà configuré pour utiliser votre logo automatiquement ! Il suffit de le placer dans le dossier `public/` avec le nom `logo.png` ou `logo.svg`.

