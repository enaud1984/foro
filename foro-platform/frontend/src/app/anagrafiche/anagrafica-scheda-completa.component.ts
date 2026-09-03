import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CatalogoAnagrafica, DocumentoAnagrafica, EventoTimelineAnagrafica, OpzioniScheda,
  PraticaCollegataAnagrafica, SchedaStampabile, Soggetto } from './anagrafiche.modelli';
import { AnagraficheService } from './anagrafiche.service';
import { IconaForoComponent } from '../shared/icona-foro.component';

@Component({
  selector:'app-anagrafica-scheda-completa',
  standalone:true,
  imports:[CommonModule,ReactiveFormsModule,IconaForoComponent],
  templateUrl:'./anagrafica-scheda-completa.component.html',
  styleUrl:'./anagrafica-scheda-completa.component.scss'
})
export class AnagraficaSchedaCompletaComponent implements OnInit,OnDestroy {
  private readonly servizio=inject(AnagraficheService);
  private readonly fb=inject(FormBuilder);
  private readonly sanificatore=inject(DomSanitizer);
  @Input({required:true}) soggetto!:Soggetto;
  @Input() tipi:CatalogoAnagrafica[]=[];
  @Input() azioneIniziale:'anagrafica'|'pratiche'|'genera'|'stampa'|null=null;
  @Output() chiudi=new EventEmitter<void>();
  @Output() modifica=new EventEmitter<Soggetto>();
  @Output() apriPratica=new EventEmitter<string>();

  readonly sezione=signal<'riepilogo'|'dati'|'recapiti'|'pratiche'|'documenti'|'timeline'>('riepilogo');
  readonly pratiche=signal<PraticaCollegataAnagrafica[]>([]);
  readonly documenti=signal<DocumentoAnagrafica[]>([]);
  readonly timeline=signal<EventoTimelineAnagrafica[]>([]);
  readonly categorie=signal<CatalogoAnagrafica[]>([]);
  readonly caricamento=signal(true);
  readonly errore=signal('');
  readonly menuDocumenti=signal(false);
  readonly uploadAperto=signal(false);
  readonly stampaAperta=signal(false);
  readonly generaAperto=signal(false);
  readonly anteprima=signal<DocumentoAnagrafica|null>(null);
  readonly anteprimaUrl=signal<string|null>(null);
  readonly anteprimaPdfUrl=signal<SafeResourceUrl|null>(null);
  readonly anteprimaErrore=signal('');
  readonly schedaStampabile=signal<SchedaStampabile|null>(null);
  readonly selezionati=signal<Set<string>>(new Set());
  readonly file=signal<File|null>(null);
  readonly invio=signal(false);
  readonly filtroAmbito=this.fb.nonNullable.control<'ANAGRAFICA'|'PRATICHE'|'TUTTI'>('TUTTI');
  readonly ricercaDocumenti=this.fb.nonNullable.control('');
  readonly filtroCategoria=this.fb.nonNullable.control('');
  readonly filtroOrigine=this.fb.nonNullable.control('');
  readonly uploadForm=this.fb.nonNullable.group({
    titolo:['',Validators.required],categoria:['DOCUMENTO_IDENTITA',Validators.required],dataDocumento:[''],note:['',Validators.maxLength(1000)]
  });
  readonly opzioniForm=this.fb.nonNullable.group({
    datiGenerali:[true],recapiti:[true],indirizzo:[true],pratiche:[true],elencoDocumenti:[false],noteInterne:[false]
  });
  readonly templateForm=this.fb.nonNullable.group({codice:['SCHEDA_ANAGRAFICA',Validators.required],praticaId:['']});

