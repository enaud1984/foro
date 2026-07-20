package it.foro.calendario.api;

import it.foro.calendario.domain.*;
import it.foro.calendario.repository.*;
import it.foro.platform.security.TenantContext;
import it.foro.identity.repository.*;
import it.foro.calendario.application.InvitoEventoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/calendario")
public class CalendarioController {
  private final TenantContext tenant; private final CalendarioRepository calendari; private final EventoCalendarioRepository eventi; private final CalendarioCondivisioneRepository condivisioni; private final StudioMembershipRepository membership; private final UserAccountRepository utenti; private final InvitoEventoService invitoService; private final JdbcTemplate database;
  public CalendarioController(TenantContext tenant, CalendarioRepository calendari, EventoCalendarioRepository eventi, CalendarioCondivisioneRepository condivisioni, StudioMembershipRepository membership, UserAccountRepository utenti,InvitoEventoService invitoService,JdbcTemplate database){this.tenant=tenant;this.calendari=calendari;this.eventi=eventi;this.condivisioni=condivisioni;this.membership=membership;this.utenti=utenti;this.invitoService=invitoService;this.database=database;}
  public record CalendarioResponse(UUID id,String nome,String colore,boolean condivisoTuttoStudio,List<UUID> condivisoCon,boolean gestibile){}
  public record PersonaStudioResponse(UUID id,String nome){}
  public record EventoResponse(UUID id,UUID calendarioId,UUID creatoreId,String calendarioNome,String colore,String titolo,Instant inizio,Instant fine,String luogo,String note,String partecipanti,String statoDisponibilita,Integer promemoriaMinuti,String categoria,boolean tuttoGiorno,UUID serieId,String ricorrenza,LocalDate fineRicorrenza){}
  public record RichiestaCalendario(@NotBlank @Size(max=160) String nome,@Pattern(regexp="^#[0-9a-fA-F]{6}$") String colore,List<UUID> condivisoCon){}
  public record CreaEventoRequest(@NotNull UUID calendarioId,@NotBlank @Size(max=240) String titolo,@NotNull Instant inizio,@NotNull Instant fine,@Size(max=4000) String note,List<UUID> invitatiIds,@Pattern(regexp="LIBERO|PROVVISORIO|OCCUPATO|FUORI_SEDE") String statoDisponibilita,@Min(0) @Max(40320) Integer promemoriaMinuti,@Size(max=60) String categoria,boolean tuttoGiorno,@Pattern(regexp="NESSUNA|GIORNALIERA|SETTIMANALE|MENSILE") String ricorrenza,LocalDate fineRicorrenza){}

