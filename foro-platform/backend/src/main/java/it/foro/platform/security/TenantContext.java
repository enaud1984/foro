package it.foro.platform.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class TenantContext {
  public UUID studioId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal p)) throw new IllegalStateException("Tenant context assente");
    return p.studioId();
  }
  public UUID userId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal p)) throw new IllegalStateException("User context assente");
    return p.userId();
  }
}
