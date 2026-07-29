package it.foro.anagrafiche.application;

import it.foro.anagrafiche.domain.Soggetto;
import it.foro.anagrafiche.repository.SoggettoRepository;
import it.foro.platform.security.TenantContext;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnagraficheServiceTest {
  @Mock SoggettoRepository repository; @Mock TenantContext tenant; @Mock JdbcTemplate database;
  AnagraficheService servizio; UUID studio; UUID utente;
  @BeforeEach void prepara(){studio=UUID.randomUUID();utente=UUID.randomUUID();lenient().when(tenant.studioId()).thenReturn(studio);lenient().when(tenant.userId()).thenReturn(utente);servizio=new AnagraficheService(repository,tenant,database);}

  @Test void creaPersonaFisicaTenantScopedEAuditata(){
    when(repository.save(any())).thenAnswer(i->i.getArgument(0));
    var creato=servizio.crea(dati("PERSONA_FISICA","Mario","Rossi",null,"RSSMRA80A01H501U",null,"ATTIVO"));
    assertEquals(studio,creato.getStudioId());assertEquals("Mario",creato.getNome());
    verify(database).update(anyString(),any(),eq(studio),eq(utente),eq("ANAGRAFICA_CREATA"),eq("SOGGETTO"),eq(creato.getId()),eq("SUCCESS"),any(),any(),eq("{}"));
  }
  @Test void rifiutaPersonaSenzaNome(){assertCodice("ANAGRAFICA_DATI_NON_COHERENTI",()->servizio.crea(dati("PERSONA_FISICA",null,"Rossi",null,null,null,"ATTIVO")));}
  @Test void rifiutaOrganizzazioneSenzaDenominazione(){assertCodice("ANAGRAFICA_DATI_NON_COHERENTI",()->servizio.crea(dati("PERSONA_GIURIDICA",null,null,null,null,null,"ATTIVO")));}
  @Test void rifiutaTipoCodiceFiscaleEPartitaIvaInvalidi(){
    assertCodice("ANAGRAFICA_TIPO_NON_VALIDO",()->servizio.crea(dati("SCONOSCIUTO",null,null,"X",null,null,"ATTIVO")));
    assertCodice("ANAGRAFICA_CODICE_FISCALE_NON_VALIDO",()->servizio.crea(dati("PERSONA_FISICA","M","R",null,"123",null,"ATTIVO")));
    assertCodice("ANAGRAFICA_PARTITA_IVA_NON_VALIDA",()->servizio.crea(dati("PERSONA_GIURIDICA",null,null,"X",null,"ABC","ATTIVO")));
  }
  @Test void elencoUsaSempreStudioDelContesto(){
    when(repository.cerca(eq(studio),any(),any(),any(),any())).thenReturn(Page.empty());
    servizio.elenco("rossi",null,"ATTIVO",PageRequest.of(0,20));
    verify(repository).cerca(eq(studio),eq("rossi"),isNull(),eq("ATTIVO"),any());
  }
  @Test void accessoCrossTenantRispondeNonTrovata(){
    var id=UUID.randomUUID();when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(id,studio)).thenReturn(Optional.empty());
    var errore=assertThrows(ResponseStatusException.class,()->servizio.dettaglio(id));
    assertEquals(404,errore.getStatusCode().value());assertEquals("ANAGRAFICA_NON_TROVATA",errore.getReason());
  }
  @Test void duplicatiSonoCercatiSoloNelloStudioCorrente(){
    when(repository.duplicati(eq(studio),any(),any(),any(),any(),any(),any(),any())).thenReturn(List.of());
    servizio.duplicati(null,dati("PERSONA_GIURIDICA",null,null,"Aurora",null,"01234567890","ATTIVO"));
    verify(repository).duplicati(eq(studio),isNull(),isNull(),eq("01234567890"),isNull(),isNull(),isNull(),eq("aurora"));
  }
  @Test void versioneObsoletaProduceConflitto(){
    var id=UUID.randomUUID();var s=new Soggetto(studio,utente);s.aggiorna(dati("PERSONA_GIURIDICA",null,null,"Aurora",null,"01234567890","ATTIVO"),utente);
    ReflectionTestUtils.setField(s,"id",id);ReflectionTestUtils.setField(s,"version",2L);
    when(repository.findByIdAndStudioIdAndEliminatoIlIsNull(id,studio)).thenReturn(Optional.of(s));
    assertCodice("ANAGRAFICA_VERSIONE_CONFLITTO",()->servizio.modifica(id,1,dati("PERSONA_GIURIDICA",null,null,"Aurora",null,"01234567890","ATTIVO")));
  }
  private Soggetto.Dati dati(String tipo,String nome,String cognome,String denominazione,String cf,String piva,String stato){
    return new Soggetto.Dati(tipo,nome,cognome,null,null,null,null,denominazione,null,cf,piva,null,null,null,null,null,null,null,null,null,null,null,stato);
  }
  private void assertCodice(String codice,org.junit.jupiter.api.function.Executable azione){var e=assertThrows(ResponseStatusException.class,azione);assertEquals(codice,e.getReason());}
}
