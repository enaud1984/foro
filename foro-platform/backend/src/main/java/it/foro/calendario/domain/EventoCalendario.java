package it.foro.calendario.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="evento_calendario")
public class EventoCalendario {
  @Id private UUID id;
  @Column(name="studio_id", nullable=false) private UUID studioId;
  @Column(name="calendario_id", nullable=false) private UUID calendarioId;
  @Column(name="creatore_id", nullable=false) private UUID creatoreId;
  @Column(nullable=false) private String titolo;
  @Column(nullable=false) private Instant inizio;
  @Column(nullable=false) private Instant fine;
  private String luogo;
  @Column(length=4000) private String note;
  @Column(length=1000) private String partecipanti;
  @Column(name="creato_il", nullable=false) private Instant creatoIl;
  @Column(name="aggiornato_il", nullable=false) private Instant aggiornatoIl;
  @Column(name="stato_disponibilita",nullable=false) private String statoDisponibilita;
  @Column(name="promemoria_minuti") private Integer promemoriaMinuti;
  private String categoria;
  @Column(name="tutto_giorno",nullable=false) private boolean tuttoGiorno;
  @Column(name="serie_id") private UUID serieId;
  @Column(nullable=false) private String ricorrenza;
  @Column(name="fine_ricorrenza") private java.time.LocalDate fineRicorrenza;
  protected EventoCalendario() {}
  public EventoCalendario(UUID studioId, UUID calendarioId, UUID creatoreId, String titolo, Instant inizio, Instant fine, String luogo, String note, String partecipanti, String statoDisponibilita, Integer promemoriaMinuti, String categoria, boolean tuttoGiorno, UUID serieId, String ricorrenza, java.time.LocalDate fineRicorrenza) {
    this.id=UUID.randomUUID(); this.studioId=studioId; this.calendarioId=calendarioId; this.creatoreId=creatoreId;
    this.titolo=titolo; this.inizio=inizio; this.fine=fine; this.luogo=luogo; this.note=note; this.partecipanti=partecipanti;
    this.creatoIl=Instant.now(); this.aggiornatoIl=this.creatoIl;
    this.statoDisponibilita=statoDisponibilita;this.promemoriaMinuti=promemoriaMinuti;this.categoria=categoria;this.tuttoGiorno=tuttoGiorno;this.serieId=serieId;this.ricorrenza=ricorrenza;this.fineRicorrenza=fineRicorrenza;
  }
  public UUID getId(){return id;} public UUID getCalendarioId(){return calendarioId;} public UUID getCreatoreId(){return creatoreId;} public String getTitolo(){return titolo;}
  public Instant getInizio(){return inizio;} public Instant getFine(){return fine;} public String getLuogo(){return luogo;}
  public String getNote(){return note;} public String getPartecipanti(){return partecipanti;}
  public String getStatoDisponibilita(){return statoDisponibilita;} public Integer getPromemoriaMinuti(){return promemoriaMinuti;} public String getCategoria(){return categoria;} public boolean isTuttoGiorno(){return tuttoGiorno;} public UUID getSerieId(){return serieId;} public String getRicorrenza(){return ricorrenza;} public java.time.LocalDate getFineRicorrenza(){return fineRicorrenza;}
  public void aggiorna(UUID calendarioId,String titolo,Instant inizio,Instant fine,String note,String statoDisponibilita,Integer promemoriaMinuti,String categoria,boolean tuttoGiorno){this.calendarioId=calendarioId;this.titolo=titolo;this.inizio=inizio;this.fine=fine;this.note=note;this.statoDisponibilita=statoDisponibilita;this.promemoriaMinuti=promemoriaMinuti;this.categoria=categoria;this.tuttoGiorno=tuttoGiorno;this.aggiornatoIl=Instant.now();}
}
