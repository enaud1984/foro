package it.foro.identity.api;

import it.foro.identity.domain.*;
import it.foro.identity.repository.*;
import it.foro.platform.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
  private final UserAccountRepository users; private final StudioRepository studios; private final StudioMembershipRepository memberships;
  private final PasswordEncoder encoder; private final JwtService jwt;
  public AuthController(UserAccountRepository u,StudioRepository s,StudioMembershipRepository m,PasswordEncoder e,JwtService j){users=u;studios=s;memberships=m;encoder=e;jwt=j;}

  public record RegisterStudioRequest(@NotBlank String studioName,@NotBlank String displayName,
    @Email @NotBlank String email,@Size(min=12,max=128) String password){}
  public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
  public record AuthResponse(String accessToken, UUID studioId, String displayName){}

  @PostMapping("/register/studio") @Transactional
  public AuthResponse register(@Valid @RequestBody RegisterStudioRequest r){
    if(users.findByEmailIgnoreCase(r.email()).isPresent()) throw new ResponseStatusException(HttpStatus.CONFLICT,"EMAIL_ALREADY_EXISTS");
    var user=users.save(new UserAccount(r.email(),encoder.encode(r.password()),r.displayName()));
    var studio=studios.save(new Studio(r.studioName()));
    memberships.save(new StudioMembership(studio.getId(),user.getId(),"STUDIO_ADMIN","ACTIVE"));
    return new AuthResponse(jwt.issue(user.getId(),studio.getId(),user.getEmail()),studio.getId(),user.getDisplayName());
  }
  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest r){
    var user=users.findByEmailIgnoreCase(r.email()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS"));
    if(!encoder.matches(r.password(),user.getPasswordHash())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"INVALID_CREDENTIALS");
    var membership=memberships.findByUserId(user.getId()).stream().filter(m->"ACTIVE".equals(m.getStatus())).findFirst()
      .orElseThrow(()->new ResponseStatusException(HttpStatus.FORBIDDEN,"NO_ACTIVE_STUDIO"));
    return new AuthResponse(jwt.issue(user.getId(),membership.getStudioId(),user.getEmail()),membership.getStudioId(),user.getDisplayName());
  }
}
