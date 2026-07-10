$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location (Join-Path $root "frontend")
try {
  npm.cmd ci
  npm.cmd run build -- --configuration production
} finally {
  Pop-Location
}

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Push-Location $root
try {
  mvn clean package
} finally {
  Pop-Location
}

Write-Host "Angular: frontend/dist/frontend/browser"
Write-Host "WAR: target/foro.war"
