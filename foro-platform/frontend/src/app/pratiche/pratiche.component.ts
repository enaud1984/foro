import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AnagraficheComponent } from '../anagrafiche/anagrafiche.component';
import { Soggetto } from '../anagrafiche/anagrafiche.modelli';
import {
  AttivitaPratica, CatalogoPratica, ComunicazionePratica, DocumentoPratica, EventoPratica, EventoTimeline,
  MembroTeam, PersonaStudio, Pratica, PraticaSintetica, RelazioneSoggetto, RichiestaPratica
} from './pratiche.modelli';
import { PraticheService } from './pratiche.service';

type Scheda='riepilogo'|'soggetti'|'team'|'documenti'|'attivita'|'agenda'|'comunicazioni'|'giudiziari'|'economia'|'timeline';

@Component({
  selector:'app-pratiche',
  standalone:true,
  imports:[CommonModule,ReactiveFormsModule,AnagraficheComponent],
  templateUrl:'./pratiche.component.html',
  styleUrl:'./pratiche.component.scss'
})
export class PraticheComponent implements OnInit,OnChanges {
  private readonly fb=inject(FormBuilder);
  private readonly servizio=inject(PraticheService);
  @Input() compatto=false;
  @Input() praticaInizialeId:string|null=null;
  @Input() nuovaIniziale=false;
  @Output() richiediEspansione=new EventEmitter<PraticaSintetica|null>();
  @Output() apriAnagrafica=new EventEmitter<string>();
  @Output() apriEventoAgenda=new EventEmitter<EventoPratica>();
  @Output() creaEventoAgenda=new EventEmitter<Pratica>();

  readonly pratiche=signal<PraticaSintetica[]>([]);
  readonly selezionata=signal<Pratica|null>(null);
  readonly cataloghi=signal<Record<string,CatalogoPratica[]>>({});
  readonly persone=signal<PersonaStudio[]>([]);
  readonly caricamento=signal(true);
  readonly errore=signal('');
  readonly avviso=signal('');
  readonly pagina=signal(0);
  readonly pagineTotali=signal(0);
  readonly totale=signal(0);
  readonly aperte=signal(0);
  readonly attenzione=signal(0);
  readonly scheda=signal<Scheda>('riepilogo');
  readonly formAperto=signal(false);
  readonly passo=signal(1);
  readonly selettoreAnagrafiche=signal(false);
  readonly soggettiBozza=signal<Array<{soggettoId:string;nome:string;ruoloCodice:string;principale:boolean}>>([]);
  readonly teamBozza=signal<Array<{utenteId:string;nome:string;ruoloTeamCodice:string;principale:boolean}>>([]);
  readonly soggetti=signal<RelazioneSoggetto[]>([]);
  readonly team=signal<MembroTeam[]>([]);
  readonly documenti=signal<DocumentoPratica[]>([]);
  readonly attivita=signal<AttivitaPratica[]>([]);
  readonly eventi=signal<EventoPratica[]>([]);
  readonly comunicazioni=signal<ComunicazionePratica[]>([]);
  readonly timeline=signal<EventoTimeline[]>([]);
  readonly fileSelezionato=signal<File|null>(null);
  readonly ricerca=this.fb.nonNullable.control('');
  readonly filtroStato=this.fb.nonNullable.control('');
  readonly filtroMateria=this.fb.nonNullable.control('');
  readonly filtroPriorita=this.fb.nonNullable.control('');
  readonly form=this.fb.nonNullable.group({
    id:[''],version:[0],titolo:['',Validators.required],descrizione:[''],materiaCodice:['',Validators.required],
    tipologiaCodice:['',Validators.required],prioritaCodice:['NORMALE',Validators.required],responsabileId:['',Validators.required],
    valoreEconomico:this.fb.control<number|null>(null,[Validators.min(0)]),valuta:['EUR'],riservata:[false],
    dataApertura:[this.dataOggi(),Validators.required],motivoAttesa:[''],noteInterne:[''],stato:['BOZZA']
  });
  readonly soggettoForm=this.fb.nonNullable.group({ruoloCodice:['CLIENTE'],principale:[false],descrizioneRuoloAltro:[''],note:['']});
  readonly teamForm=this.fb.nonNullable.group({utenteId:[''],ruoloTeamCodice:['COLLABORATORE'],principale:[false]});
  readonly documentoForm=this.fb.nonNullable.group({titolo:['',Validators.required],categoriaCodice:['INCARICO',Validators.required],soggettoId:['']});
  readonly attivitaForm=this.fb.nonNullable.group({titolo:['',Validators.required],descrizione:[''],assegnatarioId:[''],statoCodice:['DA_FARE'],prioritaCodice:['NORMALE'],dataScadenza:['']});
  readonly comunicazioneForm=this.fb.nonNullable.group({tipo:['NOTA'],oggetto:['',Validators.required],descrizione:[''],dataComunicazione:[new Date().toISOString().slice(0,16)]});
  readonly giudiziariForm=this.fb.nonNullable.group({
    version:[0],autoritaGiudiziaria:[''],ufficio:[''],sezione:[''],numeroRg:[''],annoRg:this.fb.control<number|null>(null,[Validators.min(1900),Validators.max(2200)]),
    giudice:[''],dataIscrizioneRuolo:[''],tipoProcedimento:[''],gradoGiudizio:[''],ruoloProcessualeCliente:[''],statoProcedimento:[''],note:['']
  });
  readonly economiaForm=this.fb.nonNullable.group({
    version:[0],preventivo:[0,[Validators.min(0)]],compensoConcordato:[0,[Validators.min(0)]],accontiRichiesti:[0,[Validators.min(0)]],
    accontiPagati:[0,[Validators.min(0)]],speseAnticipate:[0,[Validators.min(0)]],contributoUnificato:[0,[Validators.min(0)]],
    altreSpese:[0,[Validators.min(0)]],importoFatturato:[0,[Validators.min(0)]],importoIncassato:[0,[Validators.min(0)]],valuta:['EUR'],note:['']
  });

