package it.foro.calendario.repository;
import it.foro.calendario.domain.Calendario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CalendarioRepository extends JpaRepository<Calendario,UUID> {
  List<Calendario> findAllByStudioIdAndEliminatoIlIsNullOrderByNome(UUID studioId);
  Optional<Calendario> findByIdAndStudioIdAndEliminatoIlIsNull(UUID id, UUID studioId);
}
