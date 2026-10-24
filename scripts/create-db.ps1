<#
  Creates the 'edvault' PostgreSQL role and database using psql.
      powershell -ExecutionPolicy Bypass -File scripts\create-db.ps1
  psql must be on PATH (installed with PostgreSQL; typically C:\Program Files\PostgreSQL\16\bin).
#>
$ErrorActionPreference = 'Stop'
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  $guess = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
  if ($guess) { $psql = $guess.FullName } else { Write-Host 'psql not found. Install PostgreSQL for Windows from https://www.postgresql.org/download/windows/' -ForegroundColor Red; exit 1 }
} else { $psql = $psql.Source }

$secure = Read-Host 'Password of the PostgreSQL "postgres" superuser' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
try {
  & $psql -U postgres -h localhost -v ON_ERROR_STOP=0 -c "CREATE ROLE edvault LOGIN PASSWORD 'edvault';"
  & $psql -U postgres -h localhost -v ON_ERROR_STOP=0 -c "CREATE DATABASE edvault OWNER edvault;"
  Write-Host 'Database ready (role edvault / database edvault). Re-run scripts\setup.ps1.' -ForegroundColor Green
} finally { Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue }
