# FORO — Business Rules

**Versione:** 3.0  
**Autorità:** questo file prevale sulle descrizioni narrative, salvo ADR successivo.

## 1. Convenzioni

- `BR-*` identifica una regola vincolante.
- “Deve” indica obbligo.
- Ogni violazione deve avere un error code stabile.
- Ogni regola sensibile deve avere test allow/deny.

## 2. Studio e accesso

| ID | Regola |
|---|---|
| BR-STD-001 | La registrazione crea lo Studio e il primo account `STUDIO_ADMIN`; non presume una qualifica professionale. |
| BR-STD-002 | Il Titolare può modificare logo, colori, carta intestata e footer. |
| BR-STD-003 | Un collaboratore richiede accesso tramite Codice Studio valido. |
| BR-STD-004 | Una richiesta `PENDING` non concede accesso ai dati operativi. |
| BR-STD-005 | Solo un utente autorizzato può approvare e assegnare ruolo/perimetro. |
| BR-STD-006 | Disabilitare una membership revoca immediatamente le sessioni. |
| BR-STD-007 | Il Codice Studio è hashato, scade ed è revocabile. |
| BR-STD-008 | Il branding non può rendere il prodotto inaccessibile; si usa un fallback. |
| BR-STD-009 | Collaboratori e figure professionali vengono associati allo Studio dall’Amministratore e ricevono ruoli espliciti. |

## 3. Ruoli e permessi

| ID | Regola |
|---|---|
| BR-AUTH-001 | Deny-by-default. |
| BR-AUTH-002 | Il backend è l’autorità per ogni decisione. |
| BR-AUTH-003 | Il tenant deriva dalla sessione, non dal payload. |
| BR-AUTH-004 | La visibilità della pratica ristretta prevale sul ruolo generale. |
| BR-AUTH-005 | Nessun utente può elevare il proprio ruolo. |
| BR-AUTH-006 | Ogni modifica a ruoli/membership genera audit. |
| BR-AUTH-007 | Risorse cross-tenant rispondono come non trovate. |

## 4. Dashboard e widget

| ID | Regola |
|---|---|
| BR-WDG-001 | La Dashboard è la home autenticata. |
| BR-WDG-002 | Il MVP espone cinque widget operativi e il widget amministrativo Collaboratori riservato a `STUDIO_ADMIN`/titolare. |
| BR-WDG-003 | Il widget Email può avere più istanze; gli altri una sola. |
| BR-WDG-004 | Layout e configurazione sono per utente. |
| BR-WDG-005 | Un widget senza permesso viene rimosso al refresh e dalla cache. |
| BR-WDG-006 | Il fallimento di un widget non blocca gli altri. |
| BR-WDG-007 | Ripristina usa il preset del ruolo corrente. |
| BR-WDG-008 | Il layout mobile non sovrascrive quello desktop. |

## 5. Calendario

| ID | Regola |
|---|---|
| BR-CAL-001 | Timestamp salvati in UTC e mostrati nel fuso configurato. |
| BR-CAL-002 | La fine deve essere successiva all’inizio. |
| BR-CAL-003 | Una ricorrenza si modifica per occorrenza, successive o serie. |
| BR-CAL-004 | Eventi di pratica rispettano accessi e riservatezza. |
| BR-CAL-005 | La cancellazione è logica e auditata. |
| BR-CAL-006 | I conflitti sono avvisi, salvo futura policy Studio. |
| BR-CAL-007 | Colore non è l’unico indicatore di calendario/tipo. |
| BR-CAL-008 | Lo stato consegna promemoria è osservabile. |

## 6. Documenti e template

| ID | Regola |
|---|---|
| BR-DOC-001 | Un file originale non viene sovrascritto. |
| BR-DOC-002 | Ogni sostituzione crea una nuova versione. |
| BR-DOC-003 | MIME e checksum sono determinati server-side. |
| BR-DOC-004 | File non verificati restano in quarantena. |
| BR-DOC-005 | URL S3 non sono pubblici o persistiti nel client. |
| BR-DOC-006 | Placeholder obbligatori mancanti bloccano la generazione. |
| BR-DOC-007 | La generazione conserva template/versione/input/branding. |
| BR-DOC-008 | Output Word e PDF sono rappresentazioni dello stesso documento logico. |
| BR-DOC-009 | La preview fallita non elimina o invalida l’originale. |
| BR-DOC-010 | La firma integrata non è disponibile nel MVP. |

## 7. Email

