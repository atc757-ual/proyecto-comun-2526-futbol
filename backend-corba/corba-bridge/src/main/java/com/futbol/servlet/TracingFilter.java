package com.futbol.servlet;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

public class TracingFilter implements Filter {

    public static final String TRANSACTION_ID_HEADER = "X-Transaction-Id";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // 1. Obtener ID de la cabecera (enviado por Gateway)
        String transactionId = httpRequest.getHeader(TRANSACTION_ID_HEADER);
        if (transactionId == null || transactionId.isEmpty()) {
            transactionId = UUID.randomUUID().toString();
        }

        // 2. Añadir a la respuesta para trazabilidad
        httpResponse.setHeader(TRANSACTION_ID_HEADER, transactionId);

        // 3. Imprimir en consola con el ID
        System.out.println("[CORBA-BRIDGE] [" + transactionId + "] Peticion: " + httpRequest.getRequestURI());

        // 4. Guardar en el request por si el Servlet lo necesita
        request.setAttribute("transactionId", transactionId);

        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void destroy() {}
}
