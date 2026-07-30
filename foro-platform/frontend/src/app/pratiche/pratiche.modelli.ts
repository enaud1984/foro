export interface CatalogoPratica {
  codice: string;
  descrizione: string;
  ordine: number;
  materiaCodice?: string | null;
  configurato?: boolean;
  formato?: string | null;
}
export interface Pagina<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }
export interface PraticaSintetica {
  id:string; codice:string; titolo:string; materiaCodice:string; tipologiaCodice:string; statoCodice:string;
  prioritaCodice:string; responsabileId:string; responsabileNome:string; riservata:boolean; dataApertura:string;
  aggiornatoIl:string; prossimaScadenza:string|null; attivitaScadute:number; clienti:string; controparti:string;
}
export interface Pratica extends PraticaSintetica {
  descrizione:string|null; valoreEconomico:number|null; valuta:string; dataDefinizione:string|null;
  dataArchiviazione:string|null; motivoAttesa:string|null; noteInterne:string|null; version:number; creatoIl:string;
}
export interface RelazioneSoggetto {
  id:string; soggettoId:string; ruoloCodice:string; principale:boolean; descrizioneRuoloAltro:string|null;
  note:string|null; version:number; nomeVisualizzato:string; tipoCodice:string;
}
export interface MembroTeam { id:string; utenteId:string; ruoloTeamCodice:string; principale:boolean; nomeVisualizzato:string; }
export interface DocumentoPratica {
  id:string; categoriaCodice:string; titolo:string; nomeFile:string; mimeType:string; dimensione:number;
  versioneNumero:number; statoDocumento:string; origine:string; templateCodice:string|null; soggettoId:string|null;
  creatoIl:string; aggiornatoIl:string;
}
export interface AttivitaPratica {
  id:string; titolo:string; descrizione:string|null; assegnatarioId:string|null; statoCodice:string;
  prioritaCodice:string; dataScadenza:string|null; completataIl:string|null; eventoCalendarioId:string|null;
  version:number; aggiornatoIl:string;
}
export interface EventoPratica {
  id:string; calendarioId:string; calendarioNome:string; titolo:string; inizio:string; fine:string;
  categoria:string|null; statoDisponibilita:string; ricorrenza:string;
}
export interface ComunicazionePratica {
  id:string; tipo:string; oggetto:string; descrizione:string|null; dataComunicazione:string; autoreId:string; version:number;
}
export interface EventoTimeline {
  id:string; tipoEvento:string; titolo:string; descrizioneSintetica:string|null; actorId:string|null;
  entitaTipo:string|null; entitaId:string|null; avvenutoIl:string;
}
export interface RichiestaPratica {
  version:number; titolo:string; descrizione:string|null; materiaCodice:string; tipologiaCodice:string;
  prioritaCodice:string; responsabileId:string; valoreEconomico:number|null; valuta:string; riservata:boolean;
  dataApertura:string; motivoAttesa:string|null; noteInterne:string|null; stato?:string;
  soggetti?:Array<{soggettoId:string;ruoloCodice:string;principale:boolean;descrizioneRuoloAltro?:string|null;note?:string|null}>;
  team?:Array<{utenteId:string;ruoloTeamCodice:string;principale:boolean}>;
}
export interface PersonaStudio { id:string; nome:string; }
