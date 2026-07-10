package it.foro.platform.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtService jwt;
  public JwtAuthenticationFilter(JwtService jwt) { this.jwt = jwt; }
  @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    var value = req.getHeader("Authorization");
    if (value != null && value.startsWith("Bearer ")) {
      try {
        var principal = jwt.parse(value.substring(7));
        SecurityContextHolder.getContext().setAuthentication(
          new UsernamePasswordAuthenticationToken(principal, null, List.of()));
      } catch (RuntimeException ignored) { SecurityContextHolder.clearContext(); }
    }
    chain.doFilter(req, res);
  }
}
