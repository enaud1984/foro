import { TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { PraticheComponent } from './pratiche.component';
import { PraticheService } from './pratiche.service';
import { PraticaSintetica } from './pratiche.modelli';

describe('PraticheComponent',()=>{
  let servizio:jasmine.SpyObj<PraticheService>;
  const cataloghi={
    materie:[{codice:'CIVILE',descrizione:'Diritto civile',ordine:1}],
    tipologie:[{codice:'CONSULENZA',descrizione:'Consulenza',ordine:1}],
    stati:[{codice:'APERTA',descrizione:'Aperta',ordine:1}],
    priorita:[{codice:'NORMALE',descrizione:'Normale',ordine:1},{codice:'URGENTE',descrizione:'Urgente',ordine:2}],
    ruoliTeam:[{codice:'RESPONSABILE',descrizione:'Responsabile',ordine:1},{codice:'COLLABORATORE',descrizione:'Collaboratore',ordine:2}],
    statiAttivita:[{codice:'DA_FARE',descrizione:'Da fare',ordine:1}],
    prioritaAttivita:[{codice:'NORMALE',descrizione:'Normale',ordine:1}],
    categorieDocumenti:[{codice:'INCARICO',descrizione:'Incarico',ordine:1}],
    ruoliSoggetto:[{codice:'CLIENTE',descrizione:'Cliente',ordine:1},{codice:'CONTROPARTE',descrizione:'Controparte',ordine:2}]
  };
  const pratica=(id='1'):PraticaSintetica=>({id,codice:`PRA-2026-0000${id}`,titolo:`Pratica ${id}`,materiaCodice:'CIVILE',
    tipologiaCodice:'CONSULENZA',statoCodice:'APERTA',prioritaCodice:id==='1'?'URGENTE':'NORMALE',responsabileId:'u1',
    responsabileNome:'Avv. Demo',riservata:false,dataApertura:'2026-07-29',aggiornatoIl:'2026-07-29T10:00:00Z',
    prossimaScadenza:'2026-08-01',attivitaScadute:0,clienti:'Cliente Demo',controparti:''});
  beforeEach(async()=>{
    servizio=jasmine.createSpyObj<PraticheService>('PraticheService',['cataloghi','personeStudio','elenco','dettaglio','crea','modifica','elimina','transizione',
      'soggetti','team','documenti','attivita','eventi','comunicazioni','timeline','datiGiudiziari','economia','aggiungiSoggetto','rimuoviSoggetto',
      'aggiungiTeam','rimuoviTeam','caricaDocumento','downloadDocumento','eliminaDocumento','creaAttivita','modificaAttivita','creaComunicazione',
      'salvaDatiGiudiziari','salvaEconomia']);
    servizio.cataloghi.and.returnValue(of(cataloghi));servizio.personeStudio.and.returnValue(of([{id:'u1',nome:'Avv. Demo'}]));
    servizio.elenco.and.returnValue(of({content:[pratica()],totalElements:1,totalPages:1,number:0,size:5}));
    servizio.soggetti.and.returnValue(of([]));servizio.team.and.returnValue(of([]));servizio.documenti.and.returnValue(of([]));
    servizio.attivita.and.returnValue(of([]));servizio.eventi.and.returnValue(of([]));servizio.comunicazioni.and.returnValue(of([]));
    servizio.timeline.and.returnValue(of([]));servizio.datiGiudiziari.and.returnValue(of({version:0}));servizio.economia.and.returnValue(of({version:0,valuta:'EUR'}));
    await TestBed.configureTestingModule({imports:[PraticheComponent],providers:[{provide:PraticheService,useValue:servizio}]}).compileComponents();
  });
  it('mostra titolo e azione nella vista espansa',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Pratiche');expect(f.nativeElement.textContent).toContain('Nuova pratica');
  });
  it('usa i dati restituiti dalla API',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.detectChanges();
    expect(f.nativeElement.textContent).toContain('PRA-2026-00001');expect(f.nativeElement.textContent).toContain('Pratica 1');
  });
  it('gestisce metrica zero singolare e plurale',()=>{
    const c=TestBed.createComponent(PraticheComponent).componentInstance;
    c.aperte.set(0);expect(c.metrica()).toBe('Nessuna pratica aperta');c.aperte.set(1);expect(c.metrica()).toBe('1 pratica aperta');c.aperte.set(3);expect(c.metrica()).toBe('3 pratiche aperte');
  });
  it('richiede al massimo cinque righe nel widget',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.componentRef.setInput('compatto',true);f.detectChanges();
    expect(servizio.elenco.calls.allArgs().some(args=>(args[0] as any).dimensione===5)).toBeTrue();
  });
  it('apre la pratica corretta dal widget compatto',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.componentRef.setInput('compatto',true);const emessa=jasmine.createSpy();f.componentInstance.richiediEspansione.subscribe(emessa);f.detectChanges();
    (f.nativeElement.querySelector('.lista-compatta button') as HTMLButtonElement).click();expect(emessa).toHaveBeenCalledWith(jasmine.objectContaining({id:'1'}));
  });
  it('espone loading empty error e degraded state',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.componentRef.setInput('compatto',true);f.detectChanges();
    f.componentInstance.caricamento.set(true);f.componentInstance.errore.set('Errore recuperabile');f.componentInstance.avviso.set('Dati secondari non disponibili');f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Caricamento');expect(f.nativeElement.textContent).toContain('Errore recuperabile');expect(f.nativeElement.textContent).toContain('Dati secondari');
  });
  it('carica i cataloghi dal backend senza array applicativi',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.detectChanges();
    expect(servizio.cataloghi).toHaveBeenCalled();expect(f.componentInstance.etichetta('materie','CIVILE')).toBe('Diritto civile');
  });
  it('blocca apertura senza Cliente nel wizard',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.detectChanges();const c=f.componentInstance;c.nuova();c.form.patchValue({titolo:'Demo',materiaCodice:'CIVILE',tipologiaCodice:'CONSULENZA',responsabileId:'u1',stato:'APERTA'});c.salva();
    expect(c.errore()).toContain('almeno un Cliente');expect(servizio.crea).not.toHaveBeenCalled();
  });
  it('mostra tutte le dieci schede operative',()=>{
    const f=TestBed.createComponent(PraticheComponent);f.detectChanges();
    servizio.dettaglio.and.returnValue(of({...pratica(),descrizione:null,valoreEconomico:null,valuta:'EUR',dataDefinizione:null,dataArchiviazione:null,motivoAttesa:null,noteInterne:null,version:0,creatoIl:'2026-07-29T10:00:00Z'}));
    f.componentInstance.apriDettaglio('1');f.detectChanges();const testo=f.nativeElement.textContent;
    ['Riepilogo','Soggetti','Team','Documenti','Attività','Agenda e scadenze','Comunicazioni','Dati giudiziari','Economia','Timeline'].forEach(s=>expect(testo).toContain(s));
  });
  it('ricerca con debounce tramite la stessa API',fakeAsync(()=>{
    const f=TestBed.createComponent(PraticheComponent);f.detectChanges();servizio.elenco.calls.reset();
    f.componentInstance.ricerca.setValue('Aurora');tick(251);
    expect(servizio.elenco).toHaveBeenCalledWith(jasmine.objectContaining({ricerca:'Aurora'}));
  }));
});
