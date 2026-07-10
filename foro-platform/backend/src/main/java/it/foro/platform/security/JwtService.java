package it.foro.platform.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
  private final byte[] secret;
  private final long ttl;
  public JwtService(@Value("${foro.security.jwt-secret}") String secret,
                    @Value("${foro.security.access-token-minutes:15}") long minutes) {
    this.secret = secret.getBytes(StandardCharsets.UTF_8); this.ttl = minutes * 60;
  }
  public String issue(UUID userId, UUID studioId, String email) {
    var now = Instant.now();
    return Jwts.builder().subject(userId.toString()).claim("studioId", studioId.toString())
      .claim("email", email).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(ttl)))
      .signWith(Keys.hmacShaKeyFor(secret)).compact();
  }
  public JwtPrincipal parse(String token) {
    var claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(secret)).build().parseSignedClaims(token).getPayload();
    return new JwtPrincipal(UUID.fromString(claims.getSubject()), UUID.fromString(claims.get("studioId", String.class)),
      claims.get("email", String.class));
  }
}
