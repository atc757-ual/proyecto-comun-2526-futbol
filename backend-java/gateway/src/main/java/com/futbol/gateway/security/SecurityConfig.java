package com.futbol.gateway.security;

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

    public SecurityConfig(
        JsonAuthenticationEntryPoint authenticationEntryPoint,
        JsonAccessDeniedHandler accessDeniedHandler,
        JwtWebFilter jwtWebFilter
    ) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.jwtWebFilter = jwtWebFilter;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler))
            .addFilterAt(jwtWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .authorizeExchange(exchange -> exchange
                // Rutas Públicas
                .pathMatchers("/api/auth/**").permitAll()
                .pathMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/webjars/**").permitAll()
                .pathMatchers("/actuator/health").permitAll()
                .pathMatchers("/actuator/**").authenticated()
                .pathMatchers(HttpMethod.GET, "/api/players/public/**").permitAll()
                .pathMatchers("/api/comments/public/**").permitAll()
                // Rutas Protegidas (Requieren Login)
                .pathMatchers(HttpMethod.GET, "/api/news/**").authenticated()
                .pathMatchers(HttpMethod.POST, "/api/players").authenticated()
                .pathMatchers(HttpMethod.PUT, "/api/players/**").authenticated()
                .pathMatchers(HttpMethod.DELETE, "/api/players/**").authenticated()
                .pathMatchers(HttpMethod.POST, "/api/players/*/comments").authenticated()
                .pathMatchers(HttpMethod.GET, "/api/external/**").authenticated()
                .pathMatchers(HttpMethod.POST, "/api/ai/analyze").authenticated()
                // El resto requiere autenticación básica
                .anyExchange().authenticated());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.addAllowedMethod("*");
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-User-Role", "X-Transaction-Id", "Accept"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
