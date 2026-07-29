package it.foro.pratiche.repository;

import it.foro.pratiche.domain.Pratica;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PraticaRepository extends JpaRepository<Pratica, UUID> {
  Optional<Pratica> findByIdAndStudioIdAndEliminatoIlIsNull(UUID id, UUID studioId);
  boolean existsByStudioIdAndCodiceAndEliminatoIlIsNull(UUID studioId, String codice);
}