| ID | Regola |
|---|---|
| BR-EML-001 | Credenziali cifrate e mai restituite al frontend. |
| BR-EML-002 | `account + Message-ID` identifica un messaggio; hash se assente. |
| BR-EML-003 | La sincronizzazione ripetuta non crea duplicati. |
| BR-EML-004 | L’associazione suggerita espone motivo e può essere corretta. |
| BR-EML-005 | L’invio usa una idempotency key. |
| BR-EML-006 | Stato `UNKNOWN` non viene ritentato automaticamente. |
| BR-EML-007 | HTML email è sanificato. |
| BR-EML-008 | Allegati passano dalla pipeline di sicurezza. |
| BR-EML-009 | La cancellazione locale non elimina dal provider senza comando esplicito. |
| BR-EML-010 | PEC non è MVP. |

## 8. Clienti

| ID | Regola |
|---|---|
| BR-CLI-001 | Cliente è persona fisica o organizzazione. |
| BR-CLI-002 | CF/P.IVA sono normalizzati e usati per duplicate check. |
| BR-CLI-003 | Un possibile duplicato richiede scelta esplicita. |
| BR-CLI-004 | Il merge mostra una preview ed è auditato. |
| BR-CLI-005 | Il merge mantiene riferimenti storici. |
| BR-CLI-006 | Disattivare un cliente non chiude pratiche. |
| BR-CLI-007 | La timeline non mostra fonti non autorizzate. |
| BR-CLI-008 | Nuovo Documento/Pratica ereditano il cliente. |
| BR-CLI-009 | Una privacy request attiva workflow e legal hold. |

## 9. Pratica / Fascicolo

| ID | Regola |
|---|---|
| BR-PRA-001 | Pratica e Fascicolo interno sono la stessa entità 1:1. |
| BR-PRA-002 | Il Fascicolo PCT futuro è separato. |
| BR-PRA-003 | Ogni pratica ha almeno un cliente. |
| BR-PRA-004 | Il codice pratica è univoco nello Studio. |
| BR-PRA-005 | La chiusura richiede data e motivazione. |
| BR-PRA-006 | La chiusura non cancella elementi collegati. |
| BR-PRA-007 | La pratica ristretta usa ACL esplicita. |
| BR-PRA-008 | Rimuovere un collaboratore revoca subito l’accesso. |
| BR-PRA-009 | La timeline è append-only dal punto di vista storico. |
| BR-PRA-010 | PCT è etichettato come Fase 3 e non operativo. |
| BR-PRA-011 | Una Bozza può non avere Clienti; ogni altro stato richiede almeno un Cliente attivo e l’ultimo Cliente non può essere rimosso. |
| BR-PRA-012 | Il codice `PRA-AAAA-NNNNN` è generato in modo atomico per Studio e anno. |
| BR-PRA-013 | Le transizioni di stato sono controllate dal backend; una Pratica archiviata è in sola lettura fino alla riapertura esplicita. |
| BR-PRA-014 | Il ruolo del Soggetto appartiene a `PraticaSoggetto`; lo stesso Soggetto può avere ruoli diversi nella stessa o in altre Pratiche. |
| BR-PRA-015 | Il responsabile e i membri del team devono avere membership attiva nello Studio; il responsabile è anche membro `RESPONSABILE`. |
| BR-PRA-016 | Una Pratica riservata è visibile al responsabile, ai membri associati e a `STUDIO_ADMIN`; le altre risorse ricevono 404. |
| BR-PRA-017 | Archiviazione e cancellazione logica sono distinte; la cancellazione non elimina Anagrafiche, eventi, documenti, timeline o audit collegati. |
| BR-PRA-018 | La timeline automatica è append-only e contiene soltanto metadati sintetici non sensibili. |
| BR-PRA-019 | Gli importi della Pratica sono non negativi e gestiti come decimali, mai floating point. |
| BR-PRA-020 | Un evento Agenda può collegarsi soltanto a una Pratica visibile, non eliminata e non archiviata dello stesso Studio. |
| BR-PRA-021 | I documenti locali usano storage privato astratto, nome casuale, limite 25 MiB e verifica server-side; il percorso storage non è mai esposto. |

## 10. Audit e privacy

| ID | Regola |
|---|---|
| BR-AUD-001 | Operazioni sensibili producono audit append-only. |
| BR-AUD-002 | L’audit non contiene password, token o contenuti integrali. |
| BR-AUD-003 | Ogni evento contiene actor, tenant, azione, esito e correlation ID. |
| BR-PRV-001 | Dati raccolti sono minimizzati rispetto allo scopo. |
| BR-PRV-002 | Export/cancellazione richiedono autorizzazione e tracciatura. |
| BR-PRV-003 | Legal hold prevale su purge automatico. |

