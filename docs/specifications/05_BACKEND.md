# FORO — Backend Specification

**Versione:** 3.0  
**Stack:** Spring Boot 3, Spring Security, JWT, PostgreSQL, S3

## 1. Struttura

Ogni area applicativa separa:

- API/controller;
- application service/use case;
- dominio e policy;
- repository port;
- adapter infrastrutturali;
- mapping DTO;
- eventi e audit.

Controller sottili. Logica di business e autorizzazione non risiedono nei controller o nei repository.

## 2. API conventions

- base path `/api/v1`;
- JSON UTF-8;
- ISO 8601;
- `date` senza timezone;
- pagination cursor-based per timeline/email;
- page-based per elenchi stabili;
- `Idempotency-Key` sui comandi a rischio duplicazione;
- ETag o `version` per concorrenza;
- OpenAPI parte della Definition of Done.

### Error envelope

```json
{
  "code": "MATTER_VERSION_CONFLICT",
  "message": "La pratica è stata aggiornata da un altro utente.",
  "fieldErrors": [],
  "correlationId": "uuid",
  "retryable": false
}
```

Nessuna stack trace o informazione interna raggiunge il client.

## 3. Codici HTTP

| Codice | Uso |
|---|---|
| 200/201 | lettura o creazione riuscita |
| 202 | job asincrono accettato |
| 204 | comando senza body |
| 400 | input formalmente errato |
| 401 | autenticazione mancante/non valida |
| 403 | azione non consentita |
| 404 | risorsa assente o cross-tenant |
| 409 | conflitto di stato/duplicato |
| 412 | versione/ETag non valido |
| 422 | regola di business violata |
| 429 | rate limit |
| 503 | dipendenza temporaneamente indisponibile |

## 4. Security context

Il token identifica:

- user ID;
- session ID;
- Studio attivo;
- membership;
- token version;
- scadenza.

I permessi vengono risolti server-side. Non inserire liste di permessi immutabili in token a lunga vita.

## 5. Endpoint groups

### Identity & Studio

- `/auth/login`, `/auth/refresh`, `/auth/logout`;
- `/studios`, `/studios/current`;
- `/studios/current/branding`;
- `/studios/current/join-codes`;
- `/access-requests`;
- `/memberships`;
- `/roles`, `/permissions`.

### Workspace

- `/widget-catalog`;
- `/dashboard-layout`;
- `/widget-instances`;
- `/widget-instances/{id}/configuration`;

### Clienti

- `/clients`;
- `/clients/{id}`;
- `/clients/{id}/timeline`;
- `/clients/duplicate-check`;
- `/clients/merge`;
- `/clients/{id}/privacy-requests`.

### Pratiche

- `/matters`;
- `/matters/{id}`;
- `/matters/{id}/transitions`;
- `/matters/{id}/timeline`;
- `/matters/{id}/members`;
- `/matters/{id}/permissions`.

### Calendario

- `/calendars`;
- `/events`;
- `/events/{id}`;
- `/events/{id}/reminders`;
- `/events/{id}/recurrence-exceptions`.

### Documenti

- `/documents`;
- `/documents/uploads`;
- `/documents/uploads/{id}/complete`;
- `/documents/{id}/versions`;
- `/templates`;
- `/templates/{id}/validate`;
- `/document-generations`.

### Email

- `/email/accounts`;
- `/email/accounts/{id}/sync`;
- `/email/messages`;
- `/email/messages/{id}`;
- `/email/messages/{id}/associations`;
- `/email/outbox`;
- `/email/sync-status`.

## 6. Autorizzazione

Ogni use case verifica:

1. Studio attivo;
2. membership attiva;
3. feature disponibile;
4. permesso di azione;
5. visibilità dell’oggetto;
6. regole di stato;
7. audit se sensibile.

## 7. Upload e document generation

### Upload

`REQUESTED → UPLOADING → VERIFYING → CLEAN | QUARANTINED | FAILED`

### Generazione

`DRAFT → VALIDATING → GENERATING → READY | FAILED`

La generazione è idempotente rispetto a template version, input snapshot e idempotency key.

## 8. Email sync

- checkpoint per account/cartella;
- retry con exponential backoff e jitter;
- deduplica prima della persistenza completa;
- sanitizzazione HTML;
- allegati passano dalla pipeline documentale;
- rate limit provider rispettato;
- credenziali fallite portano account in `SUSPENDED`;
- stato invio `UNKNOWN` non viene ritentato alla cieca.

## 9. Audit

Eventi minimi:

- login/logout e revoca sessione;
- creazione/modifica Studio;
- access request e approvazione;
- ruolo e permesso;
- accesso a pratica ristretta;
- upload/download/versione documento;
- generazione documento;
- configurazione account email;
- invio e associazione email;
- export e privacy request.

## 10. Test

- unit test per regole di dominio;
- integration test con PostgreSQL reale/containerizzato;
- security test allow/deny;
- tenant isolation test;
- contract test OpenAPI;
- idempotency e retry test;
- test ricorrenze calendario;
- test MIME/checksum/quarantena;
- test deduplica e invio incerto email;
- migration test.

## 11. Osservabilità

Metriche:

- latenza e error rate API;
- widget data endpoint;
- queue depth e job age;
- email sync lag;
- conversion/upload failure;
- auth failure e rate limit;
- S3/database error;
- tenant isolation security event.

Log strutturati con correlation ID, tenant pseudonimizzato, actor ID e operation. Mai contenuti legali.

## 12. Definition of Done backend

- regole e permessi testati;
- transazione definita;
- audit definito;
- error code documentato;
- OpenAPI aggiornata;
- idempotenza valutata;
- metriche e log presenti;
- migration inclusa se necessaria;
- nessun segreto o PII nei log;
- acceptance criteria del widget soddisfatti.

