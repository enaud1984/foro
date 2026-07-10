# FORO — Instructions for AI Coding Agents

Questo repository descrive FORO, una piattaforma SaaS cloud per studi legali italiani.

## Missione

Implementare la documentazione approvata senza reinterpretazioni personali. FORO è una **Scrivania Digitale a widget**, non una collezione di moduli.

## Prima di lavorare

Leggere, nell’ordine:

1. `PROJECT_INDEX.md`;
2. `DECISIONS.md`;
3. `docs/specifications/09_PROJECT_RULES.md`;
4. la specifica pertinente;
5. `docs/specifications/07_BUSINESS_RULES.md`.

Consultare il Product Book quando serve il contesto completo. La brochure commerciale non è normativa.

## Scope MVP

Widget ammessi:

- Calendario;
- Documenti;
- Email;
- Clienti;
- Pratiche / Fascicolo.

Capacità trasversali:

- autenticazione;
- Studio;
- collaboratori;
- ruoli e permessi;
- branding;
- Dashboard;
- audit;
- storage;
- osservabilità essenziale.

Non implementare senza decisione:

- task;
- timesheet;
- fatturazione;
- PEC;
- WhatsApp;
- firma digitale integrata;
- calendar sync esterno;
- PCT/PolisWeb;
- AI/RAG;
- reportistica avanzata.

## Regole architetturali

- Angular 20 + Angular Material + Gridster + TailwindCSS.
- Spring Boot 3 + Spring Security + JWT + REST.
- PostgreSQL.
- Amazon S3.
- Docker su AWS.
- Monolite modulare nel MVP.
- Shared-schema multi-tenant con `studio_id` e RLS.

## Regole non negoziabili

- Tenant derivato dal security context, mai fidato dal client.
- Deny-by-default.
- Backend sempre autorevole.
- Test cross-tenant obbligatori.
- Nessun segreto, token, corpo email o contenuto documento nei log.
- Documenti immutabili per versione.
- File non verificati in quarantena.
- Email HTML sanificata.
- Invii idempotenti.
- OpenAPI aggiornato.
- Migrazioni DB versionate.
- Accessibilità WCAG 2.2 AA target.

## Processo

Prima dell’implementazione:

- identificare business rule applicabili;
- confermare permessi e stati;
- elencare assunzioni;
- creare ADR se la decisione è assente.

Durante:

- modifiche piccole;
- confini di dominio rispettati;
- test insieme al comportamento;
- error code stabile;
- audit e telemetria valutati.

Dopo:

- eseguire test rilevanti;
- verificare allow/deny;
- aggiornare documentazione;
- riportare file modificati, test e limiti.

## Ambiguità

Non inventare.

Se un’ambiguità influenza dati, permessi, workflow, scope, provider o azioni distruttive, fermarsi e proporre una decisione in `DECISIONS.md`.

## Precedenza

1. `DECISIONS.md`;
2. `docs/specifications/07_BUSINESS_RULES.md`;
3. specifica di area;
4. Product Book;
5. brochure;
6. v2.

