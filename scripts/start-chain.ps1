<#
  Starts a local Hardhat blockchain and deploys the CredentialRegistry contract.
  The node keeps running in this window; the deployed address is written to
  backend\deployments\localhost.json, which the backend reads automatically.
      powershell -ExecutionPolicy Bypass -File scripts\start-chain.ps1
  NOTE: restarting the chain wipes it. Re-run this script, then restart the backend.
#>
$ErrorActionPreference = 'Stop'
$backend = Join-Path (Split-Path -Parent $PSScriptRoot) 'backend'
Set-Location $backend

Write-Host 'Starting local Hardhat node on http://127.0.0.1:8545 ...' -ForegroundColor Cyan
$node = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npx hardhat node' -WorkingDirectory $backend -PassThru -WindowStyle Minimized

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 8545 -WarningAction SilentlyContinue).TcpTestSucceeded) { $ready = $true; break }
}
if (-not $ready) { Write-Host 'Hardhat node did not start within 60 seconds.' -ForegroundColor Red; exit 1 }

Write-Host 'Deploying contract ...' -ForegroundColor Cyan
& npx hardhat run scripts/deploy.cjs --network localhost
if ($LASTEXITCODE -ne 0) { Write-Host 'Deployment failed.' -ForegroundColor Red; exit 1 }

Write-Host "`nLocal chain is running (process id $($node.Id)). Close its window or run: Stop-Process -Id $($node.Id)" -ForegroundColor Green
