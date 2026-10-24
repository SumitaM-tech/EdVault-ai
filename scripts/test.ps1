<#
  Runs every automated test: smart-contract tests, backend tests, frontend tests, type checks and the production build.
      powershell -ExecutionPolicy Bypass -File scripts\test.ps1
#>
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Run($dir, $exe, $argList) {
  Push-Location $dir
  try {
    & $exe @argList
    if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $exe $($argList -join ' ') in $dir" -ForegroundColor Red; exit 1 }
  } finally { Pop-Location }
}

$backend = Join-Path $root 'backend'
Run $backend 'npx' @('hardhat', 'test')
Run $backend 'npm' @('run', 'test')
Run $backend 'npm' @('run', 'typecheck')
Run $root 'npm' @('run', 'test')
Run $root 'npm' @('run', 'build')
Write-Host "`nAll checks passed." -ForegroundColor Green
