import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient()]
    }).compileComponents();
  });

  it('crea l’app FORO', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('mostra il titolo della Scrivania Digitale nella pagina di accesso', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Tutto il tuo studio.');
  });

  it('prevede sempre il cambio password personale nelle impostazioni', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.cambioPasswordForm).toBeTruthy();
    expect(app.cambioPasswordForm.controls.nuovaPassword).toBeTruthy();
  });

  it('mostra il widget Collaboratori soltanto al titolare o amministratore', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const profiloBase = {
      name: 'Studio Test', addressLine: null, city: null, postalCode: null, country: 'Italia',
      phone: null, website: null, logoUrl: null, primaryColor: '#092746', accentColor: '#c9993a',
      secondaryColor: '#128c8c', themePreset: 'foro-classic'
    };
    app.studioProfile.set({ ...profiloBase, canEditBranding: false });
    expect(app.widgetDisponibili().some(widget => widget.key === 'collaboratori')).toBeFalse();
    app.studioProfile.set({ ...profiloBase, canEditBranding: true });
    expect(app.widgetDisponibili().some(widget => widget.key === 'collaboratori')).toBeTrue();
  });

  it('non richiede al titolare di scegliere la password temporanea', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect('passwordTemporanea' in app.collaboratoreForm.controls).toBeFalse();
  });

  it('presenta una testata professionale nella scrivania senza istruzioni tecniche', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    app.userName.set('Avv. Laura Verdi');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dash-head h1')?.textContent).toContain('Buongiorno, Avv. Laura Verdi');
    expect(compiled.querySelector('.dash-head')?.textContent).not.toContain('Dashboard operativa');
    expect(compiled.querySelector('.widget-sidebar')?.textContent).not.toContain('La griglia evita le sovrapposizioni');
    expect(compiled.querySelector('.today-summary')?.textContent?.trim()).toBeTruthy();
  });

  it('mostra il comando di uscita soltanto nelle impostazioni', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    app.settingsOpen.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.top-actions .logout-btn')).toBeNull();
    expect(compiled.querySelector('.settings-account .settings-logout')?.textContent).toContain('Esci dall’account');
  });

  it('apre la gestione calendari dedicata con inserimento modifica ed eliminazione', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    const widgetCalendario = app.activeWidgets().find(widget => widget.key === 'calendario');
    expect(widgetCalendario).toBeTruthy();
    app.expandedWidget.set(widgetCalendario!);
    app.calendariAgenda.set([{
      chiave: 'calendario-test', nome: 'Calendario test', classeColore: '#0b67b2', selezionato: true,
      condivisoCon: [], condivisoConIds: [], gestibile: true
    }]);
    app.gestioneCalendariAperta.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.calendar-share-add')?.textContent).toContain('Gestione calendari');
    expect(compiled.querySelector('.calendar-management-panel')).toBeTruthy();
    expect(compiled.querySelector('.calendar-create')?.textContent).toContain('Nuovo calendario');
    expect(compiled.querySelector('.calendar-management-list nav')?.textContent).toContain('Modifica');
    expect(compiled.querySelector('.calendar-management-list nav')?.textContent).toContain('Elimina');
  });
});
