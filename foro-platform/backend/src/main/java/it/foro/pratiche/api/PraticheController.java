package it.foro.pratiche.api;

import it.foro.pratiche.application.PraticheService;
import it.foro.pratiche.application.PraticheService.*;
import it.foro.pratiche.domain.Pratica;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/pratiche")
public class PraticheController {
  private final PraticheService servizio;
  public PraticheController(PraticheService servizio) { this.servizio = servizio; }

  public record RichiestaSoggetto(@NotNull UUID soggettoId, @NotBlank String ruoloCodice, boolean principale,
    @Size(max=240) String descrizioneRuoloAltro, @Size(max=4000) String note) {
    DatiSoggetto dati() { return new DatiSoggetto(soggettoId,ruoloCodice,principale,descrizioneRuoloAltro,note); }
  }
  public record RichiestaTeam(@NotNull UUID utenteId, @NotBlank String ruoloTeamCodice, boolean principale) {
    DatiTeam dati() { return new DatiTeam(utenteId,ruoloTeamCodice,principale); }
  }
  public record Richiesta(
    long version, @NotBlank @Size(max=240) String titolo, @Size(max=12000) String descrizione,
    @NotBlank String materiaCodice, @NotBlank String tipologiaCodice, @NotBlank String prioritaCodice,
    @NotNull UUID responsabileId, @DecimalMin("0.00") BigDecimal valoreEconomico,
    @Pattern(regexp="[A-Za-z]{3}") String valuta, boolean riservata, @NotNull LocalDate dataApertura,
    @Size(max=4000) String motivoAttesa, @Size(max=12000) String noteInterne, String stato,
    List<@Valid RichiestaSoggetto> soggetti, List<@Valid RichiestaTeam> team) {
    Pratica.Dati dati() { return new Pratica.Dati(titolo,descrizione,materiaCodice,tipologiaCodice,prioritaCodice,
      responsabileId,valoreEconomico,valuta,riservata,dataApertura,motivoAttesa,noteInterne); }
    RichiestaPratica completa() { return new RichiestaPratica(dati(),stato,
      Optional.ofNullable(soggetti).orElse(List.of()).stream().map(RichiestaSoggetto::dati).toList(),
      Optional.ofNullable(team).orElse(List.of()).stream().map(RichiestaTeam::dati).toList()); }
  }
  public record RichiestaVersione(@Min(0) long version) {}
  public record RichiestaDocumento(@NotBlank String titolo,@NotBlank String categoriaCodice,UUID soggettoId) {}
  public record RichiestaAttivita(long version,@NotBlank @Size(max=240) String titolo,@Size(max=12000) String descrizione,
    UUID assegnatarioId,@NotBlank String statoCodice,@NotBlank String prioritaCodice,LocalDate dataScadenza,UUID eventoCalendarioId) {
    DatiAttivita dati() { return new DatiAttivita(titolo,descrizione,assegnatarioId,statoCodice,prioritaCodice,dataScadenza,eventoCalendarioId); }
  }
  public record RichiestaComunicazione(long version,@NotBlank String tipo,@NotBlank @Size(max=240) String oggetto,
    @Size(max=12000) String descrizione,Instant dataComunicazione) {
    DatiComunicazione dati() { return new DatiComunicazione(tipo,oggetto,descrizione,dataComunicazione); }
  }

  @GetMapping("/cataloghi/materie") public List<Catalogo> materie() { return servizio.catalogo("materia_pratica"); }
  @GetMapping("/cataloghi/tipologie") public List<Catalogo> tipologie() { return servizio.catalogo("tipologia_pratica"); }
  @GetMapping("/cataloghi/stati") public List<Catalogo> stati() { return servizio.catalogo("stato_pratica"); }
  @GetMapping("/cataloghi/priorita") public List<Catalogo> priorita() { return servizio.catalogo("priorita_pratica"); }
  @GetMapping("/cataloghi/ruoli-team") public List<Catalogo> ruoliTeam() { return servizio.catalogo("ruolo_team_pratica"); }
  @GetMapping("/cataloghi/stati-attivita") public List<Catalogo> statiAttivita() { return servizio.catalogo("stato_attivita_pratica"); }
  @GetMapping("/cataloghi/priorita-attivita") public List<Catalogo> prioritaAttivita() { return servizio.catalogo("priorita_attivita_pratica"); }
  @GetMapping("/cataloghi/categorie-documenti") public List<Catalogo> categorieDocumenti() { return servizio.catalogo("categoria_documento_pratica"); }

