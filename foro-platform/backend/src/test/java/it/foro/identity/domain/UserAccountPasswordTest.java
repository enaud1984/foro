package it.foro.identity.domain;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class UserAccountPasswordTest {
  @Test
  void unaPasswordTemporaneaRichiedeIlCambio() {
    var utente = new UserAccount("collaboratore@foro.test", "hash-iniziale", "Mario Rossi");
    utente.impostaPasswordTemporanea();
    assertTrue(utente.isDeveCambiarePassword());
  }

  @Test
  void ilCambioPasswordRimuoveIlVincoloTemporaneo() {
    var utente = new UserAccount("collaboratore@foro.test", "hash-iniziale", "Mario Rossi");
    utente.impostaPasswordTemporanea();
    utente.cambiaPassword("hash-nuovo");
    assertFalse(utente.isDeveCambiarePassword());
    assertEquals("hash-nuovo", utente.getPasswordHash());
  }
}
