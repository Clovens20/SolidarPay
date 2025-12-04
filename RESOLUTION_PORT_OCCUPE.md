# 🔧 Résolution : Port 3000 Déjà Utilisé

## ❌ Erreur
```
Error: listen EADDRINUSE: address already in use ::1:3000
```

## ✅ Solutions

### Solution 1 : Utiliser le Port Alternatif (3001)

Le projet a déjà un script configuré pour utiliser le port 3001 :

```bash
npm run dev:port
```

L'application sera accessible sur : **http://localhost:3001**

---

### Solution 2 : Trouver et Arrêter le Processus sur le Port 3000

#### Sur Windows PowerShell :

1. **Trouver le processus** :
```powershell
netstat -ano | findstr :3000
```

2. **Notez le PID** (dernier numéro)

3. **Arrêter le processus** :
```powershell
taskkill /PID <PID> /F
```

**Exemple** :
```powershell
# Si le PID est 12345
taskkill /PID 12345 /F
```

---

### Solution 3 : Script PowerShell Automatique

Créez un fichier `kill-port.ps1` :

```powershell
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($process) {
    $pid = $process.OwningProcess
    Write-Host "Processus trouvé sur le port $port (PID: $pid)"
    Stop-Process -Id $pid -Force
    Write-Host "Processus arrêté !"
} else {
    Write-Host "Aucun processus trouvé sur le port $port"
}
```

Puis exécutez :
```powershell
.\kill-port.ps1
```

---

### Solution 4 : Modifier le Port par Défaut

Modifiez `package.json` pour changer le port par défaut :

```json
"dev": "cross-env NODE_OPTIONS=--max-old-space-size=512 next dev --hostname localhost --port 3001"
```

---

## ✅ Recommandation

**Utilisez directement** :
```bash
npm run dev:port
```

C'est la solution la plus simple et rapide ! 🚀

L'application sera accessible sur : **http://localhost:3001**

---

## 🔍 Vérifier si le Serveur Tourne Déjà

Si vous avez déjà lancé le serveur dans un autre terminal, vous pouvez simplement :
- Ouvrir http://localhost:3000 dans votre navigateur
- Ou utiliser le port alternatif 3001

---

**Solution la plus rapide : `npm run dev:port` 🎯**

