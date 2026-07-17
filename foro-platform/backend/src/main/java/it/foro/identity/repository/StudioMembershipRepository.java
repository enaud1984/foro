package it.foro.identity.repository;
import it.foro.identity.domain.StudioMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface StudioMembershipRepository extends JpaRepository<StudioMembership,UUID> {
  List<StudioMembership> findByUserId(UUID userId);
  Optional<StudioMembership> findByStudioIdAndUserId(UUID studioId, UUID userId);
  List<StudioMembership> findAllByStudioIdAndStatus(UUID studioId, String status);
}
