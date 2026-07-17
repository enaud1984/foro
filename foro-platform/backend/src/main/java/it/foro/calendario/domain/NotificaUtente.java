package it.foro.calendario.domain;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="notifica_utente")
public class NotificaUtente { @Id private UUID id; @Column(name="studio_id") private UUID studioId; @Column(name="user_id") private UUID userId; private String tipo; private String titolo; private String descrizione; @Column(name="evento_id") private UUID eventoId; private boolean letta; @Column(name="creata_il") private Instant creataIl;
  protected NotificaUtente(){} public NotificaUtente(UUID s,UUID u,String t,String titolo,String d,UUID e){id=UUID.randomUUID();studioId=s;userId=u;tipo=t;this.titolo=titolo;descrizione=d;eventoId=e;letta=false;creataIl=Instant.now();}
  public UUID getId(){return id;} public String getTipo(){return tipo;} public String getTitolo(){return titolo;} public String getDescrizione(){return descrizione;} public UUID getEventoId(){return eventoId;} public boolean isLetta(){return letta;} public Instant getCreataIl(){return creataIl;}
}
