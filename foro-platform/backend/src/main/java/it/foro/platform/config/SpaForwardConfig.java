package it.foro.platform.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardConfig {
  @RequestMapping(value={"/{path:^(?!api|v3|swagger-ui|actuator)[^\\.]*}","/**/{path:^(?!api|v3|swagger-ui|actuator)[^\\.]*}"})
  public String forward(){return "forward:/index.html";}
}
