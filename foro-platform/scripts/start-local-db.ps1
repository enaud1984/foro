$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  docker-compose up -d postgres
} finally {
  Pop-Location
}
Write-Host "PostgreSQL disponibile su localhost:5432"
