package it.foro.anagrafiche.application;

import it.foro.anagrafiche.domain.Soggetto;
import it.foro.anagrafiche.repository.SoggettoRepository;
import it.foro.platform.security.TenantContext;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AnagraficheService {
  public static final Set<String> TIPI=Set.of("PERSONA_FISICA","PERSONA_GIURIDICA","DITTA_INDIVIDUALE","ENTE_ASSOCIAZIONE","CONDOMINIO","PUBBLICA_AMMINISTRAZIONE","ALTRO");
  private static final Set<String> STATI=Set.of("ATTIVO","DISATTIVATO");
  private static final Pattern CF=Pattern.compile("(?:[A-Z0-9]{11}|[A-Z]{6}[A-Z0-9]{2}[ABCDEHLMPRST][A-Z0-9]{2}[A-Z][A-Z0-9]{3}[A-Z])");
  private static final Pattern PIVA=Pattern.compile("\\d{11}");
  private static final Pattern EMAIL=Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private final SoggettoRepository repository; private final TenantContext tenant; private final JdbcTemplate database;
  public AnagraficheService(SoggettoRepository repository,TenantContext tenant,JdbcTemplate database){this.repository=repository;this.tenant=tenant;this.database=database;}

  @Transactional(readOnly=true)
  public Page<Soggetto> elenco(String ricerca,String tipo,String stato,Pageable pagina){
    if(tipo!=null&&!TIPI.contains(tipo))throw errore(HttpStatus.BAD_REQUEST,"ANAGRAFICA_TIPO_NON_VALIDO");
    if(stato!=null&&!STATI.contains(stato))throw errore(HttpStatus.BAD_REQUEST,"ANAGRAFICA_DATI_NON_COHERENTI");
    return repository.cerca(tenant.studioId(),Optional.ofNullable(vuotoANull(ricerca)).orElse("").toLowerCase(),tipo,stato,pagina);
  }
  @Transactional(readOnly=true) public Soggetto dettaglio(UUID id){return trova(id);}
  @Transactional public Soggetto crea(Soggetto.Dati dati){valida(dati);var s=new Soggetto(tenant.studioId(),tenant.userId());s.aggiorna(dati,tenant.userId());repository.save(s);audit("ANAGRAFICA_CREATA",s.getId());return s;}
  @Transactional public Soggetto modifica(UUID id,long versione,Soggetto.Dati dati){
    valida(dati);var s=trova(id);if(s.getVersion()!=versione)throw errore(HttpStatus.PRECONDITION_FAILED,"ANAGRAFICA_VERSIONE_CONFLITTO");
    var prima=s.getStato();s.aggiorna(dati,tenant.userId());audit(!prima.equals(s.getStato())&&"DISATTIVATO".equals(s.getStato())?"ANAGRAFICA_DISATTIVATA":"ANAGRAFICA_MODIFICATA",s.getId());return s;
  }
  @Transactional public void elimina(UUID id){var s=trova(id);s.elimina(tenant.userId());audit("ANAGRAFICA_ELIMINATA",s.getId());}
  @Transactional(readOnly=true) public List<Soggetto> duplicati(UUID escluso,Soggetto.Dati d){
    return repository.duplicati(tenant.studioId(),escluso,Soggetto.normalizzaCodiceFiscale(d.codiceFiscale()),Soggetto.normalizzaPartitaIva(d.partitaIva()),
      Soggetto.normalizzaTesto(d.nome()),Soggetto.normalizzaTesto(d.cognome()),d.dataNascita(),Soggetto.normalizzaTesto(d.denominazione())).stream().limit(10).toList();
  }
  private Soggetto trova(UUID id){return repository.findByIdAndStudioIdAndEliminatoIlIsNull(id,tenant.studioId()).orElseThrow(()->errore(HttpStatus.NOT_FOUND,"ANAGRAFICA_NON_TROVATA"));}
  void valida(Soggetto.Dati d){
    if(d.tipoCodice()==null||!TIPI.contains(d.tipoCodice()))throw errore(HttpStatus.BAD_REQUEST,"ANAGRAFICA_TIPO_NON_VALIDO");
    if(!STATI.contains(d.stato()))throw errore(HttpStatus.BAD_REQUEST,"ANAGRAFICA_DATI_NON_COHERENTI");
    if("PERSONA_FISICA".equals(d.tipoCodice())&&(vuotoANull(d.nome())==null||vuotoANull(d.cognome())==null))throw errore(HttpStatus.UNPROCESSABLE_ENTITY,"ANAGRAFICA_DATI_NON_COHERENTI");
    if(!"PERSONA_FISICA".equals(d.tipoCodice())&&vuotoANull(d.denominazione())==null)throw errore(HttpStatus.UNPROCESSABLE_ENTITY,"ANAGRAFICA_DATI_NON_COHERENTI");
    var cf=Soggetto.normalizzaCodiceFiscale(d.codiceFiscale());if(cf!=null&&!CF.matcher(cf).matches())throw errore(HttpStatus.UNPROCESSABLE_ENTITY,"ANAGRAFICA_CODICE_FISCALE_NON_VALIDO");
    var piva=Soggetto.normalizzaPartitaIva(d.partitaIva());if(piva!=null&&!PIVA.matcher(piva).matches())throw errore(HttpStatus.UNPROCESSABLE_ENTITY,"ANAGRAFICA_PARTITA_IVA_NON_VALIDA");
    if(d.email()!=null&&!d.email().isBlank()&&!EMAIL.matcher(d.email()).matches())throw errore(HttpStatus.BAD_REQUEST,"ANAGRAFICA_DATI_NON_COHERENTI");
    if(d.pec()!=null&&!d.pec().isBlank()&&!EMAIL.matcher(d.pec()).matches())throw errore(HttpStatus.BAD_REQUEST,"ANAGRAFICA_DATI_NON_COHERENTI");
    if(d.cap()!=null&&!d.cap().isBlank()&&!d.cap().matches("[A-Za-z0-9 -]{3,10}"))throw errore(HttpStatus.BAD_REQUEST,"ANAGRAFICA_DATI_NON_COHERENTI");
  }
  private void audit(String azione,UUID id){database.update("INSERT INTO audit_event(id,studio_id,actor_id,action,entity_type,entity_id,outcome,correlation_id,occurred_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?::jsonb)",UUID.randomUUID(),tenant.studioId(),tenant.userId(),azione,"SOGGETTO",id,"SUCCESS",UUID.randomUUID(),java.sql.Timestamp.from(Instant.now()),"{}");}
  private static String vuotoANull(String s){return s==null||s.isBlank()?null:s.trim();}
  private static ResponseStatusException errore(HttpStatus stato,String codice){return new ResponseStatusException(stato,codice);}
}
