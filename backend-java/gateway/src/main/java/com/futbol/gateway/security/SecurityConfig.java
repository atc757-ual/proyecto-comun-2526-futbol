package com.futbol.gateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final JsonAuthenticationEntryPoint authenticationEntryPoint;
    private final JsonAccessDeniedHandler accessDeniedHandler;
    private final JwtWebFilter jwtWebFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(
        JsonAuthenticationEntryPoint authenticationEntryPoint,
        JsonAccessDeniedHandler accessDeniedHandler,
        JwtWebFilter jwtWebFilter,
        @Value("#{'${app.cors.allowed-origins:http://localhost:4200,http://localhost:8100}'.split(',')}") List<String> allowedOrigins
    ) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.jwtWebFilter = jwtWebFilter;
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf().disable()
            .cors().and()
            .exceptionHandling()
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            .and()
            .addFilterAt(jwtWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .authorizeExchange()
            // Rutas Públicas
            .pathMatchers("/api/auth/**").permitAll()
            .pathMatchers("/actuator/**").permitAll()
            .pathMatchers(HttpMethod.GET, "/api/players/public/**").permitAll()
            // Rutas Protegidas (Requieren Login)
            .pathMatchers(HttpMethod.GET, "/api/news/**").authenticated()
            .pathMatchers(HttpMethod.POST, "/api/players").authenticated()
            .pathMatchers(HttpMethod.PUT, "/api/players/**").authenticated()
            .pathMatchers(HttpMethod.DELETE, "/api/players/**").authenticated()
            .pathMatchers(HttpMethod.POST, "/api/players/*/comments").authenticated()
            .pathMatchers(HttpMethod.GET, "/api/external/**").authenticated()
            .pathMatchers(HttpMethod.POST, "/api/ai/analyze").authenticated()
            // El resto requiere autenticación básica
            .anyExchange().authenticated();

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins.stream().map(String::trim).filter(origin -> !origin.isEmpty()).toList());
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
