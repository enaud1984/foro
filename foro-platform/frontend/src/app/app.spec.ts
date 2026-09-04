import { provideHttpClient } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
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

  it('configura FullCalendar in italiano con le quattro viste standard', () => {
    const app = TestBed.createComponent(App).componentInstance;
    expect(app.opzioniAgenda.initialView).toBe('dayGridMonth');
    expect(app.opzioniAgenda.locale).toBe('it');
    expect(app.opzioniAgenda.firstDay).toBe(1);
    expect(app.opzioniAgenda.editable).toBeTrue();
    expect(app.opzioniAgenda.selectable).toBeTrue();
    expect(app.opzioniAgenda.plugins?.length).toBe(4);
    expect(app.opzioniAgenda.headerToolbar).toEqual({
      left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    });
  });

  it('espone Anagrafiche come nome visibile mantenendo la chiave tecnica clienti', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const widget = app.widgetLibrary.find(elemento => elemento.key === 'clienti');
    expect(widget?.title).toBe('Anagrafiche');
    expect(widget?.description).toContain('Persone, società, enti');
  });

  it('espone Pratiche con descrizione operativa e senza righe demo hardcoded',()=>{
    const app=TestBed.createComponent(App).componentInstance;
    const definizione=app.widgetLibrary.find(w=>w.key==='pratiche');
    const widget=app.activeWidgets().find(w=>w.key==='pratiche');
    expect(definizione?.title).toBe('Pratiche');
    expect(definizione?.description).toBe('Fascicoli, scadenze e attività dello Studio');
    expect(widget?.righeAnteprima).toEqual([]);
    expect(JSON.stringify(widget)).not.toContain('31 aperte');
  });

  it('seleziona e rimuove una Pratica nel form Agenda',()=>{
    const app=TestBed.createComponent(App).componentInstance;
    const pratica:any={id:'p1',codice:'PRA-2026-00001',titolo:'Pratica demo'};
    app.selezionaPraticaAgenda(pratica);
    expect(app.appuntamentoForm.controls.praticaId.value).toBe('p1');
    expect(app.ricercaPratica.value).toContain('PRA-2026-00001');
    app.selezionaPraticaAgenda(null);
    expect(app.appuntamentoForm.controls.praticaId.value).toBe('');
  });

  it('apre dal dettaglio Agenda la Pratica collegata corretta',()=>{
    const app=TestBed.createComponent(App).componentInstance;
    const evento:any={praticaId:'p-collegata'};
    app.apriPraticaDaEvento(evento);
    expect(app.praticaSelezionataId()).toBe('p-collegata');
    expect(app.expandedWidget()?.key).toBe('pratiche');
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

  it('mantiene la vista ingrandita del widget dentro la Scrivania', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    app.expandedWidget.set(app.activeWidgets()[0]!);
    fixture.detectChanges();

    const scrivania = fixture.nativeElement.querySelector('.dashboard-shell') as HTMLElement;
    const vistaIngrandita = scrivania.querySelector(':scope > .widget-modal');

    expect(scrivania.classList).toContain('vista-widget-aperta');
    expect(vistaIngrandita).not.toBeNull();
    expect(vistaIngrandita?.parentElement).toBe(scrivania);
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
    app.activeWidgets.update(widget => widget.filter(elemento => elemento.key !== 'collaboratori'));
    app.studioProfile.set({ ...profiloBase, canEditBranding: true });
    expect(app.widgetDisponibili().some(widget => widget.key === 'collaboratori')).toBeTrue();
  });

  it('mantiene il widget nel catalogo durante l’animazione prima di aggiungerlo', fakeAsync(() => {
    const app = TestBed.createComponent(App).componentInstance;
    app.activeWidgets.update(widget => widget.filter(elemento => elemento.key !== 'documenti'));

    app.aggiungiWidgetDaLibreria('documenti');
    expect(app.widgetInUscita().has('documenti')).toBeTrue();
    expect(app.widgetDisponibili().some(widget => widget.key === 'documenti')).toBeTrue();
    expect(app.activeWidgets().some(widget => widget.key === 'documenti')).toBeFalse();

    tick(240);
    expect(app.widgetInUscita().has('documenti')).toBeFalse();
    expect(app.widgetDisponibili().some(widget => widget.key === 'documenti')).toBeFalse();
    expect(app.activeWidgets().some(widget => widget.key === 'documenti')).toBeTrue();
  }));

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
    expect(compiled.querySelector('.today-date')?.textContent?.trim()).toBeTruthy();
    expect(compiled.querySelector('.today-year')?.textContent?.trim()).toMatch(/^\d{4}$/);
    expect(compiled.querySelector('[aria-label="Notifiche"] app-icona-foro svg')).toBeTruthy();
    expect(compiled.querySelector('[aria-label="Impostazioni"] app-icona-foro svg')).toBeTruthy();
  });

  it('propaga colori personali a titoli e pulsanti con contrasto automatico', () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.dashboardForm.patchValue({ personalAccentColor: '#405f6d', colorePulsanti: '#f4e7c5' });
    expect(document.documentElement.style.getPropertyValue('--section-title-color')).toBe('#405f6d');
    expect(document.documentElement.style.getPropertyValue('--button-primary-bg')).toBe('#f4e7c5');
    expect(document.documentElement.style.getPropertyValue('--button-primary-text')).toBe('#172b3a');
  });

  it('conserva il colore pulsanti nel layout utente senza estendere il contratto backend', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const layout = (app as any).serializzaLayoutWidget('#456b78');
    expect((app as any).leggiColorePulsanti(layout)).toBe('#456b78');
    expect(JSON.parse(layout)[0]).toEqual(jasmine.objectContaining({ colorePulsanti: '#456b78' }));
  });

  it('mantiene un solo comando Nuovo appuntamento nella colonna del Calendario', () => {
    const fixture = TestBed.createComponent(App); const app = fixture.componentInstance;
    app.screen.set('scrivania');
    app.expandedWidget.set(app.activeWidgets().find(widget => widget.key === 'calendario')!);
    fixture.detectChanges();
    const vista = fixture.nativeElement.querySelector('.calendar-modal') as HTMLElement;
    expect(vista.querySelectorAll('.calendar-add').length).toBe(1);
    expect(vista.querySelector('.calendar-commandbar .primary')).toBeNull();
  });

  describe('integrazione GridStack della Scrivania', () => {
    function preparaScrivania() {
      const fixture = TestBed.createComponent(App); const app = fixture.componentInstance;
      app.screen.set('scrivania'); fixture.detectChanges();
      return { fixture, app, root: fixture.nativeElement as HTMLElement };
    }
    it('inizializza il wrapper ufficiale con drag, resize, animazioni e collisioni native', () => {
      const { app, root } = preparaScrivania();
      expect(app.grigliaScrivania?.grid).toBeTruthy();
      expect(app.opzioniGriglia).toEqual(jasmine.objectContaining({ column: 12, cellHeight: 46, margin: 8, animate: true, float: false, staticGrid: false, disableDrag: false, disableResize: false }));
      expect(app.opzioniGriglia.draggable).toEqual(jasmine.objectContaining({ handle: '.op-head' }));
      expect(app.opzioniGriglia.resizable).toEqual(jasmine.objectContaining({ handles: 'se' }));
      expect(root.querySelector('gridstack.grid-stack')).toBeTruthy();
      expect(root.querySelectorAll('gridstack-item.grid-stack-item').length).toBe(app.activeWidgets().length);
    });
    it('applica coordinate zero-based e limiti specifici del widget', () => {
      const app = TestBed.createComponent(App).componentInstance; const widget = app.activeWidgets()[0];
      expect(app.opzioniWidget(widget)).toEqual(jasmine.objectContaining({ id: widget.key, x: widget.x - 1, y: widget.y - 1, w: widget.w, h: widget.h, minW: 4, minH: 5 }));
      expect(app.opzioniWidget(widget)).toBe(app.opzioniWidget(widget));
    });
    it('usa la testata senza grip ed esclude i controlli interattivi', () => {
      const { app, root } = preparaScrivania();
      expect(root.querySelector('.op-head')).toBeTruthy(); expect(root.querySelector('.drag-handle')).toBeNull(); expect(root.querySelector('.resize-corner')).toBeNull();
      expect(String(app.opzioniGriglia.draggable?.cancel)).toContain('button'); expect(String(app.opzioniGriglia.draggable?.cancel)).toContain('input');
    });
    it('lascia GridStack autorevole su change senza aggiornare o salvare durante il movimento', () => {
      const app = TestBed.createComponent(App).componentInstance; const richiesta = spyOn((app as any).http, 'put').and.returnValue(of({})); const widget = app.activeWidgets()[0];
      app.aggiornaModelloDaGridStack({ event: new Event('change'), nodes: [{ id: widget.key, x: 3, y: 4, w: 8, h: 6 } as any] });
      expect(app.activeWidgets()[0]).toEqual(jasmine.objectContaining({ x: 1, y: 1, w: 5, h: 6 })); expect(richiesta).not.toHaveBeenCalled();
    });
    it('persiste soltanto al termine di drag e resize', () => {
      const app = TestBed.createComponent(App).componentInstance; const preferenze: any = { themeMode: 'LIGHT', dashboardDensity: 'COMFORTABLE', personalAccentColor: '#0f766e', widgetLayout: '[]' };
      app.dashboardPreference.set(preferenze); const richiesta = spyOn((app as any).http, 'put').and.returnValue(of(preferenze)); const elemento = document.createElement('div') as any;
      elemento.gridstackNode = { id: app.activeWidgets()[0].key, x: 2, y: 2, w: 9, h: 7 };
      app.terminaSpostamentoGridStack({ event: new Event('dragstop'), el: elemento }); app.terminaRidimensionamentoGridStack({ event: new Event('resizestop'), el: elemento });
      expect(richiesta).toHaveBeenCalledTimes(2);
    });
    it('gestisce aggiunta, rimozione e dimensioni predefinite', () => {
      const app = TestBed.createComponent(App).componentInstance; app.activeWidgets.set(app.activeWidgets().filter(widget => widget.key !== 'email')); app.aggiungiWidgetDaLibreria('email');
      expect(app.activeWidgets().find(widget => widget.key === 'email')).toEqual(jasmine.objectContaining({ w: 4, h: 5 }));
      app.rimuoviWidgetGridStack({ event: new Event('removed'), nodes: [{ id: 'email' } as any] }); expect(app.activeWidgets().some(widget => widget.key === 'email')).toBeFalse();
    });
    it('ricarica layout GridStack e converte deterministicamente quello storico', () => {
      const app = TestBed.createComponent(App).componentInstance; const chiave = app.activeWidgets()[0].key;
      (app as any).ripristinaLayoutWidget(JSON.stringify([{ key: chiave, x: 5, y: 4, w: 10, h: 7, versioneLayout: 3 }])); expect(app.activeWidgets()[0]).toEqual(jasmine.objectContaining({ x: 3, y: 4, w: 5, h: 7 }));
      (app as any).ripristinaLayoutWidget(JSON.stringify([{ key: chiave, x: 3, y: 2, w: 4, h: 3 }])); expect(app.activeWidgets()[0]).toEqual(jasmine.objectContaining({ x: 3, y: 2, w: 4, h: 3 }));
    });
  });

  it('persiste posizione e dimensione normalizzate dopo una modifica al layout', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const preferenze: any = {
      themeMode: 'LIGHT', dashboardDensity: 'COMFORTABLE', personalAccentColor: '#0f766e', widgetLayout: '[]'
    };
    app.dashboardPreference.set(preferenze);
    const richiesta = spyOn((app as any).http, 'put').and.returnValue(of(preferenze));

    (app as any).salvaLayoutWidget();

    const corpo = richiesta.calls.mostRecent().args[1] as any;
    const layout = JSON.parse(corpo.widgetLayout);
    expect(richiesta).toHaveBeenCalledWith('/api/v1/workspace/preferences', jasmine.any(Object));
    expect(layout.length).toBe(app.activeWidgets().length);
    expect(layout[0]).toEqual(jasmine.objectContaining({ key: jasmine.any(String), x: jasmine.any(Number), y: jasmine.any(Number), w: jasmine.any(Number), h: jasmine.any(Number) }));
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
      ?? { key: 'collaboratori' as const, icon: 'collaboratori', title: 'Collaboratori', description: 'Ruoli e accessi' };
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
