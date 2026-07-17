package it.foro.calendario.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="calendario")
public class Calendario {
  @Id private UUID id;
  @Column(name="studio_id", nullable=false) private UUID studioId;
  @Column(name="proprietario_id", nullable=false) private UUID proprietarioId;
  @Column(nullable=false) private String nome;
  @Column(nullable=false) private String colore;
  @Column(name="condiviso_tutto_studio", nullable=false) private boolean condivisoTuttoStudio;
  @Column(name="creato_il", nullable=false) private Instant creatoIl;
  protected Calendario() {}
  public Calendario(UUID studioId, UUID proprietarioId, String nome, String colore, boolean condivisoTuttoStudio) {
    this.id=UUID.randomUUID(); this.studioId=studioId; this.proprietarioId=proprietarioId; this.nome=nome;
    this.colore=colore; this.condivisoTuttoStudio=condivisoTuttoStudio; this.creatoIl=Instant.now();
  }
  public UUID getId(){return id;} public UUID getStudioId(){return studioId;} public UUID getProprietarioId(){return proprietarioId;}
  public String getNome(){return nome;} public String getColore(){return colore;} public boolean isCondivisoTuttoStudio(){return condivisoTuttoStudio;}
}
