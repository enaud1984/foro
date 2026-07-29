package it.foro.anagrafiche.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import it.foro.anagrafiche.domain.Soggetto;
import it.foro.anagrafiche.repository.SoggettoRepository;
import it.foro.platform.security.TenantContext;
import it.foro.pratiche.application.ArchivioDocumentiPratica;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class DocumentiAnagraficaServiceTest {
  private JdbcTemplate database;
  private TenantContext tenant;
  private SoggettoRepository soggetti;
  private ArchivioDocumentiPratica archivio;
  private DocumentiAnagraficaService servizio;
  private UUID studio;
  private UUID utente;
  private UUID soggettoId;

  @BeforeEach void prepara() {
    database=mock(JdbcTemplate.class);tenant=mock(TenantContext.class);soggetti=mock(SoggettoRepository.class);
    archivio=mock(ArchivioDocumentiPratica.class);studio=UUID.randomUUID();utente=UUID.randomUUID();soggettoId=UUID.randomUUID();
    when(tenant.studioId()).thenReturn(studio);when(tenant.userId()).thenReturn(utente);
    servizio=new DocumentiAnagraficaService(database,tenant,soggetti,archivio);
  }

  @Test void risorsaDiAltroStudioRisponde404() {
    when(soggetti.findByIdAndStudioIdAndEliminatoIlIsNull(soggettoId,studio)).thenReturn(Optional.empty());
    assertErrore("ANAGRAFICA_NON_TROVATA",HttpStatus.NOT_FOUND,()->servizio.timeline(soggettoId));
  }

  @Test void uploadUsaArchivioConStudioESoggettoEAuditaSenzaMetadatiSensibili() {
    soggettoPresente();
    var file=new MockMultipartFile("file","identita.pdf","application/pdf","%PDF-demo".getBytes());
    when(database.queryForObject(contains("categoria_documento_pratica"),eq(Integer.class),eq("DOCUMENTO_IDENTITA"))).thenReturn(1);
    when(archivio.salva(studio,soggettoId,file)).thenReturn(new ArchivioDocumentiPratica.DocumentoSalvato(
      "identita.pdf","application/pdf",9,"percorso-casuale","abc"));
    when(database.queryForList(contains("FROM documento_pratica d"),any(Object[].class))).thenReturn(List.of(new HashMap<>(Map.of(
      "id",UUID.randomUUID(),"titolo","Identità","version",0L))));
    var risultato=servizio.carica(soggettoId,"DOCUMENTO_IDENTITA","Identità",null,null,file);
    assertThat(risultato.get("titolo")).isEqualTo("Identità");
    verify(archivio).salva(studio,soggettoId,file);
    verify(database).update(contains("audit_event"),any(),eq(studio),eq(utente),eq("DOCUMENTO_ANAGRAFICA_CARICATO"),
      eq("SOGGETTO"),eq(soggettoId),eq("SUCCESS"),any(),any(),eq("{}"));
  }

  @Test void erroreDimensioneArchivioVieneTradottoNelCodiceAnagrafica() {
    soggettoPresente();
    when(database.queryForObject(anyString(),eq(Integer.class),any(Object[].class))).thenReturn(1);
    var file=new MockMultipartFile("file","grande.pdf","application/pdf","%PDF-x".getBytes());
    when(archivio.salva(studio,soggettoId,file)).thenThrow(new IllegalArgumentException("PRATICA_DOCUMENTO_TROPPO_GRANDE"));
    assertErrore("DOCUMENTO_ANAGRAFICA_TROPPO_GRANDE",HttpStatus.PAYLOAD_TOO_LARGE,
      ()->servizio.carica(soggettoId,"DOCUMENTO_IDENTITA","Grande",null,null,file));
  }

  @Test void templateDiPraticaRichiedeLaPratica() {
    assertErrore("TEMPLATE_RICHIEDE_PRATICA",HttpStatus.UNPROCESSABLE_ENTITY,
      ()->servizio.generaTemplate(soggettoId,"PROCURA_LITI",null,null));
  }

  @Test void documentoDirettoConVersioneObsoletaProduceConflitto() {
    soggettoPresente();
    when(database.queryForList(contains("SELECT id,version FROM documento_pratica"),any(Object[].class)))
      .thenReturn(List.of(new HashMap<>(Map.of("id",UUID.randomUUID(),"version",2L))));
    assertErrore("ANAGRAFICA_VERSIONE_CONFLITTO",HttpStatus.PRECONDITION_FAILED,
      ()->servizio.modifica(soggettoId,UUID.randomUUID(),1,"Titolo","PRIVACY",null,null));
  }

  private void soggettoPresente() {
    when(soggetti.findByIdAndStudioIdAndEliminatoIlIsNull(soggettoId,studio))
      .thenReturn(Optional.of(new Soggetto(studio,utente)));
  }
  private void assertErrore(String codice,HttpStatus stato,Runnable azione) {
    var errore=catchThrowableOfType(azione::run,ResponseStatusException.class);
    assertThat(errore.getReason()).isEqualTo(codice);assertThat(errore.getStatusCode()).isEqualTo(stato);
  }
}
