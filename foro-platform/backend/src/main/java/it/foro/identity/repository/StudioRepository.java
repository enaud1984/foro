package it.foro.identity.repository;
import it.foro.identity.domain.Studio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface StudioRepository extends JpaRepository<Studio,UUID> {}
