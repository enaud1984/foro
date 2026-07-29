export type TipoSoggetto =
  | 'PERSONA_FISICA' | 'PERSONA_GIURIDICA' | 'DITTA_INDIVIDUALE'
  | 'ENTE_ASSOCIAZIONE' | 'CONDOMINIO' | 'PUBBLICA_AMMINISTRAZIONE' | 'ALTRO';
export type StatoSoggetto = 'ATTIVO' | 'DISATTIVATO';

export interface CatalogoAnagrafica { codice: string; descrizione: string; ordine: number; }
export interface Pagina<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }
export interface Soggetto {
  id: string; tipoCodice: TipoSoggetto; nome: string | null; cognome: string | null;
  dataNascita: string | null; luogoNascita: string | null; provinciaNascita: string | null; statoNascita: string | null;
  denominazione: string | null; formaGiuridica: string | null; codiceFiscale: string | null; partitaIva: string | null;
  email: string | null; pec: string | null; telefono: string | null; cellulare: string | null;
  indirizzo: string | null; civico: string | null; cap: string | null; comune: string | null;
  provincia: string | null; statoIndirizzo: string | null; note: string | null;
  stato: StatoSoggetto; version: number; creatoIl: string; aggiornatoIl: string;
}
export type RichiestaSoggetto = Omit<Soggetto, 'id' | 'creatoIl' | 'aggiornatoIl'> & { id?: string };

export interface PraticaCollegataAnagrafica {
  id:string; codice:string; titolo:string; statoCodice:string; materiaCodice:string; ruoloCodice:string;
  responsabileId:string; responsabileNome:string; dataApertura:string; prossimaScadenza:string|null;
}
export interface DocumentoAnagrafica {
  id:string; praticaId:string|null; soggettoId:string|null; categoriaCodice:string; titolo:string; nomeFile:string;
  mimeType:string; dimensione:number; origine:'UPLOAD'|'TEMPLATE'|'GENERATO'; templateCodice:string|null;
  dataDocumento:string|null; note:string|null; version:number; caricatoDa:string; autore:string;
  creatoIl:string; aggiornatoIl:string; praticaCodice:string|null; praticaTitolo:string|null; praticaStato:string|null;
}
export interface GruppoDocumentiPratica {
  praticaId:string; praticaCodice:string; praticaTitolo:string; praticaStato:string; ruolo:string;
  documenti:Array<Pick<DocumentoAnagrafica,'id'|'titolo'|'categoriaCodice'|'nomeFile'|'mimeType'|'dimensione'|'origine'|'creatoIl'>>;
}
export interface EventoTimelineAnagrafica { id:string; azione:string; avvenutoIl:string; autoreId:string; }
export interface OpzioniScheda {
  datiGenerali:boolean; recapiti:boolean; indirizzo:boolean; pratiche:boolean; elencoDocumenti:boolean; noteInterne:boolean;
}
export interface SchedaStampabile {
  studio:Record<string,unknown>; soggetto:Record<string,unknown>; pratiche:Array<Record<string,unknown>>;
  documenti:Array<Record<string,unknown>>; opzioni:OpzioniScheda; generataIl:string;
}
