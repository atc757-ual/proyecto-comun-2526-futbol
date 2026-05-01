package com.futbol.common.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.UUID;

/**
 * Filtro de Tracing para Microservicios Spring Boot.
 * Captura el transactionId y lo pone en el MDC para que aparezca en los logs.
 */
@Component
public class CommonTracingFilter implements Filter {

    public static final String TRANSACTION_ID_HEADER = "X-Transaction-Id";
    public static final String MDC_KEY = "transactionId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            String transactionId = httpRequest.getHeader(TRANSACTION_ID_HEADER);
            
            if (transactionId == null || transactionId.isEmpty()) {
                transactionId = UUID.randomUUID().toString();
            }

            // MDC permite que el ID aparezca automáticamente en el logback/log4j
            MDC.put(MDC_KEY, transactionId);
            
            if (response instanceof HttpServletResponse) {
                ((HttpServletResponse) response).setHeader(TRANSACTION_ID_HEADER, transactionId);
            }
        }

        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
