package com.futbol.client.player.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futbol.client.player.domain.Player;
import com.futbol.client.player.repository.PlayerRepository;
import com.futbol.comment.feign.client.CommentClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PlayerController.class)
@TestPropertySource(properties = {
    "spring.cloud.config.enabled=false",
    "spring.cloud.discovery.enabled=false",
    "eureka.client.enabled=false",
    "spring.cloud.config.import-check.enabled=false"
})
class PlayerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PlayerRepository playerRepository;

    @MockBean
    private CommentClient commentClient;

    private Player buildPlayer(Long id) {
        return Player.builder()
                .id(id)
                .name("Lionel Messi")
                .team("Inter Miami")
                .userId("uid-123")
                .build();
    }

    @Test
    void getAllPlayers_returnsOkWithList() throws Exception {
        when(playerRepository.findAll()).thenReturn(List.of(buildPlayer(1L)));

        mockMvc.perform(get("/api/players"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.code").value("200"))
                .andExpect(jsonPath("$.data[0].name").value("Lionel Messi"));
    }

    @Test
    void getAllPlayers_byUserId_filtersCorrectly() throws Exception {
        when(playerRepository.findByUserId("uid-123")).thenReturn(List.of(buildPlayer(1L)));

        mockMvc.perform(get("/api/players").param("userId", "uid-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Lionel Messi"));
    }

    @Test
    void getPlayerById_found_returnsPlayer() throws Exception {
        when(playerRepository.findById(1L)).thenReturn(Optional.of(buildPlayer(1L)));

        mockMvc.perform(get("/api/players/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.code").value("200"))
                .andExpect(jsonPath("$.data.name").value("Lionel Messi"));
    }

    @Test
    void getPlayerById_notFound_returns404() throws Exception {
        when(playerRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/players/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.result.code").value("404"));
    }

    @Test
    void createPlayer_valid_returns201() throws Exception {
        Player player = buildPlayer(null);
        when(playerRepository.save(any(Player.class))).thenReturn(buildPlayer(1L));

        mockMvc.perform(post("/api/players")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(player)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void createPlayer_missingName_returns400() throws Exception {
        Player invalid = Player.builder().team("Real Madrid").userId("uid-1").build();

        mockMvc.perform(post("/api/players")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.result.code").value("400"));
    }

    @Test
    void deletePlayer_exists_returnsOk() throws Exception {
        when(playerRepository.existsById(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/players/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.code").value("200"));
    }

    @Test
    void deletePlayer_notFound_returns404() throws Exception {
        when(playerRepository.existsById(99L)).thenReturn(false);

        mockMvc.perform(delete("/api/players/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.result.code").value("404"));
    }
}
