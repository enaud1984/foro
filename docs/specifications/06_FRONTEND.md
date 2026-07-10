# FORO — Frontend Specification

**Versione:** 3.0  
**Stack:** Angular 20, Angular Material, Gridster, TailwindCSS

## 1. Obiettivo

Il frontend rende la Dashboard una Scrivania operativa, non una pagina di riepilogo. Deve offrire progressive disclosure, mantenere il contesto e degradare per singolo widget.

## 2. Architettura UI

```text
app-shell
├── identity-context
├── studio-context
├── navigation
├── notification-center
└── workspace
    ├── widget-catalog
    ├── grid-layout
    ├── widget-host
    └── preview-outlet
```

Feature principali:

- `studio`;
- `workspace`;
- `clients`;
- `matters`;
- `calendar`;
- `documents`;
- `email`;
- `shared`;
- `core`.

Le feature non importano internals di altre feature. I componenti condivisi risiedono in `shared` solo se realmente generici.

## 3. Routing

| Route | Scopo |
|---|---|
| `/` | redirect a `/workspace` |
| `/workspace` | Dashboard |
| `/clients` | elenco clienti |
| `/clients/:id` | scheda cliente |
| `/matters` | elenco pratiche |
| `/matters/:id` | Fascicolo |
| `/calendar` | calendario espanso |
| `/documents` | gestione documenti |
| `/email` | posta espansa |
| `/settings/studio` | Studio e branding |
| `/settings/members` | collaboratori |
| `/settings/roles` | ruoli e permessi |

Ogni deep link applica guard di autenticazione e visibilità oggetto.

## 4. Design system

Angular Material fornisce primitive accessibili. TailwindCSS è usato per layout e token approvati, non per creare varianti arbitrarie.

Token minimi:

- colori brand e semantici;
- tipografia;
- spacing;
- radius;
- elevation;
- breakpoint;
- motion;
- z-index;
- focus ring.

White-label non può compromettere contrasto e accessibilità. In caso di colore Studio non conforme, applicare il fallback FORO.

## 5. Widget host

Il contenitore fornisce:

- titolo e icona;
- grab handle;
- resize handle;
- menu contestuale;
- stato loading/error;
- refresh;
- apertura anteprima;
- apertura gestione;
- telemetria.

Il contenuto del widget non modifica direttamente il layout.

## 6. Modalità personalizzazione

Azioni:

- apri “Personalizza Scrivania”;
- trascina dal catalogo;
- sposta;
- ridimensiona;
- configura;
- duplica Email;
- nascondi/rimuovi;
- salva;
- annulla;
- ripristina preset.

Durante il drag:

- card sollevata;
- placeholder tratteggiato;
- zone valide evidenziate;
- annuncio screen reader;
- alternativa tastiera per posizione e dimensione.

## 7. Stato

Separare:

- server state;
- form state;
- UI state;
- layout state;
- session state.

Regole:

- nessun contenuto sensibile in local storage;
- cache sempre scoped a Studio e utente;
- logout/cambio Studio/cambio ruolo invalida cache;
- layout dirty distinto da layout salvato;
- optimistic update solo con rollback definito;
- query di widget indipendenti.

## 8. Form e validazione

- validazione client per feedback, server autorevole;
- errori campo collegati semanticamente;
- valori non persi dopo errore recuperabile;
- conferma uscita per bozza dirty;
- maschere che non impediscono paste/accessibilità;
- date e timezone espliciti;
- autocomplete per cliente e pratica con permessi applicati.

## 9. Pattern di schermata

### Elenchi

- ricerca;
- filtri;
- ordinamento;
- paginazione;
- empty state;
- azione primaria;
- stato filtri condivisibile via URL ove sicuro.

### Dettaglio

- header identitario;
- azioni primarie;
- tab;
- sidebar contestuale;
- timeline;
- audit/storico se autorizzato.

### Preview

- pannello laterale;
- focus trap;
- chiusura con ripristino focus;
- azioni rapide;
- link “Apri gestione completa”.

## 10. Calendario

- viste giorno/settimana/mese/agenda;
- più calendari con checkbox e legenda;
- linea ora corrente;
- eventi accessibili da tastiera;
- resize/drag con alternativa form;
- ricorrenze con scelta ambito;
- dettaglio evento laterale;
- indicatore conflitti non bloccante.

## 11. Documenti

- upload queue con progresso e annullamento;
- stato verifica/quarantena;
- viewer con fallback;
- wizard generazione;
- elenco placeholder mancanti;
- version history;
- download tramite URL firmato;
- nessuna preview di HTML attivo non sanificato.

## 12. Email

- layout a tre pannelli;
- account e cartelle;
- viste salvate;
- messaggi virtualizzati se necessario;
- HTML in contenitore sanificato;
- allegati verificati;
- chip di associazione con motivo;
- stato sync e invio;
- `UNKNOWN` rappresentato senza suggerire invio riuscito.

## 13. Accessibilità

Target WCAG 2.2 AA:

- navigazione completa da tastiera;
- focus visibile;
- landmark e heading coerenti;
- label e descrizioni;
- annunci live per drag/drop e upload;
- contrasto;
- reduced motion;
- zoom 200%;
- tabelle con header;
- error summary.

## 14. Responsive

| Viewport | Comportamento |
|---|---|
| Desktop | griglia completa e viste multi-pane |
| Tablet | griglia adattata, pannelli collassabili |
| Mobile | widget a colonna, operazioni essenziali |

La gestione documentale avanzata e il calendario settimanale possono richiedere una modalità semplificata su mobile, mai una schermata rotta.

## 15. Test frontend

- unit test di componenti/policy;
- test integrazione feature;
- test E2E workflow core;
- test visuale dei breakpoint;
- test accessibilità automatizzati e manuali;
- test drag/drop mouse e tastiera;
- test stati loading/empty/error/forbidden;
- test invalidazione cache.

## 16. Definition of Done frontend

- tutti gli stati disegnati;
- permessi riflessi senza sostituire il backend;
- responsive verificato;
- accessibilità verificata;
- testi italiani esternalizzati;
- telemetria implementata;
- nessun dato sensibile persistito;
- performance misurata;
- acceptance criteria soddisfatti.

## 17. Aggiornamento v3.1 — Scrivania desktop-style e impostazioni

La home autenticata deve essere sempre la Scrivania operativa, non la pagina impostazioni.

- Il logo mostrato in alto dopo il login è quello dello Studio configurato in registrazione o nelle impostazioni.
- La registrazione Studio deve consentire upload logo da disco locale.
- Le impostazioni sono accessibili da icona in alto a destra come pannello/drawer.
- Le impostazioni Studio consentono a titolare/admin di cambiare logo, indirizzo e dati generici.
- Ogni utente associato allo Studio può cambiare solo il tema/colore della propria dashboard.
- Su desktop la lista widget deve essere visibile a sinistra.
- I widget stanno su una griglia invisibile.
- I widget devono essere spostabili con drag & drop, con alternativa accessibile.
- Ogni widget mostra una preview in Dashboard.
- Click su un widget apre una vista espansa con più funzionalità e link alla gestione completa.
- Ogni widget può essere chiuso/rimosso dalla Scrivania come una finestra desktop; i dati sottostanti non vengono cancellati.
