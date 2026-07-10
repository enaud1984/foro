import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Screen = 'login' | 'register' | 'workspace';
type ThemeMode = 'LIGHT' | 'DARK';
type DashboardDensity = 'COMFORTABLE' | 'COMPACT';
type WidgetKey = 'calendar' | 'documents' | 'email' | 'clients' | 'matters';

interface StudioProfile {
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

interface DashboardPreference {
  themeMode: ThemeMode;
  dashboardDensity: DashboardDensity;
  personalAccentColor: string | null;
  widgetLayout: string;
}

interface WidgetDefinition {
  key: WidgetKey;
  icon: string;
  title: string;
  description: string;
}

interface WorkspaceWidget extends WidgetDefinition {
  x: number;
  y: number;
  w: number;
  h: number;
  metric: string;
  preview: string;
  details: string[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly screen = signal<Screen>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly userName = signal('');
  readonly registrationStep = signal<'details' | 'plans' | 'payment'>('details');
  readonly selectedPlan = signal<'essential' | 'professional'>('essential');
  readonly studioProfile = signal<StudioProfile | null>(null);
  readonly dashboardPreference = signal<DashboardPreference | null>(null);
  readonly settingsMessage = signal('');
  readonly settingsOpen = signal(false);
  readonly expandedWidget = signal<WorkspaceWidget | null>(null);

  readonly widgetLibrary: WidgetDefinition[] = [
    { key: 'calendar', icon: '📅', title: 'Calendario', description: 'Agenda Outlook style, udienze e scadenze' },
    { key: 'documents', icon: '📁', title: 'Documenti', description: 'Atti, versioni, firme e fascicoli' },
    { key: 'email', icon: '✉️', title: 'Email', description: 'Posta ordinaria e associazioni pratica' },
    { key: 'clients', icon: '👥', title: 'Clienti', description: 'Anagrafiche e referenti' },
    { key: 'matters', icon: '⚖️', title: 'Pratiche', description: 'Fascicolo interno e stato attività' }
  ];

  readonly activeWidgets = signal<WorkspaceWidget[]>([
    { ...this.widgetLibrary[0], x: 1, y: 1, w: 2, h: 2, metric: '12 eventi oggi', preview: 'Udienze, scadenze e calendari condivisi.', details: ['10:30 — Udienza civile, Tribunale di Milano', '15:00 — Appuntamento cliente in studio', '17:30 — Call con controparte'] },
    { ...this.widgetLibrary[1], x: 3, y: 1, w: 1, h: 1, metric: '248 file', preview: 'Ultimi atti e versioni disponibili.', details: ['Comparsa_costituzione_v3.pdf', 'Procura_firmata_Esposito.p7m', 'Verbale_udienza_10-07.docx'] },
    { ...this.widgetLibrary[2], x: 4, y: 1, w: 1, h: 1, metric: '37 non lette', preview: 'Messaggi da lavorare e associare.', details: ['Tribunale di Milano — notifica provvedimento', 'cliente.rossi@pec.it — documenti integrativi', 'Cancelleria civile — ricevuta deposito'] },
    { ...this.widgetLibrary[3], x: 1, y: 3, w: 1, h: 1, metric: '18 attivi', preview: 'Clienti e referenti principali.', details: ['Cliente Alfa S.r.l.', 'Mario Rossi', 'Beta Fiduciaria S.p.A.'] },
    { ...this.widgetLibrary[4], x: 2, y: 3, w: 2, h: 1, metric: '31 aperte', preview: 'Fascicoli e stati operativi.', details: ['Rossi / Alfa S.r.l. — Urgente', 'Esposito Successione — Aperta', 'De Luca recupero crediti — In lavorazione'] }
  ]);

  readonly loginForm;
  readonly registerForm;
  readonly brandingForm;
  readonly dashboardForm;
  private draggedWidgetKey: WidgetKey | null = null;

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
      primaryColor: ['#092746'],
      accentColor: ['#c9993a'],
      secondaryColor: ['#128c8c'],
      themePreset: ['foro-classic']
    });
    this.dashboardForm = this.fb.nonNullable.group({
      themeMode: ['LIGHT' as ThemeMode],
      dashboardDensity: ['COMFORTABLE' as DashboardDensity],
      personalAccentColor: ['#c9993a']
    });
  }

  useDemoLogin(): void {
    this.loginForm.setValue({ email: 'admin@studioverdi-demo.it', password: 'DemoFORO2026!' });
  }

  toggleSettings(): void {
    this.settingsOpen.update(value => !value);
    this.error.set('');
    this.settingsMessage.set('');
  }

  onLogoSelected(event: Event): void {
    this.readLogoFile(event, logoUrl => {
      this.brandingForm.patchValue({ logoUrl });
      this.settingsMessage.set('Logo caricato dal PC. Premi "Salva branding Studio" per renderlo definitivo.');
    });
  }

  onRegisterLogoSelected(event: Event): void {
    this.readLogoFile(event, logoUrl => this.registerForm.patchValue({ logoUrl }));
  }

  show(screen: Screen): void {
    this.error.set('');
    if (screen === 'register') this.registrationStep.set('details');
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
    this.registrationStep.set('plans');
  }

  choosePlan(plan: 'essential' | 'professional'): void {
    this.selectedPlan.set(plan);
    this.registrationStep.set('payment');
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

  startWidgetDrag(key: WidgetKey): void {
    this.draggedWidgetKey = key;
  }

  dropWidget(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggedWidgetKey) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(4, Math.max(1, Math.ceil(((event.clientX - rect.left) / rect.width) * 4)));
    const y = Math.min(4, Math.max(1, Math.ceil((event.clientY - rect.top) / 190)));
    this.moveOrAddWidget(this.draggedWidgetKey, x, y);
    this.draggedWidgetKey = null;
  }

  moveWidget(key: WidgetKey, direction: 'left' | 'right' | 'up' | 'down', event: Event): void {
    event.stopPropagation();
    this.activeWidgets.update(widgets => widgets.map(widget => {
      if (widget.key !== key) return widget;
      const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      return { ...widget, x: Math.min(4, Math.max(1, widget.x + dx)), y: Math.min(4, Math.max(1, widget.y + dy)) };
    }));
  }

  closeWidget(key: WidgetKey, event: Event): void {
    event.stopPropagation();
    this.activeWidgets.update(widgets => widgets.filter(widget => widget.key !== key));
  }

  openWidget(widget: WorkspaceWidget): void {
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
    this.http.put<StudioProfile>('/api/v1/studio/profile', this.brandingForm.getRawValue()).subscribe({
      next: profile => {
        this.studioProfile.set(profile);
        this.applyTheme(profile, this.dashboardPreference());
        this.settingsMessage.set('Branding dello Studio aggiornato.');
        this.settingsOpen.set(false);
        this.loading.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Non puoi modificare il branding dello Studio.');
        this.loading.set(false);
      }
    });
  }

  saveDashboardPreferences(): void {
    this.loading.set(true);
    this.settingsMessage.set('');
    const value = this.dashboardForm.getRawValue();
    const widgetLayout = JSON.stringify(this.activeWidgets().map(({ key, x, y, w, h }) => ({ key, x, y, w, h })));
    this.http.put<DashboardPreference>('/api/v1/workspace/preferences', { ...value, widgetLayout }).subscribe({
      next: preference => {
        this.dashboardPreference.set(preference);
        this.applyTheme(this.studioProfile(), preference);
        this.settingsMessage.set('Tema personale aggiornato.');
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
        this.screen.set('workspace');
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
    this.http.get<StudioProfile>('/api/v1/studio/profile').subscribe(profile => {
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
    this.http.get<DashboardPreference>('/api/v1/workspace/preferences').subscribe(preference => {
      this.dashboardPreference.set(preference);
      this.dashboardForm.patchValue({
        themeMode: preference.themeMode,
        dashboardDensity: preference.dashboardDensity,
        personalAccentColor: preference.personalAccentColor ?? this.studioProfile()?.accentColor ?? '#c9993a'
      });
      this.applyTheme(this.studioProfile(), preference);
    });
  }

  private moveOrAddWidget(key: WidgetKey, x: number, y: number): void {
    const existing = this.activeWidgets().find(widget => widget.key === key);
    if (existing) {
      this.activeWidgets.update(widgets => widgets.map(widget => widget.key === key ? { ...widget, x, y } : widget));
      return;
    }
    const definition = this.widgetLibrary.find(widget => widget.key === key);
    if (!definition) return;
    this.activeWidgets.update(widgets => [...widgets, {
      ...definition, x, y, w: 1, h: 1, metric: 'Nuovo', preview: 'Widget aggiunto alla scrivania.', details: ['Anteprima operativa', 'Azioni rapide', 'Vista estesa']
    }]);
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

  private applyTheme(profile: StudioProfile | null, preference: DashboardPreference | null): void {
    const root = document.documentElement;
    root.style.setProperty('--foro-primary', profile?.primaryColor ?? '#092746');
    root.style.setProperty('--foro-accent', preference?.personalAccentColor || profile?.accentColor || '#c9993a');
    root.style.setProperty('--foro-secondary', profile?.secondaryColor ?? '#128c8c');
    root.dataset['foroMode'] = preference?.themeMode === 'DARK' ? 'dark' : 'light';
    root.dataset['foroDensity'] = preference?.dashboardDensity === 'COMPACT' ? 'compact' : 'comfortable';
  }
}
