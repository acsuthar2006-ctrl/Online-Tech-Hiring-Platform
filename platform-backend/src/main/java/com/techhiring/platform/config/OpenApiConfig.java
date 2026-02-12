package com.techhiring.platform.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI platformOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("Online Tech Hiring Platform API")
            .description("API for managing Interviews, Candidates, and Companies")
            .version("1.0"));
  }
}
