package it.foro.anagrafiche.domain;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class SoggettoTest {
  @Test void normalizzaCodiceFiscaleEPartitaIva(){
    assertEquals("RSSMRA80A01H501U",Soggetto.normalizzaCodiceFiscale(" rssmra80a01h501u "));
    assertEquals("01234567890",Soggetto.normalizzaPartitaIva(" 01234567890 "));
  }
  @Test void aggiornaEDisattivaSenzaCambiareTenant(){
    var studio=UUID.randomUUID();var autore=UUID.randomUUID();var soggetto=new Soggetto(studio,autore);
    soggetto.aggiorna(dati("PERSONA_FISICA","Mario","Rossi",null,"ATTIVO"),autore);
    assertEquals(studio,soggetto.getStudioId());assertEquals("Mario",soggetto.getNome());assertEquals("ATTIVO",soggetto.getStato());
    soggetto.aggiorna(dati("PERSONA_FISICA","Mario","Rossi",null,"DISATTIVATO"),autore);
    assertEquals("DISATTIVATO",soggetto.getStato());
  }
  @Test void eliminazioneLogicaConservaEntita(){
    var soggetto=new Soggetto(UUID.randomUUID(),UUID.randomUUID());
    soggetto.aggiorna(dati("PERSONA_GIURIDICA",null,null,"Aurora S.r.l.","ATTIVO"),UUID.randomUUID());
    soggetto.elimina(UUID.randomUUID());
    assertNotNull(soggetto.getEliminatoIl());assertEquals("Aurora S.r.l.",soggetto.getDenominazione());
  }
  static Soggetto.Dati dati(String tipo,String nome,String cognome,String denominazione,String stato){
    return new Soggetto.Dati(tipo,nome,cognome,null,null,null,null,denominazione,null,null,null,null,null,null,null,null,null,null,null,null,null,null,stato);
  }
}
