import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AnagraficheComponent } from './anagrafiche/anagrafiche.component';
import { Soggetto } from './anagrafiche/anagrafiche.modelli';
import { PraticheComponent } from './pratiche/pratiche.component';
import { EventoPratica, Pratica, PraticaSintetica } from './pratiche/pratiche.modelli';
import { PraticheService } from './pratiche/pratiche.service';
import { IconaForoComponent } from './shared/icona-foro.component';
import { GridStackNode, GridStackWidget } from 'gridstack';
import { GridstackComponent, GridstackItemComponent, elementCB, nodesCB } from 'gridstack/dist/angular';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import itLocale from '@fullcalendar/core/locales/it';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { AgendaFullCalendarMapper, EventoAgendaDto } from './agenda/agenda-fullcalendar.mapper';
import { Router } from '@angular/router';
import {
  CONFIGURAZIONE_GRIDSTACK,
  DIMENSIONI_WIDGET,
  VERSIONE_LAYOUT_GRIDSTACK
} from './scrivania/configurazione-gridstack';

type Schermata = 'login' | 'registrazione' | 'scrivania';
type ModalitaTema = 'LIGHT' | 'DARK';
type DensitaScrivania = 'COMFORTABLE' | 'COMPACT';
type ChiaveWidget = 'calendario' | 'documenti' | 'email' | 'clienti' | 'pratiche' | 'collaboratori';
type RuoloCollaboratore = 'AVVOCATO' | 'SEGRETERIA' | 'STUDIO_ADMIN';
type PassoRegistrazione = 'dati' | 'piani' | 'pagamento';
type PianoDemo = 'essential' | 'professional';
type VistaCalendario = 'giorno' | 'settimana' | 'mese';
type ChiaveCalendario = 'studio' | 'privato' | 'udienze' | 'scadenze' | string;
type PosizioneGriglia = { x: number; y: number; w: number; h: number };
interface ProfiloStudio {
  name: string;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  themePreset: string;
  canEditBranding: boolean;
}

interface PreferenzeScrivania {
  themeMode: ModalitaTema;
  dashboardDensity: DensitaScrivania;
  personalAccentColor: string | null;
  widgetLayout: string;
}

interface DefinizioneWidget {
  key: ChiaveWidget;
  icon: string;
  title: string;
  description: string;
}

interface WidgetScrivania extends DefinizioneWidget {
  x: number;
  y: number;
  w: number;
  h: number;
  metric: string;
  preview: string;
  details: string[];
  righeAnteprima: RigaWidget[];
}

interface RigaWidget {
  titolo: string;
  descrizione: string;
  stato: string;
  evidenza?: string;
  eventoId?: string;
  colore?: string;
  urgente?: boolean;
  praticaId?: string;
}

interface NotificaScrivania {
  icona: string;
  categoria: string;
  titolo: string;
  descrizione: string;
  orario: string;
  widget: ChiaveWidget;
  oggettoTitolo: string;
}

interface CalendarioAgenda {
  chiave: ChiaveCalendario;
  nome: string;
  classeColore: string;
  selezionato: boolean;
  condivisoCon: string[];
  condivisoConIds?: string[];
  condivisoConTuttoLoStudio?: boolean;
  gestibile?: boolean;
}

interface CalendarioApi { id: string; nome: string; colore: string; condivisoTuttoStudio: boolean; condivisoCon: string[]; gestibile: boolean; }
interface PersonaStudioApi { id: string; nome: string; }
interface NotificaApi { id:string; tipo:string; titolo:string; descrizione:string; eventoId:string; letta:boolean; creataIl:string; }
type EventoApi = EventoAgendaDto;
interface CollaboratoreStudio { id: string; nome: string; cognome: string; email: string; ruolo: RuoloCollaboratore; stato: 'ATTIVO' | 'DISABILITATO' | 'PENDING'; }

