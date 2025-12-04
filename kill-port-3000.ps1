# Script pour trouver et arrêter le processus sur le port 3000

Write-Host "Recherche du processus sur le port 3000..." -ForegroundColor Yellow

try {
    # Méthode 1 : Utiliser Get-NetTCPConnection
    $connection = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    
    if ($connection) {
        $pid = $connection.OwningProcess
        Write-Host "Processus trouvé sur le port 3000 (PID: $pid)" -ForegroundColor Green
        
        # Obtenir les informations du processus
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Nom du processus: $($process.ProcessName)" -ForegroundColor Cyan
            Write-Host "Arrêt du processus..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force
            Write-Host "Processus arrêté avec succès !" -ForegroundColor Green
        } else {
            Write-Host "Le processus n'existe plus." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Aucun processus trouvé sur le port 3000." -ForegroundColor Green
        Write-Host "Le port est disponible." -ForegroundColor Green
    }
} catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
}

Write-Host "`nVous pouvez maintenant lancer: npm run dev" -ForegroundColor Cyan

