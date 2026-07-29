import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogoAnagrafica, DocumentoAnagrafica, EventoTimelineAnagrafica, GruppoDocumentiPratica,
  OpzioniScheda, Pagina, PraticaCollegataAnagrafica, RichiestaSoggetto, SchedaStampabile, Soggetto } from './anagrafiche.modelli';

@Injectable({ providedIn: 'root' })
export class AnagraficheService {
  private readonly base = '/api/v1/anagrafiche';
  constructor(private readonly http: HttpClient) {}
  elenco(ricerca = '', tipo = '', stato = '', pagina = 0, dimensione = 20): Observable<Pagina<Soggetto>> {
    let params = new HttpParams().set('pagina', pagina).set('dimensione', dimensione);
    if (ricerca.trim()) params = params.set('ricerca', ricerca.trim());
    if (tipo) params = params.set('tipo', tipo);
    if (stato) params = params.set('stato', stato);
    return this.http.get<Pagina<Soggetto>>(this.base, { params });
  }
  dettaglio(id: string): Observable<Soggetto> { return this.http.get<Soggetto>(`${this.base}/${id}`); }
  crea(richiesta: RichiestaSoggetto): Observable<Soggetto> { return this.http.post<Soggetto>(this.base, richiesta); }
  modifica(id: string, richiesta: RichiestaSoggetto): Observable<Soggetto> { return this.http.put<Soggetto>(`${this.base}/${id}`, richiesta); }
  elimina(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
  duplicati(richiesta: RichiestaSoggetto): Observable<Array<{id:string;nomeVisualizzato:string;tipoCodice:string;stato:string}>> {
    return this.http.post<Array<{id:string;nomeVisualizzato:string;tipoCodice:string;stato:string}>>(`${this.base}/verifica-duplicati`, richiesta);
  }
  tipi(): Observable<CatalogoAnagrafica[]> { return this.http.get<CatalogoAnagrafica[]>(`${this.base}/cataloghi/tipi-soggetto`); }
  pratiche(id:string):Observable<PraticaCollegataAnagrafica[]> {
    return this.http.get<PraticaCollegataAnagrafica[]>(`${this.base}/${id}/pratiche`);
  }
  categorieDocumenti():Observable<CatalogoAnagrafica[]> { return this.http.get<CatalogoAnagrafica[]>(`${this.base}/cataloghi/categorie-documenti`); }
  documenti(id:string,filtri:{ricerca?:string;categoria?:string;origine?:string;ambito?:string;pagina?:number;dimensione?:number}={}):Observable<Pagina<DocumentoAnagrafica>> {
    let params=new HttpParams().set('pagina',filtri.pagina??0).set('dimensione',filtri.dimensione??50).set('ambito',filtri.ambito??'TUTTI');
    if(filtri.ricerca)params=params.set('ricerca',filtri.ricerca);if(filtri.categoria)params=params.set('categoria',filtri.categoria);
    if(filtri.origine)params=params.set('origine',filtri.origine);
    return this.http.get<Pagina<DocumentoAnagrafica>>(`${this.base}/${id}/documenti`,{params});
  }
  documentiPratiche(id:string):Observable<GruppoDocumentiPratica[]>{return this.http.get<GruppoDocumentiPratica[]>(`${this.base}/${id}/documenti-pratiche`);}
  caricaDocumento(id:string,dati:{file:File;titolo:string;categoria:string;dataDocumento?:string;note?:string}):Observable<DocumentoAnagrafica>{
    const form=new FormData();form.append('file',dati.file);form.append('titolo',dati.titolo);form.append('categoria',dati.categoria);
    if(dati.dataDocumento)form.append('dataDocumento',dati.dataDocumento);if(dati.note)form.append('note',dati.note);
    return this.http.post<DocumentoAnagrafica>(`${this.base}/${id}/documenti`,form);
  }
  modificaDocumento(id:string,documentoId:string,dati:Partial<DocumentoAnagrafica>):Observable<DocumentoAnagrafica>{
    return this.http.put<DocumentoAnagrafica>(`${this.base}/${id}/documenti/${documentoId}`,{
      version:dati.version,titolo:dati.titolo,categoriaCodice:dati.categoriaCodice,dataDocumento:dati.dataDocumento,note:dati.note
    });
  }
  eliminaDocumento(id:string,d:DocumentoAnagrafica):Observable<void>{
    return this.http.delete<void>(`${this.base}/${id}/documenti/${d.id}`,{params:{version:d.version}});
  }
  scaricaDocumento(id:string,documentoId:string,inline=false):Observable<Blob>{
    return this.http.get(`${this.base}/${id}/documenti/${documentoId}/download`,{params:{inline},responseType:'blob'});
  }
  timeline(id:string):Observable<EventoTimelineAnagrafica[]>{return this.http.get<EventoTimelineAnagrafica[]>(`${this.base}/${id}/timeline`);}
  stampaScheda(id:string,opzioni:OpzioniScheda):Observable<SchedaStampabile>{return this.http.post<SchedaStampabile>(`${this.base}/${id}/stampa-scheda`,opzioni);}
  generaDocumento(id:string,codice:string,praticaId:string|null,opzioni:OpzioniScheda):Observable<SchedaStampabile>{
    return this.http.post<SchedaStampabile>(`${this.base}/${id}/genera-documento`,{codice,praticaId,opzioni});
  }
}
