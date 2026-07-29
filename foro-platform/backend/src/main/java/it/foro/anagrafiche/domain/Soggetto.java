package it.foro.anagrafiche.domain;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name="soggetto")
public class Soggetto {
  @Id private UUID id;
  @Column(name="studio_id",nullable=false) private UUID studioId;
  @Column(name="tipo_codice",nullable=false,length=40) private String tipoCodice;
  private String nome;
  private String cognome;
  @Column(name="data_nascita") private LocalDate dataNascita;
  @Column(name="luogo_nascita") private String luogoNascita;
  @Column(name="provincia_nascita") private String provinciaNascita;
  @Column(name="stato_nascita") private String statoNascita;
  private String denominazione;
  @Column(name="forma_giuridica") private String formaGiuridica;
  @Column(name="codice_fiscale") private String codiceFiscale;
  @Column(name="codice_fiscale_normalizzato") private String codiceFiscaleNormalizzato;
  @Column(name="partita_iva") private String partitaIva;
  @Column(name="partita_iva_normalizzata") private String partitaIvaNormalizzata;
  private String email;
  private String pec;
  private String telefono;
  private String cellulare;
  private String indirizzo;
  private String civico;
  private String cap;
  private String comune;
  private String provincia;
  @Column(name="stato_indirizzo") private String statoIndirizzo;
  private String note;
  @Column(nullable=false) private String stato;
  @Version private long version;
  @Column(name="creato_il",nullable=false) private Instant creatoIl;
  @Column(name="creato_da",nullable=false) private UUID creatoDa;
  @Column(name="aggiornato_il",nullable=false) private Instant aggiornatoIl;
  @Column(name="aggiornato_da",nullable=false) private UUID aggiornatoDa;
  @Column(name="eliminato_il") private Instant eliminatoIl;
  @Column(name="eliminato_da") private UUID eliminatoDa;

  protected Soggetto() {}
  public Soggetto(UUID studioId, UUID autoreId) {
    id=UUID.randomUUID(); this.studioId=studioId; stato="ATTIVO";
    creatoIl=Instant.now(); aggiornatoIl=creatoIl; creatoDa=autoreId; aggiornatoDa=autoreId;
  }
  public void aggiorna(Dati dati, UUID autoreId) {
    tipoCodice=dati.tipoCodice(); nome=pulisci(dati.nome()); cognome=pulisci(dati.cognome());
    dataNascita=dati.dataNascita(); luogoNascita=pulisci(dati.luogoNascita());
    provinciaNascita=maiuscolo(dati.provinciaNascita()); statoNascita=pulisci(dati.statoNascita());
    denominazione=pulisci(dati.denominazione()); formaGiuridica=pulisci(dati.formaGiuridica());
    codiceFiscale=pulisci(dati.codiceFiscale()); codiceFiscaleNormalizzato=normalizzaCodiceFiscale(dati.codiceFiscale());
    partitaIva=pulisci(dati.partitaIva()); partitaIvaNormalizzata=normalizzaPartitaIva(dati.partitaIva());
    email=minuscolo(dati.email()); pec=minuscolo(dati.pec()); telefono=pulisci(dati.telefono()); cellulare=pulisci(dati.cellulare());
    indirizzo=pulisci(dati.indirizzo()); civico=pulisci(dati.civico()); cap=pulisci(dati.cap());
    comune=pulisci(dati.comune()); provincia=maiuscolo(dati.provincia()); statoIndirizzo=pulisci(dati.statoIndirizzo());
    note=pulisci(dati.note()); stato=dati.stato(); aggiornatoIl=Instant.now(); aggiornatoDa=autoreId;
  }
  public void elimina(UUID autoreId){eliminatoIl=Instant.now();eliminatoDa=autoreId;aggiornatoIl=eliminatoIl;aggiornatoDa=autoreId;}
  public static String normalizzaCodiceFiscale(String valore){var p=pulisci(valore);return p==null?null:p.replaceAll("\\s+","").toUpperCase();}
  public static String normalizzaPartitaIva(String valore){var p=pulisci(valore);return p==null?null:p.replaceAll("\\s+","");}
  public static String normalizzaTesto(String valore){var p=pulisci(valore);return p==null?null:p.toLowerCase().replaceAll("\\s+"," ");}
  private static String pulisci(String v){return v==null||v.isBlank()?null:v.trim();}
  private static String maiuscolo(String v){var p=pulisci(v);return p==null?null:p.toUpperCase();}
  private static String minuscolo(String v){var p=pulisci(v);return p==null?null:p.toLowerCase();}

  public record Dati(String tipoCodice,String nome,String cognome,LocalDate dataNascita,String luogoNascita,
    String provinciaNascita,String statoNascita,String denominazione,String formaGiuridica,String codiceFiscale,
    String partitaIva,String email,String pec,String telefono,String cellulare,String indirizzo,String civico,
    String cap,String comune,String provincia,String statoIndirizzo,String note,String stato){}

  public UUID getId(){return id;} public UUID getStudioId(){return studioId;} public String getTipoCodice(){return tipoCodice;}
  public String getNome(){return nome;} public String getCognome(){return cognome;} public LocalDate getDataNascita(){return dataNascita;}
  public String getLuogoNascita(){return luogoNascita;} public String getProvinciaNascita(){return provinciaNascita;} public String getStatoNascita(){return statoNascita;}
  public String getDenominazione(){return denominazione;} public String getFormaGiuridica(){return formaGiuridica;}
  public String getCodiceFiscale(){return codiceFiscale;} public String getCodiceFiscaleNormalizzato(){return codiceFiscaleNormalizzato;}
  public String getPartitaIva(){return partitaIva;} public String getPartitaIvaNormalizzata(){return partitaIvaNormalizzata;}
  public String getEmail(){return email;} public String getPec(){return pec;} public String getTelefono(){return telefono;} public String getCellulare(){return cellulare;}
  public String getIndirizzo(){return indirizzo;} public String getCivico(){return civico;} public String getCap(){return cap;} public String getComune(){return comune;}
  public String getProvincia(){return provincia;} public String getStatoIndirizzo(){return statoIndirizzo;} public String getNote(){return note;} public String getStato(){return stato;}
  public long getVersion(){return version;} public Instant getCreatoIl(){return creatoIl;} public UUID getCreatoDa(){return creatoDa;}
  public Instant getAggiornatoIl(){return aggiornatoIl;} public UUID getAggiornatoDa(){return aggiornatoDa;} public Instant getEliminatoIl(){return eliminatoIl;}
}
