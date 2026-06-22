# Regenerate the downloadable Chrome-extension ZIP that the Marketing dashboard
# serves at /ct-market-publisher.zip (the "הורד תוסף כרום" button).
# Run this AFTER editing anything in extension/ so the download stays in sync:
#   powershell -ExecutionPolicy Bypass -File scripts/zip-extension.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$ext  = Join-Path $root 'extension\*'
$zip  = Join-Path $root 'public\ct-market-publisher.zip'
Compress-Archive -Path $ext -DestinationPath $zip -Force
Write-Host "Built $zip ($((Get-Item $zip).Length) bytes)"