  @GetMapping
  public Pagina elenco(@RequestParam(name="ricerca",required=false) String ricerca,
    @RequestParam(name="materia",required=false) String materia,@RequestParam(name="tipologia",required=false) String tipologia,
    @RequestParam(name="stato",required=false) String stato,@RequestParam(name="priorita",required=false) String priorita,
    @RequestParam(name="responsabile",required=false) UUID responsabile,@RequestParam(name="soggetto",required=false) UUID soggetto,
    @RequestParam(name="ruoloSoggetto",required=false) String ruoloSoggetto,
    @RequestParam(name="scadenzeImminenti",defaultValue="false") boolean scadenzeImminenti,
    @RequestParam(name="includiArchiviate",defaultValue="false") boolean includiArchiviate,
    @RequestParam(name="pagina",defaultValue="0") @Min(0) int pagina,
    @RequestParam(name="dimensione",defaultValue="20") @Min(1) @Max(100) int dimensione,
    @RequestParam(name="ordinamento",defaultValue="aggiornatoIl") String ordinamento,
    @RequestParam(name="direzione",defaultValue="desc") String direzione) {
    return servizio.elenco(ricerca,materia,tipologia,stato,priorita,responsabile,soggetto,ruoloSoggetto,
      scadenzeImminenti,includiArchiviate,pagina,dimensione,ordinamento,direzione);
  }
  @GetMapping("/{id}") public Dettaglio dettaglio(@PathVariable("id") UUID id) { return servizio.dettaglio(id); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Dettaglio crea(@Valid @RequestBody Richiesta richiesta) { return servizio.crea(richiesta.completa()); }
  @PutMapping("/{id}") public Dettaglio modifica(@PathVariable("id") UUID id,@Valid @RequestBody Richiesta richiesta) {
    return servizio.modifica(id,richiesta.version(),richiesta.dati());
  }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void elimina(@PathVariable("id") UUID id,@RequestParam("version") long version) { servizio.elimina(id,version); }

  @PostMapping("/{id}/apri") public Dettaglio apri(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaVersione r) { return servizio.cambiaStato(id,r.version(),"APERTA"); }
  @PostMapping("/{id}/metti-in-attesa") public Dettaglio attendi(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaVersione r) { return servizio.cambiaStato(id,r.version(),"IN_ATTESA"); }
  @PostMapping("/{id}/sospendi") public Dettaglio sospendi(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaVersione r) { return servizio.cambiaStato(id,r.version(),"SOSPESA"); }
  @PostMapping("/{id}/definisci") public Dettaglio definisci(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaVersione r) { return servizio.cambiaStato(id,r.version(),"DEFINITA"); }
  @PostMapping("/{id}/archivia") public Dettaglio archivia(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaVersione r) { return servizio.cambiaStato(id,r.version(),"ARCHIVIATA"); }
  @PostMapping("/{id}/riapri") public Dettaglio riapri(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaVersione r) { return servizio.cambiaStato(id,r.version(),"APERTA"); }

  @GetMapping("/{id}/soggetti") public List<Map<String,Object>> soggetti(@PathVariable("id") UUID id) { return servizio.soggetti(id); }
  @PostMapping("/{id}/soggetti") @ResponseStatus(HttpStatus.CREATED)
  public Map<String,Object> aggiungiSoggetto(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaSoggetto r) { return servizio.aggiungiSoggetto(id,r.dati()); }
  @PutMapping("/{id}/soggetti/{relazioneId}")
  public Map<String,Object> modificaSoggetto(@PathVariable("id") UUID id,@PathVariable("relazioneId") UUID relazioneId,
    @RequestParam("version") long version,@Valid @RequestBody RichiestaSoggetto r) { return servizio.modificaSoggetto(id,relazioneId,version,r.dati()); }
  @DeleteMapping("/{id}/soggetti/{relazioneId}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void rimuoviSoggetto(@PathVariable("id") UUID id,@PathVariable("relazioneId") UUID relazioneId) { servizio.rimuoviSoggetto(id,relazioneId); }

  @GetMapping("/{id}/team") public List<Map<String,Object>> team(@PathVariable("id") UUID id) { return servizio.team(id); }
  @PostMapping("/{id}/team") @ResponseStatus(HttpStatus.CREATED)
  public Map<String,Object> aggiungiTeam(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaTeam r) { return servizio.aggiungiTeam(id,r.dati()); }
  @PutMapping("/{id}/team/{relazioneId}")
  public Map<String,Object> modificaTeam(@PathVariable("id") UUID id,@PathVariable("relazioneId") UUID relazioneId,@Valid @RequestBody RichiestaTeam r) {
    return servizio.modificaTeam(id,relazioneId,r.dati());
  }
  @DeleteMapping("/{id}/team/{relazioneId}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void rimuoviTeam(@PathVariable("id") UUID id,@PathVariable("relazioneId") UUID relazioneId) { servizio.rimuoviTeam(id,relazioneId); }

  @GetMapping("/{id}/documenti")
  public List<Map<String,Object>> documenti(@PathVariable("id") UUID id,@RequestParam(name="categoria",required=false) String categoria) {
    return servizio.documenti(id,categoria);
  }
  @PostMapping(path="/{id}/documenti",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
  public Map<String,Object> caricaDocumento(@PathVariable("id") UUID id,@RequestPart("file") MultipartFile file,
    @RequestParam("categoriaCodice") String categoria,@RequestParam("titolo") String titolo,
    @RequestParam(name="soggettoId",required=false) UUID soggettoId,@RequestParam(name="origine",defaultValue="UPLOAD") String origine,
    @RequestParam(name="templateCodice",required=false) String templateCodice) {
    return servizio.caricaDocumento(id,categoria,titolo,soggettoId,origine,templateCodice,file);
  }
  @GetMapping("/{id}/documenti/{documentoId}") public Map<String,Object> documento(@PathVariable("id") UUID id,@PathVariable("documentoId") UUID documentoId) {
    return servizio.documento(id,documentoId,false);
  }
  @GetMapping("/{id}/documenti/{documentoId}/download")
  public ResponseEntity<byte[]> scarica(@PathVariable("id") UUID id,@PathVariable("documentoId") UUID documentoId) {
    var file=servizio.scaricaDocumento(id,documentoId);
    var nome=URLEncoder.encode(file.nomeFile(),StandardCharsets.UTF_8).replace("+","%20");
    return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.mimeType()))
      .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename*=UTF-8''"+nome).body(file.contenuto());
  }
  @PutMapping("/{id}/documenti/{documentoId}")
  public Map<String,Object> modificaDocumento(@PathVariable("id") UUID id,@PathVariable("documentoId") UUID documentoId,@Valid @RequestBody RichiestaDocumento r) {
    return servizio.modificaDocumento(id,documentoId,r.titolo(),r.categoriaCodice(),r.soggettoId());
  }
  @DeleteMapping("/{id}/documenti/{documentoId}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminaDocumento(@PathVariable("id") UUID id,@PathVariable("documentoId") UUID documentoId) { servizio.eliminaDocumento(id,documentoId); }

  @GetMapping("/{id}/attivita")
  public List<Map<String,Object>> attivita(@PathVariable("id") UUID id,@RequestParam(name="stato",required=false) String stato,
    @RequestParam(name="assegnatario",required=false) UUID assegnatario,@RequestParam(name="scadute",defaultValue="false") boolean scadute) {
    return servizio.attivita(id,stato,assegnatario,scadute);
  }
  @PostMapping("/{id}/attivita") @ResponseStatus(HttpStatus.CREATED)
  public Map<String,Object> creaAttivita(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaAttivita r) { return servizio.creaAttivita(id,r.dati()); }
  @PutMapping("/{id}/attivita/{attivitaId}")
  public Map<String,Object> modificaAttivita(@PathVariable("id") UUID id,@PathVariable("attivitaId") UUID attivitaId,@Valid @RequestBody RichiestaAttivita r) {
    return servizio.modificaAttivita(id,attivitaId,r.version(),r.dati());
  }
  @DeleteMapping("/{id}/attivita/{attivitaId}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminaAttivita(@PathVariable("id") UUID id,@PathVariable("attivitaId") UUID attivitaId) { servizio.eliminaAttivita(id,attivitaId); }

  @GetMapping("/{id}/eventi") public List<Map<String,Object>> eventi(@PathVariable("id") UUID id) { return servizio.eventi(id); }
  @GetMapping("/{id}/comunicazioni") public List<Map<String,Object>> comunicazioni(@PathVariable("id") UUID id) { return servizio.comunicazioni(id); }
  @PostMapping("/{id}/comunicazioni") @ResponseStatus(HttpStatus.CREATED)
  public Map<String,Object> creaComunicazione(@PathVariable("id") UUID id,@Valid @RequestBody RichiestaComunicazione r) { return servizio.creaComunicazione(id,r.dati()); }
  @PutMapping("/{id}/comunicazioni/{comunicazioneId}")
  public Map<String,Object> modificaComunicazione(@PathVariable("id") UUID id,@PathVariable("comunicazioneId") UUID comunicazioneId,@Valid @RequestBody RichiestaComunicazione r) {
    return servizio.modificaComunicazione(id,comunicazioneId,r.version(),r.dati());
  }
  @DeleteMapping("/{id}/comunicazioni/{comunicazioneId}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminaComunicazione(@PathVariable("id") UUID id,@PathVariable("comunicazioneId") UUID comunicazioneId) { servizio.eliminaComunicazione(id,comunicazioneId); }

  @GetMapping("/{id}/dati-giudiziari") public Map<String,Object> datiGiudiziari(@PathVariable("id") UUID id) { return servizio.datiGiudiziari(id); }
  @PutMapping("/{id}/dati-giudiziari") public Map<String,Object> salvaDatiGiudiziari(@PathVariable("id") UUID id,@RequestBody Map<String,Object> dati) {
    return servizio.salvaDatiGiudiziari(id,dati);
  }
  @GetMapping("/{id}/economia") public Map<String,Object> economia(@PathVariable("id") UUID id) { return servizio.economia(id); }
  @PutMapping("/{id}/economia") public Map<String,Object> salvaEconomia(@PathVariable("id") UUID id,@RequestBody Map<String,Object> dati) {
    return servizio.salvaEconomia(id,dati);
  }
  @GetMapping("/{id}/timeline") public List<Map<String,Object>> timeline(@PathVariable("id") UUID id) { return servizio.timeline(id); }
}
