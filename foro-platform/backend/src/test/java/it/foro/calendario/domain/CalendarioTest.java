package it.foro.calendario.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class CalendarioTest {

  @Test
  void aggiornaNomeEColoreSenzaCambiareIdentita() {
    var calendario = new Calendario(UUID.randomUUID(), UUID.randomUUID(), "Agenda", "#0b67b2", false);
    var id = calendario.getId();

    calendario.aggiorna("Udienze", "#dc2626");

    assertThat(calendario.getId()).isEqualTo(id);
    assertThat(calendario.getNome()).isEqualTo("Udienze");
    assertThat(calendario.getColore()).isEqualTo("#dc2626");
    assertThat(calendario.getEliminatoIl()).isNull();
  }

  @Test
  void eliminaIlCalendarioInModoLogico() {
    var calendario = new Calendario(UUID.randomUUID(), UUID.randomUUID(), "Agenda", "#0b67b2", false);

    calendario.elimina();

    assertThat(calendario.getEliminatoIl()).isNotNull();
  }
}
