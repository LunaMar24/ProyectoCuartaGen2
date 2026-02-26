param(
    [Parameter(Mandatory = $true)]
    [string]$BuildId,

    [int]$IntervalSeconds = 45,

    [int]$MaxChecks = 120
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

Write-Host "Monitoreando build: $BuildId"
Write-Host "Proyecto:" (Get-Location).Path

for ($i = 1; $i -le $MaxChecks; $i++) {
    $build = eas build:view $BuildId --json | ConvertFrom-Json

    Write-Host ("{0} STATUS={1} UPDATED={2}" -f (Get-Date -Format o), $build.status, $build.updatedAt)

    if ($build.status -ne "IN_PROGRESS") {
        if ($build.status -eq "FINISHED") {
            Write-Host "Build finalizado correctamente."
            if ($build.artifacts.buildUrl) {
                Write-Host "APK: $($build.artifacts.buildUrl)"
            }
            if ($build.artifacts.applicationArchiveUrl) {
                Write-Host "Archivo: $($build.artifacts.applicationArchiveUrl)"
            }
        }
        else {
            Write-Host "Build finalizado con estado: $($build.status)"
            if ($build.logFiles) {
                Write-Host "Logs:"
                $build.logFiles | ForEach-Object { Write-Host " - $_" }
            }
            exit 1
        }

        break
    }

    Start-Sleep -Seconds $IntervalSeconds
}

if ($i -gt $MaxChecks) {
    Write-Host "Se alcanzó el máximo de verificaciones ($MaxChecks) y el build sigue en progreso."
    exit 2
}
