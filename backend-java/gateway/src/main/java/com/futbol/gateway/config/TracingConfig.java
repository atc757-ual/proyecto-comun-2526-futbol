package com.futbol.gateway.config;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.ServerHttpRequest;
import java.util.UUID;

@Configuration
public class TracingConfig {

    public static final String TRANSACTION_ID_HEADER = "X-Transaction-Id";

    @Bean
    public GlobalFilter tracingFilter() {
        return (exchange, chain) -> {
            // 1. Obtener o Generar ID
            String transactionId = exchange.getRequest().getHeaders().getFirst(TRANSACTION_ID_HEADER);
            if (transactionId == null || transactionId.isEmpty()) {
                transactionId = UUID.randomUUID().toString();
            }

            // 2. Inyectar en la petición que va a los microservicios
            String finalId = transactionId;
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header(TRANSACTION_ID_HEADER, finalId)
                    .build();

            // 3. Añadir a los logs de consola del Gateway (Simulado con MDC en Reactor)
            System.out.println("[GATEWAY] [" + finalId + "] Petición: " + exchange.getRequest().getPath());

            // 4. Asegurarnos de que el ID también vuelva en la respuesta al Frontend
            exchange.getResponse().getHeaders().add(TRANSACTION_ID_HEADER, finalId);

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        };
    }
}
