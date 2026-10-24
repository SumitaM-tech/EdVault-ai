<#
  EdVault AI - one-time setup (Windows PowerShell 5.1+ / PowerShell 7).
  Run from the project root:
      powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
  Needs: Node.js 20 LTS (or 18/22) and a running PostgreSQL 14+ (see README).
#>
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Fail($m) { Write-Host "ERROR: $m" -ForegroundColor Red; exit 1 }
function Run($exe, $argList) {
  & $exe @argList
  if ($LASTEXITCODE -ne 0) { Fail "'$exe $($argList -join ' ')' failed (exit code $LASTEXITCODE)" }
}

Step 'Checking Node.js'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail 'Node.js not found. Install Node 20 LTS from https://nodejs.org and reopen PowerShell.' }
$nodeMajor = [int]((node -v).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 18) { Fail "Node $nodeMajor is too old. Install Node 20 LTS." }
Write-Host "Node $(node -v), npm $(npm -v)"

Step 'Creating backend\.env'
$envFile = Join-Path $root 'backend\.env'
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $root 'backend\.env.example') $envFile
  $bytes = New-Object 'System.Byte[]' 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = [Convert]::ToBase64String($bytes)
  (Get-Content $envFile) -replace '^JWT_SECRET=.*$', "JWT_SECRET=$secret" | Set-Content $envFile -Encoding ASCII
  Write-Host 'backend\.env created with a random JWT secret.'
} else {
  Write-Host 'backend\.env already exists - left unchanged.'
}

Step 'Installing frontend dependencies'
Run 'npm' @('install', '--no-audit', '--no-fund')

Step 'Installing backend dependencies'
Push-Location (Join-Path $root 'backend')
try {
  Run 'npm' @('install', '--no-audit', '--no-fund')

  Step 'Generating Prisma client'
  Run 'npx' @('prisma', 'generate')

  Step 'Compiling the smart contract'
  Run 'npx' @('hardhat', 'compile')

  Step 'Applying database migrations'
  & npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) {
    Write-Host @"

Could not reach PostgreSQL with the DATABASE_URL in backend\.env
(default: postgresql://edvault:edvault@localhost:5432/edvault).
Create the database first, then re-run this script:
    powershell -ExecutionPolicy Bypass -File scripts\create-db.ps1
"@ -ForegroundColor Yellow
    exit 1
  }

  Step 'Seeding demo accounts'
  Run 'npm' @('run', 'db:seed')
} finally { Pop-Location }

Write-Host "`nSetup complete. Start everything with:" -ForegroundColor Green
Write-Host '    powershell -ExecutionPolicy Bypass -File scripts\dev.ps1' -ForegroundColor Green
