package it.foro.calendario.application;
import it.foro.calendario.domain.*; import it.foro.calendario.repository.*; import it.foro.identity.repository.*;
import org.springframework.mail.SimpleMailMessage; import org.springframework.mail.javamail.JavaMailSender; import org.springframework.stereotype.Service;
import java.time.ZoneId; import java.time.format.DateTimeFormatter; import java.util.*;
@Service
public class InvitoEventoService {
  private final JavaMailSender mail; private final UserAccountRepository utenti; private final StudioMembershipRepository membership; private final InvitoEventoRepository inviti; private final NotificaUtenteRepository notifiche;
  public InvitoEventoService(JavaMailSender mail,UserAccountRepository utenti,StudioMembershipRepository membership,InvitoEventoRepository inviti,NotificaUtenteRepository notifiche){this.mail=mail;this.utenti=utenti;this.membership=membership;this.inviti=inviti;this.notifiche=notifiche;}
  public void invia(UUID studioId,EventoCalendario evento,List<UUID> invitatiIds){
    var ammessi=membership.findAllByStudioIdAndStatus(studioId,"ACTIVE").stream().map(m->m.getUserId()).collect(java.util.stream.Collectors.toSet());
    var ids=Optional.ofNullable(invitatiIds).orElse(List.of()).stream().distinct().toList(); if(!ammessi.containsAll(ids)) throw new IllegalArgumentException("Invitato non appartenente allo Studio");
    var formato=DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"); var quando=evento.getInizio().atZone(ZoneId.of("Europe/Rome")).format(formato)+" – "+evento.getFine().atZone(ZoneId.of("Europe/Rome")).format(DateTimeFormatter.ofPattern("HH:mm"));
    for(var utente:utenti.findAllById(ids)) { var invito=inviti.save(new InvitoEvento(studioId,evento.getId(),utente.getId(),utente.getEmail())); notifiche.save(new NotificaUtente(studioId,utente.getId(),"APPUNTAMENTO",evento.getTitolo(),"Sei stato invitato · "+quando,evento.getId()));
      try { var m=new SimpleMailMessage();m.setFrom("noreply@foro.local");m.setTo(utente.getEmail());m.setSubject("FORO · Invito: "+evento.getTitolo());m.setText("Sei stato invitato all'appuntamento «"+evento.getTitolo()+"».\n\nQuando: "+quando+"\n\nNote: "+Optional.ofNullable(evento.getNote()).orElse("—")+"\n\nApri FORO per visualizzare i dettagli.");mail.send(m);invito.inviato(); }
      catch(Exception e){invito.fallito(e.getMessage());}
      inviti.save(invito);
    }
  }
}
