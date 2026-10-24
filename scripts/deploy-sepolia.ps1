<#
  Deploys CredentialRegistry to the Sepolia public testnet and configures the backend.
  Before running, put these in backend\.env :
      SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<key>      (or Alchemy, or https://rpc.sepolia.org)
      DEPLOYER_PRIVATE_KEY=0x<64 hex>                         (a THROWAWAY wallet funded with Sepolia test ETH)
  Run:  powershell -ExecutionPolicy Bypass -File scripts\deploy-sepolia.ps1
#>
$ErrorActionPreference = 'Stop'
$backend = Join-Path (Split-Path -Parent $PSScriptRoot) 'backend'
Set-Location $backend
$envFile = Join-Path $backend '.env'
if (-not (Test-Path $envFile)) { Write-Host 'backend\.env not found. Run scripts\setup.ps1 first.' -ForegroundColor Red; exit 1 }
$envText = Get-Content $envFile -Raw
foreach ($k in 'SEPOLIA_RPC_URL', 'DEPLOYER_PRIVATE_KEY') {
  if ($envText -notmatch "(?m)^$k=\S+") { Write-Host "Missing $k in backend\.env" -ForegroundColor Red; exit 1 }
}
if ($envText -match 'DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') {
  Write-Host 'That is the PUBLIC Hardhat test key. Use your own throwaway wallet for Sepolia.' -ForegroundColor Red; exit 1
}

Write-Host 'Deploying to Sepolia ...' -ForegroundColor Cyan
$out = & npx hardhat run scripts/deploy.cjs --network sepolia 2>&1
$out | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) { Write-Host 'Deployment failed (check test ETH balance and RPC URL).' -ForegroundColor Red; exit 1 }

$addr = ($out | Select-String 'CredentialRegistry deployed to:\s*(0x[0-9a-fA-F]{40})').Matches[0].Groups[1].Value
function Set-EnvValue($text, $key, $value) {
  if ($text -match "(?m)^$key=.*$") { return [regex]::Replace($text, "(?m)^$key=.*$", "$key=$value") }
  return $text.TrimEnd() + "`r`n$key=$value`r`n"
}
$envText = Set-EnvValue $envText 'CONTRACT_ADDRESS' $addr
$envText = Set-EnvValue $envText 'CHAIN_ID' '11155111'
$rpc = ($envText | Select-String '(?m)^SEPOLIA_RPC_URL=(\S+)').Matches[0].Groups[1].Value
$envText = Set-EnvValue $envText 'RPC_URL' $rpc
Set-Content -Path $envFile -Value $envText -NoNewline
Write-Host "`nbackend\.env updated. Restart the backend (scripts\dev.ps1). GET /health should show blockchain mode 'live'." -ForegroundColor Green
Write-Host "Explorer: https://sepolia.etherscan.io/address/$addr"
