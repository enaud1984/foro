# FORO — Decision Log

Le decisioni accettate prevalgono sugli altri documenti. Una decisione modificata non viene cancellata: viene marcata `SUPERSEDED` e collegata alla sostituta.

## Stati

- `ACCEPTED`: vincolante;
- `PROPOSED`: non ancora vincolante;
- `SUPERSEDED`: sostituita;
- `REJECTED`: valutata e non adottata.

## Decisioni accettate

### DEC-001 — Scrivania Digitale

- **Stato:** ACCEPTED
- **Decisione:** FORO è una Scrivania Digitale; la Dashboard è l’ingresso e il baricentro.
- **Conseguenza:** nessuna navigazione primaria basata su moduli indipendenti.

### DEC-002 — MVP a cinque widget

- **Stato:** ACCEPTED
- **Decisione:** Calendario, Documenti, Email, Clienti, Pratiche/Fascicolo.
- **Conseguenza:** ogni altra capacità è trasversale o futura.

### DEC-003 — Progressive disclosure

- **Stato:** ACCEPTED
- **Decisione:** widget → anteprima → gestione completa.
- **Conseguenza:** le azioni frequenti restano nella Dashboard; le viste complete sono route dedicate.

### DEC-004 — Pratica uguale Fascicolo interno

- **Stato:** ACCEPTED
- **Decisione:** relazione 1:1 con medesima identità.
- **Conseguenza:** nessuna seconda entità “fascicolo interno”.

### DEC-005 — Fascicolo PCT separato

- **Stato:** ACCEPTED
- **Decisione:** il futuro Fascicolo PCT è esterno e collegabile.
- **Conseguenza:** PCT non modifica l’identità della Pratica.

### DEC-006 — Email duplicabile

- **Stato:** ACCEPTED
- **Decisione:** il widget Email può avere istanze multiple.
- **Conseguenza:** account e filtri per istanza; gli altri widget sono singoli nel MVP.

### DEC-007 — Multi-tenancy

- **Stato:** ACCEPTED
- **Decisione:** PostgreSQL shared-schema, `studio_id` e RLS.
- **Conseguenza:** isolamento applicativo più difesa DB; test tenant obbligatori.

### DEC-008 — Stack

- **Stato:** ACCEPTED
- **Decisione:** Angular 20, Angular Material, Gridster, TailwindCSS; Spring Boot 3, Spring Security, JWT, REST; PostgreSQL; Amazon S3; Docker; AWS.

### DEC-009 — Monolite modulare MVP

- **Stato:** ACCEPTED
- **Decisione:** un deploy backend con confini di dominio.
- **Conseguenza:** microservizi richiedono nuova ADR.

### DEC-010 — Associazioni automatiche controllate

- **Stato:** ACCEPTED
- **Decisione:** suggerimenti cliente/pratica spiegabili e correggibili.
- **Conseguenza:** nessun matching opaco irreversibile.

### DEC-011 — Documenti immutabili per versione

- **Stato:** ACCEPTED
- **Decisione:** ogni modifica crea una versione; oggetto S3 non sovrascritto.

### DEC-012 — Firma nel MVP

- **Stato:** ACCEPTED
- **Decisione:** predisposizione e ricaricamento di file firmato esternamente.
- **Conseguenza:** firma integrata è futura.

### DEC-013 — Email ordinaria nel MVP

- **Stato:** ACCEPTED
- **Decisione:** IMAP/SMTP multi-account.
- **Conseguenza:** PEC e OAuth provider-specifico sono fasi successive salvo decisione.

### DEC-014 — Calendario multi-calendario

- **Stato:** ACCEPTED
- **Decisione:** esperienza ispirata alla familiarità Outlook, con calendari personali, Studio, udienze, scadenze e risorse sovrapponibili.
- **Conseguenza:** nessun uso del brand o copia pixel-perfect di Outlook.

### DEC-015 — AI fuori MVP

- **Stato:** ACCEPTED
- **Decisione:** preparare metadata, permessi e audit; non implementare AI nel MVP.

### DEC-016 — Registrazione dello Studio

- **Stato:** ACCEPTED
- **Decisione:** la registrazione crea lo Studio e un primo account `STUDIO_ADMIN`, senza presumere che sia un avvocato.
- **Conseguenza:** collaboratori e figure professionali vengono invitati e associati successivamente dall’area amministrativa dello Studio.

### DEC-017 — Branding Studio e personalizzazione utente

- **Stato:** ACCEPTED
- **Data:** 2026-07-10
- **Decisione:** logo, nome, indirizzo, contatti e palette istituzionale sono configurazioni dello Studio modificabili solo da `STUDIO_ADMIN`/titolare. Ogni utente può invece personalizzare la propria dashboard: modalità chiara/scura, densità, accento personale e layout widget.
- **Conseguenza:** la personalizzazione personale non modifica il brand condiviso dello Studio; i permessi backend devono impedire modifiche di branding ai collaboratori.

