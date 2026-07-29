package it.foro.pratiche.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "pratica")
public class Pratica {
  @Id private UUID id;
  @Column(name = "studio_id", nullable = false) private UUID studioId;
  @Column(nullable = false, length = 30) private String codice;
  @Column(nullable = false, length = 240) private String titolo;
  @Column(columnDefinition = "text") private String descrizione;
  @Column(name = "materia_codice", nullable = false) private String materiaCodice;
  @Column(name = "tipologia_codice", nullable = false) private String tipologiaCodice;
  @Column(name = "stato_codice", nullable = false) private String statoCodice;
  @Column(name = "priorita_codice", nullable = false) private String prioritaCodice;
  @Column(name = "responsabile_id", nullable = false) private UUID responsabileId;
  @Column(name = "valore_economico", precision = 15, scale = 2) private BigDecimal valoreEconomico;
  @Column(nullable = false, length = 3) private String valuta;
  @Column(nullable = false) private boolean riservata;
  @Column(name = "data_apertura", nullable = false) private LocalDate dataApertura;
  @Column(name = "data_definizione") private LocalDate dataDefinizione;
  @Column(name = "data_archiviazione") private LocalDate dataArchiviazione;
  @Column(name = "motivo_attesa", columnDefinition = "text") private String motivoAttesa;
  @Column(name = "note_interne", columnDefinition = "text") private String noteInterne;
  @Version private long version;
  @Column(name = "creato_il", nullable = false) private Instant creatoIl;
  @Column(name = "creato_da", nullable = false) private UUID creatoDa;
  @Column(name = "aggiornato_il", nullable = false) private Instant aggiornatoIl;
  @Column(name = "aggiornato_da", nullable = false) private UUID aggiornatoDa;
  @Column(name = "eliminato_il") private Instant eliminatoIl;
  @Column(name = "eliminato_da") private UUID eliminatoDa;

  protected Pratica() {}

  public Pratica(UUID studioId, String codice, UUID autoreId, Dati dati) {
    id = UUID.randomUUID();
    this.studioId = studioId;
    this.codice = codice;
    statoCodice = "BOZZA";
    valuta = "EUR";
    creatoIl = Instant.now();
    aggiornatoIl = creatoIl;
    creatoDa = autoreId;
    aggiornatoDa = autoreId;
    aggiorna(dati, autoreId);
  }

  public void aggiorna(Dati dati, UUID autoreId) {
    if ("ARCHIVIATA".equals(statoCodice)) throw new IllegalStateException("PRATICA_ARCHIVIATA_NON_MODIFICABILE");
    titolo = pulisci(dati.titolo());
    descrizione = pulisci(dati.descrizione());
    materiaCodice = dati.materiaCodice();
    tipologiaCodice = dati.tipologiaCodice();
    prioritaCodice = dati.prioritaCodice();
    responsabileId = dati.responsabileId();
    valoreEconomico = dati.valoreEconomico();
    valuta = Optional.ofNullable(pulisci(dati.valuta())).orElse("EUR").toUpperCase();
    riservata = dati.riservata();
    dataApertura = dati.dataApertura();
    motivoAttesa = pulisci(dati.motivoAttesa());
    noteInterne = pulisci(dati.noteInterne());
    aggiornatoIl = Instant.now();
    aggiornatoDa = autoreId;
  }

  public void cambiaStato(String nuovoStato, UUID autoreId) {
    if (!transizioni().getOrDefault(statoCodice, Set.of()).contains(nuovoStato)) {
      throw new IllegalStateException("PRATICA_TRANSIZIONE_NON_AMMESSA");
    }
    statoCodice = nuovoStato;
    var oggi = LocalDate.now();
    if ("DEFINITA".equals(nuovoStato)) dataDefinizione = oggi;
    if ("ARCHIVIATA".equals(nuovoStato)) dataArchiviazione = oggi;
    if ("APERTA".equals(nuovoStato)) {
      dataArchiviazione = null;
      if (dataDefinizione != null) dataDefinizione = null;
    }
    aggiornatoIl = Instant.now();
    aggiornatoDa = autoreId;
  }

  public void elimina(UUID autoreId) {
    eliminatoIl = Instant.now();
    eliminatoDa = autoreId;
    aggiornatoIl = eliminatoIl;
    aggiornatoDa = autoreId;
  }

  public static Map<String, Set<String>> transizioni() {
    return Map.of(
      "BOZZA", Set.of("APERTA"),
      "APERTA", Set.of("IN_ATTESA", "SOSPESA", "DEFINITA"),
      "IN_ATTESA", Set.of("APERTA", "SOSPESA", "DEFINITA"),
      "SOSPESA", Set.of("APERTA", "DEFINITA"),
      "DEFINITA", Set.of("APERTA", "ARCHIVIATA"),
      "ARCHIVIATA", Set.of("APERTA")
    );
  }

  private static String pulisci(String valore) {
    return valore == null || valore.isBlank() ? null : valore.trim();
  }

  public record Dati(String titolo, String descrizione, String materiaCodice, String tipologiaCodice,
    String prioritaCodice, UUID responsabileId, BigDecimal valoreEconomico, String valuta,
    boolean riservata, LocalDate dataApertura, String motivoAttesa, String noteInterne) {}

  public UUID getId() { return id; }
  public UUID getStudioId() { return studioId; }
  public String getCodice() { return codice; }
  public String getTitolo() { return titolo; }
  public String getDescrizione() { return descrizione; }
  public String getMateriaCodice() { return materiaCodice; }
  public String getTipologiaCodice() { return tipologiaCodice; }
  public String getStatoCodice() { return statoCodice; }
  public String getPrioritaCodice() { return prioritaCodice; }
  public UUID getResponsabileId() { return responsabileId; }
  public BigDecimal getValoreEconomico() { return valoreEconomico; }
  public String getValuta() { return valuta; }
  public boolean isRiservata() { return riservata; }
  public LocalDate getDataApertura() { return dataApertura; }
  public LocalDate getDataDefinizione() { return dataDefinizione; }
  public LocalDate getDataArchiviazione() { return dataArchiviazione; }
  public String getMotivoAttesa() { return motivoAttesa; }
  public String getNoteInterne() { return noteInterne; }
  public long getVersion() { return version; }
  public Instant getCreatoIl() { return creatoIl; }
  public Instant getAggiornatoIl() { return aggiornatoIl; }
  public Instant getEliminatoIl() { return eliminatoIl; }
}
