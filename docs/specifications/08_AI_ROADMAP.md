# FORO — AI Roadmap

**Versione:** 3.0  
**Stato:** roadmap; nessuna capacità AI nel MVP

## 1. Principio

L’AI assiste, non sostituisce il professionista. Nessun output AI crea automaticamente un atto definitivo, una scadenza o una comunicazione esterna.

## 2. Prerequisiti

Prima dell’AI devono esistere:

- documenti versionati;
- metadati coerenti;
- permessi per oggetto;
- audit;
- OCR controllato;
- classificazione dati;
- retention;
- DPA e valutazione provider;
- meccanismo di feedback;
- kill switch.

## 3. Fasi

| Fase | Capacità | Controllo |
|---|---|---|
| A | OCR e metadata suggeriti | conferma utente |
| B | ricerca semantica | fonti e ACL |
| C | RAG sui documenti Studio | citazioni e permessi |
| D | sintesi e bozze | approvazione esplicita |
| E | agenti limitati | conferma per effetti esterni |

## 4. RAG permission-aware

Pipeline obbligatoria:

1. autenticare utente e Studio;
2. calcolare documenti autorizzati;
3. filtrare indice e metadata;
4. eseguire retrieval;
5. costruire risposta con fonti;
6. mostrare citazioni;
7. registrare audit minimizzato;
8. raccogliere feedback.

Il filtro autorizzativo precede sempre il ranking semantico.

## 5. Isolamento

- indice separato logicamente per Studio;
- nessuna cache cross-tenant;
- embeddings non riutilizzati tra tenant;
- ACL propagate a chunk e documento;
- purge coerente tra S3, database e indice;
- test di isolamento dedicati.

## 6. Provider governance

Valutare:

- regione di elaborazione;
- retention dei prompt;
- training sui dati;
- subprocessors;
- cifratura;
- SLA;
- portabilità;
- costi;
- controlli DLP;
- capacità di opt-out;
- cancellazione.

Nessun dato cliente è usato per training senza base contrattuale e opt-in esplicito.

## 7. UX

Ogni risposta mostra:

- che è generata da AI;
- fonti utilizzate;
- passaggi non verificati;
- livello di confidenza appropriato;
- azioni “apri fonte”, “segnala problema”, “rigenera”;
- avvertenza quando mancano fonti.

## 8. Sicurezza

- prompt injection: documenti trattati come input non fidato;
- tool allowlist;
- output filtering;
- limite dimensione e costo;
- rate limit;
- nessun segreto nei prompt;
- conferma prima di invio/modifica;
- logging minimizzato;
- red team prima del rilascio.

## 9. Casi d’uso vietati

- previsione dell’esito giudiziario presentata come certezza;
- calcolo termini affidato solo a modello generativo;
- invio automatico di comunicazioni legali;
- citazioni non verificabili;
- accesso indiscriminato a tutte le pratiche;
- addestramento silenzioso sui dati cliente;
- decisioni su accesso o privacy delegate al modello.

## 10. Gate di rilascio

- DPIA aggiornata;
- provider approvato;
- test isolamento e prompt injection;
- benchmark qualità con dataset controllato;
- citazioni verificabili;
- human-in-the-loop;
- monitoraggio costi/qualità;
- rollback e kill switch;
- comunicazione trasparente agli utenti.

