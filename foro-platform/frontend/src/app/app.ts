import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Schermata = 'login' | 'registrazione' | 'scrivania';
type ModalitaTema = 'LIGHT' | 'DARK';
type DensitaScrivania = 'COMFORTABLE' | 'COMPACT';
type ChiaveWidget = 'calendario' | 'documenti' | 'email' | 'clienti' | 'pratiche';
type PassoRegistrazione = 'dati' | 'piani' | 'pagamento';
type PianoDemo = 'essential' | 'professional';
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
}

interface NotificaScrivania {
  icona: string;
  categoria: string;
  titolo: string;
  descrizione: string;
  orario: string;
  widget: ChiaveWidget;
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
  readonly settingsOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly expandedWidget = signal<WidgetScrivania | null>(null);
  readonly dragPlaceholder = signal<PosizioneGriglia | null>(null);
  readonly notificheScrivania: NotificaScrivania[] = [
    {
      icona: '📅',
      categoria: 'Appuntamento',
      titolo: 'Udienza civile confermata',
      descrizione: 'Tribunale di Milano · Rossi / Alfa S.r.l. · ore 10:30',
      orario: '09:12',
      widget: 'calendario'
    },
    {
      icona: '📁',
      categoria: 'Documento',
      titolo: 'Procura firmata caricata',
      descrizione: 'Nuovo file nel fascicolo Esposito Successione',
      orario: '08:47',
      widget: 'documenti'
    },
    {
      icona: '✉️',
      categoria: 'Email',
      titolo: 'PEC da associare a pratica',
      descrizione: 'Cancelleria civile · ricevuta deposito telematico',
      orario: 'Ieri',
      widget: 'email'
    },
    {
      icona: '⚖️',
      categoria: 'Pratica',
      titolo: 'Scadenza fra 2 giorni',
      descrizione: 'Deposito memoria istruttoria · RG 1842/2025',
      orario: '2 gg',
      widget: 'pratiche'
    }
  ];

  readonly widgetLibrary: DefinizioneWidget[] = [
    { key: 'calendario', icon: '📅', title: 'Calendario', description: 'Agenda stile Outlook, udienze e scadenze' },
    { key: 'documenti', icon: '📁', title: 'Documenti', description: 'Atti, versioni, firme e fascicoli' },
    { key: 'email', icon: '✉️', title: 'Email', description: 'Posta ordinaria e associazioni pratica' },
    { key: 'clienti', icon: '👥', title: 'Clienti', description: 'Anagrafiche e referenti' },
    { key: 'pratiche', icon: '⚖️', title: 'Pratiche', description: 'Fascicolo interno e stato attività' }
  ];

  readonly activeWidgets = signal<WidgetScrivania[]>([
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

  readonly loginForm;
  readonly registerForm;
  readonly brandingForm;
  readonly dashboardForm;
  private widgetTrascinato: ChiaveWidget | null = null;

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
  }

  useDemoLogin(): void {
    this.loginForm.setValue({ email: 'admin@studioverdi-demo.it', password: 'DemoFORO2026!' });
  }

  toggleSettings(): void {
    this.settingsOpen.update(value => !value);
    this.notificationsOpen.set(false);
    this.error.set('');
    this.settingsMessage.set('');
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
    const widget = this.activeWidgets().find(item => item.key === key);
    if (widget) this.dragPlaceholder.set({ x: widget.x, y: widget.y, w: widget.w, h: widget.h });
  }

  updateDragPreview(event: DragEvent): void {
    event.preventDefault();
    if (!this.widgetTrascinato) return;
    const posizione = this.positionFromPointer(event);
    const widget = this.activeWidgets().find(item => item.key === this.widgetTrascinato);
    if (!posizione || !widget) return;
    const nuovaPosizione = { x: posizione.x, y: posizione.y, w: widget.w, h: widget.h };
    const posizioneCorrente = this.dragPlaceholder();
    if (posizioneCorrente && this.samePosition(posizioneCorrente, nuovaPosizione)) return;
    this.dragPlaceholder.set(nuovaPosizione);
    this.activeWidgets.update(widgets =>
      this.reorderWidgets(
        widgets.map(item => item.key === this.widgetTrascinato ? { ...item, x: posizione.x, y: posizione.y } : item),
        this.widgetTrascinato as ChiaveWidget
      )
    );
  }

  dropWidget(event: DragEvent): void {
    event.preventDefault();
    if (!this.widgetTrascinato) return;
    const posizione = this.positionFromPointer(event);
    if (posizione) this.moveOrAddWidget(this.widgetTrascinato, posizione.x, posizione.y);
    this.widgetTrascinato = null;
    this.dragPlaceholder.set(null);
  }

  endWidgetDrag(): void {
    this.widgetTrascinato = null;
    this.dragPlaceholder.set(null);
  }

  expandWidget(widget: WidgetScrivania, event: Event): void {
    event.stopPropagation();
    this.openWidget(widget);
  }

  closeWidget(key: ChiaveWidget, event: Event): void {
    event.stopPropagation();
    this.activeWidgets.update(widgets => widgets.filter(widget => widget.key !== key));
  }

  openWidget(widget: WidgetScrivania): void {
    this.expandedWidget.set(widget);
  }

  closeExpandedWidget(): void {
    this.expandedWidget.set(null);
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
      details: ['Anteprima operativa', 'Azioni rapide', 'Vista estesa']
    };
  }

  private positionFromPointer(event: DragEvent): { x: number; y: number } | null {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const colWidth = rect.width / 12;
    const rowHeight = 110;
    const dragged = this.widgetTrascinato ? this.activeWidgets().find(widget => widget.key === this.widgetTrascinato) : null;
    const width = dragged?.w ?? 3;
    const x = Math.min(13 - width, Math.max(1, Math.floor((event.clientX - rect.left) / colWidth) + 1));
    const y = Math.max(1, Math.floor((event.clientY - rect.top) / rowHeight) + 1);
    return { x, y };
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
