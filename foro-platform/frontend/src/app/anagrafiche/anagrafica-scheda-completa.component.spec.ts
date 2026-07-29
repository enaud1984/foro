import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnagraficaSchedaCompletaComponent } from './anagrafica-scheda-completa.component';
import { Soggetto } from './anagrafiche.modelli';

describe('AnagraficaSchedaCompletaComponent',()=>{
  let http:HttpTestingController;
  const soggetto:Soggetto={id:'s1',tipoCodice:'PERSONA_FISICA',nome:'Giulia',cognome:'Ferrari',dataNascita:'1985-03-01',
    luogoNascita:'Torino',provinciaNascita:'TO',statoNascita:'Italia',denominazione:null,formaGiuridica:null,
    codiceFiscale:'FRRGLI85C41L219X',partitaIva:null,email:'giulia@example.test',pec:null,telefono:'011000000',
    cellulare:null,indirizzo:'Via Roma',civico:'1',cap:'10100',comune:'Torino',provincia:'TO',statoIndirizzo:'Italia',
    note:'Nota riservata',stato:'ATTIVO',version:0,creatoIl:'2026-01-01T10:00:00Z',aggiornatoIl:'2026-07-01T10:00:00Z'};
  beforeEach(async()=>{
    await TestBed.configureTestingModule({imports:[AnagraficaSchedaCompletaComponent],providers:[provideHttpClient(),provideHttpClientTesting()]}).compileComponents();
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());
  function crea(){
    const f=TestBed.createComponent(AnagraficaSchedaCompletaComponent);f.componentRef.setInput('soggetto',soggetto);f.detectChanges();
    http.expectOne('/api/v1/anagrafiche/s1/pratiche').flush([]);
    http.expectOne('/api/v1/anagrafiche/cataloghi/categorie-documenti').flush([{codice:'DOCUMENTO_IDENTITA',descrizione:'Documento di identità',ordine:1}]);
    http.expectOne('/api/v1/anagrafiche/s1/timeline').flush([]);
    http.expectOne(r=>r.url==='/api/v1/anagrafiche/s1/documenti').flush({content:[],totalElements:0,totalPages:0,number:0,size:100});
    f.detectChanges();return f;
  }
  it('apre la vera scheda del soggetto con le sei sezioni',()=>{
    const f=crea();const testo=f.nativeElement.textContent;
    expect(testo).toContain('Giulia Ferrari');expect(testo).toContain('Riepilogo');expect(testo).toContain('Dati generali');
    expect(testo).toContain('Recapiti e indirizzo');expect(testo).toContain('Pratiche collegate');expect(testo).toContain('Documenti');expect(testo).toContain('Timeline');
  });
  it('maschera il codice fiscale nel riepilogo',()=>{const f=crea();expect(f.nativeElement.textContent).toContain('••••••••••••219X');});
  it('espone tutte le azioni del menu documenti',()=>{
    const f=crea();f.componentInstance.menuDocumenti.set(true);f.detectChanges();const testo=f.nativeElement.textContent;
    expect(testo).toContain('Carica documento anagrafico');expect(testo).toContain('Documenti delle Pratiche');
    expect(testo).toContain('Genera documento');expect(testo).toContain('Stampa scheda anagrafica');
  });
  it('esclude note ed elenco documenti dalle opzioni di stampa predefinite',()=>{
    const f=crea();expect(f.componentInstance.opzioni().noteInterne).toBeFalse();expect(f.componentInstance.opzioni().elencoDocumenti).toBeFalse();
    expect(f.componentInstance.opzioni().datiGenerali).toBeTrue();expect(f.componentInstance.opzioni().pratiche).toBeTrue();
  });
  it('genera anteprima della scheda con dati letti dal backend',()=>{
    const f=crea();f.componentInstance.generaScheda();
    const richiesta=http.expectOne('/api/v1/anagrafiche/s1/stampa-scheda');
    expect(richiesta.request.body.noteInterne).toBeFalse();
    richiesta.flush({studio:{name:'Studio demo'},soggetto:{nome:'Giulia'},pratiche:[],documenti:[],opzioni:f.componentInstance.opzioni(),generataIl:'2026-07-29T12:00:00Z'});
    http.expectOne('/api/v1/anagrafiche/s1/timeline').flush([]);expect(f.componentInstance.schedaStampabile()).not.toBeNull();
  });
  it('non tenta anteprima inline di un DOCX attivo',()=>{
    const f=crea();f.componentInstance.apriAnteprima({id:'d1',praticaId:null,soggettoId:'s1',categoriaCodice:'ALTRO_ANAGRAFICO',
      titolo:'Documento',nomeFile:'documento.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      dimensione:12,origine:'UPLOAD',templateCodice:null,dataDocumento:null,note:null,version:0,caricatoDa:'u1',autore:'Utente',
      creatoIl:'2026-01-01T00:00:00Z',aggiornatoIl:'2026-01-01T00:00:00Z',praticaCodice:null,praticaTitolo:null,praticaStato:null});
    expect(f.componentInstance.anteprimaErrore()).toContain('non disponibile');http.expectNone(r=>r.url.includes('/download'));
  });
  it('raggruppa i documenti di Pratica senza duplicare i file',()=>{
    const f=crea();const base={soggettoId:null,categoriaCodice:'PROVA',nomeFile:'prova.pdf',mimeType:'application/pdf',
      dimensione:10,origine:'UPLOAD' as const,templateCodice:null,dataDocumento:null,note:null,version:0,caricatoDa:'u',autore:'Utente',
      creatoIl:'2026-01-01T00:00:00Z',aggiornatoIl:'2026-01-01T00:00:00Z',praticaStato:'APERTA'};
    f.componentInstance.documenti.set([
      {...base,id:'d1',titolo:'Uno',praticaId:'p1',praticaCodice:'PRA-1',praticaTitolo:'Prima'},
      {...base,id:'d2',titolo:'Due',praticaId:'p1',praticaCodice:'PRA-1',praticaTitolo:'Prima'},
      {...base,id:'d3',titolo:'Tre',praticaId:'p2',praticaCodice:'PRA-2',praticaTitolo:'Seconda'}
    ]);
    expect(f.componentInstance.gruppiDocumenti().length).toBe(2);
    expect(f.componentInstance.gruppiDocumenti()[0].documenti.length).toBe(2);
  });
});
