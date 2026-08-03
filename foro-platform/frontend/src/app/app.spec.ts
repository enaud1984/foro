import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
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
    expect(compiled.querySelector('.today-period b')?.textContent?.trim()).toBeTruthy();
    expect(compiled.querySelector('.today-period small')?.textContent?.trim()).toMatch(/^\d{4}$/);
    expect(compiled.querySelector('[aria-label="Notifiche"] app-icona-foro svg')).toBeTruthy();
    expect(compiled.querySelector('[aria-label="Impostazioni"] app-icona-foro svg')).toBeTruthy();
  });

  it('mantiene la riga richiesta quando lo spostamento non genera collisioni', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const base = app.activeWidgets().slice(0, 2).map((widget, indice) => ({
      ...widget, x: indice === 0 ? 1 : 7, y: indice === 0 ? 5 : 1, w: 6, h: 2
    }));
    const risultato = (app as any).reorderWidgets(base, base[0].key);

    expect(risultato.find((widget: any) => widget.key === base[0].key).y).toBe(5);
    expect(risultato.find((widget: any) => widget.key === base[1].key))
      .toEqual(jasmine.objectContaining({ x: 7, y: 1, w: 6, h: 2 }));
    expect((app as any).reorderWidgets(base, base[1].key)).toEqual(risultato);
  });

  it('rialloca soltanto il widget in collisione e lascia invariati gli altri', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const base = app.activeWidgets().slice(0, 3).map((widget, indice) => ({
      ...widget,
      x: indice === 2 ? 7 : 1,
      y: indice === 1 ? 1 : indice === 0 ? 4 : 9,
      w: 6,
      h: 2
    }));
    const spostati = base.map(widget => widget.key === base[0].key ? { ...widget, y: 1 } : widget);
    const risultato = (app as any).reorderWidgets(spostati, base[0].key);
    const attivo = risultato.find((widget: any) => widget.key === base[0].key);
    const urtato = risultato.find((widget: any) => widget.key === base[1].key);
    const estraneo = risultato.find((widget: any) => widget.key === base[2].key);

    expect(attivo.y).toBe(1);
    expect(urtato.y).toBeGreaterThanOrEqual(3);
    expect(estraneo).toEqual(jasmine.objectContaining({ x: 7, y: 9, w: 6, h: 2 }));
    expect(risultato.some((widget: any, indice: number) =>
      risultato.slice(indice + 1).some((altro: any) => (app as any).overlaps(widget, altro)))).toBeFalse();
  });

  it('normalizza un layout storico incoerente durante il ripristino', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const chiavi = app.activeWidgets().slice(0, 2).map(widget => widget.key);
    (app as any).ripristinaLayoutWidget(JSON.stringify([
      { key: chiavi[0], x: -4, y: 0, w: 99, h: 0 },
      { key: chiavi[1], x: 1.4, y: 1.8, w: 4.2, h: 2.2 }
    ]));
    const layout = app.activeWidgets();

    expect(layout.length).toBe(2);
    expect(layout.every(widget => Number.isInteger(widget.x) && Number.isInteger(widget.y))).toBeTrue();
    expect(layout.every(widget => widget.x >= 1 && widget.x + widget.w <= 13 && widget.y >= 1)).toBeTrue();
    expect((app as any).overlaps(layout[0], layout[1])).toBeFalse();
  });

  it('rende visibile il placeholder e usa la testata senza grip con angolo resize invisibile', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    const widget = app.activeWidgets()[0];
    app.dragPlaceholder.set({ x: widget.x, y: widget.y, w: widget.w, h: widget.h });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.drop-placeholder')).toBeTruthy();
    expect(compiled.querySelector('.op-head')).toBeTruthy();
    expect(compiled.querySelector('.resize-corner')).toBeTruthy();
    expect(compiled.querySelector('.resize-corner')?.textContent?.trim()).toBe('');
    expect(compiled.querySelector('.drag-handle')).toBeNull();
    expect(compiled.querySelector('[aria-label="Aggiungi widget Anagrafiche"]')?.getAttribute('tabindex')).toBe('0');
  });

  it('segnala una destinazione di trascinamento esterna come non valida', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    app.destinazioneNonValida.set(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.operational-grid.drop-invalid')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('.drop-placeholder')).toBeNull();
  });

  it('espone le azioni widget in un menu SVG senza controlli simbolici duplicati', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.screen.set('scrivania');
    fixture.detectChanges();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector('.widget-actions-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.widget-actions-menu')).toBeTruthy();
    expect(compiled.querySelector('.widget-actions-menu')?.textContent).toContain('Apri vista completa');
    expect(compiled.querySelector('.widget-actions-menu')?.textContent).toContain('Rimuovi dalla scrivania');
    expect(compiled.querySelector('.expand-window')).toBeNull();
    expect(compiled.querySelector('.resize-corner')).toBeTruthy();
    expect(compiled.querySelector('.drag-handle')).toBeNull();
  });

  describe('interazioni deterministiche della Scrivania', () => {
    function eventoPointer(tipo: string, x: number, y: number, pointerId = 7): PointerEvent {
      return new PointerEvent(tipo, { clientX: x, clientY: y, pointerId, button: 0, bubbles: true });
    }

    function testataWidget(widget: HTMLElement): HTMLElement {
      return widget.querySelector('.op-head') as HTMLElement;
    }

    it('non cambia layout, placeholder o persistenza al click e al pointerdown', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.screen.set('scrivania');
      fixture.detectChanges();
      const prima = JSON.stringify(app.activeWidgets());
      const salvataggio = spyOn(app as any, 'salvaLayoutWidget');
      const head = testataWidget((fixture.nativeElement as HTMLElement).querySelector('.op-widget')!);

      head.dispatchEvent(eventoPointer('pointerdown', 20, 20));
      app.terminaTrascinamentoWidget(eventoPointer('pointerup', 20, 20));

      expect(JSON.stringify(app.activeWidgets())).toBe(prima);
      expect(app.dragPlaceholder()).toBeNull();
      expect(app.trascinamentoWidget()).toBeNull();
      expect(salvataggio).not.toHaveBeenCalled();
    });

    it('definisce la soglia a 8 pixel: non parte a 8 e parte oltre 8', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.screen.set('scrivania');
      fixture.detectChanges();
      const head = testataWidget((fixture.nativeElement as HTMLElement).querySelector('.op-widget')!);
      head.dispatchEvent(eventoPointer('pointerdown', 20, 20));

      app.aggiornaTrascinamentoWidget(eventoPointer('pointermove', 28, 20));
      expect(app.trascinamentoWidget()?.attivo).toBeFalse();
      expect(app.dragPlaceholder()).toBeNull();

      app.aggiornaTrascinamentoWidget(eventoPointer('pointermove', 29, 20));
      expect(app.trascinamentoWidget()?.attivo).toBeTrue();
    });

    it('esclude pulsanti, menu e contenuto dall avvio del drag', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.screen.set('scrivania');
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;

      (root.querySelector('.widget-actions-trigger') as HTMLButtonElement).dispatchEvent(eventoPointer('pointerdown', 10, 10));
      expect(app.trascinamentoWidget()).toBeNull();
      (root.querySelector('.widget-actions-trigger') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(app.menuWidgetAperto()).not.toBeNull();
      expect(app.trascinamentoWidget()).toBeNull();
      (root.querySelector('.op-widget b') as HTMLElement)?.click();
      expect(app.trascinamentoWidget()).toBeNull();
    });

    it('calcola uno swap diretto atomico e lascia invariato il terzo widget', () => {
      const app = TestBed.createComponent(App).componentInstance;
      const base = app.activeWidgets().slice(0, 3).map((widget, indice) => ({
        ...widget, x: 1 + indice * 4, y: 1, w: 3, h: 2
      }));
      app.activeWidgets.set(base);
      (app as any).layoutPrimaDelTrascinamento = base.map((widget: any) => ({ ...widget }));
      app.trascinamentoWidget.set({ key: base[1].key, pointerId: 7, origineX: 0, origineY: 0,
        scartoX: 0, scartoY: 0, spostamentoX: 0, spostamentoY: 0, attivo: true });
      app.dragPlaceholder.set({ x: base[0].x, y: base[0].y, w: 3, h: 2 });
      app.targetScambio.set(base[0].key);
      spyOn(app as any, 'salvaLayoutWidget');

      app.terminaTrascinamentoWidget(eventoPointer('pointerup', 0, 0));

      expect(app.activeWidgets()[1]).toEqual(jasmine.objectContaining({ x: base[0].x, y: base[0].y }));
      expect(app.activeWidgets()[0]).toEqual(jasmine.objectContaining({ x: base[1].x, y: base[1].y }));
      expect(app.activeWidgets()[2]).toEqual(base[2]);
      expect((app as any).salvaLayoutWidget).toHaveBeenCalledTimes(1);
    });

    it('attiva il target soltanto dal 55 percento di overlap', () => {
      const app = TestBed.createComponent(App).componentInstance;
      const target = { ...app.activeWidgets()[0], x: 1, y: 1, w: 4, h: 2 };
      const altro = { ...app.activeWidgets()[1], x: 7, y: 1, w: 4, h: 2 };
      expect((app as any).trovaTargetScambio({ x: 4, y: 1, w: 4, h: 2 }, altro.key, [target, altro])).toBeNull();
      expect((app as any).trovaTargetScambio({ x: 2, y: 1, w: 4, h: 2 }, altro.key, [target, altro])?.key).toBe(target.key);
    });

    it('rifiuta lo swap di dimensioni differenti se collide con un terzo widget', () => {
      const app = TestBed.createComponent(App).componentInstance;
      const [grande, piccolo, ostacolo] = app.activeWidgets().slice(0, 3).map(widget => ({ ...widget }));
      Object.assign(grande, { x: 1, y: 1, w: 6, h: 3 });
      Object.assign(piccolo, { x: 8, y: 1, w: 3, h: 2 });
      Object.assign(ostacolo, { x: 4, y: 3, w: 3, h: 2 });
      expect((app as any).scambioGeometricamenteValido(grande, piccolo, [grande, piccolo, ostacolo])).toBeFalse();
      expect(ostacolo).toEqual(jasmine.objectContaining({ x: 4, y: 3 }));
    });

    it('ridimensiona con snap, limiti e rollback in collisione senza attivare il drag', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.screen.set('scrivania');
      fixture.detectChanges();
      const widget = app.activeWidgets()[1];
      const angolo = (fixture.nativeElement as HTMLElement).querySelectorAll('.resize-corner')[1] as HTMLElement;
      angolo.dispatchEvent(eventoPointer('pointerdown', 100, 100));
      expect(app.ridimensionamentoWidget()?.key).toBe(widget.key);
      expect(app.trascinamentoWidget()).toBeNull();

      app.ridimensionamentoWidget.update(stato => stato && ({
        ...stato, anteprima: { ...stato.anteprima, w: 12 }, valida: false
      }));
      const prima = { w: widget.w, h: widget.h };
      app.terminaRidimensionamentoWidget(eventoPointer('pointerup', 400, 400));
      expect(app.activeWidgets().find(item => item.key === widget.key)).toEqual(jasmine.objectContaining(prima));
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
