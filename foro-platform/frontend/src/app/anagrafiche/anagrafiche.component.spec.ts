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
    expect(fixture.nativeElement.textContent).toContain('Giulia Ferrari');
    (fixture.nativeElement.querySelector('.lista button') as HTMLButtonElement).click();fixture.detectChanges();
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
    (fixture.nativeElement.querySelector('.lista button') as HTMLButtonElement).click();fixture.detectChanges();
    http.expectOne('/api/v1/anagrafiche/1/pratiche').flush([]);fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Apri scheda completa');
    expect(fixture.nativeElement.querySelector('[role="table"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Documenti dell’Anagrafica');
    expect(fixture.nativeElement.textContent).toContain('Documenti delle Pratiche');
    expect(fixture.nativeElement.textContent).toContain('Stampa scheda anagrafica');
  });
  it('gestisce le metriche vuota, singolare e plurale',()=>{
    const componente=TestBed.createComponent(AnagraficheComponent).componentInstance;
    componente.totale.set(0);expect(componente.metrica()).toBe('Nessuna anagrafica');
    componente.totale.set(1);expect(componente.metrica()).toBe('1 anagrafica attiva');
    componente.totale.set(3);expect(componente.metrica()).toBe('3 anagrafiche attive');
  });
});
