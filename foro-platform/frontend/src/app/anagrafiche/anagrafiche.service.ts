import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogoAnagrafica, Pagina, RichiestaSoggetto, Soggetto } from './anagrafiche.modelli';

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
}
