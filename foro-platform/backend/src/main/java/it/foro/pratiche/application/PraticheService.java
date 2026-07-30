package it.foro.pratiche.application;

import it.foro.platform.security.TenantContext;
import it.foro.pratiche.domain.Pratica;
import it.foro.pratiche.repository.PraticaRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.dao.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PraticheService {
  private static final Set<String> STATI = Set.of("BOZZA","APERTA","IN_ATTESA","SOSPESA","DEFINITA","ARCHIVIATA");
  private static final Set<String> PRIORITA = Set.of("BASSA","NORMALE","ALTA","URGENTE");
  private static final Set<String> RUOLI_TEAM = Set.of("RESPONSABILE","COLLABORATORE","SEGRETERIA","SOLA_LETTURA");
  private static final Set<String> STATI_ATTIVITA = Set.of("DA_FARE","IN_CORSO","IN_ATTESA","COMPLETATA","ANNULLATA");
  private static final Set<String> TIPI_COMUNICAZIONE = Set.of("EMAIL","PEC","TELEFONATA","LETTERA","RIUNIONE","NOTA","ALTRO");
  private final PraticaRepository pratiche;
  private final TenantContext tenant;
  private final JdbcTemplate database;
  private final ArchivioDocumentiPratica archivio;

  public PraticheService(PraticaRepository pratiche, TenantContext tenant, JdbcTemplate database, ArchivioDocumentiPratica archivio) {
    this.pratiche = pratiche;
    this.tenant = tenant;
    this.database = database;
    this.archivio = archivio;
  }

  public record Catalogo(String codice, String descrizione, int ordine, String materiaCodice) {}
  public record TemplateDocumento(String codice, String descrizione, int ordine, boolean configurato, String formato) {}
  public record DatiSoggetto(UUID soggettoId, String ruoloCodice, boolean principale, String descrizioneRuoloAltro, String note) {}
  public record DatiTeam(UUID utenteId, String ruoloTeamCodice, boolean principale) {}
  public record RichiestaPratica(Pratica.Dati dati, String stato, List<DatiSoggetto> soggetti, List<DatiTeam> team) {}
  public record Sintesi(UUID id, String codice, String titolo, String materiaCodice, String tipologiaCodice, String statoCodice,
    String prioritaCodice, UUID responsabileId, String responsabileNome, boolean riservata, LocalDate dataApertura,
    Instant aggiornatoIl, LocalDate prossimaScadenza, long attivitaScadute, String clienti, String controparti) {}
  public record Pagina(List<Sintesi> content, long totalElements, int totalPages, int number, int size) {}
  public record Dettaglio(UUID id, String codice, String titolo, String descrizione, String materiaCodice,
    String tipologiaCodice, String statoCodice, String prioritaCodice, UUID responsabileId, String responsabileNome,
    BigDecimal valoreEconomico, String valuta, boolean riservata, LocalDate dataApertura, LocalDate dataDefinizione,
    LocalDate dataArchiviazione, String motivoAttesa, String noteInterne, long version, Instant creatoIl, Instant aggiornatoIl) {}
  public record DatiPraticaAgenda(UUID id, String codice, String titolo, String statoCodice) {}

  @Transactional(readOnly = true)
  public List<Catalogo> catalogo(String tabella) {
    var consentite = Set.of("materia_pratica","tipologia_pratica","stato_pratica","priorita_pratica",
      "ruolo_team_pratica","stato_attivita_pratica","priorita_attivita_pratica","categoria_documento_pratica");
    if (!consentite.contains(tabella)) throw errore(HttpStatus.NOT_FOUND, "CATALOGO_NON_TROVATO");
    var materia = "tipologia_pratica".equals(tabella) ? ",materia_codice" : ",NULL::varchar AS materia_codice";
    return database.query("SELECT codice,descrizione,ordine" + materia + " FROM " + tabella + " WHERE attivo=TRUE ORDER BY ordine",
      (rs, n) -> new Catalogo(rs.getString("codice"), rs.getString("descrizione"), rs.getInt("ordine"), rs.getString("materia_codice")));
  }

  public List<TemplateDocumento> templateDocumenti() {
    return List.of(
      new TemplateDocumento("LETTERA_INCARICO", "Lettera di incarico", 1, false, null),
      new TemplateDocumento("PREVENTIVO", "Preventivo", 2, false, null),
      new TemplateDocumento("PROCURA_LITI", "Procura alle liti", 3, false, null),
      new TemplateDocumento("DIFFIDA", "Diffida", 4, false, null),
      new TemplateDocumento("SCHEDA_RIEPILOGATIVA_PRATICA", "Scheda riepilogativa pratica", 5, true, "TXT"),
      new TemplateDocumento("INFORMATIVA_PRIVACY", "Informativa privacy", 6, false, null),
      new TemplateDocumento("CONSENSO_TRATTAMENTO", "Consenso trattamento dati", 7, false, null),
      new TemplateDocumento("IDENTIFICAZIONE_CLIENTE", "Modulo identificazione cliente", 8, false, null),
      new TemplateDocumento("ADEGUATA_VERIFICA", "Modulo adeguata verifica", 9, false, null),
      new TemplateDocumento("TITOLARE_EFFETTIVO", "Dichiarazione titolare effettivo", 10, false, null)
    );
  }

  @Transactional(readOnly = true)
  public Pagina elenco(String ricerca, String materia, String tipologia, String stato, String priorita,
    UUID responsabile, UUID soggetto, String ruoloSoggetto, boolean scadenzeImminenti, boolean includiArchiviate,
    int pagina, int dimensione, String ordinamento, String direzione) {
    if (stato != null && !STATI.contains(stato)) throw errore(HttpStatus.BAD_REQUEST, "PRATICA_STATO_NON_VALIDO");
    if (priorita != null && !PRIORITA.contains(priorita)) throw errore(HttpStatus.BAD_REQUEST, "PRATICA_DATI_NON_VALIDI");
    var parametri = new ArrayList<Object>();
    var dove = new StringBuilder(" WHERE p.studio_id=? AND p.eliminato_il IS NULL");
    parametri.add(tenant.studioId());
    visibilita(dove, parametri);
    if (!includiArchiviate) dove.append(" AND p.stato_codice<>'ARCHIVIATA'");
    aggiungiFiltro(dove, parametri, "p.materia_codice", materia);
    aggiungiFiltro(dove, parametri, "p.tipologia_codice", tipologia);
    aggiungiFiltro(dove, parametri, "p.stato_codice", stato);
    aggiungiFiltro(dove, parametri, "p.priorita_codice", priorita);
    aggiungiFiltro(dove, parametri, "p.responsabile_id", responsabile);
    if (soggetto != null) { dove.append(" AND ps.soggetto_id=?"); parametri.add(soggetto); }
    if (ruoloSoggetto != null) { dove.append(" AND ps.ruolo_codice=?"); parametri.add(ruoloSoggetto); }
    if (scadenzeImminenti) dove.append(" AND (a.data_scadenza<=CURRENT_DATE+7 OR (e.inizio>=NOW() AND e.inizio<NOW()+INTERVAL '7 days'))");
    var testo = ricerca == null ? "" : ricerca.trim().toLowerCase(Locale.ROOT);
    if (!testo.isEmpty()) {
      dove.append("""
        AND (LOWER(p.codice) LIKE ? OR LOWER(p.titolo) LIKE ? OR LOWER(COALESCE(p.descrizione,'')) LIKE ?
        OR LOWER(COALESCE(s.nome,'')||' '||COALESCE(s.cognome,'')||' '||COALESCE(s.denominazione,'')) LIKE ?
        OR LOWER(COALESCE(g.numero_rg,'')||'/'||COALESCE(g.anno_rg::text,'')) LIKE ?)
        """);
      for (int i = 0; i < 5; i++) parametri.add("%" + testo + "%");
    }
    var join = """
      FROM pratica p
      LEFT JOIN pratica_soggetto ps ON ps.pratica_id=p.id AND ps.eliminato_il IS NULL
      LEFT JOIN soggetto s ON s.id=ps.soggetto_id AND s.eliminato_il IS NULL
      LEFT JOIN pratica_giudiziaria g ON g.pratica_id=p.id
      LEFT JOIN attivita_pratica a ON a.pratica_id=p.id AND a.eliminato_il IS NULL AND a.stato_codice NOT IN ('COMPLETATA','ANNULLATA')
      LEFT JOIN evento_calendario e ON e.pratica_id=p.id
      """;
    var totale = Optional.ofNullable(database.queryForObject("SELECT COUNT(DISTINCT p.id) " + join + dove, Long.class, parametri.toArray())).orElse(0L);
    var ordini = Map.of("aggiornatoIl","p.aggiornato_il","codice","p.codice","titolo","p.titolo","dataApertura","p.data_apertura","priorita","p.priorita_codice");
    var ordine = ordini.getOrDefault(ordinamento, "p.aggiornato_il");
    var verso = "asc".equalsIgnoreCase(direzione) ? "ASC" : "DESC";
    var query = "SELECT DISTINCT p.id," + ordine + " AS valore_ordine " + join + dove
      + " ORDER BY valore_ordine " + verso + " LIMIT ? OFFSET ?";
    var paginaParametri = new ArrayList<>(parametri);
    paginaParametri.add(dimensione);
    paginaParametri.add(pagina * dimensione);
    var ids = database.query(query, (rs, n) -> rs.getObject("id", UUID.class), paginaParametri.toArray());
    var contenuto = ids.stream().map(this::sintesi).toList();
    return new Pagina(contenuto, totale, (int) Math.ceil((double) totale / dimensione), pagina, dimensione);
  }

  @Transactional(readOnly = true)
  public Dettaglio dettaglio(UUID id) {
    return dettaglio(trovaVisibile(id));
  }

  @Transactional
  public Dettaglio crea(RichiestaPratica richiesta) {
    validaDati(richiesta.dati());
    var stato = Optional.ofNullable(richiesta.stato()).orElse("BOZZA");
    if (!Set.of("BOZZA","APERTA").contains(stato)) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_STATO_NON_VALIDO");
    validaResponsabile(richiesta.dati().responsabileId());
    var soggetti = Optional.ofNullable(richiesta.soggetti()).orElse(List.of());
    soggetti.forEach(this::validaSoggetto);
    if (!"BOZZA".equals(stato) && soggetti.stream().noneMatch(s -> "CLIENTE".equals(s.ruoloCodice()))) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_CLIENTE_OBBLIGATORIO");
    }
    var codice = generaCodice(richiesta.dati().dataApertura().getYear());
    var pratica = new Pratica(tenant.studioId(), codice, tenant.userId(), richiesta.dati());
    pratica = pratiche.saveAndFlush(pratica);
    collegaResponsabile(pratica.getId(), pratica.getResponsabileId());
    for (var soggetto : soggetti) inserisciSoggetto(pratica.getId(), soggetto);
    for (var membro : Optional.ofNullable(richiesta.team()).orElse(List.of())) {
      if (!membro.utenteId().equals(pratica.getResponsabileId())) inserisciTeam(pratica.getId(), membro);
    }
    if ("APERTA".equals(stato)) pratica.cambiaStato("APERTA", tenant.userId());
    timeline(pratica.getId(), "PRATICA_CREATA", "Pratica creata", "PRATICA", pratica.getId());
    audit("PRATICA_CREATA", pratica.getId());
    pratiche.flush();
    return dettaglio(pratica);
  }

  @Transactional
  public Dettaglio modifica(UUID id, long versione, Pratica.Dati dati) {
    validaDati(dati);
    validaResponsabile(dati.responsabileId());
    var pratica = trovaVisibile(id);
    verificaVersione(pratica, versione);
    var responsabilePrecedente = pratica.getResponsabileId();
    var prioritaPrecedente = pratica.getPrioritaCodice();
    try {
      pratica.aggiorna(dati, tenant.userId());
    } catch (IllegalStateException e) {
      throw errore(HttpStatus.CONFLICT, e.getMessage());
    }
    if (!responsabilePrecedente.equals(dati.responsabileId())) {
      database.update("UPDATE pratica_utente SET eliminato_il=NOW(),eliminato_da=?,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND ruolo_team_codice='RESPONSABILE' AND eliminato_il IS NULL",
        tenant.userId(), tenant.userId(), tenant.studioId(), id);
      collegaResponsabile(id, dati.responsabileId());
      timeline(id, "PRATICA_RESPONSABILE_MODIFICATO", "Responsabile modificato", "PRATICA", id);
    }
    if (!prioritaPrecedente.equals(dati.prioritaCodice())) timeline(id, "PRATICA_PRIORITA_MODIFICATA", "Priorità modificata", "PRATICA", id);
    timeline(id, "PRATICA_MODIFICATA", "Pratica modificata", "PRATICA", id);
    audit("PRATICA_MODIFICATA", id);
    pratiche.flush();
    return dettaglio(pratica);
  }

  @Transactional
  public Dettaglio cambiaStato(UUID id, long versione, String nuovoStato) {
    if (!STATI.contains(nuovoStato)) throw errore(HttpStatus.BAD_REQUEST, "PRATICA_STATO_NON_VALIDO");
    var pratica = trovaVisibile(id);
    verificaVersione(pratica, versione);
    if (!"BOZZA".equals(nuovoStato) && contaClienti(id) == 0) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_CLIENTE_OBBLIGATORIO");
    var precedente = pratica.getStatoCodice();
    try {
      pratica.cambiaStato(nuovoStato, tenant.userId());
    } catch (IllegalStateException e) {
      throw errore(HttpStatus.CONFLICT, e.getMessage());
    }
    var tipo = "ARCHIVIATA".equals(nuovoStato) ? "PRATICA_ARCHIVIATA"
      : "ARCHIVIATA".equals(precedente) ? "PRATICA_RIAPERTA" : "PRATICA_STATO_MODIFICATO";
    timeline(id, tipo, "Stato pratica modificato", "PRATICA", id);
    audit(tipo, id);
    pratiche.flush();
    return dettaglio(pratica);
  }

  @Transactional
  public void elimina(UUID id, long versione) {
    var pratica = trovaVisibile(id);
    verificaVersione(pratica, versione);
    pratica.elimina(tenant.userId());
    timeline(id, "PRATICA_ELIMINATA", "Pratica eliminata logicamente", "PRATICA", id);
    audit("PRATICA_ELIMINATA", id);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> soggetti(UUID praticaId) {
    trovaVisibile(praticaId);
    return database.queryForList("""
      SELECT ps.id,ps.soggetto_id AS "soggettoId",ps.ruolo_codice AS "ruoloCodice",ps.principale,
      ps.descrizione_ruolo_altro AS "descrizioneRuoloAltro",ps.note,ps.version,
      COALESCE(s.denominazione,TRIM(COALESCE(s.nome,'')||' '||COALESCE(s.cognome,''))) AS "nomeVisualizzato",s.tipo_codice AS "tipoCodice"
      FROM pratica_soggetto ps JOIN soggetto s ON s.id=ps.soggetto_id
      WHERE ps.studio_id=? AND ps.pratica_id=? AND ps.eliminato_il IS NULL ORDER BY ps.ruolo_codice,ps.principale DESC
      """, tenant.studioId(), praticaId);
  }

  @Transactional
  public Map<String,Object> aggiungiSoggetto(UUID praticaId, DatiSoggetto dati) {
    verificaOperativa(trovaVisibile(praticaId));
    validaSoggetto(dati);
    inserisciSoggetto(praticaId, dati);
    timeline(praticaId, "PRATICA_SOGGETTO_COLLEGATO", "Soggetto collegato", "SOGGETTO", dati.soggettoId());
    audit("PRATICA_SOGGETTO_COLLEGATO", praticaId);
    auditSoggetto("ANAGRAFICA_PRATICA_COLLEGATA", dati.soggettoId());
    return soggetti(praticaId).stream().filter(x -> dati.soggettoId().equals(x.get("soggettoId")) && dati.ruoloCodice().equals(x.get("ruoloCodice"))).findFirst().orElseThrow();
  }

  @Transactional
  public Map<String,Object> modificaSoggetto(UUID praticaId, UUID relazioneId, long versione, DatiSoggetto dati) {
    verificaOperativa(trovaVisibile(praticaId));
    validaSoggetto(dati);
    var attuale = relazione(praticaId, relazioneId, "pratica_soggetto");
    if (((Number) attuale.get("version")).longValue() != versione) throw errore(HttpStatus.PRECONDITION_FAILED, "PRATICA_VERSIONE_CONFLITTO");
    if ("CLIENTE".equals(attuale.get("ruolo_codice")) && !"CLIENTE".equals(dati.ruoloCodice()) && contaClienti(praticaId) == 1) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_ULTIMO_CLIENTE_NON_RIMOVIBILE");
    }
    try {
      database.update("""
        UPDATE pratica_soggetto SET soggetto_id=?,ruolo_codice=?,principale=?,descrizione_ruolo_altro=?,note=?,
        version=version+1,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL
        """, dati.soggettoId(), dati.ruoloCodice(), dati.principale(), pulisci(dati.descrizioneRuoloAltro()), pulisci(dati.note()),
        tenant.userId(), tenant.studioId(), praticaId, relazioneId);
    } catch (DataIntegrityViolationException e) {
      throw errore(HttpStatus.CONFLICT, "PRATICA_SOGGETTO_DUPLICATO");
    }
    timeline(praticaId, "PRATICA_SOGGETTO_MODIFICATO", "Ruolo soggetto modificato", "SOGGETTO", dati.soggettoId());
    auditSoggetto("ANAGRAFICA_PRATICA_COLLEGATA", dati.soggettoId());
    return soggetti(praticaId).stream().filter(x -> relazioneId.equals(x.get("id"))).findFirst().orElseThrow();
  }

  @Transactional
  public void rimuoviSoggetto(UUID praticaId, UUID relazioneId) {
    verificaOperativa(trovaVisibile(praticaId));
    var relazione = relazione(praticaId, relazioneId, "pratica_soggetto");
    if ("CLIENTE".equals(relazione.get("ruolo_codice")) && contaClienti(praticaId) == 1 && !"BOZZA".equals(trovaVisibile(praticaId).getStatoCodice())) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_ULTIMO_CLIENTE_NON_RIMOVIBILE");
    }
    database.update("UPDATE pratica_soggetto SET eliminato_il=NOW(),eliminato_da=?,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
      tenant.userId(), tenant.userId(), tenant.studioId(), praticaId, relazioneId);
    timeline(praticaId, "PRATICA_SOGGETTO_SCOLLEGATO", "Soggetto scollegato", "SOGGETTO", (UUID) relazione.get("soggetto_id"));
    audit("PRATICA_SOGGETTO_SCOLLEGATO", praticaId);
    auditSoggetto("ANAGRAFICA_PRATICA_SCOLLEGATA", (UUID) relazione.get("soggetto_id"));
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> team(UUID praticaId) {
    trovaVisibile(praticaId);
    return database.queryForList("""
      SELECT pu.id,pu.utente_id AS "utenteId",pu.ruolo_team_codice AS "ruoloTeamCodice",pu.principale,
      u.display_name AS "nomeVisualizzato" FROM pratica_utente pu JOIN user_account u ON u.id=pu.utente_id
      WHERE pu.studio_id=? AND pu.pratica_id=? AND pu.eliminato_il IS NULL ORDER BY pu.principale DESC,u.display_name
      """, tenant.studioId(), praticaId);
  }

  @Transactional
  public Map<String,Object> aggiungiTeam(UUID praticaId, DatiTeam dati) {
    verificaOperativa(trovaVisibile(praticaId));
    inserisciTeam(praticaId, dati);
    timeline(praticaId, "PRATICA_TEAM_MODIFICATO", "Membro team aggiunto", "UTENTE", dati.utenteId());
    audit("PRATICA_TEAM_MODIFICATO", praticaId);
    return team(praticaId).stream().filter(x -> dati.utenteId().equals(x.get("utenteId")) && dati.ruoloTeamCodice().equals(x.get("ruoloTeamCodice"))).findFirst().orElseThrow();
  }

  @Transactional
  public Map<String,Object> modificaTeam(UUID praticaId, UUID relazioneId, DatiTeam dati) {
    verificaOperativa(trovaVisibile(praticaId));
    if ("RESPONSABILE".equals(dati.ruoloTeamCodice())) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_TEAM_NON_VALIDO");
    validaMembro(dati.utenteId());
    relazione(praticaId, relazioneId, "pratica_utente");
    try {
      database.update("UPDATE pratica_utente SET utente_id=?,ruolo_team_codice=?,principale=?,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
        dati.utenteId(), dati.ruoloTeamCodice(), dati.principale(), tenant.userId(), tenant.studioId(), praticaId, relazioneId);
    } catch (DataIntegrityViolationException e) {
      throw errore(HttpStatus.CONFLICT, "PRATICA_TEAM_NON_VALIDO");
    }
    timeline(praticaId, "PRATICA_TEAM_MODIFICATO", "Membro team modificato", "UTENTE", dati.utenteId());
    return team(praticaId).stream().filter(x -> relazioneId.equals(x.get("id"))).findFirst().orElseThrow();
  }

  @Transactional
  public void rimuoviTeam(UUID praticaId, UUID relazioneId) {
    verificaOperativa(trovaVisibile(praticaId));
    var relazione = relazione(praticaId, relazioneId, "pratica_utente");
    if ("RESPONSABILE".equals(relazione.get("ruolo_team_codice"))) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_TEAM_NON_VALIDO");
    database.update("UPDATE pratica_utente SET eliminato_il=NOW(),eliminato_da=?,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
      tenant.userId(), tenant.userId(), tenant.studioId(), praticaId, relazioneId);
    timeline(praticaId, "PRATICA_TEAM_MODIFICATO", "Membro team rimosso", "UTENTE", (UUID) relazione.get("utente_id"));
    audit("PRATICA_TEAM_MODIFICATO", praticaId);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> documenti(UUID praticaId, String categoria) {
    trovaVisibile(praticaId);
    var sql = """
      SELECT id,categoria_codice AS "categoriaCodice",titolo,nome_file AS "nomeFile",mime_type AS "mimeType",
      dimensione,versione_numero AS "versioneNumero",stato_documento AS "statoDocumento",origine,template_codice AS "templateCodice",
      soggetto_id AS "soggettoId",creato_il AS "creatoIl",aggiornato_il AS "aggiornatoIl"
      FROM documento_pratica WHERE studio_id=? AND pratica_id=? AND eliminato_il IS NULL
      """ + (categoria == null ? "" : " AND categoria_codice=?") + " ORDER BY aggiornato_il DESC";
    return categoria == null ? database.queryForList(sql, tenant.studioId(), praticaId) : database.queryForList(sql, tenant.studioId(), praticaId, categoria);
  }

  @Transactional
  public Map<String,Object> caricaDocumento(UUID praticaId, String categoria, String titolo, UUID soggettoId,
    String origine, String templateCodice, org.springframework.web.multipart.MultipartFile file) {
    verificaOperativa(trovaVisibile(praticaId));
    validaCatalogo("categoria_documento_pratica", categoria, "PRATICA_DOCUMENTO_NON_VALIDO");
    if (soggettoId != null && !soggettoCollegato(praticaId, soggettoId)) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_DOCUMENTO_NON_VALIDO");
    if (!Set.of("UPLOAD","TEMPLATE","GENERATO").contains(origine)) throw errore(HttpStatus.BAD_REQUEST, "PRATICA_DOCUMENTO_NON_VALIDO");
    ArchivioDocumentiPratica.DocumentoSalvato salvato;
    try { salvato = archivio.salva(tenant.studioId(), praticaId, file); }
    catch (IllegalArgumentException e) {
      var stato = "PRATICA_DOCUMENTO_TROPPO_GRANDE".equals(e.getMessage()) ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.UNPROCESSABLE_ENTITY;
      throw errore(stato, e.getMessage());
    }
    var id = UUID.randomUUID();
    database.update("""
      INSERT INTO documento_pratica(id,studio_id,pratica_id,soggetto_id,categoria_codice,titolo,nome_file,mime_type,dimensione,
      percorso_storage,checksum_sha256,versione_numero,stato_documento,origine,template_codice,caricato_da,creato_il,aggiornato_il)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())
      """, id, tenant.studioId(), praticaId, soggettoId, categoria, pulisci(titolo), salvato.nomeFile(), salvato.mimeType(),
      salvato.dimensione(), salvato.percorso(), salvato.checksum(), 1, "DISPONIBILE", origine, pulisci(templateCodice), tenant.userId());
    timeline(praticaId, "PRATICA_DOCUMENTO_CARICATO", "Documento caricato", "DOCUMENTO_PRATICA", id);
    audit("PRATICA_DOCUMENTO_CARICATO", praticaId);
    return documento(praticaId, id, false);
  }

  @Transactional
  public Map<String,Object> generaDocumento(UUID praticaId, String templateCodice, UUID soggettoId) {
    var pratica = trovaVisibile(praticaId);
    verificaOperativa(pratica);
    var template = templateDocumenti().stream().filter(elemento -> elemento.codice().equals(templateCodice))
      .findFirst().orElseThrow(() -> errore(HttpStatus.BAD_REQUEST, "PRATICA_TEMPLATE_NON_VALIDO"));
    if (!template.configurato()) throw errore(HttpStatus.NOT_IMPLEMENTED, "TEMPLATE_NON_CONFIGURATO");
    if (soggettoId != null && !soggettoCollegato(praticaId, soggettoId)) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_DOCUMENTO_NON_VALIDO");
    }
    if (!"SCHEDA_RIEPILOGATIVA_PRATICA".equals(template.codice())) {
      throw errore(HttpStatus.NOT_IMPLEMENTED, "TEMPLATE_NON_CONFIGURATO");
    }

    var contenuto = """
      FORO - SCHEDA RIEPILOGATIVA PRATICA

      Codice: %s
      Titolo: %s
      Materia: %s
      Tipologia: %s
      Stato: %s
      Priorita: %s
      Data apertura: %s
      Soggetto selezionato: %s
      Generato il: %s
      """.formatted(pratica.getCodice(), pratica.getTitolo(), pratica.getMateriaCodice(), pratica.getTipologiaCodice(),
      pratica.getStatoCodice(), pratica.getPrioritaCodice(), pratica.getDataApertura(),
      soggettoId == null ? "Nessuno" : soggettoId, LocalDate.now());
    var nomeFile = "scheda-riepilogativa-" + pratica.getCodice().replaceAll("[^A-Za-z0-9_-]", "-") + ".txt";
    var salvato = archivio.salvaGenerato(tenant.studioId(), praticaId, nomeFile,
      contenuto.getBytes(StandardCharsets.UTF_8), "text/plain");
    var id = UUID.randomUUID();
    database.update("""
      INSERT INTO documento_pratica(id,studio_id,pratica_id,soggetto_id,categoria_codice,titolo,nome_file,mime_type,dimensione,
      percorso_storage,checksum_sha256,versione_numero,stato_documento,origine,template_codice,caricato_da,creato_il,aggiornato_il)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())
      """, id, tenant.studioId(), praticaId, soggettoId, "ALTRO", template.descrizione(), salvato.nomeFile(), salvato.mimeType(),
      salvato.dimensione(), salvato.percorso(), salvato.checksum(), 1, "DISPONIBILE", "GENERATO", template.codice(), tenant.userId());
    timeline(praticaId, "PRATICA_DOCUMENTO_GENERATO", "Documento generato da template", "DOCUMENTO_PRATICA", id);
    audit("PRATICA_DOCUMENTO_GENERATO", praticaId);
    return documento(praticaId, id, false);
  }

  @Transactional(readOnly = true)
  public Map<String,Object> documento(UUID praticaId, UUID documentoId, boolean includiPercorso) {
    trovaVisibile(praticaId);
    var colonne = includiPercorso ? ",percorso_storage AS \"percorsoStorage\" " : " ";
    var risultato = database.query("""
      SELECT id,categoria_codice AS "categoriaCodice",titolo,nome_file AS "nomeFile",mime_type AS "mimeType",dimensione,
      versione_numero AS "versioneNumero",stato_documento AS "statoDocumento",origine,template_codice AS "templateCodice",
      soggetto_id AS "soggettoId",creato_il AS "creatoIl",aggiornato_il AS "aggiornatoIl" """ + colonne + """
      FROM documento_pratica WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL
      """, rs -> rs.next() ? mappaRiga(rs) : null, tenant.studioId(), praticaId, documentoId);
    if (risultato == null) throw errore(HttpStatus.NOT_FOUND, "PRATICA_DOCUMENTO_NON_VALIDO");
    return risultato;
  }

  @Transactional(readOnly = true)
  public DownloadDocumento scaricaDocumento(UUID praticaId, UUID documentoId) {
    var documento = documento(praticaId, documentoId, true);
    if (documento == null || documento.get("percorsoStorage") == null) throw errore(HttpStatus.NOT_FOUND, "PRATICA_DOCUMENTO_NON_VALIDO");
    return new DownloadDocumento((String) documento.get("nomeFile"), (String) documento.get("mimeType"), archivio.leggi((String) documento.get("percorsoStorage")));
  }
  public record DownloadDocumento(String nomeFile, String mimeType, byte[] contenuto) {}

  @Transactional
  public Map<String,Object> modificaDocumento(UUID praticaId, UUID documentoId, String titolo, String categoria, UUID soggettoId) {
    verificaOperativa(trovaVisibile(praticaId));
    documento(praticaId, documentoId, false);
    validaCatalogo("categoria_documento_pratica", categoria, "PRATICA_DOCUMENTO_NON_VALIDO");
    if (soggettoId != null && !soggettoCollegato(praticaId, soggettoId)) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_DOCUMENTO_NON_VALIDO");
    database.update("UPDATE documento_pratica SET titolo=?,categoria_codice=?,soggetto_id=?,aggiornato_il=NOW() WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
      pulisci(titolo), categoria, soggettoId, tenant.studioId(), praticaId, documentoId);
    timeline(praticaId, "PRATICA_DOCUMENTO_MODIFICATO", "Metadati documento modificati", "DOCUMENTO_PRATICA", documentoId);
    return documento(praticaId, documentoId, false);
  }

  @Transactional
  public void eliminaDocumento(UUID praticaId, UUID documentoId) {
    verificaOperativa(trovaVisibile(praticaId));
    var documento = documento(praticaId, documentoId, true);
    if (documento == null) throw errore(HttpStatus.NOT_FOUND, "PRATICA_DOCUMENTO_NON_VALIDO");
    database.update("UPDATE documento_pratica SET eliminato_il=NOW(),eliminato_da=?,aggiornato_il=NOW() WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
      tenant.userId(), tenant.studioId(), praticaId, documentoId);
    timeline(praticaId, "PRATICA_DOCUMENTO_ELIMINATO", "Documento eliminato logicamente", "DOCUMENTO_PRATICA", documentoId);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> attivita(UUID praticaId, String stato, UUID assegnatario, boolean scadute) {
    trovaVisibile(praticaId);
    var parametri = new ArrayList<Object>(List.of(tenant.studioId(), praticaId));
    var sql = new StringBuilder("""
      SELECT id,titolo,descrizione,assegnatario_id AS "assegnatarioId",stato_codice AS "statoCodice",
      priorita_codice AS "prioritaCodice",data_scadenza AS "dataScadenza",completata_il AS "completataIl",
      evento_calendario_id AS "eventoCalendarioId",version,aggiornato_il AS "aggiornatoIl"
      FROM attivita_pratica WHERE studio_id=? AND pratica_id=? AND eliminato_il IS NULL
      """);
    if (stato != null) { sql.append(" AND stato_codice=?"); parametri.add(stato); }
    if (assegnatario != null) { sql.append(" AND assegnatario_id=?"); parametri.add(assegnatario); }
    if (scadute) sql.append(" AND data_scadenza<CURRENT_DATE AND stato_codice NOT IN ('COMPLETATA','ANNULLATA')");
    sql.append(" ORDER BY CASE priorita_codice WHEN 'URGENTE' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'NORMALE' THEN 3 ELSE 4 END,data_scadenza NULLS LAST");
    return database.queryForList(sql.toString(), parametri.toArray());
  }

  public record DatiAttivita(String titolo, String descrizione, UUID assegnatarioId, String statoCodice,
    String prioritaCodice, LocalDate dataScadenza, UUID eventoCalendarioId) {}

  @Transactional
  public Map<String,Object> creaAttivita(UUID praticaId, DatiAttivita dati) {
    verificaOperativa(trovaVisibile(praticaId));
    validaAttivita(dati);
    var id = UUID.randomUUID();
    database.update("""
      INSERT INTO attivita_pratica(id,studio_id,pratica_id,titolo,descrizione,assegnatario_id,stato_codice,priorita_codice,
      data_scadenza,completata_il,evento_calendario_id,creato_il,creato_da,aggiornato_il,aggiornato_da)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)
      """, id, tenant.studioId(), praticaId, pulisci(dati.titolo()), pulisci(dati.descrizione()), dati.assegnatarioId(),
      dati.statoCodice(), dati.prioritaCodice(), dati.dataScadenza(), "COMPLETATA".equals(dati.statoCodice()) ? Timestamp.from(Instant.now()) : null,
      dati.eventoCalendarioId(), Timestamp.from(Instant.now()), tenant.userId(), tenant.userId());
    timeline(praticaId, "PRATICA_ATTIVITA_CREATA", "Attività creata", "ATTIVITA_PRATICA", id);
    audit("PRATICA_ATTIVITA_MODIFICATA", praticaId);
    return attivita(praticaId, null, null, false).stream().filter(x -> id.equals(x.get("id"))).findFirst().orElseThrow();
  }

  @Transactional
  public Map<String,Object> modificaAttivita(UUID praticaId, UUID attivitaId, long versione, DatiAttivita dati) {
    verificaOperativa(trovaVisibile(praticaId));
    validaAttivita(dati);
    var attuale = relazione(praticaId, attivitaId, "attivita_pratica");
    if (((Number) attuale.get("version")).longValue() != versione) throw errore(HttpStatus.PRECONDITION_FAILED, "PRATICA_VERSIONE_CONFLITTO");
    database.update("""
      UPDATE attivita_pratica SET titolo=?,descrizione=?,assegnatario_id=?,stato_codice=?,priorita_codice=?,data_scadenza=?,
      completata_il=CASE WHEN ?='COMPLETATA' THEN COALESCE(completata_il,NOW()) ELSE NULL END,evento_calendario_id=?,
      version=version+1,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL
      """, pulisci(dati.titolo()), pulisci(dati.descrizione()), dati.assegnatarioId(), dati.statoCodice(), dati.prioritaCodice(),
      dati.dataScadenza(), dati.statoCodice(), dati.eventoCalendarioId(), tenant.userId(), tenant.studioId(), praticaId, attivitaId);
    timeline(praticaId, "COMPLETATA".equals(dati.statoCodice()) ? "PRATICA_ATTIVITA_COMPLETATA" : "PRATICA_ATTIVITA_MODIFICATA",
      "Attività modificata", "ATTIVITA_PRATICA", attivitaId);
    return attivita(praticaId, null, null, false).stream().filter(x -> attivitaId.equals(x.get("id"))).findFirst().orElseThrow();
  }

  @Transactional
  public void eliminaAttivita(UUID praticaId, UUID attivitaId) {
    verificaOperativa(trovaVisibile(praticaId));
    relazione(praticaId, attivitaId, "attivita_pratica");
    database.update("UPDATE attivita_pratica SET eliminato_il=NOW(),eliminato_da=?,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
      tenant.userId(), tenant.userId(), tenant.studioId(), praticaId, attivitaId);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> comunicazioni(UUID praticaId) {
    trovaVisibile(praticaId);
    return database.queryForList("""
      SELECT id,tipo,oggetto,descrizione,data_comunicazione AS "dataComunicazione",autore_id AS "autoreId",version,
      creato_il AS "creatoIl",aggiornato_il AS "aggiornatoIl" FROM comunicazione_pratica
      WHERE studio_id=? AND pratica_id=? AND eliminato_il IS NULL ORDER BY data_comunicazione DESC
      """, tenant.studioId(), praticaId);
  }
  public record DatiComunicazione(String tipo, String oggetto, String descrizione, Instant dataComunicazione) {}

  @Transactional
  public Map<String,Object> creaComunicazione(UUID praticaId, DatiComunicazione dati) {
    verificaOperativa(trovaVisibile(praticaId));
    validaComunicazione(dati);
    var id = UUID.randomUUID();
    database.update("""
      INSERT INTO comunicazione_pratica(id,studio_id,pratica_id,tipo,oggetto,descrizione,data_comunicazione,autore_id,
      creato_il,creato_da,aggiornato_il,aggiornato_da) VALUES (?,?,?,?,?,?,?,?,NOW(),?,NOW(),?)
      """, id, tenant.studioId(), praticaId, dati.tipo(), pulisci(dati.oggetto()), pulisci(dati.descrizione()),
      Timestamp.from(Optional.ofNullable(dati.dataComunicazione()).orElse(Instant.now())), tenant.userId(), tenant.userId(), tenant.userId());
    timeline(praticaId, "PRATICA_COMUNICAZIONE_REGISTRATA", "Comunicazione registrata", "COMUNICAZIONE_PRATICA", id);
    return comunicazioni(praticaId).stream().filter(x -> id.equals(x.get("id"))).findFirst().orElseThrow();
  }

  @Transactional
  public Map<String,Object> modificaComunicazione(UUID praticaId, UUID comunicazioneId, long versione, DatiComunicazione dati) {
    verificaOperativa(trovaVisibile(praticaId));
    validaComunicazione(dati);
    var attuale = relazione(praticaId, comunicazioneId, "comunicazione_pratica");
    if (((Number) attuale.get("version")).longValue() != versione) throw errore(HttpStatus.PRECONDITION_FAILED, "PRATICA_VERSIONE_CONFLITTO");
    database.update("""
      UPDATE comunicazione_pratica SET tipo=?,oggetto=?,descrizione=?,data_comunicazione=?,version=version+1,
      aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL
      """, dati.tipo(), pulisci(dati.oggetto()), pulisci(dati.descrizione()),
      Timestamp.from(Optional.ofNullable(dati.dataComunicazione()).orElse(Instant.now())), tenant.userId(), tenant.studioId(), praticaId, comunicazioneId);
    return comunicazioni(praticaId).stream().filter(x -> comunicazioneId.equals(x.get("id"))).findFirst().orElseThrow();
  }

  @Transactional
  public void eliminaComunicazione(UUID praticaId, UUID comunicazioneId) {
    verificaOperativa(trovaVisibile(praticaId));
    relazione(praticaId, comunicazioneId, "comunicazione_pratica");
    database.update("UPDATE comunicazione_pratica SET eliminato_il=NOW(),eliminato_da=?,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
      tenant.userId(), tenant.userId(), tenant.studioId(), praticaId, comunicazioneId);
  }

  @Transactional(readOnly = true)
  public Map<String,Object> datiGiudiziari(UUID praticaId) {
    trovaVisibile(praticaId);
    var righe = database.queryForList("""
      SELECT autorita_giudiziaria AS "autoritaGiudiziaria",ufficio,sezione,numero_rg AS "numeroRg",anno_rg AS "annoRg",
      giudice,data_iscrizione_ruolo AS "dataIscrizioneRuolo",tipo_procedimento AS "tipoProcedimento",grado_giudizio AS "gradoGiudizio",
      ruolo_processuale_cliente AS "ruoloProcessualeCliente",stato_procedimento AS "statoProcedimento",note,version
      FROM pratica_giudiziaria WHERE studio_id=? AND pratica_id=?
      """, tenant.studioId(), praticaId);
    return righe.isEmpty() ? Map.of("version", 0L) : righe.getFirst();
  }

  @Transactional
  public Map<String,Object> salvaDatiGiudiziari(UUID praticaId, Map<String,Object> dati) {
    verificaOperativa(trovaVisibile(praticaId));
    var anno = numero(dati.get("annoRg"));
    if (anno != null && (anno < 1900 || anno > 2200)) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_DATI_GIUDIZIARI_NON_VALIDI");
    var versione = Optional.ofNullable(numeroLungo(dati.get("version"))).orElse(0L);
    var esistente = database.queryForObject("SELECT COUNT(*) FROM pratica_giudiziaria WHERE studio_id=? AND pratica_id=?", Integer.class, tenant.studioId(), praticaId);
    if (esistente != null && esistente > 0) {
      var aggiornata = database.update("""
        UPDATE pratica_giudiziaria SET autorita_giudiziaria=?,ufficio=?,sezione=?,numero_rg=?,anno_rg=?,giudice=?,
        data_iscrizione_ruolo=?,tipo_procedimento=?,grado_giudizio=?,ruolo_processuale_cliente=?,stato_procedimento=?,note=?,
        version=version+1,aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND version=?
        """, testo(dati,"autoritaGiudiziaria"),testo(dati,"ufficio"),testo(dati,"sezione"),testo(dati,"numeroRg"),anno,
        testo(dati,"giudice"),data(dati.get("dataIscrizioneRuolo")),testo(dati,"tipoProcedimento"),testo(dati,"gradoGiudizio"),
        testo(dati,"ruoloProcessualeCliente"),testo(dati,"statoProcedimento"),testo(dati,"note"),tenant.userId(),tenant.studioId(),praticaId,versione);
      if (aggiornata == 0) throw errore(HttpStatus.PRECONDITION_FAILED, "PRATICA_VERSIONE_CONFLITTO");
    } else {
      database.update("""
        INSERT INTO pratica_giudiziaria(pratica_id,studio_id,autorita_giudiziaria,ufficio,sezione,numero_rg,anno_rg,giudice,
        data_iscrizione_ruolo,tipo_procedimento,grado_giudizio,ruolo_processuale_cliente,stato_procedimento,note,aggiornato_il,aggiornato_da)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)
        """, praticaId,tenant.studioId(),testo(dati,"autoritaGiudiziaria"),testo(dati,"ufficio"),testo(dati,"sezione"),
        testo(dati,"numeroRg"),anno,testo(dati,"giudice"),data(dati.get("dataIscrizioneRuolo")),testo(dati,"tipoProcedimento"),
        testo(dati,"gradoGiudizio"),testo(dati,"ruoloProcessualeCliente"),testo(dati,"statoProcedimento"),testo(dati,"note"),tenant.userId());
    }
    timeline(praticaId, "PRATICA_DATI_GIUDIZIARI_MODIFICATI", "Dati giudiziari modificati", "PRATICA_GIUDIZIARIA", praticaId);
    return datiGiudiziari(praticaId);
  }

  @Transactional(readOnly = true)
  public Map<String,Object> economia(UUID praticaId) {
    trovaVisibile(praticaId);
    var righe = database.queryForList("""
      SELECT preventivo,compenso_concordato AS "compensoConcordato",acconti_richiesti AS "accontiRichiesti",
      acconti_pagati AS "accontiPagati",spese_anticipate AS "speseAnticipate",contributo_unificato AS "contributoUnificato",
      altre_spese AS "altreSpese",importo_fatturato AS "importoFatturato",importo_incassato AS "importoIncassato",
      valuta,note,version FROM economia_pratica WHERE studio_id=? AND pratica_id=?
      """, tenant.studioId(), praticaId);
    return righe.isEmpty() ? Map.of("version",0L,"valuta","EUR") : righe.getFirst();
  }

  @Transactional
  public Map<String,Object> salvaEconomia(UUID praticaId, Map<String,Object> dati) {
    verificaOperativa(trovaVisibile(praticaId));
    var campi = List.of("preventivo","compensoConcordato","accontiRichiesti","accontiPagati","speseAnticipate",
      "contributoUnificato","altreSpese","importoFatturato","importoIncassato");
    var importi = campi.stream().map(c -> decimale(dati.get(c))).toList();
    if (importi.stream().anyMatch(v -> v.signum() < 0)) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_DATI_ECONOMICI_NON_VALIDI");
    var versione = Optional.ofNullable(numeroLungo(dati.get("version"))).orElse(0L);
    var esistente = database.queryForObject("SELECT COUNT(*) FROM economia_pratica WHERE studio_id=? AND pratica_id=?", Integer.class, tenant.studioId(), praticaId);
    var valori = new ArrayList<Object>(importi);
    valori.add(Optional.ofNullable(testo(dati,"valuta")).orElse("EUR"));
    valori.add(testo(dati,"note"));
    if (esistente != null && esistente > 0) {
      valori.add(tenant.userId()); valori.add(tenant.studioId()); valori.add(praticaId); valori.add(versione);
      var aggiornate = database.update("""
        UPDATE economia_pratica SET preventivo=?,compenso_concordato=?,acconti_richiesti=?,acconti_pagati=?,spese_anticipate=?,
        contributo_unificato=?,altre_spese=?,importo_fatturato=?,importo_incassato=?,valuta=?,note=?,version=version+1,
        aggiornato_il=NOW(),aggiornato_da=? WHERE studio_id=? AND pratica_id=? AND version=?
        """, valori.toArray());
      if (aggiornate == 0) throw errore(HttpStatus.PRECONDITION_FAILED, "PRATICA_VERSIONE_CONFLITTO");
    } else {
      var inserimento = new ArrayList<Object>(List.of(praticaId,tenant.studioId())); inserimento.addAll(valori); inserimento.add(tenant.userId());
      database.update("""
        INSERT INTO economia_pratica(pratica_id,studio_id,preventivo,compenso_concordato,acconti_richiesti,acconti_pagati,
        spese_anticipate,contributo_unificato,altre_spese,importo_fatturato,importo_incassato,valuta,note,aggiornato_il,aggiornato_da)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)
        """, inserimento.toArray());
    }
    timeline(praticaId, "PRATICA_ECONOMIA_MODIFICATA", "Dati economici modificati", "ECONOMIA_PRATICA", praticaId);
    return economia(praticaId);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> timeline(UUID praticaId) {
    trovaVisibile(praticaId);
    return database.queryForList("""
      SELECT id,tipo_evento AS "tipoEvento",titolo,descrizione_sintetica AS "descrizioneSintetica",actor_id AS "actorId",
      entita_tipo AS "entitaTipo",entita_id AS "entitaId",avvenuto_il AS "avvenutoIl",metadata
      FROM pratica_timeline WHERE studio_id=? AND pratica_id=? ORDER BY avvenuto_il DESC,id DESC
      """, tenant.studioId(), praticaId);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> eventi(UUID praticaId) {
    trovaVisibile(praticaId);
    return database.queryForList("""
      SELECT e.id,e.calendario_id AS "calendarioId",c.nome AS "calendarioNome",e.titolo,e.inizio,e.fine,e.categoria,
      e.stato_disponibilita AS "statoDisponibilita",e.ricorrenza FROM evento_calendario e
      JOIN calendario c ON c.id=e.calendario_id WHERE e.studio_id=? AND e.pratica_id=? ORDER BY e.inizio DESC
      """, tenant.studioId(), praticaId);
  }

  @Transactional(readOnly = true)
  public List<Map<String,Object>> praticheDelSoggetto(UUID soggettoId) {
    var presente = database.queryForObject("SELECT COUNT(*) FROM soggetto WHERE id=? AND studio_id=? AND eliminato_il IS NULL",
      Integer.class, soggettoId, tenant.studioId());
    if (presente == null || presente == 0) throw errore(HttpStatus.NOT_FOUND, "ANAGRAFICA_NON_TROVATA");
    return database.queryForList("""
      SELECT p.id,p.codice,p.titolo,p.stato_codice AS "statoCodice",p.materia_codice AS "materiaCodice",
      ps.ruolo_codice AS "ruoloCodice",p.responsabile_id AS "responsabileId",u.display_name AS "responsabileNome",
      p.data_apertura AS "dataApertura",(
        SELECT MIN(data) FROM (
          SELECT a.data_scadenza AS data FROM attivita_pratica a WHERE a.pratica_id=p.id AND a.eliminato_il IS NULL
            AND a.stato_codice NOT IN ('COMPLETATA','ANNULLATA')
          UNION ALL SELECT e.inizio::date FROM evento_calendario e WHERE e.pratica_id=p.id AND e.inizio>=NOW()
        ) prossime
      ) AS "prossimaScadenza"
      FROM pratica_soggetto ps JOIN pratica p ON p.id=ps.pratica_id
      JOIN user_account u ON u.id=p.responsabile_id
      WHERE ps.studio_id=? AND ps.soggetto_id=? AND ps.eliminato_il IS NULL AND p.eliminato_il IS NULL
      AND (? OR p.riservata=FALSE OR p.responsabile_id=? OR EXISTS (
        SELECT 1 FROM pratica_utente pu WHERE pu.pratica_id=p.id AND pu.utente_id=? AND pu.eliminato_il IS NULL))
      ORDER BY p.aggiornato_il DESC
      """, tenant.studioId(), soggettoId, amministratore(), tenant.userId(), tenant.userId());
  }

  @Transactional(readOnly = true)
  public DatiPraticaAgenda verificaCollegabileAgenda(UUID praticaId) {
    var pratica = trovaVisibile(praticaId);
    if ("ARCHIVIATA".equals(pratica.getStatoCodice())) throw errore(HttpStatus.CONFLICT, "PRATICA_ARCHIVIATA_NON_MODIFICABILE");
    return new DatiPraticaAgenda(pratica.getId(), pratica.getCodice(), pratica.getTitolo(), pratica.getStatoCodice());
  }

  @Transactional(readOnly = true)
  public DatiPraticaAgenda datiAgenda(UUID praticaId) {
    var pratica = trovaVisibile(praticaId);
    return new DatiPraticaAgenda(pratica.getId(), pratica.getCodice(), pratica.getTitolo(), pratica.getStatoCodice());
  }

  @Transactional(readOnly = true)
  public DatiPraticaAgenda datiAgendaStorici(UUID praticaId) {
    var righe = database.queryForList("""
      SELECT p.id,p.codice,p.titolo,p.stato_codice,p.riservata,p.responsabile_id,p.eliminato_il
      FROM pratica p WHERE p.id=? AND p.studio_id=?
      """, praticaId, tenant.studioId());
    if (righe.isEmpty()) return null;
    var p = righe.getFirst();
    var riservata = Boolean.TRUE.equals(p.get("riservata"));
    if (riservata && !amministratore() && !tenant.userId().equals(p.get("responsabile_id")) && !membroTeam(praticaId,tenant.userId())) return null;
    var eliminata = p.get("eliminato_il") != null;
    return new DatiPraticaAgenda(praticaId,(String)p.get("codice"),eliminata?"Pratica eliminata":(String)p.get("titolo"),
      eliminata?"ELIMINATA":(String)p.get("stato_codice"));
  }

  @Transactional
  public void registraEvento(UUID praticaId, UUID eventoId, String tipo) {
    if (praticaId == null) return;
    timeline(praticaId, tipo, "Evento Agenda aggiornato", "EVENTO_CALENDARIO", eventoId);
    audit("PRATICA_EVENTO_COLLEGATO", praticaId);
  }

  private Sintesi sintesi(UUID id) {
    var p = trovaVisibile(id);
    var responsabile = nomeUtente(p.getResponsabileId());
    var scadenza = database.queryForObject("""
      SELECT MIN(data_scadenza) FROM (
        SELECT data_scadenza FROM attivita_pratica WHERE pratica_id=? AND eliminato_il IS NULL AND stato_codice NOT IN ('COMPLETATA','ANNULLATA')
        UNION ALL SELECT inizio::date FROM evento_calendario WHERE pratica_id=? AND inizio>=NOW()
      ) scadenze
      """, LocalDate.class, id, id);
    var scadute = Optional.ofNullable(database.queryForObject("""
      SELECT COUNT(*) FROM attivita_pratica WHERE pratica_id=? AND eliminato_il IS NULL
      AND data_scadenza<CURRENT_DATE AND stato_codice NOT IN ('COMPLETATA','ANNULLATA')
      """, Long.class, id)).orElse(0L);
    return new Sintesi(p.getId(),p.getCodice(),p.getTitolo(),p.getMateriaCodice(),p.getTipologiaCodice(),p.getStatoCodice(),
      p.getPrioritaCodice(),p.getResponsabileId(),responsabile,p.isRiservata(),p.getDataApertura(),p.getAggiornatoIl(),scadenza,
      scadute,nomiRuolo(id,"CLIENTE"),nomiRuolo(id,"CONTROPARTE"));
  }

  private Dettaglio dettaglio(Pratica p) {
    return new Dettaglio(p.getId(),p.getCodice(),p.getTitolo(),p.getDescrizione(),p.getMateriaCodice(),p.getTipologiaCodice(),
      p.getStatoCodice(),p.getPrioritaCodice(),p.getResponsabileId(),nomeUtente(p.getResponsabileId()),p.getValoreEconomico(),
      p.getValuta(),p.isRiservata(),p.getDataApertura(),p.getDataDefinizione(),p.getDataArchiviazione(),p.getMotivoAttesa(),
      p.getNoteInterne(),p.getVersion(),p.getCreatoIl(),p.getAggiornatoIl());
  }

  private Pratica trovaVisibile(UUID id) {
    var pratica = pratiche.findByIdAndStudioIdAndEliminatoIlIsNull(id, tenant.studioId())
      .orElseThrow(() -> errore(HttpStatus.NOT_FOUND, "PRATICA_NON_TROVATA"));
    if (pratica.isRiservata() && !amministratore() && !pratica.getResponsabileId().equals(tenant.userId())
      && !membroTeam(pratica.getId(), tenant.userId())) throw errore(HttpStatus.NOT_FOUND, "PRATICA_NON_TROVATA");
    return pratica;
  }

  void validaDati(Pratica.Dati dati) {
    if (dati == null || pulisci(dati.titolo()) == null || dati.titolo().length() > 240 || dati.dataApertura() == null) {
      throw errore(HttpStatus.BAD_REQUEST, "PRATICA_DATI_NON_VALIDI");
    }
    validaCatalogo("materia_pratica", dati.materiaCodice(), "PRATICA_MATERIA_NON_VALIDA");
    validaCatalogo("tipologia_pratica", dati.tipologiaCodice(), "PRATICA_TIPOLOGIA_NON_VALIDA");
    validaCatalogo("priorita_pratica", dati.prioritaCodice(), "PRATICA_PRIORITA_NON_VALIDA");
    if (dati.valoreEconomico() != null && dati.valoreEconomico().signum() < 0) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_VALORE_NON_VALIDO");
    if (dati.valuta() != null && !dati.valuta().matches("[A-Za-z]{3}")) throw errore(HttpStatus.BAD_REQUEST, "PRATICA_DATI_NON_VALIDI");
  }

  private void validaResponsabile(UUID utenteId) {
    if (utenteId == null) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_RESPONSABILE_NON_VALIDO");
    validaMembro(utenteId);
  }

  private void validaMembro(UUID utenteId) {
    var count = database.queryForObject("SELECT COUNT(*) FROM studio_membership WHERE studio_id=? AND user_id=? AND status='ACTIVE'",
      Integer.class, tenant.studioId(), utenteId);
    if (count == null || count == 0) throw errore(HttpStatus.NOT_FOUND, "PRATICA_TEAM_NON_VALIDO");
  }

  void validaSoggetto(DatiSoggetto dati) {
    if (dati == null || dati.soggettoId() == null || pulisci(dati.ruoloCodice()) == null) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_SOGGETTO_NON_VALIDO");
    var count = database.queryForObject("SELECT COUNT(*) FROM soggetto WHERE id=? AND studio_id=? AND eliminato_il IS NULL AND stato='ATTIVO'",
      Integer.class, dati.soggettoId(), tenant.studioId());
    if (count == null || count == 0) throw errore(HttpStatus.NOT_FOUND, "PRATICA_SOGGETTO_NON_VALIDO");
    var ruolo = database.queryForObject("SELECT COUNT(*) FROM ruolo_soggetto_pratica WHERE codice=? AND attivo=TRUE", Integer.class, dati.ruoloCodice());
    if (ruolo == null || ruolo == 0) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_SOGGETTO_NON_VALIDO");
    if ("ALTRO".equals(dati.ruoloCodice()) && pulisci(dati.descrizioneRuoloAltro()) == null) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_SOGGETTO_ALTRO_SENZA_DESCRIZIONE");
    }
  }

  private void validaAttivita(DatiAttivita dati) {
    if (dati == null || pulisci(dati.titolo()) == null || !STATI_ATTIVITA.contains(dati.statoCodice()) || !PRIORITA.contains(dati.prioritaCodice())) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_ATTIVITA_NON_VALIDA");
    }
    if (dati.assegnatarioId() != null) validaMembro(dati.assegnatarioId());
  }

  private void validaComunicazione(DatiComunicazione dati) {
    if (dati == null || !TIPI_COMUNICAZIONE.contains(dati.tipo()) || pulisci(dati.oggetto()) == null) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_COMUNICAZIONE_NON_VALIDA");
    }
  }

  private void validaCatalogo(String tabella, String codice, String errore) {
    if (codice == null) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, errore);
    var count = database.queryForObject("SELECT COUNT(*) FROM " + tabella + " WHERE codice=? AND attivo=TRUE", Integer.class, codice);
    if (count == null || count == 0) throw errore(HttpStatus.UNPROCESSABLE_ENTITY, errore);
  }

  private String generaCodice(int anno) {
    var progressivo = database.queryForObject("""
      INSERT INTO contatore_pratica(studio_id,anno,ultimo_valore,aggiornato_il) VALUES (?,?,1,NOW())
      ON CONFLICT (studio_id,anno) DO UPDATE SET ultimo_valore=contatore_pratica.ultimo_valore+1,aggiornato_il=NOW()
      RETURNING ultimo_valore
      """, Integer.class, tenant.studioId(), anno);
    return "PRA-%d-%05d".formatted(anno, progressivo);
  }

  private void collegaResponsabile(UUID praticaId, UUID utenteId) {
    database.update("""
      INSERT INTO pratica_utente(id,studio_id,pratica_id,utente_id,ruolo_team_codice,principale,creato_il,creato_da,aggiornato_il,aggiornato_da)
      VALUES (?,?,?,?, 'RESPONSABILE',TRUE,NOW(),?,NOW(),?)
      """, UUID.randomUUID(), tenant.studioId(), praticaId, utenteId, tenant.userId(), tenant.userId());
  }

  private void inserisciSoggetto(UUID praticaId, DatiSoggetto dati) {
    try {
      database.update("""
        INSERT INTO pratica_soggetto(id,studio_id,pratica_id,soggetto_id,ruolo_codice,principale,descrizione_ruolo_altro,note,
        creato_il,creato_da,aggiornato_il,aggiornato_da) VALUES (?,?,?,?,?,?,?,?,NOW(),?,NOW(),?)
        """, UUID.randomUUID(), tenant.studioId(), praticaId, dati.soggettoId(), dati.ruoloCodice(), dati.principale(),
        pulisci(dati.descrizioneRuoloAltro()), pulisci(dati.note()), tenant.userId(), tenant.userId());
    } catch (DataIntegrityViolationException e) {
      throw errore(HttpStatus.CONFLICT, "PRATICA_SOGGETTO_DUPLICATO");
    }
  }

  private void inserisciTeam(UUID praticaId, DatiTeam dati) {
    if (dati == null || dati.utenteId() == null || !RUOLI_TEAM.contains(dati.ruoloTeamCodice()) || "RESPONSABILE".equals(dati.ruoloTeamCodice())) {
      throw errore(HttpStatus.UNPROCESSABLE_ENTITY, "PRATICA_TEAM_NON_VALIDO");
    }
    validaMembro(dati.utenteId());
    try {
      database.update("""
        INSERT INTO pratica_utente(id,studio_id,pratica_id,utente_id,ruolo_team_codice,principale,creato_il,creato_da,aggiornato_il,aggiornato_da)
        VALUES (?,?,?,?,?,?,NOW(),?,NOW(),?)
        """, UUID.randomUUID(), tenant.studioId(), praticaId, dati.utenteId(), dati.ruoloTeamCodice(), dati.principale(), tenant.userId(), tenant.userId());
    } catch (DataIntegrityViolationException e) {
      throw errore(HttpStatus.CONFLICT, "PRATICA_TEAM_NON_VALIDO");
    }
  }

  private void verificaVersione(Pratica pratica, long versione) {
    if (pratica.getVersion() != versione) throw errore(HttpStatus.PRECONDITION_FAILED, "PRATICA_VERSIONE_CONFLITTO");
  }
  private void verificaOperativa(Pratica pratica) {
    if ("ARCHIVIATA".equals(pratica.getStatoCodice())) throw errore(HttpStatus.CONFLICT, "PRATICA_ARCHIVIATA_NON_MODIFICABILE");
  }
  private long contaClienti(UUID praticaId) {
    return Optional.ofNullable(database.queryForObject("SELECT COUNT(*) FROM pratica_soggetto WHERE studio_id=? AND pratica_id=? AND ruolo_codice='CLIENTE' AND eliminato_il IS NULL",
      Long.class, tenant.studioId(), praticaId)).orElse(0L);
  }
  private boolean soggettoCollegato(UUID praticaId, UUID soggettoId) {
    var count = database.queryForObject("SELECT COUNT(*) FROM pratica_soggetto WHERE studio_id=? AND pratica_id=? AND soggetto_id=? AND eliminato_il IS NULL",
      Integer.class, tenant.studioId(), praticaId, soggettoId);
    return count != null && count > 0;
  }
  private boolean membroTeam(UUID praticaId, UUID utenteId) {
    var count = database.queryForObject("SELECT COUNT(*) FROM pratica_utente WHERE studio_id=? AND pratica_id=? AND utente_id=? AND eliminato_il IS NULL",
      Integer.class, tenant.studioId(), praticaId, utenteId);
    return count != null && count > 0;
  }
  private boolean amministratore() {
    return database.query("SELECT role FROM studio_membership WHERE studio_id=? AND user_id=? AND status='ACTIVE'",
      rs -> rs.next() && Set.of("STUDIO_ADMIN","OWNER").contains(rs.getString(1)), tenant.studioId(), tenant.userId());
  }
  private String nomeUtente(UUID id) {
    return database.query("SELECT display_name FROM user_account WHERE id=?", rs -> rs.next() ? rs.getString(1) : "Collaboratore", id);
  }
  private String nomiRuolo(UUID praticaId, String ruolo) {
    return database.query("""
      SELECT STRING_AGG(COALESCE(s.denominazione,TRIM(COALESCE(s.nome,'')||' '||COALESCE(s.cognome,''))),', ' ORDER BY ps.principale DESC)
      FROM pratica_soggetto ps JOIN soggetto s ON s.id=ps.soggetto_id
      WHERE ps.pratica_id=? AND ps.ruolo_codice=? AND ps.eliminato_il IS NULL AND s.eliminato_il IS NULL
      """, rs -> rs.next() ? Optional.ofNullable(rs.getString(1)).orElse("") : "", praticaId, ruolo);
  }
  private Map<String,Object> relazione(UUID praticaId, UUID relazioneId, String tabella) {
    if (!Set.of("pratica_soggetto","pratica_utente","attivita_pratica","comunicazione_pratica").contains(tabella)) throw new IllegalArgumentException();
    var righe = database.queryForList("SELECT * FROM " + tabella + " WHERE studio_id=? AND pratica_id=? AND id=? AND eliminato_il IS NULL",
      tenant.studioId(), praticaId, relazioneId);
    if (righe.isEmpty()) throw errore(HttpStatus.NOT_FOUND, "PRATICA_NON_TROVATA");
    return righe.getFirst();
  }
  private void visibilita(StringBuilder dove, List<Object> parametri) {
    dove.append(" AND (? OR p.riservata=FALSE OR p.responsabile_id=? OR EXISTS (SELECT 1 FROM pratica_utente pv WHERE pv.pratica_id=p.id AND pv.utente_id=? AND pv.eliminato_il IS NULL))");
    parametri.add(amministratore()); parametri.add(tenant.userId()); parametri.add(tenant.userId());
  }
  private void aggiungiFiltro(StringBuilder dove, List<Object> parametri, String campo, Object valore) {
    if (valore != null) { dove.append(" AND ").append(campo).append("=?"); parametri.add(valore); }
  }
  private void timeline(UUID praticaId, String tipo, String titolo, String entitaTipo, UUID entitaId) {
    database.update("""
      INSERT INTO pratica_timeline(id,studio_id,pratica_id,tipo_evento,titolo,descrizione_sintetica,actor_id,entita_tipo,entita_id,avvenuto_il,metadata)
      VALUES (?,?,?,?,?,NULL,?,?,?,?,?::jsonb)
      """, UUID.randomUUID(), tenant.studioId(), praticaId, tipo, titolo, tenant.userId(), entitaTipo, entitaId,
      Timestamp.from(Instant.now()), "{}");
  }
  private void audit(String azione, UUID id) {
    database.update("""
      INSERT INTO audit_event(id,studio_id,actor_id,action,entity_type,entity_id,outcome,correlation_id,occurred_at,metadata)
      VALUES (?,?,?,?,?,?,?,?,?,?::jsonb)
      """, UUID.randomUUID(),tenant.studioId(),tenant.userId(),azione,"PRATICA",id,"SUCCESS",UUID.randomUUID(),Timestamp.from(Instant.now()),"{}");
  }
  private void auditSoggetto(String azione, UUID id) {
    database.update("""
      INSERT INTO audit_event(id,studio_id,actor_id,action,entity_type,entity_id,outcome,correlation_id,occurred_at,metadata)
      VALUES (?,?,?,?,?,?,?,?,?,?::jsonb)
      """, UUID.randomUUID(),tenant.studioId(),tenant.userId(),azione,"SOGGETTO",id,"SUCCESS",UUID.randomUUID(),Timestamp.from(Instant.now()),"{}");
  }
  private Map<String,Object> mappaRiga(ResultSet rs) throws SQLException {
    var metadata = rs.getMetaData();
    var risultato = new LinkedHashMap<String,Object>();
    for (int i = 1; i <= metadata.getColumnCount(); i++) risultato.put(metadata.getColumnLabel(i), rs.getObject(i));
    return risultato;
  }
  private static String pulisci(String valore) { return valore == null || valore.isBlank() ? null : valore.trim(); }
  private static String testo(Map<String,Object> dati, String chiave) { return dati.get(chiave) == null ? null : pulisci(String.valueOf(dati.get(chiave))); }
  private static Integer numero(Object valore) { return valore == null || String.valueOf(valore).isBlank() ? null : new BigDecimal(String.valueOf(valore)).intValueExact(); }
  private static Long numeroLungo(Object valore) { return valore == null || String.valueOf(valore).isBlank() ? null : new BigDecimal(String.valueOf(valore)).longValueExact(); }
  private static BigDecimal decimale(Object valore) { return valore == null || String.valueOf(valore).isBlank() ? BigDecimal.ZERO : new BigDecimal(String.valueOf(valore)); }
  private static LocalDate data(Object valore) { return valore == null || String.valueOf(valore).isBlank() ? null : LocalDate.parse(String.valueOf(valore)); }
  private static ResponseStatusException errore(HttpStatus stato, String codice) { return new ResponseStatusException(stato, codice); }
}