  ngOnInit():void {
    this.servizio.cataloghi().subscribe({next:c=>{this.cataloghi.set(c);this.impostaCataloghiPredefiniti();},error:()=>this.errore.set('Cataloghi Pratiche non disponibili.')});
    this.servizio.personeStudio().subscribe({next:p=>{this.persone.set(p);if(!this.form.controls.responsabileId.value&&p[0])this.form.controls.responsabileId.setValue(p[0].id);},error:()=>this.avviso.set('Elenco collaboratori temporaneamente non disponibile.')});
    this.ricerca.valueChanges.pipe(debounceTime(250),distinctUntilChanged()).subscribe(()=>{this.pagina.set(0);this.carica();});
    this.filtroStato.valueChanges.subscribe(()=>{this.pagina.set(0);this.carica();});
    this.filtroMateria.valueChanges.subscribe(()=>{this.pagina.set(0);this.carica();});
    this.filtroPriorita.valueChanges.subscribe(()=>{this.pagina.set(0);this.carica();});
    this.carica();
  }
  ngOnChanges(c:SimpleChanges):void {
    if(c['praticaInizialeId']&&this.praticaInizialeId)this.apriDettaglio(this.praticaInizialeId);
    if(c['nuovaIniziale']&&this.nuovaIniziale&&!this.compatto)this.nuova();
  }
  carica():void {
    this.caricamento.set(true);this.errore.set('');
    const filtri={ricerca:this.ricerca.value,stato:this.filtroStato.value,materia:this.filtroMateria.value,priorita:this.filtroPriorita.value,
      pagina:this.compatto?0:this.pagina(),dimensione:this.compatto?5:12,includiArchiviate:this.filtroStato.value==='ARCHIVIATA'};
    this.servizio.elenco(filtri).subscribe({
      next:p=>{this.pratiche.set(this.compatto?this.ordinaPriorita(p.content).slice(0,5):p.content);this.totale.set(p.totalElements);this.pagineTotali.set(p.totalPages);this.caricamento.set(false);},
      error:r=>{this.errore.set(r?.status===403?'Non hai il permesso di consultare le Pratiche.':'Pratiche non disponibili. Riprova.');this.caricamento.set(false);}
    });
    if(this.compatto){
      this.servizio.elenco({stato:'APERTA',pagina:0,dimensione:1}).subscribe({next:p=>this.aperte.set(p.totalElements),error:()=>this.avviso.set('Conteggio pratiche aperte non disponibile.')});
      this.servizio.elenco({scadenzeImminenti:true,pagina:0,dimensione:1}).subscribe({next:p=>this.attenzione.set(p.totalElements),error:()=>this.avviso.set('Priorità secondarie non disponibili.')});
    }
  }
  metrica():string{return this.aperte()===0?'Nessuna pratica aperta':this.aperte()===1?'1 pratica aperta':`${this.aperte()} pratiche aperte`;}
  etichetta(gruppo:string,codice:string):string{return this.cataloghi()[gruppo]?.find(c=>c.codice===codice)?.descrizione??codice.replaceAll('_',' ');}
  apri(pratica:PraticaSintetica):void{if(this.compatto){this.richiediEspansione.emit(pratica);return;}this.apriDettaglio(pratica.id);}
  apriDettaglio(id:string):void {
    this.caricamento.set(true);
    this.servizio.dettaglio(id).subscribe({next:p=>{this.selezionata.set(p);this.caricaRisorse(p.id);this.caricamento.set(false);},error:()=>{this.errore.set('Pratica non trovata o non visibile.');this.caricamento.set(false);}});
  }
  nuova():void {
    if(this.compatto){this.richiediEspansione.emit(null);return;}
    this.form.reset({id:'',version:0,titolo:'',descrizione:'',materiaCodice:this.cataloghi()['materie']?.[0]?.codice??'',tipologiaCodice:this.cataloghi()['tipologie']?.[0]?.codice??'',
      prioritaCodice:'NORMALE',responsabileId:this.persone()[0]?.id??'',valoreEconomico:null,valuta:'EUR',riservata:false,dataApertura:this.dataOggi(),motivoAttesa:'',noteInterne:'',stato:'BOZZA'});
    this.soggettiBozza.set([]);this.teamBozza.set([]);this.passo.set(1);this.formAperto.set(true);
  }
  modifica(p:Pratica):void {
    this.form.reset({id:p.id,version:p.version,titolo:p.titolo,descrizione:p.descrizione??'',materiaCodice:p.materiaCodice,tipologiaCodice:p.tipologiaCodice,
      prioritaCodice:p.prioritaCodice,responsabileId:p.responsabileId,valoreEconomico:p.valoreEconomico,valuta:p.valuta,riservata:p.riservata,
      dataApertura:p.dataApertura,motivoAttesa:p.motivoAttesa??'',noteInterne:p.noteInterne??'',stato:p.statoCodice});
    this.passo.set(1);this.formAperto.set(true);
  }
  chiudiForm():void{if(this.form.dirty&&!confirm('Uscire senza salvare le modifiche?'))return;this.formAperto.set(false);this.selettoreAnagrafiche.set(false);}
  vaiPasso(delta:number):void {
    if(delta>0&&this.passo()===1&&this.form.invalid){this.form.markAllAsTouched();return;}
    this.passo.set(Math.max(1,Math.min(5,this.passo()+delta)));
  }
  selezionaSoggetto(s:Soggetto):void {
    const ruolo=this.soggettoForm.controls.ruoloCodice.value;
    if(this.soggettiBozza().some(x=>x.soggettoId===s.id&&x.ruoloCodice===ruolo)){this.avviso.set('Il Soggetto ha già questo ruolo.');return;}
    const nome=s.denominazione||`${s.nome??''} ${s.cognome??''}`.trim();
    const principale=ruolo==='CLIENTE'&&!this.soggettiBozza().some(x=>x.ruoloCodice==='CLIENTE');
    this.soggettiBozza.update(lista=>[...lista,{soggettoId:s.id,nome,ruoloCodice:ruolo,principale}]);
    this.selettoreAnagrafiche.set(false);
  }
  soggettoScelto(s:Soggetto):void { if(this.formAperto())this.selezionaSoggetto(s);else this.collegaSoggettoEsistente(s); }
  rimuoviSoggettoBozza(indice:number):void{this.soggettiBozza.update(l=>l.filter((_,i)=>i!==indice));}
  aggiungiTeamBozza():void {
    const v=this.teamForm.getRawValue();const persona=this.persone().find(p=>p.id===v.utenteId);
    if(!persona||this.teamBozza().some(x=>x.utenteId===v.utenteId&&x.ruoloTeamCodice===v.ruoloTeamCodice))return;
    this.teamBozza.update(l=>[...l,{...v,nome:persona.nome}]);
  }
  salva():void {
    if(this.form.invalid){this.form.markAllAsTouched();return;}
    const v=this.form.getRawValue();
    if(!v.id&&v.stato==='APERTA'&&!this.soggettiBozza().some(s=>s.ruoloCodice==='CLIENTE')){this.errore.set('Per aprire la Pratica è necessario almeno un Cliente.');this.passo.set(2);return;}
    const richiesta:RichiestaPratica={version:v.version,titolo:v.titolo,descrizione:v.descrizione||null,materiaCodice:v.materiaCodice,
      tipologiaCodice:v.tipologiaCodice,prioritaCodice:v.prioritaCodice,responsabileId:v.responsabileId,valoreEconomico:v.valoreEconomico,
      valuta:v.valuta,riservata:v.riservata,dataApertura:v.dataApertura,motivoAttesa:v.motivoAttesa||null,noteInterne:v.noteInterne||null,
      stato:v.stato,soggetti:this.soggettiBozza().map(s=>({soggettoId:s.soggettoId,ruoloCodice:s.ruoloCodice,principale:s.principale})),
      team:this.teamBozza().map(t=>({utenteId:t.utenteId,ruoloTeamCodice:t.ruoloTeamCodice,principale:t.principale}))};
    const op=v.id?this.servizio.modifica(v.id,richiesta):this.servizio.crea(richiesta);
    op.subscribe({next:p=>{this.formAperto.set(false);this.selezionata.set(p);this.carica();this.caricaRisorse(p.id);},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  transizione(azione:string):void {
    const p=this.selezionata();if(!p)return;
    this.servizio.transizione(p.id,azione,p.version).subscribe({next:x=>{this.selezionata.set(x);this.carica();this.caricaRisorse(x.id);},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  elimina():void {
    const p=this.selezionata();if(!p||!confirm(`Eliminare logicamente ${p.codice}?`))return;
    this.servizio.elimina(p.id,p.version).subscribe({next:()=>{this.selezionata.set(null);this.carica();},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  impostaScheda(s:Scheda):void{this.scheda.set(s);}
  collegaSoggettoEsistente(s:Soggetto):void {
    const p=this.selezionata();if(!p)return;
    const v=this.soggettoForm.getRawValue();
    this.servizio.aggiungiSoggetto(p.id,{soggettoId:s.id,...v}).subscribe({next:()=>{this.selettoreAnagrafiche.set(false);this.caricaRisorse(p.id);},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  rimuoviSoggetto(r:RelazioneSoggetto):void {
    const p=this.selezionata();if(!p||!confirm(`Scollegare ${r.nomeVisualizzato}?`))return;
    this.servizio.rimuoviSoggetto(p.id,r.id).subscribe({next:()=>this.caricaRisorse(p.id),error:x=>this.errore.set(this.messaggioErrore(x))});
  }
  aggiungiTeam():void {
    const p=this.selezionata(),v=this.teamForm.getRawValue();if(!p||!v.utenteId)return;
    this.servizio.aggiungiTeam(p.id,v).subscribe({next:()=>this.caricaRisorse(p.id),error:x=>this.errore.set(this.messaggioErrore(x))});
  }
  rimuoviTeam(m:MembroTeam):void {
    const p=this.selezionata();if(!p||!confirm(`Rimuovere ${m.nomeVisualizzato} dal team?`))return;
    this.servizio.rimuoviTeam(p.id,m.id).subscribe({next:()=>this.caricaRisorse(p.id),error:x=>this.errore.set(this.messaggioErrore(x))});
  }
  selezionaFile(event:Event):void{this.fileSelezionato.set((event.target as HTMLInputElement).files?.[0]??null);}
  caricaDocumento():void {
    const p=this.selezionata(),file=this.fileSelezionato();if(!p||!file||this.documentoForm.invalid)return;
    const v=this.documentoForm.getRawValue(),dati=new FormData();dati.append('file',file);dati.append('titolo',v.titolo);dati.append('categoriaCodice',v.categoriaCodice);dati.append('origine','UPLOAD');if(v.soggettoId)dati.append('soggettoId',v.soggettoId);
    this.servizio.caricaDocumento(p.id,dati).subscribe({next:()=>{this.documentoForm.reset({titolo:'',categoriaCodice:'INCARICO',soggettoId:''});this.fileSelezionato.set(null);this.caricaRisorse(p.id);},error:x=>this.errore.set(this.messaggioErrore(x))});
  }
  scaricaDocumento(d:DocumentoPratica):void {
    const p=this.selezionata();if(!p)return;this.servizio.downloadDocumento(p.id,d.id).subscribe({next:b=>{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=d.nomeFile;a.click();URL.revokeObjectURL(u);},error:()=>this.errore.set('Documento non disponibile per il download.')});
  }
  eliminaDocumento(d:DocumentoPratica):void{const p=this.selezionata();if(!p||!confirm(`Eliminare ${d.titolo}?`))return;this.servizio.eliminaDocumento(p.id,d.id).subscribe({next:()=>this.caricaRisorse(p.id),error:x=>this.errore.set(this.messaggioErrore(x))});}
  creaAttivita():void {
    const p=this.selezionata();if(!p||this.attivitaForm.invalid)return;const v=this.attivitaForm.getRawValue();
    this.servizio.creaAttivita(p.id,{...v,assegnatarioId:v.assegnatarioId||null,dataScadenza:v.dataScadenza||null,eventoCalendarioId:null}).subscribe({next:()=>{this.attivitaForm.reset({titolo:'',descrizione:'',assegnatarioId:'',statoCodice:'DA_FARE',prioritaCodice:'NORMALE',dataScadenza:''});this.caricaRisorse(p.id);},error:x=>this.errore.set(this.messaggioErrore(x))});
  }
  completaAttivita(a:AttivitaPratica):void {
    const p=this.selezionata();if(!p)return;this.servizio.modificaAttivita(p.id,a.id,{...a,statoCodice:'COMPLETATA'}).subscribe({next:()=>this.caricaRisorse(p.id),error:x=>this.errore.set(this.messaggioErrore(x))});
  }
  creaComunicazione():void {
    const p=this.selezionata();if(!p||this.comunicazioneForm.invalid)return;const v=this.comunicazioneForm.getRawValue();
    this.servizio.creaComunicazione(p.id,{version:0,...v,dataComunicazione:new Date(v.dataComunicazione).toISOString()}).subscribe({next:()=>{this.comunicazioneForm.reset({tipo:'NOTA',oggetto:'',descrizione:'',dataComunicazione:new Date().toISOString().slice(0,16)});this.caricaRisorse(p.id);},error:x=>this.errore.set(this.messaggioErrore(x))});
  }
  salvaGiudiziari():void{const p=this.selezionata();if(!p||this.giudiziariForm.invalid)return;this.servizio.salvaDatiGiudiziari(p.id,this.giudiziariForm.getRawValue()).subscribe({next:x=>this.giudiziariForm.patchValue(x),error:r=>this.errore.set(this.messaggioErrore(r))});}
  salvaEconomia():void{const p=this.selezionata();if(!p||this.economiaForm.invalid)return;this.servizio.salvaEconomia(p.id,this.economiaForm.getRawValue()).subscribe({next:x=>this.economiaForm.patchValue(x),error:r=>this.errore.set(this.messaggioErrore(r))});}
  vai(delta:number):void{const n=this.pagina()+delta;if(n>=0&&n<this.pagineTotali()){this.pagina.set(n);this.carica();}}
  giorniScadenza(data:string|null):string{if(!data)return'—';const giorni=Math.ceil((new Date(data).getTime()-Date.now())/86400000);return giorni<0?`Scaduta da ${Math.abs(giorni)} gg`:giorni===0?'Oggi':`Tra ${giorni} gg`;}
  statoModificabile(p:Pratica):boolean{return p.statoCodice!=='ARCHIVIATA';}
  clientiBozza():number{return this.soggettiBozza().filter(s=>s.ruoloCodice==='CLIENTE').length;}

  private caricaRisorse(id:string):void {
    this.servizio.soggetti(id).subscribe({next:x=>this.soggetti.set(x),error:()=>this.avviso.set('Soggetti non disponibili.')});
    this.servizio.team(id).subscribe({next:x=>this.team.set(x),error:()=>this.avviso.set('Team non disponibile.')});
    this.servizio.documenti(id).subscribe({next:x=>this.documenti.set(x),error:()=>this.avviso.set('Documenti non disponibili.')});
    this.servizio.attivita(id).subscribe({next:x=>this.attivita.set(x),error:()=>this.avviso.set('Attività non disponibili.')});
    this.servizio.eventi(id).subscribe({next:x=>this.eventi.set(x),error:()=>this.avviso.set('Agenda non disponibile.')});
    this.servizio.comunicazioni(id).subscribe({next:x=>this.comunicazioni.set(x),error:()=>this.avviso.set('Comunicazioni non disponibili.')});
    this.servizio.timeline(id).subscribe({next:x=>this.timeline.set(x),error:()=>this.avviso.set('Timeline non disponibile.')});
    this.servizio.datiGiudiziari(id).subscribe({next:x=>this.giudiziariForm.patchValue(x),error:()=>this.avviso.set('Dati giudiziari non disponibili.')});
    this.servizio.economia(id).subscribe({next:x=>this.economiaForm.patchValue(x),error:()=>this.avviso.set('Dati economici non disponibili.')});
  }
  private impostaCataloghiPredefiniti():void {
    const c=this.cataloghi();if(!this.form.controls.materiaCodice.value&&c['materie']?.[0])this.form.controls.materiaCodice.setValue(c['materie'][0].codice);
    if(!this.form.controls.tipologiaCodice.value&&c['tipologie']?.[0])this.form.controls.tipologiaCodice.setValue(c['tipologie'][0].codice);
  }
  private messaggioErrore(r:any):string {
    const codice=r?.error?.code;
    const messaggi:Record<string,string>={
      PRATICA_CLIENTE_OBBLIGATORIO:'Per aprire la Pratica è necessario almeno un Cliente.',
      PRATICA_ULTIMO_CLIENTE_NON_RIMOVIBILE:'Non puoi rimuovere l’ultimo Cliente da una Pratica operativa.',
      PRATICA_VERSIONE_CONFLITTO:'La Pratica è stata modificata da un altro utente. Ricarica i dati.',
      PRATICA_ARCHIVIATA_NON_MODIFICABILE:'La Pratica archiviata è in sola lettura. Riaprila per modificarla.',
      PRATICA_TRANSIZIONE_NON_AMMESSA:'Questa transizione di stato non è ammessa.'
    };return messaggi[codice]??r?.error?.message??'Operazione non riuscita.';
  }
  private dataOggi():string{return new Date().toISOString().slice(0,10);}
  private ordinaPriorita(lista:PraticaSintetica[]):PraticaSintetica[] {
    const rango=(p:PraticaSintetica)=>{
      const giorni=p.prossimaScadenza?Math.ceil((new Date(p.prossimaScadenza).getTime()-Date.now())/86400000):9999;
      if(giorni<=7)return giorni;
      if(p.attivitaScadute>0)return 20;
      if(p.prioritaCodice==='URGENTE')return 30;
      if(p.prioritaCodice==='ALTA')return 40;
      if(p.statoCodice==='IN_ATTESA')return 50;
      return 100;
    };
    return [...lista].sort((a,b)=>rango(a)-rango(b)||b.aggiornatoIl.localeCompare(a.aggiornatoIl));
  }
}
