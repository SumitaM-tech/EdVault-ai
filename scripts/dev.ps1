<#
  Starts the whole stack in separate windows: local chain (+ contract), API, and web app.
      powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
      powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 -NoChain   # simulated blockchain
  Web app:  http://localhost:5173      API health: http://localhost:5000/health
#>
param([switch]$NoChain)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path (Join-Path $root 'backend\.env'))) {
  Write-Host 'backend\.env is missing. Run scripts\setup.ps1 first.' -ForegroundColor Red; exit 1
}

if (-not $NoChain) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'start-chain.ps1')
  if ($LASTEXITCODE -ne 0) { exit 1 }
}

Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', 'title EdVault API && npm run dev' -WorkingDirectory (Join-Path $root 'backend')
Start-Sleep -Seconds 4
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', 'title EdVault Web && npm run dev' -WorkingDirectory $root

Write-Host "`nOpen http://localhost:5173  (demo logins are listed in README.md)" -ForegroundColor Green
