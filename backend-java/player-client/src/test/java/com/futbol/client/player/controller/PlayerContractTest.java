package com.futbol.client.player.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class PlayerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testApiResultStructure() throws Exception {
        mockMvc.perform(get("/api/players")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").exists())
                .andExpect(jsonPath("$.data").exists())
                // Validar campos de result
                .andExpect(jsonPath("$.result.transactionId").exists())
                .andExpect(jsonPath("$.result.code").value("200"))
                .andExpect(jsonPath("$.result.description").value("OK"));
    }
}
