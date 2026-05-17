package com.futbol.externalclient.controller;

import com.futbol.externalfeign.client.NewsFeignClient;
import com.futbol.externalfeign.dto.ApiResult;
import com.futbol.externalfeign.dto.NewsDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
@Tag(name = "News API", description = "Gestión de noticias a través del Bridge CORBA")
public class NewsController {

    private final NewsFeignClient newsClient;

    public NewsController(NewsFeignClient newsClient) {
        this.newsClient = newsClient;
    }

    @GetMapping
    @Operation(summary = "Obtener todas las noticias")
    public ApiResult<List<NewsDTO>> getNews(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role,
            @RequestParam(required = false, defaultValue = "false") Boolean all) {
        // Si all=true y el rol es ADMIN, pedimos todas al Bridge; de lo contrario, retornamos el feed público
        if (Boolean.TRUE.equals(all) && "ADMIN".equalsIgnoreCase(role)) {
            return newsClient.findAll(auth, role);
        } else {
            return newsClient.getFeed(auth);
        }
    }

    @GetMapping("/feed")
    @Operation(summary = "Obtener feed de noticias activas")
    public ApiResult<List<NewsDTO>> getFeed(@RequestHeader(value = "Authorization", required = false) String auth) {
        return newsClient.getFeed(auth);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener noticia por ID")
    public ApiResult<NewsDTO> getNewsById(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String id) {
        return newsClient.findById(auth, id);
    }

    @PostMapping
    @Operation(summary = "Crear noticia (Admin)")
    public ApiResult<NewsDTO> createNews(
            @RequestHeader("Authorization") String auth,
            @RequestHeader("X-User-Role") String role,
            @RequestBody NewsDTO news) {
        return newsClient.create(auth, role, news);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar noticia (Admin)")
    public ApiResult<NewsDTO> updateNews(
            @RequestHeader("Authorization") String auth,
            @RequestHeader("X-User-Role") String role,
            @PathVariable String id,
            @RequestBody NewsDTO news) {
        return newsClient.update(auth, role, id, news);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar noticia (Admin)")
    public ApiResult<Void> deleteNews(
            @RequestHeader("Authorization") String auth,
            @RequestHeader("X-User-Role") String role,
            @PathVariable String id) {
        return newsClient.delete(auth, role, id);
    }
}
