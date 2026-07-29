package it.foro.calendario.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EventoCalendarioPraticaTest {
  @Test void eventoPuoNascereSenzaPratica() {
    var evento=evento(null);
    assertThat(evento.getPraticaId()).isNull();
  }
  @Test void eventoConservaIlCollegamentoAllaPratica() {
    var pratica=UUID.randomUUID();var evento=evento(pratica);
    assertThat(evento.getPraticaId()).isEqualTo(pratica);
  }
  @Test void modificaPuoCambiareORimuovereLaPratica() {
    var evento=evento(UUID.randomUUID());var nuova=UUID.randomUUID();
    evento.aggiorna(evento.getCalendarioId(),"Udienza aggiornata",evento.getInizio(),evento.getFine(),null,"OCCUPATO",15,"UDIENZA",false,nuova);
    assertThat(evento.getPraticaId()).isEqualTo(nuova);
    evento.aggiorna(evento.getCalendarioId(),"Udienza senza pratica",evento.getInizio(),evento.getFine(),null,"OCCUPATO",15,"UDIENZA",false,null);
    assertThat(evento.getPraticaId()).isNull();
  }
  private EventoCalendario evento(UUID praticaId){
    var inizio=Instant.parse("2026-08-01T08:00:00Z");
    return new EventoCalendario(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID(),"Udienza",inizio,inizio.plusSeconds(3600),null,null,"","OCCUPATO",15,"UDIENZA",false,null,"NESSUNA",null,praticaId);
  }
}