  ngOnInit():void{
    this.filtroAmbito.valueChanges.subscribe(()=>this.caricaDocumenti());
    this.ricercaDocumenti.valueChanges.subscribe(()=>this.caricaDocumenti());
    this.filtroCategoria.valueChanges.subscribe(()=>this.caricaDocumenti());
    this.filtroOrigine.valueChanges.subscribe(()=>this.caricaDocumenti());
    this.caricaTutto();
    if(this.azioneIniziale)this.apriDocumenti(this.azioneIniziale);
  }
  ngOnDestroy():void{this.revocaAnteprima();}
  @HostListener('document:keydown.escape') gestisciEscape():void{
    if(this.anteprima()){this.chiudiAnteprima();return;}if(this.schedaStampabile()){this.chiudiSchedaStampabile();return;}
    if(this.uploadAperto()){this.annullaUpload();return;}if(this.stampaAperta()){this.annullaStampa();return;}
    if(this.generaAperto()){this.generaAperto.set(false);return;}if(this.menuDocumenti()){this.menuDocumenti.set(false);return;}
  }
  caricaTutto():void{
    this.caricamento.set(true);this.errore.set('');
    this.servizio.pratiche(this.soggetto.id).subscribe({next:v=>this.pratiche.set(v),error:()=>this.errore.set('Pratiche collegate non disponibili.')});
    this.servizio.categorieDocumenti().subscribe({next:v=>this.categorie.set(v),error:()=>this.errore.set('Categorie documentali non disponibili.')});
    this.servizio.timeline(this.soggetto.id).subscribe({next:v=>this.timeline.set(v),error:()=>this.timeline.set([])});
    this.caricaDocumenti();
  }
  caricaDocumenti():void{
    this.servizio.documenti(this.soggetto.id,{ricerca:this.ricercaDocumenti.value,categoria:this.filtroCategoria.value,
      origine:this.filtroOrigine.value,ambito:this.filtroAmbito.value,dimensione:100}).subscribe({
      next:p=>{this.documenti.set(p.content);this.caricamento.set(false);},
      error:r=>{this.errore.set(r?.status===404?'Anagrafica non trovata.':'Documenti non disponibili.');this.caricamento.set(false);}
    });
  }
  nome():string{return this.soggetto.denominazione||`${this.soggetto.nome??''} ${this.soggetto.cognome??''}`.trim();}
  tipo():string{return this.tipi.find(t=>t.codice===this.soggetto.tipoCodice)?.descrizione??this.soggetto.tipoCodice.replaceAll('_',' ');}
  codiceFiscaleMascherato():string{
    const valore=this.soggetto.codiceFiscale;if(!valore)return '—';return `${'•'.repeat(Math.max(0,valore.length-4))}${valore.slice(-4)}`;
  }
  indirizzo():string{return [this.soggetto.indirizzo,this.soggetto.civico,this.soggetto.cap,this.soggetto.comune,this.soggetto.provincia,this.soggetto.statoIndirizzo].filter(Boolean).join(' ');}
  documentiAnagrafici():number{return this.documenti().filter(d=>!d.praticaId).length;}
  documentiPratica():number{return this.documenti().filter(d=>!!d.praticaId).length;}
  apriDocumenti(azione:'upload'|'anagrafica'|'pratiche'|'genera'|'stampa'):void{
    this.menuDocumenti.set(false);
    if(azione==='upload'){this.sezione.set('documenti');this.uploadAperto.set(true);this.filtroAmbito.setValue('ANAGRAFICA');}
    if(azione==='anagrafica'){this.sezione.set('documenti');this.filtroAmbito.setValue('ANAGRAFICA');}
    if(azione==='pratiche'){this.sezione.set('documenti');this.filtroAmbito.setValue('PRATICHE');}
    if(azione==='genera')this.generaAperto.set(true);
    if(azione==='stampa')this.stampaAperta.set(true);
  }
  scegliFile(evento:Event):void{
    const f=(evento.target as HTMLInputElement).files?.[0]??null;this.file.set(f);
    if(f&&!this.uploadForm.controls.titolo.value)this.uploadForm.controls.titolo.setValue(f.name.replace(/\.[^.]+$/,''));
  }
  carica():void{
    const file=this.file(),v=this.uploadForm.getRawValue();if(!file||this.uploadForm.invalid||this.invio())return;this.invio.set(true);
    this.servizio.caricaDocumento(this.soggetto.id,{file,titolo:v.titolo,categoria:v.categoria,dataDocumento:v.dataDocumento||undefined,note:v.note||undefined}).subscribe({
      next:()=>{this.invio.set(false);this.uploadAperto.set(false);this.file.set(null);this.uploadForm.reset({titolo:'',categoria:'DOCUMENTO_IDENTITA',dataDocumento:'',note:''});this.caricaDocumenti();this.aggiornaTimeline();},
      error:r=>{this.invio.set(false);this.errore.set(this.messaggioErrore(r));}
    });
  }
  annullaUpload():void{if((this.uploadForm.dirty||this.file())&&!confirm('Annullare il caricamento e perdere i dati inseriti?'))return;this.uploadAperto.set(false);}
  annullaStampa():void{this.stampaAperta.set(false);if(this.azioneIniziale==='stampa')this.chiudi.emit();}
  modificaMetadati(d:DocumentoAnagrafica):void{
    if(d.praticaId)return;
    const titolo=prompt('Titolo documento',d.titolo);if(!titolo)return;
    this.servizio.modificaDocumento(this.soggetto.id,d.id,{...d,titolo}).subscribe({next:()=>{this.caricaDocumenti();this.aggiornaTimeline();},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  eliminaDocumento(d:DocumentoAnagrafica):void{
    if(d.praticaId||!confirm(`Eliminare logicamente ${d.titolo}?`))return;
    this.servizio.eliminaDocumento(this.soggetto.id,d).subscribe({next:()=>{this.caricaDocumenti();this.aggiornaTimeline();},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  scarica(d:DocumentoAnagrafica):void{
    this.servizio.scaricaDocumento(this.soggetto.id,d.id).subscribe({next:b=>{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=d.nomeFile;a.click();URL.revokeObjectURL(u);},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  apriAnteprima(d:DocumentoAnagrafica):void{
    this.revocaAnteprima();this.anteprima.set(d);this.anteprimaErrore.set('');
    if(!this.visualizzabile(d)){this.anteprimaErrore.set('Anteprima non disponibile per questo formato. Puoi scaricare il documento.');return;}
    this.servizio.scaricaDocumento(this.soggetto.id,d.id,true).subscribe({next:b=>{const url=URL.createObjectURL(b);this.anteprimaUrl.set(url);if(d.mimeType==='application/pdf')this.anteprimaPdfUrl.set(this.sanificatore.bypassSecurityTrustResourceUrl(url));},error:()=>this.anteprimaErrore.set('Anteprima non disponibile.')});
  }
  chiudiAnteprima():void{this.revocaAnteprima();this.anteprima.set(null);}
  visualizzabile(d:DocumentoAnagrafica):boolean{return ['application/pdf','image/png','image/jpeg'].includes(d.mimeType);}
  stampabile(d:DocumentoAnagrafica):boolean{return this.visualizzabile(d);}
  stampaDocumento():void{if(this.anteprima()&&this.stampabile(this.anteprima()!))window.print();}
  seleziona(d:DocumentoAnagrafica,attivo:boolean):void{const s=new Set(this.selezionati());attivo?s.add(d.id):s.delete(d.id);this.selezionati.set(s);}
  selezionaTutti(attivo:boolean):void{this.selezionati.set(attivo?new Set(this.documenti().map(d=>d.id)):new Set());}
  gruppiDocumenti():Array<{id:string;codice:string;titolo:string;stato:string;documenti:DocumentoAnagrafica[]}>{
    const gruppi=new Map<string,{id:string;codice:string;titolo:string;stato:string;documenti:DocumentoAnagrafica[]}>();
    for(const d of this.documenti().filter(x=>!!x.praticaId)){const id=d.praticaId!;if(!gruppi.has(id))gruppi.set(id,{id,codice:d.praticaCodice??'',titolo:d.praticaTitolo??'',stato:d.praticaStato??'',documenti:[]});gruppi.get(id)!.documenti.push(d);}
    return [...gruppi.values()].sort((a,b)=>a.codice.localeCompare(b.codice));
  }
  generaScheda():void{
    this.servizio.stampaScheda(this.soggetto.id,this.opzioni()).subscribe({next:s=>{this.schedaStampabile.set(s);this.stampaAperta.set(false);this.aggiornaTimeline();},error:r=>this.errore.set(this.messaggioErrore(r))});
  }
  generaTemplate():void{
    const v=this.templateForm.getRawValue();
    this.servizio.generaDocumento(this.soggetto.id,v.codice,v.praticaId||null,this.opzioni()).subscribe({
      next:s=>{this.schedaStampabile.set(s);this.generaAperto.set(false);this.aggiornaTimeline();},
      error:r=>this.errore.set(this.messaggioErrore(r))
    });
  }
  stampaScheda():void{window.print();}
  chiudiSchedaStampabile():void{this.schedaStampabile.set(null);}
  opzioni():OpzioniScheda{return this.opzioniForm.getRawValue();}
  valoreScheda(chiave:string):unknown{return this.schedaStampabile()?.soggetto[chiave]??'—';}
  private aggiornaTimeline():void{this.servizio.timeline(this.soggetto.id).subscribe(v=>this.timeline.set(v));}
  private revocaAnteprima():void{const u=this.anteprimaUrl();if(u)URL.revokeObjectURL(u);this.anteprimaUrl.set(null);this.anteprimaPdfUrl.set(null);}
  private messaggioErrore(r:any):string{
    const codice=r?.error?.code??r?.error?.message;
    const messaggi:Record<string,string>={
      DOCUMENTO_ANAGRAFICA_TROPPO_GRANDE:'Il documento supera il limite di 25 MiB.',
      DOCUMENTO_ANAGRAFICA_TIPO_NON_AMMESSO:'Formato o contenuto del documento non ammesso.',
      TEMPLATE_RICHIEDE_PRATICA:'Seleziona una Pratica collegata.',
      TEMPLATE_NON_CONFIGURATO:'Il template è predisposto ma non ancora configurato.',
      ANAGRAFICA_VERSIONE_CONFLITTO:'Il documento è stato modificato da un altro utente.'
    };return messaggi[codice]??'Operazione non riuscita.';
  }
}