## 11. Errori di business

Formato:

`<AREA>_<CONDIZIONE>`

Esempi:

- `ACCESS_REQUEST_ALREADY_PENDING`;
- `MATTER_RESTRICTED`;
- `MATTER_INVALID_TRANSITION`;
- `CLIENT_DUPLICATE_CANDIDATE`;
- `DOCUMENT_PLACEHOLDER_MISSING`;
- `DOCUMENT_QUARANTINED`;
- `EMAIL_SEND_UNKNOWN`;
- `CALENDAR_RECURRENCE_SCOPE_REQUIRED`.

## 12. Aggiornamento v3.1 — Studio, tema e widget desktop

| ID | Regola |
|---|---|
| BR-STD-010 | Il logo dello Studio viene caricato da file locale in registrazione e nelle impostazioni; non si richiede inserimento manuale di URL/base64 all’utente. |
| BR-STD-011 | Il logo visibile nell’header dopo il login è quello configurato per lo Studio, con fallback al logo FORO. |
| BR-STD-012 | Titolare/Admin può modificare logo, indirizzo, contatti e dati generici dello Studio. |
| BR-STD-013 | Un utente non amministratore non può modificare branding o dati generici dello Studio. |
| BR-WDG-009 | La Dashboard mostra una lista widget a sinistra su desktop. |
| BR-WDG-010 | I widget devono essere spostabili su griglia invisibile tramite drag & drop o alternativa accessibile. |
| BR-WDG-011 | Ogni widget mostra una preview in Dashboard e una vista espansa al click. |
| BR-WDG-012 | Ogni widget può essere chiuso/rimosso dalla Scrivania come una finestra desktop; la chiusura non cancella i dati sottostanti. |
| BR-WDG-013 | Ogni utente può modificare il tema della propria dashboard, ma non il branding dello Studio salvo ruolo autorizzato. |
| BR-WDG-014 | Il widget Collaboratori è visibile e gestibile solo da `STUDIO_ADMIN`/titolare. |
| BR-STD-014 | La creazione di un collaboratore genera una password temporanea inviata via email e da modificare al primo accesso. |
| BR-STD-015 | Avvocati e segreteria non possono modificare dati, branding o impostazioni condivise dello Studio. |

## 13. Aggiornamento v3.2 — Anagrafiche

| ID | Regola |
|---|---|
| BR-ANA-001 | L’entità persistita è `Soggetto`; “Anagrafiche” è il nome della superficie utente. |
| BR-ANA-002 | Cliente e gli altri ruoli non sono tipologie del Soggetto, ma appartengono alla futura relazione con la Pratica. |
| BR-ANA-003 | Persona fisica richiede nome e cognome; gli altri tipi richiedono denominazione. |
| BR-ANA-004 | CF e P.IVA sono normalizzati e alimentano un controllo candidati duplicati tenant-scoped non bloccante. |
| BR-ANA-005 | Studio deriva dal security context e una risorsa cross-tenant risponde 404. |
| BR-ANA-006 | La cancellazione è logica e auditata; le query ordinarie escludono i soggetti eliminati. |
### BR-ANA-020 — Collegamento obbligatorio del documento

Ogni documento deve essere associato ad almeno una Pratica o a un Soggetto dello stesso Studio. Se sono presenti entrambi, il Soggetto deve essere collegato alla Pratica.

### BR-ANA-021 — Visibilità documenti di Pratica

La scheda Anagrafica mostra documenti delle sole Pratiche visibili all’utente. Le Pratiche riservate non autorizzate e le risorse cross-tenant risultano non trovate.

### BR-ANA-022 — Stampa della scheda

La stampa usa dati correnti, esclude note per impostazione predefinita e non include mai dati economici o file allegati. `SCHEDA_ANAGRAFICA` è generata nel contesto Anagrafica; i modelli legali restano predisposti ma non configurati.

### BR-PRA-022 — Generazione documenti della Pratica

La Pratica può generare `SCHEDA_RIEPILOGATIVA_PRATICA` dai soli metadati operativi correnti, senza note interne o dati economici. Il documento è archiviato con origine `GENERATO`, codice template, Pratica e Soggetto opzionale collegato. Lettera di incarico, preventivo, procura alle liti e diffida non producono file finché il relativo contenuto legale non è configurato e approvato.
