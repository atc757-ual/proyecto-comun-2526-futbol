package com.futbol.client.player.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futbol.common.dto.ApiResult;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class GatewayAuthFilter extends OncePerRequestFilter {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")
                || path.startsWith("/actuator") || path.startsWith("/webjars")
                || path.startsWith("/api/players/public")
                || path.startsWith("/api/comments/public")) {
            filterChain.doFilter(request, response);
            return;
        }

        String validated = request.getHeader("X-Gateway-Validated");
        String authHeader = request.getHeader("Authorization");
        boolean hasGatewayHeader = "true".equals(validated);
        boolean hasBearer = authHeader != null && authHeader.startsWith("Bearer ");

        if (!hasGatewayHeader && !hasBearer) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            mapper.writeValue(response.getWriter(),
                    ApiResult.error("401", "Acceso denegado: se requiere pasar por el Gateway"));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
