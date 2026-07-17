package it.foro.calendario.api;
import it.foro.calendario.repository.NotificaUtenteRepository; import it.foro.platform.security.TenantContext; import org.springframework.web.bind.annotation.*; import java.time.Instant; import java.util.*;
@RestController @RequestMapping("/api/v1/notifiche")
public class NotificaController { private final TenantContext tenant; private final NotificaUtenteRepository notifiche; public NotificaController(TenantContext t,NotificaUtenteRepository n){tenant=t;notifiche=n;}
  public record NotificaResponse(UUID id,String tipo,String titolo,String descrizione,UUID eventoId,boolean letta,Instant creataIl){}
  @GetMapping public List<NotificaResponse> lista(){return notifiche.findTop50ByStudioIdAndUserIdOrderByCreataIlDesc(tenant.studioId(),tenant.userId()).stream().map(n->new NotificaResponse(n.getId(),n.getTipo(),n.getTitolo(),n.getDescrizione(),n.getEventoId(),n.isLetta(),n.getCreataIl())).toList();}
}
