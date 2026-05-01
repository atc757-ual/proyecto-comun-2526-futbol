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

    private final JsonAuthenticationEntryPoint authenticationEntryPoint;
    private final JsonAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(JsonAuthenticationEntryPoint authenticationEntryPoint, JsonAccessDeniedHandler accessDeniedHandler) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf().disable()
            .exceptionHandling()
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            .and()
            .authorizeExchange()
            // Rutas Públicas
            .pathMatchers("/api/auth/**").permitAll()
            .pathMatchers(HttpMethod.GET, "/api/players/public").permitAll()
            // Rutas Protegidas (Requieren Login)
            .pathMatchers(HttpMethod.POST, "/api/players/*/comments").authenticated()
            .pathMatchers(HttpMethod.POST, "/api/ai/analyze").authenticated()
            .pathMatchers(HttpMethod.GET, "/api/external/players").authenticated()
            // Rutas de Admin
            .pathMatchers(HttpMethod.POST, "/api/players").hasAuthority("ROLE_admin")
            .pathMatchers(HttpMethod.PUT, "/api/players/**").hasAuthority("ROLE_admin")
            .pathMatchers(HttpMethod.DELETE, "/api/players/**").hasAuthority("ROLE_admin")
            // El resto requiere autenticación básica
            .anyExchange().authenticated()
            .and()
            .oauth2ResourceServer()
            .jwt();

        return http.build();
    }
}
