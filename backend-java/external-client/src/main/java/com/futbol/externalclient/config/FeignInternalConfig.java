package com.futbol.externalclient.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignInternalConfig {

    @Bean
    public RequestInterceptor gatewayValidatedInterceptor() {
        return template -> template.header("X-Gateway-Validated", "true");
    }
}
