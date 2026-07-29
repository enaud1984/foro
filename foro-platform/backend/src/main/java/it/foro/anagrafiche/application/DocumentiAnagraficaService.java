package it.foro.anagrafiche.application;

import it.foro.anagrafiche.domain.Soggetto;
import it.foro.anagrafiche.repository.SoggettoRepository;
import it.foro.platform.security.TenantContext;
import it.foro.pratiche.application.ArchivioDocumentiPratica;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DocumentiAnagraficaService {
  private static final Set<String> ORIGINI = Set.of("UPLOAD", "TEMPLATE", "GENERATO");
  private static final Set<String> AMBITI = Set.of("ANAGRAFICA", "PRATICHE", "TUTTI");
  private static final Set<String> TEMPLATE_PRATICA = Set.of("LETTERA_INCARICO", "PREVENTIVO", "PROCURA_LITI");
  private final JdbcTemplate database;
  private final TenantContext tenant;
  private final SoggettoRepository soggetti;
  private final ArchivioDocumentiPratica archivio;

  public DocumentiAnagraficaService(JdbcTemplate database, TenantContext tenant, SoggettoRepository soggetti,
    ArchivioDocumentiPratica archivio) {
    this.database = database; this.tenant = tenant; this.soggetti = soggetti; this.archivio = archivio;
  }

  public record PaginaDocumenti(List<Map<String,Object>> content, long totalElements, int totalPages, int number, int size) {}
  public record DownloadDocumento(String nomeFile, String mimeType, byte[] contenuto, boolean anteprima, boolean stampabile) {}
  public record OpzioniScheda(boolean datiGenerali, boolean recapiti, boolean indirizzo, boolean pratiche,
    boolean elencoDocumenti, boolean noteInterne) {}
  public record SchedaStampabile(Map<String,Object> studio, Map<String,Object> soggetto,
    List<Map<String,Object>> pratiche, List<Map<String,Object>> documenti, OpzioniScheda opzioni, Instant generataIl) {}

  @Transactional(readOnly = true)
  public PaginaDocumenti elenco(UUID soggettoId, String ricerca, String categoria, String origine, String ambito,
    int pagina, int dimensione, String direzione) {
    trovaSoggetto(soggettoId);
    var ambitoValido = ambito == null ? "TUTTI" : ambito.toUpperCase(Locale.ROOT);
    if (!AMBITI.contains(ambitoValido) || origine != null && !ORIGINI.contains(origine)) {
      throw errore(HttpStatus.BAD_REQUEST, "DOCUMENTO_ANAGRAFICA_NON_VALIDO");
    }
    var parametri = new ArrayList<Object>();
    var dove = new StringBuilder(" WHERE d.studio_id=? AND d.eliminato_il IS NULL ");
    parametri.add(tenant.studioId());
    aggiungiAmbito(dove, parametri, soggettoId, ambitoValido);
    if (ricerca != null && !ricerca.isBlank()) {
      dove.append(" AND (LOWER(d.titolo) LIKE ? OR LOWER(d.nome_file) LIKE ?) ");
      var testo = "%" + ricerca.trim().toLowerCase(Locale.ROOT) + "%"; parametri.add(testo); parametri.add(testo);
    }
    if (categoria != null && !categoria.isBlank()) { dove.append(" AND d.categoria_codice=? "); parametri.add(categoria); }
    if (origine != null && !origine.isBlank()) { dove.append(" AND d.origine=? "); parametri.add(origine); }
    var totale = database.queryForObject("SELECT COUNT(*) FROM documento_pratica d" + dove, Long.class, parametri.toArray());
    parametri.add(dimensione); parametri.add((long) pagina * dimensione);
    var ordine = "asc".equalsIgnoreCase(direzione) ? "ASC" : "DESC";
    var righe = database.queryForList("""
      SELECT d.id,d.pratica_id AS "praticaId",d.soggetto_id AS "soggettoId",d.categoria_codice AS "categoriaCodice",
      d.titolo,d.nome_file AS "nomeFile",d.mime_type AS "mimeType",d.dimensione,d.origine,d.template_codice AS "templateCodice",
      d.data_documento AS "dataDocumento",d.note,d.version,d.caricato_da AS "caricatoDa",
      u.display_name AS "autore",d.creato_il AS "creatoIl",d.aggiornato_il AS "aggiornatoIl",
      p.codice AS "praticaCodice",p.titolo AS "praticaTitolo",p.stato_codice AS "praticaStato"
      FROM documento_pratica d
      LEFT JOIN pratica p ON p.id=d.pratica_id
      LEFT JOIN user_account u ON u.id=d.caricato_da
      """ + dove + " ORDER BY d.aggiornato_il " + ordine + ",d.id LIMIT ? OFFSET ?", parametri.toArray());
    var n = totale == null ? 0 : totale;
    return new PaginaDocumenti(righe, n, (int)Math.ceil((double)n / dimensione), pagina, dimensione);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> documentiPratiche(UUID soggettoId) {
    trovaSoggetto(soggettoId);
    var pratiche = database.queryForList("""
      SELECT p.id AS "praticaId",p.codice AS "praticaCodice",p.titolo AS "praticaTitolo",p.stato_codice AS "praticaStato",
      STRING_AGG(DISTINCT ps.ruolo_codice,', ' ORDER BY ps.ruolo_codice) AS ruolo
      FROM pratica_soggetto ps
      JOIN pratica p ON p.id=ps.pratica_id AND p.studio_id=ps.studio_id
      WHERE ps.studio_id=? AND ps.soggetto_id=? AND ps.eliminato_il IS NULL AND p.eliminato_il IS NULL
      AND (? OR p.riservata=FALSE OR p.responsabile_id=? OR EXISTS (
        SELECT 1 FROM pratica_utente pu WHERE pu.pratica_id=p.id AND pu.utente_id=? AND pu.eliminato_il IS NULL))
      GROUP BY p.id,p.codice,p.titolo,p.stato_codice ORDER BY p.aggiornato_il DESC
      """, tenant.studioId(), soggettoId, amministratore(), tenant.userId(), tenant.userId());
    pratiche.forEach(p -> p.put("documenti", database.queryForList("""
      SELECT id,titolo,categoria_codice AS "categoriaCodice",nome_file AS "nomeFile",mime_type AS "mimeType",
      dimensione,origine,creato_il AS "creatoIl" FROM documento_pratica
      WHERE studio_id=? AND pratica_id=? AND eliminato_il IS NULL ORDER BY aggiornato_il DESC
      """, tenant.studioId(), p.get("praticaId"))));
    return pratiche;
  }

  @Transactional
  public Map<String,Object> carica(UUID soggettoId, String categoria, String titolo, LocalDate dataDocumento,
    String note, MultipartFile file) {
    trovaSoggetto(soggettoId); validaCategoria(categoria);
    ArchivioDocumentiPratica.DocumentoSalvato salvato;
    try { salvato = archivio.salva(tenant.studioId(), soggettoId, file); }
    catch (IllegalArgumentException e) { throw traduciArchivio(e); }
    var id = UUID.randomUUID();
    database.update("""
      INSERT INTO documento_pratica(id,studio_id,pratica_id,soggetto_id,categoria_codice,titolo,nome_file,mime_type,
      dimensione,percorso_storage,checksum_sha256,versione_numero,stato_documento,origine,template_codice,caricato_da,
      creato_il,aggiornato_il,data_documento,note,version)
      VALUES (?,?,NULL,?,?,?,?,?,?,?,?,1,'DISPONIBILE','UPLOAD',NULL,?,NOW(),NOW(),?,?,0)
      """, id, tenant.studioId(), soggettoId, categoria, pulisciObbligatorio(titolo), salvato.nomeFile(),
      salvato.mimeType(), salvato.dimensione(), salvato.percorso(), salvato.checksum(), tenant.userId(), dataDocumento, pulisci(note));
    audit("DOCUMENTO_ANAGRAFICA_CARICATO", soggettoId);
    return documento(soggettoId, id, false);
  }

  @Transactional(readOnly = true)
  public Map<String,Object> documento(UUID soggettoId, UUID documentoId, boolean percorso) {
    trovaSoggetto(soggettoId);
    var righe = database.queryForList("""
      SELECT d.id,d.pratica_id AS "praticaId",d.soggetto_id AS "soggettoId",d.categoria_codice AS "categoriaCodice",
      d.titolo,d.nome_file AS "nomeFile",d.mime_type AS "mimeType",d.dimensione,d.origine,
      d.template_codice AS "templateCodice",d.data_documento AS "dataDocumento",d.note,d.version,
      d.creato_il AS "creatoIl",d.aggiornato_il AS "aggiornatoIl" """ + (percorso ? ",d.percorso_storage AS \"percorsoStorage\" " : " ") + """
      FROM documento_pratica d
      LEFT JOIN pratica p ON p.id=d.pratica_id
      WHERE d.id=? AND d.studio_id=? AND d.eliminato_il IS NULL AND (
        (d.pratica_id IS NULL AND d.soggetto_id=?) OR
        (d.pratica_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM pratica_soggetto ps WHERE ps.pratica_id=d.pratica_id AND ps.soggetto_id=?
          AND ps.studio_id=d.studio_id AND ps.eliminato_il IS NULL)
          AND p.eliminato_il IS NULL
          AND (? OR p.riservata=FALSE OR p.responsabile_id=? OR EXISTS (
            SELECT 1 FROM pratica_utente pu WHERE pu.pratica_id=p.id AND pu.utente_id=? AND pu.eliminato_il IS NULL)))
      )
      """, documentoId, tenant.studioId(), soggettoId, soggettoId, amministratore(), tenant.userId(), tenant.userId());
    if (righe.isEmpty()) throw errore(HttpStatus.NOT_FOUND, "DOCUMENTO_ANAGRAFICA_NON_TROVATO");
    return righe.getFirst();
  }

  @Transactional(readOnly = true)
  public DownloadDocumento scarica(UUID soggettoId, UUID documentoId) {
    var d = documento(soggettoId, documentoId, true);
    var percorso = (String)d.get("percorsoStorage");
    if (percorso == null) throw errore(HttpStatus.NOT_FOUND, "DOCUMENTO_ANAGRAFICA_NON_TROVATO");
    var mime = (String)d.get("mimeType");
    var anteprima = Set.of("application/pdf","image/png","image/jpeg").contains(mime);
    try {
      return new DownloadDocumento((String)d.get("nomeFile"), mime, archivio.leggi(percorso), anteprima, anteprima);
    } catch (IllegalArgumentException | IllegalStateException e) {
      throw errore(HttpStatus.NOT_FOUND, "DOCUMENTO_ANAGRAFICA_NON_TROVATO");
    }
  }

  @Transactional
  public Map<String,Object> modifica(UUID soggettoId, UUID documentoId, long version, String titolo, String categoria,
    LocalDate dataDocumento, String note) {
    var d = documentoDiretto(soggettoId, documentoId);
    if (((Number)d.get("version")).longValue() != version) {
      throw errore(HttpStatus.PRECONDITION_FAILED, "ANAGRAFICA_VERSIONE_CONFLITTO");
    }
    validaCategoria(categoria);
    database.update("""
      UPDATE documento_pratica SET titolo=?,categoria_codice=?,data_documento=?,note=?,version=version+1,aggiornato_il=NOW()
      WHERE id=? AND studio_id=? AND soggetto_id=? AND pratica_id IS NULL AND eliminato_il IS NULL AND version=?
      """, pulisciObbligatorio(titolo), categoria, dataDocumento, pulisci(note), documentoId, tenant.studioId(), soggettoId, version);
    audit("DOCUMENTO_ANAGRAFICA_MODIFICATO", soggettoId);
    return documento(soggettoId, documentoId, false);
  }

  @Transactional
  public void elimina(UUID soggettoId, UUID documentoId, long version) {
    var d = documentoDiretto(soggettoId, documentoId);
    if (((Number)d.get("version")).longValue() != version) throw errore(HttpStatus.PRECONDITION_FAILED, "ANAGRAFICA_VERSIONE_CONFLITTO");
    database.update("""
      UPDATE documento_pratica SET eliminato_il=NOW(),eliminato_da=?,version=version+1,aggiornato_il=NOW()
      WHERE id=? AND studio_id=? AND soggetto_id=? AND pratica_id IS NULL AND eliminato_il IS NULL AND version=?
      """, tenant.userId(), documentoId, tenant.studioId(), soggettoId, version);
    audit("DOCUMENTO_ANAGRAFICA_ELIMINATO", soggettoId);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> timeline(UUID soggettoId) {
    trovaSoggetto(soggettoId);
    return database.queryForList("""
      SELECT id,action AS azione,occurred_at AS "avvenutoIl",actor_id AS "autoreId"
      FROM audit_event WHERE studio_id=? AND entity_type='SOGGETTO' AND entity_id=?
      ORDER BY occurred_at DESC,id DESC
      """, tenant.studioId(), soggettoId);
  }

  @Transactional
  public SchedaStampabile generaScheda(UUID soggettoId, OpzioniScheda opzioni) {
    var soggetto = trovaSoggetto(soggettoId);
    var richieste = opzioni == null ? new OpzioniScheda(true,true,true,true,false,false) : opzioni;
    var effettive = new OpzioniScheda(richieste.datiGenerali(),richieste.recapiti(),richieste.indirizzo(),
      richieste.pratiche(),richieste.elencoDocumenti(),richieste.noteInterne() && amministratore());
    var studio = database.queryForMap("SELECT id,name,logo_url FROM studio WHERE id=?", tenant.studioId());
    var dati = mappaSoggetto(soggetto, effettive.noteInterne());
    var pratiche = effettive.pratiche() ? praticheVisibili(soggettoId) : List.<Map<String,Object>>of();
    var documenti = effettive.elencoDocumenti()
      ? elenco(soggettoId,null,null,null,"TUTTI",0,100,"desc").content() : List.<Map<String,Object>>of();
    audit("SCHEDA_ANAGRAFICA_GENERATA", soggettoId);
    return new SchedaStampabile(studio, dati, pratiche, documenti, effettive, Instant.now());
  }

  @Transactional
  public SchedaStampabile generaTemplate(UUID soggettoId, String codice, UUID praticaId, OpzioniScheda opzioni) {
    if ("SCHEDA_ANAGRAFICA".equals(codice)) return generaScheda(soggettoId, opzioni);
    if (TEMPLATE_PRATICA.contains(codice) && praticaId == null) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "TEMPLATE_RICHIEDE_PRATICA");
    if (TEMPLATE_PRATICA.contains(codice)) verificaPraticaCollegataVisibile(soggettoId, praticaId);
    throw errore(HttpStatus.NOT_IMPLEMENTED, "TEMPLATE_NON_CONFIGURATO");
  }

  private void aggiungiAmbito(StringBuilder dove, List<Object> parametri, UUID soggettoId, String ambito) {
    var praticaVisibile = """
      d.pratica_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM pratica_soggetto ps JOIN pratica p ON p.id=ps.pratica_id
        WHERE ps.pratica_id=d.pratica_id AND ps.soggetto_id=? AND ps.studio_id=d.studio_id
        AND ps.eliminato_il IS NULL AND p.eliminato_il IS NULL
        AND (? OR p.riservata=FALSE OR p.responsabile_id=? OR EXISTS (
          SELECT 1 FROM pratica_utente pu WHERE pu.pratica_id=p.id AND pu.utente_id=? AND pu.eliminato_il IS NULL)))
      """;
    if ("ANAGRAFICA".equals(ambito)) {
      dove.append(" AND d.pratica_id IS NULL AND d.soggetto_id=? "); parametri.add(soggettoId);
    } else if ("PRATICHE".equals(ambito)) {
      dove.append(" AND (").append(praticaVisibile).append(") ");
      aggiungiParametriVisibilita(parametri, soggettoId);
    } else {
      dove.append(" AND ((d.pratica_id IS NULL AND d.soggetto_id=?) OR (").append(praticaVisibile).append(")) ");
      parametri.add(soggettoId); aggiungiParametriVisibilita(parametri, soggettoId);
    }
  }
  private void aggiungiParametriVisibilita(List<Object> p, UUID soggettoId) {
    p.add(soggettoId); p.add(amministratore()); p.add(tenant.userId()); p.add(tenant.userId());
  }
  private Map<String,Object> documentoDiretto(UUID soggettoId, UUID documentoId) {
    trovaSoggetto(soggettoId);
    var righe = database.queryForList("""
      SELECT id,version FROM documento_pratica WHERE id=? AND studio_id=? AND soggetto_id=?
      AND pratica_id IS NULL AND eliminato_il IS NULL
      """, documentoId, tenant.studioId(), soggettoId);
    if (righe.isEmpty()) throw errore(HttpStatus.NOT_FOUND, "DOCUMENTO_ANAGRAFICA_NON_TROVATO");
    return righe.getFirst();
  }
  private void validaCategoria(String categoria) {
    var presente = database.queryForObject("SELECT COUNT(*) FROM categoria_documento_pratica WHERE codice=? AND attivo=TRUE", Integer.class, categoria);
    if (presente == null || presente == 0) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "DOCUMENTO_ANAGRAFICA_NON_VALIDO");
  }
  private void verificaPraticaCollegataVisibile(UUID soggettoId, UUID praticaId) {
    trovaSoggetto(soggettoId);
    var presente = database.queryForObject("""
      SELECT COUNT(*) FROM pratica p JOIN pratica_soggetto ps ON ps.pratica_id=p.id
      WHERE p.id=? AND p.studio_id=? AND p.eliminato_il IS NULL AND ps.soggetto_id=? AND ps.eliminato_il IS NULL
      AND (? OR p.riservata=FALSE OR p.responsabile_id=? OR EXISTS (
        SELECT 1 FROM pratica_utente pu WHERE pu.pratica_id=p.id AND pu.utente_id=? AND pu.eliminato_il IS NULL))
      """, Integer.class, praticaId, tenant.studioId(), soggettoId, amministratore(), tenant.userId(), tenant.userId());
    if (presente == null || presente == 0) throw errore(HttpStatus.NOT_FOUND, "DOCUMENTO_PRATICA_NON_VISIBILE");
  }
  private List<Map<String,Object>> praticheVisibili(UUID soggettoId) {
    return database.queryForList("""
      SELECT p.id,p.codice,p.titolo,p.stato_codice AS "statoCodice",p.materia_codice AS "materiaCodice",
      STRING_AGG(DISTINCT ps.ruolo_codice,', ') AS ruolo
      FROM pratica p JOIN pratica_soggetto ps ON ps.pratica_id=p.id
      WHERE p.studio_id=? AND ps.soggetto_id=? AND p.eliminato_il IS NULL AND ps.eliminato_il IS NULL
      AND (? OR p.riservata=FALSE OR p.responsabile_id=? OR EXISTS (
        SELECT 1 FROM pratica_utente pu WHERE pu.pratica_id=p.id AND pu.utente_id=? AND pu.eliminato_il IS NULL))
      GROUP BY p.id ORDER BY p.aggiornato_il DESC
      """, tenant.studioId(), soggettoId, amministratore(), tenant.userId(), tenant.userId());
  }
  private Map<String,Object> mappaSoggetto(Soggetto s, boolean note) {
    var m = new LinkedHashMap<String,Object>();
    m.put("id",s.getId()); m.put("tipoCodice",s.getTipoCodice()); m.put("nome",s.getNome()); m.put("cognome",s.getCognome());
    m.put("denominazione",s.getDenominazione()); m.put("formaGiuridica",s.getFormaGiuridica()); m.put("codiceFiscale",s.getCodiceFiscale());
    m.put("partitaIva",s.getPartitaIva()); m.put("dataNascita",s.getDataNascita()); m.put("luogoNascita",s.getLuogoNascita());
    m.put("email",s.getEmail()); m.put("pec",s.getPec()); m.put("telefono",s.getTelefono()); m.put("cellulare",s.getCellulare());
    m.put("indirizzo",s.getIndirizzo()); m.put("civico",s.getCivico()); m.put("cap",s.getCap()); m.put("comune",s.getComune());
    m.put("provincia",s.getProvincia()); m.put("statoIndirizzo",s.getStatoIndirizzo()); m.put("stato",s.getStato());
    if (note) m.put("note",s.getNote());
    return m;
  }
  private Soggetto trovaSoggetto(UUID id) {
    return soggetti.findByIdAndStudioIdAndEliminatoIlIsNull(id, tenant.studioId())
      .orElseThrow(() -> errore(HttpStatus.NOT_FOUND, "ANAGRAFICA_NON_TROVATA"));
  }
  private boolean amministratore() {
    var ruolo = database.query("""
      SELECT role FROM studio_membership WHERE studio_id=? AND user_id=? AND status='ACTIVE'
      """, rs -> rs.next() ? rs.getString(1) : "", tenant.studioId(), tenant.userId());
    return Set.of("STUDIO_ADMIN","TITOLARE").contains(Objects.toString(ruolo,""));
  }
  private void audit(String azione, UUID soggettoId) {
    database.update("""
      INSERT INTO audit_event(id,studio_id,actor_id,action,entity_type,entity_id,outcome,correlation_id,occurred_at,metadata)
      VALUES (?,?,?,?,?,?,?,?,?,?::jsonb)
      """, UUID.randomUUID(),tenant.studioId(),tenant.userId(),azione,"SOGGETTO",soggettoId,"SUCCESS",
      UUID.randomUUID(),Timestamp.from(Instant.now()),"{}");
  }
  private ResponseStatusException traduciArchivio(IllegalArgumentException e) {
    var codice = switch (Objects.toString(e.getMessage(),"")) {
      case "PRATICA_DOCUMENTO_TROPPO_GRANDE" -> "DOCUMENTO_ANAGRAFICA_TROPPO_GRANDE";
      case "PRATICA_DOCUMENTO_TIPO_NON_AMMESSO" -> "DOCUMENTO_ANAGRAFICA_TIPO_NON_AMMESSO";
      default -> "DOCUMENTO_ANAGRAFICA_NON_VALIDO";
    };
    return errore("DOCUMENTO_ANAGRAFICA_TROPPO_GRANDE".equals(codice) ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.UNPROCESSABLE_ENTITY, codice);
  }
  private static String pulisci(String valore) { return valore == null || valore.isBlank() ? null : valore.trim(); }
  private static String pulisciObbligatorio(String valore) {
    var pulito = pulisci(valore);
    if (pulito == null || pulito.length() > 240) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "DOCUMENTO_ANAGRAFICA_NON_VALIDO");
    return pulito;
  }
  private static ResponseStatusException errore(HttpStatus stato, String codice) { return new ResponseStatusException(stato, codice); }
}
