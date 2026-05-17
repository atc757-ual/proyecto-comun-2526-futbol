package com.futbol.externalclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = {"com.futbol.externalfeign.client", "com.futbol.player.feign.client"})
public class ExternalClientApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExternalClientApplication.class, args);
    }
}
