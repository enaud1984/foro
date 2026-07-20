package it.foro.studio.api;

import it.foro.identity.domain.StudioMembership;
import it.foro.identity.domain.UserAccount;
import it.foro.identity.repository.StudioMembershipRepository;
import it.foro.identity.repository.UserAccountRepository;
import it.foro.platform.security.TenantContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1")
public class CollaboratoriController {
  private static final String CARATTERI_PASSWORD = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  private final TenantContext contestoStudio;
  private final StudioMembershipRepository associazioniStudio;
  private final UserAccountRepository utenti;
  private final PasswordEncoder codificatorePassword;
  private final JavaMailSender gestoreEmail;
  private final JdbcTemplate database;

  public CollaboratoriController(
      TenantContext contestoStudio,
      StudioMembershipRepository associazioniStudio,
      UserAccountRepository utenti,
      PasswordEncoder codificatorePassword,
      JavaMailSender gestoreEmail,
      JdbcTemplate database) {
    this.contestoStudio = contestoStudio;
    this.associazioniStudio = associazioniStudio;
    this.utenti = utenti;
    this.codificatorePassword = codificatorePassword;
    this.gestoreEmail = gestoreEmail;
    this.database = database;
  }

  public record RispostaCollaboratore(UUID id, String nome, String cognome, String email, String ruolo, String stato) {}

  public record RichiestaCreazioneCollaboratore(
      @NotBlank @Size(max = 80) String nome,
      @NotBlank @Size(max = 80) String cognome,
      @Email @NotBlank String email,
      @Pattern(regexp = "AVVOCATO|SEGRETERIA|STUDIO_ADMIN") String ruolo) {}

  public record RichiestaCambioPassword(
      @NotBlank String passwordAttuale,
      @Size(min = 12, max = 128) String nuovaPassword) {}

  @GetMapping("/studio/collaboratori")
  public List<RispostaCollaboratore> collaboratori() {
    verificaAmministratore();
    return associazioniStudio.findAllByStudioIdAndStatus(contestoStudio.studioId(), "ACTIVE").stream()
        .map(associazione -> {
          var utente = utenti.findById(associazione.getUserId()).orElseThrow();
          return creaRisposta(utente, associazione);
        })
        .toList();
  }

  @PostMapping("/studio/collaboratori")
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public RispostaCollaboratore crea(@Valid @RequestBody RichiestaCreazioneCollaboratore richiesta) {
    verificaAmministratore();
    if (utenti.findByEmailIgnoreCase(richiesta.email()).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "EMAIL_GIA_REGISTRATA");
    }

    var passwordTemporanea = creaPasswordTemporanea();
    var utente = new UserAccount(
        richiesta.email(),
        codificatorePassword.encode(passwordTemporanea),
        richiesta.nome().trim() + " " + richiesta.cognome().trim());
    utente.impostaPasswordTemporanea();
    utenti.save(utente);

    var associazione = associazioniStudio.save(new StudioMembership(
        contestoStudio.studioId(), utente.getId(), richiesta.ruolo(), "ACTIVE"));
    inviaPasswordTemporanea(utente, richiesta.nome(), passwordTemporanea);
    registraAudit("COLLABORATORE_CREATO", utente.getId());
    return creaRisposta(utente, associazione);
  }

  @PutMapping("/profilo/password")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void cambiaPassword(@Valid @RequestBody RichiestaCambioPassword richiesta) {
    var utente = utenti.findById(contestoStudio.userId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "UTENTE_NON_TROVATO"));
    if (!codificatorePassword.matches(richiesta.passwordAttuale(), utente.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PASSWORD_ATTUALE_NON_VALIDA");
    }
    utente.cambiaPassword(codificatorePassword.encode(richiesta.nuovaPassword()));
    registraAudit("PASSWORD_MODIFICATA", utente.getId());
  }

  private void verificaAmministratore() {
    var autorizzato = associazioniStudio
        .findByStudioIdAndUserId(contestoStudio.studioId(), contestoStudio.userId())
        .filter(associazione -> "ACTIVE".equals(associazione.getStatus()))
        .map(associazione -> "STUDIO_ADMIN".equals(associazione.getRole()) || "OWNER".equals(associazione.getRole()))
        .orElse(false);
    if (!autorizzato) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SOLO_TITOLARE_GESTISCE_COLLABORATORI");
    }
  }

  private String creaPasswordTemporanea() {
    var generatoreCasuale = new SecureRandom();
    var valore = new StringBuilder("F0ro!");
    while (valore.length() < 16) {
      valore.append(CARATTERI_PASSWORD.charAt(generatoreCasuale.nextInt(CARATTERI_PASSWORD.length())));
    }
    return valore.toString();
  }

  private void inviaPasswordTemporanea(UserAccount utente, String nome, String password) {
    var messaggio = new SimpleMailMessage();
    messaggio.setFrom("noreply@foro.local");
    messaggio.setTo(utente.getEmail());
    messaggio.setSubject("Accesso temporaneo a FORO");
    messaggio.setText("Ciao " + nome + ",\n\nsei stato aggiunto allo Studio su FORO.\nEmail: "
        + utente.getEmail() + "\nPassword temporanea: " + password
        + "\n\nAl primo accesso dovrai modificare la password dalle impostazioni.");
    gestoreEmail.send(messaggio);
  }

  private RispostaCollaboratore creaRisposta(UserAccount utente, StudioMembership associazione) {
    var partiNome = utente.getDisplayName().trim().split("\\s+", 2);
    return new RispostaCollaboratore(
        utente.getId(),
        partiNome[0],
        partiNome.length > 1 ? partiNome[1] : "",
        utente.getEmail(),
        associazione.getRole(),
        "ACTIVE".equals(associazione.getStatus()) ? "ATTIVO" : associazione.getStatus());
  }

  private void registraAudit(String azione, UUID entita) {
    database.update(
        "INSERT INTO audit_event(id,studio_id,actor_id,action,entity_type,entity_id,outcome,correlation_id,occurred_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?::jsonb)",
        UUID.randomUUID(), contestoStudio.studioId(), contestoStudio.userId(), azione, "USER_ACCOUNT", entita,
        "SUCCESS", UUID.randomUUID(), Timestamp.from(Instant.now()), "{}");
  }
}
