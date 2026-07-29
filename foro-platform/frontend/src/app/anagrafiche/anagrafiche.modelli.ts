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
