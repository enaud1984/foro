# FORO — Widget System

**Versione:** 3.0  
**Stato:** specifica funzionale normativa

## 1. Contratto comune

Ogni widget dichiara:

- chiave e versione;
- feature e permessi richiesti;
- taglie supportate;
- configurazione Studio, ruolo, utente e istanza;
- endpoint e strategia di caching;
- stati UI;
- eventi di telemetria;
- azioni rapide;
- route della gestione completa.

## 2. Stati obbligatori

| Stato | Comportamento |
|---|---|
| Loading | skeleton stabile, senza layout shift evitabile |
| Ready | dati e azioni autorizzate |
| Empty | spiegazione e CTA consentita |
| Partial error | dati disponibili, avviso locale e retry |
| Error | messaggio non tecnico, correlation ID e retry sicuro |
| Forbidden | nessun dettaglio sull’esistenza dei dati |
| Degraded | ultimo aggiornamento visibile, azioni rischiose disabilitate |

## 3. Layout e interazione

- Gridster governa posizione e dimensione.
- I widget si spostano dalla maniglia nell’header.
- Il ridimensionamento usa una maniglia visibile e alternativa da tastiera.
- Il catalogo “Widget disponibili” supporta drag & drop e aggiunta tramite pulsante.
- “Salva layout” persiste il layout dell’utente.
- “Ripristina” torna al preset di ruolo.
- Il layout mobile è distinto e non sovrascrive quello desktop.
- Il widget Email è duplicabile; gli altri non lo sono nel MVP.

Taglie:

| Taglia | Uso |
|---|---|
| 3×2 | sintesi e prime priorità |
| 4×3 | lista o vista operativa standard |
| 6×3 | filtri rapidi e maggiore dettaglio |
| Mobile | card a colonna ordinabile |

## 4. Progressive disclosure

1. **Widget:** sintesi e azioni frequenti.
2. **Anteprima:** pannello laterale o modale senza perdere la Dashboard.
3. **Gestione completa:** route dedicata con tutte le funzioni.

## 5. Calendario

### Visione

Agenda ispirata alla familiarità di Outlook, senza copiarne il brand. Deve gestire più calendari sovrapponibili:

- personale;
- Studio;
- udienze;
- scadenze;
- risorse/sale;
- eventuali calendari di colleghi autorizzati.

### Widget

- prossimi eventi;
- mini calendario;
- colori e legenda;
- linea ora corrente;
- nuovo evento;
- apertura anteprima.

### Vista completa

- giorno, settimana, mese e agenda;
- pannello “I miei calendari”;
- sovrapposizione e toggle;
- drag & drop eventi;
- partecipanti;
- cliente e pratica;
- promemoria multipli;
- ricorrenze;
- conflitti come avviso.

### Regole

- salvataggio in UTC e visualizzazione nel fuso configurato;
- fine successiva all’inizio;
- modifica ricorrenza con ambito esplicito;
- colori non sono unico indicatore;
- evento di pratica rispetta i permessi della pratica;
- cancellazione logica e auditata.

## 6. Documenti

### Widget

- ultimi file;
- upload;
- nuovo documento da modello;
- accesso a procura, mandato, diffida e informativa;
- stato conversione e firma esterna.

### Vista completa

- cartelle per fascicolo;
- elenco e ricerca;
- preview PDF/immagini;
- version history;
- tag e metadati;
- upload con progresso;
- generazione guidata;
- esportazione Word/PDF;
- stato firma esterna.

### Template

Workflow: bozza → test placeholder → pubblicazione → archiviazione.

La generazione conserva:

- template e versione;
- valori risolti;
- branding usato;
- autore e timestamp;
- output prodotti.

### Regole

- mai sovrascrivere un file: creare una versione;
- placeholder obbligatorio mancante blocca;
- MIME rilevato server-side;
- file sospetto in quarantena;
- preview fallita non elimina l’originale;
- URL S3 mai pubblico;
- eliminazione logica con retention.

## 7. Email

### Widget

- account o vista salvata;
- non lette, recenti e con allegati;
- compose;
- ultimo sync;
- associazioni suggerite.

### Vista completa

- multi-account IMAP/SMTP;
- cartelle;
- lista messaggi;
- reading pane;
- thread;
- allegati sicuri;
- filtri;
- ricerca;
- associazione a Cliente/Pratica;
- viste duplicabili.

### Regole

- credenziali cifrate e mai restituite al client;
- deduplica `account + Message-ID`, con hash di fallback;
- associazione automatica spiegabile e correggibile;
- invio con idempotency key;
- stato incerto richiede riconciliazione;
- HTML sanitizzato;
- eliminazione in FORO non elimina dal provider senza comando esplicito;
- PEC non è MVP.

## 8. Clienti

### Widget

- ricerca incrementale;
- clienti recenti;
- filtri rapidi;
- nuovo cliente;
- anteprima contatti e pratiche.

### Vista completa

- persona fisica o giuridica;
- recapiti multipli;
- pratiche;
- documenti;
- email;
- appuntamenti;
- timeline;
- privacy;
- storico;
- azioni Nuovo Documento, Nuova Pratica, Nuovo Evento, Invia Email.

### Regole

- controllo duplicati su CF/P.IVA e similarità;
- merge autorizzato, previewabile e auditato;
- disattivazione cliente non chiude pratiche;
- timeline filtra le fonti non autorizzate;
- richiesta privacy avvia un workflow, non una cancellazione cieca.

## 9. Pratiche / Fascicolo

### Principio

Nel dominio FORO:

> Pratica = Fascicolo interno, relazione 1:1 e medesimo identificativo.

Il futuro Fascicolo PCT è separato e collegabile.

### Widget

- pratiche recenti e assegnate;
- stato;
- responsabile;
- prossima scadenza;
- alert;
- nuova pratica.

### Vista completa

- Panoramica;
- Timeline;
- Documenti;
- Email;
- Calendario;
- Collaboratori;
- quick actions contestuali.

### Regole

- almeno un cliente;
- codice univoco per Studio;
- transizioni di stato controllate;
- chiusura con data e motivazione;
- pratica ristretta con ACL esplicita;
- rimozione collaboratore revoca accesso immediatamente;
- timeline append-only dal punto di vista storico;
- PCT mostrato soltanto come “previsto in Fase 3”.

## 10. Telemetria minima

Per ogni widget:

- load started/completed/failed;
- empty state shown;
- preview opened;
- full view opened;
- primary action completed/failed;
- configuration changed;
- widget moved/resized;
- retry requested.

La telemetria non contiene contenuti legali, corpi email o nomi documenti.

