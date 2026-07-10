# FORO — Project Rules

**Versione:** 3.0  
**Scopo:** regole vincolanti per persone e agenti AI che implementano FORO.

## 1. Ordine delle fonti

In caso di conflitto:

1. `DECISIONS.md`;
2. `docs/specifications/07_BUSINESS_RULES.md`;
3. specifica dell’area;
4. `docs/product-book/FORO_Product_Book_v3.docx`;
5. brochure commerciale;
6. documenti v2.

La brochure è materiale di comunicazione, non una specifica tecnica.

## 2. Scope

- Non aggiungere funzionalità future al MVP.
- Non reinterpretare FORO come suite di moduli.
- Non creare un sesto widget.
- Non implementare PEC quando è richiesta Email.
- Non implementare firma integrata, PCT o AI nel MVP.
- Non introdurre task/fatturazione/reporting senza decisione.

## 3. Regola di ambiguità

Se un requisito cambia:

- modello dati;
- permessi;
- workflow;
- scope MVP;
- dipendenza esterna;
- comportamento distruttivo;

creare o aggiornare una ADR in `DECISIONS.md` prima di implementare.

## 4. Sicurezza

- deny-by-default;
- tenant dal security context;
- nessun segreto nel codice;
- nessuna PII nei log;
- backend autorevole;
- test cross-tenant obbligatorio;
- URL S3 firmati e brevi;
- file non verificati in quarantena;
- HTML email sanificato;
- audit per operazioni sensibili.

## 5. Dati

- migration versionate;
- nessuna modifica manuale al DB;
- UUID;
- optimistic locking;
- date/timezone espliciti;
- FK tenant-aware;
- nessun JSON non schematizzato per dati core;
- documenti versionati e immutabili nello storage.

## 6. API

- `/api/v1`;
- OpenAPI aggiornato;
- error code stabile;
- idempotenza valutata;
- paginazione;
- correlation ID;
- nessuna stack trace;
- authorization test.

## 7. Frontend

- Dashboard come home;
- pattern widget → preview → gestione;
- tutti gli stati UI;
- responsive;
- accessibilità;
- layout drag/drop con alternativa tastiera;
- nessun contenuto sensibile persistito localmente;
- cache invalidata su cambio identità/perimetro.

## 8. Qualità

Ogni feature include:

- acceptance criteria;
- test unitari;
- test integrazione;
- test autorizzazione;
- audit/telemetria;
- gestione errori;
- documentazione;
- migration se necessaria.

## 9. Definition of Ready

Una storia è pronta quando:

- attore e obiettivo sono chiari;
- precondizioni e permessi sono definiti;
- happy path e alternative sono documentati;
- campi e validazioni sono noti;
- regole hanno ID;
- errori attesi sono elencati;
- acceptance criteria sono testabili;
- dipendenze esterne sono disponibili o simulate.

## 10. Definition of Done

- comportamento conforme;
- test verdi;
- isolamento tenant verificato;
- audit e osservabilità presenti;
- accessibilità verificata;
- documentazione aggiornata;
- nessun requisito futuro esposto come operativo;
- review Product, UX e Security proporzionata al rischio.

## 11. Regole per agenti AI

Un agente deve:

1. leggere `CLAUDE.md`, `PROJECT_INDEX.md` e la specifica pertinente;
2. citare gli ID delle business rule implementate;
3. non inventare campi o stati;
4. proporre ADR per decisioni non documentate;
5. mantenere modifiche piccole e verificabili;
6. non cambiare file estranei;
7. eseguire test proporzionati;
8. dichiarare limiti e assunzioni.

Un agente non deve:

- aggirare permessi per far passare un test;
- usare dati reali nei fixture;
- disabilitare RLS;
- rendere pubblici file S3;
- inserire dipendenze senza motivazione;
- presentare mockup commerciali come contratto UI pixel-perfect.

## 12. Branching e commit

Quando il repository sarà inizializzato:

- branch brevi;
- commit atomici;
- messaggi che descrivono intento;
- PR con scope, regole coperte, test, rischio e screenshot;
- nessuna modifica generata massivamente senza review.

## 13. Lingua di progetto

- Tutti i commenti su GitHub, PR, issue, review e discussioni tecniche devono essere in italiano.
- Tutta la documentazione di progetto deve essere in italiano.
- I commenti nel codice devono essere in italiano.
- Nei file applicativi di proprietà FORO, usare nomi italiani per variabili, funzioni, classi, componenti, servizi, DTO e metodi.
- Sono ammesse parole tecniche obbligate dal framework o dalle librerie, ad esempio `Controller`, `Service`, `Repository`, `Component`, `Observable`, `Signal`, `Request`, `Response`, quando fanno parte di convenzioni tecniche consolidate.
- Gli endpoint, le chiavi JSON e i nomi database già esistenti possono essere mantenuti se cambiarli romperebbe compatibilità o aumenterebbe il rischio; le nuove superfici devono preferire terminologia italiana coerente.
