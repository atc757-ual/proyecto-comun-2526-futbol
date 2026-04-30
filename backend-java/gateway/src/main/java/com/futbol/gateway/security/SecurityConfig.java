package com.futbol.gateway.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf().disable()
            .authorizeExchange()
            // Rutas Públicas
            .pathMatchers("/api/auth/**").permitAll()
            .pathMatchers(HttpMethod.GET, "/api/players/**").permitAll()
            // Rutas Protegidas (Requieren Login)
            .pathMatchers(HttpMethod.POST, "/api/players/*/comments").authenticated()
            // Rutas de Admin
            .pathMatchers(HttpMethod.POST, "/api/players").hasAuthority("ROLE_admin")
            .pathMatchers(HttpMethod.PUT, "/api/players/**").hasAuthority("ROLE_admin")
            .pathMatchers(HttpMethod.DELETE, "/api/players/**").hasAuthority("ROLE_admin")
            // El resto requiere autenticación básica
            .anyExchange().authenticated()
            .and()
            .oauth2ResourceServer()
            .jwt(); // Configuraremos esto para que use nuestro JWTUtil

        return http.build();
    }
}
