package com.futbol.servlet;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TracingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(TracingFilter.class);
    public static final String TRANSACTION_ID_HEADER = "X-Transaction-Id";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String transactionId = httpRequest.getHeader(TRANSACTION_ID_HEADER);
        if (transactionId == null || transactionId.isEmpty()) {
            transactionId = UUID.randomUUID().toString();
        }

        httpResponse.setHeader(TRANSACTION_ID_HEADER, transactionId);
        request.setAttribute("transactionId", transactionId);

        logger.debug("[CORBA-BRIDGE] [{}] {}", transactionId, httpRequest.getRequestURI());

        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void destroy() {}
}
