package it.foro.anagrafiche.api;

import it.foro.anagrafiche.application.AnagraficheService;
import it.foro.anagrafiche.domain.Soggetto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/anagrafiche")
public class AnagraficheController {
  private final AnagraficheService servizio; private final JdbcTemplate database;
  public AnagraficheController(AnagraficheService servizio,JdbcTemplate database){this.servizio=servizio;this.database=database;}

  @GetMapping public Page<Risposta> elenco(@RequestParam(required=false) String ricerca,@RequestParam(required=false) String tipo,
    @RequestParam(required=false) String stato,@RequestParam(defaultValue="0") @Min(0) int pagina,@RequestParam(defaultValue="20") @Min(1) @Max(100) int dimensione,
    @RequestParam(defaultValue="aggiornatoIl") String ordinamento,@RequestParam(defaultValue="desc") String direzione){
    var campi=Set.of("aggiornatoIl","creatoIl","nome","cognome","denominazione","stato","tipoCodice");
    var campo=campi.contains(ordinamento)?ordinamento:"aggiornatoIl";var verso="asc".equalsIgnoreCase(direzione)?Sort.Direction.ASC:Sort.Direction.DESC;
    return servizio.elenco(ricerca,tipo,stato,PageRequest.of(pagina,dimensione,Sort.by(verso,campo))).map(this::risposta);
  }
  @GetMapping("/{id}") public Risposta dettaglio(@PathVariable UUID id){return risposta(servizio.dettaglio(id));}
  @PostMapping public Risposta crea(@Valid @RequestBody Richiesta r){return risposta(servizio.crea(r.dati()));}
  @PutMapping("/{id}") public Risposta modifica(@PathVariable UUID id,@Valid @RequestBody Richiesta r){return risposta(servizio.modifica(id,r.version(),r.dati()));}
  @DeleteMapping("/{id}") public void elimina(@PathVariable UUID id){servizio.elimina(id);}
  @PostMapping("/verifica-duplicati") public List<RispostaSintetica> duplicati(@Valid @RequestBody Richiesta r){
    return servizio.duplicati(r.id(),r.dati()).stream().map(this::sintetica).toList();
  }
  @GetMapping("/cataloghi/tipi-soggetto") public List<Catalogo> tipi(){return catalogo("tipo_soggetto");}
  @GetMapping("/cataloghi/ruoli-pratica") public List<Catalogo> ruoli(){return catalogo("ruolo_soggetto_pratica");}
  private List<Catalogo> catalogo(String tabella){return database.query("SELECT codice,descrizione,ordine FROM "+tabella+" WHERE attivo=TRUE ORDER BY ordine",(rs,n)->new Catalogo(rs.getString(1),rs.getString(2),rs.getInt(3)));}

  public record Catalogo(String codice,String descrizione,int ordine){}
  public record Richiesta(UUID id,long version,@NotBlank @Size(max=40) String tipoCodice,@Size(max=120) String nome,@Size(max=120) String cognome,
    LocalDate dataNascita,@Size(max=160) String luogoNascita,@Pattern(regexp="^$|[A-Za-z]{2}$") String provinciaNascita,@Size(max=80) String statoNascita,
    @Size(max=240) String denominazione,@Size(max=120) String formaGiuridica,@Size(max=24) String codiceFiscale,@Size(max=20) String partitaIva,
    @Email @Size(max=320) String email,@Email @Size(max=320) String pec,@Size(max=40) String telefono,@Size(max=40) String cellulare,
    @Size(max=240) String indirizzo,@Size(max=20) String civico,@Size(max=10) String cap,@Size(max=120) String comune,
    @Pattern(regexp="^$|[A-Za-z]{2}$") String provincia,@Size(max=80) String statoIndirizzo,@Size(max=4000) String note,@NotBlank String stato){
    Soggetto.Dati dati(){return new Soggetto.Dati(tipoCodice,nome,cognome,dataNascita,luogoNascita,provinciaNascita,statoNascita,denominazione,formaGiuridica,codiceFiscale,partitaIva,email,pec,telefono,cellulare,indirizzo,civico,cap,comune,provincia,statoIndirizzo,note,stato);}
  }
  public record Risposta(UUID id,String tipoCodice,String nome,String cognome,LocalDate dataNascita,String luogoNascita,String provinciaNascita,String statoNascita,
    String denominazione,String formaGiuridica,String codiceFiscale,String partitaIva,String email,String pec,String telefono,String cellulare,String indirizzo,String civico,
    String cap,String comune,String provincia,String statoIndirizzo,String note,String stato,long version,Instant creatoIl,Instant aggiornatoIl){}
  public record RispostaSintetica(UUID id,String nomeVisualizzato,String tipoCodice,String stato){}
  private Risposta risposta(Soggetto s){return new Risposta(s.getId(),s.getTipoCodice(),s.getNome(),s.getCognome(),s.getDataNascita(),s.getLuogoNascita(),s.getProvinciaNascita(),s.getStatoNascita(),s.getDenominazione(),s.getFormaGiuridica(),s.getCodiceFiscale(),s.getPartitaIva(),s.getEmail(),s.getPec(),s.getTelefono(),s.getCellulare(),s.getIndirizzo(),s.getCivico(),s.getCap(),s.getComune(),s.getProvincia(),s.getStatoIndirizzo(),s.getNote(),s.getStato(),s.getVersion(),s.getCreatoIl(),s.getAggiornatoIl());}
  private RispostaSintetica sintetica(Soggetto s){return new RispostaSintetica(s.getId(),s.getDenominazione()!=null?s.getDenominazione():s.getNome()+" "+s.getCognome(),s.getTipoCodice(),s.getStato());}
}
