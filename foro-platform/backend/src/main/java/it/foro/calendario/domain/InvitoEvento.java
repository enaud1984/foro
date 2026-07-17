package it.foro.calendario.domain;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="invito_evento")
public class InvitoEvento { @Id private UUID id; @Column(name="studio_id") private UUID studioId; @Column(name="evento_id") private UUID eventoId; @Column(name="user_id") private UUID userId; private String email; @Column(name="stato_email") private String statoEmail; @Column(name="inviato_il") private Instant inviatoIl; private String errore; @Column(name="creato_il") private Instant creatoIl;
  protected InvitoEvento(){} public InvitoEvento(UUID studioId,UUID eventoId,UUID userId,String email){this.id=UUID.randomUUID();this.studioId=studioId;this.eventoId=eventoId;this.userId=userId;this.email=email;this.statoEmail="DA_INVIARE";this.creatoIl=Instant.now();}
  public void inviato(){statoEmail="INVIATO";inviatoIl=Instant.now();} public void fallito(String e){statoEmail="FALLITO";errore=e==null?"Errore SMTP":e.substring(0,Math.min(500,e.length()));}
}
