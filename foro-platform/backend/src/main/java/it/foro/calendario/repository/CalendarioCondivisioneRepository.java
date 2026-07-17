package it.foro.calendario.repository;
import it.foro.calendario.domain.CalendarioCondivisione;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CalendarioCondivisioneRepository extends JpaRepository<CalendarioCondivisione,CalendarioCondivisione.Chiave>{
  List<CalendarioCondivisione> findAllByCalendarioIdIn(Collection<UUID> calendarioIds);
}
