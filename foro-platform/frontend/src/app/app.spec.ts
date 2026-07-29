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

  it('espone Anagrafiche come nome visibile mantenendo la chiave tecnica clienti', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const widget = app.widgetLibrary.find(elemento => elemento.key === 'clienti');
    expect(widget?.title).toBe('Anagrafiche');
    expect(widget?.description).toContain('Persone, società, enti');
  });

  it('mostra il titolo della Scrivania Digitale nella pagina di accesso', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Tutto il tuo studio.');
  });

  it('non mostra comandi senza un comportamento implementato', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Password dimenticata?');

    app.screen.set('scrivania');
    const widgetDocumenti = app.activeWidgets().find(widget => widget.key === 'documenti');
    expect(widgetDocumenti).toBeTruthy();
    app.expandedWidget.set(widgetDocumenti!);
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Trascina per aggiungere');
    expect(compiled.querySelector('.gestione-widget')).toBeNull();
    expect(compiled.querySelectorAll('.widget-modal button').length).toBe(1);
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

  it('mostra una sola vista Collaboratori e traduce i ruoli tecnici in italiano', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    const widgetCollaboratori = app.widgetDisponibili().find(widget => widget.key === 'collaboratori')
      ?? { key: 'collaboratori' as const, icon: '👥', title: 'Collaboratori', description: 'Ruoli e accessi' };
    app.expandedWidget.set({
      ...widgetCollaboratori, x: 1, y: 1, w: 4, h: 2, metric: '1 persona', preview: '', details: [], righeAnteprima: []
    });
    app.collaboratoriStudio.set([{
      id: 'utente-test', nome: 'Antonio', cognome: 'Bianchi', email: 'antonio@studio.it',
      ruolo: 'LAWYER' as any, stato: 'ATTIVO'
    }]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.collaboratori-widget').length).toBe(1);
    expect(compiled.querySelector('.gestione-widget')).toBeNull();
    expect(compiled.querySelector('.collaborator-role')?.textContent).toContain('AVVOCATO');
    expect(compiled.textContent).not.toContain('LAWYER');
  });

  describe('widget compatto Agenda', () => {
    function preparaAgenda(app: App): void {
      app.oraAttuale.set(new Date(2026, 6, 25, 10, 0));
      app.calendariAgenda.set([
        { chiave: 'studio', nome: 'Studio', classeColore: '#0b67b2', selezionato: true, condivisoCon: [] },
        { chiave: 'scadenze', nome: 'Scadenze', classeColore: '#dc2626', selezionato: true, condivisoCon: [] },
        { chiave: 'nascosto', nome: 'Privato', classeColore: '#7c3aed', selezionato: false, condivisoCon: [] }
      ]);
    }

    it('deriva dai veri eventi visibili, ordina oggi prima del futuro ed esclude conclusi e calendari nascosti', () => {
      const app = TestBed.createComponent(App).componentInstance;
      preparaAgenda(app);
      app.eventiAgenda.set([
        { id: 'domani', data: '2026-07-26', ora: 9, calendario: 'studio', titolo: 'Evento futuro', persona: 'Laura', fine: '10:00', categoria: 'RIUNIONE' },
        { id: 'passato', data: '2026-07-25', ora: 8, calendario: 'studio', titolo: 'Evento concluso', persona: 'Laura', fine: '09:00' },
        { id: 'oggi-2', data: '2026-07-25', ora: 14, calendario: 'studio', titolo: 'Cliente Rossi', persona: 'Laura', fine: '15:00', categoria: 'CLIENTE' },
        { id: 'nascosto', data: '2026-07-25', ora: 11, calendario: 'nascosto', titolo: 'Segreto', persona: 'Laura', fine: '12:00' },
        { id: 'oggi-1', data: '2026-07-25', ora: 11, calendario: 'scadenze', titolo: 'Deposito', persona: 'Laura', fine: '11:30', categoria: 'SCADENZA' }
      ]);

      app.aggiornaWidgetCalendario();
      const widget = app.activeWidgets().find(elemento => elemento.key === 'calendario')!;

      expect(widget.metric).toBe('3 impegni oggi');
      expect(widget.preview).toBe('Prossimo alle 11:00');
      expect(widget.righeAnteprima.map(riga => riga.eventoId)).toEqual(['oggi-1', 'oggi-2', 'domani']);
      expect(widget.righeAnteprima[0]).toEqual(jasmine.objectContaining({ colore: '#dc2626', urgente: true, stato: 'Oggi' }));
      expect(widget.righeAnteprima[0].titolo).toContain('⚠');
      expect(widget.righeAnteprima[0].descrizione).toContain('Scadenza');
      expect(widget.righeAnteprima[2].stato).toBe('Domani');
    });

    it('limita a cinque righe cronologiche', () => {
      const app = TestBed.createComponent(App).componentInstance;
      preparaAgenda(app);
      app.eventiAgenda.set(Array.from({ length: 7 }, (_, indice) => ({
        id: `evento-${indice}`, data: '2026-07-26', ora: 8 + indice, calendario: 'studio',
        titolo: `Evento ${indice}`, persona: 'Laura', fine: `${String(9 + indice).padStart(2, '0')}:00`
      })));
      app.aggiornaWidgetCalendario();
      expect(app.activeWidgets().find(widget => widget.key === 'calendario')?.righeAnteprima.length).toBe(5);
    });

    it('gestisce metriche singolari, assenza di eventi, giornata intera e nessun prossimo evento', () => {
      const app = TestBed.createComponent(App).componentInstance;
      preparaAgenda(app);
      app.aggiornaWidgetCalendario();
      let widget = app.activeWidgets().find(elemento => elemento.key === 'calendario')!;
      expect(widget.metric).toBe('Nessun impegno oggi');
      expect(widget.preview).toBe('Nessun prossimo evento');

      app.eventiAgenda.set([{ id: 'intera', data: '2026-07-25', ora: 0, calendario: 'studio', titolo: 'Convegno', persona: 'Laura', fine: '23:59', tuttoGiorno: true }]);
      app.aggiornaWidgetCalendario();
      widget = app.activeWidgets().find(elemento => elemento.key === 'calendario')!;
      expect(widget.metric).toBe('1 impegno oggi');
      expect(widget.preview).toBe('Prossimo: evento per tutta la giornata');
      expect(widget.righeAnteprima[0].titolo).toContain('Tutto il giorno');

      app.eventiAgenda.set([{ id: 'finito', data: '2026-07-25', ora: 8, calendario: 'studio', titolo: 'Finito', persona: 'Laura', fine: '09:00' }]);
      app.aggiornaWidgetCalendario();
      widget = app.activeWidgets().find(elemento => elemento.key === 'calendario')!;
      expect(widget.metric).toBe('1 impegno oggi');
      expect(widget.preview).toBe('Nessun prossimo evento');
      expect(widget.righeAnteprima).toEqual([]);
    });

    it('apre Agenda, naviga alla data e mostra il dettaglio dell’evento cliccato', () => {
      const app = TestBed.createComponent(App).componentInstance;
      preparaAgenda(app);
      app.eventiAgenda.set([{ id: 'selezionato', data: '2026-07-27', ora: 12, calendario: 'studio', titolo: 'Riunione', persona: 'Laura', fine: '13:00' }]);
      app.aggiornaWidgetCalendario();
      const widget = app.activeWidgets().find(elemento => elemento.key === 'calendario')!;

      app.apriRigaWidget(widget, widget.righeAnteprima[0], new MouseEvent('click'));

      expect(app.expandedWidget()?.key).toBe('calendario');
      expect(app.dataIsoLocale(app.dataCalendario())).toBe('2026-07-27');
      expect(app.eventoSelezionato()?.id).toBe('selezionato');
    });

    it('riflette creazione, modifica ed eliminazione senza una seconda collezione eventi', () => {
      const app = TestBed.createComponent(App).componentInstance;
      preparaAgenda(app);
      app.eventiAgenda.set([{ id: 'evento', data: '2026-07-26', ora: 9, calendario: 'studio', titolo: 'Creato', persona: 'Laura', fine: '10:00' }]);
      app.aggiornaWidgetCalendario();
      expect(app.activeWidgets().find(widget => widget.key === 'calendario')?.details[0]).toContain('Creato');

      app.eventiAgenda.update(eventi => eventi.map(evento => ({ ...evento, titolo: 'Modificato' })));
      app.aggiornaWidgetCalendario();
      expect(app.activeWidgets().find(widget => widget.key === 'calendario')?.details[0]).toContain('Modificato');

      app.eventiAgenda.set([]);
      app.aggiornaWidgetCalendario();
      expect(app.activeWidgets().find(widget => widget.key === 'calendario')?.righeAnteprima).toEqual([]);
    });
  });
});
