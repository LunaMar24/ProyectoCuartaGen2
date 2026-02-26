param(
    [string]$Profile = "preview",
    [string]$Platform = "android",
    [switch]$ClearCache = $true,
    [switch]$Monitor
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

Write-Host "Proyecto:" (Get-Location).Path

$cmdArgs = @("build", "-p", $Platform, "--profile", $Profile, "--non-interactive", "--no-wait", "--json")
if ($ClearCache) {
    $cmdArgs += "--clear-cache"
}

$jsonText = eas @cmdArgs
$build = $jsonText | ConvertFrom-Json

Write-Host "Build lanzado: $($build.id)"
if ($build.buildDetailsPageUrl) {
    Write-Host "URL: $($build.buildDetailsPageUrl)"
}

if ($Monitor) {
    & (Join-Path $PSScriptRoot "eas-monitor-build.ps1") -BuildId $build.id
}