  @GetMapping("/calendari")
  public List<CalendarioResponse> calendari(){
    var tutti=calendari.findAllByStudioIdAndEliminatoIlIsNullOrderByNome(tenant.studioId()); var quote=condivisioni.findAllByCalendarioIdIn(tutti.stream().map(Calendario::getId).toList());
    return tutti.stream().filter(c->puoVedere(c,quote)).map(c->risposta(c,quote.stream().filter(q->q.getCalendarioId().equals(c.getId())).map(CalendarioCondivisione::getUserId).toList())).toList();
  }
  @GetMapping("/persone")
  public List<PersonaStudioResponse> persone(){var ids=membership.findAllByStudioIdAndStatus(tenant.studioId(),"ACTIVE").stream().map(m->m.getUserId()).toList();return utenti.findAllById(ids).stream().map(u->new PersonaStudioResponse(u.getId(),u.getDisplayName())).toList();}
  @PostMapping("/calendari") @ResponseStatus(HttpStatus.CREATED) @Transactional
  public CalendarioResponse creaCalendario(@Valid @RequestBody RichiestaCalendario r){
    var ammessi=membership.findAllByStudioIdAndStatus(tenant.studioId(),"ACTIVE").stream().map(m->m.getUserId()).collect(java.util.stream.Collectors.toSet());
    var destinatari=Optional.ofNullable(r.condivisoCon()).orElse(List.of()).stream().filter(ammessi::contains).distinct().toList();
    if(destinatari.size()!=Optional.ofNullable(r.condivisoCon()).orElse(List.of()).stream().distinct().count()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"UTENTE_NON_APPARTIENE_ALLO_STUDIO");
    var c=calendari.save(new Calendario(tenant.studioId(),tenant.userId(),r.nome().trim(),Optional.ofNullable(r.colore()).orElse("#d97706"),false));
    condivisioni.saveAll(destinatari.stream().map(id->new CalendarioCondivisione(c.getId(),tenant.studioId(),id)).toList()); registraAudit("CALENDARIO_CREATO",c.getId()); return risposta(c,destinatari);
  }
  @PutMapping("/calendari/{id}") @Transactional
  public CalendarioResponse aggiornaCalendario(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaCalendario r){
    var calendario=calendarioGestibile(id); var destinatari=destinatariAmmessi(r.condivisoCon());
    calendario.aggiorna(r.nome().trim(),Optional.ofNullable(r.colore()).orElse("#d97706"));
    condivisioni.deleteAllByCalendarioId(calendario.getId());
    condivisioni.saveAll(destinatari.stream().map(utenteId->new CalendarioCondivisione(calendario.getId(),tenant.studioId(),utenteId)).toList());
    registraAudit("CALENDARIO_MODIFICATO",calendario.getId()); return risposta(calendario,destinatari);
  }
  @DeleteMapping("/calendari/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
  public void eliminaCalendario(@PathVariable("id") UUID id){var calendario=calendarioGestibile(id);calendario.elimina();registraAudit("CALENDARIO_ELIMINATO",calendario.getId());}
  @GetMapping("/eventi")
  public List<EventoResponse> eventi(@RequestParam("dal") LocalDate dal,@RequestParam("al") LocalDate al){
    if(!al.isAfter(dal)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"INTERVALLO_NON_VALIDO");
    var tutti=calendari.findAllByStudioIdAndEliminatoIlIsNullOrderByNome(tenant.studioId()); var quote=condivisioni.findAllByCalendarioIdIn(tutti.stream().map(Calendario::getId).toList());
    var mappa=tutti.stream().filter(c->puoVedere(c,quote)).collect(java.util.stream.Collectors.toMap(Calendario::getId,c->c));
    var zona=ZoneId.of("Europe/Rome");
    return eventi.findAllByStudioIdAndInizioLessThanAndFineGreaterThanOrderByInizio(tenant.studioId(),al.atStartOfDay(zona).toInstant(),dal.atStartOfDay(zona).toInstant()).stream().filter(e->mappa.containsKey(e.getCalendarioId())).map(e->risposta(e,mappa.get(e.getCalendarioId()))).toList();
  }
  @PostMapping("/eventi") @ResponseStatus(HttpStatus.CREATED) @Transactional
  public EventoResponse creaEvento(@Valid @RequestBody CreaEventoRequest r){
    if(!r.fine().isAfter(r.inizio())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"INTERVALLO_NON_VALIDO");
    var calendario=calendari.findByIdAndStudioIdAndEliminatoIlIsNull(r.calendarioId(),tenant.studioId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"CALENDARIO_NON_TROVATO"));
    var quote=condivisioni.findAllByCalendarioIdIn(List.of(calendario.getId()));
    if(!puoVedere(calendario,quote)) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"CALENDARIO_NON_TROVATO");
    var frequenza=Optional.ofNullable(r.ricorrenza()).orElse("NESSUNA");
    if(!frequenza.equals("NESSUNA")&&r.fineRicorrenza()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"FINE_SERIE_OBBLIGATORIA");
    var serieId=frequenza.equals("NESSUNA")?null:UUID.randomUUID(); var inizio=r.inizio(); var fine=r.fine(); EventoCalendario evento=null; int occorrenze=0;
    do {
      evento=eventi.save(new EventoCalendario(tenant.studioId(),calendario.getId(),tenant.userId(),r.titolo().trim(),inizio,fine,null,r.note(),"",Optional.ofNullable(r.statoDisponibilita()).orElse("OCCUPATO"),r.promemoriaMinuti(),r.categoria(),r.tuttoGiorno(),serieId,frequenza,r.fineRicorrenza())); occorrenze++;
      if(frequenza.equals("GIORNALIERA")){inizio=inizio.plus(1,java.time.temporal.ChronoUnit.DAYS);fine=fine.plus(1,java.time.temporal.ChronoUnit.DAYS);}
      else if(frequenza.equals("SETTIMANALE")){inizio=inizio.plus(7,java.time.temporal.ChronoUnit.DAYS);fine=fine.plus(7,java.time.temporal.ChronoUnit.DAYS);}
      else if(frequenza.equals("MENSILE")){var z=ZoneId.of("Europe/Rome");inizio=inizio.atZone(z).plusMonths(1).toInstant();fine=fine.atZone(z).plusMonths(1).toInstant();}
      else break;
    } while(inizio.atZone(ZoneId.of("Europe/Rome")).toLocalDate().compareTo(r.fineRicorrenza())<=0&&occorrenze<366);
    invitoService.invia(tenant.studioId(),evento,Optional.ofNullable(r.invitatiIds()).orElse(List.of())); return risposta(evento,calendario);
  }
  @PutMapping("/eventi/{id}") @Transactional
  public EventoResponse aggiornaEvento(@PathVariable("id") UUID id,@Valid @RequestBody CreaEventoRequest r){
    if(!r.fine().isAfter(r.inizio())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"INTERVALLO_NON_VALIDO");
    var evento=eventi.findByIdAndStudioId(id,tenant.studioId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"EVENTO_NON_TROVATO"));
    verificaAccessoEvento(evento);
    var calendario=calendari.findByIdAndStudioIdAndEliminatoIlIsNull(r.calendarioId(),tenant.studioId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"CALENDARIO_NON_TROVATO"));
    var quote=condivisioni.findAllByCalendarioIdIn(List.of(calendario.getId())); if(!puoVedere(calendario,quote)) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"CALENDARIO_NON_TROVATO");
    evento.aggiorna(calendario.getId(),r.titolo().trim(),r.inizio(),r.fine(),r.note(),Optional.ofNullable(r.statoDisponibilita()).orElse("OCCUPATO"),r.promemoriaMinuti(),r.categoria(),r.tuttoGiorno());
    return risposta(evento,calendario);
  }
  @DeleteMapping("/eventi/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
  public void eliminaEvento(@PathVariable("id") UUID id){var evento=eventi.findByIdAndStudioId(id,tenant.studioId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"EVENTO_NON_TROVATO"));verificaAccessoEvento(evento);eventi.delete(evento);}
  private CalendarioResponse risposta(Calendario c,List<UUID> condivisoCon){return new CalendarioResponse(c.getId(),c.getNome(),c.getColore(),c.isCondivisoTuttoStudio(),condivisoCon,c.getProprietarioId().equals(tenant.userId()));}
  private boolean puoVedere(Calendario c,List<CalendarioCondivisione> quote){return c.isCondivisoTuttoStudio()||c.getProprietarioId().equals(tenant.userId())||quote.stream().anyMatch(q->q.getCalendarioId().equals(c.getId())&&q.getUserId().equals(tenant.userId()));}
  private void verificaAccessoEvento(EventoCalendario evento){var calendario=calendari.findByIdAndStudioIdAndEliminatoIlIsNull(evento.getCalendarioId(),tenant.studioId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"EVENTO_NON_TROVATO"));if(!puoVedere(calendario,condivisioni.findAllByCalendarioIdIn(List.of(calendario.getId()))))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"EVENTO_NON_TROVATO");}
  private EventoResponse risposta(EventoCalendario e,Calendario c){return new EventoResponse(e.getId(),e.getCalendarioId(),e.getCreatoreId(),c.getNome(),c.getColore(),e.getTitolo(),e.getInizio(),e.getFine(),e.getLuogo(),e.getNote(),e.getPartecipanti(),e.getStatoDisponibilita(),e.getPromemoriaMinuti(),e.getCategoria(),e.isTuttoGiorno(),e.getSerieId(),e.getRicorrenza(),e.getFineRicorrenza());}
  private Calendario calendarioGestibile(UUID id){var calendario=calendari.findByIdAndStudioIdAndEliminatoIlIsNull(id,tenant.studioId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"CALENDARIO_NON_TROVATO"));if(!calendario.getProprietarioId().equals(tenant.userId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"CALENDARIO_NON_GESTIBILE");return calendario;}
  private List<UUID> destinatariAmmessi(List<UUID> richiesti){var elenco=Optional.ofNullable(richiesti).orElse(List.of());var ammessi=membership.findAllByStudioIdAndStatus(tenant.studioId(),"ACTIVE").stream().map(m->m.getUserId()).collect(java.util.stream.Collectors.toSet());var destinatari=elenco.stream().filter(ammessi::contains).distinct().toList();if(destinatari.size()!=elenco.stream().distinct().count())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"UTENTE_NON_APPARTIENE_ALLO_STUDIO");return destinatari;}
  private void registraAudit(String azione,UUID entita){database.update("INSERT INTO audit_event(id,studio_id,actor_id,action,entity_type,entity_id,outcome,correlation_id,occurred_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?::jsonb)",UUID.randomUUID(),tenant.studioId(),tenant.userId(),azione,"CALENDARIO",entita,"SUCCESS",UUID.randomUUID(),java.sql.Timestamp.from(Instant.now()),"{}");}
}
