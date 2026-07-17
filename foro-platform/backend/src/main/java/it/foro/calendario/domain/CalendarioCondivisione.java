package it.foro.calendario.domain;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="calendario_condivisione") @IdClass(CalendarioCondivisione.Chiave.class)
public class CalendarioCondivisione {
  @Id @Column(name="calendario_id") private UUID calendarioId;
  @Id @Column(name="user_id") private UUID userId;
  @Column(name="studio_id",nullable=false) private UUID studioId;
  @Column(name="creato_il",nullable=false) private Instant creatoIl;
  protected CalendarioCondivisione(){}
  public CalendarioCondivisione(UUID calendarioId,UUID studioId,UUID userId){this.calendarioId=calendarioId;this.studioId=studioId;this.userId=userId;this.creatoIl=Instant.now();}
  public UUID getCalendarioId(){return calendarioId;} public UUID getUserId(){return userId;}
  public static class Chiave implements Serializable { public UUID calendarioId; public UUID userId; public Chiave(){} }
}
