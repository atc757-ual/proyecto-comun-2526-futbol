package com.futbol.client.comment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.Components;

@Configuration
public class OpenApiConfig {
	 @Value("${openapi.title}")
	    private String title;

	    @Value("${openapi.description}")
	    private String description;

	    @Value("${openapi.version}")
	    private String version;

	    @Value("${openapi.contact.name}")
	    private String contactName;

	    @Value("${openapi.contact.email}")
	    private String contactEmail;

	    @Value("${openapi.contact.url}")
	    private String contactUrl;

	    @Bean
	    public OpenAPI customOpenAPI() {
	        return new OpenAPI()
	                .components(new Components())
	                .info(new Info()
	                        .title(title)
	                        .description(description)
	                        .version(version)
	                        .contact(new Contact()
	                                .name(contactName)
	                                .email(contactEmail)
	                                .url(contactUrl)
	                        )
	                );
	    }
}
