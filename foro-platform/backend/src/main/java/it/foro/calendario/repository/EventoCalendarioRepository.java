package it.foro.calendario.repository;
import it.foro.calendario.domain.EventoCalendario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;
public interface EventoCalendarioRepository extends JpaRepository<EventoCalendario,UUID> {
  List<EventoCalendario> findAllByStudioIdAndInizioLessThanAndFineGreaterThanOrderByInizio(UUID studioId, Instant al, Instant dal);
  Optional<EventoCalendario> findByIdAndStudioId(UUID id,UUID studioId);
}
