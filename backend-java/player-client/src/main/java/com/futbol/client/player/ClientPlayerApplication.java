package com.futbol.client.player;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
class ClientPlayerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClientPlayerApplication.class, args);
	}

}
