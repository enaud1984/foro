package it.foro.anagrafiche.repository;

import it.foro.anagrafiche.domain.Soggetto;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface SoggettoRepository extends JpaRepository<Soggetto,UUID> {
  Optional<Soggetto> findByIdAndStudioIdAndEliminatoIlIsNull(UUID id,UUID studioId);

  @Query("""
    select s from Soggetto s where s.studioId=:studio and s.eliminatoIl is null
    and (:tipo is null or s.tipoCodice=:tipo) and (:stato is null or s.stato=:stato)
    and (:testo = '' or lower(concat(coalesce(s.nome,''),' ',coalesce(s.cognome,''),' ',coalesce(s.denominazione,''),' ',
      coalesce(s.codiceFiscale,''),' ',coalesce(s.partitaIva,''),' ',coalesce(s.email,''),' ',coalesce(s.pec,''),' ',
      coalesce(s.telefono,''),' ',coalesce(s.cellulare,''))) like concat('%',:testo,'%'))
    """)
  Page<Soggetto> cerca(@Param("studio") UUID studio,@Param("testo") String testo,@Param("tipo") String tipo,@Param("stato") String stato,Pageable pageable);

  @Query("""
    select s from Soggetto s where s.studioId=:studio and s.eliminatoIl is null and (:escluso is null or s.id<>:escluso) and (
      (:cf is not null and s.codiceFiscaleNormalizzato=:cf) or
      (:piva is not null and s.partitaIvaNormalizzata=:piva) or
      (:nome is not null and lower(s.nome)=:nome and lower(s.cognome)=:cognome and s.dataNascita=:nascita) or
      (:denominazione is not null and lower(s.denominazione)=:denominazione)
    )
    order by s.aggiornatoIl desc
    """)
  List<Soggetto> duplicati(@Param("studio") UUID studio,@Param("escluso") UUID escluso,@Param("cf") String cf,
    @Param("piva") String piva,@Param("nome") String nome,@Param("cognome") String cognome,
    @Param("nascita") LocalDate nascita,@Param("denominazione") String denominazione);
}
