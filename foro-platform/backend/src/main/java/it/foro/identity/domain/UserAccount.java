package it.foro.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="user_account")
public class UserAccount {
  @Id private UUID id;
  @Column(nullable=false, unique=true) private String email;
  @Column(name="password_hash", nullable=false) private String passwordHash;
  @Column(name="display_name", nullable=false) private String displayName;
  @Column(nullable=false) private String status;
  @Column(name="created_at", nullable=false) private Instant createdAt;
  @Column(name="deve_cambiare_password", nullable=false) private boolean deveCambiarePassword;
  protected UserAccount() {}
  public UserAccount(String email, String passwordHash, String displayName) {
    this.id=UUID.randomUUID(); this.email=email.toLowerCase(); this.passwordHash=passwordHash;
    this.displayName=displayName; this.status="ACTIVE"; this.createdAt=Instant.now(); this.deveCambiarePassword=false;
  }
  public UUID getId(){return id;} public String getEmail(){return email;}
  public String getPasswordHash(){return passwordHash;} public String getDisplayName(){return displayName;}
  public boolean isDeveCambiarePassword(){return deveCambiarePassword;}
  public void impostaPasswordTemporanea(){this.deveCambiarePassword=true;}
  public void cambiaPassword(String nuovoPasswordHash){this.passwordHash=nuovoPasswordHash;this.deveCambiarePassword=false;}
}
