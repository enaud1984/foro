$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:FORO_DB_URL = "jdbc:postgresql://localhost:5432/foro"
$env:FORO_DB_USER = "foro"
$env:FORO_DB_PASSWORD = "foro_dev_only"
$env:FORO_JWT_SECRET = "local-development-secret-change-before-production-123456"

Push-Location $root
try {
  if (-not (Test-Path "target\foro.war")) { mvn clean package }
  java -jar target\foro.war
} finally {
  Pop-Location
}
