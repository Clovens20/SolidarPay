# Script pour trouver et arrêter le processus utilisant le port 3000
$port = 3000

Write-Host "Recherche du processus utilisant le port $port..." -ForegroundColor Yellow

try {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
    
    if ($connection) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction Stop
        
        Write-Host "Processus trouvé:" -ForegroundColor Green
        Write-Host "  - ID: $processId" -ForegroundColor Cyan
        Write-Host "  - Nom: $($process.ProcessName)" -ForegroundColor Cyan
        Write-Host "  - Chemin: $($process.Path)" -ForegroundColor Cyan
        
        $confirmation = Read-Host "Voulez-vous arrêter ce processus? (O/N)"
        
        if ($confirmation -eq 'O' -or $confirmation -eq 'o' -or $confirmation -eq 'Y' -or $confirmation -eq 'y') {
            Stop-Process -Id $processId -Force
            Write-Host "Processus arrêté avec succès!" -ForegroundColor Green
        } else {
            Write-Host "Opération annulée." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Aucun processus trouvé sur le port $port." -ForegroundColor Green
    Write-Host "Le port est disponible." -ForegroundColor Green
}

