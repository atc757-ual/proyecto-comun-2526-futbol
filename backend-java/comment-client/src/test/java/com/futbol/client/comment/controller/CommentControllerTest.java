package com.futbol.client.comment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futbol.client.comment.domain.Comment;
import com.futbol.client.comment.repository.CommentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
@TestPropertySource(properties = {
    "spring.cloud.config.enabled=false",
    "spring.cloud.discovery.enabled=false",
    "eureka.client.enabled=false",
    "spring.cloud.config.import-check.enabled=false"
})
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CommentRepository commentRepository;

    private Comment buildComment(Long id) {
        Comment c = new Comment();
        c.setId(id);
        c.setPlayerId(10L);
        c.setUserId("uid-123");
        c.setContent("Buen jugador");
        c.setRating(4);
        return c;
    }

    @Test
    void getAllComments_returnsOkWithList() throws Exception {
        when(commentRepository.findAll()).thenReturn(List.of(buildComment(1L)));

        mockMvc.perform(get("/api/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.code").value("200"))
                .andExpect(jsonPath("$.data[0].content").value("Buen jugador"));
    }

    @Test
    void getCommentsByPlayer_returnsFilteredList() throws Exception {
        when(commentRepository.findByPlayerId(10L)).thenReturn(List.of(buildComment(1L)));

        mockMvc.perform(get("/api/comments/player/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].player_id").value(10));
    }

    @Test
    void createComment_valid_returns201() throws Exception {
        Comment saved = buildComment(1L);
        when(commentRepository.save(any(Comment.class))).thenReturn(saved);

        mockMvc.perform(post("/api/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(buildComment(null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.code").value("200"))
                .andExpect(jsonPath("$.data.content").value("Buen jugador"));
    }

    @Test
    void createComment_missingContent_returns400() throws Exception {
        Comment invalid = new Comment();
        invalid.setPlayerId(10L);
        invalid.setUserId("uid-1");

        mockMvc.perform(post("/api/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.result.code").value("400"));
    }

    @Test
    void deleteComment_exists_returnsOk() throws Exception {
        when(commentRepository.existsById(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/comments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.code").value("200"));
    }

    @Test
    void deleteComment_notFound_returns404() throws Exception {
        when(commentRepository.existsById(99L)).thenReturn(false);

        mockMvc.perform(delete("/api/comments/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.result.code").value("404"));
    }
}
