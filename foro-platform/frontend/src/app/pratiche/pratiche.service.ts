import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import {
  AttivitaPratica, CatalogoPratica, ComunicazionePratica, DocumentoPratica, EventoPratica, EventoTimeline,
  MembroTeam, Pagina, PersonaStudio, Pratica, PraticaSintetica, RelazioneSoggetto, RichiestaPratica
} from './pratiche.modelli';

@Injectable({providedIn:'root'})
export class PraticheService {
  private readonly base='/api/v1/pratiche';
  constructor(private readonly http:HttpClient){}
  cataloghi():Observable<Record<string,CatalogoPratica[]>> {
    return forkJoin({
      materie:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/materie`),
      tipologie:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/tipologie`),
      stati:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/stati`),
      priorita:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/priorita`),
      ruoliTeam:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/ruoli-team`),
      statiAttivita:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/stati-attivita`),
      prioritaAttivita:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/priorita-attivita`),
      categorieDocumenti:this.http.get<CatalogoPratica[]>(`${this.base}/cataloghi/categorie-documenti`),
      ruoliSoggetto:this.http.get<CatalogoPratica[]>('/api/v1/anagrafiche/cataloghi/ruoli-pratica')
    });
  }
  elenco(filtri:Record<string,string|number|boolean|undefined|null>={}):Observable<Pagina<PraticaSintetica>> {
    let params=new HttpParams();
    Object.entries(filtri).forEach(([chiave,valore])=>{if(valore!==undefined&&valore!==null&&valore!=='')params=params.set(chiave,String(valore));});
    return this.http.get<Pagina<PraticaSintetica>>(this.base,{params});
  }
  dettaglio(id:string):Observable<Pratica>{return this.http.get<Pratica>(`${this.base}/${id}`);}
  crea(r:RichiestaPratica):Observable<Pratica>{return this.http.post<Pratica>(this.base,r);}
  modifica(id:string,r:RichiestaPratica):Observable<Pratica>{return this.http.put<Pratica>(`${this.base}/${id}`,r);}
  elimina(id:string,version:number):Observable<void>{return this.http.delete<void>(`${this.base}/${id}`,{params:{version}});}
  transizione(id:string,azione:string,version:number):Observable<Pratica>{return this.http.post<Pratica>(`${this.base}/${id}/${azione}`,{version});}
  soggetti(id:string):Observable<RelazioneSoggetto[]>{return this.http.get<RelazioneSoggetto[]>(`${this.base}/${id}/soggetti`);}
  aggiungiSoggetto(id:string,r:object):Observable<RelazioneSoggetto>{return this.http.post<RelazioneSoggetto>(`${this.base}/${id}/soggetti`,r);}
  modificaSoggetto(id:string,relazioneId:string,version:number,r:object):Observable<RelazioneSoggetto>{return this.http.put<RelazioneSoggetto>(`${this.base}/${id}/soggetti/${relazioneId}`,r,{params:{version}});}
  rimuoviSoggetto(id:string,relazioneId:string):Observable<void>{return this.http.delete<void>(`${this.base}/${id}/soggetti/${relazioneId}`);}
  team(id:string):Observable<MembroTeam[]>{return this.http.get<MembroTeam[]>(`${this.base}/${id}/team`);}
  aggiungiTeam(id:string,r:object):Observable<MembroTeam>{return this.http.post<MembroTeam>(`${this.base}/${id}/team`,r);}
  rimuoviTeam(id:string,relazioneId:string):Observable<void>{return this.http.delete<void>(`${this.base}/${id}/team/${relazioneId}`);}
  documenti(id:string):Observable<DocumentoPratica[]>{return this.http.get<DocumentoPratica[]>(`${this.base}/${id}/documenti`);}
  caricaDocumento(id:string,dati:FormData):Observable<DocumentoPratica>{return this.http.post<DocumentoPratica>(`${this.base}/${id}/documenti`,dati);}
  eliminaDocumento(id:string,documentoId:string):Observable<void>{return this.http.delete<void>(`${this.base}/${id}/documenti/${documentoId}`);}
  downloadDocumento(id:string,documentoId:string):Observable<Blob>{return this.http.get(`${this.base}/${id}/documenti/${documentoId}/download`,{responseType:'blob'});}
  attivita(id:string):Observable<AttivitaPratica[]>{return this.http.get<AttivitaPratica[]>(`${this.base}/${id}/attivita`);}
  creaAttivita(id:string,r:object):Observable<AttivitaPratica>{return this.http.post<AttivitaPratica>(`${this.base}/${id}/attivita`,r);}
  modificaAttivita(id:string,attivitaId:string,r:object):Observable<AttivitaPratica>{return this.http.put<AttivitaPratica>(`${this.base}/${id}/attivita/${attivitaId}`,r);}
  eliminaAttivita(id:string,attivitaId:string):Observable<void>{return this.http.delete<void>(`${this.base}/${id}/attivita/${attivitaId}`);}
  eventi(id:string):Observable<EventoPratica[]>{return this.http.get<EventoPratica[]>(`${this.base}/${id}/eventi`);}
  comunicazioni(id:string):Observable<ComunicazionePratica[]>{return this.http.get<ComunicazionePratica[]>(`${this.base}/${id}/comunicazioni`);}
  creaComunicazione(id:string,r:object):Observable<ComunicazionePratica>{return this.http.post<ComunicazionePratica>(`${this.base}/${id}/comunicazioni`,r);}
  eliminaComunicazione(id:string,comunicazioneId:string):Observable<void>{return this.http.delete<void>(`${this.base}/${id}/comunicazioni/${comunicazioneId}`);}
  datiGiudiziari(id:string):Observable<Record<string,unknown>>{return this.http.get<Record<string,unknown>>(`${this.base}/${id}/dati-giudiziari`);}
  salvaDatiGiudiziari(id:string,r:object):Observable<Record<string,unknown>>{return this.http.put<Record<string,unknown>>(`${this.base}/${id}/dati-giudiziari`,r);}
  economia(id:string):Observable<Record<string,unknown>>{return this.http.get<Record<string,unknown>>(`${this.base}/${id}/economia`);}
  salvaEconomia(id:string,r:object):Observable<Record<string,unknown>>{return this.http.put<Record<string,unknown>>(`${this.base}/${id}/economia`,r);}
  timeline(id:string):Observable<EventoTimeline[]>{return this.http.get<EventoTimeline[]>(`${this.base}/${id}/timeline`);}
  personeStudio():Observable<PersonaStudio[]>{return this.http.get<PersonaStudio[]>('/api/v1/calendario/persone');}
}
