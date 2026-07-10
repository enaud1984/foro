package it.foro.platform.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
  @Bean OpenAPI foroOpenApi() {
    var bearer = "bearerAuth";
    return new OpenAPI()
      .info(new Info().title("FORO API").version("v1").description("API della Scrivania Digitale FORO"))
      .addSecurityItem(new SecurityRequirement().addList(bearer))
      .components(new Components().addSecuritySchemes(bearer,
        new SecurityScheme().name(bearer).type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
  }
}
