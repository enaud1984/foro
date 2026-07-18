import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Schermata = 'login' | 'registrazione' | 'scrivania';
type ModalitaTema = 'LIGHT' | 'DARK';
type DensitaScrivania = 'COMFORTABLE' | 'COMPACT';
type ChiaveWidget = 'calendario' | 'documenti' | 'email' | 'clienti' | 'pratiche';
type RuoloCollaboratore = 'AVVOCATO' | 'SEGRETERIA' | 'STUDIO_ADMIN';
type PassoRegistrazione = 'dati' | 'piani' | 'pagamento';
type PianoDemo = 'essential' | 'professional';
type VistaCalendario = 'giorno' | 'settimana' | 'mese';
type ChiaveCalendario = 'studio' | 'privato' | 'udienze' | 'scadenze' | string;
type PosizioneGriglia = { x: number; y: number; w: number; h: number };
type TrascinamentoWidget = {
  key: ChiaveWidget;
  pointerId: number;
  origineX: number;
  origineY: number;
  scartoX: number;
  scartoY: number;
  spostamentoX: number;
  spostamentoY: number;
};

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
  condivisoConTuttoLoStudio?: boolean;
}

interface CalendarioApi { id: string; nome: string; colore: string; condivisoTuttoStudio: boolean; condivisoCon: string[]; }
interface PersonaStudioApi { id: string; nome: string; }
interface NotificaApi { id:string; tipo:string; titolo:string; descrizione:string; eventoId:string; letta:boolean; creataIl:string; }
interface EventoApi { id: string; calendarioId: string; creatoreId: string; calendarioNome: string; colore: string; titolo: string; inizio: string; fine: string; note?: string; partecipanti?: string; statoDisponibilita: string; promemoriaMinuti?: number; categoria?: string; tuttoGiorno: boolean; serieId?: string; ricorrenza: string; fineRicorrenza?: string; }
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
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
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
  readonly dragPlaceholder = signal<PosizioneGriglia | null>(null);
  readonly trascinamentoWidget = signal<TrascinamentoWidget | null>(null);
  readonly vistaCalendario = signal<VistaCalendario>('settimana');
  readonly dataCalendario = signal(this.inizioGiorno(new Date()));
  readonly oraAttuale = signal(new Date());
  readonly nuovoAppuntamentoAperto = signal(false);
  readonly nuovoCalendarioAperto = signal(false);
  readonly erroreAppuntamento = signal('');
  readonly eventoSelezionato = signal<EventoAgenda | null>(null);
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
  readonly eventiAgenda = signal<EventoAgenda[]>([
    { data: '2026-07-07', ora: 9, calendario: 'studio', titolo: 'Riunione Studio', persona: 'Avv. Laura Verdi' },
    { data: '2026-07-09', ora: 10, calendario: 'udienze', titolo: 'Udienza civile', dettaglio: 'Tribunale Milano', persona: 'Avv. Laura Verdi' },
    { data: '2026-07-10', ora: 11, calendario: 'privato', titolo: 'Appuntamento privato', persona: 'Avv. Laura Verdi' },
    { data: '2026-07-08', ora: 12, calendario: 'scadenze', titolo: 'Deposito memoria', persona: 'Avv. Laura Verdi' },
    { data: '2026-07-09', ora: 14, calendario: 'studio', titolo: 'Revisione contratto', persona: 'Avv. Marco Neri' },
    { data: '2026-07-07', ora: 15, calendario: 'studio', titolo: 'Cliente Alfa S.r.l.', persona: 'Avv. Laura Verdi' },
    { data: '2026-07-10', ora: 15, calendario: 'studio', titolo: 'Call controparte', dettaglio: 'Avv. Neri invitato', persona: 'Avv. Marco Neri' }
  ]);
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
      icona: '📅',
      categoria: 'Appuntamento',
      titolo: 'Udienza civile confermata',
      descrizione: 'Tribunale di Milano · Rossi / Alfa S.r.l. · ore 10:30',
      orario: '09:12',
      widget: 'calendario',
      oggettoTitolo: '10:30 — Udienza civile'
    },
    {
      icona: '📁',
      categoria: 'Documento',
      titolo: 'Procura firmata caricata',
      descrizione: 'Nuovo file nel fascicolo Esposito Successione',
      orario: '08:47',
      widget: 'documenti',
      oggettoTitolo: 'Procura firmata Esposito.p7m'
    },
    {
      icona: '✉️',
      categoria: 'Email',
      titolo: 'PEC da associare a pratica',
      descrizione: 'Cancelleria civile · ricevuta deposito telematico',
      orario: 'Ieri',
      widget: 'email',
      oggettoTitolo: 'Cancelleria civile'
    },
    {
      icona: '⚖️',
      categoria: 'Pratica',
      titolo: 'Scadenza fra 2 giorni',
      descrizione: 'Deposito memoria istruttoria · RG 1842/2025',
      orario: '2 gg',
      widget: 'pratiche',
      oggettoTitolo: 'Rossi / Alfa S.r.l.'
    }
  ];
  readonly tutteNotifiche = computed(() => [...this.notificheInviti(), ...this.notificheScrivania]);

  readonly widgetLibrary: DefinizioneWidget[] = [
    { key: 'calendario', icon: '📅', title: 'Calendario', description: 'Agenda stile Outlook, udienze e scadenze' },
    { key: 'documenti', icon: '📁', title: 'Documenti', description: 'Atti, versioni, firme e fascicoli' },
    { key: 'email', icon: '✉️', title: 'Email', description: 'Posta ordinaria e associazioni pratica' },
    { key: 'clienti', icon: '👥', title: 'Clienti', description: 'Anagrafiche e referenti' },
    { key: 'pratiche', icon: '⚖️', title: 'Pratiche', description: 'Fascicolo interno e stato attività' }
  ];

  readonly activeWidgets = signal<WidgetScrivania[]>(this.creaWidgetIniziali());

  /*
  readonly activeWidgetsVecchi = signal<WidgetScrivania[]>([
    {
      ...this.widgetLibrary[0],
      x: 1,
      y: 1,
      w: 6,
      h: 3,
      metric: '12 eventi oggi',
      preview: '08:45 Revisione fascicolo · 10:30 Udienza · 15:00 Cliente · 17:30 Call',
      details: ['08:45 — Revisione fascicolo Beta', '10:30 — Udienza civile, Tribunale di Milano', '12:15 — Scadenza deposito memoria', '15:00 — Appuntamento cliente in studio', '17:30 — Call con controparte']
    },
    { ...this.widgetLibrary[1], x: 7, y: 1, w: 3, h: 2, metric: '248 file', preview: 'Ultimi atti e versioni disponibili.', details: ['Comparsa_costituzione_v3.pdf', 'Procura_firmata_Esposito.p7m', 'Verbale_udienza_10-07.docx'] },
    { ...this.widgetLibrary[2], x: 10, y: 1, w: 3, h: 2, metric: '37 non lette', preview: 'Messaggi da lavorare e associare.', details: ['Tribunale di Milano — notifica provvedimento', 'cliente.rossi@pec.it — documenti integrativi', 'Cancelleria civile — ricevuta deposito'] },
    { ...this.widgetLibrary[3], x: 7, y: 3, w: 3, h: 2, metric: '18 attivi', preview: 'Clienti e referenti principali.', details: ['Cliente Alfa S.r.l.', 'Mario Rossi', 'Beta Fiduciaria S.p.A.'] },
    { ...this.widgetLibrary[4], x: 1, y: 4, w: 6, h: 2, metric: '31 aperte', preview: 'Fascicoli e stati operativi.', details: ['Rossi / Alfa S.r.l. — Urgente', 'Esposito Successione — Aperta', 'De Luca recupero crediti — In lavorazione'] }
  ]);
  */

  readonly loginForm;
  readonly registerForm;
  readonly brandingForm;
  readonly dashboardForm;
  readonly appuntamentoForm;
  readonly calendarioCondivisoForm;
  readonly collaboratoreForm;
  readonly cambioPasswordForm;
  private widgetTrascinato: ChiaveWidget | null = null;
  private layoutPrimaDelTrascinamento: WidgetScrivania[] | null = null;
  private trascinamentoConfermato = false;

  private creaWidgetIniziali(): WidgetScrivania[] {
    return [
      {
        ...this.widgetLibrary[0],
        x: 1,
        y: 1,
        w: 6,
        h: 3,
        metric: '12 eventi oggi',
        preview: 'Appuntamenti in ordine cronologico',
        details: ['08:45 — Revisione fascicolo Beta', '10:30 — Udienza civile, Tribunale di Milano', '12:15 — Scadenza deposito memoria', '15:00 — Appuntamento cliente in studio', '17:30 — Call con controparte'],
        righeAnteprima: [
          { titolo: '08:45 — Revisione fascicolo Beta', descrizione: 'Studio · Avv. Verdi', stato: 'Studio' },
          { titolo: '10:30 — Udienza civile', descrizione: 'Tribunale di Milano · RG 1842/2025', stato: 'Udienza' },
          { titolo: '15:00 — Appuntamento cliente', descrizione: 'Sala riunioni 1 · Cliente Alfa', stato: 'Cliente' }
        ]
      },
      {
        ...this.widgetLibrary[1],
        x: 7,
        y: 1,
        w: 3,
        h: 2,
        metric: '248 file',
        preview: 'Documenti recenti e da validare',
        details: ['Comparsa_costituzione_v3.pdf', 'Procura_firmata_Esposito.p7m', 'Verbale_udienza_10-07.docx'],
        righeAnteprima: [
          { titolo: 'Comparsa costituzione v3.pdf', descrizione: 'Rossi / Alfa S.r.l.', stato: 'Da firmare' },
          { titolo: 'Procura firmata Esposito.p7m', descrizione: 'Caricata oggi alle 09:14', stato: 'Firmato' },
          { titolo: 'Verbale udienza 10-07.docx', descrizione: 'Bozza da revisionare', stato: 'Bozza' }
        ]
      },
      {
        ...this.widgetLibrary[2],
        x: 10,
        y: 1,
        w: 3,
        h: 2,
        metric: '37 non lette',
        preview: 'Messaggi da lavorare e associare',
        details: ['Tribunale di Milano — notifica provvedimento', 'cliente.rossi@pec.it — documenti integrativi', 'Cancelleria civile — ricevuta deposito'],
        righeAnteprima: [
          { titolo: 'Tribunale di Milano', descrizione: 'Notifica provvedimento · 2 allegati', stato: 'Nuova' },
          { titolo: 'cliente.rossi@pec.it', descrizione: 'Documenti integrativi pratica lavoro', stato: 'Associare' },
          { titolo: 'Cancelleria civile', descrizione: 'Ricevuta deposito telematico', stato: 'Archiviata' }
        ]
      },
      {
        ...this.widgetLibrary[3],
        x: 7,
        y: 3,
        w: 3,
        h: 2,
        metric: '18 attivi',
        preview: 'Clienti e referenti principali',
        details: ['Cliente Alfa S.r.l.', 'Mario Rossi', 'Beta Fiduciaria S.p.A.'],
        righeAnteprima: [
          { titolo: 'Cliente Alfa S.r.l.', descrizione: 'Milano · referente: Laura Riva', stato: 'Attivo' },
          { titolo: 'Mario Rossi', descrizione: 'Roma · persona fisica', stato: 'Attivo' },
          { titolo: 'Beta Fiduciaria S.p.A.', descrizione: 'Torino · 4 pratiche aperte', stato: 'VIP' }
        ]
      },
      {
        ...this.widgetLibrary[4],
        x: 1,
        y: 4,
        w: 6,
        h: 2,
        metric: '31 aperte',
        preview: 'Pratiche aperte e prossime attività',
        details: ['Rossi / Alfa S.r.l. — Urgente', 'Esposito Successione — Aperta', 'De Luca recupero crediti — In lavorazione'],
        righeAnteprima: [
          { titolo: 'Rossi / Alfa S.r.l.', descrizione: 'Opposizione decreto ingiuntivo · scadenza 12/07', stato: 'Urgente', evidenza: '2 gg' },
          { titolo: 'Esposito Successione', descrizione: 'Volontaria giurisdizione · documenti mancanti', stato: 'Aperta', evidenza: '45%' },
          { titolo: 'De Luca recupero crediti', descrizione: 'Diffida stragiudiziale · bozza in corso', stato: 'In lavorazione', evidenza: '28%' }
        ]
      }
    ];
  }

  constructor(private readonly fb: FormBuilder, private readonly http: HttpClient) {
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
      note: ['Preparare fascicolo e documenti cliente.']
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
      passwordTemporanea: ['', [Validators.required, Validators.minLength(12)]]
    });
    this.cambioPasswordForm = this.fb.nonNullable.group({
      passwordAttuale: ['', Validators.required],
      nuovaPassword: ['', [Validators.required, Validators.minLength(12)]],
      confermaPassword: ['', [Validators.required, Validators.minLength(12)]]
    });
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
      this.activeWidgets.update(widgets => this.reorderWidgets([...widgets, widget], widget.key));
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

  startWidgetDrag(key: ChiaveWidget): void {
    this.widgetTrascinato = key;
    this.trascinamentoConfermato = false;
    this.layoutPrimaDelTrascinamento = this.activeWidgets().map(widget => ({ ...widget }));
    const widget = this.activeWidgets().find(item => item.key === key);
    if (widget) this.dragPlaceholder.set({ x: widget.x, y: widget.y, w: widget.w, h: widget.h });
  }

  iniziaTrascinamentoWidget(widget: WidgetScrivania, event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    const card = (event.currentTarget as HTMLElement).closest('.op-widget') as HTMLElement | null;
    const rettangoloCard = card?.getBoundingClientRect();
    this.widgetTrascinato = widget.key;
    this.trascinamentoConfermato = false;
    this.layoutPrimaDelTrascinamento = this.activeWidgets().map(item => ({ ...item }));
    this.dragPlaceholder.set({ x: widget.x, y: widget.y, w: widget.w, h: widget.h });
    this.trascinamentoWidget.set({
      key: widget.key,
      pointerId: event.pointerId,
      origineX: event.clientX,
      origineY: event.clientY,
      scartoX: rettangoloCard ? event.clientX - rettangoloCard.left : 0,
      scartoY: rettangoloCard ? event.clientY - rettangoloCard.top : 0,
      spostamentoX: 0,
      spostamentoY: 0
    });
  }

  @HostListener('window:pointermove', ['$event'])
  aggiornaTrascinamentoWidget(event: PointerEvent): void {
    const trascinamento = this.trascinamentoWidget();
    if (!trascinamento || trascinamento.pointerId !== event.pointerId) return;
    event.preventDefault();
    this.trascinamentoWidget.set({
      ...trascinamento,
      spostamentoX: event.clientX - trascinamento.origineX,
      spostamentoY: event.clientY - trascinamento.origineY
    });

    const griglia = document.querySelector('.operational-grid') as HTMLElement | null;
    const layoutBase = this.layoutPrimaDelTrascinamento;
    const widget = layoutBase?.find(item => item.key === trascinamento.key);
    if (!griglia || !layoutBase || !widget) return;
    const posizione = this.positionFromCoordinates(
      event.clientX - trascinamento.scartoX,
      event.clientY - trascinamento.scartoY,
      griglia,
      widget.w
    );
    const nuovaPosizione = { x: posizione.x, y: posizione.y, w: widget.w, h: widget.h };
    const posizioneCorrente = this.dragPlaceholder();
    if (posizioneCorrente && this.samePosition(posizioneCorrente, nuovaPosizione)) return;

    this.dragPlaceholder.set(nuovaPosizione);
    const layoutProvvisorio = this.reorderWidgets(
      layoutBase.map(item => item.key === widget.key ? { ...item, x: posizione.x, y: posizione.y } : item),
      widget.key
    );
    const posizioniProvvisorie = new Map(layoutProvvisorio.map(item => [item.key, item]));
    this.activeWidgets.set(layoutBase.map(item => {
      const posizioneProvvisoria = posizioniProvvisorie.get(item.key) ?? item;
      return item.key === widget.key
        ? { ...posizioneProvvisoria, x: widget.x, y: widget.y }
        : posizioneProvvisoria;
    }));
  }

  @HostListener('window:pointerup', ['$event'])
  terminaTrascinamentoWidget(event: PointerEvent): void {
    const trascinamento = this.trascinamentoWidget();
    if (!trascinamento || trascinamento.pointerId !== event.pointerId) return;
    const destinazione = this.dragPlaceholder();
    const layoutBase = this.layoutPrimaDelTrascinamento;
    if (layoutBase) this.activeWidgets.set(layoutBase.map(widget => ({ ...widget })));
    if (destinazione) this.moveOrAddWidget(trascinamento.key, destinazione.x, destinazione.y);
    this.trascinamentoConfermato = true;
    this.concludiTrascinamentoPointer(event);
  }

  @HostListener('window:pointercancel', ['$event'])
  annullaTrascinamentoWidget(event: PointerEvent): void {
    const trascinamento = this.trascinamentoWidget();
    if (!trascinamento || trascinamento.pointerId !== event.pointerId) return;
    if (this.layoutPrimaDelTrascinamento) {
      this.activeWidgets.set(this.layoutPrimaDelTrascinamento.map(widget => ({ ...widget })));
    }
    this.concludiTrascinamentoPointer(event);
  }

  trasformazioneTrascinamento(widget: WidgetScrivania): string | null {
    const trascinamento = this.trascinamentoWidget();
    if (!trascinamento || trascinamento.key !== widget.key) return null;
    return `translate3d(${trascinamento.spostamentoX}px, ${trascinamento.spostamentoY}px, 0) scale(1.018)`;
  }

  identificaWidget(_indice: number, widget: WidgetScrivania): ChiaveWidget {
    return widget.key;
  }

  updateDragPreview(event: DragEvent): void {
    event.preventDefault();
    if (!this.widgetTrascinato) return;
    const posizione = this.positionFromPointer(event);
    const layoutBase = this.layoutPrimaDelTrascinamento ?? this.activeWidgets();
    const widget = layoutBase.find(item => item.key === this.widgetTrascinato);
    if (!posizione || !widget) return;
    const nuovaPosizione = { x: posizione.x, y: posizione.y, w: widget.w, h: widget.h };
    const posizioneCorrente = this.dragPlaceholder();
    if (posizioneCorrente && this.samePosition(posizioneCorrente, nuovaPosizione)) return;
    this.dragPlaceholder.set(nuovaPosizione);
    this.activeWidgets.set(
      this.reorderWidgets(
        layoutBase.map(item => item.key === this.widgetTrascinato ? { ...item, x: posizione.x, y: posizione.y } : item),
        this.widgetTrascinato as ChiaveWidget
      )
    );
  }

  dropWidget(event: DragEvent): void {
    event.preventDefault();
    if (!this.widgetTrascinato) return;
    const posizione = this.positionFromPointer(event);
    const layoutBase = this.layoutPrimaDelTrascinamento;
    if (layoutBase) this.activeWidgets.set(layoutBase.map(widget => ({ ...widget })));
    if (posizione) this.moveOrAddWidget(this.widgetTrascinato, posizione.x, posizione.y);
    this.trascinamentoConfermato = true;
    this.widgetTrascinato = null;
    this.layoutPrimaDelTrascinamento = null;
    this.dragPlaceholder.set(null);
  }

  endWidgetDrag(): void {
    if (!this.trascinamentoConfermato && this.layoutPrimaDelTrascinamento) {
      this.activeWidgets.set(this.compactWidgets(this.layoutPrimaDelTrascinamento.map(widget => ({ ...widget }))));
    }
    this.widgetTrascinato = null;
    this.layoutPrimaDelTrascinamento = null;
    this.trascinamentoConfermato = false;
    this.dragPlaceholder.set(null);
  }

  expandWidget(widget: WidgetScrivania, event: Event): void {
    event.stopPropagation();
    this.rigaWidgetSelezionata.set(null);
    this.openWidget(widget);
  }

  apriRigaWidget(widget: WidgetScrivania, riga: RigaWidget, event: Event): void {
    event.stopPropagation();
    this.rigaWidgetSelezionata.set(riga);
    this.openWidget(widget);
  }

  closeWidget(key: ChiaveWidget, event: Event): void {
    event.stopPropagation();
    this.activeWidgets.update(widgets => widgets.filter(widget => widget.key !== key));
  }

  openWidget(widget: WidgetScrivania): void {
    this.expandedWidget.set(widget);
    if (widget.key === 'calendario') this.allineaPlannerOraAttuale();
  }

  closeExpandedWidget(): void {
    this.expandedWidget.set(null);
    this.rigaWidgetSelezionata.set(null);
    this.nuovoAppuntamentoAperto.set(false);
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

  apriNuovoAppuntamento(): void {
    this.nuovoCalendarioAperto.set(false);
    this.erroreAppuntamento.set('');
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
  }

  salvaAppuntamento(): void {
    this.erroreAppuntamento.set('');
    if (this.appuntamentoForm.invalid) { this.appuntamentoForm.markAllAsTouched(); this.erroreAppuntamento.set('Compila il titolo, la data e gli orari prima di salvare.'); return; }
    const valore = this.appuntamentoForm.getRawValue();
    const inizio = new Date(`${valore.data}T${valore.inizio}:00`);
    const fine = new Date(`${valore.data}T${valore.fine}:00`);
    if (fine <= inizio) { this.erroreAppuntamento.set('L’orario di fine deve essere successivo a quello di inizio.'); return; }
    this.loading.set(true); this.error.set('');
    this.http.post<EventoApi>('/api/v1/calendario/eventi', {
      calendarioId: valore.calendario, titolo: valore.titolo, inizio: inizio.toISOString(), fine: fine.toISOString(),
      note: valore.note, invitatiIds: this.personeInvitate().filter(p=>p.selezionata).map(p=>p.id),
      statoDisponibilita: valore.statoDisponibilita, promemoriaMinuti: valore.promemoriaMinuti,
      categoria: valore.categoria, tuttoGiorno: valore.tuttoGiorno, ricorrenza: valore.ricorrenza,
      fineRicorrenza: valore.ricorrenza === 'NESSUNA' ? null : valore.fineRicorrenza
    }).subscribe({
      next: () => { this.caricaAgenda(); this.caricaNotifiche(); this.nuovoAppuntamentoAperto.set(false); this.loading.set(false); },
      error: response => { this.erroreAppuntamento.set(response?.error?.message ?? 'Appuntamento non salvato. Riprova.'); this.loading.set(false); }
    });
  }
  apriDettaglioEvento(evento:EventoAgenda,event:Event):void { event.stopPropagation(); this.nuovoAppuntamentoAperto.set(false); this.eventoSelezionato.set(evento); }
  chiudiDettaglioEvento():void { this.eventoSelezionato.set(null); }
  coloreEvento(evento:EventoAgenda):string { const colori:Record<string,string>={studio:'#0b67b2',private:'#7c3aed',hearings:'#0f766e',deadlines:'#dc2626',shared:'#d97706'};return colori[evento.colore||'']||evento.colore||'#0b67b2'; }
  etichettaStato(stato?:string):string { return ({LIBERO:'Libero',PROVVISORIO:'Provvisorio',OCCUPATO:'Occupato',FUORI_SEDE:'Fuori sede'} as Record<string,string>)[stato||'']||'Occupato'; }
  formattaOra(ora:number,minuti=0):string { return `${String(ora).padStart(2,'0')}:${String(minuti).padStart(2,'0')}`; }
  nomeCalendario(chiave:ChiaveCalendario):string { return this.calendariAgenda().find(c=>c.chiave===chiave)?.nome||'Calendario'; }

  cambiaVisibilitaCalendario(chiave: ChiaveCalendario, selezionato: boolean): void {
    this.calendariAgenda.update(calendari => calendari.map(calendario =>
      calendario.chiave === chiave ? { ...calendario, selezionato } : calendario
    ));
  }

  cambiaVisibilitaPersona(nome: string, selezionata: boolean): void {
    this.personeStudio.update(persone => persone.map(persona =>
      persona.nome === nome ? { ...persona, selezionata } : persona
    ));
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

  apriNuovoCalendario(): void {
    this.nuovoAppuntamentoAperto.set(false);
    this.calendarioCondivisoForm.reset({ nome: '', colore:'#d97706' });
    this.nuovoCalendarioAperto.set(true);
  }

  chiudiNuovoCalendario(): void {
    this.nuovoCalendarioAperto.set(false);
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
    this.http.post<CalendarioApi>('/api/v1/calendario/calendari', { nome, colore:this.calendarioCondivisoForm.controls.colore.value, condivisoCon: personeSelezionate.map(p=>p.id) }).subscribe({
      next: calendario => { this.calendariAgenda.update(lista => [...lista, this.daCalendarioApi(calendario, condivisoCon)]); this.nuovoCalendarioAperto.set(false); this.loading.set(false); },
      error: response => { this.error.set(response?.error?.message ?? 'Calendario non creato.'); this.loading.set(false); }
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
    this.http.post<CollaboratoreStudio>('/api/v1/studio/members', this.collaboratoreForm.getRawValue()).subscribe({
      next: collaboratore => {
        this.collaboratoriStudio.update(collaboratori => [collaboratore, ...collaboratori]);
        this.collaboratoreForm.reset({ nome: '', cognome: '', email: '', ruolo: 'AVVOCATO', passwordTemporanea: '' });
        this.collaboratorMessage.set('Collaboratore creato. Potrà accedere con email e password iniziale.');
        this.loading.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Collaboratore non creato. Verifica permessi e dati inseriti.');
        this.loading.set(false);
      }
    });
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
    this.http.put<void>('/api/v1/me/password', {
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
    const widgetLayout = JSON.stringify(this.activeWidgets().map(({ key, x, y, w, h }) => ({ key, x, y, w, h })));
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
    this.http.post<{ accessToken: string; displayName: string }>(url, body).subscribe({
      next: response => {
        sessionStorage.setItem('foro_access_token', response.accessToken);
        this.userName.set(response.displayName);
        this.screen.set('scrivania');
        this.loadWorkspaceSettings();
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
    });
    this.http.get<CollaboratoreStudio[]>('/api/v1/studio/members').subscribe({
      next: collaboratori => this.collaboratoriStudio.set(collaboratori),
      error: () => this.collaboratoriStudio.set([])
    });
    this.http.get<PreferenzeScrivania>('/api/v1/workspace/preferences').subscribe(preference => {
      this.dashboardPreference.set(preference);
      this.dashboardForm.patchValue({
        themeMode: preference.themeMode,
        dashboardDensity: preference.dashboardDensity,
        personalAccentColor: preference.personalAccentColor ?? this.studioProfile()?.accentColor ?? '#0f766e'
      });
      this.applyTheme(this.studioProfile(), preference);
    });
  }

  private moveOrAddWidget(key: ChiaveWidget, x: number, y: number): void {
    const existing = this.activeWidgets().find(widget => widget.key === key);
    if (existing) {
      this.activeWidgets.update(widgets => this.reorderWidgets(widgets.map(widget => widget.key === key ? { ...widget, x, y } : widget), key));
      return;
    }
    const definition = this.widgetLibrary.find(widget => widget.key === key);
    if (!definition) return;
    const nuovoWidget = this.creaWidgetDaDefinizione(key, x, y);
    if (nuovoWidget) this.activeWidgets.update(widgets => this.reorderWidgets([...widgets, nuovoWidget], key));
  }

  private creaWidgetDaDefinizione(key: ChiaveWidget, x: number, y: number): WidgetScrivania | null {
    const definition = this.widgetLibrary.find(widget => widget.key === key);
    if (!definition) return null;
    return {
      ...definition,
      x,
      y,
      w: 3,
      h: 2,
      metric: 'Nuovo',
      preview: 'Widget aggiunto alla scrivania.',
      details: ['Anteprima operativa', 'Azioni rapide', 'Vista estesa'],
      righeAnteprima: [
        { titolo: definition.title, descrizione: 'Nuovo elemento operativo', stato: 'Nuovo' }
      ]
    };
  }

  private positionFromPointer(event: DragEvent): { x: number; y: number } | null {
    const element = event.currentTarget as HTMLElement;
    const rowHeight = 110;
    const dragged = this.widgetTrascinato ? this.activeWidgets().find(widget => widget.key === this.widgetTrascinato) : null;
    const width = dragged?.w ?? 3;
    return this.positionFromCoordinates(event.clientX, event.clientY, element, width, rowHeight);
  }

  private caricaNotifiche(): void {
    this.http.get<NotificaApi[]>('/api/v1/notifiche').subscribe(lista => this.notificheInviti.set(lista.map(n => ({
      icona:'📅', categoria:'Appuntamento', titolo:n.titolo, descrizione:n.descrizione,
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
      this.calendariAgenda.set(calendari.map(c => this.daCalendarioApi(c, [])));
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
    return { chiave: c.id, nome: c.nome, classeColore: c.colore, selezionato: true, condivisoCon, condivisoConTuttoLoStudio: c.condivisoTuttoStudio };
  }
  private daEventoApi(e: EventoApi): EventoAgenda {
    const inizio = new Date(e.inizio);
    const organizzatore = this.personeStudio().find(persona => persona.id === e.creatoreId);
    const fine=new Date(e.fine);
    return { id: e.id, data: this.dataIsoLocale(inizio), ora: inizio.getHours(), minuti: inizio.getMinutes(), fine:`${String(fine.getHours()).padStart(2,'0')}:${String(fine.getMinutes()).padStart(2,'0')}`, calendario: e.calendarioId, colore:e.colore, titolo: e.titolo, personaId: e.creatoreId, persona: organizzatore?.nome || this.userName() || 'Avvocato dello Studio', note:e.note, partecipanti:e.partecipanti, statoDisponibilita:e.statoDisponibilita, promemoriaMinuti:e.promemoriaMinuti, categoria:e.categoria, ricorrenza:e.ricorrenza };
  }
  private aggiornaWidgetCalendario(): void {
    const oggi = this.dataIsoLocale(new Date());
    const prossimi = this.eventiAgenda().filter(e => e.data >= oggi).sort((a,b) => a.data.localeCompare(b.data) || a.ora-b.ora).slice(0, 5);
    const righe = prossimi.map(e => ({ titolo: `${String(e.ora).padStart(2,'0')}:${String(e.minuti ?? 0).padStart(2,'0')} — ${e.titolo}`, descrizione: e.dettaglio || this.calendariAgenda().find(c=>c.chiave===e.calendario)?.nome || 'Calendario', stato: e.data === oggi ? 'Oggi' : new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short'}).format(this.dataDaIso(e.data)) }));
    const oggiTotale = this.eventiAgenda().filter(e => e.data === oggi).length;
    this.activeWidgets.update(widgets => widgets.map(w => w.key === 'calendario' ? { ...w, metric: `${oggiTotale} eventi oggi`, preview: prossimi.length ? 'Appuntamenti in ordine cronologico' : 'Nessun prossimo appuntamento', details: righe.map(r=>r.titolo), righeAnteprima: righe } : w));
  }

  private positionFromCoordinates(
    clientX: number,
    clientY: number,
    element: HTMLElement,
    width: number,
    rowHeight = 108
  ): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    const colWidth = rect.width / 12;
    const x = Math.min(13 - width, Math.max(1, Math.floor((clientX - rect.left) / colWidth) + 1));
    const y = Math.max(1, Math.floor((clientY - rect.top) / rowHeight) + 1);
    return { x, y };
  }

  private concludiTrascinamentoPointer(event: PointerEvent): void {
    this.trascinamentoWidget.set(null);
    this.widgetTrascinato = null;
    this.layoutPrimaDelTrascinamento = null;
    this.dragPlaceholder.set(null);
  }

  private reorderWidgets(widgets: WidgetScrivania[], activeKey: ChiaveWidget): WidgetScrivania[] {
    const ordered = [...widgets].sort((a, b) => {
      if (a.key === activeKey) return -1;
      if (b.key === activeKey) return 1;
      return a.y - b.y || a.x - b.x;
    });
    const placed: WidgetScrivania[] = [];
    for (const widget of ordered) {
      let next = { ...widget, x: Math.min(widget.x, 13 - widget.w), y: Math.max(1, widget.y) };
      while (placed.some(other => this.overlaps(next, other))) {
        next = { ...next, x: next.x + 1 };
        if (next.x + next.w > 13) next = { ...next, x: 1, y: next.y + 1 };
      }
      placed.push(next);
    }
    return placed.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  private compactWidgets(widgets: WidgetScrivania[]): WidgetScrivania[] {
    const ordered = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);
    const placed: WidgetScrivania[] = [];
    for (const widget of ordered) {
      let best = { ...widget, y: 1 };
      while (best.y < widget.y && placed.some(other => this.overlaps(best, other))) {
        best = { ...best, y: best.y + 1 };
      }
      placed.push(best);
    }
    return placed.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  private overlaps(a: PosizioneGriglia, b: PosizioneGriglia): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private samePosition(a: PosizioneGriglia, b: PosizioneGriglia): boolean {
    return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
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
