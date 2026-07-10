import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Screen = 'login' | 'register' | 'workspace';
type ThemeMode = 'LIGHT' | 'DARK';
type DashboardDensity = 'COMFORTABLE' | 'COMPACT';

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
  readonly demoWidgets = [
    { title: 'Calendario Outlook style', metric: '12 eventi oggi', description: 'Udienze, scadenze e calendari condivisi dello Studio.' },
    { title: 'Documenti', metric: '248 file', description: 'Contratti, memorie, procure e versioni organizzate per pratica.' },
    { title: 'Email', metric: '37 non lette', description: 'Posta ordinaria associabile a clienti e pratiche.' },
    { title: 'Clienti', metric: '18 attivi', description: 'Anagrafiche, referenti e contesto operativo sempre raggiungibili.' },
    { title: 'Pratiche / Fascicolo', metric: '31 aperte', description: 'Stati, scadenze e documenti collegati alla singola posizione.' }
  ];
  readonly widgetLibrary = [
    { icon: '📅', title: 'Calendario', description: 'Agenda Outlook style, udienze e scadenze' },
    { icon: '📁', title: 'Documenti', description: 'Atti, versioni, firme e fascicoli' },
    { icon: '✉️', title: 'Email', description: 'Posta ordinaria e associazioni pratica' },
    { icon: '👥', title: 'Clienti', description: 'Anagrafiche e referenti' },
    { icon: '⚖️', title: 'Pratiche', description: 'Fascicolo interno e stato attività' }
  ];

  readonly loginForm;
  readonly registerForm;
  readonly brandingForm;
  readonly dashboardForm;

  constructor(private readonly fb: FormBuilder, private readonly http: HttpClient) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.registerForm = this.fb.nonNullable.group({
      studioName: ['', Validators.required],
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
    this.loginForm.setValue({
      email: 'admin@studioverdi-demo.it',
      password: 'DemoFORO2026!'
    });
  }

  toggleSettings(): void {
    this.settingsOpen.update(value => !value);
    this.error.set('');
    this.settingsMessage.set('');
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.brandingForm.patchValue({ logoUrl: String(reader.result) });
      this.settingsMessage.set('Logo caricato dal PC. Premi "Salva branding Studio" per renderlo definitivo.');
    };
    reader.onerror = () => this.error.set('Logo non leggibile. Prova con un PNG o JPG più leggero.');
    reader.readAsDataURL(file);
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
    const widgetLayout = JSON.stringify([
      { key: 'calendar', x: 0, y: 0, w: 2, h: 2 },
      { key: 'documents', x: 2, y: 0, w: 2, h: 2 },
      { key: 'email', x: 4, y: 0, w: 2, h: 2 },
      { key: 'clients', x: 0, y: 2, w: 2, h: 2 },
      { key: 'matters', x: 2, y: 2, w: 4, h: 2 }
    ]);
    this.http.put<DashboardPreference>('/api/v1/workspace/preferences', { ...value, widgetLayout }).subscribe({
      next: preference => {
        this.dashboardPreference.set(preference);
        this.applyTheme(this.studioProfile(), preference);
        this.settingsMessage.set('Dashboard personale aggiornata.');
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

  private applyTheme(profile: StudioProfile | null, preference: DashboardPreference | null): void {
    const root = document.documentElement;
    root.style.setProperty('--foro-primary', profile?.primaryColor ?? '#092746');
    root.style.setProperty('--foro-accent', preference?.personalAccentColor || profile?.accentColor || '#c9993a');
    root.style.setProperty('--foro-secondary', profile?.secondaryColor ?? '#128c8c');
    root.dataset['foroMode'] = preference?.themeMode === 'DARK' ? 'dark' : 'light';
    root.dataset['foroDensity'] = preference?.dashboardDensity === 'COMPACT' ? 'compact' : 'comfortable';
  }
}
