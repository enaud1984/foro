package it.foro.workspace.repository;

import it.foro.workspace.domain.UserDashboardPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserDashboardPreferenceRepository extends JpaRepository<UserDashboardPreference, UUID> {
  Optional<UserDashboardPreference> findByStudioIdAndUserId(UUID studioId, UUID userId);
}
