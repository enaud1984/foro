package it.foro.platform.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import it.foro.identity.repository.UserAccountRepository;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtService jwt; private final UserAccountRepository utenti;
  public JwtAuthenticationFilter(JwtService jwt,UserAccountRepository utenti) { this.jwt = jwt; this.utenti=utenti; }
  @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    var value = req.getHeader("Authorization");
    if (value != null && value.startsWith("Bearer ")) {
      try {
        var principal = jwt.parse(value.substring(7));
        SecurityContextHolder.getContext().setAuthentication(
          new UsernamePasswordAuthenticationToken(principal, null, List.of()));
        var metodo=req.getMethod(); var comando="POST".equals(metodo)||"PUT".equals(metodo)||"PATCH".equals(metodo)||"DELETE".equals(metodo);
        var percorso=req.getRequestURI();
        if(comando&&!percorso.startsWith("/api/v1/auth/")&&!"/api/v1/profilo/password".equals(percorso)&&utenti.findById(principal.userId()).map(u->u.isDeveCambiarePassword()).orElse(false)){
          res.setStatus(HttpServletResponse.SC_FORBIDDEN);res.setContentType("application/json");res.getWriter().write("{\"code\":\"CAMBIO_PASSWORD_OBBLIGATORIO\",\"message\":\"Modifica la password temporanea prima di continuare.\"}");return;
        }
      } catch (RuntimeException ignored) { SecurityContextHolder.clearContext(); }
    }
    chain.doFilter(req, res);
  }
}
