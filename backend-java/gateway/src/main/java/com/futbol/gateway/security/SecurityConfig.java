package com.futbol.gateway.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final JsonAuthenticationEntryPoint authenticationEntryPoint;
    private final JsonAccessDeniedHandler accessDeniedHandler;
    private final JwtWebFilter jwtWebFilter;

    public SecurityConfig(JsonAuthenticationEntryPoint authenticationEntryPoint, JsonAccessDeniedHandler accessDeniedHandler, JwtWebFilter jwtWebFilter) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.jwtWebFilter = jwtWebFilter;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf().disable()
            .exceptionHandling()
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            .and()
            .addFilterAt(jwtWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .authorizeExchange()
            // Rutas Públicas
            .pathMatchers("/api/auth/**").permitAll()
            .pathMatchers("/actuator/**").permitAll()
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
            .anyExchange().authenticated();

        return http.build();
    }
}
