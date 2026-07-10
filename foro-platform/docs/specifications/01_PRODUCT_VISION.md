# FORO — Product Vision

**Versione:** 3.0  
**Stato:** baseline normativa  
**Fonte:** `docs/product-book/FORO_Product_Book_v3.docx`

## 1. Product statement

FORO è una piattaforma SaaS cloud per studi legali italiani. Non è una raccolta di moduli: è una **Scrivania Digitale**. La Dashboard è il punto di ingresso di ogni sessione e ogni capacità operativa è rappresentata da un widget.

FORO collega calendario, documenti, email, clienti e pratiche in un unico contesto, riducendo passaggi tra strumenti, duplicazioni e perdita di informazioni.

## 2. Utenti target

- avvocati titolari e professionisti individuali;
- avvocati collaboratori;
- praticanti;
- personale di segreteria;
- studi associati di piccole e medie dimensioni.

## 3. Jobs-to-be-Done

| Utente | Quando | Vuole | Per ottenere |
|---|---|---|---|
| Titolare | avvia o governa lo studio | configurare identità, collaboratori e accessi | controllo senza microgestione |
| Avvocato | inizia la giornata | vedere subito impegni e pratiche prioritarie | decidere dove agire |
| Collaboratore | lavora su una pratica | trovare documenti, email ed eventi collegati | evitare ricerche frammentate |
| Segreteria | gestisce clienti e appuntamenti | operare rapidamente sul contesto corretto | ridurre errori di associazione |
| Praticante | esegue attività assegnate | accedere solo alle informazioni necessarie | lavorare in modo guidato |

## 4. Value proposition

1. **Una sola Scrivania:** le informazioni rilevanti arrivano all’utente, senza menu profondi.
2. **Contesto connesso:** cliente e pratica collegano documenti, email ed eventi.
3. **Automazione controllata:** FORO suggerisce e compila; l’utente verifica e conferma.
4. **Personalizzazione reale:** widget spostabili, ridimensionabili e configurabili.
5. **Governance dello Studio:** branding, collaboratori, ruoli e permessi sono amministrati dal titolare.
6. **Fondamenta enterprise:** multi-tenancy, audit, storage documentale e sicurezza by design.

## 5. North Star

> Ogni professionista apre FORO e comprende in meno di trenta secondi cosa richiede attenzione, potendo agire senza perdere il contesto della propria Scrivania.

## 6. MVP vincolante

Nel MVP esistono esattamente cinque widget:

1. Calendario;
2. Documenti;
3. Email;
4. Clienti;
5. Pratiche / Fascicolo.

Sono inoltre necessarie le capacità trasversali di autenticazione, gestione Studio, collaboratori, ruoli, branding, Dashboard, audit e notifiche tecniche essenziali.

## 7. Fuori dal MVP

- task come prodotto autonomo;
- timesheet, parcelle, fatturazione e dashboard economica;
- PEC;
- WhatsApp;
- firma digitale integrata;
- sincronizzazione calendari esterni;
- PCT / PolisWeb;
- portale cliente;
- OCR, ricerca semantica e RAG;
- reportistica avanzata.

Una capacità fuori MVP non deve comparire come operativa. Può essere mostrata soltanto come evoluzione futura chiaramente etichettata.

## 8. Principi di esperienza

- Dashboard sempre come home.
- Pattern **anteprima → gestione completa**.
- Un errore locale a un widget non deve bloccare la Dashboard.
- Automazioni spiegabili e correggibili.
- Colore mai come unico indicatore.
- Nessuna azione distruttiva senza conferma e autorizzazione.
- Responsive desktop-first; tablet completo; mobile per operazioni essenziali.
- Accessibilità target WCAG 2.2 AA.

## 9. Metriche di prodotto

| Metrica | Definizione | Target iniziale |
|---|---|---|
| Time to first value | attivazione → primo cliente e prima pratica | ≤ 30 minuti |
| Weekly active users | utenti con almeno 3 sessioni/settimana | ≥ 70% |
| Widget action rate | sessioni con un’azione completata da widget | ≥ 60% |
| Search success | apertura risultato senza riformulazione | ≥ 80% |
| Association coverage | email/documenti collegati a cliente o pratica | ≥ 75% |
| Critical error rate | azioni core con errore bloccante | < 0,5% |

## 10. Criteri di successo MVP

- i cinque widget completano i workflow principali end-to-end;
- l’isolamento tra studi è verificato automaticamente;
- il titolare può creare lo Studio e approvare collaboratori;
- documenti, email ed eventi possono essere collegati al contesto corretto;
- layout e configurazioni widget persistono per utente;
- nessun requisito futuro viene presentato come disponibile;
- backup, audit, monitoraggio e processi privacy sono operativi prima del go-live.

