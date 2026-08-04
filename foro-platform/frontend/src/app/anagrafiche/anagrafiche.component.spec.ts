import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnagraficheComponent } from './anagrafiche.component';

describe('AnagraficheComponent', () => {
  let http: HttpTestingController;
  beforeEach(async()=>{
    await TestBed.configureTestingModule({imports:[AnagraficheComponent],providers:[provideHttpClient(),provideHttpClientTesting()]}).compileComponents();
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  function rispondiIniziale(contenuto:any[]=[]):void{
    http.expectOne('/api/v1/anagrafiche/cataloghi/tipi-soggetto').flush([{codice:'PERSONA_FISICA',descrizione:'Persona fisica',ordine:1},{codice:'PERSONA_GIURIDICA',descrizione:'Persona giuridica',ordine:2}]);
    const richiesta=http.expectOne(r=>r.url==='/api/v1/anagrafiche');richiesta.flush({content:contenuto,totalElements:contenuto.length,totalPages:1,number:0,size:20});
  }
  it('mostra stato vuoto e pulsante di creazione',()=>{
    const fixture=TestBed.createComponent(AnagraficheComponent);fixture.detectChanges();rispondiIniziale();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nessuna anagrafica trovata');
    expect(fixture.nativeElement.textContent).toContain('Nuova anagrafica');
  });
  it('visualizza dati provenienti dalle API e apre il dettaglio',()=>{
    const soggetto={id:'1',tipoCodice:'PERSONA_FISICA',nome:'Giulia',cognome:'Ferrari',denominazione:null,email:'giulia@example.test',pec:null,telefono:null,cellulare:null,partitaIva:null,stato:'ATTIVO',version:0,creatoIl:'2026-07-29T08:00:00Z',aggiornatoIl:'2026-07-29T08:00:00Z'};
    const fixture=TestBed.createComponent(AnagraficheComponent);fixture.detectChanges();rispondiIniziale([soggetto]);fixture.detectChanges();
    expect(fixture.componentInstance.soggetti()).toEqual([soggetto] as any);
    fixture.componentInstance.rigaGriglia({data:soggetto} as any);fixture.detectChanges();
    http.expectOne('/api/v1/anagrafiche/1/pratiche').flush([]);
    expect(fixture.componentInstance.selezionato()?.id).toBe('1');
  });
  it('limita il widget compatto a cinque risultati tramite la richiesta API',()=>{
    const fixture=TestBed.createComponent(AnagraficheComponent);fixture.componentRef.setInput('compatto',true);fixture.detectChanges();
    http.expectOne('/api/v1/anagrafiche/cataloghi/tipi-soggetto').flush([]);
    const richiesta=http.expectOne(r=>r.url==='/api/v1/anagrafiche');
    expect(richiesta.request.params.get('dimensione')).toBe('5');richiesta.flush({content:[],totalElements:0,totalPages:0,number:0,size:5});
  });
  it('mostra il pulsante per aprire la scheda completa',()=>{
    const soggetto={id:'1',tipoCodice:'PERSONA_FISICA',nome:'Giulia',cognome:'Ferrari',denominazione:null,email:null,pec:null,telefono:null,cellulare:null,partitaIva:null,stato:'ATTIVO',version:0,creatoIl:'2026-07-29T08:00:00Z',aggiornatoIl:'2026-07-29T08:00:00Z'};
    const fixture=TestBed.createComponent(AnagraficheComponent);fixture.detectChanges();rispondiIniziale([soggetto]);fixture.detectChanges();
    fixture.componentInstance.apri(soggetto as any);fixture.detectChanges();
    http.expectOne('/api/v1/anagrafiche/1/pratiche').flush([]);fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Apri scheda completa');
    expect(fixture.nativeElement.querySelector('ag-grid-angular')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Documenti dell’Anagrafica');
    expect(fixture.nativeElement.textContent).toContain('Documenti delle Pratiche');
    expect(fixture.nativeElement.textContent).toContain('Stampa scheda anagrafica');
  });
  it('apre realmente la scheda completa e porta ai documenti delle Pratiche',()=>{
    const soggetto={id:'1',tipoCodice:'PERSONA_FISICA',nome:'Giulia',cognome:'Ferrari',denominazione:null,email:null,pec:null,telefono:null,cellulare:null,partitaIva:null,stato:'ATTIVO',version:0,creatoIl:'2026-07-29T08:00:00Z',aggiornatoIl:'2026-07-29T08:00:00Z'};
    const fixture=TestBed.createComponent(AnagraficheComponent);fixture.detectChanges();rispondiIniziale([soggetto]);fixture.detectChanges();
    fixture.componentInstance.apriSchedaCompleta(soggetto as any,'pratiche');fixture.detectChanges();
    http.expectOne('/api/v1/anagrafiche/1/pratiche').flush([]);
    http.expectOne('/api/v1/anagrafiche/cataloghi/categorie-documenti').flush([]);
    http.expectOne('/api/v1/anagrafiche/1/timeline').flush([]);
    http.match(r=>r.url==='/api/v1/anagrafiche/1/documenti').forEach(r=>r.flush({content:[],totalElements:0,totalPages:0,number:0,size:100}));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-anagrafica-scheda-completa')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.dettaglio')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Documenti delle Pratiche');
  });
  it('inizializza AG Grid con tre record, colonne e layout ad altezza controllata',()=>{
    const contenuto=[1,2,3].map(indice=>({id:String(indice),tipoCodice:'PERSONA_FISICA',nome:`Nome ${indice}`,cognome:'Prova',denominazione:null,email:null,pec:null,telefono:null,cellulare:null,partitaIva:null,stato:'ATTIVO',version:0,creatoIl:'2026-07-29T08:00:00Z',aggiornatoIl:'2026-07-29T08:00:00Z'}));
    const fixture=TestBed.createComponent(AnagraficheComponent);fixture.detectChanges();rispondiIniziale(contenuto);fixture.detectChanges();
    const componente=fixture.componentInstance;
    const griglia=(fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('ag-grid-angular');
    expect(componente.soggetti().length).toBe(3);
    expect(componente.colonneGriglia.length).toBeGreaterThan(0);
    expect(componente.colonneGriglia.map(colonna=>colonna.headerName)).toContain('Soggetto');
    expect(componente.opzioniGriglia.domLayout).toBe('normal');
    expect(griglia).toBeTruthy();
    expect(griglia?.classList).toContain('ag-theme-quartz');
    expect(getComputedStyle(griglia!).height).not.toBe('0px');
    expect(getComputedStyle(griglia!).minHeight).toBe('320px');
    expect(getComputedStyle(griglia!).overflow).not.toBe('hidden');
  });
  it('gestisce le metriche vuota, singolare e plurale',()=>{
    const componente=TestBed.createComponent(AnagraficheComponent).componentInstance;
    componente.totale.set(0);expect(componente.metrica()).toBe('Nessuna anagrafica');
    componente.totale.set(1);expect(componente.metrica()).toBe('1 anagrafica attiva');
    componente.totale.set(3);expect(componente.metrica()).toBe('3 anagrafiche attive');
  });
});
