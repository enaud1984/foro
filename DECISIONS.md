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