### DEC-018 — Dashboard desktop-style

- **Stato:** ACCEPTED
- **Data:** 2026-07-10
- **Decisione:** dopo il login la home è una Dashboard operativa con catalogo widget a sinistra e widget su griglia invisibile. Le impostazioni sono accessibili da icona in alto a destra e non sostituiscono la Scrivania.
- **Conseguenza:** i widget devono supportare preview, drag & drop/spostamento, chiusura dalla Scrivania e vista espansa al click. La registrazione Studio include upload logo da file locale.

### DEC-019 — Lingua italiana per progetto e codice

- **Stato:** ACCEPTED
- **Data:** 2026-07-10
- **Decisione:** commenti GitHub, PR, issue, review, documentazione, commenti nel codice e naming del codice applicativo FORO devono essere in italiano.
- **Conseguenza:** nuove variabili, funzioni, classi, servizi, DTO e componenti devono usare nomi italiani, salvo termini tecnici imposti da framework/librerie o compatibilità già esistenti.

### DEC-020 — Gestione Collaboratori nella Dashboard

- **Stato:** PROPOSED
- **Data:** 2026-07-18
- **Contesto:** è stata richiesta una superficie Dashboard per consentire al titolare dello Studio di creare avvocati, segretari o altri titolari/amministratori associati allo Studio, assegnando dati anagrafici, email, ruolo e password iniziale. La richiesta impatta scope MVP, modello permessi e workflow di onboarding perché le decisioni vigenti definiscono il MVP a cinque widget e collocano collaboratori e figure professionali nell’area amministrativa dello Studio.
- **Opzioni:**
  1. mantenere i Collaboratori come capacità amministrativa accessibile dalle impostazioni/area Studio, senza introdurre un sesto widget;
  2. introdurre un widget Collaboratori visibile solo a `STUDIO_ADMIN`/titolare, aggiornando lo scope MVP;
  3. esporre nella Dashboard solo una scorciatoia/preview amministrativa verso la gestione Studio, senza trattarla come widget MVP autonomo.
- **Decisione:** da approvare prima dell’implementazione. In ogni opzione, il backend resta autorevole: il tenant deriva dal security context, solo `STUDIO_ADMIN`/titolare può creare o assegnare ruoli, nessun utente può elevare il proprio ruolo e ogni utente può modificare solo la propria password dalle impostazioni personali.
- **Conseguenze:** se viene approvato un widget Collaboratori, occorre aggiornare `DEC-002`, `BR-WDG-002`, le specifiche Dashboard/Frontend/Backend/Database e aggiungere test allow/deny, cross-tenant e audit per creazione collaboratore, assegnazione ruolo e cambio password.
- **Documenti interessati:** `DECISIONS.md`, `docs/specifications/03_WIDGETS.md`, `docs/specifications/05_BACKEND.md`, `docs/specifications/06_FRONTEND.md`, `docs/specifications/07_BUSINESS_RULES.md`, `docs/specifications/09_PROJECT_RULES.md`.

## Open Decisions

### OPEN-001 — Limiti documenti

- **Stato:** PROPOSED
- **Da decidere:** dimensione massima, tipi MIME e quota per Studio.
- **Owner:** Product + Security + Architecture.

### OPEN-002 — Conversione documenti

- **Stato:** PROPOSED
- **Da decidere:** provider/servizio per DOCX→PDF e preview.
- **Owner:** Architecture.

### OPEN-003 — Provider email supportati

- **Stato:** PROPOSED
- **Da decidere:** matrice IMAP/SMTP, limiti e criteri di certificazione.
- **Owner:** Product + Architecture.

### OPEN-004 — Accesso titolare a pratica ristretta

- **Stato:** PROPOSED
- **Da decidere:** accesso implicito, break-glass o esclusione.
- **Owner:** Product + Legal + Security.

### OPEN-005 — Retention

- **Stato:** PROPOSED
- **Da decidere:** retention di documenti, email, audit, backup e legal hold.
- **Owner:** DPO + Legal + Product.

### OPEN-006 — AWS topology

- **Stato:** PROPOSED
- **Da decidere:** servizi gestiti, rete, compute, database, job e osservabilità.
- **Owner:** Architecture + Operations.

### OPEN-007 — Mobile MVP

- **Stato:** PROPOSED
- **Da decidere:** funzioni complete vs essenziali e breakpoint supportati.
- **Owner:** Product + UX.

## Template ADR

```markdown
### DEC-NNN — Titolo

- **Stato:** PROPOSED
- **Data:** YYYY-MM-DD
- **Contesto:** problema e vincoli.
- **Opzioni:** alternative considerate.
- **Decisione:** scelta.
- **Conseguenze:** vantaggi, costi e rischi.
- **Documenti interessati:** file da aggiornare.
```
