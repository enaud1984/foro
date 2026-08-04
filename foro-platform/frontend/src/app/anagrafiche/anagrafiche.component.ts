import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AnagraficheService } from './anagrafiche.service';
import { CatalogoAnagrafica, PraticaCollegataAnagrafica, RichiestaSoggetto, Soggetto, TipoSoggetto } from './anagrafiche.modelli';
import { AnagraficaSchedaCompletaComponent } from './anagrafica-scheda-completa.component';
import { IconaForoComponent } from '../shared/icona-foro.component';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { opzioniGrigliaForo } from '../shared/configurazione-griglia-foro';

@Component({
  selector: 'app-anagrafiche',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AnagraficaSchedaCompletaComponent, IconaForoComponent, AgGridAngular],
  templateUrl: './anagrafiche.component.html',
  styleUrl: './anagrafiche.component.scss'
})
export class AnagraficheComponent implements OnInit, OnChanges {
  readonly opzioniGriglia = opzioniGrigliaForo;
  private apiGriglia?: GridApi<Soggetto>;
  private readonly fb = inject(FormBuilder);
  private readonly servizio = inject(AnagraficheService);
  @Input() compatto = false;
  @Input() soggettoInizialeId: string | null = null;
  @Input() nuovoIniziale = false;
  @Output() soggettoSelezionato = new EventEmitter<Soggetto>();
  @Output() richiediEspansione = new EventEmitter<Soggetto | null>();
  @Output() praticaAperta = new EventEmitter<string>();
  readonly soggetti = signal<Soggetto[]>([]);
  readonly tipi = signal<CatalogoAnagrafica[]>([]);
  readonly selezionato = signal<Soggetto | null>(null);
  readonly caricamento = signal(true);
  readonly errore = signal('');
  readonly pagina = signal(0);
  readonly pagineTotali = signal(0);
  readonly totale = signal(0);
  readonly formAperto = signal(false);
  readonly schedaCompleta = signal(false);
  readonly azioneScheda = signal<'anagrafica'|'pratiche'|'genera'|'stampa'|null>(null);
  readonly candidatiDuplicati = signal<Array<{id:string;nomeVisualizzato:string}>>([]);
  readonly confermaDuplicato = signal(false);
  readonly praticheCollegate = signal<PraticaCollegataAnagrafica[]>([]);
  readonly menuRigaAperto = signal<string|null>(null);
  readonly ordinamento = signal<{campo:'nome'|'tipo'|'aggiornamento';direzione:1|-1}>({campo:'nome',direzione:1});
  readonly soggettiOrdinati = computed(()=>{
    const {campo,direzione}=this.ordinamento();
    return [...this.soggetti()].sort((a,b)=>{
      const av=campo==='nome'?this.nome(a):campo==='tipo'?this.etichettaTipo(a.tipoCodice):a.aggiornatoIl;
      const bv=campo==='nome'?this.nome(b):campo==='tipo'?this.etichettaTipo(b.tipoCodice):b.aggiornatoIl;
      return av.localeCompare(bv,'it')*direzione;
    });
  });
  readonly ricerca = this.fb.nonNullable.control('');
  readonly filtroTipo = this.fb.nonNullable.control('');
  readonly filtroStato = this.fb.nonNullable.control('');
  readonly form = this.fb.nonNullable.group({
    id: [''], version: [0], tipoCodice: ['PERSONA_FISICA' as TipoSoggetto, Validators.required],
    nome: ['', Validators.maxLength(120)], cognome: ['', Validators.maxLength(120)], dataNascita: [''],
    luogoNascita: ['', Validators.maxLength(160)], provinciaNascita: ['', Validators.pattern(/^$|^[A-Za-z]{2}$/)],
    statoNascita: [''], denominazione: ['', Validators.maxLength(240)], formaGiuridica: [''],
    codiceFiscale: ['', Validators.maxLength(24)], partitaIva: ['', Validators.pattern(/^$|^\d{11}$/)],
    email: ['', Validators.email], pec: ['', Validators.email], telefono: [''], cellulare: [''],
    indirizzo: [''], civico: [''], cap: ['', Validators.pattern(/^$|^[A-Za-z0-9 -]{3,10}$/)],
    comune: [''], provincia: ['', Validators.pattern(/^$|^[A-Za-z]{2}$/)], statoIndirizzo: ['Italia'],
    note: ['', Validators.maxLength(4000)], stato: this.fb.nonNullable.control<'ATTIVO'|'DISATTIVATO'>('ATTIVO')
  });
  readonly colonneGriglia: ColDef<Soggetto>[] = [
    {headerName:'Soggetto',valueGetter:p=>p.data?this.nome(p.data):'',minWidth:190},
    {headerName:'Tipologia',valueGetter:p=>p.data?this.etichettaTipo(p.data.tipoCodice):''},
    {headerName:'Codice fiscale / P.IVA',valueGetter:p=>p.data?this.identificativoFiscale(p.data):'',minWidth:180},
    {headerName:'Email / PEC',valueGetter:p=>p.data?this.recapito(p.data):'',minWidth:190},
    {headerName:'Telefono',field:'telefono'},
    {headerName:'Stato',field:'stato',maxWidth:130},
    {headerName:'Ultima modifica',field:'aggiornatoIl',valueFormatter:p=>p.value?new Intl.DateTimeFormat('it-IT').format(new Date(p.value)):'—'},
    {headerName:'Azioni',sortable:false,filter:false,maxWidth:150,cellRenderer:()=>'<button class="azione-griglia" type="button">Apri / modifica</button>'},
  ];
  grigliaPronta(evento:GridReadyEvent<Soggetto>):void{this.apiGriglia=evento.api;this.applicaFiltroGlobale(this.ricerca.value);}
  applicaFiltroGlobale(testo:string):void{this.apiGriglia?.setGridOption('quickFilterText',testo);sessionStorage.setItem('foro.anagrafiche.filtro',testo);}
  rigaGriglia(evento:RowClickedEvent<Soggetto>):void{if(evento.data)this.apri(evento.data);}
  ngOnInit(): void {
    if(!this.compatto)this.ricerca.setValue(sessionStorage.getItem('foro.anagrafiche.filtro')??'',{emitEvent:false});
    if(this.compatto)this.filtroStato.setValue('ATTIVO',{emitEvent:false});
    this.servizio.tipi().subscribe({next:v=>this.tipi.set(v),error:()=>this.errore.set('Cataloghi non disponibili.')});
    this.ricerca.valueChanges.pipe(debounceTime(250),distinctUntilChanged()).subscribe(testo=>{this.pagina.set(0);this.applicaFiltroGlobale(testo);this.carica();});
    this.filtroTipo.valueChanges.subscribe(()=>{this.pagina.set(0);this.carica();});
    this.filtroStato.valueChanges.subscribe(()=>{this.pagina.set(0);this.carica();});
    this.carica();
  }
  ngOnChanges(cambiamenti: SimpleChanges): void {
    if (cambiamenti['soggettoInizialeId'] && this.soggettoInizialeId) this.apriDettaglio(this.soggettoInizialeId,true);
    if (cambiamenti['nuovoIniziale'] && this.nuovoIniziale && !this.compatto) this.nuova();
  }
  carica(): void {
    this.caricamento.set(true);this.errore.set('');
    this.servizio.elenco(this.ricerca.value,this.filtroTipo.value,this.filtroStato.value,this.compatto?0:this.pagina(),this.compatto?5:12).subscribe({
      next:p=>{this.soggetti.set(p.content);this.totale.set(p.totalElements);this.pagineTotali.set(p.totalPages);this.caricamento.set(false);},
      error:r=>{this.errore.set(r?.status===403?'Non hai il permesso di consultare le Anagrafiche.':'Anagrafiche non disponibili. Riprova.');this.caricamento.set(false);}
    });
  }
  nome(s:Soggetto):string{return s.denominazione||`${s.nome??''} ${s.cognome??''}`.trim();}
  etichettaTipo(codice:string):string{return this.tipi().find(t=>t.codice===codice)?.descrizione??codice.replaceAll('_',' ');}
  recapito(s:Soggetto):string{return s.email||s.pec||s.telefono||(s.partitaIva?`P.IVA ••••••${s.partitaIva.slice(-4)}`:'Nessun recapito');}
  identificativoFiscale(s:Soggetto):string{return s.codiceFiscale||s.partitaIva||'—';}
  metrica():string{return this.totale()===0?'Nessuna anagrafica':this.totale()===1?'1 anagrafica attiva':`${this.totale()} anagrafiche attive`;}
  persone():number{return this.soggetti().filter(s=>s.tipoCodice==='PERSONA_FISICA').length;}
  organizzazioni():number{return this.soggetti().length-this.persone();}
  attive():number{return this.soggetti().filter(s=>s.stato==='ATTIVO').length;}
  cambiaOrdinamento(campo:'nome'|'tipo'|'aggiornamento'):void{
    this.ordinamento.update(attuale=>attuale.campo===campo?{campo,direzione:attuale.direzione===1?-1:1}:{campo,direzione:1});
  }
  toggleMenuRiga(id:string,evento:Event):void{evento.stopPropagation();this.menuRigaAperto.update(aperto=>aperto===id?null:id);}
  apri(s:Soggetto):void {
    this.menuRigaAperto.set(null);
    this.selezionato.set(s);this.soggettoSelezionato.emit(s);
    if(!this.compatto)this.caricaPratiche(s.id);
    if(this.compatto)this.richiediEspansione.emit(s);
  }
  apriDettaglio(id:string,completa=false):void{this.servizio.dettaglio(id).subscribe({next:s=>{this.selezionato.set(s);this.caricaPratiche(id);this.schedaCompleta.set(completa);},error:()=>this.errore.set('Anagrafica non trovata.')});}
  apriSchedaCompleta(s:Soggetto,azione:'anagrafica'|'pratiche'|'genera'|'stampa'|null=null):void{
    this.selezionato.set(s);this.azioneScheda.set(azione);this.schedaCompleta.set(true);
  }
  modificaDaScheda(s:Soggetto):void{this.schedaCompleta.set(false);this.modifica(s);}
  nuova():void{
    if(this.compatto){this.richiediEspansione.emit(null);return;}
    this.form.reset({id:'',version:0,tipoCodice:'PERSONA_FISICA',nome:'',cognome:'',dataNascita:'',luogoNascita:'',provinciaNascita:'',statoNascita:'',denominazione:'',formaGiuridica:'',codiceFiscale:'',partitaIva:'',email:'',pec:'',telefono:'',cellulare:'',indirizzo:'',civico:'',cap:'',comune:'',provincia:'',statoIndirizzo:'Italia',note:'',stato:'ATTIVO'});
    this.candidatiDuplicati.set([]);this.formAperto.set(true);
  }
  modifica(s:Soggetto):void{this.form.patchValue({...s,dataNascita:s.dataNascita??'',nome:s.nome??'',cognome:s.cognome??'',luogoNascita:s.luogoNascita??'',provinciaNascita:s.provinciaNascita??'',statoNascita:s.statoNascita??'',denominazione:s.denominazione??'',formaGiuridica:s.formaGiuridica??'',codiceFiscale:s.codiceFiscale??'',partitaIva:s.partitaIva??'',email:s.email??'',pec:s.pec??'',telefono:s.telefono??'',cellulare:s.cellulare??'',indirizzo:s.indirizzo??'',civico:s.civico??'',cap:s.cap??'',comune:s.comune??'',provincia:s.provincia??'',statoIndirizzo:s.statoIndirizzo??'',note:s.note??''});this.candidatiDuplicati.set([]);this.formAperto.set(true);}
  chiudiForm():void{if(this.form.dirty&&!confirm('Uscire senza salvare le modifiche?'))return;this.formAperto.set(false);}
  salva(forza=false):void{
    this.applicaValidazioniTipo();if(this.form.invalid){this.form.markAllAsTouched();return;}
    const richiesta=this.richiesta();
    if(!forza){this.servizio.duplicati(richiesta).subscribe({next:d=>{const altri=d.filter(x=>x.id!==richiesta.id);if(altri.length){this.candidatiDuplicati.set(altri);this.confermaDuplicato.set(true);}else this.persiste(richiesta);},error:r=>this.errore.set(r?.error?.message??'Verifica duplicati non riuscita.')});return;}
    this.persiste(richiesta);
  }
  private persiste(r:RichiestaSoggetto):void{
    const op=r.id?this.servizio.modifica(r.id,r):this.servizio.crea(r);
    op.subscribe({next:s=>{this.formAperto.set(false);this.confermaDuplicato.set(false);this.selezionato.set(s);this.soggettoSelezionato.emit(s);this.carica();},error:x=>this.errore.set(x?.error?.code==='ANAGRAFICA_VERSIONE_CONFLITTO'?'L’anagrafica è stata modificata da un altro utente. Ricarica i dati.':x?.error?.message??'Salvataggio non riuscito.')});
  }
  cambiaStato(s:Soggetto):void{this.modifica(s);this.form.controls.stato.setValue(s.stato==='ATTIVO'?'DISATTIVATO':'ATTIVO');this.persiste(this.richiesta());}
  elimina(s:Soggetto):void{if(!confirm(`Eliminare logicamente ${this.nome(s)}?`))return;this.servizio.elimina(s.id).subscribe({next:()=>{this.selezionato.set(null);this.carica();},error:()=>this.errore.set('Eliminazione non riuscita.')});}
  vai(delta:number):void{const p=this.pagina()+delta;if(p>=0&&p<this.pagineTotali()){this.pagina.set(p);this.carica();}}
  personaFisica():boolean{return this.form.controls.tipoCodice.value==='PERSONA_FISICA';}
  indirizzoCompleto(s:Soggetto):string{return [s.indirizzo,s.civico,s.cap,s.comune,s.provincia,s.statoIndirizzo].filter(Boolean).join(' ');}
  applicaValidazioniTipo():void{const persona=this.personaFisica();this.form.controls.nome.setValidators(persona?[Validators.required,Validators.maxLength(120)]:[Validators.maxLength(120)]);this.form.controls.cognome.setValidators(persona?[Validators.required,Validators.maxLength(120)]:[Validators.maxLength(120)]);this.form.controls.denominazione.setValidators(!persona?[Validators.required,Validators.maxLength(240)]:[Validators.maxLength(240)]);this.form.controls.nome.updateValueAndValidity();this.form.controls.cognome.updateValueAndValidity();this.form.controls.denominazione.updateValueAndValidity();}
  private richiesta():RichiestaSoggetto{const v=this.form.getRawValue();return {...v,id:v.id||undefined,dataNascita:v.dataNascita||null,nome:v.nome||null,cognome:v.cognome||null,luogoNascita:v.luogoNascita||null,provinciaNascita:v.provinciaNascita||null,statoNascita:v.statoNascita||null,denominazione:v.denominazione||null,formaGiuridica:v.formaGiuridica||null,codiceFiscale:v.codiceFiscale||null,partitaIva:v.partitaIva||null,email:v.email||null,pec:v.pec||null,telefono:v.telefono||null,cellulare:v.cellulare||null,indirizzo:v.indirizzo||null,civico:v.civico||null,cap:v.cap||null,comune:v.comune||null,provincia:v.provincia||null,statoIndirizzo:v.statoIndirizzo||null,note:v.note||null};}
  private caricaPratiche(id:string):void{this.servizio.pratiche(id).subscribe({next:p=>this.praticheCollegate.set(p),error:()=>this.praticheCollegate.set([])});}
}
