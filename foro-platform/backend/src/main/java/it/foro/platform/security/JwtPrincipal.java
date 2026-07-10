package it.foro.platform.security;
import java.util.UUID;
public record JwtPrincipal(UUID userId, UUID studioId, String email) {}
