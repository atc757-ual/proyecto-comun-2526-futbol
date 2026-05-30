package com.futbol.userclient.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {

    @Value("${openapi.title:Users API}")
    private String title;

    @Value("${openapi.description:Gestión y sincronización de usuarios}")
    private String description;

    @Value("${openapi.version:1.0.0}")
    private String version;

    @Value("${openapi.contact.name:Alex Taquila Camasca}")
    private String contactName;

    @Value("${openapi.contact.email:atc757@inlumine.ual.es}")
    private String contactEmail;

    @Value("${openapi.contact.url:https://es.linkedin.com/in/alextaquilacamasca}")
    private String contactUrl;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .info(new Info()
                .title(title)
                .version(version)
                .description(description)
                .contact(new Contact()
                    .name(contactName)
                    .email(contactEmail)
                    .url(contactUrl)));
    }
}
