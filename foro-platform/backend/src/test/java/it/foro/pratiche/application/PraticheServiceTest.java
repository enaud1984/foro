package it.foro.pratiche.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import it.foro.platform.security.*;
import it.foro.pratiche.domain.Pratica;
import it.foro.pratiche.repository.PraticaRepository;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

class PraticheServiceTest {
  private PraticaRepository repository;
  private JdbcTemplate database;
  private PraticheService servizio;
  private ArchivioDocumentiPratica archivio;
  private UUID studio;
  private UUID utente;

  @BeforeEach void prepara() {
    studio=UUID.randomUUID();utente=UUID.randomUUID();
    repository=mock(PraticaRepository.class);database=mock(JdbcTemplate.class);
    var context=SecurityContextHolder.createEmptyContext();
    context.setAuthentication(new UsernamePasswordAuthenticationToken(new JwtPrincipal(utente,studio,"utente@example.test"),null,List.of()));
    SecurityContextHolder.setContext(context);
    archivio=mock(ArchivioDocumentiPratica.class);
    servizio=new PraticheService(repository,new TenantContext(),database,archivio);
  }
  @AfterEach void pulisci(){SecurityContextHolder.clearContext();}

  @Test void risorsaCrossTenantRestituisce404() {
    when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(any(),eq(studio))).thenReturn(Optional.empty());
    assertErrore("PRATICA_NON_TROVATA",HttpStatus.NOT_FOUND,()->servizio.dettaglio(UUID.randomUUID()));
  }
  @Test void aggiornamentoConVersioneObsoletaRestituisceConflitto() {
    var pratica=pratica(false);when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(pratica.getId(),studio)).thenReturn(Optional.of(pratica));
    assertErrore("PRATICA_VERSIONE_CONFLITTO",HttpStatus.PRECONDITION_FAILED,()->servizio.cambiaStato(pratica.getId(),1,"APERTA"));
  }
  @Test void eventoNonPuoCollegarsiAPraticaArchiviata() {
    var pratica=pratica(false);pratica.cambiaStato("APERTA",utente);pratica.cambiaStato("DEFINITA",utente);pratica.cambiaStato("ARCHIVIATA",utente);
    when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(pratica.getId(),studio)).thenReturn(Optional.of(pratica));
    assertErrore("PRATICA_ARCHIVIATA_NON_MODIFICABILE",HttpStatus.CONFLICT,()->servizio.verificaCollegabileAgenda(pratica.getId()));
  }
  @Test void bozzaNonPuoSaltareDirettamenteADefinita() {
    var pratica=pratica(false);when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(pratica.getId(),studio)).thenReturn(Optional.of(pratica));
    when(database.queryForObject(anyString(),eq(Long.class),any(Object[].class))).thenReturn(1L);
    assertErrore("PRATICA_TRANSIZIONE_NON_AMMESSA",HttpStatus.CONFLICT,()->servizio.cambiaStato(pratica.getId(),0,"DEFINITA"));
  }
  @Test void aperturaSenzaClienteVieneRifiutata() {
    var pratica=pratica(false);when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(pratica.getId(),studio)).thenReturn(Optional.of(pratica));
    when(database.queryForObject(anyString(),eq(Long.class),any(Object[].class))).thenReturn(0L);
    assertErrore("PRATICA_CLIENTE_OBBLIGATORIO",HttpStatus.UNPROCESSABLE_ENTITY,()->servizio.cambiaStato(pratica.getId(),0,"APERTA"));
  }
  @Test void valoreEconomicoNegativoVieneRifiutato() {
    when(database.queryForObject(anyString(),eq(Integer.class),any(Object[].class))).thenReturn(1);
    var dati=new Pratica.Dati("Demo",null,"CIVILE","CONSULENZA","NORMALE",utente,new BigDecimal("-0.01"),"EUR",false,LocalDate.now(),null,null);
    assertErrore("PRATICA_VALORE_NON_VALIDO",HttpStatus.UNPROCESSABLE_ENTITY,()->servizio.validaDati(dati));
  }
  @Test void ruoloAltroRichiedeDescrizione() {
    when(database.queryForObject(anyString(),eq(Integer.class),any(Object[].class))).thenReturn(1);
    var dati=new PraticheService.DatiSoggetto(UUID.randomUUID(),"ALTRO",false,null,null);
    assertErrore("PRATICA_SOGGETTO_ALTRO_SENZA_DESCRIZIONE",HttpStatus.UNPROCESSABLE_ENTITY,()->servizio.validaSoggetto(dati));
  }
  @Test void soggettoDiAltroStudioNonECollegabile() {
    when(database.queryForObject(anyString(),eq(Integer.class),any(Object[].class))).thenReturn(0);
    var dati=new PraticheService.DatiSoggetto(UUID.randomUUID(),"CLIENTE",true,null,null);
    assertErrore("PRATICA_SOGGETTO_NON_VALIDO",HttpStatus.NOT_FOUND,()->servizio.validaSoggetto(dati));
  }
  @Test void economiaRifiutaImportiNegativi() {
    var pratica=pratica(false);when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(pratica.getId(),studio)).thenReturn(Optional.of(pratica));
    assertErrore("PRATICA_DATI_ECONOMICI_NON_VALIDI",HttpStatus.UNPROCESSABLE_ENTITY,
      ()->servizio.salvaEconomia(pratica.getId(),Map.of("preventivo",-1,"version",0)));
  }
  @Test void catalogoTemplateDistingueConfiguratiENonConfigurati() {
    assertThat(servizio.templateDocumenti()).extracting(PraticheService.TemplateDocumento::codice)
      .contains("LETTERA_INCARICO","PREVENTIVO","PROCURA_LITI","DIFFIDA","SCHEDA_RIEPILOGATIVA_PRATICA");
    assertThat(servizio.templateDocumenti()).filteredOn(PraticheService.TemplateDocumento::configurato)
      .extracting(PraticheService.TemplateDocumento::codice).containsExactly("SCHEDA_RIEPILOGATIVA_PRATICA");
  }
  @Test void templateLegaleNonConfiguratoNonCreaDocumento() {
    var pratica=pratica(false);
    when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(pratica.getId(),studio)).thenReturn(Optional.of(pratica));
    assertErrore("TEMPLATE_NON_CONFIGURATO",HttpStatus.NOT_IMPLEMENTED,
      ()->servizio.generaDocumento(pratica.getId(),"LETTERA_INCARICO",null));
    verify(database,never()).update(contains("INSERT INTO documento_pratica"),any(Object[].class));
  }
  @Test void schedaRiepilogativaVieneGenerataETracciata() {
    var pratica=pratica(false);
    when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(pratica.getId(),studio)).thenReturn(Optional.of(pratica));
    when(archivio.salvaGenerato(eq(studio),eq(pratica.getId()),contains("scheda-riepilogativa"),any(byte[].class),eq("text/plain")))
      .thenReturn(new ArchivioDocumentiPratica.DocumentoSalvato("scheda.txt","text/plain",12,"/privato/file","checksum"));
    when(database.query(contains("FROM documento_pratica"),any(ResultSetExtractor.class),any(Object[].class)))
      .thenReturn(Map.of("id",UUID.randomUUID(),"origine","GENERATO","templateCodice","SCHEDA_RIEPILOGATIVA_PRATICA"));
    var documento=servizio.generaDocumento(pratica.getId(),"SCHEDA_RIEPILOGATIVA_PRATICA",null);
    assertThat(documento).containsEntry("origine","GENERATO").containsEntry("templateCodice","SCHEDA_RIEPILOGATIVA_PRATICA");
    verify(database).update(contains("INSERT INTO documento_pratica"),any(Object[].class));
    verify(database).update(contains("INSERT INTO pratica_timeline"),any(Object[].class));
  }
  private Pratica pratica(boolean riservata){return new Pratica(studio,"PRA-2026-00001",utente,new Pratica.Dati("Demo",null,"CIVILE","CONSULENZA","NORMALE",utente,null,"EUR",riservata,LocalDate.now(),null,null));}
  private void assertErrore(String codice,HttpStatus stato,Runnable azione){
    var errore=catchThrowableOfType(azione::run,ResponseStatusException.class);
    assertThat(errore.getReason()).isEqualTo(codice);assertThat(errore.getStatusCode()).isEqualTo(stato);
  }
}