interface EventoAgenda {
  id?: string;
  data: string;
  ora: number;
  minuti?: number;
  calendario: ChiaveCalendario;
  titolo: string;
  dettaglio?: string;
  persona: string;
  personaId?: string;
  colore?: string;
  fine?: string;
  note?: string;
  partecipanti?: string;
  statoDisponibilita?: string;
  promemoriaMinuti?: number;
  categoria?: string;
  ricorrenza?: string;
  tuttoGiorno?: boolean;
  praticaId?:string;
  praticaCodice?:string;
  praticaTitolo?:string;
  praticaStato?:string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, AnagraficheComponent, PraticheComponent, IconaForoComponent, GridstackComponent, GridstackItemComponent, FullCalendarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  @ViewChild('agendaCompleta') agendaCompleta?: FullCalendarComponent;
  private readonly oggi = new Date();
  readonly giornoSettimanaOggi = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(this.oggi);
  readonly giornoMeseOggi = new Intl.DateTimeFormat('it-IT', { day: '2-digit' }).format(this.oggi);
  readonly meseOggi = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(this.oggi);
  readonly annoOggi = new Intl.DateTimeFormat('it-IT', { year: 'numeric' }).format(this.oggi);
  readonly screen = signal<Schermata>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly userName = signal('');
  readonly registrationStep = signal<PassoRegistrazione>('dati');
  readonly selectedPlan = signal<PianoDemo>('essential');
  readonly studioProfile = signal<ProfiloStudio | null>(null);
  readonly dashboardPreference = signal<PreferenzeScrivania | null>(null);
  readonly settingsMessage = signal('');
  readonly collaboratorMessage = signal('');
  readonly passwordMessage = signal('');
  readonly settingsOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly expandedWidget = signal<WidgetScrivania | null>(null);
  readonly rigaWidgetSelezionata = signal<RigaWidget | null>(null);
  readonly anagraficaSelezionataId = signal<string | null>(null);
  readonly nuovaAnagraficaRichiesta = signal(false);
  readonly praticaSelezionataId = signal<string | null>(null);
  readonly nuovaPraticaRichiesta = signal(false);
  readonly praticheAgenda = signal<PraticaSintetica[]>([]);
  readonly menuWidgetAperto = signal<ChiaveWidget | null>(null);
  readonly vistaCalendario = signal<VistaCalendario>('settimana');
  readonly dataCalendario = signal(this.inizioGiorno(new Date()));
  readonly oraAttuale = signal(new Date());
  readonly nuovoAppuntamentoAperto = signal(false);
  readonly nuovoCalendarioAperto = signal(false);
  readonly gestioneCalendariAperta = signal(false);
  readonly calendarioInModifica = signal<string | null>(null);
  readonly calendarioDaEliminare = signal<string | null>(null);
  readonly erroreAppuntamento = signal('');
  readonly eventoSelezionato = signal<EventoAgenda | null>(null);
  readonly eventoInModificaId = signal<string | null>(null);
  readonly slotSelezionato = signal<string | null>(null);
  readonly calendariAgenda = signal<CalendarioAgenda[]>([
    { chiave: 'studio', nome: 'Studio Legale Verdi', classeColore: 'studio', selezionato: true, condivisoCon: [], condivisoConTuttoLoStudio: true },
    { chiave: 'privato', nome: 'Calendario privato', classeColore: 'private', selezionato: true, condivisoCon: [] },
    { chiave: 'udienze', nome: 'Udienze', classeColore: 'hearings', selezionato: true, condivisoCon: [] },
    { chiave: 'scadenze', nome: 'Scadenze deposito', classeColore: 'deadlines', selezionato: false, condivisoCon: [] }
  ]);
  readonly personeStudio = signal<{id:string;nome:string;selezionata:boolean}[]>([]);
  readonly collaboratoriStudio = signal<CollaboratoreStudio[]>([]);
  readonly personeCondivisione = signal<{id:string;nome:string;selezionata:boolean}[]>([]);
  readonly personeInvitate = signal<{id:string;nome:string;selezionata:boolean}[]>([]);
  readonly eventiAgenda = signal<EventoAgenda[]>([]);
  readonly calendarioCaricamento = signal(false);
  readonly calendarioErrore = signal('');
  readonly opzioniAgenda: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    locales: [itLocale], locale: 'it', firstDay: 1, initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
    buttonText: { today: 'Oggi', month: 'Mese', week: 'Settimana', day: 'Giorno', list: 'Elenco' },
    editable: true, selectable: true, selectMirror: true, dayMaxEvents: true,
    nowIndicator: true, eventResizableFromStart: true, slotDuration: '00:30:00',
    height: 'auto', timeZone: 'local',
    events: (intervallo, successo, fallimento) => {
      this.calendarioCaricamento.set(true); this.calendarioErrore.set('');
      this.http.get<EventoApi[]>('/api/v1/calendario/eventi', { params: { dal: intervallo.startStr.slice(0, 10), al: intervallo.endStr.slice(0, 10) } }).subscribe({
        next: eventi => {
          const calendariVisibili = new Set(this.calendariAgenda().filter(calendario => calendario.selezionato).map(calendario => String(calendario.chiave)));
          successo(eventi.filter(evento => calendariVisibili.has(evento.calendarioId)).map(AgendaFullCalendarMapper.daDto));
          this.calendarioCaricamento.set(false);
        },
        error: errore => { this.calendarioErrore.set('Impossibile caricare gli appuntamenti. Riprova.'); this.calendarioCaricamento.set(false); fallimento(errore); }
      });
    },
    select: selezione => this.selezionaIntervalloAgenda(selezione),
    eventClick: click => this.apriEventoFullCalendar(click),
    eventDrop: modifica => this.persisteSpostamento(modifica),
    eventResize: modifica => this.persisteRidimensionamento(modifica)
  };
  readonly oreCalendario = Array.from({ length: 16 }, (_, indice) => indice + 7);
  readonly slotCalendario = Array.from({ length: 32 }, (_, indice) => ({ ora: 7 + Math.floor(indice / 2), minuti: indice % 2 ? 30 : 0 }));
  readonly giorniVisualizzati = computed(() => {
    if (this.vistaCalendario() === 'giorno') return [this.creaGiornoVista(this.dataCalendario())];
    const lunedi = this.inizioSettimana(this.dataCalendario());
    return Array.from({ length: 7 }, (_, indice) => this.creaGiornoVista(this.aggiungiGiorni(lunedi, indice)));
  });
  readonly celleMese = computed(() => {
    const riferimento = this.dataCalendario();
    const primo = new Date(riferimento.getFullYear(), riferimento.getMonth(), 1);
    const inizio = this.inizioSettimana(primo);
    return Array.from({ length: 42 }, (_, indice) => this.creaGiornoVista(this.aggiungiGiorni(inizio, indice)));
  });
  readonly intestazioneCalendario = computed(() => this.creaIntestazioneCalendario());
  readonly intestazioneMiniCalendario = computed(() => new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(this.dataCalendario()));
  readonly notificheInviti = signal<NotificaScrivania[]>([]);
  readonly notificheScrivania: NotificaScrivania[] = [
    {
      icona: 'calendario',
      categoria: 'Appuntamento',
      titolo: 'Udienza civile confermata',
      descrizione: 'Tribunale di Milano · pratica demo collegata · ore 10:30',
      orario: '09:12',
      widget: 'calendario',
      oggettoTitolo: '10:30 — Udienza civile'
    },
    {
      icona: 'documenti',
      categoria: 'Documento',
      titolo: 'Procura firmata caricata',
      descrizione: 'Nuovo file in un fascicolo demo',
      orario: '08:47',
      widget: 'documenti',
      oggettoTitolo: 'Procura firmata demo.p7m'
    },
    {
      icona: 'email',
      categoria: 'Email',
      titolo: 'PEC da associare a pratica',
      descrizione: 'Cancelleria civile · ricevuta deposito telematico',
      orario: 'Ieri',
      widget: 'email',
      oggettoTitolo: 'Cancelleria civile'
    },
    {
      icona: 'pratiche',
      categoria: 'Pratica',
      titolo: 'Scadenza fra 2 giorni',
      descrizione: 'Deposito memoria istruttoria · RG 1842/2025',
      orario: '2 gg',
      widget: 'pratiche',
      oggettoTitolo: 'Aurora Servizi / recupero credito'
    }
  ];
  readonly tutteNotifiche = computed(() => [...this.notificheInviti(), ...this.notificheScrivania]);

  readonly widgetLibrary: DefinizioneWidget[] = [
    { key: 'calendario', icon: 'calendario', title: 'Calendario', description: 'Agenda stile Outlook, udienze e scadenze' },
    { key: 'documenti', icon: 'documenti', title: 'Documenti', description: 'Atti, versioni, firme e fascicoli' },
    { key: 'email', icon: 'email', title: 'Email', description: 'Posta ordinaria e associazioni pratica' },
    { key: 'clienti', icon: 'anagrafiche', title: 'Anagrafiche', description: 'Persone, società, enti e altri soggetti' },
    { key: 'pratiche', icon: 'pratiche', title: 'Pratiche', description: 'Fascicoli, scadenze e attività dello Studio' },
    { key: 'collaboratori', icon: 'collaboratori', title: 'Collaboratori', description: 'Avvocati, segreteria, ruoli e accessi' }
  ];
  readonly widgetDisponibili = computed(() => this.widgetLibrary.filter(widget => widget.key !== 'collaboratori' || !!this.studioProfile()?.canEditBranding));

  readonly activeWidgets = signal<WidgetScrivania[]>(this.creaWidgetIniziali());

  readonly loginForm;
  readonly registerForm;
  readonly brandingForm;
  readonly dashboardForm;
  readonly appuntamentoForm;
  readonly calendarioCondivisoForm;
  readonly collaboratoreForm;
  readonly cambioPasswordForm;
  readonly ricercaPratica;
  @ViewChild(GridstackComponent) grigliaScrivania?: GridstackComponent;
  readonly opzioniGriglia = CONFIGURAZIONE_GRIDSTACK;
  private nodiLayoutPendenti: GridStackNode[] = [];
  private readonly opzioniWidgetStabili = new Map<ChiaveWidget, GridStackWidget>();

  private creaWidgetIniziali(): WidgetScrivania[] {
    return [
      {
        ...this.widgetLibrary[0],
        x: 1,
        y: 1,
        w: 5,
        h: 6,
        metric: 'Nessun impegno oggi',
        preview: 'Nessun prossimo evento',
        details: [],
        righeAnteprima: []
      },
      {
        ...this.widgetLibrary[1],
        x: 6,
        y: 1,
        ...this.dimensioniPredefinite('documenti'),
        metric: '248 file',
        preview: 'Documenti recenti e da validare',
        details: ['Comparsa_costituzione_v3.pdf', 'Procura_firmata_demo.p7m', 'Verbale_udienza_10-07.docx'],
        righeAnteprima: [
          { titolo: 'Comparsa costituzione v3.pdf', descrizione: 'Fascicolo demo', stato: 'Da firmare' },
          { titolo: 'Procura firmata demo.p7m', descrizione: 'Caricata oggi alle 09:14', stato: 'Firmato' },
          { titolo: 'Verbale udienza 10-07.docx', descrizione: 'Bozza da revisionare', stato: 'Bozza' }
        ]
      },
      {
        ...this.widgetLibrary[2],
        x: 1,
        y: 7,
        ...this.dimensioniPredefinite('email'),
        metric: '37 non lette',
        preview: 'Messaggi da lavorare e associare',
        details: ['Tribunale di Milano — notifica provvedimento', 'cliente.demo@example.test — documenti integrativi', 'Cancelleria civile — ricevuta deposito'],
        righeAnteprima: [
          { titolo: 'Tribunale di Milano', descrizione: 'Notifica provvedimento · 2 allegati', stato: 'Nuova' },
          { titolo: 'cliente.demo@example.test', descrizione: 'Documenti integrativi pratica lavoro', stato: 'Associare' },
          { titolo: 'Cancelleria civile', descrizione: 'Ricevuta deposito telematico', stato: 'Archiviata' }
        ]
      },
      {
        ...this.widgetLibrary[3],
        x: 5,
        y: 7,
        ...this.dimensioniPredefinite('clienti'),
        metric: 'Anagrafiche',
        preview: 'Ricerca e gestisci persone e organizzazioni',
        details: [],
        righeAnteprima: []
      },
      {
        ...this.widgetLibrary[4],
        x: 9,
        y: 7,
        ...this.dimensioniPredefinite('pratiche'),
        metric: 'Pratiche',
        preview: 'Fascicoli, scadenze e attività dello Studio',
        details: [],
        righeAnteprima: []
      }
    ];
  }

  constructor(private readonly fb: FormBuilder, private readonly http: HttpClient, private readonly servizioPratiche: PraticheService, private readonly router:Router) {
    this.ricercaPratica = this.fb.nonNullable.control('');
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.registerForm = this.fb.nonNullable.group({
      studioName: ['', Validators.required],
      logoUrl: [''],
      addressLine: [''],
      city: [''],
      postalCode: [''],
      country: ['Italia'],
      phone: [''],
      website: [''],
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12)]]
    });
    this.brandingForm = this.fb.nonNullable.group({
      name: ['', Validators.required],
      addressLine: [''],
      city: [''],
      postalCode: [''],
      country: ['Italia'],
      phone: [''],
      website: [''],
      logoUrl: [''],
      primaryColor: ['#111827'],
      accentColor: ['#0f766e'],
      secondaryColor: ['#475569'],
      themePreset: ['foro-minimal-essential']
    });
    this.dashboardForm = this.fb.nonNullable.group({
      themeMode: ['LIGHT' as ModalitaTema],
      dashboardDensity: ['COMFORTABLE' as DensitaScrivania],
      personalAccentColor: ['#0f766e']
    });
    this.appuntamentoForm = this.fb.nonNullable.group({
      titolo: ['Nuovo appuntamento cliente', Validators.required],
      calendario: ['studio', Validators.required],
      data: [this.dataIsoLocale(new Date()), Validators.required],
      inizio: ['11:30', Validators.required],
      fine: ['12:15', Validators.required],
      tuttoGiorno: [false],
      statoDisponibilita: ['OCCUPATO'],
      promemoriaMinuti: [15],
      categoria: ['GENERALE'],
      ricorrenza: ['NESSUNA'],
      fineRicorrenza: [''],
      note: ['Preparare fascicolo e documenti cliente.'],
      praticaId: ['']
    });
    this.calendarioCondivisoForm = this.fb.nonNullable.group({
      nome: ['', Validators.required],
      colore: ['#d97706', Validators.required]
    });
    this.collaboratoreForm = this.fb.nonNullable.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      ruolo: ['AVVOCATO' as RuoloCollaboratore, Validators.required],
    });
    this.cambioPasswordForm = this.fb.nonNullable.group({
      passwordAttuale: ['', Validators.required],
      nuovaPassword: ['', [Validators.required, Validators.minLength(12)]],
      confermaPassword: ['', [Validators.required, Validators.minLength(12)]]
    });
    this.ricercaPratica.valueChanges.pipe(debounceTime(250),distinctUntilChanged()).subscribe(testo=>this.cercaPraticheAgenda(testo));
  }

  ngOnDestroy(): void {
    // Il wrapper ufficiale distrugge l'istanza GridStack e tutti i listener associati.
  }

  useDemoLogin(): void {
    this.loginForm.setValue({ email: 'admin@studioverdi-demo.it', password: 'DemoFORO2026!' });
  }

  toggleSettings(): void {
    this.settingsOpen.update(value => !value);
    this.notificationsOpen.set(false);
    this.error.set('');
    this.settingsMessage.set('');
    this.collaboratorMessage.set('');
    this.passwordMessage.set('');
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(value => !value);
    this.settingsOpen.set(false);
  }

  apriNotifica(notifica: NotificaScrivania): void {
    const widget = this.activeWidgets().find(item => item.key === notifica.widget)
      ?? this.creaWidgetDaDefinizione(notifica.widget, 1, 1);
    if (!widget) return;
    if (!this.activeWidgets().some(item => item.key === widget.key)) {
      this.activeWidgets.update(widgets => [...widgets, widget]);
    }
    const riga = widget.righeAnteprima.find(item => item.titolo === notifica.oggettoTitolo)
      ?? widget.righeAnteprima.find(item => item.titolo.includes(notifica.oggettoTitolo) || notifica.oggettoTitolo.includes(item.titolo));
    this.rigaWidgetSelezionata.set(riga ?? {
      titolo: notifica.oggettoTitolo,
      descrizione: notifica.descrizione,
      stato: notifica.categoria
    });
    this.notificationsOpen.set(false);
    this.openWidget(widget);
  }

  studioFullAddress(): string {
    const profilo = this.studioProfile();
    if (!profilo) return 'Scrivania digitale';
    return [profilo.addressLine, profilo.postalCode, profilo.city, profilo.country].filter(Boolean).join(' · ') || 'Scrivania digitale';
  }

  onLogoSelected(event: Event): void {
    this.readLogoFile(event, logoUrl => {
      this.brandingForm.patchValue({ logoUrl });
      this.settingsMessage.set('Logo caricato dal PC. Premi “Salva dati Studio” per renderlo definitivo.');
    });
  }

  onRegisterLogoSelected(event: Event): void {
    this.readLogoFile(event, logoUrl => this.registerForm.patchValue({ logoUrl }));
  }

  show(screen: Schermata): void {
    this.error.set('');
    if (screen === 'registrazione') this.registrationStep.set('dati');
    this.screen.set(screen);
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.submit('/api/v1/auth/login', this.loginForm.getRawValue());
  }

  register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.registrationStep.set('piani');
  }

  choosePlan(plan: PianoDemo): void {
    this.selectedPlan.set(plan);
    this.registrationStep.set('pagamento');
  }

  completeDemoPayment(): void {
    this.submit('/api/v1/auth/register/studio', this.registerForm.getRawValue());
  }

  logout(): void {
    sessionStorage.removeItem('foro_access_token');
    this.userName.set('');
    this.studioProfile.set(null);
    this.dashboardPreference.set(null);
    this.applyTheme(null, null);
    this.show('login');
  }

  aggiungiWidgetDaLibreria(key: ChiaveWidget): void {
    if (this.activeWidgets().some(widget => widget.key === key)) return;
    const nuovoWidget = this.creaWidgetDaDefinizione(key, 1, 1);
    if (!nuovoWidget) return;
    this.activeWidgets.update(widget => [...widget, nuovoWidget]);
    queueMicrotask(() => this.grigliaScrivania?.updateAll());
    this.salvaLayoutWidget();
  }

  opzioniWidget(widget: WidgetScrivania): GridStackWidget {
    const esistenti = this.opzioniWidgetStabili.get(widget.key);
    if (esistenti) return esistenti;
    const limiti = DIMENSIONI_WIDGET[widget.key];
    const opzioni = {
      id: widget.key,
      x: widget.x - 1,
      y: widget.y - 1,
      w: widget.w,
      h: widget.h,
      minW: limiti.minW,
      minH: limiti.minH,
      maxW: limiti.maxW,
      maxH: limiti.maxH
    };
    this.opzioniWidgetStabili.set(widget.key, opzioni);
    return opzioni;
  }

  aggiornaModelloDaGridStack(evento: nodesCB): void {
    // GridStack resta autorevole durante l'interazione: non si aggiorna il signal,
    // evitando che Angular riconfiguri gli item mentre collisioni e placeholder sono attivi.
    this.nodiLayoutPendenti = evento.nodes.map(nodo => ({
      id: nodo.id, x: nodo.x, y: nodo.y, w: nodo.w, h: nodo.h
    }));
  }

  terminaSpostamentoGridStack(evento: elementCB): void {
    this.sincronizzaLayoutConcluso(evento.el.gridstackNode);
    this.salvaLayoutWidget();
  }

  terminaRidimensionamentoGridStack(evento: elementCB): void {
    this.sincronizzaLayoutConcluso(evento.el.gridstackNode);
    this.salvaLayoutWidget();
  }

  registraWidgetGridStack(evento: nodesCB): void {
    this.applicaNodiGridStack(evento.nodes);
  }

  rimuoviWidgetGridStack(evento: nodesCB): void {
    const rimossi = new Set(evento.nodes.map(nodo => nodo.id as ChiaveWidget));
    this.activeWidgets.update(widget => widget.filter(elemento => !rimossi.has(elemento.key)));
  }

  identificaWidget(_indice: number, widget: WidgetScrivania): ChiaveWidget {
    return widget.key;
  }

  expandWidget(widget: WidgetScrivania, event: Event): void {
    event.stopPropagation();
    this.menuWidgetAperto.set(null);
    this.rigaWidgetSelezionata.set(null);
    this.openWidget(widget);
  }

  apriModulo(chiave: ChiaveWidget): void {
    let widget = this.activeWidgets().find(elemento => elemento.key === chiave);
    if (!widget) {
      widget = this.creaWidgetDaDefinizione(chiave, 1, 1) ?? undefined;
    }
    if (widget) this.openWidget(widget);
  }

  tornaScrivania(): void {
    this.expandedWidget.set(null);
    void this.router.navigateByUrl('/scrivania');
  }

  toggleMenuWidget(widget: WidgetScrivania, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuWidgetAperto.update(chiave => chiave === widget.key ? null : widget.key);
  }

  apriRigaWidget(widget: WidgetScrivania, riga: RigaWidget, event: Event): void {
    event.stopPropagation();
    this.rigaWidgetSelezionata.set(riga);
    this.openWidget(widget);
    if (widget.key === 'calendario' && riga.eventoId) {
      const evento = this.eventiAgenda().find(elemento => elemento.id === riga.eventoId);
      if (evento) {
        this.dataCalendario.set(this.dataDaIso(evento.data));
        this.nuovoAppuntamentoAperto.set(false);
        this.eventoSelezionato.set(evento);
      }
    }
  }

  closeWidget(key: ChiaveWidget, event: Event): void {
    event.stopPropagation();
    this.menuWidgetAperto.set(null);
    this.activeWidgets.update(widgets => widgets.filter(widget => widget.key !== key));
    queueMicrotask(() => this.grigliaScrivania?.updateAll());
    this.salvaLayoutWidget();
  }

  openWidget(widget: WidgetScrivania): void {
    this.expandedWidget.set(widget);
    const percorso:Partial<Record<ChiaveWidget,string>>={calendario:'/agenda',clienti:'/anagrafiche',pratiche:'/pratiche'};
    if(percorso[widget.key])void this.router.navigateByUrl(percorso[widget.key]!);
    if (widget.key === 'calendario') this.allineaPlannerOraAttuale();
  }

  apriAnagraficaDaWidget(soggetto: Soggetto | null): void {
    this.anagraficaSelezionataId.set(soggetto?.id ?? null);
    this.nuovaAnagraficaRichiesta.set(soggetto===null);
    const widget=this.activeWidgets().find(elemento=>elemento.key==='clienti');
    if(widget)this.openWidget(widget);
  }

  apriPraticaDaWidget(pratica: PraticaSintetica | null): void {
    this.praticaSelezionataId.set(pratica?.id ?? null);
    this.nuovaPraticaRichiesta.set(pratica===null);
    const widget=this.activeWidgets().find(elemento=>elemento.key==='pratiche');
    if(widget)this.openWidget(widget);
  }

  apriAnagraficaDaPratica(id:string):void {
    this.anagraficaSelezionataId.set(id);this.nuovaAnagraficaRichiesta.set(false);
    const widget=this.activeWidgets().find(elemento=>elemento.key==='clienti');
    if(widget)this.openWidget(widget);
  }

  creaEventoDaPratica(pratica:Pratica):void {
    const widget=this.activeWidgets().find(elemento=>elemento.key==='calendario');if(!widget)return;
    this.appuntamentoForm.controls.praticaId.setValue(pratica.id);
    this.ricercaPratica.setValue(`${pratica.codice} · ${pratica.titolo}`,{emitEvent:false});
    this.praticheAgenda.set([pratica]);
    this.eventoSelezionato.set(null);this.openWidget(widget);this.apriNuovoAppuntamento(true);
  }

  apriEventoDaPratica(evento:EventoPratica):void {
    const widget=this.activeWidgets().find(elemento=>elemento.key==='calendario');if(!widget)return;
    this.openWidget(widget);this.dataCalendario.set(this.inizioGiorno(new Date(evento.inizio)));
    const trovato=this.eventiAgenda().find(e=>e.id===evento.id);
    if(trovato)this.eventoSelezionato.set(trovato);
  }

  apriPraticaDaEvento(evento:EventoAgenda):void {
    if(!evento.praticaId)return;
    this.praticaSelezionataId.set(evento.praticaId);this.nuovaPraticaRichiesta.set(false);
    const widget=this.activeWidgets().find(elemento=>elemento.key==='pratiche');if(widget)this.openWidget(widget);
  }

  apriPraticaDaAnagrafica(id:string):void {
    this.praticaSelezionataId.set(id);this.nuovaPraticaRichiesta.set(false);
    const widget=this.activeWidgets().find(elemento=>elemento.key==='pratiche');if(widget)this.openWidget(widget);
  }

  cercaPraticheAgenda(testo:string):void {
    if(testo.trim().length<2){this.praticheAgenda.set([]);return;}
    this.servizioPratiche.elenco({ricerca:testo.trim(),pagina:0,dimensione:8}).subscribe({next:p=>this.praticheAgenda.set(p.content),error:()=>this.praticheAgenda.set([])});
  }

  selezionaPraticaAgenda(pratica:PraticaSintetica|null):void {
    this.appuntamentoForm.controls.praticaId.setValue(pratica?.id??'');
    this.ricercaPratica.setValue(pratica?`${pratica.codice} · ${pratica.titolo}`:'',{emitEvent:false});
    this.praticheAgenda.set([]);
  }

  closeExpandedWidget(): void {
    this.expandedWidget.set(null);
    this.nuovaAnagraficaRichiesta.set(false);
    this.nuovaPraticaRichiesta.set(false);
    this.rigaWidgetSelezionata.set(null);
    this.nuovoAppuntamentoAperto.set(false);
    this.chiudiGestioneCalendari();
    void this.router.navigateByUrl('/scrivania');
  }

  cambiaVistaCalendario(vista: VistaCalendario): void {
    this.vistaCalendario.set(vista);
    if (vista !== 'mese') this.allineaPlannerOraAttuale();
  }

  vaiOggi(): void {
    const adesso = new Date();
    this.oraAttuale.set(adesso);
    this.dataCalendario.set(this.inizioGiorno(adesso));
    if (this.vistaCalendario() !== 'mese') this.allineaPlannerOraAttuale();
  }

  navigaCalendario(direzione: -1 | 1): void {
    const passo = this.vistaCalendario() === 'giorno' ? 1 : this.vistaCalendario() === 'settimana' ? 7 : 0;
    const data = this.dataCalendario();
    this.dataCalendario.set(passo
      ? this.aggiungiGiorni(data, passo * direzione)
      : new Date(data.getFullYear(), data.getMonth() + direzione, 1));
  }

  navigaMiniCalendario(direzione: -1 | 1): void { const data=this.dataCalendario(); this.dataCalendario.set(new Date(data.getFullYear(),data.getMonth()+direzione,1)); }
  selezionaGiornoMiniCalendario(iso:string):void { this.dataCalendario.set(this.dataDaIso(iso)); this.vistaCalendario.set('giorno'); this.allineaPlannerOraAttuale(); }

  private allineaPlannerOraAttuale(): void {
    window.setTimeout(() => {
      const planner = document.querySelector('.week-calendar') as HTMLElement | null;
      if (!planner) return;
      const ora = new Date();
      this.oraAttuale.set(ora);
      const posizione = 82 + ((ora.getHours() - 7) * 86) + (ora.getMinutes() / 60 * 86);
      planner.scrollTop = Math.max(0, Math.min(planner.scrollHeight - planner.clientHeight, posizione - planner.clientHeight * .35));
    });
  }

  apriNuovoAppuntamento(mantieniPratica=false): void {
    this.chiudiGestioneCalendari();
    this.erroreAppuntamento.set('');
    this.eventoInModificaId.set(null);
    if(!mantieniPratica){this.appuntamentoForm.controls.praticaId.setValue('');this.ricercaPratica.setValue('',{emitEvent:false});this.praticheAgenda.set([]);}
    this.nuovoAppuntamentoAperto.set(true);
  }

  selezionaSlot(data:string,ora:number,minuti:number):void { this.slotSelezionato.set(`${data}-${ora}-${minuti}`); }
  slotAttivo(data:string,ora:number,minuti:number):boolean { return this.slotSelezionato() === `${data}-${ora}-${minuti}`; }
  apriNuovoAppuntamentoDaCella(data: string, ora: number, minuti = 0): void {
    const fineTotale = ora * 60 + minuti + 30;
    this.appuntamentoForm.patchValue({
      titolo: 'Nuovo appuntamento',
      data,
      inizio: `${String(ora).padStart(2, '0')}:${String(minuti).padStart(2,'0')}`,
      fine: `${String(Math.floor(fineTotale / 60)).padStart(2, '0')}:${String(fineTotale % 60).padStart(2,'0')}`
    });
    this.apriNuovoAppuntamento();
  }

  chiudiNuovoAppuntamento(): void {
    this.nuovoAppuntamentoAperto.set(false);
    this.eventoInModificaId.set(null);
    this.agendaCompleta?.getApi().unselect();
  }

  selezionaIntervalloAgenda(selezione: DateSelectArg): void {
    const intervallo = AgendaFullCalendarMapper.intervalloSelezionato(selezione);
    this.appuntamentoForm.patchValue({ titolo: 'Nuovo appuntamento', ...intervallo });
    this.apriNuovoAppuntamento();
  }

  apriEventoFullCalendar(click: EventClickArg): void {
    const dto = click.event.extendedProps['dto'] as EventoApi;
    this.apriDettaglioEvento(this.daEventoApi(dto), click.jsEvent);
  }

  persisteSpostamento(modifica: EventDropArg): void { this.persisteModificaCalendario(modifica, 'spostare'); }
  persisteRidimensionamento(modifica: EventResizeDoneArg): void { this.persisteModificaCalendario(modifica, 'ridimensionare'); }

  private persisteModificaCalendario(modifica: EventDropArg | EventResizeDoneArg, azione: string): void {
    let comando;
    try { comando = AgendaFullCalendarMapper.daEvento(modifica.event); }
    catch { modifica.revert(); this.calendarioErrore.set('Intervallo dell’appuntamento non valido.'); return; }
    this.http.put<EventoApi>(`/api/v1/calendario/eventi/${modifica.event.id}`, comando).subscribe({
      next: () => this.aggiornaAgendaCompleta(),
      error: () => { modifica.revert(); this.calendarioErrore.set(`Non è stato possibile ${azione} l’appuntamento. La modifica è stata annullata.`); }
    });
  }

  aggiornaAgendaCompleta(): void { this.agendaCompleta?.getApi().refetchEvents(); }

  salvaAppuntamento(): void {
    this.erroreAppuntamento.set('');
    if (this.appuntamentoForm.invalid) { this.appuntamentoForm.markAllAsTouched(); this.erroreAppuntamento.set('Compila il titolo, la data e gli orari prima di salvare.'); return; }
    const valore = this.appuntamentoForm.getRawValue();
    const inizio = new Date(`${valore.data}T${valore.inizio}:00`);
    const fine = new Date(`${valore.data}T${valore.fine}:00`);
    if (fine <= inizio) { this.erroreAppuntamento.set('L’orario di fine deve essere successivo a quello di inizio.'); return; }
    this.loading.set(true); this.error.set('');
    const corpo = {
      calendarioId: valore.calendario, titolo: valore.titolo, inizio: inizio.toISOString(), fine: fine.toISOString(),
      note: valore.note, invitatiIds: this.personeInvitate().filter(p=>p.selezionata).map(p=>p.id),
      statoDisponibilita: valore.statoDisponibilita, promemoriaMinuti: valore.promemoriaMinuti,
      categoria: valore.categoria, tuttoGiorno: valore.tuttoGiorno, ricorrenza: valore.ricorrenza,
      fineRicorrenza: valore.ricorrenza === 'NESSUNA' ? null : valore.fineRicorrenza,
      praticaId: valore.praticaId || null
    };
    const idModifica=this.eventoInModificaId();
    const richiesta=idModifica?this.http.put<EventoApi>(`/api/v1/calendario/eventi/${idModifica}`,corpo):this.http.post<EventoApi>('/api/v1/calendario/eventi',corpo);
    richiesta.subscribe({
      next: () => { this.caricaAgenda(); this.aggiornaAgendaCompleta(); this.caricaNotifiche(); this.nuovoAppuntamentoAperto.set(false); this.agendaCompleta?.getApi().unselect(); this.loading.set(false); },
      error: response => { this.erroreAppuntamento.set(response?.error?.message ?? 'Appuntamento non salvato. Riprova.'); this.loading.set(false); }
    });
  }
  apriDettaglioEvento(evento:EventoAgenda,event:Event):void { event.stopPropagation(); this.nuovoAppuntamentoAperto.set(false); this.eventoSelezionato.set(evento); }
  chiudiDettaglioEvento():void { this.eventoSelezionato.set(null); }
  modificaEvento(evento:EventoAgenda):void {
    this.eventoInModificaId.set(evento.id??null);this.eventoSelezionato.set(null);
    this.appuntamentoForm.patchValue({titolo:evento.titolo,calendario:String(evento.calendario),data:evento.data,
      inizio:this.formattaOra(evento.ora,evento.minuti),fine:evento.fine??'',tuttoGiorno:!!evento.tuttoGiorno,
      statoDisponibilita:evento.statoDisponibilita??'OCCUPATO',promemoriaMinuti:evento.promemoriaMinuti??0,
      categoria:evento.categoria??'GENERALE',ricorrenza:evento.ricorrenza??'NESSUNA',note:evento.note??'',praticaId:evento.praticaId??''});
    this.ricercaPratica.setValue(evento.praticaCodice?`${evento.praticaCodice} · ${evento.praticaTitolo}`:'',{emitEvent:false});
    this.nuovoAppuntamentoAperto.set(true);
  }
  eliminaEvento(evento:EventoAgenda):void {
    if(!evento.id||!confirm(`Eliminare l’evento “${evento.titolo}”?`))return;
    this.http.delete<void>(`/api/v1/calendario/eventi/${evento.id}`).subscribe({next:()=>{this.eventoSelezionato.set(null);this.caricaAgenda();this.aggiornaAgendaCompleta();},error:()=>this.error.set('Evento non eliminato.')});
  }
  coloreEvento(evento:EventoAgenda):string { const colori:Record<string,string>={studio:'#0b67b2',private:'#7c3aed',hearings:'#0f766e',deadlines:'#dc2626',shared:'#d97706'};return colori[evento.colore||'']||evento.colore||'#0b67b2'; }
  etichettaStato(stato?:string):string { return ({LIBERO:'Libero',PROVVISORIO:'Provvisorio',OCCUPATO:'Occupato',FUORI_SEDE:'Fuori sede'} as Record<string,string>)[stato||'']||'Occupato'; }
  formattaOra(ora:number,minuti=0):string { return `${String(ora).padStart(2,'0')}:${String(minuti).padStart(2,'0')}`; }
  nomeCalendario(chiave:ChiaveCalendario):string { return this.calendariAgenda().find(c=>c.chiave===chiave)?.nome||'Calendario'; }

  cambiaVisibilitaCalendario(chiave: ChiaveCalendario, selezionato: boolean): void {
    this.calendariAgenda.update(calendari => calendari.map(calendario =>
      calendario.chiave === chiave ? { ...calendario, selezionato } : calendario
    ));
    this.aggiornaWidgetCalendario();
    this.aggiornaAgendaCompleta();
  }

  cambiaVisibilitaPersona(nome: string, selezionata: boolean): void {
    this.personeStudio.update(persone => persone.map(persona =>
      persona.nome === nome ? { ...persona, selezionata } : persona
    ));
    this.aggiornaWidgetCalendario();
  }

  cambiaCondivisionePersona(nome: string, selezionata: boolean): void {
    this.personeCondivisione.update(persone => persone.map(persona =>
      persona.nome === nome ? { ...persona, selezionata } : persona
    ));
  }
  cambiaInvitoPersona(id:string,selezionata:boolean):void { this.personeInvitate.update(lista=>lista.map(p=>p.id===id?{...p,selezionata}:p)); }
  aggiornaInvitati(event: Event): void {
    const selezionati = new Set(Array.from((event.target as HTMLSelectElement).selectedOptions).map(opzione => opzione.value));
    this.personeInvitate.update(lista => lista.map(persona => ({ ...persona, selezionata: selezionati.has(persona.id) })));
  }

  eventoVisibile(evento: EventoAgenda): boolean {
    const organizzatore = this.personeStudio().find(persona => persona.id === evento.personaId);
    return !!this.calendariAgenda().find(calendario => calendario.chiave === evento.calendario)?.selezionato
      && (organizzatore?.selezionata ?? true);
  }

  eventiNellaCella(data: string, ora: number, minuti: number): EventoAgenda[] {
    return this.eventiAgenda().filter(evento => evento.data === data && evento.ora === ora && (evento.minuti ?? 0) === minuti && this.eventoVisibile(evento));
  }

  eventiDelGiorno(data: string): EventoAgenda[] {
    return this.eventiAgenda().filter(evento => evento.data === data && this.eventoVisibile(evento));
  }

  posizioneOraAttuale(): number {
    const ora = this.oraAttuale();
    return ((ora.getHours() - this.oreCalendario[0]) * 86) + (ora.getMinutes() / 60 * 86);
  }

  private creaIntestazioneCalendario(): string {
    const formato = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    if (this.vistaCalendario() === 'giorno') return formato.format(this.dataCalendario());
    if (this.vistaCalendario() === 'mese') return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(this.dataCalendario());
    const giorni = this.giorniVisualizzati();
    return `${formato.format(this.dataDaIso(giorni[0].iso))} – ${formato.format(this.dataDaIso(giorni[6].iso))}`;
  }

  private creaGiornoVista(data: Date): { iso: string; numero: string; nome: string; oggi: boolean; meseCorrente: boolean } {
    return {
      iso: this.dataIsoLocale(data),
      numero: String(data.getDate()).padStart(2, '0'),
      nome: new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(data),
      oggi: this.dataIsoLocale(data) === this.dataIsoLocale(new Date()),
      meseCorrente: data.getMonth() === this.dataCalendario().getMonth()
    };
  }

  private inizioGiorno(data: Date): Date { return new Date(data.getFullYear(), data.getMonth(), data.getDate()); }
  private inizioSettimana(data: Date): Date {
    const giorno = data.getDay() || 7;
    return this.aggiungiGiorni(this.inizioGiorno(data), 1 - giorno);
  }
  private aggiungiGiorni(data: Date, giorni: number): Date { return new Date(data.getFullYear(), data.getMonth(), data.getDate() + giorni); }
  dataIsoLocale(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }
  private dataDaIso(iso: string): Date { const [anno, mese, giorno] = iso.split('-').map(Number); return new Date(anno, mese - 1, giorno); }

  apriGestioneCalendari(): void {
    this.nuovoAppuntamentoAperto.set(false);
    this.eventoSelezionato.set(null);
    this.error.set('');
    this.gestioneCalendariAperta.set(true);
    this.annullaModificaCalendario();
  }

  chiudiGestioneCalendari(): void {
    this.gestioneCalendariAperta.set(false);
    this.annullaModificaCalendario();
  }

  apriNuovoCalendario(): void {
    this.calendarioInModifica.set(null);
    this.calendarioDaEliminare.set(null);
    this.personeCondivisione.update(persone => persone.map(persona => ({ ...persona, selezionata: false })));
    this.calendarioCondivisoForm.reset({ nome: '', colore:'#d97706' });
    this.nuovoCalendarioAperto.set(true);
  }

  annullaModificaCalendario(): void {
    this.nuovoCalendarioAperto.set(false);
    this.calendarioInModifica.set(null);
    this.calendarioDaEliminare.set(null);
  }

  modificaCalendario(calendario: CalendarioAgenda): void {
    if (!calendario.gestibile) return;
    this.calendarioInModifica.set(String(calendario.chiave));
    this.calendarioDaEliminare.set(null);
    this.calendarioCondivisoForm.setValue({ nome: calendario.nome, colore: calendario.classeColore });
    const condivisi = new Set(calendario.condivisoConIds ?? []);
    this.personeCondivisione.update(persone => persone.map(persona => ({ ...persona, selezionata: condivisi.has(persona.id) })));
    this.nuovoCalendarioAperto.set(true);
  }

  richiediEliminazioneCalendario(chiave: ChiaveCalendario): void {
    this.nuovoCalendarioAperto.set(false);
    this.calendarioInModifica.set(null);
    this.calendarioDaEliminare.set(String(chiave));
  }

  annullaEliminazioneCalendario(): void {
    this.calendarioDaEliminare.set(null);
  }

  eliminaCalendario(chiave: ChiaveCalendario): void {
    this.loading.set(true);
    this.error.set('');
    this.http.delete<void>(`/api/v1/calendario/calendari/${chiave}`).subscribe({
      next: () => {
        this.calendariAgenda.update(lista => lista.filter(calendario => calendario.chiave !== chiave));
        this.eventiAgenda.update(lista => lista.filter(evento => evento.calendario !== chiave));
        if (this.appuntamentoForm.controls.calendario.value === chiave) {
          this.appuntamentoForm.controls.calendario.setValue(String(this.calendariAgenda()[0]?.chiave ?? ''));
        }
        this.calendarioDaEliminare.set(null);
        this.aggiornaWidgetCalendario();
        this.loading.set(false);
      },
      error: response => { this.error.set(response?.error?.message ?? 'Calendario non eliminato.'); this.loading.set(false); }
    });
  }

  salvaCalendarioCondiviso(): void {
    if (this.calendarioCondivisoForm.invalid) {
      this.calendarioCondivisoForm.markAllAsTouched();
      return;
    }
    const nome = this.calendarioCondivisoForm.controls.nome.value.trim();
    const personeSelezionate = this.personeCondivisione().filter(persona => persona.selezionata);
    const condivisoCon = personeSelezionate.map(persona => persona.nome);
    this.loading.set(true);
    const idCalendario = this.calendarioInModifica();
    const richiesta = { nome, colore:this.calendarioCondivisoForm.controls.colore.value, condivisoCon: personeSelezionate.map(p=>p.id) };
    const salvataggio = idCalendario
      ? this.http.put<CalendarioApi>(`/api/v1/calendario/calendari/${idCalendario}`, richiesta)
      : this.http.post<CalendarioApi>('/api/v1/calendario/calendari', richiesta);
    salvataggio.subscribe({
      next: calendario => {
        const aggiornato = this.daCalendarioApi(calendario, condivisoCon);
        this.calendariAgenda.update(lista => idCalendario ? lista.map(elemento => elemento.chiave === idCalendario ? aggiornato : elemento) : [...lista, aggiornato]);
        this.annullaModificaCalendario();
        this.loading.set(false);
      },
      error: response => { this.error.set(response?.error?.message ?? 'Calendario non salvato.'); this.loading.set(false); }
    });
  }


  creaCollaboratore(): void {
    if (!this.studioProfile()?.canEditBranding) {
      this.error.set('Solo il titolare può aggiungere collaboratori allo Studio.');
      return;
    }
    if (this.collaboratoreForm.invalid) {
      this.collaboratoreForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.collaboratorMessage.set('');
    this.http.post<CollaboratoreStudio>('/api/v1/studio/collaboratori', this.collaboratoreForm.getRawValue()).subscribe({
      next: collaboratore => {
        this.collaboratoriStudio.update(collaboratori => [collaboratore, ...collaboratori]);
        this.collaboratoreForm.reset({ nome: '', cognome: '', email: '', ruolo: 'AVVOCATO' });
        this.collaboratorMessage.set('Collaboratore creato. La password temporanea è stata inviata via email.');
        this.aggiornaWidgetCollaboratori();
        this.loading.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Collaboratore non creato. Verifica permessi e dati inseriti.');
        this.loading.set(false);
      }
    });
  }

  etichettaRuoloCollaboratore(ruolo: string): string {
    return ({
      LAWYER: 'AVVOCATO',
      AVVOCATO: 'AVVOCATO',
      SEGRETERIA: 'SEGRETERIA',
      STUDIO_ADMIN: 'AMMINISTRATORE',
      OWNER: 'TITOLARE'
    } as Record<string, string>)[ruolo] ?? ruolo.replaceAll('_', ' ');
  }

  inizialiCollaboratore(collaboratore: CollaboratoreStudio): string {
    return `${collaboratore.nome.charAt(0)}${collaboratore.cognome.charAt(0)}`.toUpperCase();
  }

  cambiaPasswordPersonale(): void {
    if (this.cambioPasswordForm.invalid) {
      this.cambioPasswordForm.markAllAsTouched();
      return;
    }
    const valore = this.cambioPasswordForm.getRawValue();
    if (valore.nuovaPassword !== valore.confermaPassword) {
      this.error.set('La nuova password e la conferma non coincidono.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.passwordMessage.set('');
    this.http.put<void>('/api/v1/profilo/password', {
      passwordAttuale: valore.passwordAttuale,
      nuovaPassword: valore.nuovaPassword
    }).subscribe({
      next: () => {
        this.cambioPasswordForm.reset({ passwordAttuale: '', nuovaPassword: '', confermaPassword: '' });
        this.passwordMessage.set('Password personale aggiornata.');
        this.loading.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Password non aggiornata. Controlla la password attuale.');
        this.loading.set(false);
      }
    });
  }

  saveBranding(): void {
    if (this.brandingForm.invalid) {
      this.brandingForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.settingsMessage.set('');
    this.http.put<ProfiloStudio>('/api/v1/studio/profile', this.brandingForm.getRawValue()).subscribe({
      next: profile => {
        this.studioProfile.set(profile);
        this.applyTheme(profile, this.dashboardPreference());
        this.settingsMessage.set('Dati dello Studio aggiornati.');
        this.settingsOpen.set(false);
        this.loading.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Non puoi modificare i dati dello Studio.');
        this.loading.set(false);
      }
    });
  }

  saveDashboardPreferences(): void {
    this.loading.set(true);
    this.settingsMessage.set('');
    const value = this.dashboardForm.getRawValue();
    const widgetLayout = JSON.stringify(this.activeWidgets().map(({ key, x, y, w, h }) => ({ key, x, y, w, h, versioneLayout: VERSIONE_LAYOUT_GRIDSTACK })));
    this.http.put<PreferenzeScrivania>('/api/v1/workspace/preferences', { ...value, widgetLayout }).subscribe({
      next: preference => {
        this.dashboardPreference.set(preference);
        this.applyTheme(this.studioProfile(), preference);
        this.settingsMessage.set('Aspetto personale aggiornato.');
        this.loading.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Preferenze non salvate.');
        this.loading.set(false);
      }
    });
  }

  private submit(url: string, body: object): void {
    this.loading.set(true);
    this.error.set('');
    this.http.post<{ accessToken: string; displayName: string; deveCambiarePassword: boolean }>(url, body).subscribe({
      next: response => {
        sessionStorage.setItem('foro_access_token', response.accessToken);
        this.userName.set(response.displayName);
        this.screen.set('scrivania');
        this.loadWorkspaceSettings();
        if (response.deveCambiarePassword) {
          this.settingsOpen.set(true);
          this.passwordMessage.set('Per sicurezza devi sostituire la password temporanea prima di continuare.');
        }
        this.loading.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Operazione non riuscita. Riprova.');
        this.loading.set(false);
      }
    });
  }

  private loadWorkspaceSettings(): void {
    this.caricaAgenda();
    this.caricaNotifiche();
    this.http.get<ProfiloStudio>('/api/v1/studio/profile').subscribe(profile => {
      this.studioProfile.set(profile);
      this.brandingForm.patchValue({
        name: profile.name,
        addressLine: profile.addressLine ?? '',
        city: profile.city ?? '',
        postalCode: profile.postalCode ?? '',
        country: profile.country ?? 'Italia',
        phone: profile.phone ?? '',
        website: profile.website ?? '',
        logoUrl: profile.logoUrl ?? '',
        primaryColor: profile.primaryColor,
        accentColor: profile.accentColor,
        secondaryColor: profile.secondaryColor,
        themePreset: profile.themePreset
      });
      this.applyTheme(profile, this.dashboardPreference());
      if (profile.canEditBranding) {
        if (!this.activeWidgets().some(widget=>widget.key==='collaboratori')) {
          const widget=this.creaWidgetDaDefinizione('collaboratori',7,5); if(widget)this.activeWidgets.update(lista=>[...lista,widget]);
        }
      } else {
        this.activeWidgets.update(lista=>lista.filter(widget=>widget.key!=='collaboratori'));
        if(this.expandedWidget()?.key==='collaboratori')this.closeExpandedWidget();
      }
    });
    this.http.get<CollaboratoreStudio[]>('/api/v1/studio/collaboratori').subscribe({
      next: collaboratori => { this.collaboratoriStudio.set(collaboratori); this.aggiornaWidgetCollaboratori(); },
      error: () => this.collaboratoriStudio.set([])
    });
    this.http.get<PreferenzeScrivania>('/api/v1/workspace/preferences').subscribe(preference => {
      this.dashboardPreference.set(preference);
      this.ripristinaLayoutWidget(preference.widgetLayout);
      this.dashboardForm.patchValue({
        themeMode: preference.themeMode,
        dashboardDensity: preference.dashboardDensity,
        personalAccentColor: preference.personalAccentColor ?? this.studioProfile()?.accentColor ?? '#0f766e'
      });
      this.applyTheme(this.studioProfile(), preference);
    });
  }

  private creaWidgetDaDefinizione(key: ChiaveWidget, x: number, y: number): WidgetScrivania | null {
    const definition = this.widgetLibrary.find(widget => widget.key === key);
    if (!definition) return null;
    const widget = {
      ...definition,
      x,
      y,
      ...this.dimensioniPredefinite(key),
      metric: 'Nuovo',
      preview: 'Widget aggiunto alla scrivania.',
      details: ['Anteprima operativa', 'Azioni rapide', 'Vista estesa'],
      righeAnteprima: [
        { titolo: definition.title, descrizione: 'Nuovo elemento operativo', stato: 'Nuovo' }
      ]
    };
    if(key==='collaboratori')return {...widget,metric:`${this.collaboratoriStudio().length} persone`,preview:'Gestisci ruoli e accessi dello Studio',details:this.collaboratoriStudio().map(c=>`${c.nome} ${c.cognome}`),righeAnteprima:this.righeCollaboratori()};
    return widget;
  }

  private righeCollaboratori(): RigaWidget[] { return this.collaboratoriStudio().slice(0,4).map(c=>({titolo:`${c.nome} ${c.cognome}`,descrizione:c.email,stato:this.etichettaRuoloCollaboratore(c.ruolo)})); }
  private aggiornaWidgetCollaboratori(): void { this.activeWidgets.update(widgets=>widgets.map(widget=>widget.key==='collaboratori'?{...widget,metric:`${this.collaboratoriStudio().length} persone`,preview:'Ruoli e accessi amministrati dal titolare',details:this.collaboratoriStudio().map(c=>`${c.nome} ${c.cognome}`),righeAnteprima:this.righeCollaboratori()}:widget)); }


  private caricaNotifiche(): void {
    this.http.get<NotificaApi[]>('/api/v1/notifiche').subscribe(lista => this.notificheInviti.set(lista.map(n => ({
      icona:'calendario', categoria:'Appuntamento', titolo:n.titolo, descrizione:n.descrizione,
      orario:new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit'}).format(new Date(n.creataIl)),
      widget:'calendario', oggettoTitolo:n.titolo
    }))));
  }

  private caricaAgenda(): void {
    this.http.get<PersonaStudioApi[]>('/api/v1/calendario/persone').subscribe(persone => {
      this.personeStudio.set(persone.map(p=>({...p,selezionata:true})));
      this.personeCondivisione.set(persone.map(p=>({...p,selezionata:false})));
      this.personeInvitate.set(persone.map(p=>({...p,selezionata:false})));
    });
    this.http.get<CalendarioApi[]>('/api/v1/calendario/calendari').subscribe(calendari => {
      const visibilitaCorrente = new Map(this.calendariAgenda().map(calendario => [String(calendario.chiave), calendario.selezionato]));
      this.calendariAgenda.set(calendari.map(calendario => ({
        ...this.daCalendarioApi(calendario, calendario.condivisoCon.map(id => this.personeStudio().find(persona => persona.id === id)?.nome).filter((nome): nome is string => !!nome)),
        selezionato: visibilitaCorrente.get(calendario.id) ?? true
      })));
      const predefinito = calendari.find(c => c.colore === 'studio') ?? calendari[0];
      if (predefinito) this.appuntamentoForm.controls.calendario.setValue(predefinito.id);
      const dal = `${new Date().getFullYear() - 1}-01-01`;
      const al = `${new Date().getFullYear() + 2}-01-01`;
      this.http.get<EventoApi[]>('/api/v1/calendario/eventi', { params: { dal, al } }).subscribe(eventi => {
        this.eventiAgenda.set(eventi.map(evento => this.daEventoApi(evento)));
        this.aggiornaWidgetCalendario();
      });
    });
  }

  private daCalendarioApi(c: CalendarioApi, condivisoCon: string[]): CalendarioAgenda {
    return { chiave: c.id, nome: c.nome, classeColore: c.colore, selezionato: true, condivisoCon, condivisoConIds: c.condivisoCon, condivisoConTuttoLoStudio: c.condivisoTuttoStudio, gestibile: c.gestibile };
  }
  private daEventoApi(e: EventoApi): EventoAgenda {
    const inizio = new Date(e.inizio);
    const organizzatore = this.personeStudio().find(persona => persona.id === e.creatoreId);
    const fine=new Date(e.fine);
    return { id: e.id, data: this.dataIsoLocale(inizio), ora: inizio.getHours(), minuti: inizio.getMinutes(), fine:`${String(fine.getHours()).padStart(2,'0')}:${String(fine.getMinutes()).padStart(2,'0')}`, calendario: e.calendarioId, colore:e.colore, titolo: e.titolo, personaId: e.creatoreId, persona: organizzatore?.nome || this.userName() || 'Avvocato dello Studio', note:e.note, partecipanti:e.partecipanti, statoDisponibilita:e.statoDisponibilita, promemoriaMinuti:e.promemoriaMinuti, categoria:e.categoria, ricorrenza:e.ricorrenza, tuttoGiorno:e.tuttoGiorno,praticaId:e.praticaId,praticaCodice:e.praticaCodice,praticaTitolo:e.praticaTitolo,praticaStato:e.praticaStato };
  }
  aggiornaWidgetCalendario(): void {
    const adesso = this.oraAttuale();
    const oggi = this.dataIsoLocale(adesso);
    const domani = this.dataIsoLocale(this.aggiungiGiorni(adesso, 1));
    const visibili = this.eventiAgenda().filter(evento => this.eventoVisibile(evento));
    const eventiOggi = visibili.filter(evento => evento.data === oggi);
    const rilevanti = visibili.filter(evento => {
      if (evento.data > oggi) return true;
      if (evento.data < oggi) return false;
      if (evento.tuttoGiorno) return true;
      const [oraFine, minutiFine] = (evento.fine ?? this.formattaOra(evento.ora, evento.minuti)).split(':').map(Number);
      return oraFine * 60 + minutiFine >= adesso.getHours() * 60 + adesso.getMinutes();
    }).sort((a, b) => a.data.localeCompare(b.data) || a.ora - b.ora || (a.minuti ?? 0) - (b.minuti ?? 0));
    const prossimi = rilevanti.slice(0, 5);
    const righe: RigaWidget[] = prossimi.map(evento => {
      const calendario = this.calendariAgenda().find(elemento => elemento.chiave === evento.calendario);
      const categoria = this.etichettaCategoriaEvento(evento);
      const urgente = evento.data === oggi && categoria === 'Scadenza';
      return {
        titolo: `${urgente ? '⚠ ' : ''}${evento.tuttoGiorno ? 'Tutto il giorno' : this.formattaOra(evento.ora, evento.minuti)} — ${evento.titolo}`,
        descrizione: `${categoria} · ${calendario?.nome ?? 'Calendario'}${evento.praticaCodice?` · ${evento.praticaCodice} · ${evento.praticaTitolo}`:''}`,
        stato: evento.data === oggi ? 'Oggi' : evento.data === domani ? 'Domani' : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(this.dataDaIso(evento.data)),
        eventoId: evento.id,
        colore: evento.colore ? this.coloreEvento(evento) : calendario?.classeColore ?? this.coloreEvento(evento),
        urgente,
        praticaId:evento.praticaId
      };
    });
    const quantita = eventiOggi.length;
    const metric = quantita === 0 ? 'Nessun impegno oggi' : `${quantita} ${quantita === 1 ? 'impegno' : 'impegni'} oggi`;
    const prossimo = rilevanti[0];
    const preview = prossimo
      ? prossimo.tuttoGiorno && prossimo.data === oggi
        ? 'Prossimo: evento per tutta la giornata'
        : `Prossimo ${prossimo.data === oggi ? 'alle' : 'il ' + new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(this.dataDaIso(prossimo.data)) + ' alle'} ${this.formattaOra(prossimo.ora, prossimo.minuti)}`
      : 'Nessun prossimo evento';
    this.activeWidgets.update(widgets => widgets.map(widget => widget.key === 'calendario'
      ? { ...widget, metric, preview, details: righe.map(riga => riga.titolo), righeAnteprima: righe }
      : widget));
  }

  private etichettaCategoriaEvento(evento: EventoAgenda): string {
    const categoria = (evento.categoria ?? '').toUpperCase();
    if (categoria.includes('SCADENZ') || String(evento.calendario).toLowerCase().includes('scadenz')) return 'Scadenza';
    if (categoria.includes('UDIENZ') || String(evento.calendario).toLowerCase().includes('udienz')) return 'Udienza';
    if (categoria.includes('CLIENT')) return 'Cliente';
    if (categoria.includes('RIUNION')) return 'Riunione';
    return 'Evento';
  }

  private applicaNodiGridStack(nodi: GridStackNode[]): void {
    const posizioni = new Map(nodi
      .filter(nodo => nodo.id && nodo.x !== undefined && nodo.y !== undefined && nodo.w !== undefined && nodo.h !== undefined)
      .map(nodo => [nodo.id as ChiaveWidget, { x: nodo.x! + 1, y: nodo.y! + 1, w: nodo.w!, h: nodo.h! }]));
    if (!posizioni.size) return;
    posizioni.forEach((posizione, key) => {
      const opzioni = this.opzioniWidgetStabili.get(key);
      if (opzioni) Object.assign(opzioni, { x: posizione.x - 1, y: posizione.y - 1, w: posizione.w, h: posizione.h });
    });
    this.activeWidgets.update(widget => widget.map(elemento => ({ ...elemento, ...(posizioni.get(elemento.key) ?? {}) })));
  }

  private sincronizzaLayoutConcluso(nodo?: GridStackNode): void {
    const layout = this.grigliaScrivania?.grid?.save(false) as GridStackNode[] | undefined;
    const nodi = layout?.length ? layout : this.nodiLayoutPendenti.length ? this.nodiLayoutPendenti : nodo ? [nodo] : [];
    this.applicaNodiGridStack(nodi);
    this.nodiLayoutPendenti = [];
  }

  private dimensioniPredefinite(key: ChiaveWidget): { w: number; h: number } {
    const { w, h } = DIMENSIONI_WIDGET[key];
    return { w, h };
  }

  private ripristinaLayoutWidget(layoutSerializzato: string | null | undefined): void {
    if (!layoutSerializzato?.trim()) return;
    try {
      const posizioni = JSON.parse(layoutSerializzato) as Array<Partial<PosizioneGriglia> & { key?: ChiaveWidget; versioneLayout?: number }>;
      if (!Array.isArray(posizioni)) return;
      const correnti = new Map(this.activeWidgets().map(widget => [widget.key, widget]));
      const versione = Math.max(0, ...posizioni.map(posizione => Number(posizione.versioneLayout) || 0));
      const fattore = versione > 0 && versione < VERSIONE_LAYOUT_GRIDSTACK ? 0.5 : 1;
      const ripristinati = posizioni
        .filter(posizione => posizione?.key && correnti.has(posizione.key) && [posizione.x, posizione.y, posizione.w, posizione.h].every(Number.isFinite))
        .map(posizione => ({
          ...correnti.get(posizione.key!)!,
          x: Math.max(1, Math.round((Number(posizione.x) - 1) * fattore) + 1),
          y: Math.max(1, Math.round((Number(posizione.y) - 1) * (fattore === 0.5 ? 1 : fattore)) + 1),
          w: Math.max(1, Math.round(Number(posizione.w) * fattore)),
          h: Math.max(1, Math.round(Number(posizione.h) * (fattore === 0.5 ? 1 : fattore)))
        }));
      if (ripristinati.length) {
        ripristinati.forEach(widget => {
          const opzioni = this.opzioniWidgetStabili.get(widget.key);
          if (opzioni) Object.assign(opzioni, { x: widget.x - 1, y: widget.y - 1, w: widget.w, h: widget.h });
        });
        this.activeWidgets.set(ripristinati);
        queueMicrotask(() => this.grigliaScrivania?.grid?.load(ripristinati.map(widget => this.opzioniWidget(widget))));
      }
    } catch {
      // Il layout applicativo resta invariato: GridStack compatterà soltanto coordinate valide.
    }
  }

  private salvaLayoutWidget(): void {
    const preferenze = this.dashboardPreference();
    if (!preferenze) return;
    const widgetLayout = JSON.stringify(this.activeWidgets().map(({ key, x, y, w, h }) => ({ key, x, y, w, h, versioneLayout: VERSIONE_LAYOUT_GRIDSTACK })));
    this.http.put<PreferenzeScrivania>('/api/v1/workspace/preferences', { ...preferenze, widgetLayout }).subscribe({
      next: aggiornate => this.dashboardPreference.set(aggiornate),
      error: () => this.error.set('Layout della Scrivania non salvato. Riprova.')
    });
  }

  private readLogoFile(event: Event, onLoad: (logoUrl: string) => void): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result));
    reader.onerror = () => this.error.set('Logo non leggibile. Prova con un PNG, JPG o SVG.');
    reader.readAsDataURL(file);
  }

  private applyTheme(profile: ProfiloStudio | null, preference: PreferenzeScrivania | null): void {
    const root = document.documentElement;
    root.style.setProperty('--foro-primary', profile?.primaryColor ?? '#111827');
    root.style.setProperty('--foro-accent', preference?.personalAccentColor || profile?.accentColor || '#0f766e');
    root.style.setProperty('--foro-secondary', profile?.secondaryColor ?? '#475569');
    root.dataset['foroMode'] = preference?.themeMode === 'DARK' ? 'dark' : 'light';
    root.dataset['foroDensity'] = preference?.dashboardDensity === 'COMPACT' ? 'compact' : 'comfortable';
  }
}
