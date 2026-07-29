package it.foro.pratiche.domain;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PraticaTest {
  private final UUID studio=UUID.randomUUID();
  private final UUID autore=UUID.randomUUID();

  @Test void creaUnaBozzaConCodiceImmutabile() {
    var pratica=nuova(false);
    assertThat(pratica.getCodice()).isEqualTo("PRA-2026-00001");
    assertThat(pratica.getStatoCodice()).isEqualTo("BOZZA");
    assertThat(pratica.getVersion()).isZero();
  }
  @Test void apreUnaBozza() {
    var pratica=nuova(false);pratica.cambiaStato("APERTA",autore);
    assertThat(pratica.getStatoCodice()).isEqualTo("APERTA");
  }
  @Test void rifiutaUnaTransizioneNonAmmessa() {
    assertThatThrownBy(()->nuova(false).cambiaStato("DEFINITA",autore))
      .isInstanceOf(IllegalStateException.class).hasMessage("PRATICA_TRANSIZIONE_NON_AMMESSA");
  }
  @Test void definisceEArchiviaConLeDate() {
    var pratica=nuova(false);pratica.cambiaStato("APERTA",autore);pratica.cambiaStato("DEFINITA",autore);pratica.cambiaStato("ARCHIVIATA",autore);
    assertThat(pratica.getDataDefinizione()).isNotNull();assertThat(pratica.getDataArchiviazione()).isNotNull();
  }
  @Test void praticaArchiviataRestaInSolaLettura() {
    var pratica=nuova(false);pratica.cambiaStato("APERTA",autore);pratica.cambiaStato("DEFINITA",autore);pratica.cambiaStato("ARCHIVIATA",autore);
    assertThatThrownBy(()->pratica.aggiorna(dati(false),autore)).hasMessage("PRATICA_ARCHIVIATA_NON_MODIFICABILE");
  }
  @Test void riaperturaAzzeraLeDateDiChiusura() {
    var pratica=nuova(false);pratica.cambiaStato("APERTA",autore);pratica.cambiaStato("DEFINITA",autore);pratica.cambiaStato("ARCHIVIATA",autore);pratica.cambiaStato("APERTA",autore);
    assertThat(pratica.getDataDefinizione()).isNull();assertThat(pratica.getDataArchiviazione()).isNull();
  }
  @Test void cancellazioneLogicaConservaIdentita() {
    var pratica=nuova(false);var id=pratica.getId();pratica.elimina(autore);
    assertThat(pratica.getId()).isEqualTo(id);assertThat(pratica.getEliminatoIl()).isNotNull();
  }
  @Test void aggiornaPrioritaResponsabileEValoreDecimale() {
    var pratica=nuova(false);var dati=new Pratica.Dati("Titolo aggiornato",null,"CIVILE","CONSULENZA","URGENTE",UUID.randomUUID(),new BigDecimal("123.45"),"eur",true,LocalDate.of(2026,7,29),null,null);
    pratica.aggiorna(dati,autore);
    assertThat(pratica.getPrioritaCodice()).isEqualTo("URGENTE");assertThat(pratica.getValoreEconomico()).isEqualByComparingTo("123.45");assertThat(pratica.getValuta()).isEqualTo("EUR");
  }
  @Test void esponeLeTransizioniControllate() {
    assertThat(Pratica.transizioni().get("ARCHIVIATA")).containsExactly("APERTA");
    assertThat(Pratica.transizioni().get("BOZZA")).doesNotContain("DEFINITA");
  }
  private Pratica nuova(boolean riservata){return new Pratica(studio,"PRA-2026-00001",autore,dati(riservata));}
  private Pratica.Dati dati(boolean riservata){return new Pratica.Dati("Pratica demo","Descrizione","CIVILE","CONSULENZA","NORMALE",autore,new BigDecimal("10.00"),"EUR",riservata,LocalDate.of(2026,7,29),null,null);}
}
