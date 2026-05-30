package com.futbol.externalclient.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {

    @Bean
    public FilterRegistrationBean<GatewayAuthFilter> gatewayAuthFilter() {
        FilterRegistrationBean<GatewayAuthFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new GatewayAuthFilter());
        bean.addUrlPatterns("/api/*");
        bean.setOrder(1);
        return bean;
    }
}
