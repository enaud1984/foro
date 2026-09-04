# Redesign UX/UI minimale 2026

## Diagnosi

La revisione ha individuato una gerarchia indebolita da superfici decorative, ombre marcate,
gradienti, controlli ripetuti e un catalogo widget usato come navigazione. Le viste complete
erano corrette funzionalmente, ma apparivano come grandi finestre sovrapposte e la prima vista
di Anagrafiche dedicava troppo spazio a quattro indicatori non necessari alla consultazione.

## Principi applicati

- **Progressive disclosure:** anteprima nella Scrivania, pagina completa per il lavoro e sezioni
  espandibili per dati fiscali, contatti, indirizzo e note.
- **Una gerarchia d'azione:** una sola azione primaria per vista; le azioni widget vivono nel
  menu contestuale già esistente.
- **Superfici calme:** bianco, grigi freddi e petrolio desaturato; bordi da un pixel, ombra quasi assente e
  nessun gradiente nella shell operativa.
- **Navigazione dalla Scrivania:** le viste complete si aprono dai widget; la sidebar non
  duplica i widget con collegamenti diretti e resta dedicata alla personalizzazione.

## Design system

I token centralizzati in `src/styles/_design-system.scss` definiscono palette, testo, superfici,
colori semantici, scala spazi `4/8/12/16/24/32/48`, raggi, ombre, altezze dei controlli,
tipografia, focus, durate di movimento e scala dei livelli. Il primary predefinito è un
petrolio desaturato; il testo dei pulsanti viene scelto in base alla luminanza. I colori successo, warning, errore e informazione
non hanno uso decorativo.

Tutti i pulsanti applicativi condividono la stessa famiglia tipografica Aptos/Segoe UI, corpo
`14px`, peso `600` e altezza di riferimento `40px`; i pulsanti a sola icona mantengono una
superficie quadrata accessibile senza introdurre una seconda scala tipografica.

La tipografia usa la stack di sistema Aptos/Segoe UI, pesi 400–600, titoli pagina fluidi tra
24 e 28 px, sezioni a 17 px, corpo a 14 px, testo secondario a 12 px e KPI a 28 px.

## Superfici riviste

- **Shell:** header da 64 px, ricerca globale, notifiche e impostazioni essenziali.
- **Sidebar:** espone direttamente il catalogo dei widget con icone outline su contenitori
  pastello Soft Fill, senza un ulteriore pannello “Personalizza Scrivania”.
- **Scrivania:** perde sfondi decorativi e griglia visibile; GridStack continua a governare
  drag, resize e persistenza. I widget sono anteprime leggere con azioni nel menu `…`.
- **Agenda:** resta FullCalendar ed è presentata come pagina a piena larghezza; navigazione e
  selezione vista condividono controlli leggeri e il solo CTA di creazione resta nella colonna laterale.
- **Anagrafiche:** i quattro KPI sono sostituiti da un conteggio discreto; ricerca, due filtri,
  AG Grid e una sola azione primaria guidano la vista. Nel form restano visibili tipologia e
  dati principali, mentre dati fiscali, contatti e indirizzo sono espandibili.
- **Pratiche:** AG Grid resta la vista iniziale; il fascicolo usa le tab esistenti e quindi non
  presenta documenti, soggetti, agenda, attività, note e storico contemporaneamente.
- **Documenti, Email e Collaboratori:** restano accessibili dalla sidebar e conservano le loro
  funzioni; nella Scrivania continuano a essere anteprime, non moduli completi.

## Responsive, accessibilità e prestazioni

La sidebar si riduce a icone a 1024 px e diventa barra inferiore su mobile. Le viste operative
mantengono l'intera larghezza utile e non ereditano un layout desktop ristretto. Focus visibile,
etichette accessibili, landmark, menu e tab esistenti sono preservati. Le transizioni durano
140–180 ms e vengono neutralizzate con `prefers-reduced-motion`.

Non sono state aggiunte dipendenze o sostituite GridStack, FullCalendar, AG Grid e Reactive
Forms. Il caricamento e le API restano invariati; la revisione non introduce nuovi componenti
pesanti né modifica business logic, permessi o persistenza.

## Personalizzazione globale

`--section-title-color`, `--button-primary-bg`, `--button-primary-bg-hover` e
`--button-primary-text` sono applicati sul root dell'applicazione: Scrivania, viste complete,
form e pannelli condividono quindi la stessa preferenza. Il colore pulsanti è serializzato
insieme al layout nella preferenza workspace già esistente, senza storage o API paralleli; il
picker offre un'anteprima immediata, mentre il salvataggio resta esplicito.

Le viste complete occupano la riga di workspace sotto `--app-header-height`. La scala
`--z-workspace`, `--z-fullscreen-widget`, `--z-header`, `--z-dropdown` e `--z-modal` mantiene
notifiche e menu globali sopra il contenuto operativo senza valori arbitrari.
