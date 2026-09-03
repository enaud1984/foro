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
- **Superfici calme:** bianco, grigi freddi e navy; bordi da un pixel, ombra quasi assente e
  nessun gradiente nella shell operativa.
- **Navigazione dalla Scrivania:** le viste complete si aprono dai widget; la sidebar non
  duplica i widget con collegamenti diretti e resta dedicata alla personalizzazione.

## Design system

I token centralizzati in `src/styles/_design-system.scss` definiscono palette, testo, superfici,
colori semantici, scala spazi `4/8/12/16/24/32/48`, raggi, ombre, altezze dei controlli,
tipografia, focus e durate di movimento. Il navy `#102a43` è il colore istituzionale; testo e
icone sulle superfici primarie sono bianchi. I colori successo, warning, errore e informazione
non hanno uso decorativo.

Tutti i pulsanti applicativi condividono la stessa famiglia tipografica Aptos/Segoe UI, corpo
`14px`, peso `600` e altezza di riferimento `40px`; i pulsanti a sola icona mantengono una
superficie quadrata accessibile senza introdurre una seconda scala tipografica.

La tipografia usa la stack di sistema Aptos/Segoe UI, pesi 400–600, titoli pagina fluidi tra
24 e 28 px, sezioni a 17 px, corpo a 14 px, testo secondario a 12 px e KPI a 28 px.

## Superfici riviste

- **Shell:** header da 64 px, ricerca globale, notifiche e impostazioni essenziali.
- **Sidebar:** contiene soltanto la personalizzazione della Scrivania e le impostazioni; il
  catalogo resta espandibile per ridurre il rumore dopo la configurazione iniziale.
- **Scrivania:** perde sfondi decorativi e griglia visibile; GridStack continua a governare
  drag, resize e persistenza. I widget sono anteprime leggere con azioni nel menu `…`.
- **Agenda:** resta FullCalendar ed è presentata come pagina a piena larghezza; filtri e
  gestione calendari restano nella superficie contestuale già prevista.
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
