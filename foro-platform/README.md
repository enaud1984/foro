# FORO Platform

Foundation full-stack di FORO. Produce un WAR backend e usa tre container in ambiente Docker.

## Requisiti

- Java 21;
- Maven 3.9+;
- Node 22 LTS (il build Maven lo installa localmente);
- Docker Desktop per PostgreSQL locale.

## Struttura

```text
foro-platform/
├── backend/                  Spring Boot 3
├── frontend/                 Angular 20
├── docs/                     specifiche di prodotto
├── pom.xml                   build WAR integrato
├── Dockerfile               container Spring Boot/WAR
└── docker-compose.yml
```

## Build

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build -- --configuration production
mvn clean package
```

Output separati:

```text
frontend/dist/frontend/browser/
target/foro.war
```

## Avvio locale con Docker

```powershell
docker-compose up --build
```

- Applicazione Angular: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
- Health: http://localhost:8080/actuator/health

### Utente demo precaricato

Flyway crea uno Studio demo completo di branding, logo e preferenze dashboard.

```text
Studio: Studio Legale Verdi & Associati
Email: admin@studioverdi-demo.it
Password: DemoFORO2026!
Ruolo: STUDIO_ADMIN
```

Se il database Docker esiste già, la migration `V3__demo_studio_seed.sql` viene applicata al successivo avvio del backend. Per ripartire da zero:

```powershell
docker compose down -v
docker compose up --build
```

## Solo frontend

```powershell
cd frontend
npm start
```

Configurare un proxy verso `http://localhost:8080` per usare le API in sviluppo.

## API foundation

- `POST /api/v1/auth/register/studio`
- `POST /api/v1/auth/login`
- `GET /api/v1/workspace/widgets`

## Sicurezza

Le credenziali presenti in `docker-compose.yml` sono esclusivamente locali. In produzione usare secret manager, TLS, MFA e token refresh/revoca secondo le specifiche.

## Stato

I tre container sono:

1. `nginx` — serve Angular e inoltra API/Swagger/Actuator;
2. `backend` — Spring Boot eseguito dal WAR;
3. `postgres` — PostgreSQL;

## Avvio locale senza Compose completo

```powershell
.\scripts\start-local-db.ps1
.\scripts\run-local-backend.ps1
cd frontend
npm.cmd start
```

- Angular dev server: http://localhost:4200
- Backend/Swagger: http://localhost:8080/swagger-ui.html

In questa modalità Angular usa `proxy.conf.json`; Nginx non serve. Nginx entra in gioco con Docker Compose o nel deployment.

Questa foundation include login, registrazione Studio + primo Amministratore, piani e pagamento simulati, JWT, PostgreSQL/Flyway, Swagger, health check e Dashboard placeholder. I cinque widget saranno implementati per fasi.
